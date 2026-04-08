# Pre-Execution Report — SNP-INSIGHTS-B

**Sprint ID:** SNP-INSIGHTS-B
**Title:** Insights Sprint B — channel classification, engagement metric, service fallback, VIN source IDs
**Branch:** wave-pe3
**Priority:** P2
**Date:** 2026-04-08
**Report Author:** Ghost / Scribe Agent

---

## Objective

Fix four confirmed bugs in the Insights pipeline and Service page metrics:

- **B14** — Channel Performance metrics (Walk-In, Phone, Referral) show ~0% for VinSolutions orgs because lead sources are stored as API URLs, not readable names. The `deriveChannel` function cannot match URL-format lead sources to the correct channel.
- **B20** — lib-20 Engagement Transition is always ~100% because the current filter (`vinUpdatedAt > vinCreatedAt`) is true for virtually every lead.
- **B21** — Service page Insights tab silently falls back to all-department totals when no service campaigns exist, making the metrics misleading.
- **B28** — VIN Source IDs appear as "VIN Source #7098" instead of resolved names in Loss Patterns because the lead source cache is not populated (or the VIN lead sources API call is failing) for affected orgs.

---

## Declared Files

| # | File | Bug(s) Addressed |
|---|------|-----------------|
| 1 | `server/routes/insights.ts` | B14 (channel classification for URL-format lead sources), B20 (engagement transition logic), B28 (source ID resolution in loss patterns) |
| 2 | `server/sync.ts` | B14 optional: cache leadSource names during sync if feasible |
| 3 | `client/src/pages/insights.tsx` | B14 (channel performance chart display), B20 (engagement metric display) |
| 4 | `client/src/pages/service.tsx` | B21 (remove cross-department fallback, show 0 or empty state when no service campaigns exist) |

**Scope boundary:** No other files may be modified. `server/sync.ts` is optional — only modify if the leadSource caching approach is confirmed feasible. Any server/sync.ts change must be narrowly scoped to adding leadSource caching.

---

## Pre-Flight Verification

### B14 — Channel Classification (CONFIRMED)

`server/routes/insights.ts` `deriveChannel` function (lines 78-93):
```typescript
function deriveChannel(leadSource: string | null | undefined, vinStatus: string | null | undefined): string {
  const src = (leadSource || "").toLowerCase();
  ...
  if (src.includes("api.vinsolutions.com/leadsources")) return "Website";
  return "Other";
}
```
VIN Solutions stores lead sources as URLs like `https://api.vinsolutions.com/leadsources/id/7098?dealerid=21043`. The function classifies ALL VIN URL-format sources as "Website" (line 90), regardless of the actual lead type (phone call, walk-in, referral). This means Walk-In, Phone, and Referral channels will show near-zero counts for all VinSolutions orgs.

The `formatLeadSource` function (lines 49-70) exists and can resolve URL IDs to human-readable names via `sourceMap`. However, `deriveChannel` does not use `sourceMap` — it only looks at the raw URL string.

**Fix direction:** `deriveChannel` must accept an optional `sourceMap` and resolve the URL to a name before pattern-matching. Alternatively, use the `leadType` field if it is stored during sync.

**Limitation:** If the VIN Solutions lead sources API returns names like "AMP - Request Custom Offer" without classifiable keywords (walk, phone, referral), the channel assignment will still fall to "Website" or "Other". This must be documented if encountered.

### B20 — Engagement Transition (CONFIRMED)

`server/routes/insights.ts` lines 936-939:
```typescript
const engagementTransition = allLeads.filter(l => {
  return isActiveLead(l.vinStatus) && l.vinCreatedAt && l.vinUpdatedAt &&
    new Date(l.vinUpdatedAt).getTime() > new Date(l.vinCreatedAt).getTime();
});
```
This filter returns every active lead that has been updated at any point after creation — which is essentially all active leads. The intended metric should measure leads that progressed meaningfully (e.g., from new/uncontacted to active with a conversation, or leads where a message was sent).

