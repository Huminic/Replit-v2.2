# Pre-Execution Report: I-3.5
Timestamp: 2026-03-22T20:20:00Z
Sprint: I-3.5
Status: READY

## Investigation Findings
After-hours logic already exists at sms.ts lines 150-185:
- Reads org.settings.timezone (default "America/New_York")
- Reads businessHoursStart (default "08") and businessHoursEnd (default "18")
- If after hours: sends hardcoded auto-response via processOutboundSend
- Does NOT queue the outbound follow-up message
- Auto-response text is hardcoded, not configurable

scheduledActions table exists. Scheduler runs every 30s but only handles trigger_action type, not queued SMS.

org.settings is currently empty ({}) for all orgs.

## What Needs to Change

### BE (server/routes/sms.ts)
- Change defaults from 08-18 to 07-22
- Replace hardcoded auto-response with configurable template from org.settings.afterHoursMessage
- Include business hours in the auto-response: "available from {start} to {end}"
- After sending auto-response, queue the follow-up to scheduledActions with executeAt = next 7 AM

### BE (server/services/scheduler.ts)
- Add handler for actionType "queued_sms" in processScheduledActions
- When executed: call processOutboundSend with the queued message payload

### FE (client/src/pages/settings.tsx) — USER APPROVED
- Add to Settings > Organization: timezone, business hours start/end, after-hours message textarea

### DT (database)
- Seed org.settings for all stores with defaults

## Declared Files
- server/routes/sms.ts
- server/services/scheduler.ts
- client/src/pages/settings.tsx
- evidence/I-3.5/

## Success Criteria
- SMS during blackout (22:00-07:00) triggers configurable auto-response with hours
- Follow-up queued in scheduledActions with executeAt = next 7 AM
- Scheduler processes queued_sms and sends via CommGate
- Settings UI shows timezone, hours, auto-response fields
