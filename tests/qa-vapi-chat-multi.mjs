import * as dotenv from 'dotenv';
dotenv.config({ path: '/home/ubuntu/Claude-store/nexxus2.2_replit/.env' });
const KEY = process.env.VAPI_PRIVATE_KEY;
const SAVANNAH = "6216451c-e0a3-43d0-aece-ae382bd8df25";

async function chat(assistantId, input, previousChatId) {
  const body = { assistantId, input };
  if (previousChatId) body.previousChatId = previousChatId;
  const r = await fetch("https://api.vapi.ai/chat", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  return j;
}

const turns = [
  "Hi, I need service on my Ford Fusion. The brakes are squeaking.",
  "Can someone in service help me schedule that?",
  "Yes please, can you transfer me to Nancy in service?",
];

let prev = undefined;
for (const t of turns) {
  console.log(`\n>>> USER: ${t}`);
  const j = await chat(SAVANNAH, t, prev);
  prev = j.id;
  const out = (j.output || []).map(o => `${o.role}: ${o.content}`).join("\n");
  console.log(`<<< ${out}`);
  if (j.error) console.log(`ERROR: ${JSON.stringify(j.error)}`);
}

// Also test Georgia identically
console.log("\n\n==================== Georgia / Tony Serra Ford ====================");
const GEORGIA = "ad478eb2-6602-42c5-9732-3d4648013307";
prev = undefined;
for (const t of turns) {
  console.log(`\n>>> USER: ${t}`);
  const j = await chat(GEORGIA, t, prev);
  prev = j.id;
  const out = (j.output || []).map(o => `${o.role}: ${o.content}`).join("\n");
  console.log(`<<< ${out}`);
  if (j.error) console.log(`ERROR: ${JSON.stringify(j.error)}`);
}
