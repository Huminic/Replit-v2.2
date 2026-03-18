# R-2 Frontend Scan Results

28 findings (2 MAJOR, 26 MINOR) across 114 client files.
UI is protected — all findings are documentation only.

## MAJOR

| # | Domain | File | Issue |
|---|--------|------|-------|
| 1 | FE | insights.tsx:775+ | 10+ list renders using key={i} (array index). Can cause state bugs on reorder. |
| 2 | FE | AgentConfigPane.tsx:594+ | 12x `as any` type assertions on agent triggers/tools/settings. Breaks type safety. |

## MINOR (26 items)
- Type safety: `any` types in main.tsx, insights.tsx, settings.tsx, BillingPlan.tsx, BillingInvoices.tsx, sales.tsx (10 findings)
- Console output: 13 files with console.error() without user-facing toast/feedback
- State management: settings.tsx has 39 useState hooks, insights.tsx has 19 (2 findings)
- Performance: missing React.memo() and useCallback memoization (2 findings)
- Duplicate patterns: phone formatting logic repeated 3x (1 finding)

## Positive Observations
- No dead components found
- No missing alt text
- Radix UI primitives provide good a11y baseline
- Recharts is tree-shakeable
- No large inline data structures
