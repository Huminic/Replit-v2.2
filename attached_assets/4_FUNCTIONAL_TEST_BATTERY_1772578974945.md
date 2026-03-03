# Nexxus Connect — Functional Test Battery
**Version:** 1.0  
**Date:** 2026-02-27  
**Test Contact:** 412.654.6500 / duanewells@icloud.com  
**Test Agent:** Elliott (VAPI)  
**Rule:** Each battery runs independently. Each produces real external evidence. No battery declares PASS based on code review alone.

---

## AGENT CAPABILITY MATRIX

### Automa (System Agent)
Automa is the platform-level AI assistant available to all users. It must be capable of:

| Capability | Description | Output Type |
|---|---|---|
| AM-01 | Multi-turn conversation with context retention (20 turns) | Chat transcript |
| AM-02 | Intent detection — identify what user is asking for | Structured response |
| AM-03 | Intent limit expression — state clearly when data is unavailable | Refusal message |
| AM-04 | VIN analysis from submitted VIN number | Structured report |
| AM-05 | Generate insights report from dashboard data | PDF artifact |
| AM-06 | Generate pipeline health report | PDF artifact |
| AM-07 | Generate lead scoring report | PDF artifact |
| AM-08 | Generate hunch analysis (Detective format) | PDF artifact |
| AM-09 | Generate custom NLP report from free-text query | PDF artifact |
| AM-10 | Save any generated report to Drive | Drive file |
| AM-11 | Generate shareable link for any Drive artifact | URL with permission level |
| AM-12 | Send report via email | Email delivery |
| AM-13 | Send report link via SMS | SMS delivery |
| AM-14 | File upload and reference in conversation | In-session context |
| AM-15 | Scrape external URL and convert to artifact | Drive file |
| AM-16 | Create shareable landing page from artifact | Hosted URL |
| AM-17 | Detect and pull from VinSolutions data via NLP query | Structured data response |
| AM-18 | Trigger action based on metric threshold (alert) | Notification/action |

### Custom Agents
Org Admins create custom agents. Each agent must support:

| Capability | Description | Output Type |
|---|---|---|
| CA-01 | Instruction set ≥ 50 words, coherent | Config saved |
| CA-02 | Trigger on lead status change in VinSolutions | Action fired |
| CA-03 | Trigger on inbound lead creation | Action fired |
| CA-04 | Trigger on metric threshold (e.g. close rate drops) | Action fired |
| CA-05 | Trigger on Insights hunch confidence threshold | Action fired |
| CA-06 | Initiate outbound SMS to lead | SMS delivered |
| CA-07 | Initiate outbound call via VAPI | Call delivered |
| CA-08 | Initiate outbound email | Email delivered |
| CA-09 | Two-way SMS — receive reply and continue conversation | SMS thread |
| CA-10 | Insert data back into VinSolutions after interaction | CRM updated |
| CA-11 | Generate report artifact from interaction | PDF artifact |
| CA-12 | Save artifact to Drive | Drive file |
| CA-13 | Apply any of 27 skills | Skill executes correctly |
| CA-14 | Cross-channel name consistency | Same name in SMS, email, call |
| CA-15 | Create → Test → Delete lifecycle | No orphaned config |

### The 27 Skills (applied to custom agents)
Skills are modular capabilities migrated from the old agent system. Each skill must:
- Attach to a custom agent without error
- Execute its designed function when triggered
- Be removable without breaking the agent

---

## BATTERY 1 — Authentication & UI Shell
**Scope:** Login, session, top bar, sidebar, sub-menu, responsive layout  
**Estimated run time:** 1–2 hours

| Test | Action | Evidence Required |
|---|---|---|
| B1-01 | Log in with valid credentials | Session established, dashboard loads |
| B1-02 | Attempt login with wrong password | Error message displays, no session |
| B1-03 | Trigger forgot-password flow | Reset email arrives at duanewells@icloud.com |
| B1-04 | Let session time out | Auto-logout occurs, redirect to login |
| B1-05 | Toggle theme light/dark | Persists after page reload |
| B1-06 | Switch org via org switcher | UI reloads with correct org context |
| B1-07 | Resize browser below 1024px | Sub-menu collapses, mobile nav appears |
| B1-08 | Resize below 640px | Single column layout, MobileNavDropdown active |
| B1-09 | Hover sidebar item, wait 800ms, move away | Sub-menu closes |
| B1-10 | Pin sub-menu, reload page | Pin state persists |

