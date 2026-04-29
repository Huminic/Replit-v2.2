/**
 * STEP 3 — execute the operator-approved full Serra Honda conversations
 * cleanup.
 *
 * Operator standing rule (decisions.md 2026-04-26):
 *   only real customer data and real users need to be preserved.
 * Operator clarification (2026-04-26):
 *   pre-launch Serra Honda has no real customer conversations — all
 *   conversation rows are test/dev/seed artifacts and are deletable.
 *
 * Approval is contingent on Step 1's preview matching live state when
 * this script runs. The script:
 *
 *   1. Loads the Step 1 preview JSON; refuses to run if
 *      preview.preview_assertions_pass !== true.
 *   2. Inside a transaction:
 *        a. Re-resolve the Serra Honda org row by id; refuse if slug !=
 *           "serra-honda".
 *        b. Snapshot the conversations row count (must match preview).
 *        c. Snapshot the cascade-target message count (must match preview).
 *        d. Snapshot the global+org users count (must match preview).
 *        e. Lock the conversation set FOR UPDATE so nothing slides in.
 *        f. DELETE FROM conversations WHERE organization_id = $1
 *           RETURNING id.
 *        g. Verify rowCount === preview.rows_count.
 *        h. Re-snapshot conversations count (must be 0 for org).
 *        i. Re-snapshot messages count for the deleted ids (must be 0;
 *           cascade verified).
 *        j. Re-snapshot users count (global+org). MUST be unchanged.
 *      COMMIT.
 *   3. Write full-serra-honda-delete-result-2026-04-26.json with all
 *      before/after counts and the full set of deleted ids.
 *
 * On any assertion failure: ROLLBACK and exit non-zero.
 *
 * Run: `cd nexxus2.2_replit && npx tsx evidence/orphan-teambox-2026-04-26/full-serra-honda-delete-execute.ts`
 */
