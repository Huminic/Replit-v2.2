# TRG-RPT-001 Pre-Execution Report

**Sprint:** TRG-RPT-001 — Trigger Activation + Response Handling + Weekly AI Executive Report
**Date:** 2026-04-20
**Operator Authorization:** "I would like to get the triggers going... I also want to introduce a weekly email that sends an ai analysis to the customer about high value data... I need sticky ideas but not annoyances. Real actionable AI value. So yes I agree with your suggestions with my modifications above for next sprint, then we test live end to end with real evals, no shortcuts or assumptions so include it in the sprint." (operator, 2026-04-20 during ADF wrap-up conversation)

**Branch:** wave-pe3
**Depends on:** ADF-001 (committed, retroactive — e85248b + 2af3eaf)

---

## Objective

Activate the SMS trigger system at all 5 dealerships, handle customer responses to those triggers with proper routing and escalation, add Settings UI for trigger configuration, and ship a weekly AI executive report (Monday 7am per store timezone) with a QA gate that blocks unsafe sends. All gated by real end-to-end evals — no shortcuts, no mocks.

Measurable outcomes:
- External lead arrives after hours → immediate engagement SMS (whitelist phase first, then go live)
- All qualifying leads at 24h age → follow-up SMS exactly once
- Customer replies routed to TeamBox + admin notified
- Weekly report delivered Monday 7am with QA gate blocking unsafe content
- Partner admin receives single email grouping their customer stores
- Humble AI tone with interstitial feedback messaging

## Test Plan

### Jest / Vitest (unit)
- `npm run test -- triggerService.eligibility` — vin_created_at age math, origination classifier, defer-queue behavior
- `npm run test -- weeklyReport.validator` — QA gate pass/fail cases
- `npm run test -- weeklyReport.content` — aggregation shape, score math, humble tone presence

### Playwright E2E (real browser, real DB)
- `npx playwright test tests/e2e/settings-triggers.spec.ts` — Triggers section visible for org_admin, edit + save round-trip
- `npx playwright test tests/e2e/trigger-response.spec.ts` — inbound SMS → TeamBox routing + admin notification
- `npx playwright test tests/e2e/weekly-report-preview.spec.ts` — Settings preview renders last report

### Live E2E (real third-party integrations — no shortcuts)
- Live VAPI call at Serra Honda dev phone → ADF email in Resend logs → VIN lead appears
- Live whitelisted trigger SMS via TextMagic to operator phone (external after-hours + 24h check-in paths)
- Live weekly report email from Resend to operator's inbox
- Manual walkthrough: AI chat, TeamBox, Insights as `columbia_hyundai@huminic.ai`

### Halt Points (operator approval required)
| Gate | What Happens | Operator Sees First |
|------|--------------|---------------------|
| H-A1 | SMS template wording (24h + after-hours) | Exact text, draft variants |
| H-A2 | First trigger enable at Serra Honda with whitelist | Whitelist phones, expected sends |
| H-D1 | Weekly report content format | Sample rendered HTML + plain-text |
| H-D2 | QA gate failure behavior | Alert template to super_admin |
| H-F1 | Operator first test send | Live sample to operator's inbox |
| H-I1 | Remove whitelist / go live | Summary of what sends, to whom, when |

No permanent or externally visible action executes without operator preview and explicit "go."

## Declared Files

### Backend
- server/services/triggerService.ts
- server/services/leadSource.ts
- server/services/weeklyReportService.ts
- server/services/scheduler.ts
- server/services/notificationService.ts
- server/routes/settings.ts
- server/routes/sms.ts
- server/routes/insights.ts

### Frontend
- client/src/pages/settings.tsx

### Shared
- shared/schema.ts

### Tests
- tests/unit/triggerService.eligibility.test.ts
- tests/unit/weeklyReport.validator.test.ts
- tests/unit/weeklyReport.content.test.ts
- tests/e2e/settings-triggers.spec.ts
- tests/e2e/trigger-response.spec.ts
- tests/e2e/weekly-report-preview.spec.ts

## UI Changes

Settings page gets a new Triggers section (org_admin+ only):
- Business hours picker (start/end, timezone inherited from org)
- Test-phone whitelist (array of phone numbers)
- Enable toggles: after-hours immediate, 24h check-in
- SMS template editor with operator-approved defaults
- Weekly report sub-section: enable/disable, test recipient, preview last report

No other UI changes. All other Settings sections untouched. No changes to chat, teambox, sales, service, insights, or main navigation.

