import { useEffect, useMemo, useState } from 'react';
import { CustomHoliday, OptimizationSuggestion, Profile, SaveProfilePayload, UserSettings, Vacation, VacationCategory } from '@/lib/types';
import { SidebarTab, usePlannerUI } from '@/features/planner/context/PlannerContext';
import { useHolidays } from '@/features/planner/hooks/useHolidays';
import { StatsPanel } from '@/features/stats/components/StatsPanel';
import YearCalendar from '@/features/calendar/components/YearCalendar';
import { ProfileManager } from '@/features/profiles/components/ProfileManager';
import { SuggestionPanel } from '@/features/suggestions/components/SuggestionPanel';
import { VacationList } from '@/features/vacations/components/VacationList';
import { HolidayList } from '@/features/holidays/components/HolidayList';
import { ExportModal } from '@/features/modals/ExportModal';
import { VacationModal } from '@/features/modals/VacationModal';
import { HolidayModal } from '@/features/modals/HolidayModal';
import { SettingsModal } from '@/features/settings/components/SettingsModal';
import {
  useCreateVacationMutation,
  useDeleteVacationMutation,
  useUpdateVacationMutation,
  useUpdateProfileMutation,
  useUpdateSettingsMutation,
} from '@/features/profiles/hooks/useProfiles';
import { generateICSFile, ExportOptions } from '@/lib/services/exportService';
import { generateSmartSuggestions } from '@/lib/services/optimizationService';
import { computePlanStats } from '@/lib/services/statsService';
import { DEFAULT_WEEKEND, isWeekendDay, todayISO } from '@/lib/utils/date';
import { CalendarDays, ChevronLeft, ChevronRight, Download, Plus, Settings, Sparkles, Users } from 'lucide-react';
import { DEFAULT_CATEGORIES } from '@/lib/constants';

interface PlannerViewProps {
  profiles: Profile[];
  settings: UserSettings;
}

const TABS: { id: SidebarTab; label: string }[] = [
  { id: 'suggestions', label: 'Suggestions' },
  { id: 'holidays', label: 'Holidays' },
  { id: 'trips', label: 'Trips' },
];

export const toProfilePayload = (profile: Profile, overrides: Partial<SaveProfilePayload> = {}): SaveProfilePayload => ({
  name: profile.name,
  avatar: profile.avatar,
  color: profile.color,
  country: profile.country,
  city: profile.city,
  isoCountryCode: profile.isoCountryCode,
  isoRegionCode: profile.isoRegionCode,
  holidaySource: profile.holidaySource,
  weekendDays: profile.weekendDays,
  customHolidays: profile.customHolidays,
  totalAllowance: profile.totalAllowance,
  categories: profile.categories,
  ...overrides,
});

