import type { Express } from "express";
import rateLimit from "express-rate-limit";
import { authenticateToken, requireRole } from "../auth";
import { storage } from "../storage";
import { insertWidgetSchema, updateWidgetSchema } from "@shared/schema";
import { requireEntitlement } from "../middleware/entitlementCheck";

const widgetLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false, message: { error: 'Rate limit exceeded' } });

export function registerWidgetRoutes(app: Express) {
  app.post("/api/widget/video-session", widgetLimiter, async (req, res) => {
    try {
      const { widgetCode, visitorName, slug } = req.body;

      let organizationId: string | null = null;
      if (widgetCode) {
        const widget = await storage.getWidgetByCode(widgetCode);
        if (!widget) {
          return res.status(404).json({ message: "Widget not found" });
        }
        organizationId = widget.organizationId;
      } else if (slug) {
        const orgs = await storage.getOrganizations();
        const org = orgs.find(o => o.slug === slug);
        if (!org) {
          return res.status(404).json({ message: "Organization not found" });
        }
        organizationId = org.id;
      } else {
        return res.status(400).json({ message: "widgetCode or slug is required" });
      }

      const orgAgents = await storage.getAgents(organizationId);
      const agentWithTavus = orgAgents.find((a) => a.tavusPersonaId);
      if (!agentWithTavus || !agentWithTavus.tavusPersonaId) {
        return res.status(400).json({ message: "No Tavus persona configured for this organization" });
      }

      const tavusApiKey = process.env.TAVUS_API_KEY;
      if (!tavusApiKey) {
        return res.status(500).json({ message: "TAVUS_API_KEY is not configured" });
      }

      const payload: Record<string, unknown> = { persona_id: agentWithTavus.tavusPersonaId };
      if (visitorName) {
        payload.conversation_name = `Widget session with ${visitorName}`;
        payload.custom_greeting = `Hello ${visitorName}, how can I help you today?`;
      }

      const tavusRes = await fetch("https://tavusapi.com/v2/conversations", {
        method: "POST",
        headers: {
          "x-api-key": tavusApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!tavusRes.ok) {
        const errText = await tavusRes.text();
        return res.status(502).json({ message: "Failed to create Tavus conversation", error: errText });
      }

      const data = await tavusRes.json();
      return res.json({
        conversationId: data.conversation_id,
        conversationUrl: data.conversation_url,
        status: data.status,
      });
    } catch (err: any) {
      console.error("[WIDGET] Video session error:", err);
      return res.status(500).json({ message: "Failed to create video session", error: err.message });
    }
  });

  app.get("/api/widgets", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const result = await storage.getWidgets(req.user.organizationId);
      return res.json(result);
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch widgets" });
    }
  });

  app.get("/api/widgets/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const widget = await storage.getWidget(req.params.id as string);
      if (!widget) return res.status(404).json({ message: "Widget not found" });
      if (widget.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }
      return res.json(widget);
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch widget" });
    }
  });

  app.post("/api/widgets", authenticateToken, requireRole(3), requireEntitlement('widget_slots'), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const widgetCode = `wgt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const parsed = insertWidgetSchema.safeParse({
        ...req.body,
        organizationId: req.user.organizationId,
        widgetCode: req.body.widgetCode || widgetCode,
      });
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid widget data", errors: parsed.error.flatten() });
      }
      const widget = await storage.createWidget(parsed.data);
      return res.status(201).json(widget);
    } catch (err) {
      return res.status(500).json({ message: "Failed to create widget" });
    }
  });

  app.patch("/api/widgets/:id", authenticateToken, requireRole(3), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const existing = await storage.getWidget(req.params.id as string);
      if (!existing) return res.status(404).json({ message: "Widget not found" });
      if (existing.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }
      const parsed = updateWidgetSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid widget data", errors: parsed.error.flatten() });
      }
      const widget = await storage.updateWidget(req.params.id as string, parsed.data);
      return res.json(widget);
    } catch (err) {
      return res.status(500).json({ message: "Failed to update widget" });
    }
  });

  app.delete("/api/widgets/:id", authenticateToken, requireRole(3), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const existing = await storage.getWidget(req.params.id as string);
      if (!existing) return res.status(404).json({ message: "Widget not found" });
      if (existing.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }
      await storage.deleteWidget(req.params.id as string);
      return res.json({ message: "Widget deleted" });
    } catch (err) {
      return res.status(500).json({ message: "Failed to delete widget" });
    }
  });
}
