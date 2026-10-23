import path from 'path';
import dotenv from 'dotenv';

// Load apps/api/.env or root .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

import { z } from 'zod';

const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().default('placeholder-not-configured'),
  SESSION_SECRET: z.string().min(32).default('default-session-secret-min-32-chars-long-listora-ai'),
  OWNER_EMAIL: z.string().email().default('owner@example.com'),
  OWNER_PASSWORD_HASH: z.string().min(1).default('$2a$10$wT3wW8R1x55mQ2K1v1F6OuK7YtK0b4zY6R1x55mQ2K1v1F6OuK7Yt'),
  CORS_ORIGINS: z.string().min(1).default('https://listora-tau.vercel.app,https://listora-ai.vercel.app'),
  MOCK_PLATFORM_URLS: z.string().min(1).default('http://localhost:4100'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
});

function loadEnv() {
  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    for (const issue of result.error.issues) {
      console.error(`  ${issue.path.join('.')}: ${issue.message}`);
    }
    if (process.env.NODE_ENV === 'test') {
      throw new Error(`Invalid environment variables: ${result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ')}`);
    }
    process.exit(1);
  }
  return result.data;
}

export const env = loadEnv();

/** Parsed list of allowed CORS origins */
export const corsOrigins = env.CORS_ORIGINS.split(',').map((o) => o.trim());

/** Parsed list of mock platform base URLs */
export const mockPlatformUrls = env.MOCK_PLATFORM_URLS.split(',').map((u) => u.trim());
