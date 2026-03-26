# Nexxus Connect v2.2 — Acceptance Criteria (Phase Reset)

**Date:** 2026-03-24
**Supersedes:** Old domain-based acceptance criteria (backed up at .ghost/backups/2026-03-23-phase-reset/)
**Structure:** Program → Sprint → Component → Test Case (4 layers, fully traceable)

> **NOTE:** This file is a HUMAN-READABLE SUMMARY. The source of truth for acceptance criteria is **sprints.json**, where each sprint contains inline AC objects with id, criterion, component, test, and evidence fields. If this file and sprints.json disagree, sprints.json wins. Dev agents should read sprints.json, not this file.

---

# Layer 1: Program Acceptance Criteria

These 10 criteria define "the application is ready for use." Each is verified by multiple sprint-level criteria below. ALL must pass for go-live.

| ID | Criterion | Verified By Sprints | Status |
|----|-----------|-------------------|--------|
| P-1 | Every page loads without errors for every role (7 roles x all pages) | S-1, S-2, S-3, S-4, S-5, S-6, S-7, S-8 | |
| P-2 | Every data tile matches its API source (no hardcoded values) | S-3.4, S-4.7, S-5.5, S-6.6 | |
| P-3 | Every AI agent demonstrates its purpose in conversation | S-1.2, S-3.6, S-4.10, S-5.6 | |
| P-4 | VAPI call pipeline works end-to-end for all stores | S-0.4, S-9.1, S-9.2 | |
| P-5 | Campaigns work end-to-end (create → CSV → execute → reply) | S-4.8, S-4.9 | |
| P-6 | TeamBox is a functional unified inbox (all channels, takeover, manual send) | S-2.7, S-2.8, S-2.9, S-2.10 | |
| P-7 | No cross-org data leakage on any page | S-9.3 | |
| P-8 | Widgets and landing pages work for all 5 dealers | S-8.1, S-8.2, S-8.3, S-8.4, S-8.5 | |
| P-9 | All open issues CLOSED (I-086 through I-106, TG-001 through TG-010, TI-010 through TI-017) | S-0, S-2, S-3, S-4, S-6, S-8, S-9 | |
| P-10 | Production deployment pipeline works (CI/CD → Coolify) | S-10.1, S-10.2, S-10.3 | |

---

# Layer 2: Sprint Acceptance Criteria

Each sprint must satisfy ALL its criteria before it can be marked complete.

---

## S-0: FOUNDATION

| ID | Criterion | Component | Test Case | Evidence Type |
|----|-----------|-----------|-----------|---------------|
| S-0.AC1 | All 5 orgs have ALL 5 CommGate flags true (outbound, sms, phone, email, video) | S-0.1 | s0-foundation: query all 5 boolean flags per org | Query output |
| S-0.AC2 | All 5 orgs have email_enabled=true | S-0.1 | s0-foundation: included in AC1 check | Query output |
| S-0.AC3 | Agent "Nancy Gaston" exists for service dept in all stores with vapiAssistantId | S-0.2 | s0-foundation: GET /api/agents?department=service per org | API response |
| S-0.AC4 | Agent "Data Guru" exists for sales dept in all stores | S-0.2 | s0-foundation: GET /api/agents?department=sales per org | API response |
| S-0.AC5 | No agent named "Carol", "Service Agent", or "CRM Guru" exists | S-0.2 | s0-foundation: negative query | Query output |
| S-0.AC6 | "Sales Coach" agent exists in all 5 stores | S-0.3 | s0-foundation: GET /api/agents?department=sales per org | API response |
| S-0.AC7 | "Communication Writer" agent exists in all 5 stores | S-0.3 | s0-foundation: GET /api/agents?department=sales per org | API response |
| S-0.AC8 | 5 marketing agents exist in all 5 stores (Photo Studio, Video Producer, Copywriter, Creative Director, Market Intel) | S-0.3 | s0-foundation: GET /api/agents?department=marketing per org | API response |
| S-0.AC9 | seed.ts matches database agent records (no drift) | S-0.2, S-0.3 | Diff seed.ts agent list vs DB query | Diff output |
| S-0.AC9b | All 7 new agent types have non-empty instructions (length > 100 chars) | S-0.3b | s0-foundation: query agents WHERE name IN (...), assert instructions IS NOT NULL | Query output |
| S-0.AC10 | VIN lead creation succeeds via vin-safe-mcp (port 4003), not central MCP (port 4002) | S-0.4 | s0-foundation: POST webhook payload, verify vin-safe-mcp REST API used, both steps succeed | Log + API proof |
| S-0.AC11 | warehouse_metrics has non-zero rows for all 5 orgs | S-0.5 | s0-foundation: query warehouse_metrics GROUP BY org_id | Query output |
| S-0.AC12 | warehouse_leads has rows with valid dates for all 5 orgs | S-0.5 | s0-foundation: query warehouse_leads WHERE created_at IS NOT NULL | Query output |
| S-0.AC13 | npm run build completes without errors | S-0.6 | Build output | Terminal output |
| S-0.AC14 | Sync job runs without date parsing errors | S-0.6 | pm2 logs after sync trigger | Log output |

