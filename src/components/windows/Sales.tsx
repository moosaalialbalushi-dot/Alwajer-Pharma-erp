import React, { useState } from 'react';
import { BadgeDollarSign, Plus, Edit2, Trash2, Download, FileText, Package, ReceiptText } from 'lucide-react';
import type { Order, ModalState, ApiConfig } from '@/types';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { DocPreview } from '@/components/shared/DocPreview';
import { exportToCSV } from '@/services/export';

interface Props {
  orders: Order[];
  apiConfig: ApiConfig;
  onOpenModal: (mode: ModalState['mode'], type: ModalState['type'], data?: Record<string, unknown>) => void;
  onDelete: (type: string, id: string, name: string) => void;
}

const OMR_RATE = 0.3845;

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

  const rows = orders.map((o, i) => `
    <tr>
      <td style="border:1px solid #000;padding:6px;text-align:center;">${i + 1}</td>
      <td style="border:1px solid #000;padding:6px;">
        <strong>${o.product}</strong>
      </td>
      <td style="border:1px solid #000;padding:6px;text-align:right;">${numOrZero(o.quantity).toLocaleString()}</td>
      <td style="border:1px solid #000;padding:6px;text-align:right;">$${numOrZero(o.rateUSD).toFixed(2)}</td>
      <td style="border:1px solid #000;padding:6px;text-align:right;font-weight:bold;">$${numOrZero(o.amountUSD).toLocaleString()}</td>
    </tr>`).join('');

  return `<!DOCTYPE html><html><head><title>Proforma Invoice - ${invoiceNo}</title>
  <style>
    @page{size:A4;margin:15mm}
    *{box-sizing:border-box}
    body{font-family:Arial,sans-serif;font-size:10px;color:#000;margin:0;padding:0}
    .lh{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:3px double #000;padding-bottom:8px;margin-bottom:10px}
    .co{font-size:13px;font-weight:bold;color:#1a3c6e;letter-spacing:0.5px}
    .ar{font-size:12px;direction:rtl;margin-bottom:3px;color:#555}
    .addr{font-size:8.5px;line-height:1.6;color:#333}
    .title{text-align:center;font-size:15px;font-weight:bold;letter-spacing:3px;text-decoration:underline;margin:10px 0}
    table{width:100%;border-collapse:collapse;margin-bottom:6px}
    .info td{border:1px solid #000;padding:4px 7px;font-size:9px;vertical-align:top}
    .goods th{border:1px solid #000;padding:5px 7px;background:#e8e8e8;font-size:9px;text-align:center}
    .goods td{border:1px solid #000;padding:5px 7px;font-size:9px}
    .total-row td{background:#f0f0f0;font-weight:bold;border:1px solid #000;padding:5px 7px}
    .bank{margin-top:8px;font-size:8.5px;line-height:1.7;border:1px solid #ccc;padding:8px;background:#fafafa}
    .sig{display:flex;justify-content:space-between;margin-top:25px}
    .sig-box{border-top:1px solid #000;width:43%;text-align:center;padding-top:5px;font-size:9px}
    .foot{margin-top:15px;border-top:1px solid #999;padding-top:6px;font-size:8px;text-align:center;color:#666}
    @media print{body{margin:0}}
  </style></head><body>
  <div class="lh">
    <div>
      ${logoUrl ? `<img src="${logoUrl}" alt="Al Wajer Logo" style="height:50px;object-fit:contain;margin-bottom:4px;display:block">` : ''}
      <div class="ar">الوجـر لصناعة الأدويـة ش.م.م</div>
      <div class="co">AL WAJER PHARMACEUTICALS INDUSTRY LLC</div>
      <div class="addr">PO BOX 98, PC-327, PHASE-5, SOHAR INDUSTRIAL ESTATE, SOHAR, SULTANATE OF OMAN<br>
        Tel: +968 22372677 &nbsp;|&nbsp; CR NO: 1145026
      </div>
    </div>
    <div style="text-align:right">
      <div style="font-size:9px;color:#888">Authorized Dealer | GMP Certified</div>
    </div>
  </div>
  <div class="title">PROFORMA INVOICE</div>
  <table class="info">
    <tr>
      <td width="50%"><span style="font-size:8px;font-weight:bold;color:#555">INVOICE NO. &amp; DATE</span><br>
        <strong>${invoiceNo}</strong> &nbsp;&nbsp; Date: ${date}</td>
      <td width="50%"><span style="font-size:8px;font-weight:bold;color:#555">LC / PO NO.</span><br>
        ${lcNo || '—'}</td>
    </tr>
    <tr>
      <td><span style="font-size:8px;font-weight:bold;color:#555">EXPORTER</span><br>
        AL WAJER PHARMACEUTICALS INDUSTRY LLC<br>
        PO BOX 98, PC-327, SOHAR INDUSTRIAL ESTATE<br>
        SOHAR, SULTANATE OF OMAN<br>
        Tel: +968 22372677 &nbsp;|&nbsp; Email: moosa.ali@alwajerpharma.com
      </td>
      <td><span style="font-size:8px;font-weight:bold;color:#555">CONSIGNEE / BUYER</span><br>
        <strong>${customer}</strong><br>
        ${country}
      </td>
    </tr>
    <tr>
      <td><span style="font-size:8px;font-weight:bold;color:#555">COUNTRY OF ORIGIN</span><br>Sultanate of Oman</td>
      <td><span style="font-size:8px;font-weight:bold;color:#555">TERMS OF PAYMENT</span><br>${paymentTerms}</td>
    </tr>
  </table>

  <table class="goods">
    <thead>
      <tr>
        <th style="width:5%">#</th>
        <th>Product Description</th>
        <th style="width:15%">Qty (Kg)</th>
        <th style="width:15%">Rate/Kg (USD)</th>
        <th style="width:18%">Total Amount (USD)</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
      <tr class="total-row">
        <td colspan="4" style="text-align:right">TOTAL AMOUNT IN USD</td>
        <td style="text-align:right">$${totalUSD.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
      </tr>
    </tbody>
  </table>
  <div style="font-size:9px;margin:4px 0 8px 0;padding:5px 7px;border:1px solid #ccc;background:#fffce8">
    <strong>AMOUNT IN WORDS:</strong> ${amountInWords(totalUSD)}
  </div>
  ${totalOMR > 0 ? `<div style="font-size:9px;margin-bottom:8px;padding:4px 7px;border:1px solid #e0e0e0;">
    <strong>OMR EQUIVALENT (@ ${OMR_RATE}):</strong> OMR ${totalOMR.toLocaleString(undefined,{minimumFractionDigits:3})}
  </div>` : ''}

  <div class="bank">
    <strong>BANK DETAILS — BENEFICIARY: AL WAJER PHARMACEUTICALS INDUSTRY LLC</strong><br>
    Bank: BANK NIZWA &nbsp;|&nbsp; Account No.: 00150000174002<br>
    IBAN: OM45033000150000174002 &nbsp;|&nbsp; SWIFT/BIC: BNZWOMRXXXX<br>
    Branch: MUSCAT MAIN BRANCH<br>
    Address: P.O.BOX NO.1423, PC-133, BEACH ONE BUILDING 1, AL QURUM BEACH, AL KHUWAIR, MUSCAT, OMAN
  </div>

  <div class="sig">
    <div class="sig-box">Signature &amp; Date<br><br><br></div>
    <div class="sig-box">For Al Wajer Pharmaceuticals Industry LLC<br><br>Authorized Signatory</div>
  </div>
  <div class="foot">
    هاتف: 22372677 &nbsp;|&nbsp; ص.ب: 98، الرمز البريدي: 327، المنطقة الصناعية بصحار، سلطنة عُمان<br>
    C.R NO: 1145026, TEL: 22372677, PO BOX: 98, POSTAL CODE: 327, SOHAR INDUSTRIAL AREA, SULTANATE OF OMAN
  </div>
  </body></html>`;
}

