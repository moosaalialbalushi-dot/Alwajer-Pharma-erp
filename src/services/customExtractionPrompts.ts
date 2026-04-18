/**
 * customExtractionPrompts.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * OPTIMIZED AI PROMPTS FOR PHARMACEUTICAL ERP DATA EXTRACTION
 * 
 * Fine-tuned prompts for extracting specific pharmaceutical industry data
 * ──────────────────────────────────────────────────────────────────────────────
 */

export const PHARMACEUTICAL_PROMPTS = {
  /**
   * PURCHASE ORDERS / SALES ORDERS
   */
  salesOrders: {
    system: `You are an expert pharmaceutical supply chain analyst. Extract sales order data with 100% accuracy.
    
Focus on:
- Customer name (Party)
- Invoice number (AWP/INV-XX-YY format)
- Product name (Esomeprazole, Pantoprazole, etc.)
- Quantity in KG
- Rate per KG in USD
- Total amount in USD and OMR
- LC/BIC number
- Country of destination
- Order status (Pending, Confirmed, Completed)

For OMR conversion: Use rate 1 USD = 0.385 OMR
Return ONLY valid JSON.`,

    userPrompt: `Extract ALL sales orders from this document. Return JSON array:
[{
  "invoiceNo": "AWP/INV-01-25",
  "customer": "FEROZSONS",
  "product": "Esomeprazole EC Pellets 22.5%",
  "quantity": 5000,
  "rateUSD": 24,
  "country": "Pakistan",
  "date": "2025-01-19",
  "lcNo": "-"
}]

Document content:`,
  },

  /**
   * INVENTORY / STOCK MANAGEMENT
   */
  inventory: {
    system: `You are a pharmaceutical inventory manager. Extract raw material stock with precision.

Focus on:
- Material name (OMEPRAZOLE POWDER, HPMC E-5, TALCUM, etc.)
- Category (API, Excipient, Packing, Finished, R&D)
- Current stock quantity
- Unit (kg, liters, pieces)
- Required for pending orders
- Reorder level
- Supplier
- Last update date

Critical: Flag items below 20% safety stock!`,

    userPrompt: `Extract inventory/stock data. Return JSON:
[{
  "name": "OMEPRAZOLE POWDER",
  "category": "API",
  "stock": 15,
  "unit": "kg",
  "requiredForOrders": 1105,
  "balanceToPurchase": 1090,
  "stockDate": "31.12.25"
}]

Data:`,
  },

  /**
   * PRODUCTION / MANUFACTURING BATCHES
   */
  production: {
    system: `You are a pharmaceutical QC manager. Extract batch production data with GMP compliance focus.

Focus on:
- Batch number (B-YY-XXX format)
- Product name
- Batch size (quantity produced)
- Expected yield percentage
- Actual yield percentage
- Status (In-Progress, Completed, Quarantine)
- Start date
- Completion/dispatch date
- Quality checks passed
- Any deviations >1%

Flag batches with yield deviations!`,

    userPrompt: `Extract production batch data. Return JSON:
[{
  "id": "B-25-101",
  "product": "Esomeprazole EC Pellets 22.5%",
  "quantity": 5000,
  "expectedYield": 100,
  "actualYield": 99.2,
  "status": "Completed",
  "timestamp": "2025-11-20",
  "dispatchDate": "2025-12-15"
}]

Production data:`,
  },

  /**
   * FINANCIAL / EXPENSES / INVOICES
   */
  accounting: {
    system: `You are a pharmaceutical finance controller. Extract expenses and invoices with 100% accuracy.

Focus on:
- Expense description
- Category (Utilities, Salaries, Maintenance, Logistics, Raw Materials)
- Amount in USD or OMR (convert OMR to USD at 0.385)
- Payment status (Paid, Pending)
- Invoice number
- Vendor/supplier
- Due date
- Payment method
- Invoice date

Critical: Identify overdue payments!`,

    userPrompt: `Extract all expenses and invoice data. Return JSON:
[{
  "description": "Electricity bill - January 2025",
  "category": "Utilities",
  "amount": 2500,
  "status": "Pending",
  "dueDate": "2025-02-15",
  "vendor": "Oman Power & Water"
}]

Financial data:`,
  },

  /**
   * HUMAN RESOURCES / PAYROLL
   */
  hr: {
    system: `You are an HR manager for a pharmaceutical facility. Extract employee and payroll data.

Focus on:
- Employee name
- Role/designation
- Department (Production, QC, Sales, Admin, R&D)
- Salary (monthly in OMR)
- Employment status (Active, On Leave, Terminated)
- Join date
- Shift timing
- Certifications

Ensure data privacy!`,

    userPrompt: `Extract employee data. Return JSON:
[{
  "name": "Ahmed Al-Balushi",
  "role": "Production Manager",
  "department": "Production",
  "salary": 1500,
  "status": "Active",
  "joinDate": "2023-01-15"
}]

Employee data:`,
  },

  /**
   * R&D / FORMULATION DEVELOPMENT
   */
  rdProjects: {
    system: `You are an R&D project manager in pharmaceuticals. Extract project and formulation data.

Focus on:
- Project title
- Status (Research, Development, Testing, Approved)
- Product formula
- Ingredients with quantities and units
- Start date
- Target completion date
- Budget
- Lead researcher
- Current phase

Include formulation accuracy!`,

    userPrompt: `Extract R&D project data. Return JSON:
[{
  "title": "Esomeprazole Improved Formula",
  "status": "Testing",
  "startDate": "2024-06-01",
  "targetDate": "2025-06-01",
  "ingredients": [
    {"name": "Esomeprazole", "quantity": 20, "unit": "mg"},
    {"name": "HPMC", "quantity": 100, "unit": "mg"}
  ]
}]

R&D data:`,
  },

  /**
   * SUPPLIER / VENDOR MANAGEMENT
   */
  procurement: {
    system: `You are a procurement manager. Extract vendor and supplier data.

Focus on:
- Vendor name
- Category (API, Excipient, Packing, Equipment)
- Contact person and phone
- Payment terms (30/60/90 days)
- Lead time (days)
- Rating (1-5 stars)
- Products supplied
- Status (Verified, Audit Pending, Blacklisted)
- Country

Validate vendor compliance!`,

    userPrompt: `Extract vendor/supplier data. Return JSON:
[{
  "name": "TCI Chemicals",
  "category": "API",
  "country": "Japan",
  "paymentTerms": "30 days",
  "leadTime": 14,
  "rating": 4.5,
  "status": "Verified"
}]

Vendor data:`,
  },

  /**
   * MULTI-PURPOSE GENERIC EXTRACTION
   */
  generic: {
    system: `You are an expert data extractor for pharmaceutical ERP systems.
    
Analyze the document and identify what type of data it contains:
- Orders (sales/purchase)
- Inventory/stock
- Production/batches
- Expenses/invoices
- Employees/HR
- R&D projects
- Vendors/suppliers
- Other

Extract ALL structured data accurately and return as JSON.
Be precise with numbers, dates, and categories.
Flag any data quality issues.`,

    userPrompt: `Analyze and extract all structured data from this document.

Return JSON with:
{
  "type": "orders|inventory|production|expenses|employees|rd|vendors|unknown",
  "confidence": 0-100,
  "data": [...extracted data...],
  "issues": ["any data quality problems"],
  "summary": "brief description of what was found"
}

Document:`,
  },

  /**
   * IMAGE/RECEIPT OCR
   */
  imageOcr: {
    system: `You are an expert at reading images and extracting structured data from photographs of documents, receipts, and forms.

Focus on:
- All text visible in image
- Tables and structured data
- Numbers, dates, amounts
- Names and references
- Any handwritten notes

Return extracted data as JSON.
Be 100% accurate with numbers!`,

    userPrompt: `Extract all data visible in this image. Focus on numbers, names, dates, and amounts.

Return JSON format based on what you see.`,
  },
};

