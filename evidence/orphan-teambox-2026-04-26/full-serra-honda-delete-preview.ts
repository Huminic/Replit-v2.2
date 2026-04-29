/**
 * STEP 1 — read-only preview of the full Serra Honda conversations cleanup.
 *
 * Operator clarification (2026-04-26): pre-launch Serra Honda has no real
 * customer conversations. All 84 conversation rows are test/dev/seed
 * artifacts and are deletable. The standing rule is preserved by leaving
 * the `users` table untouched.
 *
 * No mutations here. Captures:
 *   1. All 84 (or whatever the live count is) conversation rows for the
 *      Serra Honda org — full columns, no projection.
 *   2. Per-row message_count (LEFT JOIN messages) so the cascade total is
 *      auditable per-id.
 *   3. Total cascade message count (defense-in-depth re-count).
 *   4. Soft-pointer scan — any conversation referencing one of these via
 *      source_conversation_id (declared no FK, so deletion would dangle
 *      the pointer with no DB error).
 *   5. Cross-table reconfirmation that no FK exists from tasks /
 *      appointments / outbound_log / campaign_recipients to conversations.
 *      (Live information_schema check; should match schema-recon.json.)
 *   6. Snapshot of users-table count for the Serra Honda org so we can
 *      compare before/after in Step 3 and prove the user table is
 *      untouched by the cascade.
 *   7. Exact DELETE statement that will run, with bind params.
 *   8. Decision-gate flags.
 *
 * Run: `cd nexxus2.2_replit && npx tsx evidence/orphan-teambox-2026-04-26/full-serra-honda-delete-preview.ts`
 */
import "dotenv/config";
import pg from "pg";
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SERRA_HONDA_ORG_ID = "24d64f99-ba04-4b43-af35-fd06f555ac86";
const OUT_PATH = resolve(
  __dirname,
  "full-serra-honda-delete-preview-2026-04-26.json",
);

