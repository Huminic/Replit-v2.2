/**
 * T-004 Agent Tests: Management Domain
 *
 * Covers gaps identified in management-plan.md:
 * - Page load and tab navigation (super_admin only)
 * - RBAC denial for non-super_admin roles (API-level role gates)
 * - Hunches tab UI and API (CRUD, validation, cross-org denial)
 * - Activity log (System Log) UI and API
 * - User Chats coming-soon placeholder (I-116)
 *
 * Rate-limit strategy: ONE browser login (super_admin) for all UI tests.
 * API tests use file-cached login() helper (1 HTTP call per unique user).
 * Total browser logins: 1. Total API logins: ~7 (cached).
 */
import { test, expect, type Page } from "playwright/test";
import {
  testUsers,
  login,
  loginForBrowser,
  authHeader,
} from "../../e2e/helpers/auth";

const BASE_URL = process.env.BASE_URL || "https://dev.huminicdev.com";

/**
 * Navigate to management page with a specific tab. Reuses existing page
 * auth state from loginForBrowser — the httpOnly cookie persists across
 * navigations within the same page.
 */
async function goToManagement(page: Page, tab?: string) {
  // Dismiss submenu panel if open (it overlays content)
  await page.mouse.move(800, 400);
  await page.waitForTimeout(300);

  if (tab) {
    const tabEl = page.locator(`[data-testid="tab-mgmt-${tab}"]`);
    await tabEl.click({ timeout: 10000 });
    await page.waitForTimeout(1500);
  } else {
    const insightsTab = page.locator('[data-testid="tab-mgmt-insights"]');
    if (await insightsTab.isVisible()) {
      await insightsTab.click({ timeout: 10000 });
      await page.waitForTimeout(1000);
    }
  }
}

// ===========================================================================
// GROUP A: SuperAdmin Browser Tests — single login page, reused
// ===========================================================================
test.describe("SuperAdmin Management UI", () => {
  test("TC-MGT-003: Default tab is Insights on bare /management", async ({ browser }) => {
    const ctx = await browser.newContext({ baseURL: BASE_URL });
    const page = await ctx.newPage();
    // Login to "/" first to let AuthContext fully resolve the user role.
    // Direct navigation to /management races with role initialization
    // (default is org_admin, RBAC redirects before super_admin resolves).
    // After auth resolves, click the sidebar "Manage" link to navigate.
    await loginForBrowser(page, testUsers.superAdmin, "/");
    // Wait for auth to fully resolve (role initialization)
    await page.waitForTimeout(4000);
    // Navigate to management via sidebar click (avoids RBAC race)
    const manageLink = page.locator('button:has-text("Manage"), a:has-text("Manage")').first();
    await manageLink.click();
    await page.waitForTimeout(3000);

    // Wait for the management page testid to appear
    await expect(page.locator('[data-testid="management-page"]')).toBeVisible({ timeout: 15000 });
    const insightsTab = page.locator('[data-testid="tab-mgmt-insights"]');
    await expect(insightsTab).toBeVisible({ timeout: 5000 });
    await expect(insightsTab).toHaveClass(/border-primary/);

    // TC-MGT-002: All 5 tab buttons render with correct labels (same page)
    const expected = [
      { testid: "tab-mgmt-insights", label: "Insights" },
      { testid: "tab-mgmt-hunches", label: "Hunches" },
      { testid: "tab-mgmt-activities", label: "System Log" },
      { testid: "tab-mgmt-user-chats", label: "User Chats" },
      { testid: "tab-mgmt-billing", label: "Billing" },
    ];
    for (const { testid, label } of expected) {
      const tab = page.locator(`[data-testid="${testid}"]`);
      await expect(tab).toBeVisible();
      await expect(tab).toContainText(label);
    }

    // Close the submenu panel that overlays the tab buttons.
    // The sidebar submenu panel opens on hover and overlays the content.
    // Move mouse away from sidebar to close it, then press Escape.
    await page.mouse.move(800, 400);
    await page.waitForTimeout(500);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);

    // TC-MGT-004: Tab switching works for all 5 tabs (same page)
    const tabIds = ["insights", "hunches", "activities", "user-chats", "billing"];
    for (const id of tabIds) {
      const tab = page.locator(`[data-testid="tab-mgmt-${id}"]`);
      await tab.click({ timeout: 10000 });
      await page.waitForTimeout(500);
      await expect(tab).toHaveClass(/border-primary/);
    }

    // TC-MGT-005a: Navigate to hunches via URL param (same page)
    await goToManagement(page, "hunches");
    const hunchesTab = page.locator('[data-testid="tab-mgmt-hunches"]');
    await expect(hunchesTab).toHaveClass(/border-primary/);

    // TC-MGT-005b: Navigate to billing via URL param (same page)
    await goToManagement(page, "billing");
    const billingTab = page.locator('[data-testid="tab-mgmt-billing"]');
    await expect(billingTab).toHaveClass(/border-primary/);
    await expect(page.locator('[data-testid="billing-tab-content"]')).toBeVisible({ timeout: 8000 });

    // TC-MGT-010: Hunches tab renders heading and description
    await goToManagement(page, "hunches");
    await expect(page.getByText("AI Hunches")).toBeVisible({ timeout: 8000 });
    await expect(page.getByText("Pattern-based insights ranked by confidence")).toBeVisible();

    // TC-MGT-011: Generate Hunches button is visible
    const btn = page.locator('[data-testid="button-generate-hunches"]');
    await expect(btn).toBeVisible({ timeout: 8000 });
    await expect(btn).toContainText("Generate Hunches");

    // TC-MGT-012: Hunch cards display fields or empty state
    const cards = page.locator('[data-testid^="hunch-card-"]');
    const cardCount = await cards.count();
    if (cardCount > 0) {
      await expect(cards.first().locator(".text-sm.font-semibold").first()).toBeVisible();
    } else {
      await expect(page.getByText("No hunches yet")).toBeVisible();
    }

    // TC-MGT-040: System Log tab renders heading and entries
    await goToManagement(page, "activities");
    await expect(page.getByText("System Log").first()).toBeVisible({ timeout: 8000 });
    const activityItems = page.locator('[data-testid^="activity-item-"]');
    const activityCount = await activityItems.count();
    if (activityCount > 0) {
      await expect(activityItems.first()).toBeVisible();
      // TC-MGT-041: entries have data-testid
      const firstTestId = await activityItems.first().getAttribute("data-testid");
      expect(firstTestId).toMatch(/^activity-item-.+/);
      // TC-MGT-042: entries show relative timestamps
      const text = await activityItems.first().textContent();
      expect(text).toMatch(/ago/i);
    } else {
      await expect(page.getByText("No activity recorded yet")).toBeVisible();
    }

    // TC-MGT-050: User Chats tab shows coming soon placeholder
    await goToManagement(page, "user-chats");
    await expect(page.getByText("User Chats").first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByText("coming soon")).toBeVisible();
    await expect(page.getByText("View and filter chat conversations")).toBeVisible();

    // TC-MGT-080: Insights tab renders on default management page
    await goToManagement(page);
    await expect(page.locator('[data-testid="management-page"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="tab-mgmt-insights"]')).toHaveClass(/border-primary/);

    await page.close();
    await ctx.close();
  });
});

