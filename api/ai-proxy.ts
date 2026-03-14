// api/ai-proxy.ts
// Vercel Serverless Function — runs server-side, keys never reach the browser.
//
// Required Vercel Environment Variables (Dashboard → Settings → Environment Variables):
//   ANTHROPIC_API_KEY   → sk-ant-...
//   GEMINI_API_KEY      → AIza...
//   DEEPSEEK_API_KEY    → sk-...

import type { VercelRequest, VercelResponse } from '@vercel/node';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function setCORS(res: VercelResponse) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCORS(res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { provider, system, messages, max_tokens = 2048, model, json_mode = false } = req.body ?? {};

  if (!provider || !messages?.length) {
    return res.status(400).json({ error: 'Missing required fields: provider, messages' });
  }

  try {
    // ── ANTHROPIC CLAUDE ──────────────────────────────────────────────────────
    if (provider === 'anthropic') {
      const key = process.env.ANTHROPIC_API_KEY;
      if (!key) {
        return res.status(500).json({
          error: 'ANTHROPIC_API_KEY is not set. Go to Vercel Dashboard → Settings → Environment Variables and add it, then redeploy.'
        });
      }

      const body: Record<string, unknown> = {
        model: model ?? 'claude-sonnet-4-6',
        max_tokens,
        messages,
      };
      if (system) body.system = system;

      const upstream = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
      });

      const data = await upstream.json();
      if (!upstream.ok) throw new Error(data?.error?.message ?? JSON.stringify(data));
      return res.status(200).json(data);
    }

    // ── GOOGLE GEMINI ─────────────────────────────────────────────────────────
    if (provider === 'gemini') {
      const key = process.env.GEMINI_API_KEY;
      if (!key) {
        return res.status(500).json({
          error: 'GEMINI_API_KEY is not set. Go to Vercel Dashboard → Settings → Environment Variables and add it, then redeploy.'
        });
      }

      const geminiModel = model ?? 'gemini-2.0-flash';
      const contents = messages.map((m: { role: string; content: string }) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      const body: Record<string, unknown> = { contents };
      if (system) body.systemInstruction = { parts: [{ text: system }] };

      // JSON mode — tells Gemini to respond with valid JSON
      if (json_mode) {
        body.generationConfig = { responseMimeType: 'application/json' };
      }

      const upstream = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );

      const data = await upstream.json();
      if (!upstream.ok) throw new Error(data?.error?.message ?? JSON.stringify(data));
      return res.status(200).json(data);
    }

    // ── DEEPSEEK ──────────────────────────────────────────────────────────────
    if (provider === 'deepseek') {
      const key = process.env.DEEPSEEK_API_KEY;
      if (!key) {
        return res.status(500).json({
          error: 'DEEPSEEK_API_KEY is not set. Go to Vercel Dashboard → Settings → Environment Variables and add it, then redeploy.'
        });
      }

      const deepSeekMessages = system
        ? [{ role: 'system', content: system }, ...messages]
        : messages;

      const upstream = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: model ?? 'deepseek-chat',
          messages: deepSeekMessages,
          max_tokens,
        }),
      });

      const data = await upstream.json();
      if (!upstream.ok) throw new Error(data?.error?.message ?? JSON.stringify(data));
      return res.status(200).json(data);
    }

    return res.status(400).json({ error: `Unknown provider: "${provider}". Use: anthropic, gemini, deepseek` });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[ai-proxy][${provider}]`, message);
    return res.status(500).json({ error: message });
  }
}
