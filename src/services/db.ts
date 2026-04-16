/**
 * Persistence layer — Supabase via /api/db-proxy (server-side), localStorage fallback.
 *
 * If Supabase is configured on Vercel and tables exist, data is read/written
 * to the cloud via the serverless function. If Supabase is unreachable or tables 
 * are missing, the layer silently falls back to localStorage so the app never loses data.
 *
 * SQL migration (run once in Supabase SQL editor):
 * see /supabase/schema.sql
 */

const LS_PREFIX = 'erp_v2_';
const DB_PROXY_URL = '/api/db-proxy';

export type Table =
  | 'batches' | 'inventory' | 'orders' | 'expenses' | 'employees'
  | 'vendors' | 'bd_leads' | 'samples' | 'markets' | 'rd_projects'
  | 'shipments' | 'audit_logs';

function lsKey(table: Table): string { return `${LS_PREFIX}${table}`; }

function readLS<T>(table: Table, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(lsKey(table));
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function writeLS<T>(table: Table, rows: T[]): void {
  try { localStorage.setItem(lsKey(table), JSON.stringify(rows)); } catch { /* quota */ }
}

/**
 * Call the server-side db-proxy endpoint
 */
async function callDbProxy<T>(
  action: 'select' | 'insert' | 'upsert' | 'update' | 'delete',
  table: Table,
  data?: T,
  id?: string
): Promise<{ data: T[] | null; error: Error | null }> {
  try {
    const res = await fetch(DB_PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, table, data, id }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    const result = await res.json();
    return { data: result.data || null, error: null };
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    return { data: null, error };
  }
}

export async function loadTable<T>(table: Table, initial: T[]): Promise<T[]> {
  // Always seed localStorage with initial data on first run
  const cached = readLS<T>(table, []);
  if (cached.length === 0 && initial.length > 0) {
    writeLS(table, initial);
  }

  // Try to fetch from server-side Supabase
  const { data, error } = await callDbProxy<T>('select', table);

  if (error) {
    console.warn(`[db] Supabase read failed for ${table}, using localStorage:`, error.message);
    return readLS<T>(table, initial);
  }

  if (data && data.length > 0) {
    writeLS(table, data);
    return data;
  }

  // Supabase returned empty - seed with initial data
  if (initial.length > 0) {
    await callDbProxy<T>('insert', table, initial[0]);
    writeLS(table, initial);
    return initial;
  }

  return [];
}

export async function saveRow<T extends { id: string }>(table: Table, row: T): Promise<void> {
  // Update localStorage immediately (synchronous safety net)
  const rows = readLS<T>(table, []);
  const idx = rows.findIndex(r => r.id === row.id);
  if (idx >= 0) rows[idx] = row; else rows.push(row);
  writeLS(table, rows);

  // Try to upsert to server-side Supabase
  const { error } = await callDbProxy<T>('upsert', table, row);
  if (error) console.warn(`[db] upsert ${table} failed:`, error.message);
}

export async function deleteRow(table: Table, id: string): Promise<void> {
  const rows = readLS<{ id: string }>(table, []);
  writeLS(table, rows.filter(r => r.id !== id));

  // Try to delete from server-side Supabase
  const { error } = await callDbProxy<{ id: string }>('delete', table, undefined, id);
  if (error) console.warn(`[db] delete ${table} failed:`, error.message);
}

export async function appendRow<T>(table: Table, row: T): Promise<void> {
  const rows = readLS<T>(table, []);
  rows.unshift(row);
  // Cap audit logs at 500 entries to prevent localStorage overflow
  if (table === 'audit_logs' && rows.length > 500) rows.length = 500;
  writeLS(table, rows);

  // Try to insert to server-side Supabase
  const { error } = await callDbProxy<T>('insert', table, row);
  if (error) console.warn(`[db] insert ${table} failed:`, error.message);
}