---

## S-1: AI CHAT (Home)

| ID | Criterion | Component | Test Case | Evidence Type |
|----|-----------|-----------|-----------|---------------|
| S-1.AC1 | Main page loads for all 7 roles without console errors | S-1.1 | s1-ai-chat: navigate /, capture console, assert no errors (per role) | Screenshot + console log |
| S-1.AC2 | Metric tiles render with numeric values (not blank/spinner) | S-1.1 | s1-ai-chat: assert tile elements contain /\d+/ | Screenshot |
| S-1.AC3 | Chat input visible and responsive | S-1.1 | s1-ai-chat: assert chat input exists, type text, verify it appears | Screenshot |
| S-1.AC4 | Streaming renders tokens progressively (first token < 8s — Claude API with tools takes 3-7s) | S-1.2 | s1-ai-chat: POST /api/chat/stream, measure time to first SSE data event, assert < 8000ms | Timing measurement |
| S-1.AC5 | Thinking indicators visible during AI processing | S-1.2 | s1-ai-chat: send message, screenshot during processing showing spinner/dots | Screenshot |
| S-1.AC6 | VIN data query returns real data for org with leads | S-1.3 | s1-ai-chat: ask "leads from last 7 days", assert response contains lead names/counts | API response |
| S-1.AC7 | Web search returns results | S-1.3 | s1-ai-chat: ask weather question, assert response contains weather data | API response |
| S-1.AC8 | Task creation via chat works | S-1.3 | s1-ai-chat: ask "create task to follow up with X", verify task in DB | Query proof |
| S-1.AC9 | Multi-turn conversation maintains context | S-1.2 | s1-ai-chat: send question, then follow-up referencing answer, assert coherent response | Conversation log |
| S-1.AC10 | Conversational tone (not report-formatted) | S-1.2 | s1-ai-chat: assert response does NOT start with "## " or contain markdown tables | Response analysis |
| S-1.AC11 | Chat History tab lists previous conversations | S-1.4 | s1-ai-chat: navigate to Chat History, assert conversation items visible | Screenshot |
| S-1.AC12 | Favorites add/remove/persist works | S-1.4 | s1-ai-chat: add favorite, navigate away, return, assert still favorited | Screenshot sequence |
| S-1.AC13 | Chat history delete: click delete → conversation removed from list and API | S-1.4 | s1-ai-chat: delete conversation, assert removed from DOM and GET /api/conversations returns fewer items | API + DOM |
| S-1.AC14 | Chat history scroll: list with 20+ items scrolls without breaking layout | S-1.4 | s1-ai-chat: seed 20+ conversations, verify ScrollArea works | Screenshot |
| S-1.AC15 | Metric tile drill-down: click tile → dialog shows breakdown matching API data | S-1.1 | s1-ai-chat: click tile, compare dialog data to /api/metrics/pipeline/details | API comparison |
| S-1.AC16 | File upload: plus button opens picker, file uploads, chat analyzes content | S-1.5 | s1-ai-chat: upload file, assert chat references file content in response | Conversation log |
| S-1.AC17 | Chat response quality: ask dealership-specific question, verify org-context in response | S-1.2 | s1-ai-chat: ask about org inventory/hours, assert answer uses org data | Conversation log |

---

## S-2: TEAMBOX

