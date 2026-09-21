<script setup lang="ts" generic="TData">
import {
  FlexRender,
  type Column,
  type Table,
  useVueTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getExpandedRowModel,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type ColumnPinningState,
  type RowSelectionState,
  type ExpandedState,
} from '@tanstack/vue-table';
import { useVirtualizer } from '@tanstack/vue-virtual';
import {
  Button,
  Skeleton,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  DynamicRowEditSheet,
} from '@tuquet/vue-ui';
import { AlertCircle, RefreshCw, X } from 'lucide-vue-next';
import { computed, ref, watch, onMounted, onBeforeUnmount, isRef, type CSSProperties, type Ref } from 'vue';
import { useMediaQuery } from '@vueuse/core';
import type {
  ColumnFilterDefinition,
  DataTableProps,
  DynamicFilterRule,
  FilterConjunction,
  FilterDataType,
  FilterPreset,
  DataTableConfig,
} from '../types/index.js';
import {
  resolveRowEditConfig,
  resolveBulkActionsConfig,
  resolveExportConfig,
  resolveVirtualConfig,
} from '../helpers/configResolver.js';
import { filterDataset, isRuleComplete } from '../helpers/filterEngine.js';
import { useTableLocale, provideTableLocale } from '../locale/index.js';
import type { TableLocale } from '../locale/types.js';
import DataTableCardView from './DataTableCardView.vue';
import DataTableFloatingBar from './DataTableFloatingBar.vue';
import DataTablePagination from './DataTablePagination.vue';
import DataTableToolbar from './DataTableToolbar.vue';


const props = withDefaults(defineProps<DataTableProps<TData>>(), {
  showToolbar: true,
  showPagination: true,
  showFloatingBar: true,
  skeletonRows: 5,
  density: 'normal',
  bordered: false,
  border: false,
  virtual: false,
  virtualHeight: '500px',
  overscan: 5,
  columnFilterDefs: () => [],
  dynamicRules: () => [],
  conjunction: 'and',
  filterPresets: () => [],
  showFilterBuilder: false,
  adaptivePinning: true,
  mobileLayout: 'table',
  showMobileScrollHint: false,
  enableColumnResizing: false,
  enableRowExpansion: false,
  enableColumnHeaderMenu: false,
  enableSavedViews: false,
  data: () => [],
  columns: () => [],
});

const parentLocale = useTableLocale();
const activeLocale = computed<TableLocale>(() => {
  if (props.locale) {
    return isRef(props.locale) ? props.locale.value : props.locale;
  }
  return parentLocale.value;
});
provideTableLocale(activeLocale);
const locale = activeLocale;

const resolvedEmptyMessage = computed(
  () => props.emptyMessage || locale.value.messages.general.emptyMessage
);
const resolvedMobileScrollHint = computed(
  () => props.mobileScrollHintText || locale.value.messages.general.mobileScrollHint
);

const isBordered = computed(() => Boolean(props.bordered || props.border));
const canResize = computed(() => isBordered.value && props.enableColumnResizing !== false);


const emit = defineEmits<{
  'update:dynamicRules': [rules: DynamicFilterRule[]];
  'update:conjunction': [conjunction: FilterConjunction];
  'apply-preset': [preset: FilterPreset];
  'row-click': [row: any, event: MouseEvent];
  'update:searchQuery': [query: string];
  'update:filter': [id: string, value: unknown];
}>();

const isMobile = useMediaQuery('(max-width: 768px)');
const canScrollLeft = ref(false);
const canScrollRight = ref(false);
const isScrollHintDismissed = ref(false);

const tableContainerRef = ref<HTMLDivElement | null>(null);
let scrollCheckTimer: ReturnType<typeof setTimeout> | null = null;
let measureTimer: ReturnType<typeof setTimeout> | null = null;

function updateScrollState() {
  const el = tableContainerRef.value;
  if (!el) return;
  canScrollLeft.value = el.scrollLeft > 5;
  canScrollRight.value = el.scrollLeft < el.scrollWidth - el.clientWidth - 5;
}

onMounted(() => {
  // Initial scroll check
  scrollCheckTimer = setTimeout(updateScrollState, 150);
});

onBeforeUnmount(() => {
  if (scrollCheckTimer) {
    clearTimeout(scrollCheckTimer);
    scrollCheckTimer = null;
  }
  if (measureTimer) {
    clearTimeout(measureTimer);
    measureTimer = null;
  }
});

// Self-managed Filter Builder and Toolbar Search State
const internalSearchQuery = ref('');
const internalFilters = ref<Record<string, unknown>>({});
const internalDynamicRules = ref<DynamicFilterRule[]>(
  props.dynamicRules && props.dynamicRules.length > 0
    ? [...props.dynamicRules]
    : props.remote?.dynamicRules?.value
    ? [...props.remote.dynamicRules.value]
    : []
);
const internalConjunction = ref<FilterConjunction>(
  props.conjunction ?? props.remote?.conjunction?.value ?? 'and'
);

