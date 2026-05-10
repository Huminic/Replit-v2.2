# Wave 9-Sec — Security triage (operator-led; v2.2 vs v2.3 placement)

**Phase:** 9 (Management + Settings — security)
**Branch:** `wave/9-sec/triage` off `batch-1-finish-line` @ `d47388e`
**Plan reference:** plan.md row 12 — "Security triage — 5 original items (I-244, I-245, I-246, I-247, I-249) + 5 new auth items from I-Auth (D, E, G, H, I) — opens with operator decision on v2.2 vs v2.3 placement"

---

## OPENING (2026-05-10T18:26Z)

### Context

Operator signaled "I'm way behind" 2026-05-10. Compressing the remaining wave path: Wave 3C deferred to v2.3 (BL-002), so Wave 9-Sec is next, then Wave 11A.

Wave 9-Sec is a **TRIAGE-FIRST wave**, not an implementation wave. Each of the 10 security items gets a binary fate: ship in v2.2 / defer to v2.3 / drop. Implementation only happens for items selected for v2.2, and only after operator approves each one specifically.

### Scope (Phase 1 — read-only triage enumeration)

| Phase | Owner | Action |
|---|---|---|
| **Phase 1** | `scope-guardian` (team SendMessage) | Read `issues.md`, `evidence/wave-I-auth-integrity/`, plus the 5 original items (I-244, I-245, I-246, I-247, I-249). Produce a concrete table: item id, summary, severity, fix complexity, recommended placement (v2.2 / v2.3 / drop) with one-sentence reasoning |
| **Phase 2** | operator | Decide each row: v2.2 / v2.3 / drop |
| **Phase 3** (conditional) | `harness-backend` and/or `harness-frontend` | Implement only the v2.2-bucket items, with bookend protocol per chunk |
| **Phase 4** (only if Phase 3 ran) | `qa-evaluator` + 4 verifiers at gate | Standard verifier convergence |

### Default disposition

**Defer to v2.3 unless operator explicitly opts in** for v2.2. Operator's time pressure + the launch gate (Wave 11A) being the immediate successor wave means the bar for v2.2 inclusion is HIGH: the item must be (a) a real risk to launch dealerships or customer data, or (b) trivially fixable (single-line / config-only).

### Two deltas of proof contract

| Delta | What |
|---|---|
| **Delta 1** | The triage table itself (read-only enumeration) — proves the 10 items were considered by name, not skimmed |
| **Delta 2** | Operator's recorded triage decisions in `decisions.md` (or inline in this bookend's Phase 2 amendment) — proves placement was operator-decided, not orchestrator-decided |

If Phase 3 runs (any v2.2 implementations), each implemented item adds its own two-deltas per chunk.

### Team dispatch

**This wave uses SendMessage to existing teammates** per CLAUDE.md TEAM DISPATCH DEFAULT. No fresh `Agent` spawns.

- Phase 1: `SendMessage` to `scope-guardian` (read-only; appropriate role since scope-guardian also covers process-discipline + governance)
- Phase 3 (if): `SendMessage` to `harness-backend` / `harness-frontend` per item
- Phase 4 (if): `SendMessage` to `qa-evaluator` (post-fix), `code-reviewer` (blind diff), `scope-guardian` (scope + drift), `integration-safety` (if provider boundary touched)

### Risk profile

| Risk | Mitigation |
|---|---|
| Operator says "skip everything to v2.3" | Wave closes after Phase 2 with zero v2.2 implementations. Acceptable. |
| Operator says "fix all 10 in v2.2" | Wave expands; orchestrator presents time/risk tradeoff and reconfirms |
| Item touches auth / RBAC | Higher scrutiny: integration-safety + extra qa-evaluator E2E |
| Real-customer data exposure risk | Auto-promote to v2.2 even if operator wasn't going to (orchestrator advocate role) |

### Out of scope

- New security features beyond the 10 enumerated items
- Schema migrations (deferred per BL-107)
- Live-deploy actions (Wave 11A only)

### Posture at OPENING

- Branch: `wave/9-sec/triage` at `d47388e`
- Working tree dirty: 4 untracked + 0 modified (post-cleanup state)
- Team: 8 idle teammates ready for SendMessage

---

## Phase 2 amendment (2026-05-10T18:33Z) — operator decisions locked

