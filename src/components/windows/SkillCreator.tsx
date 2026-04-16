import React, { useState } from 'react';
import { BrainCircuit, Plus, Trash2, Edit2, Play, X, Zap, BookOpen, Save, Copy, Check } from 'lucide-react';
import type { ApiConfig } from '@/types';
import { callAIProxy, callOllama, extractText } from '@/services/aiProxy';

interface Skill {
  id: string;
  name: string;
  description: string;
  category: 'Pharma' | 'Regulatory' | 'Sales' | 'Finance' | 'Writing' | 'Analysis' | 'Custom';
  systemPrompt: string;
  provider: 'Gemini' | 'Claude' | 'Groq' | 'Ollama';
  model: string;
  icon: string;
  createdAt: number;
}

interface Props {
  apiConfig: ApiConfig;
}

const CATEGORY_COLORS: Record<Skill['category'], string> = {
  Pharma: 'bg-blue-50 text-blue-700 border-blue-200',
  Regulatory: 'bg-purple-50 text-purple-700 border-purple-200',
  Sales: 'bg-green-50 text-green-700 border-green-200',
  Finance: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  Writing: 'bg-orange-50 text-orange-700 border-orange-200',
  Analysis: 'bg-teal-50 text-teal-700 border-teal-200',
  Custom: 'bg-gray-50 text-gray-700 border-gray-200',
};

const DEFAULT_SKILLS: Skill[] = [
  {
    id: 'default-1', name: 'Pharma Formulation Expert', description: 'Analyze formulations, suggest improvements, stability insights', category: 'Pharma', icon: '💊',
    systemPrompt: 'You are an expert pharmaceutical formulator specializing in oral dosage forms. Analyze formulations, suggest improvements, identify stability issues, and provide technical recommendations following ICH guidelines and GMP standards.',
    provider: 'Gemini', model: 'gemini-2.0-flash', createdAt: 0,
  },
  {
    id: 'default-2', name: 'Regulatory Affairs Advisor', description: 'GMP, dossier, WHO pre-qual, Middle East market auth', category: 'Regulatory', icon: '📋',
    systemPrompt: 'You are a pharmaceutical regulatory expert. Provide guidance on GMP compliance, dossier preparation, CTD format, WHO pre-qualification, and market authorization requirements for Middle East and Africa markets.',
    provider: 'Gemini', model: 'gemini-2.0-flash', createdAt: 0,
  },
  {
    id: 'default-3', name: 'Sales Email Writer', description: 'Professional pharma business emails and quotations', category: 'Sales', icon: '✉️',
    systemPrompt: 'You are a professional pharma sales writer. Write compelling, professional emails for pharmaceutical business development, quotations, follow-ups, and customer communications. Be concise, formal, and results-oriented.',
    provider: 'Claude', model: 'claude-sonnet-4-6', createdAt: 0,
  },
  {
    id: 'default-4', name: 'Financial Analyzer', description: 'Cost, margin, profitability and cash flow analysis', category: 'Finance', icon: '📊',
    systemPrompt: 'You are a pharmaceutical financial analyst. Analyze costs, margins, profitability, cash flow, and provide actionable financial insights for a pharmaceutical manufacturing company in Oman.',
    provider: 'Gemini', model: 'gemini-2.0-flash', createdAt: 0,
  },
  {
    id: 'default-5', name: 'COA / Document Drafter', description: 'Draft CoAs, specs, SOPs following GMP standards', category: 'Writing', icon: '📄',
    systemPrompt: 'You are a pharmaceutical documentation expert. Help draft Certificates of Analysis, product specifications, SOPs, and technical documents following GMP standards and pharmacopoeia guidelines.',
    provider: 'Claude', model: 'claude-sonnet-4-6', createdAt: 0,
  },
  {
    id: 'default-6', name: 'Market Intelligence', description: 'Market trends, pricing, and business opportunities', category: 'Analysis', icon: '🌍',
    systemPrompt: 'You are a pharmaceutical market intelligence analyst. Provide insights on market trends, competitor analysis, pricing strategies, and business opportunities in pharmaceutical markets across Middle East, Africa, and Asia.',
    provider: 'Gemini', model: 'gemini-2.5-pro', createdAt: 0,
  },
];

