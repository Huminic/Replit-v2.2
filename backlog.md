# Nexxus v2.2 — Backlog

Per standards at `~/Claude-store/sysadmin/governance-framework/file-standards.md`:

- Plain markdown. One item per entry. Four fields: Objective, Scope, Done looks like, Constraints.
- No IDs, statuses, dependsOn, filesModified, UI permissions, execution steps.
- Captain organizes. Grouping by tier, theme, or urgency is captain's call.
- Items leave the backlog when they ship (move to session-output.md) or when operator removes them.

Sequencing, phases, and deadlines live in `plan.md`.

## Template

```markdown
### <short name>

- **Objective:** <one sentence>
- **Scope:** <files, surfaces, systems>
- **Done looks like:** <plain English>
- **Constraints:** <non-obvious restrictions; "none" is fine>
```

---

## Items

Organized by phase (per plan.md). Within a phase, sprints run in listed order unless explicitly parallel.

---

## Phase 1 — Foundation

### Sprint 1.1 — Governance + plan closure

- **Objective:** plan.md and backlog.md populated; governance standards doc referenced from project; PersonaBox adoption prompt drafted; commit.
- **Scope:** `CLAUDE.md`, `backlog.md`, `plan.md`, `~/Claude-store/sysadmin/governance-framework/file-standards.md`.
- **Done looks like:** Standards doc exists and is referenced in Nexxus CLAUDE.md. Backlog.md conforms. plan.md exists, readable, populated. Committed to wave-pe3. PersonaBox child prompt delivered to operator.
- **Constraints:** No code changes to app. Standards doc change touches sysadmin (outside Nexxus project root) — operator-authorized exception to file-boundary.

### Sprint 1.2 — Codebase validation sweep (autonomous overnight)

- **Objective:** Produce a comprehensive, current-state inventory of every UI-declared feature with verdict (working/partial/broken/missing) and cross-reference to open issues.
- **Scope:** `evidence/QA-S0/feature-map.md` + `evidence/U-001/state-enumeration.md` as source of truth. Read source code under `client/src/` and `server/routes/` to verify. Cross-reference `issues.md`. No UI navigation required.
- **Done looks like:** `evidence/v2.2-inventory-2026-04-24.md` produced. For every feature: state, relevant files, blockers, recommended phase. Captain reviews on wake, finalizes Phase 2 sprint list based on findings.
- **Constraints:** Read-only. No code changes. Runs autonomously overnight. Under 90 min wall time.

### Sprint 1.3 — Warehouse data import

- **Objective:** Import Durran's 45-day CRM export into warehouse tables; make queryable; document schema and row counts.
- **Scope:** `uploads/crm-exports-2026-04-23/` → new tables under `warehouse_*` namespace. Schema migration + loader script. Sanity queries per store.
- **Done looks like:** Tables populated, row counts match source, sanity queries return expected shape for all 5 stores. Schema documented.
- **Constraints:** Do not mutate existing `warehouse_leads` or other tables. Additive only. Import is idempotent (re-runnable without duplicates).

### Sprint 1.5 — TeamBox first-principles research

- **Objective:** Pre-flight research to determine whether TeamBox should stay unified, split into per-section inboxes (Sales / Service / Marketing), or adopt a hybrid. Playwright MCP driven.
- **Scope:** Read-only UX research on live dev.huminicdev.com. Evaluate current TeamBox + Sales/Service/Marketing sections. Multi-role walkthrough (super_admin, org_admin, partner_admin simulations). Output: `evidence/teambox-first-principles-2026-04-24.md` with recommendation + implementation cost per option.
- **Done looks like:** Operator has a concrete architectural recommendation with rationale, cost estimate per option, and a clear decision point before Phase 2 sprint finalization. TeamBox-related sprint additions/changes to plan.md follow from this output.
- **Constraints:** Read-only. No code changes. Under 45 min. Uses live dev URL (no `npm run dev` or service restart).

### Sprint 1.4 — Quick-win insight audit + DNA buildability matrix

- **Objective:** Locate the CRM capability YAML (check `../nexxus/` and `../nexxus2.2/` uploaded docs). Cross-reference imported 45-day data + live warehouse data against the DNA Alert Library in plan.md section 11. Produce a buildability matrix: which alerts are buildable now, which need the import, which are blocked on external data.
- **Scope:** Read-only analytical pass. Produce `evidence/quick-win-insights-2026-04-24.md` with per-alert: buildability state (now / needs-import / blocked), data shape, threshold ranges, effort estimate. Include sketch of each alert's briefing-email render.
- **Done looks like:** Matrix produced covering all 12 DNA alerts from section 11. Sprint 2.4 implementation has concrete queries and threshold config ready. YAML located or documented as not-found.
- **Constraints:** Analysis only, no code changes, no sends.

