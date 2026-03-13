import type { Express } from "express";
import { authenticateToken, requireRole } from "../auth";
import { storage } from "../storage";
import { z } from "zod";
import { registerVendorRoutes, callMCP, resolveNexxusOrgId } from "../vendorProxy";

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
}
