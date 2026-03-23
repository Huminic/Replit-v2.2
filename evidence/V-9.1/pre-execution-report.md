# Pre-Execution Report: V-9.1 — Verify In-App Notifications

**Sprint:** V-9.1
**Phase:** 9 — Notifications & Alerts
**Type:** Verification (read-only)
**Date:** 2026-03-23

## Objective

Verify the in-app notification system: bell icon, unread count badge, notification list, mark-as-read, and mark-all-read.

## Declared Files

- `evidence/V-9.1/` — evidence output only (no code changes)

## Success Criteria

- GET /api/notifications returns notification list
- GET /api/notifications/unread-count returns correct count
- Bell icon shows unread badge count in TopBar
- Clicking a notification marks it as read
- "Mark all read" clears the count
