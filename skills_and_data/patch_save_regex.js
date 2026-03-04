const fs = require('fs');
const file = 'c:/Users/User/New erp/Alwajer-Pharma-erp/App.tsx';
let txt = fs.readFileSync(file, 'utf8');

// The exact text from lines 1762-1766 (with any spacing)
const addRegex = /\}\s*else if \(currentSection === 'hr'\) \{\s*setEmployees\(prev => \[\.\.\.prev, newItem\]\);\s*await supabase\.from\('employees'\)\.insert\(newItem\);\s*await logAction\('CREATE', `Added employee: \$\{newItem\.name\}`\);\s*\}/;

const addReplace = `} else if (currentSection === 'hr') {
          setEmployees(prev => [...prev, newItem]);
          await supabase.from('employees').insert(newItem);
          await logAction('CREATE', \`Added employee: \${newItem.name}\`);
        } else if (currentSection === 'procurement') {
          setVendors(prev => [...prev, newItem]);
          await logAction('CREATE', \`Added vendor: \${newItem.name}\`);
        } else if (currentSection === 'bd') {
          setBdLeads(prev => [...prev, newItem]);
          await logAction('CREATE', \`Added BD Lead: \${newItem.targetMarket || newItem.name || 'Lead'}\`);
        } else if (currentSection === 'samples') {
          setSamples(prev => [...prev, newItem]);
          await logAction('CREATE', \`Added Sample: \${newItem.product || 'Sample'}\`);
        }`;


const editRegex = /\}\s*else if \(currentSection === 'hr'\) \{\s*setEmployees\(prev => prev\.map\(e => e\.id === newItem\.id \? newItem : e\)\);\s*await supabase\.from\('employees'\)\.update\(newItem\)\.eq\('id', newItem\.id\);\s*await logAction\('UPDATE', `Updated employee: \$\{newItem\.name\}`\);\s*\}/;

const editReplace = `} else if (currentSection === 'hr') {
          setEmployees(prev => prev.map(e => e.id === newItem.id ? newItem : e));
          await supabase.from('employees').update(newItem).eq('id', newItem.id);
          await logAction('UPDATE', \`Updated employee: \${newItem.name}\`);
        } else if (currentSection === 'procurement') {
          setVendors(prev => prev.map(item => item.id === newItem.id ? newItem : item));
          await logAction('UPDATE', \`Updated vendor: \${newItem.name}\`);
        } else if (currentSection === 'bd') {
          setBdLeads(prev => prev.map(item => item.id === newItem.id ? newItem : item));
          await logAction('UPDATE', \`Updated BD Lead: \${newItem.targetMarket}\`);
        } else if (currentSection === 'samples') {
          setSamples(prev => prev.map(item => item.id === newItem.id ? newItem : item));
          await logAction('UPDATE', \`Updated Sample: \${newItem.product}\`);
        }`;


txt = txt.replace(addRegex, addReplace);
txt = txt.replace(editRegex, editReplace);

// Fix sidebar bug
const sidebarBugRegex = /onClick=\{\(e\) => \{\s*\(\)=>\{setActiveTab\(item\.id as any\);setIsMobileMenuOpen\(false\);;\s*setIsMobileMenuOpen\(false\);\s*\}\}\}/;
const sidebarReplace = `onClick={(e) => { setActiveTab(item.id as any); setIsMobileMenuOpen(false); }}`;
txt = txt.replace(sidebarBugRegex, sidebarReplace);

fs.writeFileSync(file, txt);
console.log('App.tsx patched via Regex successfully!');
