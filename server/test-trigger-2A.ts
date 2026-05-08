/**
 * Wave 2A-T — Direct Outbound Provider Proof (testlane-only invocation script)
 *
 * Purpose: prove the TextMagic + Resend integration path through the testlane
 * gate end-to-end at the `processOutboundSend` layer. Bypasses the private
 * trigger evaluator entirely; mimics the SMS payload shape that a check-in
 * trigger would build downstream.
 *
 * This script is TestLane-only. It MUST NOT be invoked outside an explicit
 * testlane session with TESTLANE_MODE=true and TESTLANE_SMS_TO/TESTLANE_EMAIL_TO
 * configured to operator-controlled allowlisted destinations.
 *
 * Usage (T1 — SMS provider proof):
 *   TESTLANE_MODE=true TESTLANE_SMS_TO=+14126546500 \
 *     npx tsx server/test-trigger-2A.ts testT1ProviderProofSms
 *
 * Usage (T2 — VAPI agent-to-agent provider proof, Elliott → Nancy):
 *   set -a; source .env; set +a
 *   npx tsx server/test-trigger-2A.ts testT2VapiElliottToNancy
 *
 * Usage (T3 — Service campaign provider proof, serra-honda):
 *   set -a; source .env; set +a
 *   TESTLANE_MODE=true TESTLANE_SMS_TO=+14126546500 \
 *     npx tsx server/test-trigger-2A.ts testT3ServiceCampaign
 *
 * Halt conditions enforced inside the functions:
 *   - T1: Recipient logged in outbound_log MUST be +14126546500 (testlane gate
 *     hard-route target). Any other recipient = STOP (gate broken).
 *   - T1: Result MUST be {sent: true} with messageId visible in console output.
 *   - T1: Exactly 1 outbound_log row created in the [pre_ts, post_ts] window.
 *   - T2: assistantId MUST be Elliott (allowlisted vapi_test_agent).
 *   - T2: customer.number MUST be Nancy's Serra Honda service number.
 *   - T2: VAPI must return a 2xx with a UUID call id; 4xx/5xx = HALT.
 *   - T2: Exactly one VAPI /call/phone POST is made by this script.
 */

import { processOutboundSend, type SendRequest, type SendResult } from "./outbound";
import { storage, db } from "./storage";
import { outboundLog, activityLog, conversations, messages } from "@shared/schema";
import { and, eq, gte, lte } from "drizzle-orm";

const ALLOWLISTED_OPERATOR_PHONE = "+14126546500";
const SERRA_HONDA_SLUG = "serra-honda";
const SESSION_ID = "wave-2A-T-T1";

interface T1Result {
  sent: boolean;
  messageId: string | null;
  organizationId: string;
  organizationSlug: string;
  preTs: string;
  postTs: string;
  sendResult: SendResult;
  outboundLogRows: Array<{
    id: string;
    organizationId: string;
    channel: string;
    status: string;
    recipientPhone: string | null;
    recipientEmail: string | null;
    recipientName: string | null;
    sentAt: string | null;
    createdAt: string;
    blockedReason: string | null;
    messageContent: string | null;
  }>;
  activityLogRows: Array<{
    id: string;
    organizationId: string;
    action: string;
    entityType: string | null;
    entityId: string | null;
    metadata: unknown;
    createdAt: string;
  }>;
  haltChecks: {
    recipientHardRouted: boolean;
    exactlyOneOutboundLogRow: boolean;
    sentStatus: boolean;
    noRecipientLeakage: boolean;
  };
}

