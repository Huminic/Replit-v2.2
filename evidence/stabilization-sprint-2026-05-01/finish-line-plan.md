# Nexxus Finish-Line Plan (active sprint plan)

**Plan-mode authoring artifact:** `~/.claude/plans/moonlit-booping-popcorn.md` (Sections 3–6 + 13, verbatim split)
**Date:** 2026-05-01
**Approval:** operator approved at ExitPlanMode 2026-05-01 with the constraint: "as long as we can test thoroughly before pushing live, you are approved to dive in and continue in auto mode."

**Companion files:**
- `finish-line-preflight.md` (Section 1 of source plan)
- `finish-line-agent-dispatches.md` (Section 7 of source plan)

**Source-of-truth rule:** if any companion file diverges from this plan, this plan wins. Companion files are derivative.

---

## Section 3 — Remaining Work Inventory (groups A–I)

This corresponds to Phase 1 § 1 of the operator's prompt. Source: overnight-validation-report.md (verdict YELLOW), 13 I-NEW issues, plan.md Phases 1–5, plus current code state.

### Group A — Data Truth / Sales-vs-Service Separation

| Item | Status |
|---|---|
| What already works | The `department TEXT` column exists on `campaigns`, `agents`, `hunches`, `appointments`. `weeklyReportService.ts` has an opt-in `salesOnlyLeadIds` filter at `:479`. |
| What is broken | `salesOnlyLeadIds` is never passed by `sendWeeklyReportProduction` or scheduler (`weeklyReportService.ts:469` author's own comment confirms). Lead-volume tiles inflated by service traffic. Conversion rate mixes departments. Several routes (`/marketing?tab=agents` per I-NEW-2026-05-01-F) leak service into sales views. |
| What is unknown | Whether `warehouse_leads` has an enforceable column for sales-vs-service today (`data_source`, `lead_source`, `vin_status`?), or whether `BL-107 lead_type` migration is required. `BL-107` is not yet a real backlog entry per overnight report. |
| Evidence already available | `evidence/stabilization-sprint-2026-04-30/lane-4-sales-reports.md`, `lane-7-metrics.md`, `evidence/stabilization-sprint-2026-05-01/p1-agent-dispatch-packet.md` (Dispatch 4 = Schema/Data Classification) |
| Launch/demo blocking | YES — every weekly report sent to dealers is currently inflated |
| Can wait? | NO |
| Likely files | `server/services/weeklyReportService.ts`, `server/services/dailyRecapService.ts`, `server/routes/insights.ts`, `server/vendorProxy.ts`, `shared/schema.ts`, `server/services/leadClassification.ts` (if exists) |
| Proof required | Schema agent SQL (read-only) showing column coverage; re-run weekly report in test-lane and confirm sales-only filter applies; DB row counts before/after; Playwright walk for a dealer-facing report email |

### Group B — Workflow Correctness + Provider Proof

| Item | Status |
|---|---|
| What already works | Weekly executive report (Monday W18, 5/5 stores, 0 failures). VAPI inbound webhook (200 / 401). Tavus inbound webhook (200 / 401). Service campaigns code-complete (Serra Honda flag-on). Trigger 1 (immediate VIN follow-up, default-OFF, allowlist Test Lane). Trigger 2 (24-hour check-in, `checkInDelayMinutes=1440`). 5 dealer widget URLs return 200 with foreign Origin. |
| What is broken | TextMagic webhook verification posture is "relaxed-verify" pending dashboard signing-secret confirmation (I-NEW-2026-04-30-E). VIN lead-source resolution at 16–31% (I-279) actively degrades every weekly report. |
| What is unknown | Whether trigger flows have ever been end-to-end proven on live with a real-and-visible round trip (allowlisted recipient → reply → conversation row → audit log). Whether widget dispatches an actual conversation when used by a real visitor today. |
| Evidence already available | `evidence/stabilization-sprint-2026-04-30/overnight-validation-report.md` §3, `lane-5-teambox-taxonomy.md`, `lane-6-marketing.md` |
| Launch/demo blocking | PARTIAL — Serra Honda already launched. Other-store enablement gated. |
| Can wait? | NO for trigger sanity + widget proof; YES for full marketing UI buildout |
| Likely files | `server/services/triggerService.ts`, `server/services/notificationService.ts`, `server/routes/webhooks/{vapi,textmagic,tavus}.ts`, `server/routes/widget.ts`, `server/services/campaignScheduler.ts` |
| Proof required | Test-lane round-trip for Trigger 1, Trigger 2, service campaign send→reply, widget chat init, widget callback request — all to allowlisted recipients only |

### Group C — Existing Visible UI Functionality

| Item | Status |
|---|---|
| What already works | Login, AI Chat home (`/`), TeamBox basic Conversations tab, Sales Dashboard, Insights tab, Marketing Dashboard tab, header nav, sidebar nav, role-based section visibility. P0 routing redirect trap is FIXED on live (verified 2026-05-01). |
| What is broken (visible) | (i) Marketing tab routing: `/marketing?tab=agents` redirects out (I-NEW-2026-05-01-F). (ii) Marketing Insights embedded view renders Sales pipeline insights instead of marketing-scoped (I-NEW-2026-05-01-G; `insights.tsx:407` filter not propagated). (iii) Marketing/Sales activity feed dominated by `sync_delta_completed` system events (I-NEW-2026-05-01-D). (iv) `/management` for non-super_admin redirects to `/` (RBAC, expected — NOT broken; documented Step A finding). (v) Page-load console error on every route (route-independent; surfaced Step A; root cause not investigated). |
| What is unknown | Whether other tab-deep links (`/sales?tab=...`, `/insights?tab=...`, etc.) have similar redirect bugs. Whether the console error is a regression or pre-existing. |
| Evidence already available | `evidence/stabilization-sprint-2026-05-01/p0-pr-merge-verification/`, `evidence/stabilization-sprint-2026-04-30/lane-{5,6}-screenshots/` |
| Launch/demo blocking | PARTIAL — Marketing tab redirect is demo-blocking; activity feed cosmetics are not |
| Can wait? | NO for tab routing; CONDITIONAL for activity feed (filter or hide) |
| Likely files | `client/src/pages/marketing.tsx:67-79`, `client/src/pages/insights.tsx:407`, `client/src/lib/activity-utils.ts:47`, `client/src/pages/sales.tsx:686-700` |
| Proof required | Playwright walk of every visible route + every visible tab; confirm Pass/Fail/RBAC-redirect/Hidden for each |

### Group D — Universal Widget / Dealer.com

| Item | Status |
|---|---|
| What already works | All 5 dealer widget URLs return 200 with foreign Origin. CORS posture verified prior. Dealer-handoff bundle exists at `dist/public/dealer-handoff/`. |
| What is broken | Unknown (no overnight regressions reported). |
| What is unknown | Whether real-visitor → widget → conversation creates a TeamBox row with correct attribution. Whether callback/form submissions are stored and notify correctly. |
| Evidence already available | `evidence/stabilization-sprint-2026-04-30/overnight-validation-report.md` §1, `tests/e2e/wf-widget-{chat,callback,form,video}.plan.md` (test-spec plans exist) |
| Launch/demo blocking | YES if any widget action silently fails for real visitors |
| Can wait? | NO |
| Likely files | `server/routes/widget.ts`, `client/widget/*`, `shared/widget-config.ts`, dealer-specific config rows |
| Proof required | E2E test using `tests/e2e/wf-widget-*.plan.md` against `live.huminic.app/widget/{dealer-slug}` — chat init, callback request, form submit; verify TeamBox row + notification email/SMS to allowlisted recipient |

### Group E — Reports / Executive Visibility

| Item | Status |
|---|---|
| What already works | Weekly executive report Monday W18 send (5/5 stores, recipient routing strict per-org with HALT checks defending cross-org bleed). |
| What is broken | (i) Sales-vs-service mixing in lead-volume tiles (Group A). (ii) Some dishonest metrics surfaced in the report body (Group F). |
| What is unknown | Whether daily-recap email behaves correctly when `dailyRecapEnabled=true` (currently null/false everywhere). |
| Evidence already available | `evidence/stabilization-sprint-2026-04-30/lane-4-sales-reports.md` |
| Launch/demo blocking | YES — every Monday a customer-facing email goes out with inflated/dishonest numbers |
| Can wait? | NO |
| Likely files | `server/services/weeklyReportService.ts`, `server/services/dailyRecapService.ts`, `server/services/notificationService.ts` |
| Proof required | Test-lane re-send of weekly report with sales-only filter applied; before/after row counts; visual diff of report email body |

### Group F — Metrics Honesty

| Item | Status |
|---|---|
| What already works | 19 of 42 audited metrics graded REAL; 16 PARTIAL with caveats. |
| What is broken | 7 MOCKED/DISHONEST: (1) Conversion rate prints "100%" (I-NEW-2026-05-01-C); (2) Top Lead Sources A+/A/B/C is positional (I-NEW-2026-05-01-E); (3) Pipeline forecast labeled but is backward-looking soldCount (same E); (4) Lead-source trend hard-coded `"flat"` (same E); (5) `leadSummary.source` hard-coded `"warehouse"` makes "VinSolutions Live" branch dead code (I-NEW-2026-05-01-M); (6) `warehouse_metrics.month_end_forecast` always missing → consumer fallback used (I-NEW-2026-05-01-L); (7) Sales activity feed dominated by sync events (I-NEW-2026-05-01-D — overlaps with Group C). |
| What is unknown | Whether the operator wants each broken metric fixed, swapped to a valid near-equivalent, or suppressed. Lifetime win rate exists at `lib-8` and would honestly replace the 100% conversion rate. |
| Evidence already available | `evidence/stabilization-sprint-2026-04-30/lane-7-metrics.md` |
| Launch/demo blocking | YES — visible to dealers in Insights and Sales pages |
| Can wait? | NO |
| Likely files | `server/routes/insights.ts:113,129,138,238`, `server/vendorProxy.ts:641-642`, `server/services/lib-8.ts`, `client/src/pages/sales.tsx:686-700`, `client/src/lib/activity-utils.ts:47` |
| Proof required | Per-metric: (a) before screenshot, (b) after screenshot, (c) source SQL or computation trace |

### Group G — Marketing / Agents

| Item | Status |
|---|---|
| What already works | `/marketing` page renders Dashboard tab. Agents tab exists. Studio + Insights tabs exist. Backend campaigns API is complete (10 shared `/api/campaigns/*` routes). 5 AI agents defined client-side in `marketing-agents.ts`. |
| What is broken | (i) `/marketing?tab=agents` redirect (Group C). (ii) Marketing Insights tab role-category filter not propagated (Group C). (iii) Marketing-campaign UI does NOT exist on `/marketing` (overnight gap). |
| What is unknown | None — gap is well-documented. |
| Evidence already available | `evidence/stabilization-sprint-2026-04-30/lane-6-marketing.md` |
| Launch/demo blocking | PARTIAL — tab redirect (i) is, (iii) is not (per operator's "no new UI" rule) |
| Can wait? | (i)(ii) NO; (iii) deferred to v2.3 per operator scope |
| Likely files | `client/src/pages/marketing.tsx:67-79`, `client/src/pages/insights.tsx:407` |
| Proof required | Playwright walk of `/marketing` Dashboard, Agents, Studio, Insights tabs; verify tab switch works without redirect; verify Marketing Insights renders marketing-scoped data |
| **Decision required** | For (iii) — confirm hide-or-disable approach (hide tab? disable button? add "coming v2.3" banner?). See Decision Matrix D-G1. |

### Group H — TeamBox Basic Operability

| Item | Status |
|---|---|
| What already works | `/teambox` renders Conversations tab; conversation list populates; thread view renders messages; reply textarea + Push to VIN button visible. |
| What is broken | (i) `channelFilters` missing `video` and `form` (I-NEW-2026-05-01-H, `teambox.tsx:78-85`). (ii) VAPI voice rows duplicated in Conversations + Phone tabs (I-NEW-2026-05-01-I). (iii) `agent` / `assistant` / `bot` / `system` roles render identically (I-NEW-2026-05-01-J). |
| What is unknown | Whether reply send actually stores + threads correctly to a real provider on every channel. Whether Push to VIN actually invokes the prepare→review→execute→verify flow correctly. |
| Evidence already available | `evidence/stabilization-sprint-2026-04-30/lane-5-teambox-taxonomy.md` + 9 screenshots |
| Launch/demo blocking | PARTIAL — channel-filter gap is a usability nuisance; voice de-dup is confusing but not blocking; role rendering is misleading but not blocking |
| Can wait? | YES for the cosmetic items if scope demands; NO for reply round-trip + Push to VIN proof |
| Likely files | `client/src/pages/teambox.tsx:78-85`, `client/src/components/teambox/*`, `server/routes/conversations.ts`, `server/services/vinSafeMcpClient.ts` |
| Proof required | E2E reply round-trip per channel (test-lane recipients); Push-to-VIN dry-run with `prepare` only (no `execute`); evidence captured |

### Group I — Cleanup / Accepted Debt

| Item | Status |
|---|---|
| Carried debt | I-NEW-2026-04-30-A (SMS classifier prompt-injection acceptance), I-NEW-2026-04-30-C (I-254 race fix lacks targeted unit test), I-NEW-2026-04-30-E (TextMagic webhook signing posture relaxed-verify), I-279 (VIN lead-source resolution 16–31%) |
| Resolved this sprint (Step A) | I-NEW-2026-05-01-A (Routing redirect trap) — CLOSED 2026-05-01 |
| Operator decisions queued | Sub-D6 (PNG screenshot tracking), Sub-D7 (local main ff to `becb739`), Sub-D8 (watchdog log tracking), D3 (12 archive-candidate branches), D4 (6 stashes drop), D5 (`replit-agent` 355 commits), chunk-5 governance commits push |
| New debt potentially needed | Console-error-on-every-route finding from Step A (file as I-NEW-2026-05-01-N if confirmed), `BL-107 lead_type` schema migration (file as backlog entry per Group A schema agent finding) |

---

## Section 4 — Decision Matrix

Only items genuinely needing operator/product judgment. Items answerable from code/DB/logs/evidence are NOT here.

| ID | Question | Recommended | Risk if wrong | Blocks? | Inferable? |
|---|---|---|---|---|---|
| **D-A1** | For sales-vs-service separation, do we (a) ship `lead_type` migration on `warehouse_leads` now (BL-107), or (b) use the best-effort `lead_source` heuristic, or (c) both? | **(b) best-effort heuristic now in code, file BL-107 as v2.3 backlog** — fastest path to truthful reports without migration risk. Schema agent (Section 7 Dispatch 1) returns the exact predicate to use. | (a) adds migration risk to v2.2; (c) doubles work | YES — blocks Batch 1 scope | NO — operator product judgment |
| **D-G1** | For the marketing-campaign UI gap, do we (a) hide the Marketing Studio + Insights tabs entirely, (b) keep tabs visible but disable Create/Send buttons with "coming v2.3" banner, or (c) build a thin minimum-viable campaign manager UI? | **(b) keep visible, disable + banner** — most honest to dealers; backend works so visibility is fine; explicit signal that send is not yet enabled. Marketing tab v2.3 banner already exists ("Marketing is in v2.3 preview. Campaign sends are not yet enabled in this release. Browsing is read-only — outbound actions are disabled.") — extending it consistently is minimal work. | (a) silently removes a function dealers may have seen; (c) violates operator's "no new UI" rule | YES — blocks Batch 3 scope | NO — operator product judgment |
| **D-F1** | For each of the 7 dishonest metrics, is the default action (i) fix calculation, (ii) swap to valid near-equivalent, (iii) suppress/hide? | **Default: (ii) swap where a valid near-equivalent exists (e.g., conversion rate → lifetime win rate from `lib-8`); (iii) suppress otherwise (e.g., positional A+/A/B/C grades → show counts only).** Metrics agent (Section 7 Dispatch 3) returns per-metric recommendation; operator approves the list before Batch 1 execution. | Wrong call ships dishonest UI for another sprint | YES — blocks Batch 1 metric subset | PARTIAL — operator confirms agent's per-metric recommendations |
| **D-B1** | For provider proof on Trigger 1 / Trigger 2 / service campaign / widget actions, may a TEST-LANE-marked send go to allowlisted recipients (`+15551234567`, `duane.wells@huminic.ai`, `duanekwells@gmail.com`) without per-action approval, or does each round-trip need explicit chat approval? | **Per CLAUDE.md "Autonomy ALLOWED after preflight" rule: allowlisted destinations may proceed without per-action approval IF preflight + destination-classification table presented and verified.** Confirming this isn't being changed. | If revoked, every round-trip needs an interrupt | YES — blocks Batch 2 cadence | YES per CLAUDE.md but worth re-confirming |
| **D-I1** | Push the 7 governance commits (`0753198`..`ba1878e`) to `origin/chunk-5-textmagic-soften`? | **YES, before Batch 1 starts.** Currently single-point-of-failure (local-only). Push is non-deploying (chunk-5 isn't connected to the main deploy pipeline). | If machine dies, 7 governance commits gone | NO (does not block plan; should happen early) | NO — operator deploy/push call |
| **D-I2** | Fast-forward local `main` to `origin/main` (`fe70823` → `becb739`)? Sub-D7. | **YES, housekeeping.** No risk; only fast-forward; reversible via reflog. | NONE | NO | NO — operator branch-state preference |
| **D-I3** | Console error on every route (Step A side-observation) — file as new issue I-NEW-2026-05-01-N? | **YES, file it now; investigate as part of Batch 3 endpoint validation.** Capturing the error message + source map is cheap; could surface a small fix that ships with v2.2. | If real bug ignored, dealers may hit it | NO | NO — operator triage call |
| **D-H1** | Should TeamBox channel-filter gap (video, form), VAPI voice de-dup, and AI-role rendering be in scope for v2.2 or deferred to v2.3? | **Channel-filter gap: IN scope** (one-line UI fix; existing visible feature is broken). **Voice de-dup: IN scope** (existing visible feature is misleading). **AI-role rendering: DEFER to v2.3** (cosmetic; not visibly broken — just same icon). | Each adds small UI scope to Batch 3 | NO — Batch 3 sub-scoping | NO — operator UX call |

**Decisions NOT in this matrix because they're inferable from existing artifacts (do NOT ask operator):**

- Whether D2 (TextMagic main/live divergence) is resolved → YES, AUTO-RESOLVED via PR #5 + PR #6 (per `phase-D-decisions.md`)
- Whether to use same-context subagents → NO (operator standing rule, restated multiple times)
- Whether to deploy or push without explicit approval → NO (CLAUDE.md + standing rule)
- Whether broad UI redesign is in scope → NO (operator scope statement)
- Whether to mutate DB or send providers → NO (operator scope statement)

---

## Section 5 — Execution Batches

Three substantial batches. Each batch has objective / scope / files / agents / proof / deploy strategy / stop conditions / risk / autonomy.

### Batch 1 — Data Truth + Sales-vs-Service Backend Separation + Metric Honesty

| Field | Value |
|---|---|
| **Objective** | Make every dealer-facing number truthful. Sales reports exclude service. Conversion rate isn't 100%. Forecast isn't backward. Grades aren't positional. Activity feed isn't system events. |
| **In scope** | **Server-side and data-layer changes only.** Sales-vs-service classification predicate (best-effort `lead_source` heuristic per D-A1 default); apply `salesOnlyLeadIds` filter to `weeklyReportService.sendWeeklyReportProduction` + scheduler path; replace conversion rate with `lib-8` lifetime win rate; swap positional A+/A/B/C with counts-only; relabel pipeline forecast to "30-day sold" or remove; remove hard-coded `"flat"` trend or compute; filter `userId IS NULL` system events from sales activity feed (server-side); remove dead VinSolutions Live branch in `vendorProxy.ts:642`. |
| **Out of scope** | All `client/src/` changes (default to Batch 3). UI redesign. New tiles. Schema migration (`BL-107` deferred per D-A1). New metrics not already shown. **Marketing Insights filter propagation defaults to Batch 3** unless Dispatch 4 proves the bug is server-side AND the fix is the minimal required correction to stop a visible falsehood — in which case operator approves a separate per-chunk preflight to bring it into Batch 1. |
| **Files likely touched** | `server/services/weeklyReportService.ts`, `server/services/dailyRecapService.ts`, `server/services/leadClassification.ts` (new file ok), `server/routes/insights.ts` (lines 113, 129, 138, 238), `server/vendorProxy.ts` (lines 641, 642), `server/routes/activity-log.ts` (or wherever feed is computed), possibly `shared/types.ts` |
| **Files NOT touched** | Anything under `client/src/`, `shared/schema.ts` (no schema migration), `server/db/migrations/` |
| **Agent team (each role = a separate real agent session, NOT an inline subagent)** | Schema/Data Classification (Dispatch 1, fresh session) → Reports + Metrics + Marketing Insights (Dispatches 2–4, three fresh sessions in parallel) → orchestrator integrates from disk → `harness-backend` (fresh session) implements per chunk → `qa-evaluator` (fresh session) produces dual-delta proof → `code-reviewer` (fresh session) reviews → `integration-safety` (fresh session, only if any chunk touches external-provider boundaries; Batch 1 default does not, but the test-lane Resend dry-run in Delta 2 IS a provider action and gets its own preflight) |
| **Proof required** | **Delta 1:** TS check passes, focused unit tests for new predicate + report filter + insights route, scope-verification PASS. **Delta 2 (includes a Resend provider action — see Section 11.2 of source plan for preflight requirements):** test-lane weekly-report dry-run with new filter and **destination-classification table presented + `test-orgs-allowlist-check.sh recipient` exit-0 confirmed** before the send; row-count delta vs unfiltered captured pre/post; Playwright walk of `/insights` and `/sales` (read-only) shows new-shape values; SQL row-count proof of activity-feed change. |
| **Deployment strategy** | Build + dev `pm2 reload` first; verify on `dev.huminicdev.com`; THEN operator decides PR-to-main + live deploy. NO live deploy until full Batch 1 evidence pack is reviewed by operator. |
| **Stop conditions** | Schema agent surfaces a column-coverage gap that requires migration → STOP, escalate to D-A1 re-decision. Any test-lane round-trip touches a non-allowlisted recipient → STOP. Any change requires touching `client/src/` more than 1 file → STOP, re-scope. |
| **Estimated risk** | MEDIUM — server-side data-shape changes can have downstream consumer effects. Mitigated by dev-first, allowlist-only test lane, and pre-merge code review. |
| **Autonomy** | Schema agent + 3 consumer agents are read-only — autonomous. Implementation agent (harness-backend) requires per-chunk operator approval after preflight. Deploy/push requires explicit approval. |
| **Approvals needed** | (1) Operator approval to start Batch 1 (this plan ExitPlanMode = approval to RUN dispatches; separate approval needed to start IMPLEMENTATION after dispatches return). (2) Per-chunk implementation approval. (3) Live deploy approval. |

### Batch 2 — Workflow Correctness + Provider Proof

| Field | Value |
|---|---|
| **Objective** | Prove the customer-critical workflows end-to-end with real provider round-trips to allowlisted recipients only. |
| **In scope** | Trigger 1 (immediate VIN-lead follow-up) test-lane round-trip. Trigger 2 (24-hour check-in) test-lane round-trip. Service campaign send→reply on Serra Honda only (per launch rule). TextMagic / VAPI / Tavus inbound webhook re-verification (junk header → 401, real signed → 200). 5 dealer widget URLs functional walk (chat, callback, form). Resend deliverability for weekly report dry-run. |
| **Out of scope** | Provider sends to non-allowlisted recipients. Enabling service campaigns for stores other than Serra Honda. Building marketing-campaign UI. Schema changes. |
| **Files likely touched** | `server/services/triggerService.ts` (only if a bug surfaces — otherwise read-only). Most of this batch is verification, not modification. |
| **Files NOT touched** | Anything in `client/src/`. Production webhook secrets. Live Coolify env. |
| **Agent team (each role = a separate real agent session)** | Workflow QA (Dispatch 5, fresh session) drafts E2E plans → operator approves the plan → `harness-backend` (fresh session, only if a bug surfaces) implements → `qa-evaluator` (fresh session) runs round-trips. **Every round-trip is a provider action** (Resend / TextMagic / VAPI / Tavus / SignalWire), even with allowlisted recipients — each round-trip requires its own preflight + destination-classification table + per-recipient `test-orgs-allowlist-check.sh` exit-0 BEFORE the call → `code-reviewer` (fresh session, only if code changed) → `integration-safety` (fresh session, runs on every Batch 2 chunk because external-provider boundaries are touched). |
| **Proof required** | **Delta 1:** Each workflow has a documented expected vs actual table with provider receipt IDs. Test-lane reset (`harness/bin/test-lane-reset.sh --execute`) before and after to ensure clean envelope. Per-action preflight artifacts captured in `evidence/<sprint>/batch-2/<workflow>/preflight.md` BEFORE the action. **Delta 2:** Provider dashboard screenshot showing the test-lane delivery; conversation row created in DB; audit log entry; allowlist re-verified per `test-orgs-allowlist-check.sh` post-action. |
| **Deployment strategy** | No deploy unless a bug surfaces. If a bug surfaces, treat as a Batch-1-style data-shape change with the same gates. |
| **Stop conditions** | Any unintended send (non-allowlisted recipient) → IMMEDIATE STOP, capture, escalate. Any webhook returns wrong code → STOP, escalate. Any TextMagic relaxed-verify regression → STOP, escalate D2. |
| **Estimated risk** | LOW for the verification work; MEDIUM if a bug surfaces and code change is needed. |
| **Autonomy** | Workflow QA dispatch + qa-evaluator runs are autonomous within the allowlist envelope per CLAUDE.md "Autonomy ALLOWED" rules + D-B1 confirmation. |
| **Approvals needed** | (1) Operator approval to start Batch 2. (2) Operator confirms D-B1 (allowlist autonomy still in force). (3) Per-discovered-bug approval if any code change needed. |

### Batch 3 — Existing Visible UI + Final E2E Validation

| Field | Value |
|---|---|
| **Objective** | Every visible page/endpoint/setting on the post-login surface is either working, intentionally disabled, or hidden. No fake buttons. No misleading metrics. No silent route redirects. Console clean enough to ship. |
| **In scope** | Per-route smoke (15+ routes per Section 10 matrix in source plan). Marketing tab routing fix (I-NEW-2026-05-01-F). Marketing Insights filter propagation (I-NEW-2026-05-01-G — UI consumer side after Batch 1 backend ships). Marketing campaign UI hide-or-disable per D-G1 default. TeamBox channel filter add (I-NEW-2026-05-01-H per D-H1). VAPI voice de-dup (I-NEW-2026-05-01-I per D-H1). Console-error investigation (per D-I3). Dealer widget E2E. Settings smoke. Final regression Playwright pass per `tests/e2e/wf-*.spec.ts`. Accepted-debt list write-up. Go/no-go report. |
| **Out of scope** | TeamBox redesign. New TeamBox sublanes. Marketing Studio expansion. Dashboard Builder v2.3. Visual polish. AI-role rendering distinction (deferred per D-H1). |
| **Files likely touched** | `client/src/pages/marketing.tsx:67-79`, `client/src/pages/insights.tsx:407` (consumer side), `client/src/pages/teambox.tsx:78-85`, possibly small TeamBox component for voice de-dup. Each `client/src/pages/*.tsx` file edited needs a per-file `.claude/state/scope/<basename>.ok` marker. |
| **Files NOT touched** | Anything `server/` other than minor patches surfaced. No schema. No migrations. |
| **Agent team (each role = a separate real agent session)** | TeamBox Basic Operability (Dispatch 6, fresh session) drafts the per-route smoke matrix → operator approves the matrix → `harness-frontend` (fresh session) implements per-file with explicit per-file scope markers (one operator approval per file) → `qa-evaluator` (fresh session) → `code-reviewer` (fresh session) → `integration-safety` not run unless a chunk unexpectedly touches an external boundary → `nexxus-launch-captain` (fresh session) gives final go/no-go recommendation; operator makes the deploy call. |
| **Proof required** | **Delta 1:** TS check passes, scope verification PASS, code-review PASS for each per-file UI change. **Delta 2:** Playwright matrix per Section 10 (source plan) — every route returns the expected page; every "Hidden" surface is verifiably hidden; every "Disabled" surface shows the correct disabled state; full regression `npm run test:e2e` passes. |
| **Deployment strategy** | Build + dev verification → operator approves PR-to-main → operator approves live deploy → `gh run watch` → live verification per Section 10 (source plan) → cleanup. Same gate as PR #6. |
| **Stop conditions** | Any new redirect trap regression → STOP. Any console blocker on a critical path → STOP. Any RBAC mis-redirect → STOP. Any UI scope marker bypass without explicit operator approval → STOP. |
| **Estimated risk** | MEDIUM — UI changes are protected by `edit-scope-guard.sh` + per-file scope markers; operator must approve each file's marker. |
| **Autonomy** | Smoke walks autonomous within Serra Honda + super_admin reads; mutating actions per CLAUDE.md per-action rules. |
| **Approvals needed** | (1) Operator approval to start Batch 3. (2) Per-UI-file scope marker approval. (3) PR-to-main approval. (4) Live deploy approval. (5) Final go/no-go from operator + nexxus-launch-captain. |

---

## Section 6 — Definition of Done (4 levels)

### A. Code Done

- [ ] Focused patch only — no unrelated files
- [ ] No hidden config drift (`.env.example` updated if env added; no secrets in git)
- [ ] Tests added or updated where risk warrants (TDD bias for new server logic; for UI fixes, Playwright spec)
- [ ] TS check passes (`npm run check` or `tsc --noEmit`)
- [ ] Code-reviewer agent (in a separate session) returns APPROVE or DEFICIENCY-FIXED
- [ ] No new accepted debt without an `issues.md` row

### B. Workflow Done

- [ ] Happy path proven end-to-end with evidence
- [ ] Failure / guard / RBAC path proven where relevant
- [ ] Provider/webhook behavior verified (junk header → 401, real signed → 200; if applicable)
- [ ] No real customer contacted (allowlist verified for every send)
- [ ] Audit log + DB row + provider receipt all captured
- [ ] CommGate flags respected
- [ ] Test-lane envelope rinsed (`test-lane-reset.sh --execute` if needed)

### C. UI / Visible Feature Done

- [ ] Visible function works, OR is clearly disabled with a state, OR is hidden/removed
- [ ] No fake/nonfunctional buttons
- [ ] No misleading metric
- [ ] No silent route redirect (RBAC redirects are documented + expected)
- [ ] No console error blocker on the critical path (route-independent console errors triaged separately)
- [ ] Per-file `.claude/state/scope/<basename>.ok` marker existed before edit and is now consumed
- [ ] Playwright walk evidence captured in `evidence/<sprint>/<batch>/`

### D. Release Done

- [ ] Harness markers honest (every marker reflects an actual subagent verdict in the current session-id; no recycled `*.no-session.ok` reused)
- [ ] Dual-delta proof complete (one runnable test result + one independent observation)
- [ ] Playwright/MCP validation complete per Section 10 matrix (source plan)
- [ ] Live deploy checklist (Section 11 of source plan) passed
- [ ] Rollback notes written in evidence pack
- [ ] Accepted debt documented in `issues.md` with NEW IDs (`I-NEW-2026-05-01-*`)
- [ ] `.claude/session.md` and `memory/session-output.md` updated via `/handoff`
- [ ] Operator explicitly approves "release done"

---

## Section 13 — Operational Risk Gate

Four buckets. Each item: **risk/finding · trigger · mitigation · proof / stop-go rule.** No invented thresholds. No likelihood × impact matrix. No top-N watchlist. Known findings are kept separate from speculative execution risks.

### 13.1 Known Defects (documented; evidence-backed)

These are observed defects — what's actually wrong today. Each is being addressed somewhere in Batches 1–3 (or carried as Accepted Debt).

| ID | Finding | Trigger (when it bites) | Mitigation (in this plan) | Proof / stop-go rule |
|---|---|---|---|---|
| KD-1 | **Sales-vs-service mixing in user-facing surfaces.** `weeklyReportService.ts:469-479` — author comment confirms `salesOnlyLeadIds` filter is never applied; lead-volume tiles inflated by service traffic. | Every Monday weekly-report send shows inflated numbers. | Batch 1: apply filter via best-effort heuristic from Dispatch 1. | Stop-go: post-Batch-1 test-lane weekly-report dry-run shows row-count delta vs unfiltered, AND operator visually inspects the email body and confirms it reads as sales-only. |
| KD-2 | **Seven dishonest metrics.** Conversion rate = 100% (`vendorProxy.ts:641`, `insights.ts:113,238`); Top Lead Sources A+/A/B/C is positional (`insights.ts:129`); Pipeline forecast labeled but is backward soldCount; Lead-source trend hard-coded "flat" (`insights.ts:138`); `leadSummary.source` hard-coded "warehouse" (`vendorProxy.ts:642`); `warehouse_metrics` writer missing → fallback always used; Sales activity feed dominated by sync events (`activity-utils.ts:47`). | Every dealer view of `/insights` and `/sales` shows misleading numbers. | Batch 1: Dispatch 3 returns per-metric fix/swap/suppress recommendation; operator approves the list (D-F1); implemented in Batch 1. | Stop-go: per-metric before/after evidence captured in Delta 2; operator approves the per-metric list before any chunk merges. |
| KD-3 | **Marketing tab routing.** `/marketing?tab=agents` redirects out (I-NEW-2026-05-01-F). Suspect `client/src/pages/marketing.tsx:67-79`. | Marketing-role users (and demos) cannot reach Agents tab. | Batch 3: client-side fix (Dispatch 4 confirms scope is consumer-side, not redesign). | Stop-go: post-fix Playwright walk lands on `/marketing?tab=agents` with no redirect, AND no other tab-deep links regress. |
| KD-4 | **Marketing Insights tab renders Sales-pipeline insights.** Filter at `client/src/pages/insights.tsx:407` not propagated in embedded mode (I-NEW-2026-05-01-G). | Marketing-role users see sales data instead of marketing-scoped data. | Default Batch 3 (client-side prop plumb-through). Promoted to Batch 1 ONLY if Dispatch 4 proves the bug is server-side AND fix is the minimal correction to stop a visible falsehood. | Stop-go: Dispatch 4 finding determines batch placement; operator approves the choice in batch-N-preflight. |
| KD-5 | **TextMagic relaxed-verify accepted debt** (I-NEW-2026-04-30-E). Live currently accepts unsigned TextMagic webhooks because dashboard signing posture isn't confirmed. | Spoofable inbound webhook traffic until upstream signing is verified. | Batch 2 verifies inbound webhook posture matches `aa989fc` baseline. Reconciliation deferred until operator confirms TextMagic dashboard signing-secret status. Carried as AD-3. | Stop-go: post-Batch-2 webhook probes return junk header → 401, no header → 200; matches baseline. If `/api/webhooks/textmagic` returns 401 with no header, IMMEDIATE rollback (TextMagic flow regressed). |
| KD-6 | **Route-independent console error observation.** Step A's Playwright walk recorded `Console: 1 errors, 0 warnings` from the very first `/login` load and through every protected route. Source not investigated. | Console noise hides real errors when new code ships. | File as `I-NEW-2026-05-01-N` per D-I3 (operator approves the row text first). Investigate during Batch 3 endpoint validation. Fix may or may not be in v2.2 scope. | Stop-go: error message + source location captured before Batch 3 closes; operator decides fix-now vs accept. |
| KD-7 | **TeamBox `channelFilters` missing `video` and `form`** (I-NEW-2026-05-01-H, `client/src/pages/teambox.tsx:78-85`). Channels are produced; user can't filter on them. | Staff cannot scope TeamBox view to video/form channels. | Batch 3 per D-H1 (IN scope). | Stop-go: post-fix walk shows both filter chips render; clicking them filters the list. |
| KD-8 | **VAPI voice rows duplicated** (I-NEW-2026-05-01-I) — appear in both Conversations and Phone tabs. | Duplicates confuse staff; same row replied to twice. | Batch 3 per D-H1 (IN scope). Dispatch 6 returns producer- vs consumer-side fix. | Stop-go: post-fix walk shows VAPI voice rows in exactly one tab. |
| KD-9 | **Sales activity feed dominated by `sync_delta_completed`** (I-NEW-2026-05-01-D, `client/src/lib/activity-utils.ts:47` + producer). Looks like dealer activity; it's the system polling itself. | Dealer-facing surface looks busy with no real signal. | Batch 1: server-side filter `userId IS NULL` system events. | Stop-go: post-fix activity feed for serra_honda contains only user-attributable rows; SQL row-count proof captured. |
| KD-10 | **VIN lead-source resolution at 16–31%** (I-279, carried debt). ~68% of Serra Honda lead-source IDs render as `Source #<id>`. Closing the gap requires central-mcp-side change. | Every weekly report and Insights view shows generic "Source #N" for the majority of leads. | Carried as AD-4. Cap is documented; relay items to central-mcp owner already on record (`decisions.md` 2026-04-26). | Stop-go: Batch 1 does NOT regress current resolution rate; Reports agent confirms current behavior in Dispatch 2. |
| KD-11 | **`warehouse_metrics` writer missing or disabled** (I-NEW-2026-05-01-L). Both insights endpoints fall back to `metricsAllZero` defaults. | Forecast tile + several insights endpoints serve fallback values silently. | Batch 1: Dispatch 3 quantifies fallback-hit frequency; operator decides remove consumer fallback OR stand up producer (the latter is likely OUT of v2.2 scope). | Stop-go: per-endpoint fallback-hit rate captured in Dispatch 3; operator approves remove-vs-defer decision. |
| KD-12 | **Org context silent switch** (I-NEW-2026-05-01-K). Lane 5 saw context switch from Serra Honda to Huminic mid-walk with no UI confirmation. | Multi-tenant safety: staff acting on what they think is one org's data, actually another's. | Carried as AD-6. Every Batch 3 Playwright walk asserts `currentOrganization` matches expected via `browser_evaluate` after every navigation. | Stop-go: Batch 3 walks NEVER show unexpected org change; if one occurs, STOP, capture, escalate. |

### 13.2 Execution Risks (speculative — what could go wrong during work)

These are not bugs we have evidence for; they are things that *could* happen and would matter if they did. Listed because the mitigation belongs in the plan, not because the risk is observed.

| ID | Risk | Trigger | Mitigation | Proof / stop-go rule |
|---|---|---|---|---|
| ER-1 | **Sales-vs-service heuristic ships an incorrect predicate.** The best-effort `lead_source` rule (per D-A1) classifies wrong on a meaningful slice of rows. | Dispatch 1 SQL coverage shows materially ambiguous or incomplete classification. | Dispatch 1 returns: (a) the predicate, (b) row counts of classified vs unclassified rows in last 90 days, (c) sample classified and unclassified rows. Operator inspects the SQL output and the samples; decides predicate-acceptable vs escalate-to-BL-107. Reports agent (Dispatch 2) confirms the predicate covers the rows seen in real recent reports. | Stop-go: if the operator finds the classification materially ambiguous or incomplete on inspection, STOP Batch 1; escalate D-A1; consider migration. The plan does NOT define a coverage percentage threshold. |
| ER-2 | **Provider regression on redeploy** — rebuilding live without the chunk-5 reconciliation flips TextMagic webhooks back to 401. | Pre-deploy SHA check shows `origin/main` HEAD does not include `f305f12` (which entered main via PR #5 → `aa989fc` → `becb739`). | Pre-deploy: confirm `git log --oneline becb739 \| grep f305f12` returns the commit. Post-deploy: webhook probe per Section 10.2 (junk header → 401, no header → 200). | Stop-go: pre-deploy SHA check fails OR post-deploy webhook probe returns wrong code → IMMEDIATE rollback (operator-approved). |
| ER-3 | **Test-lane envelope breach** — a real-customer phone or email is included in a test send. | Allowlist file (`test-recipients.txt` / `test-orgs.txt`) drifted, or a recipient was hand-typed instead of looked up. | Per Section 11.2 of source plan: every provider action requires destination-classification table + per-recipient `test-orgs-allowlist-check.sh` exit-0 BEFORE the action. Pre-Batch-2: `git diff` of allowlist files vs last-known-good. Allowlist is treated as code (any change requires operator approval). | Stop-go: ANY non-zero exit from `test-orgs-allowlist-check.sh recipient` OR ANY allowlist file change without operator-authored commit → STOP, escalate. |
| ER-4 | **Stale marker reuse appeases Stop hook.** `*.no-session.ok` markers from prior sessions get treated as if they verified current-session work. | Session ends with edits to product files but no fresh marker work. | Per CLAUDE.md "Markers must reflect actual subagent verdicts for THIS session." Marker creation only via `mark-complete.sh` AFTER a real verdict in the current session-id. NEVER `touch` a marker file directly. Each marker has a corresponding fresh-session evidence file. | Stop-go: any completion marker without a corresponding fresh-session evidence file in the same batch's directory → STOP, escalate, do not commit. |
| ER-5 | **Scope creep** — diff balloons because of "while we're at it" cleanup, scope expansion to a related file, or unauthorized UI work. | Diff in any chunk includes files not on the chunk's stated file list, or any `client/src/` file edited without a per-file scope marker. | Per CLAUDE.md "Don't add features, refactor, or introduce abstractions beyond what the task requires." Code-reviewer (fresh session) explicitly checks diff against the chunk's stated file list AND counts UI files vs UI markers approved. Operator must approve each per-file UI marker individually (not as a batch). | Stop-go: code-reviewer flags any out-of-scope file or marker imbalance → STOP merge; reduce diff to declared scope; re-review. |
| ER-6 | **Same-context subagent slip** — orchestrator habit triggers an inline `Agent` tool call, polluting context (the failure mode that triggered the 2026-05-01 reset). | Orchestrator considers `Agent` tool use mid-session for verification or implementation work. | Standing rule (Section 14 of source plan). Plan format trains the dispatch-packet pattern. If the orchestrator catches itself drafting an `Agent` call, STOP and write a dispatch block instead. | Stop-go: any `Agent` tool use by orchestrator → SELF-REVERT, escalate the slip in session.md, switch to dispatch packet. |

### 13.3 Accepted Debt (operator has chosen to carry into v2.2 release)

These are known issues the operator has explicitly chosen NOT to fix in v2.2. Each is documented in `issues.md` with rationale.

| ID | Item | Why accepted | When revisited |
|---|---|---|---|
| AD-1 | I-NEW-2026-04-30-A — SMS classifier prompt-injection acceptance | Bounded blast radius; mitigation costs more than the risk for v2.2. | v2.3 |
| AD-2 | I-NEW-2026-04-30-C — I-254 race-fix lacks targeted unit test | Fix is correct and proven by integration test; targeted unit test is hygiene. | v2.3 backlog |
| AD-3 | I-NEW-2026-04-30-E — TextMagic webhook relaxed-verify | Pending TextMagic dashboard signing-posture verification with vendor. Current posture is intentional and matches live. | After operator confirms dashboard signing secret (decision queued) |
| AD-4 | I-279 — VIN lead-source resolution 16–31% | Closing the gap requires central-mcp-side change (relay items already documented in `decisions.md`). | After central-mcp owner ships any of the three relay items |
| AD-5 | I-NEW-2026-05-01-J — `agent` / `assistant` / `bot` / `system` roles render identically in TeamBox | Cosmetic; not visibly broken — same icon. Per D-H1 default. | v2.3 (TeamBox visual distinction sprint) |
| AD-6 | I-NEW-2026-05-01-K — Org context silent switch | Reproducer needed; investigation deferred. Mitigation = Batch 3 walks assert org pinning per ER-related guardrail. | After reproducer captured |

### 13.4 Governance Guardrails (process rules that prevent self-inflicted harm)

These are not risks; they are rules the orchestrator and team must follow. Listed for explicit reference; restated from CLAUDE.md and operator standing orders.

| ID | Rule | Scope | Enforcement | Stop-go |
|---|---|---|---|---|
| GG-1 | **No same-context subagent dispatch.** Orchestrator never calls `Agent`. Every named role (Schema/Data, Reports, Metrics, Marketing Insights, Workflow QA, TeamBox Operability, harness-backend, harness-frontend, qa-evaluator, code-reviewer, integration-safety, scope-guardian, nexxus-launch-captain) runs as a separate fresh top-level Claude session reading dispatch + prior findings from disk. | Every batch. | Self-discipline + plan format trains it. | Slip = STOP, escalate in session.md, re-route to dispatch packet. |
| GG-2 | **No fake or recycled marker creation.** `mark-complete.sh` only writes a marker AFTER a real verdict in the current session-id. Never `touch` markers. Stale `*.no-session.ok` from prior sessions are inert and must not be relied on. | Every chunk. | CLAUDE.md doctrine + Stop hook + code-reviewer audit. | Marker without corresponding fresh-session evidence = STOP, do not commit, regenerate properly. |
| GG-3 | **No `git push` is autonomous.** Every push (even of governance-only commits, even to non-main branches) is presented with the exact `git push origin <ref>` command and the exact set of commits BEFORE execution. Operator approves the exact command. D-I1 may *recommend* a push; the recommendation is not the approval. | Every push. | Operator approval per push. | Push attempted without explicit per-push approval = SELF-REVERT, escalate. |
| GG-4 | **No live deploy is autonomous.** `npm run build && pm2 restart` (and any equivalent live-affecting command) requires explicit operator approval. CI completion alone is not approval. | Every deploy. | Operator approval per deploy. | Deploy attempted without explicit per-deploy approval = SELF-REVERT, escalate. |
| GG-5 | **No DB write outside an operator-approved migration.** Includes `INSERT` on test fixtures, `UPDATE` on flag tables, `DELETE` on stale rows. Read-only `SELECT` is fine. | Every chunk. | Code-reviewer + integration-safety check on every diff. | Any DDL/DML outside approved migration = STOP. |
| GG-6 | **No provider action without preflight.** Any Resend / TextMagic / VAPI / Tavus / SignalWire / Lago / FAL / Coolify call — even allowlisted, even "just a test" — is a provider action and requires Section 11.2 (source plan) preflight. | Every provider call. | Per Section 11.2 of source plan. | Skip preflight = STOP before the call, capture intended action, escalate. |
| GG-7 | **UI files require per-file scope marker.** Each `client/src/pages/`, `client/src/components/`, `client/src/styles/`, `client/src/layouts/` file edited needs `.claude/state/scope/<basename>.ok` set BEFORE the edit. Operator approves each marker individually. | Every UI chunk. | `edit-scope-guard.sh` hook. | Hook block = ask operator for the specific file marker (not a wildcard approval). |
| GG-8 | **No CommGate or per-org outbound flag changes without explicit approval.** Includes service-campaign enablement for stores other than Serra Honda. | Every chunk that touches CommGate or outbound flag tables. | Code-reviewer + integration-safety. | Diff includes flag table change = STOP, route through operator. |
| GG-9 | **Plan source-of-truth = the active sprint plan file.** During Plan Mode = the plan-mode authoring artifact. After ExitPlanMode = THIS file (`evidence/stabilization-sprint-2026-05-01/finish-line-plan.md`). Evidence files (preflight, dispatches) are derivatives and never edited in isolation; if revision is needed, edit the sprint plan and re-derive. | Every plan-revision touch. | Self-discipline. | Evidence file mtime newer than sprint plan mtime = re-derive from sprint plan. |
| GG-10 | **VIN writes go through `vin-safe-mcp` (port 4003) prepare → review → execute → verify ONLY.** Never through `central-mcp`. Never bypassing the four-step flow. | Every VIN-touching chunk. | CLAUDE.md doctrine + integration-safety on every diff that touches VIN. | Any `central-mcp` write reference in diff = STOP. |

---

## Cross-references to source plan

For details NOT split into this file, see `~/.claude/plans/moonlit-booping-popcorn.md`:
- Section 1 — Phase 0 Preflight → split to `finish-line-preflight.md`
- Section 2 — Plan file inventory and classification (in source plan only)
- Section 7 — Real Agent Team Dispatch Packet → split to `finish-line-agent-dispatches.md`
- Section 8 — Batch 1 Preflight Skeleton (in source plan only)
- Section 9 — Execution Rules (dual-delta proof) (in source plan only)
- Section 10 — Endpoint / Page / Setting Validation Matrix (in source plan only)
- Section 11 — Push / Live-Deploy Criteria, including Section 11.2 Provider-action preflight (in source plan only)
- Section 12 — Phase 7 Final Output, including Section 12.1 Final approval checklist + 12.2 Exact first action (in source plan only)
- Section 14 — Standing Constraints (in source plan only)
