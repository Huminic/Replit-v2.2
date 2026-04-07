# Harness Gap Analysis — Production Evals Pack vs Nexxus Governance

**Date:** 2026-04-06
**Evaluator:** sysadmin governance-adaptation agent
**Pack Version:** 1.1
**Harness Reference:** nexxus2.2_replit pre-commit.sh, watchdog.sh, CLAUDE.md, sprints.json schema

---

## 1. Executive Summary

The Production Evals pack is methodologically strong. Its eval discipline, evidence rubric, bug taxonomy, false-pass detection, and one-sprint-at-a-time rule are well-designed and should be preserved exactly as-is.

However, the pack is **not harness-native**. It references "enforcer" and "entry/exit gates" conceptually but does not wire into the actual mechanical enforcement layer that governs all Nexxus sprints. Without adaptation, the executing agent would either (a) bypass the harness and produce untracked work, or (b) hit gate failures it doesn't understand.

**Verdict:** 14 gaps identified. 6 are critical (would block execution). 5 are structural (would cause confusion). 3 are minor (cleanup).

---

## 2. Already Compatible

| Area | Pack Status | Notes |
|------|-------------|-------|
| Sprint JSON structure | Fields match sprints.json schema (id, status, phase, category, acceptanceCriteria, entryGates, exitGates, dimensions, declaredFiles, evidence, executionSteps, commit) | Direct alignment |
| Evidence directory convention | `evidence/PE-*-01/` matches existing `evidence/{sprint-id}/` pattern | Correct |
| One-sprint-at-a-time | Pack enforces this; harness enforces this via Gate 1.5 | Aligned |
| Pre-execution-report.md | Pack requires it; harness Gate 2.5 requires it | Template needs enhancement (see gaps) |
| Post-sprint-report.md | Pack requires it; harness Gate 1.10 requires it | Template needs enhancement (see gaps) |
| Bug taxonomy | Well-structured, no harness conflict | Preserve as-is |
| Evidence rubric | Well-structured, no harness conflict | Preserve as-is |
| False-pass detection | Not a harness concern but methodologically critical | Preserve as-is |
| Playwright-is-witness principle | Correct and non-conflicting | Preserve as-is |
| executionSteps array | Structure matches (step, action, status, timestamp) | Missing `verdict` field (see gap) |

---

## 3. Partially Compatible

| Area | Pack Status | Gap | Severity |
|------|-------------|-----|----------|
| Entry gates | Pack lists A1-A7 with "enforcer / operator entry review clear" | Does not specify the exact Ghost Entry Gate file-based ceremony (ghost appends `## Ghost Entry Gate` to pre-execution-report.md, agent greps for `ENTRY GATE: APPROVED`) | **CRITICAL** — agent won't know when/how to proceed |
| Exit gates | Pack lists B1-B9 with "exit review clear" | Does not specify the exact Ghost Exit Gate file-based ceremony (ghost appends `## Ghost Exit Gate` to post-sprint-report.md, agent greps for `EXIT GATE: CLEARED`) | **CRITICAL** — sprint can't close |
| Governance Enforcer role | Pack defines a sub-agent role "Governance Enforcer" | Role described generically; not wired to actual pre-commit.sh gates, watchdog checks, or COMMIT_ROLE/COMMIT_SPRINT env vars | **STRUCTURAL** — enforcer role is decorative without wiring |
| executionSteps | Pack has 5 steps per sprint | Missing `verdict` field that existing sprints use; harness Gate 1.9 checks all steps completed with timestamps and verdicts | **CRITICAL** — Gate 1.9 will block |
| Action boundary | Pack mentions SAFE/GATED/IRREVERSIBLE concept in master prompt section 2 | Not mapped to the exact CLAUDE.md action classification (which actions are SAFE for eval sprints, when remediation flips to GATED) | **STRUCTURAL** — agent may misjudge boundaries |

---

## 4. Missing (Must Add)

