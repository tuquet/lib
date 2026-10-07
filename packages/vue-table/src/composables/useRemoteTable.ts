import {
  type ColumnDef,
  type ExpandedState,
  type Row,
  type Table,
  getCoreRowModel,
  getExpandedRowModel,
  useVueTable,
} from '@tanstack/vue-table';
import {
  computed,
  getCurrentInstance,
  getCurrentScope,
  onMounted,
  onScopeDispose,
  ref,
  watch,
  type ComputedRef,
  type Ref,
} from 'vue';
import { StandardRestAdapter } from '../adapters/standard-rest.js';
import type {
  ColumnPinningState,
  DynamicFilterRule,
  FetchParams,
  FetchResult,
  FilterConjunction,
  FilterDef,
  FilterPreset,
  QueryAdapter,
  TableState,
} from '../types/index.js';
import { isRuleComplete } from '../helpers/filterEngine.js';
import { useTableFilters } from './useTableFilters.js';
import { useTableMutations, type RowPredicate, type RowUpdater } from './useTableMutations.js';
import { useTablePagination } from './useTablePagination.js';
import { useTableSelection } from './useTableSelection.js';
import { useTableSorting } from './useTableSorting.js';
import { useUrlSync } from './useUrlSync.js';
import { useSavedViews, type UseSavedViewsReturn } from './useSavedViews.js';
import type { TableSavedViewState } from '../types/savedViews.js';
import type { TablePlugin, TableCellEditEvent, TablePluginContext } from '../plugins/types.js';
import {
  createColumnApi,
  createFilterApi,
  createSelectionApi,
  createPaginationApi,
  createExportApi,
  createExpansionApi,
  createViewsApi,
  createTableApi,
  type TableApi,
} from '../api/index.js';

export { type RowPredicate, type RowUpdater };
export type { TablePlugin, TableCellEditEvent, TablePluginContext };

export interface UseRemoteTableOptions<TData, TValue = unknown> {
  columns: ColumnDef<TData, TValue>[];
  fetcher: (params: FetchParams) => Promise<FetchResult<TData>>;
  defaultPageSize?: number;
  syncWithUrl?: boolean;
  debounceMs?: number;
  adapter?: QueryAdapter;
  filters?: FilterDef[];
  dynamicRules?: DynamicFilterRule[];
  conjunction?: FilterConjunction;
  columnPinning?: ColumnPinningState;
  initialState?: Partial<TableState>;
  getRowId?: (row: TData) => string;
  plugins?: TablePlugin<TData>[];
  enableColumnResizing?: boolean;
  columnResizeMode?: 'onChange' | 'onEnd';
  enableRowExpansion?: boolean;
  savedViewsKey?: string;
}

export interface UseRemoteTableReturn<TData> {
  table: Table<TData>;
  data: Ref<TData[]>;
  total: Ref<number>;
  pageCount: ComputedRef<number>;
  isLoading: Ref<boolean>;
  isFetching: Ref<boolean>;
  isError: Ref<boolean>;
  error: Ref<Error | null>;
  searchQuery: Ref<string>;
  filters: Ref<Record<string, unknown>>;
  activeFilterCount: ComputedRef<number>;
  filterDefs: FilterDef[];
  dynamicRules: Ref<DynamicFilterRule[]>;
  conjunction: Ref<FilterConjunction>;
  setDynamicRules: (rules: DynamicFilterRule[]) => void;
  setDynamicConjunction: (conj: FilterConjunction) => void;
  applyFilterPreset: (preset: FilterPreset) => void;
  clearDynamicRules: () => void;
  setFilter: (id: string, value: unknown) => void;
  resetFilters: () => void;
  refetch: () => Promise<void>;
  invalidate: () => Promise<void>;

  // Selection shortcuts
  selectedRows: ComputedRef<Row<TData>[]>;
  selectedRowIds: ComputedRef<string[]>;
  selectedCount: ComputedRef<number>;
  clearSelection: () => void;

  // Optimistic CRUD mutations
  mutateRow: (predicateOrId: RowPredicate<TData>, updater: RowUpdater<TData>) => void;
  deleteRow: (predicateOrId: RowPredicate<TData> | (string | number)[]) => void;
  prependRow: (newRow: TData) => void;
  appendRow: (newRow: TData) => void;
  setData: (updaterOrValue: TData[] | ((prev: TData[]) => TData[]), newTotal?: number) => void;

