# Session State — Pre-Compact Checkpoint (2026-04-29 19:00 UTC)

**For:** the next-context-Claude (after compaction)
**Operator status:** awake, copying me on Dealer.com email; needs live deploy completed before sending
**Live container:** STILL OLD (uptime 14.8 days, pre-our-merge); deploy not yet applied

---

## Where we are NOW (checkpoint)

| Stage | State |
|---|---|
| `wave-pe3` 8 morning commits + 17 prior | committed locally, pushed to `origin/wave-pe3` |
| GitHub PR #1 (`wave-pe3` → `main`) | **MERGED** at `origin/main = 87ce20d Merge pull request #1 from Huminic/wave-pe3` |
| GitHub Actions `deploy.yml` build-and-test job | ✅ all steps green (tsc, build, Playwright domain-12-infra) |
| `Trigger Coolify deployment` step in CI | ✅ webhook POST returned success |
| `Verify deployment` step in CI | ❌ FAILED but unrelated — `deploy.yml` has a buggy `curl "/"` (no full URL) that returns `000`. Pre-existing bug, NOT a real deploy failure. |
| **Coolify container actually rebuilt** | ❌ NO — `live.huminic.app/api/health` shows `uptime: 1279021` (14.8 days = since 2026-04-14, the last successful container build) |
| `live.huminic.app/dealer-widgets/nexxus-widget.js` | Still HTTP 500 `{"message":"Not allowed by CORS"}` (old container, pre-fix code) |
| Dev (`dev.huminicdev.com`) | ✅ all 5 + nexxus-widget.js serve 200 with correct CORS (verified pre-push) |

---

## What needs to happen next

The operator authorized me to handle the Coolify deploy via central-mcp CRUD. The Coolify webhook from CI fired but did NOT actually trigger a container rebuild — likely because:

1. The webhook URL or secret in GitHub Actions secrets is stale (rotated since 2026-04-14)
2. Or Coolify accepted the webhook but its rebuild logic didn't fire (silent fail)
3. Or the Coolify app's git source / branch tracking is misconfigured

**Action plan after compact:**