| ID | Criterion | Component | Test Case | Evidence Type |
|----|-----------|-----------|-----------|---------------|
| S-2.AC1 | Top horizontal menu bar present | S-2.1 | s2-teambox: assert menu bar element exists at top of TeamBox page | Screenshot |
| S-2.AC2 | Popout contains exactly: SMS, Email, Phone, Video, Tasks | S-2.2 | s2-teambox: open popout, assert 5 items with exact labels | Screenshot |
| S-2.AC3 | "Conversations" NOT in popout | S-2.2 | s2-teambox: open popout, assert no element with text "Conversations" | Screenshot (negative) |
| S-2.AC4 | Each popout item opens filtered list of that channel only | S-2.2 | s2-teambox: click SMS → assert all visible conversations have channel=sms; repeat for each | Screenshot per channel |
| S-2.AC5 | Phone tab shows VAPI call logs for current store | S-2.3 | s2-teambox: click Phone, assert table with date/caller/assistant/duration columns | Screenshot |
| S-2.AC6 | Phone tab has transcript links that work | S-2.3 | s2-teambox: click transcript link, assert transcript content loads | Screenshot |
| S-2.AC7 | Video tab shows Tavus session logs for current store | S-2.4 | s2-teambox: click Video, assert table with date/visitor/persona columns | Screenshot |
| S-2.AC8 | Video tab has transcript/recording links | S-2.4 | s2-teambox: click link, assert content loads | Screenshot |
| S-2.AC9 | Filter chips are NOT light blue | S-2.5 | s2-teambox: assert filter chip background-color is NOT #93c5fd or similar light blue | CSS assertion |
| S-2.AC10 | Manual message: select → type → send → appears in thread | S-2.7 | s2-teambox: click conversation, type in input, click send, assert new message in thread | Screenshot sequence |
| S-2.AC11 | Manual message delivered to recipient (outbound_log) | S-2.7 | s2-teambox: after send, query outbound_log for message with status=sent | Query proof |
| S-2.AC12 | STOP/opt-out: "STOP" adds phone to blacklist | S-2.8 | s2-teambox: simulate STOP inbound, query sms_blacklist for phone | API + query proof |
| S-2.AC13 | STOP/opt-out: no further messages sent to blacklisted phone | S-2.8 | s2-teambox: attempt send to blacklisted phone, assert blocked | API proof |
| S-2.AC14 | Near-real-time: new message appears within 10 seconds via polling (refetchInterval: 5000ms) | S-2.9 | s2-teambox: have browser open on TeamBox, POST message via API, assert it appears within 10s without navigation | Screenshot timing |
| S-2.AC15 | Human takeover: assign user → AI stops auto-responding | S-2.10 | s2-teambox: PATCH conversation assignedTo, send inbound, assert no AI response | API proof |
| S-2.AC16 | Human takeover: un-assign → AI resumes | S-2.10 | s2-teambox: PATCH conversation assignedTo=null, send inbound, assert AI responds | API proof |
| S-2.AC17 | Agent vs human filter: toggle shows only automated OR only human conversations | S-2.5 | s2-teambox: click automated filter, assert all visible items are automated | Screenshot |
| S-2.AC18 | Form submissions visible in conversation list and filterable | S-2.6 | s2-teambox: submit widget form, assert conversation appears with channel=form | Query + Screenshot |
| S-2.AC19 | Message history renders actual chat content when conversation selected | S-2.7 | s2-teambox: click conversation with known messages, assert message text visible (not blank) | Screenshot |
| S-2.AC20 | Service campaign conversations appear in TeamBox | S-2.7 | s2-teambox: execute service campaign, verify reply creates conversation in TeamBox | Screenshot |
| S-2.AC21 | Delete conversation removes from list and API | S-2.11 | s2-teambox: delete conversation, assert removed from DOM and DB | API + DOM |

---

## S-3: SALES

| ID | Criterion | Component | Test Case | Evidence Type |
|----|-----------|-----------|-----------|---------------|
| S-3.AC1 | 4 agents visible on Agents tab: Caroline, Data Guru, Sales Coach, Communication Writer | S-3.2 | s3-sales: navigate /sales → Agents tab, assert 4 cards with exact names | Screenshot |
| S-3.AC2 | Agent card descriptions NOT truncated (full text visible) | S-3.1 | s3-sales: for each card, assert description element has no text-overflow:ellipsis clipping | Screenshot |
| S-3.AC3 | "Data Guru" displayed (not "CRM Guru") anywhere on page | S-3.2 | s3-sales: full page text search for "CRM Guru" returns zero matches | Text assertion |
| S-3.AC4 | Every Dashboard KPI tile value matches its API source | S-3.4 | s3-sales: for each tile, read DOM value, GET API endpoint, compare | Documented table |
| S-3.AC5 | /api/vin/leads/summary returns non-zero newLeads | S-3.4 | s3-sales: GET endpoint, assert newLeads > 0 | API response |
| S-3.AC6 | Pipeline data renders on Dashboard | S-3.5 | s3-sales: assert pipeline section visible with status breakdown | Screenshot |
| S-3.AC7 | Pipeline breakdown matches warehouse_leads query | S-3.5 | s3-sales: compare DOM values to direct DB query | Query + DOM comparison |
| S-3.AC8 | Calendar shows appointment with source="vapi" | S-3.3 | s3-sales: navigate Calendar tab, assert appointment from voice call visible | Screenshot |
| S-3.AC9 | Data Guru returns real VIN data when asked | S-3.6 | s3-sales: chat with Data Guru, ask for leads, assert response contains lead data | Conversation log |
| S-3.AC10 | Sales Coach provides coaching advice | S-3.6 | s3-sales: chat with Sales Coach, ask coaching question, assert relevant response | Conversation log |
| S-3.AC11 | Communication Writer produces email draft | S-3.6 | s3-sales: chat with Writer, ask for draft, assert response is formatted email | Conversation log |
| S-3.AC12 | Recent Activity feed shows real data from API (not hardcoded mock) | S-3.4 | s3-sales: assert Recent Activity entries come from API, not static array (lines 591-603) | Code + DOM |
| S-3.AC13 | Conversion Rate change shows delta (not absolute rate) | S-3.4 | s3-sales: compare change value to actual period-over-period delta | API comparison |
| S-3.AC14 | Active Pipeline resolves consistently between two data sources | S-3.4 | s3-sales: verify pipeline.activePipeline and leadSummary.activeLeads alignment | API comparison |
| S-3.AC15 | VAPI webhook creates appointment that appears in Sales Calendar | S-3.3 | s3-sales: trigger VAPI call, verify appointment in DB and Calendar tab | Query + Screenshot |
| S-3.AC16 | Waiting on Response and Appointments Set show real change data (not hardcoded 0) | S-3.4 | s3-sales: assert change values on these tiles are not always 0 | API comparison |

