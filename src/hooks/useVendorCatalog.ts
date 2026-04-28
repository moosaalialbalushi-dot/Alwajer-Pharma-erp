/**
 * useVendorCatalog — fetches vendor_catalog + vendor_materials via db-proxy
 * Falls back to embedded seed data if Supabase is unreachable.
 */
import { useState, useEffect, useCallback } from 'react';

export interface VendorCatalogItem {
  id: string;
  name: string;
  country: string;
  category: string;
  rating: number;
  status: string;
  notes?: string;
}

export interface VendorMaterial {
  id: string;
  vendor_id: string;
  material_name: string;
  category: string;
  unit: string;
  price_usd: number;
  price_sdg: number;
  price_omr: number;
  min_order_qty?: number;
  lead_time_days?: number;
  last_updated?: string;
}

// ── Embedded fallback seed data ───────────────────────────────────────────────
const FALLBACK_VENDORS: VendorCatalogItem[] = [
  { id: 'VND-001', name: 'Anhui Conprogen Pharma', country: 'China',  category: 'API',      rating: 5, status: 'Verified' },
  { id: 'VND-002', name: 'Accord Healthcare',       country: 'India',  category: 'API',      rating: 5, status: 'Verified' },
  { id: 'VND-003', name: 'Ideal Cures Pvt Ltd',     country: 'India',  category: 'Excipient',rating: 4, status: 'Verified' },
  { id: 'VND-004', name: 'PolyChem Co.',             country: 'UAE',    category: 'Packing',  rating: 4, status: 'Verified' },
];

