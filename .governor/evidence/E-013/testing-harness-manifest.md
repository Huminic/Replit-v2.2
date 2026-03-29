# Testing Harness Manifest — Complete Sprint Definitions
**Date:** 2026-03-26
**Phase:** qa_resolve_loop → verification
**Target:** dev.huminicdev.com
**Protocol:** Entry gate (A1-A10) → Test agent executes → Exit gate (B1-B11) → Cross-sign → Evidence

---

## Execution Map

```
WAVE 1 — Foundation (parallel, no dependencies):
  T-013  [FE]  Navigation, UI, Mobile
  T-014  [DT]  Data Flow, Metrics, Billing Baseline
  T-015  [AU]  RBAC, Isolation, Org Switcher, Auth Flows
  T-020  [BE]  Static Code Scan
  T-021  [AU]  Accessibility (axe-core)

WAVE 2 — Per-Section Functional Depth (parallel by section):
  T-022a [FE]  AI Chat — streaming, favorites, delete, multi-turn, task, search
  T-022b [DT]  Sales — agents, pipeline, calendar, agent conversations
  T-022c [DT]  Service — campaigns, Nancy, appointment booking
  T-022d [FE]  Marketing — Studio, filters, gallery, creative agents
  T-022e [FE]  Settings & Profile — CRUD, KB, system prompt, photo, password
  T-022f [FE]  Landing & Widgets — 5 dealers, embed code, widget JS, appointments

WAVE 3 — Integration Gate (sequential):
  T-016  [IN]  VAPI, Tavus, CommGate, MCP, Webhooks, Embed

WAVE 4 — Comms (parallel):
  T-017a [BE]  Sales inbound/outbound voice + SMS
  T-017b [BE]  Service campaigns + STOP/opt-out + after-hours

WAVE 5 — E2E Synthesis (sequential):
  T-018  [FE]  TeamBox unified inbox — all channels, real-time, appointments, kill switch
  T-019  [FE]  Chat & Agent usability + edge cases + streaming perf
```

**Total: 16 sprints. 5 waves. Waves 1 and 2 can overlap (11 sprints parallel). Waves 3-5 sequential.**

---

# WAVE 1 — Foundation

---

## T-013: Navigation, UI Integrity & Mobile [FE]

### Outcome
Prove that every user can navigate the entire application without dead links, mismatched labels, or console errors — on both desktop and mobile viewports. Every popout/sub-menu link must land on the correct page/tab. All SEC-01 through SEC-08 UI fixes must be verified live. Mobile layout must not break, overflow, or hide content. Validates US-018 (TeamBox Filtering), US-020 (History Preserve), I-125 (popout links).

### Pre-Execution Requirements
- Dev build running on dev.huminicdev.com (PM2 process healthy)
- Playwright MCP browser available
- Auth credentials for org_admin login

### Acceptance Criteria
| ID | Criterion | Evidence Type |
|---|---|---|
| T-013.AC1 | Every popout/sub-menu link across all 8 sections navigates to correct page/tab | Screenshot per click |
| T-013.AC2 | TopBar shows "Reset Tour" (not "Take a Tour") | Screenshot |
| T-013.AC3 | TopBar profile dropdown has NO Billing link | Screenshot |
| T-013.AC4 | My Work NOT in sidebar navigation | Screenshot |
| T-013.AC5 | Service sub-menu first item is "Campaigns" | Screenshot |
| T-013.AC6 | Marketing sub-menu has NO "Campaigns" link, single agent section (not duplicate) | Screenshot |
| T-013.AC7 | Manage sub-menu has 5 items: Insights, Hunches, System Log, User Chats, Billing | Screenshot |
| T-013.AC8 | Campaign Safety dismiss X works and persists on reload | Screenshot sequence |
| T-013.AC9 | Campaign action buttons show tooltips on hover | Screenshot |
| T-013.AC10 | Widget landing page menu shows "Instant Call Back" with phone input form | Screenshot |
| T-013.AC11 | No console errors on any page load (all 8 sections) | Console log capture |
| T-013.AC12 | Mobile viewport (375x812): key pages render without overflow, mobile nav works | Screenshot x5 |

### Ghost Gates
| Gate | Check | Pass Condition |
|---|---|---|
| G-013.1 | Every link was clicked, not just inspected | Screenshot evidence shows navigation result, not just link text |
| G-013.2 | Console capture includes ALL pages | 8+ page loads with zero error-level entries |
| G-013.3 | Mobile test uses real viewport resize, not just CSS inspection | Playwright viewport set to 375x812 |

### Evidence Required
- `evidence/T-013/screenshots/` — one per AC
- `evidence/T-013/console-logs/` — captured per page
- `evidence/T-013/post-sprint-report.md` — AC results table with PASS/FAIL
- `evidence/T-013/mobile-viewport/` — mobile screenshots

---

## T-014: Data Flow, Metrics & Billing Baseline [DT]

### Outcome
Prove that every data tile, metric, activity feed, and insight shows real API data. Form submissions from landing pages and widgets must create conversations in TeamBox within 30 seconds. Billing API state must be documented as a testable baseline. Validates US-007 (Pipeline Review), US-023 (Metric Review), US-025 (Executive Insight), US-003 (Form to Two-Way SMS), US-024 (Source Analysis).

