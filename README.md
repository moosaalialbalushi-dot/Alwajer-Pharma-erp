# Al Wajer Pharmaceuticals — ERP Hub v3.0

**Luxury pharmaceutical ERP for Al Wajer Pharmaceuticals Industry LLC, Sohar Industrial Area, Oman.**

---

## Architecture

| File | Purpose |
|------|---------|
| `App.tsx` | Main application — all modules, routing, state |
| `geminiService.ts` | Gemini AI integration (COO chat, R&D analysis, file import) |
| `supabaseClient.ts` | Supabase database client with fallback |
| `exportUtils.ts` | CSV export utility |
| `index.tsx` | React entry point |
| `index.html` | HTML shell with Tailwind CDN |

---

## Modules

### 📊 Dashboard
Real-time KPI grid: batch yield, pending orders, critical stock, revenue, expenses, staff count.
Live inventory alerts and finance snapshot.

### 🏭 Manufacturing
Full batch CRUD. Tracks: product, quantity, actual yield %, expected yield %, dispatch date, status.
Color-coded yield: 🟢 ≥99%, 🟡 <99%.

### 📦 Inventory
Raw material tracking per `NEW_DATA_STRUCTURE.md`:
- S.No, Name, Category, Required for Orders, Present Stock, Balance to Purchase
- Traffic light: 🔴 BUY (shortage), 🟢 OK (sufficient)

### 💰 Sales
Full order tracking per `NEW_DATA_STRUCTURE.md`:
- Invoice No., Date, Party, LC/BIC No., Country, Product, Qty (kg), Rate $, Amount $, Amount OMR, Status

### 🚚 Procurement
Two views:
- **Vendors**: Registry with payment terms, lead time, rating, product catalog
- **Shortages**: Auto-generated purchase list from inventory deficits

### 💳 Accounting
Expense ledger with toggle Paid/Pending. Category breakdown.

### 👥 HR & Admin
Employee records with department breakdown grid and payroll totals.

### 🔬 R&D Lab
Formulation costing engine per `NEW_DATA_STRUCTURE.md`:
- Batch output, per-ingredient costing (Qty × Rate), Total RMC, Loss factor, Total Final RMC/kg
- **AI Optimize** button: sends formulation to Gemini for optimization suggestions

### 🌍 Business Development
Pipeline cards with deal value, probability bars, market grid.

### 🤖 AI Command Center
Full COO chatbot powered by Gemini 2.0 Flash:
- Auto-injects live operational context into every message
- Quick prompt buttons
- Conversation history maintained

### 📋 Audit Log
All CRUD and AI import operations tracked with timestamps.

---

## Data Persistence

The app uses a **dual-layer** approach:

1. **Local state** (always available, resets on refresh)
2. **Supabase** (persists across sessions — requires configuration)

### Supabase Tables Required

```sql
-- Run these in your Supabase SQL editor
create table production_yields (id text primary key, product text, quantity numeric, actual_yield numeric, expected_yield numeric, status text, timestamp text, dispatch_date text);
create table inventory (id text primary key, s_no text, name text, category text, stock numeric, required_for_orders numeric, unit text, balance_to_purchase numeric, stock_date text);
create table orders (id text primary key, s_no text, date text, invoice_no text, customer text, lc_no text, country text, product text, quantity numeric, rate_usd numeric, amount_usd numeric, amount_omr numeric, status text);
create table audit_logs (id text primary key, action text, details text, "user" text, timestamp text);
```

---

## AI Integration

### Gemini API (Primary — Multimodal)
Used for:
- COO chatbot (`chatWithCOO`)
- R&D formulation optimization (`optimizeFormulation`)
- File/image analysis for AI import (`analyzeImageOrFile`)
- Operational insights (`analyzeOperations`)

Set your key: **Settings → Gemini API Key** or `VITE_GEMINI_API_KEY` in `.env`

### Anthropic API (Alternative)
The AI Command module also supports direct Anthropic API calls. See `geminiService.ts` comments.

---

## AI File Import

Every module has an **"AI Import"** button. Supported formats:
- `.csv` — Sales data, inventory lists
- `.xlsx / .xls` — Excel spreadsheets (text content extracted)
- `.txt` / `.json` — Any structured text
- `.pdf` — PDF reports (text extraction)

The AI reads the file, maps fields to the module's data structure, and imports the rows automatically. A progress bar shows: Reading → Analyzing → Importing.

---

## Deployment

### Vercel (Recommended)
```bash
# 1. Push to GitHub
git add .
git commit -m "ERP v3"
git push

# 2. Import in Vercel dashboard
# 3. Add environment variables:
#    VITE_GEMINI_API_KEY = your-key
#    VITE_SUPABASE_URL   = https://xxxx.supabase.co
#    VITE_SUPABASE_ANON_KEY = eyJ...
```

### Local Development
```bash
pnpm install   # or npm install
pnpm dev       # starts at http://localhost:3000
```

---

## Environment Variables

```env
VITE_GEMINI_API_KEY=AIza...
VITE_SUPABASE_URL=https://dqsriohrazmlikwjwbot.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

---

## Design System

| Token | Value |
|-------|-------|
| Primary gold | `#D4AF37` |
| Gold gradient | `135deg, #F4C430 → #D4AF37` |
| Background | `#020617` (slate-950) |
| Cards | `bg-slate-900/60 border border-white/10` |
| Font | Segoe UI, system-ui |

---

*Built with React 19 + TypeScript + Vite + Tailwind + Supabase + Gemini AI*
*Al Wajer Pharmaceuticals Industry LLC — Sohar Industrial Area, Oman*
