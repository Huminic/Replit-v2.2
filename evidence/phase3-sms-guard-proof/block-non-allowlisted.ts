/**
 * Phase 3 Delta 2 — non-allowlisted block proof.
 *
 * Calls sendSmsRaw directly with +15417783509 (Lisa Morris from
 * INC-001, real Honda customer, NOT on the allowlist). The prelaunch
 * guard at the top of sendSmsRaw should:
 *
 *   1. Find the recipient is not in `.claude/state/test-recipients.txt`
 *   2. Write its own outbound_log row with status='blocked' and
 *      blockedReason starting `prelaunch-sms-lock:`
 *   3. Throw an Error with the same blockedReason
 *
 * The provider call (callMCP("tm_send_message", ...)) MUST NOT happen.
 * No SMS is sent. Lisa Morris does not receive anything.
 *
 * Direct sendSmsRaw call (not processOutboundSend) is intentional:
 * we want to test the prelaunch guard in isolation, without the
 * upstream test-lane / commgate / business-hours layers also blocking.
 */
import "dotenv/config";
import pg from "pg";
import { sendSmsRaw } from "../../server/outbound";
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const OUT_PATH = resolve(__dirname, "block-non-allowlisted-output.json");

const SERRA_HONDA_ORG_ID = "24d64f99-ba04-4b43-af35-fd06f555ac86";
// Lisa Morris's phone — INC-001 real Honda customer, intentionally NOT
// on the allowlist. The prelaunch guard MUST block before the provider
// call. No SMS will be sent.
const NON_ALLOWLISTED_PHONE = "+15417783509";
const MESSAGE =
  "[phase3-block-sim-2026-04-27] Phase 3 SMS guard non-allowlisted block proof. Guard short-circuits before provider call. NOT SENT.";

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

  // 2. Pre-call snapshots — total org SMS rows AND specifically rows for
  //    +15417783509 in any normalized form. The latter must NOT increase
  //    by an additional 'sent' row (the guard should write a blocked
  //    row, but no sent row).
  const preCountRes = await pool.query(
    "SELECT count(*)::int AS n FROM outbound_log WHERE organization_id = $1 AND channel = 'sms'",
    [SERRA_HONDA_ORG_ID],
  );
  const preCount = preCountRes.rows[0].n;

  const targetDigits = NON_ALLOWLISTED_PHONE.replace(/[^\d]/g, "");
  const variants = new Set<string>();
  variants.add(targetDigits);
  if (targetDigits.length === 10) variants.add("1" + targetDigits);
  if (targetDigits.length === 11 && targetDigits.startsWith("1")) variants.add(targetDigits.slice(1));

  const preTargetRes = await pool.query(
    `
    SELECT count(*)::int AS n
    FROM outbound_log
    WHERE organization_id = $1
      AND channel = 'sms'
      AND regexp_replace(coalesce(recipient_phone, ''), '[^0-9]', '', 'g') = ANY($2::text[])
    `,
    [SERRA_HONDA_ORG_ID, [...variants]],
  );
  const preTargetCount = preTargetRes.rows[0].n;

  // 3. Direct sendSmsRaw call. We expect the prelaunch guard to throw
  //    with a 'prelaunch-sms-lock:' reason. We capture the throw and
  //    verify the guard wrote its own blocked outbound_log row.
  let threw = false;
  let errorMessage: string | null = null;
  let errorContainsPrelaunchSmsLock = false;
  let errorContainsAllowlist = false;
  const sendStartMs = Date.now();
  try {
    await sendSmsRaw(NON_ALLOWLISTED_PHONE, MESSAGE, undefined, SERRA_HONDA_ORG_ID);
  } catch (err: any) {
    threw = true;
    errorMessage = err?.message ?? String(err);
    errorContainsPrelaunchSmsLock = errorMessage.includes("prelaunch-sms-lock");
    errorContainsAllowlist = errorMessage.toLowerCase().includes("allowlist");
  }
  const sendDurationMs = Date.now() - sendStartMs;

  // 4. Wait briefly for the guard's async createOutboundLog to land,
  //    then look up rows.
  await new Promise((r) => setTimeout(r, 1000));

  const postCountRes = await pool.query(
    "SELECT count(*)::int AS n FROM outbound_log WHERE organization_id = $1 AND channel = 'sms'",
    [SERRA_HONDA_ORG_ID],
  );
  const postCount = postCountRes.rows[0].n;

  const postTargetRes = await pool.query(
    `
    SELECT count(*)::int AS n
    FROM outbound_log
    WHERE organization_id = $1
      AND channel = 'sms'
      AND regexp_replace(coalesce(recipient_phone, ''), '[^0-9]', '', 'g') = ANY($2::text[])
    `,
    [SERRA_HONDA_ORG_ID, [...variants]],
  );
  const postTargetCount = postTargetRes.rows[0].n;

  // 5. Pull the row(s) the guard just wrote.
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

  // 6. Critical: confirm NO row landed with status='sent' for the
  //    target phone since the probe started. If such a row exists, the
  //    guard failed catastrophically and we sent a real SMS to a real
  //    customer.
  const sentRowsForTarget = newRowsRes.rows.filter(
    (r: any) =>
      r.status === "sent" &&
      [...variants].includes(String(r.recipient_phone || "").replace(/[^\d]/g, "")),
  );

  const out = {
    delta: 2,
    delta_label: "non-allowlisted block via sendSmsRaw",
    probed_at: probedAt,
    finished_at: new Date().toISOString(),
    org: {
      id: org.id,
      slug: org.slug,
      name: org.name,
    },
    target: {
      phone: NON_ALLOWLISTED_PHONE,
      allowlist_category: null,
      provenance:
        "Lisa Morris — INC-001 real Honda customer with vin_solutions warehouse_lead (vin_status=SERVICE_APPOINTMENT_SCHEDULED, leadsources/id/7098). Real person; deliberately chosen to ensure the guard would fire on a real-customer phone.",
    },
    message_content: MESSAGE,
    chokepoint_called: "sendSmsRaw",
    send_duration_ms: sendDurationMs,
    threw,
    error_message: errorMessage,
    error_contains_prelaunch_sms_lock: errorContainsPrelaunchSmsLock,
    error_contains_allowlist: errorContainsAllowlist,
    counts: {
      outbound_log_sms_before: preCount,
      outbound_log_sms_after: postCount,
      delta_total: postCount - preCount,
      target_phone_sms_before: preTargetCount,
      target_phone_sms_after: postTargetCount,
      delta_target_phone: postTargetCount - preTargetCount,
    },
    new_outbound_log_rows_since_probe_start: newRowsRes.rows,
    sent_rows_for_target_phone_since_probe: sentRowsForTarget,
    expectations: {
      send_did_throw: threw,
      throw_message_mentions_prelaunch_sms_lock: errorContainsPrelaunchSmsLock,
      no_sent_row_for_target_phone: sentRowsForTarget.length === 0,
      blocked_row_written_by_guard: newRowsRes.rows.some(
        (r: any) =>
          r.status === "blocked" &&
          String(r.blocked_reason || "").startsWith("prelaunch-sms-lock") &&
          [...variants].includes(String(r.recipient_phone || "").replace(/[^\d]/g, "")),
      ),
    },
    note:
      "Critical safety property: sent_rows_for_target_phone_since_probe MUST be an empty array. If it has any rows, the guard failed and a real SMS reached Lisa Morris's phone. Operator surfacing required immediately.",
  };

  writeFileSync(OUT_PATH, JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await pool.end();
}

main().catch((err) => {
  console.error("[Delta 2] ERROR:", err);
  process.exit(1);
});
