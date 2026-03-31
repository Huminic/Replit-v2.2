# Healer Log: Dashboard Domain

**TEMPLATE / EXAMPLE** — This file demonstrates the healer log format. Replace entries below with actual heal operations when they occur.

---

## Format

Each entry records one heal operation: what failed, why, what was changed, and whether the fix worked.

---

## Entry 1 (EXAMPLE)

| Field | Value |
|---|---|
| **Test** | D02 — metric tiles are present for org_admin |
| **Spec file** | `tests/agents/generated/dashboard.agent.spec.ts` |
| **Failure date** | 2026-03-31 |
| **Error message** | `expect(tileCount).toBeGreaterThan(0)` — received 0 |
| **Diagnosis** | The `data-testid` prefix changed from `metric-tile-` to `dashboard-metric-` in a recent UI update. The tiles render correctly but the selector no longer matches. |
| **Fix applied** | Updated locator from `[data-testid^="metric-tile-"]` to `[data-testid^="dashboard-metric-"]` |
| **Fix category** | Selector update |
| **Result** | PASS — test passes on 3 consecutive runs after fix |
| **Lines changed** | L87, L92 in `dashboard.agent.spec.ts` |

---

## Entry 2 (EXAMPLE)

| Field | Value |
|---|---|
| **Test** | D01 — dashboard loads for org_admin |
| **Spec file** | `tests/agents/generated/dashboard.agent.spec.ts` |
| **Failure date** | 2026-03-31 |
| **Error message** | `page.goto: Timeout 30000ms exceeded` |
| **Diagnosis** | The dev server was slow to respond during the test window. The 30s timeout was insufficient for initial cold-start load. This is a transient infrastructure issue, not a test logic error. |
| **Fix applied** | Increased goto timeout from 30000 to 45000ms. Added retry annotation for CI. |
| **Fix category** | Timeout adjustment |
| **Result** | PASS — confirmed not a persistent issue. Timeout increase is a safety margin. |
| **Lines changed** | L52 in `dashboard.agent.spec.ts` |

---

## Entry 3 (EXAMPLE)

| Field | Value |
|---|---|
| **Test** | D04 — metrics API returns data |
| **Spec file** | `tests/agents/generated/dashboard.agent.spec.ts` |
| **Failure date** | 2026-03-31 |
| **Error message** | `expect(dashRes.ok()).toBeTruthy()` — received status 401 |
| **Diagnosis** | The access token had expired between login and the API call. The test was not reusing a stale cached token, but the server's token TTL was shorter than expected. |
| **Fix applied** | Moved the API call immediately after login with no intermediate browser operations. Added token freshness check. |
| **Fix category** | Test logic fix |
| **Result** | PASS — token is now used within 1s of issuance |
| **Lines changed** | L105-L115 in `dashboard.agent.spec.ts` |

---

## Fix Categories

- **Selector update** — CSS, data-testid, role, or text selector changed
- **Timeout adjustment** — waitForTimeout or goto timeout modified
- **Assertion correction** — Expected value updated to match legitimate UI change
- **Test logic fix** — Wrong page, wrong role, race condition, or ordering issue
- **FORBIDDEN** — Modifying app source, changing API endpoints, altering shared helpers, removing tests
