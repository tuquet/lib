<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue?: number | null;
    min?: number;
    max?: number;
    step?: number;
    suffix?: string;
    disabled?: boolean;
    readOnly?: boolean;
  }>(),
  {
    modelValue: 0,
    min: 0,
    max: 100,
    step: 5,
    suffix: '%',
    disabled: false,
    readOnly: false,
  }
);

const emit = defineEmits<{
  'update:modelValue': [val: number];
  change: [val: number];
}>();

const current = computed(() => Number(props.modelValue) || props.min);

function updateVal(val: number) {
  if (props.disabled || props.readOnly) return;
  const clamped = Math.max(props.min, Math.min(props.max, val));
  emit('update:modelValue', clamped);
  emit('change', clamped);
}

function handleSliderInput(e: Event) {
  const val = Number((e.target as HTMLInputElement).value);
  updateVal(val);
}

function stepDown() {
  updateVal(current.value - props.step);
}

function stepUp() {
  updateVal(current.value + props.step);
}
</script>

<template>
  <div class="flex flex-col gap-2 w-full select-none py-1">
    <div class="flex items-center justify-between text-xs">
      <span class="text-muted-foreground font-mono">{{ min }}{{ suffix }}</span>
      <span class="font-mono font-bold text-sm text-foreground px-2 py-0.5 rounded bg-muted/60">
        {{ current }}{{ suffix }}
      </span>
      <span class="text-muted-foreground font-mono">{{ max }}{{ suffix }}</span>
    </div>

    <!-- Touch Slider & Quick Steppers -->
    <div class="flex items-center gap-3">
      <button
        type="button"
        :disabled="disabled || readOnly || current <= min"
        class="h-9 w-9 shrink-0 inline-flex items-center justify-center rounded-md border border-input bg-background font-mono text-base font-semibold hover:bg-muted active:scale-95 disabled:opacity-40 transition-all"
        title="Giảm"
        @click="stepDown"
      >
        -
      </button>

      <div class="relative flex-1 flex items-center py-2">
        <input
          type="range"
          :value="current"
          :min="min"
          :max="max"
          :step="step"
          :disabled="disabled || readOnly"
          class="w-full h-2.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary focus:outline-hidden disabled:opacity-50"
          @input="handleSliderInput"
        />
      </div>

      <button
        type="button"
        :disabled="disabled || readOnly || current >= max"
        class="h-9 w-9 shrink-0 inline-flex items-center justify-center rounded-md border border-input bg-background font-mono text-base font-semibold hover:bg-muted active:scale-95 disabled:opacity-40 transition-all"
        title="Tăng"
        @click="stepUp"
      >
        +
      </button>
    </div>
  </div>
</template>
