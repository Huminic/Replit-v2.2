/**
 * Apply Ford service-intent + transferCall fix to Savannah + Georgia VAPI assistants.
 *
 * Operator-authorized 2026-05-18 (autonomous mode, "fix the things that are
 * conditions so we can go live holistically" + "I want to make sure that what's
 * on the server for the system prompt is updated and that you use the eval
 * function that Vapi offers").
 *
 * Implements qa-evaluator Task #1 recommendation. Read-modify-write per assistant
 * via PATCH https://api.vapi.ai/assistant/{id}.
 *
 * Changes per assistant:
 *   1. Attach transferCall tool routing service intents to dealership main line
 *   2. Prepend SERVICE INTENT block to model.messages[0].content (above PRIMARY OBJECTIVE)
 *   3. Strip "AVAILABLE TOOLS" block from Savannah's prompt (the hallucination surface
 *      — Savannah promises knowledge_base_search/crm_and_lead_management/vin_decoder
 *      but model.tools is empty)
 *   4. silenceTimeoutSeconds: 30 → 60
 *   5. endCallPhrases: [] → standard goodbye list
 *
 * NOTE: Georgia's prompt does not have the same "AVAILABLE TOOLS" block, so step 3
 * applies to Savannah only.
 *
 * Destination numbers (from each assistant's existing prompt body — operator-
 * confirmed dealership main lines):
 *   - Savannah / Ford of Columbia: +1 (931) 369-2815
 *   - Georgia / Tony Serra Ford:   +1 (256) 245-5000
 *
 * Re-runnable: PATCH is idempotent if the SERVICE INTENT marker already exists in
 * the prompt — we detect and skip. transferCall tool is replaced wholesale each run.
 */
import "dotenv/config";

const VAPI = "https://api.vapi.ai";
const KEY = process.env.VAPI_PRIVATE_KEY;
if (!KEY) { console.error("VAPI_PRIVATE_KEY not set"); process.exit(1); }

const FORD_ASSISTANTS = [
  {
    name: "Savannah",
    org: "ford-of-columbia",
    id: "6216451c-e0a3-43d0-aece-ae382bd8df25",
    transferNumber: "+19313692815",
    transferLabel: "Ford of Columbia service department / Nancy Gaston",
    stripAvailableToolsBlock: true,
  },
  {
    name: "Georgia",
    org: "tony-serra-ford",
    id: "ad478eb2-6602-42c5-9732-3d4648013307",
    transferNumber: "+12562455000",
    transferLabel: "Tony Serra Ford service department / Nancy Gaston",
    stripAvailableToolsBlock: false,
  },
];

const SERVICE_INTENT_MARKER = "SERVICE INTENT (HIGHEST PRIORITY";
const SERVICE_INTENT_BLOCK = `SERVICE INTENT (HIGHEST PRIORITY — overrides sales flow):
If the customer mentions service, repair, maintenance, brakes, oil change, recall, tires, transmission, diagnostic, "check engine," or asks for anyone in service (including Nancy or Nancy Gaston):
1. Acknowledge: "Got it — sounds like you need service. Let me get you over to our service team right now."
2. IMMEDIATELY invoke transferToService. Do NOT collect details first. Do NOT try to schedule. Do NOT route to sales.
3. If transfer fails: "I'm having trouble connecting you — what's the best number for service to call you back?" then capture name + phone for service follow-up.

---

`;

const END_CALL_PHRASES = ["goodbye", "bye", "talk to you later", "see you", "see ya"];

function buildTransferTool(destinationNumber, label) {
  return {
    type: "transferCall",
    destinations: [
      {
        type: "number",
        number: destinationNumber,
        message: "Transferring you to our service team — please hold one moment.",
        description: label,
      },
    ],
    function: {
      name: "transferToService",
      description:
        "Transfer the caller to the service department when they mention service, repair, maintenance, brakes, oil change, recall, tires, transmission, diagnostic, 'check engine,' or ask for Nancy / anyone in service.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  };
}

function stripAvailableTools(prompt) {
  // Remove the "AVAILABLE TOOLS:" block that lists knowledge_base_search/crm_and_lead_management/vin_decoder.
  // This is the hallucination surface for Savannah — she promises tools she doesn't have.
  // Strip from "AVAILABLE TOOLS:" up through the first blank line.
  const re = /AVAILABLE TOOLS:[\s\S]*?\n\n/g;
  let out = prompt.replace(re, "");
  // Also remove "Use CRM tool to check if returning customer (by phone)" if present
  out = out.replace(/\s*[-*\d.]*\s*Use CRM tool to check if returning customer[^\n]*\n/g, "\n");
  return out;
}

async function fetchAssistant(id) {
  const r = await fetch(`${VAPI}/assistant/${id}`, {
    headers: { Authorization: `Bearer ${KEY}` },
  });
  if (!r.ok) throw new Error(`GET ${id} → ${r.status} ${await r.text()}`);
  return await r.json();
}

async function patchAssistant(id, body) {
  const r = await fetch(`${VAPI}/assistant/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`PATCH ${id} → ${r.status} ${text}`);
  return JSON.parse(text);
}

async function processOne(a) {
  console.log(`\n=== ${a.name} (${a.org}) — ${a.id} ===`);

  const current = await fetchAssistant(a.id);
  const oldPrompt = current.model?.messages?.[0]?.content || "";
  console.log(`  Current prompt length: ${oldPrompt.length}`);

  // Step 1: build new system prompt
  let newPrompt = oldPrompt;
  if (a.stripAvailableToolsBlock) {
    const before = newPrompt.length;
    newPrompt = stripAvailableTools(newPrompt);
    console.log(`  Stripped AVAILABLE TOOLS block: -${before - newPrompt.length} chars`);
  }
  if (newPrompt.includes(SERVICE_INTENT_MARKER)) {
    console.log(`  SERVICE INTENT marker already present — skipping prepend (idempotency)`);
  } else {
    newPrompt = SERVICE_INTENT_BLOCK + newPrompt;
    console.log(`  Prepended SERVICE INTENT block: +${SERVICE_INTENT_BLOCK.length} chars`);
  }
  console.log(`  New prompt length: ${newPrompt.length}`);

  // Step 2: build PATCH body — only include fields we're changing (VAPI merges)
  const patchBody = {
    model: {
      ...current.model,
      messages: [
        { role: "system", content: newPrompt },
        ...(current.model?.messages?.slice(1) || []),
      ],
      tools: [buildTransferTool(a.transferNumber, a.transferLabel)],
    },
    silenceTimeoutSeconds: 60,
    endCallPhrases: END_CALL_PHRASES,
  };

  console.log(`  PATCHing — transferCall destination=${a.transferNumber}, silenceTimeout=60, endCallPhrases=[${END_CALL_PHRASES.join(",")}]`);
  const updated = await patchAssistant(a.id, patchBody);
  console.log(`  ✓ PATCHed. updatedAt=${updated.updatedAt}`);
  console.log(`  Confirmed tools count: ${(updated.model?.tools || []).length}`);
  console.log(`  Confirmed silenceTimeoutSeconds: ${updated.silenceTimeoutSeconds}`);
  console.log(`  Confirmed endCallPhrases: [${(updated.endCallPhrases || []).join(",")}]`);
}

async function main() {
  for (const a of FORD_ASSISTANTS) {
    try {
      await processOne(a);
    } catch (e) {
      console.error(`  ✗ ${a.name} FAILED:`, e.message);
      process.exitCode = 2;
    }
  }
}

main();
