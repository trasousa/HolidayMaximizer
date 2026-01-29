import { useCallback, useEffect, useState } from 'react';
import { Profile, UserSettings } from '@/lib/types';
import { getPublicHolidays } from '@/lib/services/holidayService';
import { normalizeCountry } from '@/lib/services/locationService';
import { generateSmartSuggestions } from '@/lib/services/optimizationService';

type HydrationStatus = 'idle' | 'loading' | 'success' | 'error';

export interface HydrationEntry {
  status: HydrationStatus;
  holidays: Profile['holidays'];
  suggestions: Profile['suggestions'];
  isoCountryCode?: string;
  error?: string;
}

type HydrationMap = Record<string, HydrationEntry>;

const defaultEntry: HydrationEntry = {
  status: 'idle',
  holidays: [],
  suggestions: [],
};

export const useProfileHydration = (settings: UserSettings) => {
  const [hydration, setHydration] = useState<HydrationMap>({});

  useEffect(() => {
    setHydration({});
  }, [settings.year]);

  const hydrateProfile = useCallback(
    async (profile: Profile) => {
      setHydration((prev) => ({
        ...prev,
        [profile.id]: { ...prev[profile.id], status: 'loading', error: undefined, holidays: prev[profile.id]?.holidays ?? [], suggestions: prev[profile.id]?.suggestions ?? [] },
      }));

      try {
        const isoCode = profile.isoCountryCode ?? (await normalizeCountry(profile.country));
        const holidays = await getPublicHolidays(settings.year, isoCode, profile.isoRegionCode);
        const suggestions = generateSmartSuggestions(settings, holidays);
        setHydration((prev) => ({
          ...prev,
          [profile.id]: {
            status: 'success',
            holidays,
            suggestions,
            isoCountryCode: isoCode,
          },
        }));
        return { holidays, suggestions, isoCode };
      } catch (error) {
        setHydration((prev) => ({
          ...prev,
          [profile.id]: {
            status: 'error',
            holidays: [],
            suggestions: [],
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        }));
        throw error;
      }
    },
    [settings]
  );

  const resetProfileHydration = useCallback((profileId: string) => {
    setHydration((prev) => ({
      ...prev,
      [profileId]: defaultEntry,
    }));
  }, []);

  return { hydration, hydrateProfile, resetProfileHydration };
};