**Pass condition:** All 10 produce expected behavior. B1-03 email physically received.

---

## BATTERY 2 — Main Dashboard & Metrics (AC-4)
**Scope:** Role-specific metric tiles, drill-down modals, calculation transparency  
**Estimated run time:** 2–3 hours

| Test | Action | Evidence Required |
|---|---|---|
| B2-01 | Log in as Super Admin | Super Admin tile set renders |
| B2-02 | Log in as Org Admin | Org Admin tile set renders — different from Super Admin |
| B2-03 | Log in as Staff | Staff tile set renders — reduced set |
| B2-04 | Click a metric tile | Modal opens with sample dealership data |
| B2-05 | Verify metric calculation | Number in tile matches sum/formula shown in modal |
| B2-06 | Collapse tiles after first chat | Tiles animate away, chat expands |
| B2-07 | Reload after collapse | Dashboard resets correctly |
| B2-08 | Check MRR figure ($12,450) | Matches sum of org billing table |
| B2-09 | Check Active Accounts (24) | Matches org count in billing table |
| B2-10 | Screenshot each role's dashboard | 3 screenshots saved to Drive as evidence |

**Pass condition:** Numbers reconcile. Role views differ correctly. Screenshots committed.

---

## BATTERY 3 — Automa Core: Chat, VIN, Artifacts (AC-2, AM-01–AM-18)
**Scope:** Chat UI behavior, multi-turn context, VIN analysis, report generation, Drive artifacts, external delivery  
**Estimated run time:** 4–5 hours

| Test | Action | Evidence Required |
|---|---|---|
| B3-01 | Open chat, send empty message | Send button remains disabled |
| B3-02 | Type message, observe UI | Gradient glow activates on input |
| B3-03 | Send message, observe response | Typing wave-dot animation before response |
| B3-04 | Bot response renders | Left-aligned bubble, correct styling |
| B3-05 | 5-turn conversation | Context retained, coherent replies across all 5 |
| B3-06 | 20-turn conversation | Context still coherent at turn 20 |
| B3-07 | Submit a VIN number | Returns: year, make, model, known issues, structured |
| B3-08 | Submit 3 VINs sequentially | Each analyzed correctly, no cross-contamination |
| B3-09 | Ask for pipeline health report | PDF generated, saved to Drive |
| B3-10 | Ask for lead scoring report | PDF generated, saved to Drive |
| B3-11 | Ask for hunch analysis | Output matches Detective format (5–10 hunches ranked) |
| B3-12 | Ask NLP question about VinSolutions data | Returns structured answer from real data |
| B3-13 | Ask question Automa cannot answer | Returns clear limit statement, no fabricated data |
| B3-14 | Email report to duanewells@icloud.com | Email physically received with report |
| B3-15 | Send report link via SMS to 412.654.6500 | SMS physically received with working link |
| B3-16 | Upload file, reference it in chat | File used in response correctly |
| B3-17 | Generate shareable link | Link works, permission level attached |
| B3-18 | Ask Automa to scrape a competitor inventory URL | Artifact created in Drive from scraped data |
| B3-19 | Ask Automa to create shareable landing page from artifact | Hosted URL generated |
| B3-20 | Send hosted URL via SMS to 412.654.6500 | SMS received, URL loads, widget interactive |

**Pass condition:** All PDFs in Drive. Emails and SMS physically received. Hosted URL functional. No fabricated data in limit-test response.

---

## BATTERY 4 — Insights: Hunches, Reports, Library
**Scope:** Full Insights module — all 4 sub-sections  
**Estimated run time:** 2–3 hours

| Test | Action | Evidence Required |
|---|---|---|
| B4-01 | Navigate to Insights Dashboard | Alert cards, scorecard, pipeline health all render |
| B4-02 | Open a Report category card | Modal opens with detail view |
| B4-03 | Navigate to Library | 61 metric cards render |
| B4-04 | Toggle grid/list view | Both views render correctly |
| B4-05 | Filter by category | Card count changes correctly |
| B4-06 | Search library | Results match search term |
| B4-07 | Navigate to Hunches | 6 hunch items render with confidence % |
| B4-08 | Verify hunch format | Each has: pattern, data details, impact, recommended action |
| B4-09 | Run Detective hunch against real data | 5–10 hunches, ranked by impact/effort/confidence |
| B4-10 | Generate PDF from hunch output | PDF saved to Drive |
| B4-11 | Email hunch report to duanewells@icloud.com | Email physically received |
| B4-12 | Verify Activity feed | Recent actions appear in feed |

