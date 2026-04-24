import React, { useState, useRef } from 'react';
import { Upload, Loader2, X, Check, AlertCircle, Trash2, FileSpreadsheet, Image as ImageIcon, ChevronRight, Download } from 'lucide-react';
import type { EntityType } from '@/types';

// ── Field schemas per entity type ──────────────────────────────────────────
const SCHEMAS: Record<string, { key: string; label: string; aliases: string[] }[]> = {
  sales: [
    { key: 'invoiceNo', label: 'Invoice No', aliases: ['invoice','inv','pi no','invoice no','invoice number','pi','order no'] },
    { key: 'date', label: 'Date', aliases: ['date','invoice date','order date','pi date'] },
    { key: 'customer', label: 'Customer', aliases: ['customer','buyer','client','party','consignee','bill to'] },
    { key: 'country', label: 'Country', aliases: ['country','destination','nation'] },
    { key: 'product', label: 'Product', aliases: ['product','item','description','goods','material','commodity','product name'] },
    { key: 'quantity', label: 'Qty (Kg)', aliases: ['quantity','qty','kg','net weight','weight','qnty'] },
    { key: 'rateUSD', label: 'Rate (USD/Kg)', aliases: ['rate','price','unit price','usd','rate usd','rate/kg','price/kg','unit rate'] },
    { key: 'amountUSD', label: 'Amount (USD)', aliases: ['amount','total','amount usd','value','total usd','total amount','gross'] },
    { key: 'status', label: 'Status', aliases: ['status','order status'] },
    { key: 'paymentTerms', label: 'Payment Terms', aliases: ['payment','terms','payment terms'] },
    { key: 'lcNo', label: 'LC/PO No', aliases: ['lc','po','reference','lc no','po no','lc/po','ref no'] },
  ],
  inventory: [
    { key: 'sNo', label: 'S.No', aliases: ['s no','sno','serial','sr no','#'] },
    { key: 'name', label: 'Material Name', aliases: ['name','material','item','description','raw material','material name'] },
    { key: 'category', label: 'Category', aliases: ['category','type','cat','class'] },
    { key: 'stock', label: 'Stock (Kg)', aliases: ['stock','present stock','qty','quantity','available','balance','on hand'] },
    { key: 'unit', label: 'Unit', aliases: ['unit','uom','measure'] },
    { key: 'requiredForOrders', label: 'Required for Orders', aliases: ['required','requirement','required for orders','order qty','needed'] },
    { key: 'balanceToPurchase', label: 'Balance to Purchase', aliases: ['balance','to purchase','shortage','balance to purchase','pending'] },
  ],
  production: [
    { key: 'product', label: 'Product', aliases: ['product','item','batch product','material','product name'] },
    { key: 'quantity', label: 'Quantity (Kg)', aliases: ['quantity','qty','batch size','kg','weight'] },
    { key: 'actualYield', label: 'Actual Yield (%)', aliases: ['actual yield','yield','actual','yield %','achieved'] },
    { key: 'expectedYield', label: 'Expected Yield (%)', aliases: ['expected yield','expected','target yield','target'] },
    { key: 'status', label: 'Status', aliases: ['status','batch status'] },
    { key: 'timestamp', label: 'Date', aliases: ['date','timestamp','production date','batch date','mfg date'] },
    { key: 'dispatchDate', label: 'Dispatch Date', aliases: ['dispatch','dispatch date','ship date'] },
  ],
  accounting: [
    { key: 'description', label: 'Description', aliases: ['description','particulars','details','narration','item','bill for','expense'] },
    { key: 'category', label: 'Category', aliases: ['category','type','head','expense type','account'] },
    { key: 'amount', label: 'Amount (USD)', aliases: ['amount','value','total','usd','price','cost','sum'] },
    { key: 'status', label: 'Status', aliases: ['status','payment status','paid','due'] },
    { key: 'dueDate', label: 'Due Date', aliases: ['due date','date','payment date','due','bill date','invoice date'] },
  ],
  hr: [
    { key: 'name', label: 'Employee Name', aliases: ['name','employee name','staff name','full name','employee'] },
    { key: 'role', label: 'Role', aliases: ['role','designation','position','title','job title'] },
    { key: 'department', label: 'Department', aliases: ['department','dept','division','section'] },
    { key: 'salary', label: 'Salary (USD)', aliases: ['salary','wage','pay','monthly salary','ctc','compensation'] },
    { key: 'status', label: 'Status', aliases: ['status','employment status','active'] },
    { key: 'joinDate', label: 'Join Date', aliases: ['join date','joining date','start date','doj','date of joining'] },
  ],
  vendors: [
    { key: 'name', label: 'Vendor Name', aliases: ['name','vendor','supplier','company','manufacturer','party'] },
    { key: 'category', label: 'Category', aliases: ['category','type','material type','supply type'] },
    { key: 'country', label: 'Country', aliases: ['country','origin','location','nation'] },
    { key: 'rating', label: 'Rating', aliases: ['rating','score','grade','quality'] },
    { key: 'status', label: 'Status', aliases: ['status','vendor status','approval'] },
  ],
  procurement: [
    { key: 'name', label: 'Vendor/Supplier', aliases: ['name','vendor','supplier','company','manufacturer','party'] },
    { key: 'category', label: 'Category', aliases: ['category','type','material type'] },
    { key: 'country', label: 'Country', aliases: ['country','origin','location'] },
    { key: 'rating', label: 'Rating', aliases: ['rating','score','grade'] },
    { key: 'status', label: 'Status', aliases: ['status','approval','verified'] },
  ],
  rd: [
    { key: 'title', label: 'Project Title', aliases: ['title','project','product','name','product name'] },
    { key: 'productCode', label: 'Product Code', aliases: ['code','product code','item code','sku'] },
    { key: 'dosageForm', label: 'Dosage Form', aliases: ['dosage form','form','formulation','dosage'] },
    { key: 'strength', label: 'Strength', aliases: ['strength','dose','concentration','potency'] },
    { key: 'status', label: 'Status', aliases: ['status','project status','stage','phase'] },
    { key: 'optimizationScore', label: 'Score (%)', aliases: ['score','optimization','completion','progress'] },
  ],
  bd: [
    { key: 'targetMarket', label: 'Target Market', aliases: ['market','target market','region','country','territory'] },
    { key: 'opportunity', label: 'Opportunity', aliases: ['opportunity','deal','product','item','description'] },
    { key: 'potentialValue', label: 'Potential Value', aliases: ['value','potential','amount','deal value','revenue'] },
    { key: 'status', label: 'Status', aliases: ['status','pipeline','stage'] },
    { key: 'probability', label: 'Probability (%)', aliases: ['probability','chance','%','likelihood','conversion'] },
  ],
  samples: [
    { key: 'product', label: 'Product', aliases: ['product','item','material','sample','name'] },
    { key: 'destination', label: 'Destination', aliases: ['destination','country','to','send to','consignee'] },
    { key: 'quantity', label: 'Quantity', aliases: ['quantity','qty','amount','weight','units'] },
    { key: 'status', label: 'Status', aliases: ['status','sample status','dispatch status'] },
    { key: 'trackingNumber', label: 'Tracking No', aliases: ['tracking','awb','tracking number','airway bill','waybill'] },
  ],
  logistics: [
    { key: 'referenceNo', label: 'Reference No', aliases: ['reference','ref no','shipment no','bl no','awb'] },
    { key: 'product', label: 'Product', aliases: ['product','cargo','goods','item'] },
    { key: 'quantity', label: 'Quantity', aliases: ['quantity','qty','weight','kg'] },
    { key: 'origin', label: 'Origin', aliases: ['origin','from','port of loading'] },
    { key: 'destination', label: 'Destination', aliases: ['destination','to','port of discharge'] },
    { key: 'carrier', label: 'Carrier', aliases: ['carrier','airline','shipping line','courier'] },
    { key: 'status', label: 'Status', aliases: ['status','shipment status'] },
  ],
};

