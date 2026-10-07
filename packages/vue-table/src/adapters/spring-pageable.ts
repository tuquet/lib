import type { QueryAdapter, TableState } from '../types/index.js';

export interface SpringPageableAdapterOptions {
  pageKey?: string;
  sizeKey?: string;
  sortKey?: string;
  searchKey?: string;
}

export class SpringPageableAdapter implements QueryAdapter {
  name = 'spring-pageable';
  private pageKey: string;
  private sizeKey: string;
  private sortKey: string;
  private searchKey: string;

  constructor(options: SpringPageableAdapterOptions = {}) {
    this.pageKey = options.pageKey ?? 'page';
    this.sizeKey = options.sizeKey ?? 'size';
    this.sortKey = options.sortKey ?? 'sort';
    this.searchKey = options.searchKey ?? 'q';
  }

  serialize(state: TableState): Record<string, unknown> {
    const query: Record<string, unknown> = {};

    // Spring page is 0-indexed
    query[this.pageKey] = state.pagination.pageIndex;
    query[this.sizeKey] = state.pagination.pageSize;

    // Spring sort format: property,direction (e.g. createdAt,desc)
    if (state.sorting && state.sorting.length > 0) {
      if (state.sorting.length === 1) {
        const s = state.sorting[0];
        query[this.sortKey] = `${s.id},${s.desc ? 'desc' : 'asc'}`;
      } else {
        query[this.sortKey] = state.sorting.map((s) => `${s.id},${s.desc ? 'desc' : 'asc'}`);
      }
    }

    if (state.search && state.search.trim().length > 0) {
      query[this.searchKey] = state.search.trim();
    }

    if (state.filters) {
      for (const [key, value] of Object.entries(state.filters)) {
        if (value === undefined || value === null || value === '') continue;
        if (Array.isArray(value)) {
          if (value.length > 0) {
            query[key] = value.join(',');
          }
        } else {
          query[key] = value;
        }
      }
    }

    return query;
  }

  deserialize(query: Record<string, unknown>): Partial<TableState> {
    const result: Partial<TableState> = {};

    const rawPage = query[this.pageKey];
    const rawSize = query[this.sizeKey];
    if (rawPage !== undefined || rawSize !== undefined) {
      const pageParsed = Number(rawPage);
      const sizeParsed = Number(rawSize);
      const pageIndex = Number.isNaN(pageParsed) ? 0 : Math.max(0, pageParsed);
      const pageSize = Number.isNaN(sizeParsed) || sizeParsed <= 0 ? 20 : sizeParsed;

      result.pagination = { pageIndex, pageSize };
    }

    const rawSort = query[this.sortKey];
    if (rawSort) {
      const sortList: string[] = Array.isArray(rawSort)
        ? (rawSort as string[])
        : typeof rawSort === 'string'
          ? [rawSort]
          : [];

      const sorting = sortList
        .map((item) => {
          const parts = String(item).split(',');
          if (parts.length >= 2) {
            return {
              id: parts[0].trim(),
              desc: parts[1].trim().toLowerCase() === 'desc',
            };
          }
          if (parts.length === 1 && parts[0].trim()) {
            return { id: parts[0].trim(), desc: false };
          }
          return null;
        })
        .filter((s): s is { id: string; desc: boolean } => s !== null);

      if (sorting.length > 0) {
        result.sorting = sorting;
      }
    }

    const rawSearch = query[this.searchKey];
    if (typeof rawSearch === 'string') {
      result.search = rawSearch;
    }

    const knownKeys = new Set([this.pageKey, this.sizeKey, this.sortKey, this.searchKey]);
    const filters: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(query)) {
      if (!knownKeys.has(key) && val !== undefined && val !== null) {
        if (typeof val === 'string' && val.includes(',')) {
          filters[key] = val.split(',').map((v) => v.trim());
        } else {
          filters[key] = val;
        }
      }
    }
    if (Object.keys(filters).length > 0) {
      result.filters = filters;
    }

    return result;
  }
}
