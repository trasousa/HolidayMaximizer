import { nanoid } from 'nanoid';
import type { UpdateSpec } from 'dexie';
import { db } from './indexedDb';
import { StorageDriver } from './types';
import { DEFAULT_SETTINGS } from '../constants';
import { Profile, Vacation, UserSettings, SaveProfilePayload, SaveVacationPayload } from '../types';

const BACKUP_VERSION = 2;

const withDefaults = (settings: Partial<UserSettings>): UserSettings => ({
  year: new Date().getFullYear(),
  ...DEFAULT_SETTINGS,
  ...settings,
});

const byStartDate = (a: Vacation, b: Vacation) => a.startDate.localeCompare(b.startDate);

export class LocalDriver implements StorageDriver {
  async getProfiles(): Promise<Profile[]> {
    const [profiles, vacations] = await Promise.all([db.profiles.toArray(), db.vacations.toArray()]);

    return profiles
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((p) => ({
        ...p,
        vacations: vacations.filter((v) => v.profileId === p.id).sort(byStartDate),
        holidays: [],
        suggestions: [],
      }));
  }

  async createProfile(payload: SaveProfilePayload): Promise<Profile> {
    const profile: Profile = {
      categories: [],
      customHolidays: [],
      ...payload,
      id: nanoid(),
      vacations: [],
      holidays: [],
      suggestions: [],
    };
    await db.profiles.add(profile);
    return profile;
  }

  async updateProfile(id: string, payload: SaveProfilePayload): Promise<Profile> {
    await db.profiles.update(id, payload as UpdateSpec<Profile>);
    const updated = await db.profiles.get(id);
    if (!updated) throw new Error('Profile not found');
    const vacations = await db.vacations.where('profileId').equals(id).toArray();
    return { ...updated, vacations: vacations.sort(byStartDate), holidays: [], suggestions: [] };
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
      const defaults = withDefaults({});
      // `put` (not `add`) so two concurrent first loads cannot collide on the key.
      await db.settings.put({ ...defaults, id: 1 });
      return defaults;
    }
    const { id: _, ...rest } = settings;
    return withDefaults(rest);
  }

  async updateSettings(payload: UserSettings): Promise<UserSettings> {
    await db.settings.put({ ...payload, id: 1 });
    return payload;
  }

  async exportData(): Promise<string> {
    const [profiles, vacations, settings] = await Promise.all([
      db.profiles.toArray(),
      db.vacations.toArray(),
      db.settings.get(1),
    ]);
    return JSON.stringify(
      { app: 'holiday-maximizer', version: BACKUP_VERSION, timestamp: new Date().toISOString(), profiles, vacations, settings },
      null,
      2
    );
  }

  async importData(json: string): Promise<void> {
    const data = JSON.parse(json);
    if (!data || !Array.isArray(data.profiles) || !Array.isArray(data.vacations)) {
      throw new Error('This file is not a Holiday Maximizer backup.');
    }
    await db.transaction('rw', db.profiles, db.vacations, db.settings, async () => {
      await db.profiles.clear();
      await db.vacations.clear();
      await db.settings.clear();

      await db.profiles.bulkPut(data.profiles);
      await db.vacations.bulkPut(data.vacations);
      if (data.settings) await db.settings.put({ ...data.settings, id: 1 });
    });
  }
}
