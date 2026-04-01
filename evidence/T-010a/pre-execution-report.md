# T-010a Pre-Execution Report

**Sprint:** T-010a — VIN Pipeline Restoration + Code Fixes + Widget CORS
**Created:** 2026-04-01T06:30:00Z
**Role:** orchestrator

## Objective

Fix code blockers preventing MVP critical flows: re-enable VIN lead pipeline with per-dealer configuration and safety guards, resolve widget CORS blocking dealer site embedding, investigate TeamBox message display and delta sync issues.

## Success Criteria

1. VIN pipeline active with correct per-dealer lead source names and safety guards
2. Widget JS loads cross-origin on dealer sites (CORS/CORP headers fixed)
3. I-202 root cause identified and resolved or documented
4. I-201 sync status confirmed or documented
5. Build passes, no regressions

## Pre-Flight Checklist

| Check | Status | Detail |
|-------|--------|--------|
| T-007 committed | PASS | 31e4589 |
| dev.huminicdev.com healthy | PASS | 200 |
| Worktree clean | PASS | No staged changes, no drift |
| Memory current | PASS | Session-state matches, Wave 7 |
| Last commit | PASS | aaacd7b — MVP sprint plan |

## Entry Gates

- A1: T-007 committed → 31e4589 ✓
- A2: dev.huminicdev.com healthy → 200 ✓

## Scope

### Issues Addressed
- I-194: VAPI→VIN lead creation disabled — re-enable with per-dealer vinLeadSourceName
- I-201: Delta sync not running — investigate and document
- I-202: TeamBox "No messages yet" — investigate root cause
- I-214: Widget CORS blocked on dealer sites — fix Helmet headers

### Files to Modify
- server/index.ts (Helmet override for widget routes)
- server/routes/public.ts (cache max-age)
- server/routes/webhooks.ts (re-enable VIN pipeline, add safety guards)
- issues.md (update statuses)

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| VIN leads sent to wrong dealer | Per-dealer vinLeadSourceName verified against operator-provided values |
| Test data pushed to VIN | 555-number guard + transcript-required guard added |
| Widget CORS breaks other routes | Override scoped to /widget/* and /api/widget/* only |
| Existing settings overwritten | Settings merge verified — all previous keys preserved |

## Decisions Made

1. Backfill assessed — 1 ringing-only call in 24h window, no transcript, not pushable. Rule: transcript required for VIN lead description.
2. "Unknown Caller" → firstName="AI", lastName="Lead" per VIN convention.
3. Tavus path gets same safety guards as VAPI (was live without them).
