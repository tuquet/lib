import { solarToLunar, lunarToSolar } from './converter.js';
import { jdFromDate } from './astronomical.js';
import { type SolarDate, type LunarDate, DEFAULT_TIMEZONE } from './types.js';

function normalizeDate(input?: SolarDate | Date): SolarDate {
  if (!input) {
    const now = new Date();
    return {
      day: now.getDate(),
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    };
  }
  if (input instanceof Date) {
    return {
      day: input.getDate(),
      month: input.getMonth() + 1,
      year: input.getFullYear(),
    };
  }
  return input;
}

export interface UpcomingLunarOccurrence {
  solar: SolarDate;
  lunar: LunarDate;
  daysUntil: number;
}

/**
 * Calculates the difference in days between two solar dates.
 */
export function getDaysDiff(from: SolarDate, to: SolarDate): number {
  const jdFrom = jdFromDate(from.day, from.month, from.year);
  const jdTo = jdFromDate(to.day, to.month, to.year);
  return jdTo - jdFrom;
}

/**
 * Finds the next solar date for an annual lunar event (such as a death anniversary / Giỗ or Tết).
 * If the event has already passed in the current lunar year, it returns the occurrence in the next lunar year.
 */
export function getNextAnnualLunarDate(
  lunarDay: number,
  lunarMonth: number,
  fromDate?: SolarDate | Date,
  timeZone = DEFAULT_TIMEZONE
): UpcomingLunarOccurrence {
  const currentSolar = normalizeDate(fromDate);
  const currentLunar = solarToLunar(currentSolar, timeZone);

  // Try current lunar year first
  let targetLunarYear = currentLunar.year;
  let candidateSolar: SolarDate;

  try {
    candidateSolar = lunarToSolar(
      { day: lunarDay, month: lunarMonth, year: targetLunarYear },
      timeZone
    );
  } catch {
    candidateSolar = lunarToSolar(
      { day: lunarDay, month: lunarMonth, year: targetLunarYear + 1 },
      timeZone
    );
    targetLunarYear += 1;
  }

  let daysUntil = getDaysDiff(currentSolar, candidateSolar);

  // If candidate is in the past, take next lunar year
  if (daysUntil < 0) {
    targetLunarYear += 1;
    candidateSolar = lunarToSolar(
      { day: lunarDay, month: lunarMonth, year: targetLunarYear },
      timeZone
    );
    daysUntil = getDaysDiff(currentSolar, candidateSolar);
  }

  const targetLunar = solarToLunar(candidateSolar, timeZone);

  return {
    solar: candidateSolar,
    lunar: targetLunar,
    daysUntil,
  };
}

/**
 * Finds the next occurrence of a specific lunar day of any month (e.g. Mùng 1 or Rằm 15).
 */
export function getNextMonthlyLunarDay(
  targetDay: number,
  fromDate?: SolarDate | Date,
  timeZone = DEFAULT_TIMEZONE
): UpcomingLunarOccurrence {
  const currentSolar = normalizeDate(fromDate);
  const currentLunar = solarToLunar(currentSolar, timeZone);

  let currentMonth = currentLunar.month;
  let currentYear = currentLunar.year;

  // Search through upcoming months until we find the next occurrence in the future (daysUntil >= 0)
  for (let i = 0; i < 6; i++) {
    try {
      const candidateSolar = lunarToSolar(
        { day: targetDay, month: currentMonth, year: currentYear },
        timeZone
      );
      const daysUntil = getDaysDiff(currentSolar, candidateSolar);

      if (daysUntil >= 0) {
        const targetLunar = solarToLunar(candidateSolar, timeZone);
        return {
          solar: candidateSolar,
          lunar: targetLunar,
          daysUntil,
        };
      }
    } catch {
      // Month might not exist (e.g. leap month mismatch)
    }

    currentMonth++;
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear++;
    }
  }

  throw new Error(`Could not find next lunar day ${targetDay} within search horizon`);
}

/**
 * Finds the next "Ngày Rằm" (15th day of the lunar month).
 */
export function getNextFullMoon(
  fromDate?: SolarDate | Date,
  timeZone = DEFAULT_TIMEZONE
): UpcomingLunarOccurrence {
  return getNextMonthlyLunarDay(15, fromDate, timeZone);
}

/**
 * Finds the next "Mùng 1" (1st day of the lunar month).
 */
export function getNextNewMoon(
  fromDate?: SolarDate | Date,
  timeZone = DEFAULT_TIMEZONE
): UpcomingLunarOccurrence {
  return getNextMonthlyLunarDay(1, fromDate, timeZone);
}
