# SNP-001 Pre-Execution Report

## Objective
SNP-001: Sniper Launch — Fix all remaining bugs from Round 2 production evals. Verify all fixes. Validate all critical workflows end-to-end via production eval methodology.

**Sprint:** SNP-001
**Date:** 2026-04-07
**Branch:** sniper-launch

## Scope
- 6 code fixes already applied (uncommitted): VIN sync, recipients 401, activity routing, VAPI names, VAPI cross-org, polling throttle
- 14 non-workflow display/UI bugs (List A)
- 22 workflow component bugs (List B) across 5 groups
- Autonomous and interactive comms testing across VAPI, TextMagic, Tavus, Resend

## Declared Files
- server/auth.ts
- server/storage.ts
- server/sync.ts
- server/vendorProxy.ts
- server/routes/auth.ts
- server/routes/insights.ts
- server/routes/webhooks.ts
- client/src/lib/queryClient.ts
- client/src/contexts/AuthContext.tsx
- client/src/pages/main.tsx
- client/src/pages/insights.tsx
- client/src/pages/sales.tsx
- client/src/pages/service.tsx
- client/src/pages/teambox.tsx
- client/src/components/layout/AppLayout.tsx
- client/src/components/layout/MobileNavDropdown.tsx
- client/src/components/layout/MobileSidebar.tsx
- client/src/components/layout/Sidebar.tsx
- client/src/components/layout/SubMenuManager.tsx
- client/src/components/layout/TopBar.tsx

## UI Changes (per uiPermissions)
- insights.tsx: activity-menu-link (already applied)
- MobileNavDropdown.tsx: activity-path (already applied)
- MobileSidebar.tsx: activity-path (already applied)
- service.tsx: polling-interval (already applied)
- Additional UI changes as needed for List A display fixes

## Acceptance Criteria
- SNP-001.AC1: VIN warehouse sync completes for Serra Honda
- SNP-001.AC2: Campaign recipients endpoint returns 200
- SNP-001.AC3: Activity menu navigates to /insights?tab=activity
- SNP-001.AC4: Channel Intelligence table renders data rows
- SNP-001.AC5: TeamBox test data below 10%
- SNP-001.AC6: VAPI assistant names human-readable
- SNP-001.AC7: /api/vapi/assistants filtered by org
- SNP-001.AC8: Campaign polling throttled to 15s

## Test Plan
- Per-fix targeted verification via Playwright MCP browser navigation
- Per-workflow production eval using 8-question commentary methodology
- Round 3 consolidated eval sweep after all workflows verified
- Cross-workflow data flow validation
- Autonomous comms testing: VAPI Elliott agent for call flows, TextMagic for SMS flows, Resend log verification for emails
- Interactive testing with operator phone numbers and emails for service campaign CSV uploads

## Already Applied (Honest Record)
These 6 fixes were applied BEFORE governance was followed. They are being retroactively documented and will be verified in Step 4:
1. VIN sync: queryCount reads r.totalItems, scheduler filters VIN-enabled orgs — server/sync.ts
2. Campaign recipients: useQuery + recipients table in campaign detail modal — client/src/pages/service.tsx
3. Activity menu routing: /activity → /insights?tab=activity — MobileNavDropdown.tsx, MobileSidebar.tsx
4. VAPI assistant names: agentNameMap lookup from agents table — server/vendorProxy.ts
5. VAPI assistants: cross-org filter applied — server/vendorProxy.ts
6. Campaign polling: 3s → 15s — client/src/pages/service.tsx

## Critical Flows (Operator Priority)
1. **Sales Inbound/Outbound:** VIN lead creation → warehouse sync → Sales Dashboard → TeamBox
2. **Service Campaign Round-Trip:** Create → CSV upload → send → track → response → Service agent → appointment → TeamBox
3. **TeamBox:** All messages with filters, all channels visible
4. **Landing Page Widgets:** Voice, Video (Tavus), Webchat, Form → routing → TeamBox → outbound triggers
5. **Outbound Triggers:** After-hours follow-up (VAPI), 24-hour message for all leads (TextMagic)

## Risk Assessment
- BUG-INT-16 (VAPI phone provisioning) flagged external but operator says phones are wired up — verify first
- VIN sync fix is the biggest cascading dependency — 8 bugs blocked without it
- TeamBox data cleanup needed for meaningful eval (278/294 junk conversations)
- Many data-dependent bugs may self-resolve once warehouse sync works


---

## Ghost Entry Gate

**Date:** 2026-04-07T06:09:27.654154Z
**Verdict:** ENTRY GATE: APPROVED
**Approved by:** Operator