export const PlannerView = ({ profiles, settings }: PlannerViewProps) => {
  const {
    setViewMode,
    activeProfileId,
    setActiveProfileId,
    selectedProfileIds,
    comparedProfileIds,
    setComparedProfileIds,
    previewSuggestion,
    setPreviewSuggestion,
    showSuggestionsOverlay,
    setShowSuggestionsOverlay,
    selectionStart,
    setSelectionStart,
    sidebarTab,
    setSidebarTab,
    isSettingsOpen,
    setSettingsOpen,
    isAddVacationOpen,
    setAddVacationOpen,
    isExportModalOpen,
    setExportModalOpen,
    focusedHoliday,
    setFocusedHoliday,
  } = usePlannerUI();

  const createVacation = useCreateVacationMutation();
  const updateVacation = useUpdateVacationMutation();
  const deleteVacation = useDeleteVacationMutation();
  const updateProfile = useUpdateProfileMutation();
  const updateSettings = useUpdateSettingsMutation();
  const [vacationDraft, setVacationDraft] = useState<{ startDate: string; endDate: string } | null>(null);
  const [editingVacation, setEditingVacation] = useState<Vacation | null>(null);
  const [lastApplied, setLastApplied] = useState<Vacation | null>(null);

  const visibleProfiles = useMemo(() => {
    const selected = profiles.filter((profile) => selectedProfileIds.includes(profile.id));
    return selected.length > 0 ? selected : profiles;
  }, [profiles, selectedProfileIds]);

  const withCategories = (profile: Profile): Profile => ({
    ...profile,
    categories:
      profile.categories?.length > 0
        ? profile.categories
        : DEFAULT_CATEGORIES.map((c) => (c.id === 'PTO' ? { ...c, color: profile.color } : c)),
  });

  const baseActive = visibleProfiles.find((profile) => profile.id === activeProfileId) ?? visibleProfiles[0];

  useEffect(() => {
    if (baseActive && baseActive.id !== activeProfileId) setActiveProfileId(baseActive.id);
  }, [baseActive, activeProfileId, setActiveProfileId]);

  useEffect(() => {
    setPreviewSuggestion(null);
    setSelectionStart(null);
    setEditingVacation(null);
    setLastApplied(null);
  }, [activeProfileId, settings.year, setPreviewSuggestion, setSelectionStart]);

  useEffect(() => {
    const valid = comparedProfileIds.filter((id) => visibleProfiles.some((p) => p.id === id) && id !== baseActive?.id);
    if (valid.length !== comparedProfileIds.length) setComparedProfileIds(valid);
  }, [comparedProfileIds, visibleProfiles, baseActive, setComparedProfileIds]);

  const holidayData = useHolidays(baseActive, settings.year);
  const weekendDays = baseActive?.weekendDays ?? DEFAULT_WEEKEND;

  const activeProfile = useMemo<Profile | undefined>(
    () => baseActive && { ...withCategories(baseActive), holidays: holidayData.holidays },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [baseActive, holidayData.holidays]
  );

  const baseStats = useMemo(
    () =>
      computePlanStats({
        year: settings.year,
        vacations: activeProfile?.vacations ?? [],
        categories: activeProfile?.categories ?? DEFAULT_CATEGORIES,
        holidays: holidayData.holidays,
        weekendDays,
      }),
    [activeProfile, holidayData.holidays, settings.year, weekendDays]
  );

  const stats = useMemo(
    () =>
      previewSuggestion && activeProfile
        ? computePlanStats({
            year: settings.year,
            vacations: activeProfile.vacations,
            categories: activeProfile.categories,
            holidays: holidayData.holidays,
            weekendDays,
            preview: previewSuggestion,
          })
        : baseStats,
    [previewSuggestion, activeProfile, baseStats, holidayData.holidays, settings.year, weekendDays]
  );

  const remainingPto = (activeProfile?.totalAllowance ?? 0) - baseStats.used;

  const suggestions = useMemo(() => {
    if (holidayData.isLoading) return [];
    const today = todayISO();
    const hidePast = settings.hidePastSuggestions ?? true;
    return generateSmartSuggestions({
      year: settings.year,
      holidays: holidayData.extendedHolidays,
      settings,
      weekendDays,
      bookedDates: baseStats.bookedDates,
      earliestDate: hidePast && today.startsWith(String(settings.year)) ? today : undefined,
    });
  }, [holidayData.isLoading, holidayData.extendedHolidays, settings, weekendDays, baseStats.bookedDates]);

  const enrichedProfiles = useMemo(
    () => visibleProfiles.map((p) => (p.id === activeProfile?.id ? { ...activeProfile, suggestions } : withCategories(p))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visibleProfiles, activeProfile, suggestions]
  );

  if (!activeProfile) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Select or create a profile to begin.</div>;
  }

  const saveProfile = (overrides: Partial<SaveProfilePayload>) =>
    updateProfile.mutateAsync({ id: activeProfile.id, payload: toProfilePayload(activeProfile, overrides) });

  const handleApplySuggestion = async (suggestion: OptimizationSuggestion) => {
    if (suggestion.costInPto > remainingPto) return;
    const result = await createVacation.mutateAsync({
      profileId: activeProfile.id,
      startDate: suggestion.startDate,
      endDate: suggestion.endDate,
      type: 'PTO',
      commuteHours: 0,
      note: `Bridge ${suggestion.title}`,
    });
    setPreviewSuggestion(null);
    setLastApplied(result);
  };

  const openVacation = (vacation: Vacation | null, draft: { startDate: string; endDate: string } | null = null) => {
    setEditingVacation(vacation);
    setVacationDraft(draft);
    setAddVacationOpen(true);
  };

  const handleDateClick = (date: string) => {
    if (selectionStart === date) {
      // Second click on the same day: plan a single-day trip.
      setSelectionStart(null);
      openVacation(null, { startDate: date, endDate: date });
      return;
    }

    if (!selectionStart) {
      const existingVacation = activeProfile.vacations.find((v) => date >= v.startDate && date <= v.endDate);
      if (existingVacation) return openVacation(existingVacation);
      const holiday = activeProfile.holidays.find((entry) => entry.date === date);
      if (holiday) return setFocusedHoliday(holiday);
      setSelectionStart(date);
      return;
    }

    const [start, end] = selectionStart <= date ? [selectionStart, date] : [date, selectionStart];
    setSelectionStart(null);
    openVacation(null, { startDate: start, endDate: end });
  };

  const closeVacationModal = () => {
    setAddVacationOpen(false);
    setVacationDraft(null);
    setEditingVacation(null);
  };

  const handleSaveVacation = async ({ startDate, endDate, type, commuteHours, note }: { startDate: string; endDate: string; type: string; commuteHours: number; note: string }) => {
    const [rangeStart, rangeEnd] = startDate <= endDate ? [startDate, endDate] : [endDate, startDate];
    const payload = { startDate: rangeStart, endDate: rangeEnd, type, commuteHours, note };
    if (editingVacation) {
      await updateVacation.mutateAsync({ id: editingVacation.id, payload });
    } else {
      await createVacation.mutateAsync({ profileId: activeProfile.id, ...payload });
    }
    closeVacationModal();
  };

  const handleRemoveVacation = (vacation: Vacation) => {
    if (!window.confirm(`Remove "${vacation.note || 'this trip'}"?`)) return;
    deleteVacation.mutate(vacation.id);
    if (lastApplied?.id === vacation.id) setLastApplied(null);
  };

  const handleUpdateCategories = (categories: VacationCategory[]) => saveProfile({ categories });
  const handleUpdateCustomHolidays = (customHolidays: CustomHoliday[]) => saveProfile({ customHolidays });

  const handleExport = (options: ExportOptions) => {
    generateICSFile(activeProfile, options, settings.year);
    setExportModalOpen(false);
  };

  const changeYear = (delta: number) => updateSettings.mutate({ ...settings, year: settings.year + delta });

  return (
    <div className="min-h-screen pb-16">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
          <button onClick={() => setViewMode('landing')} className="btn-ghost -ml-2 px-2" title="Back to profiles">
            <span className="text-xl" aria-hidden>🌴</span>
            <span className="hidden font-bold text-slate-900 sm:inline">Holiday Maximizer</span>
          </button>

          <div className="flex items-center rounded-xl bg-slate-100 p-0.5" aria-label="Planning year">
            <button className="icon-btn h-8 w-8" onClick={() => changeYear(-1)} aria-label="Previous year">
              <ChevronLeft size={16} />
            </button>
            <span className="min-w-[3.5rem] text-center text-sm font-bold tabular-nums text-slate-900">{settings.year}</span>
            <button className="icon-btn h-8 w-8" onClick={() => changeYear(1)} aria-label="Next year">
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="order-last w-full sm:order-none sm:w-auto sm:flex-1">
            <ProfileManager
              profiles={visibleProfiles}
              activeProfileId={activeProfile.id}
              comparedProfileIds={comparedProfileIds}
              onSwitch={(id) => setActiveProfileId(id)}
              onToggleCompare={(id) => setComparedProfileIds((prev) => (prev.includes(id) ? prev.filter((entry) => entry !== id) : [...prev, id]))}
              onAddProfile={() => setViewMode('landing')}
            />
          </div>

          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => setShowSuggestionsOverlay((prev) => !prev)}
              className={`btn px-3 ${showSuggestionsOverlay ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 'btn-ghost'}`}
              aria-pressed={showSuggestionsOverlay}
              title="Highlight suggested bridges on the calendar"
            >
              <Sparkles size={16} />
              <span className="hidden md:inline">Bridges</span>
            </button>
            <button onClick={() => setExportModalOpen(true)} className="btn-ghost px-3" title="Export to calendar (.ics)">
              <Download size={16} />
              <span className="hidden md:inline">Export</span>
            </button>
            <button onClick={() => setSettingsOpen(true)} className="icon-btn" aria-label="Settings" title="Settings">
              <Settings size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 px-4 pt-6">
        <section className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl text-base font-bold text-white shadow-sm" style={{ backgroundColor: activeProfile.color }}>
              {activeProfile.avatar}
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{activeProfile.name}</h1>
              <p className="text-sm text-slate-500">
                {activeProfile.city}, {activeProfile.country}
              </p>
            </div>
          </div>
          {comparedProfileIds.length > 0 && (
            <p className="chip bg-slate-100 text-slate-600">
              <Users size={12} /> Overlaying {comparedProfileIds.length} other {comparedProfileIds.length === 1 ? 'profile' : 'profiles'}
            </p>
          )}
        </section>

        <StatsPanel
          allowance={activeProfile.totalAllowance}
          used={stats.used}
          totalDaysOff={stats.total}
          commuteHours={stats.commute}
          efficiency={stats.efficiency}
          holidayCount={activeProfile.holidays.length}
          workdayHolidayCount={activeProfile.holidays.filter((h) => !isWeekendDay(h.date, weekendDays)).length}
          topTrips={stats.topTrips}
          isProjection={stats.isProjection}
          year={settings.year}
        />

        <main className="grid items-start gap-6 lg:grid-cols-[minmax(0,360px),1fr]">
          <aside className="space-y-3 lg:sticky lg:top-24">
            <div className="segmented" role="tablist">
              {TABS.map((tab) => (
                <button key={tab.id} role="tab" aria-selected={sidebarTab === tab.id} onClick={() => setSidebarTab(tab.id)}>
                  {tab.label}
                  {tab.id === 'suggestions' && suggestions.length > 0 && <span className="ml-1 text-brand-600">{suggestions.length}</span>}
                  {tab.id === 'trips' && activeProfile.vacations.length > 0 && <span className="ml-1 text-slate-400">{activeProfile.vacations.length}</span>}
                </button>
              ))}
            </div>
            <div className="card p-4 lg:max-h-[calc(100vh-11rem)] lg:overflow-y-auto scroll-area">
              {sidebarTab === 'suggestions' && (
                <SuggestionPanel
                  suggestions={suggestions}
                  activeSuggestionId={previewSuggestion?.id}
                  onPreview={setPreviewSuggestion}
                  onApply={handleApplySuggestion}
                  lastApplied={lastApplied}
                  onEditApplied={(v) => openVacation(v)}
                  onDismissApplied={() => setLastApplied(null)}
                  onOpenSettings={() => setSettingsOpen(true)}
                  isLoading={holidayData.isLoading}
                  remainingPto={remainingPto}
                  settings={settings}
                />
              )}
              {sidebarTab === 'holidays' && (
                <HolidayList
                  holidays={activeProfile.holidays}
                  year={settings.year}
                  weekendDays={weekendDays}
                  onSelect={setFocusedHoliday}
                  isLoading={holidayData.isLoading}
                  error={holidayData.error}
                  meta={holidayData.meta}
                  onRefresh={holidayData.refresh}
                  isRefreshing={holidayData.isRefreshing}
                  customHolidays={activeProfile.customHolidays ?? []}
                  onChangeCustomHolidays={handleUpdateCustomHolidays}
                  regionLabel={activeProfile.city}
                />
              )}
              {sidebarTab === 'trips' && (
                <div className="space-y-3">
                  <button onClick={() => openVacation(null)} className="btn-secondary w-full border-dashed py-3">
                    <Plus size={16} /> Add trip
                  </button>
                  <VacationList
                    vacations={activeProfile.vacations}
                    categories={activeProfile.categories}
                    holidays={activeProfile.holidays}
                    weekendDays={weekendDays}
                    year={settings.year}
                    onRemove={handleRemoveVacation}
                    onEdit={(v) => openVacation(v)}
                  />
                </div>
              )}
            </div>
          </aside>

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <CalendarDays size={16} className="text-brand-500" /> {settings.year} at a glance
              </h2>
              <p className="text-xs text-slate-500">
                {selectionStart ? 'Now click the last day of the trip (or the same day again for a single day).' : 'Click a day to start planning a trip.'}
              </p>
            </div>
            <YearCalendar
              year={settings.year}
              profiles={enrichedProfiles}
              activeProfileId={activeProfile.id}
              comparedProfileIds={comparedProfileIds}
              activeSuggestion={previewSuggestion}
              selectionStart={selectionStart}
              onDateClick={handleDateClick}
              showSuggestionsOverlay={showSuggestionsOverlay}
              remainingPto={remainingPto}
              weekendDays={weekendDays}
            />
          </section>
        </main>
      </div>

      {isExportModalOpen && <ExportModal profileName={activeProfile.name} onExport={handleExport} onClose={() => setExportModalOpen(false)} />}
      {isAddVacationOpen && (
        <VacationModal
          vacation={editingVacation || undefined}
          defaultStart={vacationDraft?.startDate}
          defaultEnd={vacationDraft?.endDate}
          categories={activeProfile.categories}
          holidays={activeProfile.holidays}
          weekendDays={weekendDays}
          onClose={closeVacationModal}
          onSave={handleSaveVacation}
          onDelete={
            editingVacation
              ? () => {
                  handleRemoveVacation(editingVacation);
                  closeVacationModal();
                }
              : undefined
          }
          onUpdateCategories={handleUpdateCategories}
        />
      )}
      {focusedHoliday && <HolidayModal holiday={focusedHoliday} onClose={() => setFocusedHoliday(null)} onStartTrip={(date) => {
            setFocusedHoliday(null);
            setSelectionStart(date);
          }} />}
      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          isSaving={updateSettings.isPending}
          onClose={() => setSettingsOpen(false)}
          onSave={async (nextSettings) => {
            await updateSettings.mutateAsync(nextSettings);
          }}
        />
      )}
    </div>
  );
};

export default PlannerView;
