# PE-AI-CHAT-01 — Pre-Execution Report

**Sprint:** PE-AI-CHAT-01
**Section:** AI Chat / Main Dashboard
**Date:** 2026-04-06
**Type:** Production Evaluation (observation-only)

---

## Objective

Evaluate the AI Chat / Main Dashboard section of the live production application at live.huminic.app. Verify that chat behavior, metric tiles, drill-downs, store switching, and contact detail views function correctly and present truthful, plausible data. Identify and log all bugs found.

**This sprint is observation-only. No code changes. No irreversible actions. Evidence captured via Playwright MCP browser tools against live.huminic.app.**

---

## Declared Files

### Files Created (evidence only)
- `evidence/PE-AI-CHAT-01/section-function-map.md` — What this page does
- `evidence/PE-AI-CHAT-01/use-case-inventory.md` — All testable use cases
- `evidence/PE-AI-CHAT-01/acceptance-matrix.md` — AC-to-use-case mapping
- `evidence/PE-AI-CHAT-01/pre-execution-report.md` — This file
- `evidence/PE-AI-CHAT-01/post-sprint-report.md` — Written after evaluation
- `evidence/PE-AI-CHAT-01/bugs.md` — Bug log with taxonomy (created during eval)
- `evidence/PE-AI-CHAT-01/screenshots/` — Screenshot evidence (created during eval)

### Files Modified
None. This is observation-only.

### Application Code Changes
None.

---

## 3. UI Changes

None. No UI modifications permitted. This is a production evaluation sprint — observe and document only.

---

## 4. Acceptance Criteria

| AC | Criterion | Verification Method |
|----|-----------|-------------------|
| AC1 | Section function map completed | Document review (section-function-map.md) |
| AC2 | Chat behavior verified (auto-scroll, stability, usability) | Live browser testing via Playwright MCP — UC-03, UC-04, UC-05 |
| AC3 | Store switching with plausibility check | Live browser testing — UC-10, UC-11, UC-12, UC-13, UC-22, UC-23 |
| AC4 | Metric tiles and drill-downs show visible truth | Live browser testing — UC-14, UC-15, UC-16, UC-17, UC-18 |
| AC5 | Contact details are meaningful and credible | Live browser testing — UC-19, UC-20, UC-21 |
| AC6 | Every flow has evidence + commentary + status | Review of evidence directory |
| AC7 | Bugs logged with taxonomy | Review of bugs.md |
| AC8 | Post-sprint confidence + recommendation | Document review (post-sprint-report.md) |

---

## Test Plan

All testing is manual/interactive via Playwright MCP browser tools against the live production site.

### Phase 1: Page Load and Chat (UC-01 through UC-09)
1. Navigate to live.huminic.app, log in as duane.wells@huminic.ai
2. Screenshot: initial page state with 4 metric tiles
3. Verify suggestion chips visible
4. Send a chat message, observe streaming response
5. Screenshot: mid-stream and completed response
6. Verify auto-scroll behavior
7. Check for flicker/rendering instability
8. Verify tiles collapse after first message
9. Test new conversation button
10. Test thinking card expand/collapse

### Phase 2: Metric Tiles and Store Switching (UC-10 through UC-14, UC-22, UC-23)
1. Record metric values for default store
2. Switch to Serra Honda — screenshot and record all 4 values
3. Switch to Tony Serra Ford — screenshot and record (verify all-zeros claim)
4. Switch to Ford of Columbia — screenshot and record (verify escalations/pipeline claim)
5. Switch through remaining stores, recording values
6. Cross-check: for each store, compare tile count vs drill-down row count

### Phase 3: Drill-Downs (UC-15 through UC-18)
1. Click each of the 4 metric tiles
2. Screenshot each drill-down dialog
3. Verify table contents are plausible and match tile counts
4. Check column headers and data formatting

### Phase 4: Contact Detail (UC-19 through UC-21)
1. From a drill-down table, click "View Contact"
2. Screenshot ContactDetailView
3. Verify meaningful data (name, phone, not just raw IDs)
4. Test back button navigation

### Phase 5: Store Dropdown Position (UC-24)
1. Screenshot store dropdown in context with chat area
2. Note any overlap or positioning issues

### Evidence Capture
- Every use case gets at least one screenshot
- Screenshots saved to `evidence/PE-AI-CHAT-01/screenshots/`
- Named: `UC-{nn}-{description}.png`

---

## 6. Evidence Plan

| Evidence Tier | Description | Use Cases |
|--------------|-------------|-----------|
| Bronze | Screenshot showing expected state | UC-01, UC-02, UC-06, UC-07, UC-08, UC-09, UC-21, UC-24 |
| Silver | Screenshot + behavioral observation (streaming, scrolling, stability) | UC-03, UC-04, UC-05, UC-15, UC-16, UC-17, UC-18, UC-23 |
| Gold | Screenshot + data cross-check (tile count vs drill-down count, CRM data verification) | UC-10, UC-11, UC-12, UC-13, UC-14, UC-19, UC-20, UC-22 |

