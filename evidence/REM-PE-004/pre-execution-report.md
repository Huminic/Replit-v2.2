# Pre-Execution Report — REM-PE-004

**Sprint:** REM-PE-004
**Date:** 2026-04-06

## Objective
Fix 8 metrics and trend calculation bugs identified in production evals. Covers change indicators, outbound drill-down data, loss patterns, freshness scores, trend charts, and appointment count consistency.

## Declared Files
- `server/routes/metrics.ts` — pipeline metric routes
- `server/vendorProxy.ts` — leads summary endpoint (BUG-05 change indicators)
- `server/storage.ts` — pipeline metric detail queries (BUG-PE01-003, BUG-03)
- `server/routes/insights.ts` — insights dashboard/reports (BUG-INS-08, BUG-INS-11)
- `client/src/pages/insights.tsx` — trend chart data (BUG-INS-10), freshness display (BUG-INS-11)
- `evidence/REM-PE-004/` — governance artifacts
- `issues.md` — debt/deferred items

**Note:** sprints.json declared files list is narrower (`server/routes/metrics.ts`, `client/src/pages/insights.tsx`, `evidence/REM-PE-004/`, `issues.md`). Additional files (`server/vendorProxy.ts`, `server/storage.ts`, `server/routes/insights.ts`) are required by the bug descriptions. Documenting this scope expansion.

## UI Changes
uiPermissions: NONE — No visual UI changes. Backend data fixes only. The insights.tsx change is to populate already-existing data structures with real computed values instead of hardcoded zeros.

## Acceptance Criteria (from sprints.json)
- REM-PE-004.AC1: Trend percentages calculated correctly with period-over-period comparison
- REM-PE-004.AC2: Outbound drill-down navigates to filtered detail view
- REM-PE-004.AC3: Loss patterns display with correct categorization
- REM-PE-004.AC4: Freshness score reflects actual data recency
- REM-PE-004.AC5: Appointments count matches between summary tile and detail view
- REM-PE-004.AC6: All metric tiles show consistent data across views

## Bug-to-AC Mapping
| Bug | Severity | AC | Fix Location |
|-----|----------|-----|-------------|
| BUG-05 | MEDIUM | AC1 | server/vendorProxy.ts — add previous 30-day period query, compute delta |
| BUG-PE01-003 | HIGH | AC2 | server/storage.ts — outbound detail join: add fallback to outbound_log.messageContent for non-campaign sends |
| BUG-03 | HIGH | AC5 | server/storage.ts — appointments count vs detail: normalize timezone handling |
| BUG-INS-08 | MEDIUM | AC3 | server/routes/insights.ts — loss patterns data already computed from sourceQualityTrends; verify data flow |
| BUG-INS-10 | LOW | AC6 | client/src/pages/insights.tsx — populate leadsChartData from dashboard API data |
| BUG-INS-11 | LOW | AC4 | server/routes/insights.ts + client/src/pages/insights.tsx — compute freshness from lead ages |

## Test Plan
- Manual API verification via curl for each endpoint after changes
- Build verification (npm run build)
- Restart and verify live endpoints respond correctly

## Ghost Entry Gate
ENTRY GATE: APPROVED

Rationale: Pre-execution report covers all 6 ACs, maps all 8 bugs to their fix locations, identifies scope expansion beyond declared files, and documents UI permission compliance. The scope expansion to include vendorProxy.ts, storage.ts, and insights.ts routes is justified by the bug locations. Implementation may proceed.
