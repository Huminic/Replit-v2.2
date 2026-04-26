/**
 * STEP 2 — execute the operator-approved UPDATE.
 *
 * Operator approval is scoped to ONE campaign id:
 *   30267ae2-5d81-4c21-b0bf-ad96e4eb31ec
 *
 * Approval is contingent on Step 1's preview matching the archaeology
 * report. archive-preview-2026-04-26.json showed
 * `all_archaeology_assertions_pass: true`. This script:
 *
 *   1. Re-reads the row inside the same transaction (defense in depth —
 *      catches any change since Step 1).
 *   2. Re-asserts the archaeology snapshot (status='active',
 *      execution_status='idle', kill_switch=false, scheduled_at=null,
 *      sent_count=0, recipient_count=16, outbound_log_count=0). If ANY
 *      assertion fails, ROLLBACK and exit non-zero — surface the
 *      discrepancy and DO NOT mutate.
 *   3. Runs ONE UPDATE: status='archived', kill_switch=true,
 *      updated_at=now(). RETURNING * captures the post-update row.
 *      execution_status is intentionally absent from SET.
 *   4. Re-counts recipients + outbound_log to confirm no side effects.
 *   5. COMMIT.
 *   6. Writes archive-result-2026-04-26.json with full before/after row
 *      and counts.
 *
 * Run: `cd nexxus2.2_replit && npx tsx evidence/stuck-campaign-feb-2026-04-26/archive-execute.ts`
 */
