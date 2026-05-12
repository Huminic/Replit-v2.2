# Workstream B — VIN Solutions Excel Reports Inventory + Reporting Advantage

**Date:** 2026-05-12
**Owner:** Explore scout (location) + orchestrator (column analysis)
**Status:** characterization complete on existing sample reports (dated 2025-08-06)

---

## Files located

Path: `/home/ubuntu/Claude-store/nexxus/docs/uploads/Serra Auto Group Sample Reports/`

| File | Size | Date | Report type |
|---|---|---|---|
| `Honda 90 days LeadSourceROI_2025-08-06.xlsx` | 28 KB | 2025-08-06 | Lead Source ROI (per-store, per-source rollup) |
| `Ford 90 dayLeadSourceROI_2025-08-06 (3).xlsx` | 25 KB | 2025-08-06 | Lead Source ROI (per-store, per-source rollup) |
| `Nissan 90 day ROI.xlsx` | 22 KB | 2025-08-06 | Lead Source ROI (per-store, per-source rollup) |
| `CAGE_KPI_Key_Performance_Indicators__MTD_Report_All_Stores_2025-08-06.xlsx` | 19 KB | 2025-08-06 | All-Stores KPI MTD (cross-store, per-user) |

**Exported By:** Durran Cage ("Duran") — confirmed via metadata sheet in CAGE KPI file
**Run date on sample:** Aug 6 2025 1:18 PM
**Sample window:** "Previous Month" = July 2025

There are ~13 timestamped duplicates in `Sample_Unstructured_Data/` and `attached_assets/` folders within the nexxus project — same shape.

**No raw lead-list Excel exports** (LeadID, CustomerName, CustomerPhone, etc.) are present anywhere on the filesystem. These existing samples are aggregations, not row-level lead detail.

---

## Schema — Lead Source ROI report (Honda / Ford / Nissan)

Each report is ONE worksheet, structure:
- **Rows:** one row per lead source (~80 sources × 1 store)
- **Columns (40 metrics per row):**

| Group | Columns |
|---|---|
| Lead Source identification | `Lead Source` |
| Volume | `Total Leads`, `Good Leads`, `Bad Leads`, `Duplicate Leads`, `Bad Other Leads`, `Customers Influenced` |
| Conversion | `Sold in Timeframe`, `Sold in Timeframe %`, `Sold from Leads`, `Sold from Leads %`, `Avg Days to Sale` |
| Contact effort | `Internet Attempted Contact`, `Internet Attempted Contact %`, `Internet Actual Contact`, `Internet Actual Contact %`, `Internet Avg Attempts to Contact` |
| Appointment funnel | `Appts Set`, `Appts Set %`, `Appts Scheduled`, `Appts Scheduled %`, `Appts Confirmed`, `Appts Confirmed %`, `Appts Shown`, `Appts Shown %`, `Avg Days to Appt Set` |
| Visits | `Total Visits`, `Initial Visits`, `Be Back Visits`, `Avg Days to Initial Visit`, `Avg Days Initial Visit to Be Back` |
| Gross / financial | `Total Front Gross`, `Avg Front Gross`, `Total Back Gross`, `Avg Back Gross`, `Total Gross`, `Avg Gross`, `Total Cost`, `Cost Per Good Lead`, `Cost Per Sold`, `Profit` |

**Lead source examples (counts per file):** Honda has ~84 sources, Ford ~79, Nissan ~79. Common: AutoTrader.com, Cargurus, Edmunds, Truecar (with sub-channels like Sams Club, U.S. News, Perks At Work, Penfed, Beneplace, Intuit Credit Karma), Newsletter, Walk In, Repeat Customer, Referral, Dealers WebSite, Local Customer, Phone Up, Service Dept. Plus OEM-specific lead types (Honda: "Honda Website", "Hds Program Lead..."; Ford: "Fd - Oem Quick Quote", "Dc Credit App Ford"; Nissan: "Nissanusa - Configuration Build", "Nissan Third Party Lead").

## Schema — CAGE KPI All-Stores MTD Report

ONE worksheet, hierarchical:
- **Header columns:** `Dealer`, `Lead Type`, `User`, `Internet Leads`, `Internet Leads Sold %`, `Internet Actual Contact`, `Internet Actual Contact %`, `Appts Set`, `Appts Set %`, `Appts Shown`, `Appts Shown %`, `Appts Shown Sold`, `Appts Shown Sold %`, `Calls Out`, `Emails Out`, `Texts Out`, `Total Comms`
- **Row grouping:** Dealer → Lead Type (Internet, ADF/XML, etc.) → User (salesperson)
- **Stores covered:** Serra Honda of Sylacauga, Serra Nissan of Sylacauga, Tony Serra Ford
- **Salespeople enumerated:** Honda (12: Brayson Reynolds, Eddie Jones, Elaine Day, Gunner Hertenstein, Jeremiah Town, John Bruce, Lee Burns, Michael Moore, Rachel Hertenstein, Shelby Dew, Stephen Wheeler, Tim 'Colton' Craft); Nissan (3: James Landrum, Marty Hamlet, Paul Bonner); Ford (2: Austin Male, Greg McDonald). Plus a TOTAL row.
- **Embedded metadata sheet:** Filter Name + Number Selected + Selected Values structure — Date Range, Lead Status Types (Active/Lost/Sold), Inventory Types (Certified/New/Unknown/Used), Appointment Reasons, etc.

