# Nexxus Connect v2.2 — Open Issues

Single source of truth for all open issues. Updated per sprint.
Every must-fix item has Background, Outcome, and Acceptance Criteria.

---

## Must Fix (15 items — Sprint I-1)

### I-001: TeamBox layout inverted
**Background:** TeamBox has a static left column showing Conversations/Tasks AND a popup overlay with Conversations/Tasks/Workflows. The popup content should be the persistent column; the static column content should be the popup.
**Outcome:** TeamBox left column shows Conversations/Tasks/Workflows persistently. Hovering sidebar shows the simplified popup version.
**Acceptance Criteria:** Open TeamBox → left column has Workflows tab. Hover sidebar → popup does NOT have Workflows.

### I-002: Sales missing 3 agents
**Background:** Sales staff have no Communication, Sales Coach, or Writing agents. These agents don't exist in the database for most dealers.
**Outcome:** Each dealer has 3 Sales agents: Communication (named per dealer — Caroline, Elizabeth, etc.), Sales Coach (knowledge + web search), Writing (text/email drafting).
**Acceptance Criteria:** Login as Sales → submenu shows 3 agents below separator. Each agent opens a chat. Agent names match dealer personas.

### I-003: Service missing chat agent per store
**Background:** Service staff have no dedicated chat agent for handling service conversations at most stores.
**Outcome:** Each dealer has a Service chat agent.
**Acceptance Criteria:** Login as Service → service submenu shows at least 1 agent. Agent handles service-related questions.

### I-004: Elizabeth in wrong department
**Background:** Elizabeth (Hyundai of Columbia) and Elizabeth (Serra Honda) are assigned to marketing department. They are communication agents and belong in sales.
**Outcome:** Both Elizabeth agents moved to sales department.
**Acceptance Criteria:** DB query shows Elizabeth agents with department='sales'. Marketing submenu no longer shows Elizabeth.

### I-005: Huminic master org creation
**Background:** Super Admin has no Huminic master organization. Currently assigned to a dealer org.
**Outcome:** Huminic org exists in database. Super Admin's home org is Huminic. Cage Automotive has relationship to Huminic.
**Acceptance Criteria:** Login as Super Admin → organization shows "Huminic". Huminic has no VIN integration, no billing. Cage Automotive is accessible via org switch.

### I-006: VAPI assistant URLs
**Background:** Most VAPI assistants have serverUrl pointing to nexxusv2.huminicdev.com (old deployment).
**Outcome:** All dealer assistants point to current server URL.
**Acceptance Criteria:** VAPI API query shows all assistants with serverUrl = dev.huminicdev.com. Note: will change again at launch.

### I-007: Ford/Hyundai 0 warehouse leads
**Background:** Ford of Columbia and Hyundai of Columbia have 0 warehouse leads.
**Outcome:** Both dealers have warehouse leads populated from VIN Solutions.
**Acceptance Criteria:** DB query shows warehouse_leads count > 0 for both orgs. Dashboard shows real metrics.

### I-008: Demand Score metric
**Background:** US-025 defines a Demand Score KPI tile. Never implemented.
**Outcome:** Demand Score tile appears on dashboard with data derived from VIN Solutions lead activity.
**Acceptance Criteria:** Navigate to insights or management dashboard → Demand Score tile visible with numeric value. Click shows detail.

### I-009: Campaign execution statuses cross-org
**Background:** GET /api/campaigns/execution-statuses returns ALL executing campaigns across ALL organizations.
**Outcome:** Endpoint filters by req.user.organizationId.
**Acceptance Criteria:** Login as org A → only org A campaigns returned. Login as org B → only org B.

### I-013: Outbound email via TeamBox
**Background:** TeamBox cannot send outbound emails. Staff need to send single emails from TeamBox using Resend.
**Outcome:** TeamBox has Send Email action via Resend (no-reply@huminic.ai), recorded in conversation thread.
**Acceptance Criteria:** Open conversation → Send Email → enter subject/body → email sends → message appears in thread.

