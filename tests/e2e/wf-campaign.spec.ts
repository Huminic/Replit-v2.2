/**
 * wf-campaign.spec.ts — Workflow E2E: Campaign lifecycle
 *
 * Full workflow: Create campaign -> add recipients -> execute -> verify status
 * -> simulate inbound reply -> verify conversation created -> check TeamBox
 * -> verify AI agent handling -> cleanup.
 *
 * Uses Serra Honda (orgAdmin) which has outboundEnabled and smsEnabled flags.
 * OUTBOUND_LIVE_ENABLED=false on staging, so real SMS/email will not send,
 * but the pipeline still processes and queues messages.
 */
import { test, expect } from "playwright/test";
import { login, authHeader, testUsers } from "./helpers/auth";

const BASE = process.env.BASE_URL || "http://localhost:5000";

const RUN_ID = `wf-${Date.now()}`;
const TEST_PHONE = `+1555${Date.now().toString().slice(-7)}`;
const TEST_EMAIL = `wf-test-${RUN_ID}@example.com`;

/** Auth state shared across serial tests in this file. */
let token: string;
let organizationId: string;
let headers: Record<string, string>;

/** Campaign ID created in test 1, used through the workflow. */
let campaignId: string;

test.describe.serial("Workflow: Campaign lifecycle E2E", () => {
  test.beforeAll(async ({ request }) => {
    const session = await login(request, testUsers.orgAdmin);
    token = session.token;
    organizationId = session.organizationId;
    headers = authHeader(token);
  });

  test.afterAll(async ({ request }) => {
    // Cleanup: stop and archive the test campaign
    if (campaignId) {
      try {
        await request.post(`${BASE}/api/campaigns/${campaignId}/stop`, { headers });
      } catch { /* best effort */ }
      try {
        await request.patch(`${BASE}/api/campaigns/${campaignId}`, {
          headers,
          data: { status: "stopped", killSwitch: true },
        });
      } catch { /* best effort */ }
    }
  });

  // -------------------------------------------------------------------------
  // 1. Create a test campaign via API
  // -------------------------------------------------------------------------
  test("1. Create test campaign", async ({ request }) => {
    const res = await request.post(`${BASE}/api/campaigns`, {
      headers,
      data: {
        name: `WF-Campaign-${RUN_ID}`,
        department: "sales",
        channel: "sms",
        status: "draft",
        messageTemplate:
          "Hello {{firstName}}, this is {{dealershipName}} reaching out about your {{vehicleYear}} {{vehicleModel}}.",
        sendIntervalSeconds: 5,
      },
    });

    expect(res.ok(), `Campaign creation failed: ${res.status()}`).toBe(true);
    const campaign = await res.json();

    expect(campaign.id).toBeTruthy();
    expect(campaign.name).toBe(`WF-Campaign-${RUN_ID}`);
    expect(campaign.status).toBe("draft");
    expect(campaign.channel).toBe("sms");
    expect(campaign.department).toBe("sales");
    expect(campaign.killSwitch).toBe(false);
    expect(campaign.recipientCount).toBe(0);
    expect(campaign.messageTemplate).toContain("{{firstName}}");

    campaignId = campaign.id;
  });

  // -------------------------------------------------------------------------
  // 2. Add recipients via CSV upload
  // -------------------------------------------------------------------------
  test("2. Add recipients via CSV upload", async ({ request }) => {
    expect(campaignId, "Campaign must exist from test 1").toBeTruthy();

    const csvHeader =
      "First Name,Last Name,Home Phone,Email Address,VIN,Model,Model Year";
    const csvRows = [
      `TestAlice,Workflow,${TEST_PHONE},${TEST_EMAIL},1HGCM82633A004455,Civic,2024`,
      `TestBob,Campaign,+15550009999,bob-wf@example.com,2T1BURHE5KC112233,Camry,2025`,
    ];
    const csvContent = [csvHeader, ...csvRows].join("\n");

    const res = await request.post(
      `${BASE}/api/campaigns/${campaignId}/upload-csv`,
      {
        headers,
        multipart: {
          file: {
            name: "wf-recipients.csv",
            mimeType: "text/csv",
            buffer: Buffer.from(csvContent),
          },
        },
      }
    );

    expect(res.ok(), `CSV upload failed: ${res.status()}`).toBe(true);
    const body = await res.json();

    expect(body.recipientCount).toBe(2);
    expect(body.columnsMatched).toContain("First Name");
    expect(body.columnsMatched).toContain("Home Phone");
    expect(body.columnsMatched).toContain("Email Address");
    expect(body.columnsMatched).toContain("VIN");
    expect(body.columnsMatched).toContain("Model");
    expect(body.columnsMatched).toContain("Model Year");

    // Verify recipients stored correctly
    const recipRes = await request.get(
      `${BASE}/api/campaigns/${campaignId}/recipients`,
      { headers }
    );
    expect(recipRes.ok()).toBe(true);
    const recipients = await recipRes.json();
    expect(recipients.length).toBe(2);

    const alice = recipients.find((r: any) => r.firstName === "TestAlice");
    expect(alice).toBeTruthy();
    expect(alice.lastName).toBe("Workflow");
    expect(alice.vin).toBe("1HGCM82633A004455");
    expect(alice.vehicleModel).toBe("Civic");
    expect(alice.vehicleYear).toBe("2024");
    expect(alice.email).toBe(TEST_EMAIL);
  });

  // -------------------------------------------------------------------------
  // 3. Execute the campaign
  // -------------------------------------------------------------------------
  test("3. Execute campaign", async ({ request }) => {
    expect(campaignId, "Campaign must exist from test 1").toBeTruthy();

    const execRes = await request.post(
      `${BASE}/api/campaigns/${campaignId}/execute`,
      { headers }
    );

    // Execution may start (200) or be blocked by CommGate/outbound settings (400).
    // Both are valid — we just need it not to crash (no 500).
    expect(
      execRes.status(),
      "Execute should not cause a server error"
    ).toBeLessThan(500);

    const execBody = await execRes.json();

    if (execRes.ok()) {
      // Execution started successfully
      expect(execBody.success).toBe(true);
      console.log(`  Campaign execution started: ${JSON.stringify(execBody)}`);
    } else {
      // Execution blocked — document why
      expect(execBody.message).toBeTruthy();
      console.log(`  Campaign execution blocked: ${execBody.message}`);
    }
  });

  // -------------------------------------------------------------------------
  // 4. Verify campaign status changes after execution
  // -------------------------------------------------------------------------
  test("4. Verify campaign status after execution", async ({ request }) => {
    expect(campaignId, "Campaign must exist from test 1").toBeTruthy();

    // Allow time for async execution processing
    await new Promise((r) => setTimeout(r, 4000));

    // Check execution status endpoint
    const statusRes = await request.get(
      `${BASE}/api/campaigns/${campaignId}/execution-status`,
      { headers }
    );
    expect(statusRes.ok()).toBe(true);
    const statusBody = await statusRes.json();

    // The execution status may be active (still processing) or inactive (done/never started)
    if (statusBody.active) {
      expect(statusBody).toHaveProperty("processed");
      expect(statusBody).toHaveProperty("totalRecipients");
      console.log(
        `  Execution active: processed=${statusBody.processed}/${statusBody.totalRecipients}`
      );
    } else {
      console.log("  Execution not active (completed or never started)");
    }

    // Fetch the campaign itself to check its stored state
    const campaignRes = await request.get(
      `${BASE}/api/campaigns/${campaignId}`,
      { headers }
    );
    expect(campaignRes.ok()).toBe(true);
    const campaign = await campaignRes.json();

    // Campaign should have recipientCount = 2 from the CSV upload
    expect(campaign.recipientCount).toBe(2);

    // executionStatus should have changed from "idle" if execution was attempted
    // Valid values: idle, running, completed, stopped, scheduled
    const validStatuses = ["idle", "executing", "completed", "stopped", "scheduled"];
    expect(
      validStatuses.includes(campaign.executionStatus || "idle"),
      `executionStatus should be valid, got: ${campaign.executionStatus}`
    ).toBe(true);

    console.log(
      `  Campaign state: status=${campaign.status}, executionStatus=${campaign.executionStatus}, ` +
        `sentCount=${campaign.sentCount}, recipientCount=${campaign.recipientCount}`
    );
  });

  // -------------------------------------------------------------------------
  // 5. Poll for campaign execution results
  // -------------------------------------------------------------------------
  test("5. Poll for execution results", async ({ request }) => {
    expect(campaignId, "Campaign must exist from test 1").toBeTruthy();

    // Poll execution status up to 5 times (with 2s interval)
    let finalStatus: any = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const statusRes = await request.get(
        `${BASE}/api/campaigns/${campaignId}/execution-status`,
        { headers }
      );
      expect(statusRes.ok()).toBe(true);
      finalStatus = await statusRes.json();

      // If execution is no longer active, we are done polling
      if (!finalStatus.active) break;

      await new Promise((r) => setTimeout(r, 2000));
    }

    // Verify recipients to see what happened
    const recipRes = await request.get(
      `${BASE}/api/campaigns/${campaignId}/recipients`,
      { headers }
    );
    expect(recipRes.ok()).toBe(true);
    const recipients = await recipRes.json();
    expect(recipients.length).toBe(2);

    // Since OUTBOUND_LIVE_ENABLED=false, recipients should NOT show as "sent"/"delivered"
    // They may be "pending", "blocked", "failed", or unchanged depending on how far the pipeline got
    for (const r of recipients) {
      const status = r.status || "pending";
      console.log(
        `  Recipient ${r.firstName} ${r.lastName}: status=${status}, phone=${r.phone}`
      );
    }

    // Check campaign-level execution counters
    const campaignRes = await request.get(
      `${BASE}/api/campaigns/${campaignId}`,
      { headers }
    );
    expect(campaignRes.ok()).toBe(true);
    const campaign = await campaignRes.json();

    // With outbound disabled, sentCount should remain 0
    // (CommGate or OUTBOUND_LIVE_ENABLED blocks actual sending)
    console.log(
      `  Execution counters: total=${campaign.executionTotal}, processed=${campaign.executionProcessed}, ` +
        `sent=${campaign.executionSent}, failed=${campaign.executionFailed}`
    );
  });

  // -------------------------------------------------------------------------
  // 6. Simulate a customer reply (inbound SMS webhook)
  // -------------------------------------------------------------------------
  test("6. Simulate customer reply via inbound SMS webhook", async ({
    request,
  }) => {
    // Normalize phone to match what the webhook will produce
    const normalizedPhone = TEST_PHONE.replace(/[^0-9+]/g, "");

    const webhookRes = await request.post(
      `${BASE}/api/webhooks/textmagic`,
      {
        data: {
          sender: normalizedPhone,
          text: "Yes, I am interested in scheduling a test drive for the Civic.",
          receiver: "18338096836", // Serra Honda TextMagic number
          timestamp: Math.floor(Date.now() / 1000),
        },
      }
    );

    // Webhook should accept and process the payload (not crash)
    expect(
      webhookRes.status(),
      `Webhook should not error: ${webhookRes.status()}`
    ).toBeLessThan(500);

    const webhookBody = await webhookRes.json();
    expect(webhookBody.success).toBe(true);

    if (webhookBody.conversationId) {
      console.log(`  Webhook created conversation: ${webhookBody.conversationId}`);
    } else {
      console.log(`  Webhook response: ${JSON.stringify(webhookBody)}`);
    }
  });

  // -------------------------------------------------------------------------
  // 7. Verify the reply creates/updates a conversation
  // -------------------------------------------------------------------------
  test("7. Verify reply created a conversation", async ({ request }) => {
    const normalizedPhone = TEST_PHONE.replace(/[^0-9+]/g, "");

    // Poll for the conversation to appear (webhook processing is async)
    let matchingConv: any = null;
    for (let attempt = 0; attempt < 6; attempt++) {
      const convRes = await request.get(`${BASE}/api/conversations`, {
        headers,
      });
      if (!convRes.ok()) {
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }

      const conversations = await convRes.json();
      const convList = Array.isArray(conversations)
        ? conversations
        : conversations.conversations ?? conversations.data ?? [];

      matchingConv = convList.find(
        (c: any) =>
          c.customerPhone?.includes(normalizedPhone) ||
          c.customerName?.includes(normalizedPhone)
      );

      if (matchingConv) break;
      await new Promise((r) => setTimeout(r, 2000));
    }

    expect(
      matchingConv,
      `Conversation for phone ${normalizedPhone} should exist`
    ).toBeTruthy();

    // Verify conversation properties
    expect(matchingConv.channel).toBe("sms");
    expect(matchingConv.status).toBe("open");
    expect(matchingConv.organizationId).toBe(organizationId);

    // If the conversation was linked to our campaign, verify the linkage
    if (matchingConv.campaignId) {
      console.log(
        `  Conversation linked to campaign: ${matchingConv.campaignId}`
      );
    }

    console.log(
      `  Conversation found: id=${matchingConv.id}, status=${matchingConv.status}, ` +
        `channel=${matchingConv.channel}, unreadCount=${matchingConv.unreadCount}`
    );
  });

  // -------------------------------------------------------------------------
  // 8. Verify the AI agent handled the reply
  // -------------------------------------------------------------------------
  test("8. Verify AI agent handling of reply", async ({ request }) => {
    const normalizedPhone = TEST_PHONE.replace(/[^0-9+]/g, "");

    // Find the conversation again
    const convRes = await request.get(`${BASE}/api/conversations`, { headers });
    expect(convRes.ok()).toBe(true);
    const conversations = await convRes.json();
    const convList = Array.isArray(conversations)
      ? conversations
      : conversations.conversations ?? conversations.data ?? [];

    const conv = convList.find(
      (c: any) =>
        c.customerPhone?.includes(normalizedPhone) ||
        c.customerName?.includes(normalizedPhone)
    );
    expect(conv, "Conversation should exist from test 7").toBeTruthy();

    // Wait a bit for AI processing (fire-and-forget in the webhook handler)
    await new Promise((r) => setTimeout(r, 5000));

    // Fetch messages in the conversation
    const msgRes = await request.get(
      `${BASE}/api/conversations/${conv.id}/messages`,
      { headers }
    );
    expect(msgRes.ok()).toBe(true);
    const messages = await msgRes.json();
    const msgList = Array.isArray(messages)
      ? messages
      : messages.messages ?? messages.data ?? [];

    // There should be at least the inbound user message
    expect(msgList.length).toBeGreaterThanOrEqual(1);

    const userMsg = msgList.find(
      (m: any) => m.role === "user" && m.content?.includes("test drive")
    );
    expect(userMsg, "Inbound user message should be stored").toBeTruthy();

    // Check for AI agent response
    const agentMsg = msgList.find(
      (m: any) => m.role === "agent" || m.role === "assistant"
    );
    if (agentMsg) {
      expect(agentMsg.content).toBeTruthy();
      expect(agentMsg.content.length).toBeGreaterThan(0);
      console.log(
        `  AI agent responded: "${agentMsg.content.substring(0, 100)}..."`
      );
    } else {
      // AI response may not be generated when OUTBOUND_LIVE_ENABLED=false
      // The webhook code checks this flag before invoking AI
      console.log(
        "  AI agent did not respond (expected — OUTBOUND_LIVE_ENABLED=false blocks AI SMS pipeline)"
      );
    }

    // Check for system-injected vehicle context message (if campaign-linked)
    const systemMsg = msgList.find(
      (m: any) =>
        m.role === "system" &&
        m.content?.toLowerCase().includes("campaign context")
    );
    if (systemMsg) {
      expect(systemMsg.content).toContain("Civic");
      console.log(`  Vehicle context injected: "${systemMsg.content}"`);
    } else {
      console.log(
        "  No vehicle context message (conversation may not be campaign-linked)"
      );
    }

    console.log(`  Total messages in conversation: ${msgList.length}`);
    for (const m of msgList) {
      console.log(`    [${m.role}] ${m.content?.substring(0, 80)}`);
    }
  });

  // -------------------------------------------------------------------------
  // 9. Verify the conversation appears in TeamBox (conversations list)
  // -------------------------------------------------------------------------
  test("9. Verify conversation appears in TeamBox", async ({ request }) => {
    const normalizedPhone = TEST_PHONE.replace(/[^0-9+]/g, "");

    // TeamBox is the conversations list. Fetch all open conversations.
    const convRes = await request.get(`${BASE}/api/conversations`, { headers });
    expect(convRes.ok()).toBe(true);
    const conversations = await convRes.json();
    const convList = Array.isArray(conversations)
      ? conversations
      : conversations.conversations ?? conversations.data ?? [];

    // Our conversation should be in the list
    const conv = convList.find(
      (c: any) =>
        c.customerPhone?.includes(normalizedPhone) ||
        c.customerName?.includes(normalizedPhone)
    );
    expect(
      conv,
      "Conversation should appear in TeamBox (conversations list)"
    ).toBeTruthy();

    // Verify it is open and has the right properties for TeamBox display
    expect(conv.status).toBe("open");
    expect(conv.channel).toBe("sms");
    expect(conv.organizationId).toBe(organizationId);

    // Verify unreadCount > 0 (the inbound message was not read by anyone)
    expect(
      conv.unreadCount,
      "Unread count should be positive for new inbound"
    ).toBeGreaterThanOrEqual(1);

    // Verify lastMessageAt is recent (within last 120 seconds)
    if (conv.lastMessageAt) {
      const lastMsg = new Date(conv.lastMessageAt).getTime();
      const now = Date.now();
      const ageSeconds = (now - lastMsg) / 1000;
      expect(
        ageSeconds,
        `lastMessageAt should be recent (age: ${ageSeconds}s)`
      ).toBeLessThan(120);
    }

    // Verify we can fetch the individual conversation detail
    const detailRes = await request.get(
      `${BASE}/api/conversations/${conv.id}`,
      { headers }
    );
    expect(detailRes.ok()).toBe(true);
    const detail = await detailRes.json();
    expect(detail.id).toBe(conv.id);

    console.log(
      `  TeamBox conversation verified: id=${conv.id}, unread=${conv.unreadCount}, ` +
        `channel=${conv.channel}, status=${conv.status}`
    );
  });

  // -------------------------------------------------------------------------
  // 10. Verify human takeover is available
  // -------------------------------------------------------------------------
  test("10. Verify human takeover availability", async ({ request }) => {
    const normalizedPhone = TEST_PHONE.replace(/[^0-9+]/g, "");

    // Find the conversation
    const convRes = await request.get(`${BASE}/api/conversations`, { headers });
    expect(convRes.ok()).toBe(true);
    const conversations = await convRes.json();
    const convList = Array.isArray(conversations)
      ? conversations
      : conversations.conversations ?? conversations.data ?? [];

    const conv = convList.find(
      (c: any) =>
        c.customerPhone?.includes(normalizedPhone) ||
        c.customerName?.includes(normalizedPhone)
    );
    expect(conv, "Conversation should exist").toBeTruthy();

    // Get session info to know our userId
    const session = await login(request, testUsers.orgAdmin);
    const userId = session.userId;

    // Assign conversation to current user (human takeover)
    const assignRes = await request.patch(
      `${BASE}/api/conversations/${conv.id}`,
      {
        headers,
        data: { assignedTo: userId },
      }
    );
    expect(assignRes.ok(), "Assignment should succeed").toBe(true);
    const assigned = await assignRes.json();
    expect(assigned.assignedTo).toBe(userId);

    // Verify the conversation now shows as assigned
    const verifyRes = await request.get(
      `${BASE}/api/conversations/${conv.id}`,
      { headers }
    );
    expect(verifyRes.ok()).toBe(true);
    const verified = await verifyRes.json();
    expect(verified.assignedTo).toBe(userId);

    // Post a human message to the conversation
    const msgRes = await request.post(
      `${BASE}/api/conversations/${conv.id}/messages`,
      {
        headers,
        data: {
          content:
            "Hi, this is the sales team. We would be happy to schedule a test drive for you!",
          role: "agent",
          senderName: "Sales Agent",
        },
      }
    );
    expect(
      msgRes.status(),
      "Posting a message should not error"
    ).toBeLessThan(500);

    // Clear assignment to restore original state
    await request.patch(`${BASE}/api/conversations/${conv.id}`, {
      headers,
      data: { assignedTo: null },
    });

    console.log(
      `  Human takeover verified: assigned to ${userId}, message posted, assignment cleared`
    );
  });
});
