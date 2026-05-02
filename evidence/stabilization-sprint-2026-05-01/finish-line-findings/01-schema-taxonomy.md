# Schema / Data Classification findings — 2026-05-01

## Scope of investigation

Determine the source-of-truth column(s) for sales-vs-service classification on `warehouse_leads`, decide whether a `BL-107 lead_type` migration is required for v2.2, and return the exact predicate Batch 1 will use to filter sales-only data in Reports / Metrics / TeamBox surfaces. Investigation is read-only against `shared/schema.ts`, the live Supabase database via `psql` (SELECT only), and existing consumer code in `server/`. No DDL, no DML, no edits.

## TL;DR

1. **Source-of-truth column today: `warehouse_leads.vin_status` (`shared/schema.ts:305`).** Service rows are emitted by VIN Solutions with statuses prefixed `SERVICE_*` (e.g. `SERVICE_APPOINTMENT_SCHEDULED`, `SERVICE_COMPLETE`). 2,178 of 11,529 last-90d rows (18.9%) are `SERVICE_*`.
2. **`lead_source` is NOT a viable predicate.** It is universally a VIN URL (`https://api.vinsolutions.com/leadsources/id/<numeric>?dealerid=<n>`). Zero rows in the last 90 days contain the literal substring `service` or `parts`. `lead_source LIKE '%service%'` would match nothing.
3. **`lead_source ID 7098` IS a strong corroborating signal** (99.86% of service-status rows have a `id/7098` URL), but lead-source-IDs are an indirect signal; `vin_status` is direct.
4. **An existing helper already encodes the predicate**: `server/statusClassifier.ts` exposes `isServiceLead(status)` returning `classifyVinStatus(status) === 'service'`. `server/services/dailyRecapService.ts:91-119` already uses `vs.startsWith("SERVICE")` to split sales vs service correctly. `server/storage.ts:823, 887` uses `vinStatus NOT LIKE 'SERVICE%'` in two specific query paths. The gap is that **`weeklyReportService.ts` does not apply this filter** (per its own author comment at `:462-469`).
5. **`BL-107 lead_type` migration is NOT required for v2.2.** A best-effort `vin_status`-prefix predicate is sufficient for honest sales-vs-service reports today. File BL-107 as v2.3 backlog so a denormalized column survives upstream classifier changes (e.g. parts handling).
6. **Recommended Batch 1 predicate (verbatim):**
   - SQL (Drizzle ORM): `sql\`${warehouseLeads.vinStatus} NOT ILIKE 'SERVICE\\_%' ESCAPE '\\\\' \``  — or simpler `sql\`${warehouseLeads.vinStatus} NOT LIKE 'SERVICE%'\`` (as already used in storage.ts).
   - TypeScript application-side: `(l.vinStatus || "").toString().startsWith("SERVICE") === false` — matches the existing dailyRecap pattern. Or use `!isServiceLead(l.vinStatus)` from `server/statusClassifier.ts` (preferred — single source of truth).

## Findings

### Finding 1 — `warehouse_leads` lacks a `lead_type` / `department` column

- **What:** Schema confirmation: 19 columns; none is `lead_type`, `department`, or any other explicit sales/service flag.
- **Where:** `shared/schema.ts:300-323` (full table definition). DB introspection via `information_schema.columns` returns the same 19 columns.
- **Why it matters:** Consumer code (`weeklyReportService.ts:462-469`) explicitly notes the absence: *"The warehouse_leads table has no lead_type column — only VIN Solutions has the sales-vs-service distinction. Until BL-107 adds lead_type to the warehouse + sync extension, callers can pass a pre-computed Set ..."*. `server/routes/insights.ts:14-16` carries the same caveat for channel inference.
- **Likely fix shape:** Use existing column (`vin_status`) as predicate today; defer column addition to v2.3.
- **Effort:** S to use existing column.
- **Risk if shipped wrong:** Low — predicate is already proven in two other code paths.

### Finding 2 — Candidate column inventory and last-90d coverage