const AI_CONTEXT: Record<string, string> = {
  sales: 'This may be a proforma invoice (PI), purchase order (PO), sales report, LC, commercial invoice, or order record. Extract each product line item as a separate record.',
  inventory: 'This may be a stock sheet, inventory report, material list, or store register. Extract each material as a separate record.',
  production: 'This may be a batch manufacturing record (BMR), production report, or batch log. Extract each batch as a separate record.',
  accounting: 'This may be a bill, receipt, invoice, expense report, or payment voucher. Extract each expense/payment as a separate record.',
  hr: 'This may be an employee list, payroll sheet, staff register, or HR report. Extract each employee as a separate record.',
  vendors: 'This may be a vendor/supplier list, approved vendor directory, or quotation. Extract each vendor/supplier as a separate record.',
  procurement: 'This may be a purchase order, commercial invoice, indent, quotation, supplier price list, or procurement document. Extract each supplier/vendor as a record.',
  rd: 'This may be an R&D project register, formulation sheet, or product development list. Extract each project as a separate record.',
  bd: 'This may be a business development pipeline, leads list, market analysis, or opportunity tracker. Extract each opportunity as a separate record.',
  samples: 'This may be a sample dispatch log, sample tracking sheet, or sample register. Extract each sample entry as a separate record.',
};