### 4.1 CRITICAL — Would Block Execution

| # | Gap | What's Missing | Harness Gate |
|---|-----|---------------|--------------|
| G1 | **sprints.json registration** | PE sprints exist only in production-evals.json. The harness (pre-commit.sh Gate 1) validates COMMIT_SPRINT against sprints.json. PE sprints must be registered in sprints.json before any commit. | Gate 1 |
| G2 | **enforcer-checklist.txt** | Not in declaredFiles, no template provided. Harness Gate 3 requires `evidence/{sprint}/enforcer-checklist.txt` with `RESULT: APPROVED` and fresh timestamp (< 30 min). | Gate 3 |
| G3 | **cross-sign.md** | Completely absent from pack. Harness Gate 4 requires `evidence/{sprint}/cross-sign.md` with different Implementing/Reviewing roles, verdict "approved", and fresh timestamp (< 30 min). | Gate 4 |
| G4 | **COMMIT_ROLE + COMMIT_SPRINT env vars** | Not referenced anywhere in pack. Every `git commit` in nexxus requires `COMMIT_ROLE=<role> COMMIT_SPRINT=<id> git commit -m "message"`. | Gate 1 |
| G5 | **Ghost Entry Gate ceremony** | Pack says "stop for review" but doesn't specify the mechanical protocol: ghost appends `## Ghost Entry Gate` section to pre-execution-report.md with `ENTRY GATE: APPROVED` or `ENTRY GATE: REJECTED`. Agent must grep for approval before proceeding. | CLAUDE.md protocol |
| G6 | **Ghost Exit Gate ceremony** | Same gap. Ghost appends `## Ghost Exit Gate` section to post-sprint-report.md with `EXIT GATE: CLEARED` or `EXIT GATE: NOT CLEARED`. Agent must grep before starting next sprint. | CLAUDE.md protocol + Gate 1.10 |

### 4.2 STRUCTURAL — Would Cause Confusion

| # | Gap | What's Missing |
|---|-----|---------------|
| G7 | **executionSteps.verdict field** | Existing sprints have `verdict` on each step. Gate 1.9 checks this. Pack template omits it. |
| G8 | **uiPermissions field** | Missing from all PE sprint entries. For eval-only sprints this should be `null` (no UI changes). If remediation is authorized, it must be declared. |
| G9 | **Watchdog acknowledgment** | Gate 1.6 requires fresh watchdog-ack.txt if violations exist. Pack doesn't mention watchdog at all. |
| G10 | **ghost_messages.json acknowledgment** | Gate 1.8 checks for pending ghost messages. Pack doesn't reference this. |
| G11 | **Remediation sub-sprint model** | Pack says "if remediation is authorized" but doesn't define how remediation creates a sub-sprint with full code governance (GATED action boundary, UI permissions, declared files for code changes). |

### 4.3 MINOR — Cleanup

| # | Gap | What's Missing |
|---|-----|---------------|
| G12 | **workflow-audit.log** | Standard evidence artifact in existing sprints. Not in pack's declaredFiles. |
| G13 | **VIN Solutions safety reference** | PE-INTEGRATIONS-01 evaluates VIN Solutions but doesn't reference vin-safe-mcp mandatory flow for any write operations. |
| G14 | **Sprint ID pattern** | ghost-config.json expects pattern `^[PRGIEMDTL]-\d{3}$`. PE-AI-CHAT-01 doesn't match. Either update ghost-config or rename sprints. |

---

## 5. Structural Decision: production-evals.json vs sprints.json

**Problem:** The harness reads sprints.json. The pack has its own production-evals.json.

**Decision:** Keep production-evals.json as the **planning and reference document** (rich metadata, seed defects, integration contexts, sub-agent roles, collaboration rules). Register each PE sprint in sprints.json when it is activated for execution.

