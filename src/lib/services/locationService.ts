export interface Country {
  key: string;
  value: string;
}

export interface CountryRegion {
  key: string;
  value: string;
}

interface NagerCountry {
  countryCode: string;
  name: string;
}

let countryCache: Country[] | null = null;
const regionCache = new Map<string, CountryRegion[]>();

export const fetchSupportedCountries = async (): Promise<Country[]> => {
  if (countryCache) return countryCache;
  const response = await fetch('https://date.nager.at/api/v3/AvailableCountries');
  if (!response.ok) {
    throw new Error('Unable to load country list');
  }
  const data: NagerCountry[] = await response.json();
  countryCache = data.map((item) => ({ key: item.countryCode, value: item.name })).sort((a, b) => a.value.localeCompare(b.value));
  return countryCache;
};

export const normalizeCountry = async (input: string): Promise<string> => {
  const countries = await fetchSupportedCountries();
  const normalized = input.trim().toLowerCase();
  const exactCode = countries.find((c) => c.key.toLowerCase() === normalized);
  if (exactCode) return exactCode.key;
  const exactName = countries.find((c) => c.value.toLowerCase() === normalized);
  if (exactName) return exactName.key;
  const partial = countries.find((c) => c.value.toLowerCase().includes(normalized));
  return partial?.key ?? 'DE';
};

export const clearCountryCache = () => {
  countryCache = null;
};

export const fetchCountryRegions = async (countryCode: string): Promise<CountryRegion[]> => {
  if (regionCache.has(countryCode)) {
    return regionCache.get(countryCode)!;
  }
  const response = await fetch(`https://date.nager.at/api/v3/CountryInfo/${countryCode}`);
  if (!response.ok) {
    regionCache.set(countryCode, []);
    return [];
  }
  const data = await response.json();
  const regions: CountryRegion[] = (data.counties ?? []).map((county: { code: string; name: string }) => ({
    key: county.code,
    value: county.name,
  }));
  regionCache.set(countryCode, regions);
  return regions;
};

export const clearRegionCache = () => {
  regionCache.clear();
};
