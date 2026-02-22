# Nexxus Connect™ — Constitution v2.1

**Version:** 2.1
**Date:** 2026-02-21
**Status:** GOVERNING DOCUMENT — Identity, principles, and immutable rules
**Supersedes:** Old Constitution v1.0 (2026-02-18)
**Cross-References:** [NEW_SRS.md](./NEW_SRS.md) · [NEW_IMPLEMENTATION_PLAN.md](./NEW_IMPLEMENTATION_PLAN.md) · [NEW_CLAUDE.md](./NEW_CLAUDE.md) · [ACCEPTANCE_CRITERIA.md](../ACCEPTANCE_CRITERIA.md)

---

## 1. Platform Identity

### 1.1 What Nexxus Is

Nexxus is an AI orchestration layer that bridges businesses, their data, third-party integrations, and language models. It helps companies aggregate data and leverage AI to gain insights, automate processes, and improve business execution — starting with automotive sales.

Partners — domain experts with access to large customer groups — deliver AI technology to their industry segments through the Nexxus platform. The first partner (Duran Cage, automotive sales) brought Serra Automotive and Hyundai of Columbia as the initial paying customers.

### 1.2 What Makes Nexxus Unique

- **AI-first design** — natural language is the primary interface for querying data and executing tasks
- **Industry-agnostic architecture** — automotive is the first vertical, not the only one; industry-specific logic must be modular and replaceable
- **Partner delivery model** — scales through domain experts who serve their customer segments
- **Data accuracy over feature quantity** — correct metrics matter more than a long feature list
- **ClickUp-inspired UX** — thin sidebar + hover/pin sub-menus + persistent right pane for AI assistance

### 1.3 Current Vertical: Automotive

The first customers are automotive dealerships. Automotive-specific features (VIN Solutions integration, dealer-focused metrics, vehicle data) exist to serve these customers. The architecture must not be permanently locked to automotive — industry-specific logic should be modular and replaceable.

Nexxus is NOT a CRM replacement, NOT a marketing automation tool, and NOT a content development platform.

### 1.4 Branded Product Name

The product is branded **"Nexxus Connect™"** in all customer-facing surfaces. The logo is text-only (no icon), rendered as a static `<span>` element in the TopBar. It is not clickable.

---

## 2. Source of Truth Hierarchy

### 2.1 UI as Definitive Reference

The **current working UI prototype** is the single definitive reference for all visual behavior, layout, interaction patterns, and component structure. When any conflict exists between legacy documents, written specifications, and the actual UI code, the UI wins.

**Document Priority (highest → lowest):**

| Priority | Source | Authoritative For |
|----------|--------|-------------------|
| 1 | Current UI Code (client/src/) | All visual behavior, layout, interactions, component structure |
| 2 | ACCEPTANCE_CRITERIA.md | Verifiable behaviors as documented from the UI |
| 3 | This Constitution + SRS | Principles, requirements, metric formulas |
| 4 | IMPLEMENTATION_PLAN.md | Development sequencing and sprint structure |
| 5 | NEW_CLAUDE.md | Implementation guidance for AI agents |

### 2.2 Data Truth Hierarchy

When data conflicts between sources at runtime, follow this priority:

| Priority | Source | Authoritative For |
|----------|--------|-------------------|
| 1 | VIN Solutions API | Leads, statuses, sources, types, CRM users |
| 2 | VAPI / Tavus APIs | AI call and video session data |
| 3 | Local Database | Nexxus-only data: tasks, goals, agents, preferences, activity |
| 4 | Derived Metrics | Computed from the above sources; never cached as truth |

**Rule:** If VIN API returns data that differs from the local database, VIN wins. Update local to match. Derived metrics are recomputed on demand, not stored as authoritative values.

### 2.3 Honest AI

- Automa/DealerBrain admits when data is unavailable — it does not fabricate metrics or fill gaps with guesses
- When asked about blocked or inaccessible data, the AI explains what is unavailable and offers alternatives
- AI responses cite their data sources internally (source tags exist for traceability, not for customer display)
- No placeholder data, no "coming soon" indicators, no speculative numbers

