import type { Table } from '@tanstack/vue-table';
import type { Ref } from 'vue';
import type {
  ColumnPinningState,
  FetchParams,
  FetchResult,
  PaginationState,
  SortingState,
} from '../types/index.js';
import type { RowPredicate, RowUpdater } from '../composables/useTableMutations.js';

export interface TableCellEditEvent<TData = any> {
  key?: string;
  field?: string;
  rowId?: string | number;
  oldValue: any;
  newValue: any;
  row: TData;
  timestamp?: number;
}

export interface TablePluginContext<TData = any> {
  data: Ref<TData[]>;
  total: Ref<number>;
  table?: Table<TData>;
  pagination: Ref<PaginationState>;
  sorting: Ref<SortingState>;
  filters: Ref<Record<string, unknown>>;
  searchQuery: Ref<string>;
  columnVisibility: Ref<Record<string, boolean>>;
  columnPinning: Ref<ColumnPinningState>;
  refetch: () => Promise<void>;
  mutateRow: (predicateOrId: RowPredicate<TData>, updater: RowUpdater<TData>) => void;
}

export interface TablePlugin<TData = any> {
  name: string;
  order?: number;
  setup?: (context: TablePluginContext<TData>) => void;
  onBeforeFetch?: (
    params: FetchParams,
    context: TablePluginContext<TData>
  ) => FetchParams | void | Promise<FetchParams | void>;
  onAfterFetch?: (
    result: FetchResult<TData>,
    context: TablePluginContext<TData>
  ) => FetchResult<TData> | void | Promise<FetchResult<TData> | void>;
  onCellEdit?: (
    event: TableCellEditEvent<TData>,
    context: TablePluginContext<TData>
  ) => boolean | void | Promise<boolean | void>;
  onDestroy?: (context: TablePluginContext<TData>) => void;
}
