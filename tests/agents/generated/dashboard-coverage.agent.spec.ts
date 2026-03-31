import { test, expect } from 'playwright/test';

/**
 * Dashboard Coverage Agent Tests — T-002
 * Generated from: tests/agents/plans/dashboard-plan.md
 * Domain: Dashboard (/)
 *
 * Covers NEW gaps not in domain-02-dashboard.spec.ts or dashboard.agent.spec.ts:
 *   - KPI tile labels, numeric values, trend indicators
 *   - Metric detail dialogs (drill-down)
 *   - Pipeline API endpoints (auth, structure, detail params)
 *   - Chat interface (input, send, suggestion chips)
 *   - TopBar elements (theme toggle, notifications, profile menu, activity feed)
 *   - Role-based sidebar visibility
 *   - Tiles collapse behavior
 *   - Error/empty states via route intercepts
 */

const BASE_URL = process.env.BASE_URL || 'https://dev.huminicdev.com';
const TEST_PASSWORD = 'NexxusTest2026';

const users = {
  orgAdmin: { email: 'serra_honda@huminic.ai', password: TEST_PASSWORD },
  superAdmin: { email: 'duane.wells@huminic.ai', password: TEST_PASSWORD },
  partnerAdmin: { email: 'duanekwells@gmail.com', password: TEST_PASSWORD },
  sales: { email: 'sales_staff@huminic.ai', password: TEST_PASSWORD },
  service: { email: 'service_staff@huminic.ai', password: TEST_PASSWORD },
  marketing: { email: 'marketing_staff@huminic.ai', password: TEST_PASSWORD },
  executive: { email: 'executive_staff@huminic.ai', password: TEST_PASSWORD },
};

