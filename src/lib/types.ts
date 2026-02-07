export type ViewMode = 'landing' | 'planner';

export interface Holiday {
  date: string;
  name: string;
  localName?: string;
  countryCode?: string;
  counties?: string[] | null;
  description?: string;
  scope?: 'national' | 'regional';
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

export interface VacationCategory {
  id: string;
  name: string;
  color: string;
  isPto: boolean;
}

export type VacationType = 'PTO' | 'RemoteWork' | 'Unpaid' | string;

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
  categories: VacationCategory[];
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
