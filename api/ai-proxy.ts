// api/ai-proxy.ts
// Dedicated Proxy for Anthropic Claude
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

  const { system, messages, max_tokens = 2048, model, clientApiKey } = req.body ?? {};
  
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Missing messages' });
  }

  const key = process.env.ANTHROPIC_API_KEY || clientApiKey;
  if (!key) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is missing in Vercel Environment Variables.' });
  }

  // Build payload for Claude
  const body: Record<string, unknown> = {
    model: model ?? 'claude-3-5-sonnet-20241022', // Stable, high-intelligence model
    max_tokens,
    messages,
  };

  // Claude puts system prompt in a separate field
  if (system) body.system = system;

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body),
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      return res.status(upstream.status).json({ 
        error: data?.error?.message || 'Claude upstream error',
        details: data 
      });
    }

<<<<<<< HEAD
    return res.status(200).json(data);
=======
    // ── GOOGLE GEMINI ─────────────────────────────────────────────
    if (provider === 'gemini') {
      const key = process.env.GEMINI_API_KEY;
      if (!key) return res.status(500).json({ error: 'GEMINI_API_KEY not set in Vercel → Settings → Environment Variables.' });

      const geminiModel = model ?? 'gemini-2.5-pro';
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

    // ── OLLAMA (Local AI) ──────────────────────────────────────────
    if (provider === 'ollama') {
      const ollamaUrl = (process.env.OLLAMA_URL || 'http://localhost:11434').replace(/\/$/, '');
      const ollamaModel = model ?? 'gemma3:4b';

      const ollamaMessages = system
        ? [{ role: 'system', content: system }, ...messages]
        : messages;

      try {
        const upstream = await fetch(`${ollamaUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: ollamaModel,
            messages: ollamaMessages,
            stream: false,
          }),
        });
        const data = await upstream.json();
        if (!upstream.ok) throw new Error(data?.error ?? JSON.stringify(data));
        
        // Transform Ollama response to match Claude format
        return res.status(200).json({
          content: [{ type: 'text', text: data.message?.content ?? '' }],
          usage: { input_tokens: 0, output_tokens: 0 }
        });
      } catch (err) {
        return res.status(500).json({
          error: `Ollama connection failed. Ensure Ollama is running at ${ollamaUrl}. Download from ollama.ai`
        });
      }
    }

    return res.status(400).json({ error: `Unknown provider: "${provider}". Use: anthropic, gemini, ollama` });

>>>>>>> fad33ba (fix: update Gemini model to gemini-2.5-pro and remove deprecated gemini-2.0-flash references)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network request failed';
    console.error('[ai-proxy][claude]', message);
    return res.status(500).json({ error: message });
  }
}

