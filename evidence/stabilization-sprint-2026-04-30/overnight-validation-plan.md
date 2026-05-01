# Overnight Nexxus Validation + E2E + TeamBox Discovery Run — 2026-04-30 → 2026-05-01

## Goal

Use overnight time to deeply validate live/dev behavior, exercise launch-critical endpoints and workflows, and prepare fresh context for upcoming TeamBox separation work.

**This is validation/exploration only.**

## ⛔ HARD GUARDRAILS (do not violate)

**Do NOT:**
- push to remote
- deploy
- edit product code
- mutate production config
- delete DB rows
- run broad cleanup
- contact real customers
- send to non-allowlisted recipients
- change CommGate / org outbound settings
- change Coolify env
- rotate secrets

**Allowed:**
- read-only DB queries
- read-only provider/log checks
- Playwright E2E / eval runs
- live/dev smoke tests
- Test Lane sends ONLY to approved allowlisted/operator-owned contacts
- VAPI/Tavus/TextMagic test flows ONLY inside approved Test Lane boundaries
- screenshots / evidence
- subagent dispatches for independent read-only validation/exploration
- writing evidence reports

## Hard stop conditions

If ANY of the following occurs, STOP, write `evidence/stabilization-sprint-2026-04-30/STOP-EVENT-<timestamp>.md`, then halt:

- any possible real customer contact
- any non-allowlisted send
- live outage detected
- provider callback disablement risk
- schema migration needed
- production config change needed
- code edit needed
- deploy needed
- uncertainty about safety boundary

If a real production outage is found:
- stop the relevant test
- document exact evidence
- do NOT fix/deploy without operator approval unless this plan explicitly permits the exact action

## Multi-agent dispatch (use these subagent roles overnight)

1. **Live Workflow QA** — exercise live routes + workflows in browser, capture evidence
2. **Dev Regression / E2E QA** — run `npm run test:e2e`, vitest, codex eval against `dev.huminicdev.com`
3. **Provider/Webhook QA** — synthetic probes, allowlisted Test Lane flows, provider-side logs read-only
4. **TeamBox Discovery / Separation Explorer** — produce taxonomy + sublanes recommendation
5. **Widget / Dealer.com QA** — Playwright load with foreign Origin, header inspection, embed check
6. **Reports / Data Integrity QA** — read-only verify recent reports + sales/service segregation
7. **Code Reviewer / Risk Reviewer** — read-only diff review of today's changes

## Validation scope

### A. Live Health + Route Smoke

Endpoints to probe with status, screenshots, console errors, network failures:
- `/api/health`
- `/`
- `/login`
- `/teambox`
- service pages
- sales pages
- marketing pages
- widget URLs (5 dealer slugs + universal nexxus-widget.js)
- relevant API endpoints (`/api/auth/login` 400 sanity, etc.)

### B. Webhook / Provider Validation

Validate current live behavior:
- VAPI webhook: junk secret → 401; real/simulated signed flow if safely testable
- Tavus webhook: unchanged + healthy
- TextMagic:
  - junk signing header → 401
  - no signing header → accepted (200)
  - real inbound TextMagic behavior if safely testable with allowlisted number
- Confirm no `503 Webhook secret not configured` state remains

### C. Trigger Workflows

Validate both dev and live posture (read-only / Test-Lane only):
- Trigger 2 / 24-hour check-in behavior
- Trigger 1 immediate VinSolutions lead follow-up default-OFF behavior
- Confirm production/live config does NOT accidentally sweep real customers
- Confirm `checkInDelayMinutes` production expectation / current value (should be 1440)
- Confirm `triggerTestPhones` / allowlist posture (Serra Honda whitelist `+14126546500`)
- NO real customer sends
- Use ONLY [TESTLANE] markers if any active proof is run

### D. Service Campaigns

Validate:
- placeholder substitution, especially `{firstName}`
- allowed placeholders: `{firstName}`, `{dealershipName}`, `{repName}`, `{phone}`, `{vehicleOfInterest}`
- CSV upload path
- Campaign execute path with allowlisted test recipient ONLY if active send is needed
- Inbound reply routing
- TeamBox display
- AI / human handoff behavior

