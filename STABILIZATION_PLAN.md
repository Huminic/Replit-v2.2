# STABILIZATION PLAN — Nexxus Connect v2.2

**Status:** PROPOSED — not authoritative until explicitly approved
**Date:** 2026-03-07
**Baseline:** Commit `58288b6`
**Source:** Synthesis of 8 audit artifacts, GAPS.md (80 items, to be merged into ISSUES.md), and 3 rounds of owner review

---

## Owner Decisions (settled — not open questions)

| Decision | Resolution |
|---|---|
| Canonical chat architecture | Main app chat (UUID, JWT+RBAC, tool use, streaming, PostgreSQL) |
| Replit chat integration | Adapter-only, trending toward deprecation if not made thin |
| Canonical AC source | Root `ACCEPTANCE_CRITERIA.md` (~249 criteria, table format) |
| .agent_docs AC role | Derived verification/test layer — not authoritative for requirements |
| Truth hierarchy | Runtime UI → canonical AC → approved PLAN → contracts/schema → audit artifacts → quarantined docs |
| Legacy documents | Reference-only now; formally deprecated/archived after RC gate |
| Observability | Permanent release discipline — not a one-time stabilization exercise |
| Canonical identity model | Organization-centered tenancy. All major entities attach to org. Messages attach through conversations. |

---

## Merged Findings Summary

### Source Artifacts

| # | Audit File | Key Findings |
|---|---|---|
| 1 | `audit_report.md` | 80 gaps (19 HIGH, 31 MEDIUM, 30 LOW) across 7 categories |
| 2 | `governance_audit.md` | 3 competing truth hierarchies, 2 conflicting AC documents, 13 status drift observations, 10 conflicts, 8 duplications |
| 3 | `schema_catalog.md` | 23 tables cataloged, 4 missing tables vs SRS, 20+ missing columns, dual schema conflict, no cascades, no indexes, no migrations |
| 4 | `api_catalog.md` | 104 routes cataloged, 2 stub routes, 13 missing vs SRS, campaign state in-memory, 5 unused IStorage methods |
| 5 | `frontend_catalog.md` | 23 frontend routes, Insights page 100% mock, My Work chat tab imports mocks, ~25 demo-mode toasts, 8 placeholder tabs |
| 6 | `ai_outbound_catalog.md` | AI chat fully wired, SMS wired, Email wired, Voice mock (console.log), Video missing, 3-layer kill switch implemented, TextMagic webhook lacks secret |
| 7 | `metrics_intelligence_audit.md` | ~32% of displayed metrics real, ~68% mock/hardcoded, Insights page 100% static, Hunch system fully real, no historical trend computation |
| 8 | `verification_audit.md` | Zero automated tests, no test framework, "E2E Tests: PASSED" were manual checks, 10+ false positive features, mock data audit claimed complete but mocks persist |

### Gap Distribution

| Category | Count | HIGH | MEDIUM | LOW |
|---|---|---|---|---|
| Governance (GOV) | 13 | 4 | 5 | 4 |
| Schema (SCH) | 20 | 2 | 6 | 12 |
| API & Backend (API) | 16 | 2 | 7 | 7 |
| Frontend & UI (UI) | 11 | 2 | 5 | 4 |
| AI/Chat/Outbound (AIO) | 6 | 3 | 2 | 1 |
| Metrics (MET) | 4 | 2 | 1 | 1 |
| Verification (VER) | 10 | 4 | 5 | 1 |
| **TOTAL** | **80** | **19** | **31** | **30** |

### 5 Structural Problems

1. **Governance is contradictory and stale.** 3 competing truth hierarchies, 2 conflicting AC documents, SPEC.md describes a single-table database when there are 23 tables, operational-context.md was never updated past day one, codebase-index.md is empty.

2. **Mock data persists in production paths despite claims it was removed.** Insights page is 100% mock. My Work chat tab imports from mocks/. TopBar Activity Feed uses static data. ~25 interactive elements show "demo mode" toasts. 68% of all displayed metrics are hardcoded or mock.

3. **Key integrations are incomplete.** VAPI voice outbound is console.log. Tavus video has no send capability. TextMagic webhook lacks secret validation. Campaign execution state is in-memory. Widget landing page interactions are simulated locally.

4. **Zero automated tests exist.** No test files, no test framework, no test config. Sprint log "E2E Tests: PASSED" claims were manual developer checks. Enforcer script only checks dropped features and kill switch defaults.

5. **Parallel architecture drift.** Main app chat (UUID PKs, full JWT+RBAC, tool use, PostgreSQL persistence) and Replit chat integration (integer PKs, no auth, no tools, in-memory) create duplicate domain concepts with conflicting schemas.

---

## 10 Architectural Contradictions

