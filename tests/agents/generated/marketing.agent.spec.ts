/**
 * Marketing Domain Tests — Sprint T-003
 *
 * Covers: page load, tab navigation, dashboard metrics, agent cards,
 * agent chat basics, studio gallery, RBAC, API validation.
 *
 * Does NOT duplicate domain-06-departments.spec.ts (6.3) or domain-04-campaigns.spec.ts.
 *
 * Strategy: minimize login calls to stay under rate limit (5 logins / 15 min).
 * - 1 marketing user login shared across all marketing-role browser tests
 * - 1 login per RBAC role that needs a separate context
 * - API tests use file-cached tokens (login() helper)
 */
import { test, expect, type BrowserContext, type Page } from "playwright/test";
import { testUsers, login, loginForBrowser, authHeader } from "../../e2e/helpers/auth";

const BASE_URL = process.env.BASE_URL || "https://dev.huminicdev.com";

// ─── Helper: navigate within a logged-in page ───────────────────────────────
async function navigateTo(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(2000);
}

// ─── 1-5. Marketing User Tests (single login) ──────────────────────────────

test.describe("Marketing: Core Functionality", () => {
  let ctx: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    ctx = await browser.newContext({ baseURL: BASE_URL });
    page = await ctx.newPage();
    await loginForBrowser(page, testUsers.marketing, "/marketing");
  });

  test.afterAll(async () => {
    await page.close();
    await ctx.close();
  });

  // ── Page Load & Navigation ──

  test("MKT-002: Page title displays 'Marketing'", async () => {
    await navigateTo(page, "/marketing");
    await expect(page.locator("h1")).toContainText("Marketing");
  });

  test("MKT-003: Four tabs visible (Dashboard, Agents, Studio, Insights)", async () => {
    await navigateTo(page, "/marketing");
    for (const tabId of ["dashboard", "agents", "studio", "insights"]) {
      await expect(page.locator(`[data-testid="tab-marketing-${tabId}"]`)).toBeVisible();
    }
  });

  test("MKT-004: Dashboard tab is active by default", async () => {
    await navigateTo(page, "/marketing");
    await expect(page.locator('[data-testid="tab-marketing-dashboard"]')).toHaveClass(/border-primary/);
    await expect(page.locator("text=Marketing Dashboard")).toBeVisible();
  });

  test("MKT-005: Tab switching works for all tabs", async () => {
    await navigateTo(page, "/marketing");

    await page.locator('[data-testid="tab-marketing-agents"]').click();
    await expect(page.locator('[data-testid="text-agents-title"]')).toBeVisible();

    await page.locator('[data-testid="tab-marketing-studio"]').click();
    await expect(page.locator('[data-testid="studio-filter-pills"]')).toBeVisible();

    await page.locator('[data-testid="tab-marketing-insights"]').click();
    await page.waitForTimeout(500);

    await page.locator('[data-testid="tab-marketing-dashboard"]').click();
    await expect(page.locator("text=Marketing Dashboard")).toBeVisible();
  });

  test("MKT-006: URL ?tab=agents opens Agents tab directly", async () => {
    await navigateTo(page, "/marketing?tab=agents");
    await expect(page.locator('[data-testid="text-agents-title"]')).toBeVisible();
  });

  test("MKT-007: URL ?tab=studio opens Studio tab directly", async () => {
    await navigateTo(page, "/marketing?tab=studio");
    await expect(page.locator('[data-testid="studio-filter-pills"]')).toBeVisible();
  });

  test("MKT-008: URL ?agent=photo-studio opens agent chat view", async () => {
    await navigateTo(page, "/marketing?tab=agents&agent=photo-studio");
    await expect(page.locator('[data-testid="tab-marketing-dashboard"]')).not.toBeVisible();
  });

  // ── Dashboard Metric Tiles ──

  test("MKT-010: Four metric tiles render", async () => {
    await navigateTo(page, "/marketing");
    for (const id of ["mm-1", "mm-2", "mm-3", "mm-4"]) {
      await expect(page.locator(`[data-testid="metric-tile-${id}"]`)).toBeVisible();
    }
  });

  test("MKT-011: Campaign Performance tile shows a percentage value", async () => {
    await navigateTo(page, "/marketing");
    const value = page.locator('[data-testid="metric-tile-mm-1"] p.text-2xl');
    await expect(value).toHaveText(/%$/);
  });

  test("MKT-012: Campaigns Active tile shows numeric value", async () => {
    await navigateTo(page, "/marketing");
    const value = page.locator('[data-testid="metric-tile-mm-2"] p.text-2xl');
    await expect(value).toHaveText(/^\d+$/);
  });

  test("MKT-013: Messages Sent tile shows numeric value", async () => {
    await navigateTo(page, "/marketing");
    const value = page.locator('[data-testid="metric-tile-mm-3"] p.text-2xl');
    await expect(value).toHaveText(/^\d+$/);
  });

  test("MKT-014: Replies Received tile shows numeric value", async () => {
    await navigateTo(page, "/marketing");
    const value = page.locator('[data-testid="metric-tile-mm-4"] p.text-2xl');
    await expect(value).toHaveText(/^\d+$/);
  });

  test("MKT-015: Clicking metric tile opens detail dialog", async () => {
    await navigateTo(page, "/marketing");
    await page.locator('[data-testid="metric-tile-mm-1"]').click();
    await expect(page.locator('[data-testid="dialog-metric-detail"]')).toBeVisible();
    await page.keyboard.press("Escape");
  });

  test("MKT-016: Metric detail dialog shows value matching tile", async () => {
    await navigateTo(page, "/marketing");
    const tile = page.locator('[data-testid="metric-tile-mm-2"]');
    const tileValue = await tile.locator("p.text-2xl").textContent();
    await tile.click();
    await expect(page.locator('[data-testid="text-metric-detail-value"]')).toHaveText(tileValue!);
    await page.keyboard.press("Escape");
  });

  test("MKT-017: Metric detail dialog shows 'Marketing' department", async () => {
    await navigateTo(page, "/marketing");
    await page.locator('[data-testid="metric-tile-mm-1"]').click();
    await expect(page.locator('[data-testid="dialog-metric-detail"]')).toContainText("Marketing");
    await page.keyboard.press("Escape");
  });

  test("MKT-018: Metric detail dialog closes on Escape", async () => {
    await navigateTo(page, "/marketing");
    await page.locator('[data-testid="metric-tile-mm-1"]').click();
    await expect(page.locator('[data-testid="dialog-metric-detail"]')).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator('[data-testid="dialog-metric-detail"]')).not.toBeVisible();
  });

  // ── Agent Cards ──

  test("MKT-020: Five agent cards render on Agents tab", async () => {
    await navigateTo(page, "/marketing?tab=agents");
    for (const id of ["photo-studio", "video-producer", "copywriter", "creative-director", "market-intel"]) {
      await expect(page.locator(`[data-testid="agent-card-${id}"]`)).toBeVisible();
    }
  });

  test("MKT-021a: Photo Studio card shows correct name and description", async () => {
    await navigateTo(page, "/marketing?tab=agents");
    await expect(page.locator('[data-testid="text-agent-name-photo-studio"]')).toHaveText("Photo Studio");
    await expect(page.locator('[data-testid="text-agent-desc-photo-studio"]')).toContainText("vehicle photos");
  });

  test("MKT-021b: Video Producer card shows correct name and description", async () => {
    await expect(page.locator('[data-testid="text-agent-name-video-producer"]')).toHaveText("Video Producer");
    await expect(page.locator('[data-testid="text-agent-desc-video-producer"]')).toContainText("cinematic marketing videos");
  });

  test("MKT-021c: Copywriter card shows correct name and description", async () => {
    await expect(page.locator('[data-testid="text-agent-name-copywriter"]')).toHaveText("Copywriter");
    await expect(page.locator('[data-testid="text-agent-desc-copywriter"]')).toContainText("ads and captions");
  });

  test("MKT-021d: Creative Director card shows correct name and description", async () => {
    await expect(page.locator('[data-testid="text-agent-name-creative-director"]')).toHaveText("Creative Director");
    await expect(page.locator('[data-testid="text-agent-desc-creative-director"]')).toContainText("Ad IQ scoring");
  });

  test("MKT-021e: Market Intel card shows correct name and description", async () => {
    await expect(page.locator('[data-testid="text-agent-name-market-intel"]')).toHaveText("Market Intel");
    await expect(page.locator('[data-testid="text-agent-desc-market-intel"]')).toContainText("Competitor radar");
  });

  test("MKT-026: Agent card shows session count", async () => {
    const sessions = page.locator('[data-testid="text-agent-sessions-photo-studio"]');
    await expect(sessions).toHaveText(/\d+ sessions?/);
  });

  test("MKT-028: Clicking agent card opens AgentChatView", async () => {
    await navigateTo(page, "/marketing?tab=agents");
    await page.locator('[data-testid="agent-card-photo-studio"]').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('[data-testid="tab-marketing-dashboard"]')).not.toBeVisible();
  });

  test("MKT-029: AgentChatView back button returns to Agents tab", async () => {
    await navigateTo(page, "/marketing?tab=agents");
    await page.locator('[data-testid="agent-card-copywriter"]').click();
    await page.waitForTimeout(1000);
    await page.locator('[data-testid="button-agent-back"]').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('[data-testid="text-agents-title"]')).toBeVisible();
  });

  // ── Agent Chat Interaction ──

  test("MKT-033: Chat input accepts text", async () => {
    await navigateTo(page, "/marketing?tab=agents&agent=copywriter");
    const textarea = page.locator("textarea").first();
    await textarea.fill("Test message");
    await expect(textarea).toHaveValue("Test message");
  });

  test("MKT-035: File attachment button available for Photo Studio", async () => {
    await navigateTo(page, "/marketing?tab=agents&agent=photo-studio");
    const attachBtn = page.locator('input[type="file"], button[aria-label*="attach" i], [data-testid*="attach"]').first();
    const count = await attachBtn.count();
    expect(count).toBeGreaterThan(0);
  });

  test("MKT-036: File attachment NOT available for Copywriter", async () => {
    await navigateTo(page, "/marketing?tab=agents&agent=copywriter");
    const attachBtn = page.locator('input[type="file"], button[aria-label*="attach" i], [data-testid*="attach"]');
    const count = await attachBtn.count();
    expect(count).toBe(0);
  });

  test("MKT-037: File attachment NOT available for Market Intel", async () => {
    await navigateTo(page, "/marketing?tab=agents&agent=market-intel");
    const attachBtn = page.locator('input[type="file"], button[aria-label*="attach" i], [data-testid*="attach"]');
    const count = await attachBtn.count();
    expect(count).toBe(0);
  });

  // ── Studio Gallery ──

  test("MKT-060: Studio gallery structure is present", async () => {
    await navigateTo(page, "/marketing?tab=studio");
    const gallery = page.locator('[data-testid="studio-gallery"]');
    const emptyState = page.locator('[data-testid="empty-state-studio"]');
    const artifactCards = page.locator('[data-testid^="artifact-card-"]');
    const galleryVisible = await gallery.count() > 0;
    const emptyVisible = await emptyState.count() > 0;
    const cardsExist = await artifactCards.count() > 0;
    expect(galleryVisible || emptyVisible || cardsExist).toBeTruthy();
  });

  test("MKT-062: Studio page-level filter pills render (7 categories)", async () => {
    await navigateTo(page, "/marketing?tab=studio");
    const filterPills = page.locator('[data-testid="studio-filter-pills"] button');
    expect(await filterPills.count()).toBe(7);
    for (const cat of ["all", "images", "videos", "copy", "scores", "voiceovers", "radar"]) {
      await expect(page.locator(`[data-testid="studio-filter-${cat}"]`)).toBeVisible();
    }
  });

  test("MKT-066: Clicking filter then ALL resets to all view", async () => {
    await navigateTo(page, "/marketing?tab=studio");
    await page.locator('[data-testid="studio-filter-images"]').click();
    await page.waitForTimeout(300);
    await page.locator('[data-testid="studio-filter-all"]').click();
    await page.waitForTimeout(300);
    await expect(page.locator('[data-testid="studio-filter-all"]')).toHaveClass(/bg-primary/);
  });
});

