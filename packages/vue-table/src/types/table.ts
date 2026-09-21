import type { ColumnDef, Table } from '@tanstack/vue-table';
import type { Ref } from 'vue';
import type { UseRemoteTableReturn } from '../composables/useRemoteTable.js';
import type { TableLocale } from '../locale/types.js';
import type { TableDensity } from './core.js';
import type { DataTableFilterBuilderConfig } from './filter.js';

/**
 * Virtual Scrolling Configuration (Segregated Interface)
 */
export interface DataTableVirtualProps {
  /**
   * Enable virtual scrolling for large datasets
   */
  virtual?: boolean;
  /**
   * Container height when virtual is enabled (e.g. '500px' or 500)
   */
  virtualHeight?: string | number;
  /**
   * Estimated row height in pixels
   */
  estimatedRowHeight?: number;
  /**
   * Number of items rendered outside the viewport
   */
  overscan?: number;
}

/**
 * Mobile & Touch Ergonomics Configuration (Segregated Interface)
 */
export interface DataTableMobileProps {
  /**
   * Adaptive Pinning: Automatically unpins secondary columns on mobile (<768px)
   * to preserve horizontal scrolling area and prevent column overlap.
   */
  adaptivePinning?: boolean;
  /**
   * Mobile Layout Mode: 'table' (horizontal scroll grid) or 'cards' (card list)
   */
  mobileLayout?: 'table' | 'cards' | 'auto';
  /**
   * Show mobile scroll helper hint when table is horizontally scrollable
   */
  showMobileScrollHint?: boolean;
  /**
   * Custom text for mobile horizontal scroll helper banner
   */
  mobileScrollHintText?: string;
}

/**
 * Core DataTable Props (Composed via Interface Segregation Principle)
 * Supports both:
 * 1. Zero-Boilerplate Client Mode: `:data="items" :columns="columns"`
 * 2. Enterprise Remote Server Mode: `:remote="remote"`
 */
export interface DataTableProps<TData>
  extends DataTableVirtualProps, DataTableMobileProps, DataTableFilterBuilderConfig {
  /**
   * Unified table instance returned from `useDataTable` or raw TanStack `Table`.
   */
  table?: Table<TData> | any;
  /**
   * Remote table instance returned from `useRemoteTable` or `useDataTable`.
   * When provided, handles server-side pagination, sorting, filtering, and mutations.
   */
  remote?: UseRemoteTableReturn<TData>;
  /**
   * Raw array of data items for standalone / client-side in-memory mode.
   */
  data?: TData[];
  /**
   * Column definitions for standalone / client-side in-memory mode.
   */
  columns?: ColumnDef<TData, any>[];
  /**
   * Manual loading indicator (useful when managing loading outside useRemoteTable).
   */
  loading?: boolean;
  /**
   * Total records count override.
   */
  total?: number;
  showToolbar?: boolean;
  showPagination?: boolean;
  showFloatingBar?: boolean;
  emptyMessage?: string;
  skeletonRows?: number;
  density?: TableDensity;
  /**
   * Enable vertical column borders and column resizing.
   * When enabled, table headers and cells show column borders (`border-r`),
   * and columns can be resized by dragging the column borders.
   */
  bordered?: boolean;
  border?: boolean;
  enableColumnResizing?: boolean;
  enableRowExpansion?: boolean;
  enableColumnHeaderMenu?: boolean;
  enableSavedViews?: boolean;
  locale?: TableLocale | Ref<TableLocale>;
  /**
   * Unified Master DataTable Configuration Object
   */
  config?: import('./config.js').DataTableConfig<TData>;
  /**
   * Bulk actions configuration object or boolean
   */
  bulkActions?: boolean | import('./config.js').BulkActionsConfig<TData>;
  /**
   * Export configuration object or boolean
   */
  export?: boolean | import('./config.js').ExportConfig<TData>;
  /**
   * Row Edit Sheet configuration object or boolean (Supabase style)
   */
  rowEdit?: boolean | import('./config.js').RowEditConfig<TData>;
  /**
   * Filter configuration object or boolean
   */
  filter?: boolean | import('./config.js').FilterConfig<TData>;
}
