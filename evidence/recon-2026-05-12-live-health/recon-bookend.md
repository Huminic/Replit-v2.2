# Recon side-sprint — 2026-05-12 live-instance health + Excel-report intake + marketing-ingestion strategy

**Phase:** side-sprint (NOT a numbered wave — does NOT belong to the launch sequence)
**Branch:** `wave/11-gov/11A-final-e2e` (current; recon writes evidence/ only, no app code)
**Reason:** Operator surfaced three workstreams while waiting on their TextMagic dashboard URL fix:
1. **CRITICAL:** Audit live (`becb739`) for the post-launch features they were told are working — Serra called and asked a "weird question" about whether SMS follow-up was firing for all three stores; report due to Serra tomorrow night
2. Scope the VIN Solutions Excel reports Duran is going to start uploading (data-warehouse augmentation strategy)
3. Plan third-party marketing ingestion (Facebook Ads, Google Ads, Google Analytics, Envision)

Plus memorialize the side-sprint so it doesn't bleed into Wave 11A context.

---

## OPENING (2026-05-12T~13:00Z)

### Posture safeguards

| Guardrail | Implementation |
|---|---|
| Wave 11A stays sacred | NO edits to app code; NO branch switch; recon-bookend goes in `evidence/recon-2026-05-12-live-health/` on the same Wave 11A branch (clean — no overlap with Wave 11A launch artifacts) |
| No real provider sends | All probes are read-only: DB queries against shared Supabase + provider dashboard inspection (operator-side) |
| Backlog hygiene | Workstreams B + C land as `BL-???` entries pointing at separate docs; A surfaces issues via `issues.md` if any live regressions found |
| Lean execution | 3 agents only — qa-evaluator + integration-safety (persistent team) + 1 one-shot Explore scout |
| Filesystem-boundary | Reads outside `~/Claude-store/nexxus2.2_replit/` are OK (recon); NO writes outside this project |

### Critical context — live state