---

## Reporting advantage assessment

### What Nexxus has TODAY (from VIN API + native data)

| Data | Coverage today |
|---|---|
| Lead row-level (intake, status, source attribution) | ✅ via VIN sync (`server/services/triggerService.ts`) + `leads` table |
| Conversation history per lead | ✅ via `conversations` / `messages` |
| Trigger fires + activity log | ✅ via `activity_log` |
| Outbound communication counts (SMS / call / email) | ✅ via `outbound_logs` per provider |
| Appointment data | ✅ via `appointments` if synced |
| Funnel conversion % | ⚠️ partial — depends on which VIN fields are synced |
| Gross / financial / cost per lead | ❌ NOT synced from VIN — typically lives in DMS, not CRM |
| Profit per lead source | ❌ same gap |
| Salesperson-level KPI rollup with `Calls Out`, `Emails Out`, `Texts Out`, `Total Comms` per user | ⚠️ partial — we have outbound_logs but not always tagged to user-ID consistently |

### What the Excel reports add

**The killer gap they fill: gross/cost/profit per lead source.** That's the single most powerful piece of executive-grade reporting and it's the missing layer in our API integration. Combined with our row-level lead data, we can compute:

1. **ROI per source over any window** — we have the conversion funnel; Excel adds the dollar denominator
2. **Cost per Good Lead** and **Cost Per Sold** per source — directly from Excel; not derivable from API alone
3. **Profit attribution per source** — direct from Excel
4. **User-level performance benchmarking** — CAGE KPI's per-salesperson roll-up
5. **Cross-store comparison** — CAGE KPI gives all-three-stores side-by-side

### What 2 months of fresh Excel data would unlock

The operator described uploading Duran's pulls covering the last 2 months. Given the schema above, this enables:

| Capability | How |
|---|---|
| **Pipeline report (Serra-style) on real data** | Join `marketing_daily_metrics` (Workstream C) ↔ `vin_lead_outcomes` from Excel ↔ `leads` from API → full funnel from spend → impression → click → lead → contact → appt → shown → sold → gross |
| **Source-level break-even alarms** | Identify any source where `Cost Per Sold` > acceptable threshold; alert in Marketing section |
| **Salesperson ranking** | CAGE KPI gives Internet Leads Sold % + Appts Shown Sold % per user → leaderboard per store |
| **Source consolidation recommendation** | Identify long-tail Truecar sub-sources (Sams Club / Perkspot / Beneplace etc.) and rank by ROI — potential for Marketing-section budget reallocation pitch |
| **Time-series profit trend** | Stack 2 months of monthly Excel pulls → trend chart per source |
| **Anti-fraud detection** | Track `Bad Leads %` and `Duplicate Leads %` per source over time; flag deteriorating sources |

### Proposed import path

For v2.3+ (NOT for v2.2 launch):

1. New table `vin_excel_lead_source_roi` — one row per (org × source × snapshot_date) with the 40 columns above
2. New table `vin_excel_kpi_mtd` — one row per (org × user × snapshot_date) with the CAGE KPI columns
3. Ingest job: `server/services/vinExcelIngest.ts` — watches a designated upload directory (or S3 bucket), parses Excel via `xlsx` npm package, idempotent upsert by (org, source, snapshot_date) or (org, user, snapshot_date)
4. Trigger UI in Marketing section: "Upload latest Duran export" → multipart form → server-side parse → preview → confirm → commit
5. Reporting layer reads joined view of (API lead data ↔ Excel rollup ↔ marketing_daily_metrics ↔ outbound_logs)

### Operator action items

- **Have Duran pull fresh exports for the last 2 months** (Lead Source ROI per-store + CAGE KPI All-Stores MTD) and upload them. Confirm the upload destination — recommend `~/Claude-store/nexxus2.2_replit/uploads/vin-excel-imports/` or an SFTP path at `~/filestore/vin-excel-imports/`.
- **Optionally:** ask Duran to also pull the same reports for the same months in 2024 — gives YoY comparison capability immediately.
- Decide whether v2.3 should support automated VIN-side report SCHEDULED export (VIN Solutions has scheduled-report functionality) vs operator-uploads-manually. Manual upload is faster to ship and gives Duran control of the cadence.

---

## Verdict

**HIGH-VALUE FEED.** The 4 report types (3 per-store Lead Source ROI + 1 all-stores CAGE KPI) close the API-only blind spot on gross / cost / profit, and add salesperson-level KPI rollup that Nexxus only has partially today. Two months of fresh data turns Marketing-section reporting from "lead activity tracking" into "executive-grade ROI dashboard". 

**This is a strong differentiator** for the Serra knock-their-socks-off pitch — combining live Nexxus engagement metrics (calls/SMS/AI conversations) with the Excel rollup means we report on things that pure VIN Solutions can't, AND with the financial layer they expect.

**Recommendation:** add VIN Excel ingestion as v2.3 scope alongside the marketing-data ingestion (Workstream C). Both feed the same Marketing-section dashboards. File `BL-???-2026-05-12-VIN-EXCEL-INGESTION` paired with `BL-002`.
