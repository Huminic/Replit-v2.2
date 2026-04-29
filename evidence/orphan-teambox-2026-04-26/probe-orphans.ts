/**
 * Read-only orphan-conversations archaeology for Serra Honda's TeamBox.
 *
 * Phase 1 audit observed 10+ orphan "Test Customer / 0 messages" entries.
 * This probe enumerates candidate orphans, classifies them, and counts
 * messages per row so we can separate "literally has zero messages" from
 * "test-tagged but has real messages" (the conservative-keep case).
 *
 * No mutations.
 */
import "dotenv/config";
import pg from "pg";
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SERRA_HONDA_ORG_ID = "24d64f99-ba04-4b43-af35-fd06f555ac86";
const OUT_PATH = resolve(__dirname, "orphans-output.json");

// Test patterns we treat as evidence of test-only origin.
// Conservative regex for phones — match digits only after stripping +/-/space/().
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
  is_555: boolean;
  is_operator: boolean;
  raw: string | null;
  normalized: string | null;
} {
  const norm = normalizePhone(p);
  // 555-prefix numbers (after country-code strip): treat 1XXXNNN5550YYY or
  // pure 5550YYY as test. Standard NANP test prefix is "555-01XX" within an
  // area code. We use a permissive "any 555 in the LD7 NXX-XXXX position".
  let is555 = false;
  if (norm) {
    // If 11 digits and starts with 1, take the last 10. Else take the whole.
    const local = norm.length === 11 && norm.startsWith("1") ? norm.slice(1) : norm;
    if (local.length === 10) {
      const nxx = local.slice(3, 6); // central office code
      if (nxx === "555") is555 = true;
    }
  }
  const isOperator = !!norm && OPERATOR_PHONES.some((op) => normalizePhone(op) === norm);
  return { is_555: is555, is_operator: isOperator, raw: p, normalized: norm };
}

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  try {
    // 1. Total conversations for Serra Honda (denominator).
    const totalRes = await pool.query(
      "SELECT count(*)::int AS n FROM conversations WHERE organization_id = $1",
      [SERRA_HONDA_ORG_ID],
    );
    const total = totalRes.rows[0].n;

    // 2. All rows with their derived message_count (LEFT JOIN messages),
    //    plus enough columns to classify. We keep the result set in memory
    //    and tag client-side so the regex/normalization rules are
    //    transparent and auditable.
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

    // 3. Inbound soft-pointer scan: any conversation whose source_conversation_id
    //    points at one of the candidate orphans must be flagged (deleting the
    //    parent would dangle the pointer).
    const allIds = allRes.rows.map((r: any) => r.id as string);
    const sourcePointers = await pool.query(
      `
      SELECT id, source_conversation_id, customer_name, organization_id
      FROM conversations
      WHERE source_conversation_id = ANY($1::uuid[])
      `,
      [allIds],
    );

    // 4. Classify every row.
    const candidates = allRes.rows.map((r: any) => {
      const phone = classifyPhone(r.customer_phone);
      const nameIsTest = TEST_NAME_REGEX.test(String(r.customer_name || ""));
      const emailIsOperator =
        !!r.customer_email && OPERATOR_EMAILS.includes(String(r.customer_email).toLowerCase());
      const zeroMessages = r.message_count === 0;

      // Inbound source-pointer check.
      const childPointers = sourcePointers.rows.filter(
        (sp: any) => sp.source_conversation_id === r.id,
      );

      const tags: string[] = [];
      if (nameIsTest) tags.push("name_matches_test_regex");
      if (phone.is_555) tags.push("phone_555_prefix");
      if (phone.is_operator) tags.push("phone_operator");
      if (emailIsOperator) tags.push("email_operator");
      if (zeroMessages) tags.push("zero_messages");
      if (childPointers.length > 0) tags.push(`has_${childPointers.length}_inbound_source_pointer`);

      const looksLikeTest =
        nameIsTest || phone.is_555 || phone.is_operator || emailIsOperator;

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
        age_days: Math.floor(
          (Date.now() - new Date(r.created_at).getTime()) / 86400000,
        ),
        phone_classify: phone,
        looks_like_test: looksLikeTest,
        zero_messages: zeroMessages,
        inbound_source_pointers: childPointers.map((p: any) => ({
          id: p.id,
          customer_name: p.customer_name,
          organization_id: p.organization_id,
        })),
        tags,
      };
    });

    // 5. Bucket the candidates per the operator's brief.
    const buckets = {
      "delete-recommended (test AND zero messages, no inbound pointers)":
        candidates.filter(
          (c) =>
            c.looks_like_test &&
            c.zero_messages &&
            c.inbound_source_pointers.length === 0,
        ),
      "test-tagged BUT has messages (conservative HOLD)":
        candidates.filter((c) => c.looks_like_test && !c.zero_messages),
      "zero messages BUT not test-tagged (genuine empty starts — review)":
        candidates.filter((c) => !c.looks_like_test && c.zero_messages),
      "test-tagged AND zero msg BUT has inbound source-pointer (HOLD)":
        candidates.filter(
          (c) =>
            c.looks_like_test &&
            c.zero_messages &&
            c.inbound_source_pointers.length > 0,
        ),
      "real-looking with messages (do not touch)": candidates.filter(
        (c) => !c.looks_like_test && !c.zero_messages,
      ),
    };

    // 6. Aggregate counts per category for top-of-report summary.
    const summary = Object.fromEntries(
      Object.entries(buckets).map(([k, v]) => [k, v.length]),
    );

    // 7. Cross-table side-effect counts for the delete-recommended set.
    const deleteSet = buckets[
      "delete-recommended (test AND zero messages, no inbound pointers)"
    ];
    const deleteIds = deleteSet.map((c) => c.id);

    let cascadeImpact: Record<string, number> = {};
    if (deleteIds.length > 0) {
      // messages — already known to be 0 per the bucket condition, but verify.
      const msgsRes = await pool.query(
        `SELECT COUNT(*)::int AS n FROM messages WHERE conversation_id = ANY($1::uuid[])`,
        [deleteIds],
      );
      // soft-pointer: how many other rows reference these as source_conversation_id?
      const ptrRes = await pool.query(
        `SELECT COUNT(*)::int AS n FROM conversations WHERE source_conversation_id = ANY($1::uuid[])`,
        [deleteIds],
      );
      cascadeImpact = {
        messages_to_be_cascade_deleted: msgsRes.rows[0].n,
        conversations_with_dangling_source_pointer_after_delete: ptrRes.rows[0].n,
      };
    }

    const out = {
      probed_at: new Date().toISOString(),
      org: { id: SERRA_HONDA_ORG_ID, slug: "serra-honda" },
      total_conversations_for_org: total,
      classification_summary: summary,
      buckets,
      delete_recommended_count: deleteSet.length,
      delete_recommended_ids: deleteIds,
      cascade_impact_for_delete_recommended: cascadeImpact,
      classifier_rules: {
        test_name_regex: TEST_NAME_REGEX.source,
        operator_phones: OPERATOR_PHONES,
        operator_emails: OPERATOR_EMAILS,
        phone_555_rule:
          "After stripping non-digits, take last 10 (NANP local). Central-office code (positions 4-6) === '555'.",
      },
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
