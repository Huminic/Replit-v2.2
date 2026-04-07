# Independent Evidence Audit — SNP-001

**Date:** 2026-04-07
**Auditor:** Independent Evidence Auditor (Track 1, second pass)
**Method:** Evidence-only review. No application code read. No tests run. All files in evidence/SNP-001/ were read along with the SNP-001 entry in sprints.json.

---

## Methodology

1. Extracted the 8 acceptance criteria from sprints.json for SNP-001
2. Read all evidence files in evidence/SNP-001/ — this includes:
   - Governance: pre-execution-report.md, post-sprint-report.md, bug-categorization.md
   - Fix tracking: fix-log.md, backfill-status.md
   - Infrastructure: verify-vin-sync.md
   - Targeted verification: eval-list-a-r3.md, reverify-round3.md, final-verification.md
   - Independent section evals (7): dashboard, insights, integrations, sales, service, settings, teambox
   - Independent E2E evals (4): campaigns, vapi-vin, widgets, insights
   - Phase verifications: phase-3, phase-5, phase-7, phase-9, phase-11, phase-13, phase-15 verification files
3. For each AC: identified all evidence that addresses it, assessed evidence quality, noted contradictions
4. Gave higher weight to independent evals (which had no knowledge of fixes) over self-reported verifications

---

## AC-by-AC Assessment

### SNP-001.AC1: VIN warehouse sync completes for Serra Honda

**Post-sprint-report claim:** PASS — 1,300 leads synced, verify-vin-sync.md

| Source | Finding | Type |
|--------|---------|------|
| verify-vin-sync.md | DB query: 1,300 leads for Serra Honda, sync completed 2026-04-06 23:52 | Database evidence |
| backfill-status.md | All 5 dealerships synced, Serra Honda 1,300 | Claim |
| eval-list-a-r3.md | Dashboard: Total Leads 458, math consistent (11/458=2.4%) | Live UI observation |
| final-verification.md | Sales: Total Leads 457, Active Pipeline 107, Sold 11 | Live UI observation |
| independent-eval-sales.md | Tiles: Total Leads 458, Sold 11, Conversion 2.4% | Independent eval |
| independent-e2e-vapi-vin.md | Insights: 458 total leads, 166 hot | Independent eval |
| independent-e2e-insights.md | Dashboard fully populated, 458 leads | Independent eval |

**Contradictions:**
- backfill-status.md claims all 5 orgs synced; verify-vin-sync.md DB queries show only Serra Honda has data. However, backfill-status.md was written AFTER verify-vin-sync.md (the additional 4 orgs were backfilled later as noted by timestamps). Not a true contradiction — temporal ordering explains it.
- Minor lead count variation (457 vs 458) across evals is explained by timing.

**Evidence quality: STRONG** — Database evidence plus 5+ independent UI confirmations of real warehouse data.

**Verdict: PASS**

---

### SNP-001.AC2: Campaign recipients endpoint returns 200

**Post-sprint-report claim:** PASS — 16 recipients visible, eval-list-a-r3.md

| Source | Finding | Type |
|--------|---------|------|
| fix-log.md | BUG-SC-07 verified PASS, 16 rows visible | Self-verification |
| eval-list-a-r3.md | Modal opens with 16 recipients, API returned 200 | Targeted eval |
| final-verification.md | Campaign detail modal PASS, Recipients table with pending entries | Independent verification |
| independent-eval-service.md | 16 recipients displayed, matches recipientCount | Independent eval |

**Contradictions:** None.

**Evidence quality: STRONG** — 4 sources including 2 independent evals all confirm 200 response with 16 recipients.

**Verdict: PASS**

---

### SNP-001.AC3: Activity menu navigates to /insights?tab=activity

**Post-sprint-report claim:** PASS — Verified in round 3, reverify-round3.md

| Source | Finding | Type |
|--------|---------|------|
| fix-log.md | BUG-INS-13 verified PASS | Self-verification |
| eval-list-a-r3.md | /insights?tab=activity loads with Activity tab selected | Targeted eval |
| reverify-round3.md | Activity tab contains real events (Login Failed, Sync Backfill, etc.) | Reverification |
| final-verification.md | Activity tab PASS — real activity items with timestamps | Independent verification |

**Contradictions: YES — on Activity tab CONTENT (not navigation)**

The AC is specifically about navigation: "Activity menu navigates to /insights?tab=activity." The navigation itself is consistently confirmed across all sources.

However, the Activity tab CONTENT is contradicted:
- eval-list-a-r3.md: "Activity tracking coming soon" (placeholder)
- independent-e2e-insights.md: "Activity tracking coming soon. No real activity items." — FAIL
- reverify-round3.md: Real events with timestamps (Login Failed, Sync Backfill, Vapi Call, etc.)
- final-verification.md: Real activity items

