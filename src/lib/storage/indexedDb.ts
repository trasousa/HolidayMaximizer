import Dexie, { type Table } from 'dexie';
import { Profile, Vacation, UserSettings } from '../types';

export interface CacheEntry {
  key: string;
  fetchedAt: number;
  value: unknown;
}

export class AppDatabase extends Dexie {
  profiles!: Table<Profile>;
  vacations!: Table<Vacation>;
  settings!: Table<UserSettings & { id: number }>;
  cache!: Table<CacheEntry>;

  constructor() {
    super('HolidayMaximizerDB');
    this.version(1).stores({
      profiles: 'id, name, country, city',
      vacations: 'id, profileId, startDate, endDate, type',
      settings: 'id',
    });
    // v2: offline cache for holiday / country / region API responses.
    this.version(2).stores({
      cache: 'key, fetchedAt',
    });
  }
}

export const db = new AppDatabase();

/**
 * Ask the browser to keep our IndexedDB data even under storage pressure.
 * Without this, Safari and Chrome may evict "best-effort" storage after a
 * period of inactivity and the user's plan would silently disappear.
 */
export const requestPersistentStorage = async (): Promise<boolean> => {
  try {
    if (!navigator.storage?.persist) return false;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
};