---

## 7. Bug Handling Plan

All bugs discovered during evaluation will be logged in `evidence/PE-AI-CHAT-01/bugs.md` with the following taxonomy:

| Field | Description |
|-------|-------------|
| Bug ID | BUG-PE01-{nn} |
| Use Case | Which UC triggered discovery |
| Severity | Critical / High / Medium / Low |
| Category | Functional / Visual / Data / UX |
| Description | What happened vs what was expected |
| Evidence | Screenshot filename |
| Recommendation | Fix priority and suggested approach |

Known bugs from prior work (e.g., auto-scroll scrollRef targeting wrong DOM node) will be verified and logged if still present.

---

## 8. Irreversible Action Boundary

**None.** This sprint performs no irreversible actions.

- No code changes
- No database writes
- No external API calls that create or modify data
- No deployments
- No emails, SMS, or outbound communications
- Browser interaction is read-only (navigate, click, observe)

The only artifacts created are evidence files within this repository.

---

## 9. Dependencies and Risks

### Dependencies
- live.huminic.app must be running and accessible
- Test account duane.wells@huminic.ai must be able to log in
- At least one store must have non-zero metric data for meaningful evaluation
- VIN Solutions API must be reachable for contact detail views

### Risks
| Risk | Mitigation |
|------|-----------|
| Live site is down | Check with curl before starting; if down, report blocker |
| No data in metrics | Switch stores until non-zero data found; document empty stores |
| VIN API timeout on contact detail | Retry once; if still fails, log as bug |
| Chat streaming fails | Log as critical bug; still evaluate all other use cases |

---

## Ghost Entry Gate

**Date:** 2026-04-06
**Evaluator:** Ghost agent

### Gate Checklist
| Gate | Status | Notes |
|------|--------|-------|
| A1 | PASS | section-function-map.md exists with concrete evidence of source reading — references specific files (client/src/pages/main.tsx), API endpoints (/api/chat/{conversationId}/stream), component names (MetricDetailDialog, ContactDetailView), and known bugs from prior sprints (scrollRef targeting wrong DOM node). |
| A2 | PASS | Scope explicitly limited to AI Chat / Main Dashboard. All 24 use cases (UC-01 through UC-24) relate only to chat, metric tiles, drill-downs, store switching, and contact detail on the main page. No out-of-scope pages referenced. |
| A3 | PASS | Expected behavior defined in concrete interface terms across section-function-map.md (layout, tile definitions, chat behavior, drill-down flow) and use-case-inventory.md (24 use cases with specific observable expectations). |
| A4 | PASS | Pre-execution report exists with all 9 required sections: Objective, Declared Files, UI Changes, Acceptance Criteria, Test Plan, Evidence Plan, Bug Handling Plan, Irreversible Action Boundary, Dependencies and Risks. Supporting artifacts (function map, use cases, acceptance matrix) all present. |
| A5 | PASS | Section 8 explicitly excludes all irreversible actions: no code changes, no database writes, no external API mutations, no deployments, no outbound communications. Browser interaction is read-only. |
| A6 | N/A | Observation-only sprint — no remediation authorized, worktree cleanliness not applicable. |
| A7 | PASS | No blocking ghost, enforcer, or operator messages found. |
| A8 | PASS | Sprint registered in sprints.json with id PE-AI-CHAT-01, status in_progress, 8 acceptance criteria, 10 declared files, entry/exit gates defined. Minor note: production-evals.json shows status "planned" while sprints.json shows "in_progress" — sprints.json is authoritative, discrepancy should be reconciled but is not blocking. |
| A9 | PASS | This gate — verdict below. |

### Cross-Checks Performed
- **AC coverage:** All 8 ACs from sprints.json are present in acceptance-matrix.md and pre-execution-report.md section 4.
- **Use case coverage:** All 24 use cases mapped to at least one AC. No orphan use cases, no unmapped ACs.
- **Evidence tiers:** Bronze (8 UCs), Silver (8 UCs), Gold (8 UCs) — appropriate escalation for data-critical flows.
- **Declared files consistency:** sprints.json declares 10 files; pre-exec declares 7 (subset). The 3 additional in sprints.json (evidence-index.md, enforcer-checklist.txt, cross-sign.md, workflow-audit.log) are post-execution artifacts — acceptable.
- **No code modification risk:** uiPermissions is NONE, declared files are all under evidence/, no application code listed in files modified.

### Verdict
ENTRY GATE: APPROVED
