import * as dotenv from 'dotenv';
dotenv.config({ path: '/home/ubuntu/Claude-store/nexxus2.2_replit/.env' });
const KEY = process.env.VAPI_PRIVATE_KEY;
if (!KEY) { console.error("MISSING VAPI_PRIVATE_KEY"); process.exit(1); }
const ids = {
  "Savannah_Ford_of_Columbia": "6216451c-e0a3-43d0-aece-ae382bd8df25",
  "Georgia_Tony_Serra_Ford":   "ad478eb2-6602-42c5-9732-3d4648013307",
};
for (const [label, id] of Object.entries(ids)) {
  console.log(`\n================================================================================`);
  console.log(`=== ${label} (${id}) ===`);
  console.log(`================================================================================`);
  const r = await fetch(`https://api.vapi.ai/assistant/${id}`, { headers: { Authorization: `Bearer ${KEY}` } });
  if (!r.ok) {
    console.log(`HTTP ${r.status}: ${await r.text()}`);
    continue;
  }
  const a = await r.json();
  console.log(JSON.stringify(a, null, 2));
}
