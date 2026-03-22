# Nexxus Connect v2.2 — Open Issues

## Statuses
- **REMEDIATING** — Identified, queued for fix
- **VERIFIED** — Smoke test passed
- **CLOSED** — E2E confirmed

## Domains
- **FE**: Frontend | **BE**: Backend | **DT**: Data | **AU**: Auth/Security | **IN**: Infrastructure

---

## CLOSED (smoke tested + E2E confirmed)

I-061 through I-085, I-088

---

## REMEDIATING — By Domain

### Auth/Security (AU)

#### [AU] I-097: Durran's organization_id is Serra Honda instead of Cage Automotive
**Status:** REMEDIATING
**Sprint:** REM-8-AU
**Background:** Durran is partner_admin for Cage Automotive (parent group of all 5 dealerships). After REM-8 org-switch tests moved him to Serra Honda, he was never reset. His organization_id in the database still points to Serra Honda.
**Note:** REM-8-AU fixed the org-switch code path but did not verify or correct Durran's actual DB record afterward. The test that moved him did not include a teardown/reset step.
**Acceptance Criteria:** DB query confirms durran@cageautomotive.com organization_id = Cage Automotive UUID.

#### [AU] I-098: Victoria has no additional_org_ids — cannot see Serra Nissan or Tony Serra Ford
**Status:** REMEDIATING
**Sprint:** REM-8 (discovered during audit)
**Background:** Victoria is org_admin on Serra Honda and should also have visibility into Serra Nissan and Tony Serra Ford (all three are Sylacauga stores). Her additional_org_ids column is null, so she has no access to those stores and receives no notifications for them.
**Acceptance Criteria:** Victoria can switch to Serra Nissan and Tony Serra Ford. Receives notifications for those stores.

### Backend (BE)

#### [BE] I-087: Webhook email notifications bypass CommGate and use wrong template — test payloads sent real emails to org admins
**Status:** REMEDIATING
**Sprint:** REM-8-BE (reopened)
**Background:** REM-8-BE builder agent implemented email notifications for VAPI/Tavus webhooks. Multiple failures: (1) Template was written from scratch instead of copying the working one from /home/ubuntu/Live-Store/nexxus. (2) Recipient logic does not walk the org hierarchy via partner_id — Durran (partner_admin on Cage Automotive) does not receive emails for child store calls. (3) No CommGate check was in place — test webhook payloads with fake phone numbers sent real emails to real org admins (Durran received a fake lead notification). (4) Emergency CommGate check was hotfixed and deployed without a sprint commit (see I-102).
**Note:** CommGate guard has since been added as a hotfix, but the template and recipient logic are still broken. The old app's working code is at /home/ubuntu/Live-Store/nexxus/server/services/notifications/notificationEmailService.ts. This issue subsumes I-096 (recipient hierarchy).
**Acceptance Criteria:**
- Template matches /home/ubuntu/Live-Store/nexxus/server/services/notifications/notificationEmailService.ts
- Hyundai call -> email to sam, durran, duane (not admin@)
- Ford call -> email to durran, duane
- Serra Honda call -> email to victoria, durran, duane
- Serra Nissan call -> email to victoria, durran, duane
- Tony Serra Ford call -> email to victoria, durran, duane
- CommGate off -> no emails sent
- Test payloads with fake phone numbers -> no emails sent

#### [BE] I-086: VIN Solutions lead import returned success but zero contacts exist in VIN Solutions
**Status:** REMEDIATING
**Sprint:** REM-8-DT (reopened)
**Background:** Import script processed 44 VAPI call log contacts and reported all 44 created with 0 failures. However, the VIN API returned href=null for every contact, and lead creation failed on all with schema validation errors. Durran confirmed zero new leads are visible in any of the 5 stores in VIN Solutions. The script declared success based on HTTP 200 status codes without verifying that contacts actually appeared in VIN Solutions.
**Note:** The import script received ContactId values from VIN API responses but never verified the contacts existed via a follow-up search. The href=null responses and schema validation errors were logged but not treated as failures.
**Acceptance Criteria:** For each imported contact: query VIN Solutions search API -> contact found with correct name and phone -> associated with correct dealer ID.

