# 🚀 Complete Setup & Deployment Guide

## ✅ CHECKLIST

- [ ] Task 1: Get Claude & Gemini API Keys
- [ ] Task 2: Install and Setup Ollama
- [ ] Task 3: Configure Custom Extraction Prompts
- [ ] Task 4: Deploy to Vercel

---

## TASK 1: API KEYS ✓

### **Claude (Anthropic) - Recommended First**

**Quickest Setup (2 minutes):**

```bash
# 1. Visit this link in your browser:
https://console.anthropic.com/

# 2. Sign up with email or Google
# (Verify email if required)

# 3. Click "Dashboard" → "API Keys" (left sidebar)

# 4. Click "Create Key" (blue button)

# 5. Copy the key: sk-ant-api03-XXXXXXX

# 6. SAVE IT! You won't see it again
```

**Pricing:**
- Input: $0.003 per 1,000 tokens
- Output: $0.015 per 1,000 tokens
- Free tier: 5 free API requests

**Cost Estimate:**
- Small orders import: ~$0.01
- Large inventory import: ~$0.05
- Monthly: $1-10 depending on usage

---

### **Gemini (Google) - FREE Tier**

**Setup (2 minutes):**

```bash
# 1. Visit this link:
https://makersuite.google.com/app/apikey

# 2. Sign in with Google account

# 3. Click "Create API Key"

# 4. Select "Create in new project" (or existing)

# 5. Copy key: AIzaSy-XXXXXXX

# 6. SAVE IT!
```

**Pricing:**
- FREE: 60 requests/minute
- No credit card needed
- Perfect for trying it out

---

## TASK 2: OLLAMA (FREE LOCAL AI) ✓

### **Install Ollama**

**Windows 11:**
```
1. Download: https://ollama.ai/download/windows
2. Run OllamaSetup.exe
3. Accept defaults
4. Restart computer
5. Ollama starts automatically
```

**Mac:**
```
1. Download: https://ollama.ai/download/macos
2. Drag Ollama to Applications
3. Double-click Ollama
4. Done! (runs in background)
```

**Linux (Ubuntu/Debian):**
```bash
curl https://ollama.ai/install.sh | sh
# Then start:
ollama serve
```

### **Download a Model**

Open terminal/command prompt:

```bash
# RECOMMENDED: Fast + Good (4B parameters)
ollama pull gemma3:4b

# OR other options:
ollama pull llama2:7b        # Smaller, simpler
ollama pull mistral:7b       # Balanced
ollama pull neural-chat:7b   # Better conversational
```

This downloads 2-7GB (one-time only).

### **Test Ollama**

```bash
# Start Ollama (if not already running)
ollama serve

# In another terminal:
ollama run gemma3:4b

# Type and press Enter:
What are the main ingredients in Esomeprazole?

# Should respond in ~2 seconds
# (All free, all offline!)
```

---

## TASK 3: CUSTOM EXTRACTION PROMPTS ✓

**Already created:** `src/services/customExtractionPrompts.ts`

### **How to Use:**

In your component:

```typescript
import { getPromptForDataType, formatPrompt } from '@/services/customExtractionPrompts';

// Auto-select prompt based on data type
const prompt = getPromptForDataType('orders');

// Or format with document content
const fullPrompt = formatPrompt('inventory', documentText);

// Use in API call
const response = await fetch('/api/ai-proxy', {
  method: 'POST',
  body: JSON.stringify({
    provider: 'claude',
    system: prompt.system,
    messages: [{ role: 'user', content: prompt.userPrompt }],
  })
});
```

### **Pharmaceutical-Specific Extraction:**

| Data Type | Prompts Optimized For |
|-----------|----------------------|
| **Sales Orders** | PO format, invoice numbers, LC/BIC, currencies |
| **Inventory** | Raw materials, units, API/Excipient categories |
| **Production** | Batch numbers, yield %, GMP compliance |
| **Accounting** | Invoices, payment terms, expense categories |
| **HR** | Employee roles, departments, certifications |
| **R&D** | Formulations, ingredients, development phases |
| **Procurement** | Vendor ratings, lead times, compliance |

---

## TASK 4: DEPLOY TO VERCEL ✓

### **Option A: Automatic Deployment (Recommended)**

```bash
cd /workspaces/Alwajer-Pharma-erp

# 1. Make sure all changes are committed
git status
# Should show: "working tree clean"

# 2. Push to GitHub (auto-deploys to Vercel)
git push origin claude/global-data-mapping-layer-XV0sZ

# 3. Vercel automatically:
#    - Builds your app
#    - Runs tests
#    - Deploys to live URL
#    - Takes ~3-5 minutes

# 4. Check status:
vercel logs
```

