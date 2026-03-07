# Rollback Plan

**Purpose:** Restore the codebase to the clean pre-audit baseline (commit `58288b6`).
**User Decision:** GAPS.md, GUARDRAILS.md, MEMORY.md → DELETE entirely.

---

## Rollback Steps (Execution Order)

### Step 1: Revert shared/schema.ts
- Remove `systemPrompt` and `createdBy` columns from agents table (lines 64-65)
- Method: Restore file content from commit `58288b6`

### Step 2: Revert PLAN.md
- Restore Wave-based structure (v3.1) from commit `58288b6`
- This undoes the Sprint-based rewrite and all status changes (S02-S04 marked COMPLETE)

### Step 3: Revert replit.md
- Restore 156-line version (v3.0) from commit `58288b6`
- This undoes the 59-line rewrite

### Step 4: Revert .agent_docs/codebase-index.md
- Restore original version from commit `58288b6`
- This undoes governance section rewrite, archive section additions

### Step 5: Restore archived files to original locations
- `archive/CLAUDE_v2.2.md.archive` → `CLAUDE.md`
- `archive/SPEC_v2.2.md.archive` → `SPEC.md`
- `archive/Sprint_log.md.archive` → `Sprint_log.md`
- `archive/ACCEPTANCE_CRITERIA_wave1_visual_only.md.archive` → `ACCEPTANCE_CRITERIA.md`
- `archive/COMMENT_INDEX.md.archive` → `COMMENT_INDEX.md`
- `archive/acceptance_criteria_audit.md.archive` → `acceptance_criteria_audit.md`
- `archive/operational-context.md.archive` → `.agent_docs/rules/operational-context.md`

### Step 6: Delete files created during contaminated session
- Delete `GAPS.md`
- Delete `GUARDRAILS.md`
- Delete `MEMORY.md`

### Step 7: Remove archive/ directory
- After all files restored, remove the now-empty archive/ directory

### Step 8: Verify database state
- Check if systemPrompt/createdBy columns exist in live DB
- If yes, drop them via ALTER TABLE

### Step 9: Verify rollback
- Compare file tree against `git ls-tree 58288b6`
- Diff each reverted file against baseline commit
- Confirm zero meaningful diff (excluding attached_assets)

---

## Verification Criteria
- `git diff 58288b6 -- shared/schema.ts` → no diff
- `git diff 58288b6 -- PLAN.md` → no diff
- `git diff 58288b6 -- replit.md` → no diff
- `git diff 58288b6 -- .agent_docs/codebase-index.md` → no diff
- `git diff 58288b6 -- CLAUDE.md` → no diff
- `git diff 58288b6 -- SPEC.md` → no diff
- `git diff 58288b6 -- Sprint_log.md` → no diff
- `git diff 58288b6 -- ACCEPTANCE_CRITERIA.md` → no diff
- `git diff 58288b6 -- COMMENT_INDEX.md` → no diff
- `git diff 58288b6 -- acceptance_criteria_audit.md` → no diff
- `git diff 58288b6 -- .agent_docs/rules/operational-context.md` → no diff
- GAPS.md, GUARDRAILS.md, MEMORY.md do not exist
- archive/ directory does not exist
