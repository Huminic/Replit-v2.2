# PE-INTEGRATIONS-03 — Section/Function Map

## Integration Surface Inventory

### I1: TextMagic (SMS)

| Surface | File | Function/Route | Direction |
|---------|------|----------------|-----------|
| Inbound webhook | server/routes/sms.ts:46 | POST /api/webhooks/textmagic | Inbound |
| Outbound SMS (raw) | server/outbound.ts:83 | sendSmsRaw() | Outbound (IRREVERSIBLE) |
| Outbound SMS (gated) | server/outbound.ts:99 | sendSms() | Outbound (IRREVERSIBLE) |
| STOP keyword handler | server/routes/sms.ts:126–164 | inline in webhook handler | Inbound |
| After-hours auto-response | server/routes/sms.ts:167–232 | inline in webhook handler | Outbound (IRREVERSIBLE) |
| Conversation creation | server/routes/sms.ts:234–299 | withConversationLock() | Internal |
| MCP tool | central-mcp (port 4002) | tm_send_message | External |

### I2: VAPI (Voice)

| Surface | File | Function/Route | Direction |
|---------|------|----------------|-----------|
| Inbound webhook | server/routes/webhooks.ts:582 | POST /api/webhooks/vapi | Inbound |
| Health check | server/routes/webhooks.ts:1022 | GET /api/webhooks/vapi | Read |
| List assistants | server/vendorProxy.ts:205 | GET /api/vapi/assistants | Read |
| List phone numbers | server/vendorProxy.ts:240 | GET /api/vapi/phone-numbers | Read |
| List calls | server/vendorProxy.ts:259 | GET /api/vapi/calls | Read |
| Get call detail | server/vendorProxy.ts:317 | GET /api/vapi/calls/:callId | Read |
| Analytics | server/vendorProxy.ts:344 | GET /api/vapi/analytics | Read |
| Outbound call | server/outbound.ts:144 | sendPhone() | Outbound (IRREVERSIBLE) |
| VIN lead creation | server/routes/webhooks.ts:767–884 | inline in webhook | External (IRREVERSIBLE) |
| Transcript analysis | server/routes/webhooks.ts:33–141 | analyzeTranscriptWithClaude() | Internal |
| Email notification | server/routes/webhooks.ts:154–283 | sendLeadNotificationEmail() | Outbound (IRREVERSIBLE) |
| MCP tools | central-mcp (port 4002) | vapi_list_*, vapi_get_*, vapi_create_call | External |

### I3: Tavus (Video)

| Surface | File | Function/Route | Direction |
|---------|------|----------------|-----------|
| Inbound webhook | server/routes/webhooks.ts:1026 | POST /api/webhooks/tavus | Inbound |
| List personas | server/vendorProxy.ts:366 | GET /api/tavus/personas | Read |
| List replicas | server/vendorProxy.ts:384 | GET /api/tavus/replicas | Read |
| Create conversation | server/vendorProxy.ts:402 | POST /api/tavus/conversations | Outbound (IRREVERSIBLE) |
| List conversations | server/vendorProxy.ts:427 | GET /api/tavus/conversations | Read |
| VIN lead creation | server/routes/webhooks.ts:1118–1213 | inline in webhook | External (IRREVERSIBLE) |
| Transcript analysis | server/routes/webhooks.ts:1296–1307 | analyzeTranscriptWithClaude() | Internal |
| MCP tools | central-mcp (port 4002) | tavus_list_*, tavus_create_*, tavus_get_* | External |

### I4: Resend (Email)

| Surface | File | Function/Route | Direction |
|---------|------|----------------|-----------|
| Send email (MCP) | server/outbound.ts:121 | sendEmail() | Outbound (IRREVERSIBLE) |
| Lead notification | server/routes/webhooks.ts:154–283 | sendLeadNotificationEmail() | Outbound (IRREVERSIBLE) |
| Email in conversations | server/routes/conversations.ts:188–197 | inline | Outbound (IRREVERSIBLE) |
| Welcome email | server/routes/users.ts:95–125 | inline in user creation | Outbound (IRREVERSIBLE) |
| Invite email | server/routes/users.ts:348–379 | inline in invite creation | Outbound (IRREVERSIBLE) |
| Password reset | server/routes/auth.ts:431–442 | inline in reset handler | Outbound (IRREVERSIBLE) |
| No inbound webhook | N/A | N/A | N/A |
| MCP tool | central-mcp (port 4002) | resend_send_email | External |
| Direct SDK | server/routes/auth.ts, users.ts | Resend SDK | External |

### I5: Cross-Provider (VIN Solutions via vin-safe-mcp)

| Surface | File | Function/Route | Direction |
|---------|------|----------------|-----------|
| VAPI->VIN lead | server/routes/webhooks.ts:767–884 | vin_safe_prepare_lead + vin_safe_execute_lead | Outbound (IRREVERSIBLE) |
| Tavus->VIN lead | server/routes/webhooks.ts:1118–1213 | same prepare+execute flow | Outbound (IRREVERSIBLE) |
| VIN lead query | server/vendorProxy.ts:527 | GET /api/vin/leads | Read |
| VIN lead summary | server/vendorProxy.ts:552 | GET /api/vin/leads/summary | Read |
| REST API | vin-safe-mcp (port 4003) | /api/tool/vin_safe_* | External |

### CommGate (Outbound Safety)

| Surface | File | Function/Route |
|---------|------|----------------|
| Global kill switch | server/outbound.ts:209 | OUTBOUND_LIVE_ENABLED env var |
| Org-level gates | server/outbound.ts:239–311 | checkCommGate() |
| Channel-specific flags | storage: organizations table | outbound_enabled, sms_enabled, phone_enabled, email_enabled, video_enabled |
| Business hours (TCPA) | server/outbound.ts:226–237 | isWithinBusinessHours() |
| Blacklist check | server/outbound.ts:289–298 | inline in checkCommGate() |
| Rate limiting | server/outbound.ts:300–307 | getRecentOutboundCount() |
