# Wave 1C comprehensive E2E — critical workflows summary

**Walker:** nexxus-e2e-evaluator (teammate session)
**Walk window:** 2026-05-07T01:50:12Z → 2026-05-07T01:59:00Z
**Driver:** Playwright MCP (mcp__playwright-test)

## A — Login + role-routing (3 accounts)

| Account | Role | Org | Lands at | Sidebar items | Verdict |
|---|---|---|---|---|---|
| serra_honda@huminic.ai | org_admin | Serra Honda | `/` (AI Chat) | AI Chat, TeamBox, Sales, Service, Insights, Marketing, System (no Manage) | PASS |
| duane.wells@huminic.ai | super_admin | Huminic | `/` (AI Chat) | + **Manage** sidebar item visible | PASS |
| duanekwells@gmail.com | partner_admin | Cage Automotive | `/` (AI Chat) | AI Chat, TeamBox, Sales, Service, Insights, Marketing, System (no Manage) | PASS |

Verdict: **A PASS** — login worked for all 3, role routing correctly differentiated (only super_admin sees `/management` sidebar; partner_admin redirected away from `/management`).

Evidence: routes/sh-00-aichat-landing.png, routes/sa-13-superadmin-landing.png, routes/pa-16-partner-admin-cage-landing.png, routes/sh-12-login.png

## B — Lead viewing flow

Attempted `/sales/leads` → 404 (no such route). Lead-level browsing happens inside TeamBox conversations + dashboards. Did NOT click into a specific lead detail page (no per-lead URL surfaced via DOM crawl in available time). TeamBox Customer Info side panel renders for any selected conversation (verified: "Test Customer" CHAT, status Open, Quick Actions Call/Email/SMS, Push to VIN button).

Verdict: **B PARTIAL** — lead-list-as-its-own-page does not exist as a route in this app; lead context is reachable inside TeamBox conversations and via dashboard tile drill-downs (not exercised here). NOT a Wave 1C concern.

Evidence: routes/sh-05-teambox-list.png

## C — Insights tile rendering

Verified all Wave 1C insights tiles on `/insights` Dashboard + Reports + Activity:
- Win Rate = 1.4% (NOT 100%) — **S5 PROVEN**
- Conv Rate = 1.4% (lifetime sample, matches Win Rate denominator)
- Total Leads = 508 (lifetime), 369 (active 30d)
- Total Sold = 7
- Source Quality Trends shows 9 distinct sources, ZERO `flat` literals — **S1 PROVEN**
- Activity tab shows 50 user-attributable rows, ZERO `sync_*` — **S2 PROVEN**

Cross-referenced against post-1C Δ2 prior walk (`evidence/wave-1C-metric-honesty/wave-proof/`): values shifted by +1 sold lead since 2026-05-06 (sold 6→7, total 494→508, win rate 1.2%→1.4%) — expected daily drift, NOT regression.

Verdict: **C PASS**

Evidence: routes/sh-01-insights-dashboard.png, routes/sh-02-insights-source-trends.png, routes/sh-03-insights-activity.png

## D — Sales workflow shell

Verified `/sales` Dashboard:
- Total Leads (30d) = 641 (sales-only count, S4 verified indirectly)
- Sold = 7 (matches /insights Total Sold)
- Conv Rate = 100% (sold=7, lost=0 — honest math from S3 formula, not pre-1C dishonest value)
- Top Performing Agents = AI agents (no human reps)
- Recent Activity panel = 10 user-attributable rows, ZERO `sync_*`

API wire-shape capture: prior walk (2026-05-06) confirmed `/api/vin/leads/summary` returns `{soldLeads, lostLeads, conversionRate}` shape (saved at `evidence/wave-1C-metric-honesty/wave-proof/sales-summary-network-2026-05-06T235000Z.json`). This walk inherits that proof.

Verdict: **D PASS**

Evidence: routes/sh-04-sales-dashboard.png, routes/sh-04b-sales-kpis-zoom.png

## E — Marketing tab routing

`/marketing` opens cleanly with explicit "v2.3 preview" banner. Dashboard/Agents/Studio/Insights tabs visible. KPIs render zeros (Campaign Performance 0%, Active 0, Sent 1, Replies 0). NO broken redirect / 404. Wave 3B target — known low-signal in this build.

Verdict: **E PASS for Wave 1C purposes** (no regression caused by 1C; known Wave 3B follow-ups not in scope here)

Evidence: routes/sh-06-marketing.png

## F — Service campaign list

