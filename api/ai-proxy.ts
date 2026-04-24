// api/ai-proxy.ts — server-side proxy for Claude and Gemini
// Keys come exclusively from Vercel env vars — never from the browser.
import type { VercelRequest, VercelResponse } from '@vercel/node';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { provider = 'claude', system, messages, max_tokens = 2048, model } = req.body ?? {};

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Missing messages' });
  }

  // ── GEMINI ──────────────────────────────────────────────────────────────────
  if (provider === 'gemini') {
    const key = process.env.GEMINI_API_KEY;
    if (!key) return res.status(500).json({ error: 'GEMINI_API_KEY not configured in Vercel env vars. Add it in Vercel → Settings → Environment Variables.' });

    const geminiModel = model ?? 'gemini-2.0-flash';
    const contents = (messages as { role: string; content: string }[]).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
    const geminiBody: Record<string, unknown> = { contents };
    if (system) geminiBody.systemInstruction = { parts: [{ text: system }] };

    try {
      const upstream = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${key}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(geminiBody) }
      );
      const data = await upstream.json();
      if (!upstream.ok) return res.status(upstream.status).json({ error: (data as any)?.error?.message || 'Gemini upstream error' });
      return res.status(200).json(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gemini request failed';
      console.error('[ai-proxy][gemini]', message);
      return res.status(500).json({ error: message });
    }
  }

  // ── CLAUDE ──────────────────────────────────────────────────────────────────
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured in Vercel env vars. Add it in Vercel → Settings → Environment Variables.' });

  const claudeBody: Record<string, unknown> = {
    model: model ?? 'claude-3-5-sonnet-20241022',
    max_tokens,
    messages,
  };
  if (system) claudeBody.system = system;

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify(claudeBody),
    });
    const data = await upstream.json();
    if (!upstream.ok) return res.status(upstream.status).json({ error: (data as any)?.error?.message || 'Claude upstream error', details: data });
    return res.status(200).json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Claude request failed';
    console.error('[ai-proxy][claude]', message);
    return res.status(500).json({ error: message });
  }
}

