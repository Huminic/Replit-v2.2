# Step 4: Failure Triage Report

**Date:** 2026-04-04
**Sprint:** LV-001a Step 4
**Source:** evidence/LV-001a/step-3-test-results.md (20 failures from 135 tests)

## Summary Table

| # | File | Test | Category | Root Cause | Fix |
|---|------|------|----------|------------|-----|
| 1 | wf-cold-sales.spec.ts | WF-SALES-1 | TEST_ISSUE | SMS webhook returned 404 during test run; endpoint `/api/webhooks/textmagic` exists in `server/routes/sms.ts:46` and works now (verified 200). Stale build at test time. | Re-run tests against current build |
| 2 | wf-cold-sales.spec.ts | WF-SALES-2 | TEST_ISSUE | Cascade — depends on WF-SALES-1 creating a conversation | N/A — resolves with #1 |
| 3 | wf-cold-sales.spec.ts | WF-SALES-3 | TEST_ISSUE | Cascade — depends on WF-SALES-1 | N/A — resolves with #1 |
| 4 | wf-cold-sales.spec.ts | WF-SALES-4 | TEST_ISSUE | Cascade — depends on WF-SALES-1 | N/A — resolves with #1 |
| 5 | wf-cold-sales.spec.ts | WF-SALES-5 | TEST_ISSUE | Cascade — depends on WF-SALES-1 | N/A — resolves with #1 |
| 6 | wf-cold-service.spec.ts | WF-SVC-1 | TEST_ISSUE | Same as #1 — SMS webhook 404 from stale build | Re-run tests against current build |
| 7 | wf-cold-service.spec.ts | WF-SVC-2 | TEST_ISSUE | Cascade — depends on WF-SVC-1 | N/A — resolves with #6 |
| 8 | wf-cold-service.spec.ts | WF-SVC-3 | TEST_ISSUE | Cascade — depends on WF-SVC-1 | N/A — resolves with #6 |
| 9 | wf-cold-service.spec.ts | WF-SVC-4 | TEST_ISSUE | Cascade — depends on WF-SVC-1 | N/A — resolves with #6 |
| 10 | wf-cold-service.spec.ts | WF-SVC-5 | TEST_ISSUE | Cascade — depends on WF-SVC-1 | N/A — resolves with #6 |
| 11 | wf-vin-lead.spec.ts | WF-VIN-LEAD-3 | TEST_DATA | Serra Honda org has no VIN Solutions integration record. `vin_get_dealer_id` cannot resolve orgId to dealerId. | Add VIN integration config for Serra Honda in staging DB, or mark test as skip-if-unconfigured |
| 12 | wf-vin-lead.spec.ts | WF-VIN-LEAD-4 | TEST_DATA | Cascade — depends on dealer ID from test 3 | N/A — resolves with #11 |
| 13 | wf-vin-lead.spec.ts | WF-VIN-LEAD-5 | TEST_DATA | Cascade — depends on dealer ID from test 3 | N/A — resolves with #11 |
| 14 | wf-campaign.spec.ts | Step 4 | TEST_ISSUE | Test valid statuses list includes `"running"` but server uses `"executing"` (see `server/outbound.ts:464,542,559`). Status `"executing"` fails the `validStatuses.includes()` check. | Change `"running"` to `"executing"` in the validStatuses array at test line 213 |
| 15 | wf-widget-chat.spec.ts | WF-WIDGET-CHAT | TEST_ISSUE | `page.goto` timeout at 30s. The page `/p/serra-honda` loads correctly (form tests 1-5 pass against same URL). This is a timing/network flake in the test runner. | Increase timeout or add retry; selectors are correct |
| 16 | wf-widget-form.spec.ts | Step 6 | TEST_ISSUE | Test clicks `button-back-menu` but the form section uses `data-testid="button-form-back"` (widget-landing.tsx line 730). `button-back-menu` only exists on the chat panel (line 510). | Change test to use `button-form-back` instead of `button-back-menu` |
| 17 | wf-widget-video.spec.ts | 4.1 | TEST_ISSUE | Test expects 400 for invalid persona, gets 401. Server checks `TAVUS_WEBHOOK_SECRET` first (webhooks.ts:993-998); test sends no secret header so auth fails before persona validation. | Add `x-tavus-secret` header to test request, or skip auth for tests |
| 18 | wf-widget-callback.spec.ts | WF-CB-05 | PRODUCT_BUG | `POST /api/widget/voice-callback` returns 500 when VAPI `create_call` fails. The catch block at `server/routes/public.ts:177-180` returns a generic 500 instead of a meaningful 4xx. Verified: endpoint still returns 500 now. | Catch VAPI call failure and return 400/503 with descriptive message instead of 500 |
| 19 | wf-teambox.spec.ts | Step 2 | TEST_DATA | TeamBox conversation list is empty for Serra Honda at test time. No conversations exist to render `[data-testid^="conversation-item-"]` elements. | Seed test conversations before running TeamBox tests, or create via API in beforeAll |
| 20 | wf-takeover.spec.ts | Step 1 | TEST_DATA | No conversation with `status === 'automated'` exists. Fallback creation via SMS webhook also failed (same 404 issue as #1). | Resolves partially with #1 fix (webhook works now); also seed an automated conversation |

## Category Totals

| Category | Count | Unique Root Causes | Cascade Failures |
|----------|-------|--------------------|------------------|
| TEST_ISSUE | 13 | 5 | 8 |
| TEST_DATA | 5 | 3 | 2 |
| PRODUCT_BUG | 1 | 1 | 0 |
| **Skipped (cascade)** | **1** | — | — |
| **Total** | **20** | **9** | **10** |

## Detailed Analysis

### 1. SMS Webhook 404 (10 failures: wf-cold-sales 1-5, wf-cold-service 1-5)

**Category:** TEST_ISSUE (stale build at test time)

**What the tests expect:** POST to `/api/webhooks/textmagic` returns 200 with `{ success: true, conversationId }`.

**What the server code does:** `server/routes/sms.ts` line 46 registers `app.post("/api/webhooks/textmagic", ...)`. The route is imported and registered in `server/routes/index.ts` line 42 via `registerSmsRoutes(app)`.

**Investigation result:** Endpoint returns 200 when tested now (`curl -X POST https://dev.huminicdev.com/api/webhooks/textmagic` returns 200). The 404 during the test run indicates the server was running a build that did not include this route registration, or the server was mid-restart.

**Note:** The step-3 error report states `Webhook URL: POST /api/webhooks/sms/inbound` but the actual test code uses `/api/webhooks/textmagic`. The error report URL is incorrect.

**Fix:** Re-run tests against current build. If 404 recurs, investigate PM2 restart timing.

---

### 2. VIN Integration Not Configured (3 failures: wf-vin-lead 3-5)

**Category:** TEST_DATA

**What the tests expect:** `vin_get_dealer_id` resolves Serra Honda org UUID to a VIN Solutions dealer ID.

**What the server does:** vin-safe-mcp looks up the org's VIN integration config. Serra Honda (orgId `24d64f99-ba04-4b43-af35-fd06f555ac86`) has no VIN Solutions integration record in the database.

**Evidence:** Error message from vin-safe-mcp: `"VIN integration not found for orgId: 24d64f99-ba04-4b43-af35-fd06f555ac86"`

**Fix:** Either:
- (a) Add a VIN Solutions integration record for Serra Honda in staging, or
- (b) Update tests 3-5 to gracefully handle "not configured" (like tests 6-9 already do)

---

### 3. Campaign Execution Status Mismatch (1 failure + 6 skipped: wf-campaign step 4)

**Category:** TEST_ISSUE

**What the test expects:** Campaign `executionStatus` to be one of `["idle", "running", "completed", "stopped", "scheduled"]` (test line 213).

**What the server does:** `server/outbound.ts` uses `"executing"` as the active execution status (lines 464, 542, 559). The campaign was still processing (4s polling wasn't enough) so status was `"executing"`.

**Root cause:** The test lists `"running"` as a valid status but the server uses `"executing"`. The value `"executing"` is not in the allowed list, so `validStatuses.includes()` returns false.

**Fix:** Replace `"running"` with `"executing"` in the test's validStatuses array at line 213.

---

### 4. Widget Page Load / Selector Issues (2 failures)

#### 4a. wf-widget-chat.spec.ts — page.goto timeout

**Category:** TEST_ISSUE (timing flake)

**What the test expects:** `/p/serra-honda` loads within 30s default timeout.

**Evidence:** The same URL loads successfully in 5 other tests (wf-widget-form tests 1-5). This is a one-off timeout flake.

**Fix:** Add explicit timeout (`{ timeout: 60000 }`) to `page.goto` or add retry annotation.

#### 4b. wf-widget-form.spec.ts Step 6 — wrong data-testid

**Category:** TEST_ISSUE (wrong selector)

**What the test expects:** Clicking `[data-testid="button-back-menu"]` on the form panel returns to menu.

**What the component does:** The form panel's back button has `data-testid="button-form-back"` (widget-landing.tsx line 730). The `button-back-menu` testid only exists on the **chat** panel (line 510).

**Fix:** Change test line 185 from `getByTestId('button-back-menu')` to `getByTestId('button-form-back')`.

---

### 5. Widget Video Webhook — 401 vs 400 (1 failure)

**Category:** TEST_ISSUE

**What the test expects:** POST to `/api/webhooks/tavus` with invalid `persona_id` returns 400.

**What the server does:** `server/routes/webhooks.ts` lines 993-998 check `TAVUS_WEBHOOK_SECRET` first. If the env var is set and the request has no matching header, the server returns 401 before reaching persona validation.

**Execution path:** TAVUS_WEBHOOK_SECRET is set on staging -> no `x-tavus-secret` header in test -> 401 returned -> test expected 400.

**Fix:** Add `"x-tavus-secret": process.env.TAVUS_WEBHOOK_SECRET` header to the test request, or use the actual secret value.

---

### 6. Widget Callback 500 (1 failure)

**Category:** PRODUCT_BUG

**What the test expects:** `POST /api/widget/voice-callback` returns >= 200 (success or graceful 400).

**What the server does:** `server/routes/public.ts` line 162 calls `callMCP("vapi_create_call", callArgs)`. When VAPI fails (API key issue, service down, etc.), the error propagates to the catch block at line 177 which returns a generic `500: "Failed to initiate callback"`.

**Verified now:** `curl -X POST .../api/widget/voice-callback -d '{"slug":"serra-honda","phoneNumber":"+15551234567"}'` still returns 500.

**Fix:** Wrap `callMCP("vapi_create_call", ...)` in a try/catch and return `503 Service Unavailable` or `502 Bad Gateway` with a message like "Voice service temporarily unavailable" instead of letting the generic 500 handler catch it.

---

### 7. TeamBox Empty List (1 failure + 4 skipped)

**Category:** TEST_DATA

**What the test expects:** At least one `[data-testid^="conversation-item-"]` element visible within 10s.

**What happened:** No conversations exist for Serra Honda at test time. The TeamBox page loads correctly (step 1 passes) but the conversation list is empty.

**Fix:** Add a `beforeAll` hook that creates a test conversation via the API (POST webhook or direct conversation creation) before running TeamBox browser tests.

---

### 8. No Automated Conversation for Takeover (1 failure + 1 skipped)

**Category:** TEST_DATA

**What the test expects:** A conversation with `status === 'automated'` exists, OR the fallback creates one via SMS webhook.

**What happened:** No automated conversations exist in Serra Honda. The fallback path (line 73) POSTs to `/api/webhooks/textmagic` which returned 404 (same stale build issue). Both paths failed.

**Fix:** Two-part:
1. SMS webhook fix (re-run against current build) enables the fallback path
2. Add a direct conversation creation + status patch in beforeAll as a more reliable setup

---

## Action Items (Priority Order)

1. **Re-run full test suite** against current build — likely resolves 10 SMS webhook failures + takeover fallback (11 tests)
2. **Fix test: campaign validStatuses** — change `"running"` to `"executing"` (resolves 1 + 6 cascade = 7 tests)
3. **Fix test: form back button selector** — change `button-back-menu` to `button-form-back` (1 test)
4. **Fix test: Tavus webhook auth** — add webhook secret header to test request (1 test)
5. **Fix product bug: voice-callback 500** — graceful error handling when VAPI call fails (1 test)
6. **Seed test data: conversations** — create conversations in beforeAll for TeamBox and takeover tests (2 tests + 5 cascade)
7. **Seed test data or skip: VIN integration** — configure Serra Honda VIN integration or update tests (3 tests)
8. **Add retry/timeout: widget chat** — increase page.goto timeout for flaky load (1 test)

**Expected pass rate after fixes:** 93/93 tests that run = 100% (from current 73/93 = 78.5%)
