import type { Express } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import { authenticateToken, requireRole } from "../auth";
import { storage, db } from "../storage";
import { updateOrganizationSchema, integrations } from "@shared/schema";
import { eq } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Pure helpers — exported for unit tests; no IO.
// ---------------------------------------------------------------------------

/** Slim org shape used by the pure list resolver (matches what GET /api/organizations returns). */
export interface OrgListEntry {
  id: string;
  name: string;
  slug: string;
}

/** Slim org shape the resolver reads from. */
export interface OrgListSourceOrg {
  id: string;
  name: string;
  slug: string;
  partnerId?: string | null;
}

/** Slim user shape (req.user). */
export interface OrgListUser {
  id: string;
  organizationId: string;
  roleLevel: number;
}

/** Slim fullUser shape (only the field this resolver reads). */
export interface OrgListFullUser {
  additionalOrgIds?: string[] | null;
}

/**
 * Resolution discriminator the route handler uses to decide which DB calls
 * to make and how to map the result. Pure / synchronous.
 *
 * - `all-orgs`: super_admin (level 1) — return every org.
 * - `partner-group`: partner_admin (level 2) — return parent org + all
 *    partner-group children.
 * - `multi-store-org-admin`: org_admin (level 3) with non-empty
 *    additionalOrgIds — return primary + additional orgs.
 * - `own-org`: any other case — return just the user's own org.
 */
export type OrgListResolution =
  | { kind: "all-orgs" }
  | { kind: "partner-group"; groupParentId: string }
  | { kind: "multi-store-org-admin"; accessibleIds: Set<string> }
  | { kind: "own-org" };

/**
 * Decide which resolution path applies to this user. Pure — no IO. The route
 * handler then drives the DB calls accordingly. The decision logic mirrors
 * the original three-branch route handler exactly.
 *
 * For partner_admin (level 2) the resolution determines `groupParentId`:
 *   - If allOrgs contains children whose partnerId === user.organizationId,
 *     groupParentId = user.organizationId (user IS the partner-group parent).
 *   - Otherwise, if the user's own org has a non-null partnerId, groupParentId
 *     falls back to that partnerId (user is a member of the partner-group).
 *   - Otherwise groupParentId = user.organizationId (degenerate single-org).
 *
 * For org_admin (level 3) the resolution depends on fullUser:
 *   - If fullUser.additionalOrgIds is a non-empty array, multi-store-org-admin
 *     with accessibleIds = {primary, ...additional}.
 *   - Otherwise own-org.
 */
export function resolveOrgListPath(
  user: OrgListUser,
  allOrgs: OrgListSourceOrg[],
  fullUser: OrgListFullUser | null | undefined,
): OrgListResolution {
  // Level 1 — super_admin: all orgs
  if (user.roleLevel === 1) {
    return { kind: "all-orgs" };
  }

  // Level 2 — partner_admin: partner group orgs only
  if (user.roleLevel === 2) {
    let groupParentId = user.organizationId;
    const children = allOrgs.filter((o) => o.partnerId === groupParentId);
    if (children.length === 0) {
      const userOrg = allOrgs.find((o) => o.id === user.organizationId);
      if (userOrg?.partnerId) {
        groupParentId = userOrg.partnerId;
      }
    }
    return { kind: "partner-group", groupParentId };
  }

  // Level 3 — org_admin: primary + additionalOrgIds, else own org
  if (user.roleLevel === 3) {
    const additionalOrgIds = fullUser?.additionalOrgIds ?? [];
    if (Array.isArray(additionalOrgIds) && additionalOrgIds.length > 0) {
      const accessibleIds = new Set<string>([user.organizationId, ...additionalOrgIds]);
      return { kind: "multi-store-org-admin", accessibleIds };
    }
  }

  // Level 3+ (no additional orgs) and below: own org only
  return { kind: "own-org" };
}

/**
 * Given a resolution and the org dataset, return the slim org list to send
 * back to the client. Pure — no IO. The own-org case requires the route
 * handler to fetch a single org by id; this helper handles only the cases
 * that operate on the allOrgs list.
 */
