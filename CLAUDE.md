# Nexxus Connect v2.2

CRM/AI platform for automotive dealerships.

**Stack:** Express 5 + React 18 + Vite 7 + Drizzle ORM + TypeScript 5.6 + PostgreSQL (Supabase)

Global values and rules: `~/.claude/CLAUDE.md`.
Governance file standards: `~/Claude-store/sysadmin/governance-framework/file-standards.md`.

## Memory (two-file protocol)

Read on start:
`~/.claude/projects/-home-ubuntu-Claude-store-nexxus2-2-replit/memory/context.md`

Write on finish:
`~/.claude/projects/-home-ubuntu-Claude-store-nexxus2-2-replit/memory/session-output.md`

**Agents never write to context.md.** Only the operator promotes content from session-output.md into context.md. If context.md looks wrong, say so in session-output.md under "What Next Agent Should Know" — do not fix it yourself.

Before acting on any claim in context.md about file paths, running services, or infrastructure: verify. "context.md says X" is not "X is true now."

## Runtime

| Item | Value |
|---|---|
| Dev URL | https://dev.huminicdev.com |
| Production URL | https://live.huminic.app |
| PM2 process | nexxus-app (port 5000) |
| Database | Supabase PostgreSQL |
| Dev server | `npm run dev` |
| Build + deploy | `npm run build && pm2 restart nexxus-app` (confirm with operator first) |

### Required env vars

`ANTHROPIC_API_KEY`, `BRAVE_API_KEY`, `APP_BASE_URL`, `VIN_SAFE_MCP_TOKEN`, `DATABASE_URL`, `VINSOLUTIONS_API_KEY`, `OPENAI_API_KEY`, `FAL_KEY`, `RESEND_API_KEY`. Missing env = silent feature failures.

### Test accounts (password: `NexxusTest2026`)

| Email | Role | Org |
|---|---|---|
| duane.wells@huminic.ai | super_admin | Huminic |
| duanekwells@gmail.com | partner_admin | Cage Automotive |
| serra_honda@huminic.ai | org_admin | Serra Honda |
| serra_nissan@huminic.ai | org_admin | Serra Nissan |
| serra_ford@huminic.ai | org_admin | Tony Serra Ford |
| columbia_hyundai@huminic.ai | org_admin | Hyundai of Columbia |
| columbia_ford@huminic.ai | org_admin | Ford of Columbia |

## Work protocol

1. Pick an item from `backlog.md`.
2. Use plan mode for non-trivial work.
3. Keep edits scoped to the item's declared files.
4. At the end of non-trivial work, dispatch a fresh agent via `Agent` tool with `subagent_type: code-reviewer` to verify claims against files.
5. Write `session-output.md` before finishing the session.

Commit with a plain message. No `COMMIT_ROLE`, no `COMMIT_SPRINT`, no `[skip-ghost]`.

## Agent filesystem boundary (CRITICAL)

**Incident REM-8-DT (2026-03-19):** a builder sub-agent rewrote `central-mcp/src/connectors/vin-connector.ts` without authorization. central-mcp had no git repo; the change could not be reverted.

Builder and sub-agents MUST NOT modify files outside `/home/ubuntu/Claude-store/nexxus2.2_replit/`. If a blocker exists in another project, STOP and report it. Do not fix it.

This is enforced by `~/.claude/hooks/file-boundary.sh` (narrowed form, shape B).

## VIN Solutions Safe MCP (CRITICAL)

**All VIN Solutions writes go through vin-safe-mcp, never central-mcp.**

| | Value |
|---|---|
| URL | http://0.0.0.0:4003/mcp |
| REST | http://0.0.0.0:4003/api/tool/{tool_name} |
| Auth | `Bearer 8NCVZ8ZCgHtab6A+FxHsgOKcgir89KvOR+wMIpYFLp4=` |
| Process | vin-safe-mcp (PM2, port 4003) |

Central MCP (port 4002) handles all other providers (VAPI, TextMagic, Tavus, Resend, FlexPrice, etc.) and VIN Solutions READ operations only.

### Write flow — MANDATORY

`prepare → review → execute → verify`. No shortcuts.

1. **Prepare** — call `vin_safe_prepare_lead`. Resolves dealer/user/lead source without creating anything.
2. **Review** — show the full preview to the operator. Do not proceed without explicit approval.
3. **Execute** — call `vin_safe_execute_lead` with approval token and `user_confirmed: true`.
4. **Verify** — expect `VERIFIED_CORRECT` or `ASSIGNMENT_MISMATCH`. If mismatch: STOP.

### Rules

- Never create VIN contacts or leads through central-mcp.
- Never set `user_confirmed: true` without showing the preview first.
- Never batch-insert leads; one at a time.
- If prepare fails, STOP and report.
- If verification returns `ASSIGNMENT_MISMATCH`, STOP immediately.
- Do not modify vin-safe-mcp code. It is managed by the central-mcp project owner.

## Action classification

**Safe (do freely):**
- Read any file
- Write to `evidence/` and `tests/`
- Run dev server (`npm run dev`), single test files

**Confirm with operator first:**
- Modify application code (`server/`, `client/src/`, `shared/`)
- `npm run build`, `pm2 restart`
- Database schema changes / migrations

**Irreversible — require explicit operator "go":**
- Any VIN Solutions / VAPI / TextMagic / Tavus / Resend / FlexPrice write
- Any email or SMS send to real addresses or numbers
- Any production deploy to `live.huminic.app`
- Any migration on production
- Any git push or force push

## Deployment actions

`npm run build`, `pm2 restart`, `pm2 reload` — run ONLY after code is committed and the operator confirms. Use `npm run dev` for local testing.

## CommGate

All outbound communication respects CommGate flags on the organization:
- Test payloads MUST NOT trigger real sends to real people.
- If CommGate is disabled, sends are logged with status `blocked`.
- Never bypass CommGate, even for "quick tests."

## Decision log

Stop and ask the operator when a decision affects:
- what a user sees (UI behavior, error messages, displayed data)
- what gets sent externally (email content, SMS text, API payloads)
- what gets stored permanently (schema, data transformations)

Document non-trivial decisions inline in the backlog item or in a commit message.

## UI protection

Frontend (`client/src/pages/`, `client/src/components/`) does not change without explicit permission. When in doubt, STOP and ask.

## Infrastructure

See `~/Claude-store/sysadmin/CLAUDE.md`. Use the safe wrappers for DNS, ports, monitoring.

## Legacy artifacts

Previous harness files (pre-2026-04-23) are preserved in `legacy-artifacts/` for reference only. Do not follow them; they were deprecated as part of the subtractive harness revision. See `legacy-artifacts/README.md` for the index.
