import React, { useState } from 'react';
import { Factory, Plus, Eye, Edit2, Trash2, ChevronDown, BarChart3 } from 'lucide-react';
import type { Batch, ModalState, ApiConfig } from '@/types';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SmartImporter } from '@/components/shared/SmartImporter';

interface Props {
  batches: Batch[];
  onOpenModal: (mode: ModalState['mode'], type: ModalState['type'], data?: Record<string, unknown>) => void;
  onDelete: (type: string, id: string, name: string) => void;
  apiConfig: ApiConfig;
  onImport: (rows: Record<string, unknown>[]) => void;
}

export const Manufacturing: React.FC<Props> = ({ batches, onOpenModal, onDelete, apiConfig, onImport }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const newBatch = (): Record<string, unknown> => ({
    id: `B-${new Date().getFullYear().toString().slice(-2)}-${Math.floor(Math.random() * 900) + 100}`,
    product: '', quantity: 0, actualYield: 0, expectedYield: 100,
    status: 'Scheduled', timestamp: new Date().toISOString().split('T')[0], dispatchDate: '',
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Factory className="text-[#F4C430]" size={20}/> Manufacturing Operations
        </h2>
        <div className="flex items-center gap-2">
          <SmartImporter entityType="production" onImport={onImport} apiConfig={apiConfig} buttonLabel="Import Batches"/>
          <button onClick={() => onOpenModal('add', 'production', newBatch())} className="erp-btn-gold">
            <Plus size={15}/> Log Batch
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Batches', value: batches.length },
          { label: 'In Progress', value: batches.filter(b => b.status === 'In-Progress').length },
          { label: 'Completed', value: batches.filter(b => b.status === 'Completed').length },
          { label: 'Avg Yield', value: batches.length ? (batches.reduce((s, b) => s + b.actualYield, 0) / batches.length).toFixed(1) + '%' : '—' },
        ].map(s => (
          <div key={s.label} className="bg-white shadow-sm border border-[#D4AF37]/20 shadow-sm p-4 rounded-xl">
            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">{s.label}</p>
            <p className="text-slate-900 text-2xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white shadow-sm border border-[#D4AF37]/30 shadow-sm rounded-xl overflow-hidden gold-glow">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 text-slate-500 text-xs uppercase">
                <th className="pb-3 px-4 font-bold pt-4">Batch ID</th>
                <th className="pb-3 px-4 font-bold pt-4">Product</th>
                <th className="pb-3 px-4 font-bold pt-4 hidden sm:table-cell">Qty (Kg)</th>
                <th className="pb-3 px-4 font-bold pt-4 hidden md:table-cell">Dispatch</th>
                <th className="pb-3 px-4 font-bold pt-4">Yield</th>
                <th className="pb-3 px-4 font-bold pt-4">Status</th>
                <th className="pb-3 px-4 font-bold pt-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {batches.length === 0 && (
                <tr><td colSpan={7} className="p-6 text-center text-slate-500 text-sm">No batches recorded. Add your first batch.</td></tr>
              )}
              {batches.map(batch => (
                <React.Fragment key={batch.id}>
                  <tr className={`hover:bg-gray-100 transition-all ${expandedId === batch.id ? 'bg-gray-100' : ''}`}>
                    <td className="py-4 px-4 font-mono text-sm text-[#F4C430] cursor-pointer" onClick={() => setExpandedId(expandedId === batch.id ? null : batch.id)}>
                      <div className="flex items-center gap-2">
                        <ChevronDown size={13} className={`transition-transform ${expandedId === batch.id ? 'rotate-180' : ''}`}/>
                        {batch.id}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-900 font-medium text-sm max-w-[200px] truncate">{batch.product}</td>
                    <td className="py-4 px-4 text-slate-900 font-mono text-sm hidden sm:table-cell">{batch.quantity.toLocaleString()}</td>
                    <td className="py-4 px-4 text-slate-700 text-sm hidden md:table-cell">{batch.dispatchDate || '—'}</td>
                    <td className="py-4 px-4">
                      <span className={`text-sm font-bold ${Math.abs(batch.actualYield - batch.expectedYield) > 2 ? 'text-red-400' : 'text-green-400'}`}>
                        {batch.actualYield}%
                      </span>
                    </td>
                    <td className="py-4 px-4"><StatusBadge status={batch.status}/></td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => onOpenModal('view', 'production', batch as unknown as Record<string, unknown>)} className="p-1.5 rounded hover:bg-blue-500/20 text-blue-400 transition-all" title="View"><Eye size={13}/></button>
                        <button onClick={() => onOpenModal('edit', 'production', batch as unknown as Record<string, unknown>)} className="p-1.5 rounded hover:bg-yellow-500/20 text-[#F4C430] transition-all" title="Edit"><Edit2 size={13}/></button>
                        <button onClick={() => onDelete('production', batch.id, batch.product)} className="p-1.5 rounded hover:bg-red-500/20 text-red-400 transition-all" title="Delete"><Trash2 size={13}/></button>
                      </div>
                    </td>
                  </tr>
                  {expandedId === batch.id && (
                    <tr className="bg-gray-50 border-l-2 border-[#D4AF37]">
                      <td colSpan={7} className="p-0">
                        <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-5">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded bg-white border border-gray-200 text-[#F4C430]"><BarChart3 size={16}/></div>
                            <div>
                              <p className="text-[10px] text-slate-500 uppercase font-bold">Yield Details</p>
                              <p className="text-sm text-slate-900">Actual: {batch.actualYield}% / Expected: {batch.expectedYield}%</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded bg-white border border-gray-200 text-[#F4C430]"><Factory size={16}/></div>
                            <div>
                              <p className="text-[10px] text-slate-500 uppercase font-bold">Batch Date</p>
                              <p className="text-sm text-slate-900">{batch.timestamp}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded bg-white border border-gray-200 text-[#F4C430]"><BarChart3 size={16}/></div>
                            <div>
                              <p className="text-[10px] text-slate-500 uppercase font-bold">Quantity</p>
                              <p className="text-sm text-slate-900">{batch.quantity.toLocaleString()} Kg</p>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
