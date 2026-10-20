/**
 * Anthropic Claude API client.
 * Checks for the API key at instantiation time and surfaces a clear error
 * if it is missing rather than letting it fail silently at runtime.
 */
import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env';

let _client: Anthropic | null = null;

export function isAnthropicConfigured(): boolean {
  return (
    !!env.ANTHROPIC_API_KEY &&
    env.ANTHROPIC_API_KEY !== 'your-anthropic-api-key-here' &&
    env.ANTHROPIC_API_KEY.startsWith('sk-ant-')
  );
}

export function getAnthropicClient(): Anthropic {
  if (!_client) {
    if (!isAnthropicConfigured()) {
      throw new Error(
        'ANTHROPIC_API_KEY is not configured. Set it in your .env file to enable live Claude AI features.',
      );
    }
    _client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }
  return _client;
}

/** Model constants */
export const CLAUDE_MODELS = {
  /** Fast model for routine field comparison and brief explanations */
  HAIKU: 'claude-3-5-haiku-20241022' as const,
  /** Stronger model for conflict investigation and holiday reasoning */
  SONNET: 'claude-3-5-sonnet-20241022' as const,
};
