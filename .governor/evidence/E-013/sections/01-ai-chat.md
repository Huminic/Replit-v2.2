# Section Audit: AI Chat (Home)
**Sprint:** E-013
**Route:** /
**Page Component:** client/src/pages/main.tsx (920 lines)
**Sub-menu:** SubMenuManager.tsx (ai-chat section, lines 384-470)

## What Exists in Code

### Page Structure (main.tsx)
- **Top:** 4 pipeline metric tiles (Active Pipeline, Appointments Today, Open Escalations, Outbound Sent 24h) — collapse after first message
- **Center:** Chat thread — bot messages left-aligned (bg-card), user messages right-aligned (bg-primary), no avatars
- **Bottom:** Suggestion chips + gradient-bordered chat input with file upload dropdown
- **Metric drill-down:** Click any tile → dialog with breakdown data
- **Chat engine:** useStreamingChat hook → POST /api/chat/:conversationId/stream (Claude API with SSE)
- **Thinking animation:** 3-dot wave animation during processing
- **Markdown rendering:** MarkdownMessage component for bot responses

### Sub-menu Panel (SubMenuManager.tsx, ai-chat section)
- **Favorites section:** Lists favorited items with remove button (X icon, removeFavorite function)
- **Chat History section:** Lists ai-chat conversations from /api/conversations?channel=ai-chat
  - Each conversation shows: name (truncated), timestamp, last message preview
  - Context menu (three-dot): Resume, Delete
  - Delete calls DELETE /api/conversations/:id
  - Wrapped in ScrollArea component
  - Click navigates back to / (home)

### What's NOT in main.tsx
- No tabs within the page (Chat, Favorites, Chat History are all in the sub-menu panel, not page tabs)
- No link testing mechanism
- No conversation quality validation

## Manifest Requirements vs Code

| Manifest Item | Code Status | Notes |
|---|---|---|
| Sub items: Chat, Favorites, Chat History | IN SUB-MENU — not page tabs. Chat is the page itself. Favorites and History are in the flyout panel. | Correct architecture per existing design |
| Chat needs high conversation quality | Chat uses Claude API streaming (useStreamingChat). Quality depends on system prompt and model config. | No quality test exists |
| Tests need written to test chat quality | No quality-focused tests exist. S-1.AC4 tests streaming timing, S-1.AC9 tests multi-turn, S-1.AC10 tests tone. But no test for response accuracy or helpfulness. | Gap |
| Links need tested | No link test exists. Unclear what links — markdown links in responses? Metric tile click-throughs? | Needs clarification |
| Chat has not been tested well enough | s1-ai-chat.spec.ts exists with 12 ACs but several may have weak assertions | Need to verify test quality |
| Favorites feature needs tested | Favorites exist in sub-menu. removeFavorite function exists. No dedicated test for add/remove/persist cycle. S-1.AC12 covers this but need to verify assertion quality. | Partially covered |
| Chat history: scroll when list exceeds screen | ScrollArea component wraps the history list. Should handle overflow. | Needs visual verification via Playwright |
| Chat history: ability to delete | DELETE endpoint exists. UI has delete button in context menu. deleteConversationMutation handles it. | Needs functional test |

## Existing ACs (from acceptance_criteria.md)

| AC | What It Tests | Coverage Quality |
|---|---|---|
| S-1.AC1 | Page loads for all 7 roles without console errors | Good — role-based page load |
| S-1.AC2 | Metric tiles render with numeric values | Good — verifies real data |
| S-1.AC3 | Chat input visible and responsive | Basic |
| S-1.AC4 | Streaming tokens within 8s | Good — timing test |
| S-1.AC5 | Thinking indicators during processing | Visual |
| S-1.AC6 | VIN data query returns real data | Good — functional |
| S-1.AC7 | Web search returns results | Good — functional |
| S-1.AC8 | Task creation via chat | Good — end-to-end |
| S-1.AC9 | Multi-turn conversation context | Good — context test |
| S-1.AC10 | Conversational tone | Good — quality check |
| S-1.AC11 | Chat History lists previous conversations | Basic — verifies list exists |
| S-1.AC12 | Favorites add/remove/persist | Good — full cycle |

## New ACs Needed

| Proposed AC | Priority | Dimension |
|---|---|---|
| Chat history delete: click delete → conversation removed from list and API | T2 | FE/BE |
| Chat history scroll: list with 20+ items scrolls without breaking layout | T3 | FE |
| Chat response quality: ask specific dealership question, verify response uses org context | T2 | BE |
| Metric tile drill-down: click tile → dialog shows breakdown matching API data | T2 | FE/BE |
| File upload: plus button opens file picker, file uploads, chat analyzes the upload content | T2 | FE/BE |
| Thinking cards: show reasoning/tool-use steps during AI processing (if SSE status events support it) | T3 | FE |
| Like/dislike on chat responses: thumbs up/down buttons on bot messages, feedback recorded | T2 | FE/BE |

## Operator Notes
- File upload via plus button needs tested — must verify upload completes AND chat analyzes the content
- Thinking cards would be good if supported (BL-024 notes SSE status events exist but frontend shows icon not cards)
- Like/dislike feedback buttons needed on chat responses — may be new feature if not built

## Section Description (DRAFT — for operator edit)

**AI Chat is the home page of Nexxus Connect.** When a user logs in, they land here. The page shows 4 pipeline metric tiles at the top (Active Pipeline, Appointments Today, Open Escalations, Outbound Sent 24h) that collapse once the user starts chatting. The main area is a streaming AI chat powered by Claude that knows the user's dealership context — it can query VIN data, search the web, create tasks, and have multi-turn conversations. The chat uses a gradient-bordered input with file upload capability and shows a 3-dot thinking animation while the AI processes.

In the sidebar flyout panel, there are two sections: **Favorites** (bookmarked items with one-click remove) and **Chat History** (previous AI conversations with resume and delete options via a context menu). Chat history is scoped to the current org and uses a ScrollArea for overflow.

The page has no internal tabs — Chat is the page itself, Favorites and History live in the sidebar flyout.

**What needs testing:** Chat conversation quality (does the AI give relevant, org-specific answers), chat history delete flow, metric tile drill-down accuracy, and favorites persistence across sessions. The existing 12 ACs cover the basics but don't stress the chat quality or the history management features.
