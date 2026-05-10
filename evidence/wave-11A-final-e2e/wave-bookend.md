# Wave 11A — Final E2E + go/no-go

**Phase:** 11 (Release Gov + Final E2E)
**Branch:** `wave/11-gov/11A-final-e2e` off `batch-1-finish-line` @ `bdf148d`
**Plan reference:** plan.md row 13 — "Final E2E + go/no-go (includes Phase-2 route matrix walk; preferably AFTER 11-Gov G1 fix lands AND TextMagic dashboard URL is corrected)"

---

## OPENING (2026-05-10T19:19Z)

### Wave 11A purpose

This is the LAUNCH wave. 11 waves of dev-factory work have shipped to `batch-1-finish-line`. Live Coolify container is still on `becb739` (pre-all-11-waves). Wave 11A:

1. Verifies the cumulative `batch-1-finish-line` state via autonomous E2E paths on dev (Serra Honda Test Lane)
2. Triages 9 carry-forward operator/orchestrator action items into ship-with-v2.2 / fix-now-block-launch / defer-to-v2.3 buckets
3. Produces a launch-captain go/no-go recommendation
4. On operator GO: PR `batch-1-finish-line` → `main`, Coolify auto-deploys to `live.huminic.app`, post-deploy smoke test

### Scope (3 phases)

| Phase | Owner | Action |
|---|---|---|
| **Phase 1** | `e2e-evaluator` (team via SendMessage) | Autonomous E2E sweep on Serra Honda Test Lane. Per `~/Claude-store/sysadmin/harness/TESTING_DOCTRINE.md` pre-prod level. Capture recorded evidence. |
| **Phase 2** | `launch-captain` (team via SendMessage) | Review E2E results + 9 carry-forwards + launch checklist. Produce go/no-go recommendation with explicit reasoning per carry-forward. |
| **Phase 3** | operator | Final go decision. If GO: orchestrator opens PR, operator merges, Coolify deploys. |
| **Phase 4** (if GO) | orchestrator + `e2e-evaluator` | Post-deploy smoke test on `live.huminic.app`. |

### 11 waves' cumulative changeset (committed to `batch-1-finish-line` since `becb739`)

| Wave | Phase | What |
|---|---|---|
| 1A, 1B | 1 | statusclassifier, weekly-report sales-only filter |
| 1C | 1+5 | Metric honesty server-side |
| I-Auth | 1 | Auth/account integrity audit (read-only) |
| 3F | 5 | Insights/Sales metric UI (em-dash threshold + chart fix + work-center route) |
| 11-Gov | 11 | Harness session-marker investigation + D-I3 console-error finding |
| 2A | 7+10 | Direct outbound provider proof (SMS + VAPI Elliott→Nancy) — T4 PARTIAL carry-forward |
| 2B | 8 | Widget chat / callback / form provider proof |
| 3A | 3 | TeamBox Push-to-VIN UI stub (route preserved per operator pivot; BL-001 backlog) |
| 3B | 6 | Marketing agent functionality fix (OPENAI_API_KEY rotation, config-only) |
| 9-Sec | 1+9 | 5 v2.2-critical security fixes (I-244 IDOR, I-245 AI PATCH, AUTH-D forgot-password, I-247 slug, I-249 self-deactivate) |

### 9 carry-forward action items (for Phase 2 triage)

| # | Item | Source | Blocking? |
|---|---|---|---|
| 1 | TextMagic dashboard URL fix (`I-NEW-2026-05-07-TEXTMAGIC-URL`) | Wave 2A | ~Yes — silent inbound-SMS drop on live if not fixed before customer-facing launch |
| 2 | Wave 11-Gov G1 cross-project fix | Wave 11-Gov | No |
| 3 | Dev VAPI/Tavus webhook env config (`I-NEW-2026-05-08-DEV-PM2-WEBHOOK-AUTH`) | Wave 2A | No (only blocks dev-side webhook testing) |
| 4 | BL-001 Push-to-VIN route-removal decision | Wave 3A | No (UI hidden) |
| 5 | BL-002 Marketing Insights data + reports | Wave 3C | No (UI as-is) |
| 6 | `I-NEW-2026-05-10-A-MAPS-KEY` Google Maps key | Wave 3B | No |
| 7 | `I-NEW-2026-05-10-B-MAPS-BODY` maps-proxy body shape | Wave 3B | No |
| 8 | `I-NEW-2026-05-10-D-SELF-ROLE` (sibling to I-249) | Wave 9-Sec | No |
| 9 | `I-NEW-2026-05-10-E-ADMINEMAIL-NORM` (AUTH-D parity) | Wave 9-Sec | No |

Plus Wave 2A T4 PARTIAL (dev webhook env-blocked) — already-disclosed PARTIAL, not blocking.

### Testing level

**`pre-prod`** per `~/Claude-store/sysadmin/harness/TESTING_DOCTRINE.md`. This is the highest pre-deploy testing bar:
- E2E coverage of every critical user-facing flow on dev
- Provider boundaries (Anthropic, VAPI, TextMagic, Resend, Tavus, OpenAI) verified
- Allowlist-only destinations (no real customer touched)
- Recorded evidence (Playwright screenshots, network captures, server logs, DB row counts)
- Two-deltas-of-proof per E2E path

### Two-deltas-of-proof contract

Each E2E path captures:
- **Delta 1:** Playwright MCP recorded session — screenshots + network log
- **Delta 2:** Server-side observation — pm2 log slice + DB row inspection + provider dashboard cross-check

### Verifier roster (consolidated final check)

At Wave 11A CLOSING:
- `code-reviewer` (blind verifier) — final diff vs cumulative changeset, byte-level integrity check
- `scope-guardian` (scope + drift consolidated) — confirm all 11 waves' declared scope held; no silent additions
- `integration-safety` — provider boundary final audit across all 11 waves
- `launch-captain` — final go/no-go verdict
- `e2e-evaluator` — final E2E pass verdict

5 verifiers at the final gate (more than per-wave's 4 because this is the launch decision).

### Risk profile

| Risk | Mitigation |
|---|---|
| E2E sweep surfaces a regression | If found: triage immediately — either fix-now-block-launch (rare) or carry-forward + ship anyway (likely). Operator decides. |
| Launch-captain returns NO-GO | Wave 11A pauses; orchestrator + operator address the blocker; re-run gate |
| Coolify deploy fails | Operator-only operation; orchestrator does NOT touch Coolify directly. Post-deploy smoke catches if it broke |
| Live site smoke fails post-deploy | Roll back via Coolify (operator action); diagnose; either hot-fix or revert PR. Don't panic |
| Cross-project hooks fire | All 9 cross-project items are non-blocking; harness-orchestrator boundary holds |

### Hard out-of-scope (still)

- ANY new feature implementation in v2.2
- ANY schema migration on production
- ANY real-customer-touching write
- ANY UI change beyond what's already in `batch-1-finish-line`

### Team dispatch

**This wave uses SendMessage to existing teammates** per CLAUDE.md TEAM DISPATCH DEFAULT. The 8 teammates are idle and ready:
- Phase 1: SendMessage to `e2e-evaluator`
- Phase 2: SendMessage to `launch-captain`
- Phase 3-4 verifier gate: parallel SendMessage to all 5 verifier roles

### Posture at OPENING

- Branch: `wave/11-gov/11A-final-e2e` at `bdf148d`
- Working tree: 4 untracked (auto + parked) only
- Team: 8 idle teammates ready
- 11 waves' worth of code in `batch-1-finish-line`; live on `becb739`

---

(Phase 1 dispatch + CLOSING to follow.)
