# Reports findings — 2026-05-01

## Scope of investigation

Trace where `weeklyReportService.ts` and `dailyRecapService.ts` mix service traffic into sales-only totals. Identify every leak site (lead-volume tile, conversion / appointment / leaderboard tiles, render chain, email subject), confirm the magnitude with read-only SQL against the most recent weekly send window (Monday 2026-04-27, weekStart=2026-04-20 12:02 UTC, weekEnd=2026-04-27 12:02 UTC), and propose the minimum-surface-area fix that wires the Dispatch-1 predicate (`!isServiceLead(vinStatus)` from `server/statusClassifier.ts`) into the report pipeline. Read-only. No edits, no provider sends, no DB writes.

## TL;DR

1. **Weekly report does NOT segregate sales vs service.** The opt-in `salesOnlyLeadIds: Set<string>` plumbing exists but no production caller sets it. `sendWeeklyReportProduction` (`weeklyReportService.ts:3937, 4012`) calls `buildWeeklyReport(orgId, weekStart, weekEnd)` with no `opts`. `runWeeklyReportScheduler` (`scheduler.ts:392, 465`) passes only `{ safetyBcc }`. Default behavior, per author's comment at `weeklyReportService.ts:469`: **"counts include service + parts leads as before."**
2. **Eight distinct leak sites in `weeklyReportService.ts`** (lead-volume, status-breakdown, leaderboard prior-week, narrative chunks, source winners/losers, fastest-action list, ghosted/stalled lists, 30-day active count). Every site reads the unfiltered `leadsInWindowRaw`/`statusRowsThisWeekRaw`/prior-week query.
3. **Dispatch-1 predicate (`vin_status NOT LIKE 'SERVICE%'` / `!isServiceLead`) does NOT plug into the existing `salesOnlyLeadIds` plumbing cleanly.** That plumbing keys on `warehouse_leads.source_id` and was anticipating a live VIN API classification pass. Recommended: **delete the Set-based plumbing and replace with the SQL predicate at every query site, plus a single in-memory filter for arrays already in scope**. Reuse `isServiceLead` from `server/statusClassifier.ts:47` — the existing single source of truth.
4. **`dailyRecapService.ts` already segregates correctly** via `vs.startsWith("SERVICE")` at `:104` and the explicit exclude list at `:106-115`. Reports two separate fields (`newSalesLeads`, `newServiceLeads`) in the recap email (`notificationService.ts:867-868`). No leak. Two minor robustness gaps noted in Finding 9.
5. **The render chain leaks service through every tile** that consumes `data.leadsReceivedThisWeek`, `data.ghostedLeads`, `data.singleFollowupLeads`, `data.over48hCount`, `data.leadsBySource*`, `data.leadStatusBreakdown`, `data.lostBadLeadCount`, `data.score30DayActive`. Plus the report **subject** (`weeklyReportService.ts:4081`) reads "AI Dealership Performance Analysis" with no scope qualifier.
6. **Last week's send (Mon 2026-04-27) leaked between 17.3% and 38.7% of all `vin_created_at`-windowed rows as service.** Confirmed by aggregate SQL below (Finding 7). Tony Serra Ford was 38.7% inflated.
7. **No conversion-rate tile, no appointment tile, no salesperson-leaderboard tile exists** in the current weekly-report layout (rev-6 / v8). The leaderboard equivalent is "Lead Source Performance / Winners + Biggest Losers" — a `leadSource`-grouped trend, not a salesperson list. So leak surfaces are all lead-volume-derived; conversion-rate is N/A. (See Finding 5.)

## Findings

### Finding 1 — Production weekly-report path bypasses the sales-only filter entirely

- **What:** `sendWeeklyReportProduction(orgId, opts)` is the sole production caller and ignores `salesOnlyLeadIds`. `buildWeeklyReport` is invoked with no `opts`. Result: every weekly tile + list includes `SERVICE_*` rows.
- **Where:**
  - `server/services/weeklyReportService.ts:3937-3940` — signature accepts only `{ safetyBcc?, weekEnd? }`, no salesOnly hook.
  - `server/services/weeklyReportService.ts:4012` — `const built = await buildWeeklyReport(orgId, weekStart, weekEnd);` (3-arg call, no opts).
  - `server/services/scheduler.ts:465` — `const result = await send(org.id, { safetyBcc });`
  - `tests/integration/weeklyReport.send-live.test.ts:369` — `buildWeeklyReport(org.id, start, end)` (3-arg call too).
- **Why it matters:** Weekly executive report shipped to all 5 dealerships every Monday includes service leads in every metric. Operator was unaware until Lane 4 (overnight 2026-04-30) flagged it.
- **Likely fix shape:** Apply the predicate inside `buildWeeklyReport` itself (default-on); remove the opt-in `salesOnlyLeadIds` plumbing entirely. Single source of behavior, no caller-by-caller toggle.
- **Effort:** M.
- **Risk if shipped wrong:** Medium. Many query sites; the predicate must be applied uniformly or the report goes inconsistent (service rows in some tiles but not others).

