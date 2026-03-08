# Stabilization Blueprint

**Date:** 2026-03-08 (Sweep 2.5)
**Inputs:** Truth Hierarchy (1A), AC Reconciliation (1B), Chat Architecture Decision (1C), ISSUES.md (2A), Continuity Matrix (2B), Observability Matrix (2C)

---

## 1. RC-Blocking vs Deferred Classification

### RC-Blocking Issues (must resolve before Sweep 9 gate)

**19 unique issues after deduplication:**

| Issue ID | Finding | Why RC-blocking | Target Sweep |
|---|---|---|---|
| GOV-08 | Cross-references to non-existent files | Governance docs can't reference phantoms | Sweep 3 |
| GOV-10 | PLAN.md claims ~92% complete; reality is ~32% real | New PLAN.md must be accurate | Sweep 3B |
| SCH-08 | Agents table missing system_prompt, triggers, tools, etc. | Agent configuration is core feature | Sweep 5 |
| SCH-12 | Dual schema conflict (chat.ts vs schema.ts table name collision) | Runtime crash risk | Sweep 5.1 |
| SCH-13 | No ON DELETE CASCADE on any FK | Constraint violations on data operations | Sweep 5.5 |
| SCH-18 | No migration files — empty migrations/ directory | No reproducible DB state | Sweep 5.5 |
| API-03 | Password reset stub (placeholder response) | Auth flow incomplete | Sweep 5.4 |
| API-04 | Forgot password stub (no email sent) | Auth flow incomplete | Sweep 5.4 |
| API-08 | No AI configuration routes (prompt/skill/temperature) | Agent config UI has no backend | Sweep 5 |
| API-09 | No POST /api/organizations | OrgWizard has no backend | Sweep 5 |
| API-13 | Campaign execution state in-memory — lost on restart | Data loss on any restart | Sweep 5.3 |
| API-15 | TextMagic webhook lacks secret validation | Security gap | Sweep 5.2 |
| UI-01 | Insights page 100% mock | Core feature has zero real data | Sweep 6.1 |
| UI-02 | My Work chat tab imports from @/mocks/ | Mock imports in production page | Sweep 6.1 |
| UI-06 | TopBar Activity Feed uses static data | API exists but not wired | Sweep 6.1 |
| UI-11 | OrgWizard not wired | Org creation broken | Sweep 6.3 |
| AIO-01 | Voice (VAPI) is console.log only | Core channel not functional | Sweep 7.1 |
| AIO-02 | Video (Tavus) not implemented | Core channel not functional | Sweep 7.2 |
| VER-01/02/10 | Zero automated tests, no framework, maturity Level 1 | No verification possible without tests | Sweep 4 |

### Deferred Issues (post-MVP, explicitly out of RC scope)

| Issue ID | Finding | Why deferred |
|---|---|---|
| API-01 | Stripe billing | Post-MVP monetization feature |
| API-02 | File/Drive management | Enhancement, not core CRM |
| API-06 | Notification preferences | Enhancement |
| API-07 | Security settings routes | Enhancement |
| API-16 | Widget lookup scans all orgs | Performance optimization, not functionality |
| SCH-03 | metrics_cache table | Performance optimization |
| SCH-15 | RLS policies | Security hardening, app-layer RBAC is sufficient for MVP |
| UI-04 | Billing pages hardcoded | Depends on Stripe (API-01) |
| UI-09 | Trend percentages non-functional | Enhancement |
| MET-03 | Trend percentages zero | Enhancement |
| FP-8 | Marketing Studio "Coming Soon" | Future feature |
| FP-9 | TeamBox file attachments | Future feature |
| FP-10 | Chat upload/document | Future feature |

---

## 2. How Canonical Decisions Shape Remediation

### Decision 1: Main chat is canonical (Sweep 1C)

**Impact on remediation:**
- Sweep 5.1 must resolve the table name collision in shared/models/chat.ts
- Options: (a) deprecate chat.ts entirely and remove it, (b) rename its tables to avoid collision, (c) thin-adapter pattern where chat.ts re-exports from schema.ts
- Recommended: Option (a) — deprecate chat.ts. It scores 0/8 on the decision matrix. No production code should reference it after Sweep 5.1.

### Decision 2: Org-centered identity model

**Impact on remediation:**
- All new schema work in Sweep 5 must enforce org_id ownership on every table
- API routes that currently lack org-scoping (if any found) must be fixed
- The org wizard (UI-11 / API-09) must create a proper organization with all required fields

### Decision 3: Runtime UI is T1 (Truth Hierarchy)

**Impact on remediation:**
- When backend and UI disagree, backend adapts to UI (not vice versa)
- The 4 widget channels in the UI are canonical — AC annotation for W1-AC-110 reflects this
- Pipeline tiles are org-scoped per the runtime code — any new metrics work follows this pattern
- Agent personas (Caroline, Magnolia, etc.) are the real agents — SRS's generic names are stale

