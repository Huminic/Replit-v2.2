# Overnight Validation Report — 2026-04-30 → 2026-05-01

## Executive verdict

**YELLOW.** Live posture is stable post-chunk-5. No production outage detected. The send-pipelines (weekly report, webhook handlers, scheduler) are healthy. However, four cross-cutting issues surfaced across Lanes 4–7 that should be addressed before the next round of customer-facing work:

1. **Sales-vs-service data is mixed in user-facing surfaces** (weekly report, conversion-rate metric, marketing/sales/service routing).
2. **Route-redirect trap** — `/teambox`, `/sales`, `/insights`, `/marketing`, `/management` silently redirect to other pages without an operator click. Reproducible across three independent Playwright walks. Affects demo + real users.
3. **Several visible metrics are dishonest** — formulae produce "100%" or hard-coded literals while looking real.
4. **Marketing surface is mostly client-side scaffolding** with no campaign-management UI, even though the campaign backend is fully built.

No code edits, no deploys, no pushes were executed overnight. Standing order honored.

## Methodology

Four read-only subagents ran in parallel with hard guardrails (no edits, no DB writes, no sends, no deploys). Each produced one evidence file plus screenshots where applicable. Lane 8 (this report) synthesizes.

| Lane | Subagent | Evidence file |
|---|---|---|
| 4 | Sales Reports verification | `evidence/stabilization-sprint-2026-04-30/lane-4-sales-reports.md` |
| 5 | TeamBox Conversation Taxonomy | `evidence/stabilization-sprint-2026-04-30/lane-5-teambox-taxonomy.md` (+ 9 screenshots) |
| 6 | Marketing Functions + Agents | `evidence/stabilization-sprint-2026-04-30/lane-6-marketing.md` (+ 5 screenshots) |
| 7 | Metrics / Dashboard Honesty | `evidence/stabilization-sprint-2026-04-30/lane-7-metrics.md` (+ 12 screenshots, 4 JSON) |

## 1. Live status

Verified via prior chunk-5 probes (no new probes overnight per standing order):

- `live.huminic.app/api/health` → 200, `version: 2.2.0`, environment: production, fresh container after chunk-5.
- `/api/webhooks/vapi` (junk header) → 401; real signed VAPI → 200.
- `/api/webhooks/tavus` (junk header) → 401; real signed Tavus → 200.
- `/api/webhooks/textmagic` (junk header) → 401; (no header — real TextMagic) → 200 (relaxed-verify, I-NEW-2026-04-30-E).
- All 5 dealer widget URLs → 200 with foreign Origin (verified prior session).

## 2. Dev status

Not re-probed overnight. Last verified post-chunk-5: PM2 `nexxus-app` healthy on port 5000.

## 3. Workflows

| Workflow | Status | Notes |
|---|---|---|
| Weekly executive report (Monday) | GREEN | All 5 stores received it 2026-04-27 W18; HALT checks held; no double-fires. |
| Daily recap email (operator opt-in) | GREEN-untriggered | Wired correctly into 5-min scheduler tick; `dailyRecapEnabled` is null/false for all 5 orgs (expected). |
| SMS appt-intent email | GREEN | Verified in chunk 1A; no overnight regressions. |
| VAPI inbound webhook | GREEN | Real signed → 200; junk header → 401. |
| Tavus inbound webhook | GREEN | Same posture. |
| TextMagic inbound webhook | YELLOW | Relaxed-verify in place pending dashboard-signing-posture verification (I-NEW-2026-04-30-E). |
| Service campaigns (Serra Honda only at launch) | GREEN | Code complete; flags off for other stores per launch rule. |
| Trigger 1 (immediate VIN-lead follow-up) | GREEN | Default-OFF; allowlist-only Test Lane. |
| Trigger 2 (24-hour check-in) | GREEN | `checkInDelayMinutes=1440` posture confirmed in prior session. |

## 4. Sales reports (Lane 4)

**Verdict: GREEN with YELLOW** — send-pipeline GREEN, sales-vs-service segregation YELLOW.

