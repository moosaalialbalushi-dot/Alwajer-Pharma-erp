// api/ai-proxy.ts
// Vercel Serverless Function — all keys server-side only.
//
// Required Vercel Environment Variables:
//   ANTHROPIC_API_KEY    → sk-ant-...
//   GEMINI_API_KEY       → AIza...
//   OPENROUTER_API_KEY   → sk-or-... (from openrouter.ai)
//   GROQ_API_KEY         → gsk-... (from console.groq.com)
//   DEEPSEEK_API_KEY     → sk-... (optional, legacy)

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

  const { provider, system, messages, max_tokens = 2048, model, json_mode = false, clientApiKey } = req.body ?? {};

  if (!provider || !messages?.length) {
    return res.status(400).json({ error: 'Missing required fields: provider, messages' });
  }

  try {
    // ── ANTHROPIC CLAUDE ──────────────────────────────────────────
    if (provider === 'anthropic' || provider === 'claude') {
      const key = process.env.ANTHROPIC_API_KEY || clientApiKey;
      if (!key) return res.status(500).json({ error: 'Claude API key not set. Enter your key in Settings (gear icon) or add ANTHROPIC_API_KEY in Vercel → Settings → Environment Variables.' });

      const body: Record<string, unknown> = { model: model ?? 'claude-sonnet-4-6', max_tokens, messages };
      if (system) body.system = system;

      const upstream = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify(body),
      });
      const data = await upstream.json();
      if (!upstream.ok) throw new Error(data?.error?.message ?? JSON.stringify(data));
      return res.status(200).json(data);
    }

    // ── GOOGLE GEMINI ─────────────────────────────────────────────
    if (provider === 'gemini') {
      const key = process.env.GEMINI_API_KEY || clientApiKey;
      if (!key) return res.status(500).json({ error: 'Gemini API key not set. Enter your key in Settings (gear icon) or add GEMINI_API_KEY in Vercel → Settings → Environment Variables.' });

      const geminiModel = model ?? 'gemini-2.0-flash';
      const contents = messages.map((m: { role: string; content: string }) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));
      const body: Record<string, unknown> = { contents };
      if (system) body.systemInstruction = { parts: [{ text: system }] };
      if (json_mode) body.generationConfig = { responseMimeType: 'application/json' };

      const upstream = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${key}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      );
      const data = await upstream.json();
      if (!upstream.ok) throw new Error(data?.error?.message ?? JSON.stringify(data));
      return res.status(200).json(data);
    }

    // ── GROQ (OpenAI-compatible) ──────────────────────────────────
    if (provider === 'groq') {
      const key = process.env.GROQ_API_KEY || clientApiKey;
      if (!key) return res.status(500).json({
        error: '⚠️ GROQ_API_KEY not set. Add it in Vercel → Settings → Environment Variables. Get your free key from console.groq.com'
      });

      const groqMessages = system
        ? [{ role: 'system', content: system }, ...messages]
        : messages;

      const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: model ?? 'mixtral-8x7b-32768',
          messages: groqMessages,
          max_tokens,
        }),
      });
      const data = await upstream.json();
      if (!upstream.ok) throw new Error(data?.error?.message ?? JSON.stringify(data));
      return res.status(200).json(data);
    }

    // ── OPENROUTER ────────────────────────────────────────────────
    if (provider === 'openrouter') {
      const key = process.env.OPENROUTER_API_KEY;
      if (!key) return res.status(500).json({
        error: '⚠️ OPENROUTER_API_KEY not set. Add it in Vercel → Settings → Environment Variables. Get your free key from openrouter.ai'
      });

      const orMessages = system
        ? [{ role: 'system', content: system }, ...messages]
        : messages;

      const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
          'HTTP-Referer': 'https://alwajer-pharma-erp.vercel.app',
          'X-Title': 'Al Wajer Pharma ERP',
        },
        body: JSON.stringify({
          model: model ?? 'deepseek/deepseek-chat-v3-0324:free',
          messages: orMessages,
          max_tokens,
        }),
      });
      const data = await upstream.json();
      if (!upstream.ok) throw new Error(data?.error?.message ?? JSON.stringify(data));
      return res.status(200).json(data);
    }

    // ── DEEPSEEK (legacy kept for backward compatibility) ─────────
    if (provider === 'deepseek') {
      const key = process.env.DEEPSEEK_API_KEY;
      if (!key) return res.status(500).json({ error: 'DEEPSEEK_API_KEY not set. Consider switching to OpenRouter instead.' });

      const deepMessages = system
        ? [{ role: 'system', content: system }, ...messages]
        : messages;

      const upstream = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model: model ?? 'deepseek-chat', messages: deepMessages, max_tokens }),
      });
      const data = await upstream.json();
      if (!upstream.ok) throw new Error(data?.error?.message ?? JSON.stringify(data));
      return res.status(200).json(data);
    }

    return res.status(400).json({ error: `Unknown provider: "${provider}". Use: anthropic, gemini, groq, openrouter` });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[ai-proxy][${provider}]`, message);
    return res.status(500).json({ error: message });
  }
}