function buildPackingListHTML(invoiceNo: string, orders: Order[], logoUrl: string): string {
  const date = orders[0]?.date || new Date().toISOString().split('T')[0];
  const customer = orders[0]?.customer || '';
  const country = orders[0]?.country || '';
  const totalQty = orders.reduce((s, o) => s + numOrZero(o.quantity), 0);

  const rows = orders.map((o, i) => `
    <tr>
      <td style="border:1px solid #000;padding:5px;text-align:center;">${i + 1}</td>
      <td style="border:1px solid #000;padding:5px;"><strong>${o.product}</strong></td>
      <td style="border:1px solid #000;padding:5px;text-align:right;">${numOrZero(o.quantity).toLocaleString()} Kg</td>
      <td style="border:1px solid #000;padding:5px;">HDPE Drums</td>
      <td style="border:1px solid #000;padding:5px;"></td>
    </tr>`).join('');

  return `<!DOCTYPE html><html><head><title>Packing List - ${invoiceNo}</title>
  <style>
    @page{size:A4;margin:15mm}
    *{box-sizing:border-box}
    body{font-family:Arial,sans-serif;font-size:10px;color:#000;margin:0}
    .lh{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:3px double #000;padding-bottom:8px;margin-bottom:10px}
    .co{font-size:13px;font-weight:bold;color:#1a3c6e}
    .ar{font-size:12px;direction:rtl;margin-bottom:3px;color:#555}
    .title{text-align:center;font-size:15px;font-weight:bold;letter-spacing:3px;text-decoration:underline;margin:10px 0}
    table{width:100%;border-collapse:collapse;margin-bottom:6px}
    .info td{border:1px solid #000;padding:4px 7px;font-size:9px;vertical-align:top}
    th{border:1px solid #000;padding:5px 7px;background:#e8e8e8;font-size:9px;text-align:center}
    td{font-size:9px}
    .total-row td{background:#f0f0f0;font-weight:bold;border:1px solid #000;padding:5px 7px}
    .foot{margin-top:15px;border-top:1px solid #999;padding-top:6px;font-size:8px;text-align:center;color:#666}
    .sig{display:flex;justify-content:space-between;margin-top:30px}
    .sig-box{border-top:1px solid #000;width:43%;text-align:center;padding-top:5px;font-size:9px}
  </style></head><body>
  <div class="lh">
    <div>
      ${logoUrl ? `<img src="${logoUrl}" alt="Al Wajer Logo" style="height:50px;object-fit:contain;margin-bottom:4px;display:block">` : ''}
      <div class="ar">الوجـر لصناعة الأدويـة ش.م.م</div>
      <div class="co">AL WAJER PHARMACEUTICALS INDUSTRY LLC</div>
      <div style="font-size:8.5px;color:#333">PO BOX 98, PC-327, SOHAR INDUSTRIAL ESTATE, SOHAR, SULTANATE OF OMAN</div>
    </div>
  </div>
  <div class="title">PACKING LIST</div>
  <table class="info">
    <tr>
      <td width="50%"><strong>Invoice No. &amp; Date:</strong> ${invoiceNo} — ${date}</td>
      <td width="50%"><strong>Consignee:</strong> ${customer}, ${country}</td>
    </tr>
    <tr>
      <td><strong>Exporter:</strong> AL WAJER PHARMACEUTICALS INDUSTRY LLC, SOHAR, OMAN</td>
      <td><strong>Country of Origin:</strong> Sultanate of Oman</td>
    </tr>
  </table>
  <table>
    <thead>
      <tr>
        <th style="width:5%">#</th>
        <th>Product Name &amp; Description</th>
        <th style="width:18%">Net Weight</th>
        <th style="width:18%">Packaging</th>
        <th style="width:20%">Marks &amp; Nos.</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
      <tr class="total-row">
        <td colspan="2" style="border:1px solid #000;padding:5px;text-align:right">TOTAL NET WEIGHT</td>
        <td style="border:1px solid #000;padding:5px;text-align:right">${totalQty.toLocaleString()} Kg</td>
        <td colspan="2" style="border:1px solid #000;padding:5px;"></td>
      </tr>
    </tbody>
  </table>
  <div class="sig">
    <div class="sig-box">Signature &amp; Date<br><br><br></div>
    <div class="sig-box">For Al Wajer Pharmaceuticals Industry LLC<br><br>Authorized Signatory</div>
  </div>
  <div class="foot">C.R NO: 1145026, TEL: 22372677, PO BOX: 98, POSTAL CODE: 327, SOHAR INDUSTRIAL AREA, SULTANATE OF OMAN</div>
  </body></html>`;
}

