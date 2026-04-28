# Test-coverage gap — Priority #6 Commit B-followup

**Date:** 2026-04-28
**Branch:** wave-pe3
**Commit B-followup:** (this commit) suppresses the misleading delta on `sm-3 Active Pipeline (14d)` per code-reviewer's window-mismatch finding on `70dd468`.

## What the dispatch asked for

> "Add a small test file (or extend an existing one) under `tests/unit/` or `tests/integration/` that asserts the rendering helper returns `—` for the four tiles with `change: null` (sm-3, sm-4, sm-5, sm-7). If the tile rendering is too tightly bound to React for unit testing, write a minimal Playwright MCP component-level test or a JSDOM-based snapshot test of the render function. Whatever shape, it must run inside `npm run test:unit` (or `test:integration`) green-on-merge. If it genuinely cannot be done without new infra, document the gap in `evidence/priority-6-metrics-polish/commit-B-followup/test-coverage-gap.md` and leave the regression as Playwright-only (we'll capture it post-rebuild)."

## Why coverage was deferred to Playwright (post-rebuild)

The unit-test path requires touching new client-side files which is outside the dispatch's "do NOT touch any other file" clause. The dispatch's fallback ("document the gap and leave the regression as Playwright-only") was selected to honor that boundary. Detail follows.

### Test infra constraints (verified 2026-04-28)

1. **`tests/setup.ts` runs in Node, not JSDOM.**
   - `vitest.config.ts` line 7: `environment: "node"`.
   - No JSDOM globals, no `document`, no `window`. React component rendering would fail without infrastructure work.

2. **No `@/` (client) alias is registered in vitest.config.ts.**
   - `vitest.config.ts` lines 13-18 only register `@shared` and `@server`.
   - A test cannot do `import { buildSalesMetrics } from "@/pages/sales"`.
   - A relative import `from "../../client/src/pages/sales"` would resolve, but pulling `sales.tsx` into a Node test environment also pulls every transitive client import (lucide-react, wouter, react-query, JSX) — many of which fail at module-load in the Node env.

3. **`buildSalesMetrics` is currently a module-internal function.**
   - It is not exported from `client/src/pages/sales.tsx`. To unit-test it, one of the following is required:
     - **Path A** — extract the helper to a sibling module `client/src/pages/sales.metrics.ts` with no React imports (pure data + lucide icon refs). Then `tests/unit/sales-metrics.test.ts` can `import` it via a relative path. Requires creating one new client file.
     - **Path B** — add a `@/` alias to `vitest.config.ts` AND add JSDOM env AND export the helper from `sales.tsx`. Three infra changes.
     - **Path C** — Playwright assertion against the rendered DOM on a running runtime.

4. **The dispatch said "do NOT touch any other file."**
   - Path A creates a new file under `client/src/pages/`. Path B edits `vitest.config.ts` and adds a jsdom dep. Both go beyond the dispatched bug-fix surface.
   - Per Core Value #13 (IF UNSURE — STOP) and the dispatch's explicit fallback, the gap is documented here instead of self-authorized.

## Path C plan — Playwright capture post-rebuild

The dispatch already plans an A+B+C batched rebuild + Playwright `/sales` screenshot capture. The regression check folds into that step:

- **Manual verification trigger.** After the batched rebuild lands, run Playwright MCP against `https://dev.huminicdev.com/sales` as `serra_honda@huminic.ai` (read-only login is allowlisted).
- **Assertions to capture.**
  1. `[data-testid="metric-tile-sm-3"]` (Active Pipeline (14d)) — `[data-testid="metric-change-sm-3"]` text equals `—` and there is no `vs prior 14d` / `vs last 30d` sibling.
  2. `[data-testid="metric-tile-sm-4"]` (Waiting on Response) — `metric-change-sm-4` text equals `—`, no window suffix.
  3. `[data-testid="metric-tile-sm-5"]` (Appointments Set) — `metric-change-sm-5` text equals `—`, no window suffix.
  4. `[data-testid="metric-tile-sm-7"]` (Conversion Rate) — `metric-change-sm-7` text equals `—`, no window suffix.
  5. `[data-testid="metric-tile-sm-1"]`, `sm-2`, `sm-6` — `metric-change-*` matches `^[+-]?\d+%$` AND a sibling text node containing `vs last 30d` exists.
  6. The dashboard renders no `+0%` and no `vs prior 14d` text anywhere within `[data-testid="sales-page"]`.
- **Evidence path.** `evidence/priority-6-metrics-polish/commit-C/playwright-sales-tiles-after-rebuild.{spec.ts,png,trace}`.

Note: the Commit B render layer adds `data-testid="metric-change-${id}"` on the change span, which makes the Playwright assertions clean and stable.

## Follow-up if Playwright also proves impractical

If post-rebuild Playwright capture reveals an unforeseen blocker (auth flow change, dev-runtime drift, etc.), the next session should pursue Path A (extract `buildSalesMetrics` to `client/src/pages/sales.metrics.ts`, re-export from `sales.tsx`, write `tests/unit/sales-metrics.test.ts`) under fresh operator authorization. Path A is the smallest infra cost and gives durable regression coverage of the tile-shape contract independent of any runtime.

## Risk assessment

The deferred coverage is **medium-low** risk:

- The bug class (hard-coded `change: 0` rendering as `+0%`) is now structurally impossible at the type level for tiles that pass `change: null`. TypeScript will reject any future numeric-zero placeholder in those slots.
- The window-mismatch class (e.g. labeling a 14d tile with a 30d delta) would resurface only if a future edit re-introduces a non-null `change` AND a `windowLabel` mismatch on `sm-3`. The inline comment block on `sm-3` documents the constraint and the issue (I-NEW-2026-04-28-A) tracks the proper fix.
- The two-deltas-of-proof rule is satisfied for this commit by:
  - Δ1 — `npx tsc --noEmit` clean + `npm run test:unit` 412/416 baseline preserved (re-runnable now).
  - Δ2 — source diff visible in commit; `change` flipped from `summary.activeLeadsChange` to `null`, `windowLabel: 'vs prior 14d'` removed, comment block corrected.

The Playwright DOM-level assertion is **additional** coverage scheduled for the post-rebuild step; it does not gate the local commit.
