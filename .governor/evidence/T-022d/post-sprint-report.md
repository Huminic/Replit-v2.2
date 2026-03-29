# T-022d Post-Sprint Report: Marketing & Studio Depth

**Sprint:** T-022d
**Target:** https://dev.huminicdev.com
**Account:** serra_honda@huminic.ai
**Timestamp:** 2026-03-27T01:20:00Z
**Agent:** Test Agent (Opus 4.6)

---

## Summary

7 of 11 ACs evaluated. 5 PASS, 1 CONDITIONAL PASS, 1 FAIL, 4 BLOCKED.

The marketing page structure, tab navigation, agent cards, studio filters, and dashboard metrics are all functional and correct. Agent chat interactions (AC8-11) could not be tested due to persistent Playwright browser session instability caused by intermittent `net::ERR_FAILED` on `/api/auth/refresh`.

---

## AC Results

### AC1: Marketing Page Tabs — PASS
- **Evidence:** DOM query confirmed h1="Marketing" with 4 tabs: Dashboard, Agents, Studio, Insights
- **Test IDs:** `tab-marketing-dashboard`, `tab-marketing-agents`, `tab-marketing-studio`, `tab-marketing-insights`
- **Screenshot:** marketing-dashboard.png (tour overlay partially obscures, DOM data is authoritative)

### AC2: No Campaign Data Fetching — PASS
- **Evidence:** grep for "campaign" in `client/src/pages/marketing.tsx` returns 10 matches:
  - Lines 4, 11, 14: JSDoc comments only
  - Lines 50, 85, 89-92: `DashboardMetrics` interface and tile rendering, reading from shared `/api/metrics/dashboard` endpoint
- **No campaign-specific query keys or fetch hooks exist.** The page reads `campaignStats` from the generic dashboard metrics response.
- **Query key used:** `['/api/metrics/dashboard', orgId]` (line 82)

### AC3: Studio Filter Pills — PASS
- **Evidence:** DOM query on `data-testid="studio-filter-pills"` returns 7 buttons: All, Images, Videos, Copy, Scores, Voiceovers, Radar
- **Code confirmation:** `studioFilterCategories = ['All', 'Images', 'Videos', 'Copy', 'Scores', 'Voiceovers', 'Radar']` (marketing.tsx:184)
- **Screenshot:** marketing-studio.png

### AC4: Images Filter — CONDITIONAL PASS
- **Evidence:** The `data-testid="studio-filter-images"` button exists and the filtering code is correct (`StudioGallery.tsx:71-80` filters by `activeType`). However, the gallery was in empty state ("No artifacts yet") so no visual content change could be observed.
- **Code path verified:** When filter is not 'ALL', `items.filter(a => a.type === activeType)` correctly narrows results.

### AC5: StudioGallery Artifacts — FAIL (Empty State)
- **Evidence:** `data-testid="empty-state-studio"` was present. Zero artifacts exist for this test account. The gallery renders the empty state correctly with palette icon, "No artifacts yet" heading, and instruction text.
- **Root cause:** No marketing agent sessions with artifacts exist on the serra_honda test account.

### AC6: Agent Cards — PASS
- **Evidence:** DOM query on `data-testid^="agent-card"` returned 5 cards:

| # | ID | Name | Description (truncated) |
|---|-----|------|------------------------|
| 1 | photo-studio | Photo Studio | Enhance vehicle photos and generate studio visuals... |
| 2 | video-producer | Video Producer | Turn photos into cinematic marketing videos... |
| 3 | copywriter | Copywriter | Write your ads and captions... |
| 4 | creative-director | Creative Director | Tell me if this creative is good enough... |
| 5 | market-intel | Market Intel | Show me what the competition looks like... |

- **Screenshot:** marketing-agents.png
- **Code confirmation:** `MARKETING_AGENTS` array in `client/src/lib/marketing-agents.ts` defines exactly these 5 agents.

### AC7: Dashboard Metrics vs API — PASS
- **Tile values (DOM):**
  - Campaign Performance: 0%
  - Campaigns Active: 0
  - Messages Sent: 0
  - Replies Received: 0

- **API response (curl `GET /api/metrics/dashboard`):**
  ```json
  "campaignStats": {
    "byDepartment": {
      "marketing": {
        "replyRate": 0,
        "active": 0,
        "sent": 0,
        "replied": 0
      }
    }
  }
  ```

- **Mapping verified in code (marketing.tsx:89-92):**
  - `mktStats.replyRate` -> Campaign Performance
  - `mktStats.active` -> Campaigns Active
  - `mktStats.sent` -> Messages Sent
  - `mktStats.replied` -> Replies Received

- All tile values match the API response exactly.

### AC8: Photo Studio Agent Chat — BLOCKED
- **Blocker:** Playwright browser session instability. Intermittent `net::ERR_FAILED` on `/api/auth/refresh` causes auth token loss during navigation.
- **Partial evidence:** AgentChatView loads correctly with `data-testid="agent-chat-view"` and `input-agent-chat` (placeholder: "Describe what you want to do with this photo..."). Message submission could not be completed.
- **I-102 note:** marketing.tsx:215-216 documents known FAL integration issue for Photo Studio image generation.

### AC9: Copywriter Agent Chat — BLOCKED
- **Blocker:** Same Playwright browser session instability.

### AC10: Video Producer Agent Chat — BLOCKED
- **Blocker:** Same Playwright browser session instability.

### AC11: Market Intel Agent Chat — BLOCKED
- **Blocker:** Same Playwright browser session instability.

---

## Browser Session Instability Analysis

The Playwright MCP browser experienced persistent `net::ERR_FAILED` errors on API endpoints:
- `/api/auth/refresh` — causes auth token invalidation
- `/api/auth/login` — intermittent failures during login attempts
- `/api/openai-proxy` — would block agent chat responses

**Symptoms:**
1. Successful login, page loads, sidebar visible
2. Any navigation (sidebar click, tab click) triggers auth token refresh
3. If refresh fails (net::ERR_FAILED), session drops to /login
4. Login sometimes also fails with net::ERR_FAILED

**Impact:** Agent chat ACs require multi-step navigation + message sending + waiting for AI response. Each step risks session loss. The success window was approximately 10-15 seconds after login.

**Root cause hypothesis:** The Playwright browser may be running through a network proxy or have DNS resolution issues specific to API calls (the HTML/JS assets load fine from CDN, but API calls to the same domain fail intermittently).

---

## Recommendations

1. **AC5:** Generate at least one artifact per marketing agent on the test account to enable gallery testing.
2. **AC8-11:** Retest with a more stable browser environment or use direct API testing via curl to validate the `/api/openai-proxy` endpoint and tool execution pipeline.
3. **I-102:** Photo Studio FAL integration issue remains documented but unverified via live testing.

---

## Evidence Files

- `marketing-dashboard.png` — Marketing page with Dashboard tab, tour overlay visible
- `marketing-studio.png` — Studio tab with filter pills, empty state
- `marketing-agents.png` — Agents tab with 5 agent cards
- `sprint-activity.log` — Detailed AC-by-AC log entries
