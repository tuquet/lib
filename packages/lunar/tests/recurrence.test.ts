import { describe, it, expect } from 'vitest';
import { getNextAnnualLunarDate, getNextFullMoon, getNextNewMoon } from '../src/recurrence.js';

describe('Lunar Recurrence', () => {
  describe('getNextAnnualLunarDate (e.g. Giỗ, Trung Thu)', () => {
    it('finds Mid-Autumn festival 15/08 in current year if in the future', () => {
      // Current date: 2024-01-01
      const result = getNextAnnualLunarDate(15, 8, { day: 1, month: 1, year: 2024 });
      // 15/08/2024 Lunar was 2024-09-17 Solar
      expect(result.solar).toEqual({ day: 17, month: 9, year: 2024 });
      expect(result.lunar.day).toBe(15);
      expect(result.lunar.month).toBe(8);
      expect(result.daysUntil).toBeGreaterThan(0);
    });

    it('finds Mid-Autumn festival in next year if current year has already passed', () => {
      // Current date: 2024-10-01 (after Mid-Autumn 2024 on 2024-09-17)
      const result = getNextAnnualLunarDate(15, 8, { day: 1, month: 10, year: 2024 });
      // 15/08/2025 Lunar is 2025-10-06 Solar
      expect(result.solar).toEqual({ day: 6, month: 10, year: 2025 });
      expect(result.lunar.day).toBe(15);
      expect(result.lunar.month).toBe(8);
      expect(result.lunar.year).toBe(2025);
      expect(result.daysUntil).toBeGreaterThan(0);
    });
  });

  describe('getNextFullMoon (Ngày Rằm 15)', () => {
    it('finds the next 15th lunar day from any date', () => {
      // From 2024-02-10 (Mùng 1 Tết Giáp Thìn)
      const result = getNextFullMoon({ day: 10, month: 2, year: 2024 });
      // Rằm tháng Giêng 2024 was 2024-02-24
      expect(result.lunar.day).toBe(15);
      expect(result.lunar.month).toBe(1);
      expect(result.solar).toEqual({ day: 24, month: 2, year: 2024 });
      expect(result.daysUntil).toBe(14);
    });
  });

  describe('getNextNewMoon (Mùng 1)', () => {
    it('finds the next 1st lunar day from any date', () => {
      // From 2024-02-15 (in the middle of month 1)
      const result = getNextNewMoon({ day: 15, month: 2, year: 2024 });
      expect(result.lunar.day).toBe(1);
      expect(result.lunar.month).toBe(2);
      expect(result.daysUntil).toBeGreaterThan(0);
    });
  });
});
