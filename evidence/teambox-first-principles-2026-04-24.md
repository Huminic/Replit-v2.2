# TeamBox First-Principles Evaluation

**Date:** 2026-04-24
**Live site tested:** https://dev.huminicdev.com/ (dev UP, HTTP 200)
**Accounts used:** `duane.wells@huminic.ai` (super_admin, Huminic org), `serra_honda@huminic.ai` (org_admin, 60 conversations)
**Evidence screenshots:** `evidence/teambox-ux/01`..`10`

---

## 1. Current state observations

**Navigation.** Primary sidebar (`client/src/components/layout/Sidebar.tsx` L55–63): AI Chat, **TeamBox**, Sales, Service, Insights, Marketing, Manage, System. TeamBox (`pages/teambox.tsx`, 1030 LOC) is its own top-level surface with a 4-column internal layout: filter rail → list → thread → customer info.

**TeamBox filters.** Status (open / assigned-to-me / participating / automated / scheduled / followup / pending) and Channel (SMS / Email / Web Chat / WhatsApp / Voice). A dropdown labeled "All Conversations" is actually a **campaign** filter, not a domain filter (`10-allconversations-dropdown.png`). **No sales/service/marketing toggle anywhere.** Internal duplication is already creeping in: TeamBox has a "Conversations / Workflows" tabset (Workflows = `coming soon` placeholder) plus a second "Conversations / Phone / Video" tabset pulling voice/video OUT of the unified thread view.

**Customer Info panel** shows Name, Channel, Status, Assign-to, Quick Actions (Call/Email/SMS), `Push to VIN`. Does NOT show linked lead, appointment, campaign, vehicle of interest, or RO#. It behaves like a helpdesk, not a CRM.

**Sales** (`pages/sales.tsx`, 799 LOC). Tabs: Dashboard / Agents / Insights / Calendar. Metric tiles + Top Performing Agents + Recent Activity (mostly `Login Failed`, `Email Sent`). **No inbox, no reply affordance, no conversation link.** DOM scan confirmed zero buttons or anchors matching `/conversation|inbox|reply/i`.

**Service** (`pages/service.tsx`, 908 LOC). Tabs: Campaigns / Agents / Insights / Calendar. Default = outbound campaigns table (Recipients / Sent / Replied / Kill Switch). Calendar is a month grid. **No inbox, no per-appointment thread.** A service advisor cannot see a customer's reply from here.

**Marketing** (`pages/marketing.tsx`, 311 LOC). Tabs: Dashboard / Agents / Studio / Insights. AI-agent-driven (Photo Studio, Video Producer, Copywriter, Creative Director, Market Intel). **No inbox.**

**Data model** (`shared/schema.ts` L86). `conversations` has `customerName, customerEmail, customerPhone, channel, status, agentId, assignedTo, organizationId, campaignId` — **no `department` column.** Domain is only inferrable when `campaignId` or `agentId` is set (both those tables have `department`). Organic inbound SMS / web chat / inbound call have no domain at all in the data model.

**Cross-channel sink.** Super_admin notifications (`07-notifications.png`) explicitly say `Video Conversation Completed … added to TeamBox`, `New Inbound Call Completed`, `New inbound SMS`. The system already treats TeamBox as the universal inbox.

**Role behavior.** org_admin (serra_honda) sees the same TeamBox as super_admin, minus Manage. No role-narrowing. Serra Honda's sidebar shows SMS 22 / Email 3 / Phone 18 — 60 total. No domain slicing.

---

## 2. First-principles framework (adjusted)

A customer conversation has five dimensions. The DB models three explicitly, two by inference:

| Dimension | Modeled explicitly? | Source |
|---|---|---|
| Channel (SMS, email, chat, WhatsApp, voice) | Yes | `conversations.channel` |
| Stage (open, automated, followup, closed…) | Yes | `conversations.status` |
| Owner (agent, human, unassigned) | Yes | `agentId`, `assignedTo` |
| Domain (sales / service / marketing) | **No** | inferred via campaign or agent |
| Customer identity / VIN linkage | Partial | phone/email; no lead or RO FK |

Current app privileges channel + stage (in TeamBox) and treats domain as second-class. Sales/Service/Marketing pages privilege domain but focus on outbound (campaigns) and analytics — not conversation handling.

Jobs-to-be-done tested:
1. **BDC rep handling SMS reply on a sales inquiry:** wants a queue with lead context one click away. Served OK by unified inbox with filters.
2. **Service advisor handling an appointment question:** wants the message beside the appointment (appointment is the anchor object). **Not served today** — messages and appointments live on different pages.
3. **GM/partner_admin spot-check across domains:** wants one queue with volume and escalations. Served OK by unified inbox.

