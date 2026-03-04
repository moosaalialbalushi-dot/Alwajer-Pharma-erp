const fs = require('fs');
const lines = fs.readFileSync('c:/Users/User/New erp/Alwajer-Pharma-erp/App.tsx', 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("currentSection === 'hr'")) {
        console.log("MATCH AT LINE " + (i + 1));
        for (let j = i; j < i + 5; j++) {
            console.log(j + 1 + ": " + lines[j]);
        }
    }
}
