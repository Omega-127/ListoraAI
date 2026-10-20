import { test, expect, Page } from '@playwright/test';

/**
 * End-to-end demo flow for the Business Listing Consistency Agent.
 *
 * This spec walks through the complete 8-step flow as described in docs/demo-script.md:
 *
 *   Step 1: Owner logs in
 *   Step 2: Owner views and updates their approved profile
 *   Step 3: Listings are refreshed from mock platforms
 *   Step 4: Dashboard shows mismatches across platforms
 *   Step 5: Agent investigates and creates proposals
 *   Step 6: Owner reviews and approves proposals
 *   Step 7: Approved changes are applied and verified
 *   Step 8: Report shows before/after; consistency score improves
 *
 * Prerequisites:
 *   - `npm run dev` is running (all services up)
 *   - Mock platforms are at their seed state (GET /reset on each)
 *   - OWNER_EMAIL and OWNER_PASSWORD are set in .env (defaults: owner@bizlisting.dev / demo1234)
 */

const OWNER_EMAIL = process.env.OWNER_EMAIL ?? 'owner@bizlisting.dev';
const OWNER_PASSWORD = process.env.OWNER_PASSWORD ?? 'demo1234';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:4000';
const MOCK_A = process.env.MOCK_MAPS_A_URL ?? 'http://localhost:4101';
const MOCK_B = process.env.MOCK_MAPS_B_URL ?? 'http://localhost:4102';
const MOCK_C = process.env.MOCK_DIRECTORY_C_URL ?? 'http://localhost:4103';

/** Reset all mock platforms to their seed state before each run */
async function resetMockPlatforms(page: Page): Promise<void> {
  await page.request.post(`${MOCK_A}/reset`);
  await page.request.post(`${MOCK_B}/reset`);
  await page.request.post(`${MOCK_C}/reset`);
}

