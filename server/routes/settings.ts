import type { Express } from "express";
import { authenticateToken, requireRole } from "../auth";
import { storage } from "../storage";

export function registerSettingsRoutes(app: Express) {
  app.get("/api/settings/org", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const org = await storage.getOrganization(req.user.organizationId);
      if (!org) return res.status(404).json({ message: "Organization not found" });
      return res.json(org.settings || {});
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch org settings" });
    }
  });

  app.patch("/api/settings/org", authenticateToken, requireRole(3), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const org = await storage.getOrganization(req.user.organizationId);
      if (!org) return res.status(404).json({ message: "Organization not found" });
      const existingSettings = (org.settings || {}) as Record<string, any>;
      const mergedSettings = { ...existingSettings, ...req.body };
      const updated = await storage.updateOrganization(req.user.organizationId, { settings: mergedSettings } as any);
      if (!updated) return res.status(500).json({ message: "Failed to update settings" });

      storage.createActivityLog({
        userId: req.user.id,
        organizationId: req.user.organizationId,
        action: "settings_updated",
        entityType: "organization",
        entityId: req.user.organizationId,
        metadata: { sections: Object.keys(req.body) },
      }).catch(() => {});

      return res.json(mergedSettings);
    } catch (err) {
      return res.status(500).json({ message: "Failed to update org settings" });
    }
  });
}
