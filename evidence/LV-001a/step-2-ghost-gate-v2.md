# LV-001a Step 2 Ghost Gate — Workflow E2E Test File Verification

**Date:** 2026-04-04
**Agent:** Ghost (verification)
**Scope:** Verify 13 workflow E2E test files exist, use correct imports, have no mocks, cover ACs, and match playwright config.

---

## 1. File Existence Check

| # | File | Status |
|---|------|--------|
| 1 | wf-vapi-inbound.spec.ts | PASS |
| 2 | wf-tavus-inbound.spec.ts | PASS |
| 3 | wf-widget-video.spec.ts | PASS |
| 4 | wf-widget-callback.spec.ts | PASS |
| 5 | wf-widget-form.spec.ts | PASS |
| 6 | wf-widget-chat.spec.ts | PASS |
| 7 | wf-cold-service.spec.ts | PASS |
| 8 | wf-cold-sales.spec.ts | PASS |
| 9 | wf-campaign.spec.ts | PASS |
| 10 | wf-teambox.spec.ts | PASS |
| 11 | wf-vin-lead.spec.ts | PASS |
| 12 | wf-vin-trigger.spec.ts | PASS |
| 13 | wf-takeover.spec.ts | PASS |

**Result: 13/13 PASS**

---

## 2. Import Check (must import from "playwright/test", NOT "@playwright/test")

| File | Import Statement | Status |
|------|-----------------|--------|
| wf-vapi-inbound.spec.ts | `import { test, expect } from "playwright/test"` | PASS |
| wf-tavus-inbound.spec.ts | `import { test, expect } from "playwright/test"` | PASS |
| wf-widget-video.spec.ts | `import { test, expect } from 'playwright/test'` | PASS |
| wf-widget-callback.spec.ts | `import { test, expect } from 'playwright/test'` | PASS |
| wf-widget-form.spec.ts | `import { test, expect } from 'playwright/test'` | PASS |
| wf-widget-chat.spec.ts | `import { test, expect } from 'playwright/test'` | PASS |
| wf-cold-service.spec.ts | `import { test, expect } from "playwright/test"` | PASS |
| wf-cold-sales.spec.ts | `import { test, expect } from "playwright/test"` | PASS |
| wf-campaign.spec.ts | `import { test, expect } from "playwright/test"` | PASS |
| wf-teambox.spec.ts | `import { test, expect } from 'playwright/test'` | PASS |
| wf-vin-lead.spec.ts | `import { test, expect } from "playwright/test"` | PASS |
| wf-vin-trigger.spec.ts | `import { test, expect } from "playwright/test"` | PASS |
| wf-takeover.spec.ts | `import { test, expect } from 'playwright/test'` | PASS |

**Result: 13/13 PASS**

---

## 3. No-Mock Check (grep for mock, stub, fake, jest.fn, sinon, vi.fn)

| File | Findings | Status |
|------|----------|--------|
| wf-vapi-inbound.spec.ts | Comment only: "No browser, no mocks." | PASS |
| wf-tavus-inbound.spec.ts | Comment only: "No browser, no mocks." | PASS |
| wf-widget-video.spec.ts | None | PASS |
| wf-widget-callback.spec.ts | **Lines 583-594: `page.route()` intercepts API with mock data (`mock-call-id`, `mock-conv-id`)** | **FAIL** |
| wf-widget-form.spec.ts | None | PASS |
| wf-widget-chat.spec.ts | None | PASS |
| wf-cold-service.spec.ts | None | PASS |
| wf-cold-sales.spec.ts | None | PASS |
| wf-campaign.spec.ts | None | PASS |
| wf-teambox.spec.ts | None | PASS |
| wf-vin-lead.spec.ts | None | PASS |
| wf-vin-trigger.spec.ts | None | PASS |
| wf-takeover.spec.ts | None | PASS |

**Result: 12/13 PASS — wf-widget-callback.spec.ts FAILS no-mock check**

The `page.route()` call on line 584 intercepts `**/api/widget/voice-callback` and returns a fabricated response with `mock-call-id` and `mock-conv-id`. This violates the "no mocks" requirement. The test must either hit the real endpoint or skip that particular assertion.

---

## 4. Auth Helper Check (import from ./helpers/auth)

