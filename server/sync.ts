import { storage } from "./storage";
import { callMCP, resolveNexxusOrgId, warmIntegrationCache } from "./vendorProxy";
import type { InsertWarehouseLead, InsertWarehouseMetric } from "@shared/schema";

interface SyncResult {
  processed: number;
  failed: number;
  error?: string;
}

function transformVinLead(raw: any, organizationId: string): InsertWarehouseLead {
  const name = [raw.contact?.firstName, raw.contact?.lastName].filter(Boolean).join(" ") || raw.customerName || null;
  return {
    organizationId,
    sourceId: String(raw.id || raw.leadId || ""),
    dataSource: "vin_solutions",
    vinStatus: raw.status || raw.leadStatus || null,
    customerName: name,
    customerEmail: raw.contact?.email || raw.email || null,
    customerPhone: raw.contact?.phone || raw.phone || null,
    leadSource: raw.source?.name || raw.leadSource || null,
    vehicleOfInterest: (Array.isArray(raw.vehiclesOfInterest) && raw.vehiclesOfInterest.length > 0 ? String(raw.vehiclesOfInterest[0]) : null) || raw.vehicle?.description || raw.vehicleOfInterest || null,
    assignedSalesperson: raw.salesperson?.name || raw.assignedSalesperson || null,
    dealerName: raw.dealer?.name || raw.dealerName || null,
    vinCreatedAt: raw.createdUtc ? new Date(raw.createdUtc) : raw.createdDate ? new Date(raw.createdDate) : raw.createdAt ? new Date(raw.createdAt) : null,
    vinUpdatedAt: raw.modifiedUtc ? new Date(raw.modifiedUtc) : raw.modifiedDate ? new Date(raw.modifiedDate) : raw.updatedAt ? new Date(raw.updatedAt) : null,
    syncedAt: new Date(),
  };
}

export async function runHistoricalBackfill(organizationId: string): Promise<SyncResult> {
  await warmIntegrationCache(organizationId);
  const nexxusOrgId = resolveNexxusOrgId(organizationId);
  const logEntry = await storage.createSyncLog({
    organizationId,
    syncType: "backfill",
    status: "running",
    startedAt: new Date(),
  });

  let processed = 0;
  let failed = 0;

  try {
    const now = new Date();
    const ninetyDaysAgo = new Date(now);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const fmt = (d: Date) => d.toISOString().split("T")[0];

    const windowDays = 7;
    let windowStart = new Date(ninetyDaysAgo);

    while (windowStart < now) {
      const windowEnd = new Date(windowStart);
      windowEnd.setDate(windowEnd.getDate() + windowDays);
      if (windowEnd > now) windowEnd.setTime(now.getTime());

      const data = await callMCP("vin_query_leads", {
        orgId: nexxusOrgId,
        startDate: fmt(windowStart),
        endDate: fmt(windowEnd),
        limit: 100,
      });

      const items = data?.items || data?.results || (Array.isArray(data) ? data : []);

      for (const raw of items) {
        try {
          const lead = transformVinLead(raw, organizationId);
          await storage.upsertWarehouseLead(lead);
          processed++;
        } catch (err) {
          failed++;
          console.error("Failed to upsert lead:", err);
        }
      }

      windowStart = new Date(windowEnd);
    }

    await storage.updateSyncLog(logEntry.id, {
      status: "completed",
      recordsProcessed: processed,
      recordsFailed: failed,
      completedAt: new Date(),
    });

    storage.createActivityLog({
      organizationId,
      action: "sync_backfill_completed",
      entityType: "sync",
      entityId: logEntry.id,
      metadata: { processed, failed },
    }).catch(() => {});

    return { processed, failed };
  } catch (err: any) {
    const errorMessage = err.message || "Backfill failed";
    await storage.updateSyncLog(logEntry.id, {
      status: "failed",
      recordsProcessed: processed,
      recordsFailed: failed,
      completedAt: new Date(),
      errorMessage,
    });

    storage.createActivityLog({
      organizationId,
      action: "sync_backfill_failed",
      entityType: "sync",
      entityId: logEntry.id,
      metadata: { error: errorMessage },
    }).catch(() => {});

    return { processed, failed, error: errorMessage };
  }
}

