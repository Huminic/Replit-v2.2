# Nexxus Connect v2.2 — AI-Powered Dealership Platform

Unified AI communication platform for automotive dealerships (Serra Auto Group / Cage Automotive). Replaces fragmented SMS, email, chat, voice, and video tools with a single persona-driven interface organized by department (Sales, Service, Marketing, Management).

## Tech Stack
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, wouter, TanStack Query v5
- **Backend:** Express, Node.js, PostgreSQL, Drizzle ORM, JWT auth, bcrypt
- **AI:** Anthropic Claude (claude-sonnet-4-6) via SSE streaming
- **Integrations:** TextMagic (SMS), Resend (email), VAPI (voice), Tavus (video), VinSolutions (CRM read-only)

## BEFORE ANY ACTION
Read these files in order before starting any work:
1. `PLAN.md` — current sprint roadmap (find your sprint, read its scope)
2. `GUARDRAILS.md` — anti-drift rules, completion gates, session protocol
3. `.agent_docs/rules/agent-roles.md` — role scope and compliance rules

## Truth Hierarchy
1. **T1:** UI code (approved design) — change the data source, not the UI
2. **T2:** `.agent_docs/acceptance_criteria.md` — functional AC (SSOT, read-only)
3. **T3:** `SRS.md` — system requirements
4. **T4:** `PLAN.md` — sprint sequencing

## Governance Files
| File | Purpose |
|------|---------|
| `PLAN.md` | Numbered sprint roadmap (S01-S12) |
| `GAPS.md` | Canonical bug/gap tracker — every known issue |
| `GUARDRAILS.md` | Anti-drift rules, completion gates, lockdown measures |
| `MEMORY.md` | Session log — decisions, changes, standing directives |
| `PRD.md` | Product requirements (reference) |
| `SRS.md` | System requirements (reference) |
| `.agent_docs/acceptance_criteria.md` | Functional acceptance criteria (DO NOT MODIFY) |
| `.agent_docs/rules/agent-roles.md` | Agent roles, scope, compliance checklist |
| `.agent_docs/rules/code-conventions.md` | TypeScript/naming conventions |
| `.agent_docs/rules/testing-protocol.md` | Test structure and quality gates |
| `.agent_docs/rules/file-management.md` | File scope and commit rules |
| `.agent_docs/codebase-index.md` | Living file map |

## Key Code Files
| File | Purpose |
|------|---------|
| `shared/schema.ts` | All DB tables, insert schemas, types |
| `server/routes.ts` | All API routes |
| `server/storage.ts` | Database storage layer (IStorage) |
| `client/src/pages/` | All page components |
| `client/src/components/layout/` | AppLayout, Sidebar, TopBar, SubMenu, RightPane |

## Golden Rules
- Change the data source, not the UI
- No fake data — if no real source, remove the metric
- Never use the word "MVP"
- No AC passes on hardcoded/static data (see GUARDRAILS.md R1)

## User Preferences
- Communication style: simple, everyday language
- No emojis in UI — use Lucide icons
