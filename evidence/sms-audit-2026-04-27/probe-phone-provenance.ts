/**
 * Read-only provenance probe for the 8 real-looking SMS recipient phones.
 *
 * For each phone, query:
 *   1. warehouse_leads — was this phone ingested via VIN sync / ADF?
 *   2. campaign_recipients — was this phone uploaded via a campaign CSV?
 *   3. conversations — any surviving conversation rows in any org (Serra
 *      Honda's are gone but other orgs share the DB).
 *   4. outbound_log — full row content, not just status counts (we already
 *      have status counts from the prior probe; here we want the full text
 *      to inform the audit).
 *
 * No mutations.
 */
import "dotenv/config";
import pg from "pg";
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const OUT_PATH = resolve(__dirname, "phone-provenance.json");

const REAL_LOOKING_PHONES = [
  { name: "Donna Murphy", phone: "4125199087" },
  { name: "Lisa Morris", phone: "5417783509" },
  { name: "Noah Koger", phone: "6623046188" },
  { name: "Jennifer Jones", phone: "2564527205" },
  { name: "Jennifer Ueltschey", phone: "6019517616" },
  { name: "Fedor Zanin", phone: "8594458581" },
  { name: "Richard Chambliss", phone: "2567944375" },
  { name: "Allie Nix", phone: "2054102897" },
];

function variants(p: string): string[] {
  const d = p.replace(/[^\d]/g, "");
  const v = new Set<string>();
  v.add(d);
  if (d.length === 10) v.add("1" + d);
  if (d.length === 11 && d.startsWith("1")) v.add(d.slice(1));
  return [...v];
}

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const perPhone: any[] = [];
    for (const r of REAL_LOOKING_PHONES) {
      const vs = variants(r.phone);

      // 1. warehouse_leads — VIN/ADF lead provenance.
      const whlRes = await pool.query(
        `
        SELECT id, organization_id, source_id, data_source, vin_status,
               customer_name, customer_email, customer_phone, lead_source,
               vehicle_of_interest, assigned_salesperson, dealer_name,
               vin_created_at, synced_at, created_at
        FROM warehouse_leads
        WHERE regexp_replace(coalesce(customer_phone, ''), '[^0-9]', '', 'g') = ANY($1::text[])
        ORDER BY created_at ASC
        `,
        [vs],
      );

      // 2. campaign_recipients.
      const crRes = await pool.query(
        `
        SELECT cr.id, cr.campaign_id, c.name AS campaign_name, c.csv_filename,
               c.organization_id, cr.first_name, cr.last_name, cr.phone,
               cr.email, cr.vin, cr.vehicle_model, cr.vehicle_year,
               cr.status, cr.sent_at, cr.created_at
        FROM campaign_recipients cr
        LEFT JOIN campaigns c ON c.id = cr.campaign_id
        WHERE regexp_replace(coalesce(cr.phone, ''), '[^0-9]', '', 'g') = ANY($1::text[])
        ORDER BY cr.created_at ASC
        `,
        [vs],
      );

      // 3. conversations (surviving rows in any org).
      const cvRes = await pool.query(
        `
        SELECT id, customer_name, customer_phone, customer_email, channel,
               organization_id, campaign_id, message_count, created_at
        FROM (
          SELECT c.id, c.customer_name, c.customer_phone, c.customer_email,
                 c.channel, c.organization_id, c.campaign_id,
                 COALESCE(m.cnt, 0)::int AS message_count, c.created_at
          FROM conversations c
          LEFT JOIN (
            SELECT conversation_id, count(*) AS cnt
            FROM messages
            GROUP BY conversation_id
          ) m ON m.conversation_id = c.id
        ) cc
        WHERE regexp_replace(coalesce(customer_phone, ''), '[^0-9]', '', 'g') = ANY($1::text[])
        ORDER BY created_at ASC
        `,
        [vs],
      );

      // 4. outbound_log full content for every send touching these phones
      //    in the relevant week.
      const obRes = await pool.query(
        `
        SELECT id, organization_id, campaign_id, recipient_id, channel, status,
               blocked_reason, recipient_name, recipient_phone,
               recipient_email, sent_at, created_at,
               left(coalesce(message_content, ''), 500) AS message_content_preview
        FROM outbound_log
        WHERE channel = 'sms'
          AND regexp_replace(coalesce(recipient_phone, ''), '[^0-9]', '', 'g') = ANY($1::text[])
        ORDER BY created_at ASC
        `,
        [vs],
      );

      perPhone.push({
        name: r.name,
        phone: r.phone,
        variants: vs,
        warehouse_leads_count: whlRes.rows.length,
        warehouse_leads: whlRes.rows,
        campaign_recipients_count: crRes.rows.length,
        campaign_recipients: crRes.rows,
        conversations_count: cvRes.rows.length,
        conversations: cvRes.rows,
        outbound_log_count: obRes.rows.length,
        outbound_log: obRes.rows,
      });
    }

    // Aggregate provenance signals.
    const summary = {
      total_phones: REAL_LOOKING_PHONES.length,
      with_warehouse_lead: perPhone.filter((p) => p.warehouse_leads_count > 0).length,
      with_campaign_recipient: perPhone.filter((p) => p.campaign_recipients_count > 0).length,
      with_surviving_conversation: perPhone.filter((p) => p.conversations_count > 0).length,
    };

    const out = {
      probed_at: new Date().toISOString(),
      summary,
      per_phone: perPhone,
    };
    writeFileSync(OUT_PATH, JSON.stringify(out, null, 2));

    // Compact stdout.
    const compact = {
      probed_at: out.probed_at,
      summary: out.summary,
      per_phone_compact: perPhone.map((p) => ({
        name: p.name,
        phone: p.phone,
        warehouse_leads_count: p.warehouse_leads_count,
        warehouse_leads_orgs: [...new Set(p.warehouse_leads.map((w: any) => w.organization_id))],
        warehouse_leads_data_sources: [...new Set(p.warehouse_leads.map((w: any) => w.data_source))],
        campaign_recipients_count: p.campaign_recipients_count,
        campaign_csvs: [...new Set(p.campaign_recipients.map((c: any) => c.csv_filename).filter(Boolean))],
        conversations_count: p.conversations_count,
        outbound_log_count: p.outbound_log_count,
      })),
      output_path: OUT_PATH,
    };
    console.log(JSON.stringify(compact, null, 2));
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
