export interface AIMessage { role: 'user' | 'assistant'; content: string; }

export interface AIProxyRequest {
  provider: 'gemini' | 'claude' | 'openrouter';
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
    if (provider === 'openrouter') {
      const choices = r.choices as { message: { content: string } }[];
      return choices?.[0]?.message?.content ?? '';
    }
  } catch {/* swallow */}
  return '';
}

export async function callAIProxy(req: AIProxyRequest): Promise<unknown> {
  // All providers now use the server proxy for security
  const { apiKey, ...rest } = req;
  const res = await fetch('/api/ai-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...rest, clientApiKey: apiKey }),
  });
  if (!res.ok) throw new Error(`AI proxy error: ${res.status}`);
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
