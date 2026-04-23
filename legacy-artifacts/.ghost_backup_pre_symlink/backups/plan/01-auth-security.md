# Phase 1 — Auth & Security

**Phase Description**
Authentication, role-based access, and org hierarchy. This is mostly
working. Two open issues need fixing (Durran's org, Victoria's visibility).
Everything else is verification.

**Open Issues:** I-097, I-098
**Depends On:** Nothing — foundation phase
**Status:** MOSTLY DONE — verify + fix 2 issues

---

---

SPRINT E-1.0 — Phase 1 Entry Inspection

WHY IT MATTERS
Before any work starts in this phase, verify the foundation is solid.
If a dependency is broken, everything built on top of it fails.

WHAT GETS BUILT
  (Exploratory — read only, no code changes)
  - Verify dependencies: Nothing
  - Check files this phase will touch for uncommitted changes:
    server/routes/auth.ts, server/auth.ts, client/src/pages/login.tsx
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


SPRINT V-1.1 — Verify Login and Token Flow

WHY IT MATTERS
Login is the gate to everything. If tokens don't work, nothing works.

WHAT GETS BUILT
  (Verification — no code changes expected)
  BE
    - Verify login endpoint returns access + refresh tokens
    - Verify refresh token rotation works
    - Verify logout clears session
    - Verify wrong credentials return proper error

HOW WE KNOW IT IS DONE
  - Login with duane.wells@huminic.ai + NexxusTest2026 succeeds
  - Login with wrong password returns 401
  - Refresh token issues new access token
  - Logout clears cookie

FAILS IF
  - Any auth endpoint returns 500

VERIFICATION NOTES
  - Ghost e2e already confirmed auth works (25/25 PASS)
  - Run domain-01-auth.spec.ts to confirm
  - Reference: ghost-e2e-results.md

---

SPRINT V-1.2 — Verify RBAC Enforcement

WHY IT MATTERS
Each role must see only what they're allowed to see.

WHAT GETS BUILT
  (Verification — no code changes expected)
  FE
    - Login as each role, verify nav items match RBAC rules
    - Verify restricted routes redirect to access-denied
  BE
    - Verify requireRole middleware blocks lower roles
    - Verify org-scoped queries return only org data

HOW WE KNOW IT IS DONE
  - Super Admin sees all nav items and all orgs
  - Partner Admin sees child orgs only
  - Org Admin sees own org only
  - Sales/Service staff cannot see Settings or Management
  - API calls with wrong role return 403

FAILS IF
  - Any role sees data from another org
  - Any role accesses a route it shouldn't

VERIFICATION NOTES
  - Test with: duane (super), durran (partner), victoria (org admin), salesmanager@ (manager)
  - Run domain-01-auth.spec.ts tests 1.7 through 1.11

---

SPRINT I-1.3 — Fix Durran's Organization Assignment

WHY IT MATTERS
Durran is partner admin for Cage Automotive (parent of all 5 dealers).
A test run moved him to Serra Honda and it was never reset.

WHAT GETS BUILT
  DT
    - UPDATE users SET organization_id = (Cage Automotive UUID) WHERE email = 'durran@cageautomotive.com'
    - Verify Cage Automotive has partner_id = Huminic

HOW WE KNOW IT IS DONE
  - Login as durran@cageautomotive.com
  - /api/auth/me shows organization = Cage Automotive
  - Org switcher shows all 5 dealerships
  - DB query confirms organization_id = Cage Automotive UUID

FAILS IF
  - Durran still on Serra Honda after fix
  - Durran can't see child dealerships

VERIFICATION NOTES
  - This sprint resolves I-097
  - Reference: logic-audit-answers.md answer #9

---

SPRINT I-1.4 — Fix Victoria's Additional Org Access

WHY IT MATTERS
Victoria is org admin for Serra Honda and should also see Serra Nissan
and Tony Serra Ford (all Sylacauga stores).

WHAT GETS BUILT
  DT
    - UPDATE users SET additional_org_ids = ARRAY[(Serra Nissan UUID), (Tony Serra Ford UUID)]
      WHERE email = 'victoria@misscommunicationconsulting.com'

HOW WE KNOW IT IS DONE
  - Login as victoria
  - Org switcher shows Serra Honda, Serra Nissan, Tony Serra Ford
  - Switching to Serra Nissan shows Serra Nissan data
  - Victoria does NOT see Hyundai or Ford of Columbia

FAILS IF
  - Victoria can't switch to Serra Nissan or Tony Serra Ford
  - Victoria can see Hyundai or Ford of Columbia

VERIFICATION NOTES
  - This sprint resolves I-098
  - Verify with /api/organizations endpoint

---

SPRINT V-1.5 — Verify Password Reset Flow

WHY IT MATTERS
Password reset must work for customer-facing staff.

WHAT GETS BUILT
  (Verification — no code changes expected)
  BE
    - Verify forgot-password endpoint generates token
    - Verify reset-password endpoint accepts valid token
    - Verify token is single-use (SHA-256 hashed)
  IN
    - Verify Resend sends the reset email

HOW WE KNOW IT IS DONE
  - POST /api/auth/forgot-password with valid email → 200
  - Reset token in DB is hashed (not plaintext)
  - POST /api/auth/reset-password with valid token → password changed
  - Using same token again → 400

FAILS IF
  - Reset email doesn't send (check CommGate — may need emailEnabled for Huminic org)
  - Token is stored in plaintext

VERIFICATION NOTES
  - This may require Huminic org to have emailEnabled=true
  - Test with a non-customer email first

---

**Phase 1 Summary**

| Sprint | Type | Issue | What |
|--------|------|-------|------|
| V-1.1 | Verify | — | Login and token flow |
| V-1.2 | Verify | — | RBAC enforcement |
| I-1.3 | Issue | I-097 | Durran org fix |
| I-1.4 | Issue | I-098 | Victoria additional orgs |
| V-1.5 | Verify | — | Password reset flow |

---

SPRINT T-1.EXIT — Phase 1 Exit Inspection

WHY IT MATTERS
Before the next phase starts, confirm this phase is truly done.
Every sprint committed, every acceptance criterion verified,
every test passing.

WHAT GETS BUILT
  (Testing — no code changes)
  - Verify every sprint in this phase has status "committed" in sprints.json
  - Run acceptance criteria for this phase: AC 1.1-1.16
  - Run relevant Playwright tests
  - Check: did any sprint touch files outside its declared scope?
  - Write one-sentence verdict

HOW WE KNOW IT IS DONE
  - All sprints in this phase: status "committed" with valid hash
  - Acceptance criteria checked: Login works, RBAC enforced, org hierarchy correct, password reset works
  - Relevant Playwright tests pass
  - No files modified outside declared scope
  - Verdict written: "Phase 1 is SOLID" or "Phase 1 has issues: [list]"

FAILS IF
  - Any sprint not committed
  - Any acceptance criterion fails
  - Files modified outside scope
  - Verdict is not SOLID

VERIFICATION NOTES
  - Ghost runs /ghost-check at this point
  - If verdict is not SOLID, next phase is BLOCKED
  - Issues found become new sprints in THIS phase (not the next one)


**Phase 1 is DONE when:**
- All users can log in with correct passwords
- Each role sees only what it should
- Durran is on Cage Automotive with all 5 dealers visible
- Victoria sees Serra Honda + Nissan + Tony Serra Ford
- Password reset works end-to-end
