
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { salesData } from './src/data/sales_data';
import { supplyChainData } from './src/data/supply_chain_data';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Activity, Package, ShoppingCart, Truck, MessageSquare, Upload, AlertTriangle, ChevronRight, 
  Send, Loader2, Search, CheckCircle2, Beaker, Zap, ChevronDown, LineChart, Calendar, 
  BarChart3, Globe, PackageSearch, Star, Menu, X, Factory, Boxes, BadgeDollarSign, 
  AlertCircle, Eye, Edit2, Plus, BrainCircuit, Lightbulb, DraftingCompass, Image as ImageIcon, 
  Settings, Trash2, ExternalLink, Save, Database, Wallet, Users, Calculator, Briefcase, FileSpreadsheet, FileText, Layers, PenTool, Download, LayoutDashboard, Grip, CheckSquare, Square, Paperclip, History, MoreVertical, FileDown, FolderOpen, RefreshCw, Mic, MicOff, Bolt, Wand2, Link, ShieldCheck, Key, CloudCog, UserPlus
} from 'lucide-react';
import { 
  Batch, InventoryItem, Order, Vendor, COOInsight, RDProject, BDLead, SampleStatus, 
  FileAnalysisResult, Expense, Employee, Market, AuditLog
} from './types';
import { 
  analyzeOperations, chatWithCOO, optimizeFormulation, analyzeImageOrFile, 
  brainstormSession, generateIndustrialDesign, editImage, transcribeAudio, quickInsight
} from './geminiService';
import { supabase } from './supabaseClient';
import { exportToCSV } from './exportUtils';

// --- INITIAL DATA ---

const INITIAL_BATCHES: Batch[] = [
  { id: 'B-25-101', product: 'Esomeprazole EC Pellets 22.5%', quantity: 5000, actualYield: 99.2, expectedYield: 100, status: 'In-Progress', timestamp: '2025-11-20', dispatchDate: '2025-12-15' },
];

const INITIAL_INVENTORY: InventoryItem[] = [
  { id: 'RM-001', sNo: '1', name: 'OMEPRAZOLE POWDER', category: 'API', requiredForOrders: 1105, stock: 15, balanceToPurchase: 1090, unit: 'kg', stockDate: '31.12.25' },
  { id: 'RM-002', sNo: '2', name: 'Esomeprazole', category: 'API', requiredForOrders: 1600, stock: 55, balanceToPurchase: 1545, unit: 'kg', stockDate: '31.12.25' },
  { id: 'RM-003', sNo: '3', name: 'Lansoprazole', category: 'API', requiredForOrders: 0, stock: 84, balanceToPurchase: 0, unit: 'kg', stockDate: '31.12.25' },
  { id: 'RM-026', sNo: '26', name: 'HPMC E-5', category: 'Excipient', requiredForOrders: 3000, stock: 8642, balanceToPurchase: -5642, unit: 'kg', stockDate: '31.12.25' },
  { id: 'RM-030', sNo: '30', name: 'TALCUM', category: 'Excipient', requiredForOrders: 1000, stock: 500, balanceToPurchase: 500, unit: 'kg', stockDate: '31.12.25' },
];

const INITIAL_ORDERS: Order[] = [
  { id: 'ORD-01', sNo: '1', date: '2025-01-19', invoiceNo: 'AWP/INV-01-25', customer: 'FEROZSONS', lcNo: '-', country: 'Pakistan', product: 'Esomeprazole EC Pellets 22.5%', quantity: 5000, rateUSD: 24, amountUSD: 120000, amountOMR: 46200, status: 'Pending' },
];

const INITIAL_EXPENSES: Expense[] = [
  { id: 'EXP-001', description: 'Monthly Electricity - Sohar Plant', category: 'Utilities', amount: 14500, status: 'Pending', dueDate: '2025-12-05' },
  { id: 'EXP-002', description: 'Astra Biotech API Payment', category: 'Raw Materials', amount: 85000, status: 'Paid', dueDate: '2025-11-15' },
  { id: 'EXP-003', description: 'Logistics - MENA Export', category: 'Logistics', amount: 3200, status: 'Pending', dueDate: '2025-12-10' },
];

const INITIAL_EMPLOYEES: Employee[] = [
  { id: 'EMP-001', name: 'Dr. Sarah Ahmed', role: 'Head of R&D', department: 'R&D', salary: 12000, status: 'Active', joinDate: '2023-05-12' },
  { id: 'EMP-002', name: 'John Doe', role: 'Production Manager', department: 'Production', salary: 8500, status: 'Active', joinDate: '2022-10-01' },
  { id: 'EMP-003', name: 'Alia Khan', role: 'QC Chemist', department: 'QC', salary: 5500, status: 'Active', joinDate: '2024-01-20' },
];

const INITIAL_RD: RDProject[] = [
  {
    id: 'RD-001',
    title: 'Esomeprazole Magnesium Trihydrate Formulation',
    status: 'Formulation',
    optimizationScore: 95,
    lastUpdated: '2026-02-27',
    batchSize: 100,
    batchUnit: 'Kg',
    totalRMC: 0,
    loss: 0.02,
    totalFinalRMC: 0,
    ingredients: [
      { sNo: '1',  name: 'Esomeprazole Magnesium Trihydrate', quantity: 28.5,   unit: 'Kg', rateUSD: 48,   cost: 0, role: 'API' },
      { sNo: '2',  name: 'NPS 20/24',                         quantity: 43.637, unit: 'Kg', rateUSD: 2.05, cost: 0, role: 'Filler' },
      { sNo: '3',  name: 'HPMC E5 (Layer 1)',                 quantity: 13.12,  unit: 'Kg', rateUSD: 7.25, cost: 0, role: 'Binder' },
      { sNo: '4',  name: 'Sodium Hydroxide Pellets (NaOH)',   quantity: 2.63,   unit: 'Kg', rateUSD: 1.80, cost: 0, role: 'Excipient' },
      { sNo: '5',  name: 'TiO2 (Layer 1)',                    quantity: 1.75,   unit: 'Kg', rateUSD: 3.50, cost: 0, role: 'Coating' },
      { sNo: '6',  name: 'HPMC E5 (Layer 2)',                 quantity: 7.98,   unit: 'Kg', rateUSD: 7.25, cost: 0, role: 'Binder' },
      { sNo: '7',  name: 'Drug Coat L30 D',                   quantity: 86.66,  unit: 'Kg', rateUSD: 4.20, cost: 0, role: 'Coating' },
      { sNo: '8',  name: 'DEP / PEG 6000',                    quantity: 0.95,   unit: 'Kg', rateUSD: 2.80, cost: 0, role: 'Plasticizer' },
      { sNo: '9',  name: 'TiO2 (Layer 2)',                    quantity: 0.25,   unit: 'Kg', rateUSD: 3.50, cost: 0, role: 'Coating' },
      { sNo: '10', name: 'Talcum',                             quantity: 0.42,   unit: 'Kg', rateUSD: 1.20, cost: 0, role: 'Lubricant' },
      { sNo: '11', name: 'Tween 80',                           quantity: 0.04,   unit: 'Kg', rateUSD: 3.00, cost: 0, role: 'Surfactant' },
      { sNo: '12', name: 'Sodium Hydroxide Pellets (NaOH) 2',  quantity: 0.02,   unit: 'Kg', rateUSD: 1.80, cost: 0, role: 'Excipient' },
    ]
  }
];

const INITIAL_VENDORS: Vendor[] = [
  { id: 'V-001', name: 'Astra Biotech API', category: 'API', rating: 4.8, status: 'Verified', country: 'Germany' },
  { id: 'V-002', name: 'Luzhou Chemicals', category: 'Excipient', rating: 4.2, status: 'Audit Pending', country: 'China' },
];

const INITIAL_BD: BDLead[] = [
  { id: 'BD-01', targetMarket: 'GCC - Kuwait', opportunity: 'Public Tender Omeprazole', potentialValue: '$1.2M', status: 'Negotiation', probability: 75 },
];

const INITIAL_SAMPLES: SampleStatus[] = [
  { id: 'SMP-102', product: 'Esomeprazole 40mg Pellets', destination: 'Ministry of Health, UAE', quantity: '5kg', status: 'QC Testing' },
];

const INITIAL_MARKETS: Market[] = [
    { id: 'M-01', name: 'UAE', region: 'GCC', status: 'Active' },
    { id: 'M-02', name: 'Saudi Arabia', region: 'GCC', status: 'Active' },
];

// --- WIDGET TYPES ---
type WidgetId = 
  | 'stats_yield' | 'stats_orders' | 'stats_markets' | 'stats_pipeline' | 'stats_inventory' | 'stats_vendors'
  | 'stats_expenses' | 'stats_liability' | 'stats_staff' | 'stats_rd' | 'stats_samples'
  | 'feed_ai' | 'feed_batches' | 'feed_inventory' | 'feed_orders' | 'feed_hr' | 'feed_finance';

interface WidgetDef {
  id: WidgetId;
  label: string;
  category: string;
  type: 'stat' | 'feed';
  default: boolean;
}

const ALL_WIDGETS: WidgetDef[] = [
  { id: 'stats_yield', label: 'Yield Accuracy', category: 'Production', type: 'stat', default: true },
  { id: 'stats_orders', label: 'Pending Orders', category: 'Sales', type: 'stat', default: true },
  { id: 'stats_markets', label: 'Active Markets', category: 'BD', type: 'stat', default: true },
  { id: 'stats_pipeline', label: 'Pipeline Value', category: 'BD', type: 'stat', default: true },
  { id: 'stats_inventory', label: 'Critical Stock', category: 'Inventory', type: 'stat', default: false },
  { id: 'stats_vendors', label: 'Active Vendors', category: 'Procurement', type: 'stat', default: false },
  { id: 'stats_expenses', label: 'Total Expenses', category: 'Accounting', type: 'stat', default: false },
  { id: 'stats_liability', label: 'Liabilities', category: 'Accounting', type: 'stat', default: false },
  { id: 'stats_staff', label: 'Staff Count', category: 'HR', type: 'stat', default: false },
  { id: 'stats_rd', label: 'Active R&D', category: 'R&D', type: 'stat', default: false },
  { id: 'stats_samples', label: 'Sample Status', category: 'Samples', type: 'stat', default: false },
  
  { id: 'feed_ai', label: 'AI Operations Feed', category: 'AI Ops', type: 'feed', default: true },
  { id: 'feed_batches', label: 'Recent Batches', category: 'Production', type: 'feed', default: true },
  { id: 'feed_inventory', label: 'Inventory Alerts', category: 'Inventory', type: 'feed', default: false },
  { id: 'feed_orders', label: 'Recent Orders', category: 'Sales', type: 'feed', default: false },
  { id: 'feed_finance', label: 'Expense Ledger', category: 'Accounting', type: 'feed', default: false },
  { id: 'feed_hr', label: 'HR Updates', category: 'HR', type: 'feed', default: false },
];

interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    text: string;
    image?: string;
    timestamp: number;
}

interface BrainstormSession {
    id: string;
    topic: string;
    messages: ChatMessage[];
    date: string;
}

// --- API CONFIG TYPES ---
interface ApiConfig {
    claudeKey: string;
    notebookLmSource: string;
    supabaseUrl: string;
    supabaseKey: string;
}

// NEW: Upload Progress Interface
interface UploadProgress {
    isUploading: boolean;
    fileName: string;
    progress: number;
    status: 'uploading' | 'processing' | 'complete' | 'error';
    message: string;
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'production' | 'inventory' | 'sales' | 'procurement' | 'ai' | 'rd' | 'bd' | 'samples' | 'brainstorm' | 'industrial' | 'accounting' | 'hr' | 'history'>('dashboard');
  
  // Data State
  const [batches, setBatches] = useState<Batch[]>(INITIAL_BATCHES);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [vendors, setVendors] = useState<Vendor[]>(INITIAL_VENDORS);
  const [salesDocMenu, setSalesDocMenu] = useState<string|null>(null);
  const [bdLeads, setBdLeads] = useState<BDLead[]>(INITIAL_BD);
  const [samples, setSamples] = useState<SampleStatus[]>(INITIAL_SAMPLES);
  const [calcData, setCalcData] = useState({ product: '', volume: 0, targetPrice: 0, rmc: 0, labor: 0, packing: 0 });
  const [calcResults, setCalcResults] = useState<any>(null);
  const calcInitialRD = (projects: any[]) => projects.map(p => {
    const ings = p.ingredients.map((i: any) => ({ ...i, cost: Number((i.quantity * i.rateUSD).toFixed(3)) }));
    const totalRMC = Number(ings.reduce((s: number, i: any) => s + i.cost, 0).toFixed(3));
    const totalFinalRMC = Number(((totalRMC / p.batchSize) + p.loss).toFixed(3));
    return { ...p, ingredients: ings, totalRMC, totalFinalRMC };
  });
  const CALC_RD = calcInitialRD(INITIAL_RD);
  const [rdProjects, setRdProjects] = useState<RDProject[]>(CALC_RD);
  const [markets, setMarkets] = useState<Market[]>(INITIAL_MARKETS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  
  // Dashboard Config State
  const [visibleWidgets, setVisibleWidgets] = useState<WidgetId[]>(() => {
    try {
      const saved = localStorage.getItem('erp_dashboard_widgets');
      return saved ? JSON.parse(saved) : ALL_WIDGETS.filter(w => w.default).map(w => w.id);
    } catch (e) { return ALL_WIDGETS.filter(w => w.default).map(w => w.id); }
  });
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // API Config State
  const [apiConfig, setApiConfig] = useState<ApiConfig>(() => {
      try {
          const saved = localStorage.getItem('erp_api_config');
          const savedSbUrl = localStorage.getItem('erp_supabase_url');
          const savedSbKey = localStorage.getItem('erp_supabase_key');
          
          const parsed = saved ? JSON.parse(saved) : {};
          
          return { 
              claudeKey: parsed.claudeKey || '', 
              notebookLmSource: parsed.notebookLmSource || '',
              supabaseUrl: savedSbUrl || '',
              supabaseKey: savedSbKey || ''
          };
      } catch (e) { return { claudeKey: '', notebookLmSource: '', supabaseUrl: '', supabaseKey: '' }; }
  });
  const [activeProvider, setActiveProvider] = useState<'Gemini' | 'Claude' | 'DeepSeek' | 'NotebookLM'>('Gemini');

  // App State
  const [selectedRD, setSelectedRD] = useState<RDProject | null>(CALC_RD[0]);
  const [insights, setInsights] = useState<COOInsight[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  
  // NEW: Upload Progress State
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    isUploading: false,
    fileName: '',
    progress: 0,
    status: 'uploading',
    message: ''
  });
  
