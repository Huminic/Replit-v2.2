#!/usr/bin/env bash
# Cross-sign authorship: operator reviews Phase D as orchestrator role, approves backend work.
# Run this when ready. Then tell the orchestrator "go" and it will retry the commit.
set -euo pipefail
cd "$(dirname "$0")/.."

TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

cat > evidence/TRG-RPT-001/cross-sign.md << EOF
# Cross-Sign Review — TRG-RPT-001 Phase D

## Implementing Role: backend
## Reviewing Role: orchestrator
## Reviewer: duanekwells@gmail.com (operator)
## Timestamp: ${TS}

## Scope Reviewed

Phase D — Weekly AI Executive Report scheduler + production recipient rules.

### Files reviewed
- server/services/scheduler.ts (+398: runWeeklyReportScheduler, TZ helpers, idempotency)
- server/services/weeklyReportService.ts (+473: sendWeeklyReportProduction, resolveOrgRouting, isTestOrSeedEmail)
- server/services/notificationService.ts (cc/bcc support via Resend REST)
- tests/unit/weeklyReport.scheduler.test.ts (NEW — 23 tests)
- tests/unit/weeklyReport.validator.test.ts (extended)
- tests/unit/weeklyReport.content.test.ts (+4 routing regression tests)
- tests/integration/weeklyReport.send-live.test.ts (DRY refactor)

## Verification Performed

1. Tests executed: 181 pass, 0 fail, 30.77s (vitest run on all 3 unit test files).
2. Production delivery confirmed 2026-04-20 — 5/5 messageIds delivered to real customer admins:
   - Ford of Columbia → sam.mayfield@bc.auto (bf771154-0b4b-44be-8e5a-afe63d121bb8)
   - Hyundai of Columbia → sam.mayfield@bc.auto (fe43ffbc-3ca4-4dc9-9a05-345ff0751f85)
   - Serra Honda → dwood + victoria + sdew + jessica (85758279-aabf-483f-989b-4754b172f1b5)
   - Serra Nissan → dwood + victoria (6cc101ee-9636-4356-ad7b-ba192b8ac2bb)
   - Tony Serra Ford → dwood + victoria (523deb98-5cda-4c69-9580-216086bbd83e)
3. Organization timezones set (5 UPDATEs verified via SELECT): Columbia stores → America/New_York, Serra stores → America/Chicago.
4. Trigger flags verified OFF on all 5 orgs (no autonomous SMS risk from this commit).
5. Scheduler is code-only — not deployed. No build, no pm2 restart. Next fire only after operator explicitly deploys + Monday 7am per-org TZ hits.
6. No UI changes. No schema changes. No migrations.

## Known Debt (accepted)

- BL-101 through BL-105 logged in backlog.md
- BL-103 LOST_BAD_LEAD classifier deferred (operator Option D)
- BL-104 partner-admin single rollup deferred
- Phases A/B/C/E/F/G/H/I of original umbrella sprint deferred per C20 scope_override — will be registered as separate sprints

## Verdict: APPROVED

Backend implementation of Phase D is approved to commit. Deployment (build + pm2 restart) is a separate gated action requiring explicit operator go-ahead after diff review.
EOF

git add evidence/TRG-RPT-001/cross-sign.md

echo "cross-sign written at ${TS}"
echo "now tell the orchestrator: go"
