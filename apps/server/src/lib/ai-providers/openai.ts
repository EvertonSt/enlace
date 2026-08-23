/**
 * OpenAI-compatible provider for ticket triage.
 * Works with OpenAI, Azure OpenAI, and any OpenAI-compatible API
 * (Ollama, LiteLLM, vLLM, Together AI, Groq, Fireworks, etc.)
 *
 * Set OPENAI_BASE_URL to override the default endpoint.
 */

import type { TriageProvider, TriageInput, TriageResult } from './types.js';
import { TRIAGE_SYSTEM_PROMPT, buildTriageUserPrompt } from './types.js';
import { parseTriageJson } from './claude.js';

const DEFAULT_MODEL = 'gpt-4o';

export interface OpenAIProviderConfig {
  apiKey: string;
  /** Base URL override. Defaults to https://api.openai.com/v1 */
  baseUrl?: string;
  /** Model to use. Defaults to gpt-4o */
  model?: string;
  /** Provider label — change for display purposes */
  provider?: 'openai' | 'openai-compatible';
}

export class OpenAITriageProvider implements TriageProvider {
  readonly name: TriageResult['provider'];
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(config: OpenAIProviderConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl ?? 'https://api.openai.com/v1').replace(
      /\/$/,
      '',
    );
    this.model = config.model ?? DEFAULT_MODEL;
    this.name = config.provider ?? 'openai';
  }

  async triage(input: TriageInput): Promise<TriageResult> {
    const url = `${this.baseUrl}/chat/completions`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: TRIAGE_SYSTEM_PROMPT },
          { role: 'user', content: buildTriageUserPrompt(input) },
        ],
        temperature: 0.1,
        max_tokens: 512,
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI API error ${res.status}: ${err}`);
    }

    const data = (await res.json()) as {
      choices: Array<{ message: { content: string } }>;
    };

    const text = data.choices[0]?.message?.content ?? '';
    const parsed = parseTriageJson(text);

    return {
      ...parsed,
      provider: this.name,
      model: this.model,
    };
  }
}
