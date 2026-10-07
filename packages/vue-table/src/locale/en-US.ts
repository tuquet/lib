import type { TableLocale } from './types.js';

export const enUS: TableLocale = {
  code: 'en-US',
  direction: 'ltr',
  messages: {
    general: {
      emptyMessage: 'No results found.',
      failedToLoad: 'Failed to load data',
      tryAgain: 'Try Again',
      mobileScrollHint: 'Swipe horizontally for more columns • Tap row to edit',
    },
    pagination: {
      rowsPerPage: 'Rows per page',
      pageSummary: (page, totalPages) => `Page ${page} of ${totalPages}`,
      selectedCount: (count) => `${count} row(s) selected`,
      totalRecords: (total) => `Total ${total} record(s)`,
      firstPage: 'Go to first page',
      previousPage: 'Go to previous page',
      nextPage: 'Go to next page',
      lastPage: 'Go to last page',
    },
    toolbar: {
      searchPlaceholder: 'Filter records...',
      reset: 'Reset',
      viewOptionsTrigger: 'Columns',
      viewOptionsTitle: 'Toggle Columns',
    },
    floatingBar: {
      selected: (count, total) => (total ? `${count} / ${total} selected` : `${count} selected`),
      clear: 'Clear',
    },
    filterBuilder: {
      title: 'Filter Builder',
      where: 'Where',
      and: 'AND',
      or: 'OR',
      addRule: 'Add rule',
      clearAll: 'Clear all',
      emptyMessage: 'No filter rules defined. Click button below to add one.',
      presetsTitle: 'Presets',
      noValueNeeded: '(No value required)',
      betweenFrom: 'From',
      betweenTo: 'To',
      selectPlaceholder: 'Select value',
      valuePlaceholder: 'Enter value...',
    },
    cell: {
      clickToEdit: 'Click to edit inline',
      clickToChangeStatus: 'Click to change status',
      save: 'Save (Enter)',
      cancel: 'Cancel (Esc)',
      edited: 'Edited',
      copy: 'Copy to clipboard',
      copied: 'Copied!',
    },
    headerMenu: {
      sortAsc: 'Sort Ascending',
      sortDesc: 'Sort Descending',
      clearSort: 'Clear Sort',
      pinLeft: 'Pin to Left',
      pinRight: 'Pin to Right',
      unpin: 'Unpin Column',
      resetSize: 'Reset Column Width',
      hideColumn: 'Hide Column',
      openMenu: 'Open column menu',
    },
    savedViews: {
      viewsTitle: 'Views',
      defaultView: 'Default View',
      saveCurrentView: 'Save current view',
      saveAsNewView: 'Save as new view...',
      viewNamePlaceholder: 'Enter view name...',
      saveButton: 'Save',
      deleteView: 'Delete view',
      confirmDelete: 'Are you sure you want to delete this view?',
      customViewBadge: 'Custom',
    },
    dateRange: {
      title: 'Date',
      placeholder: 'Select date range',
      presetsTitle: 'Shortcuts',
      today: 'Today',
      yesterday: 'Yesterday',
      last7Days: 'Last 7 days',
      last30Days: 'Last 30 days',
      thisMonth: 'This month',
      lastMonth: 'Last month',
      clear: 'Clear',
      apply: 'Apply',
    },
  },
  formatters: {
    currency: (value, currencyCode = 'USD') => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
      }).format(value);
    },
    number: (value) => new Intl.NumberFormat('en-US').format(value),
    date: (value, options) => {
      const d = value instanceof Date ? value : new Date(value);
      return new Intl.DateTimeFormat(
        'en-US',
        options || {
          year: 'numeric',
          month: 'short',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }
      ).format(d);
    },
  },
};
