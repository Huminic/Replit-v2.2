import type { Express, Request, Response } from "express";
import { authenticateToken } from "./auth";

const VAPI_BASE = "https://api.vapi.ai";
const TAVUS_BASE = "https://tavusapi.com/v2";

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
}