**Fix direction:** Change filter to: active leads that also have at least one conversation (message) in the conversations table, OR leads that moved from a "new" status to an "active" status. The `conversations` table is accessible via storage and correlates by `organizationId`.

### B21 — Service Page Fallback (CONFIRMED)

`client/src/pages/service.tsx` line 839:
```tsx
<InsightsPage embedded />
```
The Insights tab in the service page embeds the full `InsightsPage` component without any department scoping. The InsightsPage queries VIN leads regardless of department. When no service campaigns exist, the page does not show an empty state — it shows all-org lead data.

**Fix direction:** Add a guard in the service.tsx Insights tab section: if `serviceCampaigns.length === 0`, render an empty state message (e.g., "No service campaigns — create a campaign to see service metrics") instead of the embedded InsightsPage. If campaigns do exist, the embedded InsightsPage is shown as-is.

**Note:** This is a UI-only change. The underlying InsightsPage does not need a department filter for this fix.

### B28 — VIN Source ID Display (PARTIALLY CONFIRMED)

`server/routes/insights.ts` `formatLeadSource` function (lines 49-70) already attempts to resolve VIN URL IDs via `sourceMap`. The fallback is `VIN Source #${sourceId}` (line 58), which is the symptom described in B28.

This means the `sourceMap` is empty or not being populated for affected orgs. The `leadSourceCache` map (lines 11-32) fetches from the VIN lead sources API at runtime. If that API call fails or returns an unexpected shape, the cache stays empty and fallback strings appear everywhere.

**Fix direction:** Add error logging to the `getLeadSourceMap` function (lines 14-34) so failures are visible. Optionally, cache results during VIN sync (`server/sync.ts`) so the map is pre-populated. The runtime cache approach is correct in principle but needs better failure visibility.

---

## Acceptance Criteria

| ID | Criterion |
|----|-----------|
| AC1 | Channel Performance chart shows meaningful breakdown (Walk-In, Phone, Referral populated if leads exist with those source types). If genuinely 0, the chart shows 0 without masking them as "Other" or "Website" |
| AC2 | lib-20 Engagement Transition shows a more meaningful percentage — leads that have had a conversation or progressed from new to active. Not 95%+ for a typical org |
| AC3 | Service page Insights tab shows 0 / empty-state message when no service campaigns exist, not all-department totals |
| AC4 | Loss Patterns in Insights show readable source names (e.g., "AMP - Request Custom Offer") not numeric IDs like "VIN Source #7098" |

---

## Test Plan

| ID | Test | Method | Account |
|----|------|--------|---------|
| F1 | Open Insights > Channel Performance chart. Check if Walk-In, Phone, Referral have non-zero values (or plausible zeros). Verify "Website" is not absorbing all VIN URL leads | Playwright CLI | serra_honda@huminic.ai |
| F2 | Open Insights > Library Metrics. lib-20 Engagement Transition must not be 95%+. Should reflect something plausible (20-60% range for a typical active org) | Playwright CLI | Any org_admin with lead data |
| F3 | Navigate to Service page > Insights tab with an org that has no service campaigns. Verify the tab shows an empty state message, not lead data | Playwright CLI | columbia_hyundai@huminic.ai (verify no service campaigns first) |
| F4 | Open Insights > Loss Patterns. Source names must be human-readable, not "VIN Source #XXXX". If some still show ID format, the VIN API call is still failing — document as a known limitation | Playwright CLI | Any VinSolutions org |

**Cross-tests (regression):**
- CX1: Verify channel classification fix does not affect non-VinSolutions orgs (orgs with human-readable lead sources in DB). Their channel breakdown must remain unchanged.
- CX2: Verify B21 guard does not affect orgs with service campaigns — InsightsPage must still render as before when campaigns exist.
- CX3: Verify B28 logging addition does not affect performance or existing behavior when the API call succeeds.

**Test commands:**
```bash
npx playwright test tests/insights-sprint-b.spec.ts --reporter=list
npx playwright test tests/insights-sprint-b.spec.ts --headed
```

---

## Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Channel classification cannot be fully fixed without a reliable leadType field — VIN source names may not contain classifiable keywords | High | Medium | Implement best-effort keyword matching on resolved names; document remaining "Other" as a known limitation if VIN source names are not classifiable |
| B20 engagement fix may require a DB join on conversations — could be slow | Medium | Medium | Use a subquery with LIMIT or check only the last 90 days of conversations; add timing log |
| B21 empty-state guard hides InsightsPage — if the guard condition is wrong, valid service data disappears | Low | High | Guard must check `serviceCampaigns.length === 0` AFTER the campaigns query resolves, not during loading state |
| B28 source map population may require VIN API to be reachable at query time — if VIN API is down, names revert to ID format | Medium | Low | Already acceptable as a known limitation; add error log for visibility |
| sync.ts changes (optional) could affect ongoing VIN sync if implemented incorrectly | Low | High | Only implement if operator explicitly approves; if not feasible, skip and document |

---

## Entry Gates Checklist

| Gate | Status | Notes |
|------|--------|-------|
| Sprint has a committed sprint in sprints.json | PENDING | SNP-INSIGHTS-B not yet in sprints.json — must be registered before execution |
| All declared files exist | PASS | All 4 files confirmed present |
| Bugs confirmed in source code | PASS | B14, B20, B21, B28 confirmed by code inspection (B28 partially — root cause is API failure) |
| No conflicting in-progress sprint | PASS | No sprint currently in_progress per context.md |
| UI changes within declared scope | PASS | Chart display, empty state, metric value only |
| Test plan covers all ACs | PASS | F1–F4 map to AC1, AC2, AC3, AC4 respectively |
| Cross-tests declared | PASS | CX1, CX2, CX3 declared above |
| Known limitations documented | PASS | Channel classification limitation and B28 VIN API dependency both noted |

---

## Ghost Entry Gate

**Reviewer:** Ghost Agent (scribe role)
**Review Date:** 2026-04-08
**Sprint:** SNP-INSIGHTS-B

### Diff Against Sprint Specification

| Sprint Spec Element | Pre-Exec Coverage | Assessment |
|--------------------|--------------------|-----------|
| 4 declared files | All 4 listed (sync.ts marked optional) | PASS |
| 4 bugs (B14, B20, B21, B28) | All 4 addressed in verification section | PASS |
| 4 ACs (AC1–AC4) | All 4 present in AC table | PASS |
| 4 test scenarios (F1–F4) | All 4 present with method and account | PASS |
| Risk analysis | 5 risks identified with mitigations | PASS |
| Known limitations acknowledged | Channel classification and VIN API noted | PASS |
| Branch declared | wave-pe3 | PASS |
| Priority declared | P2 | PASS |

### Code Verification Results

- B14: Confirmed. `deriveChannel` maps all `api.vinsolutions.com/leadsources` URLs to "Website" at line 90. All VIN URL-format lead sources are misclassified.
- B20: Confirmed. `engagementTransition` filter at lines 936-939 uses `vinUpdatedAt > vinCreatedAt` — always true for active leads.
- B21: Confirmed. Service page embeds `<InsightsPage embedded />` at line 839 without a service campaign guard.
- B28: Partially confirmed. `formatLeadSource` fallback is "VIN Source #ID" at line 58. Root cause is `sourceMap` being empty due to VIN API failure or cache miss — needs logging to confirm.

### Gate Decision

All acceptance criteria are enumerated. All declared files verified to exist. All bugs confirmed or root-cause identified. Test plan covers each AC with specific Playwright commands and named test accounts. Risks and known limitations are documented. The `sync.ts` optional-change caveat is clearly stated.

> **ENTRY GATE: APPROVED**
>
> Sprint SNP-INSIGHTS-B is cleared for implementation. Builder agents may proceed with the 4 declared files. Note: SNP-INSIGHTS-B must be registered in sprints.json before the pre-commit hook will accept a commit. The sync.ts change is optional and requires operator confirmation before implementation. B28 root cause (VIN API failure) must be logged and confirmed during implementation before any cache-warming solution is attempted.
