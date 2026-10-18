import { CustomHoliday, Holiday, HolidaySource } from '@/lib/types';
import { cached, DAY } from './cache';
import { appliesToRegion, fetchNagerHolidays, fetchOpenHolidays, RawHoliday } from './holidayProviders';
import { findCountry } from './locationService';

/** Holiday data is refreshed weekly so late government announcements show up. */
const HOLIDAY_TTL = 7 * DAY;

export interface HolidayQuery {
  year: number;
  countryCode: string;
  regionCode?: string;
  source?: HolidaySource;
  force?: boolean;
}

export interface HolidayResult {
  holidays: Holiday[];
  source: HolidaySource;
  fetchedAt: number;
  /** Set when the data could not be refreshed or a fallback provider was used. */
  warning?: string;
}

const fetchRaw = async (source: HolidaySource, year: number, countryCode: string, force?: boolean) => {
  if (source === 'openholidays') {
    const country = await findCountry(countryCode);
    const localLanguage = country?.languages.find((lang) => lang.toUpperCase() !== 'EN');
    return cached(`holidays:openholidays:${countryCode}:${year}`, HOLIDAY_TTL, () => fetchOpenHolidays(year, countryCode, localLanguage), { force });
  }
  return cached(`holidays:nager:${countryCode}:${year}`, HOLIDAY_TTL, () => fetchNagerHolidays(year, countryCode), { force });
};

/** Several holidays can fall on the same date; keep one entry per day. */
export const mergeByDate = (holidays: Holiday[]): Holiday[] => {
  const byDate = new Map<string, Holiday>();
  holidays.forEach((holiday) => {
    const existing = byDate.get(holiday.date);
    if (!existing) {
      byDate.set(holiday.date, { ...holiday });
      return;
    }
    if (!existing.name.split(' / ').includes(holiday.name)) existing.name = `${existing.name} / ${holiday.name}`;
    // A day off nationwide wins over a regional/custom label.
    if (holiday.scope === 'national') existing.scope = 'national';
  });
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
};

const toHoliday = (raw: RawHoliday, countryCode: string): Holiday => ({
  date: raw.date,
  name: raw.name,
  localName: raw.localName,
  countryCode,
  regions: raw.regions,
  scope: raw.regions.length > 0 ? 'regional' : 'national',
});

export const getPublicHolidays = async ({ year, countryCode, regionCode, source = 'nager', force }: HolidayQuery): Promise<HolidayResult> => {
  let usedSource = source;
  let warning: string | undefined;
  let result;
  try {
    result = await fetchRaw(source, year, countryCode, force);
  } catch (error) {
    if (source !== 'openholidays') throw error;
    // OpenHolidays unavailable and nothing cached: fall back to national data from Nager.Date.
    result = await fetchRaw('nager', year, countryCode, force);
    usedSource = 'nager';
    regionCode = undefined;
    warning = 'Regional holiday provider unavailable – showing national holidays only.';
  }
  if (result.stale) {
    warning = `Offline – using holidays saved on ${new Date(result.fetchedAt).toLocaleDateString()}.`;
  }

  const holidays = mergeByDate(result.value.filter((h) => appliesToRegion(h, regionCode)).map((h) => toHoliday(h, countryCode)));
  return { holidays, source: usedSource, fetchedAt: result.fetchedAt, warning };
};

const isLeapYear = (year: number) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

/** Materialize a profile's custom holidays for one year. */
export const customHolidaysForYear = (custom: CustomHoliday[] = [], year: number): Holiday[] =>
  custom
    .map((entry) => (entry.recurring ? { ...entry, date: `${year}${entry.date.slice(4)}` } : entry))
    .filter((entry) => entry.date.startsWith(`${year}-`) && !(entry.date.endsWith('-02-29') && !isLeapYear(year)))
    .map((entry) => ({ date: entry.date, name: entry.name, scope: 'custom' as const }));
