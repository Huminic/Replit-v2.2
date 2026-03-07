# AGENT_CODING_PLAN.md — Operational Playbook for Code Changes

**Version:** 1.0
**Date:** 2026-03-07
**Authority:** This document governs how agents execute tasks. It does not define what to build — that is in PLAN.md.

---

## Section 1: Pre-Flight Checklist

Before writing any code, the agent MUST complete this checklist. Skipping any step invalidates all subsequent work (GUARDRAILS.md R11).

- [ ] Read `GAPS.md` — understand current gap state
- [ ] Read `GUARDRAILS.md` — understand all 16 rules, especially R16 (GATE:STOP)
- [ ] Read the current phase in `PLAN.md` Section 2 — identify assigned task(s)
- [ ] Read the AC traceability table in `PLAN.md` Section 1 — identify which ACs the task addresses
- [ ] Read the self-verification criteria for the task (rightmost column in the phase table)
- [ ] Read the relevant RISK_REGISTER.md items (Risk Reg # column in traceability table)
- [ ] State explicitly: "I am working on Phase S[X], Task S[X]-T[YY], addressing AC IDs: [list]"

---

## Section 2: Per-Task Workflow

Every task follows this exact sequence:

### Step 1: READ
- Read the task row in PLAN.md (description, files, blocked-by, ACs, complexity, self-verification)
- Confirm all blocked-by tasks are complete
- If any blocker is incomplete → STOP. Do not proceed.

### Step 2: IMPLEMENT
- Write code changes that address the task description
- Every code change must reference a GAPS.md ID, RISK_REGISTER.md item, or AC ID (GUARDRAILS.md R12)
- Follow forbidden patterns list (Section 3 below)
- Stay within the file scope for this phase (Section 5 below)

### Step 3: SELF-VERIFY
- Check every self-verification criterion from the task row
- For each criterion, produce evidence (log output, test result, code reference)
- If any criterion fails → fix it before proceeding to Step 4

### Step 4: DOCUMENT
- Update the AC traceability table in PLAN.md Section 1:
  - Change Status from NOT STARTED to PASS, FAIL, or PARTIAL
  - Add Notes explaining the evidence
- Fill in the Sprint Report (PLAN.md Section 3 template) for the completed task
- Log any new gaps discovered in GAPS.md as OPEN items

### Step 5: GATE:STOP (GUARDRAILS.md R16)
- **STOP all execution**
- Present to the user:
  1. Task ID and description completed
  2. AC IDs addressed with PASS/FAIL/PARTIAL for each
  3. Evidence summary for each AC
  4. Any new gaps discovered
  5. What the next task would be (but do NOT start it)
- **WAIT for explicit user approval**
- Do NOT proceed to the next task until the user says to continue

---

## Section 3: Forbidden Patterns

These patterns are prohibited in all code changes. Violations are grounds for reverting the change.

### FP-1: No Mock Data in Production Paths
```
FORBIDDEN: import { mockData } from '@/mocks/...'    (in any page component)
FORBIDDEN: const data = [{ hardcoded: 'values' }]    (in any page component for display data)
REQUIRED:  const { data } = useQuery({ queryKey: [...] })
```

### FP-2: No Silent Error Swallowing
```
FORBIDDEN: .catch(() => {})
FORBIDDEN: .catch(e => { /* ignore */ })
REQUIRED:  .catch(e => { console.error('Context:', e); throw e; })
   OR:     .catch(e => { logError(context, e); createEscalation(...); })
```

### FP-3: No In-Memory State for Persistent Data
```
FORBIDDEN: const activeExecutions = new Map()    (for data that must survive restart)
REQUIRED:  Store execution state in database table with status tracking
```

### FP-4: No False Completion Claims
```
FORBIDDEN: Marking a task PASS when self-verification criteria are not all met
FORBIDDEN: Marking a phase complete without completing all tasks
FORBIDDEN: Skipping GATE:STOP to batch-complete multiple tasks
```

### FP-5: No Scope Expansion
```
FORBIDDEN: Fixing bugs in files not listed in the task's "Files" column
FORBIDDEN: Adding features not in the current phase
FORBIDDEN: Modifying governance documents during execution mode (unless the task specifically calls for it)
```

### FP-6: No UI Layout Changes Without AC Reference
```
FORBIDDEN: Changing sidebar items, page layout, or navigation without referencing an AC-NAV-* criterion
REQUIRED:  All UI changes trace to an AC ID
```

---

## Section 4: RC-Blocking Task Sequence

These tasks must ALL pass for the Release Candidate to be declared. Listed in dependency order.

```
PHASE S2 (Schema)
  S2-T01: Resolve dual schema          → unblocks S3
  S2-T02: Add ON DELETE CASCADE        → unblocks S3
  S2-T03: Add indexes                  → unblocks S3
  S2-T04: Generate migration           → unblocks S3

PHASE S1 (Governance) — parallel with S2
  S1-T01: Archive stale docs           → unblocks S1-T03
  S1-T02: Remove nuisance files        → standalone
  S1-T03: Update CLAUDE.md hierarchy   → unblocks S3
  S1-T04: Resolve Artifacts scope      → standalone

PHASE S3 (RC Features) — requires S1+S2
  S3-T01: Wire VAPI                    → AC-02-A/B/C/D  → unblocks S3-T03, S6-T01
  S3-T02: Implement Tavus              → AC-04-B        → unblocks S3-T03
  S3-T03: Harden widget                → AC-04-A/C/D, AC-09-D → unblocks S3-T04
  S3-T04: Landing page e2e             → AC-08-A/B, AC-09-A/B/C

PHASE S4 (Metrics) — requires S2
  S4-T01: Main page 4 tiles            → AC-01-A/B, AC-CH-A/B
  S4-T02: Insights page real data      → AC-01-C
  S4-T03: Trend percentages            → AC-01-C
  S4-T04: TopBar activity feed         → (cleanup)
  S4-T05: Sales recent activity        → (cleanup)

PHASE S5 (Chat) — requires S2
  S5-T01: Thinking card                → AC-06-A
  S5-T02: Chat history + mid-stream    → AC-06-B
  S5-T03: Persona name + fallback      → AC-06-C/D
  S5-T04: CRM Guru mode               → AC-07-A/B/C
  S5-T05: Hunch filter                 → AC-HF-A/B/C/D

PHASE S6 (Outbound) — requires S3
  S6-T01: Kill switch system           → AC-05-A/B/C/D, AC-KS-A/B
  S6-T02: Rate limiter + logging       → AC-05-E/F
  S6-T03: Metering                     → AC-10-A/B/C
  S6-T04: TeamBox types + priority     → AC-TB-A/B

PHASE S7 (Tests) — requires S6
  S7-T01: Expand Enforcer              → AC-EF-A/B/C
  S7-T02: Test framework + kill switch → AC-KS-A/B
  S7-T03: API integration tests        → (coverage)
  S7-T04: Battery mapping              → (documentation)

PHASE S8 (Polish) — requires S4+S5+S7
  S8-T01: Navigation ACs              → AC-NAV-A through J
  S8-T02: My Work chat real data       → (mock removal)
  S8-T03: Remove mock files            → (cleanup)
  S8-T04: Settings demo-mode           → (cleanup)
```

**RC Gate ACs** (all must show PASS):
AC-01-A, AC-01-B, AC-01-C, AC-02-A/B/C/D, AC-04-A/B/C/D, AC-06-A/B/C/D, AC-07-A/B/C, AC-08-A/B, AC-09-A/B/C/D, AC-CH-A/B, AC-HF-A/B/C/D

---

## Section 5: File Scope Rules

Each phase has a defined file scope. Agents must not modify files outside their phase scope without explicit approval.

| Phase | Files IN Scope | DO NOT TOUCH |
|-------|---------------|--------------|
| S1 | Governance docs only (SPEC.md, COMMENT_INDEX.md, etc.) + CLAUDE.md | Any .ts/.tsx source code |
| S2 | shared/schema.ts, shared/models/, migrations/ | Any client/ code, server/routes.ts |
| S3 | server/routes.ts, server/vendorProxy.ts, new server/tavus.ts, client widget/landing components | shared/schema.ts (locked after S2), governance docs |
| S4 | client/src/pages/insights.tsx, main.tsx, sales.tsx, TopBar.tsx; server/routes.ts (new endpoints), server/storage.ts | shared/schema.ts, server/outbound.ts |
| S5 | server/routes.ts (chat endpoint), client/src/hooks/useStreamingChat.ts, client/src/pages/main.tsx, agents.tsx | shared/schema.ts, client/src/pages/insights.tsx |
| S6 | server/outbound.ts, server/routes.ts (outbound/usage endpoints), client/src/pages/teambox.tsx, usage.tsx | client/src/pages/main.tsx, insights.tsx |
| S7 | scripts/enforcer.ts, new test files, testing/ directory | Any production source code |
| S8 | client/src/pages/my-work.tsx, settings.tsx, SubMenuManager.tsx, Sidebar.tsx, client/src/mocks/ | server/ code, shared/schema.ts |

---

## Section 6: Sprint Report Procedure

At the end of each phase, the agent fills in the Sprint Report template from PLAN.md Section 3:

1. **Copy the template** into the Sprint Report section of PLAN.md (or a separate file if preferred)
2. **List every AC** addressed in the phase (from the traceability table)
3. **For each AC**, record:
   - **PASS**: Self-verification criteria all met + evidence described
   - **FAIL**: Which criterion failed + what was attempted
   - **PARTIAL**: Which criteria met, which not, and why
4. **List new gaps** discovered during implementation (add to GAPS.md as OPEN)
5. **List blocking issues** that prevented completion (if any)
6. **Present to user** per GATE:STOP protocol
7. **Wait for user approval checkbox** to be checked before proceeding

The Sprint Report is the primary artifact the user reviews at each gate. It must be honest, specific, and evidence-based. No "appears to work" language (GUARDRAILS.md R8).
