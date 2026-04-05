# LV-001a Pre-Execution Report (REVISED)

**Sprint:** LV-001a — MVP Launch Validation — 13 Workflow E2E Tests
**Date:** 2026-04-03
**Branch:** `lv-001a`
**Author:** Orchestrator
**Depends On:** I-002 (committed: f0b7abf)

## Objective

Validate all 13 end-to-end workflows on dev, remediate failures, then validate on production. Zero mocks — real API calls to staging integrations.

## Test Architecture

Tests split into two categories by execution method:

### API-Only Tests (7 workflows) — Playwright CLI specs, no browser
| File | Workflow | Method |
|------|----------|--------|
| wf-vapi-inbound.spec.ts | WF-VAPI | Simulate webhook POST, verify DB + VIN MCP |
| wf-tavus-inbound.spec.ts | WF-TAVUS | Simulate webhook POST, verify DB + VIN MCP |
| wf-cold-service.spec.ts | WF-COLD-SERVICE | Simulate inbound SMS, verify agent response |
| wf-cold-sales.spec.ts | WF-COLD-SALES | Simulate inbound SMS, verify agent response |
| wf-vin-lead.spec.ts | WF-VIN-LEAD | API calls to vin-safe-mcp prepare/execute/verify |
| wf-vin-trigger.spec.ts | WF-VIN-TRIGGER | API trigger delta sync, verify outbound |
| wf-campaign.spec.ts | WF-CAMPAIGN | API create/execute campaign, verify delivery |

### Browser + API Tests (6 workflows) — Planner → Generator → Healer pipeline
| File | Workflow | Browser Steps |
|------|----------|--------------|
| wf-widget-video.spec.ts | WF-WIDGET-VIDEO | Widget page → Tavus video → transcript → VIN |
| wf-widget-callback.spec.ts | WF-WIDGET-CALLBACK | Widget → request callback → VAPI outbound |
| wf-widget-form.spec.ts | WF-WIDGET-FORM | Widget → fill form → verify SMS sent |
| wf-widget-chat.spec.ts | WF-WIDGET-CHAT | Widget → chat → AI response → VIN |
| wf-teambox.spec.ts | WF-TEAMBOX | Login → TeamBox → filter → thread → reply |
| wf-takeover.spec.ts | WF-TAKEOVER | Login → active conversation → take over → send → release |

### Self-Healing Pipeline
Browser tests use the Playwright MCP agent pipeline:
1. **Planner** — navigates live app, produces structured test plan
2. **Generator** — follows plan on live DOM, writes .spec.ts with real locators
3. **Healer** — on failure: test_debug → browser_snapshot → browser_generate_locator → fix

## Declared Files

- tests/e2e/wf-vapi-inbound.spec.ts
- tests/e2e/wf-tavus-inbound.spec.ts
- tests/e2e/wf-widget-video.spec.ts
- tests/e2e/wf-widget-callback.spec.ts
- tests/e2e/wf-widget-form.spec.ts
- tests/e2e/wf-widget-chat.spec.ts
- tests/e2e/wf-cold-service.spec.ts
- tests/e2e/wf-cold-sales.spec.ts
- tests/e2e/wf-campaign.spec.ts
- tests/e2e/wf-teambox.spec.ts
- tests/e2e/wf-vin-lead.spec.ts
- tests/e2e/wf-vin-trigger.spec.ts
- tests/e2e/wf-takeover.spec.ts
- server/routes/webhooks.ts (I-229/I-230 already committed in ee69c2a)
- server/routes/public.ts (voice callback error handling 500→503)
- server/seed.ts (nexxusOrgId alignment + textmagicPhone provisioning)
- tests/e2e/seed.spec.ts (seed test alignment)
- playwright.config.ts (add workflow project)
- evidence/LV-001a/
- issues.md
- server/index.ts (Helmet noSniff fix — Caddy duplicate header, I-232)
- tests/e2e/domain-12-infrastructure.spec.ts (skip rate limit test in CI, I-232)
- client/src/pages/widget-landing.tsx (data-testid for voice-close button)
- tests/e2e/wf-widget-embed.spec.ts (embed widget test)
- tests/agents/generated/edge-cases.agent.spec.ts (XSS slug restore fix)
- client/src/components/CreditBalanceIndicator.tsx (DELETED — dead code, I-242)
- client/src/components/UsageMeterBar.tsx (DELETED — dead code, I-242)
- client/src/hooks/useFirstLogin.ts (DELETED — dead code, I-242)
- scripts/pre-commit.sh (governance update)
- scripts/watchdog.sh (governance update)
- CLAUDE.md (governance update)
- safety-gate/README.md (safety gate docs)
- tests/e2e/deprecated/ (18 deprecated test files moved, I-242)
- tests/agents/plans/ (test plan files)
- tests/e2e/wf-takeover.plan.md (test plan)
- tests/e2e/wf-widget-callback.plan.md (test plan)
- tests/e2e/wf-widget-form.plan.md (test plan)
- tests/e2e/wf-widget-video.plan.md (test plan)

## UI Changes

data-testid="button-voice-close" added to widget-landing.tsx close button (no visual change). uiPermissions: "NONE" — attribute-only, no UI modification.

## Acceptance Criteria (from sprints.json)