watch(
  () => props.dynamicRules,
  (newRules) => {
    if (newRules !== undefined) {
      internalDynamicRules.value = [...newRules];
    }
  },
  { deep: true }
);

watch(
  () => props.conjunction,
  (newConj) => {
    if (newConj !== undefined) {
      internalConjunction.value = newConj;
    }
  }
);

if (props.remote?.dynamicRules) {
  watch(
    () => props.remote?.dynamicRules?.value,
    (val) => {
      if (val !== undefined) {
        internalDynamicRules.value = [...val];
      }
    },
    { deep: true }
  );
}

if (props.remote?.conjunction) {
  watch(
    () => props.remote?.conjunction?.value,
    (val) => {
      if (val !== undefined) {
        internalConjunction.value = val;
      }
    }
  );
}

// Client-side table fallback state (Zero-boilerplate mode)
const clientData = computed(() => {
  const raw = props.data ?? [];
  if (!props.showFilterBuilder || !internalDynamicRules.value.length) {
    return raw;
  }
  const activeRules = internalDynamicRules.value.filter(isRuleComplete);
  if (activeRules.length === 0) {
    return raw;
  }
  return filterDataset(raw as Record<string, unknown>[], activeRules, internalConjunction.value) as TData[];
});
const clientColumns = computed(() => props.columns ?? []);

const clientSorting = ref<SortingState>([]);
const clientColumnFilters = ref<ColumnFiltersState>([]);
const clientColumnVisibility = ref<VisibilityState>({});
const clientRowSelection = ref<RowSelectionState>({});
const clientColumnPinning = ref<ColumnPinningState>({ left: [], right: [] });
const clientExpanded = ref<ExpandedState>({});
const clientPagination = ref({ pageIndex: 0, pageSize: 10 });
const clientGlobalFilter = ref('');

const clientTable = useVueTable<TData>({
  get data() {
    return clientData.value;
  },
  get columns() {
    return clientColumns.value as any;
  },
  state: {
    get sorting() {
      return clientSorting.value;
    },
    get columnFilters() {
      return clientColumnFilters.value;
    },
    get columnVisibility() {
      return clientColumnVisibility.value;
    },
    get rowSelection() {
      return clientRowSelection.value;
    },
    get columnPinning() {
      return clientColumnPinning.value;
    },
    get expanded() {
      return clientExpanded.value;
    },
    get pagination() {
      return clientPagination.value;
    },
    get globalFilter() {
      return clientGlobalFilter.value;
    },
  },
  onSortingChange: (updaterOrValue) => {
    clientSorting.value =
      typeof updaterOrValue === 'function' ? updaterOrValue(clientSorting.value) : updaterOrValue;
  },
  onColumnFiltersChange: (updaterOrValue) => {
    clientColumnFilters.value =
      typeof updaterOrValue === 'function' ? updaterOrValue(clientColumnFilters.value) : updaterOrValue;
  },
  onColumnVisibilityChange: (updaterOrValue) => {
    clientColumnVisibility.value =
      typeof updaterOrValue === 'function' ? updaterOrValue(clientColumnVisibility.value) : updaterOrValue;
  },
  onRowSelectionChange: (updaterOrValue) => {
    clientRowSelection.value =
      typeof updaterOrValue === 'function' ? updaterOrValue(clientRowSelection.value) : updaterOrValue;
  },
  onColumnPinningChange: (updaterOrValue) => {
    clientColumnPinning.value =
      typeof updaterOrValue === 'function' ? updaterOrValue(clientColumnPinning.value) : updaterOrValue;
  },
  onExpandedChange: (updaterOrValue) => {
    clientExpanded.value =
      typeof updaterOrValue === 'function' ? updaterOrValue(clientExpanded.value) : updaterOrValue;
  },
  onPaginationChange: (updaterOrValue) => {
    clientPagination.value =
      typeof updaterOrValue === 'function' ? updaterOrValue(clientPagination.value) : updaterOrValue;
  },
  onGlobalFilterChange: (updaterOrValue) => {
    clientGlobalFilter.value =
      typeof updaterOrValue === 'function' ? updaterOrValue(clientGlobalFilter.value) : updaterOrValue;
  },
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getExpandedRowModel: getExpandedRowModel(),
});

const isUnifiedInstance = computed(() => Boolean((props.table as any)?.isTuquetTableInstance));

const effectiveRemote = computed(() => {
  if (props.remote) return props.remote;
  if (isUnifiedInstance.value) return (props.table as any).remote;
  return undefined;
});