---

## S-4: SERVICE

| ID | Criterion | Component | Test Case | Evidence Type |
|----|-----------|-----------|-----------|---------------|
| S-4.AC1 | Campaigns tab is in position 1 (first tab) | S-4.1 | s4-service: assert first tab element has text "Campaigns" | Screenshot |
| S-4.AC2 | No "Dashboard" tab exists on service page | S-4.1 | s4-service: assert no tab element with text "Dashboard" | Screenshot (negative) |
| S-4.AC3 | "New Campaign" button visible without scrolling | S-4.2 | s4-service: assert button is in viewport on page load | Screenshot |
| S-4.AC4 | CSV Upload button prominent (not just icon per row) | S-4.2 | s4-service: assert dedicated upload button visible in header area | Screenshot |
| S-4.AC5 | Campaign detail dialog: click row → shows all fields | S-4.3 | s4-service: click campaign row, assert dialog with name/status/channel/template/recipients/sent/replied/CSV/history | Screenshot |
| S-4.AC6 | Insights tab shows KPI tiles (moved from old Dashboard) | S-4.4 | s4-service: click Insights tab, assert metric tiles visible with values | Screenshot |
| S-4.AC7 | Only Nancy Gaston visible on Agents tab | S-4.5 | s4-service: click Agents tab, assert exactly 1 agent card with name "Nancy Gaston" | Screenshot |
| S-4.AC8 | Nancy Gaston has non-empty instructions in DB | S-4.6 | s4-service: query agents WHERE name='Nancy Gaston', assert instructions IS NOT NULL AND length > 100 | Query proof |
| S-4.AC9 | IRREVERSIBLE: Campaign create → CSV (owner phone ONLY) → execute (owner approval required) → SMS delivered | S-4.8 | s4-service: STOP before dryRun=false, test recipients only, verify outbound_log | Log proof |
| S-4.AC10 | Customer reply creates TeamBox conversation with campaignId set | S-4.8 | s4-service: simulate inbound reply, query conversations WHERE campaign_id IS NOT NULL | Query proof |
| S-4.AC11 | Recall campaign: Nancy responds to recall question intelligently | S-4.9 | s4-service: chat with Nancy about recall, assert response references campaigns/scheduling | Conversation log |
| S-4.AC12 | Nancy books appointment when asked | S-4.10 | s4-service: ask Nancy to schedule service, verify appointment created in DB | Query proof |
| S-4.AC13 | After-hours: message queued when business_hours_end is before current time | S-4.11 | s4-service: temporarily set org business_hours_end to 1hr before now, send message, assert queued not sent, restore original value | Log proof |
| S-4.AC14 | After-hours: queued message releases at 7 AM | S-4.11 | s4-service: verify scheduled release mechanism exists | Code/config proof |
| S-4.AC15 | Service Insights metrics are service-department-filtered (not org-wide) | S-4.4 | s4-service: verify Open Conversations and Total Conversations use service filter | Code + API |
| S-4.AC16 | Service metrics show real change/trend data (not hardcoded zeros) | S-4.4 | s4-service: assert change values on metric tiles are not all zero | API comparison |
| S-4.AC17 | Sub-menu label matches page tabs (no phantom "Dashboard") | S-4.1 | s4-service: assert sub-menu first item is NOT "Dashboard" | Screenshot |
| S-4.AC18 | Campaign execution E2E: create → CSV → dryRun → execute → SMS delivered → reply in TeamBox | S-4.8 | s4-service: full flow with real SMS (owner phone only) | Log + Query proof |

