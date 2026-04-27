/**
 * Trace the 2026-04-13 01:59 UTC batch send. Find every outbound_log row
 * for serra-honda channel='sms' between 01:54-02:05, plus look for any
 * adjacent campaign_recipients rows or campaign rows that fired at the
 * same time.
 *
 * Read-only.
 */
import "dotenv/config";
import pg from "pg";
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const OUT_PATH = resolve(__dirname, "batch-trace.json");
const SERRA_HONDA = "24d64f99-ba04-4b43-af35-fd06f555ac86";

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  try {
    // 1. Every outbound_log SMS row for serra-honda 2026-04-12 23:00 → 2026-04-13 03:00 UTC.
    const obRes = await pool.query(
      `
      SELECT id, organization_id, campaign_id, recipient_id, channel, status,
             blocked_reason, recipient_name, recipient_phone, sent_at, created_at,
             left(coalesce(message_content, ''), 300) AS message_preview
      FROM outbound_log
      WHERE organization_id = $1
        AND channel = 'sms'
        AND created_at >= '2026-04-12 23:00:00'::timestamp
        AND created_at <  '2026-04-13 03:00:00'::timestamp
      ORDER BY created_at ASC
      `,
      [SERRA_HONDA],
    );

    // 2. Campaigns that were active during that window.
    const campRes = await pool.query(
      `
      SELECT id, name, status, execution_status, scheduled_at,
             execution_started_at, execution_total, execution_processed,
             execution_sent, execution_failed, send_interval_seconds,
             created_at, updated_at, csv_filename,
             left(coalesce(message_template, ''), 300) AS template_preview
      FROM campaigns
      WHERE organization_id = $1
        AND (
          (execution_started_at >= '2026-04-12 23:00:00'::timestamp AND
           execution_started_at <  '2026-04-13 03:00:00'::timestamp)
          OR
          (updated_at >= '2026-04-12 23:00:00'::timestamp AND
           updated_at <  '2026-04-13 03:00:00'::timestamp)
        )
      ORDER BY created_at ASC
      `,
      [SERRA_HONDA],
    );

    // 3. campaign_recipients rows referencing the 8 phones (already done in
    //    provenance probe — repeat for completeness in this trace context).
    // Skipping repeat; cross-reference with phone-provenance.json.

    // 4. Look for any "ACTIVE_*" engagement code path. The message templates
    //    we saw said "Hi <Name>, thank you for your interest in Serra Honda.
    //    We received your inquiry and wanted to reach out." That's a lead-
    //    engagement copy, not a service-campaign template. Find any active
    //    campaign that has a matching template.
    const tplRes = await pool.query(
      `
      SELECT id, name, organization_id,
             left(coalesce(message_template, ''), 500) AS template_preview
      FROM campaigns
      WHERE message_template ILIKE '%thank you for your interest in%'
         OR message_template ILIKE '%we received your inquiry%'
      ORDER BY organization_id, created_at ASC
      `,
    );

    // Group outbound_log rows by minute for the timeline.
    const timeline: Record<string, any[]> = {};
    for (const r of obRes.rows) {
      const ts = new Date(r.created_at).toISOString().slice(0, 16);
      (timeline[ts] ||= []).push({
        time: r.created_at,
        status: r.status,
        recipient_phone: r.recipient_phone,
        recipient_name: r.recipient_name,
        campaign_id: r.campaign_id,
        blocked_reason: r.blocked_reason,
        preview: r.message_preview?.slice(0, 80),
      });
    }

    const out = {
      probed_at: new Date().toISOString(),
      window: "2026-04-12 23:00 — 2026-04-13 03:00 UTC",
      org: SERRA_HONDA,
      total_outbound_log_rows: obRes.rows.length,
      campaigns_active_in_window: campRes.rows,
      campaigns_with_engagement_template_anywhere: tplRes.rows,
      outbound_log_rows: obRes.rows,
      timeline_by_minute: timeline,
    };
    writeFileSync(OUT_PATH, JSON.stringify(out, null, 2));

    console.log(JSON.stringify({
      probed_at: out.probed_at,
      window: out.window,
      total_outbound_log_rows: out.total_outbound_log_rows,
      campaigns_active_count: campRes.rows.length,
      campaigns_with_engagement_template_count: tplRes.rows.length,
      campaigns_active_summary: campRes.rows.map((c: any) => ({
        id: c.id.slice(0, 8),
        name: c.name,
        execution_status: c.execution_status,
        execution_started_at: c.execution_started_at,
        execution_sent: c.execution_sent,
        send_interval_seconds: c.send_interval_seconds,
        template_preview: c.template_preview?.slice(0, 100),
      })),
      campaigns_with_engagement_template: tplRes.rows.map((c: any) => ({
        id: c.id.slice(0, 8),
        org: c.organization_id?.slice(0, 8),
        name: c.name,
        template: c.template_preview?.slice(0, 200),
      })),
      output_path: OUT_PATH,
    }, null, 2));
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
