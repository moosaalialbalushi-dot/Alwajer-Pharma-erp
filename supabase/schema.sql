-- Al Wajer Pharmaceutical ERP — Supabase schema
--
-- Run this ONCE in Supabase → SQL Editor to create all tables
-- the ERP uses. All tables store rows keyed by `id` (TEXT) matching
-- the shape of the corresponding TypeScript interface in src/types.
--
-- Data shape is kept permissive with JSONB so we don't need to migrate
-- the schema every time a form field is added; the app serialises and
-- merges the full row on upsert.

-- ─── Enable extensions ──────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ─── Batches (Manufacturing) ────────────────────────────────────────
create table if not exists public.batches (
  id              text primary key,
  product         text,
  quantity        numeric,
  "actualYield"   numeric,
  "expectedYield" numeric,
  status          text,
  timestamp       text,
  "dispatchDate"  text,
  extra           jsonb default '{}'::jsonb,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ─── Inventory ──────────────────────────────────────────────────────
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
  "safetyStock"        numeric,
  extra                jsonb default '{}'::jsonb,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

-- ─── Orders ─────────────────────────────────────────────────────────
create table if not exists public.orders (
  id                  text primary key,
  "sNo"               text,
  date                text,
  "invoiceNo"         text,
  customer            text,
  "lcNo"              text,
  country             text,
  product             text,
  quantity            numeric,
  "rateUSD"           numeric,
  "amountUSD"         numeric,
  "amountOMR"         numeric,
  status              text,
  "materialDispatched" text,
  "paymentTerms"      text,
  "receivedAmountOMR" numeric,
  "pendingAmountOMR"  numeric,
  remarks             text,
  "paymentMethod"     text,
  "shippingMethod"    text,
  extra               jsonb default '{}'::jsonb,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- ─── Expenses ───────────────────────────────────────────────────────
create table if not exists public.expenses (
  id          text primary key,
  description text,
  category    text,
  amount      numeric,
  status      text,
  "dueDate"   text,
  extra       jsonb default '{}'::jsonb,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ─── Employees ──────────────────────────────────────────────────────
create table if not exists public.employees (
  id          text primary key,
  name        text,
  role        text,
  department  text,
  salary      numeric,
  status      text,
  "joinDate"  text,
  extra       jsonb default '{}'::jsonb,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ─── Vendors ────────────────────────────────────────────────────────
create table if not exists public.vendors (
  id        text primary key,
  name      text,
  category  text,
  rating    numeric,
  status    text,
  country   text,
  extra     jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── BD Leads ───────────────────────────────────────────────────────
create table if not exists public.bd_leads (
  id               text primary key,
  "targetMarket"   text,
  opportunity      text,
  "potentialValue" text,
  status           text,
  probability      numeric,
  extra            jsonb default '{}'::jsonb,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- ─── Samples ────────────────────────────────────────────────────────
create table if not exists public.samples (
  id               text primary key,
  product          text,
  destination      text,
  quantity         text,
  status           text,
  "trackingNumber" text,
  extra            jsonb default '{}'::jsonb,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- ─── Markets ────────────────────────────────────────────────────────
create table if not exists public.markets (
  id     text primary key,
  name   text,
  region text,
  status text,
  extra  jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── R&D Projects (complex nested formulation data in JSONB) ────────
create table if not exists public.rd_projects (
  id                    text primary key,
  title                 text,
  "productCode"         text,
  "dosageForm"          text,
  strength              text,
  "therapeuticCategory" text,
  "shelfLife"           text,
  "storageCondition"    text,
  "manufacturingProcess" text,
  "qualityStandards"    text,
  "regulatoryStatus"    text,
  status                text,
  ingredients           jsonb default '[]'::jsonb,
  "packingMaterials"    jsonb default '[]'::jsonb,
  "optimizationScore"   numeric,
  "aiOptimizationNotes" text,
  "lastUpdated"         text,
  "batchSize"           numeric,
  "batchUnit"           text,
  "totalRMC"            numeric,
  loss                  numeric,
  "totalFinalRMC"       numeric,
  versions              jsonb default '[]'::jsonb,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

-- ─── Shipments (Logistics) ──────────────────────────────────────────
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
  remarks            text,
  extra              jsonb default '{}'::jsonb,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

-- ─── Audit Logs ─────────────────────────────────────────────────────
create table if not exists public.audit_logs (
  id         text primary key,
  action     text,
  "user"     text,
  details    text,
  timestamp  text,
  created_at timestamptz default now()
);

create index if not exists audit_logs_created_at_idx
  on public.audit_logs (created_at desc);

-- ─── Row Level Security ─────────────────────────────────────────────
-- For the ERP the client uses the anon key, so we enable RLS and
-- grant full access through the anon role. Tighten this if you add
-- multi-tenant auth later.

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
    execute format(
      'drop policy if exists "erp_allow_all" on public.%I', t
    );
    execute format(
      'create policy "erp_allow_all" on public.%I for all using (true) with check (true)',
      t
    );
  end loop;
end $$;
