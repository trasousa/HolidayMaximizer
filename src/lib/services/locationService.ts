import { HolidaySource } from '@/lib/types';
import { cached, DAY } from './cache';
import {
  fetchNagerCountries,
  fetchNagerRegions,
  fetchOpenHolidaysCountries,
  fetchOpenHolidaysRegions,
  RawRegion,
} from './holidayProviders';

export interface Country {
  key: string;
  value: string;
  sources: HolidaySource[];
  /** Official languages (from OpenHolidays), used to show local holiday names. */
  languages: string[];
}

export type CountryRegion = RawRegion;

export interface RegionResult {
  source: HolidaySource;
  regions: CountryRegion[];
}

const LOCATION_TTL = 30 * DAY;

const safe = async <T>(promise: Promise<T>, fallback: T) => {
  try {
    return await promise;
  } catch {
    return fallback;
  }
};

export const fetchSupportedCountries = async (): Promise<Country[]> => {
  const { value } = await cached('countries:v2', LOCATION_TTL, async () => {
    const [open, nager] = await Promise.all([safe(fetchOpenHolidaysCountries(), []), safe(fetchNagerCountries(), [])]);
    if (open.length === 0 && nager.length === 0) throw new Error('Unable to load country list');
    const merged = new Map<string, Country>();
    nager.forEach((c) => merged.set(c.key, { key: c.key, value: c.value, sources: ['nager'], languages: [] }));
    open.forEach((c) => {
      const existing = merged.get(c.key);
      merged.set(c.key, {
        key: c.key,
        value: existing?.value ?? c.value,
        sources: ['openholidays', ...(existing?.sources ?? [])],
        languages: c.languages,
      });
    });
    return [...merged.values()].sort((a, b) => a.value.localeCompare(b.value));
  });
  return value;
};

export const findCountry = async (countryCode?: string) => {
  if (!countryCode) return undefined;
  const countries = await fetchSupportedCountries().catch(() => []);
  return countries.find((c) => c.key === countryCode);
};

/**
 * Regions for a country, preferring OpenHolidays (finer-grained, down to municipalities)
 * and falling back to Nager.Date's states/provinces.
 */
export const fetchCountryRegions = async (countryCode: string): Promise<RegionResult> => {
  const country = await findCountry(countryCode);
  const sources = country?.sources ?? ['nager'];

  if (sources.includes('openholidays')) {
    const open = await safe(cached(`regions:openholidays:${countryCode}`, LOCATION_TTL, () => fetchOpenHolidaysRegions(countryCode)), null);
    if (open && (open.value.length > 0 || !sources.includes('nager'))) {
      return { source: 'openholidays', regions: open.value };
    }
  }
  const nager = await safe(cached(`regions:nager:${countryCode}`, LOCATION_TTL, () => fetchNagerRegions(countryCode)), null);
  return { source: 'nager', regions: nager?.value ?? [] };
};

export const normalizeCountry = async (input: string): Promise<string> => {
  const countries = await fetchSupportedCountries();
  const normalized = input.trim().toLowerCase();
  const match =
    countries.find((c) => c.key.toLowerCase() === normalized) ??
    countries.find((c) => c.value.toLowerCase() === normalized) ??
    countries.find((c) => c.value.toLowerCase().includes(normalized));
  if (!match) throw new Error(`Unknown country "${input}"`);
  return match.key;
};
