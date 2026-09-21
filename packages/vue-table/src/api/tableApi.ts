import type { Table } from '@tanstack/vue-table';
import type { RowPredicate, RowUpdater } from '../composables/useTableMutations.js';
import type { TableCellEditEvent } from '../plugins/types.js';
import type {
  ColumnApi,
  ExportApi,
  FilterApi,
  PaginationApi,
  ScrollApi,
  SelectionApi,
  TableApi,
  ViewsApi,
  ExpansionApi,
} from './types.js';

export interface CreateTableApiOptions<TData> {
  column: ColumnApi<TData>;
  filter: FilterApi;
  selection: SelectionApi<TData>;
  pagination: PaginationApi;
  export: ExportApi<TData>;
  expansion?: ExpansionApi;
  views?: ViewsApi;
  scroll?: ScrollApi;
  getTable: () => Table<TData>;
  refresh: () => Promise<void>;
  mutateRow: (predicateOrId: RowPredicate<TData>, updater: RowUpdater<TData>) => void;
  deleteRow: (predicateOrId: RowPredicate<TData> | (string | number)[]) => void;
  notifyCellEdit: (event: TableCellEditEvent<TData>) => Promise<boolean>;
}

export function createTableApi<TData>(options: CreateTableApiOptions<TData>): TableApi<TData> {
  return {
    column: options.column,
    filter: options.filter,
    selection: options.selection,
    pagination: options.pagination,
    export: options.export,
    expansion: options.expansion,
    views: options.views,
    scroll: options.scroll,

    async refresh(): Promise<void> {
      await options.refresh();
    },

    async refetch(): Promise<void> {
      await this.refresh();
    },

    mutateRow(predicateOrId: RowPredicate<TData>, updater: RowUpdater<TData>): void {
      options.mutateRow(predicateOrId, updater);
    },

    deleteRow(predicateOrId: RowPredicate<TData> | (string | number)[]): void {
      options.deleteRow(predicateOrId);
    },

    async notifyCellEdit(event: TableCellEditEvent<TData>): Promise<boolean> {
      return options.notifyCellEdit(event);
    },

    getRawTable(): Table<TData> {
      return options.getTable();
    },
  };
}
