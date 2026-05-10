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

## Harness — agent team workflow (2026-04-25)

Project-level Claude Code harness lives at:
- hooks: `~/Claude-store/sysadmin/harness/hooks/` (referenced by `.claude/settings.json`)
- agents: `~/Claude-store/sysadmin/harness/agents-common/` (symlinked into `.claude/agents/`)
- commands: `~/Claude-store/sysadmin/harness/commands-common/` (symlinked into `.claude/commands/`)

### Mandatory before any non-trivial work

1. Run `/preflight` and present pre-flight confirmations to the operator. Wait for explicit "go".
2. For launch-affecting work, also run `/launch-check`.
3. Dispatch `harness-orchestrator` (not the legacy `orchestrator`).
4. Subagents:
   - `scope-guardian` — verifies scope before completion (also OWNS process-discipline drift checks: no A/B/C wave subdivisions, 3-category operator-decision boundaries, no options menus)
   - `harness-backend` / `harness-frontend` — implementation
   - `qa-evaluator` — produces two deltas of proof; PRIMARY investigator role for "broken / not working" complaints (run BEFORE proposing a fix scope)
   - `code-reviewer` — independent diff review
   - `integration-safety` — external-provider boundary safety
   - `nexxus-launch-captain` — launch readiness (Monday Apr 27, 2026 9 AM ET)
   - `nexxus-e2e-evaluator` — Playwright/MCP end-to-end recorded evidence

### TEAM DISPATCH DEFAULT (mandatory; established 2026-05-10)

**A persistent Claude Code team exists for this project: `nexxus-v22-release-factory`** (created 2026-05-10).

Config path: `~/.claude/teams/nexxus-v22-release-factory/config.json`. Read the `members` array to discover idle teammates by NAME (not UUID).

**DEFAULT DISPATCH PATH (use this 95% of the time):**
1. `Read` the team config file to enumerate existing teammates.
2. For wave work: `SendMessage({to: "<teammate-name>", ...})` to wake an idle teammate. Teammates retain context across waves — that's the whole point.
3. Use `TaskUpdate({owner: "<teammate-name>"})` to assign tasks.

