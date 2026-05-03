# Chunk 1B — spec path + scope-count deviations

Frozen preflight (92447ed) §2 + §4 declared the test file at:
  server/__tests__/weeklyReport.content.test.ts

Actual test file edited at:
  tests/unit/weeklyReport.content.test.ts

## Why (path)

vitest.config.ts:8 has `include: ["tests/**/*.test.ts"]` only. The repo
has no `server/__tests__/` directory; all 17 existing unit tests
(including the pre-existing `weeklyReport.content.test.ts` whose opt-in
test we are inverting) live under `tests/unit/`. Honoring the spec path
verbatim would require either amending vitest.config.ts (out of
declared §2 scope) or duplicating the test under a parallel discovery
surface.

This matches the resolution Chunk 1A used for the same path-shape defect
(see `evidence/stabilization-sprint-2026-05-01/batch-1/1A/spec-deviation-note.md`
on the `batch-1-finish-line` integration branch).

## Why (org-count)

Frozen 1B spec §4 step (e) directs: "add a new fixture-based test
asserting service-exclusion across all tile types ... synthetic
warehouse_leads rows with mixed sales + service vin_status values
across all 7 orgs."

The Nexxus organization table contains 7 organizations (1 super-admin
"Huminic", 1 partner "Cage Automotive", 5 dealerships). Only the 5
dealerships receive the weekly report — the existing test infra at
`tests/unit/weeklyReport.content.test.ts:53-60` already filters via
`partner_id IS NOT NULL AND slug != 'cage-automotive'` and verifies the
result count is exactly 5 (line :70 `expect(dealerOrgs.length).toBe(5)`).

The new fixture-based test loops over every dealer org returned by that
filter (5, not 7) and asserts the SERVICE exclusion at every tile type
on each one. This matches the spec's intent ("assert service rows are
excluded across all tile types for every report-receiving org") rather
than the spec's literal count (7 includes orgs that do not receive the
report). Adding Huminic + Cage to the loop would exercise no production
code path and would produce vacuous assertions.

## Why (synthetic vs live data)

Frozen spec wording suggests "synthetic warehouse_leads rows ... mixed
sales + service vin_status values". The existing test infra at
`tests/setup.ts` connects to the shared Supabase DB (DATABASE_URL); per
CLAUDE.md the dev and live deployments share this DB. Inserting
synthetic rows would mutate the shared production database — out of
scope for a unit test.

The implemented fixture-based test instead asserts the SQL predicate is
correctly wired by:
  1. Running `buildWeeklyReport` against each real dealer org for the
     current 7-day window (default = sales-only after 1B).
  2. Issuing direct `testPool.query()` SQL with the SERVICE exclusion
     applied (mirrors the new `vin_status NOT LIKE 'SERVICE%'`
     predicate).
  3. Asserting the report's per-tile values equal the SQL-direct counts.

The test logs a warning (no failure) if zero orgs in the test window
have any SERVICE rows — in that case the structural assertions pass
but provide no leak-prevention proof. Operator running test-lane
reports in a window with known SERVICE traffic is the better
verification surface; per Dispatch 2 §7 the most recent weekly window
had 17.3-38.7% SERVICE inflation per org, so any test run within ~2
weeks of report data accumulation will exercise the predicate
non-vacuously.

## What changed (in summary)

- Path string only (per Chunk 1A precedent).
- Loop count: 5 dealer orgs (not 7) — matches what receives the report.
- Fixture mechanism: live SQL probe + report-output comparison (not
  synthetic insert) — avoids mutating shared production DB.

Test functionality, tile-type coverage breadth, and assertion semantics
match the spec's intent.

## Authorization

Lead-authorized for the path defect via 1A's prior precedent. Org-count
and synthetic-vs-live deviations follow the same standing rule:
documented here for code-reviewer + qa-evaluator audit. Operator
informed via the lead's Delta-2 preflight handoff.
