import React, { useState, useMemo } from 'react';
import { BadgeDollarSign, Plus, Edit2, Trash2, Download, FileText, Package, ReceiptText, Eye, X, Search } from 'lucide-react';
import type { Order, ModalState, ApiConfig } from '@/types';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { DocPreview } from '@/components/shared/DocPreview';
import { exportToCSV } from '@/services/export';
import { SmartImporter } from '@/components/shared/SmartImporter';
import { formatCurrency } from '@/lib/utils';
import { useCurrency } from '@/providers/CurrencyProvider';

interface Props {
  orders: Order[];
  apiConfig: ApiConfig;
  onOpenModal: (mode: ModalState['mode'], type: ModalState['type'], data?: Record<string, unknown>) => void;
  onDelete: (type: string, id: string, name: string) => void;
  onImport: (rows: Record<string, unknown>[]) => void;
}

const OMR_RATE = 0.3845; // kept for legacy invoice HTML generation

function numOrZero(v: unknown): number {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

function amountInWords(amount: number): string {
  if (amount === 0) return 'Zero US Dollars Only';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const toWords = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + toWords(n % 100) : '');
    if (n < 1000000) return toWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + toWords(n % 1000) : '');
    return toWords(Math.floor(n / 1000000)) + ' Million' + (n % 1000000 ? ' ' + toWords(n % 1000000) : '');
  };
  const dollars = Math.floor(amount);
  const cents = Math.round((amount - dollars) * 100);
  let result = toWords(dollars) + ' US Dollar' + (dollars !== 1 ? 's' : '');
  if (cents > 0) result += ' and ' + toWords(cents) + ' Cent' + (cents !== 1 ? 's' : '');
  return result + ' Only';
}

