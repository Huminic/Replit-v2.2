# Pre-Execution Report: REM-10
Timestamp: 2026-03-20T16:00:00Z
Sprint: REM-10
Status: READY

## Objective
Fix all blockers preventing real end-to-end communication testing. Fix email notification recipient logic to walk the org hierarchy. Fix user/org assignments. Update VAPI webhook URLs to point to live.huminic.app. Verify the full pipeline works with real calls, real emails, real VIN lead insertion. Send notification emails for the March 18-19 inbound calls to the correct org admins. Run the complete test suite with evidence.

## Declared Files
- server/routes/webhooks.ts (email recipient logic — walk org hierarchy for partner_admin)
- server/routes/appointments.ts (source field preservation — I-095)
- server/sync.ts (already fixed — needs rebuild)
- tests/e2e/live-comms.spec.ts (callMCP response parsing fix)
- tests/e2e/real-integrations.spec.ts (VAPI Elliott real call, test design fixes)
- tests/e2e/deep-coverage.spec.ts (appointment source assertion)
- tests/e2e/visual-components.spec.ts (add to test run)
- playwright.config.ts
- evidence/REM-10/
- issues.md
- sprints.json

## Success Criteria

### Data Fixes (pre-code)
- Durran (durran@cageautomotive.com) moved back to Cage Automotive org
- Victoria (victoria@misscommunicationconsulting.com) has additional_org_ids = [Serra Nissan, Tony Serra Ford]
- Sam (sam.mayfield@bc.auto) verified on Hyundai of Columbia
- admin@ test accounts identified for removal post-testing

### Code Fixes
- Email notification recipient logic walks org hierarchy: when a call comes to Ford of Columbia, it finds Durran (partner_admin on Cage Automotive, parent of Ford) and includes him
- Super Admin (duane.wells@huminic.ai) receives ALL store notifications (already works)
- Partner Admin receives notifications for ALL child stores of their org
- Org Admin receives notifications for their org + additional_org_ids stores
- Appointment source field preserves the value passed during creation (I-095)
- live-comms.spec.ts callMCP response parsing matches vendorProxy.ts logic (TI-015)

### Infrastructure
- VAPI assistant serverUrl updated to https://live.huminic.app/api/webhooks/vapi (all 5 dealer assistants)
- Tavus webhook URL updated to https://live.huminic.app/api/webhooks/tavus
- Verify webhook endpoint responds at live.huminic.app before updating VAPI
- App rebuilt with sync.ts date fix and deployed via PM2

### Real Comms Verification
- Send test email to duanekwells@gmail.com via webhook email template — user confirms receipt
- Replay March 18-19 inbound calls through webhook: 5 real calls across 3 stores
  - Hyundai: 019d088a (+1 618-317-4312), 019d0877 (+1 866-242-2720) → email to sam.mayfield@bc.auto, durran@cageautomotive.com, duane.wells@huminic.ai
  - Ford: 019d087c (+1 615-308-3969), 019d062b (+1 864-546-2319) → email to durran@cageautomotive.com, duane.wells@huminic.ai
  - Serra Nissan: 019d0611 (+1 256-626-4331) → email to victoria@misscommunicationconsulting.com, durran@cageautomotive.com, duane.wells@huminic.ai
- Each call creates VIN Solutions contact in the correct dealer under Durran Cage's account
- Each call creates a conversation in TeamBox with transcript
- Elliott test call: Elliott calls Caroline (Serra Honda) → webhook fires → conversation + transcript in TeamBox → email to victoria, durran, duane → VIN contact created
- SMS test: add user's phone (+14126546500) to service campaign → send real SMS → verify receipt
- Inbound SMS 2-way: send inbound to sales → AI responds → verify in TeamBox
- Trigger test: new VIN lead → verify trigger fires → check scheduled_actions

### Full Test Suite
- ALL test files run (including visual-components.spec.ts)
- 5-phase suite with gates
- All failures logged to issues.md
- Evidence: screenshots, API responses, email confirmations, DB state queries

## Constraints
- Do NOT send emails to anyone except: duanekwells@gmail.com (test), duane.wells@huminic.ai, durran@cageautomotive.com, victoria@misscommunicationconsulting.com, sam.mayfield@bc.auto
- Do NOT send to admin@ test accounts
- Builder agents MUST NOT modify files outside project directory
- VAPI webhook URL update uses VAPI API key (not MCP — direct VAPI API)
- Verify webhook endpoint responds BEFORE updating VAPI assistant serverUrl
- Real SMS uses +14126546500 (user's phone) — one test only

## Dependency Order
1. Fix data: Durran org, Victoria additional_org_ids
2. Fix code: email recipient hierarchy walk, appointment source
3. Rebuild app + restart PM2
4. Verify webhook endpoint at live.huminic.app
5. Update VAPI/Tavus webhook URLs
6. Send test email to duanekwells@gmail.com — wait for user confirmation
7. Replay March 18-19 calls — verify emails + VIN leads
8. Elliott test call — verify full pipeline
9. SMS tests
10. Fix test infrastructure (callMCP parsing, test design)
11. Run full test suite
12. Log findings to issues.md