So 2/3 flows are fine with unified; 1/3 (service) is broken. That's the signal.

---

## 3. Three options evaluated

### Option A — Keep unified TeamBox (current)
Pros: cross-channel events already route here; GM spot-check is one click; data model already domain-less (no migration); Push-to-VIN lives with the thread.
Cons: service-advisor flow broken; no domain filter means service reminders mix with sales inquiries (will get worse at scale — Serra Honda at 60 already mixed); Customer Info panel context-free; internal duplication already fracturing (double tabsets, Workflows placeholder).

### Option B — Split inboxes under Sales / Service / Marketing, delete TeamBox
Pros: service-advisor flow fixes itself (inbox beside calendar); sales inbox collocates with pipeline; marketing inbox collocates with campaigns; domain context travels with thread.
Cons: schema change required (`conversations.department` + backfill + orphan rule); GM spot-check becomes 3 clicks unless aggregator built; orphan conversations (unknown-number SMS, no campaign) have nowhere to go; 3× UI surface; Push-to-VIN / Take Over / Campaign Disconnect must be replicated or centralized; breaks the "added to TeamBox" notification sink that already exists.

### Option C — Hybrid
Keep TeamBox as the unified top-level surface (BDC, GM, orphans, cross-domain oversight). Add **domain-filtered inbox views embedded in each section** — same conversation-list component with a pre-applied `department=sales|service|marketing` filter mounted on `/sales`, `/service`, `/marketing`.

Pros: BDC and GM flows stay one-click; service-advisor flow gets fixed; marketing reply-attribution collocates naturally; shared features (Push to VIN, Take Over, Campaign Disconnect, assignment) live in one component; single schema change; orphan conversations degrade gracefully (stay in TeamBox, not hidden).
Cons: requires discipline — the three section inboxes must be pure views, not parallel implementations, or drift sets in; backfill rule for existing conversations needs an owner call (default orphan SMS to `sales`? leave `null`?); users need light education on the three places' relationship (true regardless).

---

## 4. Recommendation

**Option C (hybrid). Pick it.** Rationale, blunt:

1. The architecture is already halfway here. TeamBox is the sink, sections are the control surfaces, and the data model has no domain column. The unified-vs-split framing is a false dichotomy — what's actually missing is the domain classifier and section-embedded views.
2. Option A leaves the service-advisor flow broken and the Customer Info panel context-free. Both are load-bearing for the product's CRM claim.
3. Option B is a 3× multiplier on UI surface and creates an orphan-conversation problem at the data model with no obvious home. It also breaks the GM spot-check flow that works today.
4. Option C adds one column, one embedded view per section, and reuses the same list component. Repairs broken flows without discarding working ones.

The operator's instinct — "maybe split it" — is correct about the problem but an overcorrection on the solution. **Problem: TeamBox doesn't know about domain. Fix: teach it, then render domain-filtered views where the user already is. Don't delete the central surface.**

Tactical sequence if approved:
1. Add `conversations.department` (`sales|service|marketing|null`).
2. Backfill: `campaignId` set → inherit campaign's department; else `agentId` set → inherit agent's; else null.
3. Add domain chip in TeamBox list rows and Customer Info panel.
4. Extract `<ConversationWorkbench filter={...} />` from `teambox.tsx`.
5. Mount filtered instances on `/sales`, `/service`, `/marketing` as a new tab.
6. Teach Customer Info panel to fetch lead / appointment / campaign context when FK present (separate sprint — scope-able out).

---

## 5. Implementation cost estimate per option

Rough engineering hours for one mid-level full-stack dev familiar with this codebase. Excludes QA, governance overhead, evidence.

| Option | Schema | Backend | Frontend | Tests | Total | Files touched |
|---|---|---|---|---|---|---|
| A — keep unified | 0 | 0 | 2–4 (trim double tabs, remove Workflows placeholder) | 1 | **3–5 h** | 1–2 |
| B — split, delete TeamBox | 6–8 | 6 (routes, filters, aggregator for GM later) | 40–60 (3 parallel inbox UIs, reassign shared features) | 16 | **68–90 h** | ~25 |
| C — hybrid | 6–8 | 4–6 (`?department=` filter on `/api/conversations`) | 18–24 (extract Workbench, mount 3 filtered views, domain chips) | 10 | **38–48 h** | ~12 |

Option B hidden cost: migrating the notification sink (currently says "added to TeamBox") and retraining users away from the existing unified mental model. Several more hours.

Option C primary risk: Customer Info context fetch creep. Scope that as a separate sprint so the inbox-per-section work is independently shippable.

---

**End of report.**
