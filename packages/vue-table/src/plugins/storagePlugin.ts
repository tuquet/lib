import { watch, type WatchStopHandle } from 'vue';
import type { TablePlugin, TablePluginContext } from './types.js';

export interface StoragePersistedState {
  columnVisibility?: Record<string, boolean>;
  columnPinning?: { left?: string[]; right?: string[] };
  sorting?: { id: string; desc: boolean }[];
  pageSize?: number;
}

export interface StoragePluginOptions {
  key: string;
  storage?: Storage;
  persist?: {
    visibility?: boolean;
    pinning?: boolean;
    sorting?: boolean;
    pageSize?: boolean;
  };
}

export function createStoragePlugin<TData = any>(
  options: StoragePluginOptions
): TablePlugin<TData> {
  const {
    key,
    storage = typeof window !== 'undefined' ? window.localStorage : undefined,
    persist = { visibility: true, pinning: true, sorting: true, pageSize: true },
  } = options;

  let unwatch: WatchStopHandle | null = null;

  return {
    name: 'local-storage-state',
    order: 20,
    setup: (context: TablePluginContext<TData>) => {
      if (!storage) return;

      // 1. Restore state
      try {
        const raw = storage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw) as StoragePersistedState;
          if (persist.visibility && parsed.columnVisibility) {
            context.columnVisibility.value = parsed.columnVisibility;
          }
          if (persist.pinning && parsed.columnPinning) {
            context.columnPinning.value = parsed.columnPinning;
          }
          if (persist.sorting && parsed.sorting) {
            context.sorting.value = parsed.sorting;
          }
          if (persist.pageSize && parsed.pageSize) {
            context.pagination.value.pageSize = parsed.pageSize;
          }
        }
      } catch (err) {
        console.warn(`[TableStoragePlugin] Failed to restore table state for key: ${key}`, err);
      }

      // 2. Watch and persist changes
      unwatch = watch(
        [
          context.columnVisibility,
          context.columnPinning,
          context.sorting,
          () => context.pagination.value.pageSize,
        ],
        ([colVis, colPin, sort, pSize]) => {
          try {
            const stateToSave: StoragePersistedState = {};
            if (persist.visibility) stateToSave.columnVisibility = colVis;
            if (persist.pinning) stateToSave.columnPinning = colPin;
            if (persist.sorting) stateToSave.sorting = sort;
            if (persist.pageSize) stateToSave.pageSize = pSize;
            storage.setItem(key, JSON.stringify(stateToSave));
          } catch (err) {
            console.warn(`[TableStoragePlugin] Failed to persist table state for key: ${key}`, err);
          }
        },
        { deep: true }
      );
    },
    onDestroy: () => {
      if (unwatch) {
        unwatch();
        unwatch = null;
      }
    },
  };
}
