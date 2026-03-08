# Sweep 2 Report — Centralize Findings & Build Continuity

**Date:** 2026-03-08
**Status:** COMPLETE

---

## Step 2A — ISSUES.md Created

**Source:** GAPS.md (81 items) + 10 architectural contradictions (Sweep 1) + 10 false positives (verification audit) + 1 stale AC reference (Sweep 1B discovery)

**Result:** `ISSUES.md` at root — 101 total items, 80 OPEN, 21 RESOLVED, 26 RC-blocking (19 unique after deduplication)

**GAPS.md disposition:** Retired — all 81 items migrated to ISSUES.md with sweep assignments, RC-blocking flags, and AC cross-references added. GAPS.md receives a retirement header below.

**Key enrichments over raw GAPS.md:**
- Every issue now has a target sweep assignment
- RC-blocking flag on each item
- AC ID cross-references where applicable
- Resolved items include evidence (quarantine, decision record, etc.)
- Duplicates explicitly noted (e.g., API-13 = AIO-04)
- False positives and contradictions tracked as first-class issue categories

---

## Step 2B — Continuity Matrix

Every RC-required UI surface traced through the full stack.

### Core Navigation & Shell

| UI Surface | AC ID(s) | Sweep | API Endpoint(s) | Data Source | Verification |
|---|---|---|---|---|---|
| Sidebar — 7 nav items | W1-AC-001 | — (done) | — (client-side routing) | Static config in Sidebar.tsx | Visual: all 7 items render |
| Sidebar — RBAC gating | W1-AC-002 | — (done) | GET /api/auth/me (role) | users.role_id → roles table | E2E: switch roles, verify visibility |
| TopBar — org switcher | W1-AC-003b,c | — (done) | POST /api/auth/switch-org | organizations table | E2E: switch org, verify context |
| TopBar — notifications | W1-AC-003d,e,f | — (done) | GET /api/notifications, PATCH .../read | notifications table (org-scoped) | E2E: create notification, verify badge |
| TopBar — activity feed | W1-AC-003 | Sweep 6.1 | GET /api/activity-log | **staticActivityFeed (MOCK)** → should be activity_log table | Gap: UI-06 — wire to real API |
| TopBar — theme toggle | W1-AC-003g | — (done) | — (localStorage) | Client-side | Visual: toggle works |
| Route structure | W1-AC-004 | — (done) | — (wouter routing) | App.tsx route config | E2E: navigate all routes |

### AI Chat (Main Page)

| UI Surface | AC ID(s) | Sweep | API Endpoint(s) | Data Source | Verification |
|---|---|---|---|---|---|
| Pipeline tiles (4) | W1-AC-010 | — (done) | GET /api/metrics/pipeline | warehouse_leads (14-day window, org-scoped) | Observability: count matches DB |
| Chat interface | W1-AC-011 | — (done) | POST /api/conversations, POST .../messages, POST /api/chat/:id/stream | conversations + messages tables | E2E: send message, verify AI response |
| Sub-menu panel — agents | W1-AC-012a,b | — (done) | GET /api/agents | agents table (org-scoped) | E2E: verify agent list renders |
| Sub-menu — conversations | W1-AC-012c | — (done) | GET /api/conversations?channel=ai-chat | conversations table | E2E: create conv, verify in list |
| Sub-menu — hunches | W1-AC-012e | — (done) | GET /api/hunches | hunches table | E2E: verify hunches render |
| Sub-menu — artifacts | W1-AC-012g | — (done) | — | Placeholder text | Visual: "Artifacts will appear here" renders |
| Chat upload/document | — | Sweep 10+ | — | **"Coming Soon" toast** | Deferred — FP-10 |

### TeamBox

| UI Surface | AC ID(s) | Sweep | API Endpoint(s) | Data Source | Verification |
|---|---|---|---|---|---|
| Conversation list | W1-AC-020,022 | — (done) | GET /api/conversations | conversations table (org-scoped) | E2E: verify list renders |
| Filters (channel, status) | W1-AC-021 | — (done) | GET /api/conversations?channel=X | Client-side filtering | E2E: filter by channel |
| Chat thread | W1-AC-023 | — (done) | GET /api/conversations/:id/messages | messages table | E2E: select conv, verify messages |
| Actions (reply, takeover) | W1-AC-024 | — (done) | POST .../messages, PATCH /api/conversations/:id | conversations + messages | E2E: reply, verify sent |
| File attachments | — | Sweep 10+ | — | **"Coming soon" toast** | Deferred — FP-9 |

