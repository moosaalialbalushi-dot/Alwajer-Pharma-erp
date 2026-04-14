export interface AIMessage { role: 'user' | 'assistant'; content: string; }

export interface AIProxyRequest {
  provider: 'gemini' | 'claude' | 'openrouter' | 'groq';
  model: string;
  system?: string;
  messages: AIMessage[];
  json_mode?: boolean;
  max_tokens?: number;
  apiKey?: string;  // user-provided key from Settings (forwarded to server as clientApiKey)
}

export function extractText(response: unknown, provider: string): string {
  try {
    const r = response as Record<string, unknown>;
    if (provider === 'gemini') {
      const candidates = r.candidates as { content: { parts: { text: string }[] } }[];
      return candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    }
    if (provider === 'claude') {
      const content = r.content as { text: string }[];
      return content?.[0]?.text ?? '';
    }
    if (provider === 'openrouter' || provider === 'groq') {
      const choices = r.choices as { message: { content: string } }[];
      return choices?.[0]?.message?.content ?? '';
    }
  } catch {/* swallow */}
  return '';
}

export async function callAIProxy(req: AIProxyRequest): Promise<unknown> {
  // Groq uses OpenAI-compatible API — call directly from browser
  if (req.provider === 'groq') {
    return callGroqDirect(req);
  }
  const { apiKey, ...rest } = req;
  const res = await fetch('/api/ai-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...rest, clientApiKey: apiKey }),
  });
  if (!res.ok) throw new Error(`AI proxy error: ${res.status}`);
  return res.json();
}

/** Call Groq directly from browser (OpenAI-compatible endpoint, no proxy needed) */
async function callGroqDirect(req: AIProxyRequest): Promise<unknown> {
  const apiKey = req.apiKey || import.meta.env.VITE_GROQ_KEY || '';
  if (!apiKey) throw new Error('Groq API key not set. Add VITE_GROQ_KEY to your environment variables.');
  const messages: { role: string; content: string }[] = [];
  if (req.system) messages.push({ role: 'system', content: req.system });
  messages.push(...req.messages);
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: req.model, messages, max_tokens: req.max_tokens ?? 4096 }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(`Groq error ${res.status}: ${err}`);
  }
  return res.json();
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
  if (!res.ok) throw new Error(`Ollama error ${res.status} — is Ollama running at ${baseUrl}?`);
  const data = await res.json() as { message?: { content?: string } };
  return data.message?.content ?? '';
}
