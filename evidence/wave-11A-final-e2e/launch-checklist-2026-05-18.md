# Nexxus v2.2 Pre-Relaunch Launch Checklist

**Date:** 2026-05-18
**Target relaunch:** this week (operator: "tomorrow preferably")
**PR:** https://github.com/Huminic/Replit-v2.2/pull/7 (draft — do not merge until step 5 below)
**Branch:** `batch-1-finish-line` HEAD `4e64a2d` (20 commits ahead of `main`)
**Live container current:** `becb739` (pre-all-12-waves, post-launch will be the post-merge container)

This is the operator-facing checklist for the relaunch sequence. Items are in execution order. Items marked **OPERATOR** are operator-only actions; items marked **AUTONOMOUS** are orchestrator-executable inside the 3-category boundary; items marked **CO** require both.

---

## Phase A — Pre-merge code-level conditions (DONE this autonomous run)

| # | Item | Owner | State |
|---|---|---|---|
| A1 | I-236 VAPI fail-closed gate rolled back (server/routes/webhooks.ts) so dev/live accept inbound VAPI calls without dashboard-side secret | AUTONOMOUS | ✅ DONE — committed `b75c467` |
| A2 | Self-hosted widget script hardened: createElement+textContent (no innerHTML interpolation), AbortController+5s timeout, https-scheme allowlist on iframe src, Cache-Control max-age 24h→1h | AUTONOMOUS | ✅ DONE — committed `4e64a2d`, code-reviewer APPROVE |
| A3 | Savannah (Ford of Columbia) + Georgia (Tony Serra Ford) VAPI assistants PATCHed: SERVICE INTENT prompt block, transferCall tool, silenceTimeoutSeconds 30→60, endCallPhrases populated, Savannah AVAILABLE TOOLS hallucination block stripped | AUTONOMOUS | ✅ DONE — script `tests/vapi-apply-ford-service-fix.mjs`; reproducer `tests/qa-vapi-chat-multi.mjs` confirms behavior change |
| A4 | Dev `npm run build` + `pm2 restart nexxus-app --update-env` to activate A1 + A2 in the running process | AUTONOMOUS | ✅ DONE — dist/index.cjs rebuilt 06:18 UTC; dev VAPI endpoint now returns HTTP 400 (was 503), dev widget endpoint serves new hardened JS |
| A5 | ff-merge `wave/11-gov/11A-final-e2e` → `batch-1-finish-line` + push origin | AUTONOMOUS | ✅ DONE — `batch-1-finish-line` pushed to origin at `4e64a2d` |
| A6 | Open PR draft `batch-1-finish-line` → `main` | AUTONOMOUS | ✅ DONE — PR #7 draft |

---

## Phase B — Operator review (before final evals)

Operator reviews these artifacts before clearing the final-evals gate. Each is a markdown file the operator can open + read.

| # | Item | Path | Action |
|---|---|---|---|
| B1 | Report inventory — 10 operator-facing reports + per-report state + decision questions | `evidence/wave-11A-final-e2e/report-inventory-2026-05-18.md` | Decide which reports stay, change, or defer |
| B2 | VAPI Ford service fix outcome | `evidence/wave-11A-final-e2e/vapi-ford-service-fix-2026-05-18.md` | Confirm transferCall destinations (+19313692815 Savannah → Ford of Columbia main; +12562455000 Georgia → Tony Serra Ford main); if Nancy has a direct line, decide whether to update destinations |
| B3 | Customer-impact quantification | `evidence/recon-2026-05-12-live-health/customer-impact-quantification.md` | Reference for any future Serra-team conversation about the silence window |
| B4 | Recon side-sprint findings (master bookend) | `evidence/recon-2026-05-12-live-health/recon-bookend.md` | Reference for what was discovered + classified |

---

## Phase C — Operator-decision conditions identified but NOT auto-applied

These are real quality issues integration-safety flagged. They are not auto-applied tonight because they require operator judgment (which copy to keep, which to remove, etc.). Operator-decision items:

| # | Item | Identified by | Recommendation |
|---|---|---|---|
| C1 | Caroline (Serra Honda) system prompt lists dealership address as `569 Auto Mall Circle, Birmingham, AL 35214` — that's an old Birmingham location, NOT Sylacauga | integration-safety Task #2 | Update via VAPI API PATCH with correct Sylacauga address |
| C2 | Elizabeth (Hyundai of Columbia) prompt: typo "Hyundia"; carries Nissan pronunciation guide (NEE-sahn, ROHG, mur-AH-no) + Nissan-Rogue example | integration-safety Task #2 | Remove Nissan-specific text; fix "Hyundia" → "Hyundai" |
| C3 | Georgia (Tony Serra Ford) prompt: carries Nissan pronunciation guide + Nissan-Rogue example | integration-safety Task #2 | Remove Nissan-specific text |
| C4 | Elizabeth's 4 tool URLs point at `nexxusdev.huminicdev.com` which returns 502 (dead). Tool-calling silently broken since 2026-04-07 | integration-safety Task #2 | Either repoint to `live.huminic.app/api/vapi/tools/*` after verifying those exist, OR remove the tools from Elizabeth's config (since the prompt promises them but they're dead anyway) |
| C5 | All 5 VAPI assistants' `server.url` → `dev.huminicdev.com/api/webhooks/vapi`. Now that dev accepts (A1+A4 above), this is fine for the relaunch sequence. After relaunch, decide whether to repoint to live | integration-safety Task #2 | Operator decision: stay on dev or move to live |

---

## Phase D — Operator-only steps before merge

| # | Item | Owner | State |
|---|---|---|---|
| D1 | TextMagic dashboard inbound webhook URL → `https://live.huminic.app/api/webhooks/textmagic` | OPERATOR | PENDING — operator's stated last step before evals |
| D2 | Operator final evals on dev (the eval mechanism integration-safety verified is working — see `tests/qa-vapi-eval-probe.mjs` for the API surface and the sample eval run `5ef399d8-1888-4678-a5bf-40d69969b733` that passed) | OPERATOR | PENDING — after D1 |
| D3 | Operator decisions on C1-C5 above (apply or defer) | OPERATOR | PENDING |
| D4 | Operator GO on PR merge | OPERATOR | PENDING — after D1, D2, D3 |

---

## Phase E — Deploy + post-deploy

| # | Item | Owner | State |
|---|---|---|---|
| E1 | Operator merges PR #7 on GitHub | OPERATOR | PENDING |
| E2 | Coolify auto-deploys main → live.huminic.app (5-10 min) | (automated) | PENDING |
| E3 | Post-deploy smoke test — 5-path abbreviated sweep on live | AUTONOMOUS (e2e-evaluator) | PENDING |
| E4 | Wave 11A CLOSING bookend + plan.md update + handoff write | AUTONOMOUS (orchestrator) | PENDING |

---

## Phase F — Serra trial-to-paid flip (when operator decides)

Serra's credit card on file landed 2026-05-18. Trial-to-paid flip is now available. NOT auto-triggered; operator decides timing.

| # | Item | Owner | State |
|---|---|---|---|
| F1 | Pre-flip sanity check — `SELECT COUNT(*), action_type FROM scheduled_actions WHERE executed_at IS NULL AND organization_id = '<serra-honda-id>' GROUP BY action_type` — must return 0 rows (per `I-NEW-2026-05-12-G` recommendation; Caroline scheduler verified concurrent-safe but check the queue at flip moment) | AUTONOMOUS | PENDING |
| F2 | DB UPDATE: clear `triggerTestPhones` whitelist on serra-honda org settings | CO (operator approval + me execute) | PENDING |
| F3 | Coolify env flip `TESTLANE_MODE=true` → `false` + restart container | OPERATOR | PENDING |
| F4 | Watch first hour of live activity on Serra Honda | AUTONOMOUS (e2e-evaluator) | PENDING |

---

## Phase G — Wave-end (after E + F complete)

| # | Item | Owner | State |
|---|---|---|---|
| G1 | TeamDelete `nexxus-v22-release-factory` | AUTONOMOUS | PENDING |
| G2 | session-output.md handoff write | AUTONOMOUS | PENDING |
| G3 | plan.md update: Wave 11A → DONE | AUTONOMOUS | PENDING |

---

## Summary for the operator

**You can ship right now after one operator-side action:**

1. Fix the TextMagic dashboard URL (D1) → 30 seconds
2. (Optional but recommended) Review the 4 evidence files in Phase B
3. Decide on the C1-C5 cleanups (apply via VAPI API or defer)
4. Run your final evals (D2)
5. Merge PR #7
6. Coolify auto-deploys
7. Watch the post-deploy smoke result
8. When you decide, do Phase F to flip Serra to paid mode

Everything else in Phases A-E is either done or autonomous. Phases F + G run on your timing.
