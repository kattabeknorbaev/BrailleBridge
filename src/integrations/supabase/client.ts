import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

/**
 * Supabase powers the optional cloud features (AI text recognition and the
 * feedback form). Without credentials the rest of the app still works:
 * translation, file import and on-device OCR all run in the browser.
 */
export const cloudAvailable = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);

let client: Promise<SupabaseClient<Database> | null> | null = null;

/** The Supabase client, loaded on first use so it is not part of the initial download. */
export function getSupabase(): Promise<SupabaseClient<Database> | null> {
  if (!cloudAvailable) return Promise.resolve(null);
  client ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient<Database>(SUPABASE_URL!, SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    }),
  );
  return client;
}
