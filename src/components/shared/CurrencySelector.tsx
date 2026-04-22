import React from 'react';
import { useCurrency } from '../../context/CurrencyContext';

export const CurrencySelector: React.FC = () => {
  const { currency, setCurrency } = useCurrency();

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-slate-600">Currency</label>
      <select
        value={currency}
        onChange={e => setCurrency(e.target.value as any)}
        className="px-2 py-1 border rounded"
      >
        <option value="USD">USD</option>
        <option value="OMR">OMR</option>
      </select>
    </div>
  );
};

export default CurrencySelector;