const effectiveConfig = computed<DataTableConfig<TData>>(() => {
  if (props.config) return props.config;
  if (isUnifiedInstance.value) return (props.table as any).config;
  return {};
});

const effectiveBulkActions = computed(() => props.bulkActions ?? effectiveConfig.value.bulkActions);
const effectiveExport = computed(() => props.export ?? effectiveConfig.value.export);
const effectiveRowEdit = computed(() => props.rowEdit ?? effectiveConfig.value.rowEdit);
const resolvedRowEditConfig = computed(() => resolveRowEditConfig(effectiveRowEdit.value));

const table = computed<Table<TData>>(() => {
  if (isUnifiedInstance.value) return (props.table as any).table;
  if (props.table && typeof (props.table as any).getVisibleLeafColumns === 'function') {
    return props.table as Table<TData>;
  }
  return (effectiveRemote.value?.table ?? clientTable) as Table<TData>;
});

const isLoading = computed(() => props.loading ?? effectiveRemote.value?.isLoading?.value ?? false);
const isError = computed(() => effectiveRemote.value?.isError?.value ?? false);
const error = computed(() => effectiveRemote.value?.error?.value ?? null);
const totalRecords = computed(
  () => props.total ?? effectiveRemote.value?.total?.value ?? (props.data?.length ?? 0)
);

// Row Edit State & Handlers
const isRowEditOpen = ref(false);
const editingRow = ref<TData | null>(null) as Ref<TData | null>;

function openRowEdit(row: TData) {
  editingRow.value = row;
  isRowEditOpen.value = true;
}

function closeRowEdit() {
  isRowEditOpen.value = false;
  editingRow.value = null;
  resolvedRowEditConfig.value?.onCancel?.();
}

async function handleSaveRowEdit(updated: Record<string, any>, originalRow: Record<string, any>) {
  if (resolvedRowEditConfig.value?.onSave) {
    await resolvedRowEditConfig.value.onSave(updated as Partial<TData>, originalRow as TData);
  } else if (effectiveRemote.value) {
    const rowId = (originalRow as any).id;
    if (rowId) {
      effectiveRemote.value.mutateRow(rowId, updated as Partial<TData>);
    }
  }
  closeRowEdit();
}
const columnCount = computed(() => table.value?.getVisibleLeafColumns()?.length ?? 0);
const rows = computed(() => table.value?.getRowModel()?.rows ?? []);
const isCardLayout = computed(
  () => props.mobileLayout === 'cards' || (props.mobileLayout === 'auto' && isMobile.value)
);

const effectiveColumnFilterDefs = computed<ColumnFilterDefinition[]>(() => {
  if (props.columnFilterDefs && props.columnFilterDefs.length > 0) {
    return props.columnFilterDefs;
  }
  const leafCols = table.value?.getAllLeafColumns?.() ?? [];
  const sampleData = (props.remote?.data?.value ?? props.data ?? []).slice(0, 10);

  const defs: ColumnFilterDefinition[] = [];
  for (const col of leafCols) {
    const colId = col.id;
    if (
      !colId ||
      colId === 'select' ||
      colId === 'actions' ||
      colId === 'expander' ||
      colId === 'expanded' ||
      colId.startsWith('__')
    ) {
      continue;
    }

    const rawHeader = col.columnDef?.header;
    let label = colId;
    if (typeof rawHeader === 'string' && rawHeader.trim()) {
      label = rawHeader.trim();
    } else if ((col.columnDef?.meta as any)?.title) {
      label = String((col.columnDef.meta as any).title);
    } else {
      label = colId.charAt(0).toUpperCase() + colId.slice(1).replace(/([A-Z])/g, ' $1').trim();
    }

    let dataType: FilterDataType = 'text';
    const colMeta = col.columnDef?.meta as any;
    if (colMeta?.filterType) {
      dataType = colMeta.filterType;
    } else if (colMeta?.dataType) {
      dataType = colMeta.dataType;
    } else if (colMeta?.options && Array.isArray(colMeta.options)) {
      dataType = 'select';
    } else {
      for (const row of sampleData) {
        const val = (row as any)?.[colId];
        if (val !== undefined && val !== null && val !== '') {
          if (typeof val === 'number') {
            dataType = 'number';
            break;
          }
          if (typeof val === 'boolean') {
            dataType = 'boolean';
            break;
          }
          if (
            val instanceof Date ||
            (typeof val === 'string' &&
              /^\d{4}-\d{2}-\d{2}/.test(val) &&
              !isNaN(Date.parse(val)))
          ) {
            dataType = 'date';
            break;
          }
        }
      }
    }

    defs.push({
      id: colId,
      label,
      dataType,
      options: colMeta?.options,
      placeholder: colMeta?.placeholder,
    });
  }
  return defs;
});

const activeSearchQuery = computed(() => {
  if (props.remote?.searchQuery) {
    return props.remote.searchQuery.value;
  }
  return internalSearchQuery.value;
});

