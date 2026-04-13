import type { Express } from "express";
import bcrypt from "bcrypt";
import multer from "multer";
import os from "os";
import fs from "fs";
import { z } from "zod";
import { authenticateToken, requireRole } from "../auth";
import { storage } from "../storage";
import { updateUserProfileSchema } from "@shared/schema";

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

export function registerUserRoutes(app: Express) {
  app.get("/api/users", authenticateToken, requireRole(3), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const userList = await storage.getUsers(req.user.organizationId);
      const sanitized = userList.map(({ password, ...rest }) => rest);
      return res.json(sanitized);
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch users" });
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

      if (process.env.OUTBOUND_LIVE_ENABLED !== "true") {
        console.log(`[Users] Welcome email skipped — OUTBOUND_LIVE_ENABLED is not true`);
      } else if (!commGateOpen) {
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
              html: `<h2>Welcome to ${escapeHtml(org?.name || "Nexxus Connect")}!</h2>
                <p>Hi ${escapeHtml(firstName)},</p>
                <p>Your account has been created for <strong>${escapeHtml(org?.name || "Nexxus Connect")}</strong> by ${escapeHtml(req.user!.firstName)} ${escapeHtml(req.user!.lastName)}.</p>
                <p>You can log in using your email address: <strong>${escapeHtml(email)}</strong></p>
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

      const targetUser = await storage.getUser(req.params.id as string);
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
      if (req.body.additionalOrgIds !== undefined && req.user.roleLevel <= 2) {
        // Only Super Admin and Partner Admin can set additional org access
        if (Array.isArray(req.body.additionalOrgIds)) {
          allowedFields.additionalOrgIds = req.body.additionalOrgIds;
        } else if (req.body.additionalOrgIds === null) {
          allowedFields.additionalOrgIds = null;
        }
      }

      const updated = await storage.updateUser(req.params.id as string, allowedFields);
      if (!updated) return res.status(404).json({ message: "User not found" });

      const { password: _, ...safeUser } = updated;

      storage.createActivityLog({
        userId: req.user!.id,
        organizationId: req.user!.organizationId,
        action: "user_updated",
        entityType: "user",
        entityId: req.params.id as string,
        metadata: { fields: Object.keys(allowedFields).join(", ") },
      }).catch(() => {});

      if (allowedFields.roleId && allowedFields.roleId !== targetUser.roleId) {
        storage.createActivityLog({
          userId: req.user!.id,
          organizationId: req.user!.organizationId,
          action: "role_changed",
          entityType: "user",
          entityId: req.params.id as string,
          metadata: {
            category: "security",
            previousRoleId: targetUser.roleId,
            newRoleId: allowedFields.roleId,
            targetEmail: targetUser.email,
          },
        }).catch(() => {});
      }

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

      const targetUser = await storage.getUser(req.params.id as string);
      if (!targetUser) return res.status(404).json({ message: "User not found" });
      if (targetUser.organizationId !== req.user.organizationId && req.user.roleLevel > 2) {
        return res.status(403).json({ message: "Access denied" });
      }

      const targetRole = await storage.getRole(targetUser.roleId);
      if (targetRole && targetRole.level < req.user.roleLevel) {
        return res.status(403).json({ message: "Cannot reset password for a user with higher privileges than your own" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(req.params.id as string, { password: hashedPassword });
      await storage.deleteUserSessions(req.params.id as string);

      return res.json({ message: "Password has been reset" });
    } catch (err) {
      return res.status(500).json({ message: "Failed to reset password" });
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

      const fileBuffer = fs.readFileSync(file.path);
      const base64 = fileBuffer.toString("base64");
      const dataUrl = `data:${file.mimetype};base64,${base64}`;

      const base64Size = Buffer.byteLength(dataUrl, "utf-8");
      if (base64Size > 200 * 1024) {
        return res.status(400).json({ message: "Photo is too large after encoding. Please compress or resize to under 200KB." });
      }

      const updated = await storage.updateUser(req.user.id, { profilePhotoUrl: dataUrl });
      if (!updated) return res.status(404).json({ message: "User not found" });

      return res.json({ profilePhotoUrl: dataUrl });
    } catch (err) {
      return res.status(500).json({ message: "Failed to upload photo" });
    } finally {
      if (req.file?.path) {
        try { fs.unlinkSync(req.file.path); } catch {}
      }
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

      if (process.env.OUTBOUND_LIVE_ENABLED !== "true") {
        console.log(`[Users] Welcome email skipped — OUTBOUND_LIVE_ENABLED is not true`);
      } else if (!commGateOpen) {
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
              from: "Nexxus Connect <no-reply@huminic.app>",
              to: email,
              subject: `You've been invited to ${org?.name || "Nexxus Connect"}`,
              html: `<h2>Welcome to ${escapeHtml(org?.name || "Nexxus Connect")}!</h2>
                <p>${escapeHtml(req.user.firstName)} ${escapeHtml(req.user.lastName)} has invited you to join their organization.</p>
                <p>Your temporary credentials:</p>
                <ul>
                  <li><strong>Email:</strong> ${escapeHtml(email)}</li>
                  <li><strong>Password:</strong> ${escapeHtml(tempPassword)}</li>
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
        console.log(`[Invite] No RESEND_API_KEY configured. Invite created for ${email} (password not logged)`);
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
}
