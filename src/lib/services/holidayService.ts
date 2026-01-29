import { Holiday } from '@/lib/types';

const BASE_URL = 'https://date.nager.at/api/v3';
const cache = new Map<string, Holiday[]>();

const cacheKey = (year: number, countryCode: string, regionCode?: string) => `${year}-${countryCode}-${regionCode ?? 'all'}`;

export const getPublicHolidays = async (year: number, countryCode: string, regionCode?: string): Promise<Holiday[]> => {
  const key = cacheKey(year, countryCode, regionCode);
  if (cache.has(key)) {
    return cache.get(key)!;
  }
  const response = await fetch(`${BASE_URL}/PublicHolidays/${year}/${countryCode}`);
  if (!response.ok) {
    throw new Error('Unable to fetch public holidays');
  }
  const data: any[] = await response.json();
  const filtered = data.filter((holiday) => {
    if (!holiday.counties || holiday.counties.length === 0) return true;
    if (!regionCode) return false;
    return holiday.counties.includes(regionCode);
  });
  const normalized: Holiday[] = filtered.map((holiday) => ({
    date: holiday.date,
    name: holiday.name,
    localName: holiday.localName,
    countryCode: holiday.countryCode,
    counties: holiday.counties,
    scope: holiday.counties && holiday.counties.length > 0 ? 'regional' : 'national',
  }));
  cache.set(key, normalized);
  return normalized;
};

export const clearHolidayCache = () => cache.clear();
