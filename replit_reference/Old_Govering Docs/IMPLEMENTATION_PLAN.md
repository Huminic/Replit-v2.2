# Nexxus V2 -- Implementation Plan

**Version:** 2.0
**Date:** 2026-02-18
**Status:** GOVERNING DOCUMENT -- Phased execution plan
**Derived from:** Current-State Assessment v2.0 (2026-02-18)
**Supersedes:** Implementation Plan v1.0 (2026-02-16)

---

## Phasing Strategy

This plan is built exclusively from the gaps, NEEDS WORK items, and NOT DONE acceptance criteria identified in the Current-State Assessment v2.0. Phase numbers start at 1. There are no inherited phase numbers from prior plans.

Each phase identifies:
- Which acceptance criteria it advances
- Specific file:line references from the Current-State Assessment
- What code changes are required (not vague descriptions)
- Estimated scope in terms of lines changed and files touched
- Dependencies on other phases

Items that are BLOCKED (17 VIN gateway endpoints returning 403, inventory metrics) are excluded from all phases. They will be addressed only if and when API access is granted.

---

## Phase 1: Critical Fixes (Quick Wins)

**Goal:** Fix all issues that are simple string replacements or small code changes. Zero architectural work. Every item is a known location, known fix.

**Advances:** AC-001 (partial), AC-002, AC-003 (partial), AC-011 (partial)

**Estimated scope:** ~80 lines changed across ~12 files

**Dependencies:** None -- this phase has no prerequisites.

### Work Items

#### 1.1 Remove 5 vendor name leaks (UI-1 through UI-5)

Replace vendor-specific text with role-appropriate labels per Constitution 3.1.

| # | File | Line | Current Text | Replacement |
|---|------|------|-------------|-------------|
| UI-1 | `client/src/components/insights/VoiceAgentCard.tsx` | 73 | `"VAPI"` | `"Voice Agent"` |
| UI-2 | `client/src/components/insights/VideoDataCard.tsx` | 74 | `"Tavus"` | `"Video Agent"` |
| UI-3 | `client/src/pages/insights.tsx` | 481 | `source="VAPI + Tavus"` | `source="Voice + Video"` or remove the `source` prop entirely |
| UI-4 | `client/src/pages/insights.tsx` | 507 | `source="VAPI"` | `source="Voice Agent"` or remove the `source` prop entirely |
| UI-5 | `client/src/hooks/useAgents.ts` | 289 | `"Analyze VAPI call outcomes and sentiment"` | `"Analyze voice call outcomes and sentiment"` |

**Verification:** `grep -rn "VAPI\|Tavus\|Vapi" client/src/ --include="*.tsx" --include="*.ts"` returns zero customer-facing matches.

#### 1.2 Remove 4 source label leaks (UI-6 through UI-9)

Remove all "Local + VIN" source attribution labels from user-facing UI per Constitution 3.1 and Master SRS 5.2 locked decision.

| # | File | Line | Current Text | Action |
|---|------|------|-------------|--------|
| UI-6 | `client/src/components/insights/LeadFeedCard.tsx` | 95 | `"Local + VIN"` | Remove the source label element or replace with empty string |
| UI-7 | `client/src/pages/dashboard.tsx` | 362 | `"Local + VIN"` | Remove the source label element or replace with empty string |
| UI-8 | `client/src/pages/insights.tsx` | 491 | `source="Local + VIN"` | Remove the `source` prop or set to empty |
| UI-9 | `client/src/pages/insights.tsx` | 513 | `source="Local + VIN"` | Remove the `source` prop or set to empty |

**Verification:** `grep -rn "Local + VIN\|local+vin\|Local+VIN" client/src/` returns zero matches.

#### 1.3 Fix DealerBrain false 48-hour claim (DATA-2)

**File:** `server/services/DealerBrainService.ts`
**Line 834:** `"VIN search: Ask \"Search VIN for [name]\" - limited to 48 hours"`
**Line 840:** `"VIN Solutions has a 48-hour data limit via API"`

**Action:** Remove both lines. VIN API has no retention limit (verified 2026-02-13 per SourceSelector lines 9-11). Also remove the entire "BETA NOTES" block (lines 836-848) which contains stale messaging about features "coming soon" that are already implemented.

**Replace lines 834-848 with:**
```
- VIN search: Ask "Search VIN for [name]" - searches across all available CRM data
```

#### 1.4 Add "blocked data" awareness section to DealerBrain system prompt (DATA-4)

**File:** `server/services/DealerBrainService.ts`
**Location:** Insert after the tool documentation section (after line ~768, before the existing navigation section)

**Action:** Add a new section to the system prompt listing what data is accessible and what is blocked:

```
DATA AVAILABILITY:
You have access to:
- Lead data (statuses, sources, types, vehicles of interest, trade-ins)
- CRM user roster (names, roles, access levels)
- Dealer information (dealerships, locations)
- AI call records (transcripts, durations, outcomes, costs)
- AI video session records (sessions, personas, durations)
- Goals, tasks, appointments, messages
- Credit usage and service quotas

You do NOT have access to (API permissions not yet granted):
- Communication logs (emails, texts, calls between staff and customers)
- Deal/transaction records (deal values, gross profit, F&I)
- CRM activity logs (tasks completed, notes added, status changes)
- Appointment data from VIN CRM (only local appointments are available)
- Inventory data (lot inventory, days on lot, turn rate)
- Customer contact search (cannot search contacts independently)

When asked about any blocked data category, explain that this data is not currently
available through the API integration, and suggest what alternative data you CAN provide.
```

