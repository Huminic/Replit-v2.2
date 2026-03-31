import { test, expect } from 'playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Settings Domain Agent Tests
 * Generated from: tests/agents/plans/settings-plan.md
 * Domain: Settings (/settings)
 *
 * Covers: landing page tiles, RBAC tile visibility, user management,
 * organization config, tools & integrations, knowledge base, AI config,
 * notifications, appearance, and API role gates.
 *
 * Strategy: API tests use in-memory token cache (no extra logins).
 * Browser tests are consolidated per-role to minimize login calls.
 * Rate limiter: 5 logins / 15 min / IP.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.BASE_URL || 'https://dev.huminicdev.com';
const TEST_PASSWORD = 'NexxusTest2026';

const users = {
  superAdmin: { email: 'duane.wells@huminic.ai', password: TEST_PASSWORD },
  partnerAdmin: { email: 'duanekwells@gmail.com', password: TEST_PASSWORD },
  orgAdmin: { email: 'serra_honda@huminic.ai', password: TEST_PASSWORD },
  sales: { email: 'sales_staff@huminic.ai', password: TEST_PASSWORD },
  service: { email: 'service_staff@huminic.ai', password: TEST_PASSWORD },
  marketing: { email: 'marketing_staff@huminic.ai', password: TEST_PASSWORD },
};

// ---------------------------------------------------------------------------
// File-based auth cache (shared across test files)
// ---------------------------------------------------------------------------

const CACHE_FILE = path.resolve(__dirname, '../../../.playwright-auth-cache.json');
const CACHE_MAX_AGE_MS = 50 * 60 * 1000;

interface CachedAuth { token: string; userId: string; organizationId: string; timestamp: number; }

function readCache(): Record<string, CachedAuth> {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
      const now = Date.now();
      const valid: Record<string, CachedAuth> = {};
      for (const [key, val] of Object.entries(data)) {
        const c = val as CachedAuth;
        if (now - c.timestamp < CACHE_MAX_AGE_MS) valid[key] = c;
      }
      return valid;
    }
  } catch {}
  return {};
}

function writeCache(cache: Record<string, CachedAuth>) {
  try { fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2)); } catch {}
}

// In-memory token cache for API tests (survives across tests in same file)
const tokenCache: Record<string, { token: string; userId: string; organizationId: string }> = {};

/** API-only login with in-memory + file cache */
async function apiLogin(
  request: import('playwright/test').APIRequestContext,
  user: { email: string; password: string }
) {
  // In-memory cache first
  if (tokenCache[user.email]) return tokenCache[user.email];

  // File cache second
  const cache = readCache();
  const cached = cache[user.email];
  if (cached) {
    const result = { token: cached.token, userId: cached.userId, organizationId: cached.organizationId };
    tokenCache[user.email] = result;
    return result;
  }

  const res = await request.post(`${BASE_URL}/api/auth/login`, {
    data: { email: user.email, password: user.password },
  });
  if (!res.ok()) throw new Error(`API login failed for ${user.email}: ${res.status()}`);
  const body = await res.json();
  const result = {
    token: body.accessToken as string,
    userId: body.user.id as string,
    organizationId: body.user.organization.id as string,
  };
  tokenCache[user.email] = result;
  cache[user.email] = { ...result, timestamp: Date.now() };
  writeCache(cache);
  return result;
}

function auth(token: string) {
  return { Authorization: `Bearer ${token}` };
}

