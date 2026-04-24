import React, { useState } from 'react';
import { Beaker, Plus, Edit2, Trash2, Search, ChevronDown, Wand2, X } from 'lucide-react';
import type { RDProject, Ingredient, ModalState, ApiConfig } from '@/types';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatCurrency } from '@/lib/utils';
import { SmartImporter } from '@/components/shared/SmartImporter';

interface Props {
  rdProjects: RDProject[];
  onOpenModal: (mode: ModalState['mode'], type: ModalState['type'], data?: Record<string, unknown>) => void;
  onDelete: (type: string, id: string, name: string) => void;
  onUpdateProject: (project: RDProject) => void;
  onOptimize: (project: RDProject) => Promise<string>;
  apiConfig: ApiConfig;
  onImport: (rows: Record<string, unknown>[]) => void;
}

const ROLES = ['API', 'Filler', 'Binder', 'Coating', 'Disintegrant', 'Excipient', 'Plasticizer', 'Lubricant', 'Surfactant', 'Other'] as const;

const emptyForm = (): Partial<Ingredient> => ({
  name: '', role: 'API', quantity: 0, rateUSD: 0, unit: 'Kg',
});

export const RDLab: React.FC<Props> = ({ rdProjects, onOpenModal, onDelete, onUpdateProject, onOptimize, apiConfig, onImport }) => {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(rdProjects[0]?.id ?? null);
  const [optimizing, setOptimizing] = useState<string | null>(null);
  const [aiNotes, setAiNotes] = useState<Record<string, string>>({});

  // Add-ingredient form state per project
  const [addIngOpen, setAddIngOpen] = useState<Record<string, boolean>>({});
  const [addIngForm, setAddIngForm] = useState<Record<string, Partial<Ingredient>>>({});

  const filtered = rdProjects.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.id.toLowerCase().includes(search.toLowerCase())
  );

  const recompute = (ings: Ingredient[], project: RDProject): RDProject => {
    const totalRMC = Number(ings.reduce((s, i) => s + (i.cost ?? 0), 0).toFixed(3));
    const totalFinalRMC = Number(((totalRMC / project.batchSize) + project.loss).toFixed(3));
    return { ...project, ingredients: ings, totalRMC, totalFinalRMC };
  };

  const handleOptimize = async (p: RDProject) => {
    setOptimizing(p.id);
    try {
      const result = await onOptimize(p);
      setAiNotes(prev => ({ ...prev, [p.id]: result }));
    } catch {
      setAiNotes(prev => ({ ...prev, [p.id]: 'Optimization failed. Check your API key in Vercel settings.' }));
    } finally {
      setOptimizing(null);
    }
  };

  const handleIngredientChange = (project: RDProject, idx: number, field: keyof Ingredient, value: unknown) => {
    const ings = (project.ingredients ?? []).map((ing, i) => {
      if (i !== idx) return ing;
      const updated = { ...ing, [field]: value };
      updated.cost = Number((Number(updated.quantity) * Number(updated.rateUSD)).toFixed(3));
      return updated;
    });
    onUpdateProject(recompute(ings, project));
  };

  const handleDeleteIngredient = (project: RDProject, idx: number) => {
    const ings = (project.ingredients ?? [])
      .filter((_, i) => i !== idx)
      .map((ing, i) => ({ ...ing, sNo: String(i + 1) }));
    onUpdateProject(recompute(ings, project));
  };

  const openAddIng = (projectId: string) => {
    setAddIngOpen(prev => ({ ...prev, [projectId]: true }));
    setAddIngForm(prev => ({ ...prev, [projectId]: emptyForm() }));
  };

  const cancelAddIng = (projectId: string) => {
    setAddIngOpen(prev => ({ ...prev, [projectId]: false }));
    setAddIngForm(prev => ({ ...prev, [projectId]: {} }));
  };

  const updateAddIngForm = (projectId: string, field: keyof Ingredient, value: unknown) => {
    setAddIngForm(prev => {
      const form = { ...(prev[projectId] ?? {}), [field]: value };
      form.cost = Number((Number(form.quantity ?? 0) * Number(form.rateUSD ?? 0)).toFixed(3));
      return { ...prev, [projectId]: form };
    });
  };

  const handleAddIngredient = (project: RDProject) => {
    const form = addIngForm[project.id] ?? {};
    if (!String(form.name ?? '').trim()) return;
    const newIng: Ingredient = {
      sNo: String((project.ingredients ?? []).length + 1),
      name: String(form.name ?? ''),
      role: (form.role as Ingredient['role']) ?? 'API',
      quantity: Number(form.quantity ?? 0),
      unit: String(form.unit ?? 'Kg'),
      rateUSD: Number(form.rateUSD ?? 0),
      cost: Number((Number(form.quantity ?? 0) * Number(form.rateUSD ?? 0)).toFixed(3)),
    };
    const ings = [...(project.ingredients ?? []), newIng];
    onUpdateProject(recompute(ings, project));
    cancelAddIng(project.id);
  };

  const newProject = (): Record<string, unknown> => ({
    id: `RD-${Date.now()}`, title: '', status: 'Formulation', optimizationScore: 0,
    lastUpdated: new Date().toISOString().split('T')[0], batchSize: 100, batchUnit: 'Kg',
    totalRMC: 0, loss: 0.02, totalFinalRMC: 0, ingredients: [],
  });

  return (
    <div className="space-y-5 animate-fadeIn pb-8">
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Beaker className="text-[#F4C430]" size={20}/> R&D Formulation Lab
        </h2>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={13}/>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search projects…"
              className="bg-gray-50 border border-gray-200 text-slate-900 rounded-lg pl-8 pr-3 py-2 text-sm focus:border-[#D4AF37]/50 focus:outline-none w-48"
            />
          </div>
          <SmartImporter entityType="rd" onImport={onImport} apiConfig={apiConfig} buttonLabel="Import"/>
          <button onClick={() => onOpenModal('add', 'rd', newProject())} className="erp-btn-gold">
            <Plus size={15}/> New Project
          </button>
        </div>
      </div>

      {/* Project List */}
      <div className="space-y-4">
        {filtered.length === 0 && (
          <div className="bg-white shadow-sm border border-[#D4AF37]/20 rounded-xl p-8 text-center text-slate-500">
            No R&D projects match your search.
          </div>
        )}
        {filtered.map(project => {
          const isExpanded = expandedId === project.id;
          const ingredients = project.ingredients ?? [];
          const isAddOpen = addIngOpen[project.id] ?? false;
          const form = addIngForm[project.id] ?? emptyForm();

          return (
            <div key={project.id} className="bg-white shadow-sm border border-[#D4AF37]/30 rounded-xl overflow-hidden gold-glow">
              {/* Project Header */}
              <div
                className="p-4 flex flex-wrap justify-between items-center gap-3 cursor-pointer hover:bg-gray-100 transition-all"
                onClick={() => setExpandedId(isExpanded ? null : project.id)}
              >
                <div className="flex items-center gap-3">
                  <ChevronDown size={16} className={`text-slate-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}/>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-slate-900 font-bold text-sm">{project.title}</h3>
                      <StatusBadge status={project.status}/>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">{project.id} · Updated {project.lastUpdated}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Batch RMC</p>
                    <p className="text-sm text-[#D4AF37] font-bold font-mono">{formatCurrency(Number(project.totalRMC ?? 0), 'USD')}</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Score</p>
                    <p className={`text-sm font-bold ${project.optimizationScore >= 90 ? 'text-green-400' : project.optimizationScore >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {project.optimizationScore}%
                    </p>
                  </div>
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => handleOptimize(project)}
                      disabled={optimizing === project.id}
                      className="p-1.5 rounded hover:bg-purple-500/20 text-purple-400 transition-all disabled:opacity-50"
                      title="AI Optimize"
                    >
                      <Wand2 size={13}/>
                    </button>
                    <button onClick={() => onOpenModal('edit', 'rd', project as unknown as Record<string, unknown>)} className="p-1.5 rounded hover:bg-yellow-500/20 text-[#F4C430]"><Edit2 size={13}/></button>
                    <button onClick={() => onDelete('rd', project.id, project.title)} className="p-1.5 rounded hover:bg-red-500/20 text-red-400"><Trash2 size={13}/></button>
                  </div>
                </div>
              </div>

              {/* Expanded: Ingredient Table */}
              {isExpanded && (
                <div className="border-t border-gray-200 p-4 space-y-4">
                  {/* Summary */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Batch Size', value: `${project.batchSize} ${project.batchUnit}` },
                      { label: 'Total RMC', value: formatCurrency(Number(project.totalRMC ?? 0), 'USD') },
                      { label: 'Loss Factor', value: project.loss },
                      { label: 'Final RMC/Kg', value: formatCurrency(Number(project.totalFinalRMC ?? 0), 'USD') },
                    ].map(s => (
                      <div key={s.label} className="bg-gray-50/40 rounded-lg p-3 border border-gray-200">
                        <p className="text-[9px] text-slate-500 uppercase font-bold">{s.label}</p>
                        <p className="text-[#D4AF37] font-bold text-sm">{s.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Ingredients Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="text-[9px] text-slate-500 uppercase border-b border-gray-200">
                          <th className="pb-2 px-2">#</th>
                          <th className="pb-2 px-2">Ingredient</th>
                          <th className="pb-2 px-2">Role</th>
                          <th className="pb-2 px-2 text-right">Qty</th>
                          <th className="pb-2 px-2 text-right">Unit</th>
                          <th className="pb-2 px-2 text-right">Rate (USD)</th>
                          <th className="pb-2 px-2 text-right">Cost (USD)</th>
                          <th className="pb-2 px-2"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {ingredients.map((ing, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="py-2 px-2 text-slate-500 text-xs">{ing.sNo || idx + 1}</td>
                            <td className="py-2 px-2 text-slate-900 font-medium text-xs min-w-[140px]">{ing.name}</td>
                            <td className="py-2 px-2">
                              <span className="text-[9px] bg-gray-100 text-slate-600 px-1.5 py-0.5 rounded">{ing.role}</span>
                            </td>
                            <td className="py-2 px-2 text-right">
                              <input
                                type="number" value={ing.quantity}
                                onChange={e => handleIngredientChange(project, idx, 'quantity', Number(e.target.value))}
                                className="w-20 bg-gray-50 border border-gray-200 text-slate-900 rounded px-2 py-1 text-xs text-right focus:border-[#D4AF37]/50 focus:outline-none"
                              />
                            </td>
                            <td className="py-2 px-2 text-right text-xs text-slate-500">{ing.unit ?? 'Kg'}</td>
                            <td className="py-2 px-2 text-right">
                              <input
                                type="number" value={ing.rateUSD}
                                onChange={e => handleIngredientChange(project, idx, 'rateUSD', Number(e.target.value))}
                                className="w-20 bg-gray-50 border border-gray-200 text-slate-900 rounded px-2 py-1 text-xs text-right focus:border-[#D4AF37]/50 focus:outline-none"
                              />
                            </td>
                            <td className="py-2 px-2 text-right font-mono text-[#D4AF37] text-xs font-bold">
                              {formatCurrency(Number(ing.cost ?? 0), 'USD')}
                            </td>
                            <td className="py-2 px-2 text-right">
                              <button
                                onClick={() => handleDeleteIngredient(project, idx)}
                                className="p-1 rounded hover:bg-red-500/20 text-red-400 transition-all"
                                title="Remove ingredient"
                              >
                                <Trash2 size={11}/>
                              </button>
                            </td>
                          </tr>
                        ))}

                        {/* Add Ingredient inline form */}
                        {isAddOpen && (
                          <tr className="bg-[#D4AF37]/5 border border-[#D4AF37]/30">
                            <td className="py-2 px-2 text-slate-400 text-xs">{ingredients.length + 1}</td>
                            <td className="py-2 px-2">
                              <input
                                autoFocus
                                type="text"
                                placeholder="Ingredient name"
                                value={String(form.name ?? '')}
                                onChange={e => updateAddIngForm(project.id, 'name', e.target.value)}
                                className="w-full min-w-[130px] bg-white border border-[#D4AF37]/40 text-slate-900 rounded px-2 py-1 text-xs focus:border-[#D4AF37] focus:outline-none"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <select
                                value={String(form.role ?? 'API')}
                                onChange={e => updateAddIngForm(project.id, 'role', e.target.value)}
                                className="bg-white border border-[#D4AF37]/40 text-slate-900 rounded px-1.5 py-1 text-xs focus:border-[#D4AF37] focus:outline-none"
                              >
                                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                              </select>
                            </td>
                            <td className="py-2 px-2 text-right">
                              <input
                                type="number" min="0" step="0.001"
                                placeholder="0"
                                value={form.quantity ?? ''}
                                onChange={e => updateAddIngForm(project.id, 'quantity', Number(e.target.value))}
                                className="w-20 bg-white border border-[#D4AF37]/40 text-slate-900 rounded px-2 py-1 text-xs text-right focus:border-[#D4AF37] focus:outline-none"
                              />
                            </td>
                            <td className="py-2 px-2 text-right">
                              <select
                                value={String(form.unit ?? 'Kg')}
                                onChange={e => updateAddIngForm(project.id, 'unit', e.target.value)}
                                className="bg-white border border-[#D4AF37]/40 text-slate-900 rounded px-1.5 py-1 text-xs focus:border-[#D4AF37] focus:outline-none"
                              >
                                {['Kg', 'g', 'L', 'mL', 'unit'].map(u => <option key={u} value={u}>{u}</option>)}
                              </select>
                            </td>
                            <td className="py-2 px-2 text-right">
                              <input
                                type="number" min="0" step="0.01"
                                placeholder="0.00"
                                value={form.rateUSD ?? ''}
                                onChange={e => updateAddIngForm(project.id, 'rateUSD', Number(e.target.value))}
                                className="w-20 bg-white border border-[#D4AF37]/40 text-slate-900 rounded px-2 py-1 text-xs text-right focus:border-[#D4AF37] focus:outline-none"
                              />
                            </td>
                            <td className="py-2 px-2 text-right font-mono text-[#D4AF37] text-xs font-bold">
                              {formatCurrency(Number(form.cost ?? 0), 'USD')}
                            </td>
                            <td className="py-2 px-2 text-right">
                              <div className="flex gap-1 justify-end">
                                <button
                                  onClick={() => handleAddIngredient(project)}
                                  className="px-2 py-1 bg-[#D4AF37] text-slate-900 text-[10px] font-bold rounded hover:bg-[#F4C430] transition-all"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => cancelAddIng(project.id)}
                                  className="p-1 rounded hover:bg-gray-200 text-slate-500 transition-all"
                                >
                                  <X size={11}/>
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Add Ingredient button */}
                  {!isAddOpen && (
                    <button
                      onClick={() => openAddIng(project.id)}
                      className="flex items-center gap-1.5 text-xs text-[#D4AF37] hover:text-[#F4C430] font-semibold transition-all px-2 py-1.5 rounded-lg hover:bg-[#D4AF37]/10 border border-dashed border-[#D4AF37]/30 hover:border-[#D4AF37]/60 w-full justify-center"
                    >
                      <Plus size={13}/> Add Ingredient
                    </button>
                  )}

                  {/* AI Notes */}
                  {(aiNotes[project.id] || optimizing === project.id) && (
                    <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-4">
                      <p className="text-[10px] text-purple-400 uppercase font-bold mb-2 flex items-center gap-1.5">
                        <Wand2 size={10}/> AI Optimization Notes
                      </p>
                      {optimizing === project.id
                        ? <div className="animate-pulse text-slate-500 text-xs">Analyzing formulation…</div>
                        : <p className="text-slate-700 text-xs whitespace-pre-wrap">{aiNotes[project.id]}</p>
                      }
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