---

## 3. Governing Principles

### 3.1 Role-Based Access Control (RBAC)

Each role sees what is relevant to their job. RBAC is enforced at both the UI layer and database level.

| Role | System Value | Real-World Equivalent | Dashboard Focus |
|------|-------------|----------------------|-----------------|
| Super Admin | `super_admin` | Platform operator (Huminic) | System-wide health, all orgs, platform operations |
| Partner Admin | `partner_admin` | Brand / group manager (Duran Cage) | Org engagement, adoption metrics, partner-scoped orgs |
| Org Admin | `org_admin` | Dealership Owner / GM / Sales Manager | Pipeline health, lead performance, AI activity |
| Staff | `org_staff` | Salesperson | Market intelligence, hot opportunities, competitive threats |

**Critical constraints:**
- Data access follows RBAC at the database level via Row-Level Security (RLS)
- No cross-org data leakage — RLS policies enforce tenant isolation on every query
- Staff role does NOT have access to System Settings
- Staff role does NOT have access to the Insights dashboard (only sees Main page tiles)
- Lead assignment must be configurable via Settings, never hardcoded
- The role switcher is a dev-only tool in TopBar (ArrowDownRight icon, far right); it will be removed in production

### 3.2 Data Accuracy Over Feature Quantity

- A metric showing correct data is worth more than ten metrics showing guesses
- Field population requirement: a metric is only certified if its underlying data fields have >50% fill rate
- No metric is displayed without ground truth verification (direct API query compared against computed result)
- Metrics that depend on blocked or inaccessible endpoints are excluded entirely — not shown, not placeholdered

### 3.3 Non-Destructive Operations

- Customers are in production. Changes must not break existing functionality
- VIN Solutions data is sensitive — read-only by default, writes require careful validation
- Feature branches for all development; deploy from main/master only
- Certification before credit — nothing counts as complete without runtime verification

### 3.4 Certification Over Credit

"Code exists" does not mean "feature works." The standard for completion:

1. **Configuration test** — verify configs, env vars, and settings function correctly
2. **Functional test** — verify the feature works (unit or integration test)
3. **Visual / E2E test** — verify the UI or API produces the expected result

A feature is CERTIFIED only after all three proofs pass.

### 3.5 UI Preservation Principle

The current UI prototype represents validated design decisions. During backend integration:
- Layout structure (sidebar, sub-menu, right pane) must not change
- Component styling must remain identical
- Interaction patterns (hover, click, animations) must be preserved
- Only the data source changes (mock → API)
- The Automa pop-out button (MessageCircle icon, primary-tinted) on data-display pages must remain
- Main page metric tile window-blind collapse animation must remain
- Metric detail modals must show real breakdown data with Key Insights, not generic placeholders

---

## 4. Naming Conventions

| Concept | Internal Name | User-Facing Name | Notes |
|---------|--------------|-----------------|-------|
| Platform | Nexxus | Nexxus Connect™ | Logo text, no icon |
| Master AI agent | Automa | Automa | Right pane chat header, always available. Pop-out button on all data-display pages for contextual discussion. |
| AI reasoning layer | DealerBrain | (not shown) | Underlying concept, not displayed |
| Voice AI calls | VAPI integration | Voice Agent | Never expose "VAPI" to users |
| Video AI sessions | Tavus integration | Video Agent | Never expose "Tavus" to users |
| AI chat | DealerBrain chat | (context-dependent) | "Automa" on right pane, agent name on agents page |
| Agent capabilities | Tools | Skills | UI always says "Skills" |
| Work management page | Hub | Hub | Route: /work-center |
| AI-generated insights | Hunches | Hunches | Confidence-scored pattern detections |

---

## 5. Metric Score Formulas (Immutable)

These formulas are the exact computations for the Main page tiles. They must be implemented precisely as specified. No approximations, no shortcuts.

### 5.1 Org Admin Tiles (Dealership Owner/GM)

