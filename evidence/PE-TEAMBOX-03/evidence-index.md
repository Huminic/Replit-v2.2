# Evidence Index — PE-TEAMBOX-03

**Date:** 2026-04-07
**Org:** Serra Honda

## Screenshots

| File | Flow | Description |
|------|------|-------------|
| F1-teambox-full-layout.png | F1 | Full TeamBox viewport showing 4-column layout on initial load |
| F2-conversation-selected.png | F2 | Website Visitor chat selected — 3 messages visible, detail pane populated |
| F3-sms-filter.png | F3 | SMS channel filter active — 2 SMS conversations shown |
| F3-email-filter.png | F3 | Email channel filter active — 1 email conversation shown |
| F3-voice-filter.png | F3 | Voice channel filter active — 3 voice conversations shown |
| F4-sms-conversation.png | F4 | SMS conversation +1821616232 selected — 1 inbound message visible |
| F5-phone-tab-vapi-calls.png | F5 | Phone tab showing 6 VAPI call logs with transcripts |
| F5-voice-no-messages.png | F5 | Voice conversation selected — "No messages yet" despite call data existing |
| F6-search-stephanie.png | F6 | Search for "Stephanie" — 1 result returned correctly |
| F7-email-thread.png | F7 | Stephanie Thompson email thread — 2 messages, Marketing Agent + customer reply |
| F8-F9-reply-detail-pane.png | F8/F9 | Reply textarea and customer info detail pane visible |

## Documents

| File | Description |
|------|-------------|
| section-function-map.md | Complete map of every TeamBox UI element with data-testid references |
| use-case-inventory.md | Inventory of all use cases tested with data observed |
| acceptance-matrix.md | Full 8-question commentary for each of 9 flows |
| bug-log.md | 4 bugs found (BUG-01 through BUG-04) |
| evidence-index.md | This file |
| workflow-audit.log | Timestamped action log |

## DOM Snapshots (captured via Playwright MCP)

All snapshots were captured live from https://dev.huminicdev.com/teambox during the evaluation session. Accessibility snapshots were used to verify element structure and content; screenshots provide visual evidence.
