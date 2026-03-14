// aiProxyService.ts
// Browser-side service. Calls /api/ai-proxy (Vercel serverless).
// Keys are NEVER in this file — they live in Vercel Environment Variables.

export interface ProxyRequest {
  provider: 'anthropic' | 'gemini' | 'deepseek';
  system?: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
  maxTokens?: number;
  model?: string;
}

/**
 * Call the Vercel AI proxy.
 * Returns the raw provider response (shape varies by provider — use extractText below).
 */
export async function callAIProxy(req: ProxyRequest): Promise<unknown> {
  const response = await fetch('/api/ai-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: req.provider,
      system: req.system ?? '',
      messages: req.messages,
      max_tokens: req.maxTokens ?? 1024,
      model: req.model,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    // Surface the clear error message from the serverless function
    throw new Error((data as { error?: string })?.error ?? `HTTP ${response.status}`);
  }

  return data;
}

/**
 * Extract plain text from any provider's raw response.
 */
export function extractText(data: unknown, provider: string): string {
  try {
    const d = data as Record<string, unknown>;

    if (provider === 'anthropic') {
      // { content: [{ type: 'text', text: '...' }, ...] }
      const blocks = d?.content as { type: string; text?: string }[] | undefined;
      return blocks?.filter(b => b.type === 'text').map(b => b.text ?? '').join('\n') ?? '';
    }

    if (provider === 'gemini') {
      // { candidates: [{ content: { parts: [{ text: '...' }] } }] }
      type GeminiResponse = { candidates?: { content?: { parts?: { text?: string }[] } }[] };
      const g = d as GeminiResponse;
      return g?.candidates?.[0]?.content?.parts?.map(p => p.text ?? '').join('') ?? '';
    }

    if (provider === 'deepseek') {
      // OpenAI-compatible: { choices: [{ message: { content: '...' } }] }
      type OpenAIResponse = { choices?: { message?: { content?: string } }[] };
      const o = d as OpenAIResponse;
      return o?.choices?.[0]?.message?.content ?? '';
    }

    // Fallback — try all known shapes
    type AnyResponse = {
      content?: { type: string; text?: string }[];
      candidates?: { content?: { parts?: { text?: string }[] } }[];
      choices?: { message?: { content?: string } }[];
    };
    const r = d as AnyResponse;
    return (
      r?.content?.find(b => b.type === 'text')?.text ??
      r?.candidates?.[0]?.content?.parts?.[0]?.text ??
      r?.choices?.[0]?.message?.content ??
      JSON.stringify(data)
    );
  } catch {
    return 'Could not parse AI response.';
  }
}
