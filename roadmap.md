# Nexxus Roadmap

The big map. Read order across governance files:

1. roadmap.md (this file) — full component map across releases
2. plan.md — active execution contract (current wave only)
3. backlog.md — queued / deferred sprints
4. issues.md — defects / debt / incidents
5. evidence/ — proof
6. decisions.md — operator decisions

This file is **not** an authorization. plan.md authorizes execution.

## Hierarchy

Roadmap → Phase → Wave → Chunk → Step.

- Phase = functional component area
- Wave = executable slice inside a phase
- Chunk = commit-worthy implementation/proof unit
- Step = ordered action inside a chunk

## v2.2 Functional Phases

### 1. Core Platform

Shared primitives consumed by all route-surface phases.

- Auth + session + token refresh
- RBAC + org-context pinning (no silent org switch — see I-NEW-2026-05-01-K)
- Account / user integrity (operator login/password issue suspect — Wave I-Auth)
- Sales-vs-service classification primitive (consumed by Phases 4/5/7/10)
- CommGate / outbound flag enforcement (consumed by Phases 6/7/10)
- Provider safety posture (vin-safe-mcp:4003 prepare→review→execute→verify; central-mcp:4002; I-248 timezone validation RESOLVED 2026-04-30)
- Conversation / message model (consumed by Phases 3/8/10)
- Report / metric primitives (consumed by Phases 4/5)
- Audit / activity logging (consumed by Phases 4/9/10)
- Scheduler / workflow infrastructure (consumed by Phase 10)
- Harness / session-marker integrity (governance, not product)

### 2. Entry + Shell

Login / nav / header / sidebar / role-based menu visibility / route guards / console error baseline.

### 3. TeamBox

Conversation list + thread, channel filters (sms/email/voice/video/form), per-channel reply round-trip, Push-to-VIN (REMOVE in v2.2 per operator 2026-05-02; ADF/XML rebuild → BL-109 v2.3), AI-role rendering (DEFER → BL-108 v2.3 per D-H1).

### 4. Sales

Sales dashboard, pipeline tile (14d), sales activity feed (system events filtered), sales-scoped metrics.

### 5. Insights + Reports + Metrics

Insights tiles + drill-downs, weekly report (Monday W18 5/5 verified), daily recap (1A wired), per-metric verdicts (D-F1).

### 6. Marketing

Marketing dashboard tab, tab routing (KD-3), Insights filter scope (KD-4), campaign UI (DEFER per D-G1; banner stays — BL-112 v2.3).

### 7. Service

Service dashboard, service campaigns (Serra Honda only enabled per launch rule), CSV upload, send→reply.

### 8. Widget + Public Entry

5 dealer widget URLs (CORS / 200 verified), chat init, callback, form submit, video where enabled.

### 9. Management + Settings

Management dashboard (super_admin), Settings (Org/User/AI/Billing). Open security items (5, all unclassified for v2.2 vs v2.3): I-244 (IDOR on `/api/vin/leads/summary`), I-245 (AI-prompt write by org_admin), I-246 (role dropdown exposure), I-247 (org slug write), I-249 (self-deactivation). I-248 (timezone validation) RESOLVED 2026-04-30.

### 10. Background Workflows

Trigger 1 (immediate VIN follow-up), Trigger 2 (24-hour check-in), service-campaign scheduler, weekly-report scheduler, daily-recap scheduler, provider webhooks (VAPI/Tavus/TextMagic/Resend/SignalWire).

### 11. Release Governance + Final E2E

Plan/backlog/issues/decisions/evidence honesty, harness session-marker integrity, final route+webhook+reports matrix, accepted-debt list, go/no-go.

## v2.3 Deferred Map

- BL-107 — `lead_type` schema migration (sales-vs-service first-class)
- BL-108 — AI-role visual distinction in TeamBox
- BL-109 — Push-to-VIN ADF/XML safe rebuild
- BL-110 — Advanced notification rules (round-trip detection / "of substance" classifier / appointment-intent re-use)
- BL-111 — Sales Coordinator (N1-N5)
- BL-112 — Marketing Insights server-side scope
- BL-113 — TeamBox channel filter (deferred per D-H1 lock 2026-05-02; only re-enters v2.2 if operator unwinds)
- Marketing campaign UI (manager + studio + sends)
- Dashboard Builder + Report Builder (was current `plan.md` Phase 6)
- VIN Solutions browser-based report extraction (I-NEW-2026-04-29-I)
- Lago billing (I-105 / I-278)
- Production-environment separation remainder (I-200 / I-218 / I-219 / I-220 unfinished)
- Phase 9 security items confirmed v2.3 at Wave 9-Sec triage

## Standing rule

If a v2.2 phase item is **visible** to dealers, it must be working, intentionally disabled with state, hidden, or explicitly deferred. UI changes need explicit per-file scope markers (`.claude/state/scope/<basename>.ok`) before edit.
