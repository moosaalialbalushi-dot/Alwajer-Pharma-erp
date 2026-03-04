import pandas as pd
import json, os

output_dir = r"c:\Users\User\New erp"

# ── 1. Read and clean the Sales Report CSV ─────────────────────────────────

csv_path = os.path.join(output_dir, "sales_report (2).csv")
df_sales = pd.read_csv(csv_path)

# Keep only meaningful columns (drop duplicates like sNo/invoiceNo/amountUSD/amountOMR)
sales_cols = ["invoice_no", "customer", "country", "product",
              "quantity", "amount_usd", "amount_omr", "status", "date",
              "payment_method", "shipping_method"]
df_sales_clean = df_sales[sales_cols].copy()

# Normalise country "-" → "Unknown"
df_sales_clean["country"] = df_sales_clean["country"].replace("-", "Unknown").replace(" ", "Unknown").str.strip()

# Ensure proper dtypes
df_sales_clean["quantity"] = pd.to_numeric(df_sales_clean["quantity"], errors="coerce").fillna(0).astype(int)
df_sales_clean["amount_usd"] = pd.to_numeric(df_sales_clean["amount_usd"], errors="coerce").fillna(0)
df_sales_clean["amount_omr"] = pd.to_numeric(df_sales_clean["amount_omr"], errors="coerce").fillna(0)
df_sales_clean["customer"] = df_sales_clean["customer"].str.strip()

# Sort by date then customer
df_sales_clean["date"] = pd.to_datetime(df_sales_clean["date"], errors="coerce")
df_sales_clean = df_sales_clean.sort_values(["date", "customer"]).reset_index(drop=True)

# Save cleaned CSV
sales_out = os.path.join(output_dir, "sales_report_cleaned.csv")
df_sales_clean.to_csv(sales_out, index=False)
print(f"✅ Sales report cleaned → {sales_out}")
print(f"   Rows: {len(df_sales_clean)}  |  Columns: {list(df_sales_clean.columns)}")
print(df_sales_clean.to_string())

# ── 2. Read every sheet from the Supply Chain XLSX ─────────────────────────

xlsx_path = os.path.join(output_dir, "Supply Chain Planning for Quarterly QTY Avg 14MT -Bricks.xlsx")
xl = pd.ExcelFile(xlsx_path)
print(f"\n📄 XLSX sheets found: {xl.sheet_names}")

all_sheets = {}
for sheet in xl.sheet_names:
    df = xl.parse(sheet, header=None)
    all_sheets[sheet] = df
    print(f"\n─── Sheet: {sheet}  ({df.shape[0]} rows × {df.shape[1]} cols) ───")
    print(df.to_string())

# ── 3. Try to normalise the first non-empty sheet as main supply chain table ─

for sheet_name, df_raw in all_sheets.items():
    # Drop fully-empty rows/columns
    df_raw = df_raw.dropna(how="all").dropna(axis=1, how="all")
    if df_raw.empty:
        continue

    # Use first row that looks like a header
    # Find first row with majority non-null cells
    header_row = 0
    for i, row in df_raw.iterrows():
        non_null = row.dropna()
        if len(non_null) >= max(2, df_raw.shape[1] // 2):
            header_row = i
            break

    df_clean = df_raw.iloc[header_row + 1:].copy()
    df_clean.columns = df_raw.iloc[header_row].values
    df_clean = df_clean.dropna(how="all").reset_index(drop=True)

    out_path = os.path.join(output_dir, f"supply_chain_{sheet_name.replace(' ', '_')}_cleaned.csv")
    df_clean.to_csv(out_path, index=False)
    print(f"\n✅ Supply chain sheet '{sheet_name}' cleaned → {out_path}")
    print(df_clean.to_string())

print("\n\n=== SUMMARY ===")
print(f"Sales Report Cleaned  → sales_report_cleaned.csv")
print(f"Supply Chain Sheet(s) → supply_chain_*_cleaned.csv")
