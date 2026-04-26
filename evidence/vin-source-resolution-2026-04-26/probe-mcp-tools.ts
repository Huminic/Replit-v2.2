/**
 * List all tools the central-mcp exposes via JSON-RPC tools/list.
 * Read-only. We only want to verify whether there's an alternative
 * lead-source resolver tool we haven't tried (e.g. vin_get_lead_source by id).
 */
import "dotenv/config";
import https from "https";

function callMCP(method: string, params: Record<string, unknown>): Promise<any> {
  const MCP_BASE_URL = process.env.MCP_BASE_URL || "https://mcp.huminicdev.com";
  const mcpUrl = process.env.VINSOLUTIONS_MCP_URL || `${MCP_BASE_URL}/dax/mcp`;
  const token = process.env.VINSOLUTIONS_API_KEY;
  if (!token) return Promise.reject(new Error("VINSOLUTIONS_API_KEY not configured"));
  return new Promise((resolve, reject) => {
    const parsed = new URL(mcpUrl);
    const body = JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params });
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
  const result = await callMCP("tools/list", {});
  const tools = result?.tools || [];
  const leadSourceTools = tools.filter((t: any) => /lead.*source|leadsource/i.test(t.name));
  console.log(JSON.stringify({
    total_tools: tools.length,
    lead_source_related_tools: leadSourceTools.map((t: any) => ({
      name: t.name,
      description: (t.description || "").slice(0, 200),
    })),
    all_vin_tool_names: tools
      .filter((t: any) => t.name.startsWith("vin_"))
      .map((t: any) => t.name)
      .sort(),
  }, null, 2));
}
main().catch(err => { console.error("FAILED:", (err as Error).message); process.exit(1); });
