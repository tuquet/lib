export interface SolarDate {
  day: number;
  month: number;
  year: number;
}

export interface LunarDate {
  day: number;
  month: number;
  year: number;
  isLeap: boolean;
}

export interface CanChi {
  can: string;
  chi: string;
  full: string;
}

export interface FullLunarInfo {
  solar: SolarDate;
  lunar: LunarDate;
  canChiYear: CanChi;
  canChiMonth: CanChi;
  canChiDay: CanChi;
  solarTerm: string;
}

export type TimeZone = number;
export const DEFAULT_TIMEZONE: TimeZone = 7.0; // Vietnam Time (UTC+7)
