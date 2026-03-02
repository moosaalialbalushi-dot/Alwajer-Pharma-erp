import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Activity, Package, ShoppingCart, Truck, MessageSquare, Upload, AlertTriangle, ChevronRight, 
  Send, Loader2, Search, CheckCircle2, Beaker, Zap, ChevronDown, ChevronLeft, LineChart, Calendar, 
  BarChart3, Globe, PackageSearch, Star, Menu, X, Factory, Boxes, BadgeDollarSign, 
  AlertCircle, Eye, Edit2, Plus, BrainCircuit, Lightbulb, DraftingCompass, Image as ImageIcon, 
  Settings, Trash2, ExternalLink, Save, Database, Wallet, Users, Calculator, Briefcase, FileSpreadsheet, FileText, Layers, PenTool, Download, LayoutDashboard, Grip, CheckSquare, Square, Paperclip, History, MoreVertical, FileDown, FolderOpen, RefreshCw, Mic, MicOff, Bolt, Wand2, Link, ShieldCheck, Key, CloudCog
} from 'lucide-react';
import { 
  Batch, InventoryItem, Order, Vendor, VendorProduct, Customer, SalesOrder, CustomerOrderLine, COOInsight, RDProject, BDLead, SampleStatus, 
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
  { id: 'V-001', name: 'Astra Biotech API', category: 'API', rating: 4.8, status: 'Verified', country: 'Germany', contactPerson: 'Hans Müller', email: 'sales@astrabiotech.de', paymentTerms: 'LC at Sight', leadTimeDays: 45,
    products: [
      { id: 'VP-001', name: 'Esomeprazole Magnesium Trihydrate', grade: 'USP', unitPrice: 48, currency: 'USD', unit: 'kg', minOrderQty: 25 },
      { id: 'VP-002', name: 'Omeprazole Powder', grade: 'BP', unitPrice: 32, currency: 'USD', unit: 'kg', minOrderQty: 50 },
    ]},
  { id: 'V-002', name: 'Luzhou Chemicals', category: 'Excipient', rating: 4.2, status: 'Audit Pending', country: 'China', contactPerson: 'Li Wei', paymentTerms: 'TT in Advance', leadTimeDays: 30,
    products: [
      { id: 'VP-003', name: 'NPS 20/24', grade: 'BP', unitPrice: 2.05, currency: 'USD', unit: 'kg', minOrderQty: 200 },
      { id: 'VP-004', name: 'HPMC E5', grade: 'USP', unitPrice: 7.25, currency: 'USD', unit: 'kg', minOrderQty: 100 },
      { id: 'VP-005', name: 'Talcum', grade: 'BP', unitPrice: 1.20, currency: 'USD', unit: 'kg', minOrderQty: 500 },
    ]},
];

