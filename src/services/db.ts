/**
 * Persistence layer — Supabase primary, localStorage fallback.
 *
 * If Supabase env vars are configured and tables exist, data is read/written
 * to the cloud. If Supabase is unreachable or tables are missing, the layer
 * silently falls back to localStorage so the app never loses data.
 *
 * SQL migration (run once in Supabase SQL editor):
 * see /supabase/schema.sql
 */
import { supabase } from './supabase';

const LS_PREFIX = 'erp_v2_';

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

function hasSupabase(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  return Boolean(url && key && url !== 'https://placeholder.supabase.co');
}

export async function loadTable<T>(table: Table, initial: T[]): Promise<T[]> {
  // Always seed localStorage with initial data on first run
  const cached = readLS<T>(table, []);
  if (cached.length === 0 && initial.length > 0) {
    writeLS(table, initial);
  }

  if (!hasSupabase()) return readLS<T>(table, initial);

  try {
    const { data, error } = await supabase.from(table).select('*');
    if (error) {
      console.warn(`[db] Supabase read failed for ${table}, using localStorage:`, error.message);
      return readLS<T>(table, initial);
    }
    if (data && data.length > 0) {
      writeLS(table, data as T[]);
      return data as T[];
    }
    // Supabase returned empty - seed with initial data
    if (initial.length > 0) {
      await supabase.from(table).insert(initial as never[]);
      writeLS(table, initial);
      return initial;
    }
    return [];
  } catch (e) {
    console.warn(`[db] Supabase error for ${table}:`, e);
    return readLS<T>(table, initial);
  }
}

export async function saveRow<T extends { id: string }>(table: Table, row: T): Promise<void> {
  // Update localStorage immediately (synchronous safety net)
  const rows = readLS<T>(table, []);
  const idx = rows.findIndex(r => r.id === row.id);
  if (idx >= 0) rows[idx] = row; else rows.push(row);
  writeLS(table, rows);

  if (!hasSupabase()) return;
  try {
    const { error } = await supabase.from(table).upsert(row as never);
    if (error) console.warn(`[db] upsert ${table} failed:`, error.message);
  } catch (e) {
    console.warn(`[db] upsert ${table} error:`, e);
  }
}

export async function deleteRow(table: Table, id: string): Promise<void> {
  const rows = readLS<{ id: string }>(table, []);
  writeLS(table, rows.filter(r => r.id !== id));

  if (!hasSupabase()) return;
  try {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) console.warn(`[db] delete ${table} failed:`, error.message);
  } catch (e) {
    console.warn(`[db] delete ${table} error:`, e);
  }
}

export async function appendRow<T>(table: Table, row: T): Promise<void> {
  const rows = readLS<T>(table, []);
  rows.unshift(row);
  // Cap audit logs at 500 entries to prevent localStorage overflow
  if (table === 'audit_logs' && rows.length > 500) rows.length = 500;
  writeLS(table, rows);

  if (!hasSupabase()) return;
  try {
    const { error } = await supabase.from(table).insert(row as never);
    if (error) console.warn(`[db] insert ${table} failed:`, error.message);
  } catch (e) {
    console.warn(`[db] insert ${table} error:`, e);
  }
}
