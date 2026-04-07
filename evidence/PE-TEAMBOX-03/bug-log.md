# Bug Log — PE-TEAMBOX-03

**Date:** 2026-04-07
**Evaluator:** Production Eval Agent

---

## BUG-01: Voice conversations show "No messages yet" despite VAPI call data existing

**Severity:** Medium
**Flow:** F5 (Service Campaign Threads)
**Evidence:** F5-voice-no-messages.png, F5-phone-tab-vapi-calls.png

**Description:**
Voice conversations in the conversation list (e.g., "Unknown Caller" with phone +18392729080, handled by Caroline) show "No messages yet" in the message thread. However, the Phone tab shows 6 VAPI call logs for the same phone number with full transcripts, summaries, and durations (20-62s).

**Expected:** Voice conversation threads should either display call transcripts as messages (system-type messages) or provide a link/button to view the associated call log.

**Actual:** The conversation thread is empty. The call data exists in a completely separate tab with no cross-linking.

**Impact:** Operators viewing a voice conversation thread see no context. They must separately navigate to the Phone tab and manually match by phone number to find the call data.

---

## BUG-02: Marketing Agent email lacks campaignId metadata

**Severity:** Low
**Flow:** F5 (Service Campaign Threads)
**Evidence:** F7-email-thread.png

**Description:**
The Stephanie Thompson email conversation has a message from "Marketing Agent" with promotional content ("Check out our exclusive February specials - up to $5,000 off select models!"). This appears to be campaign-originated. However, the conversation does not have `campaignId` set, so the "Disconnect Campaign" button does not appear.

**Expected:** Campaign-originated conversations should have campaignId set so operators can disconnect the campaign from that customer.

**Actual:** No campaignId, no disconnect button, conversation appears as a regular email.

**Impact:** If this is a campaign message, the operator cannot use the campaign disconnect feature to stop future sends for this customer.

---

## BUG-03: Web Chat visitor messages displayed with wrong visual role

**Severity:** Medium
**Flow:** F7 (Thread Continuity)
**Evidence:** F2-conversation-selected.png

**Description:**
In the Website Visitor chat conversation, the visitor's message ("What SUVs do you have?") is displayed on the right side with blue/primary background — the same styling as agent/bot messages. Customer messages should appear on the left with muted background.

Per the code logic:
- role === 'customer' -> left side, bg-muted
- role === 'bot' -> left side, bg-primary/10
- role === 'agent' -> right side, bg-primary

The visitor message appears styled as agent/bot, suggesting the message has an incorrect role value in the database (likely stored as 'bot' or 'agent' instead of 'customer').

**Expected:** Visitor messages should appear left-aligned with muted background to visually distinguish inbound from outbound.

**Actual:** Visitor message appears right-aligned with blue background, identical to Caroline's messages.

**Impact:** Operators cannot visually distinguish who sent which message at a glance, undermining the core value of a conversation thread.

---

## BUG-04: Auto-selected conversation is invisible ai-chat thread

**Severity:** Low
**Flow:** F1 (TeamBox Layout Load)
**Evidence:** F1-teambox-full-layout.png

**Description:**
On initial TeamBox load, the code auto-selects `conversations[0]` from the unfiltered array. However, the conversation list filters out `ai-chat` channel conversations. The first conversation in the raw array was "Duane Wells" (ai-chat), so the detail pane showed that conversation while the list had no corresponding selected item.

**Expected:** Auto-selection should pick the first conversation from the filtered list, not the raw array.

**Actual:** Detail pane shows an ai-chat conversation that is invisible in the conversation list.

**Impact:** Minor UX confusion on initial load. Clicking any visible conversation resolves it.

**Code location:** teambox.tsx lines 173-177 — the useEffect selects from `conversations` array but should select from `filteredConversations`.
