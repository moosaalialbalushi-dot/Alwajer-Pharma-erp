
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { salesData } from './src/data/sales_data';
import { supplyChainData } from './src/data/supply_chain_data';

import React, { useState, useEffect, useCallback, useRef } from 'react';

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
  analyzeOperations, chatWithCOO, optimizeFormulation,
  brainstormSession, quickInsight
} from './geminiService';
import type { ImportDataSchema } from './importSchemas';
import { supabase } from './supabaseClient';
import { exportToCSV } from './exportUtils';
import {
  mapOrderToSupabase, mapOrderFromSupabase,
  mapInventoryToSupabase, mapInventoryFromSupabase,
  mapProductionToSupabase, mapProductionFromSupabase,
  mapExpenseToSupabase, mapExpenseFromSupabase,
  mapEmployeeToSupabase, mapEmployeeFromSupabase,
  mapAuditLogToSupabase,
} from './lib/dbMapper';

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
  const [calcData, setCalcData] = useState({
  product: '', volume: 0, targetPrice: 0,
  rmc: 0, labor: 0, packing: 0,
  logistics: 0, shippingCost: 0, shippingMethod: 'CIF by Air - Muscat Airport'
});
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
  const [activeProvider, setActiveProvider] = useState<'Gemini' | 'Claude' | 'Qwen' | 'NotebookLM'>('Gemini');

  // Per-provider model selection
  const [selectedModels, setSelectedModels] = useState<Record<string, string>>({
    Gemini: 'gemini-2.0-flash',
    Claude: 'claude-sonnet-4-6',
    DeepSeek: 'deepseek-chat',
  });
  const PROVIDER_MODELS: Record<string, { id: string; label: string; note: string }[]> = {
  Gemini: [
    { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', note: 'Fast — default' },
    { id: 'gemini-2.5-pro',   label: 'Gemini 2.5 Pro',   note: 'Deep analysis'  },
  ],
  Claude: [
    { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku',  note: 'Fast'              },
    { id: 'claude-sonnet-4-6',         label: 'Claude Sonnet', note: 'Balanced — default' },
    { id: 'claude-opus-4-6',           label: 'Claude Opus',   note: 'Highest quality'   },
  ],
  Qwen: [
    { id: 'qwen-turbo', label: 'Qwen Turbo', note: 'Fast & free'     },
    { id: 'qwen-plus',  label: 'Qwen Plus',  note: 'Balanced default' },
    { id: 'qwen-max',   label: 'Qwen Max',   note: 'Highest quality'  },
  ],
};

  // ── Helper: safe localStorage write ──
  const saveToLocalStorage = (key: string, value: any) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  };

  // ── UI / Navigation State ──
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [dbStatus, setDbStatus] = useState<'connected' | 'disconnected'>('connected');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [insights, setInsights] = useState<COOInsight[]>([]);
  const [chatHistory, setChatHistory] = useState<{role: string; text: string}[]>([]);
  const [chatMessage, setChatMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  // ── Upload Progress State ──
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    isUploading: false, fileName: '', progress: 0, status: 'uploading', message: ''
  });
  const [fileAnalysisLog, setFileAnalysisLog] = useState<FileAnalysisResult[]>([]);

  // ── Industrial Studio State ──
  const [industrialChat, setIndustrialChat] = useState<ChatMessage[]>(() => {
    try { const s = localStorage.getItem('erp_industrial_chat'); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [industrialInput, setIndustrialInput] = useState('');
  const [pendingIndustrialImage, setPendingIndustrialImage] = useState<string|null>(null);
  const [pendingIndustrialMime, setPendingIndustrialMime] = useState<string|null>(null);
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [imageSize, setImageSize] = useState('1K');

  // ── Brainstorm State ──
  const [brainstormSessions, setBrainstormSessions] = useState<BrainstormSession[]>(() => {
    try { const s = localStorage.getItem('erp_brainstorm_sessions'); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [brainstormInput, setBrainstormInput] = useState('');
  const [currentBrainstormId, setCurrentBrainstormId] = useState<string|null>(null);

  // ── AI Command / Chat Sessions State ──
  const [chatSessions, setChatSessions] = useState<any[]>(() => {
    try { const s = localStorage.getItem('erp_chat_sessions_v2'); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [activeChatId, setActiveChatId] = useState<string|null>(null);
  const [aiCmdHistory, setAiCmdHistory] = useState<any[]>([]);
  const [aiCmdInput, setAiCmdInput] = useState('');
  const [aiCmdTab, setAiCmdTab] = useState<'chat' | 'industrial' | 'brainstorm' | 'skills' | 'triple'>('chat');

  // ── Skills State ──
  const [savedSkills, setSavedSkills] = useState<any[]>(() => {
    try { const s = localStorage.getItem('erp_saved_skills'); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [activeSkillId, setActiveSkillId] = useState<string|null>(null);
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [newSkillData, setNewSkillData] = useState<any>({
    name: '', provider: 'Claude', description: '', prompt: '', category: 'Operations'
  });

  // ── Triple Validation Chain State ──
  const [tripleChainInput, setTripleChainInput] = useState('');
  const [tripleChainLoading, setTripleChainLoading] = useState(false);
  const [tripleChainResult, setTripleChainResult] = useState<any>(null);

  // ── Production State ──
  const [expandedBatchId, setExpandedBatchId] = useState<string|null>(null);

  // ── Inventory State ──
  const [inventoryTab, setInventoryTab] = useState<'raw' | 'packing' | 'spares' | 'finished'>('raw');

  // ── Modal State ──
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'view' | 'edit' | 'add'>('view');
  const [modalData, setModalData] = useState<any>({});
  const [currentSection, setCurrentSection] = useState('');

  // ── Confirmation Dialog State ──
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean; type: 'add' | 'delete'; itemType: string; itemName: string;
    onConfirm: () => void; onCancel: () => void;
  }>({
    isOpen: false, type: 'delete', itemType: '', itemName: '',
    onConfirm: () => {}, onCancel: () => {}
  });

  // ── Purchase Order Modal State ──
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [poItem, setPOItem] = useState<any>(null);
  const [poVendor, setPOVendor] = useState('');
  const [poQty, setPOQty] = useState('');
  const [poUnitPrice, setPOUnitPrice] = useState('');
  const [poPayment, setPOPayment] = useState('LC at Sight');
  const [poShipping, setPOShipping] = useState('CIF by Air - Muscat Airport');
  const [poETA, setPOETA] = useState('ASAP');

  // ── R&D Lab State ──
  const [selectedRD, setSelectedRD] = useState<RDProject|null>(null);
  const [rdSearch, setRdSearch] = useState('');
  const [rdAiReport, setRdAiReport] = useState('');
  const [rdActiveTab, setRdActiveTab] = useState<'formulation' | 'process' | 'compare' | 'spec'>('formulation');
  const [rdModalMode, setRdModalMode] = useState<'addProduct' | 'addIngredient' | 'editIngredient'>('addProduct');
  const [isRdModalOpen, setIsRdModalOpen] = useState(false);
  const [newIngData, setNewIngData] = useState<any>({
    name: '', quantity: 0, unit: 'Kg', rateUSD: 0, role: 'API', supplier: '', grade: '', notes: ''
  });
  const [newProductData, setNewProductData] = useState<any>({
    title: '', productCode: '', dosageForm: 'Capsule', strength: '', therapeuticCategory: '',
    batchSize: 100, batchUnit: 'Kg', loss: 0.02, status: 'Formulation',
    shelfLife: '24 Months', storageCondition: 'Below 25°C',
    qualityStandards: 'BP/USP', regulatoryStatus: 'Dossier Prep', manufacturingProcess: ''
  });
  const [editIngIdx, setEditIngIdx] = useState<number>(0);
  const [compareRD, setCompareRD] = useState<RDProject|null>(null);
  const [rdSpecLoading, setRdSpecLoading] = useState(false);

  // ── Refs ──
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rdFileRef = useRef<HTMLInputElement>(null);
  const bdFileRef = useRef<HTMLInputElement>(null);
  const brainstormFileRef = useRef<HTMLInputElement>(null);
  const industrialFileRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder|null>(null);

  useEffect(() => { saveToLocalStorage('erp_dashboard_widgets', visibleWidgets); }, [visibleWidgets]);
  useEffect(() => { saveToLocalStorage('erp_industrial_chat', industrialChat); }, [industrialChat]);
  useEffect(() => { saveToLocalStorage('erp_brainstorm_sessions', brainstormSessions); }, [brainstormSessions]);
  useEffect(() => { saveToLocalStorage('erp_chat_history', chatHistory); }, [chatHistory]);
  useEffect(() => { saveToLocalStorage('erp_saved_skills', savedSkills); }, [savedSkills]);
  useEffect(() => { saveToLocalStorage('erp_chat_sessions_v2', chatSessions); }, [chatSessions]);
  useEffect(() => { saveToLocalStorage('erp_api_config', apiConfig); }, [apiConfig]);

  // Industrial tab loaded — no special key checks needed (keys are in Vercel env vars)
  useEffect(() => {}, [activeTab]);

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

useEffect(() => {
  const loadFromSupabase = async () => {
    try {
      const [ordersRes, inventoryRes, batchesRes, expensesRes, employeesRes] = await Promise.all([
        supabase.from('orders').select('*'),
        supabase.from('inventory').select('*'),
        supabase.from('production_yields').select('*'),
        supabase.from('expenses').select('*'),
        supabase.from('employees').select('*'),
      ]);

      if (ordersRes.data && ordersRes.data.length > 0) {
        setOrders(ordersRes.data.map(mapOrderFromSupabase));
      }

      if (inventoryRes.data && inventoryRes.data.length > 0) {
        setInventory(inventoryRes.data.map(mapInventoryFromSupabase));
      }

      if (batchesRes.data && batchesRes.data.length > 0) {
        setBatches(batchesRes.data.map(mapProductionFromSupabase));
      }

      if (expensesRes.data && expensesRes.data.length > 0) {
        setExpenses(expensesRes.data.map(mapExpenseFromSupabase));
      }

      if (employeesRes.data && employeesRes.data.length > 0) {
        setEmployees(employeesRes.data.map(mapEmployeeFromSupabase));
      }
    } catch (err) {
      console.error('Failed to load data from Supabase:', err);
    }
  };
  loadFromSupabase();
}, []);

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
    const logEntry = mapAuditLogToSupabase({ action, details });
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
const handleDelete = async (type: string, id: string, name: string) => {
  setConfirmDialog(prev => ({ ...prev, isOpen: false }));

  let previousState;
  let setState: React.Dispatch<React.SetStateAction<any[]>>;
  let table: string;

  switch (type) {
    case 'inventory':
      previousState = inventory;
      setState = setInventory;
      table = 'inventory';
      break;
    case 'production':
      previousState = batches;
      setState = setBatches;
      table = 'production_yields';
      break;
    case 'sales':
      previousState = orders;
      setState = setOrders;
      table = 'orders';
      break;
    case 'accounting':
      previousState = expenses;
      setState = setExpenses;
      table = 'expenses';
      break;
    case 'hr':
      previousState = employees;
      setState = setEmployees;
      table = 'employees';
      break;
    case 'rd':
      previousState = rdProjects;
      setState = setRdProjects;
      table = 'rd_projects';
      break;
    default:
      return;
  }

  setState(prev => prev.filter(item => item.id !== id));

  try {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw error;
    await logAction('DELETE', `Deleted ${type} item: ${name}`);
  } catch (error: any) {
    console.error('Delete failed, rolling back', error);
    setState(previousState);
    setUploadProgress({
      isUploading: false,
      fileName: '',
      progress: 0,
      status: 'error',
      message: `Delete failed: ${error.message}`
    });
    setTimeout(() => setUploadProgress({ isUploading: false, fileName: '', progress: 0, status: 'uploading', message: '' }), 3000);
  }
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

<p class="bold">IN WORDS: - USD &ndash; ${totalWords} Only&#x2F;-</p>

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

  setUploadProgress({
    isUploading: true,
    fileName: file.name,
    progress: 0,
    status: 'uploading',
    message: 'Uploading file...'
  });

  // Helper: read file as base64 (fallback path only)
  const readAsBase64 = (f: File): Promise<{ base64: string; mimeType: string }> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const [meta, base64] = result.split(',');
        const mimeType = meta.match(/:(.*?);/)?.[1] || f.type || 'application/octet-stream';
        resolve({ base64, mimeType });
      };
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });

  // --- Step 1: Try Supabase direct upload (bypasses Vercel 4.5 MB limit) ---
  let fileUrl: string | null = null;
  let base64Fallback: string | null = null;
  let mimeTypeFallback: string = file.type || 'application/octet-stream';

  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 8)}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('formulations')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from('formulations').getPublicUrl(uploadData.path);
    fileUrl = urlData.publicUrl;
  } catch (supabaseErr) {
    console.warn('Supabase upload failed, falling back to base64:', supabaseErr);
    try {
      const { base64, mimeType } = await readAsBase64(file);
      base64Fallback = base64;
      mimeTypeFallback = mimeType;
    } catch (readerErr) {
      console.error('FileReader fallback also failed:', readerErr);
      setUploadProgress({ isUploading: false, fileName: file.name, progress: 0, status: 'error', message: 'Upload failed. Please try again.' });
      setTimeout(() => setUploadProgress({ isUploading: false, fileName: '', progress: 0, status: 'complete', message: '' }), 3000);
      return;
    }
  }

  // --- Step 2: Handle industrial context ---
  if (context === 'industrial') {
    setPendingIndustrialImage(fileUrl ?? base64Fallback ?? '');
    setPendingIndustrialMime(mimeTypeFallback);
    setUploadProgress({ isUploading: false, fileName: '', progress: 0, status: 'complete', message: '' });
    return;
  }

  // --- Step 3: Handle brainstorm context ---
  if (context === 'brainstorm' && currentBrainstormId) {
    const session = brainstormSessions.find(s => s.id === currentBrainstormId);
    if (session) {
      const newMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        text: `Uploaded reference: ${file.name}`,
        timestamp: Date.now()
      };
      const updatedSession = { ...session, messages: [...session.messages, newMsg] };
      setBrainstormSessions(prev => prev.map(s => s.id === currentBrainstormId ? updatedSession : s));
    }
    setUploadProgress({ isUploading: false, fileName: '', progress: 0, status: 'complete', message: '' });
    return;
  }

  // --- Step 4: Run AI analysis ---
  setUploadProgress(prev => ({ ...prev, progress: 50, status: 'processing', message: 'AI Processing Document...' }));
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

    setUploadProgress(prev => ({ ...prev, progress: 75, message: 'AI analyzing content...' }));

    // Use URL if Supabase upload succeeded; otherwise fall back to base64
    const aiInput = fileUrl
      ? (fileUrl + " (Read the document from this URL: " + fileUrl + ")")
      : (base64Fallback ?? '');
    const aiMime = fileUrl ? "text/plain" : mimeTypeFallback;
    const analysis = await analyzeImageOrFile(aiInput, aiMime, prompt);

    setUploadProgress(prev => ({ ...prev, progress: 90, status: 'processing', message: 'Updating database...' }));

    if (analysis && analysis.includes('{')) {
      try {
        const cleanJson = analysis.substring(analysis.indexOf('{'), analysis.lastIndexOf('}') + 1);
        const jsonData = JSON.parse(cleanJson);

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
            for (const item of newItems) {
              await supabase.from('inventory').insert({
                id: item.id, s_no: item.sNo, name: item.name, category: item.category,
                stock: item.stock, required_for_orders: item.requiredForOrders,
                balance_to_purchase: item.balanceToPurchase, unit: item.unit, stock_date: item.stockDate
              });
            }
            await logAction('IMPORT', `AI imported ${newItems.length} inventory items from ${file.name}`);
          }
        }

        if (jsonData.orders && Array.isArray(jsonData.orders)) {
          const newOrders = jsonData.orders.map((order: any) => ({
            id: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            date: order.date || new Date().toISOString().split('T')[0],
            invoiceNo: order.invoiceNo || `AI-${Math.floor(Math.random() * 1000)}`,
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
                id: order.id, invoice_no: order.invoiceNo, customer: order.customer,
                product: order.product, quantity: order.quantity, amount_usd: order.amountUSD,
                status: order.status, date: order.date
              });
            }
            await logAction('IMPORT', `AI imported ${newOrders.length} orders`);
          }
        }

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

    setUploadProgress(prev => ({ ...prev, progress: 100, status: 'complete', message: 'System Synced Successfully!' }));
    setFileAnalysisLog(prev => [{ fileName: file.name, analysis: analysis || "Analysis complete.", timestamp: new Date().toLocaleTimeString() }, ...prev]);
    setTimeout(() => setUploadProgress({ isUploading: false, fileName: '', progress: 0, status: 'complete', message: '' }), 2000);

  } catch (error) {
    console.error("File analysis error:", error);
    setUploadProgress({ isUploading: false, fileName: file.name, progress: 0, status: 'error', message: 'Upload failed. Please try again.' });
    setTimeout(() => setUploadProgress({ isUploading: false, fileName: '', progress: 0, status: 'complete', message: '' }), 3000);
  } finally {
    setIsAiLoading(false);
  }
};

  // Industrial Chat Handler
  const handleIndustrialChat = async () => {
      if (!industrialInput.trim() && !pendingIndustrialImage) return;

      const text = industrialInput;
      const imageToEdit = pendingIndustrialImage;

      setIndustrialInput('');
      setPendingIndustrialImage(null);
      setPendingIndustrialMime(null);

      const userMsg: ChatMessage = {
          id: Date.now().toString(),
          role: 'user',
          text: text || (imageToEdit ? 'Reference image uploaded — awaiting instructions.' : ''),
          image: imageToEdit || undefined,
          timestamp: Date.now()
      };

      setIndustrialChat(prev => [...prev, userMsg]);
      setIsAiLoading(true);

      try {
          const { callAIProxy, extractText } = await import('./aiProxyService');

          // Map UI provider → proxy provider
          const providerMap: Record<string, 'anthropic' | 'gemini' | 'deepseek'> = {
              Claude: 'anthropic',
              Gemini: 'gemini',
              DeepSeek: 'deepseek',
              NotebookLM: 'gemini',
          };
          const apiProvider = providerMap[activeProvider] ?? 'gemini';

          const systemPrompt = `You are an expert Industrial & Pharmaceutical Facility Design Consultant for Al Wajer Pharmaceuticals, Sohar, Oman.
You specialise in:
- GMP-compliant pharmaceutical facility layouts (ISO classifications, clean/dirty zoning, pressure cascades)
- Manufacturing equipment schematics and process flow diagrams
- Packaging line design and warehouse storage optimisation
- FDA 21 CFR Part 211 and SFDA regulatory compliance

When given a design request:
1. Provide a detailed textual layout description with exact zone dimensions and flow paths
2. List all required rooms/areas with their ISO classification if applicable
3. Describe equipment placement, personnel flow (blue arrows), and material flow (red arrows)
4. Flag any regulatory compliance points
5. Suggest optimisations for operational efficiency

Format your response with clear sections: Overview, Zone Layout, Equipment & Flow, Compliance Notes, Recommendations.
Be specific, technical, and precise. Use metric measurements.`;

          const userContent = imageToEdit
              ? `[Reference image attached]\n\n${text || 'Please analyse this reference image and provide design recommendations.'}`
              : `Design Request (${aspectRatio}, ${imageSize} detail level):\n\n${text}`;

          const data = await callAIProxy({
              provider: apiProvider,
              system: systemPrompt,
              messages: [{ role: 'user', content: userContent }],
              maxTokens: 2048,
          });

          const response = extractText(data, apiProvider);

          setIndustrialChat(prev => [...prev, {
              id: Date.now().toString(),
              role: 'model',
              text: response || 'No design response received.',
              timestamp: Date.now()
          }]);

      } catch (error: any) {
          setIndustrialChat(prev => [...prev, {
              id: Date.now().toString(),
              role: 'model',
              text: `⚠️ Design consultation failed: ${error?.message || 'Unknown error'}.\n\nCheck that your API keys are set in Vercel → Settings → Environment Variables.`,
              timestamp: Date.now()
          }]);
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
      } catch (error: any) {
          const errMsg: ChatMessage = { id: Date.now().toString(), role: 'model', text: `⚠️ Brainstorm error: ${error?.message || 'Unknown error'}.\n\nCheck that GEMINI_API_KEY is set in Vercel → Settings → Environment Variables.`, timestamp: Date.now() };
          setBrainstormSessions(prev => prev.map(s => s.id === currentBrainstormId ? {
              ...s, messages: [...updatedSession.messages, errMsg]
          } : s));
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
  const safeNum = (val: any) => parseFloat(String(val).replace(/,/g, '')) || 0;
  const batchSize = safeNum(project.batchSize);
  const loss = safeNum(project.loss);
  const ingredients = project.ingredients.map(ing => {
    const quantity = safeNum(ing.quantity);
    const rateUSD = safeNum(ing.rateUSD);
    return { ...ing, quantity, rateUSD, cost: Number((quantity * rateUSD).toFixed(3)) };
  });
  const totalRMC = ingredients.reduce((sum, ing) => sum + ing.cost, 0);
  const totalFinalRMC = batchSize > 0
    ? Number(((totalRMC / batchSize) + loss).toFixed(3))
    : 0;
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
    try {
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
  const uiProvider = activeSkill ? activeSkill.provider : activeProvider; // e.g. 'Claude'

  // Map UI display name → API provider name (edge function canonical names)
  const apiProviderMap: Record<string, string> = {
    Claude: 'anthropic',
    Gemini: 'gemini',
    DeepSeek: 'deepseek',
    NotebookLM: 'gemini',
  };
  const apiProvider = apiProviderMap[uiProvider] || 'gemini';

  const userMsg = {
    role: 'user' as const,
    text: msg,
    provider: uiProvider,
    skillName: activeSkill?.name,
  };

  const currentMessages = chatSessions.find((s: any) => s.id === activeChatId)?.messages || [];
  const updatedMessages = [...currentMessages, userMsg];

  // Auto-title from first user message
  const chatTitle =
    currentMessages.length === 0
      ? msg.substring(0, 40) + (msg.length > 40 ? '...' : '')
      : chatSessions.find((s: any) => s.id === activeChatId)?.title || 'Chat';

  setChatSessions((prev: any) =>
    prev.map((s: any) =>
      s.id === activeChatId
        ? { ...s, messages: updatedMessages, title: chatTitle, provider: uiProvider }
        : s
    )
  );
  setAiCmdHistory(updatedMessages);
  setIsAiLoading(true);

  try {
    let systemPrompt =
      'You are the Al Wajer Pharmaceuticals AI assistant. Be concise, professional, and precise.';

    if (activeSkill) {
      systemPrompt = activeSkill.prompt;
    } else if (uiProvider === 'Claude') {
      systemPrompt =
        'You are the Chief Operations Officer AI for Al Wajer Pharmaceuticals, Sohar, Oman. ' +
        'You specialise in pharmaceutical operations, compliance, production planning, and strategic decisions. ' +
        'Be direct and precise.';
    } else if (uiProvider === 'Gemini') {
      systemPrompt =
        'You are Al Wajer Pharmaceuticals data intelligence engine. ' +
        'Analyse pharmaceutical data, formulations, and market data. Use numbers and specifics.';
    } else if (uiProvider === 'DeepSeek') {
      systemPrompt =
        'You are Al Wajer Pharmaceuticals deep reasoning specialist. ' +
        'Think through problems step-by-step and provide well-structured, logical analysis.';
    } else if (uiProvider === 'NotebookLM') {
      systemPrompt =
        'You are Al Wajer Pharmaceuticals knowledge specialist. ' +
        'Synthesise information into clear narratives and presentation-ready content.';
    }

    // Import updated proxy service functions
    const { callAIProxy, extractText } = await import('./aiProxyService');

    const responseData = await callAIProxy({
      provider: apiProvider,
      system: systemPrompt,
      messages: [{ role: 'user', content: msg }],
      model: selectedModels[uiProvider] ?? undefined,
    });

    const response = extractText(responseData, apiProvider);

    if (activeSkill) {
      setSavedSkills((prev: any) =>
        prev.map((s: any) =>
          s.id === activeSkillId ? { ...s, usageCount: s.usageCount + 1 } : s
        )
      );
    }

    const modelMsg = {
      role: 'model' as const,
      text: response || 'No response received.',
      provider: uiProvider,
      skillName: activeSkill?.name,
    };

    const finalMessages = [...updatedMessages, modelMsg];
    setChatSessions((prev: any) =>
      prev.map((s: any) => (s.id === activeChatId ? { ...s, messages: finalMessages } : s))
    );
    setAiCmdHistory(finalMessages);
  } catch (e: any) {
    // Show a meaningful error for each provider
    const providerLabel =
      uiProvider === 'Claude'
        ? 'Anthropic Claude'
        : uiProvider === 'DeepSeek'
        ? 'DeepSeek'
        : 'Gemini';

    const errMsg = {
      role: 'model' as const,
      text: `⚠️ ${providerLabel} error: ${e?.message || 'Unknown error'}.\n\nTo fix: go to vercel.com → your project → Settings → Environment Variables → add ${uiProvider === 'Claude' ? 'ANTHROPIC_API_KEY' : uiProvider === 'DeepSeek' ? 'DEEPSEEK_API_KEY' : 'GEMINI_API_KEY'} → then click Redeploy.`,
      provider: uiProvider,
    };

    const finalMessages = [...updatedMessages, errMsg];
    setChatSessions((prev: any) =>
      prev.map((s: any) => (s.id === activeChatId ? { ...s, messages: finalMessages } : s))
    );
    setAiCmdHistory(finalMessages);
  }

  setIsAiLoading(false);
};

  const handleTripleChain = async (inputOverride?: string) => {
    const query = (inputOverride || tripleChainInput).trim();
    if (!query || tripleChainLoading) return;
    setTripleChainInput('');
    setTripleChainLoading(true);
    setTripleChainResult(null);
    try {
      const { runTripleValidation } = await import('./tripleValidation');
      const result = await runTripleValidation(query, '', 'pharma');
      setTripleChainResult(result);
    } catch (e: any) {
      setTripleChainResult({ error: e?.message || 'Chain failed. Check all 3 API keys are set in Vercel.' });
    } finally {
      setTripleChainLoading(false);
    }
  };

  const handleOptimizeRD = async () => {
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
  if (modalType === 'add') newItem.id = newItem.id || tempId;

  let previousState, setState, table, payload;
  const section = currentSection;

  if (section === 'inventory') {
    previousState = inventory;
    setState = setInventory;
    table = 'inventory';
    payload = mapInventoryToSupabase(newItem);
  } else if (section === 'production') {
    previousState = batches;
    setState = setBatches;
    table = 'production_yields';
    payload = mapProductionToSupabase({ ...newItem, timestamp: new Date().toISOString() });
  } else if (section === 'sales') {
    previousState = orders;
    setState = setOrders;
    table = 'orders';
    // mapOrderToSupabase handles numeric sanitisation, auto-calc of amountUSD/OMR,
    // AND maps all previously-missing fields (lc_no, s_no, payment_method, etc.)
    payload = mapOrderToSupabase(newItem);
  } else if (section === 'accounting') {
    previousState = expenses;
    setState = setExpenses;
    table = 'expenses';
    payload = mapExpenseToSupabase(newItem);
  } else if (section === 'hr') {
    previousState = employees;
    setState = setEmployees;
    table = 'employees';
    payload = mapEmployeeToSupabase(newItem);
  } else {
    return;
  }

  if (modalType === 'add') {
    setState(prev => [...prev, newItem]);
  } else {
    setState(prev => prev.map(item => item.id === newItem.id ? newItem : item));
  }

  try {
    if (modalType === 'add') {
      const { error } = await supabase.from(table).insert(payload);
      if (error) {
        console.error('[dbMapper] Supabase INSERT failed:', error.message, { table, payload });
        throw new Error(`Database insert error on table "${table}": ${error.message}. Halting retry loop.`);
      }
      await logAction('CREATE', `Created ${section} item: ${newItem.name || newItem.id}`);
    } else {
      const { error } = await supabase.from(table).update(payload).eq('id', newItem.id);
      if (error) {
        console.error('[dbMapper] Supabase UPDATE failed:', error.message, { table, payload });
        throw new Error(`Database update error on table "${table}": ${error.message}. Halting retry loop.`);
      }
      await logAction('UPDATE', `Updated ${section} item: ${newItem.name || newItem.id}`);
    }
  } catch (error: any) {
    console.error('[dbMapper] Save failed, rolling back UI state:', error.message);
    setState(previousState);
    setUploadProgress({
      isUploading: false,
      fileName: '',
      progress: 0,
      status: 'error',
      message: `Save failed: ${error.message}`
    });
    setTimeout(() => setUploadProgress({ isUploading: false, fileName: '', progress: 0, status: 'uploading', message: '' }), 3000);
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
  localStorage.setItem('erp_api_config', JSON.stringify(apiConfig));
  if (apiConfig.supabaseUrl)  localStorage.setItem('erp_supabase_url', apiConfig.supabaseUrl);
  if (apiConfig.supabaseKey)  localStorage.setItem('erp_supabase_key', apiConfig.supabaseKey);
  setIsSettingsOpen(false);
};

  const renderSettingsModal = () => {
  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-[#D4AF37] rounded-xl w-full max-w-lg shadow-2xl gold-glow flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#D4AF37]/10">
          <h3 className="text-xl font-bold text-white uppercase tracking-widest flex items-center gap-2">
            <Settings size={20} /> System Configuration
          </h3>
          <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">

          {/* ── AI Keys — secured in Supabase ── */}
          <div className="space-y-3">
  <h4 className="text-sm font-bold text-white flex items-center gap-2">
    <ShieldCheck size={16} className="text-green-400" /> API Keys — Secured in Vercel
  </h4>
  <p className="text-[11px] text-slate-400 leading-relaxed">
    All API keys are stored as encrypted environment variables in Vercel — never in the browser.
    To update a key, go to your Vercel project dashboard → Settings → Environment Variables.
  </p>
  <div className="grid grid-cols-1 gap-2">
    {['Gemini', 'Claude', 'DeepSeek'].map((provider) => (
      <div key={provider} className="flex items-center justify-between p-3 bg-slate-800/50 border border-white/5 rounded-lg">
        <div className="text-xs font-bold text-white">{provider}</div>
        <span className="text-[10px] font-bold text-green-400 flex items-center gap-1.5">
          <ShieldCheck size={12} /> Secured in Vercel
        </span>
      </div>
    ))}
  </div>
</div>


          {/* ── Database ── */}
          <div className="space-y-3 border-t border-white/5 pt-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <CloudCog size={16} /> Database Connection (Supabase)
            </h4>
            <p className="text-[11px] text-slate-400">
              Configured via Vercel environment variables{' '}
              <span className="font-mono text-slate-300">VITE_SUPABASE_URL</span> and{' '}
              <span className="font-mono text-slate-300">VITE_SUPABASE_ANON_KEY</span>.
            </p>
            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <ShieldCheck size={16} className="text-green-500" />
              <div className="flex-1">
                <div className="text-xs font-bold text-green-400">Live Connection</div>
                <div className="text-[10px] text-slate-400 font-mono truncate">
                  dqsriohrazmlikwjwbot.supabase.co
                </div>
              </div>
              <a
                href="https://supabase.com/dashboard/project/dqsriohrazmlikwjwbot"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-[#D4AF37] underline"
              >
                Dashboard →
              </a>
            </div>
          </div>

          {/* ── NotebookLM ── */}
          <div className="space-y-2 border-t border-white/5 pt-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Database size={16} /> NotebookLM Source ID (optional)
            </h4>
            <div className="relative">
              <Link size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={apiConfig.notebookLmSource}
                onChange={(e) => setApiConfig({ ...apiConfig, notebookLmSource: e.target.value })}
                placeholder="NotebookLM Knowledge Graph ID"
                className="w-full bg-slate-950 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
            <p className="text-[10px] text-slate-500">
              Connect to your custom NotebookLM knowledge source for enhanced context.
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-white/10 flex justify-end gap-3 bg-slate-950">
          <button
            onClick={handleSaveSettings}
            className="luxury-gradient px-6 py-2 rounded-lg text-slate-950 font-bold text-sm"
          >
            Save & Close
          </button>
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
                     <option value="Gemini">Gemini 2.0 Flash</option>
                     <option value="Claude">Claude Sonnet</option>
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
                     <option value="Gemini">Gemini 2.0 Flash</option>
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
  Claude:     'text-orange-400',
  Gemini:     'text-blue-400',
  Qwen:       'text-purple-400',
  NotebookLM: 'text-emerald-400',
};
    const providerBg: Record<string, string> = {
  Claude:     'bg-orange-500/10 border-orange-500/30',
  Gemini:     'bg-blue-500/10 border-blue-500/30',
  Qwen:       'bg-purple-500/10 border-purple-500/30',
  NotebookLM: 'bg-emerald-500/10 border-emerald-500/30',
};

    return (
      <div className="flex flex-col animate-fadeIn pb-6 space-y-4">

        {/* ── HEADER + TAB BAR ── */}
        <div className="flex flex-wrap gap-3 justify-between items-center shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BrainCircuit className="text-[#F4C430]" size={20}/> AI Command Center
          </h2>
          <div className="flex gap-1 bg-slate-900 border border-white/10 rounded-xl p-1">
            {([['chat','💬 Chat'],['industrial','🏭 Industrial'],['brainstorm','⚡ Brainstorm'],['skills','🛠 Skills'],['triple','🔁 Triple']] as const).map(([tab, label]) => (
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
                {(['Claude','Gemini','Qwen','NotebookLM'] as const).map(p => (
  <button key={p} onClick={() => { setActiveProvider(p); setActiveSkillId(null); }}
    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all
      ${activeProvider === p && !activeSkillId ? providerBg[p] + ' ' + providerColors[p] : 'border-transparent text-slate-500 hover:text-white'}`}>
    {p === 'Claude' ? '🤖 Claude' : p === 'Gemini' ? '✨ Gemini' : p === 'Qwen' ? '🌟 Qwen' : '📚 NotebookLM'}
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
              {/* Model selector — shown when a real provider (not NotebookLM) is active */}
              {!activeSkillId && activeProvider !== 'NotebookLM' && PROVIDER_MODELS[activeProvider] && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/30 border border-white/5 rounded-lg shrink-0">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wide">Model:</span>
                  {PROVIDER_MODELS[activeProvider].map(m => (
                    <button key={m.id}
                      onClick={() => setSelectedModels(prev => ({ ...prev, [activeProvider]: m.id }))}
                      className={`px-2.5 py-0.5 rounded text-[10px] font-bold border transition-all flex items-center gap-1
                        ${selectedModels[activeProvider] === m.id
                          ? (activeProvider === 'Claude' ? 'bg-orange-500/15 border-orange-500/40 text-orange-300' : activeProvider === 'Gemini' ? 'bg-blue-500/15 border-blue-500/40 text-blue-300' : 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300')
                          : 'border-white/10 text-slate-500 hover:text-white hover:border-white/20'}`}>
                      {m.label}
                      <span className="text-[9px] opacity-60 font-normal">{m.note}</span>
                    </button>
                  ))}
                </div>
              )}
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
            TAB: TRIPLE VALIDATION
        ══════════════════════════════════════════ */}
        {aiCmdTab === 'triple' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  🔁 Triple Validation Chain
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Gemini initiates → Claude validates → DeepSeek R1 confirms
                </p>
              </div>
              <div className="flex gap-2">
                <div className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded text-[10px] text-blue-400 font-bold">✨ Gemini 2.0 Flash</div>
                <div className="px-2 py-1 bg-orange-500/10 border border-orange-500/20 rounded text-[10px] text-orange-400 font-bold">🤖 Claude Sonnet</div>
                <div className="px-2 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded text-[10px] text-cyan-400 font-bold">🐳 DeepSeek R1</div>
              </div>
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={tripleChainInput}
                onChange={e => setTripleChainInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleTripleChain()}
                placeholder="Enter your query — all 3 AIs will validate the answer..."
                className="flex-1 bg-slate-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                disabled={tripleChainLoading}
              />
              <button
                onClick={() => handleTripleChain()}
                disabled={!tripleChainInput.trim() || tripleChainLoading}
                className="bg-[#D4AF37] hover:bg-[#c4a030] text-slate-950 px-5 py-2.5 rounded-lg font-bold text-sm transition-colors disabled:opacity-40 flex items-center gap-2 shrink-0"
              >
                {tripleChainLoading ? <><Loader2 className="animate-spin" size={14}/> Running chain...</> : <>Run Chain</>}
              </button>
            </div>

            {/* Loading state — show which step is running */}
            {tripleChainLoading && (
              <div className="border border-white/10 rounded-xl p-6 bg-slate-900/50">
                <div className="flex flex-col gap-3">
                  {[
                    { label: 'Step 1 — Gemini 2.0 Flash generating draft...', color: 'text-blue-400' },
                    { label: 'Step 2 — Claude Sonnet validating response...', color: 'text-orange-400' },
                    { label: 'Step 3 — DeepSeek R1 performing final confirmation...', color: 'text-cyan-400' },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Loader2 className={`animate-spin shrink-0 ${s.color}`} size={13}/>
                      <span className={`text-xs ${s.color}`}>{s.label}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-slate-600 mt-4">All 3 calls run server-side in sequence — this takes 15–45 seconds</p>
              </div>
            )}

            {/* Error state */}
            {tripleChainResult?.error && (
              <div className="border border-red-500/30 rounded-xl p-4 bg-red-500/5">
                <p className="text-sm text-red-400 font-bold mb-1">Chain failed</p>
                <p className="text-xs text-red-300">{tripleChainResult.error}</p>
                <p className="text-[10px] text-slate-500 mt-2">Make sure ANTHROPIC_API_KEY, GEMINI_API_KEY, and DEEPSEEK_API_KEY are all set in Vercel → Settings → Environment Variables</p>
              </div>
            )}

            {/* Results — 3 columns */}
            {tripleChainResult && !tripleChainResult.error && (() => {
              const { chain } = tripleChainResult;
              const verdictColors: Record<string, string> = {
                'APPROVED': 'text-green-400 bg-green-500/10 border-green-500/30',
                'APPROVED WITH CORRECTIONS': 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
                'REJECTED': 'text-red-400 bg-red-500/10 border-red-500/30',
                'UNKNOWN': 'text-slate-400 bg-slate-500/10 border-slate-500/30',
              };
              const getVerdict = (text: string) => {
                if (text.includes('VERDICT: APPROVED WITH CORRECTIONS')) return 'APPROVED WITH CORRECTIONS';
                if (text.includes('VERDICT: APPROVED')) return 'APPROVED';
                if (text.includes('VERDICT: REJECTED')) return 'REJECTED';
                return 'UNKNOWN';
              };
              const getFinalAnswer = (text: string) => {
                const idx = text.indexOf('FINAL ANSWER:');
                return idx !== -1 ? text.slice(idx + 13).trim() : text;
              };
              const getConsensus = (text: string) => {
                const t = text.toLowerCase();
                if (t.includes('consensus: yes')) return 'yes';
                if (t.includes('consensus: partial')) return 'partial';
                if (t.includes('consensus: no')) return 'no';
                return 'unknown';
              };
              const verdict = getVerdict(chain.validator.response);
              const consensus = getConsensus(chain.finalValidator.response);
              return (
                <div className="space-y-4">
                  {/* Summary bar */}
                  <div className="flex items-center gap-3 p-3 bg-slate-900/70 border border-white/10 rounded-xl">
                    <div className="flex-1">
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Query</p>
                      <p className="text-sm text-white mt-0.5 truncate">{tripleChainResult.query}</p>
                    </div>
                    <div className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold shrink-0 ${verdictColors[verdict] || verdictColors['UNKNOWN']}`}>
                      {verdict}
                    </div>
                    <div className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold shrink-0 ${consensus === 'yes' ? 'text-green-400 bg-green-500/10 border-green-500/30' : consensus === 'partial' ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' : 'text-slate-400 bg-slate-500/10 border-slate-500/30'}`}>
                      Consensus: {consensus}
                    </div>
                  </div>

                  {/* Three response panels */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                    {/* Initiator */}
                    <div className="border border-blue-500/20 rounded-xl bg-slate-900/50 flex flex-col overflow-hidden">
                      <div className="px-3 py-2 bg-blue-500/10 border-b border-blue-500/20 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0"/>
                        <span className="text-[11px] font-bold text-blue-300">Step 1 — Initiator</span>
                        <span className="text-[9px] text-blue-500 ml-auto">{chain.initiator.provider}</span>
                      </div>
                      <div className="p-3 flex-1 overflow-y-auto max-h-72 custom-scrollbar">
                        <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">{chain.initiator.response}</p>
                      </div>
                    </div>

                    {/* Validator */}
                    <div className="border border-orange-500/20 rounded-xl bg-slate-900/50 flex flex-col overflow-hidden">
                      <div className="px-3 py-2 bg-orange-500/10 border-b border-orange-500/20 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-orange-400 shrink-0"/>
                        <span className="text-[11px] font-bold text-orange-300">Step 2 — Validator</span>
                        <span className="text-[9px] text-orange-500 ml-auto">{chain.validator.provider}</span>
                      </div>
                      <div className="p-3 flex-1 overflow-y-auto max-h-72 custom-scrollbar">
                        <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">{chain.validator.response}</p>
                      </div>
                    </div>

                    {/* Final validator */}
                    <div className="border border-cyan-500/20 rounded-xl bg-slate-900/50 flex flex-col overflow-hidden">
                      <div className="px-3 py-2 bg-cyan-500/10 border-b border-cyan-500/20 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-cyan-400 shrink-0"/>
                        <span className="text-[11px] font-bold text-cyan-300">Step 3 — Final validator</span>
                        <span className="text-[9px] text-cyan-500 ml-auto">{chain.finalValidator.provider}</span>
                      </div>
                      <div className="p-3 flex-1 overflow-y-auto max-h-72 custom-scrollbar">
                        <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">{chain.finalValidator.response}</p>
                      </div>
                    </div>
                  </div>

                  {/* Final answer callout */}
                  <div className="border border-[#D4AF37]/40 rounded-xl bg-[#D4AF37]/5 p-4">
                    <p className="text-[10px] text-[#D4AF37] uppercase font-bold tracking-wide mb-2">Confirmed final answer</p>
                    <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">{getFinalAnswer(chain.finalValidator.response)}</p>
                    <button
                      onClick={() => navigator.clipboard?.writeText(getFinalAnswer(chain.finalValidator.response))}
                      className="mt-3 text-[10px] text-[#D4AF37] hover:text-white border border-[#D4AF37]/30 hover:border-[#D4AF37] rounded px-3 py-1 transition-colors"
                    >
                      Copy answer
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

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
                  <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">AI Provider *</label>
                  <div className="grid grid-cols-2 gap-2">
{(['Claude','Gemini','Qwen','NotebookLM'] as const).map(p => (
                      <button key={p}
                        onClick={() => setNewSkillData((prev: any) => ({...prev, provider: p}))}
                        className={`py-2.5 text-xs font-bold rounded-lg border transition-all text-center
                          ${newSkillData.provider === p
                            ? providerBg[p] + ' ' + providerColors[p]
                            : 'border-white/10 text-slate-500 hover:text-white'}`}>
                        {p === 'Claude' ? '🤖 Claude' : p === 'Gemini' ? '✨ Gemini' : p === 'Qwen' ? '🌟 Qwen' : '📚 NotebookLM'}
                      </button>
                    ))}
                  </div>
                    <p className="text-[10px] text-slate-500 mt-1.5">
                      {newSkillData.provider === 'Claude'
                        ? '🤖 Best for: Operations decisions, compliance, strategic analysis, writing'
                        : newSkillData.provider === 'Gemini'
                        ? '✨ Best for: Formulation data, market research, numerical analysis'
                        : newSkillData.provider === 'Qwen'
                        ? '🌟 Best for: Fast responses, general tasks, free tier available'
                        : '📚 Best for: Presentations, knowledge synthesis'}
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
  <header className="sticky top-0 h-16 sm:h-20 bg-slate-950/80 backdrop-blur-md border-b border-white/5 px-4 sm:px-8 flex items-center justify-between z-10 shrink-0">
    {/* RESPONSIVE HEADER */}
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
  <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
    {activeTab === 'dashboard' && renderDashboard()}
    {activeTab === 'production' && renderProduction()}
    {activeTab === 'inventory' && renderInventory()}
    {activeTab === 'sales' && renderSales()}
    {activeTab === 'procurement' && renderProcurement()}
    {activeTab === 'accounting' && renderAccounting()}
    {activeTab === 'hr' && renderHRAdmin()}
    {activeTab === 'rd' && renderRDLab()}
    {activeTab === 'industrial' && renderIndustrialStudio()}
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
