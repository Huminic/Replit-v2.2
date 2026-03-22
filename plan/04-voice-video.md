# Phase 4 — Voice & Video

**Phase Description**
VAPI voice calls and Tavus video sessions producing conversations,
transcripts, email notifications, and VIN leads. This is the pipeline
that turns a phone call or video chat into actionable data.

**Open Issues:** I-093, I-094, I-099, I-100
**Depends On:** Phase 3 (Communications — CommGate must work)
**Personas:**
- Caroline — Sales voice/video (Serra Honda, all Serra stores)
- Elizabeth — Sales voice (Hyundai of Columbia)
- Savannah — Sales voice (Ford of Columbia)
- Magnolia — Sales voice (Serra Nissan)
- Nancy Gaston — Service voice/video (Serra stores) [TO BE CONFIGURED]

---

---

SPRINT E-4.0 — Phase 4 Entry Inspection

WHY IT MATTERS
Before any work starts in this phase, verify the foundation is solid.
If a dependency is broken, everything built on top of it fails.

WHAT GETS BUILT
  (Exploratory — read only, no code changes)
  - Verify dependencies: Phase 3
  - Check files this phase will touch for uncommitted changes:
    server/routes/webhooks.ts, server/vendorProxy.ts, server/routes/integrations.ts
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


SPRINT G-4.1 — Nancy Gaston Service Persona Setup

WHY IT MATTERS
Service departments need their own voice/video persona. Nancy Gaston
is the service persona for Serra stores. Without her configured,
service calls and videos have no agent to handle them.

WHAT GETS BUILT
  DT
    - Create agent record: name="Nancy Gaston", department="service",
      type="ai", status="active", channels=["voice","video","sms"],
      organizationId=(Serra Honda UUID)
    - Set vapiAssistantId after owner provides VAPI assistant ID
    - Set tavusPersonaId after owner provides Tavus persona ID
  IN
    - Owner creates VAPI assistant for Nancy Gaston (owner task)
    - Owner creates Tavus persona for Nancy Gaston (owner task)
    - Owner provides IDs back to dev agent

HOW WE KNOW IT IS DONE
  - Agent record exists in database for Nancy Gaston
  - GET /api/agents returns Nancy Gaston for Serra Honda
  - vapiAssistantId and tavusPersonaId are set (not null)

WHAT IT DOES NOT INCLUDE
  - VAPI/Tavus account creation (owner does this)
  - Writing Nancy Gaston's prompt/instructions (separate sprint)
  - Connecting a phone number (owner provides)

FAILS IF
  - Agent record missing or has wrong department
  - No vapiAssistantId set (blocks voice testing)

VERIFICATION NOTES
  - BLOCKED until owner provides VAPI assistant ID and Tavus persona ID
  - Owner handles vendor account setup, dev agent handles database record

---

SPRINT I-4.2 — Update VAPI Webhook URLs

WHY IT MATTERS
5 real inbound calls on March 19 were lost because VAPI's webhook
URL still points to the old app (nexxusv2.huminicdev.com). Every
call that comes in goes nowhere until this is fixed.

WHAT GETS BUILT
  IN
    - Update serverUrl on all 5 VAPI assistants to https://live.huminic.app/api/webhooks/vapi
    - Use VAPI API (vapi_update_assistant MCP tool) to update each assistant
    - Verify webhook responds: GET https://live.huminic.app/api/webhooks/vapi → 200

HOW WE KNOW IT IS DONE
  - All 5 VAPI assistants have serverUrl = https://live.huminic.app/api/webhooks/vapi
  - GET to the webhook URL returns 200
  - A test call to any store number triggers the webhook (verify in server logs)

WHAT IT DOES NOT INCLUDE
  - Fixing the webhook handler code (already done in Phase 3)
  - Nancy Gaston's assistant (Sprint G-4.1)

FAILS IF
  - Any assistant still points to old URL
  - Webhook endpoint returns error

VERIFICATION NOTES
  - IRREVERSIBLE — this changes where real customer calls go
  - Owner must approve before execution
  - Verify the app at live.huminic.app is running and healthy first
  - This sprint resolves I-099

---

SPRINT I-4.3 — Update Tavus Webhook URL

WHY IT MATTERS
Tavus transcript callbacks are going to the old app URL.
Video session transcripts are lost.

WHAT GETS BUILT
  IN
    - Update Tavus webhook URL to https://live.huminic.app/api/webhooks/tavus
    - Verify with Tavus API or dashboard

HOW WE KNOW IT IS DONE
  - Tavus webhook points to live.huminic.app
  - POST to webhook endpoint with test payload → 200

WHAT IT DOES NOT INCLUDE
  - Testing a real video session (Sprint T-4.5)

FAILS IF
  - Webhook still points to old URL

VERIFICATION NOTES
  - IRREVERSIBLE — owner must approve
  - This sprint resolves I-100

---

SPRINT I-4.4 — VAPI End-to-End Call Test (Elliott)

WHY IT MATTERS
No real VAPI call has been verified end-to-end in the new codebase.
This sprint uses Elliott to make a real call and traces the entire
pipeline.

