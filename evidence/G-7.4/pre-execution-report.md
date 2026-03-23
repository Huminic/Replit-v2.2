# Pre-Execution Report: G-7.4 — After-Hours Auto-Response Template

**Sprint:** G-7.4
**Phase:** 7 — Triggers & Automation
**Type:** Gap (backend build + FE blocker)
**Date:** 2026-03-23

## Objective

When an SMS arrives after business hours, send a configurable auto-response instead of (or in addition to) the regular auto-greeting, and tag the conversation for morning followup.

## Declared Files

- `server/routes.ts` — Add after-hours check to TextMagic webhook inbound SMS handler; use agent's afterHoursResponse template if configured
- `evidence/G-7.4/` — evidence output

## FE Component — BLOCKED

The FE portion ("Add After-Hours Response field to agent trigger config") requires owner approval per UI Protection rule. Only the backend logic is implemented in this sprint.

## Implementation Plan

1. In the TextMagic webhook handler (inbound SMS, ~line 5665), after resolving the org:
   - Check if current time is within business hours using org settings (businessHoursStart, businessHoursEnd, timezone)
   - If after hours and a greeting agent has an `afterHoursResponse` in its settings JSONB, use that template instead of the regular autoGreeting
   - Tag the conversation with "after-hours" and "morning-followup" for morning review
2. The afterHoursResponse template supports the same placeholders: {{customerName}}, {{dealershipName}}, {{agentName}}
3. If no afterHoursResponse is configured, fall back to regular autoGreeting behavior

## Success Criteria

- Inbound SMS during business hours: regular autoGreeting sent (unchanged behavior)
- Inbound SMS after hours with afterHoursResponse configured: after-hours template sent instead
- Inbound SMS after hours without afterHoursResponse: regular autoGreeting sent (fallback)
- Conversation tagged with "after-hours" and "morning-followup" when received outside business hours
- All sends go through processOutboundSend (CommGate enforced)
- No real SMS sent (CommGate is OFF for all orgs)
