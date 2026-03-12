import type { Express } from "express";
import { type Server } from "http";
import bcrypt from "bcrypt";
import Anthropic from "@anthropic-ai/sdk";
import multer from "multer";
import { storage } from "./storage";
import {
  authenticateToken,
  requireRole,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  getAccessTokenExpirySeconds,
  getRefreshTokenExpiryDate,
} from "./auth";
import { seedDatabase } from "./seed";
import { braveWebSearch } from "./braveSearch";
import {
  insertAgentSchema,
  insertConversationSchema,
  insertMessageSchema,
  insertCampaignSchema,
  insertIntegrationSchema,
  insertTaskSchema,
  insertWidgetSchema,
  updateAgentSchema,
  updateOrganizationSchema,
  updateUserProfileSchema,
  updateCampaignSchema,
  updateTaskSchema,
  updateWidgetSchema,
  updateHunchSchema,
  insertFavoriteSchema,
} from "@shared/schema";
import { z } from "zod";
import { registerVendorRoutes, callMCP, resolveNexxusOrgId, extractContactIdFromHref, flattenContactInfo } from "./vendorProxy";
import { registerBillingRoutes } from "./routes/billing";
import { startCampaignExecution, stopCampaignExecution, getExecutionStatus, getAllExecutionStatuses } from "./outbound";
import { runHistoricalBackfill, runDailyDelta, runMetricsRefresh, startSyncScheduler } from "./sync";
import { classifyVinStatus, isActiveLead, isNewLead, isSoldLead, isLostLead, isBadLead, isExcludedFromPipeline } from "./statusClassifier";
import { billingService } from "./services/billingService";
import { requireEntitlement } from "./middleware/entitlementCheck";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

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

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

export async function generateHunchesForOrg(orgId: string, userId?: string) {
  const [convos, campaignList, agentList] = await Promise.all([
    storage.getConversations(orgId),
    storage.getCampaigns(orgId),
    storage.getAgents(orgId),
  ]);

  const orgDataSummary = JSON.stringify({
    conversations: {
      total: convos.length,
      open: convos.filter(c => c.status === "open").length,
      closed: convos.filter(c => c.status === "closed").length,
      channels: convos.reduce((acc, c) => { acc[c.channel] = (acc[c.channel] || 0) + 1; return acc; }, {} as Record<string, number>),
    },
    campaigns: await Promise.all(campaignList.map(async c => {
      const recipients = await storage.getRecipients(c.id);
      const sent = recipients.filter(r => r.status === "sent" || r.status === "delivered").length;
      const campaignConvos = convos.filter(cv => cv.campaignId === c.id);
      const replied = campaignConvos.length;
      return {
        name: c.name, department: c.department, status: c.status,
        sent, replied,
        replyRate: sent > 0 ? Math.round((replied / sent) * 100) : 0,
      };
    })),
    agents: agentList.map(a => ({
      name: a.name, department: a.department, status: a.status, channels: a.channels,
    })),
  });

  const aiResponse = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    messages: [{
      role: "user",
      content: `You are an AI business analyst. Analyze the following organization data and generate 3-5 actionable business insights ("hunches"). Each hunch should identify a pattern in the data and provide a specific recommendation.

Organization Data:
${orgDataSummary}

Respond with a JSON array of objects, each with:
- type: "pattern" | "recommendation" | "alert"
- title: short descriptive title (max 60 chars)
- description: detailed explanation of the insight (2-3 sentences)
- confidence: number 50-100 representing certainty
- department: relevant department (sales, service, marketing, or null for cross-department)
- dataSource: what data this insight is based on

Return ONLY the JSON array, no other text.`,
    }],
  });

  let hunchData: any[] = [];
  const textBlock = aiResponse.content.find(b => b.type === "text");
  if (textBlock && textBlock.type === "text") {
    let rawText = textBlock.text.trim();
    const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) rawText = jsonMatch[1].trim();
    hunchData = JSON.parse(rawText);
    if (!Array.isArray(hunchData)) hunchData = [hunchData];
  }

  const batchId = crypto.randomUUID();
  const created = [];
  for (const h of hunchData) {
    const hunch = await storage.createHunch({
      organizationId: orgId,
      type: h.type || "pattern",
      title: h.title,
      description: h.description,
      confidence: Math.min(100, Math.max(0, h.confidence || 50)),
      status: "new",
      department: h.department || null,
      dataSource: h.dataSource || null,
      batchId,
    });
    created.push(hunch);
  }

  storage.createActivityLog({
    userId: userId || orgId,
    organizationId: orgId,
    action: "hunches_generated",
    entityType: "hunch",
    metadata: { count: created.length, automated: !userId },
  }).catch(() => {});

  return created;
}

function getNextBusinessDay10am(): Date {
  const next = new Date();
  next.setDate(next.getDate() + 1);
  while (next.getDay() === 0 || next.getDay() === 6) {
    next.setDate(next.getDate() + 1);
  }
  next.setHours(10, 0, 0, 0);
  return next;
}

function parsePreferredDateTime(preferredDate: string | null, preferredTime: string | null): Date {
  if (!preferredDate) return getNextBusinessDay10am();
  try {
    const dateStr = preferredTime ? `${preferredDate} ${preferredTime}` : preferredDate;
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) return parsed;
  } catch {}
  return getNextBusinessDay10am();
}

async function analyzeTranscriptWithClaude(params: {
  transcript: string;
  organizationId: string;
  customerName: string;
  customerPhone: string | null;
  customerEmail?: string | null;
  source: "vapi" | "tavus";
  conversationId: string;
}): Promise<void> {
  try {
    const aiResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: `Analyze this dealership call transcript and extract the following as JSON:
{
  "appointmentIntent": boolean,
  "preferredDate": string | null,
  "preferredTime": string | null,
  "customerName": string | null,
  "vehicleOfInterest": string | null,
  "leadQualityScore": number,
  "summary": string
}

appointmentIntent: did the customer express interest in scheduling a visit or appointment?
preferredDate: any mentioned date/time preference
preferredTime: any mentioned time preference
customerName: if mentioned
vehicleOfInterest: make/model/year if mentioned
leadQualityScore: 1-10 based on purchase intent, urgency, budget signals
summary: 2-sentence summary of the call

Return ONLY the JSON object, no other text.

Transcript:
${params.transcript}`,
      }],
    });

    let analysisData: any = null;
    const textBlock = aiResponse.content.find(b => b.type === "text");
    if (textBlock && textBlock.type === "text") {
      let rawText = textBlock.text.trim();
      const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) rawText = jsonMatch[1].trim();
      analysisData = JSON.parse(rawText);
    }

    if (!analysisData) {
      console.warn("[AI-Analysis] No analysis data returned from Claude");
      return;
    }

    console.log(`[AI-Analysis] Result for ${params.source} conversation ${params.conversationId}:`, JSON.stringify(analysisData));

    if (analysisData.appointmentIntent) {
      const startTime = parsePreferredDateTime(analysisData.preferredDate, analysisData.preferredTime);
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
      const resolvedName = analysisData.customerName || params.customerName;

      await storage.createAppointment({
        title: `${params.source === "vapi" ? "Call" : "Video"} Appointment — ${resolvedName}`,
        customerName: resolvedName,
        customerPhone: params.customerPhone,
        customerEmail: params.customerEmail || null,
        appointmentType: "sales",
        department: "sales",
        organizationId: params.organizationId,
        startTime,
        endTime,
        status: "pending",
        source: params.source,
        notes: analysisData.summary || null,
      });
      console.log(`[AI-Analysis] Appointment created for ${resolvedName} (source: ${params.source})`);

      try {
        const matchingLeads = await storage.findWarehouseLeadsByContact(
          params.organizationId,
          params.customerPhone,
          params.customerEmail || null
        );
        for (const lead of matchingLeads) {
          if ((lead.followupStep || 0) < 999) {
            await storage.suppressLeadFollowup(lead.id, `Appointment booked via ${params.source}: ${resolvedName}`);
            console.log(`[Conversion] AI appointment — suppressed follow-up for lead ${lead.id} (${lead.customerName})`);
          }
        }
      } catch (suppressErr: any) {
        console.error("[Conversion] Error suppressing follow-ups after AI appointment:", suppressErr.message);
      }
    }

    if (analysisData.leadQualityScore && params.customerPhone) {
      const leads = await storage.getWarehouseLeads(params.organizationId, { limit: 50 });
      const normalizePhone = (p: string) => p.replace(/[^0-9]/g, "").slice(-10);
      const targetPhone = normalizePhone(params.customerPhone);
      const matchingLead = leads.find(l => l.customerPhone && normalizePhone(l.customerPhone) === targetPhone);
      if (matchingLead) {
        await storage.updateWarehouseLeadScore(matchingLead.id, analysisData.leadQualityScore);
        console.log(`[AI-Analysis] Updated lead ${matchingLead.id} with score ${analysisData.leadQualityScore}`);
      }
    }
  } catch (analysisErr: any) {
    console.error(`[AI-Analysis] Failed for ${params.source} conversation ${params.conversationId}:`, analysisErr.message);
  }
}

const updateConversationSchema = z.object({
  status: z.string().optional(),
  campaignDisconnected: z.boolean().optional(),
  unreadCount: z.number().optional(),
  assignedTo: z.string().nullable().optional(),
});

