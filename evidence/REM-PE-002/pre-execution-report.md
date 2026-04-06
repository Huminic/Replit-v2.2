# Pre-Execution Report: REM-PE-002

**Sprint:** REM-PE-002
**Date:** 2026-04-06

## Objective
Fix 5 bugs on the Insights page identified during production evaluations:
1. BUG-INS-05 (CRITICAL): Channel Intelligence crash — `row.deltaWin.includes('+')` throws on undefined
2. BUG-INS-06 (HIGH): Tab switching broken — useEffect reads URL params but tabs use React state
3. BUG-INS-07 (MEDIUM): Activity tab renders Dashboard — no Activity tab exists; this is a non-issue (tabs are Dashboard/Reports/Library/Hunches)
4. BUG-INS-04 (MEDIUM): CSV export toast-only — handleExport shows toast but never creates file
5. BUG-INS-12 (LOW): No sidebar link — Insights is accessed via /management?tab=insights and /insights route exists

## Declared Files
- client/src/pages/insights.tsx (bug fixes)
- evidence/REM-PE-002/ (artifacts)
- issues.md (if needed)

## UI Changes
uiPermissions: NONE — no visual UI changes. All fixes are internal logic (null-safety, export functionality).

## Acceptance Criteria
- REM-PE-002.AC1: Channel Intelligence section loads without crash
- REM-PE-002.AC2: Tab switching between Insights sub-tabs works without error
- REM-PE-002.AC3: CSV export button triggers file download
- REM-PE-002.AC4: Activity tab renders with data or empty state
- REM-PE-002.AC5: Sidebar link navigates to Insights page

## Test Plan
- Build verification: npm run build (no TypeScript errors)
- Manual verification via curl: https://dev.huminicdev.com/insights loads (200)
- Browser verification of tab switching and export functionality

## Notes
- Entry gate A1 (REM-PE-001 committed) is not met — REM-PE-001 is in_progress. Proceeding per explicit owner instruction.
- BUG-INS-07 (Activity tab): Investigation shows the Insights page has 4 tabs: Dashboard, Reports, Library, Hunches. There is no "Activity" tab. The bug may refer to the MobileNavDropdown or a misidentification. Will ensure all 4 tabs render correctly.
- BUG-INS-12 (Sidebar link): /insights route exists in App.tsx. SubMenuManager links to /management?tab=insights. MobileSidebar has direct /insights link. The sidebar link exists.

## Ghost Entry Gate

ENTRY GATE: APPROVED

Rationale: Sprint scope is clear. 5 bugs identified with specific line references. Declared files match sprint definition. Owner has explicitly directed execution despite A1 gate status.
