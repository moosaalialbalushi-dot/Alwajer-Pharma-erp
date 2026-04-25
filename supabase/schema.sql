-- Al Wajer Pharmaceutical ERP — Supabase schema
-- Safe to re-run: uses CREATE TABLE IF NOT EXISTS throughout.

create extension if not exists "pgcrypto";

-- ─── Batches (Manufacturing) ─────────────────────────────────────────
create table if not exists public.batches (
  id              text primary key,
  product         text,
  quantity        numeric,
  "actualYield"   numeric,
  "expectedYield" numeric,
  status          text,
  timestamp       text,
  "dispatchDate"  text
);

-- ─── Inventory ───────────────────────────────────────────────────────
create table if not exists public.inventory (
  id                   text primary key,
  "sNo"                text,
  name                 text,
  category             text,
  "requiredForOrders"  numeric,
  stock                numeric,
  "balanceToPurchase"  numeric,
  unit                 text,
  "stockDate"          text,
  "safetyStock"        numeric
);

-- ─── Orders ──────────────────────────────────────────────────────────
create table if not exists public.orders (
  id                   text primary key,
  "sNo"                text,
  date                 text,
  "invoiceNo"          text,
  customer             text,
  "lcNo"               text,
  country              text,
  product              text,
  quantity             numeric,
  "rateUSD"            numeric,
  "amountUSD"          numeric,
  "amountOMR"          numeric,
  status               text,
  "materialDispatched" text,
  "paymentTerms"       text,
  "receivedAmountOMR"  numeric,
  "pendingAmountOMR"   numeric,
  remarks              text,
  "paymentMethod"      text,
  "shippingMethod"     text
);

-- ─── Expenses ────────────────────────────────────────────────────────
create table if not exists public.expenses (
  id          text primary key,
  description text,
  category    text,
  amount      numeric,
  status      text,
  "dueDate"   text
);

-- ─── Employees ───────────────────────────────────────────────────────
create table if not exists public.employees (
  id         text primary key,
  name       text,
  role       text,
  department text,
  salary     numeric,
  status     text,
  "joinDate" text
);

-- ─── Vendors ─────────────────────────────────────────────────────────
create table if not exists public.vendors (
  id       text primary key,
  name     text,
  category text,
  rating   numeric,
  status   text,
  country  text
);

-- ─── BD Leads ────────────────────────────────────────────────────────
create table if not exists public.bd_leads (
  id               text primary key,
  "targetMarket"   text,
  opportunity      text,
  "potentialValue" text,
  status           text,
  probability      numeric
);

-- ─── Samples ─────────────────────────────────────────────────────────
create table if not exists public.samples (
  id               text primary key,
  product          text,
  destination      text,
  quantity         text,
  status           text,
  "trackingNumber" text
);

-- ─── Markets ─────────────────────────────────────────────────────────
create table if not exists public.markets (
  id     text primary key,
  name   text,
  region text,
  status text
);

-- ─── R&D Projects ────────────────────────────────────────────────────
create table if not exists public.rd_projects (
  id                     text primary key,
  title                  text,
  "productCode"          text,
  "dosageForm"           text,
  strength               text,
  "therapeuticCategory"  text,
  "shelfLife"            text,
  "storageCondition"     text,
  "manufacturingProcess" text,
  "qualityStandards"     text,
  "regulatoryStatus"     text,
  status                 text,
  ingredients            jsonb default '[]'::jsonb,
  "packingMaterials"     jsonb default '[]'::jsonb,
  "optimizationScore"    numeric,
  "aiOptimizationNotes"  text,
  "lastUpdated"          text,
  "batchSize"            numeric,
  "batchUnit"            text,
  "totalRMC"             numeric,
  loss                   numeric,
  "totalFinalRMC"        numeric,
  versions               jsonb default '[]'::jsonb
);

-- ─── Shipments (Logistics) ───────────────────────────────────────────
create table if not exists public.shipments (
  id                 text primary key,
  "referenceNo"      text,
  product            text,
  quantity           numeric,
  unit               text,
  carrier            text,
  "trackingNumber"   text,
  origin             text,
  destination        text,
  mode               text,
  status             text,
  "dispatchDate"     text,
  "estimatedArrival" text,
  "actualArrival"    text,
  cost               numeric,
  "linkedOrderId"    text,
  remarks            text
);

-- ─── Audit Logs ──────────────────────────────────────────────────────
create table if not exists public.audit_logs (
  id        text primary key,
  action    text,
  "user"    text,
  details   text,
  timestamp text
);

-- ─── Column additions (safe to re-run) ─────────────────────────────
alter table public.batches      add column if not exists "clientName"    text;

alter table public.samples      add column if not exists "clientName"    text;
alter table public.samples      add column if not exists "requestDate"   text;
alter table public.samples      add column if not exists remarks         text;

alter table public.shipments    add column if not exists "clientName"    text;
alter table public.shipments    add column if not exists "ratePerKg"     numeric;
alter table public.shipments    add column if not exists "totalInvoice"  numeric;
alter table public.shipments    add column if not exists direction        text;

alter table public.bd_leads     add column if not exists "clientName"    text;
alter table public.bd_leads     add column if not exists volume           numeric;
alter table public.bd_leads     add column if not exists "ratePerKg"     numeric;

-- ─── Row Level Security ──────────────────────────────────────────────
do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'batches','inventory','orders','expenses','employees',
      'vendors','bd_leads','samples','markets','rd_projects',
      'shipments','audit_logs'
    ])
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "erp_allow_all" on public.%I', t);
    execute format(
      'create policy "erp_allow_all" on public.%I for all using (true) with check (true)',
      t
    );
  end loop;
end $$;