function autoMap(headers: string[], schema: { key: string; aliases: string[] }[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const field of schema) {
    const match = headers.find(h => {
      const norm = h.toLowerCase().replace(/[\s_\-\.\/]/g, '');
      return field.aliases.some(a => norm.includes(a.toLowerCase().replace(/[\s_\-\.\/]/g, '')) || a.toLowerCase().replace(/[\s_\-\.\/]/g, '').includes(norm));
    });
    if (match) map[field.key] = match;
  }
  return map;
}

function applyMap(rawRow: Record<string, string>, colMap: Record<string, string>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [erpKey, col] of Object.entries(colMap)) {
    if (col && rawRow[col] !== undefined) {
      const val = rawRow[col];
      const numFields = ['quantity','rateUSD','amountUSD','amountOMR','amount','salary','stock','requiredForOrders','balanceToPurchase','actualYield','expectedYield','rating','probability','optimizationScore','cost'];
      out[erpKey] = numFields.includes(erpKey) ? (isNaN(Number(val)) ? val : Number(val)) : val;
    }
  }
  return out;
}

function postProcess(rows: Record<string, unknown>[], entityType: string): Record<string, unknown>[] {
  return rows.map(r => {
    const out = { ...r };
    if (entityType === 'sales') {
      const qty = Number(out.quantity) || 0;
      const rate = Number(out.rateUSD) || 0;
      if (!out.amountUSD && qty && rate) out.amountUSD = Number((qty * rate).toFixed(2));
      if (!out.amountOMR && out.amountUSD) out.amountOMR = Number((Number(out.amountUSD) * 0.3845).toFixed(3));
      if (!out.status) out.status = 'Pending';
    }
    if (entityType === 'production') {
      if (!out.expectedYield) out.expectedYield = 100;
      if (!out.status) out.status = 'Scheduled';
    }
    if (entityType === 'accounting') {
      if (!out.status) out.status = 'Pending';
      if (!out.category) out.category = 'Utilities';
    }
    if (entityType === 'hr') {
      if (!out.status) out.status = 'Active';
      if (!out.department) out.department = 'Admin';
    }
    if (entityType === 'vendors' || entityType === 'procurement') {
      if (!out.rating) out.rating = 3;
      if (!out.status) out.status = 'Audit Pending';
    }
    return out;
  });
}

