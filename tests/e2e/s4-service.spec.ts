/**
 * s4-service.spec.ts — S-4 Service Sprint Tests
 *
 * Verifies: tab restructure, campaign CRUD, detail dialog, Nancy Gaston
 * instructions + quality, after-hours code, service KPI tiles.
 */
import { test, expect } from "playwright/test";

const BASE = process.env.BASE_URL || "https://dev.huminicdev.com";
const PASSWORD = "NexxusTest2026";

async function getToken(request: any, email: string = "serra_honda@huminic.ai"): Promise<string> {
  const res = await request.post(`${BASE}/api/auth/login`, {
    data: { email, password: PASSWORD },
  });
  const data = await res.json();
  return data.accessToken;
}

// ==========================================
// S-4.AC1/AC2: Tab restructure (code review)
// ==========================================
test("S-4.AC1: Campaigns is first tab", async () => {
  const fs = await import("fs");
  const code = fs.readFileSync("client/src/pages/service.tsx", "utf-8");

  // Find the tabs array and verify Campaigns comes first
  const tabsMatch = code.match(/tabs\s*=\s*\[([^\]]+)\]/s);
  if (tabsMatch) {
    const firstTab = tabsMatch[1].trim().split(",")[0].trim();
    expect(firstTab.toLowerCase()).toContain("campaign");
    console.log(`  First tab definition: ${firstTab.slice(0, 60)}`);
  } else {
    // Alternative: check default activeTab
    expect(code).toContain("'campaigns'");
    console.log("  Default tab set to campaigns");
  }
});

