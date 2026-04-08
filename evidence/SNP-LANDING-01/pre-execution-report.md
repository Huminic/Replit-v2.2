# Pre-Execution Report — SNP-LANDING-01

**Date:** 2026-04-08
**Sprint:** SNP-LANDING-01
**Branch:** wave-pe3
**Priority:** P2
**Author:** Scribe Agent

---

## Objective

Add department-aware routing to the public widget landing page via a `dept` query parameter. When `?dept=service` is present, the page renders service-specific copy, form labels, and hero content instead of the default sales content. Add a TopBar dropdown replacing the plain Globe button, containing "Sales Landing Page" and "Service Landing Page" navigation items. Extend the public voice config API endpoint to filter agents by department when `dept=service` is supplied.

A known blocker exists: Nancy Gaston's VAPI assistant ID and Tavus persona ID are currently null. Department-aware routing code will be built correctly, but the service page will silently fall back to Caroline (sales agent) until the operator provisions Nancy in VAPI and Tavus. This is not a code blocker — it is a content/provisioning blocker and is explicitly acknowledged.

---

## Declared Files

| # | File | Change |
|---|------|--------|
| 1 | `client/src/pages/widget-landing.tsx` | Add `dept` query param detection; render conditional content for `service` vs `sales` (default) |
| 2 | `client/src/components/layout/TopBar.tsx` | Replace Globe plain button with `DropdownMenu` containing "Sales Landing Page" and "Service Landing Page" items |
| 3 | `server/routes/public.ts` | Add `dept=service` support to `GET /api/widget/voice-config/:slug` — filter agents by department when param present; return 404/fallback if no service agents configured |

---

## UI Changes

`uiPermissions`: DECLARED — two UI elements permitted:

1. `client/src/pages/widget-landing.tsx` — conditional content rendering based on `dept` query param (headline, body copy, form labels, stats, hero image placeholder)
2. `client/src/components/layout/TopBar.tsx` — Globe icon button replaced with DropdownMenu; two items: "Sales Landing Page", "Service Landing Page"

No other UI elements, pages, or components may be modified.

---

## Acceptance Criteria

Copied verbatim from sprint definition:

| ID | Criterion |
|----|-----------|
| AC1 | `/p/serra-honda?dept=service` loads the landing page with service-specific copy ("Schedule your service appointment" not "VIP test drive") |
| AC2 | `/p/serra-honda` (no dept param) still shows the sales landing page unchanged — no regression |
| AC3 | TopBar Globe icon shows a dropdown with "Sales Landing Page" and "Service Landing Page" options |
| AC4 | Clicking "Service Landing Page" in the dropdown opens `/p/serra-honda?dept=service` in a new tab |
| AC5 | Web chat widget on the service page uses "Nancy" persona (or falls back to Caroline with a log note if Nancy has no config) |
| AC6 | Voice callback on service page filters to service-department agents when `dept=service` (returns 404/fallback if none configured) |

---

## Test Plan

### F1 — Sales page regression (AC2)
- Pre-condition: Application running, Serra Honda slug resolves correctly.
- Action: Navigate to `/p/serra-honda` (no query param).
- Verification: Sales landing page renders with original sales copy. No visual regressions. "VIP test drive" headline (or equivalent) present. No service content visible.
- Pass condition: Sales page visually unchanged from pre-sprint baseline.

### F2 — Service page renders with dept param (AC1)
- Pre-condition: Application running; service copy implemented (may use placeholder copy if final copy not yet provided by operator).
- Action: Navigate to `/p/serra-honda?dept=service`.
- Verification: Page renders service-specific headline (e.g., "Schedule your service appointment" or placeholder equivalent). Sales headline not present. Form labels and stats reflect service context.
- Pass condition: Service content visible; sales content absent; page renders without errors.

### F3 — TopBar dropdown (AC3 + AC4)
- Pre-condition: Authenticated as any user with TopBar access.
- Action: Click the Globe icon in TopBar.
- Verification: (a) A dropdown appears with exactly two items: "Sales Landing Page" and "Service Landing Page". (b) Click "Sales Landing Page" — opens `/p/serra-honda` (no dept param) in a new tab. (c) Click "Service Landing Page" — opens `/p/serra-honda?dept=service` in a new tab.
- Pass condition: Both items visible; both open correct URLs in new tabs.

### F4 — Web chat widget persona on service page (AC5)
- Pre-condition: `/p/serra-honda?dept=service` loaded.
- Action: Observe or interact with the web chat widget on the service page.
- Verification: Widget configuration request uses Nancy's persona ID if provisioned. If Nancy has `tavusPersonaId=null`, server logs contain a fallback note identifying Caroline as the fallback and the reason (null Nancy config).
- Pass condition: Either Nancy is used (if provisioned) OR fallback to Caroline is logged explicitly — no silent incorrect routing.

