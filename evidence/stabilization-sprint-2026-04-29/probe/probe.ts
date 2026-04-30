import { db } from "../../../server/storage";
import { sql } from "drizzle-orm";

async function main() {
  const trigStatus = await db.execute(sql`
    SELECT
      o.name,
      o.slug,
      o.outbound_enabled AS ob,
      o.sms_enabled AS sms,
      (o.settings->>'triggersEnabled') AS trigs,
      (o.settings->>'afterHoursTriggerEnabled') AS afh,
      (o.settings->>'checkInTriggerEnabled') AS chk,
      (o.settings->>'immediateTriggerEnabled') AS imm,
      (o.settings->>'checkInDelayMinutes') AS dlay,
      (o.settings->'triggerTestPhones')::text AS phones,
      (o.settings->>'businessHoursStart') AS bhs,
      (o.settings->>'businessHoursEnd') AS bhe,
      (o.settings->>'timezone') AS tz,
      (o.settings->>'vinLeadSourceName') AS vinSrc
    FROM organizations o
    WHERE o.partner_id IS NOT NULL
    ORDER BY o.name`);
  console.log("=== ORG TRIGGER POSTURE ===");
  console.log(JSON.stringify(trigStatus.rows, null, 2));

  const lookback = await db.execute(sql`
    SELECT 
      o.name AS org,
      COUNT(*)::int AS leads_14d,
      COUNT(CASE WHEN wl.customer_phone IS NOT NULL AND wl.customer_phone != '' THEN 1 END)::int AS with_phone,
      COUNT(CASE WHEN wl.customer_email IS NOT NULL AND wl.customer_email != '' THEN 1 END)::int AS with_email,
      COUNT(CASE WHEN wl.lead_source ILIKE '%service%' THEN 1 END)::int AS service_src,
      MIN(wl.synced_at)::text AS oldest,
      MAX(wl.synced_at)::text AS newest
    FROM warehouse_leads wl
    JOIN organizations o ON wl.organization_id = o.id
    WHERE wl.synced_at >= NOW() - INTERVAL '14 days'
    GROUP BY o.name
    ORDER BY leads_14d DESC`);
  console.log("\n=== LEADS LAST 14 DAYS ===");
  console.log(JSON.stringify(lookback.rows, null, 2));

  const triggerActivity = await db.execute(sql`
    SELECT 
      o.name AS org,
      al.action,
      COUNT(*)::int AS cnt
    FROM activity_log al
    JOIN organizations o ON al.organization_id = o.id
    WHERE al.action LIKE 'trigger_%'
      AND al.created_at >= NOW() - INTERVAL '14 days'
    GROUP BY o.name, al.action
    ORDER BY o.name, al.action`);
  console.log("\n=== TRIGGER ACTIVITY 14d ===");
  console.log(JSON.stringify(triggerActivity.rows, null, 2));

  const sms14d = await db.execute(sql`
    SELECT 
      o.name AS org,
      ol.channel,
      ol.status,
      COUNT(*)::int AS cnt
    FROM outbound_log ol
    JOIN organizations o ON ol.organization_id = o.id
    WHERE ol.created_at >= NOW() - INTERVAL '14 days'
    GROUP BY o.name, ol.channel, ol.status
    ORDER BY o.name, ol.channel, ol.status`);
  console.log("\n=== OUTBOUND_LOG 14d ===");
  console.log(JSON.stringify(sms14d.rows, null, 2));

  const campaigns = await db.execute(sql`
    SELECT 
      o.name AS org,
      c.name AS campaign,
      c.department,
      c.status,
      c.created_at::text AS created,
      c.kill_switch
    FROM campaigns c
    JOIN organizations o ON c.organization_id = o.id
    WHERE c.created_at >= NOW() - INTERVAL '14 days'
    ORDER BY c.created_at DESC
    LIMIT 30`);
  console.log("\n=== CAMPAIGNS 14d ===");
  console.log(JSON.stringify(campaigns.rows, null, 2));

  const apptCount = await db.execute(sql`
    SELECT 
      o.name AS org,
      a.appointment_type,
      a.status,
      a.source,
      COUNT(*)::int AS cnt
    FROM appointments a
    JOIN organizations o ON a.organization_id = o.id
    WHERE a.created_at >= NOW() - INTERVAL '14 days'
    GROUP BY o.name, a.appointment_type, a.status, a.source
    ORDER BY o.name, a.appointment_type`);
  console.log("\n=== APPOINTMENTS 14d ===");
  console.log(JSON.stringify(apptCount.rows, null, 2));

  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
