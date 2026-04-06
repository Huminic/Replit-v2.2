# Pre-Execution Report: REM-PE-006

**Sprint:** REM-PE-006
**Date:** 2026-04-06

## Objective

Fix 5 UI polish bugs across main.tsx, service.tsx, settings.tsx, and sales.tsx. Specifically: tiles re-expand after chat clear, campaign list pagination, billing tile, sales drill-downs, and campaign detail execution history.

## Declared Files

- client/src/pages/main.tsx
- client/src/pages/service.tsx
- client/src/pages/settings.tsx
- client/src/pages/sales.tsx
- evidence/REM-PE-006/

**Note:** `uiPermissions` is set to "NONE" but `declaredFiles` explicitly lists 4 UI page files. The `declaredFiles` field is treated as the binding scope declaration.

## UI Changes

All 5 bugs affect UI pages listed in declaredFiles.

## Acceptance Criteria

| AC | Description | Source |
|----|-------------|--------|
| REM-PE-006.AC1 | Dashboard tiles re-expand after being collapsed | BUG-PE01-006 |
| REM-PE-006.AC2 | Campaign list pagination navigates between pages | BUG-SC-05 |
| REM-PE-006.AC3 | Billing tile renders with correct plan/usage data | BUG-SET-01 |
| REM-PE-006.AC4 | Sales drill-downs navigate to filtered detail views | BUG-08 |
| REM-PE-006.AC5 | Campaign detail page loads with campaign data | BUG-SC-03 |

## Investigation Findings

### BUG-PE01-006 — Tiles don't re-expand after chat clear
**Root cause found.** In main.tsx:885, the "New Conversation" button handler resets `messages`, `inputValue`, `conversationId`, and `initialized` — but does NOT reset `tilesCollapsed` or `hasSentMessage`.
**Fix:** Add `setTilesCollapsed(false)` and `setHasSentMessage(false)` to the handler at line 885.

### BUG-SC-05 — Campaign list no pagination
**Finding:** Campaign list renders all items in a single table. Post-cleanup there are ~4 campaigns. At this scale, pagination adds complexity without user value.
**Resolution:** Document as acceptable at current scale. No code change needed.

### BUG-SET-01 — Billing tile missing from Settings grid
**Finding:** Settings tiles are: User Management, Organization, Tools & Integrations, Knowledge Base, AI Configuration, Notifications, Appearance. There is no Billing tile and no billing data/API in the system. This is not a missing feature — billing is not part of the current product.
**Resolution:** Document as not applicable. No code change needed.

### BUG-08 — Only 2/7 Sales tiles have drill-downs
**Finding:** Backend `getPipelineMetricDetails` supports 4 metrics: `active_pipeline`, `appointments_today`, `open_escalations`, `outbound_sent`. The frontend `salesMetricApiKeys` only maps 2: Active Pipeline and Appointments Set. Two more can be wired up without backend changes: "Total Leads" could use a new `total_leads` backend case querying warehouseLeads (30d), and "New Leads" could use a `new_leads` case. However, these require both backend and frontend changes.
**Fix:** Add `total_leads` and `new_leads` cases to storage.ts `getPipelineMetricDetails`, add them to the `validMetrics` list in metrics.ts, and wire up the frontend salesMetricApiKeys mapping. Also add rendering for these in the SalesMetricDetailDialog.

### BUG-SC-03 — Campaign detail missing execution history
**Finding:** Campaign detail modal (service.tsx:672-729) shows basic stats only. Backend has `GET /api/campaigns/:id/recipients` returning per-recipient data with firstName, lastName, phone, email, status, sentAt, deliveredAt. Also `GET /api/campaigns/:id/execution-status` for live execution progress.
**Fix:** Add a recipients table to the campaign detail dialog, fetching from the existing API endpoint.

## Test Plan

- Manual verification via browser that tiles re-expand after "New Conversation"
- Manual verification that campaign detail dialog shows recipient data
- Manual verification that sales tiles show drill-down data for Total Leads and New Leads
- Build verification: `npm run build` must succeed

## Ghost Entry Gate

ENTRY GATE: APPROVED

Rationale: Pre-exec covers all 5 ACs. Investigation is thorough with root causes identified. Two bugs documented as acceptable (no code change). Three bugs have clear fixes identified. DeclaredFiles match sprint scope.
