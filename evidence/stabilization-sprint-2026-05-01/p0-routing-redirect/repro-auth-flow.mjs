/**
 * Auth-flow sanity check after the I-NEW-2026-05-01-A fix.
 *
 * Verifies:
 *   - login → land on /
 *   - direct /management as super_admin → stable on /management (post-patch)
 *   - logout → bounce to /login
 *   - direct /management while logged out → bounce to /login (still works)
 */

import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = process.env.BASE || 'http://localhost:5000';
const PASSWORD = process.env.LOGIN_PASSWORD || 'NexxusTest2026';
const __dirname = dirname(fileURLToPath(import.meta.url));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  const evidence = [];

  // 1. login as super_admin
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'duane.wells@huminic.ai');
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 15000 });
  await sleep(1500);
  evidence.push({ step: 'login-as-super_admin', url: page.url() });

  // 2. /management as super_admin should be stable
  await page.goto(`${BASE}/management`, { waitUntil: 'commit' });
  await sleep(3000);
  evidence.push({ step: 'super_admin-on-management-after-3s', url: page.url() });

  // 3. logout via the sidebar logout button
  const logoutSel = '[data-testid="button-logout"]';
  await page.waitForSelector(logoutSel, { state: 'visible', timeout: 5000 });
  await page.click(logoutSel);
  // Logout uses window.location.href = '/login' — wait for that nav
  await page.waitForURL((u) => u.pathname.startsWith('/login'), { timeout: 10000 });
  await sleep(800);
  evidence.push({ step: 'after-logout', url: page.url() });

  // 4. while logged out, hit /management — ProtectedRoute should bounce to /login
  await page.goto(`${BASE}/management`, { waitUntil: 'commit' });
  await sleep(2500);
  evidence.push({ step: 'unauth-direct-management', url: page.url() });

  // 5. login as org_admin and verify /management still RBAC-redirects to /
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'serra_honda@huminic.ai');
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 15000 });
  await sleep(1500);
  await page.goto(`${BASE}/management`, { waitUntil: 'commit' });
  await sleep(3000);
  evidence.push({ step: 'org_admin-on-management-after-3s', url: page.url() });

  // 6. org_admin on /sales should still be stable
  await page.goto(`${BASE}/sales`, { waitUntil: 'commit' });
  await sleep(3000);
  evidence.push({ step: 'org_admin-on-sales-after-3s', url: page.url() });

  writeFileSync(
    `${__dirname}/repro-auth-flow-result.json`,
    JSON.stringify({ base: BASE, timestamp: new Date().toISOString(), evidence }, null, 2)
  );

  console.log('\n[auth-flow] verification:');
  for (const e of evidence) {
    console.log(`  ${e.step.padEnd(45)} -> ${e.url}`);
  }

  await browser.close();
})().catch((err) => {
  console.error('FATAL', err);
  process.exit(2);
});
