import type { Express } from "express";
import bcrypt from "bcrypt";
import rateLimit from "express-rate-limit";
import { storage } from "../storage";
import {
  authenticateToken,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  getAccessTokenExpirySeconds,
  getRefreshTokenExpiryDate,
  setRefreshCookie,
  clearRefreshCookie,
  getRefreshTokenFromCookie,
} from "../auth";
import { rotateRefreshToken } from "../lib/refreshTokenRotation";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '100'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later' },
  keyGenerator: (req) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return ip.replace(/:\d+$/, '');
  },
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function registerAuthRoutes(app: Express) {
  app.post("/api/auth/login", authLimiter, async (req, res) => {
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
        storage.createActivityLog({
          userId: user.id,
          organizationId: user.organizationId,
          action: "login_failed",
          entityType: "user",
          entityId: email.toLowerCase(),
          metadata: { category: "security", reason: "invalid_password" },
        }).catch(() => {});

        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        storage.countRecentSecurityEvents("login_failed", email.toLowerCase(), oneHourAgo).then(async (failCount) => {
          if (failCount >= 5) {
            try {
              const orgUsers = await storage.getUsers(user.organizationId);
              for (const u of orgUsers) {
                if (u.role && u.role.level <= 3) {
                  await storage.createNotification({
                    userId: u.id,
                    organizationId: user.organizationId,
                    type: "security_alert",
                    title: "Multiple failed login attempts detected",
                    message: `${failCount} failed login attempts for ${email.toLowerCase()} in the last hour.`,
                  });
                  break;
                }
              }
            } catch {}
          }
        }).catch(() => {});

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

      // Clear any existing sessions for this user to prevent unique constraint
      // violations when the same user logs in twice in rapid succession (the JWT
      // iat granularity is 1 second, so identical payloads within the same second
      // would produce duplicate refresh tokens).
      await storage.deleteUserSessions(user.id);

      await storage.createSession({
        userId: user.id,
        refreshToken,
        expiresAt: getRefreshTokenExpiryDate(),
      });

      // Set refresh token as httpOnly cookie (never exposed to JS)
      setRefreshCookie(res, refreshToken);

      let accessibleOrganizations = null;
      if (role.level === 1) {
        // Super Admin: all orgs
        const allOrgs = await storage.getOrganizations();
        accessibleOrganizations = allOrgs.map(o => ({
          id: o.id,
          name: o.name,
          slug: o.slug,
        }));
      } else if (role.level === 2) {
        // Partner Admin: find the group root (the org that has child orgs), then show root + children.
        // If the user is ON the group root (e.g. Cage), children exist directly.
        // If the user switched to a child (e.g. Serra Honda), walk UP via partnerId to find root.
        // Never include the top-level org above the group root (e.g. Huminic).
        const allOrgs = await storage.getOrganizations();
        let groupParentId = user.organizationId;
        const children = allOrgs.filter(o => o.partnerId === groupParentId);
        if (children.length === 0) {
          // User is on a child org — walk UP to find the group root
          const userOrg = allOrgs.find(o => o.id === user.organizationId);
          if (userOrg?.partnerId) {
            groupParentId = userOrg.partnerId;
          }
        }
        accessibleOrganizations = allOrgs
          .filter(o => o.id === groupParentId || o.partnerId === groupParentId)
          .map(o => ({ id: o.id, name: o.name, slug: o.slug }));
      } else if (role.level === 3 && user.additionalOrgIds && user.additionalOrgIds.length > 0) {
        // Org Admin with additional org access
        const accessibleIds = new Set([user.organizationId, ...user.additionalOrgIds]);
        const allOrgs = await storage.getOrganizations();
        accessibleOrganizations = allOrgs
          .filter(o => accessibleIds.has(o.id))
          .map(o => ({ id: o.id, name: o.name, slug: o.slug }));
      }

      return res.json({
        accessToken,
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
      clearRefreshCookie(res);
      return res.json({ message: "Logged out successfully" });
    } catch (err) {
      return res.status(500).json({ message: "Logout failed" });
    }
  });

  app.post("/api/auth/refresh", async (req, res) => {
    try {
      // Read refresh token from httpOnly cookie (primary) or body (legacy fallback)
      const refreshToken = getRefreshTokenFromCookie(req) || req.body?.refreshToken;

      // Rotation logic — including the concurrent-rotation fallback for
      // the unique-violation race documented in
      // server/lib/refreshTokenRotation.ts (Priority #3 fix). The route
      // is a thin Express adapter over the pure helper so the race can
      // be unit-tested without HTTP/DB scaffolding.
      const result = await rotateRefreshToken(refreshToken, {
        storage,
        generateAccessToken,
        generateRefreshToken,
        verifyRefreshToken: (t) => verifyToken(t, 'refresh') as { userId: string },
        getRefreshTokenExpiryDate,
        getAccessTokenExpirySeconds,
      });

      if (result.kind === "ok") {
        setRefreshCookie(res, result.refreshToken);
        return res.json({
          accessToken: result.accessToken,
          expiresIn: result.expiresIn,
          user: result.user,
        });
      }

      if (result.cookie === "clear") {
        clearRefreshCookie(res);
      }
      return res.status(result.status).json({ message: result.message });
    } catch (err) {
      // Loud catch — pre-fix this swallowed the underlying error and made
      // the unique-violation race invisible. Log the actual exception so
      // future failures don't require trace-archaeology to diagnose.
      console.error("[auth/refresh] unhandled error:", err);
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

      const { organizationId } = req.body;
      const org = await storage.getOrganization(organizationId);
      if (!org) return res.status(404).json({ message: "Organization not found" });

      // Get the user's home org and full record (before any switches)
      const user = await storage.getUser(req.user.id);
      if (!user) return res.status(404).json({ message: "User not found" });

      if (req.user.roleLevel === 1) {
        // Super Admin: allow any org
      } else if (req.user.roleLevel === 2) {
        // Partner Admin: validate target org belongs to their partner group
        // Find group root: if current org has children, it's the root; otherwise walk UP
        const allOrgs = await storage.getOrganizations();
        let groupParentId = user.organizationId;
        const children = allOrgs.filter(o => o.partnerId === groupParentId);
        if (children.length === 0) {
          const userOrg = allOrgs.find(o => o.id === user.organizationId);
          if (userOrg?.partnerId) {
            groupParentId = userOrg.partnerId;
          }
        }
        const partnerOrgs = allOrgs.filter(o => o.id === groupParentId || o.partnerId === groupParentId);
        if (!partnerOrgs.find(o => o.id === organizationId)) {
          return res.status(403).json({ message: "You can only access organizations in your partner group" });
        }
      } else if (req.user.roleLevel === 3) {
        // Org Admin: check additionalOrgIds
        const additionalOrgs = user.additionalOrgIds || [];
        if (organizationId !== user.organizationId && !additionalOrgs.includes(organizationId)) {
          return res.status(403).json({ message: "You do not have access to this organization" });
        }
      } else {
        return res.status(403).json({ message: "Only partner admins and above can switch organizations" });
      }

      // Org switch is session-only via JWT — do not persist to user record

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

      // Set refresh token as httpOnly cookie
      setRefreshCookie(res, refreshToken);

      const role = await storage.getRole(req.user.roleId);
      const safeUser = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: role ? { id: role.id, name: role.name, level: role.level } : null,
        organization: { id: org.id, name: org.name },
      };

      return res.json({
        accessToken,
        expiresIn: getAccessTokenExpirySeconds(),
        user: safeUser,
        organization: { id: org.id, name: org.name },
        fullRefresh: true,
      });
    } catch (err) {
      return res.status(500).json({ message: "Failed to switch organization" });
    }
  });

  app.post("/api/auth/forgot-password", authLimiter, async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    try {
      const user = await storage.getUserByEmail(email);
      if (user) {
        const { randomBytes, createHash } = await import("crypto");
        const token = randomBytes(32).toString("hex");
        const tokenHash = createHash("sha256").update(token).digest("hex");
        const expiry = new Date(Date.now() + 60 * 60 * 1000);
        await storage.updateUser(user.id, { resetToken: tokenHash, resetTokenExpiry: expiry } as any);

        const org = await storage.getOrganization(user.organizationId);
        const commGateOpen = org?.outboundEnabled && org?.emailEnabled;

        if (!commGateOpen) {
          console.log(`[AUTH] Password reset token generated for ${email} — CommGate blocked email delivery`);
        } else {
          const resetUrl = `${req.protocol}://${req.get("host")}/reset-password?token=${token}`;
          if (process.env.RESEND_API_KEY) {
            const { Resend } = await import("resend");
            const resend = new Resend(process.env.RESEND_API_KEY);
            await resend.emails.send({
              from: "Nexxus Connect <notifications@huminic.ai>",
              to: user.email,
              subject: "Password Reset — Nexxus Connect",
              html: `<p>Hi ${escapeHtml(user.firstName)},</p><p>Click the link below to reset your password. This link expires in 1 hour.</p><p><a href="${escapeHtml(resetUrl)}">${escapeHtml(resetUrl)}</a></p><p>If you did not request this, ignore this email.</p>`,
            });
            console.log(`[AUTH] Password reset email sent to ${email}`);
          } else {
            console.log(`[AUTH] Password reset token generated for ${email} — no RESEND_API_KEY configured`);
          }
        }
      }
      return res.json({ message: "If an account exists with that email, a reset link has been sent." });
    } catch (err) {
      console.error("[AUTH] Forgot password error:", err);
      return res.json({ message: "If an account exists with that email, a reset link has been sent." });
    }
  });

  app.post("/api/auth/reset-password", authLimiter, async (req, res) => {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: "Token and password are required" });

    // Server-side password strength validation (matches client requirements)
    if (password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters" });
    if (!/[A-Z]/.test(password)) return res.status(400).json({ message: "Password must contain at least 1 uppercase letter" });
    if (!/[0-9]/.test(password)) return res.status(400).json({ message: "Password must contain at least 1 number" });
    if (!/[^A-Za-z0-9]/.test(password)) return res.status(400).json({ message: "Password must contain at least 1 special character" });

    try {
      // Hash the incoming token to compare against stored hash
      const { createHash } = await import("crypto");
      const tokenHash = createHash("sha256").update(token).digest("hex");
      const found = await storage.findUserByResetToken(tokenHash);
      if (!found) return res.status(400).json({ message: "Invalid or expired reset token" });
      if (!found.resetTokenExpiry || new Date(found.resetTokenExpiry) < new Date()) {
        return res.status(400).json({ message: "Reset token has expired" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await storage.updateUser(found.id, { password: hashedPassword });
      await storage.clearResetToken(found.id);

      // Invalidate all sessions (force re-login with new password)
      await storage.deleteUserSessions(found.id);

      storage.createActivityLog({
        userId: found.id,
        organizationId: found.organizationId,
        action: "password_reset_completed",
        entityType: "user",
        entityId: found.id,
        metadata: { category: "security", email: found.email },
      }).catch(() => {});

      console.log(`[AUTH] Password reset completed for user ${found.email}`);
      return res.json({ message: "Password has been reset successfully." });
    } catch (err: any) {
      console.error("[AUTH] Reset password error:", err?.message || err, err?.stack);
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
      if (newPassword.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }
      if (!/[A-Z]/.test(newPassword)) {
        return res.status(400).json({ message: "Password must contain at least 1 uppercase letter" });
      }
      if (!/[0-9]/.test(newPassword)) {
        return res.status(400).json({ message: "Password must contain at least 1 number" });
      }
      if (!/[^A-Za-z0-9]/.test(newPassword)) {
        return res.status(400).json({ message: "Password must contain at least 1 special character" });
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
}
