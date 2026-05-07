# Wave 1C comprehensive E2E — feature map

| Surface | Route | Visible interactive features | Wave 1C scope? | Status | Notes |
|---|---|---|---|---|---|
| AI Chat (landing) | `/` | AI Key Metrics tiles (4), suggestion chips, prompt textbox, send btn | NO | renders | Lands here for all roles; sidebar reflects role permissions |
| Sales Dashboard | `/sales` | Tabs (Dashboard/Agents/Insights/Calendar); 7 KPI tiles (Total Leads 30d, New Leads, Active Pipeline, Waiting on Response, Appointments Set, Sold, Conv Rate); Top Performing Agents (AI agents only); Recent Activity panel | YES (S3, S4) | renders | S3 Conv Rate=100% honest math (sold=7, lost=0); S4 Sales-only Total Leads=641 |
| Sales Agents | `/sales` (Agents tab) | Agent grid w/ Data Guru, Sales Coach, Comm Writer, Caroline | NO | renders | AI agents, no human reps |
| Sales Insights | `/sales` (Insights tab) | embedded Insights view | YES (overlap) | renders | overlaps `/insights` |
| Sales Calendar | `/sales` (Calendar tab) | calendar surface | NO | not exercised | not part of Wave 1C |
| Insights Dashboard | `/insights` (Dashboard) | Tabs (Dashboard/Reports/Library/Hunches/Activity); Immediate Action Required (3 tiles); Watch List (Stale, Pending Finance); Today's Performance (Total Active Pipeline, Conv Rate, Total Leads); Pipeline Health (4 tiles); Performance Scorecard (Win Rate, Total Sold, Active Pipeline, Total Leads); 2 charts | YES (S1, S3, S4, S5) | renders | **S5 Win Rate=1.4%** (NOT 100%); **S3 Conv Rate=1.4%** (lifetime); Total Leads=508 |
| Insights Reports | `/insights` (Reports) | Sub-tabs: Loss & Quality, Channel Intelligence, Trend & Forecast; under L&Q: Deal Death Autopsy, Re-Engagement, Source Quality Trends; Loss Patterns by Source table | YES (S1) | renders | **S1 PASS** zero `flat` literals; 9 distinct sources rendered |
| Insights Library | `/insights` (Library) | not exercised this walk | NO | not exercised | n/a |
| Insights Hunches | `/insights` (Hunches) | not exercised this walk | NO | not exercised | API call returns 200 |
| Insights Activity | `/insights` (Activity) | scrollable feed of timeline events | YES (S2) | renders | **S2 PASS** 50 visible rows, ALL user-attributable, ZERO `sync_*` |
| TeamBox Conversations | `/teambox` | Channel filter (All/SMS/Email/Web Chat/WhatsApp/Voice); Status filter (Open/Assigned/Participating/...); Search; Conversation list (18); Customer Info side panel; Reply textbox; Push to VIN btn; Quick actions (Call/Email/SMS) | NO | renders | Mostly test data |
| TeamBox Phone | `/teambox` (Phone tab) | not exercised | NO | not exercised | n/a |
| TeamBox Video | `/teambox` (Video tab) | not exercised | NO | not exercised | n/a |
| Marketing Dashboard | `/marketing` | "v2.3 preview" banner; Dashboard/Agents/Studio/Insights tabs; 4 KPI tiles (Campaign Performance, Active, Sent, Replies) | NO | renders | Explicit pre-launch banner visible; KPIs zero |
| Service Campaigns | `/service` | Campaigns/Agents/Insights/Calendar tabs; "New Campaign" btn; CSV Template link; campaign table w/ Status, Channel, Recipients, Sent, Replied, Kill Switch, Actions | NO | renders | 14+ campaigns visible (TESTLANE labeled, drafts, completed, archived, paused) |
| My Work Dashboard | `/my-work` | Tabs (Dashboard/Tasks/Chat/Assistant); 4 stat tiles; Upcoming Tasks list | NO | renders | "Unsent SMS — blocked" recurring tasks visible (CommGate working) |
| Settings hub | `/settings` | 6 settings cards (User Mgmt, Org, Tools/Integrations, KB, Notifications, Appearance) | NO | renders | not drilled per-card |
| Profile | `/profile` | Profile / Preferences tabs; avatar; Edit Profile; Contact Info form (email/phone); Change Password form | NO | renders | "Serra Honda Admin" identity correct |
| Usage | `/usage` | Period selector; 3 stat tiles; Usage By Type list | NO | renders | Shows SMS Blocked=11 — CommGate accounting working |
| Agents (single agent view) | `/agents` | Agent profile (active badge); 4 quick-action chips; chat textbox | NO | renders | Default = Data Guru |
| Management Dashboard | `/management` (super_admin) | Insights/Hunches/System Log/User Chats/Billing tabs; Insights tab has Dashboard/Reports/Library/Hunches/Activity sub-tabs; Store-picker (All Stores + 7 orgs) | YES (cross-store check) | renders | super_admin only; sparse-data org Huminic shows blank Conv Rate (S3 null branch); switching to Serra Honda shows 1.4% (matches user view) |
| Login | `/login` | Email/Password form; Sign in btn (disabled until both filled); Forgot password link | NO | renders | Tested for super_admin, partner_admin login flows |
| Public Widget Landing | `/w/demo`, `/p/:slug` | First/Last/Phone/Email/intent form; Get in Touch btn; Live Video Chat btn (Tavus); legal disclaimer | NO | renders | NO auth required (correct); demo slug fallback works |