### My Work

| UI Surface | AC ID(s) | Sweep | API Endpoint(s) | Data Source | Verification |
|---|---|---|---|---|---|
| Tasks tab | W1-AC-030 | — (done) | GET /api/tasks | tasks table (org-scoped) | E2E: create task, verify in list |
| Chat & Conversations tab | W1-AC-031 | Sweep 6.1 | — | **mockConversations from @/mocks/ (MOCK)** | Gap: UI-02 — must wire to real API |
| Appointments tab | W1-AC-031 | — (done) | GET /api/appointments | appointments table | E2E: verify appointments render |

### Sales

| UI Surface | AC ID(s) | Sweep | API Endpoint(s) | Data Source | Verification |
|---|---|---|---|---|---|
| Dashboard metrics | W1-AC-040 | — (done) | GET /api/metrics/dashboard | dashboard metrics (org-scoped) | Observability: values match DB |
| Sales agents list | W1-AC-041 | — (done) | GET /api/agents?department=sales | agents table | E2E: verify agents render |
| Lead summary | W1-AC-040 | — (done) | GET /api/vin/leads/summary | warehouse_leads | Observability: counts match DB |
| Recent activity | W1-AC-040 | Sweep 6 | — | **Hardcoded inline (STATIC)** | Gap: UI-05 |
| Sub-menu panel | W1-AC-042 | — (done) | — | Same as sales dashboard | Visual: panel renders |

### Service

| UI Surface | AC ID(s) | Sweep | API Endpoint(s) | Data Source | Verification |
|---|---|---|---|---|---|
| Dashboard metrics | W1-AC-050 | — (done) | GET /api/metrics/dashboard | dashboard metrics (org-scoped) | Observability: values match DB |
| Service agents | W1-AC-050 | — (done) | GET /api/agents?department=service | agents table | E2E: verify agents render |
| Campaigns tab | W1-AC-051 | — (done) | GET /api/campaigns?department=service | campaigns table | E2E: create campaign, verify |

### Marketing

| UI Surface | AC ID(s) | Sweep | API Endpoint(s) | Data Source | Verification |
|---|---|---|---|---|---|
| Dashboard metrics | W1-AC-060 | — (done) | GET /api/metrics/dashboard | dashboard metrics (org-scoped) | Observability: values match DB |
| Marketing agents | W1-AC-060 | — (done) | GET /api/agents?department=marketing | agents table | E2E: verify agents render |
| Campaigns tab | W1-AC-060 | — (done) | GET /api/campaigns?department=marketing | campaigns table | E2E: create campaign, verify |
| Studio tab | — | Sweep 10+ | — | **"Coming Soon" badge** | Deferred — FP-8 |

### Management

| UI Surface | AC ID(s) | Sweep | API Endpoint(s) | Data Source | Verification |
|---|---|---|---|---|---|
| Dashboard metrics | W1-AC-070 | — (done) | GET /api/metrics/dashboard | dashboard metrics (org-scoped) | Observability: values match DB |
| Activities tab | W1-AC-072 | — (done) | GET /api/activity-log | activity_log table (org-scoped) | E2E: verify log renders |
| Hunches tab | W1-AC-071 | — (done) | GET /api/hunches, POST .../generate, PATCH .../update | hunches table | E2E: generate hunch, verify |
| Insights tab | W1-AC-070 | Sweep 6.1 | — | **lib/insight-data.ts (MOCK)** | Gap: UI-01 — 100% mock |

### Settings

