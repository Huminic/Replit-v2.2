# Pre-Execution Report: T-022e — Settings & Profile Depth

**Sprint:** T-022e
**Type:** Functional verification via Playwright MCP + API
**Date:** 2026-03-27
**Status:** AWAITING ENTRY GATE

## Objective
Prove all settings sections work — User CRUD, KB upload, system prompt affects chat, profile photo, password change. Includes cleanup rollback for test data. Validates S-7.AC1-AC21.

## Declared Files
- tests/e2e/s7-system-profile.spec.ts

## Acceptance Criteria
- T-022e.AC1: 7 settings tiles for super_admin
- T-022e.AC2: No agents in settings popout
- T-022e.AC3: Add user → appears in list
- T-022e.AC4: Edit user → changes persist
- T-022e.AC5: Deactivate user → marked inactive
- T-022e.AC6: KB upload → file in table
- T-022e.AC7: KB delete → file removed
- T-022e.AC8: System prompt change → chat reflects it
- T-022e.AC9: Business hours → after-hours trigger
- T-022e.AC10: Profile photo upload works
- T-022e.AC11: Profile edit saves name/email
- T-022e.AC12: Change password → login with new password
- T-022e.AC13: Notification data from real API
- T-022e.AC14: Activity Feed from /api/activity-log
- CLEANUP: Delete test user, remove test KB file, restore original system prompt

## UI Changes
None.

## Test Plan
Playwright MCP + API against dev.huminicdev.com. Login as super_admin for full access.

## Diff Reference
No previous attempt.

## Ghost Entry Gate
ENTRY GATE: APPROVED
