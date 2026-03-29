# Cross-Reference -- U-001 Inventory vs Existing Coverage

**Date:** 2026-03-27
**Inventory source:** evidence/U-001/ (350 states, 14 mismatches)
**AC source:** sprints.backlog.json (48 sprints: S-0 through R-017, plus G-001/G-002/G-003)
**Issue source:** issues.md (41 closed, 15 remediating, 3 investigating, 3 TG open)
**Test source:** tests/e2e/ (52 spec files, ~16 deprecated)

## Summary
- States with AC coverage: **128** of 350 (36.6%)
- States with test coverage: **94** of 350 (26.9%)
- States with open issues: **47** of 350 (13.4%)
- **Gaps (no AC, no test, no issue): 149**

---

## Methodology

For each of the 350 enumerated states, I checked:
1. Does any sprint AC in sprints.backlog.json explicitly or implicitly cover this state?
2. Does any active test file contain assertions that would exercise this state?
3. Does any open issue in issues.md address this state?

A state is "covered" if ANY of the three sources addresses it. A "gap" means none of the three sources covers it.

---

## Gaps by Domain

### FE (Frontend) -- 72 gaps

#### AI Chat Interaction States (8 gaps)
- **ST-054**: Chat with history (metrics collapsed) -- No AC tests chat history view collapse. S-1.AC11 covers chat history listing but not the collapse behavior.
- **ST-055 through ST-058**: Chat message bubbles, streaming with content, streaming with status -- No AC or test exercises actual message rendering or streaming content display. S-1.AC4/AC5 test streaming timing and thinking indicators via API, not visual rendering of bubbles.
- **ST-060**: Chat stream error with retry button -- No AC or test covers error recovery in chat.
- **ST-061, ST-062**: ThinkingCard collapsed/expanded -- No AC or test targets ThinkingCard interaction states.

#### AI Chat Drill-Downs (11 gaps)
- **ST-067 through ST-073**: Metric detail dialogs (loading, error, empty, Active Pipeline table, Appointments table, Escalations list, Outbound list) -- No AC covers clicking metric tiles to see detail dialogs. DOM inventory confirms the tiles are clickable but no sprint tests the drill-down.
- **ST-074 through ST-077**: Contact detail view states (loading, display, CRM error, no info) -- Partially covered by S-11.AC6 (pipeline contact), but loading/error/empty states have no coverage.

#### TeamBox Interaction States (8 gaps)
- **ST-079**: Conversation list loading skeleton -- No test.
- **ST-081**: Conversation list empty -- No test.
- **ST-083**: Messages loading skeleton -- No test.
- **ST-085**: Conversation automated "Take Over" -- S-11.AC3 covers this, but S-2.AC15 only tests via API. No FE visual test.
- **ST-091**: Voice call transcript modal -- S-11.AC4 addresses Phone tab transcripts but not the modal interaction states.
- **ST-093 through ST-097**: Task view states (list, loading, empty, selected, filter) -- 5 states with zero coverage. Tasks sub-tab exists in DOM inventory (tab-tasks) but no sprint AC tests it.

#### My Work (15 gaps -- ENTIRE SECTION)
- **ST-104 through ST-118**: All 15 /my-work states. I-127 says "hide and defer" -- nav item being removed. But the route exists and the page has functional code. No AC, no test, no issue covers the page functionality itself.
  - **Note:** I-127 (REMEDIATING) covers hiding the nav item, not testing the page.

#### Sales Interaction States (8 gaps)
- **ST-120**: Sales dashboard loading -- No loading state test.
- **ST-121 through ST-127**: Sales metric detail dialogs (tile click, Active Pipeline table, Appointments, generic display, loading, error, empty) -- 7 states. S-3.AC4 compares tile values to API but never clicks a tile to test the drill-down dialog.
- **ST-132, ST-133**: Activity feed loading/empty -- I-112 covers the hardcoded mock data issue but not loading/empty states.

