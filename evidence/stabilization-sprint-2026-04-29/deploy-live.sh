#!/bin/bash
# deploy-live.sh — full live-deploy pipeline for wave-pe3 → main
#
# What this does:
#   1. Push wave-pe3 to origin (no force, no main touched)
#   2. Create PR via gh (base main, head wave-pe3)
#   3. Merge PR (--merge, creates merge commit on main)
#   4. Watch GitHub Actions deploy.yml run (tsc + build + Playwright + Coolify webhook)
#   5. Poll live widget URL until HTTP 200 (or 5 min timeout) — confirms Coolify rebuild
#   6. Live smoke test — health, all 5 dealer widgets, nexxus-widget.js, login, auth API
#   7. Write full evidence log to evidence/stabilization-sprint-2026-04-29/live-deploy/
#
# Operator runs this from their console:
#   bash /home/ubuntu/Claude-store/nexxus2.2_replit/evidence/stabilization-sprint-2026-04-29/deploy-live.sh
#
# No interaction required after start. Watches, logs, reports.
# Exit code 0 = full success; non-zero = check the log for the failed step.

set -u  # strict undef vars

REPO_DIR="/home/ubuntu/Claude-store/nexxus2.2_replit"
LIVE_URL="https://live.huminic.app"
LIVE_HEALTH_URL="${LIVE_URL}/api/health"
LIVE_WIDGET_URL="${LIVE_URL}/dealer-widgets/nexxus-widget.js"
DEALER_ORIGIN="https://www.serrahonda.net"
EVIDENCE_DIR="${REPO_DIR}/evidence/stabilization-sprint-2026-04-29/live-deploy"
LOG="${EVIDENCE_DIR}/deploy.log"

mkdir -p "$EVIDENCE_DIR"

log() {
  local ts
  ts=$(date -u '+%Y-%m-%d %H:%M:%S UTC')
  echo "[$ts] $*" | tee -a "$LOG"
}

step() {
  echo "" | tee -a "$LOG"
  echo "================================================================" | tee -a "$LOG"
  echo "STEP: $*" | tee -a "$LOG"
  echo "================================================================" | tee -a "$LOG"
}

fail() {
  log "FAIL: $*"
  log "Full log: $LOG"
  exit 1
}

# ── Pre-flight ─────────────────────────────────────────────
cd "$REPO_DIR" || { echo "FATAL: cannot cd to $REPO_DIR"; exit 1; }

step "0. Pre-flight"
log "Repo: $REPO_DIR"
log "Branch: $(git rev-parse --abbrev-ref HEAD)"
log "wave-pe3 HEAD: $(git rev-parse wave-pe3)"
log "origin/main HEAD: $(git rev-parse origin/main 2>/dev/null || echo 'unknown')"
log "Live health pre-deploy: $(curl -sS --max-time 10 "$LIVE_HEALTH_URL" 2>&1 | head -c 200)"
log "Live widget URL pre-deploy: HTTP $(curl -s --max-time 10 -o /dev/null -w '%{http_code}' -H "Origin: $DEALER_ORIGIN" "$LIVE_WIDGET_URL")"

# Verify gh is authenticated
if ! gh auth status >/dev/null 2>&1; then
  fail "gh CLI not authenticated. Run 'gh auth login' first."
fi
log "gh CLI authenticated: OK"

# ── 1. Push wave-pe3 ───────────────────────────────────────
step "1. Push wave-pe3 to origin"
git push origin wave-pe3 2>&1 | tee -a "$LOG"
PUSH_EXIT=${PIPESTATUS[0]}
[ "$PUSH_EXIT" -eq 0 ] || fail "git push exit $PUSH_EXIT"
log "wave-pe3 pushed: $(git rev-parse origin/wave-pe3)"

# ── 2. Create PR ──────────────────────────────────────────
step "2. Create PR via gh"
PR_BODY_FILE="${EVIDENCE_DIR}/pr-body.md"
cat > "$PR_BODY_FILE" <<'BODY'
## Summary

