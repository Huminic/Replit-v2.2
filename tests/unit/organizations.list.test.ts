/**
 * Regression tests for GET /api/organizations org-list resolution logic.
 *
 * Covers the helper pair extracted from server/routes/organizations.ts:
 *   - resolveOrgListPath(user, allOrgs, fullUser)
 *   - applyOrgListResolution(resolution, user, allOrgs)
 *
 * Scenarios per parent's Change 3 spec:
 *   (a) Multi-store org_admin with non-empty additionalOrgIds
 *       -> resolution.kind = "multi-store-org-admin"
 *       -> applyOrgListResolution returns primary + additional orgs
 *   (b) Single-store org_admin (no additionalOrgIds, or empty array)
 *       -> resolution.kind = "own-org"
 *       -> route handler reads a single org by id (own-org branch returns []
 *          from applyOrgListResolution; the test asserts the resolution kind)
 *   (c) Non-org_admin roles
 *       (c1) super_admin (level 1)        -> all orgs
 *       (c2) partner_admin (level 2)      -> partner-group; additionalOrgIds
 *                                             does NOT leak into the result
 *                                             even if the user record carries
 *                                             one (defense in depth)
 *       (c3) sales/marketing/service (4+) -> own-org
 *
 * No DB writes. No HTTP. Pure helper unit tests on synthetic fixtures.
 */

import { describe, it, expect } from "vitest";

import {
  resolveOrgListPath,
  applyOrgListResolution,
  type OrgListSourceOrg,
  type OrgListUser,
  type OrgListFullUser,
} from "@server/routes/organizations";

// ---------------------------------------------------------------------------
// Fixtures — mirror the Cage Automotive shape from .claude/session.md but
// with synthetic UUIDs so tests are deterministic and DB-independent.
// ---------------------------------------------------------------------------

const ORG_HUMINIC = "00000000-0000-0000-0000-000000000001";
const ORG_CAGE = "00000000-0000-0000-0000-000000000010";
const ORG_SERRA_HONDA = "00000000-0000-0000-0000-000000000020";
const ORG_SERRA_NISSAN = "00000000-0000-0000-0000-000000000021";
const ORG_SERRA_FORD = "00000000-0000-0000-0000-000000000022";
const ORG_HYUNDAI_COL = "00000000-0000-0000-0000-000000000023";
const ORG_FORD_COL = "00000000-0000-0000-0000-000000000024";
const ORG_UNRELATED = "00000000-0000-0000-0000-000000000099";

const ALL_ORGS: OrgListSourceOrg[] = [
  { id: ORG_HUMINIC, name: "Huminic", slug: "huminic", partnerId: null },
  { id: ORG_CAGE, name: "Cage Automotive", slug: "cage-automotive", partnerId: null },
  { id: ORG_SERRA_HONDA, name: "Serra Honda", slug: "serra-honda", partnerId: ORG_CAGE },
  { id: ORG_SERRA_NISSAN, name: "Serra Nissan", slug: "serra-nissan", partnerId: ORG_CAGE },
  { id: ORG_SERRA_FORD, name: "Tony Serra Ford", slug: "tony-serra-ford", partnerId: ORG_CAGE },
  { id: ORG_HYUNDAI_COL, name: "Hyundai of Columbia", slug: "hyundai-of-columbia", partnerId: ORG_CAGE },
  { id: ORG_FORD_COL, name: "Ford of Columbia", slug: "ford-of-columbia", partnerId: ORG_CAGE },
  // Unrelated org outside the Cage partner-group (for partner_admin leak check)
  { id: ORG_UNRELATED, name: "Unrelated Dealer", slug: "unrelated", partnerId: null },
];

function makeUser(over: Partial<OrgListUser> = {}): OrgListUser {
  return {
    id: "user-id-default",
    organizationId: ORG_SERRA_HONDA,
    roleLevel: 3,
    ...over,
  };
}

// ---------------------------------------------------------------------------
// Scenario (a) — Multi-store org_admin
// ---------------------------------------------------------------------------

