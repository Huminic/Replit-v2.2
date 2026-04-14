/**
 * wf-widget-embed.spec.ts — Workflow E2E: Hosted Widget Embed
 *
 * Tests the full widget embed lifecycle on any environment:
 *   1. Widget JS loads (200, JavaScript content-type)
 *   2. Widget test page loads (200, contains title)
 *   3. Widget FAB renders (button with aria-label)
 *   4. Widget dropdown opens with all 4 options
 *   5. Chat iframe loads via widget
 *   6. Landing page serves (per-dealer)
 *   7. Per-dealer widget JS files serve
 *
 * Uses real browser (Playwright) — not API-only.
 * BASE_URL from environment so it can run against dev or live.
 */
import { test, expect } from 'playwright/test';

const BASE = process.env.BASE_URL || 'https://dev.huminicdev.com';

test.describe.serial('Widget Embed: hosted widget lifecycle', () => {

  // 1. Widget JS loads
  test('widget JS loads — GET /dealer-widgets/nexxus-widget.js returns 200 with JavaScript', async ({ request }) => {
    const res = await request.get(`${BASE}/dealer-widgets/nexxus-widget.js`);
    expect(res.status()).toBe(200);
    const ct = res.headers()['content-type'] || '';
    expect(ct).toMatch(/javascript/i);
    const body = await res.text();
    expect(body.length).toBeGreaterThan(100);
  });

  // 2. Widget test page loads
  test('widget test page loads — GET /widget-test.html returns 200 with title', async ({ request }) => {
    const res = await request.get(`${BASE}/widget-test.html`);
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain('Nexxus Widget Test');
  });

  // 3. Widget FAB renders on test page
  test('widget FAB renders — page has button with aria-label "Open chat widget"', async ({ page }) => {
    await page.goto(`${BASE}/widget-test.html`, { waitUntil: 'networkidle', timeout: 30000 });
    const fab = page.getByRole('button', { name: 'Open chat widget' });
    await expect(fab).toBeVisible({ timeout: 15000 });
  });

  // 4. Widget dropdown opens with all 4 options
  test('widget dropdown opens — click FAB, verify 4 options appear', async ({ page }) => {
    await page.goto(`${BASE}/widget-test.html`, { waitUntil: 'networkidle', timeout: 30000 });

    // Click the FAB to open the dropdown
    const fab = page.getByRole('button', { name: 'Open chat widget' });
    await expect(fab).toBeVisible({ timeout: 15000 });
    await fab.click();

    // Verify all 4 options are visible
    const expectedOptions = ['Web Chat', 'Instant Call Back', 'Contact Form', 'Two-Way Video'];
    for (const option of expectedOptions) {
      await expect(page.getByText(option, { exact: false })).toBeVisible({ timeout: 10000 });
    }
  });

  // 5. Chat iframe loads — click "Web Chat", verify iframe appears
  test('chat iframe loads — click Web Chat, verify iframe with /p/{slug}?mode=chat', async ({ page }) => {
    await page.goto(`${BASE}/widget-test.html`, { waitUntil: 'networkidle', timeout: 30000 });

    // Open dropdown
    const fab = page.getByRole('button', { name: 'Open chat widget' });
    await expect(fab).toBeVisible({ timeout: 15000 });
    await fab.click();

    // Click "Web Chat"
    await page.getByText('Web Chat').click();

    // Verify an iframe appears with src containing /p/ and mode=chat
    const iframe = page.locator('iframe[src*="/p/"]');
    await expect(iframe).toBeVisible({ timeout: 15000 });

    const src = await iframe.getAttribute('src');
    expect(src).toBeTruthy();
    expect(src).toMatch(/\/p\/[\w-]+\?.*mode=chat/);
  });

  // 6. Landing page loads
  test('landing page loads — GET /p/serra-honda returns 200', async ({ request }) => {
    const res = await request.get(`${BASE}/p/serra-honda`);
    expect(res.status()).toBe(200);
  });

  // 7. Per-dealer widget JS exists
  test('per-dealer widget JS — GET /dealer-widgets/serra-honda-widget.js returns 200', async ({ request }) => {
    const res = await request.get(`${BASE}/dealer-widgets/serra-honda-widget.js`);
    expect(res.status()).toBe(200);
    const ct = res.headers()['content-type'] || '';
    expect(ct).toMatch(/javascript/i);
  });

});
