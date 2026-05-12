# Marketing-Data Ingestion Strategy

**Date:** 2026-05-12
**Status:** STRATEGY DRAFT (recon side-sprint Workstream C — not committed scope)
**Targets v2.3+** — pairs with `BL-002` (Marketing Insights data + reports) from Wave 3C deferral
**Origin:** operator now has administrative credentials for Facebook Ads, Google Ads, Google Analytics, and Envision

---

## 1. Sources in scope

| Source | Access available | Historical data available | Refresh model | Per-store separation |
|---|---|---|---|---|
| **Facebook Ads** | Admin login | Yes (Facebook retains ~37 months of ad insights via Marketing API) | API pull, hourly to daily | One Business Manager → multiple ad accounts; per-store ad account ID |
| **Google Ads (AdWords)** | Admin login | Yes (multi-year retention) | API pull, daily; supports MCC (manager) accounts for multi-store | MCC → child accounts; one child per store |
| **Google Analytics 4** | Admin login | **NO historical** (just set up properly for stores; data starts at provisioning date) | API pull (GA4 Data API) daily | One property per store |
| **Envision** | Account exists | Unknown — depends on Envision's data retention | Unclear — likely scheduled export to CSV/file OR API | Likely per-property |

**Critical asymmetry to communicate to operator:** Google Analytics history starts NOW. Facebook + Google Ads have multi-year history. Envision data is wherever Envision keeps it. The "knock-their-socks-off" pitch should emphasize Facebook + Google Ads + (when Duran uploads them) VIN reports — NOT GA historical, which doesn't exist yet.

---

## 2. Architecture options (3-category boundary: functionality decision)

### Option A — Direct API pull into Supabase

- Add a per-source ingestion service: `server/services/marketingIngest/{facebook,googleAds,googleAnalytics,envision}Sync.ts`
- Each runs on cron via existing `scheduler.ts` (already proven for VIN sync)
- Writes to new marketing tables in shared Supabase
- **Pros:** uses existing infra; tight coupling to existing app; no new system to operate
- **Cons:** Supabase pays for query + storage of analytics data; marketing data volume can grow fast; analytics-style queries (SUM over wide date ranges) compete with transactional workload

### Option B — External warehouse (BigQuery / Snowflake / Postgres-on-Supabase-but-dedicated)

- Land raw API responses in warehouse via a separate ELT runner
- Nexxus reads aggregated rollups via a read-only API or materialized views
- **Pros:** clean separation; analytics workload doesn't touch transactional DB; BigQuery has free tier
- **Cons:** new system to operate; new auth + secrets; longer time-to-first-chart

### Option C — Hybrid

- Last-30-days hot data in Supabase (powers live dashboards)
- Long-tail historical in warehouse (powers reports + the Serra pipeline-report style work)
- Sync job pushes aggregations from warehouse → Supabase nightly
- **Pros:** best of both
- **Cons:** most complex

### Recommendation

**Option A for v2.3 launch.** Reasons:
1. Operator's "knock their socks off" pitch needs to happen in days/weeks, not months. Option A ships first.
2. Per-source row counts for a single store, per-day-grain, last 90 days = thousands of rows per source — not millions. Supabase handles this comfortably.
3. If we hit pain, migrating Option A → Option C is straightforward (rollup tables already exist; just relocate raw landing tables).
4. Reuses existing patterns (scheduler.ts, vendorProxy.ts for credential storage), so it doesn't burn new system-design effort during a launch month.

**Reserve Option C for v2.4+ if data volume crosses ~10M rows/store/source.**

---

## 3. Proposed schema (Option A)

```
marketing_accounts (
  id, organization_id, source ENUM('facebook','google_ads','google_analytics','envision'),
  external_account_id, credentials_ref (vault key), is_active, created_at
)

marketing_campaigns (
  id, marketing_account_id, external_campaign_id, name, status, created_at, updated_at
)

marketing_daily_metrics (
  id, marketing_account_id, external_campaign_id NULLABLE, date,
  impressions, clicks, spend_cents, conversions, leads_attributed,
  raw_payload JSONB, ingested_at
)

marketing_audience_segments (   -- for Envision-style unified audience reporting
  id, marketing_account_id, external_segment_id, name, size, last_synced_at
)

marketing_attribution_links (   -- ties lead → marketing source for VIN-lead matching
  id, lead_id, marketing_campaign_id, attribution_score, source_signal
)
```

Index strategy: composite `(organization_id, date)` on `marketing_daily_metrics` — every dashboard query is org+date-scoped.

