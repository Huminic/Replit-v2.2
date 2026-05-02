# P1 Agent Dispatch Packet — Sales-vs-Service Separation / Data Taxonomy

**Created:** 2026-05-01
**Owner:** main orchestrator (paste each block into a fresh top-level Claude session — DO NOT run them as subagents inside the orchestrator)
**Status:** PREPARED — not yet dispatched. Awaiting operator green light.
**Gate:** Phase 1 (P0 routing hotfix lifecycle) must be GREEN before any of these run.

---

## Why this exists

Repeated cascades of context pollution occurred on 2026-04-30 and 2026-05-01 when the orchestrator dispatched verification subagents inside its own session. Going forward: each focused investigation runs as a **separate, fresh Claude session**, reads its dispatch block from this file, writes findings to disk, and the orchestrator integrates from disk.

Each block below is self-contained. A fresh agent should be able to paste it as-is and produce the requested artifact without needing any prior chat context.

---

## Common boilerplate for every dispatched agent

**Read these first (in order):**
1. `/home/ubuntu/Claude-store/nexxus2.2_replit/CLAUDE.md`
2. `/home/ubuntu/Claude-store/nexxus2.2_replit/evidence/stabilization-sprint-2026-04-30/overnight-validation-report.md`
3. `/home/ubuntu/Claude-store/nexxus2.2_replit/evidence/stabilization-sprint-2026-05-01/tomorrow-plan.md`
4. `/home/ubuntu/Claude-store/nexxus2.2_replit/issues.md` (search for `I-NEW-2026-05-01-` and `BL-107`)
5. `/home/ubuntu/Claude-store/nexxus2.2_replit/backlog.md`
6. `/home/ubuntu/Claude-store/nexxus2.2_replit/shared/schema.ts` (entire file — schema is source of truth)

**Hard rules for every dispatched agent:**
- READ-ONLY. No `Write` to product code. No `Edit` of product code. Evidence files only.
- No `pm2 restart`, no `npm run build`, no DB writes, no provider sends.
- No `Agent` calls (no nested subagents). You are a leaf agent.
- No git pushes, no merges, no branch deletions.
- Do not modify `client/src/pages/`, `client/src/components/`, `server/services/`, `server/routes/`, `shared/schema.ts`, or any migration file.
- Stay inside `/home/ubuntu/Claude-store/nexxus2.2_replit/` (filesystem boundary per `~/.claude/hooks/file-boundary.sh`).
- If you discover a P0 production safety issue, STOP, document it at the top of your evidence file, and exit. Do not auto-remediate.

**Return format (every agent uses this skeleton):**
```markdown
# <Agent name> findings — 2026-05-01

## Scope of investigation
<one paragraph: what you looked at and what you deliberately did not look at>

## Findings (numbered)
### Finding N — <short title>
- **What:** <observation>
- **Where:** `path/to/file.ts:LINE` (and additional file:line refs)
- **Why it matters:** <user-visible / data-quality / multi-tenant implication>
- **Likely fix shape:** <one sentence — code chunk, config, schema, doc, etc.>
- **Effort estimate:** S / M / L
- **Risk if shipped wrong:** <user impact / data corruption / compliance>

## Proposed implementation chunks (in suggested order)
- Chunk A — <one focused PR scope, files touched, test plan, two deltas of proof>
- Chunk B — ...

## Proof needed before any chunk is approved
- <bullet list: which DB queries, which Playwright walks, which curl probes>

## Open questions for operator
- <numbered>

## Out of scope for this investigation
- <numbered — what you saw but deliberately did not pursue>
```

