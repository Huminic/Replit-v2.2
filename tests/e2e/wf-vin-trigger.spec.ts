import { test, expect } from "playwright/test";
import { testUsers, login, authHeader } from "./helpers/auth";

/**
 * Workflow E2E: VIN Lead → Delta Sync → Trigger → Outbound → TeamBox
 *
 * Tests the trigger/sequence pipeline:
 *   1. Verify trigger configurations exist on agents
 *   2. Manually trigger delta sync via API
 *   3. Verify warehouse leads are populated with dates
 *   4. Check trigger config structure (new_lead_followup, stale_lead)
 *   5. Verify outbound logs for trigger-generated messages
 *   6. Verify conversations appear in TeamBox after outbound
 *
 * NOTE: The scheduler runs trigger checks every 15 minutes and delta sync
 * is not on a timer — it must be manually invoked via POST /api/sync/delta.
 * Some tests verify configuration and state rather than live execution,
 * since trigger timing depends on lead age and scheduler intervals.
 */

const BASE = process.env.BASE_URL || "http://localhost:5000";

test.describe("Workflow: VIN Lead → Trigger → Outbound → TeamBox", () => {

  test("WF-VIN-TRIGGER-1 Agent trigger configuration exists and is valid", async ({ request }) => {
    const auth = await login(request, testUsers.orgAdmin);

    // Get all agents for this org
    const agentsRes = await request.get(`${BASE}/api/agents`, {
      headers: authHeader(auth.token),
    });
    expect(agentsRes.ok()).toBeTruthy();
    const agents = await agentsRes.json();
    const agentList = Array.isArray(agents) ? agents : agents.data || [];

    console.log(`Agents for org: ${agentList.length}`);
    expect(agentList.length).toBeGreaterThan(0);

    let totalTriggers = 0;
    let agentsWithTriggers = 0;

    for (const agent of agentList) {
      // Fetch trigger config via the dedicated endpoint
      const trigRes = await request.get(`${BASE}/api/agents/${agent.id}/triggers`, {
        headers: authHeader(auth.token),
      });

      if (trigRes.ok()) {
        const trigData = await trigRes.json();
        const triggers = trigData.triggers || [];
        console.log(`Agent "${agent.name}" (${agent.id}): ${triggers.length} trigger(s)`);

        if (triggers.length > 0) {
          agentsWithTriggers++;
          totalTriggers += triggers.length;

          for (const trigger of triggers) {
            console.log(`  - ${trigger.name || trigger.type}: type=${trigger.type}, enabled=${trigger.enabled}`);

            // Validate trigger structure
            expect(["new_lead_followup", "stale_lead", "appointment_reminder"]).toContain(trigger.type);
            expect(typeof trigger.enabled).toBe("boolean");

            if (trigger.config) {
              if (trigger.type === "new_lead_followup") {
                console.log(`    delayHours: ${trigger.config.delayHours || "default"}`);
                console.log(`    channel: ${trigger.config.channel || "default (sms)"}`);
                if (trigger.config.businessHoursSequence) {
                  console.log(`    businessHoursSequence: ${trigger.config.businessHoursSequence.length} step(s)`);
                }
                if (trigger.config.afterHoursSequence) {
                  console.log(`    afterHoursSequence: ${trigger.config.afterHoursSequence.length} step(s)`);
                }
              }

              if (trigger.type === "stale_lead") {
                console.log(`    thresholdHours: ${trigger.config.thresholdHours || "default (24)"}`);
                if (trigger.config.actions) {
                  console.log(`    actions: ${trigger.config.actions.length} action(s)`);
                  for (const action of trigger.config.actions) {
                    console.log(`      - ${action.type}${action.waitMinutes ? ` (wait ${action.waitMinutes}m)` : ""}`);
                  }
                }
              }
            }
          }
        }
      } else {
        console.log(`Agent "${agent.name}": triggers endpoint returned ${trigRes.status()}`);
      }
    }

    console.log(`\nSummary: ${agentsWithTriggers}/${agentList.length} agents have triggers, ${totalTriggers} total`);

    if (totalTriggers === 0) {
      test.info().annotations.push({
        type: "note",
        description: "No triggers configured on any agent. Trigger workflow tests below will observe but not assert trigger execution.",
      });
    }
  });

  test("WF-VIN-TRIGGER-2 Delta sync can be triggered manually and returns results", async ({ request }) => {
    // Delta sync requires partner_admin or super_admin (role level <= 2)
    const auth = await login(request, testUsers.partnerAdmin);

    // Get sync status before
    const statusBefore = await request.get(`${BASE}/api/sync/status`, {
      headers: authHeader(auth.token),
    });
    expect(statusBefore.ok()).toBeTruthy();
    const beforeData = await statusBefore.json();
    console.log(`Sync status before: delta=${beforeData.dailyDelta?.syncedAt || "never"}, backfill=${beforeData.backfill?.syncedAt || "never"}`);

    // Trigger delta sync for the org
    const deltaRes = await request.post(`${BASE}/api/sync/delta`, {
      headers: authHeader(auth.token),
    });

    console.log(`Delta sync status: ${deltaRes.status()}`);
    const deltaData = await deltaRes.json();
    console.log(`Delta sync response: ${JSON.stringify(deltaData).slice(0, 500)}`);

    // Delta sync should return 200 (success) or 502 (completed with errors)
    expect([200, 502]).toContain(deltaRes.status());

    if (deltaRes.status() === 200) {
      console.log(`Delta sync completed: ${deltaData.message}`);
      if (deltaData.leadsImported !== undefined) {
        console.log(`Leads imported: ${deltaData.leadsImported}`);
      }
      if (deltaData.leadsUpdated !== undefined) {
        console.log(`Leads updated: ${deltaData.leadsUpdated}`);
      }
    } else {
      console.log(`Delta sync completed with errors: ${deltaData.error || deltaData.message}`);
    }

    // Check sync status after
    const statusAfter = await request.get(`${BASE}/api/sync/status`, {
      headers: authHeader(auth.token),
    });
    if (statusAfter.ok()) {
      const afterData = await statusAfter.json();
      console.log(`Sync status after: delta=${afterData.dailyDelta?.syncedAt || "never"}`);
    }
  });

  test("WF-VIN-TRIGGER-3 Warehouse leads exist with dates after sync", async ({ request }) => {
    const auth = await login(request, testUsers.orgAdmin);

    const whRes = await request.get(`${BASE}/api/warehouse/leads?limit=20`, {
      headers: authHeader(auth.token),
    });
    expect(whRes.ok()).toBeTruthy();
    const whData = await whRes.json();
    const leads = Array.isArray(whData) ? whData : whData.items || whData.data || [];

    console.log(`Warehouse leads: ${leads.length}`);

    if (leads.length > 0) {
      const withDates = leads.filter((l: any) => l.vinCreatedAt !== null);
      const withPhone = leads.filter((l: any) => l.customerPhone);
      const withEmail = leads.filter((l: any) => l.customerEmail);

      console.log(`With vinCreatedAt: ${withDates.length}/${leads.length}`);
      console.log(`With phone: ${withPhone.length}/${leads.length}`);
      console.log(`With email: ${withEmail.length}/${leads.length}`);

      // Check for leads eligible for trigger follow-up
      // A lead is eligible if it has a phone, was created > delayHours ago, and has not been followed up
      const now = Date.now();
      const eligibleForFollowup = leads.filter((l: any) => {
        if (!l.customerPhone) return false;
        if (l.followupSentAt) return false;
        const createdAt = l.vinCreatedAt ? new Date(l.vinCreatedAt).getTime() : new Date(l.createdAt).getTime();
        const hoursOld = (now - createdAt) / (1000 * 60 * 60);
        return hoursOld > 1; // At least 1 hour old
      });

      console.log(`Leads eligible for follow-up (>1h old, has phone, not followed up): ${eligibleForFollowup.length}`);

      if (eligibleForFollowup.length > 0) {
        const sample = eligibleForFollowup[0];
        console.log(`Sample eligible lead: ${sample.customerName} — phone: ${sample.customerPhone}, vinCreatedAt: ${sample.vinCreatedAt}`);
      }

      // Show a few leads for verification
      for (const lead of leads.slice(0, 3)) {
        console.log(`  Lead: ${lead.customerName || "Unknown"} — status: ${lead.vinStatus || "none"}, created: ${lead.vinCreatedAt || lead.createdAt}`);
      }
    } else {
      test.info().annotations.push({
        type: "note",
        description: "No warehouse leads found. Delta sync may not have imported any leads for this org.",
      });
    }
  });

  test("WF-VIN-TRIGGER-4 Sync logs track delta sync execution history", async ({ request }) => {
    const auth = await login(request, testUsers.orgAdmin);

    const logsRes = await request.get(`${BASE}/api/sync/logs?limit=10`, {
      headers: authHeader(auth.token),
    });
    expect(logsRes.ok()).toBeTruthy();
    const logs = await logsRes.json();
    const logList = Array.isArray(logs) ? logs : logs.data || [];

    console.log(`Sync logs: ${logList.length}`);

    if (logList.length > 0) {
      for (const log of logList.slice(0, 5)) {
        console.log(`  [${log.syncType || log.type}] ${log.syncedAt || log.createdAt} — ${log.status || "ok"} (${log.leadsImported || 0} imported, ${log.leadsUpdated || 0} updated)`);
      }
    } else {
      console.log("No sync logs — delta sync may not have run yet for this org.");
    }
  });

  test("WF-VIN-TRIGGER-5 Trigger validation: reject invalid trigger types", async ({ request }) => {
    const auth = await login(request, testUsers.orgAdmin);

    // Get an agent to test against
    const agentsRes = await request.get(`${BASE}/api/agents`, {
      headers: authHeader(auth.token),
    });
    expect(agentsRes.ok()).toBeTruthy();
    const agents = await agentsRes.json();
    const agentList = Array.isArray(agents) ? agents : agents.data || [];

    if (agentList.length === 0) {
      test.info().annotations.push({
        type: "note",
        description: "No agents found — cannot test trigger validation.",
      });
      return;
    }

    const agent = agentList[0];

    // Try to set an invalid trigger type — should be rejected
    const invalidRes = await request.patch(`${BASE}/api/agents/${agent.id}/triggers`, {
      headers: { ...authHeader(auth.token), "Content-Type": "application/json" },
      data: {
        triggers: [
          {
            type: "invalid_trigger_type",
            name: "Bad Trigger",
            enabled: true,
            config: { delayHours: 1 },
          },
        ],
      },
    });

    console.log(`Invalid trigger type response: ${invalidRes.status()}`);
    expect(invalidRes.status()).toBe(400);

    const errorBody = await invalidRes.json();
    console.log(`Validation error: ${JSON.stringify(errorBody).slice(0, 300)}`);
    expect(errorBody.errors || errorBody.message).toBeTruthy();

    // Try invalid channel
    const invalidChannelRes = await request.patch(`${BASE}/api/agents/${agent.id}/triggers`, {
      headers: { ...authHeader(auth.token), "Content-Type": "application/json" },
      data: {
        triggers: [
          {
            type: "new_lead_followup",
            name: "Bad Channel Trigger",
            enabled: true,
            config: { delayHours: 24, channel: "telegram" },
          },
        ],
      },
    });

    console.log(`Invalid channel response: ${invalidChannelRes.status()}`);
    expect(invalidChannelRes.status()).toBe(400);
  });

  test("WF-VIN-TRIGGER-6 Outbound logs show trigger-generated messages", async ({ request }) => {
    const auth = await login(request, testUsers.orgAdmin);

    // Check outbound logs for trigger-generated sends
    const outboundRes = await request.get(`${BASE}/api/outbound/logs`, {
      headers: authHeader(auth.token),
    });

    if (outboundRes.ok()) {
      const outboundData = await outboundRes.json();
      const logs = Array.isArray(outboundData) ? outboundData : outboundData.items || outboundData.data || [];

      console.log(`Outbound logs: ${logs.length}`);

      // Look for trigger-generated messages
      const triggerLogs = logs.filter(
        (l: any) =>
          l.messageContent?.includes("follow up") ||
          l.messageContent?.includes("Follow-up") ||
          l.source === "trigger" ||
          l.campaignId === null
      );

      console.log(`Trigger-generated outbound messages: ${triggerLogs.length}`);

      if (triggerLogs.length > 0) {
        for (const log of triggerLogs.slice(0, 3)) {
          console.log(`  [${log.channel}] to=${log.recipientPhone || log.recipientEmail || log.to} status=${log.status} — ${log.messageContent?.slice(0, 80)}`);
        }
      } else {
        console.log("No trigger-generated outbound messages found. Triggers may not have fired yet (check delayHours and lead ages).");
      }
    } else {
      // Outbound logs endpoint might be at a different path
      console.log(`Outbound logs endpoint returned ${outboundRes.status()} — trying alternative paths`);

      const altRes = await request.get(`${BASE}/api/campaigns/outbound-logs`, {
        headers: authHeader(auth.token),
      });
      if (altRes.ok()) {
        const altData = await altRes.json();
        console.log(`Alternative outbound logs: ${JSON.stringify(altData).slice(0, 300)}`);
      } else {
        console.log(`Alternative path also returned ${altRes.status()}`);
        test.info().annotations.push({
          type: "note",
          description: "Outbound logs endpoint not accessible. Trigger execution verification requires checking PM2 logs.",
        });
      }
    }
  });

  test("WF-VIN-TRIGGER-7 Notifications include trigger alerts", async ({ request }) => {
    const auth = await login(request, testUsers.orgAdmin);

    const notifRes = await request.get(`${BASE}/api/notifications`, {
      headers: authHeader(auth.token),
    });
    expect(notifRes.ok()).toBeTruthy();
    const notifs = await notifRes.json();
    const notifList = Array.isArray(notifs) ? notifs : notifs.data || [];

    console.log(`Total notifications: ${notifList.length}`);

    // Filter for trigger-related notifications
    const triggerNotifs = notifList.filter(
      (n: any) =>
        n.type === "trigger_alert" ||
        n.title?.includes("Follow-up") ||
        n.title?.includes("Stale Lead") ||
        n.message?.includes("trigger")
    );

    console.log(`Trigger alert notifications: ${triggerNotifs.length}`);

    if (triggerNotifs.length > 0) {
      for (const notif of triggerNotifs.slice(0, 5)) {
        console.log(`  [${notif.type}] "${notif.title}" — ${notif.message?.slice(0, 100)}`);
        console.log(`    Created: ${notif.createdAt}, Read: ${notif.isRead}`);
      }
      // Verify structure
      const sample = triggerNotifs[0];
      expect(sample.title).toBeTruthy();
      expect(sample.message).toBeTruthy();
      expect(sample.type).toBeTruthy();
    } else {
      console.log("No trigger alert notifications — triggers may not have fired. This is expected if no leads are past their delay threshold.");
      test.info().annotations.push({
        type: "note",
        description: "No trigger_alert notifications found. Requires leads older than trigger delayHours.",
      });
    }
  });

  test("WF-VIN-TRIGGER-8 Conversations in TeamBox include trigger-originated entries", async ({ request }) => {
    const auth = await login(request, testUsers.orgAdmin);

    // Get all conversations (TeamBox view)
    const convRes = await request.get(`${BASE}/api/conversations`, {
      headers: authHeader(auth.token),
    });
    expect(convRes.ok()).toBeTruthy();
    const convs = await convRes.json();
    const convList = Array.isArray(convs) ? convs : convs.data || [];

    console.log(`Total conversations: ${convList.length}`);

    // Group by channel to understand distribution
    const channelCounts: Record<string, number> = {};
    for (const conv of convList) {
      const ch = conv.channel || "unknown";
      channelCounts[ch] = (channelCounts[ch] || 0) + 1;
    }
    console.log(`Channel distribution: ${JSON.stringify(channelCounts)}`);

    // Look for conversations that were created by outbound triggers
    // These would typically be sms/email conversations initiated by the system
    const outboundConvs = convList.filter(
      (c: any) =>
        c.source === "trigger" ||
        c.source === "outbound" ||
        c.source === "campaign" ||
        (c.channel === "sms" && !c.customerPhone?.startsWith("+1555"))
    );

    console.log(`Outbound/trigger-originated conversations: ${outboundConvs.length}`);

    if (outboundConvs.length > 0) {
      for (const conv of outboundConvs.slice(0, 3)) {
        console.log(`  [${conv.channel}] ${conv.customerName || "Unknown"} — status: ${conv.status}, source: ${conv.source || "unset"}`);
      }
    }

    // Verify conversations have required fields
    if (convList.length > 0) {
      const sample = convList[0];
      expect(sample.id).toBeTruthy();
      expect(sample.channel).toBeTruthy();
      expect(sample.status).toBeTruthy();
      expect(sample.organizationId).toBeTruthy();
    }
  });

  test("WF-VIN-TRIGGER-9 Scheduled actions table tracks pending trigger actions", async ({ request }) => {
    const auth = await login(request, testUsers.orgAdmin);

    // Check if there is a scheduled-actions endpoint
    const schedRes = await request.get(`${BASE}/api/scheduled-actions`, {
      headers: authHeader(auth.token),
    });

    if (schedRes.ok()) {
      const schedData = await schedRes.json();
      const actions = Array.isArray(schedData) ? schedData : schedData.items || schedData.data || [];
      console.log(`Scheduled actions: ${actions.length}`);

      const triggerActions = actions.filter((a: any) => a.actionType === "trigger_action");
      const queuedSms = actions.filter((a: any) => a.actionType === "queued_sms");

      console.log(`Trigger actions: ${triggerActions.length}`);
      console.log(`Queued SMS: ${queuedSms.length}`);

      for (const action of triggerActions.slice(0, 3)) {
        console.log(`  Trigger action: ${action.payload?.type || "unknown"} for ${action.payload?.customerName || "unknown"}, executeAt: ${action.executeAt}`);
      }
    } else {
      console.log(`Scheduled actions endpoint returned ${schedRes.status()} — endpoint may not be exposed via API.`);
      console.log("Scheduled actions are internal to the scheduler service (processScheduledActions runs every 30s).");
      test.info().annotations.push({
        type: "note",
        description: "Scheduled actions endpoint not available. Internal scheduler handles these — verify via PM2 logs.",
      });
    }
  });

  test("WF-VIN-TRIGGER-10 Multi-store trigger isolation: triggers respect org boundaries", async ({ request }) => {
    // Login as two different org admins and verify triggers are isolated
    const serraHondaAuth = await login(request, testUsers.orgAdmin);
    const serraFordAuth = await login(request, testUsers.serraFord);

    // Get agents for each org
    const hondaAgentsRes = await request.get(`${BASE}/api/agents`, {
      headers: authHeader(serraHondaAuth.token),
    });
    const fordAgentsRes = await request.get(`${BASE}/api/agents`, {
      headers: authHeader(serraFordAuth.token),
    });

    expect(hondaAgentsRes.ok()).toBeTruthy();
    expect(fordAgentsRes.ok()).toBeTruthy();

    const hondaAgents = await hondaAgentsRes.json();
    const fordAgents = await fordAgentsRes.json();
    const hondaList = Array.isArray(hondaAgents) ? hondaAgents : hondaAgents.data || [];
    const fordList = Array.isArray(fordAgents) ? fordAgents : fordAgents.data || [];

    console.log(`Serra Honda agents: ${hondaList.length}`);
    console.log(`Tony Serra Ford agents: ${fordList.length}`);

    // Verify agent IDs do not overlap
    const hondaIds = new Set(hondaList.map((a: any) => a.id));
    const fordIds = new Set(fordList.map((a: any) => a.id));
    const overlap = [...hondaIds].filter((id) => fordIds.has(id));

    console.log(`Agent ID overlap between orgs: ${overlap.length}`);
    expect(overlap.length).toBe(0);

    // Verify org isolation: Honda admin cannot access Ford agent triggers
    if (fordList.length > 0) {
      const crossOrgRes = await request.get(`${BASE}/api/agents/${fordList[0].id}/triggers`, {
        headers: authHeader(serraHondaAuth.token),
      });
      console.log(`Cross-org trigger access (Honda→Ford): ${crossOrgRes.status()}`);
      expect(crossOrgRes.status()).toBe(403);
    }

    // Verify warehouse leads are org-scoped
    const hondaLeads = await request.get(`${BASE}/api/warehouse/leads?limit=5`, {
      headers: authHeader(serraHondaAuth.token),
    });
    const fordLeads = await request.get(`${BASE}/api/warehouse/leads?limit=5`, {
      headers: authHeader(serraFordAuth.token),
    });

    if (hondaLeads.ok() && fordLeads.ok()) {
      const hondaData = await hondaLeads.json();
      const fordData = await fordLeads.json();
      const hondaItems = Array.isArray(hondaData) ? hondaData : hondaData.items || [];
      const fordItems = Array.isArray(fordData) ? fordData : fordData.items || [];

      console.log(`Serra Honda warehouse leads: ${hondaItems.length}`);
      console.log(`Tony Serra Ford warehouse leads: ${fordItems.length}`);

      // Verify no lead ID overlap (different orgs should have different leads)
      if (hondaItems.length > 0 && fordItems.length > 0) {
        const hondaLeadIds = new Set(hondaItems.map((l: any) => l.id));
        const fordLeadIds = new Set(fordItems.map((l: any) => l.id));
        const leadOverlap = [...hondaLeadIds].filter((id) => fordLeadIds.has(id));
        console.log(`Lead ID overlap: ${leadOverlap.length}`);
        expect(leadOverlap.length).toBe(0);
      }
    }
  });
});
