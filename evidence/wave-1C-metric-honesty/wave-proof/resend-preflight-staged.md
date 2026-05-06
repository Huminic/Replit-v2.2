# Wave 1C — Resend dry-run preflight (STAGED)

**Date:** 2026-05-06
**Status:** Pre-staged — ready to execute after operator approves build (see `build-gate-blocked.md`)
**Pattern:** matches Wave 1B Delta 2 (`evidence/stabilization-sprint-2026-05-01/batch-1/1B/`)

---

## Why this Resend dry-run

Wave 1C changed the **server-side weekly-report content** indirectly via the metric-honesty corrections:

- `server/routes/insights.ts` now publishes lifetime win rate (not 30-day) and excludes service rows upstream — affects insights surfaced in the weekly report payload via `weeklyReportService.ts` consumers.
- `server/storage.ts:getActivityLogs` filter ('sync', 'system') affects activity-feed counts that could appear in scoring.
- `server/vendorProxy.ts` conversionRate null-on-empty affects the warehouse-summary path.

Sending a real weekly-report email (hard-routed to internal_operator) verifies:
1. The build deploys cleanly and the report renders.
2. No regression in HTML construction or validation.
3. Numbers visibly reflect Wave 1C honesty (not 100% win rate, no fake `flat` trend, no service-row noise).

---

## Destination classification (per CLAUDE.md TEST-SAFETY)

| Recipient | Channel | Classification | Allowlist? | Real customer? |
|---|---|---|---|---|
| `duane.wells@huminic.ai` | Email (Resend via central-mcp) | internal_operator | YES (super_admin, project owner) | NO |

No CC. No BCC. Single recipient via TESTLANE override.

**No real-customer recipients.** The TESTLANE override hard-reroutes any DB-resolved recipient to the operator address.

---

## Required env vars (preflight check before invocation)

| Var | Required value |
|---|---|
| `JWT_SECRET` | present |
| `DATABASE_URL` | present (Supabase) |
| `RESEND_API_KEY` | present |
| `TESTLANE_MODE` | `true` |
| `TESTLANE_EMAIL_TO` | `duane.wells@huminic.ai` |

If any preflight check fails → STOP and document. Do not proceed.

---

## Exact invocation

Pattern from Wave 1B Delta 2 (proven, captured in `send-runtime-log.txt`):

```bash
TESTLANE_MODE=true \
TESTLANE_EMAIL_TO=duane.wells@huminic.ai \
npx tsx --env-file=.env -e "
import { sendWeeklyReportProduction } from './server/services/weeklyReportService';

const SERRA_HONDA_ORG_ID = '24d64f99-ba04-4b43-af35-fd06f555ac86';
const TESTLANE_SID = 'wave-1c-runtime-proof';

(async () => {
  const result = await sendWeeklyReportProduction(SERRA_HONDA_ORG_ID, {
    testLaneSessionId: TESTLANE_SID,
  });
  console.log(JSON.stringify(result, null, 2));
})();
"
```

`SERRA_HONDA_ORG_ID` is hardcoded from `evidence/stabilization-sprint-2026-05-01/batch-1/1B/serra-honda-uuid.txt`.

The `testLaneSessionId: 'wave-1c-runtime-proof'` marker is required by `outbound.ts` testlane gate (TESTLANE_MODE=true without a marker is fail-closed-blocked). It also tags the subject `[testlane:wave-1c-runtime-proof]`.

**NOTE:** Verify `sendWeeklyReportProduction`'s second-arg signature accepts `{ testLaneSessionId }`. If it doesn't, fall back to the option used in 1B: invoke `sendWeeklyReportEmail` directly with explicit options. (Original 1B used a custom `-e` script that called `sendWeeklyReportEmail`; pattern is in `send-runtime-log.txt`.)

---

## Evidence to capture

Mirroring Wave 1B's evidence shape, write to `evidence/wave-1C-metric-honesty/wave-proof/`:

| File | Content |
|---|---|
| `env-readiness.txt` | The 5 preflight checks above with PASS/FAIL |
| `send-runtime-log.txt` | stdout of the invocation (testlane override line + sending line + sent line) |
| `resend-response.json` | The `{ sent, messageId }` payload from `sendWeeklyReportEmail` |
| `post-1c-body.html` | The rendered HTML (printed to stdout via debug helper if available; otherwise check Resend dashboard) |
| `wave-1c-numbers-snapshot.md` | Operator-eye check: confirm rendered numbers reflect Wave 1C honesty (lifetime win rate ≠ 100%, no `flat`, activity feed excludes sync/system) |

---

## Halt conditions

STOP and report (no retry, no autonomous fix) if:

- Any preflight env-readiness check FAILS
- `sent: false` in response
- Resend response includes a non-200 status or error
- `messageId` is missing or malformed
- Rendered HTML shows obvious metric corruption (e.g., 100% win rate, NaN, or `flat` strings still present)
- testlane override does NOT activate (recipient is not duane.wells@huminic.ai per runtime log)
- Subject line lacks `[testlane:wave-1c-runtime-proof]` prefix

---

## Authority

Per CLAUDE.md "Autonomy ALLOWED after preflight" — provider sends to internal_operator allowlist do NOT require per-action operator approval after preflight is presented. This invocation matches that exemption. The build step (`npm run build`) does require explicit GO before this invocation can be meaningful (since the build artifact is what runs the wave-1C code path).

Sequence dependency: `npm run build` (operator GO) → `pm2 restart nexxus-app` (autonomy) → this Resend invocation (autonomy after preflight).
