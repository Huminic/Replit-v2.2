/**
 * elliott-test.ts — Place a test call using Elliott to any store's AI assistant
 *
 * Usage:
 *   npx tsx utilities/elliott-test.ts --store "Serra Honda"
 *   npx tsx utilities/elliott-test.ts --store "Ford of Columbia"
 *   npx tsx utilities/elliott-test.ts --store "Serra Service"
 *   npx tsx utilities/elliott-test.ts --wait           # wait for call to complete and show results
 *
 * Elliott calls the store's VAPI number. The AI assistant answers.
 * The end-of-call webhook fires, creating a conversation in TeamBox
 * and sending an email notification.
 */

const VAPI_KEY = process.env.VAPI_PRIVATE_KEY || "36bbcd04-eaae-4a28-9331-e404a50e618b";
const ELLIOTT_ASSISTANT_ID = "c303d993-bf42-4784-a8cb-247477b1cbdd";
const ELLIOTT_PHONE_ID = "a85a9397-25cb-4e35-b784-05cfa5a926b2";

const STORE_NUMBERS: Record<string, string> = {
  "Serra Honda": "+19012038267",      // Caroline
  "Serra Service": "+19014361271",     // Nancy
  "Serra Nissan": "+12568623318",      // Magnolia
  "Tony Serra Ford": "+12564599707",   // Georgia
  "Ford of Columbia": "+19313692815",  // Savannah
  "Hyundai of Columbia": "+19012039398", // Elizabeth
};

async function placeCall(storeNumber: string): Promise<any> {
  const res = await fetch("https://api.vapi.ai/call/phone", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${VAPI_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      assistantId: ELLIOTT_ASSISTANT_ID,
      phoneNumberId: ELLIOTT_PHONE_ID,
      customer: { number: storeNumber },
    }),
  });
  return res.json();
}

async function waitForCall(callId: string, maxWaitMs = 120000): Promise<any> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const res = await fetch(`https://api.vapi.ai/call/${callId}`, {
      headers: { Authorization: `Bearer ${VAPI_KEY}` },
    });
    const call = await res.json();
    if (call.status === "ended") return call;
    await new Promise(r => setTimeout(r, 5000));
    process.stdout.write(".");
  }
  return null;
}

async function main() {
  const args = process.argv.slice(2);
  const store = args.includes("--store") ? args[args.indexOf("--store") + 1] : null;
  const shouldWait = args.includes("--wait");

  if (!store || !STORE_NUMBERS[store]) {
    console.log("Usage: npx tsx utilities/elliott-test.ts --store <store-name> [--wait]");
    console.log("\nAvailable stores:");
    for (const [name, number] of Object.entries(STORE_NUMBERS)) {
      console.log(`  "${name}" → ${number}`);
    }
    process.exit(0);
  }

  const number = STORE_NUMBERS[store];
  console.log(`Calling ${store} at ${number}...`);

  const result = await placeCall(number);
  if (result.statusCode || result.error) {
    console.error("Call failed:", result.message || result.error);
    process.exit(1);
  }

  console.log(`Call ID: ${result.id}`);
  console.log(`Status: ${result.status}`);

  if (shouldWait) {
    console.log("Waiting for call to complete...");
    const completed = await waitForCall(result.id);
    if (completed) {
      console.log(`\nCall ended: ${completed.endedReason}`);
      console.log(`Duration: ${completed.startedAt && completed.endedAt
        ? Math.round((new Date(completed.endedAt).getTime() - new Date(completed.startedAt).getTime()) / 1000) + "s"
        : "unknown"}`);
      console.log(`Cost: $${completed.cost || "?"}`);
      if (completed.transcript) {
        console.log(`\nTranscript:\n${completed.transcript}`);
      }
      if (completed.summary) {
        console.log(`\nSummary: ${completed.summary}`);
      }
    } else {
      console.log("\nTimeout — call did not complete within 2 minutes");
    }
  }
}

main().catch(e => { console.error("FATAL:", e); process.exit(1); });
