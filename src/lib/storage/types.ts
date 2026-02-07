import { Profile, Vacation, UserSettings, SaveProfilePayload, SaveVacationPayload, Holiday } from '../types';

export interface StorageDriver {
  // Profiles
  getProfiles(): Promise<Profile[]>;
  createProfile(payload: SaveProfilePayload): Promise<Profile>;
  updateProfile(id: string, payload: SaveProfilePayload): Promise<Profile>;
  deleteProfile(id: string): Promise<void>;

  // Vacations
  createVacation(payload: SaveVacationPayload): Promise<Vacation>;
  updateVacation(id: string, payload: Omit<SaveVacationPayload, 'profileId'>): Promise<Vacation>;
  deleteVacation(id: string): Promise<void>;

  // Settings
  getSettings(): Promise<UserSettings>;
  updateSettings(payload: UserSettings): Promise<UserSettings>;

  // Backup
  exportData(): Promise<string>;
  importData(json: string): Promise<void>;
}