### Pre-Execution Requirements
- API accessible at dev.huminicdev.com
- At least one org with warehouse data (Serra Honda)
- Widget landing page accessible at /p/serra-honda

### Acceptance Criteria
| ID | Criterion | Evidence Type |
|---|---|---|
| T-014.AC1 | Widget contact form POST → conversation appears in TeamBox within 30s | API timing proof |
| T-014.AC2 | Landing page contact form POST → conversation appears in TeamBox within 30s | API timing proof |
| T-014.AC3 | Sales Dashboard 7 metric tiles match /api/vin/leads/summary values | Tile-by-tile comparison table |
| T-014.AC4 | Sales Recent Activity shows entries from /api/activity-log (not hardcoded) | API + DOM comparison |
| T-014.AC5 | Sales Conversion Rate change field is 0 (not absolute rate) | DOM inspection |
| T-014.AC6 | Insights page renders data on Sales, Service, Marketing, Manage tabs | Screenshot x4 |
| T-014.AC7 | System Log shows timestamped activity entries | Screenshot + API |
| T-014.AC8 | Hunches generate button produces hunch card | Screenshot + API |
| T-014.AC9 | AI Chat metric drill-down shows breakdown from /api/metrics/pipeline/details | Screenshot + API |
| T-014.AC10 | Billing API: GET /api/billing/summary returns structured response (document state) | API response |
| T-014.AC11 | Billing API: GET /api/billing/plans returns catalog (document plan count) | API response |
| T-014.AC12 | Marketing metrics render without hardcoded change/trend values (SEC-05 fix) | DOM inspection |

### Ghost Gates
| Gate | Check | Pass Condition |
|---|---|---|
| G-014.1 | Tile-by-tile comparison is documented, not summarized | Table with DOM value + API value for each tile |
| G-014.2 | Form→TeamBox timing is measured, not assumed | Timestamp of POST and timestamp of conversation appearance |
| G-014.3 | Billing baseline documents actual API response, not "not configured" | Full JSON response captured |

### Evidence Required
- `evidence/T-014/metrics-comparison.md` — tile-by-tile table
- `evidence/T-014/form-to-teambox.md` — timing proof
- `evidence/T-014/billing-baseline.json` — actual API responses
- `evidence/T-014/post-sprint-report.md`

---

## T-015: RBAC, Multi-Tenant Isolation & Auth Flows [AU]

### Outcome
Prove no user can see another organization's data, role-based access controls work, org switching reloads all data correctly, and account recovery flows function. This is a launch blocker — if isolation fails, nothing else matters. Validates US-022 (Multi-Store Oversight), S-9.AC5/AC6 (cross-org isolation).

### Pre-Execution Requirements
- Login credentials for all 5 dealer org_admin accounts
- Login credentials for super_admin (Huminic) and partner_admin (Cage)
- Forgot-password email endpoint functional (Resend)

### Acceptance Criteria
| ID | Criterion | Evidence Type |
|---|---|---|
| T-015.AC1 | Serra Honda admin sees ONLY Serra Honda data on all pages | Screenshot + text search |
| T-015.AC2 | Serra Nissan admin sees ONLY Serra Nissan data | Screenshot + text search |
| T-015.AC3 | Tony Serra Ford admin sees ONLY Tony Serra Ford data | Screenshot + text search |
| T-015.AC4 | Ford of Columbia admin sees ONLY Ford of Columbia data | Screenshot + text search |
| T-015.AC5 | Hyundai of Columbia admin sees ONLY Hyundai of Columbia data | Screenshot + text search |
| T-015.AC6 | Partner admin (Cage) sees all 5 dealership data in management | Screenshot |
| T-015.AC7 | Partner admin does NOT see Huminic data | Text search proof |
| T-015.AC8 | Settings tiles: super_admin=7, partner_admin=7(AI read-only), org_admin=6 | Screenshot per role |
| T-015.AC9 | Management page redirects non-management roles to home | Navigation proof |
| T-015.AC10 | Org switcher: switch org → all page data refreshes to new org | Screenshot before + after |
| T-015.AC11 | Forgot password: trigger reset → email in Resend logs → reset page loads | Resend log + screenshot |
| T-015.AC12 | No PM2 logs contain "Could not resolve organization from assistantId" (S-9.AC2) | Log grep proof |

### Ghost Gates
| Gate | Check | Pass Condition |
|---|---|---|
| G-015.1 | Isolation test checks ALL data areas, not just page headers | Text search covers conversations, metrics, agents, settings per org |
| G-015.2 | Org switcher test verifies DATA changed, not just header | Compare metric values before and after switch |
| G-015.3 | 5 complete login cycles executed (not reused sessions) | Fresh login per org, not cached tokens |

### Evidence Required
- `evidence/T-015/isolation/` — per-org screenshots + text search results
- `evidence/T-015/rbac-matrix.md` — role vs visible tiles/pages matrix
- `evidence/T-015/org-switch-proof.md` — before/after data comparison
- `evidence/T-015/post-sprint-report.md`

---

## T-020: Static Code Scan [BE]

### Outcome
Prove the codebase has no lurking time bombs — no hardcoded mock data, no missing auth middleware, no cross-org query leaks, no abandoned TODOs marking shipped-but-unfinished features. Validates code integrity foundation.

