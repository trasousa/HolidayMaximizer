// Supported countries cache
export interface Country {
  key: string; // ISO Code (e.g. DE)
  value: string; // Name (e.g. Germany)
}

// Interface for the raw API response
interface NagerCountry {
  countryCode: string;
  name: string;
}

let countryCache: Country[] = [];

/**
 * Fetches the list of available countries from Nager.Date API
 */
export const fetchSupportedCountries = async (): Promise<Country[]> => {
  if (countryCache.length > 0) return countryCache;

  try {
    const response = await fetch('https://date.nager.at/api/v3/AvailableCountries');
    if (!response.ok) throw new Error('Failed to fetch countries');
    
    const data: NagerCountry[] = await response.json();
    
    // Map the API response (countryCode, name) to our app's internal structure (key, value)
    countryCache = data.map(item => ({
      key: item.countryCode,
      value: item.name
    }));

    return countryCache;
  } catch (error) {
    console.error("Error fetching supported countries:", error);
    return [];
  }
};

/**
 * Attempts to find an ISO country code for a given string
 * Used as a fallback if the user typed a name manually without selecting from the list
 */
export const normalizeCountry = async (input: string): Promise<string> => {
  const countries = await fetchSupportedCountries();
  const normalizedInput = input.trim().toLowerCase();

  if (!countries.length) return 'DE'; // Fallback if fetch failed

  // 1. Try Exact Code Match (e.g. "DE")
  const codeMatch = countries.find(c => c.key.toLowerCase() === normalizedInput);
  if (codeMatch) return codeMatch.key;

  // 2. Try Exact Name Match
  const nameMatch = countries.find(c => c.value.toLowerCase() === normalizedInput);
  if (nameMatch) return nameMatch.key;

  // 3. Try Partial Match
  const partialMatch = countries.find(c => c.value.toLowerCase().includes(normalizedInput));
  if (partialMatch) return partialMatch.key;

  // Default to Germany (DE) or generic if unknown, to prevent app crash
  return 'DE'; 
};
