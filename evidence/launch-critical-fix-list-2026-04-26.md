# Launch-Critical Fix List — 2026-04-26

**Source:** Phase 1 audit (`evidence/preflight-ui-truth-2026-04-26.md`, `evidence/preflight-e2e-workflows-2026-04-26.md`) + `issues.md` launch-critical bugs.

**Mode:** Best-effort, no due dates, no commit gates per operator decision (`decisions.md` 2026-04-26).

**Constraint baseline:** read-only Playwright audit observations + source verification. No real-customer sends. UI files require per-file `.claude/state/scope/<basename>.ok` markers.

**Verification cadence:** each fix lands as a single local commit; orchestrator pauses for parent-dispatched fresh code-reviewer + scope-guardian + qa-evaluator (+ integration-safety when applicable).

---

## Ordered priority

### Priority 1 — Deep-link auth bootstrap (NEW, root cause identified)

**File:** `client/src/contexts/AuthContext.tsx` (initAuth useEffect ~line 305-315)
**NOT** `server/routes/auth.ts:202-204` — that line correctly returns 400 when refresh cookie is absent. The 400 was a red herring; the actual deep-link reload returns refresh=200 + me=200, but the React `accessTokenState` is never synced from tokenStore module variable, so `isAuthenticated = !!user && !!accessTokenState` evaluates `false` and ProtectedRoute redirects to `/login`.

**Live evidence (this session, post-deploy):**
- Re-tested deep-link `/teambox` after login: network shows `POST /api/auth/refresh => 200` and `GET /api/auth/me => 200`, NO console errors. URL ended at `/login` regardless. Confirms it's a client state-sync bug, not server / cookie bug.
- `evidence/preflight-ui-truth-2026-04-26/console-logs/repro-deeplink-network.log`

**Root cause:** `client/src/contexts/AuthContext.tsx:305-315`. `tryRefreshToken()` sets the in-memory `tokenStore` module variable (via `setAccessToken`) but does NOT update the React `accessTokenState` setter. The bootstrap then calls `fetchUser(token)` which sets the user, but `isAuthenticated = !!user && !!accessTokenState` remains `false` because `accessTokenState === null`.

**Fix scope:**
- `client/src/contexts/AuthContext.tsx` — in initAuth success branch, call `setAccessTokenState(token)` (or wrap in `storeToken`) so React state mirrors tokenStore.
- Add unit-style integration test if reasonable (testable surface = AuthContext mount + initAuth).

**Why first:** affects every shared link, every refresh, every bookmark. Customer/dealer experience is "the app keeps logging me out" until fixed.

**UI scope marker:** `client/src/contexts/AuthContext.tsx` is NOT under `client/src/{pages,components,styles,layouts}/**` — does NOT require a UI scope marker. (The hook only protects user-visible pages; AuthContext is a provider in `contexts/`.) Verified by reading edit-scope-guard.sh patterns.

---

### Priority 2 — I-270 Bulk CSV button → 404

**File:** `client/src/pages/service.tsx:365` (UI scope marker REQUIRED)
**Fix scope:** Either (a) require the user to select a campaign first before enabling the top-level Upload CSV button, or (b) implement `POST /api/campaigns/bulk/upload-csv`. Option (a) is simpler and matches the per-row Upload CSV that already works.

**Why second:** customer-facing 404 on a launch-critical Service page. Visible from first page load.

**UI scope marker:** `.claude/state/scope/service.tsx.ok` required.

---

### Priority 3 — I-269 `{{dealershipName}}` placeholder substitution

**File:** `server/routes/chat.ts` (~line 161 — `agent.instructions` injection)
**Fix scope:** Add `substituteTemplate(text, vars)` helper; call it on `agent.instructions` before appending to systemPrompt. Substitute at minimum `{{dealershipName}}` → `org.name`. Other vars (`{{customerName}}`, `{{vehicleOfInterest}}`, `{{salespersonName}}`) are already used in templates as customer-context variables — leave those for runtime template substitution.

**Why third:** when AI agents draft customer-facing email/SMS templates (Communication Writer especially), Claude emits literal `{{dealershipName}}` strings in the drafted output. Visible quality issue.

**UI scope marker:** none — server-side only.

---

