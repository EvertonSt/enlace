import { z } from 'zod';

// ---------------------------------------------------------------------------
// Invoice
// ---------------------------------------------------------------------------

export const InvoiceStatusSchema = z.enum([
  'pending',
  'paid',
  'overdue',
  'cancelled',
]);
export type InvoiceStatus = z.infer<typeof InvoiceStatusSchema>;

export const InvoiceLineItemSchema = z.object({
  description: z.string(),
  amount: z.number(),
});
export type InvoiceLineItem = z.infer<typeof InvoiceLineItemSchema>;

export const InvoiceSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  amount: z.number().nonnegative(),
  currency: z.string().length(3).default('USD'),
  dueDate: z.string().datetime(),
  status: InvoiceStatusSchema.default('pending'),
  lineItems: z.array(InvoiceLineItemSchema).default([]),
  createdAt: z.string().datetime(),
});
export type Invoice = z.infer<typeof InvoiceSchema>;
