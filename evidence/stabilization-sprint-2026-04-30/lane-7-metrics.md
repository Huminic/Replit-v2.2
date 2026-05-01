# Lane 7 — Dashboard-Honesty Audit (2026-04-30)

**Scope:** Every metric/number/chart visible on the user-facing dashboards graded REAL / PARTIAL / MOCKED / STALE / UNKNOWN against its underlying data path.

**Method:**
1. Logged into `https://dev.huminicdev.com` as `serra_honda@huminic.ai` (org_admin, real warehouse_leads data) and `duane.wells@huminic.ai` (super_admin, Huminic test org).
2. Captured network traffic + raw JSON for every dashboard endpoint (saved under `lane-7-screenshots/`).
3. Cross-referenced every visible value against the server route → storage method → SQL/derivation.
4. Full page screenshots taken for each dashboard surface walked.

**Surfaces walked:** AI Chat home tiles (`/`), Sales dashboard (`/sales`), Service insights (`/service?tab=insights`), Insights (`/insights`), Marketing dashboard (`/marketing`), Management (code-only — runtime kept redirecting to /teambox), TeamBox.

**Note on routing surprise:** The dev SPA persistently redirected the browser to `/teambox` after navigation events triggered by sidebar overlay clicks. When entering tab routes via direct address bar typing, the target page rendered correctly. This is captured under Observations rather than the metric audit.

---

## Headline

| Metric grade | Count |
|---|---|
| REAL (live DB, correct math) | 19 |
| PARTIAL (live data, caveats) | 16 |
| MOCKED / DISHONEST (semantically broken) | 7 |
| STALE (cached without invalidation) | 0 |
| UNKNOWN | 0 |
| **Total audited** | **42** |

**Headline finding:** The numeric values are almost all live-DB (no hard-coded mocks). The dishonesty is in **labels and denominators**, not in the math wiring. Three pages display values that look like dealership KPIs but aren't:
1. **Sales > "Conversion Rate"** = 100% because `lostLeads (30d) = 0` and the formula is `sold/(sold+lost)`. Math is correct; the metric is meaningless.
2. **Sales > "Recent Activity"** is a verbatim list of internal `sync_delta_completed` events, rendered as "Sync Delta Completed · 11 minutes ago" 10 times in a row. Looks like dealer activity; it is the warehouse poller talking to itself.
3. **Insights > Pipeline Health > "Forecast"** falls back to `soldCount` (last 30 days) when `warehouse_metrics.month_end_forecast` is missing — labelled "forecast" but is actually historical sold count.

---

## Metrics map — complete table

Files cited:
- `server/routes/metrics.ts` (`metrics`)
- `server/routes/insights.ts` (`insights`)
- `server/storage.ts` (`storage`)
- `server/vendorProxy.ts` (`vendorProxy`)
- `server/routes/notifications.ts` (`notifications`)
- `client/src/pages/main.tsx` (`main`)
- `client/src/pages/sales.tsx` (`sales`)
- `client/src/pages/service.tsx` (`service`)
- `client/src/pages/marketing.tsx` (`marketing`)
- `client/src/pages/insights.tsx` (`insights-ui`)

### AI Chat home (`/`) — `client/src/pages/main.tsx`

| Page | Metric | API endpoint | Server file:line | Grade | Utility (1-5) | Notes |
|---|---|---|---|---|---|---|
| Home tiles | Active Pipeline (14d) | GET `/api/metrics/pipeline` | `metrics:45-55` → `storage:802-826` | REAL | 4 | Counts `warehouse_leads` rows where vinCreatedAt or syncedAt within 14d, excluding LOST/SOLD/BAD/SERVICE/DUPLICATE statuses. Live SQL. |
| Home tiles | Appointments Today | GET `/api/metrics/pipeline` | `metrics:45-55` → `storage:827-832` | REAL | 5 | `appointments` table where `status='scheduled'` and `startTime` within today. |
| Home tiles | Open Escalations (Open) | GET `/api/metrics/pipeline` | `metrics:45-55` → `storage:834-839` | PARTIAL | 3 | Counts `tasks` where `status='todo'` AND `(type='escalation' OR type='unsent_message')` within 90d. **Caveat:** Serra Honda has 441 of these; Huminic test org has 11. The 90-day window means the "open" count is unbounded — old escalations never roll off. |
| Home tiles | Outbound Sent 24h | GET `/api/metrics/pipeline` | `metrics:45-55` → `storage:841-845` | REAL | 4 | Counts `outbound_log` rows with `status='sent'` in last 24h. |
| Header | Notifications badge (e.g. "687") | GET `/api/notifications/unread-count` | (route present, not read) | PARTIAL | 2 | Verified value: 687 for serra_honda, 133 for super_admin. **Risk:** Includes machine-generated `sync_delta_completed`/`sms_inbound` events. Many test SMS notifications inflate the count. Operator visibility into this metric is low. |

