<script setup lang="ts" generic="TData">
import type { Table } from '@tanstack/vue-table';
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@tuquet/vue-ui';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-vue-next';
import { computed } from 'vue';
import { useTableLocale } from '../locale/index.js';

export interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  total?: number;
  pageSizeOptions?: number[];
  showSelectedCount?: boolean;
}

const props = withDefaults(defineProps<DataTablePaginationProps<TData>>(), {
  total: 0,
  pageSizeOptions: () => [10, 20, 30, 40, 50, 100],
  showSelectedCount: true,
});

const locale = useTableLocale();

const pageIndex = computed(() => props.table.getState().pagination.pageIndex);
const pageSize = computed(() => props.table.getState().pagination.pageSize);
const pageCount = computed(() => props.table.getPageCount());

const selectedRowsCount = computed(
  () => Object.values(props.table.getState().rowSelection ?? {}).filter(Boolean).length
);
</script>

<template>
  <div class="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 py-4">
    <div v-if="showSelectedCount" class="text-xs sm:text-sm text-muted-foreground w-full sm:w-auto text-center sm:text-left">
      <template v-if="selectedRowsCount > 0">
        {{ locale.messages.pagination.selectedCount(selectedRowsCount) }}
      </template>
      <template v-else-if="total > 0">
        {{ locale.messages.pagination.totalRecords(total) }}
      </template>
    </div>
    <div v-else class="hidden sm:block flex-1" />

    <div class="flex flex-wrap items-center justify-center sm:justify-end gap-3 sm:gap-6 lg:gap-8 w-full sm:w-auto">
      <div class="flex items-center space-x-2">
        <p class="text-xs sm:text-sm font-medium">{{ locale.messages.pagination.rowsPerPage }}</p>
        <Select
          :model-value="`${pageSize}`"
          @update:model-value="(val) => table.setPageSize(Number(val))"
        >
          <SelectTrigger class="h-8 w-[70px]">
            <SelectValue :placeholder="`${pageSize}`" />
          </SelectTrigger>
          <SelectContent side="top">
            <SelectItem
              v-for="size in pageSizeOptions"
              :key="size"
              :value="`${size}`"
            >
              {{ size }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="flex w-[110px] items-center justify-center text-sm font-medium">
        {{ locale.messages.pagination.pageSummary(pageIndex + 1, pageCount) }}
      </div>

      <div class="flex items-center space-x-2">
        <Button
          variant="outline"
          class="hidden h-8 w-8 p-0 lg:flex"
          :disabled="!table.getCanPreviousPage()"
          @click="table.setPageIndex(0)"
        >
          <span class="sr-only">{{ locale.messages.pagination.firstPage || 'Go to first page' }}</span>
          <ChevronsLeft class="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          class="h-8 w-8 p-0"
          :disabled="!table.getCanPreviousPage()"
          @click="table.previousPage()"
        >
          <span class="sr-only">{{ locale.messages.pagination.previousPage || 'Go to previous page' }}</span>
          <ChevronLeft class="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          class="h-8 w-8 p-0"
          :disabled="!table.getCanNextPage()"
          @click="table.nextPage()"
        >
          <span class="sr-only">{{ locale.messages.pagination.nextPage || 'Go to next page' }}</span>
          <ChevronRight class="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          class="hidden h-8 w-8 p-0 lg:flex"
          :disabled="!table.getCanNextPage()"
          @click="table.setPageIndex(pageCount - 1)"
        >
          <span class="sr-only">{{ locale.messages.pagination.lastPage || 'Go to last page' }}</span>
          <ChevronsRight class="h-4 w-4" />
        </Button>
      </div>
    </div>
  </div>
</template>
