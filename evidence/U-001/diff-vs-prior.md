# U-001 Comparison: Prior Execution vs Current Execution

**Date:** 2026-03-27
**Prior execution:** `.governor/evidence/U-001/` (commit 48bdd43)
**Current execution:** `evidence/U-001/`

---

## 1. State Enumeration: 163 vs 350

### Headline
The prior execution enumerated **163 states** across 20 routes. The current execution enumerated **350 states** across the same 20 routes. The current execution found **187 additional states** (a 115% increase).

### What changed in methodology
- **Prior:** Enumerated states as compact IDs (e.g., `M-01`, `TB-05`) with short trigger descriptions. Grouped by route with a flat table per route.
- **Current:** Enumerated as sequential IDs (`ST-001` through `ST-350`). Each state includes the role context (which roles see it), source file references, and more granular sub-states (loading, error, empty, submitting variants).

### Where the new states came from

| Area | Prior Count | Current Count | Delta | Primary additions |
|------|-------------|---------------|-------|-------------------|
| Global/Cross-Cutting | 15 | 10 | -5 | Reorganized: prior included sidebar/pane states as global; current split EntitlementGate, ErrorBoundary, ProtectedRoute into discrete states. Prior's G-14/G-15 (right panes) dropped as global, absorbed into per-route states. |
| Auth (login/forgot/reset) | 7 | 16 | +9 | Added: submitting spinners (ST-015, ST-017, ST-023), error states (ST-014, ST-018, ST-021, ST-022), token expired/invalid (ST-025, ST-026) |
| Widget Landing (/p/, /w/) | 12 | 26 | +14 | Added: video connecting/connected/error (ST-034-036), voice connecting/connected/ended/error (ST-038-041), form submitting (ST-043), lead form states (ST-046-048), callback request flow (ST-049-052) |
| Main AI Chat (/) | 7 | 26 | +19 | Added: individual metric tiles as separate states (ST-063-066), metric detail dialogs per-type (ST-067-073), contact detail view states (ST-074-077), ThinkingCard collapsed/expanded (ST-061-062), streaming with status (ST-059), suggestion chips (ST-078) |
| TeamBox | 16 | 25 | +9 | Added: voice transcript modal (ST-091), assign dropdown (ST-092), task sub-view states (ST-093-097), conversation reply input (ST-084). Prior had WhatsApp/Web Chat missing from channel filter list. |
| My Work | 8 | 15 | +7 | Added: loading skeletons (ST-105, ST-109, ST-115), task dialog submitting (ST-113), AI chat history empty (ST-117), assistant placeholder (ST-118) |
| Sales | 8 | 22 | +14 | Added: per-metric detail dialogs (ST-121-127), contact detail view (ST-128-129), top agents section (ST-130), activity feed states (ST-131-133), VIN sync indicator (ST-134), agent loading/empty (ST-136-137) |
| Service | 9 | 19 | +10 | Added: campaign detail dialog (ST-148), new campaign dialog (ST-149-150), CSV upload flow (ST-151-153), agent loading/empty (ST-155-156), service insights metric tiles (ST-157-158) |
| Marketing | 6 | 13 | +7 | Added: Studio tab with filter pills (ST-164-165), agent chat view states (ST-167-172) including artifact preview, tool execution, full-screen dialog, sharing panel |
| Management | 8 | 15 | +7 | Added: RBAC redirect state (ST-173), hunch status variants (ST-178-182), hunches generating spinner (ST-182), activity log loading/empty (ST-183, ST-185) |
| Agents | 7 | 13 | +6 | Added: EntitlementGate blocked state (ST-189), streaming with status (ST-193), stream error with retry (ST-194), suggestion chips (ST-195), stop button (ST-196) |
| Insights | 16 | 37 | +21 | Added: green zone card (ST-207), drill-down dialogs for Pipeline Health/Scorecard/Green Zone (ST-213-215), trend chart and bar chart (ST-216-217), store selector (ST-218), reports sub-tab states (ST-222-226), library category/search/lookback/loading (ST-229-234), hunches preferences (ST-236) |
| Settings | 32 | 55 | +23 | Added: individual tile states (ST-239-245), user search filter (ST-248), invite user dialog (ST-255-256), user dropdown menu (ST-257), business hours form (ST-259), comm gate active/paused (ST-260-261), server kill switch banner (ST-262), channel controls (ST-263), rate limit (ST-264), TextMagic input (ST-265), widget config sub-tabs (ST-270-275), universal settings (ST-278), skills (ST-279), VIN lead config (ST-280-282), KB kill switch (ST-288), AI config read-only (ST-290) |
| Profile | 5 | 13 | +8 | Added: profile saving spinner (ST-295), contact info form (ST-296), password mismatch error (ST-298), password submitting (ST-299), photo upload/uploading (ST-300-301), preferences sub-states (ST-302-305) |
| Billing | 5 | 26 | +21 | Added: entirely new sub-routes — /settings/billing/usage (ST-315-320), /settings/billing/plan (ST-321-326), /settings/billing/invoices (ST-327-331). Prior had billing as 5 states on one page. Current decomposed into 4 separate pages with loading/error/empty/RBAC states each. |
| Org Wizard | 8 | 11 | +3 | Added: validation error toast (ST-340), creating spinner (ST-341), creation success redirect (ST-342) |
| Usage | 5 | 7 | +2 | Added: usage error state (ST-345), access denied state (ST-349) |
| 404 | 1 | 1 | 0 | No change |

