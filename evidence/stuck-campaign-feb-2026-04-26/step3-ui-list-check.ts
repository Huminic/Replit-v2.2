/**
 * STEP 3 — verify what the UI list actually shows post-archive.
 *
 * The UI calls GET /api/campaigns?department=service which the server
 * resolves via storage.getCampaigns(orgId, { department: 'service' }) at
 * server/storage.ts:477-481. That query is:
 *
 *   SELECT * FROM campaigns
 *   WHERE organization_id = $1 AND department = $2;
 *
 * No status / kill_switch / archived filter — every campaign is returned.
 * Then the UI at client/src/pages/service.tsx:397 renders ALL of them
 * unconditionally (no client-side filter either).
 *
 * This script reproduces the server query exactly and reports whether
 * the archived row still appears in the result set, plus the rendered
 * status string the UI would show.
 */
import "dotenv/config";
import pg from "pg";

const SERRA_HONDA_ORG_ID = "24d64f99-ba04-4b43-af35-fd06f555ac86";
const ARCHIVED_CAMPAIGN_ID = "30267ae2-5d81-4c21-b0bf-ad96e4eb31ec";

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  try {
    // Reproduce storage.getCampaigns(orgId, { department: 'service' }).
    const res = await pool.query(
      `
      SELECT id, name, status, kill_switch, execution_status, channel,
             recipient_count, sent_count, replied_count
      FROM campaigns
      WHERE organization_id = $1
        AND department = $2
      ORDER BY created_at ASC
      `,
      [SERRA_HONDA_ORG_ID, "service"],
    );

    const archivedRow = res.rows.find((r) => r.id === ARCHIVED_CAMPAIGN_ID);

    // Status colors map from client/src/pages/service.tsx:74-80.
    const statusColors: Record<string, string> = {
      active: "bg-green-500",
      paused: "bg-amber-500",
      draft: "bg-gray-400",
      completed: "bg-blue-500",
      scheduled: "bg-purple-500",
    };

    const out = {
      probed_at: new Date().toISOString(),
      step: 3,
      query: {
        sql: "SELECT * FROM campaigns WHERE organization_id = $1 AND department = $2",
        params: [SERRA_HONDA_ORG_ID, "service"],
        result_count: res.rows.length,
      },
      archived_campaign_still_in_list: !!archivedRow,
      archived_campaign_row: archivedRow ?? null,
      ui_render_observation: archivedRow
        ? {
            displayed_status_text: String(archivedRow.status).replace(/^./, (c) => c.toUpperCase()),
            status_dot_color_class: statusColors[archivedRow.status] ?? null,
            status_dot_color_class_resolves_to_class: statusColors[archivedRow.status] !== undefined,
            note: statusColors[archivedRow.status] === undefined
              ? "MINOR UI DEFECT: campaignStatusColors has no 'archived' key — the indicator dot will be unstyled (no background color). Text shows 'Archived'. Row still appears in the list because neither server query nor UI filters by status. This is a pre-existing UX gap, not caused by the archive."
              : "Status dot color class resolves cleanly.",
          }
        : null,
      kill_switch_state_observed: archivedRow ? archivedRow.kill_switch : null,
      all_service_campaign_rows: res.rows,
    };
    console.log(JSON.stringify(out, null, 2));
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