This suggests the Activity tab fix (BUG-INS-07) was deployed between the Round 3 eval and the reverify/final rounds. The eval-list-a-r3.md was pre-build; the later evals were post-build. The independent-e2e-insights.md appears to have tested against a stale build or experienced a different session state.

**Evidence quality: STRONG for navigation, CONTRADICTED for content**

**Verdict: PASS** — The AC is about navigation routing, which is consistently proven. The content contradiction is a separate concern (BUG-INS-07).

---

### SNP-001.AC4: Channel Intelligence table renders data rows

**Post-sprint-report claim:** PASS — Table with Website (456 vol), Phone (1 vol), final-verification.md

| Source | Finding | Type |
|--------|---------|------|
| fix-log.md | BUG-INS-14 FIXED, enhanced channelPerformance fields | Self-verification |
| final-verification.md | Channel Intelligence PASS — Website (456 vol, 2.4 win, 30.9 bad, 36.2 hot%), Phone (1 vol), insight badges | Independent verification |
| independent-e2e-insights.md | 2 rows visible (Website 457, Phone 1) but all performance columns show "--". Header says 637 Total Leads but only 2 rows | Independent eval |
| independent-eval-insights.md | Could not reach due to route instability | Independent eval (blocked) |

**Contradictions: YES**
- final-verification.md: Full data with win rates, bad rates, hot percentages populated
- independent-e2e-insights.md: Table renders but all performance columns show "--"

Both confirm the table renders data ROWS (Website, Phone) — the AC literally says "renders data rows." The disagreement is whether the computed fields (winRate, badRate, etc.) are populated.

**Evidence quality: MODERATE** — The table renders rows in both evals. Data completeness contradicted.

**Verdict: WEAK PASS** — The AC says "renders data rows" which is confirmed by both sources. However, one independent eval shows "--" in performance columns, meaning the table may render rows but with empty data. The AC's intent (not just structure but meaningful data) may not be fully met.

---

### SNP-001.AC5: TeamBox test data below 10%

**Post-sprint-report claim:** PASS — 18 conversations, 0 junk, verify-vin-sync.md

| Source | Finding | Type |
|--------|---------|------|
| verify-vin-sync.md | DB query: 18 total, 0 test junk (0%) | Database evidence |
| final-verification.md | 14 conversations visible | Live UI observation |
| reverify-round3.md | 12 conversations listed | Reverification |
| independent-eval-teambox.md | 12 conversations, no junk noted | Independent eval |

**Contradictions:** Count varies (18/14/12) but this is explained by org-scoping. The key metric (0% junk) is consistent.

**Evidence quality: STRONG** — Database query definitively shows 0% test data.

**Verdict: PASS**

---

### SNP-001.AC6: VAPI assistant names human-readable

**Post-sprint-report claim:** PASS — All show "Caroline", final-verification.md

| Source | Finding | Type |
|--------|---------|------|
| fix-log.md | BUG-INT-12 FIXED — assistantName field | Self-verification |
| final-verification.md | All 6 entries show "Caroline" as assistant | Independent verification |
| independent-e2e-vapi-vin.md | All 13 entries show "Caroline" — human-readable, not UUID | Independent eval |
| independent-eval-teambox.md | Could not verify live (browser interference), code review shows assistantName || assistantId fallback | Code review |

**Contradictions:**
The earlier version of this audit (pre-existing in this file) cited verify-existing-fixes.md showing UUIDs. However, that was a PRE-FIX verification. The fix-log.md documents the fix at 06:30 (changing `call.assistant?.name` to `call.assistantName`). All POST-FIX evidence shows "Caroline."

**Evidence quality: STRONG** — Two post-fix independent sources confirm human-readable names.

**Verdict: PASS**

---

### SNP-001.AC7: /api/vapi/assistants filtered by org

**Post-sprint-report claim:** PASS — Serra Honda only, eval-list-a-r3.md

