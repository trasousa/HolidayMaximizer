import { useEffect, useMemo, useState } from 'react';
import { OptimizationSuggestion, Profile, UserSettings, Vacation, VacationCategory } from '@/lib/types';
import { usePlannerUI } from '@/features/planner/context/PlannerContext';
import { useProfileHydration } from '@/features/planner/hooks/useProfileHydration';
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
import { countBusinessDays, countTotalDays } from '@/lib/utils/date';
import { Download, LayoutGrid, PanelRightOpen, Settings, Sparkles } from 'lucide-react';

import { DEFAULT_CATEGORIES } from '@/lib/constants';

interface PlannerViewProps {
  profiles: Profile[];
  settings: UserSettings;
}

type SidebarTab = 'suggestions' | 'holidays' | 'trips';

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

  const { hydration, hydrateProfile } = useProfileHydration(settings);
  const createVacation = useCreateVacationMutation();
  const updateVacation = useUpdateVacationMutation();
  const deleteVacation = useDeleteVacationMutation();
  const updateProfile = useUpdateProfileMutation();
  const updateSettings = useUpdateSettingsMutation();
  const [vacationDraft, setVacationDraft] = useState<{ startDate: string; endDate: string } | null>(null);
  const [editingVacation, setEditingVacation] = useState<Vacation | null>(null);

  const visibleProfiles = useMemo(() => {
    if (selectedProfileIds.length === 0) return profiles;
    return profiles.filter((profile) => selectedProfileIds.includes(profile.id));
  }, [profiles, selectedProfileIds]);

  useEffect(() => {
    if (!activeProfileId && visibleProfiles.length > 0) {
      setActiveProfileId(visibleProfiles[0].id);
    }
  }, [activeProfileId, visibleProfiles, setActiveProfileId]);

  useEffect(() => {
    setPreviewSuggestion(null);
    setSelectionStart(null);
    setEditingVacation(null);
  }, [activeProfileId, setPreviewSuggestion, setSelectionStart]);

  const enrichedProfiles = useMemo(() =>
    visibleProfiles.map((profile) => ({
      ...profile,
      holidays: hydration[profile.id]?.holidays ?? profile.holidays ?? [],
      suggestions: hydration[profile.id]?.suggestions ?? profile.suggestions ?? [],
      categories: profile.categories?.length > 0 ? profile.categories : DEFAULT_CATEGORIES.map(c => c.id === 'PTO' ? { ...c, color: profile.color } : c),
    })),
  [visibleProfiles, hydration]);

  const activeProfile = useMemo(() => enrichedProfiles.find((profile) => profile.id === activeProfileId) ?? enrichedProfiles[0], [enrichedProfiles, activeProfileId]);

  useEffect(() => {
    if (!activeProfile) return;
    const status = hydration[activeProfile.id]?.status ?? 'idle';
    if (status === 'idle') {
      hydrateProfile(activeProfile);
    }
  }, [activeProfile, hydration, hydrateProfile]);

  useEffect(() => {
    if (activeProfile && !comparedProfileIds.every((id) => selectedProfileIds.includes(id))) {
      setComparedProfileIds((prev) => prev.filter((id) => selectedProfileIds.includes(id)));
    }
  }, [activeProfile, comparedProfileIds, selectedProfileIds, setComparedProfileIds]);

  const handleAnalyze = () => {
    if (activeProfile) {
      hydrateProfile(activeProfile);
    }
  };

  const handleApplySuggestion = async (suggestion: OptimizationSuggestion) => {
    if (!activeProfile || suggestion.costInPto > remainingPto) return;
    const result = await createVacation.mutateAsync({
      profileId: activeProfile.id,
      startDate: suggestion.startDate,
      endDate: suggestion.endDate,
      type: 'PTO',
      commuteHours: 0,
      note: suggestion.title,
    });
    setPreviewSuggestion(null);
    // Don't hydrate immediately to allow SuggestionPanel to show "Applied" state
    setTimeout(() => {
      hydrateProfile(activeProfile);
    }, 2000);
    return result;
  };

  const handlePlanVacation = (vacation: Vacation) => {
    setEditingVacation(vacation);
    setAddVacationOpen(true);
  };

  const handleDateClick = (date: string) => {
    if (!activeProfile) return;

    // Deselect if clicking the same date
    if (selectionStart === date) {
      setSelectionStart(null);
      return;
    }

    const holiday = activeProfile.holidays.find((entry) => entry.date === date);
    const existingVacation = activeProfile.vacations.find((v) => date >= v.startDate && date <= v.endDate);

    if (existingVacation && !selectionStart) {
      setEditingVacation(existingVacation);
      setAddVacationOpen(true);
      return;
    }

    if (holiday && !selectionStart) {
      setFocusedHoliday(holiday);
      return;
    }

    if (!selectionStart) {
      setSelectionStart(date);
      return;
    }

    let start = selectionStart;
    let end = date;
    if (new Date(start) > new Date(end)) {
      [start, end] = [end, start];
    }
    setSelectionStart(null);
    setVacationDraft({ startDate: start, endDate: end });
    setEditingVacation(null);
    setAddVacationOpen(true);
  };

  const handleSaveVacation = async ({ startDate, endDate, type, commuteHours, note }: { startDate: string; endDate: string; type: string; commuteHours: number; note: string }) => {
    if (!activeProfile) return;
    let rangeStart = startDate;
    let rangeEnd = endDate;
    if (new Date(rangeStart) > new Date(rangeEnd)) {
      [rangeStart, rangeEnd] = [rangeEnd, rangeStart];
    }

    if (editingVacation) {
      await updateVacation.mutateAsync({
        id: editingVacation.id,
        payload: {
          startDate: rangeStart,
          endDate: rangeEnd,
          type,
          commuteHours,
          note,
        }
      });
    } else {
      await createVacation.mutateAsync({
        profileId: activeProfile.id,
        startDate: rangeStart,
        endDate: rangeEnd,
        type,
        commuteHours,
        note,
      });
    }
    
    setAddVacationOpen(false);
    setVacationDraft(null);
    setEditingVacation(null);
    hydrateProfile(activeProfile);
  };

  const handleUpdateCategories = async (categories: VacationCategory[]) => {
    if (!activeProfile) return;
    await updateProfile.mutateAsync({
      id: activeProfile.id,
      payload: {
        name: activeProfile.name,
        avatar: activeProfile.avatar,
        color: activeProfile.color,
        country: activeProfile.country,
        city: activeProfile.city,
        isoCountryCode: activeProfile.isoCountryCode,
        isoRegionCode: activeProfile.isoRegionCode,
        totalAllowance: activeProfile.totalAllowance,
        categories,
      },
    });
  };

  const handleRemoveVacation = (vacationId: string) => {
    deleteVacation.mutate(vacationId);
  };

  const handleExport = (options: ExportOptions) => {
    if (!activeProfile) return;
    generateICSFile(activeProfile, options);
  };

  const isAnalyzing = activeProfile ? hydration[activeProfile.id]?.status === 'loading' : false;

  const stats = useMemo(() => {
    if (!activeProfile) {
      return { used: 0, commute: 0, total: 0, efficiency: 0, topTrips: [], isProjection: false };
    }
    const ptoVacations = activeProfile.vacations.filter(v => {
      const cat = activeProfile.categories.find(c => c.id === v.type);
      return cat ? cat.isPto : v.type === 'PTO';
    });

    let used = ptoVacations.reduce((sum, vacation) => sum + countBusinessDays(vacation.startDate, vacation.endDate, activeProfile.holidays), 0);
    let total = ptoVacations.reduce((sum, vacation) => sum + countTotalDays(vacation.startDate, vacation.endDate), 0);
    const commute = activeProfile.vacations.reduce((sum, vacation) => sum + vacation.commuteHours, 0);

    if (previewSuggestion) {
      used += previewSuggestion.costInPto;
      total += previewSuggestion.totalDaysOff;
    }
    
    const topTrips = [...activeProfile.vacations]
      .map(v => ({
        ...v,
        businessDays: countBusinessDays(v.startDate, v.endDate, activeProfile.holidays),
        totalDays: countTotalDays(v.startDate, v.endDate)
      }))
      .sort((a, b) => b.businessDays - a.businessDays)
      .slice(0, 5);

    return { used, commute, total, efficiency: used ? total / used : 0, topTrips, isProjection: !!previewSuggestion };
  }, [activeProfile, previewSuggestion]);

  const remainingPto = Math.max(0, (activeProfile?.totalAllowance ?? 0) - stats.used);

  if (!activeProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">Select or create a profile to begin.</div>
    );
  }

  const sidebarActiveTab = sidebarTab as SidebarTab;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <button className="inline-flex items-center gap-2 rounded-full bg-white/60 px-3 py-1 text-xs font-medium text-slate-500 hover:bg-white transition shadow-sm" onClick={() => setSettingsOpen(true)}>
            <Settings size={14} />
            Optimization settings
          </button>
          <div className="flex items-center gap-3">
            <span className="inline-block h-4 w-4 rounded-full" style={{ backgroundColor: activeProfile.color }} />
            <h2 className="text-3xl font-semibold text-slate-900">{activeProfile.name}</h2>
          </div>
          <p className="text-slate-500 text-sm">{activeProfile.city}, {activeProfile.country}</p>
        </div>
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <ProfileManager
            profiles={visibleProfiles}
            activeProfileId={activeProfile.id}
            comparedProfileIds={comparedProfileIds}
            onSwitch={(id) => setActiveProfileId(id)}
            onToggleCompare={(id) => setComparedProfileIds((prev) => (prev.includes(id) ? prev.filter((entry) => entry !== id) : [...prev, id]))}
            onAddProfile={() => setViewMode('landing')}
          />
          <div className="flex gap-2">
            <button onClick={() => setExportModalOpen(true)} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 inline-flex items-center gap-2 hover:bg-slate-50 transition shadow-sm">
              <Download size={16} />
              Export
            </button>
            <button onClick={() => setShowSuggestionsOverlay((prev) => !prev)} className={`rounded-full px-4 py-2 text-sm font-medium inline-flex items-center gap-2 transition shadow-sm ${showSuggestionsOverlay ? 'bg-amber-100 text-amber-700' : 'bg-white border border-slate-200 text-slate-600'}`}>
              <Sparkles size={16} />
              Overlay
            </button>
          </div>
        </div>
      </header>

      <StatsPanel 
        allowance={activeProfile.totalAllowance} 
        used={stats.used} 
        commuteHours={stats.commute} 
        efficiency={stats.efficiency} 
        holidayCount={activeProfile.holidays.length}
        topTrips={stats.topTrips}
        isProjection={stats.isProjection}
      />

      <main className="grid gap-6 items-start lg:grid-cols-[minmax(0,340px),1fr] xl:grid-cols-[minmax(0,360px),1fr]">
        <aside className="space-y-4 order-2 lg:order-1 lg:sticky lg:top-8">
          <div className="flex rounded-2xl border border-white/60 bg-white/70 p-1 shadow-sm">
            {(['suggestions', 'holidays', 'trips'] as SidebarTab[]).map((tab) => (
              <button key={tab} onClick={() => setSidebarTab(tab)} className={`flex-1 rounded-2xl px-3 py-2 text-xs font-bold uppercase tracking-widest transition ${sidebarActiveTab === tab ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
                {tab}
              </button>
            ))}
          </div>
          <div className="rounded-3xl border border-white/60 bg-white/80 p-5 space-y-4 shadow-sm backdrop-blur-sm">
            {sidebarActiveTab === 'suggestions' && (
              <SuggestionPanel
                suggestions={activeProfile.suggestions}
                activeSuggestionId={previewSuggestion?.id}
                onPreview={(suggestion) => setPreviewSuggestion(previewSuggestion?.id === suggestion.id ? null : suggestion)}
                onApply={handleApplySuggestion}
                onPlan={handlePlanVacation}
                onAnalyze={handleAnalyze}
                isAnalyzing={isAnalyzing}
                remainingPto={remainingPto}
              />
            )}
            {sidebarActiveTab === 'holidays' && (
              <HolidayList holidays={activeProfile.holidays} year={settings.year} onSelect={setFocusedHoliday} />
            )}
            {sidebarActiveTab === 'trips' && (
              <div className="space-y-4">
                <button
                  onClick={() => {
                    setVacationDraft(null);
                    setEditingVacation(null);
                    setAddVacationOpen(true);
                  }}
                  className="w-full rounded-2xl border border-dashed border-slate-300 py-4 text-sm font-bold text-slate-500 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50/30 transition flex items-center justify-center gap-2"
                >
                  <LayoutGrid size={16} /> Add trip
                </button>
                <VacationList 
                  vacations={activeProfile.vacations} 
                  holidays={activeProfile.holidays} 
                  onRemove={handleRemoveVacation}
                  onEdit={(v) => {
                    setEditingVacation(v);
                    setAddVacationOpen(true);
                  }}
                />
              </div>
            )}
          </div>
        </aside>
        <section className="space-y-4 order-1 lg:order-2">
          <div className="flex items-center justify-between text-xs uppercase tracking-widest text-slate-400 font-bold">
            <span className="inline-flex items-center gap-2"><LayoutGrid size={14} /> Full year</span>
            <button onClick={handleAnalyze} className="inline-flex items-center gap-1 text-slate-500 hover:text-brand-600 transition">
              <PanelRightOpen size={12} /> Snap to suggestion
            </button>
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
          />
        </section>
      </main>

      {isExportModalOpen && <ExportModal profileName={activeProfile.name} onExport={handleExport} onClose={() => setExportModalOpen(false)} />}
      {isAddVacationOpen && (
        <VacationModal
          vacation={editingVacation || undefined}
          defaultStart={vacationDraft?.startDate}
          defaultEnd={vacationDraft?.endDate}
          categories={activeProfile.categories}
          onClose={() => {
            setAddVacationOpen(false);
            setVacationDraft(null);
            setEditingVacation(null);
          }}
          onSave={(payload) => handleSaveVacation(payload)}
          onUpdateCategories={handleUpdateCategories}
        />
      )}
      {focusedHoliday && <HolidayModal holiday={focusedHoliday} year={settings.year} onClose={() => setFocusedHoliday(null)} />}
      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          isSaving={updateSettings.isPending}
          onClose={() => setSettingsOpen(false)}
          onSave={async (nextSettings) => {
            await updateSettings.mutateAsync(nextSettings);
            if (activeProfile) {
              hydrateProfile(activeProfile);
            }
          }}
        />
      )}
    </div>
  );
};

export default PlannerView;