function buildInvoiceHTML(invoiceNo: string, orders: Order[], logoUrl: string): string {
  const date = orders[0]?.date || new Date().toISOString().split('T')[0];
  const customer = orders[0]?.customer || '';
  const country = orders[0]?.country || '';
  const lcNo = orders[0]?.lcNo || '';
  const paymentTerms = orders[0]?.paymentTerms || 'AT SIGHT';
  const totalUSD = orders.reduce((s, o) => s + numOrZero(o.amountUSD), 0);
  const totalOMR = orders.reduce((s, o) => s + numOrZero(o.amountOMR), 0);
  const rows = orders.map((o, i) => `<tr>
    <td style="border:1px solid #000;padding:6px;text-align:center;">${i + 1}</td>
    <td style="border:1px solid #000;padding:6px;"><strong>${o.product}</strong></td>
    <td style="border:1px solid #000;padding:6px;text-align:right;">${numOrZero(o.quantity).toLocaleString()}</td>
    <td style="border:1px solid #000;padding:6px;text-align:right;">${formatCurrency(numOrZero(o.rateUSD),'USD')}</td>
    <td style="border:1px solid #000;padding:6px;text-align:right;font-weight:bold;">${formatCurrency(numOrZero(o.amountUSD),'USD')}</td>
  </tr>`).join('');
  return `<!DOCTYPE html><html><head><title>Proforma Invoice - ${invoiceNo}</title>
  <style>@page{size:A4;margin:15mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:10px;color:#000;margin:0;padding:0}.lh{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:3px double #000;padding-bottom:8px;margin-bottom:10px}.co{font-size:13px;font-weight:bold;color:#1a3c6e;letter-spacing:0.5px}.ar{font-size:12px;direction:rtl;margin-bottom:3px;color:#555}.addr{font-size:8.5px;line-height:1.6;color:#333}.title{text-align:center;font-size:15px;font-weight:bold;letter-spacing:3px;text-decoration:underline;margin:10px 0}table{width:100%;border-collapse:collapse;margin-bottom:6px}.info td{border:1px solid #000;padding:4px 7px;font-size:9px;vertical-align:top}.goods th{border:1px solid #000;padding:5px 7px;background:#e8e8e8;font-size:9px;text-align:center}.goods td{border:1px solid #000;padding:5px 7px;font-size:9px}.total-row td{background:#f0f0f0;font-weight:bold;border:1px solid #000;padding:5px 7px}.bank{margin-top:8px;font-size:8.5px;line-height:1.7;border:1px solid #ccc;padding:8px;background:#fafafa}.sig{display:flex;justify-content:space-between;margin-top:25px}.sig-box{border-top:1px solid #000;width:43%;text-align:center;padding-top:5px;font-size:9px}.foot{margin-top:15px;border-top:1px solid #999;padding-top:6px;font-size:8px;text-align:center;color:#666}@media print{body{margin:0}}</style></head><body>
  <div class="lh"><div>${logoUrl ? `<img src="${logoUrl}" alt="Logo" style="height:50px;object-fit:contain;margin-bottom:4px;display:block">` : ''}<div class="ar">الوجـر لصناعة الأدويـة ش.م.م</div><div class="co">AL WAJER PHARMACEUTICALS INDUSTRY LLC</div><div class="addr">PO BOX 98, PC-327, PHASE-5, SOHAR INDUSTRIAL ESTATE, SOHAR, SULTANATE OF OMAN<br>Tel: +968 22372677 | CR NO: 1145026</div></div><div style="text-align:right"><div style="font-size:9px;color:#888">Authorized Dealer | GMP Certified</div></div></div>
  <div class="title">PROFORMA INVOICE</div>
  <table class="info"><tr><td width="50%"><span style="font-size:8px;font-weight:bold;color:#555">INVOICE NO. &amp; DATE</span><br><strong>${invoiceNo}</strong> &nbsp; Date: ${date}</td><td width="50%"><span style="font-size:8px;font-weight:bold;color:#555">LC / PO NO.</span><br>${lcNo || '—'}</td></tr><tr><td><span style="font-size:8px;font-weight:bold;color:#555">EXPORTER</span><br>AL WAJER PHARMACEUTICALS INDUSTRY LLC<br>SOHAR, SULTANATE OF OMAN<br>Tel: +968 22372677</td><td><span style="font-size:8px;font-weight:bold;color:#555">CONSIGNEE / BUYER</span><br><strong>${customer}</strong><br>${country}</td></tr><tr><td><span style="font-size:8px;font-weight:bold;color:#555">COUNTRY OF ORIGIN</span><br>Sultanate of Oman</td><td><span style="font-size:8px;font-weight:bold;color:#555">TERMS OF PAYMENT</span><br>${paymentTerms}</td></tr></table>
  <table class="goods"><thead><tr><th style="width:5%">#</th><th>Product Description</th><th style="width:15%">Qty (Kg)</th><th style="width:15%">Rate/Kg (USD)</th><th style="width:18%">Total (USD)</th></tr></thead><tbody>${rows}<tr class="total-row"><td colspan="4" style="text-align:right">TOTAL AMOUNT IN USD</td><td style="text-align:right">${formatCurrency(totalUSD,'USD')}</td></tr></tbody></table>
  <div style="font-size:9px;margin:4px 0 8px;padding:5px 7px;border:1px solid #ccc;background:#fffce8"><strong>AMOUNT IN WORDS:</strong> ${amountInWords(totalUSD)}</div>
  ${totalOMR > 0 ? `<div style="font-size:9px;margin-bottom:8px;padding:4px 7px;border:1px solid #e0e0e0;"><strong>OMR EQUIVALENT (@ ${OMR_RATE}):</strong> OMR ${totalOMR.toLocaleString(undefined,{minimumFractionDigits:3})}</div>` : ''}
  <div class="bank"><strong>BANK DETAILS — BENEFICIARY: AL WAJER PHARMACEUTICALS INDUSTRY LLC</strong><br>Bank: BANK NIZWA | Account No.: 00150000174002<br>IBAN: OM45033000150000174002 | SWIFT/BIC: BNZWOMRXXXX<br>Branch: MUSCAT MAIN BRANCH</div>
  <div class="sig"><div class="sig-box">Signature &amp; Date<br><br><br></div><div class="sig-box">For Al Wajer Pharmaceuticals Industry LLC<br><br>Authorized Signatory</div></div>
  <div class="foot">C.R NO: 1145026, TEL: 22372677, PO BOX: 98, POSTAL CODE: 327, SOHAR INDUSTRIAL AREA, SULTANATE OF OMAN</div>
  </body></html>`;
}

