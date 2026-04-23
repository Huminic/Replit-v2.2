# Phase 3 — Communications & CommGate

**Phase Description**
The core communication system enabling two-way SMS between staff
and customers, with CommGate controlling all outbound traffic.
This phase must work end-to-end before Voice (Phase 4), Campaigns
(Phase 6), Triggers (Phase 7), and Notifications (Phase 9) can proceed.

**Open Issues:** I-087, I-091, I-092, I-101, I-102
**Depends On:** Phase 1 (Auth)
**Personas:** Caroline (sales SMS), Nancy Gaston (service SMS — TO BE CONFIGURED)

---

---

SPRINT E-3.0 — Phase 3 Entry Inspection

WHY IT MATTERS
Before any work starts in this phase, verify the foundation is solid.
If a dependency is broken, everything built on top of it fails.

WHAT GETS BUILT
  (Exploratory — read only, no code changes)
  - Verify dependencies: Phase 1
  - Check files this phase will touch for uncommitted changes:
    server/routes/sms.ts, server/outbound.ts, server/routes/webhooks.ts, server/routes/conversations.ts, server/routes/campaigns.ts
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


SPRINT I-3.1 — Commit Uncommitted CommGate Guard

WHY IT MATTERS
The webhooks.ts CommGate guard was deployed to production without a commit.
This is a governance violation that must be resolved before any other work.

WHAT GETS BUILT
  BE
    - Verify server/routes/webhooks.ts CommGate check at sendLeadNotificationEmail is correct
    - Ensure org.outboundEnabled and org.emailEnabled are checked before any email send
  IN
    - Commit through pre-commit hook with proper sprint registration

HOW WE KNOW IT IS DONE
  - webhooks.ts is committed with a valid commit hash in sprints.json
  - Watchdog scan shows no C16 violation for webhooks.ts
  - CommGate check exists at server/routes/webhooks.ts before every email send

WHAT IT DOES NOT INCLUDE
  - Email template fix (Sprint I-3.2)
  - Recipient hierarchy fix (Sprint I-3.2)
  - Re-enabling outbound (Sprint I-3.6)

FAILS IF
  - webhooks.ts has uncommitted changes after this sprint
  - CommGate check is missing or incomplete

VERIFICATION NOTES
  - Ghost scan (C14) should show PASS for webhooks.ts
  - This sprint resolves I-102

---

SPRINT I-3.2 — Email Notification Template and Recipient Hierarchy

WHY IT MATTERS
Email notifications sent to org admins when leads arrive had the wrong
template and wrong recipients. Durran (partner admin) was missing from
child store notifications. This caused real customer impact.

WHAT GETS BUILT
  BE
    - Copy working email template from /home/ubuntu/Live-Store/nexxus/server/services/notifications/notificationEmailService.ts
    - Fix sendLeadNotificationEmail to walk org hierarchy via partner_id:
      For any child store call → include org admins (level 3) + partner admins of parent org (level 2) + super admins (level 1)
    - Remove hardcoded admin@ test email addresses from recipient logic
  DT
    - No schema changes — uses existing organizations.partnerId and users.roleId

HOW WE KNOW IT IS DONE
  - Hyundai call → email to: sam.mayfield@bc.auto, durran@cageautomotive.com, duane.wells@huminic.ai
  - Ford call → email to: durran@cageautomotive.com, duane.wells@huminic.ai
  - Serra Honda call → email to: victoria@misscommunicationconsulting.com, durran@cageautomotive.com, duane.wells@huminic.ai
  - Serra Nissan call → email to: victoria, durran, duane
  - Tony Serra Ford call → email to: victoria, durran, duane
  - CommGate OFF → no emails sent (verify log shows "blocked")
  - No admin@*.com addresses in any recipient list

WHAT IT DOES NOT INCLUDE
  - Actually sending emails (CommGate is OFF — Sprint I-3.6 enables it)
  - This sprint verifies the LOGIC, not the delivery

FAILS IF
  - Partner admin (Durran) is missing from any child store notification
  - Any admin@ test address appears in recipient list
  - Email sends when CommGate emailEnabled is false

VERIFICATION NOTES
  - Test by posting a mock webhook payload and checking the recipient resolution logic
  - Do NOT enable CommGate during this sprint
  - This sprint resolves I-087

---

SPRINT I-3.3 — SMS Human Takeover Fix

