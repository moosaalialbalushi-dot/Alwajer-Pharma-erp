// Smart Intake — drop any file, Claude classifies it and returns
// structured fields for auto-insertion into the correct ERP module.

import { callAIProxy, extractText } from './aiProxy';

export type IntakeModule =
  | 'sales' | 'procurement' | 'accounting' | 'hr'
  | 'rd' | 'bd' | 'samples' | 'logistics' | 'inventory' | 'unknown';

export interface IntakeResult {
  module: IntakeModule;
  confidence: number;          // 0–1
  title: string;               // short one-line summary
  reason: string;              // why this module
  fields: Record<string, unknown>;  // data mapped to the module's form shape
  rawText?: string;            // if the file is text-based
  warnings?: string[];
}

const SYSTEM_PROMPT = `You are a smart intake router for a pharmaceutical ERP. Given an uploaded document, receipt, invoice, picture, or any file, you must:

1. Classify it into EXACTLY ONE module:
   - sales         (customer invoices, sales orders, proforma to customer)
   - procurement   (vendor invoices, purchase orders, vendor quotations)
   - accounting    (expenses, bills, utility receipts, salaries, general payments)
   - hr            (employee documents, payroll, leave forms, ID copies)
   - rd            (formulation notes, lab reports, R&D specs)
   - bd            (business leads, market opportunities, partnership docs)
   - samples       (sample requests, sample dispatch notes)
   - logistics     (shipping docs, bills of lading, airway bills, tracking)
   - inventory     (stock receipts, goods-received notes, material lists)
   - unknown       (only if truly unrecognizable)

2. Extract the relevant fields for THAT module using these shapes:
   sales:        { invoiceNo, customer, country, product, quantity, rateUSD, amountUSD, amountOMR, date, paymentTerms, status }
   procurement:  { name, category, rating, status, country }                // vendor record
   accounting:   { description, category, amount, status, dueDate }
   hr:           { name, role, department, salary, status, joinDate }
   rd:           { title, productCode, dosageForm, strength, status }
   bd:           { targetMarket, opportunity, potentialValue, status, probability }
   samples:      { product, destination, quantity, status, trackingNumber }
   logistics:    { referenceNo, product, quantity, unit, carrier, trackingNumber, origin, destination, mode, status, dispatchDate, estimatedArrival, cost }
   inventory:    { sNo, name, category, requiredForOrders, stock, balanceToPurchase, unit, stockDate }

3. Return VALID JSON ONLY, no markdown, no commentary:
{
  "module": "<module-id>",
  "confidence": 0.0-1.0,
  "title": "short human summary",
  "reason": "why this classification",
  "fields": { ... extracted fields ... },
  "warnings": ["optional list of missing or uncertain fields"]
}

Use null (not undefined) for missing fields. Numbers must be numbers, not strings. Dates as ISO yyyy-mm-dd strings.`;

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] ?? '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function fileToText(file: File): Promise<string> {
  try { return await file.text(); } catch { return ''; }
}

function parseJsonLoose(raw: string): IntakeResult | null {
  const trimmed = raw.trim().replace(/^```json\s*/i, '').replace(/```$/, '').trim();
  try { return JSON.parse(trimmed) as IntakeResult; } catch { /* fallthrough */ }
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    try { return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1)) as IntakeResult; } catch { /* ignore */ }
  }
  return null;
}

export async function classifyAndExtract(file: File, claudeKey?: string): Promise<IntakeResult> {
  const isImage = file.type.startsWith('image/');
  const isPdf = file.type === 'application/pdf';

  let userContent: unknown;
  let rawText = '';

  if (isImage) {
    const b64 = await fileToBase64(file);
    userContent = [
      {
        type: 'image',
        source: { type: 'base64', media_type: file.type, data: b64 },
      },
      { type: 'text', text: `Filename: ${file.name}\nClassify and extract fields. Return JSON only.` },
    ];
  } else if (isPdf) {
    userContent = `Filename: ${file.name}\n(PDF file — ${Math.round(file.size / 1024)} KB. Binary content not readable here; infer from filename and classify accordingly. If filename suggests an invoice, receipt, shipment, etc., pick the best module and leave fields as null where not derivable.)\n\nReturn JSON only.`;
  } else {
    rawText = (await fileToText(file)).slice(0, 8000);
    userContent = `Filename: ${file.name}\n\nContent:\n${rawText || '(empty or non-text file)'}\n\nClassify and extract fields. Return JSON only.`;
  }

  const res = await callAIProxy({
    provider: 'claude',
    model: 'claude-haiku-4-5-20251001',
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userContent as string }],
    max_tokens: 2000,
    apiKey: claudeKey,
  });

  const text = extractText(res, 'claude');
  const parsed = parseJsonLoose(text);
  if (!parsed) {
    return {
      module: 'unknown',
      confidence: 0,
      title: file.name,
      reason: 'Could not parse AI response',
      fields: {},
      rawText: text,
      warnings: ['AI did not return valid JSON'],
    };
  }

  return { ...parsed, rawText: rawText || parsed.rawText };
}

export const MODULE_TO_ENTITY: Record<IntakeModule, string | null> = {
  sales: 'sales',
  procurement: 'procurement',
  accounting: 'accounting',
  hr: 'hr',
  rd: 'rd',
  bd: 'bd',
  samples: 'samples',
  logistics: 'logistics',
  inventory: 'inventory',
  unknown: null,
};

export const MODULE_TO_TAB: Record<IntakeModule, string | null> = {
  sales: 'sales',
  procurement: 'procurement',
  accounting: 'accounting',
  hr: 'hr',
  rd: 'rd',
  bd: 'bd',
  samples: 'samples',
  logistics: 'logistics',
  inventory: 'inventory',
  unknown: null,
};
