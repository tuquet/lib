/**
 * Safe Recursive Proxy Mock for Browser Extension APIs
 * Provides crash-proof fallbacks for browser.* and chrome.* in Web, Studio, Node, and Webview environments.
 */

export interface MockStorageData {
  [key: string]: unknown;
}

export type StorageChangeListener = (
  changes: Record<string, { oldValue?: unknown; newValue?: unknown }>,
  areaName: string
) => void;

export class InMemoryStorageArea {
  private data: MockStorageData = {};
  private listeners = new Set<StorageChangeListener>();

  constructor(initialData?: MockStorageData) {
    if (initialData) {
      this.data = { ...initialData };
    }
  }

  async get(
    keys?: string | string[] | Record<string, unknown> | null
  ): Promise<Record<string, unknown>> {
    const res: Record<string, unknown> = {};

    if (keys === null || keys === undefined) {
      return { ...this.data };
    }

    if (typeof keys === 'string') {
      res[keys] = this.data[keys] ?? null;
      return res;
    }

    if (Array.isArray(keys)) {
      for (const k of keys) {
        res[k] = this.data[k] ?? null;
      }
      return res;
    }

    if (typeof keys === 'object') {
      for (const [k, defaultVal] of Object.entries(keys)) {
        res[k] = this.data[k] ?? defaultVal;
      }
      return res;
    }

    return res;
  }

  async set(items: Record<string, unknown>): Promise<void> {
    const changes: Record<string, { oldValue?: unknown; newValue?: unknown }> = {};

    for (const [k, val] of Object.entries(items)) {
      const oldValue = this.data[k];
      this.data[k] = val;
      changes[k] = { oldValue, newValue: val };
    }

    for (const listener of this.listeners) {
      try {
        listener(changes, 'local');
      } catch (err) {
        console.error('[MockStorage] Error in storage listener:', err);
      }
    }
  }

  async remove(keys: string | string[]): Promise<void> {
    const keyList = Array.isArray(keys) ? keys : [keys];
    const changes: Record<string, { oldValue?: unknown; newValue?: unknown }> = {};

    for (const k of keyList) {
      const oldValue = this.data[k];
      delete this.data[k];
      changes[k] = { oldValue, newValue: undefined };
    }

    for (const listener of this.listeners) {
      try {
        listener(changes, 'local');
      } catch (err) {
        console.error('[MockStorage] Error in storage listener:', err);
      }
    }
  }

  async clear(): Promise<void> {
    this.data = {};
  }

  get onChanged() {
    return {
      addListener: (fn: StorageChangeListener) => this.listeners.add(fn),
      removeListener: (fn: StorageChangeListener) => this.listeners.delete(fn),
      hasListener: (fn: StorageChangeListener) => this.listeners.has(fn),
    };
  }
}

/**
 * Creates an event listener stub object
 */
export function createEventStub<T extends (...args: unknown[]) => void>() {
  const listeners = new Set<T>();
  return {
    addListener: (fn: T) => listeners.add(fn),
    removeListener: (fn: T) => listeners.delete(fn),
    hasListener: (fn: T) => listeners.has(fn),
    _emit: (...args: unknown[]) => {
      listeners.forEach((fn) => {
        try {
          (fn as (...a: unknown[]) => void)(...args);
        } catch (e) {
          console.error('[MockEvent] Listener error:', e);
        }
      });
    },
  };
}

/**
 * Creates a recursive fallback proxy that never crashes when accessing nested properties
 */
export function createSafeProxy(target: Record<string, unknown> = {}, path = ''): any {
  return new Proxy(target, {
    get(obj, prop: string | symbol) {
      if (typeof prop === 'symbol') {
        return (obj as any)[prop];
      }

      if (prop === 'then') {
        // Not a thenable unless explicitly set
        return undefined;
      }

      if (prop in obj) {
        return (obj as any)[prop];
      }

      const nextPath = path ? `${path}.${prop}` : prop;

      // Provide common utility methods
      if (prop === 'addListener' || prop === 'removeListener' || prop === 'hasListener') {
        return () => {};
      }

      // Default recursive mock function/object
      const mockFn = (..._args: unknown[]) => {
        return Promise.resolve({});
      };

      return createSafeProxy(mockFn as unknown as Record<string, unknown>, nextPath);
    },
    apply(_fn, _thisArg, _args) {
      return Promise.resolve({});
    },
  });
}

/**
 * Factory for complete mock browser instance
 */
export function createBrowserMock(initialStorage?: MockStorageData): any {
  const localStorageArea = new InMemoryStorageArea(initialStorage);
  const syncStorageArea = new InMemoryStorageArea(initialStorage);

  const baseBrowser: Record<string, unknown> = {
    runtime: {
      id: 'mock-tuquet-extension-id',
      getManifest: () => ({
        name: 'Tuquet Web Studio',
        version: '1.0.0',
        manifest_version: 3,
      }),
      getURL: (p: string) => p,
      sendMessage: async (_msg: unknown) => ({ success: true }),
      onMessage: createEventStub(),
      onInstalled: createEventStub(),
    },
    storage: {
      local: localStorageArea,
      sync: syncStorageArea,
      onChanged: localStorageArea.onChanged,
    },
    tabs: {
      query: async () => [{ id: 1, url: 'https://tuquet.io', active: true }],
      create: async (opts: unknown) => ({ id: 2, ...(opts as object) }),
      update: async (tabId: number, opts: unknown) => ({ id: tabId, ...(opts as object) }),
      sendMessage: async () => ({ success: true }),
      onUpdated: createEventStub(),
      onActivated: createEventStub(),
    },
    windows: {
      getCurrent: async () => ({ id: 1, focused: true }),
      create: async (opts: unknown) => ({ id: 2, ...(opts as object) }),
      onFocusChanged: createEventStub(),
    },
    extension: {
      isAllowedFileSchemeAccess: async () => true,
      isAllowedIncognitoAccess: async () => true,
    },
  };

  return createSafeProxy(baseBrowser, 'browser');
}