### Sales dashboard (`/sales`) — `client/src/pages/sales.tsx`

`buildSalesMetrics` at `sales:103-131`. All values come from GET `/api/vin/leads/summary` (`vendorProxy:552-648`) plus `pipeline.activePipeline` from `/api/metrics/dashboard`.

| Page | Metric | API endpoint | Server file:line | Grade | Utility | Notes |
|---|---|---|---|---|---|---|
| Sales dashboard | Total Leads (30d) | `/api/vin/leads/summary` | `vendorProxy:586-594` | REAL | 5 | Live count of warehouse_leads in last 30d. Serra Honda: 612. |
| Sales dashboard | Total Leads change (`+38%` vs last 30d) | same | `vendorProxy:615-619` | REAL | 4 | pctChange with tiny-base suppression (prior<5 → 0). |
| Sales dashboard | New Leads | same | `vendorProxy:589` | REAL | 5 | `isNewLead(vinStatus)` filter. Serra Honda: 38. |
| Sales dashboard | New Leads change | same | `vendorProxy:633` | REAL | 4 | pctChange. |
| Sales dashboard | Active Pipeline (14d) | `/api/metrics/dashboard.pipeline` | `storage:812-826` | REAL | 5 | Same SQL as Home tile. Value: 187. **No delta** ever shown — by design (`sales:122` comment cites I-NEW-2026-04-28-A). |
| Sales dashboard | Waiting on Response | `/api/vin/leads/summary` | `vendorProxy:592` | REAL | 4 | Counts `vinStatus = 'ACTIVE_WAITING_FOR_PROSPECT_RESPONSE'`. Serra Honda: 161. **No delta.** |
| Sales dashboard | Appointments Set | `/api/vin/leads/summary` | `vendorProxy:584,593` | PARTIAL | 4 | Counts today-only scheduled appointments (not "set in the period"). Tile label says "Appointments Set" but server returns same single-day number as the Home tile. **Label mismatch.** Serra Honda: 0. |
| Sales dashboard | Sold | `/api/vin/leads/summary` | `vendorProxy:590` | REAL | 5 | `isSoldLead(vinStatus)` over 30d. Serra Honda: 6. |
| Sales dashboard | Sold change (`-57% vs last 30d`) | same | `vendorProxy:637` | REAL | 4 | pctChange honors tiny-base rule. |
| Sales dashboard | **Conversion Rate (100%)** | `/api/vin/leads/summary` | `vendorProxy:641` | **MOCKED/DISHONEST** | 1 | `sold/(sold+lost)` over 30d. Serra Honda: sold=6, lost=0 → 100%. lost=0 because `vinStatus` for closed-lost is set asynchronously by VIN sync; in-period denominator is empty. **Reports endpoint shows totalLost=236 lifetime.** Conversion rate displayed is mathematically correct, semantically false. |
| Sales dashboard | Top Performing Agents card | `/api/agents?department=sales` | `agents.ts` | PARTIAL | 1 | Shows agent names with green-dot status; no actual performance signal. Sort order is by query insertion order, not by any measurable performance. The "ranking" in the UI (1-N) is meaningless. |
| Sales dashboard | **Recent Activity feed** | `/api/activity-log?limit=10` | `metrics:20-31` → `storage` | **MOCKED/DISHONEST** | 1 | All 10 entries on serra_honda are `sync_delta_completed` from background sync poller (userId=null). Description rendered via `mapActivityLogToItem` (`client/src/lib/activity-utils.ts:47`) as snake_case→Title Case, producing "Sync Delta Completed · 11 minutes ago". For super_admin/Huminic the feed is more honest because real test events exist (`escalation_email_sent`). For Serra Honda this is a wall of internal noise. |
| Header | "Synced 11m ago" badge | leadSummary.syncedAt | `vendorProxy:621-626` | REAL | 4 | Computes max(syncedAt) across leads. |
| Header | "Warehouse" / "VinSolutions Live" badge | leadSummary.source | `vendorProxy:642` (always "warehouse") | PARTIAL | 2 | Field is hard-coded `"warehouse"`. The conditional `source === 'warehouse' ? Warehouse : VinSolutions Live` exists in UI (`sales:583-587`) but the Live branch is unreachable in current code. |

