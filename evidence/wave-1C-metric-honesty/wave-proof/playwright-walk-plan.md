# Wave 1C — Playwright walk plan (STAGED)

**Date:** 2026-05-06
**Status:** Pre-staged — ready to dispatch after operator approves build (see `build-gate-blocked.md`)
**Authority:** read-only login as a real org_admin per CLAUDE.md TEST-SAFETY ("Read-only login as a real org_admin is acceptable")

---

## Purpose

Capture screenshot evidence that **dev (port 5000) running wave-1C code** renders the new metric shape on the surfaces D-F1 corrections target. Two independent surfaces, paired with the Resend dry-run to satisfy the "two deltas of proof" rule for Wave 1C.

Pairing:
- Resend dry-run = Delta 1 (server-side render path)
- Playwright walks = Delta 2 (HTTP→browser→React-render path)

---

## Target login

| Field | Value |
|---|---|
| URL | `https://dev.huminicdev.com` (or `http://localhost:5000` if local) |
| Email | `serra_honda@huminic.ai` |
| Password | `NexxusTest2026` |
| Role | `org_admin` |
| Org | Serra Honda (UUID `24d64f99-ba04-4b43-af35-fd06f555ac86`) |

Read-only walk only. No mutations, no form submissions, no triggers.

---

## Routes to walk (two screenshots minimum each)

### 1. `/insights`

**Wave 1C surfaces affected:**
- Lib-8 lifetime win rate tile (was: dishonest 30d conv-rate)
- Dashboard win-rate tile (was: 100% on empty samples)
- Lead-source rows (was: hard-coded `trend: "flat"`)

**Verifications:**
- The "win rate" or "conversion rate" KPI shows a number that is NOT exactly `100%` AND NOT exactly `30%` and NOT obviously a 30-day-window number.
- Lead-source list does NOT show every row with the same trend indicator (the hard-coded `flat` is gone).
- No rendered `null%` or `NaN%` strings (per S5 spec, helper falls back to `0` for wire shape; tile UX still readable).

**Screenshots:**
- `01-insights-dashboard.png` — full-page or above-fold of the dashboard with KPI tiles visible.
- `02-insights-lib-8.png` — zoomed view of the lifetime win-rate tile.
- `03-insights-lead-source.png` — lead-source list section (look for varied trend indicators, not all `flat`).

### 2. `/sales`

**Wave 1C surfaces affected:**
- Sales-team leaderboard fed by `getWarehouseLeads` (S4: UPSTREAM service-lead exclusion at all 5 fetch sites).
- Sales conversion-rate column (S3: null-on-empty, no fake `0%`).

**Verifications:**
- Sales reps' lead counts do NOT include service-lead rows (lower than pre-1C; matches Wave 1B's sales-only filter behavior).
- Conversion-rate column for reps with zero leads in window shows blank / `—` / `null%` (NOT `0%` — that's the deliberate honesty fix).
  - **Known v2.3 follow-up:** `client/src/pages/sales.tsx:129` may render literal `null%` for null values. That is Wave 3F's UI fix; not a Wave 1C blocker. Document if observed.
- Total lead counts visibly reflect sales-only data.

**Screenshots:**
- `04-sales-leaderboard.png` — sales-team leaderboard with rep rows.
- `05-sales-conversion-column.png` — zoomed conversion-rate column (look for null/em-dash, not `0%`).
- `06-sales-totals.png` — page-totals section showing sales-only counts.

### 3. `/dashboard` (activity feed) — supplementary

**Wave 1C surface affected:** S2 activity-log entityType filter (excludes 'sync' and 'system' rows).

**Verification:**
- Activity feed rows do NOT include `sync_delta_completed` events or system housekeeping entries.
- Feed shows only user-attributable activity (lead created, status changed, etc.).

**Screenshot:**
- `07-activity-feed.png` — activity-feed panel.

---

## Dispatch plan

Use the `playwright-test-generator` or `nexxus-e2e-evaluator` agent (both available per CLAUDE.md harness section). Pass:
- This file as the spec.
- Target evidence dir: `evidence/wave-1C-metric-honesty/wave-proof/`.
- Headless mode unless screenshots demand non-headless.

Save screenshots in PNG format with the naming above. Save a markdown summary `walk-summary.md` in the same dir noting:
- Each verification PASS / FAIL / DEFER (with reason).
- Browser, viewport, timestamp.
- Any unexpected console errors (non-`null%` related).

---

## Halt conditions

STOP and report (no autonomous workaround) if:
- Login fails for `serra_honda@huminic.ai` — could indicate Wave I-Auth issue or env regression.
- Any `/insights` surface 500-errors — wave broke a server route.
- KPI tiles render `100%` (the dishonest pre-1C value) — wave change did NOT take effect (build/restart issue).
- Server console (`pm2 logs nexxus-app`) shows uncaught exceptions during the walk.

---

## Authority

Read-only login as a real org_admin is **autonomy-allowed** per CLAUDE.md TEST-SAFETY. No per-action approval needed for the walk itself. Sequence dependency: build approved → pm2 restart → walk.
