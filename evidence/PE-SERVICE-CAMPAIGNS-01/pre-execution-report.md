# PE-SERVICE-CAMPAIGNS-01 Pre-Execution Report

**Sprint:** PE-SERVICE-CAMPAIGNS-01 — Service Campaigns: CSV Upload, Channel Execution, Reply Routing, and TeamBox Continuity
**Date:** 2026-04-06
**Operator Authorization:** Directed by operator in session 2026-04-06

## Objective

Perform a comprehensive production evaluation of the Service Campaigns workflow end-to-end: campaign creation, CSV upload and recipient parsing, outbound execution (dry run and live), kill switch safety, inbound reply routing to TeamBox, and message accuracy. Evaluate whether the operator can run a real service campaign from setup through customer reply handling. No code changes — read-only evaluation with uiPermissions: NONE (except campaign creation/upload which are data operations, not code changes).

## Test Plan

### Phase 1: Campaign Setup (UC-01 through UC-04)
- Navigate to /service, verify Campaigns tab is default
- Click "New Campaign", create single-channel (SMS) campaign
- Click "New Campaign", create multi-channel (SMS + Email) campaign, verify separate rows
- Click campaign row, verify detail dialog content

### Phase 2: CSV Upload (UC-05 through UC-09)
- Download CSV template via "CSV Template" link
- Upload valid CSV to a campaign, verify recipient count and toast
- Upload CSV with missing required columns, verify error
- Upload CSV with missing optional columns, verify warnings
- Test bulk upload button (header) behavior

### Phase 3: Execution (UC-10 through UC-15)
- Execute dry run on campaign with recipients, verify progress badge
- Execute live campaign (REQUIRES OPERATOR APPROVAL — IRREVERSIBLE)
- Stop campaign during execution, verify halt
- Schedule campaign for future time, verify status change
- Toggle kill switch, verify execution block
- Check Communications Paused badge if commgate is off

### Phase 4: TeamBox Continuity (UC-16 through UC-18)
- Check TeamBox for campaign-originated conversations
- Attempt to filter by campaign (known missing — cross-ref PE-TEAMBOX-01)
- Open campaign conversation, verify message content matches template

### Phase 5: Peripheral (UC-19 through UC-21)
- Switch to Insights tab, verify 6 service metric tiles
- Verify Campaign Safety card renders and dismisses
- Verify RBAC (org_admin can create campaigns)

## Declared Files

- evidence/PE-SERVICE-CAMPAIGNS-01/pre-execution-report.md
- evidence/PE-SERVICE-CAMPAIGNS-01/section-function-map.md
- evidence/PE-SERVICE-CAMPAIGNS-01/use-case-inventory.md
- evidence/PE-SERVICE-CAMPAIGNS-01/acceptance-matrix.md
- evidence/PE-SERVICE-CAMPAIGNS-01/evidence-index.md
- evidence/PE-SERVICE-CAMPAIGNS-01/bug-log.md
- evidence/PE-SERVICE-CAMPAIGNS-01/post-sprint-report.md
- evidence/PE-SERVICE-CAMPAIGNS-01/enforcer-checklist.txt
- evidence/PE-SERVICE-CAMPAIGNS-01/cross-sign.md
- evidence/PE-SERVICE-CAMPAIGNS-01/workflow-audit.log

## Not In Scope

- Modifying application code (service.tsx, campaigns.ts, outbound.ts)
- Marketing page campaigns (separate department)
- Agent configuration or calendar functionality
- Insights page bugs (covered by PE-INSIGHTS-01)
- VIN Solutions integration testing (separate sprint)

## Comms Boundary

- **Dry run execution:** SAFE — no real messages sent, preview only
- **Live execution:** IRREVERSIBLE — requires explicit operator approval per UC-11
- **Campaign creation:** Creates database records only, no outbound comms
- **CSV upload:** Stores recipients only, no outbound comms
- **Kill switch:** Safety control, no outbound comms

## Source Files Read

| File | Lines | Key Findings |
|------|-------|-------------|
| client/src/pages/service.tsx | 849 | 4 tabs, campaigns table with kill switch, CSV upload, execution controls, detail dialog |
| server/routes/campaigns.ts | 518 | CRUD + CSV upload (13 columns, alias matching) + execute/stop/schedule + recipients |
| server/outbound.ts | (referenced) | startCampaignExecution, stopCampaignExecution, getExecutionStatus |

## Ghost Entry Gate

**ENTRY GATE: APPROVED**

Rationale: Pre-execution report covers all 5 phases (21 use cases), 8 acceptance criteria, action boundary review with IRREVERSIBLE gates identified. Declared files match sprints.json. Comms boundary explicitly defined. Source files read and analyzed. No ambiguities remain.