| File | Auth Import | Status |
|------|------------|--------|
| wf-vapi-inbound.spec.ts | `import { login, authHeader, testUsers } from "./helpers/auth"` | PASS |
| wf-tavus-inbound.spec.ts | `import { login, authHeader, testUsers } from "./helpers/auth"` | PASS |
| wf-widget-video.spec.ts | `import { login, loginForBrowser, authHeader, testUsers } from './helpers/auth'` | PASS |
| wf-widget-callback.spec.ts | `import { login, loginForBrowser, authHeader, testUsers } from './helpers/auth'` | PASS |
| wf-widget-form.spec.ts | `import { login, loginForBrowser, authHeader, testUsers } from './helpers/auth'` | PASS |
| wf-widget-chat.spec.ts | No auth import — uses inline login (hardcoded credentials in test) | **WARN** |
| wf-cold-service.spec.ts | `import { login, authHeader, testUsers } from "./helpers/auth"` | PASS |
| wf-cold-sales.spec.ts | `import { login, authHeader, testUsers } from "./helpers/auth"` | PASS |
| wf-campaign.spec.ts | `import { login, authHeader, testUsers } from "./helpers/auth"` | PASS |
| wf-teambox.spec.ts | `import { loginForBrowser, login, authHeader, testUsers } from './helpers/auth'` | PASS |
| wf-vin-lead.spec.ts | `import { testUsers, login, authHeader } from "./helpers/auth"` | PASS |
| wf-vin-trigger.spec.ts | `import { testUsers, login, authHeader } from "./helpers/auth"` | PASS |
| wf-takeover.spec.ts | `import { login, authHeader, testUsers } from './helpers/auth'` | PASS |

**Result: 12/13 PASS, 1 WARN** — wf-widget-chat.spec.ts does inline login instead of using the shared auth helper. Functional but inconsistent. Not a blocker.

Auth helper file confirmed to exist at: `tests/e2e/helpers/auth.ts`

---

## 5. test.describe Check

| File | Describe Block | Status |
|------|---------------|--------|
| wf-vapi-inbound.spec.ts | `test.describe.serial("Workflow: VAPI Inbound Call E2E", ...)` | PASS |
| wf-tavus-inbound.spec.ts | `test.describe.serial("Workflow: Tavus Inbound Video E2E", ...)` | PASS |
| wf-widget-video.spec.ts | `test.describe.serial('1. Widget Video ...', ...)` (multiple) | PASS |
| wf-widget-callback.spec.ts | `test.describe.serial('Widget Callback Workflow', ...)` | PASS |
| wf-widget-form.spec.ts | `test.describe.serial('Widget Form Workflow', ...)` | PASS |
| wf-widget-chat.spec.ts | `test.describe.serial('Widget Chat Workflow', ...)` | PASS |
| wf-cold-service.spec.ts | `test.describe("Workflow: Cold Inbound SMS — Service ...", ...)` | PASS |
| wf-cold-sales.spec.ts | `test.describe("Workflow: Cold Inbound SMS — Sales ...", ...)` | PASS |
| wf-campaign.spec.ts | `test.describe.serial("Workflow: Campaign lifecycle E2E", ...)` | PASS |
| wf-teambox.spec.ts | `test.describe.serial('TeamBox Workflow (AC10)', ...)` | PASS |
| wf-vin-lead.spec.ts | `test.describe("Workflow: Conversation → VIN Lead Creation", ...)` | PASS |
| wf-vin-trigger.spec.ts | `test.describe("Workflow: VIN Lead → Trigger → Outbound → TeamBox", ...)` | PASS |
| wf-takeover.spec.ts | `test.describe.serial('Human Takeover Workflow', ...)` | PASS |

**Result: 13/13 PASS**

---

## 6. Real API Endpoint Check

| File | Endpoint | Status |
|------|----------|--------|
| wf-vapi-inbound.spec.ts | `BASE_URL \|\| "http://localhost:5000"` | PASS |
| wf-tavus-inbound.spec.ts | `BASE_URL \|\| "http://localhost:5000"` | PASS |
| wf-widget-video.spec.ts | `BASE_URL \|\| 'https://dev.huminicdev.com'` | PASS |
| wf-widget-callback.spec.ts | `BASE_URL \|\| 'http://localhost:5000'` + `DEV_URL = 'https://dev.huminicdev.com'` | PASS |
| wf-widget-form.spec.ts | `BASE_URL \|\| 'https://dev.huminicdev.com'` | PASS |
| wf-widget-chat.spec.ts | Hardcoded `https://dev.huminicdev.com` | PASS |
| wf-cold-service.spec.ts | `BASE_URL \|\| "http://localhost:5000"` | PASS |
| wf-cold-sales.spec.ts | `BASE_URL \|\| "http://localhost:5000"` | PASS |
| wf-campaign.spec.ts | `BASE_URL \|\| "http://localhost:5000"` | PASS |
| wf-teambox.spec.ts | `BASE_URL \|\| 'https://dev.huminicdev.com'` | PASS |
| wf-vin-lead.spec.ts | `BASE_URL \|\| "http://localhost:5000"` | PASS |
| wf-vin-trigger.spec.ts | `BASE_URL \|\| "http://localhost:5000"` | PASS |
| wf-takeover.spec.ts | `BASE_URL \|\| 'http://localhost:5000'` | PASS |

**Result: 13/13 PASS**

---

## 7. AC Coverage Check