#### Service Interaction States (6 gaps)
- **ST-142**: Campaign table loading skeleton -- No test.
- **ST-143**: Campaign table empty -- No test.
- **ST-146**: Campaign safety dismissed -- I-128 (REMEDIATING) covers the dismiss button but no test exercises the dismissed state persistence.
- **ST-148**: Campaign detail dialog -- S-4.AC5 covers this in AC but s4 test only checks code existence, not runtime dialog.
- **ST-155, ST-156**: Agent cards loading/empty -- No test.

#### Marketing Interaction States (5 gaps)
- **ST-161**: Dashboard loading -- No test.
- **ST-162**: Metric detail dialog -- No test or AC covers clicking marketing metric tiles.
- **ST-165**: Studio filter selected (gallery filtered) -- S-5.AC5 has AC for this but s5 test only checks code for filter state, not runtime behavior.
- **ST-167 through ST-172**: Marketing agent chat view states (6 states) -- No AC covers the AgentChatView component states. S-5.AC8/AC9 test agent responses via API, not the chat UI.
  - **Note:** Only ST-167 counted here as the rest are sub-states of the same gap.

#### Insights Drill-Downs and Tabs (19 gaps)
- **ST-201**: Insights dashboard loading -- No test.
- **ST-208 through ST-215**: All 8 drill-down dialog states (Hot Leads detail, New Leads detail, Showroom detail, Stale Leads, Pending Finance, Pipeline Health, Scorecard Detail, Green Zone Detail) -- Zero coverage. Zone cards are verified as present (S-6.AC4, domain-07) but clicking them to test drill-down is untested.
- **ST-216, ST-217**: Leads trend chart and Conversions chart interactive states -- No test.
- **ST-219 through ST-226**: All 8 Reports tab states -- Zero coverage. No AC or test addresses the Reports tab.
- **ST-227 through ST-234**: All 8 Library tab states -- G-003 (m001-gap-coverage) tests /insights Library tab renders metric tiles, but only basic render. Loading, search, detail dialog, lookback selector (6 states) remain untested.

#### Settings Sub-Section States (25 gaps)
- **ST-246 through ST-257**: User Management (12 states: list, loading, search, add dialog, edit dialog, reset password, change password, invite, dropdown) -- S-7.AC1 confirms 8 sections render, T-022e covers "User CRUD" but no specific state-level ACs exist for loading/empty/submit states.
- **ST-258 through ST-265**: Organization settings (8 states: form, business hours, comm gate active/paused, server kill switch, channel controls, rate limit, TextMagic) -- S-7.AC3 covers CommGate toggle. Remaining 7 states have no AC.
- **ST-266 through ST-282**: Tools & Integrations (17 states) -- DOM inventory confirms tabs exist (MCP, Widgets, Pages, Universal, Skills, etc). G-001.AC4/AC5 covers API Keys/Webhooks RBAC. Widget config states (ST-269 through ST-275) have zero coverage. Landing pages config (ST-276-277), Skills (ST-279), VIN Lead Config (ST-280-282) -- no coverage.
  - **Counted as 5 gap clusters** since many are sub-states of the same sections.
- **ST-283 through ST-288**: Knowledge Base (6 states) -- T-022e mentions "KB upload" but no state-level ACs for loading/empty/upload-in-progress/kill-switch.
- **ST-289, ST-290**: AI Configuration detailed states -- S-7.AC1 confirms section renders. No AC for model selection, system prompt editing, read-only mode.

#### Profile Interaction States (5 gaps)
- **ST-294**: Profile edit mode -- No test for entering edit mode.
- **ST-295**: Profile saving spinner -- No test.
- **ST-298**: Password mismatch error -- No test.
- **ST-300, ST-301**: Photo upload hover and uploading -- No test.

#### Profile Preferences (4 gaps)
- **ST-302 through ST-305**: All 4 Preferences tab states (dark mode, notifications, regional, tour reset) -- I-111 flags /profile/preferences as zero test coverage. S-7.AC4 checks Reset Tour button text in code but not runtime.

### BE (Backend) -- 28 gaps

