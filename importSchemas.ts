import { z } from 'zod';

export const InventoryItemSchema = z.object({
  sNo: z.string().optional(),
  name: z.string(),
  category: z.enum(['API', 'Excipient', 'Packing', 'Finished', 'Spare']),
  requiredForOrders: z.number().optional(),
  stock: z.number(),
  unit: z.string().optional(),
  stockDate: z.string().optional(),
});

export const OrderSchema = z.object({
  invoiceNo: z.string(),
  date: z.string().optional(),
  customer: z.string(),
  country: z.string().optional(),
  product: z.string(),
  quantity: z.number(),
  rateUSD: z.number().optional(),
  amountUSD: z.number(),
  status: z.string().optional(),
});

export const ImportDataSchema = z.object({
  inventory: z.array(InventoryItemSchema).optional(),
  orders: z.array(OrderSchema).optional(),
});
