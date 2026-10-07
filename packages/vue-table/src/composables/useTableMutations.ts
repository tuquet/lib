import type { Ref } from 'vue';

export type RowPredicate<TData> = string | number | ((item: TData, index: number) => boolean);

export type RowUpdater<TData> = Partial<TData> | ((item: TData, index: number) => TData);

export interface UseTableMutationsOptions<TData> {
  data: Ref<TData[]>;
  total: Ref<number>;
  getRowId?: (row: TData) => string | number;
}

export interface UseTableMutationsReturn<TData> {
  mutateRow: (predicateOrId: RowPredicate<TData>, updater: RowUpdater<TData>) => void;
  deleteRow: (predicateOrId: RowPredicate<TData> | (string | number)[]) => void;
  prependRow: (newRow: TData) => void;
  appendRow: (newRow: TData) => void;
  setData: (updaterOrValue: TData[] | ((prev: TData[]) => TData[]), newTotal?: number) => void;
}

export function matchRow<TData>(
  item: TData,
  index: number,
  predicate: RowPredicate<TData>,
  getRowId?: (row: TData) => string | number
): boolean {
  if (typeof predicate === 'function') {
    return predicate(item, index);
  }
  if (getRowId) {
    return getRowId(item) === predicate;
  }
  const candidate = item as Record<string, unknown>;
  return candidate?.id === predicate || candidate?._id === predicate;
}

export function useTableMutations<TData>(
  options: UseTableMutationsOptions<TData>
): UseTableMutationsReturn<TData> {
  const { data, total, getRowId } = options;

  const mutateRow = (predicateOrId: RowPredicate<TData>, updater: RowUpdater<TData>) => {
    data.value = data.value.map((item, idx) => {
      if (!matchRow(item, idx, predicateOrId, getRowId)) {
        return item;
      }
      if (typeof updater === 'function') {
        return updater(item, idx);
      }
      return { ...item, ...updater };
    });
  };

  const deleteRow = (predicateOrId: RowPredicate<TData> | (string | number)[]) => {
    const initialLength = data.value.length;
    if (Array.isArray(predicateOrId)) {
      const idSet = new Set(predicateOrId);
      data.value = data.value.filter((item) => {
        if (getRowId) {
          return !idSet.has(getRowId(item));
        }
        const candidate = item as Record<string, unknown>;
        const id = candidate?.id ?? candidate?._id;
        return !idSet.has(id as string | number);
      });
    } else {
      data.value = data.value.filter((item, idx) => !matchRow(item, idx, predicateOrId, getRowId));
    }
    const deletedCount = initialLength - data.value.length;
    if (deletedCount > 0) {
      total.value = Math.max(0, total.value - deletedCount);
    }
  };

  const prependRow = (newRow: TData) => {
    data.value = [newRow, ...data.value];
    total.value += 1;
  };

  const appendRow = (newRow: TData) => {
    data.value = [...data.value, newRow];
    total.value += 1;
  };

  const setData = (updaterOrValue: TData[] | ((prev: TData[]) => TData[]), newTotal?: number) => {
    data.value = typeof updaterOrValue === 'function' ? updaterOrValue(data.value) : updaterOrValue;
    if (typeof newTotal === 'number') {
      total.value = newTotal;
    }
  };

  return {
    mutateRow,
    deleteRow,
    prependRow,
    appendRow,
    setData,
  };
}
