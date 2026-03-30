# Devil's Advocate Report

**Date:** 2026-03-29
**Role:** Skeptic
**Scope:** All evidence from the 2026-03-29 testing session
**Mandate:** Challenge every positive result, find what looks right but is wrong

---

## False Passes

### 1. RBAC Testing Is Fundamentally Broken

The auth helper (`tests/e2e/helpers/auth.ts`, lines 44-68) maps ALL role-specific test accounts -- executive, sales, service, marketing -- to the SAME `serra_honda@huminic.ai` org_admin account. Every test that says "Sales user cannot see X" or "Marketing user is blocked from Y" is logging in as org_admin and testing org_admin permissions. This is not RBAC testing. This is testing one role and calling it five.

The integrity audit (S-9) flagged this explicitly: "All role-specific test accounts were redirected to a single org_admin email, fundamentally changing how RBAC test coverage works." The 13 failing tests in the post-reconciliation suite include 4 RBAC failures (I-178, I-179, I-180, I-181) that are currently categorized as "pre-existing" -- but the real problem is that the passing RBAC tests are false passes. The failures are the only honest RBAC results.

**Verdict:** Every RBAC "PASS" in the E2E suite is meaningless. The system has zero verified role-based access control.

### 2. Campaign Round-Trip Was a FAIL, Not a Pass

The campaign-round-trip test (`campaign-round-trip-2026-03-29.md`) is marked as "FAIL" in its own verdict, but the comms-deep test (`e2e-comms-deep-2026-03-29.md`) marks campaigns as PASS across multiple tests (3, 4, 6, 7). The distinction? The comms-deep tests ran during after-hours and campaigns were BLOCKED by TCPA compliance. They "passed" because blocking is correct behavior during after-hours -- but that means zero campaigns were actually sent and received by a real phone. The campaign send pipeline has never been proven to deliver a message end-to-end during this test session. The round-trip test that actually tried to send during business hours failed 2/2 recipients with no error message.

**Verdict:** Campaign SMS delivery is unproven. The only test that tried real delivery failed silently.

### 3. AI Auto-Response Was Never Triggered

In the campaign round-trip test, after a webhook created a conversation with an inbound message, no AI response was generated. The comms-deep Test 1 also notes "No AI response" -- attributed to after-hours, but after-hours should still trigger an after-hours auto-response. The test says the auto-response "may have been blocked by OUTBOUND_LIVE_ENABLED or TCPA gate" -- that is speculation, not verification. Nobody proved whether the AI auto-response pipeline actually works when a real inbound arrives.

**Verdict:** AI auto-response to inbound messages is unverified. Inbound messages create conversations but may never trigger AI.

### 4. Voice Transcript Storage Is Broken (Marked "Partial Pass")

The comms-deep Test 5 and channel-verify both show VAPI calls completing successfully, but the transcript is NOT stored in the application conversation. The conversation exists in TeamBox but shows no messages. A "partial pass" for the core voice feature -- where the whole point is to capture what was said -- is effectively a fail for production use.

### 5. Multi-Org Isolation Tests Used API Checks, Not Campaign Isolation

The S-9 cross-org isolation tests (AC5, AC6) checked that page content and API responses for one org don't contain strings from other orgs. That is a visibility check, not a campaign isolation check. Nobody tested: "If I create a campaign for Serra Nissan, does it only send to Serra Nissan customers?" Nobody tested: "If Serra Honda's outbound is disabled, does Serra Nissan still send?" The data partition is assumed, not proven, at the campaign execution layer.

---

## Untested Critical Paths

### 1. No Real Customer Has Texted the TextMagic Number

Every SMS test used webhook simulation (`POST /api/webhooks/textmagic`). This proves the webhook handler works when you manually POST to it. It does NOT prove that TextMagic is correctly configured to forward real inbound SMS to the webhook URL. A real customer texting the number may produce nothing if TextMagic's webhook configuration is wrong, the URL is stale, or the number is inactive. Furthermore, **SMS is currently OUT OF CREDITS** per `channel-verify-2026-03-29.md`. The primary customer communication channel is dead.

### 2. Widget Voice-Callback Is Not Tested End-to-End