### Pre-Execution Requirements
- Read access to full codebase
- grep/ripgrep available

### Acceptance Criteria
| ID | Criterion | Evidence Type |
|---|---|---|
| T-020.AC1 | No hardcoded static arrays used as data source in page components | Grep results |
| T-020.AC2 | All API routes in server/routes/ have auth middleware | Route-by-route audit |
| T-020.AC3 | All DB queries returning user-visible data filter by org_id | Query audit |
| T-020.AC4 | No unused imports in SEC-modified files | Grep results |
| T-020.AC5 | TODO/FIXME/HACK comment count + locations documented | Full list |
| T-020.AC6 | No production credentials in committed code | Grep for API keys, passwords |
| T-020.AC7 | Key interactive elements have data-testid attributes | Coverage count |

### Ghost Gates
| Gate | Check | Pass Condition |
|---|---|---|
| G-020.1 | Auth middleware audit covers EVERY route file, not a sample | All files in server/routes/ checked |
| G-020.2 | Org_id filter check covers queries in storage.ts AND route handlers | Both layers checked |

### Evidence Required
- `evidence/T-020/auth-audit.md` — route-by-route results
- `evidence/T-020/org-filter-audit.md` — query-by-query results
- `evidence/T-020/scan-results.md` — all grep results
- `evidence/T-020/post-sprint-report.md`

---

## T-021: Accessibility [AU]

### Outcome
Prove the application meets basic accessibility standards on all major pages. Produces an axe-core report documenting violations by severity. Validates S-9.AC8.

### Pre-Execution Requirements
- @axe-core/playwright installed
- Playwright MCP browser available

### Acceptance Criteria
| ID | Criterion | Evidence Type |
|---|---|---|
| T-021.AC1 | axe-core scan on AI Chat (/) — violations documented by severity | axe report |
| T-021.AC2 | axe-core scan on TeamBox (/teambox) | axe report |
| T-021.AC3 | axe-core scan on Sales (/sales) | axe report |
| T-021.AC4 | axe-core scan on Service (/service) | axe report |
| T-021.AC5 | axe-core scan on Marketing (/marketing) | axe report |
| T-021.AC6 | axe-core scan on Management (/management) | axe report |
| T-021.AC7 | axe-core scan on Settings (/settings/system) | axe report |
| T-021.AC8 | axe-core scan on Landing Page (/p/serra-honda) | axe report |
| T-021.AC9 | Summary: total violations, critical count, serious count | Summary table |

### Ghost Gates
| Gate | Check | Pass Condition |
|---|---|---|
| G-021.1 | Scans ran on actual rendered pages (not just HTML source) | Playwright page fully loaded before scan |
| G-021.2 | Zero critical violations | Critical count = 0 (serious may be documented and deferred) |

### Evidence Required
- `evidence/T-021/axe-reports/` — one JSON per page
- `evidence/T-021/summary.md` — violation counts by severity
- `evidence/T-021/post-sprint-report.md`

---

# WAVE 2 — Per-Section Functional Depth

---

## T-022a: AI Chat Functional Depth [FE]

### Outcome
Prove that the AI chat interface is a high-quality, reliable tool for daily dealership work. Streaming must deliver first token within 8 seconds. Multi-turn conversations must maintain context. Favorites must persist across sessions. Chat history must be deletable and scrollable. Task creation via chat must work. Web search must return results. The chat must be conversational, not report-formatted. Validates US-006 (CRM Guru), US-016 (AI List Gen), US-020 (History Preserve), US-030 (CRM Cross-Ref), S-1.AC1-AC17.

### Pre-Execution Requirements
- Chat API functional
- Org with VIN lead data (Serra Honda)
- 20+ seeded conversations for scroll test

### Acceptance Criteria
| ID | Criterion | Evidence Type |
|---|---|---|
| T-022a.AC1 | Streaming first token arrives within 8 seconds (S-1.AC4) | Timing measurement |
| T-022a.AC2 | Thinking indicators visible during AI processing (S-1.AC5) | Screenshot |
| T-022a.AC3 | VIN data query returns real lead data (S-1.AC6) | Conversation log |
| T-022a.AC4 | Web search returns results (S-1.AC7) | Conversation log |
| T-022a.AC5 | Task creation via chat works — task appears in DB (S-1.AC8) | Query proof |
| T-022a.AC6 | Multi-turn: follow-up references prior answer coherently (S-1.AC9) | Conversation log |
| T-022a.AC7 | Conversational tone — no "##" headers or markdown tables (S-1.AC10) | Response analysis |
| T-022a.AC8 | Favorites: add → navigate away → return → still favorited (S-1.AC12) | Screenshot sequence |
| T-022a.AC9 | Chat history delete: click delete → removed from list + API (S-1.AC13) | API + DOM proof |
| T-022a.AC10 | Chat history scroll: 20+ items, ScrollArea works (S-1.AC14) | Screenshot |
| T-022a.AC11 | Chat edge cases: empty input, 10K chars, non-English, rapid fire — no crash (Gap 4) | Test results |
| T-022a.AC12 | Page loads for all 7 roles without console errors (S-1.AC1) | Console log x7 |

