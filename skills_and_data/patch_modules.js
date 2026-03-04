const fs = require('fs');
const filePath = 'c:/Users/User/New erp/Alwajer-Pharma-erp/App.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Helper to escape $ in template literals for the script itself
const dollar = '$';

// 1. Enhanced renderProcurement
const procStart = content.indexOf('const renderProcurement = () =>');
const procEnd = content.indexOf('const renderDashboard = () =>');

if (procStart > -1 && procEnd > -1) {
    const newRenderProcurement = `const renderProcurement = () => {
    const purchaseItems = inventory.filter(i => (i.balanceToPurchase && i.balanceToPurchase > 0));

    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Truck className="text-[#F4C430]" size={20} /> Procurement & Supply Chain
            </h2>
            <div className="flex gap-2">
                <button onClick={() => setIsPOModalOpen(true)} className="bg-[#D4AF37] hover:bg-[#c4a030] text-slate-950 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-all shadow-lg shadow-[#D4AF37]/20">
                    <Plus size={16} /> Generate PO
                </button>
                <button onClick={() => openModal('add', 'procurement', {id: '', name: '', category: 'API', rating: 5, status: 'Verified', country: ''})} className="bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37] px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-all">
                    <UserPlus size={16} /> Add Vendor
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
                <div className="bg-slate-900/50 border border-[#D4AF37]/30 rounded-xl p-6 gold-glow transition-all hover:border-[#D4AF37]/50">
                     <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <AlertTriangle className="text-red-400" size={18}/> Material Shortages
                     </h3>
                     <div className="space-y-3">
                         {purchaseItems.length === 0 ? <p className="text-slate-500 text-sm">No critical shortages.</p> : purchaseItems.map(item => (
                             <div key={item.id} className="p-4 bg-red-500/10 rounded border border-red-500/20 flex justify-between items-center group">
                                 <div>
                                     <h4 className="text-white font-bold text-sm group-hover:text-red-400 transition-colors">{item.name}</h4>
                                     <p className="text-[10px] text-red-300 font-mono tracking-wider">Required: {item.balanceToPurchase} {item.unit}</p>
                                 </div>
                                 <button 
                                   className="text-xs bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white px-3 py-1.5 rounded-lg border border-red-500/30 font-bold transition-all"
                                   onClick={() => { setPOItem(item); setPOQty(String(item.balanceToPurchase)); setIsPOModalOpen(true); }}
                                 >
                                     Fill Needs
                                 </button>
                             </div>
                         ))}
                     </div>
                </div>

                <div className="bg-slate-900/50 border border-[#D4AF37]/30 rounded-xl p-6 gold-glow">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <BadgeDollarSign className="text-green-400" size={18}/> Market Raw Material Rates
                    </h3>
                    <div className="overflow-hidden border border-white/5 rounded-lg">
                        <table className="w-full text-left">
                            <thead className="bg-slate-950/50 text-[10px] text-slate-500 uppercase font-bold tracking-widest">
                                <tr>
                                    <th className="px-4 py-3">Material</th>
                                    <th className="px-4 py-3">Market Price</th>
                                    <th className="px-4 py-3">Last Change</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm">
                                {[
                                    {name: 'Esomeprazole Sodium', price: '$48.50', change: '+1.2%'},
                                    {name: 'Omeprazole Pellet 8.5%', price: '$12.20', change: '-0.5%'},
                                    {name: 'Empty Hard Gelatin Cap', price: '$3.80', change: 'Stable'},
                                    {name: 'Alu-Alu Foil', price: '$9.40', change: '+2.1%'}
                                ].map((m, idx) => (
                                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-3 text-slate-300 font-medium">{m.name}</td>
                                        <td className="px-4 py-3 text-[#D4AF37] font-bold font-mono">{m.price}/kg</td>
                                        <td className={\`px-4 py-3 text-[10px] font-bold \${m.change.includes('+') ? 'text-green-400' : m.change.includes('-') ? 'text-red-400' : 'text-slate-500'}\`}>{m.change}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="bg-slate-900/50 border border-[#D4AF37]/30 rounded-xl p-6 gold-glow transition-all hover:border-[#D4AF37]/50">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Globe className="text-[#F4C430]" size={18}/> Global Supplier Rates
                </h3>
                 <div className="space-y-4">
                     {vendors.map(vendor => (
                         <div key={vendor.id} className="p-4 bg-slate-950/30 rounded-lg border border-white/5 space-y-3 group hover:border-[#D4AF37]/20 transition-all">
                             <div className="flex justify-between items-start">
                                 <div>
                                     <div className="flex items-center gap-2">
                                         <h4 className="text-white font-bold text-sm group-hover:text-[#D4AF37] transition-colors">{vendor.name}</h4>
                                         <span className={\`text-[9px] px-1.5 py-0.5 rounded-full border uppercase tracking-tighter \${vendor.status === 'Verified' ? 'text-green-400 border-green-500/20 bg-green-500/10' : 'text-yellow-500 border-yellow-500/20 bg-yellow-500/10'}\`}>{vendor.status}</span>
                                     </div>
                                     <p className="text-[10px] text-slate-500 mt-0.5">{vendor.country} • {vendor.category} Specialist</p>
                                 </div>
                                 <div className="flex flex-col items-end">
                                     <div className="flex items-center text-[#D4AF37] text-xs font-bold gap-1 mb-1">
                                         <Star size={10} fill="#D4AF37"/> {vendor.rating}
                                     </div>
                                     <button onClick={() => openModal('edit', 'procurement', vendor)} className="text-[10px] text-slate-500 hover:text-white underline">Edit Supplier</button>
                                 </div>
                             </div>
                             <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-2">
                                 <div className="text-[10px] text-slate-500">
                                     Main Materials: <span className="text-slate-300">API, Pellets</span>
                                 </div>
                                 <div className="text-[10px] text-right text-slate-500">
                                     Lead Time: <span className="text-slate-300">15-20 Days</span>
                                 </div>
                             </div>
                         </div>
                     ))}
                 </div>
            </div>
        </div>
      </div>
    );
  };
`;
    content = content.substring(0, procStart) + newRenderProcurement + "\n\n  " + content.substring(procEnd);
    console.log('Patched Procurement module.');
}

