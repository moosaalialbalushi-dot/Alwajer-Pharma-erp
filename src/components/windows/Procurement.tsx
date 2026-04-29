import React, { useState } from 'react';
import { Truck, Plus, Edit2, Trash2, AlertTriangle, BadgeDollarSign, Globe, Star, UserPlus, X, Printer, Package, RefreshCw, Clock } from 'lucide-react';
import type { InventoryItem, Vendor, ModalState, ApiConfig } from '@/types';
import { SmartImporter } from '@/components/shared/SmartImporter';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { DocPreview } from '@/components/shared/DocPreview';
import { useVendorCatalog } from '@/hooks/useVendorCatalog';
import { useCurrency } from '@/providers/CurrencyProvider';

interface Props {
  inventory: InventoryItem[];
  vendors: Vendor[];
  apiConfig: ApiConfig;
  onOpenModal: (mode: ModalState['mode'], type: ModalState['type'], data?: Record<string, unknown>) => void;
  onDelete: (type: string, id: string, name: string) => void;
  onImport: (rows: Record<string, unknown>[]) => void;
}

interface MarketRate { id: string; name: string; category: 'API' | 'Excipient'; price: number; unit: string; change: string; up: boolean | null; }

const DEFAULT_RATES: MarketRate[] = [
  { id: '1', name: 'Esomeprazole Magnesium Trihydrate', category: 'API', price: 48.50, unit: 'kg', change: '+1.2%', up: true },
  { id: '2', name: 'Omeprazole API', category: 'API', price: 18.50, unit: 'kg', change: 'Stable', up: null },
  { id: '3', name: 'Lansoprazole API', category: 'API', price: 52.00, unit: 'kg', change: 'Stable', up: null },
  { id: '4', name: 'HPMC E5', category: 'Excipient', price: 7.25, unit: 'kg', change: 'Stable', up: null },
  { id: '5', name: 'Talcum', category: 'Excipient', price: 1.20, unit: 'kg', change: '-0.5%', up: false },
];

function loadRates(): MarketRate[] {
  try {
    const s = localStorage.getItem('erp_v2_market_rates');
    const p = s ? JSON.parse(s) : null;
    return Array.isArray(p) && p.length > 0 ? p : DEFAULT_RATES;
  } catch { return DEFAULT_RATES; }
}

function saveRates(rates: MarketRate[]) {
  localStorage.setItem('erp_v2_market_rates', JSON.stringify(rates));
}

interface POForm {
  poNumber: string; poDate: string; supplier: string; supplierAddress: string;
  itemDesc: string; qty: string; unitPrice: string; countryOfOrigin: string;
  eta: string; shipVia: string; paymentTerms: string; formOfPayment: string; requestedBy: string;
}

