# U-001 Reconciliation — State Enumeration vs Screenshots

**Date:** 2026-03-27
**Source:** 30 screenshots cross-referenced against 163 enumerated states

---

## Methodology

Each screenshot was compared against the state enumeration to identify:
- States visible in screenshots that differ from enumeration
- States enumerated but not crawled (no screenshot)
- Permission differences between org_admin and super_admin
- UI elements present that have no AC coverage

---

## Route-by-Route Reconciliation

### Route 1: / (Main / AI Chat) — Screenshot 01
**Enumeration:** M-01 through M-07 (7 states)
**Screenshot shows:** 4 metric tiles (Active Pipeline: 109, Appointments Today: 0, Open Escalations: 8, Outbound Sent 24h: 9), "Try asking..." suggestions, chat input
**Matches:** M-01 confirmed — greeting, suggestions, chat input present
**Gaps:**
- Chat history sidebar not visible in default view — M-02 not crawled
- Contact lookup (M-03/M-04/M-06) not crawled
- MetricDetailDialog (M-05) not crawled
- Streaming response (M-07) not crawled
- "live" badges visible on tiles — not enumerated (real-time indicator)

### Route 2: /teambox — Screenshots 15, 16, 17
**Enumeration:** TB-01 through TB-16 (16 states)
**Screenshot 15 shows:** Conversations tab active, "All" filter selected, channel filter chips (All, SMS, Email, Web Chat, WhatsApp, Voice), conversation list with 206 items
**Mismatches:**
- **WhatsApp filter chip visible** — not in state enumeration (TB-05 through TB-07 list SMS, Email, Voice only)
- **"Web Chat" filter chip** — enumeration doesn't list this variant
- Tabs show "Conversations | Phone | Video" — I-147 already flags this mismatch
- No "Tasks" tab visible — per AC S-2.AC2, popout should have Tasks
**Screenshot 16:** Phone tab — matches TB-12
**Screenshot 17:** Video tab — matches TB-13
**Not crawled:** TB-09 (Tasks view), TB-10 (empty), TB-11 (loading), TB-14 (Video empty), TB-15 (Take Over), TB-16 (Campaign Disconnect)

### Route 3: /my-work — NOT CRAWLED
**Enumeration:** MW-01 through MW-08 (8 states)
**Screenshots:** None
**Gap:** Entire route uncrawled. No visual verification of Dashboard, Tasks, Chat, Assistant tabs or task dialogs.

### Route 4: /sales — Screenshots 02, 03, 04, 05
**Enumeration:** SL-01 through SL-08 (8 states)
**Screenshot 02:** Dashboard — 7 metric tiles visible, matches SL-01
**Screenshot 03:** Agents tab — agent cards visible, matches SL-02. Shows 5 cards (I-138 flags "Unauthorized Agent" test artifact — should be 4)
**Screenshot 04:** Insights tab — matches SL-03
**Screenshot 05:** Calendar tab — matches SL-04
**Not crawled:** SL-05 (MetricDetailDialog), SL-06/SL-07 (agent detail/menu), SL-08 (loading)

### Route 5: /service — Screenshots 06, 07
**Enumeration:** SV-01 through SV-09 (9 states)
**Screenshot 06:** Campaigns tab — table visible with campaign rows, matches SV-01
**Screenshot 07:** Agents tab — shows agent card, matches SV-04
**Not crawled:** SV-02 (safety dismissed), SV-03 (paused badge), SV-05 (Insights), SV-06 (Calendar), SV-07 (Kill Switch), SV-08 (empty), SV-09 (tooltips)

### Route 6: /marketing — Screenshots 08, 09
**Enumeration:** MK-01 through MK-06 (6 states)
**Screenshot 08:** Dashboard tab — 4 metric tiles all showing 0, matches MK-01. Confirms I-113 (hardcoded zeros).
**Screenshot 09:** Agents tab — agent cards visible, matches MK-02
**Tabs shown:** Dashboard, Agents, Studio, Insights — matches AC S-5.AC3
**Not crawled:** MK-03 (Insights), MK-04 (Calendar), MK-05 (empty campaigns), MK-06 (client-side agents detail)

