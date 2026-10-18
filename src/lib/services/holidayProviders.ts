/**
 * Raw API clients + parsers for the two public-holiday providers.
 *
 * - OpenHolidays API (https://openholidaysapi.org): open data, hierarchical
 *   subdivisions down to municipality level for several countries
 *   (e.g. Portuguese municipal holidays such as Lisbon's Santo António).
 * - Nager.Date (https://date.nager.at): ~120 countries, state/province level.
 */
import { addDaysISO } from '@/lib/utils/date';

export const OPENHOLIDAYS_URL = 'https://openholidaysapi.org';
export const NAGER_URL = 'https://date.nager.at/api/v3';

/** Provider-agnostic holiday record: `regions` is empty for nationwide holidays. */
export interface RawHoliday {
  date: string;
  name: string;
  localName?: string;
  regions: string[];
}

export interface RawRegion {
  key: string;
  value: string;
  category?: string;
  parent?: string;
}

interface LocalizedText {
  language: string;
  text: string;
}

const pickText = (texts: LocalizedText[] | undefined, language = 'EN') =>
  texts?.find((t) => t.language?.toUpperCase() === language)?.text ?? texts?.[0]?.text ?? '';

const getJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Request failed (${response.status}) for ${url}`);
  return response.json() as Promise<T>;
};

// ---------- OpenHolidays ----------

interface OHCountry {
  isoCode: string;
  name: LocalizedText[];
  officialLanguages?: string[];
}

interface OHSubdivision {
  code: string;
  shortName?: string;
  name: LocalizedText[];
  category?: LocalizedText[];
  children?: OHSubdivision[];
}

interface OHHoliday {
  startDate: string;
  endDate: string;
  type: string;
  name: LocalizedText[];
  nationwide: boolean;
  subdivisions?: { code: string; shortName?: string }[];
}

export const fetchOpenHolidaysCountries = async () => {
  const data = await getJson<OHCountry[]>(`${OPENHOLIDAYS_URL}/Countries?languageIsoCode=EN`);
  return data.map((c) => ({ key: c.isoCode, value: pickText(c.name), languages: c.officialLanguages ?? [] }));
};

export const flattenSubdivisions = (nodes: OHSubdivision[], parent?: string): RawRegion[] =>
  nodes.flatMap((node) => {
    const value = pickText(node.name);
    const self: RawRegion = { key: node.code, value, category: pickText(node.category) || undefined, parent };
    return [self, ...flattenSubdivisions(node.children ?? [], value)];
  });

export const fetchOpenHolidaysRegions = async (countryCode: string): Promise<RawRegion[]> => {
  const data = await getJson<OHSubdivision[]>(`${OPENHOLIDAYS_URL}/Subdivisions?countryIsoCode=${countryCode}&languageIsoCode=EN`);
  return flattenSubdivisions(data);
};

export const parseOpenHolidays = (data: OHHoliday[], localLanguage?: string): RawHoliday[] =>
  data
    .filter((h) => h.type === 'Public')
    .flatMap((h) => {
      const name = pickText(h.name, 'EN');
      const localName = localLanguage ? pickText(h.name, localLanguage) : undefined;
      const regions = h.nationwide ? [] : (h.subdivisions ?? []).map((s) => s.code);
      const days: RawHoliday[] = [];
      // Multi-day holidays are expanded into one entry per date.
      for (let date = h.startDate; date <= (h.endDate || h.startDate); date = addDaysISO(date, 1)) {
        days.push({ date, name, localName: localName && localName !== name ? localName : undefined, regions });
      }
      return days;
    });

export const fetchOpenHolidays = async (year: number, countryCode: string, localLanguage?: string): Promise<RawHoliday[]> => {
  // No language filter: the API then returns every translation, so we get both English and local names.
  const data = await getJson<OHHoliday[]>(
    `${OPENHOLIDAYS_URL}/PublicHolidays?countryIsoCode=${countryCode}&validFrom=${year}-01-01&validTo=${year}-12-31`
  );
  return parseOpenHolidays(data, localLanguage);
};

// ---------- Nager.Date ----------

interface NagerHoliday {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
  global?: boolean;
  counties?: string[] | null;
  types?: string[];
}

export const fetchNagerCountries = async () => {
  const data = await getJson<{ countryCode: string; name: string }[]>(`${NAGER_URL}/AvailableCountries`);
  return data.map((c) => ({ key: c.countryCode, value: c.name }));
};

export const fetchNagerRegions = async (countryCode: string): Promise<RawRegion[]> => {
  const data = await getJson<{ counties?: { code: string; name: string }[] | null }>(`${NAGER_URL}/CountryInfo/${countryCode}`);
  return (data.counties ?? []).map((county) => ({ key: county.code, value: county.name }));
};

/** Day-off types: "Public" and "Bank" (offices closed). Observances, optional and school days are skipped. */
const NAGER_DAY_OFF_TYPES = ['Public', 'Bank'];

export const parseNagerHolidays = (data: NagerHoliday[]): RawHoliday[] =>
  data
    .filter((h) => !h.types || h.types.some((t) => NAGER_DAY_OFF_TYPES.includes(t)))
    .filter((h) => h.global !== false || (h.counties?.length ?? 0) > 0)
    .map((h) => ({
      date: h.date,
      name: h.name,
      localName: h.localName && h.localName !== h.name ? h.localName : undefined,
      regions: h.global === false || h.counties?.length ? h.counties ?? [] : [],
    }));

export const fetchNagerHolidays = async (year: number, countryCode: string): Promise<RawHoliday[]> => {
  const response = await fetch(`${NAGER_URL}/PublicHolidays/${year}/${countryCode}`);
  // 204 / 404: the provider has no data for that year.
  if (response.status === 204 || response.status === 404) return [];
  if (!response.ok) throw new Error(`Unable to fetch public holidays (${response.status})`);
  return parseNagerHolidays(await response.json());
};

// ---------- Shared ----------

/**
 * A holiday applies when it is nationwide, or when the selected region equals one
 * of its subdivisions or sits underneath it (e.g. municipality `PT-LI-LI` is inside
 * district `PT-LI`).
 */
export const appliesToRegion = (holiday: RawHoliday, regionCode?: string) => {
  if (holiday.regions.length === 0) return true;
  if (!regionCode) return false;
  return holiday.regions.some((code) => regionCode === code || regionCode.startsWith(`${code}-`));
};
