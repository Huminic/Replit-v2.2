# Marketing Insights findings — 2026-05-01

## Scope of investigation

Determine why the Marketing Insights tab (`/marketing?tab=insights`) renders Sales-pipeline insights instead of marketing-scoped data. Distinguish backend filtering defects (in scope for v2.2 — Batch 1 or Batch 3 placement) from UI redesign requests (out of scope, deferred to v2.3). Confirm the hide-or-disable posture for the marketing-campaign UI gap per Decision Matrix D-G1. Investigation is read-only against `client/src/pages/{insights,marketing}.tsx`, `client/src/lib/marketing-agents.ts`, `server/routes/insights.ts`, `client/src/components/layout/SubMenuManager.tsx`, plus the prior Lane 6 evidence and PR #6 commit message. No code edits, no DB writes.

## TL;DR

1. **The bug is CLIENT-SIDE — Batch 3 placement.** The `roleCategoryMap` at `client/src/pages/insights.tsx:399-413` is a per-role allow-list of metric categories (e.g. `marketing → ['Lead Source', 'Channel', 'Composite', 'Forecast']`). Its only consumer is the **Library tab** (`:1374, :1414, :1416, :1418, :1424`). It is NEVER applied to the Dashboard / Reports / Hunches / Activity tabs. The Dashboard tab (which shows the visible "Sales pipeline" mixing) is computed from a single `/api/insights/dashboard` payload that is the same for every role.
2. **In embedded mode the filter is no different from non-embedded mode.** `embedded` is a single boolean prop on `InsightsPage` whose only effect is layout chrome (suppressing the page header and moving the store-selector). It does NOT pass any role/department/category context into the data layer. There is no `<InsightsPage embedded mode="marketing" />` surface today.
3. **The role-category filter does not propagate because there is no propagation surface.** The "filter" never existed at the Dashboard level in the first place — it is a Library-only construct. The bug is one of **missing scope**, not **broken propagation**.
4. **`I-NEW-2026-05-01-F` (`/marketing?tab=agents` redirect) and `I-NEW-2026-05-01-A` (general routing trap) share a root cause** — both were the AppProvider role-hydration race. Both were patched by `0e674a5` ("hold AppProvider until role hydrates"), shipped as PR #6, merged 2026-04-30 14:00 UTC. The PR #6 commit message explicitly verifies `/marketing?tab=agents` holds ≥30s stable post-patch for super_admin. F is therefore likely already resolved as a side-effect of A's fix; needs Playwright re-verification in Batch 3.
5. **Marketing-Insights minimal fix shape (Batch 3):** introduce a single `scope` prop on `InsightsPage` (`scope?: 'sales' | 'marketing' | 'service'`) that is passed by `marketing.tsx:220` (`<InsightsPage embedded scope="marketing" />`). The Dashboard tab branches on `scope === 'marketing'` to render the four marketing-allowed categories (`Lead Source`, `Channel`, `Composite`, `Forecast`) drawn from the SAME library-metrics payload the Library tab already uses. This is one prop + one conditional render block — no redesign, no new endpoint, no schema change.
6. **Marketing-campaign UI gap → confirm D-G1 default (b) hide-or-disable.** The v2.3-preview banner ALREADY exists at `marketing.tsx:224-241` and renders unconditionally above all four tabs (Dashboard / Agents / Studio / Insights). The banner is asserted by `tests/e2e/s99-codex-launch-readiness-readonly.spec.ts`. **No additional banner work is required — it is already extended consistently across all four tabs by virtue of its placement above the tab body.** The smallest patch is therefore zero — the banner already covers Studio + Insights + Agents per its current placement.

## Findings

### Finding 1 — `roleCategoryMap` is a Library-tab construct, not a page-wide filter

- **What:** The role-category filter is constructed at `client/src/pages/insights.tsx:399-413`. It is a static map of role-name → allowed-category-array, where categories are taxonomic strings (`Pipeline`, `Conversion`, `Response`, `Lead Source`, `Channel`, `Composite`, `Forecast`). The `marketing` role is allowed `['Lead Source', 'Channel', 'Composite', 'Forecast']`.
- **Where (construction):** `client/src/pages/insights.tsx:399-413`.
  ```ts
  const roleCategoryMap: Record<string, string[] | null> = {
    super_admin: null, partner_admin: null, org_admin: null, executive: null,
    sales_manager: ['Pipeline', 'Conversion', 'Response', 'Lead Source', 'Forecast'],
    sales:         ['Pipeline', 'Conversion', 'Response', 'Lead Source', 'Forecast'],
    service:       ['Pipeline', 'Response', 'Channel'],
    marketing:     ['Lead Source', 'Channel', 'Composite', 'Forecast'],
  };
  const allowedCategories = currentRole ? roleCategoryMap[currentRole] ?? null : null;
  const roleFilteredMetrics = allowedCategories
    ? libraryMetrics.filter(m => allowedCategories.includes(m.category))
    : libraryMetrics;
  ```
