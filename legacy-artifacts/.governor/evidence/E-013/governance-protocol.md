# Governance Protocol — SEC Sprint Execution
**Date:** 2026-03-26
**Source:** sprint-gate-checklist.md from Nexxus_workbench + operator corrections

## Per-Sprint Workflow (MANDATORY — NO EXCEPTIONS)

### Phase 1: Pre-Execution (Captain writes, Ghost gates)

1. **Captain writes `evidence/SEC-{N}/pre-execution-report.md`:**
   - Objective
   - Declared files (exact paths)
   - AC list (from acceptance_criteria.md)
   - Issues to fix (from issues.md with IDs)
   - Test plan (exact npx playwright commands)
   - UI changes (if any)
   - Diff reference (from attempt-1 patch — what changed last time)

2. **Ghost agent runs Entry Gate (A1-A10):**
   - A1: Previous sprint exit gate cleared
   - A2: Worktree clean (no app files dirty)
   - A3: Session state references this sprint
   - A4: Pre-exec file exists
   - A5: Objective present
   - A6: Test plan with specific commands
   - A7: Declared files listed
   - A8: Declared files match sprints.json
   - A9: UI permissions checked
   - A10: Ghost messages clear
   - Writes **ENTRY GATE: APPROVED** or **REJECTED** into pre-exec file

3. **Dev agent checks:** `grep "ENTRY GATE: APPROVED" evidence/SEC-{N}/pre-execution-report.md`
   - If not found: **STOP. Cannot proceed.**

### Phase 2: Execution (Dev works, logs everything)

4. **Dev agent executes within declared scope only**
5. **Every action logged to `evidence/SEC-{N}/workflow-audit.log`** with timestamps:
   - `[timestamp] agent-launch | role=X | task="..." | scope=file1,file2`
   - `[timestamp] file-edit | file=X | lines=Y-Z | change="description"`
   - `[timestamp] build-check | result=PASS/FAIL`
   - `[timestamp] test-run | command="npx ..." | result="N passed, M failed"`

### Phase 3: Post-Sprint (Dev writes, Ghost gates)

6. **Dev writes `evidence/SEC-{N}/post-sprint-report.md`:**
   - AC Results table (every AC with PASS/FAIL and evidence)
   - Test Execution section (actual npx playwright output — not "verified via API")
   - Files Modified (with line references)
   - Diff vs attempt-1 (what changed compared to previous ungoverned attempt)

7. **Ghost agent runs Exit Gate (B1-B11):**
   - B1: Commit exists with correct sprint ID
   - B2: Entry gate was approved
   - B3: Test file exists
   - B4: Test execution proof (actual test runner output)
   - B5: Cross-tests documented
   - B6: AC results — every AC accounted for
   - B7: Failures escalated (not silently committed)
   - B8: Visual inspection needed?
   - B9: Worktree clean
   - B10: Ghost messages clear
   - B11: Watchdog clean
   - Writes **EXIT GATE: CLEARED** or **NOT CLEARED** into post-sprint file

8. **Cross-sign:** `evidence/SEC-{N}/cross-sign.md` — dev and ghost sign off
9. **Enforcer checklist:** `evidence/SEC-{N}/enforcer-checklist.txt` — EF-01 through EF-19

### Phase 4: Diff Gate (NEW — added per operator directive)

10. **Diff vs previous attempt** included in post-sprint report:
    - `git diff sec-attempt-1-diff.patch <current changes>` or equivalent
    - Shows what changed between ungoverned attempt and governed attempt
    - Operator can see exactly what is different this time

## Shared Activity Log

All agents write to: `.governor/logs/sprint-activity.log`

Format:
```
[YYYY-MM-DDTHH:MM:SSZ] [ROLE] [SPRINT] [ACTION] detail
```

Examples:
```
[2026-03-26T16:30:00Z] [captain] [SEC-03] [pre-exec-written] evidence/SEC-03/pre-execution-report.md
[2026-03-26T16:31:00Z] [ghost] [SEC-03] [entry-gate] A1:SKIP A2:PASS ... ENTRY GATE: APPROVED
[2026-03-26T16:32:00Z] [dev] [SEC-03] [file-edit] client/src/pages/sales.tsx:591-603 replaced hardcoded activity feed
[2026-03-26T16:35:00Z] [dev] [SEC-03] [build-check] tsc --noEmit PASS
[2026-03-26T16:36:00Z] [dev] [SEC-03] [test-run] npx playwright test s3-sales.spec.ts — 16 passed
[2026-03-26T16:37:00Z] [ghost] [SEC-03] [exit-gate] B1:PASS B2:PASS ... EXIT GATE: CLEARED
```

## Rules

1. No sprint starts without Ghost ENTRY GATE: APPROVED
2. No sprint commits without Ghost EXIT GATE: CLEARED
3. Every file edit logged with timestamp
4. Test execution must show actual npx output, not "verified"
5. Captain cannot approve their own work — Ghost is independent
6. If Ghost rejects, Dev goes back. No appeals to Captain.
7. Diff vs attempt-1 is mandatory for this round