### Priority 4 — I-260 lib-21 "Avg Time to 1st Contact" hardcoded "—"

**File:** `client/src/pages/insights.tsx` (~line 1160, UI scope marker REQUIRED) + `server/routes/insights.ts` (compute the metric)
**Fix scope:** Compute the average `firstMessageAt - vinCreatedAt` in days for warehouse leads with at least one matched conversation message. Return real value or null. UI shows "—" only when null + tooltip explaining "no leads with conversations yet."

**Why fourth:** strong-fix per audit. Library tile reads "Data source not connected" — misleading; the data IS connected (vinCreatedAt + conversation timestamps exist), just not computed.

**UI scope marker:** `.claude/state/scope/insights.tsx.ok` required.

---

### Priority 5 — I-246 Role dropdown shows all 8 roles to org_admin (privilege escalation surface)

**Files:**
- `client/src/pages/settings.tsx` (~3853-3861, UI scope marker REQUIRED) — filter the role list at `roleLevel >= req.user.roleLevel` (only equal or lower-privilege)
- `server/routes/users.ts` POST `/api/users` and POST `/api/users/invite` — server-side enforcement: `if req.user.roleLevel === 3 && targetRoleLevel < 3` → reject

**Why fifth:** security finding live-confirmed in audit. Privilege escalation is meaningful.

**UI scope marker:** `.claude/state/scope/settings.tsx.ok` required.

---

### Priority 6 — Active Pipeline metric reconciliation (cross-page consistency)

**Sites with conflicting values:**
- `/sales` Sales Dashboard "Active Pipeline" = 197 (now 195 post-deploy)
- `/insights` Today's Performance "Pipeline Active" = 306
- `/insights` Pipeline Health "Active Pipeline" = 609
- `/insights` Library "Total Active Pipeline" = 306

**Fix scope:** identify the canonical query (likely `isActiveLead()` count over the right window). Either (a) point all 4 sites at the same query/endpoint, or (b) rename the labels to disambiguate (e.g., "Active Pipeline (14d)", "Active Pipeline (30d)", "Active Pipeline (all-time)").

**Why sixth:** customer-confidence-impacting. Same label, three values destroys trust in the platform.

**UI scope markers:** `.claude/state/scope/insights.tsx.ok`, `.claude/state/scope/sales.tsx.ok` (both required, separate edits).

**Risk:** This is more analysis than implementation. Recommend doing the source archaeology before any edit, and if the answer is "label-rename only" we can ship that quickly; if the answer is "rewrite metrics" it's larger and may slip below other priorities.

---

### Priority 7 — I-279 VIN source ID resolution

**Files:**
- `server/sync.ts` `transformVinLead()` — call `vin_list_lead_sources` to resolve URL-format `leadSource` to human-readable name, store both raw URL and resolved name
- `server/routes/insights.ts` `deriveChannel()` — fallback when `leadSource` looks like a URL: extract id, look up cached resolution
- `client/src/pages/insights.tsx` Library "Top Source" tile and Reports "Loss Patterns by Source" table — use resolved name; fall back to "VIN Source #N" only when truly unresolved (with subtle styling indicating unresolved)

**Why seventh:** every dealership leader who looks at Reports sees "VIN Source #3750035" rows — unreadable. Plus I-279 says only 16-20 of 49+ sources resolve via the MCP tool, so a percentage of leads will hit fallback. Need a resolution path AND a clearer fallback presentation.

**UI scope marker:** `.claude/state/scope/insights.tsx.ok` required.

**Risk:** Touches sync layer + insights queries + UI. Higher complexity. The MCP-side limitation (I-279 hypothesis a/b) is an external dependency — until that's resolved, the fix is only partial. May be deferred post-launch and replaced with a "Hide Reports tab until source resolution is complete" interim banner.

---

### Priority 8 — Service Reminder February stuck campaign (data hygiene + investigation)

**File:** `server/services/campaignScheduler.ts` (or similar) — investigate why a campaign with status=active, 16 recipients, 0 sent has not fired
**Fix scope:** Read code path, identify whether (a) scheduler skipped because of missing field, (b) CommGate blocked silently, (c) recipients list is empty in the DB despite the count column saying 16. Then either resolve in DB or fix code.

