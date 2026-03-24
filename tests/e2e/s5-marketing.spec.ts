/**
 * s5-marketing.spec.ts — S-5 Marketing Sprint Tests
 */
import { test, expect } from "playwright/test";

const BASE = "https://dev.huminicdev.com";
const PASSWORD = "NexxusTest2026";

async function getToken(request: any): Promise<string> {
  const res = await request.post(`${BASE}/api/auth/login`, {
    data: { email: "serra_honda@huminic.ai", password: PASSWORD },
  });
  return (await res.json()).accessToken;
}

test("S-5.AC1/AC2: no Campaigns tab or campaign queries in code", async () => {
  const fs = await import("fs");
  const code = fs.readFileSync("client/src/pages/marketing.tsx", "utf-8");
  expect(/id:\s*['"]campaigns['"]/.test(code), "No campaigns tab id").toBe(false);
  expect(code.includes("renderCampaigns"), "No renderCampaigns").toBe(false);
  expect(code.includes("/api/campaigns"), "No campaign API query").toBe(false);
  console.log("  No campaigns tab, no campaign queries");
});

test("S-5.AC3: tabs are Dashboard, Agents, Studio, Insights", async () => {
  const fs = await import("fs");
  const code = fs.readFileSync("client/src/pages/marketing.tsx", "utf-8");
  expect(code).toContain("dashboard");
  expect(code).toContain("agents");
  expect(code).toContain("studio");
  expect(code).toContain("insights");
  console.log("  Tabs: Dashboard, Agents, Studio, Insights confirmed");
});

test("S-5.AC4: Studio filter pills exist", async () => {
  const fs = await import("fs");
  const code = fs.readFileSync("client/src/pages/marketing.tsx", "utf-8");
  expect(code).toContain('data-testid="studio-filter-pills"');
  expect(code).toContain("studio-filter-");
  // Filter categories defined in code
  expect(code).toContain("Images");
  expect(code).toContain("Videos");
  expect(code).toContain("Copy");
  expect(code).toContain("Scores");
  expect(code).toContain("Voiceovers");
  expect(code).toContain("Radar");
  console.log("  Studio filter pills: All, Images, Videos, Copy, Scores, Voiceovers, Radar found");
});

test("S-5.AC5: Studio filter state management exists", async () => {
  const fs = await import("fs");
  const code = fs.readFileSync("client/src/pages/marketing.tsx", "utf-8");
  expect(code).toContain("studioFilter");
  expect(code).toContain("setStudioFilter");
  console.log("  Studio filter state: studioFilter + setStudioFilter found");
});

test("S-5.AC6: 5 marketing agents with descriptions", async ({ request }) => {
  const token = await getToken(request);
  const res = await request.get(`${BASE}/api/agents`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const agents = await res.json();
  const marketing = agents.filter((a: any) => a.department === "marketing");
  const names = marketing.map((a: any) => a.name);

  expect(names).toContain("Photo Studio");
  expect(names).toContain("Video Producer");
  expect(names).toContain("Copywriter");
  expect(names).toContain("Market Intel");
  expect(names).toContain("Creative Director");
  expect(marketing.length).toBe(5);

  for (const agent of marketing) {
    expect(agent.description?.length || 0, `${agent.name} description short`).toBeGreaterThan(20);
  }
  console.log(`  Marketing agents: ${names.join(", ")}`);
});

test("S-5.AC7: dashboard metrics return values", async ({ request }) => {
  const token = await getToken(request);
  const res = await request.get(`${BASE}/api/metrics/dashboard`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(res.status()).toBe(200);
  const data = await res.json();
  expect(data.agentCounts).toBeTruthy();
  console.log(`  Dashboard: agents=${data.agentCounts?.total}, conversations=${data.conversationCounts?.total}`);
});

test("S-5.AC8: Photo Studio responds with image-related content", async ({ request }) => {
  const token = await getToken(request);
  const convRes = await request.post(`${BASE}/api/conversations`, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    data: { customerName: "S-5 Photo Test", channel: "ai-chat" },
  });
  const conv = await convRes.json();

  const agents = await (await request.get(`${BASE}/api/agents`, {
    headers: { Authorization: `Bearer ${token}` },
  })).json();
  const photo = agents.find((a: any) => a.name === "Photo Studio");

  const chatRes = await request.post(`${BASE}/api/chat/${conv.id}/stream`, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    data: { content: "Generate a hero image for a red 2024 Honda Civic on a mountain road", agentId: photo?.id },
    timeout: 30000,
  });
  expect(chatRes.status()).toBe(200);
  const body = await chatRes.text();
  const lower = body.toLowerCase();
  expect(
    lower.includes("image") || lower.includes("photo") || lower.includes("generat") || lower.includes("civic") || lower.includes("vehicle"),
    "Photo Studio should reference image generation"
  ).toBe(true);
  console.log(`  Photo Studio: ${body.length} chars`);
});

test("S-5.AC9: Copywriter produces ad copy", async ({ request }) => {
  const token = await getToken(request);
  const convRes = await request.post(`${BASE}/api/conversations`, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    data: { customerName: "S-5 Copy Test", channel: "ai-chat" },
  });
  const conv = await convRes.json();

  const agents = await (await request.get(`${BASE}/api/agents`, {
    headers: { Authorization: `Bearer ${token}` },
  })).json();
  const copywriter = agents.find((a: any) => a.name === "Copywriter");

  const chatRes = await request.post(`${BASE}/api/chat/${conv.id}/stream`, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    data: { content: "Write ad copy for a spring service special at Serra Honda — oil change discount", agentId: copywriter?.id },
    timeout: 30000,
  });
  expect(chatRes.status()).toBe(200);
  const body = await chatRes.text();
  const lower = body.toLowerCase();
  expect(
    lower.includes("headline") || lower.includes("copy") || lower.includes("cta") || lower.includes("serra honda") || lower.includes("oil change"),
    "Copywriter should produce ad copy"
  ).toBe(true);
  console.log(`  Copywriter: ${body.length} chars`);
});
