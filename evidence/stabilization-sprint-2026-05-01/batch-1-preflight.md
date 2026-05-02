# Batch 1 Preflight — Data Truth + Sales-vs-Service + Metric Honesty + Push-to-VIN Removal + Idle-Debounce Notifications

**Date:** 2026-05-01
**Sprint:** stabilization-sprint-2026-05-01
**Plan source:** `evidence/stabilization-sprint-2026-05-01/finish-line-plan.md`
**Status:** DRAFTED — awaiting operator approval

**Operator decisions locked (with two constraints):**
- Defaults applied across D-A1 / D-B1 / D-F1 / D-G1 / D-H1 / D-I1 / D-I2 / D-I3 / D2-Q1 / D2-Q2 / D3-Q1–Q5 / D6-Q1
- **Constraint 1 (UI scope):** UI changes in this batch are limited to (a) metric remove/replace in `insights.tsx` + `sales.tsx`, and (b) Push-to-VIN button/Dialog deletion in `teambox.tsx`. **No other UI work.** Explicit exception statement in §3 below.
- **Constraint 2 (Weekly report):** Weekly sales report is sales-only by default. No opt-in flag, no operator escape, no service-included path.

---

## 1. Selected batch + dispatches integrated

Batch 1 of three. Dispatches read from disk:

| Dispatch | Output | Verdict used |
|---|---|---|
| 1 — Schema/Data Classification | `evidence/.../finish-line-findings/01-schema-taxonomy.md` | Predicate = `vin_status NOT LIKE 'SERVICE%'` via existing `isServiceLead` at `server/statusClassifier.ts:47-49`. BL-107 → v2.3. |
| 2 — Reports | `evidence/.../finish-line-findings/02-reports.md` | 6 leak sites in `weeklyReportService.ts`. Default-on filter. Subject amendment. Test inversion. `dailyRecapService.ts` already correct. |
| 3 — Metrics | `evidence/.../finish-line-findings/03-metrics.md` | 8-row per-metric verdict matrix (5 fix, 3 swap, 0 deferred — all addressed in 1C). |
| 4 — Marketing Insights | `evidence/.../finish-line-findings/04-marketing-insights.md` | Bug is client-side; fix → BL-112 v2.3 per UI constraint. NOT in Batch 1. |
| 5 — Workflow QA | `evidence/.../finish-line-findings/05-workflow-qa.md` | Batch 2 matrix; not used here. |
| 6 — TeamBox Operability | `evidence/.../finish-line-findings/06-teambox-operability.md` | Channel filter → BL-113 v2.3. Voice de-dup → producer-side fix in 1F's vicinity but kept as separate concern (see §4 Chunk 1F sidebar). AI-role → BL-108 v2.3. P0 push-to-VIN finding addressed in 1F. |

---

## 2. Files in scope

| File | Edit type | Justification |
|---|---|---|
| `server/services/weeklyReportService.ts` | server data-shape | 1B — 6 leak sites + subject |
| `server/__tests__/weeklyReport.content.test.ts` | server test | 1B — invert opt-in test |
| `server/routes/insights.ts` | server data-shape | 1C — metrics 1, 2, 3, 4, 6 |
| `server/vendorProxy.ts` | server data-shape | 1C — metrics 5, 7 |
| `server/services/lib-8.ts` (or wherever lifetime-win-rate lives) | server data-shape | 1C — metric 1 swap |
| `server/storage.ts` (lines 1198–1203) | server filter | 1D — activity feed |
| `server/routes/conversations.ts` (lines 281–381) | server route deletion | 1F — Push-to-VIN route removal |
| `server/services/notificationService.ts` | server addition | 1G — idle-debounce |
| `client/src/pages/insights.tsx` | UI (metric remove/replace ONLY) | 1C — consumer-side label/suppress |
| `client/src/pages/sales.tsx` | UI (metric remove/replace ONLY) | 1C — consumer-side label/suppress |
| `client/src/pages/teambox.tsx` (lines 976–999) | UI (Push-to-VIN button/Dialog deletion ONLY) | 1F |
| `server/__tests__/statusClassifier.test.ts` (NEW) | new test file | 1A |
| `server/__tests__/notificationService.idle-debounce.test.ts` (NEW) | new test file | 1G |

