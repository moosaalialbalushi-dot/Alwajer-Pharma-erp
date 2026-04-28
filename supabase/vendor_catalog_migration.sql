-- ============================================================
-- EbaoqLnGU: Vendor Catalog + Material Rates Migration
-- Run in Supabase SQL Editor — safe to re-run (IF NOT EXISTS)
-- ============================================================

create extension if not exists "pgcrypto";

-- ─── Vendor Catalog ───────────────────────────────────────────────────────────
-- Extended vendor table with contact details and material categories
create table if not exists public.vendor_catalog (
  id              text primary key default gen_random_uuid()::text,
  name            text not null,
  country         text,
  contact_person  text,
  email           text,
  phone           text,
  category        text,          -- API | Excipient | Packing | Equipment
  rating          numeric default 5,
  status          text default 'Verified',
  notes           text,
  created_at      timestamptz default now()
);

-- ─── Vendor Materials ─────────────────────────────────────────────────────────
-- Material rates per vendor (vendor → material → rate mapping)
create table if not exists public.vendor_materials (
  id              text primary key default gen_random_uuid()::text,
  vendor_id       text references public.vendor_catalog(id) on delete cascade,
  material_name   text not null,
  category        text,          -- API | Excipient | Packing
  unit            text default 'kg',
  price_usd       numeric,
  price_sdg       numeric,       -- Sudanese Pound
  price_omr       numeric,       -- Omani Rial
  currency        text default 'USD',
  min_order_qty   numeric,
  lead_time_days  integer,
  last_updated    text,
  notes           text
);

-- ─── Currency Exchange Rates ──────────────────────────────────────────────────
create table if not exists public.currency_rates (
  id              text primary key,
  usd_to_sdg      numeric not null default 555,   -- 1 USD = 555 SDG
  usd_to_omr      numeric not null default 0.3845, -- 1 USD = 0.3845 OMR
  updated_at      timestamptz default now()
);

-- Seed default rates
insert into public.currency_rates (id, usd_to_sdg, usd_to_omr)
values ('default', 555, 0.3845)
on conflict (id) do nothing;

-- ─── RLS Policies ────────────────────────────────────────────────────────────
do $$
declare
  t text;
begin
  for t in select unnest(array['vendor_catalog','vendor_materials','currency_rates']) loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "erp_allow_all" on public.%I', t);
    execute format(
      'create policy "erp_allow_all" on public.%I for all using (true) with check (true)',
      t
    );
  end loop;
end $$;
