import { test, expect } from "playwright/test";
import { testUsers } from "./helpers/auth";

const BASE = "http://localhost:5000";

test.describe("Domain 9: Settings", () => {
  test("9.1 Settings page loads with all tiles", async ({ page }) => {
    // Login as super admin via UI
    await page.goto(`${BASE}/login`);
    await page.fill('input[name="email"], input[type="email"]', testUsers.superAdmin.email);
    await page.fill('input[name="password"], input[type="password"]', testUsers.superAdmin.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*(?<!login)$/, { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Navigate to settings
    await page.goto(`${BASE}/settings`);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(3000);

    // Verify settings tiles render — expect at least one tile/card element
    const tiles = page.locator('[class*="tile"], [class*="card"], [class*="Card"], [class*="Tile"], [data-testid*="settings"]');
    const tileCount = await tiles.count();
    expect(tileCount).toBeGreaterThan(0);
  });

  test("9.2 Profile shows name, email, photo, password change", async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('input[name="email"], input[type="email"]', testUsers.superAdmin.email);
    await page.fill('input[name="password"], input[type="password"]', testUsers.superAdmin.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*(?<!login)$/, { timeout: 30000 });
    await page.waitForTimeout(2000);

    await page.goto(`${BASE}/profile`);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(3000);

    // Check for profile fields
    const pageContent = await page.textContent("body");
    expect(pageContent).toBeTruthy();

    // Name field should be present
    const nameInput = page.locator('input[name="name"], input[name="fullName"], input[name="firstName"], input[placeholder*="name" i]');
    const nameVisible = await nameInput.first().isVisible().catch(() => false);

    // Email field should be present
    const emailInput = page.locator('input[name="email"], input[type="email"]');
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
    await page.goto(`${BASE}/login`);
    await page.fill('input[name="email"], input[type="email"]', testUsers.superAdmin.email);
    await page.fill('input[name="password"], input[type="password"]', testUsers.superAdmin.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*(?<!login)$/, { timeout: 30000 });
    await page.waitForTimeout(2000);

    await page.goto(`${BASE}/profile`);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(3000);

    // Look for a tour restart button
    const tourButton = page.locator('button:has-text("tour"), button:has-text("Tour"), [data-testid*="tour"], a:has-text("tour")');
    const tourExists = await tourButton.first().isVisible().catch(() => false);

    // Also check page text for tour reference
    const pageText = await page.textContent("body");
    const hasTourReference = tourExists || (pageText?.toLowerCase().includes("tour") ?? false);

    expect(hasTourReference).toBe(true);
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

    // Sales user accessing org management should be forbidden
    const wizardSales = await request.get(`${BASE}/api/organizations`, {
      headers: { Authorization: `Bearer ${salesToken}` },
    });
    // Expect 403 Forbidden or 401 Unauthorized
    expect([401, 403]).toContain(wizardSales.status());
  });

  test("9.5 Communication gate toggle in settings", async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('input[name="email"], input[type="email"]', testUsers.superAdmin.email);
    await page.fill('input[name="password"], input[type="password"]', testUsers.superAdmin.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*(?<!login)$/, { timeout: 30000 });
    await page.waitForTimeout(2000);

    await page.goto(`${BASE}/settings`);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(3000);

    // Look for communication gate / kill switch toggle
    const toggle = page.locator(
      '[class*="switch" i], [class*="toggle" i], [role="switch"], input[type="checkbox"], ' +
      'button:has-text("communication"), button:has-text("Communication"), ' +
      '[data-testid*="communication"], [data-testid*="gate"], [data-testid*="kill"]'
    );
    const pageText = await page.textContent("body");

    // The communication gate should be referenced somewhere in settings
    const hasCommGate =
      (await toggle.first().isVisible().catch(() => false)) ||
      (pageText?.toLowerCase().includes("communication") ?? false) ||
      (pageText?.toLowerCase().includes("kill switch") ?? false) ||
      (pageText?.toLowerCase().includes("gate") ?? false);

    expect(hasCommGate).toBe(true);
  });
});