**Tile 1: Pipeline Health Score (0-100)**
```
Pipeline Health = 
  Win Rate (SOLD/(SOLD+LOST)) × 50 pts +
  Active Pipeline Quality (1 - BAD/Total) × 30 pts +
  Pipeline Freshness (% ACTIVE < 30 days old) × 20 pts
```
Data: leadStatusType distribution, createdUtc for lead age, leadGroupCategory

**Tile 2: Lead Source Performance Score (0-100)**
```
Source Performance =
  Top 3 Sources Win Rate × 40 pts +
  Source Diversity (# active sources, max 10) × 30 pts +
  Source Concentration Risk (penalty if top source >50%) × 30 pts
```
Data: leadSource, leadStatusType per source, lead volume per source

**Tile 3: Lead Quality Score (0-100)**
```
Lead Quality =
  (1 - BAD_Rate) × 40 pts +
  Trade-In Penetration × 30 pts +
  In-Stock Match Rate (VIN populated) × 30 pts
```
Data: leadStatusType=BAD rate, isHot flag, tradeVehicles array, vin populated

**Tile 4: Market Demand Insight Score (0-100)**
```
Market Insight =
  Demand Trend (30d growth vs previous 30d) × 50 pts +
  New/Used Balance (neither >75%) × 25 pts +
  Make Diversity (top 3 makes < 60%) × 25 pts
```
Data: inventoryType (NEW vs USED), make+model frequency, createdUtc for trend

### 5.2 Staff Tiles (Salesperson Intelligence)

**Tile 1: Hot Opportunities Score (0-100)**
```
Hot Opportunities = 
  Hot Leads Awaiting Contact (NEW status) × 40 pts +
  Showroom Visitors Today × 30 pts +
  Fresh Leads with Trade-Ins (< 24h old) × 30 pts
```
Data: isHot=true, isOnShowroom=true, leadGroupCategory="NEW" + age < 24h, tradeVehicles

**Tile 2: What Customers Are Buying Score (0-100)**
```
Buying Trends Clarity =
  Top 3 Models Demand Concentration × 50 pts +
  New vs Used Preference Clarity (neither 45-55%) × 30 pts +
  Price Point Clarity (one band >40%) × 20 pts
```
Data: make+model from vehicles of interest, inventoryType trend, SOLD last 30 days, msrp bands

**Tile 3: Competitive Threat Alert Score (0-100)**
```
Competitive Pressure =
  (1 - LOST_PURCHASED_ELSEWHERE rate) × 50 pts +
  (1 - Loss Rate Growth vs Last Month) × 30 pts +
  (1 - WAITING Status Ratio) × 20 pts
```
Data: leadStatus LOST_* reasons, LOST trend, loss rate by leadType, WAITING volume

**Tile 4: Pipeline Urgency Score (0-100)**
```
Pipeline Urgency =
  (1 - Overdue_New_Leads_Ratio) × 40 pts +
  (1 - Stale_Active_Leads_Ratio) × 35 pts +
  (1 - Cooling_Hot_Leads_Ratio) × 25 pts
```
Data: createdUtc for lead age, leadGroupCategory="NEW" uncontacted, ACTIVE aged >14d, isHot + age >48h

### 5.3 Super Admin & Partner Admin Tiles

These tiles use platform-level aggregates (org counts, login counts, action counts) from the local Nexxus database. Formulas are simpler counts and trends — see SRS Section 4 for details.

---

## 6. Non-Negotiable Constraints

