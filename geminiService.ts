import { Batch, InventoryItem, Order, COOInsight, RDProject, Expense, Employee, Ingredient } from "./types";
import { callAIProxy, extractText } from "./aiProxyService";

const SYSTEM_INSTRUCTION = `You are the Alwajar Solo-ERP Brain. Your goal is to ensure 100% accuracy in our 20 MT Sohar facility.

Operational Rules:
1. Production Accuracy: Cross-reference every batch against brochure specs. If yield/ratio deviates >1%, flag as critical risk.
2. Inventory Control: Trigger procurement when stock hits 20% safety stock.
3. Finance & Liability: Monitor expenses vs revenue. If liabilities (Pending Expenses) exceed 30% of projected order revenue, issue a warning.
4. HR & Administration: Ensure essential staffing for critical production runs. Monitor departmental burn rates.
5. Tone: Maintain a luxury, high-precision tone.

Respond in JSON format for data updates or concise professional messages for alerts.`;

export const analyzeOperations = async (
  batches: Batch[],
  inventory: InventoryItem[],
  orders: Order[],
  expenses: Expense[] = [],
  employees: Employee[] = []
): Promise<COOInsight[]> => {
  const prompt = `Current State:
Batches: ${JSON.stringify(batches)}
Inventory: ${JSON.stringify(inventory)}
Orders: ${JSON.stringify(orders)}
Expenses: ${JSON.stringify(expenses)}
Employees: ${JSON.stringify(employees)}

Provide exactly 3-5 operational insights covering production, finance, and staffing risks.
Output JSON format: Array<{ type: string, message: string, severity: 'info' | 'warning' | 'critical', actionTaken?: string }>`;

  try {
    const response = await callAIProxy({
      provider: 'gemini',
      model: 'gemini-2.0-flash',
      system: SYSTEM_INSTRUCTION,
      messages: [{ role: 'user', content: prompt }],
      json_mode: true
    });

    const text = extractText(response, 'gemini') || "[]";
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return [];
  }
};

export const quickInsight = async (dataSummary: string): Promise<string> => {
  try {
    const response = await callAIProxy({
      provider: 'gemini',
      model: 'gemini-2.0-flash',
      system: "You are a fast, efficient ERP assistant. Be brief.",
      messages: [{ role: 'user', content: `Quickly summarize status: ${dataSummary}` }]
    });
    return extractText(response, 'gemini') || "Status Normal.";
  } catch (e) { return "System Operational."; }
};

export const optimizeFormulation = async (project: RDProject): Promise<{ suggestion: string, optimizedIngredients: any[] }> => {
  const prompt = `Current Formulation Project: ${JSON.stringify(project)}
Analyze and suggest improvements for 100% accuracy.
Return JSON: { "suggestion": "string", "optimizedIngredients": "Array<Ingredient>" }`;

  try {
    const response = await callAIProxy({
      provider: 'gemini',
      model: 'gemini-2.0-flash',
      system: "You are an expert Pharmaceutical Formulation Scientist.",
      messages: [{ role: 'user', content: prompt }],
      json_mode: true
    });

    const text = extractText(response, 'gemini') || "{}";
    return JSON.parse(text);
  } catch (e) {
    console.error("Optimize Formulation Error:", e);
    return { suggestion: "Error optimizing formulation.", optimizedIngredients: [] };
  }
};

export const chatWithCOO = async (message: string, history: any[]) => {
  try {
    const response = await callAIProxy({
      provider: 'gemini',
      model: 'gemini-2.0-flash',
      system: SYSTEM_INSTRUCTION,
      messages: [{ role: 'user', content: message }]
    });
    return extractText(response, 'gemini');
  } catch (e) {
    console.error("Chat with COO Error:", e);
    return "Error communicating with AI.";
  }
};

export const analyzeImageOrFile = async (base64Data: string, mimeType: string, promptText: string) => {
  try {
    const isFormulation =
      promptText.toLowerCase().includes("formulation") ||
      promptText.toLowerCase().includes("ingredient");

    const enhancedPrompt = isFormulation
      ? `CRITICAL: DO NOT summarize. You MUST extract every single ingredient (expect between 12 and 19 items). Return strict JSON matching this structure exactly: { "ingredients": [ { "name": "string", "quantity": number, "unit": "string", "rateUSD": number, "role": "string" } ] }. Do not omit any ingredient. Do not add commentary outside the JSON object.\n\nOriginal Request: ${promptText}`
      : promptText;

    const response = await callAIProxy({
      provider: 'gemini',
      model: 'gemini-2.0-flash',
      messages: [
        {
          role: 'user',
          content: `[File: ${mimeType}] ${enhancedPrompt}\n\nBase64 Data: ${base64Data.substring(0, 100)}... (Assume full file context here)`
        }
      ],
      json_mode: isFormulation
    });

    return extractText(response, 'gemini');
  } catch (error) {
    console.error("Gemini File Analysis Error:", error);
    return "Error analyzing file.";
  }
};
export const brainstormSession = async (topic: string, persona: 'logic' | 'creative' | 'research') => {
  let systemInstruction = SYSTEM_INSTRUCTION;

  if (persona === 'logic') {
    systemInstruction = "You are a Chief Strategy Officer focusing on logic and finance.";
  } else if (persona === 'creative') {
    systemInstruction = "You are a Visionary Innovation Lead.";
  } else if (persona === 'research') {
    systemInstruction = "You are a Technical Research Scientist.";
  }

  try {
    const response = await callAIProxy({
      provider: 'gemini',
      model: 'gemini-2.0-flash',
      system: systemInstruction,
      messages: [{ role: 'user', content: topic }]
    });
    return extractText(response, 'gemini');
  } catch (e) {
    console.error("Brainstorm Session Error:", e);
    return "Error in brainstorm session.";
  }
};

export const generateIndustrialDesign = async (prompt: string, style: 'schematic' | 'layout' | 'render', aspectRatio: string = "16:9", imageSize: string = "1K"): Promise<string | null> => {
  return null;
};

export const editImage = async (base64Data: string, mimeType: string, promptText: string): Promise<string | null> => {
  return null;
};

export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
  return "";
};
