# VAPI Cross-Org Eval: Elliott Calls Elizabeth (Hyundai of Columbia)

**Date:** 2026-04-07T22:04:49Z
**Test type:** Cross-org voice call routing
**Call placed by:** Elliott (assistant c303d993, phone a85a9397)
**Target store:** Hyundai of Columbia (Elizabeth) at +19012039398
**VAPI Call ID:** 019d69fa-1127-7226-ac8e-315ffccefda6

---

## Call Result

| Field | Value |
|-------|-------|
| Status | ended |
| Ended reason | exceeded-max-duration |
| Started | 2026-04-07T22:04:51.877Z |
| Ended | 2026-04-07T22:05:11.947Z |
| Duration | ~20 seconds |
| Cost | $0.0463 |

**Transcript:**
> User: Hi. For calling Hyundai of Columbia. My name is Elizabeth, your personal car buying assistant. Can you tell me a little about what you are looking for so I can get you scheduled for a test drive?
> AI: Hello, Elizabeth. I think there's been a mix up. I'm actually calling Sarah Honda. I'm interested in scheduling a test drive for a 20 24

**Summary:** Elizabeth (Hyundai of Columbia) answered correctly. Elliott's script is hardcoded to mention "Sarah Honda" regardless of target, causing a name mismatch. Call ended due to max-duration.

---

## Conversations Created

| Conv ID | Org | Customer Phone | Call ID (from log) | VIN Lead? |
|---------|-----|----------------|---------------------|-----------|
| 1498e4ea-5310-41a5-bc15-e76a14916866 | Hyundai of Columbia | +18392729080 | 019d69fa-196e-7000-9396-8096959af752 | false |
| ab4b9ebd-cc06-4296-a52f-65746e5e5f70 | **Serra Nissan** | +19012039398 | 019d69fa-1127-7226-ac8e-315ffccefda6 | true |

### FINDING: Cross-org routing defect (CRITICAL)

Our call (019d69fa-1127-7226-ac8e-315ffccefda6) to Hyundai of Columbia was routed to **Serra Nissan** in the database. The phone number +19012039398 is Elizabeth's (Hyundai of Columbia) number, but the conversation was created under org Serra Nissan.

A second call ID (019d69fa-196e-7000-9396-8096959af752) appeared that we did NOT initiate, and it created a conversation under the correct org (Hyundai of Columbia) with phone +18392729080. This may be a callback or VAPI internal routing artifact.

### FINDING: Dedup did NOT work

Two distinct conversations were created from what is functionally a single test interaction. The dedup fix was supposed to prevent phantom/duplicate conversations. Instead:
- Conv 1 landed in the correct org (Hyundai of Columbia) but from an unknown call ID
- Conv 2 (our actual call) landed in the WRONG org (Serra Nissan)

---

## VIN Lead Creation

From PM2 logs:
```
[VAPI->VIN] Prepare OK: assigned to Durran Cage, source=Dealers WebSite
[VAPI->VIN] Lead created: contact=1400819739, lead=1997271357, assigned=Durran Cage
```

A VIN lead was created for the conversation that landed in Serra Nissan (conv ab4b9ebd). This means the VIN lead was created against the **wrong dealership** in VIN Solutions.

No warehouse_leads records appeared in the last 10 minutes (warehouse sync may be delayed).

---

## Appointments Created

| Appointment ID | Org | Phone | Source |
|---------------|-----|-------|--------|
| 3b741f31-04bd-4473-af5a-6f86664aee8d | Hyundai of Columbia | +18392729080 | vapi |
| 3f2ac167-06ad-4d31-8a92-460f44436877 | Serra Nissan | +19012039398 | vapi |

Two appointments created -- one per conversation. Both are for "Unknown Caller" with appointment_type=sales, next day at 10:00 AM.

---

## Email Notifications

```
[LeadNotify] Resolved 3 recipient(s) for org "Hyundai of Columbia": columbia_hyundai@huminic.ai, durran.cage@cageautomotive.com, duane.wells@huminic.ai
[LeadNotify] Sent "Hyundai of Columbia Has a New AI Voice Lead!" to 3 admin(s)

[LeadNotify] Resolved 3 recipient(s) for org "Serra Nissan": serra_nissan@huminic.ai, durran.cage@cageautomotive.com, duane.wells@huminic.ai
[LeadNotify] Sent "Serra Nissan Has a New AI Voice Lead!" to 3 admin(s)
```

Both orgs received email notifications. Serra Nissan received a notification for a lead that should not have been routed to them.

---

## In-App Notifications

| Org | Type | Title |
|-----|------|-------|
| Hyundai of Columbia | voice | New Inbound Call Completed |
| Serra Nissan | voice | New Inbound Call Completed |

---

## Verdict

| Check | Result | Notes |
|-------|--------|-------|
| Call placed successfully | PASS | Call ID 019d69fa... queued and completed |
| Elizabeth answered | PASS | Hyundai of Columbia AI greeted caller |
| Conversation created | PASS | Two conversations created |
| Correct org routing | **FAIL** | Our call routed to Serra Nissan instead of Hyundai of Columbia |
| Dedup prevented duplicates | **FAIL** | Two conversations from one interaction |
| VIN lead created | PASS | contact=1400819739, lead=1997271357 |
| VIN lead correct org | **FAIL** | Lead created under Serra Nissan, not Hyundai of Columbia |
| Email notification sent | PASS | 3 recipients notified per org |
| Email correct org | **FAIL** | Serra Nissan notified for a Hyundai of Columbia call |
| Appointment created | PASS | Two appointments created |

### Overall: FAIL -- Cross-org routing defect

The VAPI webhook is misrouting calls. When Elliott calls Hyundai of Columbia's number (+19012039398), the end-of-call webhook creates the conversation under Serra Nissan. This is a critical routing bug that causes:
1. Wrong org owns the conversation
2. VIN lead created in wrong dealer
3. Wrong dealership staff notified
4. Dedup does not catch it because the two webhook fires have different call IDs

### Root cause hypothesis

The webhook phone number lookup maps +19012039398 to Serra Nissan instead of Hyundai of Columbia, OR VAPI is sending the wrong assistant/phone metadata in the end-of-call payload, causing the server to resolve the wrong org.
