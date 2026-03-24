/**
 * vin-insert.ts — Manually insert a contact/lead into VIN Solutions
 *
 * Usage:
 *   npx tsx utilities/vin-insert.ts --store "Serra Honda" --name "John Smith" --phone "2055551234"
 *   npx tsx utilities/vin-insert.ts --store "Ford of Columbia" --name "Jane Doe" --phone "6155559876" --source "Phone - AI Voice Agent"
 *   npx tsx utilities/vin-insert.ts --store "all" --list   # show dealer IDs and current VIN user config
 *
 * Inserts into Durran Cage's VIN Solutions account under the specified store.
 * Uses the VIN Safe MCP server (port 4003) for the prepare→execute flow.
 */

const VIN_SAFE_URL = process.env.VIN_SAFE_MCP_URL || "http://0.0.0.0:4003/mcp";
const VIN_SAFE_TOKEN = process.env.VIN_SAFE_MCP_TOKEN || "8NCVZ8ZCgHtab6A+FxHsgOKcgir89KvOR+wMIpYFLp4=";
const APP_URL = process.env.APP_URL || "https://dev.huminicdev.com";

const STORES: Record<string, { dealerId: number; orgId: string }> = {
  "Serra Honda": { dealerId: 21043, orgId: "f4c56901-89ab-4497-9bfb-69e6495a4839" },
  "Serra Nissan": { dealerId: 21044, orgId: "7f6455be-bed6-466a-9020-7aab1d600ec7" },
  "Tony Serra Ford": { dealerId: 21047, orgId: "e24e580f-216e-4188-95d9-03d05bec3b30" },
  "Ford of Columbia": { dealerId: 13398, orgId: "c1f6667c-9966-452b-9dd1-635862318cbd" },
  "Hyundai of Columbia": { dealerId: 13399, orgId: "9d2c3591-d2c5-47d5-9051-0daf84b22f1e" },
};

import http from "http";

function callVinSafe(toolName: string, args: Record<string, unknown>): Promise<any> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(VIN_SAFE_URL);
    const body = JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method: "tools/call",
      params: { name: toolName, arguments: args },
    });

    const req = http.request(parsed, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VIN_SAFE_TOKEN}`,
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
      },
    }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        const lines = data.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const parsed = JSON.parse(line.slice(6));
              if (parsed.result?.content?.[0]?.text) {
                resolve(JSON.parse(parsed.result.content[0].text));
                return;
              }
            } catch {}
          }
        }
        try { resolve(JSON.parse(data)); } catch { resolve(data); }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  const args = process.argv.slice(2);
  const store = args.includes("--store") ? args[args.indexOf("--store") + 1] : null;
  const name = args.includes("--name") ? args[args.indexOf("--name") + 1] : null;
  const phone = args.includes("--phone") ? args[args.indexOf("--phone") + 1] : null;
  const source = args.includes("--source") ? args[args.indexOf("--source") + 1] : "Phone - AI Voice Agent";
  const listMode = args.includes("--list");

  if (listMode) {
    console.log("Store configurations:");
    for (const [name, config] of Object.entries(STORES)) {
      console.log(`  ${name}: dealerId=${config.dealerId}, orgId=${config.orgId}`);
    }
    return;
  }

  if (!store || !name || !phone) {
    console.log("Usage: npx tsx utilities/vin-insert.ts --store <store> --name <name> --phone <phone>");
    console.log('  npx tsx utilities/vin-insert.ts --store "Serra Honda" --name "John Smith" --phone "2055551234"');
    console.log("  npx tsx utilities/vin-insert.ts --list");
    console.log("\nStores:", Object.keys(STORES).join(", "));
    process.exit(0);
  }

  const storeConfig = STORES[store];
  if (!storeConfig) {
    console.error(`Unknown store: ${store}`);
    console.log("Available:", Object.keys(STORES).join(", "));
    process.exit(1);
  }

  const nameParts = name.split(" ");
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(" ") || "Unknown";
  const cleanPhone = phone.replace(/\D/g, "").replace(/^1(\d{10})$/, "$1");

  console.log(`Inserting into VIN Solutions:`);
  console.log(`  Store: ${store} (dealer ${storeConfig.dealerId})`);
  console.log(`  Name: ${firstName} ${lastName}`);
  console.log(`  Phone: ${cleanPhone}`);
  console.log(`  Source: ${source}`);
  console.log();

  // Step 1: Prepare
  console.log("Step 1: Preparing lead...");
  try {
    const prepResult = await callVinSafe("vin_safe_prepare_lead", {
      dealerId: storeConfig.dealerId,
      firstName,
      lastName,
      phone: cleanPhone,
      leadSourceName: source,
    });
    console.log("Prepare result:", JSON.stringify(prepResult, null, 2));

    if (prepResult.approvalToken) {
      console.log("\nStep 2: Executing with approval token...");
      const execResult = await callVinSafe("vin_safe_execute_lead", {
        approvalToken: prepResult.approvalToken,
        user_confirmed: true,
      });
      console.log("Execute result:", JSON.stringify(execResult, null, 2));
    } else {
      console.log("\nNo approval token — check prepare result for errors.");
    }
  } catch (err: any) {
    console.error("VIN insert failed:", err.message);
  }
}

main().catch(e => { console.error("FATAL:", e); process.exit(1); });
