def p(path, pairs, label):
    try:
        src = open(path, encoding='utf-8').read()
        n = 0
        for old, new in pairs:
            if old in src: src = src.replace(old, new, 1); n += 1
            else: print(f'  skip [{label}]: {repr(old[:50])}')
        open(path, 'w', encoding='utf-8').write(src)
        print(f'OK {label} ({n}/{len(pairs)})')
    except Exception as e: print(f'FAIL {label}: {e}')

p('src/components/windows/Dashboard.tsx',[
("const COLORS = ['#4f46e5', '#8b5cf6', '#0ea5e9', '#10b981', '#f43f5e', '#eab308'];","const COLORS = ['#D4AF37', '#C0C0C0', '#CD7F32', '#94A3B8', '#B8860B', '#64748B'];"),
('<Bar dataKey="value" fill="#4f46e5" radius={[3, 3, 0, 0]}/>','<Bar dataKey="value" fill="#CD7F32" radius={[3, 3, 0, 0]}/>')
],'Dashboard colors')

p('src/App.tsx',[
("import type { RDProject, ChatSession } from '@/types';","import type { RDProject, ChatSession, COOInsight } from '@/types';"),
('const App: React.FC = () => {','''function generateLocalInsights(batches,inventory,orders,expenses){const out=[];const ly=batches.filter(b=>Math.abs(b.actualYield-b.expectedYield)>2);if(ly.length)out.push({type:'Production',severity:'critical',message:`${ly.length} batch(es) yield deviation >2%: ${ly.map(b=>b.id).join(', ')}.`});const sh=inventory.filter(i=>i.balanceToPurchase&&i.balanceToPurchase>0);if(sh.length)out.push({type:'Inventory',severity:sh.length>=3?'critical':'warning',message:`${sh.length} material(s) need procurement: ${sh.slice(0,3).map(i=>i.name).join(', ')}.`});const pe=expenses.filter(e=>e.status==='Pending');const pt=pe.reduce((s,e)=>s+e.amount,0);if(pt>0)out.push({type:'Finance',severity:pt>50000?'critical':'warning',message:`${pe.length} payment(s) outstanding $${pt.toLocaleString()}.`});const po=orders.filter(o=>o.status==='Pending');if(po.length){const v=po.reduce((s,o)=>s+(Number(o.amountUSD)||0),0);out.push({type:'Sales',severity:'info',message:`${po.length} order(s) pending — $${v.toLocaleString()}.`});}if(!out.length)out.push({type:'Production',severity:'info',message:'All systems nominal.'});return out;}\nconst App: React.FC = () => {'''),
("""  const handleQuickScan = useCallback(async () => {
    setIsScanning(true);
    try {
      const results = await analyzeOperations(
        state.batches, state.inventory, state.orders,
        state.expenses, state.employees,
        { claudeKey: state.apiConfig.claudeKey }
      );
      state.setInsights(results);
    } catch {/* ignore */} finally {
      setIsScanning(false);
    }
  }, [state]);""","""  const handleQuickScan = useCallback(async () => {
    setIsScanning(true);
    try {
      if (state.apiConfig.claudeKey) {
        const results = await analyzeOperations(state.batches, state.inventory, state.orders, state.expenses, state.employees, { claudeKey: state.apiConfig.claudeKey });
        if (results && results.length > 0) { state.setInsights(results); return; }
      }
      state.setInsights(generateLocalInsights(state.batches, state.inventory, state.orders, state.expenses));
    } catch { state.setInsights(generateLocalInsights(state.batches, state.inventory, state.orders, state.expenses)); }
    finally { setIsScanning(false); }
  }, [state]);""")
],'App.tsx scan fallback')