- **What:** Five `warehouse_leads` columns could plausibly classify sales vs service. Coverage and value distributions are stark.
- **Where (all `shared/schema.ts`):**
  - `dataSource` — line 304 (NOT NULL, default `'vin_solutions'`)
  - `vinStatus` — line 305 (nullable text)
  - `leadSource` — line 309 (nullable text)
  - `vehicleOfInterest` — line 310 (nullable text; URL form)
  - `dealerName` — line 312 (nullable text; org slug, not classification signal)
- **Coverage table (last 90 days, total = 11,529 rows):**

  | Column | Populated | Distinct vals | Useful for sales/service? |
  |---|---|---|---|
  | `data_source` | 11,529 (100%) | 1 (`vin_solutions`) | NO — uniform |
  | `vin_status` | 11,529 (100%) | 32 | YES — direct prefix signal |
  | `lead_source` | 11,529 (100%) | 100s of URLs | INDIRECT — via `id/7098` |
  | `vehicle_of_interest` | 11,527 (99.98%) | URLs | NO — vehicle reference |
- **Why it matters:** Determines which column is the predicate target.
- **SQL used:**
  ```sql
  SELECT COUNT(*) AS total_rows_90d,
         COUNT(lead_source)        AS lead_source_pop,
         COUNT(vin_status)         AS vin_status_pop,
         COUNT(data_source)        AS data_source_pop,
         COUNT(vehicle_of_interest) AS voi_pop
  FROM warehouse_leads
  WHERE created_at >= NOW() - INTERVAL '90 days';
  -- → 11529 / 11529 / 11529 / 11529 / 11527
  ```
- **Effort:** N/A — observational.
- **Risk:** None.

### Finding 3 — `vin_status` distribution shows clean `SERVICE_*` prefix family

- **What:** 32 distinct `vin_status` values in last 90 days. Service-prefixed values total 2,178 rows (18.9% of total). The status namespace is a controlled VIN Solutions vocabulary (`ACTIVE_*`, `BAD_*`, `LOST_*`, `SERVICE_*`, `SOLD_*`, `NON_CUSTOMER_INITIATED_LEAD`, plus 4 lowercase legacy strings).
- **Where:** SQL on `warehouse_leads.vin_status`. Helper that already encodes the family split: `server/statusClassifier.ts:1-58` (exports `classifyVinStatus`, `isServiceLead`, `isExcludedFromPipeline`).
- **Top values:**

  | vin_status | n | family |
  |---|---|---|
  | `BAD_DUPLICATE_LEAD` | 2654 | bad |
  | `ACTIVE_WAITING_FOR_PROSPECT_RESPONSE` | 1991 | active |
  | `ACTIVE_ACTIVE_LEAD` | 1959 | active |
  | `SERVICE_APPOINTMENT_SCHEDULED` | 1263 | **service** |
  | `LOST_LEAD_PROCESS_COMPLETED` | 917 | lost |
  | `SERVICE_COMPLETE` | 915 | **service** |
  | `BAD_BAD_OR_NO_CONTACT_INFORMATION` | 423 | bad |
  | `SOLD_DELIVERED` | 386 | sold |
  | `ACTIVE_NEW_LEAD` | 335 | active |
  | `NON_CUSTOMER_INITIATED_LEAD` | 165 | non_customer |
- **Family rollup (last 90d):**

  | family | n | distinct lead_sources |
  |---|---|---|
  | active | 4287 | 340 |
  | bad | 3274 | 273 |
  | **service** | **2178** | **8** |
  | lost | 1170 | 177 |
  | sold | 453 | 109 |
  | non_customer | 165 | 15 |
  | other (`NEW`, `active` lowercase) | 4 | 1 |
- **Why it matters:** `vin_status LIKE 'SERVICE%'` is unambiguous and aligns with VIN Solutions' own status namespace. Service rows are concentrated in only 8 distinct lead-source URLs (vs 340 for active leads), reinforcing that service is a tightly-scoped traffic class.
- **Effort:** S — use existing helper.
- **Risk:** Low.

