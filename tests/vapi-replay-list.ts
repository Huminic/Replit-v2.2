/**
 * READ-ONLY: list VAPI calls per assistant for last 3 days.
 * NO sends. NO writes. Just inventory.
 */
import "dotenv/config";

const ASSISTANTS: Array<{ orgSlug: string; agentName: string; assistantId: string; assignedPhone: string }> = [
  { orgSlug: "serra-honda", agentName: "Caroline", assistantId: "90a876c0-0f11-4424-abfe-9ac82b264d88", assignedPhone: "+1 (901) 203-8267" },
  { orgSlug: "serra-nissan", agentName: "Magnolia", assistantId: "2203b188-a549-417b-ab33-075766e1b5c1", assignedPhone: "+1 (256) 862-3318" },
  { orgSlug: "tony-serra-ford", agentName: "Georgia", assistantId: "ad478eb2-6602-42c5-9732-3d4648013307", assignedPhone: "+1 (256) 459-9707" },
  { orgSlug: "hyundai-of-columbia", agentName: "Elizabeth", assistantId: "6d12a8fa-0ed0-4ec1-bfdb-e84587ff86c0", assignedPhone: "+1 (901) 203-9398" },
  { orgSlug: "ford-of-columbia", agentName: "Savannah", assistantId: "6216451c-e0a3-43d0-aece-ae382bd8df25", assignedPhone: "+1 (931) 369-2815" },
];

async function listCalls(assistantId: string, sinceIso: string): Promise<any[]> {
  const url = `https://api.vapi.ai/call?assistantId=${assistantId}&createdAtGt=${sinceIso}&limit=100`;
  const r = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.VAPI_PRIVATE_KEY}` },
  });
  if (!r.ok) {
    console.error(`  ERROR ${r.status}: ${await r.text()}`);
    return [];
  }
  return await r.json() as any[];
}

async function main() {
  if (!process.env.VAPI_PRIVATE_KEY) {
    console.error("VAPI_PRIVATE_KEY not set");
    process.exit(1);
  }

  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const sinceIso = threeDaysAgo.toISOString();
  console.log(`Listing VAPI calls since ${sinceIso} per assistant.\n`);

  for (const a of ASSISTANTS) {
    console.log(`=== ${a.orgSlug} / ${a.agentName} (${a.assistantId}) ===`);
    const calls = await listCalls(a.assistantId, sinceIso);
    console.log(`  Total: ${calls.length} calls\n`);
    if (calls.length === 0) continue;

    // Counts by status + with-transcript
    const byStatus: Record<string, number> = {};
    let withTranscript = 0;
    let withEndedAt = 0;
    for (const c of calls) {
      const s = c.status || c.endedReason || "unknown";
      byStatus[s] = (byStatus[s] || 0) + 1;
      if (c.transcript && c.transcript.length > 0) withTranscript++;
      if (c.endedAt) withEndedAt++;
    }
    console.log(`  Status breakdown:`, byStatus);
    console.log(`  With transcript: ${withTranscript} | with endedAt: ${withEndedAt}`);

    // Show 3 most-recent
    const recent = calls.slice(0, 3);
    for (const c of recent) {
      const dur = c.startedAt && c.endedAt
        ? Math.round((new Date(c.endedAt).getTime() - new Date(c.startedAt).getTime()) / 1000) + "s"
        : "n/a";
      const fromPhone = c.customer?.number || c.from?.number || c.phoneNumber?.number || "(unknown)";
      console.log(`    ${c.id?.slice(0,8) || "—"}  ${c.createdAt || c.startedAt || "—"}  from=${fromPhone}  dur=${dur}  status=${c.status || c.endedReason || "?"}  transcript=${c.transcript ? c.transcript.length + " chars" : "none"}`);
    }
    console.log();
  }
}

main().catch((e) => { console.error("ERROR:", e.message); process.exit(2); });