### Sprint 1.6 — conversations.department data model + backfill

- **Objective:** Add `conversations.department` column (enum: sales | service | marketing | unknown) with a backfill rule that derives domain from existing campaign / agent / channel signal for existing rows. Unlocks DNA alerts + Hybrid TeamBox (Sprint 4.6).
- **Scope:** `shared/schema.ts` migration, `server/services/` backfill script, trigger + SMS + voice webhook writes set department on new conversations. No UI changes.
- **Done looks like:** Column exists, existing rows backfilled with best-effort derivation, new conversations write department correctly, a read query can filter conversations by department across rooftops.
- **Constraints:** Additive only — no behavioral change to existing code paths. "unknown" is a valid value and safe fallback.

---

## Phase 2 — Critical for Monday

### Sprint 2.1 — Trigger activation end-to-end

- **Objective:** Complete the SMS trigger stack so Serra Honda can go live on whitelist Monday morning.
- **Scope:** `server/services/triggerService.ts`, `server/services/scheduler.ts`, `server/routes/sms.ts`, `server/routes/webhooks.ts`. Includes: after-hours DEFER→morning send, isNexxusOriginatedLead URL resolution, SMS appointment intent detection, appointment stored in our system calendar + admin notification email (VIN Solutions does not accept appointment entries — calendar stays in-platform; ADF XML is the existing CRM touchpoint and remains unchanged), first-inbound AI path, `{{dealershipName}}` template leak fix (I-269).
- **Done looks like:** All 6 trigger work units complete and committed. Unit tests pass. `triggersEnabled=true` at Serra Honda with test-phone whitelist. E2E dry-run on test phone confirms after-hours SMS → two-way conversation → appointment intent → calendar entry + admin email fires cleanly. Agent chat shows resolved dealership name (no literal template leak).
- **Constraints:** Changes stay inside declared files. Captain does NOT run live tests to real customer phones — whitelist-only. Appointment flow writes to our DB calendar only — no VIN appointment write (intentional — VIN doesn't support it).

### Sprint 2.2 — Widget verification + Serra Honda production embed

- **Objective:** All 4 widget actions verified working end-to-end; production embed note sent to Cox per operator.
- **Scope:** `client/public/dealer-widgets/nexxus-widget.js`, `client/src/pages/widget-landing.tsx`, `server/routes/public.ts`, `server/routes/widgets.ts`. Manual verification of chat, callback, form, video via test URL.
- **Done looks like:** All 4 actions confirmed working. Widget UI bridge fix deployed. Cox email (VDP-first for Day 1, site-wide after verification) drafted and handed to operator for sending.
- **Constraints:** No changes to widget source (`nexxus-widget.js`). Fix is landing-page-side only. Cox email goes from operator, not captain.

### Sprint 2.3 — Durran testing package

- **Objective:** Durran has a self-guided testing package covering all SMS scenarios, widget actions, appointment flow, and conversation flow viewer.
- **Scope:** New document `evidence/durran-testing-package-2026-04-25.md` plus the conversation flow viewer page (read-only preview of every automated message scenario).
- **Done looks like:** Durran receives the package Friday AM, can run it async over the weekend, reports back Sat or Sun with any issues.
- **Constraints:** Package must be runnable from a test phone without captain on call. Conversation flow viewer is read-only + super_admin-gated.

### Sprint 2.4 — Ship 5 Tier-1 DNA alerts

- **Objective:** Implement and ship the 5 Tier-1 DNA alerts from plan.md section 11: Opportunity on the Floor (10.0), Pipeline Freeze (9.8), Lead Flow Shock (9.4), Night Shift Opportunity (9.2), Source Performance Drift scaled (9.1). Delivered via Sprint 2.12's Daily Briefing email.
- **Scope:** New `server/services/dnaAlertService.ts` with alert query + threshold logic; integration with Sprint 2.12 briefing renderer; per-dealer threshold config in org settings. Each alert: exception-detected + impact-quantified + recommended-action + deep link.
- **Done looks like:** All 5 alerts fire correctly in test fixtures. Briefing template renders each alert cleanly. Dry-run against Serra Honda data shows realistic alert counts. Source Performance Drift handles unresolved sources honestly ("VIN Source #nnnn").
- **Constraints:** Only ship alerts where data is solid. Thresholds set to reasonable defaults; per-dealer override available. No fire-on-test-data that would reach real admins before operator approval.

### Sprint 2.10 — Security closure (6 paid-contract-path issues)

- **Objective:** Close 6 open security issues touching paid-contract paths before Monday go-live. Promoted from Phase 4 Sprint 4.11 per captain judgment.
- **Scope:** I-244 IDOR on `/api/vin/leads/summary` (enforce orgId match); I-245 AI system prompt writable by org_admin via URL bypass (require super_admin role server-side); I-246 role dropdown privilege escalation (server-side role restriction); I-247 org slug mutability (remove from PATCH schema); I-248 TZ validation crash (validate timezone string on write); I-249 self-deactivation (prevent in UI + server).
- **Done looks like:** Each issue fixed with a test. Code-reviewer agent verifies fix + no regressions. 6 commits or one bundled commit with per-issue rationale.
- **Constraints:** Each fix isolated. Changes stay within declared files per issue. Deploy gated on operator approval, not automatic.

### Sprint 2.11 — Insights page visual audit

- **Objective:** Pre-Monday visual verification of the Insights page (I-156 + I-163 + ~37 related states). Insights is the first screen a dealer sees at login; never been visually verified; fix critical issues before launch.
- **Scope:** Captain-driven Playwright MCP walk of Insights at all role levels. Screenshot every major state. Compare against sales + service + marketing section needs. Fix-or-defer each issue found; critical issues fix in this sprint, cosmetic issues go to Sprint 4.5 (metrics cleanup).
- **Done looks like:** `evidence/insights-audit-2026-04-25.md` produced with per-state screenshot + verdict. Critical issues shipped. Cosmetic issues queued for Sprint 4.5.
- **Constraints:** Captain drives; operator reviews critical-issue fixes before deploy. No UI redesign — audit + fix only.

### Sprint 2.12 — Daily Briefing MVP

- **Objective:** Email delivery vehicle for the 5 Tier-1 DNA alerts from Sprint 2.4. First fire Monday morning to Serra Honda admins as part of go-live. Pulled forward from Phase 4 because alerts without a push channel are invisible.
- **Scope:** New `server/services/dailyBriefingService.ts`; email template with alert blocks; scheduled fire per-org TZ (default 7:30 AM); opt-out per recipient stored in user settings; integration with Sprint 2.4 alert service.
- **Done looks like:** First briefing lands Monday morning to Serra Honda admin list. Each included alert has exception + impact + action + deep link. Recipients can opt out from the email itself. Empty-day handling: if no alerts fired, briefing still sends with a brief "quiet night" message rather than skipping (establishes cadence expectation).
- **Constraints:** Content generated at 5 AM local, sent at 7:30 AM local. Must survive a day with zero alerts without being spammy. Operator approves template copy before first fire.

### Sprint 2.5 — Inbound voice → ADF verification (3 Serra stores)

- **Objective:** Confirm inbound VAPI call → ADF XML email → VIN Solutions pipeline is firing cleanly at Serra Honda, Serra Nissan, and Tony Serra Ford.
- **Scope:** `server/routes/webhooks.ts` VAPI handler, `outbound_log` audit, Resend log verification. Optional test call per store.
- **Done looks like:** Last 7 days of calls reviewed. Success rate + any failure root cause identified. Generic fallback wording approved by operator.
- **Constraints:** Read-only verification for historical data. Test calls only with operator approval.

### Sprint 2.6 — Core reports verification at all 5 stores

- **Objective:** Weekly executive report generates clean for all 5 stores with sales-only filter live through the scheduler path.
- **Scope:** `server/services/weeklyReportService.ts` (plumb `salesOnlyLeadIds` through `sendWeeklyReportProduction`), scheduler wiring, 5-store dry-run generation.
- **Done looks like:** Dry-run report generates for all 5 stores with correct sales-only counts. Scheduler can fire on Monday without re-ship of the service-lead bug.
- **Constraints:** Opt-in filter stays opt-in on public API, but production path defaults to sales-only.

### Sprint 2.7 — Chat capabilities E2E verification

- **Objective:** Main chat + agent chat verified as basic working at all 5 stores.
- **Scope:** Main Super Chat UI + backend, per-store agent chat. Role-gated checks.
- **Done looks like:** Captain runs a scripted E2E per store. Any failures logged; fixes sprinted or deferred explicitly.
- **Constraints:** Basic capability check, not depth audit. Depth audit is v2.3.

### Sprint 2.8 — Staff messaging (TeamBox) verification

- **Objective:** TeamBox conversation list, open conversation, reply, assignment, and push-to-VIN work at all 5 stores.
- **Scope:** `client/src/pages/teambox.tsx`, `server/routes/conversations.ts`.
- **Done looks like:** Captain runs a scripted E2E per store. Captures any navigation confusion for Phase 4 (segmentation sprint).
- **Constraints:** Do not redesign in this sprint. Verify current state; redesign is Phase 4 Sprint 4.6.

### Sprint 2.9 — Service campaigns E2E at Serra Honda

- **Objective:** One real service campaign runs end-to-end at Serra Honda with operator walking it.
- **Scope:** Service campaign creation UI, recipient selection, send path, delivery audit, response handling.
- **Done looks like:** Operator sends a real campaign (to test phones or small controlled list). Delivery confirmed. Responses routed. Full audit trail in activity log.
- **Constraints:** Operator in the loop. Captain does not send on operator's behalf without explicit per-send approval.

---

## Phase 3 — Hardening + Go-live

### Sprint 3.1 — Deployment preparation

- **Objective:** Staging rehearsal of build + pm2 restart + smoke test before Monday's real deploy.
- **Scope:** Full build, pm2 process check, endpoint smoke tests (widget URL, landing page, health check if available, VAPI webhook, key API endpoints).
- **Done looks like:** Rehearsal completes clean. Captain has an exact deploy command runbook for Monday AM.
- **Constraints:** Staging rehearsal does not touch production traffic. If any smoke test fails, deploy does not proceed Monday.

### Sprint 3.2 — Emergency kill switch

- **Objective:** Single super_admin endpoint + admin UI button to set `OUTBOUND_LIVE_ENABLED=false` via DB flag, halting all outbound sends.
- **Scope:** New admin endpoint `POST /api/admin/emergency/outbound-off`, corresponding UI button on super_admin dashboard, audit log entry on toggle.
- **Done looks like:** Toggle works. All outbound pathways (SMS, voice, email) respect the flag. Audit log captures who flipped it and when.
- **Constraints:** Super_admin role only. Button requires confirmation dialog. Toggle also auto-logs to `activity_log`.

### Sprint 3.3 — Manual smoke test all 5 stores

- **Objective:** Human-eyes verification of every critical path at every store. Not automated.
- **Scope:** Captain drives. Operator watches. Per store: login, dashboard, teambox, reports, send test SMS, verify delivery, verify admin notification.
- **Done looks like:** 5-store smoke test log in evidence/. Any issue found → decide sprint or defer before Sunday go-live.
- **Constraints:** No broken items ship without documented mitigation or explicit deferral decision.

### Sprint 3.4 — Sunday night dry run

- **Objective:** Run the exact Monday go-live sequence on Sunday evening: build + restart + trigger scheduler fire + widget deploy simulation.
- **Scope:** Full prod path. Weekly report fires (to operator only, not customers). Trigger scheduler fires on test-phone whitelist. Widget endpoint verified from external origin.
- **Done looks like:** Sunday dry-run artifacts saved to evidence/. Any failure → deploy blocked until resolved.
- **Constraints:** No sends to real customers on Sunday. Whitelist + operator-only.

### Sprint 3.5 — Go-live Monday 9 AM ET Serra Honda

- **Objective:** Serra Honda widget + triggers active with real-customer exposure.
- **Scope:** Deploy command executed. Cox widget deployed at Serra Honda VDP pages. Triggers active on full Serra Honda lead set (not just test phones).
- **Done looks like:** Live traffic flows through. First 3 real customer exchanges logged. Captain + operator both eyes-on through the 9-11 AM window.
- **Constraints:** Captain does not execute unilaterally. Operator must be present and give go signal at 9 AM.

### Sprint 3.6 — Day-1 Monday monitoring

- **Objective:** Eyes-on monitoring for the first full business day; catch and triage any issue.
- **Scope:** Log monitoring, outbound_log review, customer interaction audit. Hourly digest to operator for the first 8 hours.
- **Done looks like:** Day closes with an end-of-day report: X leads captured, Y SMS sent, Z appointments booked, N issues encountered and their resolution state.
- **Constraints:** Captain pauses development work during Day 1 — monitoring is the priority.

---

## Phase 4 — Non-Critical Completion

Run in listed order but parallel-friendly where obvious.

### Sprint 4.1 — Health monitoring service + daily eval

- **Objective:** Proper monitoring service with daily eval checks, no longer manual.
- **Scope:** New service at `server/services/healthMonitor.ts` or equivalent. Health endpoint aggregator. Daily eval script (cron'd). Alert webhook integration.
- **Done looks like:** All services healthchecked every 5 min. Daily eval runs at 6 AM, emails operator. Any service down → alert within 10 min.
- **Constraints:** Captain picks implementation (embedded service vs external cron) based on what fits the existing pm2 stack cleanly.

### Sprint 4.2 — Widget rollout to remaining 4 stores

- **Objective:** Serra Nissan, Tony Serra Ford, Ford of Columbia, Hyundai of Columbia widget deploys after Serra Honda verification.
- **Scope:** Cox coordination. Per-dealer widget config. Staged or simultaneous per operator's Q2 answer.
- **Done looks like:** All 5 stores have widget live with all 4 actions verified.
- **Constraints:** Each store's go-live gated on the prior store's 24h clean window.

### Sprint 4.3 — FTC scanner UI + reports

- **Objective:** Implement FTC compliance scanning with UI + reports per operator's FTC technical document.
- **Scope:** Awaits operator's FTC technical document. New module under `client/src/pages/` and `server/services/`.
- **Done looks like:** Scanner runs per configured target set. Produces daily infraction report. Dealer can see results in UI.
- **Constraints:** Scope finalized when operator provides technical document.

### Sprint 4.4 — Competitive intelligence module

- **Objective:** PMA competitor inventory + pricing comparison + FTC compliance flag in one place.
- **Scope:** New module. Scraper (borrow from SiteBoost tech). Inventory-match algorithm. Price delta calculator. FTC overlay. Weekly + daily email templates.
- **Done looks like:** Per-store competitor list configurable. Weekly email delivers to dealer admins. Daily price-drop alert when a competitor moves below our price on matching inventory.
- **Constraints:** Scraper respects robots.txt + rate limits. Initial target list manually curated per store (3-5 competitors each). FTC overlay uses rule set from Sprint 4.3 if built.

### Sprint 4.5 — Metrics cleanup across UI

- **Objective:** Audit every UI metric; remove what doesn't drive a decision; reframe as problem-first where possible.
- **Scope:** `client/src/pages/insights.tsx`, any dashboard surface, role-specific variants.
- **Done looks like:** Every remaining metric answers a specific question. Removed metrics documented. Reframed metrics tested with operator.
- **Constraints:** Operator approves removals per-metric.

### Sprint 4.6 — TeamBox segmentation + service/sales split

- **Objective:** Role-based TeamBox views; separate sales and service inbox; push-to-VIN UX clarity.
- **Scope:** `client/src/pages/teambox.tsx` + any supporting role-scoping in server routes.
- **Done looks like:** BDC/GM/service users see relevant conversations only. Push-to-VIN has tooltip + confirm dialog. No forced detour back to TeamBox from service area.
- **Constraints:** No backend data model changes. UI + role filter only.

### Sprint 4.7 — Agent configuration UI

- **Objective:** UI for editing agent tone, off-limits topics, handoff rules, quiet hours, rate limits — replacing hard-coded config.
- **Scope:** New super_admin settings page; persist config in `organizations.settings` JSONB; audit log on change; version history.
- **Done looks like:** Operator can edit agent config from UI. Changes have a diff preview and approval step. Audit trail shows who changed what when.
- **Constraints:** Super_admin or partner_admin only. Must reload existing triggers and messages to pick up new config.

### Sprint 4.8 — Conversation flow viewer

- **Objective:** Read-only page showing the exact message the system would send in every scenario, per dealer.
- **Scope:** New admin UI page. Pulls from trigger service + SMS handler templates.
- **Done looks like:** Operator and Durran can preview every flavor: after-hours first-contact, 24h check-in, appointment confirmation, opt-out response. Filterable by dealer.
- **Constraints:** Read-only. No live sending from this view.

### Sprint 4.9 — Lago billing monitoring only (fast-follow)

- **Objective:** Wire basic usage-monitoring visibility so operator can see what each dealer is using. Full invoicing integration is v2.3 scope.
- **Scope:** `server/services/lago*.ts` metrics pipeline only. Surface usage data in existing super_admin view (or minimal new view). No token-level or feature-level billing; no invoicing.
- **Done looks like:** Operator can see per-dealer usage counters (SMS sent, voice minutes, widget sessions, AI completions). No customer-facing billing surfaces changed. Full Lago integration explicitly deferred to v2.3.
- **Constraints:** Monitoring-only. Not required for Monday. Fast-follow post-Monday, low urgency. No production invoicing path.

### Sprint 4.10 — Daily Briefing Tier-2 alerts + multi-channel expansion

- **Objective:** Extend the Sprint 2.12 MVP with Tier-2 DNA alerts from plan.md section 11 (Contact Quality Breakdown, Demand Shift Radar, Digital-to-Showroom Gap) as Durran's import enriches the data. Add multi-channel delivery options (SMS for highest-impact, web push, optional Slack).
- **Scope:** `server/services/dnaAlertService.ts` extensions for Tier-2 alerts; `server/services/dailyBriefingService.ts` channel expansion; per-recipient channel preferences in user settings.
- **Done looks like:** All 3 Tier-2 alerts firing. Multi-channel delivery tested. Recipients can pick email / SMS / push / Slack per alert type.
- **Constraints:** Extensions only. Core MVP from Sprint 2.12 remains the default path. New channels opt-in per recipient.

### Sprint 4.11 — Security hardening (targeted)

- **Objective:** Close the 6 known security issues from prior audit affecting paid-contract paths.
- **Scope:** IDOR on vin/leads/summary, AI system prompt writable, role dropdown escalation, org slug mutability, TZ validation crash, self-deactivation.
- **Done looks like:** Each issue fixed with test. Code-reviewer agent verifies fix. No regressions.
- **Constraints:** Each fix isolated to one PR. Captain does not bundle.

### Sprint 4.12 — Performance audit pass 1

- **Objective:** Identify and fix obvious performance issues (N+1 queries, unnecessary roundtrips, slow queries).
- **Scope:** Top 10 slowest endpoints by measurement. DB query analysis for the highest-traffic routes.
- **Done looks like:** Top 10 endpoints improved by at least 20% median latency OR documented as acceptable. Query plan screenshots in evidence.
- **Constraints:** No schema changes — query/code-level only.

---

## Phase 5 — Final Deploy + v2.3 Handoff

### Sprint 5.1 — Security audit + fixes (targeted)

- **Objective:** Full audit of paid-contract paths. Fix any new findings.
- **Scope:** Dispatch security-focused agent team. Trace every paid-contract API endpoint + UI surface.
- **Done looks like:** Audit report + fixes for all P0/P1 findings. P2+ documented and prioritized for v2.3.
- **Constraints:** Operator approves scope before dispatch.

### Sprint 5.2 — Performance audit pass 2

- **Objective:** Deeper performance sweep. Everything not caught in 4.12.
- **Scope:** Full-stack profiling. Frontend bundle size. Database indexing review.
- **Done looks like:** Documented findings + applied fixes where within v2.2 scope.
- **Constraints:** Hard cut-off at Phase 5 end. Overflow goes to v2.3.

### Sprint 5.3 — v2.2 final verification sweep

- **Objective:** Every DoD checklist item in plan.md section 10 verified.
- **Scope:** Captain + operator walk every item. Close or defer explicitly.
- **Done looks like:** Checklist 100% accounted for.
- **Constraints:** No silent deferrals. Every "not done" gets a v2.3 backlog entry.

### Sprint 5.4 — v2.2 closeout report

- **Objective:** Written summary of v2.2: what shipped, what deferred, what incidents, what learned. For operator + partner.
- **Scope:** `evidence/v2.2-closeout-2026-05-17.md` or equivalent.
- **Done looks like:** Document exists. Operator reviews and shares with partner.
- **Constraints:** Factual. No marketing polish.

### Sprint 5.5 — v2.3 planning kickoff

- **Objective:** Open v2.3 plan.md. Seed from deferrals + new ideas.
- **Scope:** New plan.md for v2.3. Current plan.md archived to `legacy-artifacts/` or kept as history.
- **Done looks like:** v2.3 plan.md exists with Phase 1 sprint list populated. Operator has reviewed.
- **Constraints:** Clean separation — v2.2 closed before v2.3 execution begins.
