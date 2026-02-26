
import { createClient } from '@supabase/supabase-js';

// Vite exposes env vars via import.meta.env (VITE_ prefix)
// Fallback to hardcoded values so the app always connects
const SUPABASE_URL =
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  'https://dqsriohrazmlikwjwbot.supabase.co';

const SUPABASE_ANON_KEY =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxc3Jpb2hyYXptbGlrd2p3Ym90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0OTAwNDgsImV4cCI6MjA4NjA2NjA0OH0.PMT_TgFaie6ntF0g0NXyxhgfPSCX_W3tvxm7jVXVnVQ';

let client: any;

try {
  client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log('✅ Supabase connected:', SUPABASE_URL);
} catch (e) {
  console.error('❌ Supabase client init failed', e);
  client = {
    from: (_table: string) => ({
      select: () => Promise.resolve({ data: [], error: { message: 'Supabase init failed' } }),
      insert: () => Promise.resolve({ data: null, error: { message: 'Supabase init failed' } }),
      update: () => Promise.resolve({ data: null, error: { message: 'Supabase init failed' } }),
      delete: () => Promise.resolve({ data: null, error: { message: 'Supabase init failed' } }),
    })
  };
}

export const supabase = client;