const FALLBACK_MATERIALS: VendorMaterial[] = [
  { id:'MAT-001',vendor_id:'VND-001',material_name:'Esomeprazole Magnesium Trihydrate',category:'API',      unit:'kg', price_usd:48.50, price_sdg:26917.50,price_omr:18.65,min_order_qty:5,  lead_time_days:45},
  { id:'MAT-002',vendor_id:'VND-001',material_name:'Omeprazole API',                   category:'API',      unit:'kg', price_usd:18.50, price_sdg:10267.50,price_omr:7.11, min_order_qty:5,  lead_time_days:30},
  { id:'MAT-003',vendor_id:'VND-001',material_name:'Lansoprazole API',                 category:'API',      unit:'kg', price_usd:52.00, price_sdg:28860.00,price_omr:19.99,min_order_qty:5,  lead_time_days:45},
  { id:'MAT-004',vendor_id:'VND-001',material_name:'Pantoprazole Sodium Sesquihydrate',category:'API',      unit:'kg', price_usd:38.00, price_sdg:21090.00,price_omr:14.61,min_order_qty:5,  lead_time_days:40},
  { id:'MAT-005',vendor_id:'VND-001',material_name:'Rabeprazole Sodium',               category:'API',      unit:'kg', price_usd:62.00, price_sdg:34410.00,price_omr:23.84,min_order_qty:5,  lead_time_days:50},
  { id:'MAT-006',vendor_id:'VND-001',material_name:'Dexlansoprazole',                  category:'API',      unit:'kg', price_usd:85.00, price_sdg:47175.00,price_omr:32.68,min_order_qty:2,  lead_time_days:60},
  { id:'MAT-007',vendor_id:'VND-001',material_name:'HPMC E5',                          category:'Excipient',unit:'kg', price_usd:7.25,  price_sdg:4023.75, price_omr:2.79, min_order_qty:25, lead_time_days:21},
  { id:'MAT-008',vendor_id:'VND-001',material_name:'HPMC E15',                         category:'Excipient',unit:'kg', price_usd:8.00,  price_sdg:4440.00, price_omr:3.08, min_order_qty:25, lead_time_days:21},
  { id:'MAT-009',vendor_id:'VND-001',material_name:'Talcum (Pharma Grade)',             category:'Excipient',unit:'kg', price_usd:1.20,  price_sdg:666.00,  price_omr:0.46, min_order_qty:50, lead_time_days:14},
  { id:'MAT-010',vendor_id:'VND-001',material_name:'Sucrose (NF)',                      category:'Excipient',unit:'kg', price_usd:0.85,  price_sdg:471.75,  price_omr:0.33, min_order_qty:100,lead_time_days:14},
  { id:'MAT-011',vendor_id:'VND-001',material_name:'Microcrystalline Cellulose PH-101',category:'Excipient',unit:'kg', price_usd:2.50,  price_sdg:1387.50, price_omr:0.96, min_order_qty:50, lead_time_days:21},
  { id:'MAT-012',vendor_id:'VND-002',material_name:'Metformin HCl',                    category:'API',      unit:'kg', price_usd:8.50,  price_sdg:4717.50, price_omr:3.27, min_order_qty:25, lead_time_days:30},
  { id:'MAT-013',vendor_id:'VND-002',material_name:'Amlodipine Besylate',              category:'API',      unit:'kg', price_usd:95.00, price_sdg:52725.00,price_omr:36.53,min_order_qty:2,  lead_time_days:45},
  { id:'MAT-014',vendor_id:'VND-002',material_name:'Atorvastatin Calcium',             category:'API',      unit:'kg', price_usd:78.00, price_sdg:43290.00,price_omr:29.99,min_order_qty:2,  lead_time_days:45},
  { id:'MAT-015',vendor_id:'VND-002',material_name:'Losartan Potassium',               category:'API',      unit:'kg', price_usd:145.00,price_sdg:80475.00,price_omr:55.75,min_order_qty:1,  lead_time_days:50},
  { id:'MAT-016',vendor_id:'VND-002',material_name:'Lisinopril',                       category:'API',      unit:'kg', price_usd:220.00,price_sdg:122100.00,price_omr:84.59,min_order_qty:1, lead_time_days:60},
  { id:'MAT-017',vendor_id:'VND-002',material_name:'Clopidogrel Bisulfate',            category:'API',      unit:'kg', price_usd:135.00,price_sdg:74925.00,price_omr:51.91,min_order_qty:1,  lead_time_days:45},
  { id:'MAT-018',vendor_id:'VND-002',material_name:'Azithromycin',                     category:'API',      unit:'kg', price_usd:58.00, price_sdg:32190.00,price_omr:22.30,min_order_qty:5,  lead_time_days:35},
  { id:'MAT-019',vendor_id:'VND-002',material_name:'Amoxicillin Trihydrate',           category:'API',      unit:'kg', price_usd:22.00, price_sdg:12210.00,price_omr:8.46, min_order_qty:10, lead_time_days:30},
  { id:'MAT-020',vendor_id:'VND-002',material_name:'Ciprofloxacin HCl',                category:'API',      unit:'kg', price_usd:32.00, price_sdg:17760.00,price_omr:12.30,min_order_qty:10, lead_time_days:30},
  { id:'MAT-021',vendor_id:'VND-002',material_name:'Paracetamol (Acetaminophen)',      category:'API',      unit:'kg', price_usd:5.50,  price_sdg:3052.50, price_omr:2.11, min_order_qty:50, lead_time_days:21},
  { id:'MAT-022',vendor_id:'VND-002',material_name:'Ibuprofen',                        category:'API',      unit:'kg', price_usd:4.80,  price_sdg:2664.00, price_omr:1.85, min_order_qty:50, lead_time_days:21},
  { id:'MAT-023',vendor_id:'VND-003',material_name:'Opadry White (YS-1-7003)',         category:'Excipient',unit:'kg', price_usd:28.00, price_sdg:15540.00,price_omr:10.77,min_order_qty:5,  lead_time_days:21},
  { id:'MAT-024',vendor_id:'VND-003',material_name:'Opadry Amber (YS-1-13065)',        category:'Excipient',unit:'kg', price_usd:31.00, price_sdg:17205.00,price_omr:11.92,min_order_qty:5,  lead_time_days:21},
  { id:'MAT-025',vendor_id:'VND-003',material_name:'Sepifilm LP-770',                  category:'Excipient',unit:'kg', price_usd:35.00, price_sdg:19425.00,price_omr:13.46,min_order_qty:5,  lead_time_days:28},
  { id:'MAT-026',vendor_id:'VND-003',material_name:'Aquarius Prime',                   category:'Excipient',unit:'kg', price_usd:42.00, price_sdg:23310.00,price_omr:16.15,min_order_qty:5,  lead_time_days:28},
  { id:'MAT-027',vendor_id:'VND-003',material_name:'Surelease (Ethylcellulose 25%)',   category:'Excipient',unit:'kg', price_usd:55.00, price_sdg:30525.00,price_omr:21.15,min_order_qty:3,  lead_time_days:35},
  { id:'MAT-028',vendor_id:'VND-003',material_name:'Eudragit L30 D-55',                category:'Excipient',unit:'kg', price_usd:48.00, price_sdg:26640.00,price_omr:18.46,min_order_qty:3,  lead_time_days:35},
  { id:'MAT-029',vendor_id:'VND-003',material_name:'Kollicoat MAE 30 DP',              category:'Excipient',unit:'kg', price_usd:52.00, price_sdg:28860.00,price_omr:19.99,min_order_qty:3,  lead_time_days:35},
  { id:'MAT-030',vendor_id:'VND-003',material_name:'Plasacryl HTP20',                  category:'Excipient',unit:'kg', price_usd:38.00, price_sdg:21090.00,price_omr:14.61,min_order_qty:5,  lead_time_days:28},
  { id:'MAT-031',vendor_id:'VND-004',material_name:'HDPE Drum 25kg (UN-certified)',    category:'Packing',  unit:'pcs',price_usd:4.50,  price_sdg:2497.50, price_omr:1.73, min_order_qty:100,lead_time_days:14},
  { id:'MAT-032',vendor_id:'VND-004',material_name:'HDPE Drum 50kg',                   category:'Packing',  unit:'pcs',price_usd:7.20,  price_sdg:3996.00, price_omr:2.77, min_order_qty:100,lead_time_days:14},
  { id:'MAT-033',vendor_id:'VND-004',material_name:'Aluminium Blister Foil 20µm',      category:'Packing',  unit:'kg', price_usd:12.50, price_sdg:6937.50, price_omr:4.81, min_order_qty:50, lead_time_days:21},
  { id:'MAT-034',vendor_id:'VND-004',material_name:'PVC/PVDC Blister Film 250/60',     category:'Packing',  unit:'kg', price_usd:9.80,  price_sdg:5439.00, price_omr:3.77, min_order_qty:50, lead_time_days:21},
];

const DB_PROXY = '/api/db-proxy';

async function proxySelect<T>(table: string): Promise<T[]> {
  const res = await fetch(DB_PROXY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'select', table }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const { data } = await res.json();
  return data || [];
}

export function useVendorCatalog() {
  const [vendors, setVendors] = useState<VendorCatalogItem[]>(FALLBACK_VENDORS);
  const [materials, setMaterials] = useState<VendorMaterial[]>(FALLBACK_MATERIALS);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<'supabase' | 'local'>('local');

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [v, m] = await Promise.all([
        proxySelect<VendorCatalogItem>('vendor_catalog'),
        proxySelect<VendorMaterial>('vendor_materials'),
      ]);
      if (v.length) { setVendors(v); setSource('supabase'); }
      if (m.length) setMaterials(m);
    } catch (e) {
      console.warn('[useVendorCatalog] Supabase unavailable, using local seed:', e);
      setSource('local');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const materialsForVendor = useCallback(
    (vendorId: string) => materials.filter(m => m.vendor_id === vendorId),
    [materials]
  );

  return { vendors, materials, materialsForVendor, loading, source, reload };
}
