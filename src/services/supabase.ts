/**
 * Supabase client — NOW SERVER-SIDE ONLY via /api/db-proxy
 * 
 * ⚠️ IMPORTANT: Supabase credentials are now managed by Vercel environment variables.
 * The browser no longer has access to SUPABASE_URL or SUPABASE_ANON_KEY.
 * All database operations go through /api/db-proxy (serverless function).
 * 
 * Required Vercel Environment Variables:
 *   SUPABASE_URL       → https://xxx.supabase.co
 *   SUPABASE_ANON_KEY  → eyJ... (from Supabase project settings)
 */

// This file is kept for backwards compatibility but is no longer used directly.
// All database operations now use the db.ts module which calls /api/db-proxy

export const supabase = {
  // Placeholder — all operations go through /api/db-proxy
  from: (table: string) => ({
    select: async () => ({ data: null, error: { message: 'Use loadTable() from db.ts instead' } }),
    insert: async () => ({ data: null, error: { message: 'Use appendRow() from db.ts instead' } }),
    upsert: async () => ({ data: null, error: { message: 'Use saveRow() from db.ts instead' } }),
    update: async () => ({ data: null, error: { message: 'Use saveRow() from db.ts instead' } }),
    delete: async () => ({ data: null, error: { message: 'Use deleteRow() from db.ts instead' } }),
  }),
};
