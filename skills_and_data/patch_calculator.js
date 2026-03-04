const fs = require('fs');
const filePath = 'c:/Users/User/New erp/Alwajer-Pharma-erp/App.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add Calculator States
const stateInsert = "const [samples, setSamples] = useState<SampleStatus[]>(INITIAL_SAMPLES);";
const newState = `
  const [calcData, setCalcData] = useState({ product: '', volume: 0, targetPrice: 0, rmc: 0, labor: 0, packing: 0 });
  const [calcResults, setCalcResults] = useState<any>(null);`;

if (content.includes(stateInsert)) {
    content = content.replace(stateInsert, stateInsert + newState);
    console.log('Added states.');
}

// 2. Add renderCalculator function
const renderCalc = `
  const renderCalculator = () => {
    const calculateMargins = () => {
      const totalCostPerUnit = Number(calcData.rmc) + Number(calcData.labor) + Number(calcData.packing);
      const totalCostBase = totalCostPerUnit * Number(calcData.volume);
      const totalRevenue = Number(calcData.targetPrice) * Number(calcData.volume);
      const profit = totalRevenue - totalCostBase;
      const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
      
      setCalcResults({
        totalCostPerUnit,
        totalCostBase,
        totalRevenue,
        profit,
        margin: margin.toFixed(2)
      });
    };

    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Calculator className="text-[#F4C430]" size={20} /> Sales vs Cost Calculator
            </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-slate-900/50 border border-[#D4AF37]/30 rounded-xl p-6 gold-glow">
                <h3 className="text-sm font-bold text-[#D4AF37] uppercase mb-4">Input Parameters</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Product to Manufacture</label>
                        <input type="text" value={calcData.product} onChange={e => setCalcData({...calcData, product: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded p-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none" placeholder="e.g. Esomeprazole 40mg"/>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Volume (KG)</label>
                            <input type="number" value={calcData.volume} onChange={e => setCalcData({...calcData, volume: Number(e.target.value)})} className="w-full bg-slate-950 border border-white/10 rounded p-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"/>
                        </div>
                        <div>
                            <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Target Price ($)</label>
                            <input type="number" value={calcData.targetPrice} onChange={e => setCalcData({...calcData, targetPrice: Number(e.target.value)})} className="w-full bg-slate-950 border border-white/10 rounded p-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"/>
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Raw Material Cost (RMC/Unit)</label>
                        <input type="number" value={calcData.rmc} onChange={e => setCalcData({...calcData, rmc: Number(e.target.value)})} className="w-full bg-slate-950 border border-white/10 rounded p-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"/>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Labor Cost</label>
                            <input type="number" value={calcData.labor} onChange={e => setCalcData({...calcData, labor: Number(e.target.value)})} className="w-full bg-slate-950 border border-white/10 rounded p-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"/>
                        </div>
                        <div>
                            <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Packing Material</label>
                            <input type="number" value={calcData.packing} onChange={e => setCalcData({...calcData, packing: Number(e.target.value)})} className="w-full bg-slate-950 border border-white/10 rounded p-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"/>
                        </div>
                    </div>
                    <button onClick={calculateMargins} className="w-full luxury-gradient py-3 rounded-lg text-slate-950 font-bold shadow-lg shadow-[#D4AF37]/20 mt-4">Analyze Feasibility</button>
                </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
                {calcResults ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-slate-900/50 border border-white/5 p-4 rounded-xl">
                                <p className="text-[10px] text-slate-500 uppercase font-bold">Total Cost / Unit</p>
                                <p className="text-2xl font-bold text-white font-mono">$ {calcResults.totalCostPerUnit.toFixed(3)}</p>
                            </div>
                            <div className="bg-slate-900/50 border border-white/5 p-4 rounded-xl">
                                <p className="text-[10px] text-slate-500 uppercase font-bold">Total Order Val</p>
                                <p className="text-2xl font-bold text-[#D4AF37] font-mono">$ {calcResults.totalRevenue.toLocaleString()}</p>
                            </div>
                            <div className="bg-slate-900/50 border border-[#D4AF37]/30 p-4 rounded-xl">
                                <p className="text-[10px] text-slate-500 uppercase font-bold">Est. Net Profit</p>
                                <p className="text-2xl font-bold text-green-400 font-mono">$ {calcResults.profit.toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="bg-slate-900/50 border border-[#D4AF37]/30 rounded-xl p-8 gold-glow flex flex-col items-center justify-center text-center">
                             <div className="relative w-48 h-48 flex items-center justify-center mb-6">
                                 <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
                                 <div className="absolute inset-0 border-4 border-[#D4AF37] rounded-full" style={{clipPath: \`inset(0 \${100 - Number(calcResults.margin)}% 0 0)\`}}></div>
                                 <div className="z-10 bg-slate-950/40 backdrop-blur-md p-6 rounded-full border border-white/5">
                                     <p className="text-4xl font-bold text-white font-mono">{calcResults.margin}%</p>
                                     <p className="text-[10px] text-slate-500 uppercase font-bold">Gross Margin</p>
                                 </div>
                             </div>
                             <h4 className="text-xl font-bold text-white mb-2">{Number(calcResults.margin) > 20 ? 'Highly Profitable Project' : 'Low Margin Project'}</h4>
                             <p className="text-sm text-slate-500 max-w-sm mb-6">This project yields a {calcResults.margin}% margin based on current raw material and labor costs.</p>
                             <button 
                                onClick={() => downloadContent(\`QUOTATION FOR \${calcData.product.toUpperCase()}\\n\\nVolume: \${calcData.volume} KG\\nUnit Price: $ \${calcData.targetPrice}\\nTotal Value: $ \${calcResults.totalRevenue.toLocaleString()}\\nExpected Margin: \${calcResults.margin}%\\n\\nValid for: 7 Days\`, 'quotation.txt', 'text')}
                                className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#c4a030] text-slate-950 px-6 py-2 rounded-lg font-bold transition-all"
                             >
                                 <FileText size={16}/> Generate Quotation
                             </button>
                        </div>
                    </>
                ) : (
                    <div className="h-full min-h-[400px] bg-slate-900/50 border border-white/10 rounded-xl flex flex-col items-center justify-center text-slate-600 border-dashed">
                        <Calculator size={48} className="mb-4 opacity-20"/>
                        <p className="font-bold">Input parameters and click Analyze to calculate margins</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    );
  };
`;

const insertionPoint = content.indexOf('const renderAIOps = () =>');
if (insertionPoint > -1) {
    content = content.substring(0, insertionPoint) + renderCalc + "\n\n  " + content.substring(insertionPoint);
    console.log('Injected renderCalculator.');
}

// 3. Add to navigation (Sidebar)
content = content.replace(
    "{ id: 'samples', label: 'Sample Status', icon: PackageSearch },",
    "{ id: 'samples', label: 'Sample Status', icon: PackageSearch },\n              { id: 'costing', label: 'Sales vs Cost', icon: Calculator },"
);

// 4. Add to Mobile Sidebar
content = content.replace(
    "{id:'samples',label:'Sample Status',icon:PackageSearch}",
    "{id:'samples',label:'Sample Status',icon:PackageSearch},{id:'costing',label:'Sales vs Cost',icon:Calculator}"
);

// 5. Add to Tab switch
content = content.replace(
    "{activeTab === 'samples' && renderSamples()}",
    "{activeTab === 'samples' && renderSamples()}\n          {activeTab === 'costing' && renderCalculator()}"
);

fs.writeFileSync(filePath, content);
console.log('Calculator integrated.');