Issue I-168 explicitly notes "voice callback 404 until deploy." The widget landing page exists and renders, but the voice-callback endpoint that powers the "Call Me Back" flow has never been tested with a real call. The S1 sprint verified the endpoint EXISTS but the feature requires deployment to test. It has not been deployed.

### 3. VAPI-to-VIN Lead Pipeline Is Unverified

Test RI-VAPI-1 ("Elliott calls Caroline") shows the call completes and emails fire, but transcript messages = 0 and RI-VIN-1 ("Warehouse leads have dates") returns 0 rows. The entire voice-to-CRM pipeline -- voice call happens, transcript captured, lead created in VIN Solutions -- has never been proven to work. The evidence shows each piece individually flaky and the chain as a whole untested.

### 4. Password Reset Flow Is Untested

Issues I-140 and I-165 both remain at "NEEDS LIVE TEST." The forgot-password page renders (UI walkthrough confirms), but nobody has tested whether the reset email sends, the token works, and the password actually resets. This is a basic auth flow that will block users if broken.

### 5. Billing Integration Is Non-Functional

Issue I-105 states all FlexPrice endpoints return `{configured: false}`. The billing page renders but does nothing. 26 billing UI states have no functional coverage (I-171).

---

## Data Integrity Concerns

### 1. 478 Unread Messages on +18338096836

The campaign round-trip test documented that phone number +18338096836 has 478 unread messages. This was flagged as "suggests a loop or flood issue from prior testing." Nobody investigated the cause. Nobody cleaned it up. If this number is assigned to a real dealer, those 478 messages are polluting their TeamBox with test garbage. If it is a test number, the flood suggests a bug that could happen to real numbers.

### 2. Test Conversations Polluting Production Data

The comms-deep test created 8+ conversations and 5+ campaigns in the Serra Honda org using fake phone numbers (15553330001-15553330007). These are mixed into the same database as real customer conversations. The TeamBox shows 295 total conversations -- some unknown number of which are test artifacts from 155xxx numbers. There is no cleanup procedure, no test data flag, and no way for a dealer to distinguish test conversations from real ones.

### 3. Duplicate Conversations From Race Condition

The rapid-SMS test (11a) confirmed that 3 concurrent webhooks from the same phone create 3 separate conversations. This is a confirmed, reproducible data integrity bug (I-175). In production, a customer who texts twice quickly will get split conversations, confusing both the AI and human agents. This is marked OPEN with no fix timeline.

### 4. Duplicate Voice Conversations

Test 5 from comms-deep created 2 voice conversations for the same VAPI call (I-177). Same race condition pattern. Every voice call potentially creates duplicate entries.

### 5. Test Campaigns Not Cleaned Up

Five test campaigns were created during comms-deep testing. All are marked "completed" but they remain in the database. The campaign list for Serra Honda now shows test artifacts (e.g., "E2E Deep Test Campaign", "Kill Switch Test Campaign", "Multi-Channel E2E Test") mixed with real campaigns.

---

## Deploy Gap Risk

### 1. Nothing Has Been Deployed

The deploy workflow (`.github/workflows/deploy.yml`) triggers on push to `main`. Current work is on `master` branch. The live site at dev.huminicdev.com is serving whatever was last deployed, which does NOT include:

