// supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

// Vite exposes env vars via import.meta.env (not process.env)
// These must be prefixed with VITE_ to reach the browser bundle.
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) ?? '';
const supabaseKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ?? '';

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    '[Supabase] Missing environment variables.\n' +
    'Local dev: add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local\n' +
    'Production: add them in Vercel → Settings → Environment Variables'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder'
);