---

## S-5: MARKETING

| ID | Criterion | Component | Test Case | Evidence Type |
|----|-----------|-----------|-----------|---------------|
| S-5.AC1 | No "Campaigns" tab on marketing page | S-5.1 | s5-marketing: assert no tab with text "Campaigns" | Screenshot (negative) |
| S-5.AC2 | No campaign data fetching in marketing.tsx | S-5.1 | Code review: grep marketing.tsx for campaign query keys | Code diff |
| S-5.AC3 | Tabs are: Dashboard, Agents, Studio, Insights | S-5.2 | s5-marketing: assert 4 tabs with exact labels | Screenshot |
| S-5.AC4 | Studio has category filter pills (All, Images, Videos, Copy, Scores, Voiceovers, Radar) | S-5.3 | s5-marketing: click Studio tab, assert 7 filter pills visible | Screenshot |
| S-5.AC5 | Studio filters work: clicking "Images" shows only image artifacts | S-5.3 | s5-marketing: click Images pill, assert all visible artifacts are type=image | Screenshot |
| S-5.AC6 | All 5 marketing agent cards visible with descriptions | S-5.4 | s5-marketing: click Agents tab, assert 5 cards with exact names + descriptions | Screenshot |
| S-5.AC7 | Dashboard tiles match API values | S-5.5 | s5-marketing: tile-by-tile comparison | Documented table |
| S-5.AC8 | Photo Studio produces image artifact via fal.ai proxy | S-5.6 | s5-marketing: chat, request image, assert IMAGE artifact returned with URL | Conversation log |
| S-5.AC9 | Copywriter produces ad copy with categories | S-5.6 | s5-marketing: chat, request copy, assert structured response | Conversation log |
| S-5.AC10 | Sub-menu "Campaigns" link removed (matches page which has no Campaigns tab) | S-5.1 | s5-marketing: open sub-menu, assert no "Campaigns" item | Screenshot (negative) |
| S-5.AC11 | Marketing metrics show real change/trend data (not hardcoded zeros) | S-5.5 | s5-marketing: assert change values on metric tiles are not all zero | API comparison |
| S-5.AC12 | Marketing metrics show marketing-specific data (not org-wide fallback) | S-5.5 | s5-marketing: compare tile values to byDepartment.marketing (not global) | API comparison |
| S-5.AC13 | StudioGallery shows real artifacts (not empty placeholder) | S-5.3 | s5-marketing: navigate Studio, assert gallery content renders | Screenshot |
| S-5.AC14 | Video Producer agent produces video artifact | S-5.6 | s5-marketing: chat with Video Producer, request video, assert artifact | Conversation log |
| S-5.AC15 | Market Intel agent provides competitor/market analysis | S-5.6 | s5-marketing: chat with Market Intel, ask analysis question, assert relevant data | Conversation log |

---

## S-6: MANAGE

| ID | Criterion | Component | Test Case | Evidence Type |
|----|-----------|-----------|-----------|---------------|
| S-6.AC1 | No "Dashboard" tab and no "ROI" tab on Manage page | S-6.1 | s6-manage: assert no tab with text "Dashboard" and no tab with text "ROI" | Screenshot (negative) |
| S-6.AC2 | Billing tab present on Manage page | S-6.2 | s6-manage: assert tab with text "Billing" exists | Screenshot |
| S-6.AC3 | Billing NOT in Profile page | S-6.2 | s6-manage: navigate /profile, assert no "Billing" link/section | Screenshot (negative) |
| S-6.AC4 | Insights tab renders with real data (not empty/mock) | S-6.3 | s6-manage: click Insights, assert metric content with numbers | Screenshot |
| S-6.AC5 | User Chats tab lists staff AI conversations | S-6.4 | s6-manage: click User Chats, assert conversation list with user names | Screenshot |
| S-6.AC6 | User Chats filter by user works | S-6.4 | s6-manage: select user filter, assert list updates | Screenshot |
| S-6.AC7 | Partner admin (Cage) sees all 5 dealerships | S-6.5 | s6-manage: login as Cage partner admin, verify 5 stores visible | Screenshot |
| S-6.AC8 | Partner admin does NOT see Huminic data | S-6.5 | s6-manage: assert no "Huminic" text in data areas | Screenshot (negative) |
| S-6.AC9 | System Log shows real activity entries | S-6.6 | s6-manage: click System Log, assert entries with timestamps | Screenshot |
| S-6.AC10 | Sub-menu matches page tabs (remove phantom Dashboard, add Hunches and Billing) | S-6.1 | s6-manage: compare sub-menu items to page tab labels | Screenshot |
| S-6.AC11 | Hunches generate button produces new insights | S-6.7 | s6-manage: click Generate Hunches, assert new hunch card appears | API + Screenshot |
| S-6.AC12 | Hunches accept/dismiss/resolve state machine works | S-6.7 | s6-manage: accept hunch → assert status changes → resolve → assert final state | Screenshot sequence |
| S-6.AC13 | Billing tab shows real FlexPrice data when configured | S-6.2 | s6-manage: verify BillingDashboard renders actual plan/usage data (I-105) | API + Screenshot |
| S-6.AC14 | Management RBAC: non-management roles redirected to home | S-6.8 | s6-manage: login as sales role, navigate /management, assert redirect to / | Navigation proof |

