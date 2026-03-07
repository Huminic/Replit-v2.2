# Nexxus Connect v2.2 — AI-Powered Dealership Platform

## Overview

Nexxus Connect is an AI-powered dealership management platform for Serra Auto Group / Cage Automotive. Persona-driven UI organized by department (Sales, Service, Marketing, Management, AI Chat, TeamBox, My Work). The project is in **Stabilization Phase** — synthesis complete, no code fixes applied yet. All work governed by PLAN.md (v4.0) with AC traceability and GATE:STOP protocol.

## User Preferences

Preferred communication style: Simple, everyday language.

## Truth Hierarchy

1. **T1:** UI code (approved design)
2. **T2:** `.agent_docs/acceptance_criteria.md` (62 ACs — SINGLE SOURCE OF TRUTH)
3. **T3:** SRS.md
4. **T4:** PLAN.md sequencing

## Current Status

- **Baseline:** Commit `58288b6`
- **Phase:** Synthesis complete. Stabilization plan (PLAN.md v4.0) ready for execution.
- **RC Milestone:** VAPI + Tavus + Landing Page + Widget end-to-end, correct metrics in UI, stable/advanced user chat
- **Gaps:** 80 items in GAPS.md (19 HIGH / 31 MEDIUM / 30 LOW), all OPEN
- **Tests:** Zero automated tests exist. Test batteries provided in testing/ folder.
- **Governance:** GUARDRAILS.md v2.0 with 16 rules including GATE:STOP protocol (R16)

## Key Documents

| Document | Purpose |
|----------|---------|
| `PLAN.md` | Stabilization plan with AC traceability table (Section 1), 8 phases (S1-S8), sprint report template |
| `GAPS.md` | Neutral gap register — 80 items, all OPEN |
| `RISK_REGISTER.md` | Merged risk ranking (69 items), contradiction register (10 resolved), nuisance file list |
| `GUARDRAILS.md` | 16 rules for development discipline, including R16 GATE:STOP |
| `AGENT_CODING_PLAN.md` | Operational playbook — pre-flight checklist, per-task workflow, forbidden patterns, file scope rules |
| `MEMORY.md` | Chronological session log |
| `.agent_docs/acceptance_criteria.md` | 62 ACs in Given/When/Then format — DO NOT MODIFY |
| `audits/` | 11 audit artifacts from 7-workstream re-audit |
| `testing/` | 12 test battery files (batteries 1-6, coordinator, release criteria, data paths, diagrams) |

## System Architecture

### Frontend Stack
- React 18 with TypeScript
- Vite for development and building
- Wouter for client-side routing
- TanStack Query for data fetching and mutation caching
- Tailwind CSS with custom design tokens
- Shadcn/ui component library built on Radix UI primitives

### Backend Stack
- Express with TypeScript
- PostgreSQL with Drizzle ORM (22+ tables)
- JWT authentication
- bcrypt for password hashing
- Anthropic SDK for Claude AI (claude-sonnet-4-6)

## Database Schema

22+ tables: `roles`, `organizations`, `users`, `sessions`, `agents`, `conversations`, `messages`, `campaigns`, `tasks`, `widgets`, `integrations`, `knowledge_documents`, `campaign_recipients`, `outbound_log`, `notifications`, `activity_log`, `hunches`, `warehouse_leads`, `warehouse_metrics`, `appointments`, `slug_redirects`, `sync_log`, `usage_events`.

### Kill Switch Column Defaults
All outbound columns default to **FALSE** (AC-KS-A compliant):
- `outbound_enabled`, `sms_enabled`, `phone_enabled`, `email_enabled` → default(false)
- Seed explicitly sets TRUE for test organizations

## External Integrations

| Integration | Status | Notes |
|------------|--------|-------|
| Anthropic (Claude AI) | Wired | SSE streaming, tool use, 3 chat contexts |
| TextMagic (SMS) | Wired | 2-way SMS, webhook receiver |
| Resend (Email) | Wired | Transactional email |
| VinSolutions (CRM) | Wired | Lead query via MCP, warehouse sync |
| Brave Search | Wired | Web search tool for AI chat |
| VAPI (Voice) | **MOCK** | Console.log only — RC blocker |
| Tavus (Video) | **MISSING** | Zero implementation — RC blocker |

## Authentication
- JWT tokens: `nexxus_access_token` in localStorage
- Test logins: admin@nexxus.com/password123, Org_Admin@huminic.ai, duane.wells@huminic.ai/a1$ucc3ss
- Role hierarchy: super_admin(1) > partner_admin(2) > org_admin(3) > executive(4) > sales_manager(5) > sales(6) > service(7) > marketing(8)

## Key Source Files
- `shared/schema.ts` — All 22+ tables, insert schemas, types
- `server/routes.ts` — 104 API routes
- `server/storage.ts` — Database storage layer (IStorage interface + DatabaseStorage)
- `server/outbound.ts` — Outbound engine with 4-layer safety stack
- `server/seed.ts` — Test data seeding
- `client/src/pages/main.tsx` — AI Chat with CRM Guru mode
- `client/src/pages/widget-landing.tsx` — Public landing page with widget
- `client/src/components/layout/SubMenuManager.tsx` — Navigation shell
- `scripts/enforcer.ts` — Compliance scanner (dropped features + kill switch defaults)
- `.agent_docs/acceptance_criteria.md` — DO NOT MODIFY

## Agent Protocol

Before starting any work, read: GAPS.md → GUARDRAILS.md → current phase in PLAN.md → AC traceability table. Follow GATE:STOP protocol (R16) after every task. See AGENT_CODING_PLAN.md for complete workflow.
