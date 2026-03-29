# Smoke Test Output — VFY-02

**Test file:** `tests/e2e/s3-sales.spec.ts`
**Date:** 2026-03-28
**Command:** `npx playwright test tests/e2e/s3-sales.spec.ts --reporter=list`

## Full Output

```
[dotenv@17.3.1] injecting env (25) from .env

Running 10 tests using 1 worker

[dotenv@17.3.1] injecting env (0) from .env
  Sales agents: Caroline, Data Guru, Sales Coach, Communication Writer
  ✓   1 [sprint] › tests/e2e/s3-sales.spec.ts:24:1 › S-3.AC1: 4 sales agents on Agents tab (1.1s)
  Caroline: description 99 chars
  Data Guru: description 119 chars
  Sales Coach: description 57 chars
  Communication Writer: description 77 chars
  ✓   2 [sprint] › tests/e2e/s3-sales.spec.ts:44:1 › S-3.AC2: agent descriptions are substantive (905ms)
  No CRM Guru in agents or code
  ✓   3 [sprint] › tests/e2e/s3-sales.spec.ts:64:1 › S-3.AC3: no CRM Guru in agents or code (890ms)
  === KPI Tile-by-Tile ===
  activePipeline: 99
  appointmentsToday: 0
  openEscalations: 9
  outboundSent24h: 0
  totalLeads: 557
  newLeads: 9
  activeLeads: 208
  soldLeads: 19
  conversionRate: 3.4
  conversations: 213
  ✓   4 [sprint] › tests/e2e/s3-sales.spec.ts:83:1 › S-3.AC4: KPI tiles match API sources (2.6s)
  VIN: totalLeads=557, newLeads=9, active=208
  ✓   5 [sprint] › tests/e2e/s3-sales.spec.ts:126:1 › S-3.AC5: VIN leads summary has non-zero newLeads (1.1s)
  Pipeline: active=99, appointments=0
  ✓   6 [sprint] › tests/e2e/s3-sales.spec.ts:140:1 › S-3.AC6/AC7: pipeline data present (881ms)
  Appointments: 9 total, 6 from voice/widget
  ✓   7 [sprint] › tests/e2e/s3-sales.spec.ts:154:1 › S-3.AC8: appointments endpoint responds (891ms)
  Data Guru response: 1442 chars, contains lead data
  ✓   8 [sprint] › tests/e2e/s3-sales.spec.ts:172:1 › S-3.AC9: Data Guru returns real VIN data (12.5s)
  Sales Coach response: 1311 chars, contains advice
  ✓   9 [sprint] › tests/e2e/s3-sales.spec.ts:209:1 › S-3.AC10: Sales Coach provides coaching advice (10.4s)
  Writer response: 3446 chars, contains email content
  ✓  10 [sprint] › tests/e2e/s3-sales.spec.ts:242:1 › S-3.AC11: Communication Writer produces email draft (21.2s)

  10 passed (53.9s)
```

## Summary

| Metric | Value |
|--------|-------|
| Total tests | 10 |
| Passed | 10 |
| Failed | 0 |
| Duration | 53.9s |

## Verdict

**SMOKE PASS**