export async function runDailyDelta(organizationId: string): Promise<SyncResult> {
  await warmIntegrationCache(organizationId);
  const nexxusOrgId = resolveNexxusOrgId(organizationId);
  const logEntry = await storage.createSyncLog({
    organizationId,
    syncType: "daily_delta",
    status: "running",
    startedAt: new Date(),
  });

  let processed = 0;
  let failed = 0;

  try {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const fmt = (d: Date) => d.toISOString().split("T")[0];

    const data = await callMCP("vin_query_leads", {
      orgId: nexxusOrgId,
      startDate: fmt(yesterday),
      endDate: fmt(now),
      limit: 100,
    });

    const items = data?.items || data?.results || (Array.isArray(data) ? data : []);

    for (const raw of items) {
      try {
        const lead = transformVinLead(raw, organizationId);
        await storage.upsertWarehouseLead(lead);
        processed++;
      } catch (err) {
        failed++;
        console.error("Failed to upsert delta lead:", err);
      }
    }

    await storage.updateSyncLog(logEntry.id, {
      status: "completed",
      recordsProcessed: processed,
      recordsFailed: failed,
      completedAt: new Date(),
    });

    storage.createActivityLog({
      organizationId,
      action: "sync_delta_completed",
      entityType: "sync",
      entityId: logEntry.id,
      metadata: { processed, failed },
    }).catch(() => {});

    return { processed, failed };
  } catch (err: any) {
    const errorMessage = err.message || "Delta sync failed";
    await storage.updateSyncLog(logEntry.id, {
      status: "failed",
      recordsProcessed: processed,
      recordsFailed: failed,
      completedAt: new Date(),
      errorMessage,
    });

    return { processed, failed, error: errorMessage };
  }
}

export async function runMetricsRefresh(organizationId: string): Promise<SyncResult> {
  await warmIntegrationCache(organizationId);
  const nexxusOrgId = resolveNexxusOrgId(organizationId);
  const logEntry = await storage.createSyncLog({
    organizationId,
    syncType: "metrics_refresh",
    status: "running",
    startedAt: new Date(),
  });

  let processed = 0;
  let failed = 0;

  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const fmt = (d: Date) => d.toISOString().split("T")[0];

    const curStart = fmt(thirtyDaysAgo);
    const curEnd = fmt(now);
    const prevStart = fmt(sixtyDaysAgo);
    const prevEnd = fmt(thirtyDaysAgo);
    const period = `${curStart}_${curEnd}`;

    const queryCount = (startDate: string, endDate: string, status?: string) =>
      callMCP("vin_query_leads", {
        orgId: nexxusOrgId, startDate, endDate, limit: 1,
        ...(status ? { status } : {}),
      }).then((r: any) => r.count ?? r.items?.length ?? 0).catch(() => 0);

    const [
      curTotal, prevTotal,
      curSoldDelivered, prevSoldDelivered,
      curSoldPending, prevSoldPending,
      curSoldOnOrder,
      curActiveNew, prevActiveNew,
      curActiveWaiting, prevActiveWaiting,
      curActiveActive, prevActiveActive,
      curActiveAppt,
      curLostNoResponse,
      curLostNoAgreement,
      curLostBadCredit,
      curLostCompleted,
    ] = await Promise.all([
      queryCount(curStart, curEnd),
      queryCount(prevStart, prevEnd),
      queryCount(curStart, curEnd, "SOLD_DELIVERED"),
      queryCount(prevStart, prevEnd, "SOLD_DELIVERED"),
      queryCount(curStart, curEnd, "SOLD_PENDING_FINANCE"),
      queryCount(prevStart, prevEnd, "SOLD_PENDING_FINANCE"),
      queryCount(curStart, curEnd, "SOLD_ON_ORDER"),
      queryCount(curStart, curEnd, "ACTIVE_NEW_LEAD"),
      queryCount(prevStart, prevEnd, "ACTIVE_NEW_LEAD"),
      queryCount(curStart, curEnd, "ACTIVE_WAITING_FOR_PROSPECT_RESPONSE"),
      queryCount(prevStart, prevEnd, "ACTIVE_WAITING_FOR_PROSPECT_RESPONSE"),
      queryCount(curStart, curEnd, "ACTIVE_ACTIVE_LEAD"),
      queryCount(prevStart, prevEnd, "ACTIVE_ACTIVE_LEAD"),
      queryCount(curStart, curEnd, "ACTIVE_SET_APPOINTMENT"),
      queryCount(curStart, curEnd, "LOST_DID_NOT_RESPOND"),
      queryCount(curStart, curEnd, "LOST_NO_AGREEMENT_REACHED"),
      queryCount(curStart, curEnd, "LOST_BAD_CREDIT"),
      queryCount(curStart, curEnd, "LOST_LEAD_PROCESS_COMPLETED"),
    ]);

    const soldLeads = curSoldDelivered + curSoldPending + curSoldOnOrder;
    const prevSoldLeads = prevSoldDelivered + prevSoldPending;
    const activeLeads = curActiveNew + curActiveWaiting + curActiveActive + curActiveAppt;
    const prevActiveLeads = prevActiveNew + prevActiveWaiting + prevActiveActive;
    const lostLeads = curLostNoResponse + curLostNoAgreement + curLostBadCredit + curLostCompleted;
    const pctChange = (cur: number, prev: number) =>
      prev === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - prev) / prev) * 100);

    const metricsMap: Record<string, string> = {
      totalLeads: String(curTotal),
      totalLeadsChange: String(pctChange(curTotal, prevTotal)),
      newLeads: String(curActiveNew),
      newLeadsChange: String(pctChange(curActiveNew, prevActiveNew)),
      activeLeads: String(activeLeads),
      activeLeadsChange: String(pctChange(activeLeads, prevActiveLeads)),
      soldLeads: String(soldLeads),
      soldLeadsChange: String(pctChange(soldLeads, prevSoldLeads)),
      lostLeads: String(lostLeads),
      waitingForResponse: String(curActiveWaiting),
      appointments: String(curActiveAppt),
      conversionRate: String(curTotal > 0 ? Math.round((soldLeads / curTotal) * 100) : 0),
    };

    for (const [key, value] of Object.entries(metricsMap)) {
      try {
        await storage.upsertWarehouseMetric({
          organizationId,
          metricKey: key,
          metricValue: value,
          period,
          dataSource: "vin_solutions",
          syncedAt: new Date(),
        });
        processed++;
      } catch (err) {
        failed++;
      }
    }

    await storage.updateSyncLog(logEntry.id, {
      status: "completed",
      recordsProcessed: processed,
      recordsFailed: failed,
      completedAt: new Date(),
    });

    storage.createActivityLog({
      organizationId,
      action: "sync_metrics_refreshed",
      entityType: "sync",
      entityId: logEntry.id,
      metadata: { processed, failed, period },
    }).catch(() => {});

    return { processed, failed };
  } catch (err: any) {
    const errorMessage = err.message || "Metrics refresh failed";
    await storage.updateSyncLog(logEntry.id, {
      status: "failed",
      recordsProcessed: processed,
      recordsFailed: failed,
      completedAt: new Date(),
      errorMessage,
    });

    return { processed, failed, error: errorMessage };
  }
}

