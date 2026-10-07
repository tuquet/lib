import { describe, expect, it } from 'vitest';
import { ref } from 'vue';
import {
  useTableFilters,
  useTableMutations,
  useTablePagination,
  useTableSelection,
  useTableSorting,
} from '../src/composables/index.js';

describe('Layer 0: SOLID Core Composables', () => {
  describe('useTablePagination', () => {
    it('initializes with sensible defaults', () => {
      const { pagination, pageIndex, pageSize, total, pageCount } = useTablePagination();

      expect(pagination.value.pageIndex).toBe(0);
      expect(pagination.value.pageSize).toBe(10);
      expect(pageIndex.value).toBe(0);
      expect(pageSize.value).toBe(10);
      expect(total.value).toBe(0);
      expect(pageCount.value).toBe(1);
    });

    it('handles custom initial values and computes pageCount correctly', () => {
      const { pageCount, setTotal, setPageSize, setPageIndex, pageIndex, pageSize } =
        useTablePagination({
          initialPageIndex: 2,
          initialPageSize: 20,
          initialTotal: 95,
        });

      expect(pageIndex.value).toBe(2);
      expect(pageSize.value).toBe(20);
      expect(pageCount.value).toBe(5); // 95 / 20 = 4.75 -> 5

      setTotal(100);
      expect(pageCount.value).toBe(5);

      setPageSize(50);
      expect(pageSize.value).toBe(50);
      expect(pageCount.value).toBe(2);

      setPageIndex(1);
      expect(pageIndex.value).toBe(1);
    });

    it('resets pagination state', () => {
      const { setPageIndex, setPageSize, resetPagination, pageIndex, pageSize } =
        useTablePagination({
          initialPageIndex: 4,
          initialPageSize: 25,
        });

      setPageIndex(8);
      setPageSize(50);
      resetPagination();

      expect(pageIndex.value).toBe(0);
      expect(pageSize.value).toBe(25);
    });
  });

  describe('useTableSorting', () => {
    it('initializes empty or with given initial sorting', () => {
      const { sorting } = useTableSorting();
      expect(sorting.value).toEqual([]);

      const custom = useTableSorting({
        initialSorting: [{ id: 'createdAt', desc: true }],
      });
      expect(custom.sorting.value).toEqual([{ id: 'createdAt', desc: true }]);
    });

    it('cycles sort state: asc -> desc -> clear for single column', () => {
      const { sorting, toggleSorting } = useTableSorting();

      toggleSorting('name');
      expect(sorting.value).toEqual([{ id: 'name', desc: false }]);

      toggleSorting('name');
      expect(sorting.value).toEqual([{ id: 'name', desc: true }]);

      toggleSorting('name');
      expect(sorting.value).toEqual([]);
    });

    it('supports multi-sort when requested', () => {
      const { sorting, toggleSorting } = useTableSorting();

      toggleSorting('status');
      expect(sorting.value).toEqual([{ id: 'status', desc: false }]);

      toggleSorting('createdAt', true);
      expect(sorting.value).toEqual([
        { id: 'status', desc: false },
        { id: 'createdAt', desc: false },
      ]);

      toggleSorting('status', true);
      expect(sorting.value).toEqual([
        { id: 'status', desc: true },
        { id: 'createdAt', desc: false },
      ]);
    });

    it('clears all sorting', () => {
      const { sorting, toggleSorting, clearSorting } = useTableSorting();
      toggleSorting('name');
      clearSorting();
      expect(sorting.value).toEqual([]);
    });
  });

  describe('useTableFilters', () => {
    it('manages filters and computes activeFilterCount accurately', () => {
      const {
        filters,
        searchQuery,
        activeFilterCount,
        setFilter,
        removeFilter,
        setSearchQuery,
        resetFilters,
      } = useTableFilters();

      expect(activeFilterCount.value).toBe(0);

      setSearchQuery('john');
      expect(searchQuery.value).toBe('john');
      expect(activeFilterCount.value).toBe(1);

      setFilter('status', ['active', 'pending']);
      expect(activeFilterCount.value).toBe(2);

      // Empty array should not count towards activeFilterCount
      setFilter('tags', []);
      expect(activeFilterCount.value).toBe(2);

      // Empty string should not count
      setFilter('role', '');
      expect(activeFilterCount.value).toBe(2);

      // Test removeFilter
      setFilter('status', 'active');
      expect(filters.value.status).toBe('active');
      removeFilter('status');
      expect(filters.value.status).toBeUndefined();

      // Test clearFilters vs resetFilters
      const withInit = useTableFilters({
        initialFilters: { type: 'admin' },
        initialSearch: 'alice',
      });
      expect(withInit.filters.value).toEqual({ type: 'admin' });
      withInit.setFilter('type', 'user');
      withInit.setSearchQuery('bob');
      withInit.resetFilters();
      expect(withInit.filters.value).toEqual({ type: 'admin' });
      expect(withInit.searchQuery.value).toBe('alice');
      withInit.clearFilters();
      expect(withInit.filters.value).toEqual({});
      expect(withInit.searchQuery.value).toBe('');

      resetFilters();
      expect(searchQuery.value).toBe('');
      expect(filters.value).toEqual({});
      expect(activeFilterCount.value).toBe(0);
    });
  });

  describe('useTableSelection', () => {
    it('manages row selection state and computed shortcuts', () => {
      const { rowSelection, selectedRowIds, selectedCount, toggleRow, clearSelection } =
        useTableSelection();

      expect(selectedCount.value).toBe(0);
      expect(selectedRowIds.value).toEqual([]);

      toggleRow('row-1', true);
      expect(selectedCount.value).toBe(1);
      expect(selectedRowIds.value).toEqual(['row-1']);
      expect(rowSelection.value['row-1']).toBe(true);

      toggleRow('row-2', true);
      expect(selectedCount.value).toBe(2);
      expect(selectedRowIds.value).toEqual(['row-1', 'row-2']);

      toggleRow('row-1', false);
      expect(selectedCount.value).toBe(1);
      expect(selectedRowIds.value).toEqual(['row-2']);

      clearSelection();
      expect(selectedCount.value).toBe(0);
      expect(selectedRowIds.value).toEqual([]);
    });
  });

  describe('useTableMutations', () => {
    interface Item {
      id: string;
      title: string;
      count: number;
    }

    it('mutates, deletes, prepends and appends rows cleanly', () => {
      const data = ref<Item[]>([
        { id: '1', title: 'Task 1', count: 10 },
        { id: '2', title: 'Task 2', count: 20 },
      ]);
      const total = ref(2);

      const { mutateRow, deleteRow, prependRow, appendRow, setData } = useTableMutations({
        data,
        total,
      });

      // Mutate
      mutateRow('1', { count: 15 });
      expect(data.value[0]?.count).toBe(15);

      // Prepend
      prependRow({ id: '0', title: 'Task 0', count: 5 });
      expect(data.value.length).toBe(3);
      expect(data.value[0]?.id).toBe('0');
      expect(total.value).toBe(3);

      // Append
      appendRow({ id: '3', title: 'Task 3', count: 30 });
      expect(data.value.length).toBe(4);
      expect(data.value[3]?.id).toBe('3');
      expect(total.value).toBe(4);

      // Delete single
      deleteRow('2');
      expect(data.value.find((i) => i.id === '2')).toBeUndefined();
      expect(total.value).toBe(3);

      // Delete multiple
      deleteRow(['0', '3']);
      expect(data.value.length).toBe(1);
      expect(total.value).toBe(1);

      // Set data
      setData([{ id: '99', title: 'Reset', count: 99 }], 1);
      expect(data.value.length).toBe(1);
      expect(data.value[0]?.id).toBe('99');
    });

    it('supports custom getRowId function', () => {
      interface CustomItem {
        code: string;
        desc: string;
      }
      const data = ref<CustomItem[]>([
        { code: 'A1', desc: 'First' },
        { code: 'B2', desc: 'Second' },
      ]);
      const total = ref(2);

      const { mutateRow, deleteRow } = useTableMutations({
        data,
        total,
        getRowId: (row) => row.code,
      });

      mutateRow('A1', { desc: 'Updated First' });
      expect(data.value[0]?.desc).toBe('Updated First');

      deleteRow('B2');
      expect(data.value.length).toBe(1);
      expect(data.value[0]?.code).toBe('A1');
      expect(total.value).toBe(1);
    });
  });
});
