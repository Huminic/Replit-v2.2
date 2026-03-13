import type { Express } from "express";
import { authenticateToken, requireRole } from "../auth";
import { storage } from "../storage";
import { billingService } from "../services/billingService";

export function registerUsageRoutes(app: Express) {
  app.get("/api/outbound/status", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const globalEnabled = process.env.OUTBOUND_LIVE_ENABLED === "true";
      const org = await storage.getOrganization(req.user.organizationId);
      const settings = (org?.settings as Record<string, any>) || {};
      return res.json({
        globalKillSwitch: globalEnabled,
        orgOutboundEnabled: org?.outboundEnabled ?? false,
        smsEnabled: org?.smsEnabled ?? false,
        emailEnabled: org?.emailEnabled ?? false,
        phoneEnabled: org?.phoneEnabled ?? false,
        videoEnabled: org?.videoEnabled ?? false,
        rateLimitMax: settings.rateLimitMax ?? 3,
        effectiveStatus: globalEnabled && (org?.outboundEnabled ?? false),
      });
    } catch (err) {
      return res.status(500).json({ message: "Failed to get outbound status" });
    }
  });

  app.get("/api/usage", authenticateToken, requireRole(3), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const { startDate, endDate, eventType } = req.query;
      const filters: { startDate?: Date; endDate?: Date; eventType?: string } = {};
      if (startDate && typeof startDate === "string") filters.startDate = new Date(startDate);
      if (endDate && typeof endDate === "string") filters.endDate = new Date(endDate);
      if (eventType && typeof eventType === "string") filters.eventType = eventType;
      const events = await storage.getUsageEvents(req.user.organizationId, filters);
      return res.json(events);
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch usage events" });
    }
  });

  app.get("/api/usage/summary", authenticateToken, requireRole(3), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const now = new Date();
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : now;

      const orgIds: string[] = [];
      if (req.user.roleLevel <= 2) {
        const allOrgs = await storage.getOrganizations();
        const partnerOrgs = req.user.roleLevel === 1
          ? allOrgs
          : allOrgs.filter(o => o.partnerId === req.user!.organizationId || o.id === req.user!.organizationId);
        orgIds.push(...partnerOrgs.map(o => o.id));
      } else {
        orgIds.push(req.user.organizationId);
      }

      const summaries = await Promise.all(
        orgIds.map(async (orgId) => {
          const summary = await storage.getUsageSummary(orgId, startDate, endDate);
          const org = await storage.getOrganization(orgId);
          return { organizationId: orgId, organizationName: org?.name || "Unknown", period: { start: startDate.toISOString(), end: endDate.toISOString() }, usage: summary };
        })
      );

      return res.json(summaries);
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch usage summary" });
    }
  });

  app.get("/api/billing/usage", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const orgId = (req.query.org_id as string) || req.user.organizationId;
      if (orgId !== req.user.organizationId && req.user.roleLevel > 2) {
        return res.status(403).json({ message: "Access denied" });
      }

      const now = new Date();
      const period = (req.query.period as string) || "current_month";
      let startDate: Date, endDate: Date;
      if (period === "current_month") {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = now;
      } else if (period === "last_month") {
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      } else {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = now;
      }

      const summary = await storage.getUsageSummary(orgId, startDate, endDate);
      const org = await storage.getOrganization(orgId);
      return res.json({
        organizationId: orgId,
        organizationName: org?.name || "Unknown",
        period: { start: startDate.toISOString(), end: endDate.toISOString() },
        usage: summary,
      });
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch billing usage" });
    }
  });
}
