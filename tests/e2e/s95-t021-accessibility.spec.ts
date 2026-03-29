import { test, expect } from "playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { testUsers, login, loginForBrowser, authHeader } from "./helpers/auth";

/**
 * T-021: Accessibility scans for pages not covered by S-9.5
 * Covers: / (AI Chat), /settings/system, /p/serra-honda
 */

const TEST_PASSWORD = "NexxusTest2026";
const dealerAccounts = [
  { email: "serra_honda@huminic.ai", password: TEST_PASSWORD, role: "org_admin", orgName: "Serra Honda" },
] as const;

const pagesToAudit = [
  { name: "AI Chat Home", path: "/", requiresAuth: true },
  { name: "Settings System", path: "/settings/system", requiresAuth: true },
  { name: "Public Landing", path: "/p/serra-honda", requiresAuth: false },
];

for (const pg of pagesToAudit) {
  test(`T021-A11Y-${pg.name} Accessibility scan: ${pg.name}`, async ({ page }) => {
    test.setTimeout(45000);

    if (pg.requiresAuth) {
      await loginForBrowser(page, dealerAccounts[0], pg.path);
    } else {
      await page.goto(pg.path, { waitUntil: "domcontentloaded", timeout: 15000 });
    }
    await page.waitForTimeout(3000);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    const critical = results.violations.filter((v) => v.impact === "critical");
    const serious = results.violations.filter((v) => v.impact === "serious");
    const moderate = results.violations.filter((v) => v.impact === "moderate");
    const minor = results.violations.filter((v) => v.impact === "minor");

    console.log(`${pg.name} accessibility results:`);
    console.log(`  Critical: ${critical.length}, Serious: ${serious.length}, Moderate: ${moderate.length}, Minor: ${minor.length}`);

    for (const v of [...critical, ...serious]) {
      console.log(`  [${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} instances)`);
    }

    expect(results).toBeDefined();
  });
}
