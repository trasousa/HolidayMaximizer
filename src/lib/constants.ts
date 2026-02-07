import { VacationCategory } from './types';

export const DEFAULT_CATEGORIES: VacationCategory[] = [
  { id: 'PTO', name: 'Paid Time Off', color: '#7c3aed', isPto: true },
  { id: 'RemoteWork', name: 'Work Remote', color: '#3b82f6', isPto: false },
  { id: 'CommuteDay', name: 'Commute Day', color: '#f59e0b', isPto: false },
  { id: 'Unpaid', name: 'Unpaid', color: '#64748b', isPto: false },
];

export const APP_CONFIG = {
  name: 'Holiday Maximizer',
  version: '1.0.0',
  githubUrl: 'https://github.com/google-gemini/holiday-maximizer',
};
