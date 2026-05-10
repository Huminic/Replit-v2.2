/**
 * Regression tests for I-247 (org slug writable via generic PATCH).
 *
 * Vulnerability: PATCH /api/organizations/:id at
 * server/routes/organizations.ts:360 validated with `updateOrganizationSchema`
 * (shared/schema.ts:519), which omitted only `id` / `createdAt` /
 * `updatedAt`. That left `slug` as a valid write field. An org_admin could
 * PATCH their org's slug through the generic route, silently breaking
 * widget embeds and landing pages that reference the org by slug.
 *
 * A dedicated slug-rename endpoint with uniqueness check + audit log
 * already exists at server/routes/organizations.ts:405
 * (PATCH /api/organizations/:id/slug) — that is the intended path.
 *
 * Fix (route-level, not schema-level — see Wave 9-Sec S4 commit message):
 * the generic route derives `updateOrganizationSchema.omit({ slug: true })`
 * inline before parsing, so any slug field in the body is stripped at the
 * validation layer and never reaches storage.updateOrganization.
 *
 * This test proves the omit-pattern works on the imported schema. The
 * inline omit in the route is the same line of code as in the test.
 */

import { describe, it, expect } from "vitest";
import { updateOrganizationSchema } from "@shared/schema";

describe("updateOrganizationSchema.omit({ slug: true }) (I-247)", () => {
  const schema = updateOrganizationSchema.omit({ slug: true });

  it("[I-247] non-slug field passes through (name)", () => {
    const result = schema.safeParse({ name: "New Name" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ name: "New Name" });
      expect("slug" in result.data).toBe(false);
    }
  });

  it("[I-247] allowed boolean flag passes through (outboundEnabled)", () => {
    const result = schema.safeParse({ outboundEnabled: true });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.outboundEnabled).toBe(true);
    }
  });

  it("[I-247] body with name AND slug — slug must NOT reach parsed.data", () => {
    const result = schema.safeParse({ name: "New Name", slug: "new-slug" });
    // Either the schema rejects (success:false) or it strips slug
    // (success:true with no slug in data). Both achieve the security goal:
    // slug never reaches storage.updateOrganization via this route.
    if (result.success) {
      expect("slug" in result.data).toBe(false);
      expect(result.data).toEqual({ name: "New Name" });
    } else {
      // Strict-mode rejection — also acceptable.
      expect(result.success).toBe(false);
    }
  });

  it("[I-247] body with ONLY slug — slug must NOT reach parsed.data", () => {
    const result = schema.safeParse({ slug: "evil-slug" });
    if (result.success) {
      expect("slug" in result.data).toBe(false);
      expect(result.data).toEqual({});
    } else {
      expect(result.success).toBe(false);
    }
  });

  it("[I-247] mixed allowed + slug payload: slug stripped, other fields preserved", () => {
    const result = schema.safeParse({
      name: "Serra Honda",
      personaName: "Serra",
      slug: "hijacked",
      outboundEnabled: true,
    });
    if (result.success) {
      expect("slug" in result.data).toBe(false);
      expect(result.data.name).toBe("Serra Honda");
      expect(result.data.personaName).toBe("Serra");
      expect(result.data.outboundEnabled).toBe(true);
    } else {
      expect(result.success).toBe(false);
    }
  });

  it("[I-247] empty body is valid (no fields, no errors)", () => {
    const result = schema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe("updateOrganizationSchema (unmodified) — sanity check that slug WAS accepted pre-fix", () => {
  it("[I-247] base schema (no omit) accepts slug — confirming the vulnerability surface", () => {
    const result = updateOrganizationSchema.safeParse({ slug: "x" });
    expect(result.success).toBe(true);
    if (result.success) {
      // Pre-fix, this is exactly the payload that would have reached
      // storage.updateOrganization — proving the route-level omit is the
      // load-bearing gate.
      expect(result.data.slug).toBe("x");
    }
  });
});
