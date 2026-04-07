const fs = require("fs");
const path = "/home/ubuntu/Claude-store/nexxus2.2_replit/server/sync.ts";
let code = fs.readFileSync(path, "utf8");

// Fix 1: queryCount reads wrong field — add r.totalItems as first fallback
const old1 = `.then((r: any) => r.count ?? r.items?.length ?? 0)`;
const new1 = `.then((r: any) => r.totalItems ?? r.count ?? r.items?.length ?? 0)`;
if (!code.includes(old1)) { console.error("Fix 1: pattern not found"); process.exit(1); }
code = code.replace(old1, new1);
console.log("Fix 1 applied: queryCount now reads r.totalItems first");

// Fix 2: Filter scheduler to only VIN-enabled orgs
const old2 = `  const orgs = await storage.getOrganizations();
  const orgIds = orgs.map(o => o.id);`;
const new2 = `  const orgs = await storage.getOrganizations();
  const allIntegrations = await Promise.all(
    orgs.map(o => storage.getIntegrations(o.id, { provider: "vinsolutions" }))
  );
  const orgIds = orgs
    .filter((_, i) => allIntegrations[i].length > 0 && allIntegrations[i][0].status === "active")
    .map(o => o.id);`;
if (!code.includes(old2)) { console.error("Fix 2: pattern not found"); process.exit(1); }
code = code.replace(old2, new2);
console.log("Fix 2 applied: scheduler filtered to VIN-enabled orgs only");

fs.writeFileSync(path, code);
console.log("sync.ts updated successfully");