function loadSkills(): Skill[] {
  try {
    const s = localStorage.getItem('erp_v2_skills');
    const p = s ? JSON.parse(s) : null;
    return Array.isArray(p) && p.length > 0 ? p : DEFAULT_SKILLS;
  } catch { return DEFAULT_SKILLS; }
}

function saveSkillsToStorage(skills: Skill[]) {
  localStorage.setItem('erp_v2_skills', JSON.stringify(skills));
}

const BLANK_SKILL: Omit<Skill, 'id' | 'createdAt'> = {
  name: '', description: '', category: 'Custom', systemPrompt: '', provider: 'Gemini', model: 'gemini-2.0-flash', icon: '⚡',
};

export const SkillCreator: React.FC<Props> = ({ apiConfig }) => {
  const [skills, setSkills] = useState<Skill[]>(loadSkills);
  const [queue, setQueue] = useState<string[]>([]);
  const [editingSkill, setEditingSkill] = useState<Partial<Skill> | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [queryInput, setQueryInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState('');
  const [copied, setCopied] = useState(false);
  const [runStep, setRunStep] = useState('');

  const updateSkills = (next: Skill[]) => { setSkills(next); saveSkillsToStorage(next); };

  const addToQueue = (id: string) => {
    if (queue.includes(id)) { setQueue(q => q.filter(x => x !== id)); return; }
    if (queue.length >= 3) return;
    setQueue(q => [...q, id]);
  };

  const saveSkill = () => {
    if (!editingSkill?.name || !editingSkill?.systemPrompt) return;
    if (isCreating) {
      const skill: Skill = { ...BLANK_SKILL, ...editingSkill, id: `skill-${Date.now()}`, createdAt: Date.now() } as Skill;
      updateSkills([...skills, skill]);
    } else {
      updateSkills(skills.map(s => s.id === editingSkill.id ? { ...s, ...editingSkill } as Skill : s));
    }
    setEditingSkill(null);
    setIsCreating(false);
  };

  const deleteSkill = (id: string) => {
    updateSkills(skills.filter(s => s.id !== id));
    setQueue(q => q.filter(x => x !== id));
  };

  const runQueue = async () => {
    if (!queryInput.trim() || queue.length === 0) return;
    setIsRunning(true);
    setRunResult('');
    let current = queryInput.trim();
    try {
      for (let i = 0; i < queue.length; i++) {
        const skill = skills.find(s => s.id === queue[i]);
        if (!skill) continue;
        setRunStep(`Running Skill ${i + 1}: ${skill.name}…`);
        if (skill.provider === 'Ollama') {
          current = await callOllama(
            apiConfig.ollamaUrl || 'http://localhost:11434',
            skill.model,
            [{ role: 'user', content: current }],
            skill.systemPrompt,
          );
        } else {
          const skillKey = skill.provider === 'Claude' ? apiConfig.claudeKey
            : skill.provider === 'Groq' ? (apiConfig.groqKey || import.meta.env.VITE_GROQ_KEY)
            : undefined;
          const res = await callAIProxy({
            provider: skill.provider.toLowerCase() as 'gemini' | 'claude' | 'groq',
            model: skill.model,
            system: skill.systemPrompt,
            messages: [{ role: 'user', content: current }],
            apiKey: skillKey,
          });
          current = extractText(res, skill.provider.toLowerCase()) || current;
        }
      }
      setRunResult(current);
    } catch (e) {
      setRunResult(`Error: ${String(e)}`);
    } finally {
      setIsRunning(false);
      setRunStep('');
    }
  };

  const copyResult = () => {
    navigator.clipboard.writeText(runResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const queuedSkills = queue.map(id => skills.find(s => s.id === id)).filter(Boolean) as Skill[];

  return (
    <div className="flex gap-4 animate-fadeIn" style={{ height: 'calc(100vh - 200px)', minHeight: '500px' }}>
      {/* Left: Library */}
      <div className="w-64 shrink-0 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
            <BookOpen size={14} className="text-[#D4AF37]"/> Skills Library
          </h3>
          <button onClick={() => { setEditingSkill({ ...BLANK_SKILL }); setIsCreating(true); }}
            className="p-1.5 bg-[#D4AF37] text-slate-950 rounded-lg hover:bg-[#c4a030] transition-all">
            <Plus size={12}/>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5">
          {skills.map(skill => {
            const inQueue = queue.includes(skill.id);
            const queueIdx = queue.indexOf(skill.id);
            return (
              <div key={skill.id}
                className={`p-2.5 rounded-xl border transition-all ${inQueue ? 'bg-[#D4AF37]/10 border-[#D4AF37]/50' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                <div className="flex items-start justify-between gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-base">{skill.icon}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{skill.name}</p>
                      <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full border mt-0.5 ${CATEGORY_COLORS[skill.category]}`}>
                        {skill.category}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-0.5 shrink-0">
                    <button onClick={() => { setEditingSkill({ ...skill }); setIsCreating(false); }}
                      className="p-1 text-slate-400 hover:text-[#D4AF37] transition-all"><Edit2 size={10}/></button>
                    <button onClick={() => deleteSkill(skill.id)}
                      className="p-1 text-slate-400 hover:text-red-400 transition-all"><Trash2 size={10}/></button>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 leading-tight line-clamp-2">{skill.description}</p>
                <button onClick={() => addToQueue(skill.id)}
                  className={`mt-1.5 w-full py-1 text-[10px] font-bold rounded-lg border transition-all ${
                    inQueue
                      ? 'bg-[#D4AF37] border-[#D4AF37] text-slate-950'
                      : queue.length >= 3
                        ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-50 border-gray-200 text-slate-600 hover:border-[#D4AF37]/50 hover:text-slate-900'
                  }`}
                  disabled={queue.length >= 3 && !inQueue}
                >
                  {inQueue ? `✓ Slot ${queueIdx + 1}` : queue.length >= 3 ? 'Queue Full' : `+ Add to Queue`}
                </button>
              </div>
            );
          })}
        </div>

        {/* Queue display */}
        {queue.length > 0 && (
          <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/30 rounded-xl p-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider">Active Queue</p>
              <button onClick={() => setQueue([])} className="text-[9px] text-slate-500 hover:text-red-400">Clear</button>
            </div>
            <div className="flex flex-wrap gap-1">
              {queuedSkills.map((skill, i) => (
                <span key={skill.id} className="flex items-center gap-0.5 bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  <span className="text-[#D4AF37]">{i + 1}</span> {skill.icon} {skill.name.slice(0, 12)}
                  <button onClick={() => addToQueue(skill.id)} className="ml-0.5 text-slate-500 hover:text-red-400"><X size={8}/></button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right: Main panel */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        {/* Editor or welcome */}
        {editingSkill ? (
          <div className="flex-1 bg-white border border-gray-200 rounded-xl p-5 overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">{isCreating ? 'Create New Skill' : 'Edit Skill'}</h3>
              <button onClick={() => { setEditingSkill(null); setIsCreating(false); }}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-gray-100 rounded-lg"><X size={14}/></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="erp-label">Icon</label>
                  <input value={editingSkill.icon || ''} onChange={e => setEditingSkill(s => ({ ...s, icon: e.target.value }))}
                    className="erp-input text-center text-xl" placeholder="💡"/>
                </div>
                <div className="col-span-3">
                  <label className="erp-label">Skill Name *</label>
                  <input value={editingSkill.name || ''} onChange={e => setEditingSkill(s => ({ ...s, name: e.target.value }))}
                    className="erp-input" placeholder="e.g. Stability Analyzer"/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="erp-label">Category</label>
                  <select value={editingSkill.category || 'Custom'} onChange={e => setEditingSkill(s => ({ ...s, category: e.target.value as Skill['category'] }))} className="erp-input">
                    {(['Pharma','Regulatory','Sales','Finance','Writing','Analysis','Custom'] as Skill['category'][]).map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="erp-label">Preferred Provider</label>
                  <select value={editingSkill.provider || 'Gemini'} onChange={e => setEditingSkill(s => ({ ...s, provider: e.target.value as Skill['provider'] }))} className="erp-input">
                    {['Gemini','Claude','Groq','Ollama'].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="erp-label">Description</label>
                <textarea value={editingSkill.description || ''} onChange={e => setEditingSkill(s => ({ ...s, description: e.target.value }))}
                  className="erp-input resize-none" rows={2} placeholder="Brief description of what this skill does"/>
              </div>
              <div>
                <label className="erp-label">System Prompt * <span className="text-slate-400 font-normal">(Instructions for the AI)</span></label>
                <textarea value={editingSkill.systemPrompt || ''} onChange={e => setEditingSkill(s => ({ ...s, systemPrompt: e.target.value }))}
                  className="erp-input resize-none font-mono text-xs" rows={8} placeholder="You are an expert in..."/>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => { setEditingSkill(null); setIsCreating(false); }}
                  className="px-4 py-2 text-sm text-slate-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold">Cancel</button>
                <button onClick={saveSkill} disabled={!editingSkill.name || !editingSkill.systemPrompt}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm bg-[#D4AF37] hover:bg-[#c4a030] text-slate-950 rounded-lg font-bold disabled:opacity-50">
                  <Save size={13}/> Save Skill
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 bg-white border border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-center overflow-y-auto custom-scrollbar">
            <BrainCircuit className="text-[#D4AF37]/40 mb-3" size={40}/>
            <h3 className="text-slate-700 font-bold mb-1">Skill Creator</h3>
            <p className="text-slate-500 text-sm max-w-md">
              Create reusable AI prompt templates ("Skills") and chain them together.
              Add skills to the queue, then run your query through them in sequence.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-3 w-full max-w-lg">
              {[
                { step: '1', text: 'Create a Skill with a system prompt' },
                { step: '2', text: 'Add up to 3 skills to your queue' },
                { step: '3', text: 'Run your query through the chain' },
              ].map(s => (
                <div key={s.step} className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                  <div className="w-6 h-6 rounded-full bg-[#D4AF37] text-slate-950 text-xs font-black flex items-center justify-center mx-auto mb-2">{s.step}</div>
                  <p className="text-xs text-slate-600">{s.text}</p>
                </div>
              ))}
            </div>
            <button onClick={() => { setEditingSkill({ ...BLANK_SKILL }); setIsCreating(true); }}
              className="mt-5 flex items-center gap-2 px-5 py-2.5 bg-[#D4AF37] hover:bg-[#c4a030] text-slate-950 font-bold rounded-xl text-sm">
              <Plus size={14}/> Create Your First Skill
            </button>
          </div>
        )}

        {/* Queue Runner */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Zap size={14} className="text-[#D4AF37]"/> Queue Runner
              {queue.length > 0 && (
                <span className="flex gap-1">
                  {queuedSkills.map((s, i) => (
                    <span key={s.id} className="bg-[#D4AF37]/20 text-slate-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-[#D4AF37]/30">
                      {i+1}. {s.icon} {s.name.slice(0,10)}
                    </span>
                  ))}
                </span>
              )}
            </h4>
            {runResult && (
              <button onClick={copyResult} className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-900 bg-gray-100 px-2 py-1 rounded-lg transition-all">
                {copied ? <><Check size={11} className="text-green-500"/> Copied</> : <><Copy size={11}/> Copy</>}
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <textarea
              value={queryInput}
              onChange={e => setQueryInput(e.target.value)}
              placeholder={queue.length === 0 ? "Add skills to the queue first, then enter your query…" : "Enter your query to run through the skill chain…"}
              rows={2}
              disabled={queue.length === 0}
              className="flex-1 bg-gray-50 border border-gray-200 text-slate-900 rounded-xl px-4 py-2.5 text-sm focus:border-[#D4AF37]/50 focus:outline-none resize-none custom-scrollbar disabled:opacity-50"
            />
            <button
              onClick={runQueue}
              disabled={!queryInput.trim() || queue.length === 0 || isRunning}
              className="px-4 bg-[#D4AF37] hover:bg-[#c4a030] text-slate-950 font-bold rounded-xl disabled:opacity-50 transition-all shrink-0 flex items-center gap-1.5 text-sm"
            >
              <Play size={14}/> {isRunning ? 'Running…' : 'Run'}
            </button>
          </div>
          {isRunning && runStep && (
            <p className="text-[11px] text-[#D4AF37] mt-2 animate-pulse">{runStep}</p>
          )}
          {runResult && !isRunning && (
            <div className="mt-3 bg-gray-50 border border-gray-200 rounded-xl p-3 max-h-48 overflow-y-auto custom-scrollbar">
              <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">{runResult}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
