# Nexxus v2.2 — Active Execution Plan

**Authority hierarchy:** This file authorizes execution. roadmap.md is the map. backlog.md is the queue. issues.md is defects/debt. evidence/ is proof. decisions.md is operator decisions.

**Hierarchy of work:** Roadmap → Phase → Wave → Chunk → Step.

**Active wave:** Wave 1C — Metric honesty (server-side). Owner: harness-backend teammate (when authorized). Audit: scope-guardian + code-reviewer + integration-safety (isolated subagents at gate, no team mailbox).

---

## Done so far in this release reset (PROVEN)

| Item | Evidence | Commit |
|---|---|---|
| Wave 1A — statusclassifier test | `evidence/stabilization-sprint-2026-04-30/1A/sprint/` | merged |
| Wave 1B — weekly-report sales-only filter | `evidence/stabilization-sprint-2026-05-01/finish-line-findings/02-reports.md` | 13ee709 |
| P0 routing redirect — PR #6 LIVE | `evidence/stabilization-sprint-2026-05-01/p0-pr-merge-verification/` | becb739 |
| Daily recap email scheduler (1A) | `evidence/stabilization-sprint-2026-04-30/1A/sprint/` | merged |
| SMS appointment-intent admin notify (1A) | same | merged |
| I-248 timezone validation hardening | `tests/unit/businessHours.test.ts` (9 unit tests) | merged 2026-04-30 |

---

## Phase status (PROVEN / PARTIAL / UNKNOWN / BROKEN / DEFERRED)

| # | Phase | Status | Next wave |
|---|---|---|---|
| 1 | Core: Auth + RBAC | PARTIAL | Wave I-Auth (read-only audit) |
| 1 | Core: Sales-vs-service classification | PROVEN | none |
| 1 | Core: CommGate / outbound | PROVEN | none |
| 1 | Core: Provider safety posture | PROVEN (TextMagic relaxed-verify carried as AD-3; I-248 timezone validation RESOLVED) | none |
| 1 | Core: Report/metric primitives | PARTIAL | **Wave 1C (active)** |
| 1 | Core: Audit/activity logging | PARTIAL (system-event filter pending) | rolled into Wave 1C |
| 1 | Core: Scheduler infra | PROVEN | none |
| 1 | Core: Harness session-marker | BROKEN (governance) | Wave 11-Gov |
| 2 | Entry + Shell | PARTIAL (console error route-independent unverified) | Wave 11-Gov + Wave 11A (route matrix) |
| 3 | TeamBox | PARTIAL | Wave 3A (Push-to-VIN remove) |
| 4 | Sales | PARTIAL | rolled into Wave 1C + Wave 3F |
| 5 | Insights + Reports + Metrics | PARTIAL | **Wave 1C (active)** + Wave 3F |
| 6 | Marketing | BROKEN (visible) | Wave 3B + 3C |
| 7 | Service | PARTIAL | Wave 2A |
| 8 | Widget + Public Entry | PARTIAL | Wave 2B |
| 9 | Management + Settings | PARTIAL (5 security items unclassified for v2.2 vs v2.3 — I-244/245/246/247/249) | Wave 9-Sec triage |
| 10 | Background Workflows | PARTIAL | Wave 2A |
| 11 | Release Gov + Final E2E | UNKNOWN (final pack not run) | Wave 11A |

---

## Wave roadmap (queued; each wave opens its own bookend)

