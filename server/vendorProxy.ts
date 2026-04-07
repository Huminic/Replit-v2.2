import type { Express, Request, Response } from "express";
import { authenticateToken } from "./auth";
import https from "https";
import { z } from "zod";

const VAPI_BASE = "https://api.vapi.ai";
const TAVUS_BASE = "https://tavusapi.com/v2";
const MCP_BASE_URL = process.env.MCP_BASE_URL || "https://mcp.huminicdev.com";

function loadNexxusOrgMap(): Record<string, string> {
  const envMap = process.env.NEXXUS_ORG_MAP;
  if (envMap) {
    try {
      return JSON.parse(envMap);
    } catch (e) {
      console.error("[VendorProxy] Failed to parse NEXXUS_ORG_MAP env var:", e);
      return {};
    }
  }
  return {};
}

const NEXXUS_ORG_MAP: Record<string, string> = loadNexxusOrgMap();

export function callMCP(toolName: string, args: Record<string, unknown>): Promise<any> {
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
  if (NEXXUS_ORG_MAP[localOrgId]) return NEXXUS_ORG_MAP[localOrgId];
  // Fallback: check integrations table cache (populated on first miss)
  if (_integrationCache[localOrgId]) return _integrationCache[localOrgId];
  return localOrgId;
}

const _integrationCache: Record<string, string> = {};

/** Populate the integration cache for an org from the DB integrations table. */
export async function warmIntegrationCache(localOrgId: string): Promise<void> {
  if (NEXXUS_ORG_MAP[localOrgId] || _integrationCache[localOrgId]) return;
  try {
    const { storage: storageModule } = await import("./storage");
    const ints = await storageModule.getIntegrations(localOrgId, { provider: "vinsolutions" });
    if (ints.length > 0 && ints[0].nexxusOrgId) {
      _integrationCache[localOrgId] = ints[0].nexxusOrgId;
    }
  } catch (e) {
    console.error("[VendorProxy] Failed to warm integration cache:", e);
  }
}

export function extractContactIdFromHref(href: string): number | null {
  const match = href.match(/\/contacts\/id\/(\d+)/);
  return match ? Number(match[1]) : null;
}

