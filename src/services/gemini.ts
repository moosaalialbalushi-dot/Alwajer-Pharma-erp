import type { Batch, InventoryItem, Order, COOInsight, Expense, Employee } from '@/types';
import { callAIProxy, extractText } from './aiProxy';

const SYSTEM = `You are the Al Wajer Solo-ERP Brain. Ensure 100% operational accuracy at the 20 MT Sohar facility.

Rules:
1. Production: Cross-reference every batch against specs. Flag yield deviation >1% as critical.
2. Inventory: Trigger procurement at 20% safety stock.
3. Finance: Warn when liabilities exceed 30% of projected order revenue.
4. HR: Monitor staffing for critical production runs.
5. Tone: Luxury, high-precision.

Respond in JSON for data updates; concise professional messages for alerts.`;

async function claude(system: string, content: string, claudeKey?: string, model = 'claude-haiku-4-5-20251001') {
  return callAIProxy({ provider: 'claude', model, system, messages: [{ role: 'user', content }], apiKey: claudeKey });
}

export async function analyzeOperations(
  batches: Batch[], inventory: InventoryItem[], orders: Order[],
  expenses: Expense[] = [], employees: Employee[] = [],
  apiKeys?: { claudeKey?: string }
): Promise<COOInsight[]> {
  const prompt = `Current State:
Batches: ${JSON.stringify(batches)}
Inventory: ${JSON.stringify(inventory)}
Orders: ${JSON.stringify(orders)}
Expenses: ${JSON.stringify(expenses)}
Employees: ${JSON.stringify(employees)}

Provide 3-5 operational insights covering production, finance, and staffing risks.
JSON format: Array<{ type: string, message: string, severity: 'info'|'warning'|'critical', actionTaken?: string }>`;

  try {
    const response = await claude(SYSTEM, prompt, apiKeys?.claudeKey);
    const text = extractText(response, 'claude') || '[]';
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error('analyzeOperations failed:', e);
    return [];
  }
}

export async function quickInsight(summary: string, claudeKey?: string): Promise<string> {
  try {
    const response = await claude(
      'You are a fast ERP assistant. Be brief and actionable.',
      `Quickly summarize status: ${summary}`,
      claudeKey,
    );
    return extractText(response, 'claude') || 'Status normal.';
  } catch {
    return 'System operational.';
  }
}

export async function chatWithCOO(message: string, history: { role: string; text: string }[], claudeKey?: string): Promise<string> {
  const messages = [
    ...history.map(h => ({ role: h.role === 'user' ? 'user' as const : 'assistant' as const, content: h.text })),
    { role: 'user' as const, content: message },
  ];
  try {
    const response = await callAIProxy({
      provider: 'claude', model: 'claude-sonnet-4-6',
      system: SYSTEM, messages, apiKey: claudeKey,
    });
    return extractText(response, 'claude') || 'No response.';
  } catch (e) {
    return `Error: ${String(e)}`;
  }
}

export async function optimizeFormulation(rdData: unknown, claudeKey?: string): Promise<string> {
  try {
    const response = await claude(
      SYSTEM,
      `Analyze and optimize this pharmaceutical formulation:\n${JSON.stringify(rdData, null, 2)}\n\nProvide:\n1. Optimization recommendations\n2. Cost reduction opportunities\n3. Quality improvements\n4. Regulatory considerations`,
      claudeKey,
      'claude-sonnet-4-6',
    );
    return extractText(response, 'claude') || 'No optimization data.';
  } catch (e) {
    return `Optimization failed: ${String(e)}`;
  }
}

export async function brainstormSession(topic: string, context: string, claudeKey?: string): Promise<string> {
  try {
    const response = await claude(
      'You are an expert pharmaceutical R&D and business strategist.',
      `Brainstorm on: ${topic}\n\nContext: ${context}\n\nProvide innovative ideas, strategies, and actionable insights.`,
      claudeKey,
      'claude-sonnet-4-6',
    );
    return extractText(response, 'claude') || 'No ideas generated.';
  } catch (e) {
    return `Brainstorm failed: ${String(e)}`;
  }
}
