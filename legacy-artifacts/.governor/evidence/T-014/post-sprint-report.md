# T-014 Post-Sprint Report: Data Flow & Metrics

**Sprint:** T-014
**Executed:** 2026-03-26T23:30:49Z
**Target:** https://dev.huminicdev.com
**Method:** Playwright MCP browser + in-browser API calls

---

## AC Results Summary

| AC | Description | Result | Notes |
|----|-------------|--------|-------|
| AC1 | Widget form -> TeamBox | PASS | POST /api/widget/contact returns {success:true, conversationId}. Conversations appear in /api/conversations with channel:"form" |
| AC2 | Landing page form -> TeamBox | PASS | Same endpoint, same behavior. Both widget and landing page forms use /api/widget/contact |
| AC3 | Sales metric tiles match API | PASS (with note) | 6/7 tiles match /api/vin/leads/summary exactly. "Active Pipeline" (111) sources from /api/metrics/dashboard pipeline, not activeLeads (223). See metrics-comparison.md |
| AC4 | Recent Activity from API | CONDITIONAL PASS | /sales Recent Activity section shows hardcoded demo data ("New lead from website", "Sales Agent qualified lead #1042"). API /api/activity-log returns real timestamped entries (campaign_created, auto_greeting_sent). The System Log tab (/management?tab=activities) shows the real API data correctly. |
| AC5 | Conversion Rate change is 0 | FAIL | Conversion Rate tile shows "+3.5%" as the change indicator. This is the absolute rate, not a change delta. API has no conversionRateChange field. Should show 0 or no change. |
| AC6 | Insights renders across sections | PASS | All 4 sections render data: /sales?tab=insights (1126 chars), /service?tab=insights (1315 chars), /marketing?tab=insights (1128 chars), /management?tab=insights (1143 chars). No loading spinners, no empty states. |
| AC7 | System Log | PASS | /management?tab=activities shows timestamped entries matching API activity-log. Entries include "Created campaign S-4 Test Campaign", "auto greeting sent", "login failed" with relative timestamps. |
| AC8 | Hunches generate | PASS | /management?tab=hunches shows 5 AI-generated hunch cards with confidence scores (78%-95%), categories (pattern/recommendation/alert), and Accept/Dismiss buttons. "Generate Hunches" button visible. |
| AC9 | AI Chat drill-down | PASS | Clicking "Active Pipeline" metric tile on home page opens a dialog showing "showing first 100 of 111 records" with Name, Status, Vehicle, Lead ID columns. Breakdown data renders correctly. |
| AC10 | Billing summary baseline | PASS | GET /api/billing/summary returns {configured: false, message: "Billing not configured"}. Expected state documented. |
| AC11 | Billing plans baseline | PASS | GET /api/billing/plans returns 6 plans: Spark, JumpStart, Basic, Pro, Max, Early Adopter Custom. All status: "published". |
| AC12 | Marketing metrics without hardcoded trends | PASS | Marketing Dashboard tiles show "Campaign Performance 0%", "Campaigns Active 0", "Messages Sent 0", "Replies Received 0". No "0% up" hardcoded trend pattern. SEC-05 fix confirmed. |

---

## Scorecard

- **PASS:** 10
- **CONDITIONAL PASS:** 1 (AC4 — Recent Activity on /sales uses demo data, but System Log uses real data)
- **FAIL:** 1 (AC5 — Conversion Rate change shows absolute rate +3.5% instead of 0)

---

## AC Detail

### AC1-AC2: Form -> TeamBox

**Method:** POST to /api/widget/contact (no auth required)

```json
Request: {slug: "serra-honda", name: "T014 AC1 Test", email: "t014ac1@test.com", message: "T-014 widget form test"}
Response: {"success": true, "conversationId": "85ffcc33-dfe4-4111-9ffc-94e62ec8b159"}
```

Verified via GET /api/conversations — found 4 T014 test conversations with channel:"form", confirming form submissions flow into TeamBox conversation list.

