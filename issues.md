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

**Last updated:** Sprint R-1
**Must fix:** 15 items (Sprint I-1)
**Backlog:** 19 items
**External fixed:** 2 items
