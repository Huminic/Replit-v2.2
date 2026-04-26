# Nexxus Connect v2.2 — Programmer Brief / PRD

**Status:** Snapshot as of 2026-04-24. Living state — re-read `plan.md`, `backlog.md`, and `issues.md` for current detail. This brief is the on-ramp.

---

## 1. Executive Summary

Nexxus Connect is an AI-native CRM augmentation platform for automotive dealership groups. It sits next to (not in place of) an existing CRM — currently VIN Solutions — and adds three things the dealer can't get from their CRM alone:

1. **AI agents that handle conversations the staff doesn't have time for** — inbound voice, after-hours SMS follow-up, web chat, contact forms, video sessions.
2. **AI-driven exception intelligence** — alerts and reports that tell management what to act on today, delivered to where the user already is (email).
3. **A unified surface for cross-rooftop visibility** — one operator can run multiple stores from a single account with role-based access.

The current customer (Cage Automotive, 5 rooftops) is preparing for production launch on **Monday April 27, 2026** at Serra Honda first, then a staged rollout to the remaining four stores.

---

## 2. Vision

**The product is not a dashboard. It is an exception engine.**

Modern dealerships have plenty of metrics. They lack the time to look at them. The 2025–2026 industry direction (Impel, Tekion, Fullpath, Reynolds, automotiveMastermind) is clear: AI should prioritize, escalate, summarize, coach, and flag exceptions — and push those signals into the channels the user already uses (email, SMS, occasionally Slack), not require them to log in.

Nexxus's bet is to combine that exception-engine thesis with **multi-rooftop access** and **deep CRM-plus-warehouse integration**, so the platform can identify cross-store patterns, mine equity opportunities, surface competitive threats, and run conversations on the dealer's behalf — all without the dealer having to remember to look.

The North Star: a dealership manager should open Monday's morning email and see exactly the three things that need their attention today, with the data and the suggested action ready to go. They should never have to log in to find out what's wrong.

---

## 3. Ideal Customer Profile (ICP)

**Primary ICP:** mid-sized US automotive dealer groups, 3–15 rooftops, currently running VIN Solutions or a comparable CRM, with a partner-level operator who has authority across all rooftops.

**Characteristics:**
- 200–800 leads per month per rooftop
- 50–300 service appointments per week per rooftop
- Existing BDC team (small) and floor sales team (medium)
- Already paying for: VIN Solutions, sometimes Impel or Podium, sometimes vAuto, sometimes Cox Dealer.com for website
- Frustrated by: slow lead response, inconsistent follow-up, after-hours coverage gaps, service-lane leads underworked, inability to know which sources or people are actually converting
- Behavioral pattern: principals and GMs do not log into dashboards regularly. They live in email and phone.

