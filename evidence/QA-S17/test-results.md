# QA-S17 Test Results: Data Integrity (FINAL)

Timestamp: 2026-03-17
Method: Baseline dual agents + deep cross-system verification + manual checks

## Baseline Results (dual agent): 7/8 PASS, 1 DEFECT
| Test | Result | Detail |
|------|--------|--------|
| Agent count API vs DB | PASS | 6 = 6 |
| Conversation count | PASS | 17 = 17 |
| Pipeline metrics | PASS | All numeric |
| Insights zones | PASS | Structured data |
| Campaign metrics | DEFECT | sent_count seed data doesn't match reality |
| User count | PASS | 16 = 16 |
| Hunches structure | PASS | 5 valid items |
| Cross-org isolation | PASS | Serra Honda:17, Ford of Columbia:9 |

## Deep Verification Results: 2/6 PASS, 4 DEFECT
| Test | Result | Detail |
|------|--------|--------|
| VIN vs Dashboard | DEFECT → FIXED | NEXXUS_ORG_MAP was missing. Added, backfill ran, 1300 leads now in warehouse |
| TextMagic vs DB | DEFECT | 358 real messages, DB claims 1158, actual sent=0 (seed data) |
| Conversion rate | PASS | 45/1300 = 3.5% (correct) |
| Reply rate | DEFECT | replied(1) > sent(0) is impossible state |
| Per-store isolation | PASS | 6 stores, different counts, no leakage |
| Stale seed data | DEFECT | 4 campaigns have fake sent_count/replied_count |

## Dashboard Metrics Verified (with real data)
| Metric | Value | Verified |
|--------|-------|----------|
| Active Pipeline | 353 | PASS (matches DB ACTIVE status count) |
| Total Leads | 1300 | PASS (matches warehouse_leads count) |
| Hot/Active | 353 | PASS |
| Sold | 45 | PASS (SOLD_DELIVERED status) |
| Conversion Rate | 3.5% | PASS (45/1300 calculated correctly) |
| Conversations | 17 total, 11 open | PASS |
| Agents | 6 total, 6 active | PASS |
| Users | 16 total, 16 active | PASS |

## Issues Found
| Issue | Severity | Detail |
|-------|----------|--------|
| Lead sources show raw VIN API URLs | MINOR | Should be human-readable names |
| Channel performance all "Other" | MINOR | Lead type not mapped to channels |
| metricsFromWarehouse all zeros | MINOR | Warehouse metrics table not populated |
| Campaign seed data fake | MAJOR | 4 campaigns have inflated sent_count/replied_count |
| Chat shows 1 lead instead of 1300 | MAJOR | Chat's vin_lead_summary queries differently than backfill |

## Critical Fix Applied
- Added NEXXUS_ORG_MAP to .env — maps Replit org IDs to Nexxus org IDs for MCP
- Triggered backfill sync — 1300 leads imported from VIN Solutions
- Dashboard now shows real data instead of zeros

## VIN Solutions Dealer IDs
| Store | Dealer ID | Nexxus Org ID | Leads |
|-------|-----------|---------------|-------|
| Serra Honda | 21043 | 3795b8f6-aca7-45fc-b77e-fc671b85a9f3 | 733→1300 |
| Serra Nissan | 21044 | 7f868569-62e5-4d49-9378-2e25d6a69321 | 442 |
| Tony Serra Ford | 21047 | 8751c73d-4570-4b8d-bd40-fa4f1e48024d | 435 |
