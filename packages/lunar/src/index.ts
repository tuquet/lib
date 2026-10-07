import { solarToLunar } from './converter.js';
import { getCanChiYear, getCanChiMonth, getCanChiDay } from './canchi.js';
import { getSolarTerm } from './solarterm.js';
import { type SolarDate, type FullLunarInfo, DEFAULT_TIMEZONE } from './types.js';

export * from './types.js';
export * from './astronomical.js';
export * from './converter.js';
export * from './canchi.js';
export * from './recurrence.js';
export * from './solarterm.js';

/**
 * Returns comprehensive lunar, solar, Can Chi, and solar term information for a given date.
 */
export function getFullLunarDate(
  date: SolarDate | Date,
  timeZone = DEFAULT_TIMEZONE
): FullLunarInfo {
  let solar: SolarDate;
  if (date instanceof Date) {
    solar = {
      day: date.getDate(),
      month: date.getMonth() + 1,
      year: date.getFullYear(),
    };
  } else {
    solar = date;
  }

  const lunar = solarToLunar(solar, timeZone);
  const canChiYear = getCanChiYear(lunar.year);
  const canChiMonth = getCanChiMonth(lunar.month, lunar.year);
  const canChiDay = getCanChiDay(solar);
  const solarTerm = getSolarTerm(solar, timeZone);

  return {
    solar,
    lunar,
    canChiYear,
    canChiMonth,
    canChiDay,
    solarTerm,
  };
}
