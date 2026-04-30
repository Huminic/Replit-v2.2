import { db } from "../../../server/storage";
import { sql } from "drizzle-orm";

(async () => {
  // vin_status as percent of org total
  const breakdown = await db.execute(sql`
    WITH totals AS (
      SELECT organization_id, COUNT(*) AS total
      FROM warehouse_leads
      WHERE synced_at >= NOW() - INTERVAL '14 days'
      GROUP BY organization_id
    )
    SELECT 
      o.name AS org,
      wl.vin_status,
      COUNT(*)::int AS cnt,
      ROUND(COUNT(*)::numeric * 100 / t.total, 1) AS pct
    FROM warehouse_leads wl
    JOIN organizations o ON wl.organization_id = o.id
    JOIN totals t ON t.organization_id = wl.organization_id
    WHERE wl.synced_at >= NOW() - INTERVAL '14 days'
      AND o.name IN ('Serra Honda', 'Serra Nissan', 'Tony Serra Ford')
    GROUP BY o.name, wl.vin_status, t.total
    ORDER BY o.name, cnt DESC`);
  console.log("=== vin_status % by Serra org (14d) ===");
  for (const row of breakdown.rows as any[]) {
    console.log(`${row.org.padEnd(20)} ${row.vin_status.padEnd(50)} ${String(row.cnt).padStart(4)}  ${String(row.pct).padStart(5)}%`);
  }

  // Category rollup
  const cat = await db.execute(sql`
    SELECT 
      o.name AS org,
      COUNT(*)::int AS total,
      ROUND(100.0 * COUNT(CASE WHEN wl.vin_status LIKE 'ACTIVE_NEW_LEAD' THEN 1 END) / COUNT(*), 1) AS new_pct,
      ROUND(100.0 * COUNT(CASE WHEN wl.vin_status LIKE 'ACTIVE%' THEN 1 END) / COUNT(*), 1) AS active_pct,
      ROUND(100.0 * COUNT(CASE WHEN wl.vin_status LIKE 'SOLD%' THEN 1 END) / COUNT(*), 1) AS sold_pct,
      ROUND(100.0 * COUNT(CASE WHEN wl.vin_status LIKE 'LOST%' THEN 1 END) / COUNT(*), 1) AS lost_pct,
      ROUND(100.0 * COUNT(CASE WHEN wl.vin_status LIKE 'SERVICE%' THEN 1 END) / COUNT(*), 1) AS service_pct,
      ROUND(100.0 * COUNT(CASE WHEN wl.vin_status LIKE 'BAD_DUPLICATE%' THEN 1 END) / COUNT(*), 1) AS dup_pct,
      ROUND(100.0 * COUNT(CASE WHEN wl.vin_status LIKE 'BAD%' AND wl.vin_status NOT LIKE 'BAD_DUPLICATE%' THEN 1 END) / COUNT(*), 1) AS bad_pct,
      ROUND(100.0 * COUNT(CASE WHEN wl.vin_status LIKE 'ACTIVE_WAITING%' THEN 1 END) / COUNT(*), 1) AS waiting_pct
    FROM warehouse_leads wl
    JOIN organizations o ON wl.organization_id = o.id
    WHERE wl.synced_at >= NOW() - INTERVAL '14 days'
      AND o.name IN ('Serra Honda', 'Serra Nissan', 'Tony Serra Ford')
    GROUP BY o.name
    ORDER BY total DESC`);
  console.log("\n=== Category % rollup (Serra orgs, 14d) ===");
  for (const row of cat.rows as any[]) {
    console.log(`${row.org.padEnd(20)} total=${row.total}  NEW=${row.new_pct}%  ACTIVE=${row.active_pct}%  WAITING=${row.waiting_pct}%  SOLD=${row.sold_pct}%  LOST=${row.lost_pct}%  SERVICE=${row.service_pct}%  DUP=${row.dup_pct}%  BAD=${row.bad_pct}%`);
  }

  process.exit(0);
})();
