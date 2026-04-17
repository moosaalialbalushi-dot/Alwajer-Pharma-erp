import React, { useCallback, useState } from 'react';
import { Inbox, Loader2, FileText, Check, AlertTriangle, ArrowRight, X, Upload } from 'lucide-react';
import { classifyAndExtract, MODULE_TO_ENTITY, type IntakeResult, type IntakeModule } from '@/services/smartIntake';
import type { EntityType, TabId } from '@/types';

interface IntakeItem {
  id: string;
  file: File;
  previewUrl?: string;
  status: 'queued' | 'analyzing' | 'done' | 'error';
  result?: IntakeResult;
  error?: string;
}

interface Props {
  claudeKey?: string;
  onSaveToModule: (type: EntityType, data: Record<string, unknown>) => void;
  onNavigate: (tab: TabId) => void;
}

const MODULE_LABEL: Record<IntakeModule, string> = {
  sales: 'Sales Order',
  procurement: 'Procurement / Vendor',
  accounting: 'Accounting / Expense',
  hr: 'HR / Employee',
  rd: 'R&D Project',
  bd: 'Business Dev Lead',
  samples: 'Sample',
  logistics: 'Shipment',
  inventory: 'Inventory Item',
  unknown: 'Unknown',
};

const MODULE_COLOR: Record<IntakeModule, string> = {
  sales: 'bg-green-50 text-green-700 border-green-200',
  procurement: 'bg-blue-50 text-blue-700 border-blue-200',
  accounting: 'bg-amber-50 text-amber-700 border-amber-200',
  hr: 'bg-purple-50 text-purple-700 border-purple-200',
  rd: 'bg-pink-50 text-pink-700 border-pink-200',
  bd: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  samples: 'bg-teal-50 text-teal-700 border-teal-200',
  logistics: 'bg-orange-50 text-orange-700 border-orange-200',
  inventory: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  unknown: 'bg-gray-50 text-gray-700 border-gray-200',
};