#### [BE] I-090: Calculated insights show zero/null values — sync date mapping broken and warehouse_metrics empty
**Status:** REMEDIATING
**Sprint:** REM-9-BE
**Background:** Insights page shows all zeros or null values for stores with 1000+ leads. Two root causes: (1) `transformVinLead` in sync.ts mapped `createdDate` but the VIN API returns `createdUtc` — all 6,140 synced leads have NULL `vin_created_at`. (2) `warehouse_metrics` table is empty because the metrics refresh job never ran after the DB-1 Supabase migration.
**Note:** sync.ts date field was corrected in REM-9-BE but the fix was never rebuilt (`npm run build`) or deployed to the running app. The compiled JS still has the old mapping. warehouse_metrics refresh was never triggered.
**Acceptance Criteria:** Insights page shows non-zero calculated values for stores with 1000+ leads. Values verified against direct DB queries. `vin_created_at` non-null for all synced leads.

#### [BE] I-091: SMS human takeover broken — AI responds to conversations after human assignment
**Status:** REMEDIATING
**Sprint:** Ghost audit (pre-REM-9)
**Background:** When a human agent takes over an SMS conversation by setting `assignedTo`, the `aiPaused` computed field does not correctly prevent the AI from responding. A customer could receive an AI auto-response after a human has already taken over the conversation. Test FLOW-2 passes but tests the wrong thing — it verifies the API call succeeds, not that AI actually stops responding.
**Acceptance Criteria:** Set assignedTo on conversation -> send inbound SMS -> AI does NOT auto-respond -> human reply works.

#### [BE] I-092: Campaign execution hardcoded to dryRun=true — no real SMS ever sent
**Status:** REMEDIATING
**Sprint:** Ghost audit (pre-REM-9)
**Background:** Campaign execution always uses dryRun=true. No test or code path exercises actual SMS delivery through callMCP to TextMagic. Campaigns appear to succeed but no messages are delivered.
**Acceptance Criteria:** Execute campaign with dryRun=false -> SMS sent via callMCP -> TextMagic confirms delivery -> outbound_log records it.

#### [BE] I-093: No end-to-end VAPI call test — no verification that a real call produces a TeamBox conversation
**Status:** REMEDIATING
**Sprint:** Ghost audit (pre-REM-9)
**Background:** No test makes an actual VAPI call and verifies the full chain: call placed -> webhook fires -> conversation created in TeamBox -> transcript present -> email notification sent -> VIN lead created. The Elliott test script exists at /home/ubuntu/Live-Store/nexxus/tests/scripts/elliott-test-v2.ts but has never been run against the new app.
**Acceptance Criteria:** Real VAPI call made -> end-of-call webhook received at live.huminic.app -> conversation in TeamBox with transcript -> verified in DB.

#### [BE] I-094: No Tavus transcript verification — widget session creates but transcript never arrives
**Status:** REMEDIATING
**Sprint:** Ghost audit (pre-REM-9)
**Background:** Tests check the video-session endpoint returns a Tavus session URL but do not verify that the conversation.ended webhook fires or that a transcript appears in TeamBox. There is no evidence the Tavus -> TeamBox pipeline works end-to-end.
**Acceptance Criteria:** Tavus session created -> conversation.ended webhook fires -> conversation in TeamBox -> summary present.

#### [BE] I-096: Email notification recipients don't walk org hierarchy — partner_admin missed for child store calls
**Status:** REMEDIATING
**Sprint:** Ghost audit (discovered during REM-8 analysis)
**Background:** When a call comes to Ford of Columbia, `sendLeadNotificationEmail` calls `getUsers(fordOrgId)` which only returns users directly on Ford's org. It does not walk up via `partner_id` to find Durran (partner_admin on Cage Automotive, Ford's parent group). The old app used a `partner_admin_organizations` junction table. Current code only adds super_admins from other orgs, not partner_admins.
**Note:** This is the same root cause as the recipient portion of I-087. Tracked separately because it was filed independently during the ghost audit. Fix should be coordinated with I-087.
**Acceptance Criteria:** Ford of Columbia call -> recipients include durran@cageautomotive.com (via Cage parent) + duane.wells@huminic.ai (super_admin).

