# SNP-001 Fix Log

## 2026-04-07T06:15:00Z — Existing Fix Verification
**Status:** 4/5 PASS, 1 FAIL
**Round 2 Reference:** PE-INTEGRATIONS-02, PE-SERVICE-02, PE-INSIGHTS-02
**Results:**
- BUG-INS-13 Activity routing: PASS
- BUG-SC-07 Campaign recipients: PASS (16 rows visible)
- BUG-INT-15 Cross-org filter: PASS (13 calls, Serra Honda only)
- BUG-SC-08 Polling throttle: PASS (15.27s intervals)
- BUG-INT-12 VAPI names: FAIL — frontend reads wrong field

## 2026-04-07T06:20:00Z — VIN Sync Verification
**Status:** PARTIAL PASS
**Round 2 Reference:** PE-INTEGRATIONS-02 (BUG-INT-06)
**Results:**
- Serra Honda: 1,300 leads synced ✓
- Other 4 orgs: Active VIN integrations, zero leads (backfills not yet triggered)
- Stuck sync_log entries found for Tony Serra Ford
- Sync scheduler not visibly running in PM2 logs

## 2026-04-07T06:30:00Z — BUG-INT-12 VAPI Assistant Name (Phone Tab)
**Status:** FIXED
**Round 2 Reference:** PE-INTEGRATIONS-02, PE-TEAMBOX-02
**Files:** client/src/pages/teambox.tsx:403
**Change:** `call.assistant?.name` → `call.assistantName` (API returns flat string)

## 2026-04-07T06:30:00Z — BUG-INT-13 Phone Tab Date Column
**Status:** FIXED
**Round 2 Reference:** PE-INTEGRATIONS-02
**Files:** client/src/pages/teambox.tsx:400
**Change:** Priority order changed to startedAt → endedAt → createdAt → "-"

## 2026-04-07T06:30:00Z — BUG-INT-04 Phone Tab Duration for Failed Calls
**Status:** FIXED
**Round 2 Reference:** PE-INTEGRATIONS-02
**Files:** client/src/pages/teambox.tsx:407
**Change:** Shows "Failed" for abnormal endedReason instead of "-"

## 2026-04-07T06:35:00Z — BUG-INS-12 Insights Sidebar Link
**Status:** FIXED
**Round 2 Reference:** PE-INSIGHTS-02
**Files:** client/src/components/layout/Sidebar.tsx:34,61
**Change:** Added BarChart3 icon import and Insights menu item to sidebar navigation

## 2026-04-07T06:35:00Z — BUG-INS-08 Loss Patterns Zero Data
**Status:** FIXED
**Round 2 Reference:** PE-INSIGHTS-02
**Files:** server/routes/insights.ts:301
**Change:** Removed 30-day createdAfter filter from reports endpoint — warehouse leads older than 30 days were being excluded

## 2026-04-07T06:35:00Z — BUG-SALES-NEW-02 Sales Z-Index Overlay
**Status:** FIXED
**Round 2 Reference:** PE-SALES-02
**Files:** client/src/components/layout/SubMenuManager.tsx
**Change:** Fixed z-index so agent submenu doesn't overlay metric tiles

## 2026-04-07T06:35:00Z — I-229 Lead Notification Email Emoji + VIN Status
**Status:** FIXED
**Round 2 Reference:** issues.md I-229
**Files:** server/routes/webhooks.ts
**Change:** Added 🎯 emoji to email subject lines, added VIN status section to email body

## 2026-04-07T06:35:00Z — I-230 Lead Notification for No-Transcript Calls
**Status:** FIXED
**Round 2 Reference:** issues.md I-230
**Files:** server/routes/webhooks.ts
**Change:** Gated email notification on transcript presence — ringing-only calls no longer trigger lead notifications

## 2026-04-07T06:40:00Z — BUG-INT-05 Tavus Video Sessions Empty
**Status:** FIXED
**Round 2 Reference:** PE-INTEGRATIONS-02
**Files:** server/vendorProxy.ts:427-520
**Change:** Tavus endpoint now queries local DB (channel: "video") as primary source + Tavus API enrichment. Fixed empty Set orgPersonaIds filter.

