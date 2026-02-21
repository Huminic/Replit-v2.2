# Nexxus V2 -- Constitution

**Version:** 1.0
**Date:** 2026-02-18
**Status:** GOVERNING DOCUMENT -- Identity, principles, and rules

---

## 1. Platform Identity

### 1.1 What Nexxus Is

Nexxus is an AI orchestration layer that bridges businesses, their data, third-party integrations, and language models. It helps companies aggregate data and leverage AI to gain insights, automate processes, and improve business execution -- starting with sales.

Partners -- domain experts with access to large customer groups -- deliver AI technology to their industry segments through the Nexxus platform. The first partner (Duran Cage, automotive sales) brought Serra Automotive and Hyundai of Columbia as the initial paying customers.

### 1.2 What Makes Nexxus Unique

- **AI-first design** -- natural language is the primary interface for querying data and getting things done
- **Industry-agnostic architecture** -- automotive is the first vertical, not the only one
- **Partner delivery model** -- scales through domain experts who serve their customer segments
- **Data accuracy over feature quantity** -- correct metrics matter more than a long feature list

### 1.3 Current Vertical: Automotive

The first customers are automotive dealerships. Automotive-specific features (VIN Solutions integration, dealer-focused metrics, vehicle data) exist to serve these customers. The architecture must not be permanently locked to automotive -- industry-specific logic should be modular and replaceable.

Nexxus is NOT a CRM replacement, NOT a marketing automation tool, and NOT a content development platform.

---

## 2. Governing Principles

### 2.1 Truth Hierarchy

When data conflicts between sources, follow this priority:

| Priority | Source | Authoritative For |
|----------|--------|-------------------|
| 1 | VIN Solutions API | Leads, statuses, sources, types, CRM users |
| 2 | VAPI / Tavus APIs | AI call and video session data |
| 3 | Local Database | Nexxus-only data: tasks, goals, agents, preferences, activity |
| 4 | Derived Metrics | Computed from the above sources; never cached as truth |

**Rule:** If VIN API returns data that differs from the local database, VIN wins. Update local to match. Derived metrics are recomputed on demand, not stored as authoritative values.

### 2.2 Honest AI

- DealerBrain admits when data is unavailable -- it does not fabricate metrics or fill gaps with guesses
- When asked about blocked or inaccessible data, DealerBrain explains what is unavailable and offers alternatives
- AI responses cite their data sources internally (source tags exist for traceability, not for customer display)
- No placeholder data, no "coming soon" indicators, no speculative numbers

### 2.3 Role-Based Experience

Each role sees what is relevant to their job:

| Role | Dashboard Focus |
|------|-----------------|
| `super_admin` | System-wide health, all orgs, platform operations |
| `partner_admin` | Org engagement, adoption metrics, credit usage |
| `org_admin` | Pipeline health, team performance, AI activity |
| `org_staff` | My leads, my tasks, my performance |

Data access follows RBAC at the database level. No cross-org data leakage. RLS policies enforce tenant isolation on every query.

### 2.4 Data Accuracy Over Feature Quantity

- A metric showing correct data is worth more than ten metrics showing guesses
- Field population requirement: a metric is only certified if its underlying data fields have greater than 50% fill rate
- No metric is displayed without ground truth verification (direct API query compared against computed result)
- Metrics that depend on blocked or inaccessible endpoints are excluded entirely -- not shown, not placeholdered

### 2.5 Non-Destructive Operations

- Customers are in production. Changes must not break existing functionality.
- VIN Solutions data is sensitive -- read-only by default, writes require careful validation and correct API formatting
- Feature branches for all development; deploy from master only
- Certification before credit -- nothing counts as complete without runtime verification

### 2.6 Certification Over Credit

"Code exists" does not mean "feature works." The standard for completion:

1. **Configuration test** -- verify configs, env vars, and settings function correctly
2. **Functional test** -- verify the feature works (unit or integration test)
3. **Visual / E2E test** -- verify the UI or API produces the expected result

A feature is CERTIFIED only after all three proofs pass. Until then, it is IN PROGRESS regardless of how much code has been written.

---

## 3. Development Rules

### 3.1 UI Rules

- Never expose vendor names to end users -- no "Tavus", "Vapi", or "VAPI" in any customer-facing UI
- Use role-appropriate labels: "Voice Agent", "Video Agent", "AI Assistant"
- No source labels in UI -- customers do not need to see "VIN API", "Local + VIN", or other internal attribution
- No placeholder UI for blocked features -- if a metric or feature cannot be delivered, do not show it at all
- Agent capabilities are called "Skills" in the UI (not "Tools")

### 3.2 Data Rules

- All VIN API calls must use correct version headers (v1 for reference data, v3 for leads)
- Source tagging on all data responses for internal traceability (not displayed to users)
- Cache with TTL -- never serve stale data as truth (5 minutes for VIN leads, 1 hour for VAPI/Tavus)
- `excel_upload` records excluded from all lead queries
- Duplicate detection before creating new records in external systems

### 3.3 Integration Rules

- **VIN Solutions:** OAuth2 with encrypted token storage. Read-only by default. Writes use validated href references, correct headers, and 2-step contact-then-lead creation.
- **VAPI:** Webhooks for inbound call data. TriggerService for outbound calls. Org isolation via `metadata.organizationId` or `assistantId` lookup.
- **Tavus:** Webhooks for video session data. HMAC verification on inbound.
- **TextMagic:** One unique phone number per store. AI SMS responses powered by DealerBrain (Claude API), not VAPI.
- **All webhooks:** Must have idempotency guards. Duplicate events must not create duplicate records.

### 3.4 Testing Rules

- Quality gates before every deploy: `npm run check` + `npm run build` + `npx playwright test`
- Feature branches for development, master for deployment
- Deploy only via `./deploy.sh` (which enforces the master branch requirement)
- No commits without passing quality gates
- Three proofs required per feature (Section 2.6)

---

## 4. Naming Conventions

| Concept | Internal Name | User-Facing Name |
|---------|--------------|-----------------|
| AI assistant framework | DealerBrain | (not shown -- it is the underlying concept) |
| Master AI agent | Automa | Automa |
| Voice AI calls | VAPI integration | Voice Agent |
| Video AI sessions | Tavus integration | Video Agent |
| AI chat | DealerBrain chat | (context-dependent label) |
| Agent capabilities | Tools | Skills |
| Work management | Hub | Work Center |

---

## 5. RBAC Role Mapping

| Nexxus Role | System Value | Real-World Equivalent | Dashboard Focus |
|-------------|-------------|----------------------|-----------------|
| Super Admin | `super_admin` | Platform operator (Huminic) | System-wide health |
| Partner Admin | `partner_admin` | Brand / group manager | Org engagement and adoption |
| Org Admin | `org_admin` | Sales Manager / BDC Manager | Pipeline health, team performance |
| Staff | `org_staff` | Salesperson | My leads, my tasks, my performance |

Lead assignment (e.g., VAPI/Tavus-originated leads to a specific salesperson) must be configurable via Settings, never hardcoded.

---

## 6. Non-Negotiable Constraints

1. NEVER modify production v1 (`/home/ubuntu/Claude-store/nexxus/`)
2. NEVER share credentials between v1 and v2
3. NEVER deploy from a feature branch
4. NEVER expose vendor names in customer-facing UI
5. NEVER fabricate data or show unverified metrics
6. NEVER hardcode integration-specific values (lead assignment, phone numbers, API keys)
7. NEVER bypass RLS or multi-tenant isolation
8. NEVER modify VAPI webhook handlers without explicit approval
