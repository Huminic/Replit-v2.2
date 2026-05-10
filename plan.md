# Nexxus v2.2 — Active Execution Plan

**Authority hierarchy:** This file authorizes execution. roadmap.md is the map. backlog.md is the queue. issues.md is defects/debt. evidence/ is proof. decisions.md is operator decisions.

**Hierarchy of work:** Roadmap → Phase → Wave → Chunk → Step. Waves are NOT sub-divided into A/B/C suffixes; each wave name in the roadmap below is canonical. Internal decomposition uses chunk numbers (S1, S2, T1, T2, G1, G2, etc.) inside the wave's bookend.

**Active wave:** Wave 3B closed 2026-05-10. Wave 3C DEFERRED to v2.3 per operator 2026-05-10 (marketing data + reports decisions are pending; UI stays as-is). Next: Wave 9-Sec (security triage).

---

## Done so far in this release reset (PROVEN)

| Item | Evidence | Branch HEAD |
|---|---|---|
| Wave 1A — statusclassifier test | `evidence/stabilization-sprint-2026-04-30/1A/sprint/` | merged pre-session |
| Wave 1B — weekly-report sales-only filter | `evidence/stabilization-sprint-2026-05-01/finish-line-findings/02-reports.md` | `13ee709` |
| P0 routing redirect — PR #6 LIVE | `evidence/stabilization-sprint-2026-05-01/p0-pr-merge-verification/` | `becb739` (live) |
| Daily recap email scheduler (1A) | same | merged pre-session |
| SMS appointment-intent admin notify (1A) | same | merged pre-session |
| I-248 timezone validation hardening | `tests/unit/businessHours.test.ts` | merged 2026-04-30 |
| **Wave 1C — Metric honesty (server-side)** | `evidence/wave-1C-metric-honesty/wave-bookend.md` + comprehensive E2E | merged 2026-05-07 |
| **Wave I-Auth — Auth/account integrity audit (read-only)** | `evidence/wave-I-auth-integrity/wave-bookend.md` | merged 2026-05-07 |
| **Wave 3F — Insights/Sales metric UI (em-dash threshold + chart fix + rename + work-center route)** | `evidence/wave-3F-insights-sales-ui/wave-bookend.md` + `evidence/wave-3F-B-insights-sales-ui/wave-bookend.md` (historical sub-wave naming) | merged 2026-05-07 |
| **Wave 11-Gov — Harness session-marker investigation + D-I3 console-error finding (read-only)** | `evidence/wave-11-gov-harness/wave-bookend.md` | merged 2026-05-07 |
| **Wave 2A — Direct outbound provider proof (SMS + VAPI chunks)** | `evidence/wave-2A-trigger-provider-proof/wave-bookend.md` | merged 2026-05-07 (chunks remaining: service-campaign, webhook) |
| **Wave 2B — Widget chat / callback / form provider proof** | `evidence/wave-2B-widget-provider-proof/wave-bookend.md` | merged 2026-05-09 (T1+T2+T3 PASS; video + inbound webhooks remain in deferred bucket per dev-env block) |
| **Wave 3A — TeamBox Push-to-VIN UI STUB** (route REMOVAL deferred per operator pivot 2026-05-09) | `evidence/wave-3A-push-to-vin-stub/wave-bookend.md` | merged 2026-05-10 (S1+S2+S3 PASS; route handler byte-unchanged; backlog entry BL-001 filed) |
| **Wave 3B — Marketing agent functionality fix** (re-scoped per operator 2026-05-10: NOT a UI/routing change; rotated OPENAI_API_KEY) | `evidence/wave-3B-marketing-agent-fix/wave-bookend.md` | merged 2026-05-10 (3 phases PASS; config-only fix; zero source-code changes; 2 carry-forward issues filed) |

---

## Phase status (PROVEN / PARTIAL / UNKNOWN / BROKEN / DEFERRED)

