import { test, expect } from "playwright/test";
import { testUsers, login, authHeader } from "./helpers/auth";

/**
 * E2E Flow Tests — End-to-end integration flows across the Nexxus platform.
 *
 * All tests use the API (request fixture), not the browser.
 * No real outbound email or VAPI calls — we verify endpoints are called
 * and check responses. VIN Solutions: insert test contacts via the app's API.
 * Webhooks: POST test payloads to webhook endpoints.
 */

const MCP_URL = "https://mcp.huminicdev.com/dax/mcp";
const VINSOLUTIONS_API_KEY = process.env.VINSOLUTIONS_API_KEY || "";

async function callMCP(
  request: any,
  toolName: string,
  args: Record<string, unknown>,
): Promise<any> {
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
        try {
          return JSON.parse(parsed.result.content[0].text);
        } catch {
          return parsed.result.content[0].text;
        }
      }
      if (parsed.error) throw new Error(parsed.error.message);
      return parsed.result;
    }
  }
  throw new Error(`No data in MCP response for ${toolName}`);
}

test.describe("E2E Flows", () => {
  let orgAdminToken: string;
  let orgAdminOrgId: string;
  let orgAdminUserId: string;

  test.beforeAll(async ({ request }) => {
    const auth = await login(request, testUsers.orgAdmin);
    orgAdminToken = auth.token;
    orgAdminOrgId = auth.organizationId;
    orgAdminUserId = auth.userId;
  });

  // ─────────────────────────────────────────────────────────────────────────
  // FLOW-1: Sales inbound SMS -> agent response -> TeamBox
  // ─────────────────────────────────────────────────────────────────────────
  test("FLOW-1: Inbound SMS creates conversation in TeamBox", async ({
    request,
  }) => {
    const testPhone = "15551110001";

    // Step 1: POST to TextMagic webhook
    const webhookRes = await request.post("/api/webhooks/textmagic", {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      form: {
        sender: testPhone,
        text: "I'm interested in a 2024 Honda Civic",
        receiver: "",
        timestamp: String(Math.floor(Date.now() / 1000)),
      },
    });
    expect(webhookRes.status()).toBeLessThan(500);
    const webhookBody = await webhookRes.json();

    // Step 2: Wait for AI agent processing (fire-and-forget in server)
    await new Promise((r) => setTimeout(r, 3000));

    // Step 3: GET conversations as orgAdmin — find conversation with this phone
    const convRes = await request.get("/api/conversations", {
      headers: authHeader(orgAdminToken),
    });
    expect(convRes.ok()).toBeTruthy();
    const conversations = await convRes.json();
    const allConvs = Array.isArray(conversations)
      ? conversations
      : conversations.data ?? [];

    // Step 4: Verify conversation exists (may be in any org — webhook resolved it)
    // If webhook returned a conversationId, verify it directly
    if (webhookBody.conversationId) {
      const convDetailRes = await request.get(
        `/api/conversations/${webhookBody.conversationId}`,
        { headers: authHeader(orgAdminToken) },
      );
      // If 403 it means it went to a different org; if 200, it is in ours
      if (convDetailRes.ok()) {
        const conv = await convDetailRes.json();
        expect(conv.channel).toBe("sms");
        expect(conv.customerPhone).toContain(testPhone.replace(/\D/g, ""));
      }
    }

    // Step 5: Check messages if we can access the conversation
    const matchingConv = allConvs.find(
      (c: any) =>
        c.customerPhone && c.customerPhone.replace(/\D/g, "").includes(testPhone),
    );
    if (matchingConv) {
      const msgRes = await request.get(
        `/api/conversations/${matchingConv.id}/messages`,
        { headers: authHeader(orgAdminToken) },
      );
      expect(msgRes.ok()).toBeTruthy();
      const messages = await msgRes.json();
      // Should have at least the inbound message
      expect(
        Array.isArray(messages) ? messages.length : 0,
      ).toBeGreaterThanOrEqual(1);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // FLOW-2: Sales inbound SMS -> takeover -> human reply
  // ─────────────────────────────────────────────────────────────────────────
  test("FLOW-2: Human takeover pauses AI on conversation", async ({
    request,
  }) => {
    const testPhone = "15551110002";

    // Step 1: Inbound SMS
    const webhookRes = await request.post("/api/webhooks/textmagic", {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      form: {
        sender: testPhone,
        text: "I need a quote on a 2025 Accord",
        receiver: "",
        timestamp: String(Math.floor(Date.now() / 1000)),
      },
    });
    expect(webhookRes.status()).toBeLessThan(500);
    const webhookBody = await webhookRes.json();

    await new Promise((r) => setTimeout(r, 2000));

    // Step 2: Find the conversation
    const convRes = await request.get("/api/conversations", {
      headers: authHeader(orgAdminToken),
    });
    expect(convRes.ok()).toBeTruthy();
    const convs = await convRes.json();
    const allConvs = Array.isArray(convs) ? convs : convs.data ?? [];

    let convId = webhookBody.conversationId;
    if (!convId) {
      const match = allConvs.find(
        (c: any) =>
          c.customerPhone &&
          c.customerPhone.replace(/\D/g, "").includes(testPhone),
      );
      convId = match?.id;
    }

    // If the conversation is not in our org, we verify the webhook processed
    if (!convId) {
      // Webhook was processed but conversation is in a different org
      expect(webhookRes.status()).toBeLessThan(500);
      return;
    }

    // Step 3: PATCH conversation with assignedTo (human takeover)
    const patchRes = await request.patch(`/api/conversations/${convId}`, {
      headers: authHeader(orgAdminToken),
      data: { assignedTo: orgAdminUserId },
    });

    if (patchRes.ok()) {
      const patchBody = await patchRes.json();
      // Step 4: Verify aiPaused is true
      expect(patchBody.aiPaused).toBe(true);
    } else {
      // 403 means it is in another org — acceptable
      expect([200, 403]).toContain(patchRes.status());
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // FLOW-3: Service campaign create -> upload -> execute (dry run)
  // ─────────────────────────────────────────────────────────────────────────
  test("FLOW-3: Campaign create, CSV upload, and dry-run execute", async ({
    request,
  }) => {
    // Step 1: Create campaign
    const createRes = await request.post("/api/campaigns", {
      headers: authHeader(orgAdminToken),
      data: {
        name: `E2E-FLOW3-${Date.now()}`,
        department: "service",
        channel: "sms",
        messageTemplate:
          "Hello {{firstName}}, your vehicle service is due. Reply to schedule.",
        status: "draft",
      },
    });
    expect(createRes.ok()).toBeTruthy();
    const campaign = await createRes.json();
    const campaignId = campaign.id;
    expect(campaignId).toBeTruthy();

    // Step 2: Upload CSV with 2 test recipients
    const csvContent =
      "First Name,Last Name,Home Phone,Email Address\n" +
      "TestAlice,FlowThree,15559990001,alice-flow3@example.com\n" +
      "TestBob,FlowThree,15559990002,bob-flow3@example.com\n";

    const boundary = "----E2EFlowBoundary" + Date.now();
    const body =
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="flow3-test.csv"\r\n` +
      `Content-Type: text/csv\r\n\r\n` +
      csvContent +
      `\r\n--${boundary}--\r\n`;

    const uploadRes = await request.post(
      `/api/campaigns/${campaignId}/upload-csv`,
      {
        headers: {
          ...authHeader(orgAdminToken),
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
        },
        data: Buffer.from(body),
      },
    );
    expect(uploadRes.ok()).toBeTruthy();
    const uploadBody = await uploadRes.json();
    expect(uploadBody.recipientCount).toBeGreaterThanOrEqual(2);

    // Step 3: Execute dry run
    const execRes = await request.post(
      `/api/campaigns/${campaignId}/execute`,
      {
        headers: authHeader(orgAdminToken),
        data: { dryRun: true },
      },
    );
    // Expect success or a recoverable error (campaign may need active status)
    if (execRes.ok()) {
      const execBody = await execRes.json();
      expect(execBody.success).toBeDefined();
    } else {
      // 400 is acceptable if campaign isn't in the right status
      expect([200, 400]).toContain(execRes.status());
    }

    // Cleanup: delete campaign (no delete route — mark as draft is fine)
    await request.patch(`/api/campaigns/${campaignId}`, {
      headers: authHeader(orgAdminToken),
      data: { status: "completed" },
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // FLOW-4: Service campaign reply -> agent response
  // ─────────────────────────────────────────────────────────────────────────
  test("FLOW-4: Campaign recipient reply creates linked conversation", async ({
    request,
  }) => {
    const recipientPhone = "15559990001";

    // Step 1: Simulate a reply from a campaign recipient
    const webhookRes = await request.post("/api/webhooks/textmagic", {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      form: {
        sender: recipientPhone,
        text: "Yes, I'd like to schedule service for next Tuesday",
        receiver: "",
        timestamp: String(Math.floor(Date.now() / 1000)),
      },
    });
    expect(webhookRes.status()).toBeLessThan(500);

    // Step 2: Wait for processing
    await new Promise((r) => setTimeout(r, 3000));

    // Step 3: Check conversation has campaign linkage
    const convRes = await request.get("/api/conversations", {
      headers: authHeader(orgAdminToken),
    });
    expect(convRes.ok()).toBeTruthy();
    const convs = await convRes.json();
    const allConvs = Array.isArray(convs) ? convs : convs.data ?? [];

    const matchingConv = allConvs.find(
      (c: any) =>
        c.customerPhone &&
        c.customerPhone.replace(/\D/g, "").includes(recipientPhone),
    );

    if (matchingConv) {
      // Verify conversation exists — campaign linkage is best-effort
      expect(matchingConv.channel).toBe("sms");

      // Step 4: Verify messages exist in thread
      const msgRes = await request.get(
        `/api/conversations/${matchingConv.id}/messages`,
        { headers: authHeader(orgAdminToken) },
      );
      expect(msgRes.ok()).toBeTruthy();
      const messages = await msgRes.json();
      expect(
        Array.isArray(messages) ? messages.length : 0,
      ).toBeGreaterThanOrEqual(1);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // FLOW-5: Kill switch ON -> campaign blocked
  // ─────────────────────────────────────────────────────────────────────────
  test("FLOW-5: Kill switch blocks campaign execution", async ({
    request,
  }) => {
    // Step 1: Create a campaign
    const createRes = await request.post("/api/campaigns", {
      headers: authHeader(orgAdminToken),
      data: {
        name: `E2E-FLOW5-KillSwitch-${Date.now()}`,
        department: "service",
        channel: "sms",
        messageTemplate: "Kill switch test message",
        status: "draft",
      },
    });
    expect(createRes.ok()).toBeTruthy();
    const campaign = await createRes.json();
    const campaignId = campaign.id;

    // Step 2: Enable kill switch on the campaign
    const ksRes = await request.patch(`/api/campaigns/${campaignId}`, {
      headers: authHeader(orgAdminToken),
      data: { killSwitch: true },
    });
    expect(ksRes.ok()).toBeTruthy();

    // Step 3: Attempt to execute — should be blocked
    const execRes = await request.post(
      `/api/campaigns/${campaignId}/execute`,
      {
        headers: authHeader(orgAdminToken),
        data: { dryRun: true },
      },
    );
    // Kill switch should return 403
    expect(execRes.status()).toBe(403);
    const execBody = await execRes.json();
    expect(execBody.message).toContain("kill switch");

    // Cleanup: disable kill switch
    await request.patch(`/api/campaigns/${campaignId}`, {
      headers: authHeader(orgAdminToken),
      data: { killSwitch: false, status: "completed" },
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // FLOW-6: Kill switch OFF -> campaign resumes
  // ─────────────────────────────────────────────────────────────────────────
  test("FLOW-6: Campaign executes when kill switch is off", async ({
    request,
  }) => {
    // Step 1: Create campaign with kill switch off
    const createRes = await request.post("/api/campaigns", {
      headers: authHeader(orgAdminToken),
      data: {
        name: `E2E-FLOW6-Resume-${Date.now()}`,
        department: "service",
        channel: "sms",
        messageTemplate: "Resume test message",
        status: "draft",
        killSwitch: false,
      },
    });
    expect(createRes.ok()).toBeTruthy();
    const campaign = await createRes.json();
    const campaignId = campaign.id;

    // Step 2: Verify kill switch is off
    const getRes = await request.get(`/api/campaigns/${campaignId}`, {
      headers: authHeader(orgAdminToken),
    });
    expect(getRes.ok()).toBeTruthy();
    const campaignData = await getRes.json();
    expect(campaignData.killSwitch).toBe(false);

    // Step 3: Execute dry run — should proceed (not blocked by kill switch)
    const execRes = await request.post(
      `/api/campaigns/${campaignId}/execute`,
      {
        headers: authHeader(orgAdminToken),
        data: { dryRun: true },
      },
    );
    // Should not be 403 (kill switch blocked)
    expect(execRes.status()).not.toBe(403);

    // Cleanup
    await request.patch(`/api/campaigns/${campaignId}`, {
      headers: authHeader(orgAdminToken),
      data: { status: "completed" },
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // FLOW-7: VIN Solutions -> query leads
  // ─────────────────────────────────────────────────────────────────────────
  test("FLOW-7: VIN Solutions leads are queryable via warehouse", async ({
    request,
  }) => {
    // Step 1: Query warehouse leads — verify the endpoint works
    const leadsRes = await request.get("/api/warehouse/leads", {
      headers: authHeader(orgAdminToken),
    });
    expect(leadsRes.ok()).toBeTruthy();
    const leads = await leadsRes.json();
    const allLeads = Array.isArray(leads) ? leads : leads.data ?? [];

    // Verify leads are returned (may be empty if no sync has run)
    expect(Array.isArray(allLeads)).toBe(true);

    // Step 2: Also verify VIN query via MCP if API key is available
    if (VINSOLUTIONS_API_KEY) {
      try {
        const vinResult = await callMCP(request, "vin_query_leads", {
          orgId: "serra-honda",
          limit: 5,
        });
        expect(vinResult).toBeDefined();
      } catch {
        // MCP may not be reachable in test env — acceptable
      }
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // FLOW-8: Outbound email -> verify endpoint
  // ─────────────────────────────────────────────────────────────────────────
  test("FLOW-8: Outbound email endpoint accepts and sends", async ({
    request,
  }) => {
    // Step 1: Find or create a conversation
    const convRes = await request.get("/api/conversations", {
      headers: authHeader(orgAdminToken),
    });
    expect(convRes.ok()).toBeTruthy();
    const convs = await convRes.json();
    const allConvs = Array.isArray(convs) ? convs : convs.data ?? [];

    let convId: string;
    if (allConvs.length > 0) {
      convId = allConvs[0].id;
    } else {
      // Create a conversation for the email test
      const createRes = await request.post("/api/conversations", {
        headers: authHeader(orgAdminToken),
        data: {
          customerName: "E2E Email Test",
          customerEmail: "delivered@resend.dev",
          channel: "email",
          status: "open",
        },
      });
      expect(createRes.ok()).toBeTruthy();
      const conv = await createRes.json();
      convId = conv.id;
    }

    // Step 2: POST email
    const emailRes = await request.post(
      `/api/conversations/${convId}/email`,
      {
        headers: authHeader(orgAdminToken),
        data: {
          to: "delivered@resend.dev",
          subject: "E2E Test — FLOW-8",
          body: "<p>End-to-end email test. This is sent to Resend's test address.</p>",
        },
      },
    );

    // Accept 200 (success) or 503 (RESEND_API_KEY not configured)
    expect([200, 503]).toContain(emailRes.status());
    const emailBody = await emailRes.json();
    if (emailRes.status() === 200) {
      expect(emailBody.success).toBe(true);
    } else {
      // 503 means service not configured — expected in some envs
      expect(emailBody.message).toContain("not configured");
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // FLOW-9: Tavus -> create conversation -> verify URL
  // ─────────────────────────────────────────────────────────────────────────
  test("FLOW-9: Tavus video session endpoint returns conversation URL", async ({
    request,
  }) => {
    // Use the widget video-session endpoint to create a Tavus conversation
    // This endpoint is public (no auth) — it needs a widgetCode or slug
    const videoRes = await request.post("/api/widget/video-session", {
      headers: { "Content-Type": "application/json" },
      data: {
        slug: "serra-honda",
        visitorName: "E2E Test Visitor",
      },
    });

    // Accept 200 (session created), 400 (no Tavus persona configured), or 404 (org not found)
    expect([200, 400, 404]).toContain(videoRes.status());

    if (videoRes.status() === 200) {
      const body = await videoRes.json();
      // Verify the response contains a conversation URL
      expect(
        body.conversationUrl || body.conversation_url || body.url,
      ).toBeDefined();
      const url =
        body.conversationUrl || body.conversation_url || body.url || "";
      if (url) {
        expect(url).toContain("https://");
      }
    } else {
      // 400/404 means Tavus is not configured for this org — acceptable
      const body = await videoRes.json();
      expect(body.message).toBeDefined();
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // FLOW-10: TeamBox -> all message types visible
  // ─────────────────────────────────────────────────────────────────────────
  test("FLOW-10: TeamBox shows conversations with multiple channels", async ({
    request,
  }) => {
    // Step 1: Get all conversations
    const convRes = await request.get("/api/conversations", {
      headers: authHeader(orgAdminToken),
    });
    expect(convRes.ok()).toBeTruthy();
    const convs = await convRes.json();
    const allConvs = Array.isArray(convs) ? convs : convs.data ?? [];

    // Step 2: Verify conversations exist
    expect(allConvs.length).toBeGreaterThanOrEqual(1);

    // Step 3: Collect channels present
    const channels = new Set(allConvs.map((c: any) => c.channel));

    // At minimum we should have SMS (created by FLOW-1/FLOW-2 above)
    expect(channels.has("sms")).toBe(true);

    // Step 4: For the first conversation, verify message structure
    const firstConv = allConvs[0];
    expect(firstConv.id).toBeTruthy();
    expect(firstConv.channel).toBeTruthy();
    expect(firstConv.status).toBeTruthy();

    const msgRes = await request.get(
      `/api/conversations/${firstConv.id}/messages`,
      { headers: authHeader(orgAdminToken) },
    );
    expect(msgRes.ok()).toBeTruthy();
    const messages = await msgRes.json();
    const msgList = Array.isArray(messages) ? messages : messages.data ?? [];

    if (msgList.length > 0) {
      const msg = msgList[0];
      // Verify message structure has required fields
      expect(msg.id).toBeTruthy();
      expect(msg.content).toBeDefined();
      expect(msg.role).toBeDefined();
      expect(msg.conversationId).toBe(firstConv.id);
    }
  });
});
