/**
 * Read-only probe: what does vin_query_leads actually return for raw.source?
 * Specifically: is raw.source.name populated, or do we ALWAYS fall through
 * to raw.leadSource (the URL)?
 *
 * If raw.source.name IS populated for SOME leads, that's a free win for
 * sync.ts:transformVinLead — we'd be storing names already.
 * If raw.source is ONLY ever the URL/href, then sync-time resolution
 * requires the MCP map (which has the 67% coverage gap).
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
      jsonrpc: "2.0", id: Date.now(),
      method: "tools/call",
      params: { name: toolName, arguments: args },
    });
    const req = https.request(parsed, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
      },
    }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        const lines = data.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const p = JSON.parse(line.slice(6));
              if (p.result?.isError) return reject(new Error(p.result.content?.[0]?.text || "MCP error"));
              const content = p.result?.content?.[0]?.text;
              if (content) { try { return resolve(JSON.parse(content)); } catch { return resolve(content); } }
              return resolve(p.result);
            } catch (e) { return reject(new Error("Parse error")); }
          }
        }
        reject(new Error("No data"));
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  const now = new Date();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const data = await callMCP("vin_query_leads", {
    orgId: SERRA_HONDA_NEXXUS_ORG_ID,
    startDate: fmt(sevenDaysAgo),
    endDate: fmt(now),
    limit: 30,
  });
  const items = data?.items || data?.results || (Array.isArray(data) ? data : []);
  let sourceObjShape = 0;
  let sourceStringShape = 0;
  let sourceNullShape = 0;
  let sourceWithName = 0;
  let leadSourceUrlShape = 0;
  const sampleShapes: any[] = [];
  for (const it of items) {
    if (typeof it.source === "object" && it.source !== null) {
      sourceObjShape++;
      if (it.source.name) sourceWithName++;
      if (sampleShapes.length < 3) {
        sampleShapes.push({
          source: it.source,
          leadSource: it.leadSource,
          id: it.leadId || it.id,
        });
      }
    } else if (typeof it.source === "string") {
      sourceStringShape++;
    } else {
      sourceNullShape++;
    }
    if (typeof it.leadSource === "string" && it.leadSource.includes("/leadsources/id/")) {
      leadSourceUrlShape++;
    }
  }
  console.log(JSON.stringify({
    item_count: items.length,
    source_field_object_count: sourceObjShape,
    source_field_with_name: sourceWithName,
    source_field_string_count: sourceStringShape,
    source_field_null_count: sourceNullShape,
    leadSource_url_count: leadSourceUrlShape,
    sample_source_shapes: sampleShapes,
    first_item_keys: items[0] ? Object.keys(items[0]).sort() : null,
  }, null, 2));
}
main().catch(err => { console.error("FAILED:", (err as Error).message); process.exit(1); });
