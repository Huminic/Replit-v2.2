# Sprint 1.2 — UI Truth Inventory (Serra Honda + Public Widget Routes)

**Date:** 2026-04-26
**Auditor identity:** `serra_honda@huminic.ai` (org_admin, Serra Honda only). Read-only login.
**Audit URL:** `https://dev.huminicdev.com` (PM2 nexxus-app on port 5000).
**Operator-approved scope:** Serra Honda authenticated app + public widget routes only. Global page/metric issues noted but not validated per-org.
**Tools:** Playwright MCP (`browser_navigate`, `browser_snapshot`, `browser_take_screenshot`, `browser_console_messages`, `browser_network_requests`, `browser_evaluate`).
**Mode:** READ-ONLY. No mutating actions, no test sends, no UI edits, no exploits beyond a single confirmation probe.

**Evidence subtree:**

- screenshots: `evidence/preflight-ui-truth-2026-04-26/screenshots/*.png`
- DOM snapshots: `evidence/preflight-ui-truth-2026-04-26/dom-snapshots/*.md`
- console + network logs: `evidence/preflight-ui-truth-2026-04-26/console-logs/*.log`
- DB probe (read-only widget identifiers): `evidence/preflight-ui-truth-2026-04-26/db-probes/serra-honda-widgets.json`

**Verdict legend (per Sprint 1.2 spec):** WORKING · BROKEN · MISLEADING · UNFINISHED · GATED · DEFERRED.

**Server build context (CRITICAL):** dev server uptime 9 days; last PM2 restart 2026-04-16 11:42 UTC. Commits `354aa33` (widget auto-launch) and the four other launch commits dated 2026-04-26 are NOT yet built/deployed. Live verification of those fixes is blocked until `npm run build && pm2 restart nexxus-app` is authorized. Findings tagged "CODE-LANDED-NOT-DEPLOYED" reflect this gap.

---

## 0. Public widget routes (no-auth)

### `/p/serra-honda` — Public landing page

| Field | Value |
|---|---|
| Verdict | **WORKING** |
| Evidence | `screenshots/p-serra-honda-default.png` · `dom-snapshots/p-serra-honda-default.md` |
| Network | one call to `GET /api/public/landing/serra-honda` → 200 |
| Console errors | none |
| Visible promises | "Let's schedule a VIP test drive" form (First Name / Last Name / Phone / Email / "What are you looking for?"). "Get in Touch" submit button. STOP-opt-out disclosure. Right side: "We are here for you 24/7" with rotating-ring image, "Start a Live Video Chat" link button. Bottom-right widget FAB. |
| Branding | Serra Honda name + logo; gunmetal-blue + white palette. |
| Notes | This is the launch-critical Serra Honda public page. Renders cleanly. |

### `/w/serra-honda` — Widget standalone landing (FAB only)

| Field | Value |
|---|---|
| Verdict | **WORKING** (FAB toggles menu correctly — manual click verified) |
| Evidence | DOM snapshot shows menu opens with: Web Chat / Instant Call Back / Contact Form / Two-Way Video |
| Notes | Identical render to `/p/serra-honda` plus the floating-action-button widget overlay. |

### `/w/serra-honda?mode=chat` — auto-launch chat (commit 354aa33)

| Field | Value |
|---|---|
| Verdict | **BROKEN — CODE-LANDED-NOT-DEPLOYED** |
| Evidence | `screenshots/w-serra-honda-mode-chat-NOT-AUTO-LAUNCHED.png` |
| Symptom | Page renders the default form-and-branding layout. The widget overlay container (`[data-testid="widget-container"]`) is **NOT** mounted (`hasContainer: false` via DOM probe). FAB icon is `lucide-message-square` (closed-state). User must click the FAB and choose Web Chat manually. |
| Root cause | The auto-launch handlers at `client/src/pages/widget-landing.tsx:131-142` (added in commit `354aa33`, dated 2026-04-26) are present in the source tree but the dev PM2 process has not been rebuilt + restarted since 2026-04-16. The deployed bundle does not contain the fix. |
| Recommendation | After Saturday checkpoint passes other gates, build + restart dev (operator-authorized). Re-test the four `?mode=` paths. |