#### 1.5 Remove vendor names from DealerBrain tool descriptions (DATA-2 related)

**File:** `server/services/DealerBrainService.ts`

| Line | Current | Replacement |
|------|---------|-------------|
| 126 | `"VAPI voice call records"` | `"Voice call records"` |
| 149 | `"Tavus video session records"` | `"Video session records"` |
| 719 (system prompt) | `"VAPI voice call records"` | `"Voice call records"` |
| 720 (system prompt) | `"Tavus video session records"` | `"Video session records"` |

#### 1.6 Fix stale doc comments (DATA-3, technical debt)

| File | Lines | Current | Action |
|------|-------|---------|--------|
| `server/services/contextRouter/CacheManager.ts` | 5 | `"beyond the 48-hour API retention limit"` | Change to `"for VIN Solutions data. Provides TTL-based invalidation and automatic cache population."` |
| `server/services/contextRouter/CacheManager.ts` | 8 | `REQ-DATA-006: The system SHALL cache VIN data beyond 48-hour API limit` | Remove this line |
| `server/services/contextRouter/CacheManager.ts` | 10 | `@see docs/SYSTEM_REQUIREMENTS_SPECIFICATION_v3.0.md Section 6.4` | Change to `@see docs/MASTER_SRS.md Section 7.2` |
| `server/services/contextRouter/SourceSelector.ts` | 16 | `@see` reference to old SRS v3.0 section | Change to `@see docs/MASTER_SRS.md Section 7.2` |
| `server/middleware/enforceOrganizationContext.ts` | 11 | `@see` reference to old SRS v3.0 section | Change to `@see docs/MASTER_SRS.md Section 5.1` |
| `server/db/SecureQueryBuilder.ts` | 8 | REQ reference to old SRS v3.0 section | Change to `@see docs/MASTER_SRS.md Section 11.2` |
| `server/services/sync/SyncCoordinator.ts` | 12-13 | REQ references to old SRS v3.0 section | Change to `@see docs/MASTER_SRS.md Section 7.3` |
| `server/services/leads/LeadCreationService.ts` | 7-9 | REQ references to old SRS v3.0 section | Change to `@see docs/MASTER_SRS.md Section 7.3` |
| `database/migrations/003_context_router_tables.sql` | 6-8 | REQ references to old SRS v3.0 section | Update comment to reference `docs/MASTER_SRS.md Section 7` |

### Phase 1 Completion Criteria

- [ ] `grep -rn "VAPI\|Tavus\|Vapi" client/src/ --include="*.tsx" --include="*.ts"` returns zero customer-facing text matches (regex keywords in code logic are acceptable)
- [ ] `grep -rn "Local + VIN\|local+vin" client/src/` returns zero matches
- [ ] `grep -rn "48.hour" server/services/DealerBrainService.ts` returns zero matches
- [ ] DealerBrain system prompt contains "DATA AVAILABILITY" section listing accessible and blocked endpoints
- [ ] `npm run check` passes
- [ ] `npm run build` succeeds

---

## Phase 2: Data Integrity

**Goal:** Ensure VIN API calls use correct headers per spec and conduct the data field population audit required by AC-005.

**Advances:** AC-001, AC-005

**Estimated scope:** Moderate -- API runtime verification + audit documentation. Code changes only if headers are wrong.

**Dependencies:** None (independent of Phase 1, can run in parallel).

### Work Items

#### 2.1 Verify VIN reference endpoint headers at runtime (DATA-1)

**Context:** `makeAuthenticatedRequest()` at `server/services/vinSolutionsService.ts:351` defaults to v3 headers. Calls to `/leadSources` (line 873) and `/leadTypes` (line 905) go through `makeAuthenticatedRequest()` WITHOUT overriding headers to v1. Per Master SRS Section 10.4, reference endpoints require `application/vnd.coxauto.v1+json`.

Recent commits (294cad6, 6f76f44) may have addressed this -- the assessment notes these commits reference "VIN API audit fixes per OAS 3.0 spec." However, the assessment was based on static analysis and the default header at line 351 is still v3.

**Action:**
1. Read lines 870-925 of `server/services/vinSolutionsService.ts` to check if the `/leadSources` and `/leadTypes` calls now pass explicit v1 header overrides
2. If they do NOT override to v1: add `headers: { Accept: 'application/vnd.coxauto.v1+json', 'Content-Type': 'application/vnd.coxauto.v1+json' }` to the options passed to `makeAuthenticatedRequest()` at lines 873 and 905
3. Runtime verification: make test calls to `/leadSources?dealerId=X` and `/leadTypes` with v1 headers, confirm 200 response
4. Verify that all `/vehicles/*` calls also use v1 headers

**Consider:** Add a version-aware helper to `makeAuthenticatedRequest()` that maps endpoint patterns to required header versions, eliminating the need for manual overrides. This would prevent future header mismatches per the assessment's architecture recommendation (Section 5.2).

#### 2.2 Verify contactUrl format (DATA-5)

**File:** `server/services/vinSolutionsService.ts`
**Line:** 844

**Context:** Line 844 constructs `contactUrl = ${baseUrl}/contacts/id/${contactId}?dealerid=${dealerId}` as an absolute URL. The OAS 3.0 spec shows href references as relative paths (e.g., `/contacts/id/{id}`). The `leadSource` and `leadType` hrefs use relative paths.