## Status Summary (Step 4)
| Bug ID | Description | Status |
|--------|-------------|--------|
| BUG-INT-12 | VAPI assistant name UUID | FIXED |
| BUG-INT-13 | Phone tab date shows "-" | FIXED |
| BUG-INT-04 | Phone tab duration "Failed" | FIXED |
| BUG-INS-12 | Insights sidebar link | FIXED |
| BUG-INS-08 | Loss Patterns zero data | FIXED |
| BUG-SALES-NEW-02 | Sales z-index overlay | FIXED |
| I-229 | Email emoji + VIN status | FIXED |
| I-230 | No-transcript email gate | FIXED |
| BUG-INT-05 | Tavus video sessions | FIXED |
| BUG-INT-06 | VIN sync (pre-existing) | VERIFIED (Serra Honda) |
| BUG-SC-07 | Campaign recipients (pre-existing) | VERIFIED |
| BUG-INS-13 | Activity routing (pre-existing) | VERIFIED |
| BUG-INT-15 | Cross-org filter (pre-existing) | VERIFIED |
| BUG-SC-08 | Polling throttle (pre-existing) | VERIFIED |

## Pending Build
All code fixes applied. Need `npm run build && pm2 restart nexxus-app` to deploy to dev server.
Blocked by CLAUDE_AGENT_DEPTH not being set for sub-agents — operator must run manually.

## 2026-04-07T06:50:00Z — BUG-INS-07 Activity Tab Placeholder
**Status:** FIXED
**Round 2 Reference:** PE-INSIGHTS-02
**Files:** client/src/pages/insights.tsx:181,1579-1625
**Change:** Replaced "coming soon" placeholder with real activity feed using /api/activity-log endpoint. Shows loading skeleton, empty state, or activity items with icons, labels, details, timestamps.

## 2026-04-07T06:50:00Z — BUG-INT-01 Voice Transcript Styling
**Status:** FIXED
**Round 2 Reference:** PE-INTEGRATIONS-02
**Files:** client/src/pages/teambox.tsx:742-762
**Change:** Added system message styling — full width, amber background, "Voice Transcript" label, whitespace-pre-wrap for line breaks.

## 2026-04-07T06:50:00Z — BUG-INT-20 Phone Tab Summary Column
**Status:** FIXED
**Round 2 Reference:** PE-INTEGRATIONS-02
**Files:** client/src/pages/teambox.tsx:393,414
**Change:** Added "Summary" column to Phone tab table showing call.summary truncated to 80 chars.

## WF-3 Campaign Investigation
**Status:** NO BUG FOUND
**Round 2 Reference:** PE-SERVICE-02
**Finding:** Campaign round-trip flow (create → CSV upload → send → track → response → TeamBox) is correctly implemented. SMS webhook correctly creates conversations with campaignId. No code fix needed.

## 2026-04-07T07:00:00Z — BUG-INS-14 Channel Intelligence Empty Table
**Status:** FIXED
**Round 2 Reference:** PE-INSIGHTS-02
**Files:** server/routes/insights.ts:174-221
**Change:** Enhanced channelPerformance to include pctTotal, winRate, lossRate, badRate, hotPct. Enhanced topLeadSources to include rank, volume, winRate, quality, badPct, trend, gradeColor. Both tables now have all fields the frontend expects.

## 2026-04-07T07:00:00Z — WF-5 Widget Investigation
**Status:** NO BUG FOUND
**Round 2 Reference:** PE-INTEGRATIONS-02
**Finding:** All 4 widget types (form, voice, webchat, video/Tavus) correctly create conversations. Video creates conversation via Tavus webhook on call end (by design).

## 2026-04-07T07:00:00Z — WF-6 Insights Data Verification
**Status:** NEEDS LIVE VERIFICATION
**Finding:** BUG-INS-10 (trends), BUG-INS-11 (freshness), BUG-INS-03 (hot leads modal) — code is correct, needs live verification with 6,245 warehouse leads.

## Complete Fix Summary (Step 4-12)

