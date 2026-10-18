/**
 * Calendar-date helpers that work on ISO `yyyy-MM-dd` strings.
 *
 * All arithmetic is done in UTC so results never depend on the browser's
 * time zone or DST transitions (mixing `new Date('2026-01-05')`, which is UTC,
 * with local getters such as `getDay()` shifts dates by one day west of UTC).
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export const DEFAULT_WEEKEND = [0, 6];

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const toUTC = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};

const fromUTC = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export const isoDate = (year: number, monthIndex: number, day: number) =>
  `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

export const todayISO = () => {
  const now = new Date();
  return isoDate(now.getFullYear(), now.getMonth(), now.getDate());
};

export const addDaysISO = (iso: string, days: number) => fromUTC(toUTC(iso) + days * DAY_MS);

export const dayOfWeek = (iso: string) => new Date(toUTC(iso)).getUTCDay();

export const diffDays = (from: string, to: string) => Math.round((toUTC(to) - toUTC(from)) / DAY_MS);

export const yearOf = (iso: string) => Number(iso.slice(0, 4));

export const isWeekendDay = (iso: string, weekendDays: number[] = DEFAULT_WEEKEND) => weekendDays.includes(dayOfWeek(iso));

/** Every date from `start` to `end`, inclusive. Swaps the bounds when reversed. */
export const eachDate = (start: string, end: string): string[] => {
  const [from, to] = start <= end ? [start, end] : [end, start];
  const dates: string[] = [];
  for (let cursor = from; cursor <= to; cursor = addDaysISO(cursor, 1)) {
    dates.push(cursor);
  }
  return dates;
};

/** Clamp a range to a calendar year; returns null when it lies outside. */
export const clampToYear = (start: string, end: string, year: number): [string, string] | null => {
  const from = start > `${year}-01-01` ? start : `${year}-01-01`;
  const to = end < `${year}-12-31` ? end : `${year}-12-31`;
  return from <= to ? [from, to] : null;
};

export const countBusinessDays = (
  start: string,
  end: string,
  holidayDates: Set<string>,
  weekendDays: number[] = DEFAULT_WEEKEND
): number => eachDate(start, end).filter((date) => !isWeekendDay(date, weekendDays) && !holidayDates.has(date)).length;

export const countTotalDays = (start: string, end: string): number => Math.abs(diffDays(start, end)) + 1;

export const formatDay = (iso: string) => {
  const [, m, d] = iso.split('-').map(Number);
  return `${MONTHS_SHORT[m - 1]} ${d}`;
};

export const formatLongDay = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${WEEKDAYS_SHORT[dayOfWeek(iso)]}, ${MONTHS_SHORT[m - 1]} ${d} ${y}`;
};

export const formatShortRange = (start: string, end: string) =>
  start === end ? formatDay(start) : `${formatDay(start)} – ${formatDay(end)}`;

export const weekdayLabel = (day: number) => WEEKDAYS_SHORT[day];
