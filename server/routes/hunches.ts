import type { Express } from "express";
import { authenticateToken, requireRole } from "../auth";
import { storage } from "../storage";
import { updateHunchSchema } from "@shared/schema";
import { generateHunchesForOrg } from "../services/hunchService";

export function registerHunchRoutes(app: Express) {
  app.get("/api/hunches", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const filters: { status?: string; department?: string } = {};
      if (req.query.status) filters.status = req.query.status as string;
      if (req.query.department) filters.department = req.query.department as string;
      const hunchList = await storage.getHunches(req.user.organizationId, filters);
      return res.json(hunchList);
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch hunches" });
    }
  });

  app.patch("/api/hunches/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const existing = await storage.getHunch(req.params.id as string);
      if (!existing) return res.status(404).json({ message: "Hunch not found" });
      if (existing.organizationId !== req.user.organizationId && req.user.roleLevel > 2) {
        return res.status(403).json({ message: "Access denied" });
      }
      const parsed = updateHunchSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid update data", errors: parsed.error.flatten() });
      }
      const updateData: Record<string, any> = { status: parsed.data.status };
      if (parsed.data.status === "accepted") updateData.acceptedAt = new Date();
      if (parsed.data.status === "resolved") updateData.resolvedAt = new Date();
      const updated = await storage.updateHunch(req.params.id as string, updateData);
      return res.json(updated);
    } catch (err) {
      return res.status(500).json({ message: "Failed to update hunch" });
    }
  });

  app.post("/api/hunches/generate", authenticateToken, requireRole(3), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const created = await generateHunchesForOrg(req.user.organizationId, req.user.id);
      return res.json(created);
    } catch (err) {
      console.error("Hunch generation error:", err);
      return res.status(500).json({ message: "Failed to generate hunches" });
    }
  });
}
