export interface AIMessage { role: 'user' | 'assistant'; content: string; }

export interface AIProxyRequest {
  provider: 'gemini' | 'claude' | 'openrouter';
  model: string;
  system?: string;
  messages: AIMessage[];
  json_mode?: boolean;
  max_tokens?: number;
  /** @deprecated — kept for call-site compat; keys are now server-side env vars */
  apiKey?: string;
}

export function extractText(response: unknown, provider: string): string {
  try {
    const r = response as Record<string, unknown>;
    if (typeof r.text === 'string') return r.text;
    if (provider === 'gemini') {
      const candidates = r.candidates as { content: { parts: { text: string }[] } }[];
      return candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    }
    if (provider === 'claude') {
      const content = r.content as { text: string }[];
      return content?.[0]?.text ?? '';
    }
    if (provider === 'openrouter') {
      const choices = r.choices as { message: { content: string } }[];
      return choices?.[0]?.message?.content ?? '';
    }
  } catch {/* swallow */}
  return '';
}

export async function callAIProxy(req: AIProxyRequest): Promise<unknown> {
  const { provider, system, messages, model, max_tokens = 1024, apiKey } = req;

  // ── GEMINI — server-side proxy (key stays in Vercel env) ──────────────────
  if (provider === 'gemini') {
    const res = await fetch('/api/ai-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'gemini', system, messages, model, max_tokens }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Gemini error ${res.status}: ${(err as any)?.error || 'Check GEMINI_API_KEY in Vercel env vars.'}`);
    }
    return res.json();
  }

  // ── CLAUDE — server-side proxy (key stays in Vercel env) ──────────────────
  if (provider === 'claude') {
    const res = await fetch('/api/ai-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'claude', system, messages, model, max_tokens }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Claude error ${res.status}: ${(err as any)?.error || 'Check ANTHROPIC_API_KEY in Vercel env vars.'}`);
    }
    return res.json();
  }

  // ── OPENROUTER — uses user-supplied key (openrouter keys are designed for client use) ──
  if (provider === 'openrouter') {
    const allMessages = system
      ? [{ role: 'system', content: system }, ...messages]
      : messages;
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey ?? ''}` },
      body: JSON.stringify({ model: model ?? 'openai/gpt-4o-mini', messages: allMessages, max_tokens }),
    });
    if (!res.ok) throw new Error(`OpenRouter error ${res.status}`);
    return res.json();
  }

  throw new Error(`Provider '${provider}' is not supported.`);
}

/** Call Ollama directly from browser (local only: http://localhost:11434) */
export async function callOllama(url: string, model: string, messages: AIMessage[], system?: string): Promise<string> {
  const baseUrl = (url || 'http://localhost:11434').replace(/\/$/, '');
  const allMessages: { role: string; content: string }[] = [];
  if (system) allMessages.push({ role: 'system', content: system });
  allMessages.push(...messages);

  const res = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: model || 'gemma3:4b', messages: allMessages, stream: false }),
  });
  if (!res.ok) throw new Error(`Ollama error ${res.status} — is Ollama running at ${baseUrl}? Run: ollama serve`);
  const data = await res.json() as { message?: { content?: string } };
  return data.message?.content ?? '';
}
