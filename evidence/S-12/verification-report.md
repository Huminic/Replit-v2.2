# S-12 Verification Report — Voice/Comms Pipeline

**Date:** 2026-03-30
**Sprint:** S-12 — Voice/Comms Pipeline — Race Conditions + Transcript Storage

## Changes Made

### I-175: SMS Race Condition (server/routes/sms.ts)
- Added `withConversationLock()` mutex per phone+org key
- Wrapped conversation lookup + create in lock so concurrent webhooks serialize
- Refactored to return `{ conversation, isNew }` so auto-greeting only fires for new conversations
- Campaign label logging moved inside lock (references closure variables)

### I-176: VAPI Transcripts Not Stored (server/routes/webhooks.ts)
- When a duplicate VAPI event arrives with transcript data, checks if existing conversation has a VAPI message
- If no transcript message exists, creates one — ensures transcript is captured even if first event lacked it

### I-177: Duplicate Voice Conversations (server/routes/webhooks.ts)
- Added `processedVapiCalls` Map tracking call ID → conversation ID
- Before creating conversation, checks if call ID was already processed
- If duplicate: skips conversation creation, optionally adds transcript if missing
- Map entries auto-cleaned after 30 minutes

## Verification
- TypeScript compilation: PASS (no errors)
- Files touched: 2 (server/routes/sms.ts, server/routes/webhooks.ts)
- No frontend files modified
- No governance files altered
- No unrelated changes
