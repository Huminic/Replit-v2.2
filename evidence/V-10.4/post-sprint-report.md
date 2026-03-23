# Post-Sprint Report: V-10.4 — Management Page Data Accuracy

**Sprint:** V-10.4
**Phase:** 10 — Department Pages
**Type:** Verification
**Date:** 2026-03-23

## Declared Files
- `evidence/V-10.4/` (evidence only)

## Success Criteria
- Demand Score is calculated from real data, not hardcoded
- All tile values match API sources
- User list matches /api/users response

## API Endpoints Tested

1. `/api/metrics/dashboard` — Dashboard metrics (pipeline, agentCounts, conversationCounts, campaignStats)
2. `/api/activity-log` — Activity log (50 entries returned)
3. `/api/hunches` — AI hunches (5 entries returned)
4. `/api/users` — User list (11 users)

## KPI Tile Verification

### Management Page Tiles (from management.tsx lines 130-138)

| Tile ID | Label | API Source | API Value | Frontend Logic | Verdict |
|---------|-------|-----------|-----------|----------------|---------|
| mgmt-1 | Active Pipeline | pipeline.activePipeline | 71 | `String(pipeline?.activePipeline ?? 0)` | MATCH |
| mgmt-2 | Active Agents | agentCounts.active | 5 | `String(metrics?.agentCounts?.active ?? 0)` | MATCH |
| mgmt-3 | Total Conversations | conversationCounts.total | 69 | `String(metrics?.conversationCounts?.total ?? 0)` | MATCH |
| mgmt-4 | Open Escalations | pipeline.openEscalations | 14 | `String(pipeline?.openEscalations ?? 0)` | MATCH |
| mgmt-5 | Outbound Sent (24h) | pipeline.outboundSent24h | 5 | `String(pipeline?.outboundSent24h ?? 0)` | MATCH |
| mgmt-6 | Active Campaigns | campaignStats.active | 18 | `String(metrics?.campaignStats?.active ?? 0)` | MATCH |
| mgmt-7 | Demand Score | **CALCULATED** | 30 | `Math.min(100, Math.max(0, Math.round(raw)))` | MATCH |

**Result: 7/7 tiles MATCH API values.**

## Demand Score Analysis (AC 6.5)

The Demand Score is **calculated, NOT hardcoded**. Source code (management.tsx lines 122-128):

```typescript
const raw = (pipeline.activePipeline * 0.4) + (pipeline.outboundSent24h * 0.3) + (pipeline.appointmentsToday * 0.3);
return Math.min(100, Math.max(0, Math.round(raw)));
```

Calculation with current API values:
- activePipeline = 71, weight 0.4 = 28.4
- outboundSent24h = 5, weight 0.3 = 1.5
- appointmentsToday = 0, weight 0.3 = 0
- Raw = 29.9, clamped to [0,100] = **30**

The score changes dynamically as pipeline/outbound/appointments change. Not a static "8.4".

## User List Verification

`/api/users` returns 11 users. Management page renders this as the team overview.

## Activity Log

`/api/activity-log` returns 50 real activity entries (org_updated, user_updated, etc.). Data is live from the database.

## AI Hunches

`/api/hunches` returns 5 hunch entries. Generate button triggers `POST /api/hunches/generate`.

## Management Access Control

Management page has a guard (management.tsx line 81): `canAccessManagement(currentRole)`. Redirects non-management roles to `/`.

## Verdict

**V-10.4: PASS**

All 7 management KPI tiles match API values. Demand Score is dynamically calculated from live pipeline data using a weighted formula. No hardcoded values. Activity log and hunches are real database data.
