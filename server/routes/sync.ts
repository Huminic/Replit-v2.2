import type { Express } from "express";
import { authenticateToken, requireRole } from "../auth";
import { storage } from "../storage";
import { runHistoricalBackfill, runDailyDelta, runMetricsRefresh } from "../sync";

/** Resolve orgId from query param, respecting role-based access. */
function resolveOrgIdParam(req: import("express").Request): string | null {
  if (!req.user) return null;
  const requestedOrgId = req.query.orgId as string | undefined;
  if (!requestedOrgId) return req.user.organizationId;
  if (requestedOrgId === req.user.organizationId) return requestedOrgId;
  if (req.user.roleLevel <= 2) return requestedOrgId;
  return null;
}

export function registerSyncRoutes(app: Express) {
  app.post("/api/sync/backfill", authenticateToken, requireRole(2), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const orgId = resolveOrgIdParam(req) || req.user.organizationId;
      const result = await runHistoricalBackfill(orgId);
      if (result.error) {
        return res.status(502).json({ message: "Backfill completed with errors", ...result });
      }
      return res.json({ message: "Backfill completed", ...result });
    } catch (err: any) {
      return res.status(500).json({ message: "Failed to run backfill", error: err.message });
    }
  });

  app.post("/api/sync/delta", authenticateToken, requireRole(2), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const orgId = resolveOrgIdParam(req) || req.user.organizationId;
      const result = await runDailyDelta(orgId);
      if (result.error) {
        return res.status(502).json({ message: "Delta sync completed with errors", ...result });
      }
      return res.json({ message: "Delta sync completed", ...result });
    } catch (err: any) {
      return res.status(500).json({ message: "Failed to run delta sync", error: err.message });
    }
  });

  app.post("/api/sync/metrics", authenticateToken, requireRole(2), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const orgId = resolveOrgIdParam(req) || req.user.organizationId;
      const result = await runMetricsRefresh(orgId);
      if (result.error) {
        return res.status(502).json({ message: "Metrics refresh completed with errors", ...result });
      }
      return res.json({ message: "Metrics refresh completed", ...result });
    } catch (err: any) {
      return res.status(500).json({ message: "Failed to refresh metrics", error: err.message });
    }
  });

  app.get("/api/sync/status", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const [backfill, delta, metrics] = await Promise.all([
        storage.getLatestSync(req.user.organizationId, "backfill"),
        storage.getLatestSync(req.user.organizationId, "daily_delta"),
        storage.getLatestSync(req.user.organizationId, "metrics_refresh"),
      ]);
      return res.json({ backfill: backfill || null, dailyDelta: delta || null, metricsRefresh: metrics || null });
    } catch (err: any) {
      return res.status(500).json({ message: "Failed to fetch sync status", error: err.message });
    }
  });

  app.get("/api/sync/logs", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const logs = await storage.getSyncLogs(req.user.organizationId, limit);
      return res.json(logs);
    } catch (err: any) {
      return res.status(500).json({ message: "Failed to fetch sync logs", error: err.message });
    }
  });

  app.get("/api/warehouse/leads", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const orgId = resolveOrgIdParam(req);
      if (!orgId) return res.status(403).json({ message: "Access denied: cannot view that organization" });
      const { status, limit = "100" } = req.query;
      const leads = await storage.getWarehouseLeads(orgId, {
        status: status as string | undefined,
        limit: Math.min(Number(limit) || 100, 500),
      });
      const total = await storage.getWarehouseLeadCount(orgId, {
        status: status as string | undefined,
      });
      return res.json({ items: leads, total });
    } catch (err: any) {
      return res.status(500).json({ message: "Failed to fetch warehouse leads", error: err.message });
    }
  });

  app.get("/api/warehouse/metrics", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const orgId = resolveOrgIdParam(req);
      if (!orgId) return res.status(403).json({ message: "Access denied: cannot view that organization" });
      const { metricKey, period } = req.query;
      const metrics = await storage.getWarehouseMetrics(orgId, {
        metricKey: metricKey as string | undefined,
        period: period as string | undefined,
      });
      return res.json(metrics);
    } catch (err: any) {
      return res.status(500).json({ message: "Failed to fetch warehouse metrics", error: err.message });
    }
  });
}
