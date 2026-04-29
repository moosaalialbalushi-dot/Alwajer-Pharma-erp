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

/**
 * Coerce data to match expected types (numbers, dates) before persistence.
 */
function cleanRow<T>(row: T): T {
  if (!row || typeof row !== 'object') return row;
  const out = { ...row } as any;
  const numFields = [
    'quantity', 'rateUSD', 'amountUSD', 'amountOMR', 'amount', 'salary',
    'stock', 'requiredForOrders', 'balanceToPurchase', 'actualYield',
    'expectedYield', 'rating', 'probability', 'optimizationScore',
    'cost', 'ratePerKg', 'totalInvoice', 'volume', 'min_order_qty',
    'lead_time_days', 'price_usd', 'price_sdg', 'price_omr'
  ];

  for (const [key, val] of Object.entries(out)) {
    // 1. Force numbers
    if (numFields.includes(key)) {
      const n = Number(val);
      out[key] = isNaN(n) ? 0 : n;
    }
    // 2. Standardize dates (YYYY-MM-DD or ISO)
    if (key.toLowerCase().includes('date') || key === 'timestamp') {
      if (val && typeof val === 'string') {
        const d = new Date(val);
        if (!isNaN(d.getTime())) {
          out[key] = key === 'timestamp' ? d.toISOString() : d.toISOString().split('T')[0];
        }
      }
    }
    // 3. Trim strings
    if (typeof val === 'string') {
      out[key] = val.trim();
    }
  }
  return out;
}

export async function loadTable<T>(table: Table, initial: T[]): Promise<T[]> {
  // Always seed localStorage with initial data on first run
  const cached = readLS<T>(table, []);
  if (cached.length === 0 && initial.length > 0) {
    writeLS(table, initial.map(cleanRow));
  }

  // Try to fetch from server-side Supabase
  const { data, error } = await callDbProxy<T>('select', table);

  if (error) {
    console.warn(`[db] Supabase read failed for ${table}, using localStorage:`, error.message);
    return readLS<T>(table, initial).map(cleanRow);
  }

  if (data && data.length > 0) {
    const cleaned = data.map(cleanRow);
    writeLS(table, cleaned);
    return cleaned;
  }

  // Supabase returned empty - seed with initial data
  if (initial.length > 0) {
    const cleaned = initial.map(cleanRow);
    await callDbProxy<T>('insert', table, cleaned[0]);
    writeLS(table, cleaned);
    return cleaned;
  }

  return [];
}

export async function saveRow<T extends { id: string }>(table: Table, row: T): Promise<void> {
  const cleaned = cleanRow(row);
  // Update localStorage immediately (synchronous safety net)
  const rows = readLS<T>(table, []);
  const idx = rows.findIndex(r => r.id === cleaned.id);
  if (idx >= 0) rows[idx] = cleaned; else rows.push(cleaned);
  writeLS(table, rows);

  // Try to upsert to server-side Supabase
  const { error } = await callDbProxy<T>('upsert', table, cleaned);
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
  const cleaned = cleanRow(row);
  const rows = readLS<T>(table, []);
  rows.unshift(cleaned);
  // Cap audit logs at 500 entries to prevent localStorage overflow
  if (table === 'audit_logs' && rows.length > 500) rows.length = 500;
  writeLS(table, rows);

  // Try to insert to server-side Supabase
  const { error } = await callDbProxy<T>('insert', table, cleaned);
  if (error) console.warn(`[db] insert ${table} failed:`, error.message);
}
