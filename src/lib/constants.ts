import { VacationCategory } from './types';

export const DEFAULT_CATEGORIES: VacationCategory[] = [
  { id: 'PTO', name: 'Paid Time Off', color: '#7c3aed', isPto: true },
  { id: 'RemoteWork', name: 'Work Remote', color: '#3b82f6', isPto: false },
  { id: 'CommuteDay', name: 'Commute Day', color: '#f59e0b', isPto: false },
  { id: 'Unpaid', name: 'Unpaid', color: '#64748b', isPto: false },
];

/** Countries whose standard weekend is not Saturday + Sunday (0 = Sunday … 6 = Saturday). */
const WEEKEND_BY_COUNTRY: Record<string, number[]> = {
  // Friday + Saturday
  BH: [5, 6],
  BD: [5, 6],
  DZ: [5, 6],
  EG: [5, 6],
  IL: [5, 6],
  IQ: [5, 6],
  JO: [5, 6],
  KW: [5, 6],
  LY: [5, 6],
  MV: [5, 6],
  OM: [5, 6],
  QA: [5, 6],
  SA: [5, 6],
  SD: [5, 6],
  SY: [5, 6],
  YE: [5, 6],
  // Single-day weekends
  AF: [4, 5],
  IR: [5],
  NP: [6],
};

export const defaultWeekendFor = (countryCode?: string): number[] =>
  (countryCode && WEEKEND_BY_COUNTRY[countryCode.toUpperCase()]) || [0, 6];

export const DEFAULT_SETTINGS = {
  minPtoDays: 1,
  maxPtoDays: 5,
  minEfficiency: 1.6,
  requireHoliday: true,
  hidePastSuggestions: true,
};

export const APP_CONFIG = {
  name: 'Holiday Maximizer',
  version: '2.0.0',
  githubUrl: 'https://github.com/trasousa/HolidayMaximizer',
};
