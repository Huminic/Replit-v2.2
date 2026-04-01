# I-202 Investigation — TeamBox "No messages yet"

**Sprint:** T-010a
**Investigated:** 2026-04-01

## Root Cause

Data issue, not code bug. Frontend correctly shows "No messages yet" when messages.length === 0.

## Database State

| Metric | Count |
|--------|-------|
| Total conversations | 723 |
| With messages | 454 |
| With zero messages | 269 (37%) |

## Zero-Message Breakdown

| Category | Count | Action |
|----------|-------|--------|
| Test data (T-002–T-006 orphans) | 527 total (184 zero-msg) | Safe to delete — match test identifiers |
| Test phone (+1555...) | 7 | Safe to delete |
| Staff placeholders | 6 | Safe to delete |
| Voice calls (real VAPI, no transcript) | 57 | Keep — real calls, transcript not stored as messages |
| AI-chat (auto-provisioned, never used) | 15 | Keep — real users, auto-created on login |

## Cleanup Targets

527 test conversations + 539 associated messages are safely deletable. Match criteria:
- customer_email contains `example.com` or `playwright`
- customer_name contains "Test", "E2E", "Dedup Tester", "Flat Format Test"
- customer_phone starts with `+1555`

## UX Improvement Suggestion (Not in T-010a Scope)

Filter conversations where `lastMessageAt === null` from TeamBox list to hide empty conversations. File: `client/src/pages/teambox.tsx:758-762`. This would eliminate the "No messages yet" display without requiring data cleanup.

## Resolution

I-202 closed as data issue. Cleanup will be handled by T-010b/c/d cleanup scripts. UX fix deferred.
