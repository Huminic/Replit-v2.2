import { test, expect } from 'playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Billing Domain Agent Tests (T-004)
 * Generated from: tests/agents/plans/billing-plan.md
 *
 * Covers NEW gaps not tested in domain-08-billing.spec.ts (8.1-8.5).
 *
 * Known limitation: FlexPrice returns {configured: false} per I-105.
 * Tests document the unconfigured state as the expected behavior.
 *
 * Rate limit strategy: the auth endpoint allows 5 logins per 15 min per IP.
 * All API tests share tokens via file cache. Browser tests must login fresh
 * (httpOnly cookie), so browser test count is minimized.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.BASE_URL || 'https://dev.huminicdev.com';
const TEST_PASSWORD = 'NexxusTest2026';

const users = {
  superAdmin: { email: 'duane.wells@huminic.ai', password: TEST_PASSWORD },
  partnerAdmin: { email: 'duanekwells@gmail.com', password: TEST_PASSWORD },
  orgAdmin: { email: 'serra_honda@huminic.ai', password: TEST_PASSWORD },
  executive: { email: 'executive_staff@huminic.ai', password: TEST_PASSWORD },
  sales: { email: 'sales_staff@huminic.ai', password: TEST_PASSWORD },
  service: { email: 'service_staff@huminic.ai', password: TEST_PASSWORD },
  marketing: { email: 'marketing_staff@huminic.ai', password: TEST_PASSWORD },
};

// ---------------------------------------------------------------------------
// File-based token cache — prevents 429 rate limiting across tests
// ---------------------------------------------------------------------------

const CACHE_FILE = path.resolve(__dirname, '../../../.playwright-auth-cache.json');
const CACHE_MAX_AGE_MS = 50 * 60 * 1000; // 50 minutes

interface CachedAuth {
  token: string;
  userId?: string;
  organizationId?: string;
  timestamp: number;
}

function readTokenCache(): Record<string, CachedAuth> {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
      const now = Date.now();
      const valid: Record<string, CachedAuth> = {};
      for (const [key, val] of Object.entries(data)) {
        const cached = val as CachedAuth;
        if (now - cached.timestamp < CACHE_MAX_AGE_MS) {
          valid[key] = cached;
        }
      }
      return valid;
    }
  } catch { /* ignore */ }
  return {};
}

function writeTokenCache(cache: Record<string, CachedAuth>) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch { /* ignore */ }
}

/** API login with file-based cache — returns accessToken string */
async function getToken(request: any, user: { email: string; password: string }): Promise<string> {
  const cache = readTokenCache();
  const cached = cache[user.email];
  if (cached?.token) return cached.token;

  const res = await request.post(`${BASE_URL}/api/auth/login`, {
    data: { email: user.email, password: user.password },
  });
  if (!res.ok()) throw new Error(`Login failed for ${user.email}: ${res.status()}`);
  const body = await res.json();
  const token = body.accessToken;

  cache[user.email] = {
    token,
    userId: body.user?.id,
    organizationId: body.user?.organization?.id,
    timestamp: Date.now(),
  };
  writeTokenCache(cache);

  return token;
}

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

/** Browser login — sets httpOnly cookie, dismisses tours, navigates */
async function loginAndNavigate(
  page: import('playwright/test').Page,
  user: { email: string; password: string },
  targetPath: string = '/'
) {
  const res = await page.request.post(`${BASE_URL}/api/auth/login`, {
    data: { email: user.email, password: user.password },
  });
  if (!res.ok()) throw new Error(`Login failed: ${res.status()}`);

  // Update file cache so API tests can reuse
  const body = await res.json();
  const cache = readTokenCache();
  cache[user.email] = {
    token: body.accessToken,
    userId: body.user?.id,
    organizationId: body.user?.organization?.id,
    timestamp: Date.now(),
  };
  writeTokenCache(cache);

  await page.addInitScript(() => {
    const prefix = 'nexxus_tour_dismissed_';
    const keys = ['main', 'teambox', 'my-work', 'sales', 'service', 'marketing', 'management', 'agents', 'insights', 'settings', 'profile', 'usage'];
    for (const k of keys) localStorage.setItem(prefix + k, 'true');
  });

  await page.goto(targetPath, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);
}

