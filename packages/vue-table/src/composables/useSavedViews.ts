import { computed, ref, watch, type ComputedRef, type Ref } from 'vue';
import type { TableSavedView, TableSavedViewState } from '../types/savedViews.js';

export interface UseSavedViewsOptions {
  storageKey?: string;
  initialViews?: TableSavedView[];
  storage?: Storage;
  onApplyView?: (view: TableSavedView) => void;
}

export interface UseSavedViewsReturn {
  views: Ref<TableSavedView[]>;
  activeViewId: Ref<string | null>;
  activeView: ComputedRef<TableSavedView | undefined>;
  saveView: (name: string, currentState: TableSavedViewState) => TableSavedView;
  updateView: (viewId: string, currentState: TableSavedViewState) => void;
  applyView: (viewOrId: string | TableSavedView) => void;
  deleteView: (viewId: string) => void;
  resetToDefault: () => void;
}

let viewCounter = 1;
function generateViewId(): string {
  return `view_${Date.now()}_${viewCounter++}`;
}

export function useSavedViews(options: UseSavedViewsOptions = {}): UseSavedViewsReturn {
  const {
    storageKey,
    initialViews = [],
    storage = typeof window !== 'undefined' ? window.localStorage : undefined,
    onApplyView,
  } = options;

  const views = ref<TableSavedView[]>([...initialViews]);
  const activeViewId = ref<string | null>(null);

  // 1. Restore from storage if available
  if (storageKey && storage) {
    try {
      const raw = storage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          views.value = parsed;
        }
      }
    } catch (err) {
      console.warn(`[useSavedViews] Failed to restore views for key: ${storageKey}`, err);
    }

    const rawActiveId = storage.getItem(`${storageKey}_active`);
    if (rawActiveId) {
      activeViewId.value = rawActiveId;
    }
  }

  // 2. Persist to storage when views change
  if (storageKey && storage) {
    watch(
      views,
      (newViews) => {
        try {
          storage.setItem(storageKey, JSON.stringify(newViews));
        } catch (err) {
          console.warn(`[useSavedViews] Failed to persist views for key: ${storageKey}`, err);
        }
      },
      { deep: true }
    );

    watch(activeViewId, (newId) => {
      try {
        if (newId) {
          storage.setItem(`${storageKey}_active`, newId);
        } else {
          storage.removeItem(`${storageKey}_active`);
        }
      } catch (err) {
        console.warn(
          `[useSavedViews] Failed to persist active view id for key: ${storageKey}`,
          err
        );
      }
    });
  }

  const activeView = computed<TableSavedView | undefined>(() => {
    if (!activeViewId.value) return undefined;
    return views.value.find((v) => v.id === activeViewId.value);
  });

  const saveView = (name: string, currentState: TableSavedViewState): TableSavedView => {
    const trimmedName = name.trim() || `View ${views.value.length + 1}`;
    const newView: TableSavedView = {
      id: generateViewId(),
      name: trimmedName,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      state: JSON.parse(JSON.stringify(currentState)),
    };

    views.value = [...views.value, newView];
    activeViewId.value = newView.id;
    return newView;
  };

  const updateView = (viewId: string, currentState: TableSavedViewState): void => {
    const index = views.value.findIndex((v) => v.id === viewId);
    if (index === -1) return;

    const existing = views.value[index];
    const updated: TableSavedView = {
      ...existing,
      updatedAt: Date.now(),
      state: JSON.parse(JSON.stringify(currentState)),
    };

    const next = [...views.value];
    next[index] = updated;
    views.value = next;
  };

  const applyView = (viewOrId: string | TableSavedView): void => {
    const target =
      typeof viewOrId === 'string' ? views.value.find((v) => v.id === viewOrId) : viewOrId;

    if (!target) return;

    activeViewId.value = target.id;
    if (onApplyView) {
      onApplyView(target);
    }
  };

  const deleteView = (viewId: string): void => {
    views.value = views.value.filter((v) => v.id !== viewId);
    if (activeViewId.value === viewId) {
      activeViewId.value = null;
    }
  };

  const resetToDefault = (): void => {
    activeViewId.value = null;
  };

  return {
    views,
    activeViewId,
    activeView,
    saveView,
    updateView,
    applyView,
    deleteView,
    resetToDefault,
  };
}