function isBusinessHours(): boolean {
  const now = new Date();
  const etHour = parseInt(now.toLocaleString("en-US", { hour: "2-digit", hour12: false, timeZone: "America/New_York" }));
  return etHour >= 8 && etHour < 18;
}

let syncIntervals: NodeJS.Timeout[] = [];

export async function startSyncScheduler(): Promise<void> {
  stopSyncScheduler();

  const orgs = await storage.getOrganizations();
  const orgIds = orgs.map(o => o.id);

  if (orgIds.length === 0) {
    console.log("[Sync] No organizations found, scheduler idle");
    return;
  }

  const FOUR_HOURS = 4 * 60 * 60 * 1000;
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

  const metricsInterval = setInterval(async () => {
    if (!isBusinessHours()) return;
    console.log("[Sync] Running scheduled metrics refresh...");
    for (const orgId of orgIds) {
      try {
        const result = await runMetricsRefresh(orgId);
        console.log(`[Sync] Metrics refresh for ${orgId}: ${result.processed} metrics updated`);
      } catch (err) {
        console.error(`[Sync] Metrics refresh failed for ${orgId}:`, err);
      }
    }
  }, FOUR_HOURS);

  const deltaInterval = setInterval(async () => {
    const now = new Date();
    const etHour = parseInt(now.toLocaleString("en-US", { hour: "2-digit", hour12: false, timeZone: "America/New_York" }));
    if (etHour !== 2) return;
    console.log("[Sync] Running scheduled daily delta...");
    for (const orgId of orgIds) {
      try {
        const result = await runDailyDelta(orgId);
        console.log(`[Sync] Daily delta for ${orgId}: ${result.processed} leads synced`);
      } catch (err) {
        console.error(`[Sync] Daily delta failed for ${orgId}:`, err);
      }
    }
  }, TWENTY_FOUR_HOURS);

  syncIntervals = [metricsInterval, deltaInterval];
  console.log(`[Sync] Scheduler started for ${orgIds.length} organization(s). Metrics every 4h (business hours), delta nightly.`);
}

export function stopSyncScheduler(): void {
  for (const interval of syncIntervals) {
    clearInterval(interval);
  }
  syncIntervals = [];
}
