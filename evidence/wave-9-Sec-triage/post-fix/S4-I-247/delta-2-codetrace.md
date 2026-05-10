# S4 — I-247 org slug — Delta 2 code trace + probe

**Wave:** 9-Sec
**Chunk:** S4
**Item:** I-247 org slug writable via generic PATCH (silently breaks widget embeds)
**Fix commit:** `a0a354e`
**Severity:** MEDIUM (route-level fix per operator preference, dedicated `/slug` endpoint untouched)

---

## Pre-fix code path (vulnerable)

`server/routes/organizations.ts:360-388` (PRE-fix shape, recovered from `git show 5a1b0c5:server/routes/organizations.ts` — the parent of `a0a354e`):

```ts
app.patch("/api/organizations/:id", authenticateToken, requireRole(3), async (req, res) => {
  // ... auth checks ...
  const parsed = updateOrganizationSchema.safeParse(req.body);
  // ^^ updateOrganizationSchema = createInsertSchema(organizations)
  //      .omit({ id: true, createdAt: true, updatedAt: true }).partial();
  // ⚠ slug IS NOT omitted — it's an optional field in the partial schema
  if (!parsed.success) { ... }
  const org = await storage.updateOrganization(req.params.id as string, parsed.data);
  // ⚠ parsed.data may include {slug: "EVIL"}; storage.updateOrganization
  //   writes it directly to the organizations.slug column.
  // Silent corruption: widget embeds at https://app.huminic.com/widget/<slug>/...
  // suddenly resolve to a 404 or to a slug-redirect entry that never existed.
});
```

`shared/schema.ts:519` (unchanged — the schema itself still allows slug; the fix is route-level):

```ts
export const updateOrganizationSchema = createInsertSchema(organizations)
  .omit({ id: true, createdAt: true, updatedAt: true }).partial();
```

## Post-fix code path (`a0a354e`)

`server/routes/organizations.ts:366-376`:

```ts
app.patch("/api/organizations/:id", authenticateToken, requireRole(3), async (req, res) => {
  // ... auth checks ...
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
  // ✓ parsed.data CANNOT include slug — Zod silently drops unknown keys
  //   when the schema does not define them. (zod default behavior: strict
  //   omit.)
});
```

Diff in one line: `updateOrganizationSchema` → `updateOrganizationSchema.omit({ slug: true })` plus the comment.

## Dedicated rename endpoint preserved

`server/routes/organizations.ts:411-457` (`PATCH /api/organizations/:id/slug`) — UNTOUCHED by the fix. This endpoint:
- Lower-cases + sanitizes the new slug (line 419)
- Checks uniqueness with `getOrganizationBySlug` (line 422-425)
- Creates a 30-day `slugRedirect` row (line 434-439) so widget embeds at the OLD slug keep working
- Writes via `updateOrganizationSlug` (line 440), not the generic `updateOrganization`
- Emits a `slug_changed` activity log (line 442-449)

The fix narrows the attack surface to ONLY the proper rename path.

## Probe (one curl, demonstrates fix in effect)

```
$ curl -sS -X PATCH "http://localhost:5000/api/organizations/24d64f99-ba04-4b43-af35-fd06f555ac86" \
    -H "Authorization: Bearer <serra-honda-admin-token>" \
    -H "Content-Type: application/json" \
    -d '{"slug":"NEW-EVIL-SLUG"}'

HTTP 200
{"id":"24d64f99-ba04-4b43-af35-fd06f555ac86","name":"Serra Honda","slug":"serra-honda",...,"updatedAt":"2026-05-10T19:09:13.229Z"}
```

DB cross-check (independent psql query):

```
PRE:  {"id":"24d6...","slug":"serra-honda", "updated_at":"2026-05-10T19:06:11.747Z"}
POST: {"id":"24d6...","slug":"serra-honda", "updated_at":"2026-05-10T19:09:13.229Z"}
```

Slug field UNCHANGED. `updated_at` advanced (the row WAS touched), proving the request reached the route — but the slug specifically was stripped before the DB write.

---

## Verdict

**PASS.** Route-level `omit({slug:true})` correctly silently strips the slug from generic PATCH payloads, while the dedicated `/slug` endpoint remains the only safe rename path with redirect + audit log. Both vitests + endpoint probe + DB diff confirm the fix.
