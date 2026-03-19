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

### [AU] I-085: seed.ts logs admin password to console in production
**Background:** AUDIT-1d found server/seed.ts line 10 logs the seed admin password to console in plaintext. Visible in PM2 logs. Security risk.
**Outcome:** Password not logged. Seed process completes without exposing credentials.
**Acceptance Criteria:** Run seed → check PM2 logs → no password visible.
**Next Sprint:** Yes

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

### [DT] I-086: Insert VAPI call log leads into VIN Solutions per store
**Background:** Historical VAPI call logs exist as JSON files in `/home/ubuntu/Live-Store/nexxus/uploads/`. Each file contains call data for a specific dealership. These leads need to be inserted into the corresponding VIN Solutions stores within the Durran Cage account. Files:
- `vapi-calls-hyundai-of-columbia.json` → Hyundai of Columbia
- `vapi-calls-ford-of-columbia.json` → Ford of Columbia
- `vapi-calls-serra-honda-of-sylacauga.json` → Serra Honda
- `vapi-calls-serra-nissan-of-sylacauga.json` → Serra Nissan
- `vapi-calls-tony-serra-ford.json` → Tony Serra Ford
**Outcome:** All leads from VAPI call logs inserted into VIN Solutions under the correct dealer IDs in the Durran Cage account.
**Acceptance Criteria:** For each file: parse call logs → extract lead data (name, phone, email) → POST to VIN Solutions API via MCP → verify contact appears in correct store.
**Next Sprint:** Yes

### [BE] I-087: Re-enable inbound lead webhook email notifications to Org Admins + extend to Tavus
**Background:** The old app at `/home/ubuntu/Live-Store/nexxus` had a webhook that sent email notifications to Org Admins when inbound VAPI leads arrived. This needs to be re-enabled in this codebase and extended to also cover Tavus conversation completions. Scope needs verified — determine exactly what triggers the email, what data it includes, who receives it (all Org Admins for that store? Just the assigned user?), and what the email template looks like.
**Outcome:** Org Admins receive email notifications when: (1) a VAPI call completes with lead data, and (2) a Tavus video conversation completes. Notifications route through MCP (Resend).
**Acceptance Criteria:**
- VAPI end-of-call webhook triggers email to store's Org Admin(s)
- Tavus conversation completion triggers email to store's Org Admin(s)
- Emails include caller/visitor name, phone, transcript summary
- Emails route through callMCP (Resend provider)
- Verify scope: who receives, what triggers, what template
**Next Sprint:** Yes (investigate scope first)

---

## Test Infrastructure

| ID | Issue | Status |
|----|-------|--------|
| TI-010 | Accessibility (aria-labels, color contrast) | OPEN |

---

**Last updated:** 2026-03-19 (DB-1 migration + I-086, I-087 added)
**VERIFIED:** 7 items (pending E2E)
**OPEN:** 7 items (2 DT, 2 FE, 1 AU, 1 BE, 1 AU)
**TI OPEN:** 1 item (accessibility)
