<script setup lang="ts">
import {
  Button,
  Input,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@tuquet/vue-ui';
import { Hash, X } from 'lucide-vue-next';
import { computed, ref, watch } from 'vue';
import { useTableLocale } from '../locale/index.js';

export interface NumberRangeValue {
  min?: number | null;
  max?: number | null;
}

export interface DataTableNumberRangeFilterProps {
  title: string;
  modelValue?: NumberRangeValue | null;
  placeholderMin?: string;
  placeholderMax?: string;
  prefix?: string;
  suffix?: string;
  step?: number;
}

const props = withDefaults(defineProps<DataTableNumberRangeFilterProps>(), {
  modelValue: undefined,
  placeholderMin: undefined,
  placeholderMax: undefined,
  prefix: '',
  suffix: '',
  step: 1,
});

const locale = useTableLocale();
const isVi = computed(() => locale.value.code.startsWith('vi'));
const effectiveMinPlaceholder = computed(
  () => props.placeholderMin ?? locale.value.messages.filterBuilder.betweenFrom ?? 'Min'
);
const effectiveMaxPlaceholder = computed(
  () => props.placeholderMax ?? locale.value.messages.filterBuilder.betweenTo ?? 'Max'
);
const resetLabel = computed(() => locale.value.messages.toolbar.reset);
const applyLabel = computed(() => locale.value.messages.dateRange?.apply ?? (isVi.value ? 'Áp dụng' : 'Apply'));
const allLabel = computed(() => (isVi.value ? 'Tất cả' : 'All'));
const clearAriaLabel = computed(() => (isVi.value ? 'Xóa bộ lọc' : 'Clear filter'));
const filterByTitle = computed(() => (isVi.value ? `Lọc theo ${props.title}` : `Filter by ${props.title}`));

const emit = defineEmits<{
  'update:modelValue': [value: NumberRangeValue | undefined];
}>();

const isOpen = ref(false);
const minVal = ref<string>('');
const maxVal = ref<string>('');

watch(
  () => props.modelValue,
  (newVal) => {
    minVal.value = newVal?.min !== undefined && newVal?.min !== null ? String(newVal.min) : '';
    maxVal.value = newVal?.max !== undefined && newVal?.max !== null ? String(newVal.max) : '';
  },
  { immediate: true }
);

const hasValue = computed(() => {
  const min = minVal.value !== '' ? Number(minVal.value) : null;
  const max = maxVal.value !== '' ? Number(maxVal.value) : null;
  return min !== null || max !== null;
});

const displayLabel = computed(() => {
  const min = minVal.value !== '' ? Number(minVal.value) : null;
  const max = maxVal.value !== '' ? Number(maxVal.value) : null;

  if (min !== null && max !== null) {
    return `${props.prefix}${min} - ${props.prefix}${max}${props.suffix}`;
  }
  if (min !== null) {
    return `≥ ${props.prefix}${min}${props.suffix}`;
  }
  if (max !== null) {
    return `≤ ${props.prefix}${max}${props.suffix}`;
  }
  return null;
});

function handleApply() {
  const min = minVal.value !== '' ? Number(minVal.value) : null;
  const max = maxVal.value !== '' ? Number(maxVal.value) : null;

  if (min === null && max === null) {
    emit('update:modelValue', undefined);
  } else {
    emit('update:modelValue', { min, max });
  }
  isOpen.value = false;
}

function handleClear(e?: Event) {
  e?.stopPropagation();
  minVal.value = '';
  maxVal.value = '';
  emit('update:modelValue', undefined);
  isOpen.value = false;
}
</script>

<template>
  <Popover v-model:open="isOpen">
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        size="sm"
        class="h-8 border-dashed text-xs gap-1.5"
        :class="{ 'border-primary/50 bg-accent/40 font-medium': hasValue }"
      >
        <Hash class="h-3.5 w-3.5 text-muted-foreground" />
        <span class="text-muted-foreground">{{ title }}:</span>
        <span v-if="displayLabel" class="font-medium text-foreground">{{ displayLabel }}</span>
        <span v-else class="text-muted-foreground/60">{{ allLabel }}</span>

        <span
          v-if="hasValue"
          role="button"
          tabindex="0"
          :aria-label="clearAriaLabel"
          class="ml-1 rounded-sm p-0.5 hover:bg-muted focus:outline-none"
          @click.stop="handleClear"
          @keydown.enter.stop="handleClear"
          @keydown.space.stop="handleClear"
        >
          <X class="h-3 w-3 text-muted-foreground hover:text-foreground" />
        </span>
      </Button>
    </PopoverTrigger>

    <PopoverContent class="w-64 p-3" align="start">
      <div class="space-y-3">
        <div class="text-xs font-semibold text-foreground">{{ filterByTitle }}</div>

        <div class="grid grid-cols-2 gap-2">
          <div class="space-y-1">
            <Label class="text-[11px] text-muted-foreground">{{ effectiveMinPlaceholder }}</Label>
            <Input
              v-model="minVal"
              type="number"
              :step="step"
              :placeholder="effectiveMinPlaceholder"
              class="h-8 text-xs"
              @keydown.enter="handleApply"
            />
          </div>
          <div class="space-y-1">
            <Label class="text-[11px] text-muted-foreground">{{ effectiveMaxPlaceholder }}</Label>
            <Input
              v-model="maxVal"
              type="number"
              :step="step"
              :placeholder="effectiveMaxPlaceholder"
              class="h-8 text-xs"
              @keydown.enter="handleApply"
            />
          </div>
        </div>

        <div class="flex items-center justify-between pt-1">
          <Button
            variant="ghost"
            size="sm"
            class="h-7 px-2 text-xs text-muted-foreground"
            @click="handleClear"
          >
            {{ resetLabel }}
          </Button>
          <Button
            variant="default"
            size="sm"
            class="h-7 px-3 text-xs"
            @click="handleApply"
          >
            {{ applyLabel }}
          </Button>
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>
