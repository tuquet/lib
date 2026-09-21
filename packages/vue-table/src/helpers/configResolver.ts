import type {
  BulkActionsConfig,
  ExportConfig,
  FilterConfig,
  MobileConfig,
  PaginationConfig,
  RowEditConfig,
  SavedViewsConfig,
  ToolbarConfig,
  VirtualConfig,
} from '../types/config.js';

/**
 * Normalizes a boolean | config object into a resolved config object with defaults,
 * or returns null if the feature is explicitly disabled.
 */
export function resolveBooleanOrConfig<TConfig extends Record<string, any>>(
  option: boolean | TConfig | undefined,
  defaultConfig: TConfig
): TConfig | null {
  if (option === false || option === undefined) {
    return null;
  }
  if (option === true) {
    return { ...defaultConfig, enabled: true };
  }
  if (typeof option === 'object' && option !== null) {
    const isExplicitlyDisabled = (option as any).enabled === false;
    if (isExplicitlyDisabled) return null;
    return { ...defaultConfig, ...option, enabled: true };
  }
  return null;
}

export function resolveBulkActionsConfig<TData>(
  val?: boolean | BulkActionsConfig<TData>
): BulkActionsConfig<TData> | null {
  return resolveBooleanOrConfig(val, {
    enabled: true,
    actions: [],
    maxVisibleOnMobile: 2,
  });
}

export function resolveExportConfig<TData>(
  val?: boolean | ExportConfig<TData>
): ExportConfig<TData> | null {
  return resolveBooleanOrConfig(val, {
    enabled: true,
    formats: ['excel', 'csv', 'tsv'],
    scope: 'filtered',
  });
}

export function resolveFilterConfig<TData>(
  val?: boolean | FilterConfig<TData>
): FilterConfig<TData> | null {
  return resolveBooleanOrConfig(val, {
    enabled: true,
    mode: 'combined',
    debounceMs: 300,
  });
}

export function resolveVirtualConfig(val?: boolean | VirtualConfig): VirtualConfig | null {
  return resolveBooleanOrConfig(val, {
    enabled: true,
    height: '500px',
    overscan: 5,
  });
}

export function resolveMobileConfig<TData>(
  val?: boolean | MobileConfig<TData>
): MobileConfig<TData> | null {
  return resolveBooleanOrConfig(val, {
    breakpoint: 768,
    layout: 'auto',
    adaptivePinning: true,
    scrollHint: false,
  });
}

export function resolveSavedViewsConfig<TData>(
  val?: boolean | SavedViewsConfig<TData>
): SavedViewsConfig<TData> | null {
  return resolveBooleanOrConfig(val, {
    enabled: true,
    displayMode: 'dropdown',
  });
}

export function resolveRowEditConfig<TData>(
  val?: boolean | RowEditConfig<TData>
): RowEditConfig<TData> | null {
  return resolveBooleanOrConfig(val, {
    enabled: true,
    mode: 'sheet',
    sheetWidth: 'lg',
    swipeBack: true,
    enableHistoryBack: true,
  });
}

export function resolvePaginationConfig(val?: boolean | PaginationConfig): PaginationConfig | null {
  return resolveBooleanOrConfig(val, {
    enabled: true,
    pageSize: 10,
    pageSizeOptions: [10, 20, 50, 100],
    showTotal: true,
  });
}

export function resolveToolbarConfig<TData>(
  val?: boolean | ToolbarConfig<TData>
): ToolbarConfig<TData> | null {
  return resolveBooleanOrConfig(val, {
    enabled: true,
    search: true,
    viewOptions: true,
    densityToggle: true,
  });
}
