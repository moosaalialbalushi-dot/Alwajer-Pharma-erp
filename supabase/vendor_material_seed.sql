-- ============================================================
-- EbaoqLnGU: Vendor & Material Seed Data
-- 4 Vendors + 34 Materials
-- Run AFTER vendor_catalog_migration.sql
-- ============================================================

-- ─── Vendors ─────────────────────────────────────────────────────────────────
insert into public.vendor_catalog (id, name, country, category, rating, status, notes)
values
  ('VND-001', 'Anhui Conprogen Pharma', 'China', 'API', 5, 'Verified', 'Primary API supplier — Esomeprazole, Omeprazole, Pantoprazole'),
  ('VND-002', 'Accord Healthcare', 'India', 'API', 5, 'Verified', 'Generic APIs — Metformin, Amlodipine, Atorvastatin'),
  ('VND-003', 'Ideal Cures Pvt Ltd', 'India', 'Excipient', 4, 'Verified', 'Film coating systems — Opadry, Sepifilm, Aquarius'),
  ('VND-004', 'PolyChem Co.', 'UAE', 'Packing', 4, 'Verified', 'HDPE drums, blister foil, cartons')
on conflict (id) do update set
  name = excluded.name,
  country = excluded.country,
  category = excluded.category,
  rating = excluded.rating,
  status = excluded.status,
  notes = excluded.notes;

-- ─── Materials: Anhui Conprogen Pharma (VND-001) ─────────────────────────────
insert into public.vendor_materials (id, vendor_id, material_name, category, unit, price_usd, price_sdg, price_omr, min_order_qty, lead_time_days, last_updated)
values
  ('MAT-001', 'VND-001', 'Esomeprazole Magnesium Trihydrate', 'API', 'kg', 48.50,  26917.50, 18.65,  5,  45, '2026-04-01'),
  ('MAT-002', 'VND-001', 'Omeprazole API',                    'API', 'kg', 18.50,  10267.50,  7.11,  5,  30, '2026-04-01'),
  ('MAT-003', 'VND-001', 'Lansoprazole API',                  'API', 'kg', 52.00,  28860.00, 19.99,  5,  45, '2026-04-01'),
  ('MAT-004', 'VND-001', 'Pantoprazole Sodium Sesquihydrate', 'API', 'kg', 38.00,  21090.00, 14.61,  5,  40, '2026-04-01'),
  ('MAT-005', 'VND-001', 'Rabeprazole Sodium',                'API', 'kg', 62.00,  34410.00, 23.84,  5,  50, '2026-04-01'),
  ('MAT-006', 'VND-001', 'Dexlansoprazole',                   'API', 'kg', 85.00,  47175.00, 32.68,  2,  60, '2026-04-01'),
  ('MAT-007', 'VND-001', 'HPMC E5',                           'Excipient', 'kg', 7.25,   4023.75,  2.79, 25,  21, '2026-04-01'),
  ('MAT-008', 'VND-001', 'HPMC E15',                          'Excipient', 'kg', 8.00,   4440.00,  3.08, 25,  21, '2026-04-01'),
  ('MAT-009', 'VND-001', 'Talcum (Pharma Grade)',              'Excipient', 'kg', 1.20,    666.00,  0.46, 50,  14, '2026-04-01'),
  ('MAT-010', 'VND-001', 'Sucrose (NF)',                       'Excipient', 'kg', 0.85,    471.75,  0.33, 100, 14, '2026-04-01'),
  ('MAT-011', 'VND-001', 'Microcrystalline Cellulose PH-101', 'Excipient', 'kg', 2.50,   1387.50,  0.96, 50,  21, '2026-04-01')
on conflict (id) do update set
  material_name = excluded.material_name,
  price_usd = excluded.price_usd,
  price_sdg = excluded.price_sdg,
  price_omr = excluded.price_omr,
  last_updated = excluded.last_updated;