**Action:**
1. Check if VIN API accepts absolute URLs in the `contact` field of `POST /leads` (runtime test)
2. If it does: document this as an accepted deviation (no code change needed)
3. If it does not: change line 844 to construct a relative URL: `/contacts/id/${contactId}?dealerid=${dealerId}`

#### 2.3 Conduct data field population audit (GAP-8)

**Required by:** AC-005

**Action:** Write a one-time audit script (`scripts/field-population-audit.ts`) that:

1. **VIN leads (50+ records):**
   - Query `GET /leads?dealerId=X&limit=50` with v3 headers
   - For each lead, document fill rate per field: `leadId`, `dealerId`, `contact`, `leadSource`, `leadStatus`, `leadStatusType`, `leadType`, `leadGroupCategory`, `createdUtc`, `isHot`, `isOnShowroom`, `vehiclesOfInterest`, `tradeVehicles`
   - Enrich with contacts and document contact field fill rates: `FirstName`, `LastName`, `Emails`, `Phones`
   - Output: JSON file at `docs/evidence/field-population-audit.json`

2. **VAPI call records (50+ records):**
   - Query local `vapi_call_logs` table
   - Document fill rates for: `analysis_success_evaluation` (maps to `analysis.successEvaluation`), `analysis_structured_data`, `cost_breakdown`, `transcript`, `recording_url`, `summary`, `duration_seconds`
   - Cross-reference with VAPI API `GET /call?limit=50` for fields not stored locally

3. **Tavus session records (50+ records):**
   - Query local `tavus_sessions` table
   - Document fill rates for: `conversation_id`, `status`, `persona_id`, `created_at`, `updated_at`, `duration`
   - Cross-reference with Tavus API `GET /conversations?limit=50`

4. **Output format per field:**
   ```json
   {
     "field": "analysis.successEvaluation",
     "source": "VAPI",
     "totalRecords": 50,
     "populatedRecords": 38,
     "fillRate": 0.76,
     "certified": true,
     "notes": "76% fill rate exceeds 50% threshold"
   }
   ```

5. Fields with <50% fill rate are flagged as "unreliable" and excluded from certified metrics.

### Phase 2 Completion Criteria

- [ ] Runtime confirmation: `/leadSources?dealerId=X` returns 200 with v1 headers (screenshot or log)
- [ ] Runtime confirmation: `/leadTypes` returns 200 with v1 headers (screenshot or log)
- [ ] Runtime confirmation: `POST /leads` succeeds with valid href references (test lead creation)
- [ ] `docs/evidence/field-population-audit.json` exists with 50+ records per source
- [ ] Each field has documented fill rate and certified/unreliable status
- [ ] `npm run check` passes
- [ ] `npm run build` succeeds

---

## Phase 3: Wiring Gaps

**Goal:** Connect existing code that is defined but disconnected. No new systems -- only adding calls to existing methods and integrating existing APIs.

**Advances:** AC-004 (strengthen), AC-013, AC-014

**Estimated scope:** Moderate -- new function calls in existing webhooks, one new VIN API write call in an existing route handler.

**Dependencies:** Phase 2 (VIN API headers must be verified before wiring Mark Contacted to VIN).

### Work Items

#### 3.1 Wire updatePerformanceMetrics() to webhooks (GAP-1)

**Context:** `updatePerformanceMetrics()` at `server/services/AgentService.ts:374` is defined but never called. The method accepts partial metrics and merges them into the `performance_metrics` JSONB column on the `agents` table.

**Action:**

1. **VAPI webhook (`server/webhooks/vapi.ts`):** In `handleEndOfCallReport()` (after the existing lead creation and notification logic, around line 600), add:
   - Look up the agent record by `assistantId` from the webhook payload
   - Call `agentService.updatePerformanceMetrics(agentId, { totalCalls: increment, totalDuration: callDuration, successRate: recalculate, lastCallAt: timestamp })`
   - Metrics to compute: total calls (increment), average duration (running average), success rate (from `analysis.successEvaluation`), cost (from `costBreakdown.total`)

2. **Tavus webhook (`server/webhooks/tavus.ts`):** In the session-ended handler, add:
   - Look up the agent record by `persona_id` from the webhook payload
   - Call `agentService.updatePerformanceMetrics(agentId, { totalSessions: increment, totalDuration: sessionDuration, lastSessionAt: timestamp })`

3. **Guard:** Only update metrics for non-test calls (check `isTestCall` flag already present in VAPI webhook).

#### 3.2 Wire Mark Contacted to VIN API (GAP-2)

**Status: UNBLOCKED** (probe confirmed PUT /leads accepts `leadStatus` with v3 headers — see `docs/evidence/put-header-probe-results.json`)

**Context:** `client/src/pages/work-center.tsx:610` has a "Mark Contacted" button that updates local DB only. Per Master SRS 5.6.5 and locked decision, this must also update VIN CRM lead status.

**Action:**

1. **Backend:** Add a new method to `VinSolutionsService` (or extend existing `updateLead`):
   - `markLeadContacted(orgId, vinLeadId, dealerId)` -- calls `PUT /leads/id/{leadId}?dealerId={dealerId}` with v3 headers
   - Request body: `{ leadStatus: "<contacted status href>" }` -- query `/leadStatuses` (v1 headers) first to get the correct href for "contacted" status
   - Handle errors gracefully: if VIN update fails, still update local DB but log a warning and notify admin