const activeFilters = computed(() => {
  if (props.remote?.filters) {
    return props.remote.filters.value;
  }
  return internalFilters.value;
});

const effectiveActiveFilterCount = computed(() => {
  if (props.remote?.activeFilterCount) {
    return props.remote.activeFilterCount.value;
  }
  const staticCount = Object.values(internalFilters.value).filter(
    (v) => v !== undefined && v !== '' && (Array.isArray(v) ? v.length > 0 : true)
  ).length;
  const validDynamicCount = internalDynamicRules.value.filter(isRuleComplete).length;
  return staticCount + validDynamicCount;
});

function handleUpdateSearchQuery(val: string) {
  if (props.remote?.searchQuery) {
    props.remote.searchQuery.value = val;
  } else {
    internalSearchQuery.value = val;
    clientGlobalFilter.value = val;
  }
  emit('update:searchQuery', val);
}

function handleUpdateFilter(id: string, val: unknown) {
  if (props.remote?.setFilter) {
    props.remote.setFilter(id, val);
  } else {
    internalFilters.value = {
      ...internalFilters.value,
      [id]: val,
    };
    const idx = clientColumnFilters.value.findIndex((f) => f.id === id);
    if (val === undefined || val === null || val === '') {
      if (idx >= 0) clientColumnFilters.value.splice(idx, 1);
    } else {
      if (idx >= 0) {
        clientColumnFilters.value[idx] = { id, value: val };
      } else {
        clientColumnFilters.value.push({ id, value: val });
      }
    }
  }
  emit('update:filter', id, val);
}

function handleUpdateDynamicRules(rules: DynamicFilterRule[]) {
  internalDynamicRules.value = rules;
  if (props.remote?.setDynamicRules) {
    props.remote.setDynamicRules(rules);
  } else if (props.remote?.dynamicRules) {
    props.remote.dynamicRules.value = rules;
  }
  emit('update:dynamicRules', rules);
}

function handleUpdateConjunction(conj: FilterConjunction) {
  internalConjunction.value = conj;
  if (props.remote?.setDynamicConjunction) {
    props.remote.setDynamicConjunction(conj);
  } else if (props.remote?.conjunction) {
    props.remote.conjunction.value = conj;
  }
  emit('update:conjunction', conj);
  props.remote?.refetch?.();
}

function handleApplyPreset(preset: FilterPreset) {
  internalDynamicRules.value = [...preset.rules];
  internalConjunction.value = preset.conjunction;
  if (props.remote?.applyFilterPreset) {
    props.remote.applyFilterPreset(preset);
  } else {
    if (props.remote?.setDynamicRules) {
      props.remote.setDynamicRules(preset.rules);
    } else if (props.remote?.dynamicRules) {
      props.remote.dynamicRules.value = preset.rules;
    }
    if (props.remote?.setDynamicConjunction) {
      props.remote.setDynamicConjunction(preset.conjunction);
    } else if (props.remote?.conjunction) {
      props.remote.conjunction.value = preset.conjunction;
    }
  }
  emit('apply-preset', preset);
  emit('update:dynamicRules', preset.rules);
  emit('update:conjunction', preset.conjunction);
  props.remote?.refetch?.();
}

function handleResetFilters() {
  internalDynamicRules.value = [];
  emit('update:dynamicRules', []);
  if (props.remote) {
    props.remote.clearDynamicRules?.();
    props.remote.resetFilters?.();
  } else {
    internalFilters.value = {};
    internalSearchQuery.value = '';
    clientGlobalFilter.value = '';
    clientColumnFilters.value = [];
  }
}

const defaultEstimateSize = computed(() => {
  if (props.estimatedRowHeight) return props.estimatedRowHeight;
  if (isMobile.value) {
    // Touch friendly height on mobile (Apple HIG / WCAG 2.5.5)
    return 50;
  }
  switch (props.density) {
    case 'compact':
      return 36;
    case 'comfortable':
      return 56;
    default:
      return 44;
  }
});

const rowVirtualizer = useVirtualizer(
  computed(() => ({
    count: props.virtual ? rows.value.length : 0,
    getScrollElement: () => tableContainerRef.value,
    estimateSize: () => defaultEstimateSize.value,
    overscan: props.overscan,
  }))
);

const virtualRows = computed(() => {
  if (!props.virtual) return [];
  return rowVirtualizer.value.getVirtualItems();
});

const totalVirtualSize = computed(() => {
  if (!props.virtual) return 0;
  return rowVirtualizer.value.getTotalSize();
});

const totalTableWidth = computed(() => table.value?.getTotalSize() ?? 0);

