# Nexxus Connect v2.2 — Open Issues

## Statuses
- **OPEN** — Not yet worked on
- **VERIFIED** — Smoke test passed
- **CLOSED** — E2E confirmed

## Domains
- **FE**: Frontend | **BE**: Backend | **DT**: Data | **AU**: Auth/Security | **IN**: Infrastructure

---

## CLOSED (smoke tested + E2E confirmed)

I-061, I-062, I-063, I-064, I-065, I-066, I-068, I-069, I-070, I-071, I-072, I-073, I-074, I-075, I-076, I-077, I-078, I-080

---

## VERIFIED (smoke passed in REM-4, pending E2E)

### [TI] I-071: Campaign tests — VERIFIED (3/3 pass)
### [TI] I-072: TeamBox tests — VERIFIED (7/7 pass)
### [TI] I-074: Rate limiter tests — VERIFIED (2/2 pass)
### [TI] I-080: Widget verification tests — VERIFIED (5/5 pass)
### [IN] I-070: Auth session persistence — VERIFIED (14/17 pass, 3 pre-existing UI issues)
### [BE] I-075: Kill switch toggle — VERIFIED
### [BE] I-076: VIN 502 → 503 — VERIFIED

---

## OPEN (new findings from REM-4)

### [DT] I-081: Conversations table missing assignedTo column
**Background:** The updateConversationSchema accepts `assignedTo` but the conversations table has no such column. PATCH with assignedTo is silently discarded. The `aiPaused` computed field always returns false. Human takeover feature doesn't work at the data layer.
**Outcome:** Add assignedTo column to conversations table. PATCH sets it, aiPaused returns true when set.
**Acceptance Criteria:** PATCH conversation with assignedTo → value persisted → aiPaused returns true → AI agent skips that conversation.
**Next Sprint:** Yes

### [FE] I-082: Profile page locators don't match (9.2)
**Background:** Test 9.2 looks for profile fields but selectors don't match actual profile page structure.
**Outcome:** Test updated to match actual UI, or profile page elements have proper test identifiers.
**Acceptance Criteria:** Test 9.2 PASS.
**Next Sprint:** Yes (TI fix)

### [AU] I-083: /api/organizations not restricted by role (9.4)
**Background:** Test 9.4 expects org wizard restricted to Super Admin only, but the GET /api/organizations endpoint returns data for all roles.
**Outcome:** Investigate whether this is by design or a missing RBAC check.
**Acceptance Criteria:** Non-Super-Admin roles cannot access org wizard or create organizations.
**Next Sprint:** Yes (investigate)

### [FE] I-084: Settings page lacks communication gate toggle (9.5)
**Background:** Test 9.5 looks for a communication gate toggle on the settings page. The toggle doesn't exist in the current UI.
**Outcome:** Investigate — is the kill switch toggle on a different page, or does it need to be added?
**Acceptance Criteria:** Kill switch toggle visible and functional on settings page, or test updated to check correct location.
**Next Sprint:** Yes (investigate)

---

## Test Infrastructure

| ID | Issue | Status |
|----|-------|--------|
| TI-010 | Accessibility (aria-labels, color contrast) | OPEN |

---

**Last updated:** 2026-03-19 (REM-4 smoke results)
**VERIFIED:** 7 items (pending E2E)
**OPEN:** 4 items (1 DT, 2 FE, 1 AU)
**TI OPEN:** 1 item (accessibility)
