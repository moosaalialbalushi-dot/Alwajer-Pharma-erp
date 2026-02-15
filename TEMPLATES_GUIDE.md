# Alwajer Pharma ERP - Data Import Templates

To ensure 100% compatibility with the AI import system, please use the following column headers in your Excel or CSV files.

## 1. Inventory Template (Procurement/Shortages)
Use these headers for raw materials, packaging, and APIs.

| S.No | Material Name | Required Quantity | Present Stock | Unit | Stock Date |
|------|---------------|-------------------|---------------|------|------------|
| 1    | OMEPRAZOLE    | 1105              | 15            | kg   | 31.12.25   |
| 2    | HPMC E-5      | 3000              | 8642          | kg   | 31.12.25   |

**Note:** The system automatically calculates "Balance to Purchase" as (Required - Stock).

---

## 2. Sales Template (Business Development)
Use these headers for tracking orders and invoices.

| Invoice No | Date       | Party / Customer | Country  | Product Name | Qty (KG) | Rate USD | Amount USD | Status  |
|------------|------------|------------------|----------|--------------|----------|----------|------------|---------|
| AWP/INV-01 | 2025-01-19 | FEROZSONS        | Pakistan | Esomeprazole | 5000     | 24       | 120000     | Pending |

**Note:** OMR amount is automatically calculated based on the current exchange rate (0.385).

---

## 3. R&D / Formulation Template
Use these headers for product costing and recipes.

| Raw Material | Unit | Per B. Qty | Rate USD |
|--------------|------|------------|----------|
| Esomeprazole | Kg   | 28.5       | 46       |
| NPS 20/24    | Kg   | 43.637     | 2.05     |

**Note:** Ensure you include the "Batch Size" or "Output" in a cell so the AI can identify the total yield.

---

## How to Import
1. Click the **GLOBAL SYNC** button in the top right of the ERP.
2. Upload your file (Excel, CSV, or even a clear Screenshot).
3. The AI will process the data and update your tables instantly.
4. Check the **Live DB** status to ensure data is synced to the cloud.