### E. Universal Widget / Dealer.com

Validate:
- `https://live.huminic.app/dealer-widgets/serra-honda.js`
- foreign `Origin: https://www.serrahonda.net`
- content-type
- CORS / CORP / CSP headers
- cache / compression headers
- synthetic external-origin Playwright load
- widget opens
- internal chat works if safely testable
- hunches OUT OF SCOPE unless trivially observable

### F. Sales Reports

Read-only ONLY:
- verify recent reports went out
- verify recipients/counts if safe
- verify reports do NOT include service leads / service info
- verify NO resend/regeneration occurs
- document source of truth

### G. TeamBox Full Evaluation (preparation for separation work)

Evaluate each conversation source/type:
- inbound SMS conversations
- outbound SMS replies
- service campaign conversations
- trigger follow-up conversations
- AI chat
- widget-originated conversations
- voice / VAPI conversations
- marketing / campaign conversations
- queued / manual-send messages under kill-switch behavior (if safely inspectable)

For each, document:
- where it appears in TeamBox
- whether thread renders all messages
- whether directionality is clear
- whether user can tell source / channel
- whether human takeover works or appears available
- whether messages are mixed / confusing
- what metadata exists to separate lanes
- what UI changes are needed

Produce:
- TeamBox current-state map
- conversation taxonomy recommendation
- proposed sublanes / filters
- must-fix-before-customer-demo list
- can-fix-after-launch list
- screenshots

### H. Regression / E2E

Run:
- unit suite (`npx vitest run tests/unit/`)
- TypeScript check (`npx tsc --noEmit`)
- Codex launch-readiness eval if available
- Playwright projects that are safe / non-provider
- provider/Test Lane E2E ONLY where allowlisted

Classify failures:
- product bug
- stale test
- environment
- known accepted debt
- launch blocker
- non-blocker

### I. Final Overnight Report

Write `evidence/stabilization-sprint-2026-04-30/overnight-validation-report.md` containing:

1. headline verdict
2. live status
3. dev status
4. workflows GREEN / YELLOW / RED
5. provider / webhook status
6. service campaign status
7. trigger status
8. widget Dealer.com status
9. sales report status
10. TeamBox current-state findings
11. launch blockers
12. non-blocking debt
13. recommended next 5 actions
14. exact evidence paths
15. git status
16. no-push / no-deploy confirmation

Also update at end:
- `.claude/session.md`
- `~/.claude/projects/-home-ubuntu-Claude-store-nexxus2-2-replit/memory/session-output.md`

## Pre-state (snapshot from end of 2026-04-30 daytime session)

- `origin/main` HEAD: `b7d4d6f` (Merge PR #5: TextMagic relaxed-verify + workflow cleanup)
- Live container: fresh restart at ~05:40 UTC 2026-04-30, post chunk-5 deploy
- All 3 webhook handlers: probes returning 401 with junk header; TextMagic returns 200 with no header (relaxed-verify path active)
- Test conversation row `5ecf6c84-474d-400f-ae78-555d08537c5b` left in DB from chunk-5 verification probe (identifiable by phone `+15551234567` + message `chunk-5-relaxed-verify-test`); cleanup is optional and non-blocking

## Pending operator decisions (carry forward; do NOT act on these overnight)

1. TextMagic dashboard signing posture verification (closes I-NEW-2026-04-30-E)
2. SLACK_WEBHOOK_URL repo secret for deploy.yml failure notifications
3. HOTFIX_VAPI_WEBHOOK_SECRET / HOTFIX_TEXTMAGIC_WEBHOOK_SECRET cleanup
4. Test conversation row cleanup
5. Bearer-token rotations (vin-safe-mcp / dax-mcp / n8n-hyperbridge / Coolify)
6. Service-campaign per-store flags — Serra Honda only at launch
7. TextMagic 3-number classification in `test-recipients.txt`
8. Pre-flight synthetic-probe step for `deploy.yml` (deferred until TextMagic signing posture clarified)
