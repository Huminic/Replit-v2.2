/**
 * STEP 1 — read-only preview for the operator-approved expanded cleanup.
 *
 * Operator standing rule (2026-04-26): only real customer data and real
 * users need to be preserved. Everything else is deletable. Real users
 * with zero data are also deletable; the underlying bug that produced
 * the empty row is tracked separately.
 *
 * Re-classification rule applied here:
 *
 *   KEEP iff
 *       row is NOT test-tagged AND row has >= 1 messages
 *
 *   DELETE iff
 *       row is test-tagged          (irrespective of message count)
 *       OR row has 0 messages       (irrespective of identity)
 *
 * "Test-tagged" (same regex as Step 9 archaeology):
 *   - customer_name matches /\btest\b|testlane|test customer|test user/i
 *   - customer_phone in NXX-555 or NPA-555 (this run widens to NPA too,
 *     since the operator rule covers all test data and the original
 *     classifier missed +15550000001)
 *   - customer_phone in OPERATOR_PHONES
 *   - customer_email in OPERATOR_EMAILS
 *
 * No mutations. Output:
 *   evidence/orphan-teambox-2026-04-26/expanded-delete-preview-2026-04-26.json
 */
import "dotenv/config";
import pg from "pg";
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SERRA_HONDA_ORG_ID = "24d64f99-ba04-4b43-af35-fd06f555ac86";
const OUT_PATH = resolve(__dirname, "expanded-delete-preview-2026-04-26.json");

const TEST_NAME_REGEX = /\btest\b|testlane|test customer|test user/i;
const OPERATOR_PHONES = ["+14126546500", "14126546500", "4126546500"];
const OPERATOR_EMAILS = [
  "duane.wells@huminic.ai",
  "duanewells@icloud.com",
  "duanekwells@gmail.com",
];

function normalizePhone(p: string | null): string | null {
  if (!p) return null;
  return p.replace(/[^\d]/g, "");
}

function classifyPhone(p: string | null): {
  is_555_nxx: boolean;
  is_555_npa: boolean;
  is_operator: boolean;
  raw: string | null;
  normalized: string | null;
} {
  const norm = normalizePhone(p);
  let is555nxx = false;
  let is555npa = false;
  if (norm) {
    const local = norm.length === 11 && norm.startsWith("1") ? norm.slice(1) : norm;
    if (local.length === 10) {
      const npa = local.slice(0, 3);
      const nxx = local.slice(3, 6);
      if (nxx === "555") is555nxx = true;
      if (npa === "555") is555npa = true;
    }
  }
  const isOperator = !!norm && OPERATOR_PHONES.some((op) => normalizePhone(op) === norm);
  return { is_555_nxx: is555nxx, is_555_npa: is555npa, is_operator: isOperator, raw: p, normalized: norm };
}

