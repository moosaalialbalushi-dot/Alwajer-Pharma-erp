/**
 * lib/dbMapper.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * GLOBAL DATABASE MAPPING LAYER
 *
 * Translates camelCase frontend/AI-ingested objects into the exact Supabase
 * column schema before any INSERT or UPDATE is executed.
 *
 * Usage:
 *   import { mapOrderToSupabase, mapInventoryToSupabase, ... } from '../lib/dbMapper';
 *
 *   const { error } = await supabase
 *     .from('orders')
 *     .update(mapOrderToSupabase(frontendOrder))
 *     .eq('id', id);
 *   if (error) { console.error('Supabase Update Failed:', error.message); throw new Error('Database mapping error. Halting retry loop.'); }
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── Numeric helpers ──────────────────────────────────────────────────────────

const toNum = (val: any): number =>
  parseFloat(String(val ?? '').replace(/,/g, '')) || 0;

const toNumOrNull = (val: any): number | null => {
  const n = parseFloat(String(val ?? '').replace(/,/g, ''));
  return isNaN(n) ? null : n;
};

// ─── ORDERS ───────────────────────────────────────────────────────────────────

/**
 * Maps a frontend Order object to the Supabase `orders` table schema.
 * Accepts any loose object (from UI state, AI extraction, or document ingestion).
 *
 * DB columns  ← Frontend / AI key aliases
 * ─────────────────────────────────────────────────────────────────────────────
 * id              ← id
 * s_no            ← sNo | s_no | S_NO
 * invoice_no      ← invoiceNo | invoice_no | INVOICE_NO
 * date            ← date | DATE (ISO 8601 string YYYY-MM-DD)
 * customer        ← customer | CUSTOMER | party | PARTY
 * country         ← country | COUNTRY
 * product         ← product | PRODUCT
 * quantity        ← quantity | qty | QTY | QUANTITY (numeric, KG)
 * rate_usd        ← rateUSD | rate_usd | RATE_USD | unitRate | Unit-rate
 * amount_usd      ← amountUSD | amount_usd | AMOUNT_USD (auto-calc if 0)
 * amount_omr      ← amountOMR | amount_omr | AMOUNT_OMR (auto-calc if 0)
 * status          ← status | STATUS
 * lc_number       ← lcNo | lc_no | lc_number | LC_NO | bicNo | BIC_NO
 * pi_number       ← piNumber | pi_number | PI_NUMBER
 * payment_method  ← paymentMethod | payment_method | PAYMENT_METHOD
 * shipping_method ← shippingMethod | shipping_method | SHIPPING_METHOD
 * market          ← market | MARKET
 * notes           ← notes | remarks | NOTES | REMARKS
 * delivery_date   ← deliveryDate | delivery_date | DELIVERY_DATE
 */
export function mapOrderToSupabase(d: any): Record<string, any> {
  const qty       = toNum(d.quantity ?? d.qty ?? d.QTY ?? d.QUANTITY);
  const rateUSD   = toNum(
    d.rateUSD ?? d.rate_usd ?? d.RATE_USD ??
    d.unitRate ?? d['Unit-rate'] ?? d.UNIT_RATE ?? d.unit_rate
  );

  let amountUSD = toNum(d.amountUSD ?? d.amount_usd ?? d.AMOUNT_USD);
  if (amountUSD === 0) amountUSD = Number((qty * rateUSD).toFixed(3));

  let amountOMR = toNum(d.amountOMR ?? d.amount_omr ?? d.AMOUNT_OMR);
  if (amountOMR === 0) amountOMR = Number((amountUSD * 0.3845).toFixed(3));

  const lcValue = d.lcNo ?? d.lc_no ?? d.lc_number ?? d.LC_NO ?? d.bicNo ?? d.BIC_NO ?? '';

  return {
    id:              d.id,
    s_no:            d.sNo            ?? d.s_no            ?? d.S_NO            ?? '',
    invoice_no:      d.invoiceNo      ?? d.invoice_no      ?? d.INVOICE_NO      ?? '',
    date:            d.date           ?? d.DATE            ?? new Date().toISOString().split('T')[0],
    customer:        d.customer       ?? d.CUSTOMER        ?? d.party           ?? d.PARTY ?? '',
    country:         d.country        ?? d.COUNTRY         ?? '',
    product:         d.product        ?? d.PRODUCT         ?? '',
    quantity:        qty,
    rate_usd:        rateUSD,
    amount_usd:      amountUSD,
    amount_omr:      amountOMR,
    status:          d.status         ?? d.STATUS          ?? 'Pending',
    lc_number:       lcValue,
    pi_number:       d.piNumber       ?? d.pi_number       ?? d.PI_NUMBER       ?? '',
    payment_method:  d.paymentMethod  ?? d.payment_method  ?? d.PAYMENT_METHOD  ?? '',
    shipping_method: d.shippingMethod ?? d.shipping_method ?? d.SHIPPING_METHOD ?? '',
    market:          d.market         ?? d.MARKET          ?? '',
    notes:           d.notes          ?? d.remarks         ?? d.NOTES           ?? d.REMARKS ?? '',
    delivery_date:   d.deliveryDate   ?? d.delivery_date   ?? d.DELIVERY_DATE   ?? null,
  };
}

