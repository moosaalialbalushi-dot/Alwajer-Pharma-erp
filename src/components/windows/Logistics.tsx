import React, { useMemo, useState } from 'react';
import {
  Truck, Plus, Edit2, Trash2, Plane, Ship, Package,
  MapPin, Clock, CheckCircle2, AlertCircle, Filter,
} from 'lucide-react';
import type { Shipment, ModalState } from '@/types';

interface Props {
  shipments: Shipment[];
  onOpenModal: (mode: ModalState['mode'], type: ModalState['type'], data?: Record<string, unknown>) => void;
  onDelete: (type: string, id: string, name: string) => void;
}

const STATUS_STYLES: Record<Shipment['status'], string> = {
  Scheduled:   'bg-slate-100 text-slate-700 border-slate-300',
  'In Transit':'bg-blue-100 text-blue-700 border-blue-300',
  Customs:     'bg-amber-100 text-amber-700 border-amber-300',
  Delivered:   'bg-emerald-100 text-emerald-700 border-emerald-300',
  Delayed:     'bg-red-100 text-red-700 border-red-300',
  Returned:    'bg-rose-100 text-rose-700 border-rose-300',
};

const MODE_ICONS: Record<Shipment['mode'], React.ElementType> = {
  Air:     Plane,
  Sea:     Ship,
  Road:    Truck,
  Courier: Package,
};

