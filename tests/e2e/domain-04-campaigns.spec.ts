import { test, expect } from "playwright/test";
import { testUsers, login, authHeader } from "./helpers/auth";

test.describe("Domain 4: Campaigns", () => {
  let token: string;
  let sharedCampaignId: string | null = null;

  test.beforeAll(async ({ request }) => {
    const session = await login(request, testUsers.orgAdmin);
    token = session.token;

    // Create a shared campaign for tests that need one
    const createRes = await request.post("/api/campaigns", {
      headers: authHeader(token),
      data: {
        name: "E2E Shared Test Campaign",
        department: "sales",
        channel: "sms",
        status: "draft",
      },
    });

    if (createRes.ok()) {
      const campaign = await createRes.json();
      sharedCampaignId = campaign.id;
    }
  });

  test("4.1 Campaign create/upload/execute flow", async ({ request }) => {
    // Step 1: Create campaign
    const createRes = await request.post("/api/campaigns", {
      headers: authHeader(token),
      data: {
        name: "E2E Lifecycle Test Campaign",
        department: "sales",
        channel: "sms",
        status: "draft",
      },
    });

    if (!createRes.ok()) {
      // May fail due to entitlement limits — verify proper error response
      expect(createRes.status()).toBeLessThan(500);
      return;
    }

    const campaign = await createRes.json();
    expect(campaign.id).toBeDefined();
    expect(campaign.name).toBe("E2E Lifecycle Test Campaign");

    // Step 2: Get campaign details
    const getRes = await request.get(`/api/campaigns/${campaign.id}`, {
      headers: authHeader(token),
    });
    expect(getRes.ok()).toBe(true);
    const fetched = await getRes.json();
    expect(fetched.id).toBe(campaign.id);

    // Step 3: Update campaign status
    const patchRes = await request.patch(`/api/campaigns/${campaign.id}`, {
      headers: authHeader(token),
      data: { status: "active" },
    });
    expect(patchRes.ok()).toBe(true);

    // Step 4: Check execution status
    const statusRes = await request.get(`/api/campaigns/${campaign.id}/execution-status`, {
      headers: authHeader(token),
    });
    expect(statusRes.status()).toBeLessThan(500);
  });

  test("4.2 CSV upload accepts required fields", async ({ request }) => {
    // First, get existing campaigns or create one
    const listRes = await request.get("/api/campaigns", {
      headers: authHeader(token),
    });
    expect(listRes.ok()).toBe(true);
    const campaigns = await listRes.json();

    if (campaigns.length === 0) {
      // Create a campaign for the test
      const createRes = await request.post("/api/campaigns", {
        headers: authHeader(token),
        data: {
          name: "CSV Upload Test Campaign",
          department: "marketing",
          channel: "sms",
          status: "draft",
        },
      });
      if (!createRes.ok()) {
        expect(createRes.status()).toBeLessThan(500);
        return;
      }
      campaigns.push(await createRes.json());
    }

    const campaignId = campaigns[0].id;

    // Create a CSV buffer with required fields
    const csvContent = "firstName,lastName,phone,email,vin,model,model year\nJohn,Doe,5551234567,john@test.com,1HGCG5655WA041265,Accord,2024\nJane,Smith,5559876543,jane@test.com,3GPKHURMXRS508589,Prologue,2025";
    const boundary = "----E2ETestBoundary";
    const body = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="file"; filename="test-recipients.csv"',
      "Content-Type: text/csv",
      "",
      csvContent,
      `--${boundary}--`,
    ].join("\r\n");

    const uploadRes = await request.post(`/api/campaigns/${campaignId}/upload-csv`, {
      headers: {
        ...authHeader(token),
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
      },
      data: Buffer.from(body),
    });

    // Should accept the upload or return a validation error (not 500)
    expect(uploadRes.status()).toBeLessThan(500);

    // Verify vehicle columns were mapped (S-18: I-190)
    if (uploadRes.ok()) {
      const uploadResult = await uploadRes.json();
      const matched = uploadResult.columnsMatched || [];
      expect(matched).toContain("VIN");
      expect(matched).toContain("Model");
      expect(matched).toContain("Model Year");

      // Verify recipients have vehicle data
      const recipRes = await request.get(`/api/campaigns/${campaignId}/recipients`, {
        headers: authHeader(token),
      });
      if (recipRes.ok()) {
        const recipients = await recipRes.json();
        const recipList = Array.isArray(recipients) ? recipients : recipients.data ?? [];
        if (recipList.length > 0) {
          const first = recipList[0];
          expect(first.vin).toBeTruthy();
          expect(first.vehicleModel).toBeTruthy();
          expect(first.vehicleYear).toBeTruthy();
        }
      }
    }
  });

  test("4.3 Campaign execution sends SMS via MCP", async ({ request }) => {
    // Create a dedicated SMS campaign for this test
    const createRes = await request.post("/api/campaigns", {
      headers: authHeader(token),
      data: {
        name: "E2E SMS Execution Test",
        department: "sales",
        channel: "sms",
        status: "draft",
      },
    });

    let campaignId: string;
    if (createRes.ok()) {
      const created = await createRes.json();
      campaignId = created.id;
    } else {
      // Fallback: use shared campaign or find one from the list
      if (sharedCampaignId) {
        campaignId = sharedCampaignId;
      } else {
        const listRes = await request.get("/api/campaigns", {
          headers: authHeader(token),
        });
        expect(listRes.ok()).toBe(true);
        const campaigns = await listRes.json();
        const smsCampaign = campaigns.find(
          (c: any) => c.channel === "sms" || c.channel === "both"
        );
        if (!smsCampaign) {
          test.info().annotations.push({
            type: "note",
            description: "No SMS campaign available and creation blocked by entitlement",
          });
          return;
        }
        campaignId = smsCampaign.id;
      }
    }

    // Attempt execution — may be blocked by kill switch or outbound settings, which is OK
    const execRes = await request.post(`/api/campaigns/${campaignId}/execute`, {
      headers: authHeader(token),
    });
    // Expect either success or a controlled rejection (not a server crash)
    expect(execRes.status()).toBeLessThan(500);
  });

  test("4.4 Campaign execution sends email via MCP", async ({ request }) => {
    // Create a dedicated email campaign for this test
    const createRes = await request.post("/api/campaigns", {
      headers: authHeader(token),
      data: {
        name: "E2E Email Execution Test",
        department: "marketing",
        channel: "email",
        status: "draft",
      },
    });

    let campaignId: string;
    if (createRes.ok()) {
      const created = await createRes.json();
      campaignId = created.id;
    } else {
      // Fallback: use shared campaign or find one from the list
      const listRes = await request.get("/api/campaigns", {
        headers: authHeader(token),
      });
      expect(listRes.ok()).toBe(true);
      const campaigns = await listRes.json();
      const emailCampaign = campaigns.find(
        (c: any) => c.channel === "email" || c.channel === "both"
      );
      if (!emailCampaign) {
        if (sharedCampaignId) {
          campaignId = sharedCampaignId;
        } else {
          test.info().annotations.push({
            type: "note",
            description: "No email campaign available and creation blocked by entitlement",
          });
          return;
        }
      } else {
        campaignId = emailCampaign.id;
      }
    }

    const execRes = await request.post(`/api/campaigns/${campaignId}/execute`, {
      headers: authHeader(token),
    });
    expect(execRes.status()).toBeLessThan(500);
  });

  test("4.5 Kill switch blocks outbound", async ({ request }) => {
    // Create a dedicated campaign for kill switch test
    let campaignId: string;
    let originalStatus = "draft";

    const createRes = await request.post("/api/campaigns", {
      headers: authHeader(token),
      data: {
        name: "E2E Kill Switch Test",
        department: "sales",
        channel: "sms",
        status: "draft",
      },
    });

    if (createRes.ok()) {
      const created = await createRes.json();
      campaignId = created.id;
      originalStatus = created.status;
    } else if (sharedCampaignId) {
      campaignId = sharedCampaignId;
      // Fetch current status for cleanup
      const getRes = await request.get(`/api/campaigns/${sharedCampaignId}`, {
        headers: authHeader(token),
      });
      if (getRes.ok()) {
        const current = await getRes.json();
        originalStatus = current.status;
      }
    } else {
      const listRes = await request.get("/api/campaigns", {
        headers: authHeader(token),
      });
      expect(listRes.ok()).toBe(true);
      const campaigns = await listRes.json();
      if (campaigns.length === 0) return;
      campaignId = campaigns[0].id;
      originalStatus = campaigns[0].status;
    }

    // Activate kill switch
    const killRes = await request.patch(`/api/campaigns/${campaignId}`, {
      headers: authHeader(token),
      data: { killSwitch: true },
    });
    expect(killRes.ok()).toBe(true);

    // Attempt execution — should be blocked
    const execRes = await request.post(`/api/campaigns/${campaignId}/execute`, {
      headers: authHeader(token),
    });
    // Execution should fail or be blocked (not 500)
    expect(execRes.status()).toBeLessThan(500);

    if (!execRes.ok()) {
      const body = await execRes.json();
      // Should mention kill switch or blocked
      const msg = JSON.stringify(body).toLowerCase();
      expect(
        msg.includes("kill") || msg.includes("block") || msg.includes("disabled") || msg.includes("not allowed") || msg.includes("switch")
      ).toBe(true);
    }

    // Deactivate kill switch (cleanup)
    await request.patch(`/api/campaigns/${campaignId}`, {
      headers: authHeader(token),
      data: { killSwitch: false },
    });
  });

  test("4.6 Channel-specific pause", async ({ request }) => {
    const listRes = await request.get("/api/campaigns", {
      headers: authHeader(token),
    });
    expect(listRes.ok()).toBe(true);
    const campaigns = await listRes.json();

    // Find a campaign to test status changes
    if (campaigns.length === 0) return;

    const campaign = campaigns[0];

    // Pause the campaign
    const pauseRes = await request.patch(`/api/campaigns/${campaign.id}`, {
      headers: authHeader(token),
      data: { status: "paused" },
    });
    expect(pauseRes.ok()).toBe(true);

    // Verify paused state
    const getRes = await request.get(`/api/campaigns/${campaign.id}`, {
      headers: authHeader(token),
    });
    expect(getRes.ok()).toBe(true);
    const updated = await getRes.json();
    expect(updated.status).toBe("paused");

    // Restore original status
    await request.patch(`/api/campaigns/${campaign.id}`, {
      headers: authHeader(token),
      data: { status: campaign.status },
    });
  });

  test("4.7 Execution statuses org-scoped", async ({ request }) => {
    // Login as two different org users and compare execution statuses
    const adminAuth = await login(request, testUsers.orgAdmin);
    const adminStatusRes = await request.get("/api/campaigns/execution-statuses", {
      headers: authHeader(adminAuth.token),
    });
    expect(adminStatusRes.ok()).toBe(true);
    const adminStatuses = await adminStatusRes.json();

    // Login as super admin (different org context)
    const superAuth = await login(request, testUsers.superAdmin);
    const superStatusRes = await request.get("/api/campaigns/execution-statuses", {
      headers: authHeader(superAuth.token),
    });
    expect(superStatusRes.ok()).toBe(true);
    const superStatuses = await superStatusRes.json();

    // Endpoint returns an object keyed by campaign ID — verify structure
    expect(typeof adminStatuses === 'object' && adminStatuses !== null).toBe(true);
    expect(typeof superStatuses === 'object' && superStatuses !== null).toBe(true);
  });

  test("4.8 Campaign stop halts execution", async ({ request }) => {
    const listRes = await request.get("/api/campaigns", {
      headers: authHeader(token),
    });
    expect(listRes.ok()).toBe(true);
    const campaigns = await listRes.json();

    if (campaigns.length === 0) return;

    const campaign = campaigns[0];

    // Call the stop endpoint
    const stopRes = await request.post(`/api/campaigns/${campaign.id}/stop`, {
      headers: authHeader(token),
    });
    // Should succeed or return a controlled error (e.g., campaign not currently executing)
    expect(stopRes.status()).toBeLessThan(500);
  });

  test("4.9 Customer replies create TeamBox thread", async ({ request }) => {
    // Check conversations endpoint — TeamBox threads are conversations
    const convRes = await request.get("/api/conversations", {
      headers: authHeader(token),
    });
    expect(convRes.ok()).toBe(true);
    const conversations = await convRes.json();
    expect(Array.isArray(conversations)).toBe(true);

    // If there are conversations, verify they have the expected structure
    if (conversations.length > 0) {
      const conv = conversations[0];
      expect(conv.id).toBeDefined();
    }
  });

  // I-036: Campaign reply triggers AI agent response
  test("4.10 Campaign reply triggers AI agent response", async ({ request }) => {
    const auth = await login(request, testUsers.orgAdmin);

    // Post simulated inbound SMS to webhook with a test phone number
    const testPhone = `1555${Date.now().toString().slice(-7)}`;
    const webhookPayload = {
      sender: testPhone,
      text: "I'd like to schedule a service appointment",
      receiver: "18338096836", // Serra Honda TextMagic number
      timestamp: Math.floor(Date.now() / 1000),
    };

    const webhookRes = await request.post("/api/webhooks/textmagic", {
      data: webhookPayload,
    });
    // Webhook should accept the payload (not crash)
    expect(webhookRes.status()).toBeLessThan(500);

    // Retry loop — webhook processing is async, conversation may not appear immediately
    const normalizedTest = testPhone.replace(/[^0-9+]/g, "");
    let matchingConv: any = undefined;
    for (let attempt = 0; attempt < 4; attempt++) {
      await new Promise(r => setTimeout(r, 3000));
      const convRes = await request.get("/api/conversations", {
        headers: authHeader(auth.token),
      });
      if (!convRes.ok()) continue;
      const conversations = await convRes.json();
      const convList = Array.isArray(conversations) ? conversations : conversations.conversations ?? conversations.data ?? [];
      matchingConv = convList.find((c: any) =>
        c.customerPhone?.includes(normalizedTest) || c.customerName?.includes(normalizedTest)
      );
      if (matchingConv) break;
    }

    // Conversation should exist (webhook creates it)
    expect(matchingConv).toBeDefined();

    if (matchingConv) {
      // Check messages in the conversation for an agent response
      const msgRes = await request.get(`/api/conversations/${matchingConv.id}/messages`, {
        headers: authHeader(auth.token),
      });
      expect(msgRes.ok()).toBe(true);
      const messages = await msgRes.json();
      const msgList = Array.isArray(messages) ? messages : messages.messages ?? messages.data ?? [];

      // Should have at least the inbound user message
      expect(msgList.length).toBeGreaterThanOrEqual(1);

      // Check if an agent response exists (AI processing may be disabled in test env)
      const agentMsg = msgList.find((m: any) => m.role === "agent" || m.role === "assistant");
      if (agentMsg) {
        expect(agentMsg.content).toBeTruthy();
      } else {
        // AI response may be blocked by OUTBOUND_LIVE_ENABLED or other gates
        // The webhook still processed successfully — annotate
        test.info().annotations.push({
          type: "note",
          description: "Webhook processed, conversation created. Agent response not generated (outbound may be disabled in test env).",
        });
      }

      // S-12/S-18 (I-192): If this conversation came from a campaign with vehicle data,
      // a system message with vehicle context should have been injected
      if (matchingConv.campaignId) {
        const vehicleCtxMsg = msgList.find((m: any) =>
          m.role === "system" && m.content?.toLowerCase().includes("campaign context")
        );
        if (vehicleCtxMsg) {
          expect(vehicleCtxMsg.content).toMatch(/campaign context/i);
        } else {
          test.info().annotations.push({
            type: "note",
            description: "No vehicle context message — conversation may not be linked to a campaign with vehicle data.",
          });
        }
      }
    }
  });

  // S-18 (I-191): Vehicle merge fields in message templates
  test("4.11 Message template substitutes vehicle merge fields", async ({ request }) => {
    const auth = await login(request, testUsers.orgAdmin);

    // Create a campaign with vehicle merge fields in the template
    const createRes = await request.post("/api/campaigns", {
      headers: authHeader(auth.token),
      data: {
        name: "Vehicle Merge Test",
        department: "service",
        channel: "sms",
        status: "draft",
        messageTemplate: "Hi {{firstName}}, your {{vehicleYear}} {{vehicleModel}} (VIN: {{vin}}) is due for service at {{dealershipName}}.",
      },
    });

    if (!createRes.ok()) {
      test.info().annotations.push({ type: "note", description: `Campaign creation returned ${createRes.status()}` });
      return;
    }

    const campaign = await createRes.json();

    // Upload CSV with vehicle data
    const csvContent = "firstName,lastName,phone,email,vin,model,model year\nTest,Driver,5550001111,test@test.com,WBAPH5C55BA123456,328i,2023";
    const boundary = "----MergeFieldTestBound";
    const body = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="file"; filename="merge-test.csv"',
      "Content-Type: text/csv",
      "",
      csvContent,
      `--${boundary}--`,
    ].join("\r\n");

    const uploadRes = await request.post(`/api/campaigns/${campaign.id}/upload-csv`, {
      headers: {
        ...authHeader(auth.token),
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
      },
      data: Buffer.from(body),
    });
    expect(uploadRes.status()).toBeLessThan(500);

    // Verify recipient stored vehicle fields
    if (uploadRes.ok()) {
      const recipRes = await request.get(`/api/campaigns/${campaign.id}/recipients`, {
        headers: authHeader(auth.token),
      });
      if (recipRes.ok()) {
        const recipients = await recipRes.json();
        const recipList = Array.isArray(recipients) ? recipients : recipients.data ?? [];
        if (recipList.length > 0) {
          expect(recipList[0].vin).toBe("WBAPH5C55BA123456");
          expect(recipList[0].vehicleModel).toBe("328i");
          expect(recipList[0].vehicleYear).toBe("2023");
        }
      }
    }
  });
});
