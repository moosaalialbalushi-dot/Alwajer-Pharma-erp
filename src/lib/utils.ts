export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  try {
    const opts: Intl.NumberFormatOptions = { style: 'currency', currency } as Intl.NumberFormatOptions;
    // For OMR, show three decimal places commonly used for OMR
    if (currency === 'OMR') opts.maximumFractionDigits = 3;
    return new Intl.NumberFormat(undefined, opts).format(amount);
  } catch {
    // Fallback: prefix code then number
    if (currency === 'OMR') return `OMR ${amount.toLocaleString()}`;
    return `${currency} ${amount.toLocaleString()}`;
  }
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

export function today(): string {
  return new Date().toISOString().split('T')[0];
}

export function clsx(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
