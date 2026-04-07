# SNP-001 Bug Categorization

**Date:** 2026-04-07
**Source:** Round 2 Production Evals (PE-*-02) + Round 1 Bug Logs (PE-INTEGRATIONS-01, PE-SERVICE-CAMPAIGNS-01) + issues.md
**Purpose:** Categorize all known bugs for sniper launch sprint

## Summary
- Total bugs catalogued: 42
- List A (non-workflow): 14
- List B (workflow): 22
- Already fixed (uncommitted): 6
- Out of scope / backlog: 12

## Already Applied Fixes (Uncommitted)
These 6 fixes were applied before SNP-001 governance. Need verification only:
1. **VIN sync:** queryCount reads `r.totalItems`, scheduler filters VIN-enabled orgs (BUG-INT-06) — `server/sync.ts`
2. **Campaign recipients:** useQuery + recipients table in campaign detail modal (BUG-SC-07) — `client/src/pages/service.tsx`
3. **Activity menu routing:** `/activity` changed to `/insights?tab=activity` in 3 files (BUG-INS-13) — `client/src/components/layout/MobileNavDropdown.tsx`, `client/src/components/layout/MobileSidebar.tsx`
4. **VAPI assistant names:** agentNameMap lookup from agents table (BUG-INT-12) — `server/vendorProxy.ts`
5. **VAPI assistants:** cross-org filter applied (BUG-INT-15) — `server/vendorProxy.ts`
6. **Campaign polling:** 3s changed to 15s (BUG-SC-08) — `client/src/pages/service.tsx`

---

## List A — Non-Workflow Bugs
Standalone display/UI/data issues that don't involve cross-component flows.

| # | Bug ID | Type | Description | File(s) Affected | How to Verify | Round 2 Source |
|---|--------|------|-------------|-------------------|---------------|----------------|
| A1 | BUG-INS-12 | CODE FIX | No sidebar navigation link to Insights page | `client/src/components/layout/Sidebar.tsx` (or equivalent nav component) | Check sidebar for Insights link after login | PE-INSIGHTS-02 |
| A2 | BUG-INS-08 | CODE FIX | Loss Patterns by Source table renders headers but zero data rows | `server/vendorProxy.ts` (metrics endpoint), `client/src/pages/insights.tsx` | Navigate to Insights > Reports > Loss & Quality, verify Loss Patterns table has rows | PE-INSIGHTS-02 |
| A3 | BUG-INS-15 | DATA-DEPENDENT | Loss Reason Breakdown and Bad Lead Breakdown charts render empty | `client/src/pages/insights.tsx` | Re-test with dealer that has warehouse data (chart shows "December 2025, 128 Losses" header but no visual data) | PE-INSIGHTS-02 |
| A4 | BUG-INS-14 | DATA-DEPENDENT | Channel Intelligence table body empty despite header showing "637 Total Leads" | `client/src/pages/insights.tsx` | Re-test with populated warehouse; verify per-channel breakdown rows appear | PE-INSIGHTS-02 |
| A5 | BUG-INT-13 | CODE FIX | VAPI Phone tab Date column shows "-" for all entries | `client/src/pages/teambox.tsx` (Phone tab date rendering) | Check TeamBox > Phone tab, verify dates display for VAPI call entries | PE-INTEGRATIONS-02 |
| A6 | BUG-INT-14 | CODE FIX | VAPI Phone tab Duration shows "-" for failed calls instead of "Failed" or "N/A" | `client/src/pages/teambox.tsx` (Phone tab duration rendering) | Check TeamBox > Phone tab, verify failed calls show "Failed" instead of "-" | PE-INTEGRATIONS-02 |
| A7 | BUG-TB-03 | CODE FIX | Channel icons on conversation list items have no text labels or aria-labels | `client/src/pages/teambox.tsx` (conversation list item component) | Inspect conversation list items for channel labels/accessibility | PE-TEAMBOX-02 |
| A8 | BUG-TB-10 | DATA CLEANUP | 278/294 (94.6%) TeamBox conversations are test/junk data | Database: `conversations` table | Run cleanup SQL to remove Test Customer, RateTest-*, Reset-*, NoPhone-* entries | PE-TEAMBOX-02 |
| A9 | BUG-SET-01 | CODE FIX | Billing tile missing from Settings grid (Low — no remediation scoped) | `client/src/pages/settings.tsx` | Check Settings page for Billing tile | PE-SETTINGS-02 |
| A10 | BUG-SALES-NEW-02 | CODE FIX | Agent submenu panel overlays metric tiles, blocking click interactions | `client/src/pages/sales.tsx` (z-index/layout issue) | Click Sales tiles while agent sidebar is open | PE-SALES-02 |
| A11 | BUG-SALES-NEW-03 | DATA-DEPENDENT | Open Escalations count is 249 — unusually high, may be stale | `server/vendorProxy.ts` (escalation count query) | Verify whether 249 escalations are legitimate or test artifacts | PE-SALES-02 |
| A12 | BUG-INS-10 | DATA-DEPENDENT | Trend & Forecast charts render structure but show zero data | `client/src/pages/insights.tsx` | Re-test with dealer that has multi-period warehouse data | PE-INSIGHTS-02 |
| A13 | BUG-INS-11 | DATA-DEPENDENT | Freshness Score shows N/A (correct for 0 data, verify with real data) | `client/src/pages/insights.tsx` | Re-test with active leads; verify score computes | PE-INSIGHTS-02 |
| A14 | I-229 | CODE FIX | Lead notification email subject missing emoji + missing VIN status section | `server/routes/webhooks.ts` (lines ~914, ~1201) | Trigger VAPI call, check email subject for emoji and VIN status row | issues.md |

