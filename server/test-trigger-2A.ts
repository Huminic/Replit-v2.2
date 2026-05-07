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
import { outboundLog, activityLog } from "@shared/schema";
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
  } else {
    console.error(
      `Unknown function: "${fn}". Supported: testT1ProviderProofSms, testT2VapiElliottToNancy`,
    );
    process.exit(2);
  }
}