### Decision 4: Observability is permanent

**Impact on remediation:**
- Sweep 4 must establish test infrastructure that can verify every "real" row in the Observability Matrix
- Every "mock" or "static" row that gets wired to real data in Sweep 6 must get a corresponding test
- The Observability Matrix is updated as rows change from mock → real
- OWNER-TEST flagged rows are verified in Sweep 7.5 by the owner personally

---

## 3. Sweep Dependencies

```
Sweep 3 (Governance Rebuild)
  ├── 3A: replit.md rebuild — no dependencies
  ├── 3B: New PLAN.md with Phases — depends on ISSUES.md (2A) and Blueprint (2.5)
  ├── 3C: GUARDRAILS.md + R11 — no dependencies
  ├── 3D: Agent roles — no dependencies
  └── 3E: CLAUDE.md rebuild — depends on 3A (index), 3B (plan structure)

Sweep 4 (Test Infrastructure)
  ├── Test framework setup — no dependencies (can start immediately)
  ├── Test catalog — depends on Continuity Matrix (2B) and Observability Matrix (2C)
  └── Smoke tests — depends on test framework

Sweep 5 (Schema & Backend Fixes)
  ├── 5.1: Chat schema collision — no blocking dependency
  ├── 5.2: Webhook security — no blocking dependency
  ├── 5.3: Campaign state persistence — no blocking dependency
  ├── 5.4: Auth stubs (password reset/forgot) — no blocking dependency
  └── 5.5: Cascades, indexes, migrations — depends on 5.1 (schema stable first)

Sweep 6 (Frontend Wiring)
  ├── 6.1: Wire mock pages to real APIs — depends on Sweep 5 (APIs must exist)
  ├── 6.2: Demo-mode cleanup — depends on Sweep 5 (backends must exist)
  ├── 6.3: OrgWizard wiring — depends on API-09 (Sweep 5)
  └── 6.4: Mock file cleanup — depends on 6.1 (consumers rewired first)

Sweep 7 (Integration Completion)
  ├── 7.1: VAPI voice — depends on Sweep 5 (schema stable)
  ├── 7.2: Tavus video — depends on Sweep 5 (schema stable)
  └── 7.3: Widget landing page — depends on 6.1

Sweep 7.5 (Owner Live Testing)
  └── Depends on Sweeps 5-7 complete

Sweep 8 (Regression Testing) → depends on Sweep 7.5
Sweep 9 (RC Gate) → depends on Sweep 8
Sweep 10+ (Post-MVP) → after RC
```

---

## 4. Estimated Scope per Sweep

| Sweep | Scope | Estimated Effort | Risk |
|---|---|---|---|
| 3 — Governance Rebuild | 5 documents rebuilt from scratch | Medium | Low — documentation only |
| 4 — Test Infrastructure | Framework setup, test catalog, smoke tests | Medium | Low — green-field test setup |
| 5 — Schema & Backend | ~8 focused backend fixes, schema migration setup | High | Medium — DB changes, state management |
| 6 — Frontend Wiring | 3-4 pages rewired from mock to real APIs, cleanup | High | Medium — UI/API contract matching |
| 7 — Integration Completion | VAPI + Tavus + widget landing | High | High — external service dependencies |
| 7.5 — Owner Live Testing | Owner tests SMS, voice, email, widget | Low (agent) | Owner-dependent scheduling |
| 8 — Regression | Full test suite execution | Medium | Low if tests written in Sweep 4 |
| 9 — RC Gate | Checklist verification | Low | Low — pass/fail gate |

---

## 5. RC Readiness Criteria

The Release Candidate gate (Sweep 9) requires:

1. **All 19 RC-blocking issues RESOLVED** with evidence
2. **Observability Matrix**: Zero "mock" or "static" rows except explicitly deferred items
3. **Continuity Matrix**: Every RC-required UI surface has a complete row (no gap columns)
4. **OWNER-TEST rows**: All verified by owner in Sweep 7.5
5. **Test suite**: Green on all Sweep 4 tests + Sweep 8 regression
6. **Governance**: replit.md, PLAN.md, GUARDRAILS.md, CLAUDE.md all rebuilt and consistent
7. **No drift**: Final drift check passes

---

## 6. Key Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| External service credentials missing (VAPI, Tavus, TextMagic, Resend) | Sweep 7 blocked | Request credentials early in Sweep 5; OWNER-TEST flag ensures live verification |
| Schema migration breaks existing data | Data loss | Sweep 5.5 generates migration files; test on dev DB first |
| Campaign state persistence (API-13) complex to implement | Scope creep | Simple approach: persist to DB table, not full job queue |
| Insights page (UI-01) has 23+ sections to wire | Large scope | Phase approach: wire high-value metrics first, defer low-value charts |
| Owner availability for Sweep 7.5 | Timeline slip | Provide clear test script; minimize owner time needed |
