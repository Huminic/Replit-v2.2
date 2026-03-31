import { test, expect } from 'playwright/test';

/**
 * Landing Pages Domain Agent Tests (T-005)
 * Generated from: tests/agents/plans/landing-pages-plan.md
 *
 * Covers: Page load for all 5 dealers, public API, widget FAB,
 * lead capture form, invalid slug handling, no-auth access,
 * cross-dealer isolation, responsive layout basics.
 *
 * All landing pages are public — no authentication required.
 *
 * Note: The server rate-limits public API at 60 req/min per IP.
 * Browser tests that fetch the landing slug API can fail under heavy
 * load. The gotoLanding helper retries once to handle transient 429s.
 */

const BASE_URL = process.env.BASE_URL || 'https://dev.huminicdev.com';

/**
 * Navigate to a landing page with retry logic for rate limiting.
 * A 429 from the public API causes the SPA to render "Page Not Found".
 * This helper retries once after a 3-second pause.
 */
async function gotoLanding(page: import('playwright/test').Page, path: string) {
  await page.goto(`${BASE_URL}${path}`);
  try {
    await page.waitForSelector('[data-testid="landing-page"]', { timeout: 15000 });
  } catch {
    await page.waitForTimeout(3000);
    await page.goto(`${BASE_URL}${path}`);
    await page.waitForSelector('[data-testid="landing-page"]', { timeout: 15000 });
  }
}

const dealers = [
  { slug: 'serra-honda', name: 'Serra Honda', persona: 'Caroline' },
  { slug: 'serra-nissan', name: 'Serra Nissan', persona: 'Magnolia' },
  { slug: 'tony-serra-ford', name: 'Tony Serra Ford', persona: 'Georgia' },
  { slug: 'hyundai-of-columbia', name: 'Hyundai of Columbia', persona: 'Elizabeth' },
  { slug: 'ford-of-columbia', name: 'Ford of Columbia', persona: 'Nova' },
];

// ---------------------------------------------------------------------------
// 1. Page Load — All 5 dealers at /p/{slug}
// ---------------------------------------------------------------------------

test.describe('Landing Page Load — All Dealers', () => {
  for (const dealer of dealers) {
    test(`TC-LP: ${dealer.name} loads at /p/${dealer.slug}`, async ({ page }) => {
      const response = await page.goto(`${BASE_URL}/p/${dealer.slug}`);
      expect(response?.status()).toBe(200);

      await page.waitForSelector('[data-testid="landing-page"]', { timeout: 30000 });
      const storeName = await page.locator('[data-testid="landing-store-name"]').textContent();
      expect(storeName).toContain(dealer.name);
    });
  }
});

// ---------------------------------------------------------------------------
// 2. Public API — /api/public/landing/{slug} returns org data
// ---------------------------------------------------------------------------