function resolveOrgIdParam(req: import("express").Request): string | null {
  if (!req.user) return null;
  const requestedOrgId = req.query.orgId as string | undefined;
  if (!requestedOrgId) return req.user.organizationId;
  if (requestedOrgId === req.user.organizationId) return requestedOrgId;
  if (req.user.roleLevel <= 2) return requestedOrgId;
  return null;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await seedDatabase();

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const user = await storage.getUserByEmail(email.toLowerCase());
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      if (!user.isActive) {
        return res.status(401).json({ message: "Account is deactivated" });
      }

      const passwordValid = await bcrypt.compare(password, user.password);
      if (!passwordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const role = await storage.getRole(user.roleId);
      const org = await storage.getOrganization(user.organizationId);

      if (!role || !org) {
        return res.status(500).json({ message: "User configuration error" });
      }

      const tokenPayload = {
        userId: user.id,
        organizationId: user.organizationId,
        roleId: user.roleId,
      };

      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      await storage.createSession({
        userId: user.id,
        refreshToken,
        expiresAt: getRefreshTokenExpiryDate(),
      });

      let accessibleOrganizations = null;
      if (role.level <= 2) {
        const allOrgs = await storage.getOrganizations();
        accessibleOrganizations = allOrgs.map(o => ({
          id: o.id,
          name: o.name,
          slug: o.slug,
        }));
      }

      return res.json({
        accessToken,
        refreshToken,
        expiresIn: getAccessTokenExpirySeconds(),
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profilePhotoUrl: user.profilePhotoUrl || null,
          role: {
            id: role.id,
            name: role.name,
            level: role.level,
          },
          organization: {
            id: org.id,
            name: org.name,
          },
        },
        accessibleOrganizations,
      });
    } catch (err) {
      console.error("Login error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", authenticateToken, async (req, res) => {
    try {
      if (req.user) {
        await storage.deleteUserSessions(req.user.id);
      }
      return res.json({ message: "Logged out successfully" });
    } catch (err) {
      return res.status(500).json({ message: "Logout failed" });
    }
  });

  app.post("/api/auth/refresh", async (req, res) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ message: "Refresh token required" });
      }

      const session = await storage.getSessionByRefreshToken(refreshToken);
      if (!session || session.expiresAt < new Date()) {
        return res.status(401).json({ message: "Invalid or expired refresh token" });
      }

      try {
        verifyToken(refreshToken);
      } catch {
        await storage.deleteSession(session.id);
        return res.status(401).json({ message: "Invalid refresh token" });
      }

      const user = await storage.getUser(session.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const role = await storage.getRole(user.roleId);
      const org = await storage.getOrganization(user.organizationId);

      await storage.deleteSession(session.id);

      const tokenPayload = {
        userId: user.id,
        organizationId: user.organizationId,
        roleId: user.roleId,
      };

      const newAccessToken = generateAccessToken(tokenPayload);
      const newRefreshToken = generateRefreshToken(tokenPayload);

      await storage.createSession({
        userId: user.id,
        refreshToken: newRefreshToken,
        expiresAt: getRefreshTokenExpiryDate(),
      });

      return res.json({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: getAccessTokenExpirySeconds(),
        user: role && org ? {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: { id: role.id, name: role.name, level: role.level },
          organization: { id: org.id, name: org.name },
        } : undefined,
      });
    } catch (err) {
      return res.status(500).json({ message: "Token refresh failed" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });

      const user = await storage.getUser(req.user.id);
      if (!user) return res.status(404).json({ message: "User not found" });

      const role = await storage.getRole(user.roleId);
      const org = await storage.getOrganization(user.organizationId);

      return res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profilePhotoUrl: user.profilePhotoUrl || null,
          role: role ? { id: role.id, name: role.name, level: role.level } : null,
          organization: org ? { id: org.id, name: org.name } : null,
        },
      });
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post("/api/auth/switch-org", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      if (req.user.roleLevel > 2) return res.status(403).json({ message: "Only partner admins can switch organizations" });

      const { organizationId } = req.body;
      const org = await storage.getOrganization(organizationId);
      if (!org) return res.status(404).json({ message: "Organization not found" });

      await storage.updateUser(req.user.id, { organizationId });

      const tokenPayload = {
        userId: req.user.id,
        organizationId,
        roleId: req.user.roleId,
      };

      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      await storage.deleteUserSessions(req.user.id);
      await storage.createSession({
        userId: req.user.id,
        refreshToken,
        expiresAt: getRefreshTokenExpiryDate(),
      });

      return res.json({
        accessToken,
        refreshToken,
        expiresIn: getAccessTokenExpirySeconds(),
        organization: { id: org.id, name: org.name },
      });
    } catch (err) {
      return res.status(500).json({ message: "Failed to switch organization" });
    }
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    try {
      const user = await storage.getUserByEmail(email);
      if (user) {
        const { randomBytes } = await import("crypto");
        const token = randomBytes(32).toString("hex");
        const expiry = new Date(Date.now() + 60 * 60 * 1000);
        await storage.updateUser(user.id, { resetToken: token, resetTokenExpiry: expiry } as any);

        const org = await storage.getOrganization(user.organizationId);
        const commGateOpen = org?.outboundEnabled && org?.emailEnabled;

        if (!commGateOpen) {
          console.log(`[AUTH] Password reset requested for ${email} — CommGate blocked email. Token: ${token}`);
        } else {
          const resetUrl = `${req.protocol}://${req.get("host")}/reset-password?token=${token}`;
          if (process.env.RESEND_API_KEY) {
            const { Resend } = await import("resend");
            const resend = new Resend(process.env.RESEND_API_KEY);
            await resend.emails.send({
              from: "Nexxus Connect <notifications@huminic.ai>",
              to: user.email,
              subject: "Password Reset — Nexxus Connect",
              html: `<p>Hi ${user.firstName},</p><p>Click the link below to reset your password. This link expires in 1 hour.</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you did not request this, ignore this email.</p>`,
            });
            console.log(`[AUTH] Password reset email sent to ${email}`);
          } else {
            console.log(`[AUTH] Password reset requested for ${email} — no RESEND_API_KEY, token: ${token}`);
          }
        }
      }
      return res.json({ message: "If an account exists with that email, a reset link has been sent." });
    } catch (err) {
      console.error("[AUTH] Forgot password error:", err);
      return res.json({ message: "If an account exists with that email, a reset link has been sent." });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: "Token and password are required" });
    if (password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters" });

    try {
      const { eq } = await import("drizzle-orm");
      const { db } = await import("./storage");
      const { users } = await import("@shared/schema");
      const [found] = await db.select().from(users).where(eq(users.resetToken, token));
      if (!found) return res.status(400).json({ message: "Invalid or expired reset token" });
      if (!found.resetTokenExpiry || new Date(found.resetTokenExpiry) < new Date()) {
        return res.status(400).json({ message: "Reset token has expired" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await storage.updateUser(found.id, {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      } as any);

      console.log(`[AUTH] Password reset completed for user ${found.email}`);
      return res.json({ message: "Password has been reset successfully." });
    } catch (err) {
      console.error("[AUTH] Reset password error:", err);
      return res.status(500).json({ message: "Failed to reset password" });
    }
  });

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

  app.get("/api/users", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const userList = await storage.getUsers(req.user.organizationId);
      const sanitized = userList.map(({ password, ...rest }) => rest);
      return res.json(sanitized);
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/roles", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const roleList = await storage.getRoles();
      return res.json(roleList);
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch roles" });
    }
  });

  app.post("/api/users", authenticateToken, requireRole(3), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const { email, password, firstName, lastName, roleId } = req.body;

      if (!email || !password || !firstName || !lastName || !roleId) {
        return res.status(400).json({ message: "All fields are required: email, password, firstName, lastName, roleId" });
      }
      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(409).json({ message: "A user with that email already exists" });
      }

      const role = await storage.getRole(roleId);
      if (!role) return res.status(400).json({ message: "Invalid role" });
      if (role.level < req.user.roleLevel) {
        return res.status(403).json({ message: "Cannot assign a role with higher privileges than your own" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        roleId,
        organizationId: req.user.organizationId,
      });

      const { password: _, ...safeUser } = user;

      storage.createActivityLog({
        userId: req.user!.id,
        organizationId: req.user!.organizationId,
        action: "user_created",
        entityType: "user",
        entityId: user.id,
        metadata: { targetEmail: email, targetName: `${firstName} ${lastName}` },
      }).catch(() => {});

      storage.createNotification({
        userId: user.id,
        organizationId: req.user!.organizationId,
        type: "system",
        title: "Welcome to Nexxus Connect",
        message: `Your account has been created by ${req.user!.firstName} ${req.user!.lastName}.`,
      }).catch(() => {});

      const org = await storage.getOrganization(req.user!.organizationId);
      const commGateOpen = org?.outboundEnabled && org?.emailEnabled;
      let welcomeEmailSent = false;

      if (!commGateOpen) {
        console.log(`[Users] CommGate blocked email for org ${req.user!.organizationId}. User ${email} created but welcome email skipped.`);
      } else if (process.env.RESEND_API_KEY) {
        try {
          const emailRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "Nexxus Connect <no-reply@huminic.app>",
              to: email,
              subject: `Welcome to ${org?.name || "Nexxus Connect"} on Nexxus Connect`,
              html: `<h2>Welcome to ${org?.name || "Nexxus Connect"}!</h2>
                <p>Hi ${firstName},</p>
                <p>Your account has been created for <strong>${org?.name || "Nexxus Connect"}</strong> by ${req.user!.firstName} ${req.user!.lastName}.</p>
                <p>You can log in using your email address: <strong>${email}</strong></p>
                <p>Please change your password after your first login for security purposes.</p>
                <p>Welcome aboard!</p>`,
            }),
          });
          if (!emailRes.ok) {
            console.warn("[Users] Resend API error on welcome email:", await emailRes.text());
          } else {
            welcomeEmailSent = true;
            console.log(`[Users] Welcome email sent to ${email}`);
          }
        } catch (emailErr) {
          console.warn("[Users] Failed to send welcome email:", emailErr);
        }
      } else {
        console.log(`[Users] No RESEND_API_KEY configured. Welcome email for ${email} skipped.`);
      }

      return res.status(201).json({ ...safeUser, welcomeEmailSent });
    } catch (err) {
      return res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.get("/api/users/me", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const user = await storage.getUser(req.user.id);
      if (!user) return res.status(404).json({ message: "User not found" });

      const { password, ...safeUser } = user;
      return res.json(safeUser);
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.patch("/api/users/me", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const parsed = updateUserProfileSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid profile data", errors: parsed.error.flatten() });
      }
      const user = await storage.updateUser(req.user.id, parsed.data);
      if (!user) return res.status(404).json({ message: "User not found" });

      const { password: _, ...safeUser } = user;
      return res.json(safeUser);
    } catch (err) {
      console.error("Failed to update profile:", err);
      return res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.patch("/api/users/:id", authenticateToken, requireRole(3), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });

      const targetUser = await storage.getUser(req.params.id);
      if (!targetUser) return res.status(404).json({ message: "User not found" });
      if (targetUser.organizationId !== req.user.organizationId && req.user.roleLevel > 2) {
        return res.status(403).json({ message: "Access denied" });
      }

      const targetRole = await storage.getRole(targetUser.roleId);
      if (targetRole && targetRole.level < req.user.roleLevel) {
        return res.status(403).json({ message: "Cannot modify a user with higher privileges than your own" });
      }

      const allowedFields: Record<string, any> = {};
      if (req.body.firstName !== undefined) allowedFields.firstName = req.body.firstName;
      if (req.body.lastName !== undefined) allowedFields.lastName = req.body.lastName;
      if (req.body.roleId !== undefined) {
        const role = await storage.getRole(req.body.roleId);
        if (!role) return res.status(400).json({ message: "Invalid role" });
        if (role.level < req.user.roleLevel) {
          return res.status(403).json({ message: "Cannot assign a role with higher privileges than your own" });
        }
        allowedFields.roleId = req.body.roleId;
      }
      if (req.body.isActive !== undefined) allowedFields.isActive = req.body.isActive;

      const updated = await storage.updateUser(req.params.id, allowedFields);
      if (!updated) return res.status(404).json({ message: "User not found" });

      const { password: _, ...safeUser } = updated;

      storage.createActivityLog({
        userId: req.user!.id,
        organizationId: req.user!.organizationId,
        action: "user_updated",
        entityType: "user",
        entityId: req.params.id,
        metadata: { fields: Object.keys(allowedFields).join(", ") },
      }).catch(() => {});

      return res.json(safeUser);
    } catch (err) {
      return res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.post("/api/users/:id/reset-password", authenticateToken, requireRole(3), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const { newPassword } = req.body;
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters" });
      }

      const targetUser = await storage.getUser(req.params.id);
      if (!targetUser) return res.status(404).json({ message: "User not found" });
      if (targetUser.organizationId !== req.user.organizationId && req.user.roleLevel > 2) {
        return res.status(403).json({ message: "Access denied" });
      }

      const targetRole = await storage.getRole(targetUser.roleId);
      if (targetRole && targetRole.level < req.user.roleLevel) {
        return res.status(403).json({ message: "Cannot reset password for a user with higher privileges than your own" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(req.params.id, { password: hashedPassword });
      await storage.deleteUserSessions(req.params.id);

      return res.json({ message: "Password has been reset" });
    } catch (err) {
      return res.status(500).json({ message: "Failed to reset password" });
    }
  });

  app.post("/api/auth/change-password", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters" });
      }

      const user = await storage.getUser(req.user.id);
      if (!user) return res.status(404).json({ message: "User not found" });

      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(req.user.id, { password: hashedPassword });

      return res.json({ message: "Password changed successfully" });
    } catch (err) {
      return res.status(500).json({ message: "Failed to change password" });
    }
  });

  app.get("/api/agents/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const agent = await storage.getAgent(req.params.id);
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

  app.patch("/api/agents/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const existing = await storage.getAgent(req.params.id);
      if (!existing) return res.status(404).json({ message: "Agent not found" });
      if (existing.organizationId !== req.user.organizationId && req.user.roleLevel > 2) {
        return res.status(403).json({ message: "Access denied" });
      }
      const parsed = updateAgentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid update data", errors: parsed.error.flatten() });
      }
      const agent = await storage.updateAgent(req.params.id, parsed.data);

      storage.createActivityLog({
        userId: req.user!.id,
        organizationId: req.user!.organizationId,
        action: "agent_updated",
        entityType: "agent",
        entityId: req.params.id,
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
      const existing = await storage.getAgent(req.params.id);
      if (!existing) return res.status(404).json({ message: "Agent not found" });
      if (existing.organizationId !== req.user.organizationId && req.user.roleLevel > 2) {
        return res.status(403).json({ message: "Access denied" });
      }
      await storage.deleteAgent(req.params.id);

      storage.createActivityLog({
        userId: req.user!.id,
        organizationId: req.user!.organizationId,
        action: "agent_deleted",
        entityType: "agent",
        entityId: req.params.id,
        metadata: { agentName: existing.name },
      }).catch(() => {});

      return res.json({ message: "Agent deleted" });
    } catch (err) {
      return res.status(500).json({ message: "Failed to delete agent" });
    }
  });

  app.post("/api/organizations", authenticateToken, requireRole(3), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      if (req.user.roleLevel > 1) {
        return res.status(403).json({ message: "Only super admins can create organizations" });
      }

      const {
        orgName, industry, size, website, publicListing, multiLocation,
        primaryPhone, primaryEmail, address1, address2, city, state, zip,
        timezone, businessHoursStart, businessHoursEnd,
        adminFirstName, adminLastName, adminEmail, adminPhone, adminRole,
        tempPassword, sendWelcomeEmail,
        billingEnabled, anniversaryDate, baseMonthlyFee,
        voiceMinutes, videoMinutes, smsMessages, setupFee,
        tools, agentName, agentPersona, agentChannel,
        autoRespond, deployImmediately, skills,
      } = req.body;

      if (!orgName || !orgName.trim()) {
        return res.status(400).json({ message: "Organization name is required" });
      }
      if (!primaryPhone || !primaryPhone.trim()) {
        return res.status(400).json({ message: "Primary phone is required" });
      }
      if (!primaryEmail || !primaryEmail.trim()) {
        return res.status(400).json({ message: "Primary email is required" });
      }
      if (!adminFirstName || !adminFirstName.trim()) {
        return res.status(400).json({ message: "Admin first name is required" });
      }
      if (!adminLastName || !adminLastName.trim()) {
        return res.status(400).json({ message: "Admin last name is required" });
      }
      if (!adminEmail || !adminEmail.trim()) {
        return res.status(400).json({ message: "Admin email is required" });
      }
      if (!tempPassword || tempPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      const existingUser = await storage.getUserByEmail(adminEmail);
      if (existingUser) {
        return res.status(409).json({ message: "A user with that admin email already exists" });
      }

      const slug = orgName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const existingOrg = await storage.getOrganizationBySlug(slug);
      const finalSlug = existingOrg ? `${slug}-${Date.now()}` : slug;

      const enabledTools = tools || {};
      const org = await storage.createOrganization({
        name: orgName.trim(),
        slug: finalSlug,
        personaName: agentName || "Serra",
        outboundEnabled: false,
        smsEnabled: !!enabledTools.sms,
        phoneEnabled: !!enabledTools.voice,
        emailEnabled: !!enabledTools.email,
        settings: {
          industry, size, website, publicListing, multiLocation,
          primaryPhone, primaryEmail, address1, address2, city, state, zip,
          timezone, businessHoursStart, businessHoursEnd,
          billingEnabled, anniversaryDate, baseMonthlyFee,
          voiceMinutes, videoMinutes, smsMessages, setupFee,
          tools: enabledTools,
        },
      });

      const role = await storage.getRoleByName(adminRole === "partner_admin" ? "partner_admin" : "org_admin");
      if (!role) {
        return res.status(500).json({ message: "Could not find role for admin user" });
      }

      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      const adminUser = await storage.createUser({
        email: adminEmail,
        password: hashedPassword,
        firstName: adminFirstName,
        lastName: adminLastName,
        roleId: role.id,
        organizationId: org.id,
      });

      const channelsArray = agentChannel === "omnichannel"
        ? ["voice", "video", "chat", "email"]
        : [agentChannel || "chat"];

      const agent = await storage.createAgent({
        name: agentName || "Serra",
        department: "sales",
        type: "ai",
        status: deployImmediately ? "active" : "inactive",
        description: agentPersona || null,
        channels: channelsArray,
        instructions: agentPersona || null,
        organizationId: org.id,
      });

      storage.createActivityLog({
        userId: req.user!.id,
        organizationId: org.id,
        action: "organization_created",
        entityType: "organization",
        entityId: org.id,
        metadata: {
          orgName: org.name,
          adminEmail,
          agentName: agent.name,
          createdBy: `${req.user!.firstName} ${req.user!.lastName}`,
        },
      }).catch(() => {});

      const { password: _, ...safeAdmin } = adminUser;

      return res.status(201).json({
        organization: org,
        admin: safeAdmin,
        agent,
      });
    } catch (err) {
      console.error("Failed to create organization:", err);
      return res.status(500).json({ message: "Failed to create organization" });
    }
  });

  app.get("/api/organizations", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      if (req.user.roleLevel > 2) {
        const org = await storage.getOrganization(req.user.organizationId);
        return res.json(org ? [{ id: org.id, name: org.name, slug: org.slug }] : []);
      }
      const allOrgs = await storage.getOrganizations();
      return res.json(allOrgs.map(o => ({ id: o.id, name: o.name, slug: o.slug })));
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch organizations" });
    }
  });

  app.get("/api/organizations/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      if (req.params.id !== req.user.organizationId && req.user.roleLevel > 2) {
        return res.status(403).json({ message: "Access denied" });
      }
      const org = await storage.getOrganization(req.params.id);
      if (!org) return res.status(404).json({ message: "Organization not found" });
      return res.json(org);
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch organization" });
    }
  });

  app.patch("/api/organizations/:id", authenticateToken, requireRole(3), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      if (req.params.id !== req.user.organizationId && req.user.roleLevel > 2) {
        return res.status(403).json({ message: "Access denied" });
      }
      const parsed = updateOrganizationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid organization data", errors: parsed.error.flatten() });
      }
      const org = await storage.updateOrganization(req.params.id, parsed.data);
      if (!org) return res.status(404).json({ message: "Organization not found" });

      storage.createActivityLog({
        userId: req.user!.id,
        organizationId: req.user!.organizationId,
        action: "organization_updated",
        entityType: "organization",
        entityId: req.params.id,
        metadata: { fields: Object.keys(parsed.data).join(", ") },
      }).catch(() => {});

      if (parsed.data.outboundEnabled !== undefined) {
        const state = parsed.data.outboundEnabled ? "enabled" : "disabled";
        const orgUsers = await storage.getUsers(req.user!.organizationId);
        for (const u of orgUsers) {
          storage.createNotification({
            userId: u.id,
            organizationId: req.user!.organizationId,
            type: "alert",
            title: `Communication gate ${state}`,
            message: `Outbound communications have been ${state} by ${req.user!.firstName} ${req.user!.lastName}.`,
            relatedEntityType: "organization",
            relatedEntityId: req.params.id,
          }).catch(() => {});
        }
      }

      return res.json(org);
    } catch (err) {
      return res.status(500).json({ message: "Failed to update organization" });
    }
  });

  app.patch("/api/organizations/:id/slug", authenticateToken, requireRole(3), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      if (req.params.id !== req.user.organizationId && req.user.roleLevel > 2) {
        return res.status(403).json({ message: "Access denied" });
      }
      const { slug: newSlug } = req.body;
      if (!newSlug || typeof newSlug !== "string") return res.status(400).json({ message: "Slug is required" });
      const slugFormatted = newSlug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      if (!slugFormatted) return res.status(400).json({ message: "Invalid slug" });

      const existing = await storage.getOrganizationBySlug(slugFormatted);
      if (existing && existing.id !== req.params.id) {
        return res.status(409).json({ message: "Slug already taken" });
      }

      const org = await storage.getOrganization(req.params.id);
      if (!org) return res.status(404).json({ message: "Organization not found" });
      const oldSlug = org.slug;

      if (oldSlug !== slugFormatted) {
        const thirtyDaysLater = new Date();
        thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
        await storage.createSlugRedirect({
          organizationId: req.params.id,
          oldSlug,
          newSlug: slugFormatted,
          expiresAt: thirtyDaysLater,
        });
        await storage.updateOrganizationSlug(req.params.id, slugFormatted);

        storage.createActivityLog({
          userId: req.user!.id,
          organizationId: req.user!.organizationId,
          action: "slug_changed",
          entityType: "organization",
          entityId: req.params.id,
          metadata: { oldSlug, newSlug: slugFormatted },
        }).catch(() => {});
      }

      const updated = await storage.getOrganization(req.params.id);
      return res.json(updated);
    } catch (err) {
      return res.status(500).json({ message: "Failed to update slug" });
    }
  });

  app.get("/api/conversations", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const filters: { status?: string; channel?: string; agentId?: string } = {};
      if (req.query.status) filters.status = req.query.status as string;
      if (req.query.channel) filters.channel = req.query.channel as string;
      if (req.query.agentId) filters.agentId = req.query.agentId as string;

      const convs = await storage.getConversations(req.user.organizationId, filters);
      return res.json(convs);
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.post("/api/conversations", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const parsed = insertConversationSchema.safeParse({
        ...req.body,
        organizationId: req.user.organizationId,
      });
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid conversation data", errors: parsed.error.flatten() });
      }
      const conv = await storage.createConversation(parsed.data);

      if (parsed.data.channel === "ai-chat" && parsed.data.customerEmail) {
        const allConvs = await storage.getConversations(req.user.organizationId, { channel: "ai-chat" });
        const staleConvs = allConvs.filter(
          (c) => c.id !== conv.id && c.customerEmail === parsed.data.customerEmail
        );
        for (const stale of staleConvs) {
          const msgs = await storage.getMessages(stale.id);
          if (msgs.length <= 1) {
            await storage.deleteConversation(stale.id);
          }
        }
      }

      if (conv.customerPhone && parsed.data.channel !== "ai-chat") {
        (async () => {
          try {
            const org = await storage.getOrganization(req.user!.organizationId);
            if (!org || !org.outboundEnabled || !org.smsEnabled) return;
            if (process.env.OUTBOUND_LIVE_ENABLED !== "true") return;

            const orgAgents = await storage.getAgents(req.user!.organizationId);
            const greetingAgent = orgAgents.find(a => a.autoGreeting && a.status === "active");
            if (!greetingAgent || !greetingAgent.autoGreeting) return;

            const greeting = greetingAgent.autoGreeting
              .replace(/\{\{customerName\}\}/g, conv.customerName || "there")
              .replace(/\{\{dealershipName\}\}/g, org.name || "our dealership")
              .replace(/\{\{agentName\}\}/g, greetingAgent.name || "your assistant");

            const { sendSms } = await import("./outbound");
            await sendSms(conv.customerPhone!, greeting, req.user!.organizationId);
            console.log(`[AutoGreeting] Sent to ${conv.customerPhone} via agent ${greetingAgent.name}`);

            await storage.createMessage({
              conversationId: conv.id,
              role: "agent",
              content: greeting,
              senderName: greetingAgent.name,
            });

            storage.logUsageEvent({
              organizationId: req.user!.organizationId,
              eventType: "outbound_sms",
              channel: "sms",
              quantity: 1,
              metadata: { recipient: conv.customerPhone, source: "auto_greeting", agentId: greetingAgent.id },
            }).catch(() => {});

            storage.createActivityLog({
              organizationId: req.user!.organizationId,
              action: "auto_greeting_sent",
              entityType: "conversation",
              entityId: conv.id,
              metadata: { agentName: greetingAgent.name, customerPhone: conv.customerPhone },
            }).catch(() => {});
          } catch (greetErr: any) {
            console.error(`[AutoGreeting] Failed:`, greetErr.message);
          }
        })();
      }

      return res.status(201).json(conv);
    } catch (err) {
      return res.status(500).json({ message: "Failed to create conversation" });
    }
  });

  app.get("/api/conversations/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const conversation = await storage.getConversation(req.params.id);
      if (!conversation) return res.status(404).json({ message: "Conversation not found" });
      if (conversation.organizationId !== req.user.organizationId && req.user.roleLevel > 2) {
        return res.status(403).json({ message: "Access denied" });
      }
      return res.json(conversation);
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });

  app.patch("/api/conversations/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const existing = await storage.getConversation(req.params.id);
      if (!existing) return res.status(404).json({ message: "Conversation not found" });
      if (existing.organizationId !== req.user.organizationId && req.user.roleLevel > 2) {
        return res.status(403).json({ message: "Access denied" });
      }
      const parsed = updateConversationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid conversation data", errors: parsed.error.flatten() });
      }
      const conv = await storage.updateConversation(req.params.id, parsed.data);
      return res.json(conv);
    } catch (err) {
      return res.status(500).json({ message: "Failed to update conversation" });
    }
  });

  app.delete("/api/conversations/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const existing = await storage.getConversation(req.params.id);
      if (!existing) return res.status(404).json({ message: "Conversation not found" });
      if (existing.organizationId !== req.user.organizationId && req.user.roleLevel > 2) {
        return res.status(403).json({ message: "Access denied" });
      }
      await storage.deleteConversation(req.params.id);
      return res.json({ message: "Conversation deleted" });
    } catch (err) {
      return res.status(500).json({ message: "Failed to delete conversation" });
    }
  });

  app.get("/api/conversations/:id/messages", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const conversation = await storage.getConversation(req.params.id);
      if (!conversation) return res.status(404).json({ message: "Conversation not found" });
      if (conversation.organizationId !== req.user.organizationId && req.user.roleLevel > 2) {
        return res.status(403).json({ message: "Access denied" });
      }
      const msgs = await storage.getMessages(req.params.id);
      return res.json(msgs);
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/conversations/:id/messages", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const conversation = await storage.getConversation(req.params.id);
      if (!conversation) return res.status(404).json({ message: "Conversation not found" });
      if (conversation.organizationId !== req.user.organizationId && req.user.roleLevel > 2) {
        return res.status(403).json({ message: "Access denied" });
      }
      const parsed = insertMessageSchema.safeParse({
        ...req.body,
        conversationId: req.params.id,
      });
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid message data", errors: parsed.error.flatten() });
      }
      const msg = await storage.createMessage(parsed.data);
      await storage.updateConversation(req.params.id, { lastMessageAt: new Date() });

      const isAgentReply = parsed.data.role === "agent" || parsed.data.role === "system";
      const content = parsed.data.content || "";
      const isSmsChannel = conversation.channel === "sms";
      const hasSmsPrefix = content.startsWith("[SMS] ");
      const shouldSendSms = isAgentReply && (isSmsChannel || hasSmsPrefix) && conversation.customerPhone;

      if (shouldSendSms && conversation.customerPhone) {
        const org = await storage.getOrganization(conversation.organizationId);
        const smsContent = hasSmsPrefix ? content.replace("[SMS] ", "") : content;
        if (!org) {
          console.warn(`[TeamBox SMS] Org not found for conversation ${conversation.id}`);
        } else if (!org.outboundEnabled || !org.smsEnabled) {
          console.warn(`[TeamBox SMS] SMS blocked — org outbound=${org.outboundEnabled}, sms=${org.smsEnabled}`);
        } else if (process.env.OUTBOUND_LIVE_ENABLED !== "true") {
          console.warn(`[TeamBox SMS] Blocked — OUTBOUND_LIVE_ENABLED is not true`);
        } else {
          try {
            const { sendSms } = await import("./outbound");
            await sendSms(conversation.customerPhone, smsContent, conversation.organizationId);
            console.log(`[TeamBox SMS] Delivered reply to ${conversation.customerPhone}`);
            storage.logUsageEvent({
              organizationId: conversation.organizationId,
              eventType: "outbound_sms",
              channel: "sms",
              quantity: 1,
              metadata: { recipient: conversation.customerPhone, source: "teambox_reply", conversationId: conversation.id },
            }).catch(() => {});
          } catch (smsErr: any) {
            console.error(`[TeamBox SMS] Delivery failed:`, smsErr.message);
            storage.logUsageEvent({
              organizationId: conversation.organizationId,
              eventType: "outbound_sms_failed",
              channel: "sms",
              quantity: 0,
              metadata: { recipient: conversation.customerPhone, source: "teambox_reply", error: smsErr.message },
            }).catch(() => {});
          }
        }
      }

      return res.status(201).json(msg);
    } catch (err) {
      return res.status(500).json({ message: "Failed to create message" });
    }
  });

  app.get("/api/campaigns", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const filters: { department?: string } = {};
      if (req.query.department) filters.department = req.query.department as string;
      const campaignList = await storage.getCampaigns(req.user.organizationId, filters);

      const allConvos = await storage.getConversations(req.user.organizationId);
      const enriched = await Promise.all(campaignList.map(async (c) => {
        const recipients = await storage.getRecipients(c.id);
        const sentCount = recipients.filter(r => r.status === "sent" || r.status === "delivered").length;
        const repliedCount = allConvos.filter(cv => cv.campaignId === c.id).length;
        return { ...c, sentCount, repliedCount };
      }));

      return res.json(enriched);
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

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

  app.get("/api/campaigns/execution-statuses", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      return res.json(getAllExecutionStatuses());
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch execution statuses" });
    }
  });

  app.get("/api/campaigns/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const campaign = await storage.getCampaign(req.params.id);
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

  registerVendorRoutes(app);

  app.post("/api/widget/video-session", async (req, res) => {
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

  app.patch("/api/campaigns/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const existing = await storage.getCampaign(req.params.id);
      if (!existing) return res.status(404).json({ message: "Campaign not found" });
      if (existing.organizationId !== req.user.organizationId && req.user.roleLevel > 2) {
        return res.status(403).json({ message: "Access denied" });
      }
      const parsed = updateCampaignSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid campaign data", errors: parsed.error.flatten() });
      }
      const campaign = await storage.updateCampaign(req.params.id, parsed.data);

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
        entityId: req.params.id,
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

  app.post("/api/campaigns/:id/execute", authenticateToken, requireRole(3), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });

      const existingCampaign = await storage.getCampaign(req.params.id);
      if (!existingCampaign) return res.status(404).json({ message: "Campaign not found" });
      if (existingCampaign.organizationId !== req.user.organizationId && req.user.roleLevel > 2) {
        return res.status(403).json({ message: "Access denied" });
      }

      const dryRun = req.body.dryRun === true;
      const scheduledAt = req.body.scheduledAt ? new Date(req.body.scheduledAt) : null;

      if (scheduledAt && scheduledAt > new Date()) {
        const campaign = await storage.updateCampaign(req.params.id, {
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
          entityId: req.params.id,
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
            relatedEntityId: req.params.id,
          }).catch(() => {});
        }

        return res.json({ success: true, message: `Campaign scheduled for ${scheduledAt.toISOString()}`, scheduled: true });
      }

      const result = await startCampaignExecution(req.params.id, req.user.organizationId, dryRun);
      if (!result.success) {
        return res.status(400).json({ message: result.message });
      }

      storage.createActivityLog({
        userId: req.user!.id,
        organizationId: req.user!.organizationId,
        action: dryRun ? "campaign_dry_run" : "campaign_executed",
        entityType: "campaign",
        entityId: req.params.id,
        metadata: { dryRun },
      }).catch(() => {});

      if (!dryRun) {
        const campaign = await storage.getCampaign(req.params.id);
        const orgUsers = await storage.getUsers(req.user!.organizationId);
        for (const u of orgUsers) {
          storage.createNotification({
            userId: u.id,
            organizationId: req.user!.organizationId,
            type: "alert",
            title: "Campaign started",
            message: `Campaign "${campaign?.name}" execution started by ${req.user!.firstName} ${req.user!.lastName}.`,
            relatedEntityType: "campaign",
            relatedEntityId: req.params.id,
          }).catch(() => {});
        }
      }

      return res.json(result);
    } catch (err) {
      return res.status(500).json({ message: "Failed to execute campaign" });
    }
  });

  app.post("/api/campaigns/:id/stop", authenticateToken, requireRole(3), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });

      const existingCampaign = await storage.getCampaign(req.params.id);
      if (!existingCampaign) return res.status(404).json({ message: "Campaign not found" });
      if (existingCampaign.organizationId !== req.user.organizationId && req.user.roleLevel > 2) {
        return res.status(403).json({ message: "Access denied" });
      }

      const result = await stopCampaignExecution(req.params.id);
      if (!result.success) {
        return res.status(400).json({ message: result.message });
      }

      storage.createActivityLog({
        userId: req.user!.id,
        organizationId: req.user!.organizationId,
        action: "campaign_execution_stopped",
        entityType: "campaign",
        entityId: req.params.id,
        metadata: {},
      }).catch(() => {});

      const campaign = await storage.getCampaign(req.params.id);
      const orgUsers = await storage.getUsers(req.user!.organizationId);
      for (const u of orgUsers) {
        storage.createNotification({
          userId: u.id,
          organizationId: req.user!.organizationId,
          type: "alert",
          title: "Campaign stopped",
          message: `Campaign "${campaign?.name}" execution stopped by ${req.user!.firstName} ${req.user!.lastName}.`,
          relatedEntityType: "campaign",
          relatedEntityId: req.params.id,
        }).catch(() => {});
      }

      return res.json(result);
    } catch (err) {
      return res.status(500).json({ message: "Failed to stop campaign" });
    }
  });

  app.get("/api/campaigns/:id/execution-status", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });

      const existingCampaign = await storage.getCampaign(req.params.id);
      if (!existingCampaign) return res.status(404).json({ message: "Campaign not found" });
      if (existingCampaign.organizationId !== req.user.organizationId && req.user.roleLevel > 2) {
        return res.status(403).json({ message: "Access denied" });
      }

      const status = getExecutionStatus(req.params.id);
      if (!status) {
        return res.json({ active: false });
      }
      const { intervalHandle, ...publicStatus } = status;
      return res.json({ active: true, ...publicStatus });
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch execution status" });
    }
  });

  app.get("/api/integrations", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const filters: { provider?: string } = {};
      if (req.query.provider) filters.provider = req.query.provider as string;
      const list = await storage.getIntegrations(req.user.organizationId, filters);
      return res.json(list);
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch integrations" });
    }
  });

  app.post("/api/integrations/provision", authenticateToken, requireRole(2), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const bodySchema = z.object({
        organizationId: z.string().uuid(),
        dealerId: z.number().int().positive(),
        dealerName: z.string().min(1),
        provider: z.string().default("vinsolutions"),
      });
      const parsed = bodySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid provision data", errors: parsed.error.flatten() });
      }
      const { organizationId, dealerId, dealerName, provider } = parsed.data;

      const nexxusOrgId = resolveNexxusOrgId(organizationId);
      const mcpResult = await callMCP("vin_provision_dealer", {
        orgId: nexxusOrgId,
        dealerId,
        dealerName,
      });

      const integrationId = mcpResult.integrationId || mcpResult.id;
      const status = mcpResult.status || "active";

      const integration = await storage.createIntegration({
        organizationId,
        provider,
        externalDealerId: String(dealerId),
        externalDealerName: dealerName,
        externalIntegrationId: integrationId,
        status,
        nexxusOrgId,
      });

      return res.status(201).json({ integration, mcpResult });
    } catch (err: any) {
      return res.status(502).json({ message: "Failed to provision dealer", error: err.message });
    }
  });

  function formatSyncAge(date: Date | string): string {
    const d = typeof date === "string" ? new Date(date) : date;
    const diffMs = Date.now() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? "s" : ""} ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  }

  const webSearchTool: Anthropic.Tool = {
    name: "web_search",
    description: "Search the web for current information. Use this when the user asks about current events, recent news, real-time data, locations/businesses near a place, or anything that requires up-to-date information beyond your training data. Also use for questions about specific people, places, or facts you are uncertain about.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "The search query. Be specific and include relevant context.",
        },
      },
      required: ["query"],
    },
  };

  const vinQueryLeadsTool: Anthropic.Tool = {
    name: "vin_query_leads",
    description: "Query VinSolutions CRM lead data. Use this when the user asks about sales leads, pipeline, lead counts, lead statuses, conversion rates, or any CRM-related question. Returns lead data from the dealership's VinSolutions CRM system.",
    input_schema: {
      type: "object" as const,
      properties: {
        startDate: {
          type: "string",
          description: "Start date in YYYY-MM-DD format. Defaults to 30 days ago if not specified.",
        },
        endDate: {
          type: "string",
          description: "End date in YYYY-MM-DD format. Defaults to today if not specified.",
        },
        status: {
          type: "string",
          description: "Lead status filter. Common values: ACTIVE_NEW_LEAD, ACTIVE_ACTIVE_LEAD, ACTIVE_SET_APPOINTMENT, ACTIVE_WAITING_FOR_PROSPECT_RESPONSE, SOLD_DELIVERED, SOLD_PENDING_FINANCE, SOLD_ON_ORDER, LOST_DID_NOT_RESPOND, LOST_NO_AGREEMENT_REACHED, LOST_BAD_CREDIT, LOST_LEAD_PROCESS_COMPLETED.",
        },
        limit: {
          type: "number",
          description: "Maximum number of leads to return (1-100). Default: 20.",
        },
      },
      required: [],
    },
  };

  const vinLeadSummaryTool: Anthropic.Tool = {
    name: "vin_lead_summary",
    description: "Get a summary of VinSolutions CRM lead metrics including total leads, new leads, active pipeline, sold leads, conversion rate, and period-over-period changes. Use this when the user asks about overall sales performance, KPIs, metrics, or dashboard-level data.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  };

  const chatTools: Anthropic.Tool[] = [webSearchTool, vinQueryLeadsTool, vinLeadSummaryTool];

  app.post("/api/chat/:conversationId/stream", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });

      const { conversationId } = req.params;
      const { content, agentId, mode, pageContext } = req.body;
      const isCrmGuru = mode === "crm_guru";

      if (!content || typeof content !== "string") {
        return res.status(400).json({ message: "Message content is required" });
      }

      const conversation = await storage.getConversation(conversationId);
      if (!conversation) return res.status(404).json({ message: "Conversation not found" });
      if (conversation.organizationId !== req.user.organizationId && req.user.roleLevel > 2) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.createMessage({
        conversationId,
        role: "user",
        content,
        senderName: `${req.user.firstName} ${req.user.lastName}`,
      });
      await storage.updateConversation(conversationId, { lastMessageAt: new Date() });

      const history = await storage.getMessages(conversationId);
      const recentMessages = history.slice(-20);

      const [org, orgUsers, orgAgents, orgDocuments, acceptedHunches, latestMetricsSync, latestLeadSync] = await Promise.all([
        storage.getOrganization(req.user.organizationId),
        storage.getUsers(req.user.organizationId),
        storage.getAgents(req.user.organizationId, {}),
        storage.getDocuments(req.user.organizationId),
        storage.getAcceptedHunches(req.user.organizationId),
        storage.getLatestSync(req.user.organizationId, "metrics_refresh"),
        storage.getLatestSync(req.user.organizationId, "backfill").then(b =>
          b || storage.getLatestSync(req.user.organizationId, "daily_delta")
        ),
      ]);
      const orgName = org?.name || "Nexxus Connect";
      const personaName = org?.personaName || "Automa";
      const orgSettings = (org?.settings || {}) as Record<string, any>;
      const chatInstructions = orgSettings.chatInstructions || "";
      const orgSystemPrompt = orgSettings.systemPrompt || "";

      const now = new Date();
      const dateStr = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "America/New_York" });
      const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "America/New_York" });

      const activeUsers = orgUsers.filter(u => u.isActive !== false);
      const teamSummary = activeUsers.map(u => `${u.firstName} ${u.lastName} (${u.role?.name || "unknown"})`).join(", ");
      const agentSummary = orgAgents.map(a => `${a.name} [${a.department}]`).join(", ");

      let agentContext = "";
      let agentName: string | null = null;
      if (agentId) {
        const agent = await storage.getAgent(agentId);
        if (agent && agent.organizationId === req.user.organizationId) {
          agentName = agent.name;
          agentContext = `\n\nYou are specifically acting as the agent "${agent.name}" in the ${agent.department} department.`;
          if (agent.description) agentContext += ` Agent description: ${agent.description}`;
          if (agent.instructions) agentContext += `\n\nAgent-specific instructions:\n${agent.instructions}`;
        }
      }

      let hunchContext = "";
      if (acceptedHunches.length > 0) {
        const hunchSections = acceptedHunches.map(h => {
          const source = h.dataSource ? ` [Source: ${h.dataSource}]` : " [Source: computed]";
          const age = h.generatedAt ? `, generated ${formatSyncAge(h.generatedAt)}` : "";
          return `- [${h.type}${h.department ? `/${h.department}` : ""}] ${h.title}: ${h.description} (confidence: ${h.confidence}%${age}${source})`;
        }).join("\n");
        hunchContext = `\n\nActive AI Insights (accepted hunches — use these to inform your responses when relevant):\n${hunchSections}`;
      }

      let knowledgeContext = "";
      const relevantDocs = agentId
        ? orgDocuments.filter(d => d.agentId === agentId || !d.agentId)
        : orgDocuments.filter(d => !d.agentId);
      const docsWithContent = relevantDocs.filter(d => d.content && d.content.trim().length > 0);
      if (docsWithContent.length > 0) {
        const maxTotalChars = 32000;
        let totalChars = 0;
        const docSections: string[] = [];
        for (const d of docsWithContent) {
          const remaining = maxTotalChars - totalChars;
          if (remaining <= 0) break;
          const maxPerDoc = Math.min(8000, remaining);
          const truncated = d.content!.length > maxPerDoc ? d.content!.slice(0, maxPerDoc) + "\n...(truncated)" : d.content!;
          const section = `--- ${d.name} (${d.type}) ---\n${truncated}`;
          docSections.push(section);
          totalChars += section.length;
        }
        knowledgeContext = `\n\nKnowledge Base Documents (use this information to answer questions when relevant):\n${docSections.join("\n\n")}`;
      }

      let syncFreshnessContext = "";
      if (latestMetricsSync || latestLeadSync) {
        const parts: string[] = [];
        if (latestMetricsSync?.completedAt) {
          parts.push(`VinSolutions metrics last refreshed ${formatSyncAge(latestMetricsSync.completedAt)}`);
        }
        if (latestLeadSync?.completedAt) {
          parts.push(`VinSolutions lead data last synced ${formatSyncAge(latestLeadSync.completedAt)}`);
        }
        if (parts.length > 0) {
          syncFreshnessContext = `\n\nData freshness:\n- ${parts.join("\n- ")}`;
        }
      }

      const systemPrompt = `You are ${personaName}, an AI assistant powering Nexxus Connect for ${orgName} — an automotive dealership management platform.

Current date and time: ${dateStr}, ${timeStr} (Eastern Time)

User context:
- Name: ${req.user.firstName} ${req.user.lastName}
- Role: ${req.user.roleName}
- Organization: ${orgName}

Organization data you have access to:
- Team members (${activeUsers.length}): ${teamSummary}
- AI agents (${orgAgents.length}): ${agentSummary}

Your personality and rules:
- Confident, precise, and proactive — concise, actionable answers with no filler
- You understand automotive dealership operations deeply: sales pipelines, BDC, F&I, service scheduling, marketing campaigns, lead management, CRM workflows, inventory
- Format responses with markdown when it improves readability (bullets, bold, headers)
- Never say "as an AI" or apologize unnecessarily
- If you don't have specific data, say so clearly — never fabricate dealership numbers, customer records, or metrics
- Never share or request PII (SSN, full credit card numbers, etc.)
- When you are unsure about current events, facts, people, locations, or anything time-sensitive, use the web_search tool to look it up — do not guess
- When the user asks about nearby businesses, competitors, local information, or anything geographic, use web_search
- When citing search results, be natural — incorporate the information conversationally, don't just dump raw results

Data provenance rules (CRITICAL):
- When referencing CRM/vendor data, attribute it as "from our records" — NEVER name the vendor or say "VinSolutions" to the user. Say things like "Based on our records from 2 hours ago..." or "According to our CRM data..."
- When referencing knowledge base documents uploaded by the organization, say "from our knowledge base" and mention the document name
- When referencing AI insights/hunches, mention they are AI-generated with their confidence level
- If data is stale (last synced > 6 hours ago), proactively note this: "Note: this data was last synced X hours ago and may not reflect the latest changes"
- If no CRM data is available, say so clearly — do not guess at numbers
- Use the vin_query_leads tool to look up specific lead data and the vin_lead_summary tool to get overall metrics
- When web search results are used, cite them naturally
- Always make it clear whether information comes "from our records" (CRM/vendor data) or "from our knowledge base" (uploaded org documents)${orgSystemPrompt ? `\n\nOrganization-specific prompt:\n${orgSystemPrompt}` : ''}${chatInstructions ? `\n\nChat quality instructions (follow these carefully):\n${chatInstructions}` : ''}${isCrmGuru ? `