| Source | Finding | Type |
|--------|---------|------|
| fix-log.md | BUG-INT-15 cross-org filter verified PASS | Self-verification |
| eval-list-a-r3.md | 13 calls all for Serra Honda, 480 area code (Arizona) | Targeted eval |
| independent-e2e-vapi-vin.md | 13 entries, all "Caroline" (Serra Honda's assistant) | Independent eval |

**Contradictions:** None. Note: evidence tests /api/vapi/calls not /api/vapi/assistants, but the filtering principle is the same.

**Evidence quality: STRONG**

**Verdict: PASS**

---

### SNP-001.AC8: Campaign polling throttled to 15s

**Post-sprint-report claim:** PASS — 15.27s intervals, eval-list-a-r3.md

| Source | Finding | Type |
|--------|---------|------|
| fix-log.md | BUG-SC-08 verified PASS, 15.27s intervals | Self-verification |
| eval-list-a-r3.md | refetchInterval: 15000 confirmed, ~15s network intervals | Targeted eval |
| independent-eval-service.md | refetchInterval: 15000, 15s polling, no flicker | Independent eval |

**Contradictions:** None.

**Evidence quality: STRONG**

**Verdict: PASS**

---

## Evidence Gaps

### 1. Activity Tab Content Consistency
The Activity tab content is contradicted across evals. Two independent E2E evals (eval-list-a-r3.md pre-build, independent-e2e-insights.md) show "coming soon" placeholder. Two later verifications (reverify-round3.md, final-verification.md) show real data. This is likely a build timing issue but means the Activity tab state is not conclusively proven by independent evidence alone.

### 2. Channel Intelligence Data Completeness
final-verification.md shows full data; independent-e2e-insights.md shows "--" in performance columns. The AC is technically met (rows render) but the quality of the rendered data is disputed.

### 3. E2E Workflow Failures
All 4 E2E workflow evals returned PARTIAL or FAIL verdicts. While these test broader workflows beyond the 8 ACs, they document systemic issues:
- Routing instability (pages redirect within seconds)
- Session drops (auth refresh fails)
- Product tour interference (blocks interaction)
- Submenu overlay blocking clicks
These issues are pre-existing (not caused by SNP-001) but they undermine the testing environment's reliability.

---

## Contradictions Found

| # | Topic | Source A | Source B | Impact |
|---|-------|---------|---------|--------|
| 1 | Activity tab content | final-verification.md: real data | independent-e2e-insights.md: placeholder | Medium — affects confidence in AC3 content |
| 2 | Channel Intelligence data | final-verification.md: populated fields | independent-e2e-insights.md: "--" columns | Medium — affects confidence in AC4 |
| 3 | Sales sub-tab navigation | reverify-round3.md: PASS | independent-eval-sales.md: CRITICAL FAIL | High — not an AC but a regression concern |
| 4 | Product tour disabled | final-verification.md: no tour | independent-eval-dashboard/sales: tour reappears | Medium — not an AC but environment concern |
| 5 | Insights RBAC | reverify-round3.md: visible | independent-eval-insights.md: hidden by RBAC | Medium — regression fix timing |
| 6 | Backfill completeness | backfill-status.md: all 5 orgs | verify-vin-sync.md: only Serra Honda | Low — temporal ordering explains it |

Contradictions 1-5 follow a pattern: the "final" verifications (final-verification.md, reverify-round3.md) show passing results, while the independent evals show failures. This is consistent with fixes being applied incrementally throughout the sprint, with independent evals running at different build states. However, it means the independent evals do NOT corroborate all final verification claims.

---

## Verdict: FAIL

### AC Results Summary

| AC | Description | Verdict | Confidence |
|----|-------------|---------|------------|
| AC1 | VIN warehouse sync completes for Serra Honda | **PASS** | High |
| AC2 | Campaign recipients endpoint returns 200 | **PASS** | High |
| AC3 | Activity menu navigates to /insights?tab=activity | **PASS** | High (navigation), Low (content) |
| AC4 | Channel Intelligence table renders data rows | **WEAK PASS** | Medium — rows confirmed, data completeness contradicted |
| AC5 | TeamBox test data below 10% | **PASS** | High |
| AC6 | VAPI assistant names human-readable | **PASS** | High |
| AC7 | /api/vapi/assistants filtered by org | **PASS** | High |
| AC8 | Campaign polling throttled to 15s | **PASS** | High |

### Why FAIL despite 7-8 ACs passing:

1. **AC4 has contradicted evidence.** The final-verification.md shows fully populated Channel Intelligence data. The independent-e2e-insights.md (conducted by an agent with no knowledge of fixes) shows all performance columns as "--". The post-sprint-report cites only the favorable source. Until this contradiction is reconciled, AC4 cannot be considered proven.

2. **The evidence base is internally inconsistent.** The "final comprehensive verification" (final-verification.md) reports 7/7 sections PASS with no issues. But 5 of the 7 independent section evals report FAIL or PASS WITH RISK, with findings including:
   - Insights: FAIL (route instability, RBAC)
   - Sales: FAIL (sub-tab navigation broken, RBAC violation)
   - Dashboard: PASS WITH RISK (product tour, console errors)
   - Service: PASS WITH RISK (route instability)
   - TeamBox: PASS WITH RISK (browser interference limited testing)

   The gap between "7/7 PASS" and "2/7 FAIL + 3/7 WITH RISK" is not explained or reconciled in any evidence file. This undermines confidence in the overall verification integrity.

3. **Post-sprint-report cherry-picks evidence.** The AC Results table cites only favorable evidence files and does not acknowledge the contradictory findings from independent evals.

### What would change this to PASS:

- Run a single definitive test of Channel Intelligence under controlled conditions and document whether performance columns are populated or show "--"
- Acknowledge and explain the discrepancy between final-verification.md and independent eval findings (likely build timing, but needs to be stated)
- If build timing explains the contradictions, document which build each eval was run against
