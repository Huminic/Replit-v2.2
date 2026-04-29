# Session — nexxus2.2_replit (operator-curated; authoritative)

Last operator-curation: 2026-04-26
Branch: wave-pe3
Dirty entries: see `git status` (operator-pending product changes — see disposition table at bottom)

> **NOTE for hooks:** the session-end and pre-compact hooks write to `.claude/session-snapshot.md` (informational only). This `session.md` file is the authoritative operator-curated context for the next session. Do NOT clobber.

## ⚠️ AUTONOMY POLICY (effective 2026-04-25)

The model is **NOT "block all real sends"**. The model IS:

> **Allow real provider sends ONLY to approved internal/test destinations.**
> **Block any send whose recipient is a real customer or unapproved external party.**

### Autonomy ALLOWED after preflight

- Edit code in approved scope (`server/`, `harness/`, `evidence/`, `tests/`, `comms-test.ts`) — UI files (`client/src/{pages,components,styles,layouts}/**`) still require per-file `.claude/state/scope/<basename>.ok` markers
- Configure `TESTLANE_*` env vars in `.env`
- `pm2 restart nexxus-app` / `pm2 reload nexxus-app --update-env` (DEV ONLY) — must show exact command + reason
- Run `npx tsx server/comms-test.ts <fn>` against allowlisted test destinations
- Check Resend / TextMagic / VAPI / Tavus logs / dashboards for proof
- Use Playwright MCP browser actions on `localhost:5000`, `dev.huminicdev.com`, `live.huminic.app`
- Create `[TESTLANE]`-marked records (campaigns, conversations, recipients, leads)
- `harness/bin/test-lane-reset.sh` DRY-RUN, plus `--execute` with `TESTLANE_RESET_APPROVED=yes`

### STILL REQUIRES EXPLICIT APPROVAL

- Production deploy (anything affecting `live.huminic.app`)
- Migration / schema change
- VIN `execute` write after `prepare → review`
- Adding or changing real customer recipients in any test
- Enabling service campaigns for stores other than `serra-honda`
- Sending to any non-allowlisted phone/email
- Changing live Coolify env (container `phqqzjj5pal13wlp39m5ohx6-…`)
- Restarting live Coolify container (any `docker restart` / `docker compose restart`)
- Force push or push to main
- Broad UI redesign

## ⚠️ TEST SAFETY (verified 2026-04-25)

**dev and live SHARE the same Supabase database.**

- `dev.huminicdev.com` → PM2 `nexxus-app` on port 5000 (local Node, working tree)
- `live.huminic.app` → Coolify container `phqqzjj5pal13wlp39m5ohx6-…` on port 5001 (separate deployment; image `f4166227f5...`, started 2026-04-14)
- Both connect to: `aws-1-us-west-2.pooler.supabase.com:6543/postgres` and `:5432/postgres`

**Outbound posture is LIVE on both deployments.**

- dev `.env`: `OUTBOUND_LIVE_ENABLED=true`, `ADF_MODE=live`, `ADF_TEST_EMAIL=duane.wells@huminic.ai`, `NODE_ENV=development`, `SEED_DEMO_DATA=true`
- live container env: `OUTBOUND_LIVE_ENABLED=true`, `NODE_ENV=production`

**All 7 named org_admin accounts are real dealership admins** (verified by DB query 2026-04-25):

| email | role | org slug | ADF configured |
|---|---|---|---|
| `serra_honda@huminic.ai` | org_admin | serra-honda | YES (Honda) |
| `serra_nissan@huminic.ai` | org_admin | serra-nissan | YES (Nissan) |
| `serra_ford@huminic.ai` | org_admin | tony-serra-ford | YES (Ford) |
| `columbia_hyundai@huminic.ai` | org_admin | hyundai-of-columbia | NO |
| `columbia_ford@huminic.ai` | org_admin | ford-of-columbia | NO |
| `duanekwells@gmail.com` | partner_admin | cage-automotive | NO |
| `duane.wells@huminic.ai` | super_admin | huminic | NO |

