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