function measureRow(el: any) {
  if (!el) return;
  const domNode = el?.$el instanceof HTMLElement ? el.$el : el instanceof HTMLElement ? el : null;
  if (domNode) {
    rowVirtualizer.value?.measureElement(domNode);
  }
}

const paddingTop = computed(() => {
  if (!props.virtual || virtualRows.value.length === 0) return 0;
  return virtualRows.value[0]?.start ?? 0;
});

const paddingBottom = computed(() => {
  if (!props.virtual || virtualRows.value.length === 0) return 0;
  const lastItem = virtualRows.value[virtualRows.value.length - 1];
  return totalVirtualSize.value - (lastItem?.end ?? 0);
});

function getCellDensityClass(columnId?: string) {
  const isCompact = props.density === 'compact';
  const isComfortable = props.density === 'comfortable';
  const isMobileView = isMobile.value;

  // Touch Target 44px on Mobile (Apple HIG & WCAG 2.5.5)
  const py = isMobileView
    ? 'py-3'
    : isCompact
    ? 'py-1.5'
    : isComfortable
    ? 'py-4'
    : 'py-2.5';

  const text = isMobileView ? 'text-xs sm:text-sm' : isCompact ? 'text-xs' : 'text-sm';

  if (columnId === 'select' || columnId === 'actions') {
    return `${py} px-2 text-center ${text}`;
  }

  const px = isMobileView ? 'px-3' : isCompact ? 'px-2.5' : 'px-4';
  return `${py} ${px} ${text}`;
}

function getColumnStyle(column: Column<any>, isHeader = false): CSSProperties {
  const isPinned = column.getIsPinned();
  const size = column.getSize();
  const colId = column.id;

  let effectivePinned = isPinned;
  // Adaptive Pinning on Mobile (<768px):
  // 1. Never stick the actions column to the right (leaves middle columns squeezed)
  // 2. Only keep the selection checkbox sticky on the left, unpin secondary columns like index
  if (isMobile.value && props.adaptivePinning) {
    if (isPinned === 'right') {
      effectivePinned = false;
    } else if (isPinned === 'left' && colId !== 'select') {
      effectivePinned = false;
    }
  }

  return {
    position: effectivePinned ? 'sticky' : undefined,
    left: effectivePinned === 'left' ? `${column.getStart('left')}px` : undefined,
    right: effectivePinned === 'right' ? `${column.getAfter('right')}px` : undefined,
    width: `${size}px`,
    minWidth: `${size}px`,
    maxWidth: effectivePinned ? `${size}px` : undefined,
    zIndex: effectivePinned ? (isHeader ? 25 : 12) : isHeader ? 20 : undefined,
  };
}

function handleRowClick(row: any, event: MouseEvent) {
  const target = event.target as HTMLElement | null;
  // Don't trigger row click if clicked on interactive elements
  if (target?.closest('button, input, [role="checkbox"], a, [role="menuitem"], [data-prevent-row-click]')) {
    return;
  }
  if (resolvedRowEditConfig.value && resolvedRowEditConfig.value.trigger !== 'manual') {
    openRowEdit(row.original);
  }
  emit('row-click', row, event);
}

watch(
  () => [props.density, isMobile.value],
  () => {
    if (props.virtual && rowVirtualizer.value) {
      if (measureTimer) {
        clearTimeout(measureTimer);
      }
      measureTimer = setTimeout(() => {
        const container = tableContainerRef.value;
        if (container) {
          const trs = container.querySelectorAll('tr[data-index]');
          trs.forEach((tr) => rowVirtualizer.value?.measureElement(tr));
        }
      }, 50);
    }
  }
);

const api = computed(() => {
  const baseApi = props.remote?.api;
  if (!baseApi) return undefined;
  return {
    ...baseApi,
    scroll: {
      scrollToIndex: (index: number, options?: { align?: 'start' | 'center' | 'end' | 'auto' }) => {
        rowVirtualizer.value?.scrollToIndex(index, options);
      },
      scrollToOffset: (offset: number) => {
        rowVirtualizer.value?.scrollToOffset(offset);
      },
    },
  };
});

defineExpose({
  table,
  clientTable,
  api,
  tableContainerRef,
  rowVirtualizer,
  scrollToIndex: (index: number, options?: { align?: 'start' | 'center' | 'end' | 'auto' }) => {
    rowVirtualizer.value?.scrollToIndex(index, options);
  },
  scrollToOffset: (offset: number) => {
    rowVirtualizer.value?.scrollToOffset(offset);
  },
  virtualRows,
  totalVirtualSize,
  resetFilters: handleResetFilters,
  getSelectedRows: () => table.value?.getFilteredSelectedRowModel()?.rows ?? [],
  clearSelection: () => table.value?.resetRowSelection(),
  isRowEditOpen,
  editingRow,
  openRowEdit,
  closeRowEdit,
});
</script>