-- ─── Materials: Accord Healthcare (VND-002) ──────────────────────────────────
insert into public.vendor_materials (id, vendor_id, material_name, category, unit, price_usd, price_sdg, price_omr, min_order_qty, lead_time_days, last_updated)
values
  ('MAT-012', 'VND-002', 'Metformin HCl',                     'API', 'kg', 8.50,   4717.50,  3.27, 25,  30, '2026-04-01'),
  ('MAT-013', 'VND-002', 'Amlodipine Besylate',               'API', 'kg', 95.00,  52725.00, 36.53,  2,  45, '2026-04-01'),
  ('MAT-014', 'VND-002', 'Atorvastatin Calcium',              'API', 'kg', 78.00,  43290.00, 29.99,  2,  45, '2026-04-01'),
  ('MAT-015', 'VND-002', 'Losartan Potassium',                'API', 'kg', 145.00, 80475.00, 55.75,  1,  50, '2026-04-01'),
  ('MAT-016', 'VND-002', 'Lisinopril',                        'API', 'kg', 220.00, 122100.00, 84.59, 1,  60, '2026-04-01'),
  ('MAT-017', 'VND-002', 'Clopidogrel Bisulfate',             'API', 'kg', 135.00, 74925.00, 51.91,  1,  45, '2026-04-01'),
  ('MAT-018', 'VND-002', 'Azithromycin',                      'API', 'kg', 58.00,  32190.00, 22.30,  5,  35, '2026-04-01'),
  ('MAT-019', 'VND-002', 'Amoxicillin Trihydrate',            'API', 'kg', 22.00,  12210.00,  8.46, 10,  30, '2026-04-01'),
  ('MAT-020', 'VND-002', 'Ciprofloxacin HCl',                 'API', 'kg', 32.00,  17760.00, 12.30, 10,  30, '2026-04-01'),
  ('MAT-021', 'VND-002', 'Paracetamol (Acetaminophen)',       'API', 'kg', 5.50,   3052.50,  2.11, 50,  21, '2026-04-01'),
  ('MAT-022', 'VND-002', 'Ibuprofen',                         'API', 'kg', 4.80,   2664.00,  1.85, 50,  21, '2026-04-01')
on conflict (id) do update set
  material_name = excluded.material_name,
  price_usd = excluded.price_usd,
  price_sdg = excluded.price_sdg,
  price_omr = excluded.price_omr,
  last_updated = excluded.last_updated;

-- ─── Materials: Ideal Cures Pvt Ltd (VND-003) ────────────────────────────────
insert into public.vendor_materials (id, vendor_id, material_name, category, unit, price_usd, price_sdg, price_omr, min_order_qty, lead_time_days, last_updated)
values
  ('MAT-023', 'VND-003', 'Opadry White (YS-1-7003)',          'Excipient', 'kg', 28.00,  15540.00, 10.77, 5,  21, '2026-04-01'),
  ('MAT-024', 'VND-003', 'Opadry Amber (YS-1-13065)',         'Excipient', 'kg', 31.00,  17205.00, 11.92, 5,  21, '2026-04-01'),
  ('MAT-025', 'VND-003', 'Sepifilm LP-770',                   'Excipient', 'kg', 35.00,  19425.00, 13.46, 5,  28, '2026-04-01'),
  ('MAT-026', 'VND-003', 'Aquarius Prime',                    'Excipient', 'kg', 42.00,  23310.00, 16.15, 5,  28, '2026-04-01'),
  ('MAT-027', 'VND-003', 'Surelease (Ethylcellulose 25%)',    'Excipient', 'kg', 55.00,  30525.00, 21.15, 3,  35, '2026-04-01'),
  ('MAT-028', 'VND-003', 'Eudragit L30 D-55',                 'Excipient', 'kg', 48.00,  26640.00, 18.46, 3,  35, '2026-04-01'),
  ('MAT-029', 'VND-003', 'Kollicoat MAE 30 DP',               'Excipient', 'kg', 52.00,  28860.00, 19.99, 3,  35, '2026-04-01'),
  ('MAT-030', 'VND-003', 'Plasacryl HTP20',                   'Excipient', 'kg', 38.00,  21090.00, 14.61, 5,  28, '2026-04-01')
on conflict (id) do update set
  material_name = excluded.material_name,
  price_usd = excluded.price_usd,
  price_sdg = excluded.price_sdg,
  price_omr = excluded.price_omr,
  last_updated = excluded.last_updated;

-- ─── Materials: PolyChem Co. (VND-004) ───────────────────────────────────────
insert into public.vendor_materials (id, vendor_id, material_name, category, unit, price_usd, price_sdg, price_omr, min_order_qty, lead_time_days, last_updated)
values
  ('MAT-031', 'VND-004', 'HDPE Drum 25kg (UN-certified)',     'Packing', 'pcs', 4.50,   2497.50,  1.73, 100, 14, '2026-04-01'),
  ('MAT-032', 'VND-004', 'HDPE Drum 50kg',                    'Packing', 'pcs', 7.20,   3996.00,  2.77, 100, 14, '2026-04-01'),
  ('MAT-033', 'VND-004', 'Aluminium Blister Foil 20µm',       'Packing', 'kg',  12.50,  6937.50,  4.81, 50,  21, '2026-04-01'),
  ('MAT-034', 'VND-004', 'PVC/PVDC Blister Film 250/60',      'Packing', 'kg',  9.80,   5439.00,  3.77, 50,  21, '2026-04-01')
on conflict (id) do update set
  material_name = excluded.material_name,
  price_usd = excluded.price_usd,
  price_sdg = excluded.price_sdg,
  price_omr = excluded.price_omr,
  last_updated = excluded.last_updated;
