// api/ai-chain.ts
// Triple-LLM validation chain — Gemini → Claude → Qwen (replaces DeepSeek)
//
// Required Vercel env vars:
//   ANTHROPIC_API_KEY, GEMINI_API_KEY, QWEN_API_KEY

import type { VercelRequest, VercelResponse } from '@vercel/node';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

async function callGemini(key: string, system: string, userMsg: string, model = 'gemini-2.5-pro'): Promise<string> {
  const body: Record<string, unknown> = {
    contents: [{ role: 'user', parts: [{ text: userMsg }] }],
    systemInstruction: { parts: [{ text: system }] },
  };
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? JSON.stringify(data));
  return data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? '').join('') ?? '';
}

async function callClaude(key: string, system: string, userMsg: string, model = 'claude-sonnet-4-6'): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model, max_tokens: 2048, system, messages: [{ role: 'user', content: userMsg }] }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? JSON.stringify(data));
  return (data?.content as { type: string; text?: string }[])?.filter(b => b.type === 'text').map(b => b.text ?? '').join('\n') ?? '';
}

// Qwen replaces DeepSeek as the final validator
async function callQwen(key: string, system: string, userMsg: string, model = 'qwen-plus'): Promise<string> {
  const res = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      messages: [{ role: 'system', content: system }, { role: 'user', content: userMsg }],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? JSON.stringify(data));
  return data?.choices?.[0]?.message?.content ?? '';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { query, context = '', domain = 'pharma' } = req.body ?? {};
  if (!query) return res.status(400).json({ error: 'Missing required field: query' });

  const geminiKey = process.env.GEMINI_API_KEY;
  const claudeKey = process.env.ANTHROPIC_API_KEY;
  const qwenKey   = process.env.QWEN_API_KEY;

  if (!geminiKey || !claudeKey || !qwenKey) {
    const missing = [!geminiKey && 'GEMINI_API_KEY', !claudeKey && 'ANTHROPIC_API_KEY', !qwenKey && 'QWEN_API_KEY'].filter(Boolean);
    return res.status(500).json({ error: `Missing Vercel env vars: ${missing.join(', ')}. Add in Vercel → Settings → Environment Variables → Redeploy.` });
  }

  const domainContext = domain === 'pharma'
    ? 'Al Wajer Pharmaceuticals, Sohar Oman — pharmaceutical manufacturing (tablets, pellets, capsules). GMP compliant, exports to GCC/MENA. Key products: Esomeprazole, Pantoprazole, Omeprazole EC pellets.'
    : `Business context: ${domain}`;

  const contextBlock = context ? `\n\nAdditional context:\n${context}` : '';

  try {
    // Allow client to pass an ordered sequence for the 3 steps. Default order if not provided.
    const seq = Array.isArray(sequence) ? sequence.map((s: string) => String(s)) : ['Gemini', 'Claude', 'Qwen'];

    const responses: string[] = [];
    for (let i = 0; i < 3; i++) {
      const provider = (seq[i] || ['Gemini','Claude','Qwen'][i]).toLowerCase();
      // Role-specific prompt and call
      if (provider.includes('gemini')) {
        const prev = responses.join('\n\n');
        const prompt = i === 0
          ? `You are Al Wajer Pharmaceuticals AI Initiator.\nContext: ${domainContext}${contextBlock}\nGenerate a thorough first-draft response. Be comprehensive. Use specific numbers where possible.`
          : `You are Al Wajer Pharmaceuticals AI Initiator.\nContext: ${domainContext}${contextBlock}\nRefine the response considering prior outputs:\n${prev}`;
        const r = await callGemini(geminiKey, prompt, i === 0 ? query : `Original query: ${query}\n\nPrevious responses:\n${prev}`);
        responses.push(r);
      } else if (provider.includes('claude')) {
        const prev = responses.join('\n\n');
        const prompt = `You are Al Wajer Pharmaceuticals Quality Validator AI.\nContext: ${domainContext}\nReview the prior response(s) and output:\nVERDICT: [APPROVED / APPROVED WITH CORRECTIONS / REJECTED]\nCORRECTIONS: [list or \"None required\"]\nVALIDATED RESPONSE: [improved response]`;
        const r = await callClaude(claudeKey, prompt, `Original query: ${query}\n\nPrevious responses:\n${prev}`);
        responses.push(r);
      } else {
        // Qwen / DeepSeek fallback
        const prev = responses.join('\n\n');
        const prompt = `You are Al Wajer Pharmaceuticals Final Verification AI.\nContext: ${domainContext}\nProduce the definitive final answer resolving any conflicts.\nFormat:\nREASONING: [brief reasoning]\nCONSENSUS: [yes/partial/no]\nFINAL ANSWER: [definitive response]`;
        const r = await callQwen(qwenKey, prompt, `Original query: ${query}\n\nPrevious responses:\n${prev}`);
        responses.push(r);
      }
    }

    return res.status(200).json({
      query,
      chain: {
        initiator:      { provider: seq[0] || 'Gemini', model: (seq[0] || '').toLowerCase().includes('gemini') ? 'gemini-2.5-pro' : seq[0], response: responses[0] || '' },
        validator:      { provider: seq[1] || 'Claude', model: (seq[1] || '').toLowerCase().includes('claude') ? 'claude-sonnet-4-6' : seq[1], response: responses[1] || '' },
        finalValidator: { provider: seq[2] || 'Qwen',   model: (seq[2] || '').toLowerCase().includes('qwen') ? 'qwen-plus' : seq[2], response: responses[2] || '' },
      },
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[ai-chain]', message);
    return res.status(500).json({ error: message });
  }
}
