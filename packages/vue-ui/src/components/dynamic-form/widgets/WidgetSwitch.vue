<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue?: boolean | null;
    disabled?: boolean;
    readOnly?: boolean;
    label?: string;
  }>(),
  {
    modelValue: false,
    disabled: false,
    readOnly: false,
    label: '',
  }
);

const emit = defineEmits<{
  'update:modelValue': [val: boolean];
  change: [val: boolean];
}>();

const checked = computed(() => Boolean(props.modelValue));

function toggle() {
  if (props.disabled || props.readOnly) return;
  const next = !checked.value;
  emit('update:modelValue', next);
  emit('change', next);
}
</script>

<template>
  <div
    class="inline-flex items-center gap-3 cursor-pointer select-none py-1"
    :class="{ 'opacity-50 cursor-not-allowed': disabled || readOnly }"
    @click="toggle"
  >
    <button
      type="button"
      role="switch"
      :aria-checked="checked"
      :disabled="disabled || readOnly"
      class="peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed"
      :class="checked ? 'bg-primary' : 'bg-muted'"
    >
      <span
        class="pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform"
        :class="checked ? 'translate-x-5' : 'translate-x-0'"
      />
    </button>
    <span v-if="label" class="text-sm font-medium text-foreground">
      {{ label }}
    </span>
  </div>
</template>
