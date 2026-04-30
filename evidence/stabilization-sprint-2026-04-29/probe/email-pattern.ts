import { db } from "../../../server/storage";
import { sql } from "drizzle-orm";

(async () => {
  // Per day, per org email count
  const perDay = await db.execute(sql`
    SELECT 
      o.name AS org,
      DATE(ol.created_at AT TIME ZONE 'America/Chicago') AS day,
      COUNT(*)::int AS sent,
      MIN(ol.created_at AT TIME ZONE 'America/Chicago')::text AS first_at,
      MAX(ol.created_at AT TIME ZONE 'America/Chicago')::text AS last_at
    FROM outbound_log ol
    JOIN organizations o ON ol.organization_id = o.id
    WHERE ol.channel = 'email' AND ol.status = 'sent'
      AND ol.created_at >= NOW() - INTERVAL '30 days'
    GROUP BY o.name, day
    ORDER BY day DESC, o.name`);
  console.log("=== Emails per day per org (30d) ===");
  for (const r of perDay.rows as any[]) {
    console.log(`${r.day} | ${r.org.padEnd(20)} | x${String(r.sent).padStart(3)} | first=${r.first_at} | last=${r.last_at}`);
  }

  // Spot recurring subject lines / message snippets
  const subjects = await db.execute(sql`
    SELECT 
      LEFT(REGEXP_REPLACE(ol.message_content, '\\s+', ' ', 'g'), 100) AS preview,
      COUNT(*)::int AS cnt,
      COUNT(DISTINCT DATE(ol.created_at AT TIME ZONE 'America/Chicago'))::int AS distinct_days,
      MIN(ol.created_at AT TIME ZONE 'America/Chicago')::text AS first_seen,
      MAX(ol.created_at AT TIME ZONE 'America/Chicago')::text AS last_seen
    FROM outbound_log ol
    WHERE ol.channel = 'email' AND ol.status = 'sent'
      AND ol.created_at >= NOW() - INTERVAL '30 days'
      AND ol.message_content IS NOT NULL
    GROUP BY preview
    ORDER BY cnt DESC
    LIMIT 30`);
  console.log("\n=== Recurring email content (30d) ===");
  for (const r of subjects.rows as any[]) {
    console.log(`x${String(r.cnt).padStart(3)} | days=${r.distinct_days} | ${r.first_seen} → ${r.last_seen}`);
    console.log(`     "${r.preview}"`);
  }

  process.exit(0);
})();
