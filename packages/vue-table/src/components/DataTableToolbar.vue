<script setup lang="ts" generic="TData">
import type { Table } from '@tanstack/vue-table';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
} from '@tuquet/vue-ui';
import { X, Download, FileSpreadsheet, Copy } from 'lucide-vue-next';
import { computed } from 'vue';
import { useTableLocale } from '../locale/index.js';
import type {
  DataTableFilterBuilderConfig,
  DynamicFilterRule,
  FilterConjunction,
  FilterDef,
  FilterPreset,
  ExportConfig,
} from '../types/index.js';
import { exportToExcel, exportToCsv, copyToClipboardAsTsv } from '../helpers/export.js';
import { resolveExportConfig } from '../helpers/configResolver.js';
import DataTableDateRangeFilter, { type DateRangeValue } from './DataTableDateRangeFilter.vue';
import DataTableFacetedFilter from './DataTableFacetedFilter.vue';
import DataTableFilterBuilder from './DataTableFilterBuilder.vue';
import DataTableNumberRangeFilter, {
  type NumberRangeValue,
} from './DataTableNumberRangeFilter.vue';
import DataTableSelectFilter from './DataTableSelectFilter.vue';
import DataTableTextFilter, { type TextFilterValue } from './DataTableTextFilter.vue';
import DataTableViewOptions from './DataTableViewOptions.vue';
import DataTableSavedViews from './DataTableSavedViews.vue';
import type { UseSavedViewsReturn } from '../composables/useSavedViews.js';
import type { TableSavedViewState } from '../types/savedViews.js';

export interface DataTableToolbarProps<TData> extends DataTableFilterBuilderConfig {
  table: Table<TData>;
  searchPlaceholder?: string;
  searchQuery?: string;
  filterDefs?: FilterDef[];
  filters?: Record<string, unknown>;
  activeFilterCount?: number;
  showViewOptions?: boolean;
  savedViews?: UseSavedViewsReturn;
  getCurrentState?: () => TableSavedViewState;
  exportConfig?: boolean | ExportConfig<TData>;
}


const props = withDefaults(defineProps<DataTableToolbarProps<TData>>(), {
  searchPlaceholder: '',
  searchQuery: '',
  filterDefs: () => [],
  filters: () => ({}),
  activeFilterCount: 0,
  showViewOptions: true,
  columnFilterDefs: () => [],
  dynamicRules: () => [],
  conjunction: 'and',
  filterPresets: () => [],
  showFilterBuilder: false,
});

const locale = useTableLocale();

const resolvedSearchPlaceholder = computed(
  () => props.searchPlaceholder || locale.value.messages.toolbar.searchPlaceholder
);

const emit = defineEmits<{
  (e: 'update:searchQuery', val: string): void;
  (e: 'update:filter', id: string, val: unknown): void;
  (e: 'update:dynamicRules', rules: DynamicFilterRule[]): void;
  (e: 'update:conjunction', conjunction: FilterConjunction): void;
  (e: 'apply-preset', preset: FilterPreset): void;
  (e: 'reset'): void;
}>();

function getFilterValues(val: unknown): (string | number)[] {
  if (Array.isArray(val)) {
    return val as (string | number)[];
  }
  return [];
}

function getSelectValue(val: unknown): string | number | undefined {
  if (typeof val === 'string' || typeof val === 'number') {
    return val;
  }
  return undefined;
}

function getDateRangeValue(val: unknown): DateRangeValue | undefined {
  if (val && typeof val === 'object') {
    return val as DateRangeValue;
  }
  return undefined;
}

function getNumberRangeValue(val: unknown): NumberRangeValue | undefined {
  if (val && typeof val === 'object') {
    return val as NumberRangeValue;
  }
  return undefined;
}

function getTextValue(val: unknown): TextFilterValue | string | undefined {
  if (typeof val === 'string' || (val && typeof val === 'object')) {
    return val as TextFilterValue | string;
  }
  return undefined;
}

const resolvedExport = computed(() => resolveExportConfig(props.exportConfig));
const allowedFormats = computed(() => resolvedExport.value?.formats ?? ['excel', 'csv', 'tsv']);

function getExportData(): any[] {
  const scope = resolvedExport.value?.scope ?? 'filtered';
  if (scope === 'selected') {
    return props.table.getFilteredSelectedRowModel().rows.map((r) => r.original);
  }
  return props.table.getFilteredRowModel().rows.map((r) => r.original);
}

function getExportFilename(ext: string): string {
  const fn = resolvedExport.value?.filename;
  if (typeof fn === 'function') {
    return `${fn(resolvedExport.value?.scope ?? 'filtered')}.${ext}`;
  }
  if (typeof fn === 'string') {
    return fn.endsWith(`.${ext}`) ? fn : `${fn}.${ext}`;
  }
  return `export_${new Date().toISOString().slice(0, 10)}.${ext}`;
}

function getExportColumns(): any[] {
  const exclude = new Set(resolvedExport.value?.excludeColumns ?? ['select', 'actions']);
  return props.table
    .getVisibleLeafColumns()
    .filter((col) => !exclude.has(col.id))
    .map((col) => col.columnDef);
}