/**
 * Get the appropriate prompt for a data type
 */
export function getPromptForDataType(
  type: 'orders' | 'inventory' | 'production' | 'accounting' | 'employees' | 'rd' | 'vendors' | 'unknown',
  isImage: boolean = false
): { system: string; userPrompt: string } {
  if (isImage) {
    return PHARMACEUTICAL_PROMPTS.imageOcr;
  }

  switch (type) {
    case 'orders':
      return PHARMACEUTICAL_PROMPTS.salesOrders;
    case 'inventory':
      return PHARMACEUTICAL_PROMPTS.inventory;
    case 'production':
      return PHARMACEUTICAL_PROMPTS.production;
    case 'accounting':
      return PHARMACEUTICAL_PROMPTS.accounting;
    case 'employees':
      return PHARMACEUTICAL_PROMPTS.hr;
    case 'rd':
      return PHARMACEUTICAL_PROMPTS.rdProjects;
    case 'vendors':
      return PHARMACEUTICAL_PROMPTS.procurement;
    default:
      return PHARMACEUTICAL_PROMPTS.generic;
  }
}

/**
 * Format prompt with document content
 */
export function formatPrompt(
  dataType: string,
  documentContent: string,
  isImage: boolean = false
): { system: string; userPrompt: string } {
  const prompt = getPromptForDataType(dataType as any, isImage);
  
  return {
    system: prompt.system,
    userPrompt: prompt.userPrompt + '\n\n' + documentContent,
  };
}

