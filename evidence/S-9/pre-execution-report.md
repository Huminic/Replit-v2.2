# S-9 Pre-Execution Report — Cross-Cutting

## Objective

Verify cross-cutting concerns that span all pages: VAPI assistant audit, weekend call replay, multi-tenant data isolation, walk-in followup trigger, accessibility audit, and test infrastructure fixes. No UI changes — testing and backend only.

## Declared Files

**Modified (existing):**
- tests/e2e/live-comms.spec.ts — Fix MCP SSE response parsing (S-9.6 / TI-015)
- tests/e2e/real-integrations.spec.ts — Fix RI-TAVUS-2 org scoping (S-9.7 / TI-016)

**New:**
- tests/e2e/s9-cross-cutting.spec.ts — VAPI audit verification, multi-tenant isolation, walk-in trigger, accessibility (axe-core)

**Referenced (read-only):**
- tests/e2e/deep-coverage.spec.ts — Existing DC-LEAK-1, DC-US005 tests
- tests/e2e/helpers/auth.ts — Test user credentials and login helper

## UI Changes

NONE — uiPermissions is "NONE — testing and backend fixes only"

## Acceptance Criteria

| ID | Criterion | Component |
|----|-----------|-----------|
| S-9.AC1 | All VAPI assistants have matching DB agent records | S-9.1 |
| S-9.AC2 | No "Could not resolve organization from assistantId" in logs after fix | S-9.1 |
| S-9.AC3 | 9 weekend calls replayed — emails sent to correct recipients | S-9.2 |
| S-9.AC4 | 9 weekend calls replayed — VIN leads created | S-9.2 |
| S-9.AC5 | No cross-org data visible: Serra Honda admin sees ONLY Serra Honda data | S-9.3 |
| S-9.AC6 | No cross-org data visible: repeated for each of 5 orgs | S-9.3 |
| S-9.AC7 | Walk-in followup trigger fires | S-9.4 |
| S-9.AC8 | Accessibility: axe-core scan on all major pages produces report | S-9.5 |
| S-9.AC9 | live-comms.spec.ts: all 14 tests pass | S-9.6 |
| S-9.AC10 | RI-TAVUS-2 passes | S-9.7 |

## Test Plan

### Test File 1: tests/e2e/s9-cross-cutting.spec.ts (NEW)

**S-9.1 — VAPI Assistant Audit:**
- Test: Call VAPI API to list all assistants, query agents table for vapiAssistantId, compare sets
- Assert: Every VAPI assistant has a matching DB record (no orphans)
- Evidence: Audit report table (assistantId, name, DB match Y/N)

**S-9.1 — Log Verification:**
- Test: Grep pm2 logs for "Could not resolve organization from assistantId"
- Assert: Zero matches
- Evidence: Log proof (grep output)

**S-9.2 — Weekend Call Replay (IRREVERSIBLE — owner approval required):**
- VERIFY FIRST: Check outbound_log for existing replay entries
- If already replayed → mark PRE-COMPLETED, skip execution
- If not replayed → present replay plan to owner, wait for explicit approval
- Test: Check outbound_log for 9 entries with correct to_email
- Test: Verify VIN contact + lead per call via vin-safe-mcp
- Evidence: Query proof

**S-9.3 — Multi-Tenant Isolation (5 test cycles):**
- For each org (Serra Honda, Serra Nissan, Tony Serra Ford, Hyundai of Columbia, Ford of Columbia):
  - Login as org admin
  - Navigate all major pages (conversations, agents, metrics, leads)
  - Grep page text for exclusion strings per SPEC-4:
    - serra-honda excludes: "Serra Nissan", "Tony Serra Ford", "Hyundai of Columbia", "Ford of Columbia"
    - serra-nissan excludes: "Serra Honda", "Tony Serra Ford", "Hyundai of Columbia", "Ford of Columbia"
    - tony-serra-ford excludes: "Serra Honda", "Serra Nissan", "Hyundai of Columbia", "Ford of Columbia"
    - hyundai-of-columbia excludes: "Serra Honda", "Serra Nissan", "Tony Serra Ford", "Ford of Columbia"
    - ford-of-columbia excludes: "Serra Honda", "Serra Nissan", "Tony Serra Ford", "Hyundai of Columbia"
  - Assert: Zero matches for any exclusion string
