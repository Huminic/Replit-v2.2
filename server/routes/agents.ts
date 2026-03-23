import type { Express } from "express";
import { authenticateToken, requireRole } from "../auth";
import { storage } from "../storage";
import { requireEntitlement } from "../middleware/entitlementCheck";
import { insertAgentSchema, updateAgentSchema } from "@shared/schema";

export function registerAgentRoutes(app: Express) {
  app.get("/api/agents", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const filters: { department?: string } = {};
      if (req.query.department) filters.department = req.query.department as string;
      const agentList = await storage.getAgents(req.user.organizationId, filters);
      return res.json(agentList);
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch agents" });
    }
  });

  app.get("/api/agents/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const agent = await storage.getAgent(req.params.id as string);
      if (!agent) return res.status(404).json({ message: "Agent not found" });
      if (agent.organizationId !== req.user.organizationId && req.user.roleLevel > 2) {
        return res.status(403).json({ message: "Access denied" });
      }
      return res.json(agent);
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch agent" });
    }
  });

  app.post("/api/agents", authenticateToken, requireRole(3), requireEntitlement('agent_slots'), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const parsed = insertAgentSchema.safeParse({
        ...req.body,
        organizationId: req.user.organizationId,
      });
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid agent data", errors: parsed.error.flatten() });
      }
      const agent = await storage.createAgent(parsed.data);

      storage.createActivityLog({
        userId: req.user!.id,
        organizationId: req.user!.organizationId,
        action: "agent_created",
        entityType: "agent",
        entityId: agent.id,
        metadata: { agentName: agent.name, department: agent.department },
      }).catch(() => {});

      return res.status(201).json(agent);
    } catch (err) {
      return res.status(500).json({ message: "Failed to create agent" });
    }
  });

  app.patch("/api/agents/:id", authenticateToken, requireRole(3), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const existing = await storage.getAgent(req.params.id as string);
      if (!existing) return res.status(404).json({ message: "Agent not found" });
      if (existing.organizationId !== req.user.organizationId && req.user.roleLevel > 2) {
        return res.status(403).json({ message: "Access denied" });
      }
      const parsed = updateAgentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid update data", errors: parsed.error.flatten() });
      }
      const agent = await storage.updateAgent(req.params.id as string, parsed.data);

      storage.createActivityLog({
        userId: req.user!.id,
        organizationId: req.user!.organizationId,
        action: "agent_updated",
        entityType: "agent",
        entityId: req.params.id as string,
        metadata: { agentName: existing.name, fields: Object.keys(parsed.data).join(", ") },
      }).catch(() => {});

      return res.json(agent);
    } catch (err) {
      return res.status(500).json({ message: "Failed to update agent" });
    }
  });

  // --- Trigger Configuration API (G-7.2) ---

  const VALID_TRIGGER_TYPES = ["new_lead_followup", "stale_lead", "appointment_reminder"] as const;
  const VALID_TRIGGER_CHANNELS = ["sms", "phone", "email"] as const;

  app.get("/api/agents/:id/triggers", authenticateToken, requireRole(3), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const agent = await storage.getAgent(req.params.id as string);
      if (!agent) return res.status(404).json({ message: "Agent not found" });
      if (agent.organizationId !== req.user.organizationId && req.user.roleLevel > 2) {
        return res.status(403).json({ message: "Access denied" });
      }
      const triggers = (agent.triggers as any[]) || [];
      return res.json({ agentId: agent.id, agentName: agent.name, triggers });
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch trigger configuration" });
    }
  });

  app.patch("/api/agents/:id/triggers", authenticateToken, requireRole(3), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const agent = await storage.getAgent(req.params.id as string);
      if (!agent) return res.status(404).json({ message: "Agent not found" });
      if (agent.organizationId !== req.user.organizationId && req.user.roleLevel > 2) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { triggers } = req.body;
      if (!Array.isArray(triggers)) {
        return res.status(400).json({ message: "triggers must be an array" });
      }

      const errors: string[] = [];
      for (let i = 0; i < triggers.length; i++) {
        const t = triggers[i];
        if (!t.type || !VALID_TRIGGER_TYPES.includes(t.type)) {
          errors.push(`triggers[${i}].type must be one of: ${VALID_TRIGGER_TYPES.join(", ")}`);
        }
        if (t.config?.channel && !VALID_TRIGGER_CHANNELS.includes(t.config.channel)) {
          errors.push(`triggers[${i}].config.channel must be one of: ${VALID_TRIGGER_CHANNELS.join(", ")}`);
        }
        if (t.config?.delayHours !== undefined) {
          if (typeof t.config.delayHours !== "number" || t.config.delayHours < 0) {
            errors.push(`triggers[${i}].config.delayHours must be a non-negative number`);
          }
        }
        if (typeof t.enabled !== "boolean" && t.enabled !== undefined) {
          errors.push(`triggers[${i}].enabled must be a boolean`);
        }
      }

      if (errors.length > 0) {
        return res.status(400).json({ message: "Validation failed", errors });
      }

      const updated = await storage.updateAgent(req.params.id as string, { triggers });

      storage.createActivityLog({
        userId: req.user!.id,
        organizationId: req.user!.organizationId,
        action: "agent_triggers_updated",
        entityType: "agent",
        entityId: req.params.id as string,
        metadata: { agentName: agent.name, triggerCount: triggers.length },
      }).catch(() => {});

      return res.json({ agentId: req.params.id as string, triggers: (updated?.triggers as any[]) || [] });
    } catch (err) {
      return res.status(500).json({ message: "Failed to update trigger configuration" });
    }
  });

  app.delete("/api/agents/:id", authenticateToken, requireRole(3), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const existing = await storage.getAgent(req.params.id as string);
      if (!existing) return res.status(404).json({ message: "Agent not found" });
      if (existing.organizationId !== req.user.organizationId && req.user.roleLevel > 2) {
        return res.status(403).json({ message: "Access denied" });
      }
      await storage.deleteAgent(req.params.id as string);

      storage.createActivityLog({
        userId: req.user!.id,
        organizationId: req.user!.organizationId,
        action: "agent_deleted",
        entityType: "agent",
        entityId: req.params.id as string,
        metadata: { agentName: existing.name },
      }).catch(() => {});

      return res.json({ message: "Agent deleted" });
    } catch (err) {
      return res.status(500).json({ message: "Failed to delete agent" });
    }
  });
}
