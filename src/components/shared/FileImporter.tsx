import React, { useState, useRef } from 'react';
import { Upload, FileText, Check, X, ChevronRight, AlertCircle } from 'lucide-react';
export interface FieldMapping { erpField: string; label: string; aliases: string[]; required?: boolean; }
interface Props { title?: string; fieldMappings: FieldMapping[]; onImport: (rows: Record<string, unknown>[]) => void; onClose?: () => void; }
type Step = 'upload' | 'map' | 'preview';
export const FileImporter: React.FC<Props> = ({ title = 'Import from CSV', fieldMappings, onImport, onClose }) => {
  const [step, setStep] = useState<Step>('upload');
  const [isDragging, setDrag] = useState(false);
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [colMap, setColMap] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const parseCSV = (text: string) => {
    const splitLine = (line: string): string[] => { const res: string[] = []; let cur = ''; let inQ = false; for (const ch of line) { if (ch === '"') { inQ = !inQ; } else if (ch === ',' && !inQ) { res.push(cur.trim()); cur = ''; } else { cur += ch; } } res.push(cur.trim()); return res; };
    const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return { headers: [] as string[], rows: [] as Record<string, string>[] };
    const hdrs = splitLine(lines[0]);
    const parsedRows = lines.slice(1).map(line => { const vals = splitLine(line); return hdrs.reduce<Record<string, string>>((o, h, i) => { o[h] = vals[i] ?? ''; return o; }, {}); });
    return { headers: hdrs, rows: parsedRows };
  };
  const autoMap = (hdrs: string[]): Record<string, string> => { const map: Record<string, string> = {}; for (const fm of fieldMappings) { const match = hdrs.find(h => fm.aliases.some(alias => h.toLowerCase().replace(/[\s_\-\.]/g, '').includes(alias.toLowerCase().replace(/[\s_\-\.]/g, '')))); if (match) map[fm.erpField] = match; } return map; };
  const handleFile = async (file: File) => { setError(''); if (!file.name.match(/\.(csv|txt)$/i)) { setError('Please upload a .csv or .txt file.'); return; } const text = await file.text(); const { headers: hdrs, rows: parsedRows } = parseCSV(text); if (!hdrs.length) { setError('Could not parse file.'); return; } setFileName(file.name); setHeaders(hdrs); setRows(parsedRows); setColMap(autoMap(hdrs)); setStep('map'); };
  const buildRows = (): Record<string, unknown>[] => rows.map(row => { const obj: Record<string, unknown> = {}; for (const fm of fieldMappings) { const col = colMap[fm.erpField]; if (col && row[col] !== undefined) obj[fm.erpField] = row[col]; } return obj; }).filter(obj => Object.keys(obj).length > 0);
  const mappedCount = Object.values(colMap).filter(Boolean).length;
  const reset = () => { setStep('upload'); setRows([]); setHeaders([]); setFileName(''); setColMap({}); setError(''); };
  return (
    <div className="bg-white border border-[#D4AF37]/30 rounded-xl p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5"><FileText size={13} className="text-[#D4AF37]"/> {title}</p>
        {onClose && <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 rounded"><X size={13}/></button>}
      </div>
      {error && <div className="flex items-center gap-2 text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2"><AlertCircle size={12}/> {error}</div>}
      {step === 'upload' && (<label onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }} className={`flex flex-col items-center justify-center h-20 border-2 border-dashed rounded-xl cursor-pointer transition-all ${isDragging ? 'border-[#D4AF37] bg-[#D4AF37]/5' : 'border-gray-200 hover:border-[#D4AF37]/40 hover:bg-gray-50'}`}><Upload size={18} className="text-slate-400 mb-1"/><p className="text-[11px] text-slate-500">Drop CSV or click to browse</p><input ref={inputRef} type="file" className="hidden" accept=".csv,.txt" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}/></label>)}
      {step === 'map' && (<div className="space-y-2"><p className="text-[10px] text-slate-500"><span className="font-bold text-slate-700">{fileName}</span> · {rows.length} rows · <span className={mappedCount === fieldMappings.length ? 'text-green-600 font-bold' : 'text-amber-600 font-bold'}>{mappedCount}/{fieldMappings.length} auto-mapped</span></p><div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">{fieldMappings.map(fm => (<div key={fm.erpField}><label className="text-[9px] font-bold text-slate-500 uppercase">{fm.label}{fm.required && <span className="text-red-400">*</span>}</label><select value={colMap[fm.erpField] || ''} onChange={e => setColMap(prev => ({ ...prev, [fm.erpField]: e.target.value }))} className={`w-full mt-0.5 text-[11px] bg-white border rounded-lg px-2 py-1 focus:outline-none ${colMap[fm.erpField] ? 'border-green-300' : 'border-gray-200'}`}><option value="">— skip —</option>{headers.map(h => <option key={h} value={h}>{h}</option>)}</select></div>))}</div><div className="flex gap-2"><button onClick={reset} className="text-[11px] font-bold text-slate-500 bg-gray-100 px-3 py-1.5 rounded-lg">Back</button><button onClick={() => setStep('preview')} className="flex-1 flex items-center justify-center gap-1 text-[11px] font-bold text-slate-950 bg-[#D4AF37] px-3 py-1.5 rounded-lg">Preview <ChevronRight size={11}/></button></div></div>)}
      {step === 'preview' && (<div className="space-y-2"><p className="text-[10px] text-slate-500">First 3 of <span className="font-bold">{rows.length}</span> rows:</p><div className="space-y-1 max-h-36 overflow-y-auto">{buildRows().slice(0, 3).map((row, i) => (<div key={i} className="text-[10px] bg-gray-50 border border-gray-200 rounded-lg p-2 flex flex-wrap gap-x-3">{Object.entries(row).map(([k, v]) => <span key={k}><span className="font-bold text-slate-500">{k}:</span> {String(v)}</span>)}</div>))}</div><div className="flex gap-2"><button onClick={() => setStep('map')} className="text-[11px] font-bold text-slate-500 bg-gray-100 px-3 py-1.5 rounded-lg">Back</button><button onClick={() => { onImport(buildRows()); reset(); }} className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-bold text-white bg-green-600 px-3 py-1.5 rounded-lg"><Check size={12}/> Import {rows.length} Rows</button></div></div>)}
    </div>
  );
};