**Output paths (one file per agent):**
| Agent | Output file |
|---|---|
| 1. Reports | `evidence/stabilization-sprint-2026-05-01/p1-findings/01-reports.md` |
| 2. Metrics | `evidence/stabilization-sprint-2026-05-01/p1-findings/02-metrics.md` |
| 3. Marketing Insights | `evidence/stabilization-sprint-2026-05-01/p1-findings/03-marketing-insights.md` |
| 4. Schema / Data Classification | `evidence/stabilization-sprint-2026-05-01/p1-findings/04-schema-taxonomy.md` |
| 5. TeamBox Context | `evidence/stabilization-sprint-2026-05-01/p1-findings/05-teambox-context.md` |

The directory `evidence/stabilization-sprint-2026-05-01/p1-findings/` does not exist yet. Each agent must `mkdir -p` it before writing.

---

## Dispatch 1 — Reports Agent

**Subagent type for fresh session:** `general-purpose` (read-only)
**Output:** `evidence/stabilization-sprint-2026-05-01/p1-findings/01-reports.md`

**Prompt (paste verbatim):**

> You are a read-only investigator. Read the common boilerplate at the top of `evidence/stabilization-sprint-2026-05-01/p1-agent-dispatch-packet.md` and obey every rule there. Do not edit product code. Do not call subagents. Do not deploy. Stay inside `/home/ubuntu/Claude-store/nexxus2.2_replit/`.
>
> **Investigation focus:** Weekly and daily reports are mixing service traffic into sales totals.
>
> **Read first:**
> - `server/services/weeklyReportService.ts` (the whole file)
> - `server/services/dailyRecapService.ts` (the whole file)
> - `server/services/leadClassification.ts` if it exists; if not, search for `salesOnlyLeadIds`, `salesLeadIds`, `serviceLeadIds`, `department` server-side
> - `shared/schema.ts` `warehouse_leads` and `conversations` tables
> - `evidence/stabilization-sprint-2026-04-30/lane-1-sales-reports/` for the prior validation lane evidence
>
> **Specifically answer:**
> 1. Where in `weeklyReportService.ts` is the lead-volume tile computed? Does it apply a sales-only filter? If yes, on what column / heuristic?
> 2. Same question for the conversion-rate tile, the appointment tile, and any "sources" or "leaderboard" tile.
> 3. Same questions for `dailyRecapService.ts`.
> 4. What is the current heuristic for distinguishing sales vs service traffic? (Likely `lead_source LIKE '%service%'` or `vin_status` enum or absent.) Cite file:line.
> 5. Where in the report-rendering chain (server → email template → SMS template) does service data leak in? Identify every site.
> 6. What records are in the latest report payload that should not be there? Run a read-only DB query (NEVER an UPDATE/INSERT/DELETE) to find example service records that appeared in a recent sales report. Document the SQL and the result.
> 7. What does the operator-visible report email subject + body currently say? Is the wording honest about scope, or does it imply "sales-only" while including service?
>
> **Do not:**
> - Modify weeklyReportService.ts, dailyRecapService.ts, or any related file.
> - Send a real report (no `npx tsx server/comms-test.ts <fn>`).
> - Speculate about the schema fix — that is the Schema Agent's job. Stay in the consumer layer.
>
> **Deliverable:** `evidence/stabilization-sprint-2026-05-01/p1-findings/01-reports.md` in the return format above.

---

## Dispatch 2 — Metrics Agent

**Subagent type for fresh session:** `general-purpose` (read-only)
**Output:** `evidence/stabilization-sprint-2026-05-01/p1-findings/02-metrics.md`

**Prompt (paste verbatim):**

