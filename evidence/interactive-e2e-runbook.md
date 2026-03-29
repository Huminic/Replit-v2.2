# Interactive E2E Test Runbook

**Date:** 2026-03-28
**Operator phone:** 412.654.6500
**Operator email:** duanekwells@gmail.com
**App:** https://dev.huminicdev.com
**TextMagic inbound numbers:** +18339785374 (Serra Honda), +18338935694, +18338096836
**VAPI (Elliott/Caroline):** Call the VAPI phone number assigned to Serra Honda

---

## How This Works

Each test has three parts:
1. **SETUP** — I run automated setup (create campaign, check DB state, etc.)
2. **YOU DO** — You perform the real-world action (send text, make call, etc.)
3. **VERIFY** — I check the system to confirm it processed correctly

I'll tell you when it's your turn and exactly what to do. After each action, tell me "done" and I'll verify.

---

## TEST 1: Inbound SMS → AI Auto-Response → TeamBox

**What this tests:** A customer texts the dealership. The AI agent (Caroline) should auto-respond. The conversation should appear in TeamBox.

**SETUP:** I verify CommGate is ON and SMS is enabled for Serra Honda.

**YOU DO:**
- From your phone (412.654.6500), send a text message to **+18339785374** (Serra Honda's TextMagic number)
- Message: `Hi, I'm interested in a 2025 Honda Civic. Do you have any in stock?`
- Tell me "sent" when done

**VERIFY:** I check:
- Conversation created in TeamBox with your phone number
- AI auto-response generated (Caroline should reply)
- Message appears in the correct org (Serra Honda)

---

## TEST 2: Inbound SMS → Human Takeover → AI Stops

**What this tests:** After the AI responds, a human takes over the conversation. The AI should stop responding.

**SETUP:** I find the conversation from Test 1 and assign it to the org admin (human takeover).

**YOU DO:**
- From your phone, reply to the same thread: `Can I schedule a test drive for Saturday?`
- Tell me "sent" when done

**VERIFY:** I check:
- Your message is received
- AI does NOT auto-respond (aiPaused should be true)
- Conversation shows as human-assigned in TeamBox

---

## TEST 3: Outbound Campaign → You Receive → You Reply

**What this tests:** The system sends an outbound SMS campaign. You receive it. You reply. The system creates a linked conversation and AI responds.

**SETUP:** I create a campaign targeting your phone number, then execute it.

**YOU DO:**
- Wait for the SMS from the system (should arrive within 30 seconds)
- When you receive it, reply: `Yes, I'd like to learn more about this`
- Tell me "received and replied" when done

**VERIFY:** I check:
- Campaign shows sent count = 1
- Your reply created a linked conversation
- AI auto-responded to your reply
- Conversation appears in TeamBox linked to the campaign

---

## TEST 4: Kill Switch ON → Outbound Blocked

**What this tests:** When CommGate is OFF (kill switch), outbound messages should NOT send.

**SETUP:** I toggle CommGate OFF for Serra Honda, then attempt to execute a campaign.

**YOU DO:**
- Wait 30 seconds
- Confirm: did you receive any text? Tell me "no text received" or "received text"

**VERIFY:** I check:
- Campaign execution was blocked by CommGate
- No outbound SMS sent
- I restore CommGate to ON after verification

---

## TEST 5: Inbound Voice Call → VAPI → Conversation

**What this tests:** You call the dealership's VAPI number. The AI agent (Elliott) answers. The call creates a conversation in TeamBox.

**SETUP:** I look up Serra Honda's VAPI phone number for you.

**YOU DO:**
- Call the VAPI number I give you from your phone (412.654.6500)
- Talk to the AI for 15-30 seconds (ask about a vehicle, service appointment, etc.)
- Hang up
- Tell me "call done" when finished

**VERIFY:** I check:
- VAPI call log exists
- Webhook fired and created a conversation in TeamBox
- Transcript is captured (may take 30-60 seconds after call ends)
- Email notification sent to org admin

---

## TEST 6: Password Reset Flow

**What this tests:** Full password reset lifecycle — request, email delivery, reset, login with new password.

**SETUP:** None needed.

**YOU DO:**
1. Go to https://dev.huminicdev.com/forgot-password
2. Enter: duanekwells@gmail.com
3. Click "Send reset instructions"
4. Check your email for the reset link
5. Click the link
6. Set a new password (remember it)
7. Log in with the new password
8. Tell me the result: "reset worked" or "failed at step N"

**VERIFY:** I check:
- Reset token was generated in DB
- Email was sent via Resend
- New password works for login

---

## TEST 7: AI Chat — Full Conversation Lifecycle

**What this tests:** Multi-turn conversation with the AI on the dashboard, including tool use (VIN lookup, pipeline query).

**SETUP:** I verify the chat endpoint is working.

**YOU DO:**
1. Log in at https://dev.huminicdev.com as serra_honda@huminic.ai / NexxusTest2026
2. On the AI Chat dashboard, type: `How many active leads do I have in my pipeline?`
3. Wait for the AI response
4. Follow up: `Show me the ones that haven't been contacted in the last 7 days`
5. Follow up: `Can you look up the contact details for the first one?`
6. Tell me what happened at each step — did it respond? Did it use tools? Did it show real data?

**VERIFY:** I check:
- Chat streaming worked
- AI used VIN/warehouse tools
- Data returned matches pipeline metrics
- Multi-turn context maintained

---

## TEST 8: Widget Chat — Public Customer Experience

**What this tests:** A public visitor uses the chat widget on a landing page.

**SETUP:** I find Serra Honda's landing page URL.

**YOU DO:**
1. Open the landing page URL I give you (in an incognito/private window)
2. Click the chat widget
3. Type: `I'm looking for a used Honda CR-V under $25,000`
4. Wait for response
5. Tell me what happened

**VERIFY:** I check:
- Widget loaded correctly
- AI persona responded
- Conversation created in backend
- No auth required (public page)

---

## TEST 9: Multi-Channel Sequence (Edge Case)

**What this tests:** Same customer contacts via SMS, then calls, then uses widget. All should link to the same customer record.

**SETUP:** I check existing conversations for your phone number from earlier tests.

**YOU DO:**
- This uses your existing conversations from Tests 1-5
- No new action needed — tell me "ready to verify"

**VERIFY:** I check:
- Multiple conversations exist for 412.654.6500
- They're in the same org (Serra Honda)
- TeamBox shows them all
- Customer record links across channels

---

## TEST 10: Rate Limit Edge Case

**What this tests:** Sending multiple campaign messages to the same phone number within 24h. The rate limiter (3 per 24h per number) should block excess messages.

**SETUP:** I create and execute 3 separate campaigns targeting your number in quick succession.

**YOU DO:**
- Count how many texts you receive
- Tell me the count: "received N texts"

**VERIFY:** I check:
- First 3 campaigns sent (or as many as rate limit allows)
- Additional campaigns blocked with "Rate limit exceeded"
- No more than 3 messages received within 24h window

---

## Execution Order

Run tests in this order:
1. Test 1 (Inbound SMS) — establishes baseline conversation
2. Test 2 (Human Takeover) — uses Test 1 conversation
3. Test 3 (Outbound Campaign) — new campaign flow
4. Test 4 (Kill Switch) — CommGate toggle
5. Test 5 (Voice Call) — VAPI flow
6. Test 6 (Password Reset) — auth flow
7. Test 7 (AI Chat) — dashboard chat
8. Test 8 (Widget Chat) — public widget
9. Test 9 (Multi-Channel) — cross-channel verification
10. Test 10 (Rate Limit) — edge case

Tests 1-5 are the critical communication flows.
Test 6 is auth.
Tests 7-8 are chat.
Tests 9-10 are edge cases.

---

## Notes

- If any test fails, we document it and continue — don't stop the whole run
- I'll restore any state changes (kill switch, campaign cleanup) after each test
- Your phone number (412.654.6500) will receive real texts during this test
- The VAPI call (Test 5) is a real phone call with an AI agent