// ─── 6. RBAC — Allowed Roles ────────────────────────────────────────────────
// Uses 2 logins: superAdmin and orgAdmin. partner_admin and executive
// share the same RBAC path (defaultSectionsByRole includes marketing).

test.describe("Marketing: RBAC Allowed Roles", () => {
  test("MKT-101: super_admin can access /marketing", async ({ browser }) => {
    const ctx = await browser.newContext({ baseURL: BASE_URL });
    const page = await ctx.newPage();
    await loginForBrowser(page, testUsers.superAdmin, "/marketing");
    await expect(page.locator('[data-testid="marketing-page"]')).toBeVisible({ timeout: 10000 });
    await page.close();
    await ctx.close();
  });

  test("MKT-102: org_admin can access /marketing", async ({ browser }) => {
    const ctx = await browser.newContext({ baseURL: BASE_URL });
    const page = await ctx.newPage();
    await loginForBrowser(page, testUsers.orgAdmin, "/marketing");
    await expect(page.locator('[data-testid="marketing-page"]')).toBeVisible({ timeout: 10000 });
    await page.close();
    await ctx.close();
  });
});

// ─── 7. RBAC — Denied Roles ─────────────────────────────────────────────────
// Uses 2 logins: sales (shared for sidebar + direct URL) and service.

