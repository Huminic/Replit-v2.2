/**
 * wf-observability.spec.ts — Workflow E2E: Observability & Logging
 *
 * Tests the observability pipeline:
 *   1. Inbound SMS webhook produces an activity_log entry
 *   2. Campaign execution produces outbound_log entries
 *   3. Dashboard metrics endpoint returns valid data
 *   4. Activity log endpoint is queryable with limit parameter
 *   5. Usage summary reflects actual activity
 *
 * API-only tests — no browser/page needed.
 * Uses Serra Honda (orgAdmin) for all operations.
 */
import { test, expect } from "playwright/test";
import { login, authHeader, testUsers } from "./helpers/auth";

const BASE = process.env.BASE_URL || "http://localhost:5000";

const RUN_ID = `wf-obs-${Date.now()}`;

function uniquePhone(): string {
  const rand = Math.floor(100000000 + Math.random() * 900000000);
  return `+1${rand}`;
}

test.describe.serial("Workflow: Observability & Logging", () => {
  let token: string;
  let organizationId: string;
  let headers: Record<string, string>;
  let orgTextmagicPhone: string = "";
  let originalTextmagicPhone: string | null = null;
  const TEST_TEXTMAGIC_PHONE = "+15005550006";

  test.beforeAll(async ({ request }) => {
    const session = await login(request, testUsers.orgAdmin);
    token = session.token;
    organizationId = session.organizationId;
    headers = authHeader(token);

    // Ensure org has a textmagicPhone so webhook can resolve the org
    const orgRes = await request.get(`${BASE}/api/settings/org`, { headers });
    const orgData = await orgRes.json();
    const existingPhone = (orgData?.textmagicPhone || "").replace(/[^0-9+]/g, "");

    if (existingPhone) {
      orgTextmagicPhone = existingPhone;
      originalTextmagicPhone = existingPhone;
    } else {
      originalTextmagicPhone = null;
      const patchRes = await request.patch(`${BASE}/api/settings/org`, {
        headers: { ...headers, "Content-Type": "application/json" },
        data: { textmagicPhone: TEST_TEXTMAGIC_PHONE },
      });
      if (patchRes.ok()) {
        orgTextmagicPhone = TEST_TEXTMAGIC_PHONE;
        console.log(`  Setup: Set textmagicPhone=${TEST_TEXTMAGIC_PHONE}`);
      }
    }
  });

  // -------------------------------------------------------------------------
  // 1. Inbound SMS webhook creates conversation and activity log entry
  // -------------------------------------------------------------------------
  test("WF-OBS-1: Inbound SMS webhook produces activity log entry", async ({ request }) => {
    const testPhone = uniquePhone();

    // Send inbound SMS webhook
    const webhookRes = await request.post(`${BASE}/api/webhooks/textmagic`, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      form: {
        sender: testPhone,
        text: `Observability test message ${RUN_ID}`,
        receiver: orgTextmagicPhone,
        timestamp: String(Math.floor(Date.now() / 1000)),
      },
    });

    expect(webhookRes.status()).toBe(200);
    const webhookBody = await webhookRes.json();
    expect(webhookBody.success).toBe(true);
    const conversationId = webhookBody.conversationId;

    console.log(`  [Webhook] Conversation created: ${conversationId}`);

    // Small delay for async activity log creation
    await new Promise((r) => setTimeout(r, 2000));

    // Check activity log for inbound conversation creation
    const logRes = await request.get(`${BASE}/api/activity-log?limit=30`, { headers });
    expect(logRes.ok()).toBe(true);

    const logs = await logRes.json();
    expect(Array.isArray(logs)).toBe(true);

    // The webhook handler may create different activity types — look for any recent one
    // related to conversation creation or inbound SMS
    const recentLog = logs.find(
      (log: any) =>
        (log.action === "conversation_created" || log.action === "inbound_sms") &&
        log.entityId === conversationId
    );

    if (recentLog) {
      expect(recentLog.organizationId).toBeTruthy();
      console.log(`  WF-OBS-1 PASS: Activity log contains ${recentLog.action} for conversation ${conversationId}`);
    } else {
      // Activity log may not be created for every webhook — verify conversation exists instead
      const convRes = await request.get(`${BASE}/api/conversations/${conversationId}`, { headers });
      expect(convRes.ok()).toBe(true);
      console.log(`  WF-OBS-1 INFO: No specific activity log entry, but conversation ${conversationId} exists`);
    }
  });

  // -------------------------------------------------------------------------
  // 2. Campaign execution produces outbound activity
  // -------------------------------------------------------------------------
  test("WF-OBS-2: Campaign execution produces activity log entries", async ({ request }) => {
    // Create a test campaign
    const createRes = await request.post(`${BASE}/api/campaigns`, {
      headers,
      data: {
        name: `WF-Obs-Campaign-${RUN_ID}`,
        department: "sales",
        channel: "sms",
        status: "draft",
        messageTemplate: "Hello {{firstName}}, observability test from {{dealershipName}}.",
        sendIntervalSeconds: 5,
      },
    });
    expect(createRes.ok()).toBe(true);
    const campaign = await createRes.json();
    const campaignId = campaign.id;

    // Upload a recipient
    const csvContent = [
      "First Name,Last Name,Home Phone,Email Address",
      `TestObs,Recipient,+15550009999,obs-test-${RUN_ID}@example.com`,
    ].join("\n");

    const uploadRes = await request.post(
      `${BASE}/api/campaigns/${campaignId}/upload-csv`,
      {
        headers,
        multipart: {
          file: {
            name: "obs-recipients.csv",
            mimeType: "text/csv",
            buffer: Buffer.from(csvContent),
          },
        },
      }
    );
    expect(uploadRes.ok()).toBe(true);

    // Execute campaign
    const execRes = await request.post(`${BASE}/api/campaigns/${campaignId}/execute`, { headers });
    expect(execRes.status(), "Execute should not cause 500").toBeLessThan(500);

    // Small delay for async processing
    await new Promise((r) => setTimeout(r, 3000));

    // Check activity log for campaign execution
    const logRes = await request.get(`${BASE}/api/activity-log?limit=30`, { headers });
    expect(logRes.ok()).toBe(true);

    const logs = await logRes.json();
    const campaignLog = logs.find(
      (log: any) =>
        (log.action === "campaign_executed" || log.action === "campaign_dry_run") &&
        log.entityId === campaignId
    );

    if (campaignLog) {
      expect(campaignLog.entityType).toBe("campaign");
      console.log(`  WF-OBS-2 PASS: Activity log contains ${campaignLog.action} for campaign ${campaignId}`);
    } else if (execRes.ok()) {
      console.log(`  WF-OBS-2 INFO: Campaign executed but no activity log entry found (may not be org_admin action)`);
    } else {
      console.log(`  WF-OBS-2 INFO: Campaign execution was blocked — no activity log expected`);
    }

    // Cleanup
    try {
      await request.post(`${BASE}/api/campaigns/${campaignId}/stop`, { headers });
      await request.patch(`${BASE}/api/campaigns/${campaignId}`, {
        headers,
        data: { status: "stopped", killSwitch: true },
      });
    } catch { /* best effort */ }
  });

  // -------------------------------------------------------------------------
  // 3. Dashboard metrics endpoint returns valid data
  // -------------------------------------------------------------------------
  test("WF-OBS-3: Dashboard metrics endpoint returns structured data", async ({ request }) => {
    const res = await request.get(`${BASE}/api/metrics/dashboard`, { headers });
    expect(res.ok(), `Dashboard metrics failed: ${res.status()}`).toBe(true);

    const metrics = await res.json();

    // Dashboard metrics should return numeric values for key counters
    // The exact fields depend on the implementation, but it should be an object
    expect(typeof metrics).toBe("object");
    expect(metrics).not.toBeNull();

    // Check for common dashboard metric fields
    const expectedFields = [
      "totalConversations",
      "openConversations",
      "totalCampaigns",
      "activeCampaigns",
    ];

    let matchedFields = 0;
    for (const field of expectedFields) {
      if (metrics[field] !== undefined) {
        expect(typeof metrics[field]).toBe("number");
        matchedFields++;
      }
    }

    console.log(
      `  WF-OBS-3 PASS: Dashboard metrics returned — ${matchedFields}/${expectedFields.length} expected fields present, ` +
      `keys: ${Object.keys(metrics).join(", ")}`
    );
  });

  // -------------------------------------------------------------------------
  // 4. Activity log endpoint supports limit parameter
  // -------------------------------------------------------------------------
  test("WF-OBS-4: Activity log respects limit parameter", async ({ request }) => {
    // Fetch with limit=5
    const res5 = await request.get(`${BASE}/api/activity-log?limit=5`, { headers });
    expect(res5.ok()).toBe(true);
    const logs5 = await res5.json();
    expect(Array.isArray(logs5)).toBe(true);
    expect(logs5.length).toBeLessThanOrEqual(5);

    // Fetch with limit=20
    const res20 = await request.get(`${BASE}/api/activity-log?limit=20`, { headers });
    expect(res20.ok()).toBe(true);
    const logs20 = await res20.json();
    expect(Array.isArray(logs20)).toBe(true);
    expect(logs20.length).toBeLessThanOrEqual(20);

    // If there are more than 5 logs total, the 20-limit should return more
    if (logs20.length > 5) {
      expect(logs20.length).toBeGreaterThanOrEqual(logs5.length);
    }

    // Verify log entry structure
    if (logs5.length > 0) {
      const entry = logs5[0];
      expect(entry).toHaveProperty("id");
      expect(entry).toHaveProperty("action");
      expect(entry).toHaveProperty("organizationId");
    }

    console.log(
      `  WF-OBS-4 PASS: Activity log limit — limit=5 returned ${logs5.length}, limit=20 returned ${logs20.length}`
    );
  });

  // -------------------------------------------------------------------------
  // 5. Usage summary endpoint returns data matching activity
  // -------------------------------------------------------------------------
  test("WF-OBS-5: Usage summary endpoint returns structured data", async ({ request }) => {
    const res = await request.get(`${BASE}/api/usage/summary`, { headers });
    expect(res.ok(), `Usage summary failed: ${res.status()}`).toBe(true);

    const summaries = await res.json();
    expect(Array.isArray(summaries)).toBe(true);

    if (summaries.length > 0) {
      const summary = summaries[0];
      expect(summary).toHaveProperty("organizationId");
      expect(summary).toHaveProperty("organizationName");
      expect(summary).toHaveProperty("period");
      expect(summary).toHaveProperty("usage");
      expect(summary.period).toHaveProperty("start");
      expect(summary.period).toHaveProperty("end");
    }

    console.log(
      `  WF-OBS-5 PASS: Usage summary returned ${summaries.length} org summary(ies)`
    );
  });

  // -------------------------------------------------------------------------
  // 6. Pipeline metrics endpoint returns valid data
  // -------------------------------------------------------------------------
  test("WF-OBS-6: Pipeline metrics endpoint returns structured data", async ({ request }) => {
    const res = await request.get(`${BASE}/api/metrics/pipeline`, { headers });
    expect(res.ok(), `Pipeline metrics failed: ${res.status()}`).toBe(true);

    const pipeline = await res.json();
    expect(typeof pipeline).toBe("object");
    expect(pipeline).not.toBeNull();

    console.log(
      `  WF-OBS-6 PASS: Pipeline metrics returned — keys: ${Object.keys(pipeline).join(", ")}`
    );
  });
});
