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
} else { console.log('Could not find anchorAdd'); }

if (txt.includes(anchorEdit)) {
    txt = txt.replace(anchorEdit, replaceEdit);
    patched = true;
} else { console.log('Could not find anchorEdit'); }

// Also fix sidebar clicks closing the menu on mobile
txt = txt.replace(/<button key=\{item\.id\}\n\s*onClick=\{([^}]+)\}/g, `<button key={item.id}\n              onClick={(e) => { $1; setIsMobileMenuOpen(false); }}`);

if (patched) {
    fs.writeFileSync(file, txt);
    console.log('Successfully patched performSave and sidebar UI closing on click!');
}