function buildPackingListHTML(invoiceNo: string, orders: Order[], logoUrl: string): string {
  const date = orders[0]?.date || new Date().toISOString().split('T')[0];
  const customer = orders[0]?.customer || '';
  const country = orders[0]?.country || '';
  const totalQty = orders.reduce((s, o) => s + numOrZero(o.quantity), 0);
  const rows = orders.map((o, i) => `<tr><td style="border:1px solid #000;padding:5px;text-align:center;">${i + 1}</td><td style="border:1px solid #000;padding:5px;"><strong>${o.product}</strong></td><td style="border:1px solid #000;padding:5px;text-align:right;">${numOrZero(o.quantity).toLocaleString()} Kg</td><td style="border:1px solid #000;padding:5px;">HDPE Drums</td><td style="border:1px solid #000;padding:5px;"></td></tr>`).join('');
  return `<!DOCTYPE html><html><head><title>Packing List - ${invoiceNo}</title>
  <style>@page{size:A4;margin:15mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:10px;color:#000;margin:0}.lh{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:3px double #000;padding-bottom:8px;margin-bottom:10px}.co{font-size:13px;font-weight:bold;color:#1a3c6e}.ar{font-size:12px;direction:rtl;margin-bottom:3px;color:#555}.title{text-align:center;font-size:15px;font-weight:bold;letter-spacing:3px;text-decoration:underline;margin:10px 0}table{width:100%;border-collapse:collapse;margin-bottom:6px}.info td{border:1px solid #000;padding:4px 7px;font-size:9px;vertical-align:top}th{border:1px solid #000;padding:5px 7px;background:#e8e8e8;font-size:9px;text-align:center}td{font-size:9px}.total-row td{background:#f0f0f0;font-weight:bold;border:1px solid #000;padding:5px 7px}.foot{margin-top:15px;border-top:1px solid #999;padding-top:6px;font-size:8px;text-align:center;color:#666}.sig{display:flex;justify-content:space-between;margin-top:30px}.sig-box{border-top:1px solid #000;width:43%;text-align:center;padding-top:5px;font-size:9px}</style></head><body>
  <div class="lh"><div>${logoUrl ? `<img src="${logoUrl}" alt="Logo" style="height:50px;object-fit:contain;margin-bottom:4px;display:block">` : ''}<div class="ar">الوجـر لصناعة الأدويـة ش.م.م</div><div class="co">AL WAJER PHARMACEUTICALS INDUSTRY LLC</div><div style="font-size:8.5px;color:#333">PO BOX 98, PC-327, SOHAR INDUSTRIAL ESTATE, SOHAR, OMAN</div></div></div>
  <div class="title">PACKING LIST</div>
  <table class="info"><tr><td width="50%"><strong>Invoice No. &amp; Date:</strong> ${invoiceNo} — ${date}</td><td width="50%"><strong>Consignee:</strong> ${customer}, ${country}</td></tr><tr><td><strong>Exporter:</strong> AL WAJER PHARMACEUTICALS INDUSTRY LLC, SOHAR, OMAN</td><td><strong>Country of Origin:</strong> Sultanate of Oman</td></tr></table>
  <table><thead><tr><th style="width:5%">#</th><th>Product Name &amp; Description</th><th style="width:18%">Net Weight</th><th style="width:18%">Packaging</th><th style="width:20%">Marks &amp; Nos.</th></tr></thead><tbody>${rows}<tr class="total-row"><td colspan="2" style="border:1px solid #000;padding:5px;text-align:right">TOTAL NET WEIGHT</td><td style="border:1px solid #000;padding:5px;text-align:right">${totalQty.toLocaleString()} Kg</td><td colspan="2" style="border:1px solid #000;padding:5px;"></td></tr></tbody></table>
  <div class="sig"><div class="sig-box">Signature &amp; Date<br><br><br></div><div class="sig-box">For Al Wajer Pharmaceuticals Industry LLC<br><br>Authorized Signatory</div></div>
  <div class="foot">C.R NO: 1145026, TEL: 22372677, PO BOX: 98, POSTAL CODE: 327, SOHAR INDUSTRIAL AREA, SULTANATE OF OMAN</div>
  </body></html>`;
}

