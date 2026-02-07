import Dexie, { type Table } from 'dexie';
import { Profile, Vacation, UserSettings } from '../types';

export class AppDatabase extends Dexie {
  profiles!: Table<Profile>;
  vacations!: Table<Vacation>;
  settings!: Table<UserSettings & { id: number }>;

  constructor() {
    super('HolidayMaximizerDB');
    this.version(1).stores({
      profiles: 'id, name, country, city',
      vacations: 'id, profileId, startDate, endDate, type',
      settings: 'id',
    });
  }
}

export const db = new AppDatabase();
