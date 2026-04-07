# VIN Warehouse Backfill Status

**Date:** 2026-04-07
**Triggered by:** SNP-001 Step 4

## Results — All 5 Dealerships Synced

| Dealership | Org ID | Leads | Status |
|---|---|---|---|
| Serra Honda | 24d64f99-ba04-4b43-af35-fd06f555ac86 | 1,300 | Completed 2026-04-06 |
| Ford of Columbia | 6ae2548b-f6ec-4b1e-8d8b-ae565123f0df | 1,300 | Completed 2026-04-07 |
| Hyundai of Columbia | f18cbf4e-bcbd-46fe-bf54-33bcee4afec8 | 1,300 | Completed 2026-04-07 |
| Serra Nissan | 4a23d5ad-38ff-4016-8af5-f4cfc9fd88cd | 1,171 | Completed 2026-04-07 |
| Tony Serra Ford | 2cbf687f-7cd5-480c-b81c-220cb632cd91 | 1,174 | Completed 2026-04-07 |

**Total: ~6,245 warehouse leads across all 5 dealerships**

## Cleanup
- 10 stuck sync_log entries cleaned (status → "failed", error → "Stuck - cleaned by SNP-001")

## Method
- API endpoint: POST /api/sync/backfill?orgId=<uuid>
- Auth: super_admin JWT bearer token
- Each backfill: 90-day window in 7-day chunks via callMCP("vin_query_leads")