### Frontend (FE)

#### [FE] I-089: Get Contact modal fails to load in dashboard lead drill-down — contact details blank
**Status:** REMEDIATING
**Sprint:** REM-9-FE
**Background:** Clicking a lead in the dashboard metrics opens a modal, but the contact details fail to load. The VIN API returns the contact as a URL href which sync never resolves, and the contact endpoint exceeds the MCP response size limit. The modal opens but shows no data.
**Note:** REM-9-FE was parked before this was verified fixed. The contact resolution path (href -> actual contact data) was never implemented.
**Acceptance Criteria:** Click lead in dashboard -> modal opens -> contact info displayed -> no console errors.

### Data (DT)

#### [DT] I-095: Appointment source field defaults to "manual" instead of preserving the value passed by API caller
**Status:** REMEDIATING
**Sprint:** REM-9 (overnight test DC-US013-1)
**Background:** When creating an appointment via POST with source="widget", the returned appointment has source="manual". The API does not preserve the source field value from the request body — it either ignores it or overwrites it with a default.
**Acceptance Criteria:** POST appointment with source="widget" -> GET appointment -> source="widget".

### Infrastructure (IN)

#### [IN] I-099: VAPI assistant serverUrl points to old app — 5 real inbound calls lost on March 19
**Status:** REMEDIATING
**Sprint:** REM-8 (discovered during webhook debugging)
**Background:** All 5 dealer VAPI assistants still have serverUrl pointing to https://nexxusv2.huminicdev.com/api/webhooks/vapi (old app, currently offline). Five real inbound VAPI calls on March 19 never reached our webhook. The calls were answered by the AI assistant but the end-of-call webhook was sent to a dead URL, so no conversations were created in TeamBox.
**Acceptance Criteria:** VAPI API query confirms all assistants point to live.huminic.app. Real inbound call triggers webhook -> conversation appears in TeamBox.

#### [IN] I-100: Tavus webhook URL points to old app — transcript callbacks lost
**Status:** REMEDIATING
**Sprint:** REM-8 (discovered during webhook debugging)
**Background:** Tavus conversation.ended webhook URL is set to https://nexxusv2.huminicdev.com/api/webhooks/tavus (old app, offline). Any Tavus widget sessions complete but their transcripts are sent to a dead URL and never appear in TeamBox.
**Acceptance Criteria:** Tavus conversation.ended webhook arrives at live.huminic.app.

#### [IN] I-101: All org outbound disabled (emergency shutdown) — no emails, SMS, or calls can be sent
**Status:** REMEDIATING
**Sprint:** REM-8-BE (emergency response)
**Background:** After test webhook payloads sent real emails to org admins (I-087), all 7 orgs were emergency-shutdown: outbound_enabled=false, sms_enabled=false, phone_enabled=false, email_enabled=false. No outbound communications of any kind can be sent from the application until orgs are selectively re-enabled.
**Note:** Re-enabling requires I-087 to be fixed first (CommGate check verified, recipient hierarchy correct, test payload guard in place). Each org should be re-enabled individually after verification.
**Acceptance Criteria:** Each org re-enabled only after: (1) CommGate check is in the email code, (2) recipient hierarchy is correct, (3) test payload guard is in place.

#### [IN] I-102: webhooks.ts deployed with uncommitted code change — governance violation
**Status:** REMEDIATING
**Sprint:** REM-8-BE (emergency response)
**Background:** The CommGate check was added to sendLeadNotificationEmail in webhooks.ts and deployed via `npm run build` + `pm2 restart` without going through the sprint commit process. The running production code does not match what is committed in git.
**Note:** This was an emergency fix to stop real emails from being sent. The change is functional but needs to be committed through the harness in the next sprint to restore governance integrity.
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

**Last updated:** 2026-03-20 (reformatted — all issues set to REMEDIATING, descriptions rewritten as bug reports, sprint origins noted)
**CLOSED:** 24 items
**REMEDIATING:** 16 items (2 AU, 8 BE, 1 FE, 1 DT, 4 IN)
**TEST GAPS:** 10 items
**TI OPEN:** 4 items
**GOVERNANCE INCIDENTS:** 4