### `/w/serra-honda?mode=voice|form|video`

| Field | Value |
|---|---|
| Verdict | **BROKEN — CODE-LANDED-NOT-DEPLOYED** for `?mode=voice` and `?mode=form` (same root cause as `?mode=chat`); `?mode=video` was wired prior to commit 354aa33 — DOM probe of `/w/serra-honda?mode=voice` confirmed same failure pattern (FAB closed, no overlay) |
| Notes | Cannot live-verify the four-mode auto-launch contract until deploy. |

### Serra Honda widget configurations (DB read-only)

`evidence/preflight-ui-truth-2026-04-26/db-probes/serra-honda-widgets.json` — 4 widgets:

| widget_code | Type | Status | Notes |
|---|---|---|---|
| `wgt_serra_honda_sales` | text | active | Sales chat. agentId `1e8607bb-…`. Allowed domains: serrahonda.com / www.serrahonda.com |
| `wgt_serra_video_assist` | video | active | Tavus persona `p9eb007721f4`. Audience: returning visitors. Desktop only. |
| `wgt_serra_service_voice` | voice | inactive | VAPI assistant `90a876c0-…`. Service domain. Inactive — not part of Monday launch. |
| `wgt_serra_marketing_unified` | unified | draft | Marketing/deals page. Draft — not part of Monday launch. |

---

## 1. Authenticated app — Serra Honda lens

### 1.1 `/login` — Authentication

| Field | Value |
|---|---|
| Verdict | **WORKING** for happy-path login. **MISLEADING** for deep-link / refresh. |
| Evidence | `screenshots/login-page.png`. Pattern verified across direct-URL navigations to `/teambox`, `/marketing`, `/settings?section=ai` — all bumped to login mid-bootstrap. |
| Symptom | Direct URL navigation OR page refresh on any authenticated route bumps the user back to `/login` even when the access-token cookie should be valid. After re-login, bouncing into the same target route works. **Re-occurs with each session** and significantly affects launch quality. |
| Likely root cause | `client/src/lib/tokenStore.ts` keeps the access token in-memory. On page refresh, `AuthContext` calls `/api/auth/refresh` to re-mint a token via the httpOnly cookie. The refresh call returns 400 in the captured network trace (`POST /api/auth/refresh => 400`). The 400 fail path immediately redirects to `/login`. |
| Console error | "Failed to load resource: server responded with status of 400 () @ /api/auth/refresh" on any deep-linked load. |
| Recommendation | Investigate refresh-cookie issuance + parsing. **Launch-critical for usability** — Cox emails will deep-link customers to `/p/<slug>?utm=…` with parameters; any agent who shares a `/teambox` deep link will look broken. |

### 1.2 `/` — AI Chat home

| Field | Value |
|---|---|
| Verdict | **WORKING** |
| Evidence | `screenshots/app-01-ai-chat-home.png` · `console-logs/app-01-ai-chat-home-console-errors.log` (single 400 on `/api/auth/refresh` only) · `console-logs/app-01-ai-chat-home-network.log` |
| Visible promises | Header: "Nexxus Connect™" / "Serra Honda" / 4 utility buttons + SHA avatar dropdown. Sidebar: AI Chat / TeamBox / Sales / Service / Insights / Marketing / System / Logout. AI Key Metrics tiles: Active Pipeline 197 (live), Appointments Today 0 (live), Open Escalations 419 (live), Outbound Sent 24h 0 (live). 4 suggestion chips. Chat input. |
| Notable | **Open Escalations = 419** — high count. I-264 was claimed CLOSED with a 90-day filter but the displayed count suggests the filter may not be applied or a real backlog exists. Worth drill-down. |
| AI response sanity probe | Asked "What dealership are you assisting?" — response: "I'm assisting **Serra Honda**." Streaming completed; no vanishing message (I-277 fix appears effective). |

### 1.3 `/teambox` — TeamBox conversations workbench

