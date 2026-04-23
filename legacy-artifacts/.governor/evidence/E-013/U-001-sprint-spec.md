# U-001 Sprint Spec — UI Element Inventory (V3 Ground Truth)

**Sprint ID:** U-001
**Category:** U (UI Inventory)
**Phase:** qa_resolve_loop
**Status:** PROPOSED
**Date:** 2026-03-27

---

## Objective

Build the ground truth UI inventory for nexxus2.2_replit by systematically visiting every state of every page, capturing DOM structure and screenshots, and reconciling the two through independent analysis. This is the first of three V3 artifacts that will define all subsequent testing.

**Outcome:** A verified, operator-approved inventory of every interactive element, data display, and UI state in the application — the foundation that D-001 (Data Map) and CL-001 (Cluster Registry) build on.

---

## What Exists Already

An initial UI inventory was produced on 2026-03-25 at `assessments/nexxus-ui-inventory.md`. It covers 10 pages, ~150 elements, 10 screenshots. However:
- It predates 8 SEC remediation sprints that changed UI elements
- It inventoried pages, not states (no modals, no conditional views, no error states)
- It was produced by Playwright crawl only — no dual-verification
- No reconciliation step was performed

This sprint **updates** the existing inventory, does not replace it from zero.

---

## Step 1: State Enumeration (before Playwright)

Produce an explicit list of every state to visit. A "state" is a distinct UI rendering — not just a route.

### Per Route
| Route | States to Enumerate |
|-------|-------------------|
| Each route | Default view, empty state (no data), loading state, error state |
| Tabs | Each tab within the route |
| Modals | Every trigger that opens a modal/dialog/overlay |
| Dropdowns | Org switcher, profile menu, notification panel, agent menus |
| Conditional views | Permission-gated content (super_admin vs org_admin vs sales) |
| Interactive sequences | Tour overlay, campaign creation flow, user invite flow |
| Widget states | Landing page default, ?mode=video, ?mode=chat, form submission |

### Known States (from prior inventory + SEC sprints)
```
Routes: /, /teambox, /my-work, /sales, /service, /marketing, /management, /settings/system, /profile, /login, /forgot-password, /p/{slug}, /w/{slug}

Per-route tabs:
  /teambox: Conversations, Phone, Video
  /my-work: Dashboard, Tasks, Chat, Assistant
  /sales: Dashboard, Agents, Insights, Calendar
  /service: Campaigns, Agents, Insights, Calendar
  /marketing: Dashboard, Agents, Studio, Insights
  /management: Insights, Hunches, System Log, User Chats, Billing
  /settings/system: 7 sub-pages (User Mgmt, Org, Tools, KB, AI Config, Notifications, Appearance)
  /settings/system > Tools: 8 sub-tabs (MCP, API, Other, Universal, Widgets, Pages, API Keys, Webhooks)

Modals/Overlays:
  - Tour overlay (6-step, every page)
  - Org switcher dropdown
  - Profile menu dropdown
  - Notification panel
  - Agent card menu (edit/delete/configure)
  - Campaign creation dialog
  - User invite dialog
  - New Organization dialog
  - Widget embed code modal
  - Calendar "New Appointment" dialog
  - Calendar "Sync Sources" dialog
  - Chat copilot popout ("Discuss with Georgia")

Permission-gated:
  - AI Config tile: super_admin + partner_admin (SEC-07 change)
  - Role Switcher: removed (R-015)
  - Billing: admin-only in sub-menu

Widget Landing Pages:
  - /p/{slug} default view
  - /w/{slug} default view
  - Video popup (?mode=video or button click)
  - Instant Call Back form (SEC-08 change)
  - Chat widget embed
```

### Deliverable: `evidence/U-001/state-enumeration.md`
Complete list of every state. Format: `Route > Tab > State > Trigger`. Target: 80-120 states across all routes.

---

## Step 2: Playwright Crawl (DOM Extraction)

For each enumerated state:

1. Navigate to the state (Playwright MCP)
2. Capture DOM snapshot (browser_snapshot)
3. Extract all interactive and data-display elements:
   - Buttons, links, inputs, toggles, dropdowns
   - Metric tiles/cards with current values
   - Tables with column headers and row counts
   - Lists with item counts
   - Badges, labels, status indicators
   - Navigation elements (tabs, sidebar items, breadcrumbs)
4. Record element metadata:
   - data-testid (if present)
   - Text content / label
   - Element type (button, input, tile, card, link, toggle, etc.)
   - Interactive? (yes/no)
   - Has data? (static label vs. dynamic value)

### Deliverable: `evidence/U-001/dom-inventory/` — one file per route
Format per element:
```
[route]/[tab]/[state]
  element: button[data-testid="new-campaign"] "New Campaign"
  type: button
  interactive: yes
  data: no (static label)
  parent: service-campaigns-header
```

---

## Step 3: Screenshot Capture + Independent Analysis

For each enumerated state:

1. Capture screenshot (browser_take_screenshot) — full page
2. Store at `evidence/U-001/screenshots/{route}-{tab}-{state}.png`
3. **Independent visual analysis:** Read each screenshot and describe what's visible — layout, elements, data values, visual hierarchy. Do NOT reference the DOM crawl results during this step.

### Deliverable: `evidence/U-001/visual-analysis/` — one file per route
Format: natural language description of what's visible in the screenshot, organized by visual region (header, sidebar, main content, footer).

---

## Step 4: Reconciliation

Compare DOM inventory to visual analysis for each state:

| Check | What It Catches |
|-------|----------------|
| DOM says N elements, visual says M | Hidden elements, loading failures, below-fold items |
| DOM has element, visual doesn't see it | CSS hidden, z-index overlap, zero-height container |
| Visual sees element, DOM doesn't list it | Missed in crawl, dynamically injected, iframe content |
| Data values differ | Rendering bug, stale cache, async load not complete |

### Deliverable: `evidence/U-001/reconciliation.md`
Per-state comparison. Each mismatch gets:
- What disagrees
- Likely cause
- Severity (blocks testing / cosmetic / investigate)
- Recommended action

---

## Step 5: Delta from Prior Inventory

Compare U-001 results to the 2026-03-25 inventory (`assessments/nexxus-ui-inventory.md`):

- Elements added since SEC sprints (Instant Call Back form, tooltip components, etc.)
- Elements removed (Role Switcher dropdown, Billing link in profile, My Work nav item hidden)
- Elements modified (Take a Tour → Reset Tour, Web Call → Instant Call Back, CRM Guru → Data Guru)

### Deliverable: `evidence/U-001/delta-from-prior.md`

---

## Step 6: Operator Reconciliation

Present the inventory to the operator with specific questions:
- "We found N elements across M states. Here are the 3 biggest mismatches."
- "These elements exist in DOM but aren't visible — expected or bug?"
- "These states we couldn't reach — do they exist?"
- "Anything you expected to see that's not here?"

The operator is NOT asked to review the full inventory. The operator resolves specific flagged items and adds anything the system missed from product knowledge.

### Deliverable: Operator-confirmed inventory with annotations

---

## Execution Notes

### What Captain Does
- Writes state enumeration (Step 1) — this is orchestration, not code
- Dispatches Playwright crawl from main session (subagents can't use Playwright MCP)
- Dispatches screenshot analysis as separate agent (isolation ensures independence)
- Performs reconciliation comparison
- Presents findings to operator

### What Subagents Do
- **Explorer agent:** Reads nexxus codebase to identify all routes, tabs, modals, conditional views for state enumeration
- **Screenshot analysis agent:** Reads screenshots and produces independent visual descriptions (no DOM access)
- **Reconciliation agent (optional):** Compares DOM vs. visual outputs, flags mismatches

### Constraints
- Playwright runs from main session (permission constraint)
- Screenshot analysis agent must NOT see DOM results (independence requirement)
- Inventory updates the prior work, doesn't discard it
- Auth: super_admin account (duane.wells@huminic.ai) for maximum visibility, then spot-check with org_admin for permission-gated views

### Success Criteria
1. Every enumerated state has both a DOM snapshot and a screenshot
2. Reconciliation produced with all mismatches flagged
3. Delta from prior inventory shows what SEC sprints changed
4. Operator has reviewed and confirmed the inventory
5. Output is structured enough to feed D-001 (every data element identified) and CL-001 (every element has a page/tab/state location)

---

## Risks

| Risk | Mitigation |
|------|-----------|
| Tour overlay blocks element visibility | Dismiss tour in auth helper (loginForBrowser already does this) |
| Session instability (I-148, auth refresh) | Restart browser between page groups, fresh login per route if needed |
| Loading states never resolve | Set 10s timeout per state, flag unresolved as "loading-stuck" |
| Permission-gated views require role switching | Test super_admin first (sees everything), then spot-check org_admin for differences |
| Widget landing pages need different auth context | Visit /p/{slug} and /w/{slug} unauthenticated (public routes per R-014) |

---

## Pre-Execution Checklist (4x4)

### Captain
1. **Scope:** Orchestrate U-001 — state enumeration, dispatch crawl, dispatch analysis, reconcile, present to operator
2. **Why:** V3 ground truth artifact. Everything downstream depends on this inventory being accurate.
3. **Success:** Operator-confirmed inventory with all mismatches resolved or flagged
4. **Next:** D-001 (Data Observability Map) using inventory as input

### Explorer (Researcher)
1. **Scope:** Read nexxus codebase — all routes, components, modals, conditional renders — to build state enumeration
2. **Why:** State enumeration must be code-informed, not recall-based. Every wouter route, every conditional render, every modal trigger.
3. **Success:** Complete list of states that Playwright will visit. No route or modal missed.
4. **Next:** Done. Explorer's output feeds Captain's state enumeration.

### Playwright Crawl (Captain, main session)
1. **Scope:** Visit every enumerated state. DOM snapshot + screenshot per state.
2. **Why:** Observable state (Anchor 1). The DOM is ground truth for what exists.
3. **Success:** Every state has a snapshot and screenshot file. No "we couldn't reach it" without a documented reason.
4. **Next:** Screenshots go to analysis agent. DOM goes to reconciliation.

### Screenshot Analysis (Verifier)
1. **Scope:** Read each screenshot independently. Describe what's visible. Count elements. Note data values.
2. **Why:** Divergence detection (Anchor 2). Independent second observation of the same reality.
3. **Success:** Visual description for every screenshot that can be compared to DOM inventory without having seen it.
4. **Next:** Output goes to reconciliation step.

### Risks
- **Session instability** may force browser restarts mid-crawl. Budget time for this.
- **State enumeration** may miss conditional views that only appear with specific data. Mitigation: Explorer reads code for conditional renders.
- **Screenshot analysis** quality depends on viewport size and scroll position. Use consistent 1280x800 viewport.

### Difficulty: Medium-High
The crawl itself is mechanical. The state enumeration is where judgment matters — missing a state means missing elements. The Explorer agent's code analysis is the critical path.