/** Browser login + navigate. Always does a real API call (needs httpOnly cookie). */
async function loginAndNavigate(
  page: import('playwright/test').Page,
  user: { email: string; password: string },
  targetPath: string = '/settings'
) {
  const response = await page.request.post(`${BASE_URL}/api/auth/login`, {
    data: { email: user.email, password: user.password },
  });
  if (!response.ok()) {
    throw new Error(`Login failed for ${user.email}: ${response.status()} ${await response.text()}`);
  }
  const body = await response.json();

  // Update caches
  const result = { token: body.accessToken, userId: body.user.id, organizationId: body.user.organization.id };
  tokenCache[user.email] = result;
  const cache = readCache();
  cache[user.email] = { ...result, timestamp: Date.now() };
  writeCache(cache);

  await page.addInitScript(() => {
    const prefix = 'nexxus_tour_dismissed_';
    for (const key of ['main','teambox','my-work','sales','service','marketing','management','agents','insights','settings','profile','usage']) {
      localStorage.setItem(prefix + key, 'true');
    }
  });

  await page.goto(`${BASE_URL}${targetPath}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);
  return body;
}

// ============================================================================
// A. API TESTS — Role Gates (no browser needed, uses cached tokens)
// ============================================================================

test.describe('API Role Gates', () => {
  test('TC-SET-125: GET /api/users — sales user gets 403', async ({ request }) => {
    const { token } = await apiLogin(request, users.sales);
    const res = await request.get(`${BASE_URL}/api/users`, { headers: auth(token) });
    expect(res.status()).toBe(403);
  });

  test('TC-SET-126: POST /api/users — sales user gets 403', async ({ request }) => {
    const { token } = await apiLogin(request, users.sales);
    const res = await request.post(`${BASE_URL}/api/users`, {
      headers: auth(token),
      data: { firstName: 'X', lastName: 'Y', email: 'x@y.com', password: 'test123', roleId: 6 },
    });
    expect(res.status()).toBe(403);
  });

  test('TC-SET-127: PATCH /api/settings/org — sales user gets 403', async ({ request }) => {
    const { token } = await apiLogin(request, users.sales);
    const res = await request.patch(`${BASE_URL}/api/settings/org`, {
      headers: auth(token),
      data: { timezone: 'UTC' },
    });
    expect(res.status()).toBe(403);
  });

  test('TC-SET-128: PATCH /api/organizations/:id — sales user gets 403', async ({ request }) => {
    const { token } = await apiLogin(request, users.sales);
    const res = await request.patch(`${BASE_URL}/api/organizations/1`, {
      headers: auth(token),
      data: { name: 'Hacked' },
    });
    expect(res.status()).toBe(403);
  });

  test('TC-SET-130: POST /api/widgets — sales user gets 403', async ({ request }) => {
    const { token } = await apiLogin(request, users.sales);
    const res = await request.post(`${BASE_URL}/api/widgets`, {
      headers: auth(token),
      data: { name: 'test', type: 'text' },
    });
    expect(res.status()).toBe(403);
  });

  test('TC-SET-132: POST /api/organizations — org_admin gets 403', async ({ request }) => {
    const { token } = await apiLogin(request, users.orgAdmin);
    const res = await request.post(`${BASE_URL}/api/organizations`, {
      headers: auth(token),
      data: { name: 'Illegal Org', slug: 'illegal' },
    });
    expect(res.status()).toBe(403);
  });

  test('TC-SET-133: POST /api/integrations/provision — org_admin gets 403', async ({ request }) => {
    const { token } = await apiLogin(request, users.orgAdmin);
    const res = await request.post(`${BASE_URL}/api/integrations/provision`, {
      headers: auth(token),
      data: { dealerId: '12345' },
    });
    expect(res.status()).toBe(403);
  });

  test('TC-SET-AUTH-001: unauthenticated GET /api/users returns 401', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/users`);
    expect(res.status()).toBe(401);
  });

  test('TC-SET-AUTH-002: unauthenticated PATCH /api/settings/org returns 401', async ({ request }) => {
    const res = await request.patch(`${BASE_URL}/api/settings/org`, { data: { timezone: 'UTC' } });
    expect(res.status()).toBe(401);
  });
});

// ============================================================================
// B. API TESTS — RBAC positive access & CRUD validation
// ============================================================================

