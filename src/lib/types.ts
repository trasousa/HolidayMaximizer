export type ViewMode = 'landing' | 'planner';

export interface Holiday {
  date: string;
  name: string;
  localName?: string;
  countryCode?: string;
  counties?: string[] | null;
  description?: string;
}

export interface OptimizationSuggestion {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  costInPto: number;
  totalDaysOff: number;
  description: string;
  usesHoliday: boolean;
  holidayDates: string[];
}

export type VacationType = 'PTO' | 'RemoteWork' | 'Unpaid';

export interface Vacation {
  id: string;
  profileId: string;
  startDate: string;
  endDate: string;
  type: VacationType;
  commuteHours: number;
  note?: string;
}

export interface Profile {
  id: string;
  name: string;
  color: string;
  avatar: string;
  country: string;
  city: string;
  isoCountryCode?: string;
  isoRegionCode?: string;
  totalAllowance: number;
  holidays: Holiday[];
  vacations: Vacation[];
  suggestions: OptimizationSuggestion[];
}

export interface UserSettings {
  year: number;
  minPtoDays: number;
  maxPtoDays: number;
  minEfficiency: number;
}

export interface PlannerStateSnapshot {
  activeProfileId: string | null;
  comparedProfileIds: string[];
  selectedProfileIds: string[];
  previewSuggestion: OptimizationSuggestion | null;
  selectionStart: string | null;
  showSuggestionsOverlay: boolean;
}
