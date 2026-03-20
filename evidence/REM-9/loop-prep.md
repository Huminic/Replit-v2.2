# Loop Prep: REM-9

## Task 3 Scope (sync.ts date mapping fix)

### Issue
I-090: VIN Solutions sync writes NULL for vin_created_at and vin_updated_at because `transformVinLead` in server/sync.ts expects `createdDate`/`modifiedDate` but the VIN API returns `createdUtc`/`modifiedUtc`. All 6,140 warehouse_leads have null dates, breaking time-based insights.

### Fix Required
In server/sync.ts `transformVinLead` function (lines 25-26):
- Add `createdUtc` as first-priority field for vinCreatedAt
- Add `modifiedUtc` as first-priority field for vinUpdatedAt
- Also fix `vehicleOfInterest` — VIN returns array of hrefs, not a description string

### Declared Files
- server/sync.ts

### Issue-to-Test Mapping
| Issue | Test | Criterion |
|-------|------|-----------|
| I-090 | domain-07-insights.spec.ts "7.1", "7.2", "7.3" | Insights populate with non-zero values |

### Smoke Test
After fix, re-run backfill and verify:
```sql
SELECT count(*) FROM warehouse_leads WHERE vin_created_at IS NOT NULL;
```
Expected: 6000+ (all synced leads should have dates)

### Dependency Order
1. REM-9-BE: Fix sync.ts date mapping (this task)
2. Re-run backfill to repopulate dates
3. Run metrics refresh
4. Verify insights API returns correct calculations

### Remaining REM-9 sub-sprints (after Task 3)
- REM-9-FE: Contact modal fix (I-089) — requires user approval for FE changes
- REM-9-TI: Real comms test scripts — coverage gaps from ghost audit