/**
 * Reverse-maps a Supabase `orders` row back to the frontend Order shape.
 * Used in the SELECT/load path.
 */
export function mapOrderFromSupabase(r: any) {
  const rateUSD = Number(r.rate_usd) || 0;

  return {
    id:              r.id,
    sNo:             r.s_no            ?? '',
    invoiceNo:       r.invoice_no      ?? '',
    date:            r.date            ?? '',
    customer:        r.customer        ?? '',
    country:         r.country         ?? '',
    product:         r.product         ?? '',
    quantity:        Number(r.quantity)    || 0,
    rateUSD,
    amountUSD:       Number(r.amount_usd)  || 0,
    amountOMR:       Number(r.amount_omr)  || 0,
    status:          r.status          ?? 'Pending',
    lcNo:            r.lc_number       ?? '',
    piNumber:        r.pi_number       ?? '',
    paymentMethod:   r.payment_method  ?? '',
    shippingMethod:  r.shipping_method ?? '',
    market:          r.market          ?? '',
    notes:           r.notes           ?? '',
    deliveryDate:    r.delivery_date   ?? '',
  };
}

// ─── INVENTORY ────────────────────────────────────────────────────────────────

/**
 * Maps a frontend InventoryItem to the Supabase `inventory` table schema.
 *
 * DB columns          ← Frontend / AI key aliases
 * ─────────────────────────────────────────────────────────────────────────────
 * id                  ← id
 * s_no                ← sNo | s_no
 * name                ← name | NAME
 * category            ← category | CATEGORY
 * stock               ← stock | STOCK (present stock, numeric)
 * required_for_orders ← requiredForOrders | required_for_orders
 * balance_to_purchase ← balanceToPurchase | balance_to_purchase
 * unit                ← unit | UNIT
 * stock_date          ← stockDate | stock_date | STOCK_DATE
 */
export function mapInventoryToSupabase(d: any): Record<string, any> {
  return {
    id:                   d.id,
    s_no:                 d.sNo                 ?? d.s_no                 ?? '',
    name:                 d.name                ?? d.NAME                 ?? '',
    category:             d.category            ?? d.CATEGORY             ?? 'Other',
    stock:                toNum(d.stock         ?? d.STOCK),
    required_for_orders:  toNum(d.requiredForOrders ?? d.required_for_orders ?? d.REQUIRED_FOR_ORDERS),
    balance_to_purchase:  toNum(d.balanceToPurchase ?? d.balance_to_purchase ?? d.BALANCE_TO_PURCHASE),
    unit:                 d.unit                ?? d.UNIT                 ?? 'kg',
    stock_date:           d.stockDate           ?? d.stock_date           ?? d.STOCK_DATE
                          ?? new Date().toLocaleDateString(),
  };
}

export function mapInventoryFromSupabase(r: any) {
  return {
    id:                r.id,
    sNo:               r.s_no                ?? '',
    name:              r.name                ?? '',
    category:          r.category            ?? 'API',
    stock:             Number(r.stock)                || 0,
    requiredForOrders: Number(r.required_for_orders)  || 0,
    balanceToPurchase: Number(r.balance_to_purchase)  || 0,
    unit:              r.unit                ?? 'kg',
    stockDate:         r.stock_date          ?? '',
  };
}

// ─── PRODUCTION YIELDS ────────────────────────────────────────────────────────

