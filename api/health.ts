// api/health.ts — Vercel Serverless Function
// Tests Supabase connectivity and reports which environment variables are configured.
// Used by the Settings modal "Test Connection" button.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabaseUrl  = process.env.SUPABASE_URL   || '';
  const supabaseKey  = process.env.SUPABASE_ANON_KEY || '';
  const geminiKey    = process.env.GEMINI_API_KEY   || '';
  const anthropicKey = process.env.ANTHROPIC_API_KEY || '';

  const envStatus = {
    SUPABASE_URL:        supabaseUrl  ? '✓ Set' : '✗ Missing',
    SUPABASE_ANON_KEY:   supabaseKey  ? '✓ Set' : '✗ Missing',
    GEMINI_API_KEY:      geminiKey    ? '✓ Set' : '✗ Missing',
    ANTHROPIC_API_KEY:   anthropicKey ? '✓ Set' : '✗ Missing',
  };

  // Test Supabase connection
  let supabaseStatus = 'not_configured';
  let supabaseError  = '';
  let tableCount     = 0;

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      // Simple ping: list tables in public schema
      const { data, error } = await supabase
        .from('batches')
        .select('id', { count: 'exact', head: true });
      if (error) {
        supabaseStatus = 'error';
        supabaseError  = error.message;
      } else {
        supabaseStatus = 'connected';
        tableCount = data ? (data as unknown[]).length : 0;
      }
    } catch (err) {
      supabaseStatus = 'error';
      supabaseError  = err instanceof Error ? err.message : String(err);
    }
  }

  return res.status(200).json({
    ok: supabaseStatus === 'connected',
    timestamp: new Date().toISOString(),
    env: envStatus,
    supabase: {
      status:     supabaseStatus,
      error:      supabaseError || null,
      tableCount,
    },
  });
}
