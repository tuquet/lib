import type { ColumnDef } from '@tanstack/vue-table';
import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { createExportApi, createFilterApi, createPaginationApi } from '../src/api/index.js';
import { useRemoteTable } from '../src/composables/useRemoteTable.js';
import type { DynamicFilterRule } from '../src/types/filter.js';

interface TestUser {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'inactive';
  age: number;
}

const columns: ColumnDef<TestUser, any>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'role', header: 'Role' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'age', header: 'Age' },
];

const mockUsers: TestUser[] = [
  { id: '1', name: 'Alice', role: 'Admin', status: 'active', age: 30 },
  { id: '2', name: 'Bob', role: 'User', status: 'inactive', age: 25 },
  { id: '3', name: 'Charlie', role: 'Manager', status: 'active', age: 35 },
];

describe('Enterprise Table API Facade System', () => {
  describe('ColumnApi', () => {
    it('controls column visibility, pinning, and sizing', () => {
      const remote = useRemoteTable<TestUser>({
        columns,
        fetcher: async () => ({ data: mockUsers, total: mockUsers.length }),
      });

      const columnApi = remote.api.column;

      expect(columnApi.getColumns().length).toBe(5);
      expect(columnApi.getColumn('name')).toBeDefined();

      // Visibility
      columnApi.setVisible('role', false);
      expect(columnApi.getColumn('role')?.getIsVisible()).toBe(false);

      columnApi.toggleVisibility('role');
      expect(columnApi.getColumn('role')?.getIsVisible()).toBe(true);

      columnApi.hideAll();
      expect(columnApi.getVisibleColumns().length).toBe(0);

      columnApi.showAll();
      expect(columnApi.getVisibleColumns().length).toBe(5);

      // Pinning
      columnApi.pin('id', 'left');
      expect(columnApi.getColumn('id')?.getIsPinned()).toBe('left');

      columnApi.pin('id', false);
      expect(columnApi.getColumn('id')?.getIsPinned()).toBe(false);

      // Ergonomic helpers: unpin, isPinned, isVisible
      columnApi.pin('id', 'left');
      expect(columnApi.isPinned('id')).toBe('left');
      columnApi.unpin('id');
      expect(columnApi.isPinned('id')).toBe(false);
      expect(columnApi.isVisible('name')).toBe(true);

      // Sizing
      columnApi.setSize('name', 250);
      expect(columnApi.getColumn('name')?.getSize()).toBe(250);

      columnApi.resetSize('name');
      expect(columnApi.getColumn('name')?.getSize()).not.toBe(250);
    });
  });

  describe('FilterApi', () => {
    it('manages search query, faceted filters, and dynamic rules', () => {
      const searchQuery = ref('');
      const filters = ref<Record<string, unknown>>({});
      const activeFilterCount = ref(0);
      const dynamicRules = ref<DynamicFilterRule[]>([]);
      const dynamicConjunction = ref<'and' | 'or'>('and');

      const setFilter = vi.fn((id, val) => {
        filters.value[id] = val;
        activeFilterCount.value = Object.keys(filters.value).filter((k) => filters.value[k]).length;
      });
      const resetFilters = vi.fn(() => {
        filters.value = {};
        activeFilterCount.value = 0;
      });

      const filterApi = createFilterApi({
        searchQuery,
        filters,
        setFilter,
        resetFilters,
        activeFilterCount,
        dynamicRules,
        dynamicConjunction,
      });

      // Search
      filterApi.setSearch('Alice');
      expect(filterApi.getSearch()).toBe('Alice');
      filterApi.clearSearch();
      expect(filterApi.getSearch()).toBe('');

      // Column filters
      filterApi.setFilter('status', 'active');
      expect(setFilter).toHaveBeenCalledWith('status', 'active');
      expect(filterApi.getFilter('status')).toBe('active');

      filterApi.resetFilters();
      expect(resetFilters).toHaveBeenCalled();

      // Dynamic rules
      filterApi.addRule({ field: 'age', operator: 'gt', value: 20 });
      expect(filterApi.getRules().length).toBe(1);
      const ruleId = filterApi.getRules()[0]!.id;
      expect(filterApi.getActiveCount()).toBe(1);

      filterApi.removeRule(ruleId);
      expect(filterApi.getRules().length).toBe(0);

      // Presets
      filterApi.applyPreset({
        id: 'p1',
        name: 'Active Users',
        conjunction: 'and',
        rules: [{ id: 'r1', field: 'status', operator: 'eq', value: 'active' }],
      });
      expect(filterApi.getRules().length).toBe(1);
      expect(dynamicConjunction.value).toBe('and');

      filterApi.clearRules();
      expect(filterApi.getRules().length).toBe(0);
    });
  });

  describe('SelectionApi', () => {
    it('handles row selection, counting, and data retrieval', () => {
      const remote = useRemoteTable<TestUser>({
        columns,
        fetcher: async () => ({ data: mockUsers, total: mockUsers.length }),
      });

      // Manually set data to test row selection
      remote.setData(mockUsers);

      const selectionApi = remote.api.selection;
      expect(selectionApi.getCount()).toBe(0);
      expect(selectionApi.getSelectedCount()).toBe(0);
      expect(selectionApi.isAllSelected()).toBe(false);

      selectionApi.selectAll();
      expect(selectionApi.isAllSelected()).toBe(true);
      expect(selectionApi.getCount()).toBe(mockUsers.length);
      expect(selectionApi.getSelectedCount()).toBe(mockUsers.length);
      expect(selectionApi.getSelectedRowIds().length).toBe(mockUsers.length);

      selectionApi.clearSelection();
      expect(selectionApi.getCount()).toBe(0);
      expect(selectionApi.getSelectedCount()).toBe(0);

      selectionApi.toggleRowSelected('0');
      expect(selectionApi.getCount()).toBe(1);
      expect(selectionApi.getSelectedCount()).toBe(1);
    });
  });

  describe('PaginationApi', () => {
    it('manages page index, page size, navigation bounds', () => {
      const pageIndex = ref(0);
      const pageSize = ref(10);
      const total = ref(100);
      const pageCount = ref(10); // 100 / 10

      const setPageIndex = vi.fn((idx) => {
        pageIndex.value = idx;
      });
      const setPageSize = vi.fn((size) => {
        pageSize.value = size;
      });

      const paginationApi = createPaginationApi({
        pageIndex,
        pageSize,
        total,
        pageCount: pageCount as any,
        setPageIndex,
        setPageSize,
      });

      expect(paginationApi.getPage()).toBe(0);
      expect(paginationApi.getPageSize()).toBe(10);
      expect(paginationApi.getTotal()).toBe(100);
      expect(paginationApi.getTotalPages()).toBe(10);
      expect(paginationApi.canPrevious()).toBe(false);
      expect(paginationApi.canPreviousPage()).toBe(false);
      expect(paginationApi.canNext()).toBe(true);
      expect(paginationApi.canNextPage()).toBe(true);

      paginationApi.nextPage();
      expect(setPageIndex).toHaveBeenCalledWith(1);

      paginationApi.lastPage();
      expect(setPageIndex).toHaveBeenCalledWith(9);

      paginationApi.firstPage();
      expect(setPageIndex).toHaveBeenCalledWith(0);

      pageIndex.value = 9;
      expect(paginationApi.canNext()).toBe(false);
      expect(paginationApi.canNextPage()).toBe(false);

      paginationApi.goToPage(5);
      expect(setPageIndex).toHaveBeenCalledWith(5);

      paginationApi.setPageSize(25);
      expect(setPageSize).toHaveBeenCalledWith(25);
    });
  });

  describe('ExportApi', () => {
    it('triggers export helpers with correct arguments', async () => {
      const exportApi = createExportApi({
        getData: () => mockUsers,
        getColumns: () => columns,
      });

      expect(typeof exportApi.toCsv).toBe('function');
      expect(typeof exportApi.toExcel).toBe('function');
      expect(typeof exportApi.toClipboardTsv).toBe('function');
    });
  });

  describe('TableApi Integration via useRemoteTable', () => {
    it('provides cohesive master TableApi instance with all sub-facades', async () => {
      const remote = useRemoteTable<TestUser>({
        columns,
        fetcher: async () => ({ data: mockUsers, total: mockUsers.length }),
      });

      expect(remote.api).toBeDefined();
      expect(remote.api.column).toBeDefined();
      expect(remote.api.filter).toBeDefined();
      expect(remote.api.selection).toBeDefined();
      expect(remote.api.pagination).toBeDefined();
      expect(remote.api.export).toBeDefined();
      expect(remote.api.expansion).toBeDefined();
      expect(remote.api.views).toBeDefined();
      expect(typeof remote.api.refresh).toBe('function');
      expect(typeof remote.api.refetch).toBe('function');
      expect(typeof remote.api.mutateRow).toBe('function');
      expect(typeof remote.api.deleteRow).toBe('function');
      expect(typeof remote.api.notifyCellEdit).toBe('function');
      expect(typeof remote.api.getRawTable).toBe('function');

      // Test expansion ergonomic helpers
      expect(remote.api.expansion?.getExpandedCount()).toBe(0);
      remote.api.expansion?.toggleRow('0');
      expect(remote.api.expansion?.isExpanded('0')).toBe(true);
      expect(remote.api.expansion?.getExpandedCount()).toBe(1);

      // Test views ergonomic helpers
      expect(remote.api.views?.hasActiveView()).toBe(false);

      // Test mutateRow via api
      remote.setData(mockUsers);
      remote.api.mutateRow('1', { name: 'Alice Updated' });
      expect(remote.data.value.find((u) => u.id === '1')?.name).toBe('Alice Updated');

      // Test deleteRow via api
      remote.api.deleteRow('2');
      expect(remote.data.value.find((u) => u.id === '2')).toBeUndefined();
    });
  });
});
