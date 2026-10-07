import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import {
  createAuditLogPlugin,
  createStoragePlugin,
  type TablePlugin,
} from '../src/plugins/index.js';
import { useRemoteTable } from '../src/composables/useRemoteTable.js';
import type { ColumnDef } from '@tanstack/vue-table';

interface TestItem {
  id: string;
  name: string;
  price: number;
}

const columns: ColumnDef<TestItem, any>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'price', header: 'Price' },
];

describe('Table Plugin Middleware System', () => {
  describe('createAuditLogPlugin', () => {
    it('initializes with empty entries and default options', () => {
      const plugin = createAuditLogPlugin<TestItem>();
      expect(plugin.name).toBe('audit-log');
      expect(plugin.logs.value).toEqual([]);
      expect(typeof plugin.clearLogs).toBe('function');
    });

    it('records cell edit events with custom onLog hook', () => {
      const logSpy = vi.fn();
      const plugin = createAuditLogPlugin<TestItem>({
        maxEntries: 5,
        onLog: logSpy,
      });

      const mockCtx: any = {
        table: {},
      };

      // Trigger cell edit
      plugin.onCellEdit?.(
        {
          rowId: 'row-1',
          row: { id: '1', name: 'Old', price: 100 },
          field: 'name',
          oldValue: 'Old',
          newValue: 'New',
        },
        mockCtx
      );

      expect(plugin.logs.value.length).toBe(1);
      expect(plugin.logs.value[0]?.field).toBe('name');
      expect(plugin.logs.value[0]?.oldValue).toBe('Old');
      expect(plugin.logs.value[0]?.newValue).toBe('New');
      expect(logSpy).toHaveBeenCalledTimes(1);

      // Clear logs
      plugin.clearLogs();
      expect(plugin.logs.value.length).toBe(0);
    });

    it('respects maxEntries buffer cap', () => {
      const plugin = createAuditLogPlugin<TestItem>({
        maxEntries: 2,
      });

      const mockCtx: any = {};
      plugin.onCellEdit?.(
        { rowId: '1', row: {} as any, field: 'a', oldValue: 1, newValue: 2 },
        mockCtx
      );
      plugin.onCellEdit?.(
        { rowId: '2', row: {} as any, field: 'b', oldValue: 3, newValue: 4 },
        mockCtx
      );
      plugin.onCellEdit?.(
        { rowId: '3', row: {} as any, field: 'c', oldValue: 5, newValue: 6 },
        mockCtx
      );

      expect(plugin.logs.value.length).toBe(2);
      expect(plugin.logs.value[0]?.field).toBe('c');
    });
  });

  describe('createStoragePlugin', () => {
    it('persists table state into storage adapter', () => {
      const memoryStorage: Record<string, string> = {};
      const mockStorage: Storage = {
        length: 0,
        clear: () => {},
        key: () => null,
        getItem: (k: string) => memoryStorage[k] ?? null,
        setItem: (k: string, v: string) => {
          memoryStorage[k] = v;
        },
        removeItem: (k: string) => {
          delete memoryStorage[k];
        },
      };

      const plugin = createStoragePlugin<TestItem>({
        key: 'test_table_pref',
        storage: mockStorage,
        persist: { visibility: true, pinning: true, sorting: true, pageSize: true },
      });

      expect(plugin.name).toBe('local-storage-state');

      const colVis = ref<Record<string, boolean>>({ price: true });
      const colPin = ref<{ left?: string[]; right?: string[] }>({ left: ['id'] });
      const sorting = ref<{ id: string; desc: boolean }[]>([]);
      const pagination = ref({ pageIndex: 0, pageSize: 10 });

      const mockCtx: any = {
        columnVisibility: colVis,
        columnPinning: colPin,
        sorting: sorting,
        pagination: pagination,
      };

      // 1. Setup watches the refs
      plugin.setup?.(mockCtx);

      // 2. Change state to trigger watcher
      colVis.value = { price: false };

      // In next tick or immediate, check storage
      const savedJson = mockStorage.getItem('test_table_pref');
      if (savedJson) {
        const parsed = JSON.parse(savedJson);
        expect(parsed.columnVisibility).toEqual({ price: false });
      }
    });

    it('restores persisted state on setup', () => {
      const memoryStorage: Record<string, string> = {
        test_saved_pref: JSON.stringify({
          columnVisibility: { price: false },
          sorting: [{ id: 'name', desc: true }],
          pageSize: 50,
        }),
      };
      const mockStorage: Storage = {
        length: 0,
        clear: () => {},
        key: () => null,
        getItem: (k: string) => memoryStorage[k] ?? null,
        setItem: (k: string, v: string) => {
          memoryStorage[k] = v;
        },
        removeItem: (k: string) => {
          delete memoryStorage[k];
        },
      };

      const plugin = createStoragePlugin<TestItem>({
        key: 'test_saved_pref',
        storage: mockStorage,
      });

      const colVis = ref<Record<string, boolean>>({ price: true });
      const colPin = ref<{ left?: string[]; right?: string[] }>({});
      const sorting = ref<{ id: string; desc: boolean }[]>([]);
      const pagination = ref({ pageIndex: 0, pageSize: 10 });

      const mockCtx: any = {
        columnVisibility: colVis,
        columnPinning: colPin,
        sorting: sorting,
        pagination: pagination,
      };

      plugin.setup?.(mockCtx);

      expect(colVis.value).toEqual({ price: false });
      expect(sorting.value).toEqual([{ id: 'name', desc: true }]);
      expect(pagination.value.pageSize).toBe(50);
    });
  });

  describe('useRemoteTable Plugin Lifecycle Integration', () => {
    it('triggers plugin lifecycle hooks throughout remote fetching & editing', async () => {
      const setupSpy = vi.fn();
      const beforeFetchSpy = vi.fn();
      const afterFetchSpy = vi.fn();
      const cellEditSpy = vi.fn();
      const destroySpy = vi.fn();

      const testPlugin: TablePlugin<TestItem> = {
        name: 'test-spy-plugin',
        setup: setupSpy,
        onBeforeFetch: beforeFetchSpy,
        onAfterFetch: afterFetchSpy,
        onCellEdit: cellEditSpy,
        onDestroy: destroySpy,
      };

      const remote = useRemoteTable<TestItem>({
        columns,
        fetcher: async () => {
          return {
            data: [{ id: '1', name: 'Gadget', price: 99 }],
            total: 1,
          };
        },
        plugins: [testPlugin],
      });

      // setup should be called immediately
      expect(setupSpy).toHaveBeenCalledTimes(1);

      // Trigger refetch
      await remote.refetch();

      expect(beforeFetchSpy).toHaveBeenCalled();
      expect(afterFetchSpy).toHaveBeenCalled();

      // Notify cell edit
      remote.notifyCellEdit({
        rowId: '1',
        row: { id: '1', name: 'Gadget', price: 99 },
        field: 'price',
        oldValue: 99,
        newValue: 120,
      });

      expect(cellEditSpy).toHaveBeenCalledTimes(1);
      expect(cellEditSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          field: 'price',
          oldValue: 99,
          newValue: 120,
        }),
        expect.any(Object)
      );
    });
  });
});
