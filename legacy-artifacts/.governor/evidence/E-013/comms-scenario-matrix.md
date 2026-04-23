# Communication Scenario Matrix
**Date:** 2026-03-27
**Source:** T-016, T-017a, T-017b test results + code review

---

## Legend
- **WORKING** — tested and confirmed functional
- **PARTIAL** — code path exists but has a known defect
- **NOT BUILT** — no implementation exists
- **NOT TESTED** — code may exist but wasn't verified

---

## SMS (TextMagic via central-mcp)

| Scenario | Direction | Flow | Status | Evidence |
|---|---|---|---|---|
| Unsolicited customer text | INBOUND | Customer texts dealership number → TextMagic webhook → server routes to comms agent (Caroline/Nancy by department) → agent responds → conversation in TeamBox | **PARTIAL** — routing works but agent assignment depends on which TextMagic number receives. Currently 1 number shared, can't distinguish sales vs service. | I-133: needs dedicated numbers per agent |
| Campaign reply | INBOUND | Customer replies to campaign SMS → TextMagic webhook → matched to campaign conversation → service agent (Nancy) responds | **PARTIAL** — T-017b confirmed campaign creates conversation. Reply routing exists but couldn't E2E test (test numbers are receive-only, can't send replies). | T-017b AC2 |
| Campaign outbound | OUTBOUND | Create campaign → upload CSV → execute → SMS sent per recipient via callMCP("tm_send_message") | **WORKING** — T-017b confirmed 2/2 sent successfully | T-017b AC1 |
| Trigger outbound | OUTBOUND | Scheduled trigger fires → SMS sent to customer | **NOT BUILT** — no trigger→SMS pipeline exists. Walk-in followup (US-005) not implemented. | I-145 |
| Manual send from TeamBox | OUTBOUND | Staff clicks conversation → types reply → sends via TeamBox | **WORKING** — T-017a AC6 confirmed, outbound_log records delivery | T-017a AC6 |
| STOP / opt-out | INBOUND | Customer sends "STOP" → phone added to blacklist → no future messages | **WORKING** — blacklist mechanism confirmed. But not in CommGate check (I-144) — dry runs don't catch it. | T-017b AC7/AC8 |
| After-hours queue | INBOUND | SMS arrives outside business hours → queued, not processed | **WORKING** — inbound handler checks business hours | T-017b AC4 |
| After-hours queue | OUTBOUND | Campaign executes outside business hours | **NOT BUILT** — no business-hours gate on outbound campaigns. TCPA risk. | I-143 |

---

## Phone / Voice (VAPI)

| Scenario | Direction | Flow | Status | Evidence |
|---|---|---|---|---|
| Customer calls dealership | INBOUND | Customer dials VAPI number → AI agent answers → conversation → end-of-call webhook → email notification + VIN lead attempt | **PARTIAL** — call connects, agent answers, email sends. But webhook returns 422 on transcript payload (I-141), and VIN lead source mapping fails (I-142). Transcript never stored. | T-017a AC2-AC5 |
| Elliott test call | INBOUND (simulated) | Elliott calls store agent → tests the inbound flow without a real customer | **WORKING** — Elliott→Caroline ($0.035) and Elliott→Nancy ($0.03) both completed | T-017a AC2, T-017b AC6 |
| Instant Call Back | OUTBOUND | Visitor enters phone on widget → system triggers VAPI outbound call to visitor | **NOT BUILT** — frontend form done (SEC-08), but /api/widget/voice-callback backend route doesn't exist | I-119, SEC-08 |
| Trigger outbound call | OUTBOUND | Scheduled trigger fires → VAPI outbound call to customer for follow-up | **NOT BUILT** — no trigger→voice pipeline. Outbound calling requires the Instant Call Back route or a separate trigger system. | — |
| Campaign phone | OUTBOUND | Campaign with phone channel → outbound calls to recipients | **NOT BUILT** — campaigns currently SMS-only. Multi-channel (I-132) not implemented. | I-132 |

---

## Video (Tavus)