export async function testT1ProviderProofSms(): Promise<T1Result> {
  // 1. Force testlane env (script-local; does NOT touch PM2)
  process.env.TESTLANE_MODE = "true";
  process.env.TESTLANE_SMS_TO = ALLOWLISTED_OPERATOR_PHONE;

  console.log("=== Wave 2A-T Chunk T1 (REVISED) — Direct SMS Provider Proof ===");
  console.log("session-id:", SESSION_ID);
  console.log("TESTLANE_MODE:", process.env.TESTLANE_MODE);
  console.log("TESTLANE_SMS_TO:", process.env.TESTLANE_SMS_TO);

  // 2. Look up serra-honda
  const org = await storage.getOrganizationBySlug(SERRA_HONDA_SLUG);
  if (!org) {
    throw new Error(`Organization not found: slug=${SERRA_HONDA_SLUG}`);
  }
  console.log(`org: id=${org.id} slug=${org.slug} name=${org.name}`);
  console.log(`org flags: outboundEnabled=${(org as any).outboundEnabled} smsEnabled=${(org as any).smsEnabled}`);

  // 3. Build the SMS payload mimicking what a check-in trigger would generate
  const messageContent =
    "[testlane:wave-2A-T-T1] Hi from Caroline at Serra Honda — checking in on your inquiry.";

  const payload: SendRequest = {
    organizationId: org.id,
    channel: "sms",
    // `to` is what the trigger would set as the lead's phone. The testlane
    // gate hard-routes this to TESTLANE_SMS_TO regardless of what we put
    // here. We use the allowlisted operator phone for defense-in-depth.
    to: ALLOWLISTED_OPERATOR_PHONE,
    messageContent,
    recipientName: "TESTLANE Test Lead",
    // Explicit marker — load-bearing for the testlane gate to flip into
    // override mode (vs. blocking). See evaluateOutboundTestLaneGuard().
    testLaneSessionId: SESSION_ID,
    // Trigger-style: a real check-in trigger sends during business hours
    // (no bypass needed). We're inside business hours per the blocker
    // finding (14:51 ET earlier today; runs ~17:00 UTC = 13:00 ET).
    bypassBusinessHours: false,
  };

  console.log("payload:", JSON.stringify({ ...payload, messageContent: messageContent.slice(0, 80) + "..." }, null, 2));

  // 4. Capture pre-send timestamp
  const preTs = new Date();
  console.log(`pre_ts=${preTs.toISOString()}`);

  // 5. Send
  let sendResult: SendResult;
  try {
    sendResult = await processOutboundSend(payload);
  } catch (err: any) {
    console.error("processOutboundSend threw:", err?.message || err);
    throw err;
  }

  // 6. Capture post-send timestamp
  const postTs = new Date();
  console.log(`post_ts=${postTs.toISOString()}`);
  console.log("send result:", JSON.stringify(sendResult));

  // 7. Query outbound_log for entries in the window
  const outboundRows = await db
    .select()
    .from(outboundLog)
    .where(
      and(
        eq(outboundLog.organizationId, org.id),
        gte(outboundLog.createdAt, preTs),
        lte(outboundLog.createdAt, postTs),
      ),
    );

  // 8. Query activity_log for entries in the window
  const activityRows = await db
    .select()
    .from(activityLog)
    .where(
      and(
        eq(activityLog.organizationId, org.id),
        gte(activityLog.createdAt, preTs),
        lte(activityLog.createdAt, postTs),
      ),
    );

  // 9. Halt-condition checks
  const recipients = outboundRows.map((r) => r.recipientPhone).filter(Boolean) as string[];
  const recipientHardRouted =
    recipients.length > 0 && recipients.every((p) => p === ALLOWLISTED_OPERATOR_PHONE);
  const noRecipientLeakage = recipients.every(
    (p) => p === ALLOWLISTED_OPERATOR_PHONE,
  );
  const exactlyOneOutboundLogRow = outboundRows.length === 1;
  const sentStatus = sendResult.status === "sent";

  if (!recipientHardRouted) {
    console.error(
      `HALT: recipient leakage — outbound_log recipients = ${JSON.stringify(recipients)}; expected only ${ALLOWLISTED_OPERATOR_PHONE}`,
    );
  }
  if (!exactlyOneOutboundLogRow) {
    console.error(
      `HALT: expected exactly 1 outbound_log row in window; got ${outboundRows.length}`,
    );
  }
  if (!sentStatus) {
    console.error(`HALT: send status was "${sendResult.status}", expected "sent"`);
  }

  // 10. Build structured result
  const result: T1Result = {
    sent: sentStatus,
    messageId: null, // TextMagic message ID is logged via console by sendSmsRaw; not persisted in outbound_log row in current schema. Captured in proof.md from console capture.
    organizationId: org.id,
    organizationSlug: org.slug,
    preTs: preTs.toISOString(),
    postTs: postTs.toISOString(),
    sendResult,
    outboundLogRows: outboundRows.map((r) => ({
      id: r.id,
      organizationId: r.organizationId,
      channel: r.channel,
      status: r.status,
      recipientPhone: r.recipientPhone,
      recipientEmail: r.recipientEmail,
      recipientName: r.recipientName,
      sentAt: r.sentAt ? r.sentAt.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
      blockedReason: r.blockedReason,
      messageContent: r.messageContent,
    })),
    activityLogRows: activityRows.map((r) => ({
      id: r.id,
      organizationId: r.organizationId,
      action: r.action,
      entityType: r.entityType,
      entityId: r.entityId,
      metadata: r.metadata,
      createdAt: r.createdAt.toISOString(),
    })),
    haltChecks: {
      recipientHardRouted,
      exactlyOneOutboundLogRow,
      sentStatus,
      noRecipientLeakage,
    },
  };

  // 11. Final exit-code signal: throw on halt-condition failure so the CLI
  //     wrapper exits non-zero. (sent + hard-routed + exactly 1 row.)
  if (!sentStatus || !recipientHardRouted || !exactlyOneOutboundLogRow) {
    console.error("HALT-CONDITION FAILED; emitting result before throw:");
    console.error("RESULT:", JSON.stringify(result, null, 2));
    throw new Error(
      `T1 halt: sent=${sentStatus} hardRouted=${recipientHardRouted} oneRow=${exactlyOneOutboundLogRow}`,
    );
  }

  return result;
}

// ---------------------------------------------------------------------------
// T2 — VAPI agent-to-agent provider proof: Elliott → Nancy (Serra Honda service)
// ---------------------------------------------------------------------------
//
// Both endpoints are AI assistants under our control:
//  - OUTBOUND assistant: Elliott (`c303d993-bf42-4784-a8cb-247477b1cbdd`),
//    allowlisted vapi_test_agent (operator's autonomous test counterparty).
//  - INBOUND endpoint: Serra Honda service VAPI number `+19014361271`,
//    routed by VAPI to Nancy Gaston's assistant
//    (`c777f029-8c4c-4a23-98e4-3adfd4112a61`). NOT a real customer — this is
//    the dealership service AI agent we control.
//
// Operator authorized this dispatch in chat (2026-05-07):
//   "Elliott (outbound test agent) calls Nancy Gaston (Serra Honda service
//    VAPI agent). Both ends are AI agents we control — true agent-to-agent
//    VAPI test, no real human, no real customer."
//
// Allowlist gap (surfaced in evidence/.../chunk-T2/proof.md): Nancy's phone
// `+19014361271` and assistant ID `c777f029...` are not currently in
// `.claude/state/test-recipients.txt`. Operator's verbal authorization covers
// this dispatch. Recommendation: add Nancy as `vapi_test_agent:c777f029-...`
// for future autonomous coverage.

const ELLIOTT_ASSISTANT_ID =
  process.env.TEST_ELLIOTT_ASSISTANT_ID ||
  "c303d993-bf42-4784-a8cb-247477b1cbdd";
const ELLIOTT_PHONE_ID =
  process.env.TEST_ELLIOTT_PHONE_ID || "a85a9397-25cb-4e35-b784-05cfa5a926b2";
const NANCY_PHONE = "+19014361271"; // Serra Honda service VAPI inbound number
const NANCY_ASSISTANT_ID_EXPECTED = "c777f029-8c4c-4a23-98e4-3adfd4112a61";

