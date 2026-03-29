# Issue Verification — Batch 1

**Date:** 2026-03-28
**Method:** Code-only verification (no live testing)
**Verifier:** Ghost agent (code read)

## Results

| ID | Area | Still exists? | Evidence | Effort | Notes |
|----|------|---------------|----------|--------|-------|
| I-126 | AI Chat History | OPEN (partial) | SubMenuManager.tsx line 448: chat history items display `Chat — {timeAgo}` NOT username. The "username" part of the issue appears already fixed — items show relative timestamps. However, the `conversations` table (schema.ts line 86-104) has NO `title` field, so there is no chat title to display — only timestamps. Resume handler exists in main.tsx (line 576-586): `?conversationId=X` sets state, loads messages via query (line 621-628), maps them into chat UI (line 631-645). Resume DOES load messages from the API. | Easy | Chat title display: no title field in schema, so "Chat — 2 hours ago" is the best available. Resume functionality appears wired. **NEEDS LIVE TEST** to confirm resume actually renders messages correctly end-to-end. |
| I-127 | Navigation | CLOSED | Sidebar.tsx line 56-57: My Work item is commented out with explicit `// I-127: My Work hidden from sidebar navigation pending feature completion`. Not rendered. | — | Already fixed. |
| I-136 | Sales Nav | CLOSED | Sidebar.tsx line 58: Sales item has `path: '/sales'`. No routing to `/marketing`. The path is correct. | — | Already fixed. No evidence of the bug in current code. |
| I-138 | Sales Agents | NEEDS LIVE TEST | No "Unauthorized Agent" found anywhere in seed.ts. The seed defines 3 sales chat agents per store: Data Guru, Sales Coach, Communication Writer. Plus voice agents (Caroline, Georgia). sales.tsx line 482-483 queries `/api/agents?department=sales` — returns all sales agents for current org. Line 660 renders all `salesAgents` without filtering by name. If a test artifact was manually created in the DB, it would show. Code has no filter to exclude it. | Easy | No seed evidence of "Unauthorized Agent". If it exists, it was manually created. Fix: either delete from DB or add a filter in sales.tsx. |
| I-139 | Data Guru | OPEN | server/routes/chat.ts line 102: `isCrmGuru = mode === "crm_guru"`. Lines 263-271: When isCrmGuru is true, the system prompt includes `DATA GURU MODE (ACTIVE): You are operating as the Data Guru — the dedicated CRM intelligence agent`. The prompt does NOT mention "CRM Guru mode" literally, but uses "Data Guru" as the mode name. The hallucination risk comes from the system prompt referencing "CRM intelligence agent" and VinSolutions-specific instructions that may not match actual data available. The agent's seed description (seed.ts line 447) says "VIN Solutions CRM data expert" which is correct. | Medium | The system prompt itself is well-structured but refers to tools (`vin_query_leads`, `vin_lead_summary`) that may not exist or return data. If those tools fail silently, the LLM may fabricate responses. **NEEDS LIVE TEST** to confirm whether "CRM Guru mode" text appears in responses. |
| I-116 | Manage User Chats | OPEN | management.tsx lines 274-285: `renderUserChats()` is a placeholder with "User chat activity — coming soon" text. No API call, no data, no filtering. Pure placeholder. | Hard | Requires: new API endpoint for fetching user chats across agents, user filter UI, conversation list rendering. Full feature build. |
| I-169 | Hunch Status Transitions | OPEN (partially wired) | management.tsx lines 151-185: Three buttons exist — Accept (new->accepted), Dismiss (new->dismissed), Resolve (accepted->resolved). Each calls `updateHunchMutation` which hits `PATCH /api/hunches/:id` with `{ status }`. Backend exists at server/routes/hunches.ts line 21. The schema defines 8 hunch statuses but UI only exposes 3 transitions (new->accepted, new->dismissed, accepted->resolved). Missing transitions: investigating, in_progress, escalated, archived. | Medium | API is wired and functional for 3 transitions. The remaining 5 status states have no UI buttons. Effort depends on whether all 8 states need UI support or just the current 3. |
| I-150 | TeamBox Channel Filters | OPEN | teambox.tsx lines 78-85: `channelFilters` array includes `{ id: 'chat', label: 'Web Chat' }` and `{ id: 'whatsapp', label: 'WhatsApp' }`. These channels exist in the type definition (line 45) and icon mapping (lines 62-63). | Easy | Whether this is a bug depends on product intent. If the system doesn't support WhatsApp/Web Chat channels yet, showing filters for them is misleading. If they are planned channels, this is intentional. Clarify with product. |
| I-130 | Agent Favorites + Sub-menu | OPEN | sales.tsx lines 251-256: Contains an explicit comment acknowledging this issue — `I-130 Assessment: Agent favorites feasibility`. Notes that a generic favorites API exists (`/api/favorites`) but it stores page bookmarks, not agent-level favorites. No favorites UI (star icons) on agent cards. No sub-menu bar on any agent page (sales.tsx, service.tsx, marketing.tsx). Agent tabs render plain card grids only. | Medium | Requires: per-agent star UI on cards, favorites filter/sort, possibly new API endpoint or adaptation of existing favorites system. Sub-menu bar for agent pages also needed. |
| I-152 | "Discuss with Georgia" FAB | CLOSED (mislabeled) | No "Discuss with Georgia" text exists in code. AppLayout.tsx line 197 shows a right-pane toggle button with title `Discuss with ${personaName}` where personaName comes from AppContext (org-level persona, e.g. "Serra"). "Georgia" is only referenced in index.css line 71 as the CSS font fallback (`Georgia, serif`). The FAB described in AppLayout.tsx line 18 is a mobile-only right-pane opener, not a "Discuss with Georgia" feature. | — | No "Georgia" FAB exists. The right-pane button says "Discuss with {personaName}" which is correct behavior. If "Georgia" was an agent name, the button does not reference agents — it uses the org persona. Issue may be based on a misidentification. |
| I-155 | Marketing Dashboard Zeros | OPEN (conditional) | marketing.tsx lines 86-93: Metrics pull from `metrics?.campaignStats?.byDepartment?.marketing` with fallbacks to global stats, then to `0`. The values come from the real `/api/metrics/dashboard` endpoint. If the marketing department has no campaigns with sent/replied data, all values will legitimately be 0. The code is NOT hardcoded to zero — it uses real API data with `?? 0` fallbacks. | Easy | Values are from real API. If they show zero, it means the backend returns zero for marketing campaign stats. Fix is either: (a) seed marketing campaign data with non-zero sent/replied counts, or (b) verify the metrics aggregation query includes marketing department data. **NEEDS LIVE TEST** to confirm whether API returns zeros or actual data. |

## Summary

| Status | Count |
|--------|-------|
| OPEN | 5 (I-126 partial, I-139, I-116, I-169 partial, I-130) |
| OPEN (conditional/needs clarification) | 2 (I-150, I-155) |
| CLOSED | 3 (I-127, I-136, I-152) |
| NEEDS LIVE TEST | 1 (I-138) |

## Key Findings

1. **I-127, I-136, I-152 are already fixed** in the current codebase.
2. **I-116 (User Chats)** is the heaviest lift — full feature build required.
3. **I-169 (Hunches)** has working API for 3 of 8 transitions. Scope decision needed: are all 8 states needed in UI?
4. **I-138** cannot be verified from code alone — no "Unauthorized Agent" in seed data. Likely a DB artifact.
5. **I-155** values are from real API, not hardcoded. The zeros likely reflect empty marketing campaign data in the database.
