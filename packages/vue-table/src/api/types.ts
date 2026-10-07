import type { Column, ExpandedState, Row, Table } from '@tanstack/vue-table';
import type { DynamicFilterRule, FilterPreset } from '../types/filter.js';
import type { TableSavedView } from '../types/savedViews.js';
import type { RowPredicate, RowUpdater } from '../composables/useTableMutations.js';
import type { TableCellEditEvent } from '../plugins/types.js';
import type { CopyTsvOptions, ExportCsvOptions, ExportExcelOptions } from '../helpers/export.js';

export interface ColumnApi<TData = any> {
  getColumns(): Column<TData, unknown>[];
  getVisibleColumns(): Column<TData, unknown>[];
  getColumn(id: string): Column<TData, unknown> | undefined;
  setVisible(columnId: string, visible: boolean): void;
  toggleVisibility(columnId: string): void;
  showAll(): void;
  hideAll(): void;
  pin(columnId: string, position: 'left' | 'right' | false): void;
  unpin(columnId: string): void;
  isPinned(columnId: string): 'left' | 'right' | false;
  isVisible(columnId: string): boolean;
  setSize(columnId: string, size: number): void;
  resetSize(columnId?: string): void;
}

export interface FilterApi {
  setSearch(query: string): void;
  getSearch(): string;
  clearSearch(): void;
  setFilter(id: string, value: unknown): void;
  getFilter(id: string): unknown;
  resetFilters(): void;
  addRule(rule: Partial<DynamicFilterRule>): void;
  removeRule(ruleId: string): void;
  clearRules(): void;
  getRules(): DynamicFilterRule[];
  applyPreset(preset: FilterPreset): void;
  getActiveCount(): number;
}

export interface SelectionApi<TData = any> {
  getSelectedRows(): Row<TData>[];
  getSelectedData(): TData[];
  getSelectedIds(): string[];
  getSelectedRowIds(): string[];
  selectAll(): void;
  clearSelection(): void;
  toggleRow(rowId: string | number): void;
  toggleRowSelected(rowId: string | number): void;
  isRowSelected(rowId: string | number): boolean;
  isAllSelected(): boolean;
  getCount(): number;
  getSelectedCount(): number;
}

export interface PaginationApi {
  goToPage(index: number): void;
  nextPage(): void;
  previousPage(): void;
  firstPage(): void;
  lastPage(): void;
  setPageSize(size: number): void;
  getPage(): number;
  getPageSize(): number;
  getTotal(): number;
  getTotalPages(): number;
  canNext(): boolean;
  canNextPage(): boolean;
  canPrevious(): boolean;
  canPreviousPage(): boolean;
}

export interface ExportApi<TData = any> {
  toCsv(filename?: string, options?: Partial<ExportCsvOptions<TData>>): void;
  toExcel(filename?: string, options?: Partial<ExportExcelOptions<TData>>): Promise<void>;
  toClipboardTsv(options?: Partial<CopyTsvOptions<TData>>): Promise<boolean>;
}

export interface ScrollApi {
  scrollToIndex(index: number, options?: { align?: 'start' | 'center' | 'end' | 'auto' }): void;
  scrollToOffset(offset: number): void;
}

export interface ExpansionApi {
  getExpanded(): ExpandedState;
  isRowExpanded(rowId: string | number): boolean;
  isExpanded(rowId: string | number): boolean;
  toggleRowExpanded(rowId: string | number): void;
  toggleRow(rowId: string | number): void;
  expandAll(): void;
  collapseAll(): void;
  getExpandedCount(): number;
}

export interface ViewsApi {
  getViews(): TableSavedView[];
  getActiveView(): TableSavedView | undefined;
  hasActiveView(): boolean;
  applyView(viewOrId: string | TableSavedView): void;
  saveView(name: string): TableSavedView;
  updateActiveView(): void;
  deleteView(viewId: string): void;
  resetToDefault(): void;
}

export interface TableApi<TData = any> {
  readonly column: ColumnApi<TData>;
  readonly filter: FilterApi;
  readonly selection: SelectionApi<TData>;
  readonly pagination: PaginationApi;
  readonly export: ExportApi<TData>;
  expansion?: ExpansionApi;
  views?: ViewsApi;
  scroll?: ScrollApi;
  refresh(): Promise<void>;
  refetch(): Promise<void>;
  mutateRow(predicateOrId: RowPredicate<TData>, updater: RowUpdater<TData>): void;
  deleteRow(predicateOrId: RowPredicate<TData> | (string | number)[]): void;
  notifyCellEdit(event: TableCellEditEvent<TData>): Promise<boolean>;
  getRawTable(): Table<TData>;
}