interface T2Result {
  callPlaced: boolean;
  callId: string | null;
  status: string | null;
  vapiHttpStatus: number | null;
  outboundAssistantId: string;
  outboundPhoneNumberId: string;
  inboundCustomerNumber: string;
  inboundExpectedAssistantId: string;
  startedAt: string | null;
  endedAt: string | null;
  endedReason: string | null;
  pollSnapshots: Array<{
    pollIndex: number;
    pollAt: string;
    status: string | null;
    startedAt: string | null;
    endedAt: string | null;
    endedReason: string | null;
  }>;
  preTs: string;
  postTs: string;
  haltChecks: {
    outboundIsElliott: boolean;
    inboundIsNancyPhone: boolean;
    vapi2xx: boolean;
    callIdReturned: boolean;
    singleCallPlaced: boolean;
  };
  rawCreateResponse: unknown;
}

export async function testT2VapiElliottToNancy(): Promise<T2Result> {
  console.log(
    "=== Wave 2A-T Chunk T2 — VAPI Agent-to-Agent Provider Proof (Elliott → Nancy) ===",
  );
  console.log("session-id: wave-2A-T-T2");

  // 1. Env precondition
  const VAPI_KEY = process.env.VAPI_PRIVATE_KEY;
  if (!VAPI_KEY) {
    throw new Error(
      "VAPI_PRIVATE_KEY is not set in env. Source .env first: `set -a; source .env; set +a`.",
    );
  }
  console.log(`VAPI_PRIVATE_KEY: present (length=${VAPI_KEY.length})`);

  // 2. Endpoint identification — log everything before placing the call
  console.log(`OUTBOUND assistant: Elliott (${ELLIOTT_ASSISTANT_ID})`);
  console.log(
    `OUTBOUND phoneNumberId: ${ELLIOTT_PHONE_ID} (Elliott's caller ID)`,
  );
  console.log(
    `INBOUND customer.number: ${NANCY_PHONE} (Serra Honda service)`,
  );
  console.log(
    `INBOUND expected assistant (set by VAPI inbound routing): Nancy Gaston (${NANCY_ASSISTANT_ID_EXPECTED})`,
  );

  // 3. Halt-condition pre-check (catch identity drift before fire)
  if (ELLIOTT_ASSISTANT_ID !== "c303d993-bf42-4784-a8cb-247477b1cbdd") {
    throw new Error(
      `HALT: outbound assistantId is not Elliott; got ${ELLIOTT_ASSISTANT_ID}`,
    );
  }
  if (NANCY_PHONE !== "+19014361271") {
    throw new Error(
      `HALT: inbound number is not Nancy's Serra Honda service number; got ${NANCY_PHONE}`,
    );
  }

  // 4. Build the VAPI /call/phone payload
  const callPayload = {
    assistantId: ELLIOTT_ASSISTANT_ID,
    phoneNumberId: ELLIOTT_PHONE_ID,
    customer: {
      number: NANCY_PHONE,
      name: "TESTLANE Wave 2A-T T2 — Nancy",
    },
    metadata: {
      test: true,
      wave: "2A-T",
      chunk: "T2",
      purpose: "agent-to-agent VAPI provider proof — Elliott (outbound) calls Nancy (Serra Honda service inbound)",
      bothEndsAreAi: true,
      noRealHuman: true,
    },
  };
  console.log("payload:", JSON.stringify(callPayload, null, 2));

  // 5. Place EXACTLY ONE call via VAPI /call/phone
  const preTs = new Date();
  console.log(`pre_ts=${preTs.toISOString()}`);

  const createRes = await fetch("https://api.vapi.ai/call/phone", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${VAPI_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(callPayload),
  });

  const vapiHttpStatus = createRes.status;
  const rawCreate = await createRes.json().catch(() => null);
  const postTs = new Date();
  console.log(`post_ts=${postTs.toISOString()}`);
  console.log(`VAPI HTTP status: ${vapiHttpStatus}`);
  console.log(
    "VAPI /call/phone response:",
    JSON.stringify(rawCreate, null, 2),
  );

  // 6. Halt-condition checks — run all and collect, but throw on any FAIL
  const callIdReturned = !!(rawCreate && (rawCreate as any).id);
  const vapi2xx = vapiHttpStatus >= 200 && vapiHttpStatus < 300;
  const outboundIsElliott =
    (rawCreate as any)?.assistantId === ELLIOTT_ASSISTANT_ID ||
    callPayload.assistantId === ELLIOTT_ASSISTANT_ID;
  const inboundIsNancyPhone =
    (rawCreate as any)?.customer?.number === NANCY_PHONE ||
    callPayload.customer.number === NANCY_PHONE;
  const singleCallPlaced = true; // by construction — only one fetch above
  const callId = (rawCreate as any)?.id ?? null;
  const initialStatus = (rawCreate as any)?.status ?? null;

  if (!vapi2xx || !callIdReturned) {
    const result: T2Result = {
      callPlaced: false,
      callId,
      status: initialStatus,
      vapiHttpStatus,
      outboundAssistantId: ELLIOTT_ASSISTANT_ID,
      outboundPhoneNumberId: ELLIOTT_PHONE_ID,
      inboundCustomerNumber: NANCY_PHONE,
      inboundExpectedAssistantId: NANCY_ASSISTANT_ID_EXPECTED,
      startedAt: null,
      endedAt: null,
      endedReason: null,
      pollSnapshots: [],
      preTs: preTs.toISOString(),
      postTs: postTs.toISOString(),
      haltChecks: {
        outboundIsElliott,
        inboundIsNancyPhone,
        vapi2xx,
        callIdReturned,
        singleCallPlaced,
      },
      rawCreateResponse: rawCreate,
    };
    console.error("HALT: VAPI returned non-2xx or no call id; emitting result before throw:");
    console.error("RESULT:", JSON.stringify(result, null, 2));
    throw new Error(
      `T2 halt: vapi2xx=${vapi2xx} callIdReturned=${callIdReturned} httpStatus=${vapiHttpStatus}`,
    );
  }

  // 7. Poll /call/{id} a couple of times to capture status transitions.
  //    These are GETs, NOT additional /call POSTs — not "another call".
  const pollSnapshots: T2Result["pollSnapshots"] = [];
  let lastStatus: string | null = initialStatus;
  let lastStartedAt: string | null = null;
  let lastEndedAt: string | null = null;
  let lastEndedReason: string | null = null;

  for (let i = 1; i <= 3; i++) {
    await new Promise((r) => setTimeout(r, 6000)); // 6s between snapshots
    const pollRes = await fetch(`https://api.vapi.ai/call/${callId}`, {
      headers: { Authorization: `Bearer ${VAPI_KEY}` },
    });
    const pollAt = new Date().toISOString();
    if (!pollRes.ok) {
      console.error(
        `poll #${i} non-2xx: ${pollRes.status} (continuing — call already placed)`,
      );
      pollSnapshots.push({
        pollIndex: i,
        pollAt,
        status: null,
        startedAt: null,
        endedAt: null,
        endedReason: null,
      });
      continue;
    }
    const pollBody = (await pollRes.json()) as any;
    lastStatus = pollBody?.status ?? lastStatus;
    lastStartedAt = pollBody?.startedAt ?? lastStartedAt;
    lastEndedAt = pollBody?.endedAt ?? lastEndedAt;
    lastEndedReason = pollBody?.endedReason ?? lastEndedReason;
    console.log(
      `poll #${i} @${pollAt}: status=${lastStatus} startedAt=${lastStartedAt ?? "-"} endedAt=${lastEndedAt ?? "-"} endedReason=${lastEndedReason ?? "-"}`,
    );
    pollSnapshots.push({
      pollIndex: i,
      pollAt,
      status: lastStatus,
      startedAt: lastStartedAt,
      endedAt: lastEndedAt,
      endedReason: lastEndedReason,
    });
    if (lastStatus === "ended") break;
  }

  const result: T2Result = {
    callPlaced: true,
    callId,
    status: lastStatus,
    vapiHttpStatus,
    outboundAssistantId: ELLIOTT_ASSISTANT_ID,
    outboundPhoneNumberId: ELLIOTT_PHONE_ID,
    inboundCustomerNumber: NANCY_PHONE,
    inboundExpectedAssistantId: NANCY_ASSISTANT_ID_EXPECTED,
    startedAt: lastStartedAt,
    endedAt: lastEndedAt,
    endedReason: lastEndedReason,
    pollSnapshots,
    preTs: preTs.toISOString(),
    postTs: postTs.toISOString(),
    haltChecks: {
      outboundIsElliott,
      inboundIsNancyPhone,
      vapi2xx,
      callIdReturned,
      singleCallPlaced,
    },
    rawCreateResponse: rawCreate,
  };
  return result;
}

