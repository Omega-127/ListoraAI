import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for end-to-end demo flow tests.
 *
 * Assumes all services are running locally:
 *   Frontend  → http://localhost:5173  (apps/web)
 *   API       → http://localhost:4000  (apps/api)
 *   MockMapsA → http://localhost:4101
 *   MockMapsB → http://localhost:4102
 *   DirectoryC→ http://localhost:4103
 *
 * Run `npm run dev` from the repo root before executing tests.
 */
export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.ts',

  /* Maximum time one test can run */
  timeout: 60_000,

  /* Fail fast in CI: stop after the first failure */
  maxFailures: process.env.CI ? 1 : 0,

  /* Reporter */
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],

  use: {
    /* Base URL for page.goto('/') calls */
    baseURL: process.env.BASE_URL ?? 'http://localhost:5173',

    /* Capture screenshot on failure */
    screenshot: 'only-on-failure',

    /* Capture video on first retry */
    video: 'on-first-retry',

    /* Capture trace on first retry */
    trace: 'on-first-retry',

    /* Keep HTTP credentials across navigation */
    extraHTTPHeaders: {
      Accept: 'application/json',
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],

  /* Retry once on failure (to catch flakes) */
  retries: process.env.CI ? 2 : 0,

  /* Parallelism: keep sequential for demo flow which has state */
  workers: 1,
});
