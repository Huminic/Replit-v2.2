/**
 * replay-leads.ts — Replay VAPI calls to create VIN leads + send email notifications
 *
 * Usage:
 *   npx tsx utilities/replay-leads.ts --store "Serra Honda"
 *   npx tsx utilities/replay-leads.ts --store "all"
 *   npx tsx utilities/replay-leads.ts --store "Hyundai of Columbia" --dry-run
 *   npx tsx utilities/replay-leads.ts --call-id 019d0da6-322b-799f-b48a-7b49d04fe8e5
 *
 * What it does:
 *   1. Fetches VAPI calls for the specified store (or all stores) in a date range
 *   2. For each call, triggers the webhook to:
 *      - Insert the lead into VIN Solutions (Durran Cage's account per store)
 *      - Send email notification to org admins
 *   3. Filters out test calls (Elliott) automatically
 */

const BASE_URL = process.env.APP_URL || "https://dev.huminicdev.com";
const VAPI_KEY = process.env.VAPI_PRIVATE_KEY || "36bbcd04-eaae-4a28-9331-e404a50e618b";

// Store → VAPI phone number ID mapping
const STORE_PHONES: Record<string, { phoneId: string; name: string; orgId: string; dealerId: string }> = {
  "Serra Honda": {
    phoneId: "6e524330-8253-4e09-bf34-1892ebb393b5",
    name: "Caroline",
    orgId: "f4c56901-89ab-4497-9bfb-69e6495a4839",
    dealerId: "21043",
  },
  "Serra Service": {
    phoneId: "5b465fde-e294-4fb5-a8c4-dfb02cc53b61",
    name: "Nancy",
    orgId: "f4c56901-89ab-4497-9bfb-69e6495a4839",
    dealerId: "21043",
  },
  "Serra Nissan": {
    phoneId: "fc9fb382-b147-40b0-9245-c1035d59089b",
    name: "Magnolia",
    orgId: "7f6455be-bed6-466a-9020-7aab1d600ec7",
    dealerId: "21044",
  },
  "Tony Serra Ford": {
    phoneId: "5c3aa48d-02b3-490d-9e65-5aff8c2dd84a",
    name: "Georgia",
    orgId: "e24e580f-216e-4188-95d9-03d05bec3b30",
    dealerId: "21047",
  },
  "Ford of Columbia": {
    phoneId: "24abab86-519d-412e-bec4-3cd251089101",
    name: "Savannah",
    orgId: "c1f6667c-9966-452b-9dd1-635862318cbd",
    dealerId: "13398",
  },
  "Hyundai of Columbia": {
    phoneId: "732f8fde-7e2b-4b35-9337-7cb0cb592374",
    name: "Elizabeth",
    orgId: "9d2c3591-d2c5-47d5-9051-0daf84b22f1e",
    dealerId: "13399",
  },
};

// Test phone numbers to exclude
const TEST_PHONES = ["+18392729080", "+19012038267", "+14125209388"];

// VAPI assistant → store mapping
const ASSISTANT_TO_STORE: Record<string, string> = {
  "90a876c0-0f11-4424-abfe-9ac82b264d88": "Serra Honda",      // Caroline
  "c777f029-8c4c-4a23-98e4-3adfd4112a61": "Serra Service",     // Nancy/Carol
  "2203b188-a549-417b-ab33-075766e1b5c1": "Serra Nissan",      // Magnolia
  "ad478eb2-6602-42c5-9732-3d4648013307": "Tony Serra Ford",   // Georgia
  "6216451c-e0a3-43d0-aece-ae382bd8df25": "Ford of Columbia",  // Savannah
  "6d12a8fa-0ed0-4ec1-bfdb-e84587ff86c0": "Hyundai of Columbia", // Elizabeth
};

const PHONE_TO_STORE: Record<string, string> = {};
for (const [store, config] of Object.entries(STORE_PHONES)) {
  PHONE_TO_STORE[config.phoneId] = store;
}

interface VAPICall {
  id: string;
  assistantId: string;
  phoneNumberId: string;
  type: string;
  startedAt: string;
  endedAt: string;
  transcript: string;
  recordingUrl: string | null;
  summary: string;
  createdAt: string;
  customer: { number: string };
  status: string;
  endedReason: string;
  messages: any[];
}

async function fetchCalls(startDate: string, endDate: string): Promise<VAPICall[]> {
  const url = `https://api.vapi.ai/call?limit=100&createdAtGe=${startDate}&createdAtLe=${endDate}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${VAPI_KEY}` },
  });
  return res.json();
}

async function fetchCallDetail(callId: string): Promise<VAPICall> {
  const res = await fetch(`https://api.vapi.ai/call/${callId}`, {
    headers: { Authorization: `Bearer ${VAPI_KEY}` },
  });
  return res.json();
}