---

## S-7: SYSTEM + PROFILE + TOP ICONS

| ID | Criterion | Component | Test Case | Evidence Type |
|----|-----------|-----------|-----------|---------------|
| S-7.AC1 | All 8 settings sections render | S-7.1 | s7-system-profile: navigate /settings, assert 8 tile/section elements | Screenshot |
| S-7.AC2 | No agents in settings page popout | S-7.1 | s7-system-profile: open popout, assert no agent cards/links | Screenshot (negative) |
| S-7.AC3 | CommGate toggle works in Organization settings | S-7.1 | s7-system-profile: click Organization, toggle switch, verify API call | Screenshot + API proof |
| S-7.AC4 | "Reset Tour" button text displayed (code currently says "Restart Tour" — verify or change to "Reset Tour") | S-7.2 | s7-system-profile: navigate profile/preferences, assert button text is "Reset Tour" | Screenshot |
| S-7.AC5 | No Billing link/section in Profile page | S-7.3 | s7-system-profile: full text search of profile for "Billing" | Screenshot (negative) |
| S-7.AC6 | Landing page icon opens new browser window | S-7.4 | s7-system-profile: click landing page icon, assert new window/tab opened | Browser behavior proof |
| S-7.AC7 | Activity Feed vs Notifications investigation documented | S-7.5 | Investigation report comparing data sources | Document |
| S-7.AC8 | Settings tiles respect RBAC: super_admin sees 7, partner_admin sees 6 (no AI Config tile), org_admin sees 6 | S-7.1 | s7-system-profile: switch roles, count visible tiles per role | Screenshot per role |
| S-7.AC9 | User Management CRUD: add, edit, deactivate, reset password all work | S-7.6 | s7-system-profile: execute each CRUD operation, verify via API | API proof |
| S-7.AC10 | Communication Gate toggle persists and stops all outbound | S-7.1 | s7-system-profile: toggle OFF, attempt campaign execute, assert blocked | API proof |
| S-7.AC11 | Channel toggles persist and control outbound per channel | S-7.1 | s7-system-profile: toggle SMS off, attempt SMS send, assert blocked | API proof |
| S-7.AC12 | Knowledge Base document upload: file appears in table, can be deleted | S-7.7 | s7-system-profile: upload file, assert row in table, delete, assert removed | Screenshot sequence |
| S-7.AC13 | AI Configuration system prompt saves and affects chat behavior | S-7.8 | s7-system-profile: change system prompt, verify chat response reflects change | Conversation log |
| S-7.AC14 | Business hours settings persist and trigger after-hours auto-response | S-7.9 | s7-system-profile: set hours, send message outside hours, assert auto-response | Log proof |
| S-7.AC15 | "Take a Tour" renamed to "Reset Tour" in TopBar profile dropdown | S-7.2 | s7-system-profile: open profile dropdown, assert text "Reset Tour" (not "Take a Tour") | Screenshot |
| S-7.AC16 | Billing link removed from TopBar profile dropdown | S-7.3 | s7-system-profile: open profile dropdown, assert no "Billing" item | Screenshot (negative) |
| S-7.AC17 | Profile photo upload works (POST /api/users/me/photo) | S-7.10 | s7-system-profile: upload photo, assert avatar updates | Screenshot |
| S-7.AC18 | Profile edit saves (name, email via PATCH /api/users/me) | S-7.10 | s7-system-profile: edit name, save, verify persists on reload | Screenshot |
| S-7.AC19 | Change password works with validation | S-7.10 | s7-system-profile: change password, login with new password | API proof |
| S-7.AC20 | Org switcher changes org context and reloads | S-7.4 | s7-system-profile: switch org, verify page shows new org data | Screenshot |
| S-7.AC21 | Notification data comes from real backend API (not mock) | S-7.5 | s7-system-profile: verify /api/notifications endpoint exists and returns data | API proof |

---

## S-8: LANDING PAGE / WIDGETS

