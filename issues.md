# Nexxus Connect v2.2 — Open Issues

## Statuses
- **OPEN** — Not yet worked on
- **VERIFIED** — Smoke test passed
- **CLOSED** — E2E confirmed

## Domains
- **FE**: Frontend | **BE**: Backend | **DT**: Data | **AU**: Auth/Security | **IN**: Infrastructure

---

## CLOSED (smoke tested + E2E confirmed)

I-061, I-062, I-063, I-064, I-065, I-066, I-068, I-069, I-070, I-071, I-072, I-073, I-074, I-075, I-076, I-077, I-078, I-080, I-081, I-082, I-083, I-084, I-085

---

## OPEN

### [AU] I-088: Partner Admin org switch broken — missing subsidiaries + Huminic visible
**Background:** User-reported. Durran (partner_admin on Cage Automotive) logged in at dev.huminicdev.com. `accessibleOrganizations` only returns Huminic + Cage Automotive. The 5 dealerships (Serra Honda, Serra Nissan, Tony Serra Ford, Ford of Columbia, Hyundai of Columbia) are missing. Switching to Serra Honda fails with "could not switch organization". Root cause: `server/routes/auth.ts` lines 130-136 resolve the partner group by going UP from Cage to Huminic (via partnerId), then looking DOWN one level for orgs with `partnerId = Huminic`. But the dealerships have `partnerId = Cage`, not Huminic. Two problems:
1. Partner Admin should see their own org + all orgs where `partnerId` = their org (Cage + 5 dealerships)
2. Huminic should NOT be visible to Partner Admins — only Super Admins
**Outcome:** Partner Admin sees own org + all subsidiaries. Huminic hidden from non-Super-Admin roles.
**Acceptance Criteria:**
- Login as Durran → accessibleOrganizations includes Cage + 5 dealerships
- Huminic NOT in accessibleOrganizations for Partner Admin
- Switch to Serra Honda succeeds
- Switch to all 5 dealerships succeeds
- Super Admin still sees all orgs including Huminic
**Next Sprint:** Yes
**Domain Sub-Sprint:** AU

### [DT] I-086: Insert VAPI call log leads into VIN Solutions per store
**Background:** Historical VAPI call logs exist as JSON files in `/home/ubuntu/Live-Store/nexxus/uploads/`. Each file contains call data for a specific dealership with fields: `customer_name`, `customer_phone`, `summary`, `transcript`, `store`, `call_id`, `type`, `duration_seconds`, `ended_reason`, `recording_url`. These leads need to be inserted into the corresponding VIN Solutions stores within the Durran Cage account.
Files:
- `vapi-calls-hyundai-of-columbia.json` → Hyundai of Columbia
- `vapi-calls-ford-of-columbia.json` → Ford of Columbia
- `vapi-calls-serra-honda-of-sylacauga.json` → Serra Honda
- `vapi-calls-serra-nissan-of-sylacauga.json` → Serra Nissan
- `vapi-calls-tony-serra-ford.json` → Tony Serra Ford
**Outcome:** All leads from VAPI call logs inserted into VIN Solutions under the correct dealer IDs in the Durran Cage account.
**Acceptance Criteria:** For each file: parse call logs → extract lead data (name, phone) → POST to VIN Solutions API via MCP → verify contact appears in correct store.
**Next Sprint:** Yes

### [BE] I-087: Re-enable inbound lead webhook email notifications to Org Admins + extend to Tavus
**Background:** Old app at `/home/ubuntu/Live-Store/nexxus` sent email notifications on VAPI `end-of-call-report` webhook events. Recipients determined by role hierarchy: Super Admins + Partner Admins (with org access) + Org Admins. Rich HTML email via Resend containing: assistant name, customer phone, call type, duration, cost, recording link, full transcript, lead narrative. Idempotency via `notification_sent` flag. Tavus had NO email notifications in the old app — only in-app. User wants email extended to Tavus too.
**Outcome:** Org Admins/Partner Admins/Super Admins receive email notifications when: (1) VAPI call completes with lead data, and (2) Tavus video conversation completes. Emails route through callMCP (Resend).
**Acceptance Criteria:**
- VAPI end-of-call webhook triggers email to store's admins (role-based hierarchy)
- Tavus conversation completion triggers email to store's admins
- Emails include: caller/visitor name, phone, transcript/summary, recording link (VAPI), duration
- Emails route through callMCP (Resend provider)
- Idempotency: duplicate webhooks don't send duplicate emails
- Email from address: notifications@huminic.ai
**Next Sprint:** Yes

---

## Test Infrastructure

| ID | Issue | Status |
|----|-------|--------|
| TI-010 | Accessibility (aria-labels, color contrast) | OPEN |

---

**Last updated:** 2026-03-19 (I-082/I-083/I-084 verified and closed, I-088 added, I-087 scope confirmed)
**CLOSED:** 23 items
**OPEN:** 3 items (1 AU: FIXED, 1 DT: FIXED, 1 BE: IMPLEMENTED)
**TI OPEN:** 1 item (accessibility)
**Pending E2E verification before CLOSED**
