# Marketing Domain Test Plan

**Sprint:** T-003
**Domain:** Marketing Department Dashboard (`/marketing`)
**Source files analyzed:**
- `client/src/pages/marketing.tsx`
- `client/src/lib/marketing-agents.ts`
- `client/src/lib/tool-executor.ts`
- `client/src/components/marketing/AgentChatView.tsx`
- `client/src/components/marketing/StudioGallery.tsx`
- `client/src/components/marketing/SharingPanel.tsx`
- `server/routes/campaigns.ts`
- `server/routes/metrics.ts`
- `client/src/lib/rbac.ts`
- `tests/e2e/domain-06-departments.spec.ts`
- `tests/e2e/domain-04-campaigns.spec.ts`

---

## 1. Element Inventory

### 1.1 Page Structure
- Page container (`data-testid="marketing-page"`)
- Page title: "Marketing"
- Tab bar with 4 tabs: Dashboard, Agents, Studio, Insights
  - `data-testid="tab-marketing-dashboard"`
  - `data-testid="tab-marketing-agents"`
  - `data-testid="tab-marketing-studio"`
  - `data-testid="tab-marketing-insights"`
- URL query param routing: `?tab=`, `?agent=`, `?session=`, `?artifactRef=`

### 1.2 Dashboard Tab
- Heading: "Marketing Dashboard"
- Subtext: "Campaign performance and lead generation metrics"
- 4 metric tiles in a responsive grid (1/2/4 columns):
  - Campaign Performance (`data-testid="metric-tile-mm-1"`) -- reply rate %
  - Campaigns Active (`data-testid="metric-tile-mm-2"`) -- active count
  - Messages Sent (`data-testid="metric-tile-mm-3"`) -- total sent
  - Replies Received (`data-testid="metric-tile-mm-4"`) -- total replied
- Metric detail dialog (`data-testid="dialog-metric-detail"`)
  - Title (`data-testid="text-metric-detail-title"`)
  - Value (`data-testid="text-metric-detail-value"`)
  - Department label: "Marketing"
  - Data Source label: "Dashboard Metrics API"

### 1.3 Agents Tab
- Heading: "Marketing Agents" (`data-testid="text-agents-title"`)
- Subtext: "AI-powered creative tools for your dealership"
- 5 agent cards in responsive grid (1/2/3 columns):
  1. Photo Studio (`data-testid="agent-card-photo-studio"`)
  2. Video Producer (`data-testid="agent-card-video-producer"`)
  3. Copywriter (`data-testid="agent-card-copywriter"`)
  4. Creative Director (`data-testid="agent-card-creative-director"`)
  5. Market Intel (`data-testid="agent-card-market-intel"`)
- Each card displays: icon, name, description, session count, last used time
- Each card has glow-on-hover effect via inline boxShadow
- Per-agent test IDs:
  - `data-testid="text-agent-name-{id}"`
  - `data-testid="text-agent-desc-{id}"`
  - `data-testid="text-agent-sessions-{id}"`
  - `data-testid="text-agent-last-used-{id}"`

### 1.4 Agent Chat View
- Appears when an agent card is clicked (replaces tab content)
- Back button to return to agent list
- Session management: new session creation, session switching
- Chat input with text area and send button
- File attachment support (Photo Studio, Video Producer, Creative Director)
- Suggestion chips per agent
- Streaming indicator during AI response
- Tool progress indicator
- Inline rendered results:
  - InlineAdCopy: expandable sections (Headlines, Body Copy, Social Captions, Email Subject Lines, Google Ads) with copy buttons
  - InlineScoreCard: animated score circle, 5 category bars (Visual Appeal, Subject Clarity, Lighting Quality, Text Legibility, Ad Effectiveness), publish-ready banner, recommendations
  - InlineCompetitorRadar: location header, competitor list with rank, name, star rating, reviews, address, distance
- Action chips for cross-agent workflows
- Artifact visor (side panel showing session artifacts)
- Copy button for text content (`data-testid="button-copy-text"`)

### 1.5 Studio Tab
- Filter pills for artifact categories (`data-testid="studio-filter-pills"`):
  - All, Images, Videos, Copy, Scores, Voiceovers, Radar
  - `data-testid="studio-filter-{category}"`
