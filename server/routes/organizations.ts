import type { Express } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import { authenticateToken, requireRole } from "../auth";
import { storage } from "../storage";
import { updateOrganizationSchema } from "@shared/schema";

const createOrgSchema = z.object({
  orgName: z.string().min(1, "Organization name is required").max(200),
  industry: z.string().optional(),
  size: z.string().optional(),
  website: z.string().optional(),
  publicListing: z.boolean().optional(),
  multiLocation: z.boolean().optional(),
  primaryPhone: z.string().min(1, "Primary phone is required"),
  primaryEmail: z.string().email("Valid primary email is required"),
  address1: z.string().optional(),
  address2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  timezone: z.string().optional(),
  businessHoursStart: z.string().optional(),
  businessHoursEnd: z.string().optional(),
  adminFirstName: z.string().min(1, "Admin first name is required"),
  adminLastName: z.string().min(1, "Admin last name is required"),
  adminEmail: z.string().email("Valid admin email is required"),
  adminPhone: z.string().optional(),
  adminRole: z.string().optional(),
  tempPassword: z.string().min(6, "Password must be at least 6 characters"),
  sendWelcomeEmail: z.boolean().optional(),
  billingEnabled: z.boolean().optional(),
  anniversaryDate: z.string().optional(),
  baseMonthlyFee: z.number().optional(),
  voiceMinutes: z.number().optional(),
  videoMinutes: z.number().optional(),
  smsMessages: z.number().optional(),
  setupFee: z.number().optional(),
  tools: z.record(z.boolean()).optional(),
  agentName: z.string().optional(),
  agentPersona: z.string().optional(),
  agentChannel: z.string().optional(),
  autoRespond: z.boolean().optional(),
  deployImmediately: z.boolean().optional(),
  skills: z.any().optional(),
});

export function registerOrganizationRoutes(app: Express) {
  app.post("/api/organizations", authenticateToken, requireRole(2), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      if (req.user.roleLevel > 1) {
        return res.status(403).json({ message: "Only super admins can create organizations" });
      }

      const parsed = createOrgSchema.safeParse(req.body);
      if (!parsed.success) {
        const errors = parsed.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        return res.status(400).json({ message: "Validation failed", errors });
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
      } = parsed.data;

      const existingUser = await storage.getUserByEmail(adminEmail);
      if (existingUser) {
        return res.status(409).json({ message: "A user with that admin email already exists" });
      }

      const slug = orgName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const existingOrg = await storage.getOrganizationBySlug(slug);
      const finalSlug = existingOrg ? `${slug}-${Date.now()}` : slug;

      const enabledTools = tools || {} as Record<string, boolean>;
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
        } as any, // TODO: type properly when schema updated — jsonb column types from Drizzle don't accept plain objects directly
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
      const org = await storage.getOrganization(req.params.id as string);
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
      const org = await storage.updateOrganization(req.params.id as string, parsed.data);
      if (!org) return res.status(404).json({ message: "Organization not found" });

      storage.createActivityLog({
        userId: req.user!.id,
        organizationId: req.user!.organizationId,
        action: "organization_updated",
        entityType: "organization",
        entityId: req.params.id as string,
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
            relatedEntityId: req.params.id as string,
          }).catch(() => {});
        }
      }

      return res.json(org);
    } catch (err: any) {
      console.error("Failed to update organization:", err.message || err);
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

      const org = await storage.getOrganization(req.params.id as string);
      if (!org) return res.status(404).json({ message: "Organization not found" });
      const oldSlug = org.slug;

      if (oldSlug !== slugFormatted) {
        const thirtyDaysLater = new Date();
        thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
        await storage.createSlugRedirect({
          organizationId: req.params.id as string,
          oldSlug,
          newSlug: slugFormatted,
          expiresAt: thirtyDaysLater,
        });
        await storage.updateOrganizationSlug(req.params.id as string, slugFormatted);

        storage.createActivityLog({
          userId: req.user!.id,
          organizationId: req.user!.organizationId,
          action: "slug_changed",
          entityType: "organization",
          entityId: req.params.id as string,
          metadata: { oldSlug, newSlug: slugFormatted },
        }).catch(() => {});
      }

      const updated = await storage.getOrganization(req.params.id as string);
      return res.json(updated);
    } catch (err) {
      return res.status(500).json({ message: "Failed to update slug" });
    }
  });
}