p('src/components/windows/Sales.tsx',[
("import { BadgeDollarSign, Plus, Edit2, Trash2, Download, FileText, Package, ReceiptText, Eye, X, Search } from 'lucide-react';","import { BadgeDollarSign, Plus, Edit2, Trash2, Download, FileText, Package, ReceiptText, Eye, X, Search, Upload } from 'lucide-react';"),
("import { exportToCSV } from '@/services/export';","import { exportToCSV } from '@/services/export';\nimport { FileImporter } from '@/components/shared/FileImporter';"),
("  const [showQuotForm, setShowQuotForm] = useState(false);","  const [showQuotForm, setShowQuotForm] = useState(false);\n  const [showImporter, setShowImporter] = useState(false);"),
('          <button onClick={() => exportToCSV(orders as unknown as Record<string, unknown>[], \'sales\')} className="erp-btn-ghost">','          <button onClick={() => setShowImporter(p => !p)} className="erp-btn-ghost"><Upload size={13}/> Import CSV</button>\n          <button onClick={() => exportToCSV(orders as unknown as Record<string, unknown>[], \'sales\')} className="erp-btn-ghost">'),
("      {/* Main area: table + detail panel */}","""      {showImporter && (<FileImporter title="Import Sales Orders" onClose={() => setShowImporter(false)} fieldMappings={[{erpField:'invoiceNo',label:'Invoice No',aliases:['invoice','inv no']},{erpField:'date',label:'Date',aliases:['date']},{erpField:'customer',label:'Customer',aliases:['customer','buyer','client'],required:true},{erpField:'country',label:'Country',aliases:['country']},{erpField:'product',label:'Product',aliases:['product','item'],required:true},{erpField:'quantity',label:'Qty (Kg)',aliases:['quantity','qty','kg'],required:true},{erpField:'rateUSD',label:'Rate USD/Kg',aliases:['rate','price','usd'],required:true},{erpField:'status',label:'Status',aliases:['status']},{erpField:'paymentTerms',label:'Payment Terms',aliases:['payment','terms']},{erpField:'lcNo',label:'LC/PO No',aliases:['lc','po','reference']}]} onImport={rows=>{rows.forEach(row=>{const qty=Number(row.quantity)||0;const rate=Number(row.rateUSD)||0;onOpenModal('add','sales',{id:`ORD-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,sNo:'',lcNo:String(row.lcNo||''),materialDispatched:'',amountUSD:Number((qty*rate).toFixed(2)),amountOMR:Number((qty*rate*0.3845).toFixed(3)),...row});});setShowImporter(false);}}/>)}
      {/* Main area: table + detail panel */}""")
],'Sales.tsx importer')

p('src/components/windows/Procurement.tsx',[
("import { Truck, Plus, Edit2, Trash2, AlertTriangle, BadgeDollarSign, Globe, Star, UserPlus, X, Printer } from 'lucide-react';","import { Truck, Plus, Edit2, Trash2, AlertTriangle, BadgeDollarSign, Globe, Star, UserPlus, X, Printer, Upload } from 'lucide-react';"),
("import type { InventoryItem, Vendor, ModalState, ApiConfig } from '@/types';","import type { InventoryItem, Vendor, ModalState, ApiConfig } from '@/types';\nimport { FileImporter } from '@/components/shared/FileImporter';"),
("  const [isPOOpen, setIsPOOpen] = useState(false);","  const [isPOOpen, setIsPOOpen] = useState(false);\n  const [showVendorImporter, setShowVendorImporter] = useState(false);"),
('          <button onClick={() => setIsPOOpen(true)} className="bg-[#D4AF37] hover:bg-[#c4a030] text-slate-950 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">','          <button onClick={() => setShowVendorImporter(p => !p)} className="erp-btn-ghost"><Upload size={13}/> Import Vendors</button>\n          <button onClick={() => setIsPOOpen(true)} className="bg-[#D4AF37] hover:bg-[#c4a030] text-slate-950 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">'),
('      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">',"""      {showVendorImporter && (<FileImporter title="Import Vendors from CSV" onClose={() => setShowVendorImporter(false)} fieldMappings={[{erpField:'name',label:'Vendor Name',aliases:['name','vendor','supplier'],required:true},{erpField:'country',label:'Country',aliases:['country','origin']},{erpField:'category',label:'Category',aliases:['category','type']},{erpField:'rating',label:'Rating',aliases:['rating','score']},{erpField:'status',label:'Status',aliases:['status']}]} onImport={rows=>{rows.forEach(row=>onOpenModal('add','vendors',{id:`V-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,rating:Number(row.rating)||3,status:String(row.status||'Audit Pending'),...row}));setShowVendorImporter(false);}}/>)}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">""")
],'Procurement.tsx importer')

print('\nDone. Run: npm run build')
