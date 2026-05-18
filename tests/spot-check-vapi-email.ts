/**
 * Spot-check: VAPI inbound + lead-notification emails per org, last 7 days.
 * Read-only. Uses raw pg client to avoid the storage-layer hang from previous probes.
 */
import "dotenv/config";
import { Client } from "pg";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }
  const c = new Client({ connectionString: url });
  await c.connect();

  // 1. VAPI inbound per org, last 7 days + last call timestamp
  const vapi = await c.query(`
    SELECT o.slug,
           COUNT(*) FILTER (WHERE al.action='vapi_call_received' AND al.created_at > NOW() - INTERVAL '7 days') AS calls_7d,
           MAX(al.created_at) FILTER (WHERE al.action='vapi_call_received') AS last_call_at
    FROM organizations o
    LEFT JOIN activity_log al ON al.organization_id = o.id
    WHERE o.slug IN ('serra-honda','serra-nissan','tony-serra-ford','hyundai-of-columbia','ford-of-columbia')
    GROUP BY o.slug
    ORDER BY o.slug
  `);
  console.log("\n=== VAPI inbound (last 7d + last-ever) ===");
  for (const r of vapi.rows) {
    console.log(`  ${r.slug.padEnd(22)} 7d=${String(r.calls_7d).padStart(4)}  last=${r.last_call_at ? new Date(r.last_call_at).toISOString() : '(never)'}`);
  }

  // 2. Lead-notification email sends per org, last 7 days
  const emailNotif = await c.query(`
    SELECT o.slug,
           COUNT(*) FILTER (WHERE ob.channel='email' AND ob.status='sent' AND ob.created_at > NOW() - INTERVAL '7 days') AS emails_sent_7d,
           COUNT(*) FILTER (WHERE ob.channel='email' AND ob.status='failed' AND ob.created_at > NOW() - INTERVAL '7 days') AS emails_failed_7d,
           MAX(ob.created_at) FILTER (WHERE ob.channel='email' AND ob.status='sent') AS last_email_at
    FROM organizations o
    LEFT JOIN outbound_log ob ON ob.organization_id = o.id
    WHERE o.slug IN ('serra-honda','serra-nissan','tony-serra-ford','hyundai-of-columbia','ford-of-columbia')
    GROUP BY o.slug
    ORDER BY o.slug
  `);
  console.log("\n=== Email outbound (last 7d, all email types) ===");
  for (const r of emailNotif.rows) {
    console.log(`  ${r.slug.padEnd(22)} sent=${String(r.emails_sent_7d).padStart(4)} failed=${String(r.emails_failed_7d).padStart(4)}  last_sent=${r.last_email_at ? new Date(r.last_email_at).toISOString() : '(never)'}`);
  }

  // 3. Lead-notification activity_log fires per org (the WAY notifications are produced)
  const leadNotif = await c.query(`
    SELECT o.slug,
           COUNT(*) FILTER (WHERE al.action LIKE 'lead_notification%' AND al.created_at > NOW() - INTERVAL '7 days') AS lead_notif_7d,
           COUNT(*) FILTER (WHERE al.action='vapi_call_received' AND (al.metadata->>'vinLeadCreated')::boolean = true AND al.created_at > NOW() - INTERVAL '7 days') AS vapi_with_vin_lead_7d,
           MAX(al.created_at) FILTER (WHERE al.action LIKE 'lead_notification%') AS last_lead_notif_at
    FROM organizations o
    LEFT JOIN activity_log al ON al.organization_id = o.id
    WHERE o.slug IN ('serra-honda','serra-nissan','tony-serra-ford','hyundai-of-columbia','ford-of-columbia')
    GROUP BY o.slug
    ORDER BY o.slug
  `);
  console.log("\n=== Lead-notification fires (activity_log) ===");
  for (const r of leadNotif.rows) {
    console.log(`  ${r.slug.padEnd(22)} lead_notif_7d=${String(r.lead_notif_7d).padStart(4)} vapi+vinLead_7d=${String(r.vapi_with_vin_lead_7d).padStart(4)}  last_lead_notif=${r.last_lead_notif_at ? new Date(r.last_lead_notif_at).toISOString() : '(never)'}`);
  }

  // 4. Sample most-recent VAPI call detail (one row) to confirm webhook still wiring correctly
  const recentCall = await c.query(`
    SELECT o.slug, al.created_at, al.metadata->>'callId' AS call_id, al.metadata->>'vinLeadCreated' AS vin_lead_created, al.metadata->>'fromPhone' AS from_phone
    FROM activity_log al
    JOIN organizations o ON al.organization_id = o.id
    WHERE al.action='vapi_call_received'
    ORDER BY al.created_at DESC
    LIMIT 5
  `);
  console.log("\n=== 5 most-recent VAPI calls (any org) ===");
  for (const r of recentCall.rows) {
    console.log(`  ${new Date(r.created_at).toISOString()}  ${r.slug.padEnd(22)} call=${(r.call_id || '').slice(0,8)} vinLead=${r.vin_lead_created} from=${r.from_phone || '(n/a)'}`);
  }

  await c.end();
}

main().catch((e) => { console.error("ERROR:", e.message); process.exit(2); });
