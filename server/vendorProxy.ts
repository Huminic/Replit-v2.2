import type { Express, Request, Response } from "express";
import { authenticateToken } from "./auth";
import https from "https";

const VAPI_BASE = "https://api.vapi.ai";
const TAVUS_BASE = "https://tavusapi.com/v2";

const NEXXUS_ORG_MAP: Record<string, string> = {
  "a9f40650-dc8e-4a86-b0b6-5b94ea5b63ee": "3795b8f6-aca7-45fc-b77e-fc671b85a9f3",
  "af3d5c1f-b170-4310-b870-d6a06f5fa527": "7f868569-62e5-4d49-9378-2e25d6a69321",
  "ffe79304-9db7-4366-8ca9-e94fd7028ef1": "8751c73d-4570-4b8d-bd40-fa4f1e48024d",
};

export function callMCP(toolName: string, args: Record<string, unknown>): Promise<any> {
  const mcpUrl = process.env.VINSOLUTIONS_MCP_URL || "https://mcp.huminicdev.com/dax/mcp";
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

    const req = https.request(
      parsed,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          const lines = data.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const parsed = JSON.parse(line.slice(6));
                if (parsed.result?.isError) {
                  const errText = parsed.result.content?.[0]?.text || "MCP tool error";
                  try {
                    const errObj = JSON.parse(errText);
                    return reject(new Error(errObj.message || errObj.error || errText));
                  } catch {
                    return reject(new Error(errText));
                  }
                }
                const content = parsed.result?.content?.[0]?.text;
                if (content) {
                  try {
                    return resolve(JSON.parse(content));
                  } catch {
                    return resolve(content);
                  }
                }
                return resolve(parsed.result);
              } catch (e) {
                return reject(new Error("Failed to parse MCP response"));
              }
            }
          }
          reject(new Error("No data in MCP response"));
        });
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

export function resolveNexxusOrgId(localOrgId: string): string {
  return NEXXUS_ORG_MAP[localOrgId] || localOrgId;
}

