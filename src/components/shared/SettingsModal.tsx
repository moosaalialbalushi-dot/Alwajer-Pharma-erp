import React, { useState } from 'react';
import { X, Key, Database, Save, Bot, Image } from 'lucide-react';
import type { ApiConfig } from '@/types';

interface Props {
  isOpen: boolean;
  config: ApiConfig;
  onSave: (cfg: ApiConfig) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<Props> = ({ isOpen, config, onSave, onClose }) => {
  const [form, setForm] = useState<ApiConfig>({
    claudeKey: config.claudeKey ?? '',
    geminiKey: config.geminiKey ?? '',
    groqKey: config.groqKey ?? '',
    notebookLmSource: config.notebookLmSource ?? '',
    supabaseUrl: config.supabaseUrl ?? '',
    supabaseKey: config.supabaseKey ?? '',
    ollamaUrl: config.ollamaUrl ?? 'http://localhost:11434',
    ollamaModel: config.ollamaModel ?? 'gemma3:4b',
    logoUrl: config.logoUrl ?? '',
  });

  if (!isOpen) return null;

  const handle = (key: keyof ApiConfig, val: string) => setForm(prev => ({ ...prev, [key]: val }));

  const Field = ({
    label, field, placeholder, type = 'text', icon,
  }: { label: string; field: keyof ApiConfig; placeholder?: string; type?: string; icon?: React.ReactNode }) => (
    <div>
      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
        {icon}{label}
      </label>
      <input
        type={type} value={String(form[field] ?? '')}
        onChange={e => handle(field, e.target.value)}
        placeholder={placeholder}
        className="w-full bg-gray-50 border border-gray-200 text-slate-900 rounded-lg px-3 py-2.5 text-sm focus:border-[#D4AF37]/50 focus:outline-none"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 shrink-0">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Key className="text-[#D4AF37]" size={18}/> Settings & API Keys
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900 p-1.5 hover:bg-gray-100 rounded-lg transition-all"><X size={18}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Supabase */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Database size={11}/> Supabase (Database)
            </p>
            <Field field="supabaseUrl" label="Supabase URL" placeholder="https://xxx.supabase.co"/>
            <Field field="supabaseKey" label="Supabase Anon Key" placeholder="eyJ..." type="password"/>
          </div>

          {/* Cloud AI keys */}
          <div className="space-y-3 border-t border-gray-100 pt-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Key size={11}/> Cloud AI Keys
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-[10px] text-blue-700 leading-relaxed">
              Enter your API keys here to use AI features. Get free keys at: <strong>aistudio.google.com</strong> (Gemini), <strong>console.groq.com</strong> (Groq — fastest &amp; free), <strong>console.anthropic.com</strong> (Claude).
            </div>
            <Field field="geminiKey" label="Gemini API Key" placeholder="AIza..." type="password"/>
            <Field field="groqKey" label="Groq API Key (Fast &amp; Free)" placeholder="gsk_..." type="password"/>
            <Field field="claudeKey" label="Claude API Key" placeholder="sk-ant-..." type="password"/>
          </div>

          {/* Ollama (local AI) */}
          <div className="space-y-3 border-t border-gray-100 pt-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Bot size={11}/> Ollama (Local AI — runs on your machine)
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-[10px] text-amber-700 leading-relaxed">
              Ollama runs locally — it works when you open the app from the same computer where Ollama is installed.
              It will <strong>not</strong> work on other devices. Used for writing, copying, and small tasks to save cloud API tokens.
            </div>
            <Field field="ollamaUrl" label="Ollama URL" placeholder="http://localhost:11434"/>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Model</label>
              <select
                value={form.ollamaModel}
                onChange={e => handle('ollamaModel', e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-slate-900 rounded-lg px-3 py-2.5 text-sm focus:border-[#D4AF37]/50 focus:outline-none"
              >
                <option value="gemma3:4b">Gemma 3 4B (Recommended — Fast)</option>
                <option value="gemma3:12b">Gemma 3 12B (Better quality)</option>
                <option value="gemma3:27b">Gemma 3 27B (High quality)</option>
                <option value="llama3.2:3b">Llama 3.2 3B</option>
                <option value="mistral:7b">Mistral 7B</option>
                <option value="qwen2.5:7b">Qwen 2.5 7B</option>
              </select>
              <p className="text-[10px] text-slate-500 mt-1">Run: <code className="bg-gray-100 px-1 rounded">ollama pull gemma3:4b</code> to download the model.</p>
            </div>
          </div>

          {/* Company branding */}
          <div className="space-y-3 border-t border-gray-100 pt-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Image size={11}/> Company Logo for Documents
            </p>
            <Field
              field="logoUrl"
              label="Logo Image URL"
              placeholder="https://... or leave blank for text header"
              icon={<Image size={11}/>}
            />
            {form.logoUrl && (
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
                <img src={form.logoUrl} alt="Logo preview" className="h-10 object-contain" onError={e => (e.currentTarget.style.display = 'none')}/>
                <p className="text-[10px] text-slate-500">This logo will appear on all generated documents (Invoice, PO, Quotation, Packing List).</p>
              </div>
            )}
            {!form.logoUrl && (
              <p className="text-[10px] text-slate-500">Upload your logo to an image host (e.g. imgbb.com) and paste the URL here.</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 p-5 border-t border-gray-200 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancel</button>
          <button onClick={() => { onSave(form); onClose(); }} className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-slate-950 bg-[#D4AF37] hover:bg-[#c4a030] rounded-lg">
            <Save size={14}/> Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
