/**
 * AL WAJER PHARMACEUTICALS — ERP HUB v3.0
 * Full TypeScript App.tsx for Vite project
 * Features: Gemini AI, Supabase persistence, AI file import, CSV export,
 *           responsive design, upload progress, mobile nav, settings modal
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabaseClient";
import { exportToCSV } from "./exportUtils";
import {
  analyzeOperations,
  chatWithCOO,
  optimizeFormulation,
  analyzeImageOrFile,
  brainstormSession,
  generateIndustrialDesign,
} from "./geminiService";

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface Ingredient { sNo: string; name: string; quantity: number; unit: string; rateUSD: number; role: string; cost?: number; }
interface RDProject { id: string; title: string; status: string; batchSize: number; batchUnit: string; loss: number; ingredients: Ingredient[]; totalRMC?: number; totalFinalRMC?: number; }
interface Batch     { id: string; product: string; quantity: number; actualYield: number; expectedYield: number; status: string; timestamp: string; dispatchDate: string; }
interface InventoryItem { id: string; sNo: string; name: string; category: string; stock: number; requiredForOrders: number; unit: string; balanceToPurchase: number; stockDate: string; }
interface Order     { id: string; sNo: string; date: string; invoiceNo: string; customer: string; lcNo: string; country: string; product: string; quantity: number; rateUSD: number; amountUSD: number; amountOMR: number; status: string; }
interface Expense   { id: string; description: string; category: string; amount: number; status: string; dueDate: string; }
interface Employee  { id: string; name: string; role: string; department: string; salary: number; status: string; joinDate: string; }
interface VendorProduct { id: string; name: string; grade: string; unitPrice: number; unit: string; minOrderQty: number; }
interface Vendor    { id: string; name: string; category: string; rating: number; status: string; country: string; contactPerson: string; paymentTerms: string; leadTimeDays: number; products: VendorProduct[]; }
interface AuditEntry { id: string; action: string; details: string; user: string; timestamp: string; }
interface ChatMessage { role: string; text: string; }
interface UploadProgress { active: boolean; fileName: string; percent: number; stage: string; }

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const calcRD = (p: Partial<RDProject>): RDProject => {
  const ings = ((p.ingredients) || []).map(i => ({ ...i, cost: +((+i.quantity) * (+i.rateUSD)).toFixed(3) }));
  const totalRMC      = +ings.reduce((s, i) => s + (i.cost || 0), 0).toFixed(3);
  const totalFinalRMC = +((totalRMC / (+(p.batchSize!) || 100)) + (+(p.loss!) || 0)).toFixed(3);
  return { ...p, ingredients: ings, totalRMC, totalFinalRMC } as RDProject;
};

const uid = (prefix = "ID") => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;

// Supabase helpers
const dbSave  = async (table: string, row: any) => { try { await supabase.from(table).upsert(row); } catch {} };
const dbDel   = async (table: string, id: string) => { try { await supabase.from(table).delete().eq("id", id); } catch {} };
const dbFetch = async (table: string, order = "id") => { try { const { data } = await supabase.from(table).select("*").order(order); return data || []; } catch { return []; } };

// AI file import via Gemini
const aiImportFile = async (text: string, targetModule: string): Promise<any[]> => {
  const prompt = `You are a data extraction AI for an ERP system.
Extract structured data and return ONLY valid JSON. No markdown, no commentary.

TARGET MODULE: ${targetModule}

FORMATS:
- inventory: [{name, category, stock, requiredForOrders, unit, balanceToPurchase}]
- sales: [{customer, country, product, quantity, rateUSD, amountUSD, amountOMR, status, invoiceNo, date}]
- production: [{product, quantity, actualYield, expectedYield, status, dispatchDate}]
- expenses: [{description, category, amount, status, dueDate}]
- employees: [{name, role, department, salary, status, joinDate}]
- rd: [{title, batchSize, batchUnit, loss, status, ingredients:[{name,quantity,unit,rateUSD,role}]}]

CONTENT:
${text.substring(0, 4000)}

Return ONLY a JSON array. If nothing extractable, return [].`;

  try {
    const raw = await analyzeImageOrFile("", "text/plain", prompt).catch(() => "[]");
    const clean = (raw || "[]").replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch { return []; }
};

// ─── INITIAL DATA ─────────────────────────────────────────────────────────────
const INIT = {
  inventory: [
    { id: "RM-001", sNo: "1",  name: "OMEPRAZOLE POWDER",            category: "API",       stock: 15,   requiredForOrders: 1105, unit: "kg", balanceToPurchase: 1090, stockDate: "31.12.25" },
    { id: "RM-002", sNo: "2",  name: "Esomeprazole",                 category: "API",       stock: 55,   requiredForOrders: 1600, unit: "kg", balanceToPurchase: 1545, stockDate: "31.12.25" },
    { id: "RM-003", sNo: "3",  name: "Lansoprazole",                 category: "API",       stock: 84,   requiredForOrders: 0,    unit: "kg", balanceToPurchase: 0,    stockDate: "31.12.25" },
    { id: "RM-026", sNo: "26", name: "HPMC E-5",                     category: "Excipient", stock: 8642, requiredForOrders: 3000, unit: "kg", balanceToPurchase: -5642, stockDate: "31.12.25" },
    { id: "RM-030", sNo: "30", name: "TALCUM",                       category: "Excipient", stock: 500,  requiredForOrders: 1000, unit: "kg", balanceToPurchase: 500,  stockDate: "31.12.25" },
    { id: "RM-031", sNo: "31", name: "NPS 20/24",                    category: "Excipient", stock: 800,  requiredForOrders: 2000, unit: "kg", balanceToPurchase: 1200, stockDate: "31.12.25" },
    { id: "RM-032", sNo: "32", name: "Drug Coat L30 D (Eudragit L)", category: "Excipient", stock: 1200, requiredForOrders: 5000, unit: "kg", balanceToPurchase: 3800, stockDate: "31.12.25" },
  ] as InventoryItem[],
  orders: [
    { id: "ORD-01", sNo: "1", date: "2025-01-19", invoiceNo: "AWP/INV-01-25", customer: "FEROZSONS",            lcNo: "-",       country: "Pakistan", product: "Esomeprazole EC Pellets 22.5%",     quantity: 5000, rateUSD: 24, amountUSD: 120000, amountOMR: 46200, status: "Pending"    },
    { id: "ORD-02", sNo: "2", date: "2025-02-05", invoiceNo: "AWP/INV-02-25", customer: "Gulf Medical Supplies", lcNo: "LC-2501", country: "UAE",      product: "Omeprazole Pellets 8.5%",          quantity: 3000, rateUSD: 18, amountUSD:  54000, amountOMR: 20790, status: "Processing" },
    { id: "ORD-03", sNo: "3", date: "2025-02-15", invoiceNo: "AWP/INV-03-25", customer: "Kuwait Pharma Dist.",  lcNo: "LC-2502", country: "Kuwait",   product: "Lansoprazole DR Pellets 22.5%",     quantity: 2000, rateUSD: 22, amountUSD:  44000, amountOMR: 16940, status: "Shipped"    },
  ] as Order[],
  batches: [
    { id: "B-25-101", product: "Esomeprazole EC Pellets 22.5%",  quantity: 5000, actualYield: 99.2,  expectedYield: 100, status: "In-Progress", timestamp: "2025-11-20", dispatchDate: "2025-12-15" },
    { id: "B-25-102", product: "Omeprazole Pellets 8.5%",        quantity: 3000, actualYield: 98.5,  expectedYield: 100, status: "QC Hold",     timestamp: "2025-11-18", dispatchDate: "2025-12-10" },
    { id: "B-25-099", product: "Lansoprazole DR Pellets 22.5%",  quantity: 2000, actualYield: 100.1, expectedYield: 100, status: "Dispatched",  timestamp: "2025-11-10", dispatchDate: "2025-11-30" },
  ] as Batch[],
  expenses: [
    { id: "EXP-001", description: "Monthly Electricity – Sohar Plant", category: "Utilities",     amount: 14500, status: "Pending", dueDate: "2025-12-05" },
    { id: "EXP-002", description: "Astra Biotech API Payment",          category: "Raw Materials", amount: 85000, status: "Paid",    dueDate: "2025-11-15" },
    { id: "EXP-003", description: "Logistics – MENA Export",            category: "Logistics",     amount: 3200,  status: "Pending", dueDate: "2025-12-10" },
    { id: "EXP-004", description: "Lab Equipment Maintenance",          category: "Maintenance",   amount: 6800,  status: "Paid",    dueDate: "2025-11-20" },
  ] as Expense[],
  employees: [
    { id: "EMP-001", name: "Dr. Sarah Ahmed",    role: "Head of R&D",         department: "R&D",         salary: 12000, status: "Active", joinDate: "2023-05-12" },
    { id: "EMP-002", name: "John Doe",           role: "Production Manager",  department: "Production",  salary: 8500,  status: "Active", joinDate: "2022-10-01" },
    { id: "EMP-003", name: "Alia Khan",          role: "QC Chemist",          department: "QC",          salary: 5500,  status: "Active", joinDate: "2024-01-20" },
    { id: "EMP-004", name: "Mohammed Al Rashid", role: "Procurement Officer", department: "Procurement", salary: 4800,  status: "Active", joinDate: "2023-08-15" },
  ] as Employee[],
  vendors: [
    { id: "V-001", name: "Astra Biotech API",   category: "API",       rating: 4.8, status: "Verified",      country: "Germany", contactPerson: "Hans Müller",  paymentTerms: "LC at Sight",   leadTimeDays: 45, products: [{ id: "VP-001", name: "Esomeprazole Magnesium Trihydrate", grade: "USP", unitPrice: 48,   unit: "kg", minOrderQty: 25  }, { id: "VP-002", name: "Omeprazole Powder",   grade: "BP",  unitPrice: 32,   unit: "kg", minOrderQty: 50  }] },
    { id: "V-002", name: "Luzhou Chemicals",    category: "Excipient", rating: 4.2, status: "Audit Pending", country: "China",   contactPerson: "Li Wei",       paymentTerms: "TT in Advance", leadTimeDays: 30, products: [{ id: "VP-003", name: "NPS 20/24",                          grade: "BP",  unitPrice: 2.05, unit: "kg", minOrderQty: 200 }, { id: "VP-004", name: "HPMC E5",             grade: "USP", unitPrice: 7.25, unit: "kg", minOrderQty: 100 }] },
    { id: "V-003", name: "Tagoor Laboratories", category: "API",       rating: 4.5, status: "Verified",      country: "India",   contactPerson: "Rajesh Kumar", paymentTerms: "LC 30 Days",    leadTimeDays: 35, products: [{ id: "VP-005", name: "Lansoprazole",                       grade: "BP",  unitPrice: 38,   unit: "kg", minOrderQty: 20  }] },
  ] as Vendor[],
};

const INIT_RD: RDProject[] = [
  calcRD({ id: "RD-001", title: "Esomeprazole Magnesium Trihydrate Formulation", status: "Formulation", batchSize: 100, batchUnit: "Kg", loss: 0.02,
    ingredients: [
      { sNo: "1", name: "Esomeprazole Magnesium Trihydrate", quantity: 28.5,   unit: "Kg", rateUSD: 48,   role: "API"       },
      { sNo: "2", name: "NPS 20/24",                         quantity: 43.637, unit: "Kg", rateUSD: 2.05, role: "Filler"    },
      { sNo: "3", name: "HPMC E5 (Layer 1)",                 quantity: 13.12,  unit: "Kg", rateUSD: 7.25, role: "Binder"    },
      { sNo: "4", name: "Drug Coat L30 D",                   quantity: 86.66,  unit: "Kg", rateUSD: 4.20, role: "Coating"   },
      { sNo: "5", name: "Talcum",                            quantity: 0.42,   unit: "Kg", rateUSD: 1.20, role: "Lubricant" },
      { sNo: "6", name: "Tween 80",                          quantity: 0.04,   unit: "Kg", rateUSD: 3.00, role: "Surfactant"},
    ]
  }),
];

// ─── STYLE HELPERS ────────────────────────────────────────────────────────────
const statusColor = (s: string) => ({
  "In-Progress":   "text-blue-400 bg-blue-400/10 border-blue-400/30",
  "QC Hold":       "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  "Dispatched":    "text-green-400 bg-green-400/10 border-green-400/30",
  "Pending":       "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  "Processing":    "text-blue-400 bg-blue-400/10 border-blue-400/30",
  "Shipped":       "text-cyan-400 bg-cyan-400/10 border-cyan-400/30",
  "Delivered":     "text-green-400 bg-green-400/10 border-green-400/30",
  "Cancelled":     "text-red-400 bg-red-400/10 border-red-400/30",
  "Active":        "text-green-400 bg-green-400/10 border-green-400/30",
  "Paid":          "text-green-400 bg-green-400/10 border-green-400/30",
  "Verified":      "text-green-400 bg-green-400/10 border-green-400/30",
  "Audit Pending": "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  "On Leave":      "text-orange-400 bg-orange-400/10 border-orange-400/30",
  "Terminated":    "text-red-400 bg-red-400/10 border-red-400/30",
  "Formulation":   "text-purple-400 bg-purple-400/10 border-purple-400/30",
  "Stability":     "text-indigo-400 bg-indigo-400/10 border-indigo-400/30",
  "Approved":      "text-green-400 bg-green-400/10 border-green-400/30",
}[s] || "text-slate-400 bg-slate-400/10 border-slate-400/30");

const Badge = ({ label }: { label: string }) =>
  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor(label)}`}>{label}</span>;

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) =>
  <div className={`bg-slate-900/60 border border-white/10 rounded-xl ${className}`}>{children}</div>;

const Stat = ({ label, value, sub, color = "text-white" }: { label: string; value: any; sub?: string; color?: string }) => (
  <Card className="p-4">
    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{label}</p>
    <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
    {sub && <p className="text-[11px] text-slate-500 mt-0.5">{sub}</p>}
  </Card>
);

const Input = ({ label, value, onChange, type = "text", placeholder = "" }: any) => (
  <div>
    <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">{label}</label>
    <input type={type} value={value ?? ""} onChange={onChange} placeholder={placeholder}
      className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-[#D4AF37] focus:outline-none transition" />
  </div>
);

const Select = ({ label, value, onChange, options }: any) => (
  <div>
    <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">{label}</label>
    <select value={value ?? ""} onChange={onChange}
      className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-[#D4AF37] focus:outline-none transition">
      {options.map((o: string) => <option key={o}>{o}</option>)}
    </select>
  </div>
);

// NAV
const NAV = [
  { id: "dashboard",   label: "Dashboard",    emoji: "📊" },
  { id: "production",  label: "Manufacturing",emoji: "🏭" },
  { id: "inventory",   label: "Inventory",    emoji: "📦" },
  { id: "sales",       label: "Sales",        emoji: "💰" },
  { id: "procurement", label: "Procurement",  emoji: "🚚" },
  { id: "accounting",  label: "Accounting",   emoji: "💳" },
  { id: "hr",          label: "HR & Admin",   emoji: "👥" },
  { id: "rd",          label: "R&D Lab",      emoji: "🔬" },
  { id: "bd",          label: "Business Dev", emoji: "🌍" },
  { id: "ai",          label: "AI Command",   emoji: "🤖" },
  { id: "history",     label: "Audit Log",    emoji: "📋" },
];

// ─── UPLOAD PROGRESS COMPONENT ────────────────────────────────────────────────
const UploadProgressBar = ({ progress, onDismiss }: { progress: UploadProgress; onDismiss: () => void }) => {
  if (!progress.active) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 w-72 bg-slate-900 border border-[#D4AF37]/30 rounded-xl p-4 shadow-xl shadow-black/40">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-xs font-bold text-white">{progress.stage}</p>
          <p className="text-[10px] text-slate-500 truncate max-w-[180px]">{progress.fileName}</p>
        </div>
        {progress.percent >= 100 && (
          <button onClick={onDismiss} className="text-slate-500 hover:text-white text-sm ml-2">✕</button>
        )}
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${progress.percent}%`, background: "linear-gradient(90deg,#F4C430,#D4AF37)" }}
        />
      </div>
      <p className="text-[10px] text-[#D4AF37] mt-1 text-right font-bold">{progress.percent}%</p>
    </div>
  );
};

// ─── SETTINGS MODAL ───────────────────────────────────────────────────────────
const SettingsModal = ({ onClose, dbLive }: { onClose: () => void; dbLive: boolean }) => {
  const [supabaseUrl, setSupabaseUrl]   = useState(localStorage.getItem("aw_sb_url")   || "");
  const [supabaseKey, setSupabaseKey]   = useState(localStorage.getItem("aw_sb_key")   || "");
  const [geminiKey,   setGeminiKey]     = useState(localStorage.getItem("aw_gemini_key") || "");
  const [saved,       setSaved]         = useState(false);

  const handleSave = () => {
    if (supabaseUrl) localStorage.setItem("aw_sb_url", supabaseUrl);
    if (supabaseKey) localStorage.setItem("aw_sb_key", supabaseKey);
    if (geminiKey)   localStorage.setItem("aw_gemini_key", geminiKey);
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); window.location.reload(); }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-slate-950 border border-[#D4AF37]/30 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h3 className="font-bold text-white">⚙️ Settings & Configuration</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-lg">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-900 border border-white/5">
            <div className={`w-2 h-2 rounded-full ${dbLive ? "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.8)]" : "bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.8)]"}`} />
            <span className="text-xs font-bold text-slate-400">{dbLive ? "Supabase Connected" : "Supabase: Not Connected"}</span>
          </div>
          <Input label="Supabase Project URL" value={supabaseUrl} onChange={(e: any) => setSupabaseUrl(e.target.value)} placeholder="https://xxxx.supabase.co"/>
          <Input label="Supabase Anon Key" value={supabaseKey} onChange={(e: any) => setSupabaseKey(e.target.value)} placeholder="eyJ..."/>
          <Input label="Gemini API Key" value={geminiKey} onChange={(e: any) => setGeminiKey(e.target.value)} placeholder="AIza..."/>
        </div>
        <div className="p-5 border-t border-white/10 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2 text-slate-400 text-sm font-bold hover:text-white transition">Cancel</button>
          <button onClick={handleSave}
            className="px-6 py-2 rounded-lg font-bold text-sm text-slate-950 transition"
            style={{ background: "linear-gradient(135deg,#F4C430,#D4AF37)" }}>
            {saved ? "✅ Saved! Reloading…" : "Save & Reload"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── DATA IMPORT/EXPORT TOOLBAR ───────────────────────────────────────────────
const DataBar = ({ data, module, onImport }: { data: any[]; module: string; onImport: (rows: any[]) => void }) => {
  const fileRef   = useRef<HTMLInputElement>(null);
  const [loading, setLoading]   = useState(false);
  const [msg,     setMsg]       = useState("");
  const [progress, setProgress] = useState<UploadProgress>({ active: false, fileName: "", percent: 0, stage: "" });

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setLoading(true);
    setProgress({ active: true, fileName: file.name, percent: 10, stage: "📂 Reading file…" });

    let text = "";
    try { text = await file.text(); } catch {}
    setProgress(p => ({ ...p, percent: 35, stage: "🤖 AI analyzing…" }));

    const rows = await aiImportFile(text, module);
    setProgress(p => ({ ...p, percent: 80, stage: "📥 Importing data…" }));

    if (rows?.length) {
      onImport(rows);
      setMsg(`✅ Imported ${rows.length} rows`);
      setProgress(p => ({ ...p, percent: 100, stage: `✅ ${rows.length} rows imported!` }));
    } else {
      setMsg("⚠️ No structured data found");
      setProgress(p => ({ ...p, percent: 100, stage: "⚠️ No data extracted" }));
    }

    setLoading(false);
    setTimeout(() => { setMsg(""); setProgress({ active: false, fileName: "", percent: 0, stage: "" }); }, 4000);
    e.target.value = "";
  };

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => exportToCSV(data, module)}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300 rounded-lg text-xs font-bold transition">
          ⬇ Export CSV
        </button>
        <button onClick={() => fileRef.current?.click()} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] rounded-lg text-xs font-bold transition disabled:opacity-50">
          {loading ? "⏳ Importing…" : "⬆ AI Import"}
        </button>
        <input ref={fileRef} type="file" className="hidden" accept=".csv,.xlsx,.xls,.txt,.json,.pdf" onChange={handleFile} />
        {msg && <span className="text-xs text-slate-400">{msg}</span>}
      </div>
      <UploadProgressBar progress={progress} onDismiss={() => setProgress({ active: false, fileName: "", percent: 0, stage: "" })} />
    </>
  );
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab,         setTab]         = useState("dashboard");
  const [nav,         setNav]         = useState(false);
  const [dbLive,      setDbLive]      = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Data
  const [inventory,   setInventory]   = useState<InventoryItem[]>(INIT.inventory);
  const [orders,      setOrders]      = useState<Order[]>(INIT.orders);
  const [batches,     setBatches]     = useState<Batch[]>(INIT.batches);
  const [expenses,    setExpenses]    = useState<Expense[]>(INIT.expenses);
  const [employees,   setEmployees]   = useState<Employee[]>(INIT.employees);
  const [vendors,     setVendors]     = useState<Vendor[]>(INIT.vendors);
  const [rdProjects,  setRdProjects]  = useState<RDProject[]>(INIT_RD);
  const [audit,       setAudit]       = useState<AuditEntry[]>([]);

  const log = useCallback((action: string, details: string) => {
    const entry: AuditEntry = { id: uid("L"), action, details, user: "Admin", timestamp: new Date().toISOString() };
    setAudit(p => [entry, ...p.slice(0, 199)]);
    dbSave("audit_logs", entry);
  }, []);

  // Supabase sync
  useEffect(() => {
    (async () => {
      const [b, o, i] = await Promise.all([
        dbFetch("production_yields"),
        dbFetch("orders"),
        dbFetch("inventory"),
      ]);
      if (b?.length)  setBatches(b.map((x: any) => ({ ...x, actualYield: x.actual_yield || x.actualYield || 0, expectedYield: x.expected_yield || x.expectedYield || 100 })));
      if (o?.length)  setOrders(o.map((x: any)  => ({ ...x, amountUSD: x.amount_usd || x.amountUSD || 0, amountOMR: x.amount_omr || x.amountOMR || 0, invoiceNo: x.invoice_no || x.invoiceNo })));
      if (i?.length)  setInventory(i.map((x: any) => ({ ...x, requiredForOrders: x.required_for_orders || x.requiredForOrders || 0, balanceToPurchase: x.balance_to_purchase || x.balanceToPurchase || 0 })));
      if (b?.length || o?.length || i?.length) setDbLive(true);
    })();
  }, []);

  // AI import handlers
  const handleImport = (module: string, rows: any[]) => {
    const stamp = (r: any[]) => r.map(x => ({ ...x, id: x.id || uid(module.slice(0, 3).toUpperCase()) }));
    if (module === "inventory")  { setInventory(p  => [...stamp(rows), ...p]); rows.forEach(r => dbSave("inventory", r)); }
    if (module === "sales")      { setOrders(p     => [...stamp(rows), ...p]); rows.forEach(r => dbSave("orders", r)); }
    if (module === "production") { setBatches(p    => [...stamp(rows), ...p]); rows.forEach(r => dbSave("production_yields", r)); }
    if (module === "expenses")   { setExpenses(p   => [...stamp(rows), ...p]); }
    if (module === "employees")  { setEmployees(p  => [...stamp(rows), ...p]); }
    log("AI_IMPORT", `Imported ${rows.length} rows into ${module}`);
  };

  // ── DASHBOARD ──────────────────────────────────────────────────────────────
  const Dashboard = () => {
    const pendingOrders = orders.filter(o => o.status === "Pending");
    const criticalStock = inventory.filter(i => i.balanceToPurchase > 0);
    const avgYield      = batches.length ? (batches.reduce((s, b) => s + (+b.actualYield), 0) / batches.length).toFixed(1) : 0;
    const revenueTotal  = orders.reduce((s, o) => s + (+o.amountUSD || 0), 0);
    const expenseTotal  = expenses.reduce((s, e) => s + (+e.amount || 0), 0);

    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Operations Dashboard</h2>
            <p className="text-slate-500 text-sm mt-0.5">Al Wajer Pharmaceuticals · Sohar Industrial Area, Oman</p>
          </div>
          <div className="flex items-center gap-2 bg-slate-900 border border-white/10 rounded-xl px-3 py-2">
            <div className={`w-2 h-2 rounded-full ${dbLive ? "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.7)]" : "bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.7)]"}`} />
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{dbLive ? "DB Live" : "Local Mode"}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Stat label="Avg Batch Yield"  value={`${avgYield}%`}                        sub="target: 100%"  color="text-green-400" />
          <Stat label="Pending Orders"   value={pendingOrders.length}                   sub={`$${pendingOrders.reduce((s,o)=>s+(+o.amountUSD||0),0).toLocaleString()}`} color="text-yellow-400" />
          <Stat label="Critical Stock"   value={criticalStock.length}                   sub="items to buy"  color="text-red-400" />
          <Stat label="Total Revenue"    value={`$${revenueTotal.toLocaleString()}`}    sub="all orders"    color="text-green-400" />
          <Stat label="Total Expenses"   value={`OMR ${expenseTotal.toLocaleString()}`} sub="all recorded"  color="text-orange-400" />
          <Stat label="Staff"            value={employees.length}                       sub={`OMR ${employees.reduce((s,e)=>s+(+e.salary||0),0).toLocaleString()} payroll`} color="text-blue-400" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card>
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <h3 className="font-bold text-white text-sm">Recent Batches</h3>
              <button onClick={() => setTab("production")} className="text-[10px] text-[#D4AF37] hover:underline">All →</button>
            </div>
            {batches.slice(0, 5).map(b => (
              <div key={b.id} className="flex items-center justify-between p-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition">
                <div>
                  <p className="text-sm font-bold text-white leading-tight">{b.product}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{b.id} · {(+b.quantity || 0).toLocaleString()} kg</p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className={`text-base font-bold font-mono ${(+b.actualYield) >= 99 ? "text-green-400" : "text-yellow-400"}`}>{b.actualYield}%</p>
                  <Badge label={b.status} />
                </div>
              </div>
            ))}
          </Card>

          <Card>
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <h3 className="font-bold text-white text-sm">Inventory Alerts</h3>
              <button onClick={() => setTab("inventory")} className="text-[10px] text-[#D4AF37] hover:underline">All →</button>
            </div>
            {criticalStock.slice(0, 6).map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition">
                <div>
                  <p className="text-sm font-bold text-white">{item.name}</p>
                  <p className="text-[10px] text-slate-500">{item.category} · Stock: {(+item.stock || 0).toLocaleString()} {item.unit}</p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-sm font-bold text-red-400 font-mono">▲ {(+item.balanceToPurchase || 0).toLocaleString()}</p>
                  <p className="text-[10px] text-slate-500">{item.unit} to buy</p>
                </div>
              </div>
            ))}
            {!criticalStock.length && <div className="p-8 text-center text-slate-500 text-sm">✅ All stock levels sufficient</div>}
          </Card>

          <Card>
            <div className="p-4 border-b border-white/10">
              <h3 className="font-bold text-white text-sm">Finance Snapshot</h3>
            </div>
            <div className="p-4 space-y-2">
              {[
                ["Order Revenue",    `$${revenueTotal.toLocaleString()} USD`,                                                                       "text-green-400"],
                ["Paid Expenses",    `OMR ${expenses.filter(e => e.status === "Paid").reduce((s, e) => s + (+e.amount || 0), 0).toLocaleString()}`,  "text-slate-300"],
                ["Pending Payables", `OMR ${expenses.filter(e => e.status === "Pending").reduce((s, e) => s + (+e.amount || 0), 0).toLocaleString()}`,"text-yellow-400"],
                ["Monthly Payroll",  `OMR ${employees.reduce((s, e) => s + (+e.salary || 0), 0).toLocaleString()}`,                                  "text-blue-400"],
              ].map(([l, v, c]) => (
                <div key={l} className="flex justify-between items-center p-3 bg-slate-800/40 rounded-lg">
                  <span className="text-xs text-slate-400">{l}</span>
                  <span className={`font-bold text-sm font-mono ${c}`}>{v}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <h3 className="font-bold text-white text-sm">Active Orders</h3>
              <button onClick={() => setTab("sales")} className="text-[10px] text-[#D4AF37] hover:underline">All →</button>
            </div>
            {orders.slice(0, 5).map(o => (
              <div key={o.id} className="flex items-center justify-between p-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition">
                <div>
                  <p className="text-sm font-bold text-white">{o.customer}</p>
                  <p className="text-[10px] text-slate-500">{o.country} · {o.product?.slice(0, 30)}</p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-sm font-bold font-mono text-green-400">${(+o.amountUSD || 0).toLocaleString()}</p>
                  <Badge label={o.status} />
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    );
  };

  // ── PRODUCTION ──────────────────────────────────────────────────────────────
  const Production = () => {
    const [open, setOpen] = useState(false);
    const [f, setF] = useState({ product: "", quantity: 0, actualYield: 100, expectedYield: 100, status: "In-Progress", dispatchDate: "" });
    const save = () => {
      const b = { ...f, id: uid("B"), timestamp: new Date().toISOString().split("T")[0], quantity: +f.quantity, actualYield: +f.actualYield, expectedYield: +f.expectedYield };
      setBatches(p => [b as Batch, ...p]); dbSave("production_yields", b); log("CREATE", `Batch: ${b.product}`); setOpen(false);
      setF({ product: "", quantity: 0, actualYield: 100, expectedYield: 100, status: "In-Progress", dispatchDate: "" });
    };
    const del = (id: string) => { setBatches(p => p.filter(x => x.id !== id)); dbDel("production_yields", id); log("DELETE", `Batch ${id}`); };
    const avgYield = batches.length ? (batches.reduce((s, b) => s + (+b.actualYield), 0) / batches.length).toFixed(1) : 0;

    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-xl font-bold text-white">🏭 Manufacturing Batches</h2>
          <div className="flex gap-2 flex-wrap">
            <DataBar data={batches} module="production" onImport={r => handleImport("production", r)} />
            <button onClick={() => setOpen(s => !s)} className="px-4 py-2 rounded-lg text-sm font-bold bg-[#D4AF37] text-slate-950 hover:bg-[#c4a030] transition">{open ? "✕ Cancel" : "+ New Batch"}</button>
          </div>
        </div>
        {open && (
          <Card className="p-5">
            <p className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest mb-4">New Batch</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Input label="Product Name *"   value={f.product}       onChange={(e: any) => setF(p => ({ ...p, product: e.target.value }))} />
              <Input label="Quantity (kg)"    type="number" value={f.quantity}      onChange={(e: any) => setF(p => ({ ...p, quantity: e.target.value }))} />
              <Input label="Actual Yield %"   type="number" value={f.actualYield}   onChange={(e: any) => setF(p => ({ ...p, actualYield: e.target.value }))} />
              <Input label="Expected Yield %" type="number" value={f.expectedYield} onChange={(e: any) => setF(p => ({ ...p, expectedYield: e.target.value }))} />
              <Input label="Dispatch Date"    type="date"   value={f.dispatchDate}  onChange={(e: any) => setF(p => ({ ...p, dispatchDate: e.target.value }))} />
              <Select label="Status" value={f.status} onChange={(e: any) => setF(p => ({ ...p, status: e.target.value }))} options={["In-Progress", "QC Hold", "Dispatched"]} />
            </div>
            <div className="flex justify-end mt-4 gap-2">
              <button onClick={() => setOpen(false)} className="px-5 py-2 text-slate-400 text-sm font-bold">Cancel</button>
              <button onClick={save} disabled={!f.product} className="px-6 py-2 bg-[#D4AF37] text-slate-950 rounded-lg font-bold text-sm disabled:opacity-40">Save Batch</button>
            </div>
          </Card>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="Total Batches" value={batches.length} />
          <Stat label="In Progress"   value={batches.filter(b => b.status === "In-Progress").length} color="text-blue-400" />
          <Stat label="QC Hold"       value={batches.filter(b => b.status === "QC Hold").length}     color="text-yellow-400" />
          <Stat label="Avg Yield"     value={`${avgYield}%`}                                          color="text-green-400" />
        </div>
        <Card className="overflow-x-auto">
          <table className="w-full text-left min-w-[640px]">
            <thead className="border-b border-white/10 bg-slate-900">
              {["Batch ID", "Product", "Qty (kg)", "Actual Yield", "Expected", "Status", "Dispatch", "Del"].map(h =>
                <th key={h} className="px-3 py-3 text-[10px] text-slate-400 uppercase font-bold whitespace-nowrap">{h}</th>
              )}
            </thead>
            <tbody className="divide-y divide-white/5">
              {batches.map(b => (
                <tr key={b.id} className="hover:bg-white/5 transition">
                  <td className="px-3 py-3 text-xs font-mono text-[#D4AF37]">{b.id}</td>
                  <td className="px-3 py-3 text-sm font-bold text-white max-w-[180px] truncate">{b.product}</td>
                  <td className="px-3 py-3 text-sm font-mono text-slate-300">{(+b.quantity || 0).toLocaleString()}</td>
                  <td className="px-3 py-3"><span className={`font-bold font-mono text-sm ${(+b.actualYield) >= 99 ? "text-green-400" : "text-yellow-400"}`}>{b.actualYield}%</span></td>
                  <td className="px-3 py-3 text-sm font-mono text-slate-400">{b.expectedYield}%</td>
                  <td className="px-3 py-3"><Badge label={b.status} /></td>
                  <td className="px-3 py-3 text-xs text-slate-400">{b.dispatchDate || "—"}</td>
                  <td className="px-3 py-3"><button onClick={() => del(b.id)} className="text-[10px] text-red-500 hover:text-red-400 font-bold px-2 py-1 rounded border border-red-500/20 hover:bg-red-500/10 transition">Del</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    );
  };

  // ── INVENTORY ──────────────────────────────────────────────────────────────
  const Inventory = () => {
    const [open, setOpen] = useState(false);
    const [f, setF] = useState({ sNo: "", name: "", category: "API", stock: 0, requiredForOrders: 0, unit: "kg", stockDate: "31.12.25" });
    const save = () => {
      const item = { ...f, id: uid("RM"), stock: +f.stock, requiredForOrders: +f.requiredForOrders, balanceToPurchase: (+f.requiredForOrders) - (+f.stock) };
      setInventory(p => [item as InventoryItem, ...p]); dbSave("inventory", item); log("CREATE", `Inventory: ${item.name}`); setOpen(false);
      setF({ sNo: "", name: "", category: "API", stock: 0, requiredForOrders: 0, unit: "kg", stockDate: "31.12.25" });
    };
    const del = (id: string) => { setInventory(p => p.filter(x => x.id !== id)); dbDel("inventory", id); log("DELETE", `Inventory ${id}`); };
    const critical = inventory.filter(i => (+i.balanceToPurchase) > 0);

    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-xl font-bold text-white">📦 Raw Material Inventory</h2>
          <div className="flex gap-2 flex-wrap">
            <DataBar data={inventory} module="inventory" onImport={r => handleImport("inventory", r)} />
            <button onClick={() => setOpen(s => !s)} className="px-4 py-2 rounded-lg text-sm font-bold bg-[#D4AF37] text-slate-950 hover:bg-[#c4a030] transition">{open ? "✕" : "+ Add Item"}</button>
          </div>
        </div>
        {open && (
          <Card className="p-5">
            <p className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest mb-4">New Raw Material</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Input label="S.No"               value={f.sNo}              onChange={(e: any) => setF(p => ({ ...p, sNo: e.target.value }))} />
              <Input label="Material Name *"    value={f.name}             onChange={(e: any) => setF(p => ({ ...p, name: e.target.value }))} />
              <Select label="Category"          value={f.category}         onChange={(e: any) => setF(p => ({ ...p, category: e.target.value }))} options={["API", "Excipient", "Packaging", "Other"]} />
              <Input label="Present Stock"      type="number" value={f.stock}             onChange={(e: any) => setF(p => ({ ...p, stock: e.target.value }))} />
              <Input label="Required for Orders" type="number" value={f.requiredForOrders} onChange={(e: any) => setF(p => ({ ...p, requiredForOrders: e.target.value }))} />
              <Select label="Unit"              value={f.unit}             onChange={(e: any) => setF(p => ({ ...p, unit: e.target.value }))} options={["kg", "g", "L", "mL", "units"]} />
            </div>
            <div className="flex justify-end mt-4 gap-2">
              <button onClick={() => setOpen(false)} className="px-5 py-2 text-slate-400 text-sm font-bold">Cancel</button>
              <button onClick={save} disabled={!f.name} className="px-6 py-2 bg-[#D4AF37] text-slate-950 rounded-lg font-bold text-sm disabled:opacity-40">Save</button>
            </div>
          </Card>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="Total Items"    value={inventory.length} />
          <Stat label="API Count"      value={inventory.filter(i => i.category === "API").length}       color="text-purple-400" />
          <Stat label="Critical Stock" value={critical.length}                                           color="text-red-400" />
          <Stat label="Surplus Items"  value={inventory.filter(i => (+i.balanceToPurchase) < 0).length} color="text-green-400" />
        </div>
        <Card className="overflow-x-auto">
          <table className="w-full text-left min-w-[760px]">
            <thead className="border-b border-white/10 bg-slate-900">
              {["S.No", "Material", "Category", "Required (kg)", "Stock (kg)", "Balance", "Status", "Del"].map(h =>
                <th key={h} className="px-3 py-3 text-[10px] text-slate-400 uppercase font-bold whitespace-nowrap">{h}</th>
              )}
            </thead>
            <tbody className="divide-y divide-white/5">
              {inventory.map(item => (
                <tr key={item.id} className="hover:bg-white/5 transition">
                  <td className="px-3 py-3 text-xs text-slate-500">{item.sNo}</td>
                  <td className="px-3 py-3 text-sm font-bold text-white max-w-[180px] truncate">{item.name}</td>
                  <td className="px-3 py-3"><Badge label={item.category} /></td>
                  <td className="px-3 py-3 text-sm font-mono text-slate-300">{(+item.requiredForOrders || 0).toLocaleString()}</td>
                  <td className="px-3 py-3 text-sm font-mono text-slate-300">{(+item.stock || 0).toLocaleString()}</td>
                  <td className="px-3 py-3">
                    <span className={`font-bold font-mono text-sm ${(+item.balanceToPurchase) > 500 ? "text-red-400" : (+item.balanceToPurchase) > 0 ? "text-yellow-400" : "text-green-400"}`}>
                      {(+item.balanceToPurchase || 0).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-[10px] font-bold">
                      {(+item.balanceToPurchase) > 0 ? "🔴 BUY" : "🟢 OK"}
                    </span>
                  </td>
                  <td className="px-3 py-3"><button onClick={() => del(item.id)} className="text-[10px] text-red-500 hover:text-red-400 font-bold px-2 py-1 rounded border border-red-500/20 hover:bg-red-500/10 transition">Del</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    );
  };

  // ── SALES ──────────────────────────────────────────────────────────────────
  const Sales = () => {
    const [open, setOpen] = useState(false);
    const [f, setF] = useState({ sNo: "", date: "", invoiceNo: "", customer: "", lcNo: "", country: "", product: "", quantity: 0, rateUSD: 0, amountUSD: 0, amountOMR: 0, status: "Pending" });
    const calcAmounts = (qty: number, rate: number) => ({ amountUSD: +(qty * rate).toFixed(2), amountOMR: +(qty * rate * 0.385).toFixed(2) });
    const save = () => {
      const o = { ...f, id: uid("ORD"), quantity: +f.quantity, rateUSD: +f.rateUSD, ...calcAmounts(+f.quantity, +f.rateUSD) };
      setOrders(p => [o as Order, ...p]); dbSave("orders", o); log("CREATE", `Order: ${o.customer} – ${o.product}`); setOpen(false);
      setF({ sNo: "", date: "", invoiceNo: "", customer: "", lcNo: "", country: "", product: "", quantity: 0, rateUSD: 0, amountUSD: 0, amountOMR: 0, status: "Pending" });
    };
    const del = (id: string) => { setOrders(p => p.filter(x => x.id !== id)); dbDel("orders", id); log("DELETE", `Order ${id}`); };
    const totalRevenue = orders.reduce((s, o) => s + (+o.amountUSD || 0), 0);

    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-xl font-bold text-white">💰 Sales Orders</h2>
          <div className="flex gap-2 flex-wrap">
            <DataBar data={orders} module="sales" onImport={r => handleImport("sales", r)} />
            <button onClick={() => setOpen(s => !s)} className="px-4 py-2 rounded-lg text-sm font-bold bg-[#D4AF37] text-slate-950 hover:bg-[#c4a030] transition">{open ? "✕" : "+ New Order"}</button>
          </div>
        </div>
        {open && (
          <Card className="p-5">
            <p className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest mb-4">New Sales Order</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Input label="Customer *"   value={f.customer}   onChange={(e: any) => setF(p => ({ ...p, customer: e.target.value }))} />
              <Input label="Country"      value={f.country}    onChange={(e: any) => setF(p => ({ ...p, country: e.target.value }))} />
              <Input label="Product"      value={f.product}    onChange={(e: any) => setF(p => ({ ...p, product: e.target.value }))} />
              <Input label="Invoice No."  value={f.invoiceNo}  onChange={(e: any) => setF(p => ({ ...p, invoiceNo: e.target.value }))} />
              <Input label="LC/BIC No."   value={f.lcNo}       onChange={(e: any) => setF(p => ({ ...p, lcNo: e.target.value }))} />
              <Input label="Date"         type="date" value={f.date} onChange={(e: any) => setF(p => ({ ...p, date: e.target.value }))} />
              <Input label="Qty (kg)"     type="number" value={f.quantity} onChange={(e: any) => setF(p => ({ ...p, quantity: e.target.value }))} />
              <Input label="Rate (USD/kg)" type="number" value={f.rateUSD} onChange={(e: any) => setF(p => ({ ...p, rateUSD: e.target.value }))} />
              <Select label="Status"      value={f.status}     onChange={(e: any) => setF(p => ({ ...p, status: e.target.value }))} options={["Pending", "Processing", "Shipped", "Delivered", "Cancelled"]} />
            </div>
            <div className="flex justify-end mt-4 gap-2">
              <button onClick={() => setOpen(false)} className="px-5 py-2 text-slate-400 text-sm font-bold">Cancel</button>
              <button onClick={save} disabled={!f.customer} className="px-6 py-2 bg-[#D4AF37] text-slate-950 rounded-lg font-bold text-sm disabled:opacity-40">Save Order</button>
            </div>
          </Card>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="Total Orders"   value={orders.length} />
          <Stat label="Pending"        value={orders.filter(o => o.status === "Pending").length}   color="text-yellow-400" />
          <Stat label="Total Revenue"  value={`$${totalRevenue.toLocaleString()}`}                 color="text-green-400" />
          <Stat label="Customers"      value={new Set(orders.map(o => o.customer)).size}           color="text-blue-400" />
        </div>
        <Card className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead className="border-b border-white/10 bg-slate-900">
              {["Invoice", "Date", "Customer", "Country", "Product", "Qty (kg)", "Rate $", "Amount $", "Amount OMR", "Status", "Del"].map(h =>
                <th key={h} className="px-3 py-3 text-[10px] text-slate-400 uppercase font-bold whitespace-nowrap">{h}</th>
              )}
            </thead>
            <tbody className="divide-y divide-white/5">
              {orders.map(o => (
                <tr key={o.id} className="hover:bg-white/5 transition">
                  <td className="px-3 py-3 text-xs font-mono text-[#D4AF37]">{o.invoiceNo}</td>
                  <td className="px-3 py-3 text-xs text-slate-400">{o.date}</td>
                  <td className="px-3 py-3 text-sm font-bold text-white">{o.customer}</td>
                  <td className="px-3 py-3 text-xs text-slate-400">{o.country}</td>
                  <td className="px-3 py-3 text-xs text-slate-300 max-w-[160px] truncate">{o.product}</td>
                  <td className="px-3 py-3 text-sm font-mono">{(+o.quantity || 0).toLocaleString()}</td>
                  <td className="px-3 py-3 text-sm font-mono">${(+o.rateUSD || 0)}</td>
                  <td className="px-3 py-3 text-sm font-mono text-green-400">${(+o.amountUSD || 0).toLocaleString()}</td>
                  <td className="px-3 py-3 text-sm font-mono text-slate-300">{(+o.amountOMR || 0).toLocaleString()}</td>
                  <td className="px-3 py-3"><Badge label={o.status} /></td>
                  <td className="px-3 py-3"><button onClick={() => del(o.id)} className="text-[10px] text-red-500 hover:text-red-400 font-bold px-2 py-1 rounded border border-red-500/20 hover:bg-red-500/10 transition">Del</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    );
  };

  // ── PROCUREMENT ────────────────────────────────────────────────────────────
  const Procurement = () => {
    const [view, setView]   = useState<"vendors" | "shortages">("vendors");
    const [open, setOpen]   = useState(false);
    const [f, setF]         = useState({ name: "", category: "API", country: "", contactPerson: "", paymentTerms: "LC at Sight", leadTimeDays: 30, rating: 4.0, status: "New" });
    const save = () => {
      const v = { ...f, id: uid("V"), products: [], leadTimeDays: +f.leadTimeDays, rating: +f.rating };
      setVendors(p => [v as Vendor, ...p]); log("CREATE", `Vendor: ${v.name}`); setOpen(false);
      setF({ name: "", category: "API", country: "", contactPerson: "", paymentTerms: "LC at Sight", leadTimeDays: 30, rating: 4.0, status: "New" });
    };
    const del = (id: string) => { setVendors(p => p.filter(x => x.id !== id)); log("DELETE", `Vendor ${id}`); };
    const shortages = inventory.filter(i => (+i.balanceToPurchase) > 0);

    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-xl font-bold text-white">🚚 Procurement</h2>
          <div className="flex gap-2">
            {(["vendors", "shortages"] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition ${view === v ? "bg-[#D4AF37] text-slate-950" : "bg-slate-800 text-slate-400 hover:text-white"}`}>
                {v === "vendors" ? "Vendors" : `Shortages (${shortages.length})`}
              </button>
            ))}
          </div>
        </div>

        {view === "vendors" && (
          <>
            <div className="flex justify-between flex-wrap gap-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
                <Stat label="Total Vendors"  value={vendors.length} />
                <Stat label="Verified"       value={vendors.filter(v => v.status === "Verified").length}      color="text-green-400" />
                <Stat label="Audit Pending"  value={vendors.filter(v => v.status === "Audit Pending").length} color="text-yellow-400" />
                <Stat label="Total Products" value={vendors.reduce((s, v) => s + v.products.length, 0)}       color="text-blue-400" />
              </div>
              <button onClick={() => setOpen(s => !s)} className="px-4 py-2 rounded-lg text-sm font-bold bg-[#D4AF37] text-slate-950 hover:bg-[#c4a030] transition shrink-0 self-start">{open ? "✕" : "+ Add Vendor"}</button>
            </div>
            {open && (
              <Card className="p-5">
                <p className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest mb-4">New Vendor</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <Input label="Vendor Name *"    value={f.name}          onChange={(e: any) => setF(p => ({ ...p, name: e.target.value }))} />
                  <Input label="Country"          value={f.country}       onChange={(e: any) => setF(p => ({ ...p, country: e.target.value }))} />
                  <Input label="Contact Person"   value={f.contactPerson} onChange={(e: any) => setF(p => ({ ...p, contactPerson: e.target.value }))} />
                  <Select label="Category"        value={f.category}      onChange={(e: any) => setF(p => ({ ...p, category: e.target.value }))} options={["API", "Excipient", "Packaging", "Equipment", "Other"]} />
                  <Select label="Payment Terms"   value={f.paymentTerms}  onChange={(e: any) => setF(p => ({ ...p, paymentTerms: e.target.value }))} options={["LC at Sight", "LC 30 Days", "TT in Advance", "Open Account"]} />
                  <Select label="Status"          value={f.status}        onChange={(e: any) => setF(p => ({ ...p, status: e.target.value }))} options={["Verified", "Audit Pending", "New", "Blacklisted"]} />
                </div>
                <div className="flex justify-end mt-4 gap-2">
                  <button onClick={() => setOpen(false)} className="px-5 py-2 text-slate-400 text-sm font-bold">Cancel</button>
                  <button onClick={save} disabled={!f.name} className="px-6 py-2 bg-[#D4AF37] text-slate-950 rounded-lg font-bold text-sm disabled:opacity-40">Save Vendor</button>
                </div>
              </Card>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {vendors.map(v => (
                <Card key={v.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-white">{v.name}</p>
                      <p className="text-[11px] text-slate-500">{v.country} · {v.contactPerson}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge label={v.status} />
                      <button onClick={() => del(v.id)} className="text-[10px] text-red-500 hover:text-red-400 font-bold px-2 py-1 rounded border border-red-500/20 hover:bg-red-500/10 transition">Del</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center mb-3">
                    {[["Category", v.category], ["Lead Time", `${v.leadTimeDays}d`], ["Rating", `${v.rating}⭐`]].map(([l, val]) =>
                      <div key={l} className="bg-slate-800/50 rounded-lg p-2">
                        <p className="text-[9px] text-slate-500 uppercase font-bold">{l}</p>
                        <p className="text-xs font-bold text-white mt-0.5">{val}</p>
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-2">Products ({v.products.length})</p>
                  <div className="space-y-1">
                    {v.products.map(p => (
                      <div key={p.id} className="flex justify-between items-center p-2 bg-slate-800/30 rounded-lg">
                        <span className="text-xs text-slate-300">{p.name} <span className="text-slate-500">({p.grade})</span></span>
                        <span className="text-xs font-bold font-mono text-[#D4AF37]">${p.unitPrice}/{p.unit}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        {view === "shortages" && (
          <Card className="overflow-x-auto">
            <div className="p-4 border-b border-white/10">
              <h3 className="font-bold text-white text-sm">🔴 Purchase Shortages — {shortages.length} items</h3>
            </div>
            <table className="w-full text-left min-w-[600px]">
              <thead className="border-b border-white/10 bg-slate-900">
                {["S.No", "Material", "Category", "Required", "In Stock", "To Purchase", "Priority"].map(h =>
                  <th key={h} className="px-3 py-3 text-[10px] text-slate-400 uppercase font-bold whitespace-nowrap">{h}</th>
                )}
              </thead>
              <tbody className="divide-y divide-white/5">
                {shortages.map(item => (
                  <tr key={item.id} className="hover:bg-white/5 transition">
                    <td className="px-3 py-3 text-xs text-slate-500">{item.sNo}</td>
                    <td className="px-3 py-3 text-sm font-bold text-white">{item.name}</td>
                    <td className="px-3 py-3"><Badge label={item.category} /></td>
                    <td className="px-3 py-3 text-sm font-mono">{(+item.requiredForOrders || 0).toLocaleString()} {item.unit}</td>
                    <td className="px-3 py-3 text-sm font-mono text-slate-400">{(+item.stock || 0).toLocaleString()} {item.unit}</td>
                    <td className="px-3 py-3 text-sm font-mono font-bold text-red-400">{(+item.balanceToPurchase || 0).toLocaleString()} {item.unit}</td>
                    <td className="px-3 py-3 text-[10px] font-bold">{(+item.balanceToPurchase) > 1000 ? "🔴 URGENT" : "🟡 HIGH"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    );
  };

  // ── ACCOUNTING ─────────────────────────────────────────────────────────────
  const Accounting = () => {
    const [open, setOpen] = useState(false);
    const [f, setF] = useState({ description: "", category: "Utilities", amount: 0, status: "Pending", dueDate: "" });
    const save = () => {
      const e = { ...f, id: uid("EXP"), amount: +f.amount };
      setExpenses(p => [e as Expense, ...p]); log("CREATE", `Expense: ${e.description}`); setOpen(false);
      setF({ description: "", category: "Utilities", amount: 0, status: "Pending", dueDate: "" });
    };
    const toggle = (id: string) => setExpenses(p => p.map(e => e.id === id ? { ...e, status: e.status === "Paid" ? "Pending" : "Paid" } : e));
    const del    = (id: string) => { setExpenses(p => p.filter(x => x.id !== id)); log("DELETE", `Expense ${id}`); };
    const totalPaid    = expenses.filter(e => e.status === "Paid").reduce((s, e) => s + (+e.amount || 0), 0);
    const totalPending = expenses.filter(e => e.status === "Pending").reduce((s, e) => s + (+e.amount || 0), 0);

    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-xl font-bold text-white">💳 Accounting & Expenses</h2>
          <div className="flex gap-2 flex-wrap">
            <DataBar data={expenses} module="expenses" onImport={r => handleImport("expenses", r)} />
            <button onClick={() => setOpen(s => !s)} className="px-4 py-2 rounded-lg text-sm font-bold bg-[#D4AF37] text-slate-950 hover:bg-[#c4a030] transition">{open ? "✕" : "+ Add Expense"}</button>
          </div>
        </div>
        {open && (
          <Card className="p-5">
            <p className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest mb-4">New Expense</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <Input label="Description *" value={f.description} onChange={(e: any) => setF(p => ({ ...p, description: e.target.value }))} />
              </div>
              <Select label="Category" value={f.category} onChange={(e: any) => setF(p => ({ ...p, category: e.target.value }))} options={["Utilities", "Raw Materials", "Logistics", "Maintenance", "Salaries", "Other"]} />
              <Input label="Amount (OMR)"  type="number" value={f.amount} onChange={(e: any) => setF(p => ({ ...p, amount: e.target.value }))} />
              <Input label="Due Date"      type="date"   value={f.dueDate} onChange={(e: any) => setF(p => ({ ...p, dueDate: e.target.value }))} />
              <Select label="Status" value={f.status} onChange={(e: any) => setF(p => ({ ...p, status: e.target.value }))} options={["Pending", "Paid"]} />
            </div>
            <div className="flex justify-end mt-4 gap-2">
              <button onClick={() => setOpen(false)} className="px-5 py-2 text-slate-400 text-sm font-bold">Cancel</button>
              <button onClick={save} disabled={!f.description} className="px-6 py-2 bg-[#D4AF37] text-slate-950 rounded-lg font-bold text-sm disabled:opacity-40">Save</button>
            </div>
          </Card>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="Total Expenses" value={expenses.length} />
          <Stat label="Total Paid"     value={`OMR ${totalPaid.toLocaleString()}`}    color="text-green-400" />
          <Stat label="Pending"        value={`OMR ${totalPending.toLocaleString()}`} color="text-yellow-400" />
          <Stat label="Categories"     value={new Set(expenses.map(e => e.category)).size} color="text-blue-400" />
        </div>
        <Card className="overflow-x-auto">
          <table className="w-full text-left min-w-[640px]">
            <thead className="border-b border-white/10 bg-slate-900">
              {["Description", "Category", "Amount (OMR)", "Due Date", "Status", "Actions"].map(h =>
                <th key={h} className="px-3 py-3 text-[10px] text-slate-400 uppercase font-bold whitespace-nowrap">{h}</th>
              )}
            </thead>
            <tbody className="divide-y divide-white/5">
              {expenses.map(e => (
                <tr key={e.id} className="hover:bg-white/5 transition">
                  <td className="px-3 py-3 text-sm font-bold text-white max-w-[200px] truncate">{e.description}</td>
                  <td className="px-3 py-3"><Badge label={e.category} /></td>
                  <td className="px-3 py-3 text-sm font-mono font-bold">{(+e.amount || 0).toLocaleString()}</td>
                  <td className="px-3 py-3 text-xs text-slate-400">{e.dueDate || "—"}</td>
                  <td className="px-3 py-3"><Badge label={e.status} /></td>
                  <td className="px-3 py-3 flex gap-2">
                    <button onClick={() => toggle(e.id)} className="text-[10px] text-blue-400 hover:text-blue-300 font-bold px-2 py-1 rounded border border-blue-500/20 hover:bg-blue-500/10 transition">{e.status === "Paid" ? "Mark Pending" : "Mark Paid"}</button>
                    <button onClick={() => del(e.id)}    className="text-[10px] text-red-500 hover:text-red-400 font-bold px-2 py-1 rounded border border-red-500/20 hover:bg-red-500/10 transition">Del</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    );
  };

  // ── HR & ADMIN ─────────────────────────────────────────────────────────────
  const HR = () => {
    const [open, setOpen] = useState(false);
    const [f, setF] = useState({ name: "", role: "", department: "Production", salary: 0, status: "Active", joinDate: "" });
    const save = () => {
      const e = { ...f, id: uid("EMP"), salary: +f.salary };
      setEmployees(p => [e as Employee, ...p]); log("CREATE", `Employee: ${e.name}`); setOpen(false);
      setF({ name: "", role: "", department: "Production", salary: 0, status: "Active", joinDate: "" });
    };
    const del = (id: string) => { setEmployees(p => p.filter(x => x.id !== id)); log("DELETE", `Employee ${id}`); };
    const depts = [...new Set(employees.map(e => e.department))];

    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-xl font-bold text-white">👥 HR & Administration</h2>
          <div className="flex gap-2 flex-wrap">
            <DataBar data={employees} module="employees" onImport={r => handleImport("employees", r)} />
            <button onClick={() => setOpen(s => !s)} className="px-4 py-2 rounded-lg text-sm font-bold bg-[#D4AF37] text-slate-950 hover:bg-[#c4a030] transition">{open ? "✕" : "+ Add Employee"}</button>
          </div>
        </div>
        {open && (
          <Card className="p-5">
            <p className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest mb-4">New Employee</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Input label="Full Name *"  value={f.name}       onChange={(e: any) => setF(p => ({ ...p, name: e.target.value }))} />
              <Input label="Role/Title"   value={f.role}       onChange={(e: any) => setF(p => ({ ...p, role: e.target.value }))} />
              <Select label="Department" value={f.department}  onChange={(e: any) => setF(p => ({ ...p, department: e.target.value }))} options={["Production", "R&D", "QC", "Procurement", "Finance", "HR", "Sales", "Admin"]} />
              <Input label="Salary (OMR)" type="number" value={f.salary} onChange={(e: any) => setF(p => ({ ...p, salary: e.target.value }))} />
              <Input label="Join Date"   type="date"   value={f.joinDate} onChange={(e: any) => setF(p => ({ ...p, joinDate: e.target.value }))} />
              <Select label="Status"     value={f.status}      onChange={(e: any) => setF(p => ({ ...p, status: e.target.value }))} options={["Active", "On Leave", "Terminated"]} />
            </div>
            <div className="flex justify-end mt-4 gap-2">
              <button onClick={() => setOpen(false)} className="px-5 py-2 text-slate-400 text-sm font-bold">Cancel</button>
              <button onClick={save} disabled={!f.name} className="px-6 py-2 bg-[#D4AF37] text-slate-950 rounded-lg font-bold text-sm disabled:opacity-40">Save</button>
            </div>
          </Card>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="Total Staff"   value={employees.length} />
          <Stat label="Active"        value={employees.filter(e => e.status === "Active").length}   color="text-green-400" />
          <Stat label="Total Payroll" value={`OMR ${employees.reduce((s, e) => s + (+e.salary || 0), 0).toLocaleString()}`} color="text-blue-400" />
          <Stat label="Departments"   value={depts.length}     color="text-purple-400" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {depts.map(d => (
            <Card key={d} className="p-3 text-center">
              <p className="text-[10px] text-slate-500 uppercase font-bold">{d}</p>
              <p className="text-xl font-bold text-white mt-1">{employees.filter(e => e.department === d).length}</p>
            </Card>
          ))}
        </div>
        <Card className="overflow-x-auto">
          <table className="w-full text-left min-w-[640px]">
            <thead className="border-b border-white/10 bg-slate-900">
              {["Employee", "Role", "Department", "Salary (OMR)", "Join Date", "Status", "Del"].map(h =>
                <th key={h} className="px-3 py-3 text-[10px] text-slate-400 uppercase font-bold whitespace-nowrap">{h}</th>
              )}
            </thead>
            <tbody className="divide-y divide-white/5">
              {employees.map(e => (
                <tr key={e.id} className="hover:bg-white/5 transition">
                  <td className="px-3 py-3 text-sm font-bold text-white">{e.name}</td>
                  <td className="px-3 py-3 text-xs text-slate-300">{e.role}</td>
                  <td className="px-3 py-3"><Badge label={e.department} /></td>
                  <td className="px-3 py-3 text-sm font-mono font-bold text-[#D4AF37]">{(+e.salary || 0).toLocaleString()}</td>
                  <td className="px-3 py-3 text-xs text-slate-400">{e.joinDate}</td>
                  <td className="px-3 py-3"><Badge label={e.status} /></td>
                  <td className="px-3 py-3"><button onClick={() => del(e.id)} className="text-[10px] text-red-500 hover:text-red-400 font-bold px-2 py-1 rounded border border-red-500/20 hover:bg-red-500/10 transition">Del</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    );
  };

  // ── R&D LAB ────────────────────────────────────────────────────────────────
  const RDLab = () => {
    const [active, setActive]   = useState<RDProject>(rdProjects[0]);
    const [aiOut,  setAiOut]    = useState("");
    const [aiLoad, setAiLoad]   = useState(false);
    const [newIng, setNewIng]   = useState({ name: "", quantity: 0, unit: "Kg", rateUSD: 0, role: "API" });
    const [addIng, setAddIng]   = useState(false);

    const proj = rdProjects.find(p => p.id === active?.id) || rdProjects[0];
    const calc  = proj ? calcRD(proj) : null;

    const addIngredient = () => {
      const updated = calcRD({ ...proj, ingredients: [...(proj.ingredients || []), { ...newIng, sNo: String((proj.ingredients?.length || 0) + 1), quantity: +newIng.quantity, rateUSD: +newIng.rateUSD }] });
      setRdProjects(p => p.map(x => x.id === proj.id ? updated : x));
      setActive(updated);
      setAddIng(false);
      setNewIng({ name: "", quantity: 0, unit: "Kg", rateUSD: 0, role: "API" });
    };

    const runAIAnalysis = async () => {
      setAiLoad(true); setAiOut("");
      try {
        const res = await optimizeFormulation(proj);
        setAiOut(res.suggestion || JSON.stringify(res));
      } catch {
        setAiOut("AI analysis failed. Check Gemini API key in Settings.");
      }
      setAiLoad(false);
    };

    return (
      <div className="space-y-5">
        <h2 className="text-xl font-bold text-white">🔬 R&D Lab — Formulation Costing</h2>

        <div className="flex gap-3 flex-wrap">
          {rdProjects.map(p => (
            <button key={p.id} onClick={() => setActive(p)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition ${active?.id === p.id ? "bg-[#D4AF37] text-slate-950" : "bg-slate-800 text-slate-400 hover:text-white"}`}>
              {p.title.slice(0, 25)}… <Badge label={p.status} />
            </button>
          ))}
        </div>

        {calc && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Stat label="Batch Size"   value={`${calc.batchSize} ${calc.batchUnit}`} />
              <Stat label="Total RMC"    value={`$${calc.totalRMC}`}      color="text-yellow-400" />
              <Stat label="Loss Factor"  value={calc.loss}                color="text-red-400" />
              <Stat label="Final RMC/kg" value={`$${calc.totalFinalRMC}`} color="text-green-400" sub="per kg output" />
            </div>

            <Card className="overflow-x-auto">
              <div className="p-4 border-b border-white/10 flex justify-between items-center flex-wrap gap-3">
                <h3 className="font-bold text-white text-sm">Formulation Ingredients</h3>
                <div className="flex gap-2">
                  <button onClick={() => setAddIng(s => !s)} className="px-3 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300 rounded-lg transition">{addIng ? "✕" : "+ Add"}</button>
                  <button onClick={runAIAnalysis} disabled={aiLoad} className="px-4 py-2 text-xs font-bold bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] rounded-lg transition disabled:opacity-50">
                    {aiLoad ? "🤖 Analyzing…" : "🤖 AI Optimize"}
                  </button>
                </div>
              </div>
              {addIng && (
                <div className="p-4 bg-slate-900/50 border-b border-white/5">
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <Input label="Name *"     value={newIng.name}     onChange={(e: any) => setNewIng(p => ({ ...p, name: e.target.value }))} />
                    <Input label="Qty"        type="number" value={newIng.quantity} onChange={(e: any) => setNewIng(p => ({ ...p, quantity: e.target.value }))} />
                    <Select label="Unit"      value={newIng.unit}     onChange={(e: any) => setNewIng(p => ({ ...p, unit: e.target.value }))} options={["Kg", "g", "L", "mL"]} />
                    <Input label="Rate USD"   type="number" value={newIng.rateUSD}  onChange={(e: any) => setNewIng(p => ({ ...p, rateUSD: e.target.value }))} />
                    <Select label="Role"      value={newIng.role}     onChange={(e: any) => setNewIng(p => ({ ...p, role: e.target.value }))} options={["API", "Filler", "Binder", "Coating", "Lubricant", "Plasticizer", "Surfactant", "Excipient"]} />
                  </div>
                  <div className="flex justify-end mt-3">
                    <button onClick={addIngredient} disabled={!newIng.name} className="px-5 py-2 bg-[#D4AF37] text-slate-950 rounded-lg font-bold text-sm disabled:opacity-40">Add Ingredient</button>
                  </div>
                </div>
              )}
              <table className="w-full text-left min-w-[640px]">
                <thead className="border-b border-white/10 bg-slate-900">
                  {["S.No", "Raw Material", "Per B. Qty", "Unit", "Rate USD", "Cost USD", "Role"].map(h =>
                    <th key={h} className="px-3 py-3 text-[10px] text-slate-400 uppercase font-bold whitespace-nowrap">{h}</th>
                  )}
                </thead>
                <tbody className="divide-y divide-white/5">
                  {calc.ingredients.map((i, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition">
                      <td className="px-3 py-3 text-xs text-slate-500">{i.sNo}</td>
                      <td className="px-3 py-3 text-sm font-bold text-white">{i.name}</td>
                      <td className="px-3 py-3 text-sm font-mono">{i.quantity}</td>
                      <td className="px-3 py-3 text-xs text-slate-400">{i.unit}</td>
                      <td className="px-3 py-3 text-sm font-mono text-slate-300">${i.rateUSD}</td>
                      <td className="px-3 py-3 text-sm font-mono font-bold text-[#D4AF37]">${i.cost?.toFixed(2)}</td>
                      <td className="px-3 py-3"><Badge label={i.role} /></td>
                    </tr>
                  ))}
                  <tr className="bg-slate-900/80">
                    <td colSpan={5} className="px-3 py-3 text-xs text-right font-bold text-slate-400 uppercase">Total RMC</td>
                    <td className="px-3 py-3 text-sm font-mono font-bold text-green-400">${calc.totalRMC}</td>
                    <td></td>
                  </tr>
                  <tr className="bg-slate-900/80">
                    <td colSpan={5} className="px-3 py-3 text-xs text-right font-bold text-slate-400 uppercase">Total Final RMC/kg</td>
                    <td className="px-3 py-3 text-sm font-mono font-bold text-[#D4AF37]">${calc.totalFinalRMC}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </Card>

            {aiOut && (
              <Card className="p-5">
                <p className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest mb-3">🤖 AI Optimization Analysis</p>
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{aiOut}</p>
              </Card>
            )}
          </>
        )}
      </div>
    );
  };

  // ── BUSINESS DEVELOPMENT ──────────────────────────────────────────────────
  const BD = () => {
    const markets = ["UAE 🇦🇪", "Kuwait 🇰🇼", "Pakistan 🇵🇰", "Saudi Arabia 🇸🇦", "Qatar 🇶🇦", "Oman 🇴🇲", "Jordan 🇯🇴", "Egypt 🇪🇬", "Iraq 🇮🇶"];
    const pipeline = [
      { id: "BD-1", market: "GCC - Kuwait", opportunity: "Anti-ulcer Pellets supply agreement", value: "$1.2M", probability: 70, status: "Negotiation" },
      { id: "BD-2", market: "UAE - MoH",    opportunity: "Lansoprazole DR Pellets registration", value: "$850K", probability: 45, status: "Dossier Prep" },
      { id: "BD-3", market: "Saudi Arabia", opportunity: "Esomeprazole capsule formulation deal", value: "$2.1M", probability: 30, status: "Initial Contact" },
    ];
    return (
      <div className="space-y-5">
        <h2 className="text-xl font-bold text-white">🌍 Business Development</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {["Negotiation", "Dossier Prep", "Initial Contact"].map(s => (
            <Stat key={s} label={s} value={pipeline.filter(p => p.status === s).length} />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {pipeline.map(p => (
            <Card key={p.id} className="p-5">
              <div className="flex justify-between items-start mb-3">
                <p className="font-bold text-white text-sm">{p.market}</p>
                <Badge label={p.status} />
              </div>
              <p className="text-xs text-slate-400 mb-3">{p.opportunity}</p>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-500">Pipeline Value</span>
                <span className="text-sm font-bold font-mono text-green-400">{p.value}</span>
              </div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-slate-500">Probability</span>
                <span className="text-xs font-bold text-[#D4AF37]">{p.probability}%</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${p.probability}%`, background: "linear-gradient(90deg,#F4C430,#D4AF37)" }} />
              </div>
            </Card>
          ))}
        </div>
        <Card className="p-5">
          <p className="text-sm font-bold text-white mb-3">Active Markets</p>
          <div className="flex flex-wrap gap-2">
            {markets.map(m => (
              <span key={m} className="px-3 py-1.5 bg-slate-800 border border-[#D4AF37]/20 text-slate-300 text-xs font-bold rounded-lg">{m}</span>
            ))}
          </div>
        </Card>
      </div>
    );
  };

  // ── AI COMMAND CENTER ──────────────────────────────────────────────────────
  const AICommand = () => {
    const [msgs, setMsgs]     = useState<ChatMessage[]>([{ role: "assistant", text: "👋 Hello! I'm your AI-COO. I have full visibility of your operations. Ask me anything about Al Wajer Pharmaceuticals." }]);
    const [input, setInput]   = useState("");
    const [loading, setLoad]  = useState(false);
    const endRef               = useRef<HTMLDivElement>(null);

    const contextSummary = `Current Ops Summary:
- Batches: ${batches.length} total, ${batches.filter(b => b.status === "In-Progress").length} in progress, avg yield ${batches.length ? (batches.reduce((s,b) => s+(+b.actualYield),0)/batches.length).toFixed(1) : 0}%
- Inventory: ${inventory.length} items, ${inventory.filter(i => (+i.balanceToPurchase) > 0).length} shortages
- Orders: ${orders.length} total, ${orders.filter(o => o.status === "Pending").length} pending, $${orders.reduce((s,o) => s+(+o.amountUSD||0),0).toLocaleString()} revenue
- Staff: ${employees.length} employees, OMR ${employees.reduce((s,e)=>s+(+e.salary||0),0).toLocaleString()} payroll
- Expenses: OMR ${expenses.reduce((s,e)=>s+(+e.amount||0),0).toLocaleString()} total, ${expenses.filter(e=>e.status==="Pending").length} pending`;

    const send = async (msg = input) => {
      if (!msg.trim() || loading) return;
      const userMsg = { role: "user", text: msg };
      setMsgs(p => [...p, userMsg]);
      setInput(""); setLoad(true);
      try {
        const reply = await chatWithCOO(`${contextSummary}\n\nUser question: ${msg}`, msgs);
        setMsgs(p => [...p, { role: "assistant", text: reply || "No response." }]);
      } catch {
        setMsgs(p => [...p, { role: "assistant", text: "⚠️ AI unavailable. Check Gemini API key in Settings." }]);
      }
      setLoad(false);
    };

    useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

    const quickPrompts = [
      "Give me a daily operations brief",
      "What inventory shortages need urgent attention?",
      "Analyze our pending order pipeline",
      "What are our top 3 operational risks?",
      "Summarize our financial position",
    ];

    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">🤖 AI Command Center</h2>
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map(p => (
            <button key={p} onClick={() => send(p)} disabled={loading}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-400 hover:text-white text-xs font-bold rounded-lg transition disabled:opacity-40">
              {p}
            </button>
          ))}
        </div>
        <Card className="flex flex-col h-[500px]">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {msgs.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${m.role === "assistant" ? "bg-[#D4AF37]/20 text-[#D4AF37]" : "bg-blue-500/20 text-blue-400"}`}>
                  {m.role === "assistant" ? "AI" : "U"}
                </div>
                <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${m.role === "assistant" ? "bg-slate-800 text-slate-200" : "text-white"}`}
                  style={m.role === "user" ? { background: "linear-gradient(135deg,#F4C430,#D4AF37)", color: "#0f172a" } : {}}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-[#D4AF37]/20 text-[#D4AF37]">AI</div>
                <div className="px-4 py-3 bg-slate-800 rounded-2xl">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-[#D4AF37] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
          <div className="p-4 border-t border-white/10 flex gap-2">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
              placeholder="Ask your AI-COO anything…"
              className="flex-1 bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#D4AF37] focus:outline-none transition" />
            <button onClick={() => send()} disabled={!input.trim() || loading}
              className="px-5 py-3 rounded-xl font-bold text-sm text-slate-950 disabled:opacity-40 transition"
              style={{ background: "linear-gradient(135deg,#F4C430,#D4AF37)" }}>→</button>
          </div>
        </Card>
      </div>
    );
  };

  // ── AUDIT LOG ──────────────────────────────────────────────────────────────
  const AuditLog = () => (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">📋 Audit Log</h2>
        <div className="flex gap-2">
          <button onClick={() => exportToCSV(audit, "audit_log")} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300 rounded-lg text-xs font-bold transition">⬇ Export CSV</button>
          <span className="text-xs text-slate-500 self-center">{audit.length} entries</span>
        </div>
      </div>
      <Card>
        <div className="divide-y divide-white/5">
          {audit.map(l => (
            <div key={l.id} className="p-3 flex items-start gap-4 hover:bg-white/5 transition">
              <span className={`text-[10px] font-bold px-2 py-1 rounded border shrink-0 mt-0.5 ${
                l.action === "CREATE"    ? "text-green-400 border-green-400/30 bg-green-400/10" :
                l.action === "DELETE"    ? "text-red-400 border-red-400/30 bg-red-400/10" :
                l.action === "AI_IMPORT" ? "text-purple-400 border-purple-400/30 bg-purple-400/10" :
                l.action === "UPDATE"    ? "text-blue-400 border-blue-400/30 bg-blue-400/10" :
                "text-slate-400 border-slate-400/30 bg-slate-400/10"}`}>{l.action}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white">{l.details}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{l.user} · {new Date(l.timestamp).toLocaleString()}</p>
              </div>
            </div>
          ))}
          {!audit.length && <div className="p-10 text-center text-slate-500">No audit entries yet</div>}
        </div>
      </Card>
    </div>
  );

  // ── ROUTER ─────────────────────────────────────────────────────────────────
  const pages: Record<string, React.ReactNode> = {
    dashboard:   <Dashboard />,
    production:  <Production />,
    inventory:   <Inventory />,
    sales:       <Sales />,
    procurement: <Procurement />,
    accounting:  <Accounting />,
    hr:          <HR />,
    rd:          <RDLab />,
    bd:          <BD />,
    ai:          <AICommand />,
    history:     <AuditLog />,
  };

  return (
    <div className="min-h-screen w-full flex bg-[#020617] text-slate-200" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{`
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #D4AF37; border-radius: 3px; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .fade { animation: fadeIn 0.18s ease; }
        @keyframes bounceDot { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        .animate-bounce { animation: bounceDot 1s infinite; }
      `}</style>

      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-60 bg-slate-950 border-r border-[#D4AF37]/20 flex flex-col transition-transform duration-300 ease-in-out ${nav ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="p-5 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center font-black text-slate-950 text-sm shadow-lg shadow-[#D4AF37]/30" style={{ background: "linear-gradient(135deg,#F4C430,#D4AF37)" }}>AW</div>
            <div>
              <h1 className="font-black text-white text-sm tracking-tight">AL WAJER</h1>
              <p className="text-[9px] font-bold text-[#D4AF37] tracking-[0.22em] uppercase">Pharma ERP v3</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {NAV.map(n => (
            <button key={n.id} onClick={() => { setTab(n.id); setNav(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${tab === n.id ? "text-slate-950 font-bold shadow-md" : "text-slate-500 hover:bg-white/5 hover:text-slate-200"}`}
              style={tab === n.id ? { background: "linear-gradient(135deg,#F4C430,#D4AF37)" } : {}}>
              <span className="text-base">{n.emoji}</span>
              <span>{n.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-white/5 shrink-0 space-y-2">
          <button onClick={() => setShowSettings(true)} className="w-full flex items-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 rounded-lg text-[10px] font-bold text-slate-400 hover:text-white transition">
            ⚙️ <span>Settings & Config</span>
          </button>
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 rounded-lg">
            <div className={`w-2 h-2 rounded-full ${dbLive ? "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.8)]" : "bg-yellow-400 shadow-[0_0_6px_rgba(250,204,21,0.8)]"}`} />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{dbLive ? "Supabase Live" : "Local Mode"}</span>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {nav && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setNav(false)} />}

      {/* MAIN */}
      <div className="flex-1 flex flex-col lg:ml-60 min-h-screen">
        <header className="sticky top-0 h-14 bg-slate-950/90 backdrop-blur-md border-b border-white/5 px-4 sm:px-6 flex items-center gap-3 z-30 shrink-0">
          <button onClick={() => setNav(s => !s)} className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition -ml-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-white text-sm sm:text-base truncate">
              {NAV.find(n => n.id === tab)?.emoji} {NAV.find(n => n.id === tab)?.label}
            </h2>
          </div>
          <button onClick={() => setShowSettings(true)} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition" title="Settings">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
          <span className="text-[10px] text-slate-500 font-bold hidden sm:block whitespace-nowrap">
            {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
          </span>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 fade" key={tab}>
            {pages[tab] || <div className="text-slate-500 text-center py-20">Coming soon</div>}
          </div>
        </main>
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} dbLive={dbLive} />}
    </div>
  );
}