  // Column Ergonomics
  columnPinning: Ref<ColumnPinningState>;
  setColumnPinning: (pinning: ColumnPinningState) => void;

  // Row Expansion
  expanded: Ref<ExpandedState>;
  toggleRowExpanded: (rowId: string | number) => void;
  expandAll: () => void;
  collapseAll: () => void;
  isRowExpanded: (rowId: string | number) => boolean;

  // Saved Views
  savedViews: UseSavedViewsReturn;
  getCurrentState: () => TableSavedViewState;

  // Plugin Pipeline
  plugins: TablePlugin<TData>[];
  notifyCellEdit: (event: TableCellEditEvent<TData>) => Promise<boolean>;

  // Unified Enterprise Table API Facade
  api: TableApi<TData>;
}

export function useRemoteTable<TData, TValue = unknown>(
  options: UseRemoteTableOptions<TData, TValue>
): UseRemoteTableReturn<TData> {
  const {
    columns,
    fetcher,
    defaultPageSize = 10,
    syncWithUrl = true,
    debounceMs = 300,
    adapter = new StandardRestAdapter(),
    filters: filterDefs = [],
    initialState = {},
  } = options;

  const data = ref<TData[]>([]) as Ref<TData[]>;
  const isLoading = ref(true);
  const isFetching = ref(false);
  const isError = ref(false);
  const error = ref<Error | null>(null);

  // 1. Pagination Composable
  const { pagination, pageIndex, pageSize, total, pageCount, setPageIndex, setPageSize } =
    useTablePagination({
      initialPageIndex: initialState.pagination?.pageIndex ?? 0,
      initialPageSize: initialState.pagination?.pageSize ?? defaultPageSize,
      initialTotal: 0,
    });

  // 2. Sorting Composable
  const { sorting } = useTableSorting({
    initialSorting: initialState.sorting ?? [],
  });

  // 3. Filters Composable
  const {
    filters: columnFilters,
    searchQuery,
    activeFilterCount: baseActiveFilterCount,
    setFilter,
    resetFilters: resetColumnFilters,
  } = useTableFilters({
    initialFilters: initialState.filters ?? {},
    initialSearch: initialState.search ?? '',
    filterDefs,
  });

  // Dynamic Database Filter Rules State
  const dynamicRules = ref<DynamicFilterRule[]>(
    initialState.dynamicRules
      ? [...initialState.dynamicRules]
      : options.dynamicRules
        ? [...options.dynamicRules]
        : []
  );
  const dynamicConjunction = ref<FilterConjunction>(
    initialState.conjunction ?? options.conjunction ?? 'and'
  );

  const activeFilterCount = computed(() => {
    const validDynamicCount = dynamicRules.value.filter(isRuleComplete).length;
    return baseActiveFilterCount.value + validDynamicCount;
  });

  const resetFilters = () => {
    resetColumnFilters();
    dynamicRules.value = [];
  };

  const setDynamicRules = (rules: DynamicFilterRule[]) => {
    dynamicRules.value = rules;
  };

  const setDynamicConjunction = (conj: FilterConjunction) => {
    dynamicConjunction.value = conj;
  };

  const applyFilterPreset = (preset: FilterPreset) => {
    dynamicRules.value = [...preset.rules];
    dynamicConjunction.value = preset.conjunction;
  };

  const clearDynamicRules = () => {
    dynamicRules.value = [];
  };

  // 4. Selection Composable
  const { rowSelection, selectedRowIds } = useTableSelection<TData>({
    initialSelection: {},
  });

  // 5. Column Visibility & Pinning
  const columnVisibility = ref<Record<string, boolean>>(initialState.columnVisibility ?? {});
  const columnPinning = ref<ColumnPinningState>(
    initialState.columnPinning ?? options.columnPinning ?? { left: [], right: [] }
  );

  // 6. Row Expansion State
  const expanded = ref<ExpandedState>({});

  // 7. Optimistic CRUD Mutations Composable
  const { mutateRow, deleteRow, prependRow, appendRow, setData } = useTableMutations<TData>({
    data,
    total,
    getRowId: options.getRowId,
  });

  // URL Synchronization
  const urlSync = useUrlSync({
    adapter,
    enabled: syncWithUrl,
    onUrlChange: (newState) => {
      if (newState.pagination) pagination.value = newState.pagination;
      if (newState.sorting) sorting.value = newState.sorting;
      if (newState.filters) columnFilters.value = newState.filters;
      if (newState.dynamicRules) dynamicRules.value = newState.dynamicRules;
      if (newState.conjunction) dynamicConjunction.value = newState.conjunction;
      if (newState.search !== undefined) searchQuery.value = newState.search;
    },
  });

  // Apply initial state from URL if enabled
  if (syncWithUrl && typeof window !== 'undefined') {
    const urlState = urlSync.getInitialState();
    if (urlState.pagination) pagination.value = urlState.pagination;
    if (urlState.sorting) sorting.value = urlState.sorting;
    if (urlState.filters) columnFilters.value = urlState.filters;
    if (urlState.dynamicRules) dynamicRules.value = urlState.dynamicRules;
    if (urlState.conjunction) dynamicConjunction.value = urlState.conjunction;
    if (urlState.search !== undefined) searchQuery.value = urlState.search;
  }

  const plugins = options.plugins
    ? [...options.plugins].sort((a, b) => (a.order ?? 100) - (b.order ?? 100))
    : [];

  const pluginContext: TablePluginContext<TData> = {
    data,
    total,
    pagination,
    sorting,
    filters: columnFilters,
    searchQuery,
    columnVisibility,
    columnPinning,
    refetch: async () => {
      await executeFetch();
    },
    mutateRow,
  };

  let activeController: AbortController | null = null;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const executeFetch = async () => {
    if (activeController) {
      activeController.abort('New table query initiated');
    }
    activeController = new AbortController();
    const signal = activeController.signal;

    isFetching.value = true;
    isError.value = false;
    error.value = null;

    const currentState: TableState = {
      pagination: pagination.value,
      sorting: sorting.value,
      filters: columnFilters.value,
      dynamicRules: dynamicRules.value,
      conjunction: dynamicConjunction.value,
      search: searchQuery.value,
      columnVisibility: columnVisibility.value,
      columnPinning: columnPinning.value,
    };

    if (syncWithUrl) {
      urlSync.updateUrl(currentState);
    }

    const queryParams = adapter.serialize(currentState);
    const offset = pagination.value.pageIndex * pagination.value.pageSize;

    let params: FetchParams = {
      page: pagination.value.pageIndex + 1,
      limit: pagination.value.pageSize,
      offset,
      sort: currentState.sorting.map((s) => (s.desc ? `-${s.id}` : s.id)).join(','),
      search: currentState.search,
      filters: currentState.filters,
      dynamicRules: currentState.dynamicRules,
      conjunction: currentState.conjunction,
      signal,
      queryParams,
      toQueryString: () => {
        const sp = new URLSearchParams();
        for (const [k, v] of Object.entries(queryParams)) {
          if (v !== undefined && v !== null && v !== '') {
            sp.set(k, String(v));
          }
        }
        return sp.toString();
      },
    };

    for (const plugin of plugins) {
      if (plugin.onBeforeFetch) {
        const modified = await plugin.onBeforeFetch(params, pluginContext);
        if (modified) params = modified;
      }
    }

    try {
      let result = await fetcher(params);
      for (const plugin of plugins) {
        if (plugin.onAfterFetch) {
          const modified = await plugin.onAfterFetch(result, pluginContext);
          if (modified) result = modified;
        }
      }
      if (!signal.aborted) {
        data.value = result.data;
        total.value = result.total;
      }
    } catch (err: unknown) {
      const isAbort =
        (err instanceof DOMException && err.name === 'AbortError') ||
        (typeof err === 'object' &&
          err !== null &&
          ((err as { name?: string }).name === 'AbortError' ||
            (err as { name?: string }).name === 'CanceledError'));
      if (isAbort) {
        return;
      }
      isError.value = true;
      error.value = err instanceof Error ? err : new Error(String(err));
    } finally {
      if (!signal.aborted) {
        isLoading.value = false;
        isFetching.value = false;
      }
    }
  };

  const scheduleFetch = (immediate = false) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }

    if (immediate || debounceMs <= 0) {
      executeFetch();
    } else {
      debounceTimer = setTimeout(() => {
        executeFetch();
      }, debounceMs);
    }
  };

  // TanStack Table Instance
  const table = useVueTable({
    get data() {
      return data.value;
    },
    columns,
    getRowId: options.getRowId,
    get pageCount() {
      return pageCount.value;
    },
    state: {
      get pagination() {
        return pagination.value;
      },
      get sorting() {
        return sorting.value;
      },
      get columnVisibility() {
        return columnVisibility.value;
      },
      get columnPinning() {
        return columnPinning.value;
      },
      get rowSelection() {
        return rowSelection.value;
      },
      get expanded() {
        return expanded.value;
      },
    },
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    onPaginationChange: (updaterOrValue) => {
      pagination.value =
        typeof updaterOrValue === 'function' ? updaterOrValue(pagination.value) : updaterOrValue;
      scheduleFetch(true);
    },
    onSortingChange: (updaterOrValue) => {
      sorting.value =
        typeof updaterOrValue === 'function' ? updaterOrValue(sorting.value) : updaterOrValue;
      pagination.value.pageIndex = 0;
      scheduleFetch(true);
    },
    onColumnVisibilityChange: (updaterOrValue) => {
      columnVisibility.value =
        typeof updaterOrValue === 'function'
          ? updaterOrValue(columnVisibility.value)
          : updaterOrValue;
    },
    onColumnPinningChange: (updaterOrValue) => {
      columnPinning.value =
        typeof updaterOrValue === 'function' ? updaterOrValue(columnPinning.value) : updaterOrValue;
    },
    onRowSelectionChange: (updaterOrValue) => {
      rowSelection.value =
        typeof updaterOrValue === 'function' ? updaterOrValue(rowSelection.value) : updaterOrValue;
    },
    onExpandedChange: (updaterOrValue) => {
      expanded.value =
        typeof updaterOrValue === 'function' ? updaterOrValue(expanded.value) : updaterOrValue;
    },
    enableColumnResizing: options.enableColumnResizing ?? true,
    columnResizeMode: options.columnResizeMode ?? 'onChange',
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  pluginContext.table = table;

  for (const plugin of plugins) {
    if (plugin.setup) {
      plugin.setup(pluginContext);
    }
  }

  const notifyCellEdit = async (event: TableCellEditEvent<TData>): Promise<boolean> => {
    for (const plugin of plugins) {
      if (plugin.onCellEdit) {
        const allow = await plugin.onCellEdit(event, pluginContext);
        if (allow === false) {
          return false;
        }
      }
    }
    return true;
  };

  // Watchers for Search and Filters (reset page to 0 on filter change)
  watch(searchQuery, () => {
    pagination.value.pageIndex = 0;
    scheduleFetch(false); // debounced
  });

  watch(
    columnFilters,
    () => {
      pagination.value.pageIndex = 0;
      scheduleFetch(true); // immediate
    },
    { deep: true }
  );

  watch(
    [dynamicRules, dynamicConjunction],
    () => {
      pagination.value.pageIndex = 0;
      scheduleFetch(false); // debounced
    },
    { deep: true }
  );

  const refetch = async () => {
    await executeFetch();
  };

  const invalidate = refetch;

  // Selection shortcuts derived from Table instance
  const selectedRows = computed<Row<TData>[]>(() => table.getSelectedRowModel().rows);
  const selectedCount = computed(() => selectedRows.value.length);
  const clearSelection = () => table.resetRowSelection();

  const setColumnPinning = (pinning: ColumnPinningState) => {
    columnPinning.value = pinning;
  };

  if (getCurrentInstance()) {
    onMounted(() => {
      executeFetch();
    });
  } else {
    executeFetch();
  }

  if (getCurrentScope()) {
    onScopeDispose(() => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }
      if (activeController) {
        activeController.abort('Table composable disposed or unmounted');
        activeController = null;
      }
      for (const plugin of plugins) {
        if (plugin.onDestroy) {
          plugin.onDestroy(pluginContext);
        }
      }
    });
  }

  // Assemble Enterprise Table API Facades
  const columnApi = createColumnApi(() => table);
  const filterApi = createFilterApi({
    searchQuery,
    filters: columnFilters,
    setFilter,
    resetFilters,
    activeFilterCount,
    dynamicRules,
    dynamicConjunction,
  });
  const selectionApi = createSelectionApi(() => table, rowSelection, clearSelection);
  const paginationApi = createPaginationApi({
    pageIndex,
    pageSize,
    total,
    pageCount,
    setPageIndex,
    setPageSize,
  });
  const exportApi = createExportApi({
    getData: () => data.value,
    getColumns: () => columns as ColumnDef<TData, any>[],
  });

  // Row Expansion Helpers
  const toggleRowExpanded = (rowId: string | number) => {
    table.getRow(String(rowId))?.toggleExpanded();
  };
  const expandAll = () => table.toggleAllRowsExpanded(true);
  const collapseAll = () => table.toggleAllRowsExpanded(false);
  const isRowExpanded = (rowId: string | number) => {
    return !!table.getRow(String(rowId))?.getIsExpanded();
  };

  // Saved Views Manager
  const getCurrentState = (): TableSavedViewState => ({
    columnVisibility: columnVisibility.value,
    columnPinning: columnPinning.value,
    columnSizing: table.getState().columnSizing,
    sorting: sorting.value,
    filters: columnFilters.value,
    search: searchQuery.value,
    pageSize: pagination.value.pageSize,
  });

  const savedViews = useSavedViews({
    storageKey: options.savedViewsKey,
    onApplyView: (view) => {
      if (view.state.columnVisibility) {
        columnVisibility.value = view.state.columnVisibility;
      }
      if (view.state.columnPinning) {
        columnPinning.value = view.state.columnPinning;
      }
      if (view.state.columnSizing) {
        table.setColumnSizing(view.state.columnSizing);
      }
      if (view.state.sorting) {
        sorting.value = view.state.sorting;
      }
      if (view.state.pageSize) {
        setPageSize(view.state.pageSize);
      }
      if (view.state.search !== undefined) {
        searchQuery.value = view.state.search;
      }
      if (view.state.filters) {
        columnFilters.value = view.state.filters;
      }
    },
  });

  const expansionApi = createExpansionApi(() => table, expanded);
  const viewsApi = createViewsApi({
    views: savedViews.views,
    activeView: savedViews.activeView,
    applyView: savedViews.applyView,
    saveView: (name) => savedViews.saveView(name, getCurrentState()),
    updateActiveView: () => {
      const activeId = savedViews.activeViewId.value;
      if (activeId) {
        savedViews.updateView(activeId, getCurrentState());
      }
    },
    deleteView: savedViews.deleteView,
    resetToDefault: savedViews.resetToDefault,
  });

  const api = createTableApi({
    column: columnApi,
    filter: filterApi,
    selection: selectionApi,
    pagination: paginationApi,
    export: exportApi,
    expansion: expansionApi,
    views: viewsApi,
    getTable: () => table,
    refresh: refetch,
    mutateRow,
    deleteRow,
    notifyCellEdit,
  });

  if (getCurrentScope()) {
    onScopeDispose(() => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }
      if (activeController) {
        activeController.abort('Table composable disposed');
        activeController = null;
      }
      for (const plugin of plugins) {
        plugin.onDestroy?.(pluginContext);
      }
    });
  }

  return {
    table,
    data,
    total,
    pageCount,
    isLoading,
    isFetching,
    isError,
    error,
    searchQuery,
    filters: columnFilters,
    activeFilterCount,
    filterDefs,
    dynamicRules,
    conjunction: dynamicConjunction,
    setDynamicRules,
    setDynamicConjunction,
    applyFilterPreset,
    clearDynamicRules,
    setFilter,
    resetFilters,
    refetch,
    invalidate,
    selectedRows,
    selectedRowIds,
    selectedCount,
    clearSelection,
    mutateRow,
    deleteRow,
    prependRow,
    appendRow,
    setData,
    columnPinning,
    setColumnPinning,
    expanded,
    toggleRowExpanded,
    expandAll,
    collapseAll,
    isRowExpanded,
    savedViews,
    getCurrentState,
    plugins,
    notifyCellEdit,
    api,
  };
}
