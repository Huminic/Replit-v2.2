import type { Express } from "express";
import { authenticateToken } from "../auth";
import { storage } from "../storage";
import { z } from "zod";

export function registerAppointmentRoutes(app: Express) {
  app.get("/api/appointments", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const { department, startDate, endDate } = req.query;
      const filters: { department?: string; startDate?: Date; endDate?: Date } = {};
      if (department && typeof department === "string") filters.department = department;
      if (startDate && typeof startDate === "string") filters.startDate = new Date(startDate);
      if (endDate && typeof endDate === "string") filters.endDate = new Date(endDate);
      const result = await storage.getAppointments(req.user.organizationId, filters);
      return res.json(result);
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.get("/api/appointments/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const result = await storage.getAppointment(req.params.id as string);
      if (!result) return res.status(404).json({ message: "Appointment not found" });
      if (result.organizationId !== req.user.organizationId) return res.status(403).json({ message: "Access denied" });
      return res.json(result);
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch appointment" });
    }
  });

  app.post("/api/appointments", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const { title, customerName, customerPhone, customerEmail, appointmentType, department, startTime, endTime, notes, assignedUserId, source, status } = req.body;
      if (!title || !customerName || !startTime || !endTime) {
        return res.status(400).json({ message: "Missing required fields: title, customerName, startTime, endTime" });
      }
      const result = await storage.createAppointment({
        title,
        customerName,
        customerPhone: customerPhone || null,
        customerEmail: customerEmail || null,
        appointmentType: appointmentType || "general",
        department: department || "sales",
        assignedUserId: assignedUserId || null,
        organizationId: req.user.organizationId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: status || "scheduled",
        notes: notes || null,
        source: source || "manual",
      });

      try {
        const matchingLeads = await storage.findWarehouseLeadsByContact(
          req.user.organizationId,
          customerPhone || null,
          customerEmail || null
        );
        for (const lead of matchingLeads) {
          if ((lead.followupStep || 0) < 999) {
            await storage.suppressLeadFollowup(lead.id, `Appointment booked: ${title}`);
            console.log(`[Conversion] Appointment created — suppressed follow-up for lead ${lead.id} (${lead.customerName})`);
          }
        }
      } catch (suppressErr: any) {
        console.error("[Conversion] Error suppressing follow-ups after appointment:", suppressErr.message);
      }

      return res.status(201).json(result);
    } catch (err) {
      return res.status(500).json({ message: "Failed to create appointment" });
    }
  });

  app.patch("/api/appointments/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const existing = await storage.getAppointment(req.params.id as string);
      if (!existing) return res.status(404).json({ message: "Appointment not found" });
      if (existing.organizationId !== req.user.organizationId) return res.status(403).json({ message: "Access denied" });
      const updates: Record<string, any> = {};
      const allowed = ["title", "customerName", "customerPhone", "customerEmail", "appointmentType", "department", "startTime", "endTime", "status", "notes", "assignedUserId"];
      for (const key of allowed) {
        if (req.body[key] !== undefined) {
          updates[key] = (key === "startTime" || key === "endTime") ? new Date(req.body[key]) : req.body[key];
        }
      }
      const result = await storage.updateAppointment(req.params.id as string, updates);
      if (!result) return res.status(404).json({ message: "Appointment not found" });
      return res.json(result);
    } catch (err) {
      return res.status(500).json({ message: "Failed to update appointment" });
    }
  });

  app.delete("/api/appointments/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const existing = await storage.getAppointment(req.params.id as string);
      if (!existing) return res.status(404).json({ message: "Appointment not found" });
      if (existing.organizationId !== req.user.organizationId) return res.status(403).json({ message: "Access denied" });
      await storage.deleteAppointment(req.params.id as string);
      return res.json({ message: "Appointment deleted" });
    } catch (err) {
      return res.status(500).json({ message: "Failed to delete appointment" });
    }
  });
}
