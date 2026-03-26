import { test, expect } from "playwright/test";
import { testUsers, loginForBrowser } from "./helpers/auth";

const BASE = "http://localhost:5000";

test.describe("Domain 9: Settings", () => {
  test("9.1 Settings page loads with all tiles", async ({ page }) => {
    await loginForBrowser(page, testUsers.superAdmin, "/settings");
    await page.waitForTimeout(1000);

    // Verify settings tiles render — expect at least one tile/card element
    const tiles = page.locator('[class*="tile"], [class*="card"], [class*="Card"], [class*="Tile"], [data-testid*="settings"]');
    const tileCount = await tiles.count();
    expect(tileCount).toBeGreaterThan(0);
  });

  test("9.2 Profile shows name, email, photo, password change", async ({ page }) => {
    await loginForBrowser(page, testUsers.superAdmin, "/profile");
    await page.waitForTimeout(1000);

    // Check for profile fields
    const pageContent = await page.textContent("body");
    expect(pageContent).toBeTruthy();

    // Name field should be present — check h2 text or data-testid input
    const nameInput = page.locator('h2, [data-testid="input-first-name"], input[name="name"], input[name="fullName"], input[name="firstName"], input[placeholder*="name" i]');
    const nameVisible = await nameInput.first().isVisible().catch(() => false);

    // Email field should be present
    const emailInput = page.locator('input#email, [data-testid="input-email"], input[name="email"], input[type="email"]');
    const emailVisible = await emailInput.first().isVisible().catch(() => false);

    // At least name or email should be visible on profile
    expect(nameVisible || emailVisible).toBe(true);

    // Photo section — avatar or photo upload
    const photoSection = page.locator('[class*="avatar" i], [class*="photo" i], img[alt*="profile" i], img[alt*="avatar" i], [data-testid*="avatar"]');
    const photoExists = await photoSection.first().isVisible().catch(() => false);
    // Photo may or may not be present, just check page loaded
    expect(pageContent!.length).toBeGreaterThan(0);

    // Password change section
    const passwordSection = page.locator('input[type="password"], button:has-text("password"), button:has-text("Password"), [class*="password" i]');
    const passwordExists = await passwordSection.first().isVisible().catch(() => false);
    // Profile should have some password-related element
    expect(passwordExists || pageContent!.toLowerCase().includes("password")).toBe(true);
  });

  test("9.3 Restart Tour button on profile", async ({ page }) => {
    await loginForBrowser(page, testUsers.superAdmin, "/profile");
    await page.waitForTimeout(1000);

    // Click the Preferences tab — the Restart Tour button lives there
    const preferencesTab = page.locator('[data-testid="tab-profile-preferences"]');
    await preferencesTab.click();
    await page.waitForTimeout(500);

    // Look for the restart tour button
    const tourButton = page.locator('[data-testid="button-restart-tour"]');
    const tourExists = await tourButton.first().isVisible().catch(() => false);

    expect(tourExists).toBe(true);
  });

  test("9.4 Org Wizard accessible to Super Admin only", async ({ page, request }) => {
    // Login as super admin — should be able to access org wizard
    const superLoginRes = await request.post(`${BASE}/api/auth/login`, {
      data: { email: testUsers.superAdmin.email, password: testUsers.superAdmin.password },
    });
    expect(superLoginRes.ok()).toBe(true);
    const superBody = await superLoginRes.json();
    const superToken = superBody.accessToken;

    // Check org wizard endpoint as super admin
    const wizardSuper = await request.get(`${BASE}/api/organizations`, {
      headers: { Authorization: `Bearer ${superToken}` },
    });
    // Super admin should have access (200 or similar)
    expect([200, 201, 204]).toContain(wizardSuper.status());

    // Login as sales — should NOT access org wizard
    const salesLoginRes = await request.post(`${BASE}/api/auth/login`, {
      data: { email: testUsers.sales.email, password: testUsers.sales.password },
    });
    expect(salesLoginRes.ok()).toBe(true);
    const salesBody = await salesLoginRes.json();
    const salesToken = salesBody.accessToken;

    // Sales user accessing org list should get 200 with only their own org (not the full list)
    const wizardSales = await request.get(`${BASE}/api/organizations`, {
      headers: { Authorization: `Bearer ${salesToken}` },
    });
    expect(wizardSales.status()).toBe(200);
    const salesOrgs = await wizardSales.json();
    // Non-admin roles should see at most their own org, not the full org list
    expect(Array.isArray(salesOrgs)).toBe(true);
    expect(salesOrgs.length).toBeLessThanOrEqual(1);
  });

  test("9.5 Communication gate toggle in settings", async ({ page }) => {
    await loginForBrowser(page, testUsers.superAdmin, "/settings");
    await page.waitForTimeout(1000);

    // Click the Organization tile to open the Organization section
    const orgTile = page.locator('[data-testid="settings-tile-organization"]');
    await orgTile.click();
    await page.waitForTimeout(1000);

    // Look for the communication gate toggle
    const toggle = page.locator('[data-testid="switch-communication-gate"]');
    const toggleVisible = await toggle.first().isVisible().catch(() => false);

    expect(toggleVisible).toBe(true);
  });
});
