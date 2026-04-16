// api/ai-chain.ts
// Simplified Triple-Step Chain using ONLY Claude
import type { VercelRequest, VercelResponse } from '@vercel/node';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

async function callClaude(key: string, system: string, userMsg: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      system,
      messages: [{ role: 'user', content: userMsg }],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? JSON.stringify(data));
  return (data?.content as { type: string; text?: string }[])
    ?.filter(b => b.type === 'text')
    .map(b => b.text ?? '')
    .join('\n') ?? '';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { query, context = '', domain = 'pharma' } = req.body ?? {};
  if (!query) return res.status(400).json({ error: 'Missing required field: query' });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(500).json({ error: 'ANTHROPIC_API_KEY missing in Vercel.' });

  const domainContext = domain === 'pharma'
    ? 'Al Wajer Pharmaceuticals, Sohar Oman — GMP compliant, exports to GCC/MENA. Products: Esomeprazole, Pantoprazole, Omeprazole.'
    : `Business context: ${domain}`;

  try {
    // STEP 1: Draft
    const draft = await callClaude(key, `You are an AI Assistant. Context: ${domainContext}. Draft a comprehensive answer to: ${query}`, `Analyze and answer: ${query}`);
    
    // STEP 2: Critique
    const critique = await callClaude(key, `You are a Quality Validator. Review this draft for errors. Context: ${domainContext}. Output VERDICT and CORRECTIONS.`, `Draft to review: ${draft}`);
    
    // STEP 3: Final
    const final = await callClaude(key, `You are the Final Expert. Combine the draft and critique into a perfect answer. Context: ${domainContext}.`, `Draft: ${draft}\nCritique: ${critique}`);

    return res.status(200).json({ result: final });
  } catch (err: unknown) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Chain failed' });
  }
}

