
import { GoogleGenAI } from "@google/genai";
import { Batch, InventoryItem, Order, COOInsight, RDProject, Expense, Employee } from "./types";

// Helper to get key safely
const getApiKey = () => process.env.NEXT_PUBLIC_API_KEY || process.env.API_KEY;

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
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "[]";
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return [];
  }
};

export const quickInsight = async (dataSummary: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash", 
      contents: `Quickly summarize status: ${dataSummary}`,
      config: { systemInstruction: "You are a fast, efficient ERP assistant. Be brief." }
    });
    return response.text || "Status Normal.";
  } catch (e) { return "System Operational."; }
};

export const optimizeFormulation = async (project: RDProject): Promise<{ suggestion: string, optimizedIngredients: any[] }> => {
  const prompt = `Current Formulation Project: ${JSON.stringify(project)}
Analyze and suggest improvements for 100% accuracy.
Return JSON: { "suggestion": "string", "optimizedIngredients": "Array<Ingredient>" }`;

  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
    config: {
      systemInstruction: "You are an expert Pharmaceutical Formulation Scientist.",
      responseMimeType: "application/json"
    }
  });

  return JSON.parse(response.text || "{}");
};

export const chatWithCOO = async (message: string, history: any[]) => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: message,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      thinkingConfig: { thinkingBudget: 32768 } 
    }
  });
  return response.text;
};

export const analyzeImageOrFile = async (base64Data: string, mimeType: string, promptText: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash', 
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: base64Data } },
          { text: promptText }
        ]
      }
    });
    return response.text;
  } catch (error) {
    return "Error analyzing file.";
  }
};

export const brainstormSession = async (topic: string, persona: 'logic' | 'creative' | 'research') => {
  let systemInstruction = SYSTEM_INSTRUCTION;
  let thinkingBudget = 0;

  if (persona === 'logic') {
    systemInstruction = "You are a Chief Strategy Officer focusing on logic and finance.";
    thinkingBudget = 10000;
  } else if (persona === 'creative') {
    systemInstruction = "You are a Visionary Innovation Lead.";
  } else if (persona === 'research') {
    systemInstruction = "You are a Technical Research Scientist.";
  }

  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: topic,
    config: {
      systemInstruction: systemInstruction,
      thinkingConfig: thinkingBudget > 0 ? { thinkingBudget } : undefined
    }
  });
  return response.text;
};

export const generateIndustrialDesign = async (
  prompt: string, 
  style: 'schematic' | 'layout' | 'render',
  aspectRatio: string = "16:9",
  imageSize: string = "1K"
): Promise<string | null> => {
  const enhancedPrompt = `${style} design for: ${prompt}. High-contrast industrial pharmaceutical facility style.`;
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: { parts: [{ text: enhancedPrompt }] },
      config: { imageConfig: { aspectRatio: aspectRatio, imageSize: imageSize } }
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    return null;
  } catch (error) {
    return null;
  }
};

export const editImage = async (base64Data: string, mimeType: string, promptText: string): Promise<string | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash', 
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: base64Data } },
          { text: promptText }
        ]
      }
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    return null;
  } catch (error) {
    return null;
  }
};

export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: {
            parts: [
                { inlineData: { mimeType: mimeType, data: base64Audio } },
                { text: "Transcribe this audio exactly as spoken." }
            ]
        }
    });
    return response.text || "";
  } catch (e) {
    return "";
  }
};