Operator response to scope-guardian triage table (2026-05-10):

> "I'll defer to you on those decisions, but to me it would seem like yes. We definitely do not want a chance of cross-tenant lead data happening."

Operator-advocate posture honored: orchestrator selects per-row placements, with explicit operator approval of the I-244 cross-tenant question. Locked decisions:

| ID | Decision | Severity |
|---|---|---|
| **I-244** IDOR cross-tenant lead data | **v2.2** | HIGH |
| **I-245** AI system-prompt PATCH bypass | **v2.2** | HIGH |
| **AUTH-D** forgot-password email-case mismatch | **v2.2** | HIGH |
| **I-247** org slug writable via API | **v2.2** | MEDIUM (cheap insurance) |
| **I-249** self-deactivation lockout | **v2.2** | MEDIUM (cheap insurance) |
| AUTH-E login_success audit log | v2.3 | LOW |
| AUTH-G UI countdown 15/60 mismatch | v2.3 | LOW (UI file) |
| AUTH-H change-password session invalidation | v2.3 | MEDIUM |
| AUTH-I refresh route rate-limit | v2.3 | MEDIUM |
| I-246 role dropdown | **drop** — already fixed | — |

**5 chunks queued for Phase 3 (severity-ordered, sequential dispatch via SendMessage to `harness-backend`):**

| Chunk | Item | File:line | Fix shape |
|---|---|---|---|
| S1 | I-244 | `server/vendorProxy.ts:555` | role-check guard: if `roleLevel > 2`, force `req.user.organizationId` instead of `req.query.orgId` |
| S2 | I-245 | `server/routes/settings.ts:17-25` | raise `requireRole(3) → requireRole(2)` OR field-allowlist on the body merge |
| S3 | AUTH-D | `server/routes/auth.ts:353` | `.toLowerCase()` on the email before lookup |
| S4 | I-247 | `shared/schema.ts:519` | omit `slug` from `updateOrganizationSchema` |
| S5 | I-249 | `server/routes/users.ts:175-211` | guard: forbid `req.user.id === req.params.id` self-deactivate |

Each chunk:
- harness-backend implements fix + regression test
- qa-evaluator verifies pre-fix vulnerability AND post-fix block (two deltas per chunk)
- All commits land on `wave/9-sec/triage`

After all 5 chunks land, wave-level 4-verifier gate (blind / scope-guardian / drift / integration-safety). Auth boundary touched → integration-safety mandatory.

## Phase 3 — implementation chunks (COMPLETE)

| Chunk | Item | Commit | Test count | File targets |
|---|---|---|---|---|
| S1 | I-244 IDOR cross-tenant | `3a63022` | 11/11 | `server/vendorProxy.ts` + `server/lib/tenantScope.ts` (new) |
| S2 | I-245 AI PATCH bypass | `94e9f70` | 9/9 | `server/routes/settings.ts` + `server/lib/aiSettingsGuard.ts` (new) |
| S3 | AUTH-D + signup parity | `4985b03` | 14/14 | `server/routes/auth.ts` + `server/routes/users.ts` + `server/lib/emailNormalize.ts` (new) |
| S5 | I-249 self-deactivate | `5a1b0c5` | 11/11 | `server/routes/users.ts` + `server/lib/selfModifyGuard.ts` (new) |
| S4 | I-247 org slug | `a0a354e` | 7/7 | `server/routes/organizations.ts` (route-level omit, NOT shared/schema.ts) |
| roleGuard sentinel | — | — | 14/14 | (regression check only) |
| **Total** | | | **66/66** | |

**Mid-wave revision (S4):** Original plan was `shared/schema.ts:519` edit. Schema-edit hook blocked the edit (governance-protected file). Operator-advocate orchestrator redirected to route-level `updateOrganizationSchema.omit({ slug: true })` at `server/routes/organizations.ts:366`. Same security outcome; `shared/schema.ts` byte-unchanged. Recorded in commit `a0a354e` message.

## Phase 4 — qa-evaluator wave-end sweep (commit `1427ae1`)

- 5/5 chunks PASS
- Two deltas per chunk:
  - Delta 1: independent test re-run (vitest)
  - Delta 2: endpoint behavioral probe (S1/S2/S3 HIGH) or code-trace + curl probe (S4/S5 MEDIUM)
