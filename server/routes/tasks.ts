import type { Express } from "express";
import { authenticateToken } from "../auth";
import { storage } from "../storage";
import { insertTaskSchema, updateTaskSchema } from "@shared/schema";

export function registerTaskRoutes(app: Express) {
  app.get("/api/tasks", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const filters: { status?: string; assignedUserId?: string; type?: string } = {};
      if (typeof req.query.status === "string") filters.status = req.query.status;
      if (typeof req.query.assignedUserId === "string") filters.assignedUserId = req.query.assignedUserId;
      if (typeof req.query.type === "string") filters.type = req.query.type;
      const result = await storage.getTasks(req.user.organizationId, filters);
      return res.json(result);
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const parsed = insertTaskSchema.safeParse({
        ...req.body,
        organizationId: req.user.organizationId,
        assignedUserId: req.body.assignedUserId || req.user.id,
      });
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid task data", errors: parsed.error.flatten() });
      }
      const task = await storage.createTask(parsed.data);
      return res.status(201).json(task);
    } catch (err) {
      return res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.patch("/api/tasks/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const existing = await storage.getTask(req.params.id as string);
      if (!existing) return res.status(404).json({ message: "Task not found" });
      if (existing.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }
      const parsed = updateTaskSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid task data", errors: parsed.error.flatten() });
      }
      const task = await storage.updateTask(req.params.id as string, parsed.data);
      return res.json(task);
    } catch (err) {
      return res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const existing = await storage.getTask(req.params.id as string);
      if (!existing) return res.status(404).json({ message: "Task not found" });
      if (existing.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }
      await storage.deleteTask(req.params.id as string);
      return res.json({ message: "Task deleted" });
    } catch (err) {
      return res.status(500).json({ message: "Failed to delete task" });
    }
  });
}
