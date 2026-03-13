import type { Express } from "express";
import { authenticateToken } from "../auth";
import { storage } from "../storage";
import { insertFavoriteSchema } from "@shared/schema";

export function registerFavoriteRoutes(app: Express) {
  app.get("/api/favorites", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const favs = await storage.getFavorites(req.user.id);
      return res.json(favs);
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });

  app.post("/api/favorites", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const parsed = insertFavoriteSchema.safeParse({ ...req.body, userId: req.user.id });
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid favorite data", errors: parsed.error.flatten() });
      }
      const fav = await storage.addFavorite(parsed.data);
      return res.status(201).json(fav);
    } catch (err) {
      return res.status(500).json({ message: "Failed to add favorite" });
    }
  });

  app.delete("/api/favorites/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      await storage.removeFavorite(req.params.id as string, req.user.id);
      return res.json({ message: "Favorite removed" });
    } catch (err) {
      return res.status(500).json({ message: "Failed to remove favorite" });
    }
  });
}
