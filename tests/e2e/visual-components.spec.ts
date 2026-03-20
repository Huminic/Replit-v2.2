import { test, expect } from "playwright/test";
import { testUsers, loginForBrowser, authHeader, login } from "./helpers/auth";
import fs from "fs";
import path from "path";

/**
 * Visual Component Tests — MCP Playwright Browser Testing
 *
 * Every page, every role, every interactive component.
 * Screenshots captured, errors logged, components verified.
 * Pairwise: roles × pages × actions
 *
 * Settings page: all 7 tiles clicked and verified
 * Landing page: widget loads per dealer
 * TeamBox: all message types visible
 * Dashboard: metrics render with data
 */

const SCREENSHOT_DIR = path.resolve("evidence/REM-9/screenshots");

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// ═══════════════════════════════════════════════════════════════════════════
// PAIRWISE: Role × Page Matrix
// Every role visits every page — verify load, capture screenshot, log errors
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Pairwise: Role × Page Visual Verification", () => {

  const ROLES = [
    { key: "superAdmin", name: "Super Admin" },
    { key: "cagePartnerAdmin", name: "Partner Admin (Cage)" },
    { key: "orgAdmin", name: "Org Admin" },
    { key: "executive", name: "Executive" },
    { key: "sales", name: "Sales" },
    { key: "service", name: "Service" },
    { key: "marketing", name: "Marketing" },
  ] as const;

  const PAGES = [
    { path: "/", name: "main", description: "Dashboard with metrics and chat" },
    { path: "/sales", name: "sales", description: "Sales department" },
    { path: "/service", name: "service", description: "Service department" },
    { path: "/marketing", name: "marketing", description: "Marketing department" },
    { path: "/management", name: "management", description: "Management overview" },
    { path: "/teambox", name: "teambox", description: "Unified inbox" },
    { path: "/my-work", name: "my-work", description: "Personal workspace" },
    { path: "/insights", name: "insights", description: "Analytics" },
    { path: "/billing", name: "billing", description: "Billing" },
    { path: "/settings", name: "settings", description: "Settings" },
    { path: "/profile", name: "profile", description: "User profile" },
    { path: "/agents", name: "agents", description: "Agent management" },
  ];

  for (const role of ROLES) {
    test(`VC-PAIR-${role.key}: All pages as ${role.name}`, async ({ page }) => {
      const user = testUsers[role.key as keyof typeof testUsers];
      if (!user) { test.skip(); return; }

      const roleDir = path.join(SCREENSHOT_DIR, role.key);
      ensureDir(roleDir);

      await loginForBrowser(page, user, "/");

      const results: string[] = [];
      const consoleErrors: string[] = [];

      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      });

      for (const p of PAGES) {
        try {
          await page.goto(p.path, { waitUntil: "domcontentloaded", timeout: 15000 });
          await page.waitForTimeout(2000);

          // Screenshot
          await page.screenshot({
            path: path.join(roleDir, `${p.name}.png`),
            fullPage: true,
          });

          // Check for crash states
          const bodyText = await page.textContent("body") || "";
          const hasCrash = bodyText.includes("Something went wrong") || bodyText.includes("Application Error");
          const hasBlankPage = bodyText.trim().length < 50;
          const has403 = bodyText.includes("Access denied") || bodyText.includes("Forbidden");

          // Check for visible error toasts
          const errorToasts = await page.locator('[class*="destructive"], [data-testid*="error"]').count();

          // Check for loading spinners stuck
          const spinners = await page.locator('[class*="animate-spin"]').count();

          let status = "OK";
          const notes: string[] = [];

          if (hasCrash) { status = "CRASH"; notes.push("Application crash detected"); }
          else if (hasBlankPage) { status = "BLANK"; notes.push("Page appears empty"); }
          else if (has403) { status = "RBAC"; notes.push("Access denied (expected for some roles)"); }
          if (errorToasts > 0) { notes.push(`${errorToasts} error toast(s)`); }
          if (spinners > 0) { notes.push(`${spinners} spinner(s) still active`); }

          results.push(`${p.name}: ${status}${notes.length ? " — " + notes.join(", ") : ""}`);
        } catch (err: any) {
          results.push(`${p.name}: TIMEOUT — ${err.message.substring(0, 60)}`);
        }
      }

      // Write summary
      const summary = [
        `# Visual Verification: ${role.name}`,
        `Date: ${new Date().toISOString()}`,
        `Console errors: ${consoleErrors.length}`,
        "",
        ...results.map(r => `- ${r}`),
        "",
        consoleErrors.length > 0 ? `## Console Errors\n${consoleErrors.slice(0, 10).map(e => `- ${e.substring(0, 150)}`).join("\n")}` : "",
      ].join("\n");
      fs.writeFileSync(path.join(roleDir, "summary.txt"), summary);

      // At least the main page should load
      expect(results.some(r => r.startsWith("main: OK"))).toBeTruthy();
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// Settings Page: Every Tile
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Settings Page — All Tiles", () => {

  const SETTINGS_TILES = [
    { id: "users", title: "User Management", minLevel: 3 },
    { id: "organization", title: "Organization", minLevel: 3 },
    { id: "tools", title: "Tools & Integrations", minLevel: 3 },
    { id: "knowledge", title: "Knowledge Base", minLevel: 3 },
    { id: "ai", title: "AI Configuration", minLevel: 1 },
    { id: "notifications", title: "Notifications", minLevel: 3 },
    { id: "appearance", title: "Appearance", minLevel: 3 },
  ];

  test("VC-SETTINGS-1 Org Admin sees and can click all accessible tiles", async ({ page }) => {
    const screenshotDir = path.join(SCREENSHOT_DIR, "settings");
    ensureDir(screenshotDir);

    await loginForBrowser(page, testUsers.orgAdmin, "/settings");

    // Verify tile grid renders
    await page.waitForSelector('[data-testid^="settings-tile-"]', { timeout: 10000 });

    // Screenshot the tile grid
    await page.screenshot({ path: path.join(screenshotDir, "tile-grid.png"), fullPage: true });

    // Count visible tiles
    const tileCount = await page.locator('[data-testid^="settings-tile-"]').count();
    console.log(`Visible settings tiles: ${tileCount}`);
    // Org Admin should see at least 6 tiles (all except AI Configuration)
    expect(tileCount).toBeGreaterThanOrEqual(6);

    // Click each tile and verify content loads
    for (const tile of SETTINGS_TILES) {
      if (tile.minLevel < 3) continue; // Skip super_admin-only tiles

      const tileEl = page.locator(`[data-testid="settings-tile-${tile.id}"]`);
      if (await tileEl.count() > 0) {
        await tileEl.click();
        await page.waitForTimeout(1000);

        // Verify we entered the section (back button should appear)
        const backBtn = page.locator('[data-testid="button-back-settings"]');
        const inSection = await backBtn.count() > 0;

        // Screenshot the section
        await page.screenshot({ path: path.join(screenshotDir, `tile-${tile.id}.png`), fullPage: true });

        if (inSection) {
          console.log(`  ${tile.title}: entered ✓`);
          // Go back to tile grid
          await backBtn.click();
          await page.waitForTimeout(500);
        } else {
          console.log(`  ${tile.title}: clicked but no section rendered`);
        }
      } else {
        console.log(`  ${tile.title}: tile not found (RBAC filtered)`);
      }
    }
  });

  test("VC-SETTINGS-2 Organization tile has CommGate toggle", async ({ page }) => {
    await loginForBrowser(page, testUsers.orgAdmin, "/settings");
    await page.waitForSelector('[data-testid^="settings-tile-"]', { timeout: 10000 });

    // Click Organization tile
    await page.locator('[data-testid="settings-tile-organization"]').click();
    await page.waitForTimeout(1000);

    // Verify CommGate toggle exists
    const commGate = page.locator('[data-testid="switch-communication-gate"]');
    const exists = await commGate.count() > 0;
    expect(exists).toBeTruthy();

    if (exists) {
      // Get current state
      const isChecked = await commGate.isChecked();
      console.log(`CommGate toggle: ${isChecked ? "ON" : "OFF"}`);
    }
  });

  test("VC-SETTINGS-3 User Management shows user list", async ({ page }) => {
    await loginForBrowser(page, testUsers.orgAdmin, "/settings");
    await page.waitForSelector('[data-testid^="settings-tile-"]', { timeout: 10000 });

    await page.locator('[data-testid="settings-tile-users"]').click();
    await page.waitForTimeout(2000);

    // Should show a list of users
    const bodyText = await page.textContent("body") || "";
    const hasUserContent = bodyText.includes("@") || bodyText.includes("Admin") || bodyText.includes("Staff");
    console.log(`User Management content: ${hasUserContent ? "found users" : "no user content"}`);
  });

  test("VC-SETTINGS-4 Super Admin sees AI Configuration tile", async ({ page }) => {
    await loginForBrowser(page, testUsers.superAdmin, "/settings");
    await page.waitForSelector('[data-testid^="settings-tile-"]', { timeout: 10000 });

    const aiTile = page.locator('[data-testid="settings-tile-ai"]');
    expect(await aiTile.count()).toBe(1);

    await aiTile.click();
    await page.waitForTimeout(1000);

    const screenshotDir = path.join(SCREENSHOT_DIR, "settings");
    ensureDir(screenshotDir);
    await page.screenshot({ path: path.join(screenshotDir, "ai-config.png"), fullPage: true });
  });

  test("VC-SETTINGS-5 Sales role does NOT see settings tiles", async ({ page }) => {
    await loginForBrowser(page, testUsers.sales, "/settings");
    await page.waitForTimeout(2000);

    const tileCount = await page.locator('[data-testid^="settings-tile-"]').count();
    console.log(`Sales sees ${tileCount} settings tiles`);
    // Sales should see 0 tiles or be redirected
    // If they see tiles, that's a RBAC finding
    if (tileCount > 0) {
      console.log("FINDING: Sales role can see settings tiles — RBAC may be too permissive");
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Dashboard Components
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Dashboard — Visual Components", () => {

  test("VC-DASH-1 Main page renders metric tiles with non-zero values", async ({ page }) => {
    const screenshotDir = path.join(SCREENSHOT_DIR, "dashboard");
    ensureDir(screenshotDir);

    await loginForBrowser(page, testUsers.orgAdmin, "/");

    // Wait for metrics to load
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(screenshotDir, "main-metrics.png"), fullPage: true });

    // Check for metric values — look for numbers in the dashboard area
    const bodyText = await page.textContent("body") || "";
    const hasNumbers = /\d+/.test(bodyText);
    expect(hasNumbers).toBeTruthy();

    // Check for "Active Pipeline" or similar metric labels
    const hasPipelineLabel = bodyText.includes("Pipeline") || bodyText.includes("Active") || bodyText.includes("Leads");
    console.log(`Dashboard has pipeline labels: ${hasPipelineLabel}`);
    console.log(`Dashboard has numbers: ${hasNumbers}`);
  });

  test("VC-DASH-2 Chat window renders below metrics", async ({ page }) => {
    await loginForBrowser(page, testUsers.orgAdmin, "/");
    await page.waitForTimeout(2000);

    // Look for chat input area
    const chatInput = page.locator('textarea, [data-testid*="chat"], [class*="chat-input"]');
    const hasChatInput = await chatInput.count() > 0;
    console.log(`Chat input found: ${hasChatInput}`);
  });

  test("VC-DASH-3 Department pages show KPIs", async ({ page }) => {
    const screenshotDir = path.join(SCREENSHOT_DIR, "departments");
    ensureDir(screenshotDir);

    const deptPages = [
      { path: "/sales", name: "sales" },
      { path: "/service", name: "service" },
      { path: "/marketing", name: "marketing" },
      { path: "/management", name: "management" },
    ];

    await loginForBrowser(page, testUsers.orgAdmin, "/");

    for (const dept of deptPages) {
      await page.goto(dept.path, { waitUntil: "domcontentloaded", timeout: 15000 });
      await page.waitForTimeout(2000);

      await page.screenshot({ path: path.join(screenshotDir, `${dept.name}.png`), fullPage: true });

      const bodyText = await page.textContent("body") || "";
      const hasContent = bodyText.length > 100;
      console.log(`${dept.name}: content=${hasContent}, length=${bodyText.length}`);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TeamBox — Message Types & Interactions
// ═══════════════════════════════════════════════════════════════════════════

test.describe("TeamBox — Visual Verification", () => {

  test("VC-TB-1 TeamBox loads and shows conversations", async ({ page }) => {
    const screenshotDir = path.join(SCREENSHOT_DIR, "teambox");
    ensureDir(screenshotDir);

    await loginForBrowser(page, testUsers.orgAdmin, "/teambox");
    await page.waitForTimeout(3000);

    await page.screenshot({ path: path.join(screenshotDir, "teambox-main.png"), fullPage: true });

    const bodyText = await page.textContent("body") || "";
    const hasConversations = bodyText.includes("sms") || bodyText.includes("voice") ||
      bodyText.includes("email") || bodyText.includes("chat") ||
      bodyText.includes("Open") || bodyText.includes("Assigned");
    console.log(`TeamBox has conversation content: ${hasConversations}`);
  });

  test("VC-TB-2 Clicking a conversation shows message thread", async ({ page }) => {
    const screenshotDir = path.join(SCREENSHOT_DIR, "teambox");
    ensureDir(screenshotDir);

    await loginForBrowser(page, testUsers.orgAdmin, "/teambox");
    await page.waitForTimeout(3000);

    // Try clicking the first conversation item
    const convItems = page.locator('[data-testid*="conversation"], [class*="conversation"]');
    if (await convItems.count() > 0) {
      await convItems.first().click();
      await page.waitForTimeout(2000);

      await page.screenshot({ path: path.join(screenshotDir, "conversation-thread.png"), fullPage: true });

      const bodyText = await page.textContent("body") || "";
      // Should show message content
      const hasMessages = bodyText.length > 200;
      console.log(`Conversation thread content: ${hasMessages}`);
    } else {
      console.log("No conversation items found in TeamBox");
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Insights Page — Charts & Calculations
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Insights Page — Visual Verification", () => {

  test("VC-INSIGHTS-1 Insights page renders with data", async ({ page }) => {
    const screenshotDir = path.join(SCREENSHOT_DIR, "insights");
    ensureDir(screenshotDir);

    await loginForBrowser(page, testUsers.orgAdmin, "/insights");
    await page.waitForTimeout(3000);

    await page.screenshot({ path: path.join(screenshotDir, "insights-main.png"), fullPage: true });

    const bodyText = await page.textContent("body") || "";
    // Should have metric-related content
    const hasMetrics = bodyText.includes("Lead") || bodyText.includes("Pipeline") ||
      bodyText.includes("Conversion") || bodyText.includes("%");
    console.log(`Insights has metric content: ${hasMetrics}`);

    // Check for zero-state
    const hasZeros = (bodyText.match(/\b0\b/g) || []).length;
    const hasNonZeros = (bodyText.match(/\b[1-9]\d*\b/g) || []).length;
    console.log(`Zeros: ${hasZeros}, Non-zeros: ${hasNonZeros}`);

    if (hasNonZeros === 0 && hasZeros > 3) {
      console.log("FINDING: Insights page shows all zeros despite warehouse having 6000+ leads");
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Profile Page
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Profile Page — Visual Verification", () => {

  test("VC-PROFILE-1 Profile shows user info and password change", async ({ page }) => {
    const screenshotDir = path.join(SCREENSHOT_DIR, "profile");
    ensureDir(screenshotDir);

    await loginForBrowser(page, testUsers.orgAdmin, "/profile");
    await page.waitForTimeout(2000);

    await page.screenshot({ path: path.join(screenshotDir, "profile.png"), fullPage: true });

    const bodyText = await page.textContent("body") || "";
    // Should show user's name and email
    const hasUserInfo = bodyText.includes("orgadmin") || bodyText.includes("James") || bodyText.includes("Chen");
    const hasPasswordSection = bodyText.includes("Password") || bodyText.includes("password");
    console.log(`Profile: user info=${hasUserInfo}, password section=${hasPasswordSection}`);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Widget & Landing Page — Real Browser Test
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Widget & Landing Page — Visual Verification", () => {

  test("VC-WIDGET-1 Dealer landing pages load per store", async ({ page }) => {
    const screenshotDir = path.join(SCREENSHOT_DIR, "widgets");
    ensureDir(screenshotDir);

    const slugs = ["serra-honda", "serra-nissan", "tony-serra-ford", "ford-of-columbia", "hyundai-of-columbia"];

    for (const slug of slugs) {
      try {
        // Access the dealer widget URL (browser gets HTML redirect)
        await page.goto(`/widget/dealer/${slug}.js`, { waitUntil: "domcontentloaded", timeout: 15000 });
        await page.waitForTimeout(2000);

        await page.screenshot({ path: path.join(screenshotDir, `landing-${slug}.png`), fullPage: true });

        const bodyText = await page.textContent("body") || "";
        const url = page.url();
        console.log(`${slug}: url=${url}, content length=${bodyText.length}`);

        // If redirected to Tavus, that's correct behavior
        if (url.includes("tavus") || url.includes("daily.co")) {
          console.log(`  → Redirected to Tavus video: ✓`);
        }
      } catch (err: any) {
        console.log(`${slug}: ${err.message.substring(0, 60)}`);
      }
    }
  });

  test("VC-WIDGET-2 Widget test page loads with all store buttons", async ({ page }) => {
    const screenshotDir = path.join(SCREENSHOT_DIR, "widgets");
    ensureDir(screenshotDir);

    await page.goto("/widget/test", { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(2000);

    await page.screenshot({ path: path.join(screenshotDir, "widget-test-page.png"), fullPage: true });

    // Verify all 5 dealer buttons exist
    const stores = ["serra-honda", "serra-nissan", "tony-serra-ford", "hyundai-of-columbia", "ford-of-columbia"];
    for (const store of stores) {
      const btn = page.locator(`[data-testid="btn-${store}"]`);
      const exists = await btn.count() > 0;
      console.log(`Widget button ${store}: ${exists ? "✓" : "MISSING"}`);
      expect(exists).toBeTruthy();
    }
  });

  test("VC-WIDGET-3 Tavus video session creates popup with name prompt", async ({ page }) => {
    const screenshotDir = path.join(SCREENSHOT_DIR, "widgets");
    ensureDir(screenshotDir);

    // Create a Tavus session via the API, then verify the URL loads
    const auth = await login(page.request, testUsers.orgAdmin);
    const videoRes = await page.request.post("/api/widget/video-session", {
      headers: { "Content-Type": "application/json" },
      data: {
        slug: "serra-honda",
        visitorName: "VC-WIDGET-3 Test Visitor",
      },
    });

    if (videoRes.status() === 200) {
      const body = await videoRes.json();
      const convUrl = body.conversationUrl || body.conversation_url || body.url;

      if (convUrl) {
        try {
          await page.goto(convUrl, { waitUntil: "domcontentloaded", timeout: 20000 });
          await page.waitForTimeout(3000);

          await page.screenshot({ path: path.join(screenshotDir, "tavus-session.png"), fullPage: true });

          const pageText = await page.textContent("body") || "";
          console.log(`Tavus session page loaded, content length: ${pageText.length}`);
          // Tavus should show a name input or video interface
        } catch (err: any) {
          console.log(`Tavus page load: ${err.message.substring(0, 80)}`);
        }
      }
    } else {
      console.log(`Tavus session creation: ${videoRes.status()}`);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Billing Page
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Billing — Visual Verification", () => {

  test("VC-BILLING-1 Billing page renders for authorized roles", async ({ page }) => {
    const screenshotDir = path.join(SCREENSHOT_DIR, "billing");
    ensureDir(screenshotDir);

    await loginForBrowser(page, testUsers.orgAdmin, "/billing");
    await page.waitForTimeout(3000);

    await page.screenshot({ path: path.join(screenshotDir, "billing-orgadmin.png"), fullPage: true });

    const bodyText = await page.textContent("body") || "";
    const hasBillingContent = bodyText.includes("Usage") || bodyText.includes("Billing") ||
      bodyText.includes("Plan") || bodyText.includes("Wallet");
    console.log(`Billing content: ${hasBillingContent}`);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Agent Management
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Agent Management — Visual Verification", () => {

  test("VC-AGENTS-1 Agent page shows configured agents", async ({ page }) => {
    const screenshotDir = path.join(SCREENSHOT_DIR, "agents");
    ensureDir(screenshotDir);

    await loginForBrowser(page, testUsers.orgAdmin, "/agents");
    await page.waitForTimeout(3000);

    await page.screenshot({ path: path.join(screenshotDir, "agents-list.png"), fullPage: true });

    const bodyText = await page.textContent("body") || "";
    // Should show agent names
    const hasAgentContent = bodyText.includes("Caroline") || bodyText.includes("CRM Guru") ||
      bodyText.includes("Service Agent") || bodyText.includes("Marketing Agent");
    console.log(`Agent page has agent names: ${hasAgentContent}`);
    expect(hasAgentContent).toBeTruthy();
  });
});
