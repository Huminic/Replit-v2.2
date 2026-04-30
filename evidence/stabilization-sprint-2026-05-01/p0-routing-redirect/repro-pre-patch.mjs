/**
 * P0 — I-NEW-2026-05-01-A: Repro of routing-redirect trap.
 *
 * Walks the 5 affected routes as serra_honda@huminic.ai (org_admin):
 *   /teambox, /sales, /insights, /marketing, /management
 * Plus deep-link: /marketing?tab=agents
 *
 * For each route:
 *   - navigate
 *   - poll URL every 500ms for 30s
 *   - record every URL change and timestamp
 *   - capture screenshot at start + end
 *   - capture console messages
 *
 * Outcome: a JSON record per route showing whether the URL was stable for
 * 30s. PASS = no change. FAIL = a redirect occurred.
 *
 * Run with: BASE=http://localhost:5000 node evidence/stabilization-sprint-2026-05-01/p0-routing-redirect/repro-pre-patch.mjs
 */

import { chromium } from 'playwright';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = process.env.BASE || 'http://localhost:5000';
const EMAIL = process.env.LOGIN_EMAIL || 'serra_honda@huminic.ai';
const PASSWORD = process.env.LOGIN_PASSWORD || 'NexxusTest2026';
const HOLD_SECONDS = Number(process.env.HOLD_SECONDS || 30);
const POLL_MS = 500;

const ROUTES = [
  { name: 'teambox', path: '/teambox' },
  { name: 'sales', path: '/sales' },
  { name: 'insights', path: '/insights' },
  { name: 'marketing', path: '/marketing' },
  { name: 'management', path: '/management' },
  { name: 'marketing-deeplink-agents', path: '/marketing?tab=agents' },
];

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
  // give SPA + AppContext role hydration a beat to settle
  await sleep(1500);
}

async function walkRoute(page, route) {
  const observations = [];
  const startUrl = `${BASE}${route.path}`;
  const startTs = Date.now();

  // record every URL change for the duration of the hold
  const onFrameNavigated = (frame) => {
    if (frame === page.mainFrame()) {
      observations.push({ tMs: Date.now() - startTs, url: frame.url(), reason: 'framenavigated' });
    }
  };
  page.on('framenavigated', onFrameNavigated);

  await page.goto(startUrl, { waitUntil: 'commit' });
  observations.push({ tMs: Date.now() - startTs, url: page.url(), reason: 'goto-commit' });

  await page.screenshot({ path: `${OUT}/pre-${route.name}-t0.png`, fullPage: false }).catch(() => {});

  // hold for HOLD_SECONDS
  const deadline = startTs + HOLD_SECONDS * 1000;
  let lastSeen = page.url();
  while (Date.now() < deadline) {
    await sleep(POLL_MS);
    const cur = page.url();
    if (cur !== lastSeen) {
      observations.push({ tMs: Date.now() - startTs, url: cur, reason: 'poll-change' });
      lastSeen = cur;
    }
  }

  await page.screenshot({ path: `${OUT}/pre-${route.name}-t30.png`, fullPage: false }).catch(() => {});
  page.off('framenavigated', onFrameNavigated);

  const finalUrl = page.url();
  const startedAt = startUrl.replace(BASE, '');
  const endedAtPath = new URL(finalUrl).pathname + new URL(finalUrl).search;
  const stable = endedAtPath === startedAt || endedAtPath === startedAt.replace(/\?.*/, '');

  return {
    route: route.name,
    requested: route.path,
    finalUrl: endedAtPath,
    holdSeconds: HOLD_SECONDS,
    stable,
    observations,
  };
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  const consoleMessages = [];
  page.on('console', (msg) => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
  });
  page.on('pageerror', (err) => {
    consoleMessages.push({ type: 'pageerror', text: err.message });
  });

  console.log(`[repro] login as ${EMAIL}`);
  await login(page);
  console.log(`[repro] post-login URL: ${page.url()}`);

  const results = [];
  for (const r of ROUTES) {
    console.log(`[repro] walking ${r.path} (hold ${HOLD_SECONDS}s)`);
    const res = await walkRoute(page, r);
    console.log(`[repro]   stable=${res.stable} final=${res.finalUrl} obs=${res.observations.length}`);
    results.push(res);
  }

  const summary = {
    base: BASE,
    email: EMAIL,
    holdSeconds: HOLD_SECONDS,
    timestamp: new Date().toISOString(),
    results,
    consoleErrorCount: consoleMessages.filter((m) => m.type === 'error' || m.type === 'pageerror').length,
    consoleSamples: consoleMessages.slice(0, 50),
  };

  writeFileSync(`${OUT}/repro-pre-patch-result.json`, JSON.stringify(summary, null, 2));
  const passed = results.filter((r) => r.stable).length;
  const failed = results.filter((r) => !r.stable).length;
  console.log(`\n[repro] summary: ${passed}/${results.length} routes stable for ${HOLD_SECONDS}s`);
  for (const r of results) {
    console.log(`  ${r.stable ? 'STABLE' : 'REDIRECT'}  ${r.requested.padEnd(35)} -> ${r.finalUrl}`);
  }

  await browser.close();
  process.exit(failed > 0 ? 0 : 0); // never fail process — JSON has the truth
})().catch((err) => {
  console.error('[repro] FATAL', err);
  process.exit(2);
});