## 3. Files NOT in scope (UI exception statement — operator constraint #1)

**`insights.tsx` and `sales.tsx`:** allowed ONLY for label, suppress, or replace of visible misleading metrics per the D-F1 verdict matrix. **NOT allowed:** layout changes, tab changes, new components, styling, color changes, accessibility refactors, copy edits unrelated to a metric, removal of working metrics, addition of any new metric, or any other UI cleanup. If the consumer-side change for a metric requires touching layout (e.g., replacing a 4-tile row with 3 tiles), that is OUT of scope and the metric is suppressed (set to hidden) rather than re-flowed.

**`teambox.tsx`:** allowed ONLY to remove the Push-to-VIN button + Dialog (lines 976–999 plus any direct callers within the same file). **NOT allowed:** layout changes, channel filter changes (deferred BL-113), AI-role rendering changes (deferred BL-108), voice de-dup display changes (1F handles producer-side; consumer-side is OUT), or any other UI cleanup. The Dialog/button block is deleted, not refactored.

**Globally NOT in scope (Batch 1):**
- Any other `client/src/` file
- `shared/schema.ts` (no migration; D-A1 path b confirmed)
- `server/db/migrations/` (no migrations)
- Any infrastructure file (`.github/workflows/`, `~/Claude-store/sysadmin/`, harness hooks)
- Any provider integration code that touches sending logic (deferred to Batch 2)
- Any test outside the listed paths

Code-reviewer (separate fresh session) will verify the diff against this exception statement and BLOCK if any out-of-scope file is touched.

---

## 4. Per-chunk plan (7 chunks, executed sequentially with per-chunk operator approval)

### Chunk 1A — Confirm `isServiceLead` helper + add unit test

| Field | Value |
|---|---|
| Files | `server/statusClassifier.ts` (read-only confirm), `server/__tests__/statusClassifier.test.ts` (NEW) |
| UI scope marker needed | NO |
| Expected commits | 1 |
| Tests added | unit test fixture covering all SERVICE_* enum values + non-service values + null/undefined |
| Delta 1 | `npm run check` passes; new unit test passes locally; scope-verification PASS |
| Delta 2 | dev runtime — confirm `isServiceLead('SERVICE_APPOINTMENT_SCHEDULED') === true` and `isServiceLead('CONTACT_LATER') === false` via `npx tsx -e` invocation; capture output |
| Stop conditions | Helper signature changes during read; helper not actually exported; existing consumer breaks |
| Risk | LOW — read-only confirm + new test file |

### Chunk 1B — Weekly report sales-only filter (default-on) + subject amendment + test inversion

| Field | Value |
|---|---|
| Files | `server/services/weeklyReportService.ts`, `server/__tests__/weeklyReport.content.test.ts` |
| UI scope marker needed | NO |
| Expected commits | 1 |
| Specific edits | (a) embed `isServiceLead`-based exclusion in 6 SQL sites: `:870-881`, `:1223-1233`, `:1697-1703`, `:1759-1766`, `:1860-1874`, `:1912-1925`; (b) delete unused `salesOnlyLeadIds` opt-in plumbing entirely (it was always opt-in, never invoked); (c) amend subject to be explicit about scope ("Weekly Sales Report — sales leads only" or similar); (d) invert existing `weeklyReport.content.test.ts:405-453` test (the opt-in path becomes default — the test now asserts service rows are excluded by default); (e) add new fixture-based test asserting service-exclusion across all tile types |
| Delta 1 | `npm run check` passes; new + inverted tests pass; scope-verification PASS |
| Delta 2 | **PROVIDER ACTION (Resend dry-run)** — destination = `duane.wells@huminic.ai` ONLY; per Section 11.2 of finish-line-plan.md: present destination-classification table + `test-orgs-allowlist-check.sh recipient duane.wells@huminic.ai` exit-0 BEFORE the send; capture Resend receipt ID; capture before/after row counts via SQL; capture rendered email body diff (with-filter vs without-filter); operator visually inspects email body and confirms it reads as sales-only |
| Stop conditions | Any test-lane recipient is non-allowlisted; Resend send doesn't arrive at allowlisted inbox within 60s; row-count delta is suspicious (e.g., >50% reduction would suggest the predicate is wrong) |
| Risk | MEDIUM — touches Monday-customer-facing email path; mitigated by dev-first + operator visual inspection |

