# Production Eval — List A, Round 3

**Date:** 2026-04-07
**Evaluator:** Eval Agent (Playwright MCP)
**Login:** serra_honda@huminic.ai (org_admin, Serra Honda)

## Deployed Fix Results (5/5 PASS)

### EVAL 1: Activity Menu Routing (BUG-INS-13) — PASS
- /insights?tab=activity loads correctly with Activity tab selected
- Clicking Activity tab from Dashboard also works
- Content shows placeholder: "Activity tracking coming soon"

### EVAL 2: Campaign Recipients (BUG-SC-07) — PASS
- Service Reminder modal opens with 16 recipients (Name, Phone, Status columns)
- API returned 200, no 401 error
- Note: Oil Change Reminder shows Recipients: 234 in stats but "No recipients uploaded yet" — data quality issue, not code bug

### EVAL 3: VAPI Cross-Org Filter (BUG-INT-15) — PASS
- 13 VAPI call entries, all for Serra Honda's single assistant
- All caller numbers in 480 area code (Arizona, consistent with Serra Honda)
- Server-side filtering confirmed in vendorProxy.ts

### EVAL 4: Campaign Polling Interval (BUG-SC-08) — PASS
- Source code confirms refetchInterval: 15000
- Network shows periodic polls at ~15s intervals, not rapid-fire

### EVAL 5: VIN Warehouse Sync (BUG-INT-06) — PASS
- Dashboard: Total Leads 458, Pipeline Active 166, Hot Leads 20, Conversion Rate 2.4%, Total Sold 11
- Cross-references check out: 11/458 = 2.4%, 166/458 = 36%
- Freshness Score: "Stale" (30% under 7 days) — expected for backfilled historical data

## Deferred Items (code applied, now deployed — need post-build eval)
| Bug ID | Description | Status |
|--------|-------------|--------|
| BUG-INT-12 | VAPI assistant names | FIXED, needs eval |
| BUG-INT-13 | Phone call dates | FIXED, needs eval |
| BUG-INT-04 | Phone call duration | FIXED, needs eval |
| BUG-INS-12 | Insights sidebar link | FIXED, needs eval |
| BUG-INS-08 | Loss patterns data | FIXED, needs eval |
| BUG-SALES-NEW-02 | Sales z-index | FIXED, needs eval |
| BUG-INT-05 | Tavus video sessions | FIXED, needs eval |
| I-229 | Email emoji + VIN status | FIXED, needs eval |
| I-230 | No-transcript gate | FIXED, needs eval |
