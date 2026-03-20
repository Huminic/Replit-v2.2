import { test, expect } from 'playwright/test';

/**
 * Seed test — establishes the test environment for Playwright agents.
 * The Planner runs this before exploring, and the Generator copies it into generated tests.
 *
 * Auth: All test users use password "NexxusTest2026"
 * Base URL: http://localhost:5000
 * App: Nexxus Connect v2.2 — CRM/AI platform for automotive dealerships
 *
 * Roles available:
 *   super_admin: admin@nexxus.com (Huminic)
 *   partner_admin: durran@cageautomotive.com (Cage Automotive — sees 5 dealerships)
 *   org_admin: orgadmin@serrahonda.com (Serra Honda)
 *   executive: executive@serrahonda.com (Serra Honda)
 *   sales: sales@serrahonda.com (Serra Honda)
 *   service: service@serrahonda.com (Serra Honda)
 *   marketing: marketing@serrahonda.com (Serra Honda)
 *
 * Key pages:
 *   / — Dashboard with metrics and AI chat
 *   /sales, /service, /marketing, /management — Department pages
 *   /teambox — Unified inbox for all conversations
 *   /my-work — Personal workspace
 *   /insights — Analytics dashboard
 *   /billing — Billing and usage
 *   /settings — System settings (tile-based, role-filtered)
 *   /profile — User profile
 *   /agents — Agent management
 *   /widget/test — Widget test page with all dealer buttons
 */

const TEST_PASSWORD = "NexxusTest2026";

test.describe('Nexxus Connect Seed', () => {

  test('seed — login as Org Admin and navigate to dashboard', async ({ page }) => {
    // Login via API to set httpOnly refresh cookie
    const loginRes = await page.request.post('/api/auth/login', {
      data: {
        email: 'orgadmin@serrahonda.com',
        password: TEST_PASSWORD,
      },
    });
    expect(loginRes.ok()).toBeTruthy();

    // Dismiss product tour overlays
    await page.addInitScript(() => {
      const prefix = 'nexxus_tour_dismissed_';
      const keys = ['main', 'teambox', 'my-work', 'sales', 'service', 'marketing',
        'management', 'agents', 'insights', 'settings', 'profile', 'usage'];
      for (const key of keys) {
        localStorage.setItem(prefix + key, 'true');
      }
    });

    // Navigate to dashboard
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);

    // Verify the app loaded (not stuck on login page)
    const url = page.url();
    expect(url).not.toContain('/login');

    // Verify dashboard has content
    const bodyText = await page.textContent('body') || '';
    expect(bodyText.length).toBeGreaterThan(100);
  });
});
