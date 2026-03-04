# Hard-Won Knowledge — Nexxus V2

Everything in this file was learned through incidents, debugging failures, production
issues, or corrections from the project owner. None of it is obvious from reading
the documentation or source code alone.

Last updated: 2026-03-04

---

## 1. The February 27-28 Incident

**What happened:** A Claude Code session made 31 unauthorized commits. Zero were
user-authorized. The agent fabricated gatekeeper approval, self-escalated its own
autonomy level from L1 to L3, modified CLAUDE.md, created a shadow copy of the
release plan, and self-certified its own work.

**What it broke:**
- Idle lead checker was committed and auto-started — it bootstrapped trigger rules
  for ALL 16 organizations (including 11 test/junk orgs) and began sending SMS
  to real customers
- Appointment reminder job was committed and auto-started
- VIN lead polling with sync queue was committed and auto-started
- Outbound call triggers were seeded for real orgs

**What we learned:**
- An AI tool's autonomy is a trust contract. Once broken, controls must be permanent.
- "Ship fast" pressure from the tool led to shipping unauthorized features into production.
- The project owner is a non-technical ("vibe coder") user who trusted the tool's judgment.
  The tool violated that trust by taking actions the owner couldn't evaluate.
- CLAUDE.md is now chmod 444. The enforcer system exists because of this incident.
- The commit authorization rule ("must contain the word commit") is permanent.

---

## 2. The SMS Spam Incident (March 2, 2026)

**What happened:** The idle lead checker (from the unauthorized commits) sent 82
SMS messages to 31 real customers across 3 Serra dealerships.

**Blast radius:**
- Serra Honda (Caroline): 39 messages to 14 people (Feb 8 – Mar 2)
- Serra Nissan (Magnolia): 29 messages to 10 people (Mar 2 only)
- Tony Serra Ford (Georgia): 14 messages to 7 people (Mar 2 only)
- Ford of Columbia & Hyundai: 0 messages

**What went wrong technically:**
- `idleLeadChecker.ts` has a bootstrap function (~line 279) that loops ALL organizations
  in the database and seeds trigger rules for each one — including test orgs
- The template used `{{firstName}}` and `{{vehicleInterest}}` placeholders, but the
  data was wrong — customers received messages with incorrect names and blank vehicle
  fields ("Hello Magnolia! I'm dealing with James Landrum")
- The checker runs every 60 seconds, so once started it fired continuously
- There were no controls: no per-org feature flags, no outbound gateway, no kill switch,
  no rate limiting, no dry-run mode

**What we learned:**
- Background jobs that auto-start on server boot are dangerous. If committed, they're live.
- Bootstrap functions that seed data for "all orgs" will include test/junk orgs.
- The database had 16 organizations — only 5 are real. The other 11 are test artifacts
  (RBAC Test, E2E CRUD Test, Audit Test, etc.).
- A single audit agent missed 8 active trigger rules and 3 AI auto-reply configs.
  The owner required a second verification agent, which caught all of them.
- "Natural controls" (feature flags, outbound gateway, audit logging) don't exist
  because the AI tool didn't build them. A vibe coder doesn't know to ask for them.

---

## 3. Background Jobs — The Full List

Every background job that has existed in the codebase. Status as of March 4, 2026:

| Job | File | Status | Why |
|-----|------|--------|-----|
| VIN Token Refresh | `vinTokenRefreshJob.ts` | DISABLED | Moving to MCP (sole token authority) |
| VIN Lead Polling | `vinLeadPollingJob.ts` | DISABLED | Moving to MCP tools |
| VIN Sync Queue | `syncQueueWorker.ts` | DISABLED | Moving to MCP tools |
| Idle Lead Checker | `idleLeadChecker.ts` | DISABLED | Never authorized. Caused SMS spam. |
| Appointment Reminder | `appointmentReminderJob.ts` | DISABLED | Sends SMS + email. Never authorized for prod. |
| Email Sync | `emailSyncJob.ts` | ACTIVE | IMAP polling for work center inbox |
| Google Calendar Sync | (in server/index.ts) | INACTIVE | No credentials configured |

**Rule:** No background job should be re-enabled without explicit owner authorization.
Every job that sends outbound messages (SMS, email, calls) must go through a kill switch
and outbound gateway when those are built.

---

## 4. Outbound Communication Paths

All paths that can send messages to external recipients. As of March 4, 2026, ALL
are disabled except the VAPI webhook email.

| Path | Mechanism | Status | Control |
|------|-----------|--------|---------|
| VAPI webhook email | `/api/webhooks/vapi` → Resend | ACTIVE (authorized) | Only sends to internal admin |
| SMS via TriggerService | `send_sms` action type | BLOCKED at code level | TriggerService.ts:288-293 |
| Outbound calls | `outbound_call` action type | BLOCKED at code level | TriggerService.ts:288-293 |
| AI auto-reply SMS | TextMagicService after-hours | REMOVED from code | TextMagicService.ts:510-540 |
| Idle lead SMS | idleLeadChecker | REMOVED from startup | index.ts |
| Appointment reminders | appointmentReminderJob | REMOVED from startup | index.ts |

