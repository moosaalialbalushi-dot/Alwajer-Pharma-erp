# Installation Guide — Al Wajer ERP v3

**For you and your team. Even if you're not technical, you can do this in 5 minutes!**

---

## ✅ What You Need

- Your project files (from GitHub or the ZIP you have)
- A terminal / command prompt
- Node.js installed (version 18 or higher)

---

## Step 1 — Replace App.tsx

This is the only file you **must** replace.

1. Open your project folder
2. Find the file called `App.tsx` inside the `src` folder (or root folder)
3. **Backup** the old file: rename it to `App.tsx.backup`
4. Copy the new `App.tsx` file into the same location

That's it for the main file!

---

## Step 2 — Install Dependencies

Open a terminal in your project folder and run:

```bash
pnpm install
```

Or if you use npm:

```bash
npm install
```

---

## Step 3 — Set Up Environment Variables

Create a file called `.env` in your project root:

```
VITE_GEMINI_API_KEY=your-gemini-key-here
VITE_SUPABASE_URL=https://dqsriohrazmlikwjwbot.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> **Tip**: Your Supabase URL and key are already in `supabaseClient.ts` as defaults — you only need this step if you want different credentials.

> **Tip**: Get your Gemini API key free at https://aistudio.google.com/app/apikey

---

## Step 4 — Test Locally

```bash
pnpm dev
```

Open your browser at **http://localhost:3000**

You should see the Al Wajer ERP dashboard. ✅

---

## Step 5 — Configure in the App (No Code Needed!)

Instead of editing files, you can configure everything **inside the app**:

1. Click the **⚙️ Settings** button in the sidebar (bottom left) or the gear icon in the top bar
2. Enter your Supabase URL, Supabase Key, and Gemini API Key
3. Click **Save & Reload**

The app will save your settings and reload. Done!

---

## Step 6 — Deploy to Vercel

### Option A: Using GitHub (Easiest)

1. Push your files to GitHub:
   ```bash
   git add .
   git commit -m "ERP v3 - ready to deploy"
   git push
   ```

2. Go to **https://vercel.com** and log in
3. Click **"Add New Project"**
4. Import your GitHub repository
5. In the **Environment Variables** section, add:
   - `VITE_GEMINI_API_KEY` → your Gemini key
   - `VITE_SUPABASE_URL` → your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` → your Supabase anon key
6. Click **Deploy**

Your ERP will be live at `https://your-project.vercel.app` in about 2 minutes! 🚀

### Option B: Vercel CLI

```bash
npx vercel --prod
```

---

## ❓ Troubleshooting

### App shows blank screen?
- Open browser console (F12) and check for errors
- Make sure all files are in the right place
- Run `pnpm install` again to reinstall dependencies

### AI not responding?
- Check your Gemini API key in Settings (⚙️ icon)
- Make sure it starts with `AIza`
- Get a free key at https://aistudio.google.com/app/apikey

### Supabase not connecting?
- The app works perfectly in **Local Mode** (without Supabase)
- Data will reset on page refresh in Local Mode
- To enable persistence: configure Supabase URL and key in Settings

### "Module not found" error?
```bash
pnpm install @google/genai @supabase/supabase-js lucide-react
```

### Port 3000 already in use?
Edit `vite.config.ts` and change `port: 3000` to `port: 3001`

---

## 📱 Testing on Your Phone / iPad

1. Find your computer's local IP address:
   - Mac: `ifconfig | grep "inet "`
   - Windows: `ipconfig`
2. Start the dev server: `pnpm dev`
3. On your phone/iPad, open browser and go to: `http://YOUR_IP:3000`

The ERP is fully responsive and works on all screen sizes!

---

## 📂 Files Overview

```
your-project/
├── App.tsx              ← 🔴 REPLACE THIS FILE
├── index.tsx            ← Entry point (don't change)
├── index.html           ← HTML shell (don't change)
├── geminiService.ts     ← Gemini AI functions (don't change)
├── supabaseClient.ts    ← Supabase connection (don't change)
├── exportUtils.ts       ← CSV export (don't change)
├── vite.config.ts       ← Build config (don't change)
├── package.json         ← Dependencies (don't change)
├── .env                 ← 🔑 ADD YOUR API KEYS HERE
└── vercel.json          ← Deployment config (don't change)
```

---

## 🎉 All Done!

Your ERP system now has:
- ✅ Works perfectly on phone, iPad, and laptop
- ✅ Upload progress bar (see exactly what's happening)
- ✅ Hamburger menu on mobile (☰)
- ✅ Settings modal (easy API configuration)
- ✅ AI file import (drop CSV/Excel and AI extracts data)
- ✅ CSV export from every module
- ✅ Supabase persistence (when configured)
- ✅ Gemini AI chatbot with live operational data

---

*Questions? All configuration can be done inside the app — no code editing needed.*
