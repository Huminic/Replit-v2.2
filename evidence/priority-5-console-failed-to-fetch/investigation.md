# Priority 5 — Console "Query error: Failed to fetch" — Phase 1 investigation

Date: 2026-04-28
Branch: wave-pe3
Bundle under test: dev (rebuilt 2026-04-28 00:25 UTC, PM2 PID 1396169)
Investigator: orchestrator (read-only main thread)
Phase: 1 (read-only). NO code edits in this phase.

---

## TL;DR

The console.error string `"Query error: Failed to fetch"` is **not** caused by a broken endpoint, missing data, dev-only API, CORS, or auth issue. Every backend endpoint touched by the Codex test routes returns 200 when given enough time to complete.

The **single** root cause is a missing `AbortSignal` wiring in the global TanStack Query `queryFn`: `client/src/lib/queryClient.ts:107-120` runs `fetch(url, { headers, credentials })` with no `signal` argument. When the SPA navigates between routes faster than in-flight queries can complete, the browser cancels the now-orphaned fetches with `net::ERR_ABORTED`, which surfaces in the JS layer as a native `TypeError("Failed to fetch")`. With `retry: 3` defaulted, the same query gets retried, all retries get aborted by subsequent navigations, and the final exhausted-retry error reaches `QueryCache.onError`, which logs `console.error('Query error:', error.message)` — i.e. `"Query error: Failed to fetch"`.

This is a **client-side timing-race surfacing**, not a backend defect. The Codex eval is reporting real noise but mis-classifies it as "failed endpoints" — there are no failed endpoints.

The narrowest correct fix is one line + one cleanup in `client/src/lib/queryClient.ts`:
1. Pass the React Query–provided `AbortSignal` into `fetch()` so cancellation produces a proper `AbortError`/`CancelledError`, which TanStack Query v5 treats as a non-error and does NOT route through `onError`.
2. Optionally, narrow the global `console.error` in `QueryCache.onError` to skip aborts (defense in depth — even if some other path leaks an abort, it would not pollute the launch log).

Estimated diff size: ~10 lines net change in **one** file (`client/src/lib/queryClient.ts`).
Risk: very low; this is the documented, intended TanStack Query v5 contract — passing `signal` is the standard hookup.

---

## 1. Source of the log line

| | |
|---|---|
| File | `client/src/lib/queryClient.ts` |
| Line | 125 |
| Code | `console.error('Query error:', error.message);` |
| Hook | `QueryCache.onError` (global — fires for every query whose error is not consumed silently by the observer) |

There is no other `Query error` console.error in the client. `error.message` is the **second** argument to `console.error`. Playwright's `msg.text()` joins all args with a space, so the resulting `text` is `Query error: Failed to fetch` and matches `/failed to fetch/i`.

---

## 2. Reproduction (delta 1)

Replay of `tests/e2e/s99-codex-launch-readiness-readonly.spec.ts:45` against the rebuilt dev bundle.

```text
Error: critical console/page errors

  - Expected  - 1
  + Received  + 4

  - Array []
  + Array [
  +   "Query error: Failed to fetch",
  +   "Query error: Failed to fetch",
  + ]

> 73 |     expect(criticalConsole, "critical console/page errors").toEqual([]);
```

Full log: `evidence/priority-5-console-failed-to-fetch/delta-1-codex-spec-replay.txt`.

The 7 routes the Codex assertion sweeps (line 4-12 of the spec):

```
"/"  "/teambox"  "/sales"  "/service"  "/marketing"  "/insights"  "/settings?section=ai"
```

The criticalConsole listener is attached once at test start (line 47) and accumulates across all 7 navigations — the assertion runs at end-of-test (line 73).

---

## 3. Network-level cause (delta 2)

Read-only Playwright probe `tests/e2e/s99-priority5-failed-fetch-probe.spec.ts` instruments `page.on("response")` and `page.on("requestfailed")` and walks the same 7 routes with the same Codex timing (`domcontentloaded` + `1500ms`).

**Result with Codex-equivalent timing (1.5s per route):**
- 0 requests with HTTP status >= 400
- 63 requests cancelled with `net::ERR_ABORTED` distributed across all 7 routes

**Result with `networkidle` waits between routes (8s per route):**
- 205 `/api/*` responses, all 2xx
- 0 aborts
- 0 console errors

This is the conclusive proof that no endpoint is actually broken — the failures are entirely a function of how fast the SPA navigates relative to in-flight query completion.

Evidence files:
- `delta-2-summary.md` — markdown table of all 63 aborts by route
- `delta-2-failed-requests.json` — full machine-readable capture (stale-codex-timing run)
- `delta-2-all-responses.json` — every response observed under `networkidle` wait (clean run)
- `delta-2-console-rows.json` — console message capture

---

## 4. Per-route table — aborted endpoints (Codex-timing run)

Endpoints unique-by-path observed aborting at least once during the route walk:

