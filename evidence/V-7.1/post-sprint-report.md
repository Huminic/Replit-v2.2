# Post-Sprint Report: V-7.1 — Verify Trigger Infrastructure

**Sprint:** V-7.1
**Phase:** 7 — Triggers & Automation
**Type:** Verification (read-only)
**Date:** 2026-03-23

## Verification Results

### 1. Scheduler Loop — CONFIRMED

Three scheduler intervals running in `server/index.ts`:

| Scheduler | Interval | Function | Line |
|-----------|----------|----------|------|
| Campaign scheduler | 60s | `checkScheduledCampaigns` | 196 |
| Scheduled actions processor | 30s | `processScheduledActions` | 223 |
| Trigger condition checker | 15 min | `checkTriggerConditions` | 527 |

- Campaign scheduler uses distributed lock (`acquireSchedulerLock`) to prevent duplicate execution.
- Scheduled actions processor queries `getDueScheduledActions()` and executes `trigger_action` type actions via `executeTriggerAction()`.
- Trigger condition checker iterates all orgs, agents, and enabled triggers every 15 minutes.

**Note:** Plan references `server/services/scheduler.ts` but this file does not exist. All scheduler logic is inline in `server/index.ts` (lines 170-527).

### 2. agents.triggers JSONB — CONFIRMED

- Schema definition at `shared/schema.ts` line 76: `triggers: jsonb("triggers").default([])`
- Stored as an array of trigger objects on the `agents` table.
- Each trigger has: `name`, `type`, `enabled`, `config` (with type-specific fields).
- Read at runtime: `const triggers = (agent.triggers as any[]) || []` (line 304).
- Filtering: `const enabledTriggers = triggers.filter((t: any) => t.enabled)` (line 305).

### 3. scheduledActions Table — CONFIRMED

Schema at `shared/schema.ts` line 443:
- `id` (UUID, PK)
- `organizationId` (UUID, FK to organizations)
- `actionType` (text, e.g., "trigger_action")
- `payload` (JSONB)
- `executeAt` (timestamp)
- `executedAt` (timestamp, null until executed)
- Index: `idx_scheduled_actions_execute` on `executeAt`

Storage methods confirmed:
- `createScheduledAction()` — line 1428
- `getDueScheduledActions()` — line 1433 (filters executeAt <= now AND executedAt IS NULL)
- `markScheduledActionExecuted()` — line 1442

### 4. Trigger Types — CONFIRMED

**new_lead_followup** (line 309-453):
- Single-step mode: sends SMS follow-up after `delayHours` (default 48h).
- Multi-step mode: supports `businessHoursSequence` and `afterHoursSequence` arrays.
- Each step has: `channel`, `waitMinutes`, `messageTemplate`.
- Business hours detection via configurable `storeHours` (openTime, closeTime, closedDays).
- Template placeholders: `{customerFirstName}`, `{agentName}`, `{dealerStoreName}`.
- Conversion status exclusion: skips leads with statuses like "SOLD".
- Lead query: `getLeadsDueForFollowup()` and `getLeadsDueForMultiStepFollowup()`.
- Step tracking via `updateFollowupStep()` and `markFollowupSent()`.

**stale_lead** (line 454-524):
- Checks conversations that have been idle for `thresholdMinutes` (default 120).
- Supports action sequences with `waitMinutes` delays.
- Actions with delay > 0 are scheduled via `createScheduledAction()`.
- Actions with delay = 0 execute immediately via `executeTriggerAction()`.
- Tracks processed conversations via `staleTriggerProcessedAt` timestamp.

**appointment_reminder**: NOT implemented (mentioned in plan only).

### 5. Channels — CONFIRMED

`executeTriggerAction()` at line 260 supports three channels:
- **SMS** (`actionType === 'sms'`): sends via `processOutboundSend()` with channel 'sms'.
- **Phone** (`actionType === 'call'`): sends via `processOutboundSend()` with channel 'phone'.
- **Email** (`actionType === 'email'`): sends via `processOutboundSend()` with channel 'email'.

All three channels route through `processOutboundSend()` in `server/outbound.ts`.

### 6. CommGate Check — CONFIRMED

`processOutboundSend()` at line 308 of `server/outbound.ts`:
- Calls `checkCommGate(org, campaign, recipient, request.channel, request.to)` at line 323.
- If `gateResult.allowed === false`, the send is blocked, logged as "blocked", and a task is created for visibility.
- All trigger sends go through this path. CommGate is enforced.

### 7. Template Placeholder Substitution — CONFIRMED

Two substitution systems:
1. **In new_lead_followup** (line 340-343): `{customerFirstName}`, `{agentName}`, `{dealerStoreName}` via String.replace().
2. **In executeTriggerAction** (line 265-282): hardcoded templates with string interpolation using `customerName`, `agentName`, `dealershipName`.

**Gap noted:** The `executeTriggerAction()` function uses hardcoded message templates instead of reading from the trigger config. The new_lead_followup path reads `messageTemplate` from config, but `stale_lead` actions use `executeTriggerAction()` which has hardcoded messages.

## Missing Features (for subsequent sprints)

1. **No trigger CRUD API** — No GET/PATCH `/api/agents/:id/triggers` endpoints exist. Triggers can only be set via direct database update or the general PATCH `/api/agents/:id` endpoint.
2. **No trigger configuration UI** — No UI for managing triggers on the agent edit page.
3. **No inbound SMS after-hours auto-response** — TextMagic webhook handler does not check business hours.
4. **No appointment_reminder trigger type** — Mentioned in plan but not implemented.
5. **executeTriggerAction() uses hardcoded templates** — Should read from trigger config.

## Verdict

Trigger infrastructure is **FUNCTIONAL**. The scheduler runs, triggers are processed from JSONB config, scheduledActions table handles deferred execution, and all outbound goes through CommGate. Two of three planned trigger types are implemented (new_lead_followup, stale_lead). The appointment_reminder type is missing.

**Recommendation:** Proceed to G-7.2 (Trigger Configuration API). No I- sprint needed for infrastructure — it works as designed.
