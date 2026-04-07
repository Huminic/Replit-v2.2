# Section Function Map — PE-SETTINGS-03

**Page:** Settings (`/settings/system`)
**User:** serra_honda@huminic.ai (org_admin, Serra Honda)
**Date:** 2026-04-07

## Layout Pattern

Tile grid landing page with 6 visible tiles (AI Configuration hidden for org_admin role). Clicking a tile transitions to a full section detail view. Each section has a "Back" button to return to the tile grid. Navigation is state-based (not route-based).

## Section Map

| Tile | ID | Description | Visible to org_admin | Real API | Key Controls |
|------|----|-------------|---------------------|----------|--------------|
| User Management | `users` | Manage users, roles, and permissions | Yes | `/api/users`, `/api/roles` | User list, Add User dialog, Invite User dialog, Edit/Deactivate/Reset PW per user, Search filter |
| Organization | `organization` | Company profile and branding | Yes | `/api/organizations/:id`, `/api/outbound/status`, `/api/settings/org` | Org name, AI persona name, phone, email, public listing toggle, Business Hours config, Communication Gate toggle, Channel toggles |
| Tools & Integrations | `tools` | Configure tools, widgets, and landing pages | Yes | `/api/widgets`, `/api/integrations/:orgId/vin-config` | 6 tabs: MCP Tools, Widgets, Universal, Landing Pages, Skills, VIN Lead Config. Tool cards with toggles, widget CRUD, embed code |
| Knowledge Base | `knowledge` | Upload and manage AI training data | Yes | `/api/documents`, `/api/documents/check-duplicate` | File upload (5MB max), duplicate detection with CSV comparison, document list, delete, kill switch |
| AI Configuration | `ai` | Hunches, agents, AI behavior settings | **No** (super_admin/partner_admin only) | `/api/settings/org` | AI model selector, system prompt, chat instructions, agent behavior, hunches |
| Notifications | `notifications` | Alert preferences and delivery channels | Yes | `/api/settings/org` | Email/SMS/Push toggle, quiet hours, per-event preferences (New Lead, Appointment, Agent Alert, Task Due) |
| Appearance | `appearance` | Theme, layout, display preferences | Yes | localStorage only | Compact mode, animations, default view selector, show metric tiles |

## API Verification Summary

| Endpoint | Method | Status | Response |
|----------|--------|--------|----------|
| `/api/users` | GET | 200 | Returns array of org users with role info |
| `/api/roles` | GET | 200 | Returns 8 roles (super_admin through marketing) |
| `/api/settings/org` | GET | 200 | Returns org-level settings (sparse: only textmagicPhone) |
| `/api/outbound/status` | GET | 200 | Returns full outbound status with channel toggles |
| `/api/widgets` | GET | 200 | Returns org widgets (3+ widgets with config) |
| `/api/documents` | GET | 200 | Returns org documents (4 docs: txt, docx, pdf, csv) |
