# S-11 Pre-Execution Report — Demo Hotfix

## Objective

Fix 12 demo-critical bugs found during owner walkthrough. Priority: DB cleanup first, then TeamBox batch, backend fixes, and verification. Demo imminent — all fixes must land in one commit.

## Declared Files

**Modified (existing):**
- client/src/pages/teambox.tsx — Popout nav, chat history, takeover, phone/video tabs, transcript modal, channel filters, reply sender name (BUGs #1,#2,#3,#4,#5,#10,#12)
- client/src/pages/widget-landing.tsx — Landing page slug routing, video window.open (AC13, AC14)
- client/src/App.tsx — /w/:slug route for dynamic dealer landing pages (AC13)
- client/src/pages/service.tsx — Nancy Gaston type fix (BUG #10)
- client/src/pages/sales.tsx — Pipeline contact URL display (BUG #7)
- server/vendorProxy.ts — Tavus org scoping (BUG #6)
- server/seed.ts — Production seed calls seedHuminicUsers() for duane.wells org persistence (AC9)

**New:**
- tests/e2e/s11-demo-hotfix.spec.ts — Verification tests for all 14 ACs

**Data fixes (DB/cleanup):**
- BUG #8: Remove VIN Lead test artifacts from escalations
- BUG #11: Fix duane.wells org to Huminic

## UI Changes

uiPermissions = FULL — all listed pages may be modified.

## Acceptance Criteria

| ID | Criterion | Component |
|----|-----------|-----------|
| S-11.AC1 | TeamBox popout SMS/Email/Phone/Video/Tasks links navigate and filter correctly | teambox |
| S-11.AC2 | Chat history bubbles render when conversation is selected | teambox |
| S-11.AC3 | Take Over button appears on automated conversations and switches to human mode | teambox |
| S-11.AC4 | Phone tab shows caller numbers, has pagination, transcript opens in modal with audio link | teambox |
| S-11.AC5 | Tavus video tab only shows conversations for current org personas | vendorProxy |
| S-11.AC6 | Pipeline Show Contact displays actual contact info, not raw URL | sales |
| S-11.AC7 | Home page escalations do not contain VIN Lead test artifacts | main |
| S-11.AC8 | Nancy Gaston shows as chat agent, not video | service |
| S-11.AC9 | duane.wells@huminic.ai starts in Huminic org on login | auth |
| S-11.AC10 | TeamBox top menu bar has channel filter buttons (SMS/Email/Voice/Video) | teambox |
| S-11.AC11 | Reply in TeamBox sends with actual user name, not hardcoded Agent | teambox |
| S-11.AC12 | Service campaign can be executed and SMS is sent (E2E smoke test) | service |

## Test Plan

### Execution Priority (from ghost analysis)

**Phase 1 — DB fixes (no code deploy needed):**
- BUG #8: Query and delete VIN Lead test artifacts from escalations/tasks
- BUG #11: Update duane.wells organization_id to Huminic in DB
- BUG #10: Update Nancy Gaston agent type from 'video' to 'chat' in DB

**Phase 2 — TeamBox batch (client/src/pages/teambox.tsx):**
- BUG #1: Popout nav links — ensure ?channel= param is read and applied
- BUG #5: Transcript modal — add modal with full transcript text + audio link on Phone tab
- BUG #3: Take Over — verify button renders for automated convos, sends PATCH to toggle
- BUG #12: Channel filter buttons — ensure top bar filter chips are visible and functional

**Phase 3 — Backend fixes:**
- BUG #6: Tavus scoping — filter tavus_list_conversations by org persona IDs in vendorProxy.ts
- BUG #7: Contact URL — sales.tsx pipeline Show Contact should display name/phone/email not raw URL

**Phase 4 — Verify:**
- BUG #2: Chat history — confirm message bubbles render (may already work after Phase 2 fixes)
- BUG #9: Campaign E2E — execute service campaign, verify outbound_log entry

### Test File: tests/e2e/s11-demo-hotfix.spec.ts (NEW)

```
npx playwright test tests/e2e/s11-demo-hotfix.spec.ts --reporter=list
```

Tests to write:
- S11-TB-NAV: Click popout links, verify URL and filter state
- S11-TB-CHAT: Select conversation, verify message bubbles render
- S11-TB-TAKEOVER: Automated convo shows Take Over, click toggles status
- S11-TB-PHONE: Phone tab renders with columns, pagination, transcript modal
- S11-TB-CHANNEL: Channel filter buttons visible and functional
- S11-TB-REPLY: Reply sends with user name
- S11-TAVUS: Video tab shows only current org conversations
- S11-SALES-CONTACT: Pipeline Show Contact shows name/phone/email
- S11-ESCALATIONS: Zero VIN Lead test artifacts
- S11-NANCY: Nancy shows chat type
- S11-LOGIN-ORG: duane.wells starts in Huminic
- S11-CAMPAIGN: Service campaign E2E smoke

### Cross-Tests

```
npx playwright test tests/e2e/s10-launch.spec.ts --grep "S10-SMOKE" --reporter=list
```
Verify smoke tests still pass after fixes.

## Ghost Entry Gate

**Reviewed by:** ghost-agent
**Timestamp:** 2026-03-24T15:30:00Z
**Sprint:** S-11

| Check | Question | Result |
|-------|----------|--------|
| A1 | Sprint ID exists in sprints.json? | PASS — S-11 "Demo Hotfix" found |
| A2 | Status is "planned"? | PASS — status: planned |
| A3 | All dependencies committed? | PASS — S-10: committed |
| A4 | Acceptance criteria listed (12)? | PASS — 12 ACs (S-11.AC1–AC12) |
| A5 | Test file declared? | PASS — s11-demo-hotfix.spec.ts |
| A6 | UI permissions match scope? | PASS — FULL (teambox, service, sales pages modified) |
| A7 | Pre-exec has ## Test Plan? | PASS — 4 phases with priority order |
| A8 | Pre-exec has ## Declared Files? | PASS — 4 modified + 1 new + DB fixes |
| A9 | Cross-tests declared? | PASS — s10-launch S10-SMOKE |
| A10 | No conflicting uncommitted work? | PASS — only prior post-sprint files modified (non-blocking) |

**ENTRY GATE: APPROVED**