/**
 * Maps a frontend Batch to the Supabase `production_yields` table schema.
 *
 * DB columns     ← Frontend / AI key aliases
 * ─────────────────────────────────────────────────────────────────────────────
 * id             ← id
 * product        ← product | PRODUCT
 * quantity       ← quantity | QUANTITY
 * actual_yield   ← actualYield | actual_yield | ACTUAL_YIELD
 * expected_yield ← expectedYield | expected_yield | EXPECTED_YIELD
 * status         ← status | STATUS
 * timestamp      ← timestamp | TIMESTAMP (ISO 8601)
 * dispatch_date  ← dispatchDate | dispatch_date | DISPATCH_DATE
 */
export function mapProductionToSupabase(d: any): Record<string, any> {
  return {
    id:             d.id,
    product:        d.product        ?? d.PRODUCT        ?? '',
    quantity:       toNum(d.quantity ?? d.QUANTITY),
    actual_yield:   toNum(d.actualYield   ?? d.actual_yield   ?? d.ACTUAL_YIELD),
    expected_yield: toNum(d.expectedYield ?? d.expected_yield ?? d.EXPECTED_YIELD),
    status:         d.status         ?? d.STATUS         ?? '',
    timestamp:      d.timestamp      ?? d.TIMESTAMP      ?? new Date().toISOString(),
    dispatch_date:  d.dispatchDate   ?? d.dispatch_date  ?? d.DISPATCH_DATE ?? null,
  };
}

export function mapProductionFromSupabase(r: any) {
  return {
    id:            r.id,
    product:       r.product        ?? '',
    quantity:      Number(r.quantity)        || 0,
    actualYield:   Number(r.actual_yield)    || 0,
    expectedYield: Number(r.expected_yield)  || 0,
    status:        r.status         ?? '',
    timestamp:     r.timestamp      ?? '',
    dispatchDate:  r.dispatch_date  ?? '',
  };
}

// ─── EXPENSES ─────────────────────────────────────────────────────────────────

/**
 * Maps a frontend Expense to the Supabase `expenses` table schema.
 *
 * DB columns   ← Frontend / AI key aliases
 * ─────────────────────────────────────────────────────────────────────────────
 * id           ← id
 * description  ← description | DESCRIPTION
 * category     ← category | CATEGORY
 * amount       ← amount | AMOUNT
 * status       ← status | STATUS
 * due_date     ← dueDate | due_date | DUE_DATE
 */
export function mapExpenseToSupabase(d: any): Record<string, any> {
  return {
    id:          d.id,
    description: d.description ?? d.DESCRIPTION ?? '',
    category:    d.category    ?? d.CATEGORY    ?? '',
    amount:      toNum(d.amount ?? d.AMOUNT),
    status:      d.status      ?? d.STATUS      ?? 'Pending',
    due_date:    d.dueDate     ?? d.due_date    ?? d.DUE_DATE ?? null,
  };
}

export function mapExpenseFromSupabase(r: any) {
  return {
    id:          r.id,
    description: r.description ?? '',
    category:    r.category    ?? '',
    amount:      Number(r.amount) || 0,
    status:      r.status      ?? '',
    dueDate:     r.due_date    ?? '',
  };
}

// ─── EMPLOYEES ────────────────────────────────────────────────────────────────

/**
 * Maps a frontend Employee to the Supabase `employees` table schema.
 *
 * DB columns ← Frontend / AI key aliases
 * ─────────────────────────────────────────────────────────────────────────────
 * id         ← id
 * name       ← name | NAME
 * role       ← role | ROLE
 * department ← department | DEPARTMENT
 * salary     ← salary | SALARY
 * status     ← status | STATUS
 * join_date  ← joinDate | join_date | JOIN_DATE
 */
export function mapEmployeeToSupabase(d: any): Record<string, any> {
  return {
    id:         d.id,
    name:       d.name       ?? d.NAME       ?? '',
    role:       d.role       ?? d.ROLE       ?? '',
    department: d.department ?? d.DEPARTMENT ?? '',
    salary:     toNum(d.salary ?? d.SALARY),
    status:     d.status     ?? d.STATUS     ?? 'Active',
    join_date:  d.joinDate   ?? d.join_date  ?? d.JOIN_DATE ?? null,
  };
}