| # | Phase | Status | Next wave |
|---|---|---|---|
| 1 | Core: Auth + RBAC | PARTIAL (5 new auth defects from I-Auth filed; v2.2 vs v2.3 split pending) | Wave 9-Sec |
| 1 | Core: Sales-vs-service classification | PROVEN | none |
| 1 | Core: CommGate / outbound | PROVEN (Wave 2A SMS proof confirms TestLane gate) | none |
| 1 | Core: Provider safety posture | PROVEN | none |
| 1 | Core: Report/metric primitives | PROVEN (Wave 1C closed) | none |
| 1 | Core: Audit/activity logging | PARTIAL (architectural finding: outbound_log lacks provider_message_id; processOutboundSend doesn't write activity_log) | follow-up; not v2.2 blocker |
| 1 | Core: Scheduler infra | PROVEN | none |
| 1 | Core: Harness session-marker | BROKEN (Wave 11-Gov G1 fix recipe documented; cross-project, operator-execute) | operator action item |
| 2 | Entry + Shell | PROVEN (Wave 11-Gov G2 closed D-I3 BENIGN) | none |
| 3 | TeamBox | PARTIAL (Push-to-VIN UI stubbed Wave 3A; route-removal decision deferred to BL-001) | none (route-removal carried in backlog) |
| 4 | Sales | PROVEN (Wave 1C + Wave 3F) | none |
| 5 | Insights + Reports + Metrics | PROVEN (Wave 1C + Wave 3F) | none |
| 6 | Marketing | PARTIAL (Wave 3B fixed primary chat regression — `OPENAI_API_KEY` rotated; 2 carry-forward issues on Market Intel proxy filed `I-NEW-2026-05-10-A`/`B`) | Wave 3C |
| 7 | Service | PARTIAL (Wave 2A in progress; service-campaign chunks remaining) | Wave 2A continuation |
| 8 | Widget + Public Entry | PROVEN (Wave 2B chat/callback/form chunks shipped; video + inbound webhooks deferred to Wave 11A pending dev-env fix) | none |
| 9 | Management + Settings | PARTIAL (5 original security items + 5 new auth from I-Auth) | Wave 9-Sec |
| 10 | Background Workflows | PARTIAL (Wave 2A SMS+VAPI chunks done; webhook + trigger-evaluator-driven proofs remaining) | Wave 2A continuation |
| 11 | Release Gov + Final E2E | PARTIAL (Wave 11-Gov closed) | Wave 11A |

---

## Wave roadmap (in execution order)

| # | Wave | Phase | Title | Status |
|---|---|---|---|---|
| 1 | 1A | 1 | statusclassifier + scheduler + appt SMS | DONE |
| 2 | 1B | 1 | weekly-report sales-only filter | DONE |
| 3 | 1C | 1+5 | metric honesty (server-side) | DONE |
| 4 | I-Auth | 1 | auth/account integrity read-only audit | DONE |
| 5 | 3F | 5 | Insights/Sales metric UI (em-dash + chart fix + rename + /work-center route) | DONE |
| 6 | 11-Gov | 11 | harness session-marker investigation + D-I3 console-error finding (read-only) | DONE |
| 7 | **2A** | **7+10** | **Trigger 1 / Trigger 2 / service-campaign / webhook provider proof** | **IN PROGRESS** — direct outbound proof chunks (SMS + VAPI) merged 2026-05-07; remaining chunks: service-campaign + webhook + trigger-evaluator-driven proof (needs evaluator export approval + business-hours-mocked test rig per chunk-T1/blocker-finding.md) |
| 8 | 2B | 8 | Widget chat / callback / form provider proof | DONE |
| 9 | 3A | 3 | TeamBox Push-to-VIN UI STUB (re-scoped 2026-05-09: route REMOVAL deferred per operator) | DONE |
| 10 | 3B | 6 | Marketing agent functionality fix (re-scoped 2026-05-10: NOT UI/routing — config-only `OPENAI_API_KEY` rotation) | DONE |
| 11 | 3C | 6 | Marketing Insights filter propagation | DEFERRED-V2.3 (operator 2026-05-10: data + reports decisions pending; UI stays as-is) |
| 12 | 9-Sec | 9 | Security triage — 5 original items (I-244, I-245, I-246, I-247, I-249) + 5 new auth items from I-Auth (D, E, G, H, I) | queued — opens with operator decision on v2.2 vs v2.3 placement |
| 13 | 11A | 11 | Final E2E + go/no-go (includes Phase-2 route matrix walk; preferably AFTER 11-Gov G1 fix lands AND TextMagic dashboard URL is corrected) | queued |
| — | 3D | 3 | TeamBox channel filter add | OUT of v2.2 per locked D-H1 (BL-113 → v2.3) |

---

## Out of scope this release (DEFERRED — see roadmap.md)

- Schema migrations (BL-107) — including outbound_log `provider_message_id` column add (Wave 2A architectural finding)
- Marketing campaign UI buildout (BL-112)
- AI-role visual distinction (BL-108)
- Push-to-VIN ADF/XML rebuild (BL-109)
- Advanced notification rules (BL-110)
- Sales Coordinator (BL-111)
- TeamBox channel filter (BL-113 — deferred per D-H1)
- Top Performing Reps human-rep leaderboard (deferred to v2.3 per Wave 3F operator decision 2026-05-07)
- Lago billing
- Production-env separation remainder
- Dashboard Builder + Report Builder (was plan.md Phase 6 — moved to roadmap.md v2.3 map)

---

## Operator-decision boundaries

Operator gets consulted when something:
1. **Changes functionality** (what the system does)
2. **Changes UI** (what the user sees)
3. **Is creative** (taste, design, copy, scope-defining choice)

Everything else is orchestrator-autonomous. Don't expand this list.

Hard safety floors (separate from "consult" — these are STOPs, not approvals):
- No live deploy autonomous (operator-approved PR `batch-1-finish-line` → `main` is the gate)
- No DB write outside an approved migration or autonomy-allowed TESTLANE category
- No provider send to non-allowlisted recipients
- No cross-project filesystem edits (per REM-8-DT)
- No `git push --force` to main; no skipping safety hooks

---

## Standing constraints

- Orchestrator never writes product code; uses isolated `Agent` subagents for build (with `isolation: "worktree"`) or in-place subagent dispatch for read-only investigation; uses isolated subagents for audit gates (no team mailbox).
- No live deploy autonomous (Coolify gate is PR `batch-1-finish-line` → `main`).
- No DB write outside operator-approved migration OR autonomy-allowed TESTLANE categories per CLAUDE.md.
- No provider action without preflight + destination-classification + per-recipient `test-orgs-allowlist-check.sh` exit-0.
- UI files require per-file scope marker (`.claude/state/scope/<basename>.ok`) issued at chunk start. Pre-approved UI categories per CLAUDE.md: TeamBox section access; metric revision.
- Cross-project edits (anything outside `/home/ubuntu/Claude-store/nexxus2.2_replit/`) are HARD-BLOCKED per REM-8-DT incident — surface fix recipe + escalate.
- VIN writes through vin-safe-mcp prepare→review→execute→verify only.

---

## Standing parked items (do not act without explicit re-approval)

- **D-I2 — local main divergence** (47 files; 5658+/41-). Reset --hard rejected. Park documented at `evidence/governance-2026-05-01/local-main-divergence-2026-05-02.md` (still untracked). Non-destructive option queued.
- Cosmetic legacy-file moves (`PLAN.md` uppercase, `NEXXUS_UNIFIED_LAUNCH_PROMPT.md` → `legacy-artifacts/`).

---

## Operator action items (held for operator-execute; non-blocking for next wave)

1. **TextMagic dashboard inbound callback URL** — change from `dev.huminicdev.com` to `live.huminic.app` per `evidence/wave-2A-trigger-provider-proof/sidethread-textmagic-webhook/finding.md`. Production-impact (silent SMS drops). 30-second fix in TextMagic dashboard UI.
2. **Wave 11-Gov G1 cross-project fix** — apply Path B at `~/Claude-store/sysadmin/harness/lib/common.sh:56-58` + one-line cleanup in `session-start.sh`. Per `evidence/wave-11-gov-harness/chunk-G1/finding.md` §7 (test plan in §9).
3. **Wave 9-Sec triage decision** — pick v2.2 vs v2.3 placement for 5 original security items + 5 new auth items from I-Auth.

---

## Changelog

- **2026-05-10 — Wave 3B shipped (re-scoped per operator).** Original plan title was "Marketing tab routing fix" (UI). Operator clarified mid-wave: marketing AGENT errors, NOT a UI/routing problem; the agent has a UI, it just needs to work. qa-evaluator drove Phase 1 investigation → root cause: `OPENAI_API_KEY` rejected by OpenAI as invalid (verbatim 401). Operator rotated key. Orchestrator atomic-replaced in dev `.env` (gitignored), `pm2 reload --update-env`. qa-evaluator Phase 3 re-run → 200 with valid `gpt-4o-mini-2024-07-18` chat.completion. 4 verifiers AGREE/PASS/NO DRIFT/PASS. Zero source-code changes. 2 carry-forward issues filed (`I-NEW-2026-05-10-A` Google Maps key, `I-NEW-2026-05-10-B` maps-proxy body shape). `batch-1-finish-line` HEAD `1b606d3`. Phase 6 (Marketing) elevated from BROKEN to PARTIAL.
- **2026-05-10 — Wave 3A shipped (re-scoped).** Operator pivoted from "TeamBox Push-to-VIN button + route REMOVAL" to **STUB only** (UI hidden via `PUSH_TO_VIN_UI_ENABLED` const guard, route handler preserved, comment block added, BL-001 backlog entry filed). All 3 chunks PASS, 4 verifiers AGREE/PASS/NO DRIFT/PASS. Two deltas: Playwright DOM check (0 buttons rendered, 0 strings) + git diff (3 source files, tsc clean, route handler byte-unchanged). `batch-1-finish-line` HEAD `f9cc9f8`. Live still on `becb739`.
- **2026-05-09 — Wave 2B shipped.** Widget public-entry provider proof: T1 chat (Anthropic), T2 voice-callback (VAPI Elliott→Nancy allowlist), T3 contact form (storage-only). All 3 chunks PASS, 4 verifiers AGREE/PASS/NO DRIFT/PASS. Architectural finding (deferred): `conversations` table lacks provider call reference column; VAPI call_id persists only in HTTP response + dashboard. Phase 8 (Widget + Public Entry) now PROVEN. Live still on `becb739`. `batch-1-finish-line` HEAD `3b45d10`.
- **2026-05-07 — six waves shipped, plan reconciled.** 1C, I-Auth, 3F (mechanical UI close + design-gate execution), 11-Gov (read-only investigation), 2A (SMS + VAPI direct outbound provider proof) all merged to `batch-1-finish-line`. Wave A/B/C sub-naming retired going forward (waves are canonical per roadmap; chunks decompose internally). Operator action items consolidated to 3 (TextMagic dashboard URL, Wave 11-Gov G1 cross-project fix, Wave 9-Sec triage). Live still on `becb739`; live deploy deferred to Wave 11A.
- 2026-05-05 — Release reset. plan.md narrowed to active-execution contract; full v2.2 component map moved to roadmap.md. 8 product-logic deltas folded in.
