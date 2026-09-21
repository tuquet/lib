<script setup lang="ts">
import { computed } from 'vue';
import { X } from 'lucide-vue-next';

const props = withDefaults(
  defineProps<{
    modelValue?: string | number | null;
    placeholder?: string;
    disabled?: boolean;
    readOnly?: boolean;
    prefix?: string;
    suffix?: string;
    type?: string;
    clearable?: boolean;
  }>(),
  {
    modelValue: '',
    placeholder: '',
    disabled: false,
    readOnly: false,
    prefix: '',
    suffix: '',
    type: 'text',
    clearable: true,
  }
);

const emit = defineEmits<{
  'update:modelValue': [val: string];
  change: [val: string];
}>();

const stringValue = computed(() =>
  props.modelValue !== undefined && props.modelValue !== null ? String(props.modelValue) : ''
);

function handleInput(e: Event) {
  const val = (e.target as HTMLInputElement).value;
  emit('update:modelValue', val);
  emit('change', val);
}

function handleClear() {
  emit('update:modelValue', '');
  emit('change', '');
}
</script>

<template>
  <div class="relative flex items-center w-full">
    <span
      v-if="prefix"
      class="absolute left-3 text-sm text-muted-foreground select-none pointer-events-none font-medium"
    >
      {{ prefix }}
    </span>

    <input
      :type="type"
      :value="stringValue"
      :placeholder="placeholder"
      :disabled="disabled || readOnly"
      class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-base sm:text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px] transition-colors"
      :class="[prefix ? 'pl-8' : 'pl-3', suffix || (clearable && stringValue) ? 'pr-9' : 'pr-3']"
      @input="handleInput"
    />

    <button
      v-if="clearable && stringValue && !disabled && !readOnly"
      type="button"
      class="absolute right-2.5 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      title="Xóa nhanh"
      @click="handleClear"
    >
      <X class="h-3.5 w-3.5" />
    </button>

    <span
      v-else-if="suffix"
      class="absolute right-3 text-sm text-muted-foreground select-none pointer-events-none font-medium"
    >
      {{ suffix }}
    </span>
  </div>
</template>
