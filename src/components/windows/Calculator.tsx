import React from 'react';
import { Calculator as CalcIcon, RefreshCw, Plus, Trash2 } from 'lucide-react';
import type { CalcData, CalcItem, RDProject } from '@/types';

interface Props {
  calcData: CalcData;
  calcResults: Record<string, number> | null;
  rdProjects: RDProject[];
  onDataChange: (d: CalcData) => void;
  onCalculate: () => void;
  onReset: () => void;
}

const SHIPPING_METHODS = [
  'CIF by Air - Muscat Airport', 'CIF by Sea - Sohar Port',
  'FOB Sohar', 'DDP - Destination', 'EXW - Sohar Plant',
];

const emptyItem = (): CalcItem => ({ product: '', volume: 0, targetPrice: 0, rmc: 0, labor: 0, packing: 0 });

export const Calculator: React.FC<Props> = ({ calcData, calcResults, rdProjects, onDataChange, onCalculate, onReset }) => {
  const set = (key: keyof CalcData, v: unknown) => onDataChange({ ...calcData, [key]: v });
  const extras = calcData.extraItems ?? [];

  const setItem = (idx: number, key: keyof CalcItem, v: unknown) => {
    const updated = extras.map((item, i) => i === idx ? { ...item, [key]: v } : item);
    onDataChange({ ...calcData, extraItems: updated });
  };

  const addItem = () => onDataChange({ ...calcData, extraItems: [...extras, emptyItem()] });
  const removeItem = (idx: number) => onDataChange({ ...calcData, extraItems: extras.filter((_, i) => i !== idx) });

  const NumField = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
    <div>
      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">{label}</label>
      <input
        type="number" value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full bg-gray-50 border border-gray-200 text-slate-900 rounded-lg px-3 py-2 text-sm focus:border-[#D4AF37]/50 focus:outline-none"
      />
    </div>
  );

  const ProductSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <div className="sm:col-span-2">
      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Product</label>
      <select
        value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-gray-50 border border-gray-200 text-slate-900 rounded-lg px-3 py-2 text-sm focus:border-[#D4AF37]/50 focus:outline-none"
      >
        <option value="">Select or type product…</option>
        {rdProjects.map(p => <option key={p.id} value={p.title}>{p.title}</option>)}
      </select>
    </div>
  );

  const ItemBlock = ({
    label, product, volume, targetPrice, rmc, labor, packing,
    onProduct, onVolume, onTargetPrice, onRmc, onLabor, onPacking,
    onRemove,
  }: {
    label: string; product: string; volume: number; targetPrice: number;
    rmc: number; labor: number; packing: number;
    onProduct: (v: string) => void; onVolume: (v: number) => void;
    onTargetPrice: (v: number) => void; onRmc: (v: number) => void;
    onLabor: (v: number) => void; onPacking: (v: number) => void;
    onRemove?: () => void;
  }) => (
    <div className="border border-[#D4AF37]/20 rounded-xl p-4 space-y-3 bg-gray-50/30">
      <div className="flex justify-between items-center">
        <p className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">{label}</p>
        {onRemove && (
          <button onClick={onRemove} className="p-1 text-red-400 hover:bg-red-50 rounded transition-all"><Trash2 size={13}/></button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <ProductSelect value={product} onChange={onProduct}/>
        <NumField label="Volume (Kg)" value={volume} onChange={onVolume}/>
        <NumField label="Target Price ($/Kg)" value={targetPrice} onChange={onTargetPrice}/>
        <NumField label="RMC ($/Kg)" value={rmc} onChange={onRmc}/>
        <NumField label="Labor ($/Kg)" value={labor} onChange={onLabor}/>
        <NumField label="Packing ($/Kg)" value={packing} onChange={onPacking}/>
      </div>
    </div>
  );

  return (
    <div className="space-y-5 animate-fadeIn">
      <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
        <CalcIcon className="text-[#F4C430]" size={20}/> Sales vs Cost Calculator
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Input Panel */}
        <div className="bg-white shadow-sm border border-[#D4AF37]/30 rounded-xl p-5 gold-glow space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-gray-200 pb-3">Product Lines</h3>

          {/* Primary item */}
          <ItemBlock
            label="Product Line 1 (Primary)"
            product={calcData.product} volume={calcData.volume}
            targetPrice={calcData.targetPrice} rmc={calcData.rmc}
            labor={calcData.labor} packing={calcData.packing}
            onProduct={v => set('product', v)} onVolume={v => set('volume', v)}
            onTargetPrice={v => set('targetPrice', v)} onRmc={v => set('rmc', v)}
            onLabor={v => set('labor', v)} onPacking={v => set('packing', v)}
          />

          {/* Extra items */}
          {extras.map((item, idx) => (
            <ItemBlock
              key={idx}
              label={`Product Line ${idx + 2}`}
              product={item.product} volume={item.volume}
              targetPrice={item.targetPrice} rmc={item.rmc}
              labor={item.labor} packing={item.packing}
              onProduct={v => setItem(idx, 'product', v)} onVolume={v => setItem(idx, 'volume', v)}
              onTargetPrice={v => setItem(idx, 'targetPrice', v)} onRmc={v => setItem(idx, 'rmc', v)}
              onLabor={v => setItem(idx, 'labor', v)} onPacking={v => setItem(idx, 'packing', v)}
              onRemove={() => removeItem(idx)}
            />
          ))}

          {/* Add product line button (max 3 lines total) */}
          {extras.length < 2 && (
            <button
              onClick={addItem}
              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-[#D4AF37] border border-dashed border-[#D4AF37]/40 rounded-xl hover:bg-[#D4AF37]/5 transition-all"
            >
              <Plus size={13}/> Add Product Line {extras.length + 2}
            </button>
          )}

          {/* Shared parameters */}
          <div className="border-t border-gray-200 pt-4 space-y-3">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Shared Parameters</p>
            <div className="grid grid-cols-2 gap-3">
              <NumField label="Logistics ($/Kg)" value={calcData.logistics} onChange={v => set('logistics', v)}/>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Overhead (%)
                </label>
                <div className="relative">
                  <input
                    type="number" min="0" max="100" value={calcData.overheadPct}
                    onChange={e => set('overheadPct', Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 text-slate-900 rounded-lg px-3 py-2 text-sm focus:border-[#D4AF37]/50 focus:outline-none pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-bold">%</span>
                </div>
                {calcData.rmc + calcData.labor + calcData.packing + calcData.logistics > 0 && (
                  <p className="text-[10px] text-slate-500 mt-1">
                    = ${(((calcData.rmc + calcData.labor + calcData.packing + calcData.logistics) * calcData.overheadPct / 100)).toFixed(3)}/Kg overhead
                  </p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Shipping Method</label>
              <select
                value={calcData.shippingMethod} onChange={e => set('shippingMethod', e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-slate-900 rounded-lg px-3 py-2 text-sm focus:border-[#D4AF37]/50 focus:outline-none"
              >
                {SHIPPING_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onCalculate} className="flex-1 erp-btn-gold justify-center py-2.5">
              <CalcIcon size={15}/> Calculate
            </button>
            <button onClick={onReset} className="erp-btn-ghost py-2.5">
              <RefreshCw size={13}/> Reset
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {calcResults ? (
            <>
              <div className="bg-white shadow-sm border border-[#D4AF37]/30 rounded-xl p-5 gold-glow">
                <h3 className="text-sm font-bold text-slate-900 border-b border-gray-200 pb-3 mb-4">
                  Results {extras.length > 0 && <span className="text-xs text-slate-500 font-normal ml-1">(combined {1 + extras.length} products)</span>}
                </h3>
                <div className="space-y-3">
                  {Object.entries(calcResults).map(([key, val]) => (
                    <div key={key} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                      <span className="text-slate-600 text-sm">{key}</span>
                      <span className={`text-sm font-bold font-mono ${
                        key.includes('Profit') || key.includes('Margin')
                          ? Number(val) >= 0 ? 'text-green-500' : 'text-red-500'
                          : key.includes('Overhead') ? 'text-amber-600'
                          : 'text-slate-900'
                      }`}>
                        {key.includes('%') || key.includes('Margin') ? `${Number(val).toFixed(1)}%` : `$${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`p-4 rounded-xl border ${
                (calcResults['Gross Margin %'] ?? 0) >= 20
                  ? 'bg-green-500/10 border-green-500/30'
                  : (calcResults['Gross Margin %'] ?? 0) >= 0
                    ? 'bg-yellow-500/10 border-yellow-500/30'
                    : 'bg-red-500/10 border-red-500/30'
              }`}>
                <p className="text-xs font-bold uppercase tracking-widest mb-1">
                  {(calcResults['Gross Margin %'] ?? 0) >= 20 ? '✓ Profitable — Proceed' :
                   (calcResults['Gross Margin %'] ?? 0) >= 0 ? '⚠ Marginal — Review' : '✕ Loss — Renegotiate'}
                </p>
                <p className="text-slate-600 text-xs">
                  Blended margin: {(calcResults['Gross Margin %'] ?? 0).toFixed(1)}% · Overhead: {calcData.overheadPct}% · Method: {calcData.shippingMethod}
                </p>
              </div>
            </>
          ) : (
            <div className="bg-white shadow-sm border border-[#D4AF37]/20 rounded-xl p-8 text-center">
              <CalcIcon className="text-slate-400 mx-auto mb-3" size={36}/>
              <p className="text-slate-500 text-sm">Enter values and click Calculate to see results.</p>
              <p className="text-slate-400 text-xs mt-1">Supports up to 3 product lines per invoice.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