All 7 orgs have `outbound_enabled=TRUE` and all per-channel flags ON. There is **no safe-by-default org**.

## Serra Honda Test Lane (REQUIRED for every real-integration E2E)

Encoded in code:
- `server/outbound.ts:processOutboundSend` — two-way fail-closed test-lane guard
- `server/services/notificationService.ts:applyTestLaneRecipientOverride` — admin-recipient override
- `server/routes/webhooks.ts:submitAdfLead` — ADF fail-closed guard

Per-request markers (any one): `request.testLaneSessionId`, `[TESTLANE]`/`[testlane:` in `messageContent` / campaign name / `recipient.firstName==="TestLane"`.

Required env vars (operator sets in `.env` for test-lane sessions):

```
TESTLANE_MODE=true
TESTLANE_SMS_TO=+14126546500
TESTLANE_EMAIL_TO=duanewells@icloud.com
TESTLANE_VOICE_TO=+14126546500
ADF_MODE=test
ADF_TEST_EMAIL=duane.wells@huminic.ai
```

Procedure:

1. Operator sets the test-lane env vars in `.env`. PM2 restart with `pm2 reload nexxus-app --update-env` to load them (dev only; affects port 5000; does NOT touch the Coolify container on port 5001).
2. Operator confirms `serra-honda` is on `.claude/state/test-orgs.txt` and the test phone/email are on `.claude/state/test-recipients.txt`.
3. `harness/bin/test-lane-verify.sh pre <sid>` — pre-check + baseline DB snapshot.
4. Generate a unique session id `<sid>` and use it on every `SendRequest.testLaneSessionId`.
5. Run E2E paths. Every campaign named `[TESTLANE] <description>`. Every recipient `firstName="TestLane"`. Every conversation customer name `[TESTLANE] <id>`. Every manually-injected `warehouse_leads` row `customer_name='[TESTLANE] Trigger Probe <sid>'`.
6. **Trigger-path tests off-by-default.** DO NOT enable the 15-min `checkTriggerConditions` poll against real `warehouse_leads`. Single manually-injected `[TESTLANE]`-marked rows ONLY.
7. `harness/bin/test-lane-verify.sh post <sid>` — assert no non-test recipient was contacted.
8. `harness/bin/test-lane-reset.sh` (DRY-RUN; `TESTLANE_RESET_APPROVED=yes ... --execute` after operator approval).

## Categorized allowlists (seeded 2026-04-25)

`.claude/state/test-recipients.txt`:

| Category | Entry |
|---|---|
| internal_operator | `+14126546500`, `duanewells@icloud.com` |
| test_email | `duane.wells@huminic.ai` |
| vapi_test_agent | `c303d993-bf42-4784-a8cb-247477b1cbdd` (Elliott) |
| vin_test_contact | `Durran Cage` (resolved per-dealer via vin-safe-mcp) |
| tavus_test | `popup-only` |
| textmagic_test_number | TBD — operator to fill in 3 owned TextMagic numbers (receive-only / outbound-authorized / webhook-test) |

`.claude/state/test-orgs.txt`: `test_org:serra-honda` only.

## ⚠️ TESTING DOCTRINE — see `~/Claude-store/sysadmin/harness/TESTING_DOCTRINE.md`

Every claim of completion must specify a testing level:
- **step** — single function/route/component change
- **sprint** — backlog item / sprint completion (GUI testing MANDATORY for user-facing changes)
- **phase** — phase exit (full route/feature eval suite + Playwright MCP smoke)
- **pre-prod** — before deploy / production restart (full launch matrix, integration-safety, test-lane E2E)
- **post-prod** — after approved deploy (live smoke only, no unsafe mutations)

Marker: `mark-complete.sh testing-level <step|sprint|phase|pre-prod|post-prod> [evidence-path]`

Evidence layout: `evidence/<task-id>/{step,sprint,phase,pre-prod,post-prod}/`.

