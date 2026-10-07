export interface PaginationState {
  pageIndex: number;
  pageSize: number;
}

export interface ColumnSort {
  id: string;
  desc: boolean;
}

export type SortingState = ColumnSort[];

export type FilterOperator =
  | 'eq'
  | 'ne'
  | 'contains'
  | 'notContains'
  | 'startsWith'
  | 'endsWith'
  | 'in'
  | 'notIn'
  | 'between'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'is'
  | 'isNot'
  | 'before'
  | 'after'
  | 'isEmpty'
  | 'isNotEmpty'
  | 'isTrue'
  | 'isFalse';

export interface ColumnFilterValue<T = unknown> {
  id: string;
  operator: FilterOperator;
  value: T;
}

export type FiltersState = Record<string, unknown>;

export interface ColumnPinningState {
  left?: string[];
  right?: string[];
}

export type TableDensity = 'compact' | 'normal' | 'comfortable';

export interface TableState {
  pagination: PaginationState;
  sorting: SortingState;
  filters: FiltersState;
  dynamicRules?: import('./filter.js').DynamicFilterRule[];
  conjunction?: import('./filter.js').FilterConjunction;
  search?: string;
  columnVisibility?: Record<string, boolean>;
  columnPinning?: ColumnPinningState;
}

export interface FetchParams {
  page: number;
  limit: number;
  offset: number;
  sort?: string;
  search?: string;
  filters: Record<string, unknown>;
  dynamicRules?: import('./filter.js').DynamicFilterRule[];
  conjunction?: import('./filter.js').FilterConjunction;
  signal: AbortSignal;
  queryParams: Record<string, unknown>;
  toQueryString: () => string;
}

export interface FetchResult<TData> {
  data: TData[];
  total: number;
  pageCount?: number;
  facets?: Record<string, Record<string, number>>;
}
