# Post-Sprint Report: G-13.3 — VIN Lead Config Dropdown

**Sprint:** G-13.3
**Date:** 2026-03-23

## What Was Done

### Backend: VIN Users Proxy (NEW)
- GET /api/vin/users/:orgId in server/routes/integrations.ts
- Resolves org → VIN dealer ID via integrations table
- Calls vin_list_users on VIN safe MCP (port 4003) via callVinSafeMCP helper
- Returns formatted users: { userId, fullName, userGroup, displayLabel }
- displayLabel format: "FullName — UserGroup"
- Auth: authenticateToken + requireRole(3)

### Frontend: Settings Dropdown (NEW — owner approved)
- VinLeadConfigSection component added to settings.tsx
- Rendered under CRM tool card as collapsible details section
- Select dropdown populated from /api/vin/users/:orgId
- Options display "FullName — UserGroup"
- Auto-saves on selection change via PATCH /api/integrations/:orgId/vin-config
- Shows dealer name and ID below dropdown
- Loads current selection from vinConfig on mount

## Files Modified
- server/routes/integrations.ts — callVinSafeMCP helper + GET /api/vin/users/:orgId
- client/src/pages/settings.tsx — VinLeadConfigSection component

## TypeScript: clean (0 errors)
