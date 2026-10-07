import { describe, expect, it } from 'vitest';
import { LhsBracketsAdapter } from '../src/adapters/lhs-brackets.js';
import { StandardRestAdapter } from '../src/adapters/standard-rest.js';
import { endOfMonth, getLocalTimeZone, parseDate, startOfMonth, today } from '@tuquet/vue-ui';

describe('Layer 3: Date Range Filter & Adapters', () => {
  describe('Internationalized Date Helpers', () => {
    it('correctly parses ISO date string YYYY-MM-DD', () => {
      const parsed = parseDate('2026-09-18');
      expect(parsed.year).toBe(2026);
      expect(parsed.month).toBe(9);
      expect(parsed.day).toBe(18);
      expect(parsed.toString()).toBe('2026-09-18');
    });

    it('calculates preset ranges accurately', () => {
      const t = today(getLocalTimeZone());
      const todayStr = t.toString();

      // Today
      expect(todayStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      // Yesterday
      const yesterday = t.subtract({ days: 1 }).toString();
      expect(yesterday).not.toBe(todayStr);

      // 7 days ago
      const sevenDaysAgo = t.subtract({ days: 6 }).toString();
      expect(sevenDaysAgo < todayStr).toBe(true);

      // Month bounds
      const firstOfMonth = startOfMonth(t).toString();
      const lastOfMonth = endOfMonth(t).toString();
      expect(firstOfMonth.endsWith('-01')).toBe(true);
      expect(firstOfMonth <= lastOfMonth).toBe(true);

      // Previous month
      const lastMonth = t.subtract({ months: 1 });
      const firstOfLastMonth = startOfMonth(lastMonth).toString();
      const lastOfLastMonth = endOfMonth(lastMonth).toString();
      expect(firstOfLastMonth < firstOfMonth).toBe(true);
      expect(lastOfLastMonth < firstOfMonth).toBe(true);
    });
  });

  describe('StandardRestAdapter Date Range Integration', () => {
    const adapter = new StandardRestAdapter();

    it('serializes date range filter to _start and _end parameters', () => {
      const query = adapter.serialize({
        pagination: { pageIndex: 0, pageSize: 10 },
        sorting: [],
        filters: {
          createdAt: { start: '2026-09-01', end: '2026-09-18' },
        },
      });

      expect(query.createdAt_start).toBe('2026-09-01');
      expect(query.createdAt_end).toBe('2026-09-18');
      expect(query.page).toBe(1);
      expect(query.limit).toBe(10);
    });

    it('deserializes _start and _end parameters back to date range filter', () => {
      const state = adapter.deserialize({
        page: '2',
        limit: '25',
        createdAt_start: '2026-09-01',
        createdAt_end: '2026-09-18',
      });

      expect(state.pagination?.pageIndex).toBe(1);
      expect(state.pagination?.pageSize).toBe(25);
      expect(state.filters?.createdAt).toEqual({
        start: '2026-09-01',
        end: '2026-09-18',
      });
    });

    it('handles partial date range with only start date', () => {
      const query = adapter.serialize({
        pagination: { pageIndex: 0, pageSize: 10 },
        sorting: [],
        filters: {
          createdAt: { start: '2026-09-01' },
        },
      });

      expect(query.createdAt_start).toBe('2026-09-01');
      expect(query.createdAt_end).toBeUndefined();
    });
  });

  describe('LhsBracketsAdapter Date Range Integration', () => {
    const adapter = new LhsBracketsAdapter();

    it('serializes date range filter to [gte] and [lte] brackets', () => {
      const query = adapter.serialize({
        pagination: { pageIndex: 0, pageSize: 10 },
        sorting: [],
        filters: {
          createdAt: { start: '2026-09-01', end: '2026-09-18' },
        },
      });

      expect(query['filter[createdAt][gte]']).toBe('2026-09-01');
      expect(query['filter[createdAt][lte]']).toBe('2026-09-18');
      expect(query.page).toBe(1);
      expect(query.limit).toBe(10);
    });

    it('deserializes [gte] and [lte] parameters back to date range filter', () => {
      const state = adapter.deserialize({
        page: '1',
        limit: '10',
        'filter[createdAt][gte]': '2026-09-01',
        'filter[createdAt][lte]': '2026-09-18',
      });

      expect(state.filters?.createdAt).toEqual({
        start: '2026-09-01',
        end: '2026-09-18',
      });
    });
  });
});
