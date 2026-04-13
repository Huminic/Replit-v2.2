import type { Express } from "express";
import { authenticateToken } from "../auth";
import { storage } from "../storage";
import { resolveNexxusOrgId, callMCP, extractContactIdFromHref, flattenContactInfo } from "../vendorProxy";

/**
 * I-263: Resolve effective orgId — honors ?orgId query param for super_admin/partner_admin (roleLevel <= 2).
 */
function resolveMetricOrgId(req: import("express").Request): string | null {
  if (!req.user) return null;
  const requestedOrgId = req.query.orgId as string | undefined;
  if (!requestedOrgId) return req.user.organizationId;
  if (requestedOrgId === req.user.organizationId) return requestedOrgId;
  // roleLevel 1 = super_admin, 2 = partner_admin — can view any org
  if (req.user.roleLevel <= 2) return requestedOrgId;
  return null;
}

export function registerMetricsRoutes(app: Express) {
  app.get("/api/activity-log", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const orgId = resolveMetricOrgId(req);
      if (!orgId) return res.status(403).json({ message: "Access denied: cannot view that organization" });
      const logs = await storage.getActivityLogs(orgId, limit);
      return res.json(logs);
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch activity logs" });
    }
  });

  app.get("/api/metrics/dashboard", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const orgId = resolveMetricOrgId(req);
      if (!orgId) return res.status(403).json({ message: "Access denied: cannot view that organization" });
      const metrics = await storage.getDashboardMetrics(orgId);
      return res.json(metrics);
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  app.get("/api/metrics/pipeline", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const orgId = resolveMetricOrgId(req);
      if (!orgId) return res.status(403).json({ message: "Access denied: cannot view that organization" });
      const pipeline = await storage.getPipelineMetrics(orgId);
      return res.json(pipeline);
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch pipeline metrics" });
    }
  });

  app.get("/api/metrics/pipeline/details", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const metric = req.query.metric as string;
      const validMetrics = ['active_pipeline', 'appointments_today', 'open_escalations', 'outbound_sent', 'total_leads', 'new_leads'];
      if (!metric || !validMetrics.includes(metric)) {
        return res.status(400).json({ message: "Invalid metric. Use: " + validMetrics.join(', ') });
      }
      const orgId = resolveMetricOrgId(req);
      if (!orgId) return res.status(403).json({ message: "Access denied: cannot view that organization" });
      const details = await storage.getPipelineMetricDetails(orgId, metric);

      if (metric === 'active_pipeline') {
        const needsEnrichment = details.filter((r: any) => !r.customerName && r.sourceId);
        if (needsEnrichment.length > 0) {
          const detailOrgId = orgId;
          const nexxusOrgId = resolveNexxusOrgId(detailOrgId);
          (async () => {
            try {
              const now = new Date();
              const fourteenDaysAgo = new Date(now);
              fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
              const fmt = (d: Date) => d.toISOString().split("T")[0];

              const vinLeads = await callMCP("vin_query_leads", {
                orgId: nexxusOrgId, startDate: fmt(fourteenDaysAgo), endDate: fmt(now), limit: 100
              });
              const items = vinLeads?.items || vinLeads?.results || (Array.isArray(vinLeads) ? vinLeads : []);

              const leadToContactId = new Map<string, number>();
              for (const item of items) {
                const lid = String(item.leadId || item.id || "");
                const href = item.contact || item.ContactHref || "";
                if (lid && typeof href === "string") {
                  const cid = extractContactIdFromHref(href);
                  if (cid) leadToContactId.set(lid, cid);
                }
              }

              const toEnrich = needsEnrichment
                .filter((r: any) => leadToContactId.has(r.sourceId))
                .slice(0, 20);
              const uniqueContactIds = [...new Set(toEnrich.map((r: any) => leadToContactId.get(r.sourceId)!))];
              console.log(`[enrich-bg] enriching ${uniqueContactIds.length} contacts in background`);

              const contactWithTimeout = (cid: number) =>
                Promise.race([
                  callMCP("vin_get_contact", { orgId: nexxusOrgId, contactId: cid })
                    .then(raw => ({ cid, contact: flattenContactInfo(raw) })),
                  new Promise<null>((_, reject) => setTimeout(() => reject(new Error("timeout")), 8000)),
                ]);

              for (let i = 0; i < uniqueContactIds.length; i += 5) {
                const batch = uniqueContactIds.slice(i, i + 5);
                const results = await Promise.allSettled(batch.map(contactWithTimeout));
                for (const r of results) {
                  if (r.status === "fulfilled" && r.value) {
                    const { cid, contact } = r.value as { cid: number; contact: any };
                    const name = [contact.firstName, contact.lastName].filter(Boolean).join(" ") || null;
                    const sourceIds = toEnrich.filter((row: any) => leadToContactId.get(row.sourceId) === cid);
                    for (const row of sourceIds) {
                      storage.upsertWarehouseLead({
                        organizationId: orgId,
                        sourceId: row.sourceId,
                        dataSource: "vin_solutions",
                        customerName: name,
                        customerPhone: contact.phone || null,
                        customerEmail: contact.email || null,
                        vinStatus: row.vinStatus,
                        syncedAt: new Date(),
                      }).catch(() => {});
                    }
                    console.log(`[enrich-bg] cached contact ${cid}: ${name}`);
                  }
                }
              }
              console.log(`[enrich-bg] background enrichment complete`);
            } catch (err) {
              console.error("[enrich-bg] error:", err);
            }
          })();
        }
      }

      return res.json(details);
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch metric details" });
    }
  });
}
