# PE-SERVICE-CAMPAIGNS-01 Bug Log

**Date:** 2026-04-06
**Evaluator:** Playwright Operator

---

## BUG-01: No campaign filter in TeamBox (CONFIRMED)

**Severity:** Medium
**Status:** Previously identified (PE-TEAMBOX-01), confirmed still missing
**Location:** TeamBox page (`/teambox`)

**Description:** TeamBox has no way to filter or identify campaign-originated conversations. Users cannot distinguish between organic conversations and campaign-generated ones. Filters available: channel (All/SMS/Email/Voice) and status (All/Open/Assigned/Participating/Automated/Scheduled/Followup/Pending).

**Impact:** Service managers cannot track campaign response rates or follow up on campaign conversations efficiently.

**Evidence:** `screenshots/13-teambox-filters-no-campaign.png`

---

## BUG-02: Campaign conversations not visually distinguishable in TeamBox

**Severity:** Medium
**Status:** New finding
**Location:** TeamBox conversation list

**Description:** Even without a filter, campaign-originated conversations show no visual badge, tag, or indicator in the conversation list. A "Service Reminder - February" campaign with 1 sent and 1 replied should have created at least one conversation, but there is no way to visually identify which conversation came from a campaign.

**Impact:** Campaign ROI tracking requires switching between Service Campaigns page and TeamBox with no linkage.

**Evidence:** `screenshots/11-teambox-sms-channel.png`

---

## BUG-03: Campaign detail modal missing execution history and recipient list

**Severity:** Low
**Status:** New finding
**Location:** Campaign detail dialog (click campaign row)

**Description:** The campaign detail modal shows summary statistics (status, channel, recipients, sent, replied, kill switch, CSV file) but does NOT include:
- Execution history (when was it started, paused, resumed?)
- Recipient list (who was contacted?)
- Message template (what was sent?)
- Individual recipient delivery status

**Impact:** Admins must rely on CSV file download and external tracking to understand campaign details.

**Evidence:** `screenshots/06-campaign-detail-view.png`

---

## BUG-04: Massive test data pollution in campaign list

**Severity:** Medium
**Status:** New finding (data quality)
**Location:** Service Campaigns list

**Description:** 137 campaigns are listed, the vast majority being E2E test data:
- ~20 "Vehicle Merge Test" duplicates (draft status)
- ~12 "LC-2 Autonomous Test" duplicates (active status)
- ~10 "S-4 Test Campaign" duplicates (draft status)
- ~40 "E2E-FLOW*" test campaigns
- ~20 "RI-*" test campaigns
- ~5 "DC-US010-Recall" test campaigns

Only 3 appear to be real/intentional campaigns: "Service Reminder - February", "Oil Change Reminder", "G-6.3 Email Campaign Test"

**Impact:** Real campaigns are buried in test noise. No pagination, search, or filtering to find real campaigns. Active test campaigns (18 in "active" status) may be consuming system resources.

**Evidence:** Campaign list data extracted via browser evaluate

---

## BUG-05: No campaign list pagination or search

**Severity:** Low
**Status:** New finding
**Location:** Service Campaigns list

**Description:** All 137 campaigns render in a single unpaginated table. No search, no sort, no filter by status/channel. The page is very long to scroll.

**Impact:** With continued campaign creation (especially E2E tests), the page will become increasingly difficult to use.

**Evidence:** `screenshots/03-service-page-full.png`

---

## BUG-06: No trigger/automation configuration accessible

**Severity:** Low (informational)
**Status:** New finding
**Location:** Service page

**Description:** No trigger or automation configuration UI exists on the Service page. Each campaign has a per-row "Schedule" button, but there is no centralized trigger management for automated campaign creation/execution based on events (e.g., service due dates, recall notifications).

**Impact:** Campaigns must be manually created and scheduled individually.

---

## RESOLVED: I-193 (CSV Template download button missing)

**Status:** RESOLVED -- button exists
**Evidence:** CSV Template download link is present at the top of the Campaigns tab, linking to `/campaign-template.csv`. I-193 should be closed.

**Evidence:** `screenshots/05-csv-upload-area.png`

---

## Summary

| Bug ID | Severity | Category | Status |
|--------|----------|----------|--------|
| BUG-01 | Medium | Missing feature | Confirmed (known) |
| BUG-02 | Medium | Missing feature | New |
| BUG-03 | Low | Missing detail | New |
| BUG-04 | Medium | Data quality | New |
| BUG-05 | Low | UX | New |
| BUG-06 | Low | Missing feature | New (informational) |
| I-193 | -- | -- | RESOLVED |
