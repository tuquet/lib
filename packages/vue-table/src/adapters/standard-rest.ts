import type { QueryAdapter, TableState } from '../types/index.js';
import { isRuleComplete } from '../helpers/filterEngine.js';

export interface StandardRestAdapterOptions {
  pageKey?: string;
  limitKey?: string;
  sortKey?: string;
  searchKey?: string;
  /** Whether page is 1-indexed (default true) */
  oneIndexed?: boolean;
}

export class StandardRestAdapter implements QueryAdapter {
  name = 'standard-rest';
  private pageKey: string;
  private limitKey: string;
  private sortKey: string;
  private searchKey: string;
  private oneIndexed: boolean;

  constructor(options: StandardRestAdapterOptions = {}) {
    this.pageKey = options.pageKey ?? 'page';
    this.limitKey = options.limitKey ?? 'limit';
    this.sortKey = options.sortKey ?? 'sort';
    this.searchKey = options.searchKey ?? 'q';
    this.oneIndexed = options.oneIndexed ?? true;
  }

  serialize(state: TableState): Record<string, unknown> {
    const query: Record<string, unknown> = {};

    // 1. Pagination
    const pageNum = this.oneIndexed ? state.pagination.pageIndex + 1 : state.pagination.pageIndex;
    query[this.pageKey] = pageNum;
    query[this.limitKey] = state.pagination.pageSize;

    // 2. Sorting
    if (state.sorting && state.sorting.length > 0) {
      const sortParts = state.sorting.map((s) => (s.desc ? `-${s.id}` : s.id));
      query[this.sortKey] = sortParts.join(',');
    }

    // 3. Search
    if (state.search && state.search.trim().length > 0) {
      query[this.searchKey] = state.search.trim();
    }

    // 4. Filters
    if (state.filters) {
      for (const [key, value] of Object.entries(state.filters)) {
        if (value === undefined || value === null || value === '') continue;
        if (Array.isArray(value)) {
          if (value.length > 0) {
            query[key] = value.join(',');
          }
        } else if (typeof value === 'object' && value !== null) {
          const obj = value as Record<string, unknown>;
          if (Object.hasOwn(obj, 'start') || Object.hasOwn(obj, 'end')) {
            if (obj.start !== undefined && obj.start !== null && obj.start !== '') {
              query[`${key}_start`] = obj.start;
            }
            if (obj.end !== undefined && obj.end !== null && obj.end !== '') {
              query[`${key}_end`] = obj.end;
            }
          } else {
            query[key] = value;
          }
        } else {
          query[key] = value;
        }
      }
    }

    // 5. Dynamic Rules
    if (state.dynamicRules && state.dynamicRules.length > 0) {
      const activeRules = state.dynamicRules.filter(isRuleComplete);
      if (activeRules.length > 0) {
        query.filters = JSON.stringify(activeRules);
        if (state.conjunction) {
          query.conjunction = state.conjunction;
        }
      }
    }

    return query;
  }

  deserialize(query: Record<string, unknown>): Partial<TableState> {
    const result: Partial<TableState> = {};

    // 1. Pagination
    const rawPage = query[this.pageKey];
    const rawLimit = query[this.limitKey];
    if (rawPage !== undefined || rawLimit !== undefined) {
      const pageParsed = Number(rawPage);
      const limitParsed = Number(rawLimit);
      const pageIndex = Number.isNaN(pageParsed)
        ? 0
        : this.oneIndexed
          ? Math.max(0, pageParsed - 1)
          : Math.max(0, pageParsed);
      const pageSize = Number.isNaN(limitParsed) || limitParsed <= 0 ? 10 : limitParsed;

      result.pagination = { pageIndex, pageSize };
    }

    // 2. Sorting
    const rawSort = query[this.sortKey];
    if (typeof rawSort === 'string' && rawSort.trim().length > 0) {
      const parts = rawSort
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);
      result.sorting = parts.map((part) => {
        if (part.startsWith('-')) {
          return { id: part.substring(1), desc: true };
        }
        return { id: part, desc: false };
      });
    }

    // 3. Search
    const rawSearch = query[this.searchKey];
    if (typeof rawSearch === 'string') {
      result.search = rawSearch;
    }

    // 4. Filters & Conjunction
    const knownKeys = new Set([
      this.pageKey,
      this.limitKey,
      this.sortKey,
      this.searchKey,
      'conjunction',
    ]);
    if (query.conjunction === 'and' || query.conjunction === 'or') {
      result.conjunction = query.conjunction;
    }

    const filters: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(query)) {
      if (!knownKeys.has(key) && val !== undefined && val !== null) {
        if (key === 'filters' && typeof val === 'string') {
          try {
            filters.filters = JSON.parse(val);
            continue;
          } catch {
            filters.filters = val;
            continue;
          }
        }
        if (key.endsWith('_start')) {
          const baseKey = key.slice(0, -6);
          const current =
            filters[baseKey] &&
            typeof filters[baseKey] === 'object' &&
            !Array.isArray(filters[baseKey])
              ? (filters[baseKey] as Record<string, unknown>)
              : {};
          filters[baseKey] = { ...current, start: String(val) };
        } else if (key.endsWith('_end')) {
          const baseKey = key.slice(0, -4);
          const current =
            filters[baseKey] &&
            typeof filters[baseKey] === 'object' &&
            !Array.isArray(filters[baseKey])
              ? (filters[baseKey] as Record<string, unknown>)
              : {};
          filters[baseKey] = { ...current, end: String(val) };
        } else if (typeof val === 'string' && val.includes(',')) {
          filters[key] = val.split(',').map((v) => v.trim());
        } else {
          filters[key] = val;
        }
      }
    }

    if (Array.isArray(filters.filters)) {
      result.dynamicRules = filters.filters;
      delete filters.filters;
    }

    if (Object.keys(filters).length > 0) {
      result.filters = filters;
    }

    return result;
  }
}
