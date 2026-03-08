# PROPOSED — replit.md (Sweep 3A Draft)

> **Status: PROPOSED** — This document requires explicit owner approval before replacing the live replit.md. Do not promote automatically.

---

# Nexxus Connect v2.2 — Session Index

## Overview

Nexxus Connect is an AI-powered dealership CRM/communication platform for Serra Auto Group / Cage Automotive. It uses persona-driven AI agents to manage sales, service, and marketing communications with a unified inbox (TeamBox), outbound campaign engine, and embeddable customer widget.

**Golden Rule:** UI = T1 truth — change the data source, not the UI.

## User Preferences

Preferred communication style: Simple, everyday language.

## Terminology

| Term | Meaning |
|------|---------|
| **Waves** | Old PLAN.md development eras (Waves 0-5). Historical reference only. |
| **Sweeps** | STABILIZATION_PLAN.md steps (Sweeps 0-10+). Current stabilization work. |
| **Phases** | New PLAN.md milestones (P0-P10+). Forward development roadmap. |

## Truth Hierarchy (Sweep 1A)

| Tier | Source | Authority |
|------|--------|-----------|
| T1 | Runtime UI code | Highest — all visual behavior, layout, interactions |
| T2 | ACCEPTANCE_CRITERIA.md (root) | Verifiable behaviors documented from UI |
| T3 | GUARDRAILS.md | Agent rules and constraints |
| T4 | PLAN.md / STABILIZATION_PLAN.md | Sequencing and roadmap |
| T5 | PRD.md, audits/, .agent_docs/ | Reference material |
| T6 | Quarantined documents | No authority — historical reference only |

## Canonical Identity Model

- **Org-centered tenancy**: Every data entity belongs to an organization
- **org_id** is the universal scope filter on all queries
- **Main app chat** is canonical (shared/schema.ts with UUID PKs, org-scoped, JWT+RBAC)
- **8 RBAC roles**: super_admin → partner_admin → org_admin → executive → sales_manager → sales → service → marketing

## Document Index

### Governance Documents (Promotion Workflow Required)

| File | Purpose | Status |
|------|---------|--------|
| `PLAN.md` | Forward roadmap with Phases | Governance — requires promotion workflow to modify |
| `GUARDRAILS.md` | Agent rules (R1-R11) and constraints | Governance — requires promotion workflow to modify |
| `CLAUDE.md` | RETIRED — contents merged into replit.md (Sweep 3E) | Deleted |
| `ACCEPTANCE_CRITERIA.md` | Canonical requirements (T2 authority) | Governance — requires promotion workflow to modify |
| `proposed/agent-roles.md` | Agent role definitions and file scope | Governance — requires promotion workflow to modify |

### Stabilization Documents

| File | Purpose | Status |
|------|---------|--------|
| `STABILIZATION_PLAN.md` | Stabilization roadmap (Sweeps 0-10+) | Live — current execution guide |
| `sweep_0_report.md` | Sweep 0 deliverables (quarantine, freeze) | Sweep output — frozen |
| `sweep_1_report.md` | Sweep 1 deliverables (truth hierarchy, AC reconciliation, chat decision) | Sweep output — frozen |
| `sweep_2_report.md` | Sweep 2 deliverables (Continuity Matrix, Observability Matrix) | Sweep output — frozen |
| `sweep_2_5_blueprint.md` | Stabilization Blueprint (RC-blocking classification, remediation strategy) | Sweep output — frozen |

### Living Documents (Updated During Work)

| File | Purpose | Status |
|------|---------|--------|
| `ISSUES.md` | Living issue tracker — gaps, bugs, problems. Replaces GAPS.md. | Living — updated as issues are discovered |
| `MEMORY.md` | Chronological session log | Living — updated each session |

### Contract Files (Code)

| File | Purpose |
|------|---------|
| `shared/schema.ts` | Canonical data model — 23 tables, Drizzle ORM, UUID PKs |
| `server/storage.ts` | Storage interface (IStorage) + DatabaseStorage implementation |
| `server/routes.ts` | 90 API routes — all authenticated except public widget/landing/webhooks |

