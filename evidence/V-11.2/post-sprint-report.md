# Post-Sprint Report: V-11.2 — Pipeline and Lead Source Accuracy
Timestamp: 2026-03-23T12:45:00Z
Sprint: V-11.2
Status: COMPLETE

## Pipeline Verification

### /api/metrics/pipeline

| Metric | API Value | DB Query | MATCH |
|--------|-----------|----------|-------|
| activePipeline | 71 | COUNT warehouse_leads WHERE 14d + not LOST/SOLD/BAD/SERVICE/DUPLICATE/NON_CUSTOMER | YES |
| appointmentsToday | 0 | COUNT appointments WHERE scheduled + today | YES |
| openEscalations | 14 | COUNT tasks WHERE todo + (escalation OR unsent_message) | YES |
| outboundSent24h | 5 | COUNT outbound_log WHERE sent + 24h | YES |

### Pipeline Details (/api/metrics/pipeline/details)
Endpoint accepts `?metric=active_pipeline|appointments_today|open_escalations|outbound_sent`.
Each returns the underlying rows for drill-down.

### Pipeline Scope Difference: Two Different Pipeline Counts

The application has TWO pipeline metrics with different definitions:

1. **Main page pipeline (`/api/metrics/pipeline`)**: 71 active leads in last 14 days, excluding LOST/SOLD/BAD/SERVICE/DUPLICATE statuses.
2. **Insights dashboard (`/api/insights/dashboard`)**: 142 active leads in last 30 days, using `isActiveLead()` which matches `ACTIVE_*` statuses only.

These are DIFFERENT windows (14d vs 30d) and DIFFERENT status filters. Both are correct for their purpose:
- Main page: Short-term actionable pipeline (14 days)
- Insights: Broader activity view (30 days, ACTIVE only)

This is NOT a bug — it's an intentional difference in scope. However, the UI should clarify the time window.

### /api/vin/leads/summary (used by Sales page)

| Metric | API Value | DB Value | MATCH |
|--------|-----------|----------|-------|
| totalLeads | 412 | 412 | YES |
| activeLeads | 142 | 142 | YES |
| newLeads | 0 | 0 | YES |
| soldLeads | 15 | 15 | YES |
| lostLeads | 24 | 24 | YES |
| waitingForResponse | 73 | 73 (ACTIVE_WAITING_FOR_PROSPECT_RESPONSE) | YES |
| appointments | 2 | 2 (from appointments table, today range) | YES |
| conversionRate | 3.6 | 15/412 = 3.6% | YES |

## Lead Source Accuracy

### DB Lead Source Values
Raw database values are VIN Solutions API URLs:
```
https://api.vinsolutions.com/leadsources/id/7098?dealerid=21043
https://api.vinsolutions.com/leadsources/id/3743779?dealerid=21043
...etc
```

### API Lead Source Labels
The running application transforms these to "VIN Source #7098" format via `formatLeadSource()` in the compiled build. The source code in this branch's `server/routes.ts` does NOT have this transformation — it exists in the main repo's decomposed `server/routes/insights.ts`.

### Lead Source Count Cross-Check

| Lead Source (API label) | API Count | DB Count (raw URL) | MATCH |
|-------------------------|-----------|-------------------|-------|
| VIN Source #7098 | 111 | 111 | YES |
| VIN Source #3743779 | 36 | 36 | YES |
| VIN Source #3750035 | 29 | 29 | YES |
| VIN Source #106 | 25 | 25 | YES |
| VIN Source #3897825 | 19 | 19 | YES |
| VIN Source #123 | 18 | 18 | YES |
| VIN Source #6371 | 16 | 16 | YES |
| VIN Source #3599907 | 15 | 15 | YES |

All counts match.

### AC 7.6: No Raw API URLs in Display
- **PARTIAL PASS**: The running build shows "VIN Source #7098" (not the raw URL), but these are still not human-readable names like "AutoTrader" or "Cars.com". The `formatLeadSource()` function attempts to resolve via `getLeadSourceMap()` (which calls `vin_get_lead_sources` via MCP), but the resolution silently fails and falls back to the ID-based label.
- **Root cause**: The VIN Solutions lead source API lookup either times out or returns data in a format not matching the cache key. The fallback "VIN Source #NNNNN" is functional but not the intended outcome.

## Issues Found

1. **Lead source names not human-readable**: "VIN Source #7098" instead of actual source name (e.g., "AutoTrader"). The VIN API lead source resolution fails silently. This should become a backlog item for data enrichment.
2. **Pipeline scope ambiguity**: Two different pipeline counts (71 vs 142) with different time windows. Not a bug, but could confuse users.
3. **Channel classification broken for VIN URLs**: channelPerformance classifies all leads as "Website" because the URL-based leadSource values don't match the simple string patterns for "Phone", "Walk", "Web".

## Verdict

V-11.2: PASS with noted issues. All pipeline and lead source counts match DB exactly. Lead sources show IDs instead of names (partial AC 7.6 pass). No raw API URLs exposed to users (the formatting layer works). Pipeline values are real numbers, not zeros.
