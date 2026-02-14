
// ... (imports remain the same)
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Activity, Package, ShoppingCart, Truck, MessageSquare, Upload, AlertTriangle, ChevronRight, 
  Send, Loader2, Search, CheckCircle2, Beaker, Zap, ChevronDown, LineChart, Calendar, 
  BarChart3, Globe, PackageSearch, Star, Menu, X, Factory, Boxes, BadgeDollarSign, 
  AlertCircle, Eye, Edit2, Plus, BrainCircuit, Lightbulb, DraftingCompass, Image as ImageIcon, 
  Settings, Trash2, ExternalLink, Save, Database, Wallet, Users, Calculator, Briefcase, FileSpreadsheet, FileText, Layers, PenTool, Download, LayoutDashboard, Grip, CheckSquare, Square, Paperclip, History, MoreVertical, FileDown, FolderOpen, RefreshCw, Mic, MicOff, Bolt, Wand2, Link, ShieldCheck, Key, CloudCog
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
    lastUpdated: '2025-02-12',
    batchSize: 100,
    batchUnit: 'Kg',
    totalRMC: 1684.868,
    loss: 0.02,
    totalFinalRMC: 16.869,
    ingredients: [
      { sNo: '1', name: 'Esomeprazole Magnesium Trihydrate', quantity: 28.5, unit: 'Kg', rateUSD: 46, cost: 1311.00, role: 'API' },
      { sNo: '2', name: 'NPS 20/24', quantity: 43.637, unit: 'Kg', rateUSD: 2.05, cost: 89.46, role: 'Filler' },
      { sNo: '3', name: 'HPMC E5', quantity: 13.12, unit: 'Kg', rateUSD: 7.25, cost: 95.12, role: 'Binder' },
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
  const [vendors] = useState<Vendor[]>(INITIAL_VENDORS);
  const [bdLeads] = useState<BDLead[]>(INITIAL_BD);
  const [samples] = useState<SampleStatus[]>(INITIAL_SAMPLES);
  const [rdProjects, setRdProjects] = useState<RDProject[]>(INITIAL_RD);
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
  const [selectedRD, setSelectedRD] = useState<RDProject | null>(INITIAL_RD[0]);
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

  // Inventory State
  const [inventoryTab, setInventoryTab] = useState<'raw' | 'finished'>('raw');

  // R&D State
  const [rdSearch, setRdSearch] = useState('');

  // File Analysis State
  const [fileAnalysisLog, setFileAnalysisLog] = useState<FileAnalysisResult[]>([]);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'view' | 'edit' | 'add'>('view');
  const [modalData, setModalData] = useState<any>({});
  const [currentSection, setCurrentSection] = useState('');
  
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
        let prompt = "Analyze this file.";
        if (context === 'procurement') prompt = "Analyze this inventory requirement or PO file. Extract: S.No, Material Name, Required Quantity, Present Stock. Return JSON: { \"items\": [ { \"sNo\": \"string\", \"name\": \"string\", \"required\": number, \"stock\": number } ] }";
        if (context === 'rd') prompt = "Analyze this pharmaceutical formulation/costing sheet. Extract: Raw Material, Unit, Per B. Qty, Rate USD. Also identify Batch Size (Output). Return JSON: { \"batchSize\": number, \"ingredients\": [ { \"name\": \"string\", \"unit\": \"string\", \"quantity\": number, \"rateUSD\": number } ] }";
        if (context === 'bd') prompt = "Analyze this Sales Excel file. Extract: Party, Product, Qty (KG), Rate $, Amount $, Status. Return JSON: { \"orders\": [ { \"customer\": \"string\", \"product\": \"string\", \"quantity\": number, \"rateUSD\": number, \"amountUSD\": number, \"status\": \"string\" } ] }";

        // Update progress during analysis
        setUploadProgress(prev => ({
          ...prev,
          progress: 75,
          message: 'Analyzing content...'
        }));

        const analysis = await analyzeImageOrFile(base64Content, mimeType, prompt);
        
        setUploadProgress(prev => ({
          ...prev,
          progress: 100,
          status: 'complete',
          message: 'Analysis complete!'
        }));

        // Process AI analysis into system state if applicable
        if (analysis && analysis.includes('{')) {
          try {
            const jsonData = JSON.parse(analysis.substring(analysis.indexOf('{'), analysis.lastIndexOf('}') + 1));
            
            if (context === 'procurement' && jsonData.items) {
              const newItems = jsonData.items.map((item: any) => ({
                id: `AI-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                sNo: item.sNo || '',
                name: item.name || 'Unknown Item',
                category: 'API',
                stock: item.stock || 0,
                requiredForOrders: item.required || 0,
                balanceToPurchase: (item.required || 0) - (item.stock || 0),
                unit: 'kg',
                stockDate: new Date().toLocaleDateString()
              }));
              setInventory(prev => {
                const updated = [...prev, ...newItems];
                // Sync with DB
                newItems.forEach(async (item: any) => {
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
                });
                return updated;
              });
              await logAction('IMPORT', `AI imported ${newItems.length} items from ${file.name}`);
            }
            
            if (context === 'rd' && jsonData.ingredients) {
              const newProject: RDProject = calculateCosting({
                id: `RD-${Date.now()}`,
                title: `Imported: ${file.name}`,
                status: 'Formulation',
                optimizationScore: 85,
                lastUpdated: new Date().toISOString(),
                batchSize: jsonData.batchSize || 100,
                batchUnit: 'Kg',
                totalRMC: 0,
                loss: 0.02,
                totalFinalRMC: 0,
                ingredients: jsonData.ingredients.map((ing: any) => ({
                  name: ing.name,
                  quantity: ing.quantity,
                  unit: ing.unit || 'Kg',
                  rateUSD: ing.rateUSD || 0,
                  cost: 0,
                  role: 'Other'
                }))
              });
              setRdProjects(prev => [newProject, ...prev]);
              setSelectedRD(newProject);
              // RD projects are currently local only in this mock, but we log it
              await logAction('IMPORT', `AI imported formulation from ${file.name}`);
            }

            if (context === 'global' && jsonData.orders) {
              const newOrders = jsonData.orders.map((order: any) => ({
                id: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                sNo: '',
                date: new Date().toISOString().split('T')[0],
                invoiceNo: 'AUTO-GEN',
                customer: order.customer,
                lcNo: '-',
                country: '-',
                product: order.product,
                quantity: order.quantity,
                rateUSD: order.rateUSD,
                amountUSD: order.amountUSD,
                amountOMR: order.amountUSD * 0.385,
                status: order.status || 'Pending'
              }));
              setOrders(prev => {
                const updated = [...prev, ...newOrders];
                newOrders.forEach(async (order: any) => {
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
                });
                return updated;
              });
              await logAction('IMPORT', `AI imported ${newOrders.length} orders from ${file.name}`);
            }
          } catch (e) {
            console.warn("Could not parse AI response as JSON for state update", e);
          }
        }

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
    
    return {
      ...project,
      ingredients,
      totalRMC: Number(totalRMC.toFixed(3)),
      totalFinalRMC
    };
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
            timestamp: new Date().toISOString()
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
            amount_usd: Number(newItem.amountUSD),
            amount_omr: Number(newItem.amountOMR),
            status: newItem.status,
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
          await supabase.from('expenses').insert(newItem);
          await logAction('CREATE', `Added expense: ${newItem.description}`);
        } else if (currentSection === 'hr') {
          setEmployees(prev => [...prev, newItem]);
          await supabase.from('employees').insert(newItem);
          await logAction('CREATE', `Added employee: ${newItem.name}`);
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
          await supabase.from('expenses').update(newItem).eq('id', newItem.id);
        } else if (currentSection === 'hr') {
          setEmployees(prev => prev.map(e => e.id === newItem.id ? newItem : e));
          await supabase.from('employees').update(newItem).eq('id', newItem.id);
        }
      }
    } catch (err) {
      console.error("Save failed:", err);
      alert("Database error: Check your Supabase configuration.");
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
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
        <div className="bg-slate-900 border border-[#D4AF37] rounded-xl w-full max-w-lg shadow-2xl gold-glow flex flex-col max-h-[90vh]">
          <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#D4AF37]/10">
            <h3 className="text-xl font-bold text-white uppercase tracking-widest">
              {modalType} {currentSection}
            </h3>
            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
              <X size={24} />
            </button>
          </div>
          <div className="p-6 overflow-y-auto custom-scrollbar space-y-4">
            {Object.keys(modalData).map((key) => {
              if (key === 'id' && modalType !== 'add') return null;
              return (
                <div key={key} className="space-y-1">
                  <label className="text-xs uppercase font-bold text-[#D4AF37]">{key}</label>
                  <input
                    type="text"
                    disabled={modalType === 'view'}
                    value={modalData[key]}
                    onChange={(e) => setModalData({ ...modalData, [key]: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded p-2 text-white focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>
              );
            })}
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
          <button onClick={() => openModal('add', 'production', {id: '', product: '', quantity: 0, actualYield: 0, expectedYield: 100, status: 'In-Progress'})} className="bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37] px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-all">
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
    const rawMaterials = inventory.filter(i => i.category !== 'Finished');
    const finishedGoods = inventory.filter(i => i.category === 'Finished');
    
    const displayItems = inventoryTab === 'raw' ? rawMaterials : finishedGoods;
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
            <button onClick={() => openModal('add', 'inventory', {id: '', name: '', category: 'API', stock: 0, safetyStock: 0, unit: 'kg'})} className="bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37] px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-all">
              <Plus size={16} /> Add Material
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-4 border-b border-white/5">
            <button 
                onClick={() => setInventoryTab('raw')}
                className={`pb-2 px-4 text-sm font-bold transition-all ${inventoryTab === 'raw' ? 'text-[#F4C430] border-b-2 border-[#F4C430]' : 'text-slate-500 hover:text-white'}`}
            >
                Raw Materials
            </button>
            <button 
                onClick={() => setInventoryTab('finished')}
                className={`pb-2 px-4 text-sm font-bold transition-all ${inventoryTab === 'finished' ? 'text-[#F4C430] border-b-2 border-[#F4C430]' : 'text-slate-500 hover:text-white'}`}
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

  const renderSales = () => (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BadgeDollarSign className="text-[#F4C430]" size={20} /> Sales & Orders
          </h2>
          <div className="flex gap-2">
            <button onClick={() => exportToCSV(orders, 'sales_report')} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
              <Download size={14}/> Export
            </button>
            <button onClick={() => openModal('add', 'sales', {id: '', customer: '', product: '', quantity: 0, status: 'Pending'})} className="bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37] px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-all">
              <Plus size={16} /> Update Orders
            </button>
          </div>
      </div>
      <div className="bg-slate-900/50 border border-[#D4AF37]/30 rounded-xl p-6 gold-glow">
        <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-slate-500 text-xs uppercase">
                <th className="pb-4 px-4 font-bold">Invoice / Date</th>
                <th className="pb-4 px-4 font-bold">Party / Country</th>
                <th className="pb-4 px-4 font-bold">Product / Qty</th>
                <th className="pb-4 px-4 font-bold">Amount (USD/OMR)</th>
                <th className="pb-4 px-4 font-bold">Status</th>
                <th className="pb-4 px-4 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {orders.map(order => (
                <tr key={order.id} className="hover:bg-white/5">
                  <td className="p-4">
                    <div className="font-bold text-white text-sm">{order.invoiceNo}</div>
                    <div className="text-[10px] text-slate-500">{order.date}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-white text-sm">{order.customer}</div>
                    <div className="text-[10px] text-slate-500">{order.country}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-slate-300">{order.product}</div>
                    <div className="text-xs font-bold text-white font-mono">{order.quantity.toLocaleString()} KG</div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm font-bold text-white font-mono">${order.amountUSD?.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{order.amountOMR?.toLocaleString()} OMR</div>
                  </td>
                  <td className="p-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                      order.status === 'Shipped' ? 'bg-blue-500/10 text-blue-500' : 'bg-yellow-500/10 text-yellow-500'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openModal('edit', 'sales', order)} className="p-1.5 rounded hover:bg-yellow-500/20 text-[#F4C430]" title="Edit"><Edit2 size={14}/></button>
                      <button onClick={() => handleDelete('sales', order.id, order.customer)} className="p-1.5 rounded hover:bg-red-500/20 text-red-500" title="Delete"><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
        </table>
      </div>
    </div>
  );

  const renderProcurement = () => {
    // Items that need purchasing
    const purchaseItems = inventory.filter(i => (i.balanceToPurchase && i.balanceToPurchase > 0));

    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Truck className="text-[#F4C430]" size={20} /> Procurement & Supply Chain
            </h2>
            <div className="flex gap-2">
                <button onClick={() => procurementFileRef.current?.click()} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                    <Upload size={14}/> Upload PO/Indent
                </button>
                <input type="file" ref={procurementFileRef} className="hidden" onChange={(e) => handleFileUpload(e, 'procurement')} />
                
                <button onClick={() => openModal('add', 'procurement', {id: '', name: '', category: 'API', rating: 5, status: 'Verified', country: ''})} className="bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37] px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-all">
                    <Plus size={16} /> Add Vendor
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Shortage List */}
            <div className="bg-slate-900/50 border border-[#D4AF37]/30 rounded-xl p-6 gold-glow">
                 <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <AlertTriangle className="text-red-400" size={18}/> Material Shortages
                 </h3>
                 <div className="space-y-3">
                     {purchaseItems.length === 0 ? <p className="text-slate-500 text-sm">No critical shortages.</p> : purchaseItems.map(item => (
                         <div key={item.id} className="p-4 bg-red-500/10 rounded border border-red-500/20 flex justify-between items-center">
                             <div>
                                 <h4 className="text-white font-bold text-sm">{item.name}</h4>
                                 <p className="text-[10px] text-red-300">Required: {item.balanceToPurchase} {item.unit}</p>
                             </div>
                             <button className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded font-bold">
                                 Generate PO
                             </button>
                         </div>
                     ))}
                 </div>
            </div>

            {/* Vendor List */}
            <div className="bg-slate-900/50 border border-[#D4AF37]/30 rounded-xl p-6 gold-glow">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Globe className="text-[#F4C430]" size={18}/> Active Vendors
                </h3>
                 <div className="space-y-3">
                     {vendors.map(vendor => (
                         <div key={vendor.id} className="p-4 bg-slate-800/30 rounded border border-white/5 flex justify-between items-center group hover:border-[#D4AF37]/30 transition-all">
                             <div>
                                 <div className="flex items-center gap-2">
                                     <h4 className="text-white font-bold text-sm">{vendor.name}</h4>
                                     <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase ${vendor.status === 'Verified' ? 'text-green-500 border-green-500/20 bg-green-500/10' : 'text-yellow-500 border-yellow-500/20 bg-yellow-500/10'}`}>{vendor.status}</span>
                                 </div>
                                 <p className="text-[10px] text-slate-500">{vendor.country} • {vendor.category}</p>
                             </div>
                             <div className="flex items-center gap-2">
                                 <div className="flex items-center text-[#D4AF37] text-xs font-bold gap-1">
                                     <Star size={10} fill="#D4AF37"/> {vendor.rating}
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

  const renderAIOps = () => (
    <div className="space-y-6 animate-fadeIn flex flex-col pb-10">
       <div className="flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="text-[#F4C430]" size={20} /> AI Operational Assistant
          </h2>
          {/* Provider Selector */}
          <div className="flex items-center gap-2 bg-slate-900 border border-white/10 rounded-lg p-1">
             <span className="text-[10px] text-slate-500 uppercase font-bold px-2">Model:</span>
             <select 
                value={activeProvider}
                onChange={(e) => setActiveProvider(e.target.value as any)}
                className="bg-transparent text-xs text-[#D4AF37] font-bold focus:outline-none"
             >
                 <option value="Gemini">Gemini 3 Pro</option>
                 <option value="Claude">Claude 3.5 Sonnet</option>
                 <option value="NotebookLM">NotebookLM</option>
             </select>
          </div>
      </div>
      <div className="flex-1 bg-slate-900/50 border border-[#D4AF37]/30 rounded-xl p-4 gold-glow flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 mb-4 p-2">
              {chatHistory.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-4 rounded-xl text-sm ${
                          msg.role === 'user' 
                          ? 'bg-[#D4AF37] text-slate-950 font-medium rounded-br-none' 
                          : 'bg-slate-800 text-slate-200 border border-white/10 rounded-bl-none'
                      }`}>
                          {msg.text}
                      </div>
                  </div>
              ))}
              {isAiLoading && (
                  <div className="flex justify-start">
                      <div className="bg-slate-800 p-4 rounded-xl rounded-bl-none border border-white/10 flex items-center gap-2 text-slate-400 text-xs">
                          <Loader2 className="animate-spin" size={14}/> Processing with {activeProvider}...
                      </div>
                  </div>
              )}
          </div>
          <div className="shrink-0 flex gap-2">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`p-3 rounded-lg border transition-all ${isRecording ? 'bg-red-500/20 border-red-500 text-red-500 animate-pulse' : 'bg-slate-950 border-white/10 text-slate-400 hover:text-white'}`}
              >
                  {isRecording ? <MicOff size={20}/> : <Mic size={20}/>}
              </button>
              <input 
                  type="text" 
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleChat()}
                  placeholder={`Query ${activeProvider}...`}
                  className="flex-1 bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
              />
              <button 
                  onClick={handleChat}
                  disabled={!chatMessage.trim() || isAiLoading}
                  className="bg-[#D4AF37] hover:bg-[#c4a030] text-slate-950 p-3 rounded-lg transition-colors disabled:opacity-50"
              >
                  <Send size={20}/>
              </button>
          </div>
      </div>
    </div>
  );

  const renderRDLab = () => {
      // Filter R&D Projects
      const filteredRD = rdProjects.filter(p => p.title.toLowerCase().includes(rdSearch.toLowerCase()) || p.id.toLowerCase().includes(rdSearch.toLowerCase()));

      return (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Beaker className="text-[#F4C430]" size={20} /> R&D Formulation Lab
              </h2>
              <div className="flex gap-2">
                  <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={14} />
                      <input 
                          type="text" 
                          value={rdSearch}
                          onChange={(e) => setRdSearch(e.target.value)}
                          placeholder="Search formulations..."
                          className="bg-slate-900 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                      />
                  </div>
                  <button onClick={() => rdFileRef.current?.click()} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                      <Upload size={14}/> Upload Formula
                  </button>
                  <input type="file" ref={rdFileRef} className="hidden" onChange={(e) => handleFileUpload(e, 'rd')} />
              </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-900/50 border border-[#D4AF37]/30 rounded-xl p-6 gold-glow">
                  <h3 className="text-lg font-bold text-white mb-4">Current Projects</h3>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                      {filteredRD.length === 0 ? <p className="text-slate-500 text-sm">No formulations found.</p> : filteredRD.map(project => (
                          <div key={project.id} 
                               className={`p-4 rounded border transition-all group relative ${selectedRD?.id === project.id ? 'bg-[#D4AF37]/10 border-[#D4AF37]' : 'bg-slate-800/30 border-white/5 hover:bg-slate-800/50'}`}>
                              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => { e.stopPropagation(); handleDelete('rd', project.id, project.title); }} className="p-1 rounded bg-slate-900 text-red-500 hover:bg-red-900" title="Delete"><Trash2 size={12}/></button>
                              </div>
                              <div className="flex justify-between items-start cursor-pointer" onClick={() => setSelectedRD(project)}>
                                  <h4 className="font-bold text-white">{project.title}</h4>
                                  <span className="text-[10px] bg-slate-950 text-slate-300 px-2 py-0.5 rounded">{project.status}</span>
                              </div>
                              <p className="text-[10px] text-slate-500 mt-1 cursor-pointer" onClick={() => setSelectedRD(project)}>ID: {project.id} • Score: {project.optimizationScore}</p>
                          </div>
                      ))}
                  </div>
              </div>
              <div className="bg-slate-900/50 border border-[#D4AF37]/30 rounded-xl p-6 gold-glow relative min-h-[400px]">
                   {selectedRD ? (
                       <>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-white">Formulation Analysis</h3>
                                    <p className="text-xs text-slate-500">{selectedRD.title}</p>
                                </div>
                                <button onClick={handleOptimizeFormulation} disabled={isAiLoading} className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all">
                                    {isAiLoading ? <Loader2 className="animate-spin" size={14}/> : <Zap size={14}/>} AI OPTIMIZE
                                </button>
                            </div>
                            <div className="overflow-x-auto mb-6">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-white/5 text-slate-500 uppercase">
                                            <th className="pb-2">Material</th>
                                            <th className="pb-2">Qty</th>
                                            <th className="pb-2">Rate</th>
                                            <th className="pb-2 text-right">Cost</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {selectedRD.ingredients.map((ing, idx) => (
                                            <tr key={idx} className="hover:bg-white/5">
                                                <td className="py-2 text-slate-300">{ing.name}</td>
                                                <td className="py-2 font-mono text-white">{ing.quantity} {ing.unit}</td>
                                                <td className="py-2 font-mono text-slate-400">${ing.rateUSD}</td>
                                                <td className="py-2 font-mono text-[#D4AF37] text-right">${ing.cost?.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t border-[#D4AF37]/30 font-bold">
                                            <td colSpan={3} className="py-2 text-white">Total RMC</td>
                                            <td className="py-2 text-[#D4AF37] text-right font-mono">${selectedRD.totalRMC?.toLocaleString()}</td>
                                        </tr>
                                        <tr>
                                            <td colSpan={3} className="py-1 text-slate-500 text-[10px]">Batch Size: {selectedRD.batchSize} {selectedRD.batchUnit} | Loss: {selectedRD.loss}</td>
                                            <td className="py-1 text-green-400 text-right font-mono text-sm">${selectedRD.totalFinalRMC}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                            <div className="p-4 bg-slate-800/30 rounded border border-white/5">
                                <h4 className="text-xs font-bold text-[#D4AF37] mb-2 uppercase">AI Optimization Report</h4>
                                <p className="text-sm text-slate-300 leading-relaxed">
                                    {selectedRD.optimizationScore > 90 
                                     ? "Formulation meets bioequivalence standards. No critical interactions detected between API and excipients." 
                                     : "Optimization Required: Binder concentration may affect dissolution profile. Recommend adjusting HPMC levels."}
                                </p>
                            </div>
                       </>
                   ) : (
                       <div className="flex items-center justify-center h-full text-slate-500">Select a project</div>
                   )}
              </div>
          </div>
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
      
      {/* RESPONSIVE SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 sm:w-72 bg-slate-950 border-r border-[#D4AF37]/20 flex flex-col transition-transform duration-300 md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
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
            <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-500 hover:text-white">
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
              { id: 'ai', label: 'AI Operations', icon: MessageSquare },
              { id: 'brainstorm', label: 'Brainstorming', icon: BrainCircuit },
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
              className="md:hidden p-2 text-slate-400 hover:text-white -ml-2"
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
          {activeTab === 'industrial' && renderIndustrialStudio()}
          {activeTab === 'ai' && renderAIOps()}
          {activeTab === 'brainstorm' && renderBrainstorming()}
          {activeTab === 'bd' && renderBD()}
          {activeTab === 'samples' && renderSamples()}
          {activeTab === 'history' && renderHistory()}
        </div>
      </main>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
