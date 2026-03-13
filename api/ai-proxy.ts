import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { provider, system, messages } = req.body;

  try {
    let response;
    if (provider === 'gemini') {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('GEMINI_API_KEY not set');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash', systemInstruction: system });
      const result = await model.generateContent(messages.map((m: any) => m.content).join('\n'));
      response = result.response.text();
    } else if (provider === 'anthropic') {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');
      const anthropic = new Anthropic({ apiKey });
      const msg = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system,
        messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
      });
      response = msg.content[0].type === 'text' ? msg.content[0].text : '';
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }
    res.status(200).json({ response });
  } catch (error: any) {
    console.error('AI proxy error:', error);
    res.status(500).json({ error: error.message });
  }
}
