import type { Express } from "express";
import { authenticateToken } from "../auth";
import { storage } from "../storage";

export function registerRoleRoutes(app: Express) {
  app.get("/api/roles", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const roleList = await storage.getRoles();
      return res.json(roleList);
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch roles" });
    }
  });
}