<template>
  <div class="space-y-4">
    <!-- Toolbar -->
    <slot name="toolbar">
      <DataTableToolbar
        v-if="showToolbar"
        :table="table"
        :search-query="activeSearchQuery"
        :filter-defs="remote?.filterDefs ?? []"
        :filters="activeFilters"
        :active-filter-count="effectiveActiveFilterCount"
        :column-filter-defs="effectiveColumnFilterDefs"
        :dynamic-rules="internalDynamicRules"
        :conjunction="internalConjunction"
        :filter-presets="filterPresets"
        :show-filter-builder="showFilterBuilder"
        :saved-views="enableSavedViews ? remote?.savedViews : undefined"
        :get-current-state="enableSavedViews ? remote?.getCurrentState : undefined"
        :export-config="effectiveExport"
        @update:search-query="handleUpdateSearchQuery"
        @update:filter="handleUpdateFilter"
        @update:dynamic-rules="handleUpdateDynamicRules"
        @update:conjunction="handleUpdateConjunction"
        @apply-preset="handleApplyPreset"
        @reset="handleResetFilters"
      >
        <template #actions>
          <slot name="actions" />
        </template>
        <template #filters>
          <slot name="filters" />
        </template>
      </DataTableToolbar>
    </slot>

    <!-- Error State -->
    <div
      v-if="isError"
      class="flex flex-col items-center justify-center rounded-md border border-destructive/50 bg-destructive/10 p-8 text-center"
    >
      <AlertCircle class="h-8 w-8 text-destructive" />
      <h3 class="mt-2 text-sm font-semibold text-destructive">
        {{ locale.messages.general.failedToLoad }}
      </h3>
      <p class="mt-1 text-xs text-muted-foreground">
        {{ error?.message || 'An unexpected error occurred while fetching records.' }}
      </p>
      <Button
        variant="outline"
        size="sm"
        class="mt-4"
        @click="remote?.refetch?.()"
      >
        <RefreshCw class="mr-2 h-4 w-4" />
        {{ locale.messages.general.tryAgain }}
      </Button>
    </div>

    <!-- Mobile Card List View (Extracted for Single Responsibility Principle & DRY) -->
    <DataTableCardView
      v-else-if="isCardLayout"
      ref="tableContainerRef"
      :table="table"
      :rows="rows"
      :virtual="virtual"
      :virtual-rows="virtualRows"
      :virtual-height="virtualHeight"
      :padding-top="paddingTop"
      :padding-bottom="paddingBottom"
      :measure-row="measureRow"
      @row-click="handleRowClick"
    >
      <template #card="slotProps">
        <slot name="card" v-bind="slotProps" />
      </template>
      <template #select-all="slotProps">
        <slot name="card-select-all" v-bind="slotProps" />
      </template>
    </DataTableCardView>

    <!-- Table Container (Horizontal Scroll with Adaptive Pinning) -->
    <div
      v-else
      ref="tableContainerRef"
      class="rounded-md border overflow-auto relative overscroll-x-contain select-text"
      style="-webkit-overflow-scrolling: touch;"
      :style="virtual ? { maxHeight: typeof virtualHeight === 'number' ? `${virtualHeight}px` : virtualHeight } : undefined"
      @scroll="updateScrollState"
    >
      <!-- Mobile Horizontal Scroll Hint -->
      <div
        v-if="isMobile && showMobileScrollHint && canScrollRight && !isScrollHintDismissed"
        class="sticky left-0 right-0 z-20 flex items-center justify-between px-3 py-1.5 text-[11px] bg-primary/10 text-primary border-b border-primary/20 select-none backdrop-blur-xs"
      >
        <span class="flex items-center gap-1 font-medium">
          <span>👉</span>
          <span>{{ resolvedMobileScrollHint }}</span>
        </span>
        <div class="flex items-center gap-2">
          <span class="text-xs font-mono font-bold animate-pulse">→</span>
          <button
            type="button"
            class="p-0.5 rounded hover:bg-primary/20 text-primary cursor-pointer transition-colors"
            aria-label="Đóng gợi ý cuộn"
            @click.stop="isScrollHintDismissed = true"
          >
            <X class="h-3 w-3" />
          </button>
        </div>
      </div>


      <table
        class="w-full caption-bottom text-sm table-fixed border-collapse"
        :style="{ minWidth: `${totalTableWidth}px` }"
      >
        <TableHeader :class="virtual ? 'sticky top-0 z-30 bg-background shadow-xs' : ''">
          <TableRow
            v-for="headerGroup in table?.getHeaderGroups() ?? []"
            :key="headerGroup.id"
          >
            <TableHead
              v-for="header in headerGroup.headers"
              :key="header.id"
              :style="getColumnStyle(header.column, true)"
              :class="[
                getCellDensityClass(header.column.id),
                isBordered ? 'border-r border-border' : '',
                (!isMobile || !adaptivePinning || header.column.id === 'select') && header.column.getIsPinned()
                  ? 'sticky bg-background shadow-xs'
                  : 'bg-background',
                (!isMobile || !adaptivePinning) && header.column.getIsLastColumn('left')
                  ? 'border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]'
                  : '',
                (!isMobile || !adaptivePinning) && header.column.getIsFirstColumn('right')
                  ? 'border-l shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]'
                  : '',
                isMobile && adaptivePinning && header.column.id === 'select'
                  ? 'border-r shadow-[3px_0_6px_-2px_rgba(0,0,0,0.08)]'
                  : '',
                'relative group/th select-none',
              ]"
            >
              <!-- Standard Clean Header (with simple sort if enabled) -->
              <div
                v-if="header.column.getCanSort() && typeof header.column.columnDef.header === 'string'"
                class="flex items-center gap-1.5 cursor-pointer select-none group/sort"
                @click="header.column.toggleSorting()"
              >
                <span>{{ header.column.columnDef.header }}</span>
                <span v-if="header.column.getIsSorted() === 'asc'" class="text-primary text-xs font-bold">↑</span>
                <span v-else-if="header.column.getIsSorted() === 'desc'" class="text-primary text-xs font-bold">↓</span>
                <span v-else class="text-muted-foreground/40 opacity-0 group-hover/sort:opacity-100 text-xs transition-opacity">↕</span>
              </div>
              <FlexRender
                v-else-if="!header.isPlaceholder"
                :render="header.column.columnDef.header"
                :props="header.getContext()"
              />

              <!-- Column Resizer Handle (Active only when bordered is enabled) -->
              <div
                v-if="canResize && header.column.getCanResize()"
                class="absolute right-0 top-0 h-full w-1.5 cursor-col-resize select-none touch-none hover:bg-primary/70 transition-colors z-20 group-hover/th:bg-primary/40"
                :class="{ 'bg-primary! w-1.5': header.column.getIsResizing() }"
                @mousedown.stop="header.getResizeHandler()($event)"
                @touchstart.stop="header.getResizeHandler()($event)"
                @dblclick.stop="header.column.resetSize()"
              />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <!-- Loading Skeletons -->
          <template v-if="isLoading">
            <TableRow v-for="i in skeletonRows" :key="`skeleton-${i}`">
              <TableCell
                v-for="col in table?.getVisibleLeafColumns() ?? []"
                :key="`skeleton-cell-${col.id}`"
                :style="getColumnStyle(col)"
                :class="[getCellDensityClass(col.id), isBordered ? 'border-r border-border' : '']"
              >
                <Skeleton class="h-5 w-full" />
              </TableCell>
            </TableRow>
          </template>

          <!-- Actual Rows -->
          <template v-else-if="rows.length">
            <!-- Virtualized Rendering Mode -->
            <template v-if="virtual">
              <tr v-if="paddingTop > 0" aria-hidden="true" role="presentation">
                <td :colspan="columnCount" :style="{ height: `${paddingTop}px` }" class="p-0 border-0" />
              </tr>
              <template
                v-for="virtualRow in virtualRows"
                :key="rows[virtualRow.index]?.id ?? virtualRow.index"
              >
                <TableRow
                  class="group transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted cursor-pointer sm:cursor-default"
                  :data-index="virtualRow.index"
                  :data-state="rows[virtualRow.index]?.getIsSelected() ? 'selected' : undefined"
                  :ref="measureRow"
                  @click="(e) => handleRowClick(rows[virtualRow.index], e)"
                >
                  <TableCell
                    v-for="cell in rows[virtualRow.index]?.getVisibleCells() ?? []"
                    :key="cell.id"
                    :style="getColumnStyle(cell.column)"
                    :class="[
                      getCellDensityClass(cell.column.id),
                      isBordered ? 'border-r border-border' : '',
                      (!isMobile || !adaptivePinning || cell.column.id === 'select') && cell.column.getIsPinned()
                        ? 'sticky bg-background group-hover:bg-muted/50 group-data-[state=selected]:bg-muted transition-colors'
                        : 'transition-colors',
                      (!isMobile || !adaptivePinning) && cell.column.getIsLastColumn('left')
                        ? 'border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]'
                        : '',
                      (!isMobile || !adaptivePinning) && cell.column.getIsFirstColumn('right')
                        ? 'border-l shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]'
                        : '',
                      isMobile && adaptivePinning && cell.column.id === 'select'
                        ? 'border-r shadow-[3px_0_6px_-2px_rgba(0,0,0,0.08)]'
                        : '',
                    ]"
                  >
                    <FlexRender
                      :render="cell.column.columnDef.cell"
                      :props="cell.getContext()"
                    />
                  </TableCell>
                </TableRow>
                <!-- Expanded Row in Virtual Mode -->
                <TableRow
                  v-if="rows[virtualRow.index]?.getIsExpanded()"
                  class="bg-muted/15 border-b hover:bg-muted/25 transition-colors"
                  :ref="measureRow"
                >
                  <TableCell :colspan="columnCount" class="p-4">
                    <slot name="expanded-row" :row="rows[virtualRow.index].original" :table-row="rows[virtualRow.index]" />
                  </TableCell>
                </TableRow>
              </template>
              <tr v-if="paddingBottom > 0" aria-hidden="true" role="presentation">
                <td :colspan="columnCount" :style="{ height: `${paddingBottom}px` }" class="p-0 border-0" />
              </tr>
            </template>

            <!-- Standard Rendering Mode -->
            <template v-else>
              <template v-for="row in rows" :key="row.id">
                <TableRow
                  class="group transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted cursor-pointer sm:cursor-default"
                  :data-state="row.getIsSelected() ? 'selected' : undefined"
                  @click="(e) => handleRowClick(row, e)"
                >
                  <TableCell
                    v-for="cell in row.getVisibleCells()"
                    :key="cell.id"
                    :style="getColumnStyle(cell.column)"
                    :class="[
                      getCellDensityClass(cell.column.id),
                      isBordered ? 'border-r border-border' : '',
                      (!isMobile || !adaptivePinning || cell.column.id === 'select') && cell.column.getIsPinned()
                        ? 'sticky bg-background group-hover:bg-muted/50 group-data-[state=selected]:bg-muted transition-colors'
                        : 'transition-colors',
                      (!isMobile || !adaptivePinning) && cell.column.getIsLastColumn('left')
                        ? 'border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]'
                        : '',
                      (!isMobile || !adaptivePinning) && cell.column.getIsFirstColumn('right')
                        ? 'border-l shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]'
                        : '',
                      isMobile && adaptivePinning && cell.column.id === 'select'
                        ? 'border-r shadow-[3px_0_6px_-2px_rgba(0,0,0,0.08)]'
                        : '',
                    ]"
                  >
                    <FlexRender
                      :render="cell.column.columnDef.cell"
                      :props="cell.getContext()"
                    />
                  </TableCell>
                </TableRow>

                <!-- Expanded Row in Standard Mode -->
                <TableRow
                  v-if="row.getIsExpanded()"
                  class="bg-muted/15 border-b hover:bg-muted/25 transition-colors"
                >
                  <TableCell :colspan="columnCount" class="p-4">
                    <slot name="expanded-row" :row="row.original" :table-row="row" />
                  </TableCell>
                </TableRow>
              </template>
            </template>
          </template>

          <!-- Empty State -->
          <template v-else>
            <TableRow>
              <TableCell :colspan="columnCount" class="h-24 text-center" :class="getCellDensityClass('')">
                <slot name="empty">
                  {{ resolvedEmptyMessage }}
                </slot>
              </TableCell>
            </TableRow>
          </template>
        </TableBody>
      </table>
    </div>

    <!-- Pagination -->
    <slot name="pagination">
      <DataTablePagination
        v-if="showPagination"
        :table="table"
        :total="totalRecords"
      />
    </slot>

    <!-- Floating Bulk Actions Bar -->
    <slot
      name="floating-bar"
      :table="table"
      :selected-rows="table?.getFilteredSelectedRowModel()?.rows ?? []"
      :selected-count="table?.getFilteredSelectedRowModel()?.rows?.length ?? 0"
    >
      <DataTableFloatingBar
        v-if="showFloatingBar"
        :table="table"
        :total-count="totalRecords"
        :config="effectiveBulkActions"
      >
        <template v-if="$slots['bulk-actions']" #actions="slotProps">
          <slot name="bulk-actions" v-bind="slotProps" />
        </template>
      </DataTableFloatingBar>
    </slot>

    <!-- Built-in Supabase-Style Row Edit Sheet -->
    <DynamicRowEditSheet
      v-if="resolvedRowEditConfig && editingRow"
      v-model:open="isRowEditOpen"
      :title="typeof resolvedRowEditConfig.title === 'function' ? resolvedRowEditConfig.title(editingRow) : (resolvedRowEditConfig.title ?? 'Chỉnh sửa bản ghi')"
      :description="resolvedRowEditConfig.description"
      :schema="resolvedRowEditConfig.schema"
      :field-overrides="resolvedRowEditConfig.fieldOverrides"
      :row="editingRow"
      :enable-swipe-to-close="resolvedRowEditConfig.swipeBack"
      :enable-back-navigation="resolvedRowEditConfig.enableHistoryBack"
      @save="handleSaveRowEdit"
      @cancel="closeRowEdit"
    />
  </div>
</template>
