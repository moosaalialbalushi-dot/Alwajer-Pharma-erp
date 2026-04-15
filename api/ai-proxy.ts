// api/ai-proxy.ts
// Vercel Serverless Function — production-patched
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
      if (!key) return res.status(500).json({ error: 'ANTHROPIC_API_KEY missing. Add to Vercel Env Vars.' });

      const body: Record<string, unknown> = { model: model ?? 'claude-sonnet-4-6', max_tokens, messages };
      if (system) body.system = system;

      const upstream = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify(body),
      });
      const data = await upstream.json();
      if (!upstream.ok) return res.status(upstream.status).json({ error: data?.error?.message ?? 'Claude upstream error', details: data });
      return res.status(200).json(data);
    }

    // ── GOOGLE GEMINI ────────────────────────────────────────────
    if (provider === 'gemini') {
      const key = process.env.GEMINI_API_KEY || clientApiKey;
      if (!key) return res.status(500).json({ error: 'GEMINI_API_KEY missing. Add to Vercel Env Vars.' });

      let geminiModel = model ?? 'gemini-2.0-flash';
      
      // Map roles: assistant -> model (Gemini REST requirement)
      const contents = messages.map((m: { role: string; content: string }) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      const body: Record<string, unknown> = { contents };
      if (system) body.systemInstruction = { parts: [{ text: system }] };
      if (json_mode) body.generationConfig = { responseMimeType: 'application/json' };

      const attemptCall = async (mdl: string) => {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${mdl}:generateContent?key=${key}`;
        const upstream = await fetch(url, { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify(body) 
        });
        const data = await upstream.json();
        return { upstream, data };
      };

      let { upstream, data } = await attemptCall(geminiModel);
      
      // Auto-fallback if 2.0 fails (common in certain regions/quotas)
      if (!upstream.ok && geminiModel.includes('2.0')) {
        console.warn('[gemini] 2.0 failed, falling back to 1.5-flash');
        ({ upstream, data } = await attemptCall('gemini-1.5-flash'));
      }

      if (!upstream.ok) {
        console.error('[ai-proxy][gemini] Upstream error:', upstream.status, data);
        return res.status(upstream.status).json({ 
          error: data?.error?.message ?? 'Gemini upstream error', 
          code: data?.error?.code,
          details: data 
        });
      }

      return res.status(200).json(data);
    }

    // ── OPENROUTER ───────────────────────────────────────────────
    if (provider === 'openrouter') {
      const key = process.env.OPENROUTER_API_KEY;
      if (!key) return res.status(500).json({ error: 'OPENROUTER_API_KEY missing. Add to Vercel Env Vars.' });

      const orMessages = system ? [{ role: 'system', content: system }, ...messages] : messages;

      const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // Fixed typo here
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
      if (!upstream.ok) return res.status(upstream.status).json({ error: data?.error?.message ?? 'OpenRouter upstream error', details: data });
      return res.status(200).json(data);
    }

    // ── DEEPSEEK (legacy) ───────────────────────────────────────
    if (provider === 'deepseek') {
      const key = process.env.DEEPSEEK_API_KEY;
      if (!key) return res.status(500).json({ error: 'DEEPSEEK_API_KEY missing. Consider switching to OpenRouter.' });

      const deepMessages = system ? [{ role: 'system', content: system }, ...messages] : messages;
      const upstream = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model: model ?? 'deepseek-chat', messages: deepMessages, max_tokens }),
      });
      const data = await upstream.json();
      if (!upstream.ok) return res.status(upstream.status).json({ error: data?.error?.message ?? 'DeepSeek upstream error', details: data });
      return res.status(200).json(data);
    }

    return res.status(400).json({ error: `Unknown provider: "${provider}". Use: anthropic, gemini, openrouter, deepseek` });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[ai-proxy][${provider}]`, message);
    return res.status(500).json({ error: `Proxy internal error: ${message}` });
  }
}

