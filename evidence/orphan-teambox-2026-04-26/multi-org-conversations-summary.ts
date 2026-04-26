/**
 * STEP 2 — read-only multi-org conversations summary.
 *
 * For each of the 7 orgs (cage-automotive, ford-of-columbia, huminic,
 * hyundai-of-columbia, serra-honda, serra-nissan, tony-serra-ford):
 *   - count of conversations rows
 *   - count of messages rows total (across those conversations)
 *   - earliest and latest created_at of conversations
 *   - breakdown by channel
 *
 * Read-only. Used to inform the operator's decision on whether to extend
 * cleanup beyond Serra Honda. No deletion preview is generated for the
 * other orgs in this step.
 */
import "dotenv/config";
import pg from "pg";
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const OUT_PATH = resolve(
  __dirname,
  "multi-org-conversations-summary-2026-04-26.json",
);

const TARGET_SLUGS = [
  "cage-automotive",
  "ford-of-columbia",
  "huminic",
  "hyundai-of-columbia",
  "serra-honda",
  "serra-nissan",
  "tony-serra-ford",
];

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  try {
    // Resolve org rows (one query, all 7).
    const orgRes = await pool.query(
      `
      SELECT id, slug, name
      FROM organizations
      WHERE slug = ANY($1::text[])
      ORDER BY slug
      `,
      [TARGET_SLUGS],
    );
    const orgs = orgRes.rows;
    if (orgs.length !== TARGET_SLUGS.length) {
      const found = orgs.map((o: any) => o.slug);
      const missing = TARGET_SLUGS.filter((s) => !found.includes(s));
      console.error(`Warning: missing orgs: ${missing.join(", ")}`);
    }

    const perOrg: any[] = [];
    for (const o of orgs) {
      // 1. conversation count + earliest/latest created_at.
      const convStatsRes = await pool.query(
        `
        SELECT
          count(*)::int AS conversation_count,
          MIN(created_at) AS earliest_created_at,
          MAX(created_at) AS latest_created_at
        FROM conversations
        WHERE organization_id = $1
        `,
        [o.id],
      );

      // 2. Total messages across those conversations.
      const msgRes = await pool.query(
        `
        SELECT count(*)::int AS message_count
        FROM messages m
        JOIN conversations c ON c.id = m.conversation_id
        WHERE c.organization_id = $1
        `,
        [o.id],
      );

      // 3. Channel breakdown.
      const chRes = await pool.query(
        `
        SELECT channel, count(*)::int AS n
        FROM conversations
        WHERE organization_id = $1
        GROUP BY channel
        ORDER BY n DESC, channel ASC
        `,
        [o.id],
      );

      // 4. Users count for this org (proves the user table is intact even
      //    if a future cleanup deletes that org's conversations — for
      //    operator's at-a-glance review).
      const usersRes = await pool.query(
        "SELECT count(*)::int AS n FROM users WHERE organization_id = $1",
        [o.id],
      );

      perOrg.push({
        slug: o.slug,
        name: o.name,
        id: o.id,
        conversation_count: convStatsRes.rows[0].conversation_count,
        message_count: msgRes.rows[0].message_count,
        earliest_conversation_created_at: convStatsRes.rows[0].earliest_created_at,
        latest_conversation_created_at: convStatsRes.rows[0].latest_created_at,
        users_count: usersRes.rows[0].n,
        channel_breakdown: chRes.rows.reduce(
          (acc: Record<string, number>, r: any) => ((acc[r.channel] = r.n), acc),
          {},
        ),
      });
    }

    // 5. Grand totals.
    const grandTotalConversations = perOrg.reduce(
      (s, o) => s + o.conversation_count,
      0,
    );
    const grandTotalMessages = perOrg.reduce(
      (s, o) => s + o.message_count,
      0,
    );
    const grandTotalUsers = perOrg.reduce((s, o) => s + o.users_count, 0);

    const out = {
      probed_at: new Date().toISOString(),
      target_slugs: TARGET_SLUGS,
      orgs_resolved: orgs.length,
      per_org: perOrg,
      grand_totals: {
        conversations: grandTotalConversations,
        messages: grandTotalMessages,
        users: grandTotalUsers,
      },
      note:
        "Summary only. No DELETE preview generated for any org in this step. Operator decides whether to extend cleanup beyond Serra Honda based on this summary.",
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
