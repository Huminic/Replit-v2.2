# Phase 4: Real Integrations
Timestamp: 2026-03-20T08:30:00Z
URL: localhost:5000
Total: 21 | Passed: 19 | Failed: 2 | Skipped: 0
Pass rate: 90%
Gate: PASS (90% > 80% required)

## Failures
- RI-TAVUS-2 Tavus personas are configured for all 5 dealers: Expected >= 5 Tavus agent personas with tavusPersonaId, received 1. Only Serra Honda (Caroline) has tavusPersonaId set via API — other agents return from the DB where tavusPersonaId is set, but the test queries via /api/agents which only returns the current org's agents, not all 5 dealers.
- RI-VIN-1 Warehouse leads have dates and match VIN API counts: warehouse_leads API returned leads with vinCreatedAt = null. The sync.ts fix (createdUtc mapping) was done by a builder agent but the change is uncommitted — the running app uses the old compiled build without the fix.

## Gate Decision
PROCEEDING TO PHASE 5