| Scenario | Direction | Flow | Status | Evidence |
|---|---|---|---|---|
| Customer clicks video on landing page | INBOUND | Widget → POST /api/widget/video-session → Tavus creates session → opens in new window → conversation in TeamBox | **PARTIAL** — session creation works (T-016 AC2), but popup may be blocked by browser (I-121 fix deployed but needs re-verify). Transcript arrival untested. | T-016 AC2, T-022f |
| ?mode=video auto-launch | INBOUND | Landing page with ?mode=video → fullscreen video UI → Tavus session | **WORKING** — renders connecting state, opens session | T-022f AC7 |
| Video for service | — | Not planned | **NOT IN SCOPE** — operator confirmed video is not used for service. If added later, inbound-only with new URL. | Operator directive |

---

## Email (Resend)

| Scenario | Direction | Flow | Status | Evidence |
|---|---|---|---|---|
| Webhook notification | OUTBOUND | VAPI call ends → email notification to store admins | **WORKING** — T-017a confirmed email to 2 admins after Elliott call | T-017a AC3 |
| Password reset | OUTBOUND | User requests reset → Resend sends email with reset link | **PARTIAL** — email sends (T-015 AC11), but reset fails on submission (I-140) | I-140 |
| Campaign email | OUTBOUND | Campaign with email channel → emails to recipients | **NOT TESTED** — campaigns support channel="email" in schema but E2E email campaign not tested. Multi-channel (I-132) not implemented. | — |
| Inbound email | INBOUND | Customer replies to email | **NOT BUILT** — operator confirmed: outbound only, no inbound email processing. Future feature, design TBD. | Operator directive |

---

## Web Chat (Claude AI)

| Scenario | Direction | Flow | Status | Evidence |
|---|---|---|---|---|
| Customer chats on landing widget | INBOUND | Widget → POST /api/widget/chat → AI responds scoped to org → conversation visible (but not in TeamBox — widget chats are separate) | **WORKING** — T-022f AC3 confirmed AI responds with dealer context | T-022f AC3 |
| Staff uses AI Chat (home page) | INTERNAL | Staff → POST /api/chat/{conversationId}/stream → Claude with org context, tools, KB | **WORKING** — streaming < 8s, multi-turn, VIN queries, web search all work | T-022a |
| Agent chat (department pages) | INTERNAL | Staff chats with Data Guru, Nancy, Caroline, marketing agents → domain responses | **WORKING** (mostly) — all tested agents respond on-topic. Nancy/Data Guru can't persist actions (appointments, tasks). | T-022a-d, T-019 |

---

## Web Form

| Scenario | Direction | Flow | Status | Evidence |
|---|---|---|---|---|
| Widget contact form | INBOUND | Visitor fills form → POST /api/widget/contact → conversation created in TeamBox | **WORKING** — T-014 confirmed form→TeamBox within 30s | T-014 AC1/AC2 |
| Landing page contact form | INBOUND | Same as widget — same endpoint | **WORKING** | T-014 AC2 |

---

## Summary: What's Working vs What's Not

### Fully Working (8)
1. Campaign SMS outbound
2. Manual SMS from TeamBox
3. STOP/opt-out blacklisting
4. Inbound SMS after-hours queue
5. Email notifications (webhook-triggered)
6. Widget web chat (AI responses)
7. Widget/landing contact form → TeamBox
8. Staff AI chat (home page)

### Partial / Has Defects (5)
1. Unsolicited inbound SMS (works but can't route sales vs service — 1 number)
2. VAPI inbound calls (connects, but webhook 422 loses transcripts, VIN lead source mismatch)
3. Video widget (session creates, but popup blocker issue)
4. Password reset email (sends, but reset submission fails)
5. Campaign reply → agent (code path exists, not E2E tested)

### Not Built (6)
1. Instant Call Back backend (/api/widget/voice-callback)
2. Outbound business-hours gate on campaigns (TCPA)
3. Trigger→SMS follow-up (walk-in, after-hours outbound)
4. Trigger→Voice follow-up (scheduled outbound calls)
5. Multi-channel campaigns (email + SMS + phone per campaign)
6. Inbound email processing

### Not Tested (2)
1. Email campaign outbound (channel="email" in schema, never executed)
2. Tavus transcript arrival → TeamBox
