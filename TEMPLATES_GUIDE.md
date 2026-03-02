# Templates Guide — Al Wajer ERP Data Formats

**How to prepare files for AI Import, and how to use CSV exports effectively.**

---

## Overview

Every module in the ERP has an **"⬆ AI Import"** button that accepts:
- `.csv` files
- `.xlsx` / `.xls` Excel files
- `.txt` or `.json` structured text
- `.pdf` reports

The AI reads the file and **automatically** maps fields to the correct data structure. You don't need to format your files perfectly — the AI is smart enough to figure it out from rough data.

---

## Module Templates

### 📦 Inventory — Raw Materials

**CSV Format:**
```csv
S.No,Name of Material,Required Material for Present Orders,Present Stock,Balance RM to be Purchase,Unit,Category
1,OMEPRAZOLE POWDER,1105,15,1090,kg,API
2,Esomeprazole,1600,55,1545,kg,API
26,HPMC E-5,3000,8642,-5642,kg,Excipient
```

**Fields the AI looks for:**
| Field | Aliases |
|-------|---------|
| `name` | Material Name, Raw Material, Item |
| `stock` | Present Stock, Current Stock, On Hand |
| `requiredForOrders` | Required, Required for Orders, Needed |
| `balanceToPurchase` | Balance, To Purchase, Deficit |
| `category` | Type, Class (API, Excipient, Packaging) |
| `unit` | UOM, Unit of Measure |

---

### 💰 Sales Orders

**CSV Format:**
```csv
Sno,Date,Invoice No.,Party,LC No / BIC No,Country,Product,Qty (KG),Rate $,Amount $,Amount (OMR),Status
1,2025-01-19,AWP/INV-01-25,FEROZSONS,-,Pakistan,Esomeprazole EC Pellets 22.5%,5000,24,120000,46200,Pending
2,2025-02-05,AWP/INV-02-25,Gulf Medical Supplies,LC-2501,UAE,Omeprazole Pellets 8.5%,3000,18,54000,20790,Processing
```

**Fields the AI looks for:**
| Field | Aliases |
|-------|---------|
| `customer` | Party, Customer Name, Buyer |
| `invoiceNo` | Invoice No., INV, Invoice Number |
| `date` | Date, Invoice Date |
| `country` | Country, Destination |
| `product` | Product, Item, Description |
| `quantity` | Qty, Qty (KG), Quantity |
| `rateUSD` | Rate $, Rate USD, Unit Price |
| `amountUSD` | Amount $, USD Amount |
| `amountOMR` | Amount (OMR), OMR |
| `status` | Status, Payment Status |
| `lcNo` | LC No, BIC No, LC Number |

---

### 🏭 Manufacturing Batches

**CSV Format:**
```csv
Batch ID,Product,Quantity (kg),Actual Yield %,Expected Yield %,Status,Dispatch Date
B-25-101,Esomeprazole EC Pellets 22.5%,5000,99.2,100,In-Progress,2025-12-15
B-25-102,Omeprazole Pellets 8.5%,3000,98.5,100,QC Hold,2025-12-10
```

**Fields the AI looks for:**
| Field | Aliases |
|-------|---------|
| `product` | Product, Product Name |
| `quantity` | Qty, Quantity, Batch Size |
| `actualYield` | Actual Yield, Yield %, Actual % |
| `expectedYield` | Expected Yield, Target % |
| `status` | Status (In-Progress, QC Hold, Dispatched) |
| `dispatchDate` | Dispatch Date, ETA |

---

### 💳 Expenses

**CSV Format:**
```csv
Description,Category,Amount (OMR),Due Date,Status
Monthly Electricity – Sohar Plant,Utilities,14500,2025-12-05,Pending
Astra Biotech API Payment,Raw Materials,85000,2025-11-15,Paid
```

**Valid categories:** Utilities, Raw Materials, Logistics, Maintenance, Salaries, Other

