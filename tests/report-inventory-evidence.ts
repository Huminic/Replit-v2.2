/**
 * Read-only DB query for Task #4: report inventory evidence.
 *
 * Pulls last-successful-send timestamps from outbound_log keyed by the marker
 * tag each report writes. No mutation. Output: a markdown-ish table block.
 */

import 'dotenv/config';
import { Pool } from 'pg';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const c = await pool.connect();
  try {
    const orgs = await c.query(
      `select id, name, slug from organizations where partner_id is not null or slug='cage-automotive' order by name`
    );
    console.log('## Organizations in scope');
    for (const r of orgs.rows) {
      console.log(`- ${r.name} (${r.slug || '-'}) — ${r.id}`);
    }

    const probes: Array<{ label: string; like: string }> = [
      { label: 'VAPI lead-notification (call_id-anchored)', like: '%[notification:call_%' },
      { label: 'VAPI lead-notification (any [notification:] tag)', like: '%[notification:%' },
      { label: 'ADF XML', like: '%[adf:%' },
      { label: 'Daily recap', like: '%[notification:daily_recap_%' },
      { label: 'Weekly executive report (Resend log if any)', like: '%Weekly%report%' },
      { label: 'SMS appt-intent', like: '%[notification:sms_appt%' },
      { label: '24h check-in admin email', like: '%[notification:trigger-checkin-%' },
      { label: 'Escalation (unanswered>30min)', like: '%Unanswered Message Alert%' },
      { label: 'AI Follow-Up Initiated', like: '%AI Follow-Up Initiated%' },
    ];

    console.log('\n## Last-sent per org × report (channel=email, status=sent)');
    for (const probe of probes) {
      console.log(`\n### ${probe.label}`);
      const q = await c.query(
        `select o.name as org_name, max(ol.sent_at) as last_sent, count(*) as total
         from outbound_log ol
         join organizations o on o.id = ol.organization_id
         where ol.channel='email' and ol.status='sent' and ol.message_content like $1
         group by o.name order by o.name`,
        [probe.like],
      );
      if (q.rows.length === 0) {
        console.log('(no rows)');
      } else {
        for (const r of q.rows) {
          console.log(`- ${r.org_name}: last_sent=${r.last_sent?.toISOString?.() ?? r.last_sent} total=${r.total}`);
        }
      }
    }

    // Activity-log signals — weekly report scheduler writes activity_log entries
    console.log('\n## Activity-log: weekly_report_sent / weekly_report_skipped / weekly_report_error');
    const al = await c.query(
      `select o.name as org_name, al.action, max(al.created_at) as last_at, count(*) as n
       from activity_log al
       join organizations o on o.id = al.organization_id
       where al.action in ('weekly_report_sent','weekly_report_skipped','weekly_report_error')
       group by o.name, al.action
       order by o.name, al.action`,
    );
    if (al.rows.length === 0) {
      console.log('(no rows)');
    } else {
      for (const r of al.rows) {
        console.log(`- ${r.org_name}: ${r.action} last=${r.last_at?.toISOString?.() ?? r.last_at} n=${r.n}`);
      }
    }

    // CommGate state per dealer org
    console.log('\n## CommGate state per org');
    const flags = await c.query(
      `select name, outbound_enabled, email_enabled, sms_enabled, phone_enabled, video_enabled
       from organizations
       where slug in ('serra-honda','serra-nissan','tony-serra-ford','hyundai-of-columbia','ford-of-columbia','cage-automotive')
       order by name`,
    );
    for (const r of flags.rows) {
      console.log(`- ${r.name}: outbound=${r.outbound_enabled} email=${r.email_enabled} sms=${r.sms_enabled} phone=${r.phone_enabled} video=${r.video_enabled}`);
    }

    // Daily recap + auto-greeting per-store enable flags from settings
    console.log('\n## Per-org settings: dailyRecapEnabled / dailyRecapHour / autoGreeting agents');
    const settings = await c.query(
      `select name, settings from organizations
       where slug in ('serra-honda','serra-nissan','tony-serra-ford','hyundai-of-columbia','ford-of-columbia')
       order by name`,
    );
    for (const r of settings.rows) {
      const s = r.settings || {};
      console.log(`- ${r.name}: dailyRecapEnabled=${s.dailyRecapEnabled === true} dailyRecapHour=${s.dailyRecapHour ?? '(default 18)'} timezone=${s.timezone ?? '(default America/Chicago)'}`);
    }

    // Hunches table — counts per org (last 14 days)
    console.log('\n## Hunches generated (last 14 days)');
    const h = await c.query(
      `select o.name, count(*) as n, max(h.created_at) as last_at
       from hunches h join organizations o on o.id = h.organization_id
       where h.created_at > now() - interval '14 days'
       group by o.name order by o.name`,
    );
    if (h.rows.length === 0) {
      console.log('(no rows)');
    } else {
      for (const r of h.rows) {
        console.log(`- ${r.name}: ${r.n} hunches, latest=${r.last_at?.toISOString?.() ?? r.last_at}`);
      }
    }

  } finally {
    c.release();
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