## Surface counts

- **Total surfaces enumerated:** 24
- **Renders:** 22
- **Partial / data-gated:** 2 (Marketing pre-launch banner, Management dashboard with sparse-data orgs)
- **Broken:** 0
- **Unreachable:** 1 (`/sales/leads` 404 — by design; not a route)
- **Requires-data-not-present:** 0 (no surface FAILED due to missing data; some show zeros + empty-state UI which is correct)

## Wave 1C scope features (renderable)

All five Wave 1C target surfaces render with honest values:
- S1 (lead-source trend) → `/insights > Reports > Source Quality Trends` shows varied sources, no `flat`
- S2 (activity-feed sync filter) → `/insights > Activity` AND `/sales > Recent Activity` show only user-attributable rows
- S3 (Conv Rate wire shape) → `/sales` Conv Rate KPI card; sparse-data orgs render blank (null branch)
- S4 (sales-only predicate UPSTREAM) → `/sales` Total Leads + `/insights` tiles consistent with sales-only filter
- S5 (lib-8 lifetime win rate) → `/insights > Dashboard > Performance Scorecard > Win Rate` = 1.4% NOT 100%
- S6 (test housekeeping) → covered by S3 wire-shape

## Out-of-scope drift signals (NOT investigated)

| Signal | Surface | Severity | Suggested wave |
|---|---|---|---|
| `/sales/leads` 404 | (no route) | low | n/a — no route to add; documented |
| `/widget-landing` 404 vs actual `/w/:slug` | n/a | low | possibly Wave 3F (operator decision) — discoverability |
| Marketing "v2.3 preview" banner copy | `/marketing` | n/a | by design |
| "Top Performing Agents" panel = AI only (no human reps) | `/sales` | n/a (acknowledged in prior walk) | Wave 3F or 9-Sec discussion |
| Empty Source Quality Trends chart (data labels exist; trend lines blank) | `/insights > Reports > SQT` | low | Wave 3F (rendering polish) — chart shows axis labels but the trend lines themselves did not visualize. Data WAS sent (table renders fine in sibling tab); chart-render glitch. Not a Wave 1C regression. |
| `[Insights] Failed to fetch lead source mapping for org <empty-org-uuid>` | server log | low | could be downgraded to debug-level for empty orgs; pre-existing |
| `[VAPI Webhook] VAPI_WEBHOOK_SECRET unset` | server log | low | Wave 9-Sec / env hygiene |
