# Nexxus Connect v2.2 — Open Issues

Every item has a domain tag, status, Background, Outcome, and Acceptance Criteria.

## Statuses
- **OPEN** — Not yet worked on
- **FIXING** — Builder agent working on it
- **FIXED** — Code change made, not yet tested
- **VERIFIED** — Smoke test passed
- **CLOSED** — Removed after E2E confirms
- **DEFERRED** — Not blocking launch

## Domains
- **FE**: Frontend — UI, pages, forms, client logic
- **BE**: Backend — APIs, business rules, services, integrations
- **DT**: Data — schema, database, migrations, reporting data
- **AU**: Auth/Security — login, permissions, security controls
- **IN**: Infrastructure — deploys, environments, monitoring, scaling

---

## VERIFIED (pending E2E confirmation to CLOSE)

### [FE] I-061: Tour allows bypass by clicking open area — VERIFIED
Smoke test: No backdrop onClick handler. Only X/Skip/Escape dismisses.

### [FE] I-062: Sidebar popout links not navigating — VERIFIED
Smoke test: setLocation calls correct, bad conditional removed.

### [DT] I-063: Dashboard metrics need verification — VERIFIED
Smoke test: Serra Honda all metrics match DB (1300 leads, 29 convos, 17 campaigns, 8 agents, 10 tasks).

### [FE] I-064: Lead popup modal does not show contact list — VERIFIED
Smoke test: SalesMetricDetailDialog + SalesContactDetailView present in sales.tsx.

### [AU] I-065: Super Admin lands on wrong org — VERIFIED
Smoke test: Login returns organization "Huminic". Confirmed via API.

### [AU] I-066: Org switch redirects to login — VERIFIED
Smoke test: API returns new token + new org name. Frontend delay added for cookie storage.

---

## OPEN

### [IN] I-068: Dual rate limiter — index.ts overrides auth.ts — VERIFIED
Smoke test: Removed authLimiter from index.ts. 20 rapid logins — no 429s. Only route-level configurable limiter remains.

### [BE] I-069: Campaign execution returns 500 — VERIFIED
Smoke test: Added error handling in campaigns.ts and outbound.ts. Dry run and live execution both return 200 with success: true.

---

## DEFERRED

### [FE] I-059: Tavus widget not configured for demo org — DEFERRED
**Background:** Demo org cannot initialize Tavus video sessions.
**Next Sprint:** No (depends on whether demo org is in scope for launch)

---

## Test Infrastructure Issues

| ID | Issue | Tests Affected | Status |
|----|-------|---------------|--------|
| TI-008 | Test selectors use CSS classes, app uses data-testid | 2.2, 2.3 | VERIFIED |
| TI-009 | Conversation tests missing customerName in POST payload | 3.4-3.9 | VERIFIED |
| TI-010 | Accessibility (aria-labels, color contrast) | 11.1, 11.2 | OPEN |
| TI-011 | Test 4.7 expects array, endpoint returns object | 4.7 | VERIFIED |
| TI-012 | Test 6.1 uses cookieless browser.newContext() | 6.1 | VERIFIED |

---

## Fixed (all sprints)

REM-1: I-036, I-037, I-038, I-040, I-041, I-042, I-043, I-044, I-045, I-046, I-047, I-048, I-049, I-050, I-051, I-052, I-053, I-054, I-055, I-056, I-057, I-058, I-060
REM-2: TI-001 through TI-007, entitlement fail-open
REM-3: I-061, I-062, I-063, I-064, I-065, I-066

## External (fixed by user)

| ID | Issue | Status |
|----|-------|--------|
| I-016 | central-mcp vin_create_contact missing dealerId | FIXED |
| I-017 | central-mcp tm_list_chats offset vs page | FIXED |

---

**Last updated:** 2026-03-19 (ALN-1 smoke test verification)
**VERIFIED (pending E2E):** 8 items (I-061-I-066, I-068, I-069)
**OPEN:** 0 items
**DEFERRED:** 1 item (I-059)
**Test infrastructure:** 4 VERIFIED, 1 OPEN (TI-010 accessibility)