### Ghost Gates
| Gate | Check | Pass Condition |
|---|---|---|
| G-022a.1 | Streaming timing is MEASURED (Date.now before/after), not estimated | Millisecond measurement in evidence |
| G-022a.2 | Multi-turn test has 3+ turns, not just 2 | Conversation log shows 3+ exchanges |
| G-022a.3 | Edge case tests actually sent the inputs, not just asserted input validation | Evidence shows server responses to bad inputs |

### Evidence Required
- `evidence/T-022a/streaming-timing.md` — ms measurements
- `evidence/T-022a/conversation-logs/` — per-test conversation transcripts
- `evidence/T-022a/edge-cases.md` — inputs and responses
- `evidence/T-022a/post-sprint-report.md`

---

## T-022b: Sales Functional Depth [DT]

### Outcome
Prove the Sales page is a reliable operational dashboard. All 4 agents must be visible with correct names and descriptions. Pipeline data must match warehouse queries. The calendar must show VAPI-generated appointments. Each agent must respond intelligently to domain questions. Validates US-007 (Pipeline Review), US-026 (Coaching), US-029 (Email Draft), S-3.AC1-AC16.

### Pre-Execution Requirements
- Serra Honda org with agents, warehouse data, and at least one VAPI appointment

### Acceptance Criteria
| ID | Criterion | Evidence Type |
|---|---|---|
| T-022b.AC1 | 4 agents visible: Caroline, Data Guru, Sales Coach, Communication Writer (S-3.AC1) | Screenshot |
| T-022b.AC2 | Agent descriptions not truncated (S-3.AC2) | Screenshot |
| T-022b.AC3 | "Data Guru" displayed, not "CRM Guru" (S-3.AC3) | Text search |
| T-022b.AC4 | Pipeline data renders with status breakdown (S-3.AC6) | Screenshot |
| T-022b.AC5 | Pipeline values match warehouse_leads query (S-3.AC7) | DB query + DOM comparison |
| T-022b.AC6 | Calendar shows appointment with source=vapi (S-3.AC8) | Screenshot |
| T-022b.AC7 | Data Guru returns real VIN data (S-3.AC9) | Conversation log |
| T-022b.AC8 | Sales Coach provides coaching advice (S-3.AC10) | Conversation log |
| T-022b.AC9 | Communication Writer produces email draft (S-3.AC11) | Conversation log |
| T-022b.AC10 | Waiting on Response / Appointments Set change values documented (S-3.AC16) | API response |
| T-022b.AC11 | Active Pipeline consistency between two data sources (S-3.AC14) | API comparison |

### Ghost Gates
| Gate | Check | Pass Condition |
|---|---|---|
| G-022b.1 | Pipeline comparison queries the DB directly, not just the API | Query output vs DOM |
| G-022b.2 | Each agent chat test asks a domain-relevant question, not "hello" | Conversation shows specific sales question |

### Evidence Required
- `evidence/T-022b/agent-conversations/` — one per agent
- `evidence/T-022b/pipeline-comparison.md` — DB vs DOM table
- `evidence/T-022b/post-sprint-report.md`

---

## T-022c: Service Functional Depth [DT]

### Outcome
Prove the Service page supports the full campaign lifecycle. New Campaign button and CSV Upload must be accessible. Campaign detail dialog must show all fields. Only Nancy Gaston must appear on Agents tab with substantive instructions. Nancy must intelligently discuss recalls and book appointments. Validates US-009 (Oil Change Campaign), US-010 (Recall Notification), US-011 (Service Metrics), US-014 (Service Agent FAQ), S-4.AC1-AC18.

### Pre-Execution Requirements
- Serra Honda org with Nancy Gaston agent
- At least one existing campaign for detail dialog test

### Acceptance Criteria
| ID | Criterion | Evidence Type |
|---|---|---|
| T-022c.AC1 | Campaigns tab is first (S-4.AC1), no Dashboard tab (S-4.AC2) | Screenshot |
| T-022c.AC2 | New Campaign button visible without scrolling (S-4.AC3) | Screenshot |
| T-022c.AC3 | CSV Upload button prominent (S-4.AC4) | Screenshot |
| T-022c.AC4 | Campaign detail dialog shows all fields (S-4.AC5) | Screenshot |
| T-022c.AC5 | Insights tab shows KPI tiles (S-4.AC6) | Screenshot |
| T-022c.AC6 | Only Nancy Gaston on Agents tab (S-4.AC7) | Screenshot |
| T-022c.AC7 | Nancy has instructions > 100 chars (S-4.AC8) | Query proof |
| T-022c.AC8 | Nancy responds to recall question intelligently (S-4.AC11) | Conversation log |
| T-022c.AC9 | Nancy books appointment when asked (S-4.AC12) | Query proof |
| T-022c.AC10 | Appointment appears in Service Calendar | Screenshot |

### Ghost Gates
| Gate | Check | Pass Condition |
|---|---|---|
| G-022c.1 | Nancy is the ONLY agent — count assertion, not just name check | Exactly 1 card visible |
| G-022c.2 | Appointment booking creates real DB record | Query shows new appointment row |

### Evidence Required
- `evidence/T-022c/campaign-ui/` — screenshots of create/detail/CSV
- `evidence/T-022c/nancy-conversations/` — recall + booking transcripts
- `evidence/T-022c/post-sprint-report.md`

