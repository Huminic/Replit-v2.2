# S-10 Pre-Execution Report — Launch

## Objective

Final sprint: CI/CD pipeline, production smoke test, full regression, owner walkthrough, stakeholder demo, and go-live sign-off. No UI changes — infrastructure and verification only.

## Declared Files

**New:**
- .github/workflows/deploy.yml — CI/CD pipeline: checkout, install, build, test, deploy to Coolify
- tests/e2e/s10-launch.spec.ts — Production smoke tests against live.huminic.app

**Referenced (read-only):**
- tests/e2e/domain-12-infrastructure.spec.ts — Existing infra tests (12.1-12.6)
- tests/e2e/usability-audit.spec.ts — Existing usability tests
- issues.md — Verify all items CLOSED

## UI Changes

NONE — uiPermissions is "NONE — infrastructure and verification only"

## Acceptance Criteria

| ID | Criterion | Component |
|----|-----------|-----------|
| S-10.AC1 | GitHub Actions workflow exists and triggers on push to main | S-10.1 |
| S-10.AC2 | CI pipeline: install, build, test steps all pass | S-10.1 |
| S-10.AC3 | Coolify redeploys within 5 minutes of push | S-10.2 |
| S-10.AC4 | Production smoke: login works on live.huminic.app | S-10.3 |
| S-10.AC5 | Production smoke: all pages load without errors | S-10.3 |
| S-10.AC6 | Production smoke: test SMS delivers | S-10.3 |
| S-10.AC7 | Full regression: all sprint test suites pass against production | S-10.4 |
| S-10.AC8 | Owner walkthrough: every page confirmed working | S-10.5 |
| S-10.AC9 | Stakeholder demo completed successfully | S-10.6 |
| S-10.AC10 | All issues.md items status=CLOSED | S-10.7 |
| S-10.AC11 | All TG test gaps have passing tests | S-10.7 |

## Test Plan

### Test File 1: tests/e2e/s10-launch.spec.ts (NEW)

**S-10.3 — Production Smoke (against live.huminic.app):**
- Test: Login with super_admin on production URL
- Test: Navigate all major pages (TeamBox, Sales, Service, Marketing, Management), assert no console errors
- Test: Send test SMS via production MCP (or verify SMS endpoint responds)
- Test: Trigger VAPI webhook on production, verify conversation created
- Test: Check all 5 dealer widgets serve (widget-landing pages)
- Evidence: Screenshots + console logs

**S-10.7 — Issues Reconciliation:**
- Test: Read issues.md, assert 0 items with status REMEDIATING
- Test: Verify TI-010, TI-015, TI-016, TI-017 are CLOSED (resolved by S-9 and build)
- Evidence: File proof

### Test File 2: tests/e2e/domain-12-infrastructure.spec.ts (EXISTING)

**S-10.1/S-10.2 — CI/CD Verification:**
```
npx playwright test tests/e2e/domain-12-infrastructure.spec.ts --reporter=list
```
- Evidence: Test output

### Test File 3: Full regression (S-10.4)

**Run complete test suite against dev (pre-production proxy):**
```
npx playwright test --reporter=list
```
- Document pass/fail counts per test file
- Any failures must be documented exceptions with justification
- Evidence: Full test output

### Owner Walkthrough (S-10.5) — MANUAL

Owner navigates every page and confirms "ready" or identifies issues. This is a manual gate — orchestrator cannot simulate or bypass.

### Stakeholder Demo (S-10.6) — MANUAL

Demo flow: login -> chat -> metrics -> CSV upload -> campaign -> TeamBox -> manual message. Requires stakeholder presence. This is a manual gate.

### Pre-Execution Notes

**Issues status (current):**
- TI-010 (accessibility): OPEN — resolved by S-9.5 axe-core audit, needs status update to CLOSED
- TI-015 (live-comms SSE): OPEN — resolved by S-9.6, needs status update to CLOSED
- TI-016 (RI-TAVUS-2 scoping): OPEN — resolved by S-9.7, needs status update to CLOSED
- TI-017 (sync.ts date fix): OPEN — needs build verification
- TG-001 through TG-010: Most have passing tests from S-9 (TG-001 walk-in, TG-009 isolation). Status updates needed.

**S-10.AC3 (Coolify):** Requires owner to provide Coolify webhook URL and configure GitHub Secrets. If Coolify is not yet set up, this AC will be documented as BLOCKED pending infrastructure.

**S-10.AC6 (test SMS):** This is an IRREVERSIBLE action (real SMS send). Owner approval required before execution on production.

**S-10.AC8, AC9:** Manual gates requiring owner and stakeholder presence. Cannot be automated.

**Execution order:**
1. Update issues.md (close resolved items)
2. Create .github/workflows/deploy.yml
3. Build and deploy to dev
4. Create s10-launch.spec.ts and run smoke tests
5. Run full regression
6. Present for owner walkthrough (manual)
7. Present for stakeholder demo (manual)
8. Go-live sign-off

## Ghost Entry Gate
**Reviewed by:** ghost-agent
**Timestamp:** 2026-03-24T10:44:42Z
**Sprint:** S-10
**A1 Previous cleared:** PASS (S-9 EXIT GATE: CLEARED)
**A2 Worktree:** clean
**A3 Session state:** PASS
**A4 Pre-exec exists:** PASS
**A5 Objective:** PASS
**A6 Test Plan:** PASS (2 npx commands — infra tests + full regression)
**A7 Declared Files:** PASS (deploy.yml + s10-launch.spec.ts)
**A8 Match check:** MATCH (1 app file, 7 components, 11 ACs, uiPermissions=NONE)
**A9 UI permissions:** PASS (NONE)
**A10 Ghost messages:** PASS (clear)
**ENTRY GATE: APPROVED**