- **Where (consumers):** `grep -n` shows only five sites in the entire file:
  - `:415` — `categories = ['all', ...new Set(roleFilteredMetrics.map(m => m.category))]` (Library filter pills)
  - `:416` — `filteredLibrary` derived from `roleFilteredMetrics`
  - `:462` — Library CSV export
  - `:1374` — Library "Filtered for {role}" badge
  - `:1414, :1418, :1424` — Library empty-state branches and grid render
- **Why it matters:** The Dashboard tab body (`renderDashboard`, `:501-1060+`) reads from `dashboardData` (a separate `/api/insights/dashboard` query) and is **never touched by `roleCategoryMap`**. Same for `renderReports`, `renderHunches`, `renderActivity`. A marketing-role user sees the **identical Dashboard** that a sales-role user sees: red-zone "Hot Leads Going Cold", "New Leads Without Contact", "Showroom Visitors Not Closed"; yellow-zone "Stale Leads", "Pending Finance"; performance scorecard with "Win Rate / Total Sold / Active Pipeline / Total Leads"; "Pipeline Health" tile; "Top Lead Sources" with positional A+/A/B/C grades. None of these is marketing-scoped.
- **Likely fix shape:** Add a `scope` prop to `InsightsPage` and branch the Dashboard render to a marketing-only view that reuses the library-metrics endpoint (which IS category-tagged) for the marketing-allowed categories.
- **Effort:** S to introduce the prop + a slim marketing Dashboard. M if reusing existing tile components verbatim with marketing data.
- **Risk if shipped wrong:** Low. The current Dashboard for marketing role is already a misrepresentation; replacing it with marketing-scoped tiles or a "Marketing analytics ship in v2.3" placeholder cannot be worse.

### Finding 2 — Embedded mode is a layout-only flag, not a data-scope flag

- **What:** `InsightsPage` accepts a single boolean prop `embedded` (default `false`). Marketing.tsx mounts it as `<InsightsPage embedded />` at `client/src/pages/marketing.tsx:220`. The prop's only effect (verified by grep) is two render-time branches:
  - `:1548` — `{!embedded && (<>...page header + mobile dropdown...</>)}` — suppresses the standalone Insights page chrome
  - `:1583` — `{embedded && storeSelector}` — moves the store-selector into the tab bar
- **Where:** `client/src/pages/insights.tsx:126`, `:1548`, `:1583`. `client/src/pages/marketing.tsx:219-221`.
- **Why it matters:** The marketing-tab "embedded mode" carries no department / role / scope / category signal at all. The data shape is identical to the standalone `/insights` page. Marketing.tsx hands the role through `useApp()` like every other component, but `useApp().currentRole` is the user's authentication role (e.g. `org_admin`), not "we are inside the marketing surface." For an `org_admin` user (the only role visible at launch — Serra Honda), `roleCategoryMap['org_admin']` is `null`, so even the Library filter does nothing — every metric category is shown.
- **Cited prop / context surface that fails to propagate:** None exists. The bug is "no surface", not "broken surface." The minimal fix surface to introduce is a `scope?: 'sales' | 'marketing' | 'service'` prop on `InsightsPage`, defaulting to `undefined` (no filtering), set to `'marketing'` in `marketing.tsx:220`.
- **Likely fix shape:** Add `scope` prop, plumb to a Dashboard-render conditional that draws marketing tiles instead of the sales red/yellow/green/forecast tiles when `scope === 'marketing'`. Reports / Library / Hunches / Activity tabs default to the existing role-based filtering.
- **Effort:** S for the prop + conditional. The marketing Dashboard body itself can be ~50 lines reusing the existing tile component vocabulary.
- **Risk if shipped wrong:** Low (UI-only).

### Finding 3 — User-visible mixing — exact cards and charts that render sales data inside Marketing → Insights