| # | Contradiction | Impact | Resolution (per owner decisions) |
|---|---|---|---|
| C-01 | Two AC documents with different requirements for same features (tiles, channels, TeamBox model) | HIGH | Root ACCEPTANCE_CRITERIA.md is canonical. .agent_docs is derived test layer. Conflicts resolved per canonical AC. |
| C-03 | Metric tiles defined 3 different ways across 3 documents | HIGH | Runtime UI is T1 truth. Current UI code defines what tiles show. Backend adapts to UI needs. |
| C-09 | Widget channels: 7 (SRS/SPEC/CLAUDE) vs 4 (replit.md/.agent_docs) | HIGH | Runtime UI is T1. Current implementation (4 channels) is canonical. SRS/SPEC are quarantined. |
| C-07 | Safety layers: 3 vs 4 vs 5 depending on document | MEDIUM | Audit finding (audit #6): 3-layer + rate limiting. Document as 4-layer in governance rebuild. |
| C-06 | "Artifacts" simultaneously out-of-scope and has ACs requiring it | MEDIUM | Canonical AC (ACCEPTANCE_CRITERIA.md) defines scope. Check what canonical AC says about Artifacts. |
| C-05 | Wave/sprint numbering differs in every document | MEDIUM | New PLAN.md uses numbered sweeps (S0-S10+). Old wave/sprint numbers are quarantined references only. |
| C-02 | RBAC roles: 4 (SRS §1.2) vs 8 (everywhere else) | LOW | 8 roles in codebase. SRS §1.2 is stale. Quarantined. |
| C-04 | Table count: 1 (SPEC) vs 23 (reality) vs 53 (SRS prod ref) | LOW | 23 tables in schema. SPEC is quarantined. |
| C-08 | File structure in SPEC/CLAUDE doesn't match actual codebase | LOW | CLAUDE.md rebuilt in Sweep 3 to reflect actual structure. |
| C-10 | Production backend reference numbers differ slightly | LOW | Cosmetic. No action needed. |

---

## Canonical Identity Model

All data in the system follows organization-centered tenancy:

```
Organization (root tenant)
├── Users (belong to org via organization_id)
├── Agents (belong to org via organization_id)
├── Conversations (belong to org via organization_id)
│   └── Messages (belong to conversation via conversation_id)
├── Campaigns (belong to org via organization_id)
│   └── Campaign Recipients (belong to campaign via campaign_id)
├── Tasks (belong to org via organization_id)
├── Widgets (belong to org via organization_id)
├── Hunches (belong to org via organization_id)
├── Integrations (belong to org via organization_id)
├── Notifications (belong to user + org)
├── Activity Log (belong to org via organization_id)
├── Knowledge Documents (belong to org, optionally to agent)
├── Warehouse Leads (belong to org via organization_id)
├── Warehouse Metrics (belong to org via organization_id)
├── Appointments (belong to org via organization_id)
├── Outbound Log (belong to org via organization_id)
├── Sync Log (belong to org via organization_id)
└── Usage Events (belong to org via organization_id)
```

Messages do not attach directly to organizations. They attach through conversations. This is the canonical ownership chain and must be enforced in all new schema work and in the Replit chat integration resolution.

---

## Sweep 0 — Freeze & Quarantine

**Objective:** Reduce governance hazard without losing source material. Quarantine only — no archiving.

**Main actions:**
- Mark the following documents as QUARANTINED with a header notice ("QUARANTINED — not authoritative. Retained for reference only until governance rebuild is complete."):
  - SPEC.md (critically stale — describes single-table database, no API routes)
  - SRS.md (partially stale — references 53 tables/175 endpoints that don't match reality)
  - Sprint_log.md (misleading completion claims, inconsistent numbering)
  - .agent_docs/rules/operational-context.md (never updated past day one)
  - .agent_docs/codebase-index.md (empty application section)
  - .agent_docs/undefined-items.md (no entries ever logged)
  - COMMENT_INDEX.md (references stale states)
- Flag files modified by previous agent as potentially contaminated:
  - GUARDRAILS.md (was overwritten, then rolled back — verify current state matches audit baseline)
  - MEMORY.md (was overwritten, then rolled back — verify integrity)
  - PLAN.md (was overwritten, then rolled back — verify integrity)
- Verify MEMORY.md integrity by comparing against the audit record of what actually happened
- Catalog orphaned mock files with zero consumers (do not delete yet — just inventory):
  - `mocks/index.ts` (barrel export, no direct consumers)
  - `mocks/campaigns.ts` (no direct page imports)
  - `mocks/tasks.ts` (no direct page imports)
  - `mocks/users.ts` (no direct page imports)
  - `mocks/notifications.ts` (no direct page imports)
  - `mocks/activity.ts` (no direct page imports)
  - `mocks/files.ts` (no direct page imports)
  - `mocks/widgets.ts` (no direct page imports)
  - `mocks/agents.ts` (functionality moved to lib/agent-utils.ts)

**Outputs:**
- Quarantine inventory list (which files, why, what useful content they still contain)
- MEMORY.md integrity assessment
- Orphaned mock file catalog

**Approval gate:** Owner reviews the quarantine list before Sweep 1 begins.

---

## Sweep 1 — Establish Canonical Truth

**Objective:** Document the canonical sources and architectural decisions that govern all downstream work. These decisions are settled per owner input — this sweep documents them formally and resolves the specific conflicts.

### Step 1A — Truth Hierarchy Declaration

The following truth hierarchy governs all contradiction resolution:

| Priority | Source | Authoritative For |
|---|---|---|
| 1 | Runtime UI code (`client/src/`) | All visual behavior, layout, interactions, component structure |
| 2 | Canonical AC (`ACCEPTANCE_CRITERIA.md`) | Verifiable requirements and behaviors |
| 3 | Approved PLAN (stabilization roadmap) | Development sequencing, phase gates, task definitions |
| 4 | Contracts/Schema (`shared/schema.ts`, `server/storage.ts`, API routes) | Data shapes, endpoint contracts, persistence model |
| 5 | Audit artifacts (`audits/` folder, `ISSUES.md`) | Findings of record, gap/issue status |
| 6 | Quarantined documents | Reference only — not authoritative for any decision |

This replaces all prior truth hierarchy declarations in CLAUDE.md, replit.md, and operational-context.md.

### Step 1B — Canonical AC Reconciliation

Root `ACCEPTANCE_CRITERIA.md` is the canonical source. `.agent_docs/acceptance_criteria.md` is a derived verification/test layer.

Conflict resolution table (applying truth hierarchy — runtime UI is T1, canonical AC is T2):

| Topic | ACCEPTANCE_CRITERIA.md Says | .agent_docs Says | Resolution |
|---|---|---|---|
| AI Chat metric tiles | W1-AC-010: 4 role-specific tiles vary by role | AC-CH-A: all roles see "active pipeline, appointments today, open escalations, outbound sent 24h" | Check runtime UI. Current UI shows pipeline tiles. Canonical AC defines the requirement. .agent_docs version becomes a test case for the pipeline tiles specifically. |
| Widget channels | W1-AC-110: 7 channels (chat, video, voice, SMS, callback, email, WhatsApp) | AC-04-A: 4 channels (web chat, web call, form, two-way video) | Runtime UI shows 4 channels. Canonical AC's W1-AC-110 is stale (from original SRS scope). Current implementation of 4 channels stands per T1. |
| TeamBox item types | W1-AC-020-024: conversation-based with status filters | AC-TB-A: "Task, Escalation, Unsent Message are distinct visual types" | Runtime UI uses conversation-based model. Canonical AC's conversation model stands per T1. .agent_docs version describes the task/escalation creation from conversations, which is a derived behavior. |
| Sales sub-menu | W1-AC-092a: "Dashboard, Agents, Insights, Calendar" | AC-NAV-F: same + "Campaigns is NOT present under Sales" | No conflict — .agent_docs adds an explicit exclusion rule. Both apply. |
| Management hunches | W1-AC-071: hunch cards with pattern/recommendation | AC-NAV-H: "Hunches (Coming Soon)" | Runtime UI shows working hunches (fully wired per audit #7). Canonical AC's W1-AC-071 stands. .agent_docs "Coming Soon" label is stale. |
| Artifacts scope | W1-AC-012g: "Artifacts section renders with placeholder text" | Listed as OUT OF SCOPE; also AC-NAV-A says "Artifacts sub-items are visible" and AC-NAV-B says "Artifacts scoped to data reports only" | Canonical AC says render with placeholder. Runtime UI is T1 — check what currently renders. .agent_docs contradiction (both out-of-scope and has ACs) is resolved by deferring to canonical AC. |

### Step 1C — Canonical Chat Architecture Decision

**Decision:** Main app chat is canonical.

**Evaluation:**

| Criterion | Main App Chat | Replit Integration | Assessment |
|---|---|---|---|
| Auth model compatibility | Full JWT + RBAC, org-scoped | None | Main app wins |
| Multi-tenant org model | Yes — all conversations org-scoped | No — global, no org concept | Main app wins |
| Tool execution | Yes — Brave Search, VinSolutions MCP, up to 3 tool rounds | None | Main app wins |
| Streaming pattern | Hybrid (tool rounds + final stream) | Pure SSE | Main app more capable |
| Persistence/DB model | PostgreSQL, UUID PKs, Drizzle ORM | In-memory, integer PKs, separate tables | Main app aligns with canonical identity model |
| Migration complexity | N/A (canonical) | Full rewrite required to align with UUID/org model | Main app wins |

**Replit integration disposition:** Adapter-only. Must be made thin (proxy to main chat system) or deprecated. Current dual schema (separate `conversations` and `messages` tables with integer PKs) must not expand. Resolution path: either thin the adapter to proxy calls into the main chat system, or deprecate entirely.

**Domain duplication resolution:** The Replit integration's `shared/models/chat.ts` defines duplicate `conversations` and `messages` tables. These must either be removed (if deprecated) or converted to a thin adapter that creates records in the main schema (if retained as adapter).

**Outputs:**
- Truth Hierarchy Declaration
- AC Reconciliation Table
- Chat Architecture Decision Record

**Sweep 1 Approval Gate:** Owner confirms the documented resolutions align with intent before Sweep 2 begins. (The decisions themselves are settled — this gate confirms the documentation is correct.)

---

## Sweep 2 — Centralize Findings & Build Continuity

**Objective:** Merge all audit findings into one place and establish the canonical traceability chains.

### Step 2A — Create ISSUES.md (Living Issue Tracker)

Create `ISSUES.md` at root as the single living tracker for all gaps, bugs, and problems. Initial population merges:
- GAPS.md (80 items across 7 categories)
- 10 architectural contradictions (with resolutions from Sweep 1)
- 10 false positive features (from verification audit)

GAPS.md is retired after merge — ISSUES.md replaces it as the canonical tracker.

ISSUES.md is a living document: new issues are added as they are discovered during coding, testing, or review. Issues are organized into groups:
- **Governance (GOV)** — document conflicts, stale references, missing governance artifacts
- **Schema (SCH)** — missing tables/columns, dual schema conflicts, migration gaps
- **API & Backend (API)** — stub routes, missing endpoints, state persistence, security
- **Frontend & UI (UI)** — mock data, demo-mode placeholders, unwired features
- **AI/Chat/Outbound (AIO)** — integration stubs, channel wiring, safety layer gaps
- **Metrics (MET)** — mock/static data in tiles and charts, missing computations
- **Verification (VER)** — false positives, missing test coverage, stale claims

Each issue tagged with:
- Severity (HIGH / MEDIUM / LOW)
- Category (GOV / SCH / API / UI / AIO / MET / VER)
- RC-blocking (yes / no)
- Related AC ID(s) from canonical ACCEPTANCE_CRITERIA.md
- Related PLAN phase/sweep reference
- Current status (OPEN / IN-PROGRESS / RESOLVED)

No issue may be marked RESOLVED without evidence and owner approval (per GUARDRAILS R4).

### Step 2B — Continuity Matrix

The canonical traceability chain linking every RC-required UI surface through the full stack:

| UI Surface | AC ID(s) | PLAN Sweep/Task | API Endpoint(s) | Data Source (table/service) | Verification Method |
|---|---|---|---|---|---|

Rules:
- Every UI surface that ships in RC must have a complete row
- Gaps in any column are flagged as open items in ISSUES.md
- The chain must make it possible to trace from any UI element to its verification test and back

Example rows (to be completed in execution):

| UI Surface | AC ID(s) | PLAN Sweep/Task | API Endpoint(s) | Data Source | Verification |
|---|---|---|---|---|---|
| Main page — Active Pipeline tile | W1-AC-010 | Sweep 5/6 | GET /api/metrics/pipeline | warehouse_leads table (14-day window) | Observability test: verify count matches DB query |
| TeamBox — conversation list | W1-AC-020 | Sweep 6 | GET /api/conversations | conversations table (org-scoped) | E2E: create conversation, verify appears in list |
| Settings — Communication Gate | W3-AC-300 | Sweep 5 | PATCH /api/organizations/:id | organizations.outbound_enabled | E2E: toggle gate, verify outbound blocked |

### Step 2C — Observability Matrix

The data lineage traceability linking every displayed value to its source and verification:

| UI Surface | Endpoint | Handler/Service | Table/Source | Computation/Transform | Displayed Value | Data Type | Owner Test | Test Status |
|---|---|---|---|---|---|---|---|---|

Data Type values:
- **real** — computed from database tables via API
- **derived** — computed from other real values (e.g., reply rate = replied/sent)
- **mock** — imported from mock files or lib re-exports of mock data
- **static** — hardcoded inline in component

Owner Test values:
- **OWNER-TEST** — this data flow requires live human interaction to verify (SMS delivery, voice call, email receipt, widget interaction, etc.). These rows are tested by the owner in Sweep 7.5.
- *(blank)* — can be verified through automated tests or agent-driven checks

Rules:
- Every metric tile, data table, chart, and interactive element gets a row
- "mock" or "static" in Data Type = gap that must be resolved before RC (or explicitly deferred with justification)
- Each row must eventually map to a verification test or verification method (generated in Sweep 4)
- Rows flagged OWNER-TEST must be verified during Sweep 7.5 (Owner Live Testing Session)
- This matrix becomes a permanent release discipline artifact — not a one-time exercise

Example rows (to be completed in execution):

| UI Surface | Endpoint | Handler | Table | Transform | Value | Type | Owner Test | Test |
|---|---|---|---|---|---|---|---|---|
| Main — Active Pipeline | /api/metrics/pipeline | getPipelineMetrics() | warehouse_leads | COUNT where created 14d, excl Lost/Sold/Dup | integer | real | | pending |
| Insights — Leads Chart | none | none | none | none | static array | mock | | FAIL — must wire |
| Widget — Contact Form | POST /api/widget/contact | createWidgetContact() | conversations | create conversation + first message | conversation ID | real | OWNER-TEST | pending |
| Outbound — SMS Delivery | POST /api/outbound/sms | sendSms() | outbound_log + TextMagic | send via TextMagic API | delivery status | real | OWNER-TEST | pending |
| Outbound — Email Delivery | POST /api/outbound/email | sendEmail() | outbound_log + Resend | send via Resend API | delivery status | real | OWNER-TEST | pending |
| Inbound — Voice Call | VAPI webhook | handleVapiWebhook() | conversations | create/update conversation from inbound call | conversation record | real | OWNER-TEST | pending |
| Service — Reply Rate | /api/metrics/dashboard | getDashboardMetrics() | campaigns | replied/sent*100 | percentage | derived | | pending |

**Outputs:**
- ISSUES.md (living issue tracker, initially populated from GAPS.md + contradictions + false positives)
- Continuity Matrix
- Observability Matrix

**Approval gate:** Owner reviews the matrices to confirm traceability coverage before proceeding.

---

## Sweep 2.5 — Stabilization Blueprint

**Objective:** Synthesize the outputs of Sweep 1 and Sweep 2 into a single document that describes the stabilization approach before governance files are rebuilt.

**Inputs:**
- Truth Hierarchy Declaration (Sweep 1A)
- AC Reconciliation Table (Sweep 1B)
- Chat Architecture Decision Record (Sweep 1C)
- ISSUES.md (Sweep 2A)
- Continuity Matrix (Sweep 2B)
- Observability Matrix (Sweep 2C)

**Output — Stabilization Blueprint describing:**
- Which gaps are RC-blocking vs deferred (with justification)
- How the canonical decisions shape the remediation approach:
  - Main chat canonical → Replit integration must be thinned or deprecated in Sweep 5
  - Org-centered identity model → all new schema work enforces org ownership
  - Runtime UI is T1 → backend adapts to UI, not vice versa
  - Observability is permanent → test infrastructure must support ongoing lineage verification
- Dependencies between remediation sweeps
- Estimated scope per sweep
- Risk assessment for each sweep

**Approval gate:** Owner must review and approve the Stabilization Blueprint before Sweep 3 (governance rebuild) begins.

---

## Sweep 3 — Rebuild Governance

**Objective:** Produce new governance documents as PROPOSED drafts. Nothing becomes authoritative until the owner approves each document individually.

### Governance Promotion Rule

Every rewritten governance document follows this lifecycle:
1. Draft created and clearly labeled PROPOSED
2. Presented to owner for review
3. Explicitly approved by owner
4. Promoted into live governance status (PROPOSED header removed)

Silent promotion is forbidden. No governance document becomes authoritative without completing all four steps.

### Governance Circuit Breaker (specification for R11 in GUARDRAILS.md)

Governance documents define the operational rules of the system and must not be silently modified.

**Governance documents:**
- PLAN.md
- GUARDRAILS.md
- replit.md
- CLAUDE.md
- ACCEPTANCE_CRITERIA.md
- Agent-roles document
- Any document explicitly marked as governance in replit.md

**These files may only change through the Governance Promotion Workflow (steps 1-4 above).**

**Restrictions:**
- Agents must never overwrite a governance document directly
- Agents must never promote a proposed document automatically
- Agents must never mark governance changes as complete without approval

**Detection behavior:**
If an agent detects that a task would modify a governance document outside the promotion workflow, it must:
1. Stop execution immediately
2. Report the attempted change
3. Request explicit approval before continuing

**Violation handling:**
If a governance document appears to have been modified without the promotion workflow, the agent must treat the file as potentially contaminated, halt the session, and request instructions.

### Step 3A — Rebuild replit.md

Rewrite as a session index — the "table of contents" that every agent session loads first.

Must explicitly reference all of the following files with purpose, status, and enforcement scope:

| File | Purpose | Status Category |
|---|---|---|
| `STABILIZATION_PLAN.md` | Stabilization roadmap (sweeps) | Live |
| `PLAN.md` | Forward roadmap (phases) | Governance — promotion workflow |
| `GUARDRAILS.md` | Agent rules and constraints | Governance — promotion workflow |
| `CLAUDE.md` | Agent context and project structure | Governance — promotion workflow |
| `ACCEPTANCE_CRITERIA.md` | Canonical requirements | Governance — promotion workflow |
| `ISSUES.md` | Living issue tracker (gaps, bugs, problems) | Living document — updated during work |
| `MEMORY.md` | Chronological session log | Living document — updated each session |
| `GAPS.md` | Original gap register (81 items) | Reference — being merged into ISSUES.md in Sweep 2A, then retired |
| `shared/schema.ts` | Canonical data model | Contract |
| `server/storage.ts` | Storage interface | Contract |
| `server/routes.ts` | API routes | Contract |
| Agent-roles document | Agent scope and controls | Governance — promotion workflow |
| `audits/` folder | Audit findings of record | Reference (frozen) |
| `testing/` folder | 12 test battery files (owner-uploaded) | Reference — adapted in Sweep 4 |
| `sweep_0_report.md` | Sweep 0 deliverables and self-certification | Sweep output |
| `.agent_docs/acceptance_criteria.md` | Derived verification/test layer (NOT canonical AC) | Reference — subordinate to root AC |
| `PRD.md` | Product requirements document | Reference — not quarantined but not authoritative for implementation decisions |
| `.agent_docs/rules/agent-roles.md` | Original agent role definitions | Quarantined — superseded by Sweep 3D |
| `.agent_docs/rules/code-conventions.md` | TypeScript/naming conventions | Reference — potentially reusable |
| `.agent_docs/rules/file-management.md` | File scope and commit rules | Quarantined — stale |
| `.agent_docs/rules/testing-protocol.md` | Test conventions referencing non-existent spec.ts | Quarantined — stale |
| Quarantined documents (7 files) | Stale/retired docs with header notices | Quarantined — reference only |

Additional sections:
- Truth hierarchy (from Sweep 1A)
- Canonical identity model (org-centered tenancy)
- Terminology key: Waves = old PLAN.md, Sweeps = stabilization, Phases = new PLAN.md
- Project architecture summary

### Step 3B — Rebuild PLAN.md

- Numbered phases (P0 through P10+) replacing old wave/sprint numbering — "Phases" is the canonical PLAN.md vocabulary (distinct from "Waves" in the old PLAN.md and "Sweeps" in the stabilization plan)
- Each phase maps to AC IDs via the Continuity Matrix
- Minimum release criteria defined as a named milestone (not the endpoint)
- Post-MVP roadmap as subsequent milestones
- Sprint report template for showing AC results at each gate
- Self-verification gates per task with mandatory stop-and-approve

### Step 3C — Rebuild GUARDRAILS.md

- Preserve existing rules R1-R10 (verify they match audit baseline)
- Add R11: Governance Circuit Breaker (as specified above)
- Strengthen agent controls:
  - Mandatory stop-and-approve gates after self-certification
  - No overwriting governance files without promotion workflow
  - No marking gaps resolved without evidence and approval
  - No silent fallbacks to mock data
  - Observability and continuity checks as part of gate criteria

### Step 3D — Define Agent Roles & Controls

- Roles: Architect, Implementer, Tester, Scribe
- File scope per role (which files each role can touch)
- Approval chain (who approves what)
- Stop conditions for each role
- Cross-role handoff procedures

### Step 3E — Rebuild CLAUDE.md

- Remove references to non-existent files ("Constitution", stale directories)
- Fix truth hierarchy to match Sweep 1A declaration
- Resolve SRS appearing at two priority levels (SRS is now quarantined — reference only)
- Update file structure to match actual codebase
- Update role count, table count, route count to match reality
- Reference canonical identity model

**Outputs (all as PROPOSED drafts):**
- PROPOSED replit.md
- PROPOSED PLAN.md
- PROPOSED GUARDRAILS.md (with R11)
- PROPOSED agent-roles document
- PROPOSED CLAUDE.md

**Approval gate:** Owner reviews and approves each document individually. Only approved documents get promoted to live status.

---

## Sweep 4 — Test Infrastructure Setup

**Objective:** Prepare the test framework, test catalog, observability test structure, and AC mapping. This sweep does NOT run the full test battery — that happens in Sweep 8.

**Main actions:**
- Set up test framework (Vitest for unit/integration, Playwright for E2E)
- Take the 12 uploaded test battery files in `testing/` and adapt them to the current AC state:
  - Remove tests for deliberately deferred features (Wave 5 items, Stripe, Marketing Studio)
  - Add tests for features that exist but aren't covered
  - Map each test to AC IDs via the Continuity Matrix
  - Map each test to Observability Matrix rows where applicable
- Generate observability test stubs from Observability Matrix rows:
  - Each row in the matrix must map to a verification test or verification method
  - Tests verify that displayed values can be traced back through the stack
  - "mock" or "static" data type rows generate failing test stubs (expected to fail until remediation)
- Create test coordinator document:
  - Maps test batteries to AC criteria
  - Maps test batteries to Observability Matrix rows
  - Shows coverage: which rows have automated tests, which have manual verification, which have no coverage yet

**Test battery files to adapt:**
1. `battery_01_agent_config.md` — Agent configuration tests
2. `battery_02_widgets_pages.md` — Widget and landing page tests
3. `battery_03_inbound.md` — Inbound communication tests
4. `battery_04_outbound.md` — Outbound communication tests
5. `battery_05_calendar.md` — Calendar and appointment tests
6. `battery_06_e2e_final.md` — End-to-end flow tests
7. `data_paths_and_user_stories.md` — Data path verification
8. `master_diagram.txt` — System architecture reference
9. `master_prompt_and_diagram.md` — Test prompt patterns
10. `master_test_coordinator.md` — Coordination framework
11. `release_criteria.md` — Release gate criteria
12. `test_strategy_toc.txt` — Strategy table of contents

**Outputs:**
- Configured test framework
- Adapted test battery files (mapped to ACs and Observability Matrix)
- Observability test stubs (generated from matrix rows)
- Test coordinator document

**Approval gate:** Owner reviews the test catalog and mapping before remediation begins.

---

## Sweep 5 — Schema & Backend Remediation

**Objective:** Fix structural backend issues in priority order.

**Schema change rule:** All schema changes must be implemented through versioned Drizzle migrations. Direct schema edits (e.g., `drizzle-kit push` without a migration file) are not allowed during stabilization. Each migration must be reviewable and reversible.

**Ordering (by priority):**

### 5.1 Canonical Architecture Decisions

Execute the chat architecture decision from Sweep 1C:
- Resolve the dual schema conflict (`shared/models/chat.ts` vs `shared/schema.ts`)
- Either thin the Replit chat integration to proxy into main chat system, or deprecate and remove its separate tables
- Ensure the canonical identity model is enforced: conversations belong to orgs, messages belong to conversations
- Remove or isolate duplicate `conversations` and `messages` table definitions

### 5.2 Security Issues

- Add TextMagic webhook secret validation (currently rate-limited only, no signature check)
- Fix multi-org routing fallback in VAPI and TextMagic webhooks (currently falls back to first org in database — must fail explicitly or route correctly)
- Review invite email path that bypasses all CommGate safety checks

### 5.3 Persistence & State Integrity

- Fix campaign execution to persist state to database instead of in-memory Map (`activeExecutions` in `server/outbound.ts`)
- Address mid-stream AI response loss (user message saved before stream, assistant response saved only after stream completion — browser close loses response)
- Add database-level campaign execution status tracking

### 5.4 Stub Route Completion

- Wire forgot-password route (currently logs and returns placeholder)
- Wire reset-password route (currently returns placeholder message)

### 5.5 Performance & Indexing

- Add ON DELETE CASCADE to foreign key relationships
- Add indexes beyond PK/UNIQUE (conversation lookups by org, message lookups by conversation, campaign lookups by org/department, etc.)
- Generate initial migration files for current schema state
- Set up migration infrastructure for future schema changes

**Outputs:**
- Schema changes with versioned migrations
- Updated storage interface
- Fixed routes
- Backend test coverage for changed code

**Approval gate:** Self-certify, then stop and present results for owner approval before frontend work.

---

## Sweep 6 — Frontend Remediation

**Objective:** Remove mock data from production paths and wire remaining features to real backends.

**Main actions:**

### 6.1 High-Priority Mock Removal

- Wire Insights page to real backend data (biggest single gap — 100% mock, ~1964 lines, 23+ data imports from `lib/insight-data.ts`)
- Remove mock imports from My Work chat tab (`mockConversations` from `@/mocks/messages`, `mockTeamboxConversations` from `@/mocks/conversations`)
- Wire TopBar Activity Feed to real `activity_log` API (currently uses `staticActivityFeed` from `lib/activity-utils.ts` despite Wave 3.2 building the real API)

### 6.2 Demo-Mode Categorization

Categorize the ~25 "demo mode" toast actions into:
- **Wire now (RC-critical):** Actions that block release criteria
- **Defer (post-MVP):** Actions that can remain as placeholders with appropriate UI indication

Known demo-mode actions from audit:
- Settings: universal widget settings save, widget config save, landing page save, API key rotation, webhooks save, KB URL add/scrape, system prompt save, agent behavior save, skill save/delete, kill switch confirm, hunches config save, data upload, tool toggling, send embed instructions
- Billing: send invoice, add manual add-on, preview invoice, view invoice
- Insights: export data, hunch dismiss, lead ID click
- OrgWizard: create organization (no API POST)

### 6.3 OrgWizard Wiring

- Wire OrgWizard 7-step form to POST to organization creation API

### 6.4 Orphaned Mock Cleanup

- Delete orphaned mock files with zero consumers (from Sweep 0 catalog)
- Remove `lib/insight-data.ts` after Insights page is wired to real data
- Clean up stale comments in source files that reference mock data (identified in frontend audit)

**Outputs:**
- Updated frontend pages
- Mock dependency report (before/after)
- Continuity Matrix updated with new wiring
- Observability Matrix updated with new data paths

**Approval gate:** Self-certify, then stop and present results for owner approval.

---

## Sweep 7 — Integration Remediation (Release-Critical)

**Objective:** Make the VAPI + Tavus + landing page + widget communication path work end-to-end.

**Main actions:**

### 7.1 VAPI Voice Outbound

- Replace `console.log` stub in `sendPhone()` (`server/outbound.ts`) with actual VAPI outbound call API integration
- Verify voice outbound respects all 4 safety layers (global env → org gate → channel toggle → rate limit)

### 7.2 Tavus Video

- Add outbound video capability (currently read-only proxy for personas, replicas, conversations)
- Wire video message/meeting creation through Tavus API
- Ensure video follows the canonical identity model (org-scoped)

### 7.3 Widget Landing Page

- Wire widget chat to real backend (currently simulated with 1.5s delay)
- Wire video/voice mode to real VAPI/Tavus connections (currently UI only)
- Wire contact form to real API (currently local state, shows success without API call)
- Ensure widget interactions create real conversations visible in TeamBox

### 7.4 End-to-End Verification

- Verify: inbound call → VAPI webhook → conversation created → visible in TeamBox
- Verify: widget chat interaction → real backend → conversation created → visible in TeamBox
- Verify: outbound campaign (SMS) → TextMagic → delivery → webhook → conversation updated
- Verify: outbound campaign (email) → Resend → delivery status

**Outputs:**
- Working integration code
- Observability Matrix updated with integration data paths
- Integration test results
- End-to-end flow verification report

**Approval gate:** Self-certify, then stop and present results for owner approval.

---

## Sweep 7.5 — Owner Live Testing Session

**Objective:** Owner personally exercises every real data flow end-to-end, on computer and phone, to verify that integrations work with real human interaction. This is the point where the owner sits down and acts as a customer, a lead, an agent, and a manager.

**Why this exists:** Automated tests and agent-driven verification can confirm code paths and API responses, but they cannot confirm that a real person receives a real text message, hears a real voice call, sees a real email arrive, or experiences a real video interaction. This sweep is the human-in-the-loop validation that no automated process can replace.

**Prerequisites (must be complete before this sweep begins):**
- Sweep 5 (schema/backend) complete — all persistence is real
- Sweep 6 (frontend) complete — all mock data removed from RC paths
- Sweep 7 (integrations) complete — VAPI, Tavus, TextMagic, Resend all wired

**What the owner will test:**

### 7.5.1 — Widget & Inbound Flows (owner acts as customer)
- [ ] Open widget landing page on phone browser
- [ ] Fill out contact form → verify it creates a real conversation in TeamBox
- [ ] Start a web chat through widget → verify messages appear in TeamBox in real time
- [ ] Initiate a voice call through widget → verify VAPI handles it → verify conversation appears in TeamBox
- [ ] Initiate a video session through widget → verify Tavus handles it → verify conversation appears in TeamBox

### 7.5.2 — Outbound Flows (owner acts as agent/manager)
- [ ] Send an outbound SMS campaign → verify TextMagic delivers it → verify owner's phone receives the text
- [ ] Reply to the SMS from phone → verify TextMagic webhook fires → verify reply appears in conversation
- [ ] Send an outbound email → verify Resend delivers it → verify owner's inbox receives the email
- [ ] Initiate an outbound voice call → verify VAPI places the call → verify owner's phone rings
- [ ] Verify all outbound actions respect the Communication Gate (toggle off → verify sends are blocked)

### 7.5.3 — AI Agent Interaction (owner acts as customer talking to AI)
- [ ] Chat with an AI agent through the main app → verify responses are contextual and use tools
- [ ] Chat with an AI agent through the widget → verify same quality of response
- [ ] Verify agent respects kill switch (toggle off → verify agent stops responding)
- [ ] Verify agent respects safety layers (rate limits, channel toggles)

### 7.5.4 — Data Flow Verification (owner acts as manager reviewing data)
- [ ] After all interactions above, check dashboard metric tiles → verify they reflect the real activity
- [ ] Check TeamBox → verify all conversations from the test session are visible with correct status
- [ ] Check activity log → verify all actions are logged
- [ ] Check campaign results → verify delivery status matches reality
- [ ] Check Insights page → verify it shows real data (not mock)

**What I (the agent) will prepare before this sweep:**
- A step-by-step test script with exact URLs, credentials, and expected outcomes
- Observability Matrix rows flagged with `OWNER-TEST` so you know which data paths you're verifying
- A results capture template for you to mark pass/fail on each item

**Outputs:**
- Owner's pass/fail results on each test item
- Any new issues discovered → added to ISSUES.md
- Observability Matrix rows marked as OWNER-VERIFIED or FAIL

**Approval gate:** Owner completes testing and reports results. Any failures get logged in ISSUES.md and must be resolved before Sweep 8 proceeds.

---

## Sweep 8 — Verification Pass

**Objective:** Dedicated pre-RC verification pass. No new features — only verification.

**Checks:**

### 8.1 Mock & Placeholder Verification
- No unresolved mock imports in production paths (grep for `@/mocks/` imports, `lib/insight-data` imports)
- No demo-mode placeholders where release-critical behavior is required
- No stub routes for required flows

### 8.2 Architecture Verification
- No unresolved platform duplication for canonical systems (chat architecture resolved)
- Canonical identity model enforced (all entities org-scoped, messages through conversations)

### 8.3 Governance Verification
- No governance contradictions blocking release evaluation
- All governance documents in live status (promoted through Governance Promotion Workflow)

### 8.4 Continuity Verification
- Continuity Matrix is complete (every RC-required UI surface has a full row with no gaps)
- Every AC ID mapped to a verification method

### 8.5 Observability Verification
- Observability Matrix is complete (every displayed value traces back through the stack)
- Every Observability Matrix row has a corresponding verification method (automated test, manual test plan, or explicit deferral with justification)
- All critical rows (RC-blocking features) have automated tests
- Observability Matrix coverage report:
  - % of rows with automated tests
  - % of rows with manual tests
  - % of rows with no coverage (must be zero for RC-blocking rows)

### 8.6 Test Execution
- All RC-critical test batteries pass
- Enforcer script passes
- Observability tests pass

**Outputs:**
- Verification sweep report (pass/fail per check)
- Updated Continuity Matrix (final)
- Updated Observability Matrix (final)
- Observability coverage report

**Approval gate:** Owner reviews the sweep results before the RC gate.

---

## Sweep 9 — Release Candidate Gate

**Objective:** Produce the RC Readiness Report and get the go/no-go decision.

### RC Readiness Report

A single artifact containing:

| Section | Contents |
|---|---|
| AC Pass/Fail Summary | From Continuity Matrix — which ACs pass, which fail, which are deferred with justification |
| Release-Critical Integrations | Status of VAPI (voice), Tavus (video), TextMagic (SMS), Resend (email), VinSolutions (CRM) |
| Open Critical Issues | From ISSUES.md — any remaining HIGH severity items |
| Risk Summary | Residual risks, mitigations in place, risks accepted |
| Continuity Coverage | % of UI surfaces with complete traceability chain |
| Observability Coverage | % of displayed values with verified data lineage |
| Recommendation | ship / ship-with-known-issues / hold |

**Approval gate:** Hard stop. Owner makes the go/no-go call. No work proceeds past this gate without explicit approval.

---

## Sweep 10+ — Post-MVP Roadmap

Items deferred beyond the RC milestone:

- Remaining Wave 5 items: Google Calendar sync, Dealer.com integration, Tekion integration
- Billing/Stripe integration (currently 100% hardcoded demo data)
- RLS policies for multi-tenant security (repeatedly deferred through Waves 2-4)
- Historical trend computation for dashboard metric tiles (currently all `change: 0` or `change: 'live'`)
- Marketing Studio (currently "Coming Soon" placeholder)
- Advanced analytics pipelines for Insights page (beyond basic wiring done in Sweep 6)
- Formal deprecation/removal of quarantined documents (once governance rebuild is stable and proven through at least one RC cycle)
- Profile preferences persistence (currently local state only)
- Accessibility audit (W4-AC-402 — no evidence of audit)

---

## Key Architectural Decisions (settled)

| # | Decision | Resolution | Decided By |
|---|---|---|---|
| 1 | Canonical chat architecture | Main app chat. Replit integration is adapter-only, trending toward deprecation. | Owner |
| 2 | Canonical AC source | Root ACCEPTANCE_CRITERIA.md. .agent_docs is derived test layer. | Owner |
| 3 | Canonical truth hierarchy | Runtime UI → canonical AC → approved PLAN → contracts/schema → audit artifacts → quarantined docs | Owner |
| 4 | Legacy document disposition | Reference-only now. Deprecated/archived after RC gate. | Owner |
| 5 | Observability as discipline | Permanent release discipline — not one-time. | Owner |
| 6 | Canonical identity model | Org-centered tenancy. All major entities attach to org. Messages attach through conversations. | Owner |

---

## Artifacts This Plan Will Produce

| Artifact | Created In | Purpose |
|---|---|---|
| Quarantine Inventory | Sweep 0 | Which files are quarantined, why, what they still contain |
| Truth Hierarchy Declaration | Sweep 1A | Single-page canonical source-of-truth order |
| AC Reconciliation Table | Sweep 1B | Conflict-by-conflict resolution of the two AC documents |
| Chat Architecture Decision Record | Sweep 1C | Canonical chat model, evaluation criteria, Replit integration disposition |
| ISSUES.md | Sweep 2A | Living issue tracker — all gaps, bugs, problems; risk-ranked, with AC traceability and RC-blocking flags |
| Continuity Matrix | Sweep 2B | UI surface → AC ID → PLAN task → endpoint → data source → verification method |
| Observability Matrix | Sweep 2C | UI surface → endpoint → handler → table → computation → displayed value → data type → test status |
| Stabilization Blueprint | Sweep 2.5 | Synthesis of Sweep 1-2 outputs into remediation strategy |
| PROPOSED governance docs | Sweep 3 | replit.md, PLAN.md, GUARDRAILS.md (with R11), agent-roles, CLAUDE.md |
| Test catalog & coordinator | Sweep 4 | Test batteries mapped to ACs and Observability Matrix rows |
| Owner Live Test Script | Sweep 7.5 (prep) | Step-by-step test script with URLs, credentials, expected outcomes |
| Owner Live Test Results | Sweep 7.5 | Pass/fail on each live data flow test item |
| Verification sweep report | Sweep 8 | Pass/fail per check, Observability Matrix coverage |
| RC Readiness Report | Sweep 9 | Go/no-go decision document with full coverage summaries |

---

## Governance Documents List (for R11 enforcement)

| Document | Current Status | Target Status |
|---|---|---|
| PLAN.md | Potentially contaminated (was overwritten by previous agent) | Rebuilt in Sweep 3B as PROPOSED |
| GUARDRAILS.md | Potentially contaminated (was overwritten by previous agent) | Rebuilt in Sweep 3C as PROPOSED (with R11) |
| replit.md | Potentially contaminated (was overwritten by previous agent) | Rebuilt in Sweep 3A as PROPOSED |
| CLAUDE.md | Live (from audit baseline) | Rebuilt in Sweep 3E as PROPOSED |
| ACCEPTANCE_CRITERIA.md | Live (canonical AC source per owner decision) | Retained — updated only through promotion workflow |
| Agent-roles document | Does not exist yet | Created in Sweep 3D as PROPOSED |

---

## Standard Practices

### Post-Sweep Drift Check (mandatory after every sweep)

After completing each sweep, before presenting results to the owner:
1. Verify all planned outputs were produced and placed correctly
2. Cross-reference outputs against the stabilization plan, ACCEPTANCE_CRITERIA.md, and ISSUES.md
3. Check for unintended modifications to files outside the sweep's scope
4. Verify internal consistency (no stale references, no contradictions introduced)
5. Update MEMORY.md with the session's work
6. Document any drift items found and their resolutions in the sweep report

This practice applies equally to future phases in PLAN.md and any sprint/milestone work.

---

## Principle

No code changes happen until this plan is approved.
No governance document is overwritten without the Governance Promotion Workflow.
No gap is marked resolved without evidence and owner approval.
