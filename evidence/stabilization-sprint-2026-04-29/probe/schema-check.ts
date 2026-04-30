import { db } from "../../../server/storage";
import { sql } from "drizzle-orm";

async function main() {
  const vinstatuses = await db.execute(sql`
    SELECT vin_status, COUNT(*)::int AS cnt FROM warehouse_leads 
    WHERE synced_at >= NOW() - INTERVAL '14 days'
    GROUP BY vin_status ORDER BY cnt DESC LIMIT 30`);
  console.log("=== distinct vin_status values (last 14d) ===");
  console.log(JSON.stringify(vinstatuses.rows, null, 2));

  const sources = await db.execute(sql`
    SELECT lead_source, COUNT(*)::int AS cnt FROM warehouse_leads 
    WHERE synced_at >= NOW() - INTERVAL '14 days'
    GROUP BY lead_source ORDER BY cnt DESC LIMIT 50`);
  console.log("\n=== distinct lead_source values (last 14d) ===");
  console.log(JSON.stringify(sources.rows, null, 2));

  const dsources = await db.execute(sql`
    SELECT data_source, COUNT(*)::int AS cnt FROM warehouse_leads 
    WHERE synced_at >= NOW() - INTERVAL '14 days'
    GROUP BY data_source ORDER BY cnt DESC LIMIT 10`);
  console.log("\n=== distinct data_source values (last 14d) ===");
  console.log(JSON.stringify(dsources.rows, null, 2));

  const fsteps = await db.execute(sql`
    SELECT followup_step, COUNT(*)::int AS cnt FROM warehouse_leads 
    WHERE synced_at >= NOW() - INTERVAL '14 days'
    GROUP BY followup_step ORDER BY followup_step LIMIT 20`);
  console.log("\n=== distinct followup_step values (last 14d) ===");
  console.log(JSON.stringify(fsteps.rows, null, 2));

  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
