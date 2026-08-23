/**
 * Rule-based fallback triage provider.
 * No API key needed — uses keyword matching and heuristics.
 * Always available as a safety net when LLM providers are down or unconfigured.
 */

import type {
  TriageProvider,
  TriageInput,
  TriageResult,
} from './types.js';
import type { TicketCategory } from '@enlace/core';

interface CategoryRule {
  category: TicketCategory;
  keywords: string[];
  urgencyBoost: number; // added to base urgency
}

const CATEGORY_RULES: CategoryRule[] = [
  {
    category: 'outage',
    keywords: [
      'outage', 'down', 'no internet', 'no connection', 'service down',
      'everything is off', 'can\'t connect', 'area-wide', 'all of us',
      'whole neighborhood', 'nobody has internet',
    ],
    urgencyBoost: 2,
  },
  {
    category: 'billing',
    keywords: [
      'bill', 'charge', 'invoice', 'payment', 'overcharge', 'refund',
      'account', 'plan change', 'cancel', 'pricing', 'wrong amount',
    ],
    urgencyBoost: 0,
  },
  {
    category: 'speed',
    keywords: [
      'slow', 'speed', 'buffering', 'lag', 'latency', 'Mbps',
      'throttled', 'bandwidth', 'streaming', 'speed test',
    ],
    urgencyBoost: 1,
  },
  {
    category: 'installation',
    keywords: [
      'install', 'setup', 'new service', 'technician visit',
      'fiber installation', 'schedule', 'appointment',
    ],
    urgencyBoost: 0,
  },
  {
    category: 'equipment',
    keywords: [
      'router', 'modem', 'ont', 'ont box', 'hardware', 'broken',
      'replacement', 'equipment', 'wifi', 'ethernet',
    ],
    urgencyBoost: 0,
  },
];

const URGENCY_KEYWORDS: Record<number, string[]> = {
  5: ['emergency', 'dangerous', 'fire', 'safety', 'legal', 'police', 'lawyer'],
  4: ['unacceptable', 'furious', 'demand', 'immediately', 'terrible', 'worst'],
  3: ['urgent', 'important', 'asap', 'frustrated', 'many times', 'again'],
  2: ['soon', 'help', 'please', 'issue', 'problem', 'trouble'],
};

const DRAFT_TEMPLATES: Record<TicketCategory, string> = {
  outage:
    'We are aware of a service disruption in your area and our field team is working to restore connectivity. We will provide an update within the next hour. Thank you for your patience.',
  billing:
    'Thank you for reporting this billing concern. Our finance team is reviewing your account and will reach out within 1 business day with a resolution.',
  speed:
    'We\'re sorry to hear about your speed issues. Our network team will investigate the performance in your area. In the meantime, try restarting your equipment.',
  installation:
    'We\'ve received your installation request. Our scheduling team will contact you within 24 hours to confirm your technician appointment.',
  equipment:
    'We understand you\'re experiencing equipment issues. Our support team will help troubleshoot or arrange a replacement if needed.',
  other:
    'Thank you for reaching out. A support agent will review your request and respond within 24 hours.',
};

export class RuleBasedTriageProvider implements TriageProvider {
  readonly name = 'rule-based' as const;

  async triage(input: TriageInput): Promise<TriageResult> {
    const text = `${input.subject} ${input.body}`.toLowerCase();

    // Classify category
    let bestCategory: TicketCategory = 'other';
    let bestScore = 0;
    for (const rule of CATEGORY_RULES) {
      const score = rule.keywords.filter((kw) => text.includes(kw)).length;
      if (score > bestScore) {
        bestScore = score;
        bestCategory = rule.category;
      }
    }

    // Determine urgency from keywords + category boost
    let baseUrgency = 2;
    for (let level = 5; level >= 1; level--) {
      if (URGENCY_KEYWORDS[level]?.some((kw) => text.includes(kw))) {
        baseUrgency = level;
        break;
      }
    }

    const categoryRule = CATEGORY_RULES.find(
      (r) => r.category === bestCategory,
    );
    const urgency = Math.max(
      1,
      Math.min(5, baseUrgency + (categoryRule?.urgencyBoost ?? 0)),
    );

    // Confidence based on how many keywords matched
    const confidence = Math.min(0.95, 0.5 + bestScore * 0.1);

    return {
      urgency,
      category: bestCategory,
      suggestedResponse: DRAFT_TEMPLATES[bestCategory],
      provider: 'rule-based',
      model: 'keyword-heuristic-v1',
      confidence,
    };
  }
}