- **What:** Per Lane-6 screenshot `marketing-insights-tab.png` (Observation 10) and direct read of `renderDashboard` body in `insights.tsx`, the following sales-pipeline cards render in the Marketing → Insights tab today:
  1. **Red Zone — Immediate Action Required** (`insights.tsx:521-577`): "Hot Leads Going Cold", "New Leads Without Contact", "Showroom Visitors Not Closed". Source: `dashboardData.redZone.*` from `/api/insights/dashboard` (`server/routes/insights.ts:63-106`). Sales-pipeline rows.
  2. **Yellow Zone — Watch List** (`insights.tsx:580-619`): "Stale Leads (>7 days)", "Pending Finance". Sales aging tiles.
  3. **Green Zone — Today's Performance** (`insights.tsx:622-644`): renders `dashboardData.greenZone[]`. Per `server/routes/insights.ts` the array is sales-pipeline KPIs.
  4. **Pipeline Health** (`insights.tsx:646-690`): "Total Active Pipeline (30d)", "Freshness Score", "Hot Leads", "Month-End Forecast vs target". 100% sales-pipeline.
  5. **Performance Scorecard** (`insights.tsx:692-700+`): "Win Rate / Total Sold / Active Pipeline (30d) / Total Leads". 100% sales-pipeline.
  6. **Lead-volume / conversion charts** (`insights.tsx:268-274`): `apiDailyTrend` with `d.leads`, `d.conversions`. Sales pipeline trend.
  7. **Top Lead Sources** (`insights.tsx:276` + `server/routes/insights.ts:125-141`): the 8 highest-volume `lead_source` URLs ranked by VOLUME (positional A+/A/B/C — KD-2 / I-NEW-2026-05-01-E). Source-mix data, sales-grade. *(Note: this tile is marginally relevant to a marketing scope but renders with the sales A+/A/B/C labeling, which is a separate honesty defect handled by Dispatch 3 / Group F.)*
  8. **Channel Performance** (`server/routes/insights.ts:143-163`): `Phone / Walk-In / Website / Other` derived from `lead_source` URL patterns. Sales-attribution, not marketing-attribution (no campaign-source / UTM / paid-vs-organic split).
  9. **Reports tab embedded inside Marketing→Insights** (`insights.tsx:renderReports`): loss analysis, channel performance, source quality, trend reports — all sales-pipeline grain.
  10. **Hunches tab** (`insights.tsx:renderHunches`): the `hunches` table DOES support `department='marketing'` (per `server/services/hunchService.ts:60`, Lane 6 finding), but the Insights Hunches tab does not filter by department; all hunches surface to all users.
- **Where:** `client/src/pages/insights.tsx:501-1340` for the Dashboard + Reports + Library + Hunches + Activity render bodies.
- **Why it matters:** Marketing-role users (and demos with super_admin clicking through `/marketing?tab=insights`) see the full sales-pipeline funnel as if it were marketing data. There is no marketing-attribution surface (campaign performance, message-to-reply rate, campaign ROI, lead-source-by-campaign, opt-out rate, deliverability) anywhere on the Marketing → Insights tab. This is consistent with Lane 6's Observation 10 ("`marketing-insights-tab.png` shows Sales-pipeline metrics 'New Leads: 38, Active Pipeline: 187, Sold: 6'").
- **Likely fix shape:** Per Finding 2, a `scope='marketing'` Dashboard branch renders only the four marketing-allowed library categories (Lead Source / Channel / Composite / Forecast) as tiles. Reports + Hunches default to a placeholder ("Marketing reports and hunches ship in v2.3 — see Marketing → Dashboard for current campaign metrics") OR continue to render unfiltered with the existing v2.3-preview banner above (already in place at `marketing.tsx:224`).
- **Effort:** S–M.
- **Risk if shipped wrong:** Low (UI-only).

### Finding 4 — URL paths exhibiting the symptom

- **What:** Two URL surfaces exhibit "Sales pipeline rendering inside Marketing":
  - `/marketing` (default tab, route `marketing` from `marketing.tsx:55-79`) — does NOT exhibit (renders Marketing Dashboard tiles `mm-1..mm-4`, sourced from `metrics.campaignStats.byDepartment.marketing`).
  - `/marketing?tab=studio` — does NOT exhibit (renders `StudioGallery`).
  - `/marketing?tab=insights` — **EXHIBITS** the symptom. Mounts `<InsightsPage embedded />`. This is KD-4 / I-NEW-2026-05-01-G.
  - `/marketing?tab=agents&agent=<id>` — separate concern. Renders `AgentChatView`. Was suspected to redirect under I-NEW-2026-05-01-F but PR #6's `0e674a5` patch verified the route holds stable for super_admin (see Finding 5). Marketing-role users may still need verification.
- **Where:** `client/src/pages/marketing.tsx:67-79` (URL-tab-restoration effect), `:219-221` (insights tab body), `:244-250` (agent body).
- **Why it matters:** Distinguishes which URL-bound bugs are still open vs which are closed. Current state: tab=insights symptom is open; tab=agents redirect is likely already closed by PR #6.
- **Likely fix shape:** Apply the `scope='marketing'` prop in marketing.tsx:220.
- **Effort:** S.
- **Risk:** Low.

### Finding 5 — I-NEW-2026-05-01-F (tab=agents redirect) shares a root cause with -A; likely closed by PR #6

