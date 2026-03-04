# .agent_docs/rules/agent-roles.md — Nexxus v2.2
# PURPOSE: Defines the agent team structure, responsibilities, file scope limits, and compliance log.
# Load this file when: starting a session, assigning roles, or reviewing an Enforcer violation.
# Last updated: 2026-03-04

---

## AGENT TEAM STRUCTURE

Seven roles. No agent operates outside their defined scope. All output cross-signed by a different role.

| Role | Responsibilities | File scope | Cannot touch |
|------|-----------------|-----------|-------------|
| **Enforcer** | Pre-merge compliance check, Enforcer Violation escalations | Read-only everywhere; writes to compliance log in this file only | All application code |
| **Architect** | Spec adherence, reviews Backend and Frontend output, updates SPEC.md with owner approval | SPEC.md, SRS.md (with owner), .agent_docs/ (read) | Application code without Backend/Frontend sign-off |
| **Frontend** | UI implementation — components, pages, layouts | client/src/**, public/** | Server code, DB migrations, governance files |
| **Backend** | API, services, DB migrations, MCP tools, trigger engine | server/**, db/**, central-mcp/** | Client code, governance files |
| **Test** | Acceptance tests, spec.ts maintenance, smoke tests | tests/**, spec.ts | Application code (read-only reference) |
| **Integration** | MCP proxy tools, external connector code, kill switch enforcement | central-mcp/**, server/services/mcp/** | Client code, governance files |
| **Scribe** | codebase-index.md, MEMORY.md, JSDoc/TSDoc quality, comments | .agent_docs/codebase-index.md, MEMORY.md, MEMORY.md.bak | Application logic (read-only) |

---

## CROSS-SIGN RULE

No task is COMPLETED without sign-off from a different role.

| Role completing work | Required sign-off from |
|---------------------|----------------------|
| Frontend | Architect |
| Backend | Architect |
| Integration | Backend + Architect |
| Test | Architect or Backend |
| Scribe | Any other role (sanity check only) |
| Enforcer | Operates independently — no cross-sign required |

---

## AUTONOMY LEVELS — APPLIED PER SESSION

Declare autonomy level at session start. Applies to the entire session.

| Level | Permitted | Requires |
|-------|----------|---------|
| L1 | Read only — no writes | Default — no declaration needed |
| L2 | Writes to declared scope list | Declare scope list at session start |
| L3 | Writes within current wave's approved boundaries | Owner approval of wave scope |
| L4 | Writes anywhere permitted by role | Owner types approval phrase fresh this session, logged with timestamp |

**L4 approval phrase:** Owner types it fresh each session. Never stored. Logged entry: `L4 APPROVED [timestamp] [owner-typed phrase] [session-id]`

---

## ENFORCER PRE-MERGE COMPLIANCE CHECKLIST

Run every check in order. Any failure blocks the merge immediately.

- [ ] EF-01: TypeScript compiles with zero errors (`npm run check`)
- [ ] EF-02: Production build succeeds (`npm run build`)
- [ ] EF-03: Kill switch tests pass — all 4 channel tests pass (`npm run test:smoke`)
- [ ] EF-04: No references to dropped features: Drive, Custom Agent, Sharing, Artifacts, global Skills
- [ ] EF-05: No production credentials in any file (Supabase prod URL, real API keys, real phone numbers)
- [ ] EF-06: CLAUDE.md hash matches locked state (no modification)
- [ ] EF-07: .agent_docs/acceptance_criteria.md hash matches locked state
- [ ] EF-08: All new functions have JSDoc/TSDoc blocks
- [ ] EF-09: All new files have entries in .agent_docs/codebase-index.md
- [ ] EF-10: No COMPLETED items without file:path:line evidence
- [ ] EF-11: ESLint passes with zero warnings (`npm run lint`)

---

## STOP CONDITIONS — AGENT HALTS IMMEDIATELY

Any agent must halt the current task and notify owner when:

1. A file outside declared session scope would be modified
2. CLAUDE.md or acceptance_criteria.md modified by any agent
3. Kill switch check absent from any new outbound code path
4. Production credentials detected in any file
5. Undefined behavior encountered (log to undefined-items.md first)
6. MEMORY.md integrity check fails (Scribe role)
7. .project/ directory found or recreated
8. --dangerously-skip-permissions used without L4 written approval in this session
9. Enforcer compliance check fails
10. Previously passing test now fails (regression) — do NOT fix without owner instruction
11. merge_to_main attempted without Enforcer sign-off

---

## ENFORCER COMPLIANCE LOG

Format: `[PASS/FAIL] [timestamp] [PR/commit reference] [failing check if FAIL] [agent]`

| Entry | Timestamp | Reference | Result | Notes |
|-------|-----------|-----------|--------|-------|
| (Wave 0 — no merges yet) | — | — | — | — |
