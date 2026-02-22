# Backend Integration Guide — DEPRECATED

**This file has been removed.** The architecture it described (Drizzle ORM, express-session, connect-pg-simple) was never implemented.

## Actual Production Architecture

The production backend uses:
- **Supabase** with **SecureQueryBuilder** (RLS-enforced queries)
- **JWT authentication** (1-hour expiry, 60-second auto-refresh)
- **345+ backend files**, **175+ API endpoints**, **53 database tables**
- **7 third-party integrations** (VIN Solutions, VAPI, Tavus, Resend, TextMagic, Claude API, Google Calendar)

## Where to Find Correct Information

- **Server audit:** `replit_reference/App Audit/server-audit.md` — Complete API endpoint catalog
- **Database audit:** `replit_reference/App Audit/database-audit.md` — All 53 tables, RLS policies
- **Client audit:** `replit_reference/App Audit/client-audit.md` — 26 TanStack Query hooks, integration plumbing
- **Health audit:** `replit_reference/App Audit/health-audit.md` — Build system, test inventory
- **Carry-Forward Manifest:** `plan_docs/v2.1/CARRY_FORWARD_MANIFEST.md` — Files to preserve during rebuild
- **Handoff Prompt:** `plan_docs/v2.1/CLAUDE_CODE_HANDOFF_PROMPT.md` — Complete rebuild instructions

Do not recreate this file. All backend documentation lives in the audit files listed above.