- **What:** `I-NEW-2026-05-01-F` is "Marketing tab navigation broken; `/marketing?tab=agents` redirects (`marketing.tsx:67-79`)" per `evidence/stabilization-sprint-2026-04-30/overnight-validation-report.md:141`. `I-NEW-2026-05-01-A` is the general "Routing redirect trap on top-level routes" closed 2026-05-01 by PR #6 (`0e674a5` "fix(routing): hold AppProvider until role hydrates"). The PR #6 commit message at `git show 0e674a5` explicitly states: *"super_admin: all 6 routes (/teambox, /sales, /insights, /marketing, /management, /marketing?tab=agents) hold >=30s stable post-patch."* `/marketing?tab=agents` is one of the verified six routes.
- **Where:** PR #6 (`0e674a5`) at `client/src/contexts/AppContext.tsx`. `marketing.tsx:67-79` is the URL→tab effect, NOT the redirect site. Lane 6's Observation 13 attributed redirects to "interaction between SubMenuManager and the URL→tab effect", but PR #6's investigation found the actual cause: AppProvider seeded `currentRole='org_admin'` before `authUser` hydrated, so `management.tsx`'s RBAC effect fired with the wrong role and redirected. The `marketing.tsx` URL→tab effect was always benign.
- **Why it matters:** F's symptom (tab=agents redirect) and A's symptom (top-level route redirect) had the same root cause. Closing A almost certainly closed F. Confirmation requires a Batch-3 Playwright walk on `/marketing?tab=agents` for both `super_admin` and `org_admin` (Serra Honda). If the walk shows the route stable for ≥30s and the Agents body renders, F is closable.
- **Likely fix shape:** No new code — only a Playwright re-walk to close F. If the redirect re-surfaces for some role, it would be a separate sub-cause (e.g. SubMenuManager click-through hypothesis from Lane 6 Observation 2; PR #6 explicitly noted "operator's overlay-click hypothesis did NOT reproduce in headless; SubMenuManager remains a candidate for follow-up if ever re-reported with a fresh repro").
- **Effort:** S (one Playwright spec / browser walk).
- **Risk if shipped wrong:** Low — verification only.

### Finding 6 — Bug location: client-side. Batch placement: Batch 3

- **What:** Per Findings 1–3, the role-category filter is constructed and consumed entirely client-side. The server endpoints (`/api/insights/dashboard`, `/api/insights/library`, `/api/insights/reports`) accept no role / department / scope query parameter and return identical payloads regardless of caller role. The server makes no decision about category filtering. The client decides; the client decides only on the Library tab; the client never passes a marketing-scope signal at all.
- **Where:** Client filter construction `insights.tsx:399-413`. Client consumer `:411-1424`. Server endpoint `server/routes/insights.ts:44-1000+` (no role/department branching).
- **Why it matters:** Per the dispatch question 6 (server vs client vs split), this is **client-side only**. Per the finish-line plan (Batch 1 scope = server-side and data-layer changes only; Batch 3 scope = client-side UI changes), this fix belongs in **Batch 3**. There is no Batch-1 promotion path: the API does not need a server-side filter because the underlying data is per-organization, not per-department; what's missing is a client-side decision to render different tiles when the user is in the marketing surface.
- **Likely fix shape:** Per Finding 2, single prop + single conditional render block, both in `client/src/pages/{insights,marketing}.tsx`. Two UI files. Each requires a per-file `.claude/state/scope/<basename>.ok` marker per CLAUDE.md.
- **Effort:** S–M.
- **Risk if shipped wrong:** Low.

### Finding 7 — Minimal-surface-area fix recommendation

- **What:** The single minimal change is one new prop on `InsightsPage` and one conditional Dashboard render. No new endpoint. No schema. No redesign.
- **Recommended diff shape (Batch 3, two files):**
  - `client/src/pages/insights.tsx` — add prop, branch the Dashboard render:
    ```ts
    // line 126 (interface change):
    export default function InsightsPage({
      embedded = false,
      scope,
    }: { embedded?: boolean; scope?: 'sales' | 'marketing' | 'service' }) {

    // around line 501 (renderDashboard) — branch:
    const renderDashboard = () => {
      if (scope === 'marketing') {
        return renderMarketingDashboard();
      }
      // existing sales/default body unchanged
      return ( /* existing JSX */ );
    };

    // new function, ~40 lines, reusing existing Card / TileGrid components, drawing
    // from the same libraryMetricsData with category in
    // ['Lead Source', 'Channel', 'Composite', 'Forecast'].
    const renderMarketingDashboard = () => ( /* marketing-only tiles */ );
    ```
  - `client/src/pages/marketing.tsx:220` — pass the prop:
    ```tsx
    const renderInsights = () => (
      <InsightsPage embedded scope="marketing" />
    );
    ```
- **Why it matters:** Single point of plumbing. No backend change. No new test fixtures. Reuses the already-categorized library-metrics data from `/api/insights/library`. Honest result: marketing-role users see only marketing-relevant categories (Lead Source / Channel / Composite / Forecast), not the sales red/yellow/green funnel.
- **What this does NOT do (intentionally — out of scope):**
  - Does not add Reports tab marketing scoping (Reports tab continues to show sales reports inside `/marketing?tab=insights`; consider hiding the Reports tab in embedded+marketing mode in a follow-up Batch-3 chunk if operator desires).
  - Does not add a Marketing Hunches filter (`hunches` rows with `department='marketing'` continue to mix with sales/service hunches; this is a v2.3 backlog item).
  - Does not add new marketing-attribution metrics. Tiles draw from existing library metrics only.
  - Does not change the v2.3-preview banner at `marketing.tsx:224-241`.
- **Effort:** S–M (estimated 1 sprint-week including Playwright walk and code review).
- **Risk if shipped wrong:** Low — UI-only, behind v2.3-preview banner.

### Finding 8 — Marketing-campaign UI gap → confirm D-G1 default (b); banner already extended consistently

- **What:** Lane 6 Gap 1 documents: *"No marketing-campaign UI. The `/marketing` page has Dashboard / Agents / Studio / Insights tabs. There is NO tab to list, create, edit, schedule, or monitor marketing campaigns. `tests/e2e/s5-marketing.spec.ts:124-125` asserts the Campaigns nav item is intentionally absent."* Decision Matrix D-G1 default is `(b) keep visible, disable + banner`, with the recommendation note *"Marketing tab v2.3 banner already exists … extending it consistently is minimal work."*
- **Where (existing banner):** `client/src/pages/marketing.tsx:224-241`. The banner block is rendered:
  ```tsx
  <div className="flex flex-col h-full" data-testid="marketing-page">
    {/* v2.3-preview banner — required keywords "v2.3" and "preview" asserted by
        tests/e2e/s99-codex-launch-readiness-readonly.spec.ts */}
    <div className="..." role="status" data-testid="marketing-v23-preview-banner">
      <Info className="h-4 w-4 ..." />
      <div>
        <span className="font-medium">Marketing is in v2.3 preview.</span>{' '}
        <span>Campaign sends are not yet enabled in this release. Browsing
              is read-only — outbound actions are disabled.</span>
      </div>
    </div>
    ...
    {activeAgentId ? (<AgentChatView ... />) : (
      <>
        <div className="border-b border-border px-6 pt-4">
          <h1>Marketing</h1>
          <div className="flex gap-1"> {tabs.map(...)} </div>
        </div>
        <ScrollArea className="flex-1">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'agents'    && renderAgents()}
          {activeTab === 'studio'    && renderStudio()}
          {activeTab === 'insights'  && renderInsights()}
        </ScrollArea>
      </>
    )}
    ...
  </div>
  ```
  **The banner sits ABOVE the tab bar and ABOVE the `activeAgentId` ternary**, so it renders on:
  - `/marketing` (Dashboard tab) — confirmed by Lane 6 `marketing-dashboard-tab.png`
  - `/marketing?tab=studio` — confirmed by Lane 6 `marketing-studio-tab.png` (visible at top)
  - `/marketing?tab=insights` — banner also renders; the Insights body sits below it in the ScrollArea
  - `/marketing?tab=agents&agent=<id>` — banner renders; AgentChatView body sits below it (the ternary chooses the body, but the banner is OUTSIDE the ternary)
- **Why it matters:** **No banner-extension work is required.** The banner is already extended consistently across all four tabs by virtue of its placement above the tab body (and outside the agent-chat ternary). The Step A dispatch question references "the Dashboard tab already has the banner per Step A's screenshots" — that observation is correct, but the banner is not Dashboard-only; it's page-level and renders on every tab automatically. **The smallest patch is zero.**
- **Decision posture (D-G1 default confirmed):** (b) keep tabs visible, banner is the disable signal, no Create/Send marketing-campaign buttons exist on the page (per Lane 6 Gap 1 — Campaigns nav item is intentionally absent and asserted by `tests/e2e/s5-marketing.spec.ts:124-125`). There is nothing to disable that is not already absent. (a) hide Studio + Insights tabs would silently remove functions dealers can already see; not recommended. (c) build a thin campaign manager UI violates operator's "no new UI" / "no Marketing Studio expansion" rule and is explicitly OUT of v2.2 scope.
- **What WOULD constitute legitimate banner-extension work (none in v2.2 scope):**
  - If a future Marketing → Campaigns tab is added (v2.3), it would need a per-action disabled state + tooltip on Create / Send / Schedule buttons, and the banner copy may need to mention "Campaign management UI ships in v2.3."
  - If marketing-attribution tiles are added to the Insights tab via Finding 7 fix, the banner's "Browsing is read-only — outbound actions are disabled" text remains accurate (the tiles are read-only).
- **Likely fix shape:** None for v2.2. Document the existing banner's coverage in evidence so future agents do not duplicate the work.
- **Effort:** Zero (status quo confirmed adequate).
- **Risk if shipped wrong:** N/A (no change).

### Finding 9 — `marketing.tsx:67-79` URL→tab effect is benign

- **What:** Lane 6 Observation 13 hypothesized that the URL→tab restoration effect at `marketing.tsx:67-79` interacted with `SubMenuManager` to cause redirects. PR #6's investigation found a different root cause (AppProvider role-hydration race) and verified `/marketing?tab=agents` is stable post-patch. The `marketing.tsx:67-79` effect is straightforward: read URL search params, set `activeTab` / `activeAgentId` / `activeSessionId` / `activeArtifactRef` from them. No `setLocation` call, no redirect; pure state-from-URL.
- **Where:** `client/src/pages/marketing.tsx:67-79`.
- **Why it matters:** The effect is not the bug. Any remaining redirect symptom on `/marketing?tab=agents` or `/marketing?tab=insights` (if observed in Batch 3 walk) would point to a fresh root cause, not this effect. Document so future agents do not chase a phantom.
- **Likely fix shape:** No change. Verify in Batch 3 Playwright walk.
- **Effort:** Zero.
- **Risk:** N/A.

### Finding 10 — Server `/api/insights/*` endpoints carry no role / department / scope query parameter

- **What:** `server/routes/insights.ts` exposes `/api/insights/dashboard`, `/api/insights/library`, `/api/insights/reports`. Each endpoint takes `orgId` (optional, RBAC-checked) and `lookbackDays` (library only). Grep for `role`, `department`, `scope`, `category` in the file returns zero hits in the route handlers (only inside `deriveChannel` for channel inference, and `category` is set as output metadata on library metrics, not consumed as an input filter).
- **Where:** `server/routes/insights.ts:44-1167`.
- **Why it matters:** Confirms there is no server-side decision to filter sales-vs-marketing tiles, and therefore no server-side bug to fix. The minimal-surface-area fix in Finding 7 does not require ANY server change.
- **Likely fix shape:** No server change needed. If a future v2.3 wants server-side scope filtering (e.g. for cross-tenant authorization on department-restricted hunches), introduce a `scope` query param then. Not Batch 1 / Batch 2 / Batch 3 work for v2.2.
- **Effort:** Zero (for v2.2).
- **Risk:** N/A.

## Proposed implementation chunks (suggested order)

### Chunk MI-1 — Marketing-Insights scope prop + marketing Dashboard branch (Batch 3)

- **Files in scope (2 UI files; each requires per-file `.claude/state/scope/<basename>.ok` marker):**
  - `client/src/pages/insights.tsx` — add `scope?: 'sales' | 'marketing' | 'service'` prop on `InsightsPage`. Branch `renderDashboard` to a new `renderMarketingDashboard` when `scope === 'marketing'`. The marketing Dashboard renders four tile sections drawn from `libraryMetricsData` filtered to the four marketing-allowed categories (`Lead Source`, `Channel`, `Composite`, `Forecast`) — reusing the same Card / metric-tile vocabulary already in the file. ~40–60 lines added, no lines removed.
  - `client/src/pages/marketing.tsx` — at `:220`, change `<InsightsPage embedded />` to `<InsightsPage embedded scope="marketing" />`. One-line change.
- **Files NOT touched:** any server file, `shared/schema.ts`, any other client file.
- **Test plan:**
  - **Delta 1 (focused):** Playwright spec extending `tests/e2e/s5-marketing.spec.ts` (or a new `wf-marketing-insights.spec.ts`) — load `/marketing?tab=insights` as `serra_honda@huminic.ai`, assert that the four marketing-category tiles render and that NONE of the sales-pipeline tiles ("Hot Leads Going Cold", "Pending Finance", "Pipeline Health", "Performance Scorecard") appear in the embedded Dashboard body. TS check passes (`npm run check`).
  - **Delta 2 (independent):** Playwright screenshot comparison — pre-fix `marketing-insights-tab.png` (Lane 6) shows sales-pipeline tiles; post-fix screenshot shows marketing-category tiles only. Pixel-diff is sufficient evidence; the tile copy difference is unmistakable.
- **Stop conditions:**
  - `roleCategoryMap` removed or restructured — STOP, scope creep (it controls Library tab; do not touch).
  - Any server file modified — STOP, scope creep (Batch 3 is client-only).
  - `renderReports`, `renderHunches`, `renderActivity` modified to add marketing branching — DEFER to v2.3 backlog (out of scope).
- **Risk:** Low. Confined to two UI files. Marketing-role surface is gated by v2.3-preview banner already.

### Chunk MI-2 — Confirm I-NEW-2026-05-01-F closed by PR #6 (Batch 3)

- **Files in scope:** None (verification only). Possibly an `evidence/<sprint>/batch-3/marketing-tab-agents-closure.md` row.
- **Test plan:**
  - **Delta 1:** Playwright walk on `/marketing?tab=agents` for both `super_admin` (`duane.wells@huminic.ai`) and `org_admin` (`serra_honda@huminic.ai`). Assert page holds ≥30s without `setLocation` away. Capture screenshot of the Agents tab body rendered.
  - **Delta 2:** Network trace via `browser_network_requests` — assert no client-side redirect (no second-tier navigation event after initial mount).
- **Outcome paths:**
  - If both walks pass → close I-NEW-2026-05-01-F as duplicate of -A.
  - If `org_admin` redirects but `super_admin` does not → re-open as a separate sub-cause (likely RBAC-related, since marketing-role permissions are unusually narrow per Lane 6 Observation 9; but `org_admin` should have full marketing access).
- **Stop conditions:** If a redirect reproduces, capture a fresh repro and escalate; do NOT silently fix.
- **Risk:** Low (verification only).

### Chunk MI-3 — Banner-extension status (Batch 3, documentation-only)

- **Files in scope:** None (status confirmation).
- **Test plan:** Annotate evidence pack: the `marketing-v23-preview-banner` at `client/src/pages/marketing.tsx:224-241` already covers all four tabs (Dashboard, Agents, Studio, Insights) by virtue of being rendered above the tab bar and outside the `activeAgentId` ternary. Lane 6 screenshots `marketing-dashboard-tab.png` and `marketing-studio-tab.png` confirm presence on Dashboard and Studio. For full Batch-3 evidence, add post-fix screenshots from `/marketing?tab=insights` and `/marketing?tab=agents&agent=<id>` showing the banner present on each.
- **Risk:** None (documentation).

## Proof needed before any chunk is approved

- [ ] Operator confirms D-G1 path (b) — keep tabs visible, the existing banner is the disable signal. No new banner code. No new disabled buttons (none exist to disable).
- [ ] Operator approves the `scope` prop name + the four marketing-allowed categories (`Lead Source`, `Channel`, `Composite`, `Forecast`) as the v2.2 marketing Dashboard tile set. Alternative: collapse Marketing → Insights tab to a single "Marketing analytics ship in v2.3" placeholder card if the operator prefers a simpler defer.
- [ ] Operator approves Chunk MI-1's two-file UI scope (per-file `.claude/state/scope/insights.tsx.ok` and `marketing.tsx.ok` markers needed before edit).
- [ ] Playwright walk in MI-2 captures route stability for both `super_admin` and `org_admin` BEFORE F can be closed.
- [ ] Code-reviewer (fresh session) confirms `roleCategoryMap` and Library-tab consumers are unchanged.

## Open questions for operator

1. **Marketing Dashboard tile shape** — the four marketing-allowed library categories (`Lead Source`, `Channel`, `Composite`, `Forecast`) yield ~12 tiles total (per Library metric counts in `server/routes/insights.ts:1019-1159`). Should the marketing Dashboard render all 12, or pick the top 4–6 most-relevant for a launch demo? Recommendation: render all 12 in a 2×6 grid (or grouped by category as the Library does), since picking subsets requires product judgment about which tiles are launch-day-useful.
2. **Reports + Hunches embedded scope** — when `scope='marketing'`, should the Reports tab also be hidden (since it's all sales-loss / sales-channel reports), or kept visible with the v2.3-preview banner indicating reports ship in v2.3? Recommendation: keep visible for v2.2; banner already covers honesty. Hide in v2.3 when marketing reports exist.
3. **Marketing Hunches filter** — `hunches` table has `department='marketing'` support but the consumer doesn't filter. Add a `?department=marketing` query param to `/api/hunches` when scope is marketing? OUT OF SCOPE recommendation — defer to v2.3 (separate Hunches sprint).
4. **F closure verdict** — if MI-2 walk shows `/marketing?tab=agents` stable for both roles, can F be closed without a separate PR (treat as side-effect of PR #6)? Recommendation: yes, with an `issues.md` row update referencing PR #6 + the MI-2 walk evidence.
5. **`tests/e2e/s5-marketing.spec.ts:124-125`** — the existing assertion that "Campaigns nav item is intentionally absent" must remain. Confirm Chunk MI-1 does not accidentally cause a Campaigns tab to appear. Recommendation: spot-check the spec passes post-fix.

## Out of scope for this investigation

1. Marketing Studio expansion (campaign manager UI, recipient list, schedule UI). Operator's stated v2.3 scope. D-G1 path (c) is rejected.
2. New marketing-attribution metrics not already in the library-metrics endpoint (campaign-source split, UTM, paid-vs-organic, opt-out rate, deliverability). v2.3 backlog.
3. Marketing Hunches department filter. v2.3 backlog (separate Hunches sprint).
4. AI-agent additions to `/marketing?tab=agents`. Lane 6 already documents the 5 existing agents are sufficient for v2.2. Out of scope.
5. Marketing artifact persistence to DB (Lane 6 Gap 3). v2.3 backlog (`marketing_artifacts` table proposal).
6. Marketing agent prompt move from client constant → DB rows (Lane 6 Gap 4). v2.3 backlog.
7. Photo Studio I-102 fix (Lane 6 Gap 5). Not investigated; tracked separately.
8. `GOOGLE_MAPS_API_KEY` configuration (Lane 6 Gap 8). Not investigated; ops task.
9. Server-side scope filtering on `/api/insights/*`. v2.3 if/when needed.
10. The 7 dishonest sales metrics (KD-2). Dispatch 3's job. NOTE: if Dispatch 3's per-metric recommendations also affect tiles that would surface in the marketing Dashboard branch (e.g. `lib-22 Top Source`, `lib-23 Source Win Rate`), Chunk MI-1 should pick up Dispatch 3's recommendations rather than render the dishonest version. Cross-reference required at preflight time.

## Cross-references

- **Schema (Dispatch 1):** `/home/ubuntu/Claude-store/nexxus2.2_replit/evidence/stabilization-sprint-2026-05-01/finish-line-findings/01-schema-taxonomy.md` — confirms `vin_status NOT LIKE 'SERVICE%'` predicate is the Batch-1 sales-vs-service filter. The marketing Dashboard's tiles (drawn from `/api/insights/library`) will inherit Batch 1's sales-vs-service filtering automatically once Batch 1 ships, since the library endpoint computes from `warehouse_leads` with the same predicate after Batch 1.
- **Reports (Dispatch 2):** Pending — if Dispatch 2 confirms server-side filter changes affect `/api/insights/library`, this fix automatically benefits.
- **Metrics (Dispatch 3):** Pending — if Dispatch 3 recommends suppressing `lib-22` (Top Source) or relabeling positional grades, the marketing Dashboard branch must NOT render the suppressed/relabeled tile in its dishonest form. Wait for Dispatch 3 before drafting Chunk MI-1 final tile list.
- **Lane 6 (overnight):** `/home/ubuntu/Claude-store/nexxus2.2_replit/evidence/stabilization-sprint-2026-04-30/lane-6-marketing.md` — Observation 10 (Sales-style metrics rendered inside Marketing → Insights) is the user-visible repro for this finding; Gap 1 (No marketing-campaign UI) is the Finding 8 source.
- **Decision Matrix:** D-G1 default (b) confirmed; D-H1, D-A1, D-F1 are unaffected by this investigation.
- **PR #6 / `0e674a5`:** closed I-NEW-2026-05-01-A; verified `/marketing?tab=agents` stable for super_admin; F closure pending Batch-3 walk for org_admin.
- **Files cited (absolute paths):**
  - `/home/ubuntu/Claude-store/nexxus2.2_replit/client/src/pages/insights.tsx` (lines 126, 399-413, 411-413, 415, 416, 462, 1374, 1414, 1418, 1424, 1548, 1583)
  - `/home/ubuntu/Claude-store/nexxus2.2_replit/client/src/pages/marketing.tsx` (lines 17-29, 40-45, 55-79, 67-79, 219-221, 224-241, 244-250, 275-280)
  - `/home/ubuntu/Claude-store/nexxus2.2_replit/client/src/lib/marketing-agents.ts` (data-only, no role/scope/department signal; not implicated in the bug)
  - `/home/ubuntu/Claude-store/nexxus2.2_replit/client/src/components/layout/SubMenuManager.tsx` (lines 592-640 — marketing nav, only setLocation calls; not implicated post PR #6)
  - `/home/ubuntu/Claude-store/nexxus2.2_replit/server/routes/insights.ts` (lines 1-200 reviewed; no role/scope filtering server-side)
  - `/home/ubuntu/Claude-store/nexxus2.2_replit/issues.md` line 237 (I-NEW-2026-05-01-A CLOSED row)
  - `/home/ubuntu/Claude-store/nexxus2.2_replit/evidence/stabilization-sprint-2026-04-30/overnight-validation-report.md` lines 111, 141, 142
  - `/home/ubuntu/Claude-store/nexxus2.2_replit/evidence/stabilization-sprint-2026-04-30/lane-6-marketing.md` (Gap 1, Observation 10, Observation 13)
  - `/home/ubuntu/Claude-store/nexxus2.2_replit/evidence/stabilization-sprint-2026-05-01/finish-line-findings/01-schema-taxonomy.md`
  - `/home/ubuntu/Claude-store/nexxus2.2_replit/evidence/stabilization-sprint-2026-05-01/finish-line-plan.md` Section 3 Group G + Section 4 D-G1 + Section 13 KD-3, KD-4
  - PR #6 commit `0e674a5` (`fix(routing): hold AppProvider until role hydrates`)