> You are a read-only investigator. Read the common boilerplate at the top of `evidence/stabilization-sprint-2026-05-01/p1-agent-dispatch-packet.md` and obey every rule there. Do not edit product code. Do not call subagents. Do not deploy. Stay inside `/home/ubuntu/Claude-store/nexxus2.2_replit/`.
>
> **Investigation focus:** The Insights surface is showing dishonest metrics (100% conversion, positional A+/A/B/C grades, hard-coded "flat" trends, mislabeled forecast).
>
> **Read first:**
> - `server/routes/insights.ts` (the whole file)
> - `server/vendorProxy.ts` lines 600–700 (the conversion rate computation site at `:641` and the dead VinSolutions Live branch at `:642`)
> - `server/services/lib-8` if a lifetime-win-rate computation exists there (search the codebase for `lifetimeWinRate`, `winRate`, `lifetime_win_rate`)
> - `client/src/pages/insights.tsx` (the consumer, but only to confirm what is rendered — do not propose UI changes)
> - `evidence/stabilization-sprint-2026-04-30/lane-4-metrics-honesty/` (overnight Lane 4 evidence)
> - `shared/schema.ts` `warehouse_metrics` table
>
> **Specifically answer:**
> 1. **Conversion rate (I-NEW-2026-05-01-C):** Why does it print 100%? Cite file:line. What computation feeds it? Does the lifetime win rate already exist at `lib-8`? If yes, what is the swap-in surface area?
> 2. **Top Lead Sources A+/A/B/C grades (I-NEW-2026-05-01-E):** Are the grades positional (just rank-by-volume) or comparative (statistical)? Cite `server/routes/insights.ts:129`. What would honest grading look like, and what data does it require?
> 3. **Pipeline forecast (same I-NEW-2026-05-01-E):** Is the value labeled "forecast" but actually a backward-looking soldCount? Cite the producer site and the consumer label. Is `warehouse_metrics.month_end_forecast` populated by anyone? If not, where would the producer live?
> 4. **Lead-source trend (same I-NEW-2026-05-01-E):** Cite `server/routes/insights.ts:138`. Is the trend hard-coded "flat"? What computation is needed for an honest trend, and is the underlying time-series data available?
> 5. **Sales/service contamination in metrics:** Do any of these metrics include service-channel records that should be excluded? Document each with file:line and a read-only DB query showing example contamination.
> 6. **`metricsAllZero` fallback:** How often does each insights endpoint hit the fallback path? Are the fallbacks honest (return zeroes / empty) or do they synthesize values?
>
> **Do not:**
> - Modify any file.
> - Run mutating SQL.
> - Propose UI changes (consumer-side display is out of scope here; flag it as a downstream dependency only).
>
> **Deliverable:** `evidence/stabilization-sprint-2026-05-01/p1-findings/02-metrics.md` in the return format above.

---

## Dispatch 3 — Marketing Insights Agent

**Subagent type for fresh session:** `general-purpose` (read-only)
**Output:** `evidence/stabilization-sprint-2026-05-01/p1-findings/03-marketing-insights.md`

**Prompt (paste verbatim):**

