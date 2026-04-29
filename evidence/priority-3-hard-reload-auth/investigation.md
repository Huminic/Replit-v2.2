# Priority #3 — Hard reload auth failure (`/teambox`, `/service`, `/settings?section=ai`)

**Phase 1 investigation only — no code edited.**
**Date:** 2026-04-27
**Investigator:** harness-orchestrator (Opus 4.7) on `wave-pe3`
**Bundle under test:** `dist/public/assets/index-8V3hbYib.js` (built 2026-04-27 08:18 UTC)
**Server under test:** `pm2 nexxus-app` (uptime 11h, dev) → `https://dev.huminicdev.com`

---

## TL;DR

The `3581187` fix IS shipped (in source AND in the deployed dev bundle). It is correct as far as it goes. But it does not fix the failing test because the failure is **server-side, not client-side**.

A unique-key race in the `/api/auth/refresh` route returns HTTP 500 to one of two concurrent refresh requests. When the bootstrap path's refresh returns 500, `tryRefreshToken` resolves to `false`, `setAccessTokenState` is never called, `isAuthenticated` stays false, and `ProtectedRoute` redirects to `/login`. The fix from `3581187` (mirror tokenStore into React state after a successful refresh) only runs when `tryRefreshToken` returns true — so on this code path it's a no-op.

Reproduced live: 16/30 (~53%) of paired-parallel `/api/auth/refresh` calls return 500 on dev right now.

---

## 1. Reproduction

### 1.1 Test that fails

`tests/e2e/s99-codex-launch-readiness-readonly.spec.ts:76-88`

```ts
test("hard reloads preserve auth on launch-critical routes", async ({ page }) => {
  test.setTimeout(90000);
  const deepLinks = ["/teambox", "/service", "/settings?section=ai"];

  await loginForBrowser(page, testUsers.orgAdmin, deepLinks[0]);

  for (const path of deepLinks) {
    await page.goto(path, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.reload({ waitUntil: "domcontentloaded", timeout: 30000 });
    await waitForUsablePage(page);
    await expect(page, `${path} should remain authenticated after reload`).not.toHaveURL(/\/login/);
  }
});
```

### 1.2 Live failure

```
$ BASE_URL=https://dev.huminicdev.com npx playwright test \
    tests/e2e/s99-codex-launch-readiness-readonly.spec.ts:76 \
    --project=sprint --reporter=list

✘  1 [sprint] › … › hard reloads preserve auth on launch-critical routes (10.4s)

Error: /teambox should remain authenticated after reload
Expected pattern: not /\/login/
Received string: "https://dev.huminicdev.com/login"
Timeout: 5000ms
```

### 1.3 Trace summary (from `test-results/.../trace.zip`)

Decoded network sequence around the failure:

| t (ms after login) | event | URL | status | notes |
|---|---|---|---|---|
| 0     | POST `/api/auth/login`              | 200 | cookie A set |
| 1010  | POST `/api/auth/refresh` (initial)  | 200 | cookie B set (rotation) |
| 1544  | GET `/api/auth/me`                  | 200 | bootstrap OK, page renders |
| 3062  | GET `/teambox` (page.goto)          | 200 | full nav |
| 3154  | POST `/api/auth/refresh` (call A)   | -1  | aborted by reload |
| 3186  | GET `/teambox` (page.reload)        | 200 | full nav |
| 3274  | POST `/api/auth/refresh` (call B)   | **500** | ← failure |

Server log mirror (`pm2 logs nexxus-app --out`):
```
7:47:34 PM [express] POST /api/auth/refresh 200 in 525ms
…
7:47:36 PM [express] POST /api/auth/refresh 500 in 520ms   ← matches
```

Server `nexxus-app-error.log` is silent for this 500 — the route's `catch` (line 297) does not log the underlying exception.

### 1.4 Direct race repro (no Playwright, just curl)

```
30 paired-parallel POSTs to /api/auth/refresh (same fresh cookie for each pair):
  Total failures across 30 attempts: 16
  Failure mode: one of the two responses is `{"message":"Token refresh failed"}` (500)
```

