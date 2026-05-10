# S5 — I-249 self-deactivation — Delta 2 code trace + probe

**Wave:** 9-Sec
**Chunk:** S5
**Item:** I-249 self-deactivation guard (org_admin can lock themselves out)
**Fix commit:** `5a1b0c5`
**Severity:** MEDIUM (UX foot-gun affecting real dealership admins)

---

## Pre-fix code path (vulnerable)

`server/routes/users.ts` (PATCH `/api/users/:id` handler, parent of `5a1b0c5` shape):

```ts
// auth + role-can-assign checks ...

// (No self-mutation check.)

const allowedFields: Record<string, any> = {};
if (req.body.firstName !== undefined) allowedFields.firstName = req.body.firstName;
// ...
if (req.body.isActive !== undefined) allowedFields.isActive = req.body.isActive;
//                                                  ^^^^^^^^^^^^^^^^^^^^^^^^^^^
// ⚠ Pre-fix: actor's OWN id passed via :id with body {isActive:false}
//   resulted in their own row being deactivated. Once is_active=false, the
//   next request would 401 (token still valid in JWT, but DB row gates
//   subsequent queries via storage.getUser). Lockout. Only super_admin
//   could recover via a separate PATCH.
const updated = await storage.updateUser(req.params.id, allowedFields);
```

## Post-fix code path (`5a1b0c5`)

`server/routes/users.ts:194-201`:

```ts
// I-249 (Wave 9-Sec): forbid self-deactivation — only another admin
// can deactivate you. Prevents launch-week lockouts from a misclick.
if (isSelfDeactivationAttempt(req.user, req.params, req.body || {})) {
  return res.status(400).json({
    message: "Cannot deactivate yourself. Ask another admin to deactivate this account.",
  });
}

const allowedFields: Record<string, any> = {};
// ... rest unchanged
```

`server/lib/selfModifyGuard.ts:17-25` (the helper):

```ts
export function isSelfDeactivationAttempt(
  actor: { id: string } | null | undefined,
  targetParams: { id?: string | null | undefined },
  body: Record<string, unknown>,
): boolean {
  if (!actor || !actor.id) return false;
  if (!targetParams || actor.id !== targetParams.id) return false;
  return body?.isActive === false;
}
```

Three-condition gate:
1. Actor identified (`actor.id` exists).
2. Target == self (`actor.id === targetParams.id`).
3. Body explicitly sets `isActive === false`.

Re-activation (`isActive: true`) on self is harmless and intentionally NOT blocked. Cross-target deactivation by an admin against another user is also unaffected.

## Probe

```
$ curl -sS -X PATCH "http://localhost:5000/api/users/6249dbc6-bdbf-4dae-a962-04ae63002bea" \
    -H "Authorization: Bearer <serra-honda-admin-self-token>" \
    -H "Content-Type: application/json" \
    -d '{"isActive":false}'

HTTP 400
{"message":"Cannot deactivate yourself. Ask another admin to deactivate this account."}
```

DB cross-check:

```
PRE:  {"email":"serra_honda@huminic.ai", "is_active": true}
POST: {"email":"serra_honda@huminic.ai", "is_active": true}
```

Row UNCHANGED post-probe. The route returned 400 BEFORE reaching `updateUser`. Self-lockout averted.

---

## Verdict

**PASS.** The pure helper at `server/lib/selfModifyGuard.ts:17` is invoked at `server/routes/users.ts:197`. Self+isActive=false branch returns 400 with the expected operator-facing message; DB is not touched. Other paths (re-activation, cross-target deactivation) are intentionally unaffected — verified by the 11 vitests in `tests/unit/I-249-user-self-deactivation-guard.test.ts`.
