# Nexxus Finish-Line Agent Dispatch Packet

**Source plan:** `evidence/stabilization-sprint-2026-05-01/finish-line-plan.md`
**Plan-mode authoring artifact:** `~/.claude/plans/moonlit-booping-popcorn.md` (Section 7, verbatim split)
**Date:** 2026-05-01

This packet supersedes `evidence/stabilization-sprint-2026-05-01/p1-agent-dispatch-packet.md` (5-dispatch P1 packet from earlier this session). The earlier packet is preserved for audit; the dispatches below are the authoritative finish-line set.

---

## 7.0 Common boilerplate for every dispatched agent

**These dispatches are NOT executed inside the orchestrator session. Operator opens a fresh top-level Claude session per dispatch and pastes the dispatch block verbatim.**

**Read first (every agent):**
1. `/home/ubuntu/Claude-store/nexxus2.2_replit/CLAUDE.md`
2. `/home/ubuntu/Claude-store/nexxus2.2_replit/evidence/stabilization-sprint-2026-04-30/overnight-validation-report.md`
3. `/home/ubuntu/Claude-store/nexxus2.2_replit/evidence/stabilization-sprint-2026-05-01/finish-line-plan.md` (Section 3 — Remaining Work Inventory)
4. `/home/ubuntu/Claude-store/nexxus2.2_replit/issues.md` (search for `I-NEW-2026-05-01-` and `BL-107`)
5. `/home/ubuntu/Claude-store/nexxus2.2_replit/backlog.md`
6. `/home/ubuntu/Claude-store/nexxus2.2_replit/shared/schema.ts` (entire file)

