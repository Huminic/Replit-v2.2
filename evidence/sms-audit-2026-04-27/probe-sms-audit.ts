/**
 * Read-only SMS audit probe.
 *
 * For each of the 16 SMS rows in the REVIEW_UNKNOWN bucket of
 * restore-assessment-2026-04-27.json, look for surviving evidence in
 * the outbound_log table — which was NOT cascade-deleted by the
 * conversations DELETE in 831bbc2.
 *
 * Note on FK semantics:
 *   - outbound_log.organization_id ON DELETE CASCADE — outbound_log
 *     rows go away if the org is deleted. (Org wasn't deleted.)
 *   - outbound_log.campaign_id ON DELETE SET NULL.
 *   - outbound_log.recipient_id ON DELETE SET NULL.
 *   - outbound_log has NO FK to conversations.id at all.
 *
 * So outbound_log SHOULD have surviving sends-to-phone evidence even
 * though the conversation rows are gone.
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
const OUT_PATH = resolve(__dirname, "outbound-log-evidence.json");

// 16 phones as they appear in the saved snapshot. We match against
// outbound_log.recipient_phone using normalized digit-strings to
// avoid +/-/space differences masking real matches.
const SMS_ROWS = [
  { id: "e4a16515", name: "+1428670293", phone: "+1428670293" },
  { id: "7f7ecaf3", name: "+1821616232", phone: "+1821616232" },
  { id: "9cab0023", name: "18338096836", phone: "18338096836" },
  { id: "7b464eac", name: "4126574001", phone: "4126574001" },
  { id: "86c68888", name: "Duane Wells", phone: "4126572001" },
  { id: "673b1f74", name: "Durran Cage", phone: "7313946907" },
  { id: "65fd9a93", name: "Sarita Wells", phone: "4125375782" },
  { id: "720d335e", name: "Donna Murphy", phone: "4125199087" },
  { id: "88e93b64", name: "Lisa Morris", phone: "5417783509" },
  { id: "d0efcbe4", name: "Noah Koger", phone: "6623046188" },
  { id: "654ee172", name: "Jennifer Jones", phone: "2564527205" },
  { id: "a0b8ed21", name: "Jennifer Ueltschey", phone: "6019517616" },
  { id: "2ddadb04", name: "Fedor Zanin", phone: "8594458581" },
  { id: "20de28db", name: "Richard Chambliss", phone: "2567944375" },
  { id: "d49c0d9e", name: "Allie Nix", phone: "2054102897" },
  { id: "0df020c1", name: "+1125352571", phone: "+1125352571" },
];

function normalizeDigits(p: string): string {
  return String(p).replace(/[^\d]/g, "");
}

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  try {
    // Build all candidate digit-strings — for a 10-digit local number we
    // also want to match an 11-digit "1XXXXXXXXXX" format (and vice versa).
    const candidates = new Set<string>();
    for (const r of SMS_ROWS) {
      const d = normalizeDigits(r.phone);
      candidates.add(d);
      // Reciprocal forms.
      if (d.length === 10) candidates.add("1" + d);
      if (d.length === 11 && d.startsWith("1")) candidates.add(d.slice(1));
    }
    const candList = [...candidates];

    // Per-phone outbound_log evidence. We match on normalized digits-only
    // form to make +/-/space variation invisible.
    const perPhone: any[] = [];
    for (const r of SMS_ROWS) {
      const d = normalizeDigits(r.phone);
      const variants = new Set<string>();
      variants.add(d);
      if (d.length === 10) variants.add("1" + d);
      if (d.length === 11 && d.startsWith("1")) variants.add(d.slice(1));

      const matchRes = await pool.query(
        `
        SELECT id, organization_id, campaign_id, channel, status,
               blocked_reason, recipient_name, recipient_phone,
               recipient_email, sent_at, created_at,
               left(coalesce(message_content, ''), 200) AS message_preview,
               octet_length(coalesce(message_content, '')) AS message_byte_length
        FROM outbound_log
        WHERE channel = 'sms'
          AND regexp_replace(coalesce(recipient_phone, ''), '[^0-9]', '', 'g') = ANY($1::text[])
        ORDER BY created_at ASC
        `,
        [[...variants]],
      );

      const statusBreakdown: Record<string, number> = {};
      for (const row of matchRes.rows) {
        statusBreakdown[row.status] = (statusBreakdown[row.status] || 0) + 1;
      }

      perPhone.push({
        snapshot_row: r,
        normalized_phone: d,
        match_count: matchRes.rows.length,
        status_breakdown: statusBreakdown,
        matches: matchRes.rows,
      });
    }

    // Aggregate: any phone with status='sent' is a probable real-recipient send.
    const sentEvidence = perPhone.filter((p) =>
      p.matches.some((m: any) => m.status === "sent"),
    );
    const blockedOnlyEvidence = perPhone.filter(
      (p) =>
        p.matches.length > 0 &&
        p.matches.every((m: any) => m.status === "blocked"),
    );
    const noOutboundEvidence = perPhone.filter((p) => p.matches.length === 0);

    // Also check the org-wide SMS send history for serra-honda in the
    // matching window (2026-04-05 to 2026-04-13) so we know what kind of
    // SMS volume was happening overall.
    const SERRA_HONDA = "24d64f99-ba04-4b43-af35-fd06f555ac86";
    const orgSmsRes = await pool.query(
      `
      SELECT date_trunc('day', created_at) AS day, status, count(*)::int AS n
      FROM outbound_log
      WHERE organization_id = $1
        AND channel = 'sms'
        AND created_at >= '2026-04-05'::timestamp
        AND created_at <  '2026-04-14'::timestamp
      GROUP BY day, status
      ORDER BY day ASC, status ASC
      `,
      [SERRA_HONDA],
    );

    const out = {
      probed_at: new Date().toISOString(),
      audit_scope: "16 SMS rows in REVIEW_UNKNOWN per restore-assessment-2026-04-27.json",
      org: { id: SERRA_HONDA, slug: "serra-honda" },
      summary: {
        total_rows: SMS_ROWS.length,
        rows_with_outbound_log_match: perPhone.filter((p) => p.match_count > 0)
          .length,
        rows_with_at_least_one_sent: sentEvidence.length,
        rows_with_only_blocked: blockedOnlyEvidence.length,
        rows_with_no_outbound_log_record: noOutboundEvidence.length,
      },
      per_phone: perPhone,
      sent_evidence_phones: sentEvidence.map((p) => ({
        id: p.snapshot_row.id,
        phone: p.snapshot_row.phone,
        name: p.snapshot_row.name,
        match_count: p.match_count,
        statuses: p.status_breakdown,
      })),
      org_wide_sms_volume_week_2026_04_05_to_04_13: orgSmsRes.rows,
    };
    writeFileSync(OUT_PATH, JSON.stringify(out, null, 2));

    // Compact stdout summary.
    const compact = {
      probed_at: out.probed_at,
      summary: out.summary,
      sent_evidence_phones: out.sent_evidence_phones,
      org_wide_sms_volume: out.org_wide_sms_volume_week_2026_04_05_to_04_13,
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