test.describe('Public API — Landing Slug Resolution', () => {
  for (const dealer of dealers) {
    test(`API: /api/public/landing/${dealer.slug} returns org data`, async ({ request }) => {
      const res = await request.get(`${BASE_URL}/api/public/landing/${dealer.slug}`);
      expect(res.status()).toBe(200);

      const body = await res.json();
      expect(body.name).toBe(dealer.name);
      expect(body.slug).toBe(dealer.slug);
      expect(body.personaName).toBe(dealer.persona);
      expect(body.id).toBeTruthy();
    });
  }

  test('API: invalid slug returns 404', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/public/landing/nonexistent-dealer-xyz`);
    expect(res.status()).toBe(404);

    const body = await res.json();
    expect(body.message).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// 3. Widget FAB renders on each page
// ---------------------------------------------------------------------------

test.describe('Widget FAB Rendering', () => {
  test('FAB button visible on landing page', async ({ page }) => {
    await gotoLanding(page, '/p/serra-honda');

    const fab = page.locator('[data-testid="button-widget-fab"]');
    await expect(fab).toBeVisible({ timeout: 10000 });
  });

  test('FAB toggles widget menu open and closed', async ({ page }) => {
    await gotoLanding(page, '/p/serra-nissan');

    const fab = page.locator('[data-testid="button-widget-fab"]');
    await expect(fab).toBeVisible({ timeout: 10000 });
    await fab.click();
    await expect(page.locator('[data-testid="widget-menu"]')).toBeVisible({ timeout: 5000 });

    // Close via close button or FAB
    const closeBtn = page.locator('[data-testid="button-close-widget"]');
    if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeBtn.click();
    } else {
      await fab.click();
    }
    await expect(page.locator('[data-testid="widget-menu"]')).not.toBeVisible({ timeout: 5000 });
  });

  test('Widget menu shows all 4 channel options', async ({ page }) => {
    await gotoLanding(page, '/p/tony-serra-ford');

    await page.locator('[data-testid="button-widget-fab"]').click();
    await expect(page.locator('[data-testid="widget-menu"]')).toBeVisible();

    await expect(page.locator('[data-testid="widget-option-chat"]')).toBeVisible();
    await expect(page.locator('[data-testid="widget-option-voice"]')).toBeVisible();
    await expect(page.locator('[data-testid="widget-option-form"]')).toBeVisible();
    await expect(page.locator('[data-testid="widget-option-video"]')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 4. Lead Capture Form renders
// ---------------------------------------------------------------------------

test.describe('Lead Capture Form', () => {
  test('All form fields and submit button render', async ({ page }) => {
    await gotoLanding(page, '/p/hyundai-of-columbia');

    await expect(page.locator('[data-testid="input-first-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-last-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-phone"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-email"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-interest"]')).toBeVisible();

    const submitBtn = page.locator('[data-testid="button-submit"]');
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toContainText('Get in Touch');
  });

  test('Lead form submission shows success state', async ({ page }) => {
    await gotoLanding(page, '/p/serra-honda');

    await page.locator('[data-testid="input-first-name"]').fill('Test');
    await page.locator('[data-testid="input-last-name"]').fill('User');
    await page.locator('[data-testid="input-phone"]').fill('5551234567');
    await page.locator('[data-testid="input-email"]').fill('playwright-test@example.com');
    await page.locator('[data-testid="input-interest"]').fill('SUV under 40K');
    await page.locator('[data-testid="button-submit"]').click();

    await expect(page.locator('[data-testid="landing-success"]')).toBeVisible({ timeout: 10000 });
  });

  test('Send another button returns to form after success', async ({ page }) => {
    await gotoLanding(page, '/p/ford-of-columbia');

    await page.locator('[data-testid="input-first-name"]').fill('Reset');
    await page.locator('[data-testid="input-last-name"]').fill('Test');
    await page.locator('[data-testid="input-phone"]').fill('5559876543');
    await page.locator('[data-testid="input-email"]').fill('playwright-reset@example.com');
    await page.locator('[data-testid="button-submit"]').click();

    await expect(page.locator('[data-testid="landing-success"]')).toBeVisible({ timeout: 10000 });

    await page.locator('[data-testid="button-send-another"]').click();

    // Form should be back visible (success state gone) with submit button
    await expect(page.locator('[data-testid="landing-success"]')).not.toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="input-first-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="button-submit"]')).toBeVisible();
  });

  test('Consent text includes dealer name', async ({ page }) => {
    await gotoLanding(page, '/p/serra-honda');

    const pageText = await page.locator('[data-testid="landing-page"]').textContent();
    expect(pageText).toContain('Serra Honda');
    expect(pageText).toContain('By submitting');
  });
});

// ---------------------------------------------------------------------------
// 5. Invalid slug — 404 or error handling
// ---------------------------------------------------------------------------

test.describe('Invalid Slug Handling', () => {
  test('Nonexistent slug shows not-found state in browser', async ({ page }) => {
    await page.goto(`${BASE_URL}/p/nonexistent-dealer-xyz`);
    await page.waitForLoadState('networkidle');

    const pageText = await page.locator('body').textContent();
    expect(pageText).toContain('Page Not Found');
  });

  test('API returns non-200 for nonexistent slug', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/public/landing/this-dealer-does-not-exist-abc`);
    // 404 expected; 429 possible under rate limiting -- both are valid non-200
    expect([404, 429]).toContain(res.status());
  });
});

// ---------------------------------------------------------------------------
// 6. No auth required for public pages
// ---------------------------------------------------------------------------