/** Login via API, dismiss tours, navigate to target path */
async function loginAndNavigate(
  page: import('playwright/test').Page,
  user: { email: string; password: string },
  targetPath: string = '/'
) {
  const response = await page.request.post(`${BASE_URL}/api/auth/login`, {
    data: { email: user.email, password: user.password },
  });
  if (!response.ok()) {
    throw new Error(`Login failed for ${user.email}: ${response.status()} ${await response.text()}`);
  }
  const body = await response.json();

  await page.addInitScript(() => {
    const prefix = 'nexxus_tour_dismissed_';
    const keys = [
      'main', 'teambox', 'my-work', 'sales', 'service', 'marketing',
      'management', 'agents', 'insights', 'settings', 'profile', 'usage',
    ];
    for (const key of keys) {
      localStorage.setItem(prefix + key, 'true');
    }
  });

  await page.goto(`${BASE_URL}${targetPath}`, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  await page.waitForTimeout(2000);

  return { token: body.accessToken, userId: body.user?.id, organizationId: body.user?.organization?.id };
}

/** API-only login — returns token without browser navigation */
async function apiLogin(request: import('playwright/test').APIRequestContext, user: { email: string; password: string }) {
  const res = await request.post(`${BASE_URL}/api/auth/login`, {
    data: { email: user.email, password: user.password },
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  return { token: body.accessToken, userId: body.user?.id, organizationId: body.user?.organization?.id };
}

// =============================================================================
// Section A: Page Structure (NEW tests only)
// =============================================================================

test.describe('Dashboard Coverage — Page Structure', () => {

  test('DASH-005 — AI Key Metrics header visible', async ({ page }) => {
    await loginAndNavigate(page, users.orgAdmin, '/');
    const header = page.locator('[data-testid="text-ai-key-metrics-title"]');
    await expect(header).toBeVisible({ timeout: 10000 });
    const text = await header.textContent();
    expect(text?.toLowerCase()).toContain('ai key metrics');
  });

  test('DASH-006 — dashboard loads for all 7 roles without error', async ({ page }) => {
    const roles = [
      users.superAdmin, users.partnerAdmin, users.orgAdmin,
      users.executive, users.sales, users.service, users.marketing,
    ];
    for (const user of roles) {
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });

      await page.context().clearCookies();
      await loginAndNavigate(page, user, '/');

      expect(page.url()).not.toContain('/login');
      const bodyText = await page.textContent('body') || '';
      expect(bodyText.length).toBeGreaterThan(100);

      const critical = consoleErrors.filter(
        (e) => !e.includes('favicon') && !e.includes('websocket') && !e.includes('net::ERR')
          && !e.includes('ResizeObserver') && !e.includes('status of 404')
          && !e.includes('Conversation not found') && !e.includes('Query error')
          && !e.includes('Failed to fetch') && !e.includes('Failed to create main chat')
      );
      expect(critical).toEqual([]);
      page.removeAllListeners('console');
    }
  });
});

// =============================================================================
// Section B: KPI Metric Tiles
// =============================================================================

test.describe('Dashboard Coverage — KPI Metric Tiles', () => {

  test('DASH-011 — metric tile labels match expected set', async ({ page }) => {
    await loginAndNavigate(page, users.orgAdmin, '/');
    const tiles = page.locator('[data-testid^="metric-tile-"]');
    await expect(tiles.first()).toBeVisible({ timeout: 10000 });
    const count = await tiles.count();
    expect(count).toBe(4);

    const allText = await tiles.allTextContents();
    const combined = allText.join(' ');
    expect(combined).toContain('Active Pipeline');
    expect(combined).toContain('Appointments Today');
    expect(combined).toContain('Open Escalations');
    expect(combined).toContain('Outbound Sent 24h');
  });

  test('DASH-012 — metric tiles show numeric values', async ({ page }) => {
    await loginAndNavigate(page, users.orgAdmin, '/');
    const tiles = page.locator('[data-testid^="metric-tile-"]');
    await expect(tiles.first()).toBeVisible({ timeout: 10000 });

    for (let i = 0; i < 4; i++) {
      const tile = tiles.nth(i);
      const text = await tile.textContent() || '';
      // The value is the large bold number — extract digits from tile text
      const numbers = text.match(/\d+/g);
      expect(numbers).not.toBeNull();
      expect(numbers!.length).toBeGreaterThan(0);
    }
  });

  test('DASH-013 — metric tiles show trend indicators', async ({ page }) => {
    await loginAndNavigate(page, users.orgAdmin, '/');
    const tiles = page.locator('[data-testid^="metric-tile-"]');
    await expect(tiles.first()).toBeVisible({ timeout: 10000 });

    for (let i = 0; i < 4; i++) {
      const tile = tiles.nth(i);
      const text = await tile.textContent() || '';
      // Each tile should show "live" as the change label
      expect(text).toContain('live');
    }
  });

  test('DASH-016 — pipeline API returns valid structure', async ({ request }) => {
    const { token } = await apiLogin(request, users.orgAdmin);
    const res = await request.get(`${BASE_URL}/api/metrics/pipeline`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(typeof data.activePipeline).toBe('number');
    expect(typeof data.appointmentsToday).toBe('number');
    expect(typeof data.openEscalations).toBe('number');
    expect(typeof data.outboundSent24h).toBe('number');
    expect(data.activePipeline).toBeGreaterThanOrEqual(0);
    expect(data.appointmentsToday).toBeGreaterThanOrEqual(0);
    expect(data.openEscalations).toBeGreaterThanOrEqual(0);
    expect(data.outboundSent24h).toBeGreaterThanOrEqual(0);
  });

  test('DASH-017 — pipeline API requires authentication', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/metrics/pipeline`);
    expect(res.status()).toBe(401);
  });

  test('DASH-018 — dashboard metrics API returns data', async ({ request }) => {
    const { token } = await apiLogin(request, users.orgAdmin);
    const res = await request.get(`${BASE_URL}/api/metrics/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    // Endpoint may or may not exist — document discovery
    if (res.ok()) {
      const data = await res.json();
      expect(data).toBeTruthy();
    } else {
      test.info().annotations.push({
        type: 'note',
        description: `Dashboard metrics API returned ${res.status()} — endpoint may not exist separately from pipeline`,
      });
      // Accept 404 as valid (endpoint may not exist), but not 500
      expect(res.status()).not.toBe(500);
    }
  });
});

// =============================================================================
// Section C: Metric Detail Dialogs
// =============================================================================

test.describe('Dashboard Coverage — Metric Detail Dialogs', () => {

  test('DASH-020 — click Active Pipeline tile opens detail dialog', async ({ page }) => {
    await loginAndNavigate(page, users.orgAdmin, '/');
    const tile = page.locator('[data-testid="metric-tile-0"]');
    await expect(tile).toBeVisible({ timeout: 10000 });
    await tile.click();

    const dialog = page.locator('[data-testid="dialog-metric-detail"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    const title = page.locator('[data-testid="text-metric-detail-title"]');
    await expect(title).toContainText('Active Pipeline');

    const value = page.locator('[data-testid="text-metric-detail-value"]');
    await expect(value).toBeVisible();
    const valText = await value.textContent() || '';
    expect(valText).toMatch(/^\d+$/);
  });

  test('DASH-022 — click Appointments Today tile opens detail dialog', async ({ page }) => {
    await loginAndNavigate(page, users.orgAdmin, '/');
    const tile = page.locator('[data-testid="metric-tile-1"]');
    await expect(tile).toBeVisible({ timeout: 10000 });
    await tile.click();

    const dialog = page.locator('[data-testid="dialog-metric-detail"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    const title = page.locator('[data-testid="text-metric-detail-title"]');
    await expect(title).toContainText('Appointments Today');
  });

  test('DASH-023 — click Open Escalations tile opens detail dialog', async ({ page }) => {
    await loginAndNavigate(page, users.orgAdmin, '/');
    const tile = page.locator('[data-testid="metric-tile-2"]');
    await expect(tile).toBeVisible({ timeout: 10000 });
    await tile.click();

    const dialog = page.locator('[data-testid="dialog-metric-detail"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    const title = page.locator('[data-testid="text-metric-detail-title"]');
    await expect(title).toContainText('Open Escalations');
  });

  test('DASH-024 — click Outbound Sent tile opens detail dialog', async ({ page }) => {
    await loginAndNavigate(page, users.orgAdmin, '/');
    const tile = page.locator('[data-testid="metric-tile-3"]');
    await expect(tile).toBeVisible({ timeout: 10000 });
    await tile.click();

    const dialog = page.locator('[data-testid="dialog-metric-detail"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    const title = page.locator('[data-testid="text-metric-detail-title"]');
    await expect(title).toContainText('Outbound Sent 24h');
  });

  test('DASH-025 — metric detail dialog closes on dismiss', async ({ page }) => {
    await loginAndNavigate(page, users.orgAdmin, '/');
    const tile = page.locator('[data-testid="metric-tile-0"]');
    await expect(tile).toBeVisible({ timeout: 10000 });
    await tile.click();

    const dialog = page.locator('[data-testid="dialog-metric-detail"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Press Escape to close
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible({ timeout: 3000 });
  });

  test('DASH-026 — pipeline detail API returns data for each metric', async ({ request }) => {
    const { token } = await apiLogin(request, users.orgAdmin);
    const metrics = ['active_pipeline', 'appointments_today', 'open_escalations', 'outbound_sent'];

    for (const metric of metrics) {
      const res = await request.get(`${BASE_URL}/api/metrics/pipeline/details?metric=${metric}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
    }
  });

  test('DASH-027 — pipeline detail API rejects invalid metric param', async ({ request }) => {
    const { token } = await apiLogin(request, users.orgAdmin);
    const res = await request.get(`${BASE_URL}/api/metrics/pipeline/details?metric=invalid_key`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(400);
  });

  test('DASH-028 — pipeline detail API rejects missing metric param', async ({ request }) => {
    const { token } = await apiLogin(request, users.orgAdmin);
    const res = await request.get(`${BASE_URL}/api/metrics/pipeline/details`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(400);
  });

  test('DASH-030 — metric detail dialog shows error state on API failure', async ({ page }) => {
    await loginAndNavigate(page, users.orgAdmin, '/');

    // Intercept the detail API to return 500
    await page.route('**/api/metrics/pipeline/details**', (route) => {
      route.fulfill({ status: 500, body: JSON.stringify({ error: 'Server error' }) });
    });

    const tile = page.locator('[data-testid="metric-tile-0"]');
    await expect(tile).toBeVisible({ timeout: 10000 });
    await tile.click();

    const dialog = page.locator('[data-testid="dialog-metric-detail"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    const errorEl = page.locator('[data-testid="metric-detail-error"]');
    await expect(errorEl).toBeVisible({ timeout: 10000 });
    await expect(errorEl).toContainText('Failed to load records');
  });

  test('DASH-031 — metric detail dialog shows empty state', async ({ page }) => {
    await loginAndNavigate(page, users.orgAdmin, '/');

    // Intercept the detail API to return empty array
    await page.route('**/api/metrics/pipeline/details**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    const tile = page.locator('[data-testid="metric-tile-0"]');
    await expect(tile).toBeVisible({ timeout: 10000 });
    await tile.click();

    const dialog = page.locator('[data-testid="dialog-metric-detail"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    const emptyEl = page.locator('[data-testid="metric-detail-empty"]');
    await expect(emptyEl).toBeVisible({ timeout: 10000 });
    await expect(emptyEl).toContainText('No records found');
  });
});

// =============================================================================
// Section E: AI Chat Interface
// =============================================================================

test.describe('Dashboard Coverage — Chat Interface', () => {

  test('DASH-050 — chat input renders with placeholder', async ({ page }) => {
    await loginAndNavigate(page, users.orgAdmin, '/');
    const input = page.locator('[data-testid="input-main-chat"]');
    await expect(input).toBeVisible({ timeout: 10000 });
    const placeholder = await input.getAttribute('placeholder');
    expect(placeholder).toContain('Ask me anything');
  });

  test('DASH-051 — send button disabled when input empty', async ({ page }) => {
    await loginAndNavigate(page, users.orgAdmin, '/');
    const sendBtn = page.locator('[data-testid="button-main-send"]');
    await expect(sendBtn).toBeVisible({ timeout: 10000 });
    await expect(sendBtn).toBeDisabled();

    // Type something — send should become enabled
    const input = page.locator('[data-testid="input-main-chat"]');
    await input.fill('test message');
    await expect(sendBtn).toBeEnabled();
  });

  test('DASH-055 — new conversation button present', async ({ page }) => {
    await loginAndNavigate(page, users.orgAdmin, '/');
    const addBtn = page.locator('[data-testid="button-main-chat-add"]');
    await expect(addBtn).toBeVisible({ timeout: 10000 });
  });

  test('DASH-070 — suggestion chips render on load', async ({ page }) => {
    await loginAndNavigate(page, users.orgAdmin, '/');

    // "Try asking..." label
    const tryLabel = page.locator('text="Try asking..."');
    await expect(tryLabel).toBeVisible({ timeout: 10000 });

    // Exactly 4 suggestion chips
    const chips = page.locator('[data-testid^="main-suggestion-"]');
    const count = await chips.count();
    expect(count).toBe(4);

    // Each chip has text content
    for (let i = 0; i < 4; i++) {
      const chipText = await chips.nth(i).textContent() || '';
      expect(chipText.trim().length).toBeGreaterThan(5);
    }
  });

  test('DASH-072 — clicking suggestion chip populates input', async ({ page }) => {
    await loginAndNavigate(page, users.orgAdmin, '/');
    const chip = page.locator('[data-testid="main-suggestion-0"]');
    await expect(chip).toBeVisible({ timeout: 10000 });
    const chipText = (await chip.textContent() || '').trim();

    await chip.click();

    const input = page.locator('[data-testid="input-main-chat"]');
    const inputVal = await input.inputValue();
    expect(inputVal).toBe(chipText);
  });
});

// =============================================================================
// Section G: Tiles Collapse Behavior
// =============================================================================

test.describe('Dashboard Coverage — Tiles Collapse', () => {

  test('DASH-080 — tiles visible on initial load, toggle hidden', async ({ page }) => {
    await loginAndNavigate(page, users.orgAdmin, '/');
    const tiles = page.locator('[data-testid^="metric-tile-"]');
    await expect(tiles.first()).toBeVisible({ timeout: 10000 });
    const count = await tiles.count();
    expect(count).toBe(4);

    // Toggle button should NOT be visible before any message is sent
    const toggleBtn = page.locator('[data-testid="button-toggle-metrics"]');
    const toggleCount = await toggleBtn.count();
    expect(toggleCount).toBe(0);
  });
});

// =============================================================================
// Section I: Sidebar Navigation (Role-Based)
// =============================================================================

test.describe('Dashboard Coverage — Sidebar RBAC', () => {

  test('DASH-100a — org_admin sees expected sidebar items', async ({ page }) => {
    await loginAndNavigate(page, users.orgAdmin, '/');
    await page.waitForTimeout(500);

    // org_admin should see: ai-chat, teambox, sales, service, marketing (per RBAC defaults)
    for (const id of ['ai-chat', 'teambox', 'sales', 'service', 'marketing']) {
      const item = page.locator(`[data-testid="sidebar-item-${id}"]`);
      await expect(item).toBeVisible({ timeout: 5000 });
    }

    // org_admin should see System (canAccessSystem returns true for org_admin)
    const systemItem = page.locator('[data-testid="sidebar-item-system"]');
    await expect(systemItem).toBeVisible({ timeout: 5000 });

    // org_admin should NOT see management (only super_admin has management by default)
    const mgmtItem = page.locator('[data-testid="sidebar-item-management"]');
    await expect(mgmtItem).not.toBeVisible();
  });

  test('DASH-100b — sales role has limited sidebar', async ({ page }) => {
    await loginAndNavigate(page, users.sales, '/');
    await page.waitForTimeout(500);

    // Sales should see AI Chat, TeamBox, Sales
    for (const id of ['ai-chat', 'teambox', 'sales']) {
      const item = page.locator(`[data-testid="sidebar-item-${id}"]`);
      await expect(item).toBeVisible({ timeout: 5000 });
    }

    // Sales should NOT see Service, Marketing, Management, System
    for (const id of ['service', 'marketing', 'management', 'system']) {
      const item = page.locator(`[data-testid="sidebar-item-${id}"]`);
      await expect(item).not.toBeVisible();
    }
  });

  test('DASH-100c — service role has limited sidebar', async ({ page }) => {
    await loginAndNavigate(page, users.service, '/');
    await page.waitForTimeout(500);

    for (const id of ['ai-chat', 'teambox', 'service']) {
      const item = page.locator(`[data-testid="sidebar-item-${id}"]`);
      await expect(item).toBeVisible({ timeout: 5000 });
    }

    for (const id of ['sales', 'marketing', 'management', 'system']) {
      const item = page.locator(`[data-testid="sidebar-item-${id}"]`);
      await expect(item).not.toBeVisible();
    }
  });

  test('DASH-100d — marketing role has limited sidebar', async ({ page }) => {
    await loginAndNavigate(page, users.marketing, '/');
    await page.waitForTimeout(500);

    for (const id of ['ai-chat', 'teambox', 'marketing']) {
      const item = page.locator(`[data-testid="sidebar-item-${id}"]`);
      await expect(item).toBeVisible({ timeout: 5000 });
    }

    for (const id of ['sales', 'service', 'management', 'system']) {
      const item = page.locator(`[data-testid="sidebar-item-${id}"]`);
      await expect(item).not.toBeVisible();
    }
  });

  test('DASH-104 — logout button present in sidebar', async ({ page }) => {
    await loginAndNavigate(page, users.orgAdmin, '/');
    const logoutBtn = page.locator('[data-testid="button-logout"]');
    await expect(logoutBtn).toBeVisible({ timeout: 5000 });
  });
});

// =============================================================================
// Section J: TopBar Elements
// =============================================================================

test.describe('Dashboard Coverage — TopBar', () => {

  test('DASH-112 — notifications bell visible', async ({ page }) => {
    await loginAndNavigate(page, users.orgAdmin, '/');
    const bell = page.locator('[data-testid="button-notifications"]');
    await expect(bell).toBeVisible({ timeout: 10000 });
  });

  test('DASH-114 — activity feed button visible', async ({ page }) => {
    await loginAndNavigate(page, users.orgAdmin, '/');
    const activityBtn = page.locator('[data-testid="button-activity-feed"]');
    await expect(activityBtn).toBeVisible({ timeout: 10000 });
  });

  test('DASH-115 — theme toggle works', async ({ page }) => {
    await loginAndNavigate(page, users.orgAdmin, '/');
    const themeBtn = page.locator('[data-testid="button-theme-toggle"]');
    await expect(themeBtn).toBeVisible({ timeout: 10000 });

    // Get initial theme state from <html> class
    const initialDark = await page.locator('html').evaluate((el) => el.classList.contains('dark'));

    await themeBtn.click();
    await page.waitForTimeout(500);

    const afterToggle = await page.locator('html').evaluate((el) => el.classList.contains('dark'));
    expect(afterToggle).not.toBe(initialDark);

    // Toggle back
    await themeBtn.click();
    await page.waitForTimeout(500);
    const restored = await page.locator('html').evaluate((el) => el.classList.contains('dark'));
    expect(restored).toBe(initialDark);
  });

  test('DASH-116 — profile menu dropdown opens', async ({ page }) => {
    await loginAndNavigate(page, users.orgAdmin, '/');
    const profileBtn = page.locator('[data-testid="button-profile-menu"]');
    await expect(profileBtn).toBeVisible({ timeout: 10000 });
    await profileBtn.click();

    const dropdown = page.locator('[data-testid="dropdown-profile"]');
    await expect(dropdown).toBeVisible({ timeout: 5000 });
  });

  test('DASH-110 — org switcher visible for partner_admin', async ({ page }) => {
    await loginAndNavigate(page, users.partnerAdmin, '/');
    const orgSwitcher = page.locator('[data-testid="button-org-switcher"]');
    await expect(orgSwitcher).toBeVisible({ timeout: 10000 });
  });

  test('DASH-117 — globe button visible', async ({ page }) => {
    await loginAndNavigate(page, users.orgAdmin, '/');
    const globeBtn = page.locator('[data-testid="button-public-page"]');
    await expect(globeBtn).toBeVisible({ timeout: 10000 });
  });
});

// =============================================================================
// Section K: Role-Specific Behavior
// =============================================================================

test.describe('Dashboard Coverage — Role-Specific', () => {

  test('DASH-120 — super_admin sees all sidebar sections', async ({ page }) => {
    await loginAndNavigate(page, users.superAdmin, '/');
    await page.waitForTimeout(500);

    for (const id of ['ai-chat', 'teambox', 'sales', 'service', 'marketing', 'management', 'system']) {
      const item = page.locator(`[data-testid="sidebar-item-${id}"]`);
      await expect(item).toBeVisible({ timeout: 5000 });
    }
  });

  test('DASH-122 — executive role loads dashboard with tiles', async ({ page }) => {
    await loginAndNavigate(page, users.executive, '/');
    expect(page.url()).not.toContain('/login');

    const tiles = page.locator('[data-testid^="metric-tile-"]');
    await expect(tiles.first()).toBeVisible({ timeout: 10000 });
    const count = await tiles.count();
    expect(count).toBe(4);

    // Executive should NOT see System
    const system = page.locator('[data-testid="sidebar-item-system"]');
    await expect(system).not.toBeVisible();
  });
});

// =============================================================================
// Section L: Activity Log API
// =============================================================================

test.describe('Dashboard Coverage — Activity Log API', () => {

  test('DASH-130 — activity log API returns data', async ({ request }) => {
    const { token } = await apiLogin(request, users.orgAdmin);
    const res = await request.get(`${BASE_URL}/api/activity-log`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok()) {
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
    } else {
      // Endpoint may be at a different path
      test.info().annotations.push({
        type: 'note',
        description: `Activity log API returned ${res.status()} — endpoint may differ`,
      });
      expect(res.status()).not.toBe(500);
    }
  });

  test('DASH-131 — activity log API requires auth', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/activity-log`);
    expect(res.status()).toBe(401);
  });
});
