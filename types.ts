
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
  status: 'Formulation' | 'Stability' | 'Bioequivalence' | 'Clinical' | 'Optimizing';
  ingredients: Ingredient[];
  optimizationScore: number;
  lastUpdated: string;
  batchSize: number; // Output
  batchUnit: string;
  totalRMC: number;
  loss: number;
  totalFinalRMC: number;
}

export interface Ingredient {
  sNo?: string;
  name: string;
  quantity: number; // Per B. Qty
  unit: string;
  rateUSD: number;
  cost: number;
  role: 'API' | 'Filler' | 'Binder' | 'Coating' | 'Disintegrant' | 'Other';
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