test.describe("Marketing: RBAC Denied Roles", () => {
  test("MKT-105+108: sales role sidebar hides Marketing AND direct URL still loads (known gap)", async ({ browser }) => {
    const ctx = await browser.newContext({ baseURL: BASE_URL });
    const page = await ctx.newPage();
    await loginForBrowser(page, testUsers.sales, "/");

    // MKT-105: sidebar should NOT show Marketing
    const sidebar = page.locator('nav, [class*="sidebar"], [role="navigation"]');
    const marketingLink = sidebar.locator('[data-testid="sidebar-item-marketing"], a[href*="marketing"]:has-text("Marketing")');
    expect(await marketingLink.count()).toBe(0);

    // MKT-108: direct URL still loads (no route guard)
    await navigateTo(page, "/marketing");
    expect(page.url()).toContain("marketing");

    await page.close();
    await ctx.close();
  });

  test("MKT-106: service role sidebar does NOT show Marketing link", async ({ browser }) => {
    const ctx = await browser.newContext({ baseURL: BASE_URL });
    const page = await ctx.newPage();
    await loginForBrowser(page, testUsers.service, "/");
    const sidebar = page.locator('nav, [class*="sidebar"], [role="navigation"]');
    const marketingLink = sidebar.locator('[data-testid="sidebar-item-marketing"], a[href*="marketing"]:has-text("Marketing")');
    expect(await marketingLink.count()).toBe(0);
    await page.close();
    await ctx.close();
  });
});