describe("[a] org_admin with non-empty additionalOrgIds (multi-store)", () => {
  it("resolution kind is multi-store-org-admin with primary + additional in accessibleIds", () => {
    const user = makeUser({ id: "victoria", organizationId: ORG_SERRA_HONDA, roleLevel: 3 });
    const fullUser: OrgListFullUser = { additionalOrgIds: [ORG_SERRA_NISSAN, ORG_SERRA_FORD] };
    const resolution = resolveOrgListPath(user, ALL_ORGS, fullUser);
    expect(resolution.kind).toBe("multi-store-org-admin");
    if (resolution.kind !== "multi-store-org-admin") return;
    expect(Array.from(resolution.accessibleIds).sort()).toEqual(
      [ORG_SERRA_HONDA, ORG_SERRA_NISSAN, ORG_SERRA_FORD].sort(),
    );
  });

  it("applyOrgListResolution returns primary + additional orgs (slim shape)", () => {
    const user = makeUser({ id: "victoria", organizationId: ORG_SERRA_HONDA, roleLevel: 3 });
    const fullUser: OrgListFullUser = { additionalOrgIds: [ORG_SERRA_NISSAN, ORG_SERRA_FORD] };
    const resolution = resolveOrgListPath(user, ALL_ORGS, fullUser);
    const result = applyOrgListResolution(resolution, user, ALL_ORGS);
    const ids = result.map((o) => o.id).sort();
    expect(ids).toEqual([ORG_SERRA_HONDA, ORG_SERRA_NISSAN, ORG_SERRA_FORD].sort());
    // slim shape: id/name/slug only — no partnerId leak
    for (const o of result) {
      expect(Object.keys(o).sort()).toEqual(["id", "name", "slug"]);
    }
  });

  it("primary org id is included even if not duplicated in additionalOrgIds", () => {
    const user = makeUser({ id: "victoria", organizationId: ORG_SERRA_HONDA, roleLevel: 3 });
    const fullUser: OrgListFullUser = { additionalOrgIds: [ORG_SERRA_NISSAN] };
    const resolution = resolveOrgListPath(user, ALL_ORGS, fullUser);
    if (resolution.kind !== "multi-store-org-admin") throw new Error("expected multi-store");
    expect(resolution.accessibleIds.has(ORG_SERRA_HONDA)).toBe(true);
    expect(resolution.accessibleIds.has(ORG_SERRA_NISSAN)).toBe(true);
  });

  it("orgs not in accessibleIds are filtered out", () => {
    const user = makeUser({ id: "victoria", organizationId: ORG_SERRA_HONDA, roleLevel: 3 });
    const fullUser: OrgListFullUser = { additionalOrgIds: [ORG_SERRA_NISSAN] };
    const resolution = resolveOrgListPath(user, ALL_ORGS, fullUser);
    const result = applyOrgListResolution(resolution, user, ALL_ORGS);
    const ids = result.map((o) => o.id);
    expect(ids).not.toContain(ORG_HUMINIC);
    expect(ids).not.toContain(ORG_CAGE);
    expect(ids).not.toContain(ORG_UNRELATED);
    expect(ids).not.toContain(ORG_SERRA_FORD);
    expect(ids).not.toContain(ORG_HYUNDAI_COL);
    expect(ids).not.toContain(ORG_FORD_COL);
  });

  it("duplicate primary id in additionalOrgIds is deduplicated by Set", () => {
    const user = makeUser({ id: "victoria", organizationId: ORG_SERRA_HONDA, roleLevel: 3 });
    const fullUser: OrgListFullUser = { additionalOrgIds: [ORG_SERRA_HONDA, ORG_SERRA_NISSAN] };
    const resolution = resolveOrgListPath(user, ALL_ORGS, fullUser);
    const result = applyOrgListResolution(resolution, user, ALL_ORGS);
    expect(result.filter((o) => o.id === ORG_SERRA_HONDA)).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Scenario (b) — Single-store org_admin
// ---------------------------------------------------------------------------

describe("[b] org_admin with no additionalOrgIds (single-store)", () => {
  it("fullUser missing additionalOrgIds entirely -> own-org", () => {
    const user = makeUser({ id: "serra-honda-admin", organizationId: ORG_SERRA_HONDA, roleLevel: 3 });
    const fullUser: OrgListFullUser = {};
    const resolution = resolveOrgListPath(user, ALL_ORGS, fullUser);
    expect(resolution.kind).toBe("own-org");
  });

  it("fullUser with additionalOrgIds=null -> own-org", () => {
    const user = makeUser({ id: "serra-honda-admin", organizationId: ORG_SERRA_HONDA, roleLevel: 3 });
    const fullUser: OrgListFullUser = { additionalOrgIds: null };
    const resolution = resolveOrgListPath(user, ALL_ORGS, fullUser);
    expect(resolution.kind).toBe("own-org");
  });

  it("fullUser with additionalOrgIds=[] -> own-org", () => {
    const user = makeUser({ id: "serra-honda-admin", organizationId: ORG_SERRA_HONDA, roleLevel: 3 });
    const fullUser: OrgListFullUser = { additionalOrgIds: [] };
    const resolution = resolveOrgListPath(user, ALL_ORGS, fullUser);
    expect(resolution.kind).toBe("own-org");
  });

  it("fullUser missing entirely (null/undefined) -> own-org", () => {
    const user = makeUser({ id: "serra-honda-admin", organizationId: ORG_SERRA_HONDA, roleLevel: 3 });
    expect(resolveOrgListPath(user, ALL_ORGS, null).kind).toBe("own-org");
    expect(resolveOrgListPath(user, ALL_ORGS, undefined).kind).toBe("own-org");
  });

  it("applyOrgListResolution for own-org returns [] (caller fetches single org)", () => {
    const user = makeUser({ id: "serra-honda-admin", organizationId: ORG_SERRA_HONDA, roleLevel: 3 });
    const resolution = resolveOrgListPath(user, ALL_ORGS, { additionalOrgIds: [] });
    expect(applyOrgListResolution(resolution, user, ALL_ORGS)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Scenario (c) — Non-org_admin roles (defense in depth — no leak)
// ---------------------------------------------------------------------------

describe("[c1] super_admin (level 1) -> all orgs", () => {
  it("resolution kind is all-orgs", () => {
    const user = makeUser({ id: "duane.wells", organizationId: ORG_HUMINIC, roleLevel: 1 });
    const resolution = resolveOrgListPath(user, ALL_ORGS, null);
    expect(resolution.kind).toBe("all-orgs");
  });

  it("returns every org in the system", () => {
    const user = makeUser({ id: "duane.wells", organizationId: ORG_HUMINIC, roleLevel: 1 });
    const resolution = resolveOrgListPath(user, ALL_ORGS, null);
    const result = applyOrgListResolution(resolution, user, ALL_ORGS);
    expect(result).toHaveLength(ALL_ORGS.length);
    expect(result.map((o) => o.id).sort()).toEqual(ALL_ORGS.map((o) => o.id).sort());
  });

  it("super_admin's user record carrying additionalOrgIds does NOT change the resolution", () => {
    const user = makeUser({ id: "duane.wells", organizationId: ORG_HUMINIC, roleLevel: 1 });
    const fullUser: OrgListFullUser = { additionalOrgIds: [ORG_SERRA_NISSAN] };
    const resolution = resolveOrgListPath(user, ALL_ORGS, fullUser);
    expect(resolution.kind).toBe("all-orgs");
  });
});

describe("[c2] partner_admin (level 2) -> partner-group only", () => {
  it("user IS the partner-group parent (children whose partnerId === user.organizationId)", () => {
    const user = makeUser({ id: "duanekwells", organizationId: ORG_CAGE, roleLevel: 2 });
    const resolution = resolveOrgListPath(user, ALL_ORGS, null);
    expect(resolution.kind).toBe("partner-group");
    if (resolution.kind !== "partner-group") return;
    expect(resolution.groupParentId).toBe(ORG_CAGE);
  });

  it("returns parent + all children, excludes Huminic and unrelated", () => {
    const user = makeUser({ id: "duanekwells", organizationId: ORG_CAGE, roleLevel: 2 });
    const resolution = resolveOrgListPath(user, ALL_ORGS, null);
    const result = applyOrgListResolution(resolution, user, ALL_ORGS);
    const ids = result.map((o) => o.id).sort();
    expect(ids).toEqual(
      [ORG_CAGE, ORG_SERRA_HONDA, ORG_SERRA_NISSAN, ORG_SERRA_FORD, ORG_HYUNDAI_COL, ORG_FORD_COL].sort(),
    );
    expect(ids).not.toContain(ORG_HUMINIC);
    expect(ids).not.toContain(ORG_UNRELATED);
  });

  it("user is a member of a partner-group (not the parent) — falls back to org.partnerId", () => {
    // Synthetic case: an L2 user assigned to Serra Honda directly. With no
    // children whose partnerId === Serra Honda, the resolver should fall back
    // to Serra Honda's own partnerId (= ORG_CAGE) and return the full Cage
    // group. (Defense-in-depth check; the production data model places L2
    // users at the parent org, but the fallback exists.)
    const user = makeUser({ id: "l2-edge", organizationId: ORG_SERRA_HONDA, roleLevel: 2 });
    const resolution = resolveOrgListPath(user, ALL_ORGS, null);
    expect(resolution.kind).toBe("partner-group");
    if (resolution.kind !== "partner-group") return;
    expect(resolution.groupParentId).toBe(ORG_CAGE);
    const result = applyOrgListResolution(resolution, user, ALL_ORGS);
    const ids = result.map((o) => o.id);
    expect(ids).toContain(ORG_CAGE);
    expect(ids).toContain(ORG_SERRA_HONDA);
    expect(ids).not.toContain(ORG_HUMINIC);
    expect(ids).not.toContain(ORG_UNRELATED);
  });

  it("partner_admin's additionalOrgIds does NOT leak into result (defense in depth)", () => {
    // If a partner_admin user record happened to carry additionalOrgIds (e.g.
    // role demotion artifact), that should not influence the resolution.
    const user = makeUser({ id: "duanekwells", organizationId: ORG_CAGE, roleLevel: 2 });
    const fullUser: OrgListFullUser = { additionalOrgIds: [ORG_UNRELATED] };
    const resolution = resolveOrgListPath(user, ALL_ORGS, fullUser);
    expect(resolution.kind).toBe("partner-group");
    const result = applyOrgListResolution(resolution, user, ALL_ORGS);
    expect(result.map((o) => o.id)).not.toContain(ORG_UNRELATED);
  });
});

describe("[c3] sales/marketing/service (level 4+) -> own-org", () => {
  for (const level of [4, 5, 6, 7, 8]) {
    it(`level ${level} -> own-org`, () => {
      const user = makeUser({ id: `user-l${level}`, organizationId: ORG_SERRA_HONDA, roleLevel: level });
      const resolution = resolveOrgListPath(user, ALL_ORGS, null);
      expect(resolution.kind).toBe("own-org");
    });
  }

  it(`level-4 user with additionalOrgIds does NOT trigger multi-store`, () => {
    const user = makeUser({ id: "sales-edge", organizationId: ORG_SERRA_HONDA, roleLevel: 4 });
    const fullUser: OrgListFullUser = { additionalOrgIds: [ORG_SERRA_NISSAN] };
    const resolution = resolveOrgListPath(user, ALL_ORGS, fullUser);
    expect(resolution.kind).toBe("own-org");
  });
});

// ---------------------------------------------------------------------------
// Slim-shape contract — every result entry has only id/name/slug
// ---------------------------------------------------------------------------

describe("slim shape contract — id/name/slug only, no partnerId leak", () => {
  it("all-orgs result strips partnerId", () => {
    const user = makeUser({ roleLevel: 1 });
    const resolution = resolveOrgListPath(user, ALL_ORGS, null);
    const result = applyOrgListResolution(resolution, user, ALL_ORGS);
    for (const o of result) {
      expect(Object.keys(o).sort()).toEqual(["id", "name", "slug"]);
      expect((o as any).partnerId).toBeUndefined();
    }
  });

  it("partner-group result strips partnerId", () => {
    const user = makeUser({ organizationId: ORG_CAGE, roleLevel: 2 });
    const resolution = resolveOrgListPath(user, ALL_ORGS, null);
    const result = applyOrgListResolution(resolution, user, ALL_ORGS);
    for (const o of result) {
      expect(Object.keys(o).sort()).toEqual(["id", "name", "slug"]);
    }
  });

  it("multi-store result strips partnerId", () => {
    const user = makeUser({ organizationId: ORG_SERRA_HONDA, roleLevel: 3 });
    const resolution = resolveOrgListPath(user, ALL_ORGS, { additionalOrgIds: [ORG_SERRA_NISSAN] });
    const result = applyOrgListResolution(resolution, user, ALL_ORGS);
    for (const o of result) {
      expect(Object.keys(o).sort()).toEqual(["id", "name", "slug"]);
    }
  });
});
