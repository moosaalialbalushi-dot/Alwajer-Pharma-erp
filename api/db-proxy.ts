// api/db-proxy.ts
// Vercel Serverless Function — Supabase operations server-side only
//
// Required Vercel Environment Variables:
//   SUPABASE_URL       → https://xxx.supabase.co
//   SUPABASE_ANON_KEY  → eyJ... (anon key from Supabase project settings)

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('[db-proxy] Missing SUPABASE_URL or SUPABASE_ANON_KEY in Vercel environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action, table, data, id } = req.body ?? {};

  if (!table) {
    return res.status(400).json({ error: 'Missing required field: table' });
  }

  try {
    // ── SELECT (READ) ──────────────────────────────────────────
    if (action === 'select' || req.method === 'GET') {
      const { data: rows, error } = await supabase.from(table).select('*');
      if (error) throw new Error(error.message);
      return res.status(200).json({ data: rows });
    }

    // ── INSERT ─────────────────────────────────────────────────
    if (action === 'insert' || (req.method === 'POST' && !id)) {
      const { data: inserted, error } = await supabase.from(table).insert(data as never);
      if (error) throw new Error(error.message);
      return res.status(201).json({ data: inserted });
    }

    // ── UPSERT ─────────────────────────────────────────────────
    if (action === 'upsert') {
      const { data: upserted, error } = await supabase.from(table).upsert(data as never);
      if (error) throw new Error(error.message);
      return res.status(200).json({ data: upserted });
    }

    // ── UPDATE ─────────────────────────────────────────────────
    if (action === 'update' || (req.method === 'PUT' && id)) {
      const { data: updated, error } = await supabase
        .from(table)
        .update(data as never)
        .eq('id', id);
      if (error) throw new Error(error.message);
      return res.status(200).json({ data: updated });
    }

    // ── DELETE ─────────────────────────────────────────────────
    if (action === 'delete' || (req.method === 'DELETE' && id)) {
      const { data: deleted, error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);
      if (error) throw new Error(error.message);
      return res.status(200).json({ data: deleted });
    }

    return res.status(400).json({ error: `Unknown action: "${action}"` });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[db-proxy][${table}][${action}]`, message);
    return res.status(500).json({ error: message });
  }
}