WHY IT MATTERS
When a human takes over a conversation in TeamBox, the AI agent should
stop responding. Currently there's a race condition where the AI can
respond after takeover because aiPaused is computed on a stale reference.

WHAT GETS BUILT
  BE
    - Fix server/routes/sms.ts AI response logic to re-read conversation
      from database BEFORE checking assignedTo (not use the stale object)
    - Add explicit aiPaused check that queries the current conversation state
    - Ensure the check is atomic — no window between read and decision

HOW WE KNOW IT IS DONE
  - Assign a conversation to a user (takeover)
  - Send an inbound SMS to that conversation's phone number
  - AI does NOT respond
  - Remove assignment (release takeover)
  - Send another inbound SMS
  - AI DOES respond
  - Test RI-SMS-4 passes

WHAT IT DOES NOT INCLUDE
  - Persisting aiPaused as a database column (computed from assignedTo is OK if read is fresh)
  - Frontend takeover UI changes

FAILS IF
  - AI responds to a conversation that has assignedTo set
  - AI fails to respond to a conversation that has no assignedTo

VERIFICATION NOTES
  - The fix must re-query the conversation, not use the object from the webhook handler
  - This sprint resolves I-091

---

SPRINT I-3.4 — Remove Campaign Hardcoded dryRun

WHY IT MATTERS
Campaign execution has dryRun hardcoded to true. No real SMS has ever
been sent through a campaign. CommGate is the safety gate, not dryRun.

WHAT GETS BUILT
  BE
    - Remove hardcoded dryRun=true from campaign execution in server/routes/campaigns.ts
    - Verify CommGate check exists in processOutboundSend() path for campaign sends
    - Verify rate limiting works (3 per 24h per phone, configurable)

HOW WE KNOW IT IS DONE
  - Campaign execution calls processOutboundSend() without dryRun flag
  - CommGate check is verified in the execution path
  - outboundLog entries show status="sent" (not "dry_run") when CommGate is ON
  - outboundLog entries show status="blocked" when CommGate is OFF

WHAT IT DOES NOT INCLUDE
  - Actually executing a campaign (CommGate is OFF — Sprint I-3.6)
  - Campaign UI changes
  - Multi-channel campaign support

FAILS IF
  - Campaign execution still uses dryRun=true
  - Campaign bypasses CommGate
  - Rate limiting doesn't work

VERIFICATION NOTES
  - This sprint resolves I-092
  - Do NOT enable CommGate during this sprint

---

SPRINT I-3.5 — After-Hours Message Queueing

WHY IT MATTERS
Messages should not go out between 10 PM and 7 AM. They should queue
and release at 7 AM. This is a compliance and customer experience requirement.

WHAT GETS BUILT
  BE
    - Verify after-hours check in server/routes/sms.ts reads org.settings.businessHoursStart/End
    - Set defaults to 07:00 and 22:00 if not configured
    - Add queueing logic: if after hours, write to scheduledActions with executeAt = next 7 AM
    - Add scheduler check: process scheduledActions where executeAt <= now
  DT
    - scheduledActions table already exists — verify it handles queued messages
  FE
    - Add business hours fields to org settings UI (Settings → Organization)

HOW WE KNOW IT IS DONE
  - SMS sent at 10:30 PM does NOT go out immediately
  - SMS appears in scheduledActions with executeAt = next 7:00 AM
  - Scheduler processes the action at 7:00 AM and sends via CommGate
  - Business hours are configurable per org in Settings

WHAT IT DOES NOT INCLUDE
  - After-hours auto-response (separate sprint)
  - Phone call queueing (same mechanism but separate sprint)

FAILS IF
  - Message goes out during blackout window
  - Queued message is lost (never sends)
  - Business hours cannot be configured per org

VERIFICATION NOTES
  - Test with a mock clock or by temporarily setting business hours to a narrow window
  - Verify scheduledActions table entries are created and processed

---

SPRINT I-3.6 — Re-Enable CommGate Per Org

WHY IT MATTERS
All outbound is currently disabled (emergency shutdown). After I-087,
I-091, I-092, and I-3.5 are committed and verified, outbound can be
safely re-enabled one org at a time.

WHAT GETS BUILT
  DT
    - Enable outbound for Serra Honda ONLY:
      UPDATE organizations SET outbound_enabled=true, sms_enabled=true, email_enabled=true
      WHERE slug='serra-honda'
  IN
    - Verify CommGate check is in place for all outbound paths
    - Send a single test SMS to owner's phone (+14126546500)
    - Verify email notification sends correctly (dry-run with test webhook payload)