- S1: voice-callback endpoint
- S3: WhatsApp/Web Chat filter removal
- S4: campaign channel checkboxes (replacing dropdown)
- S5: token refresh fix for marketing agents
- S8: TopBar cleanup, landing page fixes
- S9: RBAC changes (though the integrity audit found S9 RBAC changes were never even committed -- the dev-report claimed changes to rbac.ts and management.tsx that don't exist in the git diff)

Every UI fix verified in the walkthrough was verified against the dev server running local code, not the deployed production build. There is zero evidence any fix works in production.

### 2. The S9 RBAC Code Was Never Written

The integrity audit flagged this as a critical finding: "Dev-report claims RBAC code changes that do not exist in the git commit. The dev-report states RBAC modifications were made to rbac.ts and management.tsx, but the commit contains zero changes to those files. This is either fabricated evidence or the changes were never actually committed." This means the Management tab restriction to super_admin -- which the UI walkthrough marked as "PASS (redirects correctly)" -- may be working by coincidence or prior configuration, not because of S9 code changes.

### 3. Build Has Never Been Tested

The deploy.yml runs `npm run build` and `npx tsc --noEmit` as part of CI. But there is no evidence that a production build has been attempted locally or in CI since the sprint changes. TypeScript compilation errors, missing environment variables, or build-time failures could block deployment entirely.

---

## Pre-Launch Warnings

### 1. Server Restart Destroys Sessions

Auth uses JWT tokens with httpOnly refresh cookies stored in a database sessions table. This should survive restarts. However, the UI walkthrough noted: "Direct URL navigation causes session loss, redirecting to /login. SPA navigation via sidebar buttons maintains session correctly." This suggests the auth token refresh mechanism has issues beyond just full page reloads. If Coolify restarts the container, every active user will be logged out and may not be able to re-authenticate smoothly.

### 2. No Monitoring Exists

A grep for "monitoring", "alerting", "dead letter", "retry queue", and "failed webhook" across the server code returned zero results. There is:
- No alerting when SMS sends fail
- No retry mechanism for failed webhook deliveries
- No dead letter queue for messages that fail to process
- No monitoring for VAPI webhook failures
- No alerting when TextMagic credits run out (they are currently out)
- No health check beyond "does the HTTP endpoint return 200"

If a campaign sends to 500 customers and 400 fail silently (as happened in the round-trip test), nobody will know until a dealer complains.

### 3. SMS Is Out of Credits

The channel verification explicitly states: `SMS (TextMagic) | OUT OF CREDITS`. The primary customer communication channel is non-functional. Campaign sends will fail. Inbound processing may still work (webhooks don't require credits), but outbound is dead.

### 4. No Build/Deploy Documentation

There is a `.github/workflows/deploy.yml` but no documentation of:
- How to trigger a manual deployment
- What environment variables are required and where they are configured
- How to verify a deployment succeeded
- How to roll back a failed deployment
- What the relationship between `master` branch (current work) and `main` branch (deploy trigger) is
- Whether Coolify webhook URL and API token are configured in GitHub secrets

### 5. Governance Process Has Eroded

The integrity audit found:
- S-3 had no operator approval on file
- S-9 dev-report contains fabricated evidence (RBAC changes claimed but not committed)
- S-10 silently modified the governance file (issues.md)
- S-9 consolidated all RBAC test accounts to a single org_admin, destroying role test coverage
- Operator approvals across all sprints lack scope specificity ("OPERATOR APPROVED" with no details)

The governance process that was supposed to catch problems has itself become a rubber stamp.

### 6. 103 Stub Tests Still Exist

Issue I-104 notes 103 stub tests in observability/ that should be deleted. Issue I-103 notes 6 always-true assertions. These inflate test counts and create false confidence. The "288 passed" headline number includes tests that pass by doing nothing.

---

## Verdict

**This system is not launch-ready.**

The evidence portfolio looks impressive at a glance -- 288 tests passing, 15 pages loading, multiple channels operational. But the skeptical read reveals:

1. **SMS, the primary channel, is out of credits.** No outbound messages can be sent.
2. **Campaign delivery has never been proven.** The only real send attempt failed 2/2 with no error.
3. **RBAC is untested.** Every role test uses the same org_admin account. Four RBAC bugs are confirmed open.
4. **Voice transcripts don't reach the app.** Calls complete but conversations show no content.
5. **Race conditions create duplicate data.** Both SMS and voice have confirmed duplicate-creation bugs.
6. **Nothing is deployed.** All fixes exist in source only. The production site serves old code.
7. **No monitoring exists.** Failures are silent. Credits ran out with no alert.
8. **The governance process has holes.** Fabricated evidence in S-9, unauthorized modifications in S-10, missing approvals in S-3.

The system has working building blocks -- the AI chat is genuinely impressive, the VAPI integration calls and emails fire, the TCPA compliance gates work, the widget form creates conversations. But "building blocks work in isolation" is different from "system is reliable for real customers."

**Before launch, at minimum:**
- Refill TextMagic credits and prove a real SMS round-trip (not webhook simulation)
- Fix the duplicate conversation race condition (I-175)
- Create real role-specific test accounts and re-run RBAC tests
- Deploy to production and re-verify
- Fix voice transcript storage (I-176)
- Add basic monitoring/alerting for send failures and credit exhaustion
- Have a real phone text the TextMagic number and confirm the full flow works

The gap between "tests pass" and "system works for customers" is still wide.
