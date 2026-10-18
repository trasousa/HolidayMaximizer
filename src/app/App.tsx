import { useEffect, useMemo } from 'react';
import { AppProviders } from '@/app/providers/AppProviders';
import { LandingPage } from '@/features/landing/components/LandingPage';
import { PlannerView } from '@/features/planner/components/PlannerView';
import { usePlannerUI } from '@/features/planner/context/PlannerContext';
import { useProfilesQuery, useSettingsQuery } from '@/features/profiles/hooks/useProfiles';
import { DEFAULT_SETTINGS } from '@/lib/constants';
import { UserSettings } from '@/lib/types';

const FALLBACK_SETTINGS: UserSettings = { year: new Date().getFullYear(), ...DEFAULT_SETTINGS };

const AppShell = () => {
  const { viewMode, setViewMode, selectedProfileIds, setSelectedProfileIds } = usePlannerUI();
  const { data: profiles = [], isLoading: profilesLoading, isError: profilesError } = useProfilesQuery();
  const { data: persistedSettings, isLoading: settingsLoading, isError: settingsError } = useSettingsQuery();

  const settings = useMemo(() => persistedSettings ?? FALLBACK_SETTINGS, [persistedSettings]);

  // Drop ids from a cached session that no longer exist (deleted profile, imported backup…).
  useEffect(() => {
    if (profilesLoading) return;
    const valid = selectedProfileIds.filter((id) => profiles.some((p) => p.id === id));
    if (valid.length !== selectedProfileIds.length) setSelectedProfileIds(valid);
    if (viewMode === 'planner' && profiles.length === 0) setViewMode('landing');
  }, [profiles, profilesLoading, selectedProfileIds, setSelectedProfileIds, viewMode, setViewMode]);

  if (profilesLoading || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-brand-500" aria-label="Loading" />
      </div>
    );
  }

  if (settingsError || profilesError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-lg font-semibold text-slate-800">We could not open your planner data.</p>
        <p className="text-sm text-slate-500">Your browser may be blocking storage (private mode?). Refresh to try again.</p>
      </div>
    );
  }

  if (viewMode === 'landing' || profiles.length === 0) {
    return <LandingPage profiles={profiles} settings={settings} />;
  }

  return <PlannerView profiles={profiles} settings={settings} />;
};

const App = () => (
  <AppProviders>
    <AppShell />
  </AppProviders>
);

export default App;
