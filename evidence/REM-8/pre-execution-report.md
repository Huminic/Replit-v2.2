# Pre-Execution Report: REM-8
Timestamp: 2026-03-19T21:35:00Z
Sprint: REM-8
Status: READY

## Objective
Fix Partner Admin org switch (I-088), implement webhook email notifications for VAPI + Tavus completion (I-087), and insert historical VAPI call log leads into VIN Solutions per store (I-086). Run full E2E, domain, comms, and usability tests. Stay in loop until 100% usability.

## Declared Files
- server/routes/auth.ts
- server/routes/webhooks.ts
- server/outbound.ts
- server/seed.ts
- scripts/enforcer-checklist.sh
- CLAUDE.md
- tests/e2e/domain-01-auth.spec.ts
- tests/e2e/helpers/auth.ts
- tests/e2e/live-comms.spec.ts
- evidence/REM-8/

## Success Criteria
- Login as durran@cageautomotive.com → accessibleOrganizations includes Cage + 5 dealerships, NOT Huminic
- Partner Admin can switch to all 5 dealerships successfully
- Super Admin still sees all orgs including Huminic
- VAPI end-of-call webhook triggers email to org admins via callMCP/Resend
- Tavus conversation completion triggers email to org admins via callMCP/Resend
- Emails include caller name, phone, transcript summary, recording link
- Idempotency: duplicate webhooks don't send duplicate emails
- VAPI call log leads from 5 JSON files inserted into VIN Solutions per store
- All Playwright tests pass: domain (browser+api), comms, e2e, catalog — 100% usability
- No regressions from DB-1 migration

## Constraints
- No frontend changes without user approval
- All MCP comms go through central-mcp at localhost:4002
- Email from address: notifications@huminic.ai
- VIN Solutions inserts use Durran Cage account
