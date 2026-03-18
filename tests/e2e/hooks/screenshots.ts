import { test as base, type Page } from "playwright/test";
import path from "path";
import fs from "fs";

const SCREENSHOT_DIR = path.resolve("evidence/T-2/screenshots");

// Ensure screenshot directories exist
function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Sanitize filename
function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").substring(0, 100);
}

/**
 * Extended test fixture that captures a screenshot after each browser test.
 * Screenshots are saved to evidence/T-2/screenshots/{domain}/{test-name}.png
 */
export const test = base.extend<{ screenshotPage: Page }>({
  screenshotPage: async ({ page }, use, testInfo) => {
    await use(page);

    // After test completes, capture screenshot
    const domain = testInfo.titlePath[0] || "unknown";
    const testName = testInfo.titlePath[testInfo.titlePath.length - 1] || "test";
    const domainDir = path.join(SCREENSHOT_DIR, sanitize(domain));
    ensureDir(domainDir);

    const screenshotPath = path.join(domainDir, `${sanitize(testName)}.png`);
    try {
      await page.screenshot({ path: screenshotPath, fullPage: true });
    } catch {
      // Page may be closed or navigated away — skip silently
    }
  },
});

export { expect } from "playwright/test";

/**
 * Capture a full screenshot catalog by navigating through all pages as a given role.
 * Called independently, not as part of the regular test suite.
 */
export async function captureScreenshotCatalog(
  page: Page,
  role: string,
  baseURL: string
) {
  const pages = [
    { path: "/", name: "main" },
    { path: "/sales", name: "sales" },
    { path: "/service", name: "service" },
    { path: "/marketing", name: "marketing" },
    { path: "/management", name: "management" },
    { path: "/teambox", name: "teambox" },
    { path: "/my-work", name: "my-work" },
    { path: "/insights", name: "insights" },
    { path: "/billing", name: "billing-dashboard" },
    { path: "/billing/usage", name: "billing-usage" },
    { path: "/billing/plan", name: "billing-plan" },
    { path: "/billing/invoices", name: "billing-invoices" },
    { path: "/settings", name: "settings" },
    { path: "/profile", name: "profile" },
    { path: "/agents", name: "agents" },
  ];

  const roleDir = path.join(SCREENSHOT_DIR, "catalog", sanitize(role));
  ensureDir(roleDir);

  for (const p of pages) {
    try {
      await page.goto(`${baseURL}${p.path}`, { waitUntil: "networkidle", timeout: 15000 });
      await page.waitForTimeout(1000); // Let animations settle
      await page.screenshot({
        path: path.join(roleDir, `${p.name}.png`),
        fullPage: true,
      });
    } catch {
      // Some pages may redirect or require different roles — skip
    }
  }
}