export function applyOrgListResolution(
  resolution: OrgListResolution,
  user: OrgListUser,
  allOrgs: OrgListSourceOrg[],
): OrgListEntry[] {
  if (resolution.kind === "all-orgs") {
    return allOrgs.map((o) => ({ id: o.id, name: o.name, slug: o.slug }));
  }
  if (resolution.kind === "partner-group") {
    return allOrgs
      .filter((o) => o.id === resolution.groupParentId || o.partnerId === resolution.groupParentId)
      .map((o) => ({ id: o.id, name: o.name, slug: o.slug }));
  }
  if (resolution.kind === "multi-store-org-admin") {
    return allOrgs
      .filter((o) => resolution.accessibleIds.has(o.id))
      .map((o) => ({ id: o.id, name: o.name, slug: o.slug }));
  }
  // own-org — caller resolves via storage.getOrganization(user.organizationId)
  // and maps to a single-entry list (or empty list if not found). The pure
  // helper cannot answer this case without hitting storage; return [] as a
  // sentinel and let the caller override.
  void user;
  return [];
}

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
  partnerId: z.string().uuid().optional().nullable(),
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
      if (req.user.roleLevel > 2) {
        return res.status(403).json({ message: "Only super admins and partner admins can create organizations" });
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
        partnerId: requestedPartnerId,
      } = parsed.data;

      const existingUser = await storage.getUserByEmail(adminEmail);
      if (existingUser) {
        return res.status(409).json({ message: "A user with that admin email already exists" });
      }

      const slug = orgName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const existingOrg = await storage.getOrganizationBySlug(slug);
      const finalSlug = existingOrg ? `${slug}-${Date.now()}` : slug;

      // Determine partnerId: partner_admin auto-sets to their org, super_admin can pass explicitly
      let resolvedPartnerId: string | null = null;
      if (req.user.roleLevel === 2) {
        // partner_admin: automatically set partnerId to their own organization
        resolvedPartnerId = req.user.organizationId;
      } else if (req.user.roleLevel === 1 && requestedPartnerId) {
        // super_admin: use the explicitly provided partnerId
        resolvedPartnerId = requestedPartnerId;
      }

      const enabledTools = tools || {} as Record<string, boolean>;
      const org = await storage.createOrganization({
        name: orgName.trim(),
        slug: finalSlug,
        personaName: agentName || "Serra",
        partnerId: resolvedPartnerId,
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

      // Pure logic lives in resolveOrgListPath() / applyOrgListResolution()
      // above; this branch only handles IO. Performance characteristics of
      // the original handler are preserved:
      //   - super_admin (1) / partner_admin (2): one storage.getOrganizations()
      //   - org_admin (3) with additionalOrgIds:
      //       storage.getUser(id) + storage.getOrganizations()
      //   - org_admin (3) without additionalOrgIds:
      //       storage.getUser(id) + storage.getOrganization(orgId)  (NO full scan)
      //   - level 4+: storage.getOrganization(orgId) only
      const userView: OrgListUser = {
        id: req.user.id,
        organizationId: req.user.organizationId,
        roleLevel: req.user.roleLevel,
      };
      const fullUser = req.user.roleLevel === 3 ? await storage.getUser(req.user.id) : null;
      // For levels 1/2 fetch allOrgs unconditionally. For level 3 fetch only
      // when additionalOrgIds is non-empty. For level 4+ never fetch allOrgs.
      const orgAdminHasAdditional =
        req.user.roleLevel === 3 &&
        Array.isArray(fullUser?.additionalOrgIds) &&
        (fullUser?.additionalOrgIds?.length ?? 0) > 0;
      const allOrgs =
        req.user.roleLevel <= 2 || orgAdminHasAdditional
          ? await storage.getOrganizations()
          : [];
      const resolution = resolveOrgListPath(userView, allOrgs, fullUser);
      if (resolution.kind === "own-org") {
        const org = await storage.getOrganization(req.user.organizationId);
        return res.json(org ? [{ id: org.id, name: org.name, slug: org.slug }] : []);
      }
      return res.json(applyOrgListResolution(resolution, userView, allOrgs));
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
      // I-247 (Wave 9-Sec): slug renames must go through the dedicated
      // PATCH /api/organizations/:id/slug endpoint below (uniqueness check +
      // audit log). Strip slug from the generic update payload so an
      // org_admin cannot silently break widget embeds / landing pages by
      // PATCHing slug through this route.
      const updateSchemaNoSlug = updateOrganizationSchema.omit({ slug: true });
      const parsed = updateSchemaNoSlug.safeParse(req.body);
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

  // GET /api/integrations/:orgId/vin-config
  app.get("/api/integrations/:orgId/vin-config", authenticateToken, requireRole(3), async (req, res) => {
    try {
      const orgId = req.params.orgId as string;
      const [record] = await db
        .select({
          dealerId: integrations.externalDealerId,
          defaultVinUserId: integrations.defaultVinUserId,
          dealerName: integrations.externalDealerName,
        })
        .from(integrations)
        .where(eq(integrations.organizationId, orgId));

      if (!record) {
        return res.status(404).json({ message: "No integration found for this organization" });
      }
      return res.json(record);
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch VIN config" });
    }
  });

  // PATCH /api/integrations/:orgId/vin-config
  app.patch("/api/integrations/:orgId/vin-config", authenticateToken, requireRole(3), async (req, res) => {
    try {
      const orgId = req.params.orgId as string;
      const { defaultVinUserId } = req.body;

      if (defaultVinUserId === undefined || typeof defaultVinUserId !== "number") {
        return res.status(400).json({ message: "defaultVinUserId must be a number" });
      }

      const result = await db
        .update(integrations)
        .set({ defaultVinUserId, updatedAt: new Date() })
        .where(eq(integrations.organizationId, orgId))
        .returning({
          dealerId: integrations.externalDealerId,
          defaultVinUserId: integrations.defaultVinUserId,
          dealerName: integrations.externalDealerName,
        });

      if (!result.length) {
        return res.status(404).json({ message: "No integration found for this organization" });
      }
      return res.json(result[0]);
    } catch (err) {
      return res.status(500).json({ message: "Failed to update VIN config" });
    }
  });
}