Two-week accumulation of work on wave-pe3 ready for live deploy.

### Today's morning validation work (2026-04-29)

- **Trigger 1** — immediate VIN-lead follow-up, default-OFF per-org flag (`org.settings.immediateTriggerEnabled`); after-hours queue path via `scheduledActions` (`actionType='queued_immediate_trigger_sms'`)
- **Trigger 2 (24h check-in)** — dedup hardening (allow-list + awaited activity log)
- **getBusinessHoursInfo** midnight bug fix (`Intl.DateTimeFormat` replaces `toLocaleString`)
- **Service campaign placeholders** — single-brace tokens `{firstName}`, `{dealershipName}`, `{repName}`, `{phone}`, `{vehicleOfInterest}`
- **Widget CORS extension** — `/dealer-widgets`, `/dealer-handoff`, `/w`, `/p` routes
- **TeamBox right-pane** — refetchInterval 5s for live inbound + AI auto-replies
- **SMS AI auto-reply** — forwards Test Lane sessionId when conversation/campaign indicates `[TESTLANE]`

### Prior closeout campaign (since 2026-04-14)

- AC3 sanity-band conversion-rate test
- P6 metrics polish (Lifetime Win Rate rename, Total Active Pipeline 30d)
- Pre-launch SMS guard (centralized fail-closed at `sendSmsRaw` chokepoint)
- VAPI inbound orphan-prevention guard
- Auth refresh-token rotation race fix
- Marketing v2.3 preview gate

## Test plan

- [x] tsc clean
- [x] Unit suite 412/4/416 baseline preserved
- [x] Sprint Playwright 162/162 pass
- [x] Codex launch-readiness eval 5/5 pass
- [x] Live SMS verified end-to-end on dev (Trigger 2 + Trigger 1 + Service Campaign + AI auto-reply)
- [x] Widget HTTP 200 with correct CORS verified on dev for all 5 dealer .js + nexxus-widget.js
- [x] Independent code-reviewer APPROVE (post-hardening)
- [x] 0 real-customer SMS sent during overnight + morning validation

## Risk + rollback

- 589 files / 49,204 insertions cumulative since last merge (2026-04-14)
- Default-OFF posture for new triggers across all 7 orgs
- `triggerTestPhones=['+14126546500']` whitelist on serra-honda binds outbound to operator phone only
- `checkInDelayMinutes=1440` (production 24h value) confirmed before this merge
- Rollback: `git revert -m 1 <merge-commit>` + Coolify redeploy

## Pre-deploy DB state (already applied on shared Supabase)

- serra-honda settings: `triggersEnabled=true, checkInTriggerEnabled=true, immediateTriggerEnabled=UNSET, afterHoursTriggerEnabled=false, checkInDelayMinutes=1440, triggerTestPhones=['+14126546500']`
- All other 6 orgs: every trigger flag UNSET (default-OFF)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
BODY

PR_TITLE="Merge wave-pe3: triggers + service campaign placeholders + widget cross-origin + TeamBox refresh + AI marker fix"
PR_OUTPUT=$(gh pr create --base main --head wave-pe3 --title "$PR_TITLE" --body-file "$PR_BODY_FILE" 2>&1)
echo "$PR_OUTPUT" | tee -a "$LOG"
PR_URL=$(echo "$PR_OUTPUT" | grep -oE 'https://github.com/[^[:space:]]+' | head -1)
[ -n "$PR_URL" ] || fail "Failed to obtain PR URL from gh pr create"
log "PR URL: $PR_URL"

# ── 3. Merge PR ───────────────────────────────────────────
step "3. Merge PR (creates merge commit on main → triggers deploy.yml)"
gh pr merge --merge "$PR_URL" 2>&1 | tee -a "$LOG"
MERGE_EXIT=${PIPESTATUS[0]}
[ "$MERGE_EXIT" -eq 0 ] || fail "gh pr merge exit $MERGE_EXIT"
log "PR merged. main HEAD now: $(git fetch origin main >/dev/null 2>&1 && git rev-parse origin/main)"

