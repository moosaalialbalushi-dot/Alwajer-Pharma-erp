const fs = require('fs');
const file = 'c:/Users/User/New erp/Alwajer-Pharma-erp/App.tsx';
let txt = fs.readFileSync(file, 'utf8');

// 1. Patch renderSales
const matchRenderSales = txt.indexOf('const renderSales = () => (');
const endRenderSales = txt.indexOf('const renderProcurement', matchRenderSales);

if (matchRenderSales > -1 && endRenderSales > -1) {
    const oldRenderSales = txt.substring(matchRenderSales, endRenderSales);
    const newRenderSales = `const renderSales = () => {
    const groupedOrders = orders.reduce((acc, order) => {
      const inv = order.invoiceNo || 'Draft';
      if (!acc[inv]) acc[inv] = [];
      acc[inv].push(order);
      return acc;
    }, {});

    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BadgeDollarSign className="text-[#F4C430]" size={20} /> Sales & Orders
            </h2>
            <div className="flex gap-2">
              <button onClick={() => exportToCSV(orders, 'sales_report')} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                <Download size={14}/> Export
              </button>
              <button onClick={() => openModal("add", "sales", {id: \`ORD-\${Date.now()}\`, invoiceNo: "", date: new Date().toISOString().split("T")[0], customer: "", country: "", product: "", quantity: 0, rateUSD: 0, amountUSD: 0, amountOMR: 0, status: "Pending", paymentMethod: "LC at Sight", shippingMethod: "By Sea"})} className="bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37] px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-all">
                <Plus size={16} /> Update Orders
              </button>
            </div>
        </div>
        <div className="space-y-4">
            {Object.entries(groupedOrders).map(([inv, invOrders]) => {
                const arr = invOrders;
                const totalUSD = arr.reduce((sum, o) => sum + (Number(o.amountUSD) || 0), 0);
                const totalOMR = arr.reduce((sum, o) => sum + (Number(o.amountOMR) || 0), 0);
                const first = arr[0];

                return (
                  <div key={inv} className="bg-slate-900/50 border border-[#D4AF37]/30 rounded-xl p-0 gold-glow overflow-hidden">
                    <div className="bg-slate-950/50 border-b border-white/5 p-4 flex flex-wrap justify-between items-center gap-4">
                        <div>
                            <span className="text-lg font-bold text-[#D4AF37]">{inv}</span>
                            <span className="ml-3 text-xs text-slate-500 font-mono">{first.date}</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right flex items-center gap-3">
                                <p className="text-[10px] text-slate-400 uppercase font-bold">Total Val</p>
                                <p className="text-sm font-bold text-white">$\${totalUSD.toLocaleString()} / OMR \${Number(totalOMR).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-0">
                        <table className="w-full text-left">
                           <tbody className="divide-y divide-white/5">
                             {arr.map(order => (
                               <tr key={order.id} className="hover:bg-white/5 group bg-slate-900/40">
                                 <td className="p-4 pr-4">
                                   <div className="font-bold text-white text-sm">{order.customer}</div>
                                   <div className="text-[10px] text-slate-500">{order.country}</div>
                                 </td>
                                 <td className="p-4 px-4 w-1/3">
                                   <div className="text-sm text-slate-300">{order.product}</div>
                                   <div className="text-xs font-bold text-white font-mono">{Number(order.quantity).toLocaleString()} KG</div>
                                 </td>
                                 <td className="p-4 px-4 text-xs font-mono text-[#D4AF37]">
                                   $\${order.rateUSD || 0}/KG
                                 </td>
                                 <td className="p-4 px-4 text-right">
                                   <div className="text-sm font-bold text-white font-mono">$\${Number(order.amountUSD).toLocaleString()}</div>
                                 </td>
                                 <td className="p-4 pl-4 text-right w-24">
                                    <button onClick={() => openModal("edit", "sales", order)} className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg mr-2"><Edit2 size={14}/></button>
                                 </td>
                               </tr>
                             ))}
                           </tbody>
                        </table>
                    </div>
                  </div>
                );
            })}
        </div>
      </div>
    );
  };
  
`;
    txt = txt.replace(oldRenderSales, newRenderSales);
    console.log('Patched renderSales');
}

