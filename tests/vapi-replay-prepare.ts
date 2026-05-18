/**
 * READ-ONLY: prepare the replay manifest.
 * For each call in last 3d: pull full VAPI data, check our DB for existing
 * vapi_call_received row (idempotency), verify org adfEmail + recipients.
 * Output: a JSON manifest per store (printed to stdout, not written).
 * NO sends. NO writes.
 */
import "dotenv/config";
import { Client } from "pg";

const ASSISTANTS = [
  { orgSlug: "serra-honda", agentName: "Caroline", assistantId: "90a876c0-0f11-4424-abfe-9ac82b264d88" },
  { orgSlug: "serra-nissan", agentName: "Magnolia", assistantId: "2203b188-a549-417b-ab33-075766e1b5c1" },
  { orgSlug: "tony-serra-ford", agentName: "Georgia", assistantId: "ad478eb2-6602-42c5-9732-3d4648013307" },
  { orgSlug: "hyundai-of-columbia", agentName: "Elizabeth", assistantId: "6d12a8fa-0ed0-4ec1-bfdb-e84587ff86c0" },
  { orgSlug: "ford-of-columbia", agentName: "Savannah", assistantId: "6216451c-e0a3-43d0-aece-ae382bd8df25" },
];

async function listCalls(assistantId: string, sinceIso: string): Promise<any[]> {
  const url = `https://api.vapi.ai/call?assistantId=${assistantId}&createdAtGt=${sinceIso}&limit=100`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${process.env.VAPI_PRIVATE_KEY}` } });
  if (!r.ok) return [];
  return await r.json() as any[];
}

async function main() {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();

  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const sinceIso = threeDaysAgo.toISOString();

  for (const a of ASSISTANTS) {
    const calls = await listCalls(a.assistantId, sinceIso);
    if (calls.length === 0) {
      console.log(`\n=== ${a.orgSlug} === 0 calls (skip)`);
      continue;
    }

    // Org info
    const orgRes = await c.query(`
      SELECT id, name, slug, settings, outbound_enabled, email_enabled, partner_id
      FROM organizations WHERE slug = $1
    `, [a.orgSlug]);
    if (orgRes.rows.length === 0) {
      console.log(`\n=== ${a.orgSlug} === ORG NOT FOUND IN DB`);
      continue;
    }
    const org = orgRes.rows[0];
    const settings = org.settings || {};
    const adfEmail = settings.adfEmail;

    // Recipients (L3 org admins)
    const recipRes = await c.query(`
      SELECT u.email, r.level
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.organization_id = $1 AND u.is_active != false AND r.level = 3
      ORDER BY u.email
    `, [org.id]);
    const orgAdmins = recipRes.rows.map((r) => r.email);

    // Existing call IDs in DB (idempotency)
    const callIds = calls.map((c) => c.id);
    const existingRes = await c.query(`
      SELECT metadata->>'callId' AS call_id
      FROM activity_log
      WHERE action = 'vapi_call_received'
        AND organization_id = $1
        AND metadata->>'callId' = ANY($2::text[])
    `, [org.id, callIds]);
    const existingCallIds = new Set(existingRes.rows.map((r) => r.call_id));

    console.log(`\n=== ${a.orgSlug} — ${calls.length} calls ===`);
    console.log(`  org_id=${org.id}`);
    console.log(`  name=${org.name}`);
    console.log(`  outbound_enabled=${org.outbound_enabled} email_enabled=${org.email_enabled}`);
    console.log(`  adfEmail=${adfEmail || "(NOT CONFIGURED — NO ADF SEND)"}`);
    console.log(`  L3 org admins (${orgAdmins.length}): ${orgAdmins.join(", ") || "(none)"}`);
    console.log(`  Already in DB: ${existingCallIds.size} / ${calls.length}`);
    console.log(`  To replay: ${calls.length - existingCallIds.size}`);

    // Per-call detail
    for (const c1 of calls) {
      const alreadyHere = existingCallIds.has(c1.id);
      const fromPhone = c1.customer?.number || c1.from?.number || c1.phoneNumber?.number || "(unknown)";
      const dur = c1.startedAt && c1.endedAt
        ? Math.round((new Date(c1.endedAt).getTime() - new Date(c1.startedAt).getTime()) / 1000) + "s"
        : "n/a";
      const hasTranscript = c1.transcript && c1.transcript.length > 0;
      const flag = alreadyHere ? "[IN DB — SKIP]" : hasTranscript ? "[REPLAY]" : "[NO-TRANSCRIPT — SKIP per webhook rule]";
      console.log(`    ${flag} ${c1.id?.slice(0,8)} ${c1.createdAt} from=${fromPhone} dur=${dur} transcript=${hasTranscript ? c1.transcript.length + "ch" : "none"}`);
    }
  }

  await c.end();
}

main().catch((e) => { console.error("ERROR:", e.message); process.exit(2); });
