# Section Audit: Marketing
**Sprint:** E-013
**Route:** /marketing
**Page Component:** client/src/pages/marketing.tsx (297 lines)
**Sub-menu:** SubMenuManager.tsx (marketing section)

## What Exists in Code

### Page Structure (marketing.tsx)
- **4 tabs:** Dashboard, Agents, Studio, Insights (line 40-45)
- **NO Campaigns tab** — matches manifest requirement S-5.AC1

### Dashboard Tab (lines 93-115)
- **4 metric tiles from /api/metrics/dashboard:**

| Tile | Data Source | Notes |
|---|---|---|
| Campaign Performance | campaignStats.byDepartment.marketing.replyRate (fallback: global replyRate) | Percentage |
| Campaigns Active | campaignStats.byDepartment.marketing.active (fallback: global active) | Count |
| Messages Sent | campaignStats.byDepartment.marketing.sent (fallback: global totalSent) | Count |
| Replies Received | campaignStats.byDepartment.marketing.replied (fallback: global totalReplied) | Count |

**FINDING: All change/trend data hardcoded to zero** — same issue as Service. `change: 0, trend: 'up'` on all 4 tiles.

**FINDING: Fallback to global stats** — if marketing-specific stats don't exist in the API response, it falls back to org-wide campaign stats. This could show misleading numbers if service campaigns dominate.

### Agents Tab (lines 116-180)
- **5 agents from client-side MARKETING_AGENTS constant** (marketing-agents.ts):
  1. Photo Studio — image generation/background swap via FAL
  2. Video Producer — photo-to-video, voiceover generation
  3. Copywriter — ad copy, marketing text
  4. Creative Director — quality scoring, brand consistency
  5. Market Intel — competitor analysis, market trends

- **Agent cards:** Gradient background, custom icon, name, description (line-clamp-2), session count, last used time
- **Click card → opens AgentChatView** (full chat interface with that specific marketing agent)
- **IMPORTANT:** These agents are defined CLIENT-SIDE in marketing-agents.ts, NOT from /api/agents. They use a different rendering pattern than Sales/Service agent cards. Each agent has its own tool definitions, gradient, glow color, and accent color.

### Studio Tab (lines 184-205)
- **7 filter categories:** All, Images, Videos, Copy, Scores, Voiceovers, Radar
- Filter pills use primary color when active (not light blue)
- Renders `<StudioGallery />` component below filters
- **Need to verify:** Does StudioGallery show real artifacts or is it empty/placeholder?

### Insights Tab (line 207-209)
- Just renders `<InsightsPage embedded />` — no additional marketing-specific metrics here
- Unlike Service which adds metric tiles above InsightsPage, Marketing renders InsightsPage alone

### Sub-menu Panel
- Nav items: Dashboard, **Campaigns** (links to `/marketing?tab=campaigns`), Studio, Insights
- **MISMATCH: Sub-menu has "Campaigns" but page has NO Campaigns tab** — the tab array (line 40-45) has Dashboard, Agents, Studio, Insights. No campaigns. The sub-menu link goes to `?tab=campaigns` which won't match any tab, so it would show nothing or default to Dashboard.
- AI Agents section below nav with 5 marketing agent links

## Manifest vs Code

| Manifest Item | Code Status | Gap? |
|---|---|---|
| Sub items: Dashboard, Campaigns, Studio, Insights | Page has Dashboard, **Agents** (not in manifest list), Studio, Insights. NO Campaigns in page tabs. | Manifest says Campaigns but they've been removed from page per S-5.AC1 |
| Agents: Photo, Video, Copywriter, Marketing Intel, Creative Director | YES — all 5 in MARKETING_AGENTS | No gap |
| Remove campaigns from popout and page | Page: YES removed. **Popout: NO — still has Campaigns link** | Gap — sub-menu still shows Campaigns |
| Studio should show filters for categories | YES — 7 filter pills present | No gap |
| All items created | Agents exist client-side. Need to verify they function. | Functional test needed |

## Findings

1. **Sub-menu still shows "Campaigns" link** — but page has no Campaigns tab. Link goes nowhere useful. Manifest says remove it.
2. **Marketing agents are client-side definitions, not from API** — different from Sales/Service which fetch from `/api/agents?department=X`. Marketing uses `MARKETING_AGENTS` constant with tool definitions baked in. This means DB agent records for marketing may not align with what the page shows.
3. **All marketing metric trends hardcoded to zero** — same issue as Service.
4. **Metrics fall back to global stats** — if no marketing-specific campaign data exists, tiles show org-wide numbers labeled as "marketing."
5. **StudioGallery content unverified** — need Playwright or code review to determine if gallery has real artifacts or is empty.
6. **AgentChatView for marketing agents** — when you click an agent, you get a full chat interface. Need to verify this actually works (especially Photo Studio which uses FAL proxy — TI-018/I-102).

## Existing ACs

| AC | Coverage |
|---|---|
| S-5.AC1 | No Campaigns tab on marketing page — PASS in code |
| S-5.AC2 | No campaign data fetching — need to verify (sub-menu still references it) |
| S-5.AC3 | Tabs: Dashboard, Agents, Studio, Insights — PASS in code |
| S-5.AC4 | Studio filter pills (7 categories) — PASS in code |
| S-5.AC5 | Studio filters work (clicking filters content) — functional test needed |
| S-5.AC6 | All 5 agent cards visible with descriptions — PASS in code (client-side MARKETING_AGENTS) |
| S-5.AC7 | Dashboard tiles match API values — need verification |
| S-5.AC8 | Photo Studio produces image via FAL — I-102 (known broken frontend) |
| S-5.AC9 | Copywriter produces ad copy — functional test needed |

## New ACs Needed

| Proposed AC | Priority | Dimension |
|---|---|---|
| Sub-menu "Campaigns" link removed (matches page which has no Campaigns tab) | T3 | FE |
| Marketing metrics show real change/trend data (not hardcoded zeros) | T2 | FE/BE |
| Marketing metrics show marketing-specific data, not org-wide fallback | T2 | FE/BE |
| StudioGallery shows real artifacts (not empty placeholder) | T2 | FE |
| Video Producer agent produces video artifact when chatted with | T2 | FE/BE |
| Creative Director agent provides quality scoring when asked | T2 | FE/BE |
| Market Intel agent provides competitor/market analysis | T2 | FE/BE |

## Section Description (DRAFT — for operator edit)

**Marketing is the creative department hub.** 4 tabs: Dashboard (4 campaign performance metric tiles), Agents (5 AI-powered creative tools — Photo Studio, Video Producer, Copywriter, Creative Director, Market Intel), Studio (media gallery with 7 category filter pills), and Insights (embedded analytics).

The marketing agents are defined client-side with custom tool definitions, gradients, and chat interfaces. Clicking an agent card opens AgentChatView — a full chat interface for interacting with that specific creative agent. Photo Studio uses the FAL proxy for image generation (currently broken on frontend — I-102).

**Issues found:** Sub-menu still shows "Campaigns" link despite campaigns being removed from the page (S-5.AC1). All marketing metric trends are hardcoded to zero. Metrics fall back to org-wide campaign stats when marketing-specific data is absent. StudioGallery content needs verification. Marketing agents use a different architecture than Sales/Service agents (client-side definitions vs API-fetched).
