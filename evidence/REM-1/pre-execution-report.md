# Pre-Execution Report: REM-1
Timestamp: 2026-03-18T18:00:00Z
Sprint: REM-1
Status: READY

## Objective
Fix 24 open issues across 5 domain sub-sprints + 7 test infrastructure fixes.
Order: IN → DT → AU → BE → FE

## Declared Files
- .env
- package.json
- script/build.ts
- shared/schema.ts
- server/routes/auth.ts
- server/seed.ts
- server/routes.ts (deletion)
- server/services/hunchService.ts (new — extracted from routes.ts)
- server/index.ts
- server/routes/hunches.ts
- server/services/scheduler.ts
- server/outbound.ts
- server/routes/sms.ts
- server/routes/organizations.ts
- server/routes/tasks.ts
- server/routes/appointments.ts
- server/routes/conversations.ts
- server/routes/insights.ts
- server/routes/billing.ts
- server/routes/webhooks.ts
- server/storage.ts
- server/vendorProxy.ts
- client/src/contexts/AuthContext.tsx
- client/src/pages/login.tsx
- client/src/components/layout/Sidebar.tsx
- client/src/components/layout/AppLayout.tsx
- client/src/components/ProductTour.tsx
- client/src/pages/BillingDashboard.tsx
- client/src/pages/management.tsx
- tests/e2e/domain-01-auth.spec.ts
- tests/e2e/domain-02-dashboard.spec.ts
- tests/e2e/domain-03-chat.spec.ts
- tests/e2e/domain-06-departments.spec.ts
- tests/e2e/domain-07-insights.spec.ts
- tests/e2e/domain-09-settings.spec.ts
- tests/e2e/domain-11-integrations.spec.ts
- tests/e2e/domain-12-infrastructure.spec.ts
- tests/e2e/helpers/auth.ts
- sprints.json
- issues.md
- acceptance_criteria.md
- CLAUDE.md
- harness.md
- plan.md
- package-lock.json

## Key Findings from Env Var Research
- VAPI webhook: central-mcp notes "Vapi doesn't send X-Vapi-Signature headers" — secret check needs to be optional
- FLEXPRICE_API_KEY available in central-mcp config
- TAVUS_API_KEY discrepancy between replit and other projects
- TEXTMAGIC_WEBHOOK_SECRET missing everywhere — user must configure in TextMagic dashboard
- Partner IDs already seeded correctly in database

## Success Criteria
- All 24 issues resolved
- All 7 TI fixes applied
- TypeScript compiles
- Production build succeeds
- Health check passes
- Improvement in Playwright test pass rate (baseline: 46/113)