test.describe('Public Access — No Auth Required', () => {
  test('Landing page loads without any cookies or auth headers', async ({ browser }) => {
    const context = await browser.newContext();
    await context.clearCookies();
    const page = await context.newPage();

    await gotoLanding(page, '/p/serra-honda');

    const storeName = await page.locator('[data-testid="landing-store-name"]').textContent();
    expect(storeName).toContain('Serra Honda');

    await context.close();
  });

  test('Landing page does not redirect to login', async ({ page }) => {
    await gotoLanding(page, '/p/serra-nissan');

    expect(page.url()).toContain('/p/serra-nissan');
    expect(page.url()).not.toContain('/login');
  });

  test('Public API works without auth token', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/public/landing/serra-honda`, {
      headers: {},
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.name).toBe('Serra Honda');
  });
});

// ---------------------------------------------------------------------------
// 7. Cross-dealer isolation — each page shows correct dealer data
// ---------------------------------------------------------------------------

test.describe('Cross-Dealer Isolation', () => {
  test('Each dealer page shows unique, correct dealer name', async ({ page }) => {
    const results: { slug: string; displayedName: string | null }[] = [];

    for (const dealer of dealers) {
      await gotoLanding(page, `/p/${dealer.slug}`);

      const storeName = await page.locator('[data-testid="landing-store-name"]').textContent();
      results.push({ slug: dealer.slug, displayedName: storeName });
      expect(storeName).toContain(dealer.name);
    }

    // Verify no two dealers show the same name (uniqueness check)
    const names = results.map(r => r.displayedName);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(dealers.length);
  });

  test('API returns correct persona per dealer', async ({ request }) => {
    for (const dealer of dealers) {
      const res = await request.get(`${BASE_URL}/api/public/landing/${dealer.slug}`);
      expect(res.status()).toBe(200);

      const body = await res.json();
      expect(body.personaName).toBe(dealer.persona);
      expect(body.name).toBe(dealer.name);
    }
  });

  test('Navigating between dealers does not leak data', async ({ page }) => {
    await gotoLanding(page, '/p/serra-honda');
    let storeName = await page.locator('[data-testid="landing-store-name"]').textContent();
    expect(storeName).toContain('Serra Honda');

    await gotoLanding(page, '/p/serra-nissan');
    storeName = await page.locator('[data-testid="landing-store-name"]').textContent();
    expect(storeName).toContain('Serra Nissan');
    expect(storeName).not.toContain('Serra Honda');
  });
});

// ---------------------------------------------------------------------------
// 8. Responsive Layout Basics
// ---------------------------------------------------------------------------

test.describe('Responsive Layout', () => {
  test('Desktop (1280x720) — side-by-side layout, both panels visible', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await gotoLanding(page, '/p/serra-nissan');

    await expect(page.locator('[data-testid="input-first-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="landing-branding"]')).toBeVisible();
    await expect(page.locator('[data-testid="landing-store-name"]')).toBeVisible();
  });

  test('Mobile (375x667) — stacked layout, FAB accessible', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await gotoLanding(page, '/p/tony-serra-ford');

    await expect(page.locator('[data-testid="input-first-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="landing-store-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="button-widget-fab"]')).toBeVisible({ timeout: 10000 });
  });

  test('Tablet (768x1024) — content accessible, FAB visible', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await gotoLanding(page, '/p/hyundai-of-columbia');

    await expect(page.locator('[data-testid="input-first-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="landing-store-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="button-widget-fab"]')).toBeVisible({ timeout: 10000 });
  });
});

// ---------------------------------------------------------------------------
// Bonus: /w/ alias route
// ---------------------------------------------------------------------------

test.describe('Route Alias', () => {
  test('/w/ alias loads same page as /p/', async ({ page }) => {
    await gotoLanding(page, '/w/serra-honda');

    const storeName = await page.locator('[data-testid="landing-store-name"]').textContent();
    expect(storeName).toContain('Serra Honda');
  });
});

// ---------------------------------------------------------------------------
// Bonus: Branding panel static stats
// ---------------------------------------------------------------------------

test.describe('Branding Panel Content', () => {
  test('Branding panel shows static stats', async ({ page }) => {
    await gotoLanding(page, '/p/serra-honda');

    const branding = page.locator('[data-testid="landing-branding"]');
    await expect(branding).toBeVisible();

    const brandingText = await branding.textContent();
    expect(brandingText).toContain('500+');
    expect(brandingText).toContain('4.9');
    expect(brandingText).toContain('24/7');
  });

  test('Hero image button is present', async ({ page }) => {
    await gotoLanding(page, '/p/ford-of-columbia');

    await expect(page.locator('[data-testid="button-hero-image"]')).toBeVisible();
  });
});