| UI Surface | AC ID(s) | Sweep | API Endpoint(s) | Data Source | Verification |
|---|---|---|---|---|---|
| User management | W1-AC-081 | — (done) | GET /api/users, POST, PATCH, DELETE | users table | E2E: CRUD user, verify |
| Widget configuration | W1-AC-082 | — (done) | GET /api/widgets, POST, PATCH, DELETE | widgets table | E2E: create widget, verify |
| Communication gate | W1-AC-083 | — (done) | PATCH /api/organizations/:id | organizations.outbound_enabled | E2E: toggle, verify outbound blocked |
| Agent configuration | — | — (done) | GET/POST/PATCH/DELETE /api/agents | agents table | E2E: CRUD agent |
| Tool toggling | — | Sweep 6.2 | — | **Demo mode toast** | Gap: UI-03 partial |
| KB URL add/scrape | — | Sweep 6.2 | — | **Demo mode toasts** | Gap: UI-03 partial |
| Embed instructions | — | Sweep 6.2 | — | **Demo mode toast** | Gap: FP-6 |
| Kill switch | — | Sweep 6.2 | — | **Demo mode toast** | Gap: FP-6 |

### Profile & Billing

| UI Surface | AC ID(s) | Sweep | API Endpoint(s) | Data Source | Verification |
|---|---|---|---|---|---|
| Profile info | — | — (done) | GET /api/auth/me, PATCH /api/users/me | users table | E2E: update profile |
| Password change | — | — (done) | POST /api/auth/change-password | users table | E2E: change password |
| Photo upload | — | — (done) | POST /api/users/me/photo | File system + users.avatar | E2E: upload photo |
| Billing display | — | Sweep 10+ | — | **Hardcoded + demo toasts** | Deferred — FP-5 |

### Widget & Landing Pages

| UI Surface | AC ID(s) | Sweep | API Endpoint(s) | Data Source | Verification |
|---|---|---|---|---|---|
| Widget embed JS | W1-AC-110 | — (done) | GET /widget/nexxus-widget.js | Static JS served | OWNER-TEST: embed on external page |
| Widget public lookup | W1-AC-110 | — (done) | GET /api/widgets/public/:widgetCode | widgets table | E2E: fetch widget config |
| Landing page (public) | — | Sweep 7 | GET /api/public/landing/:slug | organizations.slug | OWNER-TEST: visit landing page |

### Gaps identified in Continuity Matrix

| Gap | Issue ID | RC-blocking |
|---|---|---|
| TopBar activity feed uses static data | UI-06 | yes |
| My Work chat tab uses mock imports | UI-02 | yes |
| Insights 100% mock | UI-01 | yes |
| Sales recent activity hardcoded | UI-05 | no |
| Settings demo-mode features | UI-03 | partial |
| Billing hardcoded | UI-04 | no (deferred) |
| Marketing Studio placeholder | FP-8 | no (deferred) |
| TeamBox file attachments placeholder | FP-9 | no (deferred) |
| Chat upload/document placeholder | FP-10 | no (deferred) |

---

## Step 2C — Observability Matrix

Every displayed value traced to its source, computation, and data type.

### Main Page (AI Chat)

| UI Surface | Endpoint | Table/Source | Computation | Displayed Value | Data Type | Owner Test | Test Status |
|---|---|---|---|---|---|---|---|
| Active Pipeline tile | GET /api/metrics/pipeline | warehouse_leads | COUNT WHERE status IN pipeline statuses, last 14 days | Integer count | real | | pending |
| New Leads tile | GET /api/metrics/pipeline | warehouse_leads | COUNT WHERE status='new', last 14 days | Integer count | real | | pending |
| Appointments tile | GET /api/metrics/pipeline | warehouse_leads | COUNT WHERE status='appointment', last 14 days | Integer count | real | | pending |
| Sold tile | GET /api/metrics/pipeline | warehouse_leads | COUNT WHERE status='sold', last 14 days | Integer count | real | | pending |
| Chat AI response | POST /api/chat/:id/stream | messages table + Anthropic API | Streamed AI completion | Message text | real | | pending |
| Agent list (sub-menu) | GET /api/agents | agents table | WHERE org_id = current | Agent names/avatars | real | | pending |
| Conversation list (sub-menu) | GET /api/conversations?channel=ai-chat | conversations table | WHERE org_id AND channel | Conv titles | real | | pending |
| Hunches (sub-menu) | GET /api/hunches | hunches table | WHERE org_id | Hunch descriptions | real | | pending |
| Artifacts (sub-menu) | — | — | — | "Artifacts will appear here" | static | | pending |

### TeamBox

