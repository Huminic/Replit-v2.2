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

### Closed in VERIFY-ALL Reconciliation (2026-03-23)

#### [AU] I-097: Durran's organization_id is Serra Honda instead of Cage Automotive
**Status:** CLOSED
**Fixed in:** I-1.3 (commit 357d0bd)
**Resolution:** Durran confirmed on Cage Automotive in database.

#### [AU] I-098: Victoria has no additional_org_ids — cannot see Serra Nissan or Tony Serra Ford
**Status:** CLOSED
**Fixed in:** I-1.4 (commit 0b5d2f7)
**Resolution:** Victoria has 2 additional org IDs set.

#### [BE] I-087: Webhook email notifications bypass CommGate and use wrong template
**Status:** CLOSED
**Fixed in:** I-3.2 (commit f06a2d5)
**Resolution:** Email template ported from old app, recipient logic walks partnerId hierarchy, CommGate check in place.

#### [BE] I-089: Get Contact modal fails to load in dashboard lead drill-down
**Status:** CLOSED
**Fixed in:** I-10.5 (commit bf7109d)
**Resolution:** Contact modal works with warehouse data fallback when VIN CRM lookup fails.

#### [BE] I-091: SMS human takeover broken — AI responds after human assignment
**Status:** CLOSED
**Fixed in:** I-5.3 (commit f1b5e54)
**Resolution:** Takeover mutation sends { assignedTo: currentUser.id }. Backend AI pause logic checks assignedTo.

#### [BE] I-092: Campaign execution hardcoded to dryRun=true
**Status:** CLOSED
**Fixed in:** Phase 6 verification (commit 4b0eef2)
**Resolution:** Not a bug. Frontend has separate Execute (dryRun:false) and Dry Run (dryRun:true) buttons. Backend reads from request body, defaults to false.

#### [BE] I-093: No end-to-end VAPI call test
**Status:** CLOSED
**Fixed in:** I-4.4 (commit 3419f89)
**Resolution:** Elliott → Caroline call verified. Webhook received, conversation in TeamBox, email notification sent. Owner confirmed receipt.

#### [BE] I-094: No Tavus transcript verification
**Status:** CLOSED
**Fixed in:** I-4.3 (commit cd82928)
**Resolution:** callback_url added to all Tavus conversation creation sites. Webhook endpoint functional.

#### [DT] I-095: Appointment source field defaults to "manual"
**Status:** CLOSED
**Fixed in:** I-4.4 (commit 3419f89)
**Resolution:** Source field passthrough from request body with "manual" as default.

#### [BE] I-096: Email notification recipients don't walk org hierarchy
**Status:** CLOSED
**Fixed in:** I-3.2 (commit f06a2d5) — subsumed by I-087
**Resolution:** Recipient logic walks partnerId to find partner_admin users for child store calls.

#### [IN] I-099: VAPI assistant serverUrl points to old app
**Status:** CLOSED
**Fixed in:** I-4.2 (owner updated VAPI dashboard)
**Resolution:** All assistants point to live.huminic.app. Owner updated both serverUrl and nested server.url fields.

#### [IN] I-100: Tavus webhook URL points to old app
**Status:** CLOSED
**Fixed in:** I-4.3 (commit cd82928)
**Resolution:** callback_url set per-conversation in all 3 callMCP("tavus_create_conversation") call sites.

#### [IN] I-102: webhooks.ts deployed with uncommitted code change
**Status:** CLOSED
**Fixed in:** I-4.4 (commit 3419f89)
**Resolution:** webhooks.ts committed through governance harness. Pre-commit hook passed.

---

## REMEDIATING — Genuinely Open (3 items)

#### [BE] I-086: VIN Solutions lead import returned success but zero contacts exist
**Status:** REMEDIATING
**Sprint:** REM-8-DT (reopened)
**Background:** Import script processed 44 VAPI call log contacts and reported all 44 created with 0 failures. However, the VIN API returned href=null for every contact, and lead creation failed on all with schema validation errors.
**Blocker:** vin-safe-mcp returns 422 on step 2 (lead creation). Contact created but lead not linked.
**Acceptance Criteria:** For each imported contact: query VIN Solutions search API -> contact found with correct name and phone -> associated with correct dealer ID.

#### [BE] I-090: Warehouse metrics never refreshed for 4 of 5 dealers
**Status:** REMEDIATING
**Sprint:** REM-9-BE
**Background:** sync.ts date field corrected (createdUtc mapping) and committed. However, warehouse_metrics table is still empty/stale for Serra Nissan, Tony Serra Ford, Ford of Columbia, and Hyundai of Columbia. The metrics refresh job has not been triggered for these dealers since the Supabase migration.
**Acceptance Criteria:** warehouse_metrics populated for all 5 dealers. Insights page shows non-zero values for all stores with leads.

#### [IN] I-101: 4 of 5 orgs still have CommGate disabled
**Status:** REMEDIATING
**Sprint:** REM-8-BE (emergency response)
**Background:** After the emergency shutdown, Serra Honda was re-enabled in I-3.6. The remaining 4 orgs (Serra Nissan, Tony Serra Ford, Ford of Columbia, Hyundai of Columbia) still have outbound_enabled=false. I-087 (email template/recipients) is now CLOSED, so the blocker for re-enabling is resolved.
**Acceptance Criteria:** All 5 orgs have outbound_enabled=true. Each org enabled individually with verification.

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
| TG-007 | US-023: Metric accuracy | Covered by Phase 11 traceability audit (87/87 MATCH) | DT | CLOSED |
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

**Last updated:** 2026-03-23 (VERIFY-ALL reconciliation — 13 issues closed, 3 genuinely open)
**CLOSED:** 37 items (24 prior + 13 reconciled)
**REMEDIATING:** 3 items (I-086, I-090, I-101)
**TEST GAPS:** 9 items (TG-007 closed by Phase 11 audit)
**TI OPEN:** 4 items
**GOVERNANCE INCIDENTS:** 4