**Hard rules (every agent):**
- READ-ONLY. No `Write` to product code. No `Edit` of product code. Evidence files only.
- No `pm2 restart`, no `npm run build`, no DB writes, no provider sends, no provider proof actions (those are Batch 2's qa-evaluator job).
- No `Agent` calls (no nested subagents). You are a leaf agent.
- No git pushes, no merges, no branch deletions.
- Stay inside `/home/ubuntu/Claude-store/nexxus2.2_replit/`.
- If you discover a P0 production safety issue, STOP, document at top of evidence file, exit. Do not auto-remediate.

**Return format (every agent):**

```markdown
# <Agent name> findings — 2026-05-01

## Scope of investigation
<one paragraph>

## Findings (max 10)
### Finding N — <title>
- **What:** <observation>
- **Where:** `path/to/file.ts:LINE`
- **Why it matters:** <user / data / multi-tenant implication>
- **Likely fix shape:** <one sentence>
- **Effort:** S / M / L
- **Risk if shipped wrong:** <impact>

## Proposed implementation chunks (suggested order)
- Chunk A — <focused PR scope, files, test plan, two deltas of proof>

## Proof needed before any chunk is approved
- <bullets>

## Open questions for operator
- <numbered>

## Out of scope for this investigation
- <numbered>
```

**Output paths (one file per agent):**

| Agent | Output file |
|---|---|
| 1. Schema / Data Classification | `evidence/stabilization-sprint-2026-05-01/finish-line-findings/01-schema-taxonomy.md` |
| 2. Reports | `evidence/stabilization-sprint-2026-05-01/finish-line-findings/02-reports.md` |
| 3. Metrics | `evidence/stabilization-sprint-2026-05-01/finish-line-findings/03-metrics.md` |
| 4. Marketing Insights | `evidence/stabilization-sprint-2026-05-01/finish-line-findings/04-marketing-insights.md` |
| 5. Workflow QA | `evidence/stabilization-sprint-2026-05-01/finish-line-findings/05-workflow-qa.md` |
| 6. TeamBox Basic Operability | `evidence/stabilization-sprint-2026-05-01/finish-line-findings/06-teambox-operability.md` |

The `finish-line-findings/` directory is pre-created.

## 7.1 Sequencing recommendation

1. **Dispatch 1 (Schema)** — first. Every other dispatch's recommendations depend on knowing what classification is even possible.
2. **Dispatches 2, 3, 4 in parallel** — once Schema results are on disk, three consumers can be analyzed concurrently in three separate sessions.
3. **Dispatch 5 (Workflow QA)** — can run in parallel with 2/3/4. Doesn't depend on Schema.
4. **Dispatch 6 (TeamBox Basic Operability)** — last; reads Dispatch 1 + 4 outputs to scope intersections.

Total wall-clock: ~2 sequential rounds. No agent reads another's chat history; everything via files on disk.

## 7.2 Dispatch 1 — Schema / Data Classification Agent

**Subagent type for fresh session:** `general-purpose` (read-only)
**Output:** `evidence/stabilization-sprint-2026-05-01/finish-line-findings/01-schema-taxonomy.md`

> You are a read-only investigator. Read the common boilerplate at `evidence/stabilization-sprint-2026-05-01/finish-line-agent-dispatches.md` Section 7.0 and obey every rule. No edits, no subagents, no DB writes, no migrations.
>
> **Focus:** Determine the source-of-truth column(s) for sales-vs-service classification on `warehouse_leads`, and decide whether `BL-107 lead_type` migration is required for v2.2.
>
> **Read first:** the common boilerplate list, plus `server/services/leadClassification.ts` (if exists), every consumer of `data_source` / `lead_source` / `vin_status` / `lead_type` / `department` (search both client and server), `evidence/stabilization-sprint-2026-04-30/lane-2-teambox-taxonomy.md`.
>
> **Specifically answer:**
> 1. **Inventory:** Which `warehouse_leads` columns currently exist that could classify sales vs service? Cite each with `shared/schema.ts:LINE`.
> 2. **Coverage:** For each candidate column, what fraction of rows are populated? Read-only SQL enumerating distinct values + row counts scoped to last 90 days. Document SQL + result.
> 3. **Reliability:** Are any reliable enough to be the source of truth today? Specifically does `lead_source LIKE '%service%'` or `vin_status` actually correlate with what a dealer would call a "service lead"?
> 4. **Gap:** If no existing column suffices, propose `lead_type` enum (`sales` | `service` | `parts` | `unknown`?) — values, NULL semantics, default for backfill, which existing column(s) would feed backfill.
> 5. **Migration risk:** Migration shape `ALTER TABLE warehouse_leads ADD COLUMN lead_type ...` — what tables/views/queries break or need updating? List with file:line.
> 6. **BL-107 status:** Does `BL-107` exist in `backlog.md` already? If not, what would the entry look like (objective / scope / done-looks-like / constraints / tasks)?
> 7. **Source-of-truth recommendation:** Until `lead_type` exists (if it doesn't), what is the best-effort heuristic the consumer code (Reports, Metrics, TeamBox) should use? Document the exact predicate. **This is the predicate Batch 1 will use.**
>
> **Do not:** Run any DDL or DML. All SQL `SELECT` only. Do not run `drizzle-kit push`. Do not modify any file.

## 7.3 Dispatch 2 — Reports Agent

**Subagent type:** `general-purpose` (read-only)
**Output:** `evidence/stabilization-sprint-2026-05-01/finish-line-findings/02-reports.md`

> You are a read-only investigator. Read the common boilerplate at `evidence/stabilization-sprint-2026-05-01/finish-line-agent-dispatches.md` Section 7.0 and obey every rule. No edits, no subagents, no DB writes, no provider sends.
>
> **Focus:** Weekly + daily reports mixing service traffic into sales totals. Identify every leak; propose minimum-surface-area fix.
>
> **Read first:** common boilerplate, Dispatch 1 output (`finish-line-findings/01-schema-taxonomy.md` IF present), `server/services/weeklyReportService.ts` (whole file), `server/services/dailyRecapService.ts` (whole file), `evidence/stabilization-sprint-2026-04-30/lane-4-sales-reports.md`.
>
> **Specifically answer:**
> 1. Where in `weeklyReportService.ts` is the lead-volume tile computed? Does it apply a sales-only filter? On what column?
> 2. Same for conversion-rate tile, appointment tile, sources/leaderboard tile.
> 3. Same for `dailyRecapService.ts`.
> 4. Where in the rendering chain (server → email template → SMS template) does service data leak in? Every site.
> 5. Read-only SQL showing example service records that appeared in the last weekly report; document SQL + result.
> 6. Is the operator-visible report subject + body honest about scope, or does it imply "sales-only" while including service?
> 7. Propose the minimal patch: (a) what call sites pass `salesOnlyLeadIds`, (b) where the predicate from Dispatch 1 plugs in, (c) any consumer-side display change required.
>
> **Do not:** Modify weeklyReportService.ts, dailyRecapService.ts, or any related file. Do not send a real report. Do not propose schema fixes — that's Dispatch 1's job.

## 7.4 Dispatch 3 — Metrics Agent

**Subagent type:** `general-purpose` (read-only)
**Output:** `evidence/stabilization-sprint-2026-05-01/finish-line-findings/03-metrics.md`

> You are a read-only investigator. Read the common boilerplate at `evidence/stabilization-sprint-2026-05-01/finish-line-agent-dispatches.md` Section 7.0.
>
> **Focus:** The 7 dishonest metrics from `evidence/stabilization-sprint-2026-04-30/lane-7-metrics.md`. Per metric: fix calculation OR swap to valid near-equivalent OR suppress/hide.
>
> **Read first:** common boilerplate, Dispatch 1 output if present, `server/routes/insights.ts` (whole), `server/vendorProxy.ts` lines 600–700, `server/services/lib-8.ts` if it exists or grep `lifetimeWinRate`/`winRate`/`lifetime_win_rate`, `client/src/pages/insights.tsx`, `client/src/pages/sales.tsx:686-700`, `client/src/lib/activity-utils.ts:47`.
>
> **Specifically answer (one section per metric):**
> 1. **Conversion rate (I-NEW-2026-05-01-C):** Why 100%? Cite file:line. Does `lib-8` lifetime win rate exist? What's the swap-in surface area?
> 2. **Top Lead Sources A+/A/B/C grades (I-NEW-2026-05-01-E):** Positional or comparative? `server/routes/insights.ts:129`. Recommend (a) honest comparative grading (and required data) OR (b) suppress letter, show counts only.
> 3. **Pipeline forecast (E):** Is the value labeled "forecast" but actually backward soldCount? Producer site + consumer label. Is `warehouse_metrics.month_end_forecast` populated by anyone? Recommend relabel ("30-day sold") OR remove until producer ships.
> 4. **Lead-source trend (E):** `:138` hard-coded `"flat"`. Compute or remove?
> 5. **Sales/service contamination in metrics:** Which metrics include service that should be excluded? Per-metric file:line + read-only SQL.
> 6. **`metricsAllZero` fallback (I-NEW-2026-05-01-L):** How often does each insights endpoint hit it? Are fallbacks honest (return zeroes) or do they synthesize?
> 7. **`leadSummary.source` hard-coded `"warehouse"` (I-NEW-2026-05-01-M):** Producer site + consumer effect. Recommend remove dead branch.
> 8. **Sales activity feed (I-NEW-2026-05-01-D):** Server-side filter `userId IS NULL` system events. Cite producer site.
>
> Per-metric recommendation: **fix / swap / suppress.** This is the per-metric list operator approves before Batch 1 starts.
>
> **Do not:** Modify any file. Run mutating SQL. Propose UI redesign — only data-shape and minimum consumer-side change.

## 7.5 Dispatch 4 — Marketing Insights Agent

**Subagent type:** `general-purpose` (read-only)
**Output:** `evidence/stabilization-sprint-2026-05-01/finish-line-findings/04-marketing-insights.md`

> You are a read-only investigator. Read the common boilerplate at `evidence/stabilization-sprint-2026-05-01/finish-line-agent-dispatches.md` Section 7.0.
>
> **Focus:** Marketing Insights tab renders Sales-pipeline insights instead of marketing-scoped data. Distinguish backend filtering defects (in scope) from UI redesign requests (out of scope).
>
> **Read first:** common boilerplate, `client/src/pages/insights.tsx` (whole; pay attention to `:407`), `client/src/pages/marketing.tsx` lines 1–150, `client/src/lib/marketing-agents.ts`, `server/routes/insights.ts` for the API contract embedded view consumes, `evidence/stabilization-sprint-2026-04-30/lane-3-marketing-inventory.md` if exists else `lane-6-marketing.md`.
>
> **Specifically answer:**
> 1. Where does the role-category filter get constructed (`insights.tsx:407` per current notes)? Trace construction site + every consumer.
> 2. In embedded mode (Marketing Insights tab embedding the Insights view), is the filter passed through? Cite the prop / query-param / context surface that fails to propagate.
> 3. What user-visible mixing actually happens? List specific cards/charts that render service or sales data when they should render marketing-scoped.
> 4. What URL paths exhibit this? (`/marketing?tab=agents`, `/marketing?tab=insights`)
> 5. Is `I-NEW-2026-05-01-F` (`/marketing?tab=agents` redirect) the same root cause as `I-NEW-2026-05-01-A` (now patched via PR #6) or separate? Examine `marketing.tsx:67-79`.
> 6. Recommend the minimal-surface-area fix (likely a single context prop or query-param plumb-through; do NOT redesign).
> 7. **For the marketing-campaign UI gap (overnight Lane 6 finding):** confirm hide-or-disable is the right v2.2 posture (NOT build). Reference D-G1 default. Identify the smallest-surface-area patch to extend the existing v2.3-preview banner consistently.
>
> **Do not:** Modify any file. Propose a Marketing Insights redesign.

## 7.6 Dispatch 5 — Workflow QA Agent

**Subagent type:** `general-purpose` (read-only)
**Output:** `evidence/stabilization-sprint-2026-05-01/finish-line-findings/05-workflow-qa.md`

> You are a read-only investigator. Read the common boilerplate at `evidence/stabilization-sprint-2026-05-01/finish-line-agent-dispatches.md` Section 7.0.
>
> **Focus:** Validate Trigger 1, Trigger 2, service campaigns, TextMagic/VAPI/Tavus inbound, widget actions. Define E2E/Test Lane proof. **No provider sends in this dispatch — that's Batch 2's qa-evaluator's job; this is plan-only.**
>
> **Read first:** common boilerplate, `server/services/triggerService.ts`, `server/services/notificationService.ts`, `server/routes/webhooks/{vapi,textmagic,tavus}.ts`, `server/routes/widget.ts`, `server/services/campaignScheduler.ts`, `harness/bin/test-orgs-allowlist-check.sh`, `harness/bin/test-safety-check.sh`, `harness/bin/test-lane-reset.sh`, existing `tests/e2e/wf-*.spec.ts`, `evidence/stabilization-sprint-2026-04-30/overnight-validation-report.md` §3.
>
> **Specifically answer:**
> 1. **Trigger 1 (immediate VIN-lead follow-up):** What is the happy-path flow? What allowlisted recipient(s) does it target in Test Lane? What is the exact assertion (DB row + provider receipt + audit log)?
> 2. **Trigger 2 (24-hour check-in):** Same questions; how do we accelerate the 24-hour delay for testing without changing prod behavior (env override? `checkInDelayMinutes` runtime tweak?)?
> 3. **Service campaign send→reply (Serra Honda only):** Smallest reproducible E2E. CSV path? Recipient handling? Reply routing into TeamBox? Required fixtures?
> 4. **TextMagic / VAPI / Tavus webhooks:** Re-verification matrix (junk header → 401, real signed → 200). Specific curl commands + expected JSON shapes.
> 5. **Widget actions:** Each of chat, callback, form (and video where enabled) — exact payload, expected DB row, expected notification, expected error case.
> 6. **Resend deliverability:** How do we confirm the weekly-report dry-run actually arrived in the test inbox without sending a real customer email?
> 7. **Test-lane envelope hygiene:** When do we run `test-lane-reset.sh --execute`? What does it clear? What does it preserve?
> 8. **Stop conditions (per workflow):** What signals "any unintended send" or "wrong webhook code" that means STOP immediately?
>
> Output: a Batch-2-ready proof matrix that qa-evaluator can execute mechanically, with no ambiguity about destinations or assertions.
>
> **Do not:** Send any provider request. Modify any file. Run mutating actions.

## 7.7 Dispatch 6 — TeamBox Basic Operability Agent

**Subagent type:** `general-purpose` (read-only)
**Output:** `evidence/stabilization-sprint-2026-05-01/finish-line-findings/06-teambox-operability.md`

> You are a read-only investigator. Read the common boilerplate at `evidence/stabilization-sprint-2026-05-01/finish-line-agent-dispatches.md` Section 7.0.
>
> **Focus:** Existing TeamBox basic render/reply behavior. Identify only launch-blocking basic operability issues. **No TeamBox redesign recommendations except backlog.** Identify dependencies between this and Dispatches 1 + 4 outputs.
>
> **Read first:** common boilerplate, `client/src/pages/teambox.tsx` (whole; pay attention to `:78-85`), `shared/schema.ts` `conversations` table, `server/routes/conversations.ts` if exists, Dispatch 1 + 4 outputs IF available, `evidence/stabilization-sprint-2026-04-30/lane-5-teambox-taxonomy.md`.
>
> **Specifically answer:**
> 1. **Current taxonomy:** What buckets / channels / filters exist? List.
> 2. **Data dependencies:** Which TeamBox bucket reads which `conversations` or `warehouse_leads` column? Cite file:line.
> 3. **Channel-filter gap (I-NEW-2026-05-01-H):** `video` and `form` produced but unfilterable at `:78-85`. One-line fix shape. Per D-H1, this is IN scope for v2.2.
> 4. **Voice de-dup (I-NEW-2026-05-01-I):** VAPI rows in both Conversations + Phone tabs. Producer side or consumer-side fix? Per D-H1, IN scope.
> 5. **AI-role rendering (I-NEW-2026-05-01-J):** `agent` / `assistant` / `bot` / `system` render identically. Per D-H1, **DEFER to v2.3**. Document the deferral decision and the smallest possible v2.3 ticket.
> 6. **Reply round-trip (Batch 2 dependency):** What's the smallest E2E that proves a TeamBox reply actually fires the right provider on each channel? Coordinate with Dispatch 5 — don't duplicate.
> 7. **Push-to-VIN dry-run (Batch 2 dependency):** Same question for the prepare→review→execute→verify flow. What test is safe (`prepare`-only) for the orchestrator to run?
> 8. **Sales-vs-service intersection (Dispatch 1 + 4 dependency):** When P1 separates sales vs service, what TeamBox surfaces will need a corresponding distinction? Identify each (which tab, which filter, which list view). Don't propose a fix; identify the dependency.
>
> **Do not:** Propose TeamBox redesign. Modify any file. Speculate about features that don't exist today.

---

## After all 6 dispatches return

The orchestrator (main session) reads each output file from disk and produces:

1. `evidence/stabilization-sprint-2026-05-01/batch-1-preflight.md` — synthesizing Dispatches 1, 2, 3 (and 4 if it proves backend) into the per-chunk implementation plan
2. `evidence/stabilization-sprint-2026-05-01/batch-2-preflight.md` — Workflow QA proof matrix from Dispatch 5
3. `evidence/stabilization-sprint-2026-05-01/batch-3-preflight.md` — UI smoke matrix from Dispatch 6 + remaining items from Dispatch 4

Operator approves each preflight before its batch starts. No same-context subagents at execution time either; harness-backend, harness-frontend, qa-evaluator, code-reviewer, integration-safety, and nexxus-launch-captain all run as separate fresh sessions per dispatch packet.