| UI Surface | Endpoint | Table/Source | Computation | Displayed Value | Data Type | Owner Test | Test Status |
|---|---|---|---|---|---|---|---|
| Conversation list | GET /api/conversations | conversations table | WHERE org_id, ordered | Conv list with metadata | real | | pending |
| Messages in thread | GET /api/conversations/:id/messages | messages table | WHERE conversation_id | Message list | real | | pending |
| Reply/send message | POST .../messages | messages table | INSERT | Confirmation | real | | pending |
| Takeover action | PATCH /api/conversations/:id | conversations table | UPDATE assigned_to | Status update | real | | pending |

### My Work

| UI Surface | Endpoint | Table/Source | Computation | Displayed Value | Data Type | Owner Test | Test Status |
|---|---|---|---|---|---|---|---|
| Tasks list | GET /api/tasks | tasks table | WHERE org_id | Task cards | real | | pending |
| Task status update | PATCH /api/tasks/:id | tasks table | UPDATE status | Confirmation | real | | pending |
| Chat & Conversations tab | — | @/mocks/messages, @/mocks/conversations | — | Mock conv list | **mock** | | **blocked — UI-02** |
| Appointments tab | GET /api/appointments | appointments table | WHERE org_id | Appointment cards | real | | pending |

### Sales

| UI Surface | Endpoint | Table/Source | Computation | Displayed Value | Data Type | Owner Test | Test Status |
|---|---|---|---|---|---|---|---|
| Conversations metric | GET /api/metrics/dashboard | dashboard metrics | Aggregated count | Integer | real | | pending |
| Messages metric | GET /api/metrics/dashboard | dashboard metrics | Aggregated count | Integer | real | | pending |
| Agents list | GET /api/agents?department=sales | agents table | WHERE department='sales' | Agent cards | real | | pending |
| Lead summary tiles | GET /api/vin/leads/summary | warehouse_leads | COUNT by status | Integer counts | real | | pending |
| Recent Activity section | — | Inline hardcoded | — | 5 static items | **static** | | **blocked — UI-05** |

### Service

| UI Surface | Endpoint | Table/Source | Computation | Displayed Value | Data Type | Owner Test | Test Status |
|---|---|---|---|---|---|---|---|
| Dashboard metrics | GET /api/metrics/dashboard | dashboard metrics | Aggregated | Integer counts | real | | pending |
| Service agents | GET /api/agents?department=service | agents table | WHERE department='service' | Agent cards | real | | pending |
| Campaigns list | GET /api/campaigns?department=service | campaigns table | WHERE department='service' | Campaign cards | real | | pending |

### Marketing

| UI Surface | Endpoint | Table/Source | Computation | Displayed Value | Data Type | Owner Test | Test Status |
|---|---|---|---|---|---|---|---|
| Dashboard metrics | GET /api/metrics/dashboard | dashboard metrics | Aggregated | Integer counts | real | | pending |
| Marketing agents | GET /api/agents?department=marketing | agents table | WHERE department='marketing' | Agent cards | real | | pending |
| Campaigns list | GET /api/campaigns?department=marketing | campaigns table | WHERE department='marketing' | Campaign cards | real | | pending |
| Studio tab | — | — | — | "Coming Soon" badge | **static** | | deferred |

### Management

| UI Surface | Endpoint | Table/Source | Computation | Displayed Value | Data Type | Owner Test | Test Status |
|---|---|---|---|---|---|---|---|
| Dashboard metrics | GET /api/metrics/dashboard | dashboard metrics | Aggregated | Integer counts | real | | pending |
| Activities list | GET /api/activity-log | activity_log table | WHERE org_id | Activity entries | real | | pending |
| Hunches list | GET /api/hunches | hunches table | WHERE org_id | Hunch cards | real | | pending |
| Generate hunches | POST /api/hunches/generate | hunches table + AI | AI-generated insights | New hunch cards | real | | pending |
| Insights tab | — | lib/insight-data.ts | — | 23+ chart/table sections | **mock** | | **blocked — UI-01** |

### TopBar

