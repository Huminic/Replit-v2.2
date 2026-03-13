import type { Express } from "express";
import { authenticateToken } from "../auth";
import { storage } from "../storage";

export function registerNotificationRoutes(app: Express) {
  app.get("/api/notifications", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const notifs = await storage.getNotifications(req.user.id, limit);
      return res.json(notifs);
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get("/api/notifications/unread-count", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const count = await storage.getUnreadNotificationCount(req.user.id);
      return res.json({ count });
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  app.patch("/api/notifications/:id/read", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const { eq } = await import("drizzle-orm");
      const { db } = await import("../storage");
      const { notifications } = await import("@shared/schema");
      const [notif] = await db.select().from(notifications).where(eq(notifications.id, req.params.id as string));
      if (!notif) return res.status(404).json({ message: "Notification not found" });
      if (notif.userId !== req.user.id) return res.status(403).json({ message: "Forbidden" });
      await storage.markNotificationRead(req.params.id as string);
      return res.json({ message: "Notification marked as read" });
    } catch (err) {
      return res.status(500).json({ message: "Failed to mark notification read" });
    }
  });

  app.post("/api/notifications/mark-all-read", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      await storage.markAllNotificationsRead(req.user.id);
      return res.json({ message: "All notifications marked as read" });
    } catch (err) {
      return res.status(500).json({ message: "Failed to mark all notifications read" });
    }
  });
}
