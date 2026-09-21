<script setup lang="ts" generic="TData">
import type { Column, Table } from '@tanstack/vue-table';
import {
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@tuquet/vue-ui';
import { SlidersHorizontal } from 'lucide-vue-next';
import { computed } from 'vue';
import { useTableLocale } from '../locale/index.js';

export interface DataTableViewOptionsProps<TData> {
  table: Table<TData>;
  /**
   * Button trigger label (defaults to locale.messages.toolbar.viewOptionsTrigger)
   */
  triggerText?: string;
  /**
   * Dropdown menu label title (defaults to locale.messages.toolbar.viewOptionsTitle)
   */
  menuTitle?: string;
}

const props = withDefaults(defineProps<DataTableViewOptionsProps<TData>>(), {
  triggerText: '',
  menuTitle: '',
});

const locale = useTableLocale();

const resolvedTriggerText = computed(
  () => props.triggerText || locale.value.messages.toolbar.viewOptionsTrigger
);
const resolvedMenuTitle = computed(
  () => props.menuTitle || locale.value.messages.toolbar.viewOptionsTitle
);

const columns = computed(() =>
  props.table
    .getAllColumns()
    .filter((column) => column.getCanHide())
);

function getColumnTitle(column: Column<TData, unknown>): string {
  const meta = column.columnDef?.meta as { title?: string; label?: string } | undefined;
  if (meta?.title) return meta.title;
  if (meta?.label) return meta.label;
  const header = column.columnDef?.header;
  if (typeof header === 'string' && header.trim()) {
    return header;
  }
  const id = column.id || '';
  return id.charAt(0).toUpperCase() + id.slice(1).replace(/([A-Z])/g, ' $1').trim();
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button
        variant="outline"
        size="sm"
        class="ml-auto flex h-8 items-center gap-1.5 px-3 text-xs font-medium shadow-2xs"
      >
        <SlidersHorizontal class="h-3.5 w-3.5 text-muted-foreground" />
        <span>{{ resolvedTriggerText }}</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-[180px]">
      <DropdownMenuLabel class="text-xs font-semibold">{{ resolvedMenuTitle }}</DropdownMenuLabel>
      <DropdownMenuSeparator />

      <DropdownMenuCheckboxItem
        v-for="column in columns"
        :key="column.id"
        :model-value="column.getIsVisible()"
        :checked="column.getIsVisible()"
        class="text-xs"
        @update:model-value="(val) => column.toggleVisibility(!!val)"
        @update:checked="(val) => column.toggleVisibility(!!val)"
      >
        {{ getColumnTitle(column) }}
      </DropdownMenuCheckboxItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
