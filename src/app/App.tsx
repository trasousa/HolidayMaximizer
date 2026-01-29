import { useMemo } from 'react';
import { AppProviders } from '@/app/providers/AppProviders';
import { LandingPage } from '@/features/landing/components/LandingPage';
import { PlannerView } from '@/features/planner/components/PlannerView';
import { usePlannerUI } from '@/features/planner/context/PlannerContext';
import { useProfilesQuery, useSettingsQuery } from '@/features/profiles/hooks/useProfiles';
import { UserSettings } from '@/lib/types';

const DEFAULT_SETTINGS: UserSettings = {
  year: new Date().getFullYear(),
  minPtoDays: 1,
  maxPtoDays: 5,
  minEfficiency: 1.6,
};

const AppShell = () => {
  const { viewMode } = usePlannerUI();
  const { data: profiles = [], isLoading: profilesLoading, isError: profilesError } = useProfilesQuery();
  const {
    data: persistedSettings,
    isLoading: settingsLoading,
    isError: settingsError,
  } = useSettingsQuery();

  const settings = useMemo(() => persistedSettings ?? DEFAULT_SETTINGS, [persistedSettings]);

  if (profilesLoading || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-brand-500" aria-label="Loading"></div>
      </div>
    );
  }

  if (settingsError || profilesError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-lg font-semibold text-slate-800">We could not load your planner data.</p>
        <p className="text-sm text-slate-500">Please refresh the page to try again.</p>
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