// 2. Patch renderModal Unit Rates for Sales
const addFormMatch = txt.indexOf('} else if (currentSection === "sales") {');
// we don't even need to verify the if block, we can just replace the input block directly
const amountBlock = `<div>
                    <label className="block text-xs text-slate-400 uppercase font-bold mb-1">Amount (USD)</label>
                    <input type="number" value={(modalData as any).amountUSD} onChange={e => setModalData(prev => ({...prev, amountUSD: e.target.value}))} className="w-full bg-slate-800 border border-white/10 rounded px-3 py-2 text-white focus:border-[#D4AF37] focus:outline-none"/>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 uppercase font-bold mb-1">Amount (OMR)</label>
                    <input type="number" value={(modalData as any).amountOMR} onChange={e => setModalData(prev => ({...prev, amountOMR: e.target.value}))} className="w-full bg-slate-800 border border-white/10 rounded px-3 py-2 text-white focus:border-[#D4AF37] focus:outline-none"/>
                  </div>`;

// removing whitespace sensitivity by using replaceAll or regex
const amountRegex = /<div>\s*<label className="block text-xs text-slate-400 uppercase font-bold mb-1">Amount \(USD\)<\/label>\s*<input type="number" value=\{\(modalData as any\).amountUSD\} onChange=\{e => setModalData\(prev => \(\{\.\.\.prev, amountUSD: e.target.value\}\)\)\} className="w-full bg-slate-800 border border-white\/10 rounded px-3 py-2 text-white focus:border-\[#D4AF37\] focus:outline-none"\/>\s*<\/div>\s*<div>\s*<label className="block text-xs text-slate-400 uppercase font-bold mb-1">Amount \(OMR\)<\/label>\s*<input type="number" value=\{\(modalData as any\).amountOMR\} onChange=\{e => setModalData\(prev => \(\{\.\.\.prev, amountOMR: e.target.value\}\)\)\} className="w-full bg-slate-800 border border-white\/10 rounded px-3 py-2 text-white focus:border-\[#D4AF37\] focus:outline-none"\/>\s*<\/div>/;

const newAmountBlock = `<div>
                    <label className="block text-xs text-slate-400 uppercase font-bold mb-1">Unit Rate (USD/KG)</label>
                    <input type="number" value={(modalData as any).rateUSD || 0} onChange={e => setModalData(prev => ({...prev, rateUSD: e.target.value}))} className="w-full bg-slate-800 border border-white/10 rounded px-3 py-2 text-white focus:border-[#D4AF37] focus:outline-none"/>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 uppercase font-bold mb-1">Amount (USD)</label>
                    <input type="number" value={(modalData as any).amountUSD} onChange={e => setModalData(prev => ({...prev, amountUSD: e.target.value}))} className="w-full bg-slate-800 border border-white/10 rounded px-3 py-2 text-white focus:border-[#D4AF37] focus:outline-none"/>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 uppercase font-bold mb-1">Amount (OMR)</label>
                    <input type="number" value={(modalData as any).amountOMR} onChange={e => setModalData(prev => ({...prev, amountOMR: e.target.value}))} className="w-full bg-slate-800 border border-white/10 rounded px-3 py-2 text-white focus:border-[#D4AF37] focus:outline-none"/>
                  </div>`;

if (txt.match(amountRegex)) {
    txt = txt.replace(amountRegex, newAmountBlock);
    console.log('Patched renderModal for Unit Rates');
} else {
    console.log("Could not match the Amount inputs regex");
}

// 3. We also need to add 'rate_usd' to performSave for 'sales'
const saveSalesRegex = /amount_usd:\s*Number\(newItem\.amountUSD\)/g;
const newSaveSales = `rate_usd: Number(newItem.rateUSD || 0),
            amount_usd: Number(newItem.amountUSD)`;
txt = txt.replace(saveSalesRegex, newSaveSales);

fs.writeFileSync(file, txt);
console.log('Sales patching complete!');
