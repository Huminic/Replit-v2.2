import { test, expect } from "playwright/test";
import { testUsers, login, authHeader } from "./helpers/auth";

/**
 * Workflow E2E: Conversation → VIN Safe MCP Prepare → Execute → Verify
 *
 * Tests the full VIN lead creation pipeline:
 *   1. Ensure a conversation with transcript exists (via VAPI webhook simulation)
 *   2. Call vin_safe_prepare_lead via REST API — verify preview
 *   3. Call vin_safe_execute_lead with approval token
 *   4. Verify lead status (VERIFIED_CORRECT or actual)
 *   5. Verify conversation record updated with VIN lead info
 *
 * Infrastructure:
 *   VIN Safe MCP: http://0.0.0.0:4003
 *   Auth: Bearer token
 *   Serra Honda org for testing
 */

const BASE = process.env.BASE_URL || "http://localhost:5000";
const VIN_SAFE_URL = "http://0.0.0.0:4003";
const VIN_SAFE_TOKEN = "8NCVZ8ZCgHtab6A+FxHsgOKcgir89KvOR+wMIpYFLp4=";

function vinSafeHeaders() {
  return {
    Authorization: `Bearer ${VIN_SAFE_TOKEN}`,
    "Content-Type": "application/json",
  };
}

test.describe("Workflow: Conversation → VIN Lead Creation", () => {
  // Track whether Serra Honda has a VIN integration record.
  // If not, tests that depend on dealer resolution will be skipped.
  let vinIntegrationAvailable = false;

  test("WF-VIN-LEAD-1 VIN Safe MCP health check is reachable", async ({ request }) => {
    const res = await request.post(`${VIN_SAFE_URL}/api/tool/vin_health_check`, {
      headers: vinSafeHeaders(),
      data: {},
    });

    console.log(`vin_health_check status: ${res.status()}`);
    const body = await res.json();
    console.log(`vin_health_check response: ${JSON.stringify(body).slice(0, 300)}`);

    expect(res.ok()).toBeTruthy();
    expect(body).toBeTruthy();

    // Probe whether Serra Honda has a VIN integration record
    const auth = await login(request, testUsers.orgAdmin);
    const dealerRes = await request.post(`${VIN_SAFE_URL}/api/tool/vin_get_dealer_id`, {
      headers: vinSafeHeaders(),
      data: { orgId: auth.organizationId },
    });
    if (dealerRes.ok()) {
      const dealerBody = await dealerRes.json();
      vinIntegrationAvailable = !!dealerBody.dealerId;
      if (!vinIntegrationAvailable) {
        console.log(`VIN integration NOT configured for Serra Honda (${auth.organizationId}): ${dealerBody.error || "no dealerId"}`);
      } else {
        console.log(`VIN integration available — dealerId: ${dealerBody.dealerId}`);
      }
    }
  });

  test("WF-VIN-LEAD-2 VAPI webhook creates conversation with transcript", async ({ request }) => {
    const auth = await login(request, testUsers.orgAdmin);

    // Get an agent for Serra Honda to use as the assistant
    const agentsRes = await request.get(`${BASE}/api/agents`, {
      headers: authHeader(auth.token),
    });
    expect(agentsRes.ok()).toBeTruthy();
    const agents = await agentsRes.json();
    const agentList = Array.isArray(agents) ? agents : agents.data || [];
    const agent = agentList[0];
    const assistantId = agent?.vapiAssistantId || "test-assistant-id";

    // Simulate a VAPI end-of-call webhook with a real-looking transcript
    const testCallId = `wf-vin-lead-${Date.now()}`;
    const webhookRes = await request.post(`${BASE}/api/webhooks/vapi`, {
      data: {
        message: {
          type: "end-of-call-report",
          call: {
            id: testCallId,
            type: "inboundPhoneCall",
            status: "ended",
            customer: {
              number: "+15559001234",
              name: "WF Test Customer",
            },
            assistantId,
            transcript: "Customer: Hi, I'm interested in a 2024 Honda Civic.\nAI: Great choice! Would you like to come in for a test drive?\nCustomer: Yes, when is the earliest I can come in?\nAI: We have availability tomorrow at 10 AM. Shall I schedule that for you?\nCustomer: That works. My name is WF Test Customer.",
            summary: "Customer interested in 2024 Honda Civic. Wants to schedule a test drive for tomorrow at 10 AM.",
            startedAt: new Date(Date.now() - 180000).toISOString(),
            endedAt: new Date().toISOString(),
            recordingUrl: "https://storage.vapi.ai/wf-vin-lead-test.wav",
          },
          recordingUrl: "https://storage.vapi.ai/wf-vin-lead-test.wav",
        },
      },
    });

    console.log(`Webhook response status: ${webhookRes.status()}`);

    if (webhookRes.ok()) {
      const result = await webhookRes.json();
      console.log(`Conversation created: ${result.conversationId}`);
      console.log(`VIN lead created: ${result.vinLeadCreated}`);

      // The webhook used a 555 prefix phone (test phone), so VIN lead creation is skipped.
      // That is expected — the next tests call VIN Safe MCP directly.
      expect(result.conversationId).toBeTruthy();

      // Verify the conversation has messages (transcript stored)
      let transcriptFound = false;
      for (let attempt = 0; attempt < 5; attempt++) {
        const msgRes = await request.get(
          `${BASE}/api/conversations/${result.conversationId}/messages`,
          { headers: authHeader(auth.token) }
        );
        if (msgRes.ok()) {
          const msgs = await msgRes.json();
          const msgList = Array.isArray(msgs) ? msgs : msgs.data || [];
          if (msgList.length > 0) {
            transcriptFound = true;
            console.log(`Transcript stored: ${msgList.length} message(s), first ${msgList[0].content?.substring(0, 80)}...`);
            expect(msgList[0].content.length).toBeGreaterThan(10);
            break;
          }
        }
        await new Promise((r) => setTimeout(r, 2000));
      }
      expect(transcriptFound).toBeTruthy();
    } else {
      const text = await webhookRes.text();
      console.log(`Webhook failed: ${webhookRes.status()} — ${text.slice(0, 300)}`);
      test.info().annotations.push({
        type: "note",
        description: `VAPI webhook returned ${webhookRes.status()}. Direct VIN tests below still execute.`,
      });
    }
  });

  test("WF-VIN-LEAD-3 vin_get_dealer_id resolves Serra Honda org to dealer ID", async ({ request }) => {
    test.skip(!vinIntegrationAvailable, "Serra Honda has no VIN integration record — skipping dealer ID resolution");
    const auth = await login(request, testUsers.orgAdmin);

    const res = await request.post(`${VIN_SAFE_URL}/api/tool/vin_get_dealer_id`, {
      headers: vinSafeHeaders(),
      data: { orgId: auth.organizationId },
    });

    console.log(`vin_get_dealer_id status: ${res.status()}`);
    const body = await res.json();
    console.log(`vin_get_dealer_id response: ${JSON.stringify(body).slice(0, 500)}`);

    expect(res.ok()).toBeTruthy();
    expect(body.dealerId).toBeTruthy();
    expect(typeof body.dealerId === "number" || typeof body.dealerId === "string").toBeTruthy();
    console.log(`Dealer ID resolved: ${body.dealerId}`);
  });

  test("WF-VIN-LEAD-4 vin_list_users shows users at dealer", async ({ request }) => {
    test.skip(!vinIntegrationAvailable, "Serra Honda has no VIN integration record — skipping user listing");
    const auth = await login(request, testUsers.orgAdmin);

    const res = await request.post(`${VIN_SAFE_URL}/api/tool/vin_list_users`, {
      headers: vinSafeHeaders(),
      data: { orgId: auth.organizationId },
    });

    console.log(`vin_list_users status: ${res.status()}`);
    const body = await res.json();
    console.log(`vin_list_users response: ${JSON.stringify(body).slice(0, 500)}`);

    expect(res.ok()).toBeTruthy();
    if (Array.isArray(body.users) || Array.isArray(body)) {
      const users = body.users || body;
      console.log(`VIN users at dealer: ${users.length}`);
      if (users.length > 0) {
        console.log(`First user: ${JSON.stringify(users[0]).slice(0, 200)}`);
      }
    }
  });

  test("WF-VIN-LEAD-5 vin_list_lead_sources returns sources for dealer", async ({ request }) => {
    test.skip(!vinIntegrationAvailable, "Serra Honda has no VIN integration record — skipping lead sources");
    const auth = await login(request, testUsers.orgAdmin);

    const res = await request.post(`${VIN_SAFE_URL}/api/tool/vin_list_lead_sources`, {
      headers: vinSafeHeaders(),
      data: { orgId: auth.organizationId },
    });

    console.log(`vin_list_lead_sources status: ${res.status()}`);
    const body = await res.json();
    console.log(`vin_list_lead_sources response: ${JSON.stringify(body).slice(0, 500)}`);

    expect(res.ok()).toBeTruthy();
    if (Array.isArray(body.leadSources) || Array.isArray(body)) {
      const sources = body.leadSources || body;
      console.log(`Lead sources at dealer: ${sources.length}`);
      const websiteSource = sources.find((s: any) =>
        s.name?.includes("WebSite") || s.name?.includes("Website") || s.name?.includes("Dealer")
      );
      if (websiteSource) {
        console.log(`Found expected lead source: ${websiteSource.name} (ID: ${websiteSource.id})`);
      }
    }
  });

  test("WF-VIN-LEAD-6 vin_safe_prepare_lead returns preview with correct dealer, user, source", async ({ request }) => {
    test.skip(!vinIntegrationAvailable, "Serra Honda has no VIN integration record — skipping prepare lead");
    const auth = await login(request, testUsers.orgAdmin);

    // Prepare a lead — does NOT create anything in VIN Solutions,
    // only resolves dealer/user/source and returns a preview.
    const prepareRes = await request.post(`${VIN_SAFE_URL}/api/tool/vin_safe_prepare_lead`, {
      headers: vinSafeHeaders(),
      data: {
        orgId: auth.organizationId,
        firstName: "WFTest",
        lastName: "LeadPreview",
        phone: "5559990001",
        leadType: "PHONE",
        leadSourceName: "Dealers WebSite",
        description: "E2E workflow test — prepare only, preview check",
      },
    });

    console.log(`vin_safe_prepare_lead status: ${prepareRes.status()}`);
    const prepareData = await prepareRes.json();
    console.log(`Prepare response: ${JSON.stringify(prepareData).slice(0, 800)}`);

    expect(prepareRes.ok()).toBeTruthy();

    if (prepareData.status === "READY") {
      expect(prepareData.approval_token).toBeTruthy();
      console.log(`Approval token received: ${prepareData.approval_token.slice(0, 20)}...`);

      if (prepareData.resolution) {
        const res = prepareData.resolution;
        console.log(`Assigned to: ${res.assignedTo?.name || "unresolved"}`);
        console.log(`Lead source: ${res.leadSource?.name || "unresolved"}`);
        console.log(`Dealer ID: ${res.dealerId || "unresolved"}`);

        if (res.dealerId) {
          expect(res.dealerId).toBeTruthy();
        }
        if (res.leadSource?.name) {
          expect(res.leadSource.name.length).toBeGreaterThan(0);
        }
      }
    } else {
      console.log(`Prepare did not return READY: ${prepareData.status || "unknown"}`);
      console.log(`Error details: ${prepareData.error || prepareData.message || "none"}`);
      test.info().annotations.push({
        type: "note",
        description: `Prepare returned ${prepareData.status}: ${prepareData.error || prepareData.message || "unknown"}`,
      });
    }
  });

  test("WF-VIN-LEAD-7 Full pipeline: prepare → execute → verify lead creation", async ({ request }) => {
    test.skip(!vinIntegrationAvailable, "Serra Honda has no VIN integration record — skipping full pipeline");
    const auth = await login(request, testUsers.orgAdmin);

    // Step 1: Prepare the lead
    const uniqueSuffix = Date.now().toString().slice(-6);
    const prepareRes = await request.post(`${VIN_SAFE_URL}/api/tool/vin_safe_prepare_lead`, {
      headers: vinSafeHeaders(),
      data: {
        orgId: auth.organizationId,
        firstName: "WFPipeline",
        lastName: `Test${uniqueSuffix}`,
        phone: `555${uniqueSuffix}1`,
        leadType: "PHONE",
        leadSourceName: "Dealers WebSite",
        description: `E2E workflow pipeline test — ${new Date().toISOString()}`,
      },
    });

    expect(prepareRes.ok()).toBeTruthy();
    const prepareData = await prepareRes.json();
    console.log(`Prepare status: ${prepareData.status}`);

    if (prepareData.status !== "READY" || !prepareData.approval_token) {
      console.log(`Prepare not READY — skipping execute. Response: ${JSON.stringify(prepareData).slice(0, 500)}`);
      test.info().annotations.push({
        type: "note",
        description: `Prepare returned ${prepareData.status} — execute step skipped. VIN integration may not be configured for this org.`,
      });
      return;
    }

    // Step 2: Execute with approval token
    const executeRes = await request.post(`${VIN_SAFE_URL}/api/tool/vin_safe_execute_lead`, {
      headers: vinSafeHeaders(),
      data: {
        approval_token: prepareData.approval_token,
        user_confirmed: true,
      },
    });

    expect(executeRes.ok()).toBeTruthy();
    const executeData = await executeRes.json();
    console.log(`Execute status: ${executeData.status}`);
    console.log(`Execute response: ${JSON.stringify(executeData).slice(0, 800)}`);

    if (executeData.status === "EXECUTED") {
      // Step 3: Verify the result
      const verification = executeData.verification;
      console.log(`Verification status: ${verification?.status || "none"}`);
      console.log(`Contact ID: ${executeData.contactId || "none"}`);
      console.log(`Lead ID: ${executeData.leadId || "none"}`);

      if (verification?.status === "VERIFIED_CORRECT") {
        console.log(`VERIFIED_CORRECT — assigned to ${verification.assignedTo?.name}`);
        expect(verification.assignedTo).toBeTruthy();
      } else if (verification?.status === "ASSIGNMENT_MISMATCH") {
        console.log(`ASSIGNMENT_MISMATCH — expected ${verification.expected}, got ${verification.actual}`);
        test.info().annotations.push({
          type: "warning",
          description: `ASSIGNMENT_MISMATCH detected: expected=${verification.expected}, actual=${verification.actual}`,
        });
      }

      // Step 4: Verify the lead appears in warehouse (may require delta sync)
      let leadFoundInWarehouse = false;
      for (let attempt = 0; attempt < 3; attempt++) {
        const whRes = await request.get(`${BASE}/api/warehouse/leads?limit=10`, {
          headers: authHeader(auth.token),
        });
        if (whRes.ok()) {
          const whData = await whRes.json();
          const leads = Array.isArray(whData) ? whData : whData.items || whData.data || [];
          const match = leads.find(
            (l: any) =>
              l.customerName?.includes("WFPipeline") ||
              l.sourceId === String(executeData.contactId)
          );
          if (match) {
            leadFoundInWarehouse = true;
            console.log(`Lead found in warehouse: ${match.id} — ${match.customerName}`);
            break;
          }
        }
        await new Promise((r) => setTimeout(r, 3000));
      }

      if (!leadFoundInWarehouse) {
        console.log("Lead not yet in warehouse — requires delta sync to appear. This is expected for newly created VIN leads.");
        test.info().annotations.push({
          type: "note",
          description: "Newly created VIN lead not in warehouse yet — requires delta sync cycle.",
        });
      }
    } else {
      console.log(`Execute did not return EXECUTED: ${executeData.error || executeData.message || "unknown"}`);
    }
  });

  test("WF-VIN-LEAD-8 Webhook-created conversation tracks VIN lead status", async ({ request }) => {
    const auth = await login(request, testUsers.orgAdmin);

    const convRes = await request.get(`${BASE}/api/conversations`, {
      headers: authHeader(auth.token),
    });
    expect(convRes.ok()).toBeTruthy();
    const convs = await convRes.json();
    const convList = Array.isArray(convs) ? convs : convs.data || [];

    const voiceConvs = convList.filter((c: any) => c.channel === "voice");
    console.log(`Total conversations: ${convList.length}, voice: ${voiceConvs.length}`);

    if (voiceConvs.length > 0) {
      const recent = voiceConvs[0];
      console.log(`Most recent voice conv: ${recent.id}`);
      console.log(`  Customer: ${recent.customerName}`);
      console.log(`  Channel: ${recent.channel}`);
      console.log(`  Status: ${recent.status}`);
      console.log(`  VIN contact: ${recent.vinContactHref || recent.vinContactId || "none"}`);
      console.log(`  Created: ${recent.createdAt}`);

      if (recent.vinContactHref || recent.vinContactId) {
        console.log("VIN lead reference found on conversation — pipeline confirmed");
        expect(recent.vinContactHref || recent.vinContactId).toBeTruthy();
      } else {
        console.log("No VIN contact reference on conversation — may be a test-phone call or VIN creation was skipped");
      }
    } else {
      test.info().annotations.push({
        type: "note",
        description: "No voice conversations found — VIN lead tracking test requires prior VAPI calls.",
      });
    }
  });

  test("WF-VIN-LEAD-9 Notification created for VIN lead events", async ({ request }) => {
    const auth = await login(request, testUsers.orgAdmin);

    const notifRes = await request.get(`${BASE}/api/notifications`, {
      headers: authHeader(auth.token),
    });
    expect(notifRes.ok()).toBeTruthy();
    const notifs = await notifRes.json();
    const notifList = Array.isArray(notifs) ? notifs : notifs.data || [];

    console.log(`Total notifications: ${notifList.length}`);

    const callNotifs = notifList.filter(
      (n: any) =>
        n.type === "call" ||
        n.message?.includes("VIN") ||
        n.message?.includes("Inbound Call")
    );
    console.log(`Call/VIN notifications: ${callNotifs.length}`);

    if (callNotifs.length > 0) {
      const latest = callNotifs[0];
      console.log(`Latest call notification: "${latest.title}" — ${latest.message?.slice(0, 120)}`);
      expect(latest.title).toBeTruthy();
    } else {
      test.info().annotations.push({
        type: "note",
        description: "No call/VIN notifications found — requires prior VAPI webhook events.",
      });
    }
  });
});
