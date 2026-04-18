// tripleValidation.ts
// Browser-side service for the 3-LLM validation chain.
// Keys never leave the server — this file only calls /api/ai-chain.

// ── Model registry ────────────────────────────────────────────────
// Use these constants everywhere in the app instead of raw strings.

export const MODELS = {
  gemini: {
    flash:   { id: 'gemini-2.5-pro',                  label: 'Gemini 2.5 Pro',     speed: 'fast',   use: 'Default — fast, data analysis'          },
    pro:     { id: 'gemini-2.5-pro',                  label: 'Gemini 2.5 Pro',     speed: 'medium', use: 'Deep analysis, long documents'           },
    thinking:{ id: 'gemini-2.5-pro', label: 'Gemini Thinking', speed: 'slow', use: 'Step-by-step reasoning tasks'           },
  },
  claude: {
    haiku:   { id: 'claude-haiku-4-5-20251001',       label: 'Claude Haiku',       speed: 'fast',   use: 'Quick lookups, short answers'            },
    sonnet:  { id: 'claude-sonnet-4-6',               label: 'Claude Sonnet',      speed: 'medium', use: 'Default — balanced quality + speed'     },
    opus:    { id: 'claude-opus-4-6',                 label: 'Claude Opus',        speed: 'slow',   use: 'Highest quality, complex reasoning'     },
  },
  deepseek: {
    chat:    { id: 'deepseek-chat',                   label: 'DeepSeek Chat',      speed: 'fast',   use: 'Fast responses, general tasks'           },
    r1:      { id: 'deepseek-reasoner',               label: 'DeepSeek R1',        speed: 'slow',   use: 'Chain-of-thought, final validation'     },
  },
} as const;

// Recommended chain assignment for Al Wajar
export const CHAIN_ASSIGNMENT = {
  initiator:      { provider: 'gemini'   as const, model: MODELS.gemini.flash,   role: 'Initiates draft response'          },
  validator:      { provider: 'claude'   as const, model: MODELS.claude.sonnet,  role: 'Logic + compliance validation'     },
  finalValidator: { provider: 'deepseek' as const, model: MODELS.deepseek.r1,    role: 'Chain-of-thought final confirmation' },
};

// ── Types ─────────────────────────────────────────────────────────

export interface ChainStep {
  provider: string;
  model: string;
  response: string;
}

export interface ChainResult {
  query: string;
  chain: {
    initiator:      ChainStep;
    validator:      ChainStep;
    finalValidator: ChainStep;
  };
}

// ── Main chain call ───────────────────────────────────────────────

export async function runTripleValidation(
  query: string,
  context = '',
  domain = 'pharma'
): Promise<ChainResult> {
  const res = await fetch('/api/ai-chain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, context, domain }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error((data as { error?: string })?.error ?? `HTTP ${res.status}`);
  }

  return data as ChainResult;
}

// ── Extract the final answer from a chain result ──────────────────

export function extractFinalAnswer(result: ChainResult): string {
  const finalText = result.chain.finalValidator.response;
  // DeepSeek R1 outputs "FINAL ANSWER:" section — extract it
  const marker = 'FINAL ANSWER:';
  const idx = finalText.indexOf(marker);
  if (idx !== -1) {
    return finalText.slice(idx + marker.length).trim();
  }
  return finalText;
}

export function extractConsensus(result: ChainResult): 'yes' | 'partial' | 'no' | 'unknown' {
  const text = result.chain.finalValidator.response.toLowerCase();
  if (text.includes('consensus: yes'))     return 'yes';
  if (text.includes('consensus: partial')) return 'partial';
  if (text.includes('consensus: no'))      return 'no';
  return 'unknown';
}

export function extractVerdict(result: ChainResult): 'APPROVED' | 'APPROVED WITH CORRECTIONS' | 'REJECTED' | 'UNKNOWN' {
  const text = result.chain.validator.response;
  if (text.includes('VERDICT: APPROVED WITH CORRECTIONS')) return 'APPROVED WITH CORRECTIONS';
  if (text.includes('VERDICT: APPROVED'))                   return 'APPROVED';
  if (text.includes('VERDICT: REJECTED'))                   return 'REJECTED';
  return 'UNKNOWN';
}
