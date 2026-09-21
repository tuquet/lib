<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type {
  FieldOverridesMap,
  NormalizedFieldDefinition,
  OpenAPISchema,
} from '@/schema/types.js';
import { normalizeOpenAPISchema } from '@/schema/normalizer.js';
import {
  validateFieldValue,
  validateRecord,
  type ValidationErrorMap,
  type ValidationMessageTemplates,
} from '@/schema/validator.js';

import { resolveWidget, type WidgetComponentMap } from './registry.js';
import DynamicFormField from './DynamicFormField.vue';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-vue-next';

const props = withDefaults(
  defineProps<{
    schema?: OpenAPISchema;
    fields?: NormalizedFieldDefinition[];
    modelValue?: Record<string, any>;
    fieldOverrides?: FieldOverridesMap;
    validateOnChange?: boolean;
    showSubmitButton?: boolean;
    showCancelButton?: boolean;
    submitText?: string;
    cancelText?: string;
    customWidgets?: Partial<WidgetComponentMap>;
    layout?: 'stack' | 'grid';
    validationMessages?: Partial<ValidationMessageTemplates>;
  }>(),

  {
    schema: undefined,
    fields: undefined,
    modelValue: () => ({}),
    fieldOverrides: () => ({}),
    validateOnChange: true,
    showSubmitButton: true,
    showCancelButton: true,
    submitText: 'Lưu thay đổi',
    cancelText: 'Hủy',
    customWidgets: () => ({}),
    layout: 'stack',
  }
);

const emit = defineEmits<{
  'update:modelValue': [values: Record<string, any>];
  change: [key: string, value: any, values: Record<string, any>];
  submit: [values: Record<string, any>, isDirty: boolean];
  cancel: [];
  dirty: [isDirty: boolean, changedKeys: string[]];
}>();

// 1. Resolve normalized fields from schema or direct fields prop
const normalizedFields = computed<NormalizedFieldDefinition[]>(() => {
  if (props.fields && props.fields.length > 0) {
    return props.fields;
  }
  if (props.schema) {
    return normalizeOpenAPISchema(props.schema, { overrides: props.fieldOverrides });
  }
  return [];
});

// 2. Draft values state for responsive editing
const initialSnapshot = ref<Record<string, any>>({ ...props.modelValue });
const draftValues = ref<Record<string, any>>({ ...props.modelValue });
const errors = ref<ValidationErrorMap>({});

watch(
  () => props.modelValue,
  (newVal) => {
    initialSnapshot.value = { ...newVal };
    draftValues.value = { ...newVal };
    errors.value = {};
  },
  { deep: true }
);

// 3. Dirty tracking
const changedKeys = computed(() => {
  const keys: string[] = [];
  for (const field of normalizedFields.value) {
    const orig = initialSnapshot.value[field.key];
    const curr = draftValues.value[field.key];
    if (orig !== curr) {
      keys.push(field.key);
    }
  }
  return keys;
});

const isDirty = computed(() => changedKeys.value.length > 0);

watch(
  [isDirty, changedKeys],
  ([dirty, keys]) => {
    emit('dirty', dirty, keys);
  },
  { immediate: true }
);

// 4. Update Field Handler
function handleFieldUpdate(field: NormalizedFieldDefinition, value: any) {
  draftValues.value[field.key] = value;
  emit('update:modelValue', { ...draftValues.value });
  emit('change', field.key, value, { ...draftValues.value });

  if (props.validateOnChange) {
    const err = validateFieldValue(value, field, draftValues.value, props.validationMessages);
    if (err) {
      errors.value[field.key] = err;
    } else {
      delete errors.value[field.key];
    }
  }
}

// 5. Submit Handler
function validate() {
  const result = validateRecord(draftValues.value, normalizedFields.value, props.validationMessages);
  errors.value = result.errors;
  return result;
}

function handleSubmit() {
  const result = validate();
  if (!result.isValid) {
    return;
  }
  emit('submit', { ...draftValues.value }, isDirty.value);
}

function handleCancel() {
  draftValues.value = { ...initialSnapshot.value };
  errors.value = {};
  emit('cancel');
}

// Expose public methods
defineExpose({
  validate,
  submit: handleSubmit,
  reset: handleCancel,
  isDirty,
  changedKeys,
  values: draftValues,
  errors,
});
</script>

<template>
  <form class="flex flex-col gap-4 w-full" @submit.prevent="handleSubmit">
    <!-- Slot Header -->
    <slot name="header" :is-dirty="isDirty" :changed-keys="changedKeys" />

    <!-- Form Fields Container -->
    <div
      class="gap-4"
      :class="[
        layout === 'grid'
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12'
          : 'flex flex-col',
      ]"
    >
      <template v-for="field in normalizedFields" :key="field.key">
        <div
          v-if="!field.hidden"
          :class="[
            layout === 'grid'
              ? `col-span-1 sm:col-span-1 lg:col-span-${Math.min(12, Math.max(1, field.colSpan || 12))}`
              : 'w-full',
          ]"
        >
          <!-- Scoped Slot: Custom Field Override (Tier 5) -->
          <slot
            :name="`field-${field.key}`"
            :field="field"
            :value="draftValues[field.key]"
            :error="errors[field.key]"
            :update="(val: any) => handleFieldUpdate(field, val)"
          >
            <!-- General Field Wrapper -->
            <DynamicFormField :field="field" :error="errors[field.key]">
              <!-- Dynamic Widget Render -->
              <component
                :is="resolveWidget(field, customWidgets)"
                :model-value="draftValues[field.key]"
                :options="field.enumOptions || []"
                :min="field.min"
                :max="field.max"
                :step="field.step"
                :prefix="field.prefix"
                :suffix="field.suffix"
                :placeholder="field.placeholder"
                :disabled="field.disabled"
                :read-only="field.readOnly"
                @update:model-value="(val: any) => handleFieldUpdate(field, val)"
              />
            </DynamicFormField>
          </slot>
        </div>
      </template>
    </div>

    <!-- Form Footer Actions -->
    <slot
      name="footer"
      :submit="handleSubmit"
      :cancel="handleCancel"
      :is-dirty="isDirty"
      :changed-count="changedKeys.length"
    >
      <div
        v-if="showSubmitButton || showCancelButton"
        class="flex items-center justify-end gap-3 pt-3 border-t border-border/60"
      >
        <Button
          v-if="showCancelButton"
          type="button"
          variant="outline"
          class="min-h-[44px] px-4 text-sm"
          @click="handleCancel"
        >
          <X class="h-4 w-4 mr-1.5" />
          <span>{{ cancelText }}</span>
        </Button>

        <Button
          v-if="showSubmitButton"
          type="submit"
          class="min-h-[44px] px-5 text-sm gap-2 shadow-xs"
          :variant="isDirty ? 'default' : 'secondary'"
        >
          <Check class="h-4 w-4" />
          <span>{{ submitText }}</span>
          <span
            v-if="isDirty"
            class="px-1.5 py-0.2 rounded-full text-[11px] font-bold bg-background/20"
          >
            {{ changedKeys.length }}
          </span>
        </Button>
      </div>
    </slot>
  </form>
</template>