  // Chat & Brainstorm State
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'model', text: string}[]>(() => {
    try {
      const saved = localStorage.getItem('erp_chat_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });
  
  // Industrial Chat State
  const [industrialChat, setIndustrialChat] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('erp_industrial_chat');
      return saved ? JSON.parse(saved) : [{id: '1', role: 'model', text: 'Welcome to the Industrial Design Studio. I can assist with facility layouts, machine design, and packaging concepts. How can I help?', timestamp: Date.now()}];
    } catch (e) { return [{id: '1', role: 'model', text: 'Welcome to the Industrial Design Studio. I can assist with facility layouts, machine design, and packaging concepts. How can I help?', timestamp: Date.now()}]; }
  });
  const [industrialInput, setIndustrialInput] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [imageSize, setImageSize] = useState('1K');
  const [pendingIndustrialImage, setPendingIndustrialImage] = useState<string | null>(null);
  const [pendingIndustrialMime, setPendingIndustrialMime] = useState<string | null>(null);
  
  // Brainstorm Chat State
  const [brainstormSessions, setBrainstormSessions] = useState<BrainstormSession[]>(() => {
      try {
       const saved = localStorage.getItem('erp_brainstorm_sessions');
       return saved ? JSON.parse(saved) : [];
      } catch (e) { return []; }
  });
  const [currentBrainstormId, setCurrentBrainstormId] = useState<string | null>(null);
  const [brainstormInput, setBrainstormInput] = useState('');

  // AI Command Center State
  const [aiCmdTab, setAiCmdTab] = useState<'chat'|'industrial'|'brainstorm'|'skills'>('chat');
  const [savedSkills, setSavedSkills] = useState<{id:string, name:string, provider:'Claude'|'Gemini'|'NotebookLM', description:string, prompt:string, category:string, usageCount:number, createdAt:string}[]>(() => {
    try {
      const AI_STUDIO_SKILLS = [
  {
    "id": "AISTUDIO-biotech-facility-developer",
    "name": "biotech-facility-developer",
    "provider": "Gemini",
    "description": "Workflow for developing integrated biotech and pharmaceutical-grade manufacturing facilities. Use for: regulatory map...",
    "prompt": "---\nname: biotech-facility-developer\ndescription: \"Workflow for developing integrated biotech and pharmaceutical-grade manufacturing facilities. Use for: regulatory mapping, technical process design, financial modeling with land incentives, and GMP-compliant facility visualization.\"\n---\n\n# Biotech Facility Developer\n\nThis skill formalizes the end-to-end process for developing high-tech biotech facilities, from raw material sourcing to global export readiness.\n\n## 1. Strategic Discovery & Regulatory Mapping\n- **Identify Target Markets**: Map the regulatory requirements for all target regions (e.g., US FDA MoCRA, GCC SFDA, ASEAN ACD).\n- **Technical Parameters**: Define exact extraction and processing settings (e.g., pH, temperature, pressure for CO2 extraction).\n- **Resource**: Refer to `references/regulatory_mapping.md` for global standards.\n\n## 2. Financial Modeling & Land Strategy\n- **Incentive Analysis**: Evaluate land lease options (e.g., Madayn vs. Free-Zones) and incorporate grace periods into the cash flow model.\n- **CAPEX/OPEX**: Build a 5-year model including specialized machinery (Supercritical CO2, Hydrolysis reactors) and utility hubs.\n\n## 3. Facility Design & Visualization\n- **Unified Layout**: Design a single structure integrating Warehouse, Production, Labs, Utilities, and Admin.\n- **Zoning Compliance**: Implement the 3-Zone cascading pressure system (Negative $\\to$ Neutral $\\to$ Positive).\n- **Warehouse Integration**: Include Quarantine, QC Sampling, and Dispensing suites.\n- **Resource**: Refer to `references/facility_zoning.md` for detailed zoning and flow standards.\n\n## 4. Investor & Authority Presentation\n- **Scientific Sustainability**: Frame the narrative around circular economy, high-science clinicals, and unique value propositions (e.g., Halal-certified collagen).\n- **Visual Evidence**: Use 2D architectural plans and 3D isometric cutaways to demonstrate technical readiness.\n\n## Workflow Summary\n1. Analyze raw material and target market regulatory requirements.\n2. Optimize technical process parameters for pharmaceutical-grade output.\n3. Model financials including local land incentives and utility costs.\n4. Design a unified, GMP-compliant facility layout.\n5. Generate a high-stakes presentation script for investors and authorities.\n",
    "category": "Operations",
    "usageCount": 0,
    "createdAt": "2026-03-04"
  },
  {
    "id": "AISTUDIO-brainstorming_1",
    "name": "brainstorming",
    "provider": "Gemini",
    "description": "Facilitate creative brainstorming sessions and organize/refine ideas using 'Deferred Judgment' principles. Use for: g...",
    "prompt": "---\nname: brainstorming\ndescription: \"Facilitate creative brainstorming sessions and organize/refine ideas using 'Deferred Judgment' principles. Use for: guiding live brainstorming, generating creative ideas, and evaluating/refining concepts.\"\n---\n\n# Brainstorming Skill\n\nThis skill helps facilitate a high-volume idea generation process followed by a structured evaluation phase, based on the principles of Alex Osborn and IDEO.\n\n## Core Workflow\n\nBrainstorming is divided into two distinct phases to prevent premature criticism from stifling creativity.\n\n### Phase 1: Idea Generation (Divergent Thinking)\n\nThe goal is **quantity over quality**. Follow these rules:\n1.  **Defer Judgment**: No criticism or evaluation allowed.\n2.  **Encourage Wild Ideas**: The more unconventional, the better.\n3.  **Build on Others**: Use \"Yes, and...\" to expand on existing thoughts.\n4.  **Stay Focused**: Keep the session within a set time limit (e.g., 10-20 minutes).\n\n**Actionable Steps:**\n- Define the problem clearly before starting.\n- Record every idea immediately without filtering.\n- If the flow slows down, suggest a new angle or perspective.\n\n### Phase 2: Idea Evaluation (Convergent Thinking)\n\nOnce the generation phase ends, shift to refining and organizing the most promising concepts.\n\n**Actionable Steps:**\n1.  **Organize**: Group similar ideas into themes or categories.\n2.  **Discuss**: Briefly clarify any ambiguous ideas.\n3.  **Refine**: Combine or improve ideas based on feasibility and impact.\n4.  **Select**: Use voting or a matrix to identify actionable solutions.\n\n## Templates\n\n### Brainstorming Session Log\nUse the template in `templates/session_log.md` to record sessions.\n\n## References\n- **Methodology**: See `references/principles.md` for the history and theory behind effective brainstorming.\n- **Facilitation Tips**: See `references/facilitation.md` for advanced techniques to handle group dynamics.\n",
    "category": "AI Innovation",
    "usageCount": 0,
    "createdAt": "2026-03-04"
  },
  {
    "id": "AISTUDIO-collaborative-skill-builder",
    "name": "collaborative-skill-builder",
    "provider": "Gemini",
    "description": "Guide for collaboratively creating new skills by defining scope, structuring content, and iteratively refining detail...",
    "prompt": "---\nname: collaborative-skill-builder\ndescription: \"Guide for collaboratively creating new skills by defining scope, structuring content, and iteratively refining details with user input. Use for: developing new skills from scratch, enhancing existing skills, or formalizing complex workflows into reusable capabilities.\"\n---\n\n# Collaborative Skill Builder\n\nThis skill provides a structured, collaborative workflow for developing new Manus skills or enhancing existing ones. It leverages iterative feedback and progressive disclosure to ensure the created skill is comprehensive, well-organized, and directly addresses the user's needs. This process mirrors how Manus itself develops new capabilities with user guidance.\n\n## Core Workflow for Skill Creation\n\nThe collaborative skill building process follows these key phases:\n\n1.  **Understand User Requirements**: Begin by engaging the user to thoroughly understand the desired skill's purpose, scope, and specific functionalities. This involves asking clarifying questions and gathering concrete examples of how the skill will be used.\n    *   See [references/skill-definition-questions.md](references/skill-definition-questions.md) for a guide on effective questioning.\n\n2.  **Propose Initial Structure**: Based on the gathered requirements, propose a high-level structure for the skill, typically utilizing a progressive disclosure pattern. This includes outlining the main `SKILL.md` content and suggesting initial reference files for detailed information.\n\n3.  **Iterative Content Development**: Collaboratively develop the skill's content. This involves:\n    *   Drafting the `SKILL.md` with an overview and navigation to reference files.\n    *   Creating and populating specialized reference files (`references/`) with detailed information, workflows, or technical protocols.\n    *   Incorporating user feedback to refine existing content and add new sections (e.g., specific regulations, advanced technologies, utility requirements).\n    *   Ensuring content adheres to best practices for technical writing, including the use of paragraphs, tables, and inline citations where appropriate.\n\n4.  **Multi-Model Enhancement**: Leverage advanced AI models (Anthropic Claude and Google Gemini) to cross-check, expand, and refine the skill's content, particularly for SOPs, operational intelligence, and information cross-referencing.\n    *   See [references/multi-model-enhancement.md](references/multi-model-enhancement.md) for detailed protocols on using Claude and Gemini\n5.  **Validation and Delivery**: Once the content is developed and refined, validate the skill\\'s structure and YAML frontmatter using the `skill-creator`\\'s validation script. Finally, deliver the completed skill to the user.\n\n## How to Use This Skill\n\nTo initiate the collaborative skill building process, simply describe the new skill you wish to create. The agent will then guide you through the steps outlined above, asking for your input at each stage to ensure the skill is tailored to your exact specifications. Be prepared to provide details, examples, and feedback to shape the skill effectively.\n",
    "category": "AI Innovation",
    "usageCount": 0,
    "createdAt": "2026-03-04"
  },
  {
    "id": "AISTUDIO-electron-upgrade-advisor",
    "name": "electron-upgrade-advisor",
    "provider": "Gemini",
    "description": "Guide the process of upgrading Chromium and Node.js within Electron applications. Use for: planning Electron upgrades...",
    "prompt": "---\nname: electron-upgrade-advisor\ndescription: \"Guide the process of upgrading Chromium and Node.js within Electron applications. Use for: planning Electron upgrades, handling API deprecations, and managing native module compatibility.\"\n---\n\n# Electron Upgrade Advisor\n\nThis skill provides a step-by-step playbook for navigating the complex process of upgrading the Chromium engine and Node.js environment within Electron applications.\n\n## Usage Guidelines\n\nUse this skill when maintaining or upgrading an Electron-based application to ensure a smooth transition between versions.\n\n1. **Plan the Upgrade**: Follow a \"two-phase\" process for large version jumps (e.g., upgrading to an intermediate version first).\n2. **Handle Deprecations**: Identify and resolve API changes or removed features in the new Chromium/Electron version.\n3. **Manage Native Modules**: Audit and update native dependencies that may be affected by changes in the V8 engine or Node.js version.\n\n## Core Workflow\n\n- **Phase 1: Preparation**: Update Electron to the target version in `package.json` and identify immediate breaking changes.\n- **Phase 2: Implementation**: Resolve API deprecations, update build flags, and recompile native modules.\n- **Phase 3: Verification**: Run comprehensive tests to catch subtle behavior changes in the embedded browser.\n\n## Examples\n\n### Upgrade Planning\n- **User Request**: \"Help upgrade our Electron app from Chrome 100 to 110.\"\n- **Skill Action**: Outline the necessary Electron version jumps, list known API changes, and provide a checklist for updating native modules.\n\n### Troubleshooting\n- **User Request**: \"Audit what's needed to update Electron.\"\n- **Skill Action**: Review the current version, list replaced functions, and suggest updates to the build toolchain.\n\n## Limitations\n\n- **App Specificity**: May not account for highly custom native modules or non-standard hacks.\n- **Version Variance**: Steps may vary significantly depending on the specific version jump; always cross-reference with official Electron release notes.\n- **Testing Requirement**: Cannot guarantee behavior consistency; thorough manual and automated testing is always required after an upgrade.\n",
    "category": "AI Innovation",
    "usageCount": 0,
    "createdAt": "2026-03-04"
  },
  {
    "id": "AISTUDIO-facility-visualizer-compliance_1",
    "name": "facility-visualizer-compliance",
    "provider": "Gemini",
    "description": "Professional visualization and regulatory compliance analysis for industrial and pharmaceutical facilities. Use for: ...",
    "prompt": "---\nname: facility-visualizer-compliance\ndescription: \"Professional visualization and regulatory compliance analysis for industrial and pharmaceutical facilities. Use for: transforming blueprints into 2D/3D models, analyzing personnel/material flow, and ensuring US FDA (21 CFR 211) or other regulatory compliance. Integrates Google Gemini for advanced layout identification.\"\n---\n\n# Facility Visualizer & Compliance\n\nThis skill provides a structured workflow for transforming facility blueprints into professional visualizations while ensuring regulatory compliance and optimized operational flow.\n\n## Workflow\n\n### 1. Layout Analysis & Identification\n- **Advanced Identification**: Use the **Google Gemini API** (`GEMINI_API_KEY`) to analyze complex blueprints. Gemini is highly effective at identifying room labels, ISO classifications, and pressure differentials from scratch images.\n- Identify all functional areas (storage, production, labs, admin).\n- Map existing entry/exit points for personnel and materials.\n- Identify \"clean\" vs. \"dirty\" zones and pressure cascades.\n\n### 2. Regulatory Research\n- For pharmaceutical facilities, refer to `references/fda_compliance_211_42.md`.\n- Verify requirements for defined areas, segregation, and environmental controls.\n- Check for specific industry standards (e.g., cGMP, ISO 14644).\n\n### 3. Visualization Generation\n- **2D Enhancement**: Use `generate_image` to create a clean, CAD-style architectural plan. Refer to `templates/architectural_reference.png` for the desired professional standard (including legends, ISO grades, and flow arrows).\n- **3D Modeling**: Use `generate_image` with prompts for \"isometric cutaway view\" to show internal structure, equipment, and spatial relationships.\n\n### 4. Flow & Compliance Reporting\n- Analyze \"Man and Material\" movements.\n- Identify potential bottlenecks or contamination risks.\n- Provide operational recommendations (e.g., airlocks, gowning protocols, pressure differentials).\n\n## Best Practices for Prompts\n\n### 2D Layouts\n- \"Professional 2D architectural floor plan, CAD-style, clean lines, light gray palette, labeled rooms, flow arrows for personnel and materials. Style reference: templates/architectural_reference.png.\"\n\n### 3D Models\n- \"3D isometric cutaway view, architectural visualization, realistic lighting, epoxy floors, stainless steel equipment, high-angle perspective.\"\n\n## Tool Integration: Google Gemini\nWhen analyzing blueprints, use the following pattern with the Gemini API:\n1. Upload the blueprint image.\n2. Prompt Gemini to: \"Identify all rooms, their ISO classifications, pressure differentials (Pa), and the flow of materials (red arrows) and personnel (blue arrows) in this pharmaceutical facility layout.\"\n\n## Resources\n- `references/fda_compliance_211_42.md`: Detailed FDA 21 CFR 211.42 requirements.\n- `templates/architectural_reference.png`: High-standard architectural layout example.\n",
    "category": "Operations",
    "usageCount": 0,
    "createdAt": "2026-03-04"
  },
  {
    "id": "AISTUDIO-github-gem-seeker",
    "name": "github-gem-seeker",
    "provider": "Gemini",
    "description": ">",
    "prompt": "---\nname: github-gem-seeker\ndescription: >\n  Search GitHub for battle-tested solutions instead of reinventing the wheel. Use when\n  the user's problem is universal enough that open source developers have probably\n  solved it already—especially for: format conversion (video/audio/image/document),\n  media downloading, file manipulation, web scraping/archiving, automation scripts,\n  and CLI tools. Prefer this skill over writing custom code for well-trodden problems.\n---\n\n# GitHub Gem Seeker\n\nFind and use battle-tested open source projects on GitHub to solve the user's problem immediately. After successfully solving the problem, offer to package the solution into a reusable skill.\n\n## Core Philosophy\n\nClassic open source projects, tested by countless users over many years, are far more reliable than code written from scratch. **Solve the problem first, skill-ify later.**\n\n## Workflow\n\n### Step 1: Understand the Need\n\nClarify what the user wants to accomplish. Ask only if truly ambiguous:\n- What specific problem are you trying to solve?\n- What format/input/output do you expect?\n\n### Step 2: Find the Right Tool\n\nSearch for GitHub projects using effective query patterns:\n\n| Need Type | Query Pattern | Example |\n|-----------|---------------|---------|\n| Tool/utility | `github [task] tool` | `github video download tool` |\n| Library | `github [language] [function] library` | `github python pdf library` |\n| Alternative | `github [known-tool] alternative` | `github ffmpeg alternative` |\n\n### Step 3: Evaluate Quality (Quick Check)\n\nAssess candidates using key indicators:\n\n| Indicator | Gem Signal | Warning Signal |\n|-----------|------------|----------------|\n| Stars | 1k+ solid, 10k+ excellent, 50k+ legendary | <100 for mature projects |\n| Last commit | Within 6 months | >2 years ago |\n| Documentation | Clear README, examples | Sparse or outdated docs |\n\n### Step 4: Solve the Problem\n\n**This is the priority.** Install the tool and use it to solve the user's actual problem:\n\n1. Install the chosen tool (pip, npm, apt, or direct download)\n2. Run it with the user's input/files\n3. Deliver the result to the user\n4. Troubleshoot if needed—iterate until solved\n\n### Step 5: Credit the Gem & Offer Next Steps (Post-Success Only)\n\n**Only after the problem is successfully solved:**\n\n1. **Credit the open source project** — Always share the GitHub repo URL and encourage support:\n\n   > \"This was powered by **[Project Name]** — an amazing open source project!\n   > GitHub: [URL]\n   > If it helped you, consider giving it a ⭐ star to support the maintainers.\"\n\n2. **Offer to skill-ify** — Optionally mention:\n\n   > \"If you'll need this again, I can package it into a reusable skill for instant use next time.\"\n\nDo NOT skip crediting the project. Open source thrives on recognition.\n\n## Quality Tiers\n\n| Tier | Criteria | Examples |\n|------|----------|----------|\n| **Legendary** | 50k+ stars, industry standard | FFmpeg, ImageMagick, yt-dlp |\n| **Excellent** | 10k+ stars, strong community | Pake, ArchiveBox |\n| **Solid** | 1k+ stars, well-documented | Most maintained tools |\n| **Promising** | <1k stars, active development | Newer niche projects |\n\nPrefer higher tiers for reliability.\n\n## Example Interaction\n\n**User:** I need to download this YouTube video: [link]\n\n**Correct approach:**\n1. Identify yt-dlp as the legendary-tier solution\n2. Install yt-dlp\n3. Download the video for the user\n4. Deliver the downloaded file\n5. *After success:* \"This was powered by **yt-dlp** — https://github.com/yt-dlp/yt-dlp — give it a ⭐ if it helped! If you download videos often, I can turn this into a skill for instant use next time.\"\n\n**Wrong approach:**\n- ❌ \"I found yt-dlp, want me to make a skill for it?\"\n- ❌ Presenting options without solving the problem\n\n## Common Gems Reference\n\n| Category | Go-to Gems |\n|----------|------------|\n| Video/Audio processing | FFmpeg, yt-dlp |\n| Image processing | ImageMagick, sharp |\n| PDF manipulation | pdf-lib, PyMuPDF |\n| Web scraping | Playwright, Puppeteer, Scrapy |\n| Format conversion | Pandoc, FFmpeg |\n| Archiving | ArchiveBox |\n| Desktop app packaging | Electron, Tauri, Pake |\n",
    "category": "AI Innovation",
    "usageCount": 0,
    "createdAt": "2026-03-04"
  },
  {
    "id": "AISTUDIO-nextjs-cache-optimizer",
    "name": "nextjs-cache-optimizer",
    "provider": "Gemini",
    "description": "Optimize Next.js caching and rendering strategies. Use for: implementing Partial Prerendering (PPR), configuring ISR/...",
    "prompt": "---\nname: nextjs-cache-optimizer\ndescription: \"Optimize Next.js caching and rendering strategies. Use for: implementing Partial Prerendering (PPR), configuring ISR/SSG, and optimizing data fetching cache.\"\n---\n\n# Next.js Cache Optimizer\n\nThis skill specializes in optimizing Next.js applications by leveraging advanced caching and rendering features to ensure maximum performance.\n\n## Usage Guidelines\n\nUse this skill when tasked with improving the load speed or efficiency of a Next.js application.\n\n1. **Identify Caching Opportunities**: Analyze pages for static vs. dynamic content and suggest appropriate caching strategies (ISR, SSG, etc.).\n2. **Implement Advanced Features**: Guide the implementation of Partial Prerendering (PPR) and React Server Components.\n3. **Optimize Data Fetching**: Ensure proper use of the `cache()` wrapper and granular caching directives in `fetch` calls.\n\n## Core Strategies\n\n- **Partial Prerendering (PPR)**: Combine static shells with dynamic holes for fast initial loads.\n- **Granular Caching**: Use `export const revalidate` and specific cache tags to control data freshness.\n- **Server Components**: Maximize the use of Server Components to reduce client-side JavaScript and enable server-side caching.\n\n## Examples\n\n### Caching Audit\n- **User Request**: \"Review this Next.js page for caching issues.\"\n- **Skill Action**: Identify missing `revalidate` constants or opportunities to use `force-static`, and provide the necessary code changes.\n\n### Performance Optimization\n- **User Request**: \"Optimize my Next.js app for performance.\"\n- **Skill Action**: Suggest splitting pages into cached components and implementing PPR for dynamic sections.\n\n## Limitations\n\n- **Version Specific**: Best suited for recent versions of Next.js that support App Router and advanced caching features.\n- **Implementation Complexity**: Requires a deep understanding of the application's data flow to avoid stale data issues.\n",
    "category": "Dev Tools",
    "usageCount": 0,
    "createdAt": "2026-03-04"
  },
  {
    "id": "AISTUDIO-pharma-food-innovation",
    "name": "pharma-food-innovation",
    "provider": "Gemini",
    "description": "Comprehensive skill for brainstorming, innovation, R&D, product implementation, and global regulatory compliance in P...",
    "prompt": "---\nname: pharma-food-innovation\ndescription: \"Comprehensive skill for brainstorming, innovation, R&D, product implementation, and global regulatory compliance in Pharmaceuticals, Food, Multi-ingredient Extractions, and Cosmetic Development. This includes guidance on cGMP, US FDA, SFDA regulations, utility requirements, waste management, and production suitability. Use for: generating new product ideas, optimizing R&D processes, ensuring cGMP compliance, navigating international regulations for market registration, and establishing suitable production environments.\"\n---\n\n# Pharma-Food Innovation & Regulatory Compliance Skill\n\nThis skill provides a structured approach to innovation, research and development, and regulatory compliance for products in the Pharmaceutical, Food, Multi-ingredient Extraction, and Cosmetic sectors. It integrates best practices for ideation, technical development, quality assurance (cGMP), and market registration, alongside critical considerations for facility operations.\n\n## Core Workflows\n\nThis skill guides you through the following key phases:\n\n1.  **Ideation & Brainstorming**: Generate and refine new product concepts.\n    *   See [references/brainstorming.md](references/brainstorming.md) for detailed frameworks and techniques.\n\n2.  **Research & Development (R&D) and Implementation**: Conduct technical development, formulation, and process optimization.\n    *   See [references/rd-implementation.md](references/rd-implementation.md) for R&D workflows and cGMP integration.\n    *   See [references/technical-protocols.md](references/technical-protocols.md) for detailed extraction technologies, manufacturing protocols (lyophilization, spray drying), and raw material processing.\n\n3.  **Facility & Production Suitability**: Address critical aspects of manufacturing environment, utility management, and waste handling.\n    *   See [references/utility-requirements.md](references/utility-requirements.md) for guidelines on utilities (e.g., HVAC, WFI, clean steam).\n    *   See [references/waste-management.md](references/waste-management.md) for strategies on waste stream characterization and disposal.\n    *   See [references/production-suitability.md](references/production-suitability.md) for process validation, equipment qualification, and facility design principles.\n\n4.  **Regulatory Compliance & Market Registration**: Navigate complex regulatory landscapes for product approval and market entry.\n    *   See [references/regulatory-cgmp.md](references/regulatory-cgmp.md) for general cGMP principles.\n    *   See [references/regulatory-us-fda.md](references/regulatory-us-fda.md) for specific US FDA requirements.\n    *   See [references/regulatory-sfda.md](references/regulatory-sfda.md) for specific SFDA requirements.\n\n## How to Use This Skill\n\nBegin by identifying your current phase in the product lifecycle (ideation, R&D, facility setup, or regulatory). Then, consult the relevant reference document for detailed guidance, checklists, and best practices. This skill will help you generate ideas, structure your development process, ensure your products meet the stringent quality and safety standards required for global markets, and establish a compliant and efficient production environment.\n",
    "category": "R&D",
    "usageCount": 0,
    "createdAt": "2026-03-04"
  },
  {
    "id": "AISTUDIO-prompt-lookup",
    "name": "prompt-lookup",
    "provider": "Gemini",
    "description": "Access a library of community-curated AI prompts from mcpmarket.com. Use for: finding proven prompt templates for mar...",
    "prompt": "---\nname: prompt-lookup\ndescription: \"Access a library of community-curated AI prompts from mcpmarket.com. Use for: finding proven prompt templates for marketing, coding, data analysis, and general tasks to improve agent results.\"\n---\n\n# Prompt Lookup\n\nThis skill provides access to a vast library of community-curated AI prompts, acting as a prompt search engine to improve task execution by using proven patterns.\n\n## Usage Guidelines\n\nWhen a task requires a specific or complex prompt structure (e.g., writing a marketing email, analyzing a CSV, or specialized coding), use this skill to retrieve an appropriate template.\n\n1. **Search for Prompts**: Use the browser to search `mcpmarket.com` or other prompt repositories for the specific task.\n2. **Retrieve and Adapt**: Once a suitable prompt is found, adapt it to the current user's specific context and data.\n3. **Apply Best Practices**: Prioritize prompts that are highly rated or frequently used by the community.\n\n## Examples\n\n### Marketing Email\n- **User Request**: \"Write a cold email for my new SaaS product.\"\n- **Skill Action**: Look up \"cold email SaaS\" on prompt repositories, find a high-performing template, and fill in the product details.\n\n### Data Analysis\n- **User Request**: \"Analyze this CSV file for trends.\"\n- **Skill Action**: Look up \"CSV data analysis trends\" to find a structured prompt that guides the AI through systematic data exploration.\n\n## Limitations\n\n- **Niche Tasks**: May not have specific prompts for extremely niche or brand-new domains.\n- **Quality Variance**: Community prompts vary in quality; always review and refine the retrieved prompt before final use.\n- **Context Blindness**: The skill provides general templates and does not have inherent knowledge of the user's private data unless provided in the request.\n",
    "category": "AI Innovation",
    "usageCount": 0,
    "createdAt": "2026-03-04"
  },
  {
    "id": "AISTUDIO-react-best-practices_1",
    "name": "react-best-practices",
    "provider": "Gemini",
    "description": "Optimize React and Next.js applications using Vercel's performance wisdom. Use for: auditing React components, refact...",
    "prompt": "---\nname: react-best-practices\ndescription: \"Optimize React and Next.js applications using Vercel's performance wisdom. Use for: auditing React components, refactoring for performance, and enforcing Next.js best practices.\"\n---\n\n# React Best Practices (Vercel)\n\nThis skill encodes over 10 years of front-end performance wisdom from Vercel to help optimize React and Next.js applications.\n\n## Usage Guidelines\n\nUse this skill when auditing, refactoring, or building new React/Next.js projects to ensure high performance and code quality.\n\n1. **Performance Audit**: Review components for anti-patterns like heavy re-renders, large bundle sizes, or network waterfalls.\n2. **Refactoring**: Apply rules to optimize data fetching (e.g., parallel loading) and component structure.\n3. **Proactive Guidance**: Use these guidelines during the development of new pages to ensure optimal patterns from the start.\n\n## Core Rules\n\n- **Avoid Network Waterfalls**: Load data in parallel rather than sequentially where possible.\n- **Optimize Re-renders**: Use memoization and proper state management to prevent unnecessary updates.\n- **Reduce Bundle Size**: Identify and eliminate heavy dependencies or unused code.\n- **Next.js Optimization**: Leverage Next.js specific features like Server Components and optimized caching.\n\n## Examples\n\n### Component Audit\n- **User Request**: \"Review this React component for performance issues.\"\n- **Skill Action**: Analyze the code against performance rules, identify anti-patterns (e.g., sequential data fetching), and suggest fixes with code diffs.\n\n### Proactive Development\n- **User Request**: \"Build a new Next.js page for a dashboard.\"\n- **Skill Action**: Implement the page using parallel data fetching and efficient component structures as defined in the best practices.\n\n## Limitations\n\n- **Framework Specific**: Focused strictly on React and Next.js; not applicable to Vue, Angular, or back-end logic.\n- **Complexity of Fixes**: Identifies issues, but complex refactors may still require human judgment.\n- **Evolving Standards**: While extensive, it may not cover every edge case or the very latest experimental features.\n",
    "category": "Dev Tools",
    "usageCount": 0,
    "createdAt": "2026-03-04"
  },
  {
    "id": "AISTUDIO-skill-installer",
    "name": "skill-installer",
    "provider": "Gemini",
    "description": "Discover and install other agent skills on the fly from mcpmarket.com or GitHub. Use for: finding if a skill exists f...",
    "prompt": "---\nname: skill-installer\ndescription: \"Discover and install other agent skills on the fly from mcpmarket.com or GitHub. Use for: finding if a skill exists for a specific need and automatically fetching/installing it.\"\n---\n\n# Skill Installer & Lookup\n\nThis skill acts as a package manager for agent skills, allowing for the discovery and installation of new capabilities through natural language commands.\n\n## Usage Guidelines\n\nWhen a user requests a capability that is not currently available or asks for a specific skill to be installed, use this skill to find and set it up.\n\n1. **Search for Skills**: Use the browser to search `mcpmarket.com`, GitHub, or other skill registries for relevant keywords.\n2. **Evaluate and Install**: Report the best match to the user. If confirmed, download the skill into the local skills directory (`/home/ubuntu/skills/`).\n3. **Verify Installation**: Ensure the skill's `SKILL.md` is present and follows the required format.\n\n## Examples\n\n### Discovering a New Skill\n- **User Request**: \"Is there a skill for drawing UML diagrams? If so, install it.\"\n- **Skill Action**: Search for \"UML diagram skill\", find a suitable repository, and download it to the skills folder.\n\n### Installing a Specific Tool\n- **User Request**: \"Get me a skill that handles Excel analysis.\"\n- **Skill Action**: Look up \"Excel analysis agent skill\", identify the top-rated one, and perform the installation.\n\n## Limitations\n\n- **Registry Dependency**: Success depends on the availability and accuracy of skill indexes.\n- **Security Risks**: Installing community skills carries risks; always review the skill's description and instructions before execution.\n- **Configuration Requirements**: Some skills may require additional setup (e.g., API keys) after installation.\n- **Platform Compatibility**: Only skills compatible with the current agent platform can be installed successfully.\n",
    "category": "AI Innovation",
    "usageCount": 0,
    "createdAt": "2026-03-04"
  },
  {
    "id": "AISTUDIO-web-design-audit_1",
    "name": "web-design-audit",
    "provider": "Gemini",
    "description": "Audit web applications for UI/UX quality and accessibility. Use for: checking accessibility (ARIA, contrast), respons...",
    "prompt": "---\nname: web-design-audit\ndescription: \"Audit web applications for UI/UX quality and accessibility. Use for: checking accessibility (ARIA, contrast), responsive design, and general UI polish.\"\n---\n\n# Web Design Audit Guidelines (Vercel)\n\nThis skill provides a comprehensive checklist for auditing web applications to ensure high UI/UX quality and accessibility compliance.\n\n## Usage Guidelines\n\nUse this skill to critique web app implementations, focusing on accessibility, responsiveness, and design consistency.\n\n1. **Accessibility Check**: Verify ARIA labels, image alt text, color contrast, and heading structures.\n2. **UX & Polish**: Audit form behaviors, focus handling, typography, and dark mode support.\n3. **Responsive Audit**: Ensure layouts are mobile-friendly and use relative units (e.g., rem/em) for scalability.\n\n## Core Guidelines\n\n- **Accessibility**: Follow WCAG standards; ensure all interactive elements are keyboard accessible and screen-reader friendly.\n- **Typography**: Use relative units for font sizes; maintain proper hierarchy and readability.\n- **Forms**: Ensure all inputs have associated labels and clear error states.\n- **Responsive Design**: Test across multiple breakpoints; prioritize fluid layouts over fixed widths.\n\n## Examples\n\n### Accessibility Audit\n- **User Request**: \"Review my login page for accessibility.\"\n- **Skill Action**: Inspect the HTML/CSS for missing ARIA labels or low contrast, and provide specific recommendations for improvement.\n\n### Design Consistency\n- **User Request**: \"Check if this page follows modern UI best practices.\"\n- **Skill Action**: Evaluate the page's use of spacing, typography, and responsive behavior, flagging inconsistencies like hardcoded pixel values.\n\n## Limitations\n\n- **Subjective Aesthetics**: Does not judge visual \"beauty\" or subjective design choices; focuses on measurable standards.\n- **Code Access Required**: Most effective when the agent can inspect the actual HTML/CSS code.\n- **Manual Implementation**: Suggestions must be applied manually or via a coding environment.\n",
    "category": "Dev Tools",
    "usageCount": 0,
    "createdAt": "2026-03-04"
  },
  {
    "id": "AISTUDIO-excel-SKILL",
    "name": "internet-skill-finder",
    "provider": "Gemini",
    "description": "Search and recommend Agent Skills from verified GitHub repositories. Use when users ask to find, discover, search for...",
    "prompt": "---\nname: internet-skill-finder\ndescription: Search and recommend Agent Skills from verified GitHub repositories. Use when users ask to find, discover, search for, or recommend skills/plugins for specific tasks, domains, or workflows.\n---\n\n# Internet Skill Finder\n\nSearch 7 verified GitHub repositories for Agent Skills.\n\n## Workflow\n\n### 1. Fetch Skill List\n\n```bash\npython3 /home/ubuntu/skills/internet-skill-finder/scripts/fetch_skills.py --search \"keyword\"\n```\n\nOptions: `--list` (all skills), `--online` (real-time fetch), `--json` (structured output)\n\n### 2. Deep Dive (if needed)\n\n```bash\npython3 /home/ubuntu/skills/internet-skill-finder/scripts/fetch_skills.py --deep-dive REPO SKILL\n```\n\n### 3. Present Results\n\nWhen using cached data, prepend:\n\n> ℹ️ Using cached data. Enable GitHub Connector for real-time results.\n\nFormat each match:\n\n```markdown\n### [Skill Name]\n**Source**: [Repository] | ⭐ [Stars]\n**Description**: [From SKILL.md]\n👉 **[Import](import_url)**\n```\n\n### 4. No Matches\n\nSuggest `/skill-creator` for custom skill creation.\n\n## Data Access\n\nScript auto-detects and uses best method:\n\n| Priority | Method | Rate Limit | Behavior |\n|----------|--------|------------|----------|\n| 1 | GitHub Connector | 15000/hr | Auto real-time |\n| 2 | Offline cache | Unlimited | Fallback |\n| 3 | `GITHUB_TOKEN` env | 5000/hr | With `--online` |\n\nJSON output includes `\"using_cache\": true/false` to indicate data source.\n\nWhen cache is used, inform user: Enable GitHub Connector for real-time results.\n\n## Sources\n\n7 repositories: anthropics/skills, obra/superpowers, vercel-labs/agent-skills, K-Dense-AI/claude-scientific-skills, ComposioHQ/awesome-claude-skills, travisvn/awesome-claude-skills, BehiSecc/awesome-claude-skills\n",
    "category": "AI Innovation",
    "usageCount": 0,
    "createdAt": "2026-03-04"
  },
  {
    "id": "AISTUDIO-production-suitability",
    "name": "production-suitability",
    "provider": "Gemini",
    "description": "AI Agent Skill",
    "prompt": "# Production Suitability in Pharma, Food & Cosmetics Manufacturing\n\nThis document addresses the key elements required to ensure production suitability, including facility design, equipment qualification, and process validation, all critical for cGMP compliance in pharmaceutical, food, and cosmetic industries.\n\n## Facility Design Principles:\n\n### Layout & Flow\n[Principles of facility layout to ensure unidirectional flow of materials and personnel, preventing cross-contamination.]\n\n### Cleanroom Classification\n[ISO and cGMP classifications for cleanrooms and controlled environments, and their design requirements.]\n\n### Environmental Monitoring\n[Systems for monitoring temperature, humidity, particulate matter, and microbial contamination.]\n\n## Equipment Qualification:\n\n### User Requirement Specification (URS)\n[Developing detailed URS for new equipment.]\n\n### Design Qualification (DQ)\n[Verifying that the proposed design meets the URS and regulatory requirements.]\n\n### Installation Qualification (IQ)\n[Documenting that equipment is installed according to manufacturer's specifications and design drawings.]\n\n### Operational Qualification (OQ)\n[Confirming that equipment operates as intended within specified operating ranges.]\n\n### Performance Qualification (PQ)\n[Verifying that equipment consistently performs as intended under actual operating conditions.]\n\n## Process Validation:\n\n### Validation Master Plan (VMP)\n[Developing a VMP to define the scope, approach, and responsibilities for validation activities.]\n\n### Process Design\n[Understanding the process and identifying critical process parameters (CPPs) and critical quality attributes (CQAs).]\n\n### Process Qualification\n[Demonstrating that the process is capable of consistently delivering a quality product.]\n\n### Continued Process Verification (CPV)\n[Ongoing monitoring and evaluation of the process to ensure it remains in a state of control.]\n",
    "category": "AI Innovation",
    "usageCount": 0,
    "createdAt": "2026-03-04"
  },
  {
    "id": "AISTUDIO-rd-implementation",
    "name": "rd-implementation",
    "provider": "Gemini",
    "description": "AI Agent Skill",
    "prompt": "# Research & Development (R&D) and Implementation\n\nThis document provides guidance on conducting technical development, formulation, and process optimization for pharmaceutical, food, multi-ingredient extraction, and cosmetic products.\n\n## R&D Workflows:\n\n### Product Development Lifecycle\n[Stages of product development from concept to commercialization]\n\n### Formulation Development\n[Techniques for developing stable and effective formulations]\n\n### Process Development & Optimization\n[Methods for optimizing manufacturing processes, including scale-up considerations]\n\n## Extraction Methodologies:\n\n### Solvent Selection & Optimization\n[Guidance on choosing and optimizing extraction solvents]\n\n### Yield & Purity Optimization\n[Techniques for maximizing extraction yield and purity]\n\n## cGMP Integration in R&D:\n\n### Quality by Design (QbD)\n[Applying QbD principles throughout the R&D process]\n\n### Documentation & Traceability\n[Importance of robust documentation in R&D for regulatory compliance]\n",
    "category": "AI Innovation",
    "usageCount": 0,
    "createdAt": "2026-03-04"
  },
  {
    "id": "AISTUDIO-technical-protocols",
    "name": "technical-protocols",
    "provider": "Gemini",
    "description": "AI Agent Skill",
    "prompt": "# Technical Protocols: Extraction & Manufacturing\n\nThis document provides detailed technical protocols and technology overviews for the extraction and manufacturing of pharmaceuticals, nutraceuticals, and food processing raw materials.\n\n## 1. Advanced Extraction Technologies\n\n### Supercritical Fluid Extraction (SFE)\n- **Application**: High-purity extraction of essential oils, cannabinoids, and bioactive lipids.\n- **Protocol**:\n  1. Load raw material into the extraction vessel.\n  2. Pressurize CO2 to supercritical state (typically >73.8 bar, >31.1°C).\n  3. Adjust pressure/temperature to tune solvent selectivity.\n  4. Separate extract from CO2 in the collection vessel.\n  5. Recirculate CO2 for efficiency.\n\n### Ultrasonic-Assisted Extraction (UAE)\n- **Application**: Multi-ingredient extraction from plant matrices.\n- **Protocol**:\n  1. Mix raw material with appropriate solvent (ethanol/water).\n  2. Apply ultrasonic waves (20-100 kHz) to induce cavitation.\n  3. Maintain temperature control to prevent thermolabile degradation.\n  4. Filter and concentrate the extract.\n\n### Microwave-Assisted Extraction (MAE)\n- **Application**: Rapid extraction of polar compounds.\n\n## 2. Pharmaceutical & Nutraceutical Manufacturing Protocols\n\n### Standardized Manufacturing Process (SMP)\n- **Granulation**: Wet vs. Dry granulation protocols for tablet consistency.\n- **Encapsulation**: Hard shell vs. Softgel manufacturing for nutraceuticals.\n- **Coating**: Functional coating protocols for enteric release or taste masking.\n\n### Lyophilization (Freeze-Drying)\n- **Application**: Preservation of heat-sensitive pharmaceuticals and nutraceuticals.\n- **Protocol**:\n  1. **Freezing**: Solidify the product below its triple point.\n  2. **Primary Drying (Sublimation)**: Remove ice under vacuum.\n  3. **Secondary Drying (Desorption)**: Remove residual bound water.\n\n### Spray Drying\n- **Application**: Converting liquid extracts into stable powders.\n- **Parameters**: Inlet/outlet temperature control, feed rate, and atomizer speed.\n\n## 3. Food Processing Raw Materials Protocols\n\n### Raw Material Standardization\n- **Protocol**:\n  1. **Sourcing**: Qualification of suppliers based on GFSI standards.\n  2. **Cleaning/Sorting**: Removal of physical contaminants.\n  3. **Milling/Size Reduction**: Achieving uniform particle size for processing.\n  4. **Stabilization**: Heat treatment (Blanching/Pasteurization) or enzymatic inactivation.\n\n### Ingredient Fractionation\n- **Protocol**: Separation of proteins, fibers, and starches from complex food matrices using membrane filtration or centrifugal separation.\n\n## 4. Emerging Technologies\n- **Nanotechnology**: Nano-emulsions for enhanced bioavailability of nutraceuticals.\n- **Biotechnology**: Fermentation-based production of bioactive ingredients.\n- **Continuous Manufacturing**: Transitioning from batch to continuous flow for pharmaceuticals.\n",
    "category": "AI Innovation",
    "usageCount": 0,
    "createdAt": "2026-03-04"
  },
  {
    "id": "AISTUDIO-utility-requirements",
    "name": "utility-requirements",
    "provider": "Gemini",
    "description": "AI Agent Skill",
    "prompt": "# Utility Requirements for Pharma, Food & Cosmetics Facilities\n\nThis document outlines the critical utility requirements for manufacturing facilities in the pharmaceutical, food, and cosmetic industries, emphasizing cGMP compliance.\n\n## Key Utilities:\n\n### HVAC (Heating, Ventilation, and Air Conditioning)\n[Details on HVAC systems, air filtration (HEPA), pressure differentials, and environmental controls for cleanrooms and controlled environments.]\n\n### Water Systems\n[Guidance on Water for Injection (WFI), Purified Water (PW), and potable water systems, including generation, storage, distribution, and quality monitoring.]\n\n### Clean Steam\n[Requirements for clean steam generation and distribution for sterilization and humidification.]\n\n### Compressed Air & Other Gases\n[Specifications for medical air, process air, nitrogen, and other gases, including filtration and quality standards.]\n\n## Design & Qualification:\n\n### Facility Design Considerations\n[Layout, material flow, personnel flow, and segregation to prevent contamination.]\n\n### Utility Qualification (IQ, OQ, PQ)\n[Installation Qualification, Operational Qualification, and Performance Qualification for utility systems.]\n",
    "category": "AI Innovation",
    "usageCount": 0,
    "createdAt": "2026-03-04"
  }
];
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
      return merged; } catch { return []; }
  });
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [newSkillData, setNewSkillData] = useState({ name:'', provider:'Claude' as 'Claude'|'Gemini'|'NotebookLM', description:'', prompt:'', category:'Operations' });
  const [activeSkillId, setActiveSkillId] = useState<string|null>(null);
  const [aiCmdInput, setAiCmdInput] = useState('');
  const [activeChatId, setActiveChatId] = useState<string>('default');
  const [chatSessions, setChatSessions] = useState<{id:string, title:string, provider:string, skillName?:string, messages:{role:'user'|'model',text:string,provider:string,skillName?:string}[], createdAt:string, archived:boolean}[]>(() => {
    try { const s = localStorage.getItem('erp_chat_sessions_v2'); return s ? JSON.parse(s) : [
      { id: 'default', title: 'New Chat', provider: 'Claude', messages: [], createdAt: new Date().toISOString(), archived: false }
    ]; } catch { return [{ id: 'default', title: 'New Chat', provider: 'Claude', messages: [], createdAt: new Date().toISOString(), archived: false }]; }
  });
  const [aiCmdHistory, setAiCmdHistory] = useState<{role:'user'|'model', text:string, provider:string, skillName?:string}[]>([]);

  // Inventory State
  const [inventoryTab, setInventoryTab] = useState<'raw' | 'finished'>('raw');

  // R&D State
  const [rdSearch, setRdSearch] = useState('');
  const [rdActiveTab, setRdActiveTab] = useState<'formulation'|'process'|'compare'|'spec'>('formulation');
  const [compareRD, setCompareRD] = useState<RDProject | null>(null);
  const [rdAiReport, setRdAiReport] = useState<string>('');
  const [isRdModalOpen, setIsRdModalOpen] = useState(false);
  const [rdModalMode, setRdModalMode] = useState<'addProduct'|'addIngredient'|'editIngredient'>('addProduct');
  const [newProductData, setNewProductData] = useState<any>({
    title: '', productCode: '', dosageForm: 'Capsule', strength: '', therapeuticCategory: '',
    batchSize: 100, batchUnit: 'Kg', loss: 0.02, status: 'Formulation',
    shelfLife: '24 Months', storageCondition: 'Below 25°C', qualityStandards: 'BP/USP',
    regulatoryStatus: 'Dossier Prep', manufacturingProcess: ''
  });
  const [newIngData, setNewIngData] = useState<any>({ name: '', quantity: 0, unit: 'Kg', rateUSD: 0, role: 'API', supplier: '', grade: '', notes: '' });
  const [editIngIdx, setEditIngIdx] = useState<number>(-1);
  const [rdSpecLoading, setRdSpecLoading] = useState(false);

  // File Analysis State
  const [fileAnalysisLog, setFileAnalysisLog] = useState<FileAnalysisResult[]>([]);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'view' | 'edit' | 'add'>('view');
  const [modalData, setModalData] = useState<any>({});
  const [currentSection, setCurrentSection] = useState('');

  // PO Generation State
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [poItem, setPOItem] = useState<any>(null);
  const [poVendor, setPOVendor] = useState('');
  const [poQty, setPOQty] = useState('');
  const [poUnitPrice, setPOUnitPrice] = useState('');
  const [poPayment, setPOPayment] = useState('LC at Sight');
  const [poShipping, setPOShipping] = useState('CIF by Air - Muscat Airport');
  const [poETA, setPOETA] = useState('ASAP');
  
  // Expansion State
  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const procurementFileRef = useRef<HTMLInputElement>(null);
  const industrialFileRef = useRef<HTMLInputElement>(null);
  const brainstormFileRef = useRef<HTMLInputElement>(null);
  const rdFileRef = useRef<HTMLInputElement>(null);
  const bdFileRef = useRef<HTMLInputElement>(null);

  // NEW: Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'add' | 'delete';
    itemType: string;
    itemName: string;
    onConfirm: () => void;
    onCancel: () => void;
  }>({
    isOpen: false,
    type: 'add',
    itemType: '',
    itemName: '',
    onConfirm: () => {},
    onCancel: () => {}
  });

  // --- Effects ---

  const fetchSupabaseData = async () => {
    try {
      // 1. Fetch Production Yields
      const { data: bData } = await supabase.from('production_yields').select('*');
      if (bData && bData.length > 0) {
          setBatches(bData.map((b: any) => ({ 
              ...b, 
              actualYield: b.actual_yield, 
              expectedYield: b.expected_yield 
          })));
      }
      
      // 2. Fetch Orders
      const { data: oData } = await supabase.from('orders').select('*');
      if (oData && oData.length > 0) {
          setOrders(oData.map((o: any) => ({ 
              ...o, 
              sNo: o.s_no,
              invoiceNo: o.invoice_no,
              amountUSD: o.amount_usd,
              amountOMR: o.amount_omr,
              indentDate: o.indent_date 
          })));
      }

      // 3. Fetch Inventory
      const { data: iData } = await supabase.from('inventory').select('*');
      if (iData && iData.length > 0) {
          setInventory(iData.map((i: any) => ({
              ...i,
              sNo: i.s_no,
              requiredForOrders: i.required_for_orders,
              balanceToPurchase: i.balance_to_purchase,
              stockDate: i.stock_date
          })));
      }

      // 4. Fetch Markets
      const { data: mData } = await supabase.from('markets').select('*');
      if (mData && mData.length > 0) setMarkets(mData);

      // 5. Fetch Audit Logs
      const { data: lData } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(50);
      if (lData && lData.length > 0) setAuditLogs(lData);

      setDbStatus('connected');
    } catch (e) {
      console.warn("Supabase fetch error:", e);
      setDbStatus('disconnected');
    }
  };

  useEffect(() => { fetchSupabaseData(); }, []);
  
  // Persistence Effects - Safe Wrapper
  const saveToLocalStorage = (key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`LocalStorage quota exceeded for ${key}. Data not saved.`);
    }
  };

  useEffect(() => { saveToLocalStorage('erp_dashboard_widgets', visibleWidgets); }, [visibleWidgets]);
  useEffect(() => { saveToLocalStorage('erp_industrial_chat', industrialChat); }, [industrialChat]);
  useEffect(() => { saveToLocalStorage('erp_brainstorm_sessions', brainstormSessions); }, [brainstormSessions]);
  useEffect(() => { saveToLocalStorage('erp_chat_history', chatHistory); }, [chatHistory]);
  useEffect(() => { saveToLocalStorage('erp_saved_skills', savedSkills); }, [savedSkills]);
  useEffect(() => { saveToLocalStorage('erp_chat_sessions_v2', chatSessions); }, [chatSessions]);
  useEffect(() => { saveToLocalStorage('erp_api_config', apiConfig); }, [apiConfig]);

  // API Key Selection logic for gemini-3-pro-image-preview (Industrial Studio)
  useEffect(() => {
    const handleApiKeySelection = async () => {
      if (activeTab === 'industrial' && typeof window !== 'undefined' && (window as any).aistudio) {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        if (!hasKey) {
          await (window as any).aistudio.openSelectKey();
        }
      }
    };
    handleApiKeySelection();
  }, [activeTab]);

  const fetchInsights = useCallback(async () => {
    setIsAiLoading(true);
    try {
      const result = await analyzeOperations(batches, inventory, orders, expenses, employees);
      setInsights(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiLoading(false);
    }
  }, [batches, inventory, orders, expenses, employees]);

  useEffect(() => { fetchInsights(); }, [fetchInsights]);

  // --- Helper Functions ---
  const downloadContent = (content: string, filename: string, type: 'text' | 'image') => {
      const link = document.createElement('a');
      if (type === 'image') {
          link.href = content;
      } else {
          const blob = new Blob([content], { type: 'text/plain' });
          link.href = URL.createObjectURL(blob);
      }
      link.download = filename;
      link.click();
  };

  const handleExportData = () => {
      const dataStr = JSON.stringify({ batches, inventory, orders, expenses, employees, vendors, bdLeads }, null, 2);
      downloadContent(dataStr, 'erp_data_export.json', 'text');
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/mp3' }); 
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
            const base64String = reader.result as string;
            const base64Audio = base64String.split(',')[1];
            setIsAiLoading(true);
            const text = await transcribeAudio(base64Audio, 'audio/mp3');
            setChatMessage(prev => prev + " " + text);
            setIsAiLoading(false);
        };
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic error", err);
    }
  };

  const stopRecording = () => {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
  };

  const handleQuickScan = async () => {
      setIsAiLoading(true);
      const summary = `Pending Orders: ${orders.filter(o=>o.status==='Pending').length}, Batches Active: ${batches.filter(b=>b.status==='In-Progress').length}`;
      const res = await quickInsight(summary);
      // Display insight as a toast notification instead of alert
      console.log(`⚡ Quick Insight: ${res}`);
      setUploadProgress({
        isUploading: false,
        fileName: 'Quick Scan',
        progress: 100,
        status: 'complete',
        message: `⚡ Quick Insight: ${res}`
      });
      setTimeout(() => setUploadProgress({ isUploading: false, fileName: '', progress: 0, status: 'uploading', message: '' }), 5000);
      setIsAiLoading(false);
  };

  // NEW: Log action helper
  const logAction = async (action: string, details: string) => {
    const logEntry = {
      action,
      performed_by: 'Admin',
      details,
      timestamp: new Date().toISOString()
    };
    try {
      await supabase.from('audit_logs').insert(logEntry);
      setAuditLogs(prev => [logEntry as any, ...prev]);
    } catch (error) {
      console.error('Failed to log action:', error);
    }
  };

  // NEW: Show confirmation dialog
  const showConfirmation = (
    type: 'add' | 'delete',
    itemType: string,
    itemName: string,
    onConfirm: () => void
  ) => {
    setConfirmDialog({
      isOpen: true,
      type,
      itemType,
      itemName,
      onConfirm,
      onCancel: () => setConfirmDialog(prev => ({ ...prev, isOpen: false }))
    });
  };

  // NEW: Handle delete with confirmation
  const handleDelete = (type: string, id: string, name: string) => {
    showConfirmation('delete', type, name, async () => {
      switch (type) {
        case 'inventory':
          setInventory(prev => prev.filter(item => item.id !== id));
          await logAction('DELETE', `Deleted inventory item: ${name}`);
          await supabase.from('inventory').delete().eq('id', id);
          break;
        case 'production':
          setBatches(prev => prev.filter(item => item.id !== id));
          await logAction('DELETE', `Deleted batch: ${name}`);
          await supabase.from('production_yields').delete().eq('id', id);
          break;
        case 'sales':
          setOrders(prev => prev.filter(item => item.id !== id));
          await logAction('DELETE', `Deleted order: ${name}`);
          await supabase.from('orders').delete().eq('id', id);
          break;
        case 'procurement':
          // Note: vendors state is not mutable in original, needs to be changed to useState
          await logAction('DELETE', `Deleted vendor: ${name}`);
          break;
        case 'accounting':
          setExpenses(prev => prev.filter(item => item.id !== id));
          await logAction('DELETE', `Deleted expense: ${name}`);
          break;
        case 'hr':
          setEmployees(prev => prev.filter(item => item.id !== id));
          await logAction('DELETE', `Deleted employee: ${name}`);
          break;
        case 'rd':
          setRdProjects(prev => prev.filter(item => item.id !== id));
          await logAction('DELETE', `Deleted R&D project: ${name}`);
          break;
      }
      setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      
      // Refresh audit logs
      const { data: logs } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(50);
      if (logs) setAuditLogs(logs);
    });
  };

  // --- Handlers ---
  
  const toggleWidget = (widgetId: WidgetId) => {
      setVisibleWidgets(prev => 
        prev.includes(widgetId) 
        ? prev.filter(id => id !== widgetId) 
        : [...prev, widgetId]
      );
  };

  const handleGlobalAction = () => fileInputRef.current?.click();

  const generatePODocument = (item: any, vendor: string, qty: string, unitPrice: string, paymentTerm: string, shippingMethod: string, eta: string) => {
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.');
    const poNumber = `AWP/PO/${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getFullYear()).slice(-2)}`;
    const totalUSD = (Number(qty) * Number(unitPrice)).toLocaleString('en-US', { minimumFractionDigits: 2 });
    const totalWords = numberToWords(Number(qty) * Number(unitPrice));

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; font-size: 11pt; margin: 40px; color: #000; }
  .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #003087; padding-bottom: 10px; margin-bottom: 20px; }
  .logo-text { font-size: 9pt; color: #003087; font-weight: bold; }
  .company-name { font-size: 14pt; font-weight: bold; color: #003087; }
  .po-title { text-align: center; font-size: 14pt; font-weight: bold; text-decoration: underline; margin: 20px 0; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
  th, td { border: 1px solid #000; padding: 6px 8px; font-size: 10pt; }
  th { background: #e8f0fe; font-weight: bold; }
  .info-table td { border: 1px solid #000; padding: 5px 8px; }
  .bold { font-weight: bold; }
  .footer { border-top: 1px solid #003087; margin-top: 30px; padding-top: 8px; font-size: 9pt; text-align: center; color: #444; }
  .signature-box { border: 1px solid #000; padding: 15px; text-align: center; margin-top: 10px; min-height: 80px; }
  .annexure { page-break-before: always; }
  .annexure-title { text-align: center; font-size: 13pt; font-weight: bold; text-decoration: underline; margin: 20px 0; }
  .terms-title { font-weight: bold; margin-bottom: 8px; }
  ol li { margin-bottom: 6px; }
  @media print { body { margin: 20px; } }
</style>
</head>
<body>

<!-- HEADER -->
<div class="header">
  <div>
    <div class="logo-text">الـوجـر لصنـاعـة الأدويـة ش.م.م</div>
    <div class="company-name">AL WAJER PHARMACEUTICALS INDUSTRY LLC</div>
  </div>
</div>

<div class="po-title">PURCHASE ORDER</div>

<!-- SUPPLIER + PO INFO -->
<table class="info-table">
  <tr>
    <td style="width:55%; vertical-align:top;">
      <div class="bold">Supplier,</div>
      <div>${vendor}</div>
    </td>
    <td style="width:45%; vertical-align:top;">
      <div><span class="bold">Purchase Order No:</span> ${poNumber}</div>
      <div><span class="bold">Purchase Order Date:</span> ${dateStr}</div>
    </td>
  </tr>
</table>

<!-- SHIP TO -->
<table class="info-table">
  <tr>
    <td colspan="2">
      <div class="bold">Ship To: AL WAJER PHARMACEUTICALS INDUSTRY LLC,</div>
      <div>Po Box: 98, Postal Code: 327, Sohar Industrial Area, Sohar, Sultanate Of Oman.</div>
      <div>Email: moosa.ali@alwajerpharma.com, ahmed.idris@alwajerpharma.com</div>
      <div>Office: 22372677, Mobile: 00968-99354545, 00968-91248158</div>
    </td>
  </tr>
</table>

<p>Please furnish the merchandise specified below subject to the conditions on the face hereon and as attached</p>

<!-- ITEMS TABLE -->
<table>
  <thead>
    <tr>
      <th style="width:5%">No</th>
      <th style="width:40%">Description</th>
      <th style="width:12%">Qty (kgs)</th>
      <th style="width:13%">Unit Price (USD)</th>
      <th style="width:13%">Total Price (USD)</th>
      <th style="width:17%">Supplier/Manufacturer & Country of origin</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="text-align:center">1</td>
      <td class="bold">${item.name}</td>
      <td style="text-align:center">${Number(qty).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
      <td style="text-align:center">${Number(unitPrice).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
      <td style="text-align:center">${totalUSD}</td>
      <td style="text-align:center">${vendor}</td>
    </tr>
    <tr>
      <td colspan="4" class="bold" style="text-align:right">TOTAL AMOUNT IN USD</td>
      <td class="bold" style="text-align:center">${totalUSD}</td>
      <td></td>
    </tr>
  </tbody>
</table>

<p class="bold">IN WORDS: - USD – ${totalWords} Only/-</p>

<!-- SHIPPING TABLE -->
<table>
  <thead>
    <tr>
      <th>ETA: MCT</th>
      <th>Ship Via</th>
      <th>Destination</th>
      <th>Payment Terms</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="text-align:center">${eta}</td>
      <td style="text-align:center">${shippingMethod}</td>
      <td>Po Box: 98, Postal Code: 327,<br/>Sohar Industrial Area, Sohar.<br/><span class="bold">SULTANATE OF OMAN</span></td>
      <td style="text-align:center">${paymentTerm}</td>
    </tr>
  </tbody>
</table>

<table>
  <tr>
    <td style="width:50%"><span class="bold">Requested By:</span></td>
    <td style="width:50%">
      <div class="bold">Approved by: PURCHASE MANAGER</div>
      <div class="signature-box">[Official Stamp & Signature]</div>
    </td>
  </tr>
</table>

<div class="footer">
  س.ت: ١١٤٥٠٢٦, هـاتـف: ٢٢٣٧٢٦٧٧, ص.ب: ٩٨, الـرمـز الـبـريـدي: ٣٢٧, الـمـنـطـقـة الصنـاعية صحـار, صحـار, سلطنـة عمـان<br/>
  C.R. No: 1145026, Tel.: 22372677, P.O. Box: 98, Postal Code: 327, Sohar Industrial Area, Sohar, Sultanate of Oman
</div>

<!-- ANNEXURE I -->
<div class="annexure">
  <div style="text-align:right; margin-bottom:20px;">
    <div class="logo-text">الـوجـر لصنـاعـة الأدويـة ش.م.م</div>
    <div class="company-name">AL WAJER PHARMACEUTICALS INDUSTRY LLC</div>
  </div>
  
  <div class="annexure-title">ANNEXURE-I</div>
  
  <div class="terms-title">Terms &amp; Conditions as given below:-</div>
  <ol>
    <li>Required Original Invoice &amp; Packing list.</li>
    <li>Required COA (certificate of analysis).</li>
    <li>Required MSDS (Material Safety Data Sheet).</li>
    <li>Required Non Hazardous Certificate.</li>
    <li>Required Original COO (Certificate of origin).</li>
    <li>Required 4 BL/AWB (1 Original &amp; 3 Copies) must require company Stamp backside of the BL.</li>
    <li>All required documents should be courier immediately after the Shipment to avoid demurrage charges.</li>
  </ol>
  
  <p class="bold">*** All Necessary documents must be attested by Chamber of Commerce.</p>
  
  <div class="footer">
    س.ت: ١١٤٥٠٢٦, هـاتـف: ٢٢٣٧٢٦٧٧, ص.ب: ٩٨, الـرمـز الـبـريـدي: ٣٢٧, الـمـنـطـقـة الصنـاعية صحـار, صحـار, سلطنـة عمـان<br/>
    C.R. No: 1145026, Tel.: 22372677, P.O. Box: 98, Postal Code: 327, Sohar Industrial Area, Sohar, Sultanate of Oman
  </div>
</div>

</body>
</html>`;

    // Download as HTML file (opens in browser, printable as Word)
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${poNumber.replace(/\//g, '-')}_${(item.name || 'PO').replace(/\s+/g, '_').substring(0,30)}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    logAction('PO_GENERATED', `Generated PO for ${item.name} - ${qty} kg @ $${unitPrice}`);
    setIsPOModalOpen(false);
  };

  const numberToWords = (num: number): string => {
    if (num === 0) return 'Zero';
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
                  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const convert = (n: number): string => {
      if (n < 20) return ones[n];
      if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? ' ' + ones[n%10] : '');
      if (n < 1000) return ones[Math.floor(n/100)] + ' Hundred' + (n%100 ? ' ' + convert(n%100) : '');
      if (n < 1000000) return convert(Math.floor(n/1000)) + ' Thousand' + (n%1000 ? ' ' + convert(n%1000) : '');
      return convert(Math.floor(n/1000000)) + ' Million' + (n%1000000 ? ' ' + convert(n%1000000) : '');
    };
    return convert(Math.floor(num));
  };



  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, context: 'global' | 'procurement' | 'industrial' | 'brainstorm' | 'rd' | 'bd' = 'global') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Initialize upload progress
    setUploadProgress({
      isUploading: true,
      fileName: file.name,
      progress: 0,
      status: 'uploading',
      message: 'Uploading file...'
    });

    const reader = new FileReader();
    
    // Track upload progress
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = (event.loaded / event.total) * 50; // First 50% for upload
        setUploadProgress(prev => ({
          ...prev,
          progress: percentComplete,
          message: `Uploading: ${Math.round(percentComplete)}%`
        }));
      }
    };
    
    reader.onload = async () => {
      const base64String = reader.result as string;
      const base64Content = base64String.split(',')[1];
      const mimeType = file.type;

      // Update to processing
      setUploadProgress(prev => ({
        ...prev,
        progress: 50,
        status: 'processing',
        message: 'Processing file...'
      }));

      if (context === 'industrial') {
          setPendingIndustrialImage(base64String);
          setPendingIndustrialMime(mimeType);
          setUploadProgress({
            isUploading: false,
            fileName: '',
            progress: 0,
            status: 'complete',
            message: ''
          });
          return;
      }
      
      if (context === 'brainstorm' && currentBrainstormId) {
          const session = brainstormSessions.find(s => s.id === currentBrainstormId);
          if (session) {
              const newMsg: ChatMessage = {
                  id: Date.now().toString(),
                  role: 'user',
                  text: `Uploaded reference: ${file.name}`,
                  timestamp: Date.now()
              };
              const updatedSession = {...session, messages: [...session.messages, newMsg]};
              setBrainstormSessions(prev => prev.map(s => s.id === currentBrainstormId ? updatedSession : s));
          }
          setUploadProgress({
            isUploading: false,
            fileName: '',
            progress: 0,
            status: 'complete',
            message: ''
          });
          return;
      }

      setIsAiLoading(true);
      try {
        let prompt = "Analyze this file for pharmaceutical ERP data.";
        if (context === 'global') {
          prompt = `Analyze this pharmaceutical document (could be an image or spreadsheet). 
          It may contain multiple sections like Raw Materials, Packing Materials, R&D items, and Spare Parts.
          Extract all items found into the following JSON structure:
          {
            "inventory": [
              { "sNo": "string", "name": "string", "category": "API" | "Excipient" | "Packing" | "Finished" | "Spare", "required": number, "stock": number, "unit": "string", "date": "string" }
            ],
            "orders": [
              { "customer": "string", "product": "string", "quantity": number, "amountUSD": number, "status": "string", "invoiceNo": "string", "date": "string" }
            ]
          }
          Note: If an item is in "Purchase For :- Spare", categorize it as "Spare". If in "PACKING MATERIALS", use "Packing". Default to "API" for raw materials.
          Be extremely precise with numbers. Return ONLY valid JSON.`;
        }
        if (context === 'procurement') prompt = "Analyze this inventory requirement or PO file. Extract: S.No, Material Name, Required Quantity, Present Stock. Return JSON: { \"inventory\": [ { \"sNo\": \"string\", \"name\": \"string\", \"required\": number, \"stock\": number, \"unit\": \"string\" } ] }";
        if (context === 'rd') prompt = "Analyze this pharmaceutical formulation/costing sheet. Extract: Raw Material, Unit, Per B. Qty, Rate USD. Also identify Batch Size (Output). Return JSON: { \"batchSize\": number, \"ingredients\": [ { \"name\": \"string\", \"unit\": \"string\", \"quantity\": number, \"rateUSD\": number } ] }";
        if (context === 'bd') prompt = "Analyze this Sales Excel file. Extract: Party, Product, Qty (KG), Rate $, Amount $, Status. Return JSON: { \"orders\": [ { \"customer\": \"string\", \"product\": \"string\", \"quantity\": number, \"rateUSD\": number, \"amountUSD\": number, \"status\": \"string\" } ] }";

        // Update progress during analysis
        setUploadProgress(prev => ({
          ...prev,
          progress: 75,
          message: 'AI analyzing content...'
        }));

        const analysis = await analyzeImageOrFile(base64Content, mimeType, prompt);
        
        setUploadProgress(prev => ({
          ...prev,
          progress: 90,
          status: 'processing',
          message: 'Updating database...'
        }));

        // Process AI analysis into system state if applicable
        if (analysis && analysis.includes('{')) {
          try {
            const cleanJson = analysis.substring(analysis.indexOf('{'), analysis.lastIndexOf('}') + 1);
            const jsonData = JSON.parse(cleanJson);
            
            // 1. Handle Inventory (Raw Materials, Packing, Spares)
            if (jsonData.inventory && Array.isArray(jsonData.inventory)) {
              const newItems = jsonData.inventory.map((item: any) => ({
                id: `AI-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                sNo: item.sNo || '',
                name: item.name || 'Unknown Item',
                category: item.category || 'API',
                stock: Number(item.stock) || 0,
                requiredForOrders: Number(item.required) || 0,
                balanceToPurchase: Math.max(0, (Number(item.required) || 0) - (Number(item.stock) || 0)),
                unit: item.unit || 'kg',
                stockDate: item.date || new Date().toLocaleDateString()
              }));

              if (newItems.length > 0) {
                setInventory(prev => [...prev, ...newItems]);
                // Batch sync to Supabase
                for (const item of newItems) {
                  await supabase.from('inventory').insert({
                    id: item.id,
                    s_no: item.sNo,
                    name: item.name,
                    category: item.category,
                    stock: item.stock,
                    required_for_orders: item.requiredForOrders,
                    balance_to_purchase: item.balanceToPurchase,
                    unit: item.unit,
                    stock_date: item.stockDate
                  });
                }
                await logAction('IMPORT', `AI imported ${newItems.length} inventory items from ${file.name}`);
              }
            }
            
            // 2. Handle Orders (Sales)
            if (jsonData.orders && Array.isArray(jsonData.orders)) {
              const newOrders = jsonData.orders.map((order: any) => ({
                id: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                date: order.date || new Date().toISOString().split('T')[0],
                invoiceNo: order.invoiceNo || `AI-${Math.floor(Math.random()*1000)}`,
                customer: order.customer,
                country: order.country || '-',
                product: order.product,
                quantity: Number(order.quantity) || 0,
                amountUSD: Number(order.amountUSD) || 0,
                amountOMR: (Number(order.amountUSD) || 0) * 0.385,
                status: order.status || 'Pending'
              }));

              if (newOrders.length > 0) {
                setOrders(prev => [...prev, ...newOrders]);
                for (const order of newOrders) {
                  await supabase.from('orders').insert({
                    id: order.id,
                    invoice_no: order.invoiceNo,
                    customer: order.customer,
                    product: order.product,
                    quantity: order.quantity,
                    amount_usd: order.amountUSD,
                    status: order.status,
                    date: order.date
                  });
                }
                await logAction('IMPORT', `AI imported ${newOrders.length} orders`);
              }
            }
            
            // 3. Handle R&D (Formulation)
            if (context === 'rd' && jsonData.ingredients) {
              const newProject: RDProject = calculateCosting({
                id: `RD-${Date.now()}`,
                title: `Imported: ${file.name}`,
                status: 'Formulation',
                optimizationScore: 85,
                lastUpdated: new Date().toISOString(),
                batchSize: Number(jsonData.batchSize) || 100,
                batchUnit: 'Kg',
                totalRMC: 0,
                loss: 0.02,
                totalFinalRMC: 0,
                ingredients: jsonData.ingredients.map((ing: any) => ({
                  name: ing.name,
                  quantity: Number(ing.quantity) || 0,
                  unit: ing.unit || 'Kg',
                  rateUSD: Number(ing.rateUSD) || 0,
                  cost: 0,
                  role: 'Other'
                }))
              });
              setRdProjects(prev => [newProject, ...prev]);
              setSelectedRD(newProject);
              await logAction('IMPORT', `AI imported formulation`);
            }
          } catch (e) {
            console.error("JSON parsing or sync failed:", e);
          }
        }

        setUploadProgress(prev => ({
          ...prev,
          progress: 100,
          status: 'complete',
          message: 'System Synced Successfully!'
        }));

        setFileAnalysisLog(prev => [{
          fileName: file.name,
          analysis: analysis || "Analysis complete.",
          timestamp: new Date().toLocaleTimeString()
        }, ...prev]);

        // Hide progress after 2 seconds
        setTimeout(() => {
          setUploadProgress({
            isUploading: false,
            fileName: '',
            progress: 0,
            status: 'complete',
            message: ''
          });
        }, 2000);

      } catch (error) {
        console.error("File error", error);
        setUploadProgress({
          isUploading: false,
          fileName: file.name,
          progress: 0,
          status: 'error',
          message: 'Upload failed. Please try again.'
        });
        
        // Hide error after 3 seconds
        setTimeout(() => {
          setUploadProgress({
            isUploading: false,
            fileName: '',
            progress: 0,
            status: 'complete',
            message: ''
          });
        }, 3000);
      } finally {
        setIsAiLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Industrial Chat Handler
  const handleIndustrialChat = async () => {
      if (!industrialInput.trim() && !pendingIndustrialImage) return;
      
      const text = industrialInput;
      const imageToEdit = pendingIndustrialImage;
      const mimeToEdit = pendingIndustrialMime;

      // Clear Inputs
      setIndustrialInput('');
      setPendingIndustrialImage(null);
      setPendingIndustrialMime(null);

      const userMsg: ChatMessage = { 
          id: Date.now().toString(), 
          role: 'user', 
          text: text || (imageToEdit ? "Reference Image Uploaded" : ""), 
          image: imageToEdit || undefined,
          timestamp: Date.now() 
      };
      
      setIndustrialChat(prev => [...prev, userMsg]);
      setIsAiLoading(true);

      try {
          if (imageToEdit && text) {
              // Edit Mode
              const result = await editImage(imageToEdit.split(',')[1], mimeToEdit!, text);
              if (result) {
                   setIndustrialChat(prev => [...prev, {
                       id: Date.now().toString(),
                       role: 'model',
                       text: 'Edited image based on your prompt.',
                       image: result,
                       timestamp: Date.now()
                   }]);
              } else {
                   setIndustrialChat(prev => [...prev, { id: Date.now().toString(), role: 'model', text: 'Could not process edit.', timestamp: Date.now() }]);
              }
          } else {
              // Generate Mode (Text Only)
              const isGeneration = text.toLowerCase().includes('generate') || text.toLowerCase().includes('design') || text.toLowerCase().includes('draw') || true; // Default to generation in studio
              
              if (isGeneration) {
                   const design = await generateIndustrialDesign(text, 'schematic', aspectRatio, imageSize);
                   if (design) {
                       setIndustrialChat(prev => [...prev, {
                           id: Date.now().toString(),
                           role: 'model',
                           text: `Generated design (${aspectRatio}, ${imageSize}).`,
                           image: design,
                           timestamp: Date.now()
                       }]);
                   } else {
                       setIndustrialChat(prev => [...prev, { id: Date.now().toString(), role: 'model', text: 'Generation failed.', timestamp: Date.now() }]);
                   }
              }
          }
      } catch (error) {
           console.error(error);
      } finally {
          setIsAiLoading(false);
      }
  };

  // Brainstorm Chat Handler
  const startNewBrainstorm = () => {
      const newSession: BrainstormSession = {
          id: Date.now().toString(),
          topic: 'New Session',
          date: new Date().toLocaleDateString(),
          messages: [{id: '1', role: 'model', text: 'Ready to brainstorm. What is the topic?', timestamp: Date.now()}]
      };
      setBrainstormSessions(prev => [newSession, ...prev]);
      setCurrentBrainstormId(newSession.id);
  };

  const handleBrainstormChat = async () => {
      if (!brainstormInput.trim() || !currentBrainstormId) return;
      const session = brainstormSessions.find(s => s.id === currentBrainstormId);
      if (!session) return;

      const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: brainstormInput, timestamp: Date.now() };
      
      // Update session locally first
      const updatedSession = { 
          ...session, 
          topic: session.messages.length <= 1 ? brainstormInput : session.topic, // Auto-name topic
          messages: [...session.messages, userMsg] 
      };
      setBrainstormSessions(prev => prev.map(s => s.id === currentBrainstormId ? updatedSession : s));
      setBrainstormInput('');
      setIsAiLoading(true);

      try {
          const response = await brainstormSession(userMsg.text, 'logic');
          const modelMsg: ChatMessage = { id: Date.now().toString(), role: 'model', text: response || 'No response.', timestamp: Date.now() };
          
          setBrainstormSessions(prev => prev.map(s => s.id === currentBrainstormId ? {
              ...s, messages: [...updatedSession.messages, modelMsg]
          } : s));
      } catch (error) {
          console.error(error);
      } finally {
          setIsAiLoading(false);
      }
  };

  const handleChat = async () => {
    if (!chatMessage.trim()) return;
    const msg = chatMessage;
    setChatMessage('');
    setChatHistory(prev => [...prev, { role: 'user', text: msg }]);
    setIsAiLoading(true);
    try {
      const response = await chatWithCOO(msg, chatHistory);
      setChatHistory(prev => [...prev, { role: 'model', text: response || 'Protocol error.' }]);
    } catch (error) {
      console.error("Chat Error", error);
    }
    setIsAiLoading(false);
  };
  
  const calculateCosting = (project: RDProject) => {
    const ingredients = project.ingredients.map(ing => ({
      ...ing,
      cost: Number((ing.quantity * ing.rateUSD).toFixed(3))
    }));
    const totalRMC = ingredients.reduce((sum, ing) => sum + ing.cost, 0);
    const totalFinalRMC = Number(((totalRMC / project.batchSize) + project.loss).toFixed(3));
    return { ...project, ingredients, totalRMC: Number(totalRMC.toFixed(3)), totalFinalRMC };
  };

  const saveRDVersion = (project: RDProject, summary: string): RDProject => {
    const versionNum = `v${((project.versions?.length || 0) + 1).toString().padStart(2,'0')}`;
    const newVersion = {
      version: versionNum, date: new Date().toISOString(), summary,
      snapshot: { ingredients: [...project.ingredients], totalRMC: project.totalRMC, totalFinalRMC: project.totalFinalRMC, batchSize: project.batchSize }
    };
    return { ...project, versions: [...(project.versions || []), newVersion], lastUpdated: new Date().toISOString().split('T')[0] };
  };

  const handleRDFullAnalysis = async () => {
    if (!selectedRD) return;
    setIsAiLoading(true);
    setRdAiReport('');
    const ai = (await import('@google/genai')).GoogleGenAI;
    try {
      const { analyzeImageOrFile } = await import('./geminiService');
      const prompt = `You are a Senior Pharmaceutical R&D Scientist and Formulation Expert for Al Wajer Pharmaceuticals, Oman.

Analyze this complete pharmaceutical formulation and provide a comprehensive technical report:

PRODUCT: ${selectedRD.title}
Dosage Form: ${selectedRD.dosageForm || 'Not specified'}
Strength: ${selectedRD.strength || 'Not specified'}
Batch Size: ${selectedRD.batchSize} ${selectedRD.batchUnit}
Quality Standard: ${selectedRD.qualityStandards || 'BP/USP'}
Regulatory Status: ${selectedRD.regulatoryStatus || 'Not specified'}

FORMULATION (Ingredients per batch):
${selectedRD.ingredients.map((i,idx) => `${idx+1}. ${i.name} (${i.role}) - ${i.quantity} ${i.unit} @ $${i.rateUSD}/kg = $${i.cost}`).join('\n')}

Total RMC: $${selectedRD.totalRMC} | Cost per kg: $${selectedRD.totalFinalRMC}

Manufacturing Process Notes: ${selectedRD.manufacturingProcess || 'Not provided'}

Provide your expert report as JSON with this exact structure:
{
  "optimizationScore": number (0-100),
  "formulationAssessment": "string (2-3 sentences on overall quality)",
  "apiAnalysis": "string (assessment of API concentration, bioavailability considerations)",
  "excipientCompatibility": "string (compatibility analysis between ingredients)",
  "costOptimizations": ["string array of 3-5 specific cost reduction suggestions with estimated savings"],
  "ingredientSubstitutions": [{"ingredient": "string", "alternative": "string", "reason": "string", "estimatedSavingPct": number}],
  "manufacturingRisks": ["string array of process risks to watch"],
  "qualityParameters": ["string array of key quality tests required: dissolution, hardness, etc"],
  "regulatoryNotes": "string (BP/USP compliance notes for Oman/GCC market)",
  "stabilityRecommendations": "string",
  "overallRecommendation": "string (clear summary of what to do next)"
}`;
      const response = await (await import('./geminiService')).quickInsight(prompt);
      const clean = response.substring(response.indexOf('{'), response.lastIndexOf('}') + 1);
      const parsed = JSON.parse(clean);
      setRdAiReport(JSON.stringify(parsed));
      const updated = { ...selectedRD, optimizationScore: parsed.optimizationScore, aiOptimizationNotes: parsed.overallRecommendation };
      setSelectedRD(updated);
      setRdProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
    } catch(e) {
      setRdAiReport(JSON.stringify({ error: 'Analysis failed. Check your Gemini API key.' }));
    }
    setIsAiLoading(false);
  };

  const generateSpecSheet = async () => {
    if (!selectedRD) return;
    setRdSpecLoading(true);
    const today = new Date().toLocaleDateString('en-GB');
    const ingredientRows = selectedRD.ingredients.map((i, idx) =>
      `<tr><td>${idx+1}</td><td><b>${i.name}</b>${i.grade ? ` (${i.grade})` : ''}</td><td>${i.role}</td><td>${i.quantity}</td><td>${i.unit}</td><td>$${i.rateUSD}</td><td>$${i.cost?.toFixed(2)}</td>${i.supplier ? `<td>${i.supplier}</td>` : '<td>-</td>'}</tr>`
    ).join('');
    const totalIngQty = selectedRD.ingredients.reduce((s,i) => s + i.quantity, 0).toFixed(3);
    let aiProcess = selectedRD.manufacturingProcess || '';
    if (!aiProcess) {
      try {
        aiProcess = await (await import('./geminiService')).quickInsight(
          `Write a concise step-by-step manufacturing process for ${selectedRD.title} (${selectedRD.dosageForm || 'pharmaceutical product'}) with batch size ${selectedRD.batchSize}${selectedRD.batchUnit}. Format as numbered steps, max 10 steps. Be specific and technical.`
        );
      } catch(e) { aiProcess = 'Manufacturing process to be defined.'; }
    }
    const aiReport = rdAiReport ? JSON.parse(rdAiReport) : null;

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  body{font-family:Arial,sans-serif;font-size:10pt;margin:30px;color:#000}
  .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #003087;padding-bottom:10px;margin-bottom:15px}
  .co-name{font-size:13pt;font-weight:bold;color:#003087}
  .co-arabic{font-size:9pt;color:#003087}
  .doc-title{text-align:center;font-size:14pt;font-weight:bold;color:#003087;margin:10px 0;text-decoration:underline}
  table{width:100%;border-collapse:collapse;margin-bottom:12px}
  th,td{border:1px solid #999;padding:5px 7px;font-size:9pt}
  th{background:#e8f0fe;font-weight:bold;text-align:left}
  .section-title{font-size:11pt;font-weight:bold;color:#003087;margin:14px 0 6px 0;border-bottom:1px solid #003087;padding-bottom:2px}
  .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:0}
  .info-cell{border:1px solid #999;padding:5px 8px;font-size:9pt}
  .info-label{font-weight:bold;color:#333}
  .highlight{background:#fffde7}
  .footer{border-top:1px solid #003087;margin-top:20px;padding-top:6px;font-size:8pt;text-align:center;color:#555}
  .score-box{display:inline-block;padding:4px 12px;border-radius:4px;font-weight:bold;font-size:11pt}
  .opt-list li{margin-bottom:4px}
  @media print{body{margin:15px}}
</style></head><body>
<div class="header">
  <div><div class="co-arabic">الـوجـر لصنـاعـة الأدويـة ش.م.م</div><div class="co-name">AL WAJER PHARMACEUTICALS INDUSTRY LLC</div><div style="font-size:8pt;color:#555">Sohar Industrial Area, Sultanate of Oman | C.R: 1145026</div></div>
  <div style="text-align:right;font-size:8pt"><b>Doc No:</b> RD-SPEC-${selectedRD.id}<br/><b>Date:</b> ${today}<br/><b>Version:</b> ${selectedRD.versions?.length ? 'v' + selectedRD.versions.length : 'v01'}<br/><b>Status:</b> ${selectedRD.status}</div>
</div>
<div class="doc-title">FORMULATION SPECIFICATION & COSTING SHEET</div>
<div class="section-title">1. Product Identification</div>
<div class="info-grid">
  <div class="info-cell"><span class="info-label">Product Name:</span> ${selectedRD.title}</div>
  <div class="info-cell"><span class="info-label">Product Code:</span> ${selectedRD.productCode || '-'}</div>
  <div class="info-cell"><span class="info-label">Dosage Form:</span> ${selectedRD.dosageForm || '-'}</div>
  <div class="info-cell"><span class="info-label">Strength:</span> ${selectedRD.strength || '-'}</div>
  <div class="info-cell"><span class="info-label">Therapeutic Category:</span> ${selectedRD.therapeuticCategory || '-'}</div>
  <div class="info-cell"><span class="info-label">Quality Standard:</span> ${selectedRD.qualityStandards || 'BP/USP'}</div>
  <div class="info-cell"><span class="info-label">Shelf Life:</span> ${selectedRD.shelfLife || '24 Months'}</div>
  <div class="info-cell"><span class="info-label">Storage Condition:</span> ${selectedRD.storageCondition || 'Below 25°C'}</div>
  <div class="info-cell"><span class="info-label">Regulatory Status:</span> ${selectedRD.regulatoryStatus || '-'}</div>
  <div class="info-cell"><span class="info-label">Last Updated:</span> ${selectedRD.lastUpdated}</div>
</div>
<div class="section-title">2. Formulation — Batch Size: ${selectedRD.batchSize} ${selectedRD.batchUnit}</div>
<table>
  <thead><tr><th>#</th><th>Raw Material</th><th>Role</th><th>Qty/Batch</th><th>Unit</th><th>Rate (USD)</th><th>Cost (USD)</th><th>Supplier</th></tr></thead>
  <tbody>${ingredientRows}</tbody>
  <tfoot>
    <tr style="background:#f5f5f5"><td colspan="3"><b>TOTAL</b></td><td><b>${totalIngQty}</b></td><td>Kg</td><td>—</td><td><b>$${selectedRD.totalRMC?.toFixed(2)}</b></td><td></td></tr>
    <tr class="highlight"><td colspan="6"><b>RAW MATERIAL COST PER KG (including ${(selectedRD.loss*100).toFixed(1)}% loss)</b></td><td colspan="2"><b>$${selectedRD.totalFinalRMC} / Kg</b></td></tr>
  </tfoot>
</table>
<div class="section-title">3. Manufacturing Process</div>
<p style="white-space:pre-wrap;font-size:9pt;line-height:1.6">${aiProcess}</p>
${aiReport ? `
<div class="section-title">4. AI Formulation Analysis (Score: <span class="score-box" style="background:${aiReport.optimizationScore>=90?'#e8f5e9':'#fff9c4'};color:${aiReport.optimizationScore>=90?'#2e7d32':'#f57f17'}">${aiReport.optimizationScore}/100</span>)</div>
<table><tr><th>Assessment</th><td>${aiReport.formulationAssessment || '-'}</td></tr>
<tr><th>API Analysis</th><td>${aiReport.apiAnalysis || '-'}</td></tr>
<tr><th>Excipient Compatibility</th><td>${aiReport.excipientCompatibility || '-'}</td></tr>
<tr><th>Stability</th><td>${aiReport.stabilityRecommendations || '-'}</td></tr>
<tr><th>Regulatory Notes</th><td>${aiReport.regulatoryNotes || '-'}</td></tr>
<tr><th>Overall Recommendation</th><td><b>${aiReport.overallRecommendation || '-'}</b></td></tr></table>
${aiReport.costOptimizations?.length ? `<div class="section-title">5. Cost Optimization Suggestions</div><ol class="opt-list">${aiReport.costOptimizations.map((c:string)=>`<li>${c}</li>`).join('')}</ol>` : ''}
${aiReport.ingredientSubstitutions?.length ? `<div class="section-title">6. Ingredient Substitution Options</div><table><thead><tr><th>Current Ingredient</th><th>Suggested Alternative</th><th>Reason</th><th>Est. Saving</th></tr></thead><tbody>${aiReport.ingredientSubstitutions.map((s:any)=>`<tr><td>${s.ingredient}</td><td>${s.alternative}</td><td>${s.reason}</td><td>${s.estimatedSavingPct}%</td></tr>`).join('')}</tbody></table>` : ''}
${aiReport.qualityParameters?.length ? `<div class="section-title">7. Quality Control Parameters</div><ul class="opt-list">${aiReport.qualityParameters.map((q:string)=>`<li>${q}</li>`).join('')}</ul>` : ''}
` : '<div class="section-title">4. AI Analysis</div><p style="color:#888;font-size:9pt">Click "AI FULL ANALYSIS" in the app to generate AI insights, then regenerate this spec sheet.</p>'}
<div class="section-title">${aiReport ? '8' : '4'}. Version History</div>
<table><thead><tr><th>Version</th><th>Date</th><th>Summary</th></tr></thead>
<tbody>${(selectedRD.versions || [{version:'v01', date: selectedRD.lastUpdated, summary:'Initial formulation'}]).map(v=>`<tr><td>${v.version}</td><td>${v.date?.split('T')[0]}</td><td>${v.summary}</td></tr>`).join('')}</tbody></table>
<div class="footer">
  Prepared by: R&D Department — AL WAJER PHARMACEUTICALS INDUSTRY LLC, Sohar, Oman &nbsp;|&nbsp; This document is confidential and for internal use only.
</div>
</body></html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `SpecSheet_${selectedRD.id}_${selectedRD.title.replace(/\s+/g,'_').substring(0,30)}.html`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    logAction('SPEC_GENERATED', `Generated spec sheet for ${selectedRD.title}`);
    setRdSpecLoading(false);
  };


  const createNewChat = () => {
    const id = `chat-${Date.now()}`;
    const newSession = { id, title: 'New Chat', provider: activeProvider, messages: [], createdAt: new Date().toISOString(), archived: false };
    setChatSessions(prev => [newSession, ...prev.filter(s => !s.archived || s.messages.length > 0)]);
    setActiveChatId(id);
    setAiCmdHistory([]);
  };

  const archiveChat = (chatId: string) => {
    setChatSessions(prev => prev.map(s => s.id === chatId ? {...s, archived: true} : s));
    const remaining = chatSessions.filter(s => s.id !== chatId && !s.archived);
    if (remaining.length > 0) {
      setActiveChatId(remaining[0].id);
      setAiCmdHistory(remaining[0].messages);
    } else {
      createNewChat();
    }
  };

  const switchChat = (chatId: string) => {
    const session = chatSessions.find(s => s.id === chatId);
    if (session) { setActiveChatId(chatId); setAiCmdHistory(session.messages); }
  };

  const handleSkillFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      // .skill files are zip archives containing SKILL.md
      const arrayBuffer = await file.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);
      // Try to extract text from the zip — look for SKILL.md content
      const text = new TextDecoder('utf-8', { fatal: false }).decode(uint8);
      // Find SKILL.md content between PK markers
      const mdMatch = text.match(/---\n([\s\S]*?)---\n([\s\S]*)/);
      let skillName = file.name.replace(/\.skill$/,'').replace(/-/g,' ').replace(/\b\w/g, c => c.toUpperCase());
      let description = 'Imported skill';
      let prompt = '';
      if (mdMatch) {
        const frontmatter = mdMatch[1];
        const body = mdMatch[2];
        const nameMatch = frontmatter.match(/name:\s*["']?([^"'\n]+)["']?/);
        const descMatch = frontmatter.match(/description:\s*["']?([^"'\n]+)["']?/);
        if (nameMatch) skillName = nameMatch[1].replace(/-/g,' ').replace(/\b\w/g, c => c.toUpperCase());
        if (descMatch) description = descMatch[1];
        // Convert markdown body to a system prompt
        prompt = body
          .replace(/#+\s*/g, '')
          .replace(/\*\*([^*]+)\*\*/g, '$1')
          .replace(/\*([^*]+)\*/g, '$1')
          .trim()
          .substring(0, 2000);
      } else {
        // Fallback — use filename as skill name and readable content as prompt
        prompt = `You are a specialist applying the ${skillName} methodology. ${description}`;
      }
      const newSkill = {
        id: `SK-${Date.now()}`,
        name: skillName,
        provider: 'Claude' as 'Claude'|'Gemini'|'NotebookLM',
        description,
        prompt: prompt || `Apply ${skillName} expertise to assist Al Wajer Pharmaceuticals operations.`,
        category: 'Imported',
        usageCount: 0,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setSavedSkills(prev => [newSkill, ...prev]);
      logAction('IMPORT', `Imported skill: ${skillName}`);
      setAiCmdTab('skills');
      e.target.value = '';
    } catch(err) {
      console.error('Skill import error:', err);
    }
  };

  const handleAICommandSend = async (inputOverride?: string) => {
    const msg = (inputOverride || aiCmdInput).trim();
    if (!msg || isAiLoading) return;
    setAiCmdInput('');
    const activeSkill = savedSkills.find((s: any) => s.id === activeSkillId);
    const provider = activeSkill ? activeSkill.provider : activeProvider;
    const userMsg = { role: 'user' as const, text: msg, provider, skillName: activeSkill?.name };
    const updatedMessages = [...(chatSessions.find(s => s.id === activeChatId)?.messages || []), userMsg];
    // Auto-title chat from first message
    const chatTitle = updatedMessages.length === 1 ? msg.substring(0, 40) + (msg.length > 40 ? '...' : '') : (chatSessions.find(s => s.id === activeChatId)?.title || 'Chat');
    setChatSessions(prev => prev.map(s => s.id === activeChatId ? {...s, messages: updatedMessages, title: chatTitle, provider} : s));
    setAiCmdHistory(updatedMessages);
    setIsAiLoading(true);
    try {
      let systemPrompt = 'You are the Al Wajer Pharmaceuticals AI assistant. Be concise, professional, and precise.';
      if (activeSkill) systemPrompt = activeSkill.prompt;
      else if (provider === 'Claude') systemPrompt = 'You are the Chief Operations Officer AI for Al Wajer Pharmaceuticals, Sohar, Oman. You specialize in pharmaceutical operations, compliance, production planning, and strategic decisions. Be direct and precise.';
      else if (provider === 'Gemini') systemPrompt = 'You are Al Wajer Pharmaceuticals data intelligence engine. Analyze pharmaceutical data, formulations, and market data. Use numbers and specifics.';
      else if (provider === 'NotebookLM') systemPrompt = 'You are Al Wajer Pharmaceuticals knowledge specialist. Synthesize information into clear narratives and presentation-ready content.';
      const { callAIProxy, extractText } = await import('./aiProxyService');
      const providerKey = provider.toLowerCase() as any;
      const responseData = await callAIProxy({
        provider: providerKey === 'notebooklm' ? 'gemini' : providerKey,
        system: systemPrompt,
        messages: [{ role: 'user', content: msg }]
      });
      const response = extractText(responseData, providerKey === 'notebooklm' ? 'gemini' : providerKey);
      if (activeSkill) setSavedSkills((prev: any) => prev.map((s: any) => s.id === activeSkillId ? {...s, usageCount: s.usageCount + 1} : s));
      const modelMsg = { role: 'model' as const, text: response || 'No response.', provider, skillName: activeSkill?.name };
      const finalMessages = [...updatedMessages, modelMsg];
      setChatSessions(prev => prev.map(s => s.id === activeChatId ? {...s, messages: finalMessages} : s));
      setAiCmdHistory(finalMessages);
    } catch(e) {
      const errMsg = { role: 'model' as const, text: 'Error — check your Gemini API key in Settings.', provider };
      const finalMessages = [...updatedMessages, errMsg];
      setChatSessions(prev => prev.map(s => s.id === activeChatId ? {...s, messages: finalMessages} : s));
      setAiCmdHistory(finalMessages);
    }
    setIsAiLoading(false);
  };

  const handleOptimizeFormulation = async () => {
    if (!selectedRD) return;
    setIsAiLoading(true);
    try {
      const result = await optimizeFormulation(selectedRD);
      if (result.optimizedIngredients && result.optimizedIngredients.length > 0) {
        let updated = { ...selectedRD, ingredients: result.optimizedIngredients, optimizationScore: 98 };
        updated = calculateCosting(updated);
        setRdProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
        setSelectedRD(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiLoading(false);
    }
  };
  
  const openModal = (type: 'view' | 'edit' | 'add', section: string, data?: any) => {
    setModalType(type);
    setCurrentSection(section);
    setModalData(data || {});
    setIsModalOpen(true);
  };
  
  const handleModalSave = async () => {
    // If ADD mode, show confirmation first
    if (modalType === 'add') {
      const itemName = (modalData as any).name || (modalData as any).product || (modalData as any).title || (modalData as any).customer || 'Item';
      
      showConfirmation('add', currentSection, itemName, async () => {
        await performSave();
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      });
    } else {
      // For edit mode, save directly
      await performSave();
    }
  };

  // Actual save logic extracted to separate function
  const performSave = async () => {
    let newItem = { ...modalData };
    const tempId = `${currentSection.substring(0,3).toUpperCase()}-${Math.floor(Math.random()*1000)}`;
    
    try {
      if (modalType === 'add') {
        newItem.id = newItem.id || tempId;
        
        if (currentSection === 'production') {
          const payload = {
            id: newItem.id,
            product: newItem.product,
            quantity: Number(newItem.quantity),
            actual_yield: Number(newItem.actualYield),
            expected_yield: Number(newItem.expectedYield),
            status: newItem.status,
            timestamp: new Date().toISOString(),
            batch_number: newItem.id,
            yield_percent: (Number(newItem.actualYield) / Number(newItem.expectedYield)) * 100
          };
          setBatches(prev => [...prev, newItem]);
          await supabase.from('production_yields').insert(payload);
          await logAction('CREATE', `Created batch: ${newItem.id}`);
        } else if (currentSection === 'sales') {
          const payload = {
            id: newItem.id,
            s_no: newItem.sNo,
            invoice_no: newItem.invoiceNo,
            customer: newItem.customer,
            country: newItem.country,
            product: newItem.product,
            quantity: Number(newItem.quantity),
            rate_usd: Number(newItem.rateUSD || 0),
            amount_usd: Number(newItem.amountUSD),
            amount_omr: Number(newItem.amountOMR),
            status: newItem.status,
            payment_method: newItem.paymentMethod || 'LC at Sight',
            shipping_method: newItem.shippingMethod || 'By Sea',
            date: newItem.date || new Date().toISOString().split('T')[0]
          };
          setOrders(prev => [...prev, newItem]);
          await supabase.from('orders').insert(payload);
          await logAction('CREATE', `Created order: ${newItem.id}`);
        } else if (currentSection === 'inventory') {
          const payload = {
            id: newItem.id,
            s_no: newItem.sNo,
            name: newItem.name,
            category: newItem.category,
            stock: Number(newItem.stock),
            required_for_orders: Number(newItem.requiredForOrders),
            balance_to_purchase: Number(newItem.balanceToPurchase),
            unit: newItem.unit,
            stock_date: newItem.stockDate
          };
          setInventory(prev => [...prev, newItem]);
          await supabase.from('inventory').insert(payload);
          await logAction('CREATE', `Added item: ${newItem.name}`);
        } else if (currentSection === 'accounting') {
          setExpenses(prev => [...prev, newItem]);
          // await supabase.from('expenses').insert(newItem);
          await logAction('CREATE', `Added expense: ${newItem.description}`);
        } else if (currentSection === 'hr') {
          setEmployees(prev => [...prev, newItem]);
          // await supabase.from('employees').insert(newItem);
          await logAction('CREATE', `Added employee: ${newItem.name}`);
        } else if (currentSection === 'procurement') {
          setVendors(prev => [...prev, newItem]);
          await logAction('CREATE', `Added vendor: ${newItem.name}`);
        } else if (currentSection === 'bd') {
          setBdLeads(prev => [...prev, newItem]);
          await logAction('CREATE', `Added BD Lead: ${newItem.targetMarket || newItem.name || 'Lead'}`);
        } else if (currentSection === 'samples') {
          setSamples(prev => [...prev, newItem]);
          await logAction('CREATE', `Added Sample: ${newItem.product || 'Sample'}`);
        }
      } else if (modalType === 'edit') {
        if (currentSection === 'production') {
          setBatches(prev => prev.map(b => b.id === newItem.id ? newItem : b));
          await supabase.from('production_yields').update({
            product: newItem.product,
            quantity: Number(newItem.quantity),
            actual_yield: Number(newItem.actualYield),
            expected_yield: Number(newItem.expectedYield),
            status: newItem.status
          }).eq('id', newItem.id);
          await logAction('UPDATE', `Updated batch: ${newItem.id}`);
        } else if (currentSection === 'sales') {
          setOrders(prev => prev.map(o => o.id === newItem.id ? newItem : o));
          await supabase.from('orders').update({
            invoice_no: newItem.invoiceNo,
            customer: newItem.customer,
            product: newItem.product,
            quantity: Number(newItem.quantity),
            rate_usd: Number(newItem.rateUSD || 0),
            amount_usd: Number(newItem.amountUSD),
            status: newItem.status
          }).eq('id', newItem.id);
          await logAction('UPDATE', `Updated order: ${newItem.id}`);
        } else if (currentSection === 'inventory') {
          setInventory(prev => prev.map(i => i.id === newItem.id ? newItem : i));
          await supabase.from('inventory').update({
            name: newItem.name,
            stock: Number(newItem.stock),
            required_for_orders: Number(newItem.requiredForOrders),
            balance_to_purchase: Number(newItem.balanceToPurchase)
          }).eq('id', newItem.id);
          await logAction('UPDATE', `Updated item: ${newItem.name}`);
        } else if (currentSection === 'accounting') {
          setExpenses(prev => prev.map(e => e.id === newItem.id ? newItem : e));
          // await supabase.from('expenses').update(newItem).eq('id', newItem.id);
        } else if (currentSection === 'hr') {
          setEmployees(prev => prev.map(e => e.id === newItem.id ? newItem : e));
          // await supabase.from('employees').update(newItem).eq('id', newItem.id);
        }
      }
    } catch (err) {
      console.error("Save failed:", err);
      // Display error as a toast notification instead of alert
      setUploadProgress({
        isUploading: false,
        fileName: 'Error',
        progress: 0,
        status: 'error',
        message: 'Database error: Check your Supabase configuration.'
      });
    }

    setIsModalOpen(false);
  };
  
  const toggleBatchExpansion = (id: string) => {
    setExpandedBatchId(expandedBatchId === id ? null : id);
  };

  // --- Render Functions ---

  // NEW: Upload Progress Component
  const renderUploadProgress = () => {
    if (!uploadProgress.isUploading && uploadProgress.status !== 'error') return null;

    return (
      <div className="fixed bottom-4 right-4 bg-slate-900/95 backdrop-blur-sm border border-[#D4AF37]/30 rounded-lg p-4 shadow-2xl z-50 min-w-[300px] max-w-[400px] animate-fadeIn">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {uploadProgress.status === 'uploading' && (
              <Upload className="text-[#F4C430] animate-pulse" size={18} />
            )}
            {uploadProgress.status === 'processing' && (
              <Loader2 className="text-[#F4C430] animate-spin" size={18} />
            )}
            {uploadProgress.status === 'complete' && (
              <CheckCircle2 className="text-green-400" size={18} />
            )}
            {uploadProgress.status === 'error' && (
              <AlertCircle className="text-red-400" size={18} />
            )}
            <span className="text-sm font-medium text-white">{uploadProgress.message}</span>
          </div>
        </div>
        <div className="text-xs text-slate-400 mb-2 truncate">{uploadProgress.fileName}</div>
        {uploadProgress.status !== 'error' && (
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full luxury-gradient transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress.progress}%` }}
            />
          </div>
        )}
      </div>
    );
  };

  // NEW: Render Confirmation Dialog
  const renderConfirmationDialog = () => {
    if (!confirmDialog.isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[90] p-4 animate-fadeIn">
        <div className="bg-slate-900 border-2 border-[#D4AF37] rounded-2xl max-w-md w-full p-6 shadow-2xl gold-glow">
          <div className="flex items-start gap-4 mb-6">
            <div className={`p-3 rounded-xl ${confirmDialog.type === 'delete' ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
              {confirmDialog.type === 'delete' ? (
                <AlertTriangle className="text-red-500" size={24} />
              ) : (
                <CheckCircle2 className="text-green-500" size={24} />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">
                {confirmDialog.type === 'delete' ? 'Confirm Deletion' : 'Confirm Addition'}
              </h3>
              <p className="text-slate-300 text-sm">
                {confirmDialog.type === 'delete' 
                  ? `Are you sure you want to delete "${confirmDialog.itemName}"? This action cannot be undone.`
                  : `Are you sure you want to add "${confirmDialog.itemName}" to ${confirmDialog.itemType}?`
                }
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={confirmDialog.onCancel}
              className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold transition-all"
            >
              Cancel
            </button>
            <button
              onClick={confirmDialog.onConfirm}
              className={`flex-1 px-4 py-2.5 rounded-lg font-bold transition-all ${
                confirmDialog.type === 'delete'
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {confirmDialog.type === 'delete' ? 'Delete' : 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleSaveSettings = () => {
      // Save General Config
      localStorage.setItem('erp_api_config', JSON.stringify({
          claudeKey: apiConfig.claudeKey,
          notebookLmSource: apiConfig.notebookLmSource
      }));

      // Save Supabase Config specifically for the client to pick up on reload
      if (apiConfig.supabaseUrl) localStorage.setItem('erp_supabase_url', apiConfig.supabaseUrl);
      if (apiConfig.supabaseKey) localStorage.setItem('erp_supabase_key', apiConfig.supabaseKey);

      setIsSettingsOpen(false);
      
      // Optional: specific alert if Supabase changed
      if (apiConfig.supabaseUrl && apiConfig.supabaseKey) {
          if (confirm("Settings saved. Reload to apply new Database connection?")) {
              window.location.reload();
          }
      }
  };

  const renderSettingsModal = () => {
      if (!isSettingsOpen) return null;
      return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-slate-900 border border-[#D4AF37] rounded-xl w-full max-w-lg shadow-2xl gold-glow flex flex-col max-h-[85vh]">
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#D4AF37]/10">
                    <h3 className="text-xl font-bold text-white uppercase tracking-widest flex items-center gap-2">
                        <Settings size={20}/> System Configuration
                    </h3>
                    <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-white"><X size={24}/></button>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                    
                    {/* Database Config */}
                    <div className="space-y-3 pb-4 border-b border-white/5">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            <CloudCog size={16}/> Backend Connection (Supabase)
                        </h4>
                        <div className="space-y-2">
                            <input 
                                type="text" 
                                value={apiConfig.supabaseUrl}
                                onChange={(e) => setApiConfig({...apiConfig, supabaseUrl: e.target.value})}
                                placeholder="https://xyz.supabase.co"
                                className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-2 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
                            />
                            <input 
                                type="password" 
                                value={apiConfig.supabaseKey}
                                onChange={(e) => setApiConfig({...apiConfig, supabaseKey: e.target.value})}
                                placeholder="public-anon-key"
                                className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-2 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
                            />
                        </div>
                        <p className="text-[10px] text-slate-500">
                            Leave blank if using system Environment Variables (NEXT_PUBLIC_...). 
                            <br/>Enter manually to override or connect from a new device.
                        </p>
                    </div>

                    {/* Gemini Config (System Managed) */}
                    <div className="space-y-2 pb-4 border-b border-white/5">
                        <h4 className="text-sm font-bold text-[#D4AF37] flex items-center gap-2">
                            <Zap size={16}/> Google Gemini (Primary)
                        </h4>
                        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                            <ShieldCheck size={16} className="text-green-500"/>
                            <div className="flex-1">
                                <div className="text-xs font-bold text-green-400">System Connected</div>
                                <div className="text-[10px] text-slate-400">Secure Environment Key Active</div>
                            </div>
                        </div>
                    </div>

                    {/* Claude Config */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            <BotIcon/> Anthropic Claude
                        </h4>
                        <div className="relative">
                            <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
                            <input 
                                type="password" 
                                value={apiConfig.claudeKey}
                                onChange={(e) => setApiConfig({...apiConfig, claudeKey: e.target.value})}
                                placeholder="sk-ant-..."
                                className="w-full bg-slate-950 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
                            />
                        </div>
                        <p className="text-[10px] text-slate-500">Enter API Key to enable Claude 3.5 Sonnet integration.</p>
                    </div>

                    {/* NotebookLM Config */}
                    <div className="space-y-2 pt-4 border-t border-white/5">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            <Database size={16}/> NotebookLM (RAG)
                        </h4>
                         <div className="relative">
                            <Link size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
                            <input 
                                type="text" 
                                value={apiConfig.notebookLmSource}
                                onChange={(e) => setApiConfig({...apiConfig, notebookLmSource: e.target.value})}
                                placeholder="Source ID / Knowledge Graph ID"
                                className="w-full bg-slate-950 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
                            />
                        </div>
                        <p className="text-[10px] text-slate-500">Connect to your custom NotebookLM knowledge source.</p>
                    </div>

                </div>
                <div className="p-6 border-t border-white/10 flex justify-end gap-3 bg-slate-950">
                    <button onClick={handleSaveSettings} className="luxury-gradient px-6 py-2 rounded-lg text-slate-950 font-bold text-sm">Save & Close</button>
                </div>
            </div>
        </div>
      );
  };

  const renderCustomizeModal = () => {
      if (!isCustomizeOpen) return null;
      return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-slate-900 border border-[#D4AF37] rounded-xl w-full max-w-2xl shadow-2xl gold-glow flex flex-col max-h-[85vh]">
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#D4AF37]/10">
                    <h3 className="text-xl font-bold text-white uppercase tracking-widest flex items-center gap-2">
                        <LayoutDashboard size={20}/> Customize Dashboard
                    </h3>
                    <button onClick={() => setIsCustomizeOpen(false)} className="text-slate-400 hover:text-white"><X size={24}/></button>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <p className="text-sm text-slate-400 mb-6">Select which widgets to display on your operational dashboard. Changes are saved automatically.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {ALL_WIDGETS.map(widget => (
                            <div 
                                key={widget.id} 
                                onClick={() => toggleWidget(widget.id)}
                                className={`p-4 rounded-lg border cursor-pointer transition-all flex items-center justify-between group ${
                                    visibleWidgets.includes(widget.id) 
                                    ? 'bg-[#D4AF37]/20 border-[#D4AF37]' 
                                    : 'bg-slate-950 border-white/10 hover:border-white/30'
                                }`}
                            >
                                <div>
                                    <div className={`text-sm font-bold ${visibleWidgets.includes(widget.id) ? 'text-white' : 'text-slate-400'}`}>{widget.label}</div>
                                    <div className="text-[10px] text-slate-500 uppercase font-bold mt-1">{widget.category} • {widget.type}</div>
                                </div>
                                {visibleWidgets.includes(widget.id) 
                                    ? <CheckSquare className="text-[#D4AF37]" size={20}/> 
                                    : <Square className="text-slate-600 group-hover:text-slate-400" size={20}/>
                                }
                            </div>
                        ))}
                    </div>
                </div>
                <div className="p-6 border-t border-white/10 flex justify-end gap-3 bg-slate-950">
                    <button onClick={() => setIsCustomizeOpen(false)} className="luxury-gradient px-6 py-2 rounded-lg text-slate-950 font-bold text-sm">Done</button>
                </div>
            </div>
        </div>
      );
  };

  const renderModal = () => {
    if (!isModalOpen) return null;
    const renderField = (label: string, key: string, type: 'text' | 'number' | 'select' | 'date' = 'text', options?: string[]) => {
      const value = modalData[key] === undefined ? '' : modalData[key];
      
      return (
        <div key={key} className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-[#D4AF37] tracking-wider">{label}</label>
          {type === 'select' ? (
            <select
              disabled={modalType === 'view'}
              value={value}
              onChange={(e) => setModalData({ ...modalData, [key]: e.target.value })}
              className="w-full bg-slate-950 border border-white/10 rounded p-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none appearance-none"
            >
              {options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          ) : (
            <input
              type={type}
              disabled={modalType === 'view'}
              value={value}
              onChange={(e) => setModalData({ ...modalData, [key]: type === 'number' ? Number(e.target.value) : e.target.value })}
              className="w-full bg-slate-950 border border-white/10 rounded p-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
            />
          )}
        </div>
      );
    };

    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
        <div className="bg-slate-900 border border-[#D4AF37] rounded-xl w-full max-w-lg shadow-2xl gold-glow flex flex-col max-h-[85vh]">
          <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#D4AF37]/10">
            <h3 className="text-xl font-bold text-white uppercase tracking-widest flex items-center gap-2">
              {modalType === 'view' ? <Eye size={20}/> : modalType === 'edit' ? <Edit2 size={20}/> : <Plus size={20}/>}
              {modalType === 'view' ? 'View Details' : modalType === 'edit' ? 'Edit Details' : 'Add New Entry'}
            </h3>
            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X size={24}/></button>
          </div>
          <div className="p-6 overflow-y-auto custom-scrollbar space-y-4">
            {currentSection === 'inventory' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  {renderField('S.No', 'sNo')}
                  {renderField('Category', 'category', 'select', ['API', 'Excipient', 'Packing', 'Finished'])}
                </div>
                {renderField('Material Name', 'name')}
                <div className="grid grid-cols-2 gap-4">
                  {renderField('Present Stock', 'stock', 'number')}
                  {renderField('Unit', 'unit', 'select', ['kg', 'L', 'Units', 'Rolls'])}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {renderField('Required Qty', 'requiredForOrders', 'number')}
                  {renderField('Stock Date', 'stockDate', 'text')}
                </div>
                {renderField('Balance to Purchase', 'balanceToPurchase', 'number')}
              </>
            )}

            {currentSection === 'sales' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  {renderField('Invoice No', 'invoiceNo')}
                  {renderField('Date', 'date', 'text')}
                </div>
                {renderField('Party / Customer', 'customer')}
                <div className="grid grid-cols-2 gap-4">
                  {renderField('Country', 'country')}
                  {renderField('Status', 'status', 'select', ['Pending', 'Going to Dispatch', 'Existing Orders', 'New Expected', 'Processing', 'Shipped', 'Delivered', 'Cancelled'])}
                </div>
                {renderField('Product Name', 'product')}
                                <div className="grid grid-cols-2 gap-4">
                  {renderField('Qty (KG)', 'quantity', 'number')}
                  {renderField('Unit Rate (USD/KG)', 'rateUSD', 'number')}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {renderField('Amt (USD)', 'amountUSD', 'number')}
                  {renderField('Amt (OMR)', 'amountOMR', 'number')}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {renderField('Payment Method', 'paymentMethod', 'select', ['LC at Sight', 'LC 30 Days', 'LC 60 Days', 'Advance', 'TT in Advance', 'Open Account'])}
                  {renderField('Shipping Method', 'shippingMethod', 'select', ['By Air', 'By Sea', 'CIF by Air', 'CIF by Sea', 'FOB', 'Ex-Works'])}
                </div>
              </>
            )}

            {currentSection === 'production' && (
              <>
                {renderField('Batch ID', 'id')}
                {renderField('Product', 'product')}
                <div className="grid grid-cols-2 gap-4">
                  {renderField('Quantity (Kg)', 'quantity', 'number')}
                  {renderField('Status', 'status', 'select', ['Scheduled', 'In-Progress', 'Completed', 'Quarantined'])}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {renderField('Actual Yield %', 'actualYield', 'number')}
                  {renderField('Expected Yield %', 'expectedYield', 'number')}
                </div>
                {renderField('Dispatch Date', 'dispatchDate', 'text')}
              </>
            )}

            {/* Fallback for other sections */}
            {!['inventory', 'sales', 'production'].includes(currentSection) && Object.keys(modalData).filter(k => k !== 'id').map(key => renderField(key, key))}
          </div>
          <div className="p-6 border-t border-white/10 flex justify-end gap-3 bg-slate-950">
            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white font-bold text-sm">Close</button>
            {modalType !== 'view' && (
              <button onClick={handleModalSave} className="luxury-gradient px-6 py-2 rounded-lg text-slate-950 font-bold text-sm">
                  {currentSection === 'production' ? 'Log Batch' : currentSection === 'sales' ? 'Update Orders' : 'Save Changes'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderHistory = () => (
      <div className="space-y-6 animate-fadeIn">
          <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <History className="text-[#F4C430]" size={20} /> Audit History
              </h2>
              <div className="text-xs text-slate-500">Permanent Record from Database</div>
          </div>
          <div className="bg-slate-900/50 border border-[#D4AF37]/30 rounded-xl p-6 gold-glow">
              <div className="overflow-x-auto">
                  <table className="w-full text-left">
                      <thead>
                          <tr className="border-b border-white/5 text-slate-500 text-xs uppercase">
                              <th className="pb-4 px-4">Timestamp</th>
                              <th className="pb-4 px-4">User</th>
                              <th className="pb-4 px-4">Action</th>
                              <th className="pb-4 px-4">Details</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                          {auditLogs.length === 0 ? (
                              <tr><td colSpan={4} className="p-4 text-center text-slate-500 text-sm">No history logs found.</td></tr>
                          ) : (
                              auditLogs.map((log, idx) => (
                                  <tr key={idx} className="hover:bg-white/5">
                                      <td className="py-3 px-4 text-slate-400 text-xs font-mono">{new Date(log.timestamp).toLocaleString()}</td>
                                      <td className="py-3 px-4 text-white text-sm font-bold">{log.user}</td>
                                      <td className="py-3 px-4">
                                          <span className="bg-slate-800 text-[#D4AF37] px-2 py-1 rounded text-[10px] uppercase font-bold border border-white/10">
                                              {log.action}
                                          </span>
                                      </td>
                                      <td className="py-3 px-4 text-slate-300 text-sm">{log.details}</td>
                                  </tr>
                              ))
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      </div>
  );

  const renderProduction = () => (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Factory className="text-[#F4C430]" size={20} /> Manufacturing Operations
          </h2>
          <button onClick={() => openModal('add', 'production', {id: `B-${new Date().getFullYear().toString().slice(-2)}-${Math.floor(Math.random()*900)+100}`, product: '', quantity: 0, actualYield: 0, expectedYield: 100, status: 'Scheduled', dispatchDate: ''})} className="bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37] px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-all">
            <Plus size={16} /> Log New Batch
          </button>
      </div>
      <div className="bg-slate-900/50 border border-[#D4AF37]/30 rounded-xl p-6 gold-glow">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-slate-500 text-xs uppercase">
                <th className="pb-4 px-4 font-bold">Batch ID</th>
                <th className="pb-4 px-4 font-bold">Product</th>
                <th className="pb-4 px-4 font-bold">Qty (Kg)</th>
                <th className="pb-4 px-4 font-bold">Dispatch</th>
                <th className="pb-4 px-4 font-bold">Yield</th>
                <th className="pb-4 px-4 font-bold">Status</th>
                <th className="pb-4 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {batches.map(batch => (
                <React.Fragment key={batch.id}>
                  <tr className={`hover:bg-white/5 transition-all duration-200 ${expandedBatchId === batch.id ? 'bg-white/5' : ''}`}>
                    <td className="py-4 px-4 font-mono text-sm text-[#F4C430] cursor-pointer" onClick={() => toggleBatchExpansion(batch.id)}>
                      <div className="flex items-center gap-2">
                        <ChevronDown size={14} className={`transition-transform duration-200 ${expandedBatchId === batch.id ? 'rotate-180' : ''}`} />
                        {batch.id}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-white font-medium text-sm">{batch.product}</td>
                    <td className="py-4 px-4 text-white font-mono text-sm">{batch.quantity.toLocaleString()}</td>
                    <td className="py-4 px-4 text-slate-300 text-sm">{batch.dispatchDate || '-'}</td>
                    <td className="py-4 px-4">
                      <span className={`text-sm font-bold ${Math.abs(batch.actualYield - batch.expectedYield) > 2 ? 'text-red-400' : 'text-green-400'}`}>
                        {batch.actualYield}%
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                        batch.status === 'Completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                        batch.status === 'Scheduled' ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' :
                        'bg-blue-500/10 text-blue-500 border-blue-500/20'
                      }`}>
                        {batch.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                        <div className="flex justify-end gap-2">
                            <button onClick={() => openModal('view', 'production', batch)} className="p-1.5 rounded hover:bg-blue-500/20 text-blue-400" title="View"><Eye size={14}/></button>
                            <button onClick={() => openModal('edit', 'production', batch)} className="p-1.5 rounded hover:bg-yellow-500/20 text-[#F4C430]" title="Edit"><Edit2 size={14}/></button>
                            <button onClick={() => handleDelete('production', batch.id, batch.product)} className="p-1.5 rounded hover:bg-red-500/20 text-red-500" title="Delete"><Trash2 size={14}/></button>
                        </div>
                    </td>
                  </tr>
                  {expandedBatchId === batch.id && (
                    <tr className="bg-slate-950/40 border-l-2 border-[#D4AF37]">
                      <td colSpan={7} className="p-0">
                        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded bg-slate-900 border border-white/5 text-[#F4C430]">
                              <BarChart3 size={18} />
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-500 uppercase font-bold">Yield Details</p>
                              <p className="text-sm text-white font-semibold">
                                Actual: {batch.actualYield}% / Exp: {batch.expectedYield}% 
                              </p>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderInventory = () => {
    // Filter Inventory Based on Tabs
    const rawMaterials = inventory.filter(i => i.category === 'API' || i.category === 'Excipient');
    const packingMaterials = inventory.filter(i => i.category === 'Packing');
    const spareParts = inventory.filter(i => i.category === 'Spare');
    const finishedGoods = inventory.filter(i => i.category === 'Finished');
    
    const displayItems = 
      inventoryTab === 'raw' ? rawMaterials : 
      inventoryTab === 'packing' ? packingMaterials :
      inventoryTab === 'spares' ? spareParts : finishedGoods;
    const criticalItems = displayItems.filter(i => (i.balanceToPurchase && i.balanceToPurchase > 0) || i.stock <= i.safetyStock * 0.2);

    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Boxes className="text-[#F4C430]" size={20} /> Inventory Control
            </h2>
    <div className="flex gap-2">
            <button onClick={() => exportToCSV(inventory, 'inventory_report')} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
              <Download size={14}/> Export
            </button>
            <button onClick={() => openModal('add', 'inventory', {id: `RM-${Math.floor(Math.random()*900)+100}`, sNo: '', name: '', category: 'API', stock: 0, requiredForOrders: 0, balanceToPurchase: 0, unit: 'kg', stockDate: new Date().toLocaleDateString()})} className="bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37] px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-all">
              <Plus size={16} /> Add Material
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-4 border-b border-white/5 overflow-x-auto custom-scrollbar">
            <button 
                onClick={() => setInventoryTab('raw')}
                className={`pb-2 px-4 text-sm font-bold whitespace-nowrap transition-all ${inventoryTab === 'raw' ? 'text-[#F4C430] border-b-2 border-[#F4C430]' : 'text-slate-500 hover:text-white'}`}
            >
                Raw Materials
            </button>
            <button 
                onClick={() => setInventoryTab('packing')}
                className={`pb-2 px-4 text-sm font-bold whitespace-nowrap transition-all ${inventoryTab === 'packing' ? 'text-[#F4C430] border-b-2 border-[#F4C430]' : 'text-slate-500 hover:text-white'}`}
            >
                Packing Materials
            </button>
            <button 
                onClick={() => setInventoryTab('spares')}
                className={`pb-2 px-4 text-sm font-bold whitespace-nowrap transition-all ${inventoryTab === 'spares' ? 'text-[#F4C430] border-b-2 border-[#F4C430]' : 'text-slate-500 hover:text-white'}`}
            >
                Equipment Spares
            </button>
            <button 
                onClick={() => setInventoryTab('finished')}
                className={`pb-2 px-4 text-sm font-bold whitespace-nowrap transition-all ${inventoryTab === 'finished' ? 'text-[#F4C430] border-b-2 border-[#F4C430]' : 'text-slate-500 hover:text-white'}`}
            >
                Finished Goods
            </button>
        </div>

        {criticalItems.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl flex items-center gap-4 animate-pulse">
            <AlertCircle className="text-red-500" size={24} />
            <div className="flex-1">
              <h3 className="text-red-500 font-bold text-lg">CRITICAL PROCUREMENT REQUIRED</h3>
              <p className="text-red-400 text-sm">Action: {criticalItems.length} items have procurement deficits.</p>
            </div>
            <button onClick={() => setActiveTab('procurement')} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold">Go to Procurement</button>
          </div>
        )}
        
        {/* NEW: COMPACT TABLE LAYOUT */}
        <div className="bg-slate-900/50 border border-[#D4AF37]/30 rounded-xl p-6 gold-glow">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 text-slate-500 text-xs uppercase">
                  <th className="pb-4 px-4 font-bold">S.No</th>
                  <th className="pb-4 px-4 font-bold">Material Name</th>
                  <th className="pb-4 px-4 font-bold">Present Stock</th>
                  {inventoryTab === 'raw' && <th className="pb-4 px-4 font-bold">Required</th>}
                  {inventoryTab === 'raw' && <th className="pb-4 px-4 font-bold">Balance</th>}
                  <th className="pb-4 px-4 font-bold">Status</th>
                  <th className="pb-4 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {displayItems.length === 0 ? (
                  <tr>
                    <td colSpan={inventoryTab === 'raw' ? 8 : 6} className="p-4 text-center text-slate-500 text-sm">
                      No items found.
                    </td>
                  </tr>
                ) : (
                  displayItems.map(item => {
                    const isCritical = (item.balanceToPurchase && item.balanceToPurchase > 0) || item.stock < item.safetyStock;
                    return (
                      <tr key={item.id} className="hover:bg-white/5 transition-all">
                        <td className="py-3 px-4 text-slate-500 font-mono text-xs">{item.sNo}</td>
                        <td className="py-3 px-4 text-white font-bold text-sm">{item.name}</td>
                        <td className="py-3 px-4 text-white font-mono font-bold">
                          {item.stock.toLocaleString()} <span className="text-xs text-slate-500">{item.unit}</span>
                          {item.stockDate && <div className="text-[8px] text-slate-500 uppercase">DT: {item.stockDate}</div>}
                        </td>
                        {inventoryTab === 'raw' && (
                          <td className="py-3 px-4 text-slate-300 font-mono">
                            {item.requiredForOrders?.toLocaleString() || '-'} <span className="text-xs text-slate-500">{item.unit}</span>
                          </td>
                        )}
                        {inventoryTab === 'raw' && (
                          <td className="py-3 px-4">
                            <span className={`font-mono font-bold ${item.balanceToPurchase && item.balanceToPurchase > 0 ? 'text-red-400' : 'text-green-400'}`}>
                              {item.balanceToPurchase?.toLocaleString() || '-'} <span className="text-xs">{item.unit}</span>
                            </span>
                          </td>
                        )}
                        <td className="py-3 px-4">
                          <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${
                            isCritical ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 'bg-green-500/20 text-green-500 border border-green-500/30'
                          }`}>
                            {isCritical ? 'BALANCE TO PURCHASE' : 'GOOD'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => openModal('edit', 'inventory', item)} 
                              className="p-1.5 rounded hover:bg-yellow-500/20 text-[#F4C430]"
                              title="Edit"
                            >
                              <Edit2 size={14}/>
                            </button>
                            <button 
                              onClick={() => handleDelete('inventory', item.id, item.name)} 
                              className="p-1.5 rounded hover:bg-red-500/20 text-red-500"
                              title="Delete"
                            >
                              <Trash2 size={14}/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };


  // ── Sales doc state (component level) ──
  // Note: salesDocMenu, salesShowForm, salesEditOrder, salesDraft already declared above

  // ── Sales Document Generator ──
  const generateSalesDoc = (order: Order, docType: 'proforma' | 'invoice' | 'quotation') => {
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-GB');
    const mm = String(today.getMonth()+1).padStart(2,'0');
    const yy = String(today.getFullYear()).slice(-2);
    const prefix = docType==='quotation' ? 'AWP/QUOT' : docType==='invoice' ? 'AWP/INV' : 'AWP/PI';
    const refNo = `${prefix}-${mm}-${yy}`;
    const title = docType==='quotation' ? 'QUOTATION / PRICE OFFER' : docType==='invoice' ? 'COMMERCIAL INVOICE' : 'PROFORMA INVOICE';
    const amt = order.amountUSD || 0;
    const words = numberToWords(amt);
    const LOGO = 'iVBORw0KGgoAAAANSUhEUgAAAqEAAABACAYAAAAqJa5QAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAkVTAAJFUwF5p7hpAAAHhklEQVR4nO3dS3LrOAyFYaWrx1ldVpCFZQVZXTaQHnS5StfXtvgAwAPw/6oyc8SHQBKiJPs4AAAAAAAAAAAAAAAAAAAAAAAAAKDT2+oKRHv//P5t+dzP18d2fQMAAHClJZdqyaOefqA1WZu1Itmz6jwAAIAdXeVSLXnUv6/+OSIRPZdB4gcAQD73+QLrOVr8s7oCZ++f378RiS+DAwCAec/W7ai7qcjtZRK6KlmLSkYBAMCYq3Watbw2ixxRaif0HgEMAMA11ktk9PSZ0FlXGXLPYHn//P7lFjoAAEAdJknoSIJ4+5/WZPT2OZJRAACA/Jbfju9NKrndAAAAkN/yJPQ42N0EACCblrWb9R2vSCShx0GgAgAwYuUdwldrN+s6rri9mDSi9QvyeVEJAAANrMcYJbMTCgAAgH2QhAIAkBQv6yIzklAAAACEk3omNJtnV6Dqz8f0XDmrtyWbq7637m9iVFu2do7uuinUfRXPdxjYBe2TabxlquuMy4q3dIRlB7R2/GyZM8lA78BXCpDZSSuiLTMx4JHkWcRkdMwQo5qskoboNlomO951j1yzotarmbKvjNZtZdtbre6jUTP1VqprS124Hd9h9Ld5VX7T16IOEe3wnhR7zQzqyJi5/Q8xur4d91T6d4R1vTP3xb1VCZZC/6lf7Cn00YjZemdrO7fjG1id0Co/PRrRjtav6zrXR0l0zBCjf1L5GjfF2GzlXXevc9Qzd2RTtV1WsvePZf1V5sArKXdCIzvWI6hXDJQq7VhVh56Yi+7rKue20o5btt2Is8i6Z+2jM8/16Hx3Q7GvVJIc1f7p4TWPq/cLO6EvqJ+8Vp7tyHK1FSW6r4nRtmMrXrhaPkNsxeM5v6tjModgRubxFkV5jKVLQqM68lFQtpat9KtP93VZvaNnSa1+3jFz+9yr243E6DqWCZzyxUZvTLTcHldeJFd61iezL4MoxdOoSuPtXF7vOMh+LqXejlcra7bcyPZ4WtWOkcHlfWvMuy6jE4rny1zEqE35s3WYWah6j/9IxDc2RM3vUV+FtqI8pbejj2Pt2qA83iytnP9mY1HimdDW5xZWBYJ6AHr7+fp4U+8DtToq1WUHGfp7to4rY9yi3F126OArIgG9/X+GeeU42uqqOraWJ6FRATViNgiZdGOoTRTeMXP/eWJ0regL6OidJfW6Yx8r8gVi1teyJLRn93NVAqp0HOQQtWNkVZblcXakfAenFRcZyEB5wwrjwpNQ9eTTQ5V2KKrat1XbhVxWxCFJMbCPkLfjuYIBUA27oIAW9fGGv7kmoSSf+bFItSOO11CN0QrxoNq3wL0K421U5nHqmoTuHBTZZQhq4mtvGWJUGf2HLIjVxyr0S7ovq4evCkGN2hRiVKEOAPZTbe4hCd1UtUBGPcQogF3tMv+RhG5kl6BGXlVilEdFgDhVxluV+a8HSWhhFgF9Htw7DhD4sY5Pq2Pif1UWdkAVazRJaEkzgcjCA2/Z47Ol/u+f378KdZ1RoQ3Ir+J4yz4HWiIJLWYkuKsFNXSNTr7EKIAKWKP/RBJaSG9wVw5s1KAYoz9fH28Zb3sBGVUab6zRfyMJLaInuHcIbOghRgHsivnvsfDfjoc9ghvqdozRCrs3FdqAPVSJ1SrzXyt2QjexW2AjH2IUQEX8hPlz7IRuYMfARi7ZYrS1vsq7MxXaMKpimyrbIVazzYFWSEIBwFHmhfEmWxt2XdCRL1Z3RxIKEwx8qLOO0Z5ER3V8VGgD/lT1PBGrNZGEboABCXU7xKhqG6vuGl61y+p8qJ7X3WU7L9nqa4UkFGZ2HUTIY+VuqEf5VsdWeuYuch55//z+nSlPdc5TrdesKuNtFcU6k4QW0DIwo4JPMcixnlKMWhtZGC134W5/UTuaXufJsl9uPPska7xml3G87XqR14IkdCMek/yzcrzLQE0RMepx/JFk57ygjf5v7/+90vvMnUX5j/pgxeMBPe2JmkdfqXxR1yJyvM2M0xFV7mi0MgvkbM8VXbXLuj0R5Vn8JNijY9w+F/2739Hn6ErFmIkuyyNGz59Z/dv0qyb3yFiwqMOzMrzGtMKiGz0/eJXbW4+Ku9Fea1pLOa/W6JEyXpXVYvb882X1AaIGSu9v7LZ8VvniIvIWZAvL+igsmmdWbbOOUaXzfxxrfufaug9G26AWs2ee52X2In2m3JYyX30mYvx4ztPZxpvqGh2VVD/y8na88qQyY3bgerAqz3Kw3x9r5NhqScIoxbGgWKcWVjHx6DgKMfrz9fEWFfeei7vHcdXKnLX6a4NmE6LZ8hXmoMi4WZnwtR6r9/ird8rNnglVCEZrVs88RZZ3HL4DpWeBnalHz/NZo2V4yHjxsqKvPSe+qBi1rIeiW/0zt+HM42Kj939UElG1R5lmZYtV72RWrS9enf+nlVz9bJWXkXZFJFMWZVmUP1IH6+e7os/RleoxQ4zGyPTm9zMqSZQF67hXeLmq9bOrdkEZb495z8Ee859VnaUTRthb/XwQcGWHGFVfwFtUaMOZwoWKhWzPUUfIFqs7zIEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOTxHxj0VBUitBgIAAAAAElFTkSuQmCC';
    const bankSection = docType !== 'quotation' ? `<tr><td colspan="2" style="border:1px solid #000;padding:6px 8px;font-size:8.5pt"><b>BANK: BANK NIZWA</b> | A/C: 00150000174002 | IBAN: OM45033000150000174002 | SWIFT: BNZWOMRXXXX | BRANCH: MUSCAT MAIN, P.O.BOX 1423, MUSCAT, OMAN</td></tr>` : `<tr><td colspan="2" style="border:1px solid #000;padding:6px 8px;font-size:8.5pt"><b>VALIDITY:</b> 30 days | <b>PAYMENT:</b> ${order.paymentMethod||'LC at Sight'} | <b>DELIVERY:</b> ${order.shippingMethod||'By Sea'}</td></tr>`;
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title><style>@page{size:A4;margin:12mm 10mm}body{font-family:Arial,sans-serif;font-size:9pt;color:#000;margin:0}table{border-collapse:collapse;width:100%}td,th{padding:4px 6px;vertical-align:top}.np{background:#1e293b;padding:10px;text-align:center;margin-bottom:10px}@media print{.np{display:none!important}}</style></head><body><div class="np"><button onclick="window.print()" style="background:#D4AF37;color:#000;border:none;padding:10px 28px;font-weight:bold;font-size:12pt;border-radius:6px;cursor:pointer">🖨 Print / Save as PDF</button></div><table style="border:2px solid #000"><tr><td style="width:40%;font-size:10pt;font-weight:bold;direction:rtl">الـوجـر لصنـاعـة الأدويـة ش . م . م</td><td style="width:20%;text-align:center"><img src="data:image/png;base64,${LOGO}" style="height:55px" alt="LOGO"/></td><td style="text-align:right;font-size:8.5pt;line-height:1.5"><b>AL WAJER PHARMACEUTICALS INDUSTRY LLC</b><br>PO BOX 98, PC-327, SOHAR INDUSTRIAL ESTATE<br>SOHAR, SULTANATE OF OMAN | TEL: +968 22372677 | TIN: 10638</td></tr></table><div style="border:2px solid #000;border-top:none;text-align:center;font-size:14pt;font-weight:bold;letter-spacing:4px;padding:5px">${title}</div><table style="border:2px solid #000;border-top:none"><tr><td style="width:50%;border-right:1px solid #000;border-bottom:1px solid #000"><b>Exporter:</b> AL WAJER PHARMACEUTICALS INDUSTRY LLC<br>PO BOX 98, PC-327, SOHAR, OMAN | TIN: 10638</td><td style="border-bottom:1px solid #000"><b>${docType==='quotation'?'Quotation':'Invoice'} No:</b> ${refNo}<br><b>Date:</b> ${dateStr}</td></tr><tr><td style="border-right:1px solid #000;border-bottom:1px solid #000"><b>Buyer Order No:</b> ${order.lcNo||'—'}</td><td style="border-bottom:1px solid #000"><b>Your Ref:</b> ${order.invoiceNo||'—'}</td></tr><tr><td style="border-right:1px solid #000;border-bottom:1px solid #000"><b>Buyer:</b> ${order.customer||'—'}, ${order.country||''}</td><td style="border-bottom:1px solid #000"><b>Port of Loading:</b> SALALAH, OMAN<br><b>Country of Origin:</b> SULTANATE OF OMAN</td></tr><tr><td colspan="2" style="border-bottom:1px solid #000"><b>Final Destination:</b> ${order.country||'—'} | <b>Terms of Payment:</b> ${order.paymentMethod||'LC at Sight'} | <b>Shipping:</b> ${order.shippingMethod||'By Sea'}</td></tr></table><table style="border:2px solid #000;border-top:none"><thead><tr style="background:#d9e1f2"><th colspan="4" style="border:1px solid #000;text-align:center">Description of Goods</th><th style="border:1px solid #000;text-align:center">Qty (KG)</th><th style="border:1px solid #000;text-align:center">Rate/Kg (USD)</th><th style="border:1px solid #000;text-align:center">Total (USD)</th></tr></thead><tbody><tr><td colspan="4" style="border:1px solid #000;padding:8px;font-weight:bold">${order.product||'—'}</td><td style="border:1px solid #000;text-align:center">${(order.quantity||0).toLocaleString()}</td><td style="border:1px solid #000;text-align:right">${(order.rateUSD||0).toFixed(2)}</td><td style="border:1px solid #000;text-align:right;font-weight:bold">${amt.toLocaleString('en-US',{minimumFractionDigits:2})}</td></tr><tr style="font-weight:bold;background:#d9e1f2"><td colspan="5" style="border:1px solid #000;text-align:right;padding:6px">TOTAL AMOUNT IN USD</td><td colspan="2" style="border:1px solid #000;text-align:right;padding:6px">${amt.toLocaleString('en-US',{minimumFractionDigits:2})}</td></tr><tr><td colspan="7" style="border:1px solid #000;padding:6px"><b>IN WORDS: USD ${words} ONLY.</b></td></tr></tbody></table><table style="border:2px solid #000;border-top:none">${bankSection}<tr><td style="border:1px solid #000;padding:12px;width:50%"><b>Seller Signature & Date</b><br><br><br><div style="border-top:1px solid #000;font-size:8pt">AL WAJER PHARMACEUTICALS INDUSTRY LLC</div></td><td style="border:1px solid #000;padding:12px"><b>Buyer Signature & Date</b><br><br><br><div style="border-top:1px solid #000;font-size:8pt">${order.customer||'—'}</div></td></tr></table></body></html>`;
    const blob = new Blob([html],{type:'text/html'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href=url; a.download=`AWP_${docType}_${(order.customer||'').replace(/\s+/g,'_')}.html`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    logAction('DOC_GENERATED',`${docType}: ${order.customer}`);
  };

  const renderSales = () => {
    const groupedOrders = orders.reduce((acc, order) => {
      const inv = order.invoiceNo || 'Draft';
      if (!acc[inv]) acc[inv] = [];
      acc[inv].push(order);
      return acc;
    }, {});

    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BadgeDollarSign className="text-[#F4C430]" size={20} /> Sales & Orders
            </h2>
            <div className="flex gap-2">
              <button onClick={() => exportToCSV(orders, 'sales_report')} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                <Download size={14}/> Export
              </button>
              <button onClick={() => openModal("add", "sales", {id: `ORD-${Date.now()}`, invoiceNo: "", date: new Date().toISOString().split("T")[0], customer: "", country: "", product: "", quantity: 0, rateUSD: 0, amountUSD: 0, amountOMR: 0, status: "Pending", paymentMethod: "LC at Sight", shippingMethod: "By Sea"})} className="bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37] px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-all">
                <Plus size={16} /> Update Orders
              </button>
            </div>
        </div>
        <div className="space-y-4">
            {Object.entries(groupedOrders).map(([inv, invOrders]) => {
                const arr = invOrders;
                const totalUSD = arr.reduce((sum, o) => sum + (Number(o.amountUSD) || 0), 0);
                const totalOMR = arr.reduce((sum, o) => sum + (Number(o.amountOMR) || 0), 0);
                const first = arr[0];

                return (
                  <div key={inv} className="bg-slate-900/50 border border-[#D4AF37]/30 rounded-xl p-0 gold-glow overflow-hidden">
                    <div className="bg-slate-950/50 border-b border-white/5 p-4 flex flex-wrap justify-between items-center gap-4">
                        <div>
                            <span className="text-lg font-bold text-[#D4AF37]">{inv}</span>
                            <span className="ml-3 text-xs text-slate-500 font-mono">{first.date}</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right flex items-center gap-3">
                                <p className="text-[10px] text-slate-400 uppercase font-bold">Total Val</p>
                                <p className="text-sm font-bold text-white">${totalUSD.toLocaleString()} / OMR ${Number(totalOMR).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-0">
                        <table className="w-full text-left">
                           <tbody className="divide-y divide-white/5">
                             {arr.map(order => (
                               <tr key={order.id} className="hover:bg-white/5 group bg-slate-900/40">
                                 <td className="p-4 pr-4">
                                   <div className="font-bold text-white text-sm">{order.customer}</div>
                                   <div className="text-[10px] text-slate-500">{order.country}</div>
                                 </td>
                                 <td className="p-4 px-4 w-1/3">
                                   <div className="text-sm text-slate-300">{order.product}</div>
                                   <div className="text-xs font-bold text-white font-mono">{Number(order.quantity).toLocaleString()} KG</div>
                                 </td>
                                 <td className="p-4 px-4 text-xs font-mono text-[#D4AF37]">
                                   ${order.rateUSD || 0}/KG
                                 </td>
                                 <td className="p-4 px-4 text-right">
                                   <div className="text-sm font-bold text-white font-mono">${Number(order.amountUSD).toLocaleString()}</div>
                                 </td>
                                 <td className="p-4 pl-4 text-right w-24">
                                    <button onClick={() => openModal("edit", "sales", order)} className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg mr-2"><Edit2 size={14}/></button>
                                 </td>
                               </tr>
                             ))}
                           </tbody>
                        </table>
                    </div>
                  </div>
                );
            })}
        </div>
      </div>
    );
  };
  
const renderProcurement = () => {
    const purchaseItems = inventory.filter(i => (i.balanceToPurchase && i.balanceToPurchase > 0));

    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Truck className="text-[#F4C430]" size={20} /> Procurement & Supply Chain
            </h2>
            <div className="flex gap-2">
                <button onClick={() => setIsPOModalOpen(true)} className="bg-[#D4AF37] hover:bg-[#c4a030] text-slate-950 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-all shadow-lg shadow-[#D4AF37]/20">
                    <Plus size={16} /> Generate PO
                </button>
                <button onClick={() => openModal('add', 'procurement', {id: '', name: '', category: 'API', rating: 5, status: 'Verified', country: ''})} className="bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37] px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-all">
                    <UserPlus size={16} /> Add Vendor
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
                <div className="bg-slate-900/50 border border-[#D4AF37]/30 rounded-xl p-6 gold-glow transition-all hover:border-[#D4AF37]/50">
                     <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <AlertTriangle className="text-red-400" size={18}/> Material Shortages
                     </h3>
                     <div className="space-y-3">
                         {purchaseItems.length === 0 ? <p className="text-slate-500 text-sm">No critical shortages.</p> : purchaseItems.map(item => (
                             <div key={item.id} className="p-4 bg-red-500/10 rounded border border-red-500/20 flex justify-between items-center group">
                                 <div>
                                     <h4 className="text-white font-bold text-sm group-hover:text-red-400 transition-colors">{item.name}</h4>
                                     <p className="text-[10px] text-red-300 font-mono tracking-wider">Required: {item.balanceToPurchase} {item.unit}</p>
                                 </div>
                                 <button 
                                   className="text-xs bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white px-3 py-1.5 rounded-lg border border-red-500/30 font-bold transition-all"
                                   onClick={() => { setPOItem(item); setPOQty(String(item.balanceToPurchase)); setIsPOModalOpen(true); }}
                                 >
                                     Fill Needs
                                 </button>
                             </div>
                         ))}
                     </div>
                </div>

                <div className="bg-slate-900/50 border border-[#D4AF37]/30 rounded-xl p-6 gold-glow">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <BadgeDollarSign className="text-green-400" size={18}/> Market Raw Material Rates
                    </h3>
                    <div className="overflow-hidden border border-white/5 rounded-lg">
                        <table className="w-full text-left">
                            <thead className="bg-slate-950/50 text-[10px] text-slate-500 uppercase font-bold tracking-widest">
                                <tr>
                                    <th className="px-4 py-3">Material</th>
                                    <th className="px-4 py-3">Market Price</th>
                                    <th className="px-4 py-3">Last Change</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm">
                                {[
                                    {name: 'Esomeprazole Sodium', price: '$48.50', change: '+1.2%'},
                                    {name: 'Omeprazole Pellet 8.5%', price: '$12.20', change: '-0.5%'},
                                    {name: 'Empty Hard Gelatin Cap', price: '$3.80', change: 'Stable'},
                                    {name: 'Alu-Alu Foil', price: '$9.40', change: '+2.1%'}
                                ].map((m, idx) => (
                                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-3 text-slate-300 font-medium">{m.name}</td>
                                        <td className="px-4 py-3 text-[#D4AF37] font-bold font-mono">{m.price}/kg</td>
                                        <td className={`px-4 py-3 text-[10px] font-bold ${m.change.includes('+') ? 'text-green-400' : m.change.includes('-') ? 'text-red-400' : 'text-slate-500'}`}>{m.change}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="bg-slate-900/50 border border-[#D4AF37]/30 rounded-xl p-6 gold-glow transition-all hover:border-[#D4AF37]/50">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Globe className="text-[#F4C430]" size={18}/> Global Supplier Rates
                </h3>
                 <div className="space-y-4">
                     {vendors.map(vendor => (
                         <div key={vendor.id} className="p-4 bg-slate-950/30 rounded-lg border border-white/5 space-y-3 group hover:border-[#D4AF37]/20 transition-all">
                             <div className="flex justify-between items-start">
                                 <div>
                                     <div className="flex items-center gap-2">
                                         <h4 className="text-white font-bold text-sm group-hover:text-[#D4AF37] transition-colors">{vendor.name}</h4>
                                         <span className={`text-[9px] px-1.5 py-0.5 rounded-full border uppercase tracking-tighter ${vendor.status === 'Verified' ? 'text-green-400 border-green-500/20 bg-green-500/10' : 'text-yellow-500 border-yellow-500/20 bg-yellow-500/10'}`}>{vendor.status}</span>
                                     </div>
                                     <p className="text-[10px] text-slate-500 mt-0.5">{vendor.country} • {vendor.category} Specialist</p>
                                 </div>
                                 <div className="flex flex-col items-end">
                                     <div className="flex items-center text-[#D4AF37] text-xs font-bold gap-1 mb-1">
                                         <Star size={10} fill="#D4AF37"/> {vendor.rating}
                                     </div>
                                     <button onClick={() => openModal('edit', 'procurement', vendor)} className="text-[10px] text-slate-500 hover:text-white underline">Edit Supplier</button>
                                 </div>
                             </div>
                             <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-2">
                                 <div className="text-[10px] text-slate-500">
                                     Main Materials: <span className="text-slate-300">API, Pellets</span>
                                 </div>
                                 <div className="text-[10px] text-right text-slate-500">
                                     Lead Time: <span className="text-slate-300">15-20 Days</span>
                                 </div>
                             </div>
                         </div>
                     ))}
                 </div>
            </div>
        </div>
      </div>
    );
  };


  const renderDashboard = () => {
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

    // Dynamic Stats Calculation
    const avgYield = batches.length > 0 
        ? (batches.reduce((sum, b) => sum + b.actualYield, 0) / batches.length).toFixed(1) + '%' 
        : '0%';
    const totalOrderVolume = (orders.reduce((sum, o) => sum + o.quantity, 0) / 1000).toFixed(1) + ' MT';
    const activeMarketsCount = markets.length.toString();

    // 1. Prepare Widget Data
    const statWidgets: Record<string, any> = {
        'stats_yield': { title: 'Yield Accuracy', icon: Activity, value: avgYield, color: 'text-[#F4C430]' },
        'stats_orders': { title: 'Order Volume', icon: Package, value: totalOrderVolume, color: 'text-[#F4C430]' },
        'stats_markets': { title: 'Active Markets', icon: Globe, value: activeMarketsCount, color: 'text-[#F4C430]' },
        'stats_pipeline': { title: 'Pipeline Value', icon: LineChart, value: '$4.8M', color: 'text-[#F4C430]' },
        'stats_inventory': { title: 'Critical Stock', icon: AlertTriangle, value: inventory.filter(i => (i.balanceToPurchase && i.balanceToPurchase > 0)).length.toString(), color: 'text-red-400' },
        'stats_vendors': { title: 'Active Vendors', icon: Truck, value: vendors.length.toString(), color: 'text-[#F4C430]' },
        'stats_expenses': { title: 'Total Expenses', icon: Wallet, value: `$${expenses.reduce((s,e)=>s+e.amount,0).toLocaleString()}`, color: 'text-[#F4C430]' },
        'stats_liability': { title: 'Liabilities', icon: AlertCircle, value: `$${expenses.filter(e=>e.status==='Pending').reduce((s,e)=>s+e.amount,0).toLocaleString()}`, color: 'text-red-400' },
        'stats_staff': { title: 'Staff Count', icon: Users, value: employees.length.toString(), color: 'text-[#F4C430]' },
        'stats_rd': { title: 'R&D Projects', icon: Beaker, value: rdProjects.length.toString(), color: 'text-[#F4C430]' },
        'stats_samples': { title: 'Active Samples', icon: PackageSearch, value: samples.length.toString(), color: 'text-[#F4C430]' },
    };

    const feedWidgets: Record<string, any> = {
        'feed_ai': {
            title: 'Operations Feed', span: 'col-span-2', render: () => (
                <div className="space-y-4">
                    <div className="flex justify-between items-center mb-2">
                         <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">LIVE INSIGHTS</span>
                         <button onClick={handleQuickScan} className="text-xs flex items-center gap-1 text-[#F4C430] hover:text-white transition-colors bg-[#F4C430]/10 px-2 py-1 rounded border border-[#F4C430]/20">
                             <Bolt size={12}/> Fast AI Scan
                         </button>
                    </div>
                    {insights.map((insight, i) => (
                        <div key={i} className={`p-4 rounded-lg border flex gap-3 ${insight.severity === 'critical' ? 'bg-red-500/10 border-red-500/20' : 'bg-slate-800/50 border-white/5'}`}>
                            <AlertTriangle className={insight.severity === 'critical' ? 'text-red-400' : 'text-[#F4C430]'} size={20} />
                            <div>
                                <h4 className="text-xs font-bold text-white uppercase mb-1">{insight.type}</h4>
                                <p className="text-xs text-slate-300">{insight.message}</p>
                            </div>
                        </div>
                    ))}
                    {insights.length === 0 && <div className="text-center text-slate-500 text-sm py-4">No critical alerts. Operations normal.</div>}
                </div>
            )
        },
        'feed_batches': {
            title: 'Recent Batches', span: 'col-span-1', render: () => (
                <div className="space-y-3">
                    {batches.slice(0, 3).map(b => (
                        <div key={b.id} className="flex justify-between items-center p-3 bg-slate-800/30 rounded border border-white/5">
                            <div>
                                <p className="text-[#D4AF37] text-xs font-mono">{b.id}</p>
                                <p className="text-white text-sm font-bold">{b.product}</p>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${b.status === 'Completed' ? 'text-green-500 border-green-500/20' : 'text-blue-500 border-blue-500/20'}`}>{b.status}</span>
                        </div>
                    ))}
                </div>
            )
        },
        'feed_orders': {
            title: 'Recent Sales', span: 'col-span-1', render: () => (
                <div className="space-y-3">
                    {orders.slice(0, 3).map(o => (
                        <div key={o.id} className="p-3 bg-slate-800/30 rounded border border-white/5">
                            <div className="flex justify-between">
                                <span className="text-[#D4AF37] text-xs font-bold">{o.customer}</span>
                                <span className="text-xs text-slate-400">{o.status}</span>
                            </div>
                            <p className="text-white text-sm mt-1">{o.product}</p>
                        </div>
                    ))}
                </div>
            )
        },
        'feed_inventory': {
             title: 'Inventory Alerts', span: 'col-span-1', render: () => {
                 const alerts = inventory.filter(i => (i.balanceToPurchase && i.balanceToPurchase > 0) || i.stock <= i.safetyStock);
                 return (
                     <div className="space-y-3">
                         {alerts.length === 0 ? <div className="text-slate-500 text-sm">Stock levels healthy.</div> : alerts.slice(0,3).map(i => (
                             <div key={i.id} className="flex items-center gap-3 p-3 bg-red-500/10 rounded border border-red-500/20">
                                 <AlertCircle className="text-red-400" size={16}/>
                                 <div>
                                     <p className="text-white text-sm font-bold">{i.name}</p>
                                     <p className="text-[10px] text-red-300">Shortage: {i.balanceToPurchase} {i.unit}</p>
                                 </div>
                             </div>
                         ))}
                     </div>
                 )
             }
        },
        'feed_hr': {
            title: 'HR Updates', span: 'col-span-1', render: () => (
                 <div className="space-y-3">
                     {employees.slice(0,3).map(e => (
                         <div key={e.id} className="flex items-center gap-3 p-3 bg-slate-800/30 rounded border border-white/5">
                             <div className="w-8 h-8 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] font-bold text-xs">{e.name.charAt(0)}</div>
                             <div>
                                 <p className="text-white text-sm font-bold">{e.name}</p>
                                 <p className="text-[10px] text-slate-500">{e.role}</p>
                             </div>
                         </div>
                     ))}
                 </div>
            )
        },
        'feed_finance': {
             title: 'Expense Ledger', span: 'col-span-1', render: () => (
                 <div className="space-y-3">
                     {expenses.slice(0,3).map(e => (
                         <div key={e.id} className="flex justify-between items-center p-3 bg-slate-800/30 rounded border border-white/5">
                             <div>
                                 <p className="text-white text-xs font-bold">{e.description}</p>
                                 <p className="text-[10px] text-slate-500">{e.dueDate}</p>
                             </div>
                             <div className="text-right">
                                 <p className="text-[#D4AF37] text-sm font-mono">${e.amount.toLocaleString()}</p>
                                 <span className={`text-[8px] uppercase ${e.status === 'Paid' ? 'text-green-500' : 'text-yellow-500'}`}>{e.status}</span>
                             </div>
                         </div>
                     ))}
                 </div>
             )
        }
    };

    const activeStats = visibleWidgets.filter(id => id.startsWith('stats_')).map(id => statWidgets[id]).filter(Boolean);
    const activeFeeds = visibleWidgets.filter(id => id.startsWith('feed_')).map(id => ({id, ...feedWidgets[id]})).filter(Boolean);

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <LayoutDashboard className="text-[#F4C430]" size={20} /> Executive Overview
                </h2>
                <button 
                    onClick={() => setIsCustomizeOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-white/10 text-sm font-bold transition-all"
                >
                    <Grip size={16}/> Customize
                </button>
            </div>

            {/* Stats Grid - RESPONSIVE */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6`}>
                {activeStats.map((stat, idx) => (
                    <div key={idx} className="bg-slate-900/50 border border-[#D4AF37]/30 p-4 sm:p-6 rounded-xl gold-glow flex flex-col justify-between h-28 sm:h-32">
                        <stat.icon className={`${stat.color} mb-2`} size={20} />
                        <div>
                            <h3 className="text-slate-400 text-[10px] sm:text-xs mb-1 uppercase tracking-widest font-bold">{stat.title}</h3>
                            <p className="text-xl sm:text-2xl font-bold text-white">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Feeds Grid - RESPONSIVE */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {activeFeeds.map((feed) => (
                    <div key={feed.id} className={`${feed.span || 'col-span-1'} bg-slate-900/50 border border-[#D4AF37]/30 rounded-xl p-6 gold-glow`}>
                         <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                            {feed.title}
                         </h2>
                         {feed.render()}
                    </div>
                ))}
            </div>
        
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
                  label={({name, percent}) => `${name.substring(0,10)} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {scCats.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
</div>
    );
  };

  const renderAccounting = () => {
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalLiability = expenses.filter(e => e.status === 'Pending').reduce((sum, e) => sum + e.amount, 0);

    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/50 border border-[#D4AF37]/30 p-6 rounded-xl gold-glow">
            <Wallet className="text-[#F4C430] mb-4" size={24} />
            <h3 className="text-slate-400 text-xs mb-1 uppercase tracking-widest font-bold">Total Expenses</h3>
            <p className="text-3xl font-bold text-white">${totalExpenses.toLocaleString()}</p>
          </div>
          <div className="bg-slate-900/50 border border-red-500/30 p-6 rounded-xl gold-glow">
            <AlertCircle className="text-red-400 mb-4" size={24} />
            <h3 className="text-slate-400 text-xs mb-1 uppercase tracking-widest font-bold">Outstanding Liability</h3>
            <p className="text-3xl font-bold text-red-400">${totalLiability.toLocaleString()}</p>
          </div>
          <div className="bg-slate-900/50 border border-green-500/30 p-6 rounded-xl gold-glow">
            <Calculator className="text-green-400 mb-4" size={24} />
            <h3 className="text-slate-400 text-xs mb-1 uppercase tracking-widest font-bold">Burn Rate</h3>
            <p className="text-3xl font-bold text-white">LOW</p>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-[#D4AF37]/30 rounded-xl p-6 gold-glow">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Calculator className="text-[#F4C430]" size={20} /> Ledger Overview
            </h2>
            <button onClick={() => openModal('add', 'accounting', {id: '', description: '', category: 'Utilities', amount: 0, status: 'Pending', dueDate: ''})} className="luxury-gradient px-4 py-2 rounded-lg text-slate-950 font-bold text-sm">Add Transaction</button>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-slate-500 text-xs uppercase">
                <th className="pb-4">Description</th>
                <th className="pb-4">Category</th>
                <th className="pb-4">Amount</th>
                <th className="pb-4">Due Date</th>
                <th className="pb-4">Status</th>
                <th className="pb-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {expenses.map(exp => (
                <tr key={exp.id} className="hover:bg-white/5">
                  <td className="py-4 text-white text-sm font-medium">{exp.description}</td>
                  <td className="py-4 text-slate-400 text-xs uppercase">{exp.category}</td>
                  <td className="py-4 text-white font-mono">${exp.amount.toLocaleString()}</td>
                  <td className="py-4 text-slate-500 text-xs">{exp.dueDate}</td>
                  <td className="py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      exp.status === 'Paid' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                    }`}>
                      {exp.status}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openModal('edit', 'accounting', exp)} className="p-1.5 rounded hover:bg-yellow-500/20 text-[#D4AF37]" title="Edit"><Edit2 size={14}/></button>
                      <button onClick={() => handleDelete('accounting', exp.id, exp.description)} className="p-1.5 rounded hover:bg-red-500/20 text-red-500" title="Delete"><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderHRAdmin = () => (
    <div className="space-y-6 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-900/50 border border-[#D4AF37]/30 p-4 rounded-xl">
          <Users className="text-[#F4C430] mb-2" size={20} />
          <h3 className="text-slate-500 text-[10px] uppercase font-bold">Staff Count</h3>
          <p className="text-2xl font-bold text-white">{employees.length}</p>
        </div>
        <div className="bg-slate-900/50 border border-[#D4AF37]/30 p-4 rounded-xl">
          <Briefcase className="text-[#F4C430] mb-2" size={20} />
          <h3 className="text-slate-500 text-[10px] uppercase font-bold">Departments</h3>
          <p className="text-2xl font-bold text-white">5</p>
        </div>
        <div className="bg-slate-900/50 border border-[#D4AF37]/30 p-4 rounded-xl">
          <CheckCircle2 className="text-[#F4C430] mb-2" size={20} />
          <h3 className="text-slate-500 text-[10px] uppercase font-bold">Attendance</h3>
          <p className="text-2xl font-bold text-white">98%</p>
        </div>
        <div className="bg-slate-900/50 border border-[#D4AF37]/30 p-4 rounded-xl">
          <BadgeDollarSign className="text-[#F4C430] mb-2" size={20} />
          <h3 className="text-slate-500 text-[10px] uppercase font-bold">Monthly Payroll</h3>
          <p className="text-2xl font-bold text-white">${employees.reduce((s, e) => s + e.salary, 0).toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-slate-900/50 border border-[#D4AF37]/30 rounded-xl p-6 gold-glow">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="text-[#F4C430]" size={20} /> Employee Directory
            </h2>
            <button onClick={() => openModal('add', 'hr', {id: '', name: '', role: '', department: 'Production', salary: 0, status: 'Active'})} className="luxury-gradient px-4 py-2 rounded-lg text-slate-950 font-bold text-sm">Add Employee</button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {employees.map(emp => (
            <div key={emp.id} className="p-4 bg-slate-800/30 rounded-lg border border-white/5 flex justify-between items-center group hover:border-[#D4AF37]/40 transition-all">
              <div className="flex gap-4 items-center">
                <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] font-bold">
                  {emp.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm">{emp.name}</h4>
                  <p className="text-[10px] text-slate-500 uppercase">{emp.role} • {emp.department}</p>
                </div>
              </div>
              <div className="text-right flex flex-col items-end">
                <div className="text-xs font-mono text-white mb-1">${emp.salary.toLocaleString()}</div>
                <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[9px] font-bold uppercase border border-green-500/20 mb-1">{emp.status}</span>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openModal('edit', 'hr', emp)} className="p-1 rounded hover:bg-yellow-500/20 text-[#D4AF37]" title="Edit"><Edit2 size={12}/></button>
                  <button onClick={() => handleDelete('hr', emp.id, emp.name)} className="p-1 rounded hover:bg-red-500/20 text-red-500" title="Delete"><Trash2 size={12}/></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );


  const renderRDLab = () => {
    const filteredRD = rdProjects.filter(p =>
      p.title.toLowerCase().includes(rdSearch.toLowerCase()) ||
      p.id.toLowerCase().includes(rdSearch.toLowerCase()) ||
      (p.productCode || '').toLowerCase().includes(rdSearch.toLowerCase())
    );
    const aiData = rdAiReport ? (() => { try { return JSON.parse(rdAiReport); } catch { return null; }})() : null;

    return (
      <div className="space-y-5 animate-fadeIn pb-10">
        {/* ── HEADER ── */}
        <div className="flex flex-wrap gap-3 justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Beaker className="text-[#F4C430]" size={20}/> R&D Formulation Lab
          </h2>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13}/>
              <input value={rdSearch} onChange={e => setRdSearch(e.target.value)} placeholder="Search products..."
                className="bg-slate-900 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-xs text-white focus:border-[#D4AF37] focus:outline-none w-44"/>
            </div>
            <button onClick={() => rdFileRef.current?.click()}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5">
              <Upload size={13}/> Upload Formula
            </button>
            <input type="file" ref={rdFileRef} className="hidden" onChange={(e) => handleFileUpload(e, 'rd')} accept=".pdf,.xlsx,.xls,.csv,.png,.jpg,.jpeg"/>
            <button onClick={() => { setRdModalMode('addProduct'); setIsRdModalOpen(true); }}
              className="luxury-gradient px-3 py-2 rounded-lg text-slate-950 text-xs font-bold flex items-center gap-1.5">
              <Plus size={13}/> New Product
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* ── PRODUCT LIST ── */}
          <div className="bg-slate-900/50 border border-[#D4AF37]/30 rounded-xl p-5 gold-glow xl:col-span-1">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Products ({filteredRD.length})</h3>
            </div>
            <div className="space-y-2 max-h-[70vh] overflow-y-auto custom-scrollbar pr-1">
              {filteredRD.length === 0
                ? <p className="text-slate-500 text-xs text-center py-8">No products yet.<br/>Upload a file or add manually.</p>
                : filteredRD.map(project => (
                  <div key={project.id}
                    className={`p-3 rounded-lg border transition-all group relative cursor-pointer
                      ${selectedRD?.id === project.id ? 'bg-[#D4AF37]/10 border-[#D4AF37]' : 'bg-slate-800/30 border-white/5 hover:border-[#D4AF37]/40'}`}
                    onClick={() => { setSelectedRD(project); setRdAiReport(''); setRdActiveTab('formulation'); }}>
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={e => { e.stopPropagation(); setCompareRD(compareRD?.id === project.id ? null : project); }}
                        title="Compare" className={`p-1 rounded text-xs ${compareRD?.id === project.id ? 'bg-blue-600 text-white' : 'bg-slate-900 text-blue-400 hover:bg-blue-900'}`}>
                        <Layers size={11}/>
                      </button>
                      <button onClick={e => { e.stopPropagation(); handleDelete('rd', project.id, project.title); }}
                        className="p-1 rounded bg-slate-900 text-red-500 hover:bg-red-900"><Trash2 size={11}/></button>
                    </div>
                    <div className="flex justify-between items-start pr-12">
                      <div>
                        <h4 className="font-bold text-white text-xs leading-tight">{project.title}</h4>
                        {project.dosageForm && <p className="text-[10px] text-[#D4AF37] mt-0.5">{project.dosageForm}{project.strength ? ` · ${project.strength}` : ''}</p>}
                        <p className="text-[10px] text-slate-500 mt-0.5">{project.id}{project.productCode ? ` · ${project.productCode}` : ''}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase font-bold
                        ${project.status === 'Approved' ? 'text-green-400 border-green-500/30 bg-green-500/10' :
                          project.status === 'Formulation' ? 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10' :
                          'text-blue-400 border-blue-500/30 bg-blue-500/10'}`}>{project.status}</span>
                      <span className="text-[9px] text-slate-500">{project.ingredients.length} ingredients</span>
                      <span className="text-[9px] text-[#D4AF37] font-mono">${project.totalFinalRMC}/kg</span>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>

          {/* ── DETAIL PANEL ── */}
          <div className="xl:col-span-2 space-y-4">
            {selectedRD ? (
              <>
                {/* Tabs */}
                <div className="flex gap-1 bg-slate-900/50 border border-white/10 rounded-xl p-1">
                  {([['formulation','Formulation'],['process','Process & QC'],['compare','Compare'],['spec','Spec Sheet']] as const).map(([tab, label]) => (
                    <button key={tab} onClick={() => setRdActiveTab(tab as any)}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all
                        ${rdActiveTab === tab ? 'bg-[#D4AF37] text-slate-950' : 'text-slate-400 hover:text-white'}`}>
                      {label}
                    </button>
                  ))}
                </div>

                {/* ── TAB: FORMULATION ── */}
                {rdActiveTab === 'formulation' && (
                  <div className="bg-slate-900/50 border border-[#D4AF37]/30 rounded-xl p-5 gold-glow">
                    <div className="flex justify-between items-start mb-4 flex-wrap gap-2">
                      <div>
                        <h3 className="text-base font-bold text-white">{selectedRD.title}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {selectedRD.dosageForm || 'Form N/A'} · {selectedRD.strength || 'Strength N/A'} · Batch: {selectedRD.batchSize} {selectedRD.batchUnit}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <button onClick={() => { setRdModalMode('addIngredient'); setNewIngData({ name:'', quantity:0, unit:'Kg', rateUSD:0, role:'API', supplier:'', grade:'', notes:'' }); setIsRdModalOpen(true); }}
                          className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1">
                          <Plus size={12}/> Add Ingredient
                        </button>
                        <button onClick={handleRDFullAnalysis} disabled={isAiLoading}
                          className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-3 py-1.5 rounded text-xs font-bold">
                          {isAiLoading ? <Loader2 className="animate-spin" size={12}/> : <Zap size={12}/>} AI Full Analysis
                        </button>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-white/5 text-slate-500 uppercase text-[10px]">
                            <th className="pb-2 pr-2">#</th>
                            <th className="pb-2">Material</th>
                            <th className="pb-2">Role</th>
                            <th className="pb-2">Qty</th>
                            <th className="pb-2">Rate $</th>
                            <th className="pb-2 text-right">Cost $</th>
                            <th className="pb-2"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {selectedRD.ingredients.map((ing, idx) => (
                            <tr key={idx} className="hover:bg-white/5 group">
                              <td className="py-2 pr-2 text-slate-500 text-[10px]">{ing.sNo || idx+1}</td>
                              <td className="py-2">
                                <div className="text-slate-200 font-medium">{ing.name}</div>
                                {(ing.supplier || ing.grade) && <div className="text-[10px] text-slate-500">{ing.grade}{ing.supplier ? ` · ${ing.supplier}` : ''}</div>}
                              </td>
                              <td className="py-2">
                                <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase font-bold
                                  ${ing.role === 'API' ? 'text-red-400 border-red-500/30 bg-red-500/10' :
                                    ing.role === 'Coating' ? 'text-blue-400 border-blue-500/30 bg-blue-500/10' :
                                    ing.role === 'Binder' ? 'text-green-400 border-green-500/30 bg-green-500/10' :
                                    'text-slate-400 border-slate-500/30 bg-slate-500/10'}`}>{ing.role}</span>
                              </td>
                              <td className="py-2 font-mono text-white">{ing.quantity} {ing.unit}</td>
                              <td className="py-2 font-mono text-slate-400">{ing.rateUSD}</td>
                              <td className="py-2 font-mono text-[#D4AF37] text-right">{ing.cost?.toFixed(2)}</td>
                              <td className="py-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="flex gap-1">
                                  <button onClick={() => { setEditIngIdx(idx); setNewIngData({...ing}); setRdModalMode('editIngredient'); setIsRdModalOpen(true); }}
                                    className="p-1 rounded bg-slate-800 text-yellow-400 hover:bg-yellow-900"><Edit2 size={10}/></button>
                                  <button onClick={() => {
                                    const updated = calculateCosting({ ...selectedRD, ingredients: selectedRD.ingredients.filter((_,i) => i !== idx) });
                                    setSelectedRD(updated); setRdProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
                                  }} className="p-1 rounded bg-slate-800 text-red-400 hover:bg-red-900"><Trash2 size={10}/></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-[#D4AF37]/30">
                            <td colSpan={5} className="py-2 text-white font-bold text-xs">Total RMC</td>
                            <td className="py-2 text-[#D4AF37] text-right font-mono font-bold">${selectedRD.totalRMC?.toFixed(2)}</td>
                            <td/>
                          </tr>
                          <tr>
                            <td colSpan={5} className="py-1 text-slate-400 text-[10px]">Cost/kg (incl. {(selectedRD.loss*100).toFixed(1)}% loss)</td>
                            <td className="py-1 text-green-400 text-right font-mono font-bold">${selectedRD.totalFinalRMC}</td>
                            <td/>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* AI Report */}
                    {aiData && (
                      <div className="mt-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-[#D4AF37] uppercase">AI Analysis Report</h4>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${aiData.optimizationScore >= 90 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                            Score: {aiData.optimizationScore}/100
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{aiData.formulationAssessment}</p>
                        {aiData.costOptimizations?.length > 0 && (
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Cost Optimizations</p>
                            <ul className="space-y-1">{aiData.costOptimizations.map((c: string, i: number) =>
                              <li key={i} className="text-[10px] text-slate-300 flex gap-1.5"><span className="text-green-400">↓</span>{c}</li>)}</ul>
                          </div>
                        )}
                        {aiData.ingredientSubstitutions?.length > 0 && (
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Substitution Options</p>
                            <div className="space-y-1">{aiData.ingredientSubstitutions.map((s: any, i: number) =>
                              <div key={i} className="text-[10px] bg-slate-800/50 rounded p-2">
                                <span className="text-yellow-400 font-bold">{s.ingredient}</span> → <span className="text-green-400 font-bold">{s.alternative}</span>
                                <span className="text-slate-400 ml-1">({s.estimatedSavingPct}% saving) — {s.reason}</span>
                              </div>)}</div>
                          </div>
                        )}
                        {aiData.manufacturingRisks?.length > 0 && (
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Manufacturing Risks</p>
                            <ul className="space-y-1">{aiData.manufacturingRisks.map((r: string, i: number) =>
                              <li key={i} className="text-[10px] text-red-300 flex gap-1.5"><span>⚠</span>{r}</li>)}</ul>
                          </div>
                        )}
                        <div className="p-3 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded">
                          <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Overall Recommendation</p>
                          <p className="text-xs text-white">{aiData.overallRecommendation}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── TAB: PROCESS & QC ── */}
                {rdActiveTab === 'process' && (
                  <div className="bg-slate-900/50 border border-[#D4AF37]/30 rounded-xl p-5 gold-glow space-y-5">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      {[
                        ['Dosage Form', selectedRD.dosageForm],
                        ['Strength', selectedRD.strength],
                        ['Therapeutic Category', selectedRD.therapeuticCategory],
                        ['Quality Standard', selectedRD.qualityStandards],
                        ['Shelf Life', selectedRD.shelfLife],
                        ['Storage Condition', selectedRD.storageCondition],
                        ['Regulatory Status', selectedRD.regulatoryStatus],
                        ['Last Updated', selectedRD.lastUpdated],
                      ].map(([label, val]) => (
                        <div key={label} className="bg-slate-800/30 rounded p-3 border border-white/5">
                          <p className="text-[10px] text-slate-500 uppercase font-bold">{label}</p>
                          <p className="text-white mt-0.5">{val || '—'}</p>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-xs font-bold text-[#D4AF37] uppercase">Manufacturing Process</p>
                        <button onClick={() => {
                          setNewProductData({ ...selectedRD });
                          setRdModalMode('addProduct');
                          setIsRdModalOpen(true);
                        }} className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"><Edit2 size={10}/> Edit</button>
                      </div>
                      <div className="bg-slate-800/30 rounded p-3 border border-white/5">
                        <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {selectedRD.manufacturingProcess || 'No manufacturing process defined. Click Edit to add, or run AI Full Analysis to auto-generate.'}
                        </p>
                      </div>
                    </div>
                    {aiData?.qualityParameters?.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-[#D4AF37] uppercase mb-2">Quality Control Parameters</p>
                        <div className="grid grid-cols-2 gap-2">
                          {aiData.qualityParameters.map((q: string, i: number) => (
                            <div key={i} className="flex gap-2 items-start bg-slate-800/30 rounded p-2 text-[10px] text-slate-300 border border-white/5">
                              <CheckCircle2 size={10} className="text-green-400 mt-0.5 shrink-0"/>{q}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Version History */}
                    {(selectedRD.versions?.length || 0) > 0 && (
                      <div>
                        <p className="text-xs font-bold text-[#D4AF37] uppercase mb-2">Version History</p>
                        <div className="space-y-1">
                          {selectedRD.versions!.map((v, i) => (
                            <div key={i} className="flex gap-3 items-start text-[10px] bg-slate-800/20 rounded p-2 border border-white/5">
                              <span className="text-[#D4AF37] font-mono font-bold shrink-0">{v.version}</span>
                              <span className="text-slate-500 shrink-0">{v.date?.split('T')[0]}</span>
                              <span className="text-slate-300">{v.summary}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── TAB: COMPARE ── */}
                {rdActiveTab === 'compare' && (
                  <div className="bg-slate-900/50 border border-[#D4AF37]/30 rounded-xl p-5 gold-glow">
                    {compareRD && compareRD.id !== selectedRD.id ? (
                      <>
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-sm font-bold text-white">Side-by-Side Comparison</h3>
                          <button onClick={() => setCompareRD(null)} className="text-xs text-slate-400 hover:text-white flex items-center gap-1"><X size={12}/> Clear</button>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          {[selectedRD, compareRD].map((p, pi) => (
                            <div key={pi} className={`p-3 rounded border ${pi===0?'border-[#D4AF37]/50 bg-[#D4AF37]/5':'border-blue-500/50 bg-blue-500/5'}`}>
                              <p className={`text-[10px] font-bold uppercase mb-1 ${pi===0?'text-[#D4AF37]':'text-blue-400'}`}>{pi===0?'Product A':'Product B'}</p>
                              <p className="text-white text-xs font-bold">{p.title}</p>
                              <p className="text-slate-400 text-[10px]">{p.dosageForm} · {p.strength}</p>
                            </div>
                          ))}
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b border-white/10 text-slate-500 text-[10px] uppercase">
                                <th className="pb-2 text-left">Metric</th>
                                <th className="pb-2 text-center text-[#D4AF37]">A: {selectedRD.title.substring(0,20)}</th>
                                <th className="pb-2 text-center text-blue-400">B: {compareRD.title.substring(0,20)}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {[
                                ['Batch Size', `${selectedRD.batchSize} ${selectedRD.batchUnit}`, `${compareRD.batchSize} ${compareRD.batchUnit}`],
                                ['# Ingredients', selectedRD.ingredients.length, compareRD.ingredients.length],
                                ['Total RMC', `$${selectedRD.totalRMC?.toFixed(2)}`, `$${compareRD.totalRMC?.toFixed(2)}`],
                                ['Cost/Kg', `$${selectedRD.totalFinalRMC}`, `$${compareRD.totalFinalRMC}`],
                                ['Opt. Score', `${selectedRD.optimizationScore}/100`, `${compareRD.optimizationScore}/100`],
                                ['Status', selectedRD.status, compareRD.status],
                                ['Quality Std.', selectedRD.qualityStandards || '-', compareRD.qualityStandards || '-'],
                              ].map(([label, a, b]) => (
                                <tr key={String(label)} className="hover:bg-white/5">
                                  <td className="py-2 text-slate-400 font-medium">{label}</td>
                                  <td className="py-2 text-center text-white font-mono">{a}</td>
                                  <td className="py-2 text-center text-white font-mono">{b}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="mt-4">
                          <p className="text-[10px] text-slate-400 uppercase font-bold mb-2">Ingredient Comparison</p>
                          <div className="grid grid-cols-2 gap-3">
                            {[selectedRD, compareRD].map((p, pi) => (
                              <div key={pi}>
                                <p className={`text-[10px] font-bold mb-1 ${pi===0?'text-[#D4AF37]':'text-blue-400'}`}>{pi===0?'A':'B'}: {p.title.substring(0,25)}</p>
                                <div className="space-y-1">
                                  {p.ingredients.map((ing, i) => (
                                    <div key={i} className="text-[10px] flex justify-between bg-slate-800/30 rounded px-2 py-1">
                                      <span className="text-slate-300 truncate">{ing.name}</span>
                                      <span className="text-[#D4AF37] font-mono ml-2 shrink-0">{ing.quantity}{ing.unit}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Layers size={32} className="text-slate-600 mb-3"/>
                        <p className="text-slate-400 text-sm font-bold">Select a second product to compare</p>
                        <p className="text-slate-600 text-xs mt-1">Hover over any product in the list and click the compare icon <Layers size={10} className="inline"/></p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── TAB: SPEC SHEET ── */}
                {rdActiveTab === 'spec' && (
                  <div className="bg-slate-900/50 border border-[#D4AF37]/30 rounded-xl p-5 gold-glow">
                    <div className="flex justify-between items-center mb-5">
                      <div>
                        <h3 className="text-sm font-bold text-white">Technical Specification Sheet</h3>
                        <p className="text-[10px] text-slate-500 mt-0.5">Downloads a print-ready HTML document for {selectedRD.title}</p>
                      </div>
                      <button onClick={generateSpecSheet} disabled={rdSpecLoading}
                        className="luxury-gradient px-4 py-2 rounded-lg text-slate-950 text-xs font-bold flex items-center gap-2 disabled:opacity-50">
                        {rdSpecLoading ? <Loader2 className="animate-spin" size={13}/> : <Download size={13}/>}
                        {rdSpecLoading ? 'Generating...' : 'Download Spec Sheet'}
                      </button>
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: 'Includes', items: ['Product identification & regulatory details', 'Full ingredient table with costs', 'Manufacturing process (AI-generated if blank)', 'AI analysis with optimization suggestions', 'Version history', 'AL WAJER letterhead & footer'] },
                      ].map(section => (
                        <div key={section.label} className="bg-slate-800/30 rounded p-4 border border-white/5">
                          <p className="text-[10px] text-[#D4AF37] uppercase font-bold mb-2">{section.label}</p>
                          <div className="grid grid-cols-2 gap-1">
                            {section.items.map(item => (
                              <div key={item} className="flex gap-1.5 items-center text-[10px] text-slate-300">
                                <CheckCircle2 size={10} className="text-green-400 shrink-0"/>{item}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded text-[10px] text-blue-300">
                        <strong>Tip:</strong> Run "AI Full Analysis" first in the Formulation tab to enrich the spec sheet with optimization insights, substitution options, and quality parameters.
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-slate-900/50 border border-[#D4AF37]/30 rounded-xl p-10 gold-glow flex flex-col items-center justify-center">
                <Beaker size={40} className="text-slate-700 mb-3"/>
                <p className="text-slate-400 text-sm font-bold">Select a product or add a new one</p>
                <p className="text-slate-600 text-xs mt-1">Upload a formulation file or click "New Product"</p>
              </div>
            )}
          </div>
        </div>

        {/* ── R&D MODALS ── */}
        {isRdModalOpen && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center p-4 pt-16 overflow-y-auto" onClick={() => setIsRdModalOpen(false)}>
            <div className="bg-slate-900 border border-[#D4AF37]/40 rounded-xl w-full max-w-xl shadow-2xl mb-8" onClick={e => e.stopPropagation()}>

              {/* ADD / EDIT PRODUCT */}
              {(rdModalMode === 'addProduct') && (
                <>
                  <div className="p-5 border-b border-white/10 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-[#D4AF37] uppercase tracking-widest">
                      {selectedRD && newProductData.id === selectedRD.id ? 'Edit Product' : 'New Product'}
                    </h3>
                    <button onClick={() => setIsRdModalOpen(false)}><X size={18} className="text-slate-400"/></button>
                  </div>
                  <div className="p-5 space-y-3 max-h-[65vh] overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-2 gap-3">
                      {[['Product Name *', 'title', 'text'], ['Product Code', 'productCode', 'text'], ['Dosage Form', 'dosageForm', 'select-form'], ['Strength', 'strength', 'text'],
                        ['Therapeutic Category', 'therapeuticCategory', 'text'], ['Batch Size (Kg)', 'batchSize', 'number'],
                        ['Loss Factor', 'loss', 'number'], ['Quality Standard', 'qualityStandards', 'text'],
                        ['Shelf Life', 'shelfLife', 'text'], ['Storage Condition', 'storageCondition', 'text'],
                        ['Regulatory Status', 'regulatoryStatus', 'select-reg'], ['Status', 'status', 'select-status']
                      ].map(([label, key, type]) => (
                        <div key={key} className={key === 'title' || key === 'therapeuticCategory' ? 'col-span-2' : ''}>
                          <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">{label}</label>
                          {type === 'select-form' ? (
                            <select value={newProductData[key] || ''} onChange={e => setNewProductData((p: any) => ({...p, [key]: e.target.value}))}
                              className="w-full bg-slate-800 border border-white/10 rounded px-2 py-1.5 text-white text-xs focus:border-[#D4AF37] focus:outline-none">
                              {['Capsule','Tablet','Sachet','Liquid','Powder','Cream','Gel','Syrup','Injection','Suspension'].map(f => <option key={f}>{f}</option>)}
                            </select>
                          ) : type === 'select-reg' ? (
                            <select value={newProductData[key] || ''} onChange={e => setNewProductData((p: any) => ({...p, [key]: e.target.value}))}
                              className="w-full bg-slate-800 border border-white/10 rounded px-2 py-1.5 text-white text-xs focus:border-[#D4AF37] focus:outline-none">
                              {['Dossier Prep','Registered','Under Review','Clinical Trial','Approved'].map(f => <option key={f}>{f}</option>)}
                            </select>
                          ) : type === 'select-status' ? (
                            <select value={newProductData[key] || ''} onChange={e => setNewProductData((p: any) => ({...p, [key]: e.target.value}))}
                              className="w-full bg-slate-800 border border-white/10 rounded px-2 py-1.5 text-white text-xs focus:border-[#D4AF37] focus:outline-none">
                              {['Formulation','Stability','Bioequivalence','Clinical','Optimizing','Approved'].map(f => <option key={f}>{f}</option>)}
                            </select>
                          ) : (
                            <input type={type} value={newProductData[key] || ''} onChange={e => setNewProductData((p: any) => ({...p, [key]: e.target.value}))}
                              className="w-full bg-slate-800 border border-white/10 rounded px-2 py-1.5 text-white text-xs focus:border-[#D4AF37] focus:outline-none"/>
                          )}
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Manufacturing Process (optional)</label>
                      <textarea value={newProductData.manufacturingProcess || ''} onChange={e => setNewProductData((p: any) => ({...p, manufacturingProcess: e.target.value}))} rows={4}
                        placeholder="Step 1: Weighing & Dispensing&#10;Step 2: Granulation&#10;Step 3: Coating&#10;..."
                        className="w-full bg-slate-800 border border-white/10 rounded px-2 py-1.5 text-white text-xs focus:border-[#D4AF37] focus:outline-none resize-none"/>
                    </div>
                  </div>
                  <div className="p-4 border-t border-white/10 flex justify-end gap-2">
                    <button onClick={() => setIsRdModalOpen(false)} className="px-4 py-1.5 text-slate-400 hover:text-white text-xs font-bold">Cancel</button>
                    <button disabled={!newProductData.title} onClick={() => {
                      if (selectedRD && newProductData.id === selectedRD.id) {
                        // editing existing
                        const merged = calculateCosting({ ...selectedRD, ...newProductData });
                        const versioned = saveRDVersion(merged, 'Product details updated');
                        setSelectedRD(versioned);
                        setRdProjects(prev => prev.map(p => p.id === versioned.id ? versioned : p));
                      } else {
                        const newProj = calculateCosting({
                          ...newProductData,
                          id: `RD-${Date.now()}`,
                          ingredients: [],
                          packingMaterials: [],
                          versions: [],
                          optimizationScore: 0,
                          lastUpdated: new Date().toISOString().split('T')[0],
                          totalRMC: 0, totalFinalRMC: 0
                        });
                        setRdProjects(prev => [newProj, ...prev]);
                        setSelectedRD(newProj);
                        logAction('CREATE', `Created R&D product: ${newProductData.title}`);
                      }
                      setNewProductData({ title:'', productCode:'', dosageForm:'Capsule', strength:'', therapeuticCategory:'', batchSize:100, batchUnit:'Kg', loss:0.02, status:'Formulation', shelfLife:'24 Months', storageCondition:'Below 25°C', qualityStandards:'BP/USP', regulatoryStatus:'Dossier Prep', manufacturingProcess:'' });
                      setIsRdModalOpen(false);
                    }} className="luxury-gradient px-5 py-1.5 rounded text-slate-950 text-xs font-bold disabled:opacity-40">
                      Save Product
                    </button>
                  </div>
                </>
              )}

              {/* ADD / EDIT INGREDIENT */}
              {(rdModalMode === 'addIngredient' || rdModalMode === 'editIngredient') && (
                <>
                  <div className="p-5 border-b border-white/10 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-[#D4AF37] uppercase tracking-widest">
                      {rdModalMode === 'editIngredient' ? 'Edit Ingredient' : 'Add Ingredient'} — {selectedRD?.title.substring(0,30)}
                    </h3>
                    <button onClick={() => setIsRdModalOpen(false)}><X size={18} className="text-slate-400"/></button>
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      {[['S.No', 'sNo', 'text'], ['Material Name *', 'name', 'text'],
                        ['Role', 'role', 'select-role'], ['Unit', 'unit', 'select-unit'],
                        ['Qty / Batch', 'quantity', 'number'], ['Rate (USD/unit)', 'rateUSD', 'number'],
                        ['Supplier', 'supplier', 'text'], ['Grade (BP/USP)', 'grade', 'text']
                      ].map(([label, key, type]) => (
                        <div key={key} className={key === 'name' || key === 'notes' ? 'col-span-2' : ''}>
                          <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">{label}</label>
                          {type === 'select-role' ? (
                            <select value={newIngData[key] || 'API'} onChange={e => setNewIngData((p: any) => ({...p, [key]: e.target.value}))}
                              className="w-full bg-slate-800 border border-white/10 rounded px-2 py-1.5 text-white text-xs focus:border-[#D4AF37] focus:outline-none">
                              {['API','Filler','Binder','Coating','Disintegrant','Lubricant','Plasticizer','Surfactant','Excipient','Other'].map(r => <option key={r}>{r}</option>)}
                            </select>
                          ) : type === 'select-unit' ? (
                            <select value={newIngData[key] || 'Kg'} onChange={e => setNewIngData((p: any) => ({...p, [key]: e.target.value}))}
                              className="w-full bg-slate-800 border border-white/10 rounded px-2 py-1.5 text-white text-xs focus:border-[#D4AF37] focus:outline-none">
                              {['Kg','g','mg','L','mL','Units','Rolls'].map(u => <option key={u}>{u}</option>)}
                            </select>
                          ) : (
                            <input type={type} value={newIngData[key] || ''} onChange={e => setNewIngData((p: any) => ({...p, [key]: e.target.value}))}
                              className="w-full bg-slate-800 border border-white/10 rounded px-2 py-1.5 text-white text-xs focus:border-[#D4AF37] focus:outline-none"/>
                          )}
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Notes</label>
                      <input value={newIngData.notes || ''} onChange={e => setNewIngData((p: any) => ({...p, notes: e.target.value}))}
                        className="w-full bg-slate-800 border border-white/10 rounded px-2 py-1.5 text-white text-xs focus:border-[#D4AF37] focus:outline-none"/>
                    </div>
                    {newIngData.quantity > 0 && newIngData.rateUSD > 0 && (
                      <div className="p-2 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded flex justify-between text-xs">
                        <span className="text-slate-400">Calculated Cost:</span>
                        <span className="text-[#D4AF37] font-bold font-mono">${(Number(newIngData.quantity) * Number(newIngData.rateUSD)).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 border-t border-white/10 flex justify-end gap-2">
                    <button onClick={() => setIsRdModalOpen(false)} className="px-4 py-1.5 text-slate-400 hover:text-white text-xs font-bold">Cancel</button>
                    <button disabled={!newIngData.name} onClick={() => {
                      if (!selectedRD) return;
                      const ing = { ...newIngData, quantity: Number(newIngData.quantity), rateUSD: Number(newIngData.rateUSD), cost: 0 };
                      let updatedIngredients;
                      if (rdModalMode === 'editIngredient') {
                        updatedIngredients = selectedRD.ingredients.map((x, i) => i === editIngIdx ? ing : x);
                      } else {
                        updatedIngredients = [...selectedRD.ingredients, { ...ing, sNo: String(selectedRD.ingredients.length + 1) }];
                      }
                      const updated = calculateCosting({ ...selectedRD, ingredients: updatedIngredients });
                      const versioned = rdModalMode === 'editIngredient'
                        ? saveRDVersion(updated, `Updated ingredient: ${ing.name}`)
                        : saveRDVersion(updated, `Added ingredient: ${ing.name}`);
                      setSelectedRD(versioned);
                      setRdProjects(prev => prev.map(p => p.id === versioned.id ? versioned : p));
                      setIsRdModalOpen(false);
                    }} className="luxury-gradient px-5 py-1.5 rounded text-slate-950 text-xs font-bold disabled:opacity-40">
                      {rdModalMode === 'editIngredient' ? 'Save Changes' : 'Add Ingredient'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderIndustrialStudio = () => (
      <div className="space-y-6 animate-fadeIn flex flex-col pb-10">
          <div className="flex justify-between items-center shrink-0">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <DraftingCompass className="text-[#F4C430]" size={20} /> Industrial Design Chat
              </h2>
               {/* Provider Selector */}
               <div className="flex items-center gap-2 bg-slate-900 border border-white/10 rounded-lg p-1">
                 <span className="text-[10px] text-slate-500 uppercase font-bold px-2">Provider:</span>
                 <select 
                    value={activeProvider}
                    onChange={(e) => setActiveProvider(e.target.value as any)}
                    className="bg-transparent text-xs text-[#D4AF37] font-bold focus:outline-none"
                 >
                     <option value="Gemini">Gemini 3 Pro</option>
                     <option value="Claude">Claude 3.5</option>
                 </select>
              </div>
          </div>
          
          <div className="flex-1 bg-slate-900/50 border border-[#D4AF37]/30 rounded-xl p-0 gold-glow flex flex-col overflow-hidden relative">
              {/* Chat Area */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                  {industrialChat.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                              <div className={`p-4 rounded-xl text-sm ${
                                  msg.role === 'user' 
                                  ? 'bg-[#D4AF37] text-slate-950 font-medium rounded-br-none' 
                                  : 'bg-slate-800 text-slate-200 border border-white/10 rounded-bl-none'
                              }`}>
                                  {msg.text}
                              </div>
                              {msg.image && (
                                  <div className="mt-2 relative group rounded-lg overflow-hidden border border-white/10 max-w-md">
                                      <img src={msg.image} alt="Generated Design" className="w-full h-auto" />
                                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button 
                                              onClick={() => downloadContent(msg.image!, `design-${msg.timestamp}.png`, 'image')}
                                              className="p-2 bg-white text-black rounded-full hover:bg-[#D4AF37] transition-colors" title="Download"
                                          >
                                              <FileDown size={20}/>
                                          </button>
                                          <button 
                                              onClick={() => downloadContent(msg.image!, `design-${msg.timestamp}.png`, 'image')} 
                                              className="p-2 bg-white text-black rounded-full hover:bg-[#D4AF37] transition-colors" title="Save to Gallery"
                                          >
                                              <Save size={20}/>
                                          </button>
                                      </div>
                                  </div>
                              )}
                              <span className="text-[10px] text-slate-500 mt-1">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                          </div>
                      </div>
                  ))}
                  {isAiLoading && (
                      <div className="flex justify-start">
                           <div className="bg-slate-800 p-4 rounded-xl rounded-bl-none border border-white/10 flex items-center gap-2 text-slate-400 text-xs">
                              <Loader2 className="animate-spin" size={14}/> Generating Design Concept...
                          </div>
                      </div>
                  )}
              </div>

              {/* Input Area */}
              <div className="shrink-0 p-4 bg-slate-950 border-t border-white/10 flex flex-col gap-2">
                  {pendingIndustrialImage && (
                      <div className="flex items-center gap-2 p-2 bg-slate-900 border border-white/10 rounded-lg w-fit">
                          <ImageIcon size={14} className="text-[#D4AF37]"/>
                          <span className="text-xs text-white">Image Attached for Editing</span>
                          <button onClick={() => { setPendingIndustrialImage(null); setPendingIndustrialMime(null); }}><X size={14} className="text-slate-500 hover:text-white"/></button>
                      </div>
                  )}
                  <div className="flex gap-2 items-center">
                    <button onClick={() => industrialFileRef.current?.click()} className="p-3 text-slate-400 hover:text-white bg-slate-900 rounded-lg border border-white/10 h-12 w-12 flex items-center justify-center">
                        <Paperclip size={20}/>
                    </button>
                    <input type="file" ref={industrialFileRef} className="hidden" onChange={(e) => handleFileUpload(e, 'industrial')} />
                    
                    {/* Image Controls */}
                    <select 
                        value={aspectRatio} 
                        onChange={(e) => setAspectRatio(e.target.value)}
                        className="bg-slate-900 border border-white/10 rounded-lg px-2 h-12 text-xs text-white focus:outline-none"
                    >
                        <option value="1:1">1:1</option>
                        <option value="16:9">16:9</option>
                        <option value="9:16">9:16</option>
                        <option value="4:3">4:3</option>
                        <option value="3:4">3:4</option>
                    </select>
                    <select 
                        value={imageSize} 
                        onChange={(e) => setImageSize(e.target.value)}
                        className="bg-slate-900 border border-white/10 rounded-lg px-2 h-12 text-xs text-white focus:outline-none"
                    >
                        <option value="1K">1K</option>
                        <option value="2K">2K</option>
                        <option value="4K">4K</option>
                    </select>

                    <input 
                        type="text" 
                        value={industrialInput}
                        onChange={(e) => setIndustrialInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleIndustrialChat()}
                        placeholder={pendingIndustrialImage ? "How should I edit this image?" : "Describe facility layout..."}
                        className="flex-1 bg-slate-900 border border-white/10 rounded-lg px-4 h-12 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                    />
                    <button 
                        onClick={handleIndustrialChat}
                        disabled={(!industrialInput.trim() && !pendingIndustrialImage) || isAiLoading}
                        className="bg-[#D4AF37] hover:bg-[#c4a030] text-slate-950 px-6 h-12 rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {pendingIndustrialImage ? <Wand2 size={16}/> : <ImageIcon size={16}/>}
                        {pendingIndustrialImage ? "EDIT" : "GENERATE"}
                    </button>
                  </div>
              </div>
          </div>
      </div>
  );

  const renderBrainstorming = () => {
      // Find current session or default to welcome
      const currentSession = brainstormSessions.find(s => s.id === currentBrainstormId);

      return (
      <div className="space-y-6 animate-fadeIn flex flex-col pb-10">
           <div className="flex justify-between items-center shrink-0">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <BrainCircuit className="text-[#F4C430]" size={20} /> Strategic Brainstorming
              </h2>
               {/* Provider Selector */}
               <div className="flex items-center gap-2 bg-slate-900 border border-white/10 rounded-lg p-1">
                 <span className="text-[10px] text-slate-500 uppercase font-bold px-2">Knowledge:</span>
                 <select 
                    value={activeProvider}
                    onChange={(e) => setActiveProvider(e.target.value as any)}
                    className="bg-transparent text-xs text-[#D4AF37] font-bold focus:outline-none"
                 >
                     <option value="Gemini">Gemini 3 Pro</option>
                     <option value="NotebookLM">NotebookLM</option>
                 </select>
              </div>
          </div>
          
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 overflow-hidden">
              {/* Sidebar History */}
              <div className="bg-slate-900/50 border border-[#D4AF37]/30 rounded-xl p-4 gold-glow flex flex-col">
                  <button onClick={startNewBrainstorm} className="w-full mb-4 py-2 bg-[#D4AF37]/10 border border-[#D4AF37] text-[#D4AF37] rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#D4AF37]/20 transition-all">
                      <Plus size={16}/> New Session
                  </button>
                  <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                      {brainstormSessions.map(session => (
                          <div 
                              key={session.id} 
                              onClick={() => setCurrentBrainstormId(session.id)}
                              className={`p-3 rounded-lg cursor-pointer border transition-all ${
                                  currentBrainstormId === session.id 
                                  ? 'bg-slate-800 border-[#D4AF37]/50 text-white' 
                                  : 'bg-transparent border-transparent hover:bg-slate-800/50 text-slate-400'
                              }`}
                          >
                              <div className="text-sm font-bold truncate">{session.topic}</div>
                              <div className="text-[10px] opacity-60">{session.date}</div>
                          </div>
                      ))}
                      {brainstormSessions.length === 0 && <p className="text-center text-xs text-slate-500 mt-4">No history.</p>}
                  </div>
              </div>

              {/* Chat Area */}
              <div className="lg:col-span-3 bg-slate-900/50 border border-[#D4AF37]/30 rounded-xl flex flex-col gold-glow overflow-hidden relative">
                  {currentBrainstormId ? (
                      <>
                          <div className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-950/50">
                               <div>
                                   <h3 className="text-sm font-bold text-white">{currentSession?.topic}</h3>
                                   <p className="text-[10px] text-slate-500">Strategic Session</p>
                               </div>
                               <button 
                                  onClick={() => downloadContent(JSON.stringify(currentSession?.messages, null, 2), 'transcript.json', 'text')}
                                  className="text-slate-400 hover:text-[#D4AF37] flex items-center gap-2 text-xs font-bold"
                               >
                                   <Download size={14}/> Transcript
                               </button>
                          </div>

                          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                              {currentSession?.messages.map(msg => (
                                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                      <div className={`max-w-[85%] p-4 rounded-xl text-sm ${
                                          msg.role === 'user' 
                                          ? 'bg-slate-800 border border-white/20 text-white rounded-br-none' 
                                          : 'bg-black/40 border border-[#D4AF37]/20 text-slate-300 rounded-bl-none'
                                      }`}>
                                          <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                                          <span className="text-[10px] opacity-40 block mt-2">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                                      </div>
                                  </div>
                              ))}
                              {isAiLoading && (
                                  <div className="flex justify-start">
                                      <div className="bg-black/40 p-4 rounded-xl border border-[#D4AF37]/20 flex items-center gap-2 text-slate-400 text-xs">
                                          <BrainCircuit className="animate-pulse" size={14}/> Analyzing Strategy...
                                      </div>
                                  </div>
                              )}
                          </div>

                          <div className="p-4 bg-slate-950 border-t border-white/10 flex gap-2">
                               <button onClick={() => brainstormFileRef.current?.click()} className="p-3 text-slate-400 hover:text-white bg-slate-900 rounded-lg border border-white/10">
                                  <FolderOpen size={20}/>
                              </button>
                              <input type="file" ref={brainstormFileRef} className="hidden" onChange={(e) => handleFileUpload(e, 'brainstorm')} />
                              
                              <input 
                                  type="text" 
                                  value={brainstormInput}
                                  onChange={(e) => setBrainstormInput(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && handleBrainstormChat()}
                                  placeholder="Type your strategic input..."
                                  className="flex-1 bg-slate-900 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                              />
                              <button 
                                  onClick={handleBrainstormChat}
                                  disabled={!brainstormInput.trim() || isAiLoading}
                                  className="bg-[#D4AF37] hover:bg-[#c4a030] text-slate-950 p-3 rounded-lg transition-colors disabled:opacity-50"
                              >
                                  <Send size={20}/>
                              </button>
                          </div>
                      </>
                  ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                          <BrainCircuit size={48} className="mb-4 opacity-20"/>
                          <p>Select a session or start a new one.</p>
                          <button onClick={startNewBrainstorm} className="mt-4 px-6 py-2 bg-[#D4AF37] text-slate-950 rounded-lg font-bold text-sm">
                              Start New Session
                          </button>
                      </div>
                  )}
              </div>
          </div>
      </div>
      );
  };

  
  const renderCalculator = () => {
    const calculateMargins = () => {
      const totalCostPerUnit = Number(calcData.rmc) + Number(calcData.labor) + Number(calcData.packing);
      const totalCostBase = totalCostPerUnit * Number(calcData.volume);
      const totalRevenue = Number(calcData.targetPrice) * Number(calcData.volume);
      const profit = totalRevenue - totalCostBase;
      const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
      
      setCalcResults({
        totalCostPerUnit,
        totalCostBase,
        totalRevenue,
        profit,
        margin: margin.toFixed(2)
      });
    };

    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Calculator className="text-[#F4C430]" size={20} /> Sales vs Cost Calculator
            </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-slate-900/50 border border-[#D4AF37]/30 rounded-xl p-6 gold-glow">
                <h3 className="text-sm font-bold text-[#D4AF37] uppercase mb-4">Input Parameters</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Product to Manufacture</label>
                        <input type="text" value={calcData.product} onChange={e => setCalcData({...calcData, product: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded p-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none" placeholder="e.g. Esomeprazole 40mg"/>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Volume (KG)</label>
                            <input type="number" value={calcData.volume} onChange={e => setCalcData({...calcData, volume: Number(e.target.value)})} className="w-full bg-slate-950 border border-white/10 rounded p-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"/>
                        </div>
                        <div>
                            <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Target Price ($)</label>
                            <input type="number" value={calcData.targetPrice} onChange={e => setCalcData({...calcData, targetPrice: Number(e.target.value)})} className="w-full bg-slate-950 border border-white/10 rounded p-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"/>
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Raw Material Cost (RMC/Unit)</label>
                        <input type="number" value={calcData.rmc} onChange={e => setCalcData({...calcData, rmc: Number(e.target.value)})} className="w-full bg-slate-950 border border-white/10 rounded p-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"/>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Labor Cost</label>
                            <input type="number" value={calcData.labor} onChange={e => setCalcData({...calcData, labor: Number(e.target.value)})} className="w-full bg-slate-950 border border-white/10 rounded p-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"/>
                        </div>
                        <div>
                            <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Packing Material</label>
                            <input type="number" value={calcData.packing} onChange={e => setCalcData({...calcData, packing: Number(e.target.value)})} className="w-full bg-slate-950 border border-white/10 rounded p-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"/>
                        </div>
                    </div>
                    <button onClick={calculateMargins} className="w-full luxury-gradient py-3 rounded-lg text-slate-950 font-bold shadow-lg shadow-[#D4AF37]/20 mt-4">Analyze Feasibility</button>
                </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
                {calcResults ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-slate-900/50 border border-white/5 p-4 rounded-xl">
                                <p className="text-[10px] text-slate-500 uppercase font-bold">Total Cost / Unit</p>
                                <p className="text-2xl font-bold text-white font-mono">$ {calcResults.totalCostPerUnit.toFixed(3)}</p>
                            </div>
                            <div className="bg-slate-900/50 border border-white/5 p-4 rounded-xl">
                                <p className="text-[10px] text-slate-500 uppercase font-bold">Total Order Val</p>
                                <p className="text-2xl font-bold text-[#D4AF37] font-mono">$ {calcResults.totalRevenue.toLocaleString()}</p>
                            </div>
                            <div className="bg-slate-900/50 border border-[#D4AF37]/30 p-4 rounded-xl">
                                <p className="text-[10px] text-slate-500 uppercase font-bold">Est. Net Profit</p>
                                <p className="text-2xl font-bold text-green-400 font-mono">$ {calcResults.profit.toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="bg-slate-900/50 border border-[#D4AF37]/30 rounded-xl p-8 gold-glow flex flex-col items-center justify-center text-center">
                             <div className="relative w-48 h-48 flex items-center justify-center mb-6">
                                 <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
                                 <div className="absolute inset-0 border-4 border-[#D4AF37] rounded-full" style={{clipPath: `inset(0 ${100 - Number(calcResults.margin)}% 0 0)`}}></div>
                                 <div className="z-10 bg-slate-950/40 backdrop-blur-md p-6 rounded-full border border-white/5">
                                     <p className="text-4xl font-bold text-white font-mono">{calcResults.margin}%</p>
                                     <p className="text-[10px] text-slate-500 uppercase font-bold">Gross Margin</p>
                                 </div>
                             </div>
                             <h4 className="text-xl font-bold text-white mb-2">{Number(calcResults.margin) > 20 ? 'Highly Profitable Project' : 'Low Margin Project'}</h4>
                             <p className="text-sm text-slate-500 max-w-sm mb-6">This project yields a {calcResults.margin}% margin based on current raw material and labor costs.</p>
                             <button 
                                onClick={() => downloadContent(`QUOTATION FOR ${calcData.product.toUpperCase()}\n\nVolume: ${calcData.volume} KG\nUnit Price: $ ${calcData.targetPrice}\nTotal Value: $ ${calcResults.totalRevenue.toLocaleString()}\nExpected Margin: ${calcResults.margin}%\n\nValid for: 7 Days`, 'quotation.txt', 'text')}
                                className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#c4a030] text-slate-950 px-6 py-2 rounded-lg font-bold transition-all"
                             >
                                 <FileText size={16}/> Generate Quotation
                             </button>
                        </div>
                    </>
                ) : (
                    <div className="h-full min-h-[400px] bg-slate-900/50 border border-white/10 rounded-xl flex flex-col items-center justify-center text-slate-600 border-dashed">
                        <Calculator size={48} className="mb-4 opacity-20"/>
                        <p className="font-bold">Input parameters and click Analyze to calculate margins</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    );
  };


  const renderAIOps = () => {
    const activeSkill = savedSkills.find((s: any) => s.id === activeSkillId);
    const providerColors: Record<string, string> = {
      Claude: 'text-orange-400', Gemini: 'text-blue-400', DeepSeek: 'text-cyan-400', NotebookLM: 'text-purple-400'
    };
    const providerBg: Record<string, string> = {
      Claude: 'bg-orange-500/10 border-orange-500/30',
      Gemini: 'bg-blue-500/10 border-blue-500/30',
      DeepSeek: 'bg-cyan-500/10 border-cyan-500/30',
      NotebookLM: 'bg-purple-500/10 border-purple-500/30'
    };

    return (
      <div className="flex flex-col animate-fadeIn pb-6 space-y-4">

        {/* ── HEADER + TAB BAR ── */}
        <div className="flex flex-wrap gap-3 justify-between items-center shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BrainCircuit className="text-[#F4C430]" size={20}/> AI Command Center
          </h2>
          <div className="flex gap-1 bg-slate-900 border border-white/10 rounded-xl p-1">
            {([['chat','💬 Chat'],['industrial','🏭 Industrial'],['brainstorm','⚡ Brainstorm'],['skills','🛠 Skills']] as const).map(([tab, label]) => (
              <button key={tab} onClick={() => setAiCmdTab(tab as any)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all
                  ${aiCmdTab === tab ? 'bg-[#D4AF37] text-slate-950' : 'text-slate-400 hover:text-white'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════════
            TAB: CHAT — Multi-session
        ══════════════════════════════════════════ */}
        {aiCmdTab === 'chat' && (
          <div className="flex gap-3 min-h-0" style={{height: 'calc(100vh - 230px)', minHeight: '520px'}}>

            {/* LEFT: Session list */}
            <div className="w-48 shrink-0 flex flex-col gap-2">
              <button onClick={createNewChat}
                className="luxury-gradient w-full py-2 rounded-lg text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5">
                <Plus size={12}/> New Chat
              </button>
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
                {chatSessions.filter((s: any) => !s.archived).map((session: any) => (
                  <div key={session.id}
                    onClick={() => switchChat(session.id)}
                    className={`group relative p-2.5 rounded-lg border cursor-pointer transition-all
                      ${activeChatId === session.id ? 'bg-[#D4AF37]/10 border-[#D4AF37]/50' : 'bg-slate-900/50 border-white/5 hover:border-white/20'}`}>
                    <p className="text-xs font-bold text-white truncate pr-4">{session.title || 'New Chat'}</p>
                    <p className={`text-[10px] font-bold ${providerColors[session.provider] || 'text-slate-500'}`}>{session.provider}</p>
                    <p className="text-[9px] text-slate-600">{session.messages.length} msg</p>
                    <button onClick={e => { e.stopPropagation(); archiveChat(session.id); }}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all"
                      title="Close"><X size={10}/></button>
                  </div>
                ))}
                {chatSessions.filter((s: any) => s.archived && s.messages.length > 0).length > 0 && (
                  <>
                    <div className="text-[9px] text-slate-600 uppercase font-bold px-1 pt-3 pb-1">History</div>
                    {chatSessions.filter((s: any) => s.archived && s.messages.length > 0).map((session: any) => (
                      <div key={session.id}
                        onClick={() => { setChatSessions((prev: any) => prev.map((s: any) => s.id === session.id ? {...s, archived: false} : s)); switchChat(session.id); }}
                        className="group relative p-2 rounded-lg border border-white/5 bg-slate-900/20 cursor-pointer hover:border-white/10 transition-all">
                        <p className="text-[10px] text-slate-500 truncate pr-4">{session.title || 'Chat'}</p>
                        <p className={`text-[9px] font-bold ${providerColors[session.provider] || 'text-slate-600'}`}>{session.provider}</p>
                        <button onClick={e => { e.stopPropagation(); setChatSessions((prev: any) => prev.filter((s: any) => s.id !== session.id)); }}
                          className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 text-slate-700 hover:text-red-400">
                          <Trash2 size={9}/></button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* RIGHT: Active chat */}
            <div className="flex-1 flex flex-col gap-2 min-w-0">
              {/* Provider + Skills bar */}
              <div className="flex flex-wrap gap-1.5 items-center bg-slate-900/50 border border-white/10 rounded-xl px-3 py-2 shrink-0">
                {(['Claude','Gemini','DeepSeek','NotebookLM'] as const).map(p => (
                  <button key={p} onClick={() => { setActiveProvider(p); setActiveSkillId(null); }}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all
                      ${activeProvider === p && !activeSkillId ? providerBg[p] + ' ' + providerColors[p] : 'border-transparent text-slate-500 hover:text-white'}`}>
                    {p === 'Claude' ? '🤖 Claude' : p === 'Gemini' ? '✨ Gemini' : p === 'DeepSeek' ? '🐳 DeepSeek' : '📚 NotebookLM'}
                  </button>
                ))}
                <div className="w-px h-4 bg-white/10"/>
                {savedSkills.slice(0, 3).map((sk: any) => (
                  <button key={sk.id}
                    onClick={() => { setActiveSkillId(activeSkillId === sk.id ? null : sk.id); setActiveProvider(sk.provider); }}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded border transition-all
                      ${activeSkillId === sk.id ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]' : 'border-white/10 text-slate-500 hover:text-white'}`}>
                    {sk.name}
                  </button>
                ))}
                <button onClick={() => setAiCmdTab('skills')}
                  className="px-2 py-0.5 text-[10px] text-slate-600 hover:text-slate-400 border border-dashed border-white/10 rounded">
                  + skills
                </button>
              </div>
              {activeSkill && (
                <div className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-2 shrink-0 ${providerBg[activeSkill.provider]}`}>
                  <span className={`font-bold text-[11px] ${providerColors[activeSkill.provider]}`}>Skill: {activeSkill.name}</span>
                  <span className="text-slate-400 truncate text-[10px]">{activeSkill.description}</span>
                  <button onClick={() => setActiveSkillId(null)} className="ml-auto text-slate-500 hover:text-white shrink-0"><X size={11}/></button>
                </div>
              )}
              <div className="flex-1 bg-slate-900/50 border border-[#D4AF37]/30 rounded-xl p-3 gold-glow flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 mb-3 pr-1">
                  {aiCmdHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-8">
                      <BrainCircuit size={28} className="text-slate-700 mb-2"/>
                      <p className="text-slate-400 text-xs font-bold">Choose a provider or skill and start chatting</p>
                      <div className="mt-3 space-y-1.5 w-full max-w-xs">
                        {['What is our current inventory status?','Analyze Esomeprazole formulation cost','What GCC markets should we target?'].map(q => (
                          <button key={q} onClick={() => setAiCmdInput(q)}
                            className="w-full text-left text-[11px] bg-slate-800/50 hover:bg-slate-800 border border-white/5 hover:border-[#D4AF37]/30 rounded-lg px-3 py-1.5 text-slate-400 hover:text-white transition-all">
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    aiCmdHistory.map((msg: any, idx: number) => (
                      <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] flex flex-col gap-0.5 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                          {msg.skillName && <span className="text-[9px] text-[#D4AF37] font-bold uppercase px-1">{msg.skillName}</span>}
                          {msg.role !== 'user' && <span className={`text-[9px] font-bold uppercase px-1 ${providerColors[msg.provider] || 'text-slate-500'}`}>{msg.provider}</span>}
                          <div className={`p-3 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'bg-[#D4AF37] text-slate-950 font-medium rounded-br-none' : 'bg-slate-800 text-slate-200 border border-white/10 rounded-bl-none'}`}>
                            {msg.text}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  {isAiLoading && (
                    <div className="flex justify-start">
                      <div className="bg-slate-800 p-3 rounded-xl rounded-bl-none border border-white/10 flex items-center gap-2 text-slate-400 text-xs">
                        <Loader2 className="animate-spin" size={13}/> {activeProvider} thinking...
                      </div>
                    </div>
                  )}
                </div>
                <div className="shrink-0 flex gap-2">
                  <input value={aiCmdInput} onChange={e => setAiCmdInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAICommandSend(); } }}
                    placeholder={activeSkill ? `Using: ${activeSkill.name}...` : `Message ${activeProvider}...`}
                    className="flex-1 bg-slate-950 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#D4AF37] focus:outline-none"/>
                  <button onClick={() => handleAICommandSend()} disabled={!aiCmdInput.trim() || isAiLoading}
                    className="bg-[#D4AF37] hover:bg-[#c4a030] text-slate-950 p-2.5 rounded-lg transition-colors disabled:opacity-50">
                    <Send size={16}/>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* ══════════════════════════════════════════
            TAB: INDUSTRIAL
        ══════════════════════════════════════════ */}
        {aiCmdTab === 'industrial' && renderIndustrialStudio()}

        {/* ══════════════════════════════════════════
            TAB: BRAINSTORM
        ══════════════════════════════════════════ */}
        {aiCmdTab === 'brainstorm' && renderBrainstorming()}

        {/* ══════════════════════════════════════════
            TAB: SKILLS STORE
        ══════════════════════════════════════════ */}
        {aiCmdTab === 'skills' && (
          <div className="space-y-5">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-white">Skills Store</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Save AI agent prompts — activate any skill in the Chat tab to apply it to every message
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <label className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all">
                  <Upload size={13}/> Import .skill
                  <input type="file" accept=".skill,.zip" className="hidden" onChange={handleSkillFileUpload}/>
                </label>
                <button
                  onClick={() => {
                    setNewSkillData({ name: '', provider: 'Claude', description: '', prompt: '', category: 'Operations' });
                    setIsSkillModalOpen(true);
                  }}
                  className="luxury-gradient px-4 py-2 rounded-lg text-slate-950 text-xs font-bold flex items-center gap-1.5">
                  <Plus size={13}/> Create Skill
                </button>
              </div>
            </div>

            {/* Provider legend */}
            <div className="flex gap-3 text-[10px]">
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block"/><span className="text-slate-400">Claude — Operations & decisions</span></div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block"/><span className="text-slate-400">Gemini — Data & formulations</span></div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-400 inline-block"/><span className="text-slate-400">NotebookLM — Presentations</span></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {savedSkills.map((skill: any) => (
                <div key={skill.id}
                  className={`p-4 rounded-xl border transition-all group relative
                    ${activeSkillId === skill.id
                      ? 'bg-[#D4AF37]/10 border-[#D4AF37]'
                      : providerBg[skill.provider] + ' hover:opacity-90'}`}>
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setSavedSkills((prev: any) => prev.filter((s: any) => s.id !== skill.id));
                        if (activeSkillId === skill.id) setActiveSkillId(null);
                      }}
                      className="p-1 rounded bg-slate-900 text-red-400 hover:bg-red-900">
                      <Trash2 size={10}/>
                    </button>
                  </div>
                  <div className="flex items-start gap-2 pr-8">
                    <span className="text-lg shrink-0">
                      {skill.provider === 'Claude' ? '🤖' : skill.provider === 'Gemini' ? '✨' : '📚'}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-white text-sm">{skill.name}</h4>
                        {activeSkillId === skill.id && (
                          <span className="text-[9px] bg-[#D4AF37] text-slate-950 px-1.5 py-0.5 rounded font-bold">ACTIVE</span>
                        )}
                      </div>
                      <p className={`text-[10px] font-bold mt-0.5 ${providerColors[skill.provider]}`}>
                        {skill.provider} · {skill.category}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">{skill.description}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center">
                    <span className="text-[10px] text-slate-600">Used {skill.usageCount || 0} times · {skill.createdAt}</span>
                    <button
                      onClick={() => {
                        setActiveSkillId(skill.id);
                        setActiveProvider(skill.provider);
                        setAiCmdTab('chat');
                      }}
                      className="text-[10px] text-[#D4AF37] hover:underline font-bold">
                      Activate →
                    </button>
                  </div>
                </div>
              ))}
              {savedSkills.length === 0 && (
                <div className="col-span-2 flex flex-col items-center justify-center py-16 border border-dashed border-white/10 rounded-xl">
                  <Wand2 size={32} className="text-slate-700 mb-3"/>
                  <p className="text-slate-400 text-sm font-bold">No skills yet</p>
                  <p className="text-slate-600 text-xs mt-1">Click "Create Skill" to build your first AI agent</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            SKILL CREATE MODAL
        ══════════════════════════════════════════ */}
        {isSkillModalOpen && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setIsSkillModalOpen(false)}>
            <div className="bg-slate-900 border border-[#D4AF37]/40 rounded-xl w-full max-w-lg shadow-2xl"
              onClick={e => e.stopPropagation()}>
              <div className="p-5 border-b border-white/10 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-[#D4AF37] uppercase tracking-widest">Create AI Skill</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Define a reusable AI agent with a custom role and instructions</p>
                </div>
                <button onClick={() => setIsSkillModalOpen(false)}><X size={18} className="text-slate-400"/></button>
              </div>
              <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Skill Name *</label>
                    <input value={newSkillData.name}
                      onChange={e => setNewSkillData((p: any) => ({...p, name: e.target.value}))}
                      placeholder="e.g. Batch Review Agent"
                      className="w-full bg-slate-800 border border-white/10 rounded px-3 py-2 text-white text-xs focus:border-[#D4AF37] focus:outline-none"/>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Category</label>
                    <select value={newSkillData.category}
                      onChange={e => setNewSkillData((p: any) => ({...p, category: e.target.value}))}
                      className="w-full bg-slate-800 border border-white/10 rounded px-3 py-2 text-white text-xs focus:border-[#D4AF37] focus:outline-none">
                      {['Operations','R&D','Finance','HR','Business Dev','Procurement','Compliance','Quality','Other'].map(c => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">AI Provider</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Claude','Gemini','DeepSeek','NotebookLM'] as const).map(p => (
                      <button key={p}
                        onClick={() => setNewSkillData((prev: any) => ({...prev, provider: p}))}
                        className={`py-2.5 text-xs font-bold rounded-lg border transition-all text-center
                          ${newSkillData.provider === p
                            ? providerBg[p] + ' ' + providerColors[p]
                            : 'border-white/10 text-slate-500 hover:text-white'}`}>
                        {p === 'Claude' ? '🤖 Claude' : p === 'Gemini' ? '✨ Gemini' : p === 'DeepSeek' ? '🐳 DeepSeek' : '📚 NotebookLM'}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1.5">
                    {newSkillData.provider === 'Claude'
                      ? '🤖 Best for: Operations decisions, compliance, strategic analysis, writing'
                      : newSkillData.provider === 'Gemini'
                      ? '✨ Best for: Formulation data, market research, numerical analysis'
                      : newSkillData.provider === 'DeepSeek' ? '🐳 Best for: Complex reasoning, coding, and logical tasks' : '📚 Best for: Executive summaries, presentations, knowledge synthesis'}
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Short Description</label>
                  <input value={newSkillData.description}
                    onChange={e => setNewSkillData((p: any) => ({...p, description: e.target.value}))}
                    placeholder="One line: what this skill does"
                    className="w-full bg-slate-800 border border-white/10 rounded px-3 py-2 text-white text-xs focus:border-[#D4AF37] focus:outline-none"/>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">System Prompt / Agent Instructions *</label>
                  <textarea value={newSkillData.prompt}
                    onChange={e => setNewSkillData((p: any) => ({...p, prompt: e.target.value}))}
                    rows={6}
                    placeholder={"You are a [role] for Al Wajer Pharmaceuticals.\nWhen given [input type], you will:\n1. [Action 1]\n2. [Action 2]\nAlways consider [constraints/context]."}
                    className="w-full bg-slate-800 border border-white/10 rounded px-3 py-2 text-white text-xs focus:border-[#D4AF37] focus:outline-none resize-none font-mono leading-relaxed"/>
                  <p className="text-[10px] text-slate-600 mt-1">This is the secret instructions that define the AI's role and behaviour for this skill.</p>
                </div>
              </div>
              <div className="p-4 border-t border-white/10 flex justify-end gap-2">
                <button onClick={() => setIsSkillModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white text-xs font-bold">Cancel</button>
                <button
                  disabled={!newSkillData.name || !newSkillData.prompt}
                  onClick={() => {
                    const skill = {
                      ...newSkillData,
                      id: `SK-${Date.now()}`,
                      usageCount: 0,
                      createdAt: new Date().toISOString().split('T')[0]
                    };
                    setSavedSkills((prev: any) => [skill, ...prev]);
                    setIsSkillModalOpen(false);
                    logAction('CREATE', `Created AI Skill: ${skill.name}`);
                  }}
                  className="luxury-gradient px-5 py-2 rounded text-slate-950 text-xs font-bold disabled:opacity-40">
                  Save Skill
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };


  const renderBD = () => (
    <div className="space-y-6 animate-fadeIn">
       <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Globe className="text-[#F4C430]" size={20} /> Business Development
          </h2>
          <div className="flex gap-2">
              <button 
                  onClick={() => openModal('add', 'bd', {id: `BD-${Date.now()}`, targetMarket: '', opportunity: '', potentialValue: '', status: 'Prospecting', probability: 50})} 
                  className="luxury-gradient px-4 py-2 rounded-lg text-slate-950 font-bold flex items-center gap-2 text-sm shadow-lg shadow-[#D4AF37]/30"
              >
                  <Plus size={16}/> Insert New Lead
              </button>
              <button onClick={() => bdFileRef.current?.click()} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                  <Upload size={14}/> Import
              </button>
              <input type="file" ref={bdFileRef} className="hidden" onChange={(e) => handleFileUpload(e, 'bd')} />
          </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bdLeads.map(lead => (
              <div key={lead.id} className="p-4 bg-slate-900/50 border border-[#D4AF37]/30 rounded-xl hover:border-[#D4AF37]/60 transition-all gold-glow group relative">
                  <div className="absolute top-4 right-4 text-[9px] font-bold text-[#D4AF37] px-2 py-0.5 rounded border border-[#D4AF37]/30 bg-[#D4AF37]/5">
                      {lead.status}
                  </div>
                  <p className="text-[#D4AF37] text-[10px] font-bold uppercase tracking-wider mb-1">{lead.targetMarket}</p>
                  <h3 className="text-white font-bold text-lg leading-tight mb-2 pr-12">{lead.opportunity}</h3>
                  <div className="flex justify-between items-end mt-4">
                      <div className="text-[10px] text-slate-500">
                           Potential: <span className="text-white font-bold">{lead.potentialValue}</span>
                      </div>
                      <div className="text-right">
                           <div className="text-[9px] text-slate-500 mb-0.5">Prob.</div>
                           <div className="text-lg font-bold text-white font-mono">{lead.probability}%</div>
                      </div>
                  </div>
              </div>
          ))}
          {bdLeads.length === 0 && (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-xl">
                 <p className="text-slate-500 font-bold">No active BD leads.</p>
              </div>
          )}
      </div>
    </div>
  );


  const renderSamples = () => (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <PackageSearch className="text-[#F4C430]" size={20} /> Sample Tracking
          </h2>
          <button 
              onClick={() => openModal('add', 'samples', {id: `SMP-${Date.now()}`, product: '', destination: '', quantity: '1 Unit', status: 'Requested', trackingNumber: 'Pending'})} 
              className="luxury-gradient px-4 py-2 rounded-lg text-slate-950 font-bold flex items-center gap-2 text-sm shadow-lg shadow-[#D4AF37]/30"
          >
              <Plus size={16}/> New Sample
          </button>
      </div>
      <div className="bg-slate-900/50 border border-[#D4AF37]/30 rounded-xl overflow-hidden gold-glow">
          <table className="w-full text-left">
              <thead className="bg-slate-950/50 text-[10px] text-slate-500 uppercase font-bold tracking-widest">
                  <tr>
                      <th className="px-6 py-4">Product</th>
                      <th className="px-6 py-4">Destination</th>
                      <th className="px-6 py-4">Tracking</th>
                      <th className="px-6 py-4">Status</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                  {samples.map(sample => (
                      <tr key={sample.id} className="hover:bg-white/5">
                          <td className="px-6 py-4">
                              <div className="text-white font-bold">{sample.product}</div>
                              <div className="text-[10px] text-slate-500 font-mono">{sample.id}</div>
                          </td>
                          <td className="px-6 py-4 text-slate-300">{sample.destination}</td>
                          <td className="px-6 py-4 font-mono text-xs">{sample.trackingNumber}</td>
                          <td className="px-6 py-4">
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">{sample.status}</span>
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>
    </div>
  );


  // Custom Icon for Claude (simple Bot representation)
  const BotIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/>
      <path d="M12 22a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2 2 2 0 0 1 2 2v2a2 2 0 0 1-2 2z"/>
      <path d="M22 12a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2 2 2 0 0 1 2-2h2a2 2 0 0 1 2 2z"/>
      <path d="M6 12a2 2 0 0 1-2-2H2a2 2 0 0 1-2 2 2 2 0 0 1 2 2h2a2 2 0 0 1 2-2z"/>
      <rect x="7" y="7" width="10" height="10" rx="3" />
    </svg>
  );

  return (
    <div className="h-screen w-full flex bg-[#020617] text-slate-200 overflow-y-auto font-inter">
      {renderModal()}
      {renderCustomizeModal()}
      {renderSettingsModal()}
      {renderConfirmationDialog()}
      {renderUploadProgress()}

      {/* PO GENERATION MODAL */}
      {isPOModalOpen && poItem && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setIsPOModalOpen(false)}>
          <div className="bg-slate-900 border border-[#D4AF37]/40 rounded-xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-lg font-bold text-[#D4AF37] uppercase tracking-widest flex items-center gap-2">
                <FileText size={18}/> Generate Purchase Order
              </h3>
              <button onClick={() => setIsPOModalOpen(false)} className="text-slate-400 hover:text-white"><X size={20}/></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-3 bg-slate-800/50 rounded-lg border border-[#D4AF37]/20">
                <p className="text-xs text-slate-400 uppercase font-bold">Material</p>
                <p className="text-white font-bold mt-1">{poItem.name}</p>
              </div>
              <div>
                <label className="block text-xs text-slate-400 uppercase font-bold mb-1">Supplier / Vendor Name</label>
                <input value={poVendor} onChange={e => setPOVendor(e.target.value)} placeholder="e.g. Tagoor Laboratories Private Limited, India"
                  className="w-full bg-slate-800 border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-[#D4AF37]/50 focus:outline-none"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 uppercase font-bold mb-1">Quantity (Kg)</label>
                  <input type="number" value={poQty} onChange={e => setPOQty(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-[#D4AF37]/50 focus:outline-none"/>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 uppercase font-bold mb-1">Unit Price (USD)</label>
                  <input type="number" value={poUnitPrice} onChange={e => setPOUnitPrice(e.target.value)} placeholder="e.g. 48"
                    className="w-full bg-slate-800 border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-[#D4AF37]/50 focus:outline-none"/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 uppercase font-bold mb-1">Payment Terms</label>
                  <select value={poPayment} onChange={e => setPOPayment(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-[#D4AF37]/50 focus:outline-none">
                    <option>LC at Sight</option>
                    <option>LC 30 Days</option>
                    <option>LC 60 Days</option>
                    <option>Advance</option>
                    <option>TT in Advance</option>
                    <option>Open Account</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 uppercase font-bold mb-1">ETA</label>
                  <input value={poETA} onChange={e => setPOETA(e.target.value)} placeholder="ASAP"
                    className="w-full bg-slate-800 border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-[#D4AF37]/50 focus:outline-none"/>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 uppercase font-bold mb-1">Shipping Method</label>
                <select value={poShipping} onChange={e => setPOShipping(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-[#D4AF37]/50 focus:outline-none">
                  <option>CIF by Air - Muscat Airport</option>
                  <option>CIF by Sea - Sohar Port</option>
                  <option>By Air</option>
                  <option>By Sea</option>
                  <option>FOB</option>
                  <option>Ex-Works</option>
                </select>
              </div>
              {poQty && poUnitPrice && (
                <div className="p-3 bg-[#D4AF37]/10 rounded border border-[#D4AF37]/30 flex justify-between">
                  <span className="text-slate-300 text-sm font-bold">Total Value:</span>
                  <span className="text-[#D4AF37] font-bold">${(Number(poQty) * Number(poUnitPrice)).toLocaleString('en-US', {minimumFractionDigits: 2})} USD</span>
                </div>
              )}
            </div>
            <div className="p-5 border-t border-white/10 flex justify-end gap-3">
              <button onClick={() => setIsPOModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white font-bold text-sm">Cancel</button>
              <button
                disabled={!poVendor || !poQty || !poUnitPrice}
                onClick={() => generatePODocument(poItem, poVendor, poQty, poUnitPrice, poPayment, poShipping, poETA)}
                className="luxury-gradient px-6 py-2 rounded-lg text-slate-950 font-bold text-sm disabled:opacity-40 flex items-center gap-2"
              >
                <Download size={14}/> Download PO
              </button>
            </div>
          </div>
        </div>
      )}

      
      {/* RESPONSIVE SIDEBAR */}
      {/* Desktop persistent sidebar */}
      <aside className="hidden md:flex w-60 fixed inset-y-0 left-0 z-30 flex-col bg-slate-950 border-r border-[#D4AF37]/20">
        <div className="p-4 sm:p-8 h-full flex flex-col">
          <div className="flex justify-between items-center mb-6 sm:mb-10">
            <div className="flex items-center gap-3">
              <div className="luxury-gradient w-10 h-10 rounded-lg flex items-center justify-center shadow-lg shadow-[#D4AF37]/20">
                <Activity className="text-slate-950" size={24} />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-none">ALWAJAR</h1>
                <span className="text-[9px] sm:text-[10px] font-bold text-[#D4AF37] tracking-[0.2em] uppercase">Pharma ERP</span>
              </div>
            </div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-500 hover:text-white">
              <X size={20} />
            </button>
          </div>

          <nav className="space-y-1 overflow-y-auto custom-scrollbar flex-1 pr-2">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'production', label: 'Manufacturing', icon: Factory },
              { id: 'inventory', label: 'Inventory', icon: Boxes },
              { id: 'sales', label: 'Sales Orders', icon: BadgeDollarSign },
              { id: 'procurement', label: 'Procurement', icon: Truck },
              { id: 'accounting', label: 'Accounting', icon: Wallet },
              { id: 'hr', label: 'HR & Admin', icon: Users },
              { id: 'rd', label: 'R&D Lab', icon: Beaker },
              { id: 'industrial', label: 'Industrial Studio', icon: DraftingCompass },
              { id: 'bd', label: 'Business Dev', icon: Globe },
              { id: 'samples', label: 'Sample Status', icon: PackageSearch },
              { id: 'costing', label: 'Sales vs Cost', icon: Calculator },
              { id: 'ai', label: 'AI Command', icon: BrainCircuit },
              { id: 'history', label: 'Audit History', icon: History },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as any);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all duration-200 ${
                  activeTab === item.id ? 'bg-[#D4AF37] text-slate-950 font-bold shadow-lg' : 'text-slate-500 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon size={18} />
                <span className="text-xs sm:text-sm">{item.label}</span>
                {activeTab === item.id && <ChevronRight size={14} className="ml-auto" />}
              </button>
            ))}
          </nav>
          
          <div className="pt-4 mt-4 border-t border-white/10">
              <button 
                  onClick={() => setIsSettingsOpen(true)}
                  className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
              >
                  <Settings size={18}/>
                  <span className="text-xs sm:text-sm font-bold">Settings & API</span>
              </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay sidebar */}
      <aside className={`md:hidden fixed inset-y-0 left-0 z-50 w-72 bg-slate-950 border-r border-[#D4AF37]/20 flex flex-col transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 h-full flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="luxury-gradient w-9 h-9 rounded-lg flex items-center justify-center"><Activity className="text-slate-950" size={20}/></div>
              <div><h1 className="text-sm font-bold text-white leading-none">AL WAJER</h1><span className="text-[9px] font-bold text-[#D4AF37] tracking-[0.2em] uppercase">Pharma ERP</span></div>
            </div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-500 hover:text-white"><X size={20}/></button>
          </div>
          <nav className="space-y-0.5 overflow-y-auto custom-scrollbar flex-1">
            {[{id:'dashboard',label:'Dashboard',icon:LayoutDashboard},{id:'production',label:'Manufacturing',icon:Factory},{id:'inventory',label:'Inventory',icon:Boxes},{id:'sales',label:'Sales Orders',icon:BadgeDollarSign},{id:'procurement',label:'Procurement',icon:Truck},{id:'accounting',label:'Accounting',icon:Wallet},{id:'hr',label:'HR & Admin',icon:Users},{id:'rd',label:'R&D Lab',icon:Beaker},{id:'industrial',label:'Industrial Studio',icon:DraftingCompass},{id:'bd',label:'Business Dev',icon:Globe},{id:'samples',label:'Sample Status',icon:PackageSearch},{id:'costing',label:'Sales vs Cost',icon:Calculator},{id:'ai',label:'AI Command',icon:BrainCircuit},{id:'history',label:'Audit History',icon:History}].map(item=>(
              <button key={item.id}
              onClick={(e) => { setActiveTab(item.id as any); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab===item.id?'bg-[#D4AF37] text-slate-950 font-bold':'text-slate-500 hover:bg-white/5 hover:text-white'}`}>
                <item.icon size={18}/><span className="text-sm">{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="pt-4 mt-4 border-t border-white/10">
            <button onClick={()=>{setIsSettingsOpen(true);setIsMobileMenuOpen(false);}} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5"><Settings size={18}/><span className="text-sm font-bold">Settings & API</span></button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col bg-[#020617] min-h-screen md:ml-60">
        {/* RESPONSIVE HEADER */}
        <header className="sticky top-0 h-16 sm:h-20 bg-slate-950/80 backdrop-blur-md border-b border-white/5 px-4 sm:px-8 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white -ml-2"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight truncate">
              {activeTab === 'history' ? 'AUDIT HISTORY' : activeTab.toUpperCase() + ' HUB'}
            </h1>
            <div className="hidden sm:flex items-center gap-1.5 ml-4 px-2 py-1 rounded-full bg-slate-900 border border-white/5">
              <div className={`w-1.5 h-1.5 rounded-full ${dbStatus === 'connected' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`} />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                {dbStatus === 'connected' ? 'Live DB' : 'Offline'}
              </span>
            </div>
          </div>
          <button onClick={handleGlobalAction} className="luxury-gradient px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-slate-950 text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 shrink-0 ml-2">
            <Upload size={16} className="sm:w-[18px] sm:h-[18px]" />
            <span className="hidden sm:inline">GLOBAL SYNC</span>
            <span className="sm:hidden">SYNC</span>
          </button>
          <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'global')} />
        </header>

        {/* RESPONSIVE CONTENT AREA */}
        <div className="p-4 sm:p-6 lg:p-8">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'production' && renderProduction()}
          {activeTab === 'inventory' && renderInventory()}
          {activeTab === 'sales' && renderSales()}
          {activeTab === 'procurement' && renderProcurement()}
          {activeTab === 'accounting' && renderAccounting()}
          {activeTab === 'hr' && renderHRAdmin()}
          {activeTab === 'rd' && renderRDLab()}
          {activeTab === 'industrial' && (() => { setActiveTab('ai' as any); setAiCmdTab('industrial'); return null; })()}
          {activeTab === 'brainstorm' && (() => { setActiveTab('ai' as any); setAiCmdTab('brainstorm'); return null; })()}
          {activeTab === 'ai' && renderAIOps()}
          {activeTab === 'bd' && renderBD()}
          {activeTab === 'samples' && renderSamples()}
          {activeTab === 'costing' && renderCalculator()}
          {activeTab === 'history' && renderHistory()}
        </div>
      </main>

      {/* Menu Overlay - closes sidebar when tapping outside */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
