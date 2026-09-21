import type {
  ColumnDef,
  Row,
  Table,
  SortingState,
  ColumnFiltersState,
  ColumnPinningState,
} from '@tanstack/vue-table';
import type { Component } from 'vue';
export type { TableDensity } from './core.js';
import type { TableDensity } from './core.js';
import type {
  ColumnFilterDefinition,
  DynamicFilterRule,
  FilterConjunction,
  FilterPreset,
} from './filter.js';
import type { TableSavedView } from './savedViews.js';

// ============================================================================
// 1. Bulk Actions Config
// ============================================================================

export interface BulkActionItem<TData> {
  key: string;
  label: string | ((count: number) => string);
  /**
   * Compact label displayed on mobile screens (e.g. "Xong", "Xóa", "TSV")
   */
  shortLabel?: string | ((count: number) => string);
  icon?: Component;
  variant?: 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost';
  disabled?: (selectedRows: TData[]) => boolean;
  confirm?: {
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
  };
  handler: (selectedRows: TData[], table: Table<TData>) => Promise<void> | void;
}

export interface BulkActionsConfig<TData> {
  enabled?: boolean;
  actions?: BulkActionItem<TData>[];
  /**
   * Maximum action buttons visible directly on mobile screen before collapsing into an overflow menu.
   * Default: 2
   */
  maxVisibleOnMobile?: number;
  onClear?: () => void;
}

// ============================================================================
// 2. Export Config
// ============================================================================

export type ExportFormat = 'excel' | 'csv' | 'tsv';
export type ExportScope = 'all' | 'filtered' | 'selected' | 'current-page';

export interface ExportConfig<TData = any> {
  enabled?: boolean;
  /**
   * Allowed export formats. Default: ['excel', 'csv', 'tsv']
   */
  formats?: ExportFormat[];
  /**
   * File name without extension, or a generator function.
   * Default: () => `export_${Date.now()}`
   */
  filename?: string | ((scope: ExportScope) => string);
  /**
   * Scope of data to export. Default: 'filtered'
   */
  scope?: ExportScope;
  /**
   * Column keys to exclude from export (e.g. 'actions', 'selection')
   */
  excludeColumns?: string[];
  /**
   * Callback fired upon successful export
   */
  onExport?: (format: ExportFormat, count: number) => void;
}

// ============================================================================
// 3. Filter Config
// ============================================================================

export type FilterDisplayMode = 'simple' | 'faceted' | 'builder' | 'combined';

export interface FilterConfig<TData = any> {
  enabled?: boolean;
  mode?: FilterDisplayMode;
  debounceMs?: number;
  searchPlaceholder?: string;
  searchColumns?: (keyof TData | string)[];
  columnFilterDefs?: ColumnFilterDefinition[];
  presets?: FilterPreset[];
  conjunction?: FilterConjunction;
  dynamicRules?: DynamicFilterRule[];
}

// ============================================================================
// 4. Virtual Scrolling Config
// ============================================================================

export interface VirtualConfig {
  enabled?: boolean;
  height?: string | number;
  overscan?: number;
  estimateSize?: number;
  dynamic?: boolean;
}

// ============================================================================
// 5. Mobile & Touch Ergonomics Config
// ============================================================================

export interface MobileConfig<TData = any> {
  breakpoint?: number;
  layout?: 'auto' | 'table' | 'cards';
  adaptivePinning?: boolean;
  scrollHint?: boolean | string;
}

// ============================================================================
// 6. Saved Views Config
// ============================================================================

export interface SavedViewsConfig<TData = any> {
  enabled?: boolean;
  storageKey?: string;
  displayMode?: 'dropdown' | 'pills' | 'tabs';
  defaultViewId?: string;
  builtInViews?: TableSavedView[];
  onViewChange?: (view: TableSavedView | null) => void;
}

// ============================================================================
// 7. Row Edit Sheet Config (Supabase Style)
// ============================================================================

export interface RowEditConfig<TData = any> {
  enabled?: boolean;
  mode?: 'sheet' | 'modal' | 'inline';
  trigger?: 'row-click' | 'action-menu' | 'manual';
  sheetWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  title?: string | ((row: TData) => string);
  description?: string;
  schema?: any; // OpenAPISchema or ZodSchema
  fieldOverrides?: Record<string, any>;
  swipeBack?: boolean;
  enableHistoryBack?: boolean;
  onSave?: (updatedValues: Partial<TData>, originalRow: TData) => Promise<void> | void;
  onCancel?: () => void;
}

// ============================================================================
// 8. Pagination & Density Config
// ============================================================================

export interface PaginationConfig {
  enabled?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  showTotal?: boolean | ((total: number, range: [number, number]) => string);
}

export interface DensityConfig {
  default?: TableDensity;
  options?: TableDensity[];
}

// ============================================================================
// 9. Toolbar Config
// ============================================================================

export interface ToolbarConfig<TData = any> {
  enabled?: boolean;
  search?: boolean;
  viewOptions?: boolean;
  densityToggle?: boolean;
}

// ============================================================================
// 10. Unified Master DataTable Config
// ============================================================================

export interface DataTableConfig<TData = any> {
  bulkActions?: boolean | BulkActionsConfig<TData>;
  export?: boolean | ExportConfig<TData>;
  filter?: boolean | FilterConfig<TData>;
  virtual?: boolean | VirtualConfig;
  mobile?: boolean | MobileConfig<TData>;
  savedViews?: boolean | SavedViewsConfig<TData>;
  rowEdit?: boolean | RowEditConfig<TData>;
  pagination?: boolean | PaginationConfig;
  density?: TableDensity | DensityConfig;
  toolbar?: boolean | ToolbarConfig<TData>;
  bordered?: boolean;
  enableColumnResizing?: boolean;
  enableRowExpansion?: boolean;
}
