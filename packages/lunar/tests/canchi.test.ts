import { describe, it, expect } from 'vitest';
import { getCanChiYear, getCanChiMonth, getCanChiDay, getCanChiHour } from '../src/canchi.js';

describe('Can Chi calculations', () => {
  describe('getCanChiYear', () => {
    it('calculates 2024 as Giáp Thìn (Rồng)', () => {
      const result = getCanChiYear(2024);
      expect(result.full).toBe('Giáp Thìn');
      expect(result.animal).toBe('Rồng');
    });

    it('calculates 2025 as Ất Tỵ (Rắn)', () => {
      const result = getCanChiYear(2025);
      expect(result.full).toBe('Ất Tỵ');
      expect(result.animal).toBe('Rắn');
    });

    it('calculates 2026 as Bính Ngọ (Ngựa)', () => {
      const result = getCanChiYear(2026);
      expect(result.full).toBe('Bính Ngọ');
      expect(result.animal).toBe('Ngựa');
    });
  });

  describe('getCanChiDay', () => {
    it('calculates 2024-02-10 as Giáp Thìn', () => {
      const result = getCanChiDay({ day: 10, month: 2, year: 2024 });
      expect(result.full).toBe('Giáp Thìn');
    });
  });

  describe('getCanChiMonth', () => {
    it('calculates month Can Chi correctly for year Giáp Thìn', () => {
      // Năm Giáp: Tháng 1 là Bính Dần
      const month1 = getCanChiMonth(1, 2024);
      expect(month1.full).toBe('Bính Dần');

      // Tháng 2 là Đinh Mão
      const month2 = getCanChiMonth(2, 2024);
      expect(month2.full).toBe('Đinh Mão');
    });
  });

  describe('getCanChiHour', () => {
    it('calculates hour Can Chi for day Giáp', () => {
      const dayCanChi = { can: 'Giáp', chi: 'Thìn', full: 'Giáp Thìn' };
      // 00:00 is Giờ Tý -> Giáp Tý
      const hour0 = getCanChiHour(0, dayCanChi);
      expect(hour0.full).toBe('Giáp Tý');

      // 02:00 is Giờ Sửu -> Ất Sửu
      const hour2 = getCanChiHour(2, dayCanChi);
      expect(hour2.full).toBe('Ất Sửu');
    });
  });
});