- StudioGallery component (`data-testid="studio-gallery"`)
  - Type filter pills: ALL, IMAGE, VIDEO, COPY, SCORE, VOICEOVER, RADAR (`data-testid="filter-pill-{type}"`)
  - Agent filter pills per agent (`data-testid="filter-pill-{agentId}"`)
  - Artifact cards in responsive grid (1/2/3/4 columns) (`data-testid="artifact-card-{index}"`)
    - Thumbnail/preview per type (image, video, score display, copy text excerpt, icon fallback)
    - Title, type badge, agent badge with color dot, time ago
    - Action buttons: Download, Resume (Play), Share, Send to Agent
    - Send picker dropdown (`data-testid="send-picker-{index}"`) with target agent list
  - Empty state (`data-testid="empty-state-studio"`) when no artifacts exist
- SharingPanel dialog (`data-testid="sharing-panel"`)
  - Shareable URL display (`data-testid="text-share-url"`)
  - Copy link button (`data-testid="btn-copy-link"`)
  - Download button (`data-testid="btn-share-download"`)
  - Social preview card (`data-testid="social-preview-card"`)

### 1.6 Insights Tab
- Embeds `InsightsPage` component with `embedded` prop
- Wave 2 placeholder for campaign ROI and lead attribution analytics

### 1.7 RBAC / Role-Based Visibility
Per `rbac.ts` `defaultSectionsByRole`:
- **Can access marketing:** super_admin, partner_admin, org_admin, executive, marketing
- **Cannot access marketing:** sales_manager, sales, service
- No route-level RBAC enforcement (sidebar-only gating via `canAccessSection()`)

---

## 2. API Endpoints

| Endpoint | Method | Auth | Role Gate | Purpose |
|---|---|---|---|---|
| `/api/metrics/dashboard` | GET | Token | Any authenticated | Dashboard metrics including campaign stats |
| `/api/campaigns` | GET | Token | Any authenticated | List campaigns (org-scoped) |
| `/api/campaigns` | POST | Token | roleLevel <= 3 | Create campaign |
| `/api/campaigns/:id` | GET | Token | Any (org-scoped) | Get single campaign |
| `/api/campaigns/:id` | PATCH | Token | roleLevel <= 3 | Update campaign |
| `/api/campaigns/:id/execute` | POST | Token | roleLevel <= 3 | Execute campaign |
| `/api/campaigns/:id/stop` | POST | Token | roleLevel <= 3 | Stop execution |
| `/api/campaigns/:id/execution-status` | GET | Token | Any (org-scoped) | Execution status |
| `/api/campaigns/execution-statuses` | GET | Token | Any (org-scoped) | All execution statuses |
| `/api/campaigns/:id/upload-csv` | POST | Token | roleLevel <= 3 | Upload recipients CSV |
| `/api/campaigns/:id/recipients` | GET | Token | Any (org-scoped) | List recipients |
| `/api/openai-proxy` | POST | Token | Any | Proxy to OpenAI for agent chat |
| `/api/fal-proxy` | POST | Token | Any | Proxy to fal.ai for image/video gen |

---

## 3. Existing Test Coverage

### domain-06-departments.spec.ts
| Test | Coverage | Notes |
|---|---|---|
| 6.3 Marketing page loads with KPIs | EXISTING | Logs in as marketing user, verifies URL, checks for metric tile/card elements |

### domain-04-campaigns.spec.ts
| Test | Coverage | Notes |
|---|---|---|
| 4.1 Campaign CRUD + execute | EXISTING | Create, get, update, execute lifecycle (API) |
| 4.2 CSV upload | EXISTING | Upload with vehicle fields, verify mapping |
| 4.3 SMS execution via MCP | EXISTING | Execute SMS campaign (API) |
| 4.4 Email execution via MCP | EXISTING | Execute email campaign (API) |
| 4.5 Kill switch blocks outbound | EXISTING | Toggle kill switch, verify execution blocked |
| 4.6 Channel-specific pause | EXISTING | Pause/resume campaign status |
| 4.7 Execution statuses org-scoped | EXISTING | Cross-org isolation (API) |
| 4.8 Campaign stop halts execution | EXISTING | Stop endpoint (API) |
| 4.9 Customer replies create TeamBox thread | EXISTING | Webhook -> conversation (API) |
| 4.10 Campaign reply triggers AI agent | EXISTING | Webhook -> agent response (API) |
| 4.11 Vehicle merge fields in template | EXISTING | Template substitution (API) |

