/**
 * Read-only DB archaeology for the "Service Reminder - February" campaign
 * flagged in the Phase 1 audit (Serra Honda, status=active, 16 recipients,
 * 0 sent, 0 replied).
 *
 * No mutations. Every query is a SELECT. Output is JSON to stdout.
 *
 * Run: `cd nexxus2.2_replit && npx tsx evidence/stuck-campaign-feb-2026-04-26/probe-stuck-campaign.ts`
 */
import "dotenv/config";
import pg from "pg";

const SERRA_HONDA_SLUG = "serra-honda";

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  try {
    // 1. Resolve Serra Honda org row.
    const orgRes = await pool.query(
      "SELECT id, name, slug, settings, sms_enabled, email_enabled, phone_enabled, outbound_enabled FROM organizations WHERE slug = $1",
      [SERRA_HONDA_SLUG],
    );
    const org = orgRes.rows[0];
    if (!org) {
      console.log(JSON.stringify({ error: "serra-honda org not found" }, null, 2));
      return;
    }

    // 2. Find the campaign(s) matching the Phase 1 audit signature.
    const camps = await pool.query(
      `
      SELECT id, name, department, status, channel, organization_id, kill_switch,
             recipient_count, sent_count, replied_count, csv_filename,
             length(message_template) AS message_template_len,
             send_interval_seconds,
             execution_status, execution_total, execution_processed,
             execution_sent, execution_failed, execution_started_at,
             scheduled_at, created_at, updated_at
      FROM campaigns
      WHERE organization_id = $1
        AND name ILIKE 'Service Reminder - February%'
      ORDER BY created_at ASC
      `,
      [org.id],
    );

    // 3. For each match, recipient counts by status + outbound_log evidence.
    const detail: any[] = [];
    for (const c of camps.rows) {
      const rcounts = await pool.query(
        `
        SELECT status, COUNT(*)::int AS n
        FROM campaign_recipients
        WHERE campaign_id = $1
        GROUP BY status
        ORDER BY status
        `,
        [c.id],
      );
      const rtotal = await pool.query(
        "SELECT COUNT(*)::int AS n FROM campaign_recipients WHERE campaign_id = $1",
        [c.id],
      );
      // Sample 3 recipient rows (no PII beyond what already lives in DB).
      const rsample = await pool.query(
        `
        SELECT id, status, sent_at, delivered_at, created_at,
               (phone IS NOT NULL) AS has_phone,
               (email IS NOT NULL) AS has_email,
               left(coalesce(phone, ''), 5) AS phone_prefix
        FROM campaign_recipients
        WHERE campaign_id = $1
        ORDER BY created_at ASC
        LIMIT 3
        `,
        [c.id],
      );

      const obByStatus = await pool.query(
        `
        SELECT status, channel, COUNT(*)::int AS n,
               MIN(created_at) AS first_at, MAX(created_at) AS last_at
        FROM outbound_log
        WHERE campaign_id = $1
        GROUP BY status, channel
        ORDER BY status, channel
        `,
        [c.id],
      );
      const obSample = await pool.query(
        `
        SELECT id, channel, status, blocked_reason, sent_at, created_at,
               (recipient_phone IS NOT NULL) AS has_phone
        FROM outbound_log
        WHERE campaign_id = $1
        ORDER BY created_at ASC
        LIMIT 5
        `,
        [c.id],
      );

      detail.push({
        campaign: c,
        recipient_total: rtotal.rows[0].n,
        recipient_status_breakdown: rcounts.rows,
        recipient_sample: rsample.rows,
        outbound_log_breakdown: obByStatus.rows,
        outbound_log_sample: obSample.rows,
      });
    }

    // 4. Cross-check: any other campaigns currently in executionStatus='scheduled'
    //    for serra-honda (so we know whether the scheduler-eligible filter is
    //    even matching anything for this org).
    const scheduled = await pool.query(
      `
      SELECT id, name, status, execution_status, scheduled_at, created_at
      FROM campaigns
      WHERE organization_id = $1
        AND execution_status = 'scheduled'
      ORDER BY scheduled_at ASC NULLS LAST
      `,
      [org.id],
    );

    // 5. Org-level outbound flags + recent outbound activity (last 30d) for
    //    serra-honda — establishes whether CommGate / outbound was on.
    const recentOutbound = await pool.query(
      `
      SELECT status, channel, COUNT(*)::int AS n
      FROM outbound_log
      WHERE organization_id = $1
        AND created_at >= now() - interval '30 days'
      GROUP BY status, channel
      ORDER BY status, channel
      `,
      [org.id],
    );

    const out = {
      probed_at: new Date().toISOString(),
      org: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        sms_enabled: org.sms_enabled,
        email_enabled: org.email_enabled,
        phone_enabled: org.phone_enabled,
        outbound_enabled: org.outbound_enabled,
        settings_keys: org.settings ? Object.keys(org.settings) : [],
      },
      matched_campaigns_count: camps.rows.length,
      matched_campaigns_detail: detail,
      other_scheduled_campaigns_for_org: scheduled.rows,
      recent_outbound_30d_serra_honda: recentOutbound.rows,
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
