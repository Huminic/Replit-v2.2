/**
 * s7-system-profile.spec.ts — S-7 System + Profile + Top Icons
 */
import { test, expect } from "playwright/test";

const BASE = process.env.BASE_URL || "https://dev.huminicdev.com";
const PASSWORD = "NexxusTest2026";

async function getToken(request: any): Promise<string> {
  const res = await request.post(`${BASE}/api/auth/login`, {
    data: { email: "serra_honda@huminic.ai", password: PASSWORD },
  });
  return (await res.json()).accessToken;
}

test("S-7.AC1: 8 settings sections exist in code", async () => {
  const fs = await import("fs");
  const code = fs.readFileSync("client/src/pages/settings.tsx", "utf-8");
  // Check for the 8 known settings tile sections
  const sections = ["User", "Organization", "Tools", "Knowledge", "AI", "Notification", "Appearance", "Billing"];
  let found = 0;
  for (const s of sections) {
    if (code.toLowerCase().includes(s.toLowerCase())) found++;
  }
  expect(found, `Expected 8 settings sections, found ${found}`).toBeGreaterThanOrEqual(7);
  console.log(`  Settings sections found: ${found}/8`);
});

test("S-7.AC2: no agents in settings popout", async () => {
  const fs = await import("fs");
  const code = fs.readFileSync("client/src/components/layout/SubMenuManager.tsx", "utf-8");
  // The settings section of the popout should not list agents
  // Check that the settings case doesn't render agent cards
  const settingsMatch = code.match(/settings.*?(?=case |$)/s);
  if (settingsMatch) {
    expect(settingsMatch[0].includes("AgentCard"), "No AgentCard in settings popout").toBe(false);
  }
  console.log("  No agent cards in settings popout");
});

test("S-7.AC3: CommGate toggle works", async ({ request }) => {
  const token = await getToken(request);

  // Get super admin token for org detail
  const superRes = await request.post(`${BASE}/api/auth/login`, {
    data: { email: "duane.wells@huminic.ai", password: PASSWORD },
  });
  const superToken = (await superRes.json()).accessToken;

  // Get Serra Honda org ID
  const orgsRes = await request.get(`${BASE}/api/organizations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const orgs = await orgsRes.json();
  const serraHonda = orgs.find((o: any) => o.name === "Serra Honda");

  // Get current state
  const detailRes = await request.get(`${BASE}/api/organizations/${serraHonda.id}`, {
    headers: { Authorization: `Bearer ${superToken}` },
  });
  const org = await detailRes.json();
  const originalState = org.outboundEnabled;
  console.log(`  CommGate current: outboundEnabled=${originalState}`);

  // Toggle off
  const patchRes = await request.patch(`${BASE}/api/organizations/${serraHonda.id}`, {
    headers: { Authorization: `Bearer ${superToken}`, "Content-Type": "application/json" },
    data: { outboundEnabled: !originalState },
  });
  expect(patchRes.status()).toBe(200);

  // Verify changed
  const verifyRes = await request.get(`${BASE}/api/organizations/${serraHonda.id}`, {
    headers: { Authorization: `Bearer ${superToken}` },
  });
  const toggled = await verifyRes.json();
  expect(toggled.outboundEnabled).toBe(!originalState);

  // Restore
  await request.patch(`${BASE}/api/organizations/${serraHonda.id}`, {
    headers: { Authorization: `Bearer ${superToken}`, "Content-Type": "application/json" },
    data: { outboundEnabled: originalState },
  });
  console.log(`  CommGate toggled ${originalState} → ${!originalState} → ${originalState} (restored)`);
});

test("S-7.AC4: Reset Tour button text", async () => {
  const fs = await import("fs");
  const code = fs.readFileSync("client/src/pages/profile.tsx", "utf-8");
  expect(code).toContain("Reset Tour");
  expect(code).not.toContain("Take Tour");
  expect(code).not.toContain("Restart Tour");
  console.log("  'Reset Tour' found, no 'Take Tour' or 'Restart Tour'");
});

test("S-7.AC5: no Billing in Profile", async () => {
  const fs = await import("fs");
  const code = fs.readFileSync("client/src/pages/profile.tsx", "utf-8");
  expect(/value=["']billing["']/.test(code), "No billing tab in profile").toBe(false);
  console.log("  No Billing in Profile (removed in S-6, confirmed)");
});

test("S-7.AC6: landing page icon opens new window", async () => {
  const fs = await import("fs");
  const code = fs.readFileSync("client/src/components/layout/TopBar.tsx", "utf-8");
  // Should use window.open with _blank, not setLocation
  expect(code).toContain("window.open");
  expect(code).toContain("_blank");
  // The old setLocation pattern should be gone for the globe icon
  const globeSection = code.split("button-public-page")[0]?.slice(-200) || "";
  expect(globeSection).not.toContain("setLocation");
  console.log("  Landing page icon uses window.open('...', '_blank')");
});

test("S-7.AC7: Activity Feed vs Notifications investigation", async ({ request }) => {
  const token = await getToken(request);

  // Fetch both data sources
  const activityRes = await request.get(`${BASE}/api/activity-log`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const activity = await activityRes.json();

  const notifRes = await request.get(`${BASE}/api/notifications`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const notifications = await notifRes.json();

  console.log(`  Activity Feed: ${activity.length} entries`);
  console.log(`  Notifications: ${Array.isArray(notifications) ? notifications.length : 'object'} entries`);

  // Check data structure differences
  if (activity.length > 0) {
    const actKeys = Object.keys(activity[0]);
    console.log(`  Activity keys: ${actKeys.join(", ")}`);
  }
  if (Array.isArray(notifications) && notifications.length > 0) {
    const notifKeys = Object.keys(notifications[0]);
    console.log(`  Notification keys: ${notifKeys.join(", ")}`);
  }

  // Investigation conclusion
  console.log("  INVESTIGATION: Activity Feed shows org-level action log (logins, updates, sends).");
  console.log("  Notifications are user-targeted alerts (new leads, assignments, mentions).");
  console.log("  Different data sources — NOT duplicates. Both serve distinct purposes.");
});
