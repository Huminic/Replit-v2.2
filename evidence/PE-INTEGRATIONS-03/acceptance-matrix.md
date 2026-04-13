# PE-INTEGRATIONS-03 — Acceptance Matrix

## Investigation Area Results

### I1: TextMagic Integration

| # | Question | Finding | Verdict |
|---|----------|---------|---------|
| 1 | Is the TextMagic webhook handler registered? | POST /api/webhooks/textmagic in sms.ts:46, registered via registerSmsRoutes() | PASS |
| 2 | Does it validate webhook secrets? | Checks x-textmagic-secret header, but TEXTMAGIC_WEBHOOK_SECRET not set in .env | WARN |
| 3 | Does it resolve org from inbound SMS? | 4-tier resolution: receiver phone -> outbound history -> contact phone -> single-org fallback | PASS |
| 4 | Are there existing SMS conversations from prior testing? | 3 SMS conversations in DB (most recent: 2026-04-07) | PASS |
| 5 | Does STOP keyword handling work? | Code handles STOP/UNSUBSCRIBE/QUIT/CANCEL/END/OPTOUT -> blacklist + confirmation | PASS |
| 6 | Does after-hours auto-response work? | Code checks org timezone + business hours, sends auto-response + queues follow-up | PASS |
| 7 | Is outbound SMS properly gated? | checkCommGate() enforces org flags, business hours, blacklist, rate limit | PASS |
| 8 | Are SMS sends IRREVERSIBLE? | Yes — callMCP("tm_send_message") sends real SMS. Cannot test without real delivery. | BLOCKED |

### I2: VAPI Integration

| # | Question | Finding | Verdict |
|---|----------|---------|---------|
| 1 | Is the VAPI webhook handler registered? | POST /api/webhooks/vapi in webhooks.ts:582 | PASS |
| 2 | Does it validate webhook secrets? | Checks x-vapi-secret/authorization header, but VAPI_WEBHOOK_SECRET not set in .env | WARN |
| 3 | Does it create conversations from calls? | Yes, creates voice conversation with transcript. 6 voice conversations in DB. | PASS |
| 4 | Are there VAPI call logs? | 158 vapi_call_received activity logs, 2 VAPI messages with transcripts | PASS |
| 5 | Does VAPI->VIN lead creation work? | Code exists and runs. 5 "VIN Lead Prepare Failed" escalation tasks found (all archived). Auto-approval used. | PARTIAL |
| 6 | Is the health check endpoint live? | GET /api/webhooks/vapi returns {"status":"ok"} | PASS |
| 7 | Are VAPI API reads working? | Routes exist for assistants, calls, phone-numbers, analytics. All use callMCP(). | PASS |
| 8 | Is cross-org filtering applied? | SNP-001 + BUG-INT-02 fixes filter assistants and calls by org agent IDs | PASS |

### I3: Tavus Integration

| # | Question | Finding | Verdict |
|---|----------|---------|---------|
| 1 | Is the Tavus webhook handler registered? | POST /api/webhooks/tavus in webhooks.ts:1026 | PASS |
| 2 | Does it validate webhook secrets? | Checks x-tavus-secret header. TAVUS_WEBHOOK_SECRET is SET in .env. | PASS |
| 3 | Are there prior video sessions? | 180 tavus_video_completed activity logs, 64 Tavus-sourced appointments | PASS |
| 4 | Does Tavus->VIN lead creation work? | Same prepare+execute flow as VAPI. 3 "VIN Lead Prepare Failed - Tavus Video" tasks found. | PARTIAL |
| 5 | Is the callback URL correct for dev? | HARDCODED to "https://live.huminic.app/api/webhooks/tavus" — dev env will NOT receive callbacks | BUG |
| 6 | Are Tavus API reads working? | Routes for personas, replicas, conversations all use callMCP() | PASS |
| 7 | Is cross-org filtering applied? | Conversations filtered by orgPersonaIds from agents table | PASS |
| 8 | Are video conversations created? | 0 rows in conversations table with channel='video' currently (may be from recent DB cleanup) | NOTE |

### I4: Resend Integration

| # | Question | Finding | Verdict |
|---|----------|---------|---------|
| 1 | Is Resend configured? | RESEND_API_KEY is SET. From address: notifications@huminic.ai | PASS |
| 2 | Are there email logs from prior sends? | 331 email "sent" entries in outbound_log | PASS |
| 3 | Does lead notification have idempotency? | Yes — checks outbound_log for [notification:{key}] before sending | PASS |
| 4 | Is CommGate respected for emails? | Yes — checks org.outboundEnabled + org.emailEnabled before sending | PASS |
| 5 | Is there an inbound Resend webhook? | NO — no delivery/bounce status tracking | GAP |
| 6 | Are email sends logged? | Yes — createOutboundLog() called after successful sends | PASS |
| 7 | Does recipient hierarchy work? | Code walks org admins -> partner admins -> super admins -> additional_org_ids | PASS |
| 8 | Are all email sends IRREVERSIBLE? | Yes — all email paths send real emails. Cannot test without delivery. | BLOCKED |

### I5: Downstream Truth Check

| # | Question | Finding | Verdict |
|---|----------|---------|---------|
| 1 | Do VAPI calls materialize in TeamBox? | Voice conversations created in DB with transcripts and VAPI sender messages | PASS |
| 2 | Do SMS messages materialize in TeamBox? | SMS conversations created with messages from webhook data | PASS |
| 3 | Do Tavus sessions create records? | Activity logs and appointments exist (180+64), but 0 current video conversations | PARTIAL |
| 4 | Are outbound logs comprehensive? | email: 331 sent; sms: 21 sent, 14 failed, 13 blocked; phone: 1 dry_run | PASS |
| 5 | Are VIN leads created from webhooks? | VIN lead creation attempts occur but frequently fail (5 archived escalation tasks) | PARTIAL |
| 6 | Are appointments created from AI analysis? | 147 VAPI + 64 Tavus appointments created by analyzeTranscriptWithClaude() | PASS |
| 7 | Are activity logs comprehensive? | vapi_call_received: 158, tavus_video_completed: 180, sms_inbound_received: 87 | PASS |
| 8 | Is billing tracked? | billingService.emitUsageEvent() called for voice_minute and video_minute | PASS |

## Summary

| Area | PASS | WARN | PARTIAL | BUG | GAP | BLOCKED |
|------|------|------|---------|-----|-----|---------|
| I1: TextMagic | 6 | 1 | 0 | 0 | 0 | 1 |
| I2: VAPI | 6 | 1 | 1 | 0 | 0 | 0 |
| I3: Tavus | 4 | 0 | 1 | 1 | 0 | 0 |
| I4: Resend | 6 | 0 | 0 | 0 | 1 | 1 |
| I5: Downstream | 6 | 0 | 2 | 0 | 0 | 0 |
| **Total** | **28** | **2** | **4** | **1** | **1** | **2** |
