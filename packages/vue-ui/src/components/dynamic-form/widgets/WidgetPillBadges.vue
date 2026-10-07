<script setup lang="ts">
import { Check } from 'lucide-vue-next';

export interface PillOption {
  label: string;
  value: string | number | boolean;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

const props = withDefaults(
  defineProps<{
    modelValue?: string | number | boolean | null;
    options: PillOption[];
    disabled?: boolean;
    readOnly?: boolean;
  }>(),
  {
    modelValue: '',
    disabled: false,
    readOnly: false,
  }
);

const emit = defineEmits<{
  'update:modelValue': [val: string | number | boolean];
  change: [val: string | number | boolean];
}>();

function selectOption(val: string | number | boolean) {
  if (props.disabled || props.readOnly) return;
  emit('update:modelValue', val);
  emit('change', val);
}

function getDotColor(variant?: string): string {
  switch (variant) {
    case 'destructive':
      return 'bg-destructive';
    case 'secondary':
      return 'bg-amber-500';
    default:
      return 'bg-emerald-500';
  }
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-2 w-full py-0.5">
    <button
      v-for="opt in options"
      :key="String(opt.value)"
      type="button"
      :disabled="disabled || readOnly"
      class="inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-medium transition-all min-h-[40px] select-none border focus:outline-hidden disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
      :class="[
        modelValue === opt.value
          ? 'bg-primary text-primary-foreground border-primary shadow-xs ring-2 ring-primary/20'
          : 'bg-muted/50 text-foreground border-border/80 hover:bg-muted hover:border-border',
      ]"
      @click="selectOption(opt.value)"
    >
      <span
        class="h-2 w-2 rounded-full shrink-0 transition-colors"
        :class="modelValue === opt.value ? 'bg-primary-foreground' : getDotColor(opt.variant)"
      />
      <span>{{ opt.label }}</span>
      <Check
        v-if="modelValue === opt.value"
        class="h-3.5 w-3.5 ml-0.5 shrink-0"
      />
    </button>
  </div>
</template>