### Chunk 1C — Insights metric data-shape changes (8 metrics per D-F1 matrix)

**Highest-risk chunk per operator. Implementation proof is per-metric, not bundled.** Each metric is its own micro-chunk with its own before/after evidence row in the dual-delta pack. The chunk merges as one PR but the evidence is structured per-metric.

| Field | Value |
|---|---|
| Files | `server/routes/insights.ts` (lines 113, 129, 138, 245, 1045-1047), `server/vendorProxy.ts` (lines 641, 642), `server/services/lib-8.ts` (or wherever lifetime-win-rate computation lives), `client/src/pages/insights.tsx` (consumer-side label/suppress only), `client/src/pages/sales.tsx` (consumer-side only) |
| UI scope markers needed | **YES — `insights.tsx.ok` + `sales.tsx.ok`** (operator approves at Batch 1 approval point per §5) |
| Expected commits | 1 (or 2 if operator wants splitting) |

**Per-metric proof matrix** — every row required in the Delta-2 evidence file `evidence/stabilization-sprint-2026-05-01/batch-1/1C/per-metric-proof.md`:

| # | Metric | Verdict | Before value (live) | Source/computation | After behavior | Proof artifact |
|---|---|---|---|---|---|---|
| 1 | Conversion rate (`insights.ts:113, 238`; `vendorProxy.ts:641`) | swap → true lifetime win rate `sold/(sold+lost)` | "100%" on serra_honda | new helper consumes `warehouse_leads` lifetime totals | "18.3%" or current honest figure | API JSON before/after; `/insights` page screenshot before/after |
| 2 | Top sources A+/A/B/C (`insights.ts:129`) | suppress letter; show counts + winRate | `[{grade:"A+"}, ...]` positional | drop `grade` field from response | array carries `volume` + `winRate` only | API JSON before/after; `/insights` page screenshot before/after |
| 3 | Pipeline forecast (`insights.ts:245`) | swap/relabel OR suppress | "X" labeled as forecast, actually 30d sold | implementer chooses: (a) wire `projectedMonthClose` from `lib-33` if it actually exists and computes a real forecast; OR (b) suppress until producer ships. **Implementer documents choice + reason in proof.** | either "Projected month close: Y" with honest computation, OR field absent | API JSON before/after; `/insights` page screenshot before/after; implementer-choice rationale |
| 4 | Lead-source trend (`insights.ts:138`) | suppress (drop "flat" literal) | `"flat"` always | drop the `trend` field from response | field absent | API JSON before/after; `/insights` page screenshot showing chart no longer shows "flat" badge |
| 5 | Sales/service contamination across all metrics | fix — apply `isServiceLead` predicate at every `getWarehouseLeads` site in `vendorProxy.ts` and `insights.ts` | per-org volume includes service traffic | predicate filters at query layer | per-org volume drops 10.4–35.4% (matches Schema agent SQL for serra_honda et al) | API JSON before/after for `/api/insights/dashboard`; SQL row-count proof |
| 6 | `metricsAllZero` fallback (`insights.ts`) | fix — drop pretzel; honest pass-through | fallback hits 100% of requests; insights show synthetic-shaped zeros | remove fallback path; let real data flow through | endpoint returns real values OR honest zeros, NOT synthesized shape | API JSON before/after; sample request log |
| 7 | `leadSummary.source` "warehouse" (`vendorProxy.ts:642`) | suppress dead branch | always returns `"warehouse"` | delete the dead `if` branch | field accurate (or absent) | API JSON before/after |
| 8 | Sales activity feed (`storage.ts:1198-1203`) | fix server-side; add `userId IS NOT NULL AND entityType NOT IN ('sync','system')` | serra_honda 50/50 entries are `sync_delta_completed` | predicate filters at query layer | feed contains user-attributable rows only | SQL row count before/after; `/sales` page screenshot of activity feed |

