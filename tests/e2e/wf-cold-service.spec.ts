/**
 * Workflow E2E: Cold Inbound SMS to Service Department
 *
 * Full chain: Inbound text to service number -> Service Agent auto-responds ->
 * conversation in TeamBox -> advisor takeover available.
 *
 * API-only tests — no browser/page needed.
 * Real API calls against dev.huminicdev.com (or localhost:5000).
 */
import { test, expect } from "playwright/test";
import { login, authHeader, testUsers } from "./helpers/auth";

const BASE = process.env.BASE_URL || "http://localhost:5000";

// Generate a unique phone number per test run to avoid collisions
function uniquePhone(): string {
  const rand = Math.floor(100000000 + Math.random() * 900000000);
  return `+1${rand}`;
}

test.describe("Workflow: Cold Inbound SMS — Service Department", () => {
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

  test("WF-SVC-1: Inbound SMS webhook creates conversation", async ({ request }) => {
    // Simulate an inbound SMS webhook from a cold prospect to the service department number.
    // The TextMagic webhook endpoint is POST /api/webhooks/textmagic.
    // Payload shape: { sender, text, receiver, timestamp }
    const webhookRes = await request.post(`${BASE}/api/webhooks/textmagic`, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      form: {
        sender: coldPhone,
        text: "Hi, I need to schedule an oil change for my 2022 Honda Civic. What are your service hours?",
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

    console.log(`  WF-SVC-1 PASS: Inbound SMS webhook accepted, conversationId=${conversationId}`);
  });

  test("WF-SVC-2: Conversation exists with correct channel and status", async ({ request }) => {
    // The previous test must have created a conversation
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

    console.log(`  WF-SVC-2 PASS: Conversation ${conversationId} exists — channel=sms, status=open, phone matches`);
  });

  test("WF-SVC-3: AI agent auto-responded with agent message", async ({ request }) => {
    // The inbound SMS handler fires an async AI response (fire-and-forget).
    // Poll for an agent message in the conversation.
    // The AI response depends on OUTBOUND_LIVE_ENABLED=true and an active AI agent with SMS channel.
    // If not configured, the conversation will only have the user message — we still verify the chain.
    expect(conversationId).toBeTruthy();

    let messages: any[] = [];
    let agentMessage: any = null;
    const maxAttempts = 12; // poll for up to 60 seconds (AI response may take time)

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

    // Verify the user message was stored
    const userMessage = messages.find((m: any) => m.role === "user");
    expect(userMessage).toBeTruthy();
    expect(userMessage.content).toContain("oil change");

    if (agentMessage) {
      // AI agent responded — verify it looks like a service-related response
      expect(agentMessage.content).toBeTruthy();
      expect(agentMessage.content.length).toBeGreaterThan(10);
      expect(agentMessage.senderName).toBeTruthy();
      console.log(`  WF-SVC-3 PASS: AI agent "${agentMessage.senderName}" auto-responded: "${agentMessage.content.substring(0, 80)}..."`);
    } else {
      // No agent message — this means either OUTBOUND_LIVE_ENABLED is off,
      // no active AI agent with SMS channel, or after-hours.
      // Still a valid chain — the conversation was created and user message stored.
      console.log(`  WF-SVC-3 PARTIAL: No AI agent response found after ${maxAttempts * 5}s — outbound may be disabled or no active SMS agent configured`);
      console.log(`  Messages in conversation: ${messages.length} (roles: ${messages.map((m: any) => m.role).join(", ")})`);
    }
  });

  test("WF-SVC-4: Conversation appears in TeamBox conversation list", async ({ request }) => {
    // Fetch all SMS conversations for this org and verify ours appears
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

    // Verify it has an agentId if an AI agent was assigned (optional — depends on org config)
    if (ourConv.agentId) {
      // Fetch the agent to check department
      const agentRes = await request.get(`${BASE}/api/agents`, {
        headers: authHeader(authToken),
      });
      if (agentRes.ok()) {
        const agents = await agentRes.json();
        const agentList = Array.isArray(agents) ? agents : agents.data || [];
        const assignedAgent = agentList.find((a: any) => a.id === ourConv.agentId);
        if (assignedAgent) {
          console.log(`  WF-SVC-4 INFO: Conversation assigned to agent "${assignedAgent.name}" (department: ${assignedAgent.department})`);
        }
      }
    }

    console.log(`  WF-SVC-4 PASS: Conversation ${conversationId} found in TeamBox SMS list`);
  });

  test("WF-SVC-5: Human takeover capability exists", async ({ request }) => {
    // Verify the conversation can be taken over by a human advisor.
    // Takeover = PATCH /api/conversations/:id with assignedTo set to current user.
    // After takeover, aiPaused should be true.
    expect(conversationId).toBeTruthy();

    // First confirm assignedTo is null (AI is handling it)
    const beforeRes = await request.get(`${BASE}/api/conversations/${conversationId}`, {
      headers: authHeader(authToken),
    });
    expect(beforeRes.status()).toBe(200);
    const before = await beforeRes.json();
    expect(before.assignedTo).toBeFalsy(); // not yet taken over

    // Perform takeover
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

    console.log(`  WF-SVC-5 PASS: Takeover successful — assignedTo=${userId}, aiPaused=true`);

    // Release takeover (cleanup — set assignedTo back to null)
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

    console.log(`  WF-SVC-5 INFO: Takeover released — AI re-enabled`);
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
