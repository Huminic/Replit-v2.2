# Task #3 Audit Plan — Working Notes (PRE-STAGE ONLY)

**Status:** PRE-STAGE. Audit work has NOT begun. Awaiting parent verifier PASS on Task #1 + #2.

**Date:** 2026-04-26
**Operator:** authorized bounded execution campaign 2026-04-26
**Audit scope (parent decision):** Serra Honda + public widget routes only. Note global metric/page issues but do not validate per-org.

---

## Audit identity

- Login: `serra_honda@huminic.ai` (password `NexxusTest2026`)
- Role: `org_admin` (Serra Honda)
- Mode: read-only login. NO mutating actions.

## Target URLs

- App: `https://dev.huminicdev.com` (PM2 port 5000, dev tree)
- Widget public: `https://dev.huminicdev.com/w/<widget-slug>` and `/p/<org-slug>` for Serra Honda
- Localhost backup: `http://localhost:5000` if dev URL is flaky

## Sprint 1.2 — UI Truth Inventory (per backlog.md)

Visit each authenticated screen as `serra_honda@huminic.ai`; capture screenshot + DOM snapshot + console messages + network requests. For each visible promise (button, tile, link, metric, action), classify:

- **WORKING** — does what its label/affordance promises
- **BROKEN** — fires error, returns 404/500, or visibly malfunctions
- **MISLEADING** — appears to work but does not match its label or stored data
- **UNFINISHED** — placeholder/stub/coming-soon/empty without explanation
- **GATED** — intentionally hidden/restricted (capture rationale where visible)
- **DEFERRED** — known post-launch per `issues.md` / `plan.md` deferrals

Output: `evidence/preflight-ui-truth-2026-04-26.md`

### Pages to walk (Serra Honda lens)

| # | Route | Reason |
|---|---|---|
| 1 | `/` (AI chat / dashboard) | Primary landing; chat surface |
| 2 | `/teambox` | TeamBox conversations workbench |
| 3 | `/sales` | Sales metrics + sub-menu |
| 4 | `/service` | Service metrics + service campaigns (Serra Honda is the launch store) |
| 5 | `/marketing` | Marketing module (verify gated/empty handling) |
| 6 | `/insights` | Insights tiles + drill-downs |
| 7 | `/agents` | Agents page (Photo Studio per I-102 needs verification) |
| 8 | `/management` | Management page (org_admin access scope per RBAC) |
| 9 | `/settings` (and `/settings?section=ai`) | Settings; verify I-245 IDOR-via-section is blocked at API |
| 10 | `/settings/billing` | Billing (FlexPrice dead, Lago not yet wired per I-105/I-278) |
| 11 | `/login`, `/forgot-password`, `/reset-password` | Auth (I-140, I-165 NEEDS LIVE TEST) |

### Public widget routes (no auth)

| # | Route | Reason |
|---|---|---|
| 12 | `/w/<serra-honda-widget-id>` | Widget standalone landing |
| 13 | `/w/<serra-honda-widget-id>?mode=chat` | Auto-launch chat (post-fix in commit 354aa33) |
| 14 | `/w/<serra-honda-widget-id>?mode=voice` | Auto-launch voice callback (post-fix) |
| 15 | `/w/<serra-honda-widget-id>?mode=form` | Auto-launch form (post-fix) |
| 16 | `/w/<serra-honda-widget-id>?mode=video` | Auto-launch video (pre-existing) |
| 17 | `/p/<serra-honda-slug>` | Public landing page |

## Sprint 1.3 — End-To-End Workflow Validation (per backlog.md)

For each customer-critical workflow: state expected path, walk it, capture actual path, identify broken step, write acceptance test. **Read-only or test-lane only.** No real customer sends.

Output: `evidence/preflight-e2e-workflows-2026-04-26.md`

### Workflow scope (Serra Honda lens)

| # | Workflow | Notes / Known issues |
|---|---|---|
| W1 | Trigger → reply round-trip (after-hours, 24h check-in) | Test-lane required; `triggerTestPhones` should restrict to allowlist. INC-001 history (Apr 12) flags risk. |
| W2 | Service campaign create → CSV upload → send → reply | I-270 bulk CSV 404; I-271 closed; CommGate flag verification |
| W3 | TeamBox conversation handling | I-250 silent drop; I-254 race; I-255 no Return-to-AI |
| W4 | Push-to-VIN | I-240 (vin-safe-mcp errors); EDR-11 (E2E not fully verified) |
| W5 | Widget actions (chat / voice / form / video) | post-fix verification of commit 354aa33 |
| W6 | Appointment intent → calendar + admin notification | per decisions.md 2026-04-24: appointments are our-system calendar + email; NOT VIN-synced |
| W7 | Main chat (`/`) | I-277 streaming fix verification |
| W8 | Agent chat (Photo Studio etc.) | I-102 NEEDS LIVE TEST |
| W9 | Reports (weekly executive, sales, service) | Run-time error checks; metric correctness |