export const SmartIntake: React.FC<Props> = ({ claudeKey, onSaveToModule, onNavigate }) => {
  const [items, setItems] = useState<IntakeItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const newItems: IntakeItem[] = Array.from(files).map(f => ({
      id: `${Date.now()}-${f.name}-${Math.random().toString(36).slice(2, 6)}`,
      file: f,
      previewUrl: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined,
      status: 'queued',
    }));
    setItems(prev => [...newItems, ...prev]);

    for (const it of newItems) {
      setItems(prev => prev.map(p => p.id === it.id ? { ...p, status: 'analyzing' } : p));
      try {
        const result = await classifyAndExtract(it.file, claudeKey);
        setItems(prev => prev.map(p => p.id === it.id ? { ...p, status: 'done', result } : p));
      } catch (e) {
        setItems(prev => prev.map(p => p.id === it.id ? { ...p, status: 'error', error: String(e) } : p));
      }
    }
  }, [claudeKey]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) void processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) void processFiles(e.target.files);
    e.target.value = '';
  }, [processFiles]);

  const confirmSave = useCallback((item: IntakeItem) => {
    if (!item.result) return;
    const entity = MODULE_TO_ENTITY[item.result.module];
    if (!entity) return;
    onSaveToModule(entity as EntityType, item.result.fields);
    setItems(prev => prev.filter(p => p.id !== item.id));
  }, [onSaveToModule]);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(p => p.id !== id));
  }, []);

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Inbox className="text-[#D4AF37]" size={20}/> Smart Intake
        </h2>
        <p className="text-xs text-slate-500">Drop any document — Claude classifies & auto-fills the right module.</p>
      </div>

      {!claudeKey && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-700 flex items-start gap-2">
          <AlertTriangle size={14} className="mt-0.5 shrink-0"/>
          <div>
            Claude API key is not set. Open <strong>Settings</strong> and paste your key from <code>console.anthropic.com</code> to enable smart intake.
          </div>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative rounded-2xl border-2 border-dashed transition-all ${
          isDragging
            ? 'border-[#D4AF37] bg-[#D4AF37]/10'
            : 'border-gray-300 bg-gray-50 hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/5'
        }`}
      >
        <label className="flex flex-col items-center justify-center p-10 cursor-pointer">
          <Upload size={36} className="text-[#D4AF37] mb-3"/>
          <p className="text-sm font-bold text-slate-900 mb-1">Drop files here or click to upload</p>
          <p className="text-xs text-slate-500">Receipts, invoices, photos, PDFs, spreadsheets — anything.</p>
          <p className="text-[10px] text-slate-400 mt-2">Claude will classify and auto-fill the correct module.</p>
          <input
            type="file"
            multiple
            className="hidden"
            onChange={handleFileInput}
            accept="image/*,.pdf,.docx,.xlsx,.csv,.txt,.json"
          />
        </label>
      </div>

      {/* Queue */}
      {items.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Processing Queue ({items.length})</h3>
          {items.map(item => (
            <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-start gap-3">
                {item.previewUrl ? (
                  <img src={item.previewUrl} alt="" className="w-16 h-16 object-cover rounded-lg border border-gray-200"/>
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                    <FileText size={20} className="text-slate-400"/>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-bold text-slate-900 truncate">{item.file.name}</p>
                    <span className="text-[10px] text-slate-400">{(item.file.size / 1024).toFixed(1)} KB</span>
                  </div>

                  {item.status === 'analyzing' && (
                    <div className="flex items-center gap-2 text-xs text-[#D4AF37]">
                      <Loader2 size={12} className="animate-spin"/> Claude is reading the document…
                    </div>
                  )}

                  {item.status === 'error' && (
                    <p className="text-xs text-red-600">Error: {item.error}</p>
                  )}

                  {item.status === 'done' && item.result && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${MODULE_COLOR[item.result.module]}`}>
                          {MODULE_LABEL[item.result.module]}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {Math.round((item.result.confidence || 0) * 100)}% confident
                        </span>
                        <span className="text-xs text-slate-700 truncate">{item.result.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 italic">{item.result.reason}</p>

                      {Object.keys(item.result.fields || {}).length > 0 && (
                        <details className="text-xs bg-gray-50 border border-gray-200 rounded-lg">
                          <summary className="px-3 py-2 cursor-pointer text-slate-600 font-medium">
                            Extracted fields
                          </summary>
                          <div className="px-3 pb-3 pt-1 space-y-1">
                            {Object.entries(item.result.fields).map(([k, v]) => (
                              <div key={k} className="flex gap-2 text-[11px]">
                                <span className="text-slate-500 font-mono shrink-0">{k}:</span>
                                <span className="text-slate-900 font-mono break-all">{v == null ? '—' : String(v)}</span>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}

                      {item.result.warnings && item.result.warnings.length > 0 && (
                        <div className="text-[10px] text-amber-700 flex items-center gap-1">
                          <AlertTriangle size={10}/> {item.result.warnings.join(' · ')}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5 shrink-0">
                  {item.status === 'done' && item.result && item.result.module !== 'unknown' && (
                    <>
                      <button
                        onClick={() => confirmSave(item)}
                        className="px-3 py-1.5 bg-[#D4AF37] hover:bg-[#c4a030] text-slate-950 text-[11px] font-bold rounded-lg flex items-center gap-1"
                      >
                        <Check size={12}/> Save
                      </button>
                      <button
                        onClick={() => {
                          const tab = item.result?.module;
                          if (tab) onNavigate(tab as TabId);
                        }}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-slate-700 text-[11px] font-bold rounded-lg flex items-center gap-1"
                      >
                        Open <ArrowRight size={12}/>
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="px-2 py-1 text-slate-400 hover:text-red-600 text-[10px] rounded"
                    title="Remove"
                  >
                    <X size={12}/>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