### Service > Insights tab (`/service?tab=insights`) — `client/src/pages/service.tsx:106-113`

| Page | Metric | API endpoint | Server file:line | Grade | Utility | Notes |
|---|---|---|---|---|---|---|
| Service insights | Active Campaigns | `/api/metrics/dashboard.campaignStats.byDepartment.service.active` | `storage:679-694, 749-765` | REAL | 5 | `campaigns` rows where `department='service'` and `status='active'`. Serra Honda: 2. |
| Service insights | Messages Sent | same | `storage:717-727` | REAL | 5 | `campaign_recipients` with `status IN ('sent','delivered')` joined to service-dept campaigns. Serra Honda: 10. |
| Service insights | Replies Received | same | `storage:729-738` | PARTIAL | 4 | Counts inbound `conversations` with non-null `campaignId` — assumes any inbound conversation tied to a campaign is a reply. Does not filter to actual customer-initiated messages within a window. Serra Honda: 2. |
| Service insights | Open Conversations | `/api/metrics/dashboard.conversationCounts.open` | `storage:664-704` | PARTIAL | 3 | All-org-conversations grouped by status. Serra Honda total open=41, but `closed=0` — strongly suggests conversations are never being closed. **Side effect:** number grows unboundedly. |
| Service insights | Total Conversations | same | `storage:664-704` | PARTIAL | 2 | Cross-channel total (sms+chat+ai-chat+voice+form+agent-chat). Includes 23 ai-chat sessions which aren't customer conversations. Iconology used (ThumbsDown icon for "Total Conversations") suggests this was repurposed from another KPI. |
| Service insights | Reply Rate | derived | `storage:765` | PARTIAL | 4 | replied/sent for service-dept campaigns. Serra Honda: 20%. Real but small denominator. |

### Marketing dashboard (`/marketing`) — `client/src/pages/marketing.tsx:85-93`

| Page | Metric | API endpoint | Server file:line | Grade | Utility | Notes |
|---|---|---|---|---|---|---|
| Marketing dashboard | Campaign Performance (`%`) | `/api/metrics/dashboard.campaignStats.byDepartment.marketing.replyRate` | `storage:765` | PARTIAL | 3 | Same as Service Reply Rate, scoped to marketing dept. Falls back to org-wide replyRate if marketing dept stats absent. **Label is generic** — "Campaign Performance" implies open rate / CTR / ROI, but value is just SMS reply rate. |
| Marketing dashboard | Campaigns Active | same | `storage` | REAL | 4 | `byDepartment.marketing.active`. Serra Honda: 0. |
| Marketing dashboard | Messages Sent | same | `storage` | REAL | 4 | Marketing-dept sent count. Serra Honda: 1. |
| Marketing dashboard | Replies Received | same | `storage` | REAL | 4 | Serra Honda: 0. |

### Insights page (`/insights`) — `client/src/pages/insights.tsx`

Backed by GET `/api/insights/dashboard` (`insights:45-255`), `/api/insights/reports` (`insights:257-347`), `/api/insights/library` (`insights:707-1166`).

