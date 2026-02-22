import { createClient } from '@supabase/supabase-js';
import { MMKV } from 'react-native-mmkv';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './constants';

// Dedicated MMKV instance for auth session storage — much faster than AsyncStorage
const storage = new MMKV({ id: 'supabase-auth' });

const mmkvAdapter = {
  getItem: (key: string): string | null => {
    return storage.getString(key) ?? null;
  },
  setItem: (key: string, value: string): void => {
    storage.set(key, value);
  },
  removeItem: (key: string): void => {
    storage.delete(key);
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: mmkvAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export { storage as authStorage };
