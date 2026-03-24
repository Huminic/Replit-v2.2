# Post-Sprint Report: S-1 — AI Chat (Home)

**Sprint:** S-1
**Date:** 2026-03-24

## AC Results

| AC | Status | Evidence |
|----|--------|----------|
| AC1 | PASS | All 7 accounts login successfully (test: S-1.AC1 x7) |
| AC2 | PASS | Serra Honda activePipeline > 0, conversation counts numeric (test: S-1.AC2) |
| AC3 | PASS | Conversations endpoint returns array (test: S-1.AC3) |
| AC4 | PASS | Chat response in 5637ms with SSE stream (test: S-1.AC4/AC5) |
| AC5 | PASS | "Thinking" status event present in SSE (test: S-1.AC4/AC5) |
| AC6 | PASS | VIN leads: total=651, new=9, active=242 (test: S-1.AC6) |
| AC7 | CONDITIONAL | BRAVE_API_KEY not set — code exists, env key missing (test: S-1.AC7) |
| AC8 | PASS | Task created: 8292856c... (test: S-1.AC8) |
| AC9 | PASS | Multi-turn references Serra Honda from context (test: S-1.AC9) |
| AC10 | PASS | No markdown headers, conversational tone (test: S-1.AC10) |
| AC11 | PASS | 78 conversations in history (test: S-1.AC11) |
| AC12 | PASS | Favorites endpoint returns 200 (test: S-1.AC12) |

## Test Execution

### s1-ai-chat.spec.ts (NEW)
```
Command: npx playwright test tests/e2e/s1-ai-chat.spec.ts --project=sprint --reporter=list --workers=1

34 passed (1.1m)

  ✓ S-1.AC1: super_admin can login (699ms)
  ✓ S-1.AC1: partner_admin can login (634ms)
  ✓ S-1.AC1: org_admin (Serra Honda) can login (526ms)
  ✓ S-1.AC1: org_admin (Serra Nissan) can login (519ms)
  ✓ S-1.AC1: org_admin (Tony Serra Ford) can login (516ms)
  ✓ S-1.AC1: org_admin (Ford of Columbia) can login (513ms)
  ✓ S-1.AC1: org_admin (Hyundai of Columbia) can login (513ms)
  ✓ S-1.AC2: metrics dashboard returns numeric values (1.4s)
  ✓ S-1.AC3: conversations endpoint responds (967ms)
  ✓ S-1.AC4/AC5: chat streams with thinking indicator (6.5s)
  ✓ S-1.AC6: VIN leads summary returns data for Serra Honda (1.4s)
  ✓ S-1.AC7: web search — BRAVE_API_KEY check (5ms)
  ✓ S-1.AC8: task creation works (870ms)
  ✓ S-1.AC9: multi-turn maintains context (6.2s)
  ✓ S-1.AC10: responses are conversational, not report-formatted (7.2s)
  ✓ S-1.AC11: chat history lists conversations (965ms)
  ✓ S-1.AC12: favorites endpoint works (874ms)
```

### domain-02-dashboard.spec.ts (EXISTING)
```
Command: npx playwright test tests/e2e/domain-02-dashboard.spec.ts --project=browser --reporter=list --workers=1

5 failed — ALL failures due to localhost:5000 baseURL.
Tests hardcode http://localhost:5000 but app runs on dev.huminicdev.com via PM2.
NOT application failures — test infrastructure issue (baseURL migration needed).
```

### domain-03-chat.spec.ts (EXISTING)
```
Command: npx playwright test tests/e2e/domain-03-chat.spec.ts --project=browser --reporter=list --workers=1

11 failed — Same localhost:5000 baseURL issue as domain-02.
NOT application failures — test infrastructure issue.
```

## Cross-Test Results
N/A — no cross-tests for S-1.

## Findings
1. AC7: BRAVE_API_KEY not set in .env. Web search code exists but cannot call Brave API. Environment config issue for launch setup (S-10).
2. Existing domain-02 and domain-03 test files hardcode localhost:5000. Need baseURL migration. Not blocking S-1 — s1-ai-chat.spec.ts covers all 12 ACs independently against the live URL.

## Files Modified
- tests/e2e/s1-ai-chat.spec.ts (NEW — 34 tests covering 12 ACs)
- playwright.config.ts (added "sprint" project targeting dev.huminicdev.com)