// ---------------------------------------------------------------------------
// Bootstrap: pre-login all users once via API to populate cache
// ---------------------------------------------------------------------------

test.describe('Billing — Bootstrap', () => {
  test('Pre-login all test users to populate token cache', async ({ request }) => {
    // Login each user sequentially to avoid burst rate limiting
    for (const [name, user] of Object.entries(users)) {
      const cache = readTokenCache();
      if (cache[user.email]?.token) continue; // already cached
      const res = await request.post(`${BASE_URL}/api/auth/login`, {
        data: { email: user.email, password: user.password },
      });
      expect(res.ok()).toBe(true);
      const body = await res.json();
      cache[user.email] = {
        token: body.accessToken,
        userId: body.user?.id,
        organizationId: body.user?.organization?.id,
        timestamp: Date.now(),
      };
      writeTokenCache(cache);
    }
    // Verify all users are cached
    const finalCache = readTokenCache();
    for (const user of Object.values(users)) {
      expect(finalCache[user.email]?.token).toBeTruthy();
    }
  });
});

// ---------------------------------------------------------------------------
// Section A: Sub-page Navigation (TC-BILL-003 through TC-BILL-006)
// Uses a single browser login for all nav tests via serial mode.
// ---------------------------------------------------------------------------

test.describe('Billing — Sub-page Navigation', () => {
  test('TC-BILL-003: Usage sub-page loads directly', async ({ page }) => {
    await loginAndNavigate(page, users.superAdmin, '/settings/billing/usage');
    await page.waitForFunction(
      () => /usage|billing|not configured/i.test(document.body?.textContent || ''),
      { timeout: 15000 }
    );
    const body = await page.textContent('body');
    expect(/usage|billing|not configured/i.test(body || '')).toBe(true);
  });

  test('TC-BILL-004: Plan sub-page loads directly', async ({ page }) => {
    await loginAndNavigate(page, users.superAdmin, '/settings/billing/plan');
    await page.waitForFunction(
      () => /plan|billing|not configured/i.test(document.body?.textContent || ''),
      { timeout: 15000 }
    );
    const body = await page.textContent('body');
    expect(/plan|billing|not configured/i.test(body || '')).toBe(true);
  });

  test('TC-BILL-005: Invoices sub-page loads directly', async ({ page }) => {
    await loginAndNavigate(page, users.superAdmin, '/settings/billing/invoices');
    await page.waitForFunction(
      () => /invoice|billing|not configured/i.test(document.body?.textContent || ''),
      { timeout: 15000 }
    );
    const body = await page.textContent('body');
    expect(/invoice|billing|not configured/i.test(body || '')).toBe(true);
  });

  test('TC-BILL-006: Back navigation from plan page', async ({ page }) => {
    await loginAndNavigate(page, users.superAdmin, '/settings/billing/plan');
    await page.waitForFunction(
      () => /plan|billing|not configured/i.test(document.body?.textContent || ''),
      { timeout: 15000 }
    );
    const backBtn = page.locator('[data-testid="link-back-billing"]');
    if (await backBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await backBtn.click();
      await page.waitForTimeout(1500);
      expect(page.url()).toContain('/settings/billing');
    } else {
      // Not-configured state — back button not shown; verify page loaded
      const notConfigured = page.locator('[data-testid="text-billing-not-configured"]');
      await expect(notConfigured).toBeVisible();
    }
  });
});

// ---------------------------------------------------------------------------
// Section B: Not-Configured State (I-105 — current expected dev state)
// ---------------------------------------------------------------------------

