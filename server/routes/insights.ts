import type { Express } from "express";
import { authenticateToken } from "../auth";
import { storage } from "../storage";
import { isActiveLead, isNewLead, isSoldLead, isLostLead, isBadLead } from "../statusClassifier";

function resolveOrgIdParam(req: import("express").Request): string | null {
  if (!req.user) return null;
  const requestedOrgId = req.query.orgId as string | undefined;
  if (!requestedOrgId) return req.user.organizationId;
  if (requestedOrgId === req.user.organizationId) return requestedOrgId;
  if (req.user.roleLevel <= 2) return requestedOrgId;
  return null;
}

export function registerInsightRoutes(app: Express) {
  app.get("/api/insights/dashboard", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const orgId = resolveOrgIdParam(req);
      if (!orgId) return res.status(403).json({ message: "Access denied: cannot view that organization" });

      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const allLeads = await storage.getWarehouseLeads(orgId, {
        createdAfter: thirtyDaysAgo,
      });
      const metrics = await storage.getWarehouseMetrics(orgId, {});

      const hotLeadsGoingCold = allLeads
        .filter(l => isActiveLead(l.vinStatus))
        .map(l => {
          const created = l.vinCreatedAt ? new Date(l.vinCreatedAt) : new Date(l.createdAt);
          const daysOld = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
          return {
            id: l.id, leadId: l.sourceId || l.id, daysOld, type: "Internet",
            source: l.leadSource || "Unknown", vehicle: l.vehicleOfInterest || "",
            status: l.vinStatus || "active", isHot: l.vinStatus === "hot" || l.vinStatus === "ACTIVE_ACTIVE_LEAD",
            customerName: l.customerName || null, customerPhone: l.customerPhone || null, customerEmail: l.customerEmail || null,
          };
        })
        .filter(l => l.daysOld > 2)
        .sort((a, b) => (b.daysOld || 0) - (a.daysOld || 0))
        .slice(0, 20);

      const newLeadsNoContact = allLeads
        .filter(l => isNewLead(l.vinStatus))
        .map(l => {
          const created = l.vinCreatedAt ? new Date(l.vinCreatedAt) : new Date(l.createdAt);
          const hoursOld = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));
          return {
            id: l.id, leadId: l.sourceId || l.id, hoursOld, type: "Internet",
            source: l.leadSource || "Unknown", vehicle: l.vehicleOfInterest || "",
            customerName: l.customerName || null, customerPhone: l.customerPhone || null, customerEmail: l.customerEmail || null,
          };
        })
        .sort((a, b) => (b.hoursOld || 0) - (a.hoursOld || 0))
        .slice(0, 20);

      const showroomNotClosed = allLeads
        .filter(l => l.leadSource?.toLowerCase().includes("walk") || l.leadSource?.toLowerCase().includes("showroom"))
        .filter(l => !isSoldLead(l.vinStatus))
        .map(l => {
          const created = l.vinCreatedAt ? new Date(l.vinCreatedAt) : new Date(l.createdAt);
          const daysOld = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
          return {
            id: l.id, leadId: l.sourceId || l.id, daysOld, type: "Walk-In",
            source: l.leadSource || "Showroom", vehicle: l.vehicleOfInterest || "",
            status: l.vinStatus || "open",
            customerName: l.customerName || null, customerPhone: l.customerPhone || null, customerEmail: l.customerEmail || null,
          };
        })
        .slice(0, 20);

      const totalLeads = allLeads.length;
      const hotCount = allLeads.filter(l => isActiveLead(l.vinStatus)).length;
      const soldCount = allLeads.filter(l => isSoldLead(l.vinStatus)).length;
      const conversionRate = totalLeads > 0 ? Math.round((soldCount / totalLeads) * 1000) / 10 : 0;
      const newCount = allLeads.filter(l => isNewLead(l.vinStatus)).length;

      const sourceCounts: Record<string, number> = {};
      allLeads.forEach(l => {
        const src = l.leadSource || "Unknown";
        sourceCounts[src] = (sourceCounts[src] || 0) + 1;
      });
      const topLeadSources = Object.entries(sourceCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8)
        .map(([source, count], i) => ({
          source, leads: count, rate: totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0,
          grade: i === 0 ? "A+" : i < 3 ? "A" : i < 5 ? "B" : "C",
        }));

      const channelCounts: Record<string, { total: number; won: number }> = {};
      allLeads.forEach(l => {
        const ch = l.leadSource?.includes("Phone") ? "Phone" : l.leadSource?.includes("Walk") ? "Walk-In" : l.leadSource?.includes("Web") ? "Website" : "Other";
        if (!channelCounts[ch]) channelCounts[ch] = { total: 0, won: 0 };
        channelCounts[ch].total++;
        if (isSoldLead(l.vinStatus)) channelCounts[ch].won++;
      });
      const channelPerformance = Object.entries(channelCounts).map(([channel, data]) => ({
        channel, volume: data.total, conversion: data.total > 0 ? Math.round((data.won / data.total) * 100) : 0,
      }));

      const metricsMap: Record<string, string> = {};
      metrics.forEach(m => { metricsMap[m.metricKey] = m.metricValue; });

      return res.json({
        overview: {
          totalLeads, hotCount, newCount, soldCount, conversionRate,
          metricsFromWarehouse: metricsMap,
        },
        redZone: { hotLeadsGoingCold, newLeadsNoContact, showroomNotClosed },
        yellowZone: {
          staleLeads: allLeads.filter(l => {
            const updated = l.vinUpdatedAt ? new Date(l.vinUpdatedAt) : new Date(l.createdAt);
            return (now.getTime() - updated.getTime()) > 7 * 24 * 60 * 60 * 1000 && !isSoldLead(l.vinStatus);
          }).length,
          pendingFinance: allLeads.filter(l => l.vinStatus === "pending_finance" || l.vinStatus === "SOLD_PENDING_FINANCE").length,
        },
        greenZone: [
          { label: "Pipeline Active", value: hotCount, status: hotCount > 0 ? "healthy" : "empty" },
          { label: "Conversion Rate", value: `${conversionRate}%`, status: conversionRate > 10 ? "healthy" : "watch" },
          { label: "Total Leads", value: totalLeads, status: "info" },
        ],
        pipelineHealth: {
          velocity: metricsMap["pipeline_velocity"] || null,
          freshness: metricsMap["pipeline_freshness"] || null,
          forecast: metricsMap["month_end_forecast"] || null,
        },
        topLeadSources,
        channelPerformance,
      });
    } catch (err: any) {
      console.error("[Insights] Dashboard error:", err);
      return res.status(500).json({ message: "Failed to fetch insights dashboard" });
    }
  });

  app.get("/api/insights/reports", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const orgId = resolveOrgIdParam(req);
      if (!orgId) return res.status(403).json({ message: "Access denied: cannot view that organization" });

      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const allLeads = await storage.getWarehouseLeads(orgId, {
        createdAfter: thirtyDaysAgo,
      });
      const metrics = await storage.getWarehouseMetrics(orgId, {});

      const totalLeads = allLeads.length;
      const soldCount = allLeads.filter(l => isSoldLead(l.vinStatus)).length;
      const lostCount = allLeads.filter(l => isLostLead(l.vinStatus)).length;
      const badCount = allLeads.filter(l => isBadLead(l.vinStatus)).length;

      const sourceCounts: Record<string, { total: number; won: number; lost: number }> = {};
      allLeads.forEach(l => {
        const src = l.leadSource || "Unknown";
        if (!sourceCounts[src]) sourceCounts[src] = { total: 0, won: 0, lost: 0 };
        sourceCounts[src].total++;
        if (isSoldLead(l.vinStatus)) sourceCounts[src].won++;
        if (isLostLead(l.vinStatus)) sourceCounts[src].lost++;
      });

      const sourceQualityTrends = Object.entries(sourceCounts)
        .sort(([, a], [, b]) => b.total - a.total)
        .slice(0, 10)
        .map(([source, data]) => ({
          source, leads: data.total,
          winRate: data.total > 0 ? Math.round((data.won / data.total) * 100) : 0,
          lossRate: data.total > 0 ? Math.round((data.lost / data.total) * 100) : 0,
        }));

      const metricsMap: Record<string, string> = {};
      metrics.forEach(m => { metricsMap[m.metricKey] = m.metricValue; });

      return res.json({
        lossAnalysis: {
          totalLost: lostCount, totalBad: badCount,
          lossRate: totalLeads > 0 ? Math.round((lostCount / totalLeads) * 100) : 0,
          badRate: totalLeads > 0 ? Math.round((badCount / totalLeads) * 100) : 0,
        },
        sourceQualityTrends,
        performanceSummary: {
          totalLeads, sold: soldCount, lost: lostCount, bad: badCount,
          winRate: totalLeads > 0 ? Math.round((soldCount / totalLeads) * 1000) / 10 : 0,
          metricsFromWarehouse: metricsMap,
        },
      });
    } catch (err: any) {
      console.error("[Insights] Reports error:", err);
      return res.status(500).json({ message: "Failed to fetch insights reports" });
    }
  });

  app.get("/api/insights/library/:metricId/detail", authenticateToken, async (req, res) => {
    try {
      const orgId = resolveOrgIdParam(req);
      if (!orgId) return res.status(403).json({ message: "Forbidden" });

      const metricId = req.params.metricId;
      const lookbackDays = parseInt(req.query.lookbackDays as string) || 30;
      const createdAfter = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);
      const now = new Date();

      const allLeads = await storage.getWarehouseLeads(orgId, { createdAfter });

      type Row = { label: string; value: string; detail?: string };
      let rows: Row[] = [];
      let insight: string | null = null;

      const daysBetween = (a: Date, b: Date) => Math.max(0, Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));

      switch (metricId) {
        case "lib-1": {
          const statusBuckets: Record<string, { count: number; totalAge: number }> = {
            NEW: { count: 0, totalAge: 0 },
            ACTIVE: { count: 0, totalAge: 0 },
            HOT: { count: 0, totalAge: 0 },
            PENDING: { count: 0, totalAge: 0 },
            WAITING: { count: 0, totalAge: 0 },
          };
          for (const lead of allLeads) {
            const s = (lead.vinStatus || "").toUpperCase();
            const age = lead.vinCreatedAt ? daysBetween(new Date(lead.vinCreatedAt), now) : 0;
            if (isNewLead(lead.vinStatus)) { statusBuckets.NEW.count++; statusBuckets.NEW.totalAge += age; }
            else if (s.includes("HOT") || s === "HOT") { statusBuckets.HOT.count++; statusBuckets.HOT.totalAge += age; }
            else if (isActiveLead(lead.vinStatus)) { statusBuckets.ACTIVE.count++; statusBuckets.ACTIVE.totalAge += age; }
          }
          for (const [label, data] of Object.entries(statusBuckets)) {
            if (data.count > 0) {
              const avgAge = Math.round(data.totalAge / data.count);
              rows.push({ label, value: `${data.count}`, detail: `Avg age: ${avgAge} days` });
            }
          }
          const totalActive = rows.reduce((s, r) => s + parseInt(r.value), 0);
          const largest = rows.length > 0 ? rows.reduce((a, b) => parseInt(a.value) > parseInt(b.value) ? a : b) : null;
          insight = largest ? `${largest.label} leads make up the largest segment with ${largest.value} of ${totalActive} active pipeline leads.` : null;
          break;
        }

        case "lib-2": {
          const sourceMap: Record<string, { count: number; sold: number; lost: number }> = {};
          const newLeads = allLeads.filter(l => isNewLead(l.vinStatus) || l.vinCreatedAt && new Date(l.vinCreatedAt) >= createdAfter);
          for (const lead of newLeads) {
            const src = lead.leadSource || "Unknown";
            if (!sourceMap[src]) sourceMap[src] = { count: 0, sold: 0, lost: 0 };
            sourceMap[src].count++;
            if (isSoldLead(lead.vinStatus)) sourceMap[src].sold++;
            if (isLostLead(lead.vinStatus)) sourceMap[src].lost++;
          }
          const sorted = Object.entries(sourceMap).sort((a, b) => b[1].count - a[1].count);
          for (const [src, data] of sorted) {
            const winRate = data.count > 0 ? Math.round((data.sold / data.count) * 100) : 0;
            rows.push({ label: src, value: `${data.count}`, detail: `Win rate: ${winRate}%` });
          }
          const totalNew = newLeads.length;
          const dailyAvg = lookbackDays > 0 ? Math.round(totalNew / lookbackDays * 10) / 10 : 0;
          insight = `Average daily new lead volume is ${dailyAvg} leads/day across ${sorted.length} sources over the last ${lookbackDays} days.`;
          break;
        }

        case "lib-5": {
          const thisWeekStart = new Date(now);
          thisWeekStart.setDate(now.getDate() - now.getDay());
          thisWeekStart.setHours(0, 0, 0, 0);
          const lastWeekStart = new Date(thisWeekStart);
          lastWeekStart.setDate(lastWeekStart.getDate() - 7);

          const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
          const thisWeekCounts = new Array(7).fill(0);
          const lastWeekCounts = new Array(7).fill(0);

          for (const lead of allLeads) {
            const created = lead.vinCreatedAt ? new Date(lead.vinCreatedAt) : new Date(lead.createdAt);
            if (created >= thisWeekStart) {
              thisWeekCounts[created.getDay()]++;
            } else if (created >= lastWeekStart && created < thisWeekStart) {
              lastWeekCounts[created.getDay()]++;
            }
          }

          for (let i = 0; i < 7; i++) {
            rows.push({ label: dayNames[i], value: `${thisWeekCounts[i]}`, detail: `Last week: ${lastWeekCounts[i]}` });
          }

          const thisTotal = thisWeekCounts.reduce((a, b) => a + b, 0);
          const lastTotal = lastWeekCounts.reduce((a, b) => a + b, 0);
          const velocityChange = lastTotal > 0 ? Math.round(((thisTotal - lastTotal) / lastTotal) * 100) : 0;
          insight = `Lead velocity is ${velocityChange >= 0 ? "up" : "down"} ${Math.abs(velocityChange)}% this week (${thisTotal}) compared to last week (${lastTotal}).`;
          break;
        }

        case "lib-8": {
          const monthMap: Record<string, { sold: number; lost: number; total: number }> = {};
          for (const lead of allLeads) {
            if (!isSoldLead(lead.vinStatus) && !isLostLead(lead.vinStatus)) continue;
            const d = lead.vinUpdatedAt ? new Date(lead.vinUpdatedAt) : new Date(lead.createdAt);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            if (!monthMap[key]) monthMap[key] = { sold: 0, lost: 0, total: 0 };
            monthMap[key].total++;
            if (isSoldLead(lead.vinStatus)) monthMap[key].sold++;
            if (isLostLead(lead.vinStatus)) monthMap[key].lost++;
          }
          const months = Object.keys(monthMap).sort();
          for (const m of months) {
            const d = monthMap[m];
            const wr = d.total > 0 ? Math.round((d.sold / d.total) * 100) : 0;
            rows.push({ label: m, value: `${wr}%`, detail: `Sold: ${d.sold}, Lost: ${d.lost}` });
          }
          const totalSold = allLeads.filter(l => isSoldLead(l.vinStatus)).length;
          const totalLost = allLeads.filter(l => isLostLead(l.vinStatus)).length;
          const overallWr = (totalSold + totalLost) > 0 ? Math.round((totalSold / (totalSold + totalLost)) * 100) : 0;
          insight = `Overall win rate is ${overallWr}% with ${totalSold} sold and ${totalLost} lost across ${months.length} months.`;
          break;
        }

        case "lib-10": {
          const walkIns = allLeads.filter(l => {
            const src = (l.leadSource || "").toLowerCase();
            return src.includes("walk") || src.includes("showroom") || src.includes("floor");
          });
          const walkSold = walkIns.filter(l => isSoldLead(l.vinStatus)).length;
          const walkLost = walkIns.filter(l => isLostLead(l.vinStatus)).length;
          const walkActive = walkIns.filter(l => isActiveLead(l.vinStatus) || isNewLead(l.vinStatus)).length;
          const closeRate = walkIns.length > 0 ? Math.round((walkSold / walkIns.length) * 100) : 0;
          rows.push({ label: "Total Walk-Ins", value: `${walkIns.length}`, detail: `${lookbackDays}-day period` });
          rows.push({ label: "Sold", value: `${walkSold}`, detail: `Close rate: ${closeRate}%` });
          rows.push({ label: "Lost", value: `${walkLost}` });
          rows.push({ label: "Still Active", value: `${walkActive}` });
          const withTrade = walkIns.filter(l => {
            const v = (l.vehicleOfInterest || "").toLowerCase();
            return v.includes("trade");
          }).length;
          if (withTrade > 0) {
            rows.push({ label: "With Trade-In", value: `${withTrade}`, detail: `${Math.round((withTrade / walkIns.length) * 100)}% of walk-ins` });
          }
          insight = walkIns.length > 0 ? `Walk-in close rate is ${closeRate}% from ${walkIns.length} walk-in leads over ${lookbackDays} days.` : "No walk-in leads found in the selected period.";
          break;
        }

        case "lib-12": {
          const hotLeads = allLeads.filter(l => {
            const s = (l.vinStatus || "").toUpperCase();
            return s.includes("HOT") || s === "HOT";
          });
          const hotSold = hotLeads.filter(l => isSoldLead(l.vinStatus));
          const hotLost = hotLeads.filter(l => isLostLead(l.vinStatus));
          const hotActive = hotLeads.filter(l => isActiveLead(l.vinStatus) || isNewLead(l.vinStatus));
          rows.push({ label: "Total HOT Leads", value: `${hotLeads.length}` });
          rows.push({ label: "Converted (Sold)", value: `${hotSold.length}`, detail: hotLeads.length > 0 ? `${Math.round((hotSold.length / hotLeads.length) * 100)}% conversion` : "0%" });
          rows.push({ label: "Lost", value: `${hotLost.length}` });
          rows.push({ label: "Still Active", value: `${hotActive.length}` });
          if (hotSold.length > 0) {
            const avgCloseTime = hotSold.reduce((sum, l) => {
              const created = l.vinCreatedAt ? new Date(l.vinCreatedAt) : new Date(l.createdAt);
              const closed = l.vinUpdatedAt ? new Date(l.vinUpdatedAt) : now;
              return sum + daysBetween(created, closed);
            }, 0) / hotSold.length;
            rows.push({ label: "Avg Time to Close", value: `${Math.round(avgCloseTime)} days` });
          }
          const convRate = hotLeads.length > 0 ? Math.round((hotSold.length / hotLeads.length) * 100) : 0;
          insight = hotLeads.length > 0 ? `HOT lead conversion rate is ${convRate}% with an average close cycle, ${hotActive.length} still active in pipeline.` : "No HOT leads found in the selected period.";
          break;
        }

        case "lib-16": {
          const contacted1hr = allLeads.filter(l => {
            if (!l.vinCreatedAt || !l.vinUpdatedAt) return false;
            const diff = new Date(l.vinUpdatedAt).getTime() - new Date(l.vinCreatedAt).getTime();
            return diff > 0 && diff <= 3600000;
          }).length;
          const contacted4hr = allLeads.filter(l => {
            if (!l.vinCreatedAt || !l.vinUpdatedAt) return false;
            const diff = new Date(l.vinUpdatedAt).getTime() - new Date(l.vinCreatedAt).getTime();
            return diff > 3600000 && diff <= 14400000;
          }).length;
          const contacted24hr = allLeads.filter(l => {
            if (!l.vinCreatedAt || !l.vinUpdatedAt) return false;
            const diff = new Date(l.vinUpdatedAt).getTime() - new Date(l.vinCreatedAt).getTime();
            return diff > 14400000 && diff <= 86400000;
          }).length;
          const neverContacted = allLeads.filter(l => !l.vinUpdatedAt || (l.vinCreatedAt && l.vinUpdatedAt && new Date(l.vinUpdatedAt).getTime() === new Date(l.vinCreatedAt).getTime())).length;
          const total = allLeads.length;
          rows.push({ label: "Within 1 hour", value: `${contacted1hr}`, detail: total > 0 ? `${Math.round((contacted1hr / total) * 100)}%` : "0%" });
          rows.push({ label: "1-4 hours", value: `${contacted4hr}`, detail: total > 0 ? `${Math.round((contacted4hr / total) * 100)}%` : "0%" });
          rows.push({ label: "4-24 hours", value: `${contacted24hr}`, detail: total > 0 ? `${Math.round((contacted24hr / total) * 100)}%` : "0%" });
          rows.push({ label: "Never / No Update", value: `${neverContacted}`, detail: total > 0 ? `${Math.round((neverContacted / total) * 100)}%` : "0%" });
          const contactRate = total > 0 ? Math.round(((total - neverContacted) / total) * 100) : 0;
          insight = `${contactRate}% of leads received contact, with ${contacted1hr} contacted within the first hour.`;
          break;
        }

        case "lib-21": {
          const sourceContactTimes: Record<string, { totalMinutes: number; count: number }> = {};
          for (const lead of allLeads) {
            if (!lead.vinCreatedAt || !lead.vinUpdatedAt) continue;
            const diff = new Date(lead.vinUpdatedAt).getTime() - new Date(lead.vinCreatedAt).getTime();
            if (diff <= 0) continue;
            const src = lead.leadSource || "Unknown";
            if (!sourceContactTimes[src]) sourceContactTimes[src] = { totalMinutes: 0, count: 0 };
            sourceContactTimes[src].totalMinutes += diff / 60000;
            sourceContactTimes[src].count++;
          }
          const sorted = Object.entries(sourceContactTimes).sort((a, b) => {
            const avgA = a[1].totalMinutes / a[1].count;
            const avgB = b[1].totalMinutes / b[1].count;
            return avgA - avgB;
          });
          for (const [src, data] of sorted) {
            const avgMin = Math.round(data.totalMinutes / data.count);
            const hrs = Math.floor(avgMin / 60);
            const mins = avgMin % 60;
            const timeStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
            rows.push({ label: src, value: timeStr, detail: `${data.count} leads` });
          }
          const fastest = sorted.length > 0 ? sorted[0] : null;
          insight = fastest ? `${fastest[0]} has the fastest average first contact time at ${rows[0]?.value}.` : "No contact time data available.";
          break;
        }

        case "lib-22": {
          const sourceStats: Record<string, { count: number; sold: number; lost: number; active: number }> = {};
          for (const lead of allLeads) {
            const src = lead.leadSource || "Unknown";
            if (!sourceStats[src]) sourceStats[src] = { count: 0, sold: 0, lost: 0, active: 0 };
            sourceStats[src].count++;
            if (isSoldLead(lead.vinStatus)) sourceStats[src].sold++;
            if (isLostLead(lead.vinStatus)) sourceStats[src].lost++;
            if (isActiveLead(lead.vinStatus) || isNewLead(lead.vinStatus)) sourceStats[src].active++;
          }
          const sorted = Object.entries(sourceStats).sort((a, b) => b[1].count - a[1].count);
          for (const [src, data] of sorted) {
            const winRate = data.count > 0 ? Math.round((data.sold / data.count) * 100) : 0;
            const lossRate = data.count > 0 ? Math.round((data.lost / data.count) * 100) : 0;
            rows.push({ label: src, value: `${data.count} leads`, detail: `Win: ${winRate}%, Loss: ${lossRate}%` });
          }
          const topSource = sorted.length > 0 ? sorted[0] : null;
          insight = topSource ? `${topSource[0]} is the top source with ${topSource[1].count} leads and a ${topSource[1].count > 0 ? Math.round((topSource[1].sold / topSource[1].count) * 100) : 0}% win rate.` : "No lead source data available.";
          break;
        }

        case "lib-27": {
          const digitalSources = ["internet", "web", "website", "online", "email", "chat", "social", "facebook", "instagram", "google", "cargurus", "autotrader", "cars.com", "truecar", "digital"];
          const physicalSources = ["walk", "showroom", "floor", "phone", "referral", "repeat", "service"];

          let digitalCount = 0;
          let physicalCount = 0;
          let otherCount = 0;
          const digitalSubs: Record<string, number> = {};
          const physicalSubs: Record<string, number> = {};

          for (const lead of allLeads) {
            const src = (lead.leadSource || "unknown").toLowerCase();
            const isDigital = digitalSources.some(d => src.includes(d));
            const isPhysical = physicalSources.some(p => src.includes(p));
            if (isDigital) {
              digitalCount++;
              const key = lead.leadSource || "Unknown";
              digitalSubs[key] = (digitalSubs[key] || 0) + 1;
            } else if (isPhysical) {
              physicalCount++;
              const key = lead.leadSource || "Unknown";
              physicalSubs[key] = (physicalSubs[key] || 0) + 1;
            } else {
              otherCount++;
            }
          }

          const total = allLeads.length;
          const digitalPct = total > 0 ? Math.round((digitalCount / total) * 100) : 0;
          const physicalPct = total > 0 ? Math.round((physicalCount / total) * 100) : 0;

          rows.push({ label: "Digital Leads", value: `${digitalCount}`, detail: `${digitalPct}% of total` });
          for (const [sub, cnt] of Object.entries(digitalSubs).sort((a, b) => b[1] - a[1]).slice(0, 5)) {
            rows.push({ label: `  ${sub}`, value: `${cnt}` });
          }
          rows.push({ label: "Physical Leads", value: `${physicalCount}`, detail: `${physicalPct}% of total` });
          for (const [sub, cnt] of Object.entries(physicalSubs).sort((a, b) => b[1] - a[1]).slice(0, 5)) {
            rows.push({ label: `  ${sub}`, value: `${cnt}` });
          }
          if (otherCount > 0) {
            rows.push({ label: "Other/Uncategorized", value: `${otherCount}`, detail: `${total > 0 ? Math.round((otherCount / total) * 100) : 0}%` });
          }
          insight = `Digital leads account for ${digitalPct}% of the pipeline (${digitalCount} of ${total} total leads).`;
          break;
        }

        case "lib-31": {
          const soldLeads = allLeads.filter(l => isSoldLead(l.vinStatus));
          const weekMap: Record<string, number> = {};
          for (const lead of soldLeads) {
            const d = lead.vinUpdatedAt ? new Date(lead.vinUpdatedAt) : new Date(lead.createdAt);
            const weekStart = new Date(d);
            weekStart.setDate(d.getDate() - d.getDay());
            const key = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
            weekMap[key] = (weekMap[key] || 0) + 1;
          }
          const weeks = Object.entries(weekMap).sort((a, b) => {
            return a[0].localeCompare(b[0]);
          });
          for (const [week, count] of weeks) {
            const dailyAvg = Math.round((count / 7) * 10) / 10;
            rows.push({ label: `Week of ${week}`, value: `${count} sales`, detail: `${dailyAvg}/day avg` });
          }
          const totalSales = soldLeads.length;
          const overallDailyAvg = lookbackDays > 0 ? Math.round((totalSales / lookbackDays) * 10) / 10 : 0;
          insight = `${totalSales} total sales over ${lookbackDays} days, averaging ${overallDailyAvg} sales per day across ${weeks.length} weeks.`;
          break;
        }

        case "lib-33": {
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
          const dayOfMonth = now.getDate();

          const mtdSold = allLeads.filter(l => {
            if (!isSoldLead(l.vinStatus)) return false;
            const d = l.vinUpdatedAt ? new Date(l.vinUpdatedAt) : new Date(l.createdAt);
            return d >= monthStart;
          }).length;

          const projectedTotal = dayOfMonth > 0 ? Math.round((mtdSold / dayOfMonth) * daysInMonth) : 0;
          const activePipeline = allLeads.filter(l => isActiveLead(l.vinStatus) || isNewLead(l.vinStatus)).length;
          const daysRemaining = daysInMonth - dayOfMonth;

          rows.push({ label: "MTD Sales", value: `${mtdSold}`, detail: `Day ${dayOfMonth} of ${daysInMonth}` });
          rows.push({ label: "Projected Month Total", value: `${projectedTotal}`, detail: `Based on current pace` });
          rows.push({ label: "Active Pipeline Support", value: `${activePipeline}`, detail: `Leads still workable` });
          rows.push({ label: "Days Remaining", value: `${daysRemaining}` });
          rows.push({ label: "Needed Daily Pace", value: `${daysRemaining > 0 ? Math.round(((projectedTotal - mtdSold) / daysRemaining) * 10) / 10 : 0}`, detail: "Sales/day to hit projection" });

          insight = `On pace for ${projectedTotal} sales this month with ${mtdSold} sold through day ${dayOfMonth} and ${activePipeline} active pipeline leads remaining.`;
          break;
        }

        default: {
          return res.json({
            metricId,
            rows: [],
            insight: null,
            note: "Detailed drill-down not yet available for this metric",
          });
        }
      }

      return res.json({ metricId, rows, insight });
    } catch (err: any) {
      console.error("[Insights] Library detail error:", err);
      return res.status(500).json({ message: "Failed to fetch library metric detail" });
    }
  });

  app.get("/api/insights/library", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const orgId = resolveOrgIdParam(req);
      if (!orgId) return res.status(403).json({ message: "Access denied: cannot view that organization" });

      const lookbackDays = parseInt(req.query.lookbackDays as string) || 30;
      const now = new Date();
      const periodStart = new Date(now);
      periodStart.setDate(periodStart.getDate() - lookbackDays);
      const priorStart = new Date(periodStart);
      priorStart.setDate(priorStart.getDate() - lookbackDays);

      const [allLeads, priorLeads, allOrgConversations] = await Promise.all([
        storage.getWarehouseLeads(orgId, { createdAfter: periodStart }),
        storage.getWarehouseLeads(orgId, { createdAfter: priorStart }),
        storage.getConversations(orgId),
      ]);

      const priorOnlyLeads = priorLeads.filter(l => {
        const created = l.vinCreatedAt ? new Date(l.vinCreatedAt) : new Date(l.createdAt);
        return created < periodStart;
      });

      const totalLeads = allLeads.length;
      const priorTotal = priorOnlyLeads.length;

      const activeLeads = allLeads.filter(l => isActiveLead(l.vinStatus));
      const priorActiveLeads = priorOnlyLeads.filter(l => isActiveLead(l.vinStatus));
      const newLeads = allLeads.filter(l => isNewLead(l.vinStatus));
      const soldLeads = allLeads.filter(l => isSoldLead(l.vinStatus));
      const priorSoldLeads = priorOnlyLeads.filter(l => isSoldLead(l.vinStatus));
      const lostLeads = allLeads.filter(l => isLostLead(l.vinStatus));
      const priorLostLeads = priorOnlyLeads.filter(l => isLostLead(l.vinStatus));
      const badLeads = allLeads.filter(l => isBadLead(l.vinStatus));
      const priorBadLeads = priorOnlyLeads.filter(l => isBadLead(l.vinStatus));

      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const leadsCreatedToday = allLeads.filter(l => {
        const created = l.vinCreatedAt ? new Date(l.vinCreatedAt) : new Date(l.createdAt);
        return created >= todayStart && isNewLead(l.vinStatus);
      });

      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const leadsLast7Days = allLeads.filter(l => {
        const created = l.vinCreatedAt ? new Date(l.vinCreatedAt) : new Date(l.createdAt);
        return created >= sevenDaysAgo;
      });

      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      const thisMonthLeads = allLeads.filter(l => {
        const created = l.vinCreatedAt ? new Date(l.vinCreatedAt) : new Date(l.createdAt);
        return created >= thisMonthStart;
      });
      const lastMonthLeads = [...allLeads, ...priorOnlyLeads].filter(l => {
        const created = l.vinCreatedAt ? new Date(l.vinCreatedAt) : new Date(l.createdAt);
        return created >= lastMonthStart && created <= lastMonthEnd;
      });

      const stagnantLeads = activeLeads.filter(l => {
        const updated = l.vinUpdatedAt ? new Date(l.vinUpdatedAt) : new Date(l.createdAt);
        return (now.getTime() - updated.getTime()) > 7 * 24 * 60 * 60 * 1000;
      });
      const priorStagnantLeads = priorActiveLeads.filter(l => {
        const updated = l.vinUpdatedAt ? new Date(l.vinUpdatedAt) : new Date(l.createdAt);
        return (periodStart.getTime() - updated.getTime()) > 7 * 24 * 60 * 60 * 1000;
      });

      const freshLeads = activeLeads.filter(l => {
        const created = l.vinCreatedAt ? new Date(l.vinCreatedAt) : new Date(l.createdAt);
        return created >= sevenDaysAgo;
      });

      const isInternetSource = (src: string | null) => {
        if (!src) return false;
        const lower = src.toLowerCase();
        return lower.includes("internet") || lower.includes("web") || lower.includes("online") || lower.includes("autotrader") || lower.includes("cars.com") || lower.includes("cargurus") || lower.includes("digital") || lower.includes("email");
      };
      const isWalkInSource = (src: string | null) => {
        if (!src) return false;
        const lower = src.toLowerCase();
        return lower.includes("walk") || lower.includes("showroom") || lower.includes("floor");
      };
      const isServiceSource = (src: string | null) => {
        if (!src) return false;
        return src.toLowerCase().includes("service");
      };
      const isHotLead = (status: string | null) => {
        if (!status) return false;
        return status === "hot" || status === "ACTIVE_ACTIVE_LEAD" || status.toLowerCase().includes("hot");
      };
      const isShowroomSource = (src: string | null) => {
        if (!src) return false;
        const lower = src.toLowerCase();
        return lower.includes("showroom") || lower.includes("floor");
      };
      const isDigitalSource = (src: string | null) => {
        if (!src) return false;
        const lower = src.toLowerCase();
        return lower.includes("web") || lower.includes("internet") || lower.includes("online") || lower.includes("autotrader") || lower.includes("cars.com") || lower.includes("cargurus") || lower.includes("digital") || lower.includes("email") || lower.includes("facebook") || lower.includes("social");
      };
      const isPhoneSource = (src: string | null) => {
        if (!src) return false;
        return src.toLowerCase().includes("phone") || src.toLowerCase().includes("call");
      };
      const isReferralSource = (src: string | null) => {
        if (!src) return false;
        return src.toLowerCase().includes("referral") || src.toLowerCase().includes("refer");
      };

      const internetLeads = allLeads.filter(l => isInternetSource(l.leadSource));
      const internetSold = internetLeads.filter(l => isSoldLead(l.vinStatus));
      const priorInternetLeads = priorOnlyLeads.filter(l => isInternetSource(l.leadSource));
      const priorInternetSold = priorInternetLeads.filter(l => isSoldLead(l.vinStatus));

      const walkInLeads = allLeads.filter(l => isWalkInSource(l.leadSource));
      const walkInSold = walkInLeads.filter(l => isSoldLead(l.vinStatus));
      const priorWalkInLeads = priorOnlyLeads.filter(l => isWalkInSource(l.leadSource));
      const priorWalkInSold = priorWalkInLeads.filter(l => isSoldLead(l.vinStatus));

      const serviceLeads = allLeads.filter(l => isServiceSource(l.leadSource));
      const serviceSold = serviceLeads.filter(l => isSoldLead(l.vinStatus));

      const hotLeads = allLeads.filter(l => isHotLead(l.vinStatus));
      const hotSold = hotLeads.filter(l => isSoldLead(l.vinStatus));
      const priorHotLeads = priorOnlyLeads.filter(l => isHotLead(l.vinStatus));
      const priorHotSold = priorHotLeads.filter(l => isSoldLead(l.vinStatus));

      const showroomLeads = allLeads.filter(l => isShowroomSource(l.leadSource));
      const showroomSold = showroomLeads.filter(l => isSoldLead(l.vinStatus));
      const priorShowroomLeads = priorOnlyLeads.filter(l => isShowroomSource(l.leadSource));
      const priorShowroomSold = priorShowroomLeads.filter(l => isSoldLead(l.vinStatus));

      const contactedLeads = allLeads.filter(l => {
        return allOrgConversations.some(c =>
          (l.customerPhone && c.customerPhone && c.customerPhone.replace(/[^0-9]/g, "").includes(l.customerPhone.replace(/[^0-9]/g, "").slice(-10))) ||
          (l.customerEmail && c.customerEmail && c.customerEmail.toLowerCase() === l.customerEmail.toLowerCase())
        );
      });

      const newLeadAges = newLeads.map(l => {
        const created = l.vinCreatedAt ? new Date(l.vinCreatedAt) : new Date(l.createdAt);
        return (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      });
      const avgNewLeadAge = newLeadAges.length > 0 ? newLeadAges.reduce((a, b) => a + b, 0) / newLeadAges.length : 0;

      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const newLeadsOver24h = newLeads.filter(l => {
        const created = l.vinCreatedAt ? new Date(l.vinCreatedAt) : new Date(l.createdAt);
        return created < twentyFourHoursAgo;
      });
      const responseGap = newLeadsOver24h.filter(l => {
        return !allOrgConversations.some(c =>
          (l.customerPhone && c.customerPhone && c.customerPhone.replace(/[^0-9]/g, "").includes(l.customerPhone.replace(/[^0-9]/g, "").slice(-10))) ||
          (l.customerEmail && c.customerEmail && c.customerEmail.toLowerCase() === l.customerEmail?.toLowerCase())
        );
      });

      const waitingLeads = allLeads.filter(l => {
        if (!l.vinStatus) return false;
        const lower = l.vinStatus.toLowerCase();
        return lower.includes("waiting") || lower.includes("stale");
      });

      const engagementTransition = allLeads.filter(l => {
        return isActiveLead(l.vinStatus) && l.vinCreatedAt && l.vinUpdatedAt &&
          new Date(l.vinUpdatedAt).getTime() > new Date(l.vinCreatedAt).getTime();
      });

      const sourceCounts: Record<string, number> = {};
      allLeads.forEach(l => {
        const src = l.leadSource || "Unknown";
        sourceCounts[src] = (sourceCounts[src] || 0) + 1;
      });
      const sourceEntries = Object.entries(sourceCounts).sort(([, a], [, b]) => b - a);
      const topSourceName = sourceEntries.length > 0 ? sourceEntries[0][0] : "N/A";
      const topSourceCount = sourceEntries.length > 0 ? sourceEntries[0][1] : 0;
      const topSourcePct = totalLeads > 0 ? Math.round((topSourceCount / totalLeads) * 100) : 0;

      const sourceWinRates: Record<string, { total: number; won: number }> = {};
      allLeads.forEach(l => {
        const src = l.leadSource || "Unknown";
        if (!sourceWinRates[src]) sourceWinRates[src] = { total: 0, won: 0 };
        sourceWinRates[src].total++;
        if (isSoldLead(l.vinStatus)) sourceWinRates[src].won++;
      });
      const topSourceWR = sourceWinRates[topSourceName];
      const topSourceWinRate = topSourceWR && topSourceWR.total > 0 ? Math.round((topSourceWR.won / topSourceWR.total) * 100) : 0;

      let hhi = 0;
      if (totalLeads > 0) {
        Object.values(sourceCounts).forEach(cnt => {
          const share = cnt / totalLeads;
          hhi += share * share;
        });
      }
      const sourceDiversity = Math.round((1 - hhi) * 100) / 100;

      let sourceQualityScore = 0;
      if (totalLeads > 0) {
        let weightedSum = 0;
        Object.entries(sourceWinRates).forEach(([, data]) => {
          const weight = data.total / totalLeads;
          const wr = data.total > 0 ? data.won / data.total : 0;
          weightedSum += weight * wr;
        });
        sourceQualityScore = Math.round(weightedSum * 100);
      }

      const digitalLeads = allLeads.filter(l => isDigitalSource(l.leadSource));
      const priorDigitalLeads = priorOnlyLeads.filter(l => isDigitalSource(l.leadSource));
      const digitalSold = digitalLeads.filter(l => isSoldLead(l.vinStatus));

      const phoneLeads = allLeads.filter(l => isPhoneSource(l.leadSource));
      const referralLeads = allLeads.filter(l => isReferralSource(l.leadSource));

      const countWeekdays = (start: Date, end: Date): number => {
        let cnt = 0;
        const d = new Date(start);
        while (d <= end) {
          const day = d.getDay();
          if (day !== 0 && day !== 6) cnt++;
          d.setDate(d.getDate() + 1);
        }
        return Math.max(cnt, 1);
      };

      const businessDaysInPeriod = countWeekdays(periodStart, now);
      const salesVelocity = soldLeads.length / businessDaysInPeriod;
      const priorBusinessDays = countWeekdays(priorStart, periodStart);
      const priorSalesVelocity = priorSoldLeads.length / priorBusinessDays;

      const digitalPct = totalLeads > 0 ? (digitalLeads.length / totalLeads) * 100 : 0;
      const digitalWinRate = digitalLeads.length > 0 ? (digitalSold.length / digitalLeads.length) * 100 : 0;
      const responseScore = contactedLeads.length > 0 && totalLeads > 0 ? (contactedLeads.length / totalLeads) * 100 : 0;
      const digitalMaturity = Math.round((digitalPct * 0.4 + digitalWinRate * 0.3 + Math.min(responseScore, 100) * 0.3));

      const priorDigitalPct = priorTotal > 0 ? (priorDigitalLeads.length / priorTotal) * 100 : 0;
      const priorDigitalSold = priorDigitalLeads.filter(l => isSoldLead(l.vinStatus));
      const priorDigitalWinRate = priorDigitalLeads.length > 0 ? (priorDigitalSold.length / priorDigitalLeads.length) * 100 : 0;
      const priorContactedLeads = priorOnlyLeads.filter(l => {
        return allOrgConversations.some(c =>
          (l.customerPhone && c.customerPhone && c.customerPhone.replace(/[^0-9]/g, "").includes(l.customerPhone.replace(/[^0-9]/g, "").slice(-10))) ||
          (l.customerEmail && c.customerEmail && c.customerEmail.toLowerCase() === l.customerEmail?.toLowerCase())
        );
      });
      const priorResponseScore = priorContactedLeads.length > 0 && priorTotal > 0 ? (priorContactedLeads.length / priorTotal) * 100 : 0;
      const priorDigitalMaturity = Math.round((priorDigitalPct * 0.4 + priorDigitalWinRate * 0.3 + Math.min(priorResponseScore, 100) * 0.3));

      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const businessDaysElapsed = countWeekdays(monthStart, now);
      const totalBusinessDaysInMonth = countWeekdays(monthStart, monthEnd);
      const soldThisMonth = allLeads.filter(l => {
        if (!isSoldLead(l.vinStatus)) return false;
        const updated = l.vinUpdatedAt ? new Date(l.vinUpdatedAt) : new Date(l.createdAt);
        return updated >= monthStart;
      });
      const projectedClose = businessDaysElapsed > 0
        ? Math.round((soldThisMonth.length / businessDaysElapsed) * totalBusinessDaysInMonth)
        : 0;

      const pipelineCoverage = projectedClose > 0
        ? Math.round((activeLeads.length / projectedClose) * 100) / 100
        : activeLeads.length > 0 ? 999 : 0;

      const computeChange = (current: number, prior: number): { change: string; trend: 'up' | 'down' | 'neutral' } => {
        if (prior === 0 && current === 0) return { change: "\u2014", trend: "neutral" };
        if (prior === 0) return { change: `+${current}`, trend: "up" };
        const pctChange = Math.round(((current - prior) / prior) * 100);
        if (pctChange > 0) return { change: `+${pctChange}%`, trend: "up" };
        if (pctChange < 0) return { change: `${pctChange}%`, trend: "down" };
        return { change: "0%", trend: "neutral" };
      };

      const computeRateChange = (curNum: number, curDen: number, priorNum: number, priorDen: number): { change: string; trend: 'up' | 'down' | 'neutral' } => {
        const curRate = curDen > 0 ? (curNum / curDen) * 100 : 0;
        const priorRate = priorDen > 0 ? (priorNum / priorDen) * 100 : 0;
        if (priorDen === 0) return { change: "\u2014", trend: "neutral" };
        const diff = Math.round(curRate - priorRate);
        if (diff > 0) return { change: `+${diff}pp`, trend: "up" };
        if (diff < 0) return { change: `${diff}pp`, trend: "down" };
        return { change: "0pp", trend: "neutral" };
      };

      const weeklyTrend = leadsLast7Days.length / 7;
      const priorSevenStart = new Date(sevenDaysAgo);
      priorSevenStart.setDate(priorSevenStart.getDate() - 7);
      const priorWeekLeads = [...allLeads, ...priorOnlyLeads].filter(l => {
        const created = l.vinCreatedAt ? new Date(l.vinCreatedAt) : new Date(l.createdAt);
        return created >= priorSevenStart && created < sevenDaysAgo;
      });
      const priorWeeklyTrend = priorWeekLeads.length / 7;

      const momGrowth = lastMonthLeads.length > 0
        ? Math.round(((thisMonthLeads.length - lastMonthLeads.length) / lastMonthLeads.length) * 100)
        : 0;

      const leadVelocity = totalLeads / Math.max(lookbackDays, 1);
      const priorLeadVelocity = priorTotal / Math.max(lookbackDays, 1);

      const freshRatio = activeLeads.length > 0
        ? Math.round((freshLeads.length / activeLeads.length) * 100)
        : 0;
      const priorFreshLeads = priorActiveLeads.filter(l => {
        const created = l.vinCreatedAt ? new Date(l.vinCreatedAt) : new Date(l.createdAt);
        const priorSevenAgo = new Date(periodStart);
        priorSevenAgo.setDate(priorSevenAgo.getDate() - 7);
        return created >= priorSevenAgo;
      });
      const priorFreshRatio = priorActiveLeads.length > 0
        ? Math.round((priorFreshLeads.length / priorActiveLeads.length) * 100)
        : 0;

      const priorPhoneLeads = priorOnlyLeads.filter(l => isPhoneSource(l.leadSource));
      const priorReferralLeads = priorOnlyLeads.filter(l => isReferralSource(l.leadSource));
      const priorWalkInAll = priorOnlyLeads.filter(l => isWalkInSource(l.leadSource));

      const libMetrics: Array<{ id: string; title: string; value: string; change: string; trend: string; category: string }> = [];

      const c1 = computeChange(activeLeads.length, priorActiveLeads.length);
      libMetrics.push({ id: "lib-1", title: "Total Active Pipeline", value: String(activeLeads.length), change: c1.change, trend: c1.trend, category: "Pipeline" });

      libMetrics.push({ id: "lib-2", title: "Daily New Lead Volume", value: String(leadsCreatedToday.length), change: "\u2014", trend: "neutral", category: "Pipeline" });

      const c3 = computeChange(Math.round(weeklyTrend * 10) / 10, Math.round(priorWeeklyTrend * 10) / 10);
      libMetrics.push({ id: "lib-3", title: "Weekly Lead Trend", value: `${Math.round(weeklyTrend * 10) / 10}/day`, change: c3.change, trend: c3.trend, category: "Pipeline" });

      libMetrics.push({ id: "lib-4", title: "MoM Lead Growth", value: lastMonthLeads.length > 0 ? `${momGrowth}%` : "\u2014", change: "\u2014", trend: momGrowth > 0 ? "up" : momGrowth < 0 ? "down" : "neutral", category: "Pipeline" });

      const c5 = computeChange(Math.round(leadVelocity * 10) / 10, Math.round(priorLeadVelocity * 10) / 10);
      libMetrics.push({ id: "lib-5", title: "Lead Velocity Rate", value: `${Math.round(leadVelocity * 10) / 10}/day`, change: c5.change, trend: c5.trend, category: "Pipeline" });

      const c6 = computeChange(stagnantLeads.length, priorStagnantLeads.length);
      libMetrics.push({ id: "lib-6", title: "Pipeline Stagnation Index", value: String(stagnantLeads.length), change: c6.change, trend: stagnantLeads.length > priorStagnantLeads.length ? "down" : stagnantLeads.length < priorStagnantLeads.length ? "up" : "neutral", category: "Pipeline" });

      const c7 = computeChange(freshRatio, priorFreshRatio);
      libMetrics.push({ id: "lib-7", title: "Fresh Lead Ratio", value: `${freshRatio}%`, change: c7.change, trend: c7.trend, category: "Pipeline" });

      const winRate = totalLeads > 0 ? Math.round((soldLeads.length / totalLeads) * 1000) / 10 : 0;
      const c8 = computeRateChange(soldLeads.length, totalLeads, priorSoldLeads.length, priorTotal);
      libMetrics.push({ id: "lib-8", title: "Overall Win Rate", value: `${winRate}%`, change: c8.change, trend: c8.trend, category: "Conversion" });

      const internetCloseRate = internetLeads.length > 0 ? Math.round((internetSold.length / internetLeads.length) * 1000) / 10 : 0;
      const c9 = computeRateChange(internetSold.length, internetLeads.length, priorInternetSold.length, priorInternetLeads.length);
      libMetrics.push({ id: "lib-9", title: "Internet Close Rate", value: `${internetCloseRate}%`, change: c9.change, trend: c9.trend, category: "Conversion" });

      const walkInCloseRate = walkInLeads.length > 0 ? Math.round((walkInSold.length / walkInLeads.length) * 1000) / 10 : 0;
      const c10 = computeRateChange(walkInSold.length, walkInLeads.length, priorWalkInSold.length, priorWalkInLeads.length);
      libMetrics.push({ id: "lib-10", title: "Walk-In Close Rate", value: `${walkInCloseRate}%`, change: c10.change, trend: c10.trend, category: "Conversion" });

      if (serviceLeads.length > 0) {
        const serviceRate = Math.round((serviceSold.length / serviceLeads.length) * 1000) / 10;
        libMetrics.push({ id: "lib-11", title: "Service-to-Sales", value: `${serviceRate}%`, change: "\u2014", trend: "neutral", category: "Conversion" });
      } else {
        libMetrics.push({ id: "lib-11", title: "Service-to-Sales", value: "\u2014", change: "\u2014", trend: "neutral", category: "Conversion" });
      }

      const hotConversion = hotLeads.length > 0 ? Math.round((hotSold.length / hotLeads.length) * 1000) / 10 : 0;
      const c12 = computeRateChange(hotSold.length, hotLeads.length, priorHotSold.length, priorHotLeads.length);
      libMetrics.push({ id: "lib-12", title: "Hot Lead Conversion", value: `${hotConversion}%`, change: c12.change, trend: c12.trend, category: "Conversion" });

      const showroomConversion = showroomLeads.length > 0 ? Math.round((showroomSold.length / showroomLeads.length) * 1000) / 10 : 0;
      const c13 = computeRateChange(showroomSold.length, showroomLeads.length, priorShowroomSold.length, priorShowroomLeads.length);
      libMetrics.push({ id: "lib-13", title: "Showroom Conversion", value: `${showroomConversion}%`, change: c13.change, trend: c13.trend, category: "Conversion" });

      const lossRate = totalLeads > 0 ? Math.round((lostLeads.length / totalLeads) * 1000) / 10 : 0;
      const c14 = computeRateChange(lostLeads.length, totalLeads, priorLostLeads.length, priorTotal);
      libMetrics.push({ id: "lib-14", title: "Loss Rate", value: `${lossRate}%`, change: c14.change, trend: c14.trend, category: "Conversion" });

      const badRate = totalLeads > 0 ? Math.round((badLeads.length / totalLeads) * 1000) / 10 : 0;
      const c15 = computeRateChange(badLeads.length, totalLeads, priorBadLeads.length, priorTotal);
      libMetrics.push({ id: "lib-15", title: "Bad Lead Rate", value: `${badRate}%`, change: c15.change, trend: c15.trend, category: "Conversion" });

      const contactRate = totalLeads > 0 ? Math.round((contactedLeads.length / totalLeads) * 1000) / 10 : 0;
      const c16 = computeRateChange(contactedLeads.length, totalLeads, priorContactedLeads.length, priorTotal);
      libMetrics.push({ id: "lib-16", title: "Contact Rate", value: `${contactRate}%`, change: c16.change, trend: c16.trend, category: "Response" });

      libMetrics.push({ id: "lib-17", title: "New Lead Aging", value: newLeads.length > 0 ? `${Math.round(avgNewLeadAge * 10) / 10} days` : "\u2014", change: "\u2014", trend: "neutral", category: "Response" });

      libMetrics.push({ id: "lib-18", title: "Response Gap (>24h)", value: String(responseGap.length), change: "\u2014", trend: responseGap.length > 0 ? "down" : "neutral", category: "Response" });

      libMetrics.push({ id: "lib-19", title: "Waiting Lead Volume", value: String(waitingLeads.length), change: "\u2014", trend: "neutral", category: "Response" });

      const totalNewAndActive = newLeads.length + activeLeads.length;
      const engagementRate = totalNewAndActive > 0 ? Math.round((engagementTransition.length / totalNewAndActive) * 100) : 0;
      libMetrics.push({ id: "lib-20", title: "Engagement Transition", value: `${engagementRate}%`, change: "\u2014", trend: "neutral", category: "Response" });

      libMetrics.push({ id: "lib-21", title: "Avg Time to 1st Contact", value: "\u2014", change: "\u2014", trend: "neutral", category: "Response" });

      libMetrics.push({ id: "lib-22", title: "Top Source", value: totalLeads > 0 ? `${topSourceName} (${topSourcePct}%)` : "\u2014", change: "\u2014", trend: "neutral", category: "Lead Source" });

      libMetrics.push({ id: "lib-23", title: "Source Win Rate", value: totalLeads > 0 ? `${topSourceWinRate}%` : "\u2014", change: "\u2014", trend: "neutral", category: "Lead Source" });

      libMetrics.push({ id: "lib-24", title: "Source Diversity Score", value: totalLeads > 0 ? String(sourceDiversity) : "\u2014", change: "\u2014", trend: "neutral", category: "Lead Source" });

      libMetrics.push({ id: "lib-25", title: "Concentration Risk", value: totalLeads > 0 ? `${topSourcePct}%` : "\u2014", change: "\u2014", trend: topSourcePct > 50 ? "down" : "neutral", category: "Lead Source" });

      libMetrics.push({ id: "lib-26", title: "Source Quality Score", value: totalLeads > 0 ? `${sourceQualityScore}%` : "\u2014", change: "\u2014", trend: "neutral", category: "Lead Source" });

      const digitalPctRounded = totalLeads > 0 ? Math.round(digitalPct) : 0;
      const c27 = computeRateChange(digitalLeads.length, totalLeads, priorDigitalLeads.length, priorTotal);
      libMetrics.push({ id: "lib-27", title: "Digital Lead %", value: `${digitalPctRounded}%`, change: c27.change, trend: c27.trend, category: "Channel" });

      const c28 = computeChange(walkInLeads.length, priorWalkInAll.length);
      libMetrics.push({ id: "lib-28", title: "Walk-In Traffic", value: String(walkInLeads.length), change: c28.change, trend: c28.trend, category: "Channel" });

      const c29 = computeChange(phoneLeads.length, priorPhoneLeads.length);
      libMetrics.push({ id: "lib-29", title: "Phone Inquiries", value: String(phoneLeads.length), change: c29.change, trend: c29.trend, category: "Channel" });

      const c30 = computeChange(referralLeads.length, priorReferralLeads.length);
      libMetrics.push({ id: "lib-30", title: "Referral Leads", value: String(referralLeads.length), change: c30.change, trend: c30.trend, category: "Channel" });

      const salesVelRounded = Math.round(salesVelocity * 10) / 10;
      const priorSalesVelRounded = Math.round(priorSalesVelocity * 10) / 10;
      const c31 = computeChange(salesVelRounded, priorSalesVelRounded);
      libMetrics.push({ id: "lib-31", title: "Sales Velocity", value: `${salesVelRounded}/day`, change: c31.change, trend: c31.trend, category: "Composite" });

      const c32 = computeChange(digitalMaturity, priorDigitalMaturity);
      libMetrics.push({ id: "lib-32", title: "Digital Maturity Score", value: `${digitalMaturity}`, change: c32.change, trend: c32.trend, category: "Composite" });

      libMetrics.push({ id: "lib-33", title: "Projected Month Close", value: String(projectedClose), change: "\u2014", trend: "neutral", category: "Forecast" });

      libMetrics.push({ id: "lib-34", title: "Pipeline Coverage Ratio", value: projectedClose > 0 ? `${pipelineCoverage}x` : "\u2014", change: "\u2014", trend: pipelineCoverage >= 2 ? "up" : pipelineCoverage >= 1 ? "neutral" : "down", category: "Forecast" });

      return res.json(libMetrics);
    } catch (err: any) {
      console.error("[Insights] Library metrics error:", err);
      return res.status(500).json({ message: "Failed to fetch library metrics" });
    }
  });
}