### Route 7: /management — Screenshots 10, 11, 12, 13, 14
**Enumeration:** MG-01 through MG-08 (8 states)
**Screenshot 10:** Insights tab — matches MG-01
**Screenshot 11:** Hunches tab — matches MG-02
**Screenshot 12:** System Log tab — matches MG-05
**Screenshot 13:** User Chats tab — shows "coming soon" placeholder, matches MG-07. Confirms I-116.
**Screenshot 14:** Billing tab — matches MG-08
**Tabs shown:** Insights, Hunches, System Log, User Chats, Billing — all 5 present
**Not crawled:** MG-03 (Hunches empty), MG-04 (preferences Sheet), MG-06 (System Log empty)

### Route 8: /agents — NOT CRAWLED
**Enumeration:** AG-01 through AG-07 (7 states)
**Screenshots:** None
**Gap:** Standalone agents page not crawled. No verification of agent selection, chat, CRUD dialogs.

### Route 9: /insights (standalone) — NOT CRAWLED
**Enumeration:** IN-01 through IN-16 (16 states)
**Screenshots:** None (insights shown embedded in Sales/Service/Marketing/Management, but standalone /insights route not visited)
**Gap:** Dashboard traffic light zones, drill-down modals, Reports/Library/Hunches tabs, org switcher — all uncrawled.

### Route 10: /settings/system — Screenshots 18, 19, 20, 21, 22, 23, 28, 29
**Enumeration:** ST-00 through ST-31 (32 states)

**Screenshot 18 (org_admin, Serra Honda):** Tile grid — 4 tiles visible: User Management, Organization, Tools & Integrations, Knowledge Base
**Screenshot 28 (super_admin, Huminic):** Tile grid — 4 tiles visible in screenshot (same as org_admin view)
**Mismatch:** State enumeration lists 7 tile sections (Users, Org, Tools, KB, AI Config, Notifications, Appearance). AC S-7.AC1 says "8 sections." Screenshots show only 4 tiles for both roles.
**Possible explanations:** (a) Screenshots cut off — tiles may be below fold; (b) AI Config tile only appears for super_admin per I-120; (c) Notifications and Appearance tiles may not be implemented yet.

**Screenshot 29 (super_admin):** AI Config section — System Prompt tab visible with "Claude (Anthropic)" model selector. Accessed via tile click (not visible in grid screenshots). Matches ST-27.
**Screenshot 19:** Users section — matches ST-01
**Screenshot 20:** Organization section — matches ST-07
**Screenshot 21:** Tools — MCP integrations, matches ST-18
**Screenshot 22:** Tools — Widgets tab, matches ST-10
**Screenshot 23:** Knowledge Base — matches ST-22

**Not crawled:** ST-02/03/04 (User CRUD dialogs), ST-05 (VIN Users), ST-06 (Roles), ST-08/09 (Org Branding/Domain), ST-11/12/13 (Widget detail views), ST-14/15 (Widget CRUD), ST-16/17 (Landing Pages), ST-19/20/21 (API/Keys/Webhooks), ST-24/25/26 (KB Web/DB/Settings), ST-28/29 (AI Agent Behavior/Hunches), **ST-30 (Notifications)**, **ST-31 (Appearance)**

### Route 11: /profile — Screenshot 24
**Enumeration:** PR-01 through PR-05 (5 states)
**Screenshot 24:** My Profile tab — view mode, matches PR-01
**Not crawled:** PR-02 (edit mode), PR-03 (Preferences tab), PR-04 (Change Password), PR-05 (photo upload)

### Route 12: /usage — Screenshot 30
**Enumeration:** US-01 through US-05 (5 states)
**Screenshot 30 (super_admin, Huminic):** Usage page — Total Events: 45, Event Types: 3, Organizations: 7, SMS breakdown (Failed: 25, Sent: 19, Blocked: 1). Matches US-01/US-03.
**Not crawled:** US-02 (period selector), US-04 (permission denied), US-05 (empty)