**Buyer:** dealer principal or partner-level operator (e.g., Cage Automotive's partner_admin). They are non-technical but technically literate. They sign multi-rooftop contracts and want visibility across all stores in one place.

**User personas inside the dealership:**
- **Partner / Owner** — wants weekly executive view, exception alerts, ROI proof
- **General Manager** — wants daily operational visibility per store
- **BDC Manager** — wants conversation queue, response-quality metrics, lead-source health
- **Sales Manager** — wants opportunity prioritization, rep performance, appointment health
- **Service Manager** — wants service-lane lead visibility, equity-mining candidates
- **Sales Rep** — wants AI-suggested replies, prioritized lead list, fewer dashboards
- **Service Advisor** — wants service appointments and customer questions in their workflow

**Deal anchor:** $1,000/module/month upsell on top of base platform fee. Modules unlock advanced capabilities — currently service campaigns, weekly executive reports, marketing AI, expanded insights.

---

## 4. Product Overview

**Platform surfaces:**

| Surface | What it is |
|---|---|
| Web app | React 18 SPA at `dev.huminicdev.com` (dev) and `live.huminic.app` (production). Multi-role: super_admin, partner_admin, org_admin, plus role-restricted views |
| Universal widget | Hosted JS at `live.huminic.app/dealer-widgets/nexxus-widget.js`, embedded into dealer websites (Cox / Dealer.com handles the install at Cox-managed sites) |
| Landing pages | `/p/:slug` and `/w/:slug` — public-facing dealer-branded pages with the four widget actions (chat, callback, form, video) |
| AI voice agents | VAPI-backed; per-store agent persona (Caroline, Magnolia, Georgia, Savannah, Elizabeth) for after-hours and overflow inbound calls |
| Email delivery | Resend; "beautiful email" lead notifications + weekly executive AI reports + the upcoming daily briefing |
| ADF/XML to CRM | After-hours voice leads delivered to VIN Solutions via ADF email; bypasses the VIN REST API which doesn't support unassigned-lead creation cleanly |
| Two-way SMS | TextMagic webhook in, AI agent reply out, conversation history preserved |
| TeamBox | Unified customer-conversation inbox surfacing voice, SMS, web chat, and contact form messages |

**Tech stack:**

- **Server:** Express 5 + TypeScript 5.6 (Node.js)
- **Client:** React 18 + Vite 7 + TypeScript 5.6 + TanStack Query
- **Database:** PostgreSQL on Supabase (connected via Drizzle ORM — schema in `shared/schema.ts`)
- **AI providers:**
  - **Anthropic Claude (Sonnet 4.6)** for SMS conversation, narrative generation, intent detection, agent chat
  - **OpenAI** for some embeddings / reasoning paths
  - **VAPI** for voice agents
  - **Tavus** for video agent sessions
  - **FAL** for media work
- **Integrations:**
  - **VIN Solutions** (Cox Connect CRM) — via two MCP servers:
    - `central-mcp` (port 4002): all reads + non-VIN providers (VAPI, TextMagic, Tavus, Resend, FlexPrice)
    - `vin-safe-mcp` (port 4003): all VIN write operations, gated by a `prepare → review → execute → verify` flow
  - **Resend** for email
  - **TextMagic** for SMS
  - **Lago** for billing (currently monitoring-only; full integration deferred)
- **Process management:** PM2 — `nexxus-app` (port 5000), `central-mcp` (4002), `vin-safe-mcp` (4003), `nexxus-enforcer` (governance daemon)
- **Reverse proxy:** Caddy
- **Source repo:** `/home/ubuntu/Claude-store/nexxus2.2_replit` (this directory)

**Key data tables:**
- `users` — `organization_id` plus `additional_org_ids[]` for multi-store admins
- `organizations` — settings JSONB carries timezone, business hours, trigger flags, ADF config
- `warehouse_leads` — synced from VIN; key fields `vin_status`, `vin_source_id`, `vin_source_name`, `vin_created_at`, `synced_at`, `assigned_salesperson`, `customer_phone/email/name`
- `conversations` — channel, status, agent, assignment; **no department/domain field today** (TeamBox research called this out)
- `messages` — per-conversation message history
- `appointments` — currently created from VAPI/Tavus voice intent only; no SMS path yet
- `activity_log` — audit trail for triggers, sync events, sends
- `outbound_log` — every outbound email/SMS/voice with idempotency keys

---

## 5. Current Customer + Deployment Status

**Customer:** Cage Automotive (partner_admin: Durran). Five rooftops:

| Store | Brand | Region | Service Module | Notes |
|---|---|---|---|---|
| Serra Honda | Honda | Alabama | Yes | Primary launch candidate Mon Apr 27 |
| Serra Nissan | Nissan | Alabama | v2.3 | Critical features only in v2.2 |
| Tony Serra Ford | Ford | Alabama | v2.3 | Critical features only in v2.2 |
| Ford of Columbia | Ford | South Carolina | n/a | **ADF intentionally disabled — alerts only** |
| Hyundai of Columbia | Hyundai | South Carolina | n/a | **ADF intentionally disabled — alerts only** |

**Already running in production:**
- VAPI voice AI for Serra stores (months of operating history)
- ADF XML → VIN intake for the 3 Serra stores (confirmed firing; recent sends in `outbound_log`)
- Weekly executive AI reports — delivered Monday cadence to all 5 stores
- TeamBox / web app login / multi-role access

**Going live Monday Apr 27, 9 AM ET (Serra Honda first):**
- Universal widget all 4 actions on Serra Honda VDP pages (Day 1), expand to all pages Day 2
- Outbound triggers (after-hours + 24h check-in SMS) on test-phone whitelist initially
- Two-way SMS conversation
- Appointment intent → our-system calendar + admin notification email

**Saturday Apr 26 10 PM ET — Pre-Launch Checkpoint:**
A pre-approved decision gate. If critical features aren't green, captain activates reduced-scope launch (only what's green ships Monday; rest moves to Phase 4 or v2.3) without re-plan cycle. This is intentional — no scope debate during prime time.

