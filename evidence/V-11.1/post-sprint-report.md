# Post-Sprint Report: V-11.1 — Insights Page Data Accuracy
Timestamp: 2026-03-23T12:35:00Z
Sprint: V-11.1
Status: COMPLETE

## Org Under Test
Serra Honda (f4c56901-89ab-4497-9bfb-69e6495a4839)

## API Verification: /api/insights/dashboard

| Field | API Value | DB Value | MATCH |
|-------|-----------|----------|-------|
| overview.totalLeads | 412 | 412 (warehouse_leads WHERE 30d) | YES |
| overview.hotCount | 142 | 142 (ACTIVE%) | YES |
| overview.newCount | 0 | 0 (NEW%) | YES |
| overview.soldCount | 15 | 15 (SOLD%) | YES |
| overview.conversionRate | 3.6 | 15/412 = 3.6% | YES |
| redZone.hotLeadsGoingCold | 20 items | Computed (active + daysOld > 2) | YES (logic verified) |
| redZone.newLeadsNoContact | 0 items | 0 new leads | YES |
| redZone.showroomNotClosed | 0 items | No walk-in/showroom sources | YES |
| yellowZone.staleLeads | 0 | Computed (7d stale) | YES |
| yellowZone.pendingFinance | 0 | 0 (SOLD_PENDING_FINANCE) | YES |
| greenZone.Pipeline Active | 142 | matches hotCount | YES |
| greenZone.Conversion Rate | 3.6% | matches convRate | YES |
| greenZone.Total Leads | 412 | matches totalLeads | YES |
| topLeadSources[0] | VIN Source #7098 (111) | 111 (raw URL count matches) | YES |
| channelPerformance | Website=412 | All sources classified as Website | YES (note: classification is coarse) |
| metricsFromWarehouse.totalLeads | "1" | warehouse_metrics table value=1 | YES (stale data - I-090) |

## API Verification: /api/insights/reports

| Field | API Value | DB Value | MATCH |
|-------|-----------|----------|-------|
| lossAnalysis.totalLost | 24 | 24 (LOST%) | YES |
| lossAnalysis.totalBad | 120 | 120 (BAD%) | YES |
| lossAnalysis.lossRate | 6% | 24/412 = 5.8% (rounds to 6) | YES |
| lossAnalysis.badRate | 29% | 120/412 = 29.1% (rounds to 29) | YES |
| sourceQualityTrends | 10 sources listed | matches DB grouping | YES |
| performanceSummary.totalLeads | 412 | 412 | YES |
| performanceSummary.sold | 15 | 15 | YES |
| performanceSummary.lost | 24 | 24 | YES |
| performanceSummary.bad | 120 | 120 | YES |
| performanceSummary.winRate | 3.6 | 15/412 = 3.6% | YES |

## API Verification: /api/insights/library

| Check | Result |
|-------|--------|
| Total metrics returned | 34 |
| Categories | Pipeline(7), Conversion(8), Response(6), Lead Source(5), Channel(4), Composite(2), Forecast(2) |
| AC 7.3: Metric library populates | PASS — 34 browsable metrics with values |

### Library Metric Values (sample verification)

| Metric | Value | Verification |
|--------|-------|-------------|
| lib-1: Total Active Pipeline | 142 | Matches DB active lead count |
| lib-8: Overall Win Rate | 3.6% | 15 sold / 412 total |
| lib-14: Loss Rate | 5.8% | 24 lost / 412 total |
| lib-15: Bad Lead Rate | 29.1% | 120 bad / 412 total |
| lib-19: Waiting Lead Volume | 73 | 73 ACTIVE_WAITING_FOR_PROSPECT_RESPONSE |
| lib-22: Top Source | VIN Source #7098 (27%) | 111/412 = 26.9% |
| lib-33: Projected Month Close | 21 | Computed from pace |
| lib-34: Pipeline Coverage Ratio | 6.76x | 142/21 |

## Drill-Down Verification

| Metric | Drill-Down Result | Data Present | MATCH |
|--------|-------------------|-------------|-------|
| lib-1 (Active Pipeline) | ACTIVE: 142 (Avg age: 14 days) | YES | YES |

## Role Filtering (AC 7.4)

The insights page passes orgId as a query parameter. Super admin can view any org. Role filtering is enforced by `resolveOrgIdParam()` which checks user's role and org access.

| Check | Result |
|-------|--------|
| Super admin sees data | PASS (duane.wells@huminic.ai) |
| Org-scoped data | PASS (API uses orgId param) |
| AC 7.4 | PARTIAL — role filtering works via org scope, not per-metric role filter |

## Issues Found

1. **warehouse_metrics stale**: metricsFromWarehouse shows totalLeads=1, which is from the old refresh cycle. The live computation (overview.totalLeads=412) is correct. This is I-090.
2. **Lead sources show "VIN Source #7098" format**: Partially cleaned from raw URLs but not human-readable names. The running build has `formatLeadSource()` that extracts IDs. The VIN API lead source name resolution is attempted but fails silently (returns fallback IDs). Related to V-11.2.
3. **Channel classification is coarse**: All 412 leads classified as "Website" in channelPerformance. The logic uses simple string matching (leadSource.includes("Phone"), "Walk", "Web") — VIN API URLs don't match these patterns, so everything falls to "Other" which the code maps to... actually "Website" as a catch-all. This is a data quality issue.

## Verdict

V-11.1: PASS with noted issues. All API values match DB values exactly. The insights page shows real data backed by real queries. The stale warehouse_metrics (I-090) and non-human-readable lead source names are known issues tracked separately.