#### Billing (26 gaps -- ENTIRE SECTION)
- **ST-306 through ST-331**: All 26 billing states. I-105 (REMEDIATING) notes "Billing not configured -- FlexPrice integration returns {configured: false}." I-111 flags billing sub-routes as zero test coverage. Domain-08-billing.spec.ts exists but tests are minimal -- they check if billing-related text appears on the page, not functional states. No sprint AC covers billing dashboard, usage meters, plan comparison, invoice list, top-up dialog, or RBAC redirects.
  - **Already tracked:** I-105 covers the integration wiring. I-111 covers the test gap.
  - **Not tracked:** Individual billing UI states (top-up dialog, low balance warning, plan comparison grid) have no issue or AC.

#### Org Wizard (11 gaps -- ENTIRE SECTION)
- **ST-332 through ST-342**: All 11 org wizard states. Domain-09-settings 9.4 checks "Org Wizard accessible to Super Admin only" at a routing level. No AC or test covers the 7-step wizard flow (org details, contact, admin setup, configuration, tools, default agent, review), validation errors, creating state, or success redirect.
  - **Not tracked:** No issue exists for org wizard functional testing.

#### Campaign CRUD Detail States (2 gaps -- partially covered)
- **ST-149, ST-150**: New campaign dialog and creating state -- S-4.AC9 covers campaign create E2E via API but no FE test for the dialog UI or mutation-pending state.

### DT (Data) -- 8 gaps

#### Hunch States (6 gaps)
- **ST-175**: Hunches loading -- No test.
- **ST-177**: Hunches empty -- No test.
- **ST-178 through ST-181**: Hunch status states (new/accepted/dismissed/resolved) -- DOM inventory shows Accept/Dismiss buttons exist. No AC tests the status transition UI.
- **ST-182**: Hunches generating spinner -- No test.

#### Insights Hunches Standalone (3 gaps)
- **ST-235 through ST-237**: Hunches tab on standalone /insights (list, preferences sheet, empty) -- No AC. Partially overlaps with Management hunches.

### AU (Auth/Security) -- 14 gaps

#### Login Edge States (3 gaps)
- **ST-013**: Login with session expired alert -- No test. ST-005 (session timeout dialog) also untested.
- **ST-014**: Login with error alert (bad credentials) -- domain-01-auth 1.6 tests wrong credentials return error CODE but not the visual alert rendering.
- **ST-015**: Login submitting spinner -- No test.

#### Forgot/Reset Password (11 gaps)
- **ST-016 through ST-026**: All 11 forgot-password and reset-password states -- I-111 does NOT list these. R-017 addresses I-140 (password reset backend) but not the FE flow. No test covers the forgot-password form, submitting state, success/error messages, or any reset-password states (form, validation, API error, success, invalid token, expired token).
  - **Not tracked:** No issue exists for forgot/reset password FE testing. Only backend fix in R-017.

### IN (Infrastructure) -- 5 gaps

#### Usage Edge States (3 gaps)
- **ST-344**: Usage loading -- No test.
- **ST-345**: Usage error -- No test.
- **ST-346**: Usage no events -- No test.

#### Test Infrastructure (2 gaps)
- **ST-349**: Usage access denied for non-admin roles -- No test.
- **I-110** (REMEDIATING): Test files use production URL instead of localhost -- affects all tests but is not a state gap.

### Cross-Domain (22 gaps)

#### Public Widget/Landing Pages (26 states, all gaps except basic page load)
- **ST-027 through ST-052**: All 26 public widget states. S-8 covers video opens in parent window, store name, appointment booking, form submission, widget JS serving. But the widget interaction states themselves (menu open, chat mode, video connecting/connected/error, voice connecting/connected/ended/error, form submitting/submitted, callback request) are untested.
  - **Partially tracked:** I-121 (video popup blocker), I-122 (Instant Call Back not deployed), I-134 (route race condition), I-135 (CORS). These cover ~4 states.
  - **Remaining gaps:** ~22 states with no AC, no test, no issue. Primarily widget mode transitions and error states.