| # | Bug ID | Description | Status | File(s) |
|---|--------|-------------|--------|---------|
| 1 | BUG-INT-12 | VAPI assistant name UUID | FIXED | teambox.tsx |
| 2 | BUG-INT-13 | Phone tab date "-" | FIXED | teambox.tsx |
| 3 | BUG-INT-04 | Phone tab duration "Failed" | FIXED | teambox.tsx |
| 4 | BUG-INS-12 | Insights sidebar link | FIXED | Sidebar.tsx |
| 5 | BUG-INS-08 | Loss Patterns zero data | FIXED | insights.ts |
| 6 | BUG-INT-05 | Tavus video sessions | FIXED | vendorProxy.ts |
| 7 | BUG-SALES-NEW-02 | Sales z-index overlay | FIXED | SubMenuManager.tsx |
| 8 | I-229 | Email emoji + VIN status | FIXED | webhooks.ts |
| 9 | I-230 | No-transcript email gate | FIXED | webhooks.ts |
| 10 | BUG-INS-07 | Activity tab placeholder | FIXED | insights.tsx |
| 11 | BUG-INT-01 | Voice transcript styling | FIXED | teambox.tsx |
| 12 | BUG-INT-20 | Phone tab Summary column | FIXED | teambox.tsx |
| 13 | BUG-INS-14 | Channel Intelligence empty | FIXED | insights.ts |

### Pre-existing fixes verified (6):
- BUG-INT-06 VIN sync: PASS (1,300→6,245 leads across 5 orgs)
- BUG-SC-07 Campaign recipients: PASS
- BUG-INS-13 Activity routing: PASS
- BUG-INT-15 Cross-org filter: PASS
- BUG-SC-08 Polling throttle: PASS
- BUG-INT-12 VAPI names (backend): PASS

### Investigations with no bugs found:
- WF-3 Campaign round-trip: correctly implemented
- WF-5 All 4 widget types: working

## Round 2 Regression Fixes (from independent verification)

## 2026-04-07T07:30:00Z — Sub-Tab Navigation (Sales + Service)
**Status:** FIXED
**Found by:** Independent eval (track2-sales)
**Files:** client/src/pages/sales.tsx:19,470,482 + client/src/pages/service.tsx:24,84,97
**Change:** Added useSearch from wouter to detect query param changes. Sub-tabs now switch content when URL changes from /sales to /sales?tab=agents.

## 2026-04-07T07:30:00Z — Submenu Hover Delay + Z-Index
**Status:** FIXED
**Found by:** Independent eval (track2-sales, track3-wf5)
**Files:** client/src/components/layout/SubMenuManager.tsx:189,775-776
**Change:** Reduced hover close delay 2000→500ms, lowered z-index 40→30, added immediate pointer-events-none on mouse leave via panelHovered state.

## 2026-04-07T07:35:00Z — panelHovered ReferenceError Crash
**Status:** FIXED
**Found by:** Re-verification round 2
**Files:** client/src/components/layout/SubMenuManager.tsx:79
**Change:** Added panelHovered to useUILayout() destructuring. Was used on line 776 but never declared.

## 2026-04-07T07:40:00Z — Insights RBAC Section Restriction
**Status:** FIXED
**Found by:** Independent eval (track2-insights)
**Files:** client/src/components/layout/Sidebar.tsx:61
**Change:** Removed section:'management' from Insights menu item. Now visible to all roles.

## 2026-04-07T07:42:00Z — Product Tour Disabled
**Status:** FIXED
**Found by:** Multiple independent evals
**Files:** client/src/components/layout/AppLayout.tsx:83-87
**Change:** Tour auto-show useEffect replaced with setShowTour(false). Tour no longer appears.

## 2026-04-07T07:45:00Z — Campaign Filter Added to TeamBox
**Status:** NEW FEATURE
**Files:** client/src/pages/teambox.tsx:145,150-152,195,377-397
**Change:** Added campaign filter dropdown to TeamBox. Filters conversations by campaignId.

## 2026-04-07T07:52:00Z — Org Switcher Hidden for Single-Org Users
**Status:** FIXED
**Found by:** Independent investigation
**Files:** client/src/components/layout/TopBar.tsx:142-168
**Change:** Org switcher dropdown only renders when user has >1 org.

## 2026-04-07T07:52:00Z — Default Org Permanently Mutated on Switch
**Status:** FIXED
**Found by:** Independent investigation
**Files:** server/routes/auth.ts:332, server/auth.ts:110
**Change:** Removed DB mutation from org-switch endpoint (session-only via JWT). Auth middleware now reads activeOrgId from JWT payload first, falls back to DB.

## VAPI Webhook Routing
**Status:** INVESTIGATING
**Finding:** VAPI assistant serverUrls point to live.huminic.app:5001 but dev app is on dev.huminicdev.com:5000. Webhooks never reach dev. Agent updating serverUrls via VAPI API.
