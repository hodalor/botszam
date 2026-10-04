/** Zambia is UTC+2 all year (no daylight saving). */
export const LUSAKA_OFFSET_MS = 2 * 60 * 60 * 1000;

/** Calendar parts of a moment as seen in Lusaka. */
export function lusakaParts(date = new Date()) {
  const local = new Date(date.getTime() + LUSAKA_OFFSET_MS);
  return { year: local.getUTCFullYear(), month: local.getUTCMonth(), day: local.getUTCDate() };
}

export function lusakaDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day) - LUSAKA_OFFSET_MS);
}

export function startOfLusakaDay(date = new Date()): Date {
  const { year, month, day } = lusakaParts(date);
  return lusakaDate(year, month, day);
}

export function startOfLusakaMonth(date = new Date()): Date {
  const { year, month } = lusakaParts(date);
  return lusakaDate(year, month, 1);
}

/** Parses "YYYY-MM-DD" as the start of that day in Lusaka. */
export function parseLusakaDay(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return lusakaDate(year, month - 1, day);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}
