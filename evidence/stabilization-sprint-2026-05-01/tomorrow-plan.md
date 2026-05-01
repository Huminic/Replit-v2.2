# Tomorrow's Plan — 2026-05-01

## Context

Overnight validation 2026-04-30 → 2026-05-01 ran 4 read-only lanes (Sales Reports, TeamBox taxonomy, Marketing inventory, Metrics honesty). Full report at `evidence/stabilization-sprint-2026-04-30/overnight-validation-report.md`.

**No production outage.** Live posture is stable post-chunk-5. The findings are post-launch quality issues, not blockers.

Standing order from operator: no deploys / pushes / code edits unless a production outage is found AND operator explicitly approves the specific remediation.

## Suggested priority queue

### P0 — User-facing reliability (do these first if green-lit)

1. **Routing redirect trap (I-NEW-2026-05-01-A).** Reproducible across `/teambox`, `/sales`, `/insights`, `/marketing`, `/management`. Suspected interaction between `client/src/components/SubMenuManager.tsx` hover handlers and tab-URL effects. One focused investigation + likely a single-PR fix. Affects EVERY user.

2. **Marketing tab routing (I-NEW-2026-05-01-F).** Same root cause likely. `/marketing?tab=agents` redirects out. `marketing.tsx:67-79` is one suspect site.

### P1 — Customer-visible metric honesty

3. **Conversion rate prints 100% (I-NEW-2026-05-01-C).** Replace with the lifetime win rate already computed at `lib-8`. `server/vendorProxy.ts:641`, `server/routes/insights.ts:113,238`.

4. **Top Lead Sources A+/A/B/C is positional (I-NEW-2026-05-01-E).** `server/routes/insights.ts:129`. Replace with real comparative grade or remove the letter and show counts only.

5. **Pipeline forecast is backward-looking soldCount (same I-NEW-2026-05-01-E).** `server/routes/insights.ts` — relabel as "30-day sold" until `warehouse_metrics.month_end_forecast` is actually populated, OR fix the producer.

6. **Lead-source trend hard-coded "flat" (same I-NEW-2026-05-01-E).** `:138`. Compute or remove.

7. **Sales activity feed dominated by `sync_delta_completed` (I-NEW-2026-05-01-D).** Filter `userId IS NULL` server-side. `client/src/lib/activity-utils.ts:47` consumer also.

### P2 — Sales-vs-service hygiene

8. **Weekly report applies `salesOnlyLeadIds` filter (I-NEW-2026-05-01-B).** `weeklyReportService.ts:479` — operator decides: filter immediately with current best-effort `department` heuristic, OR wait for `lead_type` column on `warehouse_leads` (BL-107 needs a real backlog entry). The current state inflates lead-volume tiles with service traffic.

9. **Marketing Insights tab — apply marketing role-category filter to embedded mode (I-NEW-2026-05-01-G).** `client/src/pages/insights.tsx:407` filter exists but isn't passed through. Currently the Marketing tab renders Sales-pipeline insights.

### P3 — TeamBox demo-quality fixes

10. **Add `video` and `form` to `channelFilters` (I-NEW-2026-05-01-H).** `client/src/pages/teambox.tsx:78-85`. Channels are produced; user can't filter on them.

11. **De-duplicate VAPI voice rows (I-NEW-2026-05-01-I).** They appear in both Conversations and Phone tabs.

12. **Render AI roles distinctly (I-NEW-2026-05-01-J).** `agent` / `assistant` / `bot` / `system` should have visual distinction from human staff replies.

### P4 — Multi-tenant safety + producer fixes

13. **Org context silently switches (I-NEW-2026-05-01-K).** Reproduce, root-cause, add a confirmation or block.

14. **`warehouse_metrics` writer (I-NEW-2026-05-01-L).** Either remove the consumer fallbacks OR stand up the producer. Currently every insights endpoint hits its `metricsAllZero` fallback.

15. **Dead "VinSolutions Live" branch (I-NEW-2026-05-01-M).** `server/vendorProxy.ts:642` hard-codes source. Remove the branch or make the source meaningful.

### P5 — Decision items

16. **Marketing-campaign UI** (Lane 6 gap). Backend complete. UI doesn't exist. Operator decides whether to build it now or defer.

17. **TextMagic dashboard signing posture (I-NEW-2026-04-30-E).** Verify whether TextMagic dashboard has a signing secret configured. If yes — set matching value on both sides and remove relaxed-verify. If no — accept relaxed-verify as permanent and document.

## Process for tomorrow

1. **Triage.** Operator reviews `overnight-validation-report.md` and decides which items to action.
2. **For each operator-approved item:** dispatch `harness-orchestrator` → scope-guardian → harness-backend (or harness-frontend with explicit per-file UI scope marker) → qa-evaluator → code-reviewer → completion markers.
3. **Hard gates:** `/preflight`, `/verify-scope`, `/proof`, two deltas of evidence, `/handoff`.
4. **No bundling.** Each item is a focused PR. Bundling caused the chunk-2B → chunk-3 → chunk-4 → chunk-5 cascade on 2026-04-30.

## Pending operator decisions (carried forward)

1. TextMagic dashboard signing-posture verification.
2. SLACK_WEBHOOK_URL repo secret for deploy.yml failure notifications.
3. HOTFIX_VAPI_WEBHOOK_SECRET / HOTFIX_TEXTMAGIC_WEBHOOK_SECRET cleanup.
4. Test conversation row cleanup (also: stale id `5ecf6c84-…` in plan brief — cleanup or retag).
5. Bearer-token rotations (vin-safe-mcp / dax-mcp / n8n-hyperbridge / Coolify).
6. Service-campaign per-store flags — Serra Honda only at launch.
7. TextMagic 3-number classification in `test-recipients.txt`.
8. Pre-flight synthetic-probe step for `deploy.yml` (deferred until TextMagic signing posture clarified).
9. **NEW:** sales-vs-service segregation strategy (filter now vs wait for `lead_type` column).
10. **NEW:** marketing-campaign UI scope.
11. **NEW:** which dishonest-metric fixes the operator approves vs which we just remove from view.

## Files of interest tomorrow

- `client/src/components/SubMenuManager.tsx` — routing redirect suspect
- `client/src/pages/marketing.tsx:67-79` — tab routing
- `client/src/pages/teambox.tsx:78-85` — channel filters
- `client/src/pages/sales.tsx:686-700` — activity feed
- `client/src/pages/insights.tsx:407` — embedded role-category filter
- `client/src/lib/activity-utils.ts:47` — activity rendering
- `client/src/lib/marketing-agents.ts` — client-side agent definitions
- `server/services/weeklyReportService.ts:469,479` — sales-only filter
- `server/services/dailyRecapService.ts` — daily recap (operator opt-in)
- `server/routes/insights.ts:113,129,138,238` — dishonest metrics
- `server/vendorProxy.ts:641-642` — conversion rate source, dead-code branch
- `shared/schema.ts:86-109` — conversation schema (no source/type/department/direction)
