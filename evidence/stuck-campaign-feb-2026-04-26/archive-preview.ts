/**
 * STEP 1 — read-only preview for the operator-approved Path B archive.
 *
 * Operator approval is scoped to ONE campaign id:
 *   30267ae2-5d81-4c21-b0bf-ad96e4eb31ec
 *
 * No mutation here. Captures:
 *   1. Full campaigns row before change (all columns, no projection).
 *   2. Recipient count (must be 16 per archaeology).
 *   3. Outbound log count (must be 0 per archaeology).
 *   4. Echo of the exact UPDATE that WILL be run if the preview matches.
 *   5. Before/after delta table for status / execution_status / kill_switch /
 *      updated_at — execution_status MUST appear unchanged in both columns.
 *
 * Run: `cd nexxus2.2_replit && npx tsx evidence/stuck-campaign-feb-2026-04-26/archive-preview.ts`
 */
import "dotenv/config";
import pg from "pg";
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CAMPAIGN_ID = "30267ae2-5d81-4c21-b0bf-ad96e4eb31ec";
const OUT_PATH = resolve(
  __dirname,
  "archive-preview-2026-04-26.json",
);

// Exact UPDATE we WILL run in Step 2 if the preview matches.
// execution_status is intentionally NOT in the SET clause — operator
// instruction: "leave execution_status unchanged unless you explain why it
// must change". I have no reason to change it; archive is purely a status /
// kill-switch flip.
const PROPOSED_UPDATE_SQL = `
UPDATE campaigns
SET status = 'archived',
    kill_switch = true,
    updated_at = now()
WHERE id = $1
RETURNING *;
`.trim();

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  try {
    // 1. Full row before change. SELECT * — no column suppression so the
    //    operator can audit every field.
    const rowRes = await pool.query(
      "SELECT * FROM campaigns WHERE id = $1",
      [CAMPAIGN_ID],
    );
    if (rowRes.rows.length !== 1) {
      throw new Error(
        `Expected exactly 1 campaign row for id=${CAMPAIGN_ID}, got ${rowRes.rows.length}`,
      );
    }
    const before = rowRes.rows[0];

    // 2. Recipient count.
    const recipRes = await pool.query(
      "SELECT count(*)::int AS n FROM campaign_recipients WHERE campaign_id = $1",
      [CAMPAIGN_ID],
    );
    const recipientCount = recipRes.rows[0].n;

    // 3. Outbound log count.
    const obRes = await pool.query(
      "SELECT count(*)::int AS n FROM outbound_log WHERE campaign_id = $1",
      [CAMPAIGN_ID],
    );
    const outboundLogCount = obRes.rows[0].n;

    // 5. Before / after delta — fields the UPDATE will touch + the one the
    //    operator explicitly required to remain unchanged.
    const delta = {
      status: { before: before.status, after_proposed: "archived" },
      execution_status: {
        before: before.execution_status,
        after_proposed: before.execution_status,
        note: "UNCHANGED per operator instruction",
      },
      kill_switch: { before: before.kill_switch, after_proposed: true },
      updated_at: {
        before: before.updated_at,
        after_proposed: "now() (set by db on UPDATE execution)",
      },
    };

    // Cross-checks against the archaeology report (66ee273 / probe-output.json).
    // If any of these is false, operator's contingent approval doesn't apply.
    const archaeologyMatch = {
      campaign_exists: rowRes.rows.length === 1,
      org_id_matches: before.organization_id ===
        "24d64f99-ba04-4b43-af35-fd06f555ac86", // Serra Honda
      name_matches: before.name === "Service Reminder - February",
      status_matches_archaeology: before.status === "active",
      execution_status_matches_archaeology: before.execution_status === "idle",
      scheduled_at_is_null: before.scheduled_at === null,
      execution_started_at_is_null: before.execution_started_at === null,
      kill_switch_is_false: before.kill_switch === false,
      sent_count_is_zero: before.sent_count === 0,
      replied_count_is_zero: before.replied_count === 0,
      recipient_count_is_16: recipientCount === 16,
      outbound_log_count_is_0: outboundLogCount === 0,
      csv_filename_matches: before.csv_filename === "test-recipients.csv",
      message_template_is_null: before.message_template === null,
    };
    const allMatch = Object.values(archaeologyMatch).every((v) => v === true);

    const out = {
      probed_at: new Date().toISOString(),
      campaign_id: CAMPAIGN_ID,
      step: 1,
      operator_approval_scope: "single campaign id only — no other rows touched",
      before_row_full: before,
      recipient_count: recipientCount,
      outbound_log_count: outboundLogCount,
      proposed_update_sql: PROPOSED_UPDATE_SQL,
      proposed_update_params: [CAMPAIGN_ID],
      delta,
      archaeology_match: archaeologyMatch,
      all_archaeology_assertions_pass: allMatch,
      decision_gate:
        allMatch
          ? "PROCEED — preview matches archaeology; operator's contingent approval applies. Step 2 (UPDATE execution) is authorized."
          : "STOP — at least one archaeology assertion failed. Surface the discrepancy to the operator BEFORE executing the UPDATE.",
    };

    writeFileSync(OUT_PATH, JSON.stringify(out, null, 2));
    console.log(JSON.stringify(out, null, 2));
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
