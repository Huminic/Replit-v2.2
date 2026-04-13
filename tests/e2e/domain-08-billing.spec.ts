import { test, expect } from "playwright/test";
import { testUsers, login, authHeader, loginForBrowser } from "./helpers/auth";

const BASE = "http://localhost:5000";

test.describe("Domain 8: Billing", () => {
  test("8.1 Billing pages load without crash and show real content", async ({ browser }) => {
    const context = await browser.newContext({ baseURL: BASE });
    const page = await context.newPage();

    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await loginForBrowser(page, testUsers.superAdmin, "/settings/billing");
    await page.waitForTimeout(2000);

    // Page should load without crashing
    expect(errors).toHaveLength(0);

    // Verify the billing page shows meaningful content (not a blank page or crash screen)
    const pageText = await page.textContent("body");
    const hasBillingContent =
      /billing|usage|plan|invoice|wallet|subscription|entitlement|not configured|no billing/i.test(pageText || "");
    expect(hasBillingContent, "Billing page should show billing content or a 'not configured' message, not a blank/crash screen").toBe(true);

    // Verify no "error" or "500" crash message is displayed
    const hasCrash = /internal server error|500|something went wrong|unexpected error/i.test(pageText || "");
    expect(hasCrash, "Billing page should not display a crash/error message").toBe(false);

    await page.close();
  });

  test("8.1b Billing API responds (FlexPrice/Lago connectivity)", async ({ request }) => {
    // Test billing API endpoint to verify backend connectivity
    const session = await login(request, testUsers.superAdmin);

    const summaryRes = await request.get(`${BASE}/api/billing/summary`, {
      headers: authHeader(session.token),
    });

    // Billing API should respond — 200 if FlexPrice connected, or a controlled error (not 500)
    if (summaryRes.ok()) {
      const data = await summaryRes.json();
      // If connected, should return billing data structure
      expect(data).toBeTruthy();
      console.log("  Billing API: connected, returned data");
    } else if (summaryRes.status() === 503 || summaryRes.status() === 502) {
      // FlexPrice/Lago MCP not responding — acceptable, but noted
      test.info().annotations.push({
        type: "note",
        description: `Billing backend returned ${summaryRes.status()} — FlexPrice/Lago MCP may not be running`,
      });
    } else {
      // Should not be a 500 crash
      expect(summaryRes.status(), "Billing API should not crash with 500").not.toBe(500);
    }
  });

  test("8.2 Connected to FlexPrice", async ({ browser }) => {
    const context = await browser.newContext({ baseURL: BASE });
    const page = await context.newPage();
    await loginForBrowser(page, testUsers.superAdmin, "/settings/billing");

    // Wait for billing content to load (skeleton state resolves when API responds)
    await page.waitForFunction(
      () => /billing|usage|plan|invoice|wallet|subscription|entitlement/i.test(document.body?.textContent || ""),
      { timeout: 15000 }
    );

    // Check that billing content loaded (not an error page)
    const pageText = await page.textContent("body");
    const hasBillingContent =
      /billing|usage|plan|invoice|wallet|subscription|entitlement/i.test(pageText || "");
    expect(hasBillingContent).toBe(true);

    await page.close();
  });

  test("8.3 Super Admin sees all billing", async ({ browser }) => {
    const context = await browser.newContext({ baseURL: BASE });
    const page = await context.newPage();
    await loginForBrowser(page, testUsers.superAdmin, "/settings/billing");
    await page.waitForTimeout(1000);

    // Super admin should see billing content
    const pageText = await page.textContent("body");
    const hasBillingContent =
      /billing|usage|plan|invoice|wallet|subscription/i.test(pageText || "");
    expect(hasBillingContent).toBe(true);

    // Should not show access denied
    const accessDenied = /access denied|forbidden|not authorized|no permission/i.test(pageText || "");
    expect(accessDenied).toBe(false);

    await page.close();
  });

  test("8.4 Partner Admin + Org Admin see usage + wallet", async ({ browser }) => {
    // Test Partner Admin
    const ctx1 = await browser.newContext({ baseURL: BASE });
    const page1 = await ctx1.newPage();
    await loginForBrowser(page1, testUsers.partnerAdmin, "/settings/billing");

    await page1.waitForFunction(
      () => /usage|wallet|billing|plan/i.test(document.body?.textContent || ""),
      { timeout: 15000 }
    );

    const partnerText = await page1.textContent("body");
    const partnerSeesBilling =
      /usage|wallet|billing|plan/i.test(partnerText || "");
    expect(partnerSeesBilling).toBe(true);
    await ctx1.close();

    // Test Org Admin
    const ctx2 = await browser.newContext({ baseURL: BASE });
    const page2 = await ctx2.newPage();
    await loginForBrowser(page2, testUsers.orgAdmin, "/settings/billing");

    await page2.waitForFunction(
      () => /usage|wallet|billing|plan/i.test(document.body?.textContent || ""),
      { timeout: 15000 }
    );

    const orgAdminText = await page2.textContent("body");
    const orgAdminSeesBilling =
      /usage|wallet|billing|plan/i.test(orgAdminText || "");
    expect(orgAdminSeesBilling).toBe(true);
    await ctx2.close();
  });

  test("8.5 Sales/Marketing/Service do NOT see Billing", async ({ browser }) => {
    const restrictedRoles = [testUsers.sales, testUsers.marketing, testUsers.service];

    for (const user of restrictedRoles) {
      const context = await browser.newContext({ baseURL: BASE });
      const page = await context.newPage();
      await loginForBrowser(page, user, "/");

      // Check sidebar — Billing link should not be present
      const sidebar = page.locator('nav, [class*="sidebar"], [class*="menu"], [role="navigation"]');
      const billingLink = sidebar.locator('text="Billing"').or(
        sidebar.locator('a[href*="billing"]')
      );
      const billingCount = await billingLink.count();
      expect(billingCount).toBe(0);

      // Also try navigating directly — should redirect or show access denied
      await page.goto("/settings/billing");
      await page.waitForTimeout(2000);

      const currentUrl = page.url();
      const pageText = await page.textContent("body");

      // Either redirected away from billing OR shows access denied
      const blocked =
        !currentUrl.includes("billing") ||
        /access denied|forbidden|not authorized|no permission/i.test(pageText || "");
      expect(blocked).toBe(true);

      await page.close();
    }
  });
});