### Finding 2 — Weekly lead-volume tile leak (`leadsInWindowRaw` is unfiltered)

- **What:** The "Leads This Week" tile (`leadsReceivedThisWeek = leadsInWindow.length`) reads ALL `vin_status` values, including `SERVICE_*`. The `leadsInWindow` array is also the source for: `leadsWithPhone` → ghosted/stalled/untouched lists, `bySourceThisWeek` map → leaderboard winners/losers, `over48hCount`, `score30DayActive` (when sales filter active).
- **Where:**
  - `weeklyReportService.ts:870-881` — Drizzle SELECT with no `vin_status` filter.
  - `weeklyReportService.ts:886-888` — opt-in filter (Set-based, never set in prod).
  - `weeklyReportService.ts:1212` — `leadsReceivedThisWeek = leadsInWindow.length` (the lead-volume tile value).
- **Why it matters:** This is the single largest leak surface. Every downstream tile inherits the contamination.
- **Likely fix shape:** Append `sql\`${warehouseLeads.vinStatus} NOT LIKE 'SERVICE%'\`` (or equivalent `not(isServiceLead-style)` predicate) to the `where(and(...))` block at `:874-880`. Drop the `salesIds`-based filter at `:886-888`.
- **Effort:** S (one query, one predicate).
- **Risk:** Low — predicate is proven in `storage.ts:823, 887`.

### Finding 3 — Lead-status-breakdown tile leak (`statusRowsThisWeekRaw`)