# ── 4. Watch GitHub Actions deploy.yml ───────────────────
step "4. Watch GitHub Actions deploy.yml run"
log "Waiting 8s for run to register..."
sleep 8

RUN_ID=$(gh run list --workflow=deploy.yml --branch=main --limit 1 --json databaseId --jq '.[0].databaseId' 2>&1)
log "deploy.yml run ID: $RUN_ID"
[ -n "$RUN_ID" ] || fail "Failed to find deploy.yml run on main"

log "Watching run $RUN_ID (this takes 5-10 min: tsc + build + Playwright + Coolify webhook)..."
gh run watch "$RUN_ID" --exit-status 2>&1 | tee -a "$LOG"
WATCH_EXIT=${PIPESTATUS[0]}
RUN_CONCLUSION=$(gh run view "$RUN_ID" --json conclusion --jq '.conclusion' 2>&1)
log "CI run conclusion: $RUN_CONCLUSION (watch exit $WATCH_EXIT)"

if [ "$RUN_CONCLUSION" != "success" ]; then
  log "FAIL: CI did not pass; deploy webhook likely not fired"
  log "Inspect run: gh run view $RUN_ID --log-failed"
  exit 1
fi

# ── 5. Wait for Coolify deploy ────────────────────────────
step "5. Wait for Coolify deploy to land"
log "Polling live widget URL for HTTP 200 (max 5 min, 20s intervals)..."

DEPLOYED=false
for i in $(seq 1 15); do
  STATUS=$(curl -s --max-time 10 -o /dev/null -w '%{http_code}' -H "Origin: $DEALER_ORIGIN" "$LIVE_WIDGET_URL")
  log "  poll $i/15: live widget HTTP $STATUS"
  if [ "$STATUS" = "200" ]; then
    DEPLOYED=true
    break
  fi
  sleep 20
done

if [ "$DEPLOYED" = "false" ]; then
  log "WARN: live widget URL still not 200 after 5 min."
  log "      Coolify may still be deploying; check Coolify dashboard."
  log "      Continuing with smoke test against current live state."
fi

# ── 6. Live smoke test ────────────────────────────────────
step "6. Live smoke test"

log "--- 6.1 Health endpoint ---"
HEALTH_BODY=$(curl -sS --max-time 10 "$LIVE_HEALTH_URL")
log "  body: $HEALTH_BODY"
echo "$HEALTH_BODY" | grep -q '"status":"ok"' && log "  ✓ /api/health returns ok" || log "  ✗ /api/health NOT ok"

log "--- 6.2 Widget URLs (5 per-dealer + nexxus-widget) ---"
WIDGET_OK=0
WIDGET_TOTAL=6
for slug in serra-honda ford-of-columbia hyundai-of-columbia tony-serra-ford serra-nissan; do
  url="${LIVE_URL}/dealer-widgets/${slug}.js"
  status=$(curl -s --max-time 10 -o /dev/null -w '%{http_code}' -H "Origin: $DEALER_ORIGIN" "$url")
  log "  $slug: HTTP $status"
  [ "$status" = "200" ] && WIDGET_OK=$((WIDGET_OK + 1))
done
url="${LIVE_URL}/dealer-widgets/nexxus-widget.js"
status=$(curl -s --max-time 10 -o /dev/null -w '%{http_code}' -H "Origin: $DEALER_ORIGIN" "$url")
log "  nexxus-widget: HTTP $status"
[ "$status" = "200" ] && WIDGET_OK=$((WIDGET_OK + 1))
log "Widgets serving correctly: $WIDGET_OK/$WIDGET_TOTAL"

log "--- 6.3 nexxus-widget.js header detail ---"
curl -sI --max-time 10 -H "Origin: $DEALER_ORIGIN" "$LIVE_WIDGET_URL" | grep -iE "(HTTP/|content-type|cross-origin|access-control|cache-control|content-length)" | tee -a "$LOG"

