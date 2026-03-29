# VFY-03 Smoke Test — s2-teambox.spec.ts

**Verdict: SMOKE PASS**

**Date:** 2026-03-28
**Runner:** Dev (files only)
**Command:** `npx playwright test tests/e2e/s2-teambox.spec.ts --reporter=list`
**Duration:** 13.5s
**Workers:** 1

## Results

| # | Test | Status | Time |
|---|------|--------|------|
| 1 | S-2.AC17: channel filter — sms returns only sms | PASS | 1.1s |
| 2 | S-2.AC17: channel filter — email returns only email | PASS | 895ms |
| 3 | S-2.AC17: channel filter — voice returns only voice | PASS | 919ms |
| 4 | S-2.AC5: VAPI calls endpoint returns data | PASS | 1.8s |
| 5 | S-2.AC7: Tavus conversations endpoint responds | PASS | 1.5s |
| 6 | S-2.AC9: filter chips not light blue | PASS | 4ms |
| 7 | S-2.AC10/AC11: manual message send via API | PASS | 1.9s |
| 8 | S-2.AC12/AC13: STOP adds to blacklist, blocks sends | PASS | 529ms |
| 9 | S-2.AC14: refetchInterval set for near-real-time | PASS | 5ms |
| 10 | S-2.AC15: takeover — assign user stops AI | PASS | 1.7s |
| 11 | S-2.AC16: un-assign resumes AI | PASS | 1.3s |
| 12 | S-2.AC1: top menu bar exists in code | PASS | 5ms |
| 13 | S-2.AC2/AC3: popout has SMS/Email/Phone/Video/Tasks, no Conversations | PASS | 6ms |
| 14 | S-2.AC5: phone tab content exists in code | PASS | 3ms |
| 15 | S-2.AC7: video tab content exists in code | PASS | 3ms |

## Summary

- **15 passed, 0 failed, 0 skipped**
- All Sprint-2 acceptance criteria covered by tests are green
- Channel filters (sms, email, voice) verified against live data
- VAPI calls endpoint returned 5 records
- Tavus endpoint responded (0 conversations — expected in current state)
- Manual send, takeover/release, STOP handling all verified
- No app files modified
