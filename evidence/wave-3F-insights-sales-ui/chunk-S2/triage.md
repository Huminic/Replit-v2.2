# Chunk 3F-A-S2 — `/sales/leads` and `/widget-landing` 404 triage

**Date:** 2026-05-07
**Worktree branch:** worktree-agent-a41e402903791c656
**Outcome:** investigation-only — NO commit (all hits classified (c) escalate to 3F-B)
**Files touched:** none (no scope markers consumed)

## Method

Per the OPENING-bookend contract, executed three searches against the client codebase
to locate every reference to the two reported 404 paths:

```
grep -rn '/sales/leads' client/src/ --include='*.tsx' --include='*.ts'
grep -rn '/widget-landing' client/src/ --include='*.tsx' --include='*.ts'
grep -rn 'widget-landing\|sales/leads' client/src/ --include='*.tsx' --include='*.ts'
```

Then a broader pass against client/ and server/ to be sure:

```
grep -rn 'sales/leads\|widget-landing\|/widgetLanding\|widgetlanding' client/ server/ \
    --include='*.tsx' --include='*.ts' --include='*.jsx' --include='*.js'
```

Plus a navigation-config sweep:

```
grep -rn 'href=' client/src/components/ --include='*.tsx' --include='*.ts' \
  | grep -iE 'sales|widget|leads'
grep -rn "path:\\s*['\"][^'\"]*['\"]" client/src/components/ --include='*.tsx' --include='*.ts' \
  | grep -iE 'sales|widget|leads'
```

## Hit table

| # | File:Line | Match | Context | Classification |
|---|-----------|-------|---------|----------------|
| 1 | `client/src/App.tsx:25` | `widget-landing` | `import WidgetLandingPage from "@/pages/widget-landing";` — ES-module import; resolves to the page component file, not a route URL. The component is mounted ONLY at `/w/:slug` and `/p/:slug` (App.tsx:44–45). No route is registered for the bare path `/widget-landing`. | not-a-link (informational only — no code change) |

### Searches that returned ZERO hits in source code

| Pattern | Result |
|---------|--------|
| `/sales/leads` in `client/src/` | 0 hits |
| `/widget-landing` in `client/src/` (literal route string) | 0 hits |
| `sales/leads` anywhere in client/ + server/ source | 0 hits |
| `widget-landing` outside the import line | 0 hits in client/src/ (only docs, evidence, tests, issues.md) |

### Adjacent navigation hits inspected (for completeness)

| File:Line | Path | Status |
|-----------|------|--------|
| `client/src/components/layout/Sidebar.tsx:59` | `/sales` | Wired in App.tsx:70 — works |
| `client/src/components/layout/SubMenuManager.tsx:556–559` | `/sales`, `/sales?tab=agents`, `/sales?tab=insights`, `/sales?tab=calendar` | All wired — App.tsx serves `/sales` and the page reads `?tab=`. Works |
| `client/src/components/layout/MobileNavDropdown.tsx:59` | `/work-center?tab=leads` | Separate route (`/work-center`) NOT wired in App.tsx — different 404, OUT OF SCOPE for this chunk; flag for 3F-B if reproducible |

NONE of these point at `/sales/leads`. The closest analog is `/sales?tab=*` (query-param
based tabs), and that ROUTE works.

## Classification

Per the OPENING bookend categories:

- **(a) mechanical-fix-link** — *NONE.* No live `Link`, `href`, or programmatic `setLocation` in the code points to `/sales/leads` or `/widget-landing`.
- **(b) mechanical-add-route** — *NONE.* There is no link whose intent is clearly "go to /sales/leads"; nothing in the routing or navigation layer suggests a forgotten registration of these specific paths. The existing `/sales?tab=*` and `/w/:slug` patterns appear to be the intentional shapes.
- **(c) product-decision** — *BOTH `/sales/leads` AND `/widget-landing`.* The reported 404s come from manually-typed or externally-shared URL guesses, not from any live link in the application. Whether these URLs *should* resolve to a real page (e.g. a "Sales Leads" subview, or a public widget index) is a product/design decision, not a mechanical fix.

## Recommended escalation to Wave 3F-B

Two product-decision questions for the operator (NOT decided here):

1. **Should `/sales/leads` resolve?** If yes, options:
   - (i) Redirect `/sales/leads` → `/sales?tab=insights` (current closest existing surface) — minimal new UI
   - (ii) Build a dedicated leads-list page at `/sales/leads` — non-trivial, design-led
   - (iii) Leave as 404 (current behavior) — no change

2. **Should `/widget-landing` resolve?** If yes, options:
   - (i) Redirect `/widget-landing` → a dealer-picker or generic landing — requires new copy
   - (ii) Show an explainer/instruction page — content-led, design-led
   - (iii) Leave as 404 (current behavior) — `/w/:slug` and `/p/:slug` are the documented entry points and require a slug

Both are design/content decisions. They cannot be resolved by mechanical link/route edits.

## Δ1 — runnable test results (regression check after S1 only; no S2 code change)

### tsc

```
$ npx tsc --noEmit
tsc-exit=0
```

PASS.

### vitest unit suite

```
$ npx vitest run tests/unit/
Test Files  16 passed (16)
     Tests  452 passed | 2 skipped (454)
  Duration  35.71s
vitest-exit=0
```

PASS — same green state as after S1; no regression.

## Commit

NONE — no code change in S2. Per the OPENING-bookend rule "if NO code changed because all hits were (c) or non-link, do not create an empty commit", this chunk is investigation-only and contributes only this evidence file.

## Stop conditions encountered

None — the investigation completed cleanly. Both reported 404 URLs fall into category (c) and are escalated to Wave 3F-B for operator design-gate decision; that escalation matches the contract.

## Files touched

- `evidence/wave-3F-insights-sales-ui/chunk-S2/triage.md` (this file)
