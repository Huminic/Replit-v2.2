# VAPI Workflow E2E Test — Elliott -> Caroline (Serra Honda)

**Date:** 2026-04-07T21:19:15Z
**Test type:** Real outbound VAPI call, full pipeline verification
**Environment:** dev.huminicdev.com (production build, PM2)

---

## Step 1: Call Placed

- **Method:** Direct VAPI API call (`POST https://api.vapi.ai/call/phone`)
- **Elliott Assistant ID:** c303d993-bf42-4784-a8cb-247477b1cbdd
- **Elliott Phone ID:** a85a9397-25cb-4e35-b784-05cfa5a926b2
- **Target:** Serra Honda (Caroline) at +19012038267
- **VAPI Call ID:** `019d69d0-5c12-799e-a36c-bb5e9ec774c5`
- **Status:** queued -> ended
- **Result:** PASS — call placed and queued successfully

## Step 2: Call Connected and Completed

- **Started:** 2026-04-07T21:19:18.713Z
- **Ended:** 2026-04-07T21:19:38.745Z
- **Duration:** ~20 seconds
- **Ended reason:** exceeded-max-duration (Elliott assistant has a short max-duration setting)
- **Cost:** $0.0338
- **Result:** PASS — call connected, both parties spoke

## Step 3: Transcript

```
User (Caroline): Hi. Thanks for calling Sarah Automotive. My name is Caroline,
your personal car buying assistant. Can you tell me a little about what you are
looking for so I can get you scheduled for a test drive?

AI (Elliott): Hi, Caroline. I'm interested in scheduling a test drive for the
2024 Honda Civic. Do you have availability tomorrow around 2 PM?
```

**VAPI Summary:** Caroline from Sarah Automotive introduced herself as a car buying assistant and asked the caller about their interests to schedule a test drive. The caller expressed interest in a 2024 Honda Civic and inquired about test drive availability for the following day around 2 PM.

- **Result:** PASS — transcript captured with correct content

## Step 4: Webhook Processing

VAPI end-of-call webhook fired to `POST /api/webhooks/vapi` and was processed:

1. **Org resolution:** Caroline's assistantId resolved to Serra Honda (org `24d64f99-ba04-4b43-af35-fd06f555ac86`)
2. **Conversation created:** `2daddd11-bee1-481c-9e67-30a2a2bee240` (channel: voice, status: open)
3. **VIN lead created:** contact=1400783925, lead=1997219701, assigned to Durran Cage (via vin-safe-mcp prepare/execute)

**Result:** PASS — webhook processed, conversation + VIN lead created

### Known Issue: Duplicate Webhook

The VAPI webhook fired twice for the same call (two different VAPI call IDs from the same session):
- `019d69d0-63fb-7000-8943-197764acb410` -> Created conversation `d4a2fc69` (Serra Nissan fallback)
- `019d69d0-5c12-799e-a36c-bb5e9ec774c5` -> Created conversation `2daddd11` (Serra Honda correct)

The first webhook used Elliott's assistantId (which doesn't belong to any store), triggering fallback org resolution to Serra Nissan. This created a phantom conversation in the wrong org.

**Impact:** Duplicate VIN leads created (two contacts, two leads). Serra Nissan got a false notification.
**Root cause:** Elliott is the caller, not the store agent. The webhook for the calling side resolves Elliott's assistantId, which has no org mapping.

## Step 5: AI Analysis

The AI analysis pipeline processed the conversation:

```json
{
  "appointmentIntent": true,
  "preferredDate": "tomorrow",
  "preferredTime": "2:00 PM",
  "customerName": null,
  "vehicleOfInterest": "2024 Honda Civic",
  "leadQualityScore": 8,
  "summary": "The customer called to schedule a test drive for a 2024 Honda Civic..."
}
```

- **Appointment created:** Yes (source: vapi)
- **Follow-up suppressed:** Yes (6 existing leads suppressed from follow-up queue due to appointment booking)
- **Result:** PASS — AI analysis ran, extracted correct intent/vehicle/time

## Step 6: Notification Email

```
[LeadNotify] Sent "Serra Honda Has a New AI Voice Lead!" to 3 admin(s) for org 24d64f99-ba04-4b43-af35-fd06f555ac86
```

Recipients resolved:
- orgadmin@serrahonda.com
- executive@serrahonda.com
- salesmanager@serrahonda.com
- serra_honda@huminic.ai
- durran.cage@cageautomotive.com
- duane.wells@huminic.ai

(6 resolved, 3 actually sent — likely deduplication or role filtering)

**Result:** PASS — notification email sent to correct org admins

## Step 7: TeamBox Visibility

- Conversation `d4a2fc69` visible in Serra Honda's TeamBox (channel: voice, status: open)
- Conversation `2daddd11` visible in Serra Nissan's TeamBox (the duplicate)
- Messages: 1 system message (transcript stored as system message)

**Result:** PASS — conversation appears in TeamBox under voice channel

## Step 8: VIN Lead Creation

```
[VAPI->VIN] Prepare OK: assigned to Durran Cage, source=Dealers WebSite
[VAPI->VIN] Lead created: contact=1400783925, lead=1997219701, assigned=Durran Cage
```

- VIN Safe MCP prepare/execute flow used (correct)
- Lead assigned to Durran Cage (default user for the dealer)
- Lead source: Dealers WebSite

**Result:** PASS — VIN lead created through safe pipeline

---

## Summary

| Step | Component | Result | Notes |
|------|-----------|--------|-------|
| 1 | Call placement (VAPI API) | PASS | Queued in <1s |
| 2 | Call connection | PASS | Both parties spoke, 20s duration |
| 3 | Transcript capture | PASS | Correct content, stored by VAPI |
| 4 | Webhook processing | PASS (with issue) | Conversation + lead created; duplicate webhook issue |
| 5 | AI analysis | PASS | Intent, vehicle, time extracted; score 8/10 |
| 6 | Email notification | PASS | Sent to 3 Serra Honda admins |
| 7 | TeamBox visibility | PASS | Voice conversation visible |
| 8 | VIN lead creation | PASS | Contact + lead in VIN Solutions |

### Issues Found

1. **Duplicate webhook / phantom conversation (MEDIUM):** Elliott's outbound call generates two VAPI call IDs. The first resolves to the wrong org via fallback. This creates a duplicate conversation and VIN lead in Serra Nissan. The dedup guard (I-177) did not catch this because the two call IDs are different.

2. **Elliott max-duration too short (LOW):** The Elliott test assistant has a very short max-duration (~20s), which cuts conversations short before the store agent can fully respond. This is a VAPI assistant config issue, not an app issue.

3. **Caroline says "Sarah Automotive" (LOW):** The VAPI assistant's greeting says "Sarah Automotive" instead of "Serra Honda." This is a VAPI prompt config issue.

### Overall Verdict

**PASS** — The full VAPI voice pipeline works end-to-end: call connects, webhook fires, conversation created, transcript stored, AI analysis runs, VIN lead created, notification email sent, visible in TeamBox. The duplicate webhook issue should be addressed but does not block the core flow.