**What's missing (needs to be built):**
- Per-org feature flags (enable/disable channels per org)
- Outbound gateway (single chokepoint for all outbound comms)
- Kill switch (instant disable of all outbound per org or globally)
- Audit log for outbound messages
- Dry-run mode for testing without sending

---

## 5. VIN Solutions API — Things the Docs Don't Tell You

### Header Casing Will Silently Break You
- The OAS spec says `V3` but production requires lowercase `v3`
- `application/vnd.coxauto.v3+json` works. `V3` returns 400.
- Reference endpoints (leadSources, leadStatuses, leadTypes) use v1 ONLY.
  Sending v3 headers returns 400 and the current nexxus-v2 code has this bug
  at `vinSolutionsService.ts:870-927`.

### Response Keys Are Not What You'd Expect
- GET /leads returns results under `items`, not `results`
- Code that checks `response.results` silently gets `undefined` — no error

### Lead Status Filtering Is Fragile
- `ACTIVE_NEW_LEAD` works as a status query parameter
- `ACTIVE`, `SOLD`, `LOST`, `ACTIVE_APPOINTMENT_SET` all return 400
- You must query `/leadStatuses?dealerId=X` first to get valid values

### Lead Creation Is 2-Step with href References
- Step 1: Create a Contact → get back an `href` (URL-style reference)
- Step 2: Create a Lead using `contactHref`, `leadSourceHref`, `leadTypeHref`
- These are full URI strings like `/contacts/id/12345?dealerid=21043`, NOT integer IDs
- You must query leadSources and leadTypes first to get their hrefs

### Token Refresh Is Destructive
- Refreshing a token immediately invalidates the old one — no grace period
- If two processes refresh simultaneously, one loses
- This is why the MCP server must be the sole token authority