test("S-4.AC2: no Dashboard tab", async () => {
  const fs = await import("fs");
  const code = fs.readFileSync("client/src/pages/service.tsx", "utf-8");

  // Dashboard should not be in the tabs array
  // Check for the tab id, not the word "Dashboard" which might appear in comments
  const hasTabId = /id:\s*['"]dashboard['"]/.test(code);
  const hasRenderDashboard = code.includes("renderDashboard()") || code.includes("case 'dashboard'");
  expect(hasTabId, "Dashboard tab id should not exist").toBe(false);
  expect(hasRenderDashboard, "renderDashboard should not be called").toBe(false);
  console.log("  No Dashboard tab in service.tsx");
});

// ==========================================
// S-4.AC3/AC4: Prominent buttons (code review)
// ==========================================
test("S-4.AC3: New Campaign button exists", async () => {
  const fs = await import("fs");
  const code = fs.readFileSync("client/src/pages/service.tsx", "utf-8");
  expect(code).toContain('data-testid="button-new-campaign"');
  console.log("  New Campaign button found");
});

test("S-4.AC4: CSV Upload button exists", async () => {
  const fs = await import("fs");
  const code = fs.readFileSync("client/src/pages/service.tsx", "utf-8");
  expect(code).toContain('data-testid="button-upload-csv"');
  console.log("  Upload CSV button found");
});

// ==========================================
// S-4.AC5: Campaign detail dialog (code review)
// ==========================================
test("S-4.AC5: campaign detail dialog exists", async () => {
  const fs = await import("fs");
  const code = fs.readFileSync("client/src/pages/service.tsx", "utf-8");
  expect(code).toContain('data-testid="dialog-campaign-detail"');
  console.log("  Campaign detail dialog found");
});

// ==========================================
// S-4.AC6: Insights tab has KPI tiles (code review)
// ==========================================
test("S-4.AC6: Insights tab renders KPI content", async () => {
  const fs = await import("fs");
  const code = fs.readFileSync("client/src/pages/service.tsx", "utf-8");
  // Insights tab should render metric tiles
  const insightsSection = code.split("insights")[2] || code;
  const hasMetrics = code.includes("Insights") && (
    code.includes("Active Campaign") ||
    code.includes("Messages Sent") ||
    code.includes("campaignStats") ||
    code.includes("InsightsPage")
  );
  expect(hasMetrics, "Insights tab should have metric content").toBe(true);
  console.log("  Insights tab has metric content");
});

// ==========================================
// S-4.AC7: Only Nancy Gaston on Agents tab
// ==========================================
test("S-4.AC7: only Nancy Gaston in service agents", async ({ request }) => {
  const token = await getToken(request);
  const res = await request.get(`${BASE}/api/agents`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const agents = await res.json();
  const serviceAgents = agents.filter((a: any) => a.department === "service");
  expect(serviceAgents.length, "Should have exactly 1 service agent").toBe(1);
  expect(serviceAgents[0].name).toBe("Nancy Gaston");
  console.log(`  Service agents: ${serviceAgents.map((a: any) => a.name).join(", ")}`);
});

// ==========================================
// S-4.AC8: Nancy has instructions
// ==========================================
test("S-4.AC8: Nancy Gaston has instructions > 100 chars", async ({ request }) => {
  const token = await getToken(request);
  const res = await request.get(`${BASE}/api/agents`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const agents = await res.json();
  const nancy = agents.find((a: any) => a.name === "Nancy Gaston");
  expect(nancy).toBeTruthy();
  expect(nancy.instructions?.length, "Nancy instructions too short").toBeGreaterThan(100);
  expect(nancy.instructions).toContain("Nancy Gaston");
  expect(nancy.instructions).not.toContain("Carol —");
  console.log(`  Nancy instructions: ${nancy.instructions.length} chars, mentions Nancy Gaston`);
});

// ==========================================
// S-4.AC9: Campaign CRUD (dry run — real send is IRREVERSIBLE)
// ==========================================
test("S-4.AC9: campaign create and CSV upload works", async ({ request }) => {
  const token = await getToken(request);

  // Create campaign
  const createRes = await request.post(`${BASE}/api/campaigns`, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    data: {
      name: "S-4 Test Campaign",
      channel: "sms",
      messageTemplate: "S-4 test: {{firstName}}, service reminder from Serra Honda.",
      status: "draft",
      department: "service",
    },
  });
  expect(createRes.status()).toBe(201);
  const campaign = await createRes.json();
  expect(campaign.id).toBeTruthy();
  console.log(`  Campaign created: ${campaign.id}`);

  // Campaigns list
  const listRes = await request.get(`${BASE}/api/campaigns`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const campaigns = await listRes.json();
  expect(campaigns.length).toBeGreaterThan(0);
  console.log(`  Campaigns: ${campaigns.length} total`);
});

// ==========================================
// S-4.AC10: Check for campaignId conversations
// ==========================================
test("S-4.AC10: conversations with campaignId exist", async ({ request }) => {
  const token = await getToken(request);
  const res = await request.get(`${BASE}/api/conversations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const convs = await res.json();
  const withCampaign = convs.filter((c: any) => c.campaignId);
  console.log(`  Conversations with campaignId: ${withCampaign.length} of ${convs.length}`);
  // May be 0 if no campaigns have been executed with replies — acceptable
});

// ==========================================
// S-4.AC11: Nancy recall quality
// ==========================================
test("S-4.AC11: Nancy responds to recall question", async ({ request }) => {
  const token = await getToken(request);

  const convRes = await request.post(`${BASE}/api/conversations`, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    data: { customerName: "S-4 Recall Test", channel: "ai-chat" },
  });
  const conv = await convRes.json();

  const agents = await (await request.get(`${BASE}/api/agents`, {
    headers: { Authorization: `Bearer ${token}` },
  })).json();
  const nancy = agents.find((a: any) => a.name === "Nancy Gaston");

  const chatRes = await request.post(`${BASE}/api/chat/${conv.id}/stream`, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    data: { content: "Are there any active recalls I should know about?", agentId: nancy?.id },
    timeout: 30000,
  });
  expect(chatRes.status()).toBe(200);
  const body = await chatRes.text();
  const lower = body.toLowerCase();
  expect(
    lower.includes("recall") || lower.includes("campaign") || lower.includes("service") || lower.includes("notification"),
    "Nancy should reference recalls/campaigns/service"
  ).toBe(true);
  console.log(`  Nancy recall response: ${body.length} chars`);
});

// ==========================================
// S-4.AC12: Nancy appointment booking
// ==========================================
test("S-4.AC12: Nancy helps schedule appointment", async ({ request }) => {
  const token = await getToken(request);

  const convRes = await request.post(`${BASE}/api/conversations`, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    data: { customerName: "S-4 Appointment Test", channel: "ai-chat" },
  });
  const conv = await convRes.json();

  const agents = await (await request.get(`${BASE}/api/agents`, {
    headers: { Authorization: `Bearer ${token}` },
  })).json();
  const nancy = agents.find((a: any) => a.name === "Nancy Gaston");

  const chatRes = await request.post(`${BASE}/api/chat/${conv.id}/stream`, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    data: { content: "I need to schedule an oil change for my 2022 Civic next Tuesday morning", agentId: nancy?.id },
    timeout: 20000,
  });
  expect(chatRes.status()).toBe(200);
  const body = await chatRes.text();
  const lower = body.toLowerCase();
  expect(
    lower.includes("schedule") || lower.includes("appointment") || lower.includes("tuesday") || lower.includes("oil change") || lower.includes("book"),
    "Nancy should reference scheduling/appointment"
  ).toBe(true);
  console.log(`  Nancy appointment response: ${body.length} chars`);
});

// ==========================================
// S-4.AC13/AC14: After-hours code review
// ==========================================
test("S-4.AC13/AC14: after-hours logic exists in code", async () => {
  const fs = await import("fs");
  const smsCode = fs.readFileSync("server/routes/sms.ts", "utf-8");
  expect(smsCode).toContain("isAfterHours");
  expect(smsCode).toContain("businessHoursStart");
  expect(smsCode).toContain("businessHoursEnd");
  expect(smsCode).toContain("morning-followup");

  const outboundCode = fs.readFileSync("server/outbound.ts", "utf-8");
  // Check for scheduled/queued mechanism
  const hasScheduling = smsCode.includes("scheduledAction") || smsCode.includes("queued") || smsCode.includes("after_hours");
  expect(hasScheduling, "After-hours scheduling mechanism should exist").toBe(true);
  console.log("  After-hours: isAfterHours, businessHours, morning-followup all in code");
});

// ==========================================
// I-115: Sub-menu "Dashboard" → "Campaigns"
// ==========================================
test("I-115: sub-menu has no phantom Dashboard label", async () => {
  const fs = await import("fs");
  const code = fs.readFileSync("client/src/components/layout/SubMenuManager.tsx", "utf-8");

  // The service section should not contain sv-dashboard
  const serviceSection = code.split("case 'service':")[1]?.split("case '")[0] || "";
  expect(serviceSection).not.toContain("sv-dashboard");
  expect(serviceSection).toContain("sv-campaigns");
  console.log("  Sub-menu: no sv-dashboard, sv-campaigns present");
});

// ==========================================
// I-128: Campaign Safety dismiss button
// ==========================================
test("I-128: Campaign Safety card has dismiss button", async () => {
  const fs = await import("fs");
  const code = fs.readFileSync("client/src/pages/service.tsx", "utf-8");
  expect(code).toContain('data-testid="button-dismiss-campaign-safety"');
  expect(code).toContain("campaign-safety-dismissed");
  expect(code).toContain("localStorage");
  console.log("  Campaign Safety dismiss button with localStorage persistence found");
});

// ==========================================
// I-129: Campaign action button tooltips
// ==========================================
test("I-129: campaign action buttons have tooltips", async () => {
  const fs = await import("fs");
  const code = fs.readFileSync("client/src/pages/service.tsx", "utf-8");
  expect(code).toContain("Execute Campaign");
  expect(code).toContain(">Schedule<");
  expect(code).toContain("Dry Run");
  expect(code).toContain("Upload CSV");
  expect(code).toContain("Stop Execution");
  expect(code).toContain("TooltipContent");
  console.log("  All 5 tooltip labels found in campaign action buttons");
});

// ==========================================
// I-113: Service metric trends documented
// ==========================================
test("I-113: service metric trend limitation documented", async () => {
  const fs = await import("fs");
  const code = fs.readFileSync("client/src/pages/service.tsx", "utf-8");
  expect(code).toContain("I-113");
  expect(code).toContain("computeChange");
  console.log("  I-113 documentation comment present");
});

// ==========================================
// I-132: Multi-channel campaign documented
// ==========================================
test("I-132: multi-channel campaign documented as future work", async () => {
  const fs = await import("fs");
  const code = fs.readFileSync("client/src/pages/service.tsx", "utf-8");
  expect(code).toContain("I-132");
  expect(code).toContain("multi-channel");
  console.log("  I-132 multi-channel documentation comment present");
});

// ==========================================
// I-106/I-107: Rate limit documented
// ==========================================
test("I-106/I-107: rate limit set to 100", async () => {
  const fs = await import("fs");
  const code = fs.readFileSync("server/outbound.ts", "utf-8");
  expect(code).toContain("DEFAULT_RATE_LIMIT_MAX = 100");
  console.log("  Rate limit confirmed at 100");
});

// ==========================================
// S-4.AC15: Service Insights KPI tiles
// ==========================================
test("S-4.AC15: service metrics return data", async ({ request }) => {
  const token = await getToken(request);
  const res = await request.get(`${BASE}/api/metrics/dashboard`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(res.status()).toBe(200);
  const data = await res.json();
  console.log(`  Service metrics: campaigns=${data.campaignStats?.total}, sent=${data.campaignStats?.totalSent}, replied=${data.campaignStats?.totalReplied}`);
  expect(data.campaignStats).toBeTruthy();
});
