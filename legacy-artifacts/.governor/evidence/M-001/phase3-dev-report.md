# M-001 Phase 3 — Dev Report

**Date:** 2026-03-27
**Phase:** Gap Analysis + Sprint Definitions
**Dev:** Subagent (dispatched by Captain)

---

## Summary

Cross-referenced the U-001 state enumeration (163 states across 20 routes) against existing acceptance criteria (156 ACs across S-0 through S-10), existing issues (I-086 through I-148), and 30 screenshots. Produced reconciliation document, 10 new issues, 3 remediation sprints, and 1 test file.

---

## Gaps Found

### Category 1: Uncrawled States (63 states, 39%)
- **/insights standalone** — 16 states, zero screenshots, HIGH priority
- **Widget modes** — 11 states (chat, video, voice, form), zero screenshots, HIGH priority
- **/my-work** — 8 states, deferred per I-127 but no screenshots
- **/agents standalone** — 7 states, zero screenshots
- **/settings/org-wizard** — 8 states, zero screenshots (super_admin only)
- **Settings: Notifications** (ST-30) — not crawled
- **Settings: Appearance** (ST-31) — not crawled
- **Global overlays** — tour (G-11), session timeout (G-13), Georgia FAB (G-12), right panes (G-14/G-15) — 6 states uncrawled

### Category 2: UI Elements Without AC Coverage
- **Tour persistence** — 6-step tour reappears on every navigation. I-137 covers the skip/close bug but no AC tests persistence.
- **TeamBox WhatsApp + Web Chat filters** — visible in screenshot but not in state enumeration or ACs
- **"Discuss with Georgia" FAB** — enumerated (G-12) but zero ACs
- **Session timeout dialog** — enumerated (G-13) but zero ACs
- **Right panes** (G-14, G-15) — enumerated but zero ACs

### Category 3: Screenshot vs Enumeration Mismatches
- **Settings tile grid** — screenshots show 4 tiles; enumeration says 7; AC S-7.AC1 says 8. Mismatch unresolved (may be below fold).
- **Marketing metrics** — screenshot confirms all zeros (I-113), no remediation sprint assigned to marketing specifically.
- **TeamBox tabs** — screenshots show Conversations/Phone/Video; popout has SMS/Email/Phone/Video/Tasks (I-147 covers this).
- **Sales agents** — 5 shown instead of 4 (I-138 test artifact).

### Category 4: RBAC Gaps Not Verified
- **API Keys** (ST-20) and **Webhooks** (ST-21) — marked super_admin-only in enumeration, no AC verifies this gate
- **AI Config tile** — I-120 flags inconsistency between tile grid and sub-menu RBAC
- **Usage page** — visible in sidebar for super_admin only (screenshot 30), expected behavior but not documented as AC

### Category 5: Known Bugs in hardwonknowledge.md Not Previously in issues.md
All items from hardwonknowledge.md "Watch For" section were already tracked in issues:
- Marketing agents client-side → known, not a bug
- Sales Recent Activity hardcoded → I-112
- Sales Conversion Rate → I-114
- Service/Marketing metrics hardcoded → I-113
- Sub-menu mismatches → I-115

No new bugs from hardwonknowledge.md needed to be added.

---

## New Issues Added

| ID | Domain | Title | Severity | Sprint |
|----|--------|-------|----------|--------|
| I-149 | FE | Tour overlay reappears on every page navigation | Medium | G-001 |
| I-150 | FE | TeamBox channel filters include WhatsApp and Web Chat — not in enumeration | Low | G-002 |
| I-151 | FE | Settings tile grid shows only 4 tiles — enumeration claims 7, AC says 8 | Medium | G-001 |
| I-152 | FE | "Discuss with Georgia" FAB has no acceptance criteria | Low | G-002 |
| I-153 | FE | Session timeout dialog has no AC or test | Low | G-002 |
| I-154 | FE | 63 UI states uncrawled — no visual verification | High | G-003 |
| I-155 | FE | Marketing Dashboard metrics all showing zero (screenshot confirms I-113) | Medium | I-113 |
| I-156 | FE | Insights standalone page has 16 uncrawled states | High | G-003 |
| I-157 | AU | API Keys and Webhooks RBAC gate not verified | Medium | G-001 |
| I-158 | FE | Right-side panes (G-14, G-15) have no AC or test | Low | G-002 |

