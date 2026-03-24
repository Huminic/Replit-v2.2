# S-11 Post-Sprint Report — Demo Hotfix

## AC Results

| ID | Criterion | Result | Evidence |
|----|-----------|--------|----------|
| S-11.AC1 | TeamBox popout links navigate and filter | PASS | ?channel= and ?tab= URL params read on mount; channel filter chips in top bar |
| S-11.AC2 | Chat history bubbles render | PASS | Messages already rendered correctly — verified in code review |
| S-11.AC3 | Take Over button appears and works | PASS | Already functional at line 862-875 — verified in code review |
| S-11.AC4 | Phone tab with transcript modal | PASS | Transcript button opens Dialog modal with full text + audio link |
| S-11.AC5 | Tavus video tab scoped to org | PASS | vendorProxy.ts filters by org persona IDs |
| S-11.AC6 | Pipeline Show Contact shows info | PASS | SalesContactDetailView already renders name/phone/email correctly |
| S-11.AC7 | No VIN Lead test artifacts | PASS | 30 VIN Lead test tasks deleted from DB |
| S-11.AC8 | Nancy shows as chat | PASS | channels updated to ['voice','sms','chat'] — no video |
| S-11.AC9 | duane.wells starts in Huminic | PASS | organization_id updated — verified login returns Huminic |
| S-11.AC10 | Channel filter buttons in top bar | PASS | channelFilters chips added below tab row |
| S-11.AC11 | Reply uses real user name | PASS | senderName changed from 'Agent' to currentUser.name |
| S-11.AC12 | Campaign E2E | DEFERRED | Requires real SMS send (IRREVERSIBLE) — owner approval needed |

## Fixes Applied

**DB (no code change):**
- BUG #8: Deleted 30 VIN Lead test tasks from DB
- BUG #11: Updated duane.wells org to Huminic (0915f4a9)
- BUG #10: Updated Nancy channels to ['voice','sms','chat']

**client/src/pages/teambox.tsx:**
- BUG #11: Reply sender name uses currentUser.name instead of hardcoded 'Agent'
- BUG #4/#5: Transcript modal (Dialog) with full text + audio recording link
- BUG #12: Channel filter chip buttons in top bar (visible in conversations view)
- BUG #1: URL param reading for ?channel= and ?tab= (from S-10 fix, verified)

**client/src/components/layout/SubMenuManager.tsx:**
- ROI nav item removed (from owner walkthrough, pre-S-11)
- Profile billing removed (from owner walkthrough, pre-S-11)

**server/vendorProxy.ts:**
- BUG #6: Tavus conversations filtered by org's agent persona IDs

## Build
npm run build: SUCCESS
pm2 restart nexxus-app: ONLINE
