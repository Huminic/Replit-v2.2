/**
 * Cross-tabulate MCP-returned IDs vs warehouse IDs for Serra Honda.
 * Reads both the DB (distinct lead_source IDs in last 30d, with lead counts)
 * and the MCP (vin_get_lead_sources). Reports:
 *   - intersection (resolved): IDs present in both
 *   - left-only (unresolved):  IDs in DB but not MCP
 *   - right-only (orphan):     IDs in MCP but not used by any 30d lead
 *   - lead-coverage percentage: how many of 608 leads have a resolvable source
 *   - distinct-id-coverage:    how many of 58 distinct IDs are in the MCP map
 */
import "dotenv/config";
import https from "https";
import pg from "pg";

const SERRA_HONDA_ORG_ID = "24d64f99-ba04-4b43-af35-fd06f555ac86";
const VIN_LEADSOURCE_RE = /\/leadsources\/id\/(\d+)/i;

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
  const url = process.env.DATABASE_URL;
  if (!url) { console.error("DATABASE_URL not set"); process.exit(2); }
  const pool = new pg.Pool({ connectionString: url, max: 1 });

  try {
    // DB side
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dbRes = await pool.query<{ lead_source: string | null; cnt: string }>(
      `SELECT lead_source, COUNT(*)::text AS cnt
       FROM warehouse_leads
       WHERE organization_id = $1
         AND COALESCE(vin_created_at, synced_at) >= $2
       GROUP BY lead_source
       ORDER BY COUNT(*) DESC`,
      [SERRA_HONDA_ORG_ID, since],
    );

    const dbIdToCount = new Map<string, number>();
    let nullOrNonUrlLeads = 0;
    for (const r of dbRes.rows) {
      if (!r.lead_source) { nullOrNonUrlLeads += Number(r.cnt); continue; }
      const m = r.lead_source.match(VIN_LEADSOURCE_RE);
      if (!m) { nullOrNonUrlLeads += Number(r.cnt); continue; }
      const id = m[1];
      dbIdToCount.set(id, (dbIdToCount.get(id) || 0) + Number(r.cnt));
    }
    const totalLeads = Array.from(dbIdToCount.values()).reduce((a, b) => a + b, 0) + nullOrNonUrlLeads;

    // MCP side
    const data = await callMCP("vin_get_lead_sources", {
      orgId: SERRA_HONDA_ORG_ID, limit: 200, pageSize: 200,
    });
    const items = Array.isArray(data) ? data : (data?.items || data?.leadSources || []);
    const mcpIdToName = new Map<string, string>();
    for (const it of items) {
      const id = String(it.leadSourceId || it.id || it.sourceId || "");
      const name = it.leadSourceName || it.name || it.description || "";
      if (id && name) mcpIdToName.set(id, name);
    }

    // Cross-tab
    const dbIds = new Set(dbIdToCount.keys());
    const mcpIds = new Set(mcpIdToName.keys());
    const resolved: string[] = [];
    const unresolved: { id: string; count: number }[] = [];
    let resolvedLeadCount = 0;
    for (const id of dbIds) {
      if (mcpIds.has(id)) {
        resolved.push(id);
        resolvedLeadCount += dbIdToCount.get(id) || 0;
      } else {
        unresolved.push({ id, count: dbIdToCount.get(id) || 0 });
      }
    }
    unresolved.sort((a, b) => b.count - a.count);

    const orphans: string[] = [];
    for (const id of mcpIds) if (!dbIds.has(id)) orphans.push(id);

    console.log(JSON.stringify({
      org: "Serra Honda",
      window_days: 30,
      total_leads: totalLeads,
      null_or_non_url_lead_count: nullOrNonUrlLeads,

      db_distinct_ids: dbIds.size,
      mcp_distinct_ids: mcpIds.size,

      resolved_id_count: resolved.length,
      resolved_lead_count: resolvedLeadCount,
      resolved_lead_pct: totalLeads > 0
        ? Math.round((resolvedLeadCount / totalLeads) * 1000) / 10
        : 0,

      unresolved_id_count: unresolved.length,
      unresolved_lead_count: totalLeads - resolvedLeadCount - nullOrNonUrlLeads,
      unresolved_lead_pct: totalLeads > 0
        ? Math.round(((totalLeads - resolvedLeadCount - nullOrNonUrlLeads) / totalLeads) * 1000) / 10
        : 0,

      orphan_mcp_id_count: orphans.length,
      orphan_mcp_id_sample: orphans.slice(0, 10).map(id => ({ id, name: mcpIdToName.get(id) })),

      top_10_unresolved_by_lead_count: unresolved.slice(0, 10),
      top_5_resolved_with_names: resolved.slice(0, 5).map(id => ({
        id, name: mcpIdToName.get(id), lead_count: dbIdToCount.get(id),
      })),
    }, null, 2));
  } finally {
    await pool.end();
  }
}
main().catch(err => { console.error(err); process.exit(1); });