**Sub-chunk-by-sub-chunk merge:** harness-backend teammate may implement and commit one metric at a time, OR all 8 in a single commit. Either way, the per-metric proof rows are individually verifiable by the qa-evaluator teammate before code-reviewer signs off.

**Monolith-prevention rule (operator add):** if Chunk 1C touches more than the declared metric surfaces (the file:line list above) OR becomes hard to review as one patch, the harness-backend teammate splits into metric groups (suggested split points: metrics 1+3 swap-with-real-computation; metrics 2+4+7 suppress; metrics 5+6+8 query-layer fix) BEFORE handing to qa-evaluator and code-reviewer. Each metric group becomes its own sub-chunk-commit and its own evidence-row pass through qa-evaluator + code-reviewer. **Do not let 1C become a monolith.** The decision to split (or not) is made by the harness-backend teammate after the implementer has the diff in hand and is recorded in the chunk's evidence file with one-line rationale.

| Field | Value |
|---|---|
| Delta 1 | `npm run check` passes; existing tests pass; scope-verification PASS for both server and UI scope markers |
| Delta 2 | per-metric proof rows above; Playwright walk of `/insights` and `/sales` as `serra_honda@huminic.ai` (read-only) — capture before/after screenshots for each affected card; SQL row counts captured from a read-only DB session |
| Stop conditions | Any metric's "after" value is still misleading (e.g., conversion rate still > 50%); any per-metric before/after row missing; any UI scope marker absent at edit time |
| Risk | HIGH — touches dealer-visible numbers across two pages and one report. Mitigated by per-metric proof, per-metric operator inspection, dev-first |

### Chunk 1D — Activity feed system-event filter

| Field | Value |
|---|---|
| Files | `server/storage.ts:1198-1203` |
| UI scope marker needed | NO (server-side filter; no client change required) |
| Expected commits | 1 (likely combined into 1C commit if cleaner) |
| Specific edit | Add `WHERE userId IS NOT NULL AND entityType NOT IN ('sync','system')` to `getActivityLogs` query |
| Delta 1 | `npm run check`; existing tests pass; new SQL assertion test if existing test framework allows |
| Delta 2 | SQL row-count proof: serra_honda activity_log entries before vs after (expect ~50/50 → ~user-only); Playwright `/sales` activity feed shows real activity, not sync events |
| Stop conditions | Filter excludes legitimate system events that dealers actually need (operator inspection during dev) |
| Risk | LOW — server-side, easy revert |

### Chunk 1E — Vendor proxy dead-branch removal

| Field | Value |
|---|---|
| Files | `server/vendorProxy.ts:641-642` |
| UI scope marker needed | NO |
| Expected commits | 1 |
| Specific edit | grep across codebase for any reference to the `"warehouse"` source value before removal; if no live consumer, delete the branch; if any consumer, halt and re-scope |
| Delta 1 | `npm run check`; grep proof of zero references; tests pass |
| Delta 2 | API JSON shape before/after (the dead branch produced `leadSummary.source: "warehouse"` always; after removal, field absent or accurate) |
| Stop conditions | Any consumer found in client/src/ or server/ that depends on the literal `"warehouse"` value |
| Risk | LOW |

### Chunk 1F — Push-to-VIN button + route removal (operator constraint #2 proof)

