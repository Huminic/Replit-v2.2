# Chunk G2 — D-I3 Console-Error Investigation Finding

**Wave:** 11-Gov
**Chunk:** G2 (D-I3 console-error walk + classification, READ-ONLY)
**Investigator:** isolated agent (general-purpose)
**Date:** 2026-05-07
**Pm2 HEAD under test:** `e4aa3b0` (`batch-1-finish-line`) — confirmed via session-snapshot context; pm2 nexxus-app online, 27m uptime, no restart in walk window
**Identity:** `serra_honda@huminic.ai` (org_admin, Serra Honda)
**Tool:** Playwright MCP (chromium headless)
**Origin:** `localhost:5000` (NOT `127.0.0.1` per CLAUDE.md CORS quirk)

---

## 1. Walk Summary

| # | UTC | Route | Outcome | Console error count |
|---|---|---|---|---|
| T0 | 16:00:14 | `/login` (existing session sticky) | redirected to `/` (cookie still valid) | 0 |
| T1 | 16:02:30 | `/` (home dashboard) | rendered | 0 |
| T2 | ~16:02:45 | `/sales` | rendered (post-3F-B-S3 "AI Agents" copy present) | 0 |
| T3 | ~16:03:05 | `/insights` | rendered (post-3F-B-S5 Source Quality Trends chart present) | 0 |
| T4 | ~16:03:25 | `/teambox` | rendered (19 conversations) | 0 |
| T5 | ~16:03:45 | `/management` | client-redirect to `/` (RBAC — org_admin lacks super_admin access; expected) | 0 |
| T6 | ~16:04:00 | `/marketing` | rendered (v2.3-preview banner present) | 0 |
| T7 | 16:04:13 | post-Logout → `/login` | rendered | **1** (`POST /api/auth/refresh 400`) |
| T8 | 16:04:32 | `/login` (fresh nav, no refresh cookie) | rendered | **1** (`POST /api/auth/refresh 400`) |
| T9 | 16:04:52 | re-login → `/` | rendered (operator instruction: do not log out) | (residual buffer; no new errors) |

Full transcript: `evidence/wave-11-gov-harness/chunk-G2/console-walk.txt`
Screenshots: `console-screenshot-route-root-2026-05-07T160230Z.png`, `console-screenshot-route-home-final-2026-05-07T160554Z.png`

## 2. Console Error Captured (single, repeating)

```
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request)
        @ http://localhost:5000/api/auth/refresh:0
```

**Source (browser-side trigger):**
- `client/src/contexts/AuthContext.tsx:289-338` — `useEffect` on mount of `AuthProvider`, calls `tryRefreshToken()` on every page load to attempt to restore a session from the httpOnly refresh cookie
- `client/src/lib/queryClient.ts:26-58` — `tryRefreshToken()` does `fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' })`. The 4xx status is HANDLED in JS (returns `false`); but the browser still emits the resource-load error in DevTools console because that's intrinsic browser behavior for any top-level `fetch()` returning 4xx.

**Source (server-side response):**
- `server/routes/auth.ts:198-237` → `server/lib/refreshTokenRotation.ts:202-204`:
  ```ts
  if (!refreshToken) {
    return { kind: "error", status: 400, cookie: "none", message: "Refresh token required" };
  }
  ```
- Server comment (line 196) explicitly documents: *"Pass `undefined`/`null`/`""` to surface a 400."*
- Client comment (`AuthContext.tsx:301-304`) explicitly acknowledges: *"We must attempt the refresh call and let the server decide if the cookie is present. A 401/400 response simply means no valid session."*

**Repeating pattern:** Same error, same source. Fires ONLY on routes loaded WITHOUT a valid refresh cookie present (i.e., pre-login `/login` or right after logout). Does NOT fire on `/`, `/sales`, `/insights`, `/teambox`, `/marketing`, or `/management` while authenticated.