---

## T-022d: Marketing & Studio Functional Depth [FE]

### Outcome
Prove the Marketing page and Studio creative tools work as a content creation hub. All 4 tabs must render correctly. Studio filter pills must filter content. The gallery must show real artifacts. Each of the 5 marketing agents must produce domain-relevant output — Photo Studio generates images, Video Producer creates video content, Copywriter writes ad copy, Creative Director provides direction, Market Intel delivers analysis. Validates S-5.AC1-AC15.

### Pre-Execution Requirements
- Marketing page accessible
- FAL.ai proxy functional (for Photo Studio — I-102 may block this)

### Acceptance Criteria
| ID | Criterion | Evidence Type |
|---|---|---|
| T-022d.AC1 | 4 tabs: Dashboard, Agents, Studio, Insights (S-5.AC3) | Screenshot |
| T-022d.AC2 | No campaign data fetching (S-5.AC2) | Code grep proof |
| T-022d.AC3 | Studio filter pills visible: All, Images, Videos, Copy, Scores, Voiceovers, Radar (S-5.AC4) | Screenshot |
| T-022d.AC4 | Studio filters work: click Images → only images shown (S-5.AC5) | Screenshot |
| T-022d.AC5 | StudioGallery shows real artifacts (S-5.AC13) | Screenshot |
| T-022d.AC6 | All 5 marketing agent cards visible with descriptions (S-5.AC6) | Screenshot |
| T-022d.AC7 | Dashboard tiles match API values (S-5.AC7) | Tile comparison table |
| T-022d.AC8 | Photo Studio produces image artifact (S-5.AC8) — or I-102 documented | Conversation log or I-102 status |
| T-022d.AC9 | Copywriter produces ad copy (S-5.AC9) | Conversation log |
| T-022d.AC10 | Video Producer responds with video concept (S-5.AC14) | Conversation log |
| T-022d.AC11 | Market Intel provides analysis (S-5.AC15) | Conversation log |

### Ghost Gates
| Gate | Check | Pass Condition |
|---|---|---|
| G-022d.1 | Studio filter test clicks a pill AND verifies content changed | Before/after screenshot showing different items |
| G-022d.2 | If I-102 blocks Photo Studio, the failure is documented, not skipped silently | Explicit I-102 reference in AC8 result |

### Evidence Required
- `evidence/T-022d/studio-screenshots/` — filter pill states
- `evidence/T-022d/agent-conversations/` — one per agent
- `evidence/T-022d/post-sprint-report.md`

---

## T-022e: Settings & Profile Functional Depth [FE]

### Outcome
Prove that all settings sections are functional — not just rendering, but actually working. User Management CRUD must create, edit, deactivate users. Knowledge Base must accept file uploads. System prompt changes must affect AI chat behavior. Profile photo upload must work. Password change must work and the new password must be usable for login. Validates S-7.AC1-AC21.

### Pre-Execution Requirements
- super_admin login (for full settings access)
- Test file for KB upload
- Test user to create/edit/deactivate

### Acceptance Criteria
| ID | Criterion | Evidence Type |
|---|---|---|
| T-022e.AC1 | All 7 settings tiles render for super_admin (S-7.AC1) | Screenshot |
| T-022e.AC2 | No agents in settings popout (S-7.AC2) | Screenshot |
| T-022e.AC3 | User Management: add user → appears in list (S-7.AC9) | Screenshot + API |
| T-022e.AC4 | User Management: edit user → changes persist (S-7.AC9) | Screenshot + API |
| T-022e.AC5 | User Management: deactivate user → marked inactive (S-7.AC9) | Screenshot + API |
| T-022e.AC6 | Knowledge Base: upload file → appears in table (S-7.AC12) | Screenshot |
| T-022e.AC7 | Knowledge Base: delete file → removed (S-7.AC12) | Screenshot |
| T-022e.AC8 | AI Config: change system prompt → chat response reflects change (S-7.AC13) | Before/after conversation |
| T-022e.AC9 | Business hours: set hours → after-hours message triggers (S-7.AC14) | Log proof |
| T-022e.AC10 | Profile photo upload works (S-7.AC17) | Screenshot |
| T-022e.AC11 | Profile edit saves name/email (S-7.AC18) | Screenshot + reload verify |
| T-022e.AC12 | Change password → login with new password works (S-7.AC19) | Login proof |
| T-022e.AC13 | Notification data comes from real API (S-7.AC21) | API proof |
| T-022e.AC14 | Activity Feed shows /api/activity-log data (S-7.AC7) | API comparison |

### Ghost Gates
| Gate | Check | Pass Condition |
|---|---|---|
| G-022e.1 | System prompt test proves causality: change prompt, get different response | Two conversations with same question, different prompts, different answers |
| G-022e.2 | Password change test actually logs in with the NEW password | Login response with new password captured |
| G-022e.3 | User CRUD operations verified via API, not just UI | API GET confirms create/edit/deactivate state |

### Evidence Required
- `evidence/T-022e/user-crud/` — create, edit, deactivate screenshots + API proof
- `evidence/T-022e/kb-upload/` — upload + delete screenshots
- `evidence/T-022e/system-prompt-test.md` — before/after conversations
- `evidence/T-022e/post-sprint-report.md`

