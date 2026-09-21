<script setup lang="ts">
import { computed, ref, watch } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue?: number | string | null;
    placeholder?: string;
    disabled?: boolean;
    readOnly?: boolean;
    prefix?: string;
    currency?: string;
    min?: number;
    max?: number;
    step?: number;
  }>(),
  {
    modelValue: 0,
    placeholder: '0.00',
    disabled: false,
    readOnly: false,
    prefix: '$',
    currency: 'USD',
    min: 0,
    step: 10,
  }
);

const emit = defineEmits<{
  'update:modelValue': [val: number];
  change: [val: number];
}>();

const inputVal = ref<string>(
  props.modelValue !== undefined && props.modelValue !== null ? String(props.modelValue) : ''
);

watch(
  () => props.modelValue,
  (newVal) => {
    inputVal.value = newVal !== undefined && newVal !== null ? String(newVal) : '';
  }
);

function handleInput(e: Event) {
  const val = (e.target as HTMLInputElement).value;
  inputVal.value = val;
  const num = parseFloat(val);
  if (!Number.isNaN(num)) {
    emit('update:modelValue', num);
    emit('change', num);
  }
}

const formattedPreview = computed(() => {
  const num = parseFloat(inputVal.value);
  if (Number.isNaN(num)) return '';
  return `${props.prefix || ''}${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
});
</script>

<template>
  <div class="flex flex-col gap-1 w-full">
    <div class="relative flex items-center w-full">
      <span
        v-if="prefix"
        class="absolute left-3.5 text-sm font-semibold text-muted-foreground select-none pointer-events-none"
      >
        {{ prefix }}
      </span>

      <input
        type="number"
        inputmode="decimal"
        step="any"
        :value="inputVal"
        :min="min"
        :max="max"
        :placeholder="placeholder"
        :disabled="disabled || readOnly"
        class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-base sm:text-sm font-mono font-medium ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px] transition-colors"
        :class="prefix ? 'pl-8' : 'pl-3'"
        @input="handleInput"
      />
    </div>

    <!-- Live formatted preview hint -->
    <div v-if="formattedPreview" class="flex items-center justify-between px-1 text-[11px] text-muted-foreground">
      <span>Định dạng:</span>
      <span class="font-mono font-semibold text-foreground">{{ formattedPreview }}</span>
    </div>
  </div>
</template>
