# T-5.EXIT — Phase 5 Exit Inspection
**Timestamp:** 2026-03-23T12:50:00Z
**Sprint:** T-5.EXIT
**Phase:** 5 — TeamBox & Conversations

---

## Sprint Status Check

| Sprint | Status | Result |
|--------|--------|--------|
| E-5.0 | in_progress | Entry inspection complete, report written |
| V-5.1 | planned | PASS -- Conversations load, filter, org-scoped |
| V-5.2 | planned | PASS -- Message threads chronological, reply works |
| V-5.3 | planned | FAIL -- Takeover button sends wrong payload |
| V-5.4 | planned | CANNOT VERIFY -- Assignment UI does not exist |
| T-5.EXIT | planned | This report |

**Note:** Sprints could not be committed in worktree due to TypeScript compilation errors (pre-existing in worktree branch). Evidence written to main repo's evidence/ directory.

## Acceptance Criteria

| Criterion | Result | Notes |
|-----------|--------|-------|
| Conversations load, filtered by channel and status | PASS | 66 conversations, all org-scoped, filtering works |
| Message threads are complete and chronological | PASS | Multiple conversations verified via API |
| Takeover button works (tied to Phase 3 fix) | FAIL | Button visible but sends { status: 'open' } not { assignedTo: userId } |
| Conversation assignment works | FAIL | No assignment UI exists |

## Issues Found

### CRITICAL: Takeover payload bug (F-1)
- teambox.tsx line 275: `takeOverMutation` sends `{ status: 'open' }`
- Must send `{ assignedTo: currentUserId }` to actually pause AI
- Backend logic (sms.ts line 353) checks `assignedTo` -- correct
- I-3.3 fixed race condition but UI was never updated
- I-091 should remain REMEDIATING

### BLOCKER: No assignment UI (F-3)
- V-5.4 must be reclassified to I-5.4
- Backend API supports it, UI does not exist
- Requires owner approval to build (UI Protection)

### MINOR: Channel filter gaps (F-4)
- `ai-chat` and `agent-chat-*` channels not in filter list

### MINOR: Message preview only for selected conversation (F-5)

### MINOR: No "Release Takeover" mechanism (F-7)

## Worktree Issues

This phase was executed in worktree agent-abe8a8b9 which is 147 commits behind local-dev. The worktree has pre-existing TypeScript errors that block Gate 6 of the pre-commit hook. MCP Playwright browser was also locked. All verification was done via API (curl) and code review.

**Recommendation for future phases:** Do not use worktrees created from origin/main. Create from local-dev HEAD.

## Verdict

**Phase 5 is NOT SOLID.**

Two acceptance criteria fail:
1. Takeover button sends wrong payload (fixable -- low-complexity I- sprint)
2. Assignment UI does not exist (requires I- sprint + UI approval)

**Phase 5 requires:**
- I-5.3: Fix takeover payload to include `assignedTo: currentUserId` (UI change, needs approval)
- I-5.4: Build conversation assignment UI (UI change, needs approval)
- Re-run V-5.3 and V-5.4 after fixes
- Then re-run T-5.EXIT for final SOLID verdict