- 22 evidence files + `post-fix-summary.md` under `evidence/wave-9-Sec-triage/post-fix/`
- Build + pm2 reload performed (`# APPROVED:` markers, dev only); health-check OK at 2026-05-10T19:03:39Z
- DB mutation hygiene: S2 timezone restored to baseline; S3 reset_token written to allowlisted `duane.wells@huminic.ai` (expires 60min); S4 row touched but slug unchanged; S1+S5 zero writes
- Real-customer recipients: NONE (serra_honda email correctly skipped as not allowlisted; only allowlisted test_email used for S3 send-probe)

## Phase 5 — 3-verifier gate at CLOSING (parallel SendMessage via team)

| Verifier | Verdict | Notable |
|---|---|---|
| **code-reviewer** (blind) | **AGREE** | Cold-read against all 5 commits + helpers + tests + delta-2 evidence; 66 unit tests reconcile; no UI files (`grep ^client/` empty); `shared/schema.ts` byte-unchanged |
| **scope-guardian** (scope + drift consolidated) | **PASS** | 9/9 process-discipline checks clean; 37 files all in declared scope; forbidden-paths grep empty; mid-wave S4 revision documented in commit message per criterion |
| **integration-safety** (auth boundary) | **PASS** | All 5 boundaries verified; vin-safe-mcp / central-mcp / CommGate untouched; one Resend send to allowlisted recipient; one bonus finding filed as carry-forward |

(qa-evaluator's 5/5 PASS is functionally the 4th convergent verdict at the gate.)

## Carry-forward issues filed (per "no silent scope expansion" rule)

- `I-NEW-2026-05-10-D-SELF-ROLE` (commit `fd5353d`) — sibling defect to I-249; self-role-change in same PATCH handler. Discovered by harness-backend during S5. Deferred to v2.3.
- `I-NEW-2026-05-10-E-ADMINEMAIL-NORM` (commit `a2034da`) — AUTH-D parity gap; org-create path at `server/routes/organizations.ts:255` does NOT normalize `adminEmail`. Discovered by integration-safety during wave-end verification. Deferred to v2.3 (admin-only path; non-public regression vector).

## Operator decisions honored

| Decision | Source | Honored |
|---|---|---|
| Cross-tenant data leak (I-244) is non-negotiable v2.2 fix | operator 2026-05-10 ("We definitely do not want a chance of cross-tenant lead data happening") | ✅ S1 shipped |
| AUTH-D operator-confirmed historical impact (2026-03-20) → v2.2 must-fix | orchestrator advocate + operator deferral on decisions | ✅ S3 shipped |
| RBAC locked for v2.2 | orchestrator advocate + operator deferral | ✅ I-245 + I-247 shipped without RBAC schema changes |
| 5 single-line backend fixes vs full 9-item v2.2 | orchestrator advocate compressed-path recommendation | ✅ AUTH-E/G/H/I correctly deferred to v2.3; I-246 dropped as already-fixed |
| Team dispatch via SendMessage, not fresh Agent spawn | operator 2026-05-10 ("don't kill and recreate") | ✅ All 5 chunks + 4 verifications dispatched via SendMessage to persistent teammates |
| No silent scope expansion (sibling defects FILED not added) | operator + orchestrator discipline | ✅ I-NEW-2026-05-10-D + I-NEW-2026-05-10-E filed, not added to Wave 9-Sec |

## Posture at CLOSING

- Branch HEAD: `a2034da` on `wave/9-sec/triage` (CLOSING commit will advance)
- Provider sends this wave: 1 Resend (allowlisted test_email; S3 verification probe)
- DB writes this wave: S2 timezone net-zero; S3 1 reset_token + 1 outbound_log row; S4 1 updated_at touch (slug unchanged); S1+S5 zero
- Builds this wave: 1 (qa-evaluator pre-probe)
- pm2 restarts this wave: 1 (dev only, post-build for probes)
- Live deploys: 0

---

**Wave 9-Sec status: DONE.**

5 HIGH/MEDIUM security defects closed for v2.2. 4 LOW/MEDIUM items deferred to v2.3. 1 item dropped (already fixed). 2 bonus defects discovered during the wave filed as carry-forward (deferred to v2.3). Phase 9 (Management + Settings — security) elevated from PARTIAL to PROVEN-FOR-V2.2-CRITICAL-PATHS.

