import type { Express } from "express";
import multer from "multer";
import os from "os";
import fs from "fs";
import { z } from "zod";
import { authenticateToken, requireRole } from "../auth";
import { storage } from "../storage";
import { requireEntitlement } from "../middleware/entitlementCheck";
import { insertCampaignSchema, updateCampaignSchema } from "@shared/schema";
import { startCampaignExecution, stopCampaignExecution, getExecutionStatus, getAllExecutionStatuses } from "../outbound";

const upload = multer({
  storage: multer.diskStorage({ destination: os.tmpdir() }),
  limits: { fileSize: 5 * 1024 * 1024 },
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        if (current.length > 0) {
          throw new Error(`Illegal quote placement at position ${i}`);
        }
        inQuotes = true;
      } else if (ch === ",") {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
  }
  if (inQuotes) {
    throw new Error("Unclosed quote at end of line");
  }
  result.push(current.trim());
  return result;
}

export function registerCampaignRoutes(app: Express) {
  // GET /api/campaigns — list campaigns for org
  app.get("/api/campaigns", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const filters: { department?: string } = {};
      if (req.query.department) filters.department = req.query.department as string;
      const campaignList = await storage.getCampaigns(req.user.organizationId, filters);

      const campaignIds = campaignList.map(c => c.id);
      const [allConvos, sentCountsMap] = await Promise.all([
        storage.getConversations(req.user.organizationId),
        storage.getSentCountsByCampaignIds(campaignIds),
      ]);
      const enriched = campaignList.map((c) => {
        const sentCount = sentCountsMap[c.id] || 0;
        const repliedCount = allConvos.filter(cv => cv.campaignId === c.id).length;
        return { ...c, sentCount, repliedCount };
      });

      return res.json(enriched);
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  // POST /api/campaigns — create campaign
  app.post("/api/campaigns", authenticateToken, requireRole(3), requireEntitlement('campaign_slots'), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const parsed = insertCampaignSchema.safeParse({
        ...req.body,
        organizationId: req.user.organizationId,
      });
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid campaign data", errors: parsed.error.flatten() });
      }
      const campaign = await storage.createCampaign(parsed.data);

      storage.createActivityLog({
        userId: req.user!.id,
        organizationId: req.user!.organizationId,
        action: "campaign_created",
        entityType: "campaign",
        entityId: campaign.id,
        metadata: { campaignName: campaign.name, department: campaign.department },
      }).catch(() => {});

      return res.status(201).json(campaign);
    } catch (err) {
      return res.status(500).json({ message: "Failed to create campaign" });
    }
  });

  // GET /api/campaigns/execution-statuses — all execution statuses
  app.get("/api/campaigns/execution-statuses", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      return res.json(getAllExecutionStatuses());
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch execution statuses" });
    }
  });

  // GET /api/campaigns/:id — get single campaign
  app.get("/api/campaigns/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const campaign = await storage.getCampaign(req.params.id as string);
      if (!campaign) return res.status(404).json({ message: "Campaign not found" });
      if (campaign.organizationId !== req.user.organizationId && req.user.roleLevel > 2) {
        return res.status(403).json({ message: "Access denied" });
      }
      const recipients = await storage.getRecipients(campaign.id);
      const sentCount = recipients.filter(r => r.status === "sent" || r.status === "delivered").length;
      const convos = await storage.getConversations(campaign.organizationId);
      const repliedCount = convos.filter(cv => cv.campaignId === campaign.id).length;
      return res.json({ ...campaign, sentCount, repliedCount });
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch campaign" });
    }
  });

  // PATCH /api/campaigns/:id — update campaign
  app.patch("/api/campaigns/:id", authenticateToken, requireRole(3), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const existing = await storage.getCampaign(req.params.id as string);
      if (!existing) return res.status(404).json({ message: "Campaign not found" });
      if (existing.organizationId !== req.user.organizationId && req.user.roleLevel > 2) {
        return res.status(403).json({ message: "Access denied" });
      }
      const parsed = updateCampaignSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid campaign data", errors: parsed.error.flatten() });
      }
      const campaign = await storage.updateCampaign(req.params.id as string, parsed.data);

      const actionName = parsed.data.killSwitch !== undefined
        ? (parsed.data.killSwitch ? "campaign_stopped" : "campaign_resumed")
        : parsed.data.status
          ? `campaign_${parsed.data.status}`
          : "campaign_updated";
      storage.createActivityLog({
        userId: req.user!.id,
        organizationId: req.user!.organizationId,
        action: actionName,
        entityType: "campaign",
        entityId: req.params.id as string,
        metadata: { campaignName: existing.name, fields: Object.keys(parsed.data).join(", ") },
      }).catch(() => {});

      if (parsed.data.status && parsed.data.status !== existing.status) {
        const actionLabel = parsed.data.status === "active" ? "started" : parsed.data.status === "stopped" ? "stopped" : `changed to ${parsed.data.status}`;
        const orgUsers = await storage.getUsers(req.user!.organizationId);
        for (const u of orgUsers) {
          storage.createNotification({
            userId: u.id,
            organizationId: req.user!.organizationId,
            type: "alert",
            title: `Campaign ${actionLabel}`,
            message: `Campaign "${existing.name}" has been ${actionLabel} by ${req.user!.firstName} ${req.user!.lastName}.`,
            relatedEntityType: "campaign",
            relatedEntityId: existing.id,
          }).catch(() => {});
        }
      }

      if (parsed.data.killSwitch !== undefined && parsed.data.killSwitch !== existing.killSwitch) {
        const state = parsed.data.killSwitch ? "activated" : "deactivated";
        const orgUsers = await storage.getUsers(req.user!.organizationId);
        for (const u of orgUsers) {
          storage.createNotification({
            userId: u.id,
            organizationId: req.user!.organizationId,
            type: "alert",
            title: `Kill switch ${state}`,
            message: `Kill switch for campaign "${existing.name}" has been ${state} by ${req.user!.firstName} ${req.user!.lastName}.`,
            relatedEntityType: "campaign",
            relatedEntityId: existing.id,
          }).catch(() => {});
        }
      }

      return res.json(campaign);
    } catch (err) {
      return res.status(500).json({ message: "Failed to update campaign" });
    }
  });

  // POST /api/campaigns/:id/execute — execute campaign
  app.post("/api/campaigns/:id/execute", authenticateToken, requireRole(3), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });

      const existingCampaign = await storage.getCampaign(req.params.id as string);
      if (!existingCampaign) return res.status(404).json({ message: "Campaign not found" });
      if (existingCampaign.organizationId !== req.user.organizationId && req.user.roleLevel > 2) {
        return res.status(403).json({ message: "Access denied" });
      }

      const dryRun = req.body.dryRun === true;
      const scheduledAt = req.body.scheduledAt ? new Date(req.body.scheduledAt) : null;

      if (scheduledAt && scheduledAt > new Date()) {
        const campaign = await storage.updateCampaign(req.params.id as string, {
          scheduledAt,
          status: "scheduled",
          executionStatus: "scheduled",
        });
        if (!campaign) return res.status(404).json({ message: "Campaign not found" });

        storage.createActivityLog({
          userId: req.user!.id,
          organizationId: req.user!.organizationId,
          action: "campaign_scheduled",
          entityType: "campaign",
          entityId: req.params.id as string,
          metadata: { scheduledAt: scheduledAt.toISOString() },
        }).catch(() => {});

        const orgUsers = await storage.getUsers(req.user!.organizationId);
        for (const u of orgUsers) {
          storage.createNotification({
            userId: u.id,
            organizationId: req.user!.organizationId,
            type: "info",
            title: "Campaign scheduled",
            message: `Campaign "${campaign.name}" scheduled for ${scheduledAt.toLocaleString()} by ${req.user!.firstName} ${req.user!.lastName}.`,
            relatedEntityType: "campaign",
            relatedEntityId: req.params.id as string,
          }).catch(() => {});
        }

        return res.json({ success: true, message: `Campaign scheduled for ${scheduledAt.toISOString()}`, scheduled: true });
      }

      const result = await startCampaignExecution(req.params.id as string, req.user.organizationId, dryRun);
      if (!result.success) {
        return res.status(400).json({ message: result.message });
      }

      storage.createActivityLog({
        userId: req.user!.id,
        organizationId: req.user!.organizationId,
        action: dryRun ? "campaign_dry_run" : "campaign_executed",
        entityType: "campaign",
        entityId: req.params.id as string,
        metadata: { dryRun },
      }).catch(() => {});

      if (!dryRun) {
        const campaign = await storage.getCampaign(req.params.id as string);
        const orgUsers = await storage.getUsers(req.user!.organizationId);
        for (const u of orgUsers) {
          storage.createNotification({
            userId: u.id,
            organizationId: req.user!.organizationId,
            type: "alert",
            title: "Campaign started",
            message: `Campaign "${campaign?.name}" execution started by ${req.user!.firstName} ${req.user!.lastName}.`,
            relatedEntityType: "campaign",
            relatedEntityId: req.params.id as string,
          }).catch(() => {});
        }
      }

      return res.json(result);
    } catch (err) {
      return res.status(500).json({ message: "Failed to execute campaign" });
    }
  });

  // POST /api/campaigns/:id/stop — stop campaign execution
  app.post("/api/campaigns/:id/stop", authenticateToken, requireRole(3), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });

      const existingCampaign = await storage.getCampaign(req.params.id as string);
      if (!existingCampaign) return res.status(404).json({ message: "Campaign not found" });
      if (existingCampaign.organizationId !== req.user.organizationId && req.user.roleLevel > 2) {
        return res.status(403).json({ message: "Access denied" });
      }

      const result = await stopCampaignExecution(req.params.id as string);
      if (!result.success) {
        return res.status(400).json({ message: result.message });
      }

      storage.createActivityLog({
        userId: req.user!.id,
        organizationId: req.user!.organizationId,
        action: "campaign_execution_stopped",
        entityType: "campaign",
        entityId: req.params.id as string,
        metadata: {},
      }).catch(() => {});

      const campaign = await storage.getCampaign(req.params.id as string);
      const orgUsers = await storage.getUsers(req.user!.organizationId);
      for (const u of orgUsers) {
        storage.createNotification({
          userId: u.id,
          organizationId: req.user!.organizationId,
          type: "alert",
          title: "Campaign stopped",
          message: `Campaign "${campaign?.name}" execution stopped by ${req.user!.firstName} ${req.user!.lastName}.`,
          relatedEntityType: "campaign",
          relatedEntityId: req.params.id as string,
        }).catch(() => {});
      }

      return res.json(result);
    } catch (err) {
      return res.status(500).json({ message: "Failed to stop campaign" });
    }
  });

  // GET /api/campaigns/:id/execution-status — get execution status
  app.get("/api/campaigns/:id/execution-status", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });

      const existingCampaign = await storage.getCampaign(req.params.id as string);
      if (!existingCampaign) return res.status(404).json({ message: "Campaign not found" });
      if (existingCampaign.organizationId !== req.user.organizationId && req.user.roleLevel > 2) {
        return res.status(403).json({ message: "Access denied" });
      }

      const status = getExecutionStatus(req.params.id as string);
      if (!status) {
        return res.json({ active: false });
      }
      const { intervalHandle, ...publicStatus } = status;
      return res.json({ active: true, ...publicStatus });
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch execution status" });
    }
  });

  // POST /api/campaigns/:id/upload-csv — upload CSV recipients
  app.post("/api/campaigns/:id/upload-csv", authenticateToken, requireRole(3), upload.single("file"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const file = req.file;
      if (!file) return res.status(400).json({ message: "No file uploaded" });

      const campaign = await storage.getCampaign(req.params.id as string);
      if (!campaign) return res.status(404).json({ message: "Campaign not found" });
      if (campaign.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }

      let csvContent: string;
      try {
        csvContent = fs.readFileSync(file.path, "utf-8");
      } finally {
        try { fs.unlinkSync(file.path); } catch {}
      }
      const lines = csvContent.split("\n").map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length < 2) {
        return res.status(400).json({ message: "CSV must have a header row and at least one data row" });
      }

      const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/['"]/g, ""));

      const expectedColumns: Array<{ name: string; aliases: string[]; required: boolean }> = [
        { name: "First Name", aliases: ["first name", "firstname", "first_name", "fname"], required: true },
        { name: "Last Name", aliases: ["last name", "lastname", "last_name", "lname"], required: true },
        { name: "Address", aliases: ["address", "street", "street_address", "street address", "addr"], required: false },
        { name: "City", aliases: ["city"], required: false },
        { name: "State", aliases: ["state", "st"], required: false },
        { name: "Zip Code", aliases: ["zip code", "zipcode", "zip_code", "zip", "postal", "postal_code", "postal code"], required: false },
        { name: "Home Phone", aliases: ["home phone", "homephone", "home_phone", "phone", "phone_number", "phonenumber", "mobile", "cell"], required: true },
        { name: "Work Phone", aliases: ["work phone", "workphone", "work_phone", "business phone", "business_phone", "office phone", "office_phone"], required: false },
        { name: "Email Address", aliases: ["email address", "emailaddress", "email_address", "email"], required: true },
        { name: "VIN", aliases: ["vin", "vehicle_identification_number", "vehicle identification number"], required: false },
        { name: "Model", aliases: ["model", "vehicle_model", "vehicle model", "car_model", "car model"], required: false },
        { name: "Model Year", aliases: ["model year", "modelyear", "model_year", "year", "vehicle_year", "vehicle year"], required: false },
        { name: "Last Contact", aliases: ["last contact", "lastcontact", "last_contact", "last_contacted", "last contacted", "contact_date", "contact date"], required: false },
      ];

      const matchedColumns: Record<string, number> = {};
      const missingRequired: string[] = [];
      const missingOptional: string[] = [];

      for (const col of expectedColumns) {
        const idx = headers.findIndex(h => col.aliases.includes(h));
        if (idx >= 0) {
          matchedColumns[col.name] = idx;
        } else if (col.required) {
          missingRequired.push(col.name);
        } else {
          missingOptional.push(col.name);
        }
      }

      const hasPhone = matchedColumns["Home Phone"] !== undefined || matchedColumns["Work Phone"] !== undefined;
      const hasEmail = matchedColumns["Email Address"] !== undefined;

      if (!hasPhone && !hasEmail) {
        return res.status(400).json({
          message: "CSV must contain at least a phone or email column",
          missingRequired,
          missingOptional,
        });
      }

      if (missingRequired.length > 0 && !hasPhone && !hasEmail) {
        return res.status(400).json({
          message: `CSV is missing required columns: ${missingRequired.join(", ")}`,
          missingRequired,
          missingOptional,
        });
      }

      const firstNameIdx = matchedColumns["First Name"] ?? -1;
      const lastNameIdx = matchedColumns["Last Name"] ?? -1;
      const phoneIdx = matchedColumns["Home Phone"] ?? matchedColumns["Work Phone"] ?? -1;
      const emailIdx = matchedColumns["Email Address"] ?? -1;

      const recipients: Array<{ campaignId: string; firstName: string | null; lastName: string | null; phone: string | null; email: string | null }> = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map(c => c.trim().replace(/['"]/g, ""));
        recipients.push({
          campaignId: campaign.id,
          firstName: firstNameIdx >= 0 ? (cols[firstNameIdx] || null) : null,
          lastName: lastNameIdx >= 0 ? (cols[lastNameIdx] || null) : null,
          phone: phoneIdx >= 0 ? (cols[phoneIdx] || null) : null,
          email: emailIdx >= 0 ? (cols[emailIdx] || null) : null,
        });
      }

      await storage.createRecipients(recipients);
      const recipientCount = await storage.getRecipientCount(campaign.id);
      await storage.updateCampaign(campaign.id, { recipientCount, csvFilename: file.originalname });

      const warnings: string[] = [];
      if (missingRequired.length > 0) {
        warnings.push(`Missing recommended columns: ${missingRequired.join(", ")}`);
      }
      if (missingOptional.length > 0) {
        warnings.push(`Missing optional columns: ${missingOptional.join(", ")}`);
      }

      return res.json({
        message: "CSV uploaded",
        recipientCount,
        filename: file.originalname,
        columnsMatched: Object.keys(matchedColumns),
        missingRequired,
        missingOptional,
        warnings: warnings.length > 0 ? warnings : undefined,
      });
    } catch (err) {
      return res.status(500).json({ message: "Failed to process CSV" });
    }
  });

  // GET /api/campaigns/:id/recipients — list recipients
  app.get("/api/campaigns/:id/recipients", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const campaign = await storage.getCampaign(req.params.id as string);
      if (!campaign) return res.status(404).json({ message: "Campaign not found" });
      if (campaign.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }
      const recipients = await storage.getRecipients(campaign.id);
      return res.json(recipients);
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch recipients" });
    }
  });
}
