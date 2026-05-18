import * as dotenv from 'dotenv';
dotenv.config({ path: '/home/ubuntu/Claude-store/nexxus2.2_replit/.env' });
const KEY = process.env.VAPI_PRIVATE_KEY;
const SAVANNAH = "6216451c-e0a3-43d0-aece-ae382bd8df25";

// 1. List recent evals to understand what shape the org has used
console.log("=== Existing evals (top 5) ===");
const evalsList = await fetch("https://api.vapi.ai/eval?limit=5", { headers: { Authorization: `Bearer ${KEY}` } });
const evals = await evalsList.json();
for (const e of (evals.results || []).slice(0, 5)) {
  console.log(`- ${e.id}  type=${e.type}  name=${e.name}  asst=${e.assistantId || "n/a"}`);
}

// 2. Try /chat — Vapi exposes a chat completion endpoint we can drive against an assistantId
console.log("\n=== POST /chat — simulate 'I need service on my Ford Fusion' against Savannah ===");
const chatBody = {
  assistantId: SAVANNAH,
  input: "Hi, I need service on my Ford Fusion. Brakes are squeaking."
};
const chatResp = await fetch("https://api.vapi.ai/chat", {
  method: "POST",
  headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify(chatBody),
});
const chatText = await chatResp.text();
console.log(`HTTP ${chatResp.status} ${chatResp.statusText}`);
console.log(chatText.slice(0, 4000));