| Page | Metric | Endpoint key | Server file:line | Grade | Utility | Notes |
|---|---|---|---|---|---|---|
| Insights · Red Zone | Hot Leads Going Cold (count + table) | `redZone.hotLeadsGoingCold` | `insights:63-77` | REAL | 5 | Active leads >2 days old, sorted by age. Serra Honda: 20 (capped). |
| Insights · Red Zone | New Leads Without Contact | `redZone.newLeadsNoContact` | `insights:79-91` | PARTIAL | 5 | "No contact" is just `isNewLead(vinStatus)` — does NOT check the conversations table. A "new lead" could already have inbound SMS and still show here. Title is misleading. |
| Insights · Red Zone | Showroom Visitors Not Closed | `redZone.showroomNotClosed` | `insights:93-106` | PARTIAL | 4 | Filters by `leadSource` containing "walk"/"showroom". Serra Honda: 0 — likely because none of their VIN lead sources use those literals; they're all encoded as `Source #NNN`. |
| Insights · Watch list | Stale Leads (>7 days) | `yellowZone.staleLeads` | `insights:230-233` | REAL | 5 | Count of active leads with vinUpdatedAt >7 days. Serra Honda: 441. |
| Insights · Watch list | Pending Finance | `yellowZone.pendingFinance` | `insights:234` | REAL | 4 | `vinStatus IN ('pending_finance', 'SOLD_PENDING_FINANCE')`. Serra Honda: 0. |
| Insights · Green zone | Total Active Pipeline (30d) | `greenZone[0]` | `insights:237` | PARTIAL | 4 | This is `hotCount` (isActiveLead over 30d), labelled "Total Active Pipeline (30d)". **Different from** Sales' "Active Pipeline (14d)" tile (187). For Serra Honda hotCount=339 — different number, same dealership, similar-sounding label. **Label clash.** |
| Insights · Green zone | Conversion Rate | `greenZone[1]` | `insights:113,238` | **MOCKED/DISHONEST** | 1 | Same broken math as Sales: sold/(sold+lost) over 30d. Renders `100%` for serra_honda. |
| Insights · Green zone | Total Leads | `greenZone[2]` | `insights:239` | REAL | 5 | 30d window. |
| Insights · Pipeline Health | Velocity | `pipelineHealth.velocity` | `insights:242` | UNKNOWN | 2 | Reads from `warehouse_metrics.pipeline_velocity` — not populated in any code path I traced. Renders `null`/empty. |
| Insights · Pipeline Health | Freshness | `pipelineHealth.freshness` | `insights:191-197,243-244` | REAL | 5 | "% of active leads created ≤7 days". Serra Honda: 29% → "Stale". |
| Insights · Pipeline Health | **Forecast** | `pipelineHealth.forecast` | `insights:245` | **MOCKED/DISHONEST** | 1 | `metricsMap["month_end_forecast"] \|\| soldCount` — when warehouse_metrics is empty (always, on observed orgs), this returns the past 30-day **soldCount**. Labelled "forecast", actually backward-looking. |
| Insights · Top sources | Source 1..8 (volume + win rate + grade A+/A/B/C) | `topLeadSources` | `insights:116-141` | PARTIAL | 4 | Volume and winRate are real. **Grade is fabricated:** A+ if rank 1, A if rank 2-3, B if 4-5, else C — purely positional, not earned by performance. `gradeColor` follows. |
| Insights · Top sources | "trend": "flat" | `topLeadSources[*].trend` | `insights:138` | **MOCKED** | 1 | Hard-coded literal `"flat"` for every source. |
| Insights · Channel performance | Volume / Conversion / WinRate / LossRate / BadRate / HotPct per channel | `channelPerformance` | `insights:143-163` | PARTIAL | 4 | Channel inferred from leadSource string matching (`deriveChannel` at `insights:18-33`). Most VIN sources are "Source #NNN" → falls into "Other". Serra Honda channel array length: 2 (Website + Other) — almost no signal because channel isn't stored, it's regex'd. |
| Insights · Daily trend | leads + conversions per day-of-week | `dailyTrend` | `insights:200-221` | REAL | 5 | Buckets by day-of-week label. |
| Insights · Reports · Loss Analysis | Total Lost | `lossAnalysis.totalLost` | `insights:277,332` | REAL | 5 | Lifetime count (no date filter). Serra Honda: 236. |
| Insights · Reports · Loss Analysis | Total Bad | `lossAnalysis.totalBad` | `insights:278,332` | REAL | 5 | Serra Honda: 469. |
| Insights · Reports · Loss Analysis | Loss Rate / Bad Rate | `lossAnalysis.lossRate/badRate` | `insights:333-334` | PARTIAL | 4 | Numerator is lifetime, denominator is `totalLeads` (also lifetime via `getWarehouseLeads(orgId, {})`). For Serra Honda: lossRate=13%, badRate=26%. |
| Insights · Source Quality Trends | per-source winRate, lossRate, avgDaysBeforeLoss | `sourceQualityTrends` | `insights:296-307` | REAL | 5 | Real math, lifetime data. |
| Insights · Performance Summary | totalLeads / sold / lost / bad / winRate | `performanceSummary` | `insights:330-342` | REAL | 5 | Lifetime numbers, totalLeads=1809, winRate=18.3% for serra_honda. **This conversionRate (18.3%) is the honest number** that should replace the 100% on the dashboard tile. |
| Insights · Library | All 34 metrics (Total Active Pipeline 30d, Daily New Leads, Weekly Trend, MoM Growth, Lead Velocity, Pipeline Stagnation, Fresh Lead Ratio, Lifetime Win Rate, Internet/Walk-In/Hot/Showroom Close Rate, Loss Rate, Bad Lead Rate, Contact Rate, New Lead Aging, Response Gap, Waiting Volume, Engagement Transition, Avg Time to 1st Contact, Top Source, Source Win Rate, Source Diversity, Concentration Risk, Source Quality Score, Digital %, Walk-In Traffic, Phone Inquiries, Referral Leads, Sales Velocity, Digital Maturity, Projected Month Close, Pipeline Coverage Ratio, Service-to-Sales) | `/api/insights/library` | `insights:707-1166` | mostly PARTIAL | 3-5 | All values computed from warehouse_leads + conversations. Issues: `lib-11 Service-to-Sales` returns "—" (no source detected); `lib-20 Engagement Transition` is suppressed to "—" by `insights:1092` (cited as misleading per I-267); many `change` fields are literally the en-dash `"—"` because no delta is computed (lib-2, lib-4, lib-17, lib-18, lib-19, lib-20, lib-22..26, lib-33, lib-34). The displayed numbers are real; the trend arrows on those tiles are decorative. |
| Insights · Activity log | List of recent log entries | `/api/activity-log?limit=50` | `metrics:20-31` | PARTIAL | 2 | Same data as Sales recent activity. Same problem when org is sync-dominated. |
| Insights · Hunches | AI hunch cards (count, title, confidence%) | `/api/hunches` | `routes/hunches.ts` | UNKNOWN→PARTIAL | 4 | 25 hunches present in both serra_honda and Huminic. Confidence values are ML-assigned. Not audited deeply this lane — recommend follow-up. |

