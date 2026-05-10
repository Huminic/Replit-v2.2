/**
 * Regression tests for I-244 (IDOR cross-tenant lead leak).
 *
 * Vulnerability: GET /api/vin/leads/summary previously accepted
 * `?orgId=<uuid>` from any authenticated user and used it verbatim. An
 * org_admin (roleLevel = 3) of org A could pass org B's UUID and read
 * org B's lead summary.
 *
 * Fix (server/vendorProxy.ts ~line 555): handler now delegates to
 * `resolveEffectiveOrgId` which ignores `req.query.orgId` for roleLevel > 2
 * and forces `req.user.organizationId`. Only roleLevel <= 2
 * (super_admin / partner_admin) may use the override.
 */

import { describe, it, expect } from "vitest";
import { resolveEffectiveOrgId } from "@server/lib/tenantScope";

describe("resolveEffectiveOrgId (I-244 IDOR fix)", () => {
  const ORG_A = "org-A-uuid";
  const ORG_B = "org-B-uuid";

  describe("blocks cross-tenant override for roleLevel > 2", () => {
    it("[I-244] org_admin (level 3) of org A passing ?orgId=org-B is forced to org A", () => {
      expect(resolveEffectiveOrgId(3, ORG_B, ORG_A)).toBe(ORG_A);
    });

    it("[I-244] executive (level 4) cannot override", () => {
      expect(resolveEffectiveOrgId(4, ORG_B, ORG_A)).toBe(ORG_A);
    });

    it("[I-244] sales_manager (level 5) cannot override", () => {
      expect(resolveEffectiveOrgId(5, ORG_B, ORG_A)).toBe(ORG_A);
    });

    it("[I-244] sales (level 6) cannot override", () => {
      expect(resolveEffectiveOrgId(6, ORG_B, ORG_A)).toBe(ORG_A);
    });

    it("[I-244] marketing (level 8) cannot override", () => {
      expect(resolveEffectiveOrgId(8, ORG_B, ORG_A)).toBe(ORG_A);
    });

    it("[I-244] org_admin with no query override stays on own org", () => {
      expect(resolveEffectiveOrgId(3, undefined, ORG_A)).toBe(ORG_A);
    });

    it("[I-244] org_admin with empty-string override stays on own org", () => {
      expect(resolveEffectiveOrgId(3, "", ORG_A)).toBe(ORG_A);
    });
  });

  describe("allows override for cross-org roles (roleLevel <= 2)", () => {
    it("super_admin (level 1) of org A may target org B", () => {
      expect(resolveEffectiveOrgId(1, ORG_B, ORG_A)).toBe(ORG_B);
    });

    it("partner_admin (level 2) of org A may target org B", () => {
      expect(resolveEffectiveOrgId(2, ORG_B, ORG_A)).toBe(ORG_B);
    });

    it("super_admin with no query falls back to own org", () => {
      expect(resolveEffectiveOrgId(1, undefined, ORG_A)).toBe(ORG_A);
    });

    it("partner_admin with empty-string override falls back to own org", () => {
      expect(resolveEffectiveOrgId(2, "", ORG_A)).toBe(ORG_A);
    });
  });
});