---

## 4. Credential handling

Per CLAUDE.md's `VIN_SAFE_MCP_TOKEN` pattern + `vendorProxy.ts` precedent: each marketing source has an OAuth/API-key triplet stored encrypted at rest, accessible only via a server-side proxy. **Never** expose tokens to client.

- Facebook: Long-lived page access token + Marketing API token
- Google Ads: OAuth refresh token + developer token + login_customer_id (MCC)
- GA4: OAuth refresh token + property_id
- Envision: TBD — confirm with operator after they explore the Envision admin

Token storage: new table `marketing_credentials` (encrypted columns) OR reuse existing `org_integrations` if shape fits. Decide at implementation time, not strategy time.

---

## 5. Ingestion cadence (proposed)

| Source | Initial backfill | Ongoing refresh | Trigger |
|---|---|---|---|
| Facebook Ads | Last 90 days | Daily 3:00 AM ET per org | scheduler.ts cron |
| Google Ads | Last 90 days | Daily 3:15 AM ET per org | scheduler.ts cron |
| GA4 | Starts now (no historical) | Daily 3:30 AM ET per org | scheduler.ts cron |
| Envision | TBD by export format | Daily or hourly TBD | scheduler.ts cron |

90 days = "knock their socks off" Serra-pipeline-style reports + buffer. Operator can request deeper backfill (Facebook supports up to ~37 months; Google Ads multi-year) after first dashboards are live.

---

## 6. Reporting + UI surface (in Marketing section)

**Tier 1 (week 1 of v2.3):**
- Per-org "Marketing Sources" overview card: spend / clicks / leads attributed by source last 30 days
- Per-source drill-down: campaign-level table with daily-trend sparklines

**Tier 2 (week 2-3):**
- Cross-source attribution table (Facebook + Google Ads → leads → appointments → showed → sold)
- "Pipeline report" — the kind operator built manually for Serra. Replicate it from real data.

**Tier 3 (when Envision lands + when GA accumulates >30 days):**
- GA4 session → form-submit → lead funnel
- Envision unified audience segment performance

---

## 7. Coupling to VIN Solutions Excel reports (Workstream B prereq)

The Excel reports Duran will upload contain lead-level outcome data (won/lost, sold, gross). When that data lands in the warehouse and gets joined to `marketing_daily_metrics` via `marketing_attribution_links`, the pipeline report becomes possible. **Without Excel data, Tier 2 attribution stays speculative.**

Sequence:
1. Duran uploads Excel reports → file inventory (Workstream B output) → import script for `vin_solutions_lead_outcomes` table
2. Match `vin_solutions_lead_outcomes.lead_id` ↔ `leads.id` (likely via `external_lead_id`)
3. Match leads ↔ marketing campaigns via UTM params, FB click ID (fbclid), GCLID, or `lead_source`
4. Aggregate at `marketing_daily_metrics` daily-rollup granularity

---

## 8. Pre-execution checklist for v2.3 implementation phase

- [ ] Confirm warehouse strategy decision (recommended Option A above) with operator
- [ ] Resolve Envision data shape question (API vs export? Schema unknown)
- [ ] Confirm OAuth flow approach for each Google product (one app vs per-store apps)
- [ ] Schema review against `shared/schema.ts` style
- [ ] Per-store ad-account-ID mapping table populated (operator data entry)
- [ ] Credential storage decision (`org_integrations` reuse vs `marketing_credentials` new table)
- [ ] Scheduler cron capacity check (existing crons don't compete for the 3:00-3:30 AM window)

---

## 9. Out-of-scope for this strategy doc

- Per-source UI mockups (frontend design exercise)
- Server-side cost analysis (Supabase egress + API quotas per source)
- ML/attribution modeling (Phase 5 work, not v2.3)
- Replacement of operator's manual Serra pipeline report — that's the OUTCOME of this work, not the work itself

---

## 10. Backlog handoff

This doc should be referenced from one backlog entry:

- `BL-???-2026-05-12-MARKETING-INGESTION` — "Marketing-data ingestion (Facebook + Google Ads + GA4 + Envision) → marketing schema → Marketing-section dashboards. See evidence/recon-2026-05-12-live-health/marketing-ingestion-strategy.md."

Pairs with existing `BL-002` (Marketing Insights data + reports). Recommend treating BL-??? as the INGESTION half and BL-002 as the REPORTING half — both v2.3 phase, dependent on each other.

---

**END OF STRATEGY DRAFT** — operator review required before any implementation work begins.
