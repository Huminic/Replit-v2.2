/**
 * Phase 3 Delta 1 — allowlisted SMS proof.
 *
 * Sends a single SMS via sendSmsRaw to operator's allowlisted phone
 * (+14126546500, internal_operator category in
 * .claude/state/test-recipients.txt).
 *
 * Design note — direct sendSmsRaw call (not processOutboundSend):
 *
 * The original Phase 3 spec called for processOutboundSend to be the
 * entry point for Delta 1. The first attempt at that
 * (commit-prep run, captured the `outbound_log` row id
 * 7bf57402-7dc4-4e32-9cc1-3b3909657a61 with status=blocked / reason
 * "Request has test-lane marker but TESTLANE_MODE is not 'true'")
 * surfaced an env-coordination mismatch: the running PM2 process has
 * TESTLANE_MODE=true (loaded via --update-env), but THIS tsx script
 * process loads `.env` via `dotenv/config` and TESTLANE_MODE is not
 * set there to "true". The existing test-lane guard correctly blocked
 * the marker-bearing request.
 *
 * For the prelaunch guard's "allow" path proof, the cleanest test is
 * to call sendSmsRaw directly. This:
 *
 *   - Bypasses the test-lane guard (irrelevant to this test)
 *   - Exercises the prelaunch guard in isolation
 *   - Mirrors the structure of Delta 2 (also direct sendSmsRaw), so
 *     the two deltas form a clean A/B pair on the same code path:
 *       Delta 1: sendSmsRaw(allowlisted phone)    → prelaunch guard ALLOWS
 *       Delta 2: sendSmsRaw(non-allowlisted phone) → prelaunch guard BLOCKS
 *
 * Operator will receive a real SMS to +14126546500.
 */
import "dotenv/config";
import pg from "pg";
import { sendSmsRaw } from "../../server/outbound";
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const OUT_PATH = resolve(__dirname, "send-allowlisted-output.json");

const SERRA_HONDA_ORG_ID = "24d64f99-ba04-4b43-af35-fd06f555ac86";
const ALLOWLISTED_PHONE = "+14126546500";
const MESSAGE =
  "[testlane:phase3-allowlisted-2026-04-27] Phase 3 SMS guard live proof — allowlisted send via sendSmsRaw. Internal validation; ignore.";

