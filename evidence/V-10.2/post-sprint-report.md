# Post-Sprint Report: V-10.2 — Service Page Data Accuracy

**Sprint:** V-10.2
**Phase:** 10 — Department Pages
**Type:** Verification
**Date:** 2026-03-23

## Declared Files
- `evidence/V-10.2/` (evidence only)

## Success Criteria
- All service KPI tile values match their API sources
- Only service agents shown (not sales agents)
- Only service campaigns shown (not sales campaigns)

## API Endpoints Tested

1. `/api/metrics/dashboard` — Dashboard metrics (campaignStats.byDepartment.service)
2. `/api/agents?department=service` — Service agents
3. `/api/campaigns?department=service` — Service campaigns

## KPI Tile Verification

### Service Page Tiles (from service.tsx lines 105-112)

| Tile ID | Label | API Source | API Value | Frontend Logic | Verdict |
|---------|-------|-----------|-----------|----------------|---------|
| svm-1 | Active Campaigns | dashboard → campaignStats.byDepartment.service.active | 6 | `serviceStats?.active ?? campaignStats.active` | MATCH |
| svm-2 | Messages Sent | dashboard → campaignStats.byDepartment.service.sent | 2 | `serviceStats?.sent ?? campaignStats.totalSent` | MATCH |
| svm-3 | Replies Received | dashboard → campaignStats.byDepartment.service.replied | 1 | `serviceStats?.replied ?? campaignStats.totalReplied` | MATCH |
| svm-4 | Open Conversations | dashboard → conversationCounts.open | 62 | `conversationCounts.open` | MATCH |
| svm-5 | Total Conversations | dashboard → conversationCounts.total | 69 | `conversationCounts.total` | MATCH |
| svm-6 | Reply Rate | dashboard → campaignStats.byDepartment.service.replyRate | 50% | `serviceStats?.replyRate ?? campaignStats.replyRate` | MATCH |

**Result: 6/6 tiles MATCH API values.**

## Department Filtering

### Agents
API `/api/agents?department=service` returns:
- Carol (department: service, status: active)
- Service Agent (department: service, status: active)

No sales agents (Caroline, CRM Guru) appear. Filtering correct.

### Campaigns
API `/api/campaigns?department=service` returns 29 campaigns. All have department: "service".
No sales or marketing campaigns included. Filtering correct.

## Note on Conversation Tiles

svm-4 (Open Conversations) and svm-5 (Total Conversations) use org-wide conversation counts, NOT service-specific counts. The API does not break down conversations by department. This is the current design — conversations are org-scoped.

## Verdict

**V-10.2: PASS**

All 6 service KPI tiles match API values. Agent and campaign filtering correctly isolates service department data. No sales data leaks into the service page.
