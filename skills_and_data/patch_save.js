const fs = require('fs');
const file = 'c:/Users/User/New erp/Alwajer-Pharma-erp/App.tsx';
let txt = fs.readFileSync(file, 'utf8');

if (!txt.includes('currentSection === \\'procurement\\'')) {
    const hrBlock = "} else if (currentSection === 'hr') {\n          setEmployees(prev => [...prev, newItem]);\n          await supabase.from('employees').insert(newItem);\n          await logAction('CREATE', `Added employee: ${newItem.name}`);\n        }";
    const newBlocks = hrBlock + ` else if (currentSection === 'procurement') {
          setVendors(prev => [...prev, newItem]);
          await logAction('CREATE', \`Added vendor: \${newItem.name}\`);
        } else if (currentSection === 'bd') {
          setBdLeads(prev => [...prev, newItem]);
          await logAction('CREATE', \`Added BD Lead: \${newItem.targetMarket}\`);
        } else if (currentSection === 'samples') {
          setSamples(prev => [...prev, newItem]);
          await logAction('CREATE', \`Added Sample: \${newItem.product}\`);
        }`;

    txt = txt.replace(hrBlock, newBlocks);

    // Also do for edit mode
    const hrEdit = "} else if (currentSection === 'hr') {\n          setEmployees(prev => prev.map(item => item.id === newItem.id ? newItem : item));\n          await supabase.from('employees').update(newItem).eq('id', newItem.id);\n          await logAction('UPDATE', `Updated employee: ${newItem.name}`);\n        }";

    if (txt.includes(hrEdit)) {
        const editBlocks = hrEdit + ` else if (currentSection === 'procurement') {
          setVendors(prev => prev.map(item => item.id === newItem.id ? newItem : item));
          await logAction('UPDATE', \`Updated vendor: \${newItem.name}\`);
        } else if (currentSection === 'bd') {
          setBdLeads(prev => prev.map(item => item.id === newItem.id ? newItem : item));
          await logAction('UPDATE', \`Updated BD Lead: \${newItem.targetMarket}\`);
        } else if (currentSection === 'samples') {
          setSamples(prev => prev.map(item => item.id === newItem.id ? newItem : item));
          await logAction('UPDATE', \`Updated Sample: \${newItem.product}\`);
        }`;
        txt = txt.replace(hrEdit, editBlocks);
    }

    fs.writeFileSync(file, txt);
    console.log('Patched performSave in App.tsx');
} else {
    console.log('Already patched');
}
