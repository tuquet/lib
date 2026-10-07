import {
  INT,
  jdFromDate,
  jdToDate,
  getNewMoonDay,
  getLunarMonth11,
  getLeapMonthOffset,
} from './astronomical.js';
import { type SolarDate, type LunarDate, DEFAULT_TIMEZONE } from './types.js';

/**
 * Normalizes input date into { day, month, year }.
 */
function normalizeSolarInput(date: SolarDate | Date): SolarDate {
  if (date instanceof Date) {
    return {
      day: date.getDate(),
      month: date.getMonth() + 1,
      year: date.getFullYear(),
    };
  }
  return date;
}

/**
 * Converts a Gregorian solar date to the corresponding Vietnamese lunar date.
 */
export function solarToLunar(date: SolarDate | Date, timeZone = DEFAULT_TIMEZONE): LunarDate {
  const { day, month, year } = normalizeSolarInput(date);
  const dayNumber = jdFromDate(day, month, year);
  const k = INT((dayNumber - 2415021.076998695) / 29.530588853);

  let monthStart = getNewMoonDay(k + 1, timeZone);
  if (monthStart > dayNumber) {
    monthStart = getNewMoonDay(k, timeZone);
  }

  let a11 = getLunarMonth11(year, timeZone);
  let b11 = a11;
  let lunarYear: number;

  if (a11 >= monthStart) {
    lunarYear = year;
    a11 = getLunarMonth11(year - 1, timeZone);
  } else {
    lunarYear = year + 1;
    b11 = getLunarMonth11(year + 1, timeZone);
  }

  const lunarDay = dayNumber - monthStart + 1;
  const diff = INT((monthStart - a11) / 29);
  let lunarLeap = 0;
  let lunarMonth = diff + 11;

  if (b11 - a11 > 365) {
    const leapMonthDiff = getLeapMonthOffset(a11, timeZone);
    if (diff >= leapMonthDiff) {
      lunarMonth = diff + 10;
      if (diff === leapMonthDiff) {
        lunarLeap = 1;
      }
    }
  }

  if (lunarMonth > 12) {
    lunarMonth = lunarMonth - 12;
  }

  if (lunarMonth >= 11 && diff < 4) {
    lunarYear -= 1;
  }

  return {
    day: lunarDay,
    month: lunarMonth,
    year: lunarYear,
    isLeap: lunarLeap === 1,
  };
}

/**
 * Converts a Vietnamese lunar date back to the Gregorian solar date.
 */
export function lunarToSolar(
  lunar: { day: number; month: number; year: number; isLeap?: boolean },
  timeZone = DEFAULT_TIMEZONE
): SolarDate {
  const { day: lunarDay, month: lunarMonth, year: lunarYear, isLeap = false } = lunar;
  let a11: number;
  let b11: number;

  if (lunarMonth < 11) {
    a11 = getLunarMonth11(lunarYear - 1, timeZone);
    b11 = getLunarMonth11(lunarYear, timeZone);
  } else {
    a11 = getLunarMonth11(lunarYear, timeZone);
    b11 = getLunarMonth11(lunarYear + 1, timeZone);
  }

  const k = INT(0.5 + (a11 - 2415021.076998695) / 29.530588853);
  let off = lunarMonth - 11;
  if (off < 0) {
    off += 12;
  }

  if (b11 - a11 > 365) {
    const leapOff = getLeapMonthOffset(a11, timeZone);
    let leapMonth = leapOff - 2;
    if (leapMonth < 0) {
      leapMonth += 12;
    }

    if (isLeap && lunarMonth !== leapMonth) {
      throw new Error(`Lunar month ${lunarMonth}/${lunarYear} does not have a leap month`);
    } else if (isLeap || off >= leapOff) {
      off += 1;
    }
  } else if (isLeap) {
    throw new Error(`Lunar year ${lunarYear} does not have any leap month`);
  }

  const monthStart = getNewMoonDay(k + off, timeZone);
  const [day, month, year] = jdToDate(monthStart + lunarDay - 1);

  return { day, month, year };
}

/**
 * Checks if a given lunar year contains a leap month.
 */
export function isLeapLunarYear(lunarYear: number, timeZone = DEFAULT_TIMEZONE): boolean {
  const a11 = getLunarMonth11(lunarYear - 1, timeZone);
  const b11 = getLunarMonth11(lunarYear, timeZone);
  return b11 - a11 > 365;
}

/**
 * Returns the leap month number (1..12) for a given lunar year, or 0 if none.
 */
export function getLeapLunarMonth(lunarYear: number, timeZone = DEFAULT_TIMEZONE): number {
  const a11 = getLunarMonth11(lunarYear - 1, timeZone);
  const b11 = getLunarMonth11(lunarYear, timeZone);
  if (b11 - a11 <= 365) return 0;

  const leapOff = getLeapMonthOffset(a11, timeZone);
  let leapMonth = leapOff - 2;
  if (leapMonth < 0) {
    leapMonth += 12;
  }
  return leapMonth;
}
