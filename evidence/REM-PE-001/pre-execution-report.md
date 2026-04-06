# REM-PE-001 Pre-Execution Report

**Sprint:** REM-PE-001 — VIN Enrichment Pipeline Fix
**Date:** 2026-04-06
**Operator Authorization:** User directed execution of REM-PE-001 in current session

## Objective

Fix the VIN enrichment pipeline so that synced leads have correct vehicle names, customer names, phone numbers, and lead sources. Fix the sync scheduler so delta syncs run reliably. Verify with a fresh backfill for at least one dealership.

## Bug List

The VIN API returns **href URLs** for `contact`, `leadSource`, and `vehiclesOfInterest` fields on leads. The current `transformVinLead()` in `server/sync.ts` treats these as inline objects, producing nulls for every enriched field.

### Actual VIN API lead shape (from live query):

```json
{
  "leadId": 1996327493,
  "dealerId": 21043,
  "contact": "https://api.vinsolutions.com/contacts/id/1400263075?dealerid=21043",
  "leadSource": "https://api.vinsolutions.com/leadsources/id/255494?dealerid=21043",
  "leadStatus": "ACTIVE_NEW_LEAD",
  "leadStatusType": "ACTIVE",
  "leadType": "INTERNET",
  "leadGroupCategory": "NEW",
  "createdUtc": "2026-04-06T14:44:00+00:00",
  "vehiclesOfInterest": [
    "https://api.vinsolutions.com/vehicles/interest/id/1996327493-0"
  ],
  "tradeVehicles": []
}
```

### Vehicle of interest shape (resolved from href):

```json
{
  "year": 2026,
  "make": "Honda",
  "model": "Civic Si",
  "trim": "Si Sedan Manual",
  "bodyStyle": "Sedan",
  "exteriorColor": "Rallye Red",
  "inventoryType": "NEW",
  "msrp": 32690
}
```

### Bugs addressed by this sprint:

| # | Bug ID | Problem | Root Cause |
|---|--------|---------|------------|
| 1 | BUG-PE01-001 | Vehicle column shows raw API URLs | `vehiclesOfInterest[0]` is a URL string, not an object; `String()` just stores the URL |
| 2 | BUG-PE01-002 | 11/16 pipeline leads show "--" for Name | `raw.contact?.firstName` is undefined because `raw.contact` is a URL string |
| 3 | BUG-PE01-003 | Outbound Sent drill-down has zero identifying data | Warehouse leads stored with null name/phone/email |
| 4 | BUG-INS-01 | Hot Leads modal shows no customer names | Same root cause as BUG-PE01-002 |
| 5 | BUG-INS-02 | Hot Leads modal shows no phone numbers | `raw.contact?.phone` is undefined for same reason |
| 6 | BUG-INS-03 | Vehicle column shows raw API URLs in modals | Same as BUG-PE01-001 |
| 7 | BUG-INS-09 | Library drill-down shows raw URLs for lead sources | `raw.source?.name` is undefined; `leadSource` is a URL |
| 8 | BUG-01 (Sales) | Vehicle column shows raw API URLs | Same as BUG-PE01-001 |
| 9 | BUG-02 (Sales) | 11/16 Active Pipeline records have no name | Same as BUG-PE01-002 |
| 10 | BUG-07 (Sales) | Stale warehouse sync (5-16 days) | Delta sync scheduler not succeeding |
| 11 | BUG-INT-06 | VIN warehouse sync stale (9 days) | Same as BUG-07 |
| 12 | BUG-INT-08 | 11/16 Active Pipeline leads missing contact names | Same as BUG-PE01-002 |
| 13 | BUG-05 (Sales) | All "vs last 30d" change values show 0% | `runMetricsRefresh` comparison logic broken |
| 14 | BUG-INT-09 | Trend percentages all show 0% | Same as BUG-05 |
| 15 | BUG-INS-08 | Loss Patterns table is empty | Loss data columns blank due to null enrichment |

### Root cause analysis:

**Primary:** `transformVinLead()` (sync.ts:10-29) assumes the VIN API returns inline objects for `contact`, `source`, and `vehiclesOfInterest`. In reality, these are href URLs that must be resolved with separate API calls.

**Secondary:** The sync pipeline does no secondary resolution. `server/routes/metrics.ts` has a background enrichment mechanism (lines 50-117) that correctly resolves contact hrefs using `extractContactIdFromHref()` and `callMCP("vin_get_contact")`, but this only runs on-demand when metrics are viewed and only enriches up to 20 contacts.

**Tertiary:** The delta sync scheduler (sync.ts:359-372) checks `etHour !== 2` with a 24-hour interval, meaning it may never fire if the process restarts during a different hour window.

## Declared Files

- server/sync.ts (primary — transformVinLead, backfill, delta sync, scheduler)
- server/services/scheduler.ts (scheduler integration)
- evidence/REM-PE-001/ (governance artifacts)
- issues.md (if issues found)

## UI Changes

NONE — uiPermissions is NONE. All fixes are backend data pipeline.

## Acceptance Criteria

