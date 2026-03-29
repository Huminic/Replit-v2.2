# Harness V3 Specification — Complete System Redesign
**Date:** 2026-03-27
**Status:** SPECIFICATION — not yet implemented
**Source:** Full session learnings from SEC sprints, 16 T-sprints, 4 R-sprints, operator directives, drift analysis

---

## Why V3

The V2 harness verified execution quality (Ghost gates, pre-commit hooks, evidence trails). But it failed to verify COVERAGE quality — whether the right work was being done. We tested 173 ACs and still missed notification badges, file upload, trigger configs, and data observability. The operator asked 3 simple questions that exposed gaps the entire testing apparatus missed.

Root cause: sprints were defined from code audits, not from observed reality. The translation pipeline (manifest → code audit → ACs → tests) leaked coverage at every handoff.

V3 fixes this by making the map THE source of truth, not a derivative of it.

---

## Three Core Artifacts

### Artifact 1: UI Element Inventory (Ground Truth)

**What it is:** Every visible element in the application, documented by Playwright crawl AND screenshot visual verification.

**How it's built:**
1. Playwright MCP navigates to every page/tab/modal state
2. DOM crawler extracts: every button, input, tile, card, tab, link, dropdown, toggle — with data-testid, text content, position
3. Screenshot agent independently analyzes the screenshot of that same page and lists what it sees
4. A reconciliation step compares crawler output to screenshot analysis — mismatches flagged (CSS-hidden elements, loading states, rendering bugs, z-index overlaps)

**Output per page:**
```
Page: /sales
Tab: Dashboard
Screenshot: evidence/ui-inventory/sales-dashboard.png
Screenshot analysis: [agent description of what's visible]
DOM elements:
  - tile[data-testid="metric-total-leads"] "Total Leads (30d)" value="142"
  - tile[data-testid="metric-new-leads"] "New Leads" value="28"
  - card[data-testid="recent-activity"] "Recent Activity" items=5
  ...
Reconciliation: MATCH / MISMATCH [details]
```

**Sprint type:** U-series (UI Inventory)
**Frequency:** Once before testing cycle, once after remediation, once before launch

---

### Artifact 2: Data Observability Map

**What it is:** For every piece of data visible to a user, the complete path from origin to screen.

**Structure per data element:**
```
Element: Sales Dashboard → Total Leads (30d) tile
Display: "142"
Origin: warehouse_leads table (via VIN Solutions sync)
Flow:
  1. VIN Solutions → POST /api/sync/backfill → warehouse_leads INSERT
  2. /api/vin/leads/summary → SELECT COUNT(*) FROM warehouse_leads WHERE org_id=? AND created_at > 30d
  3. sales.tsx buildSalesMetrics() → leadSummary.totalLeads → tile value
API endpoint: GET /api/vin/leads/summary
DB table: warehouse_leads
Org filter: WHERE organization_id = ?
Refresh: Manual sync or cron
Staleness: "Synced Xh ago" badge on dashboard
Verification: Compare tile DOM value to raw API response
```

**What this enables:**
- When a tile shows wrong data, the map tells you exactly which layer to investigate
- When a new data source is added, the map shows all downstream consumers
- When an org_id filter is missing, the map identifies the exposure
- When testing, every data element has a verifiable chain

**Sprint type:** D-series (Data Observability)
**Frequency:** Built once, updated when data flows change

---

### Artifact 3: Cluster Registry

**What it is:** Every UI element maps to a cluster containing its full cross-dimensional stack.

**Cluster schema:**
```json
{
  "clusterId": "CL-SALES-METRICS-TOTAL-LEADS",
  "element": {
    "page": "/sales",
    "tab": "Dashboard",
    "testId": "metric-total-leads",
    "label": "Total Leads (30d)",
    "type": "metric-tile"
  },
  "FE": {
    "component": "client/src/pages/sales.tsx",
    "lines": "96-117",
    "function": "buildSalesMetrics()",
    "dependencies": ["useQuery(/api/vin/leads/summary)", "useQuery(/api/metrics/dashboard)"]
  },
  "BE": {
    "route": "server/routes/metrics.ts → GET /api/vin/leads/summary",
    "businessLogic": "Counts warehouse_leads with status filters for 30d window",
    "integrations": ["VIN Solutions via vin-safe-mcp (sync)", "warehouse_leads table (read)"]
  },
  "DT": {
    "tables": ["warehouse_leads"],
    "queries": ["SELECT COUNT(*) FROM warehouse_leads WHERE organization_id=? AND vin_created_at > NOW()-30d"],
    "schema": "shared/schema.ts → warehouseLeads",
    "orgFilter": "organization_id (required)"
  },
  "AU": {
    "minRole": "sales",
    "visibility": "org_admin, executive, sales_manager, sales, partner_admin, super_admin",
    "dataScope": "org-scoped (organization_id filter)"
  },
  "IN": {
    "service": "nexxus-app PM2 process",
    "envVars": ["DATABASE_URL"],
    "externalDeps": ["PostgreSQL (Supabase)", "VIN Solutions (via vin-safe-mcp on port 4003)"]
  },
  "dataFlow": "VIN Solutions → sync → warehouse_leads → /api/vin/leads/summary → sales.tsx → tile",
  "acceptanceCriteria": ["S-3.AC4", "S-3.AC5"],
  "testFile": "tests/e2e/s3-sales.spec.ts",
  "issues": ["I-114 (conversion rate change bug — fixed in SEC-03)"],
  "operatorManifest": "Sales → Metrics test needs thorough"
}
```