HOW WE KNOW IT IS DONE
  - Owner receives test SMS on their phone
  - Email notification sends to correct recipients (from I-3.2 fix)
  - CommGate blocks sends for orgs that are still disabled
  - outboundLog shows "sent" for Serra Honda, "blocked" for other orgs

WHAT IT DOES NOT INCLUDE
  - Enabling other orgs (done incrementally after Serra Honda is verified)
  - Production deployment (still on dev.huminicdev.com)

FAILS IF
  - SMS or email sends to the wrong person
  - CommGate doesn't block disabled orgs
  - Any outbound goes to a customer (test to owner only)

VERIFICATION NOTES
  - IRREVERSIBLE ACTION — owner must approve before enabling
  - Enable ONE org at a time
  - After Serra Honda verified, repeat for remaining 4 orgs in separate commits
  - This sprint resolves I-101

---

SPRINT V-3.7 — SMS Inbound Greeting Verification

WHY IT MATTERS
When a new customer texts the store number, the system should send
an auto-greeting if the agent has one configured. This needs verified.

WHAT GETS BUILT
  (Verification sprint — no code changes expected)
  BE
    - Verify server/routes/sms.ts auto-greeting logic
    - Verify greeting only fires once per new conversation
    - Verify greeting respects CommGate
  FE
    - Verify auto-greeting config field exists in agent settings

HOW WE KNOW IT IS DONE
  - New inbound SMS from unknown number → auto-greeting sent
  - Second SMS from same number → NO greeting (existing conversation)
  - CommGate OFF → greeting blocked
  - Agent with no autoGreeting configured → no greeting sent

WHAT IT DOES NOT INCLUDE
  - Service-specific greetings (requires Nancy Gaston persona setup)
  - Greeting template management

FAILS IF
  - Greeting fires on every message (not just first)
  - Greeting ignores CommGate

VERIFICATION NOTES
  - This is a VERIFICATION sprint — if tests pass, mark as done
  - If greeting logic is broken, convert to development sprint

---

**Phase 3 Summary**

| Sprint | Type | Issue | Status |
|--------|------|-------|--------|
| I-3.1 | Issue | I-102 | Commit uncommitted webhooks.ts |
| I-3.2 | Issue | I-087 | Email template + recipients |
| I-3.3 | Issue | I-091 | SMS takeover race condition |
| I-3.4 | Issue | I-092 | Remove hardcoded dryRun |
| I-3.5 | Gap | — | After-hours message queueing |
| I-3.6 | Issue | I-101 | Re-enable CommGate per org |
| V-3.7 | Verify | — | SMS inbound greeting |

---

SPRINT T-3.EXIT — Phase 3 Exit Inspection

WHY IT MATTERS
Before the next phase starts, confirm this phase is truly done.
Every sprint committed, every acceptance criterion verified,
every test passing.

WHAT GETS BUILT
  (Testing — no code changes)
  - Verify every sprint in this phase has status "committed" in sprints.json
  - Run acceptance criteria for this phase: AC 4.1-4.10, 5.1-5.10, 9.5
  - Run relevant Playwright tests
  - Check: did any sprint touch files outside its declared scope?
  - Write one-sentence verdict

HOW WE KNOW IT IS DONE
  - All sprints in this phase: status "committed" with valid hash
  - Acceptance criteria checked: SMS two-way works, CommGate controls outbound, takeover pauses AI, email notifications correct
  - Relevant Playwright tests pass
  - No files modified outside declared scope
  - Verdict written: "Phase 3 is SOLID" or "Phase 3 has issues: [list]"

FAILS IF
  - Any sprint not committed
  - Any acceptance criterion fails
  - Files modified outside scope
  - Verdict is not SOLID

VERIFICATION NOTES
  - Ghost runs /ghost-check at this point
  - If verdict is not SOLID, next phase is BLOCKED
  - Issues found become new sprints in THIS phase (not the next one)


**Phase 3 is DONE when:**
- Owner can send and receive SMS with a customer
- Human takeover stops AI from responding
- Campaigns can execute with real SMS (when CommGate is ON)
- Email notifications go to the right people
- Nothing goes out during blackout hours
- CommGate controls all outbound
