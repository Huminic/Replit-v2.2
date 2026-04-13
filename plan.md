# Nexxus Connect v2.2 — Launch Stabilization Plan

**Date:** 2026-04-13
**Supersedes:** plan-v1-archive.md (original page-by-page plan, completed)
**Master Prompt:** NEXXUS_UNIFIED_LAUNCH_PROMPT.md
**Phase:** Launch Stabilization — qa_resolve_loop

---

## Section 0 — Sprint Execution Protocol

### Agent Role: ORCHESTRATOR

You are the orchestrator. You manage the sprint lifecycle but do NOT write application code directly. You delegate ALL code changes to sub-agents via the Agent tool.

### Sniper Protocol

For every workflow slice:
1. PICK one slice (highest severity, launch-blocking first)
2. RUN the eval or workflow
3. OBSERVE the first failure
4. CLASSIFY: CODE_DEFECT | CONFIG_DATA_DEFECT | EVAL_GAP | HARNESS_DEFECT | EXTERNAL_BLOCKER
5. PATCH the smallest possible change (delegate to sub-agent)
6. VERIFY: build passes, test passes, integration verified
7. RERUN the same slice
8. GREEN → capture evidence → commit → move on
9. RED → back to step 3
10. BLOCKED → capture evidence → mark blocked → move on

### Five-Way Classification

Every failure must be classified before any fix:
- **CODE_DEFECT** — Application logic wrong → fix code
- **CONFIG_DATA_DEFECT** — Org settings, env vars, seed data wrong → fix config
- **EVAL_GAP** — Workflow works but eval doesn't prove it → fix eval
- **HARNESS_DEFECT** — Hook, runner, template broken → fix harness
- **EXTERNAL_BLOCKER** — Vendor API, rate limit, access issue → mark blocked

---

## Section 1 — Sprint Sequence

| Sprint | Phase | Purpose | Depends On |
|--------|-------|---------|------------|
| LAUNCH-P0-CLEANUP | 0 | Clear the deck | — |
| LAUNCH-RECON-01 | 1 | Reconnaissance — triage matrix for 3 pillars | P0 |
| LAUNCH-FIX-W1 | 2 | Security & data integrity | RECON |
| LAUNCH-FIX-W2 | 2 | Core ops: Chat, Teambox, Agents, Settings, Billing, Insights | W1 |
| LAUNCH-FIX-W3 | 2 | Integrations: VIN, VAPI, Tavus, TextMagic, Resend | W2 |
| LAUNCH-FIX-W4 | 2 | Eval & harness gap closure | W3 |
| LAUNCH-AUTOTEST-01 | 3 | Autonomous E2E testing (34 slices) | W4 |
| LAUNCH-INTERACTIVE-01 | 4 | Interactive testing with operator | AUTOTEST |
| LAUNCH-DECISION-01 | 5 | Go/no-go decision | INTERACTIVE |

---

## Section 2 — Three Pillars

### Pillar 1: Software Operations & Metrics (6 slices)
P1-SLICE-01: Chat — send/receive/persist/thread
P1-SLICE-02: Teambox — queue, kill switch, takeover
P1-SLICE-03: Agents — execution traces, audit
P1-SLICE-04: Settings — save/persist/reload
P1-SLICE-05: Billing — FlexPrice integration, degraded handling
P1-SLICE-06: Insights — data truth, no stubs

### Pillar 2: 3rd-Party Connections (6 slices)
P2-SLICE-01: VIN Solutions — per-org lead source, prepare/execute
P2-SLICE-02: VAPI — webhook pipeline, elliott.ts outbound
P2-SLICE-03: Tavus — video chat, transcript pipeline
P2-SLICE-04: TextMagic — SMS via MCP, webhook handler
P2-SLICE-05: Resend — email delivery, rate limits
P2-SLICE-06: Billing API — FlexPrice state (post-launch)

### Pillar 3: End-to-End Workflows (22 slices)
**Inbound (5):** SMS sales, SMS takeover, Phone sales, Phone service, Video
**Campaigns (7):** CSV upload, Execute, Response, Takeover, Channel config, Phone, Email
**Outbound (6):** Email trigger, SMS trigger, Phone trigger, Multi-channel, Cold SMS reply, Config
**Observability (4):** Data chain, Failure alerts, Campaign alerts, Metrics accuracy

---

## Section 3 — Work Already Done

Commit 58ecc8d contains code from initial LAUNCH-STABILIZE session:
- Trigger scheduler (server/services/triggerService.ts) — HAS BUGS I-272, I-273, I-274
- Notification emails (server/services/notificationService.ts)
- Campaign fixes: MCP failure handling, CSV dedup, conversation escalation
- VIN sync contact resolution via vin_get_contact
- Service campaign verified: 5/5 SMS sent, TeamBox working, Push-to-VIN working

## Section 3e — Hard-Won Lessons

- **INC-001:** Never enable outbound features on production orgs without a test whitelist
- **TCPA bypass:** Never bypass safety gates to make tests pass
- **Classify before fix:** Every failure must be classified before code changes
- **Phase sequence:** 0→1→2→3→4→5. No skipping.
- **Orchestrator discipline:** The orchestrator delegates. It does not write code.

---

## Section 4 — Known Issues

See issues.md for full list. Critical items for launch:
- I-272: TCPA bypass must be removed from trigger service
- I-273: Trigger dedup tag visible in customer SMS
- I-274: No test whitelist for trigger service
- I-271: TextMagic delivery notification webhook returns 400
- I-270: Bulk CSV upload button broken
- INC-001: Apology SMS pending for 7 Serra Honda customers
