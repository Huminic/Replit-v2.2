/**
 * Read-only probe of the central-mcp `vin_get_lead_sources` tool for Serra Honda.
 * Mirrors server/vendorProxy.ts:callMCP exactly: JSON-RPC over HTTPS to
 *   ${MCP_BASE_URL}/dax/mcp  (default https://mcp.huminicdev.com/dax/mcp)
 * with VINSOLUTIONS_API_KEY bearer.
 *
 * Does NOT print the bearer token. Only reports response shape + count.
 */
import "dotenv/config";
import https from "https";

const SERRA_HONDA_NEXXUS_ORG_ID = "24d64f99-ba04-4b43-af35-fd06f555ac86";

function callMCP(toolName: string, args: Record<string, unknown>): Promise<any> {
  const MCP_BASE_URL = process.env.MCP_BASE_URL || "https://mcp.huminicdev.com";
  const mcpUrl = process.env.VINSOLUTIONS_MCP_URL || `${MCP_BASE_URL}/dax/mcp`;
  const token = process.env.VINSOLUTIONS_API_KEY;
  if (!token) return Promise.reject(new Error("VINSOLUTIONS_API_KEY not configured"));

  return new Promise((resolve, reject) => {
    const parsed = new URL(mcpUrl);
    const body = JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method: "tools/call",
      params: { name: toolName, arguments: args },
    });
    const req = https.request(
      parsed,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
        },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          const lines = data.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const p = JSON.parse(line.slice(6));
                if (p.result?.isError) {
                  return reject(new Error(p.result.content?.[0]?.text || "MCP error"));
                }
                const content = p.result?.content?.[0]?.text;
                if (content) {
                  try { return resolve(JSON.parse(content)); }
                  catch { return resolve(content); }
                }
                return resolve(p.result);
              } catch (e) {
                return reject(new Error("Parse error: " + (e as Error).message));
              }
            }
          }
          reject(new Error("No data in MCP response. Raw: " + data.slice(0, 500)));
        });
      },
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log("Calling vin_get_lead_sources for Serra Honda (limit:200)...");
  const data = await callMCP("vin_get_lead_sources", {
    orgId: SERRA_HONDA_NEXXUS_ORG_ID,
    limit: 200,
    pageSize: 200,
  });
  const items = Array.isArray(data) ? data : (data?.items || data?.leadSources || []);
  console.log(JSON.stringify({
    top_level_keys: data && typeof data === "object" ? Object.keys(data) : null,
    item_count: items.length,
    first_item_keys: items[0] ? Object.keys(items[0]) : null,
    first_3_items: items.slice(0, 3),
    last_item: items.length > 3 ? items[items.length - 1] : null,
    has_id_7098: items.some((i: any) =>
      String(i.leadSourceId || i.id || i.sourceId || "") === "7098"),
    has_id_362: items.some((i: any) =>
      String(i.leadSourceId || i.id || i.sourceId || "") === "362"),
    all_ids_returned: items
      .map((i: any) => String(i.leadSourceId || i.id || i.sourceId || ""))
      .filter(Boolean)
      .sort(),
  }, null, 2));
}
main().catch((err) => {
  console.error("FAILED:", (err as Error).message);
  process.exit(1);
});