### Finding 4 — `lead_source` does NOT contain literal "service" anywhere

- **What:** Out of 11,529 last-90d rows, **zero** rows have `lead_source ILIKE '%service%'` and **zero** rows have `lead_source ILIKE '%parts%'`. 99.97% (11,525 / 11,529) are VIN URL strings. `lead_source LIKE '%service%'` predicate would match nothing.
- **Where:** SQL probe; raw values include only `https://api.vinsolutions.com/leadsources/id/<numeric_id>?dealerid=<n>`.
- **SQL used:**
  ```sql
  SELECT
    SUM(CASE WHEN lead_source ILIKE '%service%' THEN 1 ELSE 0 END) AS has_service,
    SUM(CASE WHEN lead_source ILIKE '%parts%'   THEN 1 ELSE 0 END) AS has_parts,
    SUM(CASE WHEN lead_source ILIKE '%vinsolutions%' THEN 1 ELSE 0 END) AS is_vin_url,
    SUM(CASE WHEN lead_source NOT ILIKE 'http%' THEN 1 ELSE 0 END) AS not_url,
    COUNT(*) AS total_90d
  FROM warehouse_leads
  WHERE created_at >= NOW() - INTERVAL '90 days';
  -- → 0 / 0 / 11525 / 4 / 11529
  ```
- **Why it matters:** Several finish-line-plan questions framed the candidate predicate as `lead_source LIKE '%service%'`. **That predicate is empirically equivalent to "exclude no rows" today.** The plan's Section 13 ER-1 risk assumes a coverage shortcoming on `lead_source`; the real issue is that `lead_source` carries no semantic content for the sales/service distinction at all — it is opaque ID-bearing URLs. The semantic content is on `vin_status`.
- **Likely fix shape:** Drop any plan to use `lead_source` for sales/service classification. Use `vin_status` instead.
- **Effort:** N/A — clarifies misconception.
- **Risk:** Medium if uncorrected — a `lead_source LIKE` predicate would silently no-op and ship the same inflated reports.

### Finding 5 — `lead_source ID 7098` is the secondary signal but vin_status is more reliable

- **What:** Of the 2,178 service-status rows in the last 90 days, **2,175 (99.86%)** carry a `lead_source` URL of the form `https://api.vinsolutions.com/leadsources/id/7098?dealerid=<n>`. The same 7098 URLs appear under `ACTIVE_*` for only 11 rows (0.5% leak vs ~99.5% alignment). However, lead-source-IDs are not a documented sales/service taxonomy — they happen to align here because Serra Honda + the Columbia + Tony Serra Ford all configured a service-specific source ID.
- **Where:** SQL probe.

  | lead_source_id | service_n | non_service_n |
  |---|---|---|
  | 7098 | 2175 | 0 |
  | 119277 | 1 | 56 |
  | 60183 | 1 | 2 |
  | 60176 | 1 | 0 |
- **Why it matters:** `id/7098` could serve as a corroborating filter, but it is brittle — adding a new dealer or VIN reconfiguring the source mapping would silently misclassify. `vin_status` is the documented semantic signal; `id/7098` is incidental.
- **Likely fix shape:** Use `vin_status NOT LIKE 'SERVICE%'`. Do NOT hardcode `id/7098`.
- **Effort:** N/A.
- **Risk:** Low if vin_status-only predicate is used; high if id/7098 hardcoded.

### Finding 6 — Per-org service share varies materially (10.4% → 35.4%)

- **What:** Service rows as a percentage of last-90d warehouse leads:

  | org | total | service | service % |
  |---|---|---|---|
  | hyundai-of-columbia | 3739 | 387 | 10.4% |
  | ford-of-columbia | 2960 | 506 | 17.1% |
  | serra-honda | 1830 | 356 | 19.5% |
  | serra-nissan | 1517 | 404 | 26.6% |
  | tony-serra-ford | 1483 | 525 | 35.4% |
