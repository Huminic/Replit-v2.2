import type { Express } from "express";
import { type Server } from "http";
import bcrypt from "bcrypt";
import Anthropic from "@anthropic-ai/sdk";
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
  updateAgentSchema,
  updateOrganizationSchema,
  updateUserProfileSchema,
  updateCampaignSchema,
} from "@shared/schema";
import { z } from "zod";
import { registerVendorRoutes, callMCP, resolveNexxusOrgId } from "./vendorProxy";

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

const updateConversationSchema = z.object({
  status: z.string().optional(),
  campaignDisconnected: z.boolean().optional(),
  unreadCount: z.number().optional(),
  assignedTo: z.string().nullable().optional(),
});

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

      const user = await storage.getUserByEmail(email);
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

    const user = await storage.getUserByEmail(email);
    if (user) {
      console.log(`[AUTH] Password reset requested for ${email} — reset link would be sent here`);
    }
    return res.json({ message: "If an account exists with that email, a reset link has been sent." });
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: "Token and password are required" });
    console.log(`[AUTH] Password reset attempted with token — stub implementation`);
    return res.json({ message: "Password reset functionality coming in production." });
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
      return res.status(201).json(safeUser);
    } catch (err) {
      return res.status(500).json({ message: "Failed to create user" });
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

  app.post("/api/agents", authenticateToken, requireRole(3), async (req, res) => {
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
      return res.json({ message: "Agent deleted" });
    } catch (err) {
      return res.status(500).json({ message: "Failed to delete agent" });
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
      return res.json(org);
    } catch (err) {
      return res.status(500).json({ message: "Failed to update organization" });
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
      return res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.get("/api/conversations", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const filters: { status?: string; channel?: string } = {};
      if (req.query.status) filters.status = req.query.status as string;
      if (req.query.channel) filters.channel = req.query.channel as string;

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
      return res.json(campaignList);
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  app.post("/api/campaigns", authenticateToken, requireRole(3), async (req, res) => {
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
      return res.status(201).json(campaign);
    } catch (err) {
      return res.status(500).json({ message: "Failed to create campaign" });
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
      return res.json(campaign);
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch campaign" });
    }
  });

  registerVendorRoutes(app);

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
      return res.json(campaign);
    } catch (err) {
      return res.status(500).json({ message: "Failed to update campaign" });
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

  app.post("/api/chat/:conversationId/stream", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });

      const { conversationId } = req.params;
      const { content, agentId } = req.body;

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

      const [org, orgUsers, orgAgents] = await Promise.all([
        storage.getOrganization(req.user.organizationId),
        storage.getUsers(req.user.organizationId),
        storage.getAgents(req.user.organizationId, {}),
      ]);
      const orgName = org?.name || "Nexxus Connect";
      const personaName = org?.personaName || "Automa";

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
- When citing search results, be natural — incorporate the information conversationally, don't just dump raw results${agentContext}`;

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

      const firstResponse = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        system: systemPrompt,
        messages: currentMessages,
        tools: [webSearchTool],
      });

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
              res.write(`data: ${JSON.stringify({ type: "status", text: "Searching the web..." })}\n\n`);

              let resultText: string;
              try {
                const results = await braveWebSearch((block.input as { query: string }).query, 3);
                resultText = results.map((r, i) => `[${i + 1}] ${r.title}\n${r.url}\n${r.description}`).join("\n\n");
              } catch (searchErr) {
                resultText = "Web search temporarily unavailable. Answer from your existing knowledge.";
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
            tools: [webSearchTool],
          });
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

  return httpServer;
}
