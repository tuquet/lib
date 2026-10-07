import { computed, ref, type ComputedRef, type Ref } from 'vue';
import type { PaginationState } from '../types/index.js';

export interface UseTablePaginationOptions {
  initialPageIndex?: number;
  initialPageSize?: number;
  initialTotal?: number;
}

export interface UseTablePaginationReturn {
  pagination: Ref<PaginationState>;
  pageIndex: ComputedRef<number>;
  pageSize: ComputedRef<number>;
  total: Ref<number>;
  pageCount: ComputedRef<number>;
  setPageIndex: (index: number) => void;
  setPageSize: (size: number) => void;
  setTotal: (total: number) => void;
  resetPagination: () => void;
}

export function useTablePagination(
  options: UseTablePaginationOptions = {}
): UseTablePaginationReturn {
  const { initialPageIndex = 0, initialPageSize = 10, initialTotal = 0 } = options;

  const pagination = ref<PaginationState>({
    pageIndex: initialPageIndex,
    pageSize: initialPageSize,
  });

  const total = ref(initialTotal);

  const pageIndex = computed(() => pagination.value.pageIndex);
  const pageSize = computed(() => pagination.value.pageSize);

  const pageCount = computed(() => {
    return Math.max(1, Math.ceil(total.value / pagination.value.pageSize));
  });

  const setPageIndex = (index: number) => {
    pagination.value = {
      ...pagination.value,
      pageIndex: Math.max(0, index),
    };
  };

  const setPageSize = (size: number) => {
    pagination.value = {
      ...pagination.value,
      pageSize: Math.max(1, size),
    };
  };

  const setTotal = (newTotal: number) => {
    total.value = Math.max(0, newTotal);
  };

  const resetPagination = () => {
    pagination.value = {
      pageIndex: 0,
      pageSize: initialPageSize,
    };
  };

  return {
    pagination,
    pageIndex,
    pageSize,
    total,
    pageCount,
    setPageIndex,
    setPageSize,
    setTotal,
    resetPagination,
  };
}
