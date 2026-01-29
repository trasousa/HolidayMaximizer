export interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
  localName?: string;
  countryCode?: string;
  counties?: string[] | null; // Region codes if specific, null if national
  description?: string; // The "Why" fetched from AI
}

export interface OptimizationSuggestion {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  costInPto: number;
  totalDaysOff: number;
  description: string;
}

export interface Vacation {
  id: string;
  profileId: string; // Link to profile
  startDate: string;
  endDate: string;
  type: 'PTO' | 'RemoteWork' | 'Unpaid';
  commuteHours: number;
  note?: string;
}

export interface Profile {
  id: string;
  name: string;
  color: string; // Tailwind color class prefix or hex
  avatar: string; // Initials
  country: string;
  city: string;
  isoCountryCode?: string; // e.g., DE
  isoRegionCode?: string; // e.g., DE-BE
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
