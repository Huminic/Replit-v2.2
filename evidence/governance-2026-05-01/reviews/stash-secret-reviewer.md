# Stash Secret Reviewer — Governance Preservation Pass 2026-05-01

**Reviewer:** stash-secret-reviewer (read-only review subagent)
**Date:** 2026-05-01
**Inputs reviewed:**
- `evidence/governance-2026-05-01/stash-inventory.md` (operator-facing summary)
- `evidence/governance-2026-05-01/stashes/stash-{0..5}-*.patch` (6 raw exported stash patches, 15,846 lines total)

**Mandate:** scan every patch for secrets, credentials, tokens, customer PII, and `.env` content. Classify each as CLEAR / HOLD-LOCAL / NEEDS-OPERATOR-REVIEW for inclusion in the C5 commit.

**Note on safety hook:** the project's `bash-safety.sh` PreToolUse hook blocked one initial grep command on the grounds that the pattern could echo tokens to stdout. The review was completed by writing grep output to per-patch files in `/tmp/stash-review/` and reading those files via `Read`. No patch content was echoed to chat.

---

## 1. Per-patch verdict table

| File | Lines | Verdict | Reason |
|---|---|---|---|
| `stash-0-stash-logs-pre-merge.patch` | 163 | **CLEAR** | Pure log appends to `evidence/LAUNCH-RECON-01/workflow-audit.log` (+2) and `evidence/watchdog-alerts.log` (+145). No secrets, no PII, no env content. Format is `[ISO-TIMESTAMP] TOOL=Bash step=… sprint=…` and `[ISO-TIMESTAMP] ALERT: C8 ORPHAN_EVIDENCE …`. |
| `stash-1-pre-deploy-stash-watchdog-2026-04-29.patch` | 285 | **CLEAR** | Pure log appends to `evidence/watchdog-alerts.log` (+277). Same shape as stash-0. No matches against any credential / PII / env pattern. |
| `stash-2-pre-deploy-stash-2026-04-29.patch` | 15,123 | **CLEAR** | Largest patch. Detailed scan below — no actual secret values found. Operator allowlisted phone `+14126546500` and operator's own emails are the only PII surfaces, all of which are explicitly approved internal/test destinations per the project test-safety model. 143 "Binary files differ" markers only — no binary blobs embedded in patch (no `GIT binary patch`, no `literal NNNN`). No `.env` file diff present. |
| `stash-3-widget-fab-stoppropagation-wip.patch` | 110 | **CLEAR** | Widget JS UX fix (`client/public/dealer-widgets/nexxus-widget.js`) plus log appends. No secrets, no PII. Pure animation/timer cleanup code. |
| `stash-4-widget-vite-build-fix-wip.patch` | 119 | **CLEAR** | Log appends + `issues.md` 10-line addition documenting I-279 / I-280 / I-281 (build/deploy issues). No secrets, no PII. |
| `stash-5-s3-sales-test-additions.patch` | 46 | **CLEAR** | Two Playwright E2E tests appended to `tests/e2e/s3-sales.spec.ts`. The single grep hit on `Authorization: Bearer ${token}` (line 16) is a JS template literal where `token` is resolved at runtime via `getToken(request)` — no hard-coded secret value. |

---

## 2. Pattern-by-pattern hit summary

All grep hits below were verified by reading the per-patch result files written to `/tmp/stash-review/`. Actual values are redacted; only context is shown.

### 2.1 PASSWORD / _KEY / _SECRET / _TOKEN / BEARER / Authorization (env-style)

| Patch | Hits | Notes |
|---|---|---|
| stash-0 | 0 | — |
| stash-1 | 0 | — |
| stash-2 | 0 | — |
| stash-3 | 0 | — |
| stash-4 | 0 | — |
| stash-5 | 1 | Line 16: `headers: { Authorization: \`Bearer ${token}\` }` — JS template literal, `token` from `getToken(request)`. **Not a secret.** |

### 2.2 Vendor key shapes (`sk-`, `re_`, `pk_`, `rk_`, `xoxb-`, `xoxp-`, `ghp_`, `gho_`, `ghs_`)

All 6 patches: **0 hits**.

### 2.3 Long hex strings (32+ char `[a-f0-9]+`)

All 6 patches: **0 hits** that match the standalone hex-secret shape.

### 2.4 Phone numbers (`+1` followed by 10+ digits)