---

## 2. Root cause

### 2.1 The race in `server/routes/auth.ts:197–300`

```ts
app.post("/api/auth/refresh", async (req, res) => {
  try {
    const refreshToken = getRefreshTokenFromCookie(req) || req.body?.refreshToken;
    …
    const session = await storage.getSessionByRefreshToken(refreshToken);   // line 206
    if (!session || session.expiresAt < new Date()) { … concurrent-rotation fallback … }
    verifyToken(refreshToken, 'refresh');
    const user = await storage.getUser(session.userId);
    …
    await storage.deleteSession(session.id);                                // line 265
    const newAccessToken  = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);             // line 274
    await storage.createSession({ refreshToken: newRefreshToken, … });      // line 276
    setRefreshCookie(res, newRefreshToken);
    return res.json({ accessToken: newAccessToken, … });
  } catch (err) {
    return res.status(500).json({ message: "Token refresh failed" });       // line 298 — swallows err
  }
});
```

`shared/schema.ts:` (sessions table)
```ts
export const sessions = pgTable("sessions", {
  …
  refreshToken: text("refresh_token").notNull().unique(),
  …
});
```

### 2.2 Why two concurrent refreshes deadlock-collide

When two requests arrive with the same cookie value `T0` (call A and call B):

1. Both pass `getSessionByRefreshToken(T0)` → both find session `S0`.
2. Both pass `verifyToken(T0, 'refresh')`.
3. Both look up user/role/org (success).
4. Both call `await storage.deleteSession(S0.id)`. Postgres: first wins (1 row affected); second is a no-op (0 rows). No error from `deleteSession` because Drizzle's `delete().where()` returns `void` regardless of rows-affected.
5. Both call `generateRefreshToken({ userId, organizationId, roleId })`. The `iat` claim is integer **seconds**. With identical payloads inside the same second, the JWTs produced are **byte-identical**.

   Verified directly:
   ```
   const t1 = jwt.sign(payload, SECRET, { expiresIn: '7d' });
   const t2 = jwt.sign(payload, SECRET, { expiresIn: '7d' });
   t1 === t2   // true
   ```

6. Both call `await storage.createSession({ refreshToken: <same JWT>, … })`. The `unique()` index on `sessions.refresh_token` lets one insert succeed; the other throws `duplicate key value violates unique constraint "sessions_refresh_token_unique"`.
7. The thrown error bubbles to the outer `catch` (line 297) → `res.status(500).json({ message: "Token refresh failed" })`. Underlying error is **swallowed without logging**.

### 2.3 Why this breaks the test

Client side, `client/src/lib/queryClient.ts:26-58`:
```ts
export async function tryRefreshToken(): Promise<boolean> {
  …
  refreshPromise = (async () => {
    try {
      const res = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
      if (!res.ok) return false;                       // <-- 500 → false
      const data = await res.json();
      setAccessToken(data.accessToken, data.expiresIn);
      return true;
    } catch { return false; }
  })();
  …
}
```

When `/api/auth/refresh` returns 500, `tryRefreshToken` resolves to **`false`**. Bootstrap path in `client/src/contexts/AuthContext.tsx:289–338`:

```ts
if (success) {                                          // false → branch skipped
  …
  setAccessTokenState(token);                          // <— the 3581187 fix; not reached
  await fetchUser(token);
}
…
setLoading(false);
```

`accessTokenState` stays `null`, `user` stays `null`, `isAuthenticated = !!user && !!accessTokenState` is **false**, `ProtectedRoute` renders `<Redirect to="/login" />`. URL becomes `/login`. Test fails.

### 2.4 Why two refreshes fire in the test

The test sequence runs `page.goto(path)` immediately followed by `page.reload(path)` with no wait between them:

- `page.goto('/teambox')` triggers a fresh JS context. `initAuth` runs. `tryRefreshToken` POSTs `/api/auth/refresh` (call A).
- Before call A's response is delivered, `page.reload()` discards the JS context. The browser may abort the in-flight XHR client-side, **but the server has already received and is processing it**.
- New JS context (post-reload). `initAuth` runs again. `tryRefreshToken` POSTs `/api/auth/refresh` (call B). The browser cookie still carries the same refresh token from before call A's `Set-Cookie` arrived (or call A's response was discarded).
- Server now has two in-flight handlers for the same `T0`, both racing toward the same `createSession(T1)`. Race outcome ~53% on dev right now.

