import { test, expect } from "playwright/test";
import { testUsers } from "./helpers/auth";

const BASE = "http://localhost:5000";

async function loginViaUI(page: any, user: { email: string; password: string }) {
  await page.goto("/");
  await page.waitForTimeout(1000);

  // Fill login form
  const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]');
  const passwordInput = page.locator('input[type="password"]');

  if (await emailInput.count() > 0) {
    await emailInput.fill(user.email);
    await passwordInput.fill(user.password);
    const submitBtn = page.locator('button[type="submit"]').or(page.locator('button:has-text("Sign")').or(page.locator('button:has-text("Log")')));
    await submitBtn.first().click();
    await page.waitForURL(/.*(?<!login)$/, { timeout: 30000 });
    await page.waitForTimeout(2000);
  }
}

test.describe("Domain 6: Department Pages", () => {
  test("6.1 Sales page loads with KPIs", async ({ browser }) => {
    const context = await browser.newContext({ baseURL: BASE });
    const page = await context.newPage();
    await loginViaUI(page, testUsers.sales);

    await page.goto("/sales");
    await page.waitForTimeout(3000);

    // Page should load without error
    expect(page.url()).toContain("sales");

    // Look for KPI tiles or dashboard content
    const tiles = page.locator('[class*="tile"], [class*="kpi"], [class*="card"], [class*="metric"], [class*="stat"]');
    const tileCount = await tiles.count();
    // KPI tiles should render
    expect(tileCount).toBeGreaterThan(0);

    await context.close();
  });

  test("6.2 Service page loads with KPIs and campaigns", async ({ browser }) => {
    const context = await browser.newContext({ baseURL: BASE });
    const page = await context.newPage();
    await loginViaUI(page, testUsers.service);

    await page.goto("/service");
    await page.waitForTimeout(3000);

    expect(page.url()).toContain("service");

    const tiles = page.locator('[class*="tile"], [class*="kpi"], [class*="card"], [class*="metric"], [class*="stat"]');
    const tileCount = await tiles.count();
    expect(tileCount).toBeGreaterThan(0);

    await context.close();
  });

  test("6.3 Marketing page loads with KPIs", async ({ browser }) => {
    const context = await browser.newContext({ baseURL: BASE });
    const page = await context.newPage();
    await loginViaUI(page, testUsers.marketing);

    await page.goto("/marketing");
    await page.waitForTimeout(3000);

    expect(page.url()).toContain("marketing");

    const tiles = page.locator('[class*="tile"], [class*="kpi"], [class*="card"], [class*="metric"], [class*="stat"]');
    const tileCount = await tiles.count();
    expect(tileCount).toBeGreaterThan(0);

    await context.close();
  });

  test("6.4 Management page loads with executive overview", async ({ browser }) => {
    const context = await browser.newContext({ baseURL: BASE });
    const page = await context.newPage();
    await loginViaUI(page, testUsers.executive);

    await page.goto("/management");
    await page.waitForTimeout(3000);

    expect(page.url()).toContain("management");

    // Executive overview should have tiles/cards
    const tiles = page.locator('[class*="tile"], [class*="kpi"], [class*="card"], [class*="metric"], [class*="stat"], [class*="overview"]');
    const tileCount = await tiles.count();
    expect(tileCount).toBeGreaterThan(0);

    await context.close();
  });

  test("6.5 Demand Score tile visible on Management", async ({ browser }) => {
    const context = await browser.newContext({ baseURL: BASE });
    const page = await context.newPage();
    await loginViaUI(page, testUsers.executive);

    await page.goto("/management");
    await page.waitForTimeout(3000);

    // Look for Demand Score tile
    const demandScore = page.locator('text="Demand Score"').or(
      page.locator('text="demand score"')
    ).or(
      page.locator('[data-testid*="demand"]')
    ).or(
      page.locator(':has-text("Demand Score")')
    );
    const found = await demandScore.first().count();
    expect(found).toBeGreaterThan(0);

    await context.close();
  });

  test("6.6 Sales sidebar does NOT show Billing", async ({ browser }) => {
    const context = await browser.newContext({ baseURL: BASE });
    const page = await context.newPage();
    await loginViaUI(page, testUsers.sales);

    await page.waitForTimeout(2000);

    // Check sidebar for absence of Billing
    const sidebar = page.locator('nav, [class*="sidebar"], [class*="menu"], [role="navigation"]');
    const billingLink = sidebar.locator('text="Billing"').or(
      sidebar.locator('a[href*="billing"]')
    );
    const billingCount = await billingLink.count();
    expect(billingCount).toBe(0);

    await context.close();
  });

  test("6.7 Sales submenu shows 3 agents below separator", async ({ browser }) => {
    const context = await browser.newContext({ baseURL: BASE });
    const page = await context.newPage();
    await loginViaUI(page, testUsers.sales);

    await page.goto("/sales");
    await page.waitForTimeout(3000);

    // Look for sidebar/submenu items related to agents
    const sidebar = page.locator('nav, [class*="sidebar"], [class*="menu"], [role="navigation"]');
    const agentItems = sidebar.locator('[class*="agent"], a[href*="agent"]').or(sidebar.getByText(/agent/i));
    const agentCount = await agentItems.count();
    // Should find at least 3 agent menu items
    expect(agentCount).toBeGreaterThanOrEqual(3);

    await context.close();
  });

  test("6.8 Service submenu shows at least 1 agent", async ({ browser }) => {
    const context = await browser.newContext({ baseURL: BASE });
    const page = await context.newPage();
    await loginViaUI(page, testUsers.service);

    await page.goto("/service");
    await page.waitForTimeout(3000);

    const sidebar = page.locator('nav, [class*="sidebar"], [class*="menu"], [role="navigation"]');
    const agentItems = sidebar.locator('[class*="agent"], a[href*="agent"]').or(sidebar.getByText(/agent/i));
    const agentCount = await agentItems.count();
    expect(agentCount).toBeGreaterThanOrEqual(1);

    await context.close();
  });
});