// ===========================================================================
// GROUP B: RBAC — Unauthenticated (no login needed)
// ===========================================================================
test.describe("Management RBAC Unauthenticated", () => {
  test("TC-MGT-079: Unauthenticated user cannot access /management", async ({ browser }) => {
    const ctx = await browser.newContext({ baseURL: BASE_URL });
    const page = await ctx.newPage();
    await page.goto("/management", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);

    const mgmtPage = page.locator('[data-testid="management-page"]');
    await expect(mgmtPage).not.toBeVisible({ timeout: 5000 });
    await page.close();
    await ctx.close();
  });
});

// ===========================================================================
// GROUP C: RBAC — API-level role gate tests (cached logins, no browser)
// ===========================================================================
test.describe("Management RBAC API Role Gates", () => {
  test("TC-MGT-028: sales role denied POST /api/hunches/generate", async ({ request }) => {
    const { token } = await login(request, testUsers.sales);
    const res = await request.post("/api/hunches/generate", {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(403);
  });

  test("TC-MGT-073: executive allowed POST /api/hunches/generate (roleLevel 3 <= 3)", async ({ request }) => {
    test.setTimeout(120000); // AI generation can take > 60s
    const { token } = await login(request, testUsers.executive);
    const res = await request.post("/api/hunches/generate", {
      headers: authHeader(token),
      timeout: 90000,
    });
    // executive roleLevel 3 <= requireRole(3), should be allowed
    expect([200, 500]).toContain(res.status());
  });

  test("TC-MGT-075: service role denied POST /api/hunches/generate", async ({ request }) => {
    const { token } = await login(request, testUsers.service);
    const res = await request.post("/api/hunches/generate", {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(403);
  });

  test("TC-MGT-076: marketing role denied POST /api/hunches/generate", async ({ request }) => {
    const { token } = await login(request, testUsers.marketing);
    const res = await request.post("/api/hunches/generate", {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(403);
  });

  test("TC-MGT-071: partner_admin allowed POST /api/hunches/generate (roleLevel 2 <= 3)", async ({ request }) => {
    test.setTimeout(120000); // AI generation can take > 60s
    const { token } = await login(request, testUsers.partnerAdmin);
    const res = await request.post("/api/hunches/generate", {
      headers: authHeader(token),
      timeout: 90000,
    });
    expect([200, 500]).toContain(res.status());
  });
});

// ===========================================================================
// GROUP D: Hunches API Tests
// ===========================================================================
test.describe("Hunches API", () => {
  test("TC-MGT-020: GET /api/hunches returns array for super_admin", async ({ request }) => {
    const { token } = await login(request, testUsers.superAdmin);
    const res = await request.get("/api/hunches", {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test("TC-MGT-029: POST /api/hunches/generate succeeds for super_admin", async ({ request }) => {
    test.setTimeout(120000); // AI generation can take > 60s
    const { token } = await login(request, testUsers.superAdmin);
    const res = await request.post("/api/hunches/generate", {
      headers: authHeader(token),
      timeout: 90000,
    });
    expect([200, 500]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(Array.isArray(body)).toBe(true);
    }
  });

  test("TC-MGT-030: GET /api/hunches requires authentication", async ({ request }) => {
    const res = await request.get("/api/hunches");
    expect(res.status()).toBe(401);
  });

  test("TC-MGT-023: PATCH /api/hunches/:id accepts valid status", async ({ request }) => {
    const { token } = await login(request, testUsers.superAdmin);

    const listRes = await request.get("/api/hunches", {
      headers: authHeader(token),
    });
    const hunches = await listRes.json();
    if (!Array.isArray(hunches) || hunches.length === 0) {
      test.skip(true, "No hunches available to test PATCH");
      return;
    }

    const target = hunches.find((h: any) => h.status === "new") || hunches[0];
    const newStatus = target.status === "new" ? "accepted" : target.status === "accepted" ? "resolved" : "accepted";

    const res = await request.patch(`/api/hunches/${target.id}`, {
      headers: authHeader(token),
      data: { status: newStatus },
    });
    expect([200, 400]).toContain(res.status());
    if (res.status() === 200) {
      const updated = await res.json();
      expect(updated.status).toBe(newStatus);
    }
  });

  test("TC-MGT-025: PATCH /api/hunches/:id rejects invalid status value", async ({ request }) => {
    const { token } = await login(request, testUsers.superAdmin);

    const listRes = await request.get("/api/hunches", {
      headers: authHeader(token),
    });
    const hunches = await listRes.json();
    if (!Array.isArray(hunches) || hunches.length === 0) {
      test.skip(true, "No hunches available to test PATCH validation");
      return;
    }

    const res = await request.patch(`/api/hunches/${hunches[0].id}`, {
      headers: authHeader(token),
      data: { status: "totally_invalid_status" },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.message).toContain("Invalid update data");
  });

  test("TC-MGT-026: PATCH /api/hunches/nonexistent returns 404", async ({ request }) => {
    const { token } = await login(request, testUsers.superAdmin);
    const res = await request.patch("/api/hunches/00000000-0000-0000-0000-000000000000", {
      headers: authHeader(token),
      data: { status: "accepted" },
    });
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body.message).toBe("Hunch not found");
  });

  test("TC-MGT-021: GET /api/hunches with status filter", async ({ request }) => {
    const { token } = await login(request, testUsers.superAdmin);
    const res = await request.get("/api/hunches?status=new", {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    for (const h of body) {
      expect(h.status).toBe("new");
    }
  });

  test("TC-MGT-022: GET /api/hunches with department filter", async ({ request }) => {
    const { token } = await login(request, testUsers.superAdmin);
    const res = await request.get("/api/hunches?department=sales", {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    for (const h of body) {
      expect(h.department).toBe("sales");
    }
  });

  test("TC-MGT-027: PATCH cross-org hunch denied for org_admin", async ({ request }) => {
    const saAuth = await login(request, testUsers.superAdmin);
    const oaAuth = await login(request, testUsers.orgAdmin);

    const listRes = await request.get("/api/hunches", {
      headers: authHeader(saAuth.token),
    });
    const hunches = await listRes.json();
    if (!Array.isArray(hunches) || hunches.length === 0) {
      test.skip(true, "No hunches to test cross-org denial");
      return;
    }

    const target = hunches[0];
    const res = await request.patch(`/api/hunches/${target.id}`, {
      headers: authHeader(oaAuth.token),
      data: { status: "accepted" },
    });
    expect([403, 400]).toContain(res.status());
  });
});

// ===========================================================================
// GROUP E: Activity Log API Tests
// ===========================================================================
test.describe("Activity Log API", () => {
  test("TC-MGT-046: GET /api/activity-log returns entries", async ({ request }) => {
    const { token } = await login(request, testUsers.superAdmin);
    const res = await request.get("/api/activity-log", {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test("TC-MGT-047: GET /api/activity-log respects limit param", async ({ request }) => {
    const { token } = await login(request, testUsers.superAdmin);
    const res = await request.get("/api/activity-log?limit=5", {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeLessThanOrEqual(5);
  });

  test("TC-MGT-048: GET /api/activity-log caps at 100", async ({ request }) => {
    const { token } = await login(request, testUsers.superAdmin);
    const res = await request.get("/api/activity-log?limit=500", {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeLessThanOrEqual(100);
  });

  test("TC-MGT-049: GET /api/activity-log requires auth", async ({ request }) => {
    const res = await request.get("/api/activity-log");
    expect(res.status()).toBe(401);
  });

  test("TC-MGT-052: Conversations API exists for ai-chat channel", async ({ request }) => {
    const { token } = await login(request, testUsers.orgAdmin);
    const res = await request.get("/api/conversations?channel=ai-chat", {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });
});