In production users with normal browsing this race fires whenever:
- Sidebar/route changes are followed quickly by a reload.
- Multiple tabs hard-reload at once.
- The browser pre-fetches or restores a session that triggers a parallel refresh.

So this isn't a test artefact — it's a real customer-facing flake on hard reload.

---

## 3. Why `3581187` did not fix this

`3581187` ("fix(auth): sync accessTokenState in initAuth so deep-link reload does not redirect to /login") added one line of behavior:

```diff
   if (success) {
     const { getAccessToken } = await import('@/lib/tokenStore');
     const token = getAccessToken();
     if (token) {
+      setAccessTokenState(token);
       await fetchUser(token);
     }
   }
```

That fix is correct. It was needed. It IS in the deployed bundle (verified by structural fingerprint in `dist/public/assets/index-8V3hbYib.js` — the minified `i(R)` call before `await y(R)` matches `setAccessTokenState(token)` before `fetchUser(token)`).

**But it only runs inside `if (success)`. When the server returns 500, `success` is `false`, and the entire block is skipped.**

The original `3581187` symptom report said:

> 1. tryRefreshToken() POSTs /api/auth/refresh — server returns 200 + new access token

That premise (server returns 200) holds for **isolated** reloads. It does not hold for **rapid back-to-back** reloads, which is what the Codex test exercises. Under the rapid pattern, the server returns 500 to one of the two parallel refreshes ~53% of the time.

So `3581187` fixed one bug. There is a second, server-side bug behind it.

---

## 4. Proposed narrow fix shape

**Server-only.** Two minimal changes in `server/routes/auth.ts`:

### 4.1 Make refresh-token rotation idempotent under concurrent calls

The cleanest fix is to **detect the unique-key collision** and treat it the same way the existing concurrent-rotation fallback (line 207-243) treats a missing session: look up the most recent session for the user, mint a new access token, and return 200 with that session's refresh token.

Concretely (one possible shape — final wording up to operator):

```ts
try {
  await storage.createSession({
    userId: user.id,
    refreshToken: newRefreshToken,
    expiresAt: getRefreshTokenExpiryDate(),
  });
} catch (err: any) {
  // Concurrent refresh produced an identical JWT (same iat second, same payload)
  // OR raced ahead of us in committing. Fall back to the most-recent session.
  if (isUniqueViolation(err)) {
    const recent = await storage.getMostRecentSessionForUser(user.id);
    if (recent && (Date.now() - new Date(recent.createdAt).getTime()) < 10000) {
      setRefreshCookie(res, recent.refreshToken);
      return res.json({ accessToken: newAccessToken, expiresIn: getAccessTokenExpirySeconds(), user: { … } });
    }
  }
  throw err;
}
```

`isUniqueViolation` is a small helper that checks Postgres error code `23505` (or message-substring `"duplicate key"` as a fallback) — the standard Drizzle/pg-error shape.

### 4.2 Stop swallowing the underlying error

