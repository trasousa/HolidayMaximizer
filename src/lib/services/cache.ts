import { db } from '@/lib/storage/indexedDb';

export interface CachedResult<T> {
  value: T;
  fetchedAt: number;
  /** True when the network failed and an expired copy was served instead. */
  stale: boolean;
}

interface CacheOptions {
  /** Ignore the cached copy and hit the network (still falls back to it offline). */
  force?: boolean;
}

const inflight = new Map<string, Promise<CachedResult<unknown>>>();

const readEntry = async (key: string) => {
  try {
    return await db.cache.get(key);
  } catch {
    return undefined;
  }
};

/**
 * Stale-while-offline cache backed by IndexedDB.
 * Fresh entries are served directly; expired ones are refreshed, and if the
 * network is unavailable the expired copy is returned so the app keeps working.
 */
export const cached = <T>(key: string, ttlMs: number, fetcher: () => Promise<T>, options: CacheOptions = {}): Promise<CachedResult<T>> => {
  const pending = inflight.get(key);
  if (pending && !options.force) return pending as Promise<CachedResult<T>>;

  const run = (async (): Promise<CachedResult<T>> => {
    const entry = await readEntry(key);
    if (entry && !options.force && Date.now() - entry.fetchedAt < ttlMs) {
      return { value: entry.value as T, fetchedAt: entry.fetchedAt, stale: false };
    }
    try {
      const value = await fetcher();
      const fetchedAt = Date.now();
      await db.cache.put({ key, fetchedAt, value }).catch(() => undefined);
      return { value, fetchedAt, stale: false };
    } catch (error) {
      if (entry) return { value: entry.value as T, fetchedAt: entry.fetchedAt, stale: true };
      throw error;
    }
  })();

  inflight.set(key, run);
  run.finally(() => inflight.delete(key)).catch(() => undefined);
  return run;
};

export const clearApiCache = () => db.cache.clear();

export const DAY = 24 * 60 * 60 * 1000;