function buildQuotationHTML(quotNo: string, validUntil: string, incoterms: string, paymentTerms: string, orders: Order[], logoUrl: string): string {
  const date = new Date().toISOString().split('T')[0];
  const customer = orders[0]?.customer || '';
  const country = orders[0]?.country || '';
  const lcNo = orders[0]?.lcNo || '';
  const totalUSD = orders.reduce((s, o) => s + numOrZero(o.amountUSD), 0);
  const rows = orders.map((o, i) => `<tr><td style="border:1px solid #000;padding:6px;text-align:center;">${i + 1}</td><td style="border:1px solid #000;padding:6px;"><strong>${o.product}</strong></td><td style="border:1px solid #000;padding:6px;text-align:center;">3004.90</td><td style="border:1px solid #000;padding:6px;text-align:right;">${numOrZero(o.quantity).toLocaleString()}</td><td style="border:1px solid #000;padding:6px;text-align:right;">$${numOrZero(o.rateUSD).toFixed(2)}</td><td style="border:1px solid #000;padding:6px;text-align:right;font-weight:bold;">$${numOrZero(o.amountUSD).toLocaleString()}</td></tr>`).join('');
  return `<!DOCTYPE html><html><head><title>Commercial Quotation - ${quotNo}</title>
  <style>@page{size:A4;margin:15mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:10px;color:#000;margin:0;padding:0}.lh{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:3px double #000;padding-bottom:8px;margin-bottom:10px}.co{font-size:13px;font-weight:bold;color:#1a3c6e}.ar{font-size:12px;direction:rtl;margin-bottom:3px;color:#555}.title{text-align:center;font-size:15px;font-weight:bold;letter-spacing:3px;text-decoration:underline;margin:10px 0}table{width:100%;border-collapse:collapse;margin-bottom:6px}.info td{border:1px solid #000;padding:4px 7px;font-size:9px;vertical-align:top}.goods th{border:1px solid #000;padding:5px 7px;background:#e8e8e8;font-size:9px;text-align:center}.goods td{border:1px solid #000;padding:5px 7px;font-size:9px}.total-row td{background:#f0f0f0;font-weight:bold;border:1px solid #000;padding:5px 7px}.bank{margin-top:8px;font-size:8.5px;line-height:1.7;border:1px solid #ccc;padding:8px;background:#fafafa}.sig{display:flex;justify-content:space-between;margin-top:20px}.sig-box{border-top:1px solid #000;width:43%;text-align:center;padding-top:5px;font-size:9px}.foot{margin-top:15px;border-top:1px solid #999;padding-top:6px;font-size:8px;text-align:center;color:#666}@media print{body{margin:0}}</style></head><body>
  <div class="lh"><div>${logoUrl ? `<img src="${logoUrl}" alt="Logo" style="height:50px;object-fit:contain;margin-bottom:4px;display:block">` : ''}<div class="ar">الوجـر لصناعة الأدويـة ش.م.م</div><div class="co">AL WAJER PHARMACEUTICALS INDUSTRY LLC</div><div style="font-size:8.5px;color:#333">PO BOX 98, PC-327, SOHAR INDUSTRIAL ESTATE, SOHAR, SULTANATE OF OMAN | Tel: +968 22372677</div></div></div>
  <div class="title">COMMERCIAL QUOTATION</div>
  <table class="info"><tr><td width="50%"><span style="font-size:8px;font-weight:bold;color:#555">QUOTATION NO. &amp; DATE</span><br><strong>${quotNo}</strong> &nbsp; ${date}</td><td width="50%"><span style="font-size:8px;font-weight:bold;color:#555">REFERENCE / INQUIRY NO.</span><br>${lcNo || '—'}</td></tr><tr><td colspan="2"><span style="font-size:8px;font-weight:bold;color:#555">BUYER</span><br><strong>${customer}</strong> | ${country}</td></tr><tr><td><span style="font-size:8px;font-weight:bold;color:#555">VALID UNTIL</span><br>${validUntil}</td><td><span style="font-size:8px;font-weight:bold;color:#555">INCOTERMS</span><br>${incoterms}</td></tr></table>
  <table class="goods"><thead><tr><th style="width:5%">#</th><th>Product Description</th><th style="width:10%">HS Code</th><th style="width:12%">Qty (Kg)</th><th style="width:14%">Rate/Kg</th><th style="width:16%">Total USD</th></tr></thead><tbody>${rows}<tr class="total-row"><td colspan="5" style="text-align:right">TOTAL AMOUNT (USD)</td><td style="text-align:right">${formatCurrency(totalUSD,'USD')}</td></tr></tbody></table>
  <div style="font-size:9px;margin:6px 0;padding:5px 7px;border:1px solid #ccc;background:#fffce8"><strong>AMOUNT IN WORDS:</strong> ${amountInWords(totalUSD)}</div>
  <div style="margin-top:8px;font-size:9px"><strong>PAYMENT TERMS:</strong> ${paymentTerms}<br><strong>DELIVERY:</strong> As per order requirement</div>
  <div class="bank"><strong>BANK DETAILS — BENEFICIARY: AL WAJER PHARMACEUTICALS INDUSTRY LLC</strong><br>Bank: BANK NIZWA | Account No.: 00150000174002<br>IBAN: OM45033000150000174002 | SWIFT/BIC: BNZWOMRXXXX</div>
  <div class="sig"><div class="sig-box">Signature &amp; Date<br><br><br></div><div class="sig-box">For Al Wajer Pharmaceuticals<br><br>Authorized Signatory</div></div>
  <div class="foot">C.R NO: 1145026, TEL: 22372677, SOHAR, SULTANATE OF OMAN</div>
  </body></html>`;
}

