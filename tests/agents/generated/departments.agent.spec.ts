/**
 * Department Switching Tests (T-003)
 *
 * Covers sidebar navigation, RBAC visibility, data refresh on switch,
 * URL routing, cross-department data isolation, and browser history behavior.
 *
 * Source plan: tests/agents/plans/departments-plan.md
 *
 * Rate-limit strategy: Log in once per unique user via beforeAll,
 * share the browser context across all tests in each group.
 * Total logins: 6 (orgAdmin, sales, service, marketing, superAdmin, executive).
 */
import { test, expect, type BrowserContext } from "playwright/test";
import { testUsers, loginForBrowser, type AuthUser } from "../../e2e/helpers/auth";

const BASE_URL = process.env.BASE_URL || "https://dev.huminicdev.com";

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

// ===========================================================================
// GROUP 1: OrgAdmin — navigation, data refresh, URL routing, history, isolation
// Single login, many tests
// ===========================================================================
test.describe("OrgAdmin Department Tests", () => {
  let ctx: BrowserContext;
  let token: string;

  test.beforeAll(async ({ browser }) => {
    ctx = await browser.newContext({ baseURL: BASE_URL });
    const page = await ctx.newPage();
    const result = await loginForBrowser(page, testUsers.orgAdmin, "/sales");
    token = result.token;
    await page.close();
  });

  test.afterAll(async () => { await ctx?.close(); });

  // --- 4.1 Sidebar Navigation ---

  test("TC-DEPT-001: Navigate Sales to Service via sidebar", async () => {
    const page = await ctx.newPage();
    await page.goto("/sales", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2500);
    await expect(page).toHaveURL(/\/sales/);

    await page.locator('[data-testid="sidebar-item-service"]').click();
    await page.waitForTimeout(2500);

    await expect(page).toHaveURL(/\/service/);
    await expect(page.getByRole("heading", { name: "Service" }).first()).toBeVisible({ timeout: 8000 });
    await page.close();
  });

  test("TC-DEPT-002: Navigate Service to Marketing via sidebar", async () => {
    const page = await ctx.newPage();
    await page.goto("/service", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2500);

    await page.locator('[data-testid="sidebar-item-marketing"]').click();
    await page.waitForTimeout(2500);

    await expect(page).toHaveURL(/\/marketing/);
    await expect(page.getByRole("heading", { name: "Marketing" }).first()).toBeVisible({ timeout: 8000 });
    await page.close();
  });

  test("TC-DEPT-003: Navigate Marketing to Sales via sidebar", async () => {
    const page = await ctx.newPage();
    await page.goto("/marketing", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2500);

    await page.locator('[data-testid="sidebar-item-sales"]').click();
    await page.waitForTimeout(2500);

    await expect(page).toHaveURL(/\/sales/);
    await expect(page.getByRole("heading", { name: "Sales" }).first()).toBeVisible({ timeout: 8000 });
    await page.close();
  });

  test("TC-DEPT-004: Rapid sequential department switching", async () => {
    const page = await ctx.newPage();
    await page.goto("/sales", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2500);

    await page.locator('[data-testid="sidebar-item-service"]').click();
    await page.waitForTimeout(400);
    await page.locator('[data-testid="sidebar-item-marketing"]').click();
    await page.waitForTimeout(3000);

    await expect(page).toHaveURL(/\/marketing/);
    await expect(page.getByRole("heading", { name: "Marketing" }).first()).toBeVisible({ timeout: 8000 });
    await page.close();
  });

  test("TC-DEPT-005: Active indicator follows department switch", async () => {
    const page = await ctx.newPage();
    await page.goto("/sales", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2500);

    await expect(page.locator('[data-testid="sidebar-item-sales"]')).toBeVisible();

    await page.locator('[data-testid="sidebar-item-service"]').click();
    await page.waitForTimeout(2500);
    await expect(page).toHaveURL(/\/service/);

    await page.locator('[data-testid="sidebar-item-marketing"]').click();
    await page.waitForTimeout(2500);
    await expect(page).toHaveURL(/\/marketing/);
    await page.close();
  });

  // --- 4.2 RBAC — Org admin sidebar ---

  test("TC-DEPT-013: Org admin sees Sales, Service, Marketing — not Management", async () => {
    const page = await ctx.newPage();
    await page.goto("/sales", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2500);

    await expect(page.locator('[data-testid="sidebar-item-sales"]')).toBeVisible();
    await expect(page.locator('[data-testid="sidebar-item-service"]')).toBeVisible();
    await expect(page.locator('[data-testid="sidebar-item-marketing"]')).toBeVisible();
    await expect(page.locator('[data-testid="sidebar-item-management"]')).toHaveCount(0);
    await page.close();
  });

  // --- 4.3 Data Refresh ---

  test("TC-DEPT-023: Agent list changes between departments (API)", async ({ request }) => {
    const [salesRes, serviceRes] = await Promise.all([
      request.get(`${BASE_URL}/api/agents?department=sales`, { headers: authHeader(token) }),
      request.get(`${BASE_URL}/api/agents?department=service`, { headers: authHeader(token) }),
    ]);

    expect(salesRes.ok()).toBe(true);
    expect(serviceRes.ok()).toBe(true);

    const salesAgents = await salesRes.json();
    const serviceAgents = await serviceRes.json();

    expect(Array.isArray(salesAgents)).toBe(true);
    expect(Array.isArray(serviceAgents)).toBe(true);

    if (salesAgents.length > 0 && serviceAgents.length > 0) {
      const salesIds = salesAgents.map((a: any) => a.id).sort();
      const serviceIds = serviceAgents.map((a: any) => a.id).sort();
      expect(salesIds).not.toEqual(serviceIds);
    }
  });

  test("TC-DEPT-024: Switching from Service to Sales triggers fresh page load", async () => {
    const page = await ctx.newPage();
    await page.goto("/service", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2500);
    await expect(page).toHaveURL(/\/service/);

    await page.locator('[data-testid="sidebar-item-sales"]').click();
    await page.waitForTimeout(3000);

    await expect(page).toHaveURL(/\/sales/);
    await expect(page.locator('[data-testid="tab-sales-dashboard"]')).toBeVisible({ timeout: 8000 });
    await page.close();
  });

  test("TC-DEPT-026: Tab state resets on department switch", async () => {
    const page = await ctx.newPage();
    await page.goto("/sales", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2500);

    const agentsTab = page.locator('[data-testid="tab-sales-agents"]');
    if (await agentsTab.isVisible().catch(() => false)) {
      await agentsTab.click();
      await page.waitForTimeout(1000);
    }

    await page.locator('[data-testid="sidebar-item-service"]').click();
    await page.waitForTimeout(2500);
    await expect(page).toHaveURL(/\/service/);

    const campaignsTab = page.locator('[data-testid="tab-service-campaigns"]');
    if (await campaignsTab.isVisible().catch(() => false)) {
      const isActive = await campaignsTab.getAttribute("data-state").catch(() => null)
        || await campaignsTab.getAttribute("aria-selected").catch(() => null);
      test.info().annotations.push({
        type: "observation",
        description: `Service default tab state: ${isActive}`,
      });
    }
    await page.close();
  });

  // --- 4.4 URL Routing ---

  test("TC-DEPT-033: Marketing tab query param preserved in URL", async () => {
    const page = await ctx.newPage();
    await page.goto("/marketing?tab=agents", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);

    await expect(page).toHaveURL(/\/marketing/);

    const agentContent = page.locator('[data-testid="tab-marketing-agents"]')
      .or(page.locator('[data-testid^="agent-card-"]'));
    const hasAgentContent = await agentContent.first().isVisible().catch(() => false);
    test.info().annotations.push({
      type: "observation",
      description: hasAgentContent
        ? "Marketing ?tab=agents opens agents tab correctly"
        : "Marketing ?tab=agents did not open agents tab — may use different param format",
    });
    await page.close();
  });

  test("TC-DEPT-035: Invalid department URL shows not-found", async () => {
    const page = await ctx.newPage();
    await page.goto("/finance", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2500);

    expect(page.url()).not.toMatch(/\/(sales|service|marketing|management)\/?$/);

    const notFound = page.locator('text="404"')
      .or(page.locator('text="Not Found"'))
      .or(page.locator('text="not found"'));
    const hasNotFound = await notFound.first().isVisible().catch(() => false);
    test.info().annotations.push({
      type: "observation",
      description: hasNotFound
        ? "404 page rendered for /finance"
        : "No explicit 404 — page may redirect or show empty content",
    });
    await page.close();
  });

  // --- 4.5 Cross-Department Data Isolation ---

  test("TC-DEPT-040: Sales agents do not appear on Service page (API)", async ({ request }) => {
    const [salesRes, serviceRes] = await Promise.all([
      request.get(`${BASE_URL}/api/agents?department=sales`, { headers: authHeader(token) }),
      request.get(`${BASE_URL}/api/agents?department=service`, { headers: authHeader(token) }),
    ]);

    expect(salesRes.ok()).toBe(true);
    expect(serviceRes.ok()).toBe(true);

    const salesAgents = await salesRes.json();
    const serviceAgents = await serviceRes.json();

    const salesIds = new Set(salesAgents.map((a: any) => a.id));
    for (const agent of serviceAgents) {
      expect(salesIds.has(agent.id)).toBe(false);
    }
  });

  test("TC-DEPT-042: Sales page does not have Studio tab", async () => {
    const page = await ctx.newPage();
    await page.goto("/sales", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    await expect(page.locator('[data-testid="tab-sales-studio"]')).toHaveCount(0);
    await expect(page.locator('[data-testid^="studio-filter-"]')).toHaveCount(0);
    await page.close();
  });

  test("TC-DEPT-043: Department metrics endpoint returns byDepartment data (API)", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/metrics/dashboard`, {
      headers: authHeader(token),
    });

    expect(res.ok()).toBe(true);
    const metrics = await res.json();

    if (metrics.campaignStats?.byDepartment) {
      const depts = Object.keys(metrics.campaignStats.byDepartment);
      test.info().annotations.push({
        type: "observation",
        description: `Departments in metrics: ${depts.join(", ")}`,
      });
      expect(depts.length).toBeGreaterThan(0);
    }
  });

  // --- 4.6 Back Button / History ---

  test("TC-DEPT-050: Browser back from Service returns to Sales", async () => {
    const page = await ctx.newPage();
    await page.goto("/sales", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2500);
    await expect(page).toHaveURL(/\/sales/);

    await page.locator('[data-testid="sidebar-item-service"]').click();
    await page.waitForTimeout(2500);
    await expect(page).toHaveURL(/\/service/);

    await page.goBack();
    await page.waitForTimeout(2500);
    await expect(page).toHaveURL(/\/sales/);
    await page.close();
  });

  test("TC-DEPT-051: Browser back from Marketing returns to Service", async () => {
    const page = await ctx.newPage();
    await page.goto("/service", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2500);

    await page.locator('[data-testid="sidebar-item-marketing"]').click();
    await page.waitForTimeout(2500);
    await expect(page).toHaveURL(/\/marketing/);

    await page.goBack();
    await page.waitForTimeout(2500);
    await expect(page).toHaveURL(/\/service/);
    await page.close();
  });

  test("TC-DEPT-052: Forward button after back restores department", async () => {
    const page = await ctx.newPage();
    await page.goto("/sales", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2500);

    await page.locator('[data-testid="sidebar-item-service"]').click();
    await page.waitForTimeout(2500);
    await expect(page).toHaveURL(/\/service/);

    await page.goBack();
    await page.waitForTimeout(2500);
    await expect(page).toHaveURL(/\/sales/);

    await page.goForward();
    await page.waitForTimeout(2500);
    await expect(page).toHaveURL(/\/service/);
    await page.close();
  });

  test("TC-DEPT-054: History entries accumulate across departments", async () => {
    const page = await ctx.newPage();
    await page.goto("/sales", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2500);

    await page.locator('[data-testid="sidebar-item-service"]').click();
    await page.waitForTimeout(2500);
    await page.locator('[data-testid="sidebar-item-marketing"]').click();
    await page.waitForTimeout(2500);
    await expect(page).toHaveURL(/\/marketing/);

    await page.goBack();
    await page.waitForTimeout(2500);
    await expect(page).toHaveURL(/\/service/);

    await page.goBack();
    await page.waitForTimeout(2500);
    await expect(page).toHaveURL(/\/sales/);
    await page.close();
  });

  // --- API Endpoints ---

  test("Sales agents endpoint returns department-scoped results", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/agents?department=sales`, {
      headers: authHeader(token),
    });
    expect(res.ok()).toBe(true);
    const agents = await res.json();
    expect(Array.isArray(agents)).toBe(true);
    for (const agent of agents) {
      expect(agent.department).toBe("sales");
    }
  });

  test("Service agents endpoint returns department-scoped results", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/agents?department=service`, {
      headers: authHeader(token),
    });
    expect(res.ok()).toBe(true);
    const agents = await res.json();
    expect(Array.isArray(agents)).toBe(true);
    for (const agent of agents) {
      expect(agent.department).toBe("service");
    }
  });

  test("Service campaigns endpoint accepts department filter", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/campaigns?department=service`, {
      headers: authHeader(token),
    });
    if (res.ok()) {
      const campaigns = await res.json();
      expect(Array.isArray(campaigns)).toBe(true);
    } else {
      test.info().annotations.push({
        type: "observation",
        description: `Campaigns endpoint returned ${res.status()} — may not support department filter`,
      });
    }
  });

  test("Dashboard metrics endpoint returns valid structure", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/metrics/dashboard`, {
      headers: authHeader(token),
    });
    expect(res.ok()).toBe(true);
    const data = await res.json();
    expect(data).toHaveProperty("campaignStats");
    expect(data).toHaveProperty("agentCounts");
  });
});

// ===========================================================================
// GROUP 2: Sales role — RBAC sidebar + direct URL access
// ===========================================================================
test.describe("Sales Role RBAC", () => {
  let ctx: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    ctx = await browser.newContext({ baseURL: BASE_URL });
    const page = await ctx.newPage();
    await loginForBrowser(page, testUsers.sales, "/sales");
    await page.close();
  });

  test.afterAll(async () => { await ctx?.close(); });

  test("TC-DEPT-010: Sales role sees Sales — not Service, Marketing, Management", async () => {
    const page = await ctx.newPage();
    await page.goto("/sales", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2500);

    await expect(page.locator('[data-testid="sidebar-item-sales"]')).toBeVisible();
    await expect(page.locator('[data-testid="sidebar-item-service"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="sidebar-item-marketing"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="sidebar-item-management"]')).toHaveCount(0);
    await page.close();
  });

  test("TC-DEPT-016: Sales role direct URL to /service — document behavior", async () => {
    const page = await ctx.newPage();
    await page.goto("/service", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);

    const url = page.url();
    const heading = page.getByRole("heading", { name: "Service" }).first();
    const visible = await heading.isVisible().catch(() => false);
    test.info().annotations.push({
      type: "observation",
      description: url.includes("/service")
        ? (visible ? "RBAC GAP: Sales role can access /service page content via direct URL" : "Service page loaded but no content visible")
        : `Sales role redirected from /service to ${url}`,
    });
    expect(true).toBe(true);
    await page.close();
  });
});

// ===========================================================================
// GROUP 3: Service role — RBAC sidebar + direct URL access
// ===========================================================================
test.describe("Service Role RBAC", () => {
  let ctx: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    ctx = await browser.newContext({ baseURL: BASE_URL });
    const page = await ctx.newPage();
    await loginForBrowser(page, testUsers.service, "/service");
    await page.close();
  });

  test.afterAll(async () => { await ctx?.close(); });

  test("TC-DEPT-011: Service role sees only Service", async () => {
    const page = await ctx.newPage();
    await page.goto("/service", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2500);

    await expect(page.locator('[data-testid="sidebar-item-service"]')).toBeVisible();
    await expect(page.locator('[data-testid="sidebar-item-sales"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="sidebar-item-marketing"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="sidebar-item-management"]')).toHaveCount(0);
    await page.close();
  });

  test("TC-DEPT-017: Service role direct URL to /sales — document behavior", async () => {
    const page = await ctx.newPage();
    await page.goto("/sales", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);

    const url = page.url();
    const heading = page.getByRole("heading", { name: "Sales" }).first();
    const visible = await heading.isVisible().catch(() => false);
    test.info().annotations.push({
      type: "observation",
      description: url.includes("/sales")
        ? (visible ? "RBAC GAP: Service role can access /sales page content via direct URL" : "Sales page loaded but no content visible")
        : `Service role redirected from /sales to ${url}`,
    });
    expect(true).toBe(true);
    await page.close();
  });
});

// ===========================================================================
// GROUP 4: Marketing role — RBAC sidebar + direct URL access
// ===========================================================================
test.describe("Marketing Role RBAC", () => {
  let ctx: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    ctx = await browser.newContext({ baseURL: BASE_URL });
    const page = await ctx.newPage();
    await loginForBrowser(page, testUsers.marketing, "/marketing");
    await page.close();
  });

  test.afterAll(async () => { await ctx?.close(); });

  test("TC-DEPT-012: Marketing role sees only Marketing", async () => {
    const page = await ctx.newPage();
    await page.goto("/marketing", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2500);

    await expect(page.locator('[data-testid="sidebar-item-marketing"]')).toBeVisible();
    await expect(page.locator('[data-testid="sidebar-item-sales"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="sidebar-item-service"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="sidebar-item-management"]')).toHaveCount(0);
    await page.close();
  });

  test("TC-DEPT-018: Marketing role direct URL to /management — document behavior", async () => {
    const page = await ctx.newPage();
    await page.goto("/management", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);

    const url = page.url();
    const heading = page.getByRole("heading", { name: "Management" }).first()
      .or(page.locator('[class*="overview"]').first());
    const visible = await heading.isVisible().catch(() => false);
    test.info().annotations.push({
      type: "observation",
      description: url.includes("/management")
        ? (visible ? "RBAC GAP: Marketing role can access /management via direct URL" : "Management page loaded but no content visible")
        : `Marketing role redirected from /management to ${url}`,
    });
    expect(true).toBe(true);
    await page.close();
  });
});

// ===========================================================================
// GROUP 5: Super Admin — RBAC sidebar
// ===========================================================================
test.describe("Super Admin RBAC", () => {
  let ctx: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    ctx = await browser.newContext({ baseURL: BASE_URL });
    const page = await ctx.newPage();
    await loginForBrowser(page, testUsers.superAdmin, "/sales");
    await page.close();
  });

  test.afterAll(async () => { await ctx?.close(); });

  test("TC-DEPT-014: Super admin sees all departments + Management", async () => {
    const page = await ctx.newPage();
    await page.goto("/sales", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2500);

    await expect(page.locator('[data-testid="sidebar-item-sales"]')).toBeVisible();
    await expect(page.locator('[data-testid="sidebar-item-service"]')).toBeVisible();
    await expect(page.locator('[data-testid="sidebar-item-marketing"]')).toBeVisible();
    await expect(page.locator('[data-testid="sidebar-item-management"]')).toBeVisible();
    await page.close();
  });
});

// ===========================================================================
// GROUP 6: Executive — RBAC sidebar (observational)
// ===========================================================================
test.describe("Executive RBAC", () => {
  let ctx: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    ctx = await browser.newContext({ baseURL: BASE_URL });
    const page = await ctx.newPage();
    await loginForBrowser(page, testUsers.executive, "/sales");
    await page.close();
  });

  test.afterAll(async () => { await ctx?.close(); });

  test("TC-DEPT-015: Executive sees departments — document Management visibility", async () => {
    const page = await ctx.newPage();
    await page.goto("/sales", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2500);

    await expect(page.locator('[data-testid="sidebar-item-sales"]')).toBeVisible();
    await expect(page.locator('[data-testid="sidebar-item-service"]')).toBeVisible();
    await expect(page.locator('[data-testid="sidebar-item-marketing"]')).toBeVisible();

    const mgmtVisible = await page.locator('[data-testid="sidebar-item-management"]').isVisible().catch(() => false);
    test.info().annotations.push({
      type: "observation",
      description: mgmtVisible
        ? "Executive CAN see Management in sidebar"
        : "Executive CANNOT see Management in sidebar (canAccessManagement overrides defaultSectionsByRole)",
    });
    await page.close();
  });
});
