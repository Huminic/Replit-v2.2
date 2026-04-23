# Parallel Team Execution Plan

## How It Works

Three Claude Code sessions running simultaneously. Each session
works in its own git worktree (isolated copy of the repo). Changes
don't affect each other until merged. You are the relay between
sessions and the merge approver.

## Git Setup (run once before starting)

```bash
cd /home/ubuntu/Claude-store/nexxus2.2_replit

# Create worktrees for each team
git worktree add ../nexxus-team-comms feature/team-comms
git worktree add ../nexxus-team-integrations feature/team-integrations
git worktree add ../nexxus-team-frontend feature/team-frontend

# Each team session opens in its worktree directory:
# Team Comms:        cd /home/ubuntu/Claude-store/nexxus-team-comms
# Team Integrations: cd /home/ubuntu/Claude-store/nexxus-team-integrations
# Team Frontend:     cd /home/ubuntu/Claude-store/nexxus-team-frontend
```

## Team Assignments

### Team Comms (Session 1)
**Directory:** /home/ubuntu/Claude-store/nexxus-team-comms
**Branch:** feature/team-comms
**Phases:** 3 (Communications), 6 (Campaigns)
**Files owned:**
- server/routes/sms.ts
- server/routes/campaigns.ts
- server/routes/conversations.ts
- server/outbound.ts
- server/routes/webhooks.ts (email notification function only)
- tests/e2e/domain-04-campaigns.spec.ts
- tests/e2e/domain-05-teambox.spec.ts
- tests/e2e/live-comms.spec.ts

**Startup prompt:**
```
You are Team Comms. Read .claude/agents/team-comms.md for your brief.
Read plan/03-communications.md for your sprints. Start with sprint
I-3.1 and work through in order. Follow the governance harness.
You work in a worktree — commit to your feature branch. Do not
merge to local-dev. The owner handles merges.
```

### Team Integrations (Session 2)
**Directory:** /home/ubuntu/Claude-store/nexxus-team-integrations
**Branch:** feature/team-integrations
**Phases:** 2 (Data/Sync), 4 (Voice/Video), 11 (Insights)
**Files owned:**
- server/routes/webhooks.ts (VAPI/Tavus handlers only)
- server/sync.ts
- server/vendorProxy.ts
- server/routes/integrations.ts
- server/routes/insights.ts
- tests/e2e/domain-11-integrations.spec.ts
- tests/e2e/real-integrations.spec.ts
- tests/e2e/deep-coverage.spec.ts

**Startup prompt:**
```
You are Team Integrations. Read .claude/agents/team-integrations.md
for your brief. Read plan/04-voice-video.md and plan/02-data-sync.md
for your sprints. Note: Phase 4 is BLOCKED until Phase 3
(Communications) is merged. Start with Phase 2 sprints (data/sync).
Follow the governance harness. Commit to your feature branch only.
```

### Team Frontend (Session 3)
**Directory:** /home/ubuntu/Claude-store/nexxus-team-frontend
**Branch:** feature/team-frontend
**Phases:** 5 (TeamBox verify), 8 (AI Chat verify), 10 (Dept Pages), 12 (Widgets)
**Files owned:**
- client/src/pages/*.tsx (all page files)
- client/src/components/ (if exists)
- server/routes/public.ts (widget endpoints only)
- tests/e2e/domain-01 through domain-09
- tests/e2e/usability-audit.spec.ts
- tests/e2e/visual-components.spec.ts

**Startup prompt:**
```
You are Team Frontend. Read .claude/agents/team-frontend.md for
your brief. Read plan/10-department-pages.md and plan/08-ai-chat-agents.md
for your sprints. Remember the Golden Rule: change the data source,
not the UI. Start with verification sprints for pages that should
already work. Follow the governance harness. Commit to your feature
branch only.
```

## Your Role (Owner/Relay)

1. **Start all three sessions** from their worktree directories
2. **Paste the startup prompt** into each session
3. **Monitor progress:**
   - Switch between terminal tabs
   - Run /ghost-check from the main workbench periodically
   - Check each team's evidence/ directory for sprint artifacts
4. **Handle dependencies:**
   - When Team Comms finishes Phase 3, merge to local-dev:
     ```bash
     cd /home/ubuntu/Claude-store/nexxus2.2_replit
     git merge feature/team-comms
     ```
   - Then tell Team Integrations: "Phase 3 is merged. Start Phase 4."
5. **Review dry-runs:**
   - Team Integrations will stop for VIN/VAPI dry-run approval
   - Read the dry-run report, approve or reject
6. **Resolve conflicts:**
   - If two teams modified the same file (shouldn't happen with
     file scoping but just in case), resolve during merge

## What Can Run In Parallel

```
TIME →

Team Comms:         I-3.1 → I-3.2 → I-3.3 → I-3.4 → I-3.5 → I-3.6
Team Integrations:  Phase 2 sprints (data/sync) ────────────────────→ Phase 4 (after merge)
Team Frontend:      Verification sprints (pages, chat, teambox) ────→ Phase 10 fixes
```

Team Comms and Team Frontend can run fully in parallel — they don't
share files. Team Integrations can do Phase 2 (data/sync) in parallel
with both, but Phase 4 (voice/video) is blocked until Phase 3 merges
because voice webhooks depend on the CommGate fix.

## Merge Order

1. Team Comms (Phase 3) → merge to local-dev first
2. Team Frontend (verification sprints) → merge second
3. Team Integrations (Phase 2) → merge third
4. Team Integrations (Phase 4) → merge after Phase 3 is in local-dev
5. Continue with remaining phases

## When To Stop and Sync

After each team finishes their first batch of sprints:
1. All three merge to local-dev
2. Run full test suite from local-dev
3. Run /ghost-check from workbench
4. Fix any merge conflicts or integration issues
5. Continue with next batch

## File Scope Enforcement

The pre-commit hook (Gate 5) checks staged files against COMMIT_ROLE.
Each team uses a different role:
- Team Comms: COMMIT_ROLE=backend
- Team Integrations: COMMIT_ROLE=integration
- Team Frontend: COMMIT_ROLE=frontend

check-file-scope.sh needs updating to recognize these roles and
their file boundaries. This is a one-time setup sprint.

## Ghost Oversight

From the workbench session (this one), you can scan any worktree:
```bash
cd /home/ubuntu/Claude-store/nexxus-team-comms && ../nexxus2.2_replit/scripts/watchdog.sh scan
cd /home/ubuntu/Claude-store/nexxus-team-integrations && ../nexxus2.2_replit/scripts/watchdog.sh scan
cd /home/ubuntu/Claude-store/nexxus-team-frontend && ../nexxus2.2_replit/scripts/watchdog.sh scan
```

Or run /ghost-check from the workbench pointed at each team's directory.
