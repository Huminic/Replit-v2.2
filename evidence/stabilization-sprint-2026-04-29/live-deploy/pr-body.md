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