export function mapEmployeeFromSupabase(r: any) {
  return {
    id:         r.id,
    name:       r.name       ?? '',
    role:       r.role       ?? '',
    department: r.department ?? '',
    salary:     Number(r.salary) || 0,
    status:     r.status     ?? '',
    joinDate:   r.join_date  ?? '',
  };
}

// ─── AUDIT LOGS ───────────────────────────────────────────────────────────────

/**
 * Maps an audit log entry to the Supabase `audit_logs` table schema.
 *
 * DB columns   ← Frontend key
 * ─────────────────────────────────────────────────────────────────────────────
 * action       ← action
 * performed_by ← performedBy | performed_by (defaults to 'Admin')
 * details      ← details
 * timestamp    ← timestamp (ISO 8601, auto-set if absent)
 */

// ─── R&D PROJECTS ─────────────────────────────────────────────────────────────

/**
 * Maps a frontend RDProject object to the Supabase `rd_projects` table schema.
 *
 * DB columns          ← Frontend key
 * ─────────────────────────────────────────────────────────────────────────────
 * id                  ← id
 * title               ← title
 * product_code        ← productCode
 * dosage_form         ← dosageForm
 * strength            ← strength
 * therapeutic_category ← therapeuticCategory
 * shelf_life          ← shelfLife
 * storage_condition   ← storageCondition
 * manufacturing_process ← manufacturingProcess
 * quality_standards   ← qualityStandards
 * regulatory_status   ← regulatoryStatus
 * status              ← status
 * ingredients         ← ingredients (JSON)
 * packing_materials   ← packingMaterials (JSON)
 * optimization_score  ← optimizationScore
 * ai_optimization_notes ← aiOptimizationNotes
 * last_updated       ← lastUpdated
 * batch_size         ← batchSize
 * batch_unit         ← batchUnit
 * total_rmc          ← totalRMC
 * loss               ← loss
 * total_final_rmc    ← totalFinalRMC
 * versions           ← versions (JSON)
 */
export function mapRDProjectToSupabase(d: any): Record<string, any> {
  return {
    id:                  d.id                  ?? '',
    title:               d.title               ?? '',
    product_code:        d.productCode         ?? null,
    dosage_form:         d.dosageForm          ?? null,
    strength:            d.strength            ?? null,
    therapeutic_category: d.therapeuticCategory ?? null,
    shelf_life:          d.shelfLife           ?? null,
    storage_condition:   d.storageCondition    ?? null,
    manufacturing_process: d.manufacturingProcess ?? null,
    quality_standards:   d.qualityStandards    ?? null,
    regulatory_status:   d.regulatoryStatus    ?? null,
    status:              d.status              ?? 'Formulation',
    ingredients:         JSON.stringify(d.ingredients ?? []),
    packing_materials:   JSON.stringify(d.packingMaterials ?? []),
    optimization_score:  Number(d.optimizationScore) || 0,
    ai_optimization_notes: d.aiOptimizationNotes ?? null,
    last_updated:        d.lastUpdated         ?? new Date().toISOString(),
    batch_size:          Number(d.batchSize)   || 0,
    batch_unit:          d.batchUnit           ?? 'Kg',
    total_rmc:           Number(d.totalRMC)    || 0,
    loss:                Number(d.loss)        || 0,
    total_final_rmc:     Number(d.totalFinalRMC) || 0,
    versions:            JSON.stringify(d.versions ?? []),
  };
}

/**
 * Reverse-maps a Supabase `rd_projects` row back to the frontend RDProject shape.
 *
 * Frontend key        ← DB columns
 * ─────────────────────────────────────────────────────────────────────────────
 * id                  ← id
 * title               ← title
 * productCode         ← product_code
 * dosageForm          ← dosage_form
 * strength            ← strength
 * therapeuticCategory ← therapeutic_category
 * shelfLife           ← shelf_life
 * storageCondition    ← storage_condition
 * manufacturingProcess ← manufacturing_process
 * qualityStandards    ← quality_standards
 * regulatoryStatus    ← regulatory_status
 * status              ← status
 * ingredients         ← ingredients (JSON)
 * packingMaterials    ← packing_materials (JSON)
 * optimizationScore   ← optimization_score
 * aiOptimizationNotes ← ai_optimization_notes
 * lastUpdated        ← last_updated
 * batchSize          ← batch_size
 * batchUnit          ← batch_unit
 * totalRMC           ← total_rmc
 * loss               ← loss
 * totalFinalRMC      ← total_final_rmc
 * versions           ← versions (JSON)
 */