import "dotenv/config";
import pg from "pg";
import { writeFileSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SERRA_HONDA_ORG_ID = "24d64f99-ba04-4b43-af35-fd06f555ac86";
const PREVIEW_PATH = resolve(
  __dirname,
  "full-serra-honda-delete-preview-2026-04-26.json",
);
const RESULT_PATH = resolve(
  __dirname,
  "full-serra-honda-delete-result-2026-04-26.json",
);

async function main() {
  // Hard-coded scope check.
  if (SERRA_HONDA_ORG_ID !== "24d64f99-ba04-4b43-af35-fd06f555ac86") {
    throw new Error("Refused: org id outside operator approval scope");
  }

  // Load preview.
  const preview = JSON.parse(readFileSync(PREVIEW_PATH, "utf-8"));
  if (preview.preview_assertions_pass !== true) {
    throw new Error("Refused: Step 1 preview did not pass all assertions");
  }
  if (preview.org?.id !== SERRA_HONDA_ORG_ID) {
    throw new Error(
      `Refused: preview org id (${preview.org?.id}) does not match approved id (${SERRA_HONDA_ORG_ID})`,
    );
  }
  const expectedRowCount: number = preview.rows_count;
  const expectedMessagesCascade: number = preview.messages_cascade_count;
  const expectedUsersGlobal: number = preview.users_table_snapshot.global_count;
  const expectedUsersOrg: number = preview.users_table_snapshot.serra_honda_count;
  const expectedUserSampleIds: string[] = (preview.users_table_snapshot.sample_ids || []).map(
    (u: any) => u.id,
  );

  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // a. Re-resolve org row.
    const orgRes = await client.query(
      "SELECT id, slug, name FROM organizations WHERE id = $1",
      [SERRA_HONDA_ORG_ID],
    );
    if (orgRes.rows.length !== 1 || orgRes.rows[0].slug !== "serra-honda") {
      await client.query("ROLLBACK");
      throw new Error(
        `In-tx org resolve failed — expected slug 'serra-honda', got '${orgRes.rows[0]?.slug ?? "<no row>"}'`,
      );
    }

    // b. Conversation row count snapshot.
    const convCountRes = await client.query(
      "SELECT count(*)::int AS n FROM conversations WHERE organization_id = $1",
      [SERRA_HONDA_ORG_ID],
    );
    const convBefore = convCountRes.rows[0].n;

    // c. Cascade-target message count snapshot.
    const msgCountRes = await client.query(
      `
      SELECT count(*)::int AS n
      FROM messages m
      JOIN conversations c ON c.id = m.conversation_id
      WHERE c.organization_id = $1
      `,
      [SERRA_HONDA_ORG_ID],
    );
    const msgBefore = msgCountRes.rows[0].n;

    // d. Users count snapshots (global + org).
    const usersGlobalBeforeRes = await client.query(
      "SELECT count(*)::int AS n FROM users",
    );
    const usersOrgBeforeRes = await client.query(
      "SELECT count(*)::int AS n FROM users WHERE organization_id = $1",
      [SERRA_HONDA_ORG_ID],
    );
    const usersGlobalBefore = usersGlobalBeforeRes.rows[0].n;
    const usersOrgBefore = usersOrgBeforeRes.rows[0].n;

    // e. Lock the conversation set FOR UPDATE so nothing slides in or
    //    leaves between our snapshot and the DELETE.
    const lockedRes = await client.query(
      "SELECT id FROM conversations WHERE organization_id = $1 ORDER BY id FOR UPDATE",
      [SERRA_HONDA_ORG_ID],
    );
    const lockedIds = lockedRes.rows.map((r: any) => r.id as string);

    // Pre-DELETE assertions.
    const preAssertions = {
      conv_before_matches_preview: convBefore === expectedRowCount,
      msg_before_matches_preview: msgBefore === expectedMessagesCascade,
      users_global_matches_preview: usersGlobalBefore === expectedUsersGlobal,
      users_org_matches_preview: usersOrgBefore === expectedUsersOrg,
      locked_count_matches_preview: lockedIds.length === expectedRowCount,
    };
    if (!Object.values(preAssertions).every((v) => v === true)) {
      await client.query("ROLLBACK");
      throw new Error(
        `Pre-DELETE assertion failure — ROLLBACK. ${JSON.stringify(preAssertions)}`,
      );
    }

    // f. The single allowed mutation.
    const delRes = await client.query(
      "DELETE FROM conversations WHERE organization_id = $1 RETURNING id",
      [SERRA_HONDA_ORG_ID],
    );
    const deletedIds = delRes.rows.map((r: any) => r.id as string);

    // g. rowCount check.
    if (delRes.rowCount !== expectedRowCount) {
      await client.query("ROLLBACK");
      throw new Error(
        `DELETE rowCount=${delRes.rowCount} != expected ${expectedRowCount}; ROLLBACK`,
      );
    }

    // h. Conversations-after must be 0 for org.
    const convAfterRes = await client.query(
      "SELECT count(*)::int AS n FROM conversations WHERE organization_id = $1",
      [SERRA_HONDA_ORG_ID],
    );
    const convAfter = convAfterRes.rows[0].n;
    if (convAfter !== 0) {
      await client.query("ROLLBACK");
      throw new Error(
        `Conversations remaining after DELETE: ${convAfter}; ROLLBACK`,
      );
    }

    // i. Cascade-verify: messages for the deleted ids must now be 0.
    const msgRemainRes = await client.query(
      "SELECT count(*)::int AS n FROM messages WHERE conversation_id = ANY($1::uuid[])",
      [deletedIds],
    );
    const msgsRemaining = msgRemainRes.rows[0].n;
    if (msgsRemaining !== 0) {
      await client.query("ROLLBACK");
      throw new Error(
        `Cascade incomplete — ${msgsRemaining} messages still reference deleted conversations; ROLLBACK`,
      );
    }
    // Also report total messages removed for any of these conversations
    // by computing (msgBefore - 0). The preview cascade count IS our
    // expected value.

    // j. Users count must be unchanged.
    const usersGlobalAfterRes = await client.query(
      "SELECT count(*)::int AS n FROM users",
    );
    const usersOrgAfterRes = await client.query(
      "SELECT count(*)::int AS n FROM users WHERE organization_id = $1",
      [SERRA_HONDA_ORG_ID],
    );
    const usersGlobalAfter = usersGlobalAfterRes.rows[0].n;
    const usersOrgAfter = usersOrgAfterRes.rows[0].n;
    if (
      usersGlobalAfter !== usersGlobalBefore ||
      usersOrgAfter !== usersOrgBefore
    ) {
      await client.query("ROLLBACK");
      throw new Error(
        `Users count changed during DELETE — global ${usersGlobalBefore}->${usersGlobalAfter}, org ${usersOrgBefore}->${usersOrgAfter}; ROLLBACK`,
      );
    }
    // Spot-check that the sample user ids from the preview still exist.
    let sampleUsersStillExist = true;
    if (expectedUserSampleIds.length > 0) {
      const sampleRes = await client.query(
        "SELECT count(*)::int AS n FROM users WHERE id = ANY($1::uuid[])",
        [expectedUserSampleIds],
      );
      sampleUsersStillExist = sampleRes.rows[0].n === expectedUserSampleIds.length;
      if (!sampleUsersStillExist) {
        await client.query("ROLLBACK");
        throw new Error(
          `Sample user spot-check failed — expected ${expectedUserSampleIds.length} ids to still exist, found ${sampleRes.rows[0].n}; ROLLBACK`,
        );
      }
    }

    // COMMIT.
    await client.query("COMMIT");

    const out = {
      executed_at: new Date().toISOString(),
      step: 3,
      operator_standing_rule:
        "Only real customer data and real users need to be preserved. Pre-launch Serra Honda conversations are all test/dev/seed; deletable.",
      operator_approval_scope:
        "Serra Honda org only (24d64f99-ba04-4b43-af35-fd06f555ac86).",
      org: orgRes.rows[0],
      preview_path: PREVIEW_PATH,
      pre_assertions: preAssertions,
      counts: {
        conversations_before: convBefore,
        conversations_after: convAfter,
        conversations_deleted: deletedIds.length,
        messages_cascade_target_before: msgBefore,
        messages_remaining_for_deleted_ids: msgsRemaining,
        messages_cascade_deleted: msgBefore - msgsRemaining,
        users_global_before: usersGlobalBefore,
        users_global_after: usersGlobalAfter,
        users_global_unchanged: usersGlobalBefore === usersGlobalAfter,
        users_org_before: usersOrgBefore,
        users_org_after: usersOrgAfter,
        users_org_unchanged: usersOrgBefore === usersOrgAfter,
        users_sample_spot_check_still_exist: sampleUsersStillExist,
      },
      deleted_conversation_ids: deletedIds,
      committed: true,
    };
    writeFileSync(RESULT_PATH, JSON.stringify(out, null, 2));

    // Compact summary on stdout.
    const compact = {
      executed_at: out.executed_at,
      org: out.org,
      conversations_deleted: out.counts.conversations_deleted,
      messages_cascade_deleted: out.counts.messages_cascade_deleted,
      users_global_unchanged: out.counts.users_global_unchanged,
      users_org_unchanged: out.counts.users_org_unchanged,
      users_sample_spot_check_still_exist: out.counts.users_sample_spot_check_still_exist,
      conversations_after: out.counts.conversations_after,
      messages_remaining_for_deleted_ids: out.counts.messages_remaining_for_deleted_ids,
      committed: out.committed,
      result_path: RESULT_PATH,
    };
    console.log(JSON.stringify(compact, null, 2));
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
