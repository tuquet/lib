import { computed, ref, type ComputedRef, type Ref } from 'vue';
import type { FilterDef } from '../types/index.js';

export interface UseTableFiltersOptions {
  initialFilters?: Record<string, unknown>;
  initialSearch?: string;
  filterDefs?: FilterDef[];
}

export interface UseTableFiltersReturn {
  filters: Ref<Record<string, unknown>>;
  searchQuery: Ref<string>;
  activeFilterCount: ComputedRef<number>;
  filterDefs: FilterDef[];
  setFilter: (id: string, value: unknown) => void;
  removeFilter: (id: string) => void;
  setSearchQuery: (query: string) => void;
  resetFilters: () => void;
  clearFilters: () => void;
}

export function useTableFilters(options: UseTableFiltersOptions = {}): UseTableFiltersReturn {
  const { initialFilters = {}, initialSearch = '', filterDefs = [] } = options;

  const filters = ref<Record<string, unknown>>({ ...initialFilters });
  const searchQuery = ref<string>(initialSearch);

  const activeFilterCount = computed(() => {
    let count = 0;
    if (searchQuery.value && searchQuery.value.trim().length > 0) {
      count += 1;
    }
    for (const val of Object.values(filters.value)) {
      if (val !== undefined && val !== null && val !== '') {
        if (Array.isArray(val) && val.length === 0) {
          continue;
        }
        count += 1;
      }
    }
    return count;
  });

  const setFilter = (id: string, value: unknown) => {
    filters.value = {
      ...filters.value,
      [id]: value,
    };
  };

  const removeFilter = (id: string) => {
    const next = { ...filters.value };
    delete next[id];
    filters.value = next;
  };

  const setSearchQuery = (query: string) => {
    searchQuery.value = query;
  };

  const resetFilters = () => {
    searchQuery.value = initialSearch;
    filters.value = { ...initialFilters };
  };

  const clearFilters = () => {
    searchQuery.value = '';
    filters.value = {};
  };

  return {
    filters,
    searchQuery,
    activeFilterCount,
    filterDefs,
    setFilter,
    removeFilter,
    setSearchQuery,
    resetFilters,
    clearFilters,
  };
}