- **Why it matters:** Confirms KD-1 (sales-vs-service mixing) is materially affecting weekly report numbers — every store has 10–35% inflation vs sales-only counts. Filtering will visibly reduce lead-volume tiles by these percentages.
- **Likely fix shape:** Apply the predicate consistently in `weeklyReportService.ts` lead-volume queries (around `:876-905`, `:1224-1231`, `:1351-1353`, `:1699-1764`).
- **Effort:** M.
- **Risk:** Medium — many query sites; same predicate everywhere.

### Finding 7 — Sample rows for operator inspection

**Sample SERVICE rows (would be excluded by `vin_status LIKE 'SERVICE%'`):**

| id | vin_status | lead_source ID | created |
|---|---|---|---|
| `5ebc3655-114c-43f0-a7e2-327f33037042` | SERVICE_APPOINTMENT_SCHEDULED | 7098 | 2026-05-01 06:58 |
| `80c12987-9fc5-4af6-b6a4-acdeea913f91` | SERVICE_APPOINTMENT_SCHEDULED | 7098 | 2026-05-01 06:58 |
| `9e2d11ab-e8ef-496c-8e0c-a7e28bc2caf9` | SERVICE_APPOINTMENT_SCHEDULED | 7098 | 2026-05-01 06:58 |
| `d4c16884-0997-4ce8-8ae8-43c18ea9252e` | SERVICE_APPOINTMENT_SCHEDULED | 7098 | 2026-05-01 06:58 |
| `e2306629-9b76-418e-8a4b-bcc0521afe22` | SERVICE_APPOINTMENT_SCHEDULED | 7098 | 2026-05-01 06:58 |

**Sample SALES rows (would remain after filter):**

| id | vin_status | lead_source ID | created |
|---|---|---|---|
| `461fbc4d-cab4-403b-aadb-e5f8ce7b4260` | ACTIVE_NEW_LEAD | 3931035 | 2026-05-01 09:41 |
| `43d59c05-3123-4762-8f93-68eb53bfc523` | ACTIVE_ACTIVE_LEAD | 3562050 | 2026-05-01 09:01 |
| `8a5c6794-9d58-40b2-adab-6ffc3d44d5b2` | ACTIVE_NEW_LEAD | 3743357 | 2026-05-01 08:54 |
| `689f5886-0ce3-4e24-b19b-01e500a278c9` | ACTIVE_NEW_LEAD | 8 | 2026-05-01 08:32 |
| `9d54373e-1eb4-44bb-9fe5-813a6e15373c` | ACTIVE_NEW_LEAD | 3931035 | 2026-05-01 08:39 |

**Edge cases (potential misclassification — 11 rows / 90 days):** 11 rows have an `ACTIVE_NEW_LEAD` or `ACTIVE_WAITING_FOR_PROSPECT_RESPONSE` status with a `lead_source ID 7098` URL. Under the recommended predicate (`vin_status NOT LIKE 'SERVICE%'`), these would be classified as **sales** (because their status is `ACTIVE_*`, not `SERVICE_*`). This is what the operator likely wants — VIN's own status taxonomy says they're not yet service. The risk is bounded (11 / 11,529 = 0.1% of total).

Operator-inspection request: confirm by reviewing the sample tables above that the SERVICE_* rows look like service-department traffic and the ACTIVE_* rows look like sales-department traffic.

### Finding 8 — Consumer code already supports the predicate (re-use over invent)

- **What:** Three independent code paths already encode the same `vin_status`-prefix logic. The gap is selective application, not missing infrastructure.
- **Where:**
  - `server/statusClassifier.ts:1-58` — `classifyVinStatus`, `isServiceLead`, `isExcludedFromPipeline`. Exports the helper Batch 1 should use.
  - `server/services/dailyRecapService.ts:91-119` — already splits `newSalesLeads` vs `newServiceLeads` using `vs.startsWith("SERVICE")` and explicit excludes for `LOST_*`, `SOLD_*`, `BAD_*`, `*DUPLICATE*`, `NON_CUSTOMER_INITIATED_LEAD`. Working pattern.
  - `server/storage.ts:823, 887` — Drizzle queries for "active" lead lists already filter `vinStatus NOT LIKE 'SERVICE%'` and the other family prefixes. Working pattern.
