# Bug Log — PE-SETTINGS-03

**Sprint:** PE-SETTINGS-03
**Date:** 2026-04-07

## Bugs / Risks Found

| # | Severity | Category | Description | False-Pass? | Flow |
|---|----------|----------|-------------|-------------|------|
| B1 | Low | Validation | Add User form has no client-side password strength validation. Placeholder says "Minimum 6 characters" but no enforcement visible in frontend code. Server may enforce. | No | F3 |
| B2 | Medium | RBAC | Role dropdown in Add/Invite User shows all 8 roles to org_admin. An org_admin could potentially select super_admin or partner_admin when creating users. Server-side role validation not verified. | Potential false-pass if server allows | F7 |
| B3 | Low | UX | No deep-link support for settings subsections. Navigation is state-based (useState). Page refresh always returns to tile grid, losing section context. | No | F6 |
| B4 | Info | Completeness | Notification settings toggle correctly in UI and persist to /api/settings/org, but actual notification delivery (email, SMS, push) is not verified. Toggles may be cosmetic if backend notification pipeline is not implemented. | Potential false-pass | F4 |

## No Bugs Found In

- Tile grid rendering and RBAC filtering
- User list API data loading and display
- Organization settings (name, persona, business hours, CommGate)
- Widget management and API integration
- Knowledge Base document management
- Appearance settings (localStorage persistence)
- Tool card toggles and locked state management

## Summary

- 0 Critical bugs
- 0 High severity bugs
- 1 Medium severity bug (B2: role escalation risk)
- 2 Low severity bugs (B1, B3)
- 1 Info item (B4: notification delivery unverified)

No fixes applied — all items are either server-side concerns or design decisions, not frontend functional bugs.
