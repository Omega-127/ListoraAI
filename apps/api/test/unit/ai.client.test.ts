import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAIConfig, isAIConfigured } from '../../src/clients/ai.client';
import { env } from '../../src/config/env';

describe('Multi-Provider AI Client Detection', () => {
  const originalEnv = { ...env };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('detects Groq when GROQ_API_KEY is provided with gsk_ prefix', () => {
    (env as any).GROQ_API_KEY = 'gsk_testkey1234567890abcdef';
    (env as any).GROK_API_KEY = undefined;
    (env as any).XAI_API_KEY = undefined;
    (env as any).ANTHROPIC_API_KEY = undefined;
    (env as any).OPENAI_API_KEY = undefined;
    (env as any).AI_PROVIDER = undefined;

    const config = getAIConfig();
    expect(config.provider).toBe('groq');
    expect(config.baseURL).toBe('https://api.groq.com/openai/v1');
    expect(config.apiKey).toBe('gsk_testkey1234567890abcdef');
    expect(isAIConfigured()).toBe(true);
  });

  it('detects xAI Grok when GROK_API_KEY or XAI_API_KEY is provided with xai- prefix', () => {
    (env as any).GROQ_API_KEY = undefined;
    (env as any).GROK_API_KEY = 'xai-testkey1234567890abcdef';
    (env as any).XAI_API_KEY = undefined;
    (env as any).ANTHROPIC_API_KEY = undefined;
    (env as any).OPENAI_API_KEY = undefined;
    (env as any).AI_PROVIDER = undefined;

    const config = getAIConfig();
    expect(config.provider).toBe('grok');
    expect(config.baseURL).toBe('https://api.x.ai/v1');
    expect(config.defaultModel).toBe('grok-2-latest');
    expect(isAIConfigured()).toBe(true);
  });

  it('detects Anthropic Claude when ANTHROPIC_API_KEY starts with sk-ant-', () => {
    (env as any).GROQ_API_KEY = undefined;
    (env as any).GROK_API_KEY = undefined;
    (env as any).XAI_API_KEY = undefined;
    (env as any).ANTHROPIC_API_KEY = 'sk-ant-api03-testkey12345';
    (env as any).OPENAI_API_KEY = undefined;
    (env as any).AI_PROVIDER = undefined;

    const config = getAIConfig();
    expect(config.provider).toBe('anthropic');
    expect(config.baseURL).toBe('https://api.anthropic.com');
    expect(isAIConfigured()).toBe(true);
  });

  it('detects OpenAI when OPENAI_API_KEY starts with sk-', () => {
    (env as any).GROQ_API_KEY = undefined;
    (env as any).GROK_API_KEY = undefined;
    (env as any).XAI_API_KEY = undefined;
    (env as any).ANTHROPIC_API_KEY = undefined;
    (env as any).OPENAI_API_KEY = 'sk-proj-testkey12345';
    (env as any).AI_PROVIDER = undefined;

    const config = getAIConfig();
    expect(config.provider).toBe('openai');
    expect(config.baseURL).toBe('https://api.openai.com/v1');
    expect(isAIConfigured()).toBe(true);
  });

  it('returns none when keys are placeholders or empty', () => {
    (env as any).GROQ_API_KEY = '';
    (env as any).GROK_API_KEY = '';
    (env as any).XAI_API_KEY = '';
    (env as any).ANTHROPIC_API_KEY = 'your-anthropic-api-key-here';
    (env as any).OPENAI_API_KEY = undefined;
    (env as any).AI_PROVIDER = undefined;

    const config = getAIConfig();
    expect(config.provider).toBe('none');
    expect(isAIConfigured()).toBe(false);
  });
});
