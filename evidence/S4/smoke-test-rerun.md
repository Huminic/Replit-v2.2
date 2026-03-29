# S-4 Smoke Test Rerun

**Date:** 2026-03-28
**Command:** `npx playwright test tests/e2e/s4-service.spec.ts --reporter=list`
**Verdict:** SMOKE FAIL (18/20 passed, 2 failed)

---

## Results Summary

| # | Test | Result |
|---|------|--------|
| 1 | S-4.AC1: Campaigns is first tab | PASS |
| 2 | S-4.AC2: no Dashboard tab | PASS |
| 3 | S-4.AC3: New Campaign button exists | PASS |
| 4 | S-4.AC4: CSV Upload button exists | PASS |
| 5 | S-4.AC5: campaign detail dialog exists | PASS |
| 6 | S-4.AC6: Insights tab renders KPI content | PASS |
| 7 | S-4.AC7: only Nancy Gaston in service agents | PASS |
| 8 | S-4.AC8: Nancy Gaston has instructions > 100 chars | PASS |
| 9 | S-4.AC9: campaign create and CSV upload works | PASS |
| 10 | S-4.AC10: conversations with campaignId exist | PASS |
| 11 | S-4.AC11: Nancy responds to recall question | **FAIL** |
| 12 | S-4.AC12: Nancy helps schedule appointment | PASS |
| 13 | S-4.AC13/AC14: after-hours logic exists in code | PASS |
| 14 | I-115: sub-menu has no phantom Dashboard label | PASS |
| 15 | I-128: Campaign Safety card has dismiss button | PASS |
| 16 | I-129: campaign action buttons have tooltips | PASS |
| 17 | I-113: service metrics no longer have fake change/trend values | PASS |
| 18 | I-132: campaign creation supports multi-channel via checkboxes | **FAIL** |
| 19 | I-106/I-107: rate limit set to 100 | PASS |
| 20 | S-4.AC15: service metrics return data | PASS |

---

## Failure Details

### Test 11 — S-4.AC11: Nancy responds to recall question

- **Line:** s4-service.spec.ts:178
- **Error:** `Nancy should reference recalls/campaigns/service` — expected `true`, received `false`
- **Analysis:** LLM response did not contain any of the expected keywords (recall, campaign, service, notification). This is a non-deterministic LLM output test — the model responded but the content did not match the keyword filter.

### Test 18 — I-132: campaign creation supports multi-channel via checkboxes

- **Line:** s4-service.spec.ts:311
- **Error:** `expect(received).toContain("checkbox-channel-sms")` — the service.tsx source does not contain a `checkbox-channel-sms` test ID.
- **Analysis:** Multi-channel checkbox UI has not been implemented in `service.tsx`. This is a missing feature, not a flaky test.

---

## Notes

- Test 11 (AC11) is an LLM-dependent test subject to non-determinism. The agent responded (test 12 passed with a 581-char response), but the recall-specific prompt did not trigger expected keywords.
- Test 18 (I-132) is a genuine missing implementation — no checkbox elements for channel selection exist in the component source.
