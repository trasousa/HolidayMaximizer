import { LocalDriver } from './localDriver';
import { RemoteDriver } from './remoteDriver';
import { StorageDriver } from './types';

const mode = import.meta.env.VITE_APP_MODE || 'SERVER_BASED';

export const storage: StorageDriver = mode === 'LOCAL_FIRST' 
  ? new LocalDriver() 
  : new RemoteDriver();

console.log(`[Storage] Running in ${mode} mode`);
