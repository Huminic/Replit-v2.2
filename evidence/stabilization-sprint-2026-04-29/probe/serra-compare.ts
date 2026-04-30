import { db } from "../../../server/storage";
import { sql } from "drizzle-orm";

(async () => {
  const breakdown = await db.execute(sql`
    SELECT 
      o.name AS org,
      wl.vin_status,
      COUNT(*)::int AS cnt
    FROM warehouse_leads wl
    JOIN organizations o ON wl.organization_id = o.id
    WHERE wl.synced_at >= NOW() - INTERVAL '14 days'
      AND o.name IN ('Serra Honda', 'Serra Nissan', 'Tony Serra Ford')
    GROUP BY o.name, wl.vin_status
    ORDER BY o.name, cnt DESC`);
  console.log("=== vin_status by Serra org (14d) ===");
  console.log(JSON.stringify(breakdown.rows, null, 2));

  // Conversion rate (SOLD / total) per org
  const convRate = await db.execute(sql`
    SELECT 
      o.name AS org,
      COUNT(*)::int AS total,
      COUNT(CASE WHEN wl.vin_status LIKE 'SOLD%' THEN 1 END)::int AS sold,
      COUNT(CASE WHEN wl.vin_status LIKE 'LOST%' THEN 1 END)::int AS lost,
      COUNT(CASE WHEN wl.vin_status LIKE 'ACTIVE%' THEN 1 END)::int AS active,
      COUNT(CASE WHEN wl.vin_status LIKE 'SERVICE%' THEN 1 END)::int AS service,
      COUNT(CASE WHEN wl.vin_status LIKE 'BAD%' THEN 1 END)::int AS bad
    FROM warehouse_leads wl
    JOIN organizations o ON wl.organization_id = o.id
    WHERE wl.synced_at >= NOW() - INTERVAL '14 days'
      AND o.name IN ('Serra Honda', 'Serra Nissan', 'Tony Serra Ford')
    GROUP BY o.name
    ORDER BY total DESC`);
  console.log("\n=== Conversion category rates (Serra orgs, 14d) ===");
  console.log(JSON.stringify(convRate.rows, null, 2));

  // Top lead source IDs per Serra org
  const topSources = await db.execute(sql`
    SELECT 
      o.name AS org,
      wl.lead_source,
      COUNT(*)::int AS cnt
    FROM warehouse_leads wl
    JOIN organizations o ON wl.organization_id = o.id
    WHERE wl.synced_at >= NOW() - INTERVAL '14 days'
      AND o.name IN ('Serra Honda', 'Serra Nissan', 'Tony Serra Ford')
    GROUP BY o.name, wl.lead_source
    ORDER BY o.name, cnt DESC`);
  console.log("\n=== Top lead sources by Serra org ===");
  console.log(JSON.stringify(topSources.rows.slice(0, 50), null, 2));

  // Diversity of lead sources
  const diversity = await db.execute(sql`
    SELECT 
      o.name AS org,
      COUNT(DISTINCT wl.lead_source)::int AS distinct_sources,
      COUNT(*)::int AS total_leads,
      ROUND(COUNT(*)::numeric / NULLIF(COUNT(DISTINCT wl.lead_source), 0), 2) AS avg_leads_per_source
    FROM warehouse_leads wl
    JOIN organizations o ON wl.organization_id = o.id
    WHERE wl.synced_at >= NOW() - INTERVAL '14 days'
      AND o.name IN ('Serra Honda', 'Serra Nissan', 'Tony Serra Ford')
    GROUP BY o.name
    ORDER BY total_leads DESC`);
  console.log("\n=== Lead source diversity (Serra orgs, 14d) ===");
  console.log(JSON.stringify(diversity.rows, null, 2));

  // Followup_step distribution per Serra org
  const fstep = await db.execute(sql`
    SELECT 
      o.name AS org,
      wl.followup_step,
      COUNT(*)::int AS cnt
    FROM warehouse_leads wl
    JOIN organizations o ON wl.organization_id = o.id
    WHERE wl.synced_at >= NOW() - INTERVAL '14 days'
      AND o.name IN ('Serra Honda', 'Serra Nissan', 'Tony Serra Ford')
    GROUP BY o.name, wl.followup_step
    ORDER BY o.name, wl.followup_step NULLS FIRST`);
  console.log("\n=== Followup step distribution (Serra orgs, 14d) ===");
  console.log(JSON.stringify(fstep.rows, null, 2));

  process.exit(0);
})();
