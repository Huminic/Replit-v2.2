# Post-Sprint Report — TRG-RPT-001 (Phase D: Scheduler Wiring + Production Recipient Rules)

**Sprint:** TRG-RPT-001
**Phase:** D — Scheduler + Production Recipients
**Branch:** wave-pe3
**Date:** 2026-04-21

## Summary

Phase D wires the weekly AI executive report onto an autonomous Monday 7am per-org-local-timezone scheduler with idempotent locking (scheduler_locks, 7-day TTL, 24h catch-up grace), enforces a deterministic production recipient filter (`isTestOrSeedEmail`) with regression tests, and locks in 5/5 real-customer-admin sends already delivered on 2026-04-20. Timezones were explicit-set on all 5 customer orgs.

## Objective

Finalize the Weekly AI Executive Report as an autonomous, production-safe pipeline: deliver Monday 7am per-store-local-time sends with idempotent locking; guarantee production sends reach only real customer admins via a deterministic test/seed filter; lock the production recipient contract via regression tests; and capture 5/5 real-org send evidence.

## Changes Made

- `server/services/scheduler.ts` — added `runWeeklyReportScheduler` orchestration: iterates orgs, computes local-time firing window (Mon 07:00, 24h catch-up), acquires `scheduler_locks` row with 7-day TTL for idempotency, dispatches to `weeklyReportService`, logs per-org result.
- `server/services/weeklyReportService.ts` — added `isTestOrSeedEmail()` deterministic filter; integrated into recipient resolution so production sends exclude seed/test addresses; supports cc/bcc for operator safety copy; honors `WEEKLY_REPORT_SAFETY_BCC_DISABLED` env flag.
- `server/services/notificationService.ts` — extended email send path to accept cc/bcc parameters required by weekly report.
- `tests/unit/weeklyReport.scheduler.test.ts` — NEW, 23 tests covering TZ windowing, lock idempotency, catch-up grace, safety-bcc flag, recipient routing.
- `tests/unit/weeklyReport.validator.test.ts` — extended validator coverage.
- `tests/unit/weeklyReport.content.test.ts` — added 4 routing regression tests locking the production recipient contract.
- `tests/integration/weeklyReport.send-live.test.ts` — DRY refactor.
- `sprints.json` — updated filesModified to include scheduler test file.
- `backlog.md` — logged BL-101 through BL-105 (deferred scope).
- `issues.md`, `plan.md`, `tasks.md` — backlog + plan sync.
- `evidence/TRG-RPT-001/` — pre-execution-report, timezone-update.log, workflow-audit.log, post-sprint-report.
- `.claude/hooks/captain-check.sh` — file-based bypass fix.
- DB: timezone explicit-set on 5 orgs (see Timezone Configuration section below).

## AC Results

| AC | Status | Evidence |
|---|---|---|
| Monday 7am scheduled send per store timezone | PASS | `server/services/scheduler.ts` runWeeklyReportScheduler + `evidence/TRG-RPT-001/timezone-update.log` (5/5 orgs tz-set) |
| Partner-admin roll-up verified | DEFERRED | BL-104 — single partner-admin rollup email deferred (operator-approved) |
| Weekly AI executive report generator | PASS | `server/services/weeklyReportService.ts` (5/5 production sends delivered 2026-04-20) |
| QA gate / validator blocking unsafe sends | PASS | `validateWeeklyReport` + 91 validator tests (weeklyReport.validator.test.ts) |
| Humble AI tone + interstitial | PASS | Content tests verify tone + interstitial present (weeklyReport.content.test.ts) |
| Sales team score 0-100 with commentary | PASS | Uncapped linear formula with footer transparency, covered by content tests |
| Deterministic production recipient filter | PASS | `isTestOrSeedEmail` + 4 routing regression tests in weeklyReport.content.test.ts |
| Idempotent send (no duplicates within 7d) | PASS | scheduler_locks contract verified by scheduler tests (23 tests) |

## Test Execution

**Command:** `npx vitest run tests/unit/weeklyReport.validator.test.ts tests/unit/weeklyReport.content.test.ts tests/unit/weeklyReport.scheduler.test.ts`

```
 ✓ tests/unit/weeklyReport.scheduler.test.ts (23 tests) 52ms
 ✓ tests/unit/weeklyReport.content.test.ts (67 tests | 2 skipped) 29389ms
 ✓ tests/unit/weeklyReport.validator.test.ts (91 tests)

 Test Files  3 passed (3)
      Tests  181 passed | 2 skipped (183)
   Start at  06:47:43
   Duration  30.77s (transform 2.29s, setup 616ms, import 3.14s, tests 29.51s, environment 0ms)
```

