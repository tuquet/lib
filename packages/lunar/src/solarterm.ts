import { jdFromDate, sunLongitude } from './astronomical.js';
import { type SolarDate, DEFAULT_TIMEZONE } from './types.js';

export const SOLAR_TERMS = [
  'Xuân phân',
  'Thanh minh',
  'Cốc vũ',
  'Lập hạ',
  'Tiểu mãn',
  'Mang chủng',
  'Hạ chí',
  'Tiểu thử',
  'Đại thử',
  'Lập thu',
  'Xử thử',
  'Bạch lộ',
  'Thu phân',
  'Hàn lộ',
  'Sương giáng',
  'Lập đông',
  'Tiểu tuyết',
  'Đại tuyết',
  'Đông chí',
  'Tiểu hàn',
  'Đại hàn',
  'Lập xuân',
  'Vũ thủy',
  'Kinh trập',
] as const;

/**
 * Calculates the 24 Solar Terms (Tiết Khí) for a given date.
 */
export function getSolarTerm(
  date: SolarDate | Date,
  timeZone = DEFAULT_TIMEZONE
): (typeof SOLAR_TERMS)[number] {
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
  // True sun longitude at local midnight
  const L = sunLongitude(jd - 0.5 - timeZone / 24);
  const degrees = (L * 180) / Math.PI;
  const termIndex = Math.floor(degrees / 15) % 24;

  return SOLAR_TERMS[termIndex];
}
