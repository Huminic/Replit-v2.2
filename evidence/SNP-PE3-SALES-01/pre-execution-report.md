# SNP-PE3-SALES-01 Pre-Execution Report

**Sprint:** SNP-PE3-SALES-01
**Date:** 2026-04-07

## Objective
Fix Sales drill-down renderers for Total Leads and New Leads — currently returning null, causing empty popout tables.

## Declared Files
- client/src/pages/sales.tsx

## UI Changes
FUNCTIONAL_ONLY — add table renderers matching existing active_pipeline pattern. No design changes.

## Acceptance Criteria
- SNP-PE3-SALES-01.AC1: Total Leads drill-down shows lead records in table
- SNP-PE3-SALES-01.AC2: New Leads drill-down shows lead records in table
- SNP-PE3-SALES-01.AC3: No UI design/layout changes — functional fix only

## Test Plan
- API verification: curl total_leads and new_leads endpoints, confirm records returned
- Code review: verify new renderer matches active_pipeline pattern