---

### **Option B: Vercel Dashboard (Visual)**

```
1. Go to: https://vercel.com/dashboard
2. Find project: "Alwajer-Pharma-erp"
3. Click it
4. Look at "Deployments" tab
5. Find your "claude/global-data-mapping-layer" branch
6. Click "Visit" to see live app
7. Or click "Redeploy" to redeploy
```

---

### **Option C: Direct Vercel CLI**

```bash
cd /workspaces/Alwajer-Pharma-erp

# Login to Vercel
vercel login

# Follow browser prompts to authenticate
# Return to terminal

# Deploy to production
vercel --prod

# Follow prompts:
# - Confirm project details
# - Set environment variables
# - Deploy!
```

---

## SETTING ENVIRONMENT VARIABLES

After deployment, add your API keys in Vercel:

### **Via Vercel Dashboard:**

```
1. https://vercel.com/dashboard
2. Select your project
3. Settings → Environment Variables
4. Add new variables:
   - Name: ANTHROPIC_API_KEY
     Value: sk-ant-api03-XXXXX
     Environments: Production, Preview, Development
   
   - Name: GEMINI_API_KEY
     Value: AIzaSy-XXXXX
     Environments: All
   
   - Name: OLLAMA_URL (optional)
     Value: http://localhost:11434
     Environments: Development only

5. Click "Save"
6. Redeploy: Deployments → Redeploy
```

### **Via Vercel CLI:**

```bash
# Add variable
vercel env add ANTHROPIC_API_KEY

# You'll be prompted:
# Enter value: sk-ant-api03-XXXXX
# Which environments? (select all)
# Done!

# Repeat for other keys
```

---

## FINAL TEST

Once deployed:

```
1. Open your app:
   https://your-project.vercel.app

2. Look for "🔥 Auto-Fill from File" button

3. Click it → Modal opens

4. Drag & drop a PDF/Excel/Image

5. Watch AI extract data!

6. See populated table

7. ✓ Success!
```

---

## EXPECTED FILE UPLOAD TIMES

| File Type | Size | Time |
|-----------|------|------|
| Small PDF | 1-2 MB | 10-15s |
| Excel sheet | 100 KB | 5-10s |
| Invoice image | 500 KB | 8-12s |
| Large document | 5+ MB | 20-30s |

---

## PRICING SUMMARY

| Service | Cost | Notes |
|---------|------|-------|
| **Vercel Hosting** | FREE | Generous free tier |
| **Claude API** | $0.003 per 1K input | Use sparingly |
| **Gemini API** | FREE | 60 req/min |
| **Ollama** | FREE | Offline, zero cost |
| **Supabase Database** | FREE | 500MB included |
| **Total Monthly** | **$0-10** | Depends on usage |

---

## TROUBLESHOOTING

### "API key not found" error
```
✓ Check Vercel → Settings → Environment Variables
✓ Make sure variable name is EXACTLY correct
✓ Redeploy after adding variables
✓ Wait 30 seconds for changes to apply
```

### "File upload fails"
```
✓ Check file size < 25 MB
✓ Check file format supported
✓ Check Claude API key is valid
✓ Check internet connection
```

### "Ollama not connecting"
```
✓ Make sure `ollama serve` is running
✓ Check URL is http://localhost:11434 (local only)
✓ Ollama doesn't work on Vercel (cloud)
✓ Use Ollama on your local computer only
```

### "Data not extracting correctly"
```
✓ Check file quality (not blurry/damaged)
✓ Try simpler document first
✓ Check Claude confidence score
✓ Verify document format is standard
```

---

## NEXT STEPS

### Immediate (Today):
- [ ] Get Claude API key
- [ ] Get Gemini API key
- [ ] Install Ollama
- [ ] Test Ollama locally

### This Week:
- [ ] Set env variables in Vercel
- [ ] Deploy to Vercel
- [ ] Test file uploads
- [ ] Train team

### This Month:
- [ ] Batch multi-file imports
- [ ] Create import templates
- [ ] Customize prompts for your documents
- [ ] Monitor API costs

---

## SUPPORT

**Issues?** Check logs:
```bash
# Vercel deployment logs
vercel logs

# Local build errors
npm run build

# Type checking
npx tsc --noEmit
```

**Questions?**
- Claude docs: https://docs.anthropic.com
- Gemini docs: https://ai.google.dev
- Ollama docs: https://github.com/ollama/ollama
- Vercel docs: https://vercel.com/docs

---

**You're all set! Your ERP is ready for deployment.** 🎉