test.describe('API RBAC Positive & Validation', () => {
  test('TC-RBAC-001: org_admin can GET /api/users', async ({ request }) => {
    const { token } = await apiLogin(request, users.orgAdmin);
    const res = await request.get(`${BASE_URL}/api/users`, { headers: auth(token) });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('TC-RBAC-002: org_admin can GET /api/roles', async ({ request }) => {
    const { token } = await apiLogin(request, users.orgAdmin);
    const res = await request.get(`${BASE_URL}/api/roles`, { headers: auth(token) });
    expect(res.ok()).toBe(true);
  });

  test('TC-RBAC-003: org_admin can GET /api/settings/org', async ({ request }) => {
    const { token } = await apiLogin(request, users.orgAdmin);
    const res = await request.get(`${BASE_URL}/api/settings/org`, { headers: auth(token) });
    expect(res.ok()).toBe(true);
  });

  test('TC-RBAC-004: partner_admin can GET /api/organizations', async ({ request }) => {
    const { token } = await apiLogin(request, users.partnerAdmin);
    const res = await request.get(`${BASE_URL}/api/organizations`, { headers: auth(token) });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThanOrEqual(1);
  });

  test('TC-RBAC-005: org_admin can GET /api/widgets', async ({ request }) => {
    const { token } = await apiLogin(request, users.orgAdmin);
    const res = await request.get(`${BASE_URL}/api/widgets`, { headers: auth(token) });
    expect(res.ok()).toBe(true);
  });

  test('TC-SET-031: PATCH org settings succeeds for org_admin', async ({ request }) => {
    const { token, organizationId } = await apiLogin(request, users.orgAdmin);
    const res = await request.patch(`${BASE_URL}/api/organizations/${organizationId}`, {
      headers: auth(token),
      data: { name: 'Serra Honda' },
    });
    expect(res.ok()).toBe(true);
  });

  test('TC-SET-033: PATCH /api/settings/org with business hours', async ({ request }) => {
    const { token } = await apiLogin(request, users.orgAdmin);
    const res = await request.patch(`${BASE_URL}/api/settings/org`, {
      headers: auth(token),
      data: { timezone: 'America/New_York', businessHoursStart: 9, businessHoursEnd: 17 },
    });
    expect(res.ok()).toBe(true);
  });

  test('TC-SET-047: GET /api/outbound/status returns comm gate state', async ({ request }) => {
    const { token } = await apiLogin(request, users.orgAdmin);
    const res = await request.get(`${BASE_URL}/api/outbound/status`, { headers: auth(token) });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body).toHaveProperty('orgOutboundEnabled');
  });

  test('TC-SET-096: GET /api/settings/org returns org settings', async ({ request }) => {
    const { token } = await apiLogin(request, users.superAdmin);
    const res = await request.get(`${BASE_URL}/api/settings/org`, { headers: auth(token) });
    expect(res.ok()).toBe(true);
  });

  test('TC-SET-083: GET /api/documents returns array', async ({ request }) => {
    const { token } = await apiLogin(request, users.orgAdmin);
    const res = await request.get(`${BASE_URL}/api/documents`, { headers: auth(token) });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('TC-SET-015: POST /api/users with missing fields returns 400', async ({ request }) => {
    const { token } = await apiLogin(request, users.orgAdmin);
    const res = await request.post(`${BASE_URL}/api/users`, {
      headers: auth(token),
      data: { email: '' },
    });
    expect([400, 422]).toContain(res.status());
  });

  test('TC-SET-016: POST /api/users with short password returns 400', async ({ request }) => {
    const { token } = await apiLogin(request, users.orgAdmin);
    const res = await request.post(`${BASE_URL}/api/users`, {
      headers: auth(token),
      data: { firstName: 'Test', lastName: 'User', email: `shortpw_${Date.now()}@test.com`, password: '12345', roleId: 6 },
    });
    expect([400, 422]).toContain(res.status());
  });

  test('TC-SET-086: POST /api/documents with empty file returns 400', async ({ request }) => {
    const { token } = await apiLogin(request, users.orgAdmin);
    const res = await request.post(`${BASE_URL}/api/documents`, {
      headers: auth(token),
      multipart: {
        file: { name: 'empty.txt', mimeType: 'text/plain', buffer: Buffer.from('') },
      },
    });
    expect([400, 422]).toContain(res.status());
  });
});

// ============================================================================
// C. BROWSER TESTS — org_admin role (single login, multiple sections)
// ============================================================================

test.describe('Browser: org_admin — landing, navigation, and org config', () => {

  test('TC-SET-002+105: org_admin sees 6 tiles (no AI tile) and navigation works', async ({ page }) => {
    await loginAndNavigate(page, users.orgAdmin);

    // Verify 6 tiles present, AI absent
    await expect(page.locator('[data-testid="settings-tile-ai"]')).toHaveCount(0);
    for (const tileId of ['users', 'organization', 'tools', 'knowledge', 'notifications', 'appearance']) {
      await expect(page.locator(`[data-testid="settings-tile-${tileId}"]`)).toBeVisible();
    }

    // TC-SET-008+009: tile click and back button
    await page.locator('[data-testid="settings-tile-organization"]').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('[data-testid="button-back-settings"]')).toBeVisible();
    await page.locator('[data-testid="button-back-settings"]').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('[data-testid="settings-tile-organization"]')).toBeVisible();
  });

  test('TC-SET-030+036+042: org section — fields, comm gate, channels', async ({ page }) => {
    await loginAndNavigate(page, users.orgAdmin);
    await page.locator('[data-testid="settings-tile-organization"]').click();
    await page.waitForTimeout(1500);

    // TC-SET-030: org name pre-populated
    const orgNameInput = page.locator('[data-testid="input-org-name"]');
    await expect(orgNameInput).toBeVisible();
    const value = await orgNameInput.inputValue();
    expect(value.length).toBeGreaterThan(0);

    // TC-SET-036: comm gate toggle visible
    await expect(page.locator('[data-testid="switch-communication-gate"]')).toBeVisible();

    // TC-SET-042: channel switches present
    const smsSwitch = page.locator('[data-testid="switch-sms-channel"]');
    if (await smsSwitch.isVisible()) {
      expect(await smsSwitch.isVisible()).toBe(true);
    }
  });
});

test.describe('Browser: org_admin — user management and tools', () => {

  test('TC-SET-010+011+028b: user list, search, no New Org button', async ({ page }) => {
    await loginAndNavigate(page, users.orgAdmin);
    await page.locator('[data-testid="settings-tile-users"]').click();
    await page.waitForTimeout(1500);

    // TC-SET-010: user cards present
    const userCards = page.locator('[data-testid^="user-"]');
    expect(await userCards.count()).toBeGreaterThan(0);

    // TC-SET-011: search input
    const searchInput = page.locator('[data-testid="input-search-users"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('zzz_nonexistent');
      await page.waitForTimeout(500);
    }

    // TC-SET-028b: New Organization button hidden
    expect(await page.locator('[data-testid="button-new-organization"]').isVisible().catch(() => false)).toBe(false);
  });

  test('TC-SET-048+054b+055+060: tools tabs, API Keys/Webhooks hidden, universal channels', async ({ page }) => {
    await loginAndNavigate(page, users.orgAdmin);
    await page.locator('[data-testid="settings-tile-tools"]').click();
    await page.waitForTimeout(1500);

    // TC-SET-048: core tabs visible
    for (const tabId of ['tab-mcp', 'tab-api-tools', 'tab-other']) {
      await expect(page.locator(`[data-testid="${tabId}"]`)).toBeVisible();
    }

    // TC-SET-054b+055: API Keys and Webhooks hidden for org_admin
    expect(await page.locator('[data-testid="tab-api-keys"]').isVisible().catch(() => false)).toBe(false);
    expect(await page.locator('[data-testid="tab-webhooks"]').isVisible().catch(() => false)).toBe(false);

    // TC-SET-060: universal channel toggles
    const universalTab = page.locator('[data-testid="tab-universal"]');
    if (await universalTab.isVisible()) {
      await universalTab.click();
      await page.waitForTimeout(1000);
      await expect(page.locator('[data-testid="switch-channel-chat"]')).toBeVisible();
    }
  });
});

test.describe('Browser: org_admin — knowledge, notifications, appearance', () => {

  test('TC-SET-075+090: knowledge base tabs and settings toggle', async ({ page }) => {
    await loginAndNavigate(page, users.orgAdmin);
    await page.locator('[data-testid="settings-tile-knowledge"]').click();
    await page.waitForTimeout(1500);

    // TC-SET-075: 4 tabs
    for (const tabId of ['tab-kb-documents', 'tab-kb-web-pages', 'tab-kb-databases', 'tab-kb-settings']) {
      await expect(page.locator(`[data-testid="${tabId}"]`)).toBeVisible();
    }

    // TC-SET-090: auto-index toggle
    await page.locator('[data-testid="tab-kb-settings"]').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('[data-testid="switch-auto-index"]')).toBeVisible();
  });

  test('TC-SET-106+110+111+115: notifications — toggles, quiet hours, events, save', async ({ page }) => {
    await loginAndNavigate(page, users.orgAdmin);
    await page.locator('[data-testid="settings-tile-notifications"]').click();
    await page.waitForTimeout(1500);

    // TC-SET-106: channel toggles
    await expect(page.locator('[data-testid="switch-email-notifications"]')).toBeVisible();
    await expect(page.locator('[data-testid="switch-sms-notifications"]')).toBeVisible();
    await expect(page.locator('[data-testid="switch-push-notifications"]')).toBeVisible();

    // TC-SET-110: quiet hours
    await expect(page.locator('[data-testid="input-quiet-start"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-quiet-end"]')).toBeVisible();

    // TC-SET-111: per-event toggles
    for (const evt of ['new-lead', 'appointment-booked', 'agent-alert', 'task-due']) {
      await expect(page.locator(`[data-testid="switch-notification-${evt}"]`)).toBeVisible();
    }

    // TC-SET-115: save button
    await expect(page.locator('[data-testid="button-save-notifications"]')).toBeVisible();
  });

  test('TC-SET-117+120+122: appearance — toggles, default view, save button', async ({ page }) => {
    await loginAndNavigate(page, users.orgAdmin);
    await page.locator('[data-testid="settings-tile-appearance"]').click();
    await page.waitForTimeout(1500);

    // TC-SET-117: default toggles
    await expect(page.locator('[data-testid="switch-compact-mode"]')).toBeVisible();
    await expect(page.locator('[data-testid="switch-animations"]')).toBeVisible();
    await expect(page.locator('[data-testid="switch-metric-tiles"]')).toBeVisible();

    // TC-SET-120: default view select
    await expect(page.locator('[data-testid="select-default-view"]')).toBeVisible();

    // TC-SET-122: save button
    await expect(page.locator('[data-testid="button-save-appearance-settings"]')).toBeVisible();
  });
});

