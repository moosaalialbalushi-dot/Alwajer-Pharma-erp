
/**
 * AI Proxy Service
 * Routes all AI requests through the Supabase Edge Function to keep API keys secure.
 */

const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://dqsriohrazmlikwjwbot.supabase.co';
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

export type AIProvider = 'anthropic' | 'gemini' | 'deepseek';

export interface Message {
  role: 'user' | 'assistant' | 'system' | 'model';
  content: string;
}

export interface ProxyRequest {
  provider: AIProvider;
  messages: Message[];
  system?: string;
  model?: string;
  max_tokens?: number;
  temperature?: number;
  json_mode?: boolean;
}

export const callAIProxy = async (params: ProxyRequest) => {
  if (!SUPABASE_ANON_KEY) {
    console.error("VITE_SUPABASE_ANON_KEY is missing. AI calls will fail.");
    throw new Error("Supabase configuration missing");
  }

  // Map 'model' role to 'assistant' for Anthropic/DeepSeek if needed, 
  // or 'assistant' to 'model' for Gemini if the proxy doesn't handle it.
  // The proxy documentation says it expects {role, content}.
  const formattedMessages = params.messages.map(m => ({
    role: m.role === 'model' ? 'assistant' : m.role,
    content: m.content
  }));

  const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-proxy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      ...params,
      messages: formattedMessages
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `AI Proxy Error: ${response.statusText}`);
  }

  return await response.json();
};

/**
 * Helper to extract text from different provider responses
 */
export const extractText = (data: any, provider: AIProvider): string => {
  try {
    if (provider === 'anthropic') {
      return data.content[0].text;
    } else if (provider === 'gemini') {
      // Handle both direct Gemini format and potential proxy wrapping
      if (data.candidates && data.candidates[0].content.parts[0].text) {
        return data.candidates[0].content.parts[0].text;
      }
      return data.text || "";
    } else if (provider === 'deepseek') {
      return data.choices[0].message.content;
    }
  } catch (e) {
    console.error("Error extracting text from AI response:", e, data);
  }
  return typeof data === 'string' ? data : JSON.stringify(data);
};