| Field | Value |
|---|---|
| Verdict | **WORKING** with several **MISLEADING** sub-issues |
| Evidence | `screenshots/app-02-teambox-conversations.png` |
| Visible promises | Sub-tabs: Conversations / Phone / Video. Channel filters: All/SMS/Email/Web Chat/WhatsApp/Voice. Status filters: All 60 / Open 59 / Assigned to me / Participating 1 / Automated / Scheduled / Followup / Pending. Search box. 60 conversations listed with avatar/name/age-days/agent-assigned/unread-count. Right pane: customer info + Push to VIN button + "No messages yet" + reply textbox + Quick Actions (Call/Email/SMS). |
| Channel pre-rail | "SMS 22 / Email 3 / Phone 16 / Video [n/a]" — duplicates the channel filter row. UX redundancy. |
| Misleading patterns | (a) **10+ conversations named "Test Customer" with 0 messages** dominate the list — orphan ai-chat conversations from prior testing (per I-202 closed, but data hygiene wasn't completed). Real users will see this clutter. (b) The "TC Test Customer" entries have no age display — atypical vs other rows that show "5 days" / "11 days" / etc. (c) One conversation labeled `+1125352571` (clearly invalid US number, missing area-code digit) — sync data hygiene issue. (d) One conversation `+18338096836` shows "13 days · 28 unread" — large unread count probably indicates a dead lead loop. |
| I-255 (No "Return to AI" button) | **CONFIRMED OPEN** — no Return-to-AI button visible on selected conversation right pane. The "Assign to" combobox shows "Unassigned" — the only way to revert from human takeover is to manually re-select Unassigned (non-obvious). |
| Push to VIN button | Always enabled regardless of conversation state. On a "Test Customer / 0 messages" thread the button is still active — questionable UX. |
| Quick Actions Call/Email/SMS | Mutating buttons exposed in customer info panel — must NOT be clicked during read-only audit. |
| Recommendation | Pre-launch data cleanup: delete orphan ai-chat "Test Customer" conversations. Add Return-to-AI button. Disable Push to VIN when conversation has no messages or no real customer phone. |

### 1.4 `/sales` — Sales

| Field | Value |
|---|---|
| Verdict | **WORKING** with **MISLEADING** delta math |
| Evidence | `screenshots/app-03-sales-dashboard.png` |
| Sub-tabs | Dashboard / Agents / Insights / Calendar |
| KPIs | Total Leads (30d) **609** +50% · New Leads **55** **+588%** · Active Pipeline **197** +120% · Waiting on Response **145** 0% · Appointments Set **0** 0% · Sold **5** -67% · Conversion Rate **71.4%** 0% |
| Misleading | "+588%" on New Leads is a divide-by-very-small-base artifact. Either suppress percent when prior < 10 or display "+x leads" in absolute. |
| Recent Activity feed | Endless "Sync Delta Completed" entries — generic, no actionable context. |
| Top Performing Agents | Sales Coach (chat), Communication Writer (chat), Data Guru (chat), Caroline (voice). |
| Cross-page consistency | "Active Pipeline" 197 here vs 306 on Insights "Pipeline Active" tile vs 609 on Insights "Pipeline Health · Active Pipeline". Three different values, same label. **Launch-critical** — see workflow doc W9. |

### 1.5 `/service` — Service (LAUNCH-CRITICAL for Serra Honda)

| Field | Value |
|---|---|
| Verdict | **WORKING** with **BROKEN** bulk Upload CSV |
| Evidence | `screenshots/app-04-service-campaigns.png` |
| Sub-tabs | Campaigns / Agents / Insights / Calendar |
| Header actions | "CSV Template" link → `/campaign-template.csv` (good — addresses I-193 partially). "Upload CSV" button (top-level). "New Campaign" button. |
| **I-270 CONFIRMED OPEN** | Top-level "Upload CSV" button at `client/src/pages/service.tsx:365` sets `csvUploadCampaignId = 'bulk'`; csvUploadMutation at line 186 sends to `/api/campaigns/${campaignId}/upload-csv` resolving to `/api/campaigns/bulk/upload-csv` — this endpoint does not exist. Did NOT click in audit (would 404). Source-grep verified. |
| Campaigns table | 8 campaigns visible. Highlights: "Launch Day Service Test" — completed, 5/5 sent, 5 replied (this IS the launch testing!). "Service Reminder - February" — active, 16 recipients, 0 sent / 0 replied (suspicious — active but never fired?). "Oil Change Reminder" — paused, 234 recipients, kill switch ENGAGED. "Wave-PE3 Verification Campaign" — completed, 1/1, 1 reply. |
| Misleading | Two duplicate "S-4 Test Campaign" rows. "Service Reminder - February" status=active but 0 sent — either it never started or it's stuck. |
| Per-row actions | 4 small buttons (apparent: play/schedule/eye/upload). Some are disabled on draft-status rows. |
| Agents listed | Nancy Gaston (assigned 11), Service Agent. |
| Recommendation | Fix or hide top-level Upload CSV button BEFORE Monday. Investigate "Service Reminder - February" stuck-active state. Clean up duplicate "S-4 Test Campaign". |

### 1.6 `/insights` — Insights (Dashboard / Reports / Library / Hunches / Activity)

#### 1.6a Dashboard tab

| Field | Value |
|---|---|
| Verdict | **MISLEADING** |
| Evidence | `screenshots/app-05-insights-dashboard.png` |
| Sections | Immediate Action Required (Hot Leads Going Cold 20 / New Leads Without Contact 20 / Showroom Visitors Not Closed 0). Watch List (Stale Leads >7 days 447 avg 14 days; Pending Finance 0). Today's Performance (Pipeline Active 306 / Conversion Rate 71.4% / Total Leads 609). Pipeline Health (Active Pipeline 609 / Freshness Score "Stale" 27% under 7 days / Hot Leads 306 50% of active / Month-End Forecast 5, "-45 vs target (50)"). Performance Scorecard (Win Rate 71.4% / Total Sold 5 / Active Leads 306 / Total Leads 609). Two charts (Leads This Week, Conversions by Day). |
| Inconsistencies | "Active Pipeline" 197 (Sales) vs 306 (Insights·Today's Performance) vs 609 (Insights·Pipeline Health). "Hot Leads" 306 (Pipeline Health) but the "Hot Leads Going Cold" tile shows 20 — semantic confusion. Three different "Pipeline" definitions on one page. |
| I-265 CONFIRMED DEFERRED | "Month-End Forecast 5 / -45 vs target (50)" — the hardcoded target=50 is visible. |
| I-264 status uncertain | Open Escalations 419 (home) and Stale Leads 447 (Watch List) are very high. Either real backlog or filter not applied. |

#### 1.6b Library tab

| Field | Value |
|---|---|
| Verdict | **MIXED** — some metrics WORKING, several MISLEADING/BROKEN, three labeled "Data source not connected" |
| Evidence | `screenshots/app-05-insights-library.png` |
| Categories | Pipeline · Conversion · Response · Lead Source · Channel · Composite · Forecast |
| **I-260 CONFIRMED OPEN** | "Avg Time to 1st Contact" — value `—` with subtitle "Data source not connected". Tile is shown but value is hardcoded to dash. |
| **I-279 CONFIRMED OPEN** | "Top Source: VIN Source #7098 (18%)" — raw VIN source ID instead of human-readable name. Ford of Columbia, Hyundai of Columbia, Serra Honda all impacted per session.md. |
| **I-261 CONFIRMED DEFERRED** | "Walk-In Traffic 0", "Phone Inquiries 0", "Referral Leads 0" — channel metrics near-zero because URL-format leadSources don't match string patterns. |
| Conversion·"Overall Win Rate" 0.8% | Confusingly co-exists with "Conversion Rate 71.4%" elsewhere. Different denominators (one is `sold/totalLeads`, the other is per I-258 fix `sold/(sold+lost)`). Two metrics with similar names but very different scales. |
| Conversion·"Service-to-Sales" `—` | "Data source not connected" — known. |
| Response·"Engagement Transition" `—` | I-267 DEFERRED — placeholder shown. |
| Pipeline·"Pipeline Stagnation Index 212 (+212)" | Suspicious "+212" — same-as-value delta is a divide-by-zero / no-prior-value rendering bug. |

#### 1.6c Reports tab

| Field | Value |
|---|---|
| Verdict | **MISLEADING** because of I-279 |
| Evidence | `screenshots/app-05-insights-reports.png` |
| Sub-tabs | Loss & Quality (Deal Death Autopsy / Re-Engagement / Source Quality Trends) · Channel Intelligence · Trend & Forecast · Export |
| **I-279 IMPACT** | "Loss Patterns by Source" table — every row is `VIN Source #<id>` (e.g., "VIN Source #3750035 / 28 / Status Change / 17% / 80"). Unreadable for a non-engineer. Same fallback as Library "Top Source". |
| Loss Reason Breakdown | Single-bar chart "Lost" extends to ~240. Bad Lead Breakdown chart visible. |
| Recommendation | Cannot ship reports to dealership leadership with `VIN Source #N` labels. Either resolve source IDs in sync (I-276 fix) OR hide the Reports tab until resolved. |

#### 1.6d Hunches / Activity tabs

| Field | Value |
|---|---|
| Status | **NOT WALKED** during this audit pass — out of scope per parent's "do not over-deepen Insights" implicit guidance. Both tabs need a separate pass post-launch. |

### 1.7 `/marketing` — Marketing

| Field | Value |
|---|---|
| Verdict | **GATED / DEFERRED** per `decisions.md` 2026-04-24 ("Marketing agent module deferred to v2.3") |
| Evidence | `screenshots/app-06-marketing-dashboard.png` |
| Sub-tabs | Dashboard / Agents / Studio / Insights |
| KPIs | Campaign Performance 0% / Campaigns Active 0 / Messages Sent 1 / Replies Received 0 — near-zero, real (no active marketing campaigns) |
| Agents | Photo Studio (I-102 NEEDS LIVE TEST), Video Producer, Copywriter, Creative Director, Market Intel — these are the v2.3-deferred surfaces |
| Recommendation | For Monday launch, hide or add "Coming in v2.3" banner. Prevents customer confusion. |

### 1.8 `/settings/system` — System Settings (org_admin scope)

| Field | Value |
|---|---|
| Verdict | **WORKING** for tile gating; **MISLEADING** for user list scope; **OPEN-SECURITY** for role dropdown |
| Evidence | `screenshots/app-07-system-settings.png` · `screenshots/app-08-add-user-role-dropdown-I-246.png` |
| Tiles visible | User Management · Organization · Tools & Integrations · Knowledge Base · Notifications · Appearance |
| **No Billing tile** | Correct (org_admin gated). |
| **No AI Configuration tile** | Correct in UI, but I-245 (URL-bypass) verified OPEN by source review of `server/routes/settings.ts` (PATCH still uses `requireRole(3)` for AI fields). Live API probe was blocked by token-bootstrap (page refresh kills session) — see W9 caveat. |
| **I-246 CONFIRMED OPEN** | Add User dialog → Role combobox shows: Super Admin / Partner Admin / Organization Admin / Executive / Sales Manager / Sales / Service / Marketing. **All 8 options visible to a Serra Honda org_admin.** Privilege escalation surface. |
| User list scope leak | Serra Honda org_admin sees Marcus Webb (`partner@nexxus.com`, Partner Admin), Jessica Zachery (`@misscommunicationconsulting.com`), Victoria Whitley (`@misscommunicationconsulting.com`), Don Wood (`@serrahonda.net`), Test Weaver (`@gmail.com`). These are users not in Serra Honda's org. Either intentional (multi-store admins via additionalOrgIds) or a leak. **Check `GET /api/users?orgId=…` scope rules.** |
| Avatar dropdown (single-store check) | SHA dropdown shows: Profile / Preferences / Reset Tour / Log out — no org-switcher. Correct for single-store admin (commit `354aa33` own-org branch verified live). |

### 1.9 Other authenticated routes — NOT WALKED

| Route | Reason |
|---|---|
| `/agents` | Per decisions.md, marketing-agent surface deferred. Photo Studio (I-102) NEEDS LIVE TEST is post-launch. |
| `/management` | RBAC-gated for super_admin only — out of org_admin's scope. |
| `/settings/billing` | FlexPrice dead per I-105 BACKLOGGED, Lago not wired (I-278 POST-LAUNCH). Tile gated. |
| `/insights/hunches` and `/insights/activity` | Out of scope this pass. |
| `/forgot-password` / `/reset-password` | I-140, I-165 NEEDS LIVE TEST — operator-confirmed scope for live email send. Not in this read-only pass. |

---

## 2. Cross-cutting findings

### 2.1 Deep-link auth bootstrap failure (NEW — not in issues.md)

| | |
|---|---|
| Severity | LAUNCH-CRITICAL — affects every dealership user who clicks a shared deep link or refreshes a page mid-session. |
| Symptom | `GET /api/auth/refresh` returns 400 on direct-URL or refresh navigation; AuthContext redirects to `/login`. |
| Mitigations until fixed | Tell users to always start at the home page and use sidebar nav (which happens to bypass the bug). |
| Recommendation | Add to fix list — investigate cookie issuance + refresh-token flow before Monday. |

### 2.2 Cross-page metric inconsistency (NEW — affects launch quality)

| Metric | Sales | Insights·Today | Insights·Pipeline Health | Insights·Library |
|---|---|---|---|---|
| Active Pipeline | 197 | 306 (Pipeline Active) | 609 | 306 (Total Active Pipeline) |
| Hot Leads | — | — | 306 | — |
| Conversion / Win Rate | 71.4% | 71.4% | — | 0.8% (Overall Win Rate) |
| Total Leads | 609 (30d) | 609 | — | — |

Three different "Active Pipeline" values on three pages, same label. Sprint 3.1/3.2 (metrics revision) is in plan.md and this is the strongest evidence for prioritizing it.

### 2.3 User list cross-org leak (NEW — security)

org_admin Serra Honda sees users with non-Serra-Honda emails (`@misscommunicationconsulting.com`, `@gmail.com`, `partner@nexxus.com`). Needs investigation: is `GET /api/users` correctly scoped to caller's org or does it return cross-org? Could be by design (additionalOrgIds membership) or could be a leak.

### 2.4 Conversation list pollution (NEW — data hygiene)

10+ "Test Customer / 0 messages" rows dominate the TeamBox list. Real conversations are pushed below the fold. Pre-launch DB clean recommended.

### 2.5 Code-landed-not-deployed gap

Five commits dated 2026-04-26 (this session: `73c7088`, `1b656ed`, `2c2c5b3`, `354aa33`, `53ba562`, `7721fb7`, `d957993`, `4b54a45`) are in local history but the dev PM2 process has not been rebuilt since 2026-04-16. Live-verification of the widget auto-launch fix and the multi-store org_admin fix is blocked. Operator-authorized `npm run build && pm2 restart nexxus-app` is required before Saturday checkpoint.

---

## 3. Issue cross-reference (parent's launch-critical list)

| ID | Live status (this audit) | Notes |
|---|---|---|
| I-240 (VIN lead create failing) | **NOT VERIFIED LIVE** — would require triggering an inbound call. Out of read-only scope. Source-only review: webhook escalation path still exists. |
| I-244 (IDOR `/api/vin/leads/summary`) | **CONFIRMED OPEN** by source: `server/vendorProxy.ts:555` reads `req.query.orgId \|\| req.user.organizationId` with no role-based check. |
| I-245 (AI prompt URL-bypass) | **CONFIRMED OPEN** by source: PATCH `/api/settings/org` still `requireRole(3)`. Live UI probe blocked by token-refresh bug. |
| I-246 (Role dropdown 8-roles to org_admin) | **CONFIRMED OPEN, LIVE EVIDENCE** — `screenshots/app-08-add-user-role-dropdown-I-246.png`. |
| I-249 (Self-deactivation) | **NOT VERIFIED LIVE** — would require opening own user-edit dialog. Edit pencil icon visible on own row but did not click (mutation risk). Source review pending. |
| I-250 (CommGate silent drop) | **NOT VERIFIED LIVE** — would require flipping CommGate flag. Source review pending. |
| I-252 (Widget chat unbounded history) | **NOT VERIFIED LIVE** — would require long widget conversation; auto-launch is broken anyway. Source review pending. |
| I-253 (JSON.parse unguarded) | **NOT VERIFIED LIVE** — would require malformed Claude output. Source review pending. |
| I-254 (AI race after takeover) | **NOT VERIFIED LIVE** — would require timing-precise SMS test. Source review pending. |
| I-255 (No "Return to AI" button) | **CONFIRMED OPEN, LIVE EVIDENCE** — TeamBox right pane has Assignment combobox only; no Return-to-AI button. |
| I-260 (lib-21 `—` hardcoded) | **CONFIRMED OPEN, LIVE EVIDENCE** — `screenshots/app-05-insights-library.png`: "Avg Time to 1st Contact `—`". |
| I-269 (`{{dealershipName}}` literal) | **CONFIRMED OPEN, by source** — `server/routes/chat.ts:161` injects `agent.instructions` verbatim with no substitution; `agent-instructions.json` contains `{{dealershipName}}` literals in 5+ agents. Live AI probe didn't surface the literal because the higher-level systemPrompt (line 233) substitutes `${orgName}` correctly. The bug surfaces in agent-drafted templates (e.g., "draft a customer email"). |
| I-270 (Bulk CSV 404) | **CONFIRMED OPEN, by source** — `client/src/pages/service.tsx:365`. Did not click. |
| I-279 (lead-source resolution subset) | **CONFIRMED OPEN, LIVE EVIDENCE** — `screenshots/app-05-insights-library.png` Top Source = "VIN Source #7098 (18%)". `screenshots/app-05-insights-reports.png` Loss Patterns table — every row is `VIN Source #<id>`. |

---

## 4. Recommendation summary (input to Sprint 1.7 fix list — Task #4)

### Must-fix before Monday Apr 27 09:00 ET

1. **Deep-link auth bootstrap** (`/api/auth/refresh` 400) — affects every shared link. Critical UX.
2. **Build + deploy 2026-04-26 commits to dev** — widget auto-launch fix, multi-store org_admin fix, test-lane guards, weeklyReport guard, unit tests.
3. **I-246 role dropdown** — privilege escalation. Filter UI to caller's level + below; server-side enforcement.
4. **I-244 IDOR `/api/vin/leads/summary`** — block cross-org orgId param for roleLevel > 2.
5. **I-247 slug overwrite** — omit slug from updateOrganizationSchema.
6. **I-270 bulk CSV 404** — either implement endpoint or hide the top-level button (require campaign selection).

### Strong-fix before Monday

7. Conversation-list cleanup (delete "Test Customer / 0 messages" orphans) — TeamBox first-impression quality.
8. Cross-page metric labeling — at minimum, show identical "Active Pipeline" value on Sales and Insights or rename to make difference explicit (14d vs 30d window).
9. Hide or banner-gate Marketing module ("Coming in v2.3").
10. I-269 — implement substituteTemplate({{dealershipName}}) in chat.ts to prevent literal placeholder leak in drafted templates.

### Strong-fix Saturday or post-launch

11. I-260 — compute `Avg Time to 1st Contact` from `vinCreatedAt` + first conversation message OR hide the tile.
12. I-279 / I-276 — resolve VIN source IDs in sync; until then hide the Library "Top Source" tile and the Reports "Loss Patterns by Source" table.
13. User-list cross-org leak audit — verify scope rules in `GET /api/users`.
14. I-265 — per-org monthlyTarget with sensible default (50 OK as default but should be operator-configurable).

### Defer post-launch (per plan.md)

15. I-252, I-253, I-254, I-255 — important but not Monday-critical (agent UX edges).
16. I-258, I-259, I-262, I-263, I-264, I-266, I-267, I-268 — already CLOSED in LAUNCH-RECON-01 commit; verify post-deploy.
17. Photo Studio / I-102.

---

**Audit complete.** Sprint 1.2 deliverable. Hand-off to Sprint 1.3 below and Task #4 fix-list checkpoint.