| ID | Criterion | Component | Test Case | Evidence Type |
|----|-----------|-----------|-----------|---------------|
| S-8.AC1 | Video widget opens in PARENT browser window, not inside iframe | S-8.1 | s8-landing-widgets: trigger video in widget, assert window.open or parent target | Browser behavior proof |
| S-8.AC2 | Store name visible at top-left of landing page for each dealer | S-8.2 | s8-landing-widgets: navigate /p/{slug} x5, assert org name in header | Screenshot x5 |
| S-8.AC3 | Widget appointment booking creates appointment in DB | S-8.3 | s8-landing-widgets: book via widget, query appointments table | Query proof |
| S-8.AC4 | Widget appointment appears in store calendar | S-8.3 | s8-landing-widgets: after booking, navigate to Calendar tab, assert visible | Screenshot |
| S-8.AC5 | Widget form submission creates conversation in TeamBox | S-8.4 | s8-landing-widgets: POST /api/widget/contact, query conversations table | API + query proof |
| S-8.AC6 | All 5 dealer widget JS files serve valid JavaScript | S-8.5 | s8-landing-widgets: GET /widget/dealer/{slug}.js x5, assert 200 + application/javascript | API response x5 |
| S-8.AC7 | Widget JS contains correct dealer name | S-8.5 | s8-landing-widgets: parse JS content, assert dealer name string present | Content assertion |
| S-8.AC8 | Landing page loads for valid org slug (store name + persona shown) | S-8.2 | s8-landing-widgets: navigate /p/{slug}, assert org name and persona name visible | Screenshot |
| S-8.AC9 | Landing page contact form submits and shows success state | S-8.4 | s8-landing-widgets: fill form, submit, assert success message | Screenshot |
| S-8.AC10 | Web Chat widget produces AI responses scoped to org | S-8.6 | s8-landing-widgets: open chat widget, send message, assert AI response | Screenshot |
| S-8.AC11 | Web Call behavior matches manifest: collect number → trigger outbound VAPI call | S-8.7 | s8-landing-widgets: click Web Call, verify number prompt and VAPI outbound trigger | Functional test |
| S-8.AC12 | Widget menu shows all 4 options (Chat, Call, Form, Video) | S-8.6 | s8-landing-widgets: click widget button, assert 4 option buttons | Screenshot |
| S-8.AC13 | Widget embed code generates valid embeddable snippet | S-8.5 | s8-landing-widgets: generate embed code in settings, validate HTML/JS syntax | Code assertion |
| S-8.AC14 | ?mode=video auto-launches fullscreen video session | S-8.1 | s8-landing-widgets: navigate /p/{slug}?mode=video, assert video connecting state | Screenshot |

---

## S-9: CROSS-CUTTING

| ID | Criterion | Component | Test Case | Evidence Type |
|----|-----------|-----------|-----------|---------------|
| S-9.AC1 | All VAPI assistants have matching DB agent records | S-9.1 | s9-cross-cutting: compare VAPI API list vs agents table | Audit report |
| S-9.AC2 | No "Could not resolve organization from assistantId" in logs after fix | S-9.1 | s9-cross-cutting: grep pm2 logs for error message, assert zero matches | Log proof |
| S-9.AC3 | 9 weekend calls replayed — emails sent to correct recipients | S-9.2 | s9-cross-cutting: check outbound_log for 9 entries with correct to_email | Query proof |
| S-9.AC4 | 9 weekend calls replayed — VIN leads created | S-9.2 | s9-cross-cutting: verify VIN contact + lead per call | API proof |
| S-9.AC5 | No cross-org data visible: Serra Honda admin sees ONLY Serra Honda data | S-9.3 | s9-cross-cutting: login, navigate all pages, grep for other org names | Screenshot + text search |
| S-9.AC6 | No cross-org data visible: repeated for each of 5 orgs | S-9.3 | s9-cross-cutting: 5 login cycles x all pages | Screenshot set |
| S-9.AC7 | Walk-in followup trigger fires | S-9.4 | s9-cross-cutting: create scheduled action, assert processed | API proof |
| S-9.AC8 | Accessibility: axe-core scan on all major pages produces report | S-9.5 | s9-cross-cutting: axe-core integration, documented results | axe report |
| S-9.AC9 | live-comms.spec.ts: all 14 tests pass | S-9.6 | Run live-comms tests, assert 14/14 pass | Test output |
| S-9.AC10 | RI-TAVUS-2 passes | S-9.7 | Run real-integrations RI-TAVUS-2, assert pass | Test output |

---

## S-10: LAUNCH

