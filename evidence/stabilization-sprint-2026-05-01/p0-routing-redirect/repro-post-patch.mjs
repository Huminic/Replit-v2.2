/**
 * P0 — I-NEW-2026-05-01-A: post-patch verification of routing-redirect trap.
 *
 * Walks the 5 affected routes for both super_admin AND org_admin, holds 30s
 * each, records any URL change, takes start+end screenshots.
 *
 * Expected after patch (1-line guard in client/src/contexts/AppContext.tsx):
 *   - super_admin (duane.wells@huminic.ai):
 *       /teambox, /sales, /insights, /marketing, /management, /marketing?tab=agents → all stable
 *   - org_admin (serra_honda@huminic.ai):
 *       /teambox, /sales, /insights, /marketing → stable
 *       /management → INTENTIONAL redirect to / (RBAC, design-correct)
 *       /marketing?tab=agents → stable
 *
 * Run with: BASE=http://localhost:5000 node evidence/stabilization-sprint-2026-05-01/p0-routing-redirect/repro-post-patch.mjs
 */

import { chromium } from 'playwright';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = process.env.BASE || 'http://localhost:5000';
const PASSWORD = process.env.LOGIN_PASSWORD || 'NexxusTest2026';
const HOLD_SECONDS = Number(process.env.HOLD_SECONDS || 30);

const ACCOUNTS = [
  { label: 'super_admin', email: 'duane.wells@huminic.ai' },
  { label: 'org_admin', email: 'serra_honda@huminic.ai' },
];

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

async function login(page, email) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 15000 });
  await sleep(1500);
}

async function walkRoute(page, route, accountLabel) {
  const observations = [];
  const startUrl = `${BASE}${route.path}`;
  const startTs = Date.now();

  const onFrameNavigated = (frame) => {
    if (frame === page.mainFrame()) {
      observations.push({ tMs: Date.now() - startTs, url: frame.url(), reason: 'framenavigated' });
    }
  };
  page.on('framenavigated', onFrameNavigated);

  await page.goto(startUrl, { waitUntil: 'commit' });
  observations.push({ tMs: Date.now() - startTs, url: page.url(), reason: 'goto-commit' });

  await page.screenshot({ path: `${OUT}/post-${accountLabel}-${route.name}-t0.png`, fullPage: false }).catch(() => {});

  const deadline = startTs + HOLD_SECONDS * 1000;
  let lastSeen = page.url();
  while (Date.now() < deadline) {
    await sleep(500);
    const cur = page.url();
    if (cur !== lastSeen) {
      observations.push({ tMs: Date.now() - startTs, url: cur, reason: 'poll-change' });
      lastSeen = cur;
    }
  }

  await page.screenshot({ path: `${OUT}/post-${accountLabel}-${route.name}-t30.png`, fullPage: false }).catch(() => {});
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
  const allResults = [];
  for (const acct of ACCOUNTS) {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();
    console.log(`\n[repro-post] ====== ${acct.label} (${acct.email}) ======`);
    await login(page, acct.email);
    const results = [];
    for (const r of ROUTES) {
      console.log(`[repro-post]   walking ${r.path}`);
      const res = await walkRoute(page, r, acct.label);
      results.push(res);
      console.log(`[repro-post]     stable=${res.stable} final=${res.finalUrl} obs=${res.observations.length}`);
    }
    allResults.push({ account: acct.label, email: acct.email, results });
    await browser.close();
  }

  writeFileSync(
    `${OUT}/repro-post-patch-result.json`,
    JSON.stringify({ base: BASE, holdSeconds: HOLD_SECONDS, timestamp: new Date().toISOString(), accounts: allResults }, null, 2)
  );

  console.log('\n[repro-post] === SUMMARY ===');
  for (const acct of allResults) {
    console.log(`\n  ${acct.account} (${acct.email}):`);
    for (const r of acct.results) {
      console.log(`    ${r.stable ? 'STABLE' : 'REDIRECT'}  ${r.requested.padEnd(35)} -> ${r.finalUrl}`);
    }
  }
})().catch((err) => {
  console.error('FATAL', err);
  process.exit(2);
});
