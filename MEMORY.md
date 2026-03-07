# Nexxus Connect — Session Memory

**Purpose:** Session log tracking decisions, changes, and context across sessions.
**Maintained by:** Agent at the end of each session.

---

## Last 5 Decisions

| # | Date | Decision | Why | What Changed |
|---|------|----------|-----|--------------|
| 1 | 2026-03-07 | Governance consolidation — archive stale docs, create GAPS/GUARDRAILS/MEMORY | Project had 2 competing acceptance criteria, false positives on wave completion, 10+ governance docs with drift and contradictions | Archived 6 files (CLAUDE.md, SPEC.md, Sprint_log.md, COMMENT_INDEX.md, operational-context.md, root ACCEPTANCE_CRITERIA.md). Created GAPS.md, GUARDRAILS.md, MEMORY.md. Rewrote replit.md and PLAN.md. |
| 2 | 2026-03-06 | VinSolutions is Lead Management tier — read/query only | Cannot do wholesale two-way sync. Platform maintains forked local data store (data warehouse). | Added Wave 3.5 for data warehouse. 3-tier sync strategy defined (bulk, daily delta, 4h refresh). |
| 3 | 2026-03-06 | Data provenance required in AI chat | AI must state where data came from (VinSolutions vs uploaded vs generated). Users need to trust the source. | Context Router architecture added to PLAN.md. Data source attribution columns on warehouse tables. |
| 4 | 2026-03-05 | All mock data must be eliminated | Fake metrics create false confidence. If no real data source exists, remove the metric entirely. | Standing directive #9. Affects every dashboard page. |
| 5 | 2026-03-05 | Anti-false-positive rule | Visual-only tests were passing ACs that required real backend behavior. Created a cycle of "complete" sprints with broken functionality. | Root ACCEPTANCE_CRITERIA.md (visual-only) archived. GUARDRAILS.md rule R1 added. |

---

## Session History

| Date | Session | Sprint | What Was Done | What Changed | What's Next |
|------|---------|--------|---------------|--------------|-------------|
| 2026-03-07 | Governance Stabilization | S01 | Full audit and consolidation. Archived 6 stale docs. Created GAPS.md (91 items), GUARDRAILS.md (8 rules + lockdown), MEMORY.md. Rewrote replit.md (≤60 lines) and PLAN.md (12 numbered sprints). Updated codebase-index.md. | Root governance reduced from 10+ files to 6 active files. Single gap register established. Anti-drift rules codified. | S02: Schema & Persistence Gaps — verify tables, add missing columns |

---

## Standing Directives

These apply globally across all sprints. Sourced from stakeholder review (2026-03-05).

1. TeamBox needs departmental filter + RBAC — users only see conversations for their departments
2. Campaign segmentation in TeamBox — grouped dropdown filter by department (Sales, Marketing, Service)
3. Environment variables tracked — maintain manifest for future Railway deployment
4. Supabase migration planned — PostgreSQL now, keep schema compatible
5. VAPI/Tavus prompts are vendor-side — read only, no bidirectional MCP
6. Never use the word "MVP" in code, comments, UI, or docs
7. Metrics storage separate from CRM — agents specify data source, never auto-trigger from uploaded metrics
8. "Reply STOP to opt out" in every outbound SMS (single message). Unsubscribe link in every email
9. All mock data must be eliminated — remove metric if no real data source
10. All testing built from UI audit + acceptance criteria — no ad-hoc test plans
11. Task assignment: agents (AI) or self-assigned only, no user-to-user
12. TeamBox campaign filter: simple dropdown with department sub-groups
13. VinSolutions is Lead Management tier — read/query only, forked local data store
14. VinSolutions sync: one-time bulk pull, daily delta, 4h business-hours refresh
15. Data provenance / Context Router — every data point has known source, AI states provenance
16. Insight history — hunches memorialized over time for trend analysis
