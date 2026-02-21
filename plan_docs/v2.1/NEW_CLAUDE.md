# Nexxus Connect™ — Claude Code Implementation Guide v2.1

**Version:** 2.1
**Date:** 2026-02-21
**Status:** GOVERNING DOCUMENT — Direct guidance for Claude Code implementation agents
**Cross-References:** [NEW_CONSTITUTION.md](./NEW_CONSTITUTION.md) · [NEW_SRS.md](./NEW_SRS.md) · [NEW_IMPLEMENTATION_PLAN.md](./NEW_IMPLEMENTATION_PLAN.md) · [ACCEPTANCE_CRITERIA.md](../ACCEPTANCE_CRITERIA.md)

---

## 1. Your Role

You are a Claude Code agent implementing the backend for Nexxus Connect™. The frontend UI prototype is complete and validated. Your job is to wire it to real data — NOT to redesign it.

### 1.1 The Golden Rule

**Change the data source, not the UI.** Every page, component, interaction, and animation in the current UI is the approved design. You replace mock imports with API calls. That's it.

### 1.2 Document Hierarchy

Read these documents in this order when starting work:

1. **ACCEPTANCE_CRITERIA.md** — The pixel-level truth for all UI behaviors
2. **NEW_CONSTITUTION.md** — Platform principles, naming conventions, metric formulas, constraints
3. **NEW_SRS.md** — Complete system requirements, database schema, API endpoints, metric specs
4. **NEW_IMPLEMENTATION_PLAN.md** — Sprint structure, module assignments, dependencies, verification criteria

When documents conflict, higher-numbered documents yield to lower-numbered ones. ACCEPTANCE_CRITERIA.md always wins for UI behavior.

---

## 2. What You Must NOT Change

### 2.1 Locked UI Elements

These are the output of validated design decisions. Do not modify them:

| Category | Locked Behavior |
|----------|----------------|
| **TopBar** | Logo text "Nexxus Connect™" (no icon, not clickable), org switcher center, icons right |
| **Sidebar** | 64px width, icon+label items, purple active indicator (w-0.5 h-8 bg-purple-500) |
| **SubMenuManager** | Hover/pin system, 800ms leave timeout, ChevronLeft collapse, auto-collapse <1024px |
| **Right Pane** | w-80/lg:w-96, full-screen mobile overlay, AgentConfigPane on agents page. Automa pop-out button (MessageCircle, primary-tinted circle) visible when closed on data-display pages. Mobile FAB at bottom-right. |
| **Chat bubbles** | Bot left (bg-card border border-border), user right (bg-primary), NO avatars, max-w-[80%] |
| **Typing animation** | wave-dot CSS class, 3 dots, delays 0s/0.15s/0.3s |
| **Chat input** | chat-input-gradient wrapper, gradient glow, Enter sends, Shift+Enter newline |
| **Thinking Card** | Brain icon, border-purple-500/20 bg-purple-500/5, collapsible |
| **Metric tiles** | 4-across grid, gradient backgrounds, SVG circles, hover-elevate, click opens modal. Window-blind collapse (max-h transition, 500ms) after first chat message sent. Toggle button appears: ChevronDown "Show" / ChevronUp "Hide". |
| **Suggestion bubbles** | Sparkle icon, pill-shaped, populate input on click |

### 2.2 Locked Design Tokens

```css
/* DO NOT change these values */
--density-data: 13px;   /* Data tables */
--density-chat: 14-15px; /* Chat interfaces */
--sidebar-width: 64px;
--topbar-height: 56px;
--right-pane-width: 320px; /* w-80 */
--right-pane-width-lg: 384px; /* lg:w-96 */
```

### 2.3 Locked Route Structure

```
/                    → Main page (chat-only view)
/insights            → Insights (data-display, tabs: dashboard/reports/library/hunches)
/activity            → Activity page (data-display)
/agents              → Agents page (heavy-chat view)
/agents/create       → Agent creation
/work-center         → Hub (sub-menu, tabs: calendar/leads/inbox)
/drive               → Drive (data-display)
/settings/system     → System Settings (sub-menu, role-gated)
/profile             → Profile (sub-menu, tabs: profile/preferences/billing)
/w/:slug             → Widget landing page (standalone, no AppLayout)
/login               → Login page (NEW — standalone, no AppLayout)
```

---

## 3. What You Must Change

### 3.1 Mock → API Replacement Pattern

