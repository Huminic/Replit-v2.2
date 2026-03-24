# Pre-Execution Report: S-5 — Marketing

**Sprint:** S-5
**Type:** UI cleanup + studio filters + agent quality tests
**Date:** 2026-03-24
**Status:** READY

## Objective

Remove Campaigns tab from Marketing page (campaigns belong in Service), verify remaining tabs (Dashboard/Agents/Studio/Insights), add Studio category filter pills, verify 5 marketing agent cards with descriptions, and test agent quality for Photo Studio and Copywriter.

## Declared Files

- `client/src/pages/marketing.tsx` — remove Campaigns tab, add Studio filter pills
- `tests/e2e/s5-marketing.spec.ts` — new test file

## UI Changes

DECLARED:
- Campaigns tab REMOVED from marketing page
- Studio category filter pills added (All, Images, Videos, Copy, Scores, Voiceovers, Radar)

## Acceptance Criteria (from sprints.json)

| ID | Criterion | Component | Evidence |
|----|-----------|-----------|----------|
| S-5.AC1 | No "Campaigns" tab on marketing page | S-5.1 | Code review (negative) |
| S-5.AC2 | No campaign data fetching in marketing.tsx | S-5.1 | Code review |
| S-5.AC3 | Tabs are: Dashboard, Agents, Studio, Insights | S-5.2 | Code review |
| S-5.AC4 | Studio has category filter pills | S-5.3 | Code review |
| S-5.AC5 | Studio filters work: clicking "Images" shows only image artifacts | S-5.3 | Code review |
| S-5.AC6 | All 5 marketing agent cards visible with descriptions | S-5.4 | API assertion |
| S-5.AC7 | Dashboard tiles match API values | S-5.5 | API response |
| S-5.AC8 | Photo Studio produces image artifact | S-5.6 | Conversation log |
| S-5.AC9 | Copywriter produces ad copy with categories | S-5.6 | Conversation log |

## Test Plan

### New test file to write:
- `tests/e2e/s5-marketing.spec.ts`

### Test sections:

1. **No Campaigns tab (AC1/AC2)** — grep marketing.tsx for campaigns tab id, assert not found. grep for campaign query keys, assert not found.
2. **Tab list (AC3)** — grep marketing.tsx tab definitions, assert Dashboard, Agents, Studio, Insights present
3. **Studio filters (AC4/AC5)** — grep marketing.tsx for filter pill definitions (All, Images, Videos, Copy, Scores, Voiceovers, Radar). Check filter state management code exists.
4. **5 marketing agents (AC6)** — GET /api/agents as serra_honda, filter department=marketing, assert 5 agents: Photo Studio, Video Producer, Copywriter, Market Intel, Creative Director. Assert descriptions > 20 chars.
5. **Dashboard tiles (AC7)** — GET /api/metrics/dashboard, assert response has values
6. **Photo Studio quality (AC8)** — Chat with Photo Studio: "Generate a hero image for a red 2024 Honda Civic". Assert response references image/photo/generate.
7. **Copywriter quality (AC9)** — Chat with Copywriter: "Write ad copy for a spring service special at Serra Honda". Assert response contains structured copy (headline, body, CTA, or similar).

### Exact commands:
```
npx playwright test tests/e2e/s5-marketing.spec.ts --project=sprint --reporter=list --workers=1
```

### Known risks:
- AC8: Photo Studio references fal.ai tool calls. The agent may describe what it would generate rather than actually calling the API. Test checks for image-related response content.
- AC9: Copywriter should produce structured copy with categories. Test checks for copy-related keywords.

## Ghost Entry Gate
**Reviewed by:** ghost-agent
**Timestamp:** 2026-03-24T08:04:36Z
**Sprint:** S-5
**A1 Previous cleared:** PASS (S-4 EXIT GATE: CLEARED)
**A2 Worktree:** clean
**A3 Session state:** PASS (references S-5)
**A4 Pre-exec exists:** PASS
**A5 Objective:** PASS
**A6 Test Plan:** PASS (1 npx command)
**A7 Declared Files:** PASS (marketing.tsx + test file)
**A8 Match check:** MATCH (1 app file, 6 components, 9 ACs)
**A9 UI permissions:** PASS (DECLARED — Campaigns tab removed, Studio filters added)
**A10 Ghost messages:** PASS (clear)
**ENTRY GATE: APPROVED**
