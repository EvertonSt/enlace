import { z } from 'zod';

// ---------------------------------------------------------------------------
// Technician Job
// ---------------------------------------------------------------------------

export const TechnicianJobStatusSchema = z.enum([
  'assigned',
  'en_route',
  'on_site',
  'completed',
  'cancelled',
]);
export type TechnicianJobStatus = z.infer<typeof TechnicianJobStatusSchema>;

export const TechnicianJobSchema = z.object({
  id: z.string().uuid(),
  ticketId: z.string().uuid(),
  technicianId: z.string().uuid(),
  status: TechnicianJobStatusSchema.default('assigned'),
  scheduledAt: z.string().datetime(),
  startedAt: z.string().datetime().nullable().default(null),
  completedAt: z.string().datetime().nullable().default(null),
  notes: z.string().optional(),
  location: z.string().optional(),
});
export type TechnicianJob = z.infer<typeof TechnicianJobSchema>;
