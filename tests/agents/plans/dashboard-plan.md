# Test Plan: Dashboard Domain

**Domain:** Dashboard (`/`)
**Created by:** Planner Agent (T-001 Step 3)
**Status:** Example / Reference

---

## Exploration Summary

The following sources informed this plan:

1. **Existing tests** (`tests/e2e/domain-02-dashboard.spec.ts`) — 5 hand-authored tests covering page load, role-specific metrics, left popout sidebar, right panel absence, and layout order (metrics above chat). These establish known selectors and behavior baselines.
2. **Auth helper** (`tests/e2e/helpers/auth.ts`) — API login flow with httpOnly cookie, tour dismissal via localStorage, file-based token cache. Available roles: superAdmin, partnerAdmin, orgAdmin, executive, sales, service, marketing, plus per-dealer org admins.
3. **Seed spec** (`tests/e2e/seed.spec.ts`) — Canonical login-and-navigate pattern: POST `/api/auth/login`, dismiss tours via `addInitScript`, `goto('/')` with `domcontentloaded`, verify URL and content.
4. **MCP helper** (`tests/e2e/helpers/mcp.ts`) — MCP endpoint at `https://mcp.huminicdev.com/dax/mcp`, JSON-RPC `tools/call` interface. Used for live exploration of page structure and element discovery.

---

## Test Cases

### TC-D01: Dashboard loads and renders content for org_admin
- **Priority:** P1
- **Description:** Verify the dashboard page loads without redirect to /login and renders meaningful content.
- **Role:** org_admin (serra_honda@huminic.ai)
- **Steps:**
  1. Login via API as org_admin
  2. Dismiss product tours
  3. Navigate to `/`
  4. Wait for page to stabilize (2s)
  5. Check URL does not contain `/login`
  6. Check body text length > 100 characters
- **Expected Result:** Page loads at `/` with visible content. No login redirect.
- **Exploration basis:** Seed spec pattern; confirms baseline app availability.

### TC-D02: Metric tiles are present for org_admin
- **Priority:** P1
- **Description:** Verify that metric tiles render on the dashboard for an org_admin user.
- **Role:** org_admin
- **Steps:**
  1. Login and navigate to `/` as org_admin
  2. Query `[data-testid^="metric-tile-"]` elements
  3. Verify at least one tile exists
  4. Verify tiles contain non-empty text
- **Expected Result:** One or more metric tiles visible with text content.
- **Exploration basis:** Existing test 2.2 uses this selector; MCP snapshot confirms tile presence.

### TC-D03: Sales role sees dashboard without admin-only elements
- **Priority:** P1
- **Description:** Verify that a sales user can access the dashboard and does not see admin-restricted content.
- **Role:** sales (sales_staff@huminic.ai)
- **Steps:**
  1. Login and navigate to `/` as sales
  2. Verify page loads (URL not `/login`, content present)
  3. Query metric tiles
  4. Check that admin-specific navigation items (e.g., Settings, Billing) are not prominently visible or accessible
- **Expected Result:** Dashboard renders for sales role. Content is present but potentially different from org_admin view.
- **Exploration basis:** Existing test 2.2 compares admin vs sales metrics; seed spec documents role availability.

### TC-D04: Dashboard API — metrics endpoint returns valid data
- **Priority:** P2
- **Description:** Verify the dashboard metrics API endpoint returns structured data.
- **Role:** org_admin
- **Steps:**
  1. Login via API as org_admin to obtain access token
  2. GET `/api/dashboard/metrics` (or equivalent) with Bearer token
  3. Verify 200 response
  4. Verify response body contains expected metric fields
- **Expected Result:** API returns 200 with JSON containing metric data.
- **Exploration basis:** Metric tiles must be fed by an API. API-level test is faster and more stable than browser test.

### TC-D05: Chat interface is present below metrics
- **Priority:** P2
- **Description:** Verify the AI chat interface renders on the dashboard below the metric tiles.
- **Role:** org_admin
- **Steps:**
  1. Login and navigate to `/` as org_admin
  2. Locate chat-related elements (textarea, chat container)
  3. Verify at least one chat element exists
  4. If both metrics and chat are found, verify metrics Y position < chat Y position
- **Expected Result:** Chat interface is visible and positioned below metrics.
- **Exploration basis:** Existing test 2.5 validates this layout; confirms expected page structure.

### TC-D06: No console errors on dashboard load
- **Priority:** P2
- **Description:** Verify the dashboard loads without critical JavaScript errors.
- **Role:** org_admin
- **Steps:**
  1. Attach console error listener before navigation
  2. Login and navigate to `/` as org_admin
  3. Wait for stabilization
  4. Filter out known non-critical noise (favicon, websocket, ResizeObserver, net::ERR, 404 static assets)
  5. Assert no remaining critical errors
- **Expected Result:** Zero critical console errors.
- **Exploration basis:** Existing test 2.1 uses the same pattern and noise filter list.

### TC-D07: Partner admin sees multi-dealership dashboard
- **Priority:** P3
- **Description:** Verify that a partner_admin user with multiple dealerships sees appropriate multi-org content.
- **Role:** partner_admin (duanekwells@gmail.com — Cage Automotive, 5 dealerships)
- **Steps:**
  1. Login and navigate to `/` as partner_admin
  2. Verify page loads
  3. Check for multi-dealership indicators (dealership selector, aggregated metrics)
- **Expected Result:** Dashboard loads with content appropriate for a partner overseeing multiple dealerships.
- **Exploration basis:** Auth helper documents partner_admin role with "sees 5 dealerships" note.

### TC-D08: Executive role dashboard access
- **Priority:** P3
- **Description:** Verify executive role can access dashboard with appropriate content visibility.
- **Role:** executive (executive_staff@huminic.ai)
- **Steps:**
  1. Login and navigate to `/` as executive
  2. Verify page loads without login redirect
  3. Verify metric tiles or executive-appropriate content renders
- **Expected Result:** Dashboard accessible to executive role with relevant content.
- **Exploration basis:** Role listed in auth helper; not covered by existing hand-authored tests.
