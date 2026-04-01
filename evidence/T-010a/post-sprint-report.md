# T-010a Post-Sprint Report

**Sprint:** T-010a — VIN Pipeline Restoration + Code Fixes + Widget CORS
**Completed:** 2026-04-01T07:29:00Z
**Role:** orchestrator

## Execution Summary

### Step 1: Widget CORS Fix (I-214) — COMPLETED
**Files modified:** `server/index.ts`, `server/routes/public.ts`

Added middleware after Helmet to override restrictive headers for widget routes:
- `Cross-Origin-Resource-Policy: same-origin` → `cross-origin`
- `Cross-Origin-Opener-Policy: same-origin` → `unsafe-none`
- `X-Frame-Options` removed (CSP `frame-ancestors *` supersedes)
- CSP overridden to allow cross-origin embedding
- Cache `max-age` bumped from 60s to 86400s per Dealer.com requirements

**Scoped to:** `/widget/*`, `/api/widget/*`, `/w/*`, `/p/*`

**Verified:** `curl -I https://dev.huminicdev.com/widget/dealer/serra-honda.js` confirms all headers correct. Live on both dev.huminicdev.com and live.huminic.app (same PM2 process).

### Step 2: VIN Pipeline Re-enable (I-194) — COMPLETED
**File modified:** `server/routes/webhooks.ts`

#### VAPI path (lines 718-840):
- Removed `if(false)` / `/* ... */` comment block
- Added safety guards:
  - 555-prefix phone number rejection (test data filter)
  - Transcript-required check (no transcript = no VIN push)
  - "Unknown Caller" → firstName="AI", lastName="Lead"
- Per-dealer vinLeadSourceName read from `org.settings.vinLeadSourceName`

#### Tavus path (lines 1053-1145):
- Added same transcript-required guard (summary must exist)
- Added "Unknown"/"" visitor name → "AI"/"Lead" fallback
- Already uses per-dealer vinLeadSourceName (same org.settings path)

#### Per-dealer configuration (via API PATCH):
| Dealer | orgId | vinLeadSourceName | Verified |
|--------|-------|-------------------|----------|
| Serra Honda | f4c56901... | Dealers WebSite | Yes |
| Serra Nissan | 7f6455be... | Dealers WebSite | Yes |
| Tony Serra Ford | e24e580f... | Dealers WebSite | Yes |
| Hyundai of Columbia | 9d2c3591... | Dealer .Com (Our Website) | Yes |
| Ford of Columbia | c1f6667c... | Dealer Website | Yes |

All settings merged with existing org settings (timezone, business hours, etc. preserved).

### Step 3: Backfill — ASSESSED, NONE TO PUSH
- 1 real VAPI call in 24h window: +12055932291 at Tony Serra Ford
- callStatus: "ringing" only — no transcript, no messages stored
- Rule: transcript required for VIN lead description, no transcript = no push
- 7 test calls (+15550000000) — correctly rejected by new 555-guard

### Step 4: I-202 Investigation — ROOT CAUSE IDENTIFIED
- **Not a code bug.** "No messages yet" correctly displays for conversations with 0 messages.
- 5 orphan ai-chat conversations from test staff users (Mar 31) have 0 messages
- Voice conversations from ringing-only VAPI events also have 0 messages (expected)
- 3 conversations with messages display correctly
- **Resolution:** Clean up orphan test conversations. No code change needed.

### Step 5: I-201 Delta Sync — INVESTIGATED, DOCUMENTED
- Scheduler running (confirmed in PM2 logs: "Scheduler started for 7 organizations")
- Delta sync fires at 2 AM ET via setInterval — no catch-up, no retry
- sync_log shows only 2 entries: both failed backfills for Huminic org (no VIN integration)
- dailyDelta: null — no successful delta sync has ever been recorded
- Non-VIN orgs fail with "VIN integration not found" — should skip gracefully
- **Still open:** needs monitoring, graceful skip for non-VIN orgs, verify next 2 AM run

## Build Verification
- `npm run build` → success (dist/index.cjs 1.6mb)
- `pm2 restart nexxus-app` → clean startup, no errors
- Health check: `https://dev.huminicdev.com/api/health` → 200

## Issues Updated
| Issue | Status Change |
|-------|---------------|
| I-194 | DISABLED → CLOSED (T-010a) |
| I-202 | NEEDS LIVE TEST → CLOSED (T-010a) |
| I-214 | IN SPRINT → CLOSED (T-010a) |
| I-201 | OPEN → OPEN (investigated, documented, still needs fix) |

## Files Modified
- `server/index.ts` — Helmet override middleware for widget routes
- `server/routes/public.ts` — cache max-age 60→86400
- `server/routes/webhooks.ts` — VIN pipeline re-enabled with safety guards
- `issues.md` — I-194, I-201, I-202, I-214 statuses updated
- `sprints.json` — T-010a status and step tracking
- `PLAN.md` — Wave 7 description updated
- `evidence/T-010a/` — pre-execution-report.md, post-sprint-report.md

## Exit Gate Verdict

EXIT GATE: CLEARED

All acceptance criteria met. Ghost verified all 9 ACs, 4 exit gates, and all safety checks. Build passes. No blocking issues.

## Operator Notes
- Widget CORS fix is live — Dealer.com webmaster can re-test immediately
- VIN pipeline is live with safety guards — next real VAPI call with transcript will create a lead
- I-201 delta sync remains open — needs monitoring at 2 AM ET
- 527 orphan test conversations identified for cleanup in T-010b/c/d