| URL (path only) | Source hook | Hook file | Why it fires on multiple routes |
|---|---|---|---|
| `/api/notifications` | global useQuery | `client/src/contexts/AppContext.tsx:161-163` | mounted in AppProvider — fires on every authenticated route |
| `/api/notifications/unread-count` | global useQuery | `client/src/contexts/AppContext.tsx:167-170` | mounted in AppProvider |
| `/api/organizations/<orgId>` | global useQuery | `client/src/contexts/AppContext.tsx:115-126` | mounted in AppProvider, depends on `orgIdForDetails` |
| `/api/agents` | global useQuery | `client/src/contexts/AppContext.tsx:109-112` | mounted in AppProvider |
| `/api/favorites` | global useQuery | `client/src/contexts/AppContext.tsx:220-222` | mounted in AppProvider |
| `/api/agents?department=sales` | layout useQuery | `client/src/components/layout/SubMenuManager.tsx:108-110` | mounted in AppLayout — fires on every authenticated route |
| `/api/agents?department=service` | layout useQuery | `client/src/components/layout/SubMenuManager.tsx:112-114` | layout-level |
| `/api/agents?department=marketing` | layout useQuery | `client/src/components/layout/SubMenuManager.tsx:116-118` | layout-level |
| `/api/conversations` | layout useQuery | `client/src/components/layout/SubMenuManager.tsx:89-91` | layout-level |
| `/api/conversations?channel=ai-chat` | layout useQuery | `client/src/components/layout/SubMenuManager.tsx:93-95` | layout-level |
| `/api/activity-log?limit=8` | layout useQuery | `client/src/components/layout/TopBar.tsx:103-105` | layout-level |
| `/api/activity-log?limit=10` | page useQuery | `client/src/pages/sales.tsx:547` | page-level (Sales) |
| `/api/activity-log?limit=50` | page useQuery | `client/src/pages/insights.tsx:185-187` | page-level (Insights) |
| `/api/metrics/pipeline` | page useQuery | `client/src/pages/main.tsx:652` | page-level (Home) |
| `/api/metrics/dashboard` | page useQuery | `client/src/pages/service.tsx:99-101` (also Insights) | page-level |
| `/api/campaigns` | page useQuery | `client/src/pages/teambox.tsx:154` | page-level (TeamBox) |
| `/api/campaigns?department=service` | page useQuery | `client/src/pages/service.tsx:119-121` | page-level (Service) |
| `/api/campaigns/execution-statuses` | page useQuery | `client/src/pages/service.tsx:218-220` | page-level (Service) |
| `/api/users` | page useQuery | `client/src/pages/teambox.tsx:274` | page-level (TeamBox) |
| `/api/vin/leads/summary` | page useQuery | `client/src/pages/sales.tsx:539` | page-level (Sales) |
| `/api/hunches` | page useQuery | `client/src/pages/insights.tsx:189-191` | page-level (Insights) |
| `/api/insights/library?lookbackDays=30` | page useQuery | `client/src/pages/insights.tsx:174-176` | page-level (Insights) |
| `/api/insights/reports` | page useQuery | `client/src/pages/insights.tsx:170-173` | page-level (Insights) |
| `/api/insights/dashboard` | page useQuery | `client/src/pages/insights.tsx:162-165` | page-level (Insights) |

All endpoints classify as **"cold-start race / abort race"** — none classify as "real bug" or "wrong URL" or "auth failure". When the probe waits for network-idle, every one of them resolves 2xx.

---

## 5. Why the rebuild didn't fix it

Priority #3 (refresh-token rotation race, commit `fe1fca3`) and the dev rebuild fixed authentication on hard reload. But that fix only addresses the `/api/auth/refresh` race for hard reloads. It does NOT touch the global queryFn, which is the mechanism producing aborted in-flight requests during normal SPA route changes.

The `Query error: Failed to fetch` signal will recur on EVERY future Codex-timing test until the queryFn is fixed, regardless of what backend changes ship.

---

## 6. Why not "just hide the console.error"

Two reasons not to silence-only:

1. The **default `retry: 3`** on every query means each aborted request gets retried, multiplying network load and noise. Passing `signal` causes TanStack to skip retries on abort (correct behavior).
2. We lose a real signal for actual error cases — the next time a backend genuinely 500s, we'd want to see it in the console during launch validation.

Therefore the fix must address the root cause (signal wiring) and may optionally add a defensive filter on `onError` for residual aborts.

---

## 7. Proposed Phase 2 fix shape (NOT applied in Phase 1)

Single file: `client/src/lib/queryClient.ts`.

### Change 1 — wire AbortSignal into queryFn (root cause)

```ts
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
- async ({ queryKey }) => {
+ async ({ queryKey, signal }) => {
    const url = queryKey[0] as string;
-   const res = await fetchWithAutoRefresh(url, {
+   const res = await fetchWithAutoRefresh(url, {
+     signal,
      headers: getAuthHeaders(),
      credentials: "include",
    });
    ...
  };
```

And update `fetchWithAutoRefresh` to forward signal on the post-refresh retry call:

