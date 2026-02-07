import { nanoid } from 'nanoid';
import { db } from './indexedDb';
import { StorageDriver } from './types';
import { Profile, Vacation, UserSettings, SaveProfilePayload, SaveVacationPayload } from '../types';

export class LocalDriver implements StorageDriver {
  async getProfiles(): Promise<Profile[]> {
    const profiles = await db.profiles.toArray();
    const vacations = await db.vacations.toArray();
    
    return profiles.map(p => ({
      ...p,
      vacations: vacations.filter(v => v.profileId === p.id),
      holidays: [],
      suggestions: []
    }));
  }

  async createProfile(payload: SaveProfilePayload): Promise<Profile> {
    const profile: Profile = {
      ...payload,
      id: nanoid(),
      vacations: [],
      holidays: [],
      suggestions: []
    } as Profile;
    await db.profiles.add(profile);
    return profile;
  }

  async updateProfile(id: string, payload: SaveProfilePayload): Promise<Profile> {
    await db.profiles.update(id, payload);
    const updated = await db.profiles.get(id);
    if (!updated) throw new Error('Profile not found');
    const vacations = await db.vacations.where('profileId').equals(id).toArray();
    return { ...updated, vacations, holidays: [], suggestions: [] };
  }

  async deleteProfile(id: string): Promise<void> {
    await db.transaction('rw', db.profiles, db.vacations, async () => {
      await db.profiles.delete(id);
      await db.vacations.where('profileId').equals(id).delete();
    });
  }

  async createVacation(payload: SaveVacationPayload): Promise<Vacation> {
    const vacation: Vacation = {
      ...payload,
      id: nanoid(),
    };
    await db.vacations.add(vacation);
    return vacation;
  }

  async updateVacation(id: string, payload: Omit<SaveVacationPayload, 'profileId'>): Promise<Vacation> {
    await db.vacations.update(id, payload);
    const updated = await db.vacations.get(id);
    if (!updated) throw new Error('Vacation not found');
    return updated;
  }

  async deleteVacation(id: string): Promise<void> {
    await db.vacations.delete(id);
  }

  async getSettings(): Promise<UserSettings> {
    const settings = await db.settings.get(1);
    if (!settings) {
      const defaults: UserSettings = {
        year: new Date().getFullYear(),
        minPtoDays: 1,
        maxPtoDays: 5,
        minEfficiency: 1.5
      };
      await db.settings.add({ ...defaults, id: 1 });
      return defaults;
    }
    const { id: _, ...rest } = settings;
    return rest;
  }

  async updateSettings(payload: UserSettings): Promise<UserSettings> {
    await db.settings.put({ ...payload, id: 1 });
    return payload;
  }

  async exportData(): Promise<string> {
    const profiles = await db.profiles.toArray();
    const vacations = await db.vacations.toArray();
    const settings = await db.settings.get(1);
    return JSON.stringify({ profiles, vacations, settings, version: 1, timestamp: new Date().toISOString() });
  }

  async importData(json: string): Promise<void> {
    const data = JSON.parse(json);
    await db.transaction('rw', db.profiles, db.vacations, db.settings, async () => {
      await db.profiles.clear();
      await db.vacations.clear();
      await db.settings.clear();
      
      if (data.profiles) await db.profiles.bulkAdd(data.profiles);
      if (data.vacations) await db.vacations.bulkAdd(data.vacations);
      if (data.settings) await db.settings.put(data.settings);
    });
  }
}