### Key patterns in new discoveries
1. **Loading/empty/error triad.** The current execution systematically enumerated loading skeleton, empty, and error states for every data-fetching component. Prior execution mostly captured only the "populated" state.
2. **Submitting spinners.** The current execution identified button-level submitting states (e.g., "Creating...", "Signing in...", "Processing..."). Prior missed all of these.
3. **RBAC redirect states.** The current execution added explicit states for role-insufficient redirects (ST-004, ST-173, ST-314, ST-320, ST-326, ST-331, ST-332, ST-349). Prior did not enumerate these.
4. **Billing decomposition.** The current execution discovered that billing is 4 separate sub-routes, not 1 page with 3 tabs. This tripled the billing state count.
5. **Marketing Studio and Agent Chat.** The current execution found the Studio tab (creative gallery with filter pills) and agent chat view (with artifact preview, tool execution, sharing) that the prior execution enumerated only as tab names.

---

## 2. Reconciliation Comparison

### Prior reconciliation
- Method: 30 screenshots cross-referenced against 163 enumerated states
- Result: **100 of 163 states crawled (61%)**
- Uncrawled: 63 states
- Key mismatches found: WhatsApp/Web Chat channel chips not in enumeration, Settings tile count discrepancy (7 enumerated, 4 visible in screenshots), unauthorized agent test artifact in Sales

### Current reconciliation
- Method: DOM crawl (Playwright snapshots + evaluate) + 36 screenshots, cross-referenced against 350 enumerated states
- Result: **68 of 350 states crawled (19.4%)**
- Uncrawled: 282 states
- Mismatches found: 14 (documented in reconciliation.md)

### Coverage discrepancy explained
The coverage percentage dropped from 61% to 19.4%, but this is not a regression in crawl quality. The denominator changed dramatically:

| Metric | Prior | Current | Explanation |
|--------|-------|---------|-------------|
| States enumerated | 163 | 350 | Current found 2.1x more states |
| States crawled | 100 | 68 | Current crawled fewer states in absolute terms |
| Coverage % | 61% | 19.4% | Denominator grew faster than numerator |
| Mismatches found | ~5 | 14 | Current found 2.8x more mismatches |

The absolute crawl count dropped because:
1. The prior execution counted "visible in screenshot" liberally (e.g., seeing a sidebar counted as crawling multiple sidebar states). The current execution was stricter about what constitutes "crawled."
2. The current execution's DOM crawl covered structural elements well but did not interact deeply (no clicking through dialogs, no sending messages, no triggering loading/error states).
3. The current execution's visual analysis was disrupted by the auto-tour system (documented in visual-analysis.md), which consumed screenshot budget on tour overlay captures.

