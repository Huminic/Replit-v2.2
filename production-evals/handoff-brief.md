# Production Evals — Source Coding Session Agent Handoff Brief

**Date:** 2026-04-06
**From:** sysadmin governance-adaptation agent
**To:** nexxus source coding session agent (orchestrator role)
**Pack Version:** 2.0-harness-native

---

## What This Is

A harness-native Production Evals pack has been placed at `production-evals/` in the nexxus2.2_replit project. It contains everything needed to execute rigorous, evidence-driven evaluation sprints against the Nexxus production application.

The pack has been adapted from a strong QA methodology to be fully compatible with the existing Nexxus governance harness (Ghost entry/exit gates, pre-commit.sh, watchdog, enforcer checklist, cross-sign).

---

## What Changed From The Original Pack

| File | Change | Why |
|------|--------|-----|
| `claude-code-master-prompt.md` | Rewritten with harness integration (sections 3, 6, 12) | Original didn't wire Ghost gates, enforcer, cross-sign, COMMIT vars, watchdog |
| `production-evals.json` | Added `verdict` to executionSteps, `uiPermissions`, enforcer/cross-sign/audit-log to declaredFiles, harness entry/exit gates (A6-A9, B7-B10) | Gate 1.9, Gate 3, Gate 4 would have blocked without these |
| `sprint-template.json` | Same additions as above | Template must match adapted schema |
| `sprint-template.md` | Added enforcer-checklist, cross-sign, workflow-audit templates | Original had no enforcer or cross-sign templates |
| `production-evals-manifest.json` | Updated to v2.0-harness-native, added new files | Manifest must reflect actual contents |
| NEW: `harness-gap-analysis.md` | Full gap analysis document | Documents what was missing and why each change was made |
| NEW: `templates/enforcer-checklist-observation.txt` | Evidence-quality focused enforcer checklist for observation-only sprints | Harness Gate 3 requires enforcer-checklist.txt |
| NEW: `templates/enforcer-checklist-remediation.txt` | Full code + evidence enforcer checklist for remediation sprints | Needed when code changes are authorized |
| NEW: `templates/cross-sign-template.md` | Cross-sign template adapted for eval context | Harness Gate 4 requires cross-sign.md |
| NEW: `templates/ghost-entry-gate-template.md` | Exact format Ghost agent appends to pre-execution-report.md | Ghost protocol was implicit, now explicit |
| NEW: `templates/ghost-exit-gate-template.md` | Exact format Ghost agent appends to post-sprint-report.md | Ghost protocol was implicit, now explicit |
| UNCHANGED: `bug-taxonomy.md/.yaml` | No changes | Already strong |
| UNCHANGED: `evidence-rubric.md/.yaml` | No changes | Already strong |
| UNCHANGED: `production-evals-brief.md` | No changes | Already strong |
| UNCHANGED: `first-wave-eval-sprints.md` | No changes | Already strong |

---

## What You Must Do (Execution Order)

### Phase 0: Read and Understand
1. Read `claude-code-master-prompt.md` — your operating instructions
2. Read `production-evals.json` — the eval registry
3. Read `first-wave-eval-sprints.md` — recommended sprint order
4. Read `bug-taxonomy.md` and `evidence-rubric.md` — classification standards
5. Read project `CLAUDE.md` — master governance protocol
6. Read `sprints.json` — current sprint state (verify no conflicting in_progress sprints)

### Phase 1: Register First Sprint
1. Select `PE-AI-CHAT-01` (first in work order)
2. Register it in `sprints.json` by adding the entry from `production-evals.json` (with all harness fields)
3. Set status to `committed`
4. Verify: `jq '.[] | select(.id == "PE-AI-CHAT-01")' sprints.json`

### Phase 2: Pre-Execution Package
1. Create `evidence/PE-AI-CHAT-01/` directory
2. Write `pre-execution-report.md` using template from `sprint-template.md`
3. Include ALL required sections (objective, scope, declared files, function map, use cases, acceptance matrix, evidence plan, bug handling plan, action boundary review)
4. **STOP** — wait for Ghost Entry Gate

### Phase 3: Ghost Entry Gate
1. Ghost agent reads pre-execution-report.md
2. Ghost agent appends `## Ghost Entry Gate` section (see `templates/ghost-entry-gate-template.md`)
3. Verify: `grep "ENTRY GATE: APPROVED" evidence/PE-AI-CHAT-01/pre-execution-report.md`
4. If REJECTED: fix issues and resubmit

### Phase 4: Flow-by-Flow Evaluation
1. Execute one use case at a time
2. For each flow: evidence + commentary + result status
3. Log bugs immediately using bug-taxonomy
4. Maintain evidence-index.md
5. Write workflow-audit.log entries

### Phase 5: Sprint Closure
1. Write `post-sprint-report.md`
2. Write `enforcer-checklist.txt` (use observation template unless code was changed)
3. Write `cross-sign.md` (orchestrator implements, enforcer reviews)
4. **STOP** — wait for Ghost Exit Gate

