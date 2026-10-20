/**
 * check-env.ts
 *
 * Validates that all required environment variables are present before starting
 * any service. Run with: tsx scripts/check-env.ts [service]
 *
 * Usage:
 *   tsx scripts/check-env.ts api          # check API env vars
 *   tsx scripts/check-env.ts mock         # check mock-platforms env vars
 *   tsx scripts/check-env.ts all          # check all
 */

import { config } from 'dotenv';
import { resolve } from 'path';

const service = process.argv[2] ?? 'all';

// ── Required variables per service ──────────────────────────

const API_REQUIRED: Record<string, string> = {
  DATABASE_URL: 'PostgreSQL connection string (Prisma)',
  ANTHROPIC_API_KEY: 'Claude API key (Anthropic console)',
  CORS_ORIGINS: 'Allowed frontend origins, comma-separated',
  SESSION_SECRET: 'Secret used to sign session JWTs (min 32 chars)',
  OWNER_EMAIL: 'Login email for the business owner account',
  OWNER_PASSWORD_HASH: 'bcrypt hash of the owner password',
  MOCK_PLATFORM_URLS:
    'JSON map of platform URLs, e.g. {"mockMapsA":"http://localhost:4101"}',
  NODE_ENV: 'development | production | test',
};

const MOCK_REQUIRED: Record<string, string> = {
  NODE_ENV: 'development | production | test',
};

// ── Load .env files ──────────────────────────────────────────

function loadEnv(dir: string): void {
  config({ path: resolve(process.cwd(), dir, '.env') });
}

// ── Validation ───────────────────────────────────────────────

function check(vars: Record<string, string>, label: string): boolean {
  console.log(`\n🔍 Checking ${label} environment variables...`);
  let allGood = true;

  for (const [key, description] of Object.entries(vars)) {
    const value = process.env[key];
    if (!value || value.trim() === '') {
      console.error(`  ✗ ${key} — MISSING`);
      console.error(`      Purpose: ${description}`);
      allGood = false;
    } else {
      // Mask sensitive values
      const masked =
        key.toLowerCase().includes('key') ||
        key.toLowerCase().includes('secret') ||
        key.toLowerCase().includes('password') ||
        key.toLowerCase().includes('hash') ||
        key.toLowerCase().includes('url')
          ? value.slice(0, 8) + '...' + value.slice(-4)
          : value;
      console.log(`  ✓ ${key} = ${masked}`);
    }
  }

  return allGood;
}

// ── Specific validations ─────────────────────────────────────

function validateApiEnv(): void {
  const secret = process.env.SESSION_SECRET ?? '';
  if (secret.length > 0 && secret.length < 32) {
    console.warn('  ⚠  SESSION_SECRET is shorter than 32 characters. Use a longer secret.');
  }

  const hashValue = process.env.OWNER_PASSWORD_HASH ?? '';
  if (hashValue.length > 0 && !hashValue.startsWith('$2b$')) {
    console.warn('  ⚠  OWNER_PASSWORD_HASH does not look like a bcrypt hash.');
    console.warn(
      '     Generate one with: node -e "require(\'bcrypt\').hash(\'yourpassword\', 12).then(console.log)"',
    );
  }

  const platformUrls = process.env.MOCK_PLATFORM_URLS ?? '';
  if (platformUrls.length > 0) {
    try {
      JSON.parse(platformUrls);
    } catch {
      console.warn('  ⚠  MOCK_PLATFORM_URLS is not valid JSON.');
      console.warn(
        '     Expected format: {"mockMapsA":"http://localhost:4101","mockMapsB":"http://localhost:4102","mockDirectoryC":"http://localhost:4103"}',
      );
    }
  }
}

// ── Main ─────────────────────────────────────────────────────

let success = true;

if (service === 'api' || service === 'all') {
  loadEnv('apps/api');
  success = check(API_REQUIRED, 'API (apps/api)') && success;
  validateApiEnv();
}

if (service === 'mock' || service === 'all') {
  loadEnv('apps/mock-platforms');
  success = check(MOCK_REQUIRED, 'Mock Platforms (apps/mock-platforms)') && success;
}

console.log('');

if (!success) {
  console.error('❌ One or more required environment variables are missing.');
  console.error('   Copy the relevant .env.example to .env and fill in the values.');
  process.exit(1);
} else {
  console.log('✅ All environment variables are present.');
}