### New mismatches not found in prior execution

| ID | Mismatch | Why prior missed it |
|----|----------|---------------------|
| MISMATCH-004 | Channel filter chips differ between DOM and visual (6 in DOM, 3 visible) | Prior noted WhatsApp/Web Chat as missing from enumeration but did not compare DOM vs visual |
| MISMATCH-006 | "Workflows" sub-tab in TeamBox not visible in screenshots | Prior did not have DOM crawl to discover it |
| MISMATCH-010 | Settings sub-routes all return 404 (client-side state, not URL routing) | Prior did not attempt direct URL navigation to settings sub-pages |
| MISMATCH-011 | Settings tile count: org_admin 6, super_admin 7 (not 4 as prior screenshots showed) | Prior saw 4 tiles in screenshots for both roles and speculated about scroll/fold. Current DOM confirmed 6-7 tiles exist. |
| MISMATCH-012 | Marketing Studio tab has 5 sub-tabs and Generate button (not captured visually) | Prior did not enumerate Studio tab content |
| MISMATCH-013 | /manage is a dead route; sidebar "Manage" navigates to /management | Prior did not test direct URL navigation vs sidebar navigation |
| MISMATCH-014 | "All Stores" dropdown on Insights is role-gated (super_admin only) | Prior noted org switcher as a state but did not compare across roles |

### Mismatches confirmed by both executions
- Settings tile visibility discrepancy (prior: "screenshots may cut off"; current: confirmed 6-7 tiles via DOM)
- WhatsApp channel chip exists but was not in prior enumeration's channel list

---

## 3. Screenshots: 30 vs 36

### Prior screenshots (30 files)
All captured via Playwright, organized by route with clear naming:
```
01-main-default.png through 30-usage.png
```
Coverage: 1 main, 4 sales tabs, 2 service tabs, 2 marketing tabs, 5 management tabs, 3 teambox tabs, 6 settings sections, 1 profile, 1 landing page, 2 auth pages, 1 usage, 2 super_admin settings

### Current screenshots (36 files)
Captured via Playwright but with naming collisions and tour disruption:
```
01-login-page.png through 32-orgadmin-profile.png
```
(Some numbers duplicated: 02, 05, 09, 11 each appear twice with different suffixes)

### Pages added in current execution (not in prior)

| Screenshot | Page | Why new |
|------------|------|---------|
| 06-tour-overlay-1of6.png | Product tour overlay | Auto-tour captured; prior suppressed tour successfully |
| 11-insights-page.png / 23-insights.png | /insights standalone | Prior only saw insights embedded in Sales/Service/Marketing/Management |
| 13-manage.png | /manage (404) | Discovered dead route; prior never hit it |
| 20-settings-notifications.png | Settings > Notifications | Prior did not navigate to this section |
| 21-settings-appearance.png | Settings > Appearance | Prior did not navigate to this section |
| 24-calendar.png | Calendar view | Prior captured calendar as Sales tab; current captured standalone |
| 25-32 (orgadmin-*.png) | Dual-perspective set | Current captured org_admin perspective separately from super_admin |

### Pages in prior but not separately captured in current
- Landing page (/p/:slug) — prior had `25-landing-page-serra-honda.png`; current did not capture widget landing pages
- Forgot password — prior had `27-forgot-password.png`; current did not capture this page
- TeamBox Phone/Video tabs — prior had `16-teambox-phone.png` and `17-teambox-video.png`; current did not capture these tabs separately

### Screenshot quality difference
- **Prior:** Clean, one screenshot per distinct tab/view, no disruption from auto-tour
- **Current:** Tour overlay disrupted capture (screenshot 06), duplicate filenames suggest re-runs, org_admin and super_admin perspectives captured as separate passes (screenshots 25-32)

---

## 4. Method Differences