---

## 4. Test Cases

### 4.1 Page Load and Navigation

| ID | Name | Priority | Steps | Expected Result | Coverage |
|---|---|---|---|---|---|
| TC-MKT-001 | Marketing page renders for marketing role | P0 | 1. Login as `marketing` user. 2. Navigate to `/marketing`. 3. Check for `data-testid="marketing-page"`. | Page container is visible, no error state. | EXISTING (6.3 partial) |
| TC-MKT-002 | Page title displays "Marketing" | P1 | 1. Login as `marketing`. 2. Navigate to `/marketing`. 3. Locate h1 with text "Marketing". | Title text is present. | **NEW** |
| TC-MKT-003 | Four tabs are visible (Dashboard, Agents, Studio, Insights) | P0 | 1. Login as `marketing`. 2. Navigate to `/marketing`. 3. Check for all 4 tab buttons by data-testid. | All four tabs render with correct labels and icons. | **NEW** |
| TC-MKT-004 | Dashboard tab is active by default | P1 | 1. Navigate to `/marketing`. 2. Check which tab has active styling (border-primary). | Dashboard tab is active, dashboard content visible. | **NEW** |
| TC-MKT-005 | Tab switching works for all tabs | P0 | 1. Navigate to `/marketing`. 2. Click each tab in sequence. 3. Verify content changes. | Each tab shows its corresponding content area. | **NEW** |
| TC-MKT-006 | URL query param `?tab=agents` opens Agents tab directly | P1 | 1. Navigate to `/marketing?tab=agents`. 2. Check active tab. | Agents tab is active on load. | **NEW** |
| TC-MKT-007 | URL query param `?tab=studio` opens Studio tab directly | P1 | 1. Navigate to `/marketing?tab=studio`. | Studio tab is active on load. | **NEW** |
| TC-MKT-008 | URL query param `?agent=photo-studio` opens agent chat view | P1 | 1. Navigate to `/marketing?tab=agents&agent=photo-studio`. | Agent chat view renders for Photo Studio. Tab bar is hidden. | **NEW** |

### 4.2 Dashboard Tab -- Metric Tiles

| ID | Name | Priority | Steps | Expected Result | Coverage |
|---|---|---|---|---|---|
| TC-MKT-010 | Four metric tiles render | P0 | 1. Navigate to `/marketing` (Dashboard tab). 2. Count elements matching `data-testid="metric-tile-mm-*"`. | Exactly 4 metric tiles visible. | EXISTING (6.3 checks card count > 0) |
| TC-MKT-011 | Campaign Performance tile shows reply rate | P1 | 1. On dashboard. 2. Read metric-tile-mm-1 value. | Displays a percentage value (e.g. "0%" or "12%"). | **NEW** |
| TC-MKT-012 | Campaigns Active tile shows count | P1 | 1. Read metric-tile-mm-2 value. | Displays a numeric value. | **NEW** |
| TC-MKT-013 | Messages Sent tile shows count | P1 | 1. Read metric-tile-mm-3 value. | Displays a numeric value. | **NEW** |
| TC-MKT-014 | Replies Received tile shows count | P1 | 1. Read metric-tile-mm-4 value. | Displays a numeric value. | **NEW** |
| TC-MKT-015 | Clicking a metric tile opens detail dialog | P0 | 1. Click on metric-tile-mm-1. 2. Check for `data-testid="dialog-metric-detail"`. | Dialog opens with metric label as title. | **NEW** |
| TC-MKT-016 | Metric detail dialog shows value | P1 | 1. Click metric-tile-mm-2. 2. Read `data-testid="text-metric-detail-value"`. | Shows the same value as the tile. | **NEW** |
| TC-MKT-017 | Metric detail dialog shows "Marketing" department | P1 | 1. Open any metric detail dialog. 2. Check for text "Marketing" in department row. | Department row displays "Marketing". | **NEW** |
| TC-MKT-018 | Metric detail dialog closes on overlay click | P1 | 1. Open dialog. 2. Click overlay/close. | Dialog closes, no dialog in DOM. | **NEW** |
| TC-MKT-019 | Metric tiles source data from /api/metrics/dashboard | P0 | 1. Intercept network request to `/api/metrics/dashboard`. 2. Load dashboard. | Request is made with auth header; response 200. | **NEW** |