- **Why it matters:** No new helper needed. `weeklyReportService.ts` should adopt one of these existing patterns rather than invent a parallel predicate.
- **Likely fix shape:** Import `isServiceLead` from `server/statusClassifier.ts` and apply at every weekly-report lead-volume query site. Drop the `salesOnlyLeadIds: Set<string>` plumbing in favor of a SQL-native predicate.
- **Effort:** M (touches multiple query sites in `weeklyReportService.ts`).
- **Risk:** Low — predicate is proven in 2 other code paths.

### Finding 9 — `BL-107` does NOT exist in `backlog.md` or `issues.md`

- **What:** `grep "BL-107"` returns zero matches in both `backlog.md` and `issues.md`. Author's comment at `weeklyReportService.ts:463` references `BL-107` as a planned migration but no entry has been filed.
- **Where:** `/home/ubuntu/Claude-store/nexxus2.2_replit/backlog.md`, `/home/ubuntu/Claude-store/nexxus2.2_replit/issues.md`.
- **Why it matters:** Plan §13.1 KD-1 and `overnight-validation-report.md:60` both reference BL-107 as a known item, but the work item is not registered. Standing rule: every accepted-debt item lives in `issues.md`.
- **Likely fix shape:** Operator decision per Decision Matrix D-A1: file BL-107 as v2.3 backlog (NOT v2.2 scope, since the heuristic is sufficient).
- **Effort:** S — single backlog entry per file-standards.md template.
- **Risk:** Documentary debt only.

### Finding 10 — Migration shape (if v2.3 chooses to ship the column)

- **What:** A future `lead_type` column would denormalize the `vin_status`-derived classification into a stable, indexable column.
- **Likely DDL (v2.3, not v2.2):**
  ```sql
  ALTER TABLE warehouse_leads ADD COLUMN lead_type text;
  CREATE INDEX idx_warehouse_leads_org_lead_type ON warehouse_leads(organization_id, lead_type);

  -- Backfill from vin_status:
  UPDATE warehouse_leads SET lead_type =
    CASE
      WHEN vin_status ILIKE 'SERVICE_%' THEN 'service'
      WHEN vin_status IS NULL THEN 'unknown'
      ELSE 'sales'
    END;
  -- (No 'parts' branch — observed 0 rows are parts-prefixed in VIN's namespace.)
  ```
- **Tables/views/queries that would need updating** (file:line refs for v2.3 sprint, not v2.2):
  - `shared/schema.ts:300-323` — add `leadType: text("lead_type")` column.
  - `server/sync.ts` — set `lead_type` during VIN sync writes.
  - `server/services/weeklyReportService.ts:876-905, 1224-1231, 1351-1353, 1699-1764` — switch from `vin_status NOT LIKE 'SERVICE%'` to `lead_type = 'sales'`.
  - `server/services/dailyRecapService.ts:91-119` — same.
  - `server/storage.ts:823, 887` — same.
  - `server/routes/insights.ts:14-16, 18-33` — `deriveChannel` still needs lead_source for channel-of-acquisition; `lead_type` is orthogonal.
  - `server/services/triggerService.ts:537` — already uses `dataSource`, separate concern.
  - **No views to update** (no Postgres views observed in schema.ts).
  - **No migrations on `lead_source` / `vin_status`** — those columns remain.
- **Why it matters:** Documents the v2.3 transition path; not Batch 1 work.
- **Effort:** M for v2.3.
- **Risk:** Migration risk + sync-extension coordination with central-mcp owner. Batch 1 should NOT take this on.

## Proposed implementation chunks (suggested order)

### Chunk A — Adopt vin_status-based predicate in weeklyReportService.ts (Batch 1 default)

