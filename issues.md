# Nexxus Connect v2.2 — Open Issues

## Statuses
- **OPEN** — Not yet worked on
- **VERIFIED** — Smoke test passed
- **CLOSED** — E2E confirmed

## Domains
- **FE**: Frontend | **BE**: Backend | **DT**: Data | **AU**: Auth/Security | **IN**: Infrastructure

---

## CLOSED (smoke tested + E2E confirmed)

I-061 through I-085, I-088

---

## REOPENED (previously marked closed, found to be incomplete or broken)

I-086, I-087

---

## OPEN — By Domain

### Auth/Security (AU)

#### [AU] I-097: Durran on wrong org — should be Cage Automotive, currently on Serra Honda
**Background:** Test suite org-switch tests moved Durran to Serra Honda and didn't reliably reset. Durran is partner_admin and should be on Cage Automotive (parent of all 5 dealerships).
**Outcome:** Durran permanently on Cage Automotive. Tests must reset after org switch.
**Acceptance Criteria:** DB query confirms durran@cageautomotive.com organization_id = Cage Automotive UUID.

#### [AU] I-098: Victoria missing additional_org_ids for Serra Nissan and Tony Serra Ford
**Background:** Victoria is org_admin on Serra Honda but should also have visibility into Serra Nissan and Tony Serra Ford (all Sylacauga stores). Her additional_org_ids is null.
**Outcome:** Victoria's additional_org_ids includes Serra Nissan and Tony Serra Ford UUIDs.
**Acceptance Criteria:** Victoria can switch to Serra Nissan and Tony Serra Ford. Receives notifications for those stores.

### Backend (BE)

#### [BE] I-087: Email notification template and recipient logic — REOPENED
**Background:** Originally implemented in REM-8-BE by a builder agent. Multiple problems: (1) Builder agent wrote a new email template instead of copying the working one from /home/ubuntu/Live-Store/nexxus. (2) Recipient logic does not walk the org hierarchy via partner_id — partner_admin (Durran) does not receive emails for child store calls. (3) Code was deployed without CommGate check — test webhook payloads sent real emails to real org admins (Durran received fake lead notification). (4) CommGate check has now been added but the template and recipient logic still need to be replaced with the old app's working code.
**Outcome:** Email notifications use the exact template from the old app. Recipients determined by walking the org hierarchy: org admins for the store + partner_admin for the parent group + super_admins. All gated by CommGate (outbound_enabled + email_enabled).
**Acceptance Criteria:**
- Template matches /home/ubuntu/Live-Store/nexxus/server/services/notifications/notificationEmailService.ts
- Hyundai call → email to sam, durran, duane (not admin@)
- Ford call → email to durran, duane
- Serra Honda call → email to victoria, durran, duane
- Serra Nissan call → email to victoria, durran, duane
- Tony Serra Ford call → email to victoria, durran, duane
- CommGate off → no emails sent
- Test payloads with fake phone numbers → no emails sent

#### [BE] I-086: VIN Solutions lead import — REOPENED
**Background:** Import script reported 44 contacts created with 0 failures. However, the VIN API returned href=null for every contact, and lead creation failed on all with schema validation errors. Durran confirms zero new leads visible in any store in VIN Solutions. The import did not work — "success" was reported based on HTTP status codes without verifying the data actually appeared in VIN Solutions.
**Outcome:** Leads from VAPI call logs actually appear in VIN Solutions in the correct dealer under Durran Cage's account. Verified by querying VIN Solutions API and confirming the contacts exist.
**Acceptance Criteria:** For each imported contact: query VIN Solutions search API → contact found with correct name and phone → associated with correct dealer ID.

#### [BE] I-090: Calculated insights not computing properly
**Background:** User-reported + investigation confirmed. Two root causes: (1) `transformVinLead` in sync.ts mapped wrong field names (`createdDate` vs actual `createdUtc`), causing all 6,140 leads to have NULL `vin_created_at`. sync.ts date mapping corrected but change is uncommitted and not deployed in current build. (2) `warehouse_metrics` table was empty — metrics refresh never ran post-migration.
**Outcome:** All insight calculations produce correct values based on warehouse_leads data with proper dates.
**Acceptance Criteria:** Insights page shows non-zero calculated values for stores with 1000+ leads. Values verified against direct DB queries. `vin_created_at` non-null for all synced leads.

