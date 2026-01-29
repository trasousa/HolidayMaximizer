import { Holiday } from "../types";

const BASE_URL = "https://date.nager.at/api/v3";

export const getPublicHolidays = async (year: number, countryCode: string, regionCode?: string): Promise<Holiday[]> => {
  try {
    const response = await fetch(`${BASE_URL}/PublicHolidays/${year}/${countryCode}`);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data: any[] = await response.json();

    // Transform and Filter
    // If regionCode is provided (e.g., DE-BE), we include holidays that are:
    // 1. National (counties is null)
    // 2. Specific to this region (counties includes regionCode)
    const filtered = data.filter(h => {
        if (!h.counties) return true; // National holiday
        if (regionCode && h.counties.includes(regionCode)) return true; // Regional match
        return false; // Regional holiday for somewhere else
    });

    return filtered.map(h => ({
      date: h.date,
      name: h.name,
      localName: h.localName,
      countryCode: h.countryCode,
      counties: h.counties
    }));

  } catch (error) {
    console.error("Failed to fetch public holidays:", error);
    return [];
  }
};
