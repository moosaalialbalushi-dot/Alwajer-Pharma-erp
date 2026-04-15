// src/services/gemini.ts
import type { Batch, InventoryItem, Order, COOInsight, Expense, Employee } from '@/types';
import { callAIProxy, extractText } from './aiProxy';

const SYSTEM = `You are the Al Wajer Solo-ERP Brain. Ensure 100% operational accuracy at the 20 MT Sohar facility.
Rules:
Production: Cross-reference every batch against specs. Flag yield deviation >1% as critical.
Inventory: Trigger procurement at 20% safety stock.
Finance: Warn when liabilities exceed 30% of projected order revenue.
HR: Monitor staffing for critical production runs.
Tone: Luxury, high-precision.
Respond in JSON for data updates; concise professional messages for alerts.`;

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
    const response = await callAIProxy({
      provider: 'claude',          // 🔑 Hardcoded to Claude
      model: 'claude-3-5-sonnet-20241022',
      system: SYSTEM,
      messages: [{ role: 'user', content: prompt }],
      json_mode: true,
      apiKey: apiKeys?.claudeKey,
    });
    const text = extractText(response, 'claude') || '[]';
    const cleaned = text.replace(/`json\n?/g, '').replace(/`\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error('AI Operation Analysis failed:', e);
    return [];
  }
}

export async function quickInsight(summary: string): Promise<string> {
  try {
    const response = await callAIProxy({
      provider: 'claude',          // 🔑 Hardcoded to Claude
      model: 'claude-3-5-sonnet-20241022',
      system: 'You are a fast ERP assistant. Be brief and actionable.',
      messages: [{ role: 'user', content: `Quickly summarize status: ${summary}` }],
    });
    return extractText(response, 'claude') || 'Status normal.';
  } catch {
    return 'System operational.';
  }
}

export async function chatWithCOO(message: string, history: { role: string; text: string }[]): Promise<string> {
  const messages = [
    ...history.map(h => ({ role: h.role === 'user' ? 'user' : 'assistant', content: h.text })),
    { role: 'user', content: message },
  ];
  try {
    const response = await callAIProxy({
      provider: 'claude',          // 🔑 Hardcoded to Claude
      model: 'claude-3-5-sonnet-20241022',
      system: SYSTEM,
      messages,
    });
    return extractText(response, 'claude') || 'No response.';
  } catch (e) {
    return `Error: ${String(e)}`;
  }
}

export async function optimizeFormulation(rdData: unknown, claudeKey?: string): Promise<string> {
  try {
    const response = await callAIProxy({
      provider: 'claude',          // 🔑 Hardcoded to Claude
      model: 'claude-3-5-sonnet-20241022',
      system: SYSTEM,
      messages: [{
        role: 'user',
        content: `Analyze and optimize this pharmaceutical formulation:\n${JSON.stringify(rdData, null, 2)}\n\nProvide:\n1. Optimization recommendations\n2. Cost reduction opportunities\n3. Quality improvements\n4. Regulatory considerations`,
      }],
      apiKey: claudeKey,
    });
    return extractText(response, 'claude') || 'No optimization data.';
  } catch (e) {
    return `Optimization failed: ${String(e)}`;
  }
}

export async function brainstormSession(topic: string, context: string): Promise<string> {
  try {
    const response = await callAIProxy({
      provider: 'claude',          // 🔑 Hardcoded to Claude
      model: 'claude-3-5-sonnet-20241022',
      system: 'You are an expert pharmaceutical R&D and business strategist.',
      messages: [{
        role: 'user',
        content: `Brainstorm on: ${topic}\n\nContext: ${context}\n\nProvide innovative ideas, strategies, and actionable insights.`,
      }],
    });
    return extractText(response, 'claude') || 'No ideas generated.';
  } catch (e) {
    return `Brainstorm failed: ${String(e)}`;
  }
}

