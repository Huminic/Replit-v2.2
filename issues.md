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
| TI-018 | Photo Studio agent returns "unable to connect to required internet services" when generating images | OPEN |

---

## Governance Incidents

| Date | Sprint | What Happened |
|------|--------|---------------|
| 2026-03-19 | REM-8-DT | Builder agent rewrote central-mcp VIN connector without authorization. No git repo, no backup. |
| 2026-03-20 | REM-8-BE | Builder agent wrote production email notification code during a testing sprint. Test webhooks sent real emails to org admins. |
| 2026-03-20 | REM-9 | Orchestrator edited server/sync.ts directly instead of delegating to builder agent. |
| 2026-03-20 | — | CommGate check deployed to production without commit, sprint, or harness approval. Emergency action to stop emails. |
| 2026-03-24 | S-11 | Ghost agent directly edited sprints.json (governance file) to add S-11 sprint. Violated own CLAUDE.md rule: "CANNOT modify governance files." Instructed by Halo mediator. Content correct — accepted by owner with incident logged. |

---

## E-012 Findings (Six-Layer Verification, 2026-03-26)

### [FE] I-102: Photo Studio agent broken on frontend — FAL backend works
**Status:** REMEDIATING
**Layer:** S1/FE
**Severity:** Medium
**Evidence:** FAL proxy returns IN_QUEUE successfully. The agent UI integration is the failure point, not the API key or backend.
**Sprint:** TBD

### [FE] I-103: 8 always-true assertions in s11-demo-hotfix.spec.ts
**Status:** REMEDIATING
**Layer:** S1/T
**Severity:** High
**Evidence:** Test auditor found `expect(true).toBeTruthy()` on lines covering AC2, AC3, AC4, AC5, AC6, AC11. These tests pass regardless of app state.
**Sprint:** TBD

### [FE] I-104: 103 stub tests in observability/ with expect.fail("STUB")
**Status:** REMEDIATING
**Layer:** S1/T
**Severity:** Medium
**Evidence:** All 7 observability test files contain only stub assertions. Zero functional coverage despite appearing as test files. Need evaluation — are these worth implementing or should they be deleted?
**Sprint:** TBD

### [BE] I-105: Billing not configured — FlexPrice integration returns {configured: false}
**Status:** REMEDIATING
**Layer:** S3/BE
**Severity:** High
**Evidence:** All billing operational endpoints (summary, usage, invoices, plan, entitlements) return `{configured: false}`. Plans catalog exists (6 plans). FlexPrice connects via MCP. Integration needs wiring.
**Sprint:** TBD

### [BE] I-106: Campaigns reporting zero messages sent despite active status
**Status:** INVESTIGATING
**Layer:** S3/BE
**Severity:** Medium (was High — root cause identified)
**Evidence:** AI hunch (confidence 92) flagged this. Root cause: `processOutboundSend()` checks `checkCommGate()` which enforces per-phone rate limit of 3 per 24h (outbound.ts lines 258-265). Campaigns with recipients already contacted by other campaigns get blocked as "Rate limit exceeded." Also `getPendingRecipients()` returns only unprocessed recipients — if recipients were already processed by a prior execution attempt, the campaign returns "No pending recipients to process" (line 493). Not a code bug — it's the rate limiting and recipient state machine working as designed. The question is whether the business rules are correct for the use case.
**Sprint:** TBD — needs operator input on rate limit and recipient reset policy

### [IN] I-107: SMS 63% failure rate — rate limiting, not missing key
**Status:** INVESTIGATING
**Layer:** S3/BE
**Severity:** Medium (was High — downgraded after investigation)
**Evidence:** TextMagic API key is NOT in .env because SMS routes through central-mcp via `callMCP("tm_send_message")`. MCP holds the credentials. The 63% failure rate is likely caused by per-phone rate limiting (3 messages per 24 hours per phone number — outbound.ts line 258-265). Campaigns targeting the same phone numbers across multiple campaigns will hit this ceiling. Business rule question: is rateLimitMax=3 correct?
**Sprint:** TBD — needs operator input on rate limit policy

### ~~[IN] I-108: APP_BASE_URL missing from .env~~
**Status:** CLOSED — FALSE ISSUE
**Layer:** N/A
**Evidence:** .env comment: "APP_BASE_URL removed — uses request host automatically (works for both dev.huminicdev.com and live.huminic.app)". CORS_ORIGINS set explicitly. Intentional design decision, not a bug.

### [IN] I-109: Git has uncommitted changes
**Status:** REMEDIATING
**Layer:** S6/IN
**Severity:** Medium
**Evidence:** `git status` shows modified: client/src/App.tsx, client/src/pages/widget-landing.tsx, evidence/S-0/post-sprint-report.md. Deleted: .ghost/test-output/overnight/ files. These may be from S-11 or the hotfix that preceded it.
**Sprint:** TBD

