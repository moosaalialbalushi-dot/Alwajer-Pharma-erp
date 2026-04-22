import React, { createContext, useContext, useState, useEffect } from 'react';

type Currency = 'USD' | 'OMR';

interface CurrencyContextValue {
  currency: Currency;
  setCurrency: (c: Currency) => void;
}

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    try {
      const saved = localStorage.getItem('erp_currency');
      return (saved === 'OMR' ? 'OMR' : 'USD') as Currency;
    } catch {
      return 'USD';
    }
  });

  useEffect(() => {
    try { localStorage.setItem('erp_currency', currency); } catch {}
  }, [currency]);

  const setCurrency = (c: Currency) => setCurrencyState(c);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}

export type { Currency };