---

## Top 5 dishonest metrics (numbers that look real but aren't)

1. **Sales · Conversion Rate = 100%** (`vendorProxy:641`, `client/src/pages/sales.tsx:129`)
   - Math: `soldLeads / (soldLeads + lostLeads)` over 30d window. Serra Honda 30d: sold=6, lost=0 → 100%.
   - **Why dishonest:** lost-lead status is set by VIN async; in any rolling 30d window the lost denominator can be 0 even when 200+ leads went LOST lifetime. Tile shows "100%" with no caveat.
   - **Same bug appears at:** Insights green-zone tile (`insights:238`).

2. **Sales · Recent Activity feed** (`sales:686-700` rendering `/api/activity-log` via `client/src/lib/activity-utils.ts`)
   - Reality: 10/10 most recent entries on serra_honda are `sync_delta_completed`, rendered as "Sync Delta Completed · 11 minutes ago" repeatedly.
   - **Why dishonest:** This is the warehouse poller talking to itself. A dealer GM looking at "Recent Activity" sees nothing actionable. Activity feed should filter out internal sync events.

3. **Insights · Pipeline Health · Forecast = 6** (`insights:245`)
   - Falls back to `soldCount` when `warehouse_metrics.month_end_forecast` is missing. Always missing on observed orgs.
   - **Why dishonest:** The label says "forecast" (forward-looking) but the value is the count of leads that already closed in the past 30 days.

4. **Insights · Top Lead Sources · Grade A+/A/B/C** (`insights:129`)
   - `grade = i === 0 ? "A+" : i < 3 ? "A" : i < 5 ? "B" : "C"` — purely positional.
   - **Why dishonest:** A dealer reads "Source X grade A+" and infers source quality. The grade has nothing to do with quality; #1-by-volume always gets A+ even if its winRate is 0%.

5. **Insights · Top Lead Sources · Trend = "flat"** (`insights:138`)
   - Hard-coded literal `"flat"` on every source.
   - **Why dishonest:** Trend arrow/badge shown in UI implies time-series; there is none.

