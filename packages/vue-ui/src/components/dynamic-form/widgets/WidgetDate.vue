<script setup lang="ts">
import { computed } from 'vue';
import { Calendar as CalendarIcon } from 'lucide-vue-next';

const props = withDefaults(
  defineProps<{
    modelValue?: string | null;
    disabled?: boolean;
    readOnly?: boolean;
    includeTime?: boolean;
  }>(),
  {
    modelValue: '',
    disabled: false,
    readOnly: false,
    includeTime: false,
  }
);

const emit = defineEmits<{
  'update:modelValue': [val: string];
  change: [val: string];
}>();

const formattedValue = computed(() => {
  if (!props.modelValue) return '';
  const d = new Date(props.modelValue);
  if (Number.isNaN(d.getTime())) return String(props.modelValue);
  if (props.includeTime) {
    return d.toISOString().slice(0, 16);
  }
  return d.toISOString().slice(0, 10);
});

function handleInput(e: Event) {
  const val = (e.target as HTMLInputElement).value;
  if (!val) {
    emit('update:modelValue', '');
    emit('change', '');
    return;
  }
  const iso = new Date(val).toISOString();
  emit('update:modelValue', iso);
  emit('change', iso);
}
</script>

<template>
  <div class="relative flex items-center w-full">
    <CalendarIcon class="absolute left-3.5 h-4 w-4 text-muted-foreground pointer-events-none select-none" />

    <input
      :type="includeTime ? 'datetime-local' : 'date'"
      :value="formattedValue"
      :disabled="disabled || readOnly"
      class="flex w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-base sm:text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px] transition-colors"
      @input="handleInput"
    />
  </div>
</template>
