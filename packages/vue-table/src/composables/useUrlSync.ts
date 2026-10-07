import { getCurrentInstance, getCurrentScope, onMounted, onScopeDispose, onUnmounted } from 'vue';
import type { QueryAdapter, TableState } from '../types/index.js';

export interface UrlSyncOptions {
  adapter: QueryAdapter;
  enabled?: boolean;
  onUrlChange?: (state: Partial<TableState>) => void;
}

export function parseUrlQuery(): Record<string, unknown> {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const result: Record<string, unknown> = {};
  for (const [key, value] of params.entries()) {
    result[key] = value;
  }
  return result;
}

export function syncStateToUrl(state: TableState, adapter: QueryAdapter): void {
  if (typeof window === 'undefined') return;

  const queryObj = adapter.serialize(state);
  const searchParams = new URLSearchParams();

  for (const [k, v] of Object.entries(queryObj)) {
    if (v !== undefined && v !== null && v !== '') {
      searchParams.set(k, String(v));
    }
  }

  const newQuery = searchParams.toString();
  const newRelativePath = `${window.location.pathname}${newQuery ? `?${newQuery}` : ''}${window.location.hash}`;
  const currentRelativePath = `${window.location.pathname}${window.location.search}${window.location.hash}`;

  if (newRelativePath !== currentRelativePath) {
    window.history.replaceState(window.history.state, '', newRelativePath);
  }
}

export interface UseUrlSyncReturn {
  getInitialState: () => Partial<TableState>;
  updateUrl: (state: TableState) => void;
}

export function useUrlSync(options: UrlSyncOptions): UseUrlSyncReturn {
  const { adapter, enabled = true, onUrlChange } = options;

  if (!enabled || typeof window === 'undefined') {
    return {
      getInitialState: (): Partial<TableState> => ({}),
      updateUrl: () => {},
    };
  }

  const getInitialState = (): Partial<TableState> => {
    const rawQuery = parseUrlQuery();
    return adapter.deserialize(rawQuery);
  };

  const updateUrl = (state: TableState) => {
    syncStateToUrl(state, adapter);
  };

  const handlePopState = () => {
    if (onUrlChange) {
      const state = getInitialState();
      onUrlChange(state);
    }
  };

  if (getCurrentInstance()) {
    onMounted(() => {
      window.addEventListener('popstate', handlePopState);
    });

    onUnmounted(() => {
      window.removeEventListener('popstate', handlePopState);
    });
  } else if (getCurrentScope()) {
    window.addEventListener('popstate', handlePopState);
    onScopeDispose(() => {
      window.removeEventListener('popstate', handlePopState);
    });
  }

  return {
    getInitialState,
    updateUrl,
  };
}