**Pass condition:** Hunch output matches Detective spec. PDF in Drive. Email received.

---

## BATTERY 5 — Agents: Configuration, Elliott, Custom Agent Lifecycle (AC-1, CA-01–CA-15)
**Scope:** Agent list, detail, config pane, Elliott outbound test, create/test/delete cycle  
**Estimated run time:** 4–5 hours

| Test | Action | Evidence Required |
|---|---|---|
| B5-01 | Navigate to Agents list | All agents render with correct names |
| B5-02 | Open Elliott agent detail | Header, chat, config pane all render |
| B5-03 | Verify Elliott's instruction set | ≥ 50 words, coherent |
| B5-04 | All 6 config sections render | Performance, Instructions, Triggers, Tools & Skills, Knowledge, Activity |
| B5-05 | Use Elliott to initiate outbound call via VAPI | Call received at 412.654.6500 |
| B5-06 | Verify call transcript saved | Transcript in Drive or Activity log |
| B5-07 | Create new test agent "TestAlpha" | Appears in list, config saves |
| B5-08 | Set trigger: fire on lead status = "Hot" | Trigger configuration saves |
| B5-09 | Attach a skill to TestAlpha | Skill listed in Tools & Skills |
| B5-10 | Activate trigger, simulate condition | Trigger fires, action executes |
| B5-11 | Agent sends confirmation email | Email received at duanewells@icloud.com |
| B5-12 | Agent sends confirmation SMS | SMS received at 412.654.6500 |
| B5-13 | Delete TestAlpha | Removed from list, no orphaned config |
| B5-14 | Verify cross-channel name consistency | TestAlpha name identical in SMS, email, call |
| B5-15 | Apply and test 3 different skills | Each executes its designed function |

**Pass condition:** Call received. Email and SMS received. Create/delete cycle leaves no orphans. Transcript saved.

---

## BATTERY 6 — Hub: Calendar, Leads, Two-Way SMS, Outbound Call
**Scope:** Full Hub — calendar views, lead actions, two-way SMS, VAPI call (AC-1)  
**Estimated run time:** 3–4 hours

| Test | Action | Evidence Required |
|---|---|---|
| B6-01 | Navigate to Hub Calendar | All 4 views render (year/month/week/day) |
| B6-02 | Verify mock events Feb 16–22 | 11+ events in week view |
| B6-03 | Navigate to Leads | Lead cards with status badges render |
| B6-04 | Click Text on a lead | Initiates SMS, toast confirms |
| B6-05 | SMS delivers to 412.654.6500 | Text physically received |
| B6-06 | Reply to the SMS | Reply captured in system |
| B6-07 | Two-way SMS thread continues | System responds to reply intelligently |
| B6-08 | Thread data written to VinSolutions | CRM reflects SMS interaction |
| B6-09 | Click Call on a lead | VAPI call initiates |
| B6-10 | Call delivers to 412.654.6500 | Call physically received |
| B6-11 | Call outcome written to VinSolutions | CRM reflects call attempt/outcome |
| B6-12 | Click Schedule on a lead | Scheduling modal opens and functions |
| B6-13 | Navigate to Inbox | Email, SMS, voicemail items render |
| B6-14 | Interact with inbox item | Toast confirmation appears |

**Pass condition:** Two-way SMS thread confirmed. Call received. Both interactions written to VinSolutions.

---

## BATTERY 7 — Drive: File Operations & Sharing
**Scope:** Full Drive module — upload, share, star, delete, breadcrumbs  
**Estimated run time:** 1–2 hours

| Test | Action | Evidence Required |
|---|---|---|
| B7-01 | Navigate to Drive — My Files | Grid view renders |
| B7-02 | Toggle to list view | List with type-specific icons |
| B7-03 | Upload a test file | File appears in grid |
| B7-04 | Download the file | File downloads correctly |
| B7-05 | Star the file | Appears in Starred sub-menu |
| B7-06 | Share via email | Email arrives at duanewells@icloud.com with link |
| B7-07 | Share via SMS | Text received at 412.654.6500 with link |
| B7-08 | Copy link via clipboard API | Toast confirms copy |
| B7-09 | Delete file | Toast confirms, removed from grid |
| B7-10 | Navigate all sub-menu items | Shared, Starred, Recent, Templates all render |
| B7-11 | Check breadcrumbs at each level | Correct path shown |

