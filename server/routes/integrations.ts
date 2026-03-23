import type { Express } from "express";
import http from "http";
import { authenticateToken, requireRole } from "../auth";
import { storage } from "../storage";
import { z } from "zod";
import { registerVendorRoutes, callMCP, resolveNexxusOrgId } from "../vendorProxy";

const VIN_SAFE_MCP_URL = process.env.VIN_SAFE_MCP_URL || "http://0.0.0.0:4003/mcp";
const VIN_SAFE_MCP_TOKEN = process.env.VIN_SAFE_MCP_TOKEN || "8NCVZ8ZCgHtab6A+FxHsgOKcgir89KvOR+wMIpYFLp4=";

function callVinSafeMCP(toolName: string, args: Record<string, unknown>): Promise<any> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(VIN_SAFE_MCP_URL);
    const body = JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method: "tools/call",
      params: { name: toolName, arguments: args },
    });

    const req = http.request(parsed, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VIN_SAFE_MCP_TOKEN}`,
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

export function registerIntegrationRoutes(app: Express) {
  registerVendorRoutes(app);

  app.get("/api/integrations", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const filters: { provider?: string } = {};
      if (req.query.provider) filters.provider = req.query.provider as string;
      const list = await storage.getIntegrations(req.user.organizationId, filters);
      return res.json(list);
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch integrations" });
    }
  });

  app.post("/api/integrations/provision", authenticateToken, requireRole(2), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const bodySchema = z.object({
        organizationId: z.string().uuid(),
        dealerId: z.number().int().positive(),
        dealerName: z.string().min(1),
        provider: z.string().default("vinsolutions"),
      });
      const parsed = bodySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid provision data", errors: parsed.error.flatten() });
      }
      const { organizationId, dealerId, dealerName, provider } = parsed.data;

      const nexxusOrgId = resolveNexxusOrgId(organizationId);
      const mcpResult = await callMCP("vin_provision_dealer", {
        orgId: nexxusOrgId,
        dealerId,
        dealerName,
      });

      const integrationId = mcpResult.integrationId || mcpResult.id;
      const status = mcpResult.status || "active";

      const integration = await storage.createIntegration({
        organizationId,
        provider,
        externalDealerId: String(dealerId),
        externalDealerName: dealerName,
        externalIntegrationId: integrationId,
        status,
        nexxusOrgId,
      });

      return res.status(201).json({ integration, mcpResult });
    } catch (err: any) {
      return res.status(502).json({ message: "Failed to provision dealer", error: err.message });
    }
  });

  // GET /api/vin/users/:orgId — proxy to vin_list_users on safe MCP (G-13.3)
  app.get("/api/vin/users/:orgId", authenticateToken, requireRole(3), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const orgId = req.params.orgId as string;

      // Resolve to VIN dealer ID
      const integration = await storage.getIntegrations(orgId, { provider: "vinsolutions" });
      if (!integration || integration.length === 0) {
        return res.status(404).json({ message: "No VIN Solutions integration found for this org" });
      }
      const dealerId = parseInt(integration[0].externalDealerId || "0", 10);
      if (!dealerId) {
        return res.status(400).json({ message: "No dealer ID configured" });
      }

      const result = await callVinSafeMCP("vin_list_users", { dealerId });
      const users = Array.isArray(result) ? result : (result?.users || result?.data || []);

      // Format as "FullName — UserGroup" for the dropdown
      const formatted = users.map((u: any) => ({
        userId: u.UserId || u.userId || u.id,
        fullName: u.FullName || u.fullName || `${u.FirstName || ''} ${u.LastName || ''}`.trim(),
        userGroup: u.UserGroup || u.userGroup || u.GroupName || '',
        displayLabel: `${u.FullName || u.fullName || `${u.FirstName || ''} ${u.LastName || ''}`.trim()} — ${u.UserGroup || u.userGroup || u.GroupName || 'No Group'}`,
      }));

      return res.json({ dealerId, users: formatted });
    } catch (err: any) {
      return res.status(502).json({ message: "Failed to fetch VIN users", error: err.message });
    }
  });
}
