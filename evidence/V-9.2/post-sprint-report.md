# Post-Sprint Report: V-9.2 — Verify Activity Feed

**Sprint:** V-9.2
**Phase:** 9 — Notifications & Alerts
**Date:** 2026-03-23
**Verdict:** PASS

---

## API Verification

### GET /api/activity-log
- **Status:** PASS
- Returns array of activity log objects with: id, userId, organizationId, action, entityType, entityId, metadata, createdAt
- Actions observed: "login_failed" (security), "agent_updated", "campaign_dry_run"
- Each entry has a `createdAt` timestamp (ISO 8601 format)
- Metadata includes structured context (e.g., `{"reason": "invalid_password", "category": "security"}`)

### Org Scoping
- **Status:** PASS
- Route handler at server/routes.ts line 2384: `storage.getActivityLogs(req.user.organizationId, limit)`
- Uses authenticated user's organizationId — cannot see other orgs' activity
- Limit parameter capped at 100: `Math.min(parseInt(req.query.limit) || 50, 100)`

### Activity Types Observed
| Action | Entity Type | Example |
|--------|------------|---------|
| login_failed | user | Security event with reason "invalid_password" |
| agent_updated | agent | Agent config change (fields: "instructions", agentName: "Carol") |
| campaign_dry_run | campaign | Campaign test execution |

## UI Code Verification

### Activity Feed Button (TopBar.tsx)
- Activity icon rendered via `<Activity>` from lucide-react (line 272)
- data-testid: `button-activity-feed`
- Opens dropdown with ScrollArea (h-80)

### Activity Feed Dropdown (TopBar.tsx lines 276-317)
- Fetches from `/api/activity-log?limit=8` via react-query
- Loading state with skeleton UI
- Empty state: "No recent activity"
- Each item shows: colored circle icon, description text, relative timestamp
- Uses `mapActivityLogToItem()` from lib/activity-utils.ts
- Uses `getActivityColor()` for type-based color coding
- data-testid: `dropdown-activity`

## Summary

All 3 acceptance criteria verified:

| Criterion | Result |
|-----------|--------|
| GET /api/activity-log returns timestamped activity entries | PASS |
| Activity feed shows user actions | PASS (login, agent updates, campaigns) |
| Activity is org-scoped | PASS (uses req.user.organizationId) |