**Pass condition:** Share email and SMS physically received. File operations produce correct toasts.

---

## BATTERY 8 — Widgets, Hosted Pages, Tavus Video (AC-5)
**Scope:** All 4 widget types, config, preview, hosted deployment, video launch  
**Estimated run time:** 2–3 hours

| Test | Action | Evidence Required |
|---|---|---|
| B8-01 | Navigate to Widgets | 4-card grid renders |
| B8-02 | Open each widget config | All 5 tabs render for each of 4 widget types |
| B8-03 | Open preview modal for each widget | 4 previews render without error |
| B8-04 | Deploy Unified widget to test store | Hosted page URL generated |
| B8-05 | Send hosted URL to duanewells@icloud.com | Email received with working URL |
| B8-06 | Send hosted URL to 412.654.6500 via SMS | SMS received with working URL |
| B8-07 | Navigate to hosted URL | Widget renders on page |
| B8-08 | Interact with widget on hosted page | Widget responds, no errors |
| B8-09 | Click into hosted page from SMS link | Page loads from SMS link correctly |
| B8-10 | Interact with system via hosted widget | System responds intelligently |
| B8-11 | Launch Tavus video widget | Video landing page loads, not blank |
| B8-12 | Verify widget embed code generates | Embed code visible in Embed tab |

**Pass condition:** Both email and SMS with URL received. Widget interactive on hosted page. Tavus not blank. Interaction via SMS link confirmed.

---

## BATTERY 9 — VinSolutions Integration: Lead Insertion & Bidirectional Sync (AC-3)
**Scope:** CRM integration — insertion timing, field mapping, sync, agent triggers from CRM data  
**Estimated run time:** 3–4 hours

| Test | Action | Evidence Required |
|---|---|---|
| B9-01 | Create test lead in Nexxus | Lead appears with all fields |
| B9-02 | Lead appears in VinSolutions | Visible within 30 seconds — timestamp recorded |
| B9-03 | Record 5 sequential insertions | All 5 in VinSolutions, avg time ≤ 30s |
| B9-04 | Update lead status in VinSolutions | Reflects in Nexxus within 60 seconds |
| B9-05 | Verify all mapped fields match | Field-by-field comparison documented |
| B9-06 | Flag any unmapped fields | List of gaps in report |
| B9-07 | Inbound lead triggers agent action | Custom agent fires on new lead creation |
| B9-08 | Agent sends outbound SMS to lead | SMS delivered to 412.654.6500 |
| B9-09 | Agent logs interaction back to VinSolutions | CRM note added after SMS |
| B9-10 | Lead status change triggers outbound call | Call delivered to 412.654.6500 via VAPI |
| B9-11 | Call outcome logged to VinSolutions | CRM reflects call result |
| B9-12 | Email insertion report to duanewells@icloud.com | Email with lead IDs and timestamps received |

**Pass condition:** All insertions ≤ 30s. Bidirectional sync ≤ 60s. Agent-triggered SMS and call received. CRM notes confirmed. Report email received.

---

## BATTERY 10 — RBAC: Full Role Matrix
**Scope:** All 4 roles against every permission boundary  
**Estimated run time:** 3–4 hours

| Test | Action | Evidence Required |
|---|---|---|
| B10-01 | Log in as Super Admin | All tiles including Billing and extra settings visible |
| B10-02 | Log in as Partner Admin | Partner-scoped tiles only |
| B10-03 | Log in as Org Admin | Org-scoped view, no partner-level items |
| B10-04 | Log in as Staff | Settings hidden, reduced nav |
| B10-05 | Staff attempts Settings URL directly | Blocked or redirected |
| B10-06 | Org Admin attempts Super Admin action | Blocked with message |
| B10-07 | Role switcher changes view instantly | No reload errors |
| B10-08 | RBAC persists after page reload | Role unchanged after F5 |
| B10-09 | Org Admin creates user | User created within org scope only |
| B10-10 | Attempt cross-org data access | Blocked, org isolation confirmed |
| B10-11 | Email RBAC results summary | Email to duanewells@icloud.com with pass/fail per role |

