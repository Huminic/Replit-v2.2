# Plan Index — Governance Preservation Pass 2026-05-01

Comprehensive classification of every `plan.md` / `*-plan.md` / `tomorrow-plan.md` / `overnight-validation-plan.md` / `lanes-*-plan.md` discoverable under `evidence/`, `docs/`, project root, `tests/`, and `legacy-artifacts/`.

**Authoritative current plan (pinned 2026-05-01):** `/home/ubuntu/Claude-store/nexxus2.2_replit/evidence/stabilization-sprint-2026-05-01/finish-line-plan.md`
- Approved at ExitPlanMode 2026-05-01 by operator with the standing constraint: "as long as we can test thoroughly before pushing live, you are approved to dive in and continue in auto mode."
- Plan-mode authoring artifact: `~/.claude/plans/moonlit-booping-popcorn.md` (source of truth; evidence files are derivative).
- Companion evidence: `finish-line-preflight.md` (Phase 0 GREEN), `finish-line-agent-dispatches.md` (six dispatches for fresh real-agent sessions).
- **Supersedes:** `tomorrow-plan.md` (formerly authoritative; now SUPERSEDED).
- **Forward note:** future planning artifacts must be named with absolute date (e.g. `2026-05-NN-finish-line-plan.md`) and explicitly state what they supersede.

---

## Active

| Path | Last modified | Author/Source | Purpose |
|---|---|---|---|
| `/home/ubuntu/Claude-store/nexxus2.2_replit/evidence/stabilization-sprint-2026-05-01/finish-line-plan.md` | 2026-05-01 | main orchestrator session | **AUTHORITATIVE — active sprint plan.** Three-batch finish-line plan (Data Truth → Workflow Proof → UI/E2E). Includes Operational Risk Gate (Known Defects · Execution Risks · Accepted Debt · Governance Guardrails). |
| `/home/ubuntu/Claude-store/nexxus2.2_replit/evidence/stabilization-sprint-2026-05-01/finish-line-preflight.md` | 2026-05-01 | derivative of finish-line-plan.md | Phase 0 GREEN preflight — companion to finish-line-plan.md |
| `/home/ubuntu/Claude-store/nexxus2.2_replit/evidence/stabilization-sprint-2026-05-01/finish-line-agent-dispatches.md` | 2026-05-01 | derivative of finish-line-plan.md | Six dispatches (Schema, Reports, Metrics, Marketing Insights, Workflow QA, TeamBox Operability) for fresh real-agent sessions |
| `/home/ubuntu/Claude-store/nexxus2.2_replit/plan.md` | 2026-04-29 15:54 UTC | operator-curated | Top-level long-horizon finish plan for Nexxus v2.2 (UI-truth posture, Phases 1–5 + 6). Stable across sprints; informs `finish-line-plan.md`. |

Two-file authority: `plan.md` (long-horizon strategy) + `finish-line-plan.md` (active sprint). Companion evidence files are derivatives of the sprint plan.

---

## Superseded (specific date past, replaced by next-day plan)

| Path | Last modified | Author/Source | Purpose | Superseded-by |
|---|---|---|---|---|
| `/home/ubuntu/Claude-store/nexxus2.2_replit/evidence/stabilization-sprint-2026-04-30/plan.md` | 2026-04-30 01:48 UTC | operator-confirmed pre-flight | Stabilization Sprint 2026-04-30 plan-of-record (chunks 1A→2A→2B→3 — all DONE) | `tomorrow-plan.md` (forward planning) |
| `/home/ubuntu/Claude-store/nexxus2.2_replit/evidence/stabilization-sprint-2026-04-30/lanes-4-8-plan.md` | 2026-04-30 06:01 UTC | orchestrator | Overnight read-only Lanes 4–8 plan (Sales reports, TeamBox taxonomy, Marketing, Metrics, handoff) | `overnight-validation-report.md` (executed) |
| `/home/ubuntu/Claude-store/nexxus2.2_replit/evidence/stabilization-sprint-2026-04-30/overnight-validation-plan.md` | 2026-04-30 05:54 UTC | orchestrator | Overnight Nexxus validation + E2E + TeamBox discovery plan | `overnight-validation-report.md` (executed) |

---

## Historical (completed sprints, kept for audit)