### 4.3 Agents Tab -- Agent Cards

| ID | Name | Priority | Steps | Expected Result | Coverage |
|---|---|---|---|---|---|
| TC-MKT-020 | Five agent cards render on Agents tab | P0 | 1. Switch to Agents tab. 2. Count `data-testid="agent-card-*"` elements. | Exactly 5 cards: photo-studio, video-producer, copywriter, creative-director, market-intel. | **NEW** |
| TC-MKT-021 | Photo Studio card displays correct name and description | P1 | 1. On Agents tab. 2. Read `data-testid="text-agent-name-photo-studio"`. 3. Read `data-testid="text-agent-desc-photo-studio"`. | Name: "Photo Studio". Description contains "vehicle photos". | **NEW** |
| TC-MKT-022 | Video Producer card displays correct name and description | P1 | 1. Read `text-agent-name-video-producer` and desc. | Name: "Video Producer". Description contains "cinematic marketing videos". | **NEW** |
| TC-MKT-023 | Copywriter card displays correct name and description | P1 | 1. Read `text-agent-name-copywriter` and desc. | Name: "Copywriter". Description contains "ads and captions". | **NEW** |
| TC-MKT-024 | Creative Director card displays correct name and description | P1 | 1. Read `text-agent-name-creative-director` and desc. | Name: "Creative Director". Description contains "Ad IQ scoring". | **NEW** |
| TC-MKT-025 | Market Intel card displays correct name and description | P1 | 1. Read `text-agent-name-market-intel` and desc. | Name: "Market Intel". Description contains "Competitor radar". | **NEW** |
| TC-MKT-026 | Agent card shows session count | P1 | 1. Read `data-testid="text-agent-sessions-photo-studio"`. | Displays "N session(s)" text. | **NEW** |
| TC-MKT-027 | Agent card hover applies glow shadow | P2 | 1. Hover over Photo Studio card. 2. Check computed boxShadow. | Box shadow contains the agent's glow color (rgba). | **NEW** |
| TC-MKT-028 | Clicking agent card opens AgentChatView | P0 | 1. Click on `agent-card-photo-studio`. 2. Check that tab bar disappears and chat view appears. | Tab bar hidden. Back button visible. Agent name in header. | **NEW** |
| TC-MKT-029 | AgentChatView back button returns to Agents tab | P0 | 1. Open agent chat view. 2. Click back button. | Returns to agents tab with all 5 cards. | **NEW** |

### 4.4 Agent Chat View -- Interaction