---

## List B — Workflow Component Bugs

### WF-1: VAPI/VIN (call -> transcript -> lead -> VIN sync -> warehouse)

| # | Bug ID | Type | Component | File(s) Affected | How to Verify | Round 2 Source |
|---|--------|------|-----------|-------------------|---------------|----------------|
| B1 | BUG-INT-16 | EXTERNAL DEP | All 15 VAPI calls fail with call.start.error-get-phone-number | VAPI dashboard config (external) | Check VAPI dashboard for Serra Honda assistant phone number config | PE-INTEGRATIONS-02 |
| B2 | BUG-INT-01 | BLOCKED BY B1 | Voice transcripts not rendered in Conversation thread view | `client/src/pages/teambox.tsx` (voice conversation message rendering) | After successful VAPI call, check conversation thread for transcript messages | PE-INTEGRATIONS-02 |
| B3 | BUG-INT-06 | CODE FIX (uncommitted) | VIN warehouse sync broken — backfill fails "VIN integration not found" | `server/sync.ts`, `server/vendorProxy.ts` | Run warehouse backfill for Serra Honda; check for successful sync | PE-INTEGRATIONS-02 |
| B4 | BUG-INT-07 | BLOCKED BY B1+B3 | VIN lead creation failing on live VAPI calls | `server/routes/webhooks.ts` (VAPI->VIN pipeline) | Trigger successful VAPI call, verify VIN lead created | PE-INTEGRATIONS-02 |
| B5 | BUG-INT-09 | DATA-DEPENDENT | Sales trend percentages all show 0% (may be correct with 0 data) | `server/vendorProxy.ts` (pctChange computation) | Re-test after warehouse sync populates data | PE-INTEGRATIONS-02 |
| B6 | BUG-INT-08 | DATA-DEPENDENT | Active Pipeline leads missing contact names (0 records currently) | `server/vendorProxy.ts` (resolveLeadData) | Re-test after warehouse sync; verify names populate | PE-INTEGRATIONS-02 |
| B7 | BUG-SALES-07 | DATA-DEPENDENT | Warehouse syncedAt: null — Sales Dashboard functionally empty | `server/sync.ts` | After sync fix, verify syncedAt timestamp updates | PE-SALES-02 |
| B8 | I-230 | CODE FIX | Lead notification fires for ringing-only (no-transcript) calls | `server/routes/webhooks.ts` (~line 910) | Trigger ringing-only call, verify no email sent | issues.md |
| B9 | BUG-INS-01/02/03 | DATA-DEPENDENT | Hot Leads modal: 0 records prevents verifying name/phone/vehicle rendering | `client/src/pages/insights.tsx` | Re-test with populated warehouse; verify Customer, Phone, Vehicle columns | PE-INSIGHTS-02 |

### WF-3: Campaigns (create -> send -> track -> recipients -> TeamBox thread)