## Launch-critical issue cross-reference (parent's list)

| ID | Surface | Audit hook in Sprint 1.2/1.3 |
|---|---|---|
| I-240 | Backend / VIN | W4 — push-to-VIN; capture vin-safe-mcp `prepare` response without executing |
| I-244 | Security — IDOR `/api/vin/leads/summary?orgId=` | API probe with `serra_honda@huminic.ai` token requesting another org id; expect 403 (currently returns data) |
| I-245 | Security — `/api/settings/org` AI section | API probe PATCH with AI fields as org_admin; expect 403 (currently allowed) |
| I-246 | Security — role dropdown in `/settings` user mgmt | DOM snapshot of user-create dialog; verify whether super_admin/partner_admin appear |
| I-247 | Security — slug overwrite | API probe PATCH `/api/organizations/:id` with `slug` field; expect 400 (currently silently writes) |
| I-248 | Backend — invalid timezone breaks outbound gate | Read-only: query `organizations.timezone`, scan for non-IANA values |
| I-249 | Security — self-deactivation | DOM snapshot of user-edit dialog; check whether deactivate button is disabled for current user |
| I-250 | TeamBox — CommGate silent drop | W3 — when CommGate flag flips `false`, observe whether UI shows banner or fails silently |
| I-252 | Widget — unbounded chat history | Read code only at `server/routes/public.ts:313-314`; flag fix |
| I-253 | JSON.parse unguarded | Read code at `hunchService.ts:73`, `webhooks.ts:80`; flag fix |
| I-254 | AI race after takeover | Read code at `sms.ts:464-530`; flag fix |
| I-255 | TeamBox — no Return-to-AI button | W3 — DOM snapshot; verify button absence |
| I-269 | Chat — `{{dealershipName}}` literal | W7 — start a chat as Serra Honda user; check first AI response for literal placeholder |
| I-270 | Service campaign bulk CSV 404 | W2 — click "Upload CSV" without selecting a campaign; expect 404 |
| I-279 | VIN lead source resolution | Read-only DB query; count resolved vs unresolved sources for Serra Honda this week |

## Tools to use

- `mcp__playwright-test__browser_navigate` — load each URL
- `mcp__playwright-test__browser_snapshot` — DOM snapshot
- `mcp__playwright-test__browser_take_screenshot` — visual capture
- `mcp__playwright-test__browser_console_messages` — JS errors
- `mcp__playwright-test__browser_network_requests` — API call inventory
- `mcp__playwright-test__browser_click` / `browser_fill_form` — read-only navigation only
- Direct DB query via existing harness or psql for read-only checks (categorized in test-safety-check.sh)

## Two-deltas-of-proof plan for Task #3

- **Delta 1 (per-page Playwright MCP run):** screenshot + DOM snapshot + console + network logs at `evidence/preflight-ui-truth-2026-04-26/{screenshots,dom-snapshots,console-logs}/<page>-<UTC>.{png,md,log}`
- **Delta 2 (independent observation):** at least one DB-state cross-check OR network-tab API-response cross-check per finding (e.g., I-247 needs API response, not just UI screenshot)

## Constraints (operator + harness)

- Read-only UI walks. No form submits, no campaign creates, no CSV uploads, no test-lane messages.
- API probes for security issues (I-244–I-249) MUST use the read-only Bearer of the live session; expected outcomes are 403/400 — if a probe SUCCEEDS where it should be denied, capture but DO NOT exploit (do not enumerate other orgs, do not write).
- All Playwright traffic goes against `dev.huminicdev.com` (port 5000 PM2). Live (`live.huminic.app`, port 5001 Coolify) is touched only for read-only smoke if dev is unhealthy.
- No UI scope-marker decisions for Task #3 — audit is read-only.

## What I will NOT do in Task #3

- Trigger any send (SMS / email / voice)
- Create / modify any record
- Upload any CSV
- Exploit any IDOR beyond a single confirmation probe
- Touch any UI file
- Restart pm2 or modify .env
- Push to remote

## What I will produce

| Artifact | Path |
|---|---|
| Sprint 1.2 deliverable | `evidence/preflight-ui-truth-2026-04-26.md` |
| Sprint 1.3 deliverable | `evidence/preflight-e2e-workflows-2026-04-26.md` |
| Screenshots | `evidence/preflight-ui-truth-2026-04-26/screenshots/<page>-<UTC>.png` |
| DOM snapshots | `evidence/preflight-ui-truth-2026-04-26/dom-snapshots/<page>-<UTC>.md` |
| Console logs | `evidence/preflight-ui-truth-2026-04-26/console-logs/<page>-<UTC>.log` |
| Network captures (subset) | inline in Sprint 1.3 doc |

## Hand-off into Task #4

Sprint 1.2 + 1.3 outputs become the input to Task #4 (promote launch-critical findings into a fix list). Task #4 STOPS and presents to operator before any fix begins.

---

This file is working notes, not audit output. It will be removed or folded into the actual deliverables when Task #3 begins.