async function handleExportExcel() {
  const data = getExportData();
  const filename = getExportFilename('xlsx');
  const columns = getExportColumns();
  await exportToExcel({ data, filename, columns });
  resolvedExport.value?.onExport?.('excel', data.length);
}

function handleExportCsv() {
  const data = getExportData();
  const filename = getExportFilename('csv');
  const columns = getExportColumns();
  exportToCsv({ data, filename, columns });
  resolvedExport.value?.onExport?.('csv', data.length);
}

async function handleExportTsv() {
  const data = getExportData();
  const columns = getExportColumns();
  await copyToClipboardAsTsv({ data, columns });
  resolvedExport.value?.onExport?.('tsv', data.length);
}
</script>

<template>
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-2.5">
    <div class="flex flex-wrap items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
      <Input
        :model-value="searchQuery"
        :placeholder="resolvedSearchPlaceholder"
        class="h-8 w-full sm:w-[180px] lg:w-[240px]"
        @update:model-value="(val) => emit('update:searchQuery', String(val))"
      />

      <template v-for="filter in filterDefs" :key="filter.id">
        <!-- Faceted Filter -->
        <DataTableFacetedFilter
          v-if="filter.type === 'faceted' && Array.isArray(filter.options)"
          :title="filter.title"
          :options="filter.options"
          :model-value="getFilterValues(filters[filter.id])"
          @update:model-value="(val) => emit('update:filter', filter.id, val)"
        />

        <!-- Select Filter -->
        <DataTableSelectFilter
          v-else-if="filter.type === 'select'"
          :title="filter.title"
          :options="filter.options"
          :value="getSelectValue(filters[filter.id])"
          @update:value="(val) => emit('update:filter', filter.id, val)"
        />

        <!-- Date Range Filter -->
        <DataTableDateRangeFilter
          v-else-if="filter.type === 'date-range'"
          :title="filter.title"
          :model-value="getDateRangeValue(filters[filter.id])"
          @update:model-value="(val) => emit('update:filter', filter.id, val)"
        />

        <!-- Number Range Filter -->
        <DataTableNumberRangeFilter
          v-else-if="filter.type === 'number-range'"
          :title="filter.title"
          :model-value="getNumberRangeValue(filters[filter.id])"
          @update:model-value="(val) => emit('update:filter', filter.id, val)"
        />

        <!-- Text Filter -->
        <DataTableTextFilter
          v-else-if="filter.type === 'text'"
          :title="filter.title"
          :placeholder="filter.placeholder"
          :model-value="getTextValue(filters[filter.id])"
          @update:model-value="(val) => emit('update:filter', filter.id, val)"
        />
      </template>

      <!-- Dynamic Database Filter Builder -->
      <DataTableFilterBuilder
        v-if="showFilterBuilder || columnFilterDefs.length > 0"
        :column-defs="columnFilterDefs"
        :rules="dynamicRules"
        :conjunction="conjunction"
        :presets="filterPresets"
        @update:rules="(rules) => emit('update:dynamicRules', rules)"
        @update:conjunction="(conj) => emit('update:conjunction', conj)"
        @apply-preset="(p) => emit('apply-preset', p)"
        @clear-rules="emit('update:dynamicRules', [])"
      />

      <Button
        v-if="activeFilterCount > 0"
        variant="ghost"
        class="h-8 px-2 lg:px-3"
        @click="emit('reset')"
      >
        {{ locale.messages.toolbar.reset }}
        <X class="ml-2 h-4 w-4" />
      </Button>

      <slot name="filters" />
    </div>

    <div class="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap justify-start sm:justify-end w-full sm:w-auto">
      <DataTableSavedViews
        v-if="savedViews && getCurrentState"
        :saved-views="savedViews"
        :get-current-state="getCurrentState"
      />

      <!-- Built-in Export Menu -->
      <DropdownMenu v-if="resolvedExport">
        <DropdownMenuTrigger as-child>
          <Button variant="outline" size="sm" class="h-8 text-xs gap-1.5 px-2.5">
            <Download class="h-3.5 w-3.5" />
            <span class="hidden sm:inline">Xuất dữ liệu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-40 text-xs">
          <DropdownMenuItem
            v-if="allowedFormats.includes('excel')"
            class="gap-2 cursor-pointer"
            @click="handleExportExcel"
          >
            <FileSpreadsheet class="h-3.5 w-3.5 text-emerald-600" />
            <span>Excel (.xlsx)</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            v-if="allowedFormats.includes('csv')"
            class="gap-2 cursor-pointer"
            @click="handleExportCsv"
          >
            <Download class="h-3.5 w-3.5 text-blue-600" />
            <span>CSV (.csv)</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            v-if="allowedFormats.includes('tsv')"
            class="gap-2 cursor-pointer"
            @click="handleExportTsv"
          >
            <Copy class="h-3.5 w-3.5" />
            <span>Copy bảng (TSV)</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <slot name="actions" />
      <DataTableViewOptions
        v-if="showViewOptions"
        :table="table"
        :trigger-text="locale.messages.toolbar.viewOptionsTrigger"
        :menu-title="locale.messages.toolbar.viewOptionsTitle"
      />
    </div>
  </div>
</template>