2. **Route:** Add endpoint to `server/routes/leads.ts`:
   - `PATCH /api/leads/:leadId/mark-contacted` -- calls `markLeadContacted()` then updates local DB
   - Requires `authenticate` + `enforceOrganizationContext` middleware

3. **Frontend:** Update `client/src/pages/work-center.tsx:610` to call the new API endpoint instead of directly updating local DB.

4. **Guard per Constitution 2.5:** VIN Solutions data is sensitive. The write must:
   - Use correct v3 headers for `/leads` PUT endpoint
   - Use v1 headers for `/leadStatuses` reference lookup
   - Log the VIN API request and response for audit
   - Not modify any other lead fields besides leadStatus

#### 3.3 Integrate VAPI Analytics API for server-side aggregated metrics (GAP-7)

**Context:** VAPI provides `POST /analytics` endpoint with server-side aggregations (sum, avg, count, min, max with groupBy and time-bucketed trends). Currently, the platform computes metrics locally from individual call records stored in `vapi_call_logs`.

**Action:**

1. **Add method to VAPI service or create `VapiAnalyticsService`:**
   - `getAnalytics(assistantIds: string[], dateRange: { start, end }, metrics: string[], groupBy?: string)` -- calls `POST /analytics` on VAPI API
   - Map results to internal metric format
   - Cache results with 5-minute TTL (consistent with Context Router cache policy)

2. **Metrics to fetch via Analytics API:**
   - `sumCost` -- total voice AI cost
   - `countId` -- total call volume
   - `sumDuration` -- total call time
   - `avgDuration` -- average call duration
   - GroupBy `endedReason` -- call outcome distribution
   - GroupBy `assistantId` -- per-agent performance

3. **Integration point:** `VoiceInsightService` (`server/services/insights/VoiceInsightService.ts`) should call the Analytics API instead of computing aggregations from individual `vapi_call_logs` records. Local computation becomes the fallback if the Analytics API is unavailable.

### Phase 3 Completion Criteria

- [ ] After a VAPI call-ended webhook fires, the corresponding agent's `performance_metrics` JSONB column is updated (verified by querying `agents` table)
- [ ] After a Tavus session-ended webhook fires, the corresponding agent's `performance_metrics` JSONB column is updated
- [ ] "Mark Contacted" button in Work Center updates both local DB and VIN CRM lead status
- [ ] If VIN update fails, local update still succeeds with warning logged
- [ ] `POST /analytics` to VAPI returns aggregated metrics; `VoiceInsightService` uses these over local computation
- [ ] `npm run check` passes
- [ ] `npm run build` succeeds

---

## Phase 4: Metrics Consolidation

**Goal:** Unify fragmented metrics into a coherent metrics engine. Consolidate before expansion (per Master SRS 7.6 locked decision).

**Advances:** AC-003, AC-007

**Estimated scope:** Significant -- new service layer, refactoring 5 existing services to delegate metric computation.

**Dependencies:** Phase 2 (field population audit determines which metrics are certifiable), Phase 3 (VAPI Analytics API integration provides server-side aggregations).

### Work Items

#### 4.1 Audit existing metrics across 5 services (GAP-6)

**Action:** Document every metric currently computed across the 5 fragmented services:

| Service | File | Estimated Metrics |
|---------|------|-------------------|
| DashboardService | `server/services/DashboardService.ts` | Lead counts, pipeline stages, goal progress |
| VoiceInsightService | `server/services/insights/VoiceInsightService.ts` | Call volume, duration, success rate |
| VideoInsightService | `server/services/insights/VideoInsightService.ts` | Session volume, duration, persona utilization |
| LeadInsightService | `server/services/insights/LeadInsightService.ts` | Lead aging, source distribution, conversion |
| DealerPulseService | `server/services/DealerPulseService.ts` | 5-phase VIN snapshot, AI commentary |

For each metric, document: name, computation formula, data source(s), field dependencies, whether the underlying fields pass the fill rate requirement from Phase 2's audit.

Output: `docs/evidence/metrics-inventory.json`

#### 4.2 Create unified MetricsEngine service

**Action:** Create `server/services/MetricsEngine.ts` that:

1. Defines a `CertifiedMetric` interface:
   ```typescript
   interface CertifiedMetric {
     name: string;
     category: 'pipeline' | 'voice' | 'video' | 'combined';
     dataSources: Array<'vin_api' | 'vapi' | 'tavus' | 'local'>;
     formula: string;
     fieldDependencies: string[];
     fillRateRequirement: number; // minimum 0.50
     groundTruthVerified: boolean;
     roles: Array<'super_admin' | 'partner_admin' | 'org_admin' | 'org_staff'>;
   }
   ```

2. Registers all metrics from the 5 existing services that pass certification (fill rate >50%, ground truth verified within 2%)

3. Provides `getMetricsForRole(role, orgId)` method that returns only certified metrics appropriate for the requesting role

4. Delegates computation to existing services (does not duplicate logic) -- serves as a facade/registry, not a replacement

#### 4.3 Apply certification requirements

For each registered metric:
- Verify field fill rate from Phase 2 audit exceeds 50%
- Compute metric and compare against direct API query (ground truth) -- must match within 2%
- Metrics that fail certification are removed from dashboards (not shown, not placeholdered per Constitution 2.4)

Output: `docs/evidence/metric-certifications.json` with per-metric certification status.

#### 4.4 Remove uncertifiable metrics from dashboards