Conversation IDs created during test:
- 85ffcc33-dfe4-4111-9ffc-94e62ec8b159 (T014 AC1 Test, t014ac1@test.com)
- 03467599-ba5f-47df-a985-12823e092c75 (T014 AC1 Test, t014ac1@test.com)
- 9f0781c6-b93b-4dc9-aa81-7505b5d25be5 (T014 Test, test@test.com)
- 8f41efb1-ca63-4810-94b7-ae64b48b16eb (T014 Test, test@test.com)

### AC3: Sales Metric Tiles

See [metrics-comparison.md](metrics-comparison.md) for tile-by-tile table.

### AC4: Recent Activity

DOM Recent Activity section on /sales Dashboard shows:
1. "New lead from website" — 5 min ago
2. "Sales Agent qualified lead #1042" — 12 min ago
3. "Follow-up call completed" — 28 min ago
4. "Proposal sent to David Jackson" — 1 hour ago
5. "Test drive scheduled - Emily Davis" — 2 hours ago

API /api/activity-log?limit=10 returns (first 3):
1. campaign_created — "S-4 Test Campaign" — 2026-03-26T17:09:48Z
2. auto_greeting_sent — conversation/Caroline — 2026-03-26T12:39:31Z
3. login_failed — user/duane.wells@huminic.ai — 2026-03-26T00:04:40Z

**Assessment:** The /sales Recent Activity section shows placeholder/demo data, not the actual API activity log. The /management?tab=activities (System Log) correctly displays the real API data. The /sales Recent Activity may be intentionally showing sales-specific mock data or may be a separate feed not connected to the activity-log API.

### AC5: Conversion Rate Change

DOM shows: Conversion Rate tile value "3.5%" with change indicator "+3.5% vs last 30d"
API shows: conversionRate: 3.5 (no conversionRateChange field)

The change indicator displays the absolute conversion rate as if it were a delta. All other tiles with change=0 correctly show "0%". The Conversion Rate tile appears to use the rate value itself as the change when no explicit change field exists. This is a **bug** — the change should show 0 (matching the pattern of all other tiles) or be absent.

### AC6: Insights Across Sections

All 4 sections rendered without loading or empty states:
- /sales?tab=insights — Immediate Action Required, Pipeline Health, Performance Scorecard
- /service?tab=insights — Service Metrics, same insight panels
- /marketing?tab=insights — Same insight panels
- /management?tab=insights — Same insight panels (Management tab label: "Insights")

### AC7: System Log

/management?tab=activities displays real activity-log API data with relative timestamps:
- "Created campaign S-4 Test Campaign in service" — about 6 hours ago
- "auto greeting sent" — about 11 hours ago
- "login failed" — about 23 hours ago
- Multiple campaign entries from 2 days ago

Matches API /api/activity-log data exactly.

### AC8: Hunches

/management?tab=hunches displays 5 hunch cards:
1. "Marketing Department Is Severely Under-Resourced" — pattern, 82%, new
2. "Consolidate Duplicate Test Campaigns to Reduce Noise" — recommendation, 95%, new
3. "Voice Channel Drives Significant Inbound Volume" — pattern, 78%, new
4. "96% of Conversations Remain Unresolved (Open)" — alert, 90%, new
5. "Campaigns Sending Zero Messages Despite Active Status" — alert, 92%, new

Each has Accept/Dismiss buttons. "Generate Hunches" button visible at top.

### AC9: AI Chat Drill-Down

Clicking "Active Pipeline" metric tile on home page (/) opens a dialog/modal:
- Title: "Active Pipeline"
- Description: "Leads created in the last 14 days, excluding Lost, Sold, and Duplicate statuses"
- Count: 111 (matches dashboard metric)
- Table: "showing first 100 of 111 records" with columns: Name, Status, Vehicle, Lead ID
- Includes "View Contact" links

### AC10-AC11: Billing Baseline

See [billing-baseline.json](billing-baseline.json).