For every page component, follow this exact pattern:

**Before (mock):**
```tsx
import { mockAgents } from '@/mocks/agents';
const agents = mockAgents;
```

**After (API):**
```tsx
import { useQuery } from '@tanstack/react-query';

const { data: agents, isLoading } = useQuery({
  queryKey: ['/api/agents'],
});

if (isLoading) return <AgentsSkeleton />;
```

### 3.2 Specific Replacements by File

| File | Current Mock Import | Replace With |
|------|-------------------|--------------|
| `AppContext.tsx` | mockCurrentUser, mockOrganizations, mockAgents, mockNotifications | API queries via AuthContext + TanStack Query |
| `main.tsx` | mockChatMessages, roleMetrics (hardcoded) | GET /api/conversations, GET /api/insights/dashboard |
| `agents.tsx` | Agent type from mocks | GET /api/agents, GET /api/agents/:id |
| `insights.tsx` | All inline mock data | GET /api/insights/* endpoints |
| `work-center.tsx` | mockTasks, mockCalendarEvents, etc. | GET /api/calendar/events, GET /api/leads, GET /api/inbox |
| `drive.tsx` | mockFiles | GET /api/files |
| `settings.tsx` | Inline settings data | GET /api/settings |
| `profile.tsx` | currentUser from context | GET /api/users/me + PATCH endpoints |
| `TopBar.tsx` | mockActivityFeed, notifications from context | API queries |
| `SubMenuManager.tsx` | mockConversations, agents from context | API queries |
| `RightPane.tsx` | Mock chat data | POST /api/conversations/:id/messages (SSE) |

### 3.3 State Management Migration

**Keep in AppContext (client-side only):**
- `activePanel` (which sub-menu panel is showing)
- `subMenuExpanded` (global pin state)
- `panelHovered` (mouse hover state)
- `sidebarVisible` (mobile sidebar toggle)
- `rightPaneOpen` (right pane toggle)
- `mobileMenuOpen` (mobile menu toggle)

**Move to API/AuthContext:**
- `currentUser` → AuthContext from GET /api/auth/me
- `currentRole` → from AuthContext (user.role)
- `currentOrganization` → from AuthContext
- `organizations` → GET /api/organizations (for multi-org users)
- `agents` → TanStack Query GET /api/agents
- `notifications` → TanStack Query GET /api/notifications
- `selectedAgent` → URL param + TanStack Query
- `favorites` → PATCH /api/users/:id/preferences (store in user preferences JSONB)

---

## 4. Technical Patterns

### 4.1 API Route Pattern

```typescript
// server/routes.ts
import { Router } from 'express';
import { requireAuth, requireRole } from './middleware';
import { storage } from './storage';

const router = Router();

router.get('/api/agents', requireAuth, async (req, res) => {
  const agents = await storage.getAgents(req.organizationId);
  res.json(agents);
});

router.post('/api/agents', requireAuth, requireRole(['org_admin', 'partner_admin', 'super_admin']), async (req, res) => {
  const parsed = insertAgentSchema.parse(req.body);
  const agent = await storage.createAgent({ ...parsed, organizationId: req.organizationId });
  res.status(201).json(agent);
});
```

### 4.2 Storage Interface Pattern

```typescript
// server/storage.ts
export interface IStorage {
  // Users
  getUser(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  createUser(data: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User>;
  
  // Agents
  getAgents(organizationId: string): Promise<Agent[]>;
  getAgent(id: string): Promise<Agent | null>;
  createAgent(data: InsertAgent): Promise<Agent>;
  updateAgent(id: string, data: Partial<Agent>): Promise<Agent>;
  deleteAgent(id: string): Promise<void>;
  
  // ... etc for each module
}
```

### 4.3 SSE Streaming Pattern (Chat)

```typescript
router.post('/api/conversations/:id/messages', requireAuth, async (req, res) => {
  const { content } = req.body;
  
  // Save user message
  await storage.createMessage({
    conversationId: req.params.id,
    role: 'user',
    content,
  });
  
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Stream AI response
  const stream = await claude.messages.create({
    model: 'claude-sonnet-4-20250514',
    stream: true,
    messages: [{ role: 'user', content }],
    system: agentSystemPrompt,
  });
  
  let fullContent = '';
  for await (const event of stream) {
    if (event.type === 'content_block_delta') {
      const text = event.delta.text;
      fullContent += text;
      res.write(`data: ${JSON.stringify({ type: 'delta', text })}\n\n`);
    }
  }
  
  // Save assistant message
  await storage.createMessage({
    conversationId: req.params.id,
    role: 'assistant',
    content: fullContent,
  });
  
  res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
  res.end();
});
```

### 4.4 Metric Computation Pattern

```typescript
// server/services/metricEngine.ts
export class MetricEngine {
  constructor(private storage: IStorage) {}
  
  async computePipelineHealth(organizationId: string): Promise<number> {
    const leads = await this.storage.getLeads(organizationId);
    
    const sold = leads.filter(l => l.statusType === 'SOLD').length;
    const lost = leads.filter(l => l.statusType === 'LOST').length;
    const bad = leads.filter(l => l.statusType === 'BAD').length;
    const active = leads.filter(l => l.statusType === 'ACTIVE');
    const total = leads.length;
    
    // Constitution §5.1 Tile 1 formula — DO NOT MODIFY
    const winRate = sold + lost > 0 ? sold / (sold + lost) : 0;
    const pipelineQuality = total > 0 ? 1 - (bad / total) : 1;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const freshActive = active.filter(l => new Date(l.createdUtc) > thirtyDaysAgo).length;
    const freshness = active.length > 0 ? freshActive / active.length : 0;
    
    return Math.round(winRate * 50 + pipelineQuality * 30 + freshness * 20);
  }
  
  // ... implement all formulas from Constitution §5
}
```

### 4.5 Frontend Query Pattern

```tsx
// TanStack Query with proper cache invalidation
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

// Fetch
const { data, isLoading } = useQuery({
  queryKey: ['/api/agents'],
});

// Mutation with cache invalidation
const createAgent = useMutation({
  mutationFn: (data: InsertAgent) => apiRequest('POST', '/api/agents', data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
  },
});
```

---

## 5. RBAC Implementation

### 5.1 Role Hierarchy

```
super_admin > partner_admin > org_admin > org_staff
```

### 5.2 Route Access Matrix

| Endpoint Category | super_admin | partner_admin | org_admin | org_staff |
|-------------------|:-----------:|:-------------:|:---------:|:---------:|
| Auth | ✅ | ✅ | ✅ | ✅ |
| Own Profile | ✅ | ✅ | ✅ | ✅ |
| Agents CRUD | ✅ | ✅ | ✅ | Read only |
| Chat | ✅ | ✅ | ✅ | ✅ |
| Insights Dashboard | ✅ | ✅ | ✅ | ❌ |
| Insights Library | ✅ | ✅ | ✅ | ❌ |
| Reports | ✅ | ✅ | ✅ | ❌ |
| Hunches | ✅ | ✅ | ✅ | ❌ |
| Leads | ✅ | ✅ | ✅ | ✅ |
| Calendar | ✅ | ✅ | ✅ | ✅ |
| Drive | ✅ | ✅ | ✅ | ✅ |
| System Settings | ✅ | ✅ | ✅ | ❌ |
| User Management | ✅ | ✅ | ✅ | ❌ |
| Org Management | ✅ | ✅ | Read only | ❌ |
| VIN Sync | ✅ | ✅ | ✅ | ❌ |
| Webhooks | System | System | System | System |

### 5.3 Data Scoping

- `super_admin` sees ALL organizations
- `partner_admin` sees their partner group's organizations only
- `org_admin` sees their own organization only
- `org_staff` sees their own organization only (further filtered by lead assignment when applicable)

---

## 6. Critical Constraints

### 6.1 Naming Rules (from Constitution §4)

- Never show "VAPI", "Tavus", "VIN Solutions" in any user-facing UI
- Use "Voice Agent", "Video Agent", "AI Assistant" instead
- Agent capabilities are "Skills" not "Tools" in the UI
- The AI assistant is always called "Automa"
- The platform is "Nexxus Connect™"

### 6.2 Data Rules

- All VIN API calls use correct version headers (v1 for reference data, v3 for leads)
- Source tagging on all data responses (internal traceability only)
- Cache TTL: 5 minutes for VIN leads, 1 hour for VAPI/Tavus
- `excel_upload` records excluded from ALL lead queries
- Duplicate detection before creating records in external systems

### 6.3 Metric Rules

- Metric formulas in Constitution §5 are IMMUTABLE — implement exactly as specified
- A metric is only certified if underlying data has >50% fill rate
- No metric displayed without ground truth verification
- Metrics depending on blocked endpoints are excluded entirely (not placeholdered)
- Derived metrics recomputed on demand, never stored as authoritative truth

### 6.4 Error Handling

- User-friendly error messages — never expose stack traces
- API errors return JSON: `{ error: string, code: string }`
- 401 for unauthenticated, 403 for unauthorized, 404 for not found, 422 for validation
- Log errors server-side with context (user, org, endpoint, timestamp)
- Graceful degradation: if VIN API is down, show cached data with staleness indicator

---

## 7. Testing Requirements

### 7.1 Per-Feature Certification (Constitution §3.4)

Every feature requires three proofs:

1. **Configuration test** — env vars, database connection, API keys work
2. **Functional test** — the feature produces correct output (unit/integration test)
3. **Visual/E2E test** — the UI renders correctly with real data (Playwright)

### 7.2 Metric Verification

For every metric formula:
1. Create a known test dataset (10-20 leads with controlled statuses)
2. Manually compute the expected score
3. Assert the MetricEngine produces the same score
4. Document: metric name, test data, expected value, actual value, pass/fail

### 7.3 RLS Verification

For every multi-tenant table:
1. Create test data for Org A and Org B
2. Authenticate as Org A user
3. Assert Org B data is not returned
4. Assert Org A data is returned correctly

---

## 8. Agent Team Protocol

When multiple agents work on this project, follow the Agent Team Development Protocol:

### 8.1 Roles

- **Architect** (read-only): decomposes specs, defines interfaces, resolves ambiguity
- **Implementer(s)** (max 3 parallel): writes code within assigned module scope
- **Validator** (separate from implementer): writes and runs tests
- **Auditor** (read-only): reviews for gaps, inconsistencies, security
- **Lead** (orchestrator): assigns work, enforces gates, makes decisions

### 8.2 Development Phases

1. **Phase 0: Decomposition** — Architect produces task DAG with scope, interface contracts, verification criteria
2. **Phase 1: Interface-First** — All implementers agree on types, function signatures, API contracts before coding
3. **Phase 2: Implementation** — Parallel work in isolated scopes, communication via Lead
4. **Phase 3: Validation** — Validator tests merged code against verification criteria (not implementation)
5. **Phase 4: Audit** — Auditor reviews with security, consistency, completeness checklists

### 8.3 Communication Rules

- Implementer discovers interface needs to change → STOP → Message Lead
- Implementer finds spec ambiguity → Message Lead with 2-3 options (do not guess)
- Implementer is blocked → Message Lead with cause and options
- Never batch-merge worktrees without intermediate testing

### 8.4 Module Boundaries

Each implementer has exclusive modification rights to their module's files (see Implementation Plan §11). Shared files (schema.ts, routes.ts, storage.ts) require coordination through Lead.

---

## 9. Quick Reference: What Goes Where

| I need to... | File(s) to modify |
|---|---|
| Add a new database table | `shared/schema.ts` |
| Add a new API endpoint | `server/routes.ts` (or module-specific route file) |
| Add database operations | `server/storage.ts` |
| Add a business logic service | `server/services/*.ts` |
| Add authentication logic | `server/auth.ts`, `server/middleware.ts` |
| Add webhook handler | `server/webhooks/*.ts` |
| Replace mock data on a page | The page file in `client/src/pages/*.tsx` |
| Add a new page | `client/src/pages/*.tsx` + register in `client/src/App.tsx` |
| Modify global state | `client/src/contexts/AppContext.tsx` (minimize changes) |
| Add auth state | `client/src/contexts/AuthContext.tsx` |
| Style a component | Use existing Tailwind classes + design tokens in `client/src/index.css` |

---

## 10. Live Environment Safety Rules

This is a **live production environment** with real users and active integrations. Follow these rules without exception.

### 10.1 Live Webhooks — Do Not Disrupt

Tavus and VAPI have **live webhooks actively sending data to users**. These webhook endpoints must remain functional at all times during development. If you need to modify webhook handlers:
1. Create new handlers alongside existing ones
2. Test the new handlers independently
3. Swap atomically only after verification
4. Never take down a webhook endpoint for refactoring

### 10.2 Tavus & VAPI — Live Environment Caution

When working on any Tavus or VAPI integration code, remember this is a **live environment with real users**. Do not:
- Reset or delete Tavus conversation histories
- Modify VAPI agent configurations without explicit approval
- Change webhook URLs or authentication tokens
- Run destructive tests against these services

### 10.3 Preserve Existing Users

The system has existing users that **must be preserved**. During database migrations:
- Always use additive migrations (add columns/tables, never drop)
- Back up user data before any schema changes
- Verify user data integrity after every migration
- Never truncate or drop the users table

### 10.4 Safe Testing Protocols

When testing functions that interact with external services:
- **SMS Testing (TextMagic API):** Always test by sending back to the system itself — do NOT send test messages to real customer numbers
- **Email Testing:** Use `neoweaver@gmail.com` for all outbound email tests — do NOT use customer email addresses
- **Voice/Video Testing:** Use the test agent "Elliot" (see §10.5)
- **Never use production customer data for test scenarios**

### 10.5 Test Agent: Elliot

There is a VAPI agent named **"Elliot"** that exists solely for testing purposes. Elliot can make calls to the existing agents for testing voice workflows. Use Elliot for:
- Testing agent-to-agent call flows
- Verifying VAPI webhook handling
- Testing voice conversation routing
- Do NOT delete or reconfigure Elliot without explicit approval

### 10.6 Testing Evidence Requirements

Every sprint requires **at least 3 deltas of proof with screenshots** for each completed feature, followed by a full end-to-end test suite:

1. **Delta 1 — Configuration Proof:** Screenshot showing the feature is properly configured (database records, API responses, environment setup)
2. **Delta 2 — Functional Proof:** Screenshot showing the feature works as intended (data flowing, calculations correct, UI rendering)
3. **Delta 3 — Integration Proof:** Screenshot showing the feature works correctly with other modules (cross-module data flow, RBAC enforcement, error handling)
4. **Full E2E:** Playwright test covering the complete user journey for the sprint's features

### 10.7 Context Router & Uploaded Data Store

Pay special attention to the **context router** — it is the intelligence layer that routes conversations and data to the correct agents and services.

There is an **additional data store for user-uploaded content** that exists separately from data synced from third-party integrations (VIN Solutions, TextMagic, etc.). This uploaded data store must:
- Be clearly separated in the schema from synced data
- Have its own CRUD endpoints
- Not be overwritten by third-party sync operations
- Support the context router's ability to reference both uploaded and synced data

### 10.8 Codebase Diff Requirement

Before starting any sprint, **diff the implementation plan against the existing codebase** to identify:
- Files that already exist and may conflict with planned changes
- Existing functionality that overlaps with planned features
- Naming conflicts between existing code and planned modules
- Dependencies that are already installed vs. those that need adding

Resolve all questions from the diff before writing new code.

### 10.9 UI Is Source of Truth

The current working UI is the **definitive source of truth** for all visual design, layout, interaction patterns, and user flows. The backend exists to power the UI — not the other way around. If any documentation conflicts with what the UI currently does, the UI wins. See Document Hierarchy in §1.2.

---

## 11. Checklist: Before Marking Any Task Complete

- [ ] Code compiles without TypeScript errors
- [ ] No ESLint warnings
- [ ] Unit tests pass for new functionality
- [ ] API endpoints return correct data
- [ ] UI renders correctly with real data (visual check or Playwright)
- [ ] RLS isolation verified (if multi-tenant data involved)
- [ ] Error handling implemented (no raw error objects exposed)
- [ ] No mock data imports remain in modified files
- [ ] Loading states shown while data fetches
- [ ] Naming conventions followed (Constitution §4)
- [ ] Metric formulas exactly match Constitution §5 (if applicable)
- [ ] Live webhooks (Tavus, VAPI) verified still functional
- [ ] No test messages sent to real customer numbers/emails
- [ ] 3 deltas of proof captured with screenshots
- [ ] Existing users preserved and data intact

---

## Document Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2026-02-21 | 2.1 | Initial Claude Code guide with document hierarchy, locked UI elements, replacement patterns, technical patterns (API routes, storage, SSE, metrics, TanStack Query), RBAC matrix, agent team protocol, testing requirements. |
| 2026-02-21 | 2.1.1 | Added §10 Live Environment Safety Rules: webhook preservation, Tavus/VAPI caution, user preservation, safe testing protocols (TextMagic/email), test agent Elliot, 3-delta evidence requirements, context router & uploaded data store guidance, codebase diff requirement, UI source of truth reaffirmation. Updated completion checklist. |
