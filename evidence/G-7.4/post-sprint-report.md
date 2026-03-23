# Post-Sprint Report: G-7.4 — After-Hours Auto-Response Template

**Sprint:** G-7.4
**Phase:** 7 — Triggers & Automation
**Type:** Gap (backend build)
**Date:** 2026-03-23

## What Was Built

After-hours awareness in the inbound SMS auto-greeting handler (TextMagic webhook in `server/routes.ts`).

### Business Hours Detection
- Reads `businessHoursStart`, `businessHoursEnd`, and `timezone` from org settings JSONB
- Defaults: 09:00-17:00, America/New_York
- Converts current time to org's timezone for accurate comparison
- Determines `isAfterHours` flag

### After-Hours Auto-Response
- If `isAfterHours === true` and agent has `settings.afterHoursResponse` configured:
  - Uses the after-hours template instead of regular `autoGreeting`
  - Template supports same placeholders: `{{customerName}}`, `{{dealershipName}}`, `{{agentName}}`
  - Logs with source `after_hours_response` (vs `auto_greeting` for regular hours)
  - Activity log action: `after_hours_response_sent`
- If `isAfterHours === true` but no `afterHoursResponse` configured:
  - Falls back to regular `autoGreeting` behavior (unchanged)
- If within business hours:
  - Regular `autoGreeting` behavior (unchanged)

### Conversation Tagging
- When SMS arrives after hours, conversation is tagged with:
  - `"after-hours"` — identifies the timing
  - `"morning-followup"` — flags for team review in the morning
- Tags are deduplicated to prevent duplicates

### CommGate Enforcement
- All sends go through `processOutboundSend()` which includes CommGate check
- With CommGate OFF (current state for all orgs), no real SMS is sent

## Files Modified

- `server/routes.ts` — Modified TextMagic webhook handler's auto-greeting IIFE (~line 5665-5770)

## FE Component — BLOCKED

The "After-Hours Response" field in the agent trigger config UI requires owner approval per UI Protection rule. The `afterHoursResponse` value can currently only be set via direct database update or the existing PATCH /api/agents/:id endpoint by including it in the `settings` JSONB.

## How to Configure (Without UI)

Set the after-hours response template on an agent:
```sql
UPDATE agents
SET settings = jsonb_set(
  COALESCE(settings, '{}'::jsonb),
  '{afterHoursResponse}',
  '"Thank you for reaching out to {{dealershipName}}. Our office is currently closed. We will get back to you first thing in the morning. - {{agentName}}"'
)
WHERE id = '<agent-id>';
```

Or via API:
```
PATCH /api/agents/:id
{ "settings": { "afterHoursResponse": "Thank you for reaching out..." } }
```

## Success Criteria Check

- [x] Business hours detected from org settings
- [x] After-hours template used when configured
- [x] Regular autoGreeting used as fallback
- [x] Conversation tagged for morning followup
- [x] All sends through processOutboundSend (CommGate enforced)
- [x] TypeScript compiles without new errors
- [ ] FE field for after-hours response (BLOCKED — requires owner approval)