---

## T-022f: Landing Pages & Widget Functional Depth [FE]

### Outcome
Prove that every dealer's public-facing landing page works correctly and the universal widget provides a complete customer engagement experience. All 5 dealers must show their store name and persona. The widget must offer all 4 communication options. Appointment bookings via widget must land in the store calendar. The generated embed code must work on an external page (cross-origin). Widget JS files must serve valid JavaScript for each dealer. Validates US-002 (Tavus Video Lead), US-003 (Form to Two-Way SMS), US-013 (Widget Scheduling), S-8.AC1-AC14.

### Pre-Execution Requirements
- All 5 dealer landing pages accessible at /p/{slug}
- Widget API endpoints functional

### Acceptance Criteria
| ID | Criterion | Evidence Type |
|---|---|---|
| T-022f.AC1 | All 5 dealer landing pages load with correct store name (S-8.AC2, AC8) | Screenshot x5 |
| T-022f.AC2 | Widget menu shows all 4 options: Chat, Instant Call Back, Form, Video (S-8.AC12) | Screenshot |
| T-022f.AC3 | Widget chat produces AI response scoped to org (S-8.AC10) | Conversation log |
| T-022f.AC4 | Widget form submission creates conversation (S-8.AC5) | Query proof |
| T-022f.AC5 | Widget appointment booking creates DB record (S-8.AC3) | Query proof |
| T-022f.AC6 | Appointment appears in store calendar (S-8.AC4) | Screenshot |
| T-022f.AC7 | ?mode=video auto-launches fullscreen video (S-8.AC14) | Screenshot |
| T-022f.AC8 | Widget JS files serve valid JavaScript for all 5 dealers (S-8.AC6) | HTTP response x5 |
| T-022f.AC9 | Widget JS contains correct dealer name (S-8.AC7) | Content assertion x5 |
| T-022f.AC10 | Generated embed code works on external HTML page (Gap 5) | Cross-origin test |
| T-022f.AC11 | Landing page shows 404 for invalid slug | Screenshot |

### Ghost Gates
| Gate | Check | Pass Condition |
|---|---|---|
| G-022f.1 | All 5 dealers tested, not just Serra Honda | Evidence shows 5 distinct slugs |
| G-022f.2 | Embed code test loads from a different origin than dev.huminicdev.com | HTML file served from file:// or different port |
| G-022f.3 | Appointment booking verified in DB, not just UI confirmation | Query shows appointment row with widget source |

### Evidence Required
- `evidence/T-022f/dealer-pages/` — screenshots per dealer
- `evidence/T-022f/widget-tests/` — chat, form, video, call back evidence
- `evidence/T-022f/embed-test.md` — cross-origin test results
- `evidence/T-022f/widget-js-audit.md` — JS content per dealer
- `evidence/T-022f/post-sprint-report.md`

---

# WAVE 3 — Integration Gate

---

## T-016: Integration Verification [IN]

### Outcome
Prove every external integration is connected, authenticated, and behaving correctly. VAPI assistants must align with DB. Tavus sessions must be creatable. CommGate must actually stop outbound. MCP bridge must be accessible. Webhook failure handling must be documented. Widget embed must work cross-origin. Validates US-004 (VAPI Inbound), US-027 (Master Kill Switch), US-028 (Channel Pause), S-9.AC1.

### Acceptance Criteria
| ID | Criterion | Evidence Type |
|---|---|---|
| T-016.AC1 | VAPI assistant list matches DB agent records (S-9.AC1) | Audit comparison |
| T-016.AC2 | Tavus video session creation returns conversationUrl | API response |
| T-016.AC3 | Video widget opens new window (popup fix verified in browser) | Browser proof |
| T-016.AC4 | Instant Call Back POST to /api/widget/voice-callback (document 404 if BE not built) | API response |
| T-016.AC5 | CommGate toggle OFF → campaign execute returns blocked | API proof |
| T-016.AC6 | Channel toggle SMS OFF → SMS send blocked; ON → allowed | API proof |
| T-016.AC7 | MCP tm_send_message tool accessible | MCP response |
| T-016.AC8 | MCP vapi_list_assistants returns dealer assistants | MCP response |
| T-016.AC9 | TextMagic API version confirmed (V1 or V2) | Documentation |
| T-016.AC10 | Webhook error handling: simulate bad webhook POST, check logging (Gap 3) | Log inspection |
| T-016.AC11 | Widget embed works from external origin (Gap 5) | Cross-origin proof |

### Ghost Gates
| Gate | Check | Pass Condition |
|---|---|---|
| G-016.1 | VAPI audit compares EVERY assistant, not just Caroline | Full list comparison |
| G-016.2 | CommGate test actually attempts a send, not just reads the toggle state | outbound_log or API rejection captured |
| G-016.3 | Webhook test sends a malformed payload AND a timeout scenario | Two failure modes tested |

### Evidence Required
- `evidence/T-016/vapi-audit.md` — assistant vs DB comparison
- `evidence/T-016/commgate-test.md` — toggle + attempt + result
- `evidence/T-016/webhook-resilience.md` — failure scenarios
- `evidence/T-016/post-sprint-report.md`

---

# WAVE 4 — Comms