**Total new issues: 10** (I-149 through I-158)

---

## New Sprints Defined

| ID | Name | Issues Covered | ACs | Status |
|----|------|---------------|-----|--------|
| G-001 | Settings + Tour + RBAC Gaps | I-149, I-151, I-157, I-120 | 6 | proposed |
| G-002 | Uncovered UI Elements Investigation | I-150, I-152, I-153, I-158 | 4 | proposed |
| G-003 | Uncrawled State Visual Verification | I-154, I-156 | 6 | proposed |

**Total new sprints: 3** with **16 acceptance criteria** total.

---

## Test Coverage Created

**File:** `tests/e2e/m001-gap-coverage.spec.ts`

| Test Suite | Tests | Covers |
|-----------|-------|--------|
| Tour Persistence (I-149) | 1 | Tour dismissal persists across navigation |
| Settings Tile Count (I-151) | 2 | org_admin tile count, super_admin AI Config visibility |
| API Keys RBAC (I-157) | 1 | org_admin cannot see API Keys/Webhooks |
| TeamBox Filters (I-150) | 1 | All channel chips functional |
| Insights Standalone (I-156) | 2 | Page loads, Library tab metric tiles |
| Agents Standalone (I-154) | 1 | Page loads with agent interface |
| Settings Sub-pages (I-154) | 2 | Notifications existence, Appearance existence |

**Total new tests: 10**

---

## Uncrawled States Requiring Future Coverage

Priority-ordered list of states that need screenshots in G-003:

**HIGH:**
1. IN-01 through IN-16 — /insights standalone (all 16 states)
2. WL-02 through WL-12 — Widget modes (11 states)
3. G-11 — Tour overlay 6-step sequence

**MEDIUM:**
4. AG-01 through AG-07 — /agents standalone (7 states)
5. ST-30 — Notifications section
6. ST-31 — Appearance section
7. G-12 — "Discuss with Georgia" FAB
8. G-14, G-15 — Right-side panes
9. MW-01 through MW-08 — /my-work (8 states, deferred page)

**LOW:**
10. OW-01 through OW-08 — /settings/org-wizard (8 states, super_admin only)
11. BL-01 through BL-05 — /settings/billing (5 states, blocked by I-105)
12. G-13 — Session timeout dialog
13. NF-01 — 404 page
14. AU-02, AU-03 — Login edge states

---

## Artifacts Produced

1. `/home/ubuntu/Claude-store/nexxus2.2_replit/.governor/evidence/U-001/reconciliation.md` — Full state-by-state reconciliation
2. `/home/ubuntu/Claude-store/nexxus2.2_replit/issues.md` — 10 new issues appended (I-149 through I-158)
3. `/home/ubuntu/Claude-store/nexxus2.2_replit/sprints.json` — 3 new sprints added (G-001, G-002, G-003) with 16 ACs
4. `/home/ubuntu/Claude-store/nexxus2.2_replit/tests/e2e/m001-gap-coverage.spec.ts` — 10 tests covering critical gaps
5. `/home/ubuntu/Claude-store/nexxus2.2_replit/.governor/evidence/M-001/phase3-dev-report.md` — This report

---

## Exit Assessment

**Phase 3 complete.** All five deliverables produced. The gap analysis revealed that 39% of enumerated UI states have never been visually verified, which is the highest-priority finding. The 3 proposed G-series sprints address the gaps in priority order: RBAC/tour fixes first (G-001), investigation of undocumented elements second (G-002), and comprehensive visual crawl third (G-003).

No application code was modified. No governance files other than issues.md and sprints.json were edited.