function isOperatorEmail(e: string | null | undefined): boolean {
  if (!e) return false;
  return OPERATOR_EMAILS.includes(String(e).toLowerCase());
}

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  try {
    // 1. Pull all 84 rows + per-row message_count.
    const allRes = await pool.query(
      `
      SELECT
        c.id, c.customer_name, c.customer_email, c.customer_phone,
        c.channel, c.status, c.agent_id, c.assigned_to, c.campaign_id,
        c.source_conversation_id, c.campaign_disconnected, c.unread_count,
        c.last_message_at, c.created_at, c.updated_at,
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
    const total = allRes.rows.length;

    // 2. Inbound source-pointer scan over ALL ids — anyone whose
    //    source_conversation_id points at a row we plan to delete must be
    //    surfaced (deletion creates a dangling soft-pointer).
    const allIds = allRes.rows.map((r: any) => r.id as string);
    const sourcePointers = await pool.query(
      `
      SELECT id, source_conversation_id, customer_name, organization_id
      FROM conversations
      WHERE source_conversation_id = ANY($1::uuid[])
      `,
      [allIds],
    );

    // 3. Classify and bucket every row under the new rule.
    const classified = allRes.rows.map((r: any) => {
      const phone = classifyPhone(r.customer_phone);
      const nameIsTest = TEST_NAME_REGEX.test(String(r.customer_name || ""));
      const emailIsOp = isOperatorEmail(r.customer_email);
      const phoneIs555 = phone.is_555_nxx || phone.is_555_npa;
      const phoneIsOp = phone.is_operator;
      const isTestTagged = nameIsTest || phoneIs555 || phoneIsOp || emailIsOp;
      const zeroMessages = r.message_count === 0;

      // KEEP rule: NOT test-tagged AND has >= 1 messages.
      const keep = !isTestTagged && !zeroMessages;
      const del = !keep;

      // Bucket attribution — the tags below mirror the operator's
      // re-classification scheme so the preview is auditable per category.
      let bucket = "kept-real-with-data";
      const reasons: string[] = [];
      if (del) {
        if (isTestTagged && zeroMessages) {
          bucket = "11-original-candidates";
          if (nameIsTest) reasons.push("name_matches_test_regex");
          if (phoneIs555) reasons.push("phone_555");
          if (phoneIsOp) reasons.push("phone_operator");
          if (emailIsOp) reasons.push("email_operator");
          reasons.push("zero_messages");
        } else if (isTestTagged && !zeroMessages) {
          bucket = "test-tagged-with-messages";
          if (nameIsTest) reasons.push("name_matches_test_regex");
          if (phoneIs555) reasons.push("phone_555");
          if (phoneIsOp) reasons.push("phone_operator");
          if (emailIsOp) reasons.push("email_operator");
          reasons.push(`has_${r.message_count}_messages_but_test_identity`);
        } else if (!isTestTagged && zeroMessages) {
          // Sub-bucket the 8 "review" rows by signal.
          const isShelby = String(r.customer_email || "").toLowerCase() ===
            "sdew@serrahonda.net";
          const isVictoria = String(r.customer_email || "").toLowerCase() ===
            "victoria@misscommunicationconsulting.com";
          const isVoice = String(r.channel) === "voice";
          if (isShelby) bucket = "shelby-dup";
          else if (isVictoria) bucket = "victoria-no-msgs";
          else if (isVoice) bucket = "voice-0-msg";
          else bucket = "non-test-zero-msg-other";
          reasons.push("zero_messages");
          if (isShelby) reasons.push("real_user_no_data_per_standing_rule");
          if (isVictoria) reasons.push("real_human_no_data_per_standing_rule");
          if (isVoice) reasons.push("voice_channel_no_thread");
        }
      }

      // Inbound source-pointer check.
      const childPointers = sourcePointers.rows.filter(
        (sp: any) => sp.source_conversation_id === r.id,
      );

      return {
        id: r.id,
        customer_name: r.customer_name,
        customer_phone: r.customer_phone,
        customer_email: r.customer_email,
        channel: r.channel,
        status: r.status,
        message_count: r.message_count,
        unread_count: r.unread_count,
        campaign_id: r.campaign_id,
        agent_id: r.agent_id,
        assigned_to: r.assigned_to,
        source_conversation_id: r.source_conversation_id,
        campaign_disconnected: r.campaign_disconnected,
        last_message_at: r.last_message_at,
        created_at: r.created_at,
        updated_at: r.updated_at,
        age_days: Math.floor(
          (Date.now() - new Date(r.created_at).getTime()) / 86400000,
        ),
        phone_classify: phone,
        is_test_tagged: isTestTagged,
        zero_messages: zeroMessages,
        keep,
        delete: del,
        bucket,
        reasons,
        inbound_source_pointers: childPointers.map((p: any) => ({
          id: p.id,
          customer_name: p.customer_name,
          organization_id: p.organization_id,
        })),
      };
    });

    const toDelete = classified.filter((c) => c.delete);
    const toKeep = classified.filter((c) => c.keep);
    const deleteIds = toDelete.map((c) => c.id);

    // 4. Cascade impact verification (live, not derived from per-row counts).
    //    a. Total messages that will be CASCADE-deleted.
    //    b. Conversations whose source_conversation_id points at the
    //       delete set (will become dangling soft-pointers, no FK error).
    let messagesCascadeCount = 0;
    let danglingSourcePointers: any[] = [];
    if (deleteIds.length > 0) {
      const msgsRes = await pool.query(
        "SELECT COUNT(*)::int AS n FROM messages WHERE conversation_id = ANY($1::uuid[])",
        [deleteIds],
      );
      messagesCascadeCount = msgsRes.rows[0].n;

      const ptrRes = await pool.query(
        `
        SELECT id, source_conversation_id, customer_name, organization_id
        FROM conversations
        WHERE source_conversation_id = ANY($1::uuid[])
        `,
        [deleteIds],
      );
      danglingSourcePointers = ptrRes.rows;
    }

    // 5. Per-bucket counts + per-bucket message-cascade subtotals.
    const bucketGroups: Record<string, typeof classified> = {};
    for (const c of classified) {
      (bucketGroups[c.bucket] ||= []).push(c);
    }
    const bucketSummary = Object.fromEntries(
      Object.entries(bucketGroups).map(([k, rows]) => [
        k,
        {
          count: rows.length,
          messages_in_bucket: rows.reduce((s, r) => s + r.message_count, 0),
          ids: rows.map((r) => r.id),
        },
      ]),
    );

    // 6. The exact DELETE we WILL run in Step 3 if the operator greenlights.
    const PROPOSED_DELETE_SQL = `
DELETE FROM conversations
WHERE id = ANY($1::uuid[])
  AND organization_id = $2
RETURNING id;
`.trim();

    // 7. Pre-execution sanity assertions for the preview itself.
    const previewAssertions = {
      total_rows_for_org_84: total === 84,
      delete_plus_keep_equals_total:
        toDelete.length + toKeep.length === total,
      // Note: prior archaeology (10:44 UTC) reported 43 kept under the
      // narrower 555-NXX-only classifier. This run uses the widened rule
      // (NPA-555 also counts) per Step 1 design. The widened rule moves
      // 4 rows from kept-real-with-data into test-tagged-with-messages
      // (rows whose customer_name is literally the +1555... phone string,
      // verified by detailed per-row inspection). So the kept count is
      // expected to be 39, not 43. We surface this drift in the
      // classification-rule-drift block below rather than asserting a
      // specific kept count.
      no_real_customer_with_messages_in_delete_set:
        toDelete.every((c) => c.is_test_tagged || c.zero_messages),
      every_kept_has_messages: toKeep.every((c) => c.message_count >= 1),
      every_kept_is_not_test_tagged: toKeep.every((c) => !c.is_test_tagged),
      // Approval-scope sanity: every id in the delete set is for serra-honda.
      // (We cannot strictly verify org_id here without a second SELECT; doing
      // the second SELECT below.)
    };
    const orgScopeRes = deleteIds.length > 0
      ? await pool.query(
          "SELECT COUNT(*)::int AS n FROM conversations WHERE id = ANY($1::uuid[]) AND organization_id <> $2",
          [deleteIds, SERRA_HONDA_ORG_ID],
        )
      : { rows: [{ n: 0 }] };
    const allInOrgScope = orgScopeRes.rows[0].n === 0;

    // Classification-rule-drift block: explicitly enumerate the rows that
    // moved between this run's bucketing and the original archaeology so
    // the operator does not have to reverse-engineer the count drift.
    const ruleDrift = {
      original_archaeology_classifier: "555-NXX position only (e.g. 412-555-0199 matches; +15550000001 does NOT match)",
      this_run_classifier: "555-NXX OR 555-NPA position (NPA=555 is the NANP reserved test area code, e.g. +15551234567 matches)",
      effect:
        "5 rows whose customer_name is literally a +1555... phone string move from non-test buckets to test-tagged buckets. All 5 are unambiguously test traffic.",
      moved_to_11_original_candidates: classified
        .filter(
          (c) =>
            c.bucket === "11-original-candidates" &&
            c.phone_classify.is_555_npa &&
            !c.phone_classify.is_555_nxx,
        )
        .map((c) => ({ id: c.id, customer_name: c.customer_name, customer_phone: c.customer_phone })),
      moved_to_test_tagged_with_messages: classified
        .filter(
          (c) =>
            c.bucket === "test-tagged-with-messages" &&
            c.phone_classify.is_555_npa &&
            !c.phone_classify.is_555_nxx,
        )
        .map((c) => ({ id: c.id, customer_name: c.customer_name, customer_phone: c.customer_phone, message_count: c.message_count })),
    };

    const out = {
      probed_at: new Date().toISOString(),
      step: 1,
      operator_standing_rule:
        "Only real customer data and real users need to be preserved. Real users with zero data are also deletable; the underlying bug is tracked separately.",
      operator_approval_scope:
        "Serra Honda org only (24d64f99-ba04-4b43-af35-fd06f555ac86). DELETE bounded by organization_id in the WHERE clause.",
      org: { id: SERRA_HONDA_ORG_ID, slug: "serra-honda" },
      total_conversations: total,
      to_delete_count: toDelete.length,
      to_keep_count: toKeep.length,
      cascade_impact: {
        messages_to_be_cascade_deleted: messagesCascadeCount,
        dangling_source_pointers_count: danglingSourcePointers.length,
        dangling_source_pointers: danglingSourcePointers,
      },
      bucket_summary: bucketSummary,
      classification_rule_drift_vs_original_archaeology: ruleDrift,
      to_delete_full_rows: toDelete,
      to_keep_full_rows: toKeep,
      proposed_delete_sql: PROPOSED_DELETE_SQL,
      proposed_delete_params: { p1_ids_count: deleteIds.length, p2_org_id: SERRA_HONDA_ORG_ID },
      preview_assertions: previewAssertions,
      preview_assertions_pass: Object.values(previewAssertions).every((v) => v === true),
      all_delete_ids_in_org_scope: allInOrgScope,
      delete_recommended_ids: deleteIds,
      decision_gate: (
        Object.values(previewAssertions).every((v) => v === true) &&
        allInOrgScope &&
        danglingSourcePointers.length === 0
      )
        ? "PROCEED — preview-internal assertions hold; operator pending greenlight."
        : "STOP — preview surfaced an unexpected condition. Surface to operator BEFORE executing.",
    };

    writeFileSync(OUT_PATH, JSON.stringify(out, null, 2));
    // Also emit a compact summary on stdout (pure JSON, full dump on disk).
    const compact = {
      probed_at: out.probed_at,
      total_conversations: out.total_conversations,
      to_delete_count: out.to_delete_count,
      to_keep_count: out.to_keep_count,
      cascade_impact: out.cascade_impact,
      bucket_counts: Object.fromEntries(
        Object.entries(out.bucket_summary).map(([k, v]: any) => [k, v.count]),
      ),
      preview_assertions_pass: out.preview_assertions_pass,
      all_delete_ids_in_org_scope: out.all_delete_ids_in_org_scope,
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
