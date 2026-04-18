/**
 * universalFileLoader.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * UNIVERSAL FILE LOADER SERVICE
 * 
 * Handles:
 * - PDF extraction
 * - Excel/CSV parsing
 * - Image OCR (via Claude vision)
 * - Document analysis
 * 
 * Auto-extracts data and populates ERP tables
 * ──────────────────────────────────────────────────────────────────────────────
 */

import type { Order, InventoryItem, Batch, Expense, Employee } from '@/types';

export interface FileAnalysisResult {
  type: 'orders' | 'inventory' | 'production' | 'expenses' | 'employees' | 'unknown';
  data: unknown[];
  confidence: number;
  rawText: string;
}

/**
 * Extract text from file using Claude vision or text extraction
 */
export async function extractFileContent(file: File, claudeKey?: string): Promise<string> {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();

  // Handle PDF files
  if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
    return extractPdfText(file);
  }

  // Handle Excel/CSV files
  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileType === 'application/vnd.ms-excel') {
    return extractExcelText(file);
  }

  if (fileName.endsWith('.csv') || fileType === 'text/csv') {
    return extractCsvText(file);
  }

  // Handle images with Claude vision
  if (fileType.startsWith('image/')) {
    return extractImageText(file, claudeKey);
  }

  // Handle Word docs
  if (fileName.endsWith('.docx') || fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return extractDocxText(file);
  }

  // Plain text
  return file.text();
}

/**
 * Extract text from PDF using pdfjs
 */
async function extractPdfText(file: File): Promise<string> {
  try {
    // Use fetch to convert to blob then text-extraction
    const arrayBuffer = await file.arrayBuffer();
    const pdfText = await importPdfLib().then(async (PdfJs: any) => {
      const pdf = await PdfJs.getDocument(arrayBuffer).promise;
      let text = '';
      for (let i = 0; i < pdf.numPages; i++) {
        const page = await pdf.getPage(i + 1);
        const content = await page.getTextContent();
        text += content.items.map((item: any) => item.str).join(' ') + '\n';
      }
      return text;
    });
    return pdfText;
  } catch (e) {
    console.warn('PDF extraction failed, attempting fallback:', e);
    return file.text();
  }
}

/**
 * Extract text from Excel files
 */
async function extractExcelText(file: File): Promise<string> {
  try {
    const { read, utils } = await importExcelLib();
    const buffer = await file.arrayBuffer();
    const workbook = read(buffer, { type: 'array' });
    
    let text = '';
    workbook.SheetNames.forEach((sheetName: string) => {
      text += `Sheet: ${sheetName}\n`;
      const sheet = workbook.Sheets[sheetName];
      const csv = utils.sheet_to_csv(sheet);
      text += csv + '\n\n';
    });
    return text;
  } catch (e) {
    console.warn('Excel extraction failed:', e);
    return '';
  }
}

/**
 * Extract text from CSV files
 */
async function extractCsvText(file: File): Promise<string> {
  return file.text();
}

/**
 * Extract text from images using Claude vision API
 */
async function extractImageText(file: File, claudeKey?: string): Promise<string> {
  try {
    const base64 = await fileToBase64(file);
    const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

    const response = await fetch('/api/ai-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'claude',
        model: 'claude-3-5-sonnet-20241022',
        system: 'Extract all text and data from this image. Return structured information about any tables, forms, or text found.',
        messages: [{
          role: 'user',
          content: [{
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64 }
          }, {
            type: 'text',
            text: 'Extract all text and data from this image in detail.'
          }]
        }],
        clientApiKey: claudeKey
      })
    });

    if (!response.ok) throw new Error('Image extraction failed');
    const data = await response.json();
    return data?.content?.[0]?.text ?? '';
  } catch (e) {
    console.warn('Image extraction failed:', e);
    return '';
  }
}

/**
 * Extract text from DOCX files
 */