### I-015: Populate additional_org_ids for GMs
**Background:** Serra GM manages multiple Serra stores. Columbia GM manages two Columbia stores. additional_org_ids column exists but isn't populated.
**Outcome:** GMs can switch between their assigned stores.
**Acceptance Criteria:** Serra GM login → org switcher shows 3 Serra stores. Columbia GM → shows 2 Columbia stores.

### I-026: Chat progress indicator
**Background:** Chat responses take 45-60 seconds when fetching VIN data. Users see nothing and think system is frozen.
**Outcome:** Clear progress/status indicator during long responses.
**Acceptance Criteria:** Send message triggering VIN lookup → indicator visible within 2 seconds → persists until response arrives.

### I-028: Tour modal behavior
**Background:** Tour modal appears on every page and follows across navigation until dismissed. Blocks interaction.
**Outcome:** Tour shows once per page on first visit. Dismissing does not restart on that page. Continues on unvisited pages.
**Acceptance Criteria:** Login → tour on main → dismiss → go to /sales → tour shows → dismiss → back to main → tour does NOT reappear.

### I-029: Sales should not see Billing
**Background:** Sales sidebar includes Billing. Per RBAC, only Org Admin+ should see billing.
**Outcome:** Sales, Marketing, Service do not see Billing in sidebar.
**Acceptance Criteria:** Login as Sales → no Billing icon. Login as Org Admin → Billing visible.

### I-034: getConversationByPhone org filter
**Background:** Storage method queries without organizationId filter. Could return cross-org conversations.
**Outcome:** Method accepts and filters by organizationId.
**Acceptance Criteria:** Code review confirms organizationId parameter added. SMS webhook passes org context.

### I-036: Inbound SMS agent processing (campaign response handling)
**Background:** The live testing spec and user stories define: "Service campaign sends SMS → Customer replies → Service Agent handles response → Agent continues (sets up appointment) or Staff takes over." Currently, when an inbound SMS arrives on an existing conversation, the system stores the message and increments unread count but does NOT route it to the dealer's communication agent for AI processing. For new conversations, only a static auto-greeting template fires — not a contextual AI response. The agent-based conversational channel that campaigns depend on does not exist.
**Outcome:** Inbound SMS on any conversation (campaign-originated or organic) is routed to the dealer's communication agent (same persona as VAPI — e.g. Caroline for Serra Honda). The agent processes the message through the AI chat pipeline with full tool access (VIN lookup, appointment scheduling, web search), responds via SMS, and the response is stored in the conversation thread. Staff can take over at any point via TeamBox.
**Acceptance Criteria:** Send SMS to dealer number → AI agent responds within 60 seconds with contextual reply → reply appears in TeamBox thread as agent message → agent can book appointments and answer inventory questions → staff takeover stops AI responses on that thread.

### I-037: VAPI outbound calls have no context — wrong greeting, no campaign goal, no customer data
**Background:** VAPI assistants have a single `firstMessage` configured for inbound calls (e.g. "Thanks for calling Serra Automotive..."). When the system initiates an outbound call via `sendPhone()` in outbound.ts, it passes only `assistantId` and `customer.number`. Missing: (1) `firstMessage` override — customer hears inbound greeting on outbound call, (2) no `assistantOverrides` for system prompt — AI has no idea why it's calling, (3) no campaign context — the campaign message template and goal are not passed, (4) no `phoneNumberId` — VAPI can't associate the call with the right number, (5) `customer.name` not passed — AI can't greet by name.
**Outcome:** Outbound VAPI calls pass full context via `assistantOverrides`: outbound-appropriate `firstMessage` using `{{customerName}}`, `{{agentName}}`, `{{dealershipName}}`; system prompt augmented with campaign reason/goal (e.g. "You are calling about an oil change reminder. Goal: schedule service appointment."); `phoneNumberId` and `customer.name` included in payload. Campaign `messageTemplate` drives the call's purpose.
**Acceptance Criteria:** Trigger outbound campaign call → AI greets customer by name → states reason for calling (from campaign template) → has clear goal (book appointment, confirm service, etc.) → does NOT say "thanks for calling" → `phoneNumberId` and `customer.name` present in VAPI call payload.

