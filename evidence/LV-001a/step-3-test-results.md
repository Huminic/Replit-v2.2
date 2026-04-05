# Step 3: Workflow E2E Test Results

**Date:** 2026-04-04
**Target:** https://dev.huminicdev.com
**Command:** `BASE_URL=https://dev.huminicdev.com npx playwright test --project=workflow`
**Total execution time:** ~6.1 minutes (2 workers)
**Runs:** 2 consecutive runs with identical results

## Summary

| Metric | Count |
|--------|-------|
| Total tests | 135 |
| Passed | 73 |
| Failed | 20 |
| Did not run (skipped) | 42 |

## Per-File Results

| File | Total | Passed | Failed | Skipped | Notes |
|------|-------|--------|--------|---------|-------|
| wf-campaign.spec.ts | 10 | 3 | 1 | 6 | Serial — steps 5-10 skipped after step 4 failed |
| wf-cold-sales.spec.ts | 5 | 0 | 5 | 0 | All failed — SMS webhook returns 404 |
| wf-cold-service.spec.ts | 5 | 0 | 5 | 0 | All failed — SMS webhook returns 404 |
| wf-vapi-inbound.spec.ts | 9 | 9 | 0 | 0 | All passed |
| wf-tavus-inbound.spec.ts | 9 | 9 | 0 | 0 | All passed |
| wf-vin-lead.spec.ts | 9 | 5 | 3 | 0 | VIN integration not configured for test org (dealer ID resolution fails) + 1 notification test passed |
| wf-vin-trigger.spec.ts | 10 | 10 | 0 | 0 | All passed |
| wf-widget-chat.spec.ts | 1 | 0 | 1 | 0 | Widget page load timeout |
| wf-widget-form.spec.ts | 7 | 6 | 1 | 0 | Back button test — locator timeout |
| wf-widget-video.spec.ts | 16 | 15 | 1 | 0 | Tavus webhook rejection: expected 400, got 401 |
| wf-widget-callback.spec.ts | 8 | 7 | 1 | 0 | Callback API voice conversation creation returned 500 |
| wf-teambox.spec.ts | 10 | 5 | 1 | 4 | Conversation list not populated (serial skip after) |
| wf-takeover.spec.ts | 6 | 4 | 1 | 1 | Find automated conversation failed — no ai_active conversation found |

**Totals:** 105 unique tests, 135 including retries → 73 passed, 20 failed, 42 did not run

## Failure Details

### 1. wf-cold-sales.spec.ts — ALL 5 TESTS FAILED

**Root cause:** SMS inbound webhook endpoint returns HTTP 404.

```
WF-SALES-1 (line 39): Inbound SMS webhook creates conversation for sales inquiry
  Error: expect(received).toBe(expected)
  Expected: 200
  Received: 404
  Webhook URL: POST /api/webhooks/sms/inbound
```

Tests 2-5 depend on test 1 creating a conversation. Since the webhook returns 404, all subsequent tests fail with "conversationId not set" or similar dependency errors.

### 2. wf-cold-service.spec.ts — ALL 5 TESTS FAILED

**Root cause:** Same as cold-sales — SMS inbound webhook returns 404.

```
WF-SVC-1 (line 35): Inbound SMS webhook creates conversation
  Error: expect(received).toBe(expected)
  Expected: 200
  Received: 404
```

Tests 2-5 cascade-fail due to missing conversation from test 1.

### 3. wf-campaign.spec.ts — 1 FAILED, 6 SKIPPED

**Failed test:**
```
Step 4 (line 175): Verify campaign status after execution
  Error: expect(received).toBe(expected)
  Expected: "completed"
  Received: "executing"
  (after 4.4s polling — campaign did not complete within timeout)
```

Steps 5-10 are serial and did not run because step 4 failed. Campaign execution started successfully (step 3 passed) but did not complete in time.

### 4. wf-vin-lead.spec.ts — 3 FAILED

```
WF-VIN-LEAD-3 (line 127): vin_get_dealer_id resolves Serra Honda org to dealer ID
  Error: VIN integration not found for orgId: 24d64f99-ba04-4b43-af35-fd06f555ac86
  (vin-safe-mcp cannot resolve org to dealer — integration not configured)

WF-VIN-LEAD-4 (line 152): vin_list_users shows users at dealer
  Error: Depends on dealer ID from test 3

WF-VIN-LEAD-5 (line 174): vin_list_lead_sources returns sources for dealer
  Error: Depends on dealer ID from test 3
```

Note: Tests 6-9 passed — they handle the "not configured" case gracefully (prepare returns FAILED status, test asserts on that).

### 5. wf-widget-chat.spec.ts — 1 FAILED

```
WF-WIDGET-CHAT (line 7): end-to-end
  Error: page.goto: Timeout 30000ms exceeded
  (Widget page failed to load within timeout)
```

### 6. wf-widget-form.spec.ts — 1 FAILED

```
Step 6 (line 176): Back button returns to menu
  Error: Timed out 5000ms waiting for expect(locator).toBeVisible()
  Locator: locator('[data-testid="widget-menu"]')
  (Back button navigation did not reveal menu element)
```

### 7. wf-widget-video.spec.ts — 1 FAILED

```
4.1 (line 432): Webhook rejected when persona_id matches no org agent
  Error: expect(received).toBe(expected)
  Expected: 400
  Received: 401
  (Tavus webhook endpoint returns 401 Unauthorized instead of 400 Bad Request for invalid persona)
```

### 8. wf-widget-callback.spec.ts — 1 FAILED

```
WF-CB-05 (line 146): Callback API creates a voice conversation record
  Error: expect(received).toBeGreaterThanOrEqual(expected)
  Expected: >= 200
  Received: 500
  (POST /api/widget/callback returned 500 Internal Server Error)
```

### 9. wf-teambox.spec.ts — 1 FAILED, 4 SKIPPED

```
Step 2 (line 63): Conversation list is populated
  Error: Timed out waiting for conversations to appear in TeamBox
  (Browser test — page loaded but conversation list empty or not rendered)
```

Steps 3-6 skipped (serial dependency).

### 10. wf-takeover.spec.ts — 1 FAILED, 1 SKIPPED

```
Step 1 (line 49): Find automated conversation in TeamBox
  Error: No conversation with ai_active status found in TeamBox
  (Test expects an AI-active conversation to exist for takeover testing)
```

Step 2 skipped (depends on step 1).

## Failure Categories

| Category | Tests | Root Cause |
|----------|-------|------------|
| SMS webhook 404 | 10 | `/api/webhooks/sms/inbound` returns 404 — route not registered or path changed |
| VIN integration not configured | 3 | Serra Honda org has no VIN integration record in DB |
| Campaign timing | 1 (+6 skipped) | Campaign execution does not complete within polling timeout |
| Widget load/navigation | 2 | Widget page timeout + back button locator not found |
| API error responses | 2 | Callback returns 500; Tavus webhook returns 401 instead of 400 |
| Browser rendering | 1 (+4 skipped) | TeamBox conversation list not populated |
| Missing test data | 1 (+1 skipped) | No ai_active conversation for takeover test |

## Pass Rate

- **Overall:** 73/135 = 54.1% (including retries and skips)
- **Unique tests (excluding retries):** 73/105 = 69.5% 
- **Excluding cascade skips (42):** 73/93 = 78.5% of tests that actually ran passed