export function flattenContactInfo(raw: any): any {
  const ci = Array.isArray(raw) && raw.length > 0 && raw[0]?.ContactInformation
    ? raw[0].ContactInformation
    : raw;
  if (!ci || typeof ci !== "object") return raw;

  const primaryEmail = Array.isArray(ci.Emails)
    ? ci.Emails.find((e: any) => e.EmailType === "Primary")?.EmailAddress || ci.Emails[0]?.EmailAddress
    : ci.EmailAddress || ci.Email || ci.emailAddress || ci.email;

  const primaryPhone = Array.isArray(ci.Phones)
    ? ci.Phones.find((p: any) => p.PhoneType === "Cell")?.Number
      || ci.Phones.find((p: any) => p.PhoneType === "Home")?.Number
      || ci.Phones[0]?.Number
    : ci.PhoneNumber || ci.Phone || ci.phoneNumber || ci.phone;

  const primaryAddress = Array.isArray(ci.Addresses) ? ci.Addresses[0] : null;

  return {
    contactId: ci.ContactId || ci.Id || ci.id,
    firstName: ci.FirstName || ci.firstName,
    lastName: ci.LastName || ci.lastName,
    email: primaryEmail || null,
    phone: primaryPhone || null,
    city: primaryAddress?.City || ci.City || ci.city || null,
    state: primaryAddress?.State || ci.State || ci.state || null,
    zip: primaryAddress?.PostalCode || ci.ZipCode || ci.zipCode || null,
    companyName: ci.CompanyName || ci.companyName || null,
    doNotCall: ci.DoNotCall ?? ci.doNotCall ?? null,
    doNotEmail: ci.DoNotEmail ?? ci.doNotEmail ?? null,
    doNotMail: ci.DoNotMail ?? ci.doNotMail ?? null,
    _raw: ci,
  };
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

export async function vapiPost(path: string, body: unknown) {
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

async function tavusPost(path: string, body: unknown) {
  const apiKey = process.env.TAVUS_API_KEY;
  if (!apiKey) throw new Error("TAVUS_API_KEY is not configured");
  const res = await fetch(`${TAVUS_BASE}${path}`, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Tavus POST ${path}: ${res.status}`);
  return res.json();
}

export function registerVendorRoutes(app: Express) {
  app.get("/api/vapi/assistants", authenticateToken, async (req: Request, res: Response) => {
    try {
      const data = await callMCP("vapi_list_assistants", { limit: 100 });
      const arr = Array.isArray(data) ? data : [];

      // SNP-001 Step 7: filter assistants by org's VAPI assistant IDs to prevent cross-org leak
      const orgId = (req as any).user?.organizationId;
      let orgAssistantIds: Set<string> | null = null;
      if (orgId) {
        const { storage: storageModule } = await import("./storage");
        const orgAgents = await storageModule.getAgents(orgId);
        orgAssistantIds = new Set(
          orgAgents
            .filter((a: any) => a.vapiAssistantId)
            .map((a: any) => a.vapiAssistantId!)
        );
      }

      const assistants = arr
        .filter((a: any) => !orgAssistantIds || orgAssistantIds.size === 0 || orgAssistantIds.has(a.id))
        .map((a: any) => ({
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
      const data = await callMCP("vapi_list_phone_numbers", { limit: 100 });
      const arr = Array.isArray(data) ? data : [];
      const phones = arr.map((p: any) => ({
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
      const mcpArgs: Record<string, unknown> = { limit: Number(limit) };
      if (assistantId) mcpArgs.assistantId = assistantId as string;
      const data = await callMCP("vapi_list_calls", mcpArgs);
      const arr = Array.isArray(data) ? data : [];

      // BUG-INT-02 fix: filter calls by org's VAPI assistant IDs to prevent cross-org data leak
      const orgId = (req as any).user?.organizationId;
      let orgAssistantIds: Set<string> | null = null;
      const agentNameMap = new Map<string, string>();
      if (orgId) {
        const { storage: storageModule } = await import("./storage");
        const orgAgents = await storageModule.getAgents(orgId);
        orgAssistantIds = new Set(
          orgAgents
            .filter((a: any) => a.vapiAssistantId)
            .map((a: any) => a.vapiAssistantId!)
        );
        // SNP-001 Step 6: build name lookup from org agents (reuses same DB fetch)
        for (const a of orgAgents) {
          if (a.vapiAssistantId) agentNameMap.set(a.vapiAssistantId, a.name);
        }
      }

      const calls = arr
        .filter((c: any) => !orgAssistantIds || orgAssistantIds.size === 0 || orgAssistantIds.has(c.assistantId))
        .map((c: any) => ({
          id: c.id,
          type: c.type,
          status: c.status,
          startedAt: c.startedAt,
          endedAt: c.endedAt,
          endedReason: c.endedReason,
          cost: c.cost,
          assistantId: c.assistantId,
          assistantName: agentNameMap.get(c.assistantId) || c.assistantId,
          phoneNumberId: c.phoneNumberId,
          // BUG-INT-03 fix: return customer as object so frontend can read call.customer?.number
          customer: c.customer ? { number: c.customer.number || null, name: c.customer.name || null } : null,
          phoneNumber: c.customer?.number || null,
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
      const data = await callMCP("vapi_get_call", { callId: req.params.callId });
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
      const data = await callMCP("vapi_get_analytics", { queries });
      return res.json(data);
    } catch (err: any) {
      return res.status(502).json({ message: "Failed to fetch VAPI analytics", error: err.message });
    }
  });

  app.get("/api/tavus/personas", authenticateToken, async (_req: Request, res: Response) => {
    try {
      const data = await callMCP("tavus_list_personas", { limit: 100 });
      const items = Array.isArray(data) ? data : (data?.data || []);
      const personas = items.map((p: any) => ({
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
      const data = await callMCP("tavus_list_replicas", {});
      const items = Array.isArray(data) ? data : (data?.data || []);
      const replicas = items.map((r: any) => ({
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

  app.post("/api/tavus/conversations", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { personaId, visitorName } = req.body;
      if (!personaId) {
        return res.status(400).json({ message: "personaId is required" });
      }
      const mcpPayload: Record<string, unknown> = {
        persona_id: personaId,
        callback_url: "https://live.huminic.app/api/webhooks/tavus",
      };
      if (visitorName) {
        mcpPayload.conversation_name = `Session with ${visitorName}`;
        mcpPayload.custom_greeting = `Hello ${visitorName}, how can I help you today?`;
      }
      const data = await callMCP("tavus_create_conversation", mcpPayload);
      return res.json({
        conversationId: data.conversation_id,
        conversationUrl: data.conversation_url,
        status: data.status,
      });
    } catch (err: any) {
      return res.status(502).json({ message: "Failed to create Tavus conversation", error: err.message });
    }
  });

  app.get("/api/tavus/conversations", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { personaId, limit = "20" } = req.query;

      // Query local DB for video conversations (webhook data stored with channel: "video")
      const orgId = (req as any).user?.organizationId;
      let localConversations: any[] = [];
      if (orgId) {
        const { storage: storageModule } = await import("./storage");
        localConversations = await storageModule.getConversations(orgId, { channel: "video" });
      }

      const convArgs: Record<string, unknown> = { limit: Number(limit) };
      if (personaId) convArgs.persona_id = personaId as string;
      const data = await callMCP("tavus_list_conversations", convArgs);
      const items = Array.isArray(data) ? data : (data?.data || []);

      // Org scoping: only return conversations for this org's Tavus personas
      let orgPersonaIds: Set<string> | null = null;
      if (orgId) {
        const { storage: storageModule } = await import("./storage");
        const orgAgents = await storageModule.getAgents(orgId);
        orgPersonaIds = new Set(orgAgents.filter((a: any) => a.tavusPersonaId).map((a: any) => a.tavusPersonaId!));
      }

      const apiConversations = items
        .filter((c: any) => !orgPersonaIds || orgPersonaIds.size === 0 || orgPersonaIds.has(c.persona_id))
        .map((c: any) => {
          // Extract visitor name from conversation_name (format: "Session with <Name>")
          const rawName = c.conversation_name || "";
          const visitorName = rawName.replace(/^Session with /i, "") || null;
          return {
            id: c.conversation_id,
            conversation_id: c.conversation_id,
            name: c.conversation_name,
            status: c.status,
            personaId: c.persona_id,
            persona_id: c.persona_id,
            persona_name: c.persona_name || null,
            personaName: c.persona_name || null,
            replicaId: c.replica_id,
            replica_id: c.replica_id,
            conversationUrl: c.conversation_url,
            // BUG-INT-05 fix: include both camelCase and snake_case for frontend compatibility
            createdAt: c.created_at,
            created_at: c.created_at,
            updatedAt: c.updated_at,
            updated_at: c.updated_at,
            ended_at: c.ended_at || c.updated_at || null,
            endedAt: c.ended_at || c.updated_at || null,
            visitor_name: visitorName,
            visitorName: visitorName,
            recording_url: c.recording_url || null,
            recordingUrl: c.recording_url || null,
            duration: c.duration || null,
          };
        });

      // Merge local DB video conversations with Tavus API results
      const apiIds = new Set(apiConversations.map((c: any) => c.conversation_id));
      const localMapped = localConversations
        .filter((c: any) => !apiIds.has(c.id))
        .map((c: any) => ({
          id: c.id,
          conversation_id: c.id,
          name: c.customerName ? `Session with ${c.customerName}` : null,
          status: c.status || "ended",
          personaId: null,
          persona_id: null,
          persona_name: null,
          personaName: null,
          replicaId: null,
          replica_id: null,
          conversationUrl: null,
          createdAt: c.createdAt,
          created_at: c.createdAt,
          updatedAt: c.updatedAt,
          updated_at: c.updatedAt,
          ended_at: c.updatedAt || null,
          endedAt: c.updatedAt || null,
          visitor_name: c.customerName || null,
          visitorName: c.customerName || null,
          recording_url: null,
          recordingUrl: null,
          duration: null,
          source: "local",
        }));

      const conversations = [...apiConversations, ...localMapped]
        .sort((a: any, b: any) => {
          const da = a.created_at ? new Date(a.created_at).getTime() : 0;
          const db = b.created_at ? new Date(b.created_at).getTime() : 0;
          return db - da;
        });
      return res.json(conversations);
    } catch (err: any) {
      return res.status(502).json({ message: "Failed to fetch Tavus conversations", error: err.message });
    }
  });

  app.get("/api/vin/leads", authenticateToken, async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const nexxusOrgId = resolveNexxusOrgId(req.user.organizationId);
      const { status, limit = "100" } = req.query;
      const fmt = (d: Date) => d.toISOString().split("T")[0];
      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const startDate = (req.query.startDate as string) || fmt(thirtyDaysAgo);
      const endDate = (req.query.endDate as string) || fmt(now);
      const args: Record<string, unknown> = {
        orgId: nexxusOrgId,
        startDate,
        endDate,
        limit: Math.min(Number(limit) || 100, 100),
      };
      if (status) args.status = status as string;
      const data = await callMCP("vin_query_leads", args);
      return res.json(data);
    } catch (err: any) {
      return res.status(503).json({ message: "VinSolutions service unavailable — upstream API may be temporarily down", error: err.message });
    }
  });

  app.get("/api/vin/leads/summary", authenticateToken, async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const orgId = (req.query.orgId as string) || req.user.organizationId;
      const nexxusOrgId = resolveNexxusOrgId(orgId);

      const { storage: storageModule } = await import("./storage");
      const { isActiveLead, isNewLead, isSoldLead, isLostLead } = await import("./statusClassifier");
      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // BUG-05 fix: query both current and previous 30-day periods for delta calculation
      const sixtyDaysAgo = new Date(now);
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const [leads, prevLeads] = await Promise.all([
        storageModule.getWarehouseLeads(orgId, { createdAfter: thirtyDaysAgo }),
        storageModule.getWarehouseLeads(orgId, { createdAfter: sixtyDaysAgo }),
      ]);
      // Previous period = leads created 60-30 days ago (exclude current period)
      const prevPeriodLeads = prevLeads.filter((l: any) => {
        const created = l.vinCreatedAt ? new Date(l.vinCreatedAt) : new Date(l.createdAt);
        return created < thirtyDaysAgo;
      });

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(todayStart);
      todayEnd.setDate(todayEnd.getDate() + 1);
      const appts = await storageModule.getAppointments(orgId, { startDate: todayStart, endDate: todayEnd });
      // BUG-03 fix: filter to scheduled only, matching pipeline metric count query
      const scheduledAppts = appts.filter((a: any) => a.status === 'scheduled');

      const cur = {
        total: leads.length,
        active: leads.filter((l: any) => isActiveLead(l.vinStatus)).length,
        new: leads.filter((l: any) => isNewLead(l.vinStatus)).length,
        sold: leads.filter((l: any) => isSoldLead(l.vinStatus)).length,
        lost: leads.filter((l: any) => isLostLead(l.vinStatus)).length,
        waiting: leads.filter((l: any) => l.vinStatus === 'ACTIVE_WAITING_FOR_PROSPECT_RESPONSE').length,
        appt: scheduledAppts.length,
      };

      const prev = {
        total: prevPeriodLeads.length,
        active: prevPeriodLeads.filter((l: any) => isActiveLead(l.vinStatus)).length,
        new: prevPeriodLeads.filter((l: any) => isNewLead(l.vinStatus)).length,
        sold: prevPeriodLeads.filter((l: any) => isSoldLead(l.vinStatus)).length,
      };

      const pctChange = (current: number, previous: number): number => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
      };

      const latestSyncDate = leads.length > 0
        ? leads.reduce((latest: Date, l: any) => {
            const s = new Date(l.syncedAt);
            return s > latest ? s : latest;
          }, new Date(0)).toISOString()
        : null;

      return res.json({
        period: { start: thirtyDaysAgo.toISOString().split("T")[0], end: now.toISOString().split("T")[0] },
        totalLeads: cur.total,
        totalLeadsChange: pctChange(cur.total, prev.total),
        newLeads: cur.new,
        newLeadsChange: pctChange(cur.new, prev.new),
        activeLeads: cur.active,
        activeLeadsChange: pctChange(cur.active, prev.active),
        soldLeads: cur.sold,
        soldLeadsChange: pctChange(cur.sold, prev.sold),
        lostLeads: cur.lost,
        waitingForResponse: cur.waiting,
        appointments: cur.appt,
        conversionRate: cur.total > 0 ? Math.round((cur.sold / cur.total) * 1000) / 10 : 0,
        source: "warehouse",
        syncedAt: latestSyncDate,
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

  app.get("/api/vin/contacts/search", authenticateToken, async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const nexxusOrgId = resolveNexxusOrgId(req.user.organizationId);
      const { q, name, email, phone } = req.query;
      const args: Record<string, unknown> = { orgId: nexxusOrgId };
      if (q) args.query = q as string;
      if (name) args.name = name as string;
      if (email) args.email = email as string;
      if (phone) args.phone = phone as string;
      const data = await callMCP("vin_search_contacts", args);
      return res.json(data);
    } catch (err: any) {
      return res.status(502).json({ message: "Failed to search contacts", error: err.message });
    }
  });

  app.get("/api/vin/contacts/:contactId", authenticateToken, async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const nexxusOrgId = resolveNexxusOrgId(req.user.organizationId);
      const contactId = Number(req.params.contactId);
      if (isNaN(contactId)) return res.status(400).json({ message: "contactId must be numeric" });
      const data = await callMCP("vin_get_contact", { orgId: nexxusOrgId, contactId });
      return res.json(flattenContactInfo(data));
    } catch (err: any) {
      return res.status(502).json({ message: "Failed to fetch contact", error: err.message });
    }
  });

  app.get("/api/vin/leads/:leadId/contact", authenticateToken, async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const orgId = req.user.organizationId;
      const nexxusOrgId = resolveNexxusOrgId(orgId);
      const leadId = req.params.leadId as string;

      const { storage: storageModule } = await import("./storage");
      const cachedLead = await storageModule.getWarehouseLeadBySourceId(orgId, leadId);
      const cachedContact = cachedLead ? {
        firstName: cachedLead.customerName?.split(" ")[0] || null,
        lastName: cachedLead.customerName?.split(" ").slice(1).join(" ") || null,
        phone: cachedLead.customerPhone || null,
        email: cachedLead.customerEmail || null,
        city: null, state: null, zip: null, companyName: null,
      } : null;

      try {
        const now = new Date();
        const ninetyDaysAgo = new Date(now);
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        const fmt = (d: Date) => d.toISOString().split("T")[0];

        const vinLeads = await callMCP("vin_query_leads", {
          orgId: nexxusOrgId,
          startDate: fmt(ninetyDaysAgo),
          endDate: fmt(now),
          limit: 500,
        });
        const items = vinLeads?.items || vinLeads?.results || (Array.isArray(vinLeads) ? vinLeads : []);
        const match = items.find((item: any) => String(item.leadId || item.id || "") === String(leadId));

        if (match) {
          const href = match.contact || match.ContactHref || match.contactHref || "";
          const contactId = typeof href === "string" ? extractContactIdFromHref(href)
            : (typeof match.contactId === "number" ? match.contactId : null);

          if (contactId) {
            const data = await callMCP("vin_get_contact", { orgId: nexxusOrgId, contactId });
            return res.json(flattenContactInfo(data));
          }
        }
      } catch (vinErr) {
        console.error("[lead-contact] VinSolutions lookup failed, using cached data:", vinErr);
      }

      if (cachedContact) {
        return res.json(cachedContact);
      }

      return res.status(404).json({ message: "Contact not found for this lead" });
    } catch (err: any) {
      return res.status(502).json({ message: "Failed to resolve lead contact", error: err.message });
    }
  });

  app.get("/api/vin/leads/:leadId/trade-vehicles", authenticateToken, async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const nexxusOrgId = resolveNexxusOrgId(req.user.organizationId);
      const leadId = Number(req.params.leadId);
      if (isNaN(leadId)) return res.status(400).json({ message: "leadId must be numeric" });
      const data = await callMCP("vin_get_trade_vehicles", { orgId: nexxusOrgId, leadId });
      return res.json(data || []);
    } catch (err: any) {
      return res.status(502).json({ message: "Failed to fetch trade vehicles", error: err.message });
    }
  });

  const updateLeadSchema = z.object({
    status: z.string().optional(),
    coBuyer: z.object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
    }).optional(),
    vehicles: z.array(z.object({
      year: z.union([z.string(), z.number()]).optional(),
      make: z.string().optional(),
      model: z.string().optional(),
      trim: z.string().optional(),
    })).optional(),
    notes: z.string().optional(),
    source: z.string().optional(),
    description: z.string().optional(),
  }).strict();

  app.patch("/api/vin/leads/:leadId", authenticateToken, async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const nexxusOrgId = resolveNexxusOrgId(req.user.organizationId);
      const leadId = Number(req.params.leadId);
      if (isNaN(leadId)) return res.status(400).json({ message: "leadId must be numeric" });
      const parsed = updateLeadSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid request body", errors: parsed.error.flatten().fieldErrors });
      }
      const { status, coBuyer, vehicles, ...rest } = parsed.data;
      const args: Record<string, unknown> = { orgId: nexxusOrgId, leadId };
      if (status) args.status = status;
      if (coBuyer) args.coBuyer = coBuyer;
      if (vehicles) args.vehicles = vehicles;
      Object.assign(args, rest);
      const data = await callMCP("vin_update_lead", args);
      return res.json(data);
    } catch (err: any) {
      return res.status(502).json({ message: "Failed to update lead", error: err.message });
    }
  });

  app.get("/api/vin/vehicle-catalog", authenticateToken, async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const nexxusOrgId = resolveNexxusOrgId(req.user.organizationId);
      const { year, make, model, trim } = req.query;
      const args: Record<string, unknown> = { orgId: nexxusOrgId };
      if (year) args.year = year as string;
      if (make) args.make = make as string;
      if (model) args.model = model as string;
      if (trim) args.trim = trim as string;
      const data = await callMCP("vin_search_vehicle_catalog", args);
      return res.json(data);
    } catch (err: any) {
      return res.status(502).json({ message: "Failed to search vehicle catalog", error: err.message });
    }
  });

  const updateContactSchema = z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    companyName: z.string().optional(),
    doNotCall: z.boolean().optional(),
    doNotEmail: z.boolean().optional(),
    doNotMail: z.boolean().optional(),
  }).strict();

  app.put("/api/vin/contacts/:contactId", authenticateToken, async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const nexxusOrgId = resolveNexxusOrgId(req.user.organizationId);
      const contactId = Number(req.params.contactId);
      if (isNaN(contactId)) return res.status(400).json({ message: "contactId must be numeric" });
      const parsed = updateContactSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid request body", errors: parsed.error.flatten().fieldErrors });
      }
      const args: Record<string, unknown> = { orgId: nexxusOrgId, contactId, ...parsed.data };
      const data = await callMCP("vin_update_contact", args);
      return res.json(data);
    } catch (err: any) {
      return res.status(502).json({ message: "Failed to update contact", error: err.message });
    }
  });

  const addVehicleOfInterestSchema = z.object({
    year: z.union([z.string(), z.number()]),
    make: z.string(),
    model: z.string(),
    trim: z.string().optional(),
    vin: z.string().optional(),
    stockNumber: z.string().optional(),
    condition: z.enum(["new", "used", "certified"]).optional(),
  }).strict();

  app.post("/api/vin/leads/:leadId/vehicles-of-interest", authenticateToken, async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const nexxusOrgId = resolveNexxusOrgId(req.user.organizationId);
      const leadId = Number(req.params.leadId);
      if (isNaN(leadId)) return res.status(400).json({ message: "leadId must be numeric" });
      const parsed = addVehicleOfInterestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid request body", errors: parsed.error.flatten().fieldErrors });
      }
      const args: Record<string, unknown> = { orgId: nexxusOrgId, leadId, ...parsed.data };
      const data = await callMCP("vin_add_vehicle_of_interest", args);
      return res.json(data);
    } catch (err: any) {
      return res.status(502).json({ message: "Failed to add vehicle of interest", error: err.message });
    }
  });
}
