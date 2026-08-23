import { z } from 'zod';

// ---------------------------------------------------------------------------
// Customer
// ---------------------------------------------------------------------------

export const CustomerStatusSchema = z.enum(['active', 'suspended', 'cancelled']);
export type CustomerStatus = z.infer<typeof CustomerStatusSchema>;

export const CustomerSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
  planId: z.string().uuid(),
  status: CustomerStatusSchema.default('active'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Customer = z.infer<typeof CustomerSchema>;

// ---------------------------------------------------------------------------
// Plan
// ---------------------------------------------------------------------------

export const PlanSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  speedMbps: z.number().int().positive(),
  dataCapGb: z.number().int().positive().nullable(),
  price: z.number().nonnegative(),
  currency: z.string().length(3).default('USD'),
});
export type Plan = z.infer<typeof PlanSchema>;
