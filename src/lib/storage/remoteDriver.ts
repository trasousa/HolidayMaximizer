import * as api from '../../features/profiles/api/profileApi';
import { StorageDriver } from './types';
import { Profile, Vacation, UserSettings, SaveProfilePayload, SaveVacationPayload } from '../types';

export class RemoteDriver implements StorageDriver {
  getProfiles(): Promise<Profile[]> {
    return api.fetchProfiles();
  }

  createProfile(payload: SaveProfilePayload): Promise<Profile> {
    return api.createProfile(payload);
  }

  updateProfile(id: string, payload: SaveProfilePayload): Promise<Profile> {
    return api.updateProfile(id, payload);
  }

  deleteProfile(id: string): Promise<void> {
    return api.deleteProfile(id);
  }

  createVacation(payload: SaveVacationPayload): Promise<Vacation> {
    return api.createVacation(payload);
  }

  updateVacation(id: string, payload: Omit<SaveVacationPayload, 'profileId'>): Promise<Vacation> {
    return api.updateVacationRequest(id, payload);
  }

  deleteVacation(id: string): Promise<void> {
    return api.deleteVacationRequest(id);
  }

  getSettings(): Promise<UserSettings> {
    return api.fetchSettings();
  }

  updateSettings(payload: UserSettings): Promise<UserSettings> {
    return api.updateSettingsRequest(payload);
  }

  async exportData(): Promise<string> {
    throw new Error('Export not supported in SERVER_BASED mode. Please backup your NAS database.');
  }

  async importData(): Promise<void> {
    throw new Error('Import not supported in SERVER_BASED mode.');
  }
}