async function extractDocxText(file: File): Promise<string> {
  try {
    const { default: mammoth } = await import('mammoth');
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch (e) {
    console.warn('DOCX extraction failed:', e);
    return '';
  }
}

/**
 * Lazy load pdfjs library
 */
async function importPdfLib() {
  const { default: PdfJs } = await import('pdfjs-dist');
  PdfJs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${PdfJs.version}/pdf.worker.min.js`;
  return PdfJs;
}

/**
 * Lazy load xlsx library
 */
async function importExcelLib() {
  return import('xlsx');
}

/**
 * Convert file to base64
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Analyze extracted text and identify data type using Claude
 */
export async function analyzeFileContent(
  text: string,
  claudeKey?: string
): Promise<FileAnalysisResult> {
  const prompt = `Analyze this extracted file content and identify what type of ERP data it contains.

Content:
${text.substring(0, 5000)}

Identify:
1. What type of data is this? (orders, inventory, production, expenses, employees)
2. Extract all structured data in JSON format
3. Confidence level (0-100) in your identification

Respond in JSON format:
{
  "type": "orders|inventory|production|expenses|employees|unknown",
  "confidence": 0-100,
  "extractedData": [...],
  "notes": "any important observations"
}`;

  try {
    const response = await fetch('/api/ai-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'claude',
        model: 'claude-3-5-sonnet-20241022',
        system: 'You are an expert data extractor for pharmaceutical ERP systems. Extract data accurately and return valid JSON.',
        messages: [{ role: 'user', content: prompt }],
        json_mode: true,
        clientApiKey: claudeKey
      })
    });

    if (!response.ok) throw new Error('Analysis failed');
    const data = await response.json();
    const content = data?.content?.[0]?.text ?? '{}';
    const parsed = JSON.parse(content);

    return {
      type: parsed.type || 'unknown',
      data: parsed.extractedData || [],
      confidence: parsed.confidence || 0,
      rawText: text
    };
  } catch (e) {
    console.error('File analysis failed:', e);
    return {
      type: 'unknown',
      data: [],
      confidence: 0,
      rawText: text
    };
  }
}

/**
 * Transform extracted data into ERP entity format
 */
export function transformToErpData(
  analysisResult: FileAnalysisResult
): Order[] | InventoryItem[] | Batch[] | Expense[] | Employee[] {
  const { type, data } = analysisResult;

  switch (type) {
    case 'orders':
      return transformToOrders(data);
    case 'inventory':
      return transformToInventory(data);
    case 'production':
      return transformToProduction(data);
    case 'expenses':
      return transformToExpenses(data);
    case 'employees':
      return transformToEmployees(data);
    default:
      return [];
  }
}

function transformToOrders(data: unknown[]): Order[] {
  return (data as any[]).map(item => ({
    id: item.id || `ORD-${Date.now()}`,
    sNo: item.sNo || item.s_no || '',
    date: item.date || new Date().toISOString().split('T')[0],
    invoiceNo: item.invoiceNo || item.invoice_no || '',
    customer: item.customer || item.party || '',
    lcNo: item.lcNo || item.lc_no || '',
    country: item.country || '',
    product: item.product || '',
    quantity: parseFloat(item.quantity) || 0,
    rateUSD: parseFloat(item.rateUSD || item.rate_usd) || 0,
    amountUSD: parseFloat(item.amountUSD || item.amount_usd) || 0,
    amountOMR: parseFloat(item.amountOMR || item.amount_omr) || 0,
    status: item.status || 'Pending'
  }));
}

function transformToInventory(data: unknown[]): InventoryItem[] {
  return (data as any[]).map(item => ({
    id: item.id || `INV-${Date.now()}`,
    sNo: item.sNo || item.s_no || '',
    name: item.name || '',
    category: item.category || 'Other',
    requiredForOrders: parseFloat(item.requiredForOrders) || 0,
    stock: parseFloat(item.stock || item.presentStock) || 0,
    balanceToPurchase: parseFloat(item.balanceToPurchase) || 0,
    unit: item.unit || 'kg',
    stockDate: item.stockDate || new Date().toISOString().split('T')[0]
  }));
}

function transformToProduction(data: unknown[]): Batch[] {
  return (data as any[]).map(item => ({
    id: item.id || `BATCH-${Date.now()}`,
    product: item.product || '',
    quantity: parseFloat(item.quantity) || 0,
    actualYield: parseFloat(item.actualYield) || 0,
    expectedYield: parseFloat(item.expectedYield) || 100,
    status: item.status || 'In-Progress',
    timestamp: item.timestamp || new Date().toISOString(),
    dispatchDate: item.dispatchDate
  }));
}

function transformToExpenses(data: unknown[]): Expense[] {
  return (data as any[]).map(item => ({
    id: item.id || `EXP-${Date.now()}`,
    description: item.description || '',
    category: item.category || 'Other',
    amount: parseFloat(item.amount) || 0,
    status: item.status || 'Pending',
    dueDate: item.dueDate || new Date().toISOString().split('T')[0]
  })) as Expense[];
}

function transformToEmployees(data: unknown[]): Employee[] {
  return (data as any[]).map(item => ({
    id: item.id || `EMP-${Date.now()}`,
    name: item.name || '',
    role: item.role || '',
    department: item.department || 'Admin',
    salary: parseFloat(item.salary) || 0,
    status: item.status || 'Active',
    joinDate: item.joinDate || new Date().toISOString().split('T')[0]
  })) as Employee[];
}

export interface FileLoaderConfig {
  claudeKey?: string;
  geminiKey?: string;
  preferredProvider?: 'claude' | 'gemini';
}

/**
 * Complete file upload and processing pipeline
 */
export async function processFileUpload(
  file: File,
  config: FileLoaderConfig
): Promise<FileAnalysisResult> {
  // 1. Extract content
  const content = await extractFileContent(file, config.claudeKey);
  
  // 2. Analyze and identify data type
  const analysis = await analyzeFileContent(content, config.claudeKey);
  
  return analysis;
}