**Rationale:**
- Adapting the harness to read a second file violates "adapt the pack to the harness, not the harness to the pack"
- production-evals.json contains metadata (seedDefects, flowCoverage, integrationContexts) that doesn't belong in sprints.json
- Registration in sprints.json makes PE sprints visible to watchdog, ghost, and pre-commit — full governance for free

**Implementation:** The execution agent registers each PE sprint in sprints.json (using `.governor/scripts/new-sprint.sh` or direct insert) before starting work on it. production-evals.json remains the master reference for eval methodology.

---

## 6. Structural Decision: Governance Classification

**Problem:** Should PE sprints use full governance (enforcer + cross-sign + all gates) or light governance (like V-*/E-* sprints)?

**Decision:** Two-tier model.

| Mode | When | What's Required |
|------|------|-----------------|
| **Observation mode** (default) | Sprint writes only evidence files, no code changes | Ghost entry/exit gates, enforcer-checklist (evidence-quality focused), cross-sign (orchestrator + ghost). Skip EF-01 (TypeScript), EF-14/15/16 (UI guards), EF-19 (smoke test). |
| **Remediation mode** (explicit) | Operator authorizes code changes within a sprint | Full governance: all pre-commit gates, full enforcer checklist, cross-sign with code-relevant roles, declared files for code changes, UI permissions if applicable. |

**Implementation:** Each PE sprint entry in sprints.json gets a `governanceMode` note in the description. The enforcer-checklist template has two variants.

---

## 7. Required Protocol Changes Summary

| Change | File(s) Affected | Priority |
|--------|-------------------|----------|
| Add Ghost Entry Gate ceremony instructions | claude-code-master-prompt.md | P0 |
| Add Ghost Exit Gate ceremony instructions | claude-code-master-prompt.md | P0 |
| Add enforcer-checklist.txt to declaredFiles + template | sprint-template.json, sprint-template.md, production-evals.json | P0 |
| Add cross-sign.md to declaredFiles + template | sprint-template.json, sprint-template.md, production-evals.json | P0 |
| Add COMMIT_ROLE/COMMIT_SPRINT instructions | claude-code-master-prompt.md | P0 |
| Add verdict field to executionSteps | sprint-template.json, production-evals.json | P0 |
| Add uiPermissions field | production-evals.json | P1 |
| Add watchdog/ghost_messages acknowledgment | claude-code-master-prompt.md | P1 |
| Add workflow-audit.log to declaredFiles | sprint-template.json, production-evals.json | P2 |
| Add remediation sub-sprint model | claude-code-master-prompt.md, new template | P1 |
| Add VIN Solutions safety reference | claude-code-master-prompt.md | P1 |
| Add sprints.json registration step | claude-code-master-prompt.md, handoff brief | P0 |
| Create PE-specific enforcer-checklist template | templates/enforcer-checklist-template.txt | P0 |
| Create PE-specific cross-sign template | templates/cross-sign-template.md | P0 |

---

## 8. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Sprint ID pattern mismatch | Ghost config rejects PE-AI-CHAT-01 format | Update ghost-config.json pattern OR use short IDs (PE-001 through PE-007) |
| Remediation scope creep | Code fix touches more than declared files | Remediation must create explicit sub-sprint with declared file scope |
| Evidence volume | 7 sprints x multiple flows = hundreds of screenshots | Evidence index per sprint keeps it navigable |
| Context compaction | Long eval sprints may hit context limits | Compact-safe files listed in manifest; resume protocol in master prompt |
| Cross-sign bottleneck | Every sprint needs a different reviewing role | For observation-only sprints, Ghost agent acts as reviewer |

---

## 9. Recommendation

**The pack is ready for adaptation. No fundamental redesign needed.**

The core eval methodology is sound and should not be weakened. The gaps are all on the harness-binding side — mechanical wiring that can be added without changing the eval philosophy.

Proceed with:
1. Create adapted pack with all gaps patched
2. Create protocol templates
3. Write handoff brief for execution agent
4. Execution agent registers first sprint (PE-AI-CHAT-01) in sprints.json and begins