test.describe('Full Demo Flow', () => {
  test.beforeEach(async ({ page }) => {
    await resetMockPlatforms(page);
  });

  // ─────────────────────────────────────────────────────────────
  // STEP 1: Owner Login
  // ─────────────────────────────────────────────────────────────
  test('Step 1: Owner can log in', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Email').fill(OWNER_EMAIL);
    await page.getByLabel('Password').fill(OWNER_PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should redirect to dashboard after login
    await expect(page).toHaveURL(/\/(dashboard)?$/);
    await expect(page.getByText(/dashboard/i).first()).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────
  // STEP 2: Profile Editor
  // ─────────────────────────────────────────────────────────────
  test('Step 2: Owner can view and update approved profile', async ({ page }) => {
    // Login first
    await loginAs(page, OWNER_EMAIL, OWNER_PASSWORD);

    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: /profile/i })).toBeVisible();

    // Verify profile fields are visible
    await expect(page.getByLabel(/business name/i)).toBeVisible();
    await expect(page.getByLabel(/address/i)).toBeVisible();
    await expect(page.getByLabel(/phone/i)).toBeVisible();

    // Update the phone number to E.164 format
    const phoneInput = page.getByLabel(/phone/i);
    await phoneInput.clear();
    await phoneInput.fill('+15550102234');

    await page.getByRole('button', { name: /save/i }).click();

    // Expect a success notification
    await expect(page.getByText(/saved|updated|success/i)).toBeVisible({ timeout: 5000 });
  });

  // ─────────────────────────────────────────────────────────────
  // STEP 3: Refresh Listings
  // ─────────────────────────────────────────────────────────────
  test('Step 3: Listings can be refreshed from mock platforms', async ({ page }) => {
    await loginAs(page, OWNER_EMAIL, OWNER_PASSWORD);

    await page.goto('/dashboard');
    await page.getByRole('button', { name: /refresh listings/i }).click();

    // Should show listings from all three platforms
    await expect(page.getByText(/mockMapsA/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/mockMapsB/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/mockDirectoryC/i)).toBeVisible({ timeout: 10_000 });
  });

  // ─────────────────────────────────────────────────────────────
  // STEP 4: Mismatches Detected
  // ─────────────────────────────────────────────────────────────
  test('Step 4: Dashboard shows mismatches between profile and listings', async ({ page }) => {
    await loginAs(page, OWNER_EMAIL, OWNER_PASSWORD);
    await page.goto('/dashboard');

    // At least one mismatch badge should be visible
    await expect(
      page.getByText(/mismatch|outdated|conflicting|missing/i).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  // ─────────────────────────────────────────────────────────────
  // STEP 5: Agent Creates Proposals
  // ─────────────────────────────────────────────────────────────
  test('Step 5: Agent investigates mismatches and creates proposals', async ({ page }) => {
    await loginAs(page, OWNER_EMAIL, OWNER_PASSWORD);

    // Trigger agent run via API (or through a UI button if available)
    const runResponse = await page.request.post(`${API_BASE}/api/v1/agent/run`, {
      headers: { 'Content-Type': 'application/json' },
    });
    expect(runResponse.status()).toBeLessThan(500);

    await page.goto('/approvals');
    await expect(page.getByText(/pending/i).first()).toBeVisible({ timeout: 15_000 });
  });

  // ─────────────────────────────────────────────────────────────
  // STEP 6: Owner Approves Proposals
  // ─────────────────────────────────────────────────────────────
  test('Step 6: Owner can approve a proposal', async ({ page }) => {
    await loginAs(page, OWNER_EMAIL, OWNER_PASSWORD);
    await page.goto('/approvals');

    // Approve the first pending proposal
    const firstApproveBtn = page.getByRole('button', { name: /approve/i }).first();
    await expect(firstApproveBtn).toBeVisible({ timeout: 10_000 });
    await firstApproveBtn.click();

    // Confirmation or status change
    await expect(page.getByText(/approved/i).first()).toBeVisible({ timeout: 5_000 });
  });

  // ─────────────────────────────────────────────────────────────
  // STEP 7: Updates Applied and Verified
  // ─────────────────────────────────────────────────────────────
  test('Step 7: Approved changes are applied; mockMapsA gets verified, mockMapsB is blocked', async ({
    page,
  }) => {
    await loginAs(page, OWNER_EMAIL, OWNER_PASSWORD);

    // Trigger update run
    const updateResponse = await page.request.post(`${API_BASE}/api/v1/updates`, {
      headers: { 'Content-Type': 'application/json' },
    });
    expect(updateResponse.status()).toBeLessThan(500);

    // Trigger verify run
    const verifyResponse = await page.request.post(`${API_BASE}/api/v1/verify`, {
      headers: { 'Content-Type': 'application/json' },
    });
    expect(verifyResponse.status()).toBeLessThan(500);

    await page.goto('/report');

    // Expect at least one "verified" badge
    await expect(page.getByText(/verified/i).first()).toBeVisible({ timeout: 10_000 });

    // Expect at least one "blocked" badge (from mockMapsB)
    await expect(page.getByText(/blocked/i).first()).toBeVisible({ timeout: 10_000 });
  });

  // ─────────────────────────────────────────────────────────────
  // STEP 8: Report and Consistency Score
  // ─────────────────────────────────────────────────────────────
  test('Step 8: Report shows before/after and consistency score is visible', async ({ page }) => {
    await loginAs(page, OWNER_EMAIL, OWNER_PASSWORD);

    await page.goto('/report');
    // Before/after values should be present
    await expect(page.getByText(/before/i).first()).toBeVisible();
    await expect(page.getByText(/after/i).first()).toBeVisible();

    await page.goto('/score');
    // Score should be displayed as a number or percentage
    await expect(page.getByText(/%|\bscore\b/i).first()).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────
  // BONUS: Audit log records all actions
  // ─────────────────────────────────────────────────────────────
  test('Bonus: Audit log contains entries from the demo flow', async ({ page }) => {
    await loginAs(page, OWNER_EMAIL, OWNER_PASSWORD);

    await page.goto('/audit');
    await expect(page.getByText(/profile|proposal|listing|agent/i).first()).toBeVisible({
      timeout: 5_000,
    });
  });

  // ─────────────────────────────────────────────────────────────
  // BONUS: Alerts page surfaces unresolved issues
  // ─────────────────────────────────────────────────────────────
  test('Bonus: Alerts page surfaces unresolved mismatches or blocked listings', async ({
    page,
  }) => {
    await loginAs(page, OWNER_EMAIL, OWNER_PASSWORD);

    await page.goto('/alerts');
    // At minimum the alerts page should load
    await expect(page.getByRole('heading', { name: /alert/i })).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/** Logs in as the owner and waits for redirect to complete */
async function loginAs(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/\/(dashboard)?$/, { timeout: 10_000 });
}