```ts
async function fetchWithAutoRefresh(url: string, init: RequestInit): Promise<Response> {
  let res = await fetch(url, init);
  if (res.status === 401) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      const newInit = {
        ...init,
        headers: getAuthHeaders(init.headers as Record<string, string> | undefined),
        // signal already on init — keep it
      };
      res = await fetch(url, newInit);
    }
  }
  return res;
}
```

(`init` already carries the signal in the queryFn case; we just need to keep it on the retry. `apiRequest` does not pass a signal, which is fine — mutations don't have the same observer-unmount-during-flight pattern.)

### Change 2 — defensive filter on onError (defense in depth)

```ts
queryCache: new QueryCache({
  onError: (error) => {
    // Silently skip cancellations — these are normal SPA navigation aborts,
    // not actionable errors. Without this filter, fast route changes
    // generate "Query error: Failed to fetch" noise on every navigation.
    const name = (error as Error & { name?: string })?.name;
    if (name === "AbortError" || name === "CancelledError") return;
    const msg = (error as Error)?.message ?? "";
    if (msg === "Failed to fetch") return; // native TypeError from cancelled fetch
    console.error('Query error:', msg);
  },
}),
```

The combined effect:

- AbortSignal wired → most navigation-cancelled queries become `CancelledError`/`AbortError` and don't reach `onError` at all.
- The defensive filter catches the rare residual case where a fetch genuinely was cut off (e.g. browser back/forward navigation that bypasses React Query observer cleanup).
- Real backend errors (4xx/5xx mapped via `throwIfResNotOk` to `${status}: ${text}`) continue to log normally — none of those messages match `Failed to fetch` exactly.

### Change 3 — none

No backend change. No schema change. No other client file touched. No UI change.

---

## 8. Risk areas

| Risk | Assessment |
|---|---|
| Mutations break | Not affected. `apiRequest` is unchanged; `fetchWithAutoRefresh` is backward-compatible — `init.signal` is undefined for callers that don't pass one. |
| Real errors get swallowed | Defensive filter is name-based + exact-message-match. Real `${status}: ${body}` errors from `throwIfResNotOk` start with the digit status and never equal exactly `"Failed to fetch"`. |
| `retry: 3` semantics change | TanStack v5 already auto-skips retries on signal abort. Wiring the signal restores intended behavior; no longer 4× (1 + 3) wasted requests per cancelled query. |
| Auth refresh cascade | The 401 path inside `fetchWithAutoRefresh` retries fetch with the same init (which now carries signal). If the abort happens mid-refresh, the retry fetch will instantly abort — which is exactly what we want; UI is gone. |
| Codex spec passes for wrong reason | The 4-route hard-reload test (line 76) still asserts auth survival; the 7-route critical-console test now passes because aborts no longer leak to console. Independent. |

---

## 9. Estimated diff

- Files: 1 (`client/src/lib/queryClient.ts`)
- Net lines: ~+8 / -2
- TypeScript: clean (signal is typed in `QueryFunctionContext`)
- Tests: existing Codex spec serves as regression. New probe spec (`s99-priority5-failed-fetch-probe.spec.ts`) can be retained or removed — recommend retain as a Phase 2 regression assertion that flips from "data collection" to "expect zero aborts".

---

## 10. Open questions for parent / operator (Phase 2 gate)

1. **Approve the queryFn signal wiring + onError defensive filter as the single fix?** — recommend YES.
2. **Retain `s99-priority5-failed-fetch-probe.spec.ts`?** — recommend YES (after flipping to assertion mode).
3. **Apply per-file scope marker `.claude/state/scope/queryClient.ts.ok`?** — `client/src/lib/queryClient.ts` is in `client/src/lib/` not `client/src/{pages,components,styles,layouts}/**`, so the edit-scope-guard hook does NOT block it. No marker needed. (Confirmed by reading `CLAUDE.md` § "Minimal-UI-change rule".)
4. **Two deltas of proof for Phase 2?** —
   - Delta 1: full Codex spec passes (`tests/e2e/s99-codex-launch-readiness-readonly.spec.ts:45`).
   - Delta 2: the new probe spec, run in flipped/assertion mode, confirms zero `net::ERR_ABORTED` AND zero matched console errors.

---

## 11. NOT in scope for this fix

- Backend endpoint changes — none needed; every endpoint works.
- Server-side payload changes — none needed.
- UI files — none touched.
- shared/schema.ts — untouched.
- Migrations — none.
- Provider sends — none.
- Any other Codex blocker (auth, marketing gate, metrics) — separate priorities, addressed by other commits.

---

## 12. Phase 1 status

- [x] Identify exact log source (file:line)
- [x] Per-route table of failing requests with URL + status + classification
- [x] Independent runtime evidence (network capture under two timing regimes)
- [x] Proposed narrowed fix
- [x] Risk assessment
- [x] Estimated diff size

PAUSED for parent/operator review of Phase 1 deliverable. NO code edits applied to `client/src/` or `server/` in this phase.