### I-038: VAPI webhook secret still rejecting — D1 not resolved
**Background:** I-1 changed webhooks.ts to use `VAPI_WEBHOOK_SECRET` instead of `VAPI_PRIVATE_KEY` for validation. However, live testing (T-2b) shows the webhook still rejects with "Invalid secret — rejecting request" (401). The call transcript from VAPI never reaches TeamBox. Server logs confirm: `POST /api/webhooks/vapi 401 in 2ms`. Either the `VAPI_WEBHOOK_SECRET` env var value doesn't match what VAPI sends in the `x-vapi-secret` header, or VAPI is sending the secret in a different header/format.
**Outcome:** VAPI end-of-call-report webhook is accepted by the server. Transcript is stored in TeamBox as a voice conversation.
**Acceptance Criteria:** Make VAPI call → call ends → server logs show `POST /api/webhooks/vapi 200` → conversation with transcript appears in TeamBox for the correct org.

### I-039: Route all third-party communications through MCP
**Background:** The app maintains its own TextMagic API key in `.env` and calls the TextMagic REST API directly from `outbound.ts`. This key is revoked, breaking campaign SMS. Meanwhile, central-mcp has working credentials and a `tm_send_message` tool. The same pattern applies to VAPI (app calls VAPI API directly via `vendorProxy.ts`) and potentially Resend. Maintaining duplicate credentials across app and MCP is fragile and has already caused a production failure.
**Outcome:** All third-party communication (TextMagic SMS, VAPI calls, Resend email) routes through central-mcp via its JSON-RPC API at `http://localhost:4002/mcp`. The app's `outbound.ts` calls MCP tools (`tm_send_message`, VAPI tools, etc.) instead of calling vendor APIs directly. Single source of truth for all third-party credentials in central-mcp's config. App `.env` only needs the MCP auth bearer token.
**Acceptance Criteria:** (1) `sendSmsRaw()` calls MCP `tm_send_message` instead of TextMagic API directly → SMS sends succeed. (2) `sendPhone()` calls MCP VAPI tool instead of VAPI API directly → calls succeed. (3) No TextMagic/VAPI API keys needed in app `.env`. (4) Campaign execution sends SMS via MCP → recipient receives message. (5) MCP tools needed that don't exist yet should be flagged for user to add to central-mcp.

---

## Backlog (not blocking launch — 19 items)

| ID | Issue |
|----|-------|
| I-010 | Campaign channel configurability |
| I-011 | Org Admin multi-org Option B (join table) |
| I-012 | Billing usage alerts (80/90/99%) |
| I-014 | Second VAPI service agent per dealer |
| I-015-B | Multi-org reporting |
| I-018 | Tavus duplicate personas cleanup |
| I-019 | Tavus demo widget configure later |
| I-020 | Duplicate security headers |
| I-021 | Conflicting x-xss-protection |
| I-022 | Console 400 on unauth refresh |
| I-023 | Secure cookie conditional |
| I-024 | Remaining as-any casts |
| I-025 | Console errors TeamBox/My Work (silent) |
| I-027 | Data staleness disclosure (correct) |
| I-030 | Billing tile visibility (skip for now) |
| I-031 | Missing GET /api/documents/:id (no UI uses it) |
| I-032 | Thinking cards vs pulsing icon |
| I-033 | Store leadType from VIN sync |
| I-035 | getUnansweredConversations cross-org (by design) |

## External (fixed by user)

| ID | Issue | Status |
|----|-------|--------|
| I-016 | central-mcp vin_create_contact | FIXED |
| I-017 | central-mcp tm_list_chats | FIXED |

---

**Last updated:** Sprint T-2b
**Must fix:** 19 items (I-001–I-034 from I-1, + I-036 T-2a, I-037/I-038 T-2b, I-039 T-2d)
**Backlog:** 19 items
**External fixed:** 2 items
