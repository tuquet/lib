import { getCurrentScope, onScopeDispose, ref, type Ref } from 'vue';

export interface RemoteSelectFetchParams {
  page: number;
  pageSize: number;
  search: string;
  signal: AbortSignal;
}

export interface RemoteSelectFetchResult<TOption> {
  data: TOption[];
  total: number;
  hasMore?: boolean;
}

export interface UseRemoteInfiniteSelectOptions<TOption, TValue = string | number> {
  fetcher: (params: RemoteSelectFetchParams) => Promise<RemoteSelectFetchResult<TOption>>;
  resolveValue?: (val: TValue) => Promise<TOption | null>;
  modelValue?: Ref<TValue | TValue[] | undefined>;
  valueKey?: keyof TOption | ((item: TOption) => TValue);
  labelKey?: keyof TOption | ((item: TOption) => string);
  onCreate?: (search: string) => Promise<TOption | void>;
  onDelete?: (item: TOption) => Promise<boolean | void>;
  canCreate?: boolean | ((search: string) => boolean);
  canDelete?: boolean | ((item: TOption) => boolean);
  pageSize?: number;
  debounceMs?: number;
}

export interface UseRemoteInfiniteSelectReturn<TOption, TValue = string | number> {
  items: Ref<TOption[]>;
  page: Ref<number>;
  total: Ref<number>;
  hasMore: Ref<boolean>;
  isLoading: Ref<boolean>;
  isLoadingMore: Ref<boolean>;
  isSearching: Ref<boolean>;
  searchQuery: Ref<string>;
  resolvedItem: Ref<TOption | null>;
  deletingIds: Ref<Record<string, boolean>>;
  isCreating: Ref<boolean>;
  loadMore: () => Promise<void>;
  setSearch: (query: string) => void;
  createItem: (search: string) => Promise<TOption | null>;
  deleteItem: (item: TOption) => Promise<boolean>;
  refresh: () => Promise<void>;
  getItemValue: (item: TOption) => TValue;
  getItemLabel: (item: TOption) => string;
}