| ID | Criterion | Component | Test Case | Evidence Type |
|----|-----------|-----------|-----------|---------------|
| S-10.AC1 | GitHub Actions workflow exists and triggers on push to main | S-10.1 | Push commit to main, verify Actions run starts | CI screenshot |
| S-10.AC2 | CI pipeline: install → build → test steps all pass | S-10.1 | GitHub Actions log shows green checkmarks | CI output |
| S-10.AC3 | Coolify redeploys within 5 minutes of push | S-10.2 | Push → verify Coolify deployment log | Deployment log |
| S-10.AC4 | Production smoke: login works on live.huminic.app | S-10.3 | s10-launch: login against production URL | Screenshot |
| S-10.AC5 | Production smoke: all pages load without errors | S-10.3 | s10-launch: navigate all pages, assert no console errors | Screenshot set |
| S-10.AC6 | Production smoke: test SMS delivers | S-10.3 | s10-launch: send SMS via production, verify delivery | Log proof |
| S-10.AC7 | Full regression: all sprint test suites pass against production | S-10.4 | Run full Playwright suite against live URL | Test output |
| S-10.AC8 | Owner walkthrough: every page confirmed working | S-10.5 | Owner walks through, provides sign-off | Written sign-off |
| S-10.AC9 | Stakeholder demo completed successfully | S-10.6 | Demo executed using org_admin role, stakeholder confirms | Demo record |
| S-10.AC10 | All issues.md items status=CLOSED | S-10.7 | Review issues.md, assert 0 REMEDIATING | File proof |
| S-10.AC11 | All TG test gaps have passing tests | S-10.7 | Run all TG-referenced tests, assert pass | Test output |

---

# Layer 3: User Story Coverage Map

Every user story maps to at least one sprint AC. Stories in BACKLOG have no AC — they are explicitly deferred.

| Story | Title | Sprint ACs | Status |
|-------|-------|-----------|--------|
| US-001 | Web Chat to VIN Lead | S-0.AC10, S-9.AC1 | Active |
| US-002 | Tavus Video Lead | S-8.AC1, S-9.AC10 | Active |
| US-003 | Form to Two-Way SMS | S-8.AC5, S-2.AC10 | Active |
| US-004 | VAPI Inbound Call | S-0.AC10, S-9.AC1, S-9.AC2 | Active |
| US-005 | Walk-In Auto-Followup | S-9.AC7 | Active |
| US-006 | CRM Guru Research | S-1.AC6, S-3.AC9 | Active |
| US-007 | Pipeline Review | S-3.AC6, S-3.AC7 | Active |
| US-008 | Competitive Alert | — | BACKLOG |
| US-009 | Oil Change Campaign | S-4.AC9, S-4.AC10 | Active |
| US-010 | Recall Notification | S-4.AC11 | Active |
| US-011 | Service Metrics | S-4.AC6 | Active |
| US-012 | Opt-Out Check | S-2.AC12, S-2.AC13 | Active |
| US-013 | Widget Scheduling | S-8.AC3, S-8.AC4 | Active |
| US-014 | Service Agent FAQ | S-4.AC11, S-4.AC12 | Active |
| US-015 | SMS Inbound Query | S-2.AC10 | Active |
| US-016 | AI List Gen | S-1.AC6 | Active |
| US-017 | SMS Handover | S-2.AC15, S-2.AC16 | Active |
| US-018 | TeamBox Filtering | S-2.AC2, S-2.AC4 | Active |
| US-019 | Escalation Mgmt | — | BACKLOG |
| US-020 | History Preserve | S-1.AC11 | Active |
| US-021 | After-Hours | S-4.AC13, S-4.AC14 | Active |
| US-022 | Multi-Store Oversight | S-6.AC7, S-6.AC8 | Active |
| US-023 | Metric Review | S-3.AC4, S-4.AC6 | Active |
| US-024 | Source Analysis | S-3.AC6 | Active |
| US-025 | Executive Insight | S-6.AC4 | Active |
| US-026 | Coaching | S-3.AC10 | Active |
| US-027 | Master Kill Switch | S-4.AC9 | Active |
| US-028 | Channel Pause | S-4.AC9 | Active |
| US-029 | Email Draft | S-3.AC11 | Active |
| US-030 | CRM Cross-Ref | S-1.AC6 | Active |

**Stories not covered (deferred to backlog):** US-008, US-019

---

# Layer 4: Launch Readiness Summary

**Total Sprint ACs:** 156 (108 original + 48 from E-013 audits)
**Passing:** 0 (not yet executed)
**Known blockers:** I-105 (FlexPrice billing), I-102 (Photo Studio FE), TI-018 (Photo Studio FE — same as I-102)
**Not tested:** 156

This section will be updated as sprints complete. Each sprint marks its ACs as PASS/FAIL with evidence links.

---

**Last updated:** 2026-03-26 (E-013 audit — 48 new ACs added from 10 section audits)
**Backup of previous:** .ghost/backups/2026-03-23-phase-reset/acceptance_criteria.md
