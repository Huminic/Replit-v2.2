# Pre-Execution Report: G-2.5
Timestamp: 2026-03-22T19:40:13Z
Sprint: G-2.5
Status: READY

## Ghost Directive Acknowledgment
GM-20260322-180919: C18 ACKNOWLEDGED. This pre-exec is written and will be committed BEFORE any code changes.

## Objective
Add default_vin_user_id to integrations table so VIN lead assignment uses a configured userId instead of name matching. Add API endpoints and Settings UI dropdown.

## Declared Files
- shared/schema.ts (add default_vin_user_id column to integrations)
- server/routes/organizations.ts (add GET/PATCH vin-config endpoints)
- client/src/pages/settings.tsx (add Default VIN Sales Rep dropdown — FE change, requires user approval)
- evidence/G-2.5/

## Success Criteria
- Each dealer's integrations record has default_vin_user_id set
- GET /api/integrations/:orgId/vin-config returns the configured userId
- PATCH /api/integrations/:orgId/vin-config updates it
- Settings page shows dropdown populated from vin_list_users
- Null config returns error instead of name matching fallback