| # | Bug ID | Type | Component | File(s) Affected | How to Verify | Round 2 Source |
|---|--------|------|-----------|-------------------|---------------|----------------|
| B10 | BUG-SC-07 | CODE FIX (uncommitted) | Campaign recipients endpoint returns 401 despite valid session | `server/routes/campaigns.ts` (~line 504), `client/src/pages/service.tsx` | Open campaign detail modal, verify recipients table loads | PE-SERVICE-02 |
| B11 | BUG-SC-01 | FEATURE GAP | No campaign filter in TeamBox | `client/src/pages/teambox.tsx` (filter panel) | Check TeamBox for campaign filter option | PE-SERVICE-02 |
| B12 | BUG-SC-02 | FEATURE GAP | Campaign conversations not visually distinguishable in TeamBox | `client/src/pages/teambox.tsx` (conversation list rendering) | Check conversation list for campaign badges/tags | PE-SERVICE-02 |
| B13 | BUG-SC-05 | FEATURE GAP | No campaign list pagination or search (Low — only 2 campaigns now) | `client/src/pages/service.tsx` | Check Service > Campaigns for pagination/search controls | PE-SERVICE-02 |
| B14 | BUG-SC-06 | FEATURE GAP | No trigger/automation configuration UI for campaigns | `client/src/pages/service.tsx` | Check Service page for campaign trigger config | PE-SERVICE-02 |

### WF-5: Widgets (voice/video/chat/form -> routing -> TeamBox)

| # | Bug ID | Type | Component | File(s) Affected | How to Verify | Round 2 Source |
|---|--------|------|-----------|-------------------|---------------|----------------|
| B15 | BUG-INT-05 | CODE FIX | Tavus Video Sessions tab empty despite webhooks received | `server/routes/tavus.ts` or equivalent, `client/src/pages/teambox.tsx` (Video tab) | Check TeamBox > Video tab after Tavus webhook fires; API returns empty [] | PE-INTEGRATIONS-02 |

### WF-6: Insights (data-dependent metrics, drill-downs, channel intel)

| # | Bug ID | Type | Component | File(s) Affected | How to Verify | Round 2 Source |
|---|--------|------|-----------|-------------------|---------------|----------------|
| B16 | BUG-INS-13 | CODE FIX (uncommitted) | Activity menu item routes to /activity (404) instead of /insights?tab=activity | `client/src/components/layout/MobileNavDropdown.tsx`, `client/src/components/layout/MobileSidebar.tsx`, plus desktop menu component | Click Activity in menu dropdown, verify URL is /insights?tab=activity | PE-INSIGHTS-02 |
| B17 | BUG-INS-07 | PARTIALLY FIXED | Activity tab content is placeholder only ("coming soon") | `client/src/pages/insights.tsx` | Navigate to /insights?tab=activity, check for real content | PE-INSIGHTS-02 |

### Cross-Workflow: VAPI Data Quality

| # | Bug ID | Type | Component | File(s) Affected | How to Verify | Round 2 Source |
|---|--------|------|-----------|-------------------|---------------|----------------|
| B18 | BUG-INT-02 | CODE FIX (uncommitted) | /api/vapi/assistants returns all 19 orgs' assistants (cross-org leak) | `server/vendorProxy.ts` (assistants endpoint) | Login as Serra Honda, call /api/vapi/assistants, verify only Serra Honda assistants returned | PE-INTEGRATIONS-02 |
| B19 | BUG-INT-12 | CODE FIX (uncommitted) | VAPI Phone tab shows raw assistant UUID instead of name | `server/vendorProxy.ts` or `client/src/pages/teambox.tsx` | Check TeamBox > Phone tab, verify "Caroline - Serra Honda" instead of UUID | PE-INTEGRATIONS-02 |
| B20 | BUG-INT-04 | CODE FIX | VAPI call entries have null duration/analysis and no displayed date | `client/src/pages/teambox.tsx` (Phone tab rendering) | Check TeamBox > Phone tab for date and duration values | PE-INTEGRATIONS-02 |
| B21 | BUG-INT-10 | DATA CLEANUP | 73% of TeamBox data is test artifacts (216/294 entries) | Database: `conversations` table | Run cleanup SQL to remove test entries | PE-INTEGRATIONS-02 |
| B22 | BUG-TB-08 | CODE FIX (uncommitted) | VAPI call logs show raw UUIDs for assistant names (same as BUG-INT-12) | `server/vendorProxy.ts` | Same verification as B19 | PE-TEAMBOX-02 |

---

## Out of Scope (backlog or external dependency items)

### External Dependencies (cannot fix within nexxus project)
| Bug ID | Description | Why Out of Scope |
|--------|-------------|-----------------|
| BUG-INT-16 | VAPI calls failing with call.start.error-get-phone-number | VAPI dashboard phone number provisioning — external config |
| I-240 (issues.md) | VIN lead creation MCP connectivity — vin-safe-mcp provisioning | External dependency per filesystem boundary rules |

