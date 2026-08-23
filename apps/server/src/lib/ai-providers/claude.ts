/**
 * Anthropic Claude provider for ticket triage.
 * Uses the @anthropic-ai/sdk to call the Messages API.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { TriageProvider, TriageInput, TriageResult } from './types.js';
import { TRIAGE_SYSTEM_PROMPT, buildTriageUserPrompt } from './types.js';

const MODEL = 'claude-sonnet-4-20250514';

export class ClaudeTriageProvider implements TriageProvider {
  readonly name = 'claude' as const;
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async triage(input: TriageInput): Promise<TriageResult> {
    const response = await this.client.messages.create({
      model: MODEL,
      max_tokens: 512,
      system: TRIAGE_SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: buildTriageUserPrompt(input) },
      ],
    });

    const text =
      response.content[0]?.type === 'text' ? response.content[0].text : '';

    const parsed = parseTriageJson(text);

    return {
      ...parsed,
      provider: 'claude',
      model: MODEL,
    };
  }
}

// ---------------------------------------------------------------------------
// Shared JSON parser (also used by OpenAI provider)
// ---------------------------------------------------------------------------

export function parseTriageJson(text: string): {
  urgency: number;
  category: TriageResult['category'];
  suggestedResponse: string;
  confidence?: number;
} {
  // Strip markdown fences if present
  const cleaned = text
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .trim();

  const parsed = JSON.parse(cleaned) as Record<string, unknown>;

  return {
    urgency: clampUrgency(parsed['urgency']),
    category: parsed['category'] as TriageResult['category'],
    suggestedResponse:
      typeof parsed['suggestedResponse'] === 'string'
        ? parsed['suggestedResponse']
        : 'Thank you for contacting us. A support agent will review your request shortly.',
    confidence:
      typeof parsed['confidence'] === 'number'
        ? parsed['confidence']
        : undefined,
  };
}

function clampUrgency(val: unknown): number {
  const n = typeof val === 'number' ? val : 3;
  return Math.max(1, Math.min(5, Math.round(n)));
}
