# Lanes 4–8 Plan — Overnight 2026-04-30 → 2026-05-01

## Mode

Orchestrator-only. Operator-imposed standing order: NO product code edits, NO deploys, NO pushes, NO production config mutations, NO real-customer contact. Read-only + Test-Lane-only allowlisted contacts only.

## Lane scope

| Lane | Title | Owner | Output |
|---|---|---|---|
| 4 | Sales Reports verification | general-purpose subagent | `evidence/stabilization-sprint-2026-04-30/lane-4-sales-reports.md` |
| 5 | TeamBox Separation / Conversation Taxonomy | general-purpose subagent (UI via Playwright MCP) | `evidence/stabilization-sprint-2026-04-30/lane-5-teambox-taxonomy.md` |
| 6 | Marketing Functions + Agents | general-purpose subagent | `evidence/stabilization-sprint-2026-04-30/lane-6-marketing.md` |
| 7 | Metrics / Dashboard Honesty (lower priority) | general-purpose subagent | `evidence/stabilization-sprint-2026-04-30/lane-7-metrics.md` |
| 8 | Final stabilization handoff | orchestrator | `evidence/stabilization-sprint-2026-04-30/overnight-validation-report.md` + updated `.claude/session.md` + memory `session-output.md` |

## Hard guardrails (each subagent receives in its prompt)

- READ-ONLY ONLY: no edits to `server/`, `client/`, `shared/`, schema, env, config, or workflow files.
- No DB writes/deletes. No provider sends to non-allowlisted recipients. No `pm2 restart`, no `docker restart`, no `gh secret set`, no merges, no pushes.
- If a real-customer contact path is encountered, STOP and write `STOP-EVENT-<lane>-<ts>.md`.
- Allowed: read DB (read-only queries), read provider dashboards, read logs, read code, run `npx tsc --noEmit`, run `npx vitest run` on existing tests, exercise UI via Playwright MCP against `dev.huminicdev.com` or `localhost:5000` only with allowlisted accounts, write evidence files.
- Each subagent writes exactly one `lane-N-*.md` evidence file. Include an "Observations" section for incidental findings (the operator explicitly wants side-notes).

## Lane 4 — Sales Reports verification

**Objective:** validate that recent automated sales reports are healthy and correctly partitioned.

Checks:
1. Recent runs (read-only DB / cron / log): cadence, recipient counts, last successful run timestamp.
2. Recipient list correctness: per-org admins only, no cross-org bleed.
3. Data segregation: report bodies must contain ONLY sales leads, NO service records.
4. No accidental regenerate/resend during validation.
5. Source-of-truth: code path that builds the report, what data it pulls.
6. Any evidence of double-sends or empty/stale reports.

Output sections: Health verdict (GREEN/YELLOW/RED), Cadence + last run, Recipients per org, Sales-only proof, Code source-of-truth references, Observations.

## Lane 5 — TeamBox Separation / Conversation Taxonomy

**Objective:** map every conversation source/type currently dumped into TeamBox and propose sublanes/filters for separation work.

Checks (read DB via read-only query + UI walk via Playwright MCP):
1. Enumerate distinct conversation `type`/`source`/`channel` values.
2. For each: where does it land in TeamBox? Does the thread render all messages? Is direction clear? Is source/channel obvious to user?
3. Voice (VAPI), AI chat, widget, service campaign, trigger follow-up, inbound SMS, marketing — all categorized.
4. Identify mixing (where two distinct lanes share a thread or where source is ambiguous).
5. UI deltas required: minimum-viable separation (must-fix-before-customer-demo) vs nice-to-have.
6. Capture screenshots via Playwright MCP for each conversation source (anonymize phone numbers in evidence).

Output: current-state map, proposed sublane taxonomy, must-fix list, can-fix-after-launch list, screenshot paths, Observations.

## Lane 6 — Marketing Functions + Agents

**Objective:** discover and document marketing-related code, agents, routes, and UI surface area; produce a marketing section for the v2.2 docs.

Checks:
1. Grep for "marketing" across `server/`, `client/`, `shared/`, `tests/`.
2. Identify all marketing-related routes, services, schedulers, AI agents, prompt templates.
3. Identify marketing UI pages and what they do today.
4. Identify DB tables/columns marketing-flagged.
5. Capture how marketing campaigns differ from service campaigns and from trigger follow-ups.
6. Document gaps (planned-but-not-shipped, dead code, stubs).
7. Walk marketing UI with Playwright MCP if any page is reachable; screenshot.

Output: Marketing inventory (routes / services / agents / UI / DB), differentiation from service+triggers, gap list, screenshot paths, Observations.

## Lane 7 — Metrics / Dashboard Honesty (lower priority)

**Objective:** produce a map of every visible metric/insight on dashboards and grade each on whether the underlying data path is real, partial, mocked, or stale.

Checks:
1. Walk dashboard / insights / TeamBox metrics via Playwright MCP.
2. For each visible metric: identify code path that produces the value, then walk it back to the data source.
3. Grade: REAL (live DB, correct math), PARTIAL (live data but math has known caveats), MOCKED (hard-coded / stubbed), STALE (cached without invalidation).
4. Note metrics that LOOK like they should answer a useful dealership question but don't.
5. Suggest replacement metrics where the current ones are dishonest.

Output: Metrics map table (name / location / grade / source-of-truth / dealership-utility), top 5 dishonest metrics, suggested replacements, screenshot paths, Observations.

## Lane 8 — Final stabilization handoff (orchestrator)

After lanes 4–7 return:
1. Synthesize each lane's evidence into `overnight-validation-report.md` per the existing overnight plan structure.
2. Update `.claude/session.md` with findings + standing-order reminder.
3. Update `memory/session-output.md` for next-context-Claude.
4. Save tomorrow's plan to `evidence/stabilization-sprint-2026-05-01/tomorrow-plan.md` capturing:
   - Lane verdicts
   - Top blocker(s)
   - Top non-blocking debt
   - Recommended next 5 actions
   - Pending operator decisions carried forward
5. Confirm no-push / no-deploy.

## Wakeup discipline

If a lane subagent returns and I still have work to do, I continue immediately. If all lanes return clean and only synthesis remains, I do it inline.