### Feature Gaps / Backlog Items (not broken functionality)
| Bug ID | Description | Why Backlogged |
|--------|-------------|---------------|
| BUG-TB-04 | No "Take Over" button for human takeover workflow | Deferred feature — not in remediation scope |
| BUG-TB-07 | No service campaign filter in TeamBox | Deferred feature — not in remediation scope |
| BUG-SC-01 | No campaign filter in TeamBox | Feature gap, not a bug |
| BUG-SC-02 | Campaign conversations not visually distinguishable | Feature gap, not a bug |
| BUG-SC-05 | No campaign list pagination or search | Feature gap, moot with 2 campaigns |
| BUG-SC-06 | No trigger/automation configuration UI | Feature gap, not a bug |
| BUG-SET-01 | Billing tile missing from Settings | Low priority, no remediation scoped (FlexPrice dead per I-105) |
| BUG-SALES-06 | No VAPI metric tile on Sales Dashboard | Feature gap, not in remediation scope |
| I-174 | "Send to CRM" button from TeamBox conversations | Backlogged (BL-092) |
| I-130 | Agent pages need favorites and sub-menu bar | Backlogged (BL-094) |

### Test-Only Issues (test selectors/assertions, not product bugs)
| Issue ID | Description | Why Test-Only |
|----------|-------------|---------------|
| I-183 | Campaign reply webhook timing issue in test | Test retry window too short |
| I-195 | SMS webhook response shape mismatch in test | Test asserts wrong field |
| I-184 | Management page tests expect wrong RBAC level | Test needs update for S9 change |
| I-185 | "Restart Tour" button selector mismatch | Test locator wrong |
| I-186 | Appointment schema field name mismatch in test | Test expects wrong field |
| I-196 | 2 orphan test files not matched by any Playwright project | Cleanup task |
| I-198 | Dead test helpers with zero imports | Cleanup task |
| I-233 | Widget public endpoint test fails on staging — no test data seeded | Test data issue |

### Infrastructure / Ops Issues (not product code bugs)
| Issue ID | Description | Status |
|----------|-------------|--------|
| I-235 | User creation emails bypass OUTBOUND_LIVE_ENABLED | OPEN — security fix |
| I-236 | Webhook secrets optional (accept all if not set) | OPEN — security fix |
| I-237 | Hardcoded password123 fallback in seed.ts | OPEN — security fix |
| I-238 | Legacy req.body.refreshToken fallback | OPEN — security fix |
| I-239 | Resend rate limit exhausted (483 failed emails) | OPEN — ops issue |
| I-241 | Test traffic hitting production webhooks | OPEN — ops issue |
| I-242 | 22 dead files removable | OPEN — cleanup |

---

## Classification Summary

| Category | Count | Action |
|----------|-------|--------|
| CODE FIX needed | 12 | Fix in SNP-001 |
| CODE FIX (already uncommitted) | 6 | Verify only |
| DATA-DEPENDENT (may resolve with warehouse data) | 8 | Re-test after warehouse sync |
| DATA CLEANUP needed | 2 | SQL cleanup of test artifacts |
| FEATURE GAP (backlog) | 6 | Not blocking launch |
| EXTERNAL DEPENDENCY | 2 | Cannot fix in project |
| TEST-ONLY | 8 | Not product bugs |
| INFRASTRUCTURE/OPS | 7 | Separate sprint |

### Priority Order for CODE FIXES
1. **BUG-INT-05** — Tavus Video Sessions empty (High, workflow-blocking)
2. **BUG-INS-08** — Loss Patterns table empty (High, visible data gap)
3. **BUG-INS-12** — No sidebar link to Insights (Medium, navigation gap)
4. **BUG-INT-13/14** — VAPI Phone tab date/duration display (Low-Medium)
5. **BUG-TB-03** — Channel icon accessibility labels (Low)
6. **BUG-SALES-NEW-02** — Agent submenu z-index overlay (Low-Medium)
7. **I-229** — Lead notification email subject + VIN status (Medium)
8. **I-230** — Gate lead notification on transcript presence (Medium)
9. **BUG-INT-04/20** — VAPI null duration/analysis display cleanup (Low)
10. **BUG-INS-07** — Activity tab placeholder content (Low — acceptable for launch)
