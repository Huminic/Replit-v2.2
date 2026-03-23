# Pre-Execution Report: G-7.3 — Trigger Config UI with Channel-Specific Templates

**Sprint:** G-7.3
**Phase:** 7 — Triggers & Automation
**Type:** Gap (UI build — owner approved)
**Date:** 2026-03-23

## Objective

Add channel-specific template fields to the trigger config modal in AgentConfigPane.tsx. When channel changes, show/hide the appropriate template input.

## Declared Files

- `client/src/components/AgentConfigPane.tsx` — trigger modal channel-specific templates

## Success Criteria

- Channel dropdown (SMS/Email/Phone) replaces generic message template
- SMS: textarea with 160 char limit + merge field hints
- Email: subject line input + rich text body
- Phone: call goal text field (passed to VAPI)
- Fields show/hide when channel dropdown changes
- TypeScript compiles clean
