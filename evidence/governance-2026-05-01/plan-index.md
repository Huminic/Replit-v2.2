# Plan Index — Governance Preservation Pass 2026-05-01

Comprehensive classification of every `plan.md` / `*-plan.md` / `tomorrow-plan.md` / `overnight-validation-plan.md` / `lanes-*-plan.md` discoverable under `evidence/`, `docs/`, project root, `tests/`, and `legacy-artifacts/`.

**Authoritative current plan (pinned):** `/home/ubuntu/Claude-store/nexxus2.2_replit/evidence/stabilization-sprint-2026-05-01/tomorrow-plan.md`
- Date covered: **2026-05-01** (today's plan; "tomorrow" was authored 2026-04-30 evening UTC and refers to 2026-05-01)
- Operator standing order embedded: NO deploys / pushes / code edits unless production outage AND specific operator approval. This pass honored the order.
- **Forward note:** the next planning artifact (covering 2026-05-02) does not yet exist. When created, it should explicitly supersede `tomorrow-plan.md`.

---

## Active

| Path | Last modified | Author/Source | Purpose |
|---|---|---|---|
| `/home/ubuntu/Claude-store/nexxus2.2_replit/evidence/stabilization-sprint-2026-05-01/tomorrow-plan.md` | 2026-04-30 06:25 UTC | orchestrator overnight | **AUTHORITATIVE** — priority queue for 2026-05-01 (P0 routing redirect, P1 metric honesty, P2 tooling) |
| `/home/ubuntu/Claude-store/nexxus2.2_replit/plan.md` | 2026-04-29 15:54 UTC | operator-curated | Top-level living finish plan for Nexxus v2.2 (UI-truth posture, operating constraints). Long-horizon roadmap; not a daily plan. |

`tomorrow-plan.md` is operationally authoritative for 2026-05-01. `plan.md` is the long-horizon strategy plan and is referenced by daily plans, not superseded by them.

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