export function mapRDProjectFromSupabase(r: any): RDProject {
  return {
    id:                  r.id                  ?? '',
    title:               r.title               ?? '',
    productCode:         r.product_code        ?? undefined,
    dosageForm:          r.dosage_form         ?? undefined,
    strength:            r.strength            ?? undefined,
    therapeuticCategory: r.therapeutic_category ?? undefined,
    shelfLife:           r.shelf_life          ?? undefined,
    storageCondition:    r.storage_condition   ?? undefined,
    manufacturingProcess: r.manufacturing_process ?? undefined,
    qualityStandards:    r.quality_standards   ?? undefined,
    regulatoryStatus:    r.regulatory_status   ?? undefined,
    status:              r.status              ?? 'Formulation',
    ingredients:         r.ingredients ? JSON.parse(r.ingredients) : [],
    packingMaterials:    r.packing_materials ? JSON.parse(r.packing_materials) : [],
    optimizationScore:   Number(r.optimization_score) || 0,
    aiOptimizationNotes: r.ai_optimization_notes ?? undefined,
    lastUpdated:         r.last_updated        ?? new Date().toISOString(),
    batchSize:           Number(r.batch_size)  || 0,
    batchUnit:           r.batch_unit          ?? 'Kg',
    totalRMC:            Number(r.total_rmc)   || 0,
    loss:                Number(r.loss)        || 0,
    totalFinalRMC:       Number(r.total_final_rmc) || 0,
    versions:            r.versions ? JSON.parse(r.versions) : [],
  };
}
export function mapAuditLogToSupabase(d: any): Record<string, any> {
  return {
    action:       d.action       ?? '',
    performed_by: d.performedBy  ?? d.performed_by ?? 'Admin',
    details:      d.details      ?? '',
    timestamp:    d.timestamp    ?? new Date().toISOString(),
  };
}

// ─── SECTION → MAPPER ROUTER ─────────────────────────────────────────────────

/**
 * Returns the correct toSupabase mapper for a given section string.
 * Throws a typed Error immediately on unknown sections — stops retry loops.
 */
export function getMapperForSection(section: string): (d: any) => Record<string, any> {
  const map: Record<string, (d: any) => Record<string, any>> = {
    inventory:  mapInventoryToSupabase,
    production: mapProductionToSupabase,
    sales:      mapOrderToSupabase,
    accounting: mapExpenseToSupabase,
    hr:         mapEmployeeToSupabase,
  };
  const mapper = map[section];
  if (!mapper) {
    throw new Error(`[dbMapper] No mapper registered for section: "${section}". Halting to prevent silent data corruption.`);
  }
  return mapper;
}

// ─────────────────────────────────────────────────────────────────────────────
// AI INGESTION JSON TEMPLATE
// ─────────────────────────────────────────────────────────────────────────────
//
// Use the object below to instruct an AI model (Gemini Vision, GPT-4o, etc.)
// on the EXACT JSON format it must output after extracting data from an
// uploaded invoice, packing list, or purchase order.
//
// Rules for the AI:
//   1. ALL keys must match exactly (case-sensitive).
//   2. Numeric fields must be plain numbers — no commas, no currency symbols.
//   3. Dates must be ISO 8601: "YYYY-MM-DD".
//   4. Leave unknown fields as null.
//   5. Wrap the output in { "table": "<tableName>", "rows": [ ... ] }.
// ─────────────────────────────────────────────────────────────────────────────