async function parseSpreadsheet(file: File): Promise<{ headers: string[]; rawRows: Record<string, string>[] }> {
  const { read, utils } = await import('xlsx');
  const buffer = await file.arrayBuffer();
  const wb = read(buffer, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const json: Record<string, unknown>[] = utils.sheet_to_json(ws, { defval: '' });
  if (!json.length) return { headers: [], rawRows: [] };
  const headers = Object.keys(json[0]);
  const rawRows = json.map(r => {
    const out: Record<string, string> = {};
    for (const h of headers) out[h] = String((r as Record<string, unknown>)[h] ?? '');
    return out;
  });
  return { headers, rawRows };
}

async function parseCSV(file: File): Promise<{ headers: string[]; rawRows: Record<string, string>[] }> {
  const text = await file.text();
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { headers: [], rawRows: [] };
  const splitLine = (line: string) => {
    const res: string[] = []; let cur = ''; let inQ = false;
    for (const ch of line) {
      if (ch === '"') inQ = !inQ;
      else if (ch === ',' && !inQ) { res.push(cur.trim()); cur = ''; }
      else cur += ch;
    }
    res.push(cur.trim()); return res;
  };
  const headers = splitLine(lines[0]);
  const rawRows = lines.slice(1).map(line => {
    const vals = splitLine(line);
    return headers.reduce<Record<string, string>>((o, h, i) => { o[h] = vals[i] ?? ''; return o; }, {});
  });
  return { headers, rawRows };
}

async function extractWithAI(
  file: File,
  entityType: string,
  schema: { key: string; label: string; aliases: string[] }[]
): Promise<Record<string, unknown>[]> {
  const context = AI_CONTEXT[entityType] || 'Extract all records from this document.';
  const fieldList = schema.map(f => `"${f.key}": ${f.label}`).join(', ');
  const prompt = `You are an expert pharmaceutical ERP data extractor.
${context}

Extract ALL records. Return ONLY a JSON array (no markdown, no explanation).
Each object must use these exact field names: ${fieldList}

Rules:
- Every line item / row / transaction = one object in the array
- Dates: YYYY-MM-DD format
- Numbers: digits only, no symbols
- Missing fields: ""
- Extract EVERY record you can find

Return: [{"field":"value",...}, ...]`;

  const isImage = file.type.startsWith('image/');
  const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

  let imageBase64: string | undefined;
  let mimeType: string | undefined;
  let content = '';

  if (isImage) {
    imageBase64 = await fileToBase64(file);
    mimeType = file.type;
  } else if (isPDF) {
    content = await extractPDFText(file);
  } else {
    content = await file.text();
  }

  const res = await fetch('/api/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, content, imageBase64, mimeType }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `Server error ${res.status}` }));
    throw new Error((err as { error?: string }).error || `Extraction failed (${res.status})`);
  }

  const data = await res.json() as { records?: Record<string, unknown>[] };
  if (!data.records || !data.records.length) throw new Error('No records found in document. Try a clearer image.');
  return data.records;
}

async function extractPDFText(file: File): Promise<string> {
  try {
    const { default: PdfJs } = await import('pdfjs-dist');
    PdfJs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${PdfJs.version}/pdf.worker.min.js`;
    const ab = await file.arrayBuffer();
    const pdf = await PdfJs.getDocument(ab).promise;
    let text = '';
    for (let i = 0; i < Math.min(pdf.numPages, 10); i++) {
      const page = await pdf.getPage(i + 1);
      const content = await page.getTextContent();
      text += content.items.map((item: any) => item.str).join(' ') + '\n';
    }
    return text;
  } catch { return ''; }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Example rows per entity for template download ──────────────────────────
const EXAMPLES: Record<string, Record<string, string>> = {
  sales:       { invoiceNo: 'PI-2025-001', date: '2025-01-15', customer: 'ABC Pharma Ltd', country: 'UAE', product: 'Omeprazole 20mg', quantity: '1000', rateUSD: '12.50', amountUSD: '12500', status: 'Pending', paymentTerms: 'AT SIGHT', lcNo: 'LC-12345' },
  inventory:   { sNo: '1', name: 'Omeprazole Powder', category: 'API', stock: '500', unit: 'Kg', requiredForOrders: '1000', balanceToPurchase: '500' },
  production:  { product: 'Omeprazole 20mg Pellets', quantity: '500', actualYield: '98', expectedYield: '100', status: 'Scheduled', timestamp: '2025-01-15', dispatchDate: '2025-02-01' },
  accounting:  { description: 'Raw Material Purchase', category: 'Raw Materials', amount: '15000', status: 'Pending', dueDate: '2025-02-01' },
  hr:          { name: 'Ahmed Al Balushi', role: 'Production Supervisor', department: 'Production', salary: '1200', status: 'Active', joinDate: '2024-01-01' },
  vendors:     { name: 'Shandong Pharma Co.', category: 'API', country: 'China', rating: '4', status: 'Verified' },
  procurement: { name: 'Shandong Pharma Co.', category: 'API', country: 'China', rating: '4', status: 'Verified' },
  rd:          { title: 'Esomeprazole 40mg Pellets', productCode: 'ESP-40', dosageForm: 'Pellet', strength: '40mg', status: 'Formulation', optimizationScore: '65' },
  bd:          { targetMarket: 'Saudi Arabia', opportunity: 'Omeprazole 20mg Registration', potentialValue: '500000', status: 'Prospecting', probability: '40' },
  samples:     { product: 'Omeprazole 20mg Pellets', destination: 'UAE', quantity: '100g', status: 'Dispatched', trackingNumber: 'AW1234567890' },
  logistics:   { referenceNo: 'SHP-2025-001', product: 'Omeprazole 20mg', quantity: '1000', origin: 'Muscat', destination: 'Dubai', carrier: 'Emirates SkyCargo', status: 'Scheduled' },
};

async function downloadTemplate(entityType: string, schema: { key: string; label: string }[]) {
  const { utils, writeFile } = await import('xlsx');
  const headers = schema.map(f => f.label);
  const keys = schema.map(f => f.key);
  const example = EXAMPLES[entityType] ?? {};
  const exampleRow = keys.map(k => example[k] ?? '');
  const ws = utils.aoa_to_sheet([headers, exampleRow]);
  // Set column widths
  ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length + 4, 16) }));
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, entityType.charAt(0).toUpperCase() + entityType.slice(1));
  writeFile(wb, `${entityType}_template.xlsx`);
}

// ── Main component ──────────────────────────────────────────────────────────
interface Props {
  entityType: EntityType | 'vendors';
  onImport: (rows: Record<string, unknown>[]) => void;
  apiConfig?: unknown;
  buttonLabel?: string;
}

type Step = 'idle' | 'loading' | 'mapping' | 'review';

export const SmartImporter: React.FC<Props> = ({ entityType, onImport, apiConfig, buttonLabel = 'Import File' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<Step>('idle');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [colMap, setColMap] = useState<Record<string, string>>({});
  const [reviewRows, setReviewRows] = useState<Record<string, unknown>[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  const schema = SCHEMAS[entityType] ?? SCHEMAS['sales'];
  const displayKeys = schema.slice(0, 4).map(f => f.key);

  const reset = () => { setStep('idle'); setError(''); setMsg(''); setHeaders([]); setRawRows([]); setColMap({}); setReviewRows([]); setSelected(new Set()); };
  const close = () => { setIsOpen(false); reset(); };

  const handleFile = async (file: File) => {
    setError(''); setMsg('');
    const name = file.name.toLowerCase();
    const isXlsx = name.endsWith('.xlsx') || name.endsWith('.xls');
    const isCsv = name.endsWith('.csv');
    const isImage = file.type.startsWith('image/');
    const isPDF = name.endsWith('.pdf');

    if (isXlsx || isCsv) {
      setStep('loading'); setMsg('Reading spreadsheet…');
      try {
        const { headers: h, rawRows: r } = isXlsx ? await parseSpreadsheet(file) : await parseCSV(file);
        if (!h.length) { setError('Could not read file. Make sure it has a header row.'); setStep('idle'); return; }
        setHeaders(h); setRawRows(r); setColMap(autoMap(h, schema)); setStep('mapping');
      } catch (e) { setError(`Read error: ${e instanceof Error ? e.message : String(e)}`); setStep('idle'); }
      return;
    }

    if (isImage || isPDF) {
      setStep('loading'); setMsg(`Extracting data with AI from ${isImage ? 'image' : 'PDF'}…`);
      try {
        const rows = await extractWithAI(file, entityType, schema);
        if (!rows.length) { setError('No records found in document. Try a clearer image.'); setStep('idle'); return; }
        const processed = postProcess(rows, entityType);
        setReviewRows(processed);
        setSelected(new Set(processed.map((_, i) => i)));
        setStep('review');
      } catch (e) { setError(e instanceof Error ? e.message : String(e)); setStep('idle'); }
      return;
    }

    setError('Unsupported file type. Use Excel (.xlsx), CSV (.csv), or an image/PDF of a document.');
  };

  const handleMappingConfirm = () => {
    const processed = postProcess(rawRows.map(r => applyMap(r, colMap)), entityType);
    setReviewRows(processed);
    setSelected(new Set(processed.map((_, i) => i)));
    setStep('review');
  };

  const handleImport = () => {
    const rows = reviewRows.filter((_, i) => selected.has(i));
    if (!rows.length) return;
    onImport(rows);
    close();
  };

  const toggleRow = (i: number) => setSelected(prev => {
    const next = new Set(prev);
    next.has(i) ? next.delete(i) : next.add(i);
    return next;
  });

  const removeRow = (i: number) => {
    setReviewRows(prev => prev.filter((_, idx) => idx !== i));
    setSelected(prev => { const next = new Set<number>(); prev.forEach(v => { if (v < i) next.add(v); else if (v > i) next.add(v - 1); }); return next; });
  };

  const mappedCount = Object.values(colMap).filter(Boolean).length;

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-[#D4AF37] to-[#c4a030] text-slate-950 rounded-lg font-bold text-xs hover:shadow-md transition-all">
        <Upload size={13}/> {buttonLabel}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && close()}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200 shrink-0">
              <div>
                <h2 className="text-base font-bold text-slate-900">Smart Import — {entityType.charAt(0).toUpperCase() + entityType.slice(1)}</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">Excel · CSV · Photo · PDF — bulk import all at once</p>
              </div>
              <button onClick={close} className="text-slate-400 hover:text-slate-900 p-1.5 rounded-lg hover:bg-gray-100"><X size={18}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <AlertCircle size={16} className="shrink-0 mt-0.5"/> {error}
                </div>
              )}

              {/* Step: idle — drop zone */}
              {step === 'idle' && (
                <>
                  <label
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                    className="flex flex-col items-center justify-center h-36 border-2 border-dashed border-[#D4AF37]/40 rounded-xl cursor-pointer hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 transition-all"
                  >
                    <Upload size={28} className="text-[#D4AF37] mb-2"/>
                    <p className="font-bold text-slate-700 text-sm">Drop file here or click to browse</p>
                    <p className="text-[11px] text-slate-500 mt-1">Excel (.xlsx), CSV (.csv), Photo (JPG/PNG), PDF</p>
                    <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv,.jpg,.jpeg,.png,.gif,.webp,.pdf" className="hidden"
                      onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}/>
                  </label>
                  {/* Download template */}
                  <button
                    onClick={() => downloadTemplate(entityType, schema)}
                    className="flex items-center justify-center gap-2 w-full py-2.5 border-2 border-dashed border-[#D4AF37]/50 rounded-xl text-sm font-bold text-[#D4AF37] hover:bg-[#D4AF37]/5 hover:border-[#D4AF37] transition-all"
                  >
                    <Download size={14}/> Download Excel Template
                  </button>
                  <p className="text-[10px] text-slate-400 text-center -mt-2">
                    Fill the template, then upload it above — no AI needed
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                    <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                      <FileSpreadsheet size={14} className="text-green-600 shrink-0"/>
                      <span><strong>Excel / CSV</strong> — multi-row spreadsheet with column mapping</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                      <ImageIcon size={14} className="text-blue-600 shrink-0"/>
                      <span><strong>Photo / PDF</strong> — AI reads invoices, POs, bills, reports</span>
                    </div>
                  </div>
                </>
              )}

              {/* Step: loading */}
              {step === 'loading' && (
                <div className="flex flex-col items-center py-12 text-slate-600">
                  <Loader2 size={32} className="animate-spin text-[#D4AF37] mb-3"/>
                  <p className="font-medium">{msg}</p>
                  <p className="text-xs text-slate-400 mt-1">This may take a few seconds…</p>
                </div>
              )}

              {/* Step: mapping (Excel/CSV) */}
              {step === 'mapping' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-700">{rawRows.length} rows found — map columns</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${mappedCount >= schema.length * 0.6 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {mappedCount}/{schema.length} auto-mapped
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                    {schema.map(field => (
                      <div key={field.key}>
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{field.label}</label>
                        <select value={colMap[field.key] || ''} onChange={e => setColMap(prev => ({ ...prev, [field.key]: e.target.value }))}
                          className={`w-full mt-0.5 text-xs border rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-[#D4AF37]/50 ${colMap[field.key] ? 'border-green-400 bg-green-50' : 'border-gray-200'}`}>
                          <option value="">— skip —</option>
                          {headers.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={reset} className="px-4 py-2 text-sm font-bold text-slate-600 bg-gray-100 hover:bg-gray-200 rounded-lg">Back</button>
                    <button onClick={handleMappingConfirm} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-bold text-slate-950 bg-[#D4AF37] hover:bg-[#c4a030] rounded-lg">
                      Preview {rawRows.length} rows <ChevronRight size={14}/>
                    </button>
                  </div>
                </div>
              )}

              {/* Step: review */}
              {step === 'review' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-700">{reviewRows.length} records extracted</p>
                    <div className="flex gap-2">
                      <button onClick={() => setSelected(new Set(reviewRows.map((_, i) => i)))} className="text-xs text-blue-600 hover:underline">All</button>
                      <button onClick={() => setSelected(new Set())} className="text-xs text-slate-500 hover:underline">None</button>
                    </div>
                  </div>
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto max-h-72 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left w-8"></th>
                            {displayKeys.map(k => {
                              const f = schema.find(s => s.key === k);
                              return <th key={k} className="px-3 py-2 text-left text-[10px] text-slate-500 uppercase font-bold whitespace-nowrap">{f?.label ?? k}</th>;
                            })}
                            <th className="px-2 py-2 w-8"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {reviewRows.map((row, i) => (
                            <tr key={i} className={`hover:bg-gray-50 transition-colors ${selected.has(i) ? '' : 'opacity-40'}`}>
                              <td className="px-3 py-2">
                                <input type="checkbox" checked={selected.has(i)} onChange={() => toggleRow(i)} className="rounded"/>
                              </td>
                              {displayKeys.map(k => (
                                <td key={k} className="px-3 py-2 max-w-[140px] truncate text-slate-700">
                                  {String(row[k] ?? '—')}
                                </td>
                              ))}
                              <td className="px-2 py-2">
                                <button onClick={() => removeRow(i)} className="text-slate-300 hover:text-red-400 transition-colors"><Trash2 size={11}/></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={reset} className="px-4 py-2 text-sm font-bold text-slate-600 bg-gray-100 hover:bg-gray-200 rounded-lg">Back</button>
                    <button onClick={handleImport} disabled={selected.size === 0}
                      className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg transition-all">
                      <Check size={15}/> Import {selected.size} record{selected.size !== 1 ? 's' : ''}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
