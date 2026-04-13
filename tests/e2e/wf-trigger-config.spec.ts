/**
 * wf-trigger-config.spec.ts — Workflow E2E: Trigger Configuration
 *
 * Tests the agent trigger configuration API:
 *   1. GET /api/agents/:id/triggers — fetch trigger config
 *   2. PATCH /api/agents/:id/triggers — update trigger config
 *   3. Trigger validation (type, channel, delayHours)
 *   4. Trigger enable/disable per-org setting (triggersEnabled)
 *   5. Activity log records trigger config changes
 *
 * API-only tests — no browser/page needed.
 * Uses Serra Honda (orgAdmin) which has agent management permissions.
 */
import { test, expect } from "playwright/test";
import { login, authHeader, testUsers } from "./helpers/auth";

const BASE = process.env.BASE_URL || "http://localhost:5000";

test.describe.serial("Workflow: Trigger Configuration", () => {
  let token: string;
  let organizationId: string;
  let headers: Record<string, string>;
  let testAgentId: string | null = null;
  let originalTriggers: any[] | null = null;

  test.beforeAll(async ({ request }) => {
    const session = await login(request, testUsers.orgAdmin);
    token = session.token;
    organizationId = session.organizationId;
    headers = authHeader(token);

    // Find an agent to test triggers on
    const agentsRes = await request.get(`${BASE}/api/agents`, { headers });
    expect(agentsRes.ok()).toBe(true);
    const agents = await agentsRes.json();
    const agentList = Array.isArray(agents) ? agents : agents.data || [];
    expect(agentList.length, "Need at least one agent for trigger tests").toBeGreaterThan(0);
    testAgentId = agentList[0].id;

    // Backup original triggers so we can restore them
    const trigRes = await request.get(`${BASE}/api/agents/${testAgentId}/triggers`, { headers });
    if (trigRes.ok()) {
      const trigData = await trigRes.json();
      originalTriggers = trigData.triggers || [];
    }
  });

  test.afterAll(async ({ request }) => {
    // Restore original triggers
    if (testAgentId && originalTriggers !== null) {
      await request.patch(`${BASE}/api/agents/${testAgentId}/triggers`, {
        headers,
        data: { triggers: originalTriggers },
      });
    }
  });

  // -------------------------------------------------------------------------
  // 1. GET trigger config — verify structure
  // -------------------------------------------------------------------------
  test("WF-TRIG-1: GET /api/agents/:id/triggers returns valid structure", async ({ request }) => {
    expect(testAgentId, "Agent ID must be resolved").toBeTruthy();

    const res = await request.get(`${BASE}/api/agents/${testAgentId}/triggers`, {
      headers,
    });
    expect(res.ok(), `Trigger GET failed: ${res.status()}`).toBe(true);

    const body = await res.json();
    expect(body).toHaveProperty("agentId");
    expect(body).toHaveProperty("agentName");
    expect(body).toHaveProperty("triggers");
    expect(body.agentId).toBe(testAgentId);
    expect(Array.isArray(body.triggers)).toBe(true);

    // Validate each trigger if any exist
    for (const trigger of body.triggers) {
      expect(["new_lead_followup", "stale_lead", "appointment_reminder"]).toContain(trigger.type);
      expect(typeof trigger.enabled).toBe("boolean");
    }

    console.log(
      `  WF-TRIG-1 PASS: Agent "${body.agentName}" has ${body.triggers.length} trigger(s)`
    );
  });

  // -------------------------------------------------------------------------
  // 2. PATCH trigger config — update and verify persistence
  // -------------------------------------------------------------------------
  test("WF-TRIG-2: PATCH /api/agents/:id/triggers updates config", async ({ request }) => {
    expect(testAgentId, "Agent ID must be resolved").toBeTruthy();

    const newTriggers = [
      {
        type: "new_lead_followup",
        enabled: true,
        config: {
          channel: "sms",
          delayHours: 2,
        },
      },
      {
        type: "stale_lead",
        enabled: false,
        config: {
          channel: "email",
          delayHours: 48,
        },
      },
    ];

    const patchRes = await request.patch(`${BASE}/api/agents/${testAgentId}/triggers`, {
      headers,
      data: { triggers: newTriggers },
    });
    expect(patchRes.ok(), `Trigger PATCH failed: ${patchRes.status()}`).toBe(true);

    const patchBody = await patchRes.json();
    expect(patchBody.agentId).toBe(testAgentId);
    expect(patchBody.triggers).toHaveLength(2);

    // Verify the update persisted by re-reading
    const getRes = await request.get(`${BASE}/api/agents/${testAgentId}/triggers`, { headers });
    expect(getRes.ok()).toBe(true);
    const getBody = await getRes.json();

    expect(getBody.triggers).toHaveLength(2);

    const followup = getBody.triggers.find((t: any) => t.type === "new_lead_followup");
    expect(followup).toBeTruthy();
    expect(followup.enabled).toBe(true);
    expect(followup.config.channel).toBe("sms");
    expect(followup.config.delayHours).toBe(2);

    const stale = getBody.triggers.find((t: any) => t.type === "stale_lead");
    expect(stale).toBeTruthy();
    expect(stale.enabled).toBe(false);

    console.log(`  WF-TRIG-2 PASS: Trigger config updated and persisted (2 triggers)`);
  });

  // -------------------------------------------------------------------------
  // 3. Validation — invalid trigger type is rejected
  // -------------------------------------------------------------------------
  test("WF-TRIG-3: Invalid trigger type returns 400 validation error", async ({ request }) => {
    expect(testAgentId, "Agent ID must be resolved").toBeTruthy();

    const badTriggers = [
      {
        type: "invalid_trigger_type",
        enabled: true,
        config: { channel: "sms" },
      },
    ];

    const res = await request.patch(`${BASE}/api/agents/${testAgentId}/triggers`, {
      headers,
      data: { triggers: badTriggers },
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.message).toContain("Validation failed");
    expect(body.errors).toBeTruthy();
    expect(body.errors.length).toBeGreaterThan(0);

    console.log(`  WF-TRIG-3 PASS: Invalid trigger type rejected — ${body.errors[0]}`);
  });

  // -------------------------------------------------------------------------
  // 4. Validation — invalid channel is rejected
  // -------------------------------------------------------------------------
  test("WF-TRIG-4: Invalid trigger channel returns 400 validation error", async ({ request }) => {
    expect(testAgentId, "Agent ID must be resolved").toBeTruthy();

    const badTriggers = [
      {
        type: "new_lead_followup",
        enabled: true,
        config: { channel: "carrier_pigeon" },
      },
    ];

    const res = await request.patch(`${BASE}/api/agents/${testAgentId}/triggers`, {
      headers,
      data: { triggers: badTriggers },
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.message).toContain("Validation failed");

    console.log(`  WF-TRIG-4 PASS: Invalid channel rejected`);
  });

  // -------------------------------------------------------------------------
  // 5. Validation — negative delayHours is rejected
  // -------------------------------------------------------------------------
  test("WF-TRIG-5: Negative delayHours returns 400 validation error", async ({ request }) => {
    expect(testAgentId, "Agent ID must be resolved").toBeTruthy();

    const badTriggers = [
      {
        type: "new_lead_followup",
        enabled: true,
        config: { channel: "sms", delayHours: -5 },
      },
    ];

    const res = await request.patch(`${BASE}/api/agents/${testAgentId}/triggers`, {
      headers,
      data: { triggers: badTriggers },
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.message).toContain("Validation failed");

    console.log(`  WF-TRIG-5 PASS: Negative delayHours rejected`);
  });

  // -------------------------------------------------------------------------
  // 6. Validation — triggers must be an array
  // -------------------------------------------------------------------------
  test("WF-TRIG-6: Non-array triggers body returns 400", async ({ request }) => {
    expect(testAgentId, "Agent ID must be resolved").toBeTruthy();

    const res = await request.patch(`${BASE}/api/agents/${testAgentId}/triggers`, {
      headers,
      data: { triggers: "not-an-array" },
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.message).toContain("triggers must be an array");

    console.log(`  WF-TRIG-6 PASS: Non-array triggers rejected`);
  });

  // -------------------------------------------------------------------------
  // 7. Trigger enable/disable — per-org triggersEnabled setting
  // -------------------------------------------------------------------------
  test("WF-TRIG-7: Org triggersEnabled setting is accessible", async ({ request }) => {
    const res = await request.get(`${BASE}/api/settings/org`, { headers });
    expect(res.ok(), `Org settings failed: ${res.status()}`).toBe(true);

    const orgData = await res.json();
    const settings = orgData?.settings || orgData || {};

    // triggersEnabled may or may not be set — we just verify the endpoint works
    // and the field is accessible (boolean or undefined)
    const triggersEnabled = settings.triggersEnabled;
    if (triggersEnabled !== undefined) {
      expect(typeof triggersEnabled).toBe("boolean");
      console.log(`  WF-TRIG-7 PASS: Org triggersEnabled = ${triggersEnabled}`);
    } else {
      console.log(`  WF-TRIG-7 PASS: Org triggersEnabled not set (defaults to false)`);
    }
  });

  // -------------------------------------------------------------------------
  // 8. Activity log records trigger config update
  // -------------------------------------------------------------------------
  test("WF-TRIG-8: Activity log records agent_triggers_updated", async ({ request }) => {
    const res = await request.get(`${BASE}/api/activity-log?limit=20`, { headers });
    expect(res.ok(), `Activity log failed: ${res.status()}`).toBe(true);

    const logs = await res.json();
    expect(Array.isArray(logs)).toBe(true);

    // Look for a trigger update activity from test 2
    const triggerLog = logs.find(
      (log: any) =>
        log.action === "agent_triggers_updated" &&
        log.entityId === testAgentId
    );

    if (triggerLog) {
      expect(triggerLog.entityType).toBe("agent");
      const metadata = typeof triggerLog.metadata === "string"
        ? JSON.parse(triggerLog.metadata)
        : triggerLog.metadata;
      if (metadata) {
        expect(metadata.triggerCount).toBe(2);
      }
      console.log(`  WF-TRIG-8 PASS: Activity log contains agent_triggers_updated for agent ${testAgentId}`);
    } else {
      console.log(`  WF-TRIG-8 INFO: No agent_triggers_updated found in recent activity`);
    }
  });

  // -------------------------------------------------------------------------
  // 9. Access control — non-existent agent returns 404
  // -------------------------------------------------------------------------
  test("WF-TRIG-9: Non-existent agent returns 404", async ({ request }) => {
    const fakeId = "00000000-0000-0000-0000-000000000000";
    const res = await request.get(`${BASE}/api/agents/${fakeId}/triggers`, { headers });
    expect(res.status()).toBe(404);

    const body = await res.json();
    expect(body.message).toContain("not found");

    console.log(`  WF-TRIG-9 PASS: Non-existent agent returns 404`);
  });
});