> You are a read-only investigator. Read the common boilerplate at the top of `evidence/stabilization-sprint-2026-05-01/p1-agent-dispatch-packet.md` and obey every rule there. Do not edit product code. Do not call subagents. Do not deploy. Stay inside `/home/ubuntu/Claude-store/nexxus2.2_replit/`.
>
> **Investigation focus:** The Marketing Insights tab is rendering Sales-pipeline insights instead of marketing-scoped data, because a role/category filter is not propagated to the embedded view.
>
> **Read first:**
> - `client/src/pages/insights.tsx` (the whole file — pay attention to `:407`)
> - `client/src/pages/marketing.tsx` lines 1–150 (tab routing context)
> - `client/src/lib/marketing-agents.ts`
> - `server/routes/insights.ts` for the API contract the embedded view consumes
> - `evidence/stabilization-sprint-2026-04-30/lane-3-marketing-inventory/`
>
> **Specifically answer:**
> 1. Where exactly does the role-category filter get constructed (`client/src/pages/insights.tsx:407` per current notes)? Trace its construction site and every consumer.
> 2. In embedded mode (Marketing Insights tab embedding the Insights view), is the filter passed through? Cite the prop / query-param / context surface that fails to propagate.
> 3. What user-visible mixing actually happens? List the specific cards / charts that render service or sales data when they should render marketing-scoped data.
> 4. What URL paths exhibit this? (`/marketing?tab=agents`, `/marketing?tab=insights`, etc.) Were any caught in the Lane-3 overnight walk?
> 5. Is `I-NEW-2026-05-01-F` (`/marketing?tab=agents` redirects out) the same root cause as `I-NEW-2026-05-01-A` (now patched via PR #6) or a separate issue? Examine `client/src/pages/marketing.tsx:67-79` to confirm.
> 6. What is the proposed minimal-surface-area fix? (Likely a single context prop or query-param plumb-through; do not redesign.)
>
> **Do not:**
> - Modify any file.
> - Propose a Marketing Insights redesign — only the filter-propagation fix.
>
> **Deliverable:** `evidence/stabilization-sprint-2026-05-01/p1-findings/03-marketing-insights.md` in the return format above.

---

## Dispatch 4 — Schema / Data Classification Agent

**Subagent type for fresh session:** `general-purpose` (read-only)
**Output:** `evidence/stabilization-sprint-2026-05-01/p1-findings/04-schema-taxonomy.md`

**Prompt (paste verbatim):**

> You are a read-only investigator. Read the common boilerplate at the top of `evidence/stabilization-sprint-2026-05-01/p1-agent-dispatch-packet.md` and obey every rule there. Do not edit product code. Do not call subagents. Do not deploy. Do not run migrations. Stay inside `/home/ubuntu/Claude-store/nexxus2.2_replit/`.
>
> **Investigation focus:** Determine the source-of-truth column(s) for sales-vs-service classification on `warehouse_leads`, and decide whether `BL-107 lead_type` needs to be added.
>
> **Read first:**
> - `shared/schema.ts` (whole file; specifically `warehouse_leads`, `conversations`, `appointments` if present)
> - `server/services/leadClassification.ts` if it exists
> - Every consumer of `data_source`, `lead_source`, `vin_status`, `lead_type`, `department` (search the codebase, both client and server)
> - `evidence/stabilization-sprint-2026-04-30/lane-2-teambox-taxonomy/` (overnight Lane 2 evidence)
> - `backlog.md` for `BL-107` if it has a real entry; if it does not, document that gap
>
> **Specifically answer:**
> 1. **Inventory:** What columns currently exist on `warehouse_leads` that could classify sales vs service? Cite each (`data_source`, `lead_source`, `vin_status`, etc.) with line refs in `shared/schema.ts`.
> 2. **Coverage:** For each candidate column, what fraction of rows are populated? Use a read-only DB query to enumerate distinct values and their row counts, scoped to the last 90 days. Document the SQL and the result.
> 3. **Reliability:** Are any of those columns reliable enough to be a sales-vs-service source of truth today? Specifically — does `lead_source LIKE '%service%'` or `vin_status` actually correlate with what a dealer would call a "service lead"?
> 4. **Gap:** If no existing column suffices, propose the `lead_type` enum (`sales` | `service` | `parts` | `unknown`?) — its values, its NULL semantics, its default for backfill, and which existing column(s) would feed the backfill.
> 5. **Migration risk:** What is the migration shape? `ALTER TABLE warehouse_leads ADD COLUMN lead_type ...` — what tables/views/queries would break or need updating? List them with file:line.
> 6. **BL-107 backlog status:** Does `BL-107` exist in `backlog.md` already? If not, what would the backlog entry look like (objective / scope / done-looks-like / constraints / tasks)?
> 7. **Source-of-truth recommendation:** Until `lead_type` exists (if it doesn't), what is the best-effort heuristic the consumer code (Reports, Metrics, TeamBox) should use? Document the exact predicate.
>
> **Do not:**
> - Run any DDL or DML. All SQL must be `SELECT` only.
> - Run `drizzle-kit push` or any migration tool.
> - Modify `shared/schema.ts` or any file.
>
> **Deliverable:** `evidence/stabilization-sprint-2026-05-01/p1-findings/04-schema-taxonomy.md` in the return format above.

---

## Dispatch 5 — TeamBox Context Agent

**Subagent type for fresh session:** `general-purpose` (read-only)
**Output:** `evidence/stabilization-sprint-2026-05-01/p1-findings/05-teambox-context.md`

**Prompt (paste verbatim):**

> You are a read-only investigator. Read the common boilerplate at the top of `evidence/stabilization-sprint-2026-05-01/p1-agent-dispatch-packet.md` and obey every rule there. Do not edit product code. Do not call subagents. Do not deploy. Stay inside `/home/ubuntu/Claude-store/nexxus2.2_replit/`.
>
> **Investigation focus:** Identify how P1 sales-vs-service separation will affect TeamBox taxonomy. **Do not redesign TeamBox.** This is a dependency-mapping investigation only.
>
> **Read first:**
> - `client/src/pages/teambox.tsx` (the whole file — pay attention to `:78-85` channel filters)
> - `shared/schema.ts` `conversations` table (`:86-109` per current notes)
> - `server/routes/conversations.ts` if it exists
> - `evidence/stabilization-sprint-2026-04-30/lane-2-teambox-taxonomy/`
> - The output of the Schema/Data Classification Agent (Dispatch 4) IF it has already been run; otherwise note its absence as a sequencing dependency
>
> **Specifically answer:**
> 1. **Current TeamBox taxonomy:** What buckets / channels / filters currently exist? List them.
> 2. **Data dependencies:** Which TeamBox bucket reads from which `conversations` column or `warehouse_leads` column? Cite file:line.
> 3. **Sales-vs-service intersection:** When P1 separates sales vs service in Reports/Metrics, what TeamBox surfaces will need a corresponding distinction? Identify each precisely (which tab, which filter, which list view).
> 4. **Dependency direction:** Does TeamBox need to wait for `lead_type` (Dispatch 4's recommendation) to ship, or can TeamBox use the same best-effort heuristic the consumers use today?
> 5. **Sub-D6 + I-NEW-2026-05-01-H:** Does the missing `video` and `form` channel filter (line 78–85) intersect with sales-vs-service separation, or is it independent?
> 6. **De-dup of VAPI voice rows (I-NEW-2026-05-01-I):** Does this intersect with sales-vs-service separation, or is it independent?
> 7. **AI role rendering (I-NEW-2026-05-01-J):** Same question.
>
> **Do not:**
> - Propose a TeamBox redesign.
> - Modify any file.
> - Speculate about TeamBox features that don't exist today.
>
> **Deliverable:** `evidence/stabilization-sprint-2026-05-01/p1-findings/05-teambox-context.md` in the return format above.

---

## After all 5 dispatches return

The orchestrator (next-context-Claude in main session) reads each output file from disk and produces:

1. **Synthesis document:** `evidence/stabilization-sprint-2026-05-01/p1-synthesis.md` — cross-cuts the 5 findings, identifies the minimal common shape (likely: ship `lead_type` first, then the consumers).
2. **Sequenced implementation plan:** ordered chunks (one focused PR per chunk), each with scope / files / tests / two deltas of proof.
3. **Operator approval request:** which chunk to implement first.

Only after operator approval does any product-code edit happen. No bundling. No same-session subagents at execution time either — implementation will use the same dispatch-packet pattern (separate fresh sessions for harness-backend / qa-evaluator / code-reviewer).

---

## Sequencing recommendation for operator

Run dispatches in this order (each in its own fresh Claude session):

1. **Dispatch 4 (Schema)** — first, because every other dispatch depends on knowing what classification is even possible.
2. **Dispatches 1, 2, 3 in parallel** — once Schema results are on disk, three consumers can be analyzed concurrently in three separate sessions.
3. **Dispatch 5 (TeamBox)** — last, because it explicitly depends on Dispatch 4's recommendation.

Total wall-clock: roughly 2 sequential rounds. No agent reads another agent's chat history; everything is via files on disk.