- **Files in scope:**
  - `server/services/weeklyReportService.ts` — apply `vin_status NOT LIKE 'SERVICE%'` (or `!isServiceLead(l.vinStatus)`) at every lead-volume query and at every in-memory `.filter(...)` over leads. Replace the unused `salesOnlyLeadIds: Set<string>` plumbing with the SQL-native predicate (delete the BuildReportOptions branch). Update the report subject + body to read "Sales leads" instead of generic "Leads This Week" since service is now excluded by default.
  - `server/services/dailyRecapService.ts:91-119` — already correct; verify no regressions.
  - `server/routes/insights.ts:64-498` — apply same predicate at every `allLeads.filter(...)` site that powers Sales / Insights tiles. (Cross-reference Dispatch 3's per-metric findings.)
  - **Out of scope this chunk:** schema migration; client-side display changes (those default to Batch 3).
- **Test plan:**
  - **Delta 1 (focused unit test):** Add `tests/unit/sales-only-predicate.spec.ts` covering: (a) `isServiceLead("SERVICE_APPOINTMENT_SCHEDULED") === true`, (b) `isServiceLead("ACTIVE_NEW_LEAD") === false`, (c) `isServiceLead(null) === false`, (d) `isServiceLead("active") === false`. Add an integration test that builds a weekly report against fixture rows containing both SERVICE_* and ACTIVE_* and asserts the SERVICE_* rows do not appear in the lead-volume tile.
  - **Delta 2 (live observable):** Run `weeklyReportService.sendWeeklyReportProduction` in test-lane (allowlisted recipients per CLAUDE.md autonomy rule). Capture row-count before vs after the predicate is applied. Expected per-org reduction (last 90d sample): hyundai-columbia 10.4%, ford-columbia 17.1%, serra-honda 19.5%, serra-nissan 26.6%, tony-serra-ford 35.4%. Send the dry-run to the operator's allowlisted inbox; operator visually inspects "looks like sales-only" per KD-1 stop-go rule.

### Chunk B — File BL-107 backlog entry

- **Files in scope:** `backlog.md` (add new entry), `issues.md` (cross-reference if treating as accepted debt).
- **Entry shape (per file-standards.md):**
  ```
  BL-107  — Schema: warehouse_leads.lead_type denormalized column

  Objective:
    Add an enforceable, indexable `lead_type` column to warehouse_leads so
    consumers don't infer sales vs service from vin_status prefix patterns.

  Scope (in):
    - shared/schema.ts: add `lead_type text`
    - migration: backfill from vin_status (SERVICE_* → 'service', else 'sales')
    - sync extension: server/sync.ts writes lead_type during VIN ingest
    - consumer flip: weeklyReportService, dailyRecapService, storage, insights
      switch from `vin_status NOT LIKE 'SERVICE%'` to `lead_type = 'sales'`

  Scope (out):
    - parts-vs-service split (VIN does not emit a parts prefix today)
    - touching VIN Solutions' own taxonomy (read-only on their side)
    - removing vin_status (kept; lead_type is denormalized convenience)

  Done looks like:
    - Every lead row has lead_type IN ('sales','service','unknown')
    - All consumer code uses lead_type, not vin_status prefix
    - No regression in weekly report numbers vs the current heuristic

  Constraints:
    - Coordinate sync writer with central-mcp owner
    - Backfill must run on dev before live
    - Default v2.3, NOT v2.2

  Tasks:
    1. shared/schema.ts column addition (drizzle migration draft)
    2. backfill SQL (dev → live)
    3. sync.ts writer
    4. consumer flip per file
    5. tests
    6. evidence pack

  Owner: TBD (operator to assign in v2.3 planning)
  ```
- **Test plan (Chunk B):** none — documentation chunk. Verify `grep BL-107 backlog.md` returns the entry.

## Proof needed before any chunk is approved

- [ ] Operator reviews the SAMPLE rows in Finding 7 and confirms the SERVICE_* rows look like service-department traffic (not misclassified sales).
- [ ] Operator approves D-A1 path (b) — best-effort heuristic now, BL-107 deferred to v2.3.
- [ ] Operator confirms the predicate `vin_status NOT LIKE 'SERVICE%'` (or equivalently `!isServiceLead(vinStatus)` from `server/statusClassifier.ts`) is what Batch 1 will apply system-wide.
- [ ] Operator approves the BL-107 backlog entry text before Chunk B commits.
- [ ] Test-lane weekly-report dry-run row-count delta matches the 10–35% per-org reduction predicted in Finding 6.

## Open questions for operator

1. **Predicate placement** — should we (a) replace the `salesOnlyLeadIds: Set<string>` plumbing with a direct SQL predicate (preferred — simpler), or (b) keep the Set-based plumbing and pre-compute the Set from `vin_status NOT LIKE 'SERVICE%'`? Recommendation: (a). The Set-based design was anticipating a live VIN API classification pass that never shipped; SQL-native is simpler and faster.
2. **Subject-line change** — the weekly report currently labels the lead-volume tile as generic "Leads This Week". With service excluded, should it read "Sales Leads This Week" (preferred — honest scope) or remain "Leads This Week" with a fineprint note? Recommendation: "Sales Leads This Week".
3. **Edge-case handling** — 4 rows in last 90d carry non-prefix vin_status values (`NEW`, `active` lowercase, observed once or twice). Treat them as sales (default) or unknown (excluded)? Recommendation: treat as sales (the existing `dailyRecapService.ts:106-117` exclude list does not exclude these).
4. **Handling 11 ACTIVE_* rows that share `id/7098` with service** — under the recommended predicate they are classified as **sales**. Confirm this is correct (most likely yes, since VIN's own status says they're active leads not yet in a service flow).
5. **`hyundai-of-columbia` org** — 10.4% service share is markedly lower than Tony Serra Ford's 35.4%. Is that expected (org-specific service ops capacity), or does it suggest sync gap? Out-of-scope confirmation; flag for awareness.

## Out of scope for this investigation

1. Marketing-vs-sales classification. Marketing campaigns are tracked on the `campaigns` table via `department TEXT`, not on `warehouse_leads`. Separate concern.
2. Parts vs service split. VIN Solutions emits no `PARTS_*` prefix in observed data; pursue only if the operator confirms parts traffic exists and is being misclassified.
3. Lead-source name resolution (I-279). The 16–31% resolution rate is a separate cap on `lead_source` URL→human-name display, unrelated to sales-vs-service classification.
4. UI-side label updates in `client/src/`. Defer to Batch 3 per plan §5 Batch 1 scope.
5. `warehouse_metrics.month_end_forecast` writer / fallback (KD-11 / I-NEW-2026-05-01-L). Different table.
6. `central-mcp` sync extension to write `lead_type` directly during ingest. v2.3 scope (BL-107).
7. The 7 dishonest metrics (KD-2). Dispatch 3's job.

## Evidence — SQL transcripts

All probes are SELECT-only against the live Supabase DB via `psql "$DATABASE_URL"`. No DDL, no DML, no writes.

```sql
-- Coverage on candidate columns (last 90d)
-- → 11529 rows / 11529 lead_source / 11529 vin_status / 11529 data_source / 11527 voi

-- vin_status family rollup (last 90d)
-- → active 4287 / bad 3274 / service 2178 / lost 1170 / sold 453 / non_customer 165 / NEW+active(lowercase) 4

-- Per-org service share (last 90d)
-- → hyundai-of-columbia 10.4%, ford-of-columbia 17.1%, serra-honda 19.5%, serra-nissan 26.6%, tony-serra-ford 35.4%

-- lead_source service-substring presence (last 90d)
-- → 0 rows ILIKE '%service%', 0 rows ILIKE '%parts%', 11525 are http URLs, 4 are non-URL strings

-- Cross-tab: do service-source URLs ever appear in non-service status families?
-- → service 2178 / active 11 (the 11 are the false-positives if id/7098 hardcoded; vin_status predicate avoids this)
```

(Full transcripts captured in this session's Bash history; reproducible via the SQL above.)