## 3. Cross-Check vs Wave 1C E2E (`evidence/wave-1C-comprehensive-e2e/console-network/health-summary.md`)

| Dimension | Wave 1C (2026-05-07T01:50–01:59Z) | Wave 11-Gov G2 (2026-05-07T16:00–16:05Z) | Verdict |
|---|---|---|---|
| Console errors during authenticated walk | 0 (after probe-induced 401s discounted) | 0 (after probe-induced 401s discounted) | **MATCH** |
| `[ERROR] /api/auth/refresh 400` on /login | not measured (Wave 1C did not log out + log back in) | 1 occurrence on bare /login | new observation; not a regression |
| `uncaughtException` / `TypeError` / `ReferenceError` in pm2 logs | 0 | 0 (verified during walk) | **MATCH** |
| 5xx HTTP responses | 0 | 0 | **MATCH** |
| Slow / hung requests | none over 3s | none observed in walk | **MATCH** |

**Conclusion vs 1C:** No regression. Console health on the authenticated surface is clean — same as Wave 1C. The single 400 captured today is a *pre-login* / *post-logout* artifact; Wave 1C didn't measure those transition states.

## 4. Cross-Check vs D-I3 Original Claim (KD-6 / `finish-line-plan.md:276`)

D-I3 claim text:
> *"Step A's Playwright walk recorded `Console: 1 errors, 0 warnings` from the very first `/login` load and through every protected route. Source not investigated."*

| D-I3 claim | Today's observation | Verdict |
|---|---|---|
| "From the very first `/login` load" | Confirmed: `/login` (no refresh cookie) emits the 400 | **MATCH** |
| "Through every protected route" | NOT reproduced: `/`, `/sales`, `/insights`, `/teambox`, `/marketing`, `/management` all clean | **DOES NOT REPRODUCE** |
| Error source unknown | Source identified: `AuthContext.tsx` mount → `/api/auth/refresh` on missing cookie; server intentionally returns 400 with explanatory message | **RESOLVED** |

The "every route" framing in D-I3 was likely an artifact of how Step A's walk recorded `Console: 1 errors`: the error fires once on the initial `/login` load and the value persists in the console buffer across navigations within the same browser context (the buffer is cumulative; it does not clear on route change). What the Step A walker probably did was sample the console at each route and saw the same residual count — not a fresh per-route emission.

## 5. Classification

**BENIGN** (with documentation recommendation)

### Rationale

1. The 400 response is **explicitly intentional** — both client-side and server-side comments acknowledge it as the documented "no session present" signal. The client correctly handles the 4xx (returns `false` from `tryRefreshToken`) and routes the user to `/login` when needed.
2. The browser's console-error emission is a **browser-level artifact of any 4xx on `fetch()`** — it is NOT raised by application JavaScript, and there is no exception thrown.
3. The error fires **only on auth-bootstrap routes without a refresh cookie** (pre-login `/login`, post-logout `/login`). It does NOT fire on any authenticated route — directly contradicting the "every route" framing in D-I3 KD-6.
4. There is **no functional impact**: the auth flow works correctly (login succeeds, deep-link bootstrap works per the documented 2025/26 BUGFIX comment in AuthContext).
5. **No regression vs Wave 1C** — 1C captured `0` console errors during its authenticated walk; today reproduces that.

### Why not "Mechanical-fix-v2.2"

A fix is *technically* possible (e.g., have the bootstrap probe `GET /api/auth/me` first and only call `/api/auth/refresh` on 401, OR have the server return 200 with `{ authenticated: false }` instead of 400 when no cookie — see Optional Improvement below). But:
- Either change touches `client/src/contexts/AuthContext.tsx` (UI-protected file → would need a per-file scope marker per CLAUDE.md `edit-scope-guard.sh`)
- The server-side change (200 instead of 400) would alter the documented contract (`server/lib/refreshTokenRotation.ts:196` comment) and require coordinating client + server in the same chunk
- The functional behavior is correct; this is purely cosmetic console hygiene
- v2.2 launch is imminent; introducing churn in the auth-bootstrap path on the eve of launch is higher risk than the cosmetic benefit warrants

