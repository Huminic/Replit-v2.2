import { db } from "../../../server/storage";
import { sql } from "drizzle-orm";

(async () => {
  // Apply the same viability filter the production code uses (server/storage.ts lines 815-824)
  // PLUS exclude already-suppressed (followup_step = 999, e.g., booked appointment)
  // PLUS require customer_phone for SMS backfill
  const filtered = await db.execute(sql`
    SELECT 
      o.name AS org,
      COUNT(*)::int AS total_synced_14d,
      COUNT(CASE 
        WHEN wl.vin_status IS NOT NULL
          AND wl.vin_status NOT LIKE 'LOST%'
          AND wl.vin_status != 'lost'
          AND wl.vin_status NOT LIKE 'SOLD%'
          AND wl.vin_status != 'sold'
          AND wl.vin_status != 'closed-won'
          AND wl.vin_status NOT LIKE 'BAD%'
          AND wl.vin_status NOT LIKE '%DUPLICATE%'
          AND wl.vin_status NOT LIKE 'SERVICE%'
          AND wl.vin_status != 'NON_CUSTOMER_INITIATED_LEAD'
          AND wl.customer_phone IS NOT NULL AND wl.customer_phone != ''
          AND (wl.followup_step IS NULL OR wl.followup_step < 999)
        THEN 1 END)::int AS viable_with_phone,
      COUNT(CASE 
        WHEN wl.vin_status IS NOT NULL
          AND wl.vin_status NOT LIKE 'LOST%'
          AND wl.vin_status != 'lost'
          AND wl.vin_status NOT LIKE 'SOLD%'
          AND wl.vin_status != 'sold'
          AND wl.vin_status != 'closed-won'
          AND wl.vin_status NOT LIKE 'BAD%'
          AND wl.vin_status NOT LIKE '%DUPLICATE%'
          AND wl.vin_status NOT LIKE 'SERVICE%'
          AND wl.vin_status != 'NON_CUSTOMER_INITIATED_LEAD'
          AND wl.customer_email IS NOT NULL AND wl.customer_email != ''
          AND (wl.followup_step IS NULL OR wl.followup_step < 999)
        THEN 1 END)::int AS viable_with_email,
      COUNT(CASE 
        WHEN wl.vin_status LIKE 'SERVICE%' THEN 1 END)::int AS service_excluded,
      COUNT(CASE 
        WHEN wl.vin_status LIKE 'LOST%' OR wl.vin_status = 'lost' THEN 1 END)::int AS lost_excluded,
      COUNT(CASE 
        WHEN wl.vin_status LIKE 'SOLD%' OR wl.vin_status = 'sold' OR wl.vin_status = 'closed-won' THEN 1 END)::int AS sold_excluded,
      COUNT(CASE 
        WHEN wl.followup_step = 999 THEN 1 END)::int AS already_suppressed,
      COUNT(CASE 
        WHEN wl.vin_status IS NULL THEN 1 END)::int AS null_status
    FROM warehouse_leads wl
    JOIN organizations o ON wl.organization_id = o.id
    WHERE wl.synced_at >= NOW() - INTERVAL '14 days'
    GROUP BY o.name
    ORDER BY viable_with_phone DESC`);
  console.log("=== FILTERED BACKFILL CANDIDATES (viability filter applied) ===");
  console.log(JSON.stringify(filtered.rows, null, 2));

  // Show distinct vin_status values across last 14d
  const statusBreakdown = await db.execute(sql`
    SELECT vin_status, COUNT(*)::int AS cnt
    FROM warehouse_leads
    WHERE synced_at >= NOW() - INTERVAL '14 days'
    GROUP BY vin_status
    ORDER BY cnt DESC`);
  console.log("\n=== ALL vin_status values (last 14d) ===");
  console.log(JSON.stringify(statusBreakdown.rows, null, 2));

  // Sanity: count those that have already been engaged (any conversation exists for that phone in that org)
  const alreadyEngaged = await db.execute(sql`
    SELECT 
      o.name AS org,
      COUNT(DISTINCT wl.id)::int AS already_engaged
    FROM warehouse_leads wl
    JOIN organizations o ON wl.organization_id = o.id
    JOIN conversations c 
      ON c.organization_id = wl.organization_id 
      AND REGEXP_REPLACE(c.customer_phone, '[^0-9]', '', 'g') = REGEXP_REPLACE(wl.customer_phone, '[^0-9]', '', 'g')
    WHERE wl.synced_at >= NOW() - INTERVAL '14 days'
      AND wl.customer_phone IS NOT NULL AND wl.customer_phone != ''
    GROUP BY o.name`);
  console.log("\n=== Already-engaged (have a conversation) leads in last 14d ===");
  console.log(JSON.stringify(alreadyEngaged.rows, null, 2));

  process.exit(0);
})();