export const Logistics: React.FC<Props> = ({ shipments, onOpenModal, onDelete }) => {
  const [filter, setFilter] = useState<'all' | Shipment['status']>('all');

  const stats = useMemo(() => ({
    total: shipments.length,
    inTransit: shipments.filter(s => s.status === 'In Transit').length,
    delivered: shipments.filter(s => s.status === 'Delivered').length,
    delayed: shipments.filter(s => s.status === 'Delayed' || s.status === 'Customs').length,
    totalCost: shipments.reduce((sum, s) => sum + (s.cost || 0), 0),
  }), [shipments]);

  const visible = filter === 'all' ? shipments : shipments.filter(s => s.status === filter);

  const newShipment = (): Record<string, unknown> => ({
    id: `SHP-${Date.now()}`,
    referenceNo: '',
    product: '',
    quantity: 0,
    unit: 'Kg',
    carrier: '',
    trackingNumber: '',
    origin: 'Sohar, Oman',
    destination: '',
    mode: 'Sea',
    status: 'Scheduled',
    dispatchDate: new Date().toISOString().split('T')[0],
    estimatedArrival: '',
    cost: 0,
    remarks: '',
  });

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Truck className="text-[#D4AF37]" size={22}/> Logistics & Shipments
        </h2>
        <button
          onClick={() => onOpenModal('add', 'logistics', newShipment())}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-slate-950 bg-[#D4AF37] hover:bg-[#c4a030] rounded-lg transition-all"
        >
          <Plus size={15}/> New Shipment
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatCard label="Total Shipments" value={stats.total} tone="slate"/>
        <StatCard label="In Transit" value={stats.inTransit} tone="blue" icon={Truck}/>
        <StatCard label="Delivered" value={stats.delivered} tone="emerald" icon={CheckCircle2}/>
        <StatCard label="Delayed / Customs" value={stats.delayed} tone="amber" icon={AlertCircle}/>
        <StatCard label="Total Cost (USD)" value={stats.totalCost.toLocaleString()} tone="gold"/>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
        <Filter size={14} className="text-slate-500"/>
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Filter</span>
        {(['all', 'Scheduled', 'In Transit', 'Customs', 'Delivered', 'Delayed', 'Returned'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all ${
              filter === f
                ? 'bg-[#D4AF37] text-slate-950 border-[#D4AF37]'
                : 'bg-gray-50 text-slate-600 border-gray-200 hover:bg-gray-100'
            }`}
          >
            {f === 'all' ? 'All' : f}
          </button>
        ))}
      </div>

      {/* Shipment cards */}
      <div className="space-y-3">
        {visible.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-slate-500 shadow-sm">
            No shipments match the current filter.
          </div>
        )}
        {visible.map(shipment => {
          const ModeIcon = MODE_ICONS[shipment.mode];
          return (
            <div key={shipment.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
                <div className="flex-1 min-w-[260px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[#D4AF37] font-mono text-xs font-bold">{shipment.referenceNo || shipment.id}</span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${STATUS_STYLES[shipment.status]}`}>
                      {shipment.status}
                    </span>
                    <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-slate-700 bg-gray-100 border border-gray-200 rounded-full">
                      <ModeIcon size={11}/> {shipment.mode}
                    </span>
                  </div>
                  <h3 className="text-slate-900 font-bold mt-1.5">{shipment.product}</h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {shipment.quantity} {shipment.unit} · {shipment.carrier}
                  </p>
                </div>

                <div className="flex gap-1">
                  <button
                    onClick={() => onOpenModal('view', 'logistics', shipment as unknown as Record<string, unknown>)}
                    className="p-1.5 rounded hover:bg-gray-100 text-slate-500"
                    title="View"
                  >
                    <Package size={14}/>
                  </button>
                  <button
                    onClick={() => onOpenModal('edit', 'logistics', shipment as unknown as Record<string, unknown>)}
                    className="p-1.5 rounded hover:bg-amber-100 text-[#D4AF37]"
                    title="Edit"
                  >
                    <Edit2 size={14}/>
                  </button>
                  <button
                    onClick={() => onDelete('logistics', shipment.id, shipment.referenceNo || shipment.id)}
                    className="p-1.5 rounded hover:bg-red-100 text-red-500"
                    title="Delete"
                  >
                    <Trash2 size={14}/>
                  </button>
                </div>
              </div>

              {/* Route */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="text-emerald-500 mt-0.5 shrink-0"/>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Origin</p>
                    <p className="text-slate-800 font-medium">{shipment.origin}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Dispatched: {shipment.dispatchDate}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="text-red-500 mt-0.5 shrink-0"/>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Destination</p>
                    <p className="text-slate-800 font-medium">{shipment.destination}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      ETA: {shipment.estimatedArrival}
                      {shipment.actualArrival && ` · Arrived: ${shipment.actualArrival}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Clock size={14} className="text-[#D4AF37] mt-0.5 shrink-0"/>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Cost & Tracking</p>
                    <p className="text-slate-800 font-medium">${shipment.cost.toLocaleString()}</p>
                    {shipment.trackingNumber && (
                      <p className="text-[10px] text-[#D4AF37] font-mono mt-0.5">{shipment.trackingNumber}</p>
                    )}
                  </div>
                </div>
              </div>

              {shipment.remarks && (
                <p className="mt-3 pt-3 border-t border-gray-100 text-[11px] text-slate-500 italic">
                  {shipment.remarks}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: number | string;
  tone: 'slate' | 'blue' | 'emerald' | 'amber' | 'gold';
  icon?: React.ElementType;
}

const TONE_STYLES: Record<StatCardProps['tone'], string> = {
  slate:   'bg-white border-gray-200 text-slate-900',
  blue:    'bg-blue-50 border-blue-200 text-blue-900',
  emerald: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  amber:   'bg-amber-50 border-amber-200 text-amber-900',
  gold:    'bg-[#D4AF37]/10 border-[#D4AF37]/40 text-slate-900',
};

const StatCard: React.FC<StatCardProps> = ({ label, value, tone, icon: Icon }) => (
  <div className={`border rounded-xl p-3 shadow-sm ${TONE_STYLES[tone]}`}>
    <div className="flex items-center justify-between">
      <p className="text-[10px] uppercase font-bold tracking-wider opacity-70">{label}</p>
      {Icon && <Icon size={13} className="opacity-60"/>}
    </div>
    <p className="text-xl font-bold mt-1">{value}</p>
  </div>
);
