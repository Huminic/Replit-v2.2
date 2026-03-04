# .agent_docs/rules/code-conventions.md — Nexxus v2.2
# PURPOSE: TypeScript, JSDoc, naming, import, and error-handling conventions.
# Load this file when: writing any new code, reviewing code, or running lint.
# Last updated: 2026-03-04

---

## 1. TYPESCRIPT RULES

- Strict mode always: `"strict": true` in tsconfig
- No `any` types — use `unknown` with type narrowing if needed
- No non-null assertions (`!`) — use explicit null checks
- Explicit return types on all exported functions
- Interfaces for object shapes (not `type` aliases for objects)
- `type` aliases for unions, intersections, and primitives only
- No `var` — use `const` by default, `let` only when mutation required
- No implicit `undefined` returns — every code path returns explicitly

---

## 2. JSDOC / TSDOC BLOCKS — REQUIRED ON ALL FUNCTIONS

Every exported function and every React component must have a JSDoc block.

```typescript
/**
 * Brief one-line description of what this function does.
 *
 * @param orgId - The organization identifier
 * @param period - Date range for usage query (ISO 8601 start/end)
 * @returns UsageRecord array for the org in the period
 * @throws {KillSwitchError} If kill switch check is called and outbound_enabled is false
 * @sideEffects Logs usage query to forensic log
 * @mvp-item AC-10-A
 */
export async function getOrgUsage(orgId: string, period: DateRange): Promise<UsageRecord[]> {
```

Required tags:
- `@param` for every parameter
- `@returns` for every return value (even `void`)
- `@throws` if the function can throw
- `@sideEffects` if the function writes to DB, logs, or fires outbound
- `@mvp-item` referencing the AC item this function implements

---

## 3. NAMING CONVENTIONS

| Thing | Convention | Example |
|-------|-----------|---------|
| Files | kebab-case | `kill-switch-service.ts` |
| React components | PascalCase | `EscalationCard.tsx` |
| Functions | camelCase | `getOrgUsage` |
| Constants | UPPER_SNAKE_CASE | `MAX_MESSAGES_PER_DAY` |
| DB table names | snake_case | `organization_settings` |
| DB column names | snake_case | `outbound_enabled` |
| MCP tool names | snake_case verbs | `sms_send`, `vin_create_lead` |
| Environment variables | UPPER_SNAKE_CASE with prefix | `SUPABASE_URL`, `VAPI_ORG_ID` |

---

## 4. FILE ORGANIZATION

```
client/src/
  components/         # Reusable UI components
  pages/              # Page-level components (one per route)
  hooks/              # Custom React hooks
  contexts/           # React context providers
  lib/                # Client-side utilities
  types/              # Shared TypeScript types

server/
  routes/             # Express route handlers
  services/           # Business logic (one service per domain)
  middleware/         # Express middleware
  lib/                # Server-side utilities

db/
  schema.ts           # Drizzle schema definitions
  migrations/         # SQL migration files

central-mcp/
  tools/              # MCP tool definitions (one file per service)
  lib/                # MCP utilities, auth helpers
```

---

## 5. KILL SWITCH ENFORCEMENT PATTERN

Every outbound function must use this exact pattern. No exceptions.

```typescript
import { checkKillSwitch } from '../services/kill-switch-service';
import type { OutboundChannel } from '../types/kill-switch';

async function sendSms(orgId: string, recipient: string, message: string): Promise<void> {
  const allowed = await checkKillSwitch(orgId, 'sms');
  if (!allowed) {
    await createUnsentMessageEscalation(orgId, { recipient, message, channel: 'sms', reason: 'kill_switch_off' });
    return;
  }
  // proceed with TextMagic send
}
```

`checkKillSwitch` must query the DB — never cache kill switch state in memory.
Always pass the specific channel: `'sms'` | `'phone'` | `'email'`.
Master switch check is inside `checkKillSwitch` — do not duplicate it.

---

## 6. ERROR HANDLING

- All async functions wrapped in try/catch at the route level
- Business logic functions throw typed errors — never raw strings
- Typed error classes: `KillSwitchError`, `VinApiError`, `EscalationError`, `UndefinedBehaviorError`
- Log every error with: timestamp, function name, org_id (if in scope), error message, stack
- Never swallow errors silently — every catch must either rethrow or log AND create an escalation

---

## 7. IMPORTS

- Absolute imports from project root: `import { foo } from '@/services/foo'`
- No relative imports deeper than `../` (two levels max)
- No barrel imports (`import * as`) — named imports only
- External packages: group together at top; internal imports below a blank line

---

## 8. ENVIRONMENT VARIABLES

- All env vars declared in `shared/env.ts` with Zod validation
- Never access `process.env.X` directly — always use the validated env object
- Production and staging variables share the same names but different values
- `.env.staging` is the only active env during development
- `.env.production` is on the DO_NOT_TOUCH list — never read by agents

---

## 9. COMMENTS POLICY

- JSDoc blocks explain WHAT and WHY
- Inline comments only for genuinely non-obvious logic
- No comments that just repeat the code in English
- TODO comments must include: `// TODO [wave-sprint]: description` — never bare `// TODO`
- Deleted code: remove it — never comment it out and leave it in the file
