# Pre-Execution Report: FIX-S9
Timestamp: 2026-03-17T03:57:00Z
Sprint: FIX-S9 — Fix open defects — campaign seed data, chat lead count, lead source labels, channel mapping, warehouse metrics
Status: RETROACTIVE — originally written without governance compliance

## Objective
Fix 5 data-related defects: (1) campaign seed data has inflated sent_count/replied_count, (2) chat reports item count instead of totalItems for leads, (3) lead sources show raw URLs instead of labels, (4) channel performance shows all "Other" instead of Website/Phone, (5) metricsFromWarehouse missing fallback computation.

## Declared Files
- server/routes/chat.ts
- server/routes/insights.ts
- server/seed.ts
- scripts/pre-commit.sh
- scripts/watchdog.sh
- evidence/FIX-S9/
- evidence/ghost-protocol-harness.md
- evidence/watchdog-ack.txt
- evidence/watchdog-report.txt

## Success Criteria
Retroactive — derived from post-sprint claims:
- Campaign seed data: sent_count/replied_count reset to 0
- Chat lead count: reads totalItems instead of items.length (698 leads, not 1)
- metricsFromWarehouse: fallback computes from warehouse_leads
- Lead sources: show "VIN Source #7098" style labels instead of raw URLs
- Channel performance: Website + Phone channels instead of all "Other"
