import { db } from "../../../server/storage";
import { sql } from "drizzle-orm";

(async () => {
  const v = await db.execute(sql`
    SELECT vin_status, COUNT(*)::int AS cnt FROM warehouse_leads 
    WHERE synced_at >= NOW() - INTERVAL '14 days'
    GROUP BY vin_status ORDER BY cnt DESC LIMIT 20`);
  console.log("=== vin_status values (last 14d) ===");
  console.log(JSON.stringify(v.rows, null, 2));

  // Are there ANY leads with lead_source containing 'service' anywhere?
  const svc = await db.execute(sql`
    SELECT COUNT(*)::int AS svc_match FROM warehouse_leads
    WHERE synced_at >= NOW() - INTERVAL '14 days'
      AND lead_source ILIKE '%service%'`);
  console.log("\n=== service-keyword in lead_source (last 14d) ===");
  console.log(JSON.stringify(svc.rows, null, 2));

  // What about vehicle_of_interest?
  const voi = await db.execute(sql`
    SELECT COUNT(*)::int AS svc_voi FROM warehouse_leads
    WHERE synced_at >= NOW() - INTERVAL '14 days'
      AND vehicle_of_interest ILIKE '%service%'`);
  console.log("\n=== service-keyword in vehicle_of_interest (last 14d) ===");
  console.log(JSON.stringify(voi.rows, null, 2));

  process.exit(0);
})();
