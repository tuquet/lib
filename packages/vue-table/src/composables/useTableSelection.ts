import type { Row, Table } from '@tanstack/vue-table';
import { computed, ref, type ComputedRef, type Ref } from 'vue';

export interface UseTableSelectionOptions<TData = unknown> {
  table?: Table<TData> | Ref<Table<TData> | undefined> | (() => Table<TData> | undefined);
  initialSelection?: Record<string, boolean>;
}

export interface UseTableSelectionReturn<TData = unknown> {
  rowSelection: Ref<Record<string, boolean>>;
  selectedRowIds: ComputedRef<string[]>;
  selectedCount: ComputedRef<number>;
  selectedRows: ComputedRef<Row<TData>[]>;
  setRowSelection: (
    updaterOrValue:
      Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)
  ) => void;
  toggleRow: (id: string, selected?: boolean) => void;
  clearSelection: () => void;
}

export function useTableSelection<TData = unknown>(
  options: UseTableSelectionOptions<TData> = {}
): UseTableSelectionReturn<TData> {
  const { initialSelection = {}, table } = options;

  const rowSelection = ref<Record<string, boolean>>({ ...initialSelection });

  const selectedRowIds = computed(() =>
    Object.keys(rowSelection.value).filter((key) => rowSelection.value[key])
  );

  const getTable = (): Table<TData> | undefined => {
    if (!table) return undefined;
    if (typeof table === 'function') return table();
    if ('value' in table) return table.value;
    return table;
  };

  const selectedRows = computed<Row<TData>[]>(() => {
    const tbl = getTable();
    if (tbl) {
      return tbl.getFilteredSelectedRowModel().rows;
    }
    return [];
  });

  const selectedCount = computed(() => {
    const tbl = getTable();
    if (tbl) {
      return selectedRows.value.length;
    }
    return selectedRowIds.value.length;
  });

  const setRowSelection = (
    updaterOrValue:
      Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)
  ) => {
    rowSelection.value =
      typeof updaterOrValue === 'function' ? updaterOrValue(rowSelection.value) : updaterOrValue;
  };

  const toggleRow = (id: string, selected?: boolean) => {
    const isCurrentlySelected = !!rowSelection.value[id];
    const nextSelected = selected !== undefined ? selected : !isCurrentlySelected;

    if (nextSelected) {
      rowSelection.value = {
        ...rowSelection.value,
        [id]: true,
      };
    } else {
      const next = { ...rowSelection.value };
      delete next[id];
      rowSelection.value = next;
    }
  };

  const clearSelection = () => {
    const tbl = getTable();
    if (tbl) {
      tbl.resetRowSelection();
    }
    rowSelection.value = {};
  };

  return {
    rowSelection,
    selectedRowIds,
    selectedCount,
    selectedRows,
    setRowSelection,
    toggleRow,
    clearSelection,
  };
}
