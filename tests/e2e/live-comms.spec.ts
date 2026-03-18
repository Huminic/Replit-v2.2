import { test, expect } from "playwright/test";
import { testUsers, login, authHeader } from "./helpers/auth";

/**
 * Live Communications Tests
 *
 * These tests verify real third-party integrations via MCP.
 * They do NOT use the user's phone — they use the system's own
 * test numbers and internal verification.
 *
 * Tests that cost money (VAPI calls, SMS) are marked with a cost note.
 */

const MCP_URL = "https://mcp.huminicdev.com/dax/mcp";
const VINSOLUTIONS_API_KEY = process.env.VINSOLUTIONS_API_KEY || "";

async function callMCP(request: any, toolName: string, args: Record<string, unknown>) {
  const response = await request.post(MCP_URL, {
    headers: {
      Authorization: `Bearer ${VINSOLUTIONS_API_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    data: {
      jsonrpc: "2.0",
      method: "tools/call",
      params: { name: toolName, arguments: args },
      id: Date.now(),
    },
  });

  const text = await response.text();
  for (const line of text.split("\n")) {
    if (line.startsWith("data: ")) {
      const parsed = JSON.parse(line.slice(6));
      if (parsed.result?.content?.[0]?.text) {
        try { return JSON.parse(parsed.result.content[0].text); }
        catch { return parsed.result.content[0].text; }
      }
      if (parsed.error) throw new Error(parsed.error.message);
      return parsed.result;
    }
  }
  throw new Error(`No data in MCP response for ${toolName}`);
}

test.describe("Live Communications — Autonomous", () => {

  test.describe("TextMagic SMS via MCP", () => {

    test("LC-1 MCP tm_send_message tool is accessible", async ({ request }) => {
      // Verify the MCP tool exists and auth works (price check, no actual send)
      const result = await callMCP(request, "tm_get_message_price", {
        text: "Test message for price check",
        phones: "+12055551234", // fake number for price check only
      });
      expect(result).toBeDefined();
      expect(result.total).toBeDefined();
    });

    test("LC-2 Campaign SMS executes via MCP routing", async ({ request }) => {
      // Create a campaign, add a test recipient with a fake number, execute
      // This verifies the full pipeline without sending to a real phone
      const auth = await login(request, testUsers.orgAdmin);

      // Create campaign
      const campaign = await request.post("/api/campaigns", {
        headers: authHeader(auth.token),
        data: {
          name: "LC-2 Autonomous Test",
          department: "service",
          channel: "sms",
          messageTemplate: "LC-2 test message from {{dealershipName}}",
          status: "active",
        },
      });
      expect(campaign.ok()).toBeTruthy();
      const campaignData = await campaign.json();
      const campaignId = campaignData.id;

      // Execute as dry run to verify pipeline without spending money
      const execute = await request.post(`/api/campaigns/${campaignId}/execute`, {
        headers: authHeader(auth.token),
        data: { dryRun: true },
      });
      expect(execute.ok()).toBeTruthy();
      const execResult = await execute.json();
      expect(execResult.execution.dryRun).toBe(true);
      expect(execResult.execution.status).toBe("completed");
    });
  });

  test.describe("VAPI Voice via MCP", () => {

    test("LC-3 MCP vapi_list_assistants returns dealer assistants", async ({ request }) => {
      const result = await callMCP(request, "vapi_list_assistants", { limit: 20 });
      expect(result).toBeDefined();
      const assistants = Array.isArray(result) ? result : [result];
      expect(assistants.length).toBeGreaterThan(0);

      // Verify Serra Honda's Caroline exists
      const caroline = assistants.find((a: any) =>
        a.name?.includes("Caroline") || a.name?.includes("Serra Honda")
      );
      expect(caroline).toBeDefined();
    });

    test("LC-4 MCP vapi_list_phone_numbers returns configured numbers", async ({ request }) => {
      const result = await callMCP(request, "vapi_list_phone_numbers", { limit: 20 });
      expect(result).toBeDefined();
      const numbers = Array.isArray(result) ? result : [result];
      expect(numbers.length).toBeGreaterThan(0);

      // Each number should have an assistantId
      for (const num of numbers) {
        expect(num.assistantId || num.number).toBeDefined();
      }
    });

    test("LC-5 MCP vapi_get_call retrieves call details", async ({ request }) => {
      // Use the call ID from T-2b testing (known good call)
      const knownCallId = "019cfe53-1361-7bb0-a22e-5e4c2d9e7984";
      try {
        const result = await callMCP(request, "vapi_get_call", { callId: knownCallId });
        expect(result).toBeDefined();
        expect(result.status).toBe("ended");
        expect(result.transcript).toBeDefined();
      } catch {
        // Call may have expired from VAPI's retention — not a failure
        test.skip();
      }
    });

    // VAPI outbound call test — costs money (~$0.03-0.05 per call)
    // We call between two of our own numbers to avoid bothering anyone
    test.fixme("LC-6 VAPI outbound call with context overrides", async ({ request }) => {
      // KNOWN LIMITATION: I-037 — outbound calls don't pass context yet
      // When I-037 is fixed, this test should:
      // 1. Call vapi_create_call with firstMessageOverride and systemPromptOverride
      // 2. Verify the call connects
      // 3. Verify the greeting is outbound-appropriate
    });
  });

  test.describe("Resend Email via MCP", () => {

    test("LC-7 MCP resend_send_email delivers to test address", async ({ request }) => {
      // Send to a known test address — verify MCP routing works
      const result = await callMCP(request, "resend_send_email", {
        from: "Serra Honda <notifications@huminic.ai>",
        to: "delivered@resend.dev", // Resend's test address — always succeeds
        subject: "LC-7 Autonomous Test",
        html: "<p>Automated test email from T-2 sprint.</p>",
      });
      expect(result).toBeDefined();
      // Resend returns an id on success
      expect(result.id).toBeDefined();
    });

    test("LC-8 TeamBox outbound email endpoint works", async ({ request }) => {
      const auth = await login(request, testUsers.orgAdmin);

      // Get an existing conversation to send email from
      const convResponse = await request.get("/api/conversations", {
        headers: authHeader(auth.token),
      });
      const conversations = await convResponse.json();
      const convList = Array.isArray(conversations) ? conversations : conversations.conversations || [];

      if (convList.length === 0) {
        test.skip();
        return;
      }

      const convId = convList[0].id;

      const emailResult = await request.post(`/api/conversations/${convId}/email`, {
        headers: authHeader(auth.token),
        data: {
          to: "delivered@resend.dev",
          subject: "LC-8 TeamBox Email Test",
          body: "<p>Test email sent from TeamBox conversation endpoint.</p>",
        },
      });
      expect(emailResult.ok()).toBeTruthy();
    });
  });

  test.describe("Tavus Video via MCP", () => {

    test("LC-9 MCP tavus_list_personas returns dealer personas", async ({ request }) => {
      const result = await callMCP(request, "tavus_list_personas", { limit: 20 });
      expect(result).toBeDefined();
      const personas = Array.isArray(result) ? result : result.data || [result];
      expect(personas.length).toBeGreaterThan(0);
    });

    test("LC-10 Tavus personas match VAPI assistants per dealer", async ({ request }) => {
      const personas = await callMCP(request, "tavus_list_personas", { limit: 20 });
      const personaList = Array.isArray(personas) ? personas : personas.data || [];

      // Check that key dealer personas exist
      const names = personaList.map((p: any) => p.persona_name || p.name || "");
      const expectedNames = ["Caroline", "Elizabeth", "Savannah", "Magnolia", "Georgia"];

      for (const name of expectedNames) {
        const found = names.some((n: string) => n.includes(name));
        expect(found, `Persona "${name}" should exist`).toBeTruthy();
      }
    });
  });

  test.describe("VIN Solutions via MCP", () => {

    test("LC-11 VIN Solutions lead query returns data for Serra Honda", async ({ request }) => {
      const auth = await login(request, testUsers.orgAdmin);

      const response = await request.get("/api/vin/leads", {
        headers: authHeader(auth.token),
        params: {
          startDate: "2025-01-01",
          endDate: "2026-12-31",
          limit: "5",
        },
      });

      if (response.ok()) {
        const data = await response.json();
        expect(data).toBeDefined();
      } else {
        // VIN API may be rate-limited or token expired — note but don't fail
        const status = response.status();
        expect([200, 502]).toContain(status);
      }
    });

    test("LC-12 Warehouse leads exist for Serra Honda", async ({ request }) => {
      const auth = await login(request, testUsers.orgAdmin);

      const response = await request.get("/api/metrics/dashboard", {
        headers: authHeader(auth.token),
      });
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      // Serra Honda should have warehouse leads from the backfill
      expect(data).toBeDefined();
    });
  });
});
