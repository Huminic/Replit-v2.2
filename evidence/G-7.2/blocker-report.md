# Blocker Report: G-7.2 Commit Blocked by Pre-Existing TypeScript Errors

**Sprint:** G-7.2 (also affects G-7.4)
**Date:** 2026-03-23
**Type:** Governance blocker

## Problem

The pre-commit hook requires the enforcer checklist to show `RESULT: APPROVED`. The enforcer checklist runs `npx tsc --noEmit` which fails due to pre-existing TypeScript errors in frontend files:

- `client/src/App.tsx` — RouteComponentProps type mismatch
- `client/src/components/AgentConfigPane.tsx` — 9 errors (Date types, missing properties)
- `client/src/pages/insights.tsx` — 10 errors (implicit any, missing properties)
- `client/src/components/layout/TopBar.tsx` — missing 'slug' property
- `server/comms-test.ts` — Set iteration (target/downlevelIteration)
- `server/index.ts` — textmagicPhone property
- `server/replit_integrations/batch/utils.ts` — AbortError property

None of these errors are introduced by Phase 7 changes. They are all pre-existing.

## Constraint

UI Protection rule in CLAUDE.md prohibits modifying frontend files without owner approval. The server-side errors are in files outside Phase 7 scope (comms-test.ts, replit_integrations/).

## Evidence

Previous sprint I-3.5 passed the enforcer checklist with `RESULT: APPROVED` (15 PASS, 0 FAIL). These TypeScript errors were introduced between I-3.5 and now by other sprints or parallel work.

## Work Completed (Uncommitted)

All code changes and governance artifacts are complete and staged:

1. **E-7.0** — Entry inspection report (Phase 3+4 SOLID, no blockers)
2. **V-7.1** — Trigger infrastructure verified (scheduler, JSONB, scheduledActions, 2 trigger types, 3 channels)
3. **G-7.2** — Trigger Configuration API (GET/PATCH /api/agents/:id/triggers) with validation
4. **G-7.3** — Documented as BLOCKED (requires owner UI approval)
5. **G-7.4** — After-hours auto-response template (business hours detection, configurable template, conversation tagging)

## Options

1. **Fix pre-existing TS errors** — Requires modifying frontend files (UI Protection) and server files outside Phase 7 scope. Needs owner approval.
2. **Modify enforcer checklist** — Change EF-01 to WARN instead of FAIL for pre-existing errors. Governance says "Do not bypass, weaken, or create carve-outs."
3. **Owner override** — Owner explicitly approves commit with acknowledged pre-existing failures.

## Recommendation

Option 1 is most correct. The TS errors should be fixed as a prerequisite sprint (possibly a remediation sprint for frontend TS issues). The Phase 7 code changes are ready and waiting.