---

## 6. What's Been Built — Current State of the Software

Inventory from autonomous Sprint 1.2 codebase audit (full detail in `evidence/v2.2-inventory-2026-04-24.md`):

| State | Count | Meaning |
|---|---:|---|
| WORKING | 63 | Verified functional in code, tests pass or behavior consistent |
| PARTIAL | 30 | Built but with gaps — works in some cases, not all |
| BROKEN | 10 | Built but currently failing |
| MISSING | 18 | Declared in feature map but not implemented |
| UNCLEAR | 7 | State could not be determined from code alone |

**Solidly working today:**
- Inbound VAPI call → ADF XML email → VIN Solutions intake at the 3 Serra stores
- Lead notification email ("beautiful email") to dealer admin team on every captured voice lead
- Idempotency on ADF + notification (no duplicate sends)
- Generic fallback wording when caller leaves no transcript
- Weekly executive report generator, sales-only filter (opt-in arg), email delivery via Resend
- VAPI conversation transcript capture
- Tavus video agent session creation
- Widget loading at Serra Honda test URL (Cox confirmed) — video action works end-to-end
- Web app login, role-based access (with caveats — see issues), TeamBox conversation list
- VIN-safe-mcp `prepare → review → execute → verify` flow for VIN writes
- Warehouse lead sync from VIN
- Anthropic Claude integration for SMS conversation (when active)
- Conversation history preserved across turns
- Two-way SMS reply path for existing conversations
- 30-second SMS dedup
- Trigger dedup (4h after-hours window, 48h check-in)
- Per-org timezone configuration (set by captain in prior session)

**Built but partial / broken:**
- Widget actions: chat, callback, contact form — backends work (`POST /api/widget/chat`, `/api/widget/contact`, `/api/widget/voice-callback`), but UI bridge in `widget-landing.tsx` only auto-launches `mode=video`. Fix is in working tree, ~20 lines, awaiting deploy.
- `/api/organizations` for `org_admin` role returns only primary org — does not read `additional_org_ids`. Multi-store admins (e.g., Victoria) can't switch dealers. Fix in working tree, ~10 lines, awaiting deploy.
- Outbound triggers: scheduler exists, dedup works, but **all triggers OFF on all 5 orgs today**. Plus 3 known bugs — see Outstanding Issues.
- After-hours DEFER path: writes a `deferred` activity log but does **not actually send** the next morning — design gap.
- SMS appointment intent detection: **not built**. Voice (VAPI/Tavus) has it; SMS does not.
- Admin email on appointment creation: **not built**. Appointments are created silently in DB.
- `isNexxusOriginatedLead` matches lead source by name, but VIN sync stores URLs — leads to misclassification.
- TeamBox: works as unified inbox but lacks domain segmentation; navigating between TeamBox and Sales/Service/Marketing sections is friction.
- Insights page: never visually verified end-to-end. May render incorrectly for some role/org combinations.
- Marketing module: backend partially built; no API logins yet so it doesn't have data to operate on.
- Lago billing module: 26 UI states render but every backend call returns `{configured: false}`. Effectively dead.
- `{{dealershipName}}` template variable leaks literal text to Claude in agent chats — every customer sees the literal string.

**Not yet built (declared but missing):**
- SMS-side appointment intent detection
- Appointment admin notification email
- After-hours DEFER → morning send implementation
- Service landing pages + service-specific widget variants (deferred to v2.3)
- Hunches engine (deferred to v2.3)
- Notification engine (deferred to v2.3 — proper multi-channel)
- AI switchboard (beyond current single-VAPI-agent) (deferred to v2.3)
- CRM Guru agent population (deferred — underbuilt, parked)
- Tasks concept (scope unclear, deferred to v2.3)
- Executive / Management module (deferred to v2.3)
- Marketing agent / module functionality (waiting on dealer marketing API logins)

