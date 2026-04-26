/**
 * Unit tests for server/lib/roleGuard.ts (I-246).
 *
 * Locks the role-level-assignment rule contract:
 *   - LOWER number = HIGHER privilege.
 *   - An actor can assign a role at their own level or LOWER privilege.
 *   - An actor CANNOT assign a role at HIGHER privilege.
 *
 * The pure helper is the load-bearing security check used at three sites in
 * server/routes/users.ts (POST /api/users, PATCH /api/users/:id, POST
 * /api/users/invite). Tests confirm extraction was behavior-preserving.
 */

import { describe, it, expect } from "vitest";
import { canAssignRole } from "@server/lib/roleGuard";

describe("canAssignRole", () => {
  // Level constants matching the codebase model (lower = more privileged).
  const SUPER_ADMIN = 1;
  const PARTNER_ADMIN = 2;
  const ORG_ADMIN = 3;
  const EXECUTIVE = 4;
  const SALES_MANAGER = 5;
  const SALES = 6;
  const SERVICE = 7;
  const MARKETING = 8;

  describe("blocks privilege escalation (the load-bearing security rule)", () => {
    it("[I-246] org_admin CANNOT assign super_admin", () => {
      expect(canAssignRole(ORG_ADMIN, SUPER_ADMIN)).toBe(false);
    });

    it("[I-246] org_admin CANNOT assign partner_admin", () => {
      expect(canAssignRole(ORG_ADMIN, PARTNER_ADMIN)).toBe(false);
    });

    it("partner_admin CANNOT assign super_admin", () => {
      expect(canAssignRole(PARTNER_ADMIN, SUPER_ADMIN)).toBe(false);
    });

    it("sales (level 6) CANNOT assign org_admin", () => {
      expect(canAssignRole(SALES, ORG_ADMIN)).toBe(false);
    });

    it("marketing (level 8) CANNOT assign anything above itself", () => {
      expect(canAssignRole(MARKETING, SUPER_ADMIN)).toBe(false);
      expect(canAssignRole(MARKETING, PARTNER_ADMIN)).toBe(false);
      expect(canAssignRole(MARKETING, ORG_ADMIN)).toBe(false);
      expect(canAssignRole(MARKETING, EXECUTIVE)).toBe(false);
      expect(canAssignRole(MARKETING, SALES_MANAGER)).toBe(false);
      expect(canAssignRole(MARKETING, SALES)).toBe(false);
      expect(canAssignRole(MARKETING, SERVICE)).toBe(false);
    });
  });

  describe("allows lateral and lower-privilege assignment", () => {
    it("super_admin can assign super_admin (lateral)", () => {
      expect(canAssignRole(SUPER_ADMIN, SUPER_ADMIN)).toBe(true);
    });

    it("super_admin can assign all other roles", () => {
      expect(canAssignRole(SUPER_ADMIN, PARTNER_ADMIN)).toBe(true);
      expect(canAssignRole(SUPER_ADMIN, ORG_ADMIN)).toBe(true);
      expect(canAssignRole(SUPER_ADMIN, EXECUTIVE)).toBe(true);
      expect(canAssignRole(SUPER_ADMIN, SALES_MANAGER)).toBe(true);
      expect(canAssignRole(SUPER_ADMIN, SALES)).toBe(true);
      expect(canAssignRole(SUPER_ADMIN, SERVICE)).toBe(true);
      expect(canAssignRole(SUPER_ADMIN, MARKETING)).toBe(true);
    });

    it("partner_admin can assign partner_admin (lateral)", () => {
      expect(canAssignRole(PARTNER_ADMIN, PARTNER_ADMIN)).toBe(true);
    });

    it("partner_admin can assign org_admin and below", () => {
      expect(canAssignRole(PARTNER_ADMIN, ORG_ADMIN)).toBe(true);
      expect(canAssignRole(PARTNER_ADMIN, EXECUTIVE)).toBe(true);
      expect(canAssignRole(PARTNER_ADMIN, SALES)).toBe(true);
      expect(canAssignRole(PARTNER_ADMIN, MARKETING)).toBe(true);
    });

    it("org_admin can assign org_admin (lateral)", () => {
      expect(canAssignRole(ORG_ADMIN, ORG_ADMIN)).toBe(true);
    });

    it("org_admin can assign executive, sales_manager, sales, service, marketing", () => {
      expect(canAssignRole(ORG_ADMIN, EXECUTIVE)).toBe(true);
      expect(canAssignRole(ORG_ADMIN, SALES_MANAGER)).toBe(true);
      expect(canAssignRole(ORG_ADMIN, SALES)).toBe(true);
      expect(canAssignRole(ORG_ADMIN, SERVICE)).toBe(true);
      expect(canAssignRole(ORG_ADMIN, MARKETING)).toBe(true);
    });

    it("marketing (level 8) can assign marketing (lateral edge)", () => {
      expect(canAssignRole(MARKETING, MARKETING)).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("equal levels return true (lateral assignment is allowed)", () => {
      for (let lvl = 1; lvl <= 10; lvl++) {
        expect(canAssignRole(lvl, lvl)).toBe(true);
      }
    });

    it("strict ordering across the full level range", () => {
      // For any pair, canAssignRole(a, b) === (b >= a)
      for (let a = 1; a <= 10; a++) {
        for (let b = 1; b <= 10; b++) {
          expect(canAssignRole(a, b)).toBe(b >= a);
        }
      }
    });
  });
});