- **What:** The "Lead Status" panel renders `Active / Sold / Lost / Bad / Complete` chips and a "Lost - Bad Lead" featured card. It reads a separate query that pulls `vinStatus` for all rows in week (no SERVICE filter). The `classifyForStatusBreakdown` helper at `:813-830` returns `null` for `SERVICE_*` (they don't classify into any visible bucket), so service rows are silently dropped from the 5-chip row — but they **still inflate the LOST_BAD_LEAD count if the row's `vinStatus` is exactly `LOST_BAD_LEAD`** (none observed in production data with `SERVICE_*` AND `LOST_BAD_LEAD`, but the predicate is conceptually loose).
- **Where:**
  - `weeklyReportService.ts:1860-1874` — the unfiltered status-breakdown query (no `vin_status NOT LIKE 'SERVICE%'`).
  - `weeklyReportService.ts:1875-1878` — opt-in filter (never set in prod).
  - `weeklyReportService.ts:1894-1903` — `classifyForStatusBreakdown` discards SERVICE silently; `LOST_BAD_LEAD` count is independent.
  - `weeklyReportService.ts:1912-1932` — prior-week LOST_BAD_LEAD count, also unfiltered.
- **Why it matters:** Operationally low (status breakdown drops SERVICE_* via classifyForStatusBreakdown), but the prior-week comparison and the Lost-Bad-Lead featured card both read from the same unfiltered query. Consistency requires applying the predicate at the query layer.
- **Likely fix shape:** Same predicate added to both the this-week and prior-week status-row queries.
- **Effort:** S.
- **Risk:** Low.

### Finding 4 — Leader­board / leadsBySource leak (this-week + prior-week)

- **What:** The "Lead Source Performance" panel groups leads by `lead_source` URL → name. It reads `bySourceThisWeek` from the unfiltered `leadsInWindow` and `bySourcePriorWeek` from a separate unfiltered prior-week query. Service rows show up as the same `id/7098` URL across all 5 orgs (per Dispatch 1, Finding 5). When VIN's `vin_get_lead_sources` resolves `7098` to a name like "Service Form", that line item appears in Winners or Biggest Losers tables.
- **Where:**
  - `weeklyReportService.ts:1214-1219` — `bySourceThisWeek` built from unfiltered `leadsInWindow`.
  - `weeklyReportService.ts:1223-1233` — `priorWeekLeads` Drizzle SELECT with no `vin_status` filter.
  - `weeklyReportService.ts:1234-1237` — `bySourcePriorWeek`.
  - `weeklyReportService.ts:1259-1290` — name-bucket merge → `leadsBySource` → `leadsBySourceWinners` / `leadsBySourceBiggestLosers`.
  - `weeklyReportService.ts:2021-2030` — winners + biggest-losers slicing.
  - `weeklyReportService.ts:3417-3418` — render of "Winners vs Last Week" and "Biggest Losers — Top 5 Drops vs Last Week".
- **Why it matters:** The leaderboard misrepresents performance: a service-only source like `id/7098` competes for "Winners vs Last Week" against actual sales sources. Last week (Apr 27 send), every org had exactly 1 service-only `lead_source` URL feeding this leak (SQL in Finding 7, panel "Distinct service-only sources").
- **Likely fix shape:** Apply predicate to BOTH the in-memory iteration (already covered if `leadsInWindow` is filtered per Finding 2) AND the explicit `priorWeekLeads` SELECT at `:1223-1233`.
- **Effort:** S.
- **Risk:** Low.

### Finding 5 — No conversion-rate / appointment / salesperson-leaderboard tile exists today

- **What:** Section 7.3 questions referenced "conversion-rate tile", "appointment tile", "sources/leaderboard tile". The current weekly-report layout (rev-6 / v8) does **not** render a conversion-rate tile, does **not** render an appointment-volume tile, and does **not** render a salesperson leaderboard. The only "leaderboard" surface is the source-grouped Winners + Biggest Losers (Finding 4). No conversion ratio is calculated anywhere in `buildWeeklyReport`.
- **Where:**
  - `weeklyReportService.ts:3315-3344` — KPI dashboard row (score + 4 mini tiles): "Sales Team Score" / "Leads This Week" / "Ghosted Leads" / "Over 48 Hours" / "30-Day Active Leads". No conversion / appointment.
  - `weeklyReportService.ts:3091-3099` — 4-chip "Lead Issues" row: "No First Reply" / "48+ Hours" / "Stalled Leads" / "Inbound Calls". No conversion / appointment.
  - `weeklyReportService.ts:3248-3255` — 3-chip "AI Actions" row: "Notifications Sent" / "ADF Deliveries" / "Automation Triggers". No conversion / appointment.
  - No occurrence of `conversion`, `convert`, `winRate`, `closeRate`, `appointmentTile`, `salesperson` in the file.
- **Why it matters:** The questions in Section 7.3 partially don't apply. Confirming this so Batch 1 doesn't try to "fix" tiles that don't exist. If the operator wants conversion-rate or appointment tiles, that's separate work (Dispatch 3 covers the broader Insights surface).
- **Likely fix shape:** N/A — no leak because no tile exists. Document and move on.
- **Effort:** N/A.
- **Risk:** None.

### Finding 6 — `dailyRecapService.ts` already segregates correctly; minor robustness gaps

- **What:** Daily recap splits sales vs service correctly via prefix-based classification. Renders two separate fields in the recap email.
- **Where (already correct):**
  - `dailyRecapService.ts:91-119` — `vs.startsWith("SERVICE")` → `newServiceLeads`; explicit excludes (`LOST`, `SOLD`, `BAD`, `DUPLICATE`, `NON_CUSTOMER_INITIATED_LEAD`) → `newSalesLeads`.
  - `notificationService.ts:850-851, 867-868` — `DailyRecapEmailData.newSalesLeads` and `newServiceLeads` rendered as separate "New sales leads" / "New service leads" rows.
  - `notificationService.ts:884-886` — summary line uses `newSalesLeads + customerReplies + callsReceived === 0` for the "Quiet day" branch (correctly excludes service from "active" check).
- **Minor robustness gaps:**
  1. `dailyRecapService.ts:104` uses `vs.startsWith("SERVICE")` (no underscore). Catches `SERVICE_*` family AND any future literal `SERVICE` value. Aligns with `statusClassifier.ts:20` (`upper.startsWith('SERVICE_')`) only because no `SERVICE` literal value is observed today. Low risk; recommend swap to `isServiceLead(vs)` for SSoT.
  2. `dailyRecapService.ts:108-109` checks `!vs.startsWith("LOST")` AND `vs !== "lost"`. The classifier at `statusClassifier.ts:16` accepts `upper.startsWith('LOST_')` (with underscore). The recap is more inclusive (catches `LOST` as a prefix without `_`). Likely correct; aligns with the existing exclude list. Low risk.
  3. The `else if` chain at `:106-117` returns `0` salesLeads for `vinStatus IS NULL` (no name resolution). Compared to the recommended predicate `!isServiceLead(null) === true`, the recap is stricter (NULL → not sales). Recommend leaving as-is; the recap's "5 specific exclude rules" are the canonical reference.
- **Likely fix shape:** Swap raw `vs.startsWith("SERVICE")` → `isServiceLead(vs)` for SSoT; do not change exclude semantics.
- **Effort:** S (one-line refactor).
- **Risk:** Low.

### Finding 7 — Read-only SQL: confirmed leak in last weekly report (Mon 2026-04-27)

**Window:** `vin_created_at >= '2026-04-20 12:02:00+00' AND vin_created_at < '2026-04-27 12:02:00+00'` — corresponds to the Monday 2026-04-27 firing window (`weekStart = weekEnd − 7d`, where `weekEnd = new Date()` at scheduler-fire time, observed at `~12:02 UTC` for the 3 Chicago-tz orgs and `~11:02 UTC` for the 2 NY-tz orgs; rounded to 12:02 for a single comparable window across orgs).

```sql
-- Per-org service-leak share in the most recent weekly-report window
WITH wk AS (
  SELECT organization_id, vin_status, lead_source
  FROM warehouse_leads
  WHERE vin_created_at >= TIMESTAMPTZ '2026-04-20 12:02:00+00'
    AND vin_created_at <  TIMESTAMPTZ '2026-04-27 12:02:00+00'
)
SELECT organization_id,
       COUNT(*) FILTER (WHERE vin_status LIKE 'SERVICE%') AS service_inflating,
       COUNT(*)                                          AS total,
       ROUND(100.0 * COUNT(*) FILTER (WHERE vin_status LIKE 'SERVICE%') / NULLIF(COUNT(*),0), 1) AS service_pct
FROM wk
GROUP BY organization_id
ORDER BY service_pct DESC;
```

**Result (aggregate counts only — no PII):**

| organization_id | org slug | service_inflating | total | service_pct |
|---|---|---|---|---|
| `2cbf687f-…` | tony-serra-ford | 29 | 75 | **38.7%** |
| `6ae2548b-…` | ford-of-columbia | 154 | 547 | **28.2%** |
| `24d64f99-…` | serra-honda | 37 | 160 | **23.1%** |
| `4a23d5ad-…` | serra-nissan | 25 | 113 | **22.1%** |
| `f18cbf4e-…` | hyundai-of-columbia | 125 | 723 | **17.3%** |

**Status sub-distribution (which `SERVICE_*` values leaked):**

```sql
SELECT o.slug AS org, w.vin_status, COUNT(*) AS n
FROM warehouse_leads w
JOIN organizations o ON o.id = w.organization_id
WHERE w.vin_created_at >= '2026-04-20 12:02:00+00'
  AND w.vin_created_at <  '2026-04-27 12:02:00+00'
  AND w.vin_status LIKE 'SERVICE%'
GROUP BY o.slug, w.vin_status
ORDER BY o.slug, n DESC;
```

| org | vin_status | n |
|---|---|---|
| ford-of-columbia | SERVICE_APPOINTMENT_SCHEDULED | 152 |
| ford-of-columbia | SERVICE_COMPLETE | 2 |
| hyundai-of-columbia | SERVICE_APPOINTMENT_SCHEDULED | 123 |
| hyundai-of-columbia | SERVICE_COMPLETE | 2 |
| serra-honda | SERVICE_APPOINTMENT_SCHEDULED | 37 |
| serra-nissan | SERVICE_APPOINTMENT_SCHEDULED | 25 |
| tony-serra-ford | SERVICE_APPOINTMENT_SCHEDULED | 29 |

**Distinct service-only `lead_source` URLs feeding the leaderboard leak (Finding 4):**

```sql
SELECT o.slug AS org,
       COUNT(DISTINCT w.lead_source) FILTER (WHERE w.vin_status LIKE 'SERVICE%') AS service_distinct_sources,
       COUNT(DISTINCT w.lead_source)                                              AS total_distinct_sources_in_window
FROM warehouse_leads w JOIN organizations o ON o.id=w.organization_id
WHERE w.vin_created_at >= '2026-04-20 12:02:00+00' AND w.vin_created_at < '2026-04-27 12:02:00+00'
GROUP BY o.slug ORDER BY o.slug;
```

| org | service_distinct_sources | total_distinct_sources_in_window |
|---|---|---|
| ford-of-columbia | 1 | 50 |
| hyundai-of-columbia | 1 | 64 |
| serra-honda | 1 | 30 |
| serra-nissan | 1 | 26 |
| tony-serra-ford | 1 | 27 |

**Confirms `isServiceLead(vinStatus)` would have correctly excluded all of them.** Every leaked row is `vin_status = 'SERVICE_APPOINTMENT_SCHEDULED'` or `'SERVICE_COMPLETE'`; both classify as `service` per `statusClassifier.ts:20`. None of the leaked rows have ambiguous status (no NULLs, no lowercase). The predicate `!isServiceLead(vs)` would have removed exactly the rows in the table above and only those rows.

### Finding 8 — Subject + body honest about scope?

- **What:** The report subject and body do NOT explicitly claim "sales-only" scope, but the user-facing tiles imply it. There is no scope qualifier anywhere.
- **Where:**
  - `weeklyReportService.ts:4081` — Subject: `"🚗 AI Dealership Performance Analysis — {orgName} — week ending {weekEndDate}"`. Generic; no "sales".
  - `weeklyReportService.ts:3306-3311` — Hero: store name, "AI Dealership Performance Analysis", "Week ending {date}". Generic.
  - `weeklyReportService.ts:3325-3329` — Lead-volume tile: defaults to "Leads This Week" / "New leads that came into VIN Solutions". Switches to "Sales Leads This Week" / "New sales leads that came into VIN Solutions" only when `data.salesFilterActive === true` — which never happens in production today.
  - `weeklyReportService.ts:3094` — "No First Reply" chip — implicitly a sales/customer concern.
  - `weeklyReportService.ts:3338` — "30-Day Active Leads" — uses `vinStatus LIKE 'ACTIVE_%'` (DB-level, `:1969`) which excludes SERVICE_* automatically. **This one tile is honest by accident — the predicate is `'ACTIVE_'`-prefix, not `'NOT SERVICE_'`-prefix.**
  - `weeklyReportService.ts:1505, 1503-1513, 1641-1671` — Score commentary, "What This Week Says", "Main Issue" line — all use `ghostedLeads.length`, `over48hCount`, etc., which are derived from contaminated `leadsInWindow`. The text says "lead", not "sales lead".
- **Why it matters:** The dealer manager reading the email assumes "Leads This Week" means "sales leads". The label is honest only when filtered. Today the label is "Leads This Week" but counts include service. This is dishonest by omission.
- **Likely fix shape:** When the predicate is applied default-on (Finding 2), label MUST flip to "Sales Leads This Week" by default, removing the `data.salesFilterActive` conditional and making "Sales" the un-conditional copy. Subject line should also gain "Sales" qualifier: `"🚗 AI Dealership Sales Performance — {orgName} — week ending {date}"` OR keep the generic title and rely on tile labels — operator decision.
- **Effort:** S (3-5 lines of copy).
- **Risk:** Low.

### Finding 9 — Render-chain leak inventory (every consumer of contaminated data)

- **What:** When `leadsInWindow`, `bySourceThisWeek`, `priorWeekLeads`, `statusRowsThisWeek`, `priorStatusRows`, `priorLeadsInWindow` are unfiltered, the contamination propagates through the entire render. Listing every site for completeness.
- **Where (server-side render → email HTML):**

| Tile / chip / list | Source field on `WeeklyReportData` | Producer site | Renderer site |
|---|---|---|---|
| Lead-volume tile ("Leads This Week") | `leadsReceivedThisWeek` | `:1212` | `:3325-3332` |
| Ghosted Leads chip | `ghostedLeads.length` | `:1019-1051` (via `:1016 leadsWithPhone`) | `:3094, 3333` |
| 48+ Hours chip | `over48hCount` | `:1473` (via ghostedLeads) | `:3095, 3336` |
| Stalled Leads chip | `singleFollowupLeads.length` | `:1155-1193` (note: stalled is conversation-derived; only contaminated transitively via `warehouseByKey` name lookup, lower contamination but still present) | `:3096` |
| 30-Day Active Leads tile | `score30DayActive` | `:1953-1973` (DB-level `'ACTIVE_'` prefix — already honest by accident) | `:3337` |
| Customer Follow-Up Lists (Ghosted left col) | `ghostedLeads[]` | as above | `:3122-3133, 3387-3391` |
| Customer Follow-Up Lists (Stalled right col) | `singleFollowupLeads[]` | as above | `:3145-3156, 3392-3396` |
| Lead Source Winners | `leadsBySourceWinners[]` | `:2021-2024` (from `leadsBySource` `:1282`) | `:3191-3193, 3417` |
| Lead Source Biggest Losers | `leadsBySourceBiggestLosers[]` | `:2027-2030` | `:3195-3197, 3418` |
| What This Week Says narrative | `narrativeWeekSays` | `:2047-2104` (mentions `leadsReceivedThisWeek`, `ghostedLeads.length`) | `:2990-2995, 3351` |
| What Moved narrative | `narrativeWhatMoved` | `:2107-2126` (Winners + Losers names) | `:2997, 3429` |
| Simple Read bullets | `simpleReadBullets[]` | `:2129-2144` | `:3260-3270, 3405` |
| Score-card "Main issue" | `scoreCardLines.mainIssueLine` | `:1642-1655` (uses `ghostedCount`/`stalledCount`) | `:3031-3032` |
| Score-card "What to do first" | `scoreCardLines.whatToDoFirstLine` | `:1657-1672` | `:3032` |
| Lead Status Breakdown chips | `leadStatusBreakdown.{active,sold,lost,bad,complete}` | `:1880-1903` (note: SERVICE silently dropped via `classifyForStatusBreakdown`) | `:3471-3486` |
| Lost-Bad-Lead featured card | `lostBadLeadCount`, `lostBadLeadPriorWeek` | `:1900-1903, :1928-1931` | `:3458-3460` |
| Sales Team Score | `salesScore.score`, `salesScore.commentary`, `salesScore.breakdown` | `:1483-1516` | `:3025, 3030-3034` |
| KPI arrows | `kpiArrows.*` | `:1998-2008` (delta of contaminated this-week vs contaminated prior-week) | `:3094-3097, 3251-3253, 3458` |
| Prior-week mini-snapshot | `priorWeek.*` | `:1975-1986` (from `:1694-1703 priorLeads`, `:1756-1814 priorLeadsInWindow`) | (used only for arrows, not directly rendered) |
| AI narrative LLM input | `data` object passed to `generateAiNarrative` (note: AI re-narrates the contaminated counts) | `:4031` | (not directly rendered; written into `data.aiNarrative`, then rendered if non-null at `:3540+` — note: rev-6 currently disabled this surface, but the input is still contaminated when re-enabled) |

- **Why it matters:** Confirms the predicate must be applied at the QUERY layer (queries `:870-881`, `:1223-1233`, `:1860-1874`, `:1912-1925`, `:1756-1766`, `:1961-1971`) — NOT downstream. Six DB queries cover every render leak. Applying the predicate at the source means **no consumer-side change is required** except labels.
- **Likely fix shape:** Apply predicate to 6 DB queries; flip 1 label. Done.
- **Effort:** M.
- **Risk:** Medium — must be uniform across all 6 queries. If applied to 4 of 6, prior-week arrows go nonsensical.

### Finding 10 — Existing test surface and coverage gaps

- **What:** The unit test at `tests/unit/weeklyReport.content.test.ts:405-453` already verifies the OPT-IN sales-only filter behaves correctly (smaller count, label flip, validator passes). When the fix removes the opt-in plumbing, this test must be reframed: the baseline should ALREADY be sales-only by default. Any test that asserted "service leads are included by default" would fail and should be removed/inverted.
- **Where:**
  - `tests/unit/weeklyReport.content.test.ts:412` — baseline `buildWeeklyReport(org.id, start, end)` with no opts. Today this returns service-inclusive counts; after fix it returns sales-only counts. The assertion at `:413` (`baseline.data.salesFilterActive).toBeFalsy()`) and at `:415-417` (label is "Leads This Week", NOT "Sales Leads This Week") will need flipping.
  - `tests/unit/weeklyReport.scheduler.test.ts:266-296` — orchestration tests injecting fake `send` deps. No service-vs-sales coverage; no change needed.
  - `tests/unit/weeklyReport.validator.test.ts` — schema validator tests; service-vs-sales irrelevant.
  - `tests/unit/dailyRecap.test.ts:356-376` — `classifies leads by vin_status (sales vs service vs excluded)` — already covers the expected `isServiceLead`-equivalent split. No change needed; could expand to cover `isServiceLead(vs)` if `dailyRecap` is refactored to use it.
  - **No unit test exists today** for: `weeklyReport leadsBySource excludes SERVICE_* lead_source URLs`, `priorWeek metrics exclude SERVICE_*`, `score30DayActive (when sales-filter active) excludes SERVICE_*`. Coverage gap.
  - **No unit test exists today** for `isServiceLead` itself in isolation. The classifier file at `server/statusClassifier.ts` has no `tests/unit/statusClassifier.test.ts`. (Verified by `ls tests/unit/ | grep statusClass` — empty.) Coverage gap.
- **Why it matters:** Batch 1 ships a behavior change. Two test files need invertion + new tests need adding to lock in the change.
- **Likely fix shape (test plan):**
  1. Add `tests/unit/statusClassifier.test.ts` covering `isServiceLead` boundary cases per Dispatch 1 Finding 8.
  2. Invert assertions at `weeklyReport.content.test.ts:412-417`: baseline now reads "Sales Leads This Week" + sales-only count; opt-in path is deleted.
  3. Add a fixture-based test in `weeklyReport.content.test.ts` that builds a report against synthetic rows containing both `ACTIVE_NEW_LEAD` and `SERVICE_APPOINTMENT_SCHEDULED` with the same `lead_source` URL, asserts the SERVICE row does not appear in `leadsBySource`, `ghostedLeads`, `singleFollowupLeads`, `leadsReceivedThisWeek`, `priorWeek.leads`, or `leadStatusBreakdown.*`. Six independent assertions on one fixture.
  4. (Optional minor) Refactor `dailyRecapService.ts:104` to use `isServiceLead(vs)` and update `tests/unit/dailyRecap.test.ts:356-376` accordingly. Pure refactor; no behavior change.
- **Effort:** M.
- **Risk:** Low — tests run hermetically.

## Proposed minimal patch

### (a) Call sites to change

The fix is to **delete** the `salesOnlyLeadIds` opt-in plumbing and **embed the predicate at the query layer**, default-on, in `buildWeeklyReport`. No call site changes needed. Specifically:

- **DELETE** `BuildReportOptions` interface entirely (`weeklyReportService.ts:479-481`).
- **DELETE** `isSalesFilterActive` helper (`:487-489`).
- **DELETE** `data.salesFilterActive` field on `WeeklyReportData` (`:451`) and on `:2215`.
- **DELETE** the `salesIds`-based `.filter()` blocks at `:886-894`, `:1875-1878`, `:1953-1959`.
- **DELETE** the `BuildReportOptions` parameter from `buildWeeklyReport` signature (`:853-858`).
- **NO change** to `sendWeeklyReportProduction` or `runWeeklyReportScheduler` — they already call with no opts. The fix is invisible to callers.
- **DELETE** the obsolete test path at `tests/unit/weeklyReport.content.test.ts:405-453` (rewrite per test plan above).

### (b) Predicate plug-in

Six DB queries get the predicate. Use `sql\`${warehouseLeads.vinStatus} NOT LIKE 'SERVICE%'\`` (matches existing pattern in `storage.ts:823, 887`). At each call site, insert as an additional clause inside the existing `where(and(...))`:

| # | File:line | Current `and(...)` includes | Add |
|---|---|---|---|
| 1 | `weeklyReportService.ts:874-880` | org, isNotNull(vinCreatedAt), gte(vinCreatedAt, weekStart), lte(vinCreatedAt, weekEnd) | + `sql\`${warehouseLeads.vinStatus} NOT LIKE 'SERVICE%'\`` |
| 2 | `weeklyReportService.ts:1226-1232` | org, isNotNull(vinCreatedAt), gte(vinCreatedAt, priorWeekStart), lt(vinCreatedAt, weekStart) | + same |
| 3 | `weeklyReportService.ts:1759-1765` | org, isNotNull(vinCreatedAt), gte(vinCreatedAt, priorWeekStart), lt(vinCreatedAt, weekStart) | + same |
| 4 | `weeklyReportService.ts:1697-1703` (the count-only `priorLeads` query) | same as #3 | + same |
| 5 | `weeklyReportService.ts:1867-1873` (statusRowsThisWeek) | org, isNotNull(vinUpdatedAt), gte(vinUpdatedAt, weekStart), lte(vinUpdatedAt, weekEnd) | + same |
| 6 | `weeklyReportService.ts:1918-1924` (priorStatusRows) | org, isNotNull(vinUpdatedAt), gte(vinUpdatedAt, priorWeekStart), lt(vinUpdatedAt, weekStart) | + same |

The `score30DayActive` query at `:1961-1971` already filters on `UPPER(vinStatus) LIKE 'ACTIVE_%'` so it excludes SERVICE by construction. No change needed.

The `inboundCalls`, `notificationsSent`, `adfDelivered`, `triggersFired`, `escalations` queries at `:1325-1409` read `conversations`, `notifications`, `outboundLog`, `activityLog` — none touch `warehouse_leads.vinStatus`. No change needed.

In `dailyRecapService.ts:104` swap `vs.startsWith("SERVICE")` → `isServiceLead(vs)` for SSoT (optional minor refactor — no behavior change).

### (c) Consumer-side display change

Two label changes:

1. **Lead-volume tile label** (`weeklyReportService.ts:3324-3331`) — drop the conditional, hard-code "Sales Leads This Week" / "New sales leads that came into VIN Solutions".
2. **Subject line** (`weeklyReportService.ts:4081`) — operator decision: keep generic ("AI Dealership Performance Analysis") OR insert "Sales" qualifier ("AI Dealership Sales Performance Analysis"). Recommendation: insert "Sales" so the email subject is honest standalone.

No other text changes required. The narrative chunks at `:2047-2104` use the word "leads" generically; once the data is sales-only, the word is accurate without rewriting copy.

### (d) Test coverage gap & where unit tests would land

Three new test files / additions:

1. **`tests/unit/statusClassifier.test.ts`** (NEW) — 8-10 cases for `classifyVinStatus` + `isServiceLead`. Covers `SERVICE_APPOINTMENT_SCHEDULED`, `SERVICE_COMPLETE`, `ACTIVE_NEW_LEAD`, `LOST_BAD_LEAD`, `null`, `''`, `'service'` (lowercase, currently → `unknown`), `'SERVICE'` (no underscore, currently → `unknown` per `statusClassifier.ts:20` — flag for operator).
2. **`tests/unit/weeklyReport.content.test.ts:405-453`** (REWRITE) — invert: baseline now reads "Sales Leads This Week" + sales-only count.
3. **`tests/unit/weeklyReport.serviceExclusion.test.ts`** (NEW) — fixture-based: build a report against synthetic warehouse rows that include both `ACTIVE_*` and `SERVICE_*` rows with overlapping `lead_source` URLs. Assert: leadsReceivedThisWeek is sales-only; leadsBySource excludes SERVICE-only URLs; ghostedLeads excludes SERVICE rows; leadStatusBreakdown.* counts exclude SERVICE; priorWeek.leads excludes SERVICE; rendered HTML contains "Sales Leads This Week", does NOT contain any SERVICE_* row's customer name.
4. **(Optional) `tests/unit/dailyRecap.test.ts`** (EXPAND) — once `vs.startsWith("SERVICE")` swaps to `isServiceLead(vs)`, add a case for `vinStatus = 'service'` (lowercase — currently classified as `unknown` per Dispatch 1 Finding 8 #3, which means it would NOT count toward `newServiceLeads` under either the current or new predicate). Tightens the contract.

## Proposed implementation chunks (suggested order)

### Chunk A — Apply predicate at all 6 weekly-report query sites + flip labels (BATCH 1 default)

- **Files in scope:**
  - `server/services/weeklyReportService.ts` — 6 query-site predicate adds, 1 label flip, delete `BuildReportOptions` plumbing, delete `salesFilterActive` field.
  - `server/services/dailyRecapService.ts` — optional refactor: `vs.startsWith("SERVICE")` → `isServiceLead(vs)` (no behavior change).
  - `tests/unit/weeklyReport.content.test.ts` — invert baseline assertions; remove opt-in test path.
  - **OUT of scope this chunk:** schema migration; client-side `client/src/` UI changes; the broader Insights `lead_source ILIKE '%service%'` heuristic at `server/routes/insights.ts:797-799` (Dispatch 3's job — see Open Question 4).
- **Test plan:**
  - **Delta 1 (focused unit + integration):** Run `npx vitest run tests/unit/weeklyReport.content.test.ts tests/unit/dailyRecap.test.ts tests/unit/statusClassifier.test.ts` after edits. All pass. Add the new `tests/unit/weeklyReport.serviceExclusion.test.ts` fixture test; verify it fails before the predicate edit and passes after. Two-stage delta within the unit suite.
  - **Delta 2 (live observable, allowlisted):** Run `sendWeeklyReportProduction(serra-honda)` in test-lane (operator-allowlisted recipients per CLAUDE.md autonomy rule). Capture row-count delta:
    - Pre-fix expected leadsReceivedThisWeek (per the SQL above for the 2026-04-20→2026-04-27 window): serra-honda 160. Post-fix expected: 160 − 37 = 123.
    - Tony Serra Ford pre 75 → post 46.
    - Compare with the 4 other orgs' percentages from Finding 7.
    - Operator visually inspects: "Lead-volume tile says 'Sales Leads This Week' (label flip), the count dropped by ~17–39%, no SERVICE_* customer name appears in any list."

### Chunk B — Add `tests/unit/statusClassifier.test.ts` and fixture test (depends on A)

- **Files:** new test files only. No product code change.
- **Test plan:** runs in standard `npx vitest run` step; no provider sends.

## Proof needed before any chunk is approved

- [ ] Operator confirms predicate is `vin_status NOT LIKE 'SERVICE%'` per Dispatch 1 (already finalized — restating for completeness).
- [ ] Operator approves removal of `salesOnlyLeadIds` opt-in plumbing (vs keeping it as a no-op for back-compat). Recommendation: remove — single source of behavior.
- [ ] Operator decides label policy:
  - Lead-volume tile: hard-code "Sales Leads This Week" (recommended) vs keep "Leads This Week" with footnote.
  - Subject line: insert "Sales" (recommended) vs keep generic.
- [ ] Test-lane weekly-report dry-run delta matches the SQL-predicted 17–39% per-org reduction (Finding 7 table).
- [ ] No SERVICE row appears in the rendered HTML's Ghosted Leads or Stalled lists (test-lane spot check).

## Open questions for operator

1. **`salesFilterActive` field — keep or remove from `WeeklyReportData`?** Recommendation: REMOVE. The field becomes meaningless when the filter is default-on. Validator at `:451` is optional already. (Note: removing requires cascading edit to validator schema and `:2215, 3325-3329` in render.)
2. **Subject-line scope qualifier — "Sales Performance" vs generic?** Recommendation: insert "Sales". The hero already reads "AI Dealership Performance Analysis" (generic). Mismatch between subject and tile copy is acceptable since the tile is the user's reading-level scope. Operator's call.
3. **Daily-recap refactor `vs.startsWith("SERVICE")` → `isServiceLead(vs)` — in scope for this chunk?** Recommendation: in scope (single-line, no behavior change, SSoT). If operator prefers minimum diff, defer.
4. **`server/routes/insights.ts:797-799`** uses `lead_source.toLowerCase().includes("service")` — per Dispatch 1 Finding 4 this matches **zero** rows in the last 90 days. The `serviceLeads` filter is empirically a no-op and the `serviceSold / serviceLeads`-based `lib-11 "Service-to-Sales"` ratio at `:1057-1061` is computed against an empty array (returns "—"). Out of scope for this dispatch (Dispatch 3's surface) but flagging the misconception is part of the Reports investigation.
5. **Prior-week `score`** at `weeklyReportService.ts:1846-1849` uses the recomputed `priorScore` formula, which depends on `priorGhosted`/`priorOver48h`. Once the prior-week query at `:1759-1765` is sales-filtered, prior-week metrics drop too — week-over-week arrows remain accurate. Confirm operator is OK with this consistency change (the alternative is asymmetric: this-week sales-filtered, prior-week unfiltered, which would flatter the trend).

## Out of scope for this investigation

1. Schema migration to add `lead_type` column (BL-107, Dispatch 1 Chunk B).
2. UI-side label updates in `client/src/`. None observed touching this surface; deferred to Batch 3 anyway.
3. The 7 dishonest metrics — Dispatch 3.
4. Marketing Insights tab — Dispatch 4.
5. TeamBox sales/service distinction — Dispatch 6.
6. Conversion-rate / appointment / salesperson-leaderboard tiles — none exist (Finding 5); creating them is separate Insights/feature work.
7. The `lead_source ILIKE '%service%'` heuristic in `insights.ts:797` — separate dishonest-metrics surface (Dispatch 3).
8. Lead-source name resolution (I-279) — separate cap on `lead_source` URL→human-name display.
9. AI narrative re-enable / regression — `data.aiNarrative` is currently null in the rendered v8 HTML (per the rev-6 / v8 section header at `weeklyReportService.ts:2895`); the AI narrative is generated but not rendered to the email body. If re-enabled, the contaminated `data.*` would feed it; this dispatch's predicate fix solves that automatically.
