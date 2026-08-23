import { z } from 'zod';

// ---------------------------------------------------------------------------
// Support Ticket
// ---------------------------------------------------------------------------

export const TicketStatusSchema = z.enum([
  'open',
  'in_progress',
  'waiting_customer',
  'resolved',
  'closed',
]);
export type TicketStatus = z.infer<typeof TicketStatusSchema>;

export const TicketPrioritySchema = z.enum([
  'low',
  'medium',
  'high',
  'critical',
]);
export type TicketPriority = z.infer<typeof TicketPrioritySchema>;

export const TicketCategorySchema = z.enum([
  'outage',
  'billing',
  'speed',
  'installation',
  'equipment',
  'other',
]);
export type TicketCategory = z.infer<typeof TicketCategorySchema>;

// ---------------------------------------------------------------------------
// AI Triage Result
// ---------------------------------------------------------------------------

export const TriageProviderSchema = z.enum([
  'claude',
  'openai',
  'openai-compatible',
  'rule-based',
]);
export type TriageProvider = z.infer<typeof TriageProviderSchema>;

export const AiTriageResultSchema = z.object({
  /** Urgency score 1 (low) to 5 (critical). */
  urgency: z.number().int().min(1).max(5),
  /** AI-classified ticket category. */
  category: TicketCategorySchema,
  /** Auto-drafted first-response for agent review. */
  suggestedResponse: z.string().optional(),
  /** Which provider produced this triage. */
  provider: TriageProviderSchema,
  /** ISO timestamp of when triage ran. */
  triagedAt: z.string().datetime(),
  /** Model identifier (e.g. "claude-sonnet-4-20250514", "gpt-4o"). */
  model: z.string().optional(),
  /** Raw confidence score 0–1 from the provider, if available. */
  confidence: z.number().min(0).max(1).optional(),
});
export type AiTriageResult = z.infer<typeof AiTriageResultSchema>;

// ---------------------------------------------------------------------------
// Ticket (full)
// ---------------------------------------------------------------------------

export const TicketSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  subject: z.string().min(1),
  body: z.string().min(1),
  status: TicketStatusSchema.default('open'),
  priority: TicketPrioritySchema.default('medium'),
  category: TicketCategorySchema.default('other'),
  assignedTo: z.string().uuid().nullable().default(null),
  aiTriage: AiTriageResultSchema.nullable().default(null),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Ticket = z.infer<typeof TicketSchema>;

// ---------------------------------------------------------------------------
// Create-Ticket request (what the client sends)
// ---------------------------------------------------------------------------

export const CreateTicketRequestSchema = z.object({
  customerId: z.string().uuid(),
  subject: z.string().min(1).max(200),
  body: z.string().min(10).max(5000),
});
export type CreateTicketRequest = z.infer<typeof CreateTicketRequestSchema>;
