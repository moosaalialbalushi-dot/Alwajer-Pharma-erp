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

    return res.status(200).json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network request failed';
    console.error('[ai-proxy][claude]', message);
    return res.status(500).json({ error: message });
  }
}

