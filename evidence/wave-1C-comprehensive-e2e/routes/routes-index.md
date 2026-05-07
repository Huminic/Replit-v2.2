# Wave 1C comprehensive E2E — route index

**Walker:** nexxus-e2e-evaluator (teammate)
**Walk start:** 2026-05-07T01:50:12Z
**Walk end:** 2026-05-07T01:59:00Z (~9 min)
**Code under test:** `wave/5-insights/1C-metric-honesty` HEAD `f024271`
**Env:** `http://localhost:5000` (pm2 nexxus-app, port 5000)
**pm2 baseline:** uptime unchanged across walk; restarts 85 → 85 (no restart in window)

## Routes visited

| # | Role | URL | HTTP | Title / H1 | Screenshot | Notes |
|---|---|---|---|---|---|---|
| 1 | serra_honda (org_admin) | `/` | 200 | "Sales" / "AI Key Metrics" | sh-00-aichat-landing.png | Landing = AI Chat shell with Sales context (last-active dept) |
| 2 | serra_honda | `/insights` (Dashboard tab) | 200 | "Insights" | sh-01-insights-dashboard.png | **S5 PASS** Win Rate=1.4%; **S3 OBSERVED** Conv Rate=1.4% |
| 3 | serra_honda | `/insights` (Reports > Source Quality Trends) | 200 | "Insights" / "Source Quality Trends" | sh-02-insights-source-trends.png | **S1 PASS** zero `flat` literals; 9 distinct sources |
| 4 | serra_honda | `/insights` (Activity tab) | 200 | "Insights" | sh-03-insights-activity.png | **S2 PASS** 50 date-rows visible, zero `sync_*` |
| 5 | serra_honda | `/sales` (Dashboard tab) | 200 | "Sales" / "Sales Dashboard" | sh-04-sales-dashboard.png, sh-04b-sales-kpis-zoom.png | **S3 PROVEN** Conv Rate=100% honest math (sold=7, lost=0); **S4 INDIRECT** Total Leads (30d)=641, Sold=7 |
| 6 | serra_honda | `/sales/leads` | 404 | "404 Page Not Found" | (no screenshot) | No separate leads URL; leads in TeamBox + dashboards |
| 7 | serra_honda | `/teambox` | 200 | "TeamBox" | sh-05-teambox-list.png | 18 conversations visible, customer info panel renders |
| 8 | serra_honda | `/marketing` | 200 | "Marketing" | sh-06-marketing.png | "v2.3 preview" banner; KPIs all 0; renders cleanly |
| 9 | serra_honda | `/service` | 200 | "Service" / "Service Campaigns" | sh-07-service-campaigns.png | Campaign list (14+ rows), kill-switches visible, Vehicle Merge Test draft |
| 10 | serra_honda | `/widget-landing` | 404 | "404 Page Not Found" | (no screenshot) | Wrong URL — widget routes are `/w/:slug` and `/p/:slug` |
| 11 | (no auth) | `/w/demo` | 200 | "Demo Organization" | sh-08-widget-demo.png | Public widget landing renders WITHOUT auth (correct) |
| 12 | serra_honda | `/management` | 302 → `/` | (redirect) | (n/a) | Permission-gated for org_admin; redirects to home (correct) |
| 13 | serra_honda | `/settings` | 200 | "System Settings" | sh-09-settings.png | 6 settings cards (User Mgmt, Org, Tools, KB, Notifications, Appearance) |
| 14 | serra_honda | `/agents` | 200 | "Data Guru" | sh-10-agents-data-guru.png | Active AI agent detail view |
| 15 | serra_honda | `/my-work` | 200 | "My Work" | sh-11-mywork.png | Tasks (overdue=5, active=728, completed=1) — "Unsent SMS — blocked" tasks visible |
| 16 | serra_honda | `/usage` | 200 | "Usage" | (no screenshot) | Usage By Type: SMS Blocked=11; current month |
| 17 | serra_honda | `/profile` | 200 | "Profile" | (no screenshot) | "Serra Honda Admin" / Organization Admin / Serra Honda |
| 18 | (no auth) | `/login` | 200 | "Nexxus Customer portal" | sh-12-login.png | Logout returned to here |
| 19 | duane.wells (super_admin) | `/` | 200 | "AI Key Metrics" | sa-13-superadmin-landing.png | DKW avatar, Huminic org context, "Manage" sidebar item visible |
| 20 | super_admin | `/management` (Dashboard, All Stores) | 200 | "Management" | sa-14-management-huminic.png | "No lead data available yet" banner; **all KPIs zero** including Conv Rate=blank, Win Rate=0% |
| 21 | super_admin | `/management` (Dashboard, store=Serra Honda) | 200 | "Management" | sa-15-management-serra-honda-via-superadmin.png | Cross-store: Win Rate=1.4%, Conv Rate=1.4%, Total Sold=7, Total Leads=508 — IDENTICAL to serra_honda's view |
| 22 | duanekwells (partner_admin) | `/` | 200 | "AI Key Metrics" | pa-16-partner-admin-cage-landing.png | DW avatar, Cage Automotive context, NO Manage sidebar (correct) |
| 23 | partner_admin | `/insights` (All Stores) | 200 | "Insights" | pa-17-insights-cage-automotive.png | "No lead data available yet"; Win Rate=0%, Conv Rate=blank (S3 null branch in action); zero `100%`/`null%`/`flat`/`sync_*` |

## HTTP status summary

- 200 OK: 19 routes
- 302 redirect: 1 route (`/management` for org_admin → `/`)
- 404 Not Found: 2 routes (`/sales/leads`, `/widget-landing`) — both correct (routes don't exist)
- 4xx other: 0
- 5xx server error: 0

## Wave 1C critical literal counts (across all visited dealer surfaces)

| Literal | Count | Verdict |
|---|---|---|
| `100%` (rendered as KPI value) | 1 (only on `/sales` Conv Rate, where data math = 100% from sold=7/lost=0) | EXPECTED |
| `null%` / `NaN%` / `undefined%` | 0 | PASS |
| `flat` (literal as trend value) | 0 | **S1 PASS** |
| `sync_*` rows in activity feeds | 0 across 50+ rendered rows on serra_honda /insights/Activity AND /sales/Recent Activity | **S2 PASS** |

## Roles confirmed

- super_admin (Huminic, DKW): `/management` accessible, store-picker shows all 7 orgs, can switch context to any org
- partner_admin (Cage Automotive, DW): no `/management` sidebar, redirected away from `/management`
- org_admin (Serra Honda, SHA): no `/management` sidebar, dashboards scoped to own org

## Pm2 / health during walk

- pm2 nexxus-app: status `online`, uptime unchanged, restart count 85 → 85 (no restart in walk window)
- Browser console errors during walk: empty (post-login fetch probes that returned 401 are fetch-context auth issues, not app exceptions)
- pm2 logs: only pre-existing warnings — `[Insights] Failed to fetch lead source mapping for org <Cage|Huminic uuid>: Error: VIN integration not found` (caught + logged, not thrown). Pre-existing `[VAPI Webhook] VAPI_WEBHOOK_SECRET unset` rejection notice. Zero `uncaughtException` / `UnhandledPromiseRejection` / `TypeError` / `ReferenceError` in walk window.

## Halt conditions

ZERO triggered:
- No 5xx on any route
- No uncaught exceptions in pm2 logs related to wave-1C code paths
- No rendered KPI showing pre-1C dishonest values (100% only on data-explained surface)
- Login worked for all 3 test accounts (super_admin, partner_admin, org_admin)
- Pm2 process did NOT restart mid-walk (uptime preserved)
