import { useCallback, useMemo, useState } from 'react';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { Holiday, Profile } from '@/lib/types';
import { customHolidaysForYear, getPublicHolidays, HolidayResult, mergeByDate } from '@/lib/services/holidayService';
import { normalizeCountry } from '@/lib/services/locationService';

const holidayKey = (profile: Profile, year: number) =>
  ['holidays', profile.holidaySource ?? 'nager', profile.isoCountryCode ?? profile.country, profile.isoRegionCode ?? '', year] as const;

const fetchFor = async (profile: Profile, year: number, force = false): Promise<HolidayResult> => {
  const countryCode = profile.isoCountryCode ?? (await normalizeCountry(profile.country));
  return getPublicHolidays({
    year,
    countryCode,
    regionCode: profile.isoRegionCode,
    source: profile.holidaySource ?? 'nager',
    force,
  });
};

export interface ProfileHolidays {
  /** Public + custom holidays of the planning year. */
  holidays: Holiday[];
  /** Planning year plus its neighbours, so the optimizer can bridge across New Year. */
  extendedHolidays: Holiday[];
  isLoading: boolean;
  error?: string;
  meta?: Pick<HolidayResult, 'source' | 'fetchedAt' | 'warning'>;
  refresh: () => Promise<void>;
  isRefreshing: boolean;
}

/** Loads (and caches offline) a profile's public holidays for the planning year and its neighbours. */
export const useHolidays = (profile: Profile | undefined, year: number): ProfileHolidays => {
  const queryClient = useQueryClient();
  const [isRefreshing, setRefreshing] = useState(false);

  const results = useQueries({
    queries: [year - 1, year, year + 1].map((y) => ({
      queryKey: profile ? holidayKey(profile, y) : ['holidays', 'none', y],
      queryFn: () => fetchFor(profile!, y),
      enabled: Boolean(profile),
      // Freshness is handled by the IndexedDB cache (weekly refresh, offline fallback).
      staleTime: Infinity,
      retry: 1,
    })),
  });
  const [prev, current, next] = results;

  const refresh = useCallback(async () => {
    if (!profile) return;
    setRefreshing(true);
    try {
      await Promise.all(
        [year - 1, year, year + 1].map(async (y) => {
          const data = await fetchFor(profile, y, true).catch(() => undefined);
          if (data) queryClient.setQueryData(holidayKey(profile, y), data);
        })
      );
    } finally {
      setRefreshing(false);
    }
  }, [profile, year, queryClient]);

  return useMemo(() => {
    const withCustom = (data: HolidayResult | undefined, y: number) =>
      mergeByDate([...(data?.holidays ?? []), ...customHolidaysForYear(profile?.customHolidays, y)]);
    const holidays = withCustom(current.data, year);
    return {
      holidays,
      extendedHolidays: [...withCustom(prev.data, year - 1), ...holidays, ...withCustom(next.data, year + 1)],
      isLoading: current.isLoading,
      error: current.error instanceof Error ? current.error.message : undefined,
      meta: current.data && { source: current.data.source, fetchedAt: current.data.fetchedAt, warning: current.data.warning },
      refresh,
      isRefreshing,
    };
  }, [current.data, current.isLoading, current.error, prev.data, next.data, profile?.customHolidays, year, refresh, isRefreshing]);
};