---

## T-017a: Sales Communication Continuity [BE]

### Outcome
Prove the complete sales inbound lifecycle end-to-end without human intervention. Customer texts → Caroline responds → TeamBox conversation. Customer calls (Elliott) → VAPI webhook → email notification → VIN lead → transcript in TeamBox. Human takes over → AI stops. Validates US-001 (Web Chat to VIN Lead), US-004 (VAPI Inbound Call), US-015 (SMS Inbound), US-017 (SMS Handover).

### Acceptance Criteria
| ID | Criterion | Evidence Type |
|---|---|---|
| T-017a.AC1 | Inbound SMS to Caroline → agent response in conversation | API proof |
| T-017a.AC2 | Elliott calls Caroline (Serra Honda) → call completes | Call log |
| T-017a.AC3 | VAPI webhook → email notification (Resend logs) | Resend log |
| T-017a.AC4 | VAPI webhook → VIN lead created via vin-safe-mcp | API proof |
| T-017a.AC5 | Transcript available in TeamBox Phone tab | Screenshot |
| T-017a.AC6 | Take Over: assign → AI stops → un-assign → AI resumes (S-2.AC15/AC16) | API proof |

### Ghost Gates
| Gate | Check | Pass Condition |
|---|---|---|
| G-017a.1 | Elliott call actually completed (not just initiated) | Call status = "ended" |
| G-017a.2 | VIN lead verified in DB, not just webhook received | Query shows contact + lead records |

### Evidence Required
- `evidence/T-017a/elliott-call-log.md`
- `evidence/T-017a/resend-verification.md`
- `evidence/T-017a/vin-lead-proof.md`
- `evidence/T-017a/takeover-test.md`
- `evidence/T-017a/post-sprint-report.md`

---

## T-017b: Service Campaign & Compliance Continuity [BE]

### Outcome
Prove service campaigns work end-to-end AND compliance controls function. Campaign → CSV → execute → SMS delivered → reply handled by Nancy → appointment booked. STOP keyword must blacklist the phone. After-hours messages must queue. Concurrent campaigns must be distinguishable. Validates US-009 (Oil Change Campaign), US-010 (Recall), US-012 (Opt-Out), US-014 (Service FAQ), US-021 (After-Hours).

### Acceptance Criteria
| ID | Criterion | Evidence Type |
|---|---|---|
| T-017b.AC1 | Campaign create → CSV → execute → outbound_log shows sent | Log proof |
| T-017b.AC2 | Campaign reply → Nancy responds | Conversation log |
| T-017b.AC3 | Campaign disconnect stops messages for that customer | API proof |
| T-017b.AC4 | After-hours: message queued, not sent (S-4.AC13) | Log proof |
| T-017b.AC5 | Nancy books appointment → DB record (S-4.AC12) | Query proof |
| T-017b.AC6 | Elliott calls Nancy (Serra Service) → call completes | Call log |
| T-017b.AC7 | STOP keyword → phone blacklisted (S-2.AC12) | Query proof |
| T-017b.AC8 | Blacklisted phone → no further messages (S-2.AC13) | API proof |
| T-017b.AC9 | Walk-in followup trigger fires (S-9.AC7, US-005) | API proof |

### Ghost Gates
| Gate | Check | Pass Condition |
|---|---|---|
| G-017b.1 | Campaign execute uses test phone numbers ONLY | CSV contains only test numbers |
| G-017b.2 | STOP test verifies BOTH blacklist entry AND subsequent send blocked | Two-step proof |
| G-017b.3 | After-hours test restores original business hours after test | Cleanup verified |

### Evidence Required
- `evidence/T-017b/campaign-lifecycle.md`
- `evidence/T-017b/stop-compliance.md`
- `evidence/T-017b/after-hours-test.md`
- `evidence/T-017b/post-sprint-report.md`

---

# WAVE 5 — E2E Synthesis

---

## T-018: TeamBox Unified Inbox E2E [FE]

### Outcome
Prove TeamBox is the single source of truth for all customer communication. Every conversation generated by T-017a/b must be visible. Every channel type must be represented. Replies must deliver. The Take Over cycle must work. The kill switch queue must hold and release. VAPI/Tavus logs must show with transcripts. Near-real-time updates must arrive within 10 seconds. Validates US-015, US-017, US-018, and the operator's core requirement.

### Acceptance Criteria
| ID | Criterion | Evidence Type |
|---|---|---|
| T-018.AC1 | SMS conversations from T-017a/b visible | Screenshot |
| T-018.AC2 | Voice conversations with transcripts visible | Screenshot |
| T-018.AC3 | Form submission conversations visible | Screenshot |
| T-018.AC4 | Outbound reply → delivery confirmed in outbound_log | Log proof |
| T-018.AC5 | Take Over cycle: assign → AI stops → un-assign → resumes (S-2.AC15/16) | API proof |
| T-018.AC6 | Kill switch: OFF → queued → ON → released (US-027) | Screenshot sequence |
| T-018.AC7 | Phone tab: VAPI logs with working transcripts (S-2.AC5/6) | Screenshot |
| T-018.AC8 | Video tab: Tavus session logs (S-2.AC7/8) | Screenshot |
| T-018.AC9 | Channel chips filter correctly (S-2.AC4) | Screenshot per channel |
| T-018.AC10 | Status filters work (S-2.AC17) | Screenshot |
| T-018.AC11 | Near-real-time: POST message → appears within 10s (S-2.AC14) | Timing proof |
| T-018.AC12 | TeamBox popout: SMS, Email, Phone, Video, Tasks (S-2.AC2), no "Conversations" (S-2.AC3) | Screenshot |

