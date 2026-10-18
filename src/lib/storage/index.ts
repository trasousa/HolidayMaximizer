import { LocalDriver } from './localDriver';
import { StorageDriver } from './types';

/** All data lives in the browser (IndexedDB), so the app runs as a static Cloudflare Pages site. */
export const storage: StorageDriver = new LocalDriver();

export { requestPersistentStorage } from './indexedDb';