async function triggerWebhook(call: VAPICall, store: string): Promise<{ success: boolean; detail: string }> {
  const storeConfig = STORE_PHONES[store];
  if (!storeConfig) return { success: false, detail: `Unknown store: ${store}` };

  // Build the end-of-call-report webhook payload that the app expects
  const payload = {
    message: {
      type: "end-of-call-report",
      call: {
        id: call.id,
        type: call.type || "inboundPhoneCall",
        status: call.status || "ended",
        startedAt: call.startedAt,
        endedAt: call.endedAt,
        phoneNumberId: call.phoneNumberId,
        assistantId: call.assistantId,
        customer: call.customer,
        endedReason: call.endedReason,
        recordingUrl: call.recordingUrl,
      },
      transcript: call.transcript || "",
      summary: call.summary || "",
      recordingUrl: call.recordingUrl,
    },
  };

  try {
    const res = await fetch(`${BASE_URL}/api/webhooks/vapi`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const status = res.status;
    const body = await res.text();
    return { success: status === 200, detail: `${status}: ${body.slice(0, 200)}` };
  } catch (err: any) {
    return { success: false, detail: err.message };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const storeArg = args.includes("--store") ? args[args.indexOf("--store") + 1] : null;
  const callIdArg = args.includes("--call-id") ? args[args.indexOf("--call-id") + 1] : null;
  const dryRun = args.includes("--dry-run");
  const startDate = args.includes("--start") ? args[args.indexOf("--start") + 1] : "2026-03-20T23:00:00Z";
  const endDate = args.includes("--end") ? args[args.indexOf("--end") + 1] : new Date().toISOString();

  if (!storeArg && !callIdArg) {
    console.log("Usage:");
    console.log('  npx tsx utilities/replay-leads.ts --store "Serra Honda"');
    console.log('  npx tsx utilities/replay-leads.ts --store "all"');
    console.log('  npx tsx utilities/replay-leads.ts --store "all" --dry-run');
    console.log('  npx tsx utilities/replay-leads.ts --call-id <vapi-call-id>');
    console.log('  npx tsx utilities/replay-leads.ts --store "all" --start 2026-03-20T23:00:00Z --end 2026-03-23T12:00:00Z');
    console.log("\nStores:", Object.keys(STORE_PHONES).join(", "));
    process.exit(0);
  }

  // Single call replay
  if (callIdArg) {
    console.log(`Fetching call ${callIdArg}...`);
    const call = await fetchCallDetail(callIdArg);
    const store = PHONE_TO_STORE[call.phoneNumberId] || ASSISTANT_TO_STORE[call.assistantId] || "Unknown";
    console.log(`  Store: ${store} | Customer: ${call.customer?.number} | ${call.endedReason}`);
    if (dryRun) {
      console.log("  [DRY RUN] Would trigger webhook");
    } else {
      const result = await triggerWebhook(call, store);
      console.log(`  Result: ${result.success ? "SUCCESS" : "FAILED"} — ${result.detail}`);
    }
    return;
  }

  // Fetch all calls in date range
  console.log(`Fetching calls from ${startDate} to ${endDate}...`);
  const allCalls = await fetchCalls(startDate, endDate);
  console.log(`Total calls: ${allCalls.length}`);

  // Filter to real calls only
  const realCalls = allCalls.filter(c => {
    const customerPhone = c.customer?.number || "";
    if (TEST_PHONES.includes(customerPhone)) return false;
    if (!customerPhone) return false;
    const store = PHONE_TO_STORE[c.phoneNumberId];
    if (!store) return false;
    return true;
  });

  console.log(`Real calls (excluding tests): ${realCalls.length}\n`);

  // Group by store
  const byStore: Record<string, VAPICall[]> = {};
  for (const call of realCalls) {
    const store = PHONE_TO_STORE[call.phoneNumberId] || "Unknown";
    if (!byStore[store]) byStore[store] = [];
    byStore[store].push(call);
  }

  // Filter by requested store
  const storesToProcess = storeArg === "all"
    ? Object.keys(byStore)
    : [storeArg!];

  for (const store of storesToProcess) {
    const calls = byStore[store] || [];
    if (calls.length === 0) {
      console.log(`=== ${store}: 0 calls ===\n`);
      continue;
    }

    console.log(`=== ${store}: ${calls.length} call(s) ===`);
    for (const call of calls.sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
      const time = new Date(call.createdAt).toLocaleString("en-US", { dateStyle: "short", timeStyle: "short" });
      console.log(`  ${time} | ${call.customer.number} | ${call.endedReason}`);

      if (dryRun) {
        console.log("    [DRY RUN] Would trigger webhook + VIN insert + email");
      } else {
        // Fetch full call detail (for transcript/summary)
        const fullCall = await fetchCallDetail(call.id);
        const result = await triggerWebhook(fullCall, store);
        console.log(`    ${result.success ? "✓" : "✗"} ${result.detail.slice(0, 100)}`);

        // Brief pause between calls to avoid rate limiting
        await new Promise(r => setTimeout(r, 2000));
      }
    }
    console.log();
  }

  console.log("Done.");
}

main().catch(e => { console.error("FATAL:", e); process.exit(1); });