// ─── 8. API Validation (uses cached tokens — no browser login) ──────────────

test.describe("Marketing: API Validation", () => {
  test("MKT-019-api: GET /api/metrics/dashboard returns 200 with campaign stats", async ({ request }) => {
    const { token } = await login(request, testUsers.marketing);
    const res = await request.get(`${BASE_URL}/api/metrics/dashboard`, {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("campaignStats");
    expect(body.campaignStats).toHaveProperty("total");
    expect(body.campaignStats).toHaveProperty("active");
    expect(body.campaignStats).toHaveProperty("totalSent");
    expect(body.campaignStats).toHaveProperty("totalReplied");
    expect(body.campaignStats).toHaveProperty("replyRate");
  });

  test("MKT-110: GET /api/campaigns returns 200 for marketing user", async ({ request }) => {
    const { token } = await login(request, testUsers.marketing);
    const res = await request.get(`${BASE_URL}/api/campaigns`, {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test("MKT-112: Dashboard metrics include campaignStats with expected fields", async ({ request }) => {
    const { token } = await login(request, testUsers.superAdmin);
    const res = await request.get(`${BASE_URL}/api/metrics/dashboard`, {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.campaignStats).toBeDefined();
    expect(typeof body.campaignStats.replyRate).toBe("number");
    expect(typeof body.campaignStats.active).toBe("number");
    expect(typeof body.campaignStats.totalSent).toBe("number");
    expect(typeof body.campaignStats.totalReplied).toBe("number");
  });

  test("MKT-api-unauth: /api/metrics/dashboard returns 401 without token", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/metrics/dashboard`);
    expect(res.status()).toBe(401);
  });

  test("MKT-api-campaigns-unauth: /api/campaigns returns 401 without token", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/campaigns`);
    expect(res.status()).toBe(401);
  });
});