| Wave | Phase | Title | Authorization |
|---|---|---|---|
| **1C** | 5 | **Metric honesty (server-side only)** | **ACTIVE — bookend at `evidence/wave-1C-metric-honesty/wave-bookend.md`** |
| I-Auth | 1 | Auth/account integrity audit (READ-ONLY) | OPEN — bookend at `evidence/wave-I-auth-integrity/wave-bookend.md` |
| 2A | 10 | Trigger 1 / Trigger 2 / service-campaign / webhook provider proof | queued |
| 2B | 8 | Widget chat / callback / form provider proof | queued |
| 3A | 3 | TeamBox Push-to-VIN button + route REMOVAL (UI scope markers required) | queued |
| 3B | 6 | Marketing tab routing fix (UI scope marker) | queued |
| 3C | 6 | Marketing Insights filter propagation (UI scope marker) | queued |
| 3D | 3 | TeamBox channel filter add — **OUT of v2.2 per locked D-H1 (BL-113 → v2.3); only re-enters v2.2 if operator unwinds the deferral** | not in v2.2 unless re-authorized |
| 3F | 5 | Insights/Sales label-only metric changes (UI scope markers pre-locked per session.md 2026-05-02) | queued |
| 9-Sec | 9 | Security triage — 5 items (I-244, I-245, I-246, I-247, I-249); v2.2 vs v2.3 placement | queued — opens with operator decision |
| 11A | 11 | Final E2E + go/no-go (includes Phase-2 route matrix walk) | queued |
| 11-Gov | 11 | Harness session-marker integrity + console-error finding (D-I3) | queued |

---

## Out of scope this release (DEFERRED — see roadmap.md)

- Schema migrations (BL-107)
- Marketing campaign UI buildout (BL-112)
- AI-role visual distinction (BL-108)
- Push-to-VIN ADF/XML rebuild (BL-109)
- Advanced notification rules (BL-110)
- Sales Coordinator (BL-111)
- TeamBox channel filter (BL-113 — deferred per D-H1)
- Lago billing
- Production-env separation remainder
- Dashboard Builder + Report Builder (was plan.md Phase 6 — moved to roadmap.md v2.3 map)

---

## Operator-decision boundaries

**TRUE OPERATOR DECISIONS (orchestrator stops and asks):**

- Phase 9 security triage v2.2 vs v2.3 (Wave 9-Sec opens with this question)
- Any push (per-push command preview)
- Any live deploy (per-deploy approval)
- Any DB write outside an approved migration
- Any provider send to non-allowlisted recipients
- Any UI scope marker creation (per file)
- D-I2 unpark (local main reconciliation)
- D-I3 issue text approval (console error row)
- Wave 1C closing → main (PR + merge approval)
- Unwinding any locked decision (D-H1, D-G1, D-A1, D-F1, D-B1)

**AGENT-VERIFIABLE (no operator interruption):**

- Phase status classifications PROVEN/PARTIAL/UNKNOWN/BROKEN/DEFERRED from existing evidence
- Wave 1C internal sequencing (chunks within scope)
- Audit subagent dispatch at gate
- Test-lane provider sends to allowlisted destinations after preflight + destination-classification table — **AGENT-VERIFIABLE while D-B1 holds; if D-B1 is rescinded, becomes per-action operator approval**

---

## Standing constraints

- Orchestrator never writes product code; uses team teammates for collaborative build/evidence; uses isolated Agent subagents for audit gates only.
- No git push autonomous. Every push presented with exact command + commit list, awaits chat approval.
- No live deploy autonomous.
- No DB write outside operator-approved migration.
- No provider action without preflight + destination-classification table + per-recipient `test-orgs-allowlist-check.sh` exit-0.
- UI files require per-file scope marker (`.claude/state/scope/<basename>.ok`) issued at chunk start.
- VIN writes through vin-safe-mcp prepare→review→execute→verify only.

---

## Standing parked items (do not act without explicit re-approval)

- **D-I2 — local main divergence** (47 files; 5658+/41-). Reset --hard rejected. Park documented at `evidence/governance-2026-05-01/local-main-divergence-2026-05-02.md`. Non-destructive option queued: rename local `main` → `archive/main-divergence-2026-05-02`, then `git checkout -B main origin/main`. NOT TO BE EXECUTED without operator approval.
- **Cosmetic legacy-file moves** (`PLAN.md` uppercase, `NEXXUS_UNIFIED_LAUNCH_PROMPT.md` → `legacy-artifacts/`) parked.

---

## Changelog

- 2026-05-05 — Release reset. plan.md narrowed to active-execution contract; full v2.2 component map moved to new roadmap.md. Wave 1C (server-only metric honesty) opened. Wave I-Auth (read-only auth/account integrity audit) opened. 8 product-logic deltas folded in. Runtime deviation (in-process teammate writes) accepted for governance text only — see `evidence/governance-reset-2026-05-05/runtime-deviation-in-process-teammate.md`.