| AC | Workflow | End-to-End Definition |
|----|----------|----------------------|
| AC1 | WF-VAPI | Inbound VAPI call → transcript → VIN lead → email w/ VIN status → TeamBox |
| AC2 | WF-TAVUS | Inbound Tavus video → transcript → VIN lead → email → TeamBox |
| AC3 | WF-WIDGET-VIDEO | Widget → Tavus video session → transcript → VIN lead |
| AC4 | WF-WIDGET-CALLBACK | Widget → instant web callback → VAPI outbound → transcript |
| AC5 | WF-WIDGET-FORM | Widget → form fill → auto-SMS via TextMagic → prospect reply → TeamBox takeover |
| AC6 | WF-WIDGET-CHAT | Widget → web chat → AI agent → VIN lead → TeamBox |
| AC7 | WF-COLD-SERVICE | Inbound text → Service Agent → TeamBox → advisor takeover |
| AC8 | WF-COLD-SALES | Inbound text → Sales Agent → TeamBox → salesperson takeover |
| AC9 | WF-CAMPAIGN | Create → execute SMS/email/voice → replies → agent → TeamBox → human takeover |
| AC10 | WF-TEAMBOX | View → filter → select → thread → take over → reply → delivered → updated |
| AC11 | WF-VIN-LEAD | Transcript → prepare → preview → execute → verify dealer+source+notification |
| AC12 | WF-VIN-TRIGGER | New VIN lead → delta sync → trigger fires → outbound → TeamBox |
| AC13 | WF-TAKEOVER | Agent active → human takes over → agent pauses → human sends → release to agent |

## Test Plan

### API tests (Step 1a)
```
npx playwright test --project=workflow tests/e2e/wf-vapi-inbound.spec.ts
npx playwright test --project=workflow tests/e2e/wf-tavus-inbound.spec.ts
npx playwright test --project=workflow tests/e2e/wf-cold-service.spec.ts
npx playwright test --project=workflow tests/e2e/wf-cold-sales.spec.ts
npx playwright test --project=workflow tests/e2e/wf-vin-lead.spec.ts
npx playwright test --project=workflow tests/e2e/wf-vin-trigger.spec.ts
npx playwright test --project=workflow tests/e2e/wf-campaign.spec.ts
```

### Browser tests (Step 1b — Planner → Generator pipeline)
```
npx playwright test --project=workflow tests/e2e/wf-widget-video.spec.ts
npx playwright test --project=workflow tests/e2e/wf-widget-callback.spec.ts
npx playwright test --project=workflow tests/e2e/wf-widget-form.spec.ts
npx playwright test --project=workflow tests/e2e/wf-widget-chat.spec.ts
npx playwright test --project=workflow tests/e2e/wf-teambox.spec.ts
npx playwright test --project=workflow tests/e2e/wf-takeover.spec.ts
```

### Full suite
```
npx playwright test --project=workflow
```

## Entry Gates

| Gate | Status | Evidence |
|------|--------|----------|
| A1: I-002 committed | PASS | f0b7abf |
| A2: Container healthy | PASS | I-004 exit B1 |
| A3: Rollback tested | PASS | I-003 exit B1 |
| A4: Staging DB isolated | PASS | 7 orgs, 15 users, 50 agents |
| A5: I-229/I-230 committed | PASS | ee69c2a |

## Exit Gates

| Gate | What Ghost Checks |
|------|-------------------|
| B1 | All 13 workflow ACs pass on dev (or failures accepted with issues) |
| B2 | All 13 workflows verified on live by operator (real phone, email, SMS) |
| B3 | All failures logged in issues.md with fix plan |
| B4 | Operator approves launch readiness |

## Execution Steps

| Step | Action | Type | Ghost Gate? |
|------|--------|------|-------------|
| 0 | Pre-flight: update pre-exec, add workflow project to config, verify branch | code | No |
| 1 | Write 13 wf-*.spec.ts files — 7 API direct, 6 via Planner→Generator | code | No |
| 2 | GHOST GATE: verify test files exist, match workflow defs | infra | Yes |
| 3 | Run all 13 on dev (BASE_URL=https://dev.huminicdev.com) | code | No |
| 4 | GHOST GATE: verify results, categorize failures | infra | Yes |
| 5 | Remediation: fix failures blocking workflows | code | No |
| 6 | GHOST GATE: verify fixes, retest affected | infra | Yes |
| 7 | Remediation loop: fix → retest → regress | code | No |
| 8 | GHOST GATE: Go/No-Go for dev | infra | Yes |
| 9 | Merge lv-001a to main, push, Coolify redeploys | infra | No |
| 10 | Operator tests 13 workflows on live — IRREVERSIBLE per-action approval | infra | No |
| 11 | GHOST GATE: live results match dev | infra | Yes |
| 12 | GHOST FINAL VERIFY: exit gates B1-B4 | infra | Exit gate |

## Historical Evidence

evidence/LV-001a/ contains artifacts from a prior domain-test-based run (steps 1-8). Results: 93/101 passed, 8 accepted, 0 unresolved. Historical context only — does not substitute for workflow tests.

## Known Issues In-Scope

| Issue | Status | Notes |
|-------|--------|-------|
| I-229 | Fixed in ee69c2a | Email subject emoji + VIN status |
| I-230 | Fixed in ee69c2a | No-transcript guard |

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Real integration failures (VAPI, VIN, TextMagic) | HIGH | Categorize TEST_ISSUE vs PRODUCT_BUG |
| IRREVERSIBLE actions in live validation (Step 10) | HIGH | Operator approves each |
| Remediation expands scope | MEDIUM | "Does this support a core MVP flow?" gate |
| Locator drift on browser tests | MEDIUM | Healer agent regenerates locators |

## Scope Control

ONLY the 13 workflows. No UI changes. No architecture. No post-MVP features.
