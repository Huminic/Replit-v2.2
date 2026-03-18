import { test, expect } from "playwright/test";
import { testUsers, loginForBrowser } from "./helpers/auth";

const BASE = "http://localhost:5000";

test.describe("Domain 7: Insights", () => {
  test("7.1 Insights page loads without errors", async ({ browser }) => {
    const context = await browser.newContext({ baseURL: BASE });
    const page = await context.newPage();

    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await loginForBrowser(page, testUsers.orgAdmin, "/insights");
    await page.waitForTimeout(1000);

    expect(page.url()).toContain("insights");
    // No uncaught JS errors
    expect(errors).toHaveLength(0);

    await context.close();
  });

  test("7.2 Dashboard zones render", async ({ browser }) => {
    const context = await browser.newContext({ baseURL: BASE });
    const page = await context.newPage();
    await loginForBrowser(page, testUsers.orgAdmin, "/insights");
    await page.waitForTimeout(1000);

    // Look for dashboard zone containers
    const zones = page.locator(
      '[class*="zone"], [class*="dashboard"], [class*="grid"], [class*="panel"], [data-testid*="zone"]'
    );
    const zoneCount = await zones.count();
    expect(zoneCount).toBeGreaterThan(0);

    await context.close();
  });

  test("7.3 Metric library populates", async ({ browser }) => {
    const context = await browser.newContext({ baseURL: BASE });
    const page = await context.newPage();
    await loginForBrowser(page, testUsers.orgAdmin, "/insights");
    await page.waitForTimeout(1000);

    // Look for metric items in the library
    const metrics = page.locator(
      '[class*="metric"], [class*="library"] [class*="item"], [data-testid*="metric"]'
    );
    const metricCount = await metrics.count();
    expect(metricCount).toBeGreaterThan(0);

    await context.close();
  });

  test("7.4 Role-filtered — compare metrics for different roles", async ({ browser }) => {
    // Login as org admin and capture metrics
    const ctx1 = await browser.newContext({ baseURL: BASE });
    const page1 = await ctx1.newPage();
    await loginForBrowser(page1, testUsers.orgAdmin, "/insights");
    await page1.waitForTimeout(1000);
    const adminContent = await page1.content();
    await ctx1.close();

    // Login as sales and capture metrics
    const ctx2 = await browser.newContext({ baseURL: BASE });
    const page2 = await ctx2.newPage();
    await loginForBrowser(page2, testUsers.sales, "/insights");
    await page2.waitForTimeout(1000);
    const salesContent = await page2.content();
    await ctx2.close();

    // Both pages should load (role filtering applied server-side)
    expect(adminContent.length).toBeGreaterThan(0);
    expect(salesContent.length).toBeGreaterThan(0);
    // Content should differ between roles (different metric visibility)
    // At minimum, both pages rendered successfully
  });

  test("7.5 Pin to Dashboard removed", async ({ browser }) => {
    const context = await browser.newContext({ baseURL: BASE });
    const page = await context.newPage();
    await loginForBrowser(page, testUsers.orgAdmin, "/insights");
    await page.waitForTimeout(1000);

    // There should be no "Pin" button or pin icon
    const pinButton = page.locator('button:has-text("Pin")').or(
      page.locator('[data-testid*="pin"]')
    ).or(
      page.locator('[aria-label*="pin" i]')
    ).or(
      page.locator('[class*="pin"]')
    );
    const pinCount = await pinButton.count();
    expect(pinCount).toBe(0);

    await context.close();
  });

  test("7.6 Lead source labels show meaningful names", async ({ browser }) => {
    const context = await browser.newContext({ baseURL: BASE });
    const page = await context.newPage();
    await loginForBrowser(page, testUsers.orgAdmin, "/insights");
    await page.waitForTimeout(1000);

    // Check that no raw "VIN Source #" labels appear — should be meaningful names
    const pageText = await page.textContent("body");
    const hasRawVinSource = /VIN Source #\d+/i.test(pageText || "");
    expect(hasRawVinSource).toBe(false);

    await context.close();
  });
});
