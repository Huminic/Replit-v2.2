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
1. PRE-SPRINT SCAN (architect subagent)
   → Read .local/sprints/{sprint-N}.json
   → Scan worktree for drift, broken imports, stale files
   → Verify memory in replit.md is current
   → Output: GO / BLOCKED (with blockers list)

2. TASK EXECUTION (implementation subagents)
   → Orchestrator reads sprint JSON, launches subagents per task
   → Independent tasks run in parallel via startAsyncSubagent
   → Dependent tasks run sequentially via subagent
   → Orchestrator monitors, does NOT write code

3. POST-SPRINT REVIEW (architect subagent)
   → Read .local/sprints/{sprint-N}.json acceptanceCriteria
   → Verify each AC pass/fail against actual code + running app
   → Check for drift: accent colors, system prompts, suggestion chips
   → Update sprint JSON: set AC pass/fail values, set status to COMPLETED or FAILED
   → Output: AC report with pass/fail per criterion
```

### How to Run a Sprint

```javascript
// 1. Pre-sprint scan
const scan = await architect({
  task: "PRE-SPRINT SCAN for sprint-4. Read .local/sprints/sprint-4.json. Check worktree for broken imports, stale state, blockers. Verify replit.md memory is current. Report GO or BLOCKED.",
  relevantFiles: [".local/sprints/sprint-4.json", "replit.md"],
  responsibility: "evaluate_task"
});
console.log(scan.result);

// 2. Launch tasks (parallel if independent)
await startAsyncSubagent({ task: "T009", fromPlan: true, relevantFiles: [...] });
await startAsyncSubagent({ task: "T010", fromPlan: true, relevantFiles: [...] });

// 3. Post-sprint AC review
const review = await architect({
  task: "POST-SPRINT REVIEW for sprint-4. Read .local/sprints/sprint-4.json. Verify each acceptance criterion against actual code. Check for drift. Update the JSON with pass/fail results.",
  relevantFiles: [".local/sprints/sprint-4.json", ...taskFiles],
  responsibility: "evaluate_task",
  includeGitDiff: true
});
console.log(review.result);
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
- `GOOGLE_MAPS_API_KEY` — competitor radar (Market Intel agent) — PENDING
- `APP_BASE_URL` — dev: release-1r.huminic.app, prod: live.huminic.app

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
- `client/src/lib/tool-executor.ts` — Tool execution: fal.ai + OpenAI, AdCopyData + ScoreCardData types
- `client/src/components/marketing/AgentChatView.tsx` — Agent chat UI: InlineAdCopy, InlineScoreCard, animated components, visor, suggestion chips
- `client/src/pages/marketing.tsx` — Marketing page with agent launcher grid + tab navigation
- `client/src/components/AgentConfigPane.tsx` — Right pane: Artifacts tab (default on marketing) + Configuration tab

### Layout
- `client/src/components/layout/AppLayout.tsx` — Main layout with right pane
- `client/src/components/layout/Sidebar.tsx` — Left navigation (72px)
- `client/src/components/layout/SubMenuManager.tsx` — Flyout submenu with AI Agents section
- `client/src/components/layout/TopBar.tsx` — Top navigation bar

### Other Features
- `client/src/pages/main.tsx` — Home page AI chat
- `client/src/pages/widget-landing.tsx` — Public widget landing + video mode
- `public/dealer-handoff/` — Dealer.com integration

## Sprint Progress

| Sprint | Name | Status |
|--------|------|--------|
| 0 | Foundation — Proxy + Definitions | COMPLETED |
| 1 | Agent Launcher Grid + Chat UI | COMPLETED |
| 2 | Photo Studio + Video Producer | COMPLETED |
| 3 | Copywriter + Creative Director | COMPLETED |
| 4 | Market Intel + Studio Gallery | PENDING |
| 5 | Cross-agent Workflow + Sharing | PENDING |

Sprint details: `.local/sprints/sprint-{N}.json`

## Spec Reference
Full marketing agents spec: `attached_assets/Pasted-The-5-Marketing-Agents-Agent-Objective-Tools-It-Owns-Ph_1773177536244.txt`

## Agent Accent Colors (drift-check reference)
- Photo Studio: teal (#14b8a6)
- Video Producer: blue (#3b82f6)
- Copywriter: violet (#8b5cf6)
- Creative Director: amber (#f59e0b)
- Market Intel: green (#22c55e)