#### [BE] I-091: SMS human takeover broken — aiPaused doesn't persist
**Background:** Ghost audit. Test FLOW-2 passes but the feature doesn't work. `assignedTo` is set via API but `aiPaused` computed field doesn't correctly prevent AI from responding. A customer could get an AI response after a human took over.
**Outcome:** When a conversation has assignedTo set, AI agent skips that conversation entirely.
**Acceptance Criteria:** Set assignedTo on conversation → send inbound SMS → AI does NOT auto-respond → human reply works.

#### [BE] I-092: Campaign execution always uses dryRun=true
**Background:** Ghost audit. No test verifies actual SMS delivery.
**Outcome:** Campaign execution can run with dryRun=false. Real SMS sent and verified.
**Acceptance Criteria:** Execute campaign with dryRun=false → SMS sent via callMCP → TextMagic confirms delivery → outbound_log records it.

#### [BE] I-093: No real VAPI round-trip test
**Background:** Ghost audit. No test makes an actual call and verifies the transcript arrives in TeamBox. Elliott test script exists at /home/ubuntu/Live-Store/nexxus/tests/scripts/elliott-test-v2.ts for this purpose.
**Outcome:** Elliott calls a dealer agent → webhook fires → conversation created in TeamBox → transcript present → email notification sent → VIN lead created.
**Acceptance Criteria:** Real VAPI call made → end-of-call webhook received at live.huminic.app → conversation in TeamBox with transcript → verified in DB.

#### [BE] I-094: No Tavus transcript verification test
**Background:** Ghost audit. Tests check video-session endpoint but don't verify transcript callback.
**Outcome:** Tavus session created → widget shows name prompt → transcript arrives in TeamBox.
**Acceptance Criteria:** Tavus session created → conversation.ended webhook fires → conversation in TeamBox → summary present.

#### [BE] I-096: Email notification recipients don't walk org hierarchy
**Background:** When a call comes to Ford of Columbia, sendLeadNotificationEmail queries getUsers(fordOrgId) which only returns users ON Ford's org. It does not walk UP via partner_id to find Durran (partner_admin on Cage Automotive, Ford's parent). The old app used a partner_admin_organizations junction table. Our code only adds super_admins from other orgs, not partner_admins.
**Outcome:** Email recipient logic walks the org hierarchy: store → parent group → find partner_admins. Also includes users with the store in their additional_org_ids.
**Acceptance Criteria:** Ford of Columbia call → recipients include durran@cageautomotive.com (via Cage parent) + duane.wells@huminic.ai (super_admin).

### Frontend (FE)

#### [FE] I-089: Get Contact modal not working in dashboard lead drill-down
**Background:** User-reported. Clicking a lead in the dashboard metrics opens a modal, but the contact details fail to load. VIN API returns contact as URL href, sync doesn't resolve it, contact endpoint exceeds MCP limit.
**Outcome:** Contact modal loads and displays lead details when clicked.
**Acceptance Criteria:** Click lead in dashboard → modal opens → contact info displayed → no console errors.

### Data (DT)

#### [DT] I-095: Appointment source field defaults to "manual" instead of preserving input
**Background:** Overnight test DC-US013-1. API does not preserve the source field value.
**Outcome:** Appointments store and return the source field as passed.
**Acceptance Criteria:** POST appointment with source="widget" → GET appointment → source="widget".

### Infrastructure (IN)

#### [IN] I-099: VAPI assistant serverUrl points to old app (nexxusv2.huminicdev.com)
**Background:** 5 real inbound VAPI calls on March 19 never reached our webhook because the VAPI assistants' serverUrl still points to the old app URL. The old app is off, so webhooks are lost. Need to update to https://live.huminic.app/api/webhooks/vapi.
**Outcome:** All 5 dealer VAPI assistants have serverUrl = https://live.huminic.app/api/webhooks/vapi.
**Acceptance Criteria:** VAPI API query confirms all assistants point to live.huminic.app. Real inbound call triggers webhook → conversation appears in TeamBox.

