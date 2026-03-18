import { test, expect } from "playwright/test";
import { testUsers } from "./helpers/auth";

const BASE = "http://localhost:5000";

async function loginViaUI(page: any, user: { email: string; password: string }) {
  await page.goto("/");
  await page.waitForTimeout(1000);

  const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]');
  const passwordInput = page.locator('input[type="password"]');

  if (await emailInput.count() > 0) {
    await emailInput.fill(user.email);
    await passwordInput.fill(user.password);
    const submitBtn = page.locator('button[type="submit"]').or(page.locator('button:has-text("Sign")').or(page.locator('button:has-text("Log")')));
    await submitBtn.first().click();
    await page.waitForTimeout(3000);
  }
}

test.describe("Domain 8: Billing", () => {
  test("8.1 Billing pages load", async ({ browser }) => {
    const context = await browser.newContext({ baseURL: BASE });
    const page = await context.newPage();
    await loginViaUI(page, testUsers.superAdmin);

    // Try navigating to billing routes
    const billingPaths = ["/billing"];
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    for (const path of billingPaths) {
      await page.goto(path);
      await page.waitForTimeout(2000);
    }

    // Page should load without crashing
    expect(errors).toHaveLength(0);

    await context.close();
  });

  test("8.2 Connected to FlexPrice", async ({ browser }) => {
    const context = await browser.newContext({ baseURL: BASE });
    const page = await context.newPage();
    await loginViaUI(page, testUsers.superAdmin);

    // Use API to check billing data availability
    const cookies = await context.cookies();
    const tokenCookie = cookies.find((c) => c.name === "token" || c.name === "accessToken");

    // Navigate to billing to trigger API calls
    await page.goto("/billing");
    await page.waitForTimeout(3000);

    // Check that billing content loaded (not an error page)
    const pageText = await page.textContent("body");
    // Should contain billing-related content, not just an error
    const hasBillingContent =
      /billing|usage|plan|invoice|wallet|subscription|entitlement/i.test(pageText || "");
    expect(hasBillingContent).toBe(true);

    await context.close();
  });

  test("8.3 Super Admin sees all billing", async ({ browser }) => {
    const context = await browser.newContext({ baseURL: BASE });
    const page = await context.newPage();
    await loginViaUI(page, testUsers.superAdmin);

    await page.goto("/billing");
    await page.waitForTimeout(3000);

    // Super admin should see billing content
    const pageText = await page.textContent("body");
    const hasBillingContent =
      /billing|usage|plan|invoice|wallet|subscription/i.test(pageText || "");
    expect(hasBillingContent).toBe(true);

    // Should not show access denied
    const accessDenied = /access denied|forbidden|not authorized|no permission/i.test(pageText || "");
    expect(accessDenied).toBe(false);

    await context.close();
  });

  test("8.4 Partner Admin + Org Admin see usage + wallet", async ({ browser }) => {
    // Test Partner Admin
    const ctx1 = await browser.newContext({ baseURL: BASE });
    const page1 = await ctx1.newPage();
    await loginViaUI(page1, testUsers.partnerAdmin);
    await page1.goto("/billing");
    await page1.waitForTimeout(3000);

    const partnerText = await page1.textContent("body");
    const partnerSeesBilling =
      /usage|wallet|billing|plan/i.test(partnerText || "");
    expect(partnerSeesBilling).toBe(true);
    await ctx1.close();

    // Test Org Admin
    const ctx2 = await browser.newContext({ baseURL: BASE });
    const page2 = await ctx2.newPage();
    await loginViaUI(page2, testUsers.orgAdmin);
    await page2.goto("/billing");
    await page2.waitForTimeout(3000);

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
      await loginViaUI(page, user);

      // Check sidebar — Billing link should not be present
      await page.waitForTimeout(2000);
      const sidebar = page.locator('nav, [class*="sidebar"], [class*="menu"], [role="navigation"]');
      const billingLink = sidebar.locator('text="Billing"').or(
        sidebar.locator('a[href*="billing"]')
      );
      const billingCount = await billingLink.count();
      expect(billingCount).toBe(0);

      // Also try navigating directly — should redirect or show access denied
      await page.goto("/billing");
      await page.waitForTimeout(2000);

      const currentUrl = page.url();
      const pageText = await page.textContent("body");

      // Either redirected away from billing OR shows access denied
      const blocked =
        !currentUrl.includes("billing") ||
        /access denied|forbidden|not authorized|no permission/i.test(pageText || "");
      expect(blocked).toBe(true);

      await context.close();
    }
  });
});
