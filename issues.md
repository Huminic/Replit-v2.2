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

## REMEDIATING — Genuinely Open (0 items)

None. All 3 previously open issues closed by S-0 (commit de65c33).

### Closed in S-0 (2026-03-24)

#### [BE] I-086: VIN Solutions lead import returned success but zero contacts exist
**Status:** CLOSED
**Fixed in:** S-0.4 (commit de65c33)
**Resolution:** webhooks.ts VIN insert rewritten to use vin-safe-mcp REST API on port 4003 instead of callMCP on port 4002. Both VAPI and Tavus blocks updated. leadSourceName resolved at runtime via vin_get_lead_sources. Ghost verified: 2 port-4003 refs, 0 callMCP("vin_create_contact") refs.

#### [BE] I-090: Warehouse metrics never refreshed for 4 of 5 dealers
**Status:** CLOSED
**Fixed in:** S-0.5 (commit de65c33)
**Resolution:** Warehouse metrics refreshed for all 5 dealers via POST /api/sync/backfill and POST /api/sync/metrics. Ghost verified: warehouse_metrics has rows for all 5 orgs (Ford of Columbia: 12, Hyundai of Columbia: 12, Serra Honda: 48, Serra Nissan: 12, Tony Serra Ford: 12).

#### [IN] I-101: 4 of 5 orgs still have CommGate disabled
**Status:** CLOSED
**Fixed in:** S-0.1 (commit de65c33)
**Resolution:** All 5 CommGate flags (outbound_enabled, sms_enabled, phone_enabled, email_enabled, video_enabled) set to true for all 5 orgs. Ghost verified: all 25 flags = true.

---

## Test Coverage Gaps (from Ghost Audit 2026-03-20)

| ID | User Story | Gap | Domain | Priority |
|----|-----------|-----|--------|----------|
| TG-001 | US-005: Walk-in auto-followup | Covered by S-9.4 (s9-cross-cutting S9-TRIGGER-1) + DC-US005-1/2 | BE | CLOSED |
| TG-002 | US-007: Pipeline review | Covered by DC-US007-1/2/3 (deep-coverage) | DT | CLOSED |
| TG-003 | US-010: Recall notification | Covered by DC-US010-1/2 (deep-coverage) | BE | CLOSED |
| TG-004 | US-012: Opt-out/STOP handling | No test exists | BE | HIGH |
| TG-005 | US-013: Widget scheduling | Covered by DC-US013-1 + S-8 widget tests | FE | CLOSED |
| TG-006 | US-022: Multi-store oversight | Covered by RI-ORG-2 (real-integrations) | AU | CLOSED |
| TG-007 | US-023: Metric accuracy | Covered by Phase 11 traceability audit (87/87 MATCH) | DT | CLOSED |
| TG-008 | After-hours behavior | No time-based test | BE | MEDIUM |
| TG-009 | Multi-tenant data isolation | Covered by S-9.3 (5 orgs x 5 pages, zero leaks) + DC-LEAK-1 | AU | CLOSED |
| TG-010 | TeamBox real-time updates | No SSE/WebSocket test | BE | MEDIUM |

---

## Test Infrastructure

| ID | Issue | Status |
|----|-------|--------|
| TI-010 | Accessibility (aria-labels, color contrast) | CLOSED — S-9.5 axe-core audit on 6 pages, report in evidence/S-9 |
| TI-015 | live-comms.spec.ts callMCP response parsing broken — 7 tests fail on MCP SSE format | CLOSED — S-9.6 fixed callMCP() for JSON+SSE, 14/14 pass |
| TI-016 | RI-TAVUS-2 test queries single org but expects all 5 dealer personas | CLOSED — S-9.7 loops all 5 org logins, 5/5 pass |
| TI-017 | sync.ts date fix not in compiled build — needs rebuild | CLOSED — S-10 build verified (EF-02 pass) |

---

## Governance Incidents

| Date | Sprint | What Happened |
|------|--------|---------------|
| 2026-03-19 | REM-8-DT | Builder agent rewrote central-mcp VIN connector without authorization. No git repo, no backup. |
| 2026-03-20 | REM-8-BE | Builder agent wrote production email notification code during a testing sprint. Test webhooks sent real emails to org admins. |
| 2026-03-20 | REM-9 | Orchestrator edited server/sync.ts directly instead of delegating to builder agent. |
| 2026-03-20 | — | CommGate check deployed to production without commit, sprint, or harness approval. Emergency action to stop emails. |

---

**Last updated:** 2026-03-24 (S-9 closed TI-010/015/016, TG-001/002/003/005/006/009. S-10 closed TI-017.)
**CLOSED:** 40 items (37 prior + 3 closed by S-0)
**REMEDIATING:** 0 items
**TEST GAPS:** 3 open (TG-004 opt-out, TG-008 after-hours, TG-010 SSE) — 6 closed
**TI OPEN:** 0 items (all 4 closed by S-9/S-10)
**GOVERNANCE INCIDENTS:** 4
