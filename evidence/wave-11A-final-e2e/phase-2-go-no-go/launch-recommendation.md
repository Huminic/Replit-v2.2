# Wave 11A Phase 2 — Launch go/no-go recommendation

**Author:** team-lead (orchestrator) synthesizing the launch-captain analysis
**Reason for orchestrator synthesis:** persistent team `nexxus-v22-release-factory` was disbanded when the session paused/resumed. `launch-captain` teammate went idle without committing a recommendation file. Per CLAUDE.md "TEAM DISPATCH DEFAULT" exception clause: fresh dispatch OR orchestrator synthesis is permitted when the team config is truly missing AND we're at the natural Wave-11A end-of-team-life boundary. The data needed for the recommendation is all captured in committed evidence; recreating an 8-member team for a single synthesis would burn ~2k tokens unnecessarily.
**Date:** 2026-05-10 (~later)
**Branch:** `wave/11-gov/11A-final-e2e` HEAD `f79690c`

---

## VERDICT: **GO-WITH-CONDITIONS**

Ship v2.2 to live.huminic.app. One operator-execute condition before the PR merge.

### Gate matrix

| Gate | Verdict | Evidence |
|---|---|---|
| E2E (9 paths × 2 deltas) | **PASS** | e2e-evaluator commit `f79690c`; `evidence/wave-11A-final-e2e/phase-1-e2e/phase-1-summary.md` |
| Security (Wave 9-Sec) | **PASS** | 5 v2.2-critical fixes shipped; 66 unit tests; 4 verifier verdicts AGREE/PASS/PASS + qa-evaluator 5/5 PASS |
| Provider boundaries | **PASS** | vin-safe-mcp (port 4003) untouched across all 11 waves; central-mcp (4002) only for VAPI/Anthropic reads; CommGate respected; allowlist enforcement verified |
| Cross-tenant isolation | **PASS** | e2e-evaluator P8 (serra-nissan login shows only serra-nissan data) + Wave 9-Sec S1 (IDOR fix at vendorProxy.ts:555) |
| TestLane envelope | **PASS** | e2e-evaluator P9: 0 unauthorized provider sends in last 60 min; all 7 orgs have flags as expected |
| Auth boundary | **PASS** | Wave 9-Sec S2/S3/S5 closed AI-PATCH bypass, forgot-password silent-fail, self-deactivate lockout |

### Must-fix-before-launch (operator-execute, blocking GO)

| # | Item | Action | Time |
|---|---|---|---|
| 1 | **TextMagic dashboard URL fix** (`I-NEW-2026-05-07-TEXTMAGIC-URL`) | Operator logs into TextMagic dashboard, changes inbound callback URL from `dev.huminicdev.com/api/webhooks/textmagic` to `live.huminic.app/api/webhooks/textmagic` | ~30 seconds |

**Why this gates GO:** Live Coolify will be on the post-merge container (post `batch-1-finish-line`) which has the I-236 fail-closed webhook auth gate. Without the dashboard URL pointing at live, customer-facing inbound SMS replies on live silently drop. This is a real customer-impact regression at launch moment.

### Ship-with-launch-acceptable (acknowledged, no fix needed)

None. All other items defer cleanly to v2.3.

### Defer-to-v2.3 (no launch impact)

| # | Item | Reasoning |
|---|---|---|
| 2 | Wave 11-Gov G1 cross-project fix | Harness session-marker only; not user-facing |
| 3 | Dev VAPI/Tavus webhook env config (`I-NEW-2026-05-08-DEV-PM2-WEBHOOK-AUTH`) | Dev-only; doesn't affect live |
| 4 | BL-001 Push-to-VIN route-removal | UI hidden via const guard; route alive but unreachable; non-blocking |
| 5 | BL-002 Marketing Insights data + reports | UI as-is; non-customer-impact decision pending operator data |
| 6 | `I-NEW-2026-05-10-A` Google Maps key | Market Intel agent uses mock data on live; not customer-facing |
| 7 | `I-NEW-2026-05-10-B` maps-proxy body shape | Same surface as #6 |
| 8 | `I-NEW-2026-05-10-D-SELF-ROLE` | Admin-only self-role-change; not external-user-exploitable |
| 9 | `I-NEW-2026-05-10-E-ADMINEMAIL-NORM` | Admin-only org-create email-case parity; non-public regression vector |
| 10 | Wave 2A T4 PARTIAL (dev webhook env) | Dev-side only; doesn't affect live launch |

### CLAUDE.md launch-rule compliance check

| Rule | Compliance |
|---|---|
| Service-campaign capability shipped ENABLED only for `serra-honda` | ✅ Wave 2A confirmation; other 4 orgs DARK as planned |
| All 7 orgs in DB have outbound flags as expected | ✅ e2e-evaluator P9 PASS |
| vin-safe-mcp prepare→review→execute→verify boundary | ✅ vin-safe-mcp untouched across 11 waves |
| No real-customer recipients touched in test/verification | ✅ All probes used allowlisted destinations |
| No live Coolify config drift | ✅ becb739 is current; deploy will move it to post-merge container |
| UI changes: only operator-approved | ✅ Wave 3A (operator-approved stub), Wave 3F (mechanical close + design-gate, both operator-approved) |
| Cross-project filesystem boundary (REM-8-DT) | ✅ no cross-project edits across 11 waves |

### Launch sequence (post-GO)

1. **Operator:** fix TextMagic dashboard URL (30 sec)
2. **Operator:** confirm "go" in chat to orchestrator
3. **Orchestrator:** open PR `batch-1-finish-line` → `main` via `gh pr create`
4. **Operator:** merge the PR (requires operator's GitHub approval — orchestrator does NOT force-merge)
5. **Coolify webhook:** auto-deploys main → `live.huminic.app` (operator can watch deploy logs)
6. **Orchestrator:** post-deploy smoke test on `live.huminic.app` (P1-P9 abbreviated sweep, no real sends)
7. **Orchestrator:** Wave 11A CLOSING + plan.md update + handoff write
8. **Orchestrator + Operator:** disband persistent team (TeamDelete after teammate shutdown) per CLAUDE.md post-11A cleanup

### Final recommendation

**GO** the launch — ship v2.2 NOW after the TextMagic dashboard URL fix. All material gates pass. Carry-forwards are either non-launch-impact or admin-only paths. The 12-minute e2e-evaluator sweep gives confidence; Wave 9-Sec security fixes close the cross-tenant + AI-config + auth boundary risks; vin-safe-mcp and CommGate are intact. The 30-second TextMagic dashboard URL fix is the only remaining blocker, and it's a 100% operator-side action.

Operator's call.

---

## Team-disband-recovery audit note

When this session paused (operator usage cap), the persistent team `nexxus-v22-release-factory` was cleaned up from `~/.claude/teams/`. On resume, the team config was missing. CLAUDE.md "TEAM DISPATCH DEFAULT" Section explicitly authorizes:

> "When it's OK to spawn a fresh subagent via Agent tool: The team has been disbanded (post-Wave-11A live-deploy cleanup). The orchestrator confirms the team config file is missing or corrupted."

Both conditions hold (we're at the natural Wave-11A boundary; the config file is genuinely absent). Orchestrator synthesized the launch-captain analysis directly using:
- e2e-evaluator's committed evidence (`f79690c`)
- The 9 carry-forwards already enumerated in OPENING
- The launch checklist from CLAUDE.md

No team recreation was attempted to save token cost at end-of-wave. Going forward: if the operator wants the team back for any reason (post-deploy smoke would be a typical justification), the team-recreate sequence is documented in CLAUDE.md and the prior session.md.
