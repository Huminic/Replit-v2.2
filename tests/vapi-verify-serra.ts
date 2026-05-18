import "dotenv/config";

async function main() {
  const since = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
  const assistants = [
    { slug: "serra-honda", name: "Caroline", id: "90a876c0-0f11-4424-abfe-9ac82b264d88" },
    { slug: "serra-nissan", name: "Magnolia", id: "2203b188-a549-417b-ab33-075766e1b5c1" },
    { slug: "tony-serra-ford", name: "Georgia", id: "ad478eb2-6602-42c5-9732-3d4648013307" },
  ];
  console.log("Querying VAPI — calls since " + since);

  for (const a of assistants) {
    const r = await fetch(`https://api.vapi.ai/call?assistantId=${a.id}&createdAtGt=${since}&limit=100`, {
      headers: { Authorization: `Bearer ${process.env.VAPI_PRIVATE_KEY}` },
    });
    if (!r.ok) {
      console.log(`  ${a.slug} — ERROR ${r.status}: ${await r.text()}`);
      continue;
    }
    const calls = await r.json() as any[];
    console.log(`\n=== ${a.slug} / ${a.name} (id=${a.id}) ===`);
    console.log(`  Total: ${calls.length}`);
    for (const c of calls.slice(0, 20)) {
      const phone = c.customer?.number || c.from?.number || c.phoneNumber?.number || "(unknown)";
      const dur = c.startedAt && c.endedAt ? Math.round((new Date(c.endedAt).getTime() - new Date(c.startedAt).getTime()) / 1000) + "s" : "n/a";
      console.log(`    ${c.createdAt || c.startedAt}  from=${phone}  dur=${dur}  status=${c.status || c.endedReason || "?"}`);
    }
  }

  // Inventory phone numbers in the VAPI account — confirms which numbers are even routed
  console.log(`\n=== phone-numbers in VAPI account ===`);
  const pn = await fetch("https://api.vapi.ai/phone-number?limit=50", {
    headers: { Authorization: `Bearer ${process.env.VAPI_PRIVATE_KEY}` },
  });
  if (!pn.ok) {
    console.log(`  ERROR ${pn.status}: ${await pn.text()}`);
    return;
  }
  const phones = await pn.json() as any[];
  for (const p of phones) {
    console.log(`  ${p.number || "—".padEnd(15)}  name="${p.name || "—"}"  assistantId=${p.assistantId || "—"}  provider=${p.provider || "—"}`);
  }
}

main().catch((e) => { console.error("ERROR:", e.message); process.exit(2); });
