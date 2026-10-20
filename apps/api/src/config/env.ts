/**
 * Environment variable validation using Zod.
 * All required variables are checked at startup; the process exits if any are missing.
 */
import { z } from 'zod';

const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
  OWNER_EMAIL: z.string().email(),
  OWNER_PASSWORD_HASH: z.string().min(1),
  CORS_ORIGINS: z.string().min(1),
  MOCK_PLATFORM_URLS: z.string().min(1),
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
    process.exit(1);
  }
  return result.data;
}

export const env = loadEnv();

/** Parsed list of allowed CORS origins */
export const corsOrigins = env.CORS_ORIGINS.split(',').map((o) => o.trim());

/** Parsed list of mock platform base URLs */
export const mockPlatformUrls = env.MOCK_PLATFORM_URLS.split(',').map((u) => u.trim());