| ID | Name | Priority | Steps | Expected Result | Coverage |
|---|---|---|---|---|---|
| TC-MKT-030 | New session created when no prior sessions exist | P1 | 1. Open an agent with no prior sessions. 2. Verify session is created (empty chat). | Empty chat view with suggestion chips visible. | **NEW** |
| TC-MKT-031 | Suggestion chips render for Photo Studio | P1 | 1. Open Photo Studio chat. 2. Count suggestion chip elements. | 4 suggestion chips matching Photo Studio config. | **NEW** |
| TC-MKT-032 | Suggestion chips render for Copywriter | P1 | 1. Open Copywriter chat. | 4 suggestion chips matching Copywriter config. | **NEW** |
| TC-MKT-033 | Chat input accepts text | P0 | 1. Open agent chat. 2. Type text in textarea. | Text appears in input. | **NEW** |
| TC-MKT-034 | Send button submits message | P0 | 1. Type "Hello" in chat. 2. Click send. 3. Observe message list. | User message "Hello" appears in chat. Streaming indicator shows. | **NEW** |
| TC-MKT-035 | File attachment button available for Photo Studio | P1 | 1. Open Photo Studio. 2. Check for file attachment button. | Attachment button visible (agent supports attachments). | **NEW** |
| TC-MKT-036 | File attachment button NOT available for Copywriter | P1 | 1. Open Copywriter. 2. Check for file attachment button. | No attachment button (supportsAttachments=false). | **NEW** |
| TC-MKT-037 | File attachment button NOT available for Market Intel | P1 | 1. Open Market Intel. 2. Check for file attachment button. | No attachment button (supportsAttachments=false). | **NEW** |
| TC-MKT-038 | Chat proxies to OpenAI via /api/openai-proxy | P0 | 1. Intercept `/api/openai-proxy` requests. 2. Send message in agent chat. | POST to `/api/openai-proxy` with model, messages array, and tools. | **NEW** |
| TC-MKT-039 | Tool call triggers tool execution and result display | P1 | 1. In Copywriter chat, request ad copy. 2. Observe tool call status message. 3. Observe tool result. | Status message "Using generate ad copy..." followed by result with InlineAdCopy. | **NEW** |
| TC-MKT-040 | Token refresh retry on 401 | P2 | 1. Mock `/api/openai-proxy` to return 401 first time. 2. Send message. | Retries with refreshed token. Second request succeeds. | **NEW** |
| TC-MKT-041 | Error handling on API failure | P1 | 1. Mock `/api/openai-proxy` to return 500. 2. Send message. | Error message displayed: "Sorry, I encountered an error..." | **NEW** |
| TC-MKT-042 | Session persists messages across navigation | P1 | 1. Send message in Photo Studio. 2. Navigate back. 3. Re-open Photo Studio. | Previous messages still visible in session. | **NEW** |

### 4.5 Agent Chat View -- Inline Rendered Results

| ID | Name | Priority | Steps | Expected Result | Coverage |
|---|---|---|---|---|---|
| TC-MKT-050 | InlineAdCopy renders expandable sections | P1 | 1. Trigger Copywriter tool. 2. Check for `data-testid="inline-ad-copy"`. 3. Click toggle for "Headlines". | Sections render. Clicking toggle expands content with copy variations. | **NEW** |
| TC-MKT-051 | InlineAdCopy copy button works | P1 | 1. Expand a copy section. 2. Click `data-testid="button-copy-text"`. | Button shows "Copied" state. Clipboard contains text. | **NEW** |
| TC-MKT-052 | InlineScoreCard renders with animated score | P1 | 1. Trigger Creative Director scoring tool. 2. Check `data-testid="inline-score-card"`. | Score circle animates, 5 category bars display, publish-ready banner shows. | **NEW** |
| TC-MKT-053 | InlineScoreCard shows correct publish-ready state | P1 | 1. Score >= 75: check for "PUBLISH READY" green banner. 2. Score 50-74: "NEEDS WORK" amber. 3. Score < 50: "NOT READY" red. | Banner text and color match score threshold. | **NEW** |
| TC-MKT-054 | InlineScoreCard shows recommendations | P2 | 1. Check `data-testid="recommendation-*"` elements. | Recommendations list rendered if present in data. | **NEW** |
| TC-MKT-055 | InlineCompetitorRadar renders competitor list | P1 | 1. Trigger Market Intel radar tool. 2. Check `data-testid="inline-competitor-radar"`. | Competitor list with rank, name, star rating, distance. | **NEW** |
| TC-MKT-056 | InlineCompetitorRadar shows star ratings | P2 | 1. Check star SVGs per competitor. | Star rating reflects the numeric rating value. | **NEW** |
| TC-MKT-057 | Inline media renders for image results | P1 | 1. Trigger Photo Studio image generation. 2. Check for img element in chat. | Generated image displays inline with URL. | **NEW** |
| TC-MKT-058 | Inline media renders for video results | P1 | 1. Trigger Video Producer video creation. 2. Check for video/img element. | Video thumbnail or player displays inline. | **NEW** |
| TC-MKT-059 | Action chips render after tool results | P2 | 1. After tool result, check for action chip elements. | Action chips with labels and icons appear below result. | **NEW** |

### 4.6 Studio Tab -- Gallery

