import type { Row, Table } from '@tanstack/vue-table';
import type { Ref } from 'vue';
import type { SelectionApi } from './types.js';

export function createSelectionApi<TData>(
  getTable: () => Table<TData>,
  rowSelection: Ref<Record<string, boolean>>,
  clearSelectionFn: () => void
): SelectionApi<TData> {
  return {
    getSelectedRows(): Row<TData>[] {
      return getTable().getFilteredSelectedRowModel().rows;
    },

    getSelectedData(): TData[] {
      return getTable()
        .getFilteredSelectedRowModel()
        .rows.map((r) => r.original);
    },

    getSelectedIds(): string[] {
      const selected = getTable().getFilteredSelectedRowModel().rows;
      if (selected.length > 0) {
        return selected.map((r) => r.id);
      }
      return Object.keys(rowSelection.value).filter((id) => rowSelection.value[id]);
    },

    getSelectedRowIds(): string[] {
      return this.getSelectedIds();
    },

    selectAll(): void {
      getTable().toggleAllRowsSelected(true);
    },

    clearSelection(): void {
      clearSelectionFn();
    },

    toggleRow(rowId: string | number): void {
      const idStr = String(rowId);
      const row = getTable()
        .getRowModel()
        .rows.find((r) => r.id === idStr);
      if (row) {
        row.toggleSelected();
      } else {
        rowSelection.value = {
          ...rowSelection.value,
          [idStr]: !rowSelection.value[idStr],
        };
      }
    },

    toggleRowSelected(rowId: string | number): void {
      this.toggleRow(rowId);
    },

    isRowSelected(rowId: string | number): boolean {
      return !!rowSelection.value[String(rowId)];
    },

    isAllSelected(): boolean {
      const table = getTable();
      return table.getIsAllRowsSelected() || table.getIsAllPageRowsSelected();
    },

    getCount(): number {
      return getTable().getFilteredSelectedRowModel().rows.length;
    },

    getSelectedCount(): number {
      return this.getCount();
    },
  };
}