export function useRemoteInfiniteSelect<TOption, TValue = string | number>(
  options: UseRemoteInfiniteSelectOptions<TOption, TValue>
): UseRemoteInfiniteSelectReturn<TOption, TValue> {
  const {
    fetcher,
    resolveValue,
    modelValue,
    valueKey = 'id' as keyof TOption,
    labelKey = 'name' as keyof TOption,
    onCreate,
    onDelete,
    pageSize = 20,
    debounceMs = 250,
  } = options;

  const items = ref<TOption[]>([]) as Ref<TOption[]>;
  const page = ref(1);
  const total = ref(0);
  const hasMore = ref(false);
  const isLoading = ref(false);
  const isLoadingMore = ref(false);
  const isSearching = ref(false);
  const searchQuery = ref('');
  const resolvedItem = ref<TOption | null>(null) as Ref<TOption | null>;
  const deletingIds = ref<Record<string, boolean>>({});
  const isCreating = ref(false);

  let activeController: AbortController | null = null;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const getItemValue = (item: TOption): TValue => {
    if (typeof valueKey === 'function') {
      return valueKey(item);
    }
    const candidate = item as unknown as Record<string, unknown>;
    const key = String(valueKey);
    return (candidate[key] ?? candidate.id ?? candidate._id) as TValue;
  };

  const getItemLabel = (item: TOption): string => {
    if (typeof labelKey === 'function') {
      return labelKey(item);
    }
    const candidate = item as unknown as Record<string, unknown>;
    const key = String(labelKey);
    return String(candidate[key] ?? candidate.label ?? candidate.title ?? candidate.id ?? '');
  };

  const executeFetch = async (targetPage: number, isNewSearch = false) => {
    if (activeController) {
      activeController.abort('New select fetch initiated');
    }
    activeController = new AbortController();
    const signal = activeController.signal;

    if (targetPage === 1) {
      if (isNewSearch) {
        isSearching.value = true;
      } else {
        isLoading.value = true;
      }
    } else {
      isLoadingMore.value = true;
    }

    try {
      const result = await fetcher({
        page: targetPage,
        pageSize,
        search: searchQuery.value,
        signal,
      });

      if (!signal.aborted) {
        if (targetPage === 1) {
          items.value = result.data;
        } else {
          items.value = [...items.value, ...result.data];
        }

        page.value = targetPage;
        total.value = result.total;
        hasMore.value =
          result.hasMore !== undefined ? result.hasMore : items.value.length < result.total;

        // Try hydrating if resolved item isn't set yet
        if (resolveValue && !resolvedItem.value && modelValue?.value) {
          const val = Array.isArray(modelValue.value) ? modelValue.value[0] : modelValue.value;
          if (val !== undefined && val !== null && val !== '') {
            const found = items.value.find((it) => getItemValue(it) === val);
            if (found) {
              resolvedItem.value = found;
            } else {
              resolveValue(val)
                .then((res) => {
                  if (res) resolvedItem.value = res;
                })
                .catch(() => {});
            }
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      console.error('Remote select fetch error:', err);
    } finally {
      if (!signal.aborted) {
        isLoading.value = false;
        isLoadingMore.value = false;
        isSearching.value = false;
      }
    }
  };

  const loadMore = async () => {
    if (isLoading.value || isLoadingMore.value || !hasMore.value) {
      return;
    }
    await executeFetch(page.value + 1);
  };

  const refresh = async () => {
    page.value = 1;
    await executeFetch(1);
  };

  const scheduleSearch = (query: string) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }

    searchQuery.value = query;

    if (debounceMs <= 0) {
      page.value = 1;
      executeFetch(1, true);
    } else {
      debounceTimer = setTimeout(() => {
        page.value = 1;
        executeFetch(1, true);
      }, debounceMs);
    }
  };

  const setSearch = (query: string) => {
    scheduleSearch(query);
  };

  const createItem = async (input: string): Promise<TOption | null> => {
    if (!onCreate) return null;
    isCreating.value = true;
    try {
      const newItem = await onCreate(input);
      if (newItem) {
        items.value = [newItem, ...items.value];
        total.value += 1;

        if (modelValue) {
          const val = getItemValue(newItem);
          if (Array.isArray(modelValue.value)) {
            modelValue.value = [...modelValue.value, val];
          } else {
            modelValue.value = val;
          }
        }
        return newItem;
      }
      return null;
    } finally {
      isCreating.value = false;
    }
  };

  const deleteItem = async (item: TOption): Promise<boolean> => {
    if (!onDelete) return false;
    const val = getItemValue(item);
    const valStr = String(val);

    deletingIds.value = { ...deletingIds.value, [valStr]: true };

    const originalItems = [...items.value];
    const originalTotal = total.value;

    // Optimistic remove
    items.value = items.value.filter((it) => getItemValue(it) !== val);
    total.value = Math.max(0, total.value - 1);

    try {
      const result = await onDelete(item);
      if (result === false) {
        items.value = originalItems;
        total.value = originalTotal;
        return false;
      }

      // Check if deleted item was selected
      if (modelValue) {
        if (Array.isArray(modelValue.value)) {
          modelValue.value = (modelValue.value as TValue[]).filter((v) => v !== val);
        } else if (modelValue.value === val) {
          modelValue.value = undefined;
        }
      }

      return true;
    } catch {
      items.value = originalItems;
      total.value = originalTotal;
      return false;
    } finally {
      const next = { ...deletingIds.value };
      delete next[valStr];
      deletingIds.value = next;
    }
  };

  if (getCurrentScope()) {
    onScopeDispose(() => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }
      if (activeController) {
        activeController.abort('Select composable disposed');
        activeController = null;
      }
    });
  }

  return {
    items,
    page,
    total,
    hasMore,
    isLoading,
    isLoadingMore,
    isSearching,
    searchQuery,
    resolvedItem,
    deletingIds,
    isCreating,
    loadMore,
    setSearch,
    createItem,
    deleteItem,
    refresh,
    getItemValue,
    getItemLabel,
  };
}
