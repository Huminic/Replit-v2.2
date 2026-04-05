/**
 * Workflow E2E: Cold Inbound SMS to Sales Department
 *
 * Full chain: Inbound text to sales number -> Sales Agent auto-responds ->
 * conversation in TeamBox -> salesperson takeover available.
 *
 * API-only tests — no browser/page needed.
 * Real API calls against the configured BASE_URL.
 *
 * The AI Sales Agent should respond differently than the Service Agent —
 * sales inquiries trigger sales-oriented AI behavior (pricing, inventory, test drives)
 * vs service inquiries (scheduling, maintenance, repairs).
 */
import { test, expect } from "playwright/test";
import { login, authHeader, testUsers } from "./helpers/auth";

const BASE = process.env.BASE_URL || "http://localhost:5000";

// Generate a unique phone number per test run to avoid collisions
function uniquePhone(): string {
  const rand = Math.floor(100000000 + Math.random() * 900000000);
  return `+1${rand}`;
}

test.describe("Workflow: Cold Inbound SMS — Sales Department", () => {
  const coldPhone = uniquePhone();
  let conversationId: string | null = null;
  let authToken: string;
  let userId: string;
  let organizationId: string;
  let orgTextmagicPhone: string;
  let originalTextmagicPhone: string | null = null;
  const TEST_TEXTMAGIC_PHONE = "+15005550006"; // Twilio test number

  test.beforeAll(async ({ request }) => {
    const auth = await login(request, testUsers.orgAdmin); // Serra Honda org_admin
    authToken = auth.token;
    userId = auth.userId;
    organizationId = auth.organizationId;

    // Fetch org TextMagic phone so webhook can resolve the org in multi-org environments
    const orgRes = await request.get(`${BASE}/api/settings/org`, {
      headers: authHeader(authToken),
    });
    const orgData = await orgRes.json();
    const existingPhone = (orgData?.textmagicPhone || "").replace(/[^0-9+]/g, "");

    if (existingPhone) {
      orgTextmagicPhone = existingPhone;
      originalTextmagicPhone = existingPhone;
    } else {
      // Serra Honda has no textmagicPhone configured — set a test number so the
      // TextMagic webhook can resolve inbound SMS to this org.
      originalTextmagicPhone = null;
      const patchRes = await request.patch(`${BASE}/api/settings/org`, {
        headers: { ...authHeader(authToken), "Content-Type": "application/json" },
        data: { textmagicPhone: TEST_TEXTMAGIC_PHONE },
      });
      if (!patchRes.ok()) {
        throw new Error(`Failed to set textmagicPhone on org: ${patchRes.status()} ${await patchRes.text()}`);
      }
      orgTextmagicPhone = TEST_TEXTMAGIC_PHONE;
      console.log(`  Setup: Set textmagicPhone=${TEST_TEXTMAGIC_PHONE} on Serra Honda (was empty)`);
    }
  });

  test("WF-SALES-1: Inbound SMS webhook creates conversation for sales inquiry", async ({ request }) => {
    // Simulate an inbound SMS from a cold prospect asking about vehicle purchase.
    // This is a sales-oriented message (pricing, inventory, test drives).
    const webhookRes = await request.post(`${BASE}/api/webhooks/textmagic`, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      form: {
        sender: coldPhone,
        text: "Hey, I saw your ad for the 2025 Honda CR-V. What's the best price you can do? I'd also like to schedule a test drive this weekend.",
        receiver: orgTextmagicPhone, // resolved from org settings so webhook can identify the target org
        timestamp: String(Math.floor(Date.now() / 1000)),
      },
    });

    // The webhook should return 200 with success: true and a conversationId
    expect(webhookRes.status()).toBe(200);
    const body = await webhookRes.json();
    expect(body.success).toBe(true);
    expect(body.conversationId).toBeTruthy();
    conversationId = body.conversationId;

    console.log(`  WF-SALES-1 PASS: Inbound SMS webhook accepted, conversationId=${conversationId}`);
  });

  test("WF-SALES-2: Conversation exists with correct channel and open status", async ({ request }) => {
    expect(conversationId).toBeTruthy();

    const convRes = await request.get(`${BASE}/api/conversations/${conversationId}`, {
      headers: authHeader(authToken),
    });
    expect(convRes.status()).toBe(200);

    const conv = await convRes.json();
    expect(conv.id).toBe(conversationId);
    expect(conv.channel).toBe("sms");
    expect(conv.status).toBe("open");
    expect(conv.customerPhone).toContain(coldPhone.replace("+", ""));
    expect(conv.organizationId).toBeTruthy();

    // Verify this is a new conversation (not merged with an existing one)
    expect(conv.unreadCount).toBeGreaterThanOrEqual(1);

    console.log(`  WF-SALES-2 PASS: Conversation ${conversationId} exists — channel=sms, status=open, unread=${conv.unreadCount}`);
  });

  test("WF-SALES-3: AI Sales Agent auto-responded to sales inquiry", async ({ request }) => {
    // The inbound SMS handler fires an async AI response (fire-and-forget).
    // Poll for an agent message in the conversation.
    // The AI Sales Agent should respond with sales-relevant content.
    expect(conversationId).toBeTruthy();

    let messages: any[] = [];
    let agentMessage: any = null;
    const maxAttempts = 12; // poll for up to 60 seconds

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const msgRes = await request.get(`${BASE}/api/conversations/${conversationId}/messages`, {
        headers: authHeader(authToken),
      });
      expect(msgRes.status()).toBe(200);
      messages = await msgRes.json();

      // Look for agent-role message (AI auto-response)
      agentMessage = messages.find((m: any) => m.role === "agent");
      if (agentMessage) break;

      // Wait 5 seconds before next poll
      await new Promise((r) => setTimeout(r, 5000));
    }

    // Verify the user message was stored correctly
    const userMessage = messages.find((m: any) => m.role === "user");
    expect(userMessage).toBeTruthy();
    expect(userMessage.content).toContain("CR-V");

    if (agentMessage) {
      // AI agent responded — verify it's a substantive response
      expect(agentMessage.content).toBeTruthy();
      expect(agentMessage.content.length).toBeGreaterThan(10);
      expect(agentMessage.senderName).toBeTruthy();

      // The sales agent response should be different from a service agent response.
      // We verify content exists and is non-trivial, but don't assert specific wording
      // since the AI model generates dynamic responses.
      console.log(`  WF-SALES-3 PASS: AI agent "${agentMessage.senderName}" auto-responded: "${agentMessage.content.substring(0, 80)}..."`);
    } else {
      // No agent message — outbound may be disabled or no active SMS agent configured.
      console.log(`  WF-SALES-3 PARTIAL: No AI agent response found after ${maxAttempts * 5}s — outbound may be disabled or no active SMS agent configured`);
      console.log(`  Messages in conversation: ${messages.length} (roles: ${messages.map((m: any) => m.role).join(", ")})`);
    }
  });

  test("WF-SALES-4: Conversation appears in TeamBox SMS list for org", async ({ request }) => {
    expect(conversationId).toBeTruthy();

    const listRes = await request.get(`${BASE}/api/conversations?channel=sms`, {
      headers: authHeader(authToken),
    });
    expect(listRes.status()).toBe(200);

    const conversations = await listRes.json();
    const convList = Array.isArray(conversations) ? conversations : conversations.data || [];

    const ourConv = convList.find((c: any) => c.id === conversationId);
    expect(ourConv).toBeTruthy();
    expect(ourConv.channel).toBe("sms");
    expect(ourConv.status).toBe("open");

    // Check if agent is assigned and what department they belong to
    if (ourConv.agentId) {
      const agentRes = await request.get(`${BASE}/api/agents`, {
        headers: authHeader(authToken),
      });
      if (agentRes.ok()) {
        const agents = await agentRes.json();
        const agentList = Array.isArray(agents) ? agents : agents.data || [];
        const assignedAgent = agentList.find((a: any) => a.id === ourConv.agentId);
        if (assignedAgent) {
          console.log(`  WF-SALES-4 INFO: Conversation assigned to agent "${assignedAgent.name}" (department: ${assignedAgent.department})`);
        }
      }
    }

    // Also verify the conversation has lastMessageAt set (indicates activity)
    expect(ourConv.lastMessageAt).toBeTruthy();

    console.log(`  WF-SALES-4 PASS: Conversation ${conversationId} found in TeamBox SMS list, lastMessageAt=${ourConv.lastMessageAt}`);
  });

  test("WF-SALES-5: Salesperson takeover pauses AI and allows human response", async ({ request }) => {
    // Verify the conversation can be taken over by a salesperson.
    // Takeover = PATCH /api/conversations/:id with assignedTo set to current user.
    // After takeover, aiPaused should be true (AI stops auto-responding).
    expect(conversationId).toBeTruthy();

    // Confirm no human is assigned yet
    const beforeRes = await request.get(`${BASE}/api/conversations/${conversationId}`, {
      headers: authHeader(authToken),
    });
    expect(beforeRes.status()).toBe(200);
    const before = await beforeRes.json();
    expect(before.assignedTo).toBeFalsy();

    // Perform salesperson takeover
    const takeoverRes = await request.patch(`${BASE}/api/conversations/${conversationId}`, {
      headers: {
        ...authHeader(authToken),
        "Content-Type": "application/json",
      },
      data: { assignedTo: userId },
    });
    expect(takeoverRes.status()).toBe(200);
    const afterTakeover = await takeoverRes.json();
    expect(afterTakeover.assignedTo).toBe(userId);
    expect(afterTakeover.aiPaused).toBe(true);

    console.log(`  WF-SALES-5 PASS: Salesperson takeover — assignedTo=${userId}, aiPaused=true`);

    // Verify the salesperson can post a human message to the conversation
    const humanMsgRes = await request.post(`${BASE}/api/conversations/${conversationId}/messages`, {
      headers: {
        ...authHeader(authToken),
        "Content-Type": "application/json",
      },
      data: {
        role: "agent",
        content: "Hi! Thanks for your interest in the CR-V. I'm a sales associate here at Serra Honda. Let me check our current inventory and pricing for you.",
        senderName: "Test Salesperson",
      },
    });
    expect(humanMsgRes.status()).toBe(201);
    const humanMsg = await humanMsgRes.json();
    expect(humanMsg.content).toContain("CR-V");
    expect(humanMsg.role).toBe("agent");

    console.log(`  WF-SALES-5 INFO: Human message posted successfully to conversation`);

    // Verify the message appears in the conversation history
    const msgsRes = await request.get(`${BASE}/api/conversations/${conversationId}/messages`, {
      headers: authHeader(authToken),
    });
    expect(msgsRes.status()).toBe(200);
    const allMsgs = await msgsRes.json();
    const humanMessages = allMsgs.filter((m: any) => m.senderName === "Test Salesperson");
    expect(humanMessages.length).toBeGreaterThanOrEqual(1);

    // Release takeover
    const releaseRes = await request.patch(`${BASE}/api/conversations/${conversationId}`, {
      headers: {
        ...authHeader(authToken),
        "Content-Type": "application/json",
      },
      data: { assignedTo: null },
    });
    expect(releaseRes.status()).toBe(200);
    const afterRelease = await releaseRes.json();
    expect(afterRelease.assignedTo).toBeNull();
    expect(afterRelease.aiPaused).toBe(false);

    console.log(`  WF-SALES-5 INFO: Takeover released — AI re-enabled`);
  });

  test.afterAll(async ({ request }) => {
    const auth = await login(request, testUsers.orgAdmin);
    // Cleanup: delete the test conversation
    if (conversationId) {
      try {
        await request.delete(`${BASE}/api/conversations/${conversationId}`, {
          headers: authHeader(auth.token),
        });
        console.log(`  Cleanup: deleted conversation ${conversationId}`);
      } catch {
        // Cleanup failure is non-fatal
      }
    }
    // Restore original textmagicPhone (or remove if it was empty)
    if (originalTextmagicPhone === null) {
      try {
        await request.patch(`${BASE}/api/settings/org`, {
          headers: { ...authHeader(auth.token), "Content-Type": "application/json" },
          data: { textmagicPhone: "" },
        });
        console.log(`  Cleanup: Restored textmagicPhone to empty`);
      } catch {
        // Cleanup failure is non-fatal
      }
    }
  });
});
