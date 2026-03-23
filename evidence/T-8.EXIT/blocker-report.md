# BLOCKER: Pre-Commit Hook Blocks Evidence-Only Commit

**Sprint:** T-8.EXIT
**Date:** 2026-03-23
**Type:** Governance infrastructure blocker

## Context

Phase 8 work is complete. All 6 sprints executed, evidence written, findings documented. No application code was modified -- only evidence markdown files and database content (agent instructions via API).

## Blocker

The pre-commit hook (Gate 6 / EF-01) requires `npx tsc --noEmit` to pass. The codebase has 50+ pre-existing TypeScript errors in files that Phase 8 did not touch:

- `client/src/App.tsx` — route component type mismatch
- `client/src/components/AgentConfigPane.tsx` — 12 type errors (Date vs string, missing properties)
- `client/src/components/layout/TopBar.tsx` — missing 'slug' property
- `client/src/pages/insights.tsx` — implicit any parameter
- `server/routes.ts` — 20+ string vs string[] type errors, null assignment issues
- And many more

These errors existed before Phase 8 and are unrelated to any Phase 8 work.

## Impact

Cannot commit 18 evidence markdown files (pre-execution reports, post-sprint reports, cross-signs) because TypeScript compilation fails on pre-existing errors in application code.

## Options

1. **Fix all TypeScript errors** — Large scope change (50+ errors across many files), out of scope for Phase 8, requires its own sprint.
2. **Owner bypasses hook for this commit** — `git commit --no-verify` for evidence-only commits.
3. **Modify pre-commit hook** — Skip EF-01 (TypeScript) for evidence-only commits (all staged files are `evidence/**/*.md`).
4. **Accept evidence as-is without commit** — Evidence exists in the worktree but is not committed to git.

## Recommendation

Option 3 is the cleanest long-term fix. Evidence-only commits should not require application code to compile. However, modifying the pre-commit hook is outside this agent's scope.

Option 2 is the pragmatic short-term fix. The owner can verify the staged files are all evidence markdown, then bypass the hook.

## Files Ready to Commit

All 18 files are evidence markdown:
```
evidence/E-8.0/post-sprint-report.md
evidence/G-8.3/{pre-execution-report,post-sprint-report,cross-sign}.md
evidence/G-8.4/{pre-execution-report,post-sprint-report,cross-sign}.md
evidence/T-8.EXIT/{pre-execution-report,post-sprint-report}.md
evidence/V-8.1/{pre-execution-report,post-sprint-report,cross-sign}.md
evidence/V-8.2/{pre-execution-report,post-sprint-report,cross-sign}.md
evidence/V-8.5/{pre-execution-report,post-sprint-report,cross-sign}.md
```

Zero application code files staged.