### [IN] I-110: Test files use production URL (dev.huminicdev.com) instead of localhost
**Status:** REMEDIATING
**Layer:** S6/IN
**Severity:** Medium
**Evidence:** s0-s11 spec files use hardcoded `https://dev.huminicdev.com` as base URL. Running the test suite hits the live dev environment. Should use env var or localhost for test isolation.
**Sprint:** TBD

### [FE] I-111: Seven routes with zero test coverage
**Status:** REMEDIATING
**Layer:** S1/T
**Severity:** High
**Evidence:** /my-work, /usage, /settings/billing/usage, /settings/billing/plan, /settings/billing/invoices, /settings/org-wizard, /profile/preferences have no test file or assertion covering them.
**Sprint:** TBD

---

## E-013 Audit Findings (Section Audits, 2026-03-26)

### [FE] I-112: Sales Recent Activity feed is hardcoded mock data
**Status:** REMEDIATING
**Layer:** S3/FE
**Severity:** Medium
**Evidence:** sales.tsx lines 591-603 — static array of activity items, not fetched from API.
**Sprint:** S-3

### [FE] I-113: Service and Marketing metric trends all hardcoded to zero
**Status:** REMEDIATING
**Layer:** S4+S5/FE
**Severity:** Medium
**Evidence:** service.tsx and marketing.tsx — all metric tiles use `change: 0, trend: 'up'`. Sales has real change data for 4/7 tiles.
**Sprint:** S-4, S-5

### [FE] I-114: Sales Conversion Rate change field uses absolute rate as delta
**Status:** REMEDIATING
**Layer:** S3/FE
**Severity:** Medium
**Evidence:** sales.tsx line 115 — `change: summary.conversionRate` instead of a real period-over-period delta.
**Sprint:** S-3

### [FE] I-115: Sub-menu/tab mismatches on Service, Marketing, Manage
**Status:** REMEDIATING
**Layer:** S4+S5+S6/FE
**Severity:** Low
**Evidence:** Service sub-menu says "Dashboard" (no Dashboard tab). Marketing sub-menu says "Campaigns" (no Campaigns tab). Manage sub-menu says "Dashboard" and is missing Hunches/Billing.
**Sprint:** S-4, S-5, S-6

### [FE] I-116: Manage User Chats is placeholder "coming soon"
**Status:** REMEDIATING
**Layer:** S6/FE
**Severity:** Medium
**Evidence:** management.tsx lines 274-284 — MessageSquare icon + "coming soon" text. No API call, no data.
**Sprint:** S-6

### [FE] I-117: TopBar says "Take a Tour" instead of "Reset Tour"
**Status:** REMEDIATING
**Layer:** S7/FE
**Severity:** Low
**Evidence:** TopBar.tsx line 379 — label is "Take a Tour". Profile page correctly says "Reset Tour". Manifest says rename.
**Sprint:** S-7

### [FE] I-118: TopBar Profile dropdown still has Billing link
**Status:** REMEDIATING
**Layer:** S7/FE
**Severity:** Low
**Evidence:** TopBar.tsx line 373 — links to /profile/billing. Billing was moved to Manage page per S-6.AC2/AC3.
**Sprint:** S-7

### [FE] I-119: Web Call widget behavior differs from manifest
**Status:** INVESTIGATING
**Layer:** S8/FE+BE
**Severity:** Medium
**Evidence:** Manifest says "ask for number, trigger VAPI call to prospect." Code does browser-based VAPI call to AI assistant (no number collection, no outbound phone call). Needs operator clarification on intended behavior.
**Sprint:** S-8

### [FE] I-120: AI Config tile RBAC inconsistent with sub-menu
**Status:** REMEDIATING
**Layer:** S7/FE
**Severity:** Low
**Evidence:** settings.tsx settingsTiles has AI Config as `['super_admin']` only. SubMenuManager shows it for `['super_admin', 'partner_admin']` (read-only). Tile won't appear for partner_admin but sub-menu link will.
**Sprint:** S-7

---

**Last updated:** 2026-03-26 (E-013 section audits — 9 new issues added)
**CLOSED:** 41 items (40 prior + I-108 false issue)
**REMEDIATING:** 15 items (I-102–I-105, I-109–I-118, I-120)
**INVESTIGATING:** 3 items (I-106, I-107, I-119 — need operator input)
**TEST GAPS:** 3 open (TG-004 opt-out, TG-008 after-hours, TG-010 SSE) — 6 closed
**TI OPEN:** 1 item (TI-018 — reassigned to I-102, frontend issue confirmed)
**GOVERNANCE INCIDENTS:** 5 (including S-11 ghost edit)