WHAT GETS BUILT
  (Testing sprint — verifies existing code)
  BE
    - Use Elliott test agent to call Caroline (Serra Honda)
    - Wait for call to complete
    - Verify: webhook fires at live.huminic.app
    - Verify: conversation created in TeamBox
    - Verify: transcript parsed and stored
    - Verify: email notification sent to correct admins (I-087 fix)
    - Verify: VIN lead created via vin-safe-mcp (prepare + review)
  IN
    - DRY-RUN REQUIRED: show VIN lead preview before executing

HOW WE KNOW IT IS DONE
  - Conversation exists in conversations table with channel="voice"
  - Message exists with transcript content
  - Email sent to: victoria, durran, duane (for Serra Honda)
  - VIN lead created under Durran Cage at Serra Honda
  - outboundLog shows email with status="sent"
  - usageEvents shows voice_minute event

WHAT IT DOES NOT INCLUDE
  - Fixing any code (if something fails, create an issue and stop)
  - Testing other stores (Serra Honda first, then expand)

FAILS IF
  - Webhook doesn't fire
  - Conversation not created
  - Email goes to wrong person
  - VIN lead goes to wrong sales rep

VERIFICATION NOTES
  - This sprint resolves I-093
  - Uses Elliott test agent at /home/ubuntu/Claude-store/nexxus/
  - DRY-RUN: show VIN lead preview to owner before executing
  - If any step fails, STOP and create issue. Do not work around it.

---

SPRINT I-4.5 — Tavus Video Session and Transcript Test

WHY IT MATTERS
No Tavus video session has been verified to produce a transcript
that arrives in TeamBox.

WHAT GETS BUILT
  (Testing sprint)
  BE
    - Create a Tavus video session via POST /api/widget/video-session
    - Verify session URL is returned
    - Verify: when session ends, webhook fires
    - Verify: conversation created with transcript
    - Verify: email notification sent

HOW WE KNOW IT IS DONE
  - Video session URL returned from API
  - After session ends, conversation exists in TeamBox
  - Transcript content is in the message
  - Email notification sent to correct admins

WHAT IT DOES NOT INCLUDE
  - Actually joining the video session (may require manual test)
  - VIN lead creation from video (separate sprint)

FAILS IF
  - Session URL not returned
  - Webhook doesn't fire after session ends
  - Transcript missing from conversation

VERIFICATION NOTES
  - This sprint resolves I-094
  - May require manual interaction to complete a video session
  - If webhook doesn't fire, check Tavus webhook URL (I-4.3 must be done first)

---

SPRINT I-4.6 — Appointment Source Field Fix

WHY IT MATTERS
When a voice call or video session creates an appointment, the source
field defaults to "manual" instead of preserving "vapi" or "tavus".

WHAT GETS BUILT
  BE
    - Fix server/routes/appointments.ts to preserve the source parameter
      from the caller instead of defaulting to "manual"
    - Fix webhooks.ts to pass source="vapi" or source="tavus" when creating appointments

HOW WE KNOW IT IS DONE
  - Appointment created from VAPI webhook has source="vapi"
  - Appointment created from Tavus webhook has source="tavus"
  - Manually created appointment has source="manual"
  - DC-SCHED-3 test passes

FAILS IF
  - Source field still defaults to "manual" for webhook-created appointments

VERIFICATION NOTES
  - This sprint resolves I-095
  - Small change — 1-2 files

---

**Phase 4 Summary**

| Sprint | Type | Issue | What |
|--------|------|-------|------|
| G-4.1 | Gap | — | Nancy Gaston persona setup (BLOCKED on owner) |
| I-4.2 | Issue | I-099 | Update VAPI webhook URLs (IRREVERSIBLE) |
| I-4.3 | Issue | I-100 | Update Tavus webhook URL (IRREVERSIBLE) |
| I-4.4 | Issue | I-093 | VAPI end-to-end call test with Elliott |
| I-4.5 | Issue | I-094 | Tavus video session + transcript test |
| I-4.6 | Issue | I-095 | Appointment source field fix |

---

SPRINT T-4.EXIT — Phase 4 Exit Inspection

WHY IT MATTERS
Before the next phase starts, confirm this phase is truly done.
Every sprint committed, every acceptance criterion verified,
every test passing.

WHAT GETS BUILT
  (Testing — no code changes)
  - Verify every sprint in this phase has status "committed" in sprints.json
  - Run acceptance criteria for this phase: AC 11.2-11.8
  - Run relevant Playwright tests
  - Check: did any sprint touch files outside its declared scope?
  - Write one-sentence verdict

HOW WE KNOW IT IS DONE
  - All sprints in this phase: status "committed" with valid hash
  - Acceptance criteria checked: VAPI call → TeamBox → email → VIN lead, Tavus session → transcript, appointments have correct source
  - Relevant Playwright tests pass
  - No files modified outside declared scope
  - Verdict written: "Phase 4 is SOLID" or "Phase 4 has issues: [list]"

FAILS IF
  - Any sprint not committed
  - Any acceptance criterion fails
  - Files modified outside scope
  - Verdict is not SOLID

VERIFICATION NOTES
  - Ghost runs /ghost-check at this point
  - If verdict is not SOLID, next phase is BLOCKED
  - Issues found become new sprints in THIS phase (not the next one)


**Phase 4 is DONE when:**
- Elliott can call Caroline and the entire pipeline fires
- Tavus video produces a transcript in TeamBox
- Email notifications go to the right admins
- VIN leads are created under the right sales rep
- Appointment source field is correct
- Nancy Gaston is configured and ready for service calls