| Path | Last modified | Author/Source | Purpose |
|---|---|---|---|
| `/home/ubuntu/Claude-store/nexxus2.2_replit/evidence/WAVE-PE3/comms-workflow-eval-plan.md` | 2026-04-13 | wave-pe3 sprint | Comms workflow eval plan for wave-pe3 (merged into main 2026-04-29 PR #1) |
| `/home/ubuntu/Claude-store/nexxus2.2_replit/evidence/QA-S8/remediation-plan.md` | 2026-03-30 | QA-S8 sprint | Pre-launch QA remediation plan (sprint closed) |
| `/home/ubuntu/Claude-store/nexxus2.2_replit/legacy-artifacts/.governor/evidence/E-013/comms-test-plan.md` | 2026-04-25 | legacy harness | Pre-2026-04-23 governor comms-test plan |
| `/home/ubuntu/Claude-store/nexxus2.2_replit/legacy-artifacts/.governor/evidence/E-013/remediation-plan.md` | 2026-04-25 | legacy harness | Pre-2026-04-23 E-013 remediation plan |
| `/home/ubuntu/Claude-store/nexxus2.2_replit/legacy-artifacts/.governor/evidence/E-013/verification-plan.md` | 2026-04-25 | legacy harness | Pre-2026-04-23 E-013 verification plan |
| `/home/ubuntu/Claude-store/nexxus2.2_replit/legacy-artifacts/plan.md` | 2026-04-25 | legacy harness | Predecessor of root `plan.md` (kept for historical reference per CLAUDE.md "Legacy artifacts" note) |

---

## Test-agent plan templates (orthogonal — used by test-agents, not project planning)

These are scenario plans owned by `tests/agents/`. Not part of the daily/sprint planning hierarchy. Listed for completeness only.

| Path | Last modified | Purpose | Classification |
|---|---|---|---|
| `/home/ubuntu/Claude-store/nexxus2.2_replit/tests/agents/plans/insights-plan.md` | 2026-04-25 | Insights test-agent scenarios | HISTORICAL/REFERENCE |
| `/home/ubuntu/Claude-store/nexxus2.2_replit/tests/agents/plans/integrations-plan.md` | 2026-04-12 | Integrations test-agent scenarios | HISTORICAL/REFERENCE |
| `/home/ubuntu/Claude-store/nexxus2.2_replit/tests/agents/plans/landing-pages-plan.md` | 2026-04-12 | Landing pages | HISTORICAL/REFERENCE |
| `/home/ubuntu/Claude-store/nexxus2.2_replit/tests/agents/plans/widgets-plan.md` | 2026-04-12 | Widgets | HISTORICAL/REFERENCE |
| `/home/ubuntu/Claude-store/nexxus2.2_replit/tests/agents/plans/infrastructure-plan.md` | 2026-04-12 | Infrastructure | HISTORICAL/REFERENCE |
| `/home/ubuntu/Claude-store/nexxus2.2_replit/tests/agents/plans/settings-plan.md` | 2026-03-28 | Settings | HISTORICAL/REFERENCE |
| `/home/ubuntu/Claude-store/nexxus2.2_replit/tests/agents/plans/billing-plan.md` | 2026-03-28 | Billing | HISTORICAL/REFERENCE |
| `/home/ubuntu/Claude-store/nexxus2.2_replit/tests/agents/plans/management-plan.md` | 2026-03-28 | Management | HISTORICAL/REFERENCE |
| `/home/ubuntu/Claude-store/nexxus2.2_replit/tests/agents/plans/marketing-plan.md` | 2026-03-27 | Marketing | HISTORICAL/REFERENCE |
| `/home/ubuntu/Claude-store/nexxus2.2_replit/tests/agents/plans/sales-plan.md` | 2026-03-27 | Sales | HISTORICAL/REFERENCE |
| `/home/ubuntu/Claude-store/nexxus2.2_replit/tests/agents/plans/service-plan.md` | 2026-03-27 | Service | HISTORICAL/REFERENCE |
| `/home/ubuntu/Claude-store/nexxus2.2_replit/tests/agents/plans/departments-plan.md` | 2026-03-27 | Departments | HISTORICAL/REFERENCE |
| `/home/ubuntu/Claude-store/nexxus2.2_replit/tests/agents/plans/teambox-plan.md` | 2026-03-27 | TeamBox | HISTORICAL/REFERENCE |
| `/home/ubuntu/Claude-store/nexxus2.2_replit/tests/agents/plans/chat-plan.md` | 2026-03-27 | Chat | HISTORICAL/REFERENCE |
| `/home/ubuntu/Claude-store/nexxus2.2_replit/tests/agents/plans/dashboard-plan.md` | 2026-03-27 | Dashboard | HISTORICAL/REFERENCE |
| `/home/ubuntu/Claude-store/nexxus2.2_replit/tests/agents/plans/auth-plan.md` | 2026-03-27 | Auth | HISTORICAL/REFERENCE |

---

## Supersedes / superseded-by relationships

```
plan.md  (long-horizon, 2026-04-29 last bumped)
   │
   └── informs ──► evidence/stabilization-sprint-2026-04-30/plan.md   (DONE → SUPERSEDED)
                          │
                          └── informs ──► evidence/stabilization-sprint-2026-04-30/lanes-4-8-plan.md   (DONE → SUPERSEDED)
                                                  │
                                                  └── informs ──► evidence/stabilization-sprint-2026-04-30/overnight-validation-plan.md   (DONE → SUPERSEDED)
                                                                          │
                                                                          └── output: overnight-validation-report.md
                                                                                          │
                                                                                          └── informs ──► evidence/stabilization-sprint-2026-05-01/tomorrow-plan.md   (ACTIVE)
```

---

## Date pinning (no "today / tomorrow" ambiguity)

| Phrase as written in `tomorrow-plan.md` | Pinned date |
|---|---|
| "Tomorrow's Plan" header | 2026-05-01 |
| "Overnight validation 2026-04-30 → 2026-05-01" | run-window: 2026-04-30 ~22:00Z to 2026-05-01 ~01:00Z |
| "Standing order from operator" | effective from 2026-05-01 onward |
| Plan title in `lanes-4-8-plan.md` "Overnight 2026-04-30 → 2026-05-01" | execution night: 2026-04-30 → 2026-05-01 |
| "Saturday checkpoint" reference in CLAUDE.md harness section | this referred to 2026-04-25 (pre-launch) — no longer active |

The next plan, when created, should be named with absolute date (e.g. `2026-05-02-plan.md`) to avoid the relative-date drift that this pass had to clean up.

---

## Files NOT classified

None. Every plan file discovered under the project root, `evidence/`, `docs/`, `tests/`, `legacy-artifacts/` is in this index.

## Files NOT deleted

None deleted. This pass is read-only on plan files. Classification only.
