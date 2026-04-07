# PE-INTEGRATIONS-03 — Use Case Inventory

## UC-1: Inbound SMS (TextMagic -> Nexxus)

**Flow:** Customer sends SMS -> TextMagic webhook -> org resolution -> conversation creation -> message stored
**Status:** FUNCTIONAL (3 SMS conversations in DB, 87 inbound SMS activity logs)
**Key behaviors:**
- Org resolution: receiver phone -> outbound history -> contact phone -> single-org fallback
- STOP keyword handling with blacklist creation and opt-out confirmation
- After-hours auto-response with queued follow-up
- Conversation dedup via mutex lock (I-175 fix)
- Campaign context injection for SMS replies to campaigns (I-192)

## UC-2: Outbound SMS (Nexxus -> TextMagic)

**Flow:** processOutboundSend() -> CommGate check -> sendSms() -> callMCP("tm_send_message")
**Status:** FUNCTIONAL (21 sent, 14 failed, 13 blocked in outbound_log)
**CommGate blocks observed:** Business hours enforcement working (5 blocked for "Outside business hours")
**IRREVERSIBLE:** Cannot test sends without real SMS delivery

## UC-3: Inbound VAPI Call (VAPI -> Nexxus)

**Flow:** Call ends -> VAPI webhook -> org resolution via assistantId -> conversation + transcript -> VIN lead creation -> email notification -> AI analysis
**Status:** FUNCTIONAL (6 voice conversations, 158 vapi_call_received activity logs, 147 VAPI appointments)
**Key behaviors:**
- Dual payload format support (old wrapped + new flat)
- Transcript extraction from 5+ locations in payload
- Dedup via processedVapiCalls map (I-177 fix)
- Test phone (555-prefix) rejection for VIN leads
- Ringing-only call filtering (no transcript = no notification/VIN lead)

## UC-4: Outbound VAPI Call (Nexxus -> VAPI)

**Flow:** sendPhone() -> agent lookup -> callMCP("vapi_create_call") with assistant overrides
**Status:** CODE EXISTS (1 dry_run in outbound_log for phone channel)
**IRREVERSIBLE:** Cannot test without initiating real phone calls

## UC-5: VAPI -> VIN Solutions Lead Creation

**Flow:** Webhook receives call -> vin-safe-mcp prepare -> auto-execute -> verify
**Status:** PARTIALLY FUNCTIONAL
- VIN_SAFE_MCP_TOKEN and VIN_SAFE_MCP_URL not set in .env (uses hardcoded defaults)
- 5 "VIN Lead Prepare Failed" tasks archived in DB (most recent: 2026-04-05)
- Uses auto-approval (user_confirmed: true) in webhook — bypasses human review
**Bug potential:** VIN lead auto-approval in webhook violates CLAUDE.md VIN Safe MCP rules (Step 2: "Do NOT proceed without explicit approval")
**Note:** This is an automated webhook flow, not a user-initiated action, so auto-approval may be intentional for the voice-to-CRM pipeline

## UC-6: Tavus Video Session (Tavus -> Nexxus)

**Flow:** Video ends -> Tavus webhook -> fetch transcript via MCP -> conversation + transcript -> VIN lead -> email notification -> AI analysis
**Status:** FUNCTIONAL (180 tavus_video_completed activity logs, 64 Tavus appointments, 0 video conversations in conversations table currently — likely pruned or expired)
**Key behaviors:**
- Persona-based org resolution
- Same VIN lead creation flow as VAPI
- Callback URL hardcoded to live.huminic.app (not dev)

## UC-7: Tavus Video Session Creation

**Flow:** POST /api/tavus/conversations -> callMCP("tavus_create_conversation")
**Status:** CODE EXISTS
**IRREVERSIBLE:** Cannot test without creating real Tavus sessions
**Note:** callback_url hardcoded to "https://live.huminic.app/api/webhooks/tavus" — dev environment would not receive callbacks

## UC-8: Resend Email Sends

**Flow:** Multiple paths: lead notifications, conversation replies, welcome emails, invites, password resets
**Status:** FUNCTIONAL (331 email "sent" entries in outbound_log)
**Key behaviors:**
- Lead notification emails have idempotency check (prevents duplicate sends)
- Recipient hierarchy: org admins -> partner admins -> super admins -> additional_org_ids users
- CommGate respected for notification emails (org.outboundEnabled + org.emailEnabled)
- Welcome/invite emails use direct Resend SDK (not MCP)
- No inbound Resend webhook (delivery status not tracked)

## UC-9: AI Transcript Analysis

**Flow:** analyzeTranscriptWithClaude() called after VAPI/Tavus webhook -> extract appointment intent -> create appointment -> suppress lead follow-ups -> update lead score
**Status:** FUNCTIONAL (147 VAPI + 64 Tavus appointments created from AI analysis)
**Key behaviors:**
- Only triggers for calls/sessions > 15 seconds
- Uses Claude claude-sonnet-4-6 via separate AI_INTEGRATIONS_ANTHROPIC_API_KEY
- Creates appointments and updates warehouse_lead scores

## UC-10: Cross-Org Data Isolation

**Flow:** All VAPI/Tavus API routes filter by org's agent assistant/persona IDs
**Status:** IMPLEMENTED (SNP-001 fixes for assistants, calls, conversations)
**Key behaviors:**
- Assistants filtered by orgAssistantIds set
- Calls filtered by orgAssistantIds (BUG-INT-02 fix)
- Tavus conversations filtered by orgPersonaIds

## UC-11: Billing Usage Events

**Flow:** After VAPI call or Tavus session with transcript -> billingService.emitUsageEvent()
**Status:** CODE EXISTS (usage events emitted for voice_minute and video_minute)
