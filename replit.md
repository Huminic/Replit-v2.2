# Nexxus Connect v3.0 — AI-Powered Dealership Platform

## User Preferences

- Communication style: Simple, everyday language
- Work mode: Sprint-based with JSON sprint files
- Delegation: Orchestrate from main agent, delegate all implementation to subagents
- Review: Pre-sprint scan + post-sprint AC verification (both via architect subagent)

## Orchestration Protocol

> **RULE: The main agent is the orchestrator. Never implement features directly. Delegate ALL coding work to subagents.**

### Sprint Lifecycle

```
1. PRE-SPRINT GATE (verification script + architect subagent)
   → Run: node .local/scripts/verify-sprint.cjs pre sprint-N
   → Must exit 0 (GO) before any work starts
   → If BLOCKED: resolve blockers first, re-run until GO
   → Architect scans worktree for drift, broken imports, stale files

2. TASK EXECUTION (implementation subagents)
   → Orchestrator reads sprint JSON, launches subagents per task
   → Independent tasks run in parallel via startAsyncSubagent
   → Dependent tasks run sequentially via subagent
   → Orchestrator monitors, does NOT write code

3. POST-SPRINT GATE (verification script + architect subagent)
   → Architect reviews code, updates sprint JSON AC pass/fail values
   → Run: node .local/scripts/verify-sprint.cjs post sprint-N
   → Must exit 0 (PASSED) before sprint is considered done
   → If FAILED: fix issues, re-run until PASSED
```

### Verification Script

```bash
# Full dashboard of all sprints
node .local/scripts/verify-sprint.cjs status

# Pre-sprint gate — checks blockers, prerequisites, file existence, replit.md
node .local/scripts/verify-sprint.cjs pre sprint-4

# Post-sprint gate — checks all tasks DONE, all AC evaluated + passed, files exist
node .local/scripts/verify-sprint.cjs post sprint-4
```

The script enforces:
- Prerequisite sprints must be COMPLETED before starting
- Blockers in sprint JSON prevent GO
- All tasks must be DONE status
- All acceptance criteria must have pass: true (not null, not false)
- All referenced files must exist in the worktree

### How to Run a Sprint

```javascript
// 0. Run pre-sprint gate (must pass before anything else)
// bash: node .local/scripts/verify-sprint.cjs pre sprint-4

// 1. Architect scans for worktree issues
const scan = await architect({
  task: "PRE-SPRINT SCAN for sprint-4. Read .local/sprints/sprint-4.json. Check worktree for broken imports, stale state. Verify replit.md memory is current.",
  relevantFiles: [".local/sprints/sprint-4.json", "replit.md"],
  responsibility: "evaluate_task"
});
console.log(scan.result);

// 2. Launch tasks (parallel if independent)
await startAsyncSubagent({ task: "T009", fromPlan: true, relevantFiles: [...] });
await startAsyncSubagent({ task: "T010", fromPlan: true, relevantFiles: [...] });

// 3. Architect reviews and updates sprint JSON AC values
const review = await architect({
  task: "POST-SPRINT REVIEW for sprint-4. Read .local/sprints/sprint-4.json. Verify each AC. Update the JSON with pass/fail.",
  relevantFiles: [".local/sprints/sprint-4.json", ...taskFiles],
  responsibility: "evaluate_task",
  includeGitDiff: true
});
console.log(review.result);

// 4. Run post-sprint gate (must pass before sprint is complete)
// bash: node .local/scripts/verify-sprint.cjs post sprint-4
```

### Sprint File Format

All sprint definitions live in `.local/sprints/sprint-{N}.json`:

```json
{
  "id": "sprint-N",
  "name": "Human-readable sprint name",
  "status": "PENDING | IN_PROGRESS | COMPLETED | FAILED",
  "goal": "One-sentence sprint goal",
  "blockers": ["optional list of blockers"],
  "tasks": [
    {
      "id": "T0XX",
      "name": "Task name",
      "status": "PENDING | IN_PROGRESS | DONE | FAILED",
      "blockedBy": ["T0XX"],
      "files": ["paths/to/modify"],
      "description": "Detailed task description"
    }
  ],
  "acceptanceCriteria": [
    { "id": "AC01", "text": "Criterion description", "pass": null }
  ]
}
```

## System Architecture

### Stack
- **Frontend**: React 18 + TypeScript + Vite, Wouter routing, TanStack Query, Tailwind CSS + Shadcn/ui
- **Backend**: Express + TypeScript, PostgreSQL via Drizzle ORM, JWT auth + bcrypt, Anthropic SDK (Claude)
- **External**: TextMagic (SMS), Resend (email), VAPI (voice), Tavus (video), VinSolutions (CRM), fal.ai (image/video/audio), OpenAI (GPT-4o), Google Maps (pending)

### Environment Variables
- `DATABASE_URL`, `AI_INTEGRATIONS_ANTHROPIC_*` — DB + AI chat
- `TEXTMAGIC_*`, `RESEND_API_KEY` — comms
- `VAPI_PRIVATE_KEY`, `TAVUS_API_KEY` — voice/video
- `VINSOLUTIONS_*` — CRM
- `FAL_KEY` — fal.ai image/video/audio generation
- `OPENAI_API_KEY` — GPT-4o for copywriting + image scoring
- `FLEXPRICE_API_KEY` — billing/metering via FlexPrice
- `GOOGLE_MAPS_API_KEY` — competitor radar (Market Intel agent) — PENDING
- `APP_BASE_URL` — dev: release-1r.huminic.app, prod: live.huminic.app
- `OUTBOUND_LIVE_ENABLED` — master kill switch for all outbound comms (keep `false` during dev)

