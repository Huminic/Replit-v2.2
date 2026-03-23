# Cross-Sign: G-7.4 — After-Hours Auto-Response Template

**Implementing Role:** backend
**Reviewing Role:** enforcer
**Sprint:** G-7.4
**Date:** 2026-03-23

## Review

- After-hours detection uses org settings (businessHoursStart, businessHoursEnd, timezone)
- Configurable afterHoursResponse template stored in agent settings JSONB
- Falls back to regular autoGreeting when no after-hours template configured
- Conversation tagged with "after-hours" and "morning-followup" for team visibility
- All outbound goes through processOutboundSend with CommGate check
- No frontend modifications made (FE portion documented as blocked)
- TypeScript compiles without new errors (Set spread issue fixed with filter-based dedup)
- Activity logging distinguishes after_hours_response_sent from auto_greeting_sent

## Verdict: APPROVED