- Evidence: Screenshot set + text search results

**S-9.4 — Walk-In Auto-Followup Trigger:**
- Test: Create scheduled action for VIN sync followup via API
- Assert: Trigger engine processes it
- Assert: Followup action executes (or is queued)
- Evidence: API proof

**S-9.5 — Accessibility (axe-core):**
- Test: Run @axe-core/playwright on all major pages (login, sales, service, marketing, manage, system, landing)
- Document: violations by severity (critical, serious, moderate, minor)
- Evidence: axe-core report

### Test File 2: tests/e2e/live-comms.spec.ts (FIX — S-9.6 / TI-015)

**Problem:** callMCP() only parses SSE `data:` lines. MCP server may return plain JSON (not SSE-wrapped). 7 of 14 tests fail when response is JSON without SSE framing.

**Fix:** Update callMCP() to handle both formats:
1. Try parsing response as plain JSON first
2. If that fails or has no result, fall back to SSE `data:` line parsing
3. Handle edge cases (empty response, error responses)

**Commands:**
```
npx playwright test tests/e2e/live-comms.spec.ts --reporter=list
```
- Assert: 14/14 tests pass
- Evidence: Terminal output

### Test File 3: tests/e2e/real-integrations.spec.ts (FIX — S-9.7 / TI-016)

**Problem:** RI-TAVUS-2 logs in as single org admin but expects to see Tavus personas for all 5 dealers. A single org admin only sees their own org's agents.

**Fix:** Either:
- Option A: Login as super_admin to see all orgs' agents, then verify 5+ Tavus personas across all orgs
- Option B: Loop through all 5 org admin logins, verify each has at least 1 Tavus persona

**Commands:**
```
npx playwright test tests/e2e/real-integrations.spec.ts --grep "RI-TAVUS-2" --reporter=list
```
- Assert: RI-TAVUS-2 passes
- Evidence: Terminal output

### Cross-Tests

**Existing test files to verify no regressions:**
```
npx playwright test tests/e2e/deep-coverage.spec.ts --grep "DC-LEAK-1" --reporter=list
npx playwright test tests/e2e/real-integrations.spec.ts --grep "RI-VAPI-3|RI-ORG-2" --reporter=list
```

### Full Sprint Test Run
```
npx playwright test tests/e2e/s9-cross-cutting.spec.ts --reporter=list
npx playwright test tests/e2e/live-comms.spec.ts --reporter=list
npx playwright test tests/e2e/real-integrations.spec.ts --grep "RI-TAVUS-2" --reporter=list
npx playwright test tests/e2e/deep-coverage.spec.ts --grep "DC-LEAK|DC-US005" --reporter=list
```

### Notes

- S-9.2 (weekend call replay) is IRREVERSIBLE. Will verify outbound_log first — if already replayed, mark PRE-COMPLETED. Will NOT execute without explicit owner approval.
- S-9.3 uses SPEC-4 exclusion strings from plan.md line 1352-1362.
- No UI modifications — uiPermissions = NONE.
- Issues I-103 and I-104 are referenced in plan.md but not yet in issues.md (PRE-6 gap). Will not block execution since sprints.json is source of truth.

## Ghost Entry Gate
**Reviewed by:** ghost-agent
**Timestamp:** 2026-03-24T09:38:44Z
**Sprint:** S-9
**A1 Previous cleared:** PASS (S-8 EXIT GATE: CLEARED)
**A2 Worktree:** clean
**A3 Session state:** PASS (fresh session, S-9 context)
**A4 Pre-exec exists:** PASS
**A5 Objective:** PASS
**A6 Test Plan:** PASS (8 npx commands covering live-comms, real-integrations, deep-coverage, s9-cross-cutting)
**A7 Declared Files:** PASS (2 existing test files to fix + 1 new test file)
**A8 Match check:** MATCH (2 files, 7 components, 10 ACs, uiPermissions=NONE)
**A9 UI permissions:** PASS (NONE)
**A10 Ghost messages:** PASS (clear)
**ENTRY GATE: APPROVED**