async function vapiGet(path: string) {
  const res = await fetch(`${VAPI_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${process.env.VAPI_PRIVATE_KEY}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error(`VAPI ${path}: ${res.status}`);
  return res.json();
}

async function vapiPost(path: string, body: unknown) {
  const res = await fetch(`${VAPI_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.VAPI_PRIVATE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`VAPI POST ${path}: ${res.status}`);
  return res.json();
}

async function tavusGet(path: string) {
  const res = await fetch(`${TAVUS_BASE}${path}`, {
    headers: {
      "x-api-key": process.env.TAVUS_API_KEY || "",
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error(`Tavus ${path}: ${res.status}`);
  return res.json();
}

export function registerVendorRoutes(app: Express) {
  app.get("/api/vapi/assistants", authenticateToken, async (_req: Request, res: Response) => {
    try {
      const data = await vapiGet("/assistant");
      const assistants = data.map((a: any) => ({
        id: a.id,
        name: a.name,
        voice: a.voice?.voiceId || a.voice?.provider,
        model: a.model?.model,
        firstMessage: a.firstMessage,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
      }));
      return res.json(assistants);
    } catch (err: any) {
      return res.status(502).json({ message: "Failed to fetch VAPI assistants", error: err.message });
    }
  });

  app.get("/api/vapi/phone-numbers", authenticateToken, async (_req: Request, res: Response) => {
    try {
      const data = await vapiGet("/phone-number");
      const phones = data.map((p: any) => ({
        id: p.id,
        number: p.number,
        name: p.name,
        assistantId: p.assistantId,
        provider: p.provider,
        status: p.status,
        createdAt: p.createdAt,
      }));
      return res.json(phones);
    } catch (err: any) {
      return res.status(502).json({ message: "Failed to fetch VAPI phone numbers", error: err.message });
    }
  });

  app.get("/api/vapi/calls", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { assistantId, limit = "20" } = req.query;
      let path = `/call?limit=${limit}`;
      if (assistantId) path += `&assistantId=${assistantId}`;
      const data = await vapiGet(path);
      const calls = data.map((c: any) => ({
        id: c.id,
        type: c.type,
        status: c.status,
        startedAt: c.startedAt,
        endedAt: c.endedAt,
        endedReason: c.endedReason,
        cost: c.cost,
        assistantId: c.assistantId,
        phoneNumberId: c.phoneNumberId,
        customer: c.customer?.number || null,
        summary: c.summary,
        transcript: c.transcript,
        recordingUrl: c.recordingUrl,
        stereoRecordingUrl: c.stereoRecordingUrl,
        duration: c.startedAt && c.endedAt
          ? (new Date(c.endedAt).getTime() - new Date(c.startedAt).getTime()) / 1000
          : null,
        analysis: c.analysis || null,
        costBreakdown: c.costBreakdown || null,
      }));
      return res.json(calls);
    } catch (err: any) {
      return res.status(502).json({ message: "Failed to fetch VAPI calls", error: err.message });
    }
  });

  app.get("/api/vapi/calls/:callId", authenticateToken, async (req: Request, res: Response) => {
    try {
      const data = await vapiGet(`/call/${req.params.callId}`);
      return res.json({
        id: data.id,
        type: data.type,
        status: data.status,
        startedAt: data.startedAt,
        endedAt: data.endedAt,
        endedReason: data.endedReason,
        cost: data.cost,
        assistantId: data.assistantId,
        phoneNumberId: data.phoneNumberId,
        customer: data.customer?.number || null,
        summary: data.summary,
        transcript: data.transcript,
        recordingUrl: data.recordingUrl,
        stereoRecordingUrl: data.stereoRecordingUrl,
        messages: data.messages,
        analysis: data.analysis,
        costBreakdown: data.costBreakdown,
      });
    } catch (err: any) {
      return res.status(502).json({ message: "Failed to fetch call details", error: err.message });
    }
  });

  app.get("/api/vapi/analytics", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { assistantId } = req.query;
      const queries: any[] = [
        {
          table: "call",
          name: "call_stats",
          operations: [
            { operation: "count", column: "id" },
            { operation: "sum", column: "cost" },
            { operation: "avg", column: "duration" },
          ],
          ...(assistantId ? { groupBy: ["assistantId"] } : { groupBy: ["assistantId"] }),
        },
      ];
      const data = await vapiPost("/analytics", { queries });
      return res.json(data);
    } catch (err: any) {
      return res.status(502).json({ message: "Failed to fetch VAPI analytics", error: err.message });
    }
  });

  app.get("/api/tavus/personas", authenticateToken, async (_req: Request, res: Response) => {
    try {
      const data = await tavusGet("/personas");
      const personas = (data.data || []).map((p: any) => ({
        id: p.persona_id,
        name: p.persona_name,
        status: p.status,
        replicaId: p.default_replica_id,
        createdAt: p.created_at,
        context: p.context ? (typeof p.context === "string" ? p.context.slice(0, 200) : "") : "",
      }));
      return res.json(personas);
    } catch (err: any) {
      return res.status(502).json({ message: "Failed to fetch Tavus personas", error: err.message });
    }
  });

  app.get("/api/tavus/replicas", authenticateToken, async (_req: Request, res: Response) => {
    try {
      const data = await tavusGet("/replicas");
      const replicas = (data.data || []).map((r: any) => ({
        id: r.replica_id,
        name: r.replica_name,
        status: r.status,
        model: r.model_name,
        thumbnailUrl: r.thumbnail_video_url,
        createdAt: r.created_at,
      }));
      return res.json(replicas);
    } catch (err: any) {
      return res.status(502).json({ message: "Failed to fetch Tavus replicas", error: err.message });
    }
  });

  app.get("/api/tavus/conversations", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { personaId, limit = "20" } = req.query;
      let path = `/conversations?limit=${limit}`;
      if (personaId) path += `&persona_id=${personaId}`;
      const data = await tavusGet(path);
      const conversations = (data.data || []).map((c: any) => ({
        id: c.conversation_id,
        name: c.conversation_name,
        status: c.status,
        personaId: c.persona_id,
        replicaId: c.replica_id,
        conversationUrl: c.conversation_url,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      }));
      return res.json(conversations);
    } catch (err: any) {
      return res.status(502).json({ message: "Failed to fetch Tavus conversations", error: err.message });
    }
  });

  app.get("/api/vin/leads", authenticateToken, async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const nexxusOrgId = resolveNexxusOrgId(req.user.organizationId);
      const { startDate, endDate, status, limit = "100" } = req.query;
      const args: Record<string, unknown> = {
        orgId: nexxusOrgId,
        limit: Math.min(Number(limit) || 100, 100),
      };
      if (startDate) args.startDate = startDate as string;
      if (endDate) args.endDate = endDate as string;
      if (status) args.status = status as string;
      const data = await callMCP("vin_query_leads", args);
      return res.json(data);
    } catch (err: any) {
      return res.status(502).json({ message: "Failed to fetch VinSolutions leads", error: err.message });
    }
  });

  app.get("/api/vin/leads/summary", authenticateToken, async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const nexxusOrgId = resolveNexxusOrgId(req.user.organizationId);
      const orgId = req.user.organizationId;

      const { storage: storageModule } = await import("./storage");
      const warehouseMetrics = await storageModule.getWarehouseMetrics(orgId, { period: undefined });
      const latestSync = await storageModule.getLatestSync(orgId, "metrics_refresh");

      if (warehouseMetrics.length > 0) {
        const m = (key: string) => {
          const found = warehouseMetrics.find(wm => wm.metricKey === key);
          return found ? Number(found.metricValue) : 0;
        };
        const syncedAt = latestSync?.completedAt || warehouseMetrics[0]?.syncedAt || null;
        const period = warehouseMetrics[0]?.period || "";
        const [start, end] = period.includes("_") ? period.split("_") : ["", ""];

        return res.json({
          period: { start, end },
          totalLeads: m("totalLeads"),
          totalLeadsChange: m("totalLeadsChange"),
          newLeads: m("newLeads"),
          newLeadsChange: m("newLeadsChange"),
          activeLeads: m("activeLeads"),
          activeLeadsChange: m("activeLeadsChange"),
          soldLeads: m("soldLeads"),
          soldLeadsChange: m("soldLeadsChange"),
          lostLeads: m("lostLeads"),
          waitingForResponse: m("waitingForResponse"),
          appointments: m("appointments"),
          conversionRate: m("conversionRate"),
          source: "warehouse",
          syncedAt,
        });
      }

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

      return res.json({
        period: { start: curStart, end: curEnd },
        totalLeads: curTotal,
        totalLeadsChange: pctChange(curTotal, prevTotal),
        newLeads: curActiveNew,
        newLeadsChange: pctChange(curActiveNew, prevActiveNew),
        activeLeads,
        activeLeadsChange: pctChange(activeLeads, prevActiveLeads),
        soldLeads,
        soldLeadsChange: pctChange(soldLeads, prevSoldLeads),
        lostLeads,
        waitingForResponse: curActiveWaiting,
        appointments: curActiveAppt,
        conversionRate: curTotal > 0 ? Math.round((soldLeads / curTotal) * 100) : 0,
        source: "vinsolutions",
        syncedAt: null,
      });
    } catch (err: any) {
      return res.status(502).json({ message: "Failed to fetch lead summary", error: err.message });
    }
  });

  app.get("/api/vin/lead-sources", authenticateToken, async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const nexxusOrgId = resolveNexxusOrgId(req.user.organizationId);
      const data = await callMCP("vin_get_lead_sources", { orgId: nexxusOrgId });
      return res.json(data);
    } catch (err: any) {
      return res.status(502).json({ message: "Failed to fetch lead sources", error: err.message });
    }
  });

  app.get("/api/vin/lead-statuses", authenticateToken, async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const nexxusOrgId = resolveNexxusOrgId(req.user.organizationId);
      const data = await callMCP("vin_get_lead_statuses", { orgId: nexxusOrgId });
      return res.json(data);
    } catch (err: any) {
      return res.status(502).json({ message: "Failed to fetch lead statuses", error: err.message });
    }
  });

  app.get("/api/vin/dealers", authenticateToken, async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const nexxusOrgId = resolveNexxusOrgId(req.user.organizationId);
      const data = await callMCP("vin_list_dealers", { orgId: nexxusOrgId });
      return res.json(data);
    } catch (err: any) {
      return res.status(502).json({ message: "Failed to fetch dealers", error: err.message });
    }
  });

  app.get("/api/vin/token-status", authenticateToken, async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const nexxusOrgId = resolveNexxusOrgId(req.user.organizationId);
      const data = await callMCP("vin_token_status", { orgId: nexxusOrgId });
      return res.json(data);
    } catch (err: any) {
      return res.status(502).json({ message: "Failed to check token status", error: err.message });
    }
  });
}
