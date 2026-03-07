# Nexxus Connect — Guardrails & Anti-Drift Rules

**Purpose:** Prevent false positives, feature drift, and governance breakdown.
**Authority:** This file is referenced from replit.md. Every agent reads this before working.

---

## Core Rules

**R1 — No False Positive ACs**
NEVER report an AC as passing if the test uses hardcoded or static data. A passing AC requires a real DB query, real API call, or real behavioral verification. Appearance tests are NOT behavioral tests.

**R2 — Truth Hierarchy**
When documents conflict, this priority order applies (highest wins):
1. UI code (approved design) — T1
2. .agent_docs/acceptance_criteria.md — T2
3. SRS.md — T3
4. PLAN.md — T4

If T2 contradicts T1, T1 wins. If T3 contradicts T2, T2 wins.

**R3 — No Unplanned Work**
No feature work without a sprint number in PLAN.md. If it's not in a sprint, it doesn't get built.

**R4 — Evidence Required**
No AC marked PASS without file:path:line evidence showing the behavior exists in code.

**R5 — Golden Rule**
Change the data source, not the UI. The current UI is the approved design. When wiring to backend, replace mock imports with API calls.

**R6 — No Fake Data**
If a metric has no real data source, remove it from the UI. Never show hardcoded numbers, zeros, or placeholder values for metrics.

**R7 — No Mock Data in Production**
All mock data must be eliminated. No "Coming Soon" placeholders for metrics. Static arrays must be replaced with API calls.

**R8 — Banned Terms**
Never use the word "MVP" in code, comments, UI text, or documentation.

---

## Sprint Completion Gates

No sprint is marked complete without ALL of the following:

1. Every AC item verified with file:path:line evidence
2. No new items added to GAPS.md during the sprint (no regressions)
3. Enforcer compliance scan passes
4. UI visual verification matches AC description
5. No hardcoded or static data passes for a behavioral AC

---

## Agent Governance Model

Three operational roles for every sprint:

| Role | Responsibility |
|------|---------------|
| **Builder** | Implements sprint work within declared file scope |
| **Reviewer** | Reviews output against AC + GAPS.md, checks for drift from PLAN.md |
| **Enforcer** | Automated compliance scan before any work is marked complete |

Cross-sign rule: Builder's work must be reviewed by Reviewer before marking complete.

---

## Session Start Protocol

Every session begins by reading these files in order:
1. `replit.md` — project orientation and file index
2. `PLAN.md` — current sprint and what's being worked on
3. `GAPS.md` — open items that may affect current work
4. `GUARDRAILS.md` — this file, rules to follow
5. `.agent_docs/rules/agent-roles.md` — role scope and compliance

---

## Anti-Drift Rules

1. Agent must re-read PLAN.md and current sprint AC before starting any work. No "from memory" implementations.
2. If a file outside the current sprint scope needs modification, stop and declare the scope change.
3. If an AC appears to pass but the underlying data is mocked/hardcoded, it FAILS. Log it in GAPS.md.
4. Never mark a wave/sprint as "complete" if GAPS.md has OPEN items targeting that sprint.

---

## Pre-Commit Checks

Before any work is considered complete, run these checks:

1. **TypeScript compile** — zero errors
2. **Dropped feature scan** — no references to: Drive, Custom Agent, Sharing, Artifacts (standalone), global Skills
3. **Credential scan** — no production API keys, real phone numbers, or passwords in code
4. **Kill switch defaults** — all outbound columns default to FALSE
5. **Mock import scan** — no mock data imports in production page files (client/src/pages/)

---

## Recommended Lockdown Measures (Future Implementation)

### Git Pre-Commit Hook
Install husky or use .git/hooks/pre-commit to automate:
- TypeScript compile check (`npx tsc --noEmit`)
- Enforcer scan (`npx ts-node scripts/enforcer.ts`)
- Credential pattern scan (grep for API key patterns)
- Kill switch default verification

### Automated Drift Detection
Build a script that:
- Compares current mock imports against a baseline
- Flags any new hardcoded data arrays in page files
- Verifies every metric tile has a real API data source
- Checks GAPS.md for regressions (items that moved from RESOLVED back to OPEN)

### Session Audit Trail
Every session should log to MEMORY.md:
- What sprint was worked on
- What files were modified
- What ACs were verified (with evidence)
- What gaps were opened or closed
