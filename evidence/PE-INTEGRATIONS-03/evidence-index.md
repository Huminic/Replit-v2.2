# PE-INTEGRATIONS-03 — Evidence Index

## Eval Metadata

- **Sprint:** PE-INTEGRATIONS-03
- **Type:** Observation-only eval (no code modifications, no outbound sends)
- **Date:** 2026-04-07
- **Branch:** wave-pe3 (sniper-launch)
- **Evaluator:** Claude Opus 4.6

## Evidence Sources

### Code Review (Primary)
| File | Lines Reviewed | Key Findings |
|------|---------------|--------------|
| server/routes/webhooks.ts | 1-1325 (full) | VAPI + Tavus webhook handlers, VIN lead creation, email notifications, AI analysis |
| server/routes/sms.ts | 1-299 | TextMagic webhook, STOP handling, after-hours, conversation creation |
| server/vendorProxy.ts | 1-597 | callMCP(), VAPI/Tavus API routes, org scoping, VIN lead queries |
| server/outbound.ts | 1-350 | sendSms(), sendEmail(), sendPhone(), CommGate, rate limiting, business hours |
| server/routes/conversations.ts | 188-197 | Email send via Resend MCP |
| server/routes/users.ts | 95-125, 348-379 | Welcome/invite emails via Resend SDK |
| server/routes/auth.ts | 431-442 | Password reset email via Resend SDK |

### Database Queries (Read-Only)
| Query | Result |
|-------|--------|
| Conversations by channel | ai-chat: 17, chat: 7, voice: 6, sms: 3, email: 1, video: 0 |
| Outbound logs | email sent: 331, sms sent: 21, sms failed: 14, sms blocked: 13, phone dry_run: 1 |
| Integrations by provider | vinsolutions: 5 |
| Agents with provider IDs | 5 agents (Magnolia, Georgia, Elizabeth, Savannah, Caroline) — all active, all have VAPI + Tavus IDs |
| Appointments by source | vapi: 147, tavus: 64 |
| Activity log (integration) | tavus_video_completed: 180, vapi_call_received: 158, sms_inbound_received: 87 |
| VIN escalation tasks | 5 "VIN Lead Prepare Failed" (all archived, latest 2026-04-05) |
| Org outbound flags | All orgs except Huminic have outbound/sms/phone/email enabled; video disabled for all |
| Webhook last seen | vapi: 2026-04-07 18:43, tavus: 2026-04-05 12:09, sms: 2026-04-07 18:43 |

### Endpoint Checks
| Endpoint | Status |
|----------|--------|
| GET /api/webhooks/vapi | 200 OK — {"status":"ok","service":"nexxus-connect-vapi-webhook"} |
| GET /api/health | 200 OK — {"status":"ok","version":"2.2.0"} |

### Environment Configuration
| Variable | Status |
|----------|--------|
| VAPI_PRIVATE_KEY | SET |
| TAVUS_API_KEY | SET |
| RESEND_API_KEY | SET |
| VINSOLUTIONS_API_KEY | SET |
| AI_INTEGRATIONS_ANTHROPIC_API_KEY | SET |
| OUTBOUND_LIVE_ENABLED | SET (true) |
| TEXTMAGIC_WEBHOOK_SECRET | NOT SET |
| VAPI_WEBHOOK_SECRET | NOT SET |
| TAVUS_WEBHOOK_SECRET | SET |
| VIN_SAFE_MCP_TOKEN | NOT SET (uses hardcoded default) |
| VIN_SAFE_MCP_URL | NOT SET (uses hardcoded default) |

### UI Inspection
- **Status:** BLOCKED — Playwright MCP browser session was stale (Target page, context or browser has been closed); direct browser execution blocked by captain hook during active sprint
- **Fallback:** Database evidence confirms integration data flows through to storage layer. UI rendering verified in prior evals (PE-TEAMBOX-02, PE-INTEGRATIONS-02).

## Artifact Files

| File | Description |
|------|-------------|
| section-function-map.md | Complete map of integration surfaces by provider |
| use-case-inventory.md | 11 use cases with flow descriptions and status |
| acceptance-matrix.md | 40-question evaluation across 5 investigation areas |
| bug-log.md | 4 bugs, 1 gap, 2 notes |
| evidence-index.md | This file |
| workflow-audit.log | Timestamped eval execution log |
| post-sprint-report.md | Final report with AC results |