Nexxus required eval matrix per route (see TESTING_DOCTRINE.md "Nexxus eval / test commands"). Test commands:
- `npm run test:e2e` (43 specs; 13 Playwright projects)
- `npm run test:e2e:list` (list available)
- `npx playwright test --project=workflow` (15 wf-*.spec.ts)
- `npx playwright test --project=visual` (timeout 180s)
- `node tests/pe-insights-03-eval.js` (Insights eval)
- `npx tsx server/comms-test.ts <fn>` (allowlisted-only comms)

Playwright MCP agents available: `playwright-test-planner`, `playwright-test-generator`, `playwright-test-healer` (Nexxus only, real files), plus `nexxus-e2e-evaluator` and `qa-evaluator` (harness symlinks).

## Hard preconditions before ANY mutating test action

1. Run `/home/ubuntu/Claude-store/sysadmin/harness/bin/test-safety-check.sh` (`/preflight` does this automatically for Nexxus).
2. Operator confirmation in chat on each "OPERATOR DECISION REQUIRED" item.
3. Allowlist check: `test-orgs-allowlist-check.sh org <slug>` AND `... recipient <target>` (exit 0 + category).
4. Read-only login as a real org_admin is OK; mutating actions under those identities require per-action `# APPROVED:` marker AND operator confirmation.
5. Service-campaign launch rule: Monday Apr 27 ships service capability ONLY for `serra-honda`.

## Operator decisions still pending

1. **Bearer-token rotation.** VIN-safe-mcp / dax-mcp / n8n-hyperbridge / Coolify tokens were checked into git history. Rotated → out of scope for harness. Currently moved to gitignored `settings.local.json`. The VIN-safe-mcp token also appears in plain text in `CLAUDE.md` line 75; replace with env-var reference and rotate.
2. **Pre-existing dirty tree disposition** (table below).
3. **Captain-introduced commit `0e0a0b3`** in history contains content the operator did not approve. Working-tree rewrite of `plan.md`/`backlog.md` supersedes it.
4. **Service-campaign per-store flags** confirmed before launch: Serra Honda on, others off.
5. **TextMagic 3-number classification** — operator to fill into `test-recipients.txt` with sub-categories (receive-only / outbound-authorized / webhook-test).

## Pre-existing dirty tree disposition (operator decision needed)

| File | Change | Recommendation |
|---|---|---|
| `plan.md` | Heavy rewrite (442→145 lines), removes captain-introduced `0e0a0b3` content | **Stage and commit** — IS the intended source of truth |
| `backlog.md` | Heavy rewrite, matches new plan.md phase shape | **Stage and commit with plan.md** |
| `decisions.md` | Adds 5 operator decisions dated 2026-04-24 | **Stage and commit** |
| `client/src/pages/widget-landing.tsx` | Adds chat/voice/form auto-launch handlers (4-action widget bridge) | **Real bug fix.** Stage; future UI edits need per-file scope marker. |
| `server/routes/organizations.ts` | Adds `additionalOrgIds` for org_admin (multi-store admins) | **Real bug fix.** Stage. |
| `server/outbound.ts` (this session) | Test-lane guard | Stage with harness commit |
| `server/services/notificationService.ts` (this session) | Admin-recipient test-lane override | Stage with harness commit |
| `server/routes/webhooks.ts` (this session) | ADF test-lane fail-closed guard | Stage with harness commit |
| `evidence/watchdog-alerts.log` | Log file growth | Operator preference |
| `nexxus-migration.md` (deleted) | Now-obsolete | Stage deletion |
| `.codex` (untracked) | Sentinel | Operator decides |
| Untracked PRD/strategy/evidence docs | Today's research | Stage |

## Approval bypass cheatsheet

- Bash blocked: append `# APPROVED: <reason>`
- Edit blocked file: `mkdir -p .claude/state/scope && touch .claude/state/scope/<basename>.ok`
- Stop hook escape: `touch .claude/state/skip-stop-check`
- Completion marker write: `/home/ubuntu/Claude-store/sysadmin/harness/bin/mark-complete.sh <kind> [args]`
- Test-lane reset --execute: `TESTLANE_RESET_APPROVED=yes`