- Monday 2026-04-27 W18 weekly executive report: 5 firings, 5 SENT, no failures, 5 `weekly_report_*_2026-W18` rows in `scheduler_locks` at matching timestamps.
- Recipient routing strict per-org: org_admin To, partner_admin Cc, safety Bcc to `duane.wells@huminic.ai`. Six HALT checks defend cross-org bleed.
- Recipient counts (To/Cc/Bcc): Ford-Columbia 1/1/1, Hyundai-Columbia 1/1/1, Serra Honda 4/1/1, Serra Nissan 2/1/1, Tony Serra Ford 2/1/1.
- **Issue:** the opt-in `salesOnlyLeadIds` filter at `weeklyReportService.ts:479` is never passed by `sendWeeklyReportProduction` or scheduler. By author's own comment at `:469`, default behavior includes service + parts leads. The promised follow-up "BL-107" backlog item to add `lead_type` to `warehouse_leads` is NOT registered in `issues.md`. Lead-volume tiles in the weekly report are inflated by service traffic.
- VIN lead-source resolution is 16–31% across stores (logged 2026-04-27 build warnings) — tracked as I-279 but actively degrading every weekly report.

## 5. TeamBox (Lane 5)

**Distinct conversation channels: 8** (`sms`, `chat`, `email`, `whatsapp`, `voice`, `video`, `form`, `ai-chat`) emitted by 6 distinct creation paths into a single `/teambox` surface. Schema (`shared/schema.ts:86-109`) carries no `source` / `type` / `department` / `direction` field — `channel` and `messages.role` are the only categorization signals.

**Must-fix-before-customer-demo:**
1. Add `video` and `form` to `channelFilters` in `client/src/pages/teambox.tsx:78-85` (currently produced but unfilterable).
2. De-duplicate VAPI voice rows that appear in both Conversations and Phone tabs.
3. Render `agent` / `assistant` / `bot` / `system` distinctly so AI replies are visually distinguishable from human staff replies.

**Can-fix-after-launch:** propagate `department` / `source` columns; add full sublanes; add per-channel deep-link.

## 6. Marketing (Lane 6)

**Inventory:**
- Backend: 0 marketing-only routes; 10 shared `/api/campaigns/*` routes; 5 proxy routes; 0 marketing-specific schedulers (campaigns share `checkScheduledCampaigns` at 60s tick).
- Frontend: 1 page (`/marketing`) with 4 tabs (Dashboard, Agents, Studio, Insights); 3 components; 5 AI agents (Photo Studio, Video Producer, Copywriter, Creative Director, Market Intel) with 7 tools — ALL prompt definitions and tool execution live client-side in `client/src/lib/marketing-agents.ts` + `tool-executor.ts`.
- DB: 0 marketing-only tables. Differentiation via `department TEXT` column on `campaigns`, `agents`, `hunches`, `appointments`. Marketing artifacts/sessions stored in browser localStorage only (capped at 50).

**Top gap:** No marketing-campaign UI on `/marketing`. The backend (CSV upload, scheduling, execution, status, kill-switch) is fully built and live, but `/marketing` does not list, create, schedule, or monitor campaigns. Marketing-role users in particular (whose RBAC excludes Sales/Service/Management) have no UI path to manage campaigns.

**Differentiation marketing vs service vs trigger:** all three share the `campaigns` table and `checkScheduledCampaigns` scheduler. Distinguished only by `department` column value. There is no distinct marketing flow; it's a flag.

## 7. Metrics dashboard honesty (Lane 7)

**42 metrics audited** across AI Chat home, Sales, Service Insights, Marketing, Insights pages, plus header badges:

| Grade | Count |
|---|---|
| REAL | 19 |
| PARTIAL (live but caveats) | 16 |
| MOCKED / DISHONEST | 7 |
| STALE | 0 |
| UNKNOWN | 0 |

**Top 5 dishonest metrics (must-address before more customer demos):**

