<script setup lang="ts">
import {
  Button,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@tuquet/vue-ui';
import { Search, X } from 'lucide-vue-next';
import { computed, ref, watch } from 'vue';
import { useTableLocale } from '../locale/index.js';

export type TextFilterOperator = 'contains' | 'startsWith' | 'exact';

export interface TextFilterValue {
  operator: TextFilterOperator;
  value: string;
}

export interface DataTableTextFilterProps {
  title: string;
  modelValue?: TextFilterValue | string | null;
  defaultOperator?: TextFilterOperator;
  placeholder?: string;
}

const props = withDefaults(defineProps<DataTableTextFilterProps>(), {
  modelValue: undefined,
  defaultOperator: 'contains',
  placeholder: undefined,
});

const emit = defineEmits<{
  'update:modelValue': [value: TextFilterValue | undefined];
}>();

const locale = useTableLocale();
const isVi = computed(() => locale.value.code.startsWith('vi'));
const effectivePlaceholder = computed(() => props.placeholder ?? (isVi.value ? 'Nhập từ khóa...' : 'Enter keyword...'));
const operatorLabels = computed<Record<TextFilterOperator, string>>(() => {
  if (isVi.value) {
    return {
      contains: 'chứa',
      startsWith: 'bắt đầu',
      exact: 'bằng',
    };
  }
  return {
    contains: 'contains',
    startsWith: 'starts with',
    exact: 'equals',
  };
});
const selectOptions = computed(() => {
  if (isVi.value) {
    return [
      { value: 'contains', label: 'Chứa' },
      { value: 'startsWith', label: 'Bắt đầu bằng' },
      { value: 'exact', label: 'Chính xác' },
    ];
  }
  return [
    { value: 'contains', label: 'Contains' },
    { value: 'startsWith', label: 'Starts with' },
    { value: 'exact', label: 'Exact match' },
  ];
});
const resetLabel = computed(() => locale.value.messages.toolbar.reset);
const applyLabel = computed(() => locale.value.messages.dateRange?.apply ?? (isVi.value ? 'Áp dụng' : 'Apply'));
const allLabel = computed(() => (isVi.value ? 'Tất cả' : 'All'));
const clearAriaLabel = computed(() => (isVi.value ? 'Xóa bộ lọc' : 'Clear filter'));
const filterByTitle = computed(() => (isVi.value ? `Lọc theo ${props.title}` : `Filter by ${props.title}`));

const isOpen = ref(false);
const operator = ref<TextFilterOperator>(props.defaultOperator);
const textValue = ref<string>('');

watch(
  () => props.modelValue,
  (newVal) => {
    if (typeof newVal === 'string') {
      textValue.value = newVal;
      operator.value = props.defaultOperator;
    } else if (newVal && typeof newVal === 'object') {
      textValue.value = newVal.value ?? '';
      operator.value = newVal.operator ?? props.defaultOperator;
    } else {
      textValue.value = '';
      operator.value = props.defaultOperator;
    }
  },
  { immediate: true }
);

const hasValue = computed(() => textValue.value.trim().length > 0);

const displayLabel = computed(() => {
  if (!hasValue.value) return null;
  const opLabel = operatorLabels.value[operator.value];
  return `${opLabel} "${textValue.value.trim()}"`;
});

function handleApply() {
  const trimmed = textValue.value.trim();
  if (trimmed.length === 0) {
    emit('update:modelValue', undefined);
  } else {
    emit('update:modelValue', {
      operator: operator.value,
      value: trimmed,
    });
  }
  isOpen.value = false;
}

function handleClear(e?: Event) {
  e?.stopPropagation();
  textValue.value = '';
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
        <Search class="h-3.5 w-3.5 text-muted-foreground" />
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

        <div class="flex gap-2">
          <Select v-model="operator">
            <SelectTrigger class="h-8 w-28 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="opt in selectOptions"
                :key="opt.value"
                :value="opt.value"
                class="text-xs"
              >
                {{ opt.label }}
              </SelectItem>
            </SelectContent>
          </Select>

          <Input
            v-model="textValue"
            type="text"
            :placeholder="effectivePlaceholder"
            class="h-8 flex-1 text-xs"
            @keydown.enter="handleApply"
          />
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
