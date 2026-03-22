# Phase 15 — Launch Preparation

**Phase Description**
Everything needed to go from dev.huminicdev.com to live.huminic.app
as a production deployment. Infrastructure, environment, deployment,
smoke test, and customer sign-off.

**Open Issues:** None — all issues should be resolved before this phase
**Depends On:** All other phases
**Status:** NOT STARTED

---

---

SPRINT E-15.0 — Phase 15 Entry Inspection

WHY IT MATTERS
Before any work starts in this phase, verify the foundation is solid.
If a dependency is broken, everything built on top of it fails.

WHAT GETS BUILT
  (Exploratory — read only, no code changes)
  - Verify dependencies: All phases
  - Check files this phase will touch for uncommitted changes:
    Infrastructure: Coolify, Caddy, DNS
  - Read sprint descriptions — are they still accurate?
  - Check ghost_messages for unresolved directives
  - Check issues.md for any new issues affecting this phase
  - Run relevant Playwright tests for dependencies

HOW WE KNOW IT IS DONE
  - Dependencies confirmed working (not just committed — tested)
  - No uncommitted changes in phase files
  - No unresolved ghost directives affecting this phase
  - Sprint descriptions reviewed and confirmed accurate
  - Entry inspection report written to evidence/

FAILS IF
  - A dependency phase has unresolved issues
  - Uncommitted changes exist in files this phase will touch
  - Ghost directives are pending

VERIFICATION NOTES
  - This is a 15-minute read-and-verify, not a full audit
  - If issues found, resolve them before starting the phase
  - Ghost runs /ghost-check at this point


SPRINT L-15.1 — Coolify Container Setup

WHY IT MATTERS
The production deployment runs on Coolify, not the dev server.
The container needs to be created and configured.

WHAT GETS BUILT
  IN
    - Create Coolify container for Nexxus Connect
    - Configure build command: npm ci && npm run build
    - Configure start command: node dist/index.cjs
    - Set all environment variables (from ci-cd-spec.md)
    - Set OUTBOUND_LIVE_ENABLED=false (start with OFF)
    - Configure health check: GET /api/health

HOW WE KNOW IT IS DONE
  - Coolify container builds successfully
  - Health check passes at the container URL
  - All env vars are set

FAILS IF
  - Build fails
  - Health check doesn't pass
  - Missing env vars

---

SPRINT L-15.2 — Caddy Configuration

WHY IT MATTERS
live.huminic.app needs to point to the Coolify container through Caddy.

WHAT GETS BUILT
  IN
    - Configure Caddy reverse proxy for live.huminic.app → Coolify container
    - Verify SSL certificate
    - Verify widget URLs work: https://live.huminic.app/widget/dealer/serra-honda.js

HOW WE KNOW IT IS DONE
  - https://live.huminic.app/api/health → 200
  - Widget JS serves correctly at production URL
  - SSL certificate valid

FAILS IF
  - live.huminic.app doesn't resolve
  - SSL errors
  - Widget URLs broken

VERIFICATION NOTES
  - This is infrastructure work — coordinate via sysadmin
  - Reference: ci-cd-spec.md deployment section

---

SPRINT L-15.3 — Production Smoke Test

WHY IT MATTERS
Before enabling CommGate on production, verify everything works.

WHAT GETS BUILT
  (Testing)
  - Login at live.huminic.app with each role
  - Navigate all 12 pages
  - Verify widget JS serves
  - Verify API endpoints respond
  - Run Playwright tests against live URL (safe tests only — no outbound)

HOW WE KNOW IT IS DONE
  - All pages load without errors
  - Auth works for all roles
  - Widget serves correctly
  - API returns data
  - 90%+ test pass rate

FAILS IF
  - Any critical page fails to load
  - Auth broken
  - Widgets don't serve

---

SPRINT L-15.4 — Production CommGate Activation

WHY IT MATTERS
The final step — enabling real outbound on production.

WHAT GETS BUILT
  DT
    - Enable CommGate for Serra Honda (one org at a time)
    - Send test SMS to owner's phone
    - Verify email notification delivers
    - If all good, enable remaining orgs one at a time
  IN
    - Verify VAPI webhook URLs point to live.huminic.app
    - Verify Tavus webhook URL points to live.huminic.app

HOW WE KNOW IT IS DONE
  - Owner receives test SMS at live.huminic.app
  - Email notification arrives
  - Real inbound call produces TeamBox conversation
  - All 5 orgs enabled and functional

WHAT IT DOES NOT INCLUDE
  - Customer onboarding (separate process)
  - Training materials

FAILS IF
  - SMS goes to wrong person
  - Email goes to wrong person
  - Outbound sends when it shouldn't

VERIFICATION NOTES
  - IRREVERSIBLE — owner must approve each org activation
  - ONE ORG AT A TIME
  - This is the last sprint before the product is live

---

---

SPRINT T-15.EXIT — Phase 15 Exit Inspection

WHY IT MATTERS
Before the next phase starts, confirm this phase is truly done.
Every sprint committed, every acceptance criterion verified,
every test passing.

WHAT GETS BUILT
  (Testing — no code changes)
  - Verify every sprint in this phase has status "committed" in sprints.json
  - Run acceptance criteria for this phase: All AC
  - Run relevant Playwright tests
  - Check: did any sprint touch files outside its declared scope?
  - Write one-sentence verdict

HOW WE KNOW IT IS DONE
  - All sprints in this phase: status "committed" with valid hash
  - Acceptance criteria checked: Container running, production URL works, CommGate enabled, all systems go
  - Relevant Playwright tests pass
  - No files modified outside declared scope
  - Verdict written: "Phase 15 is SOLID" or "Phase 15 has issues: [list]"

FAILS IF
  - Any sprint not committed
  - Any acceptance criterion fails
  - Files modified outside scope
  - Verdict is not SOLID

VERIFICATION NOTES
  - Ghost runs /ghost-check at this point
  - If verdict is not SOLID, next phase is BLOCKED
  - Issues found become new sprints in THIS phase (not the next one)


**Phase 15 is DONE when:**
- Coolify container running and healthy
- live.huminic.app resolves and serves the app
- All pages work at production URL
- CommGate enabled for all orgs
- Real SMS/email/voice pipeline working in production
- Owner has signed off
