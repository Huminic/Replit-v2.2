/**
 * P0 — I-NEW-2026-05-01-A: click-through repro.
 *
 * Operator's hypothesis: clicking a sidebar icon opens the SubMenuManager
 * flyout AND a click registers on a panel nav item beneath the cursor.
 *
 * Steps:
 *   1. Login.
 *   2. From /, hover over the Sales sidebar icon (no click) — should open the panel.
 *   3. Click the Sales sidebar icon.
 *   4. Observe whether mid-flight URL ends up at the panel's first item
 *      (e.g. /sales?tab=agents or /sales?tab=insights) instead of /sales.
 *
 * Also: from /teambox, hover over the Marketing sidebar icon and observe
 * whether the marketing panel pops up over the teambox content and the next
 * click goes to /marketing?tab=studio instead of /teambox.
 */

import { chromium } from 'playwright';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = process.env.BASE || 'http://localhost:5000';
const EMAIL = process.env.LOGIN_EMAIL || 'serra_honda@huminic.ai';
const PASSWORD = process.env.LOGIN_PASSWORD || 'NexxusTest2026';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = __dirname;
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 15000 });
  await sleep(1500);
}

async function recordUrls(page, label, fn) {
  const events = [];
  const start = Date.now();
  const onNav = (frame) => {
    if (frame === page.mainFrame()) {
      events.push({ tMs: Date.now() - start, url: frame.url() });
    }
  };
  page.on('framenavigated', onNav);
  await fn();
  // wait a beat for any post-click effects
  await sleep(2000);
  page.off('framenavigated', onNav);
  return { label, events, finalUrl: page.url() };
}

async function clickSidebarItem(page, testid) {
  const sel = `[data-testid="${testid}"]`;
  await page.waitForSelector(sel, { state: 'visible', timeout: 5000 });
  // hover first to mimic real user, then click
  await page.hover(sel);
  await sleep(200);
  await page.click(sel);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  await login(page);
  console.log('post-login:', page.url());

  const records = [];

  // Scenario A: from /, click Sales sidebar
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await sleep(800);
  records.push(await recordUrls(page, 'click-Sales-from-root', async () => {
    await clickSidebarItem(page, 'sidebar-item-sales');
  }));
  console.log('A:', records.at(-1));

  // Scenario B: from /teambox, click Marketing sidebar
  await page.goto(`${BASE}/teambox`, { waitUntil: 'networkidle' });
  await sleep(800);
  records.push(await recordUrls(page, 'click-Marketing-from-teambox', async () => {
    await clickSidebarItem(page, 'sidebar-item-marketing');
  }));
  console.log('B:', records.at(-1));

  // Scenario C: from /, click Insights sidebar
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await sleep(800);
  records.push(await recordUrls(page, 'click-Insights-from-root', async () => {
    await clickSidebarItem(page, 'sidebar-item-insights');
  }));
  console.log('C:', records.at(-1));

  // Scenario D: hover Sales, then move down through panel area without clicking
  await page.goto(`${BASE}/teambox`, { waitUntil: 'networkidle' });
  await sleep(800);
  records.push(await recordUrls(page, 'hover-Sales-then-mouse-down', async () => {
    await page.hover('[data-testid="sidebar-item-sales"]');
    await sleep(400);
    // move slowly down through the panel
    for (let y = 200; y < 600; y += 40) {
      await page.mouse.move(180, y);
      await sleep(80);
    }
  }));
  console.log('D:', records.at(-1));

  // Scenario E: hover Sales then click in the panel area
  await page.goto(`${BASE}/teambox`, { waitUntil: 'networkidle' });
  await sleep(800);
  records.push(await recordUrls(page, 'hover-Sales-then-click-panel', async () => {
    await page.hover('[data-testid="sidebar-item-sales"]');
    await sleep(500);
    // click on a likely panel-link location (within the 280px panel zone)
    await page.mouse.click(180, 240);
  }));
  console.log('E:', records.at(-1));

  writeFileSync(
    `${OUT}/repro-clickthrough-pre-patch-result.json`,
    JSON.stringify({ base: BASE, email: EMAIL, timestamp: new Date().toISOString(), records }, null, 2)
  );

  await browser.close();
  process.exit(0);
})().catch((err) => {
  console.error('FATAL', err);
  process.exit(2);
});
