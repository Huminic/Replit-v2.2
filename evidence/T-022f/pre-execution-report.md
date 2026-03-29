# Pre-Execution Report: T-022f — Landing & Widget Depth

**Sprint:** T-022f
**Type:** Functional verification via Playwright MCP + API
**Date:** 2026-03-27
**Status:** AWAITING ENTRY GATE

## Objective
Prove every dealer landing page works, universal widget provides complete engagement, appointments reach calendar, embed code works cross-origin. Validates US-002, US-003, US-013, S-8.AC1-AC14.

## Declared Files
- tests/e2e/s8-landing-widgets.spec.ts

## Acceptance Criteria
- T-022f.AC1: All 5 dealer pages load with correct store name
- T-022f.AC2: Widget menu shows 4 options
- T-022f.AC3: Widget chat produces org-scoped AI response
- T-022f.AC4: Widget form creates conversation
- T-022f.AC5: Widget appointment booking creates DB record
- T-022f.AC6: Appointment in store calendar
- T-022f.AC7: ?mode=video auto-launches fullscreen
- T-022f.AC8: Widget JS valid for all 5 dealers
- T-022f.AC9: Widget JS contains dealer name
- T-022f.AC10: Embed code works cross-origin
- T-022f.AC11: Invalid slug shows 404

## UI Changes
None.

## Test Plan
Playwright MCP + API against dev.huminicdev.com. Landing pages at /p/{slug}. No login for public pages.

## Diff Reference
No previous attempt.

## Ghost Entry Gate
ENTRY GATE: APPROVED