1. **Sales / Insights "Conversion Rate" = 100%** — formula `sold / (sold + lost)` over 30d, but lost-status updates lag, denominator collapses to 0, prints "100%". Lifetime win rate at `lib-8` shows the honest 18.3% for serra_honda. Source: `server/vendorProxy.ts:641`, `server/routes/insights.ts:113,238`.
2. **Sales "Recent Activity" feed** — every row on serra_honda is `sync_delta_completed` from the warehouse poller, rendered as "Sync Delta Completed · 11 minutes ago" 10 times. Looks like dealer activity; it's the system polling itself. `client/src/pages/sales.tsx:686-700`, `client/src/lib/activity-utils.ts:47`.
3. **Insights "Pipeline Health · Forecast"** — when `warehouse_metrics.month_end_forecast` is missing (always, on observed orgs), falls back to last-30-day soldCount. Labelled "forecast", actually backward-looking.
4. **Top Lead Sources grade A+/A/B/C** — purely positional (`grade = i===0 ? "A+" : ...`) at `server/routes/insights.ts:129`.
5. **Lead-source trend** — hard-coded literal `"flat"` at `server/routes/insights.ts:138`.

**Bonus side-finding:** `leadSummary.source` is hard-coded `"warehouse"` in `server/vendorProxy.ts:642`, making the "VinSolutions Live" branch in Sales UI effectively dead code.

## 8. Cross-cutting findings (the side notes)

These appeared in 2+ lanes and warrant operator attention:

**A. Routing redirect trap (Lanes 5, 6, 7).** `/teambox`, `/sales`, `/insights`, `/marketing`, `/management` silently redirect to other pages within 2–5s of arrival without an operator click. Reproducible across three independent Playwright walks. Suspected interaction between `SubMenuManager.tsx` hover handlers and a URL→tab effect. Reproducer: load `/marketing?tab=agents`; observe redirect to `/teambox` or `/sales?tab=dashboard` within seconds. **Severity: HIGH** — affects demo and real users.

**B. Sales-vs-service mixing recurs system-wide.** Lane 4 (weekly report doesn't filter sales-only). Lane 6 (`department` column is the only sales/service/marketing differentiator and isn't enforced consistently). Lane 7 (conversion rate combines all departments). Likely a single design-level fix (filter at query layer + propagate `department` consistently).

**C. `activity_log` is dominated by background sync events.** Both the Sales activity feed and the notification badge inflate. Recommendation: filter `userId IS NULL` system events server-side. (Lane 7.)

**D. Org context silently switches mid-session.** Lane 5 saw context switch from Serra Honda to Huminic across screenshots 02–09 with no UI confirmation. Multi-tenant safety concern.

**E. `warehouse_metrics` table appears unused.** Both insights endpoints fall back to `metricsAllZero` defaults, suggesting the writer is missing/disabled. Either remove the consumer fallbacks or stand up the producer. (Lane 7.)

**F. Stale test-row id in plan.** The synthetic conversation id `5ecf6c84-…-555d08537c5b` named in the lane brief does not exist in either Serra Honda or Huminic conversation lists. Phone `+15551234567` does exist with a different id. Optional cleanup, not blocking. (Lane 5.)

## 9. Launch blockers

None new. Launch already shipped 2026-04-27. Post-launch concerns are non-outage but customer-visible.

## 10. Non-blocking debt (carried + new)

**Carried from prior session:**
- I-NEW-2026-04-30-A — SMS classifier prompt-injection acceptance (bounded blast radius).
- I-NEW-2026-04-30-C — I-254 race-fix lacks targeted unit test.
- I-NEW-2026-04-30-E — TextMagic webhook signing posture (relaxed-verify in place).
- I-279 — VIN lead-source resolution 16–31%.

**New from overnight (suggested for `issues.md` filing tomorrow, by operator):**
- I-NEW-2026-05-01-A — Routing redirect trap on `/teambox`, `/sales`, `/marketing`, `/insights`, `/management` (HIGH).
- I-NEW-2026-05-01-B — Weekly-report sales-vs-service filter not applied (`weeklyReportService.ts:479`); BL-107 follow-up missing from `issues.md`.
- I-NEW-2026-05-01-C — Conversion rate prints 100% due to lost-status lag (`server/vendorProxy.ts:641`, `server/routes/insights.ts:113,238`).
- I-NEW-2026-05-01-D — Sales activity feed dominated by `sync_delta_completed` system events (`activity-utils.ts:47`).
- I-NEW-2026-05-01-E — Pipeline forecast falls back to backward-looking soldCount; top-source grade is positional; trend hard-coded "flat" (`server/routes/insights.ts:129,138`).
- I-NEW-2026-05-01-F — Marketing tab navigation broken; `/marketing?tab=agents` redirects (`marketing.tsx:67-79`).
- I-NEW-2026-05-01-G — Marketing Insights tab renders Sales pipeline view; role-category filter at `insights.tsx:407` not applied in embedded mode.
- I-NEW-2026-05-01-H — TeamBox `channelFilters` missing `video` and `form` (`teambox.tsx:78-85`).
- I-NEW-2026-05-01-I — VAPI voice rows duplicated in Conversations + Phone tabs.
- I-NEW-2026-05-01-J — `agent` / `assistant` / `bot` / `system` roles render identically in TeamBox.
- I-NEW-2026-05-01-K — Org context silently switches mid-session (multi-tenant safety).
- I-NEW-2026-05-01-L — `warehouse_metrics` writer missing or disabled.
- I-NEW-2026-05-01-M — `leadSummary.source` hard-coded `"warehouse"` makes "VinSolutions Live" branch dead code.