#### [IN] I-100: Tavus webhook URL points to old app
**Background:** Same issue as I-099 but for Tavus. Old URL: https://nexxusv2.huminicdev.com/api/webhooks/tavus.
**Outcome:** Tavus webhook URL updated to https://live.huminic.app/api/webhooks/tavus.
**Acceptance Criteria:** Tavus conversation.ended webhook arrives at live.huminic.app.

#### [IN] I-101: All org outbound currently disabled (emergency shutdown)
**Background:** Emergency CommGate shutdown on 2026-03-20 after test webhook payloads sent real emails to org admins. All 7 orgs set to outbound_enabled=false, sms_enabled=false, phone_enabled=false, email_enabled=false. Must be re-enabled per org when email notification code is verified safe (CommGate check, hierarchy walk, test payload filtering).
**Outcome:** Orgs re-enabled one at a time after verification.
**Acceptance Criteria:** Each org re-enabled only after: (1) CommGate check is in the email code, (2) recipient hierarchy is correct, (3) test payload guard is in place.

#### [IN] I-102: webhooks.ts deployed with uncommitted code change
**Background:** CommGate check added to sendLeadNotificationEmail and deployed via npm run build + pm2 restart without going through the sprint commit process. Governance violation.
**Outcome:** Change committed through the harness in the next sprint.
**Acceptance Criteria:** git status shows webhooks.ts committed. Pre-commit hook passes.

---

## Test Coverage Gaps (from Ghost Audit 2026-03-20)

| ID | User Story | Gap | Domain | Priority |
|----|-----------|-----|--------|----------|
| TG-001 | US-005: Walk-in auto-followup | No test exists | BE | HIGH |
| TG-002 | US-007: Pipeline review | No test exists | DT | HIGH |
| TG-003 | US-010: Recall notification | No test exists | BE | MEDIUM |
| TG-004 | US-012: Opt-out/STOP handling | No test exists | BE | HIGH |
| TG-005 | US-013: Widget scheduling | No test exists | FE | MEDIUM |
| TG-006 | US-022: Multi-store oversight | No test exists | AU | HIGH |
| TG-007 | US-023: Metric accuracy | No test exists (covered by I-090) | DT | HIGH |
| TG-008 | After-hours behavior | No time-based test | BE | MEDIUM |
| TG-009 | Multi-tenant data isolation | No cross-org leak test | AU | HIGH |
| TG-010 | TeamBox real-time updates | No SSE/WebSocket test | BE | MEDIUM |

---

## Test Infrastructure

| ID | Issue | Status |
|----|-------|--------|
| TI-010 | Accessibility (aria-labels, color contrast) | OPEN |
| TI-015 | live-comms.spec.ts callMCP response parsing broken — 7 tests fail on MCP SSE format | OPEN |
| TI-016 | RI-TAVUS-2 test queries single org but expects all 5 dealer personas | OPEN |
| TI-017 | sync.ts date fix not in compiled build — needs rebuild | OPEN |

---

## Governance Incidents

| Date | Sprint | What Happened |
|------|--------|---------------|
| 2026-03-19 | REM-8-DT | Builder agent rewrote central-mcp VIN connector without authorization. No git repo, no backup. |
| 2026-03-20 | REM-8-BE | Builder agent wrote production email notification code during a testing sprint. Test webhooks sent real emails to org admins. |
| 2026-03-20 | REM-9 | Orchestrator edited server/sync.ts directly instead of delegating to builder agent. |
| 2026-03-20 | — | CommGate check deployed to production without commit, sprint, or harness approval. Emergency action to stop emails. |

---

**Last updated:** 2026-03-20 (full audit — reopened I-086/I-087, added I-096 through I-102, governance incidents)
**CLOSED:** 24 items (removed I-086, I-087 from closed)
**REOPENED:** 2 items (I-086 VIN import, I-087 email notifications)
**OPEN:** 14 items (2 AU, 7 BE, 1 FE, 1 DT, 4 IN)
**TEST GAPS:** 10 items
**TI OPEN:** 4 items
**GOVERNANCE INCIDENTS:** 4
