import * as dotenv from 'dotenv';
dotenv.config({ path: '/home/ubuntu/Claude-store/nexxus2.2_replit/.env' });
const KEY = process.env.VAPI_PRIVATE_KEY;
const SAVANNAH = "6216451c-e0a3-43d0-aece-ae382bd8df25";

// Recent calls for Savannah
const r = await fetch(`https://api.vapi.ai/call?assistantId=${SAVANNAH}&limit=5`, {
  headers: { Authorization: `Bearer ${KEY}` }
});
const j = await r.json();
console.log("Recent Savannah calls:");
const calls = Array.isArray(j) ? j : (j.results || []);
for (const c of calls) {
  console.log(`- ${c.id}  ${c.createdAt}  status=${c.status} endReason=${c.endedReason} dur=${c.endedAt && c.startedAt ? ((new Date(c.endedAt)-new Date(c.startedAt))/1000).toFixed(0)+'s' : 'n/a'}`);
  if (c.transcript) {
    console.log(`  transcript: ${c.transcript.slice(0, 400).replace(/\n/g, ' | ')}`);
  }
}

// Also check assistant has any tools attr we missed
console.log("\n=== Re-dump Savannah keys ===");
const a = await fetch(`https://api.vapi.ai/assistant/${SAVANNAH}`, { headers: { Authorization: `Bearer ${KEY}` } }).then(r=>r.json());
console.log("top-level keys:", Object.keys(a).sort());
console.log("model keys:", Object.keys(a.model || {}).sort());
console.log("has tools at top?", "tools" in a, "len:", Array.isArray(a.tools) ? a.tools.length : "n/a");
console.log("has tools in model?", "tools" in (a.model || {}), "len:", Array.isArray(a.model?.tools) ? a.model.tools.length : "n/a");
console.log("endCallPhrases:", JSON.stringify(a.endCallPhrases || []));
console.log("backgroundDenoisingEnabled:", a.backgroundDenoisingEnabled);
console.log("responseDelaySeconds:", a.responseDelaySeconds);
console.log("llmRequestDelaySeconds:", a.llmRequestDelaySeconds);
console.log("numWordsToInterruptAssistant:", a.numWordsToInterruptAssistant);
console.log("backchannelingEnabled:", a.backchannelingEnabled);
