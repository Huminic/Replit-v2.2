# .agent_docs/rules/testing-protocol.md — Nexxus v2.2
# PURPOSE: Test structure, spec.ts conventions, quality gates, and AC traceability rules.
# Load this file when: writing tests, reviewing test coverage, or running quality gates.
# Last updated: 2026-03-04

---

## 1. CORE PRINCIPLE — INVERSE OF ACCEPTANCE CRITERIA

Acceptance criteria define observable behavior.
Tests are the mechanical proof that those behaviors exist.

**Every AC item → exactly one test block**
**Every test block → exactly one AC item**
**No test without an AC. No AC without a test.**
Exception: unit tests for internal helpers don't map to AC (label them `@internal` in JSDoc).

---

## 2. SPEC.TS STRUCTURE

```typescript
// spec.ts — Nexxus v2.2 Acceptance Tests
// Each describe block maps 1:1 to an AC section.
// Test IDs match AC IDs exactly.

describe('MVP Function 1 — Accurate Metrics', () => {
  it('AC-01-A: active pipeline excludes Lost/Sold/Duplicate and respects 14-day window', async () => {
    // Given: seeds with leads in and out of the 14-day window + excluded statuses
    // When: getActivePipelineCount(orgId) is called
    // Then: count matches expected value
  });

  it('AC-01-B: AI Chat landing page displays pipeline count matching DB query', async () => {
    // ...
  });

  it('AC-01-C: same active pipeline count returned for Sales and Marketing sections', async () => {
    // ...
  });
});

describe('Kill Switch System', () => {
  it('AC-KS-A: all 4 kill switch columns exist in organization_settings with DEFAULT FALSE', async () => {
    // ...
  });

  it('AC-KS-B: master outbound_enabled=FALSE blocks all channels regardless of channel switches', async () => {
    // ...
  });
});
```

---

## 3. TEST LABELING RULES

- Describe block label: matches AC section header exactly
- It block label: starts with the AC ID (e.g., `AC-05-A:`)
- Internal/helper tests: use `@internal` prefix: `it('@internal: checkKillSwitch returns false for disabled channel', ...)`

---

## 4. GIVEN / WHEN / THEN IN TEST BODIES

Every test body must have three comment sections:

```typescript
it('AC-05-A: kill switch blocks SMS', async () => {
  // GIVEN: outbound_enabled = FALSE in org settings
  await db.update(organizationSettings).set({ outboundEnabled: false }).where(eq(orgId, testOrgId));

  // WHEN: outbound SMS trigger fires
  const result = await triggerSms(testOrgId, '+15551234567', 'Test message');

  // THEN: no SMS sent, Unsent Message escalation created, trigger not queued
  expect(result.sent).toBe(false);
  expect(result.escalation).toBeDefined();
  expect(result.escalation.type).toBe('unsent_message');
  expect(result.queued).toBe(false);
});
```

---

## 5. TEST DATA RULES

- All tests use **synthetic data only** — never real customer names, phone numbers, or VIN data
- Test phone numbers: use E.164 format from the reserved test range only (e.g., +15005550000 series for TextMagic test mode)
- Test VIN org IDs: use the staging/sandbox dealer credentials, never production
- Seed data: curated synthetic seed scripts in `db/seeds/` — never copy/sanitize production data
- After each test: clean up all created records (use transactions or explicit cleanup hooks)

---

## 6. QUALITY GATE SEQUENCE

Run gates in order. Do not skip. Enforcer checks all gates.

| Gate | Command | Requirement |
|------|---------|------------|
| G0 | `npm run lint` | Zero ESLint warnings, zero errors, Prettier formatted |
| G1 | `npm run check` | TypeScript compiles with zero errors |
| G2 | `npm run build` | Production build succeeds, dist/ generated |
| G3 | `npm run test:env` | All required env vars present and valid |
| G4 | `npm run test:smoke` | Kill switch tests (4 channels) + critical path tests all pass |
| G5 | Enforcer compliance | All EF-01 through EF-11 checks pass |

**G4 smoke tests are a hard gate before merge.** If any kill switch test fails, the merge is blocked.

---

## 7. KILL SWITCH SMOKE TEST — REQUIRED IN EVERY SPRINT

These four tests run on every sprint regardless of what was changed.
If the kill switch mechanism is modified, additional channel-specific regression tests are required.

```typescript
describe('Kill Switch Smoke Tests — run every sprint', () => {
  it('SMS blocked when outbound_enabled = FALSE', ...)
  it('Phone call blocked when outbound_enabled = FALSE', ...)
  it('Email blocked when outbound_enabled = FALSE', ...)
  it('Channel switch blocked when channel_enabled = FALSE and outbound_enabled = TRUE', ...)
});
```

---

## 8. REGRESSION RULE

If a previously passing test fails:
1. Do NOT fix it without explicit owner instruction
2. Log the regression to `.agent_docs/undefined-items.md`
3. Create a HALT — do not proceed with the sprint
4. Notify owner with: which test failed, what changed, the exact error

Rationale: a regression means something previously known-working is now broken.
It may indicate a scope violation or an unintended side effect.

---

## 9. COVERAGE TARGETS

| Layer | Minimum coverage |
|-------|-----------------|
| Kill switch enforcement | 100% — every channel, every path |
| VIN 2-step lead creation | 100% — success + each failure mode |
| Outbound rate limiting | 100% — at, below, and above limit |
| RBAC permission checks | All 8 roles × 7 sections |
| Other business logic | 80% statement coverage |

---

## 10. SPEC.TS AS LIVING DOCUMENT

- `spec.ts` is updated in the same sprint as the feature it tests
- When an AC item is locked or changed, the corresponding test block is updated immediately
- Orphaned tests (no AC) are flagged and removed unless they are `@internal`
- The Enforcer validates that AC count matches test count for every merge