**Why eighth:** this is the same code path that will fire for live launch. If it's stuck for a test campaign, it could be stuck for a production one.

**UI scope marker:** likely none (server-side investigation), unless the issue surfaces a UI control.

---

### Priority 9 — TeamBox 10+ orphan "Test Customer / 0 messages" conversations

**Approach:** read-only DB query identifies orphans (channel=ai-chat, message count=0, customer_name="Test Customer", org=Serra Honda). Operator-supervised DELETE, NOT autonomous (data deletion is irreversible).

**Why ninth:** UX cleanup. First impression of TeamBox is dominated by these orphans. Not a code change.

**UI scope marker:** none.

**Risk:** DB DELETE on the shared production-Supabase. **Requires explicit operator approval per CLAUDE.md.** I will produce the DELETE script and surface for operator approval, NOT execute autonomously.

---

### Priority 10 — Marketing module gating ("Coming v2.3" banner)

**File:** `client/src/pages/marketing.tsx` (UI scope marker REQUIRED)
**Fix scope:** add a top banner "Marketing module is in development for v2.3. Existing campaign data is shown but no new agents or studio actions are available."

**Why tenth:** prevents customer confusion when they see Photo Studio / Video Producer / etc. but nothing works.

**UI scope marker:** `.claude/state/scope/marketing.tsx.ok` required.

---

### Priority 11 — `partner@nexxus.com` test-account cleanup (data hygiene)

**Approach:** read-only DB query identifies test seed users; operator-supervised DELETE.

**Why eleventh:** small data-hygiene item per operator clarification — not a security finding. Visible in Serra Honda's user list.

**Risk:** same as #9 — DB DELETE requires operator approval.

---

### Priority 12 — Sales delta artifacts + Pipeline Stagnation Index +212 same-as-value bug

**Files:**
- `server/routes/insights.ts` and/or `client/src/pages/sales.tsx` — when prior period count < 10, suppress percent-delta and show "+x leads" absolute. When prior period is null/zero, omit delta line.
- `server/routes/insights.ts` Pipeline Stagnation Index — same-as-value delta indicates no prior baseline. Show "—" not "+212".

**Why twelfth:** data-quality polish. Doesn't block launch; affects perceived rigor.

**UI scope marker:** likely `.claude/state/scope/sales.tsx.ok` and `.claude/state/scope/insights.tsx.ok` (already required for #6).

---

## Out-of-scope for this batch (deferred)

- I-244 IDOR / I-247 slug overwrite — security fixes; will land in a security-themed batch after the visible-launch-quality batch. Source-confirmed open; not visible to customers.
- I-249 self-deactivation — same.
- I-250 CommGate silent drop — important but only manifests when CommGate is mid-launch toggled.
- I-252-I-256 (B05-B09) — agent UX edges; post-launch.
- I-240 BUG-INT-07 VIN provisioning — external dependency on central-mcp; cannot fix from nexxus.
- I-265 hardcoded monthly target=50 — DEFERRED per existing classification.
- I-261 / I-276 channel metrics for VinSolutions — DEFERRED, depends on I-279 root resolution.

---

## Approach for Task #5 execution

Per operator process directive: implement → commit → pause → parent dispatches verifiers → on PASS advance.

**Per fix:**

1. Read source. Confirm fix surface and verify nothing else changed in working tree.
2. Write declared scope into `.claude/state/active-scope.txt`.
3. For UI files, create per-file scope marker in `.claude/state/scope/<basename>.ok`.
4. Make minimal change.
5. Add unit/integration test if there's a testable surface (vitest under `tests/unit/`).
6. `npx tsc --noEmit` clean.
7. `npx vitest run tests/unit/` — confirm no regressions.
8. Local commit with descriptive message matching commit-style of recent work.
9. Pause for parent verifier dispatch.

**On verifier PASS:** parent writes completion markers; orchestrator advances to next priority.

**On verifier FAIL:** orchestrator addresses findings via NEW commit (not amend); cycle continues.

**Pause for parent surface message:** when 3-5 fixes have landed, OR a fix needs operator decision (DB DELETE, real send, schema change), OR I complete the priority list, OR I'm blocked.

---

**Ready to execute starting with Priority 1 (deep-link auth bootstrap).**