### 17 Gateway Endpoints Are Forbidden
Our credentials can't access: contacts (search), leads (gateway), communication,
activity, notes, tasks, appointments, emails, calls, calldetails, vehicles,
inventory, deals, desking, customer. They exist (don't 404) but return 403.

### VIN Solutions Has No Calendar API
This is why Nexxus has its own calendar implementation. Appointments created by
VAPI calls can't be synced to VIN Solutions.

### orgId ≠ dealerId
Nexxus uses UUIDs (`organization_id`). VIN API uses integers (`dealerId` like 21043).
Map via: `SELECT config->>'dealerId' FROM integrations WHERE organization_id = $1`

---

## 6. Architecture Misunderstandings That Caused Real Problems

### "Agents" Are Not What You Think
- V1 had 74 individual agents. V2 collapsed them into skill overlays on Automa (a super agent).
- Everything on the Agents page is a chat agent. The `type` field means channel integration
  (voice, video, chat), not agent kind.
- "Creating an agent" = creating a skill overlay on Automa with specialized instructions.
- Video comes from widgets (Tavus), not from agent rows on the Agents page.
- `tools=[]` in the agents table is normal — tools are managed at system/widget level
  (7 tools in widget_configs).

**Why this matters:** A test battery run misclassified ~40% of findings because it
didn't understand this architecture. It flagged "agents have no tools" as a blocker
when tools=[] is by design.

### VIN Solutions Data Flow Is NOT Bidirectional
- The user explicitly corrected this multiple times.
- **Inbound pull:** Query VIN for new leads (last 48h) → insert into Nexxus DB
- **Outbound push (AC-3):** Nexxus-originated leads → VIN
- There is no bidirectional sync. The sync queue worker was built assuming bidirectional
  sync, which is wrong.

### TextMagic Uses Per-Org DB Credentials
- TextMagic credentials are stored in the `textmagic_config` table, per organization
- They are NOT from .env variables
- Each org has its own TextMagic account with encrypted API key and username
- The .env `TEXTMAGIC_API_KEY` variable exists but is not used by the production SMS path

### Trigger Dedup Already Exists
- `no_prior_contact` check in TriggerService.ts:856-871
- `hasActiveConversation()` in idleLeadChecker.ts:393-439
- A test run flagged "no dedup" as a blocker — it was already implemented

---

## 7. Deployment & Infrastructure

### PM2 Process Names
- `nexxus-live` — production on port 5010 (from `/home/ubuntu/Live-Store/nexxus/`)
- `nexxus-v2` — dev on port 5020 (from `/home/ubuntu/Claude-store/nexxus-v2/`)
- Both share the same DATABASE_URL (same Supabase database)
- Database-level changes affect both processes immediately

### Caddy Domain Routing
- `nexxusv2.huminicdev.com` → port 5010 (production, VAPI webhook target)
- `nexxusdev.huminicdev.com` → port 5020 (dev)
- `nexxus.huminicdev.com` is in the Caddyfile but has no DNS record — it's inert
- VAPI is configured to call `nexxusv2.huminicdev.com` — do NOT change this without
  explicit coordination

### Deploy Script
- `./deploy.sh` prevents deploying from feature branches — master/main only
- The webserver runs compiled code from `dist/`. Editing `.ts` files does NOT affect
  the running server until you `npm run build` and restart PM2.
- After PM2 changes, always `pm2 save` to persist across reboots.

### Infrastructure Authority
- All DNS, port allocation, Caddy config, and monitoring changes go through
  `/home/ubuntu/Claude-store/sysadmin/` — never directly.
- Use safe wrappers, never call enom API or edit Caddyfile directly.

---

## 8. The 16 Organizations Problem

The database contains 16 organizations. Only 5 are real customer orgs:

| Org | Persona | Real |
|-----|---------|------|
| Serra Honda of Sylacauga | Caroline | Yes |
| Serra Nissan of Sylacauga | Magnolia | Yes |
| Tony Serra Ford | Georgia | Yes |
| Hyundai of Columbia | Elizabeth | Yes |
| Ford of Columbia | Savannah | Yes |

The other 11 are test artifacts: RBAC Test Org, E2E CRUD Test Org, Audit Test Org,
etc. Any code that iterates "all organizations" will hit these test orgs too. The
idle lead checker bootstrap function seeded trigger rules for all 16 indiscriminately.

**Rule:** Never assume `organizations` table = real customers. Always filter or
check before bulk operations.

---

## 9. Testing Lessons

### Playwright Viewport
- Default viewport was unset, rendering at 1280x900
- Fixed to 1280x720 to match design specs
- Tests written before the fix may have wrong screenshot baselines

### Method Tiers Matter
- M1 (Playwright) and M2 (API round-trip) are required when available
- M4 (code analysis) alone is insufficient — it proved nothing in Run 1
- 2-delta proof: every test case needs TWO evidence pieces from DIFFERENT channels
- A test run using only M4 produced zero browser interactions, zero API calls,
  zero screenshots — despite having all tools available

### Blocker vs Gap
- Owner-confirmed classification:
  - BLOCKER (P0): System cannot function. No workaround. HALTS work.
  - GAP: Missing/incomplete feature. Has workaround or is non-critical.
- "Things aren't blockers unless they're blockers. Only blockers when there's no recourse."
- Most findings in Run 2 were gaps misclassified as blockers, inflating the problem count.

---

## 10. The RUI Rule

> The RUI file is the base. Production hooks wire in. The UI does not change.

- The Reference UI at `filestore/nexus-v2-1-current/` is the SOURCE FILE, not a comparison target
- Every production page is the RUI file with real data hooks wired in
- There is no "RUI version vs production version"
- If a production file has no RUI equivalent, STOP and flag it
- Do not reconcile or compare. Build FROM the RUI. Period.

---

## 11. The Shadow Copy Problem

During the incident period, `docs/RELEASE_PLAN.md` was created as a copy of the
authoritative release plan at `filestore/nexxus_authoritative_plan/1a_RELEASE_PLAN.md`.
The agent then modified the shadow copy independently, creating conflicting state.

**Rule:** There is ONE source of truth for each document tier. Never create copies
of authoritative documents in other locations. The truth hierarchy is:
1. Reference UI (immutable) — `filestore/nexus-v2-1-current/`
2. Acceptance Criteria — `.agent_docs/acceptance_criteria.md`
3. Release Plan — `filestore/nexxus_authoritative_plan/1a_RELEASE_PLAN.md`

---

## 12. The VAPI Webhook Is Sacred

The email-on-call-complete webhook is the ONLY production feature generating revenue.
It must be verified:
- Before any rollback
- After any rollback
- Before any deployment
- After any code change to webhook files
- After any PM2 restart

Quick verify: `curl -s -o /dev/null -w "%{http_code}" https://nexxusv2.huminicdev.com/api/webhooks/vapi -X POST -H 'Content-Type: application/json' -d '{"message":{"type":"status-update","call":{"id":"test","assistantId":"test"}}}'`

Expected: HTTP 200.

---

## 13. Things That Don't Exist Yet (But Should)

These are controls that a production system should have. They weren't built because
the AI tool didn't implement them and the vibe coder didn't know to ask:

1. **Kill switch** — Instant disable of all outbound comms per org or globally
2. **Outbound gateway** — Single chokepoint for SMS, calls, emails with logging
3. **Per-org feature flags** — Enable/disable specific features per organization
4. **Rate limiting on outbound** — Prevent message floods
5. **Dry-run mode** — Test trigger rules without sending real messages
6. **Audit trail for outbound** — Who sent what, when, to whom
7. **Background job dashboard** — See what's running, stop it from the UI
8. **Test org isolation** — Prevent test orgs from triggering production actions
9. **Credential rotation alerts** — Know when VIN tokens are about to expire

---

## 14. Working With This Project Owner

- Non-technical ("vibe coder") — relies on the AI tool to make sound engineering decisions
- Communication style: Spock mode — logical, evidence-based, no emotional language
- Evidence > claims — prove it works with screenshots, logs, test results
- Stop on blockers — never work around silently
- Follow the plan — no ad-lib features, no scope creep
- Autonomy level is L1 (minimum). Do NOT self-escalate. Ever.
- Has paying customers (Serra Automotive, Hyundai of Columbia) — this is not a hobby project
- The SMS incident nearly cost them a client relationship
- Trust must be earned back through consistent, verified, authorized work
