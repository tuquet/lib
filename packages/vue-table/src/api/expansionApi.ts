import type { ExpandedState, Table } from '@tanstack/vue-table';
import type { Ref } from 'vue';
import type { ExpansionApi } from './types.js';

export function createExpansionApi<TData>(
  getTable: () => Table<TData>,
  expandedState: Ref<ExpandedState>
): ExpansionApi {
  return {
    getExpanded(): ExpandedState {
      return expandedState.value;
    },

    isRowExpanded(rowId: string | number): boolean {
      const table = getTable();
      try {
        const row = table.getRow(String(rowId));
        return row ? row.getIsExpanded() : false;
      } catch {
        if (typeof expandedState.value === 'boolean') {
          return expandedState.value;
        }
        return !!(expandedState.value as Record<string, boolean>)[String(rowId)];
      }
    },

    isExpanded(rowId: string | number): boolean {
      return this.isRowExpanded(rowId);
    },

    toggleRowExpanded(rowId: string | number): void {
      const table = getTable();
      try {
        const row = table.getRow(String(rowId));
        if (row) {
          row.toggleExpanded();
          return;
        }
      } catch {
        // Fallback to direct state mutation if row object not yet materialized
      }

      const idStr = String(rowId);
      if (typeof expandedState.value === 'boolean') {
        expandedState.value = { [idStr]: !expandedState.value };
      } else {
        const current = expandedState.value as Record<string, boolean>;
        expandedState.value = {
          ...current,
          [idStr]: !current[idStr],
        };
      }
    },

    toggleRow(rowId: string | number): void {
      this.toggleRowExpanded(rowId);
    },

    expandAll(): void {
      getTable().toggleAllRowsExpanded(true);
    },

    collapseAll(): void {
      getTable().toggleAllRowsExpanded(false);
    },

    getExpandedCount(): number {
      if (typeof expandedState.value === 'boolean') {
        return expandedState.value ? getTable().getRowModel().rows.length : 0;
      }
      return Object.values(expandedState.value as Record<string, boolean>).filter(Boolean).length;
    },
  };
}
