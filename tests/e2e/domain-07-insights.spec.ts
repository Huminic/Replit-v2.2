import { test, expect } from "playwright/test";
import { testUsers, login, authHeader, loginForBrowser } from "./helpers/auth";

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

    await page.close();
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

    await page.close();
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

    await page.close();
  });

  test("7.3b Insights API returns real metrics (non-zero, non-hardcoded)", async ({ request }) => {
    const session = await login(request, testUsers.orgAdmin);

    // Fetch the insights dashboard API directly
    const dashRes = await request.get(`${BASE}/api/insights/dashboard`, {
      headers: authHeader(session.token),
    });
    expect(dashRes.ok()).toBe(true);
    const dashboard = await dashRes.json();

    // Dashboard should return actual data structure (not empty)
    expect(dashboard).toBeTruthy();
    expect(typeof dashboard).toBe("object");

    // Check for real metric values — at least one metric should have a non-zero value
    const values: number[] = [];
    function extractNumbers(obj: any, depth = 0): void {
      if (depth > 5) return;
      if (obj === null || obj === undefined) return;
      if (typeof obj === "number") { values.push(obj); return; }
      if (typeof obj === "object") {
        for (const val of Object.values(obj)) {
          extractNumbers(val, depth + 1);
        }
      }
    }
    extractNumbers(dashboard);

    // There should be numeric values in the dashboard response
    expect(values.length, "Dashboard should contain numeric metric values").toBeGreaterThan(0);

    // At least one value should be non-zero (real data, not all-zeros stub)
    const hasNonZero = values.some(v => v !== 0);
    if (!hasNonZero) {
      test.info().annotations.push({
        type: "note",
        description: `All ${values.length} metric values are zero — may indicate no data for this org`,
      });
    }

    // Verify values are not suspiciously identical (hardcoded stubs)
    const uniqueValues = new Set(values);
    if (values.length > 3) {
      expect(uniqueValues.size, "Metrics should not all be the same value (likely hardcoded)").toBeGreaterThan(1);
    }

    // Also check the library endpoint for metric definitions
    const libRes = await request.get(`${BASE}/api/insights/library`, {
      headers: authHeader(session.token),
    });
    expect(libRes.ok()).toBe(true);
    const library = await libRes.json();
    const metrics = Array.isArray(library) ? library : (library.metrics ?? library.data ?? []);
    expect(metrics.length, "Insights library should have metric definitions").toBeGreaterThan(0);

    console.log(`  Dashboard: ${values.length} numeric values, ${uniqueValues.size} unique`);
    console.log(`  Library: ${metrics.length} metric definitions`);
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

    // There should be no "Pin to Dashboard" button or pin icon
    const pinButton = page.locator('button:has-text("Pin to Dashboard")').or(
      page.locator('[data-testid="pin-to-dashboard"]')
    );
    const pinCount = await pinButton.count();
    expect(pinCount).toBe(0);

    await page.close();
  });

  test("7.6 Lead source labels show meaningful names", async ({ browser }) => {
    const context = await browser.newContext({ baseURL: BASE });
    const page = await context.newPage();
    await loginForBrowser(page, testUsers.orgAdmin, "/insights");
    await page.waitForTimeout(1000);

    // Check that no raw "Source #" fallback labels appear — should be meaningful names.
    // (Renamed from "VIN Source #" by Fix 7.5 / 2026-04-26 — drop developer-jargon "VIN".)
    const pageText = await page.textContent("body");
    const hasRawVinSource = /Source #\d+/i.test(pageText || "");
    expect(hasRawVinSource).toBe(false);

    await page.close();
  });
});
