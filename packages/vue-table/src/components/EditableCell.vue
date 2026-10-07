<script setup lang="ts" generic="T extends string | number">
import {
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
} from '@tuquet/vue-ui';
import { Check, ChevronDown, Pencil, X } from 'lucide-vue-next';
import { computed, nextTick, ref, watch } from 'vue';
import { useMediaQuery } from '@vueuse/core';
import { useTableLocale } from '../locale/index.js';

export interface SelectOption<V = string | number> {
  label: string;
  value: V;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  badgeClass?: string;
}

export interface EditableCellLabels {
  clickToEdit?: string;
  clickToChangeStatus?: string;
  save?: string;
  cancel?: string;
  edited?: string;
}

export interface EditableCellProps<T> {
  modelValue: T;
  type?: 'text' | 'number' | 'select';
  options?: SelectOption<T>[];
  placeholder?: string;
  prefix?: string;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  /**
   * Automatically disable inline editing on mobile viewports (<768px)
   * in favor of Mobile Bottom Sheet Drawer / Form Sheet.
   * Defaults to true.
   */
  disableOnMobile?: boolean;
  validate?: (val: T) => string | null;
  /**
   * Show a subtle corner indicator when the cell has been edited
   */
  showDirtyIndicator?: boolean;
  /**
   * Configurable accessible action labels and tooltips
   */
  labels?: EditableCellLabels;
}

const props = withDefaults(defineProps<EditableCellProps<T>>(), {
  type: 'text',
  options: () => [],
  placeholder: '',
  prefix: '',
  suffix: '',
  disabled: false,
  disableOnMobile: true,
  showDirtyIndicator: true,
});

const locale = useTableLocale();

const resolvedLabels = computed(() => ({
  clickToEdit: props.labels?.clickToEdit || locale.value.messages.cell.clickToEdit,
  clickToChangeStatus: props.labels?.clickToChangeStatus || locale.value.messages.cell.clickToChangeStatus,
  save: props.labels?.save || locale.value.messages.cell.save,
  cancel: props.labels?.cancel || locale.value.messages.cell.cancel,
  edited: props.labels?.edited || locale.value.messages.cell.edited,
}));


const emit = defineEmits<{
  'update:modelValue': [val: T];
  change: [newVal: T, oldVal: T];
}>();

const isMobile = useMediaQuery('(max-width: 768px)');
const isEffectivelyDisabled = computed(() => {
  if (props.disabled) return true;
  if (props.disableOnMobile && isMobile.value) return true;
  return false;
});

const isEditing = ref(false);
const editValue = ref<T | string | number>(props.modelValue);
const inputRef = ref<any>(null);
const isDirty = ref(false);
const errorMessage = ref<string | null>(null);

watch(
  () => props.modelValue,
  (val) => {
    editValue.value = val;
  }
);

function handleUpdateValue(val: string | number) {
  editValue.value = props.type === 'number' ? (val === '' ? '' : Number(val)) : (val as T);
}

const currentOption = computed(() => {
  if (props.type !== 'select') return null;
  return props.options.find((opt) => opt.value === props.modelValue);
});

function startEdit() {
  if (isEffectivelyDisabled.value) return;
  editValue.value = props.modelValue;
  errorMessage.value = null;
  isEditing.value = true;
  nextTick(() => {
    const raw = inputRef.value;
    const el =
      raw?.$el instanceof HTMLElement
        ? (raw.$el.querySelector('input') || raw.$el)
        : raw instanceof HTMLElement
          ? raw
          : null;
    if (el && typeof (el as any).focus === 'function') {
      (el as any).focus();
      if (typeof (el as any).select === 'function') {
        (el as any).select();
      }
    }
  });
}

function commit() {
  if (!isEditing.value) return;

  let valToSave: any = editValue.value;
  if (props.type === 'number') {
    if (valToSave === '' || valToSave === null || valToSave === undefined) {
      valToSave = props.min !== undefined ? props.min : 0;
    } else {
      valToSave = Number(valToSave);
      if (Number.isNaN(valToSave)) {
        valToSave = props.modelValue;
      }
    }
    if (props.min !== undefined) valToSave = Math.max(props.min, valToSave);
    if (props.max !== undefined) valToSave = Math.min(props.max, valToSave);
  }

  if (props.validate) {
    const err = props.validate(valToSave);
    if (err) {
      errorMessage.value = err;
      return;
    }
  }

  const oldVal = props.modelValue;
  if (valToSave !== oldVal) {
    isDirty.value = true;
    emit('update:modelValue', valToSave);
    emit('change', valToSave, oldVal);
  }
  isEditing.value = false;
  errorMessage.value = null;
}

function cancel() {
  editValue.value = props.modelValue;
  isEditing.value = false;
  errorMessage.value = null;
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault();
    e.stopPropagation();
    commit();
  } else if (e.key === 'Escape') {
    e.preventDefault();
    e.stopPropagation();
    cancel();
  }
}

function handleSelectOption(val: T) {
  if (props.disabled) return;
  const oldVal = props.modelValue;
  if (val !== oldVal) {
    isDirty.value = true;
    emit('update:modelValue', val);
    emit('change', val, oldVal);
  }
}
</script>

