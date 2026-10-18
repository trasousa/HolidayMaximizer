import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Dispatch, PropsWithChildren, SetStateAction } from 'react';
import { Holiday, OptimizationSuggestion, ViewMode } from '@/lib/types';

export type SidebarTab = 'suggestions' | 'holidays' | 'trips';

/**
 * The planner session (which view, profile and tab you were on) is cached in the
 * browser so a reload or a later visit picks up exactly where you left off.
 * Plan data itself lives in IndexedDB; this is only the UI position.
 */
const SESSION_KEY = 'holiday-maximizer:session:v1';

interface PersistedSession {
  viewMode: ViewMode;
  activeProfileId: string | null;
  selectedProfileIds: string[];
  comparedProfileIds: string[];
  showSuggestionsOverlay: boolean;
  sidebarTab: SidebarTab;
}

const loadSession = (): Partial<PersistedSession> => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Partial<PersistedSession>) : {};
  } catch {
    return {};
  }
};

const saveSession = (session: PersistedSession) => {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // Storage disabled (private mode) – the session just won't survive a reload.
  }
};

interface PlannerContextValue {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  activeProfileId: string | null;
  setActiveProfileId: Dispatch<SetStateAction<string | null>>;
  selectedProfileIds: string[];
  setSelectedProfileIds: Dispatch<SetStateAction<string[]>>;
  comparedProfileIds: string[];
  setComparedProfileIds: Dispatch<SetStateAction<string[]>>;
  toggleComparedProfile: (id: string) => void;
  previewSuggestion: OptimizationSuggestion | null;
  setPreviewSuggestion: (suggestion: OptimizationSuggestion | null) => void;
  showSuggestionsOverlay: boolean;
  setShowSuggestionsOverlay: Dispatch<SetStateAction<boolean>>;
  selectionStart: string | null;
  setSelectionStart: (date: string | null) => void;
  sidebarTab: SidebarTab;
  setSidebarTab: (tab: SidebarTab) => void;
  isSettingsOpen: boolean;
  setSettingsOpen: (value: boolean) => void;
  isAddVacationOpen: boolean;
  setAddVacationOpen: (value: boolean) => void;
  isExportModalOpen: boolean;
  setExportModalOpen: (value: boolean) => void;
  focusedHoliday: Holiday | null;
  setFocusedHoliday: (holiday: Holiday | null) => void;
}

const PlannerContext = createContext<PlannerContextValue | undefined>(undefined);

export const PlannerProvider = ({ children }: PropsWithChildren) => {
  const [initial] = useState(loadSession);
  const [viewMode, setViewMode] = useState<ViewMode>(initial.viewMode ?? 'landing');
  const [activeProfileId, setActiveProfileId] = useState<string | null>(initial.activeProfileId ?? null);
  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>(initial.selectedProfileIds ?? []);
  const [comparedProfileIds, setComparedProfileIds] = useState<string[]>(initial.comparedProfileIds ?? []);
  const [previewSuggestion, setPreviewSuggestion] = useState<OptimizationSuggestion | null>(null);
  const [showSuggestionsOverlay, setShowSuggestionsOverlay] = useState(initial.showSuggestionsOverlay ?? true);
  const [selectionStart, setSelectionStart] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>(initial.sidebarTab ?? 'suggestions');
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isAddVacationOpen, setAddVacationOpen] = useState(false);
  const [isExportModalOpen, setExportModalOpen] = useState(false);
  const [focusedHoliday, setFocusedHoliday] = useState<Holiday | null>(null);

  useEffect(() => {
    saveSession({ viewMode, activeProfileId, selectedProfileIds, comparedProfileIds, showSuggestionsOverlay, sidebarTab });
  }, [viewMode, activeProfileId, selectedProfileIds, comparedProfileIds, showSuggestionsOverlay, sidebarTab]);

  const value = useMemo<PlannerContextValue>(
    () => ({
      viewMode,
      setViewMode,
      activeProfileId,
      setActiveProfileId,
      selectedProfileIds,
      setSelectedProfileIds,
      comparedProfileIds,
      setComparedProfileIds,
      toggleComparedProfile: (id: string) =>
        setComparedProfileIds((prev) =>
          prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
        ),
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
    }),
    [
      viewMode,
      activeProfileId,
      selectedProfileIds,
      comparedProfileIds,
      previewSuggestion,
      showSuggestionsOverlay,
      selectionStart,
      sidebarTab,
      isSettingsOpen,
      isAddVacationOpen,
      isExportModalOpen,
      focusedHoliday,
    ]
  );

  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>;
};

export const usePlannerUI = () => {
  const context = useContext(PlannerContext);
  if (!context) {
    throw new Error('usePlannerUI must be used within a PlannerProvider');
  }
  return context;
};
