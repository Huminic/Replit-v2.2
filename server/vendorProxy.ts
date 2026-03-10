import type { Express, Request, Response } from "express";
import { authenticateToken } from "./auth";
import https from "https";

const VAPI_BASE = "https://api.vapi.ai";
const TAVUS_BASE = "https://tavusapi.com/v2";

const NEXXUS_ORG_MAP: Record<string, string> = {
  "a9f40650-dc8e-4a86-b0b6-5b94ea5b63ee": "3795b8f6-aca7-45fc-b77e-fc671b85a9f3",
  "af3d5c1f-b170-4310-b870-d6a06f5fa527": "7f868569-62e5-4d49-9378-2e25d6a69321",
  "ffe79304-9db7-4366-8ca9-e94fd7028ef1": "8751c73d-4570-4b8d-bd40-fa4f1e48024d",
  "c4d5e6f7-a8b9-4c0d-1e2f-3a4b5c6d7e8f": "227a5597-543b-4e0c-9e44-fc6ba93f001a",
  "d5e6f7a8-b9c0-4d1e-2f3a-4b5c6d7e8f9a": "2ff5afa0-d8c2-474c-b67a-afa8922c52b8",
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

export function extractContactIdFromHref(href: string): number | null {
  const match = href.match(/\/contacts\/id\/(\d+)/);
  return match ? Number(match[1]) : null;
}

function flattenContactInfo(raw: any): any {
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

  app.post("/api/tavus/conversations", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { personaId, visitorName } = req.body;
      if (!personaId) {
        return res.status(400).json({ message: "personaId is required" });
      }
      const payload: Record<string, unknown> = { persona_id: personaId };
      if (visitorName) {
        payload.conversation_name = `Session with ${visitorName}`;
        payload.custom_greeting = `Hello ${visitorName}, how can I help you today?`;
      }
      const data = await tavusPost("/conversations", payload);
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
      return res.status(502).json({ message: "Failed to fetch VinSolutions leads", error: err.message });
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

      const leads = await storageModule.getWarehouseLeads(orgId, { createdAfter: thirtyDaysAgo });

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(todayStart);
      todayEnd.setDate(todayEnd.getDate() + 1);
      const appts = await storageModule.getAppointments(orgId, { startDate: todayStart, endDate: todayEnd });

      const cur = {
        total: leads.length,
        active: leads.filter((l: any) => isActiveLead(l.vinStatus)).length,
        new: leads.filter((l: any) => isNewLead(l.vinStatus)).length,
        sold: leads.filter((l: any) => isSoldLead(l.vinStatus)).length,
        lost: leads.filter((l: any) => isLostLead(l.vinStatus)).length,
        waiting: leads.filter((l: any) => l.vinStatus === 'ACTIVE_WAITING_FOR_PROSPECT_RESPONSE').length,
        appt: appts.length,
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
        totalLeadsChange: 0,
        newLeads: cur.new,
        newLeadsChange: 0,
        activeLeads: cur.active,
        activeLeadsChange: 0,
        soldLeads: cur.sold,
        soldLeadsChange: 0,
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

  app.patch("/api/vin/leads/:leadId", authenticateToken, async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const nexxusOrgId = resolveNexxusOrgId(req.user.organizationId);
      const leadId = Number(req.params.leadId);
      if (isNaN(leadId)) return res.status(400).json({ message: "leadId must be numeric" });
      const { status, coBuyer, vehicles, ...rest } = req.body;
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

  app.put("/api/vin/contacts/:contactId", authenticateToken, async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const nexxusOrgId = resolveNexxusOrgId(req.user.organizationId);
      const contactId = Number(req.params.contactId);
      if (isNaN(contactId)) return res.status(400).json({ message: "contactId must be numeric" });
      const args: Record<string, unknown> = { orgId: nexxusOrgId, contactId, ...req.body };
      const data = await callMCP("vin_update_contact", args);
      return res.json(data);
    } catch (err: any) {
      return res.status(502).json({ message: "Failed to update contact", error: err.message });
    }
  });

  app.post("/api/vin/leads/:leadId/vehicles-of-interest", authenticateToken, async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const nexxusOrgId = resolveNexxusOrgId(req.user.organizationId);
      const leadId = Number(req.params.leadId);
      if (isNaN(leadId)) return res.status(400).json({ message: "leadId must be numeric" });
      const args: Record<string, unknown> = { orgId: nexxusOrgId, leadId, ...req.body };
      const data = await callMCP("vin_add_vehicle_of_interest", args);
      return res.json(data);
    } catch (err: any) {
      return res.status(502).json({ message: "Failed to add vehicle of interest", error: err.message });
    }
  });
}