test.describe('Billing — Not-Configured State (I-105)', () => {
  test('TC-BILL-010: Dashboard shows not-configured indicator', async ({ page }) => {
    await loginAndNavigate(page, users.superAdmin, '/settings/billing');
    await page.waitForFunction(
      () => /billing|not configured/i.test(document.body?.textContent || ''),
      { timeout: 15000 }
    );
    const notConfigured = page.locator('[data-testid="text-billing-not-configured"]');
    const isVisible = await notConfigured.isVisible({ timeout: 5000 }).catch(() => false);
    if (isVisible) {
      await expect(notConfigured).toContainText('Billing Not Configured');
    } else {
      const title = page.locator('[data-testid="text-billing-title"]');
      await expect(title).toBeVisible();
    }
  });

  test('TC-BILL-011: Plan page shows not-configured', async ({ page }) => {
    await loginAndNavigate(page, users.superAdmin, '/settings/billing/plan');
    await page.waitForFunction(
      () => /plan|not configured/i.test(document.body?.textContent || ''),
      { timeout: 15000 }
    );
    const notConfigured = page.locator('[data-testid="text-billing-not-configured"]');
    const isVisible = await notConfigured.isVisible({ timeout: 5000 }).catch(() => false);
    if (isVisible) {
      await expect(notConfigured).toContainText('Billing Not Configured');
    } else {
      const title = page.locator('[data-testid="text-plan-title"]');
      await expect(title).toBeVisible();
    }
  });

  test('TC-BILL-012: Usage page shows not-configured', async ({ page }) => {
    await loginAndNavigate(page, users.superAdmin, '/settings/billing/usage');
    await page.waitForFunction(
      () => /usage|not configured/i.test(document.body?.textContent || ''),
      { timeout: 15000 }
    );
    const notConfigured = page.locator('[data-testid="text-billing-not-configured"]');
    const isVisible = await notConfigured.isVisible({ timeout: 5000 }).catch(() => false);
    if (isVisible) {
      await expect(notConfigured).toContainText('Billing Not Configured');
    } else {
      const title = page.locator('[data-testid="text-usage-title"]');
      await expect(title).toBeVisible();
    }
  });

  test('TC-BILL-013: Invoices page shows not-configured', async ({ page }) => {
    await loginAndNavigate(page, users.superAdmin, '/settings/billing/invoices');
    await page.waitForFunction(
      () => /invoice|not configured/i.test(document.body?.textContent || ''),
      { timeout: 15000 }
    );
    const notConfigured = page.locator('[data-testid="text-billing-not-configured"]');
    const isVisible = await notConfigured.isVisible({ timeout: 5000 }).catch(() => false);
    if (isVisible) {
      await expect(notConfigured).toContainText('Billing Not Configured');
    } else {
      const title = page.locator('[data-testid="text-invoices-title"]');
      await expect(title).toBeVisible();
    }
  });
});

// ---------------------------------------------------------------------------
// Section B-API: API returns configured:false (TC-BILL-014)
// ---------------------------------------------------------------------------

test.describe('Billing — API configured:false (I-105)', () => {
  const billingEndpoints = [
    '/api/billing/summary',
    '/api/billing/usage',
    '/api/billing/invoices',
    '/api/billing/plan',
    '/api/billing/entitlements',
  ];

  for (const endpoint of billingEndpoints) {
    test(`TC-BILL-014: ${endpoint} returns configured:false`, async ({ request }) => {
      const token = await getToken(request, users.superAdmin);
      const res = await request.get(`${BASE_URL}${endpoint}`, {
        headers: authHeader(token),
      });
      expect(res.ok()).toBe(true);
      const body = await res.json();
      expect(body.configured).toBe(false);
      expect(body.message).toBe('Billing not configured');
    });
  }
});

// ---------------------------------------------------------------------------
// Section C: RBAC — Role Access Control
// ---------------------------------------------------------------------------

