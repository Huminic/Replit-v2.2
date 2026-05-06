# Wave Bookend Template

Use this template for every wave. Save as `evidence/<wave-id>/wave-bookend.md`. Lead writes OPENING before autonomy starts. Lead writes CLOSING after gate-clean, before next-wave readiness call.

---

## OPENING (operator approves before autonomous execution)

**Wave:** &lt;id&gt;
**Phase:** &lt;#&gt;: &lt;name&gt;
**Date opened:** YYYY-MM-DD
**Goal (plain English, 1 sentence):**
**Why necessary for v2.2 release (1 sentence):**

### Existing evidence to reuse

- `&lt;path&gt;` — what it proves

### Current status of this component

PROVEN | PARTIAL | UNKNOWN | BROKEN | DEFERRED — short justification

### In scope (file list)

### Out of scope (file list — explicit)

### Known defects this wave addresses (issue ID + file:line)

### Operator decisions required BEFORE autonomy starts

- D-&lt;id&gt;: question / recommendation / blocks?

### Credentials / accounts / allowlists required

### Provider-send approvals required (Resend / TextMagic / VAPI / Tavus / SignalWire / Lago)

### UI scope markers required (one per UI file)

### Files likely touched (full list)

### Git branch / worktree strategy

### Agent-team roster (collaborator teammates)

### Isolated audit subagents (gate-only, no team mailbox)

### Stop conditions (each one explicit)

### Chunk list (commit-worthy units)

- Chunk N: name / files / proof at chunk level

### Proof required (chunk / wave levels)

### Expected evidence path

---

## CLOSING (lead writes after gate-clean)

### Changed files (final)

### Commits (SHA + message)

### Tests run

- chunk-level results
- wave-level results

### Dual-delta proof

- Delta 1 (test/runnable):
- Delta 2 (independent observation):

### Playwright / eval evidence (paths)

### Provider proof (if relevant; receipts / dashboard screenshots)

### Auditor verdicts

- scope-guardian: PASS / FAIL  (path)
- code-reviewer:  APPROVE / DEFICIENCY  (path)
- integration-safety: PASS / FAIL  (path)
- qa-evaluator:   PASS / FAIL  (path)

### Accepted debt created (issues.md row IDs)

### Issues / backlog updates

### Rollback notes

### Merge recommendation (target branch + exact git command)

### Next-wave readiness (yes/no + blockers)
