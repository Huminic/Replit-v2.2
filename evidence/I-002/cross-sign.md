# Cross-Sign Review -- I-002

Sprint: I-002 -- Staging DB Isolation
Implementing Role: orchestrator
Reviewing Role: test
Date: 2026-04-03

## Changes Reviewed

### server/seed.ts (lines 316-321)
- Added SEED_DEMO_DATA=true environment variable check before the NODE_ENV=production guard
- When SEED_DEMO_DATA=true, the function falls through to the demo seed path regardless of NODE_ENV
- This correctly bypasses the esbuild-inlined NODE_ENV (scripts/build.ts:44 hardcodes process.env.NODE_ENV to "production" at bundle time, so runtime NODE_ENV has no effect)
- The existing SKIP_DEMO_SEED guard (line 310) still takes priority, preserving production safety
- Logic order: SKIP_DEMO_SEED > SEED_DEMO_DATA > NODE_ENV -- correct precedence

### .github/workflows/deploy.yml
- Removed continue-on-error: true from the "Run tests" step (line 50 area) -- test failures now block deployment
- Replaced bare curl with HTTP status capture via -w '%{http_code}' and -o /tmp/coolify-response.txt
- Added explicit non-2xx check: if status < 200 or >= 300, logs response body and exits 1
- Removed the || echo "Coolify webhook sent (may be async)" silent guard
- Verify deployment step: changed WARNING to ERROR and added exit 1 on non-200 status

### ecosystem.config.cjs
- No changes in diff -- NODE_ENV remains "production" as expected
- Pre-exec report confirms the NODE_ENV change was considered and correctly reverted since esbuild inlines it

## Verdict: APPROVED

All three changes are narrowly scoped to the declared files. The seed.ts change correctly introduces a runtime-checkable env var (SEED_DEMO_DATA) that is not subject to esbuild inlining, solving the staging seed problem without affecting production. The deploy.yml changes eliminate all three silent failure patterns (continue-on-error, echo guard, warning-only verify) and replace them with hard failures. No UI files touched. No unrelated code modified.
