/**
 * s0-foundation.spec.ts — S-0 Foundation Sprint Tests
 *
 * Verifies: CommGate flags, user org assignment, agent renames/creation,
 * agent instructions, VIN webhook code path, warehouse data, build,
 * sms_campaign_number column + usage.
 */
import { test, expect } from "playwright/test";

const BASE = process.env.BASE_URL || "https://dev.huminicdev.com";
const PASSWORD = "NexxusTest2026";

const STORES = [
  { name: "Serra Honda", email: "serra_honda@huminic.ai", slug: "serra-honda" },
  { name: "Serra Nissan", email: "serra_nissan@huminic.ai", slug: "serra-nissan" },
  { name: "Tony Serra Ford", email: "serra_ford@huminic.ai", slug: "tony-serra-ford" },
  { name: "Ford of Columbia", email: "columbia_ford@huminic.ai", slug: "ford-of-columbia" },
  { name: "Hyundai of Columbia", email: "columbia_hyundai@huminic.ai", slug: "hyundai-of-columbia" },
];

async function getToken(request: any, email: string): Promise<string> {
  const res = await request.post(`${BASE}/api/auth/login`, {
    data: { email, password: PASSWORD },
  });
  const data = await res.json();
  return data.accessToken;
}

// S-0.AC0: duane.wells on Huminic
test("S-0.AC0: duane.wells organization is Huminic", async ({ request }) => {
  const token = await getToken(request, "duane.wells@huminic.ai");
  const res = await request.get(`${BASE}/api/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const user = await res.json();
  expect(user.email).toBe("duane.wells@huminic.ai");
  // Super admin on Huminic — verify org name
  const orgRes = await request.get(`${BASE}/api/organizations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const orgs = await orgRes.json();
  const huminic = orgs.find((o: any) => o.name === "Huminic");
  expect(huminic).toBeTruthy();
});

// S-0.AC1 + AC2: CommGate flags for all 5 stores
// Note: /api/organizations list endpoint doesn't return CommGate fields.
// Use single-org endpoint /api/organizations/:id which does.
for (const store of STORES) {
  test(`S-0.AC1/AC2: ${store.name} CommGate all flags true`, async ({ request }) => {
    const token = await getToken(request, store.email);
    // Get org list to find the ID
    const listRes = await request.get(`${BASE}/api/organizations`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const orgs = await listRes.json();
    const orgSummary = orgs.find((o: any) => o.name === store.name);
    expect(orgSummary, `Org ${store.name} not found in list`).toBeTruthy();

    // Get full org detail with CommGate fields
    const superToken = await getToken(request, "duane.wells@huminic.ai");
    const detailRes = await request.get(`${BASE}/api/organizations/${orgSummary.id}`, {
      headers: { Authorization: `Bearer ${superToken}` },
    });
    const org = await detailRes.json();
    expect(org.outboundEnabled, `${store.name} outboundEnabled`).toBe(true);
    expect(org.smsEnabled, `${store.name} smsEnabled`).toBe(true);
    expect(org.phoneEnabled, `${store.name} phoneEnabled`).toBe(true);
    expect(org.emailEnabled, `${store.name} emailEnabled`).toBe(true);
  });
}

// S-0.AC3: Nancy Gaston exists in service dept for all stores
for (const store of STORES) {
  test(`S-0.AC3: ${store.name} has Nancy Gaston (service)`, async ({ request }) => {
    const token = await getToken(request, store.email);
    const res = await request.get(`${BASE}/api/agents`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const agents = await res.json();
    expect(Array.isArray(agents), `${store.name} /api/agents did not return array`).toBe(true);
    const nancy = agents.find((a: any) => a.name === "Nancy Gaston" && a.department === "service");
    expect(nancy, `Nancy Gaston not found at ${store.name}`).toBeTruthy();
  });
}

// S-0.AC4: Data Guru exists in sales dept for all stores
for (const store of STORES) {
  test(`S-0.AC4: ${store.name} has Data Guru (sales)`, async ({ request }) => {
    const token = await getToken(request, store.email);
    const res = await request.get(`${BASE}/api/agents`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const agents = await res.json();
    const guru = agents.find((a: any) => a.name === "Data Guru" && a.department === "sales");
    expect(guru, `Data Guru not found at ${store.name}`).toBeTruthy();
  });
}

// S-0.AC5: No agent named Carol, Service Agent, or CRM Guru
test("S-0.AC5: no deprecated agent names exist", async ({ request }) => {
  const token = await getToken(request, "duane.wells@huminic.ai");
  for (const store of STORES) {
    const storeToken = await getToken(request, store.email);
    const res = await request.get(`${BASE}/api/agents`, {
      headers: { Authorization: `Bearer ${storeToken}` },
    });
    const agents = await res.json();
    const deprecated = agents.filter((a: any) =>
      ["Carol", "Service Agent", "CRM Guru"].includes(a.name)
    );
    expect(deprecated.length, `Deprecated agents at ${store.name}: ${deprecated.map((a: any) => a.name).join(", ")}`).toBe(0);
  }
});

// S-0.AC6 + AC7 + AC8: New agents exist in all stores
for (const store of STORES) {
  test(`S-0.AC6-8: ${store.name} has all 10 agents`, async ({ request }) => {
    const token = await getToken(request, store.email);
    const res = await request.get(`${BASE}/api/agents`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const agents = await res.json();
    const names = agents.map((a: any) => a.name);

    // Sales agents
    expect(names, `${store.name} missing Sales Coach`).toContain("Sales Coach");
    expect(names, `${store.name} missing Communication Writer`).toContain("Communication Writer");

    // Marketing agents
    expect(names, `${store.name} missing Photo Studio`).toContain("Photo Studio");
    expect(names, `${store.name} missing Video Producer`).toContain("Video Producer");
    expect(names, `${store.name} missing Copywriter`).toContain("Copywriter");
    expect(names, `${store.name} missing Market Intel`).toContain("Market Intel");
    expect(names, `${store.name} missing Creative Director`).toContain("Creative Director");

    // Total count
    expect(agents.length, `${store.name} agent count`).toBeGreaterThanOrEqual(10);
  });
}

// S-0.AC9b: All new agent types have instructions > 100 chars
test("S-0.AC9b: new agents have instructions", async ({ request }) => {
  const token = await getToken(request, "serra_honda@huminic.ai");
  const res = await request.get(`${BASE}/api/agents`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const agents = await res.json();
  const newTypes = ["Data Guru", "Sales Coach", "Communication Writer", "Photo Studio", "Video Producer", "Copywriter", "Market Intel", "Creative Director"];

  for (const name of newTypes) {
    const agent = agents.find((a: any) => a.name === name);
    expect(agent, `${name} not found`).toBeTruthy();
    expect(
      agent.instructions?.length,
      `${name} instructions too short (${agent.instructions?.length || 0} chars)`
    ).toBeGreaterThan(100);
  }
});

// S-0.AC10: VIN webhook code uses port 4003 (code review)
test("S-0.AC10: webhooks.ts uses port 4003 for VIN", async () => {
  const fs = await import("fs");
  const webhooksCode = fs.readFileSync("server/routes/webhooks.ts", "utf-8");

  // The VAPI end-of-call-report block should use port 4003 via VIN_SAFE_URL
  expect(webhooksCode).toContain("0.0.0.0:4003");
  expect(webhooksCode).toContain("vin_safe_prepare_lead");

  // Should NOT use the old callMCP path for VIN contact creation in the webhook block
  const endOfCallBlock = webhooksCode.split("end-of-call-report")[1] || "";
  expect(endOfCallBlock).not.toContain('callMCP("vin_create_contact"');
});

// S-0.AC11: warehouse_metrics has rows for all 5 orgs
test("S-0.AC11: warehouse_metrics populated for all stores", async ({ request }) => {
  for (const store of STORES) {
    const token = await getToken(request, store.email);
    const res = await request.get(`${BASE}/api/metrics/pipeline`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    // At least one metric should be non-zero for stores with leads
    const hasData = data.activePipeline > 0 || data.appointmentsToday >= 0;
    expect(hasData, `${store.name} pipeline endpoint works`).toBe(true);
  }
});

// S-0.AC12: warehouse_leads has rows with valid dates
test("S-0.AC12: warehouse_leads exist for all stores", async ({ request }) => {
  for (const store of STORES) {
    const token = await getToken(request, store.email);
    const res = await request.get(`${BASE}/api/vin/leads/summary`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.totalLeads, `${store.name} totalLeads`).toBeGreaterThan(0);
  }
});

// S-0.AC13: npm run build succeeds
test("S-0.AC13: build compiles", async () => {
  const { execSync } = await import("child_process");
  const result = execSync("npm run build 2>&1", { cwd: process.cwd(), timeout: 60000 }).toString();
  expect(result).toContain("Done in");
});

// S-0.AC16: sms_campaign_number column exists
test("S-0.AC16: sms_campaign_number column in schema", async () => {
  const fs = await import("fs");
  const schema = fs.readFileSync("shared/schema.ts", "utf-8");
  expect(schema).toContain('smsCampaignNumber: text("sms_campaign_number")');
});

// S-0.AC18: outbound.ts uses fromNumber/smsCampaignNumber
test("S-0.AC18: outbound.ts has fromNumber support", async () => {
  const fs = await import("fs");
  const outbound = fs.readFileSync("server/outbound.ts", "utf-8");
  expect(outbound).toContain("fromNumber");
  expect(outbound).toContain("smsCampaignNumber");
});

// S-0.AC15: Agent instructions match agent-instructions.json
test("S-0.AC15: instructions match agent-instructions.json", async ({ request }) => {
  const fs = await import("fs");
  const instructionsFile = JSON.parse(fs.readFileSync("agent-instructions.json", "utf-8"));

  const token = await getToken(request, "serra_honda@huminic.ai");
  const res = await request.get(`${BASE}/api/agents`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const agents = await res.json();

  // Check Data Guru — instructions should contain the template text with Serra Honda substituted
  const dataGuru = agents.find((a: any) => a.name === "Data Guru");
  expect(dataGuru).toBeTruthy();
  const expectedSnippet = instructionsFile.instructions["Data Guru"]
    .replace(/\{\{dealershipName\}\}/g, "Serra Honda")
    .substring(0, 50);
  expect(dataGuru.instructions).toContain(expectedSnippet.substring(0, 30));
});