| AC ID | Criterion |
|-------|-----------|
| REM-PE-001.AC1 | Vehicle names display correctly (year/make/model, no 'undefined undefined') |
| REM-PE-001.AC2 | Customer names display correctly (no null/undefined concatenation) |
| REM-PE-001.AC3 | Phone numbers populated from VIN contact data |
| REM-PE-001.AC4 | Lead source correctly mapped from VIN Solutions source field |
| REM-PE-001.AC5 | Sync scheduler runs on configured interval without crashes |
| REM-PE-001.AC6 | Fresh backfill produces clean data for at least one dealership |

## Code Changes Needed

### 1. Rewrite `transformVinLead()` (sync.ts)

Current code tries `raw.contact?.firstName` etc. on a URL string. Must change to:

- **customerName:** Cannot resolve inline. Store null initially; resolve in enrichment pass.
- **customerPhone:** Same — requires contact resolution.
- **customerEmail:** Same.
- **vehicleOfInterest:** `raw.vehiclesOfInterest` is an array of URLs. Cannot resolve inline. Store null or the href for later resolution.
- **leadSource:** `raw.leadSource` is a URL. Extract lead source ID from the href pattern `/leadsources/id/{id}` and store it. Resolution to a name requires a separate API call.
- **vinStatus:** Available directly as `raw.leadStatus` (correct).
- **sourceId:** Available as `raw.leadId` (correct).
- **createdUtc/modifiedUtc:** Already handled correctly.

### 2. Add enrichment pass after bulk sync

After the initial lead upsert loop in `runHistoricalBackfill()` and `runDailyDelta()`, add an enrichment pass that:

1. Collects all contact hrefs from the raw leads
2. Extracts contact IDs using `extractContactIdFromHref()` (already exists in vendorProxy.ts)
3. Batch-resolves contacts via `callMCP("vin_get_contact")` with concurrency limit
4. Flattens contact info using `flattenContactInfo()` (already exists in vendorProxy.ts)
5. Updates warehouse leads with resolved name, phone, email

### 3. Add vehicle-of-interest resolution

For each lead with vehiclesOfInterest hrefs:
1. Call `vin_api_read` with the vehicle href endpoint
2. Extract year/make/model/trim
3. Format as "YYYY Make Model Trim" string
4. Update warehouse lead `vehicleOfInterest` field

### 4. Add lead source resolution

For each unique lead source href:
1. Extract source ID from URL pattern
2. Call `vin_get_lead_sources` once per dealer (cached)
3. Map source ID to source name
4. Update warehouse lead `leadSource` field

### 5. Fix delta sync scheduler reliability

Current issue: `setInterval(fn, 24h)` with `if (etHour !== 2) return` means if the server restarts at any time other than 2am ET, the next check is 24h later and may miss the 2am window again.

Fix: Change delta interval to check every hour (or use a proper cron-style check).

### 6. Fix metrics comparison (0% trend values)

The `runMetricsRefresh()` function computes comparisons but the `/api/vin/leads/summary` endpoint (vendorProxy.ts:486-490) hardcodes all change values to 0. Need to either use the warehouse_metrics table or compute live comparisons.

## Test Plan

### Unit-level verification:
1. After code changes, trigger a manual backfill for Serra Honda (org with dealerId 21043)
2. Query warehouse_leads for Serra Honda and verify:
   - `customerName` is populated (not null) for leads where VIN contact exists
   - `customerPhone` is populated where VIN contact has a phone
   - `vehicleOfInterest` shows "YYYY Make Model" format (not URLs)
   - `leadSource` shows a name (not a URL)

### Scheduler verification:
3. Check PM2 logs for delta sync execution after restart

### End-to-end verification:
4. Run `npx playwright test tests/e2e/wf-vin-lead.spec.ts` — workflow test for VIN lead sync
5. Run `npx playwright test tests/e2e/wf-vin-trigger.spec.ts` — VIN trigger workflow test

### Manual spot-check:
6. Query the enriched warehouse data via API:
```bash
curl -s https://dev.huminicdev.com/api/vin/leads/summary -H "Authorization: Bearer <token>"
```

## Ghost Entry Gate

**Reviewer:** Ghost Agent (automated governance check)
**Date:** 2026-04-06
**Sprint:** REM-PE-001

### Verification Checklist

| # | Check | Result |
|---|-------|--------|
| 1 | Sprint registered in sprints.json | PASS — REM-PE-001 found with status in_progress |
| 2 | Pre-execution report exists | PASS — evidence/REM-PE-001/pre-execution-report.md present |
| 3 | Objective section present | PASS |
| 4 | Bug List section present | PASS — 15 bugs documented with root cause analysis |
| 5 | Declared Files section present | PASS — server/sync.ts, server/services/scheduler.ts, evidence/REM-PE-001/, issues.md |
| 6 | UI Changes section present | PASS — NONE (matches uiPermissions: NONE) |
| 7 | Acceptance Criteria match sprints.json | PASS — 6 ACs match exactly |
| 8 | Test Plan section present | PASS — unit, scheduler, e2e, and manual verification defined |
| 9 | Code Changes Needed section present | PASS — 6 changes described with approach |
| 10 | DependsOn satisfied | PASS — DATA-CLEANUP-02 committed |

### Verdict

**ENTRY GATE: APPROVED**

All required sections present. ACs match sprints.json. Declared files align with bug scope. No UI modifications declared (correct). Proceed to implementation.