**Action:** For any metric that fails certification:
- Remove the UI component or hide it via conditional rendering based on MetricsEngine registration
- Do NOT add placeholder text or "coming soon" indicators (Constitution 3.1)

### Phase 4 Completion Criteria

- [ ] `docs/evidence/metrics-inventory.json` documents all existing metrics from 5 services
- [ ] `MetricsEngine` service created with `CertifiedMetric` registry
- [ ] Each metric has documented fill rate, ground truth comparison, and certification status
- [ ] Uncertifiable metrics removed from dashboard UI
- [ ] Minimum 10 certified metrics available for `org_admin` role
- [ ] Minimum 5 certified metrics available for `org_staff` role
- [ ] `npm run check` passes
- [ ] `npm run build` succeeds

---

## Phase 5: SMS Enhancement

**Goal:** Complete two-way SMS with AI routing and collision avoidance. Builds on existing TextMagic infrastructure.

**Advances:** AC-012

**Estimated scope:** Moderate -- new business logic layered on existing `TextMagicService` and `InboxService`.

**Dependencies:** None (independent of Phases 1-4, but practically should follow Phase 1 to avoid deploying with vendor name leaks).

### Work Items

#### 5.1 Implement business hours configuration

**Action:**

1. Add `business_hours` JSONB column to `textmagic_config` table (new migration):
   ```sql
   ALTER TABLE textmagic_config ADD COLUMN business_hours JSONB DEFAULT '{
     "timezone": "America/New_York",
     "schedule": {
       "monday": {"start": "09:00", "end": "18:00"},
       "tuesday": {"start": "09:00", "end": "18:00"},
       "wednesday": {"start": "09:00", "end": "18:00"},
       "thursday": {"start": "09:00", "end": "18:00"},
       "friday": {"start": "09:00", "end": "18:00"},
       "saturday": null,
       "sunday": null
     }
   }';
   ```

2. Add `isBusinessHours(orgId)` method to `TextMagicService` that checks current time against configured schedule.

#### 5.2 Implement after-hours / business-hours routing logic (GAP-3)

**File:** `server/services/TextMagicService.ts` -- modify `processInboundSMS()` (line 372)

**Action:** After receiving an inbound SMS:

1. Check `isBusinessHours(orgId)`
2. **During business hours:** Route to assigned staff member via existing `InboxService` (current behavior, no change needed)
3. **After hours:** Generate AI response via `DealerBrainService` (Claude API) using the conversation context, then send response via `TextMagicService.sendSMS()`

AI response generation:
- Use a lightweight system prompt focused on SMS-appropriate responses (concise, helpful, schedule follow-up)
- Include conversation history from `textmagic_messages` for context
- Per Constitution 3.3 and Master SRS 6.4: AI SMS responses are powered by DealerBrain (Claude API), not VAPI

#### 5.3 Implement collision avoidance state machine (GAP-4)

**Action:**

1. Add `sms_conversation_state` table (new migration):
   ```sql
   CREATE TABLE sms_conversation_state (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     organization_id UUID NOT NULL REFERENCES organizations(id),
     phone_number VARCHAR(20) NOT NULL,
     state VARCHAR(20) NOT NULL DEFAULT 'DORMANT'
       CHECK (state IN ('AI_ACTIVE', 'HUMAN_ACTIVE', 'DORMANT')),
     last_ai_response_at TIMESTAMPTZ,
     last_human_response_at TIMESTAMPTZ,
     human_agent_id UUID REFERENCES users(id),
     updated_at TIMESTAMPTZ DEFAULT NOW(),
     UNIQUE(organization_id, phone_number)
   );
   ALTER TABLE sms_conversation_state ENABLE ROW LEVEL SECURITY;
   CREATE POLICY sms_state_org_isolation ON sms_conversation_state
     USING (organization_id::TEXT = current_setting('app.current_organization_id', TRUE));
   ```

2. State transitions:
   - `DORMANT` -> `AI_ACTIVE`: inbound SMS received after hours, AI responds
   - `AI_ACTIVE` -> `HUMAN_ACTIVE`: staff member sends manual reply (human takeover)
   - `HUMAN_ACTIVE` -> `DORMANT`: no activity for 30 minutes (configurable timeout)
   - `AI_ACTIVE` -> `DORMANT`: no activity for 30 minutes
   - At any state: inbound SMS during business hours routes to human

3. Guard: When state is `HUMAN_ACTIVE`, AI does NOT auto-respond. When state is `AI_ACTIVE`, human CAN still respond (which triggers transition to `HUMAN_ACTIVE`).

#### 5.4 Implement human handoff workflow

**Action:**

1. When a staff member clicks "Take Over" or sends a manual reply to an AI-active conversation:
   - Set conversation state to `HUMAN_ACTIVE`
   - Log the takeover in activity feed
   - Notify the staff member that AI responses are paused

2. When conversation goes dormant (timeout):
   - Set state to `DORMANT`
   - Next inbound SMS re-evaluates business hours to determine routing

### Phase 5 Completion Criteria

- [ ] Inbound SMS during business hours routes to staff member (existing behavior preserved)
- [ ] Inbound SMS after hours generates AI response via DealerBrain and sends via TextMagic
- [ ] Human reply to AI-active conversation stops AI responses (state = HUMAN_ACTIVE)
- [ ] Conversation state transitions logged and queryable
- [ ] `sms_conversation_state` table has RLS policies for org isolation
- [ ] `npm run check` passes
- [ ] `npm run build` succeeds