const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'C-001', name: 'Gulf Medical Supplies', country: 'UAE', contactPerson: 'Ahmed Al Mansouri', email: 'orders@gulfmedical.ae', paymentTerms: 'LC at Sight', shippingMethod: 'By Air' },
  { id: 'C-002', name: 'Kuwait Pharma Dist.', country: 'Kuwait', contactPerson: 'Nasser Al Sabah', email: 'procurement@kpd.kw', paymentTerms: 'LC 30 Days', shippingMethod: 'By Sea' },
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
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);

  // Vendor management modal state
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [vendorModalMode, setVendorModalMode] = useState<'add'|'edit'|'view'>('add');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [newVendorData, setNewVendorData] = useState<any>({ name:'', category:'API', rating:5, status:'Verified', country:'', contactPerson:'', email:'', phone:'', address:'', paymentTerms:'LC at Sight', leadTimeDays:30, notes:'', products:[] });
  const [newVendorProduct, setNewVendorProduct] = useState<any>({ name:'', grade:'', unitPrice:0, currency:'USD', unit:'kg', minOrderQty:0 });

  // Sales order modal state
  const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);
  const [salesModalMode, setSalesModalMode] = useState<'add'|'edit'|'view'>('add');
  const [selectedSalesOrder, setSelectedSalesOrder] = useState<SalesOrder | null>(null);
  const [newSalesOrder, setNewSalesOrder] = useState<any>({ customer:'', country:'', paymentMethod:'LC at Sight', shippingMethod:'By Sea', status:'Pending', lines:[], lcNo:'', remarks:'' });
  const [newSalesLine, setNewSalesLine] = useState<any>({ product:'', quantity:0, unit:'kg', unitRateUSD:0 });

  // Procurement tab state
  const [procTab, setProcTab] = useState<'shortages'|'vendors'|'po'>('vendors');
  const [bdLeads] = useState<BDLead[]>(INITIAL_BD);
  const [samples] = useState<SampleStatus[]>(INITIAL_SAMPLES);
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
  const [activeProvider, setActiveProvider] = useState<'Gemini' | 'Claude' | 'NotebookLM'>('Gemini');

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
    try { const s = localStorage.getItem('erp_saved_skills'); return s ? JSON.parse(s) : [
      { id:'SK-001', name:'Operations Brief', provider:'Claude', description:'Daily operational summary with risks flagged', prompt:'You are the COO of Al Wajer Pharmaceuticals. Analyze current operations and provide a concise executive brief covering: production status, inventory alerts, financial position, and top 3 risks. Be direct and precise.', category:'Operations', usageCount:0, createdAt:'2026-02-27' },
      { id:'SK-002', name:'Formulation Optimizer', provider:'Gemini', description:'Optimize pharmaceutical formulations for cost and quality', prompt:'You are a Senior Pharmaceutical Formulation Scientist. When given formulation data, analyze ingredient ratios, suggest cost-reducing substitutions, flag compatibility issues, and recommend quality improvements. Always reference BP/USP standards.', category:'R&D', usageCount:0, createdAt:'2026-02-27' },
      { id:'SK-003', name:'Market Entry Analyst', provider:'Claude', description:'Analyze new pharmaceutical market opportunities', prompt:'You are a pharmaceutical market entry strategist for GCC/MENA region. When given a product or market, provide: regulatory pathway, competitive landscape, pricing benchmark, and go-to-market recommendation. Focus on Oman, UAE, Kuwait, Saudi Arabia.', category:'Business Dev', usageCount:0, createdAt:'2026-02-27' },
    ]; } catch { return []; }
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
      alert(`⚡ Quick Insight: ${res}`);
      setIsAiLoading(false);
  };

  // NEW: Log action helper
  const logAction = async (action: string, details: string) => {
    const logEntry = {
      action,
      user: 'Admin',
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


  // ── Number to words ──────────────────────────────────────────────
  const numberToWords = (num: number): string => {
    if (num === 0) return 'Zero';
    const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten',
      'Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
    const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
    const toWords = (n: number): string => {
      if (n === 0) return '';
      if (n < 20) return ones[n] + ' ';
      if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? ' ' + ones[n%10] : '') + ' ';
      if (n < 1000) return ones[Math.floor(n/100)] + ' Hundred ' + toWords(n%100);
      if (n < 100000) return toWords(Math.floor(n/1000)) + 'Thousand ' + toWords(n%1000);
      if (n < 10000000) return toWords(Math.floor(n/100000)) + 'Lakh ' + toWords(n%100000);
      return toWords(Math.floor(n/10000000)) + 'Crore ' + toWords(n%10000000);
    };
    const int = Math.floor(num);
    const dec = Math.round((num - int) * 100);
    let result = toWords(int).trim();
    if (dec > 0) result += ` and ${toWords(dec).trim()} Cents`;
    return result;
  };

  // ── PO Document Generator — matches AL WAJER SEA format exactly ───
  const LOGO_B64 = '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';

  const generatePODocument = (
    items: {name: string, qty: number, unitPrice: number, total: number, supplierCountry: string}[],
    vendorName: string,
    paymentTerm: string,
    shippingMethod: string,
    eta: string,
    customPoNumber?: string
  ) => {
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-GB', { day:'2-digit', month:'2-digit', year:'numeric' });
    const mm = String(today.getMonth()+1).padStart(2,'0');
    const yy = String(today.getFullYear()).slice(-2);
    const poNumber = customPoNumber || `AWP/PO/${mm}-${yy}`;
    const grandTotal = items.reduce((s, i) => s + i.total, 0);
    const totalWords = numberToWords(grandTotal);
    const isAir = shippingMethod.toLowerCase().includes('air');
    const shipVia = isAir ? 'BY AIR\nMUSCAT INTERNATIONAL AIRPORT' : 'BY SEA\nSOHAR SEAPORT';
    const destination = 'Po Box: 98, Postal Code: 327,\nSohar Industrial Area, Sohar.\nSULTANATE OF OMAN';

    const itemRows = items.map((item, idx) => `
      <tr>
        <td style="border:1px solid #000;padding:5px 7px;text-align:center;font-size:9.5pt;vertical-align:top">${idx+1}</td>
        <td style="border:1px solid #000;padding:5px 7px;font-size:9.5pt;vertical-align:top" colspan="3">${item.name}</td>
        <td style="border:1px solid #000;padding:5px 7px;text-align:center;font-size:9.5pt;vertical-align:top">${item.qty.toLocaleString()}</td>
        <td style="border:1px solid #000;padding:5px 7px;text-align:center;font-size:9.5pt;vertical-align:top" colspan="3">${item.unitPrice.toFixed(2)}</td>
        <td style="border:1px solid #000;padding:5px 7px;text-align:right;font-size:9.5pt;font-weight:bold;vertical-align:top">${item.total.toLocaleString('en-US',{minimumFractionDigits:2})}</td>
        <td style="border:1px solid #000;padding:5px 7px;font-size:9.5pt;vertical-align:top" colspan="2">${item.supplierCountry}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Purchase Order — ${poNumber}</title>
<style>
  @page { size: A4; margin: 12mm 10mm 12mm 10mm; }
  body { font-family: Arial, sans-serif; font-size: 10pt; color: #000; margin: 0; padding: 0; }
  table { border-collapse: collapse; }
  .header-outer { display: flex; justify-content: space-between; align-items: center; border: 2px solid #000; padding: 6px 10px; }
  .co-arabic { font-size: 12pt; font-weight: bold; direction: rtl; line-height: 1.6; }
  .co-english { font-size: 10pt; font-weight: bold; text-align: right; line-height: 1.5; }
  .po-title-bar { border: 2px solid #000; border-top: none; text-align: center; font-size: 15pt; font-weight: bold; letter-spacing: 5px; padding: 5px; }
  .main-info { width: 100%; border-collapse: collapse; border: 2px solid #000; border-top: none; }
  .main-info td { padding: 5px 8px; font-size: 9pt; vertical-align: top; }
  .furnish-bar { border: 2px solid #000; border-top: none; padding: 4px 8px; font-size: 9pt; text-align: center; font-style: italic; }
  table.items { width: 100%; border-collapse: collapse; border: 2px solid #000; border-top: none; }
  table.items th { border: 1px solid #000; padding: 5px; font-size: 9pt; font-weight: bold; background: #d9e1f2; text-align: center; }
  table.items td { border: 1px solid #000; padding: 5px; font-size: 9pt; }
  table.shipping-table { width: 100%; border-collapse: collapse; border: 2px solid #000; border-top: none; }
  table.shipping-table th { border: 1px solid #000; padding: 5px; font-size: 9pt; font-weight: bold; background: #d9e1f2; text-align: center; }
  table.shipping-table td { border: 1px solid #000; padding: 6px; font-size: 9pt; text-align: center; font-weight: bold; white-space: pre-line; }
  .sign-table { width: 100%; border-collapse: collapse; border: 2px solid #000; border-top: none; }
  .sign-table td { border: 1px solid #000; padding: 12px 10px; font-size: 9pt; font-weight: bold; min-height: 55px; }
  .page-break { page-break-before: always; margin-top: 20px; }
  .annex-header { border: 2px solid #000; padding: 6px 10px; display: flex; justify-content: space-between; align-items: center; }
  .annex-title { text-align: center; font-size: 12pt; font-weight: bold; text-decoration: underline; margin: 10px 0 5px; }
  .tc-list { padding-left: 22px; margin: 0; }
  .tc-list li { margin-bottom: 5px; font-size: 9.5pt; line-height: 1.5; }
  .tc-note { font-weight: bold; font-size: 9.5pt; margin-top: 10px; text-align: center; }
  .no-print { background:#1e293b; padding:10px; text-align:center; margin-bottom:15px; }
  @media print { .no-print { display:none !important; } }
</style>
</head>
<body>

<div class="no-print">
  <button onclick="window.print()" style="background:#D4AF37;color:#000;border:none;padding:10px 28px;font-weight:bold;font-size:13pt;border-radius:6px;cursor:pointer">
    🖨&nbsp; Print / Save as PDF
  </button>
  <span style="color:#aaa;margin-left:16px;font-size:10pt">Print → Save as PDF for final document</span>
</div>

<!-- ══════════ PAGE 1 ══════════ -->

<!-- HEADER with logo -->
<div class="header-outer">
  <div class="co-arabic">الـوجـر لصنـاعـة الأدويـة ش . م . م</div>
  <img src="data:image/png;base64,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" style="height:65px;object-fit:contain" alt="AL WAJER"/>
  <div class="co-english">
    <b>AL WAJER PHARMACEUTICALS INDUSTRY LLC</b><br>
    Sohar Industrial Area, Sohar, Sultanate of Oman<br>
    Tel: +968 22372677
  </div>
</div>

<!-- PO TITLE -->
<div class="po-title-bar">PURCHASE ORDER</div>

<!-- SUPPLIER + PO INFO -->
<table class="main-info">
  <tr>
    <td style="width:55%;border-right:1px solid #000;vertical-align:top">
      <b>Supplier:</b><br>
      ${vendorName}<br><br>
    </td>
    <td style="vertical-align:top">
      <b>Purchase Order No:</b> ${poNumber}<br>
      <b>Purchase Order Date:</b> ${dateStr}
    </td>
  </tr>
  <tr>
    <td colspan="2" style="border-top:1px solid #000">
      <b>Ship To: AL WAJER PHARMACEUTICALS INDUSTRY LLC</b><br>
      Po Box: 98, Postal Code: 327, Sohar Industrial Area, Sohar, Sultanate Of Oman.<br>
      Email: moosa.ali@alwajerpharma.com | ahmed.idris@alwajerpharma.com<br>
      Office: 22372677 &nbsp;|&nbsp; Mobile: 00968–99354545, 00968-91248158
    </td>
  </tr>
</table>

<!-- FURNISH -->
<div class="furnish-bar">Please furnish the merchandise specified below subject to the conditions on the face hereon and as attached</div>

<!-- ITEMS TABLE -->
<table class="items">
  <thead>
    <tr>
      <th style="width:5%">Item No</th>
      <th colspan="3">Description</th>
      <th style="width:10%">Qty (kgs)</th>
      <th colspan="3">Unit Price in (USD)</th>
      <th style="width:12%">Total Price in (USD)</th>
      <th colspan="2">Supplier/Manufacturer &amp; Country of origin</th>
    </tr>
  </thead>
  <tbody>
    ${itemRows}
    <tr style="font-weight:bold;background:#d9e1f2">
      <td colspan="8" style="border:1px solid #000;padding:5px 7px;text-align:right">TOTAL AMOUNT IN USD</td>
      <td style="border:1px solid #000;padding:5px 7px;text-align:right;font-size:10pt">${grandTotal.toLocaleString('en-US',{minimumFractionDigits:2})}</td>
      <td colspan="2" style="border:1px solid #000;padding:5px 7px"></td>
    </tr>
    <tr>
      <td colspan="11" style="border:1px solid #000;padding:5px 8px;font-size:9.5pt">
        <b>IN WORDS: -</b> USD ${totalWords} ONLY.
      </td>
    </tr>
  </tbody>
</table>

<!-- SHIPPING TABLE -->
<table class="shipping-table">
  <tr>
    <th colspan="2">ETA: MCT</th>
    <th>Ship Via</th>
    <th colspan="4">Destination</th>
    <th colspan="3">Payment Terms</th>
    <th>Form of Payment</th>
  </tr>
  <tr>
    <td colspan="2">${eta || 'ASAP'}</td>
    <td>${shipVia}</td>
    <td colspan="4">${destination}</td>
    <td colspan="3">${paymentTerm}</td>
    <td>LC</td>
  </tr>
</table>

<!-- SIGNATURES -->
<table class="sign-table">
  <tr>
    <td style="width:50%">
      <span style="font-weight:bold;display:block;margin-bottom:40px">Requested By:</span>
      <div style="border-top:1px solid #000;padding-top:3px;font-size:9pt">Name / Signature</div>
    </td>
    <td>
      <span style="font-weight:bold;display:block;margin-bottom:40px">Approved by: PURCHASE MANAGER</span>
      <div style="border-top:1px solid #000;padding-top:3px;font-size:9pt">Name / Signature</div>
    </td>
  </tr>
</table>

<!-- ══════════ PAGE 2 — ANNEXURE I ══════════ -->
<div class="page-break"></div>

<div class="annex-header">
  <div class="co-arabic" style="font-size:11pt">الـوجـر لصنـاعـة الأدويـة ش . م . م</div>
  <img src="data:image/png;base64,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" style="height:55px;object-fit:contain" alt="AL WAJER"/>
  <div class="co-english" style="font-size:9pt">
    <b>AL WAJER PHARMACEUTICALS INDUSTRY LLC</b><br>
    Sohar Industrial Area, Sohar, Sultanate of Oman
  </div>
</div>

<div class="annex-title">ANNEXURE-I</div>
<div style="border:1px solid #000;padding:8px 12px;font-size:9.5pt;margin-top:6px">
  <div style="font-weight:bold;margin-bottom:8px">Terms &amp; Conditions as given below:-</div>
  <ol class="tc-list">
    <li>Required Original Invoice &amp; Packing list.</li>
    <li>Required COA (Certificate of Analysis).</li>
    <li>Required MSDS (Material Safety Data Sheet).</li>
    <li>Required Non Hazardous Certificate.</li>
    <li>Required Original COO (Certificate of Origin).</li>
    <li>Required 4 BL/AWB (1 Original &amp; 3 Copies) must require company stamp backside of the BL.</li>
    <li>All required documents should be couriered immediately after the shipment to avoid demurrage charges.</li>
  </ol>
  <div class="tc-note">*** All Necessary documents must be attested by Chamber of Commerce.</div>
</div>

</body>
</html>`;

    const blob = new Blob([html], {type:'text/html'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AWP-PO-${poNumber.replace(/\//g,'-')}_${vendorName.replace(/\s+/g,'_').substring(0,25)}.html`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    logAction('PO_GENERATED', `PO generated for ${vendorName} — ${items.length} items, $${grandTotal.toLocaleString()}`);
  };


  // ── Sales render ──────────────────────────────────────────────────
  const renderSales = () => {
    const [salesView, setSalesView] = React.useState<'list'|'new'|'detail'>('list');
    const [activeSalesOrder, setActiveSalesOrder] = React.useState<SalesOrder|null>(null);
    const [draft, setDraft] = React.useState<any>({
      customer:'', country:'', paymentMethod:'LC at Sight', shippingMethod:'By Sea',
      status:'Pending', lcNo:'', remarks:'', lines:[] as CustomerOrderLine[]
    });
    const [draftLine, setDraftLine] = React.useState({ product:'', quantity:0, unit:'kg', unitRateUSD:0 });

    const addLine = () => {
      if (!draftLine.product || !draftLine.quantity || !draftLine.unitRateUSD) return;
      const line: CustomerOrderLine = {
        id: `L-${Date.now()}`, product: draftLine.product, quantity: Number(draftLine.quantity),
        unit: draftLine.unit, unitRateUSD: Number(draftLine.unitRateUSD),
        totalUSD: Number(draftLine.quantity) * Number(draftLine.unitRateUSD)
      };
      setDraft((p: any) => ({...p, lines: [...p.lines, line]}));
      setDraftLine({ product:'', quantity:0, unit:'kg', unitRateUSD:0 });
    };

    const saveSalesOrder = () => {
      if (!draft.customer || draft.lines.length === 0) return;
      const totalUSD = draft.lines.reduce((s: number, l: CustomerOrderLine) => s + l.totalUSD, 0);
      const totalQty = draft.lines.reduce((s: number, l: CustomerOrderLine) => s + l.quantity, 0);
      const so: SalesOrder = {
        id: `SO-${Date.now()}`, invoiceNo: `AWP-INV-${Date.now().toString().slice(-5)}`,
        date: new Date().toISOString().split('T')[0],
        customer: draft.customer, country: draft.country,
        paymentMethod: draft.paymentMethod, shippingMethod: draft.shippingMethod,
        status: draft.status, lines: draft.lines,
        totalQtyKg: totalQty, totalUSD, totalOMR: +(totalUSD * 0.385).toFixed(2),
        lcNo: draft.lcNo, remarks: draft.remarks
      };
      setSalesOrders((prev: SalesOrder[]) => [so, ...prev]);
      logAction('CREATE', `Sales order: ${so.customer} — $${totalUSD.toLocaleString()}`);
      setSalesView('list');
      setDraft({ customer:'', country:'', paymentMethod:'LC at Sight', shippingMethod:'By Sea', status:'Pending', lcNo:'', remarks:'', lines:[] });
    };

    const statusColor: Record<string,string> = {
      'Pending':'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
      'Processing':'text-blue-400 bg-blue-400/10 border-blue-400/30',
      'Shipped':'text-cyan-400 bg-cyan-400/10 border-cyan-400/30',
      'Delivered':'text-green-400 bg-green-400/10 border-green-400/30',
      'Cancelled':'text-red-400 bg-red-400/10 border-red-400/30',
    };

    // Generate Sales Invoice HTML
    const generateSalesInvoice = (so: SalesOrder) => {
      const today = new Date();
      const dateStr = today.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
      const totalWords = numberToWords(so.totalUSD);
      const itemRows = so.lines.map((line, idx) => `
        <tr>
          <td style="border:1px solid #000;padding:5px 7px;text-align:center;font-size:9.5pt">${idx+1}</td>
          <td style="border:1px solid #000;padding:5px 7px;font-size:9.5pt" colspan="3">${line.product}</td>
          <td style="border:1px solid #000;padding:5px 7px;text-align:center;font-size:9.5pt">${line.quantity.toLocaleString()} ${line.unit}</td>
          <td style="border:1px solid #000;padding:5px 7px;text-align:right;font-size:9.5pt" colspan="2">USD ${line.unitRateUSD.toFixed(2)}</td>
          <td style="border:1px solid #000;padding:5px 7px;text-align:right;font-size:9.5pt;font-weight:bold" colspan="3">USD ${line.totalUSD.toLocaleString('en-US',{minimumFractionDigits:2})}</td>
        </tr>`).join('');

      const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Sales Order ${so.id}</title>
<style>
  @page{size:A4;margin:12mm 10mm}body{font-family:Arial,sans-serif;font-size:10pt;color:#000;margin:0}
  .no-print{background:#1e293b;padding:10px;text-align:center;margin-bottom:15px}
  @media print{.no-print{display:none!important}}
  table{border-collapse:collapse}
  .hdr{display:flex;justify-content:space-between;align-items:center;border:2px solid #000;padding:8px 12px}
  .title-bar{border:2px solid #000;border-top:none;text-align:center;font-size:14pt;font-weight:bold;letter-spacing:4px;padding:5px}
  .info-table{width:100%;border-collapse:collapse;border:2px solid #000;border-top:none}
  .info-table td{padding:5px 8px;font-size:9pt;vertical-align:top;border:1px solid #ccc}
  .items{width:100%;border-collapse:collapse;border:2px solid #000;border-top:none}
  .items th{border:1px solid #000;padding:5px;font-size:9pt;font-weight:bold;background:#d9e1f2;text-align:center}
  .items td{border:1px solid #000;padding:5px;font-size:9pt}
</style>
</head><body>
<div class="no-print">
  <button onclick="window.print()" style="background:#D4AF37;color:#000;border:none;padding:10px 28px;font-weight:bold;font-size:12pt;border-radius:6px;cursor:pointer">🖨 Print / Save as PDF</button>
</div>
<div class="hdr">
  <div style="font-size:10pt;font-weight:bold;direction:rtl">الـوجـر لصنـاعـة الأدويـة ش . م . م</div>
  <img src="data:image/png;base64,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" style="height:60px;object-fit:contain" alt="AL WAJER"/>
  <div style="text-align:right;font-size:9pt"><b>AL WAJER PHARMACEUTICALS INDUSTRY LLC</b><br>Sohar Industrial Area, Sohar, Oman<br>Tel: +968 22372677</div>
</div>
<div class="title-bar">SALES ORDER CONFIRMATION</div>
<table class="info-table"><tr>
  <td style="width:50%"><b>Customer:</b> ${so.customer}<br><b>Country:</b> ${so.country || '—'}<br><b>SO Number:</b> ${so.id}<br><b>Date:</b> ${so.date}</td>
  <td><b>Payment:</b> ${so.paymentMethod}<br><b>Shipping:</b> ${so.shippingMethod}<br>${so.lcNo ? '<b>LC No:</b> '+so.lcNo : ''}<br><b>Status:</b> ${so.status}</td>
</tr></table>
<table class="items">
  <thead><tr>
    <th style="width:5%">No.</th><th colspan="3">Product Description</th><th>Quantity</th><th colspan="2">Unit Rate (USD)</th><th colspan="3">Total (USD)</th>
  </tr></thead>
  <tbody>
    ${itemRows}
    <tr style="font-weight:bold;background:#d9e1f2">
      <td colspan="4" style="border:1px solid #000;padding:5px 7px;text-align:right;font-size:9.5pt">TOTAL QUANTITY:</td>
      <td style="border:1px solid #000;padding:5px 7px;text-align:center;font-size:9.5pt">${so.totalQtyKg.toLocaleString()} kg</td>
      <td colspan="2" style="border:1px solid #000;padding:5px 7px;text-align:right;font-size:9.5pt">TOTAL AMOUNT:</td>
      <td colspan="3" style="border:1px solid #000;padding:5px 7px;text-align:right;font-size:9.5pt">USD ${so.totalUSD.toLocaleString('en-US',{minimumFractionDigits:2})}</td>
    </tr>
    <tr><td colspan="10" style="border:1px solid #000;padding:5px 8px;font-size:9pt"><b>IN WORDS:</b> USD ${totalWords} ONLY.</td></tr>
  </tbody>
</table>
${so.remarks ? `<div style="border:2px solid #000;border-top:none;padding:6px 10px;font-size:9pt"><b>Remarks:</b> ${so.remarks}</div>` : ''}
<table style="width:100%;border-collapse:collapse;border:2px solid #000;border-top:none;margin-top:0">
  <tr>
    <td style="border:1px solid #000;padding:15px 10px;width:50%;font-size:9pt"><b>Prepared By:</b><br><br><br><div style="border-top:1px solid #000;padding-top:3px">Name / Signature</div></td>
    <td style="border:1px solid #000;padding:15px 10px;font-size:9pt"><b>Authorized By: SALES MANAGER</b><br><br><br><div style="border-top:1px solid #000;padding-top:3px">Name / Signature</div></td>
  </tr>
</table>
</body></html>`;
      const blob = new Blob([html], {type:'text/html'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `SO_${so.id}_${so.customer.replace(/\s+/g,'-')}.html`;
      a.click();
    };

    // LIST VIEW
    if (salesView === 'list') {
      const totalPending = salesOrders.filter(s => s.status === 'Pending').reduce((s,o)=>s+o.totalUSD,0);
      const totalShipped = salesOrders.filter(s => s.status === 'Shipped').reduce((s,o)=>s+o.totalUSD,0);

      return (
        <div className="space-y-5 animate-fadeIn pb-8">
          <div className="flex flex-wrap gap-3 justify-between items-center">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BadgeDollarSign className="text-[#F4C430]" size={20}/> Sales Orders
            </h2>
            <button onClick={() => setSalesView('new')}
              className="luxury-gradient px-4 py-2 rounded-lg text-slate-950 text-sm font-bold flex items-center gap-2">
              <Plus size={15}/> New Bulk Order
            </button>
          </div>

          {/* Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {label:'Total Orders', value:salesOrders.length, color:'text-white'},
              {label:'Pending Value', value:`$${totalPending.toLocaleString()}`, color:'text-yellow-400'},
              {label:'Shipped Value', value:`$${totalShipped.toLocaleString()}`, color:'text-cyan-400'},
              {label:'Total Customers', value:new Set(salesOrders.map(s=>s.customer)).size, color:'text-green-400'},
            ].map(kpi => (
              <div key={kpi.label} className="bg-slate-900/50 border border-white/10 rounded-xl p-4">
                <p className="text-[10px] text-slate-500 uppercase font-bold">{kpi.label}</p>
                <p className={`text-xl font-bold ${kpi.color} mt-1`}>{kpi.value}</p>
              </div>
            ))}
          </div>

          {/* Orders table */}
          {salesOrders.length === 0 ? (
            <div className="bg-slate-900/30 border border-white/10 rounded-xl p-12 text-center">
              <BadgeDollarSign size={40} className="text-slate-700 mx-auto mb-3"/>
              <p className="text-slate-400 font-bold">No sales orders yet</p>
              <p className="text-slate-600 text-sm mt-1">Click "New Bulk Order" to create one</p>
            </div>
          ) : (
            <div className="bg-slate-900/50 border border-white/10 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead><tr className="border-b border-white/10 bg-slate-900">
                  <th className="text-left text-[10px] text-slate-400 uppercase font-bold p-3">Order ID</th>
                  <th className="text-left text-[10px] text-slate-400 uppercase font-bold p-3">Customer</th>
                  <th className="text-left text-[10px] text-slate-400 uppercase font-bold p-3">Date</th>
                  <th className="text-right text-[10px] text-slate-400 uppercase font-bold p-3">Total Qty</th>
                  <th className="text-right text-[10px] text-slate-400 uppercase font-bold p-3">Products</th>
                  <th className="text-right text-[10px] text-slate-400 uppercase font-bold p-3">Value USD</th>
                  <th className="text-center text-[10px] text-slate-400 uppercase font-bold p-3">Status</th>
                  <th className="text-center text-[10px] text-slate-400 uppercase font-bold p-3">Actions</th>
                </tr></thead>
                <tbody>
                  {salesOrders.map(so => (
                    <tr key={so.id} className="border-b border-white/5 hover:bg-white/5 transition-all cursor-pointer"
                      onClick={() => { setActiveSalesOrder(so); setSalesView('detail'); }}>
                      <td className="p-3 text-xs font-mono text-[#D4AF37]">{so.id}</td>
                      <td className="p-3">
                        <p className="text-sm font-bold text-white">{so.customer}</p>
                        <p className="text-[10px] text-slate-500">{so.country}</p>
                      </td>
                      <td className="p-3 text-xs text-slate-400">{so.date}</td>
                      <td className="p-3 text-right text-xs text-white font-mono">{so.totalQtyKg.toLocaleString()} kg</td>
                      <td className="p-3 text-right text-xs text-slate-400">{so.lines?.length || 0} items</td>
                      <td className="p-3 text-right text-sm font-bold text-green-400 font-mono">${so.totalUSD.toLocaleString()}</td>
                      <td className="p-3 text-center">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${statusColor[so.status] || 'text-slate-400 bg-slate-400/10 border-slate-400/30'}`}>
                          {so.status}
                        </span>
                      </td>
                      <td className="p-3 text-center" onClick={e => e.stopPropagation()}>
                        <button onClick={() => generateSalesInvoice(so)}
                          className="text-[10px] bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 px-2 py-1 rounded font-bold">
                          📄 Export
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      );
    }

    // DETAIL VIEW
    if (salesView === 'detail' && activeSalesOrder) {
      const so = activeSalesOrder;
      return (
        <div className="space-y-4 animate-fadeIn pb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setSalesView('list')} className="text-slate-400 hover:text-white"><ChevronLeft size={20}/></button>
            <h2 className="text-xl font-bold text-white">{so.id} — {so.customer}</h2>
            <span className={`ml-2 text-xs font-bold px-3 py-1 rounded-full border ${statusColor[so.status] || ''}`}>{so.status}</span>
            <button onClick={() => generateSalesInvoice(so)}
              className="ml-auto luxury-gradient px-4 py-2 rounded-lg text-slate-950 text-xs font-bold flex items-center gap-1.5">
              <Download size={13}/> Export Order
            </button>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {label:'Total Qty', value:`${so.totalQtyKg.toLocaleString()} kg`},
              {label:'Products', value:so.lines.length},
              {label:'Value USD', value:`$${so.totalUSD.toLocaleString()}`},
              {label:'Value OMR', value:`OMR ${so.totalOMR?.toLocaleString()}`},
            ].map(c => (
              <div key={c.label} className="bg-slate-900/50 border border-white/10 rounded-xl p-3">
                <p className="text-[10px] text-slate-500 uppercase font-bold">{c.label}</p>
                <p className="text-lg font-bold text-[#D4AF37] mt-0.5">{c.value}</p>
              </div>
            ))}
          </div>

          {/* Info row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            {[['Customer',so.customer],['Country',so.country||'—'],['Payment',so.paymentMethod],['Shipping',so.shippingMethod],['LC No',so.lcNo||'—'],['Date',so.date]].map(([k,v]) => (
              <div key={k} className="bg-slate-900/30 border border-white/5 rounded-lg p-3">
                <p className="text-slate-500 text-[10px] uppercase font-bold">{k}</p>
                <p className="text-white font-bold mt-0.5">{v}</p>
              </div>
            ))}
          </div>

          {/* Lines table */}
          <div className="bg-slate-900/50 border border-white/10 rounded-xl overflow-hidden">
            <div className="p-3 border-b border-white/10">
              <p className="text-xs font-bold text-slate-300">Order Lines</p>
            </div>
            <table className="w-full">
              <thead><tr className="bg-slate-900 border-b border-white/10">
                <th className="text-left text-[10px] text-slate-400 uppercase font-bold p-3">#</th>
                <th className="text-left text-[10px] text-slate-400 uppercase font-bold p-3">Product</th>
                <th className="text-right text-[10px] text-slate-400 uppercase font-bold p-3">Quantity</th>
                <th className="text-right text-[10px] text-slate-400 uppercase font-bold p-3">Unit</th>
                <th className="text-right text-[10px] text-slate-400 uppercase font-bold p-3">Unit Rate (USD)</th>
                <th className="text-right text-[10px] text-slate-400 uppercase font-bold p-3">Total (USD)</th>
              </tr></thead>
              <tbody>
                {so.lines.map((line, idx) => (
                  <tr key={line.id} className="border-b border-white/5">
                    <td className="p-3 text-xs text-slate-500">{idx+1}</td>
                    <td className="p-3 text-sm text-white font-bold">{line.product}</td>
                    <td className="p-3 text-right text-sm font-mono text-white">{line.quantity.toLocaleString()}</td>
                    <td className="p-3 text-right text-xs text-slate-400">{line.unit}</td>
                    <td className="p-3 text-right text-sm font-mono text-slate-300">${line.unitRateUSD.toFixed(2)}</td>
                    <td className="p-3 text-right text-sm font-bold font-mono text-green-400">${line.totalUSD.toLocaleString('en-US',{minimumFractionDigits:2})}</td>
                  </tr>
                ))}
                <tr className="bg-[#D4AF37]/10 border-t-2 border-[#D4AF37]/30">
                  <td colSpan={2} className="p-3 text-xs font-bold text-slate-300">TOTALS</td>
                  <td className="p-3 text-right text-sm font-bold font-mono text-white">{so.totalQtyKg.toLocaleString()} kg</td>
                  <td colSpan={2} className="p-3 text-right text-xs font-bold text-slate-400">GRAND TOTAL:</td>
                  <td className="p-3 text-right text-sm font-bold font-mono text-[#D4AF37]">${so.totalUSD.toLocaleString('en-US',{minimumFractionDigits:2})}</td>
                </tr>
              </tbody>
            </table>
          </div>
          {so.remarks && (
            <div className="bg-slate-900/30 border border-white/5 rounded-lg p-3 text-xs text-slate-400">
              <span className="font-bold text-slate-300">Remarks:</span> {so.remarks}
            </div>
          )}
        </div>
      );
    }

    // NEW ORDER VIEW
    const draftTotal = draft.lines.reduce((s: number, l: CustomerOrderLine) => s + l.totalUSD, 0);
    const draftQty = draft.lines.reduce((s: number, l: CustomerOrderLine) => s + l.quantity, 0);

    return (
      <div className="space-y-4 animate-fadeIn pb-8">
        <div className="flex items-center gap-3">
          <button onClick={() => setSalesView('list')} className="text-slate-400 hover:text-white"><ChevronLeft size={20}/></button>
          <h2 className="text-xl font-bold text-white">New Bulk Sales Order</h2>
        </div>

        {/* Customer info */}
        <div className="bg-slate-900/50 border border-white/10 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {label:'Customer Name *', key:'customer', type:'text', placeholder:'Company name'},
            {label:'Country', key:'country', type:'text', placeholder:'e.g. UAE'},
            {label:'LC No / Ref', key:'lcNo', type:'text', placeholder:'LC reference'},
          ].map(f => (
            <div key={f.key}>
              <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">{f.label}</label>
              <input value={draft[f.key]} onChange={e => setDraft((p:any)=>({...p,[f.key]:e.target.value}))}
                placeholder={f.placeholder}
                className="w-full bg-slate-800 border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-[#D4AF37] focus:outline-none"/>
            </div>
          ))}
          {[
            {label:'Payment Method', key:'paymentMethod', options:['LC at Sight','LC 30 Days','LC 60 Days','LC 90 Days','TT in Advance','TT 30 Days','Open Account']},
            {label:'Shipping Method', key:'shippingMethod', options:['By Sea','By Air','By Road','Ex-Works','FOB','CIF']},
            {label:'Status', key:'status', options:['Pending','Processing','Shipped','Delivered','Cancelled']},
          ].map(f => (
            <div key={f.key}>
              <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">{f.label}</label>
              <select value={draft[f.key]} onChange={e => setDraft((p:any)=>({...p,[f.key]:e.target.value}))}
                className="w-full bg-slate-800 border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-[#D4AF37] focus:outline-none">
                {f.options.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
          <div className="sm:col-span-3">
            <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Remarks</label>
            <input value={draft.remarks} onChange={e => setDraft((p:any)=>({...p,remarks:e.target.value}))}
              placeholder="Any special instructions or notes"
              className="w-full bg-slate-800 border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-[#D4AF37] focus:outline-none"/>
          </div>
        </div>

        {/* Add product line */}
        <div className="bg-slate-900/50 border border-[#D4AF37]/20 rounded-xl p-4">
          <p className="text-xs font-bold text-slate-300 mb-3">Add Product Lines</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-end">
            <div className="sm:col-span-2">
              <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Product Name *</label>
              <input value={draftLine.product} onChange={e => setDraftLine(p=>({...p,product:e.target.value}))}
                placeholder="e.g. Esomeprazole 40mg Pellets"
                className="w-full bg-slate-800 border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-[#D4AF37] focus:outline-none"/>
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Quantity *</label>
              <input type="number" value={draftLine.quantity || ''} onChange={e => setDraftLine(p=>({...p,quantity:Number(e.target.value)}))}
                placeholder="0"
                className="w-full bg-slate-800 border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-[#D4AF37] focus:outline-none"/>
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Unit Rate USD *</label>
              <input type="number" value={draftLine.unitRateUSD || ''} onChange={e => setDraftLine(p=>({...p,unitRateUSD:Number(e.target.value)}))}
                placeholder="0.00"
                className="w-full bg-slate-800 border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-[#D4AF37] focus:outline-none"/>
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Unit</label>
              <div className="flex gap-1">
                <select value={draftLine.unit} onChange={e => setDraftLine(p=>({...p,unit:e.target.value}))}
                  className="flex-1 bg-slate-800 border border-white/10 rounded px-2 py-2 text-white text-sm focus:border-[#D4AF37] focus:outline-none">
                  {['kg','g','L','mL','Units','Rolls','Pcs'].map(u=><option key={u}>{u}</option>)}
                </select>
                <button onClick={addLine} disabled={!draftLine.product || !draftLine.quantity || !draftLine.unitRateUSD}
                  className="bg-[#D4AF37] hover:bg-[#c4a030] text-slate-950 px-3 py-2 rounded font-bold text-xs disabled:opacity-40 whitespace-nowrap">
                  + Add
                </button>
              </div>
            </div>
          </div>

          {/* Lines list */}
          {draft.lines.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-white/10">
                  <th className="text-left text-[10px] text-slate-400 uppercase font-bold py-2 pr-3">#</th>
                  <th className="text-left text-[10px] text-slate-400 uppercase font-bold py-2">Product</th>
                  <th className="text-right text-[10px] text-slate-400 uppercase font-bold py-2 px-2">Qty</th>
                  <th className="text-right text-[10px] text-slate-400 uppercase font-bold py-2 px-2">Unit Rate</th>
                  <th className="text-right text-[10px] text-slate-400 uppercase font-bold py-2 px-2">Total USD</th>
                  <th></th>
                </tr></thead>
                <tbody>
                  {draft.lines.map((line: CustomerOrderLine, idx: number) => (
                    <tr key={line.id} className="border-b border-white/5">
                      <td className="py-2 pr-3 text-xs text-slate-500">{idx+1}</td>
                      <td className="py-2 text-sm text-white">{line.product}</td>
                      <td className="py-2 px-2 text-right text-xs font-mono text-slate-300">{line.quantity.toLocaleString()} {line.unit}</td>
                      <td className="py-2 px-2 text-right text-xs font-mono text-slate-300">${line.unitRateUSD.toFixed(2)}</td>
                      <td className="py-2 px-2 text-right text-sm font-bold font-mono text-green-400">${line.totalUSD.toLocaleString('en-US',{minimumFractionDigits:2})}</td>
                      <td className="py-2 pl-2">
                        <button onClick={() => setDraft((p:any)=>({...p,lines:p.lines.filter((_:any,i:number)=>i!==idx)}))}
                          className="text-slate-600 hover:text-red-400"><Trash2 size={13}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Totals summary */}
              <div className="mt-3 p-3 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-lg flex flex-wrap gap-4 justify-end">
                <div className="text-xs text-slate-400">Total Qty: <span className="text-white font-bold font-mono">{draftQty.toLocaleString()} kg</span></div>
                <div className="text-xs text-slate-400">Products: <span className="text-white font-bold">{draft.lines.length}</span></div>
                <div className="text-sm text-[#D4AF37] font-bold">Grand Total: <span className="text-xl font-mono">${draftTotal.toLocaleString('en-US',{minimumFractionDigits:2})}</span> USD</div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <button onClick={() => setSalesView('list')} className="px-5 py-2 text-slate-400 hover:text-white text-sm font-bold">Cancel</button>
          <button onClick={saveSalesOrder} disabled={!draft.customer || draft.lines.length === 0}
            className="luxury-gradient px-6 py-2 rounded-lg text-slate-950 font-bold text-sm disabled:opacity-40">
            Save Order
          </button>
        </div>
      </div>
    );
  };

  // ── Procurement render ─────────────────────────────────────────────
  const renderProcurement = () => {
    const [procView, setProcView] = React.useState<'vendors'|'add-vendor'|'vendor-detail'|'generate-po'>('vendors');
    const [activeVendor, setActiveVendor] = React.useState<Vendor|null>(null);
    const [vDraft, setVDraft] = React.useState<any>({ name:'', category:'API', rating:5, status:'Verified', country:'', contactPerson:'', email:'', phone:'', address:'', paymentTerms:'LC at Sight', leadTimeDays:30, notes:'', products:[] });
    const [pDraft, setPDraft] = React.useState<any>({ name:'', grade:'BP', unitPrice:0, currency:'USD', unit:'kg', minOrderQty:0 });
    const [editingVendor, setEditingVendor] = React.useState<Vendor|null>(null);

    // PO builder
    const [poVendorId, setPoVendorId] = React.useState<string>('');
    const [poLines, setPoLines] = React.useState<{productId:string,name:string,qty:number,unitPrice:number,total:number,supplierCountry:string}[]>([]);
    const [poPaymentTerm, setPoPaymentTerm] = React.useState('LC at Sight');
    const [poShipMethod, setPoShipMethod] = React.useState('By Sea');
    const [poETA, setPoETA] = React.useState('ASAP');
    const [poCustomNumber, setPoCustomNumber] = React.useState('');
    const poVendor = vendors.find(v => v.id === poVendorId);

    const addVendorProduct = () => {
      if (!pDraft.name || !pDraft.unitPrice) return;
      const prod: VendorProduct = { id: `VP-${Date.now()}`, ...pDraft, unitPrice: Number(pDraft.unitPrice), minOrderQty: Number(pDraft.minOrderQty), lastUpdated: new Date().toISOString().split('T')[0] };
      setVDraft((p: any) => ({...p, products: [...(p.products||[]), prod]}));
      setPDraft({ name:'', grade:'BP', unitPrice:0, currency:'USD', unit:'kg', minOrderQty:0 });
    };

    const saveVendor = () => {
      if (!vDraft.name) return;
      if (editingVendor) {
        setVendors(prev => prev.map(v => v.id === editingVendor.id ? {...vDraft, id: editingVendor.id, rating: Number(vDraft.rating)} : v));
        logAction('UPDATE', `Vendor updated: ${vDraft.name}`);
      } else {
        const v: Vendor = { ...vDraft, id: `V-${Date.now()}`, rating: Number(vDraft.rating) };
        setVendors(prev => [v, ...prev]);
        logAction('CREATE', `Vendor registered: ${v.name}`);
      }
      setEditingVendor(null);
      setProcView('vendors');
      setVDraft({ name:'', category:'API', rating:5, status:'Verified', country:'', contactPerson:'', email:'', phone:'', address:'', paymentTerms:'LC at Sight', leadTimeDays:30, notes:'', products:[] });
    };

    const addPoLine = (prod: VendorProduct) => {
      if (poLines.find(l => l.productId === prod.id)) return;
      setPoLines(prev => [...prev, { productId: prod.id, name: prod.name, qty: prod.minOrderQty || 0, unitPrice: prod.unitPrice, total: (prod.minOrderQty||0) * prod.unitPrice, supplierCountry: `${poVendor?.name||''}, ${poVendor?.country||''}` }]);
    };

    const updatePoLine = (productId: string, qty: number, unitPrice?: number) => {
      setPoLines(prev => prev.map(l => {
        if (l.productId !== productId) return l;
        const newQty = qty !== undefined ? qty : l.qty;
        const newPrice = unitPrice !== undefined ? unitPrice : l.unitPrice;
        return {...l, qty: newQty, unitPrice: newPrice, total: newQty * newPrice};
      }));
    };

    const catColor: Record<string,string> = {
      API: 'text-red-400 border-red-400/30 bg-red-400/10',
      Excipient: 'text-blue-400 border-blue-400/30 bg-blue-400/10',
      Packing: 'text-green-400 border-green-400/30 bg-green-400/10',
      Equipment: 'text-purple-400 border-purple-400/30 bg-purple-400/10',
      Trading: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
      Other: 'text-slate-400 border-slate-400/30 bg-slate-400/10',
    };

    const statusBadge: Record<string,string> = {
      'Verified':'text-green-400 border-green-400/30 bg-green-400/10',
      'Audit Pending':'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
      'Blacklisted':'text-red-400 border-red-400/30 bg-red-400/10',
      'New':'text-blue-400 border-blue-400/30 bg-blue-400/10',
    };

    const poGrandTotal = poLines.reduce((s,l)=>s+l.total,0);

    // ── VENDOR LIST VIEW ──
    if (procView === 'vendors') {
      return (
        <div className="space-y-5 animate-fadeIn pb-8">
          <div className="flex flex-wrap gap-3 justify-between items-center">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Truck className="text-[#F4C430]" size={20}/> Vendor Management
            </h2>
            <div className="flex gap-2">
              <button onClick={() => { setPoVendorId(''); setPoLines([]); setProcView('generate-po'); }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                <FileText size={14}/> Generate PO
              </button>
              <button onClick={() => { setEditingVendor(null); setVDraft({ name:'', category:'API', rating:5, status:'Verified', country:'', contactPerson:'', email:'', phone:'', address:'', paymentTerms:'LC at Sight', leadTimeDays:30, notes:'', products:[] }); setProcView('add-vendor'); }}
                className="luxury-gradient px-4 py-2 rounded-lg text-slate-950 text-sm font-bold flex items-center gap-2">
                <Plus size={14}/> Register Vendor
              </button>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {label:'Total Vendors', value:vendors.length, color:'text-white'},
              {label:'Verified', value:vendors.filter(v=>v.status==='Verified').length, color:'text-green-400'},
              {label:'Audit Pending', value:vendors.filter(v=>v.status==='Audit Pending').length, color:'text-yellow-400'},
              {label:'Total Products', value:vendors.reduce((s,v)=>s+(v.products?.length||0),0), color:'text-blue-400'},
            ].map(kpi => (
              <div key={kpi.label} className="bg-slate-900/50 border border-white/10 rounded-xl p-4">
                <p className="text-[10px] text-slate-500 uppercase font-bold">{kpi.label}</p>
                <p className={`text-xl font-bold ${kpi.color} mt-1`}>{kpi.value}</p>
              </div>
            ))}
          </div>

          {/* Vendor cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {vendors.map(vendor => (
              <div key={vendor.id}
                className="bg-slate-900/50 border border-white/10 rounded-xl p-4 hover:border-[#D4AF37]/30 transition-all cursor-pointer group"
                onClick={() => { setActiveVendor(vendor); setProcView('vendor-detail'); }}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-white text-sm">{vendor.name}</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">{vendor.country} · {vendor.contactPerson || '—'}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${catColor[vendor.category] || 'text-slate-400 border-slate-400/30 bg-slate-400/10'}`}>{vendor.category}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${statusBadge[vendor.status] || 'text-slate-400 border-slate-400/30 bg-slate-400/10'}`}>{vendor.status}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                  <span>Payment: <span className="text-slate-300">{vendor.paymentTerms}</span></span>
                  <span>Lead: <span className="text-slate-300">{vendor.leadTimeDays}d</span></span>
                  <span>Rating: <span className="text-[#D4AF37]">{'★'.repeat(Math.round(vendor.rating))}{'☆'.repeat(5-Math.round(vendor.rating))}</span></span>
                </div>
                {/* Product pills */}
                <div className="flex flex-wrap gap-1">
                  {(vendor.products || []).slice(0, 4).map(p => (
                    <span key={p.id} className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-white/5">
                      {p.name} · ${p.unitPrice}/{p.unit}
                    </span>
                  ))}
                  {(vendor.products?.length || 0) > 4 && (
                    <span className="text-[10px] text-slate-600">+{(vendor.products?.length||0)-4} more</span>
                  )}
                </div>
                <div className="mt-3 pt-3 border-t border-white/5 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={e => { e.stopPropagation(); setPoVendorId(vendor.id); setPoLines([]); setProcView('generate-po'); }}
                    className="text-[10px] bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 px-3 py-1 rounded font-bold">
                    📄 Generate PO
                  </button>
                  <button onClick={e => { e.stopPropagation(); setEditingVendor(vendor); setVDraft({...vendor}); setProcView('add-vendor'); }}
                    className="text-[10px] bg-slate-800 text-slate-400 hover:text-white px-3 py-1 rounded font-bold">
                    ✏ Edit
                  </button>
                  <button onClick={e => { e.stopPropagation(); if(confirm(`Delete ${vendor.name}?`)) setVendors(prev=>prev.filter(v=>v.id!==vendor.id)); }}
                    className="text-[10px] text-red-500 hover:text-red-400 px-2 py-1 rounded font-bold ml-auto">
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {vendors.length === 0 && (
              <div className="col-span-2 bg-slate-900/30 border border-dashed border-white/10 rounded-xl p-12 text-center">
                <Truck size={36} className="text-slate-700 mx-auto mb-3"/>
                <p className="text-slate-400 font-bold">No vendors registered yet</p>
                <p className="text-slate-600 text-sm mt-1">Click "Register Vendor" to add your first supplier</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    // ── VENDOR DETAIL VIEW ──
    if (procView === 'vendor-detail' && activeVendor) {
      const v = vendors.find(x => x.id === activeVendor.id) || activeVendor;
      return (
        <div className="space-y-4 animate-fadeIn pb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setProcView('vendors')} className="text-slate-400 hover:text-white"><ChevronLeft size={20}/></button>
            <h2 className="text-xl font-bold text-white">{v.name}</h2>
            <span className={`text-xs font-bold px-2 py-0.5 rounded border ${catColor[v.category]||''}`}>{v.category}</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded border ${statusBadge[v.status]||''}`}>{v.status}</span>
            <div className="ml-auto flex gap-2">
              <button onClick={() => { setPoVendorId(v.id); setPoLines([]); setProcView('generate-po'); }}
                className="luxury-gradient px-4 py-2 rounded-lg text-slate-950 text-xs font-bold flex items-center gap-1.5">
                <FileText size={13}/> Generate PO
              </button>
              <button onClick={() => { setEditingVendor(v); setVDraft({...v}); setProcView('add-vendor'); }}
                className="bg-slate-800 text-slate-300 hover:text-white px-4 py-2 rounded-lg text-xs font-bold">
                Edit
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            {[['Country',v.country||'—'],['Contact',v.contactPerson||'—'],['Email',v.email||'—'],['Phone',v.phone||'—'],['Payment Terms',v.paymentTerms],['Lead Time',`${v.leadTimeDays} days`]].map(([k,val]) => (
              <div key={k} className="bg-slate-900/50 border border-white/5 rounded-lg p-3">
                <p className="text-slate-500 text-[10px] uppercase font-bold">{k}</p>
                <p className="text-white font-bold mt-0.5 break-all">{val}</p>
              </div>
            ))}
          </div>

          <div className="bg-slate-900/50 border border-white/10 rounded-xl overflow-hidden">
            <div className="p-3 border-b border-white/10 flex justify-between items-center">
              <p className="text-xs font-bold text-slate-300">Product Catalog ({v.products?.length || 0} items)</p>
              <button onClick={() => { setPoVendorId(v.id); setPoLines([]); setProcView('generate-po'); }}
                className="text-[10px] text-[#D4AF37] hover:underline font-bold">Generate PO from all →</button>
            </div>
            {(v.products || []).length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">No products registered</div>
            ) : (
              <table className="w-full">
                <thead><tr className="bg-slate-900 border-b border-white/10">
                  {['Product Name','Grade','Unit','Min Order','Unit Price (USD)','Last Updated'].map(h => (
                    <th key={h} className="text-left text-[10px] text-slate-400 uppercase font-bold p-3">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {(v.products||[]).map(p => (
                    <tr key={p.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="p-3 text-sm font-bold text-white">{p.name}</td>
                      <td className="p-3 text-xs text-slate-400">{p.grade}</td>
                      <td className="p-3 text-xs text-slate-400">{p.unit}</td>
                      <td className="p-3 text-xs font-mono text-slate-300">{p.minOrderQty?.toLocaleString()} {p.unit}</td>
                      <td className="p-3 text-sm font-bold text-[#D4AF37] font-mono">${p.unitPrice.toFixed(2)}</td>
                      <td className="p-3 text-xs text-slate-500">{p.lastUpdated || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {v.notes && (
            <div className="bg-slate-900/30 border border-white/5 rounded-lg p-3 text-xs text-slate-400">
              <span className="font-bold text-slate-300">Notes:</span> {v.notes}
            </div>
          )}
        </div>
      );
    }

    // ── ADD / EDIT VENDOR VIEW ──
    if (procView === 'add-vendor') {
      return (
        <div className="space-y-4 animate-fadeIn pb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => { setProcView('vendors'); setEditingVendor(null); }} className="text-slate-400 hover:text-white"><ChevronLeft size={20}/></button>
            <h2 className="text-xl font-bold text-white">{editingVendor ? 'Edit Vendor' : 'Register New Vendor'}</h2>
          </div>

          {/* Vendor info form */}
          <div className="bg-slate-900/50 border border-white/10 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {label:'Vendor Name *', key:'name', placeholder:'Company name'},
              {label:'Country', key:'country', placeholder:'e.g. Germany'},
              {label:'Contact Person', key:'contactPerson', placeholder:'Name'},
              {label:'Email', key:'email', placeholder:'email@domain.com'},
              {label:'Phone', key:'phone', placeholder:'+1234567890'},
              {label:'Address', key:'address', placeholder:'Full address'},
            ].map(f => (
              <div key={f.key}>
                <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">{f.label}</label>
                <input value={vDraft[f.key]||''} onChange={e=>setVDraft((p:any)=>({...p,[f.key]:e.target.value}))}
                  placeholder={f.placeholder}
                  className="w-full bg-slate-800 border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-[#D4AF37] focus:outline-none"/>
              </div>
            ))}
            {[
              {label:'Category', key:'category', options:['API','Excipient','Packing','Equipment','Trading','Other']},
              {label:'Status', key:'status', options:['Verified','Audit Pending','New','Blacklisted']},
              {label:'Payment Terms', key:'paymentTerms', options:['LC at Sight','LC 30 Days','LC 60 Days','LC 90 Days','TT in Advance','TT 30 Days','Open Account']},
            ].map(f => (
              <div key={f.key}>
                <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">{f.label}</label>
                <select value={vDraft[f.key]||''} onChange={e=>setVDraft((p:any)=>({...p,[f.key]:e.target.value}))}
                  className="w-full bg-slate-800 border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-[#D4AF37] focus:outline-none">
                  {f.options.map(o=><option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
            <div>
              <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Lead Time (Days)</label>
              <input type="number" value={vDraft.leadTimeDays||30} onChange={e=>setVDraft((p:any)=>({...p,leadTimeDays:Number(e.target.value)}))}
                className="w-full bg-slate-800 border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-[#D4AF37] focus:outline-none"/>
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Rating (1-5)</label>
              <input type="number" min={1} max={5} step={0.1} value={vDraft.rating||5} onChange={e=>setVDraft((p:any)=>({...p,rating:Number(e.target.value)}))}
                className="w-full bg-slate-800 border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-[#D4AF37] focus:outline-none"/>
            </div>
            <div className="sm:col-span-3">
              <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Notes</label>
              <input value={vDraft.notes||''} onChange={e=>setVDraft((p:any)=>({...p,notes:e.target.value}))}
                placeholder="Any additional notes about this vendor"
                className="w-full bg-slate-800 border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-[#D4AF37] focus:outline-none"/>
            </div>
          </div>

          {/* Product catalog */}
          <div className="bg-slate-900/50 border border-[#D4AF37]/20 rounded-xl p-4">
            <p className="text-xs font-bold text-slate-300 mb-3">Product Catalog</p>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 items-end mb-3">
              <div className="sm:col-span-2">
                <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Product Name *</label>
                <input value={pDraft.name} onChange={e=>setPDraft((p:any)=>({...p,name:e.target.value}))}
                  placeholder="e.g. Esomeprazole Mg"
                  className="w-full bg-slate-800 border border-white/10 rounded px-2 py-2 text-white text-xs focus:border-[#D4AF37] focus:outline-none"/>
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Grade</label>
                <select value={pDraft.grade} onChange={e=>setPDraft((p:any)=>({...p,grade:e.target.value}))}
                  className="w-full bg-slate-800 border border-white/10 rounded px-2 py-2 text-white text-xs focus:border-[#D4AF37] focus:outline-none">
                  {['BP','USP','EP','IP','FCC','Tech','Other'].map(g=><option key={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Unit Price *</label>
                <input type="number" value={pDraft.unitPrice||''} onChange={e=>setPDraft((p:any)=>({...p,unitPrice:Number(e.target.value)}))}
                  placeholder="USD"
                  className="w-full bg-slate-800 border border-white/10 rounded px-2 py-2 text-white text-xs focus:border-[#D4AF37] focus:outline-none"/>
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Unit</label>
                <select value={pDraft.unit} onChange={e=>setPDraft((p:any)=>({...p,unit:e.target.value}))}
                  className="w-full bg-slate-800 border border-white/10 rounded px-2 py-2 text-white text-xs focus:border-[#D4AF37] focus:outline-none">
                  {['kg','g','L','mL','Units','Rolls'].map(u=><option key={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Min Order</label>
                <div className="flex gap-1">
                  <input type="number" value={pDraft.minOrderQty||''} onChange={e=>setPDraft((p:any)=>({...p,minOrderQty:Number(e.target.value)}))}
                    placeholder="0"
                    className="w-full bg-slate-800 border border-white/10 rounded px-2 py-2 text-white text-xs focus:border-[#D4AF37] focus:outline-none"/>
                  <button onClick={addVendorProduct} disabled={!pDraft.name||!pDraft.unitPrice}
                    className="bg-[#D4AF37] text-slate-950 px-2 py-2 rounded text-xs font-bold disabled:opacity-40">+</button>
                </div>
              </div>
            </div>
            {(vDraft.products||[]).length > 0 && (
              <table className="w-full mt-2">
                <thead><tr className="border-b border-white/10">
                  {['Product','Grade','Unit','Min Order','Unit Price USD',''].map(h=>(
                    <th key={h} className="text-left text-[9px] text-slate-500 uppercase font-bold py-1.5 pr-2">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {(vDraft.products||[]).map((p: VendorProduct, idx: number) => (
                    <tr key={p.id} className="border-b border-white/5">
                      <td className="py-1.5 pr-2 text-xs text-white font-bold">{p.name}</td>
                      <td className="py-1.5 pr-2 text-xs text-slate-400">{p.grade}</td>
                      <td className="py-1.5 pr-2 text-xs text-slate-400">{p.unit}</td>
                      <td className="py-1.5 pr-2 text-xs font-mono text-slate-300">{p.minOrderQty?.toLocaleString()}</td>
                      <td className="py-1.5 pr-2 text-xs font-bold font-mono text-[#D4AF37]">${p.unitPrice.toFixed(2)}</td>
                      <td className="py-1.5">
                        <button onClick={()=>setVDraft((prev:any)=>({...prev,products:prev.products.filter((_:any,i:number)=>i!==idx)}))}
                          className="text-slate-600 hover:text-red-400"><Trash2 size={11}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="flex gap-3 justify-end">
            <button onClick={() => { setProcView('vendors'); setEditingVendor(null); }} className="px-5 py-2 text-slate-400 hover:text-white text-sm font-bold">Cancel</button>
            <button onClick={saveVendor} disabled={!vDraft.name}
              className="luxury-gradient px-6 py-2 rounded-lg text-slate-950 font-bold text-sm disabled:opacity-40">
              {editingVendor ? 'Update Vendor' : 'Register Vendor'}
            </button>
          </div>
        </div>
      );
    }

    // ── GENERATE PO VIEW ──
    if (procView === 'generate-po') {
      const today = new Date();
      const mm = String(today.getMonth()+1).padStart(2,'0');
      const yy = String(today.getFullYear()).slice(-2);
      const autoPoNumber = `AWP/PO/${mm}-${yy}`;

      return (
        <div className="space-y-4 animate-fadeIn pb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setProcView('vendors')} className="text-slate-400 hover:text-white"><ChevronLeft size={20}/></button>
            <h2 className="text-xl font-bold text-white">Generate Purchase Order</h2>
          </div>

          {/* Vendor selector */}
          <div className="bg-slate-900/50 border border-white/10 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-3">
              <label className="block text-[10px] text-slate-400 uppercase font-bold mb-2">Select Vendor *</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {vendors.map(v => (
                  <button key={v.id} onClick={() => { setPoVendorId(v.id); setPoLines([]); }}
                    className={`p-3 rounded-lg border text-left transition-all
                      ${poVendorId === v.id ? 'bg-[#D4AF37]/10 border-[#D4AF37] text-white' : 'bg-slate-900 border-white/10 text-slate-400 hover:border-white/30'}`}>
                    <p className="text-sm font-bold truncate">{v.name}</p>
                    <p className="text-[10px] mt-0.5">{v.category} · {v.country}</p>
                    <p className="text-[10px]">{v.products?.length||0} products</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">PO Number</label>
              <input value={poCustomNumber || autoPoNumber}
                onChange={e => setPoCustomNumber(e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-[#D4AF37] focus:outline-none"/>
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Payment Terms</label>
              <select value={poPaymentTerm} onChange={e=>setPoPaymentTerm(e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-[#D4AF37] focus:outline-none">
                {['LC at Sight','LC 30 Days','LC 60 Days','LC 90 Days','TT in Advance','TT 30 Days'].map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Ship Via</label>
              <select value={poShipMethod} onChange={e=>setPoShipMethod(e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-[#D4AF37] focus:outline-none">
                {['By Sea','By Air','By Road','Ex-Works','FOB','CIF'].map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">ETA</label>
              <input value={poETA} onChange={e=>setPoETA(e.target.value)}
                placeholder="e.g. ASAP or 4-6 weeks"
                className="w-full bg-slate-800 border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-[#D4AF37] focus:outline-none"/>
            </div>
          </div>

          {/* Product selection from vendor catalog */}
          {poVendorId && poVendor && (
            <div className="bg-slate-900/50 border border-white/10 rounded-xl overflow-hidden">
              <div className="p-3 border-b border-white/10">
                <p className="text-xs font-bold text-slate-300">{poVendor.name} — Select Products for PO</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Click + to add to PO. Adjust quantities below.</p>
              </div>
              <table className="w-full">
                <thead><tr className="bg-slate-900 border-b border-white/10">
                  {['Product','Grade','Unit Price','Min Qty',''].map(h=>(
                    <th key={h} className="text-left text-[10px] text-slate-400 uppercase font-bold p-3">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {(poVendor.products||[]).map(prod => {
                    const inPO = poLines.some(l=>l.productId===prod.id);
                    return (
                      <tr key={prod.id} className={`border-b border-white/5 ${inPO ? 'bg-[#D4AF37]/5' : 'hover:bg-white/5'}`}>
                        <td className="p-3 text-sm text-white font-bold">{prod.name}</td>
                        <td className="p-3 text-xs text-slate-400">{prod.grade}</td>
                        <td className="p-3 text-sm text-[#D4AF37] font-bold font-mono">${prod.unitPrice.toFixed(2)}/{prod.unit}</td>
                        <td className="p-3 text-xs font-mono text-slate-300">{prod.minOrderQty?.toLocaleString()} {prod.unit}</td>
                        <td className="p-3">
                          {inPO ? (
                            <button onClick={() => setPoLines(prev=>prev.filter(l=>l.productId!==prod.id))}
                              className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/30 px-2 py-1 rounded font-bold">
                              Remove
                            </button>
                          ) : (
                            <button onClick={() => addPoLine(prod)}
                              className="text-[10px] bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 px-2 py-1 rounded font-bold hover:bg-[#D4AF37]/20">
                              + Add to PO
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* PO lines editor */}
          {poLines.length > 0 && (
            <div className="bg-slate-900/50 border border-[#D4AF37]/30 rounded-xl overflow-hidden gold-glow">
              <div className="p-3 border-b border-white/10 flex justify-between items-center">
                <p className="text-xs font-bold text-[#D4AF37]">Purchase Order Lines ({poLines.length} items)</p>
                <p className="text-xs text-slate-400">Grand Total: <span className="text-[#D4AF37] font-bold font-mono">${poGrandTotal.toLocaleString('en-US',{minimumFractionDigits:2})}</span></p>
              </div>
              <table className="w-full">
                <thead><tr className="bg-slate-900 border-b border-white/10">
                  {['#','Material Name','Qty (kg)','Unit Price USD','Total USD','Supplier / Country',''].map(h=>(
                    <th key={h} className="text-left text-[10px] text-slate-400 uppercase font-bold p-3">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {poLines.map((line, idx) => (
                    <tr key={line.productId} className="border-b border-white/5">
                      <td className="p-3 text-xs text-slate-500">{idx+1}</td>
                      <td className="p-3 text-sm font-bold text-white">{line.name}</td>
                      <td className="p-3">
                        <input type="number" value={line.qty||''} onChange={e=>updatePoLine(line.productId, Number(e.target.value))}
                          className="w-24 bg-slate-800 border border-white/10 rounded px-2 py-1 text-white text-xs focus:border-[#D4AF37] focus:outline-none font-mono"/>
                      </td>
                      <td className="p-3">
                        <input type="number" value={line.unitPrice||''} onChange={e=>updatePoLine(line.productId, line.qty, Number(e.target.value))}
                          className="w-20 bg-slate-800 border border-white/10 rounded px-2 py-1 text-white text-xs focus:border-[#D4AF37] focus:outline-none font-mono"/>
                      </td>
                      <td className="p-3 text-sm font-bold font-mono text-green-400">${line.total.toLocaleString('en-US',{minimumFractionDigits:2})}</td>
                      <td className="p-3 text-xs text-slate-400">{line.supplierCountry}</td>
                      <td className="p-3">
                        <button onClick={()=>setPoLines(prev=>prev.filter(l=>l.productId!==line.productId))}
                          className="text-slate-600 hover:text-red-400"><Trash2 size={12}/></button>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-[#D4AF37]/10 border-t border-[#D4AF37]/30">
                    <td colSpan={4} className="p-3 text-right text-xs font-bold text-slate-300">GRAND TOTAL:</td>
                    <td colSpan={3} className="p-3 text-sm font-bold text-[#D4AF37] font-mono">${poGrandTotal.toLocaleString('en-US',{minimumFractionDigits:2})}</td>
                  </tr>
                </tbody>
              </table>
              <div className="p-3 flex justify-end">
                <button
                  onClick={() => generatePODocument(
                    poLines.map(l=>({name:l.name, qty:l.qty, unitPrice:l.unitPrice, total:l.total, supplierCountry:l.supplierCountry})),
                    poVendor?.name || 'Vendor',
                    poPaymentTerm,
                    poShipMethod,
                    poETA,
                    poCustomNumber || autoPoNumber
                  )}
                  disabled={poLines.length === 0}
                  className="luxury-gradient px-6 py-2.5 rounded-lg text-slate-950 font-bold text-sm flex items-center gap-2 disabled:opacity-40">
                  <Download size={15}/> Download Official PO
                </button>
              </div>
            </div>
          )}
          {!poVendorId && (
            <div className="bg-slate-900/30 border border-dashed border-white/10 rounded-xl p-8 text-center text-slate-500 text-sm">
              Select a vendor above to start building the PO
            </div>
          )}
        </div>
      );
    }

    return null;
  };

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

  const renderAIOps = () => {
    const activeSkill = savedSkills.find((s: any) => s.id === activeSkillId);
    const providerColors: Record<string, string> = {
      Claude: 'text-orange-400', Gemini: 'text-blue-400', NotebookLM: 'text-purple-400'
    };
    const providerBg: Record<string, string> = {
      Claude: 'bg-orange-500/10 border-orange-500/30',
      Gemini: 'bg-blue-500/10 border-blue-500/30',
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
                {(['Claude','Gemini','NotebookLM'] as const).map(p => (
                  <button key={p} onClick={() => { setActiveProvider(p); setActiveSkillId(null); }}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all
                      ${activeProvider === p && !activeSkillId ? providerBg[p] + ' ' + providerColors[p] : 'border-transparent text-slate-500 hover:text-white'}`}>
                    {p === 'Claude' ? '🤖 Claude' : p === 'Gemini' ? '✨ Gemini' : '📚 NotebookLM'}
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
                    {(['Claude','Gemini','NotebookLM'] as const).map(p => (
                      <button key={p}
                        onClick={() => setNewSkillData((prev: any) => ({...prev, provider: p}))}
                        className={`py-2.5 text-xs font-bold rounded-lg border transition-all text-center
                          ${newSkillData.provider === p
                            ? providerBg[p] + ' ' + providerColors[p]
                            : 'border-white/10 text-slate-500 hover:text-white'}`}>
                        {p === 'Claude' ? '🤖 Claude' : p === 'Gemini' ? '✨ Gemini' : '📚 NotebookLM'}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1.5">
                    {newSkillData.provider === 'Claude'
                      ? '🤖 Best for: Operations decisions, compliance, strategic analysis, writing'
                      : newSkillData.provider === 'Gemini'
                      ? '✨ Best for: Formulation data, market research, numerical analysis'
                      : '📚 Best for: Executive summaries, presentations, knowledge synthesis'}
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
              <button onClick={() => bdFileRef.current?.click()} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                  <Upload size={14}/> Import Data
              </button>
              <input type="file" ref={bdFileRef} className="hidden" onChange={(e) => handleFileUpload(e, 'bd')} />
              
              <button onClick={handleExportData} className="bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37] px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                  <Download size={14}/> Export Report
              </button>
          </div>
      </div>
      <div className="bg-slate-900/50 border border-[#D4AF37]/30 rounded-xl p-6 gold-glow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bdLeads.map(lead => (
                <div key={lead.id} className="p-4 bg-slate-800/30 rounded border border-white/5 flex justify-between items-center">
                    <div>
                        <p className="text-[#D4AF37] text-xs font-bold uppercase">{lead.targetMarket}</p>
                        <h3 className="text-white font-bold">{lead.opportunity}</h3>
                    </div>
                    <div className="text-right">
                        <div className="text-lg font-bold text-white">{lead.probability}%</div>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
  
  const renderSamples = () => (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <PackageSearch className="text-[#F4C430]" size={20} /> Sample Tracking
          </h2>
      </div>
      <div className="bg-slate-900/50 border border-[#D4AF37]/30 rounded-xl p-6 gold-glow">
          <table className="w-full text-left">
              <thead>
                  <tr className="border-b border-white/5 text-slate-500 text-xs uppercase">
                      <th className="pb-2">Sample ID</th>
                      <th className="pb-2">Product</th>
                      <th className="pb-2">Status</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                  {samples.map(sample => (
                      <tr key={sample.id}>
                          <td className="py-3 text-sm text-[#D4AF37] font-mono">{sample.id}</td>
                          <td className="py-3 text-sm text-white">{sample.product}</td>
                          <td className="py-3">
                              <span className="text-[10px] uppercase bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded border border-purple-500/20">
                                  {sample.status}
                              </span>
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
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-950 border-r border-[#D4AF37]/20 flex flex-col transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
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

      <main className="flex-1 flex flex-col bg-[#020617] min-h-screen">
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
