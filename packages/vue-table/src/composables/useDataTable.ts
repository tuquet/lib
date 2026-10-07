import { computed, ref, isRef, type Ref } from 'vue';
import type { ColumnDef, Table } from '@tanstack/vue-table';
import { useRemoteTable, type UseRemoteTableReturn } from './useRemoteTable.js';
import type {
  DataTableConfig,
  BulkActionsConfig,
  ExportConfig,
  FilterConfig,
  MobileConfig,
  PaginationConfig,
  RowEditConfig,
  SavedViewsConfig,
  VirtualConfig,
  DensityConfig,
  TableDensity,
} from '../types/config.js';
import type { FetchParams, FetchResult } from '../types/index.js';
import {
  resolveBulkActionsConfig,
  resolveExportConfig,
  resolveFilterConfig,
  resolveMobileConfig,
  resolvePaginationConfig,
  resolveRowEditConfig,
  resolveSavedViewsConfig,
  resolveVirtualConfig,
} from '../helpers/configResolver.js';

export interface UseDataTableOptions<TData, TValue = unknown> {
  columns: ColumnDef<TData, TValue>[];
  /**
   * Remote fetcher function or local static dataset
   */
  fetcher?: (params: FetchParams) => Promise<FetchResult<TData>>;
  data?: TData[] | ((params: FetchParams) => Promise<FetchResult<TData>>);
  api?: string;
  /**
   * Unified Master Object Config
   */
  config?: DataTableConfig<TData>;
  /**
   * Feature-specific Object Configs (can also be passed inside `config`)
   */
  bulkActions?: boolean | BulkActionsConfig<TData>;
  export?: boolean | ExportConfig<TData>;
  filter?: boolean | FilterConfig<TData>;
  virtual?: boolean | VirtualConfig;
  mobile?: boolean | MobileConfig<TData>;
  savedViews?: boolean | SavedViewsConfig<TData>;
  rowEdit?: boolean | RowEditConfig<TData>;
  pagination?: boolean | PaginationConfig;
  density?: TableDensity | DensityConfig;
}

export interface UseDataTableReturn<TData> {
  readonly isTuquetTableInstance: true;
  remote: UseRemoteTableReturn<TData>;
  table: Table<TData>;
  columns: ColumnDef<TData, any>[];
  config: DataTableConfig<TData>;
  // Resolved sub-configs for fast access
  resolvedBulkActions: BulkActionsConfig<TData> | null;
  resolvedExport: ExportConfig<TData> | null;
  resolvedFilter: FilterConfig<TData> | null;
  resolvedVirtual: VirtualConfig | null;
  resolvedMobile: MobileConfig<TData> | null;
  resolvedSavedViews: SavedViewsConfig<TData> | null;
  resolvedRowEdit: RowEditConfig<TData> | null;
  resolvedPagination: PaginationConfig | null;
  // State helpers
  selectedRows: Ref<TData[]>;
  selectedCount: Ref<number>;
  clearSelection: () => void;
  // Row edit helpers
  isRowEditOpen: Ref<boolean>;
  editingRow: Ref<TData | null>;
  openRowEdit: (row: TData) => void;
  closeRowEdit: () => void;
}

/**
 * Unified Enterprise Facade Composable for Tuquet DataTable.
 * Consolidates remote data fetching, TanStack Table instance, and all Progressive Object Configs.
 */