export const AI_INGESTION_TEMPLATE = {
  orders: {
    _table: 'orders',
    _description: 'One object per line item on the invoice / proforma.',
    _fieldGuide: {
      id:              'string | null  — Leave null; system will generate.',
      sNo:             'string         — Serial / line number on the document.',
      invoiceNo:       'string         — Invoice or PI number, e.g. "INV-2024-001".',
      date:            'string         — Invoice date as YYYY-MM-DD.',
      customer:        'string         — Buyer / party name.',
      country:         'string         — Destination country.',
      product:         'string         — Product name or description.',
      quantity:        'number         — Quantity in KG (plain number, no commas).',
      rateUSD:         'number         — Unit rate in USD per KG.',
      amountUSD:       'number         — Total line value in USD. Omit or set 0 to auto-calculate.',
      amountOMR:       'number         — Total in OMR. Omit or set 0 to auto-calculate.',
      status:          'string         — One of: Pending | Shipped | Delivered | Cancelled.',
      lcNo:            'string         — LC number or BIC number if present.',
      paymentMethod:   'string         — e.g. LC, TT, CAD.',
      shippingMethod:  'string         — e.g. Sea, Air, Road.',
      market:          'string         — Target market name.',
      notes:           'string         — Any remarks or special conditions.',
      deliveryDate:    'string | null  — Expected delivery date as YYYY-MM-DD.',
    },
    _example: {
      id:             null,
      sNo:            '1',
      invoiceNo:      'INV-2024-001',
      date:           '2024-06-15',
      customer:       'Al-Rashid Pharma',
      country:        'Saudi Arabia',
      product:        'Amoxicillin 500mg Capsules',
      quantity:       5000,
      rateUSD:        2.50,
      amountUSD:      12500,
      amountOMR:      0,
      status:         'Pending',
      lcNo:           'LC-2024-XYZ',
      paymentMethod:  'LC',
      shippingMethod: 'Sea',
      market:         'GCC',
      notes:          'Handle with care. Cold-chain shipment.',
      deliveryDate:   '2024-07-30',
    },
  },

  inventory: {
    _table: 'inventory',
    _description: 'One object per raw material / packing material line.',
    _fieldGuide: {
      id:                'string | null',
      sNo:               'string  — Serial number.',
      name:              'string  — Material name.',
      category:          'string  — One of: API | Excipient | Packing | Finished | R&D | Spare | Other.',
      stock:             'number  — Present stock quantity.',
      requiredForOrders: 'number  — Quantity required to fulfil open orders.',
      balanceToPurchase: 'number  — Quantity still to be purchased.',
      unit:              'string  — e.g. kg, pcs, litre.',
      stockDate:         'string  — Date of last stock count as YYYY-MM-DD.',
    },
    _example: {
      id: null, sNo: '1', name: 'Amoxicillin Trihydrate API',
      category: 'API', stock: 1200, requiredForOrders: 800,
      balanceToPurchase: 400, unit: 'kg', stockDate: '2024-06-01',
    },
  },

  production: {
    _table: 'production_yields',
    _description: 'One object per production batch.',
    _fieldGuide: {
      id:            'string | null',
      product:       'string  — Product name.',
      quantity:      'number  — Batch input quantity (KG).',
      actualYield:   'number  — Actual output (KG).',
      expectedYield: 'number  — Planned output (KG).',
      status:        'string  — One of: Scheduled | In-Progress | Completed | Quarantine.',
      timestamp:     'string  — Batch start timestamp ISO 8601.',
      dispatchDate:  'string | null — Dispatch date YYYY-MM-DD.',
    },
    _example: {
      id: null, product: 'Amoxicillin 500mg', quantity: 1000,
      actualYield: 970, expectedYield: 980,
      status: 'Completed', timestamp: '2024-06-10T08:00:00Z',
      dispatchDate: '2024-06-12',
    },
  },

  expenses: {
    _table: 'expenses',
    _description: 'One object per expense line.',
    _fieldGuide: {
      id:          'string | null',
      description: 'string  — What the expense is for.',
      category:    'string  — One of: Utilities | Salaries | Maintenance | Logistics | Raw Materials.',
      amount:      'number  — Amount in OMR.',
      status:      'string  — One of: Paid | Pending.',
      dueDate:     'string  — Due date as YYYY-MM-DD.',
    },
    _example: {
      id: null, description: 'Freight charges - June shipment',
      category: 'Logistics', amount: 450.500,
      status: 'Pending', dueDate: '2024-07-01',
    },
  },

  employees: {
    _table: 'employees',
    _description: 'One object per employee.',
    _fieldGuide: {
      id:         'string | null',
      name:       'string  — Full name.',
      role:       'string  — Job title.',
      department: 'string  — One of: Production | QC | Sales | Admin | R&D.',
      salary:     'number  — Monthly salary in OMR.',
      status:     'string  — One of: Active | On Leave | Terminated.',
      joinDate:   'string  — Joining date as YYYY-MM-DD.',
    },
    _example: {
      id: null, name: 'Ahmed Al-Balushi', role: 'QC Analyst',
      department: 'QC', salary: 850, status: 'Active', joinDate: '2023-03-01',
    },
  },
} as const;