**Live container:** `becb739` (PR #6 merge — P0 routing redirect fix, 2026-05-01).

**Features operator named that ARE on live (verified by `git merge-base --is-ancestor` against `becb739`):**

| Feature | Commit (in live ancestry) |
|---|---|
| Trigger 1 immediate after-hours follow-up (non-Nexxus VIN leads) | `5a9fd3b` feat(triggers): Trigger 1 immediate VIN-lead follow-up + business-hours midnight fix |
| Trigger 1 dedup + activity-log fix | `66d80ff` fix(triggers): Trigger 1 dedup + activity-log awaited |
| `queued_immediate_trigger_sms` scheduler handler | `2bfb878` feat(scheduler): handler for queued_immediate_trigger_sms |
| 24h check-in (configured per-org, fires from triggerService) | merged via PR #1 ancestry |
| Daily recap email to org admins | `5d04049` feat(notifications): daily recap email + SMS appointment-intent admin email |
| SMS appointment-intent admin email | `5d04049` (same commit) |
| TextMagic webhook relax (no signing header) | `f305f12` fix(textmagic): relax webhook verify when no signing header |
| Scheduler/outbound hardening | `50c5377` (I-248, I-252, I-253, I-254) |

**Conclusion:** the live code has the features the operator described. If something is broken, it's NOT because the feature is missing from live — it's a runtime / data / config issue. That narrows the investigation scope.

**Features in `batch-1-finish-line` but NOT yet on live (the upcoming v2.2 deploy):**
- 11 waves of work — see Wave 11A bookend for the full changeset

### Workstream registry

| Stream | Owner | Type | Output path |
|---|---|---|---|
| **A1** | qa-evaluator (team) | Live DB inspection — follow-up feature fires last 7 days, all 7 orgs | `evidence/recon-2026-05-12-live-health/A1-db-followup-audit.md` |
| **A2** | integration-safety (team) | Provider boundary health — outbound_logs / Resend / TextMagic / VAPI | `evidence/recon-2026-05-12-live-health/A2-provider-health.md` |
| **A3** | orchestrator | Code-archaeology — features-on-live verification (THIS DOC, section above) | Inline in this bookend |
| **B** | Explore (one-shot) | VIN Excel-report location + column inventory | `evidence/recon-2026-05-12-live-health/B-vin-excel-inventory.md` |
| **C** | orchestrator | Marketing-data ingestion strategy | `evidence/recon-2026-05-12-live-health/marketing-ingestion-strategy.md` + `BL-???` |
| **D** | orchestrator | Memorialize (THIS DOC) + CLOSING + backlog/issues entries | This file, CLOSING section |

### Two deltas of proof (per workstream)

| Workstream | Δ1 | Δ2 |
|---|---|---|
| A1 | DB row-count summary across last 7d per feature × per org | Sample lead-flow timeline tracing one lead from intake → follow-up fire → delivery confirmation |
| A2 | outbound_logs status breakdown by provider/status | One specific failure cluster with provider dashboard cross-check |
| B | File inventory + sheet/column listing | Sample-row preview for one report (gap-vs-API analysis) |
| C | (strategy doc, not test-evidence) | n/a — design artifact |

### Carry-forward filing rules

- Live regression discovered → `issues.md` entry as `I-NEW-2026-05-12-<topic>` + immediate operator notification
- Backlog item discovered → `backlog.md` entry as `BL-???-recon-2026-05-12-<topic>`
- Decision pending operator input → flagged in CLOSING for operator review

### Out of scope for this side-sprint

- ANY app-code edits (this is recon only)
- ANY real provider send (read-only inspection)
- ANY data-warehouse setup work (strategy only; execution in v2.3+)
- ANY change to Wave 11A artifacts

### Constraint reminders carried over

- Operator's training is Friday 2026-05-15 (3 days)
- Serra report due tomorrow night (2026-05-13)
- Wave 11A still awaiting operator's TextMagic dashboard fix + GO
- Live container is on `becb739`; v2.2 launch will move it to post-PR-merge

---

## CLOSING (2026-05-12T~14:30Z)

### Headline finding

**SMS follow-up is NOT firing for real customers on ANY of the 3 Serra stores.** The operator told Serra "yes it's working for all 3 stores"; the database disagrees. This is the answer to the "weird question" — they noticed the silence.

### Bottom-line evidence (last 7 days on live)

| Question Serra asked | DB answer |
|---|---|
| Is SMS follow-up firing for Serra Honda? | NO — `checkInTriggerEnabled=true` but `triggerTestPhones` whitelist gates ALL sends to one Pittsburgh-area-code test phone. Zero real-customer fires |
| Is SMS follow-up firing for Serra Nissan? | NO — `checkInTriggerEnabled` UNSET. Triggers have NEVER fired for this org. Also: **no `textmagicPhone` configured at all** |
| Is SMS follow-up firing for Tony Serra Ford? | NO — same as Nissan |
| Are inbound SMS replies reaching live? | NO — 27 days of silence on real-customer inbound (last 2026-04-14). TextMagic dashboard URL still pointing at dev (returns 503) — already the known `I-NEW-2026-05-07-TEXTMAGIC-URL` |
| Are daily recap emails firing? | NO — `dailyRecapEnabled` UNSET for ALL 7 orgs. Scheduler has NEVER claimed a `daily_recap_*` lock since deploy |
| Is Caroline widget-chat auto-greeting responding? | NO — 106 blocked sends in 14d on serra-honda widget visitors. Visitors getting silence |

### Root causes (2 layers)

**Layer 1: Runtime gate (Coolify env)**
- `TESTLANE_MODE=true` is suspected on live PM2 container `phqqzjj5pal13wlp39m5ohx6-…`
- Every real-customer-bound send is fail-closed blocked
- **Verify by:** operator logs into Coolify, inspects container env, confirms TESTLANE_MODE value
- **Fix:** flip to `false` + restart container

**Layer 2: Per-org settings (DB config)**
- serra-honda has `triggerTestPhones: ["+14126546500"]` whitelist still active
- serra-nissan + tony-serra-ford have NO `textmagicPhone` and ALL trigger flags unset
- `dailyRecapEnabled` unset on all 7 orgs
- Fix: 5 DB UPDATEs to `organizations.settings` JSONB

**Layer 3: Daily-recap scheduler (code)**
- No `daily_recap_*` row in `scheduler_locks` ever
- Suggests scheduler module never registered OR registration silently failed
- Requires code investigation, may need redeploy

### Workstream results

| Stream | Output | Status |
|---|---|---|
| A1 — live DB follow-up audit | `A1-db-followup-audit.md` | DONE — qa-evaluator FAIL verdict |
| A2 — provider boundary health | `A2-provider-health.md` | DONE — integration-safety YELLOW (RED on TextMagic + SMS provisioning) |
| A3 — code archaeology | folded into OPENING above | DONE |
| B — VIN Excel inventory | `B-vin-excel-inventory.md` | DONE — HIGH-VALUE feed; recommend formal v2.3 backlog |
| C — marketing-data ingestion strategy | `marketing-ingestion-strategy.md` | DONE — strategy draft, recommend Option A for v2.3 |
| D — memorialize (this doc) | this CLOSING | DONE |

### New issues filed (see issues.md)

1. `I-NEW-2026-05-12-A-TESTLANE-LIVE` — TESTLANE_MODE suspected `true` on live container (needs Coolify verification + flip)
2. `I-NEW-2026-05-12-B-SERRA-HONDA-TESTPHONES` — `triggerTestPhones` whitelist still active on serra-honda gating real customer fires
3. `I-NEW-2026-05-12-C-NISSAN-FORD-SMS-UNPROVISIONED` — serra-nissan + tony-serra-ford have no `textmagicPhone` and all trigger flags unset
4. `I-NEW-2026-05-12-D-DAILY-RECAP-NEVER-FIRED` — scheduler hasn't claimed lock since deploy; code-level investigation required
5. `I-NEW-2026-05-12-E-RESEND-OUTBOUND-LOG-BYPASS` — weekly_report / auto_greeting sends to Resend bypass `outbound_log` writes (audit-trail integrity, NOT delivery failure)
6. `I-NEW-2026-05-12-F-CAROLINE-WIDGET-BLOCKED` — 106 widget-chat auto-greetings blocked in 14d (downstream of Layer-1 TESTLANE_MODE; resolves when Layer 1 does)
7. `I-NEW-2026-05-12-G-CAROLINE-SCHEDULER-BURSTS` — Caroline scheduler emits sub-second bursts (6+ in a single second); unthrottled loop concern if TESTLANE_MODE flips off without throttle review

### Backlog items filed (see backlog.md)

1. `BL-???-2026-05-12-VIN-EXCEL-INGESTION` — VIN Solutions Excel report ingestion → data warehouse (pairs with BL-002)
2. `BL-???-2026-05-12-MARKETING-INGESTION` — Facebook + Google Ads + GA4 + Envision ingestion (pairs with BL-002)

### What this means for the Serra report tomorrow night

**The operator cannot accurately tell Serra "everything is working."** The truthful report is:

1. We discovered the SMS follow-up gate during pre-launch verification. The features are deployed (v2.1 code on live) but two layers of test-mode safety are still active, plus configuration was completed for Honda only (and incompletely there)
2. We have a configuration-only remediation path that fixes the visible issues without a code redeploy
3. The TextMagic dashboard inbound URL fix (operator's known fix-today item) is part of the picture but ONLY part — even after that fix, real-customer outbound won't flow until the Coolify env + per-org settings are resolved
4. Daily recap is a separate, code-level issue requiring investigation

**Pivoted-launch question for v2.2:** when we ship `batch-1-finish-line` → live tonight, the new container will INHERIT the same Coolify env (TESTLANE_MODE), so the Layer-1 issue carries over unless we flip the env BEFORE/DURING the deploy. The Layer-2 settings persist in the DB so they need separate fixes. **Worth coordinating the launch + the config-fix push as one operation.**

### Risks / blockers

| Risk | Mitigation |
|---|---|
| Operator flips TESTLANE_MODE → real customer flood from Caroline scheduler (OOS-2 finding) | Verify scheduler throttle BEFORE flipping (read code path); consider keeping Caroline disabled at first |
| Per-org DB updates affect production | Operator approval per CLAUDE.md; can rollback by reverting JSONB to prior value |
| Daily-recap code fix requires v2.2.x patch deploy | Defer; the operator may decide it's acceptable to ship without daily recap and follow up |

### Operator decisions outstanding

1. Authorize Coolify env inspection + TESTLANE_MODE flip
2. Authorize per-org `organizations.settings` UPDATEs (3-5 rows depending on scope)
3. Decide whether daily-recap fix is launch-blocking or v2.2.x follow-up
4. Whether to coordinate v2.2 deploy with the config-fix push (recommended) or do them separately
5. File the 2 BL-??? backlog entries as proposed
6. Acknowledge new I-NEW issues filed

### Next recommended action

**Operator:** before flipping TextMagic dashboard URL or merging Wave 11A PR, read `evidence/recon-2026-05-12-live-health/A1-db-followup-audit.md` and `A2-provider-health.md` and decide remediation order.

**Orchestrator (me):** stand by for operator decisions. NO autonomous execution on the config fixes — every item requires explicit approval per CLAUDE.md.

---

## Two deltas of proof (recon side-sprint, summary)

| Delta | Path | Result |
|---|---|---|
| Δ1 — qa-evaluator DB matrix (per-org × per-feature fire counts) | `A1-db-followup-audit.md` § Δ1 | FAIL — zero real-customer fires |
| Δ2 — qa-evaluator + integration-safety lead-flow timeline | `A1-db-followup-audit.md` § Δ2 + `A2-provider-health.md` § Δ2 | Chain works for TESTLANE probe only; broken for real customers |

---

**CLOSING TIMESTAMP:** 2026-05-12T~14:30Z
**Side-sprint state:** COMPLETE
**Audit trail:** committed to wave/11-gov/11A-final-e2e branch (recon evidence only; no Wave 11A artifacts touched)