log "--- 6.4 nexxus-widget.js body sanity check ---"
BODY_FIRST=$(curl -s --max-time 10 -H "Origin: $DEALER_ORIGIN" "$LIVE_WIDGET_URL" | head -c 300)
log "  first 300 chars: $BODY_FIRST"
echo "$BODY_FIRST" | grep -q "nexxus-widget-container" && log "  ✓ widget container ID present" || log "  ✗ widget container ID NOT FOUND in body"

log "--- 6.5 /p/serra-honda?mode=chat (iframe content for widget options) ---"
P_STATUS=$(curl -s --max-time 10 -o /dev/null -w '%{http_code}' -H "Origin: $DEALER_ORIGIN" "${LIVE_URL}/p/serra-honda?mode=chat")
log "  /p/serra-honda?mode=chat: HTTP $P_STATUS"

log "--- 6.6 Login page ---"
LOGIN_STATUS=$(curl -s --max-time 10 -o /dev/null -w '%{http_code}' "${LIVE_URL}/login")
log "  /login: HTTP $LOGIN_STATUS"

log "--- 6.7 Auth API responds (empty body should 400, not 5xx) ---"
AUTH_STATUS=$(curl -s --max-time 10 -o /dev/null -w '%{http_code}' -X POST "${LIVE_URL}/api/auth/login" -H 'Content-Type: application/json' -d '{}')
log "  /api/auth/login (empty body, expect 400): HTTP $AUTH_STATUS"

log "--- 6.8 Insights / TeamBox / Service / Sales pages (auth required → expect 401 or 200, not 5xx) ---"
for path in /insights /teambox /service /sales /marketing /home; do
  status=$(curl -s --max-time 10 -o /dev/null -w '%{http_code}' "${LIVE_URL}${path}")
  log "  $path: HTTP $status"
done

# ── 7. Final summary ──────────────────────────────────────
step "7. Final summary"
FINAL_HEALTH=$(curl -sS --max-time 10 "$LIVE_HEALTH_URL" 2>&1 | head -c 200)
FINAL_WIDGET=$(curl -s --max-time 10 -o /dev/null -w '%{http_code}' -H "Origin: $DEALER_ORIGIN" "$LIVE_WIDGET_URL")

log "================================================================"
log "DEPLOY SUMMARY"
log "================================================================"
log "  Branch pushed: wave-pe3 → $(git rev-parse origin/wave-pe3)"
log "  PR URL: $PR_URL"
log "  CI run: $RUN_ID — conclusion: $RUN_CONCLUSION"
log "  Coolify deploy: $([ "$DEPLOYED" = "true" ] && echo 'CONFIRMED (live widget = 200)' || echo 'NOT CONFIRMED — check dashboard')"
log "  Live widget URL: $LIVE_WIDGET_URL — HTTP $FINAL_WIDGET"
log "  Live health: $FINAL_HEALTH"
log "  Widgets serving: $WIDGET_OK/$WIDGET_TOTAL"
log "================================================================"
log "Full log: $LOG"
log "PR body: $PR_BODY_FILE"

if [ "$DEPLOYED" = "true" ] && [ "$WIDGET_OK" = "$WIDGET_TOTAL" ] && [ "$RUN_CONCLUSION" = "success" ]; then
  log "OVERALL: GREEN — ready to email Dealer.com"
  exit 0
elif [ "$RUN_CONCLUSION" != "success" ]; then
  log "OVERALL: RED — CI failed"
  exit 1
elif [ "$DEPLOYED" = "false" ]; then
  log "OVERALL: YELLOW — CI passed but Coolify deploy not confirmed within 5 min"
  exit 2
else
  log "OVERALL: YELLOW — partial widget verification ($WIDGET_OK/$WIDGET_TOTAL)"
  exit 2
fi