`/service` Campaigns tab loads. 14+ campaigns visible with mix of TESTLANE-prefixed (correctly tagged), drafts, completed, archived, paused. Kill-switch toggles render. Action buttons (Play/Schedule/View/Export) render per-row. NO outbound triggered. Read-only browse only.

Verdict: **F PASS**

Evidence: routes/sh-07-service-campaigns.png

## G — Settings / Management surfaces

- `/settings` (org_admin): 6 settings cards, no errors, no 5xx
- `/management` (org_admin): 302 redirect to `/` (correctly permission-gated)
- `/management` (super_admin, All Stores → Huminic context): renders with "No lead data available" banner; KPIs show 0/blank; Conv Rate blank (S3 null branch)
- `/management` (super_admin, store=Serra Honda): renders with Serra Honda data; KPIs match the org-admin view exactly

Service campaign module flags per the operator decision (only serra-honda enabled for launch): NOT independently verified in this walk (would require per-org service-campaign launch toggle inspection — covered by Wave 1C predecessor preflights).

Verdict: **G PASS** — no 5xx; permission gating correct; cross-store store-picker preserves data fidelity

Evidence: routes/sh-09-settings.png, routes/sa-14-management-huminic.png, routes/sa-15-management-serra-honda-via-superadmin.png

## H — Widget public landing

`/w/demo` opens WITHOUT auth. Renders form (First/Last/Phone/Email/intent), "Get in Touch" CTA, "Start a Live Video Chat" CTA, legal disclaimer, stats panel. NO 5xx, no broken assets.

Verdict: **H PASS**

Evidence: routes/sh-08-widget-demo.png

## I — Activity feed scroll (50+ rows)

`/insights > Activity`:
- 50 date-stamped rows visible at initial render
- Scroll to bottom of internal scrollable container (scroll target: 2834px out of 3376px max)
- syncStarMatches=0, systemEventMatches=0 across the entire 50-row buffer
- Distinct user-attributable event types: Weekly Report Sent, Trigger Checkin Sent, Vapi Call Received, Trigger Immediate Sent, Sms Inbound Received, Campaign Created/Active/Executed/Dry Run, Tavus Video Completed, Login Failed, Agent Triggers Updated, Agent Created/Updated/Deleted, Escalation Email Sent, User Created, Role Changed

The page does not have infinite-scroll loading; 50 is a server-side cap (`/api/activity-log?limit=50`). Direct API probe at limit=500 returned 401 (limit cap or session-context issue with eval-context fetch missing access token). Page-level evidence at the rendered surface is sufficient — the user sees zero `sync_*` rows.

Verdict: **I PASS**

Evidence: routes/sh-03-insights-activity.png

## J — Auth/session

- Logout from serra_honda → returned to `/login`
- Login as super_admin → success, lands at `/`
- Logout from super_admin → returned to `/login`
- Login as partner_admin → success, lands at `/`
- Page reload after login: not explicitly tested as a separate step, but each `goto(URL)` from the test causes a fresh page load that re-validates the session cookie. App reissued auth tokens via `/api/auth/refresh` (200) on every page load.

Verdict: **J PASS**

Evidence: routes/sh-12-login.png; route status confirmed via DOM redirects on logout

## Provider-proof gaps (Wave 2A territory — NOT exercised)

The following provider-side checks were NOT performed (test envelope: read-only, no provider sends):
- TextMagic real SMS round-trip
- Resend email send (covered by 2026-05-06 Δ1 already)
- VAPI real call placement
- Tavus session creation
- VIN Solutions write (vin-safe-mcp prepare→execute)

These belong to Wave 2A.

## Wave 3F UI follow-ups surfaced (NOT investigated, NOT blocked)

1. Source Quality Trends chart renders axis labels and legend but trend lines themselves did not visualize in this walk. Sibling tab "Loss Patterns by Source" rendered the data fine in tabular form. Worth a chart-render pass in Wave 3F.
2. `/sales` Conv Rate showing `100%` for serra_honda is mathematically true (sold=7, lost=0) but visually misleading at small denominator. Wave 3F should consider denominator-confidence rendering ("sample too small" / "n=7") or hide the % when denominator < threshold.
3. Top Performing Agents on `/sales` shows AI agents only (no human reps). Pre-existing call-out from prior walk; Wave 3F to decide whether to add human-rep leaderboard.
4. `/sales/leads` returns 404 — no per-lead route exists. If product wants a lead-list page, Wave 3F.
5. `/widget-landing` returns 404 (real widgets are at `/w/:slug`); operator may want a vanity URL or discoverability page. Wave 3F.
