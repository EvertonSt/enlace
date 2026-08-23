import { z } from 'zod';

// ---------------------------------------------------------------------------
// Outage Event
// ---------------------------------------------------------------------------

export const OutageStatusSchema = z.enum([
  'reported',
  'investigating',
  'identified',
  'fix_in_progress',
  'resolved',
]);
export type OutageStatus = z.infer<typeof OutageStatusSchema>;

export const OutageEventSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  status: OutageStatusSchema.default('reported'),
  affectedArea: z.string().min(1),
  affectedCustomerCount: z.number().int().nonnegative().default(0),
  startedAt: z.string().datetime(),
  estimatedResolution: z.string().datetime().nullable().default(null),
  resolvedAt: z.string().datetime().nullable().default(null),
  createdAt: z.string().datetime(),
});
export type OutageEvent = z.infer<typeof OutageEventSchema>;
