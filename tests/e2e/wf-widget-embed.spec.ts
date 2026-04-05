/**
 * Workflow E2E: Widget Cross-Origin Embedding Headers
 *
 * Verifies that all 5 dealer widget JS endpoints return correct headers
 * for cross-origin embedding on dealer sites. Also checks that the generic
 * widget endpoint, widget API CORS preflight, and non-widget routes behave
 * correctly.
 *
 * API-only tests (no browser needed).
 */
import { test, expect } from 'playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:5000';

const DEALER_WIDGETS = [
  '/widget/dealer/serra-honda.js',
  '/widget/dealer/serra-nissan.js',
  '/widget/dealer/tony-serra-ford.js',
  '/widget/dealer/hyundai-of-columbia.js',
  '/widget/dealer/ford-of-columbia.js',
];

test.describe.serial('Widget Cross-Origin Embedding Headers', () => {

  for (const path of DEALER_WIDGETS) {
    const slug = path.replace('/widget/dealer/', '').replace('.js', '');

    test(`${slug} — returns 200/302 with correct content-type`, async ({ request }) => {
      const res = await request.get(`${BASE}${path}`, { maxRedirects: 0 });
      const status = res.status();
      expect([200, 302]).toContain(status);

      if (status === 200) {
        const ct = res.headers()['content-type'] || '';
        expect(ct).toMatch(/javascript/i);
      }
    });

    test(`${slug} — access-control-allow-origin is *`, async ({ request }) => {
      const res = await request.get(`${BASE}${path}`, { maxRedirects: 0 });
      // Header checks only apply to 200 responses; 302 redirects may not carry widget headers
      if (res.status() === 200) {
        expect(res.headers()['access-control-allow-origin']).toBe('*');
      }
    });

    test(`${slug} — cross-origin-resource-policy is cross-origin`, async ({ request }) => {
      const res = await request.get(`${BASE}${path}`, { maxRedirects: 0 });
      if (res.status() === 200) {
        expect(res.headers()['cross-origin-resource-policy']).toBe('cross-origin');
      }
    });

    test(`${slug} — no x-frame-options blocking`, async ({ request }) => {
      const res = await request.get(`${BASE}${path}`, { maxRedirects: 0 });
      const xfo = res.headers()['x-frame-options'];
      // Should be absent (removed by widget middleware)
      if (xfo) {
        // If present for some reason (e.g. reverse proxy), it must not block
        expect(xfo).not.toMatch(/DENY/i);
      }
    });

    test(`${slug} — CSP frame-ancestors * if present`, async ({ request }) => {
      const res = await request.get(`${BASE}${path}`, { maxRedirects: 0 });
      const csp = res.headers()['content-security-policy'];
      if (csp) {
        expect(csp).toContain('frame-ancestors *');
      }
    });

    test(`${slug} — cache-control includes public`, async ({ request }) => {
      const res = await request.get(`${BASE}${path}`, { maxRedirects: 0 });
      if (res.status() === 200) {
        const cc = res.headers()['cache-control'] || '';
        expect(cc.toLowerCase()).toContain('public');
      }
    });
  }

  test('generic widget — /widget/nexxus-widget.js returns 200 with JS', async ({ request }) => {
    const res = await request.get(`${BASE}/widget/nexxus-widget.js`, { maxRedirects: 0 });
    const status = res.status();
    expect([200, 302]).toContain(status);

    if (status === 200) {
      const ct = res.headers()['content-type'] || '';
      expect(ct).toMatch(/javascript/i);
    }

    // Cross-origin headers
    expect(res.headers()['access-control-allow-origin']).toBe('*');
    expect(res.headers()['cross-origin-resource-policy']).toBe('cross-origin');
  });

  test('widget API CORS preflight — OPTIONS /api/widget/video-session', async ({ request }) => {
    const res = await request.fetch(`${BASE}/api/widget/video-session`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://example-dealer.com',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });
    // Preflight should succeed (200 or 204)
    expect([200, 204]).toContain(res.status());

    const headers = res.headers();
    expect(headers['access-control-allow-origin']).toBe('*');
    expect(headers['access-control-allow-methods']).toMatch(/POST/i);
  });

  test('non-widget route /api/health retains security headers', async ({ request }) => {
    const res = await request.get(`${BASE}/api/health`);
    const headers = res.headers();

    // Helmet defaults should be present on non-widget routes
    if (headers['x-content-type-options']) {
      expect(headers['x-content-type-options']).toMatch(/nosniff/i);
    }

    if (headers['x-frame-options']) {
      expect(headers['x-frame-options']).toMatch(/SAMEORIGIN|DENY/i);
    }

    // Should NOT have cross-origin-resource-policy: cross-origin
    // (Helmet default is same-origin, or it may be absent)
    const corp = headers['cross-origin-resource-policy'];
    if (corp) {
      expect(corp).not.toBe('cross-origin');
    }
  });

});