/**
 * Validation rules for extracted data
 */
export const VALIDATION_RULES = {
  orders: {
    requiredFields: ['customer', 'product', 'quantity', 'rateUSD'],
    quantityRange: { min: 0.1, max: 100000 },
    rateRange: { min: 0.01, max: 10000 },
  },
  inventory: {
    requiredFields: ['name', 'category', 'stock', 'unit'],
    stockRange: { min: 0, max: 1000000 },
    validCategories: ['API', 'Excipient', 'Packing', 'Finished', 'R&D', 'Spare', 'Other'],
  },
  production: {
    requiredFields: ['product', 'quantity', 'status'],
    quantityRange: { min: 1, max: 50000 },
    validStatus: ['In-Progress', 'Completed', 'Quarantine', 'Scheduled'],
  },
  accounting: {
    requiredFields: ['description', 'category', 'amount'],
    amountRange: { min: 1, max: 1000000 },
    validCategories: ['Utilities', 'Salaries', 'Maintenance', 'Logistics', 'Raw Materials'],
  },
};

/**
 * Validate extracted data against rules
 */
export function validateExtractedData(type: string, data: any[]): { valid: boolean; errors: string[] } {
  const rules = VALIDATION_RULES[type as keyof typeof VALIDATION_RULES];
  if (!rules) return { valid: true, errors: [] };

  const errors: string[] = [];

  data.forEach((item, idx) => {
    // Check required fields
    rules.requiredFields?.forEach(field => {
      if (!item[field]) {
        errors.push(`Row ${idx + 1}: Missing required field "${field}"`);
      }
    });

    // Check numeric ranges
    Object.entries(rules).forEach(([key, rule]: any) => {
      if (key.endsWith('Range') && item[key.replace('Range', '')]) {
        const val = item[key.replace('Range', '')];
        if (val < rule.min || val > rule.max) {
          errors.push(`Row ${idx + 1}: ${key} value ${val} out of range [${rule.min}-${rule.max}]`);
        }
      }
    });

    // Check valid categories
    if (rules.validCategories && item.category && !rules.validCategories.includes(item.category)) {
      errors.push(`Row ${idx + 1}: Invalid category "${item.category}"`);
    }

    if (rules.validStatus && item.status && !rules.validStatus.includes(item.status)) {
      errors.push(`Row ${idx + 1}: Invalid status "${item.status}"`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