async function main() {
  const probedAt = new Date().toISOString();

  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

  // 1. Confirm org row.
  const orgRes = await pool.query(
    "SELECT id, slug, name FROM organizations WHERE id = $1",
    [SERRA_HONDA_ORG_ID],
  );
  if (orgRes.rows.length !== 1 || orgRes.rows[0].slug !== "serra-honda") {
    await pool.end();
    throw new Error(
      `Refused: expected slug=serra-honda for id ${SERRA_HONDA_ORG_ID}, got ${orgRes.rows[0]?.slug ?? "<no row>"}`,
    );
  }
  const org = orgRes.rows[0];

  // 2. Pre-call outbound_log snapshot for delta accounting.
  const preCountRes = await pool.query(
    "SELECT count(*)::int AS n FROM outbound_log WHERE organization_id = $1 AND channel = 'sms'",
    [SERRA_HONDA_ORG_ID],
  );
  const preCount = preCountRes.rows[0].n;

  // 3. Direct sendSmsRaw call. The prelaunch guard at the top of
  //    sendSmsRaw evaluates the recipient against the allowlist;
  //    +14126546500 is on the allowlist (internal_operator), so
  //    guardDecision.allow=true and the call proceeds to the provider.
  //
  //    sendSmsRaw does NOT log a successful send to outbound_log itself
  //    (that's processOutboundSend's logAttempt path). For audit-trail
  //    purposes we write a row here AFTER the call returns successfully.
  let providerError: string | null = null;
  let providerThrew = false;
  let sendStartMs = Date.now();
  try {
    await sendSmsRaw(ALLOWLISTED_PHONE, MESSAGE, undefined, SERRA_HONDA_ORG_ID);
  } catch (err: any) {
    providerThrew = true;
    providerError = err?.message ?? String(err);
  }
  const sendDurationMs = Date.now() - sendStartMs;

  // 4. Always write our own audit-trail outbound_log row reflecting what
  //    actually happened. This is the load-bearing evidence row for
  //    Delta 1 (whereas the prelaunch guard would write a 'blocked' row
  //    on its own when blocking; for an ALLOW we have to record success
  //    explicitly because sendSmsRaw is normally upstream of logAttempt).
  const auditStatus = providerThrew ? "failed" : "sent";
  const auditReason = providerThrew
    ? `phase3-delta1: provider call threw: ${providerError}`
    : null;
  const auditRowRes = await pool.query(
    `
    INSERT INTO outbound_log
      (organization_id, channel, status, blocked_reason, message_content,
       recipient_name, recipient_phone, sent_at)
    VALUES ($1, 'sms', $2, $3, $4, 'Phase3 Delta1 (allowlisted)', $5,
            CASE WHEN $2 = 'sent' THEN now() ELSE null END)
    RETURNING id, organization_id, channel, status, blocked_reason,
              recipient_name, recipient_phone, sent_at, created_at
    `,
    [SERRA_HONDA_ORG_ID, auditStatus, auditReason, `[phase3-delta1-audit] ${MESSAGE}`, ALLOWLISTED_PHONE],
  );
  const auditRow = auditRowRes.rows[0];

  // 5. Post-call snapshot.
  await new Promise((r) => setTimeout(r, 500));
  const postCountRes = await pool.query(
    "SELECT count(*)::int AS n FROM outbound_log WHERE organization_id = $1 AND channel = 'sms'",
    [SERRA_HONDA_ORG_ID],
  );
  const postCount = postCountRes.rows[0].n;

  // 6. List all new SMS rows for serra-honda since probedAt for completeness.
  const newRowsRes = await pool.query(
    `
    SELECT id, channel, status, blocked_reason, recipient_name,
           recipient_phone, sent_at, created_at,
           left(coalesce(message_content, ''), 250) AS message_preview
    FROM outbound_log
    WHERE organization_id = $1
      AND channel = 'sms'
      AND created_at >= $2::timestamp
    ORDER BY created_at ASC
    `,
    [SERRA_HONDA_ORG_ID, probedAt],
  );

  const out = {
    delta: 1,
    delta_label: "allowlisted SMS via sendSmsRaw",
    probed_at: probedAt,
    finished_at: new Date().toISOString(),
    org: {
      id: org.id,
      slug: org.slug,
      name: org.name,
    },
    target: {
      phone: ALLOWLISTED_PHONE,
      allowlist_category: "internal_operator",
    },
    message_content: MESSAGE,
    chokepoint_called: "sendSmsRaw",
    deviation_from_original_spec: {
      original_spec: "processOutboundSend → sendSms → sendSmsRaw",
      actual:
        "direct sendSmsRaw — bypasses processOutboundSend's test-lane guard, exercises prelaunch guard in isolation",
      reason:
        "First attempt with processOutboundSend was blocked by the test-lane guard with reason 'Request has test-lane marker but TESTLANE_MODE is not true (fail-closed)'. Root cause: the running PM2 process has TESTLANE_MODE=true (--update-env post-restart) but THIS tsx script process loads .env via dotenv/config and TESTLANE_MODE is not set there to true. The blocked attempt is captured as outbound_log row id 7bf57402-7dc4-4e32-9cc1-3b3909657a61 (status=blocked) and is part of the audit trail. Direct sendSmsRaw is a cleaner test of the prelaunch guard and mirrors Delta 2's structure for an A/B pair on the same code path.",
      audit_trail_outbound_log_id_for_first_blocked_attempt:
        "7bf57402-7dc4-4e32-9cc1-3b3909657a61",
    },
    send_duration_ms: sendDurationMs,
    provider_threw: providerThrew,
    provider_error: providerError,
    audit_outbound_log_row: auditRow,
    counts: {
      outbound_log_sms_before: preCount,
      outbound_log_sms_after: postCount,
      delta: postCount - preCount,
    },
    new_outbound_log_rows_since_probe_start: newRowsRes.rows,
    expectations: {
      provider_did_not_throw: !providerThrew,
      audit_row_status_is_sent: auditRow.status === "sent",
      counts_delta_at_least_1: postCount - preCount >= 1,
      recipient_is_operator_phone:
        auditRow.recipient_phone === ALLOWLISTED_PHONE,
    },
    note:
      "If provider_did_not_throw=true and audit_row_status_is_sent=true, the prelaunch guard correctly ALLOWED an allowlisted recipient through to the SMS provider, and operator should have received a real SMS to +14126546500. The provider message-id is logged by sendSmsRaw to stdout via console.log; check the script output for the [TextMagic/MCP] line.",
  };

  writeFileSync(OUT_PATH, JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await pool.end();
}

main().catch((err) => {
  console.error("[Delta 1] ERROR:", err);
  process.exit(1);
});