**WHEN IT'S OK TO SPAWN A FRESH SUBAGENT VIA `Agent` TOOL:**
- The required role does NOT exist as a teammate (e.g., one-shot `Explore` scout for a quick read-only research pass that doesn't need cross-wave continuity).
- The team has been disbanded (post-Wave-11A live-deploy cleanup).
- The orchestrator confirms the team config file is missing or corrupted.

**NEVER kill and recreate teammates.** This was the failure mode the operator flagged 2026-05-10:

> "The more consistent you are with your team members, the more they're going to follow your logic. The more that you kill them and recreate them by not having the foresight to put the team together the right way in the first place, the more problems you're gonna have."

**Anti-patterns (do NOT do):**
- Spawning a fresh `Agent({subagent_type: "qa-evaluator"})` when the team's `qa-evaluator` teammate is idle. Use `SendMessage` instead.
- Inventing role names that aren't in the prescribed roster. The roster above is canonical. The "drift-detector" function (process-discipline checks) FOLDS into `scope-guardian`'s role, NOT a separate teammate.
- Using `Agent` tool defaults out of habit when a team is in scope. Read the team config first.

**Post-compact / post-clear behavior:** the next orchestrator MUST read this section + read `~/.claude/teams/nexxus-v22-release-factory/config.json` BEFORE first agent dispatch. If the team exists, dispatch via `SendMessage`. If the team is missing (truly deleted, not just unread), recreate it with the full prescribed roster.

### Hard requirements before completion

- `/verify-scope` returns `PASS`.
- `/proof` returns `PASS` with two independent deltas of evidence.
- `/handoff` writes `.claude/session.md` and `memory/session-output.md`.

### Bypass markers (when operator has explicitly authorized)

- Bash blocked action: append `# APPROVED: <reason>` to the command.
- Edit blocked file: `mkdir -p .claude/state/scope && touch .claude/state/scope/<basename>.ok` before retrying. Marker auto-clears on first use.
- Stop hook escape: `touch .claude/state/skip-stop-check` (one-shot, auto-clears; use only after explicit operator approval).

### Completion gates (machine-checked by Stop hook)

If this session edits any non-handoff file, the Stop hook BLOCKS until ALL these markers exist for the current session:

| Marker | Required when | How to write |
|---|---|---|
| `verify-scope` | always | `mark-complete.sh verify-scope` after `scope-guardian` returns PASS |
| `proof` | always | `mark-complete.sh proof <evidence-path>` after `qa-evaluator` returns PASS with TWO deltas |
| `code-review` | always | `mark-complete.sh code-review` after `code-reviewer` returns APPROVE |
| `integration-safety` | external-provider files touched (`integrations`, `providers`, `safe-mcp`, `central-mcp`, `commgate`, `outbound`, `webhooks`, `signalwire`, `textmagic`, `resend`, `vapi`, `tavus`, `lago`, `coolify`) | `mark-complete.sh integration-safety` after `integration-safety` returns PASS |
| `launch-check` | launch-affecting files touched (triggers, appointments, outbound, reports, widget, conversations, sms, voice, adf, scheduler, schema) | `mark-complete.sh launch-check` after `nexxus-launch-captain` returns GO with operator authorization |

`mark-complete.sh` is at `/home/ubuntu/Claude-store/sysadmin/harness/bin/mark-complete.sh`.

Markers must reflect actual subagent verdicts for THIS session. Writing a marker preemptively, on a FAIL/BLOCK verdict, or recycled from a prior session is a discipline violation.

Plus: handoff (`/handoff`) must update `.claude/session.md` or `memory/session-output.md` after first edit.

### Two deltas of proof — minimum, NOT maximum

Every completed task requires:
- Delta 1: a runnable test/eval result (command + pass/fail + path).
- Delta 2: an independent observation (Playwright screenshot, log entry, DB row, network capture).

A single test run is one delta. You always need two. Higher testing levels (sprint / phase / pre-prod) require MORE evidence — see Testing Doctrine.

### Testing doctrine — required reading

`~/Claude-store/sysadmin/harness/TESTING_DOCTRINE.md` is the authoritative testing policy. Five levels (step / sprint / phase / pre-prod / post-prod), each with explicit scope, required tests, GUI requirement, and evidence layout. Completion claim must specify the testing level via `mark-complete.sh testing-level <level> [evidence-path]`. GUI testing via Playwright or Playwright MCP is MANDATORY at sprint-level and above for any user-facing change.

Nexxus eval entry points discovered 2026-04-26:
- `npm run test:e2e` (43 specs across 13 Playwright projects in `tests/e2e/`)
- `npm run test:e2e:list`
- `npx playwright test --project=workflow` (15 wf-*.spec.ts)
- `npx playwright test --project=visual` (timeout 180s)
- `node tests/pe-insights-03-eval.js` (Insights eval)
- `npx tsx server/comms-test.ts <fn>` (allowlisted-recipient comms)

Playwright MCP agents available (all real files in `.claude/agents/`): `playwright-test-planner`, `playwright-test-generator`, `playwright-test-healer`. Plus harness symlinks `nexxus-e2e-evaluator` and `qa-evaluator`.

### TEST-SAFETY MODEL (NEXXUS) — verified 2026-04-25

**Dev and live SHARE the same Supabase database.** Any mutating test fired from dev hits the live database. All 7 named org_admin accounts are real dealership admins. All 7 orgs have outbound flags enabled. `OUTBOUND_LIVE_ENABLED=true` and `ADF_MODE=live` on both deployments.

The model is **NOT "block all real sends"**. The model IS:

> **Allow real provider sends ONLY to approved internal/test destinations.**
> **Block any send whose recipient is a real customer or unapproved external party.**

### Autonomy ALLOWED after preflight (no per-action approval needed)

- Edit code within approved Nexxus launch/test scope (server/, harness/, evidence/, tests/) — UI files still require per-file scope marker
- Configure `TESTLANE_*` env vars in `.env` (operator's own `.env`)
- `pm2 restart nexxus-app` or `pm2 reload nexxus-app --update-env` (DEV ONLY) after presenting exact command + reason
- Run autonomous test scripts (`npx tsx server/comms-test.ts <fn>`) that target ONLY allowlisted destinations
- Check Resend / TextMagic / VAPI / Tavus logs / dashboards for proof
- Use Playwright MCP for full workflow testing on `localhost:5000`, `dev.huminicdev.com`, `live.huminic.app`
- Create test records clearly marked `[TESTLANE]` (campaigns, conversations, recipients, leads)
- Run `harness/bin/test-lane-reset.sh` DRY-RUN
- Run `harness/bin/test-lane-reset.sh --execute` when `TESTLANE_RESET_APPROVED=yes` is set

### STILL REQUIRES EXPLICIT APPROVAL

- Production deploy (`npm run build && pm2 restart nexxus-app` past dev — anything affecting `live.huminic.app`)
- Migration / schema change
- VIN `execute` write after `prepare → review`
- Adding or changing real customer recipients
- Enabling service campaigns for stores OTHER than `serra-honda`
- Sending to any non-allowlisted phone/email
- Changing live Coolify env (`phqqzjj5pal13wlp39m5ohx6-…` container)
- Restarting live Coolify container (any `docker restart` / `docker compose restart`)
- Force push or push to main
- Broad UI redesign (anything beyond approved per-file scope markers)

### Hard preconditions for any mutating action

1. Run `/home/ubuntu/Claude-store/sysadmin/harness/bin/test-safety-check.sh` and present the report. (`/preflight` does this automatically.)
2. Present a destination-classification table per `/preflight` (every send/call enumerated with category from the allowlist).
3. Verify each target via `test-orgs-allowlist-check.sh recipient <target>` (exit 0 + category) and `test-orgs-allowlist-check.sh org <slug>`.
4. If env changes are needed, present exact env vars + exact PM2 restart command + reason.
5. If the action requires explicit-approval per the list above, get operator chat confirmation.

Read-only login as a real org_admin (`serra_honda@huminic.ai` etc.) is acceptable. Mutating actions under those identities require per-action operator approval in chat.

### Service-campaign launch rule (NEXXUS) — operator decision 2026-04-25

Service-campaign capability may be IMPLEMENTED for all stores in code (Sprint 2.2), but **only `serra-honda`** ships it ENABLED for Monday Apr 27 launch. For all other orgs, service module flags (sms / phone / email / outbound at the per-module level) must default OFF until the operator authorizes per-store. Pre-launch verification requires two deltas of proof (DB snapshot + UI walk-through).

### Minimal-UI-change rule (NEXXUS) — BLOCKED by hook

UI changes require explicit operator approval. The hook `edit-scope-guard.sh` BLOCKS edits to:

- `client/src/pages/**`
- `client/src/components/**`
- `client/src/styles/**`
- `client/src/layouts/**`

Per-file bypass: `mkdir -p .claude/state/scope && touch .claude/state/scope/<basename>.ok` (one-shot, auto-clears).

The only pre-approved UI change categories per `plan.md` are:

- TeamBox section access (Sales / Service / Marketing submenus, only if data model supports)
- metric revision so visible metrics answer useful dealership questions

All other UI changes require additional operator approval, captured in `decisions.md` before work starts AND a per-file `.claude/state/scope/<basename>.ok` marker for each file.
