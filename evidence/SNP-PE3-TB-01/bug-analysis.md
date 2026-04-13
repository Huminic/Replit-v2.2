# SNP-PE3-TB-01 Bug Analysis

## BUG-TB03-03 (MEDIUM): Wrong message role styling -- FIXED
**Root cause:** Webchat visitor and SMS inbound messages are stored with `role: "user"` (see server/routes/public.ts:308 and server/routes/sms.ts:417), but the message styling logic in teambox.tsx only treated `role === 'customer'` as customer messages. Messages with `role: "user"` fell through to the default agent styling (right-aligned, blue).

**Fix:** Added `msg.role === 'user'` alongside `msg.role === 'customer'` in both the alignment check (justify-start) and the bubble styling check (bg-muted).

**File:** client/src/pages/teambox.tsx, lines 772 and 781

## BUG-TB03-04 (LOW): Auto-select from wrong array -- FIXED
**Root cause:** The auto-select useEffect at line 173 selected from `conversations[0]` (unfiltered), which could be an `ai-chat` conversation hidden by the filter. The user would see nothing selected despite conversations being visible in the list.

**Fix:** Changed to select from `filteredConversations[0]` instead. Also moved the `filteredConversations` computation above the useEffect to ensure proper variable ordering.

**File:** client/src/pages/teambox.tsx, lines 173-186

## BUG-TB03-01 (MEDIUM): VAPI calls not linked to conversation threads -- DOCUMENTED (not fixed)
**Root cause analysis:** The VAPI webhook (server/routes/webhooks.ts:719) creates voice conversations with `channel: "voice"` and stores transcripts as `role: "system"` messages. However, transcripts are only stored if available at webhook time. If the VAPI `end-of-call-report` fires before the transcript is ready (or if the call status doesn't include a transcript), the conversation is created but no messages are added.

The Phone tab shows VAPI call logs from `GET /api/vapi/calls` (direct VAPI API), which are separate from conversation messages. There is no retroactive linking mechanism.

**What would fix it:**
1. Add a polling/retry mechanism to fetch transcripts from VAPI after conversation creation
2. Or add a "link call" action that matches VAPI call logs to voice conversations by phone number + timestamp
3. Or ensure the VAPI webhook configuration always includes transcripts

This requires backend work beyond teambox.tsx scope.

## BUG-TB03-02 (LOW): Missing campaignId on marketing email -- DOCUMENTED (not fixed)
**Root cause:** Data issue -- the email was ingested without campaign metadata. Would require re-ingestion or manual data patch. Not a code bug.

## Build Status
Build passes with all fixes applied.