**What this enables:**
- Point at a cluster, the sprint writes itself (declared files, ACs, test targets, dependencies)
- Ghost can verify: "did the sprint touch all layers in the cluster?"
- Pre-sprint coverage: "does every cluster have at least one AC?"
- Regression detection: "a change to warehouse_leads affects these 7 clusters"
- Operator review: "show me every cluster that depends on VIN Solutions"

---

## How Sprints Work in V3

### Sprint Definition = Cluster Selection

Instead of writing sprint specs by hand, Captain selects clusters:

```
Sprint: SEC-XX
Clusters: CL-SALES-METRICS-TOTAL-LEADS, CL-SALES-METRICS-NEW-LEADS, ...
Auto-generated:
  - Declared files: [union of all cluster FE+BE files]
  - ACs: [union of all cluster acceptance criteria]
  - Test targets: [union of all cluster test files]
  - Dependencies: [union of all cluster external deps]
  - RBAC scope: [intersection of cluster AU requirements]
```

The sprint doesn't discover scope — the clusters define it.

### Ghost Gate Enhancement: Coverage Check

**Entry gate A-NEW:** "Every cluster in scope has an AC in this sprint's pre-exec."
**Exit gate B12:** "Every cluster in scope has a PASS/FAIL result in the post-sprint."

### New Gate: Pre-Sprint Verification Agent

Before every sprint, a verification agent:
1. Reads the sprint's cluster list
2. Reads the operator manifest items that map to those clusters
3. Reads the proposed ACs
4. Produces a gap report: "Cluster CL-X has no AC. Manifest item Y has no cluster."

If gaps exist, the sprint cannot start.

---

## Visual Verification Protocol

For every page in the UI inventory:

1. **Playwright crawl** → DOM element list (structural)
2. **Screenshot capture** → PNG of rendered page
3. **Screenshot analysis agent** → independently describes what it sees (visual)
4. **Reconciliation** → compare lists

```
Crawler says: 7 metric tiles
Screenshot agent says: 6 visible tiles (1 below fold)
Reconciliation: MISMATCH — 1 tile exists in DOM but not visible in viewport
Action: Check CSS, scroll position, responsive layout
```

This catches:
- Elements hidden by CSS but present in DOM
- Loading spinners that never resolve (DOM says "loading", screenshot shows spinner forever)
- Z-index overlaps where one element covers another
- Responsive breakpoint issues (element exists but pushed off-screen)

---

## Data Observability Checks

For every data element in the map:

1. **Source verification** — does the origin table/API have data?
2. **Flow verification** — does the intermediate API return the expected value?
3. **Display verification** — does the DOM show the same value as the API?
4. **Org isolation verification** — does the data change when org context changes?
5. **Staleness verification** — how old is the data, is there a freshness indicator?

These checks can be automated per cluster and run as a regression suite.

---

## Sprint Series in V3

| Series | Purpose | When |
|---|---|---|
| U-series | UI Inventory (Playwright + screenshot + reconciliation) | Start of cycle, post-remediation, pre-launch |
| D-series | Data Observability Map (flow tracing per data element) | After UI inventory |
| CL-series | Cluster Registry (element → full stack mapping) | After data map |
| S-series | Section sprints (remediation, using cluster scope) | After cluster registry |
| T-series | Testing sprints (verification, using cluster ACs) | After remediation |
| J-series | User journey sprints (US-001 through US-030 end-to-end) | After section tests |
| R-series | Remediation (fix defects found in T/J sprints) | As needed |
| L-series | Launch prep | After all gates clear |

---

## Execution Order for Restart

```
1. U-001: UI Inventory — Playwright + screenshots + visual verification
2. Operator reconciliation — confirms/corrects inventory against expectations
3. D-001: Data Observability Map — trace every data element origin→screen
4. CL-001: Cluster Registry — build element→stack mapping
5. Operator review — confirms clusters, marks priorities
6. Coverage verification — every cluster has ACs, every manifest item has a cluster
7. Testing waves (T-series) — with cluster-aware Ghost gates
8. Remediation (R-series) — cluster-scoped fixes
9. User journeys (J-series) — US-001 through US-030
10. T-023: Operator walkthrough + interactive comms test
11. L-001: Launch prep
```

---

## Harness Improvement Items (from earlier session)

These remain valid and should be implemented alongside V3:

1. Timing gate uses content timestamps, not file mtime
2. Evidence in one canonical location
3. Ghost writes cross-sign, not Dev
4. Sprint registration scripted
5. Ghost reads its own knowledge file
6. Watchdog persistent exceptions
7. Post-commit smoke test
8. Sprint dependency graph (parallel when possible)
9. Lessons-learned gate every N sprints
10. Structured operator issue intake
11. Sprint "not in scope" section
12. Post-sprint regression delta section
13. Auto-close issues from commit messages

---

## Multi-App Isolation (from earlier session)

When managing multiple apps:
- One conversation per app, no exceptions
- Active app declaration in session state
- Explicit context switch protocol
- App prefix validation on all file operations
- Separate memory namespaces per app

---

## What This Document Is

This is the specification for the next iteration of the harness. It should be:
1. Read at the start of the next session
2. Implemented as side-sprints before the main exercise restarts
3. Validated by the operator before any testing begins
4. Updated as we learn what works and what doesn't

The goal is not perfection — it's mechanical coverage verification at every handoff so coverage gaps are caught by the system, not by the operator asking questions.