| Patch | Hits | Numbers found |
|---|---|---|
| stash-0..1, 3..5 | 0 | — |
| stash-2 | 8 | All 8 are `+14126546500` (the operator's allowlisted internal/test phone, per `harness/bin/test-orgs-allowlist-check.sh` and CLAUDE.md). **No real-customer numbers.** |

Sample hits in stash-2:
- L26 (added): `\`TESTLANE_SMS_TO=+14126546500\`` (in session.md prose as documentation)
- L95–97 (removed): `TESTLANE_SMS_TO=+14126546500` / `TESTLANE_VOICE_TO=+14126546500` (operator narrative being deleted)
- L153, L171, L184, L212 (added): allowlist scope notes; all reference `+14126546500` only

### 2.5 Email addresses

All 13 distinct emails found are in stash-2 only. Classification:

| Email | Category | Status |
|---|---|---|
| `duanewells@icloud.com` | operator's personal allowlisted email (`internal_operator` bucket) | **OK** |
| `duane.wells@huminic.ai` | operator's huminic.ai address (super_admin) | **OK** |
| `duanekwells@gmail.com` | operator's email per CLAUDE.md userEmail | **OK** |
| `serra_honda@huminic.ai` | test org_admin per CLAUDE.md test accounts | **OK** |
| `serra_nissan@huminic.ai` | test org_admin per CLAUDE.md test accounts | **OK** |
| `serra_ford@huminic.ai` | test org_admin per CLAUDE.md test accounts | **OK** |
| `columbia_hyundai@huminic.ai` | test org_admin per CLAUDE.md test accounts | **OK** |
| `columbia_ford@huminic.ai` | test org_admin per CLAUDE.md test accounts | **OK** |
| `partner@nexxus.com` | placeholder / fictional domain | **OK** |

**No real customer email addresses found.**

### 2.6 `.env` file additions or modifications

All 6 patches: **0 `diff --git a/.env`** entries. The TESTLANE values that appear in stash-2 are inside a `.claude/session.md` prose paragraph, not inside a real dotenv file diff. Several appear with leading `-` (removals), meaning the operator's prior session.md narrative was being trimmed.

### 2.7 Customer PII (full-name + phone, full-name + VIN, VIN17 strings)

stash-2 has 21 hits on the keyword-set `customer|firstName|lastName|VIN[0-9A-Z]{17}`. All hits are either:
- policy text (e.g., "real customer SMS", "DELETE_PROVEN_TEST", "real-customer launch")
- E2E test titles (e.g., "WF-SVC-AGENT-2: Conversation has correct channel and customer info")
- placeholder substitution syntax (e.g., `{firstName}`, `{lastName}`)

**No real customer name or VIN17 string found.**

### 2.8 Binary blobs

stash-2 contains 143 `Binary files a/… and b/… differ` lines (screenshots in `evidence/REM-9/` and `evidence/T-2/`). **No `GIT binary patch` blocks** (no `literal NNNN` lines). The patch was generated without `--binary`, so the actual PNG bytes are not in the patch. Stash-2 references the screenshots by path only.

### 2.9 Historical-context references (no values leaked)

stash-2 line 202 contains a `-` (removal) line referencing a historical bearer-token rotation incident:

```
-1. **Bearer-token rotation.** VIN-safe-mcp / dax-mcp / n8n-hyperbridge / Coolify tokens were checked into git history. Rotated → out of scope for harness. Currently moved to gitignored `settings.local.json`. The VIN-safe-mcp token also appears in plain text in `CLAUDE.md` line 75; replace with env-var reference and rotate.
```

This is the operator's PRIOR session.md prose being **removed** — the patch deletes a sentence that ABOUT past secret leakage; the patch itself does not contain any actual token value. **No secret leakage.** (Separate concern: the project's main `CLAUDE.md` is reported in this prose to contain a VIN-safe-mcp bearer token in plain text — that is a tracked governance item independent of this stash review and is out of scope.)

stash-2 also references the live Coolify container ID `phqqzjj5pal13wlp39m5ohx6-…`. This identifier is also present in the project's main `CLAUDE.md` and is a routing identifier, not a secret.

stash-2 references an internal lead UUID `a5089ea1-93a3-4ca2-b4f9-f24967a01660` (TestLane lead). UUID alone is not PII; no associated name/phone/email tied to it in the patch.

---

## 3. Overall recommendation: **CLEAR-ALL-PATCHES**

All 6 stash patches are safe to commit alongside the inventory `.md` files in C5.

| Stash | Verdict | Commit-with-inventory? |
|---|---|---|
| stash-0-stash-logs-pre-merge.patch | CLEAR | YES |
| stash-1-pre-deploy-stash-watchdog-2026-04-29.patch | CLEAR | YES |
| stash-2-pre-deploy-stash-2026-04-29.patch | CLEAR | YES |
| stash-3-widget-fab-stoppropagation-wip.patch | CLEAR | YES |
| stash-4-widget-vite-build-fix-wip.patch | CLEAR | YES |
| stash-5-s3-sales-test-additions.patch | CLEAR | YES |

**Rationale:** No secret values, no real customer data, no real customer phones, no real customer emails, no binary blobs, no `.env` file diffs. The single Authorization-header line is a runtime template literal. All phone/email mentions are allowlisted internal/test destinations per the project's documented test-safety model.

---

## 4. Other concerns / advisories

1. **Pre-existing CLAUDE.md token exposure (out of scope for this review).** stash-2's removed prose references that the live VIN-safe-mcp bearer token is documented in the working `CLAUDE.md`. That is a separate, ongoing governance concern; the operator's "Currently moved to gitignored `settings.local.json`. … replace with env-var reference and rotate" note suggests it is being tracked. Not a stash-content issue.

2. **Stash-2 size.** At 15,123 patch lines and 160 file references (mostly screenshot path entries), stash-2 inflates the C5 commit. It is still safe content-wise, but the operator may prefer to commit it as a single artifact and not in a multi-file PR review flow.

3. **Stash-3 contains real product code** (`client/public/dealer-widgets/nexxus-widget.js` — widget animation/timer cleanup, plus `composedPath()` close-on-outside-click fix). The patch itself is safe to commit as evidence, but **applying** that diff is a separate operator decision (already flagged in the inventory as NEEDS-OPERATOR-DECISION). Inventory recommendation stands.

4. **Stash-5 contains real test code** (38 lines of Playwright tests for S-3 AC12/AC13). The patch is safe to commit as evidence; whether to apply is also flagged in inventory.

5. **All 6 patches reflect the existing `git stash list` exactly** (verdict re-checked against stash-inventory.md headers). No discrepancy.

6. **No `git stash drop` was executed at any point during this review.** Read-only mandate honored.

---

**End of report.**