### Ghost Gates
| Gate | Check | Pass Condition |
|---|---|---|
| G-018.1 | Conversations from T-017a/b are verified by ID, not just "some conversations exist" | Specific conversation IDs traced |
| G-018.2 | Kill switch test actually toggles CommGate and attempts send | Not just UI toggle — API send attempt captured |
| G-018.3 | Near-real-time measured with timestamp, not "it appeared eventually" | POST timestamp vs DOM appearance timestamp, delta < 10s |

### Evidence Required
- `evidence/T-018/channel-coverage.md` — screenshot per channel type
- `evidence/T-018/kill-switch-test.md` — toggle + queue + release sequence
- `evidence/T-018/realtime-timing.md` — POST vs appearance timestamps
- `evidence/T-018/post-sprint-report.md`

---

## T-019: Chat & Agent Usability + Edge Cases [FE]

### Outcome
Prove every AI agent serves its intended purpose and the chat system handles abuse gracefully. Each department agent must respond intelligently to domain questions. Streaming must be performant. Edge cases (empty input, huge input, non-English, rapid fire) must not crash the system. Agent cards must show across all department pages. Validates US-006, US-016, US-026, US-029, US-030.

### Acceptance Criteria
| ID | Criterion | Evidence Type |
|---|---|---|
| T-019.AC1 | Chat resume: click history → previous messages load (SEC-01 fix) | Screenshot |
| T-019.AC2 | Chat with org context: dealership question → org-specific answer (S-1.AC17) | Conversation log |
| T-019.AC3 | Data Guru: real VIN data (S-3.AC9) | Conversation log |
| T-019.AC4 | Sales Coach: coaching advice (S-3.AC10) | Conversation log |
| T-019.AC5 | Communication Writer: email draft (S-3.AC11) | Conversation log |
| T-019.AC6 | Nancy: campaign/scheduling discussion (S-4.AC11) | Conversation log |
| T-019.AC7 | 5 marketing agents: each responds with domain content | Conversation log x5 |
| T-019.AC8 | Chat history shows "Chat — X ago" format (SEC-01 fix) | Screenshot |
| T-019.AC9 | Agent cards on Sales/Service/Marketing show name + description | Screenshot x3 |
| T-019.AC10 | Edge: empty input → no crash | Test result |
| T-019.AC11 | Edge: 10K character input → handled gracefully | Test result |
| T-019.AC12 | Edge: non-English (Spanish) input → response in appropriate language | Conversation log |
| T-019.AC13 | Edge: 5 rapid messages → all processed, no hang | Test result |
| T-019.AC14 | Filter chips not light blue (S-2.AC9) | CSS assertion |

### Ghost Gates
| Gate | Check | Pass Condition |
|---|---|---|
| G-019.1 | Each agent test asks a DOMAIN question, not "hello" | Evidence shows specific dealership/department questions |
| G-019.2 | Edge case tests actually SENT the inputs to the server | Server responses captured, not just client validation |
| G-019.3 | All 5 marketing agents individually tested | 5 separate conversation logs, not one group test |

### Evidence Required
- `evidence/T-019/agent-conversations/` — one per agent (10+ agents)
- `evidence/T-019/edge-cases.md` — inputs, responses, error states
- `evidence/T-019/post-sprint-report.md`

---

# Summary

| Sprint | Wave | Dim | ACs | User Stories Covered |
|---|---|---|---|---|
| T-013 | 1 | FE | 12 | US-018, US-020 |
| T-014 | 1 | DT | 12 | US-003, US-007, US-023, US-024, US-025 |
| T-015 | 1 | AU | 12 | US-022, S-9.AC5/6 |
| T-020 | 1 | BE | 7 | Code integrity |
| T-021 | 1 | AU | 9 | S-9.AC8 |
| T-022a | 2 | FE | 12 | US-006, US-016, US-020, US-030 |
| T-022b | 2 | DT | 11 | US-007, US-026, US-029 |
| T-022c | 2 | DT | 10 | US-009, US-010, US-011, US-014 |
| T-022d | 2 | FE | 11 | S-5.AC1-15 |
| T-022e | 2 | FE | 14 | S-7.AC1-21 |
| T-022f | 2 | FE | 11 | US-002, US-003, US-013 |
| T-016 | 3 | IN | 11 | US-004, US-027, US-028 |
| T-017a | 4 | BE | 6 | US-001, US-004, US-015, US-017 |
| T-017b | 4 | BE | 9 | US-005, US-009, US-010, US-012, US-014, US-021 |
| T-018 | 5 | FE | 12 | US-015, US-017, US-018, US-027 |
| T-019 | 5 | FE | 14 | US-006, US-016, US-026, US-029, US-030 |

**Total: 16 sprints, 173 ACs, 28 of 30 user stories covered** (US-008 Competitive Alert and US-019 Escalation Mgmt are BACKLOG)
