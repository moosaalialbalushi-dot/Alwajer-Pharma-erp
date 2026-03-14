// importSchemas.ts
// NOTE: App.tsx was importing this file twice — remove the duplicate import line.

export interface ImportDataSchema {
  inventory?: {
    sNo?: string;
    name: string;
    category?: 'API' | 'Excipient' | 'Packing' | 'Finished' | 'Spare';
    required?: number;
    stock?: number;
    unit?: string;
    date?: string;
  }[];
  orders?: {
    customer: string;
    product: string;
    quantity: number;
    amountUSD?: number;
    rateUSD?: number;
    status?: string;
    invoiceNo?: string;
    date?: string;
    country?: string;
  }[];
  ingredients?: {
    name: string;
    quantity: number;
    unit?: string;
    rateUSD?: number;
    role?: string;
  }[];
  batchSize?: number;
}
