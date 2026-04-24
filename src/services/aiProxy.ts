export interface AIMessage { role: 'user' | 'assistant'; content: string; }

export interface AIProxyRequest {
  provider: 'gemini' | 'claude' | 'openrouter';
  model: string;
  system?: string;
  messages: AIMessage[];
  json_mode?: boolean;
  max_tokens?: number;
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

  // ── GEMINI — direct browser call ──────────────────────────────────────────
  if (provider === 'gemini') {
    const { GoogleGenAI } = await import('@google/genai');
    const key = apiKey || (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
    if (!key) throw new Error('Gemini API key not set. Go to ⚙️ Settings → Gemini API Key.');
    const ai = new GoogleGenAI({ apiKey: key });
    const prompt = system
      ? `${system}\n\n${messages.map(m => m.content).join('\n')}`
      : messages.map(m => m.content).join('\n');
    const response = await ai.models.generateContent({
      model: model ?? 'gemini-2.0-flash',
      contents: prompt,
    });
    return { text: response.text ?? '', candidates: response.candidates };
  }

  // ── CLAUDE — Vercel serverless proxy ──────────────────────────────────────
  if (provider === 'claude') {
    const res = await fetch('/api/ai-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system, messages, model, max_tokens, clientApiKey: apiKey }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Claude error ${res.status}: ${(err as any)?.error || 'Check your Claude API key in Settings.'}`);
    }
    return res.json();
  }

  // ── OPENROUTER — direct browser call ──────────────────────────────────────
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