export function useDataTable<TData, TValue = unknown>(
  options: UseDataTableOptions<TData, TValue>
): UseDataTableReturn<TData> {
  // 1. Resolve Master Config
  const masterConfig: DataTableConfig<TData> = {
    ...options.config,
    bulkActions: options.bulkActions ?? options.config?.bulkActions,
    export: options.export ?? options.config?.export,
    filter: options.filter ?? options.config?.filter,
    virtual: options.virtual ?? options.config?.virtual,
    mobile: options.mobile ?? options.config?.mobile,
    savedViews: options.savedViews ?? options.config?.savedViews,
    rowEdit: options.rowEdit ?? options.config?.rowEdit,
    pagination: options.pagination ?? options.config?.pagination,
    density: options.density ?? options.config?.density,
  };

  const resolvedBulkActions = resolveBulkActionsConfig(masterConfig.bulkActions);
  const resolvedExport = resolveExportConfig(masterConfig.export);
  const resolvedFilter = resolveFilterConfig(masterConfig.filter);
  const resolvedVirtual = resolveVirtualConfig(masterConfig.virtual);
  const resolvedMobile = resolveMobileConfig(masterConfig.mobile);
  const resolvedSavedViews = resolveSavedViewsConfig(masterConfig.savedViews);
  const resolvedRowEdit = resolveRowEditConfig(masterConfig.rowEdit);
  const resolvedPagination = resolvePaginationConfig(masterConfig.pagination);

  // 2. Resolve Fetcher
  let fetcher = options.fetcher;
  if (!fetcher && typeof options.data === 'function') {
    fetcher = options.data;
  }
  if (!fetcher && Array.isArray(options.data)) {
    const localData = options.data;
    fetcher = async (params: FetchParams) => {
      let result = [...localData];
      if (params.search) {
        const q = params.search.toLowerCase();
        result = result.filter((item) => JSON.stringify(item).toLowerCase().includes(q));
      }
      if (params.sort) {
        const isDesc = params.sort.startsWith('-');
        const field = isDesc ? params.sort.slice(1) : params.sort;
        result.sort((a, b) => {
          const valA = (a as any)[field];
          const valB = (b as any)[field];
          if (valA === valB) return 0;
          return isDesc ? (valB > valA ? 1 : -1) : valA > valB ? 1 : -1;
        });
      }
      const start = (params.page - 1) * params.limit;
      return {
        data: result.slice(start, start + params.limit),
        total: result.length,
      };
    };
  }
  if (!fetcher && options.api) {
    const endpoint = options.api;
    fetcher = async (params: FetchParams) => {
      const url = new URL(
        endpoint,
        typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
      );
      url.searchParams.set('page', String(params.page));
      url.searchParams.set('limit', String(params.limit));
      if (params.search) url.searchParams.set('q', params.search);
      if (params.sort) url.searchParams.set('sort', params.sort);
      const res = await fetch(url.toString());
      return await res.json();
    };
  }

  // Fallback empty fetcher if none provided
  const safeFetcher = fetcher ?? (async () => ({ data: [], total: 0 }));

  // 3. Initialize Remote Table
  const remote = useRemoteTable<TData>({
    columns: options.columns,
    fetcher: safeFetcher,
    defaultPageSize: resolvedPagination?.pageSize ?? 10,
    debounceMs: resolvedFilter?.debounceMs ?? 300,
    savedViewsKey: resolvedSavedViews?.storageKey,
    enableRowExpansion: masterConfig.enableRowExpansion ?? false,
    enableColumnResizing: masterConfig.enableColumnResizing ?? false,
  });

  // 4. Reactive Selected Rows
  const selectedRows = computed<TData[]>(() => remote.selectedRows.value.map((r) => r.original));
  const selectedCount = computed(() => selectedRows.value.length);

  function clearSelection() {
    remote.clearSelection();
  }

  // 5. Row Edit Sheet State
  const isRowEditOpen = ref(false);
  const editingRow = ref<TData | null>(null) as Ref<TData | null>;

  function openRowEdit(row: TData) {
    editingRow.value = row;
    isRowEditOpen.value = true;
  }

  function closeRowEdit() {
    isRowEditOpen.value = false;
    editingRow.value = null;
  }

  return {
    isTuquetTableInstance: true,
    remote,
    table: remote.table as Table<TData>,
    columns: options.columns,
    config: masterConfig,
    resolvedBulkActions,
    resolvedExport,
    resolvedFilter,
    resolvedVirtual,
    resolvedMobile,
    resolvedSavedViews,
    resolvedRowEdit,
    resolvedPagination,
    selectedRows,
    selectedCount,
    clearSelection,
    isRowEditOpen,
    editingRow,
    openRowEdit,
    closeRowEdit,
  };
}