## 11. Recommended next 5 actions

1. **Fix routing redirect trap (I-NEW-2026-05-01-A).** Highest priority — affects every demo and every real user trying to navigate. Should be a single-PR fix.
2. **Apply sales-only filter to weekly report (I-NEW-2026-05-01-B).** Operator decision: do it now or wait for `lead_type` column? Either way, customer-visible numbers are inflated today.
3. **Remove or correct the dishonest metrics (I-NEW-2026-05-01-C/E).** Replace 100% conversion rate with the lifetime win rate already computed. Replace positional A+/A/B/C grading with a real comparison. Stop labeling backward-looking soldCount as "forecast".
4. **Clean up Sales activity feed (I-NEW-2026-05-01-D).** Filter `userId IS NULL` system events. One-line server change.
5. **Decide marketing roadmap (Lane 6 gap).** Do we want a marketing-campaign UI on `/marketing`? Backend exists. UI doesn't.

## 12. Evidence paths

- `evidence/stabilization-sprint-2026-04-30/lane-4-sales-reports.md`
- `evidence/stabilization-sprint-2026-04-30/lane-5-teambox-taxonomy.md` + `lane-5-screenshots/`
- `evidence/stabilization-sprint-2026-04-30/lane-6-marketing.md` + `lane-6-screenshots/`
- `evidence/stabilization-sprint-2026-04-30/lane-7-metrics.md` + `lane-7-screenshots/`
- `evidence/stabilization-sprint-2026-04-30/lanes-4-8-plan.md`
- `evidence/stabilization-sprint-2026-04-30/overnight-validation-plan.md`

## 13. Git status

Local branch: `chunk-5-textmagic-soften`. `origin/main` HEAD: `b7d4d6f` (PR #5 merged). No new commits overnight. No pushes. No deploys.

Working-tree dirty entries (overnight validation outputs only — non-product):
```
 M .claude/session.md
 M evidence/stabilization-sprint-2026-04-30/plan.md
 M evidence/watchdog-alerts.log
?? .claude/scheduled_tasks.lock
?? .claude/session-snapshot.md
?? evidence/stabilization-sprint-2026-04-30/lane-4-sales-reports.md
?? evidence/stabilization-sprint-2026-04-30/lane-5-teambox-taxonomy.md
?? evidence/stabilization-sprint-2026-04-30/lane-5-screenshots/
?? evidence/stabilization-sprint-2026-04-30/lane-6-marketing.md
?? evidence/stabilization-sprint-2026-04-30/lane-6-screenshots/
?? evidence/stabilization-sprint-2026-04-30/lane-7-metrics.md
?? evidence/stabilization-sprint-2026-04-30/lane-7-screenshots/
?? evidence/stabilization-sprint-2026-04-30/lanes-4-8-plan.md
?? evidence/stabilization-sprint-2026-04-30/overnight-validation-plan.md
?? evidence/stabilization-sprint-2026-04-30/overnight-validation-report.md
?? evidence/stabilization-sprint-2026-05-01/
?? uploads/
```

## 14. No-push / no-deploy confirmation

Confirmed. No `git push`, no `gh pr merge`, no `npm run build`, no `pm2 restart`, no `docker restart`, no `gh secret set`, no production-config mutations, no real-customer contact, no DB writes, no migrations, no UI edits. Standing order honored end-to-end.