### Reference Documents (Read-Only)

| File | Purpose | Notes |
|------|---------|-------|
| `PRD.md` | Product requirements | Reference — not authoritative for implementation |
| `GAPS.md` | Original gap register (81 items) | RETIRED — migrated to ISSUES.md |
| `audits/` | 13 audit artifacts from rollback & re-audit | Frozen reference — findings of record |
| `testing/` | 12 test battery files (owner-uploaded) | Reference — adapted in Sweep 4 |
| `.agent_docs/acceptance_criteria.md` | Derived verification/test layer | Subordinate to root ACCEPTANCE_CRITERIA.md |
| `.agent_docs/rules/code-conventions.md` | TypeScript/naming conventions | Reference — potentially reusable |

### Quarantined Documents (T6 — No Authority)

| File | Reason |
|------|--------|
| `SPEC.md` | Describes single-table database; says "no active API routes" |
| `SRS.md` | Agent data stale; generic names vs actual personas |
| `Sprint_log.md` | Criteria mismatch; false E2E claims |
| `COMMENT_INDEX.md` | References pre-wiring states |
| `.agent_docs/rules/operational-context.md` | Never updated; all items PENDING |
| `.agent_docs/codebase-index.md` | Application code section empty |
| `.agent_docs/undefined-items.md` | No entries logged |
| `.agent_docs/rules/agent-roles.md` | Superseded by proposed/agent-roles.md |
| `.agent_docs/rules/file-management.md` | Stale file scope rules |
| `.agent_docs/rules/testing-protocol.md` | References non-existent spec.ts |

## System Architecture

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, wouter, TanStack Query v5 |
| Backend | Express.js, TypeScript, JWT auth, bcrypt |
| Database | PostgreSQL, Drizzle ORM (23 tables), drizzle-zod validation |
| AI | Anthropic Claude (claude-sonnet-4-6) via SDK |
| Communications | TextMagic (SMS), Resend (email), VAPI (voice — stub), Tavus (video — stub) |
| Data | VinSolutions (lead sync), Brave Search (web search for AI) |

### Key Counts

| Item | Count |
|------|-------|
| Database tables | 23 (shared/schema.ts) |
| API routes | 90 (server/routes.ts) |
| Frontend pages | 19 (client/src/pages/) |
| RBAC roles | 8 |
| ISSUES.md items | 101 (80 OPEN, 21 RESOLVED) |
| RC-blocking issues | 19 unique |

## UI Implementation Reference (Merged from CLAUDE.md — Sweep 3E)

### Locked Design Tokens

```css
--density-data: 13px;
--density-chat: 14-15px;
--sidebar-width: 64px;
--topbar-height: 56px;
--right-pane-width: 320px;   /* w-80 */
--right-pane-width-lg: 384px; /* lg:w-96 */
```

### Locked UI Elements

| Category | Locked Behavior |
|----------|----------------|
| TopBar | Logo text "Nexxus Connect™" (no icon, not clickable), org switcher center, icons right, globe icon for landing page |
| Sidebar | 64px width, 7 main items + System bottom, icon+label, purple active indicator (w-0.5 h-8 bg-purple-500) |
| SubMenuManager | Hover/pin system, 800ms leave timeout, ChevronLeft collapse, auto-collapse <1024px |
| Right Pane | w-80/lg:w-96, full-screen mobile overlay, Automa pop-out button visible when closed on data-display pages |
| Chat bubbles | Bot left (bg-card border border-border), user right (bg-primary), NO avatars, max-w-[80%] main / max-w-[85%] right pane |
| Typing animation | wave-dot CSS class, 3 dots, delays 0s/0.15s/0.3s |
| Chat input | chat-input-gradient wrapper, gradient glow, Enter sends, Shift+Enter newline |
| Metric tiles | Gradient backgrounds, SVG circles, hover-elevate, click opens detail modal. Window-blind collapse after first chat message. |
| TeamBox | 3-column layout: filters + conversation list + chat thread + customer info |