| ID | Name | Priority | Steps | Expected Result | Coverage |
|---|---|---|---|---|---|
| TC-MKT-060 | Studio gallery shows empty state when no artifacts | P0 | 1. Clear localStorage. 2. Switch to Studio tab. 3. Check `data-testid="empty-state-studio"`. | Empty state with "No artifacts yet" message and Palette icon. | **NEW** |
| TC-MKT-061 | Studio gallery renders artifact cards when artifacts exist | P1 | 1. Generate an artifact via agent. 2. Switch to Studio tab. 3. Count `data-testid="artifact-card-*"`. | At least 1 artifact card visible. | **NEW** |
| TC-MKT-062 | Type filter pills render (7 options) | P0 | 1. On Studio tab. 2. Count filter pill buttons. | 7 type filters: ALL, IMAGE, VIDEO, COPY, SCORE, VOICEOVER, RADAR. | **NEW** |
| TC-MKT-063 | Agent filter pills render (5 agents) | P0 | 1. Count agent filter buttons. | 5 agent filters: Photo Studio, Video Producer, Copywriter, Creative Director, Market Intel. | **NEW** |
| TC-MKT-064 | Type filter "Images" shows only IMAGE artifacts | P1 | 1. Click `filter-pill-image`. 2. Check displayed artifact types. | Only IMAGE type artifacts shown. | **NEW** |
| TC-MKT-065 | Agent filter shows only that agent's artifacts | P1 | 1. Click `filter-pill-photo-studio`. 2. Check displayed artifacts. | Only Photo Studio artifacts shown. | **NEW** |
| TC-MKT-066 | Type filter toggle resets to ALL | P1 | 1. Click IMAGE filter. 2. Click ALL filter. | All artifact types visible again. | **NEW** |
| TC-MKT-067 | Agent filter toggle deselects | P1 | 1. Click Photo Studio agent filter (active). 2. Click same filter again. | All agents' artifacts visible again. | **NEW** |
| TC-MKT-068 | Download button triggers download | P1 | 1. Click `data-testid="btn-download-{index}"` on artifact with URL. | Download initiated (link.click triggered). | **NEW** |
| TC-MKT-069 | Resume button navigates to agent session | P1 | 1. Click `data-testid="btn-resume-{index}"`. | URL changes to `/marketing?tab=agents&agent={agentId}&session={sessionId}`. | **NEW** |
| TC-MKT-070 | Share button opens SharingPanel | P0 | 1. Click `data-testid="btn-share-{index}"`. 2. Check `data-testid="sharing-panel"`. | Sharing dialog opens with artifact details. | **NEW** |
| TC-MKT-071 | Send-to-agent picker opens on click | P1 | 1. Click `data-testid="btn-send-{index}"`. 2. Check `data-testid="send-picker-{index}"`. | Dropdown shows other agents (excluding the artifact's source agent). | **NEW** |
| TC-MKT-072 | Send-to-agent navigates to new session with artifactRef | P1 | 1. Open send picker. 2. Click a target agent. | URL changes to `/marketing?tab=agents&agent={targetId}&session=new&artifactRef={artifactId}`. | **NEW** |
| TC-MKT-073 | Artifact card displays thumbnail for IMAGE type | P2 | 1. Check IMAGE artifact card preview area. | img element with src matching thumbnailUrl. | **NEW** |
| TC-MKT-074 | Artifact card displays score value for SCORE type | P2 | 1. Check SCORE artifact card preview. | Score number with color-coded text. | **NEW** |
| TC-MKT-075 | Artifact card displays copy excerpt for COPY type | P2 | 1. Check COPY artifact card preview. | Truncated text from artifact data. | **NEW** |

### 4.7 Sharing Panel

| ID | Name | Priority | Steps | Expected Result | Coverage |
|---|---|---|---|---|---|
| TC-MKT-080 | SharingPanel shows shareable URL | P1 | 1. Open sharing panel. 2. Read `data-testid="text-share-url"`. | URL matches pattern `{origin}/shared/artifact/{id}`. | **NEW** |
| TC-MKT-081 | Copy link button copies to clipboard | P1 | 1. Click `data-testid="btn-copy-link"`. | Button shows "Copied" state. Toast notification appears. | **NEW** |
| TC-MKT-082 | Download button available for downloadable artifacts | P1 | 1. Open sharing panel for IMAGE artifact. 2. Check `data-testid="btn-share-download"`. | Download button visible and functional. | **NEW** |
| TC-MKT-083 | Download button hidden for non-downloadable artifacts | P2 | 1. Open sharing panel for artifact without URL. | No download button. | **NEW** |
| TC-MKT-084 | Social preview card renders | P2 | 1. Open sharing panel. 2. Check `data-testid="social-preview-card"`. | Preview card with title, agent name, "Created with Nexxus Connect" text. | **NEW** |
| TC-MKT-085 | Sharing panel closes on dialog dismiss | P1 | 1. Open sharing panel. 2. Close dialog. | Panel removed from DOM. | **NEW** |

### 4.8 Insights Tab

| ID | Name | Priority | Steps | Expected Result | Coverage |
|---|---|---|---|---|---|
| TC-MKT-090 | Insights tab renders embedded InsightsPage | P1 | 1. Switch to Insights tab. 2. Check for insights content. | InsightsPage component renders with embedded=true. | **NEW** |

### 4.9 Role-Based Access Control

| ID | Name | Priority | Steps | Expected Result | Coverage |
|---|---|---|---|---|---|
| TC-MKT-100 | marketing role can access /marketing | P0 | 1. Login as `marketing_staff@huminic.ai`. 2. Navigate to `/marketing`. | Page loads successfully with marketing-page container. | EXISTING (6.3) |
| TC-MKT-101 | super_admin can access /marketing | P0 | 1. Login as `superAdmin`. 2. Navigate to `/marketing`. | Page loads successfully. | **NEW** |
| TC-MKT-102 | org_admin can access /marketing | P0 | 1. Login as `orgAdmin`. 2. Navigate to `/marketing`. | Page loads successfully. | **NEW** |
| TC-MKT-103 | partner_admin can access /marketing | P1 | 1. Login as `partnerAdmin`. 2. Navigate to `/marketing`. | Page loads successfully. | **NEW** |
| TC-MKT-104 | executive can access /marketing | P1 | 1. Login as `executive`. 2. Navigate to `/marketing`. | Page loads successfully. | **NEW** |
| TC-MKT-105 | sales role sidebar does NOT show Marketing link | P0 | 1. Login as `sales`. 2. Check sidebar for Marketing item. | No Marketing nav item visible. | **NEW** |
| TC-MKT-106 | service role sidebar does NOT show Marketing link | P0 | 1. Login as `service`. 2. Check sidebar for Marketing item. | No Marketing nav item visible. | **NEW** |
| TC-MKT-107 | sales_manager sidebar does NOT show Marketing link | P1 | 1. Login as sales_manager (if test user exists). 2. Check sidebar. | No Marketing nav item visible. | **NEW** |
| TC-MKT-108 | Direct URL /marketing by sales role (no route guard) | P1 | 1. Login as `sales`. 2. Navigate directly to `/marketing`. | Page loads (known gap: no route-level RBAC -- document behavior). | **NEW** |

### 4.10 Marketing Campaigns (API -- already partially covered)

| ID | Name | Priority | Steps | Expected Result | Coverage |
|---|---|---|---|---|---|
| TC-MKT-110 | List campaigns filtered by marketing department | P1 | 1. GET `/api/campaigns?department=marketing`. | Returns only marketing department campaigns. | **NEW** |
| TC-MKT-111 | Create campaign with marketing department | P1 | 1. POST `/api/campaigns` with `department: "marketing"`. | Campaign created with department=marketing. | EXISTING (4.1 covers general CRUD) |
| TC-MKT-112 | Marketing metrics include department breakdown | P1 | 1. GET `/api/metrics/dashboard`. 2. Check `campaignStats.byDepartment.marketing`. | Marketing department stats present with total, active, sent, replied, replyRate. | **NEW** |
| TC-MKT-113 | Campaign creation requires entitlement check | P1 | 1. POST `/api/campaigns` when at slot limit. | Returns 403 with entitlement error. | **NEW** |

### 4.11 Cross-Agent Workflow

| ID | Name | Priority | Steps | Expected Result | Coverage |
|---|---|---|---|---|---|
| TC-MKT-120 | Artifact sent from Studio to Photo Studio creates new session with context | P1 | 1. Generate an artifact. 2. From Studio, send to Photo Studio. 3. Verify chat opens with artifact context message. | New session created. Context message: "I received an artifact from another agent: **{title}**" | **NEW** |
| TC-MKT-121 | Artifact reference passes inline media for IMAGE type | P2 | 1. Send IMAGE artifact to Video Producer. 2. Check context message. | Inline media renders the image in the new session. | **NEW** |
| TC-MKT-122 | Send picker excludes the source agent | P1 | 1. Open send picker for a Photo Studio artifact. 2. Check agent list. | Photo Studio not in the list. 4 other agents available. | **NEW** |

### 4.12 Data Persistence (localStorage)

| ID | Name | Priority | Steps | Expected Result | Coverage |
|---|---|---|---|---|---|
| TC-MKT-130 | Sessions persist in localStorage scoped to user | P1 | 1. Login as user A. Create session. 2. Login as user B. Check sessions. | User B does not see User A's sessions. | **NEW** |
| TC-MKT-131 | Artifacts persist in localStorage with 50 item cap | P2 | 1. Generate > 50 artifacts. 2. Check stored count. | Only most recent 50 artifacts retained. | **NEW** |
| TC-MKT-132 | Sessions capped at 30 | P2 | 1. Create > 30 sessions. 2. Check stored count. | Only most recent 30 sessions retained. | **NEW** |
| TC-MKT-133 | localStorage quota exceeded gracefully handled | P2 | 1. Fill localStorage near quota. 2. Try saving artifact. | Falls back to smaller set, logs warning. No crash. | **NEW** |

---

## 5. Coverage Summary

| Category | EXISTING | NEW | Total |
|---|---|---|---|
| Page Load / Navigation | 1 | 7 | 8 |
| Dashboard Metrics | 1 (partial) | 9 | 10 |
| Agent Cards | 0 | 10 | 10 |
| Agent Chat Interaction | 0 | 13 | 13 |
| Inline Rendered Results | 0 | 10 | 10 |
| Studio Gallery | 0 | 16 | 16 |
| Sharing Panel | 0 | 6 | 6 |
| Insights Tab | 0 | 1 | 1 |
| RBAC | 1 | 8 | 9 |
| Campaigns API | 6 (partial) | 4 | 10 |
| Cross-Agent Workflow | 0 | 3 | 3 |
| Data Persistence | 0 | 4 | 4 |
| **TOTAL** | **9** | **91** | **100** |

---

## 6. Known Issues and Risks

1. **I-102:** Photo Studio agent has a known FE/FAL integration issue -- image generation requests may fail on the frontend. Tests for Photo Studio tool execution should account for this.
2. **No route-level RBAC:** Direct URL navigation to `/marketing` is not blocked for unauthorized roles. Sidebar gating only. TC-MKT-108 documents this gap.
3. **localStorage dependency:** All sessions and artifacts are stored in localStorage, not server-side. Tests must seed localStorage or generate artifacts via agent chat to test gallery functionality.
4. **External API dependencies:** Agent chat requires OpenAI proxy; image/video generation requires fal.ai proxy. Tests should mock these endpoints or accept graceful failures.
5. **I-113:** Metric tiles do not show change/trend data -- backend has no historical comparison for marketing metrics. Tiles show value only.

---

## 7. Test Users

| Key | Email | Role | Use For |
|---|---|---|---|
| marketing | marketing_staff@huminic.ai | marketing | Primary marketing tests |
| superAdmin | duane.wells@huminic.ai | super_admin | Cross-role access, admin features |
| orgAdmin | serra_honda@huminic.ai | org_admin | Campaign CRUD, org-scoped tests |
| partnerAdmin | duanekwells@gmail.com | partner_admin | RBAC verification |
| executive | executive_staff@huminic.ai | executive | RBAC verification |
| sales | sales_staff@huminic.ai | sales | Negative RBAC (should NOT access) |
| service | service_staff@huminic.ai | service | Negative RBAC (should NOT access) |
