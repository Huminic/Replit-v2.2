# Pre-Execution Report: G-13.3 — VIN Lead Config Dropdown in Settings

**Sprint:** G-13.3
**Phase:** 13 — Settings & Administration
**Type:** Gap (FE+BE build — owner approved)
**Date:** 2026-03-23

## Objective

Add "Default VIN Sales Rep" dropdown to Settings > Integrations. Create backend proxy endpoint for VIN user list. Display "FullName — UserGroup".

## Declared Files

- `server/routes/integrations.ts` — GET /api/vin/users/:orgId proxy endpoint
- `client/src/pages/settings.tsx` — VinLeadConfigSection component + dropdown

## Success Criteria

- GET /api/vin/users/:orgId returns formatted user list from VIN safe MCP
- Dropdown shows "FullName — UserGroup" for each user
- Selecting a user PATCHes /api/integrations/:orgId/vin-config with UserId
- Current selection displayed on page load
- TypeScript compiles clean
