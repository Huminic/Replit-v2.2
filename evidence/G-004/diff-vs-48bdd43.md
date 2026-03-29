# Diff -- G-004 vs Prior Gap Analysis (48bdd43)

**Date:** 2026-03-27
**Prior analysis:** M-001 Phase 3 gap analysis (commit 48bdd43)
**Current analysis:** G-004 cross-reference (U-001 inventory vs existing coverage)

---

## Issues Comparison

| Prior (I-149--I-158) | Current (I-160--I-171) | Overlap? |
|---|---|---|
| I-149: Tour overlay reappears on navigation | -- | No overlap. Tour persistence is prior-only finding. |
| I-150: TeamBox channel filters (WhatsApp/Web Chat) not enumerated | -- | No overlap. Channel enumeration is prior-only. |
| I-151: Settings tile grid 4 vs 7 vs 8 discrepancy | I-164: Settings sub-section interaction states (42 states) | **Partial overlap.** I-151 counts top-level tiles. I-164 goes deeper into per-section interaction states (forms, dialogs, CRUD). I-164 subsumes I-151's scope and extends it significantly. |
| I-152: Georgia FAB -- no AC | -- | No overlap. FAB coverage is prior-only. |
| I-153: Session timeout dialog -- no AC | -- | No overlap. Session timeout is prior-only. |
| I-154: 63 UI states uncrawled | I-161, I-162, I-163, I-164, I-167, I-168, I-169, I-170, I-171 | **Structural overlap.** I-154 was a blanket "63 uncrawled" finding. G-004 decomposed those 63 into 9 specific issues with state-level granularity. I-154 is the parent; the G-004 issues are its children. |
| I-155: Marketing metrics all zero (confirms I-113) | I-170: Marketing agent chat view (6 states) | **Partial overlap.** I-155 is about hardcoded zero data. I-170 is about the AgentChatView component states. Same page, different concerns. |
| I-156: /insights standalone -- 16 states uncrawled | I-163: Insights drill-down + Reports/Library -- 27 states | **Direct overlap.** I-163 subsumes I-156 and extends it. I-156 identified 16 states with zero screenshots. I-163 identifies 27 states with zero AC/test coverage, including the drill-down dialogs that I-156 did not enumerate. |
| I-157: API Keys/Webhooks RBAC gate not verified | -- | No overlap. RBAC verification is prior-only. |
| I-158: Right-side panes (G-14/G-15) -- no AC | -- | No overlap. Pane coverage is prior-only. |
| -- | I-160: Metric card label truncation | **New.** CSS truncation issue found via U-001 MISMATCH-001. Not visible in prior analysis. |
| -- | I-161: AI Chat + Sales drill-down dialogs (18 states) | **New.** Drill-down behavior not tested by any prior sprint. |
| -- | I-162: TeamBox task view (5 states) | **New.** Tasks sub-tab existed in DOM but was invisible to prior analysis. |
| -- | I-165: Forgot/reset password FE flow (11 states) | **New.** Entire auth edge-state cluster missed by prior analysis. |
| -- | I-166: Org wizard functional flow (11 states) | **New.** Wizard steps never tested; prior analysis only checked RBAC routing. |
| -- | I-168: Widget interaction modes (~22 states) | **New.** Widget modes partially flagged by I-154 (uncrawled) but never decomposed. |
| -- | I-169: Hunch status transition UI (8 states) | **New.** Status transitions (accept/dismiss) never tested. |
| -- | I-171: Billing UI states (26 states) | **New.** Entire billing functional surface missed. I-105/I-111 existed but covered wiring, not UI states. |

---

## Sprint Comparison

| Prior (G-001--G-003, 16 ACs total) | Current (R-018--R-023, 49 ACs total) | Differences |
|---|---|---|
| G-001: Settings + Tour + RBAC Gaps (6 ACs) | R-020: Settings Sub-Section States (6 ACs) | G-001 focused on top-level tile count and RBAC gates. R-020 goes deeper into per-section interaction states (42 states across 5 sections). R-020 does not cover tour or RBAC -- those remain in G-001's scope. |
| G-002: Uncovered UI Elements Investigation (4 ACs) | -- | No current equivalent. G-002 covered FAB, session timeout, TeamBox filters, right panes. These were not re-raised by G-004 because they were already tracked. |
| G-003: Uncrawled State Visual Verification (6 ACs) | R-018 + R-019 + R-022 (combined) | G-003 was a visual crawl sprint (screenshot all 63 uncrawled states). R-018/R-019/R-022 are functional test sprints that cover the same surfaces but with interaction testing, not just screenshots. Much deeper verification. |
| -- | R-018: FE General -- Drill-Downs + Tasks + Agent Chat (8 ACs) | **New scope.** Covers AI Chat, Sales, TeamBox, Marketing, and /agents interaction states. 5 issues consolidated into one sprint. |
| -- | R-019: Insights Drill-Downs + Reports + Hunches (7 ACs) | **New scope.** 27 Insights states + 8 Hunch states. G-003 only crawled screenshots; R-019 tests click behavior. |
| -- | R-021: Auth Edge States + Org Wizard (7 ACs) | **New scope.** Forgot/reset password FE flow and org wizard functional testing. Zero prior coverage. |
| -- | R-022: Widget Interaction Modes (8 ACs) | **New scope.** ~22 widget states including chat, video, voice, form, callback. G-003 planned screenshots; R-022 tests mode transitions. |
| -- | R-023: Billing UI States (9 ACs) | **New scope.** 26 billing states including FlexPrice integration. Zero prior coverage. |