---

### 👥 Employees

**CSV Format:**
```csv
Name,Role,Department,Salary (OMR),Join Date,Status
Dr. Sarah Ahmed,Head of R&D,R&D,12000,2023-05-12,Active
John Doe,Production Manager,Production,8500,2022-10-01,Active
```

**Valid departments:** Production, R&D, QC, Procurement, Finance, HR, Sales, Admin

---

### 🔬 R&D Formulations

**CSV Format:**
```csv
Raw Material,Per B. Qty,Unit,Rate USD,Cost,Role
Esomeprazole Magnesium Trihydrate,28.5,Kg,48,1368,API
NPS 20/24,43.637,Kg,2.05,89.46,Filler
HPMC E5 (Layer 1),13.12,Kg,7.25,95.12,Binder
Drug Coat L30 D,86.66,Kg,4.20,364,Coating
```

> **Tip**: You can also import a picture of your formulation sheet! The AI can read handwritten or printed tables from JPEG/PNG images.

---

## AI Import Tips

### ✅ Best Practices

1. **Column headers help** — any recognizable header names work
2. **Partial data is fine** — missing fields will be left empty
3. **Mixed formats** — the AI handles inconsistent formatting
4. **Multiple tables** — if your file has multiple tables, the AI imports the most relevant one

### 📊 Excel Files

- Export as `.csv` for best results
- Or use `.xlsx` directly — the AI will read text content
- Merged cells may cause issues — prefer flat tables

### 🖼️ Images of Documents

The AI can read:
- Photographs of printed spreadsheets
- Scanned documents
- WhatsApp/phone photos of your paper records
- Screenshots

For best results with images:
- Good lighting, minimal blur
- Horizontal orientation
- Avoid cutting off column headers

### 📄 PDF Files

- Works best with digital PDFs (not scanned images)
- Table structure helps the AI extract data correctly

---

## Export Formats

Every module has an **"⬇ Export CSV"** button that downloads:

| Module | Filename |
|--------|----------|
| Inventory | `inventory_YYYY-MM-DD.csv` |
| Sales | `sales_YYYY-MM-DD.csv` |
| Manufacturing | `production_YYYY-MM-DD.csv` |
| Accounting | `expenses_YYYY-MM-DD.csv` |
| HR | `employees_YYYY-MM-DD.csv` |
| Audit Log | `audit_log_YYYY-MM-DD.csv` |

CSV files open directly in Excel, Google Sheets, or any spreadsheet application.

---

## Workflow Example: Importing Your Sales File

1. Open your Excel sales file (`Sales-(20-11-2025).xlsx`)
2. Save as CSV: **File → Save As → CSV (Comma delimited)**
3. In the ERP, go to **Sales** module
4. Click **⬆ AI Import**
5. Select your CSV file
6. Watch the progress bar: **Reading → Analyzing → Importing**
7. Your orders appear automatically!

---

## Workflow Example: Importing Inventory from a Photo

1. Take a clear photo of your stock sheet (like `IMG_0488.jpeg`)
2. In the ERP, go to **Inventory** module
3. Click **⬆ AI Import**
4. Select the photo file
5. The AI reads the table from the image and imports the rows

---

## Data Validation

After importing, always check:
- ✅ Correct number of rows imported
- ✅ Names match your expectations
- ✅ Numbers are correctly parsed
- ✅ Statuses are valid values

If something looks wrong, you can manually delete incorrect entries and re-import.

---

## Supabase — Persisting Your Data

After importing data, it's saved to:
1. **App state** (immediate, resets on refresh)
2. **Supabase database** (permanent, if configured)

To ensure data persists:
1. Go to **Settings** (⚙️)
2. Enter your Supabase URL and key
3. Save & Reload
4. Re-import your data — it will now persist permanently

---

*For technical documentation, see `README.md`*
*For setup instructions, see `INSTALLATION_GUIDE.md`*