### Phase 6: Ghost Exit Gate
1. Ghost agent reads all artifacts
2. Ghost agent appends `## Ghost Exit Gate` section (see `templates/ghost-exit-gate-template.md`)
3. Verify: `grep "EXIT GATE: CLEARED" evidence/PE-AI-CHAT-01/post-sprint-report.md`
4. If NOT CLEARED: fix issues and resubmit

### Phase 7: Commit
1. Stage evidence files: `git add evidence/PE-AI-CHAT-01/`
2. Commit: `COMMIT_ROLE=scribe COMMIT_SPRINT=PE-AI-CHAT-01 git commit -m "PE-AI-CHAT-01: AI Chat evaluation evidence"`
3. Update sprint status in sprints.json
4. All pre-commit gates must pass

---

## What You Must NOT Do

1. **Do NOT skip the Ghost Entry Gate** — no evaluation without ENTRY GATE: APPROVED
2. **Do NOT skip the Ghost Exit Gate** — no sprint closure without EXIT GATE: CLEARED
3. **Do NOT modify code** unless the operator explicitly authorizes remediation for specific bugs
4. **Do NOT accept a flow** based on green automation alone — evidence + commentary required
5. **Do NOT move to the next sprint** before the current sprint is fully closed (exit gate cleared, committed)
6. **Do NOT send SMS, make phone calls, or create VIN leads** without explicit operator approval per action
7. **Do NOT write enforcer-checklist.txt with RESULT: APPROVED** if any critical check actually failed
8. **Do NOT write cross-sign.md with verdict: approved** if the review found real issues
9. **Do NOT bypass pre-commit gates** for any reason
10. **Do NOT batch multiple sprints** — one at a time, always

---

## What Defines Completion

A Production Eval sprint is complete when:

- [ ] Sprint registered in sprints.json
- [ ] Pre-execution-report.md written with all required sections
- [ ] Ghost Entry Gate: APPROVED
- [ ] All planned flows executed with evidence + commentary
- [ ] Bug log maintained with severity, type, false-pass class
- [ ] Evidence index maps every artifact to sprint/usecase/AC
- [ ] Post-sprint-report.md written with confidence assessment
- [ ] Enforcer-checklist.txt with RESULT: APPROVED
- [ ] Cross-sign.md with verdict: approved (different reviewing role)
- [ ] Ghost Exit Gate: CLEARED
- [ ] Evidence committed through harness
- [ ] Sprint status updated in sprints.json

The **program** is complete when all 7 PE sprints are closed with Ghost Exit Gate CLEARED, and a final program-level recommendation (Go / No-Go / Continue) is documented.

---

## What To Present Before Execution

Before beginning the first sprint, present to the operator:
1. Which sprint you will execute (PE-AI-CHAT-01 recommended)
2. The scope (AI Chat / Main Dashboard only)
3. Your pre-execution report draft
4. Whether you need any irreversible action approvals
5. Whether remediation is authorized for this sprint

Wait for operator approval before proceeding.

---

## Sprint ID Pattern Note

The ghost-config.json sprint ID pattern (`^[PRGIEMDTL]-\d{3}$`) does not match PE-AI-CHAT-01 format. Two options:

**Option A (recommended):** Update ghost-config.json pattern to also accept `^PE-` prefixed IDs
**Option B:** Rename sprints to PE-001 through PE-007 (loses descriptive power)

The execution agent should confirm with the operator which approach to use, then apply it before registering the first sprint.

---

## Risks

| Risk | Mitigation |
|------|-----------|
| Ghost agent not available for entry/exit gate | Operator can manually write gate sections with their assessment |
| Eval sprint runs long and hits context compaction | Compact-safe files listed in manifest; resume protocol in master prompt section 13 |
| Remediation authorized mid-sprint | Switch to remediation enforcer checklist; declare code files in pre-exec update |
| Pre-commit gate failure on evidence-only commit | Verify COMMIT_ROLE=scribe is allowed; check Gate 5 file scope includes evidence/ |
| Evidence volume overwhelms evidence directory | Maintain evidence-index.md; keep screenshots descriptively named |

---

## File Manifest

```
production-evals/
├── harness-gap-analysis.md          — Why each change was made
├── handoff-brief.md                 — THIS FILE
├── claude-code-master-prompt.md     — Adapted operating instructions
├── production-evals.json            — Adapted eval registry (7 sprints)
├── production-evals-manifest.json   — Pack manifest (v2.0-harness-native)
├── production-evals-brief.md        — Why this model exists
├── first-wave-eval-sprints.md       — Sprint order recommendation
├── sprint-template.json             — Harness-native sprint entry template
├── sprint-template.md               — Full working template (all artifacts)
├── sprint-template.yaml             — YAML variant
├── bug-taxonomy.md                  — Bug classification guide
├── bug-taxonomy.yaml                — Machine-usable bug taxonomy
├── evidence-rubric.md               — Evidence standard guide
├── evidence-rubric.yaml             — Machine-usable evidence rubric
└── templates/
    ├── enforcer-checklist-observation.txt  — For observation-only sprints
    ├── enforcer-checklist-remediation.txt  — For remediation sprints
    ├── cross-sign-template.md             — Role-separated review template
    ├── ghost-entry-gate-template.md       — Format ghost appends to pre-exec
    └── ghost-exit-gate-template.md        — Format ghost appends to post-sprint
```