### Summary metrics

| Metric | Prior (48bdd43) | Current (G-004) |
|---|---|---|
| Issues raised | 10 (I-149--I-158) | 12 (I-160--I-171) |
| Remediation sprints | 3 (G-001, G-002, G-003) | 6 (R-018--R-023) |
| Total ACs | 16 | 49 |
| Test file | m001-gap-coverage.spec.ts (10 tests) | g004-gap-coverage.spec.ts (10 tests) |
| States explicitly tracked | ~63 (blanket "uncrawled") | ~196 (state-level IDs: ST-013 through ST-342) |
| Methodology | Screenshot crawl + manual enumeration | Systematic cross-reference of 350-state inventory against all ACs, tests, and issues |

---

## New Findings Not In Prior

These gaps were found by G-004 that were invisible to the M-001 analysis:

1. **I-160 -- Metric card label truncation.** CSS overflow issue on AI Chat dashboard. Found via U-001 visual mismatch inventory, not by gap analysis. Prior analysis did not capture DOM-level rendering issues.

2. **I-161 -- AI Chat + Sales drill-down dialogs (18 states).** Clicking metric tiles to open detail views was never tested. Prior analysis checked tile values via API (S-1.AC11, S-3.AC4) but not the click-through behavior.

3. **I-162 -- TeamBox task view (5 states).** Tasks sub-tab exists in DOM but was not in the prior state enumeration. Found by U-001 DOM inventory.

4. **I-165 -- Forgot/reset password FE flow (11 states).** Entire auth edge-state cluster (ST-013 through ST-026). Prior analysis assumed R-017 covered this, but R-017 only addressed backend. No FE flow testing existed.

5. **I-166 -- Org wizard functional flow (11 states).** 7-step wizard with form validation and submission. Prior analysis only checked RBAC routing (Domain-09 9.4). Actual wizard functionality was untested.

6. **I-169 -- Hunch status transition UI (8 states).** Accept/Dismiss buttons exist in DOM but no AC or test exercises the transition. Prior analysis enumerated hunches as a concept but not the status machine.

7. **I-171 -- Billing UI states (26 states).** Entire billing functional surface. I-105 (FlexPrice wiring) and I-111 (test gap flag) existed but tracked API/config concerns, not the 26 UI states. This is the single largest new gap cluster.

**Root cause of prior misses:** The M-001 analysis worked from a manually enumerated state list of ~163 states. The G-004 analysis worked from U-001's systematic 350-state DOM inventory. The 187-state delta between the two inventories is where most new findings originate. The prior analysis was directionally correct but lacked the granularity to decompose blanket findings (like I-154's "63 uncrawled") into actionable, testable units.

---

## Prior Findings Still Valid

All 10 prior issues (I-149 through I-158) remain valid and relevant:

| Issue | Still Valid? | Notes |
|---|---|---|
| I-149: Tour persistence | Yes | No code fix has been applied. Tour still reappears on navigation. G-001 remains the assigned sprint. |
| I-150: TeamBox channel filters | Yes | WhatsApp and Web Chat presence still unresolved. Needs operator decision. |
| I-151: Settings tile count | Yes | Subsumed by I-164 but the top-level count discrepancy is still unresolved. G-001.AC3 still needed. |
| I-152: Georgia FAB | Yes | Still undocumented. No AC, no functional verification. |
| I-153: Session timeout | Yes | Still undocumented. No AC, no test. |
| I-154: 63 uncrawled states | Partially superseded | The blanket finding is now decomposed into I-161 through I-171. I-154 itself can be closed once all children are tracked. |
| I-155: Marketing metrics zero | Yes | Still hardcoded. I-113 still REMEDIATING. |
| I-156: Insights standalone | Superseded by I-163 | I-163 covers the same surface with more granularity (27 states vs 16). I-156 can be closed in favor of I-163. |
| I-157: API Keys/Webhooks RBAC | Yes | Gate verification still not performed. G-001.AC4/AC5 still needed. |
| I-158: Right-side panes | Yes | Still no AC or screenshot. |

**Recommendation:** Close I-154 (superseded by decomposed children) and I-156 (superseded by I-163). Keep the remaining 8 prior issues open and ensure G-001/G-002 sprints still execute.
