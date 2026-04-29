/**
 * Read-only DB + MCP probe for I-279 archaeology.
 *
 * No mutations. Only reads:
 *   1. Distinct lead_source values for Serra Honda warehouse_leads (last 30d)
 *      with counts + which match the leadsources URL pattern.
 *   2. vin_get_lead_sources MCP call to count returned items + sample shape.
 *
 * Output: JSON to stdout for capture into the analysis doc.
 */
import "dotenv/config";
import pg from "pg";

const SERRA_HONDA_ORG_ID = "24d64f99-ba04-4b43-af35-fd06f555ac86";
const VIN_LEADSOURCE_RE = /\/leadsources\/id\/(\d+)/i;

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) { console.error("DATABASE_URL not set"); process.exit(2); }
  const pool = new pg.Pool({ connectionString: url, max: 1 });
  try {
    // Step 1: distinct leadSource values (last 30d), with count.
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const rows = await pool.query<{ lead_source: string | null; cnt: string }>(
      `SELECT lead_source, COUNT(*)::text AS cnt
       FROM warehouse_leads
       WHERE organization_id = $1
         AND COALESCE(vin_created_at, synced_at) >= $2
       GROUP BY lead_source
       ORDER BY COUNT(*) DESC`,
      [SERRA_HONDA_ORG_ID, since],
    );

    const totalLeads = rows.rows.reduce((acc, r) => acc + Number(r.cnt), 0);
    const distinctValues = rows.rows.length;
    const urlPattern = rows.rows.filter(r => r.lead_source && VIN_LEADSOURCE_RE.test(r.lead_source));
    const distinctIds = new Set<string>();
    for (const r of urlPattern) {
      const m = r.lead_source!.match(VIN_LEADSOURCE_RE);
      if (m) distinctIds.add(m[1]);
    }
    const nullCount = rows.rows.filter(r => !r.lead_source).reduce((acc, r) => acc + Number(r.cnt), 0);
    const nonUrlCount = rows.rows.filter(r => r.lead_source && !VIN_LEADSOURCE_RE.test(r.lead_source));

    console.log(JSON.stringify({
      org: "Serra Honda",
      window_days: 30,
      total_leads: totalLeads,
      distinct_lead_source_values: distinctValues,
      distinct_vin_url_ids: distinctIds.size,
      null_lead_source_count: nullCount,
      non_url_lead_source_distinct_count: nonUrlCount.length,
      sample_top_5_url_ids: Array.from(distinctIds).slice(0, 5),
      sample_top_5_full_rows: rows.rows.slice(0, 5).map(r => ({
        lead_source: r.lead_source,
        count: Number(r.cnt),
      })),
      sample_non_url_rows: nonUrlCount.slice(0, 5).map(r => ({
        lead_source: r.lead_source,
        count: Number(r.cnt),
      })),
    }, null, 2));
  } finally {
    await pool.end();
  }
}
main().catch(err => { console.error(err); process.exit(1); });