## Acceptance Criteria

Copied verbatim from sprints.json. Each must pass with real E2E evidence (not mocks, not UI-only navigation):

1. External lead arrives after hours → immediate engagement SMS delivered (whitelist phase first)
2. All qualifying leads at 24h age → follow-up SMS delivered exactly once (duplicate prevention verified across two cycles)
3. Customer replies to trigger SMS → response routed to TeamBox; admin notified (yes / no / call-me / silence cases)
4. Weekly report delivered Monday 7am per store timezone
5. Weekly report QA gate blocks send when validation fails; alerts super_admin
6. Weekly report content: untouched leads list (with names), 24h+ no-attention leads, ghosted leads, weekly activity summary (inbound calls, leads synced, ADF delivered, triggers fired, notifications sent, escalations), start-of-week priorities, AI narrative 2–3 paragraphs, 0–100 sales team score with commentary, humble tone + interstitial feedback messaging
7. Partner admin receives single email with all customer stores sectioned
8. Partner admin grouping verified: Serra Auto = Serra Honda/Nissan/Tony Serra; Columbia Auto = Hyundai of Columbia/Ford of Columbia
9. Operator receives test weekly report before any org_admin (first cycle sends only to operator)
10. Real E2E evals pass without shortcuts: live ADF delivery, live trigger SMS to whitelist, live weekly email, AI chat + TeamBox + Insights as org_admin

## Execution Plan (phased)

- Phase A — Trigger bug fixes (synced_at → vin_created_at, isNexxusOriginatedLead URL-vs-name, after-hours DEFER→SEND next window, enable toggles)
- Phase B — Response outcome handler (yes / no / call-me / silence → TeamBox + admin notifications)
- Phase C — Settings UI for trigger config
- Phase D — Weekly AI executive report generator + QA gate + scheduler
- Phase E — Partner-admin roll-up + DB grouping verification
- Phase F — Operator first-test send
- Phase G — Enable triggers at one store with whitelist; verify
- Phase H — Real E2E evals
- Phase I — Go live all 5 stores; remove whitelist

## Not In Scope

- Security items I-244 through I-249 (IDOR, AI prompt write, role escalation, org slug write, timezone crash, self-deactivation) — deferred to dedicated post-launch security sprint
- Governance hardening BL-096 through BL-100 (declared-files enforcement, stronger [skip-ghost], external-send gate, drift watchdog, retroactive registration protocol) — deferred to GOV-* sprint
- Any UI changes outside the Settings Triggers section
- Changes to chat, teambox, sales, service, insights, main navigation
- TCPA bypass reintroduction (permanently out of bounds)

## Scope Addendum — 2026-04-20T04:30Z

Builder halted Phase A kickoff on three spec questions. Operator ruled (2026-04-20, during Phase A dispatch follow-up):

### Q1 — TCPA window fields

`org.settings.tcpaStartHour` / `org.settings.tcpaEndHour` do not exist in the codebase. Operator added them to org.settings JSON (no schema change — settings is `jsonb`). Default 8 / 21 per **47 CFR 64.1200(c)(1)** (federal TCPA — not a guess; federal standard). Per-org override permitted for stricter states. `businessHoursStart` / `businessHoursEnd` remain the dealer staffing window. Codes separately gate:
- **After-hours immediate send** is allowed when: current time ∈ [tcpaStart, tcpaEnd) AND ∉ [businessStart, businessEnd) → SEND now.
- **Scheduled queue** is required when: current time ∉ [tcpaStart, tcpaEnd) → write `trigger_after_hours_deferred` to activity_log with `metadata.scheduled_for` = next tcpaStart in org TZ. A new evaluation path in triggerService.ts picks up past-due scheduled entries each cycle.

### Q2 — Lead source classifier

URL→name cache exists in `server/routes/insights.ts` (`getLeadSourceMap`, `formatLeadSource`, lines 11–70) and is not importable from services. Operator approved extraction to new file `server/services/leadSource.ts`. `server/routes/insights.ts` refactors to import from the new helper (no behavior change in insights — just import rewiring). `server/services/triggerService.ts` imports from the new helper to resolve VIN lead source URL → human-readable name at classification time.

### Q3 — Sync-window width + null vinCreatedAt

- Sync lookback: **180 minutes** for `syncedAfter` in the check-in query (covers 12 scheduler cycles of slack).
- Null `vinCreatedAt`: **skip and log** (no fallback to syncedAt or createdAt). Null is a VIN sync defect; surface it, don't paper over it.

