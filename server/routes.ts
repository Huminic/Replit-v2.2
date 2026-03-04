import type { Express } from "express";
import { type Server } from "http";
import bcrypt from "bcrypt";
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
import {
  insertAgentSchema,
  updateAgentSchema,
  updateOrganizationSchema,
  updateUserProfileSchema,
  updateCampaignSchema,
} from "@shared/schema";

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
      const agentList = await storage.getAgents(req.user.organizationId);
      return res.json(agentList);
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch agents" });
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

  app.get("/api/campaigns", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const campaignList = await storage.getCampaigns(req.user.organizationId);
      return res.json(campaignList);
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch campaigns" });
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
      return res.json(campaign);
    } catch (err) {
      return res.status(500).json({ message: "Failed to update campaign" });
    }
  });

  return httpServer;
}
