import type { ComputedRef, Ref } from 'vue';
import type { PaginationApi } from './types.js';

export interface CreatePaginationApiOptions {
  pageIndex: Ref<number> | ComputedRef<number>;
  pageSize: Ref<number> | ComputedRef<number>;
  total: Ref<number> | ComputedRef<number>;
  pageCount: ComputedRef<number>;
  setPageIndex: (index: number) => void;
  setPageSize: (size: number) => void;
}

export function createPaginationApi(options: CreatePaginationApiOptions): PaginationApi {
  const { pageIndex, pageSize, total, pageCount, setPageIndex, setPageSize } = options;

  return {
    goToPage(index: number): void {
      const max = Math.max(0, pageCount.value - 1);
      const clamped = Math.max(0, Math.min(index, max));
      setPageIndex(clamped);
    },

    nextPage(): void {
      if (this.canNext()) {
        setPageIndex(pageIndex.value + 1);
      }
    },

    previousPage(): void {
      if (this.canPrevious()) {
        setPageIndex(pageIndex.value - 1);
      }
    },

    firstPage(): void {
      this.goToPage(0);
    },

    lastPage(): void {
      this.goToPage(Math.max(0, pageCount.value - 1));
    },

    setPageSize(size: number): void {
      if (size > 0) {
        setPageSize(size);
      }
    },

    getPage(): number {
      return pageIndex.value;
    },

    getPageSize(): number {
      return pageSize.value;
    },

    getTotal(): number {
      return total.value;
    },

    getTotalPages(): number {
      return pageCount.value;
    },

    canNext(): boolean {
      return pageIndex.value < pageCount.value - 1;
    },

    canNextPage(): boolean {
      return this.canNext();
    },

    canPrevious(): boolean {
      return pageIndex.value > 0;
    },

    canPreviousPage(): boolean {
      return this.canPrevious();
    },
  };
}