---

## Phase 6: Combined Metrics and Role Dashboards

**Goal:** Build cross-platform insights on top of Phase 4's unified MetricsEngine. Ensure all dashboards are role-optimized.

**Advances:** AC-007, AC-008, AC-009, AC-010

**Estimated scope:** Significant -- new metric computations, dashboard component updates.

**Dependencies:** Phase 4 (MetricsEngine must exist), Phase 3 (VAPI Analytics API must be integrated).

### Work Items

#### 6.1 Add combined cross-platform metrics to MetricsEngine

Using the MetricsEngine from Phase 4, register combined metrics per Master SRS 8.3.5:

| Metric | Sources | Computation | Target Roles |
|--------|---------|-------------|-------------|
| Total AI interaction volume | VAPI + Tavus | Sum of calls + sessions | `org_admin`, `partner_admin` |
| AI-to-human handoff rate | VAPI `endedReason` + `artifact.transfers` | Transfers / total calls | `org_admin` |
| Lead-to-AI engagement ratio | VIN leads + VAPI/Tavus volume | AI interactions / pipeline size | `org_admin` |
| Response gap score | VIN `leadGroupCategory` + VAPI timestamps | NEW leads with no corresponding AI interaction | `org_admin` |
| Total AI cost | VAPI Analytics API | `sumCost` from VAPI (Tavus has no cost API) | `super_admin` |

Each metric must pass certification: fill rate >50%, ground truth within 2%.

#### 6.2 Implement role-based metric assignment

Configure MetricsEngine with role targets per Master SRS 8.4:

- **`org_admin` (10 metrics):** Pipeline health (total volume, by stage, aging, hot leads), team performance (leads per salesperson, close rate), AI activity (call volume, success rate, cost), combined (response gap score)
- **`org_staff` (5 metrics):** My active leads, my overdue leads, my AI calls, my success rate, personal performance vs team average
- **`partner_admin` (5 metrics):** Org engagement (login frequency, agent adoption), AI activity per org, credit usage, multi-store comparison
- **`super_admin` (5 metrics):** System-wide cost, total calls, total sessions, credit utilization, error rates

#### 6.3 Enhance NextDashboard role-based views

**Files:** `client/src/pages/next/NextDashboard.tsx`, `client/src/pages/next/NextAnalytics.tsx`

**Action:**
1. Connect dashboard components to MetricsEngine API endpoints
2. Render only certified metrics for the authenticated user's role
3. Ensure `org_staff` view shows personal metrics only (RLS enforces this at query level)
4. Ensure `partner_admin` view shows aggregate metrics across assigned orgs (no PII)

#### 6.4 Apply role-based treatment to classic dashboard

**File:** `client/src/pages/dashboard.tsx`

**Action:**
1. Per locked decision: ALL dashboards get role-based treatment, not just Next layout
2. Use same MetricsEngine endpoints as NextDashboard
3. Filter displayed components based on authenticated user's role
4. Remove any metrics that did not pass certification

### Phase 6 Completion Criteria

- [ ] Combined metrics registered in MetricsEngine, each passing certification
- [ ] `org_admin` dashboard shows 10+ certified metrics
- [ ] `org_staff` dashboard shows 5+ certified metrics (personal only)
- [ ] `partner_admin` dashboard shows 5+ certified metrics (aggregate, no PII)
- [ ] Classic dashboard has same role-based filtering as Next dashboard
- [ ] Every displayed number matches ground truth within 2%
- [ ] Dashboard loads in <3 seconds (performance requirement per Master SRS 11.1)
- [ ] `npm run check` passes
- [ ] `npm run build` succeeds

---

## Phase 7: Certification and Testing

**Goal:** Full E2E verification of all work from Phases 1-6. Add new tests. Certify features per Constitution 2.6 (3-proof validation). Ship the activity feed CSV export.

**Advances:** AC-015, AC-016, AC-019

**Estimated scope:** Testing + bug fixes + one small feature (CSV export).

**Dependencies:** Phases 1-6 (all implementation must be complete before final certification).

### Work Items

#### 7.1 Implement activity feed CSV export (GAP-5)

**File:** `server/services/ActivityService.ts`, `server/routes/activity.ts`

**Action:**
1. Add `exportToCsv(orgId, filters)` method to `ActivityService` that:
   - Queries activity records with the same filters as the list endpoint
   - Formats as CSV with headers: timestamp, user, action, target, details
   - Returns CSV string or readable stream
2. Add route `GET /api/activity/export/csv` with `requireOrgAdminOrHigher` middleware
3. Frontend: Add "Export CSV" button to `client/src/pages/activity.tsx`

#### 7.2 Run full E2E test suite

**Action:**
1. Run `npx playwright test` -- record results
2. Fix all failures that are caused by changes in Phases 1-6
3. Remove tests that are no longer applicable (with justification documented)
4. Target: <2% flaky rate

#### 7.3 Add new E2E tests

Write new Playwright tests for:

| Test Area | What to Verify | AC |
|-----------|---------------|-----|
| Vendor name absence | No "VAPI", "Tavus", "Vapi" text visible on any page | AC-002 |
| Source label absence | No "Local + VIN" text visible on any page | AC-003 |
| Metric accuracy | Dashboard metrics match direct API queries within 2% | AC-007 |
| Mark Contacted to VIN | Clicking "Mark Contacted" updates both local DB and VIN CRM | AC-014 |
| SMS after-hours flow | Inbound SMS after hours triggers AI response | AC-012 |
| SMS collision avoidance | Human reply stops AI responses | AC-012 |
| Agent performance metrics | After webhook event, agent metrics are updated | AC-013 |
| Activity CSV export | Export button produces valid CSV file | AC-015 |
| DealerBrain blocked data | Asking about deals/inventory gets honest "unavailable" response | AC-011 |