function buildQuotationHTML(quotNo: string, validUntil: string, incoterms: string, orders: Order[], logoUrl: string): string {
  const date = new Date().toISOString().split('T')[0];
  const customer = orders[0]?.customer || '';
  const country = orders[0]?.country || '';
  const lcNo = orders[0]?.lcNo || '';
  const paymentTerms = orders[0]?.paymentTerms || 'T/T IN ADVANCE';
  const totalUSD = orders.reduce((s, o) => s + numOrZero(o.amountUSD), 0);

  const rows = orders.map((o, i) => `
    <tr>
      <td style="border:1px solid #000;padding:6px;text-align:center;">${i + 1}</td>
      <td style="border:1px solid #000;padding:6px;"><strong>${o.product}</strong></td>
      <td style="border:1px solid #000;padding:6px;text-align:center;">3004.90</td>
      <td style="border:1px solid #000;padding:6px;text-align:right;">${numOrZero(o.quantity).toLocaleString()}</td>
      <td style="border:1px solid #000;padding:6px;text-align:right;">$${numOrZero(o.rateUSD).toFixed(2)}</td>
      <td style="border:1px solid #000;padding:6px;text-align:right;font-weight:bold;">$${numOrZero(o.amountUSD).toLocaleString()}</td>
    </tr>`).join('');

  return `<!DOCTYPE html><html><head><title>Commercial Quotation - ${quotNo}</title>
  <style>
    @page{size:A4;margin:15mm}
    *{box-sizing:border-box}
    body{font-family:Arial,sans-serif;font-size:10px;color:#000;margin:0;padding:0}
    .lh{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:3px double #000;padding-bottom:8px;margin-bottom:10px}
    .co{font-size:13px;font-weight:bold;color:#1a3c6e;letter-spacing:0.5px}
    .ar{font-size:12px;direction:rtl;margin-bottom:3px;color:#555}
    .addr{font-size:8.5px;line-height:1.6;color:#333}
    .title{text-align:center;font-size:15px;font-weight:bold;letter-spacing:3px;text-decoration:underline;margin:10px 0}
    table{width:100%;border-collapse:collapse;margin-bottom:6px}
    .info td{border:1px solid #000;padding:4px 7px;font-size:9px;vertical-align:top}
    .goods th{border:1px solid #000;padding:5px 7px;background:#e8e8e8;font-size:9px;text-align:center}
    .goods td{border:1px solid #000;padding:5px 7px;font-size:9px}
    .total-row td{background:#f0f0f0;font-weight:bold;border:1px solid #000;padding:5px 7px}
    .bank{margin-top:8px;font-size:8.5px;line-height:1.7;border:1px solid #ccc;padding:8px;background:#fafafa}
    .sig{display:flex;justify-content:space-between;margin-top:20px}
    .sig-box{border-top:1px solid #000;width:43%;text-align:center;padding-top:5px;font-size:9px}
    .foot{margin-top:15px;border-top:1px solid #999;padding-top:6px;font-size:8px;text-align:center;color:#666}
    @media print{body{margin:0}}
  </style></head><body>
  <div class="lh">
    <div>
      ${logoUrl ? `<img src="${logoUrl}" alt="Al Wajer Logo" style="height:50px;object-fit:contain;margin-bottom:4px;display:block">` : ''}
      <div class="ar">الوجـر لصناعة الأدويـة ش.م.م</div>
      <div class="co">AL WAJER PHARMACEUTICALS INDUSTRY LLC</div>
      <div class="addr">PO BOX 98, PC-327, SOHAR INDUSTRIAL ESTATE, SOHAR, SULTANATE OF OMAN<br>
        Tel: +968 22372677
      </div>
    </div>
  </div>
  <div class="title">COMMERCIAL QUOTATION</div>
  <table class="info">
    <tr>
      <td width="50%"><span style="font-size:8px;font-weight:bold;color:#555">QUOTATION NO. &amp; DATE</span><br>
        <strong>${quotNo}</strong> &nbsp;&nbsp; ${date}</td>
      <td width="50%"><span style="font-size:8px;font-weight:bold;color:#555">REFERENCE / INQUIRY NO.</span><br>
        ${lcNo || '—'}</td>
    </tr>
    <tr>
      <td colspan="2"><span style="font-size:8px;font-weight:bold;color:#555">BUYER</span><br>
        <strong>${customer}</strong> &nbsp; | &nbsp; ${country}
      </td>
    </tr>
    <tr>
      <td><span style="font-size:8px;font-weight:bold;color:#555">VALID UNTIL</span><br>${validUntil}</td>
      <td><span style="font-size:8px;font-weight:bold;color:#555">INCOTERMS</span><br>${incoterms}</td>
    </tr>
  </table>

  <table class="goods">
    <thead>
      <tr>
        <th style="width:5%">#</th>
        <th>Product Description</th>
        <th style="width:10%">HS Code</th>
        <th style="width:12%">Qty (Kg)</th>
        <th style="width:14%">Rate/Kg</th>
        <th style="width:16%">Total USD</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
      <tr class="total-row">
        <td colspan="5" style="text-align:right">TOTAL AMOUNT (USD)</td>
        <td style="text-align:right">$${totalUSD.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
      </tr>
    </tbody>
  </table>

  <div style="font-size:9px;margin:6px 0;padding:5px 7px;border:1px solid #ccc;background:#fffce8">
    <strong>AMOUNT IN WORDS:</strong> ${amountInWords(totalUSD)}
  </div>

  <div style="margin-top:8px;font-size:9px">
    <strong>PAYMENT TERMS:</strong> ${paymentTerms}<br>
    <strong>DELIVERY:</strong> As per L/C requirement<br>
  </div>

  <div class="bank">
    <strong>BANK DETAILS — BENEFICIARY: AL WAJER PHARMACEUTICALS INDUSTRY LLC</strong><br>
    Bank: BANK NIZWA &nbsp;|&nbsp; Account No.: 00150000174002<br>
    IBAN: OM45033000150000174002 &nbsp;|&nbsp; SWIFT/BIC: BNZWOMRXXXX
  </div>

  <div class="sig">
    <div class="sig-box">Signature &amp; Date<br><br><br></div>
    <div class="sig-box">For Al Wajer Pharmaceuticals<br><br>Authorized Signatory</div>
  </div>
  <div class="foot">C.R NO: 1145026, TEL: 22372677, SOHAR, SULTANATE OF OMAN</div>
  </body></html>`;
}