**Recently committed governance work** (last 5 commits on `wave-pe3`):
- `343c109` — subtractive harness migration (ceremony layers retired)
- `607923d` — plan.md v1 + backlog.md populated
- `d3d0610` — operator clarifications applied to plan
- `5ac4674` — sprint registry mark
- `0e0a0b3` — captain-introduced additions to plan.md (DNA alerts, Sprint 1.6/2.10/2.11/2.12, schema change). **This commit contains content the operator did not approve**; pending decision on revert/keep/mark-as-proposed.

---

## 7. Current Sprint Plan

Plan structure: phases → sprints → tasks → steps. Detailed sprints in `backlog.md`. This brief shows the phase-level shape only.

**Operator-agreed phase structure:**

| Phase | Window | Purpose |
|---|---|---|
| 1 — Foundation | Thu-Fri Apr 24-25 | Pre-flight: codebase inventory, data + capability inventory, options menus, decision points |
| 2 — Critical for Monday | Fri-Sat Apr 25-26 | Ship contract features for Mon Apr 27 launch |
| Saturday Checkpoint | Sat Apr 26 10 PM ET | Decision gate — full or reduced-scope launch |
| 3 — Hardening + Go-live | Sun-Mon Apr 26-27 | Deploy prep, kill switch, dry run, Serra Honda live |
| 4 — Non-critical Completion | Tue Apr 28 → Sun May 11 | Remaining stores rollout, Phase-2-deferred features, Lago monitoring, agent config UI, etc. |
| 5 — Final Deploy + v2.3 Handoff | Mon May 12 → Sun May 18 | Security audit, performance, v2.2 closeout, v2.3 planning kickoff |