| Field | Value |
|---|---|
| Files | `server/routes/conversations.ts:281-381` (delete route handler), `client/src/pages/teambox.tsx:976-999` (delete Dialog + button + any nearby Push-to-VIN-only state, e.g., `pushToVinDialogOpen` if exists) |
| UI scope marker needed | **YES — `teambox.tsx.ok`** (operator approves at Batch 1 approval point per §5) |
| Expected commits | 1 |
| **Pre-removal proof requirements** (per operator tightening point #2): | |
| (a) | `rg -n "push-to-vin\|push_to_vin\|pushToVin\|push-to-VIN\|/api/conversations/[^/]+/push-to-vin"` across `client/`, `server/`, `shared/`, `tests/`, `docs/` — capture every match in proof file |
| (b) | If any match exists OUTSIDE the two files being edited, halt the chunk; re-scope; consult operator |
| (c) | API behavior post-removal: route returns 404 (not registered). Capture via `curl -X POST https://dev.huminicdev.com/api/conversations/<id>/push-to-vin` returning 404. **Do NOT call this on live before the deploy step.** |
| (d) | UI behavior post-removal: button absent + Dialog absent. Capture via Playwright walk of `/teambox` as `serra_honda@huminic.ai`, open a conversation with non-trivial content, confirm no "Push to VIN" button visible. |
| (e) | Backlog `BL-109` filed in `backlog.md` with: objective (re-implement VIN lead injection via ADF/XML), scope (wire `vin_safe_mcp` ADF-XML endpoint or new MCP tool; produce per-org config; CommGate-respecting send; audit trail), done-looks-like (Serra Honda can route a fresh conversation lead to VIN via ADF/XML and operator can verify it landed in VIN), constraints (must use `vin-safe-mcp` per CLAUDE.md; no central-mcp; respect prepare→review→execute→verify), tasks (4-6 enumerated). |
| Delta 1 | `npm run check`; rg proof captured (a); BL-109 entry committed in same chunk |
| Delta 2 | dev API 404 proof (c); Playwright UI absence proof (d); confirm `audit_log` shows no calls to the removed route in test-lane |
| Stop conditions | Any external caller found in (b); 404 not returned (e.g., another route shadows it); button still visible after removal |
| Risk | MEDIUM-HIGH — visible removal of an existing UI element + visible removal of an unsafe route. Mitigated by exhaustive grep, dev-first, BL-109 detail. |

### Chunk 1G — Idle-debounce notification rule (operator tightening point #3)

| Field | Value |
|---|---|
| Files | `server/services/notificationService.ts` (additions only; no deletes), possibly `server/scheduler.ts` (or wherever the 5-min tick lives — read-only confirm) |
| UI scope marker needed | NO (server-only) |
| Expected commits | 1 |
| **Done condition (per operator tightening point #3):** | |
| (a) | **Where the config lives:** per-org idle-window value lives in the existing `organizations` table column **IF** such a column already exists OR in an existing per-org settings JSON field. **NO DB MIGRATION.** If no suitable existing surface is found, the implementer hardcodes 30-min default in code with a code-comment noting "BL-110: per-org idle-window override needs settings surface" — and the per-org-configurable claim is dropped from the v2.2 release note. |
| (b) | **Default behavior if unset:** 30 minutes. Documented in code comment. |
| (c) | **No DB migration unless already supported:** confirmed (a) — implementer must verify before edit; if no existing surface, fall back to hardcoded default. |
| (d) | **What counts as "same conversation" for debounce:** rows in `messages` (or `conversation_messages`) sharing the same `conversation_id`. The "last message timestamp" is `MAX(created_at)` for that `conversation_id`. The debounce fires when `now() - MAX(created_at) >= idleWindowMs` AND no notification has fired for this `conversation_id` since the last message-burst started. (Tracking: query `notifications` table for the most recent `notification_type='conversation_idle'` row for this `conversation_id`; compare timestamp.) |
| (e) | **Test proving two quick replies produce one notification, later reply produces another:** new test file `server/__tests__/notificationService.idle-debounce.test.ts`. Test 1: insert conversation + 3 messages within 5 min span; advance scheduler tick by 30 min of clock; assert exactly 1 notification fires. Test 2: same, then insert another message at minute 60; advance tick by 30 min more; assert a SECOND notification fires. Test 3: edge case — single message in conversation, no reply; advance 30 min; assert 1 notification fires. |
| (f) | **Code comments** noting future-exploration hooks (per operator request when locking in option A): (i) where the appointment-intent classifier could re-use to fire instant "substance" emails (B-option deferred); (ii) where a future "of substance" classifier (intent / keyword / lead-status-change) would hook in; (iii) where per-channel differentiation could go (currently uniform across channels); (iv) BL-110 covers advanced rules (round-trip detection + substance classification); (v) the 30-min default and per-org override path. |
| Delta 1 | `npm run check`; 3-test suite passes; scope-verification PASS |
| Delta 2 | **PROVIDER ACTION (Resend dry-run)** — exactly as 1B's preflight (destination = `duane.wells@huminic.ai`; allowlist exit-0 confirmed). Triggered manually via `npx tsx server/comms-test.ts notify-idle-debounce <orgId> <conversationId>` (or the existing test surface — implementer may add). Confirm exactly one email arrives in the inbox. Then trigger again with controlled 60-min gap; confirm second email arrives. |
| Stop conditions | Any DB migration is needed (means existing surface check failed); test-lane recipient is non-allowlisted; more than one email fires in the 30-min idle window; the existing 5-min tick is overloaded by the new check |
| Risk | MEDIUM — new send path; mitigated by allowlist-only test, per-test assertion, no migration |

---

## 5. UI scope markers — requested AT Batch 1 approval point (operator tightening point #5)

When operator approves this preflight, the orchestrator will request the following three markers explicitly:

```
mkdir -p .claude/state/scope
touch .claude/state/scope/insights.tsx.ok    # Chunk 1C only
touch .claude/state/scope/sales.tsx.ok       # Chunk 1C only
touch .claude/state/scope/teambox.tsx.ok     # Chunk 1F only
```

**Each marker auto-clears on first use.** After Chunk 1C's harness-backend teammate completes its edit pass, the `insights.tsx.ok` and `sales.tsx.ok` markers are gone — any further edit attempt to those files would be blocked by `edit-scope-guard.sh`. Same for `teambox.tsx.ok` after Chunk 1F. Code-reviewer teammate will confirm absence of stray markers in the post-chunk audit.

The orchestrator will NOT pre-create these markers before operator approval. They are part of the approval handoff.

---

## 6. Teammates and audit subagents (operator tightening point #6)

**Subagent vs teammate axis (per docs, not invented):**
- **Subagent** = `Agent` tool, runs inside the current session's process, fresh context window, returns one summary, dies. Cannot see the team mailbox or task list. Right primitive for "give me one answer" read-only tasks AND for **audit roles that must stay uncontaminated by team chatter**.
- **Teammate** = separate Claude Code instance (per `code.claude.com/docs/en/agent-teams.md`), full session, file-backed mailbox, bidirectional peer messaging. Right primitive for collaboration / handoff / disagreement work.

**Architectural correction (operator 2026-05-02):** the docs do NOT expose a switch to disable peer messaging within a team. There is no per-teammate ACL, no isolation mode, no "audit-only" teammate. If a role must audit without team-mailbox influence, it must be a subagent dispatched by the lead at a gate point — not a teammate.

**Waves 1–3 (already complete)** used subagents because they were one-shot read-only investigations. Subagent was the right primitive.

**Env precondition:** `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` (verified ON in the orchestrator's shell + `~/.claude/settings.json` 2026-05-02). If this var is unset in any future session, agent-teams falls back to subagents — orchestrator must STOP and re-enable before spawning teammates.

### Per-chunk role assignment (collaborator vs auditor)

| Role | Mechanism | Rationale |
|---|---|---|
| `harness-backend-1X` | **teammate** | Implementer; may need to coordinate with the lead during edits, ask clarifying questions, or hand off if a chunk splits sub-chunks. Collaborator. |
| `qa-evaluator-1X` | **subagent** dispatched by lead AFTER builder idles | Produces dual-delta proof. Should assess what the builder produced, not what the builder said about it. Audit role; must stay uncontaminated by team chatter. |
| `code-reviewer-1X` | **subagent** dispatched by lead AFTER builder idles | Independent diff review is the whole point. Audit role. |
| `integration-safety-1X` (1B + 1G only) | **subagent** dispatched by lead AFTER builder idles + before any provider action | External-provider boundary check. Audit role. |
| `scope-guardian-1X` (any chunk where diff scope is in question) | **subagent** dispatched by lead AT gate point | Verifies declared scope vs actual diff. Audit role. |

### Per-chunk lifecycle

```
1. Lead spawns harness-backend-1X as a teammate joined to nexxus-finish-line.
   - Brief includes: chunk spec from §4, file scope, the relevant per-file
     UI scope marker(s) if applicable, the dual-delta proof requirements
     from §9, and the stop conditions for that chunk.
2. Builder works in its own session. May message the lead with questions.
3. Lead waits for TeammateIdle on the builder.
4. Lead reads the builder's diff (chunk branch).
5. Lead dispatches qa-evaluator AS A SUBAGENT with explicit brief:
   "Here is the diff at SHA <X>. Here is the dual-delta proof requirement
    for this chunk from batch-1-preflight.md §4. Produce both deltas.
    DO NOT read the team mailbox or task list — your verdict must be
    independent. Return one summary."
6. Subagent returns verdict; lead inspects.
7. Lead dispatches code-reviewer AS A SUBAGENT with the same isolation
   instruction. Returns verdict.
8. (If chunk touches external-provider boundary) Lead dispatches
   integration-safety AS A SUBAGENT. Returns verdict.
9. Lead presents diff + all subagent verdicts to operator.
10. Operator approves merge of chunk branch into batch-1-finish-line.
11. Lead messages builder teammate that the chunk is closed; builder
    teammate may shut down or move to next chunk if assigned.
```

This honors operator's "audit must be uncontaminated" while keeping the builder's collaboration surface available. Token cost is bounded: one teammate per chunk + 2–3 small subagent dispatches per chunk, vs the prior all-teammates pattern which would have been 3–4 full sessions per chunk.

### Roster summary

| Chunk | Builder (teammate) | Auditors (subagents dispatched at gate) |
|---|---|---|
| 1A | `harness-backend-1A` | qa-evaluator, code-reviewer |
| 1B | `harness-backend-1B` | qa-evaluator, code-reviewer, integration-safety (Resend dry-run) |
| 1C | `harness-backend-1C` | qa-evaluator (per-metric proof), code-reviewer (incl. monolith-prevention check), scope-guardian (UI files touched) |
| 1D | `harness-backend-1D` | qa-evaluator, code-reviewer |
| 1E | `harness-backend-1E` | qa-evaluator, code-reviewer (esp. dead-branch grep), scope-guardian |
| 1F | `harness-backend-1F` | qa-evaluator (rg + UI absence + 404 proofs), code-reviewer, scope-guardian (server route + UI Dialog deletion both in declared scope) |
| 1G | `harness-backend-1G` | qa-evaluator, code-reviewer, integration-safety (Resend dry-run) |

**Orchestrator role:** never performs coding work itself, never edits product code. Spawns the teammate, briefs auditor subagents at gate points with diff + spec + the explicit "do not read team mailbox" instruction, integrates results, presents to operator.

---

## 7. Deploy plan

1. After every chunk: harness-backend teammate commits to a chunk-N branch (e.g., `chunk-1c-metrics-honesty`) off the current branch. Operator reviews diff. Approves merge of chunk branch into a Batch-1 integration branch (`batch-1-finish-line`).
2. After Chunk 1G (final): operator reviews the consolidated `batch-1-finish-line` branch.
3. Build + dev `pm2 reload` (with operator approval, exact command shown).
4. Verify on `dev.huminicdev.com` per Chunk 1B + 1G's Delta 2 + per-route smoke for `/insights` + `/sales` + `/teambox`.
5. Operator approves PR-to-main (exact `gh pr create` command shown).
6. Operator approves merge + live deploy (exact `gh pr merge` + `gh run watch` shown).
7. Live verification per the live deploy checklist in finish-line-plan.md Section 11 (`/api/health` 200 with new SHA, route smoke, weekly-report dry-run on live with allowlist destination).
8. Cleanup: chunk branches archived; Batch-1 evidence pack written to `evidence/stabilization-sprint-2026-05-01/batch-1-deploy-verification/`.

**No live deploy until operator explicitly approves.** No autonomous push at any point. CI completion alone is not approval.

## 8. Rollback plan

- Per chunk: `git revert <sha>` on the chunk branch before merge to `batch-1-finish-line`. No deploy implication.
- Post-merge to `batch-1-finish-line`: `git revert <sha>` on the integration branch.
- Post-PR-to-main: `git revert <merge-sha>` + new PR + redeploy (operator-approved).
- Worst case: `git checkout becb739` (PR #6 baseline) + force-redeploy (operator-approved with explicit reason). Last-resort only.

## 9. Harness markers needed (per chunk)

Each chunk's harness-backend teammate MUST produce, via `mark-complete.sh` ONLY after a real fresh-session verdict in the current session-id:
- `verify-scope` (always)
- `proof` (always; dual-delta evidence path)
- `code-review` (always; from code-reviewer teammate's verdict)
- `integration-safety` (1B and 1G — Resend provider action)
- `launch-check` (NOT needed unless launch criteria change; these chunks are quality, not launch)
- `testing-level` (`sprint`)

**No recycled `*.no-session.ok` markers.** Stale markers from prior sessions are inert.

## 10. Stop conditions (batch-level)

- Schema agent's predicate fails downstream (e.g., a tile becomes empty unexpectedly) → STOP, escalate to operator
- Test-lane envelope breach (any non-allowlisted recipient) → STOP, escalate
- Stop hook blocks a marker that should pass → investigate; do NOT pretextually create marker
- Push-to-VIN removal grep finds an external caller → STOP, re-scope (chunk 1F)
- Idle-debounce requires DB migration → STOP, fall back to hardcoded default per §4 1G(a)
- Any UI scope marker is missing at edit time → BLOCKED by hook; ask operator for the specific marker
- Any chunk diff includes files outside §2 → STOP merge; reduce to declared scope; re-review
- Operator pause / cancel → orchestrator marks chunk PAUSED in session.md; teammate goes idle; no merged-but-not-verified work left

## 11. Approvals needed (in order)

1. **Operator approves THIS preflight** (single review pass).
2. **Operator authorizes the three UI scope markers** (`insights.tsx.ok`, `sales.tsx.ok`, `teambox.tsx.ok`) — orchestrator runs the `touch` commands explicitly per §5.
3. **Operator authorizes D-I1 / D-I2 / D-I3** if they want them done before Batch 1 (each with exact command shown).
4. **Per-chunk approval** before each harness-backend teammate spawns AND before each chunk's commit merges into `batch-1-finish-line`.
5. **Operator approves dev verification** (review evidence; ok to PR).
6. **Operator approves PR-to-main** (`gh pr create` command shown).
7. **Operator approves live deploy** (`gh pr merge` + `gh run watch`).

## 12. v2.3 backlog deferrals (filed at Batch 3 closeout)

| ID | Item | Source |
|---|---|---|
| BL-107 | `lead_type` enum migration on `warehouse_leads` | Dispatch 1 |
| BL-108 | TeamBox AI-role visual distinction | Dispatch 6 |
| BL-109 | VIN ADF/XML lead-injection path (replaces removed Push-to-VIN button) | Operator decision 2026-05-01 |
| BL-110 | Advanced notification rules (round-trip detection, "of substance" classifier, appointment-intent re-use) | Dispatch 5 + operator |
| BL-111 | Sales Coordinator role | Operator decision 2026-05-01 |
| BL-112 | Marketing Insights `scope` prop fix | Dispatch 4 |
| BL-113 | TeamBox channel filter (`video`, `form`) | Dispatch 6 |

These are NOT filed during Batch 1. They land in `backlog.md` + `issues.md` at Batch 3 closeout to keep current diffs lean.