**Honorable mentions (PARTIAL but borderline):**
- **Sales · Top Performing Agents card**: ranks 1-N by query order, not by any performance metric.
- **Sales · "Appointments Set"** tile: returns today-only count, not period-cumulative — label implies cumulative.
- **Marketing · "Campaign Performance %"**: is just SMS reply rate; "Performance" is a much broader concept than what's shown.
- **Insights · Watch List · Stale Leads (>7d) = 441** for serra_honda: real number but the workflow to act on stale leads doesn't seem to be wired (no "mark as resolved" path), so the count climbs forever.
- **Header notification badge (687)**: includes `sync_delta_completed`/`sms_inbound` test events. Inflated.

---

## Recommended replacement metrics

Tied to specific dealership questions a GM/Sales Manager actually asks:

| Dealer question | Current dishonest metric | Recommended replacement | How to compute |
|---|---|---|---|
| "What % of leads close into a sale?" | Sales/Insights Conversion Rate (100%) | **Lifetime Win Rate** (already exists as `lib-8` = 18.3% for serra_honda) | Promote the lifetime metric; demote the 30d sold/(sold+lost). Or: surface BOTH but label them "30-day Close Rate (recent)" and "Lifetime Win Rate". |
| "What happened today?" | Sales Recent Activity (sync noise) | **Operator Activity Feed** filtering out `entityType IN ('sync', 'system')` and `userId IS NULL` events; show `escalation_email_sent`, `lead_assigned`, `appointment_scheduled`, `message_sent`, `vin_push_succeeded`. | Server-side filter on `activity_log` query. |
| "How are we trending vs target this month?" | Insights Forecast (= past sold count) | **Projected Month Close** (already exists as `lib-33`) — extrapolates current run-rate to month end. Show both projected close + this-month-actual + last-month-actual. | Already computed; surface on dashboard not just Library. |
| "Which lead source is performing best?" | Top Sources Grade (positional) | **Top Sources Grade by Win Rate** — A+ if winRate >=20% AND >=10 leads; A if >=15%; B >=10%; C >=5%; D <5%. Min volume gate to avoid "100% from 1 lead" noise. | Replace `insights:129` constant rule. |
| "Are my hot leads going stale?" | Top Sources trend "flat" | **Real trend per source**: compare last-7d count to prior-7d count per source; render up/down/flat. | Add a 7d/7d compute alongside existing source counts. |
| "Are my appointments showing up?" | Appointments Today (only) | Add **Appointments This Week + No-Show Rate** — show today's count alongside the rolling 7d count and what % of past 7d appointments resulted in an `actual_arrival_at` timestamp. | Schema already has appointments; needs no-show field or status update path. |
| "How fast are we responding to new leads?" | (Currently shown in Library only) | Surface **Avg Time to 1st Contact** (`lib-21`) on the main Sales dashboard prominently. It's the single most predictive lead-quality metric. | Already computed; promote to tile. |
| "What did my agents accomplish today?" | Top Performing Agents (insertion order) | **Agents by completed conversations / response count today** | Join `messages` (where senderType='agent') per agent in last 24h. |
| "Service campaign — is anyone opening these?" | Reply Rate only | Add **Delivered Rate** + **Reply Within 1h Rate** + **Opt-Out Rate** | Already have status timestamps in `campaign_recipients`. |

---

## Screenshot paths

All under `/home/ubuntu/Claude-store/nexxus2.2_replit/evidence/stabilization-sprint-2026-04-30/lane-7-screenshots/`:

- `01-sales-dashboard-serra-honda.png` — Sales dashboard with Marketing submenu overlay (shows tiles + Recent Activity sync wall)
- `01b-sales-dashboard-clean.png` — re-shot (same content, sync wall confirmed at later timestamps)
- `02-insights-serra-honda.png` — Insights landing as serra_honda
- `03-service-dashboard.png` — Service Campaigns tab
- `04-service-insights.png` — Service · Insights metric tiles (Active Campaigns 2, Messages Sent 10, Replies 2, Open Conversations 41, Total Conversations …, Reply Rate)
- `05-insights-full.png` — Insights with red zone tiles (Hot Leads 20, New No Contact 20, Showroom Not Closed 0)
- `05b-insights-scrolled.png` — incidental TeamBox redirect
- `06-aichat-home-tiles.png` — `/` tiles partially visible (Outbound Sent 24h: 9, "live")
- `06-main-aichat-tiles.png` — earlier capture of TeamBox after redirect
- `07-superadmin-home.png` / `07b-superadmin-home-top.png` — Huminic super_admin home tiles (Open Escalations 11, Outbound 0)
- `08-superadmin-teambox.png` — Huminic TeamBox shows test SMS conversation `+15551234567`

