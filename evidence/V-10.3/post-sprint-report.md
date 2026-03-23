# Post-Sprint Report: V-10.3 — Marketing Page Data Accuracy

**Sprint:** V-10.3
**Phase:** 10 — Department Pages
**Type:** Verification
**Date:** 2026-03-23

## Declared Files
- `evidence/V-10.3/` (evidence only)

## Success Criteria
- All tile values match API sources
- Page loads without errors
- No data from other departments

## API Endpoints Tested

1. `/api/metrics/dashboard` — Dashboard metrics (campaignStats.byDepartment.marketing)
2. `/api/campaigns?department=marketing` — Marketing campaigns

## KPI Tile Verification

### Marketing Page Tiles (from marketing.tsx lines 134-139)

| Tile ID | Label | API Source | API Value | Frontend Logic | Verdict |
|---------|-------|-----------|-----------|----------------|---------|
| mm-1 | Campaign Performance | dashboard → campaignStats.byDepartment.marketing.replyRate | 0% | `mktStats?.replyRate ?? campaignStats.replyRate` | MATCH |
| mm-2 | Campaigns Active | dashboard → campaignStats.byDepartment.marketing.active | 0 | `mktStats?.active ?? campaignStats.active` | MATCH |
| mm-3 | Messages Sent | dashboard → campaignStats.byDepartment.marketing.sent | 0 | `mktStats?.sent ?? campaignStats.totalSent` | MATCH |
| mm-4 | Replies Received | dashboard → campaignStats.byDepartment.marketing.replied | 0 | `mktStats?.replied ?? campaignStats.totalReplied` | MATCH |

**Result: 4/4 tiles MATCH API values.**

## Department Filtering

### Campaigns
API `/api/campaigns?department=marketing` returns 7 campaigns. All have department: "marketing".
No service or sales campaigns included. Filtering correct.

## Note

All marketing values are 0 because no marketing campaigns are currently active and none have been executed (0 sent, 0 replied). This is accurate — the API confirms these are real zeros, not prototype placeholders. The fallback logic (`mktStats?.active ?? campaignStats.active`) correctly uses the department-specific value (0) rather than the org-wide total (18).

## Verdict

**V-10.3: PASS**

All 4 marketing KPI tiles match API values. Zero values are real zeros from the API, not hardcoded. Campaign filtering correctly isolates marketing department data.