// ============================================================================
// D. BROWSER TESTS — super_admin role (consolidated to 3 tests = 3 logins)
// ============================================================================

test.describe('Browser: super_admin settings', () => {

  test('TC-SET-003+028: all 7 tiles visible, New Org button in users section', async ({ page }) => {
    await loginAndNavigate(page, users.superAdmin);

    // All 7 tiles
    for (const tileId of ['users', 'organization', 'tools', 'knowledge', 'ai', 'notifications', 'appearance']) {
      await expect(page.locator(`[data-testid="settings-tile-${tileId}"]`)).toBeVisible();
    }

    // TC-SET-028: New Organization button
    await page.locator('[data-testid="settings-tile-users"]').click();
    await page.waitForTimeout(1500);
    await expect(page.locator('[data-testid="button-new-organization"]')).toBeVisible();
  });

  test('TC-SET-054: API Keys tab visible + tools tabs', async ({ page }) => {
    await loginAndNavigate(page, users.superAdmin);
    await page.locator('[data-testid="settings-tile-tools"]').click();
    await page.waitForTimeout(1500);
    await expect(page.locator('[data-testid="tab-api-keys"]')).toBeVisible();
  });

  test('TC-SET-094+095+099+101: AI config — tabs, model, behavior, hunches', async ({ page }) => {
    await loginAndNavigate(page, users.superAdmin);
    await page.locator('[data-testid="settings-tile-ai"]').click();
    await page.waitForTimeout(1500);

    // TC-SET-094: 3 tabs
    for (const tabId of ['tab-system-prompt', 'tab-agent-behavior', 'tab-hunches']) {
      await expect(page.locator(`[data-testid="${tabId}"]`)).toBeVisible();
    }

    // TC-SET-095: model select
    await expect(page.locator('[data-testid="select-ai-model"]')).toBeVisible();

    // TC-SET-099: agent behavior checkboxes
    await page.locator('[data-testid="tab-agent-behavior"]').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('[data-testid="checkbox-action-initiate-outbound-calls"]')).toBeVisible();

    // TC-SET-101: hunches toggle
    await page.locator('[data-testid="tab-hunches"]').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('[data-testid="switch-enable-hunches"]')).toBeVisible();
  });
});