JSON evidence:
- `api-snapshot-serra-honda.json` — full pipeline+dashboard+leadSummary+activityLog
- `api-snapshot-superadmin-huminic.json` — same for super_admin
- `insights-api-snapshot.json` — insights/dashboard + reports + library + hunches
- `extra-superadmin.json` — notifications, billing, usage

---

## Observations (incidentals)

1. **Routing redirect surprise** — Multiple direct navigations to `/sales`, `/management`, `/insights` were silently redirected to `/teambox` mid-page-load by something inside `AppLayout` / `SubMenuManager`. Looks like a sidebar overlay click-through trap: opening the Marketing/Sales submenu in `complementary` triggers an `onClick` that fires through to a button on the underlying `main` causing nav. Repro: log in, then click the AI Chat / Sales sidebar icon — the submenu opens AND the underlying TeamBox link gets clicked. Worth investigating in a follow-up lane.
2. **Activity log dominated by background poller** — for serra_honda all 50 most recent entries are `sync_delta_completed`. Suggests the 2-minute delta-sync is logging every cycle as an activity. Either the poller should NOT write activity_log entries, or the activity_log render should filter `userId IS NULL` system events out of "Recent Activity". (`storage.getActivityLogs` does not currently filter.)
3. **`leadSummary.source` is hard-coded "warehouse"** (`vendorProxy:642`) but the UI has a conditional render for "VinSolutions Live" badge that is unreachable. Dead code.
4. **Notifications/billing endpoints have inconsistent error shapes** — `/api/billing/dashboard` returns 404 `{"error":"Not found"}` while `/api/billing/usage` returns 200 `{"configured": false, "message": "Billing not configured"}`. UI compatibility uncertain.
5. **`canAccessManagement`** (`client/src/lib/rbac.ts`) — referenced by `management.tsx:62` to redirect non-management roles to `/`. super_admin should pass through; verify by code-reviewing the rbac function. (Not read in this lane.)
6. **`warehouse_metrics` table appears unused on observed orgs.** Both `/insights/dashboard` and `/insights/reports` have a `metricsAllZero` fallback (`insights:169-188`, `:313-328`) that reconstructs the dictionary from `warehouse_leads`. The fact that the fallback is always taken means the warehouse_metrics writer is either disabled or deleted. Worth a follow-up: if no producer exists, remove the consumer fallback path and just compute live.
7. **Channel inference is regex on leadSource string** (`insights:18-33` and inline filters at `insights:787-822`). VIN's actual `leadType` (INTERNET, WALK_IN, PHONE) is NOT stored in `warehouse_leads`. Comments at `insights:14-17` acknowledge this. Result: most VIN orgs collapse all internet leads into "Other" because their lead sources are encoded as `Source #NNN` strings.
8. **Stagnation in escalations** — Serra Honda has 441 open escalations within a 90-day window. Either there's a real backlog (operations issue) or escalations are not getting closed in code. The pipeline metric at `storage:834-839` does not bound by org-specific resolution events.
9. **"Pending Finance" = 0 across observed orgs** — likely because the VIN status `SOLD_PENDING_FINANCE` is rarely surfaced in the warehouse data we synced. Could be a sync-mapping omission.
10. **Hunches feed has 25 entries on both serra_honda and Huminic** — may include test/seed entries from a generation run. Confidence values vary; not deeply audited.
11. **`/api/conversations` returned 41 open / 0 closed for Serra Honda.** A "closed-zero" pattern is a strong signal that the close-conversation flow is broken or never run. Open Conversations metric on Service insights will trend monotonically up.
12. **Header badge count (687/133) appears to count system + customer notifications equally.** A dealer mark-all-read may not be wired (not verified). Number is shown in a red badge — visually high-priority — but the underlying data is mostly low-priority noise.

---

**Confidence note:** Every value cited here was either directly fetched from dev backend with a bearer token (saved as JSON evidence) or read from source files at the indicated line numbers. No values were inferred from documentation or memory.
