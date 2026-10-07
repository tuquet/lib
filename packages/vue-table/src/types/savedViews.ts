import type { DynamicFilterRule, FilterConjunction } from './filter.js';

export interface TableSavedViewState {
  columnVisibility?: Record<string, boolean>;
  columnPinning?: { left?: string[]; right?: string[] };
  columnSizing?: Record<string, number>;
  sorting?: { id: string; desc: boolean }[];
  filters?: Record<string, unknown>;
  search?: string;
  dynamicRules?: DynamicFilterRule[];
  dynamicConjunction?: FilterConjunction;
  pageSize?: number;
}

export interface TableSavedView {
  id: string;
  name: string;
  isDefault?: boolean;
  createdAt: number;
  updatedAt: number;
  state: TableSavedViewState;
}
