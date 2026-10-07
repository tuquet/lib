import type { QueryAdapter, TableState } from '../types/index.js';

export interface LhsBracketsAdapterOptions {
  pageKey?: string;
  limitKey?: string;
  filterPrefix?: string;
  sortPrefix?: string;
}

export class LhsBracketsAdapter implements QueryAdapter {
  name = 'lhs-brackets';
  private pageKey: string;
  private limitKey: string;
  private filterPrefix: string;
  private sortPrefix: string;

  constructor(options: LhsBracketsAdapterOptions = {}) {
    this.pageKey = options.pageKey ?? 'page';
    this.limitKey = options.limitKey ?? 'limit';
    this.filterPrefix = options.filterPrefix ?? 'filter';
    this.sortPrefix = options.sortPrefix ?? 'sort';
  }

  serialize(state: TableState): Record<string, unknown> {
    const query: Record<string, unknown> = {};

    // 1. Pagination
    query[this.pageKey] = state.pagination.pageIndex + 1;
    query[this.limitKey] = state.pagination.pageSize;

    // 2. Sorting: sort[column]=asc|desc
    if (state.sorting) {
      for (const s of state.sorting) {
        query[`${this.sortPrefix}[${s.id}]`] = s.desc ? 'desc' : 'asc';
      }
    }

    // 3. Search: filter[q]=...
    if (state.search && state.search.trim().length > 0) {
      query[`${this.filterPrefix}[q]`] = state.search.trim();
    }

    // 4. Filters: filter[status][in]=active,pending or filter[key]=val
    if (state.filters) {
      for (const [key, value] of Object.entries(state.filters)) {
        if (value === undefined || value === null || value === '') continue;
        if (Array.isArray(value)) {
          if (value.length > 0) {
            query[`${this.filterPrefix}[${key}][in]`] = value.join(',');
          }
        } else if (typeof value === 'object' && value !== null) {
          const obj = value as Record<string, unknown>;
          if (Object.hasOwn(obj, 'start') || Object.hasOwn(obj, 'end')) {
            if (obj.start !== undefined && obj.start !== null && obj.start !== '') {
              query[`${this.filterPrefix}[${key}][gte]`] = obj.start;
            }
            if (obj.end !== undefined && obj.end !== null && obj.end !== '') {
              query[`${this.filterPrefix}[${key}][lte]`] = obj.end;
            }
          } else {
            query[`${this.filterPrefix}[${key}]`] = value;
          }
        } else {
          query[`${this.filterPrefix}[${key}]`] = value;
        }
      }
    }

    return query;
  }

  deserialize(query: Record<string, unknown>): Partial<TableState> {
    const result: Partial<TableState> = {};

    // 1. Pagination
    if (query[this.pageKey] !== undefined || query[this.limitKey] !== undefined) {
      const page = Math.max(0, Number(query[this.pageKey] ?? 1) - 1);
      const pageSize = Number(query[this.limitKey] ?? 10);
      result.pagination = {
        pageIndex: Number.isNaN(page) ? 0 : page,
        pageSize: Number.isNaN(pageSize) || pageSize <= 0 ? 10 : pageSize,
      };
    }

    // 2. Sorting
    const sortRegex = new RegExp(`^${this.sortPrefix}\\[([a-zA-Z0-9_.-]+)\\]$`);
    const sorting: TableState['sorting'] = [];
    for (const [k, v] of Object.entries(query)) {
      const match = k.match(sortRegex);
      if (match && match[1]) {
        sorting.push({
          id: match[1],
          desc: String(v).toLowerCase() === 'desc',
        });
      }
    }
    if (sorting.length > 0) result.sorting = sorting;

    // 3. Filters and Search
    const filterRegex = new RegExp(
      `^${this.filterPrefix}\\[([a-zA-Z0-9_.-]+)\\](?:\\[([a-zA-Z0-9_.-]+)\\])?$`
    );
    const filters: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(query)) {
      const match = k.match(filterRegex);
      if (match && match[1]) {
        const field = match[1];
        const operator = match[2];
        if (field === 'q') {
          result.search = String(v);
        } else if (operator === 'in' && typeof v === 'string') {
          filters[field] = v.split(',').map((item) => item.trim());
        } else if (operator === 'gte') {
          const current =
            filters[field] && typeof filters[field] === 'object' && !Array.isArray(filters[field])
              ? (filters[field] as Record<string, unknown>)
              : {};
          filters[field] = { ...current, start: String(v) };
        } else if (operator === 'lte') {
          const current =
            filters[field] && typeof filters[field] === 'object' && !Array.isArray(filters[field])
              ? (filters[field] as Record<string, unknown>)
              : {};
          filters[field] = { ...current, end: String(v) };
        } else {
          filters[field] = v;
        }
      }
    }
    if (Object.keys(filters).length > 0) result.filters = filters;

    return result;
  }
}