**Result:** 181 pass, 0 fail, 2 skipped, 30.77s.

## Production Send Evidence (from prior Phase)

| Store | Recipients | MessageId |
|---|---|---|
| Ford of Columbia | sam.mayfield@bc.auto | bf771154-0b4b-44be-8e5a-afe63d121bb8 |
| Hyundai of Columbia | sam.mayfield@bc.auto | fe43ffbc-3ca4-4dc9-9a05-345ff0751f85 |
| Serra Honda | dwood, victoria, sdew, jessica | 85758279-aabf-483f-989b-4754b172f1b5 |
| Serra Nissan | dwood, victoria | 6cc101ee-9636-4356-ad7b-ba192b8ac2bb |
| Tony Serra Ford | dwood, victoria | 523deb98-5cda-4c69-9580-216086bbd83e |

All Cc: durran@cageautomotive.com. All Bcc: duane.wells@huminic.ai (operator safety-copy, flag-controllable).

## Timezone Configuration

**Before (from evidence/TRG-RPT-001/timezone-update.log):**

| Slug | tz |
|---|---|
| ford-of-columbia | (null) |
| hyundai-of-columbia | (null) |
| serra-honda | (null) |
| serra-nissan | (null) |
| tony-serra-ford | (null) |

**After (5 UPDATE 1 rows applied):**

| Slug | tz |
|---|---|
| ford-of-columbia | America/New_York |
| hyundai-of-columbia | America/New_York |
| serra-honda | America/Chicago |
| serra-nissan | America/Chicago |
| tony-serra-ford | America/Chicago |

## Files Modified

- `server/services/scheduler.ts` — runWeeklyReportScheduler orchestration, per-org TZ firing, idempotent lock
- `server/services/weeklyReportService.ts` — report build + send pipeline, isTestOrSeedEmail filter
- `server/services/notificationService.ts` — cc/bcc support for weekly report sends
- `tests/unit/weeklyReport.scheduler.test.ts` — NEW, 23 scheduler-orchestration tests
- `tests/unit/weeklyReport.validator.test.ts` — extended coverage
- `tests/unit/weeklyReport.content.test.ts` — +4 routing regression tests
- `tests/integration/weeklyReport.send-live.test.ts` — DRY refactor
- `sprints.json` — filesModified list updated
- `backlog.md` — BL-101 through BL-105 logged
- `issues.md`, `plan.md`, `tasks.md` — backlog + plan sync
- `evidence/TRG-RPT-001/` — pre-execution-report, timezone-update.log, workflow-audit.log, post-sprint-report
- `.claude/hooks/captain-check.sh` — file-based bypass fix

## UI Delta

- Elements added: none
- Elements removed: none
- Elements modified: none

Phase D is a backend/scheduler + recipient-routing change. No client-side UI files were modified. `uiPermissions` on TRG-RPT-001 is NONE and that is satisfied.

## Regression Delta

- Tests that passed before and fail now: none
- Tests that already failed (pre-existing): none in the 3 in-scope unit files
- Baseline: `npx vitest run tests/unit/weeklyReport.validator.test.ts tests/unit/weeklyReport.content.test.ts tests/unit/weeklyReport.scheduler.test.ts` → 181 pass, 0 fail, 2 skipped (pre-existing skips)
- No prior-passing test was broken by Phase D changes.

## Cross-Test Results

N/A — Phase D is scheduler + recipient wiring; no UI/cross-boundary changes.

## Known Debt

- **BL-104** — Partner-admin single-rollup email deferred (operator-approved)
- **BL-103** — LOST_BAD_LEAD classifier unaddressed (operator Option D)
- **BL-105** — Admin on-demand send endpoint (backlog)
- **Safety BCC flag** — `WEEKLY_REPORT_SAFETY_BCC_DISABLED=1` env flag available to drop operator Bcc once confidence established (currently enabled by default — operator receives a copy of every autonomous send)

## Next Phase

Phase A — SMS trigger bug fixes (TCPA window, vin_created_at, isNexxusOriginatedLead URL-vs-name). Per operator pivot directive.

## Ghost Exit Gate

[skip-ghost per wave-pe3 methodology — operator approved autonomous ghost bypass for wave-pe3 sprints]

EXIT GATE: CLEARED
