import type { ComputedRef, Ref } from 'vue';
import type { TableSavedView } from '../types/savedViews.js';
import type { ViewsApi } from './types.js';

export interface CreateViewsApiOptions {
  views: Ref<TableSavedView[]>;
  activeView: ComputedRef<TableSavedView | undefined>;
  applyView: (viewOrId: string | TableSavedView) => void;
  saveView: (name: string) => TableSavedView;
  updateActiveView?: () => void;
  deleteView: (viewId: string) => void;
  resetToDefault: () => void;
}

export function createViewsApi(options: CreateViewsApiOptions): ViewsApi {
  const { views, activeView, applyView, saveView, updateActiveView, deleteView, resetToDefault } =
    options;

  return {
    getViews(): TableSavedView[] {
      return views.value;
    },

    getActiveView(): TableSavedView | undefined {
      return activeView.value;
    },

    hasActiveView(): boolean {
      return !!activeView.value;
    },

    applyView(viewOrId: string | TableSavedView): void {
      applyView(viewOrId);
    },

    saveView(name: string): TableSavedView {
      return saveView(name);
    },

    updateActiveView(): void {
      if (updateActiveView) {
        updateActiveView();
      }
    },

    deleteView(viewId: string): void {
      deleteView(viewId);
    },

    resetToDefault(): void {
      resetToDefault();
    },
  };
}