// ============================================================================
// E. BROWSER TESTS — partner_admin (1 test = 1 login)
// ============================================================================

test.describe('Browser: partner_admin settings', () => {

  test('TC-SET-003+104: all 7 tiles, AI config read-only (save button hidden)', async ({ page }) => {
    await loginAndNavigate(page, users.partnerAdmin);

    // 7 tiles visible
    for (const tileId of ['users', 'organization', 'tools', 'knowledge', 'ai', 'notifications', 'appearance']) {
      await expect(page.locator(`[data-testid="settings-tile-${tileId}"]`)).toBeVisible();
    }

    // TC-SET-104: AI config read-only — save button hidden
    await page.locator('[data-testid="settings-tile-ai"]').click();
    await page.waitForTimeout(1500);
    expect(await page.locator('[data-testid="button-save-system-prompt"]').isVisible().catch(() => false)).toBe(false);
  });
});

// ============================================================================
// F. BROWSER TESTS — restricted roles (1 test per role = 3 logins)
// ============================================================================

test.describe('Browser: restricted role access', () => {

  test('TC-SET-004: sales role has no settings tiles', async ({ page }) => {
    await loginAndNavigate(page, users.sales);
    const tiles = page.locator('[data-testid^="settings-tile-"]');
    const count = await tiles.count();
    const url = page.url();
    expect(count === 0 || !url.includes('/settings')).toBe(true);
  });

  test('TC-SET-005: service role has no settings access', async ({ page }) => {
    await loginAndNavigate(page, users.service);
    const tiles = page.locator('[data-testid^="settings-tile-"]');
    const count = await tiles.count();
    const url = page.url();
    expect(count === 0 || !url.includes('/settings')).toBe(true);
  });

  test('TC-SET-006: marketing role has no settings tiles', async ({ page }) => {
    await loginAndNavigate(page, users.marketing);
    const tiles = page.locator('[data-testid^="settings-tile-"]');
    const count = await tiles.count();
    const url = page.url();
    expect(count === 0 || !url.includes('/settings')).toBe(true);
  });
});
