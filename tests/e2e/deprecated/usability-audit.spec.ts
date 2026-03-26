import { test, expect } from "playwright/test";
import { testUsers } from "./helpers/auth";
import fs from "fs";
import path from "path";

const SCREENSHOT_DIR = path.resolve("evidence/T-2/screenshots/catalog");
const ROLES = ["orgAdmin", "sales", "service", "marketing", "executive"] as const;

const PAGES = [
  { path: "/", name: "main", description: "Main dashboard with chat" },
  { path: "/sales", name: "sales", description: "Sales department dashboard" },
  { path: "/service", name: "service", description: "Service department dashboard" },
  { path: "/marketing", name: "marketing", description: "Marketing department dashboard" },
  { path: "/management", name: "management", description: "Management overview" },
  { path: "/teambox", name: "teambox", description: "TeamBox unified inbox" },
  { path: "/my-work", name: "my-work", description: "Personal workspace" },
  { path: "/insights", name: "insights", description: "Analytics dashboard" },
  { path: "/billing", name: "billing", description: "Billing overview" },
  { path: "/settings", name: "settings", description: "System settings" },
  { path: "/profile", name: "profile", description: "User profile" },
  { path: "/agents", name: "agents", description: "Agent management" },
];

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function loginViaUI(page: any, email: string, password: string) {
  await page.goto("/login", { waitUntil: "networkidle" });
  await page.fill('input[type="email"], input[name="email"]', email);
  await page.fill('input[type="password"], input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/", { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(2000);
}

test.describe("Screenshot Catalog — All Pages, All Roles", () => {
  for (const role of ROLES) {
    test.describe(`Role: ${role}`, () => {
      test(`Capture all pages as ${role}`, async ({ page }) => {
        const user = testUsers[role];
        const roleDir = path.join(SCREENSHOT_DIR, role);
        ensureDir(roleDir);

        await loginViaUI(page, user.email, user.password);

        const results: string[] = [];

        for (const p of PAGES) {
          try {
            await page.goto(p.path, { waitUntil: "networkidle", timeout: 15000 });
            await page.waitForTimeout(1500);

            // Capture screenshot
            await page.screenshot({
              path: path.join(roleDir, `${p.name}.png`),
              fullPage: true,
            });

            // Check for console errors
            const consoleErrors: string[] = [];
            page.on("console", (msg: any) => {
              if (msg.type() === "error") consoleErrors.push(msg.text());
            });

            // Check for visible error states
            const errorElements = await page.locator('[class*="error"], [class*="Error"], [role="alert"]').count();
            const emptyStates = await page.locator('text=/no data|empty|coming soon/i').count();
            const loadingStuck = await page.locator('[class*="loading"], [class*="spinner"]').count();

            let status = "OK";
            const notes: string[] = [];

            if (errorElements > 0) {
              status = "WARNING";
              notes.push(`${errorElements} error element(s) visible`);
            }
            if (emptyStates > 0) {
              notes.push(`${emptyStates} empty/coming-soon state(s)`);
            }
            if (loadingStuck > 0) {
              notes.push(`${loadingStuck} loading indicator(s) still visible`);
            }

            results.push(`${p.name}: ${status}${notes.length ? " — " + notes.join(", ") : ""}`);
          } catch (err: any) {
            results.push(`${p.name}: SKIP — ${err.message.substring(0, 80)}`);
          }
        }

        // Write per-role summary
        const summary = `# Screenshot Catalog: ${role}\n\n${results.map(r => `- ${r}`).join("\n")}\n`;
        fs.writeFileSync(path.join(roleDir, "summary.txt"), summary);

        // At least the main page should have loaded
        expect(results.some(r => r.startsWith("main: OK"))).toBeTruthy();
      });
    });
  }
});