export const Sales: React.FC<Props> = ({ orders, apiConfig, onOpenModal, onDelete, onImport }) => {
  const [preview, setPreview] = useState<{ title: string; html: string; filename: string } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [quotForm, setQuotForm] = useState({ quotNo: '', validUntil: '', incoterms: 'FOB SOHAR PORT, OMAN', paymentTerms: 'T/T IN ADVANCE' });
  const [showQuotForm, setShowQuotForm] = useState(false);
  const { fmt, currency, rates } = useCurrency();

  const selectedOrder = orders.find(o => o.id === selectedId) ?? null;
  const invoiceGroup = selectedOrder?.invoiceNo
    ? orders.filter(o => o.invoiceNo === selectedOrder.invoiceNo)
    : selectedOrder ? [selectedOrder] : [];

  const filtered = useMemo(() => orders.filter(o => {
    const matchSearch = !search || [o.customer, o.product, o.invoiceNo, o.country]
      .some(v => (v || '').toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  }), [orders, search, statusFilter]);

  const totalPipeline = orders.reduce((s, o) => s + numOrZero(o.amountUSD), 0);
  const pendingCount = orders.filter(o => o.status === 'Pending').length;
  const statuses = [...new Set(orders.map(o => o.status).filter(Boolean))];

  const newOrder = (): Record<string, unknown> => ({
    id: `ORD-${Date.now()}`, sNo: '', invoiceNo: '', lcNo: '',
    date: new Date().toISOString().split('T')[0],
    customer: '', country: '', product: '', quantity: 0,
    rateUSD: 0, amountUSD: 0, amountOMR: 0, status: 'Pending',
  });

  const openQuot = () => {
    const defaultValid = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
    setQuotForm({
      quotNo: `AWP/QT/${selectedOrder?.invoiceNo || Date.now()}`,
      validUntil: defaultValid,
      incoterms: 'FOB SOHAR PORT, OMAN',
      paymentTerms: selectedOrder?.paymentTerms || 'T/T IN ADVANCE',
    });
    setShowQuotForm(true);
  };

  const logoUrl = apiConfig.logoUrl || '';


  const Field = ({ label, value }: { label: string; value?: string | number }) => (
    <div>
      <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">{label}</p>
      <p className="text-xs text-slate-800 font-medium mt-0.5">{value || '—'}</p>
    </div>
  );

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <BadgeDollarSign className="text-[#F4C430]" size={20}/> Sales Orders
        </h2>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => exportToCSV(orders as unknown as Record<string, unknown>[], 'sales')} className="erp-btn-ghost">
            <Download size={13}/> Export
          </button>
          <SmartImporter entityType="sales" onImport={onImport} apiConfig={apiConfig} buttonLabel="Import Orders"/>
          <button onClick={() => onOpenModal('add', 'sales', newOrder())} className="erp-btn-gold">
            <Plus size={15}/> New Order
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Orders', value: orders.length },
          { label: 'Pending', value: pendingCount, color: 'text-yellow-500' },
          { label: `Pipeline (${currency})`, value: fmt(totalPipeline) },
        ].map(s => (
          <div key={s.label} className="bg-white shadow-sm border border-[#D4AF37]/20 p-4 rounded-xl">
            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">{s.label}</p>
            <p className={`text-xl font-bold mt-1 ${s.color ?? 'text-slate-900'}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Main area: table + detail panel */}
      <div className="flex gap-4 min-h-0">
        {/* Table */}
        <div className={`flex flex-col gap-3 ${selectedOrder ? 'flex-1 min-w-0' : 'w-full'}`}>
          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search customer, product, invoice…"
                className="w-full pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#D4AF37]/50"/>
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              title="Filter by status"
              className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#D4AF37]/50">
              <option value="all">All Status</option>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Orders table */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[9px] text-slate-500 uppercase border-b border-gray-100 bg-gray-50">
                    <th className="px-4 py-2.5">Invoice #</th>
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5">Customer</th>
                    <th className="px-4 py-2.5 hidden md:table-cell">Country</th>
                    <th className="px-4 py-2.5 hidden lg:table-cell">Product</th>
                    <th className="px-4 py-2.5 text-right hidden md:table-cell">Qty (Kg)</th>
                    <th className="px-4 py-2.5 text-right hidden lg:table-cell">Rate/Kg (USD)</th>
                    <th className="px-4 py-2.5 text-right">Amount (USD)</th>
                    <th className="px-4 py-2.5 text-right hidden xl:table-cell">Amount (OMR)</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.length === 0 && (
                    <tr><td colSpan={10} className="text-center py-10 text-slate-400 text-sm">No orders found.</td></tr>
                  )}
                  {filtered.map(order => (
                    <tr key={order.id}
                      onClick={() => setSelectedId(order.id === selectedId ? null : order.id)}
                      className={`hover:bg-gray-50 transition-all cursor-pointer ${selectedId === order.id ? 'bg-[#D4AF37]/5 border-l-2 border-l-[#D4AF37]' : ''}`}>
                      <td className="px-4 py-3">
                        <span className="text-xs font-bold text-[#D4AF37]">{order.invoiceNo || '—'}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 font-mono whitespace-nowrap">{order.date}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-bold text-slate-900">{order.customer || '—'}</div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-xs text-slate-500">{order.country}</td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="text-xs text-slate-700 max-w-[160px] truncate">{order.product || '—'}</div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-right text-xs font-mono text-slate-700">
                        {numOrZero(order.quantity).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-right text-xs font-mono text-slate-700">
                        ${numOrZero(order.rateUSD).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="text-sm font-bold text-slate-900 font-mono">
                          {fmt(numOrZero(order.amountUSD))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right hidden xl:table-cell">
                        <div className="text-xs font-mono text-slate-600">
                          {(() => {
                            const omr = numOrZero(order.amountOMR) || numOrZero(order.amountUSD) * rates.usdToOmr;
                            return omr > 0 ? `OMR ${omr.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}` : '—';
                          })()}
                        </div>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={order.status}/></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 justify-end" onClick={e => e.stopPropagation()}>
                          <button onClick={() => setSelectedId(order.id === selectedId ? null : order.id)}
                            className="p-1.5 text-slate-400 hover:text-[#D4AF37] hover:bg-yellow-50 rounded-lg transition-all" title="View details">
                            <Eye size={13}/>
                          </button>
                          <button onClick={() => onOpenModal('edit', 'sales', order as unknown as Record<string, unknown>)}
                            className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all" title="Edit order">
                            <Edit2 size={13}/>
                          </button>
                          <button onClick={() => onDelete('sales', order.id, `${order.invoiceNo} – ${order.product}`)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Delete order">
                            <Trash2 size={13}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Detail Panel */}
        {selectedOrder && (
          <div className="w-80 shrink-0 bg-white border border-[#D4AF37]/30 rounded-xl shadow-lg flex flex-col overflow-hidden">
            {/* Panel header */}
            <div className="bg-gradient-to-r from-[#D4AF37]/10 to-transparent border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0">
              <div>
                <p className="text-xs font-black text-[#D4AF37]">{selectedOrder.invoiceNo || 'No Invoice'}</p>
                <p className="text-[10px] text-slate-500">{selectedOrder.date}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => onOpenModal('edit', 'sales', selectedOrder as unknown as Record<string, unknown>)}
                  className="p-1.5 text-slate-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all" title="Edit order">
                  <Edit2 size={13}/>
                </button>
                <button onClick={() => setSelectedId(null)}
                  className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-gray-100 rounded-lg transition-all" title="Close panel">
                  <X size={13}/>
                </button>
              </div>
            </div>

            {/* Panel content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
              {/* Order details grid */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Customer" value={selectedOrder.customer}/>
                <Field label="Country" value={selectedOrder.country}/>
                <Field label="LC / PO No." value={selectedOrder.lcNo}/>
                <Field label="Status" value={selectedOrder.status}/>
                <Field label="Product" value={selectedOrder.product}/>
                <Field label="Quantity (Kg)" value={numOrZero(selectedOrder.quantity).toLocaleString()}/>
                <Field label="Rate (USD/Kg)" value={formatCurrency(numOrZero(selectedOrder.rateUSD), 'USD')}/>
                <Field label="Amount (USD)" value={formatCurrency(numOrZero(selectedOrder.amountUSD), 'USD')}/>
                <Field label="Amount (OMR)" value={(() => {
                  const omr = numOrZero(selectedOrder.amountOMR) || numOrZero(selectedOrder.amountUSD) * OMR_RATE;
                  return omr > 0 ? `OMR ${omr.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}` : undefined;
                })()}/>
                <Field label="Payment Terms" value={selectedOrder.paymentTerms}/>
                <Field label="Shipping Method" value={selectedOrder.shippingMethod}/>
                <Field label="Dispatched" value={selectedOrder.materialDispatched}/>
              </div>

              {selectedOrder.remarks && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-[9px] text-slate-400 uppercase font-bold mb-1">Remarks</p>
                  <p className="text-xs text-slate-700">{selectedOrder.remarks}</p>
                </div>
              )}

              {/* Invoice group summary */}
              {invoiceGroup.length > 0 && selectedOrder.invoiceNo && (
                <div className="border border-[#D4AF37]/30 rounded-xl p-3 bg-[#D4AF37]/5">
                  <p className="text-[9px] text-[#D4AF37] font-black uppercase tracking-wider mb-2">
                    Invoice Group — {invoiceGroup.length} line{invoiceGroup.length > 1 ? 's' : ''}
                  </p>
                  {invoiceGroup.map((o, i) => (
                      <div key={o.id} className="flex justify-between items-center py-1 border-b border-[#D4AF37]/10 last:border-0">
                        <span className="text-[10px] text-slate-600 truncate max-w-[140px]">{i + 1}. {o.product}</span>
                        <span className="text-[10px] font-bold text-slate-900">{formatCurrency(numOrZero(o.amountUSD), 'USD')}</span>
                      </div>
                    ))}
                    <div className="flex justify-between mt-2 pt-2 border-t border-[#D4AF37]/20">
                      <span className="text-[10px] font-bold text-slate-700">Total</span>
                      <span className="text-[10px] font-black text-[#D4AF37]">
                        {formatCurrency(invoiceGroup.reduce((s, o) => s + numOrZero(o.amountUSD), 0), 'USD')}
                      </span>
                    </div>
                </div>
              )}

              {/* Document buttons */}
              <div>
                <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mb-2">Generate Documents</p>
                <div className="space-y-1.5">
                  <button
                    onClick={() => setPreview({ title: `Invoice — ${selectedOrder.invoiceNo}`, html: buildInvoiceHTML(selectedOrder.invoiceNo, invoiceGroup, logoUrl), filename: `Invoice-${selectedOrder.invoiceNo}.html` })}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition-all">
                    <FileText size={13}/> Proforma Invoice
                  </button>
                  <button
                    onClick={() => setPreview({ title: `Packing List — ${selectedOrder.invoiceNo}`, html: buildPackingListHTML(selectedOrder.invoiceNo, invoiceGroup, logoUrl), filename: `PackingList-${selectedOrder.invoiceNo}.html` })}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-all">
                    <Package size={13}/> Packing List
                  </button>
                  <button
                    onClick={openQuot}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-bold transition-all">
                    <ReceiptText size={13}/> Commercial Quotation
                  </button>
                </div>
              </div>

              {/* Quotation mini-form */}
              {showQuotForm && (
                <div className="border border-amber-200 bg-amber-50 rounded-xl p-3 space-y-2">
                  <p className="text-[10px] font-black text-amber-700 uppercase tracking-wider">Quotation Details</p>
                  <div>
                    <label htmlFor="quotNo" className="text-[9px] font-bold text-slate-500 uppercase">Quotation No.</label>
                    <input id="quotNo" value={quotForm.quotNo} onChange={e => setQuotForm(f => ({ ...f, quotNo: e.target.value }))}
                      className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 mt-0.5 focus:outline-none focus:border-[#D4AF37]/50 bg-white"/>
                  </div>
                  <div>
                    <label htmlFor="validUntil" className="text-[9px] font-bold text-slate-500 uppercase">Valid Until</label>
                    <input id="validUntil" type="date" value={quotForm.validUntil} onChange={e => setQuotForm(f => ({ ...f, validUntil: e.target.value }))}
                      className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 mt-0.5 focus:outline-none focus:border-[#D4AF37]/50 bg-white"/>
                  </div>
                  <div>
                    <label htmlFor="incoterms" className="text-[9px] font-bold text-slate-500 uppercase">Incoterms</label>
                    <input id="incoterms" value={quotForm.incoterms} onChange={e => setQuotForm(f => ({ ...f, incoterms: e.target.value }))}
                      className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 mt-0.5 focus:outline-none focus:border-[#D4AF37]/50 bg-white"/>
                  </div>
                  <div>
                    <label htmlFor="paymentTerms" className="text-[9px] font-bold text-slate-500 uppercase">Payment Terms</label>
                    <input id="paymentTerms" value={quotForm.paymentTerms} onChange={e => setQuotForm(f => ({ ...f, paymentTerms: e.target.value }))}
                      className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 mt-0.5 focus:outline-none focus:border-[#D4AF37]/50 bg-white"/>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => setShowQuotForm(false)}
                      className="flex-1 py-1.5 text-xs font-bold text-slate-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                    <button onClick={() => {
                      setPreview({ title: `Quotation — ${quotForm.quotNo}`, html: buildQuotationHTML(quotForm.quotNo, quotForm.validUntil, quotForm.incoterms, quotForm.paymentTerms, invoiceGroup, logoUrl), filename: `Quotation-${quotForm.quotNo}.html` });
                      setShowQuotForm(false);
                    }} className="flex-1 py-1.5 text-xs font-bold text-slate-950 bg-[#D4AF37] hover:bg-[#c4a030] rounded-lg">
                      Preview
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {preview && <DocPreview title={preview.title} html={preview.html} filename={preview.filename} onClose={() => setPreview(null)}/>}
    </div>
  );
};