### Auth Credentials (dev/test)
- duane.wells@huminic.ai / a1$ucc3ss (super_admin)
- partner_admin@huminic.ai / P@rtner$uccess
- org_admin@huminic.ai / O3g$uccess
- sales_staff@huminic.ai / S@les$uccess
- marketing_staff@huminic.ai / M@3keting$uccess
- executive_staff@huminic.ai / Ex3c$uccess

### Multi-Store
5 stores with data isolation: Serra Honda, Serra Nissan, Tony Serra Ford, Hyundai of Columbia, Ford of Columbia. Each has Tavus persona linked.

## Key Files

### Core
- `server/routes.ts` — All API routes incl. proxy endpoints
- `server/seed.ts` — seedHuminicUsers with upsert/password-refresh
- `shared/schema.ts` — Drizzle schema
- `client/src/App.tsx` — Route definitions

### Marketing Agents (Active Feature)
- `client/src/lib/marketing-agents.ts` — 5 agent defs, artifact types, localStorage helpers
- `client/src/lib/tool-executor.ts` — Tool execution: fal.ai + OpenAI, AdCopyData + ScoreCardData + CompetitorRadarData types
- `client/src/components/marketing/AgentChatView.tsx` — Agent chat UI: InlineAdCopy, InlineScoreCard, InlineCompetitorRadar, StarRating, visor, cross-agent chip routing, artifactRef handoff
- `client/src/components/marketing/StudioGallery.tsx` — Studio Gallery: artifact browser with type/agent filter pills, cards with download/resume/send-to-agent/share
- `client/src/components/marketing/SharingPanel.tsx` — Share artifacts: copy link, download, social preview card with Nexxus Connect branding
- `client/src/pages/marketing.tsx` — Marketing page with agent launcher grid + tab navigation + Studio Gallery + artifactRef URL param
- `client/src/components/AgentConfigPane.tsx` — Right pane: Artifacts tab (default on marketing) + Configuration tab

### Layout
- `client/src/components/layout/AppLayout.tsx` — Main layout with right pane
- `client/src/components/layout/Sidebar.tsx` — Left navigation (72px)
- `client/src/components/layout/SubMenuManager.tsx` — Flyout submenu with AI Agents section
- `client/src/components/layout/TopBar.tsx` — Top navigation bar

### Billing (Sprint-E)
- `server/services/billingService.ts` — FlexPrice API wrapper with caching
- `server/routes/billing.ts` — 7 billing API endpoints
- `server/middleware/entitlementCheck.ts` — Feature gating middleware
- `client/src/pages/BillingDashboard.tsx` — Billing overview
- `client/src/pages/BillingUsage.tsx` — Usage analytics
- `client/src/pages/BillingPlan.tsx` — Plan comparison
- `client/src/pages/BillingInvoices.tsx` — Invoice history
- `client/src/components/EntitlementGate.tsx` — Feature gate UI component
- `client/src/components/CreditBalanceIndicator.tsx` — Sidebar credit display

### Lead Automation (Sprint-D)
- Follow-up engine in `server/index.ts` — Multi-step SMS→Phone→Email sequences
- `followupStep` + `leadScore` columns on `warehouseLeads`
- Claude transcript analysis for lead scoring and appointment detection
- Business hours awareness + conversion-based queue removal

### Other Features
- `client/src/pages/main.tsx` — Home page AI chat
- `client/src/pages/widget-landing.tsx` — Public widget landing + video mode
- `public/dealer-handoff/` — Dealer.com integration

### Launch Readiness Documents
- `.local/launch-checklist.md` — Master 265-item checklist (188 feature items + 77 audit items) with statuses
- `.local/launch-audit-results.md` — 77-issue deep code audit (11 layers, 15 CRITICAL)

## Sprint Progress

### Phase 1: Marketing Agents (Sprints 0–11) — ALL COMPLETED
Sprints 0–11 built and validated the 5 Marketing AI Agents (Photo Studio, Video Producer, Copywriter, Creative Director, Market Intel), cross-agent workflows, Studio Gallery, and sharing. Sprint JSON files archived (no longer in `.local/sprints/`).

### Phase 2: Platform Hardening (Sprints A–E) — ALL COMPLETED

| Sprint | Name | Status |
|--------|------|--------|
| A | Knowledge & Upload Improvements | COMPLETED |
| B | Compliance & Communication Gaps | COMPLETED |
| C | Metrics & Reporting | COMPLETED |
| D | Lead Automation & Calendar | COMPLETED |
| E | Billing (FlexPrice) | COMPLETED |

### Phase 3: Launch Readiness — PLANNING
Remaining sprints (F+) to be organized from the consolidated 265-item launch checklist and 77-issue code audit. Covers security hardening, outbound safety, data integrity, frontend cleanup, production readiness, testing, and onboarding.

Sprint definitions: `.local/sprints/sprint-{X}.json`

## Seed Script Behavior
- `seedHuminicUsers` only creates accounts that don't exist; does NOT overwrite passwords on restart
- Other seed functions check for existing data before inserting

## Testing

### Test Batteries (Manual/Agent QA)
- `attached_assets/master_test_coordinator_v2_1772919344976.md` — Master orchestrator (B1-B7 sequence)
- `attached_assets/battery_01_agent_config_v2_1772919344976.md` through `battery_06_e2e_final_v2_1772919344976.md` — Core platform tests
- `attached_assets/battery_07_marketing_agents_v1.md` — Marketing Agents battery (5 agents, tools, Studio Gallery, cross-agent, sharing)

### Observability Tests
- `tests/observability/` — Vitest stubs for marketing agents, departments, TeamBox, widgets, top bar, main page, my-work
- `tests/validation/USER_STORIES_AND_AC.md` — Marketing AI Agents acceptance criteria