<template>
  <!-- Select Mode (Dropdown badge) -->
  <div v-if="type === 'select'" class="relative inline-flex items-center">
    <!-- On mobile or disabled: show clean non-interactive badge so row click opens drawer -->
    <template v-if="isEffectivelyDisabled">
      <slot name="display" :option="currentOption" :value="modelValue">
        <Badge
          :variant="currentOption?.variant || 'default'"
          class="gap-1 transition-all select-none pointer-events-none"
        >
          <span>{{ currentOption?.label || modelValue }}</span>
        </Badge>
      </slot>
    </template>

    <DropdownMenu v-else>
      <DropdownMenuTrigger as-child :disabled="disabled">
        <button
          type="button"
          class="group/edit inline-flex items-center gap-1.5 rounded-full text-left transition-all hover:ring-2 hover:ring-primary/20 focus:outline-hidden disabled:opacity-50 disabled:cursor-not-allowed"
          :title="disabled ? undefined : resolvedLabels.clickToChangeStatus"
        >
          <slot name="display" :option="currentOption" :value="modelValue">
            <Badge
              :variant="currentOption?.variant || 'default'"
              class="cursor-pointer gap-1 transition-all"
            >
              <span>{{ currentOption?.label || modelValue }}</span>
              <ChevronDown class="h-3 w-3 opacity-60 group-hover/edit:opacity-100" />
            </Badge>
          </slot>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" class="w-36">
        <DropdownMenuItem
          v-for="opt in options"
          :key="String(opt.value)"
          class="flex items-center justify-between cursor-pointer text-xs py-1.5"
          @click="handleSelectOption(opt.value)"
        >
          <div class="flex items-center gap-2">
            <span
              class="h-2 w-2 rounded-full"
              :class="
                opt.variant === 'destructive'
                  ? 'bg-destructive'
                  : opt.variant === 'secondary'
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
              "
            />
            <span>{{ opt.label }}</span>
          </div>
          <Check v-if="opt.value === modelValue" class="h-3.5 w-3.5 text-primary" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <!-- Dirty Edited Indicator -->
    <span
      v-if="showDirtyIndicator && isDirty"
      class="absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full bg-blue-500 shadow-2xs"
      :title="resolvedLabels.edited"
    />

  </div>

  <!-- Text / Number Mode -->
  <div v-else class="relative w-full">
    <!-- Active Editing State -->
    <div
      v-if="isEditing"
      class="flex items-center gap-1 w-full"
      @click.stop
    >
      <div class="relative flex-1 flex items-center">
        <span
          v-if="prefix"
          class="absolute left-2 text-xs text-muted-foreground font-mono select-none"
        >
          {{ prefix }}
        </span>
        <Input
          ref="inputRef"
          :model-value="editValue"
          :type="type === 'number' ? 'number' : 'text'"
          :min="min"
          :max="max"
          :step="step"
          :placeholder="placeholder"
          :aria-invalid="!!errorMessage"
          class="h-7 text-xs font-mono bg-background border-primary shadow-xs"
          :class="[prefix ? 'pl-5' : 'pl-2', suffix ? 'pr-6' : 'pr-2']"
          @update:model-value="handleUpdateValue"
          @keydown="handleKeyDown"
          @blur="commit"
        />
        <span
          v-if="suffix"
          class="absolute right-2 text-xs text-muted-foreground font-mono select-none"
        >
          {{ suffix }}
        </span>
      </div>

      <button
        type="button"
        class="h-6 w-6 shrink-0 inline-flex items-center justify-center rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-2xs"
        :title="resolvedLabels.save"
        @mousedown.prevent="commit"
      >
        <Check class="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        class="h-6 w-6 shrink-0 inline-flex items-center justify-center rounded bg-muted text-muted-foreground hover:text-foreground transition-colors"
        :title="resolvedLabels.cancel"
        @mousedown.prevent="cancel"
      >
        <X class="h-3.5 w-3.5" />
      </button>
    </div>

    <!-- Read / Display State -->
    <div
      v-else
      class="group/cell relative flex items-center justify-between gap-1.5 px-1.5 py-0.5 -mx-1.5 -my-0.5 rounded transition-all"
      :class="[
        isEffectivelyDisabled
          ? ''
          : 'cursor-pointer hover:bg-muted/60 hover:ring-1 hover:ring-primary/30',
        disabled ? 'opacity-60 cursor-not-allowed' : ''
      ]"
      :title="isEffectivelyDisabled ? undefined : resolvedLabels.clickToEdit"
      @click="startEdit"
    >
      <slot name="display" :value="modelValue">
        <span class="truncate text-xs font-medium text-foreground">
          <template v-if="prefix">{{ prefix }}</template>
          {{ modelValue !== null && modelValue !== undefined ? modelValue : placeholder }}
          <template v-if="suffix">{{ suffix }}</template>
        </span>
      </slot>

      <Pencil
        v-if="!isEffectivelyDisabled"
        class="h-3 w-3 text-muted-foreground opacity-0 group-hover/cell:opacity-80 transition-opacity shrink-0 ml-auto"
      />

      <!-- Dirty Edited Indicator -->
      <span
        v-if="showDirtyIndicator && isDirty"
        class="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-blue-500 shadow-2xs"
        :title="resolvedLabels.edited"
      />

    </div>

    <!-- Inline Validation Error Tooltip -->
    <div
      v-if="errorMessage"
      role="alert"
      aria-live="assertive"
      class="absolute top-full left-0 z-50 mt-1 px-2 py-0.5 rounded bg-destructive text-destructive-foreground text-[10px] font-medium shadow-md"
    >
      {{ errorMessage }}
    </div>
  </div>
</template>
