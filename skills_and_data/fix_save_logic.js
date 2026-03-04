const fs = require('fs');
const file = 'c:/Users/User/New erp/Alwajer-Pharma-erp/App.tsx';
let txt = fs.readFileSync(file, 'utf8');

const anchorAdd = `} else if (currentSection === 'hr') {
          setEmployees(prev => [...prev, newItem]);
          await supabase.from('employees').insert(newItem);
          await logAction('CREATE', \`Added employee: \${newItem.name}\`);
        }`;

const replaceAdd = anchorAdd + ` else if (currentSection === 'procurement') {
          setVendors(prev => [...prev, newItem]);
          await logAction('CREATE', \`Added vendor: \${newItem.name}\`);
        } else if (currentSection === 'bd') {
          setBdLeads(prev => [...prev, newItem]);
          await logAction('CREATE', \`Added BD Lead: \${newItem.targetMarket || newItem.name || 'Lead'}\`);
        } else if (currentSection === 'samples') {
          setSamples(prev => [...prev, newItem]);
          await logAction('CREATE', \`Added Sample: \${newItem.product || 'Sample'}\`);
        }`;

const anchorEdit = `} else if (currentSection === 'hr') {
          setEmployees(prev => prev.map(item => item.id === newItem.id ? newItem : item));
          await supabase.from('employees').update(newItem).eq('id', newItem.id);
          await logAction('UPDATE', \`Updated employee: \${newItem.name}\`);
        }`;

const replaceEdit = anchorEdit + ` else if (currentSection === 'procurement') {
          setVendors(prev => prev.map(item => item.id === newItem.id ? newItem : item));
          await logAction('UPDATE', \`Updated vendor: \${newItem.name}\`);
        } else if (currentSection === 'bd') {
          setBdLeads(prev => prev.map(item => item.id === newItem.id ? newItem : item));
          await logAction('UPDATE', \`Updated BD Lead: \${newItem.targetMarket}\`);
        } else if (currentSection === 'samples') {
          setSamples(prev => prev.map(item => item.id === newItem.id ? newItem : item));
          await logAction('UPDATE', \`Updated Sample: \${newItem.product}\`);
        }`;

let patched = false;
if (txt.includes(anchorAdd)) {
    txt = txt.replace(anchorAdd, replaceAdd);
    patched = true;
    console.log('Patched ADD branch');
}

if (txt.includes(anchorEdit)) {
    txt = txt.replace(anchorEdit, replaceEdit);
    patched = true;
    console.log('Patched EDIT branch');
}

// Sidebar Mobile Fix (adding onClick)
// Look for the exact mapping in renderSidebar
const origSidebarBtn = `<button key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={\`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-300 relative overflow-hidden group \${
                activeTab === item.id 
                  ? 'text-[#F4C430] bg-[#F4C430]/10 border-r-2 border-[#F4C430]' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }\`}>`;

const newSidebarBtn = `<button key={item.id}
              onClick={() => { setActiveTab(item.id as any); setIsMobileMenuOpen(false); }}
              className={\`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-300 relative overflow-hidden group \${
                activeTab === item.id 
                  ? 'text-[#F4C430] bg-[#F4C430]/10 border-r-2 border-[#F4C430]' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }\`}>`;

if (txt.includes(origSidebarBtn)) {
    txt = txt.replace(origSidebarBtn, newSidebarBtn);
    console.log('Patched Sidebar Button');
} else {
    // try regex if exact string is wrong
    txt = txt.replace(/<button key=\{item\.id\}\s*onClick=\{([^}]+)\}/g, `<button key={item.id}\n              onClick={(e) => { $1; setIsMobileMenuOpen(false); }}`);
    console.log('Using regex for Sidebar Button');
}

// Make sidebar text smaller
txt = txt.replace('text-sm font-medium transition-all', 'text-xs font-semibold transition-all');

fs.writeFileSync(file, txt);
console.log('Done!');