function buildPOHTML(form: POForm, vendor: string, logoUrl: string): string {
  const total = Number(form.qty) * Number(form.unitPrice);
  const totalWords = total > 0 ? `USD ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '.00';
  const annexure = `
    <div style="page-break-before:always;padding:20px">
      <div style="display:flex;justify-content:space-between;align-items:flex-end;border-bottom:3px double #000;padding-bottom:8px;margin-bottom:15px">
        <div>
          ${logoUrl ? `<img src="${logoUrl}" alt="Al Wajer Logo" style="height:40px;object-fit:contain;margin-bottom:4px;display:block">` : ''}
          <div style="font-size:11px;direction:rtl;color:#555">الوجـر لصناعة الأدويـة ش.م.م</div>
          <strong style="font-size:13px;color:#1a3c6e">AL WAJER PHARMACEUTICALS INDUSTRY LLC</strong>
        </div>
      </div>
      <p style="text-align:center;font-size:13px;font-weight:bold;text-decoration:underline;margin:12px 0">ANNEXURE-I</p>
      <p style="font-size:11px;font-weight:bold;margin-bottom:8px">Terms &amp; Conditions as given below:-</p>
      <ol style="font-size:10px;line-height:2;padding-left:18px">
        <li>Required Original Invoice &amp; Packing list.</li>
        <li>Required COA (certificate of analysis).</li>
        <li>Required MSDS (Material Safety Data Sheet).</li>
        <li>Required Non Hazardous Certificate.</li>
        <li>Required Original COO (Certificate of origin).</li>
        <li>Required 4 BL/AWB (1 Original &amp; 3 Copies) must require company Stamp backside of the BL.</li>
        <li>All required documents should be courier immediately after the Shipment to avoid demurrage charges.</li>
      </ol>
      <p style="font-size:9px;font-style:italic;margin-top:20px">*** All Necessary documents must be attested by Chamber of Commerce.</p>
    </div>`;

  return `<!DOCTYPE html><html><head><title>Purchase Order - ${form.poNumber}</title>
  <style>
    @page{size:A4;margin:12mm}
    *{box-sizing:border-box}
    body{font-family:Arial,sans-serif;font-size:10px;color:#000;margin:0}
    .lh{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:3px double #000;padding-bottom:8px;margin-bottom:10px}
    .co{font-size:13px;font-weight:bold;color:#1a3c6e}
    .ar{font-size:11px;direction:rtl;color:#555;margin-bottom:3px}
    .title{text-align:center;font-size:14px;font-weight:bold;text-decoration:underline;letter-spacing:2px;margin:10px 0}
    table{width:100%;border-collapse:collapse;margin-bottom:6px}
    td,th{border:1px solid #000;padding:5px 7px;font-size:9px;vertical-align:top}
    th{background:#e8e8e8;font-weight:bold;text-align:center}
    .total-row td{font-weight:bold;background:#f0f0f0}
    .words-row td{font-style:italic;background:#fffce8}
    .nb{border:none}
    .foot{margin-top:10px;border-top:1px solid #999;padding-top:5px;font-size:8px;text-align:center;color:#666}
  </style></head><body>
  <div class="lh">
    <div>
      ${logoUrl ? `<img src="${logoUrl}" alt="Al Wajer Logo" style="height:45px;object-fit:contain;margin-bottom:4px;display:block">` : ''}
      <div class="ar">الوجـر لصناعة الأدويـة ش.م.م</div>
      <div class="co">AL WAJER PHARMACEUTICALS INDUSTRY LLC</div>
      <div style="font-size:8px;color:#444;line-height:1.5">PO BOX 98, PC-327, SOHAR INDUSTRIAL ESTATE, SOHAR, SULTANATE OF OMAN<br>
        Tel: +968 22372677 | Email: moosa.ali@alwajerpharma.com | ahmed.idris@alwajerpharma.com<br>
        Office: 22372677 | Mobile: 00968-99354545, 00968-91248158
      </div>
    </div>
  </div>
  <div class="title">PURCHASE ORDER</div>
  <table>
    <tr>
      <td width="55%" rowspan="3" style="vertical-align:top">
        <strong>Supplier,</strong><br><br>
        ${form.supplier ? form.supplier.replace(/\n/g, '<br>') : ''}<br>
        ${form.supplierAddress ? form.supplierAddress.replace(/\n/g, '<br>') : ''}
        ${vendor ? `<br><em style="color:#555">${vendor}</em>` : ''}
      </td>
      <td><strong>Purchase Order No:</strong> AWP/PO/${form.poNumber}</td>
    </tr>
    <tr><td><strong>Purchase Order Date:</strong> ${form.poDate}</td></tr>
    <tr><td></td></tr>
  </table>
  <table>
    <tr>
      <td colspan="2">
        <strong>Ship To:</strong> AL WAJER PHARMACEUTICALS INDUSTRY LLC.<br>
        Po Box: 98, Postal Code: 327, Sohar Industrial Area, Sohar, Sultanate Of Oman.<br>
        Email: moosa.ali@alwajerpharma.com &nbsp; ahmed.idris@alwajerpharma.com<br>
        Office: 22372677 &nbsp; Mobile: 00968-99354545. 00968-91248158
      </td>
    </tr>
  </table>
  <p style="font-size:8.5px;margin:4px 0">Please furnish the merchandize specified below subject to the conditions on the face hereon and as attached</p>
  <table>
    <thead>
      <tr>
        <th style="width:6%">Item No</th>
        <th>Description</th>
        <th style="width:14%">Qty (kgs)</th>
        <th style="width:16%">Unit Price in (USD)</th>
        <th style="width:16%">Total Price in (USD)</th>
        <th style="width:20%">Supplier/Manufacturer &amp; Country of origin</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="text-align:center">1</td>
        <td>${form.itemDesc}</td>
        <td style="text-align:right">${Number(form.qty).toLocaleString()}</td>
        <td style="text-align:right">${Number(form.unitPrice).toLocaleString(undefined, {minimumFractionDigits:2})}</td>
        <td style="text-align:right;font-weight:bold">${total.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
        <td>${form.countryOfOrigin}</td>
      </tr>
      <tr class="total-row">
        <td colspan="4" style="text-align:right">TOTAL AMOUNT IN USD</td>
        <td style="text-align:right">${total > 0 ? total.toLocaleString(undefined, {minimumFractionDigits:2}) : '.00'}</td>
        <td></td>
      </tr>
      <tr class="words-row">
        <td colspan="6"><strong>IN WORDS: -</strong> ${totalWords} ONLY.</td>
      </tr>
    </tbody>
  </table>
  <table>
    <thead>
      <tr>
        <th>ETA: MCT</th><th>Ship Via</th><th>Destination</th><th>Payment Terms</th><th>Form of Payment</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${form.eta || 'ASAP'}</td>
        <td>${form.shipVia || 'BY SEA SOHAR SEAPORT'}</td>
        <td>Po Box: 98, Postal Code: 327,<br>Sohar Industrial Area, Sohar,<br>SULTANATE OF OMAN</td>
        <td>${form.paymentTerms}</td>
        <td>${form.formOfPayment}</td>
      </tr>
    </tbody>
  </table>
  <table>
    <tr>
      <td width="50%"><strong>Requested By:</strong><br><br>${form.requestedBy || ''}</td>
      <td width="50%"><strong>Approved by: PURCHASE MANAGER</strong><br><br></td>
    </tr>
  </table>
  <div class="foot">
    ص.ب: 98، الرمز البريدي: 327، المنطقة الصناعية بصحار، سلطنة عمان | هاتف: 22372677<br>
    C.R NO: 1145026, TEL: 22372677, PO BOX: 98, POSTAL CODE: 327, SOHAR INDUSTRIAL AREA, SULTANATE OF OMAN
  </div>
  ${annexure}
  </body></html>`;
}

export const Procurement: React.FC<Props> = ({ inventory, vendors, apiConfig, onOpenModal, onDelete, onImport }) => {
  const [isPOOpen, setIsPOOpen] = useState(false);
  const [preview, setPreview] = useState<{ title: string; html: string; filename: string } | null>(null);
  const [selectedCatalogVendor, setSelectedCatalogVendor] = useState<string | null>(null);
  const { vendors: catalogVendors, materialsForVendor, loading: catalogLoading, source: catalogSource, reload: reloadCatalog } = useVendorCatalog();
  const { currency, fmt } = useCurrency();

  const selectedCatalogMaterials = selectedCatalogVendor ? materialsForVendor(selectedCatalogVendor) : [];
  const selectedCatalogVendorInfo = catalogVendors.find(v => v.id === selectedCatalogVendor);
  const [poForm, setPoForm] = useState<POForm>({
    poNumber: String(Date.now()).slice(-6),
    poDate: new Date().toISOString().split('T')[0],
    supplier: '', supplierAddress: '', itemDesc: '', qty: '',
    unitPrice: '', countryOfOrigin: '', eta: 'ASAP',
    shipVia: 'BY SEA SOHAR SEAPORT', paymentTerms: 'T/T IN ADVANCE',
    formOfPayment: 'T/T', requestedBy: 'Moosa Al Wajer',
  });
  const [poVendor, setPoVendor] = useState('');

  const [rates, setRates] = useState<MarketRate[]>(loadRates);
  const [showAddRate, setShowAddRate] = useState(false);
  const [newRate, setNewRate] = useState<Partial<MarketRate>>({ category: 'API', unit: 'kg', change: 'Stable', up: null });

  const shortages = inventory.filter(i => i.balanceToPurchase && i.balanceToPurchase > 0);

  const handleAddRate = () => {
    if (!newRate.name || !newRate.price) return;
    const r: MarketRate = {
      id: String(Date.now()), name: newRate.name!, category: newRate.category as 'API' | 'Excipient' ?? 'API',
      price: Number(newRate.price), unit: newRate.unit ?? 'kg',
      change: newRate.change ?? 'Stable', up: newRate.up ?? null,
    };
    const updated = [...rates, r];
    setRates(updated); saveRates(updated);
    setNewRate({ category: 'API', unit: 'kg', change: 'Stable', up: null });
    setShowAddRate(false);
  };

  const handleDeleteRate = (id: string) => {
    const updated = rates.filter(r => r.id !== id);
    setRates(updated); saveRates(updated);
  };

  const setPoField = (k: keyof POForm, v: string) => setPoForm(prev => ({ ...prev, [k]: v }));
  const selectedVendorName = vendors.find(v => v.id === poVendor)?.name ?? '';

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Truck className="text-[#F4C430]" size={20}/> Procurement & Supply Chain
        </h2>
        <div className="flex gap-2 flex-wrap">
          <SmartImporter entityType="procurement" onImport={onImport} apiConfig={apiConfig} buttonLabel="Import Vendors"/>
          <button onClick={() => setIsPOOpen(true)} className="bg-[#D4AF37] hover:bg-[#c4a030] text-slate-950 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
            <Printer size={15}/> Generate PO
          </button>
          <button onClick={() => onOpenModal('add', 'vendors', { id: `V-${Math.floor(Math.random()*900)+100}`, name:'', category:'API', rating:5, status:'Audit Pending', country:'' })} className="erp-btn-gold">
            <UserPlus size={15}/> Add Vendor
          </button>
        </div>
      </div>

      {/* Vendor Catalog Panel */}
      <div className="bg-white shadow-sm border border-[#D4AF37]/30 rounded-xl p-5 gold-glow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Package className="text-[#F4C430]" size={16}/> Vendor Material Catalog
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ml-1 ${
              catalogSource === 'supabase' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
            }`}>{catalogSource === 'supabase' ? '● Live' : '● Local'}</span>
          </h3>
          <button onClick={reloadCatalog} disabled={catalogLoading}
            className="p-1.5 text-slate-400 hover:text-[#D4AF37] rounded-lg hover:bg-yellow-50 transition-all" title="Refresh from Supabase">
            <RefreshCw size={14} className={catalogLoading ? 'animate-spin' : ''}/>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Vendor selector */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Select Vendor</p>
            {catalogVendors.map(v => (
              <button key={v.id} onClick={() => setSelectedCatalogVendor(selectedCatalogVendor === v.id ? null : v.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  selectedCatalogVendor === v.id
                    ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                    : 'border-gray-200 hover:border-[#D4AF37]/40 bg-gray-50/50'
                }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{v.name}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{v.country} · {v.category}</p>
                  </div>
                  <div className="flex items-center gap-1 text-[#D4AF37]">
                    <Star size={10} fill="#D4AF37"/>
                    <span className="text-xs font-bold">{v.rating}</span>
                  </div>
                </div>
                <p className="text-[9px] text-slate-400 mt-1">{materialsForVendor(v.id).length} materials</p>
              </button>
            ))}
          </div>

          {/* Material rates */}
          <div>
            {selectedCatalogVendor ? (
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  {selectedCatalogVendorInfo?.name} — Materials ({currency})
                </p>
                <div className="space-y-1.5 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                  {selectedCatalogMaterials.map(m => (
                    <div key={m.id}
                      className="p-2.5 bg-gray-50 rounded-lg border border-gray-100 hover:border-[#D4AF37]/30 transition-all group cursor-pointer"
                      onClick={() => {
                        const price = currency === 'SDG' ? m.price_sdg : currency === 'OMR' ? m.price_omr : m.price_usd;
                        setPoForm(prev => ({ ...prev, itemDesc: m.material_name, unitPrice: String(m.price_usd) }));
                        setIsPOOpen(true);
                      }}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{m.material_name}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">
                            <span className={`px-1 rounded ${
                              m.category === 'API' ? 'bg-blue-100 text-blue-700' :
                              m.category === 'Excipient' ? 'bg-green-100 text-green-700' :
                              'bg-purple-100 text-purple-700'
                            }`}>{m.category}</span>
                            {m.lead_time_days && <span className="ml-1 text-slate-400"><Clock size={8} className="inline"/> {m.lead_time_days}d</span>}
                          </p>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <p className="text-xs font-black text-[#D4AF37]">
                            {fmt(m.price_usd)}/{m.unit}
                          </p>
                          {m.min_order_qty && <p className="text-[9px] text-slate-400">MOQ: {m.min_order_qty}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-10 text-slate-400">
                <Package size={32} className="mb-2 opacity-30"/>
                <p className="text-sm">Select a vendor to view materials</p>
                <p className="text-[10px] mt-1">Click any row to pre-fill PO</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-4">
          <div className="bg-white shadow-sm border border-[#D4AF37]/30 rounded-xl p-5 gold-glow">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="text-red-400" size={16}/> Material Shortages
            </h3>
            {shortages.length === 0
              ? <p className="text-slate-500 text-sm">No critical shortages.</p>
              : shortages.map(item => (
                <div key={item.id} className="p-4 bg-red-500/10 rounded-lg border border-red-500/20 flex justify-between items-center mb-3">
                  <div>
                    <h4 className="text-slate-900 font-bold text-sm">{item.name}</h4>
                    <p className="text-[10px] text-red-400 font-mono">Required: {item.balanceToPurchase} {item.unit}</p>
                  </div>
                  <button
                    onClick={() => {
                      const match = rates.find(r =>
                        r.name.toLowerCase().includes(item.name.toLowerCase()) ||
                        item.name.toLowerCase().includes(r.name.toLowerCase())
                      );
                      setPoForm(prev => ({
                        ...prev,
                        itemDesc: item.name,
                        qty: String(item.balanceToPurchase),
                        unitPrice: match ? String(match.price) : prev.unitPrice,
                      }));
                      setIsPOOpen(true);
                    }}
                    className="text-xs bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white px-3 py-1.5 rounded-lg border border-red-500/30 font-bold transition-all"
                  >
                    Fill PO
                  </button>
                </div>
              ))
            }
          </div>

          <div className="bg-white shadow-sm border border-[#D4AF37]/30 rounded-xl p-5 gold-glow">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BadgeDollarSign className="text-green-400" size={16}/> Market Raw Material Rates
              </h3>
              <button
                onClick={() => setShowAddRate(p => !p)}
                className="flex items-center gap-1 text-xs text-[#D4AF37] font-bold px-2 py-1 border border-[#D4AF37]/30 rounded-lg hover:bg-[#D4AF37]/10 transition-all"
              >
                <Plus size={11}/> Add Rate
              </button>
            </div>

            {showAddRate && (
              <div className="mb-4 p-3 bg-gray-50 border border-[#D4AF37]/20 rounded-xl space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input placeholder="Material name" value={newRate.name ?? ''} onChange={e => setNewRate(p => ({ ...p, name: e.target.value }))}
                    className="col-span-2 bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[#D4AF37]/50"/>
                  <select value={newRate.category ?? 'API'} onChange={e => setNewRate(p => ({ ...p, category: e.target.value as 'API' | 'Excipient' }))}
                    title="Material Category"
                    className="bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none">
                    <option value="API">API</option>
                    <option value="Excipient">Excipient</option>
                  </select>
                  <input type="number" placeholder="Price (USD)" value={newRate.price ?? ''} onChange={e => setNewRate(p => ({ ...p, price: Number(e.target.value) }))}
                    className="bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[#D4AF37]/50"/>
                  <input placeholder="Change (e.g. +1.5%)" value={newRate.change ?? ''} onChange={e => setNewRate(p => ({ ...p, change: e.target.value }))}
                    className="bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none"/>
                  <select value={newRate.up === null ? 'null' : String(newRate.up)} onChange={e => setNewRate(p => ({ ...p, up: e.target.value === 'null' ? null : e.target.value === 'true' }))}
                    title="Price Trend"
                    className="bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none">
                    <option value="null">Stable</option>
                    <option value="true">Up</option>
                    <option value="false">Down</option>
                  </select>
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowAddRate(false)} className="text-xs text-slate-500 px-3 py-1 hover:bg-gray-100 rounded-lg">Cancel</button>
                  <button onClick={handleAddRate} className="text-xs bg-[#D4AF37] text-slate-950 font-bold px-3 py-1 rounded-lg hover:bg-[#c4a030]">Add</button>
                </div>
              </div>
            )}

            <table className="w-full">
              <thead>
                <tr className="text-[9px] text-slate-500 uppercase font-bold border-b border-gray-200">
                  <th className="pb-2 text-left">Material</th>
                  <th className="pb-2 text-left">Cat.</th>
                  <th className="pb-2 text-right">Price/kg</th>
                  <th className="pb-2 text-left">Change</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rates.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-2 text-slate-700 text-xs font-medium">{m.name}</td>
                    <td className="py-2">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${m.category === 'API' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                        {m.category}
                      </span>
                    </td>
                    <td className="py-2 text-right text-[#D4AF37] text-xs font-bold font-mono">${m.price.toFixed(2)}</td>
                    <td className={`py-2 text-[10px] font-bold ${m.up === true ? 'text-green-500' : m.up === false ? 'text-red-400' : 'text-slate-500'}`}>
                      {m.change}
                    </td>
                    <td className="py-2 text-right">
                      <button onClick={() => handleDeleteRate(m.id)} className="p-1 text-slate-400 hover:text-red-400 rounded transition-all" title="Delete rate"><Trash2 size={10}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white shadow-sm border border-[#D4AF37]/30 rounded-xl p-5 gold-glow">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Globe className="text-[#F4C430]" size={16}/> Approved Suppliers
          </h3>
          <div className="space-y-3">
            {vendors.map(v => (
              <div key={v.id} className="p-4 bg-gray-50/30 rounded-lg border border-gray-200 hover:border-[#D4AF37]/20 transition-all group">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-slate-900 font-bold text-sm group-hover:text-[#D4AF37] transition-colors">{v.name}</h4>
                      <StatusBadge status={v.status}/>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">{v.country} · {v.category}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <div className="flex items-center text-[#D4AF37] text-xs font-bold gap-1">
                      <Star size={10} fill="#D4AF37"/> {v.rating}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => onOpenModal('edit', 'vendors', v as unknown as Record<string, unknown>)} className="p-1 text-slate-500 hover:text-[#D4AF37]" title="Edit vendor"><Edit2 size={11}/></button>
                      <button onClick={() => onDelete('vendors', v.id, v.name)} className="p-1 text-slate-500 hover:text-red-400" title="Delete vendor"><Trash2 size={11}/></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {vendors.length === 0 && <p className="text-slate-500 text-sm text-center py-4">No vendors added yet.</p>}
          </div>
        </div>
      </div>

      {isPOOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 shrink-0">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2"><Printer size={16} className="text-[#D4AF37]"/> Purchase Order</h2>
              <button onClick={() => setIsPOOpen(false)} className="text-slate-500 hover:text-slate-900 p-1.5 rounded-lg hover:bg-gray-100" title="Close"><X size={18}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="poNumber" className="block text-xs font-bold text-slate-600 uppercase mb-1">PO Number</label>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-500 whitespace-nowrap">AWP/PO/</span>
                    <input id="poNumber" value={poForm.poNumber} onChange={e => setPoField('poNumber', e.target.value)}
                      className="flex-1 bg-gray-50 border border-gray-200 text-slate-900 rounded-lg px-3 py-2 text-sm focus:border-[#D4AF37]/50 focus:outline-none"/>
                  </div>
                </div>
                <div>
                  <label htmlFor="poDate" className="block text-xs font-bold text-slate-600 uppercase mb-1">PO Date</label>
                  <input id="poDate" type="date" value={poForm.poDate} onChange={e => setPoField('poDate', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-slate-900 rounded-lg px-3 py-2 text-sm focus:border-[#D4AF37]/50 focus:outline-none"/>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Supplier Name</label>
                <input value={poForm.supplier} onChange={e => setPoField('supplier', e.target.value)} placeholder="Supplier company name"
                  className="w-full bg-gray-50 border border-gray-200 text-slate-900 rounded-lg px-3 py-2 text-sm focus:border-[#D4AF37]/50 focus:outline-none"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Supplier Address</label>
                <textarea value={poForm.supplierAddress} onChange={e => setPoField('supplierAddress', e.target.value)} rows={2} placeholder="Full address"
                  className="w-full bg-gray-50 border border-gray-200 text-slate-900 rounded-lg px-3 py-2 text-sm focus:border-[#D4AF37]/50 focus:outline-none resize-none"/>
              </div>
              <div>
                <label htmlFor="poVendor" className="block text-xs font-bold text-slate-600 uppercase mb-1">Link to Vendor (optional)</label>
                <select id="poVendor" value={poVendor} onChange={e => setPoVendor(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-slate-900 rounded-lg px-3 py-2 text-sm focus:border-[#D4AF37]/50 focus:outline-none">
                  <option value="">Select vendor...</option>
                  {vendors.map(v => <option key={v.id} value={v.id}>{v.name} — {v.country}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Item Description</label>
                  <input value={poForm.itemDesc} onChange={e => setPoField('itemDesc', e.target.value)} placeholder="Material name and specification"
                    className="w-full bg-gray-50 border border-gray-200 text-slate-900 rounded-lg px-3 py-2 text-sm focus:border-[#D4AF37]/50 focus:outline-none"/>
                </div>
                <div>
                  <label htmlFor="poQty" className="block text-xs font-bold text-slate-600 uppercase mb-1">Quantity (Kg)</label>
                  <input id="poQty" type="number" value={poForm.qty} onChange={e => setPoField('qty', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-slate-900 rounded-lg px-3 py-2 text-sm focus:border-[#D4AF37]/50 focus:outline-none"/>
                </div>
                <div>
                  <label htmlFor="poUnitPrice" className="block text-xs font-bold text-slate-600 uppercase mb-1">Unit Price (USD/Kg)</label>
                  <div className="flex gap-1">
                    <input id="poUnitPrice" type="number" value={poForm.unitPrice} onChange={e => setPoField('unitPrice', e.target.value)}
                      className="flex-1 bg-gray-50 border border-gray-200 text-slate-900 rounded-lg px-3 py-2 text-sm focus:border-[#D4AF37]/50 focus:outline-none"/>
                    <select
                      onChange={e => e.target.value && setPoField('unitPrice', e.target.value)}
                      className="bg-gray-50 border border-gray-200 text-slate-700 rounded-lg px-2 py-2 text-xs focus:border-[#D4AF37]/50 focus:outline-none"
                      defaultValue=""
                      title="Pick from market rates"
                    >
                      <option value="">Market rates</option>
                      {rates.map(r => (
                        <option key={r.id} value={r.price}>{r.name} — ${r.price}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {poForm.qty && poForm.unitPrice && (
                  <div className="col-span-2 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-lg px-4 py-2 text-sm font-bold text-[#D4AF37]">
                    Total: USD {(Number(poForm.qty) * Number(poForm.unitPrice)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                )}
                <div>
                  <label htmlFor="poOrigin" className="block text-xs font-bold text-slate-600 uppercase mb-1">Country of Origin</label>
                  <input id="poOrigin" value={poForm.countryOfOrigin} onChange={e => setPoField('countryOfOrigin', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-slate-900 rounded-lg px-3 py-2 text-sm focus:border-[#D4AF37]/50 focus:outline-none"/>
                </div>
                <div>
                  <label htmlFor="poEta" className="block text-xs font-bold text-slate-600 uppercase mb-1">ETA</label>
                  <input id="poEta" value={poForm.eta} onChange={e => setPoField('eta', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-slate-900 rounded-lg px-3 py-2 text-sm focus:border-[#D4AF37]/50 focus:outline-none"/>
                </div>
                <div>
                  <label htmlFor="poShipVia" className="block text-xs font-bold text-slate-600 uppercase mb-1">Ship Via</label>
                  <input id="poShipVia" value={poForm.shipVia} onChange={e => setPoField('shipVia', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-slate-900 rounded-lg px-3 py-2 text-sm focus:border-[#D4AF37]/50 focus:outline-none"/>
                </div>
                <div>
                  <label htmlFor="poPaymentTerms" className="block text-xs font-bold text-slate-600 uppercase mb-1">Payment Terms</label>
                  <input id="poPaymentTerms" value={poForm.paymentTerms} onChange={e => setPoField('paymentTerms', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-slate-900 rounded-lg px-3 py-2 text-sm focus:border-[#D4AF37]/50 focus:outline-none"/>
                </div>
                <div>
                  <label htmlFor="poFormOfPayment" className="block text-xs font-bold text-slate-600 uppercase mb-1">Form of Payment</label>
                  <input id="poFormOfPayment" value={poForm.formOfPayment} onChange={e => setPoField('formOfPayment', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-slate-900 rounded-lg px-3 py-2 text-sm focus:border-[#D4AF37]/50 focus:outline-none"/>
                </div>
                <div>
                  <label htmlFor="poRequestedBy" className="block text-xs font-bold text-slate-600 uppercase mb-1">Requested By</label>
                  <input id="poRequestedBy" value={poForm.requestedBy} onChange={e => setPoField('requestedBy', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-slate-900 rounded-lg px-3 py-2 text-sm focus:border-[#D4AF37]/50 focus:outline-none"/>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-gray-200 shrink-0">
              <button onClick={() => setIsPOOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
              <button
                onClick={() => {
                  setPreview({
                    title: 'Purchase Order',
                    html: buildPOHTML(poForm, selectedVendorName, apiConfig.logoUrl),
                    filename: `PO-${poForm.poNumber}`
                  });
                  setIsPOOpen(false);
                }}
                className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-slate-950 bg-[#D4AF37] hover:bg-[#c4a030] rounded-lg"
              >
                <Printer size={14}/> Preview PO
              </button>
            </div>
          </div>
        </div>
      )}

      {preview && <DocPreview title={preview.title} html={preview.html} filename={preview.filename} onClose={() => setPreview(null)} />}
    </div>
  );
};
