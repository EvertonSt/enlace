/**
 * @enlace/core — single source of truth for every type, schema, and
 * utility that crosses an app/package boundary.
 */

// Domain schemas & inferred types -------------------------------------------

export {
  CustomerSchema,
  CustomerStatusSchema,
  type Customer,
  type CustomerStatus,
} from './schemas/customer.js';

export {
  PlanSchema,
  type Plan,
} from './schemas/customer.js';

export {
  InvoiceSchema,
  InvoiceStatusSchema,
  InvoiceLineItemSchema,
  type Invoice,
  type InvoiceStatus,
  type InvoiceLineItem,
} from './schemas/invoice.js';

export {
  TicketSchema,
  TicketStatusSchema,
  TicketPrioritySchema,
  TicketCategorySchema,
  TriageProviderSchema,
  AiTriageResultSchema,
  CreateTicketRequestSchema,
  type Ticket,
  type TicketStatus,
  type TicketPriority,
  type TicketCategory,
  type TriageProvider,
  type AiTriageResult,
  type CreateTicketRequest,
} from './schemas/ticket.js';

export {
  OutageEventSchema,
  OutageStatusSchema,
  type OutageEvent,
  type OutageStatus,
} from './schemas/outage.js';

export {
  TechnicianJobSchema,
  TechnicianJobStatusSchema,
  type TechnicianJob,
  type TechnicianJobStatus,
} from './schemas/technician.js';

// API client -----------------------------------------------------------------

export {
  apiFetch,
  api,
  configureApiClient,
  ApiError,
  type ApiClientConfig,
} from './api-client.js';

// i18n resources ------------------------------------------------------------

export {
  enResources,
  ptBRResources,
  supportedLocales,
  type SupportedLocale,
} from './i18n/index.js';
