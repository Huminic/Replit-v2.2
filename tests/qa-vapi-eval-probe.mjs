import * as dotenv from 'dotenv';
dotenv.config({ path: '/home/ubuntu/Claude-store/nexxus2.2_replit/.env' });
const KEY = process.env.VAPI_PRIVATE_KEY;
const SAVANNAH = "6216451c-e0a3-43d0-aece-ae382bd8df25";

console.log("=== Probe VAPI eval / test endpoints ===");
const probes = [
  ["GET",  `https://api.vapi.ai/eval`],
  ["GET",  `https://api.vapi.ai/assistant/${SAVANNAH}/eval`],
  ["GET",  `https://api.vapi.ai/test`],
  ["GET",  `https://api.vapi.ai/test-suite`],
  ["GET",  `https://api.vapi.ai/test-suite-run`],
  ["GET",  `https://api.vapi.ai/test/scenario`],
];
for (const [m, url] of probes) {
  const r = await fetch(url, { method: m, headers: { Authorization: `Bearer ${KEY}` } });
  const body = await r.text();
  console.log(`${m} ${url} -> ${r.status} ${r.statusText} :: ${body.slice(0, 200)}`);
}