### Why not "Cannot-reproduce"

The 400 *is* reproducible — but only on `/login` without a refresh cookie. The "every route" portion of D-I3 does not reproduce, but the underlying error does, so "Cannot-reproduce" understates what was found.

## 6. Recommended Action

**Document as benign and close D-I3 (KD-6).** Two follow-ups, both LOW priority and OPTIONAL for v2.2:

### 6a. Update `issues.md` row (RECOMMENDED — small, no code change)

Replace KD-6's "Source not investigated" with the resolution. Suggested row text:

```
| KD-6 | **Console `Failed to load resource ... /api/auth/refresh 400` on /login when no refresh cookie present.** Investigated 2026-05-07 (Wave 11-Gov G2). Cause: `AuthContext.tsx:289` bootstrap probe calls `/api/auth/refresh`; server intentionally returns 400 when no cookie exists (`refreshTokenRotation.ts:202-204`, comment "Pass undefined/null/'' to surface a 400"). Browser logs the 4xx as a console resource error — not raised by app JS, fully handled by `tryRefreshToken()` returning false. Does NOT fire on authenticated routes (re-walk 2026-05-07 confirms: /, /sales, /insights, /teambox, /marketing, /management all clean). The "every route" framing in original D-I3 was an artifact of the cumulative console buffer, not per-route re-emission. | Pre-login + post-logout cosmetic noise on /login only. | RESOLVED — accepted as benign. Optional improvement filed as AD-NEW-G2-CONSOLE if operator wants the noise gone. | N/A — no functional impact. |
```

### 6b. Optional improvement (file as accepted-debt `AD-NEW-G2-CONSOLE`, NOT v2.2)

Two non-overlapping fix paths for a future release if console-noise hygiene becomes important:

- **Path A (server-side, lowest-risk):** change `server/lib/refreshTokenRotation.ts:202-204` to return `{ kind: "error", status: 200, cookie: "none", body: { authenticated: false } }` and adjust `auth.ts:198-237` to send 200 with the body. Update `tryRefreshToken()` to treat the body shape as "no session" rather than `!res.ok`. NOT a one-LOC fix; touches contract; unit test in `refreshTokenRotation.test.ts` would need updating.

- **Path B (client-side, smallest diff):** in `AuthContext.tsx:314-332`, swap the bootstrap order: `GET /api/auth/me` first, only call `tryRefreshToken()` on 401. The /me endpoint already returns 401 silently (no console error from a network 401 on a `fetch()` call where status is *checked*; but caveat — the browser DOES log all 4xx, so this only wins if we either swallow the response check differently or accept that `/me` 401 is preferable to `/refresh` 400. Worth testing.)

Neither path is in scope for v2.2; both should land in v2.3 if the noise becomes a measurement nuisance during launch monitoring.

## 7. Halt-Condition Check

| Halt condition | Status |
|---|---|
| Login fails | NOT TRIGGERED — login succeeded twice (initial sticky session + post-logout re-login) |
| Any route returns 500 | NOT TRIGGERED — no 5xx observed in pm2 walk window |
| Console error reveals active production-impact bug | NOT TRIGGERED — 400 is intentional + handled, no functional impact |
| Operator session ended | NOT TRIGGERED — re-logged in as serra_honda per instruction |

## 8. Verdict

**PASS** (investigation complete) — D-I3 console-error finding is **BENIGN**; "every route" framing does not reproduce on post-3F-B HEAD `e4aa3b0`. Recommend updating `issues.md` KD-6 to RESOLVED status (operator owns wording per project norms). Recommend G3 NOT be dispatched. Optional v2.3 hygiene improvement filed as AD-NEW-G2-CONSOLE for the operator's backlog (NOT in v2.2 scope).