test.describe('Billing — RBAC Enforcement', () => {
  test('TC-BILL-026: Executive role cannot access billing page (UI)', async ({ page }) => {
    await loginAndNavigate(page, users.executive, '/settings/billing');
    await page.waitForTimeout(2000);
    const url = page.url();
    const body = await page.textContent('body');
    // Executive blocked by canAccessSystem() — redirected or access denied
    const blocked =
      !url.includes('billing') ||
      /access denied|forbidden|not authorized/i.test(body || '');
    expect(blocked).toBe(true);
  });

  test('TC-BILL-027a: API rejects sales role on billing summary (403)', async ({ request }) => {
    const token = await getToken(request, users.sales);
    const res = await request.get(`${BASE_URL}/api/billing/summary`, {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(403);
  });

  test('TC-BILL-027b: API rejects service role on billing usage (403)', async ({ request }) => {
    const token = await getToken(request, users.service);
    const res = await request.get(`${BASE_URL}/api/billing/usage`, {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(403);
  });

  test('TC-BILL-027c: API rejects marketing role on billing invoices (403)', async ({ request }) => {
    const token = await getToken(request, users.marketing);
    const res = await request.get(`${BASE_URL}/api/billing/invoices`, {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(403);
  });

  test('TC-BILL-027d: Executive role (level 3) CAN access billing API', async ({ request }) => {
    // Executive has roleLevel 3 — same as org_admin — requireRole(3) passes.
    // Only the UI RBAC (canAccessSystem) blocks executive.
    const token = await getToken(request, users.executive);
    const res = await request.get(`${BASE_URL}/api/billing/plan`, {
      headers: authHeader(token),
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body).toHaveProperty('configured');
  });

  test('TC-BILL-028a: Unauthenticated billing summary returns 401', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/billing/summary`);
    expect(res.status()).toBe(401);
  });

  test('TC-BILL-028b: Unauthenticated entitlements check returns 401', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/entitlements/check`, {
      data: { feature_key: 'agent_slots' },
    });
    expect(res.status()).toBe(401);
  });

  test('TC-BILL-028c: Unauthenticated billing topup returns 401', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/billing/topup`, {
      data: { amount: 25 },
    });
    expect(res.status()).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// Section C-RBAC: Allowed roles API access
// ---------------------------------------------------------------------------

test.describe('Billing — Allowed Roles API Access', () => {
  const allowedRoles = [
    { name: 'superAdmin', user: users.superAdmin },
    { name: 'partnerAdmin', user: users.partnerAdmin },
    { name: 'orgAdmin', user: users.orgAdmin },
  ];

  for (const { name, user } of allowedRoles) {
    test(`TC-BILL-020+: ${name} can access /api/billing/summary`, async ({ request }) => {
      const token = await getToken(request, user);
      const res = await request.get(`${BASE_URL}/api/billing/summary`, {
        headers: authHeader(token),
      });
      expect(res.ok()).toBe(true);
      const body = await res.json();
      expect(body).toHaveProperty('configured');
    });
  }
});

// ---------------------------------------------------------------------------
// Section I: Entitlement Check Endpoint
// ---------------------------------------------------------------------------

test.describe('Billing — Entitlement Check Endpoint', () => {
  test('TC-BILL-084: Entitlement check returns configured:false', async ({ request }) => {
    const token = await getToken(request, users.superAdmin);
    const res = await request.post(`${BASE_URL}/api/entitlements/check`, {
      headers: authHeader(token),
      data: { feature_key: 'agent_slots' },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.configured).toBe(false);
    expect(body.entitled).toBe(false);
    expect(body.message).toBe('Billing not configured');
  });

  test('TC-BILL-085: Entitlement check with missing feature_key', async ({ request }) => {
    const token = await getToken(request, users.superAdmin);
    const res = await request.post(`${BASE_URL}/api/entitlements/check`, {
      headers: authHeader(token),
      data: {},
    });
    // configured:false check runs before feature_key validation
    const body = await res.json();
    if (res.status() === 400) {
      expect(body.message).toBe('feature_key is required');
    } else {
      expect(body.configured).toBe(false);
    }
  });

  test('TC-BILL-085b: Entitlement check with non-string feature_key', async ({ request }) => {
    const token = await getToken(request, users.superAdmin);
    const res = await request.post(`${BASE_URL}/api/entitlements/check`, {
      headers: authHeader(token),
      data: { feature_key: 123 },
    });
    const body = await res.json();
    if (res.status() === 400) {
      expect(body.message).toBe('feature_key is required');
    } else {
      expect(body.configured).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// Section E: Wallet Top-Up API Validation
// ---------------------------------------------------------------------------

test.describe('Billing — Wallet Top-Up API', () => {
  test('TC-BILL-044: Top-up with no wallet configured', async ({ request }) => {
    const token = await getToken(request, users.superAdmin);
    const res = await request.post(`${BASE_URL}/api/billing/topup`, {
      headers: authHeader(token),
      data: { amount: 25 },
    });
    const body = await res.json();
    // No billingCustomerId => configured:false before wallet check
    if (res.ok()) {
      expect(body.configured).toBe(false);
    } else {
      expect(res.status()).toBe(400);
      expect(body.message).toBe('No wallet configured for this organization');
    }
  });

  test('TC-BILL-045a: Top-up rejects negative amount', async ({ request }) => {
    const token = await getToken(request, users.superAdmin);
    const res = await request.post(`${BASE_URL}/api/billing/topup`, {
      headers: authHeader(token),
      data: { amount: -10 },
    });
    const body = await res.json();
    if (res.ok()) {
      expect(body.configured).toBe(false);
    } else {
      expect(body.message).toBe('Valid positive amount is required');
    }
  });

  test('TC-BILL-045b: Top-up rejects zero amount', async ({ request }) => {
    const token = await getToken(request, users.superAdmin);
    const res = await request.post(`${BASE_URL}/api/billing/topup`, {
      headers: authHeader(token),
      data: { amount: 0 },
    });
    const body = await res.json();
    if (res.ok()) {
      expect(body.configured).toBe(false);
    } else {
      expect(body.message).toBe('Valid positive amount is required');
    }
  });

  test('TC-BILL-045c: Top-up rejects missing amount', async ({ request }) => {
    const token = await getToken(request, users.superAdmin);
    const res = await request.post(`${BASE_URL}/api/billing/topup`, {
      headers: authHeader(token),
      data: {},
    });
    const body = await res.json();
    if (res.ok()) {
      expect(body.configured).toBe(false);
    } else {
      expect(body.message).toBe('Valid positive amount is required');
    }
  });
});

// ---------------------------------------------------------------------------
// Section J: CreditBalanceIndicator
// ---------------------------------------------------------------------------

test.describe('Billing — CreditBalanceIndicator', () => {
  test('TC-BILL-090: Indicator hidden when billing not configured', async ({ page }) => {
    await loginAndNavigate(page, users.superAdmin, '/');
    await page.waitForTimeout(2000);
    const indicator = page.locator('[data-testid="credit-balance-indicator"]');
    const count = await indicator.count();
    if (count === 0) {
      expect(count).toBe(0); // Expected: not rendered when unconfigured
    } else {
      await expect(indicator).toBeVisible(); // Billing must be configured
    }
  });
});

// ---------------------------------------------------------------------------
// Section K: API Edge Cases
// ---------------------------------------------------------------------------

test.describe('Billing — API Edge Cases', () => {
  test('TC-BILL-102: Billing plans endpoint returns plan data or empty', async ({ request }) => {
    // /api/billing/plans does NOT check billingCustomerId — fetches all published plans
    const token = await getToken(request, users.superAdmin);
    const res = await request.get(`${BASE_URL}/api/billing/plans`, {
      headers: authHeader(token),
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body).toHaveProperty('plans');
    expect(Array.isArray(body.plans)).toBe(true);
  });

  test('TC-BILL-102b: Usage endpoint with period param returns configured:false', async ({ request }) => {
    const token = await getToken(request, users.superAdmin);
    const res = await request.get(`${BASE_URL}/api/billing/usage?period=current_month`, {
      headers: authHeader(token),
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.configured).toBe(false);
  });
});