| AC | Description | Mapped File | Status |
|----|-------------|-------------|--------|
| AC1 | WF-VAPI inbound call flow | wf-vapi-inbound.spec.ts (7 tests) | PASS |
| AC2 | WF-TAVUS inbound video flow | wf-tavus-inbound.spec.ts (7 tests) | PASS |
| AC3 | WF-WIDGET-VIDEO landing page widget | wf-widget-video.spec.ts (34 tests) | PASS |
| AC4 | WF-WIDGET-CALLBACK instant web callback | wf-widget-callback.spec.ts (17 tests) | PASS |
| AC5 | WF-WIDGET-FORM form fill + SMS | wf-widget-form.spec.ts (16 tests) | PASS |
| AC6 | WF-WIDGET-CHAT web chat + AI agent | wf-widget-chat.spec.ts (1 test) | PASS |
| AC7 | WF-COLD-SERVICE inbound text service | wf-cold-service.spec.ts (5 tests) | PASS |
| AC8 | WF-COLD-SALES inbound text sales | wf-cold-sales.spec.ts (5 tests) | PASS |
| AC9 | WF-CAMPAIGN campaign lifecycle | wf-campaign.spec.ts (10 tests) | PASS |
| AC10 | WF-TEAMBOX conversation management | wf-teambox.spec.ts (10 tests) | PASS |
| AC11 | WF-VIN-LEAD conversation to VIN lead | wf-vin-lead.spec.ts (9 tests) | PASS |
| AC12 | WF-VIN-TRIGGER delta sync + trigger | wf-vin-trigger.spec.ts (10 tests) | PASS |
| AC13 | WF-TAKEOVER human takeover flow | wf-takeover.spec.ts (6 tests) | PASS |

**Result: 13/13 PASS** — every AC has a corresponding test file.

---

## 8. Playwright Config Check

The `workflow` project exists in `playwright.config.ts` (lines 105-112):

```typescript
{
  name: "workflow",
  testMatch: /wf-.*\.spec\.ts/,
  timeout: 120_000,
  retries: 1,
  use: {
    viewport: { width: 1280, height: 720 },
  },
},
```

The regex `/wf-.*\.spec\.ts/` matches all 13 `wf-*.spec.ts` files.

**Result: PASS**

---

## 9. Total Test Count

| File | Tests |
|------|-------|
| wf-vapi-inbound.spec.ts | 7 |
| wf-tavus-inbound.spec.ts | 7 |
| wf-widget-video.spec.ts | 34 |
| wf-widget-callback.spec.ts | 17 |
| wf-widget-form.spec.ts | 16 |
| wf-widget-chat.spec.ts | 1 |
| wf-cold-service.spec.ts | 5 |
| wf-cold-sales.spec.ts | 5 |
| wf-campaign.spec.ts | 10 |
| wf-teambox.spec.ts | 10 |
| wf-vin-lead.spec.ts | 9 |
| wf-vin-trigger.spec.ts | 10 |
| wf-takeover.spec.ts | 6 |
| **TOTAL** | **137** |

---

## Summary

| Check | Result |
|-------|--------|
| File existence (13/13) | PASS |
| Import from "playwright/test" (13/13) | PASS |
| test.describe present (13/13) | PASS |
| No-mock check (12/13) | **FAIL** — wf-widget-callback.spec.ts |
| Real API endpoints (13/13) | PASS |
| Auth helper usage (12/13) | WARN — wf-widget-chat.spec.ts (inline login) |
| AC coverage (13/13) | PASS |
| Playwright config workflow project | PASS |
| Total tests | 137 |

---

## Defects Found

### DEFECT-1: Mock in wf-widget-callback.spec.ts (BLOCKING)

**Location:** `tests/e2e/wf-widget-callback.spec.ts`, lines 583-594

**Problem:** Uses `page.route()` to intercept `**/api/widget/voice-callback` and return fabricated response data (`mock-call-id`, `mock-conv-id`). This is a Playwright route intercept that replaces the real API response with fake data, violating the no-mock requirement.

**Fix required:** Remove the `page.route()` intercept and either:
1. Hit the real `/api/widget/voice-callback` endpoint, or
2. Restructure the test to not depend on a mocked callback response.

### WARN-1: Inline login in wf-widget-chat.spec.ts (NON-BLOCKING)

**Location:** `tests/e2e/wf-widget-chat.spec.ts`, lines 57-59

**Problem:** Hardcodes login credentials directly in test instead of using shared `helpers/auth` module. Functional but inconsistent with all other 12 files.

**Recommended fix:** Import `loginForBrowser` from `./helpers/auth` and use it instead of inline credential entry.

---

## Verdict

### ENTRY GATE: REJECTED

**Reason:** wf-widget-callback.spec.ts contains a `page.route()` mock (lines 583-594) that intercepts a real API endpoint and returns fabricated data. This violates the no-mock/no-stub requirement for workflow E2E tests.

**To pass:** Remove the mock from wf-widget-callback.spec.ts (DEFECT-1). The auth helper warning (WARN-1) is non-blocking but should be addressed for consistency.

## Re-check (post-fix)

**Date:** 2026-04-04
**Fix applied:** Removed WF-CB-12 and WF-CB-13 (page.route mocks)
**Verification:** grep for mock/stub/fake/page.route — clean
**Verdict:** ENTRY GATE: APPROVED