**Pass condition:** Every boundary holds. No role accesses above its level. Summary email received.

---

## BATTERY 11 — Agent-Generated Reports & PDF Artifacts
**Scope:** Every report type Automa and custom agents should produce  
**Estimated run time:** 3–4 hours

| Test | Action | Report Type | Evidence |
|---|---|---|---|
| B11-01 | Ask Automa for pipeline health report | Pipeline Health PDF | File in Drive |
| B11-02 | Ask Automa for lead scoring report | Lead Score PDF | File in Drive |
| B11-03 | Ask Automa for close rate analysis | Close Rate PDF | File in Drive |
| B11-04 | Ask Automa for VIN batch analysis (3 VINs) | VIN Analysis PDF | File in Drive |
| B11-05 | Ask Automa for hunch report | Hunch Report PDF | File in Drive |
| B11-06 | Ask Automa for activity summary | Activity Summary PDF | File in Drive |
| B11-07 | Ask Automa for inventory comparison (scraped) | Competitor Inventory PDF | File in Drive |
| B11-08 | Custom agent generates post-interaction report | Interaction Report PDF | File in Drive |
| B11-09 | Email all 8 reports to duanewells@icloud.com | Batch email | 8 PDFs received |
| B11-10 | Send shareable links for all 8 via SMS | Batch SMS | Links received, all load |
| B11-11 | Generate landing page from competitor inventory artifact | Hosted URL | URL works, content correct |
| B11-12 | Send landing page URL via SMS to 412.654.6500 | SMS | Received, page loads |
| B11-13 | Interact with system about page content after clicking link | Two-way | System responds with context |

**Pass condition:** 8 PDFs in Drive. Batch email received. All SMS links functional. Landing page interactive from SMS.

---

## BATTERY 12 — Bonus: Inventory Scrape → Artifact → Landing Page → Two-Way SMS
**Scope:** End-to-end demonstration of the highest-value agentic chain  
**Estimated run time:** 2–3 hours

This is a single end-to-end scenario that chains multiple capabilities:

**Step 1:** Create agent "ScoutAgent" with instruction: scrape competitor inventory from [URL], convert to artifact, save to Drive  
**Step 2:** ScoutAgent executes — artifact appears in Drive  
**Step 3:** ScoutAgent generates branded landing page from artifact  
**Step 4:** ScoutAgent sends landing page URL via SMS to 412.654.6500  
**Step 5:** User (Duane) clicks link — page loads correctly  
**Step 6:** User replies to SMS with a question about the inventory  
**Step 7:** System responds intelligently using the artifact as context  
**Step 8:** Delete ScoutAgent — no orphaned config  

| Step | Evidence Required |
|---|---|
| 1–2 | Artifact visible in Drive |
| 3 | Hosted URL generated |
| 4 | SMS received at 412.654.6500 |
| 5 | Page loads from SMS link |
| 6–7 | Two-way SMS thread with intelligent response |
| 8 | Agent removed cleanly |

**Pass condition:** All 8 steps complete in sequence. This is the marquee demonstration of the system.

---

## Master Evidence Log Template

Each battery must produce a completed evidence log:

| Battery | Test ID | Expected | Actual | Timestamp | Pass/Fail |
|---|---|---|---|---|---|
| B1 | B1-03 | Email received | | | |
| B3 | B3-14 | Email received | | | |
| ... | ... | ... | | | |

**No battery closes as PASS until its evidence log is complete with actual outcomes filled in.**

---

## Run Order Recommendation

| Order | Battery | Dependency |
|---|---|---|
| 1 | B1 — Auth | None — run first |
| 2 | B10 — RBAC | Requires B1 pass |
| 3 | B2 — Dashboard | Requires B1 pass |
| 4 | B9 — VinSolutions | Requires B1 pass |
| 5 | B3 — Automa Chat | Requires B9 (real data) |
| 6 | B4 — Insights | Requires B3 (artifacts) |
| 7 | B5 — Agents | Requires B9 (triggers) |
| 8 | B6 — Hub | Requires B5 + B9 |
| 9 | B7 — Drive | Requires B3 (artifacts) |
| 10 | B8 — Widgets | Requires B1 pass |
| 11 | B11 — Reports | Requires B3 + B9 |
| 12 | B12 — Marquee | Run last — requires all above |