import "dotenv/config";
import pg from "pg";
import { writeFileSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CAMPAIGN_ID = "30267ae2-5d81-4c21-b0bf-ad96e4eb31ec";
const PREVIEW_PATH = resolve(__dirname, "archive-preview-2026-04-26.json");
const RESULT_PATH = resolve(__dirname, "archive-result-2026-04-26.json");

async function main() {
  // Hard-coded scope check: refuse to operate on any other id.
  if (CAMPAIGN_ID !== "30267ae2-5d81-4c21-b0bf-ad96e4eb31ec") {
    throw new Error("Refused: campaign id outside operator approval scope");
  }

  // Defense in depth: load Step 1 preview and require all_archaeology_assertions_pass=true.
  const preview = JSON.parse(readFileSync(PREVIEW_PATH, "utf-8"));
  if (preview.all_archaeology_assertions_pass !== true) {
    throw new Error(
      "Refused: Step 1 preview did not pass all archaeology assertions",
    );
  }
  if (preview.campaign_id !== CAMPAIGN_ID) {
    throw new Error(
      `Refused: preview campaign_id (${preview.campaign_id}) does not match approved id (${CAMPAIGN_ID})`,
    );
  }

  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  let result: any = null;
  try {
    await client.query("BEGIN");

    // 1. Re-read inside transaction — catches any change since Step 1.
    const beforeRes = await client.query(
      "SELECT * FROM campaigns WHERE id = $1 FOR UPDATE",
      [CAMPAIGN_ID],
    );
    if (beforeRes.rows.length !== 1) {
      throw new Error(
        `In-tx select returned ${beforeRes.rows.length} rows — aborting`,
      );
    }
    const before = beforeRes.rows[0];

    const recipBefore = await client.query(
      "SELECT count(*)::int AS n FROM campaign_recipients WHERE campaign_id = $1",
      [CAMPAIGN_ID],
    );
    const obBefore = await client.query(
      "SELECT count(*)::int AS n FROM outbound_log WHERE campaign_id = $1",
      [CAMPAIGN_ID],
    );

    // 2. Re-assert archaeology snapshot.
    const txAssertions = {
      status_active: before.status === "active",
      execution_status_idle: before.execution_status === "idle",
      kill_switch_false: before.kill_switch === false,
      scheduled_at_null: before.scheduled_at === null,
      execution_started_at_null: before.execution_started_at === null,
      sent_count_zero: before.sent_count === 0,
      replied_count_zero: before.replied_count === 0,
      org_id_serra_honda: before.organization_id ===
        "24d64f99-ba04-4b43-af35-fd06f555ac86",
      name_matches: before.name === "Service Reminder - February",
      recipient_count_16: recipBefore.rows[0].n === 16,
      outbound_log_count_0: obBefore.rows[0].n === 0,
    };
    const allPass = Object.values(txAssertions).every((v) => v === true);
    if (!allPass) {
      await client.query("ROLLBACK");
      throw new Error(
        `In-transaction assertion failure — ROLLBACK. Failures: ${JSON.stringify(
          Object.fromEntries(
            Object.entries(txAssertions).filter(([, v]) => v !== true),
          ),
        )}`,
      );
    }

    // 3. The single allowed mutation.
    const updateRes = await client.query(
      `
      UPDATE campaigns
      SET status = 'archived',
          kill_switch = true,
          updated_at = now()
      WHERE id = $1
      RETURNING *;
      `,
      [CAMPAIGN_ID],
    );
    if (updateRes.rows.length !== 1) {
      await client.query("ROLLBACK");
      throw new Error(
        `UPDATE affected ${updateRes.rows.length} rows — expected exactly 1; ROLLBACK`,
      );
    }
    const after = updateRes.rows[0];

    // Sanity: every field NOT in the SET clause must be unchanged.
    const unchangedKeys = [
      "id",
      "name",
      "department",
      "channel",
      "organization_id",
      "recipient_count",
      "sent_count",
      "replied_count",
      "csv_filename",
      "message_template",
      "send_interval_seconds",
      "execution_status",
      "execution_total",
      "execution_processed",
      "execution_sent",
      "execution_failed",
      "execution_started_at",
      "scheduled_at",
      "created_at",
    ];
    const unchangedDelta: Record<string, { before: unknown; after: unknown; same: boolean }> = {};
    for (const k of unchangedKeys) {
      const eq =
        before[k] instanceof Date && after[k] instanceof Date
          ? before[k].getTime() === after[k].getTime()
          : before[k] === after[k];
      unchangedDelta[k] = { before: before[k], after: after[k], same: !!eq };
    }
    const allUnchangedHeld = Object.values(unchangedDelta).every((d) => d.same);
    if (!allUnchangedHeld) {
      await client.query("ROLLBACK");
      throw new Error(
        `Unexpected mutation outside SET clause — ROLLBACK. Diffs: ${JSON.stringify(
          Object.fromEntries(
            Object.entries(unchangedDelta).filter(([, d]) => !d.same),
          ),
        )}`,
      );
    }

    // 4. Re-count recipients + outbound_log — no side effects expected.
    const recipAfter = await client.query(
      "SELECT count(*)::int AS n FROM campaign_recipients WHERE campaign_id = $1",
      [CAMPAIGN_ID],
    );
    const obAfter = await client.query(
      "SELECT count(*)::int AS n FROM outbound_log WHERE campaign_id = $1",
      [CAMPAIGN_ID],
    );

    // 5. COMMIT.
    await client.query("COMMIT");

    result = {
      executed_at: new Date().toISOString(),
      campaign_id: CAMPAIGN_ID,
      step: 2,
      operator_approval_scope: "single campaign id only — no other rows touched",
      before_row_full: before,
      after_row_full: after,
      tx_assertions: txAssertions,
      tx_assertions_pass: allPass,
      counts: {
        recipients_before: recipBefore.rows[0].n,
        recipients_after: recipAfter.rows[0].n,
        recipients_unchanged: recipBefore.rows[0].n === recipAfter.rows[0].n,
        outbound_log_before: obBefore.rows[0].n,
        outbound_log_after: obAfter.rows[0].n,
        outbound_log_unchanged: obBefore.rows[0].n === obAfter.rows[0].n,
      },
      mutations_observed: {
        status: { before: before.status, after: after.status },
        kill_switch: { before: before.kill_switch, after: after.kill_switch },
        updated_at: {
          before: before.updated_at,
          after: after.updated_at,
          advanced: new Date(after.updated_at).getTime() >
            new Date(before.updated_at).getTime(),
        },
      },
      unchanged_fields_held: unchangedDelta,
      all_unchanged_fields_held: allUnchangedHeld,
      execution_status_unchanged: before.execution_status === after.execution_status,
      committed: true,
    };

    writeFileSync(RESULT_PATH, JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {}
    console.error(err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
