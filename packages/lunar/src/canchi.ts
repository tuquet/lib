import { jdFromDate } from './astronomical.js';
import { type CanChi, type SolarDate } from './types.js';

export const CANS = [
  'Giáp',
  'Ất',
  'Bính',
  'Đinh',
  'Mậu',
  'Kỷ',
  'Canh',
  'Tân',
  'Nhâm',
  'Quý',
] as const;

export const CHIS = [
  'Tý',
  'Sửu',
  'Dần',
  'Mão',
  'Thìn',
  'Tỵ',
  'Ngọ',
  'Mùi',
  'Thân',
  'Dậu',
  'Tuất',
  'Hợi',
] as const;

export const ANIMALS = [
  'Chuột',
  'Trâu',
  'Hổ',
  'Mèo',
  'Rồng',
  'Rắn',
  'Ngựa',
  'Dê',
  'Khỉ',
  'Gà',
  'Chó',
  'Lợn',
] as const;

/**
 * Calculates Can Chi for a given Lunar Year.
 */
export function getCanChiYear(lunarYear: number): CanChi & { animal: string } {
  const canIndex = (lunarYear + 6) % 10;
  const chiIndex = (lunarYear + 8) % 12;

  const can = CANS[canIndex];
  const chi = CHIS[chiIndex];
  const animal = ANIMALS[chiIndex];

  return {
    can,
    chi,
    full: `${can} ${chi}`,
    animal,
  };
}

/**
 * Calculates Can Chi for a given Lunar Month.
 */
export function getCanChiMonth(lunarMonth: number, lunarYear: number): CanChi {
  const canYearIndex = (lunarYear + 6) % 10;
  // Quy tắc ngũ hổ độn xác định Can của tháng Giêng (tháng 1 là Dần):
  // Giáp/Kỷ -> Bính Dần (2)
  // Ất/Canh -> Mậu Dần (4)
  // Bính/Tân -> Canh Dần (6)
  // Đinh/Nhâm -> Nhâm Dần (8)
  // Mậu/Quý -> Giáp Dần (0)
  const baseCan = ((canYearIndex % 5) * 2 + 2) % 10;
  const canIndex = (baseCan + lunarMonth - 1) % 10;
  const chiIndex = (lunarMonth + 1) % 12; // Tháng 1 = Dần (2), Tháng 11 = Tý (0), Tháng 12 = Sửu (1)

  const can = CANS[canIndex];
  const chi = CHIS[chiIndex];

  return {
    can,
    chi,
    full: `${can} ${chi}`,
  };
}

/**
 * Calculates Can Chi for a given Solar Date.
 */
export function getCanChiDay(date: SolarDate | Date): CanChi {
  let day: number;
  let month: number;
  let year: number;

  if (date instanceof Date) {
    day = date.getDate();
    month = date.getMonth() + 1;
    year = date.getFullYear();
  } else {
    day = date.day;
    month = date.month;
    year = date.year;
  }

  const jd = jdFromDate(day, month, year);
  const canIndex = (jd + 9) % 10;
  const chiIndex = (jd + 1) % 12;

  const can = CANS[canIndex];
  const chi = CHIS[chiIndex];

  return {
    can,
    chi,
    full: `${can} ${chi}`,
  };
}

/**
 * Calculates Can Chi for a given Hour (0..23) on a specific day.
 */
export function getCanChiHour(hour: number, dayCanChi: CanChi): CanChi {
  // Giờ Tý: 23:00 - 00:59 (chi 0)
  // Giờ Sửu: 01:00 - 02:59 (chi 1) ...
  const chiIndex = Math.floor((hour + 1) / 2) % 12;

  const canDayIndex = CANS.indexOf(dayCanChi.can as (typeof CANS)[number]);
  // Quy tắc ngũ thử độn xác định Can của giờ Tý:
  const baseCan = ((canDayIndex % 5) * 2) % 10;
  const canIndex = (baseCan + chiIndex) % 10;

  const can = CANS[canIndex];
  const chi = CHIS[chiIndex];

  return {
    can,
    chi,
    full: `${can} ${chi}`,
  };
}