| UI Surface | Endpoint | Table/Source | Computation | Displayed Value | Data Type | Owner Test | Test Status |
|---|---|---|---|---|---|---|---|
| Notifications badge | GET /api/notifications/unread-count | notifications table | COUNT WHERE read=false | Integer badge | real | | pending |
| Notification dropdown | GET /api/notifications | notifications table | WHERE org_id | Notification list | real | | pending |
| Activity feed | — | staticActivityFeed (activity-utils.ts) | — | 8 static items | **mock** | | **blocked — UI-06** |
| Org switcher | POST /api/auth/switch-org | organizations table | — | Org name | real | | pending |

### Settings

| UI Surface | Endpoint | Table/Source | Computation | Displayed Value | Data Type | Owner Test | Test Status |
|---|---|---|---|---|---|---|---|
| User list | GET /api/users | users table | WHERE org_id | User cards | real | | pending |
| Role list | GET /api/roles | roles table | All roles | Role options | real | | pending |
| Widget list | GET /api/widgets | widgets table | WHERE org_id | Widget cards | real | | pending |
| Agent list | GET /api/agents | agents table | WHERE org_id | Agent config cards | real | | pending |
| Org settings | GET /api/settings/org | organizations table | WHERE id=current | Org config | real | | pending |
| Documents | GET /api/documents | documents table | WHERE org_id | Document list | real | | pending |
| Tool toggle | — | — | — | Demo toast | **static** | | blocked — UI-03 |
| KB URL features | — | — | — | Demo toasts | **static** | | blocked — UI-03 |
| Kill switch | — | — | — | Demo toast | **static** | | blocked — UI-03 |

### Profile & Billing

| UI Surface | Endpoint | Table/Source | Computation | Displayed Value | Data Type | Owner Test | Test Status |
|---|---|---|---|---|---|---|---|
| Profile info | GET /api/auth/me | users table | Current user | User profile | real | | pending |
| Usage stats | GET /api/usage/summary | usage_events table | Aggregated | Usage numbers | real | | pending |
| Billing display | — | Inline hardcoded | — | Demo data | **static** | | deferred |
| Invoice buttons | — | — | — | Demo toasts | **static** | | deferred |

### Widget & Outbound

| UI Surface | Endpoint | Table/Source | Computation | Displayed Value | Data Type | Owner Test | Test Status |
|---|---|---|---|---|---|---|---|
| Widget embed (external) | GET /widget/nexxus-widget.js | Static JS | — | Widget UI | real | OWNER-TEST | pending |
| Widget chat channel | POST from widget → /api/conversations | conversations + messages | Widget creates conv | Chat messages | real | OWNER-TEST | pending |
| Widget voice channel | VAPI integration | — | Console.log only | — | **mock** | OWNER-TEST | **blocked — AIO-01** |
| Widget video channel | Tavus integration | — | Not implemented | — | **mock** | OWNER-TEST | **blocked — AIO-02** |
| Widget form channel | POST from widget | — | Form submission | Submission data | real | OWNER-TEST | pending |
| SMS outbound | TextMagic API | outbound_log table | Campaign execution | SMS delivery | real | OWNER-TEST | pending |
| Email outbound | Resend API | outbound_log table | Campaign execution | Email delivery | real | OWNER-TEST | pending |
| Landing page (public) | GET /api/public/landing/:slug | organizations table | Slug lookup | Landing page HTML | real | OWNER-TEST | pending |

### Observability Matrix Summary

| Data Type | Count | RC-blocking |
|---|---|---|
| real | ~52 rows | 0 (need verification tests) |
| mock | 5 rows | 4 (UI-01, UI-02, UI-06, AIO-01) |
| static | 8 rows | 1 (AIO-02 effectively mock) |
| **Total** | **~65 rows** | **5 RC-blocking mock/static rows** |

---

## GAPS.md Disposition

GAPS.md is now retired. All 81 items have been migrated to ISSUES.md with enrichments (sweep assignments, RC-blocking flags, AC cross-references). A retirement header has been added to GAPS.md.

---

## Self-Certification

- [x] 2A: ISSUES.md created with 101 items, all GAPS.md items migrated, contradictions and FPs included
- [x] 2B: Continuity Matrix traces every RC-required UI surface through AC → API → Data → Verification
- [x] 2C: Observability Matrix maps every displayed value to source, computation, data type, and owner-test flag
- [x] GAPS.md retired with header notice
- [x] All gaps found in matrices are cross-referenced to ISSUES.md entries
