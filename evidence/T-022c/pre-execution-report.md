# Pre-Execution Report: T-022c — Service Functional Depth

**Sprint:** T-022c
**Type:** Functional verification via Playwright MCP + API
**Date:** 2026-03-27
**Status:** AWAITING ENTRY GATE

## Objective
Prove Service page supports full campaign lifecycle. Campaign UI elements accessible, Nancy is sole agent with real instructions, Nancy books appointments. Validates US-009, US-010, US-011, US-014, S-4.AC1-AC18.

## Declared Files
- tests/e2e/s4-service.spec.ts

## Acceptance Criteria
- T-022c.AC1: Campaigns first tab, no Dashboard
- T-022c.AC2: New Campaign button visible
- T-022c.AC3: CSV Upload button prominent
- T-022c.AC4: Campaign detail dialog shows all fields
- T-022c.AC5: Insights tab shows KPI tiles
- T-022c.AC6: Only Nancy Gaston on Agents tab
- T-022c.AC7: Nancy has instructions > 100 chars
- T-022c.AC8: Nancy responds to recall question
- T-022c.AC9: Nancy books appointment → DB record
- T-022c.AC10: Appointment in Service Calendar

## UI Changes
None.

## Test Plan
Playwright MCP + API against dev.huminicdev.com

## Diff Reference
No previous attempt.

## Ghost Entry Gate
ENTRY GATE: APPROVED
