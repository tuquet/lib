import { describe, it, expect } from 'vitest';
import {
  solarToLunar,
  lunarToSolar,
  isLeapLunarYear,
  getLeapLunarMonth,
} from '../src/converter.js';

describe('converter (Solar <-> Lunar)', () => {
  describe('Tết Nguyên Đán conversions', () => {
    it('converts Tết 2024 (Giáp Thìn)', () => {
      // 2024-02-10 was Mùng 1 Tết 2024
      const lunar = solarToLunar({ day: 10, month: 2, year: 2024 });
      expect(lunar).toEqual({
        day: 1,
        month: 1,
        year: 2024,
        isLeap: false,
      });

      const solar = lunarToSolar({ day: 1, month: 1, year: 2024 });
      expect(solar).toEqual({ day: 10, month: 2, year: 2024 });
    });

    it('converts Tết 2025 (Ất Tỵ)', () => {
      // 2025-01-29 was Mùng 1 Tết 2025
      const lunar = solarToLunar({ day: 29, month: 1, year: 2025 });
      expect(lunar).toEqual({
        day: 1,
        month: 1,
        year: 2025,
        isLeap: false,
      });

      const solar = lunarToSolar({ day: 1, month: 1, year: 2025 });
      expect(solar).toEqual({ day: 29, month: 1, year: 2025 });
    });

    it('converts Tết 2026 (Bính Ngọ)', () => {
      // 2026-02-17 is Mùng 1 Tết 2026
      const lunar = solarToLunar({ day: 17, month: 2, year: 2026 });
      expect(lunar).toEqual({
        day: 1,
        month: 1,
        year: 2026,
        isLeap: false,
      });

      const solar = lunarToSolar({ day: 1, month: 1, year: 2026 });
      expect(solar).toEqual({ day: 17, month: 2, year: 2026 });
    });
  });

  describe('Leap Month Handling (Năm Nhuận)', () => {
    it('accurately identifies 2023 has leap month 2 (Quý Mão)', () => {
      expect(isLeapLunarYear(2023)).toBe(true);
      expect(getLeapLunarMonth(2023)).toBe(2);
    });

    it('accurately distinguishes normal month 2 vs leap month 2 in 2023', () => {
      // 2023-02-20 was 01/02/2023 (regular month 2)
      const normalMonth = solarToLunar({ day: 20, month: 2, year: 2023 });
      expect(normalMonth).toEqual({
        day: 1,
        month: 2,
        year: 2023,
        isLeap: false,
      });

      // 2023-03-22 was 01/02/2023 (leap month 2)
      const leapMonth = solarToLunar({ day: 22, month: 3, year: 2023 });
      expect(leapMonth).toEqual({
        day: 1,
        month: 2,
        year: 2023,
        isLeap: true,
      });

      // Reversing leap month to solar
      const solarLeap = lunarToSolar({ day: 1, month: 2, year: 2023, isLeap: true });
      expect(solarLeap).toEqual({ day: 22, month: 3, year: 2023 });

      // Reversing regular month to solar
      const solarNormal = lunarToSolar({ day: 1, month: 2, year: 2023, isLeap: false });
      expect(solarNormal).toEqual({ day: 20, month: 2, year: 2023 });
    });

    it('identifies 2024 has no leap month', () => {
      expect(isLeapLunarYear(2024)).toBe(false);
      expect(getLeapLunarMonth(2024)).toBe(0);
    });
  });

  describe('Input formats', () => {
    it('accepts JavaScript Date object', () => {
      const jsDate = new Date(2024, 1, 10); // month is 0-indexed in JS Date: 1 = February
      const lunar = solarToLunar(jsDate);
      expect(lunar.day).toBe(1);
      expect(lunar.month).toBe(1);
      expect(lunar.year).toBe(2024);
    });
  });
});