CRM GURU MODE (ACTIVE):
You are operating as the CRM Guru — the dedicated CRM intelligence agent. Follow these rules strictly:
1. ALWAYS query VinSolutions data FIRST for any CRM-related question using vin_query_leads or vin_lead_summary tools
2. If VinSolutions data is insufficient, supplement with internal data warehouse — but ALWAYS explicitly state: "I found additional data in your internal data warehouse" when using warehouse data
3. VinSolutions data is the primary source of truth for all CRM operations: leads, contacts, deals, activities
4. When presenting data, always attribute sources clearly: "[VinSolutions]" or "[Data Warehouse]"
5. If data conflicts exist between sources, prefer VinSolutions and note the discrepancy` : `

When the user asks a question that requires deep CRM data (specific lead details, deal histories, contact records, pipeline specifics):
- First try to answer from available internal data warehouse
- If the data is insufficient or the question requires real-time CRM data, suggest: "For detailed CRM data, I recommend switching to CRM Guru mode which has deeper CRM integration. You can activate it from the agent selector."`}${agentContext}${pageContext ? `\n\nPage context — the user is currently viewing: ${typeof pageContext === 'string' ? pageContext : JSON.stringify(pageContext)}. Tailor your responses to be relevant to what they're looking at.` : ''}${syncFreshnessContext}${hunchContext}${knowledgeContext}`;

      const chatMessages: Array<{ role: "user" | "assistant"; content: string }> = recentMessages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();

      let fullResponse = "";
      let currentMessages: Anthropic.MessageParam[] = chatMessages;
      const MAX_TOOL_ROUNDS = 3;

      const nexxusOrgId = resolveNexxusOrgId(req.user.organizationId);

      const firstResponse = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        system: systemPrompt,
        messages: currentMessages,
        tools: chatTools,
      });

      try {
        billingService.emitUsageEvent(req.user.organizationId, 'llm_input_tokens', { tokens: firstResponse.usage.input_tokens, model: 'claude' });
        billingService.emitUsageEvent(req.user.organizationId, 'llm_output_tokens', { tokens: firstResponse.usage.output_tokens, model: 'claude' });
      } catch(e) {}

      const needsToolUse = firstResponse.content.some(b => b.type === "tool_use");

      if (!needsToolUse) {
        for (const block of firstResponse.content) {
          if (block.type === "text" && block.text) {
            fullResponse += block.text;
            res.write(`data: ${JSON.stringify({ type: "content", text: block.text })}\n\n`);
          }
        }
      } else {
        let response = firstResponse;

        for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
          let hasToolUse = false;
          const toolResults: Anthropic.ToolResultBlockParam[] = [];
          let intermediateText = "";

          for (const block of response.content) {
            if (block.type === "text") {
              intermediateText += block.text;
            } else if (block.type === "tool_use") {
              hasToolUse = true;
              if (intermediateText) {
                res.write(`data: ${JSON.stringify({ type: "content", text: intermediateText })}\n\n`);
                fullResponse += intermediateText;
                intermediateText = "";
              }

              let resultText: string;

              if (block.name === "web_search") {
                res.write(`data: ${JSON.stringify({ type: "status", text: "Searching the web..." })}\n\n`);
                try {
                  const results = await braveWebSearch((block.input as { query: string }).query, 3);
                  resultText = results.map((r, i) => `[${i + 1}] ${r.title}\n${r.url}\n${r.description}`).join("\n\n");
                } catch (searchErr) {
                  resultText = "Web search temporarily unavailable. Answer from your existing knowledge.";
                }
              } else if (block.name === "vin_query_leads") {
                res.write(`data: ${JSON.stringify({ type: "status", text: "Querying VinSolutions CRM..." })}\n\n`);
                try {
                  const input = block.input as { startDate?: string; endDate?: string; status?: string; limit?: number };
                  const args: Record<string, unknown> = { orgId: nexxusOrgId, limit: Math.min(input.limit || 20, 100) };
                  if (input.startDate) args.startDate = input.startDate;
                  if (input.endDate) args.endDate = input.endDate;
                  if (input.status) args.status = input.status;
                  if (!input.startDate) {
                    const thirtyAgo = new Date(); thirtyAgo.setDate(thirtyAgo.getDate() - 30);
                    args.startDate = thirtyAgo.toISOString().split("T")[0];
                  }
                  if (!input.endDate) {
                    args.endDate = new Date().toISOString().split("T")[0];
                  }
                  const data = await callMCP("vin_query_leads", args);
                  const leadCount = data?.count ?? data?.items?.length ?? 0;
                  const items = (data?.items || []).slice(0, 10);
                  const summary = items.map((l: any) => {
                    const name = [l.contact?.firstName, l.contact?.lastName].filter(Boolean).join(" ") || "Unknown";
                    return `- ${name} | Status: ${l.status || "N/A"} | Source: ${l.source?.name || "N/A"} | Vehicle: ${l.vehicle?.description || "N/A"}`;
                  }).join("\n");
                  resultText = `[Source: VinSolutions CRM, queried just now]\nTotal leads matching: ${leadCount}\n${summary || "No individual lead details available."}`;
                } catch (err: any) {
                  resultText = `VinSolutions query failed: ${err.message}. Unable to retrieve CRM data at this time.`;
                }
              } else if (block.name === "vin_lead_summary") {
                res.write(`data: ${JSON.stringify({ type: "status", text: "Fetching sales metrics from VinSolutions..." })}\n\n`);
                try {
                  const now = new Date();
                  const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                  const sixtyDaysAgo = new Date(now); sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
                  const fmt = (d: Date) => d.toISOString().split("T")[0];
                  const curStart = fmt(thirtyDaysAgo);
                  const curEnd = fmt(now);
                  const prevStart = fmt(sixtyDaysAgo);
                  const prevEnd = fmt(thirtyDaysAgo);

                  const qc = (s: string, e: string, st?: string) =>
                    callMCP("vin_query_leads", { orgId: nexxusOrgId, startDate: s, endDate: e, limit: 1, ...(st ? { status: st } : {}) })
                      .then((r: any) => r.count ?? r.items?.length ?? 0).catch(() => 0);

                  const [curTotal, prevTotal, curSold, prevSold, curNew, prevNew, curActive, curAppt, curWaiting] = await Promise.all([
                    qc(curStart, curEnd), qc(prevStart, prevEnd),
                    qc(curStart, curEnd, "SOLD_DELIVERED"), qc(prevStart, prevEnd, "SOLD_DELIVERED"),
                    qc(curStart, curEnd, "ACTIVE_NEW_LEAD"), qc(prevStart, prevEnd, "ACTIVE_NEW_LEAD"),
                    qc(curStart, curEnd, "ACTIVE_ACTIVE_LEAD"),
                    qc(curStart, curEnd, "ACTIVE_SET_APPOINTMENT"),
                    qc(curStart, curEnd, "ACTIVE_WAITING_FOR_PROSPECT_RESPONSE"),
                  ]);

                  const pct = (c: number, p: number) => p === 0 ? (c > 0 ? "+100%" : "0%") : `${((c - p) / p * 100).toFixed(0)}%`;
                  const convRate = curTotal > 0 ? `${Math.round((curSold / curTotal) * 100)}%` : "N/A";

                  resultText = `[Source: VinSolutions CRM, queried just now]\nPeriod: ${curStart} to ${curEnd}\n` +
                    `Total Leads: ${curTotal} (${pct(curTotal, prevTotal)} vs prior 30d)\n` +
                    `New Leads: ${curNew} (${pct(curNew, prevNew)} vs prior 30d)\n` +
                    `Active Pipeline: ${curActive}\n` +
                    `Appointments Set: ${curAppt}\n` +
                    `Waiting for Response: ${curWaiting}\n` +
                    `Sold/Delivered: ${curSold} (${pct(curSold, prevSold)} vs prior 30d)\n` +
                    `Conversion Rate: ${convRate}`;
                } catch (err: any) {
                  resultText = `VinSolutions summary failed: ${err.message}. Unable to retrieve metrics at this time.`;
                }
              } else {
                resultText = "Unknown tool.";
              }

              toolResults.push({
                type: "tool_result",
                tool_use_id: block.id,
                content: resultText || "No results found.",
              });
            }
          }

          if (intermediateText) {
            fullResponse += intermediateText;
            res.write(`data: ${JSON.stringify({ type: "content", text: intermediateText })}\n\n`);
          }

          if (!hasToolUse) break;

          currentMessages = [
            ...currentMessages,
            { role: "assistant", content: response.content },
            { role: "user", content: toolResults },
          ];

          if (round === MAX_TOOL_ROUNDS - 1) break;

          response = await anthropic.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 4096,
            system: systemPrompt,
            messages: currentMessages,
            tools: chatTools,
          });

          try {
            billingService.emitUsageEvent(req.user.organizationId, 'llm_input_tokens', { tokens: response.usage.input_tokens, model: 'claude' });
            billingService.emitUsageEvent(req.user.organizationId, 'llm_output_tokens', { tokens: response.usage.output_tokens, model: 'claude' });
          } catch(e) {}
        }

        const stream = anthropic.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 4096,
          system: systemPrompt,
          messages: currentMessages,
        });

        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            const text = event.delta.text;
            if (text) {
              fullResponse += text;
              res.write(`data: ${JSON.stringify({ type: "content", text })}\n\n`);
            }
          }
        }
      }

      await storage.createMessage({
        conversationId,
        role: "assistant",
        content: fullResponse,
        senderName: agentName || personaName,
      });
      await storage.updateConversation(conversationId, { lastMessageAt: new Date() });

      res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
      res.end();
    } catch (err: any) {
      console.error("Chat stream error:", err);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ type: "error", message: err.message || "Stream failed" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ message: "Failed to stream chat response" });
      }
    }
  });

  app.get("/api/activity-log", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const logs = await storage.getActivityLogs(req.user.organizationId, limit);
      return res.json(logs);
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch activity logs" });
    }
  });

  app.get("/api/metrics/dashboard", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const metrics = await storage.getDashboardMetrics(req.user.organizationId);
      return res.json(metrics);
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  app.get("/api/metrics/pipeline", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const pipeline = await storage.getPipelineMetrics(req.user.organizationId);
      return res.json(pipeline);
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch pipeline metrics" });
    }
  });

  app.get("/api/metrics/pipeline/details", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const metric = req.query.metric as string;
      const validMetrics = ['active_pipeline', 'appointments_today', 'open_escalations', 'outbound_sent'];
      if (!metric || !validMetrics.includes(metric)) {
        return res.status(400).json({ message: "Invalid metric. Use: " + validMetrics.join(', ') });
      }
      const details = await storage.getPipelineMetricDetails(req.user.organizationId, metric);

      if (metric === 'active_pipeline') {
        const needsEnrichment = details.filter((r: any) => !r.customerName && r.sourceId);
        if (needsEnrichment.length > 0) {
          const orgId = req.user.organizationId;
          const nexxusOrgId = resolveNexxusOrgId(orgId);
          (async () => {
            try {
              const now = new Date();
              const fourteenDaysAgo = new Date(now);
              fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
              const fmt = (d: Date) => d.toISOString().split("T")[0];

              const vinLeads = await callMCP("vin_query_leads", {
                orgId: nexxusOrgId, startDate: fmt(fourteenDaysAgo), endDate: fmt(now), limit: 100
              });
              const items = vinLeads?.items || vinLeads?.results || (Array.isArray(vinLeads) ? vinLeads : []);

              const leadToContactId = new Map<string, number>();
              for (const item of items) {
                const lid = String(item.leadId || item.id || "");
                const href = item.contact || item.ContactHref || "";
                if (lid && typeof href === "string") {
                  const cid = extractContactIdFromHref(href);
                  if (cid) leadToContactId.set(lid, cid);
                }
              }

              const toEnrich = needsEnrichment
                .filter((r: any) => leadToContactId.has(r.sourceId))
                .slice(0, 20);
              const uniqueContactIds = [...new Set(toEnrich.map((r: any) => leadToContactId.get(r.sourceId)!))];
              console.log(`[enrich-bg] enriching ${uniqueContactIds.length} contacts in background`);

              const contactWithTimeout = (cid: number) =>
                Promise.race([
                  callMCP("vin_get_contact", { orgId: nexxusOrgId, contactId: cid })
                    .then(raw => ({ cid, contact: flattenContactInfo(raw) })),
                  new Promise<null>((_, reject) => setTimeout(() => reject(new Error("timeout")), 8000)),
                ]);

              for (let i = 0; i < uniqueContactIds.length; i += 5) {
                const batch = uniqueContactIds.slice(i, i + 5);
                const results = await Promise.allSettled(batch.map(contactWithTimeout));
                for (const r of results) {
                  if (r.status === "fulfilled" && r.value) {
                    const { cid, contact } = r.value as { cid: number; contact: any };
                    const name = [contact.firstName, contact.lastName].filter(Boolean).join(" ") || null;
                    const sourceIds = toEnrich.filter((row: any) => leadToContactId.get(row.sourceId) === cid);
                    for (const row of sourceIds) {
                      storage.upsertWarehouseLead({
                        organizationId: orgId,
                        sourceId: row.sourceId,
                        dataSource: "vin_solutions",
                        customerName: name,
                        customerPhone: contact.phone || null,
                        customerEmail: contact.email || null,
                        vinStatus: row.vinStatus,
                        syncedAt: new Date(),
                      }).catch(() => {});
                    }
                    console.log(`[enrich-bg] cached contact ${cid}: ${name}`);
                  }
                }
              }
              console.log(`[enrich-bg] background enrichment complete`);
            } catch (err) {
              console.error("[enrich-bg] error:", err);
            }
          })();
        }
      }

      return res.json(details);
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch metric details" });
    }
  });

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
      const existing = await storage.getTask(req.params.id);
      if (!existing) return res.status(404).json({ message: "Task not found" });
      if (existing.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }
      const parsed = updateTaskSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid task data", errors: parsed.error.flatten() });
      }
      const task = await storage.updateTask(req.params.id, parsed.data);
      return res.json(task);
    } catch (err) {
      return res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const existing = await storage.getTask(req.params.id);
      if (!existing) return res.status(404).json({ message: "Task not found" });
      if (existing.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }
      await storage.deleteTask(req.params.id);
      return res.json({ message: "Task deleted" });
    } catch (err) {
      return res.status(500).json({ message: "Failed to delete task" });
    }
  });

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
      const result = await storage.getAppointment(req.params.id);
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
      const { title, customerName, customerPhone, customerEmail, appointmentType, department, startTime, endTime, notes, assignedUserId } = req.body;
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
        status: "scheduled",
        notes: notes || null,
        source: "manual",
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
      const existing = await storage.getAppointment(req.params.id);
      if (!existing) return res.status(404).json({ message: "Appointment not found" });
      if (existing.organizationId !== req.user.organizationId) return res.status(403).json({ message: "Access denied" });
      const updates: Record<string, any> = {};
      const allowed = ["title", "customerName", "customerPhone", "customerEmail", "appointmentType", "department", "startTime", "endTime", "status", "notes", "assignedUserId"];
      for (const key of allowed) {
        if (req.body[key] !== undefined) {
          updates[key] = (key === "startTime" || key === "endTime") ? new Date(req.body[key]) : req.body[key];
        }
      }
      const result = await storage.updateAppointment(req.params.id, updates);
      if (!result) return res.status(404).json({ message: "Appointment not found" });
      return res.json(result);
    } catch (err) {
      return res.status(500).json({ message: "Failed to update appointment" });
    }
  });

  app.delete("/api/appointments/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const existing = await storage.getAppointment(req.params.id);
      if (!existing) return res.status(404).json({ message: "Appointment not found" });
      if (existing.organizationId !== req.user.organizationId) return res.status(403).json({ message: "Access denied" });
      await storage.deleteAppointment(req.params.id);
      return res.json({ message: "Appointment deleted" });
    } catch (err) {
      return res.status(500).json({ message: "Failed to delete appointment" });
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
      const widget = await storage.getWidget(req.params.id);
      if (!widget) return res.status(404).json({ message: "Widget not found" });
      if (widget.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }
      return res.json(widget);
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch widget" });
    }
  });

  app.post("/api/widgets", authenticateToken, requireEntitlement('widget_slots'), async (req, res) => {
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

  app.patch("/api/widgets/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const existing = await storage.getWidget(req.params.id);
      if (!existing) return res.status(404).json({ message: "Widget not found" });
      if (existing.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }
      const parsed = updateWidgetSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid widget data", errors: parsed.error.flatten() });
      }
      const widget = await storage.updateWidget(req.params.id, parsed.data);
      return res.json(widget);
    } catch (err) {
      return res.status(500).json({ message: "Failed to update widget" });
    }
  });

  app.delete("/api/widgets/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const existing = await storage.getWidget(req.params.id);
      if (!existing) return res.status(404).json({ message: "Widget not found" });
      if (existing.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }
      await storage.deleteWidget(req.params.id);
      return res.json({ message: "Widget deleted" });
    } catch (err) {
      return res.status(500).json({ message: "Failed to delete widget" });
    }
  });

  app.get("/api/documents", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const agentId = req.query.agentId as string | undefined;
      const docs = await storage.getDocuments(req.user.organizationId, agentId);
      return res.json(docs);
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.post("/api/documents/check-duplicate", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const { filename } = req.body;
      if (!filename) return res.status(400).json({ message: "filename is required" });

      const existing = await storage.getDocumentByNameAndOrg(filename, req.user.organizationId);
      if (existing) {
        const result: any = {
          isDuplicate: true,
          existingDocument: {
            id: existing.id,
            name: existing.name,
            type: existing.type,
            size: existing.size,
            status: existing.status,
            createdAt: existing.createdAt,
            updatedAt: existing.updatedAt,
          },
        };

        if (existing.type === "csv") {
          const existingRows = await storage.getDocumentsBySourceName(existing.name, req.user.organizationId);
          result.existingCsvData = {
            rowCount: existingRows.length,
            headers: existing.content ? existing.content.replace(/^CSV file with \d+ rows\. Columns: /, "").split(", ") : [],
            previewRows: existingRows.slice(0, 5).map(r => r.content || ""),
          };
        }

        return res.json(result);
      }
      return res.json({ isDuplicate: false, existingDocument: null });
    } catch (err) {
      return res.status(500).json({ message: "Failed to check for duplicate" });
    }
  });

  app.post("/api/documents", authenticateToken, upload.single("file"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const file = req.file;
      if (!file) return res.status(400).json({ message: "No file uploaded" });

      if (file.size === 0 || file.buffer.length === 0) {
        return res.status(400).json({ message: "File is empty" });
      }

      const ext = file.originalname.split(".").pop()?.toLowerCase() || "unknown";
      const typeMap: Record<string, string> = { pdf: "pdf", docx: "docx", doc: "docx", csv: "csv", txt: "txt", html: "html", htm: "html" };
      const docType = typeMap[ext] || ext;

      const replaceExisting = req.body.replaceExisting === "true" || req.body.replaceExisting === true;
      if (replaceExisting) {
        const existing = await storage.getDocumentByNameAndOrg(file.originalname, req.user.organizationId);
        if (existing) {
          await storage.deleteDocument(existing.id);
          await storage.deleteDocumentsBySourceName(file.originalname, req.user.organizationId);
        }
      }

      if (ext === "csv") {
        let rawContent: string;
        try {
          rawContent = file.buffer.toString("utf-8");
        } catch (encErr) {
          return res.status(400).json({ message: "File encoding error: unable to read file as UTF-8 text" });
        }

        if (!rawContent || rawContent.trim().length === 0) {
          return res.status(400).json({ message: "Malformed CSV: file is empty" });
        }

        const lines = rawContent.split("\n").map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length < 1) {
          return res.status(400).json({ message: "Malformed CSV: file contains no data" });
        }

        const headerLine = lines[0];
        const headers = parseCSVLine(headerLine);
        if (headers.length === 0) {
          return res.status(400).json({ message: "Malformed CSV: unable to parse header row" });
        }

        if (lines.length < 2) {
          return res.status(400).json({ message: "Malformed CSV: file has a header row but no data rows" });
        }

        const parentDoc = await storage.createDocument({
          name: file.originalname,
          type: docType,
          size: file.size,
          status: "indexed",
          organizationId: req.user.organizationId,
          agentId: (req.body.agentId as string) || null,
          content: `CSV file with ${lines.length - 1} rows. Columns: ${headers.join(", ")}`,
          mimeType: file.mimetype,
        });

        const expectedColumns = headers.length;
        const createdChunks = [];
        let parseErrors = 0;
        for (let i = 1; i < lines.length; i++) {
          try {
            const values = parseCSVLine(lines[i]);

            if (values.length !== expectedColumns) {
              parseErrors++;
              continue;
            }

            const hasUnbalancedQuotes = values.some((field) => {
              const unescaped = field.replace(/""/g, "");
              const quoteCount = (unescaped.match(/"/g) || []).length;
              return quoteCount % 2 !== 0;
            });
            if (hasUnbalancedQuotes) {
              parseErrors++;
              continue;
            }

            const rowObj: Record<string, string> = {};
            for (let j = 0; j < headers.length; j++) {
              rowObj[headers[j]] = values[j] || "";
            }
            const rowContent = Object.entries(rowObj)
              .filter(([_, v]) => v.trim().length > 0)
              .map(([k, v]) => `${k}: ${v}`)
              .join("\n");

            if (rowContent.trim().length === 0) continue;

            const chunk = await storage.createDocument({
              name: `${file.originalname} — Row ${i}`,
              type: "csv-row",
              size: rowContent.length,
              status: "indexed",
              organizationId: req.user.organizationId,
              agentId: (req.body.agentId as string) || null,
              content: rowContent,
              mimeType: "text/csv",
              sourceDocumentName: file.originalname,
            });
            createdChunks.push(chunk);
          } catch (rowErr) {
            parseErrors++;
          }
        }

        if (parseErrors > 0) {
          await storage.deleteDocument(parentDoc.id);
          for (const chunk of createdChunks) {
            await storage.deleteDocument(chunk.id);
          }
          const totalDataRows = lines.length - 1;
          return res.status(400).json({
            message: `CSV has ${parseErrors} malformed row${parseErrors > 1 ? 's' : ''} out of ${totalDataRows} total. Please fix the file and re-upload.`,
          });
        }

        storage.createActivityLog({
          userId: req.user!.id,
          organizationId: req.user!.organizationId,
          action: "document_uploaded",
          entityType: "document",
          entityId: parentDoc.id,
          metadata: {
            fileName: file.originalname,
            fileType: docType,
            fileSize: file.size,
            csvRows: createdChunks.length,
          },
        }).catch(() => {});

        return res.status(201).json({
          ...parentDoc,
          csvRowsCreated: createdChunks.length,
        });
      }

      let content: string | null = null;
      if (["txt", "html", "htm"].includes(ext)) {
        try {
          content = file.buffer.toString("utf-8");
        } catch (encErr) {
          return res.status(400).json({ message: "File encoding error: unable to read file as UTF-8 text" });
        }
        if (!content || content.trim().length === 0) {
          return res.status(400).json({ message: "Malformed file: file is empty or contains no readable content" });
        }
      }

      const doc = await storage.createDocument({
        name: file.originalname,
        type: docType,
        size: file.size,
        status: "indexed",
        organizationId: req.user.organizationId,
        agentId: (req.body.agentId as string) || null,
        content,
        mimeType: file.mimetype,
      });

      storage.createActivityLog({
        userId: req.user!.id,
        organizationId: req.user!.organizationId,
        action: "document_uploaded",
        entityType: "document",
        entityId: doc.id,
        metadata: { fileName: file.originalname, fileType: docType, fileSize: file.size },
      }).catch(() => {});

      return res.status(201).json(doc);
    } catch (err: any) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ message: "File too large. Maximum upload size is 5MB." });
      }
      console.error("Document upload error:", err);
      return res.status(500).json({ message: "Failed to upload document" });
    }
  });

  app.delete("/api/documents/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const doc = await storage.getDocument(req.params.id);
      if (!doc) return res.status(404).json({ message: "Document not found" });
      if (doc.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }
      if (doc.type !== "csv-row") {
        await storage.deleteDocumentsBySourceName(doc.name, doc.organizationId);
      }
      await storage.deleteDocument(req.params.id);
      return res.json({ message: "Document deleted" });
    } catch (err) {
      return res.status(500).json({ message: "Failed to delete document" });
    }
  });

  app.post("/api/campaigns/:id/upload-csv", authenticateToken, upload.single("file"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const file = req.file;
      if (!file) return res.status(400).json({ message: "No file uploaded" });

      const campaign = await storage.getCampaign(req.params.id);
      if (!campaign) return res.status(404).json({ message: "Campaign not found" });
      if (campaign.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const csvContent = file.buffer.toString("utf-8");
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
      await storage.updateCampaign(campaign.id, { recipientCount, csvFilename: file.originalname } as any);

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

  app.get("/api/campaigns/:id/recipients", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const campaign = await storage.getCampaign(req.params.id);
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

  app.get("/api/notifications", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
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
      await storage.markNotificationRead(req.params.id);
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
      await storage.removeFavorite(req.params.id, req.user.id);
      return res.json({ message: "Favorite removed" });
    } catch (err) {
      return res.status(500).json({ message: "Failed to remove favorite" });
    }
  });

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
      const existing = await storage.getHunch(req.params.id);
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
      const updated = await storage.updateHunch(req.params.id, updateData);
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

  app.post("/api/users/me/photo", authenticateToken, upload.single("photo"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const file = req.file;
      if (!file) return res.status(400).json({ message: "No photo uploaded" });

      if (!file.mimetype.startsWith("image/")) {
        return res.status(400).json({ message: "File must be an image" });
      }

      if (file.size > 500 * 1024) {
        return res.status(400).json({ message: "Photo must be less than 500KB" });
      }

      const base64 = file.buffer.toString("base64");
      const dataUrl = `data:${file.mimetype};base64,${base64}`;

      const updated = await storage.updateUser(req.user.id, { profilePhotoUrl: dataUrl } as any);
      if (!updated) return res.status(404).json({ message: "User not found" });

      return res.json({ profilePhotoUrl: dataUrl });
    } catch (err) {
      return res.status(500).json({ message: "Failed to upload photo" });
    }
  });

  const vapiWebhookPayloadSchema = z.object({
    message: z.object({
      type: z.string(),
      call: z.object({
        id: z.string().optional(),
        orgId: z.string().optional(),
        type: z.string().optional(),
        status: z.string().optional(),
        phoneNumber: z.object({
          number: z.string().optional(),
        }).optional(),
        customer: z.object({
          number: z.string().optional(),
          name: z.string().optional(),
        }).optional(),
        transcript: z.string().optional(),
        summary: z.string().optional(),
        startedAt: z.string().optional(),
        endedAt: z.string().optional(),
        assistantId: z.string().optional(),
      }).optional(),
    }),
  });

  app.post("/api/webhooks/vapi", async (req, res) => {
    try {
      const vapiSecret = process.env.VAPI_PRIVATE_KEY;
      if (vapiSecret) {
        const headerSecret = req.headers["x-vapi-secret"] || req.headers["authorization"];
        const providedSecret = typeof headerSecret === "string" ? headerSecret.replace(/^Bearer\s+/i, "") : "";
        if (providedSecret !== vapiSecret) {
          console.warn("[VAPI Webhook] Invalid secret — rejecting request");
          return res.status(401).json({ message: "Unauthorized" });
        }
      }

      const parsed = vapiWebhookPayloadSchema.safeParse(req.body);
      if (!parsed.success) {
        console.warn("[VAPI Webhook] Invalid payload:", parsed.error.flatten());
        return res.status(400).json({ message: "Invalid webhook payload" });
      }

      const { message } = parsed.data;

      if (message.type !== "end-of-call-report" && message.type !== "call-ended") {
        return res.json({ message: "Event type ignored", type: message.type });
      }

      const call = message.call;
      if (!call) {
        return res.status(400).json({ message: "Missing call data in payload" });
      }

      const customerName = call.customer?.name || "Unknown Caller";
      const customerPhone = call.customer?.number || call.phoneNumber?.number || null;
      const assistantId = call.assistantId || null;
      const transcript = call.transcript || "";
      const summary = call.summary || "";

      let organizationId: string | null = null;
      let agentId: string | null = null;

      if (assistantId) {
        const allOrgs = await storage.getOrganizations();
        for (const org of allOrgs) {
          const orgAgents = await storage.getAgents(org.id);
          const matchingAgent = orgAgents.find(a => a.vapiAssistantId === assistantId);
          if (matchingAgent) {
            organizationId = org.id;
            agentId = matchingAgent.id;
            break;
          }
        }
      }

      if (!organizationId) {
        console.error("[VAPI Webhook] Could not resolve organization from assistantId — rejecting. No fallback to arbitrary org.");
        return res.status(422).json({ message: "No organization found to associate call with. Configure agent's VAPI assistant ID." });
      }

      const conversation = await storage.createConversation({
        customerName,
        customerPhone,
        channel: "voice",
        status: "open",
        agentId,
        organizationId,
        unreadCount: 1,
        lastMessageAt: new Date(),
      });

      if (transcript || summary) {
        const messageContent = summary
          ? `**Call Summary:**\n${summary}\n\n**Transcript:**\n${transcript}`
          : transcript;

        await storage.createMessage({
          conversationId: conversation.id,
          role: "system",
          content: messageContent,
          senderName: "VAPI",
        });
      }

      let vinContactHref: string | null = null;
      let vinLeadCreated = false;
      const vapiPayloadSnapshot = {
        callId: call.id,
        assistantId,
        customerName,
        customerPhone,
        callStatus: call.status,
        transcriptLength: transcript.length,
        summaryLength: summary.length,
      };

      try {
        const { callMCP, resolveNexxusOrgId } = await import("./vendorProxy");
        const nexxusOrgId = resolveNexxusOrgId(organizationId);

        const nameParts = customerName.split(" ");
        const firstName = nameParts[0] || "Unknown";
        const lastName = nameParts.slice(1).join(" ") || "Caller";

        const contactResult = await callMCP("vin_create_contact", {
          orgId: nexxusOrgId,
          firstName,
          lastName,
          phone: customerPhone || undefined,
        });
        vinContactHref = contactResult?.href || contactResult?.contactHref || contactResult?.id || null;
        console.log(`[VAPI→VIN] Step 1 success: contact created, href=${vinContactHref}`);

        try {
          await callMCP("vin_create_lead", {
            orgId: nexxusOrgId,
            contactHref: vinContactHref,
            source: "VAPI Inbound Call",
            description: summary || `Inbound call from ${customerName}`,
            transcript: transcript.substring(0, 5000),
          });
          vinLeadCreated = true;
          console.log(`[VAPI→VIN] Step 2 success: lead created for contact ${vinContactHref}`);
        } catch (step2Err: any) {
          console.error(`[VAPI→VIN] Step 2 FAILED (lead creation):`, step2Err.message);
          await storage.createTask({
            type: "escalation",
            title: "VIN Lead Creation Failed (Step 2)",
            description: `Contact was created (href: ${vinContactHref}) but lead creation failed.\n\nError: ${step2Err.message}`,
            status: "todo",
            priority: "critical",
            organizationId,
            tags: ["escalation", "vin-integration", "vapi", "auto-generated"],
            metadata: JSON.stringify({
              trigger_id: `vapi-vin-${Date.now()}`,
              org_id: organizationId,
              failed_step: 2,
              contact_href: vinContactHref,
              error_response: step2Err.message,
              timestamp: new Date().toISOString(),
              original_vapi_data: vapiPayloadSnapshot,
              conversation_id: conversation.id,
            }),
          });
          storage.createActivityLog({
            organizationId,
            action: "vin_lead_creation_failed",
            entityType: "conversation",
            entityId: conversation.id,
            metadata: { failed_step: 2, contact_href: vinContactHref, error: step2Err.message },
          }).catch(() => {});
        }
      } catch (step1Err: any) {
        console.error(`[VAPI→VIN] Step 1 FAILED (contact creation):`, step1Err.message);
        await storage.createTask({
          type: "escalation",
          title: "VIN Contact Creation Failed (Step 1)",
          description: `Failed to create VIN Solutions contact for VAPI call.\n\nCaller: ${customerName} (${customerPhone || "no phone"})\nError: ${step1Err.message}`,
          status: "todo",
          priority: "critical",
          organizationId,
          tags: ["escalation", "vin-integration", "vapi", "auto-generated"],
          metadata: JSON.stringify({
            trigger_id: `vapi-vin-${Date.now()}`,
            org_id: organizationId,
            failed_step: 1,
            error_response: step1Err.message,
            timestamp: new Date().toISOString(),
            original_vapi_data: vapiPayloadSnapshot,
            conversation_id: conversation.id,
          }),
        });
        storage.createActivityLog({
          organizationId,
          action: "vin_contact_creation_failed",
          entityType: "conversation",
          entityId: conversation.id,
          metadata: { failed_step: 1, error: step1Err.message, customerName, customerPhone },
        }).catch(() => {});
      }

      const users = await storage.getUsers(organizationId);
      const adminUsers = users.filter(u => u.role && u.role.level <= 3);
      for (const user of adminUsers) {
        storage.createNotification({
          userId: user.id,
          organizationId,
          type: "call",
          title: "New Inbound Call Completed",
          message: `Call from ${customerName}${customerPhone ? ` (${customerPhone})` : ""} has been completed and added to TeamBox.${vinLeadCreated ? " VIN lead created." : ""}`,
          relatedEntityType: "conversation",
          relatedEntityId: conversation.id,
        }).catch(() => {});
      }

      storage.createActivityLog({
        organizationId,
        action: "vapi_call_received",
        entityType: "conversation",
        entityId: conversation.id,
        metadata: {
          customerName,
          customerPhone,
          assistantId,
          callId: call.id,
          callStatus: call.status,
          agentId,
          vinContactHref,
          vinLeadCreated,
        },
      }).catch(() => {});

      console.log(`[VAPI Webhook] Created conversation ${conversation.id} from call ${call.id || "unknown"}, VIN lead: ${vinLeadCreated}`);

      if (transcript && transcript.length > 0) {
        let callDurationSeconds = 0;
        if (call.startedAt && call.endedAt) {
          callDurationSeconds = (new Date(call.endedAt).getTime() - new Date(call.startedAt).getTime()) / 1000;
        } else {
          callDurationSeconds = transcript.length > 100 ? 30 : 0;
        }

        if (callDurationSeconds > 15) {
          analyzeTranscriptWithClaude({
            transcript,
            organizationId,
            customerName,
            customerPhone,
            source: "vapi",
            conversationId: conversation.id,
          }).catch(err => {
            console.error("[AI-Analysis] Fire-and-forget VAPI analysis error:", err.message);
          });
        }

        const callDurationMinutes = Math.ceil(callDurationSeconds / 60);
        if (callDurationMinutes > 0 && organizationId) {
          try { billingService.emitUsageEvent(organizationId, 'voice_minute', { minutes: callDurationMinutes, provider: 'vapi' }); } catch(e) {}
        }
      }

      return res.json({
        message: "Webhook processed successfully",
        conversationId: conversation.id,
        vinLeadCreated,
      });
    } catch (err) {
      console.error("[VAPI Webhook] Error processing webhook:", err);
      return res.status(500).json({ message: "Failed to process webhook" });
    }
  });

  app.get("/api/webhooks/vapi", async (_req, res) => {
    return res.json({ status: "ok", service: "nexxus-connect-vapi-webhook" });
  });

  app.post("/api/webhooks/tavus", async (req, res) => {
    try {
      const { event, conversation_id, status } = req.body;

      if (event !== "conversation.end" && status !== "ended" && event !== "conversation_ended") {
        return res.json({ message: "Event type ignored", event });
      }

      const tavusConversationId = conversation_id || req.body.conversationId;
      if (!tavusConversationId) {
        return res.status(400).json({ message: "Missing conversation_id" });
      }

      console.log(`[Tavus Webhook] Processing ended conversation: ${tavusConversationId}`);

      let tavusData: any = null;
      try {
        const { default: fetch } = await import("node-fetch" as any).catch(() => ({ default: globalThis.fetch }));
        const tavusApiKey = process.env.TAVUS_API_KEY;
        if (tavusApiKey) {
          const tavusRes = await fetch(`https://tavusapi.com/v2/conversations/${tavusConversationId}`, {
            headers: { "x-api-key": tavusApiKey, "Content-Type": "application/json" },
          });
          if (tavusRes.ok) {
            tavusData = await tavusRes.json();
          } else {
            console.warn(`[Tavus Webhook] Could not fetch conversation details: ${tavusRes.status}`);
          }
        }
      } catch (fetchErr: any) {
        console.warn(`[Tavus Webhook] Fetch error:`, fetchErr.message);
      }

      const transcript = tavusData?.transcript || tavusData?.conversation_transcript || req.body.transcript || "";
      const summary = tavusData?.summary || req.body.summary || "";
      const visitorName = tavusData?.conversation_name?.replace("Session with ", "") || "Video Visitor";
      const personaId = tavusData?.persona_id || req.body.persona_id;

      let organizationId: string | null = null;
      let agentId: string | null = null;

      if (personaId) {
        const allOrgs = await storage.getOrganizations();
        for (const org of allOrgs) {
          const orgAgents = await storage.getAgents(org.id);
          const matchingAgent = orgAgents.find(a => a.tavusPersonaId === personaId);
          if (matchingAgent) {
            organizationId = org.id;
            agentId = matchingAgent.id;
            break;
          }
        }
      }

      if (!organizationId) {
        const allOrgs = await storage.getOrganizations();
        if (allOrgs.length > 0) {
          organizationId = allOrgs[0].id;
          console.warn(`[Tavus Webhook] Could not resolve org from persona — defaulting to ${allOrgs[0].name}`);
        } else {
          return res.status(422).json({ message: "No organization found" });
        }
      }

      const conversation = await storage.createConversation({
        customerName: visitorName,
        channel: "video",
        status: "open",
        agentId,
        organizationId,
        unreadCount: 1,
        lastMessageAt: new Date(),
      });

      if (transcript || summary) {
        const messageContent = summary
          ? `**Video Call Summary:**\n${summary}\n\n**Transcript:**\n${transcript}`
          : `**Video Call Transcript:**\n${transcript}`;

        await storage.createMessage({
          conversationId: conversation.id,
          role: "system",
          content: messageContent,
          senderName: "Tavus",
        });
      }

      let vinLeadCreated = false;
      try {
        const { callMCP, resolveNexxusOrgId } = await import("./vendorProxy");
        const nexxusOrgId = resolveNexxusOrgId(organizationId);

        const nameParts = visitorName.split(" ");
        const firstName = nameParts[0] || "Video";
        const lastName = nameParts.slice(1).join(" ") || "Visitor";

        const contactResult = await callMCP("vin_create_contact", {
          orgId: nexxusOrgId,
          firstName,
          lastName,
        });
        const vinContactHref = contactResult?.href || contactResult?.contactHref || contactResult?.id || null;
        console.log(`[Tavus→VIN] Step 1 success: contact created, href=${vinContactHref}`);

        try {
          await callMCP("vin_create_lead", {
            orgId: nexxusOrgId,
            contactHref: vinContactHref,
            source: "Tavus Video Conversation",
            description: summary || `Video conversation with ${visitorName}`,
            transcript: transcript.substring(0, 5000),
          });
          vinLeadCreated = true;
          console.log(`[Tavus→VIN] Step 2 success: lead created for contact ${vinContactHref}`);
        } catch (step2Err: any) {
          console.error(`[Tavus→VIN] Step 2 FAILED (lead creation):`, step2Err.message);
          await storage.createTask({
            type: "escalation",
            title: "VIN Lead Creation Failed — Tavus Video (Step 2)",
            description: `Contact was created (href: ${vinContactHref}) but lead creation failed.\n\nError: ${step2Err.message}`,
            status: "todo",
            priority: "critical",
            organizationId,
            tags: ["escalation", "vin-integration", "tavus", "auto-generated"],
            metadata: JSON.stringify({
              trigger_id: `tavus-vin-${Date.now()}`,
              org_id: organizationId,
              failed_step: 2,
              contact_href: vinContactHref,
              error_response: step2Err.message,
              tavus_conversation_id: tavusConversationId,
              conversation_id: conversation.id,
            }),
          });
        }
      } catch (step1Err: any) {
        console.error(`[Tavus→VIN] Step 1 FAILED (contact creation):`, step1Err.message);
        await storage.createTask({
          type: "escalation",
          title: "VIN Contact Creation Failed — Tavus Video (Step 1)",
          description: `Failed to create VIN Solutions contact for Tavus video.\n\nVisitor: ${visitorName}\nError: ${step1Err.message}`,
          status: "todo",
          priority: "critical",
          organizationId,
          tags: ["escalation", "vin-integration", "tavus", "auto-generated"],
          metadata: JSON.stringify({
            trigger_id: `tavus-vin-${Date.now()}`,
            org_id: organizationId,
            failed_step: 1,
            error_response: step1Err.message,
            tavus_conversation_id: tavusConversationId,
            conversation_id: conversation.id,
          }),
        });
      }

      const users = await storage.getUsers(organizationId);
      const adminUsers = users.filter(u => u.role && u.role.level <= 3);
      for (const user of adminUsers) {
        storage.createNotification({
          userId: user.id,
          organizationId,
          type: "call",
          title: "Video Conversation Completed",
          message: `Video conversation with ${visitorName} has been completed and added to TeamBox.${vinLeadCreated ? " VIN lead created." : ""}`,
          relatedEntityType: "conversation",
          relatedEntityId: conversation.id,
        }).catch(() => {});
      }

      storage.createActivityLog({
        organizationId,
        action: "tavus_video_completed",
        entityType: "conversation",
        entityId: conversation.id,
        metadata: { visitorName, personaId, tavusConversationId, agentId, vinLeadCreated },
      }).catch(() => {});

      console.log(`[Tavus Webhook] Created conversation ${conversation.id} from video ${tavusConversationId}, VIN lead: ${vinLeadCreated}`);

      if (transcript && transcript.length > 0) {
        let sessionDurationSeconds = 0;
        if (tavusData?.started_at && tavusData?.ended_at) {
          sessionDurationSeconds = (new Date(tavusData.ended_at).getTime() - new Date(tavusData.started_at).getTime()) / 1000;
        } else if (tavusData?.duration) {
          sessionDurationSeconds = tavusData.duration;
        } else {
          sessionDurationSeconds = transcript.length > 100 ? 30 : 0;
        }

        if (sessionDurationSeconds > 15) {
          analyzeTranscriptWithClaude({
            transcript,
            organizationId,
            customerName: visitorName,
            customerPhone: null,
            source: "tavus",
            conversationId: conversation.id,
          }).catch(err => {
            console.error("[AI-Analysis] Fire-and-forget Tavus analysis error:", err.message);
          });
        }

        const sessionDurationMinutes = Math.ceil(sessionDurationSeconds / 60);
        if (sessionDurationMinutes > 0 && organizationId) {
          try { billingService.emitUsageEvent(organizationId, 'video_minute', { minutes: sessionDurationMinutes, type: 'cvi' }); } catch(e) {}
        }
      }

      return res.json({
        message: "Webhook processed successfully",
        conversationId: conversation.id,
        vinLeadCreated,
      });
    } catch (err) {
      console.error("[Tavus Webhook] Error processing webhook:", err);
      return res.status(500).json({ message: "Failed to process webhook" });
    }
  });

  app.post("/api/sync/backfill", authenticateToken, requireRole(2), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const orgId = resolveOrgIdParam(req) || req.user.organizationId;
      const result = await runHistoricalBackfill(orgId);
      if (result.error) {
        return res.status(502).json({ message: "Backfill completed with errors", ...result });
      }
      return res.json({ message: "Backfill completed", ...result });
    } catch (err: any) {
      return res.status(500).json({ message: "Failed to run backfill", error: err.message });
    }
  });

  app.post("/api/sync/delta", authenticateToken, requireRole(2), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const orgId = resolveOrgIdParam(req) || req.user.organizationId;
      const result = await runDailyDelta(orgId);
      if (result.error) {
        return res.status(502).json({ message: "Delta sync completed with errors", ...result });
      }
      return res.json({ message: "Delta sync completed", ...result });
    } catch (err: any) {
      return res.status(500).json({ message: "Failed to run delta sync", error: err.message });
    }
  });

  app.post("/api/sync/metrics", authenticateToken, requireRole(2), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const orgId = resolveOrgIdParam(req) || req.user.organizationId;
      const result = await runMetricsRefresh(orgId);
      if (result.error) {
        return res.status(502).json({ message: "Metrics refresh completed with errors", ...result });
      }
      return res.json({ message: "Metrics refresh completed", ...result });
    } catch (err: any) {
      return res.status(500).json({ message: "Failed to refresh metrics", error: err.message });
    }
  });

  app.get("/api/sync/status", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const [backfill, delta, metrics] = await Promise.all([
        storage.getLatestSync(req.user.organizationId, "backfill"),
        storage.getLatestSync(req.user.organizationId, "daily_delta"),
        storage.getLatestSync(req.user.organizationId, "metrics_refresh"),
      ]);
      return res.json({ backfill: backfill || null, dailyDelta: delta || null, metricsRefresh: metrics || null });
    } catch (err: any) {
      return res.status(500).json({ message: "Failed to fetch sync status", error: err.message });
    }
  });

  app.get("/api/sync/logs", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const logs = await storage.getSyncLogs(req.user.organizationId, limit);
      return res.json(logs);
    } catch (err: any) {
      return res.status(500).json({ message: "Failed to fetch sync logs", error: err.message });
    }
  });

  app.get("/api/warehouse/leads", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const orgId = resolveOrgIdParam(req);
      if (!orgId) return res.status(403).json({ message: "Access denied: cannot view that organization" });
      const { status, limit = "100" } = req.query;
      const leads = await storage.getWarehouseLeads(orgId, {
        status: status as string | undefined,
        limit: Math.min(Number(limit) || 100, 500),
      });
      const total = await storage.getWarehouseLeadCount(orgId, {
        status: status as string | undefined,
      });
      return res.json({ items: leads, total });
    } catch (err: any) {
      return res.status(500).json({ message: "Failed to fetch warehouse leads", error: err.message });
    }
  });

  app.get("/api/warehouse/metrics", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const orgId = resolveOrgIdParam(req);
      if (!orgId) return res.status(403).json({ message: "Access denied: cannot view that organization" });
      const { metricKey, period } = req.query;
      const metrics = await storage.getWarehouseMetrics(orgId, {
        metricKey: metricKey as string | undefined,
        period: period as string | undefined,
      });
      return res.json(metrics);
    } catch (err: any) {
      return res.status(500).json({ message: "Failed to fetch warehouse metrics", error: err.message });
    }
  });

  app.get("/api/insights/dashboard", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const orgId = resolveOrgIdParam(req);
      if (!orgId) return res.status(403).json({ message: "Access denied: cannot view that organization" });

      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const allLeads = await storage.getWarehouseLeads(orgId, {
        createdAfter: thirtyDaysAgo,
      });
      const metrics = await storage.getWarehouseMetrics(orgId, {});

      const hotLeadsGoingCold = allLeads
        .filter(l => isActiveLead(l.vinStatus))
        .map(l => {
          const created = l.vinCreatedAt ? new Date(l.vinCreatedAt) : new Date(l.createdAt);
          const daysOld = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
          return {
            id: l.id, leadId: l.sourceId || l.id, daysOld, type: "Internet",
            source: l.leadSource || "Unknown", vehicle: l.vehicleOfInterest || "",
            status: l.vinStatus || "active", isHot: l.vinStatus === "hot" || l.vinStatus === "ACTIVE_ACTIVE_LEAD",
            customerName: l.customerName || null, customerPhone: l.customerPhone || null, customerEmail: l.customerEmail || null,
          };
        })
        .filter(l => l.daysOld > 2)
        .sort((a, b) => (b.daysOld || 0) - (a.daysOld || 0))
        .slice(0, 20);

      const newLeadsNoContact = allLeads
        .filter(l => isNewLead(l.vinStatus))
        .map(l => {
          const created = l.vinCreatedAt ? new Date(l.vinCreatedAt) : new Date(l.createdAt);
          const hoursOld = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));
          return {
            id: l.id, leadId: l.sourceId || l.id, hoursOld, type: "Internet",
            source: l.leadSource || "Unknown", vehicle: l.vehicleOfInterest || "",
            customerName: l.customerName || null, customerPhone: l.customerPhone || null, customerEmail: l.customerEmail || null,
          };
        })
        .sort((a, b) => (b.hoursOld || 0) - (a.hoursOld || 0))
        .slice(0, 20);

      const showroomNotClosed = allLeads
        .filter(l => l.leadSource?.toLowerCase().includes("walk") || l.leadSource?.toLowerCase().includes("showroom"))
        .filter(l => !isSoldLead(l.vinStatus))
        .map(l => {
          const created = l.vinCreatedAt ? new Date(l.vinCreatedAt) : new Date(l.createdAt);
          const daysOld = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
          return {
            id: l.id, leadId: l.sourceId || l.id, daysOld, type: "Walk-In",
            source: l.leadSource || "Showroom", vehicle: l.vehicleOfInterest || "",
            status: l.vinStatus || "open",
            customerName: l.customerName || null, customerPhone: l.customerPhone || null, customerEmail: l.customerEmail || null,
          };
        })
        .slice(0, 20);

      const totalLeads = allLeads.length;
      const hotCount = allLeads.filter(l => isActiveLead(l.vinStatus)).length;
      const soldCount = allLeads.filter(l => isSoldLead(l.vinStatus)).length;
      const conversionRate = totalLeads > 0 ? Math.round((soldCount / totalLeads) * 1000) / 10 : 0;
      const newCount = allLeads.filter(l => isNewLead(l.vinStatus)).length;

      const sourceCounts: Record<string, number> = {};
      allLeads.forEach(l => {
        const src = l.leadSource || "Unknown";
        sourceCounts[src] = (sourceCounts[src] || 0) + 1;
      });
      const topLeadSources = Object.entries(sourceCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8)
        .map(([source, count], i) => ({
          source, leads: count, rate: totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0,
          grade: i === 0 ? "A+" : i < 3 ? "A" : i < 5 ? "B" : "C",
        }));

      const channelCounts: Record<string, { total: number; won: number }> = {};
      allLeads.forEach(l => {
        const ch = l.leadSource?.includes("Phone") ? "Phone" : l.leadSource?.includes("Walk") ? "Walk-In" : l.leadSource?.includes("Web") ? "Website" : "Other";
        if (!channelCounts[ch]) channelCounts[ch] = { total: 0, won: 0 };
        channelCounts[ch].total++;
        if (isSoldLead(l.vinStatus)) channelCounts[ch].won++;
      });
      const channelPerformance = Object.entries(channelCounts).map(([channel, data]) => ({
        channel, volume: data.total, conversion: data.total > 0 ? Math.round((data.won / data.total) * 100) : 0,
      }));

      const metricsMap: Record<string, string> = {};
      metrics.forEach(m => { metricsMap[m.metricKey] = m.metricValue; });

      return res.json({
        overview: {
          totalLeads, hotCount, newCount, soldCount, conversionRate,
          metricsFromWarehouse: metricsMap,
        },
        redZone: { hotLeadsGoingCold, newLeadsNoContact, showroomNotClosed },
        yellowZone: {
          staleLeads: allLeads.filter(l => {
            const updated = l.vinUpdatedAt ? new Date(l.vinUpdatedAt) : new Date(l.createdAt);
            return (now.getTime() - updated.getTime()) > 7 * 24 * 60 * 60 * 1000 && !isSoldLead(l.vinStatus);
          }).length,
          pendingFinance: allLeads.filter(l => l.vinStatus === "pending_finance" || l.vinStatus === "SOLD_PENDING_FINANCE").length,
        },
        greenZone: [
          { label: "Pipeline Active", value: hotCount, status: hotCount > 0 ? "healthy" : "empty" },
          { label: "Conversion Rate", value: `${conversionRate}%`, status: conversionRate > 10 ? "healthy" : "watch" },
          { label: "Total Leads", value: totalLeads, status: "info" },
        ],
        pipelineHealth: {
          velocity: metricsMap["pipeline_velocity"] || null,
          freshness: metricsMap["pipeline_freshness"] || null,
          forecast: metricsMap["month_end_forecast"] || null,
        },
        topLeadSources,
        channelPerformance,
      });
    } catch (err: any) {
      console.error("[Insights] Dashboard error:", err);
      return res.status(500).json({ message: "Failed to fetch insights dashboard" });
    }
  });

  app.get("/api/insights/reports", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const orgId = resolveOrgIdParam(req);
      if (!orgId) return res.status(403).json({ message: "Access denied: cannot view that organization" });

      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const allLeads = await storage.getWarehouseLeads(orgId, {
        createdAfter: thirtyDaysAgo,
      });
      const metrics = await storage.getWarehouseMetrics(orgId, {});

      const totalLeads = allLeads.length;
      const soldCount = allLeads.filter(l => isSoldLead(l.vinStatus)).length;
      const lostCount = allLeads.filter(l => isLostLead(l.vinStatus)).length;
      const badCount = allLeads.filter(l => isBadLead(l.vinStatus)).length;

      const sourceCounts: Record<string, { total: number; won: number; lost: number }> = {};
      allLeads.forEach(l => {
        const src = l.leadSource || "Unknown";
        if (!sourceCounts[src]) sourceCounts[src] = { total: 0, won: 0, lost: 0 };
        sourceCounts[src].total++;
        if (isSoldLead(l.vinStatus)) sourceCounts[src].won++;
        if (isLostLead(l.vinStatus)) sourceCounts[src].lost++;
      });

      const sourceQualityTrends = Object.entries(sourceCounts)
        .sort(([, a], [, b]) => b.total - a.total)
        .slice(0, 10)
        .map(([source, data]) => ({
          source, leads: data.total,
          winRate: data.total > 0 ? Math.round((data.won / data.total) * 100) : 0,
          lossRate: data.total > 0 ? Math.round((data.lost / data.total) * 100) : 0,
        }));

      const metricsMap: Record<string, string> = {};
      metrics.forEach(m => { metricsMap[m.metricKey] = m.metricValue; });

      return res.json({
        lossAnalysis: {
          totalLost: lostCount, totalBad: badCount,
          lossRate: totalLeads > 0 ? Math.round((lostCount / totalLeads) * 100) : 0,
          badRate: totalLeads > 0 ? Math.round((badCount / totalLeads) * 100) : 0,
        },
        sourceQualityTrends,
        performanceSummary: {
          totalLeads, sold: soldCount, lost: lostCount, bad: badCount,
          winRate: totalLeads > 0 ? Math.round((soldCount / totalLeads) * 1000) / 10 : 0,
          metricsFromWarehouse: metricsMap,
        },
      });
    } catch (err: any) {
      console.error("[Insights] Reports error:", err);
      return res.status(500).json({ message: "Failed to fetch insights reports" });
    }
  });

  app.get("/api/insights/library/:metricId/detail", authenticateToken, async (req, res) => {
    try {
      const orgId = resolveOrgIdParam(req);
      if (!orgId) return res.status(403).json({ message: "Forbidden" });

      const metricId = req.params.metricId;
      const lookbackDays = parseInt(req.query.lookbackDays as string) || 30;
      const createdAfter = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);
      const now = new Date();

      const allLeads = await storage.getWarehouseLeads(orgId, { createdAfter });

      type Row = { label: string; value: string; detail?: string };
      let rows: Row[] = [];
      let insight: string | null = null;

      const daysBetween = (a: Date, b: Date) => Math.max(0, Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));

      switch (metricId) {
        case "lib-1": {
          const statusBuckets: Record<string, { count: number; totalAge: number }> = {
            NEW: { count: 0, totalAge: 0 },
            ACTIVE: { count: 0, totalAge: 0 },
            HOT: { count: 0, totalAge: 0 },
            PENDING: { count: 0, totalAge: 0 },
            WAITING: { count: 0, totalAge: 0 },
          };
          for (const lead of allLeads) {
            const s = (lead.vinStatus || "").toUpperCase();
            const age = lead.vinCreatedAt ? daysBetween(new Date(lead.vinCreatedAt), now) : 0;
            if (isNewLead(lead.vinStatus)) { statusBuckets.NEW.count++; statusBuckets.NEW.totalAge += age; }
            else if (s.includes("HOT") || s === "HOT") { statusBuckets.HOT.count++; statusBuckets.HOT.totalAge += age; }
            else if (isActiveLead(lead.vinStatus)) { statusBuckets.ACTIVE.count++; statusBuckets.ACTIVE.totalAge += age; }
          }
          for (const [label, data] of Object.entries(statusBuckets)) {
            if (data.count > 0) {
              const avgAge = Math.round(data.totalAge / data.count);
              rows.push({ label, value: `${data.count}`, detail: `Avg age: ${avgAge} days` });
            }
          }
          const totalActive = rows.reduce((s, r) => s + parseInt(r.value), 0);
          const largest = rows.length > 0 ? rows.reduce((a, b) => parseInt(a.value) > parseInt(b.value) ? a : b) : null;
          insight = largest ? `${largest.label} leads make up the largest segment with ${largest.value} of ${totalActive} active pipeline leads.` : null;
          break;
        }

        case "lib-2": {
          const sourceMap: Record<string, { count: number; sold: number; lost: number }> = {};
          const newLeads = allLeads.filter(l => isNewLead(l.vinStatus) || l.vinCreatedAt && new Date(l.vinCreatedAt) >= createdAfter);
          for (const lead of newLeads) {
            const src = lead.leadSource || "Unknown";
            if (!sourceMap[src]) sourceMap[src] = { count: 0, sold: 0, lost: 0 };
            sourceMap[src].count++;
            if (isSoldLead(lead.vinStatus)) sourceMap[src].sold++;
            if (isLostLead(lead.vinStatus)) sourceMap[src].lost++;
          }
          const sorted = Object.entries(sourceMap).sort((a, b) => b[1].count - a[1].count);
          for (const [src, data] of sorted) {
            const winRate = data.count > 0 ? Math.round((data.sold / data.count) * 100) : 0;
            rows.push({ label: src, value: `${data.count}`, detail: `Win rate: ${winRate}%` });
          }
          const totalNew = newLeads.length;
          const dailyAvg = lookbackDays > 0 ? Math.round(totalNew / lookbackDays * 10) / 10 : 0;
          insight = `Average daily new lead volume is ${dailyAvg} leads/day across ${sorted.length} sources over the last ${lookbackDays} days.`;
          break;
        }

        case "lib-5": {
          const thisWeekStart = new Date(now);
          thisWeekStart.setDate(now.getDate() - now.getDay());
          thisWeekStart.setHours(0, 0, 0, 0);
          const lastWeekStart = new Date(thisWeekStart);
          lastWeekStart.setDate(lastWeekStart.getDate() - 7);

          const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
          const thisWeekCounts = new Array(7).fill(0);
          const lastWeekCounts = new Array(7).fill(0);

          for (const lead of allLeads) {
            const created = lead.vinCreatedAt ? new Date(lead.vinCreatedAt) : new Date(lead.createdAt);
            if (created >= thisWeekStart) {
              thisWeekCounts[created.getDay()]++;
            } else if (created >= lastWeekStart && created < thisWeekStart) {
              lastWeekCounts[created.getDay()]++;
            }
          }

          for (let i = 0; i < 7; i++) {
            rows.push({ label: dayNames[i], value: `${thisWeekCounts[i]}`, detail: `Last week: ${lastWeekCounts[i]}` });
          }

          const thisTotal = thisWeekCounts.reduce((a, b) => a + b, 0);
          const lastTotal = lastWeekCounts.reduce((a, b) => a + b, 0);
          const velocityChange = lastTotal > 0 ? Math.round(((thisTotal - lastTotal) / lastTotal) * 100) : 0;
          insight = `Lead velocity is ${velocityChange >= 0 ? "up" : "down"} ${Math.abs(velocityChange)}% this week (${thisTotal}) compared to last week (${lastTotal}).`;
          break;
        }

        case "lib-8": {
          const monthMap: Record<string, { sold: number; lost: number; total: number }> = {};
          for (const lead of allLeads) {
            if (!isSoldLead(lead.vinStatus) && !isLostLead(lead.vinStatus)) continue;
            const d = lead.vinUpdatedAt ? new Date(lead.vinUpdatedAt) : new Date(lead.createdAt);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            if (!monthMap[key]) monthMap[key] = { sold: 0, lost: 0, total: 0 };
            monthMap[key].total++;
            if (isSoldLead(lead.vinStatus)) monthMap[key].sold++;
            if (isLostLead(lead.vinStatus)) monthMap[key].lost++;
          }
          const months = Object.keys(monthMap).sort();
          for (const m of months) {
            const d = monthMap[m];
            const wr = d.total > 0 ? Math.round((d.sold / d.total) * 100) : 0;
            rows.push({ label: m, value: `${wr}%`, detail: `Sold: ${d.sold}, Lost: ${d.lost}` });
          }
          const totalSold = allLeads.filter(l => isSoldLead(l.vinStatus)).length;
          const totalLost = allLeads.filter(l => isLostLead(l.vinStatus)).length;
          const overallWr = (totalSold + totalLost) > 0 ? Math.round((totalSold / (totalSold + totalLost)) * 100) : 0;
          insight = `Overall win rate is ${overallWr}% with ${totalSold} sold and ${totalLost} lost across ${months.length} months.`;
          break;
        }

        case "lib-10": {
          const walkIns = allLeads.filter(l => {
            const src = (l.leadSource || "").toLowerCase();
            return src.includes("walk") || src.includes("showroom") || src.includes("floor");
          });
          const walkSold = walkIns.filter(l => isSoldLead(l.vinStatus)).length;
          const walkLost = walkIns.filter(l => isLostLead(l.vinStatus)).length;
          const walkActive = walkIns.filter(l => isActiveLead(l.vinStatus) || isNewLead(l.vinStatus)).length;
          const closeRate = walkIns.length > 0 ? Math.round((walkSold / walkIns.length) * 100) : 0;
          rows.push({ label: "Total Walk-Ins", value: `${walkIns.length}`, detail: `${lookbackDays}-day period` });
          rows.push({ label: "Sold", value: `${walkSold}`, detail: `Close rate: ${closeRate}%` });
          rows.push({ label: "Lost", value: `${walkLost}` });
          rows.push({ label: "Still Active", value: `${walkActive}` });
          const withTrade = walkIns.filter(l => {
            const v = (l.vehicleOfInterest || "").toLowerCase();
            return v.includes("trade");
          }).length;
          if (withTrade > 0) {
            rows.push({ label: "With Trade-In", value: `${withTrade}`, detail: `${Math.round((withTrade / walkIns.length) * 100)}% of walk-ins` });
          }
          insight = walkIns.length > 0 ? `Walk-in close rate is ${closeRate}% from ${walkIns.length} walk-in leads over ${lookbackDays} days.` : "No walk-in leads found in the selected period.";
          break;
        }

        case "lib-12": {
          const hotLeads = allLeads.filter(l => {
            const s = (l.vinStatus || "").toUpperCase();
            return s.includes("HOT") || s === "HOT";
          });
          const hotSold = hotLeads.filter(l => isSoldLead(l.vinStatus));
          const hotLost = hotLeads.filter(l => isLostLead(l.vinStatus));
          const hotActive = hotLeads.filter(l => isActiveLead(l.vinStatus) || isNewLead(l.vinStatus));
          rows.push({ label: "Total HOT Leads", value: `${hotLeads.length}` });
          rows.push({ label: "Converted (Sold)", value: `${hotSold.length}`, detail: hotLeads.length > 0 ? `${Math.round((hotSold.length / hotLeads.length) * 100)}% conversion` : "0%" });
          rows.push({ label: "Lost", value: `${hotLost.length}` });
          rows.push({ label: "Still Active", value: `${hotActive.length}` });
          if (hotSold.length > 0) {
            const avgCloseTime = hotSold.reduce((sum, l) => {
              const created = l.vinCreatedAt ? new Date(l.vinCreatedAt) : new Date(l.createdAt);
              const closed = l.vinUpdatedAt ? new Date(l.vinUpdatedAt) : now;
              return sum + daysBetween(created, closed);
            }, 0) / hotSold.length;
            rows.push({ label: "Avg Time to Close", value: `${Math.round(avgCloseTime)} days` });
          }
          const convRate = hotLeads.length > 0 ? Math.round((hotSold.length / hotLeads.length) * 100) : 0;
          insight = hotLeads.length > 0 ? `HOT lead conversion rate is ${convRate}% with an average close cycle, ${hotActive.length} still active in pipeline.` : "No HOT leads found in the selected period.";
          break;
        }

        case "lib-16": {
          const contacted1hr = allLeads.filter(l => {
            if (!l.vinCreatedAt || !l.vinUpdatedAt) return false;
            const diff = new Date(l.vinUpdatedAt).getTime() - new Date(l.vinCreatedAt).getTime();
            return diff > 0 && diff <= 3600000;
          }).length;
          const contacted4hr = allLeads.filter(l => {
            if (!l.vinCreatedAt || !l.vinUpdatedAt) return false;
            const diff = new Date(l.vinUpdatedAt).getTime() - new Date(l.vinCreatedAt).getTime();
            return diff > 3600000 && diff <= 14400000;
          }).length;
          const contacted24hr = allLeads.filter(l => {
            if (!l.vinCreatedAt || !l.vinUpdatedAt) return false;
            const diff = new Date(l.vinUpdatedAt).getTime() - new Date(l.vinCreatedAt).getTime();
            return diff > 14400000 && diff <= 86400000;
          }).length;
          const neverContacted = allLeads.filter(l => !l.vinUpdatedAt || (l.vinCreatedAt && l.vinUpdatedAt && new Date(l.vinUpdatedAt).getTime() === new Date(l.vinCreatedAt).getTime())).length;
          const total = allLeads.length;
          rows.push({ label: "Within 1 hour", value: `${contacted1hr}`, detail: total > 0 ? `${Math.round((contacted1hr / total) * 100)}%` : "0%" });
          rows.push({ label: "1-4 hours", value: `${contacted4hr}`, detail: total > 0 ? `${Math.round((contacted4hr / total) * 100)}%` : "0%" });
          rows.push({ label: "4-24 hours", value: `${contacted24hr}`, detail: total > 0 ? `${Math.round((contacted24hr / total) * 100)}%` : "0%" });
          rows.push({ label: "Never / No Update", value: `${neverContacted}`, detail: total > 0 ? `${Math.round((neverContacted / total) * 100)}%` : "0%" });
          const contactRate = total > 0 ? Math.round(((total - neverContacted) / total) * 100) : 0;
          insight = `${contactRate}% of leads received contact, with ${contacted1hr} contacted within the first hour.`;
          break;
        }

        case "lib-21": {
          const sourceContactTimes: Record<string, { totalMinutes: number; count: number }> = {};
          for (const lead of allLeads) {
            if (!lead.vinCreatedAt || !lead.vinUpdatedAt) continue;
            const diff = new Date(lead.vinUpdatedAt).getTime() - new Date(lead.vinCreatedAt).getTime();
            if (diff <= 0) continue;
            const src = lead.leadSource || "Unknown";
            if (!sourceContactTimes[src]) sourceContactTimes[src] = { totalMinutes: 0, count: 0 };
            sourceContactTimes[src].totalMinutes += diff / 60000;
            sourceContactTimes[src].count++;
          }
          const sorted = Object.entries(sourceContactTimes).sort((a, b) => {
            const avgA = a[1].totalMinutes / a[1].count;
            const avgB = b[1].totalMinutes / b[1].count;
            return avgA - avgB;
          });
          for (const [src, data] of sorted) {
            const avgMin = Math.round(data.totalMinutes / data.count);
            const hrs = Math.floor(avgMin / 60);
            const mins = avgMin % 60;
            const timeStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
            rows.push({ label: src, value: timeStr, detail: `${data.count} leads` });
          }
          const fastest = sorted.length > 0 ? sorted[0] : null;
          insight = fastest ? `${fastest[0]} has the fastest average first contact time at ${rows[0]?.value}.` : "No contact time data available.";
          break;
        }

        case "lib-22": {
          const sourceStats: Record<string, { count: number; sold: number; lost: number; active: number }> = {};
          for (const lead of allLeads) {
            const src = lead.leadSource || "Unknown";
            if (!sourceStats[src]) sourceStats[src] = { count: 0, sold: 0, lost: 0, active: 0 };
            sourceStats[src].count++;
            if (isSoldLead(lead.vinStatus)) sourceStats[src].sold++;
            if (isLostLead(lead.vinStatus)) sourceStats[src].lost++;
            if (isActiveLead(lead.vinStatus) || isNewLead(lead.vinStatus)) sourceStats[src].active++;
          }
          const sorted = Object.entries(sourceStats).sort((a, b) => b[1].count - a[1].count);
          for (const [src, data] of sorted) {
            const winRate = data.count > 0 ? Math.round((data.sold / data.count) * 100) : 0;
            const lossRate = data.count > 0 ? Math.round((data.lost / data.count) * 100) : 0;
            rows.push({ label: src, value: `${data.count} leads`, detail: `Win: ${winRate}%, Loss: ${lossRate}%` });
          }
          const topSource = sorted.length > 0 ? sorted[0] : null;
          insight = topSource ? `${topSource[0]} is the top source with ${topSource[1].count} leads and a ${topSource[1].count > 0 ? Math.round((topSource[1].sold / topSource[1].count) * 100) : 0}% win rate.` : "No lead source data available.";
          break;
        }

        case "lib-27": {
          const digitalSources = ["internet", "web", "website", "online", "email", "chat", "social", "facebook", "instagram", "google", "cargurus", "autotrader", "cars.com", "truecar", "digital"];
          const physicalSources = ["walk", "showroom", "floor", "phone", "referral", "repeat", "service"];

          let digitalCount = 0;
          let physicalCount = 0;
          let otherCount = 0;
          const digitalSubs: Record<string, number> = {};
          const physicalSubs: Record<string, number> = {};

          for (const lead of allLeads) {
            const src = (lead.leadSource || "unknown").toLowerCase();
            const isDigital = digitalSources.some(d => src.includes(d));
            const isPhysical = physicalSources.some(p => src.includes(p));
            if (isDigital) {
              digitalCount++;
              const key = lead.leadSource || "Unknown";
              digitalSubs[key] = (digitalSubs[key] || 0) + 1;
            } else if (isPhysical) {
              physicalCount++;
              const key = lead.leadSource || "Unknown";
              physicalSubs[key] = (physicalSubs[key] || 0) + 1;
            } else {
              otherCount++;
            }
          }

          const total = allLeads.length;
          const digitalPct = total > 0 ? Math.round((digitalCount / total) * 100) : 0;
          const physicalPct = total > 0 ? Math.round((physicalCount / total) * 100) : 0;

          rows.push({ label: "Digital Leads", value: `${digitalCount}`, detail: `${digitalPct}% of total` });
          for (const [sub, cnt] of Object.entries(digitalSubs).sort((a, b) => b[1] - a[1]).slice(0, 5)) {
            rows.push({ label: `  ${sub}`, value: `${cnt}` });
          }
          rows.push({ label: "Physical Leads", value: `${physicalCount}`, detail: `${physicalPct}% of total` });
          for (const [sub, cnt] of Object.entries(physicalSubs).sort((a, b) => b[1] - a[1]).slice(0, 5)) {
            rows.push({ label: `  ${sub}`, value: `${cnt}` });
          }
          if (otherCount > 0) {
            rows.push({ label: "Other/Uncategorized", value: `${otherCount}`, detail: `${total > 0 ? Math.round((otherCount / total) * 100) : 0}%` });
          }
          insight = `Digital leads account for ${digitalPct}% of the pipeline (${digitalCount} of ${total} total leads).`;
          break;
        }

        case "lib-31": {
          const soldLeads = allLeads.filter(l => isSoldLead(l.vinStatus));
          const weekMap: Record<string, number> = {};
          for (const lead of soldLeads) {
            const d = lead.vinUpdatedAt ? new Date(lead.vinUpdatedAt) : new Date(lead.createdAt);
            const weekStart = new Date(d);
            weekStart.setDate(d.getDate() - d.getDay());
            const key = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
            weekMap[key] = (weekMap[key] || 0) + 1;
          }
          const weeks = Object.entries(weekMap).sort((a, b) => {
            return a[0].localeCompare(b[0]);
          });
          for (const [week, count] of weeks) {
            const dailyAvg = Math.round((count / 7) * 10) / 10;
            rows.push({ label: `Week of ${week}`, value: `${count} sales`, detail: `${dailyAvg}/day avg` });
          }
          const totalSales = soldLeads.length;
          const overallDailyAvg = lookbackDays > 0 ? Math.round((totalSales / lookbackDays) * 10) / 10 : 0;
          insight = `${totalSales} total sales over ${lookbackDays} days, averaging ${overallDailyAvg} sales per day across ${weeks.length} weeks.`;
          break;
        }

        case "lib-33": {
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
          const dayOfMonth = now.getDate();

          const mtdSold = allLeads.filter(l => {
            if (!isSoldLead(l.vinStatus)) return false;
            const d = l.vinUpdatedAt ? new Date(l.vinUpdatedAt) : new Date(l.createdAt);
            return d >= monthStart;
          }).length;

          const projectedTotal = dayOfMonth > 0 ? Math.round((mtdSold / dayOfMonth) * daysInMonth) : 0;
          const activePipeline = allLeads.filter(l => isActiveLead(l.vinStatus) || isNewLead(l.vinStatus)).length;
          const daysRemaining = daysInMonth - dayOfMonth;

          rows.push({ label: "MTD Sales", value: `${mtdSold}`, detail: `Day ${dayOfMonth} of ${daysInMonth}` });
          rows.push({ label: "Projected Month Total", value: `${projectedTotal}`, detail: `Based on current pace` });
          rows.push({ label: "Active Pipeline Support", value: `${activePipeline}`, detail: `Leads still workable` });
          rows.push({ label: "Days Remaining", value: `${daysRemaining}` });
          rows.push({ label: "Needed Daily Pace", value: `${daysRemaining > 0 ? Math.round(((projectedTotal - mtdSold) / daysRemaining) * 10) / 10 : 0}`, detail: "Sales/day to hit projection" });

          insight = `On pace for ${projectedTotal} sales this month with ${mtdSold} sold through day ${dayOfMonth} and ${activePipeline} active pipeline leads remaining.`;
          break;
        }

        default: {
          return res.json({
            metricId,
            rows: [],
            insight: null,
            note: "Detailed drill-down not yet available for this metric",
          });
        }
      }

      return res.json({ metricId, rows, insight });
    } catch (err: any) {
      console.error("[Insights] Library detail error:", err);
      return res.status(500).json({ message: "Failed to fetch library metric detail" });
    }
  });

  app.get("/api/insights/library", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const orgId = resolveOrgIdParam(req);
      if (!orgId) return res.status(403).json({ message: "Access denied: cannot view that organization" });

      const lookbackDays = parseInt(req.query.lookbackDays as string) || 30;
      const now = new Date();
      const periodStart = new Date(now);
      periodStart.setDate(periodStart.getDate() - lookbackDays);
      const priorStart = new Date(periodStart);
      priorStart.setDate(priorStart.getDate() - lookbackDays);

      const [allLeads, priorLeads, allOrgConversations] = await Promise.all([
        storage.getWarehouseLeads(orgId, { createdAfter: periodStart }),
        storage.getWarehouseLeads(orgId, { createdAfter: priorStart }),
        storage.getConversations(orgId),
      ]);

      const priorOnlyLeads = priorLeads.filter(l => {
        const created = l.vinCreatedAt ? new Date(l.vinCreatedAt) : new Date(l.createdAt);
        return created < periodStart;
      });

      const totalLeads = allLeads.length;
      const priorTotal = priorOnlyLeads.length;

      const activeLeads = allLeads.filter(l => isActiveLead(l.vinStatus));
      const priorActiveLeads = priorOnlyLeads.filter(l => isActiveLead(l.vinStatus));
      const newLeads = allLeads.filter(l => isNewLead(l.vinStatus));
      const soldLeads = allLeads.filter(l => isSoldLead(l.vinStatus));
      const priorSoldLeads = priorOnlyLeads.filter(l => isSoldLead(l.vinStatus));
      const lostLeads = allLeads.filter(l => isLostLead(l.vinStatus));
      const priorLostLeads = priorOnlyLeads.filter(l => isLostLead(l.vinStatus));
      const badLeads = allLeads.filter(l => isBadLead(l.vinStatus));
      const priorBadLeads = priorOnlyLeads.filter(l => isBadLead(l.vinStatus));

      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const leadsCreatedToday = allLeads.filter(l => {
        const created = l.vinCreatedAt ? new Date(l.vinCreatedAt) : new Date(l.createdAt);
        return created >= todayStart && isNewLead(l.vinStatus);
      });

      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const leadsLast7Days = allLeads.filter(l => {
        const created = l.vinCreatedAt ? new Date(l.vinCreatedAt) : new Date(l.createdAt);
        return created >= sevenDaysAgo;
      });

      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      const thisMonthLeads = allLeads.filter(l => {
        const created = l.vinCreatedAt ? new Date(l.vinCreatedAt) : new Date(l.createdAt);
        return created >= thisMonthStart;
      });
      const lastMonthLeads = [...allLeads, ...priorOnlyLeads].filter(l => {
        const created = l.vinCreatedAt ? new Date(l.vinCreatedAt) : new Date(l.createdAt);
        return created >= lastMonthStart && created <= lastMonthEnd;
      });

      const stagnantLeads = activeLeads.filter(l => {
        const updated = l.vinUpdatedAt ? new Date(l.vinUpdatedAt) : new Date(l.createdAt);
        return (now.getTime() - updated.getTime()) > 7 * 24 * 60 * 60 * 1000;
      });
      const priorStagnantLeads = priorActiveLeads.filter(l => {
        const updated = l.vinUpdatedAt ? new Date(l.vinUpdatedAt) : new Date(l.createdAt);
        return (periodStart.getTime() - updated.getTime()) > 7 * 24 * 60 * 60 * 1000;
      });

      const freshLeads = activeLeads.filter(l => {
        const created = l.vinCreatedAt ? new Date(l.vinCreatedAt) : new Date(l.createdAt);
        return created >= sevenDaysAgo;
      });

      const isInternetSource = (src: string | null) => {
        if (!src) return false;
        const lower = src.toLowerCase();
        return lower.includes("internet") || lower.includes("web") || lower.includes("online") || lower.includes("autotrader") || lower.includes("cars.com") || lower.includes("cargurus") || lower.includes("digital") || lower.includes("email");
      };
      const isWalkInSource = (src: string | null) => {
        if (!src) return false;
        const lower = src.toLowerCase();
        return lower.includes("walk") || lower.includes("showroom") || lower.includes("floor");
      };
      const isServiceSource = (src: string | null) => {
        if (!src) return false;
        return src.toLowerCase().includes("service");
      };
      const isHotLead = (status: string | null) => {
        if (!status) return false;
        return status === "hot" || status === "ACTIVE_ACTIVE_LEAD" || status.toLowerCase().includes("hot");
      };
      const isShowroomSource = (src: string | null) => {
        if (!src) return false;
        const lower = src.toLowerCase();
        return lower.includes("showroom") || lower.includes("floor");
      };
      const isDigitalSource = (src: string | null) => {
        if (!src) return false;
        const lower = src.toLowerCase();
        return lower.includes("web") || lower.includes("internet") || lower.includes("online") || lower.includes("autotrader") || lower.includes("cars.com") || lower.includes("cargurus") || lower.includes("digital") || lower.includes("email") || lower.includes("facebook") || lower.includes("social");
      };
      const isPhoneSource = (src: string | null) => {
        if (!src) return false;
        return src.toLowerCase().includes("phone") || src.toLowerCase().includes("call");
      };
      const isReferralSource = (src: string | null) => {
        if (!src) return false;
        return src.toLowerCase().includes("referral") || src.toLowerCase().includes("refer");
      };

      const internetLeads = allLeads.filter(l => isInternetSource(l.leadSource));
      const internetSold = internetLeads.filter(l => isSoldLead(l.vinStatus));
      const priorInternetLeads = priorOnlyLeads.filter(l => isInternetSource(l.leadSource));
      const priorInternetSold = priorInternetLeads.filter(l => isSoldLead(l.vinStatus));

      const walkInLeads = allLeads.filter(l => isWalkInSource(l.leadSource));
      const walkInSold = walkInLeads.filter(l => isSoldLead(l.vinStatus));
      const priorWalkInLeads = priorOnlyLeads.filter(l => isWalkInSource(l.leadSource));
      const priorWalkInSold = priorWalkInLeads.filter(l => isSoldLead(l.vinStatus));

      const serviceLeads = allLeads.filter(l => isServiceSource(l.leadSource));
      const serviceSold = serviceLeads.filter(l => isSoldLead(l.vinStatus));

      const hotLeads = allLeads.filter(l => isHotLead(l.vinStatus));
      const hotSold = hotLeads.filter(l => isSoldLead(l.vinStatus));
      const priorHotLeads = priorOnlyLeads.filter(l => isHotLead(l.vinStatus));
      const priorHotSold = priorHotLeads.filter(l => isSoldLead(l.vinStatus));

      const showroomLeads = allLeads.filter(l => isShowroomSource(l.leadSource));
      const showroomSold = showroomLeads.filter(l => isSoldLead(l.vinStatus));
      const priorShowroomLeads = priorOnlyLeads.filter(l => isShowroomSource(l.leadSource));
      const priorShowroomSold = priorShowroomLeads.filter(l => isSoldLead(l.vinStatus));

      const contactedLeads = allLeads.filter(l => {
        return allOrgConversations.some(c =>
          (l.customerPhone && c.customerPhone && c.customerPhone.replace(/[^0-9]/g, "").includes(l.customerPhone.replace(/[^0-9]/g, "").slice(-10))) ||
          (l.customerEmail && c.customerEmail && c.customerEmail.toLowerCase() === l.customerEmail.toLowerCase())
        );
      });

      const newLeadAges = newLeads.map(l => {
        const created = l.vinCreatedAt ? new Date(l.vinCreatedAt) : new Date(l.createdAt);
        return (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      });
      const avgNewLeadAge = newLeadAges.length > 0 ? newLeadAges.reduce((a, b) => a + b, 0) / newLeadAges.length : 0;

      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const newLeadsOver24h = newLeads.filter(l => {
        const created = l.vinCreatedAt ? new Date(l.vinCreatedAt) : new Date(l.createdAt);
        return created < twentyFourHoursAgo;
      });
      const responseGap = newLeadsOver24h.filter(l => {
        return !allOrgConversations.some(c =>
          (l.customerPhone && c.customerPhone && c.customerPhone.replace(/[^0-9]/g, "").includes(l.customerPhone.replace(/[^0-9]/g, "").slice(-10))) ||
          (l.customerEmail && c.customerEmail && c.customerEmail.toLowerCase() === l.customerEmail?.toLowerCase())
        );
      });

      const waitingLeads = allLeads.filter(l => {
        if (!l.vinStatus) return false;
        const lower = l.vinStatus.toLowerCase();
        return lower.includes("waiting") || lower.includes("stale");
      });

      const engagementTransition = allLeads.filter(l => {
        return isActiveLead(l.vinStatus) && l.vinCreatedAt && l.vinUpdatedAt &&
          new Date(l.vinUpdatedAt).getTime() > new Date(l.vinCreatedAt).getTime();
      });

      const sourceCounts: Record<string, number> = {};
      allLeads.forEach(l => {
        const src = l.leadSource || "Unknown";
        sourceCounts[src] = (sourceCounts[src] || 0) + 1;
      });
      const sourceEntries = Object.entries(sourceCounts).sort(([, a], [, b]) => b - a);
      const topSourceName = sourceEntries.length > 0 ? sourceEntries[0][0] : "N/A";
      const topSourceCount = sourceEntries.length > 0 ? sourceEntries[0][1] : 0;
      const topSourcePct = totalLeads > 0 ? Math.round((topSourceCount / totalLeads) * 100) : 0;

      const sourceWinRates: Record<string, { total: number; won: number }> = {};
      allLeads.forEach(l => {
        const src = l.leadSource || "Unknown";
        if (!sourceWinRates[src]) sourceWinRates[src] = { total: 0, won: 0 };
        sourceWinRates[src].total++;
        if (isSoldLead(l.vinStatus)) sourceWinRates[src].won++;
      });
      const topSourceWR = sourceWinRates[topSourceName];
      const topSourceWinRate = topSourceWR && topSourceWR.total > 0 ? Math.round((topSourceWR.won / topSourceWR.total) * 100) : 0;

      let hhi = 0;
      if (totalLeads > 0) {
        Object.values(sourceCounts).forEach(cnt => {
          const share = cnt / totalLeads;
          hhi += share * share;
        });
      }
      const sourceDiversity = Math.round((1 - hhi) * 100) / 100;

      let sourceQualityScore = 0;
      if (totalLeads > 0) {
        let weightedSum = 0;
        Object.entries(sourceWinRates).forEach(([, data]) => {
          const weight = data.total / totalLeads;
          const wr = data.total > 0 ? data.won / data.total : 0;
          weightedSum += weight * wr;
        });
        sourceQualityScore = Math.round(weightedSum * 100);
      }

      const digitalLeads = allLeads.filter(l => isDigitalSource(l.leadSource));
      const priorDigitalLeads = priorOnlyLeads.filter(l => isDigitalSource(l.leadSource));
      const digitalSold = digitalLeads.filter(l => isSoldLead(l.vinStatus));

      const phoneLeads = allLeads.filter(l => isPhoneSource(l.leadSource));
      const referralLeads = allLeads.filter(l => isReferralSource(l.leadSource));

      const countWeekdays = (start: Date, end: Date): number => {
        let cnt = 0;
        const d = new Date(start);
        while (d <= end) {
          const day = d.getDay();
          if (day !== 0 && day !== 6) cnt++;
          d.setDate(d.getDate() + 1);
        }
        return Math.max(cnt, 1);
      };

      const businessDaysInPeriod = countWeekdays(periodStart, now);
      const salesVelocity = soldLeads.length / businessDaysInPeriod;
      const priorBusinessDays = countWeekdays(priorStart, periodStart);
      const priorSalesVelocity = priorSoldLeads.length / priorBusinessDays;

      const digitalPct = totalLeads > 0 ? (digitalLeads.length / totalLeads) * 100 : 0;
      const digitalWinRate = digitalLeads.length > 0 ? (digitalSold.length / digitalLeads.length) * 100 : 0;
      const responseScore = contactedLeads.length > 0 && totalLeads > 0 ? (contactedLeads.length / totalLeads) * 100 : 0;
      const digitalMaturity = Math.round((digitalPct * 0.4 + digitalWinRate * 0.3 + Math.min(responseScore, 100) * 0.3));

      const priorDigitalPct = priorTotal > 0 ? (priorDigitalLeads.length / priorTotal) * 100 : 0;
      const priorDigitalSold = priorDigitalLeads.filter(l => isSoldLead(l.vinStatus));
      const priorDigitalWinRate = priorDigitalLeads.length > 0 ? (priorDigitalSold.length / priorDigitalLeads.length) * 100 : 0;
      const priorContactedLeads = priorOnlyLeads.filter(l => {
        return allOrgConversations.some(c =>
          (l.customerPhone && c.customerPhone && c.customerPhone.replace(/[^0-9]/g, "").includes(l.customerPhone.replace(/[^0-9]/g, "").slice(-10))) ||
          (l.customerEmail && c.customerEmail && c.customerEmail.toLowerCase() === l.customerEmail?.toLowerCase())
        );
      });
      const priorResponseScore = priorContactedLeads.length > 0 && priorTotal > 0 ? (priorContactedLeads.length / priorTotal) * 100 : 0;
      const priorDigitalMaturity = Math.round((priorDigitalPct * 0.4 + priorDigitalWinRate * 0.3 + Math.min(priorResponseScore, 100) * 0.3));

      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const businessDaysElapsed = countWeekdays(monthStart, now);
      const totalBusinessDaysInMonth = countWeekdays(monthStart, monthEnd);
      const soldThisMonth = allLeads.filter(l => {
        if (!isSoldLead(l.vinStatus)) return false;
        const updated = l.vinUpdatedAt ? new Date(l.vinUpdatedAt) : new Date(l.createdAt);
        return updated >= monthStart;
      });
      const projectedClose = businessDaysElapsed > 0
        ? Math.round((soldThisMonth.length / businessDaysElapsed) * totalBusinessDaysInMonth)
        : 0;

      const pipelineCoverage = projectedClose > 0
        ? Math.round((activeLeads.length / projectedClose) * 100) / 100
        : activeLeads.length > 0 ? 999 : 0;

      const computeChange = (current: number, prior: number): { change: string; trend: 'up' | 'down' | 'neutral' } => {
        if (prior === 0 && current === 0) return { change: "\u2014", trend: "neutral" };
        if (prior === 0) return { change: `+${current}`, trend: "up" };
        const pctChange = Math.round(((current - prior) / prior) * 100);
        if (pctChange > 0) return { change: `+${pctChange}%`, trend: "up" };
        if (pctChange < 0) return { change: `${pctChange}%`, trend: "down" };
        return { change: "0%", trend: "neutral" };
      };

      const computeRateChange = (curNum: number, curDen: number, priorNum: number, priorDen: number): { change: string; trend: 'up' | 'down' | 'neutral' } => {
        const curRate = curDen > 0 ? (curNum / curDen) * 100 : 0;
        const priorRate = priorDen > 0 ? (priorNum / priorDen) * 100 : 0;
        if (priorDen === 0) return { change: "\u2014", trend: "neutral" };
        const diff = Math.round(curRate - priorRate);
        if (diff > 0) return { change: `+${diff}pp`, trend: "up" };
        if (diff < 0) return { change: `${diff}pp`, trend: "down" };
        return { change: "0pp", trend: "neutral" };
      };

      const weeklyTrend = leadsLast7Days.length / 7;
      const priorSevenStart = new Date(sevenDaysAgo);
      priorSevenStart.setDate(priorSevenStart.getDate() - 7);
      const priorWeekLeads = [...allLeads, ...priorOnlyLeads].filter(l => {
        const created = l.vinCreatedAt ? new Date(l.vinCreatedAt) : new Date(l.createdAt);
        return created >= priorSevenStart && created < sevenDaysAgo;
      });
      const priorWeeklyTrend = priorWeekLeads.length / 7;

      const momGrowth = lastMonthLeads.length > 0
        ? Math.round(((thisMonthLeads.length - lastMonthLeads.length) / lastMonthLeads.length) * 100)
        : 0;

      const leadVelocity = totalLeads / Math.max(lookbackDays, 1);
      const priorLeadVelocity = priorTotal / Math.max(lookbackDays, 1);

      const freshRatio = activeLeads.length > 0
        ? Math.round((freshLeads.length / activeLeads.length) * 100)
        : 0;
      const priorFreshLeads = priorActiveLeads.filter(l => {
        const created = l.vinCreatedAt ? new Date(l.vinCreatedAt) : new Date(l.createdAt);
        const priorSevenAgo = new Date(periodStart);
        priorSevenAgo.setDate(priorSevenAgo.getDate() - 7);
        return created >= priorSevenAgo;
      });
      const priorFreshRatio = priorActiveLeads.length > 0
        ? Math.round((priorFreshLeads.length / priorActiveLeads.length) * 100)
        : 0;

      const priorPhoneLeads = priorOnlyLeads.filter(l => isPhoneSource(l.leadSource));
      const priorReferralLeads = priorOnlyLeads.filter(l => isReferralSource(l.leadSource));
      const priorWalkInAll = priorOnlyLeads.filter(l => isWalkInSource(l.leadSource));

      const libMetrics: Array<{ id: string; title: string; value: string; change: string; trend: string; category: string }> = [];

      const c1 = computeChange(activeLeads.length, priorActiveLeads.length);
      libMetrics.push({ id: "lib-1", title: "Total Active Pipeline", value: String(activeLeads.length), change: c1.change, trend: c1.trend, category: "Pipeline" });

      libMetrics.push({ id: "lib-2", title: "Daily New Lead Volume", value: String(leadsCreatedToday.length), change: "\u2014", trend: "neutral", category: "Pipeline" });

      const c3 = computeChange(Math.round(weeklyTrend * 10) / 10, Math.round(priorWeeklyTrend * 10) / 10);
      libMetrics.push({ id: "lib-3", title: "Weekly Lead Trend", value: `${Math.round(weeklyTrend * 10) / 10}/day`, change: c3.change, trend: c3.trend, category: "Pipeline" });

      libMetrics.push({ id: "lib-4", title: "MoM Lead Growth", value: lastMonthLeads.length > 0 ? `${momGrowth}%` : "\u2014", change: "\u2014", trend: momGrowth > 0 ? "up" : momGrowth < 0 ? "down" : "neutral", category: "Pipeline" });

      const c5 = computeChange(Math.round(leadVelocity * 10) / 10, Math.round(priorLeadVelocity * 10) / 10);
      libMetrics.push({ id: "lib-5", title: "Lead Velocity Rate", value: `${Math.round(leadVelocity * 10) / 10}/day`, change: c5.change, trend: c5.trend, category: "Pipeline" });

      const c6 = computeChange(stagnantLeads.length, priorStagnantLeads.length);
      libMetrics.push({ id: "lib-6", title: "Pipeline Stagnation Index", value: String(stagnantLeads.length), change: c6.change, trend: stagnantLeads.length > priorStagnantLeads.length ? "down" : stagnantLeads.length < priorStagnantLeads.length ? "up" : "neutral", category: "Pipeline" });

      const c7 = computeChange(freshRatio, priorFreshRatio);
      libMetrics.push({ id: "lib-7", title: "Fresh Lead Ratio", value: `${freshRatio}%`, change: c7.change, trend: c7.trend, category: "Pipeline" });

      const winRate = totalLeads > 0 ? Math.round((soldLeads.length / totalLeads) * 1000) / 10 : 0;
      const c8 = computeRateChange(soldLeads.length, totalLeads, priorSoldLeads.length, priorTotal);
      libMetrics.push({ id: "lib-8", title: "Overall Win Rate", value: `${winRate}%`, change: c8.change, trend: c8.trend, category: "Conversion" });

      const internetCloseRate = internetLeads.length > 0 ? Math.round((internetSold.length / internetLeads.length) * 1000) / 10 : 0;
      const c9 = computeRateChange(internetSold.length, internetLeads.length, priorInternetSold.length, priorInternetLeads.length);
      libMetrics.push({ id: "lib-9", title: "Internet Close Rate", value: `${internetCloseRate}%`, change: c9.change, trend: c9.trend, category: "Conversion" });

      const walkInCloseRate = walkInLeads.length > 0 ? Math.round((walkInSold.length / walkInLeads.length) * 1000) / 10 : 0;
      const c10 = computeRateChange(walkInSold.length, walkInLeads.length, priorWalkInSold.length, priorWalkInLeads.length);
      libMetrics.push({ id: "lib-10", title: "Walk-In Close Rate", value: `${walkInCloseRate}%`, change: c10.change, trend: c10.trend, category: "Conversion" });

      if (serviceLeads.length > 0) {
        const serviceRate = Math.round((serviceSold.length / serviceLeads.length) * 1000) / 10;
        libMetrics.push({ id: "lib-11", title: "Service-to-Sales", value: `${serviceRate}%`, change: "\u2014", trend: "neutral", category: "Conversion" });
      } else {
        libMetrics.push({ id: "lib-11", title: "Service-to-Sales", value: "\u2014", change: "\u2014", trend: "neutral", category: "Conversion" });
      }

      const hotConversion = hotLeads.length > 0 ? Math.round((hotSold.length / hotLeads.length) * 1000) / 10 : 0;
      const c12 = computeRateChange(hotSold.length, hotLeads.length, priorHotSold.length, priorHotLeads.length);
      libMetrics.push({ id: "lib-12", title: "Hot Lead Conversion", value: `${hotConversion}%`, change: c12.change, trend: c12.trend, category: "Conversion" });

      const showroomConversion = showroomLeads.length > 0 ? Math.round((showroomSold.length / showroomLeads.length) * 1000) / 10 : 0;
      const c13 = computeRateChange(showroomSold.length, showroomLeads.length, priorShowroomSold.length, priorShowroomLeads.length);
      libMetrics.push({ id: "lib-13", title: "Showroom Conversion", value: `${showroomConversion}%`, change: c13.change, trend: c13.trend, category: "Conversion" });

      const lossRate = totalLeads > 0 ? Math.round((lostLeads.length / totalLeads) * 1000) / 10 : 0;
      const c14 = computeRateChange(lostLeads.length, totalLeads, priorLostLeads.length, priorTotal);
      libMetrics.push({ id: "lib-14", title: "Loss Rate", value: `${lossRate}%`, change: c14.change, trend: c14.trend, category: "Conversion" });

      const badRate = totalLeads > 0 ? Math.round((badLeads.length / totalLeads) * 1000) / 10 : 0;
      const c15 = computeRateChange(badLeads.length, totalLeads, priorBadLeads.length, priorTotal);
      libMetrics.push({ id: "lib-15", title: "Bad Lead Rate", value: `${badRate}%`, change: c15.change, trend: c15.trend, category: "Conversion" });

      const contactRate = totalLeads > 0 ? Math.round((contactedLeads.length / totalLeads) * 1000) / 10 : 0;
      const c16 = computeRateChange(contactedLeads.length, totalLeads, priorContactedLeads.length, priorTotal);
      libMetrics.push({ id: "lib-16", title: "Contact Rate", value: `${contactRate}%`, change: c16.change, trend: c16.trend, category: "Response" });

      libMetrics.push({ id: "lib-17", title: "New Lead Aging", value: newLeads.length > 0 ? `${Math.round(avgNewLeadAge * 10) / 10} days` : "\u2014", change: "\u2014", trend: "neutral", category: "Response" });

      libMetrics.push({ id: "lib-18", title: "Response Gap (>24h)", value: String(responseGap.length), change: "\u2014", trend: responseGap.length > 0 ? "down" : "neutral", category: "Response" });

      libMetrics.push({ id: "lib-19", title: "Waiting Lead Volume", value: String(waitingLeads.length), change: "\u2014", trend: "neutral", category: "Response" });

      const totalNewAndActive = newLeads.length + activeLeads.length;
      const engagementRate = totalNewAndActive > 0 ? Math.round((engagementTransition.length / totalNewAndActive) * 100) : 0;
      libMetrics.push({ id: "lib-20", title: "Engagement Transition", value: `${engagementRate}%`, change: "\u2014", trend: "neutral", category: "Response" });

      libMetrics.push({ id: "lib-21", title: "Avg Time to 1st Contact", value: "\u2014", change: "\u2014", trend: "neutral", category: "Response" });

      libMetrics.push({ id: "lib-22", title: "Top Source", value: totalLeads > 0 ? `${topSourceName} (${topSourcePct}%)` : "\u2014", change: "\u2014", trend: "neutral", category: "Lead Source" });

      libMetrics.push({ id: "lib-23", title: "Source Win Rate", value: totalLeads > 0 ? `${topSourceWinRate}%` : "\u2014", change: "\u2014", trend: "neutral", category: "Lead Source" });

      libMetrics.push({ id: "lib-24", title: "Source Diversity Score", value: totalLeads > 0 ? String(sourceDiversity) : "\u2014", change: "\u2014", trend: "neutral", category: "Lead Source" });

      libMetrics.push({ id: "lib-25", title: "Concentration Risk", value: totalLeads > 0 ? `${topSourcePct}%` : "\u2014", change: "\u2014", trend: topSourcePct > 50 ? "down" : "neutral", category: "Lead Source" });

      libMetrics.push({ id: "lib-26", title: "Source Quality Score", value: totalLeads > 0 ? `${sourceQualityScore}%` : "\u2014", change: "\u2014", trend: "neutral", category: "Lead Source" });

      const digitalPctRounded = totalLeads > 0 ? Math.round(digitalPct) : 0;
      const c27 = computeRateChange(digitalLeads.length, totalLeads, priorDigitalLeads.length, priorTotal);
      libMetrics.push({ id: "lib-27", title: "Digital Lead %", value: `${digitalPctRounded}%`, change: c27.change, trend: c27.trend, category: "Channel" });

      const c28 = computeChange(walkInLeads.length, priorWalkInAll.length);
      libMetrics.push({ id: "lib-28", title: "Walk-In Traffic", value: String(walkInLeads.length), change: c28.change, trend: c28.trend, category: "Channel" });

      const c29 = computeChange(phoneLeads.length, priorPhoneLeads.length);
      libMetrics.push({ id: "lib-29", title: "Phone Inquiries", value: String(phoneLeads.length), change: c29.change, trend: c29.trend, category: "Channel" });

      const c30 = computeChange(referralLeads.length, priorReferralLeads.length);
      libMetrics.push({ id: "lib-30", title: "Referral Leads", value: String(referralLeads.length), change: c30.change, trend: c30.trend, category: "Channel" });

      const salesVelRounded = Math.round(salesVelocity * 10) / 10;
      const priorSalesVelRounded = Math.round(priorSalesVelocity * 10) / 10;
      const c31 = computeChange(salesVelRounded, priorSalesVelRounded);
      libMetrics.push({ id: "lib-31", title: "Sales Velocity", value: `${salesVelRounded}/day`, change: c31.change, trend: c31.trend, category: "Composite" });

      const c32 = computeChange(digitalMaturity, priorDigitalMaturity);
      libMetrics.push({ id: "lib-32", title: "Digital Maturity Score", value: `${digitalMaturity}`, change: c32.change, trend: c32.trend, category: "Composite" });

      libMetrics.push({ id: "lib-33", title: "Projected Month Close", value: String(projectedClose), change: "\u2014", trend: "neutral", category: "Forecast" });

      libMetrics.push({ id: "lib-34", title: "Pipeline Coverage Ratio", value: projectedClose > 0 ? `${pipelineCoverage}x` : "\u2014", change: "\u2014", trend: pipelineCoverage >= 2 ? "up" : pipelineCoverage >= 1 ? "neutral" : "down", category: "Forecast" });

      return res.json(libMetrics);
    } catch (err: any) {
      console.error("[Insights] Library metrics error:", err);
      return res.status(500).json({ message: "Failed to fetch library metrics" });
    }
  });

  startSyncScheduler().catch(err => {
    console.error("[Sync] Failed to start scheduler:", err);
  });

  const publicRateLimits = new Map<string, { count: number; resetAt: number }>();
  const checkPublicRate = (ip: string, limit = 60, windowMs = 60000): boolean => {
    const now = Date.now();
    const entry = publicRateLimits.get(ip);
    if (!entry || now > entry.resetAt) {
      publicRateLimits.set(ip, { count: 1, resetAt: now + windowMs });
      return true;
    }
    entry.count++;
    return entry.count <= limit;
  };
  setInterval(() => {
    const now = Date.now();
    for (const [key, val] of publicRateLimits) {
      if (now > val.resetAt) publicRateLimits.delete(key);
    }
  }, 60000);

  async function resolveOrgBySlug(slug: string) {
    let org = await storage.getOrganizationBySlug(slug);
    if (!org && slug === "demo") {
      const allOrgs = await storage.getOrganizations();
      if (allOrgs.length > 0) org = allOrgs[0];
    }
    return org;
  }

  app.get("/api/public/landing/:slug", async (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    if (!checkPublicRate(ip)) return res.status(429).json({ message: "Too many requests" });
    try {
      const slug = req.params.slug;
      let org = await resolveOrgBySlug(slug);
      if (!org) {
        const redirect = await storage.getSlugRedirect(slug);
        if (redirect) {
          return res.json({ redirect: true, newSlug: redirect.newSlug });
        }
        return res.status(404).json({ message: "Organization not found" });
      }
      return res.json({
        id: org.id,
        name: org.name,
        slug: org.slug,
        personaName: org.personaName,
      });
    } catch (err) {
      return res.status(500).json({ message: "Failed to load landing page" });
    }
  });

  app.post("/api/widget/contact", async (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    if (!checkPublicRate(ip)) return res.status(429).json({ message: "Too many requests" });
    try {
      const { widgetCode, slug, name, email, phone, message } = req.body;
      if (!name || !email || !message) {
        return res.status(400).json({ message: "Name, email, and message are required" });
      }

      let org;
      if (widgetCode) {
        const allOrgs = await storage.getOrganizations();
        for (const o of allOrgs) {
          const orgWidgets = await storage.getWidgets(o.id);
          if (orgWidgets.find(w => w.widgetCode === widgetCode)) {
            org = o;
            break;
          }
        }
      } else if (slug) {
        org = await resolveOrgBySlug(slug);
      }

      if (!org) {
        return res.status(404).json({ message: "Organization not found" });
      }

      const conversation = await storage.createConversation({
        customerName: name,
        customerEmail: email,
        customerPhone: phone || null,
        channel: "form",
        status: "open",
        organizationId: org.id,
        unreadCount: 1,
        lastMessageAt: new Date(),
      });

      const formContent = `Contact Form Submission\n\nName: ${name}\nEmail: ${email}${phone ? `\nPhone: ${phone}` : ""}\n\nMessage:\n${message}`;

      await storage.createMessage({
        conversationId: conversation.id,
        role: "user",
        content: formContent,
        senderName: name,
      });

      return res.json({ success: true, conversationId: conversation.id });
    } catch (err) {
      console.error("Widget contact error:", err);
      return res.status(500).json({ message: "Failed to submit contact form" });
    }
  });

  app.get("/api/widget/voice-config/:slug", async (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    if (!checkPublicRate(ip)) return res.status(429).json({ message: "Too many requests" });
    try {
      const org = await resolveOrgBySlug(req.params.slug);
      if (!org) return res.status(404).json({ message: "Organization not found" });

      const agents = await storage.getAgents(org.id);
      const voiceAgent = agents.find(a => a.vapiAssistantId && a.status === "active");
      const videoAgent = agents.find(a => (a as any).tavusPersonaId && a.status === "active");

      return res.json({
        vapiAssistantId: voiceAgent?.vapiAssistantId || null,
        tavusPersonaId: (videoAgent as any)?.tavusPersonaId || null,
        orgName: org.name,
        personaName: org.personaName,
      });
    } catch (err) {
      return res.status(500).json({ message: "Failed to load voice config" });
    }
  });

  app.get("/api/widgets/public/:widgetCode", async (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    if (!checkPublicRate(ip)) return res.status(429).json({ message: "Too many requests" });
    try {
      const allOrgs = await storage.getOrganizations();
      for (const org of allOrgs) {
        const widgets = await storage.getWidgets(org.id);
        const widget = widgets.find(w => w.widgetCode === req.params.widgetCode);
        if (widget) {
          const config = (widget.config || {}) as Record<string, any>;
          return res.json({
            widgetCode: widget.widgetCode,
            type: widget.type,
            name: widget.name,
            orgName: org.name,
            personaName: org.personaName,
            appearance: config.appearance || {},
            channels: {
              chat: true,
              video: true,
              voice: true,
            },
          });
        }
      }
      return res.status(404).json({ message: "Widget not found" });
    } catch (err) {
      return res.status(500).json({ message: "Failed to load widget config" });
    }
  });

  app.post("/api/widget/chat", async (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    if (!checkPublicRate(ip, 30)) return res.status(429).json({ message: "Too many requests" });
    try {
      const { slug, message, conversationId } = req.body;
      if (!slug || !message) {
        return res.status(400).json({ message: "slug and message are required" });
      }

      const org = await resolveOrgBySlug(slug);
      if (!org) {
        return res.status(404).json({ message: "Organization not found" });
      }

      let conversation;
      let isNewConversation = false;
      if (conversationId) {
        conversation = await storage.getConversation(conversationId);
        if (!conversation || conversation.organizationId !== org.id) {
          return res.status(404).json({ message: "Conversation not found" });
        }
      } else {
        conversation = await storage.createConversation({
          customerName: "Website Visitor",
          channel: "chat",
          status: "open",
          organizationId: org.id,
          unreadCount: 1,
          lastMessageAt: new Date(),
        });
        isNewConversation = true;
      }

      let autoGreetingMessage: string | null = null;
      if (isNewConversation) {
        try {
          const orgAgents = await storage.getAgents(org.id);
          const greetingAgent = orgAgents.find(a => a.autoGreeting && a.status === "active");
          if (greetingAgent && greetingAgent.autoGreeting) {
            autoGreetingMessage = greetingAgent.autoGreeting
              .replace(/\{\{customerName\}\}/g, "there")
              .replace(/\{\{dealershipName\}\}/g, org.name || "our dealership")
              .replace(/\{\{agentName\}\}/g, greetingAgent.name || "your assistant");

            await storage.createMessage({
              conversationId: conversation.id,
              role: "assistant",
              content: autoGreetingMessage,
              senderName: greetingAgent.name,
            });

            storage.createActivityLog({
              organizationId: org.id,
              action: "auto_greeting_sent",
              entityType: "conversation",
              entityId: conversation.id,
              metadata: { agentName: greetingAgent.name, channel: "chat" },
            }).catch(() => {});
          }
        } catch (greetErr: any) {
          console.error(`[AutoGreeting] Webchat greeting failed:`, greetErr.message);
        }
      }

      await storage.createMessage({
        conversationId: conversation.id,
        role: "user",
        content: message,
        senderName: "Website Visitor",
      });

      const existingMessages = await storage.getMessages(conversation.id);
      const claudeMessages = existingMessages.map(m => ({
        role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
        content: m.content,
      }));

      let aiResponse = "I'm sorry, I'm unable to respond right now. Please try again later.";
      try {
        const orgDocuments = await storage.getDocuments(org.id);
        const docsWithContent = orgDocuments.filter(d => d.content && d.content.trim().length > 0 && !d.agentId);
        let widgetKnowledgeContext = "";
        if (docsWithContent.length > 0) {
          const maxTotalChars = 16000;
          let totalChars = 0;
          const docSections: string[] = [];
          for (const d of docsWithContent) {
            const remaining = maxTotalChars - totalChars;
            if (remaining <= 0) break;
            const maxPerDoc = Math.min(4000, remaining);
            const truncated = d.content!.length > maxPerDoc ? d.content!.slice(0, maxPerDoc) + "\n...(truncated)" : d.content!;
            const section = `--- ${d.name} (${d.type}) ---\n${truncated}`;
            docSections.push(section);
            totalChars += section.length;
          }
          widgetKnowledgeContext = `\n\nKnowledge Base Documents (use this information to answer questions when relevant):\n${docSections.join("\n\n")}`;
        }
        const systemPrompt = `You are ${org.personaName}, an AI concierge for ${org.name}. You are helpful, friendly, and professional. Help website visitors with their questions about the dealership, vehicles, services, and appointments. Keep responses concise and conversational.${widgetKnowledgeContext}`;
        const claudeResult = await anthropic.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 300,
          system: systemPrompt,
          messages: claudeMessages,
        });
        const textBlock = claudeResult.content.find(b => b.type === "text");
        if (textBlock && textBlock.type === "text") {
          aiResponse = textBlock.text;
        }
      } catch (aiErr) {
        console.error("[WidgetChat] Claude API error:", aiErr);
      }

      await storage.createMessage({
        conversationId: conversation.id,
        role: "assistant",
        content: aiResponse,
        senderName: org.personaName,
      });

      await storage.updateConversation(conversation.id, {
        lastMessageAt: new Date(),
        unreadCount: (conversation.unreadCount || 0) + 1,
      });

      return res.json({
        conversationId: conversation.id,
        response: aiResponse,
        autoGreeting: autoGreetingMessage,
      });
    } catch (err) {
      console.error("[WidgetChat] Error:", err);
      return res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  app.get("/widget/test", async (req, res) => {
    const proto = req.get("x-forwarded-proto") || req.protocol;
    const host = (process.env.APP_BASE_URL || `${proto}://${req.get("host")}`).replace(/\/+$/, '');
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Dealer.com / Huminic AI — Partnership Portal</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;color:#1e293b}
.header{background:linear-gradient(135deg,#1e40af,#2563eb,#3b82f6);color:#fff;padding:52px 24px 44px;text-align:center}
.header h1{font-size:26px;font-weight:700;margin-bottom:6px;letter-spacing:-0.3px}
.header p{opacity:0.85;font-size:15px;font-weight:400}
.container{max-width:900px;margin:0 auto;padding:32px 24px 48px}
.section-label{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#6366f1;margin-bottom:16px}
.stores{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px;margin-bottom:0}
.store-btn{display:block;padding:20px 22px;background:#fff;border:2px solid #e2e8f0;border-radius:12px;cursor:pointer;text-align:left;transition:all 0.2s;font-size:16px;font-weight:600;color:#334155;box-shadow:0 1px 3px rgba(0,0,0,0.06);text-decoration:none}
.store-btn:hover{border-color:#6366f1;background:#eef2ff;transform:translateY(-2px);box-shadow:0 4px 12px rgba(99,102,241,0.15)}
.store-btn .slug{font-size:12px;color:#94a3b8;font-weight:400;margin-top:6px}
.store-btn .persona{font-size:12px;color:#6366f1;font-weight:500;margin-top:4px;font-style:italic}
.divider{border:none;border-top:2px solid #e2e8f0;margin:40px 0}
.zip-card{display:flex;align-items:center;gap:20px;background:#fff;border:2px solid #e2e8f0;border-radius:12px;padding:24px 28px;box-shadow:0 1px 3px rgba(0,0,0,0.06);transition:all 0.2s;text-decoration:none;color:#334155;max-width:560px}
.zip-card:hover{border-color:#6366f1;background:#eef2ff;transform:translateY(-2px);box-shadow:0 4px 12px rgba(99,102,241,0.15)}
.zip-icon{flex-shrink:0;width:56px;height:56px;background:linear-gradient(135deg,#6366f1,#818cf8);border-radius:12px;display:flex;align-items:center;justify-content:center}
.zip-icon svg{width:28px;height:28px;color:#fff;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.zip-info h3{font-size:16px;font-weight:600;margin-bottom:4px;color:#1e293b}
.zip-info p{font-size:13px;color:#64748b;line-height:1.5}
</style>
</head>
<body>
<div class="header">
<h1>Dealer.com / Huminic AI Partnership Portal</h1>
<p>File and Configuration Handoff Portal</p>
</div>
<div class="container">
<div class="section-label">Video Widget JavaScript Demonstration</div>
<div class="stores">
<a class="store-btn" href="${host}/p/serra-honda?mode=video" target="_blank" data-testid="btn-serra-honda">Serra Honda<div class="slug">serra-honda</div><div class="persona">Caroline</div></a>
<a class="store-btn" href="${host}/p/serra-nissan?mode=video" target="_blank" data-testid="btn-serra-nissan">Serra Nissan<div class="slug">serra-nissan</div><div class="persona">Magnolia</div></a>
<a class="store-btn" href="${host}/p/tony-serra-ford?mode=video" target="_blank" data-testid="btn-tony-serra-ford">Tony Serra Ford<div class="slug">tony-serra-ford</div><div class="persona">Georgia</div></a>
<a class="store-btn" href="${host}/p/hyundai-of-columbia?mode=video" target="_blank" data-testid="btn-hyundai-of-columbia">Hyundai of Columbia<div class="slug">hyundai-of-columbia</div><div class="persona">Elizabeth</div></a>
<a class="store-btn" href="${host}/p/ford-of-columbia?mode=video" target="_blank" data-testid="btn-ford-of-columbia">Ford of Columbia<div class="slug">ford-of-columbia</div><div class="persona">Savannah</div></a>
</div>
<hr class="divider">
<div class="section-label">Dealer.com Files &amp; Instructions</div>
<a class="zip-card" href="/dealer-handoff/Nexxus_Connect_Dealer.com_Integration.zip" download data-testid="link-download-zip">
<div class="zip-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></div>
<div class="zip-info">
<h3>Nexxus_Connect_Dealer.com_Integration.zip</h3>
<p>Contains integration instructions and JavaScript widget links for all 5 stores. Ready for Dealer.com team handoff.</p>
</div>
</a>
</div>
</body></html>`;
    res.setHeader("Content-Type", "text/html");
    res.send(html);
  });

  app.get("/widget/dealer/:slug.js", async (req, res) => {
    const slug = req.params.slug;
    const org = await resolveOrgBySlug(slug);
    if (!org) return res.status(404).send("// dealer not found");
    const proto = req.get("x-forwarded-proto") || req.protocol;
    const host = (process.env.APP_BASE_URL || `${proto}://${req.get("host")}`).replace(/\/+$/, '');
    const color = "#6366f1";
    const name = org.name;
    const js = `(function(){var H="${host}",S="${slug}",N="${name}",C="${color}";if(document.getElementById("nexxus-widget-"+S))return;var btn=document.createElement("a");btn.id="nexxus-widget-"+S;btn.href=H+"/p/"+S+"?mode=video";btn.target="_blank";btn.rel="noopener";btn.setAttribute("role","button");btn.setAttribute("aria-label","Chat with "+N);btn.style.cssText="position:fixed;bottom:20px;right:20px;z-index:2147483647;cursor:pointer;display:flex;align-items:center;gap:8px;background:"+C+";color:#fff;border-radius:28px;padding:12px 20px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;font-size:14px;font-weight:600;box-shadow:0 4px 16px rgba(0,0,0,0.18);transition:transform 0.2s,box-shadow 0.2s;text-decoration:none;";btn.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg><span>Chat with us</span>';btn.onmouseenter=function(){btn.style.transform="scale(1.05)";btn.style.boxShadow="0 6px 24px rgba(0,0,0,0.25)";};btn.onmouseleave=function(){btn.style.transform="scale(1)";btn.style.boxShadow="0 4px 16px rgba(0,0,0,0.18)";};document.body.appendChild(btn);})();`;
    res.setHeader("Content-Type", "application/javascript");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(js);
  });

  app.get("/widget/nexxus-widget.js", (_req, res) => {
    res.setHeader("Content-Type", "application/javascript");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.send(`
(function() {
  var cfg = window.nexxusConfig || {};
  if (!cfg.widgetId) { console.error('Nexxus Widget: missing widgetId in nexxusConfig'); return; }
  var host = cfg.host || window.location.origin;
  var iframe = document.createElement('iframe');
  iframe.src = host + '/w/demo?widget=' + encodeURIComponent(cfg.widgetId);
  iframe.style.cssText = 'position:fixed;bottom:20px;right:20px;width:380px;height:600px;border:none;z-index:999999;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.12);';
  iframe.allow = 'microphone;camera';
  document.body.appendChild(iframe);
})();
    `.trim());
  });

  app.get("/api/outbound/status", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const globalEnabled = process.env.OUTBOUND_LIVE_ENABLED === "true";
      const org = await storage.getOrganization(req.user.organizationId);
      const settings = (org?.settings as Record<string, any>) || {};
      return res.json({
        globalKillSwitch: globalEnabled,
        orgOutboundEnabled: org?.outboundEnabled ?? false,
        smsEnabled: org?.smsEnabled ?? false,
        emailEnabled: org?.emailEnabled ?? false,
        phoneEnabled: org?.phoneEnabled ?? false,
        videoEnabled: org?.videoEnabled ?? false,
        rateLimitMax: settings.rateLimitMax ?? 3,
        effectiveStatus: globalEnabled && (org?.outboundEnabled ?? false),
      });
    } catch (err) {
      return res.status(500).json({ message: "Failed to get outbound status" });
    }
  });

  app.get("/api/usage", authenticateToken, requireRole(3), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const { startDate, endDate, eventType } = req.query;
      const filters: { startDate?: Date; endDate?: Date; eventType?: string } = {};
      if (startDate && typeof startDate === "string") filters.startDate = new Date(startDate);
      if (endDate && typeof endDate === "string") filters.endDate = new Date(endDate);
      if (eventType && typeof eventType === "string") filters.eventType = eventType;
      const events = await storage.getUsageEvents(req.user.organizationId, filters);
      return res.json(events);
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch usage events" });
    }
  });

  app.get("/api/usage/summary", authenticateToken, requireRole(3), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const now = new Date();
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : now;

      const orgIds: string[] = [];
      if (req.user.roleLevel <= 2) {
        const allOrgs = await storage.getOrganizations();
        const partnerOrgs = req.user.roleLevel === 1
          ? allOrgs
          : allOrgs.filter(o => o.partnerId === req.user!.organizationId || o.id === req.user!.organizationId);
        orgIds.push(...partnerOrgs.map(o => o.id));
      } else {
        orgIds.push(req.user.organizationId);
      }

      const summaries = await Promise.all(
        orgIds.map(async (orgId) => {
          const summary = await storage.getUsageSummary(orgId, startDate, endDate);
          const org = await storage.getOrganization(orgId);
          return { organizationId: orgId, organizationName: org?.name || "Unknown", period: { start: startDate.toISOString(), end: endDate.toISOString() }, usage: summary };
        })
      );

      return res.json(summaries);
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch usage summary" });
    }
  });

  app.get("/api/billing/usage", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const orgId = (req.query.org_id as string) || req.user.organizationId;
      if (orgId !== req.user.organizationId && req.user.roleLevel > 2) {
        return res.status(403).json({ message: "Access denied" });
      }

      const now = new Date();
      const period = (req.query.period as string) || "current_month";
      let startDate: Date, endDate: Date;
      if (period === "current_month") {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = now;
      } else if (period === "last_month") {
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      } else {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = now;
      }

      const summary = await storage.getUsageSummary(orgId, startDate, endDate);
      const org = await storage.getOrganization(orgId);
      return res.json({
        organizationId: orgId,
        organizationName: org?.name || "Unknown",
        period: { start: startDate.toISOString(), end: endDate.toISOString() },
        usage: summary,
      });
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch billing usage" });
    }
  });

  app.post("/api/webhooks/textmagic", upload.none(), async (req, res) => {
    const textmagicSecret = process.env.TEXTMAGIC_WEBHOOK_SECRET;
    if (textmagicSecret) {
      const headerSecret = req.headers["x-textmagic-secret"] || req.headers["x-tm-signature"] || "";
      const providedSecret = typeof headerSecret === "string" ? headerSecret : "";
      if (providedSecret !== textmagicSecret) {
        console.warn("[TextMagic Webhook] Invalid secret — rejecting request");
        return res.status(401).json({ message: "Unauthorized" });
      }
    }

    const ip = req.ip || req.socket.remoteAddress || "unknown";
    if (!checkPublicRate(ip, 30)) return res.status(429).json({ message: "Too many requests" });
    try {
      const { sender, text: messageText, receiver } = req.body;
      const phone = typeof sender === "string" ? sender : String(sender || "");
      const content = typeof messageText === "string" ? messageText : String(messageText || "");
      const receiverPhone = typeof receiver === "string" ? receiver : String(receiver || "");
      let timestamp = new Date();
      if (req.body.timestamp) {
        const ts = Number(req.body.timestamp);
        timestamp = !isNaN(ts) ? new Date(ts * 1000) : new Date(req.body.timestamp);
        if (isNaN(timestamp.getTime())) timestamp = new Date();
      }

      if (!phone || !content) {
        return res.status(400).json({ message: "Missing sender or text in webhook payload" });
      }

      const normalizedPhone = phone.replace(/[^0-9+]/g, "");
      const normalizedReceiver = receiverPhone.replace(/[^0-9+]/g, "");

      console.log(`[TextMagic Webhook] Inbound SMS from ${normalizedPhone} to ${normalizedReceiver}: "${content.substring(0, 80)}"`);

      const receiverOrg = normalizedReceiver ? await storage.getOrganizationByTextmagicPhone(normalizedReceiver) : undefined;
      if (receiverOrg) {
        const receiverSettings = (receiverOrg.settings || {}) as Record<string, any>;
        const orgTmPhone = (receiverSettings.textmagicPhone || "").replace(/[^0-9+]/g, "");
        const senderDigits = normalizedPhone.replace(/\+/g, "");
        const orgTmDigits = orgTmPhone.replace(/\+/g, "");
        if (senderDigits === orgTmDigits || normalizedPhone === orgTmPhone) {
          console.log(`[TextMagic Webhook] Ignoring outbound echo — sender ${normalizedPhone} matches org TextMagic number`);
          return res.json({ success: true, skipped: true, reason: "outbound_echo" });
        }
      }

      let resolvedOrg: string | null = null;

      if (receiverOrg) {
        resolvedOrg = receiverOrg.id;
        console.log(`[TextMagic Webhook] Resolved org via receiver TextMagic number: ${resolvedOrg} (${receiverOrg.name})`);
      }

      if (!resolvedOrg) {
        const lastOutbound = await storage.findLastOutboundForPhone(normalizedPhone, "sms");
        if (lastOutbound?.organizationId) {
          resolvedOrg = lastOutbound.organizationId;
          console.log(`[TextMagic Webhook] Resolved org via outbound history: ${resolvedOrg}`);
        }
      }

      if (!resolvedOrg) {
        const contactOrg = await storage.findOrganizationByPhone(normalizedPhone);
        if (contactOrg) {
          resolvedOrg = contactOrg.id;
        }
      }

      if (!resolvedOrg) {
        const allOrgs = await storage.getOrganizations();
        if (allOrgs.length === 1) {
          resolvedOrg = allOrgs[0].id;
        } else {
          console.warn("[TextMagic Webhook] Cannot resolve organization for unknown phone — multiple orgs exist, no fallback to arbitrary org");
          return res.status(200).json({ message: "Received — unresolvable sender, no action taken" });
        }
      }

      const organizationId = resolvedOrg;

      const STOP_KEYWORDS = ["STOP", "UNSUBSCRIBE", "QUIT", "CANCEL", "END", "OPTOUT"];
      const normalizedContent = content.trim().toUpperCase();
      if (STOP_KEYWORDS.includes(normalizedContent)) {
        const org = await storage.getOrganization(organizationId);
        const orgName = org?.name || "this organization";

        await storage.createBlacklistEntry({
          phoneNumber: normalizedPhone,
          organizationId,
          reason: normalizedContent,
        });

        const openConvos = await storage.getConversations(organizationId, { status: "open", channel: "sms" });
        for (const conv of openConvos) {
          if (conv.customerPhone === normalizedPhone) {
            await storage.updateConversation(conv.id, { status: "closed" });
          }
        }

        try {
          const { sendSmsRaw } = await import("./outbound");
          if (org?.outboundEnabled && org?.smsEnabled && process.env.OUTBOUND_LIVE_ENABLED === "true") {
            await sendSmsRaw(normalizedPhone, `You have been unsubscribed from ${orgName} messages. Reply START to re-subscribe.`);
          }
        } catch (confirmErr: any) {
          console.error(`[TextMagic Webhook] Failed to send STOP confirmation to ${normalizedPhone}:`, confirmErr.message);
        }

        storage.createActivityLog({
          organizationId,
          action: "sms_stop_received",
          entityType: "sms_blacklist",
          metadata: {
            senderPhone: normalizedPhone,
            keyword: normalizedContent,
            orgName,
          },
        }).catch(() => {});

        console.log(`[TextMagic Webhook] STOP keyword "${normalizedContent}" received from ${normalizedPhone} — blacklisted for org ${organizationId}`);
        return res.json({ success: true, action: "blacklisted", keyword: normalizedContent });
      }

      let conversation = await storage.getConversationByPhone(normalizedPhone, "sms");

      if (conversation && conversation.organizationId !== organizationId) {
        console.log(`[TextMagic Webhook] Existing conversation belongs to different org (${conversation.organizationId}), creating new one for ${organizationId}`);
        conversation = null;
      }

      if (conversation) {
        await storage.updateConversation(conversation.id, {
          lastMessageAt: timestamp,
          unreadCount: (conversation.unreadCount || 0) + 1,
        });
      } else {

        let sourceConversationId: string | null = null;
        let linkedCampaignId: string | null = null;

        try {
          const outboundForLink = await storage.findLastOutboundForPhone(normalizedPhone, "sms");
          if (outboundForLink) {
            linkedCampaignId = outboundForLink.campaignId ?? null;
            if (linkedCampaignId) {
              const existingConvs = await storage.getConversations(organizationId, { channel: "sms" });
              const sourceConv = existingConvs.find(
                c => c.campaignId === linkedCampaignId && c.customerPhone === normalizedPhone
              );
              if (sourceConv) {
                sourceConversationId = sourceConv.id;
              }
            }
          }
        } catch (lookupErr) {
          console.warn("[TextMagic Webhook] Could not resolve outbound context:", lookupErr);
        }

        conversation = await storage.createConversation({
          customerName: normalizedPhone,
          customerPhone: normalizedPhone,
          channel: "sms",
          status: "open",
          organizationId,
          unreadCount: 1,
          lastMessageAt: timestamp,
          campaignId: linkedCampaignId,
          sourceConversationId,
        });

        if (linkedCampaignId) {
          try {
            const campaign = await storage.getCampaign(linkedCampaignId);
            console.log(`[TextMagic Webhook] SMS reply labeled — campaign: "${campaign?.name || linkedCampaignId}", sourceConversationId: ${sourceConversationId || "none"}`);
          } catch {}
        }

        (async () => {
          try {
            const org = await storage.getOrganization(organizationId);
            if (!org || !org.outboundEnabled || !org.smsEnabled) return;
            if (process.env.OUTBOUND_LIVE_ENABLED !== "true") return;

            const orgAgents = await storage.getAgents(organizationId);
            const greetingAgent = orgAgents.find(a => a.autoGreeting && a.status === "active");
            if (!greetingAgent || !greetingAgent.autoGreeting) return;

            const greeting = greetingAgent.autoGreeting
              .replace(/\{\{customerName\}\}/g, normalizedPhone)
              .replace(/\{\{dealershipName\}\}/g, org.name || "our dealership")
              .replace(/\{\{agentName\}\}/g, greetingAgent.name || "your assistant");

            const { sendSms } = await import("./outbound");
            await sendSms(normalizedPhone, greeting, organizationId);
            console.log(`[AutoGreeting] SMS sent to ${normalizedPhone} via agent ${greetingAgent.name}`);

            await storage.createMessage({
              conversationId: conversation!.id,
              role: "agent",
              content: greeting,
              senderName: greetingAgent.name,
            });

            storage.logUsageEvent({
              organizationId,
              eventType: "outbound_sms",
              channel: "sms",
              quantity: 1,
              metadata: { recipient: normalizedPhone, source: "auto_greeting", agentId: greetingAgent.id },
            }).catch(() => {});

            storage.createActivityLog({
              organizationId,
              action: "auto_greeting_sent",
              entityType: "conversation",
              entityId: conversation!.id,
              metadata: { agentName: greetingAgent.name, customerPhone: normalizedPhone, channel: "sms" },
            }).catch(() => {});
          } catch (greetErr: any) {
            console.error(`[AutoGreeting] SMS failed for inbound lead ${normalizedPhone}:`, greetErr.message);
          }
        })();
      }

      await storage.createMessage({
        conversationId: conversation.id,
        role: "user",
        content,
        senderName: normalizedPhone,
      });

      const orgUsers = await storage.getUsers(organizationId);
      const adminUsers = orgUsers.filter(u => {
        const roleLevel = (u as any).role?.level;
        return roleLevel !== undefined && roleLevel <= 3;
      });

      const isReply = !!(conversation.campaignId || conversation.sourceConversationId);
      const notificationTitle = isReply
        ? `SMS reply${conversation.campaignId ? " (campaign)" : ""}`
        : "New inbound SMS";

      for (const admin of adminUsers) {
        storage.createNotification({
          userId: admin.id,
          organizationId,
          type: "sms_inbound",
          title: notificationTitle,
          message: `SMS from ${normalizedPhone}: "${content.substring(0, 100)}"`,
          relatedEntityType: "conversation",
          relatedEntityId: conversation.id,
        }).catch(() => {});
      }

      storage.createActivityLog({
        organizationId,
        action: "sms_inbound_received",
        entityType: "conversation",
        entityId: conversation.id,
        metadata: {
          senderPhone: normalizedPhone,
          messagePreview: content.substring(0, 100),
          sourceConversationId: conversation.sourceConversationId || null,
          campaignId: conversation.campaignId || null,
          contextLabel: isReply ? "campaign_reply" : "new_contact",
        },
      }).catch(() => {});

      return res.json({ success: true, conversationId: conversation.id });
    } catch (err) {
      console.error("[TextMagic Webhook] Error processing inbound SMS:", err);
      return res.status(500).json({ message: "Failed to process inbound SMS" });
    }
  });

  app.get("/api/settings/org", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const org = await storage.getOrganization(req.user.organizationId);
      if (!org) return res.status(404).json({ message: "Organization not found" });
      return res.json(org.settings || {});
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch org settings" });
    }
  });

  app.patch("/api/settings/org", authenticateToken, requireRole(3), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const org = await storage.getOrganization(req.user.organizationId);
      if (!org) return res.status(404).json({ message: "Organization not found" });
      const existingSettings = (org.settings || {}) as Record<string, any>;
      const mergedSettings = { ...existingSettings, ...req.body };
      const updated = await storage.updateOrganization(req.user.organizationId, { settings: mergedSettings } as any);
      if (!updated) return res.status(500).json({ message: "Failed to update settings" });

      storage.createActivityLog({
        userId: req.user.id,
        organizationId: req.user.organizationId,
        action: "settings_updated",
        entityType: "organization",
        entityId: req.user.organizationId,
        metadata: { sections: Object.keys(req.body) },
      }).catch(() => {});

      return res.json(mergedSettings);
    } catch (err) {
      return res.status(500).json({ message: "Failed to update org settings" });
    }
  });

  app.post("/api/users/invite", authenticateToken, requireRole(3), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const inviteSchema = z.object({
        email: z.string().email(),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        roleId: z.string().uuid(),
      });
      const parsed = inviteSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid invite data", errors: parsed.error.flatten() });
      }

      const { email, firstName, lastName, roleId } = parsed.data;

      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(409).json({ message: "A user with that email already exists" });
      }

      const role = await storage.getRole(roleId);
      if (!role) return res.status(400).json({ message: "Invalid role" });
      if (role.level < req.user.roleLevel) {
        return res.status(403).json({ message: "Cannot invite a user with higher privileges than your own" });
      }

      const tempPassword = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6).toUpperCase();
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      const user = await storage.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        roleId,
        organizationId: req.user.organizationId,
      });

      const org = await storage.getOrganization(req.user.organizationId);

      const commGateOpen = org?.outboundEnabled && org?.emailEnabled;
      let inviteSent = false;

      if (!commGateOpen) {
        console.log(`[Invite] CommGate blocked email for org ${req.user.organizationId}. User ${email} created but invite email skipped.`);
      } else if (process.env.RESEND_API_KEY) {
        try {
          const emailRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "Nexxus Connect <onboarding@resend.dev>",
              to: email,
              subject: `You've been invited to ${org?.name || "Nexxus Connect"}`,
              html: `<h2>Welcome to ${org?.name || "Nexxus Connect"}!</h2>
                <p>${req.user.firstName} ${req.user.lastName} has invited you to join their organization.</p>
                <p>Your temporary credentials:</p>
                <ul>
                  <li><strong>Email:</strong> ${email}</li>
                  <li><strong>Password:</strong> ${tempPassword}</li>
                </ul>
                <p>Please change your password after your first login.</p>`,
            }),
          });
          if (!emailRes.ok) {
            console.warn("[Invite] Resend API error:", await emailRes.text());
          } else {
            inviteSent = true;
          }
        } catch (emailErr) {
          console.warn("[Invite] Failed to send invite email:", emailErr);
        }
      } else {
        console.log(`[Invite] No RESEND_API_KEY configured. Invite for ${email} with temp password: ${tempPassword}`);
      }

      const { password: _, ...safeUser } = user;

      storage.createActivityLog({
        userId: req.user.id,
        organizationId: req.user.organizationId,
        action: "user_invited",
        entityType: "user",
        entityId: user.id,
        metadata: { targetEmail: email, targetName: `${firstName} ${lastName}`, commGateBlocked: !commGateOpen },
      }).catch(() => {});

      storage.createNotification({
        userId: user.id,
        organizationId: req.user.organizationId,
        type: "system",
        title: "Welcome to Nexxus Connect",
        message: `You've been invited by ${req.user.firstName} ${req.user.lastName}. Please change your password after logging in.`,
      }).catch(() => {});

      return res.status(201).json({
        ...safeUser,
        inviteSent,
        commGateBlocked: !commGateOpen,
        message: !commGateOpen
          ? "User created but email not sent — communications paused"
          : undefined,
      });
    } catch (err) {
      console.error("Invite error:", err);
      return res.status(500).json({ message: "Failed to invite user" });
    }
  });

  app.post("/api/fal-proxy", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });

      const falKey = process.env.FAL_KEY;
      if (!falKey) {
        return res.status(503).json({ message: "FAL_KEY is not configured" });
      }

      const { endpoint, input } = req.body;
      if (!endpoint) {
        return res.status(400).json({ message: "endpoint is required" });
      }

      if (endpoint.startsWith("https://")) {
        try {
          const parsed = new URL(endpoint);
          if (!parsed.hostname.endsWith('.fal.run') && !parsed.hostname.endsWith('.fal.ai')) {
            return res.status(400).json({ message: "endpoint must be a fal.ai domain" });
          }
        } catch { return res.status(400).json({ message: "Invalid endpoint URL" }); }
      }

      const falUrl = endpoint.startsWith("https://")
        ? endpoint
        : `https://queue.fal.run/${endpoint}`;

      const falResponse = await fetch(falUrl, {
        method: "POST",
        headers: {
          Authorization: `Key ${falKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input || {}),
      });

      if (!falResponse.ok) {
        const errText = await falResponse.text();
        return res.status(falResponse.status).json({
          message: "fal.ai request failed",
          error: errText,
        });
      }

      const data = await falResponse.json();

      if (req.user?.organizationId) {
        const endpointLower = (endpoint || '').toLowerCase();
        if (endpointLower.includes('video') || endpointLower.includes('kling') || endpointLower.includes('runway') || endpointLower.includes('minimax')) {
          try { billingService.emitUsageEvent(req.user.organizationId, 'video_generated', { seconds: 0 }); } catch(e) {}
        } else {
          try { billingService.emitUsageEvent(req.user.organizationId, 'image_generated', {}); } catch(e) {}
        }
      }

      return res.json(data);
    } catch (err: any) {
      console.error("[fal-proxy] Error:", err);
      return res.status(502).json({ message: "fal.ai proxy error", error: err.message });
    }
  });

  app.post("/api/fal-proxy/status", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });

      const falKey = process.env.FAL_KEY;
      if (!falKey) {
        return res.status(503).json({ message: "FAL_KEY is not configured" });
      }

      const { requestId, endpoint, statusUrl: directStatusUrl } = req.body;
      if (!directStatusUrl && (!requestId || !endpoint)) {
        return res.status(400).json({ message: "requestId and endpoint are required, or provide statusUrl" });
      }

      if (directStatusUrl) {
        try {
          const parsed = new URL(directStatusUrl);
          if (!parsed.hostname.endsWith('.fal.run')) {
            return res.status(400).json({ message: "statusUrl must be a fal.run domain" });
          }
        } catch { return res.status(400).json({ message: "Invalid statusUrl" }); }
      }

      const statusUrl = directStatusUrl || `https://queue.fal.run/${endpoint}/requests/${requestId}/status`;
      const falResponse = await fetch(statusUrl, {
        headers: {
          Authorization: `Key ${falKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!falResponse.ok) {
        const errText = await falResponse.text();
        return res.status(falResponse.status).json({ message: "fal.ai status check failed", error: errText });
      }

      const data = await falResponse.json();
      return res.json(data);
    } catch (err: any) {
      console.error("[fal-proxy/status] Error:", err);
      return res.status(502).json({ message: "fal.ai status proxy error", error: err.message });
    }
  });

  app.post("/api/fal-proxy/result", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });

      const falKey = process.env.FAL_KEY;
      if (!falKey) {
        return res.status(503).json({ message: "FAL_KEY is not configured" });
      }

      const { requestId, endpoint, responseUrl: directResponseUrl } = req.body;
      if (!directResponseUrl && (!requestId || !endpoint)) {
        return res.status(400).json({ message: "requestId and endpoint are required, or provide responseUrl" });
      }

      if (directResponseUrl) {
        try {
          const parsed = new URL(directResponseUrl);
          if (!parsed.hostname.endsWith('.fal.run')) {
            return res.status(400).json({ message: "responseUrl must be a fal.run domain" });
          }
        } catch { return res.status(400).json({ message: "Invalid responseUrl" }); }
      }

      const resultUrl = directResponseUrl || `https://queue.fal.run/${endpoint}/requests/${requestId}`;
      const falResponse = await fetch(resultUrl, {
        headers: {
          Authorization: `Key ${falKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!falResponse.ok) {
        const errText = await falResponse.text();
        return res.status(falResponse.status).json({ message: "fal.ai result fetch failed", error: errText });
      }

      const data = await falResponse.json();
      return res.json(data);
    } catch (err: any) {
      console.error("[fal-proxy/result] Error:", err);
      return res.status(502).json({ message: "fal.ai result proxy error", error: err.message });
    }
  });

  app.post("/api/openai-proxy", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });

      const openaiKey = process.env.OPENAI_API_KEY;
      if (!openaiKey) {
        return res.status(503).json({ message: "OPENAI_API_KEY is not configured" });
      }

      const { messages, model, max_tokens, temperature, response_format, tools } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ message: "messages array is required" });
      }

      const payload: Record<string, any> = {
        model: model || "gpt-4o",
        messages,
      };
      if (max_tokens !== undefined) payload.max_tokens = max_tokens;
      if (temperature !== undefined) payload.temperature = temperature;
      if (response_format) payload.response_format = response_format;
      if (tools && Array.isArray(tools)) payload.tools = tools;

      const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!openaiResponse.ok) {
        const errText = await openaiResponse.text();
        return res.status(openaiResponse.status).json({
          message: "OpenAI request failed",
          error: errText,
        });
      }

      const data = await openaiResponse.json();
      return res.json(data);
    } catch (err: any) {
      console.error("[openai-proxy] Error:", err);
      return res.status(502).json({ message: "OpenAI proxy error", error: err.message });
    }
  });

  app.post("/api/maps-proxy", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });

      const mapsKey = process.env.GOOGLE_MAPS_API_KEY;
      if (!mapsKey) {
        return res.status(503).json({ message: "GOOGLE_MAPS_API_KEY is not configured" });
      }

      const { action, params } = req.body;
      if (!action) {
        return res.status(400).json({ message: "action is required (geocode, nearby, details)" });
      }

      let url: string;
      const queryParams = new URLSearchParams({ key: mapsKey });

      switch (action) {
        case "geocode": {
          if (!params?.address) {
            return res.status(400).json({ message: "params.address is required for geocode" });
          }
          queryParams.set("address", params.address);
          url = `https://maps.googleapis.com/maps/api/geocode/json?${queryParams.toString()}`;
          break;
        }
        case "nearby": {
          if (!params?.location || !params?.radius) {
            return res.status(400).json({ message: "params.location and params.radius are required for nearby search" });
          }
          queryParams.set("location", params.location);
          queryParams.set("radius", String(params.radius));
          if (params.type) queryParams.set("type", params.type);
          if (params.keyword) queryParams.set("keyword", params.keyword);
          url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${queryParams.toString()}`;
          break;
        }
        case "details": {
          if (!params?.place_id) {
            return res.status(400).json({ message: "params.place_id is required for details" });
          }
          queryParams.set("place_id", params.place_id);
          if (params.fields) queryParams.set("fields", params.fields);
          url = `https://maps.googleapis.com/maps/api/place/details/json?${queryParams.toString()}`;
          break;
        }
        default:
          return res.status(400).json({ message: `Unknown action: ${action}. Supported: geocode, nearby, details` });
      }

      const mapsResponse = await fetch(url);
      if (!mapsResponse.ok) {
        const errText = await mapsResponse.text();
        return res.status(mapsResponse.status).json({
          message: "Google Maps request failed",
          error: errText,
        });
      }

      const data = await mapsResponse.json();
      return res.json(data);
    } catch (err: any) {
      console.error("[maps-proxy] Error:", err);
      return res.status(502).json({ message: "Google Maps proxy error", error: err.message });
    }
  });

  app.get("/api/sms-blacklist", authenticateToken, requireRole(3), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const entries = await storage.getBlacklistByOrg(req.user.organizationId);
      return res.json(entries);
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch SMS blacklist" });
    }
  });

  app.delete("/api/sms-blacklist/:id", authenticateToken, requireRole(3), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const entries = await storage.getBlacklistByOrg(req.user.organizationId);
      const entry = entries.find(e => e.id === req.params.id);
      if (!entry) {
        return res.status(404).json({ message: "Blacklist entry not found" });
      }
      await storage.removeBlacklistEntry(req.params.id);
      return res.json({ message: "Blacklist entry removed" });
    } catch (err) {
      return res.status(500).json({ message: "Failed to remove blacklist entry" });
    }
  });

  app.use((err: any, req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ message: "File too large. Maximum upload size is 5MB." });
    }
    next(err);
  });

  setInterval(async () => {
    try {
      const unanswered = await storage.getUnansweredConversations(30);
      if (unanswered.length === 0) return;

      for (const conv of unanswered) {
        try {
          const org = await storage.getOrganization(conv.organizationId);
          if (!org || !org.emailEnabled) continue;

          const orgAdminRole = await storage.getRoleByName("org_admin");
          if (!orgAdminRole) continue;

          const orgUsers = await storage.getUsers(conv.organizationId);
          const orgAdmin = orgUsers.find(u => u.roleId === orgAdminRole.id && u.isActive);
          if (!orgAdmin) continue;

          const msgs = await storage.getMessages(conv.id);
          const latestMessage = msgs.length > 0 ? msgs[msgs.length - 1] : null;
          const messagePreview = latestMessage ? latestMessage.content.substring(0, 200) : "No message content";

          const contactName = conv.customerName || "Unknown";
          const contactPhone = conv.customerPhone || "Unknown";
          const waitingMinutes = conv.lastMessageAt
            ? Math.round((Date.now() - new Date(conv.lastMessageAt).getTime()) / 60000)
            : 0;

          if (process.env.RESEND_API_KEY) {
            const { Resend } = await import("resend");
            const resend = new Resend(process.env.RESEND_API_KEY);
            await resend.emails.send({
              from: "Nexxus Connect <no-reply@huminic.app>",
              to: orgAdmin.email,
              subject: `Unanswered message from ${contactName !== "Unknown" ? contactName : contactPhone} — ${org.name}`,
              html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1a1a1a;">Unanswered Message Alert</h2>
                <p>A customer message has been waiting for a response.</p>
                <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                  <tr><td style="padding: 8px; font-weight: bold; color: #555;">Contact Name</td><td style="padding: 8px;">${contactName}</td></tr>
                  <tr><td style="padding: 8px; font-weight: bold; color: #555;">Phone</td><td style="padding: 8px;">${contactPhone}</td></tr>
                  <tr><td style="padding: 8px; font-weight: bold; color: #555;">Channel</td><td style="padding: 8px;">${conv.channel}</td></tr>
                  <tr><td style="padding: 8px; font-weight: bold; color: #555;">Waiting</td><td style="padding: 8px;">${waitingMinutes} minutes</td></tr>
                </table>
                <div style="background: #f5f5f5; padding: 12px; border-radius: 6px; margin: 16px 0;">
                  <p style="margin: 0 0 4px 0; font-weight: bold; color: #555;">Latest Message:</p>
                  <p style="margin: 0; color: #333;">${messagePreview}${latestMessage && latestMessage.content.length > 200 ? "..." : ""}</p>
                </div>
                <p><a href="https://nexxus-connect.replit.app/teambox" style="display: inline-block; background: #2563eb; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none;">Open TeamBox</a></p>
                <p style="color: #888; font-size: 12px;">This is an automated escalation from Nexxus Connect for ${org.name}.</p>
              </div>`,
            });
            console.log(`[ESCALATION] Email sent to ${orgAdmin.email} for conversation ${conv.id} (${contactName})`);
          } else {
            console.log(`[ESCALATION] No RESEND_API_KEY — would email ${orgAdmin.email} for conversation ${conv.id}`);
          }

          await storage.markEscalationSent(conv.id);

          await storage.createNotification({
            userId: orgAdmin.id,
            organizationId: conv.organizationId,
            type: "escalation",
            title: `Unanswered message from ${contactName}`,
            message: `${contactName} (${contactPhone}) has been waiting ${waitingMinutes} minutes for a response on ${conv.channel}.`,
            relatedEntityType: "conversation",
            relatedEntityId: conv.id,
          });

          await storage.createActivityLog({
            userId: orgAdmin.id,
            organizationId: conv.organizationId,
            action: "escalation_email_sent",
            entityType: "conversation",
            entityId: conv.id,
            metadata: { contactName, contactPhone, waitingMinutes, channel: conv.channel },
          });
        } catch (convErr) {
          console.error(`[ESCALATION] Error processing conversation ${conv.id}:`, convErr);
        }
      }
    } catch (err) {
      console.error("[ESCALATION] Scheduler error:", err);
    }
  }, 5 * 60 * 1000);

  registerBillingRoutes(app);

  return httpServer;
}
