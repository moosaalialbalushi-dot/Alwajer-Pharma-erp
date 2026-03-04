const fs = require('fs');

const appTsxPath = 'c:/Users/User/New erp/Alwajer-Pharma-erp/App.tsx';
let appCode = fs.readFileSync(appTsxPath, 'utf8');

// 1. Inject imports
const importBlock = `
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { salesData } from './src/data/sales_data';
import { supplyChainData } from './src/data/supply_chain_data';
`;
appCode = appCode.replace("import React,", importBlock + "\nimport React,");


// 2. Inject chart calculations into renderDashboard
const calcBlock = `
    const customerChartData = salesData.reduce((acc, row) => {
      const existing = acc.find(c => c.name === row.customer);
      if (existing) existing.value += row.amount_usd || 0;
      else acc.push({ name: row.customer, value: row.amount_usd || 0 });
      return acc;
    }, []).sort((a,b) => b.value - a.value).slice(0, 10);

    const scCats = supplyChainData.reduce((acc, row) => {
      const existing = acc.find(c => c.name === row.category);
      if (existing) existing.value += row.monthly_cost_usd || 0;
      else acc.push({ name: row.category, value: row.monthly_cost_usd || 0 });
      return acc;
    }, []);
    const COLORS = ['#4f46e5', '#8b5cf6', '#0ea5e9', '#10b981', '#f43f5e', '#eab308'];
`;

appCode = appCode.replace("const renderDashboard = () => {", "const renderDashboard = () => {" + calcBlock);

// 3. Inject JSX at the bottom of the dashboard
// We find the last </div> before the next const render...
const dashStart = appCode.indexOf('const renderDashboard');
let dashEnd = appCode.indexOf('const render', dashStart + 50);
if (dashEnd === -1) {
    // fallback if renderDashboard is the last one
    dashEnd = appCode.length;
}

// Search backwards from dashEnd for the closing div
const closingDivIdx = appCode.lastIndexOf('</div>', dashEnd);

const chartJSX = `
      {/* AI Studio Real Insights */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-6 rounded-xl">
          <h3 className="text-lg font-bold text-white mb-4">Pipeline Value by Customer (AI Cleaned Data)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={customerChartData} margin={{ left: 20 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => '$'+(val/1000)+'k'} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff' }} />
                <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-6 rounded-xl">
          <h3 className="text-lg font-bold text-white mb-4">Material Cost Distribution (Supply Chain AI)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={scCats} 
                  cx="50%" cy="50%" 
                  innerRadius={50} outerRadius={80} 
                  paddingAngle={5} dataKey="value"
                  label={({name, percent}) => \`\${name.substring(0,10)} \${((percent || 0) * 100).toFixed(0)}%\`}
                >
                  {scCats.map((_, index) => <Cell key={\`cell-\${index}\`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
`;

const newDash = appCode.substring(0, closingDivIdx) + chartJSX + appCode.substring(closingDivIdx);
fs.writeFileSync(appTsxPath, newDash);
console.log("Successfully injected AI Charts into Vercel Dashboard!");
