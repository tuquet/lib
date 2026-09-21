<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue?: number | string | null;
    placeholder?: string;
    disabled?: boolean;
    readOnly?: boolean;
    prefix?: string;
    suffix?: string;
    min?: number;
    max?: number;
    step?: number;
    integer?: boolean;
  }>(),
  {
    modelValue: 0,
    placeholder: '',
    disabled: false,
    readOnly: false,
    prefix: '',
    suffix: '',
    step: 1,
    integer: false,
  }
);

const emit = defineEmits<{
  'update:modelValue': [val: number | null];
  change: [val: number | null];
}>();

const displayValue = computed(() =>
  props.modelValue !== undefined && props.modelValue !== null ? String(props.modelValue) : ''
);

function handleInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value.trim();
  if (raw === '') {
    emit('update:modelValue', null);
    emit('change', null);
    return;
  }
  const parsed = props.integer ? parseInt(raw, 10) : parseFloat(raw);
  if (!Number.isNaN(parsed)) {
    emit('update:modelValue', parsed);
    emit('change', parsed);
  }
}
</script>

<template>
  <div class="relative flex items-center w-full">
    <span
      v-if="prefix"
      class="absolute left-3 text-sm text-muted-foreground select-none pointer-events-none font-mono font-medium"
    >
      {{ prefix }}
    </span>

    <input
      type="number"
      :inputmode="integer ? 'numeric' : 'decimal'"
      :value="displayValue"
      :min="min"
      :max="max"
      :step="step"
      :placeholder="placeholder"
      :disabled="disabled || readOnly"
      class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-base sm:text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px] transition-colors"
      :class="[prefix ? 'pl-8' : 'pl-3', suffix ? 'pr-8' : 'pr-3']"
      @input="handleInput"
    />

    <span
      v-if="suffix"
      class="absolute right-3 text-sm text-muted-foreground select-none pointer-events-none font-mono font-medium"
    >
      {{ suffix }}
    </span>
  </div>
</template>
