import type { VercelRequest, VercelResponse } from '@vercel/node';

// Simple proxy to a local Ollama instance. This file expects Ollama to be running
// on the same host at port 11434. It forwards a POST body with { model, prompt }
// and returns the Ollama response. This is intentionally minimal — secure and
// production-ready proxies require auth and rate-limiting.

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { model, prompt } = req.body ?? {};
  if (!model || !prompt) return res.status(400).json({ error: 'Missing model or prompt' });

  try {
    const ollamaRes = await fetch(`http://127.0.0.1:11434/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt }),
    });

    const data = await ollamaRes.json();
    if (!ollamaRes.ok) return res.status(500).json({ error: 'Ollama error', details: data });
    return res.status(200).json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[ollama-proxy]', msg);
    return res.status(500).json({ error: 'Ollama proxy failed', message: msg });
  }
}