1. **NEVER** modify the validated UI layout, styling, or interaction patterns without explicit approval
2. **NEVER** expose vendor names (Tavus, VAPI, VIN Solutions) in any customer-facing UI
3. **NEVER** fabricate data or show unverified metrics — if data is unavailable, say so
4. **NEVER** bypass RLS or multi-tenant isolation
5. **NEVER** hardcode integration-specific values (lead assignment, phone numbers, API keys)
6. **NEVER** deploy from a feature branch — main/master only
7. **NEVER** cache derived metrics as authoritative truth — recompute on demand
8. **NEVER** show placeholder UI for blocked features — if it can't be delivered, don't show it
9. **NEVER** modify VAPI or Tavus webhook handlers without explicit approval — these are live in production and actively sending data to users
10. **ALWAYS** use "Skills" (not "Tools") in customer-facing UI for agent capabilities
11. **ALWAYS** preserve existing users in the system — never drop, truncate, or destructively migrate user data
12. **ALWAYS** treat VAPI and Tavus as live production environments — test against staging/test agents only, never against production agents
13. **ALWAYS** diff the implementation plan against the existing codebase before starting work — identify conflicts, ask questions, resolve ambiguity before writing code
14. **The UI is the source of truth** — if any document contradicts the working UI, the UI wins

---

## 7. Integration Rules

### 7.1 VIN Solutions
- OAuth2 with encrypted token storage
- Read-only by default; writes require validated href references, correct headers, and 2-step contact-then-lead creation
- API versioning: v1 for reference data, v3 for leads
- `excel_upload` records excluded from all lead queries
- Cache TTL: 5 minutes for leads

### 7.2 VAPI (Voice)
- **LIVE PRODUCTION** — Webhooks are actively sending data to real users. Do not modify webhook handlers without explicit approval.
- TriggerService for outbound calls
- Org isolation via `metadata.organizationId` or `assistantId` lookup
- Idempotency guards on all webhook handlers
- Test agent "Elliot" exists as a VAPI test-only agent — use Elliot to make test calls to other agents for verification
- Never test against production voice agents directly

### 7.3 Tavus (Video)
- **LIVE PRODUCTION** — Webhooks are actively sending data to real users. Do not modify webhook handlers without explicit approval.
- HMAC verification on inbound
- Cache TTL: 1 hour
- Never test against production video sessions directly

### 7.4 TextMagic (SMS)
- One unique phone number per store
- AI SMS responses powered by DealerBrain (Claude API), not VAPI
- **Testing protocol:** When testing SMS functions, send test messages back to the system itself (loopback test). Use `neoweaver@gmail.com` for testing outbound emails. Never send test messages to real customers.

### 7.5 All Webhooks
- Must have idempotency guards — duplicate events must not create duplicate records
- Duplicate detection before creating new records in external systems

---

## 8. Development Rules

### 8.1 UI Rules
- Never expose vendor names to end users
- Use role-appropriate labels: "Voice Agent", "Video Agent", "AI Assistant"
- No source labels in UI — customers do not see internal attribution
- No placeholder UI for blocked features
- Agent capabilities are called "Skills" in the UI (not "Tools")

### 8.2 Testing Rules
- Quality gates before every deploy: type-check + build + playwright tests
- Feature branches for development, master for deployment
- Three proofs required per feature (Section 3.4)
- All metric formulas must have automated verification tests
- **Every sprint requires at least 3 deltas of proof with screenshots**, then a full end-to-end test at sprint completion
- SMS testing: loopback to itself using TextMagic API (never to real customers)
- Email testing: use `neoweaver@gmail.com` for outbound email tests
- Voice testing: use the "Elliot" test agent to make calls to other agents for verification
- Video testing: use test sessions only, never production Tavus sessions

### 8.3 Code Organization
- Shared types in `shared/schema.ts` (Zod schemas for validation)
- Mock data preserved in `client/src/mocks/` as reference during migration
- API routes in `server/routes.ts` using storage interface
- Context providers for global state (theme, app state)

---

## Document Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2026-02-18 | 1.0 | Original Constitution |
| 2026-02-21 | 2.1 | Added UI source of truth principle, metric formulas (Org Admin + Staff), expanded RBAC spec, naming conventions, integration rules, cross-document references. Supersedes v1.0. |
| 2026-02-22 | 2.1.1 | Added live environment safety rules: VAPI/Tavus webhook protection, user preservation, testing protocols (Elliot agent, SMS loopback, neoweaver@gmail.com), sprint proof requirements, context router guidance, codebase diff requirement. |
