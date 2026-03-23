# Pre-Execution Report: G-7.2 — Trigger Configuration API

**Sprint:** G-7.2
**Phase:** 7 — Triggers & Automation
**Type:** Gap (backend build)
**Date:** 2026-03-23

## Objective

Add dedicated GET and PATCH endpoints for trigger configuration per agent. These provide type validation, channel validation, and delay format validation beyond what the generic PATCH /api/agents/:id offers.

## Declared Files

- `server/routes.ts` — Add GET /api/agents/:id/triggers and PATCH /api/agents/:id/triggers endpoints
- `evidence/G-7.2/` — evidence output

## Implementation Plan

1. Add GET /api/agents/:id/triggers — returns the triggers array from agent.triggers JSONB
2. Add PATCH /api/agents/:id/triggers — validates and updates trigger config
3. Validate trigger types: new_lead_followup, stale_lead, appointment_reminder
4. Validate trigger channels: sms, phone, email
5. Validate delay format (hours/minutes must be positive numbers)
6. Return 400 for invalid trigger type or channel

## Success Criteria

- GET /api/agents/:id/triggers returns current trigger config array
- PATCH /api/agents/:id/triggers validates and persists config
- Invalid trigger type returns 400 with descriptive error
- Invalid channel returns 400 with descriptive error
- Negative or non-numeric delay returns 400
- Auth required (authenticateToken + requireRole(3))
- Org ownership check enforced
