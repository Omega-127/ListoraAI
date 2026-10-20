/**
 * Anthropic Claude API client.
 * Checks for the API key at instantiation time and surfaces a clear error
 * if it is missing rather than letting it fail silently at runtime.
 */
import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env';

let _client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!_client) {
    if (!env.ANTHROPIC_API_KEY || env.ANTHROPIC_API_KEY === 'your-anthropic-api-key-here') {
      throw new Error(
        'ANTHROPIC_API_KEY is not configured. Set it in your .env file to enable AI features.',
      );
    }
    _client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }
  return _client;
}

/** Model constants */
export const CLAUDE_MODELS = {
  /** Fast model for routine field comparison and brief explanations */
  HAIKU: 'claude-haiku-4-5' as const,
  /** Stronger model for conflict investigation and holiday reasoning */
  SONNET: 'claude-sonnet-4-5' as const,
};