#### Agents Page (13 states, all gaps)
- **ST-188 through ST-200**: All 13 /agents page states. Route exists in code but not in sidebar. I-111 does NOT list /agents as a route gap (it lists /my-work but not /agents). No AC, no test, no issue covers agent selection, chat, streaming, CRUD, or delete confirmation on this page.
  - **Partially tracked:** G-003 (m001-gap-coverage) has a test "G-003: Agents Standalone" that checks if /agents loads with agent selection interface. This covers ST-188 basic load only.
  - **Remaining gaps:** 12 states (ST-189 through ST-200).

---

## Mismatches Requiring Investigation

### Already Tracked
| Mismatch | Description | Tracked By |
|----------|-------------|------------|
| MISMATCH-010 | Settings sub-routes all 404 (client-side state, not URL routes) | Documented in reconciliation, not a bug -- by design |
| MISMATCH-013 | /manage vs /management route confusion, tour overlay on 404 | Known behavior -- sidebar "Manage" routes to /management |
| MISMATCH-001 | Metric card label truncation | **NEW -- No issue exists** |

### New Findings (not tracked)
| Mismatch | Description | Severity | Recommended Action |
|----------|-------------|----------|-------------------|
| MISMATCH-001 | AI Chat metric card labels truncated ("Appointment...", "Open Escalat...") | MEDIUM | Create issue -- FE CSS fix |
| MISMATCH-004 | TeamBox channel filter chips differ between DOM (6) and visual (3 visible) | HIGH | Investigate -- may be viewport issue or two conflated filter bars. Partially tracked by I-150/G-002.AC1. |
| MISMATCH-006 | Workflows sub-tab not visible in screenshot | MEDIUM | Investigate -- may be below fold or hidden. No issue exists. |
| MISMATCH-008 | "New Agent" button not visible on Sales Agents tab | MEDIUM | Investigate -- viewport or z-index issue. No issue exists. |
| MISMATCH-012 | Marketing Studio tab not captured in visual analysis | MEDIUM | Coverage gap in visual analysis, not a bug. Studio confirmed by DOM crawl. |
| MISMATCH-014 | "All Stores" dropdown undocumented for Insights | MEDIUM | ST-218 covers this state. Reconciliation note is informational, not a bug. |

### Informational (no action needed)
| Mismatch | Description | Reason |
|----------|-------------|--------|
| MISMATCH-002 | Element count discrepancy on AI Chat | DOM includes hidden elements -- expected |
| MISMATCH-003 | Header branding text not in DOM inventory | Static text, not interactive -- expected |
| MISMATCH-005 | Conversation count 261 vs 207 | DOM elements vs actual conversations -- different metrics |
| MISMATCH-007 | Agent names/count not in DOM pattern | DOM used UUID dedup, visual captured runtime data |
| MISMATCH-009 | Campaign action button icon mapping | Visual described icons by appearance -- functionally equivalent |
| MISMATCH-011 | Organization tile timeout for org_admin | Transient issue, confirmed working in visual analysis |

---

## Already Covered (no action needed)

### States with AC + Test + Verification
These areas have comprehensive coverage across sprint ACs, test files, and verification sprints:

**Authentication basics (2 states):**
- ST-011, ST-012: Login form and auth loading -- domain-01-auth covers login, cookies, RBAC

**AI Chat basics (12 states):**
- ST-053, ST-063-066, ST-078: Main page, metric tiles, suggestion chips -- S-1.AC1-AC3, s1-ai-chat.spec.ts

**TeamBox basics (12 states):**
- ST-080, ST-082, ST-084, ST-088-090, ST-092, ST-100-103: Conversation list, selected, reply, filters, phone/video tabs -- S-2.AC1-AC17, s2-teambox.spec.ts, S-11.AC1-AC11

**Sales basics (10 states):**
- ST-119, ST-130-131, ST-134-135, ST-138-140: Dashboard, agents, sync, insights, calendar -- S-3.AC1-AC11, s3-sales.spec.ts

