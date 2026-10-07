<script setup lang="ts">
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@tuquet/vue-ui';
import { ChevronDown, X } from 'lucide-vue-next';
import { computed, type Component } from 'vue';
import { useTableLocale } from '../locale/index.js';

export interface SelectFilterOption {
  label: string;
  value: string | number;
  icon?: Component;
}

export interface DataTableSelectFilterProps {
  title: string;
  value?: string | number | null;
  options: SelectFilterOption[];
  allLabel?: string;
}

const props = withDefaults(defineProps<DataTableSelectFilterProps>(), {
  value: undefined,
  allLabel: undefined,
});

const locale = useTableLocale();
const resolvedAllLabel = computed(() => {
  if (props.allLabel) return props.allLabel;
  return locale.value.code.startsWith('vi') ? 'Tất cả' : 'All';
});

const emit = defineEmits<{
  'update:value': [value: string | number | undefined];
}>();

const selectedOption = computed(() => {
  if (props.value === undefined || props.value === null || props.value === '') return null;
  return props.options.find((opt) => String(opt.value) === String(props.value));
});

function handleSelect(val: string | number | undefined) {
  emit('update:value', val);
}

function handleClear(e?: Event) {
  e?.stopPropagation();
  emit('update:value', undefined);
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button
        variant="outline"
        size="sm"
        class="h-8 border-dashed text-xs gap-1"
        :class="{ 'border-primary/50 bg-accent/40 font-medium': !!selectedOption }"
      >
        <span class="text-muted-foreground">{{ title }}:</span>
        <span class="font-normal">{{ selectedOption ? selectedOption.label : resolvedAllLabel }}</span>
        <span
          v-if="selectedOption"
          role="button"
          tabindex="0"
          :aria-label="`Clear ${title} filter`"
          class="inline-flex items-center justify-center h-4 w-4 ml-0.5 -mr-1 rounded-sm hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
          @click="handleClear"
          @keydown.enter="handleClear"
        >
          <X class="h-3 w-3" />
          <span class="sr-only">Clear {{ title }} filter</span>
        </span>
        <ChevronDown v-else class="h-3.5 w-3.5 text-muted-foreground" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" class="w-[180px]">
      <DropdownMenuRadioGroup
        :model-value="value !== undefined && value !== null ? String(value) : ''"
        @update:model-value="(val) => handleSelect(!val ? undefined : String(val))"
      >
        <DropdownMenuRadioItem value="">
          <span>{{ resolvedAllLabel }}</span>
        </DropdownMenuRadioItem>
        <DropdownMenuSeparator />
        <DropdownMenuRadioItem
          v-for="option in options"
          :key="String(option.value)"
          :value="String(option.value)"
        >
          <component :is="option.icon" v-if="option.icon" class="mr-2 h-4 w-4 text-muted-foreground" />
          <span>{{ option.label }}</span>
        </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
