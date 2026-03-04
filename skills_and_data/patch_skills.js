const fs = require('fs');
const path = require('path');

// 1. Read the TS registry that we generated previously in the other project
const tsContent = fs.readFileSync('c:/Users/User/New erp/ai-studio/src/data/skills_registry.ts', 'utf8');

// Quick and dirty regex parse to extract the array of objects from the TS file
// The file exports `export const skillsRegistry = [ ... ];`
let registryStr = tsContent.substring(tsContent.indexOf('['));
registryStr = registryStr.substring(0, registryStr.lastIndexOf(']') + 1);

// eval it safely to get the JS array
let skillsData = [];
try {
    const evaluate = new Function(`return ${registryStr};`);
    skillsData = evaluate();
} catch (e) {
    console.error("Failed to parse registry:", e);
    process.exit(1);
}

// 2. Map to the Vercel App's expected format
const aiStudioSkills = skillsData.map(s => {
    // Try to parse the name and description from the markdown content
    const nameMatch = s.content.match(/name:\s*(.+)/);
    const descMatch = s.content.match(/description:\s*["']?(.*?)["']?(\n|$)/);
    const name = nameMatch ? nameMatch[1].replace(/['"]/g, '').trim() : s.id;

    let description = descMatch ? descMatch[1].trim() : 'AI Agent Skill';
    if (description.length > 120) description = description.substring(0, 117) + '...';

    // Use the entire markdown content as the system prompt context!
    const prompt = s.content;

    // Determine category based on name or ID
    let category = 'AI Innovation';
    if (s.id.includes('pharma') || s.id.includes('biotech')) category = 'R&D';
    if (s.id.includes('facility')) category = 'Operations';
    if (s.id.includes('react') || s.id.includes('nextjs') || s.id.includes('web-design')) category = 'Dev Tools';

    return {
        id: `AISTUDIO-${s.id}`,
        name: name,
        provider: 'Gemini', // Vercel app uses Gemini 2.0 Flash internally
        description: description,
        prompt: prompt,
        category: category,
        usageCount: 0,
        createdAt: new Date().toISOString().split('T')[0]
    };
});

// 3. Patch App.tsx
const appTsxPath = 'c:/Users/User/New erp/Alwajer-Pharma-erp/App.tsx';
let appCode = fs.readFileSync(appTsxPath, 'utf8');

// Find the savedSkills useState
const hookStart = appCode.indexOf('const [savedSkills, setSavedSkills] = useState');
if (hookStart === -1) {
    console.error("Could not find savedSkills hook");
    process.exit(1);
}

const functionStart = appCode.indexOf('(() => {', hookStart);
const returnBlockStart = appCode.indexOf('try {', functionStart);
const arrayEnd = appCode.indexOf('];', returnBlockStart) + 2;

// The new logic to inject
const injectedLogic = `
    try {
      const AI_STUDIO_SKILLS = ${JSON.stringify(aiStudioSkills, null, 2)};
      const s = localStorage.getItem('erp_saved_skills');
      let parsed = s ? JSON.parse(s) : [
        { id:'SK-001', name:'Operations Brief', provider:'Claude', description:'Daily operational summary with risks flagged', prompt:'You are the COO of Al Wajer Pharmaceuticals. Analyze current operations and provide a concise executive brief covering: production status, inventory alerts, financial position, and top 3 risks. Be direct and precise.', category:'Operations', usageCount:0, createdAt:'2026-02-27' },
        { id:'SK-002', name:'Formulation Optimizer', provider:'Gemini', description:'Optimize pharmaceutical formulations for cost and quality', prompt:'You are a Senior Pharmaceutical Formulation Scientist. When given formulation data, analyze ingredient ratios, suggest cost-reducing substitutions, flag compatibility issues, and recommend quality improvements. Always reference BP/USP standards.', category:'R&D', usageCount:0, createdAt:'2026-02-27' },
        { id:'SK-003', name:'Market Entry Analyst', provider:'Claude', description:'Analyze new pharmaceutical market opportunities', prompt:'You are a pharmaceutical market entry strategist for GCC/MENA region. When given a product or market, provide: regulatory pathway, competitive landscape, pricing benchmark, and go-to-market recommendation. Focus on Oman, UAE, Kuwait, Saudi Arabia.', category:'Business Dev', usageCount:0, createdAt:'2026-02-27' },
      ];
      
      // Forcefully merge AI Studio skills
      const merged = [...parsed];
      AI_STUDIO_SKILLS.forEach(newSkill => {
        if (!merged.find(existing => existing.id === newSkill.id)) {
           merged.push(newSkill);
        }
      });
      return merged;
`;

// Replace the old try logic
const before = appCode.substring(0, returnBlockStart);
const after = appCode.substring(arrayEnd);

appCode = before + injectedLogic.trim() + after;
fs.writeFileSync(appTsxPath, appCode);
console.log("Successfully injected " + aiStudioSkills.length + " AI Studio skills into App.tsx!");