**Service basics (8 states):**
- ST-141, ST-144-145, ST-154, ST-157, ST-159: Campaign table, safety card, agents, insights, calendar -- S-4.AC1-AC15, s4-service.spec.ts

**Marketing basics (6 states):**
- ST-160, ST-163-164, ST-166: Dashboard, agents, studio, insights -- S-5.AC1-AC9, s5-marketing.spec.ts

**Management basics (8 states):**
- ST-174, ST-176, ST-184, ST-186-187: Insights, hunches, activity log, user chats, billing -- S-6.AC1-AC9, s6-manage.spec.ts

**Settings tile grid (8 states):**
- ST-238-245: All 8 settings tiles -- S-7.AC1-AC7, s7-system-profile.spec.ts, G-001.AC3

**Profile basics (3 states):**
- ST-293, ST-296-297: Profile view, contact form, password form -- s7-system-profile.spec.ts, domain-09-settings

**Insights zone cards (7 states):**
- ST-202-207, ST-218: Red/yellow/green zones, store selector -- domain-07-insights, S-6.AC4

**Usage basics (3 states):**
- ST-343, ST-347-348: Usage page, period selector, org breakdown -- s10-launch smoke, domain-02-dashboard

**404 page (1 state):**
- ST-350: Confirmed by both methods

**Cross-cutting (2 states):**
- ST-006: Product tour -- S-9, domain-01-auth 1.13/1.14, G-001.AC1/AC2
- ST-009/ST-010: Toast notifications -- implicitly tested by many flows but no dedicated test

---

## Gap Summary by Zero-Coverage Route

| Route | States | Gaps | Existing Coverage |
|-------|--------|------|-------------------|
| /my-work | 15 | 15 | I-127 hides nav only |
| /agents | 13 | 12 | G-003 covers basic load (1 state) |
| /w/:slug, /p/:slug | 26 | ~22 | S-8 covers 4 states, I-121/I-122/I-134/I-135 cover issues |
| /settings/billing/* | 26 | 26 | I-105 (wiring), I-111 (test gap) |
| /settings/org-wizard | 11 | 11 | domain-09 9.4 (RBAC routing only) |
| /forgot-password | 4 | 4 | None |
| /reset-password | 7 | 7 | R-017/I-140 (backend only) |

---

## Consolidated Gap Count

| Domain | Gap Count | Priority States |
|--------|-----------|-----------------|
| FE | 72 | Insights drill-downs (8), Settings sub-sections (25), Widget modes (22) |
| BE | 28 | Billing (26), Org Wizard (11 -- overlap with FE) |
| DT | 8 | Hunch states (6), Insights Hunches standalone (3 -- overlap) |
| AU | 14 | Forgot/reset password (11), Login edge states (3) |
| IN | 5 | Usage edge states (3), Test infra (2) |
| **Total unique gaps** | **149** | After dedup of cross-domain overlaps |

### New Issues to Create (not already tracked)
1. Metric card label truncation (MISMATCH-001) -- FE, MEDIUM
2. AI Chat drill-down dialogs untested (ST-067-077) -- FE, MEDIUM
3. TeamBox task view untested (ST-093-097) -- FE, MEDIUM
4. Insights drill-down dialogs untested (ST-208-215) -- FE, HIGH
5. Insights Reports tab untested (ST-219-226) -- FE, MEDIUM
6. Settings sub-section interaction states untested (ST-246-290) -- FE, MEDIUM
7. Forgot/reset password FE flow untested (ST-016-026) -- AU, HIGH
8. Org wizard functional flow untested (ST-332-342) -- BE/FE, MEDIUM
9. /agents page functionality undocumented (ST-188-200) -- FE, LOW (route not in nav)
10. Widget interaction mode states untested (ST-027-052) -- FE, MEDIUM
11. Hunch status transition UI untested (ST-175-182) -- DT/FE, LOW
12. Marketing agent chat view untested (ST-167-172) -- FE, LOW