### Sidebar Items

| Label | Icon | Path | RBAC |
|-------|------|------|------|
| AI Chat | MessageSquare | / | All roles |
| TeamBox | Inbox | /teambox | All roles |
| My Work | User | /my-work | All roles |
| Sales | ShoppingCart | /sales | super_admin, partner_admin, org_admin, executive, sales_manager, sales |
| Service | Wrench | /service | super_admin, partner_admin, org_admin, executive, service |
| Marketing | Megaphone | /marketing | super_admin, partner_admin, org_admin, executive, marketing |
| Manage | LayoutDashboard | /management | super_admin, partner_admin, org_admin, executive, sales_manager |
| System | Settings | /settings/system | super_admin, partner_admin, org_admin |

### Sub-Menu Panels

- **AI Chat**: Favorites, Chat History, Artifacts
- **TeamBox**: Conversations, Tasks, Workflows + Quick Filters (Open, Automated, Followup)
- **My Work**: Assistant, Dashboard, Tasks, Chat
- **Sales**: Dashboard, Agents, Insights, Calendar + Agent list with search
- **Service**: Dashboard, Agents, Campaigns, Insights, Calendar + Agent list
- **Marketing**: Dashboard, Agents, Campaigns, Studio, Insights + Agent list
- **Management**: Dashboard, Insights, Hunches, Activities, ROI
- **System**: RBAC-gated settings items (Users, Organization, Tools, Knowledge, AI Config, Security, Notifications, Data, Appearance, Billing)

### View Configurations (AppLayout)

| View Config | Routes | Right Pane Behavior |
|------------|--------|-------------------|
| chat-only | / | Max-width 4xl centered, no right pane toggle |
| teambox | /teambox | Own 3-column layout, no global right pane |
| data-display | /sales, /service, /marketing, /management, /insights | Automa chat in right pane, toggle button visible |
| heavy-chat | /agents | Agent config in right pane |
| sub-menu | /my-work, /settings/*, /profile/* | No right pane toggle |

### AppContext State Variables

**UI State (client-side):** activePanel, subMenuExpanded, panelHovered, sidebarVisible, rightPaneOpen, mobileMenuOpen

**Data State (migrating mock → API):** currentUser, currentRole, currentOrganization, organizations, agents, notifications, favorites, selectedAgent, communicationGateEnabled, personaName

### Kill Switch Backend Spec

| Column | Table | Purpose |
|--------|-------|---------|
| outbound_enabled | organizations | Global org-level communication gate |
| sms_enabled | organizations | Per-channel toggle for SMS outbound |
| phone_enabled | organizations | Per-channel toggle for voice outbound |
| email_enabled | organizations | Per-channel toggle for email outbound |
| kill_switch | campaigns | Per-campaign stop |
| campaign_disconnected | teambox_conversations | Per-conversation disconnect |

MCP enforcement: central-mcp must check outbound_enabled + channel-specific flags before any outbound API call (TextMagic, Resend, VAPI).

### User-Facing Name Mapping

| Internal Name | User-Facing Name | Notes |
|--------------|-----------------|-------|
| VAPI | Voice Agent | Never expose "VAPI" |
| Tavus | Video Agent | Never expose "Tavus" |
| VIN Solutions | CRM Integration | Never expose vendor name |
| tools | Skills | UI always says "Skills" |
| hunches | Hunches | Confidence-scored patterns |
| persona | Organization's persona name (e.g., "Serra") | Configurable per org |

## Session Start Checklist

1. Read this file (replit.md) for orientation
2. Read ISSUES.md for current gap state
3. Read STABILIZATION_PLAN.md or PLAN.md for current work
4. Read MEMORY.md for recent session history
5. Verify current sweep/phase before starting work
6. End session by updating MEMORY.md
