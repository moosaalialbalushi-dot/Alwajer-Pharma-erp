
import { createClient } from '@supabase/supabase-js';

// NEXT_PUBLIC prefix is required for Next.js to expose these to the browser
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || localStorage.getItem('erp_supabase_url') || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || localStorage.getItem('erp_supabase_key') || '';

let client: any;

// Validate configuration
const isConfigured = SUPABASE_URL && SUPABASE_URL.startsWith('http');

if (isConfigured) {
  try {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (e) {
    console.warn("Supabase client init failed", e);
  }
}

if (!client) {
  // Mock client that fails gracefully if env vars are missing
  console.warn("Supabase credentials missing. App running in offline/demo mode.");
  client = {
    from: (table: string) => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: null, error: null }), // Return null error to simulate success in demo
      update: () => Promise.resolve({ data: null, error: null }),
      delete: () => Promise.resolve({ data: null, error: null }),
    })
  };
}

export const supabase = client;
