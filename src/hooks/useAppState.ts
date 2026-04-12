import { useState, useCallback, useEffect } from 'react';
import {
  INITIAL_BATCHES, INITIAL_INVENTORY, INITIAL_ORDERS, INITIAL_EXPENSES,
  INITIAL_EMPLOYEES, INITIAL_VENDORS, INITIAL_BD, INITIAL_SAMPLES,
  INITIAL_MARKETS, INITIAL_RD, INITIAL_SHIPMENTS, ALL_WIDGETS,
} from '@/data/initial';
import type {
  Batch, InventoryItem, Order, Expense, Employee, Vendor,
  BDLead, SampleStatus, Market, RDProject, Shipment, AuditLog,
  COOInsight, TabId, WidgetId, ModalState, ApiConfig, CalcData, ChatSession,
} from '@/types';
import { generateId, today } from '@/lib/utils';
import { loadTable, saveRow, deleteRow, appendRow } from '@/services/db';

export function useAppState() {
  // ── Navigation ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // ── Data ─────────────────────────────────────────────────────────────────────
  const [batches, setBatches] = useState<Batch[]>(INITIAL_BATCHES);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [vendors, setVendors] = useState<Vendor[]>(INITIAL_VENDORS);
  const [bdLeads, setBdLeads] = useState<BDLead[]>(INITIAL_BD);
  const [samples, setSamples] = useState<SampleStatus[]>(INITIAL_SAMPLES);
  const [markets, setMarkets] = useState<Market[]>(INITIAL_MARKETS);
  const [rdProjects, setRdProjects] = useState<RDProject[]>(INITIAL_RD);
  const [shipments, setShipments] = useState<Shipment[]>(INITIAL_SHIPMENTS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [insights, setInsights] = useState<COOInsight[]>([]);

  // ── Load from persistence on mount ─────────────────────────────────────────
  useEffect(() => {
    loadTable<Batch>('batches', INITIAL_BATCHES).then(setBatches).catch(() => {});
    loadTable<InventoryItem>('inventory', INITIAL_INVENTORY).then(setInventory).catch(() => {});
    loadTable<Order>('orders', INITIAL_ORDERS).then(setOrders).catch(() => {});
    loadTable<Expense>('expenses', INITIAL_EXPENSES).then(setExpenses).catch(() => {});
    loadTable<Employee>('employees', INITIAL_EMPLOYEES).then(setEmployees).catch(() => {});
    loadTable<Vendor>('vendors', INITIAL_VENDORS).then(setVendors).catch(() => {});
    loadTable<BDLead>('bd_leads', INITIAL_BD).then(setBdLeads).catch(() => {});
    loadTable<SampleStatus>('samples', INITIAL_SAMPLES).then(setSamples).catch(() => {});
    loadTable<Market>('markets', INITIAL_MARKETS).then(setMarkets).catch(() => {});
    loadTable<RDProject>('rd_projects', INITIAL_RD).then(rows =>
      setRdProjects(rows.map(p => ({ ...p, ingredients: p.ingredients ?? [] })))
    ).catch(() => {});
    loadTable<Shipment>('shipments', INITIAL_SHIPMENTS).then(setShipments).catch(() => {});
    loadTable<AuditLog>('audit_logs', []).then(setAuditLogs).catch(() => {});
  }, []);

  // ── Dashboard ─────────────────────────────────────────────────────────────
  const [visibleWidgets, setVisibleWidgets] = useState<WidgetId[]>(() => {
    try {
      const s = localStorage.getItem('erp_v2_widgets');
      const parsed = s ? JSON.parse(s) : null;
      return Array.isArray(parsed) ? parsed : ALL_WIDGETS.filter(w => w.default).map(w => w.id);
    } catch { return ALL_WIDGETS.filter(w => w.default).map(w => w.id); }
  });
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);

  // ── Settings / API Config ──────────────────────────────────────────────────
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiConfig, setApiConfig] = useState<ApiConfig>(() => {
    try {
      const s = localStorage.getItem('erp_v2_api_config');
      return s ? JSON.parse(s) : { claudeKey: '', notebookLmSource: '', supabaseUrl: '', supabaseKey: '' };
    } catch { return { claudeKey: '', notebookLmSource: '', supabaseUrl: '', supabaseKey: '' }; }
  });

  // ── Modal ─────────────────────────────────────────────────────────────────
  const [modal, setModal] = useState<ModalState>({
    isOpen: false, mode: 'add', type: null, data: {},
  });

  // ── Confirm Dialog ────────────────────────────────────────────────────────
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean; message: string; onConfirm: () => void;
  }>({ isOpen: false, message: '', onConfirm: () => {} });

  // ── AI chat sessions ───────────────────────────────────────────────────────
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeProvider, setActiveProvider] = useState<'Gemini' | 'Claude' | 'OpenRouter' | 'NotebookLM'>('Gemini');

  // ── Calculator ────────────────────────────────────────────────────────────
  const [calcData, setCalcData] = useState<CalcData>({
    product: '', volume: 0, targetPrice: 0, rmc: 0,
    labor: 0, packing: 0, logistics: 0, shippingCost: 0,
    shippingMethod: 'CIF by Air - Muscat Airport',
  });
  const [calcResults, setCalcResults] = useState<Record<string, number> | null>(null);

  // ── Audit logging ─────────────────────────────────────────────────────────
  const logAudit = useCallback((action: string, details: string) => {
    const entry: AuditLog = {
      id: generateId('LOG'), action, user: 'Current User', details, timestamp: new Date().toISOString(),
    };
    setAuditLogs(prev => {
      const next = [entry, ...prev];
      return next.length > 500 ? next.slice(0, 500) : next;
    });
    appendRow('audit_logs', entry).catch(() => {});
  }, []);

  // ── CRUD helpers ──────────────────────────────────────────────────────────
  const openModal = useCallback((mode: ModalState['mode'], type: ModalState['type'], data: Record<string, unknown> = {}) => {
    setModal({ isOpen: true, mode, type, data });
  }, []);

  const closeModal = useCallback(() => {
    setModal(prev => ({ ...prev, isOpen: false }));
  }, []);

  const saveWidgets = useCallback((ids: WidgetId[]) => {
    setVisibleWidgets(ids);
    localStorage.setItem('erp_v2_widgets', JSON.stringify(ids));
  }, []);

  const saveApiConfig = useCallback((cfg: ApiConfig) => {
    setApiConfig(cfg);
    localStorage.setItem('erp_v2_api_config', JSON.stringify(cfg));
  }, []);

  const handleSave = useCallback((type: ModalState['type'], data: Record<string, unknown>) => {
    const action = modal.mode === 'add' ? 'ADD' : 'EDIT';
    const ensureId = <T extends { id: string }>(row: Record<string, unknown>, prefix: string): T =>
      ({ ...row, id: (row.id as string) || generateId(prefix) }) as unknown as T;
    switch (type) {
      case 'production': {
        const row = ensureId<Batch>(data, "BATCH");
        setBatches(prev =>
          modal.mode === 'add' ? [...prev, row] : prev.map(b => b.id === row.id ? { ...b, ...row } : b)
        );
        saveRow('batches', row).catch(() => {});
        logAudit(`${action}_BATCH`, `Batch ${row.id}`);
        break;
      }
      case 'inventory': {
        const row = ensureId<InventoryItem>(data, "RM");
        setInventory(prev =>
          modal.mode === 'add' ? [...prev, row] : prev.map(i => i.id === row.id ? { ...i, ...row } : i)
        );
        saveRow('inventory', row).catch(() => {});
        logAudit(`${action}_INVENTORY`, `Item ${row.name}`);
        break;
      }
      case 'sales': {
        const row = ensureId<Order>(data, "ORD");
        setOrders(prev =>
          modal.mode === 'add' ? [...prev, row] : prev.map(o => o.id === row.id ? { ...o, ...row } : o)
        );
        saveRow('orders', row).catch(() => {});
        logAudit(`${action}_ORDER`, `Order ${row.invoiceNo}`);
        break;
      }
      case 'vendors':
      case 'procurement': {
        const row = ensureId<Vendor>(data, "V");
        setVendors(prev =>
          modal.mode === 'add' ? [...prev, row] : prev.map(v => v.id === row.id ? { ...v, ...row } : v)
        );
        saveRow('vendors', row).catch(() => {});
        logAudit(`${action}_VENDOR`, `Vendor ${row.name}`);
        break;
      }
      case 'accounting': {
        const row = ensureId<Expense>(data, "EXP");
        setExpenses(prev =>
          modal.mode === 'add' ? [...prev, row] : prev.map(e => e.id === row.id ? { ...e, ...row } : e)
        );
        saveRow('expenses', row).catch(() => {});
        logAudit(`${action}_EXPENSE`, `${row.description}`);
        break;
      }
      case 'hr': {
        const row = ensureId<Employee>(data, "EMP");
        setEmployees(prev =>
          modal.mode === 'add' ? [...prev, row] : prev.map(e => e.id === row.id ? { ...e, ...row } : e)
        );
        saveRow('employees', row).catch(() => {});
        logAudit(`${action}_EMPLOYEE`, `${row.name}`);
        break;
      }
      case 'rd': {
        const row = ensureId<RDProject>(data, "RD");
        setRdProjects(prev =>
          modal.mode === 'add' ? [...prev, row] : prev.map(p => p.id === row.id ? { ...p, ...row } : p)
        );
        saveRow('rd_projects', row).catch(() => {});
        logAudit(`${action}_RD`, `Project ${row.id}`);
        break;
      }
      case 'bd': {
        const row = ensureId<BDLead>(data, "BD");
        setBdLeads(prev =>
          modal.mode === 'add' ? [...prev, row] : prev.map(l => l.id === row.id ? { ...l, ...row } : l)
        );
        saveRow('bd_leads', row).catch(() => {});
        logAudit(`${action}_BD`, `Lead ${row.opportunity}`);
        break;
      }
      case 'samples': {
        const row = ensureId<SampleStatus>(data, "SMP");
        setSamples(prev =>
          modal.mode === 'add' ? [...prev, row] : prev.map(s => s.id === row.id ? { ...s, ...row } : s)
        );
        saveRow('samples', row).catch(() => {});
        logAudit(`${action}_SAMPLE`, `Sample ${row.id}`);
        break;
      }
      case 'markets': {
        const row = ensureId<Market>(data, "M");
        setMarkets(prev =>
          modal.mode === 'add' ? [...prev, row] : prev.map(m => m.id === row.id ? { ...m, ...row } : m)
        );
        saveRow('markets', row).catch(() => {});
        logAudit(`${action}_MARKET`, `Market ${row.name}`);
        break;
      }
      case 'logistics': {
        const row = ensureId<Shipment>(data, "SHP");
        setShipments(prev =>
          modal.mode === 'add' ? [...prev, row] : prev.map(s => s.id === row.id ? { ...s, ...row } : s)
        );
        saveRow('shipments', row).catch(() => {});
        logAudit(`${action}_SHIPMENT`, `Shipment ${row.id}`);
        break;
      }
    }
    closeModal();
  }, [modal.mode, logAudit, closeModal]);

  const handleDelete = useCallback((type: string, id: string, name: string) => {
    setConfirmDialog({
      isOpen: true,
      message: `Delete "${name}"? This cannot be undone.`,
      onConfirm: () => {
        const typeToTable: Record<string, Parameters<typeof deleteRow>[0]> = {
          production: 'batches', inventory: 'inventory', sales: 'orders',
          vendors: 'vendors', procurement: 'vendors', accounting: 'expenses',
          hr: 'employees', rd: 'rd_projects', bd: 'bd_leads',
          samples: 'samples', markets: 'markets', logistics: 'shipments',
        };
        switch (type) {
          case 'production': setBatches(prev => prev.filter(b => b.id !== id)); break;
          case 'inventory':  setInventory(prev => prev.filter(i => i.id !== id)); break;
          case 'sales':      setOrders(prev => prev.filter(o => o.id !== id)); break;
          case 'vendors':
          case 'procurement':setVendors(prev => prev.filter(v => v.id !== id)); break;
          case 'accounting': setExpenses(prev => prev.filter(e => e.id !== id)); break;
          case 'hr':         setEmployees(prev => prev.filter(e => e.id !== id)); break;
          case 'rd':         setRdProjects(prev => prev.filter(p => p.id !== id)); break;
          case 'bd':         setBdLeads(prev => prev.filter(l => l.id !== id)); break;
          case 'samples':    setSamples(prev => prev.filter(s => s.id !== id)); break;
          case 'markets':    setMarkets(prev => prev.filter(m => m.id !== id)); break;
          case 'logistics':  setShipments(prev => prev.filter(s => s.id !== id)); break;
        }
        const table = typeToTable[type];
        if (table) deleteRow(table, id).catch(() => {});
        logAudit(`DELETE_${type.toUpperCase()}`, `Deleted: ${name} (id: ${id})`);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  }, [logAudit]);

  return {
    // nav
    activeTab, setActiveTab, isMobileMenuOpen, setIsMobileMenuOpen,
    // data
    batches, setBatches, inventory, setInventory, orders, setOrders,
    expenses, setExpenses, employees, setEmployees, vendors, setVendors,
    bdLeads, setBdLeads, samples, setSamples, markets, setMarkets,
    rdProjects, setRdProjects, shipments, setShipments,
    auditLogs, insights, setInsights,
    // dashboard
    visibleWidgets, isCustomizeOpen, setIsCustomizeOpen, saveWidgets,
    // settings
    isSettingsOpen, setIsSettingsOpen, apiConfig, saveApiConfig,
    // modal
    modal, openModal, closeModal, handleSave,
    // confirm
    confirmDialog, handleDelete,
    setConfirmDialog,
    // AI
    chatSessions, setChatSessions, activeChatId, setActiveChatId,
    activeProvider, setActiveProvider,
    // calc
    calcData, setCalcData, calcResults, setCalcResults,
    // utils
    logAudit, today,
  };
}
