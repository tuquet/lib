import { ref, type Ref } from 'vue';
import type { ColumnSort, SortingState } from '../types/index.js';

export interface UseTableSortingOptions {
  initialSorting?: SortingState;
  multiSort?: boolean;
}

export interface UseTableSortingReturn {
  sorting: Ref<SortingState>;
  setSorting: (newSorting: SortingState | ((prev: SortingState) => SortingState)) => void;
  toggleSorting: (id: string, isMulti?: boolean) => void;
  clearSorting: () => void;
}

export function useTableSorting(options: UseTableSortingOptions = {}): UseTableSortingReturn {
  const { initialSorting = [], multiSort = false } = options;

  const sorting = ref<SortingState>([...initialSorting]);

  const setSorting = (newSorting: SortingState | ((prev: SortingState) => SortingState)) => {
    sorting.value = typeof newSorting === 'function' ? newSorting(sorting.value) : newSorting;
  };

  const toggleSorting = (id: string, isMulti = multiSort) => {
    const existingIndex = sorting.value.findIndex((s) => s.id === id);

    if (existingIndex === -1) {
      // Not currently sorted -> asc
      const newSort: ColumnSort = { id, desc: false };
      sorting.value = isMulti ? [...sorting.value, newSort] : [newSort];
      return;
    }

    const current = sorting.value[existingIndex]!;

    if (!current.desc) {
      // asc -> desc
      const updatedSort: ColumnSort = { id, desc: true };
      if (isMulti) {
        const next = [...sorting.value];
        next[existingIndex] = updatedSort;
        sorting.value = next;
      } else {
        sorting.value = [updatedSort];
      }
      return;
    }

    // desc -> clear
    if (isMulti) {
      sorting.value = sorting.value.filter((s) => s.id !== id);
    } else {
      sorting.value = [];
    }
  };

  const clearSorting = () => {
    sorting.value = [];
  };

  return {
    sorting,
    setSorting,
    toggleSorting,
    clearSorting,
  };
}
