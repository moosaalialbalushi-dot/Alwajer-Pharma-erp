/**
 * CurrencyProvider — Global multi-currency context
 * Supports USD | SDG (Sudanese Pound) | OMR (Omani Rial)
 * 
 * Usage:
 *   <CurrencyProvider>
 *     <App />
 *   </CurrencyProvider>
 * 
 *   Then in any component:
 *   const { currency, setCurrency, convert, fmt } = useCurrency();
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

export type Currency = 'USD' | 'SDG' | 'OMR';

interface CurrencyRates {
  usdToSdg: number;  // 1 USD = x SDG
  usdToOmr: number;  // 1 USD = x OMR
}

interface CurrencyContextValue {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  rates: CurrencyRates;
  setRates: (r: CurrencyRates) => void;
  /** Convert a USD amount to the active display currency */
  convert: (usdAmount: number) => number;
  /** Format an amount (in USD) to the active display currency with symbol */
  fmt: (usdAmount: number, decimals?: number) => string;
  /** Format with explicit currency */
  fmtIn: (usdAmount: number, currency: Currency, decimals?: number) => string;
  /** Symbol for active currency */
  symbol: string;
}

const DEFAULT_RATES: CurrencyRates = {
  usdToSdg: 555,
  usdToOmr: 0.3845,
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

const SYMBOLS: Record<Currency, string> = {
  USD: '$',
  SDG: 'SDG',
  OMR: 'OMR',
};

const DECIMALS: Record<Currency, number> = {
  USD: 2,
  SDG: 0,
  OMR: 3,
};

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<Currency>(() => {
    try {
      const saved = localStorage.getItem('erp_currency');
      return (saved as Currency) || 'USD';
    } catch { return 'USD'; }
  });

  const [rates, setRatesState] = useState<CurrencyRates>(() => {
    try {
      const saved = localStorage.getItem('erp_currency_rates');
      return saved ? JSON.parse(saved) : DEFAULT_RATES;
    } catch { return DEFAULT_RATES; }
  });

  const handleSetCurrency = useCallback((c: Currency) => {
    setCurrency(c);
    try { localStorage.setItem('erp_currency', c); } catch { /* ignore */ }
  }, []);

  const handleSetRates = useCallback((r: CurrencyRates) => {
    setRatesState(r);
    try { localStorage.setItem('erp_currency_rates', JSON.stringify(r)); } catch { /* ignore */ }
  }, []);

  const convert = useCallback((usdAmount: number): number => {
    if (currency === 'USD') return usdAmount;
    if (currency === 'SDG') return usdAmount * rates.usdToSdg;
    if (currency === 'OMR') return usdAmount * rates.usdToOmr;
    return usdAmount;
  }, [currency, rates]);

  const fmtIn = useCallback((usdAmount: number, cur: Currency, decimals?: number): string => {
    let amount = usdAmount;
    if (cur === 'SDG') amount = usdAmount * rates.usdToSdg;
    if (cur === 'OMR') amount = usdAmount * rates.usdToOmr;
    const d = decimals ?? DECIMALS[cur];
    const sym = SYMBOLS[cur];
    const formatted = amount.toLocaleString(undefined, {
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    });
    return cur === 'USD' ? `$${formatted}` : `${sym} ${formatted}`;
  }, [rates]);

  const fmt = useCallback((usdAmount: number, decimals?: number): string => {
    return fmtIn(usdAmount, currency, decimals);
  }, [fmtIn, currency]);

  const value: CurrencyContextValue = {
    currency,
    setCurrency: handleSetCurrency,
    rates,
    setRates: handleSetRates,
    convert,
    fmt,
    fmtIn,
    symbol: SYMBOLS[currency],
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used inside <CurrencyProvider>');
  return ctx;
}

/** Compact currency toggle widget for the header */
export function CurrencyToggle() {
  const { currency, setCurrency } = useCurrency();
  const currencies: Currency[] = ['USD', 'SDG', 'OMR'];

  return (
    <div className="flex items-center bg-slate-100 rounded-lg p-0.5 gap-0.5">
      {currencies.map(c => (
        <button
          key={c}
          onClick={() => setCurrency(c)}
          title={c === 'USD' ? 'US Dollar' : c === 'SDG' ? 'Sudanese Pound' : 'Omani Rial'}
          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
            currency === c
              ? 'bg-[#D4AF37] text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 hover:bg-white/70'
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