#### 7.4 3-proof certification per feature

For each feature modified in Phases 1-6, apply Constitution 2.6:
1. **Configuration test** -- verify configs, env vars, settings
2. **Functional test** -- unit or integration test passes
3. **Visual/E2E test** -- UI or API produces expected result

Document results in `docs/evidence/certification-results.md`.

#### 7.5 Quality gates

Run all three gates and capture output:
1. `npm run check` -- TypeScript compilation
2. `npm run build` -- production build
3. `npx playwright test` -- E2E suite

All three must pass with zero errors.

### Phase 7 Completion Criteria

- [ ] Activity feed CSV export functional (button visible, CSV downloads correctly)
- [ ] Full E2E suite passes with <2% flaky rate
- [ ] New E2E tests added for all items in 7.3 table
- [ ] Each feature has 3-proof certification documented in `docs/evidence/certification-results.md`
- [ ] `npm run check` passes (zero errors)
- [ ] `npm run build` succeeds
- [ ] `npx playwright test` passes

---

## Phase 8: Deployment

**Goal:** Deploy the certified platform to production.

**Advances:** AC-018, AC-019

**Estimated scope:** Documentation finalization + deployment procedure.

**Dependencies:** Phase 7 (all certification must pass before deployment).

### Work Items

#### 8.1 Finalize governing documents

- [ ] `docs/MASTER_SRS.md` -- v2.0 complete (done)
- [ ] `docs/CONSTITUTION.md` -- v1.0 complete (done)
- [ ] `docs/CURRENT_STATE_ASSESSMENT.md` -- v2.0 complete (done)
- [ ] `docs/IMPLEMENTATION_PLAN.md` -- v2.0 complete (this document)

AC-018 requires all 4 documents to exist.

#### 8.2 Merge to master

1. Ensure all work is committed on the feature branch
2. Run quality gates one final time on the feature branch
3. Merge to master: `git checkout master && git merge feature/stabilization`
4. Resolve any merge conflicts

#### 8.3 Deploy

```bash
./deploy.sh
```

The script enforces: master branch only, warns on uncommitted changes, runs `npm run build`, restarts PM2.

#### 8.4 Post-deployment verification

1. Verify PM2 process is running: `pm2 status`
2. Verify application responds: `curl https://nexxusv2.huminicdev.com/api/health`
3. Spot-check key pages:
   - Dashboard loads with correct metrics
   - No vendor names visible
   - No source labels visible
   - DealerBrain responds to "what data do you have?" with honest availability list
   - Mark Contacted updates VIN CRM (if safe to test in production)
4. Run smoke test subset of E2E suite against production

### Phase 8 Completion Criteria

- [ ] All 4 governing documents exist and are current
- [ ] Deployed from master via `./deploy.sh`
- [ ] PM2 process running
- [ ] Application health check passes
- [ ] Post-deployment spot checks pass
- [ ] No console errors on any page

---

## Dependencies

```
Phase 1 (Critical Fixes)  ----+
                               |
Phase 2 (Data Integrity)  ----+----> Phase 4 (Metrics Consolidation) ----> Phase 6 (Combined Metrics)
                               |                                                      |
Phase 3 (Wiring Gaps)    ----+                                                       |
                                                                                      v
Phase 5 (SMS Enhancement) -----------------------------------------> Phase 7 (Certification)
                                                                                      |
                                                                                      v
                                                                              Phase 8 (Deployment)
```

**Parallel execution possible:**
- Phases 1, 2, and 5 can start simultaneously (no interdependencies)
- Phase 3 can start after Phase 2 completes (needs verified VIN headers)
- Phase 4 requires Phase 2 (field audit) and Phase 3 (VAPI Analytics)
- Phase 6 requires Phase 4 (MetricsEngine)
- Phase 7 requires all of Phases 1-6
- Phase 8 requires Phase 7

**Critical path:** Phase 2 -> Phase 3 -> Phase 4 -> Phase 6 -> Phase 7 -> Phase 8

---

## Risk Register

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| R-1 | VIN reference endpoints reject v1 headers (they may have always worked with v3) | Low | Medium | Test at runtime before changing code. If v3 works, document the deviation but still add v1 as the configured default for spec compliance. |
| R-2 | ~~VIN `PATCH /leads` for Mark Contacted fails or uses unexpected format~~ | ~~Medium~~ | ~~Medium~~ | **RESOLVED 2026-02-18:** Probe confirmed PUT /leads with v3 headers accepts `leadStatus` field (returns 204). OAS spec was incomplete. See `docs/evidence/put-header-probe-results.json`. |
| R-3 | VAPI Analytics API returns incomplete data or unexpected format | Low | Low | Keep local computation as fallback. Analytics API is additive, not a replacement -- if it fails, existing local metrics still work. |
| R-4 | DealerBrain AI responses during SMS after-hours are inappropriate or too long | Medium | Medium | Use SMS-specific system prompt with length constraints (max 160 characters per segment). Add content review in AI Governance Stage 1 monitoring. |
| R-5 | Metrics consolidation breaks existing dashboard functionality | Medium | High | MetricsEngine is a facade over existing services, not a replacement. Existing services continue to function. If MetricsEngine fails, dashboards fall back to direct service calls. |
| R-6 | E2E test suite has significant failures after Phase 1-6 changes | Medium | Medium | Run E2E suite incrementally after each phase (not just at Phase 7). Fix regressions immediately. |
| R-7 | Field population audit reveals <50% fill rate for most VIN fields | Low | High | If true, reduce the number of certified metrics rather than displaying unreliable data. Constitution 2.4 is clear: accuracy over quantity. |
| R-8 | SMS collision avoidance state machine introduces race conditions | Medium | Medium | Use database-level locks (SELECT FOR UPDATE) on `sms_conversation_state` rows. State transitions are atomic operations. |