### Scope change

Added to Declared Files / sprints.json `filesModified`:
- `server/services/leadSource.ts` (NEW — extracted helper)
- `server/routes/insights.ts` (refactor to import from the new helper)

Total declared files: 14 → 16. Pre-exec's Declared Files section updated. Ghost re-review required before Phase A resumes.

---

## Scope Addendum #2 — 2026-04-20T05:30Z (Email-first reorder)

Operator (2026-04-20, late-evening directive): **start with the weekly email only, SMS triggers deferred to the next session.** No scope change at sprints.json — the 16 declared files and 10 ACs remain in force. Only execution ordering changes: Phase D (weekly report) runs first, followed by operator test send (previously Phase F). Trigger fixes and UI (Phases A–C, G) deferred.

**Tonight's working subset (5 of 16 declared files):**
- `server/services/weeklyReportService.ts` (NEW) — generator + QA validator + HTML renderer
- `server/services/notificationService.ts` — add `sendWeeklyReportEmail(orgId, recipientEmail, html)` helper
- `server/routes/settings.ts` — add `POST /api/admin/weekly-report/send-test` endpoint (super_admin gated)
- `tests/unit/weeklyReport.validator.test.ts`
- `tests/unit/weeklyReport.content.test.ts`

**Tonight's deliverable:** test email to `duane.wells@huminic.ai` (super_admin). Content = real data from staging DB for all 5 orgs, rendered in HTML that matches the existing lead notification email design, QA-gated before send. Operator reviews on wake.

**Deferred to next session:** triggerService fixes, leadSource extraction, insights refactor, sms response handler, scheduler cron, Settings UI, e2e specs.

**Operator's recipient ruling:** when live, the weekly email copies partner_admin AND org_admins (single email per partner_admin with store sections; separate per-store emails for each org_admin). Tonight only: operator (super_admin) receives the test.

**Nexxus DNA™ context:** operator shared a Genspark-generated "Dynamic Nuanced Alerts" concept document (12 alert types, impact-scored 8.2–10.0). NOT implementing DNA alerts in this sprint — stick to declared ACs. Noted for future roadmap consideration.

**Captain-check hook fix:** env recon (2026-04-20T05:20Z) confirmed Claude Code does not expose any sub-agent env signal (no `CLAUDE_AGENT_DEPTH`, `CLAUDE_CODE_SUBAGENT_ID`, or similar). Hook patched to add file-based operator bypass at `.governor/approvals/subagent-write-approved` (1-hour window), mirroring plan-protection.sh's pattern. Patched file at `/tmp/captain-check-patched.sh`; operator applied via single `cp + touch` command. Governance item BL-096 (declared-files enforcement) remains open.

---

## Ghost Entry Gate
**Reviewed by:** ghost-agent (pass 3 — post scope addendum)
**Timestamp:** 2026-04-20T05:27:10Z
**Sprint:** TRG-RPT-001
**A1 Sprint ID match:** PASS
**A2 Date header:** PASS
**A3 Operator authorization:** PASS
**A4 Objective:** PASS
**A5 Test Plan:** PASS
**A6 Declared Files format:** PASS
**A7 Not In Scope:** PASS
**A8 UI Changes accuracy:** PASS
**A9 ACs verbatim:** PASS
**A10 Files match sprints.json:** PASS — 16 entries, includes server/services/leadSource.ts and server/routes/insights.ts; pre-exec Declared Files (8 backend + 1 frontend + 1 shared + 6 tests) = 16 and matches sprints.json filesModified 1:1.
**A11 No out-of-scope writes:** PASS — git status shows no modified .ts/.tsx under server/, client/, shared/, tests/. Only governance/evidence files modified (backlog.md, plan.md, sprints.json, tasks.md, evidence logs). Untracked evidence/TRG-RPT-001/ and evidence/LAUNCH-RECON-01/adf-build/ are expected artifacts.
**A12 Halt points:** PASS
**A13 Dependencies resolved:** PASS — ADF-001 committed retroactively (e85248b + 2af3eaf) per pre-exec header; consistent with sprints.json dependsOn.
**A14 Scope Addendum consistency:** PASS — Addendum (timestamp 2026-04-20T04:30Z) documents Q1 (TCPA window fields with 47 CFR 64.1200(c)(1) rationale, default 8/21, jsonb so no schema change), Q2 (leadSource.ts extraction with insights.ts refactor as no-behavior-change import rewiring), Q3 (180-min lookback + null vinCreatedAt skip-and-log). Lists both added files, states 14→16 total, and explicitly requires ghost re-review. Both added files present in sprints.json filesModified. No contradictions with the ruling as described.