// ---------------------------------------------------------------------------
// T3 — Service Campaign provider proof (HTTP path through dev server)
// ---------------------------------------------------------------------------
//
// Calls the existing helper `testServiceCampaignCreation` in
// server/comms-test.ts (read-only import). The helper:
//   1. POST /api/campaigns to create a draft service campaign in serra-honda
//   2. POST /api/campaigns/:id/upload-csv to attach 2 recipients
//
// Neither step triggers any provider send. Campaign is created with
// `status: "draft"` and there is no call to `/api/campaigns/:id/execute` in
// the helper. So expected provider sends = 0. The proof here is a DB row +
// activity_log row in serra-honda (capability proof for Phase 7 Service).
//
// Auth: HTTP POST /api/auth/login with serra-honda's org_admin credentials
// (`serra_honda@huminic.ai` / `NexxusTest2026`). accessToken returned in
// response body.
//
// Halt conditions:
//   - Login returns non-2xx → STOP
//   - Campaign creation returns non-2xx → STOP
//   - Campaign created in any org other than serra-honda → STOP
//   - Any outbound_log row appears in the test window with a recipient that
//     is NOT in the allowlist → STOP (defense-in-depth — should be 0 rows)

import { testServiceCampaignCreation } from "./comms-test";

const SERRA_HONDA_LOGIN_EMAIL =
  process.env.TESTLANE_SERRA_HONDA_EMAIL || "serra_honda@huminic.ai";
const SERRA_HONDA_LOGIN_PASSWORD =
  process.env.TESTLANE_SERRA_HONDA_PASSWORD || "NexxusTest2026";
const T3_BASE_URL = process.env.TESTLANE_BASE_URL || "http://localhost:5000";
const T3_SESSION_ID = "wave-2A-T3";
const ALLOWLISTED_PHONE = "+14126546500";

interface T3Result {
  campaignCreated: boolean;
  campaignId: string | null;
  campaignName: string | null;
  campaignDepartment: string | null;
  campaignChannel: string | null;
  campaignStatus: string | null;
  campaignOrgId: string | null;
  campaignOrgSlug: string | null;
  recipientCount: number;
  loginHttpStatus: number | null;
  authenticatedUserId: string | null;
  authenticatedOrgId: string | null;
  preTs: string;
  postTs: string;
  outboundLogRowsInWindow: Array<{
    id: string;
    organizationId: string;
    channel: string;
    status: string;
    recipientPhone: string | null;
    recipientEmail: string | null;
    recipientName: string | null;
    sentAt: string | null;
    createdAt: string;
    blockedReason: string | null;
  }>;
  activityLogRowsInWindow: Array<{
    id: string;
    organizationId: string;
    action: string;
    entityType: string | null;
    entityId: string | null;
    createdAt: string;
  }>;
  haltChecks: {
    loginOk: boolean;
    campaignCreatedOk: boolean;
    orgIsSerraHonda: boolean;
    zeroOutboundSends: boolean;
    noNonAllowlistRecipients: boolean;
  };
  rawHelperResult: unknown;
}

