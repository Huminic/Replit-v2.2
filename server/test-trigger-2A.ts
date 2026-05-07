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
 * Halt conditions enforced inside the function:
 *   - Recipient logged in outbound_log MUST be +14126546500 (testlane gate
 *     hard-route target). Any other recipient = STOP (gate broken).
 *   - Result MUST be {sent: true} with messageId visible in console output.
 *   - Exactly 1 outbound_log row created in the [pre_ts, post_ts] window.
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
  } else {
    console.error(
      `Unknown function: "${fn}". Supported: testT1ProviderProofSms`,
    );
    process.exit(2);
  }
}
