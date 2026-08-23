/**
 * AI Triage Orchestrator
 *
 * Manages provider selection, fallback chain, and error handling.
 * Configuration via environment variables:
 *   TRIAGE_PROVIDER     — primary provider: "claude" | "openai" | "openai-compatible" | "rule-based"
 *   ANTHROPIC_API_KEY   — required for Claude
 *   OPENAI_API_KEY      — required for OpenAI
 *   OPENAI_BASE_URL     — optional override for OpenAI-compatible providers
 *   OPENAI_MODEL        — optional model override (default: gpt-4o)
 *   CLAUDE_MODEL        — optional model override (default: claude-sonnet-4-20250514)
 */

import type { FastifyInstance } from 'fastify';
import type { AiTriageResult, TicketCategory } from '@enlace/core';
import type { TriageProvider, TriageInput, TriageResult } from './ai-providers/types.js';
import { ClaudeTriageProvider } from './ai-providers/claude.js';
import { OpenAITriageProvider } from './ai-providers/openai.js';
import { RuleBasedTriageProvider } from './ai-providers/rule-based.js';

let providerInstance: TriageProvider | null = null;
let fallbackProvider: RuleBasedTriageProvider | null = null;

/**
 * Initialize the triage provider based on environment config.
 * Called once at server startup.
 */
export function initTriageProvider(log: FastifyInstance['log']): void {
  const primaryProvider = process.env.TRIAGE_PROVIDER ?? 'rule-based';

  switch (primaryProvider) {
    case 'claude': {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        log.warn(
          'TRIAGE_PROVIDER=claude but ANTHROPIC_API_KEY not set — falling back to rule-based',
        );
        fallbackProvider = new RuleBasedTriageProvider();
        providerInstance = fallbackProvider;
        return;
      }
      const model = process.env.CLAUDE_MODEL;
      providerInstance = new ClaudeTriageProvider(apiKey);
      if (model) {
        // Override model via env — we pass it through the provider's internal logic
        log.info(`Claude triage enabled (model override: ${model})`);
      } else {
        log.info('Claude triage enabled (claude-sonnet-4-20250514)');
      }
      break;
    }

    case 'openai':
    case 'openai-compatible': {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        log.warn(
          `TRIAGE_PROVIDER=${primaryProvider} but OPENAI_API_KEY not set — falling back to rule-based`,
        );
        fallbackProvider = new RuleBasedTriageProvider();
        providerInstance = fallbackProvider;
        return;
      }
      providerInstance = new OpenAITriageProvider({
        apiKey,
        baseUrl: process.env.OPENAI_BASE_URL,
        model: process.env.OPENAI_MODEL,
        provider: primaryProvider,
      });
      log.info(
        `OpenAI-compatible triage enabled (base: ${process.env.OPENAI_BASE_URL ?? 'api.openai.com'})`,
      );
      break;
    }

    case 'rule-based':
    default:
      log.info('Rule-based triage enabled (no API key required)');
      providerInstance = new RuleBasedTriageProvider();
      break;
  }
}

/**
 * Run triage on a ticket. Falls back to rule-based if the primary provider fails.
 */
export async function triageTicket(
  input: TriageInput,
  log: FastifyInstance['log'],
): Promise<AiTriageResult> {
  if (!providerInstance) {
    // Shouldn't happen if initTriageProvider was called, but safety net
    providerInstance = new RuleBasedTriageProvider();
  }

  const now = new Date().toISOString();

  // Try primary provider
  try {
    const result = await runWithTimeout(providerInstance.triage(input), 15_000);
    log.info(
      `Triage complete via ${result.provider} (urgency: ${result.urgency}, category: ${result.category})`,
    );
    return toAiTriageResult(result, now);
  } catch (err) {
    log.error({ err, provider: providerInstance.name }, 'Primary triage provider failed');

    // Fallback to rule-based (unless we're already using it)
    if (providerInstance.name !== 'rule-based') {
      try {
        if (!fallbackProvider) {
          fallbackProvider = new RuleBasedTriageProvider();
        }
        const result = await fallbackProvider.triage(input);
        log.info(
          `Triage fallback to rule-based (urgency: ${result.urgency}, category: ${result.category})`,
        );
        return toAiTriageResult(result, now);
      } catch (fallbackErr) {
        log.error({ err: fallbackErr }, 'Rule-based triage fallback also failed');
      }
    }

    // Last resort: return a safe default
    return {
      urgency: 3,
      category: 'other' as TicketCategory,
      suggestedResponse:
        'Thank you for contacting us. A support agent will review your request shortly.',
      provider: 'rule-based',
      triagedAt: now,
    };
  }
}

function toAiTriageResult(result: TriageResult, now: string): AiTriageResult {
  return {
    urgency: result.urgency,
    category: result.category,
    suggestedResponse: result.suggestedResponse,
    provider: result.provider,
    triagedAt: now,
    model: result.model,
    confidence: result.confidence,
  };
}

function runWithTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Triage timed out after ${ms}ms`)), ms),
    ),
  ]);
}