1. **Discover Coolify nexxus app** via central-mcp on port 4002:
   ```
   curl -sS http://0.0.0.0:4002/api/tool/coolify_list_applications -H "Content-Type: application/json" -d '{}'
   ```
   (Or whatever the actual Coolify list-tool name is — discover via central-mcp's tool catalog first if needed.)

2. **Find the application matching nexxus-2.2 / live.huminic.app** — likely UUID `phqqzjj5pal13wlp39m5ohx6...` per session.md prior reference.

3. **Trigger explicit redeploy** via central-mcp:
   ```
   curl -sS -X POST http://0.0.0.0:4002/api/tool/coolify_deploy_application \
     -H "Content-Type: application/json" \
     -d '{"applicationUuid":"<uuid>"}'
   ```

4. **Watch for container restart** — poll `/api/health` until `uptime` drops below ~120s (indicates fresh rebuild).

5. **Run live smoke test** once container is fresh:
   - All 5 dealer .js URLs HTTP 200 with foreign Origin header
   - `/dealer-widgets/nexxus-widget.js` HTTP 200, body contains `nexxus-widget-container`
   - `/p/serra-honda?mode=chat` HTTP 200 (iframe content for widget options)
   - `/api/health` returns `status: ok`
   - `/login`, `/teambox`, `/insights`, `/service`, `/sales`, `/marketing`, `/home` all non-5xx
   - Auth API responds (POST `/api/auth/login` with `{}` should be 400 not 5xx)

6. **Update morning-readout.md and release-decision-report.md** with deploy outcome.

7. **Tell operator** they can send the Dealer.com email (response previously drafted at evidence/stabilization-sprint-2026-04-29/morning-validation/release-decision-report.md and in chat).

---

## Drafted Dealer.com email (waiting on operator to send)

The full draft is in the conversation history; key facts:
- URL: `https://live.huminic.app/dealer-widgets/nexxus-widget.js`
- Embed pattern requires `window.nexxusWidgetConfig` set BEFORE script tag (per-dealer slug, orgName, primaryColor, personaName)
- Five dealer slugs: serra-honda, ford-of-columbia, hyundai-of-columbia, tony-serra-ford, serra-nissan
- Three-stage rollout: Stage 1 single VDP → Stage 2 all Serra Honda VDPs (24h) → Stage 3 remaining 4 dealers
- All 5 dealer widgets are CORS-corrected per commit `2457a0c` (extends `/dealer-widgets`, `/dealer-handoff`, `/w`, `/p` to widgetCors and skip-list)
- Operator confirmed: no color codes in email, no tables, will wait to send until live verified
- Operator concerns from Dealer.com: bundle size 17.7kB → 10kB target (followup), gzip/brotli (enable on edge), 3 options not working (will be fixed by deploy + per-page config)

---

## Evidence files written this session

- `evidence/stabilization-sprint-2026-04-29/morning-readout.md` — primary deliverable
- `evidence/stabilization-sprint-2026-04-29/morning-validation/release-decision-report.md` — GO/CAVEAT/NO-GO per slice
- `evidence/stabilization-sprint-2026-04-29/morning-validation/run-service-campaign.py` — Service campaign E2E proof
- `evidence/stabilization-sprint-2026-04-29/morning-validation/synthetic-inbound.py` — AI auto-reply marker fix proof
- `evidence/stabilization-sprint-2026-04-29/morning-validation/0-trigger1-default-off.txt` — Trigger 1 default-OFF posture
- `evidence/stabilization-sprint-2026-04-29/morning-validation/1-campaign-execute.txt` — Service Campaign E2E
- `evidence/stabilization-sprint-2026-04-29/morning-validation/2-campaign-substitution-evidence.txt` — `{firstName}` substitution proof
- `evidence/stabilization-sprint-2026-04-29/morning-validation/4-trigger2-sanity.txt` — Trigger 2 overnight evidence
- `evidence/stabilization-sprint-2026-04-29/morning-validation/5-widget-delta.txt` — Dev/Live widget delta
- `evidence/stabilization-sprint-2026-04-29/morning-validation/7-trigger1-immediate-fire.txt` — Trigger 1 immediate fire DB evidence
- `evidence/stabilization-sprint-2026-04-29/morning-validation/8-final-cleanup.txt` — final clean state
- `evidence/stabilization-sprint-2026-04-29/morning-validation/10-pre-deploy-config.txt` — checkInDelayMinutes 1440 reset
- `evidence/stabilization-sprint-2026-04-29/deploy-live.sh` — the deploy automation script
- `evidence/stabilization-sprint-2026-04-29/live-deploy/deploy.log` — script execution log (CI green, Coolify deploy not applied)
- `evidence/stabilization-sprint-2026-04-29/live-deploy/pr-body.md` — the PR description that landed at #1

---

## Critical state — do NOT break these

- `serra-honda.settings`:
  - `triggersEnabled=true`
  - `checkInTriggerEnabled=true`
  - `immediateTriggerEnabled=UNSET` (default-OFF restored at 13:40 UTC)
  - `afterHoursTriggerEnabled=false`
  - `businessHoursStart`/`End` UNSET (defaults 8-21 in America/Chicago)
  - `checkInDelayMinutes=1440` (production value, reverted from test 15)
  - `triggerTestPhones=['+14126546500']` (safety lever — keep through soft-launch)
- All other 6 orgs: every trigger flag UNSET (default-OFF)
- Caroline (Serra Honda) `agents.instructions`: 862-char SMS guidance string (operator-approved)
- Nancy Gaston (Serra Honda) `agents.instructions`: 862-char SMS guidance string

---

## Local repo state at compact time

- Branch: `wave-pe3` (committed up through `66d80ff`)
- Local `main` exists with my local merge `fe70823` — but `origin/main` has the canonical merge `87ce20d` from PR #1 — local main is essentially obsolete; can be reset to origin/main if any future merge work is needed
- Stashes saved (multiple — see `git stash list`); `pre-deploy-stash-2026-04-29` and `stash-logs-pre-merge` for working-tree state pre-push
- Working tree dirty in evidence/REM-9/screenshots/ and others (irrelevant; not in any merge path)

---

## After compact, continue from here:

1. Read this file first: `evidence/stabilization-sprint-2026-04-29/SESSION-STATE-PRE-COMPACT.md`
2. Read `evidence/stabilization-sprint-2026-04-29/live-deploy/deploy.log` to confirm CI state
3. Discover Coolify app via central-mcp + trigger redeploy (immediate fix for tonight)
4. Watch for container restart (uptime drop)
5. Run live smoke test
6. Tell operator if email is OK to send
7. **After live is up, file the deploy-pipeline hardening backlog item below and start it**

Operator's likely first message after compact: "ok keep going" or "did the deploy land" — proceed with the Coolify discovery + trigger.

---

## LONGER-LASTING DEPLOY-PIPELINE FIX (operator-requested 2026-04-29 PM)

The current deploy mechanism has multiple silent-failure modes that should be fixed permanently so future merges to `main` reliably land on live without manual intervention.

### Known issues with the current pipeline

| # | Issue | Where | Impact |
|---|---|---|---|
| 1 | `Verify deployment` step uses `curl "/"` (no host, returns 000) | `.github/workflows/deploy.yml` | CI shows red even when deploy succeeded; or shows red when deploy silently failed — indistinguishable |
| 2 | Coolify webhook can fire & return success without actually rebuilding the container | `deploy.yml` `Trigger Coolify deployment` step + Coolify config | Silent deploy failures (today's symptom: webhook returned OK but container uptime unchanged) |
| 3 | No `live.huminic.app` health-poll loop after deploy trigger | `deploy.yml` | No detection that container actually restarted with new image |
| 4 | Webhook URL / secret may be stale (rotated since 2026-04-14 last successful deploy) | GitHub Actions secrets `COOLIFY_WEBHOOK_URL` / `COOLIFY_API_TOKEN` | Webhook silently fails OR succeeds without rebuilding |
| 5 | No deploy-status notification (Slack/email) when CI fails | n/a | Failures are invisible until someone opens the Actions tab |
| 6 | Deploy mechanism is undocumented | n/a | Operator + agents have to reverse-engineer it from `deploy.yml` |

Tracked in `issues.md`:
- I-216 "GitHub Actions deploy.yml fires a dead webhook" — partially resolved
- I-217 "Dockerfile never built" — partially resolved
- I-220 "Caddy routes both domains to same port" — partially resolved
- I-224 "No monitoring, alerting, or rollback for production" — open

### Proposed permanent fix

**Phase 1 — Fix `deploy.yml` (immediate, ~30 min, scoped to the workflow file only):**

```yaml
# Replace the broken Verify deployment step with a real polling loop
- name: Verify deployment
  run: |
    HEALTH_URL="https://live.huminic.app/api/health"
    WIDGET_URL="https://live.huminic.app/dealer-widgets/nexxus-widget.js"
    PRE_UPTIME=$(curl -sS --max-time 10 "$HEALTH_URL" | jq -r .uptime 2>/dev/null || echo 0)
    echo "Pre-deploy uptime: ${PRE_UPTIME}s"
    
    # Poll for container restart (uptime should reset to <60s after rebuild)
    DEPLOYED=false
    for i in $(seq 1 30); do
      sleep 20
      CURRENT_UPTIME=$(curl -sS --max-time 10 "$HEALTH_URL" | jq -r .uptime 2>/dev/null || echo 0)
      WIDGET_STATUS=$(curl -s --max-time 10 -o /dev/null -w '%{http_code}' \
        -H "Origin: https://www.serrahonda.net" "$WIDGET_URL")
      echo "[poll $i/30] uptime=${CURRENT_UPTIME}s widget=$WIDGET_STATUS"
      if [ "$CURRENT_UPTIME" -lt 300 ] && [ "$WIDGET_STATUS" = "200" ]; then
        DEPLOYED=true
        echo "Deploy confirmed (container restarted, widget serving)"
        break
      fi
    done
    
    if [ "$DEPLOYED" = "false" ]; then
      echo "ERROR: Deploy did NOT confirm within 10 min"
      echo "  - uptime was ${CURRENT_UPTIME}s (should be <300)"
      echo "  - widget URL was HTTP $WIDGET_STATUS (should be 200)"
      exit 1
    fi
```

**Phase 2 — Replace webhook with explicit Coolify API call (~2 hours, may require central-mcp coordination):**

Instead of relying on a webhook URL that may rot:
```yaml
- name: Deploy to Coolify
  env:
    COOLIFY_API_TOKEN: ${{ secrets.COOLIFY_API_TOKEN }}
    COOLIFY_APP_UUID: ${{ secrets.COOLIFY_APP_UUID }}
  run: |
    RESPONSE=$(curl -sS -X POST \
      "https://coolify.huminic.app/api/v1/applications/${COOLIFY_APP_UUID}/deploy" \
      -H "Authorization: Bearer ${COOLIFY_API_TOKEN}" \
      -H "Content-Type: application/json")
    echo "$RESPONSE"
    DEPLOY_ID=$(echo "$RESPONSE" | jq -r '.deployment_uuid')
    echo "Deploy ID: $DEPLOY_ID"
    if [ -z "$DEPLOY_ID" ] || [ "$DEPLOY_ID" = "null" ]; then
      echo "ERROR: Coolify deploy did not return a deployment_uuid"
      exit 1
    fi
    
    # Poll Coolify for deploy completion
    for i in $(seq 1 30); do
      sleep 10
      STATUS=$(curl -sS \
        "https://coolify.huminic.app/api/v1/deployments/${DEPLOY_ID}" \
        -H "Authorization: Bearer ${COOLIFY_API_TOKEN}" \
        | jq -r '.status')
      echo "[poll $i/30] deploy status: $STATUS"
      [ "$STATUS" = "finished" ] || [ "$STATUS" = "succeeded" ] && break
      [ "$STATUS" = "failed" ] && exit 1
    done
```

This fails LOUD if anything goes wrong instead of silently.

**Phase 3 — Add Slack/email notification on failure (~30 min, scoped to workflow file):**

```yaml
- name: Notify on failure
  if: failure()
  run: |
    curl -X POST -H 'Content-type: application/json' \
      --data "{\"text\":\"❌ Nexxus deploy failed on ${{ github.sha }}\nRun: ${{ github.run_id }}\"}" \
      "${{ secrets.SLACK_WEBHOOK_URL }}"
```

**Phase 4 — Write `docs/DEPLOY.md` (~15 min):**

Single page covering: how to trigger a deploy, what Coolify does, what to do if a deploy fails, where the secrets live, how to roll back.

### Backlog items to file (after live is up)

```markdown
## Deploy pipeline hardening

| ID | Issue | Dim | Status | Effort |
|---|---|---|---|---|
| I-NEW-2026-04-29-D | **deploy.yml `Verify deployment` step uses `curl "/"` (no host).** Returns `000` always; CI fails even on successful deploys. Replace with health-poll + uptime-drop detection + widget URL check. | IN | OPEN — Phase 1 hardening | E |
| I-NEW-2026-04-29-E | **Coolify webhook can silently no-op.** Today's deploy: webhook returned success but container uptime didn't reset (still 14.8 days). Move from webhook to explicit Coolify API call with `applicationUuid` + `deployment_uuid` polling. Requires GitHub Actions secret `COOLIFY_APP_UUID`. | IN | OPEN — Phase 2 hardening | M |
| I-NEW-2026-04-29-F | **No deploy-failure notification.** Currently failures are invisible until someone checks Actions. Add Slack/email webhook on `failure()`. | IN, OPS | OPEN — Phase 3 hardening | E |
| I-NEW-2026-04-29-G | **No deploy documentation.** Write `docs/DEPLOY.md` covering trigger, Coolify mechanism, failure remediation, secrets, rollback. | IN, GOV | OPEN — Phase 4 hardening | E |
```

Recommend filing these in `issues.md` as a single section after live is up. Do them in Phase 1 → 2 → 3 → 4 order on a follow-up sprint (not tonight; tonight is just "get this deploy live").

### Why this matters

Today's symptom: we did everything right (push, PR, merge, CI green, webhook fired) and live still didn't update. Without these fixes, every future merge to main is a coin-flip on whether the container actually rebuilds. With Dealer.com integration imminent and customer-visible production traffic increasing, that's not acceptable.

The Phase 1 fix alone (real `Verify deployment`) would have caught today's silent failure within ~10 minutes instead of requiring manual investigation.