**ENTRY GATE: APPROVED**

---

## Iteration v6 Addendum — 2026-04-20 evening (layout + lead-status breakdown)

Operator directive (v6): tighten the report per live-preview feedback.
Option D approved: classifier `server/statusClassifier.ts` is OUT of scope; BL-103 stays open in backlog for a future dedicated sprint. Lead Status Breakdown section counts via direct string equality/prefix on `vinStatus`.

### Declared files (5 — v6 final)
1. `server/services/weeklyReportService.ts` — data + render changes
2. `server/services/notificationService.ts` — no change expected (confirmed)
3. `tests/unit/weeklyReport.validator.test.ts` — extend validators
4. `tests/unit/weeklyReport.content.test.ts` — extend content tests
5. `tests/integration/weeklyReport.send-live.test.ts` — no changes unless data-shape forces

### Scope (all operator-confirmed)
- **Title/store hierarchy swap.** Store name PRIMARY (big/bold), "AI Dealership Performance Analysis" SECONDARY (smaller).
- **CONFIDENTIAL** badge on eyebrow line, right-justified, pale yellow `#fbbf24`.
- **DRAFT banner** above shell, centered, `D R A F T  -  R E P O R T  -    T R A I N I N G  I N  P R O G R E S S`, color `#b5bcc9` (operator-approved).
- **Customer Follow-Up zone layout:** Ghosted (left full) · Stalled (right top) + Needs Attention vs Last Week (right bottom, stacked).
- **Biggest Losers — Top 5** replaces Needs Attention in Lead Source Performance zone (same query, top 5 drops).
- **Stalled definition locked:** `convCount === 1 AND last_message_at (fallback created_at) ∈ [now-7d, now-48h]` AND passes test-phone filter AND non-empty customer name. No `vin_created_at` filter.
- **Test-phone filter** `/^\+?1?555\d{7}$/` applied to ghosted/stalled/status-breakdown; warning emitted when N > 0.
- **New Lead Status Breakdown section** (after AI Actions):
  - Featured metric: `vinStatus === 'LOST_BAD_LEAD' AND vinUpdatedAt ∈ week`
  - Chip row (5 types): `vinStatus LIKE 'ACTIVE_%' / 'SOLD_%' / 'LOST_%' / 'BAD_%'` plus COMPLETE (interpreted as `vinStatus LIKE '%COMPLETED%' OR = 'COMPLETE'`) — all with `vinUpdatedAt ∈ week`.
- **Narratives:** "What This Week Says" references LOST_BAD_LEAD + new stalled def + ghosted+over48h; "What Moved" references Winners + Biggest Losers.
- **Validator additions:** test-phone filter drop enforcement (hard-fail if +1555\d{7} leaks to rendered output); LOST_BAD_LEAD count non-neg int; 5 chip counts non-neg ints; DRAFT banner exact-string present in HTML; CONFIDENTIAL badge present in eyebrow; Biggest Losers ≤5, all deltas negative.
- **All v5 validators retained.**

### Key assumption flagged for operator
- **Schema reality:** `warehouse_leads` has a single `vin_status` column — not separate `lead_status` / `lead_status_type`. Implementation derives the 5 chip categories by prefix on `vinStatus` (ACTIVE_*, SOLD_*, LOST_*, BAD_*) plus COMPLETE by `%COMPLETED%`/`COMPLETE` match. This preserves operator's stated behavior "LOST_BAD_LEAD is counted in LOST" (since it starts with LOST_) and keeps the featured LOST_BAD_LEAD card as its own separate metric (explicit string equality).
- **DRAFT banner color:** `#b5bcc9` — operator-approved in the v6 reply.

### Guardrails (unchanged)
- Recipient hardcoded to `duane.wells@huminic.ai` (single recipient only).
- `LIVE_SEND=1` required to trigger real sends.
- QA gate hard-stop per-store (validator failure skips that store, others continue).
- Never render "AI Lead".
- No commits. No deploys. No `npm run build`.

### HALT triggers active
- Email-safe rendering of CONFIDENTIAL badge or DRAFT banner fighting Gmail/Outlook beyond small compromises.
- Any new ambiguity discovered during implementation.

**(No separate ghost entry gate run for v6 — this is a sub-iteration under the approved TRG-RPT-001 sprint. Audit trail preserved via this dated addendum. Operator is awake and actively watching.)**