// Exact DELETE we WILL run in Step 3.
// organization_id is in the WHERE clause as a defense-in-depth scope
// guard so the statement is impossible to misuse on other orgs even if
// someone re-runs the parameterized version with a different first arg.
const PROPOSED_DELETE_SQL = `
DELETE FROM conversations
WHERE organization_id = $1
RETURNING id;
`.trim();

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  try {
    // 1. Org sanity — refuse to operate if Serra Honda row is missing or
    //    if the slug doesn't match the id.
    const orgRes = await pool.query(
      "SELECT id, slug, name FROM organizations WHERE id = $1",
      [SERRA_HONDA_ORG_ID],
    );
    if (orgRes.rows.length !== 1 || orgRes.rows[0].slug !== "serra-honda") {
      throw new Error(
        `Refused: org id ${SERRA_HONDA_ORG_ID} did not resolve to slug 'serra-honda' (got ${
          orgRes.rows[0]?.slug ?? "<no row>"
        })`,
      );
    }

    // 2. Full row dump for every conversation in this org.
    const rowsRes = await pool.query(
      `
      SELECT
        c.id, c.customer_name, c.customer_email, c.customer_phone,
        c.channel, c.status, c.agent_id, c.assigned_to, c.campaign_id,
        c.source_conversation_id, c.campaign_disconnected, c.unread_count,
        c.last_message_at, c.escalation_sent_at, c.stale_trigger_processed_at,
        c.created_at, c.updated_at,
        COALESCE(m.message_count, 0)::int AS message_count
      FROM conversations c
      LEFT JOIN (
        SELECT conversation_id, count(*) AS message_count
        FROM messages
        GROUP BY conversation_id
      ) m ON m.conversation_id = c.id
      WHERE c.organization_id = $1
      ORDER BY c.created_at ASC
      `,
      [SERRA_HONDA_ORG_ID],
    );
    const rows = rowsRes.rows;
    const ids = rows.map((r: any) => r.id as string);

    // 3. Total cascade messages — direct re-count, not a per-row sum, so
    //    we have an independent figure to assert against in the executor.
    const totalMsgsRes = await pool.query(
      "SELECT count(*)::int AS n FROM messages WHERE conversation_id = ANY($1::uuid[])",
      [ids],
    );
    const messagesCascadeCount = totalMsgsRes.rows[0].n;
    const perRowMsgSum = rows.reduce((s: number, r: any) => s + r.message_count, 0);

    // 4. Soft-pointer scan. Any conversation row whose source_conversation_id
    //    references one of the ids in scope. Note: source_conversation_id has
    //    NO FK constraint per schema-recon.json, so deletion does not error;
    //    instead it leaves a stale pointer the application code may follow.
    //    We surface this so the operator can decide.
    const ptrRes = await pool.query(
      `
      SELECT id, source_conversation_id, customer_name, organization_id
      FROM conversations
      WHERE source_conversation_id = ANY($1::uuid[])
      `,
      [ids],
    );

    // 5. Cross-table FK re-confirmation. Should match schema-recon.json:
    //    only `messages.conversation_id` declares an FK to conversations.id.
    const fkRes = await pool.query(
      `
      SELECT tc.table_name, kcu.column_name, rc.delete_rule
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
       AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
       AND tc.table_schema = ccu.table_schema
      JOIN information_schema.referential_constraints rc
        ON tc.constraint_name = rc.constraint_name
       AND tc.table_schema = rc.constraint_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND ccu.table_name = 'conversations'
      ORDER BY tc.table_name, kcu.column_name
      `,
    );

    // 6. Users-table snapshot. The operator's primary protection rule —
    //    "USERS TABLE IS UNTOUCHED. Verify before/after." We capture both
    //    the global count and the Serra Honda-scoped count.
    const usersTotalRes = await pool.query(
      "SELECT count(*)::int AS n FROM users",
    );
    const usersOrgRes = await pool.query(
      "SELECT count(*)::int AS n FROM users WHERE organization_id = $1",
      [SERRA_HONDA_ORG_ID],
    );
    // Sample 5 user ids from the org so we can prove they remain after
    // Step 3 (Step 3 will re-fetch by these ids and confirm they exist).
    const usersSampleRes = await pool.query(
      `
      SELECT id, email, role_id, organization_id, is_active
      FROM users
      WHERE organization_id = $1
      ORDER BY created_at ASC
      LIMIT 5
      `,
      [SERRA_HONDA_ORG_ID],
    );

    // 7. Channel breakdown for the operator's at-a-glance review.
    const channelBreakdown: Record<string, number> = {};
    for (const r of rows) {
      const ch = String(r.channel);
      channelBreakdown[ch] = (channelBreakdown[ch] || 0) + 1;
    }

    // 8. Preview-internal sanity assertions.
    const previewAssertions = {
      org_resolves_to_serra_honda: orgRes.rows[0]?.slug === "serra-honda",
      rows_count_positive: rows.length > 0,
      ids_count_matches_rows: ids.length === rows.length,
      cascade_total_matches_perrow_sum: messagesCascadeCount === perRowMsgSum,
      no_dangling_source_pointers: ptrRes.rows.length === 0,
      only_messages_fk_to_conversations:
        fkRes.rows.length === 1 &&
        fkRes.rows[0].table_name === "messages" &&
        fkRes.rows[0].column_name === "conversation_id" &&
        fkRes.rows[0].delete_rule === "CASCADE",
      users_org_count_positive: usersOrgRes.rows[0].n > 0,
    };
    const allPass = Object.values(previewAssertions).every((v) => v === true);

    const out = {
      probed_at: new Date().toISOString(),
      step: 1,
      operator_standing_rule:
        "Only real customer data and real users need to be preserved. Pre-launch Serra Honda has no real customer conversations — all conversation rows are test/dev/seed artifacts and are deletable. Users table preserved.",
      operator_approval_scope:
        "Serra Honda org only (24d64f99-ba04-4b43-af35-fd06f555ac86). DELETE bounded by organization_id in the WHERE clause. Users table NOT in scope.",
      org: orgRes.rows[0],
      rows_count: rows.length,
      messages_cascade_count: messagesCascadeCount,
      messages_cascade_count_via_perrow_sum: perRowMsgSum,
      channel_breakdown: channelBreakdown,
      dangling_source_pointers_count: ptrRes.rows.length,
      dangling_source_pointers: ptrRes.rows,
      foreign_keys_pointing_at_conversations: fkRes.rows,
      users_table_snapshot: {
        global_count: usersTotalRes.rows[0].n,
        serra_honda_count: usersOrgRes.rows[0].n,
        sample_ids: usersSampleRes.rows,
      },
      proposed_delete_sql: PROPOSED_DELETE_SQL,
      proposed_delete_params: { p1_organization_id: SERRA_HONDA_ORG_ID },
      proposed_delete_expected_row_count: rows.length,
      proposed_delete_expected_messages_cascade: messagesCascadeCount,
      preview_assertions: previewAssertions,
      preview_assertions_pass: allPass,
      decision_gate: allPass
        ? "PROCEED — preview-internal assertions hold."
        : "STOP — at least one preview assertion failed.",
      full_rows: rows,
    };

    writeFileSync(OUT_PATH, JSON.stringify(out, null, 2));

    // Compact stdout summary.
    const compact = {
      probed_at: out.probed_at,
      org: out.org,
      rows_count: out.rows_count,
      messages_cascade_count: out.messages_cascade_count,
      channel_breakdown: out.channel_breakdown,
      dangling_source_pointers_count: out.dangling_source_pointers_count,
      foreign_keys_pointing_at_conversations: out.foreign_keys_pointing_at_conversations,
      users_table_snapshot_summary: {
        global_count: out.users_table_snapshot.global_count,
        serra_honda_count: out.users_table_snapshot.serra_honda_count,
      },
      preview_assertions: out.preview_assertions,
      preview_assertions_pass: out.preview_assertions_pass,
      decision_gate: out.decision_gate,
      preview_path: OUT_PATH,
    };
    console.log(JSON.stringify(compact, null, 2));
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
