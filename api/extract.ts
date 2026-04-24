// api/extract.ts — server-side AI extraction for SmartImporter
// Uses GEMINI_API_KEY or ANTHROPIC_API_KEY from Vercel env vars (never exposed to browser)
import type { VercelRequest, VercelResponse } from '@vercel/node';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

async function callGemini(
  apiKey: string,
  prompt: string,
  content: string,
  imageBase64?: string,
  mimeType?: string
): Promise<string> {
  const parts: unknown[] = [];
  if (imageBase64 && mimeType) {
    parts.push({ inlineData: { mimeType, data: imageBase64 } });
  }
  parts.push({ text: imageBase64 ? prompt : prompt + '\n\nDocument:\n' + content.slice(0, 8000) });

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts }] }),
    }
  );
  if (!res.ok) throw new Error(`Gemini error ${res.status}`);
  const data = await res.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

async function callClaude(
  apiKey: string,
  prompt: string,
  content: string,
  imageBase64?: string,
  mimeType?: string
): Promise<string> {
  const msgContent: unknown[] = imageBase64 && mimeType
    ? [
        { type: 'image', source: { type: 'base64', media_type: mimeType, data: imageBase64 } },
        { type: 'text', text: prompt },
      ]
    : [{ type: 'text', text: prompt + '\n\nDocument:\n' + content.slice(0, 6000) }];

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      messages: [{ role: 'user', content: msgContent }],
    }),
  });
  if (!res.ok) throw new Error(`Claude error ${res.status}`);
  const data = await res.json() as { content?: { text?: string }[] };
  return data?.content?.[0]?.text ?? '';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt, content = '', imageBase64, mimeType } = req.body ?? {};
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

  const geminiKey = process.env.GEMINI_API_KEY;
  const claudeKey = process.env.ANTHROPIC_API_KEY;

  if (!geminiKey && !claudeKey) {
    return res.status(500).json({ error: 'No AI keys configured in Vercel environment. Add GEMINI_API_KEY or ANTHROPIC_API_KEY.' });
  }

  let text = '';
  if (geminiKey) {
    try {
      text = await callGemini(geminiKey, prompt, content, imageBase64, mimeType);
    } catch (e) {
      console.warn('[extract] Gemini failed, trying Claude:', e);
    }
  }
  if (!text && claudeKey) {
    try {
      text = await callClaude(claudeKey, prompt, content, imageBase64, mimeType);
    } catch (e) {
      console.warn('[extract] Claude failed:', e);
    }
  }

  if (!text) {
    return res.status(502).json({ error: 'AI extraction failed. Check server logs.' });
  }

  const match = text.match(/\[[\s\S]*\]/);
  if (!match) {
    return res.status(422).json({ error: 'AI did not return a valid JSON array.', raw: text.slice(0, 500) });
  }

  try {
    const records = JSON.parse(match[0]);
    return res.status(200).json({ records });
  } catch {
    return res.status(422).json({ error: 'Failed to parse AI response as JSON.', raw: match[0].slice(0, 500) });
  }
}