- /api/billing/summary: {configured: false, message: "Billing not configured"}
- /api/billing/plans: 6 plans (Spark, JumpStart, Basic, Pro, Max, Early Adopter Custom), all published

### AC12: Marketing Metrics

Marketing Dashboard tab shows:
- Campaign Performance: 0%
- Campaigns Active: 0
- Messages Sent: 0
- Replies Received: 0

No "0% up" hardcoded trend indicators found. The SEC-05 fix (removal of hardcoded trend fields) is confirmed working.

---

## Issues Found

1. **AC5 BUG:** Conversion Rate change indicator shows "+3.5%" (absolute rate) instead of 0% or no change. All other tiles correctly show "0% vs last 30d" because API provides explicit `*Change` fields. The Conversion Rate tile falls back to the rate value when no change field exists.

2. **AC4 OBSERVATION:** /sales Recent Activity section displays demo/placeholder data rather than real activity-log API data. Not necessarily a bug if this is intentional demo content, but worth noting. The real data is correctly displayed in /management?tab=activities.

---

## Evidence Artifacts

- [metrics-comparison.md](metrics-comparison.md) — AC3 tile-by-tile table
- [billing-baseline.json](billing-baseline.json) — AC10/AC11 raw API responses
- [cross-sign.md](cross-sign.md) — Cross-sign verification
- [enforcer-checklist.txt](enforcer-checklist.txt) — Enforcer gate check

---

## Re-run After Build Deploy

**Date:** 2026-03-27T00:42Z
**Trigger:** Fresh build deployed to dev.huminicdev.com; re-testing AC4 and AC5 which were CONDITIONAL PASS and FAIL respectively.
**Method:** Playwright MCP browser, login as serra_honda@huminic.ai, navigate to /sales Dashboard.

### AC4 Re-test: Recent Activity from API

**Result: PASS**

The /sales Recent Activity section now displays real activity-log API entries with relative timestamps. The hardcoded mock data ("New lead from website", "Sales Agent qualified lead #1042", etc.) has been removed.

Current entries observed:
1. Campaign Created — about 8 hours ago
2. Auto Greeting Sent — about 12 hours ago
3. Login Failed — 1 day ago
4. Campaign Active — 2 days ago
5. Campaign Created — 2 days ago
6. Campaign Active — 2 days ago
7. Campaign Created — 2 days ago
8. Campaign Active — 2 days ago
9. Campaign Created — 2 days ago
10. User Updated — 2 days ago

These match the real /api/activity-log entries (campaign_created, auto_greeting_sent, login_failed, etc.) with correct relative timestamps. No hardcoded demo data remains.

### AC5 Re-test: Conversion Rate Change Indicator

**Result: PASS**

The Conversion Rate tile now shows:
- **Value:** 3.5% (the absolute conversion rate — correct)
- **Change indicator:** "0% vs last 30d" (correct — shows zero change, not the absolute rate)

Previously showed "+3.5% vs last 30d" which was the absolute rate being displayed as a change delta. Now correctly shows 0% change, matching the pattern of all other metric tiles.

**Minor note:** The green trending-up arrow icon still appears next to the 0% change. A 0% change would be more accurately represented with a neutral/flat indicator. This is cosmetic and does not affect the AC pass criteria.

### Updated Scorecard

| AC | Previous Result | Re-test Result | Notes |
|----|----------------|----------------|-------|
| AC4 | CONDITIONAL PASS | PASS | Real activity-log data now displayed, mock data removed |
| AC5 | FAIL | PASS | Change indicator now shows "0%" instead of "+3.5%" |

**Final T-014 Scorecard: 12 PASS, 0 FAIL, 0 CONDITIONAL**

### Evidence Artifacts (Re-run)

- [rerun-sales-full.png](rerun-sales-full.png) — Sales dashboard overview
- [rerun-conversion-rate-tile.png](rerun-conversion-rate-tile.png) — Conversion Rate tile showing "3.5%" with "0% vs last 30d"
- [rerun-recent-activity.png](rerun-recent-activity.png) — Recent Activity section showing real API entries
