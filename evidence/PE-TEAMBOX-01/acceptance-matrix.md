# PE-TEAMBOX-01 — Acceptance Criteria to Use Case Matrix

**Sprint:** PE-TEAMBOX-01
**Date:** 2026-04-06

---

## Matrix

| AC ID | Acceptance Criterion | Use Cases | Verification Method |
|-------|---------------------|-----------|-------------------|
| AC1 | Section / page function map states what each TeamBox pane, tab, and filter is for in interface terms. | N/A (document) | Review of `section-function-map.md` — must cover all 4 columns, 3 tabs, channel chips, status filters, key actions. |
| AC2 | Clicking a message / conversation is evaluated for whether the active thread and detail pane populate correctly. | UC-05, UC-06, UC-07, UC-08 | Live browser testing. Click conversation, verify thread loads (UC-05). Click different conversation, verify thread refreshes (UC-06). Verify detail pane populates (UC-07) with correct data (UC-08). |
| AC3 | Changing a TeamBox subcategory or filter is evaluated for whether the active content refreshes correctly. | UC-02, UC-03 | Live browser testing. Toggle each status filter (UC-02) and each channel chip (UC-03). Verify list updates, counts match. |
| AC4 | SMS filter truth is evaluated against the All filter and visible message reality. | UC-04 | Live browser testing. Count SMS conversations under All, switch to SMS chip, compare. Document any discrepancy. |
| AC5 | Service-campaign and escalation visibility / absence is documented as working, broken, or intentionally missing. | UC-09 | Code review + live inspection. Document that no campaign filter chip exists. Document Disconnect Campaign button behavior on campaign conversations. |
| AC6 | Human takeover / operator response continuity is evaluated where available within scope. | UC-10, UC-11, UC-16 | Live browser testing. Find automated conversation (UC-10), test takeover. Send reply (UC-11). Verify thread continuity (UC-16). |
| AC7 | Every executed flow has evidence, commentary, and result status. | UC-01 through UC-16 | Review of evidence directory — every executed use case must have screenshot(s), commentary, and PASS/FAIL/BLOCKED status. |
| AC8 | Bugs are logged with severity, type, and false-pass classification where applicable. | Any failing UC | Review of `bug-log.md` — every bug found during evaluation must be logged with severity (critical/high/medium/low), type (functional/visual/data/UX), and whether it represents a false-pass condition. |

---

## Coverage Summary

| AC | Use Cases Covered | Gap Risk |
|----|-------------------|----------|
| AC1 | Document-only | Low — already written from code review |
| AC2 | UC-05, UC-06, UC-07, UC-08 | High — UC-06 and UC-08 are known bug areas |
| AC3 | UC-02, UC-03 | Medium — depends on having conversations in multiple statuses/channels |
| AC4 | UC-04 | High — false-pass detection requires careful count comparison |
| AC5 | UC-09 | Low — code review already confirms absence of campaign filter |
| AC6 | UC-10, UC-11, UC-16 | High — depends on having automated conversations and real message data |
| AC7 | All | Structural — met by evidence discipline |
| AC8 | Any failing | Structural — met by bug logging discipline |

---

## Execution Order

1. **Phase 1 — Page Load and Structure:** UC-01 (load), UC-09 (campaign filter audit)
2. **Phase 2 — Filtering:** UC-02 (status), UC-03 (channel), UC-04 (SMS truth), UC-15 (search)
3. **Phase 3 — Selection and Panes:** UC-05 (thread load), UC-06 (thread refresh), UC-07 (detail pane), UC-08 (detail correctness)
4. **Phase 4 — Operator Actions:** UC-10 (takeover), UC-11 (reply), UC-12 (quick actions), UC-16 (continuity)
5. **Phase 5 — Secondary Tabs:** UC-13 (phone), UC-14 (video)
