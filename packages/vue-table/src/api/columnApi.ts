import type { Column, Table } from '@tanstack/vue-table';
import type { ColumnApi } from './types.js';

export function createColumnApi<TData>(getTable: () => Table<TData>): ColumnApi<TData> {
  return {
    getColumns(): Column<TData, unknown>[] {
      return getTable().getAllLeafColumns();
    },

    getVisibleColumns(): Column<TData, unknown>[] {
      return getTable().getVisibleLeafColumns();
    },

    getColumn(id: string): Column<TData, unknown> | undefined {
      return getTable().getColumn(id);
    },

    setVisible(columnId: string, visible: boolean): void {
      const col = getTable().getColumn(columnId);
      if (col) {
        col.toggleVisibility(visible);
      }
    },

    toggleVisibility(columnId: string): void {
      const col = getTable().getColumn(columnId);
      if (col) {
        col.toggleVisibility();
      }
    },

    showAll(): void {
      getTable().toggleAllColumnsVisible(true);
    },

    hideAll(): void {
      getTable().toggleAllColumnsVisible(false);
    },

    pin(columnId: string, position: 'left' | 'right' | false): void {
      const col = getTable().getColumn(columnId);
      if (col) {
        col.pin(position);
      }
    },

    unpin(columnId: string): void {
      this.pin(columnId, false);
    },

    isPinned(columnId: string): 'left' | 'right' | false {
      return (getTable().getColumn(columnId)?.getIsPinned() ?? false) as 'left' | 'right' | false;
    },

    isVisible(columnId: string): boolean {
      return getTable().getColumn(columnId)?.getIsVisible() ?? false;
    },

    setSize(columnId: string, size: number): void {
      const table = getTable();
      table.setColumnSizing((prev) => ({
        ...prev,
        [columnId]: size,
      }));
    },

    resetSize(columnId?: string): void {
      const table = getTable();
      if (columnId) {
        table.getColumn(columnId)?.resetSize();
      } else {
        table.resetColumnSizing();
      }
    },
  };
}
