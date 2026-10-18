export type ViewMode = 'landing' | 'planner';

/** Where a profile's public holidays come from. */
export type HolidaySource = 'openholidays' | 'nager';

export type HolidayScope = 'national' | 'regional' | 'custom';

export interface Holiday {
  date: string;
  name: string;
  localName?: string;
  countryCode?: string;
  scope?: HolidayScope;
  /** Subdivision codes the holiday applies to (empty for nationwide holidays). */
  regions?: string[];
  description?: string;
}

/** A holiday the user adds by hand (municipal, company day off, …). */
export interface CustomHoliday {
  id: string;
  date: string;
  name: string;
  /** Repeat on the same month/day every year. */
  recurring: boolean;
}

export interface OptimizationSuggestion {
  id: string;
  title: string;
  /** First PTO day to book. */
  startDate: string;
  /** Last PTO day to book. */
  endDate: string;
  /** First day of the whole break, including surrounding weekends/holidays. */
  breakStart: string;
  /** Last day of the whole break. */
  breakEnd: string;
  /** The working days that must be booked as PTO. */
  ptoDates: string[];
  costInPto: number;
  totalDaysOff: number;
  efficiency: number;
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
  /** Provider the region code belongs to. Older profiles have none and use Nager.Date. */
  holidaySource?: HolidaySource;
  /** Days of the week that are not working days (0 = Sunday … 6 = Saturday). */
  weekendDays?: number[];
  customHolidays?: CustomHoliday[];
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
  /** Only suggest breaks that include at least one public holiday. */
  requireHoliday?: boolean;
  /** Hide suggestions that start before today. */
  hidePastSuggestions?: boolean;
}

export interface SaveProfilePayload {
  name: string;
  avatar: string;
  color: string;
  country: string;
  city: string;
  isoCountryCode?: string;
  isoRegionCode?: string;
  holidaySource?: HolidaySource;
  weekendDays?: number[];
  customHolidays?: CustomHoliday[];
  totalAllowance: number;
  categories?: VacationCategory[];
}

export interface SaveVacationPayload {
  profileId: string;
  startDate: string;
  endDate: string;
  type: Vacation['type'];
  commuteHours: number;
  note?: string;
}