Add `console.error('[auth/refresh] unhandled error:', err)` (or whatever Nexxus's existing logger pattern is — I did not see a structured logger in `server/routes/auth.ts`, only `console.error` in `server/auth.ts`). This single line would have surfaced the unique-key violation immediately rather than leaving the failure invisible.

### 4.3 (Optional defense-in-depth, not strictly required for this fix)

Add a tiny millisecond nonce to the JWT payload (`jti: crypto.randomUUID()`) so two refresh tokens minted in the same second never collide on the unique index. This is a "make the bug impossible" change rather than a "handle the bug" change. It's strictly safer but slightly broader scope. **Not recommended for the launch fix** — keep the change minimal — record as follow-up debt.

---

## 5. Files that would change in Phase 2

| File | Why | UI scope marker? |
|---|---|---|
| `server/routes/auth.ts` (≈10–20 line edit) | Catch unique-violation in `createSession`, fall back to recent session; log unhandled errors | No — not under `client/src/{pages,components,styles,layouts}/**` |

**No client-side changes proposed.** No `shared/schema.ts` change. No migration. No Coolify env change. No build/deploy in scope.

---

## 6. Risk areas

1. **Cross-tab refresh behavior.** Multiple tabs in the same browser legitimately race refresh on simultaneous reload. The fallback behavior must NOT log them out. The proposed shape preserves login (returns 200 with the winner's refresh token).
2. **Refresh-token rotation invariant.** The current code intentionally rotates the refresh token on every refresh (defense against replay). The fallback path returns the just-created session's refresh token — same security posture as the existing concurrent-rotation fallback (line 225). No regression.
3. **`getMostRecentSessionForUser`'s 10-second window** (line 213). Reuse the same threshold, or make it explicit in this new branch. Easy to keep consistent.
4. **Drizzle/pg error shape.** The unique-violation detection must match what `pg` actually throws under Drizzle. Standard shape is `err.code === '23505'`. Need to verify against the actual error object before merging — I'd add one `console.error(err)` first, run the race, capture the real shape, then write `isUniqueViolation` against it.
5. **No test currently covers this race directly.** The Codex test exercises it indirectly via `page.goto` → `page.reload` rapid-fire. A focused server-side test (parallel curl-equivalent) would be ideal but is out of Phase 2 scope unless operator wants it.

---

## 7. What proof Phase 2 would collect

If operator greenlights:

- **Delta 1 (server-side test):** repeat the 30-iteration parallel-curl race against dev after the fix; expect 0 / 30 failures (currently 16 / 30).
- **Delta 2 (Playwright):** re-run `tests/e2e/s99-codex-launch-readiness-readonly.spec.ts:76` against `BASE_URL=https://dev.huminicdev.com` — expect PASS.
- **Bonus:** confirm no other test regressed (`npx tsc --noEmit`, plus a small targeted set of auth-adjacent specs).

A `pm2 reload nexxus-app --update-env` on dev would be required to ship the server fix to dev for live verification. This is in the autonomy-allowed list per CLAUDE.md ("`pm2 reload nexxus-app --update-env` (DEV ONLY) after presenting exact command + reason"), so Phase 2 can complete dev verification without explicit operator click — but the operator should still confirm the deploy is desired.

---

## 8. Open questions for operator

1. **Scope of fix at server level only?** I.e. is operator OK with the server-only fix and leaving the `3581187` client-side fix in place untouched? Recommended: yes.
2. **Defense-in-depth `jti` nonce?** Add it now or defer to v2.3 / launch-stabilize follow-up? Recommended: defer, log as `issues.md` debt.
3. **Live deploy to dev included in Phase 2?** Or commit-only? CLAUDE.md autonomy permits dev `pm2 reload`; per-task discipline says present the command first. I recommend: deploy to dev as part of Phase 2 with operator notification (not separate approval).
4. **Want a targeted server-level test added** (`tests/e2e/auth-refresh-race.spec.ts` or unit at `tests/unit/auth-refresh-race.test.ts`)? Recommended: yes, small, parallel-fetch test covering the race. Worth ~10 min of extra Phase 2 scope.

---

## 9. Phase 1 deliverables (this report)

- Reproduction confirmed on dev: 1/1 Playwright failure + 16/30 raw curl failure rate.
- Root cause identified with `file:line` citations:
  - `server/routes/auth.ts:265-280` (rotation race window)
  - `server/routes/auth.ts:297-298` (swallowed catch)
  - `shared/schema.ts:` (sessions table — `unique()` on `refresh_token`)
  - `server/auth.ts:69-75` (JWT generation, integer-second `iat`)
- Verified `3581187` is in source AND in deployed bundle; explained why its scope does not cover this failure.
- Fix shape proposed (server-only, ~10–20 lines, no schema change, no UI change).
- No code edited in Phase 1.

**End of Phase 1 report. Awaiting operator review before any Phase 2 implementation.**