// 2. Enhanced renderBD
const bdStart = content.indexOf('const renderBD = () =>');
const bdEnd = content.indexOf('const renderSamples = () =>');

if (bdStart > -1 && bdEnd > -1) {
    const newRenderBD = `const renderBD = () => (
    <div className="space-y-6 animate-fadeIn">
       <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Globe className="text-[#F4C430]" size={20} /> Business Development
          </h2>
          <div className="flex gap-2">
              <button 
                  onClick={() => openModal('add', 'bd', {id: \`BD-\${Date.now()}\`, targetMarket: '', opportunity: '', potentialValue: '', status: 'Prospecting', probability: 50})} 
                  className="luxury-gradient px-4 py-2 rounded-lg text-slate-950 font-bold flex items-center gap-2 text-sm shadow-lg shadow-[#D4AF37]/30"
              >
                  <Plus size={16}/> Insert New Lead
              </button>
              <button onClick={() => bdFileRef.current?.click()} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                  <Upload size={14}/> Import
              </button>
              <input type="file" ref={bdFileRef} className="hidden" onChange={(e) => handleFileUpload(e, 'bd')} />
          </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bdLeads.map(lead => (
              <div key={lead.id} className="p-4 bg-slate-900/50 border border-[#D4AF37]/30 rounded-xl hover:border-[#D4AF37]/60 transition-all gold-glow group relative">
                  <div className="absolute top-4 right-4 text-[9px] font-bold text-[#D4AF37] px-2 py-0.5 rounded border border-[#D4AF37]/30 bg-[#D4AF37]/5">
                      {lead.status}
                  </div>
                  <p className="text-[#D4AF37] text-[10px] font-bold uppercase tracking-wider mb-1">{lead.targetMarket}</p>
                  <h3 className="text-white font-bold text-lg leading-tight mb-2 pr-12">{lead.opportunity}</h3>
                  <div className="flex justify-between items-end mt-4">
                      <div className="text-[10px] text-slate-500">
                           Potential: <span className="text-white font-bold">{lead.potentialValue}</span>
                      </div>
                      <div className="text-right">
                           <div className="text-[9px] text-slate-500 mb-0.5">Prob.</div>
                           <div className="text-lg font-bold text-white font-mono">{lead.probability}%</div>
                      </div>
                  </div>
              </div>
          ))}
          {bdLeads.length === 0 && (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-xl">
                 <p className="text-slate-500 font-bold">No active BD leads.</p>
              </div>
          )}
      </div>
    </div>
  );
`;
    content = content.substring(0, bdStart) + newRenderBD + "\n\n  " + content.substring(bdEnd);
    console.log('Patched BD Hub module.');
}

// 3. Enhanced renderSamples
const smpStart = content.indexOf('const renderSamples = () =>');
const smpEnd = content.indexOf('// Custom Icon for Claude');

if (smpStart > -1 && smpEnd > -1) {
    const newRenderSamples = `const renderSamples = () => (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <PackageSearch className="text-[#F4C430]" size={20} /> Sample Tracking
          </h2>
          <button 
              onClick={() => openModal('add', 'samples', {id: \`SMP-\${Date.now()}\`, product: '', destination: '', quantity: '1 Unit', status: 'Requested', trackingNumber: 'Pending'})} 
              className="luxury-gradient px-4 py-2 rounded-lg text-slate-950 font-bold flex items-center gap-2 text-sm shadow-lg shadow-[#D4AF37]/30"
          >
              <Plus size={16}/> New Sample
          </button>
      </div>
      <div className="bg-slate-900/50 border border-[#D4AF37]/30 rounded-xl overflow-hidden gold-glow">
          <table className="w-full text-left">
              <thead className="bg-slate-950/50 text-[10px] text-slate-500 uppercase font-bold tracking-widest">
                  <tr>
                      <th className="px-6 py-4">Product</th>
                      <th className="px-6 py-4">Destination</th>
                      <th className="px-6 py-4">Tracking</th>
                      <th className="px-6 py-4">Status</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                  {samples.map(sample => (
                      <tr key={sample.id} className="hover:bg-white/5">
                          <td className="px-6 py-4">
                              <div className="text-white font-bold">{sample.product}</div>
                              <div className="text-[10px] text-slate-500 font-mono">{sample.id}</div>
                          </td>
                          <td className="px-6 py-4 text-slate-300">{sample.destination}</td>
                          <td className="px-6 py-4 font-mono text-xs">{sample.trackingNumber}</td>
                          <td className="px-6 py-4">
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">{sample.status}</span>
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>
    </div>
  );
`;
    content = content.substring(0, smpStart) + newRenderSamples + "\n\n  " + content.substring(smpEnd);
    console.log('Patched Samples module.');
}

fs.writeFileSync(filePath, content);
console.log('All module patches applied.');
