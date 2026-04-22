export interface Batch {
  id: string;
  product: string;
  quantity: number;
  actualYield: number;
  expectedYield: number;
  status: 'In-Progress' | 'Completed' | 'Quarantine' | 'Scheduled';
  timestamp: string;
  dispatchDate?: string;
}

export interface InventoryItem {
  id: string;
  sNo: string;
  name: string;
  category: 'API' | 'Excipient' | 'Packing' | 'Finished' | 'R&D' | 'Spare' | 'Other';
  requiredForOrders: number;
  stock: number; // Present Stock
  balanceToPurchase: number;
  unit: string;
  stockDate?: string;
}

export interface Order {
  id: string;
  sNo: string;
  date: string;
  invoiceNo: string;
  customer: string; // Party
  lcNo: string; // LC No / BIC No
  country: string;
  product: string;
  quantity: number; // Qty (KG)
  rateUSD: number;
  amountUSD: number;
  amountOMR: number;
  status: string;
  materialDispatched?: string;
  paymentTerms?: string;
  receivedAmountOMR?: number;
  pendingAmountOMR?: number;
  remarks?: string;
}

export interface Expense {
  id: string;
  description: string;
  category: 'Utilities' | 'Salaries' | 'Maintenance' | 'Logistics' | 'Raw Materials';
  amount: number;
  status: 'Paid' | 'Pending';
  dueDate: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  department: 'Production' | 'QC' | 'Sales' | 'Admin' | 'R&D';
  salary: number;
  status: 'Active' | 'On Leave' | 'Terminated';
  joinDate: string;
}

export interface Vendor {
  id: string;
  name: string;
  category: 'API' | 'Excipient' | 'Packing' | 'Equipment';
  rating: number;
  status: 'Verified' | 'Audit Pending' | 'Blacklisted';
  country: string;
}

export interface BDLead {
  id: string;
  targetMarket: string;
  opportunity: string;
  potentialValue: string;
  status: 'Prospecting' | 'Negotiation' | 'Contracting' | 'Closed';
  probability: number;
}

export interface SampleStatus {
  id: string;
  product: string;
  destination: string;
  quantity: string;
  status: 'Requested' | 'Production' | 'QC Testing' | 'Dispatched' | 'Arrived';
  trackingNumber?: string;
}

export interface COOInsight {
  type: 'Production' | 'Inventory' | 'Procurement' | 'Sales' | 'R&D' | 'BD' | 'Finance' | 'HR';
  message: string;
  severity: 'info' | 'warning' | 'critical';
  actionTaken?: string;
}

export interface RDProject {
  id: string;
  title: string;
  productCode?: string;
  dosageForm?: string;       // Tablet, Capsule, Sachet, Liquid, etc.
  strength?: string;         // e.g. 40mg, 20mg/5ml
  therapeuticCategory?: string;
  shelfLife?: string;
  storageCondition?: string;
  manufacturingProcess?: string; // step-by-step process notes
  qualityStandards?: string;     // BP, USP, IP, etc.
  regulatoryStatus?: string;     // Registered, Under Review, Dossier Prep
  status: 'Formulation' | 'Stability' | 'Bioequivalence' | 'Clinical' | 'Optimizing' | 'Approved';
  ingredients: Ingredient[];
  packingMaterials?: PackingMaterial[];
  optimizationScore: number;
  aiOptimizationNotes?: string;
  lastUpdated: string;
  batchSize: number;
  batchUnit: string;
  totalRMC: number;
  loss: number;
  totalFinalRMC: number;
  versions?: RDVersion[];       // version history
}

export interface Ingredient {
  sNo?: string;
  name: string;
  quantity: number;
  unit: string;
  rateUSD: number;
  cost: number;
  role: 'API' | 'Filler' | 'Binder' | 'Coating' | 'Disintegrant' | 'Lubricant' | 'Plasticizer' | 'Surfactant' | 'Excipient' | 'Other';
  supplier?: string;
  grade?: string;             // BP, USP, IP grade
  notes?: string;
}

export interface PackingMaterial {
  sNo?: string;
  name: string;
  quantity: number;
  unit: string;
  rateUSD: number;
  cost: number;
  notes?: string;
}

export interface RDVersion {
  version: string;
  date: string;
  changedBy?: string;
  summary: string;
  snapshot: Partial<RDProject>;
}

export interface FileAnalysisResult {
  fileName: string;
  analysis: string;
  timestamp: string;
}

export interface Market {
  id: string;
  name: string;
  region: string;
  status: 'Active' | 'Pending' | 'Exit';
}

export interface AuditLog {
  id: string;
  action: string;
  user: string;
  details: string;
  timestamp: string;
}

export interface Shipment {
  id: string;
  status: 'In Transit' | 'Delivered' | 'Delayed/Customs' | 'Inbound' | 'Pending';
  product: string;
  weightKg: number;
  origin: string;
  destination: string;
  temperatureStatus: string; // e.g., '2-8°C', 'Ambient'
  inspectionStatus: 'Pending' | 'Passed' | 'Failed' | 'N/A';
  costUSD?: number;
  costOMR?: number;
  eta?: string;
}
