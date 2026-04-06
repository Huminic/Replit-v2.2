# PE-SALES-01 Bug Log

**Date:** 2026-04-06
**Evaluator:** Playwright Operator (automated)

---

## BUG-01: Vehicle column shows raw API URLs instead of vehicle descriptions
**Severity:** MEDIUM
**Location:** Sales > Dashboard > Active Pipeline drill-down (and Contact Details)
**Description:** The "Vehicle" column in the Active Pipeline table shows raw VIN Solutions API URLs (e.g., `https://api.vinsolutions.com/vehicles/interest/id/1988464528-0`) instead of human-readable vehicle descriptions (year, make, model). The Contact Details dialog also shows the raw URL under "Vehicle of Interest."
**Expected:** Vehicle name/description (e.g., "2026 Honda Civic")
**Actual:** Raw API endpoint URL
**Evidence:** screenshots/UC-05-active-pipeline-drilldown.png, screenshots/UC-09-contact-details.png

---

## BUG-02: 11 of 16 Active Pipeline records have no customer name
**Severity:** MEDIUM
**Location:** Sales > Dashboard > Active Pipeline drill-down
**Description:** Only 5 of 16 records in the Active Pipeline table show customer names (AI Lead, Michael Mccord, Donnie Kitchens, Renay Elmore, Braden Macon). The remaining 11 show "--" (em dash). The data was synced from VIN Solutions warehouse -- names should be available for all active leads.
**Expected:** Customer name for every lead record
**Actual:** "--" for 11 of 16 records
**Evidence:** screenshots/UC-05-active-pipeline-drilldown.png

---

## BUG-03: Appointments Set drill-down shows 0 records despite tile showing 22
**Severity:** HIGH
**Location:** Sales > Dashboard > Appointments Set tile drill-down (Serra Honda)
**Description:** The Appointments Set tile displays "22" but when clicked, the drill-down dialog says "0 records" and "No records found." The metric count and the underlying data are inconsistent. Either the count is wrong, or the records exist but the drill-down query is different from the count query.
**Expected:** 22 records shown in drill-down table
**Actual:** "No records found" with "0 records" label, despite tile showing 22
**Evidence:** screenshots/UC-06-appointments-set-drilldown.png

---

## BUG-04: 7 of 11 agents display as "Unauthorized Agent" with "Should fail"
**Severity:** HIGH
**Location:** Sales > Agents tab, Sales > Dashboard > Top Performing Agents
**Description:** Seven agent cards show name "Unauthorized Agent" with type "voice" and description "Should fail." These appear to be test/validation stubs that should not be visible in production. They are all marked "active" and appear in the Top Performing Agents ranking on the dashboard.
**Expected:** Either (a) agents should have real names and descriptions, or (b) test agents should be hidden/inactive
**Actual:** Generic "Unauthorized Agent" / "Should fail" text visible to all users
**Evidence:** screenshots/UC-13-agents-tab.png, screenshots/UC-01-serra-honda-full-tall.png

---

## BUG-05: All "vs last 30d" change values show 0% across all stores
**Severity:** LOW-MEDIUM
**Location:** Sales > Dashboard > All 7 metric tiles, all stores
**Description:** Every tile across every store shows "0% vs last 30d" for the change indicator. This suggests the comparison period data is either missing, identical, or the comparison logic is not computing deltas. Given that these are active dealerships with varying monthly volumes, a flat 0% change everywhere is implausible.
**Expected:** Meaningful positive or negative percentage changes
**Actual:** 0% change on every tile, every store
**Evidence:** All dashboard screenshots

---

## BUG-06: No VAPI/voice lead count visible on Sales Dashboard
**Severity:** LOW-MEDIUM
**Location:** Sales > Dashboard
**Description:** The operator reported "shows zero vapi leads in last 7 days even though recent activity shows calls." Confirmed: there is no dedicated VAPI lead metric tile. The Recent Activity feed shows "Vapi Call Received" entries and "Vin Lead Creation Failed" entries, but no tile breaks out voice-sourced leads. The dashboard metrics come from VIN Solutions warehouse sync, which may not categorize leads by source channel.
**Expected:** Some indication of VAPI-sourced lead volume, or at minimum the VAPI calls should result in leads counted in the tiles
**Actual:** VAPI activity visible in Recent Activity only; no dedicated metric and no clear indication VAPI calls translate to counted leads

---

## BUG-07: Stale warehouse sync across multiple stores
**Severity:** MEDIUM
**Location:** Sales > Dashboard sync status
**Description:** Sync timestamps show significant staleness:
- Serra Honda: 9 days ago
- Tony Serra Ford: 5 days ago
- Serra Nissan: 13 days ago
- Ford of Columbia: 16 days ago
- Hyundai of Columbia: 16 days ago
- Huminic: No timestamp at all

No manual refresh/re-sync button is visible on the dashboard. Aligns with known issue I-201 (delta sync scheduler never succeeding).
**Expected:** Sync within last 24 hours, with manual refresh option
**Actual:** 5-16 day old data, no refresh button

---

## BUG-08: Only 2 of 7 tiles have record-level drill-downs
**Severity:** LOW
**Location:** Sales > Dashboard tile drill-downs
**Description:** Only Active Pipeline shows a table with individual lead records and "Show Contact" functionality. Appointments Set attempts a table but returns 0 records. The other 5 tiles (Total Leads, New Leads, Waiting on Response, Sold, Conversion Rate) show only a simple summary dialog with Current Value, Change, and Period -- no individual records.
**Expected:** Drill-down tables for at least Active Pipeline, Appointments Set, New Leads, and Sold
**Actual:** Only Active Pipeline has functional record-level drill-down

---

## NON-BUG CONFIRMATIONS

### UC-08: No cost/price/dollar information in popouts
**CONFIRMED CLEAN** -- No financial data (cost, price, dollar amounts, deal values, vehicle prices) appears in any drill-down or popout. The operator's #10 critical bug concern is NOT present.

### UC-03: Tony Serra Ford "all zeros" known bug
**NOT REPRODUCED** -- Tony Serra Ford shows real data (202 total leads, 8 sold, 4% conversion). The expected "all zeros" bug either was previously fixed or was intermittent.