### F5 — Voice config API filters by department (AC6)
- Pre-condition: `GET /api/widget/voice-config/serra-honda?dept=service` endpoint accessible.
- Action: Call `GET /api/widget/voice-config/serra-honda?dept=service`.
- Verification: Response either (a) returns a service-department VAPI assistant ID if one is configured, or (b) returns a 404 or fallback response if no service agents are configured — it must NOT silently return Caroline's (sales) VAPI assistant ID as if it were a service agent.
- Pass condition: Response is either a correctly filtered service agent config or an explicit fallback/404. Caroline's VAPI ID must not be returned without a fallback flag.

---

## Blockers (not code blockers — must be tracked)

| Blocker | Type | Owner | Impact |
|---------|------|-------|--------|
| Nancy Gaston `vapiAssistantId` = null | Provisioning | Operator | Service page voice will fall back to Caroline until resolved |
| Nancy Gaston `tavusPersonaId` = null | Provisioning | Operator | Service page video/chat persona will fall back to Caroline |
| Service copy (headline, body, form labels, stats) not yet provided | Content | Operator | Placeholder copy will be used; final copy is a content-only change post-sprint |
| Service hero image not yet provided or approved | Content | Operator | Existing sales image or blank placeholder will be used |

These blockers do not prevent code implementation. The sprint may complete with placeholder content and null-safe fallback logic. Final copy and Nancy's provisioning are operator tasks.

---

## Risk Analysis

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| `dept=service` param accidentally routes visitors to sales agent without logging | High | Low | AC6 explicitly tests this; voice config must either filter correctly or return 404/flagged fallback — never silently wrong |
| Sales page regression from widget-landing.tsx conditional logic | Medium | Low | F1 explicitly tests sales page before and after; default branch must be unchanged |
| TopBar DropdownMenu component conflicts with existing TopBar layout | Low | Low | Read TopBar.tsx before modifying; use existing Radix/Shadcn DropdownMenu primitives if already in codebase |
| Placeholder service copy accepted as final (content freeze risk) | Low | Medium | Placeholder copy must be clearly marked as placeholder in code comments; operator must be notified to provide final copy |
| Nancy fallback logs missing — silent wrong routing goes undetected | High | Low | Fallback to Caroline must write a server-side log entry; verified in F4 |
| `public.ts` dept filter breaks existing (no-param) voice config calls | Medium | Low | F1 and F5 both test the no-param path; filter must be additive, not replacing |

---

## Entry Gates

- [ ] sprints.json entry for SNP-LANDING-01 exists with status `pending`
- [ ] All 3 declared files exist at the paths listed above
- [ ] No other sprint is currently `in_progress`
- [ ] Git worktree is on branch `wave-pe3` or it will be created
- [ ] Operator has been notified of content blockers (service copy, hero image, Nancy provisioning)
- [ ] Placeholder copy approach is approved (implementation may proceed without final copy)
- [ ] AC5 fallback behavior (log note for null Nancy config) is understood and accepted

---

## Ghost Entry Gate

**Ghost Agent Review — 2026-04-08**

**Checklist:**

1. Sprint ID registered in sprints.json: CONFIRMED — SNP-LANDING-01 present, status `pending`
2. Declared files match sprint definition: CONFIRMED — all 3 files match exactly
3. Acceptance criteria copied accurately: CONFIRMED — all 6 ACs reproduced verbatim
4. Test plan covers every AC: CONFIRMED — F1→AC2, F2→AC1, F3→AC3+AC4, F4→AC5, F5→AC6
5. UI change scope respected: CONFIRMED — only widget-landing.tsx and TopBar.tsx declared and permitted
6. Risk analysis present and plausible: CONFIRMED
7. Blocker table present and correctly categorized as provisioning/content (not code) blockers: CONFIRMED
8. Silent wrong routing risk (AC6) explicitly tested: CONFIRMED — F5 specifically guards against silent Caroline fallback
9. Sales page regression explicitly tested: CONFIRMED — F1 covers AC2
10. Placeholder copy approach documented: CONFIRMED
11. Branch declared: CONFIRMED — wave-pe3

**Verdict:**

ENTRY GATE: APPROVED

All three declared files, six acceptance criteria, and five test flows are consistent with the sprint definition. The provisioning blockers for Nancy are correctly categorized as operator tasks that do not block code implementation. The critical routing risk (service page silently using sales agent) is explicitly addressed in both the test plan (F5) and risk analysis. Implementation may proceed with placeholder service copy and null-safe Nancy fallback logic.
