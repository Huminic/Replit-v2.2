/**
 * send-lead-email.ts — Manually send a lead notification email for a store
 *
 * Usage:
 *   npx tsx utilities/send-lead-email.ts --store "Serra Honda" --phone "+16155408535" --assistant "Caroline"
 *   npx tsx utilities/send-lead-email.ts --store "Ford of Columbia" --phone "+16782452756" --assistant "Savannah" --summary "Customer called about oil change pricing"
 *
 * Triggers the email notification through the app's sendLeadNotificationEmail function
 * by posting a synthetic end-of-call-report to the VAPI webhook endpoint.
 */

const BASE_URL = process.env.APP_URL || "https://dev.huminicdev.com";

const STORES: Record<string, { orgId: string; assistantName: string; assistantId: string; phoneId: string }> = {
  "Serra Honda": {
    orgId: "f4c56901-89ab-4497-9bfb-69e6495a4839",
    assistantName: "Caroline",
    assistantId: "90a876c0-0f11-4424-abfe-9ac82b264d88",
    phoneId: "6e524330-8253-4e09-bf34-1892ebb393b5",
  },
  "Serra Service": {
    orgId: "f4c56901-89ab-4497-9bfb-69e6495a4839",
    assistantName: "Nancy",
    assistantId: "c777f029-8c4c-4a23-98e4-3adfd4112a61",
    phoneId: "5b465fde-e294-4fb5-a8c4-dfb02cc53b61",
  },
  "Serra Nissan": {
    orgId: "7f6455be-bed6-466a-9020-7aab1d600ec7",
    assistantName: "Magnolia",
    assistantId: "2203b188-a549-417b-ab33-075766e1b5c1",
    phoneId: "fc9fb382-b147-40b0-9245-c1035d59089b",
  },
  "Tony Serra Ford": {
    orgId: "e24e580f-216e-4188-95d9-03d05bec3b30",
    assistantName: "Georgia",
    assistantId: "ad478eb2-6602-42c5-9732-3d4648013307",
    phoneId: "5c3aa48d-02b3-490d-9e65-5aff8c2dd84a",
  },
  "Ford of Columbia": {
    orgId: "c1f6667c-9966-452b-9dd1-635862318cbd",
    assistantName: "Savannah",
    assistantId: "6216451c-e0a3-43d0-aece-ae382bd8df25",
    phoneId: "24abab86-519d-412e-bec4-3cd251089101",
  },
  "Hyundai of Columbia": {
    orgId: "9d2c3591-d2c5-47d5-9051-0daf84b22f1e",
    assistantName: "Elizabeth",
    assistantId: "6d12a8fa-0ed0-4ec1-bfdb-e84587ff86c0",
    phoneId: "732f8fde-7e2b-4b35-9337-7cb0cb592374",
  },
};

async function sendEmail(store: string, customerPhone: string, opts: {
  summary?: string;
  transcript?: string;
  callType?: string;
  duration?: string;
  endedReason?: string;
  recordingUrl?: string;
}): Promise<{ success: boolean; detail: string }> {
  const config = STORES[store];
  if (!config) return { success: false, detail: `Unknown store: ${store}` };

  const callId = `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();

  const payload = {
    message: {
      type: "end-of-call-report",
      call: {
        id: callId,
        type: opts.callType || "inboundPhoneCall",
        status: "ended",
        startedAt: now,
        endedAt: now,
        phoneNumberId: config.phoneId,
        assistantId: config.assistantId,
        customer: { number: customerPhone },
        endedReason: opts.endedReason || "customer-ended-call",
        recordingUrl: opts.recordingUrl || null,
      },
      transcript: opts.transcript || `Customer called ${store}. ${opts.summary || "No transcript available."}`,
      summary: opts.summary || `Inbound call from ${customerPhone} to ${store}`,
      recordingUrl: opts.recordingUrl || null,
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
  const store = args.includes("--store") ? args[args.indexOf("--store") + 1] : null;
  const phone = args.includes("--phone") ? args[args.indexOf("--phone") + 1] : null;
  const summary = args.includes("--summary") ? args[args.indexOf("--summary") + 1] : undefined;
  const transcript = args.includes("--transcript") ? args[args.indexOf("--transcript") + 1] : undefined;

  if (!store || !phone) {
    console.log("Usage: npx tsx utilities/send-lead-email.ts --store <store> --phone <phone> [--summary <text>]");
    console.log('  npx tsx utilities/send-lead-email.ts --store "Serra Honda" --phone "+16155408535"');
    console.log('  npx tsx utilities/send-lead-email.ts --store "Ford of Columbia" --phone "+16782452756" --summary "Asked about F-150 pricing"');
    console.log("\nStores:", Object.keys(STORES).join(", "));
    console.log("\nThis sends a synthetic end-of-call webhook, which:");
    console.log("  1. Creates a conversation in TeamBox");
    console.log("  2. Attempts VIN lead insert");
    console.log("  3. Sends email notification to org admins");
    process.exit(0);
  }

  console.log(`Sending lead email for ${store}...`);
  console.log(`  Customer: ${phone}`);
  console.log(`  Summary: ${summary || "(auto-generated)"}`);
  console.log();

  const result = await sendEmail(store, phone, { summary, transcript });
  console.log(result.success ? "✓ Success" : "✗ Failed");
  console.log(result.detail);
}

main().catch(e => { console.error("FATAL:", e); process.exit(1); });