**Phase 1 sprints (in pre-flight, partially complete):**
- 1.1 Plan + governance closure — in progress
- 1.2 Codebase inventory — **complete**, output at `evidence/v2.2-inventory-2026-04-24.md`
- 1.3 Data + capability inventory — pending (uses sample data in `../nexxus/docs/uploads/` while waiting on Durran's 45-day fresh export)
- 1.4 Options menu (alerts/reports/insights captain could build) — pending
- 1.5 TeamBox first-principles research — **complete**, output at `evidence/teambox-first-principles-2026-04-24.md`. Verdict: Hybrid (keep TeamBox, add domain-aware segmentation, embed filtered views in Sales/Service/Marketing)

**Critical Monday-blocking work (Phase 2):**
- Trigger activation end-to-end (after-hours DEFER fix, isNexxusOriginatedLead URL match, SMS appointment intent, appointment admin email, first-inbound AI path, `{{dealershipName}}` template fix)
- Widget verification + Serra Honda VDP deploy via Cox
- Durran testing package (he validates SMS scenarios on test phones over the weekend)
- Inbound voice → ADF verification across the 3 Serra stores
- Core reports verification at all 5 stores (sales-only filter through scheduler)
- Chat capabilities E2E at all 5 stores
- TeamBox verification at all 5 stores
- Service campaigns E2E at Serra Honda (operator walks one through)

**Captain-introduced sprints awaiting operator decision (in commit `0e0a0b3`, NOT yet confirmed scope):**
- Sprint 1.6 — `conversations.department` data model + backfill
- Sprint 2.10 — Security closure (6 issues I-244 through I-249)
- Sprint 2.11 — Insights page visual audit
- Sprint 2.12 — Daily Briefing MVP
- Sprint 4.10 rescope — Tier-2 alerts + multi-channel delivery

These may survive operator review or be reverted. A programmer picking this up should treat them as proposed, not committed work.

**Phase 4 (post-Monday) work:**
- Health monitoring service + daily eval (proper, not rushed)
- Widget rollout to remaining 4 stores
- FTC scanner UI + reports (waits on operator's FTC technical document)
- Competitive intelligence module (PMA inventory + pricing + FTC compliance flag)
- Metrics cleanup across UI
- TeamBox segmentation (full Hybrid implementation)
- Agent configuration UI (unhardcode)
- Conversation flow viewer
- Lago billing monitoring-only
- Performance audit pass 1

**Phase 5:**
- Targeted security audit + fix pass
- Performance audit
- v2.2 final verification sweep
- v2.2 closeout report
- v2.3 planning kickoff

---

## 8. Outstanding Issues — Programmer Pitfalls

Top issues a programmer should know about before touching the codebase:

### Security (open, paid-contract paths)
- **I-244** — IDOR on `/api/vin/leads/summary`: any authenticated user can query any org's leads. Needs orgId match enforcement. Touches `server/vendorProxy.ts` and `server/routes/`.
- **I-245** — AI system prompt writable by `org_admin` via URL bypass; should require `super_admin`.
- **I-246** — Role dropdown lets `org_admin` assign roles they shouldn't be able to assign. Server-side gating missing.
- **I-247** — Org slug is mutable via PATCH; breaks widget embeds with no warning. Needs removal from PATCH schema.
- **I-248** — Invalid timezone string crashes outbound gate (NaN hour permanently blocks SMS/phone).
- **I-249** — Self-deactivation: `org_admin` can deactivate themselves with no reactivation path.

### Trigger system (3 bugs, currently irrelevant because triggers off but blocking before activation)
- After-hours DEFER path doesn't actually send the next morning — only writes a deferred activity log
- `isNexxusOriginatedLead` matches lead source by name, but VIN sync stores URLs (I-261, I-276, I-279)
- Two overlapping trigger code paths in `triggerService.ts` and `scheduler.ts:checkTriggerConditions` — fragile, currently working but worth hardening

### SMS / Conversation
- First inbound SMS gets only auto-greeting, not AI reply (gate at `sms.ts:471`). Decision needed: keep greeting-only or AI-immediately.
- After-hours SMS skips AI entirely (also at `sms.ts:471`). Same decision needed.
- No SMS-side appointment intent detection (voice has it; SMS does not).
- No admin email on appointment creation (DB row created silently).
- `{{dealershipName}}` template variable leaks literal text to Claude (I-269) — visible to customers in agent chat context.

### TeamBox / Inbox
- `conversations` table has no `department` column. TeamBox can't filter by sales/service/marketing because it can't derive it.
- 5 task-view states (ST-093-097) still listed in feature map even though I-147/I-162 say the feature was removed. Operator intent unclear.
- "Push to VIN" link in TeamBox has unclear UX — needs tooltip + confirmation dialog.
- Sales / Service / Marketing sections have ZERO conversation surface — a BDC rep in Sales has to leave the page to answer a customer.

### Reporting / Insights
- Insights page never visually verified end-to-end. May render incorrectly for some role/org combinations (I-156, I-163).
- 30-day metrics may be sales-vs-service-mixed in some places (the issue Durran caught last week — we sent corrected reports, sales-only filter is now opt-in but not yet scheduler-default).

### VIN Integration
- `warehouse_leads.lead_source` may store URLs instead of human-readable names. Three issues track this (I-261, I-276, I-279) — root cause may be central-mcp or may be local sync code, not yet verified.
- VIN Solutions does NOT accept appointment writes. Appointments stay in our DB and trigger admin email; no VIN sync path.
- VIN-safe-mcp is the ONLY write path. Never write through central-mcp.

### Billing
- Lago billing module renders 26 UI states but every backend returns `{configured: false}`. Effectively dead in v2.2. Monitoring-only is the v2.2 scope; full integration is v2.3.

### Marketing
- Module exists in code but waiting on dealer marketing API logins to operate. Operator is working on getting them.

### Data freshness
- Durran's 45-day CRM export expected to land in `uploads/crm-exports-2026-04-23/`. Empty as of session end.
- VIN API exposes a subset of available data; some operational fields (DNC flags, status-change audit, opt-out patterns, mystery sources) only exist in the manual export.

### Infrastructure / Deploy
- `nexxus-app` PM2 process has 72 restarts over 7 days uptime — high churn, worth investigating.
- No automated health monitoring exists today. Manual eyes-on for Monday Day 1; proper monitoring builds in Phase 4.
- Deploy command: `npm run build && pm2 restart nexxus-app`. Always confirm with operator before running.

---

## 9. Important Notes

### File-system boundary (incident-backed)
**A builder agent must never modify files outside `/home/ubuntu/Claude-store/nexxus2.2_replit/`.** Incident REM-8-DT (2026-03-19): a sub-agent rewrote `central-mcp/src/connectors/vin-connector.ts` without authorization; central-mcp had no git repo and the change couldn't be reverted. Enforced by `~/.claude/hooks/file-boundary.sh`.

### VIN write protocol
Every VIN write goes through `vin-safe-mcp` (port 4003). Sequence: `prepare → review → execute → verify`. Skipping any step is forbidden. Never use `central-mcp` for VIN writes.

### Action classification (from CLAUDE.md)
- **Safe (do freely):** read any file, write to `evidence/` and `tests/`, run dev server, run single test files
- **Confirm with operator first:** modify `server/`, `client/src/`, `shared/`; `npm run build`; `pm2 restart`; DB schema changes
- **Irreversible — require explicit operator "go":** any VIN/VAPI/TextMagic/Tavus/Resend/FlexPrice write; any email or SMS to real addresses or numbers; any production deploy; any migration on production; any git push or force push

### CommGate
Every outbound communication respects the `CommGate` flag on the organization. If disabled, sends are logged with status `blocked`. **Never bypass CommGate, even for "quick tests."** Prior incident (INC-001, 2026-04-13): SMS leak to 7 real customers at 3 AM. Trauma is real and the safety design is intentional.

### Test accounts
All accounts use password `NexxusTest2026`:
- `duane.wells@huminic.ai` — super_admin (Huminic)
- `duanekwells@gmail.com` — partner_admin (Cage Automotive)
- `serra_honda@huminic.ai`, `serra_nissan@huminic.ai`, `serra_ford@huminic.ai`, `columbia_hyundai@huminic.ai`, `columbia_ford@huminic.ai` — org_admins per store

### Required env vars
`ANTHROPIC_API_KEY`, `BRAVE_API_KEY`, `APP_BASE_URL`, `VIN_SAFE_MCP_TOKEN`, `DATABASE_URL`, `VINSOLUTIONS_API_KEY`, `OPENAI_API_KEY`, `FAL_KEY`, `RESEND_API_KEY`. Missing env = silent feature failures.

### Governance philosophy (post-migration, 2026-04-23)
The harness was subtractively revised. Heavy ceremony (sprints.json registry, ghost-gate state machine, captain-check 7-gate pre-commit, watchdog) was retired. Active mechanisms now: `file-boundary.sh`, `branch-guard.sh`, plain-markdown governance files (`plan.md`, `backlog.md`, `issues.md`, `CLAUDE.md`, two-file project memory). Per cross-project standards at `~/Claude-store/sysadmin/governance-framework/file-standards.md`.

### Working modality
Operator works in distinct **planning mode** vs **execution mode**.
- **Planning mode:** straw-man + iterate. plan.md is the durable artifact where decisions land. No execution. Captain proposes adjustments, operator pushes back, plan evolves until complete picture is agreed.
- **Execution mode:** captain dispatches autonomous sub-agents against the agreed plan. No reactive plan changes.

A captain who introduces sprints into plan.md without operator agreement is overstepping. The current commit `0e0a0b3` is an instance of this overstep — pending operator decision on how to handle.

### Things that are "default off" by rule
- All new alerts/reports must be opt-in, not opt-out. Hard rule.
- Triggers stay off per-org until operator explicitly enables (whitelist phase first).
- Lago billing surfaces stay off (until v2.3 full integration).

---

## 10. Where to Start (programmer onboarding)

1. Read this brief (you're here)
2. Read `CLAUDE.md` for project rules and runtime info
3. Read `plan.md` for current phase and sprint context
4. Read `backlog.md` for the sprint detail you'll work on
5. Read `issues.md` for known defects you may bump into
6. Skim `evidence/v2.2-inventory-2026-04-24.md` for the full feature-state map
7. Skim `evidence/teambox-first-principles-2026-04-24.md` if your work touches conversations or inbox UX
8. Skim `~/.claude/projects/-home-ubuntu-Claude-store-nexxus2-2-replit/memory/session-output.md` for the latest session handoff
9. Check `git log --oneline | head -10` for recent commits
10. **Before writing any code:** confirm the task is in an active sprint, the file you're editing is in scope, and the operator has authorized the change class (safe / confirm / irreversible)

---

**End of brief. State as of 2026-04-24. Re-validate against current files before acting on any specific claim.**