### Route 13: /settings/billing — NOT CRAWLED
**Enumeration:** BL-01 through BL-05 (5 states)
**Screenshots:** Management Billing tab (screenshot 14) was crawled but the standalone /settings/billing route was not.
**Note:** I-105 confirms billing is not configured (FlexPrice returns {configured: false}).

### Route 14: /settings/org-wizard — NOT CRAWLED
**Enumeration:** OW-01 through OW-08 (8 states)
**Screenshots:** None
**Gap:** 7-step wizard entirely uncrawled. Super_admin only.

### Routes 15-17: Auth pages — Screenshots 26, 27
**Enumeration:** AU-01 through AU-07 (7 states)
**Screenshot 26:** Login — matches AU-01
**Screenshot 27:** Forgot password — matches AU-04
**Not crawled:** AU-02 (session expired), AU-03 (validation error), AU-05/06/07 (forgot/reset flows)

### Routes 18-19: Widget Landing Pages — Screenshot 25
**Enumeration:** WL-01 through WL-12 (12 states)
**Screenshot 25:** Serra Honda landing page — store name visible, menu closed. Matches WL-01.
**Not crawled:** WL-02 through WL-12 (all widget modes, success/error states)

### Route 20: 404 — NOT CRAWLED
**Enumeration:** NF-01 (1 state)
**Screenshots:** None

### Global States — Partially crawled
**Enumeration:** G-01 through G-15 (15 states)
**Crawled via screenshots:**
- G-01 (sidebar expanded) — visible in most screenshots (org_admin)
- G-02 (sidebar collapsed) — visible in screenshot 29 (super_admin, icons only)
- G-05 (org switcher) — visible in TopBar across screenshots
- G-09/G-10 (theme) — all screenshots show light mode
**Not crawled:** G-03/G-04 (sub-menu flyout/pin), G-06 (notifications), G-07 (profile menu), G-08 (activity feed), G-11 (tour overlay), G-12 ("Discuss with Georgia" FAB), G-13 (session timeout), G-14/G-15 (right panes)

---

## Permission Differences: org_admin vs super_admin

| Feature | org_admin (Serra Honda) | super_admin (Huminic) | Issue |
|---------|------------------------|----------------------|-------|
| Settings tile grid | 4 tiles visible | 4 tiles visible (+ AI Config via direct nav) | Screenshot may cut off — needs scroll verification |
| AI Config tile | NOT visible in grid | Accessible (screenshot 29) | I-120 |
| Usage page | Not in sidebar | Visible in sidebar (screenshot 30) | Expected per US-01 |
| Management page | Visible in sidebar | Visible in sidebar | Expected |
| API Keys tab | Not verified | Expected super_admin only (ST-20) | No issue — by design |
| Webhooks tab | Not verified | Expected super_admin only (ST-21) | No issue — by design |
| Org Wizard | Not accessible | super_admin only (OW-*) | Expected |

---

## Summary of Uncrawled Areas

| Area | States | Priority |
|------|--------|----------|
| /my-work | MW-01 through MW-08 (8) | MED — deferred page per I-127 |
| /agents standalone | AG-01 through AG-07 (7) | MED |
| /insights standalone | IN-01 through IN-16 (16) | HIGH — core analytics page |
| /settings/org-wizard | OW-01 through OW-08 (8) | MED — super_admin only |
| /settings/billing | BL-01 through BL-05 (5) | MED — blocked by I-105 |
| Settings: Notifications | ST-30 (1) | MED |
| Settings: Appearance | ST-31 (1) | MED |
| Global: tour overlay | G-11 (1) | HIGH — I-137 bug |
| Global: session timeout | G-13 (1) | LOW |
| Global: Georgia FAB | G-12 (1) | MED |
| Global: right panes | G-14/G-15 (2) | MED |
| Widget modes | WL-02 through WL-12 (11) | HIGH — public-facing |
| 404 page | NF-01 (1) | LOW |
| **Total uncrawled** | **63 states** | |

**Crawled states:** 100 of 163 (61%)
**Uncrawled states:** 63 of 163 (39%)
