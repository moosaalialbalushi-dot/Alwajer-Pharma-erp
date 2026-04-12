import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<Props> = ({ isOpen, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-full bg-red-100">
            <AlertTriangle className="text-red-500" size={22} />
          </div>
          <div className="flex-1">
            <h3 className="text-slate-900 font-bold mb-2">Confirm Action</h3>
            <p className="text-slate-600 text-sm">{message}</p>
          </div>
          <button onClick={onCancel} className="text-slate-500 hover:text-slate-900 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all">
            Cancel
          </button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-all">
            Confirm Delete
          </button>
        </div>
      </div>
    </div>
  );
};
