# Seed Strategy for Agent-Driven Tests

## Current Seed Approach

### What `tests/e2e/seed.spec.ts` Does

The seed spec is a minimal smoke test that validates the login-and-navigate flow works. It does **not** create test data -- it relies on pre-existing seeded data in the database.

Steps:
1. **API login** -- POST `/api/auth/login` with `orgadmin@serrahonda.com` / `NexxusTest2026`
2. **Tour dismissal** -- `page.addInitScript()` sets `localStorage` keys (`nexxus_tour_dismissed_{page}`) for all known page segments to suppress product tour overlays
3. **Navigation** -- `page.goto('/')` with `waitUntil: 'domcontentloaded'` plus a 2-second stabilization wait
4. **Verification** -- Asserts the URL does not contain `/login` and the body has meaningful content (length > 100)

### Auth Helper (`tests/e2e/helpers/auth.ts`)

The auth helper provides the full authentication infrastructure:

- **`testUsers` registry** -- Named user objects with email, password, role, and orgName. Covers 7 roles: `super_admin`, `partner_admin`, `org_admin`, `executive`, `sales`, `service`, `marketing`. Also includes 4 per-dealer org admin accounts (Serra Nissan, Tony Serra Ford, Hyundai of Columbia, Ford of Columbia).
- **`login(request, user)`** -- API-only login. Returns `{ token, userId, organizationId }`. Uses a file-based token cache (`.playwright-auth-cache.json`) with 50-minute TTL to avoid hitting the auth rate limiter (5 requests per 15 minutes per IP).
- **`loginForBrowser(page, user, targetPath)`** -- Browser login. Always performs a real API login (bypasses cache) to establish the httpOnly refresh cookie in the browser context. Injects tour dismissal via `addInitScript`, then navigates to `targetPath` with a 2-second hydration wait.
- **`authHeader(token)`** -- Returns `{ Authorization: 'Bearer ${token}' }` for API calls.
- **`clearAuthCache()`** -- Deletes the cache file for clean test runs.

### Auth Flow Summary

```
API tests:    login() -> cached token -> authHeader() -> request.get/post()
Browser tests: loginForBrowser(page, user, path) -> fresh login -> cookie set -> goto(path) -> hydration wait
```

### How Existing Domain Specs Use Auth

Three patterns observed in the hand-authored tests:

1. **Shared helper import** (domain-01-auth, domain-09-settings): Import `testUsers`, `login`, `loginForBrowser` from `./helpers/auth`. Use `loginForBrowser(page, testUsers.superAdmin, '/settings')` for browser tests, `login(request, testUsers.superAdmin)` for API tests.

2. **Inline getToken function** (s2-teambox, s3-sales): Define a local `getToken()` that does its own `request.post()` to `/api/auth/login`. Hardcodes the password and sometimes the base URL. No caching.

3. **Direct API call** (seed.spec.ts): Raw `page.request.post('/api/auth/login')` without the helper.

Pattern 1 is the canonical approach. Patterns 2 and 3 exist in older specs.

### Data Created

The seed spec creates **no data**. All test data is pre-seeded in the database:
- 7+ test user accounts across multiple roles
- At least 5 dealership organizations under the Cage Automotive partner
- Conversations, leads, and other domain data already present

## Gaps for Agent-Driven Workflows

### 1. No Data Isolation

All tests -- hand-authored and agent-generated -- share the same pre-seeded database. Agent tests that create data (e.g., new leads, conversations, settings changes) could interfere with:
- Other agent tests running concurrently
- Hand-authored tests that expect specific data states
- Subsequent agent test runs (stale data accumulation)

### 2. No Cleanup Strategy

Neither the seed spec nor the auth helper provides teardown or cleanup utilities. If an agent-generated test creates a lead or modifies a setting, that change persists.

### 3. Rate Limiter Sensitivity

The auth rate limiter allows only 5 login requests per 15 minutes per IP. The file-based cache mitigates this for API tests, but:
- Browser tests always bypass the cache (fresh login required per context)
- A planner agent doing multi-role exploration could exhaust the limit quickly
- Agent test suites with many spec files, each logging in, could hit the limit

### 4. Email Discrepancy Between Seed and Auth Helper

The seed spec uses `orgadmin@serrahonda.com` while the auth helper's `orgAdmin` entry uses `serra_honda@huminic.ai`. These may be two different accounts or aliases. Agent specs should use the auth helper's `testUsers` registry as the canonical source.

### 5. No Test Data Factory

There is no utility for creating domain-specific test data (leads, conversations, campaigns) programmatically. Agent tests that need specific data states must either:
- Rely on whatever exists in the database
- Create data via API calls within the test (and risk leaving it behind)

### 6. No Multi-Org Testing Support in Seed

The seed only validates org admin login for Serra Honda. Agent tests covering partner-level or cross-org features need their own setup for Cage Automotive partner admin.

## Recommendations

### For Agent-Generated Specs

1. **Always use the auth helper.** Import `testUsers`, `login`, `loginForBrowser` from `tests/e2e/helpers/auth`. Never hardcode credentials or inline login functions.

2. **Declare required role in the plan.** Each plan should specify which `testUsers` key the spec needs. The generator should use that exact key.

3. **Prefer read-only tests.** Where possible, agent tests should verify existing state rather than creating or modifying data. This avoids cleanup complexity.

4. **For write tests, use API cleanup in afterEach/afterAll.** If a test must create data, it should delete or revert that data in a teardown block. The cleanup should use the same API that created the data.

5. **Future: build a test data factory.** A utility in `tests/agents/helpers/` (not in `tests/e2e/`) that can create and tear down test data for specific domains. This would be agent-owned infrastructure.

### Test Data Setup Pattern for Agent Specs

```typescript
import { test, expect } from 'playwright/test';
import { testUsers, login, loginForBrowser, authHeader } from '../../e2e/helpers/auth';

test.describe('Domain: Settings', () => {
  // Read-only test -- no setup needed beyond auth
  test('settings page shows tiles for org admin', async ({ page }) => {
    await loginForBrowser(page, testUsers.orgAdmin, '/settings');
    // assertions...
  });

  // Write test -- create and clean up
  test('can update org display name', async ({ page, request }) => {
    const { token } = await login(request, testUsers.orgAdmin);
    const original = await request.get('/api/organization', {
      headers: authHeader(token),
    }).then(r => r.json());

    // ... perform test ...

    // Teardown: restore original value
    await request.patch('/api/organization', {
      headers: authHeader(token),
      data: { displayName: original.displayName },
    });
  });
});
```

### Role Coverage Matrix

Agent plans should reference this when choosing which user to test with:

| testUsers Key | Role | Org | Use For |
|---------------|------|-----|---------|
| superAdmin | super_admin | Huminic | Admin panels, org wizard, system settings |
| partnerAdmin | partner_admin | Cage Automotive | Multi-dealer views, partner billing |
| orgAdmin | org_admin | Serra Honda | Standard dealer operations |
| executive | executive | Huminic | Executive dashboards, reports |
| sales | sales | Huminic | Sales pipeline, lead management |
| service | service | Huminic | Service department features |
| marketing | marketing | Huminic | Campaign management, marketing tools |
| serraNissan | org_admin | Serra Nissan | Cross-dealer testing |
| serraFord | org_admin | Tony Serra Ford | Cross-dealer testing |
| columbiaHyundai | org_admin | Hyundai of Columbia | Cross-dealer testing |
| columbiaFord | org_admin | Ford of Columbia | Cross-dealer testing |