---

## Excluded Items (Blocked or Out of Scope)

These items are NOT in any phase. They are documented here for traceability.

| Item | Reason Excluded | Unblock Condition |
|------|----------------|-------------------|
| VIN inventory metrics (days on lot, turn rate) | API returns 403 on `/gateway/v1/inventory` and `/gateway/v1/vehicles` | VIN Solutions grants expanded API access |
| Communication gap analysis | API returns 403 on `/gateway/v1/communication` | VIN Solutions grants expanded API access |
| Deal/transaction metrics | API returns 403 on `/gateway/v1/deals` | VIN Solutions grants expanded API access |
| Appointment tracking from VIN | API returns 403 on `/gateway/v1/appointments` | VIN Solutions grants expanded API access |
| CRM activity tracking | API returns 403 on `/gateway/v1/activity`, `/tasks`, `/notes` | VIN Solutions grants expanded API access |
| Contact search/deduplication | API returns 403 on `/gateway/v1/contacts` (search) | VIN Solutions grants expanded API access |
| Credits page UI | Intentionally deferred (`App.tsx:106-114`) | Business decision to expose billing UI |
| AI Governance Stage 2 (content policy) | Future phase, not a current gap | Planned for post-stabilization |
| AI Governance Stage 3 (data obfuscation) | Future phase, not a current gap | Planned for post-stabilization |

---

## Acceptance Criteria Cross-Reference

Every AC from the locked acceptance criteria document is mapped to at least one phase.

| AC | Description | Phase(s) | Status After Plan |
|----|-------------|----------|-------------------|
| AC-001 | VIN API Header Resolution | 1 (partial), 2 | ADDRESSED |
| AC-002 | Vendor Name Removal | 1 | ADDRESSED |
| AC-003 | Dashboard Data Accuracy | 1 (source labels), 4 (metrics consolidation) | ADDRESSED |
| AC-004 | Webhook Lead Creation | 3 (strengthen via Mark Contacted) | ALREADY CERTIFIED + ENHANCED |
| AC-005 | Data Field Population Audit | 2 | ADDRESSED |
| AC-006 | Context Router Refactor | -- | ALREADY CERTIFIED (build-verified) |
| AC-007 | Certified Metrics | 4, 6 | ADDRESSED |
| AC-008 | Role-Based Dashboard (org_admin) | 6 | ADDRESSED (infrastructure exists, metrics need certification) |
| AC-009 | Role-Based Dashboard (org_staff) | 6 | ADDRESSED (infrastructure exists, metrics need certification) |
| AC-010 | Role-Based Dashboard (partner_admin) | 6 | ADDRESSED (infrastructure exists, metrics need certification) |
| AC-011 | DealerBrain Data Awareness | 1 | ADDRESSED |
| AC-012 | TextMagic Two-Way SMS | 5 | ADDRESSED |
| AC-013 | Agent Notification Triggers | 3 (performanceMetrics wiring) | ALREADY CERTIFIED + ENHANCED |
| AC-014 | Lead Assignment | 3 (Mark Contacted to VIN) | ALREADY CERTIFIED + ENHANCED |
| AC-015 | Feature Certification | 7 | ADDRESSED |
| AC-016 | E2E Test Updates | 7 | ADDRESSED |
| AC-017 | Widget Verification | -- | ALREADY CERTIFIED (build-verified) |
| AC-018 | Governing Documents | 8 | ADDRESSED (this document is the 4th) |
| AC-019 | Deployment Readiness | 7, 8 | ADDRESSED |

---

## Appendix A: Document History

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | 2026-02-18 | Complete rewrite from Current-State Assessment v2.0 gap analysis. 8 phases, 19 ACs mapped, all work items traced to specific file:line evidence. Supersedes v1.0. |
| 1.0 | 2026-02-16 | Initial plan -- derived from Current-State Assessment v1.0 (257 requirements assessed). 10 phases covering data accuracy through report upload. |

### Governing Document Chain
1. `docs/CONSTITUTION.md` -- Platform identity and development rules
2. `docs/MASTER_SRS.md` -- What the system should be
3. `docs/CURRENT_STATE_ASSESSMENT.md` -- What actually exists (honest diff)
4. `docs/IMPLEMENTATION_PLAN.md` -- This document (what to build next)

---

*This document was derived from the gaps identified in Current-State Assessment v2.0 (2026-02-18). Every work item traces to a specific issue number (UI-1 through UI-9, DATA-1 through DATA-5, GAP-1 through GAP-9) with file:line evidence from the assessment. No aspirational features are included. Blocked items (VIN gateway 403) and inventory metrics are excluded entirely.*
