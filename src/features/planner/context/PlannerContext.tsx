import { createContext, useContext, useMemo, useState } from 'react';
import type { Dispatch, PropsWithChildren, SetStateAction } from 'react';
import { Holiday, OptimizationSuggestion, ViewMode } from '@/lib/types';

type SidebarTab = 'suggestions' | 'holidays' | 'trips';

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
  setShowSuggestionsOverlay: (value: boolean) => void;
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
  const [viewMode, setViewMode] = useState<ViewMode>('landing');
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>([]);
  const [comparedProfileIds, setComparedProfileIds] = useState<string[]>([]);
  const [previewSuggestion, setPreviewSuggestion] = useState<OptimizationSuggestion | null>(null);
  const [showSuggestionsOverlay, setShowSuggestionsOverlay] = useState(true);
  const [selectionStart, setSelectionStart] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('suggestions');
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isAddVacationOpen, setAddVacationOpen] = useState(false);
  const [isExportModalOpen, setExportModalOpen] = useState(false);
  const [focusedHoliday, setFocusedHoliday] = useState<Holiday | null>(null);

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
