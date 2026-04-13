# PE-SERVICE-02: Service/Campaigns Re-Evaluation Report

**Date:** 2026-04-06
**Evaluator:** Production Eval Agent
**URL:** https://dev.huminicdev.com/service
**Account:** serra_honda@huminic.ai (Serra Honda, org_admin)
**Previous Eval:** PE-SERVICE-CAMPAIGNS-01
**Remediation Applied:** REM-PE-006 (campaign detail recipients endpoint), DATA-CLEANUP-01/02 (test data removal)

---

## Bug Re-Evaluation Results

| Bug ID | Description | Severity | Previous Status | Current Status | Evidence |
|--------|------------|----------|----------------|----------------|----------|
| BUG-SC-01 | No campaign filter in TeamBox | Medium | OPEN | STILL PRESENT | screenshot 04 — TeamBox shows channel filters (All/SMS/Email/Voice) but no campaign filter |
| BUG-SC-02 | Campaign conversations not visually distinguishable | Medium | OPEN | STILL PRESENT | screenshot 04 — No campaign badges/tags on TeamBox conversation items |
| BUG-SC-03 | Campaign detail modal missing execution history | Low | OPEN | PARTIALLY FIXED | screenshots 02 — Modal opens with summary stats (status, channel, recipients, sent, replied, kill switch, CSV file). Backend endpoint GET /api/campaigns/:id/recipients exists (line 504 of server/routes/campaigns.ts) but returns 401 when called from the frontend. Recipients table not rendered. |
| BUG-SC-04 | Massive test data pollution (137 campaigns, ~134 test) | Medium | OPEN | FIXED | screenshot 03 — Only 2 campaigns remain: "Service Reminder - February" (active, 16 recipients) and "Oil Change Reminder" (paused, 234 recipients). DATA-CLEANUP-01/02 successfully removed test data. |
| BUG-SC-05 | No campaign list pagination or search | Low | OPEN | STILL PRESENT (moot) | screenshot 03 — No pagination or search controls. However, with only 2 campaigns this is not a functional issue currently. Will become relevant again if campaign count grows. |
| BUG-SC-06 | No trigger/automation configuration UI | Low | OPEN | STILL PRESENT | screenshots 06-07 — The Configuration panel has a "Triggers" section with "Add Trigger" button, but this is for AI agent triggers, not campaign-specific automation triggers. No campaign-level trigger/schedule/automation config exists. |

---

## Detailed Findings

### BUG-SC-03 — PARTIALLY FIXED (auth regression on recipients endpoint)

REM-PE-006 wired up:
- Backend: `GET /api/campaigns/:id/recipients` with `authenticateToken` middleware (server/routes/campaigns.ts:504)
- The endpoint is registered and responds (returns 401, not 404)

**Problem:** The frontend calls this endpoint (confirmed via network tab — saw `/api/campaigns/30267ae2-.../recipients` returning 401), but the auth token is not being passed correctly. All other campaign API calls (e.g., `/api/campaigns/execution-statuses`) succeed with 200. This suggests the recipients endpoint may have a different auth middleware path or the frontend fetch for recipients is missing credentials/headers.

**Impact:** The recipients table that REM-PE-006 was supposed to render never appears because the data fetch fails silently.

### BUG-SC-04 — FIXED

DATA-CLEANUP-01/02 was effective. Campaign count went from 137 to 2. Both remaining campaigns appear to be real/intentional:
1. "Service Reminder - February" — active, SMS, 16 recipients, 1 replied
2. "Oil Change Reminder" — paused, SMS, 234 recipients

---

## New Issues Found

| Bug ID | Description | Severity | Evidence |
|--------|------------|----------|----------|
| BUG-SC-07 | Recipients endpoint returns 401 despite valid session | Medium | Network log shows GET /api/campaigns/:id/recipients returning 401 while all other /api/campaigns/* endpoints return 200 in the same session. Auth middleware may not be receiving the session cookie correctly for this specific route. |
| BUG-SC-08 | execution-statuses polling is excessive | Low | Network log shows GET /api/campaigns/execution-statuses being called every ~2-3 seconds while on the Service page. Over 20 calls observed in under 60 seconds. Should use longer polling interval or websocket. |

---

## Summary

- **1 of 6 bugs FIXED** (BUG-SC-04 — test data cleanup)
- **1 of 6 bugs PARTIALLY FIXED** (BUG-SC-03 — backend exists but auth broken, no table rendered)
- **4 of 6 bugs STILL PRESENT** (BUG-SC-01, SC-02, SC-05, SC-06)
- **2 new bugs found** (BUG-SC-07 auth regression, BUG-SC-08 excessive polling)

### Priority for next remediation:
1. **BUG-SC-07 (Medium)** — Fix auth on recipients endpoint so the campaign detail modal can render the recipients table (completes REM-PE-006)
2. **BUG-SC-01 + SC-02 (Medium)** — Add campaign origin indicators to TeamBox conversations
3. **BUG-SC-08 (Low)** — Reduce execution-statuses polling frequency

---

## Screenshots Index

| File | Description |
|------|------------|
| 01-service-campaigns-overview.png | Service page with Campaigns tab active, 2 campaigns visible |
| 02-campaign-detail-modal.png | Campaign detail modal for "Service Reminder - February" — no recipients table |
| 03-campaigns-list-full.png | Full page showing only 2 campaigns (post data cleanup) |
| 04-teambox-overview.png | TeamBox with no campaign filters or badges visible |
| 05-config-panel.png | Configuration panel showing nav items including Triggers |
| 06-triggers-config.png | Triggers section — agent triggers, not campaign triggers |
| 07-triggers-detail.png | Triggers detail — "Add Trigger" for agents only |