export const Sales: React.FC<Props> = ({ orders, apiConfig, onOpenModal, onDelete }) => {
  const [preview, setPreview] = useState<{ title: string; html: string; filename: string } | null>(null);
  const [quotTarget, setQuotTarget] = useState<{ inv: string; orders: Order[] } | null>(null);
  const [quotForm, setQuotForm] = useState({
    quotNo: '', validUntil: '', incoterms: 'FOB SOHAR PORT, OMAN', refInquiry: '', paymentTerms: 'T/T IN ADVANCE',
  });

  const grouped = orders.reduce<Record<string, Order[]>>((acc, o) => {
    const key = o.invoiceNo || 'Draft';
    if (!acc[key]) acc[key] = [];
    acc[key].push(o);
    return acc;
  }, {});

  const newOrder = (): Record<string, unknown> => ({
    id: `ORD-${Date.now()}`, sNo: '', invoiceNo: '', lcNo: '',
    date: new Date().toISOString().split('T')[0],
    customer: '', country: '', product: '', quantity: 0,
    rateUSD: 0, amountUSD: 0, amountOMR: 0, status: 'Pending',
  });

  const totalPipeline = orders.reduce((s, o) => s + numOrZero(o.amountUSD), 0);
  const pendingCount = orders.filter(o => o.status === 'Pending').length;

  const handleQuotation = (inv: string, invOrders: Order[]) => {
    const defaultValidUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setQuotTarget({ inv, orders: invOrders });
    setQuotForm({
      quotNo: `AWP/QT/${inv}`,
      validUntil: defaultValidUntil,
      incoterms: 'FOB SOHAR PORT, OMAN',
      refInquiry: invOrders[0]?.lcNo || '',
      paymentTerms: invOrders[0]?.paymentTerms || 'T/T IN ADVANCE',
    });
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <BadgeDollarSign className="text-[#F4C430]" size={20}/> Sales & Orders
        </h2>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => exportToCSV(orders as unknown as Record<string, unknown>[], 'sales')} className="erp-btn-ghost">
            <Download size={13}/> Export CSV
          </button>
          <button onClick={() => onOpenModal('add', 'sales', newOrder())} className="erp-btn-gold">
            <Plus size={15}/> New Order
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Orders', value: orders.length },
          { label: 'Pending', value: pendingCount, color: 'text-yellow-500' },
          { label: 'Pipeline (USD)', value: '$' + totalPipeline.toLocaleString() },
        ].map(s => (
          <div key={s.label} className="bg-white shadow-sm border border-[#D4AF37]/20 p-4 rounded-xl">
            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">{s.label}</p>
            <p className={`text-xl font-bold mt-1 ${s.color ?? 'text-slate-900'}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {Object.keys(grouped).length === 0 && (
          <div className="bg-white shadow-sm border border-[#D4AF37]/20 p-8 rounded-xl text-center text-slate-500">
            No orders yet. Add your first order.
          </div>
        )}
        {Object.entries(grouped).map(([inv, invOrders]) => {
          const totalUSD = invOrders.reduce((s, o) => s + numOrZero(o.amountUSD), 0);
          const totalOMR = invOrders.reduce((s, o) => s + numOrZero(o.amountOMR), 0);
          const first = invOrders[0];
          return (
            <div key={inv} className="bg-white shadow-sm border border-[#D4AF37]/30 rounded-xl overflow-hidden gold-glow">
              <div className="bg-gray-50/50 border-b border-gray-200 px-5 py-4 flex flex-wrap justify-between items-center gap-3">
                <div>
                  <span className="text-lg font-bold text-[#D4AF37]">{inv}</span>
                  <span className="ml-3 text-xs text-slate-500 font-mono">{first?.date}</span>
                  {first?.customer && <span className="ml-2 text-xs text-slate-600 font-medium">· {first.customer}</span>}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-[9px] text-slate-500 uppercase font-bold">Invoice Total</p>
                    <p className="text-sm font-bold text-slate-900">
                      ${totalUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      {totalOMR > 0 && <span className="text-xs text-slate-500 ml-1">/ OMR {totalOMR.toLocaleString()}</span>}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setPreview({ title: 'Proforma Invoice', html: buildInvoiceHTML(inv, invOrders, apiConfig.logoUrl), filename: `Invoice-${inv}` })}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-bold transition-all"
                    >
                      <FileText size={12}/> Invoice
                    </button>
                    <button
                      onClick={() => setPreview({ title: 'Packing List', html: buildPackingListHTML(inv, invOrders, apiConfig.logoUrl), filename: `PackingList-${inv}` })}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold transition-all"
                    >
                      <Package size={12}/> Packing List
                    </button>
                    <button
                      onClick={() => handleQuotation(inv, invOrders)}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-[11px] font-bold transition-all"
                    >
                      <ReceiptText size={12}/> Quotation
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[9px] text-slate-500 uppercase border-b border-gray-100">
                      <th className="px-4 py-2">Customer</th>
                      <th className="px-4 py-2 hidden sm:table-cell">Product</th>
                      <th className="px-4 py-2 hidden md:table-cell text-right">Qty (Kg)</th>
                      <th className="px-4 py-2 hidden md:table-cell text-right">Rate/Kg</th>
                      <th className="px-4 py-2 text-right">Amount (USD)</th>
                      <th className="px-4 py-2 hidden sm:table-cell">Status</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {invOrders.map(order => (
                      <tr key={order.id} className="hover:bg-gray-50 transition-all">
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900 text-sm">{order.customer || '—'}</div>
                          <div className="text-[10px] text-slate-500">{order.country}</div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <div className="text-sm text-slate-700 max-w-[200px] truncate">{order.product || '—'}</div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-right text-xs font-mono text-slate-700">
                          {numOrZero(order.quantity).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-right text-xs font-mono text-[#D4AF37]">
                          ${numOrZero(order.rateUSD).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="text-sm font-bold text-slate-900 font-mono">
                            ${numOrZero(order.amountUSD).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </div>
                          {numOrZero(order.amountOMR) > 0 && (
                            <div className="text-[10px] text-slate-500 font-mono">
                              OMR {numOrZero(order.amountOMR).toLocaleString()}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <StatusBadge status={order.status}/>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => onOpenModal('edit', 'sales', order as unknown as Record<string, unknown>)} className="p-1.5 text-slate-500 hover:text-[#D4AF37] hover:bg-yellow-50 rounded-lg transition-all"><Edit2 size={13}/></button>
                            <button onClick={() => onDelete('sales', order.id, `${order.invoiceNo} – ${order.product}`)} className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={13}/></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {preview && <DocPreview title={preview.title} html={preview.html} filename={preview.filename} onClose={() => setPreview(null)} />}

      {quotTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Commercial Quotation</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Quotation No.</label>
                <input value={quotForm.quotNo} onChange={e => setQuotForm(prev => ({ ...prev, quotNo: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 text-slate-900 rounded-lg px-3 py-2 text-sm focus:border-[#D4AF37]/50 focus:outline-none"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Valid Until</label>
                <input type="date" value={quotForm.validUntil} onChange={e => setQuotForm(prev => ({ ...prev, validUntil: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 text-slate-900 rounded-lg px-3 py-2 text-sm focus:border-[#D4AF37]/50 focus:outline-none"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Incoterms</label>
                <select value={quotForm.incoterms} onChange={e => setQuotForm(prev => ({ ...prev, incoterms: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 text-slate-900 rounded-lg px-3 py-2 text-sm focus:border-[#D4AF37]/50 focus:outline-none">
                  <option>FOB SOHAR PORT, OMAN</option>
                  <option>CIF PORT OF DISCHARGE</option>
                  <option>C&F PORT OF DISCHARGE</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-3 border-t border-gray-200">
              <button onClick={() => setQuotTarget(null)} className="flex-1 px-4 py-2 text-sm font-bold text-slate-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
              <button
                onClick={() => {
                  if (quotTarget) {
                    setPreview({
                      title: 'Commercial Quotation',
                      html: buildQuotationHTML(quotForm.quotNo, quotForm.validUntil, quotForm.incoterms, quotTarget.orders, apiConfig.logoUrl),
                      filename: `Quotation-${quotForm.quotNo}`
                    });
                    setQuotTarget(null);
                  }
                }}
                className="flex-1 px-4 py-2 text-sm font-bold text-slate-950 bg-[#D4AF37] rounded-lg hover:bg-[#c4a030]"
              >
                Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
