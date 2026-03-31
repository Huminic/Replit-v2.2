import type { Express } from "express";
import { authenticateToken } from "../auth";
import { storage } from "../storage";
import { billingService } from "../services/billingService";
import { callMCP } from "../vendorProxy";

// Extract model and requestId from a fal.run URL (e.g. https://queue.fal.run/fal-ai/flux/dev/requests/abc123/status)
function parseFalUrl(url: string): { model: string; requestId: string } | null {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.replace(/^\//, '').split('/requests/');
    if (parts.length === 2) {
      const model = parts[0];
      const requestId = parts[1].replace(/\/(status|result)$/, '');
      return { model, requestId };
    }
  } catch {}
  return null;
}

export function registerProxyRoutes(app: Express) {
  app.post("/api/fal-proxy", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });

      const { endpoint, input } = req.body;
      if (!endpoint) {
        return res.status(400).json({ message: "endpoint is required" });
      }

      // Extract model ID from endpoint (strip URL prefix if present)
      let model = endpoint;
      if (endpoint.startsWith("https://")) {
        try {
          const parsed = new URL(endpoint);
          model = parsed.pathname.replace(/^\//, '');
        } catch { return res.status(400).json({ message: "Invalid endpoint URL" }); }
      }

      const data = await callMCP("fal_submit", { model, input: input || {} });

      if (req.user?.organizationId) {
        const endpointLower = (endpoint || '').toLowerCase();
        if (endpointLower.includes('video') || endpointLower.includes('kling') || endpointLower.includes('runway') || endpointLower.includes('minimax')) {
          try { billingService.emitUsageEvent(req.user.organizationId, 'video_generated', { seconds: 0 }); } catch(e) {}
        } else {
          try { billingService.emitUsageEvent(req.user.organizationId, 'image_generated', {}); } catch(e) {}
        }
      }

      return res.json(data);
    } catch (err: any) {
      console.error("[fal-proxy] Error:", err);
      return res.status(502).json({ message: "fal.ai proxy error", error: err.message });
    }
  });

  app.post("/api/fal-proxy/status", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });

      const { requestId, endpoint, statusUrl: directStatusUrl } = req.body;

      let model = endpoint;
      let reqId = requestId;

      // If directStatusUrl provided, extract model and requestId from it
      if (directStatusUrl && (!model || !reqId)) {
        const parsed = parseFalUrl(directStatusUrl);
        if (parsed) {
          model = model || parsed.model;
          reqId = reqId || parsed.requestId;
        }
      }

      if (!model || !reqId) {
        return res.status(400).json({ message: "requestId and endpoint are required, or provide statusUrl" });
      }

      const data = await callMCP("fal_get_status", { model, requestId: reqId });
      return res.json(data);
    } catch (err: any) {
      console.error("[fal-proxy/status] Error:", err);
      return res.status(502).json({ message: "fal.ai status proxy error", error: err.message });
    }
  });

  app.post("/api/fal-proxy/result", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });

      const { requestId, endpoint, responseUrl: directResponseUrl } = req.body;

      let model = endpoint;
      let reqId = requestId;

      // If directResponseUrl provided, extract model and requestId from it
      if (directResponseUrl && (!model || !reqId)) {
        const parsed = parseFalUrl(directResponseUrl);
        if (parsed) {
          model = model || parsed.model;
          reqId = reqId || parsed.requestId;
        }
      }

      if (!model || !reqId) {
        return res.status(400).json({ message: "requestId and endpoint are required, or provide responseUrl" });
      }

      const data = await callMCP("fal_get_result", { model, requestId: reqId });
      return res.json(data);
    } catch (err: any) {
      console.error("[fal-proxy/result] Error:", err);
      return res.status(502).json({ message: "fal.ai result proxy error", error: err.message });
    }
  });

  app.post("/api/openai-proxy", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });

      const openaiKey = process.env.OPENAI_API_KEY;
      if (!openaiKey) {
        return res.status(503).json({ message: "OPENAI_API_KEY is not configured" });
      }

      const { messages, model, max_tokens, temperature, response_format, tools } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ message: "messages array is required" });
      }

      const payload: Record<string, any> = {
        model: model || "gpt-4o",
        messages,
      };
      if (max_tokens !== undefined) payload.max_tokens = max_tokens;
      if (temperature !== undefined) payload.temperature = temperature;
      if (response_format) payload.response_format = response_format;
      if (tools && Array.isArray(tools)) payload.tools = tools;

      const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!openaiResponse.ok) {
        const errText = await openaiResponse.text();
        return res.status(openaiResponse.status).json({
          message: "OpenAI request failed",
          error: errText,
        });
      }

      const data = await openaiResponse.json();
      return res.json(data);
    } catch (err: any) {
      console.error("[openai-proxy] Error:", err);
      return res.status(502).json({ message: "OpenAI proxy error", error: err.message });
    }
  });

  app.post("/api/maps-proxy", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });

      const mapsKey = process.env.GOOGLE_MAPS_API_KEY;
      if (!mapsKey) {
        return res.status(503).json({ message: "GOOGLE_MAPS_API_KEY is not configured" });
      }

      const { action, params } = req.body;
      if (!action) {
        return res.status(400).json({ message: "action is required (geocode, nearby, details)" });
      }

      let url: string;
      const queryParams = new URLSearchParams({ key: mapsKey });

      switch (action) {
        case "geocode": {
          if (!params?.address) {
            return res.status(400).json({ message: "params.address is required for geocode" });
          }
          queryParams.set("address", params.address);
          url = `https://maps.googleapis.com/maps/api/geocode/json?${queryParams.toString()}`;
          break;
        }
        case "nearby": {
          if (!params?.location || !params?.radius) {
            return res.status(400).json({ message: "params.location and params.radius are required for nearby search" });
          }
          queryParams.set("location", params.location);
          queryParams.set("radius", String(params.radius));
          if (params.type) queryParams.set("type", params.type);
          if (params.keyword) queryParams.set("keyword", params.keyword);
          url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${queryParams.toString()}`;
          break;
        }
        case "details": {
          if (!params?.place_id) {
            return res.status(400).json({ message: "params.place_id is required for details" });
          }
          queryParams.set("place_id", params.place_id);
          if (params.fields) queryParams.set("fields", params.fields);
          url = `https://maps.googleapis.com/maps/api/place/details/json?${queryParams.toString()}`;
          break;
        }
        default:
          return res.status(400).json({ message: `Unknown action: ${action}. Supported: geocode, nearby, details` });
      }

      const mapsResponse = await fetch(url);
      if (!mapsResponse.ok) {
        const errText = await mapsResponse.text();
        return res.status(mapsResponse.status).json({
          message: "Google Maps request failed",
          error: errText,
        });
      }

      const data = await mapsResponse.json();
      return res.json(data);
    } catch (err: any) {
      console.error("[maps-proxy] Error:", err);
      return res.status(502).json({ message: "Google Maps proxy error", error: err.message });
    }
  });
}
