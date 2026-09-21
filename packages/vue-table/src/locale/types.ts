export interface TablePaginationMessages {
  rowsPerPage: string;
  pageSummary: (page: number, totalPages: number) => string;
  selectedCount: (count: number) => string;
  totalRecords: (total: number) => string;
  firstPage?: string;
  previousPage?: string;
  nextPage?: string;
  lastPage?: string;
}

export interface TableToolbarMessages {
  searchPlaceholder: string;
  reset: string;
  viewOptionsTrigger: string;
  viewOptionsTitle: string;
}

export interface TableFloatingBarMessages {
  selected: (count: number, total?: number) => string;
  clear: string;
}

export interface TableFilterBuilderMessages {
  title: string;
  where: string;
  and: string;
  or: string;
  addRule: string;
  clearAll: string;
  emptyMessage: string;
  presetsTitle: string;
  noValueNeeded: string;
  betweenFrom: string;
  betweenTo: string;
  selectPlaceholder: string;
  valuePlaceholder?: string;
}

export interface TableCellMessages {
  clickToEdit: string;
  clickToChangeStatus: string;
  save: string;
  cancel: string;
  edited: string;
  copy?: string;
  copied?: string;
}

export interface TableHeaderMenuMessages {
  sortAsc: string;
  sortDesc: string;
  clearSort: string;
  pinLeft: string;
  pinRight: string;
  unpin: string;
  resetSize: string;
  hideColumn: string;
  openMenu?: string;
}

export interface TableSavedViewsMessages {
  viewsTitle: string;
  defaultView: string;
  saveCurrentView: string;
  saveAsNewView: string;
  viewNamePlaceholder: string;
  saveButton: string;
  deleteView: string;
  confirmDelete: string;
  customViewBadge: string;
}

export interface TableGeneralMessages {
  emptyMessage: string;
  failedToLoad: string;
  tryAgain: string;
  mobileScrollHint: string;
}

export interface TableDateRangeMessages {
  title: string;
  placeholder: string;
  presetsTitle: string;
  today: string;
  yesterday: string;
  last7Days: string;
  last30Days: string;
  thisMonth: string;
  lastMonth: string;
  clear: string;
  apply: string;
}

export interface TableLocaleMessages {
  general: TableGeneralMessages;
  pagination: TablePaginationMessages;
  toolbar: TableToolbarMessages;
  floatingBar: TableFloatingBarMessages;
  filterBuilder: TableFilterBuilderMessages;
  cell: TableCellMessages;
  headerMenu: TableHeaderMenuMessages;
  savedViews: TableSavedViewsMessages;
  dateRange?: TableDateRangeMessages;
}

export interface TableLocaleFormatters {
  currency: (value: number, currencyCode?: string) => string;
  number: (value: number) => string;
  date: (value: string | number | Date, options?: Intl.DateTimeFormatOptions) => string;
}

export interface TableLocale {
  code: string;
  direction?: 'ltr' | 'rtl';
  messages: TableLocaleMessages;
  formatters: TableLocaleFormatters;
}
