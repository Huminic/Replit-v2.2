# Nexxus Connect v2.2 — Open Issues

Every item has a domain tag, Background, Outcome, and Acceptance Criteria.
Fixed items are removed. Only truly open issues remain here.

## Domains
- **FE**: Frontend — UI, pages, forms, client logic
- **BE**: Backend — APIs, business rules, services, integrations
- **DT**: Data — schema, database, migrations, reporting data
- **AU**: Auth/Security — login, permissions, security controls
- **IN**: Infrastructure — deploys, environments, monitoring, scaling

---

## Open

### [FE] I-061: Tour allows bypass by clicking open area
**Background:** User reports that clicking in an open area outside the tour window dismisses/bypasses the tour. The tour should only be dismissable via the explicit X button in the tour window.
**Outcome:** Clicking outside the tour window does nothing. Only the X button dismisses the tour step.
**Acceptance Criteria:** Tour is active -> click outside the tour window -> tour remains visible -> click X button -> tour dismisses.
**Next Sprint:** Yes

### [FE] I-062: Sidebar popout links not navigating
**Background:** User reports links in the sidebar popout menu are not working — clicking them does nothing. This was previously reported and supposedly fixed but is still broken.
**Outcome:** All links in the sidebar popout navigate to the correct page.
**Acceptance Criteria:** Click each link in the sidebar popout -> page navigates to the correct route -> content loads.
**Next Sprint:** Yes

### [DT] I-063: Dashboard metrics need verification against actual data
**Background:** User requires that the numbers displayed on dashboards for all dealers be verified by querying the data source directly and comparing to what the UI shows. No assumption that displayed data is correct.
**Outcome:** Every metric tile across all dealer dashboards shows data that matches a direct database/API query.
**Acceptance Criteria:** For each dealer org -> query warehouse_leads count, conversation count, campaign stats directly -> compare to dashboard tile values -> all match.
**Next Sprint:** Yes

### [FE] I-064: Lead popup modal does not show contact list
**Background:** The lead popup modal windows don't show the list of contacts that make up the displayed number. The modal should show records from a URL query. Each record should have a "Show Contact" link that populates the modal with contact details.
**Outcome:** Click a lead metric number -> modal opens showing list of records -> each record has "Show Contact" link -> clicking it populates contact information in the modal.
**Acceptance Criteria:** Click lead count on dashboard -> modal shows list of contacts -> each row has "Show Contact" -> click it -> contact details display (name, phone, email, source).
**Next Sprint:** Yes

### [AU] I-065: Super Admin lands on wrong org after login
**Background:** User (Super Admin) logs in and lands on Serra Honda instead of the Super Admin company (Huminic). Should land on the home page of Huminic, not inside a dealer org.
**Outcome:** Super Admin login -> lands on Huminic org -> home page (main dashboard).
**Acceptance Criteria:** Login as Super Admin -> organization shows "Huminic" -> page is "/" (main dashboard) -> not inside any dealer org.
**Next Sprint:** Yes

### [AU] I-066: Org switch redirects to login screen instead of new org home
**Background:** When switching organizations, the user is taken back to the login screen instead of being redirected to the home page of the new org. This was previously reported as a requirement.
**Outcome:** Org switch -> stays authenticated -> navigates to "/" of the new org -> org name updates in header.
**Acceptance Criteria:** Switch org in topbar -> page shows new org name -> lands on "/" -> does NOT go to /login -> user remains authenticated.
**Next Sprint:** Yes

### [IN] I-067: Auth rate limiter too aggressive for testing
**Background:** Rate limiter is 5 requests per 15 minutes per IP. Running Playwright tests exhausts this in seconds, causing false test failures. Not suitable for development/testing.
**Outcome:** Rate limit increased to allow test execution (e.g. 200 requests per 15 minutes) or made configurable via env var.
**Acceptance Criteria:** Full Playwright suite runs without 429 errors from auth rate limiter.
**Next Sprint:** Yes

### [FE] I-059: Tavus widget not configured for demo org
**Background:** Demo org cannot initialize Tavus video sessions — "not configured" error.
**Outcome:** Demo org has Tavus configuration. Video widget initializes successfully.
**Acceptance Criteria:** Open widget for demo org -> select Video -> Tavus session starts without "not configured" error.
**Next Sprint:** No (depends on whether demo org is in scope for launch)

---

## Test Infrastructure Issues

| ID | Issue | Tests Affected |
|----|-------|---------------|
| TI-008 | Test selectors don't match current UI (KPI cards, sidebar, campaign list) | 2.2, 2.3, 6.1, 7.5, 7.6 |
| TI-009 | Conversation creation API fails in tests (POST /api/conversations) | 3.4-3.9 |
| TI-010 | Accessibility tests (aria-labels, color contrast) | 11.1, 11.2 |

---

## Fixed in REM-1 / REM-2 (removed from open)

I-036, I-037, I-038, I-040, I-041, I-042, I-043, I-044, I-045, I-046, I-047, I-048, I-049, I-050, I-051, I-052, I-053, I-054, I-055, I-056, I-057, I-058, I-060

---

## External (fixed by user)

| ID | Issue | Status |
|----|-------|--------|
| I-016 | central-mcp vin_create_contact missing dealerId | FIXED |
| I-017 | central-mcp tm_list_chats offset vs page | FIXED |

---

**Last updated:** 2026-03-19 (user-reported bugs + cleanup)
**Open:** 8 items (3 FE, 1 DT, 2 AU, 1 IN, 1 deferred)
**Test infrastructure:** 3 items
**External fixed:** 2 items
