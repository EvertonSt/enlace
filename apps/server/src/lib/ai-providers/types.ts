/**
 * Shared types for all AI triage providers.
 * Each provider implements TriageProvider and returns a TriageResult.
 */

import type { TicketCategory, TicketPriority } from '@enlace/core';

export interface TriageInput {
  subject: string;
  body: string;
}

export interface TriageResult {
  urgency: number; // 1–5
  category: TicketCategory;
  suggestedResponse: string;
  provider: 'claude' | 'openai' | 'openai-compatible' | 'rule-based';
  model?: string;
  confidence?: number;
}

export type TriageProviderName = TriageResult['provider'];

export interface TriageProvider {
  readonly name: TriageResult['provider'];
  triage(input: TriageInput): Promise<TriageResult>;
}

// ---------------------------------------------------------------------------
// Prompt shared across LLM providers
// ---------------------------------------------------------------------------

export const TRIAGE_SYSTEM_PROMPT = `You are an expert ISP customer support triage system.
Analyze the following support ticket and return a JSON object with these fields:

- "urgency": integer 1-5 where 1=low, 2=medium, 3=high, 4=critical, 5=emergency
- "category": one of "outage", "billing", "speed", "installation", "equipment", "other"
- "suggestedResponse": a brief, empathetic first-response draft (2-3 sentences) that a human agent can review and send

Rules for urgency:
- 5 (emergency): total service outage affecting many customers, safety concern, legal threat
- 4 (critical): complete service loss for individual customer, repeated unresolved issues
- 3 (high): significant service degradation, billing overcharge >20%, equipment failure
- 2 (medium): speed issues, minor billing questions, installation scheduling
- 1 (low): general inquiries, feedback, feature requests

Rules for category:
- "outage": any mention of no internet, service down, area-wide issues
- "billing": charges, payments, invoices, plan changes, refunds
- "speed": slow internet, buffering, latency, speed test results
- "installation": new service, setup, technician visit, fiber installation
- "equipment": router/modem issues, hardware problems, replacement
- "other": anything that doesn't fit above

Return ONLY valid JSON, no markdown fences or extra text.`;

export function buildTriageUserPrompt(input: TriageInput): string {
  return `Subject: ${input.subject}\n\nBody:\n${input.body}`;
}