| Dimension | Prior Execution | Current Execution |
|-----------|----------------|-------------------|
| State enumeration source | Code analysis of `client/src/` | Code analysis of route definitions, page components, conditional rendering |
| Granularity | Compact (trigger-based states) | Exhaustive (loading/error/empty/submitting for every component) |
| Visual capture | 30 screenshots only | 36 screenshots + DOM element inventory (Playwright snapshots + evaluate) |
| DOM crawl | Not performed | Full DOM inventory per page with data-testid mapping |
| Reconciliation method | Screenshots vs enumeration | DOM vs visual vs enumeration (three-way comparison) |
| Role perspectives | org_admin + super_admin (screenshots) | org_admin + super_admin (screenshots + DOM) |
| New artifacts | None | dom-inventory.md, visual-analysis.md (neither existed in prior) |
| Mismatches documented | Inline in reconciliation (~5 noted) | 14 structured mismatches with significance ratings |

### DOM inventory: entirely new capability
The current execution produced `dom-inventory.md` — a full interactive element inventory per page including:
- data-testid attributes for every interactive element
- Element counts per page
- Role-differentiated views (which elements appear for org_admin vs super_admin)
- Product tour overlay element structure

This did not exist in the prior execution. It enabled discoveries like MISMATCH-010 (settings sub-routes are client-side state, not URL routes) and MISMATCH-006 (Workflows sub-tab exists in DOM but not visible in screenshots).

### Visual analysis: entirely new capability
The current execution produced `visual-analysis.md` — human-readable descriptions of every screenshot with element counts, color/layout details, and behavioral observations (e.g., the auto-tour system discovery).

This did not exist in the prior execution. The prior reconciliation compared screenshots against enumeration but did not produce standalone visual descriptions.

---

## 5. Coverage: 61% vs 19.4% — The Real Picture

### Why the percentage dropped
The denominator grew from 163 to 350 (2.15x), while the numerator went from 100 to 68 (0.68x). Combined effect: coverage ratio dropped by a factor of 3.15.

### Adjusted comparison
If we apply the current execution's stricter "crawled" definition to the prior execution's 163 states, the prior's true coverage was likely closer to 40-50%, not 61%. The prior counted states as "crawled" if a screenshot showed the page in any state — for example, seeing the Sales Dashboard screenshot counted SL-01 (populated) as crawled, even though SL-05 (MetricDetailDialog), SL-06 (agent detail), SL-07 (agent menu), and SL-08 (loading) were all uncrawled from the same page.

### What would be needed for 80% coverage
To reach 80% of 350 states (280 states), the following would need to be crawled:
- All zero-coverage routes: /my-work, /agents, widget landing pages, billing sub-routes, org wizard, auth recovery flows (~102 states)
- All loading/error/empty states (requires triggering each condition) (~80 states)
- All dialog/modal states (requires clicking through CRUD workflows) (~40 states)
- All streaming/submitting states (requires sending messages, submitting forms) (~20 states)

---

## 6. Summary

| Metric | Prior | Current | Assessment |
|--------|-------|---------|------------|
| States enumerated | 163 | 350 | +115%. Current is substantially more thorough. |
| Routes identified | 20 | 20 | Same. No new routes discovered. |
| Screenshots captured | 30 | 36 | +20%. Current added insights standalone, settings notifications/appearance, dual-perspective org_admin pass. Lost landing page and forgot-password. |
| Reconciliation mismatches | ~5 | 14 | +180%. Current found more because it had DOM data to compare against. |
| New artifacts | 0 | 2 | DOM inventory and visual analysis are new capabilities. |
| Crawl coverage | 61% (100/163) | 19.4% (68/350) | Percentage dropped due to denominator growth. Absolute crawl count dropped due to stricter counting + tour disruption. |
| Method rigor | Screenshots-only | DOM + screenshots + three-way reconciliation | Current is methodologically superior. |

### Bottom line
The current execution found nearly everything the prior execution found, plus 187 additional states, 14 documented mismatches, and two entirely new artifact types (DOM inventory, visual analysis). The coverage percentage is lower because the current execution set a much higher bar for what "complete" means. The prior execution's 61% was coverage of a smaller, less complete picture.
