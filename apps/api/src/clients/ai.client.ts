/**
 * Unified AI Client Configuration & Provider Detection
 * Supports:
 * - Groq (gsk_...) - ultra-fast inference
 * - xAI Grok (xai-...) - Grok-2 reasoning models
 * - Anthropic (sk-ant-...) - Claude 3.5 Sonnet & Haiku
 * - OpenAI (sk-...) - GPT-4o models
 */
import { env } from '../config/env';

export type AIProvider = 'groq' | 'grok' | 'anthropic' | 'openai' | 'none';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  baseURL: string;
  defaultModel: string;
  strongModel: string;
  name: string;
}

export function getAIConfig(): AIConfig {
  // Check explicit provider override
  const forcedProvider = env.AI_PROVIDER?.toLowerCase() as AIProvider | undefined;

  // Search through all possible keys
  const candidates: Array<{ key: string | undefined; preferredProvider?: AIProvider }> = [
    { key: env.GROQ_API_KEY, preferredProvider: 'groq' },
    { key: env.GROK_API_KEY, preferredProvider: 'grok' },
    { key: env.XAI_API_KEY, preferredProvider: 'grok' },
    { key: env.OPENAI_API_KEY, preferredProvider: 'openai' },
    { key: env.ANTHROPIC_API_KEY },
  ];

  for (const { key, preferredProvider } of candidates) {
    if (!key || key.includes('placeholder') || key === 'your-anthropic-api-key-here' || key.trim() === '') {
      continue;
    }

    const trimmed = key.trim();

    if (forcedProvider && forcedProvider !== 'none') {
      return buildConfigForProvider(forcedProvider, trimmed);
    }

    if (preferredProvider) {
      return buildConfigForProvider(preferredProvider, trimmed);
    }

    // Auto-detect provider based on key prefix
    if (trimmed.startsWith('gsk_')) {
      return buildConfigForProvider('groq', trimmed);
    }
    if (trimmed.startsWith('xai-')) {
      return buildConfigForProvider('grok', trimmed);
    }
    if (trimmed.startsWith('sk-ant-')) {
      return buildConfigForProvider('anthropic', trimmed);
    }
    if (trimmed.startsWith('sk-')) {
      return buildConfigForProvider('openai', trimmed);
    }
  }

  return {
    provider: 'none',
    apiKey: '',
    baseURL: '',
    defaultModel: '',
    strongModel: '',
    name: 'None',
  };
}

function buildConfigForProvider(provider: AIProvider, apiKey: string): AIConfig {
  switch (provider) {
    case 'groq':
      return {
        provider: 'groq',
        apiKey,
        baseURL: 'https://api.groq.com/openai/v1',
        defaultModel: env.AI_MODEL || 'qwen/qwen3.8-27b',
        strongModel: env.AI_MODEL || 'openai/gpt-oss-120b',
        name: 'Groq (Grok/Fast)',
      };

    case 'grok':
      return {
        provider: 'grok',
        apiKey,
        baseURL: 'https://api.x.ai/v1',
        defaultModel: env.AI_MODEL || 'grok-2-latest',
        strongModel: env.AI_MODEL || 'grok-2-latest',
        name: 'xAI Grok',
      };

    case 'anthropic':
      return {
        provider: 'anthropic',
        apiKey,
        baseURL: 'https://api.anthropic.com',
        defaultModel: env.AI_MODEL || 'claude-3-5-haiku-20241022',
        strongModel: env.AI_MODEL || 'claude-3-5-sonnet-20241022',
        name: 'Anthropic Claude',
      };

    case 'openai':
      return {
        provider: 'openai',
        apiKey,
        baseURL: 'https://api.openai.com/v1',
        defaultModel: env.AI_MODEL || 'gpt-4o-mini',
        strongModel: env.AI_MODEL || 'gpt-4o',
        name: 'OpenAI GPT',
      };

    default:
      return {
        provider: 'none',
        apiKey: '',
        baseURL: '',
        defaultModel: '',
        strongModel: '',
        name: 'None',
      };
  }
}

export function isAIConfigured(): boolean {
  return getAIConfig().provider !== 'none';
}