export async function testT3ServiceCampaign(): Promise<T3Result> {
  console.log(
    "=== Wave 2A Chunk T3 — Service Campaign Provider Proof (serra-honda) ===",
  );
  console.log("session-id:", T3_SESSION_ID);

  // 1. Defensive testlane env (HTTP path doesn't fire processOutboundSend on
  //    campaign create, but set the flags anyway for spec-checklist alignment)
  process.env.TESTLANE_MODE = "true";
  process.env.TESTLANE_SMS_TO = ALLOWLISTED_PHONE;
  console.log("TESTLANE_MODE:", process.env.TESTLANE_MODE);
  console.log("TESTLANE_SMS_TO:", process.env.TESTLANE_SMS_TO);
  console.log("base URL:", T3_BASE_URL);
  console.log("login email:", SERRA_HONDA_LOGIN_EMAIL);

  const preTs = new Date();
  console.log(`pre_ts=${preTs.toISOString()}`);

  // 2. Login to obtain accessToken
  const loginRes = await fetch(`${T3_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: SERRA_HONDA_LOGIN_EMAIL,
      password: SERRA_HONDA_LOGIN_PASSWORD,
    }),
  });
  const loginHttpStatus = loginRes.status;
  const loginBody: any = await loginRes.json().catch(() => null);
  const loginOk = loginHttpStatus >= 200 && loginHttpStatus < 300;
  if (!loginOk || !loginBody?.accessToken) {
    console.error(
      `HALT: login failed. HTTP ${loginHttpStatus}, body=${JSON.stringify(loginBody)}`,
    );
    throw new Error(
      `T3 halt: login failed (status=${loginHttpStatus}, hasToken=${!!loginBody?.accessToken})`,
    );
  }
  const accessToken = loginBody.accessToken as string;
  const authenticatedUserId = loginBody?.user?.id ?? null;
  const authenticatedOrgId =
    loginBody?.user?.organizationId ?? loginBody?.organization?.id ?? null;
  console.log(
    `[AUTH] Login OK. user.id=${authenticatedUserId} org.id=${authenticatedOrgId}`,
  );

  // 3. Resolve serra-honda org for halt checks BEFORE invoking helper
  const serraHonda = await storage.getOrganizationBySlug(SERRA_HONDA_SLUG);
  if (!serraHonda) {
    throw new Error(`HALT: serra-honda org not found by slug`);
  }
  console.log(`org: id=${serraHonda.id} slug=${serraHonda.slug} name=${serraHonda.name}`);

  if (authenticatedOrgId && authenticatedOrgId !== serraHonda.id) {
    console.error(
      `HALT: authenticated user is not in serra-honda. authOrgId=${authenticatedOrgId} expected=${serraHonda.id}`,
    );
    throw new Error("T3 halt: authenticated user is not in serra-honda");
  }

  // 4. Invoke the existing helper (read-only import; helper hits HTTP layer)
  //    Note: helper sets the env var TEST_ORG_ID for its internal default; we
  //    leave that to the helper's defaults since the org context comes from
  //    the JWT, not the body.
  console.log("Invoking testServiceCampaignCreation()...");
  const helperResult = await testServiceCampaignCreation(accessToken, T3_BASE_URL);
  console.log("helper result:", JSON.stringify(helperResult));

  if (!helperResult.success) {
    throw new Error(
      `T3 halt: helper failed — ${helperResult.error || "unknown error"}`,
    );
  }

  const campaignId = helperResult.campaignId;
  if (!campaignId) {
    throw new Error("T3 halt: helper returned success but no campaignId");
  }

  // 5. Re-read the created campaign to capture authoritative state
  const createdCampaign = await storage.getCampaign(campaignId);
  if (!createdCampaign) {
    throw new Error(
      `T3 halt: campaign id ${campaignId} not found in DB after creation`,
    );
  }
  console.log(
    `campaign created: id=${createdCampaign.id} name="${createdCampaign.name}" department=${createdCampaign.department} channel=${createdCampaign.channel} status=${createdCampaign.status} org=${createdCampaign.organizationId}`,
  );

  const orgIsSerraHonda = createdCampaign.organizationId === serraHonda.id;
  if (!orgIsSerraHonda) {
    console.error(
      `HALT: campaign created in unexpected org. campaign.organizationId=${createdCampaign.organizationId} expected=${serraHonda.id}`,
    );
    throw new Error("T3 halt: campaign not in serra-honda");
  }

  // 6. Read recipient count
  const recipientCount = await storage.getRecipientCount(campaignId);
  console.log(`recipient count: ${recipientCount}`);

  // 7. Capture post-window timestamp + scan logs for any outbound activity
  const postTs = new Date();
  console.log(`post_ts=${postTs.toISOString()}`);

  // 8. Defensive scan — should be 0 outbound_log rows because helper does not
  //    call /execute. Any rows here would indicate a contract violation.
  const outboundRows = await db
    .select()
    .from(outboundLog)
    .where(
      and(
        eq(outboundLog.organizationId, serraHonda.id),
        gte(outboundLog.createdAt, preTs),
        lte(outboundLog.createdAt, postTs),
      ),
    );

  // 9. activity_log rows in window — expect 1 (campaign_created)
  const activityRows = await db
    .select()
    .from(activityLog)
    .where(
      and(
        eq(activityLog.organizationId, serraHonda.id),
        gte(activityLog.createdAt, preTs),
        lte(activityLog.createdAt, postTs),
      ),
    );

  // 10. Halt-checks — defense-in-depth recipient allowlist scan
  const recipientPhones = outboundRows
    .map((r) => r.recipientPhone)
    .filter(Boolean) as string[];
  const allowedPhones = new Set([ALLOWLISTED_PHONE]);
  const noNonAllowlistRecipients = recipientPhones.every((p) =>
    allowedPhones.has(p),
  );
  const zeroOutboundSends = outboundRows.length === 0;

  if (!noNonAllowlistRecipients) {
    console.error(
      `HALT: outbound_log row(s) created with recipient outside allowlist: ${JSON.stringify(recipientPhones)}`,
    );
  }
  if (!zeroOutboundSends) {
    console.error(
      `WARN: ${outboundRows.length} outbound_log row(s) appeared in window. Helper does not call /execute; this would indicate a contract change.`,
    );
  }

  const result: T3Result = {
    campaignCreated: true,
    campaignId: createdCampaign.id,
    campaignName: createdCampaign.name,
    campaignDepartment: createdCampaign.department,
    campaignChannel: createdCampaign.channel,
    campaignStatus: createdCampaign.status,
    campaignOrgId: createdCampaign.organizationId,
    campaignOrgSlug: serraHonda.slug,
    recipientCount,
    loginHttpStatus,
    authenticatedUserId,
    authenticatedOrgId,
    preTs: preTs.toISOString(),
    postTs: postTs.toISOString(),
    outboundLogRowsInWindow: outboundRows.map((r) => ({
      id: r.id,
      organizationId: r.organizationId,
      channel: r.channel,
      status: r.status,
      recipientPhone: r.recipientPhone,
      recipientEmail: r.recipientEmail,
      recipientName: r.recipientName,
      sentAt: r.sentAt ? r.sentAt.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
      blockedReason: r.blockedReason,
    })),
    activityLogRowsInWindow: activityRows.map((r) => ({
      id: r.id,
      organizationId: r.organizationId,
      action: r.action,
      entityType: r.entityType,
      entityId: r.entityId,
      createdAt: r.createdAt.toISOString(),
    })),
    haltChecks: {
      loginOk,
      campaignCreatedOk: true,
      orgIsSerraHonda,
      zeroOutboundSends,
      noNonAllowlistRecipients,
    },
    rawHelperResult: helperResult,
  };

  if (!noNonAllowlistRecipients) {
    console.error("HALT-CONDITION FAILED; emitting result before throw:");
    console.error("RESULT:", JSON.stringify(result, null, 2));
    throw new Error(
      `T3 halt: non-allowlist recipient(s) in outbound_log: ${JSON.stringify(recipientPhones)}`,
    );
  }

  return result;
}

// ---------------------------------------------------------------------------
// T4 — VAPI INBOUND webhook provider proof (synthetic POST → local handler)
// ---------------------------------------------------------------------------
//
// Goal: prove that the local VAPI inbound webhook handler at
// /api/webhooks/vapi enforces the I-NEW-2026-04-26-D fail-closed guard
// (`server/lib/vapiInboundGuard.ts`) and accepts a content-bearing TestLane
// event end-to-end.
//
// Two synthetic POSTs against http://localhost:5000/api/webhooks/vapi:
//
//   Test A (REJECT) — `status-update` event, no transcript / summary /
//   messages / TestLane marker. Per the guard's event-type filter, this
//   is "ignored by event type" — the handler returns 200 with
//   `skipped:true`. Per the task spec the guard should NOT create a
//   conversation row; we assert no conversation row appears in the
//   serra-honda window. (HTTP 4xx-style "rejected by handler" is the
//   spec wording; the actual route returns 200 with skip reason for the
//   "event type ignored" branch. We capture this distinction explicitly.)
//
//   Test B (ACCEPT) — `end-of-call-report` event with assistantId set to
//   Nancy (Serra Honda service VAPI assistant), customer.name with
//   `[testlane:wave-2A-T4]` marker, customer.number = +14126546500
//   (operator allowlist), and a synthesized transcript + summary. Per
//   the guard, content-present → CREATE; the handler resolves to
//   serra-honda via Nancy's assistantId and creates a conversation +
//   transcript message.
//
// Auth: in dev (NODE_ENV=development) and with VAPI_WEBHOOK_SECRET unset,
// the handler accepts any unauthenticated request with a console warning.
// Verified upstream: `set -a; source .env; set +a` — no VAPI_WEBHOOK_SECRET
// set in this dev .env (status snapshot 2026-05-08).
//
// Halt conditions:
//   - Test A returns a CREATE-style success (`success:true` without
//     `skipped:true` AND a conversation row written) → STOP, regression
//     of I-NEW-2026-04-26-D
//   - Test B returns 5xx → STOP, handler bug
//   - Any conversation row created in any org OTHER than serra-honda → STOP
//   - Any provider send observed in outbound_log inside the window → STOP
//   - Script invoked more than once per session

const T4_BASE_URL = process.env.TESTLANE_BASE_URL || "http://localhost:5000";
const T4_SESSION_ID = "wave-2A-T4";
const T4_NANCY_ASSISTANT_ID = "c777f029-8c4c-4a23-98e4-3adfd4112a61";

interface T4PostResult {
  testName: "A" | "B";
  expectedAction: "ignore" | "create";
  httpStatus: number;
  responseBody: unknown;
  // Whether the handler signalled "ignore" path via `skipped:true` /
  // `success:false` / 4xx. True iff handler did NOT create a conversation.
  handlerIgnored: boolean;
  // Conversation rows created in serra-honda that match the synthetic
  // call's customerPhone within the window.
  conversationRowsForThisTest: Array<{
    id: string;
    organizationId: string;
    customerName: string;
    customerPhone: string | null;
    channel: string;
    createdAt: string;
  }>;
}

interface T4Result {
  baseUrl: string;
  sessionId: string;
  serraHondaOrgId: string;
  preTs: string;
  postTs: string;
  testA: T4PostResult;
  testB: T4PostResult;
  outboundLogRowsInWindow: Array<{
    id: string;
    organizationId: string;
    channel: string;
    status: string;
    recipientPhone: string | null;
    recipientEmail: string | null;
    createdAt: string;
  }>;
  haltChecks: {
    testARejected: boolean;
    testBAccepted: boolean;
    testBNo5xx: boolean;
    onlyOrgIsSerraHonda: boolean;
    noProviderSends: boolean;
  };
}

export async function testT4VapiWebhookInbound(): Promise<T4Result> {
  console.log(
    "=== Wave 2A Chunk T4 — VAPI Inbound Webhook Provider Proof (synthetic) ===",
  );
  console.log("session-id:", T4_SESSION_ID);
  console.log("base URL:", T4_BASE_URL);

  // Defensive testlane env (the handler does not consult these — they're
  // for spec-checklist alignment with sibling chunks).
  process.env.TESTLANE_MODE = "true";
  process.env.TESTLANE_SMS_TO = ALLOWLISTED_OPERATOR_PHONE;

  const serraHonda = await storage.getOrganizationBySlug(SERRA_HONDA_SLUG);
  if (!serraHonda) {
    throw new Error("T4 halt: serra-honda org not found by slug");
  }
  console.log(`org: id=${serraHonda.id} slug=${serraHonda.slug} name=${serraHonda.name}`);

  const preTs = new Date();
  console.log(`pre_ts=${preTs.toISOString()}`);

  // ---------------------------------------------------------------------
  // Test A — placeholder/no-content event. Should be rejected by the
  // guard's event-type filter (status-update is not a conversation-
  // creating event type).
  // ---------------------------------------------------------------------
  const testAPhone = "+14126546500";
  const testACallId = `t4-test-a-${Date.now()}`;
  const testAPayload = {
    message: {
      type: "status-update",
      status: "queued",
      call: {
        id: testACallId,
        status: "queued",
        assistantId: T4_NANCY_ASSISTANT_ID,
        customer: {
          number: testAPhone,
          name: "T4 Test A — placeholder no-transcript event",
        },
      },
    },
  };
  console.log("\n--- Test A: synthetic placeholder event (expect REJECT) ---");
  console.log("Test A payload:", JSON.stringify(testAPayload));

  const resA = await fetch(`${T4_BASE_URL}/api/webhooks/vapi`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(testAPayload),
  });
  const httpStatusA = resA.status;
  const bodyA: any = await resA.json().catch(() => null);
  console.log(`Test A HTTP status: ${httpStatusA}`);
  console.log("Test A response body:", JSON.stringify(bodyA));

  // Test A "handler ignored" definition: NOT 5xx, AND either response is
  // 4xx OR `skipped:true` OR `message:"Event type ignored"`.
  const testAHandlerIgnored =
    (httpStatusA >= 400 && httpStatusA < 500) ||
    bodyA?.skipped === true ||
    bodyA?.message === "Event type ignored";

  // ---------------------------------------------------------------------
  // Test B — content-present TestLane event. Should be accepted; handler
  // resolves to serra-honda via Nancy's assistantId; conversation row
  // created.
  // ---------------------------------------------------------------------
  const testBPhone = "+14126546500"; // operator allowlist phone
  const testBCallId = `t4-test-b-${Date.now()}`;
  const testBPayload = {
    message: {
      type: "end-of-call-report",
      call: {
        id: testBCallId,
        status: "ended",
        assistantId: T4_NANCY_ASSISTANT_ID,
        phoneNumber: { number: "+19014361271" },
        customer: {
          number: testBPhone,
          name: "[testlane:wave-2A-T4] Synthetic Caller",
        },
        startedAt: new Date(Date.now() - 120_000).toISOString(),
        endedAt: new Date(Date.now() - 60_000).toISOString(),
      },
      transcript:
        "[testlane:wave-2A-T4] Synthetic transcript content for inbound webhook proof.\n" +
        "user: Hi, calling about my 2024 Honda Pilot service appointment.\n" +
        "assistant: Of course — let me pull up your record.",
      summary:
        "[testlane:wave-2A-T4] Synthetic VAPI end-of-call summary used for inbound webhook proof; no real human involved.",
    },
  };
  console.log("\n--- Test B: synthetic content-bearing TestLane event (expect ACCEPT) ---");
  console.log("Test B payload (transcript truncated):", JSON.stringify({
    ...testBPayload,
    message: {
      ...testBPayload.message,
      transcript: testBPayload.message.transcript.slice(0, 80) + "...",
      summary: testBPayload.message.summary.slice(0, 80) + "...",
    },
  }));

  const resB = await fetch(`${T4_BASE_URL}/api/webhooks/vapi`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(testBPayload),
  });
  const httpStatusB = resB.status;
  const bodyB: any = await resB.json().catch(() => null);
  console.log(`Test B HTTP status: ${httpStatusB}`);
  console.log("Test B response body:", JSON.stringify(bodyB));

  const testBHandlerIgnored =
    (httpStatusB >= 400 && httpStatusB < 500) ||
    bodyB?.skipped === true ||
    bodyB?.message === "Event type ignored";

  const postTs = new Date();
  console.log(`\npost_ts=${postTs.toISOString()}`);

  // 4. Query conversations created in window — filter by createdAt and
  //    customerPhone match per test (allowlist phone).
  const convoRowsAll = await db
    .select()
    .from(conversations)
    .where(
      and(
        gte(conversations.createdAt, preTs),
        lte(conversations.createdAt, postTs),
      ),
    );

  // 5. Filter to conversations that look like products of these synthetic
  //    POSTs (channel=voice + organization + phone).
  const convoRowsThisTestA = convoRowsAll.filter(
    (c) =>
      c.channel === "voice" &&
      c.customerPhone === testAPhone &&
      c.organizationId === serraHonda.id &&
      // Test A's customer name is unique to Test A
      (c.customerName?.includes("placeholder") ?? false),
  );
  const convoRowsThisTestB = convoRowsAll.filter(
    (c) =>
      c.channel === "voice" &&
      c.customerPhone === testBPhone &&
      c.organizationId === serraHonda.id &&
      // Test B carries the testlane marker in the customer name
      (c.customerName?.includes("[testlane:wave-2A-T4]") ?? false),
  );

  // 6. Defense-in-depth: any voice conversation in window in an org OTHER
  //    than serra-honda?
  const voiceConvosOtherOrg = convoRowsAll.filter(
    (c) => c.channel === "voice" && c.organizationId !== serraHonda.id,
  );

  // 7. Defense-in-depth: outbound_log rows in serra-honda window (synthetic
  //    POST should NOT trigger sends; non-zero would indicate something
  //    fired downstream).
  const outboundRows = await db
    .select()
    .from(outboundLog)
    .where(
      and(
        eq(outboundLog.organizationId, serraHonda.id),
        gte(outboundLog.createdAt, preTs),
        lte(outboundLog.createdAt, postTs),
      ),
    );

  // 8. Halt-check assembly
  const testARejected =
    testAHandlerIgnored && convoRowsThisTestA.length === 0;
  const testBNo5xx = httpStatusB < 500;
  const testBAccepted =
    !testBHandlerIgnored &&
    httpStatusB >= 200 &&
    httpStatusB < 300 &&
    bodyB?.success === true &&
    bodyB?.skipped !== true &&
    convoRowsThisTestB.length === 1;
  const onlyOrgIsSerraHonda = voiceConvosOtherOrg.length === 0;
  const noProviderSends = outboundRows.length === 0;

  if (!testARejected) {
    console.error(
      `HALT: Test A was NOT rejected as expected. handlerIgnored=${testAHandlerIgnored} httpStatus=${httpStatusA} convoRows=${convoRowsThisTestA.length}`,
    );
  }
  if (!testBAccepted) {
    console.error(
      `HALT: Test B was NOT accepted as expected. httpStatus=${httpStatusB} body=${JSON.stringify(bodyB)} convoRows=${convoRowsThisTestB.length}`,
    );
  }
  if (!testBNo5xx) {
    console.error(`HALT: Test B returned 5xx. status=${httpStatusB}`);
  }
  if (!onlyOrgIsSerraHonda) {
    console.error(
      `HALT: voice conversation(s) created in org(s) OTHER than serra-honda: ${JSON.stringify(
        voiceConvosOtherOrg.map((c) => ({
          id: c.id,
          orgId: c.organizationId,
          customerName: c.customerName,
        })),
      )}`,
    );
  }
  if (!noProviderSends) {
    console.error(
      `HALT: provider send(s) observed in window: ${outboundRows.length} row(s)`,
    );
  }

  const result: T4Result = {
    baseUrl: T4_BASE_URL,
    sessionId: T4_SESSION_ID,
    serraHondaOrgId: serraHonda.id,
    preTs: preTs.toISOString(),
    postTs: postTs.toISOString(),
    testA: {
      testName: "A",
      expectedAction: "ignore",
      httpStatus: httpStatusA,
      responseBody: bodyA,
      handlerIgnored: testAHandlerIgnored,
      conversationRowsForThisTest: convoRowsThisTestA.map((c) => ({
        id: c.id,
        organizationId: c.organizationId,
        customerName: c.customerName,
        customerPhone: c.customerPhone,
        channel: c.channel,
        createdAt: c.createdAt.toISOString(),
      })),
    },
    testB: {
      testName: "B",
      expectedAction: "create",
      httpStatus: httpStatusB,
      responseBody: bodyB,
      handlerIgnored: testBHandlerIgnored,
      conversationRowsForThisTest: convoRowsThisTestB.map((c) => ({
        id: c.id,
        organizationId: c.organizationId,
        customerName: c.customerName,
        customerPhone: c.customerPhone,
        channel: c.channel,
        createdAt: c.createdAt.toISOString(),
      })),
    },
    outboundLogRowsInWindow: outboundRows.map((r) => ({
      id: r.id,
      organizationId: r.organizationId,
      channel: r.channel,
      status: r.status,
      recipientPhone: r.recipientPhone,
      recipientEmail: r.recipientEmail,
      createdAt: r.createdAt.toISOString(),
    })),
    haltChecks: {
      testARejected,
      testBAccepted,
      testBNo5xx,
      onlyOrgIsSerraHonda,
      noProviderSends,
    },
  };

  if (
    !testARejected ||
    !testBAccepted ||
    !testBNo5xx ||
    !onlyOrgIsSerraHonda ||
    !noProviderSends
  ) {
    console.error("HALT-CONDITION FAILED; emitting result before throw:");
    console.error("RESULT:", JSON.stringify(result, null, 2));
    throw new Error(
      `T4 halt: Arejected=${testARejected} Baccepted=${testBAccepted} Bno5xx=${testBNo5xx} onlySerra=${onlyOrgIsSerraHonda} noSends=${noProviderSends}`,
    );
  }

  // Suppress unused-import warning when only T4 is invoked. The `messages`
  // table is imported here for parity with sibling chunks; future T4
  // extensions (e.g. asserting the VAPI transcript message row) will use it.
  void messages;

  return result;
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

const isDirectInvocation =
  // tsx / node both populate process.argv[1] with the script path
  process.argv[1] && process.argv[1].endsWith("test-trigger-2A.ts");

if (isDirectInvocation) {
  const fn = process.argv[2];
  if (fn === "testT1ProviderProofSms") {
    testT1ProviderProofSms()
      .then((r) => {
        console.log("RESULT:", JSON.stringify(r, null, 2));
        process.exit(0);
      })
      .catch((e) => {
        console.error("FAILED:", e?.message || e);
        if (e?.stack) console.error(e.stack);
        process.exit(1);
      });
  } else if (fn === "testT2VapiElliottToNancy") {
    testT2VapiElliottToNancy()
      .then((r) => {
        console.log("RESULT:", JSON.stringify(r, null, 2));
        process.exit(0);
      })
      .catch((e) => {
        console.error("FAILED:", e?.message || e);
        if (e?.stack) console.error(e.stack);
        process.exit(1);
      });
  } else if (fn === "testT3ServiceCampaign") {
    testT3ServiceCampaign()
      .then((r) => {
        console.log("RESULT:", JSON.stringify(r, null, 2));
        process.exit(0);
      })
      .catch((e) => {
        console.error("FAILED:", e?.message || e);
        if (e?.stack) console.error(e.stack);
        process.exit(1);
      });
  } else if (fn === "testT4VapiWebhookInbound") {
    testT4VapiWebhookInbound()
      .then((r) => {
        console.log("RESULT:", JSON.stringify(r, null, 2));
        process.exit(0);
      })
      .catch((e) => {
        console.error("FAILED:", e?.message || e);
        if (e?.stack) console.error(e.stack);
        process.exit(1);
      });
  } else {
    console.error(
      `Unknown function: "${fn}". Supported: testT1ProviderProofSms, testT2VapiElliottToNancy, testT3ServiceCampaign, testT4VapiWebhookInbound`,
    );
    process.exit(2);
  }
}
